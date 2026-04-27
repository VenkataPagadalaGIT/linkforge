"use client";
import * as React from "react";
import axios from "axios";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  ExternalLink,
  Linkedin,
  Sparkles,
  Mic,
  Coffee,
  Utensils,
  PartyPopper,
  Hash,
  Notebook as NotebookIcon,
  CheckCircle2,
  Circle,
  RotateCw,
  Clock,
  Save,
  Lock,
  Globe2,
  LayoutList,
  LayoutGrid,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import SEO from "@/components/SEO";
import HoloPhoto from "@/components/HoloPhoto";
import TakeNotesPill from "@/components/TakeNotesPill";
import NoteContent from "@/components/NoteContent";
import { type Conference, type Session, type SessionType, getSessionId, getSessionUrlSlug } from "@/data/conferences";
import { getSpeakerByName } from "@/data/speakers";
import { adminApi, getToken } from "@/lib/admin-client";
import { BACKEND_URL } from "@/lib/site";

const statusStyles: Record<string, string> = {
  attended: "border-foreground/20 text-foreground/70",
  upcoming: "border-emerald-400/40 text-emerald-300/90",
  speaking: "border-amber-400/40 text-amber-300/90",
  watching: "border-sky-400/40 text-sky-300/90",
};

const statusLabel: Record<string, string> = {
  attended: "Attended",
  upcoming: "Upcoming",
  speaking: "Speaking",
  watching: "Watching",
};

const sessionTypeColor: Record<SessionType, string> = {
  keynote: "border-amber-400/40 text-amber-300/90",
  talk: "border-foreground/30 text-foreground/80",
  panel: "border-fuchsia-400/40 text-fuchsia-300/90",
  break: "border-border text-muted-foreground/60",
  meal: "border-border text-muted-foreground/60",
  social: "border-emerald-400/40 text-emerald-300/90",
  registration: "border-border text-muted-foreground/50",
};

const sessionIcon: Record<SessionType, React.ComponentType<{ size?: number; className?: string }>> = {
  keynote: Sparkles,
  talk: Mic,
  panel: Mic,
  break: Coffee,
  meal: Utensils,
  social: PartyPopper,
  registration: Hash,
};

type NoteStatus = "" | "attended" | "skipped" | "revisit";

interface NoteRecord {
  conference_slug: string;
  session_id: string;
  note: string;
  takeaways: string[];
  status: string;
  is_public: boolean;
  updated_at: string;
}

// Internal session_id for note storage (long form, backward compat with existing notes)
const sessionKey = (dayDate: string, s: Session) => getSessionId(dayDate, s);

// ===== Speaker integration helpers =====
interface SpeakerRef {
  name: string;
  affiliation?: string;
  speakerUrl?: string;
  // first session anchor for this speaker
  anchor: string;
  sessionTitle: string;
  dayLabel: string;
  start: string;
  type: SessionType;
}

const buildSpeakers = (c: Conference): SpeakerRef[] => {
  const seen = new Map<string, SpeakerRef>();
  c.days.forEach((d) => {
    d.sessions.forEach((s) => {
      if (!s.speaker) return;
      if (seen.has(s.speaker)) return;
      seen.set(s.speaker, {
        name: s.speaker,
        affiliation: s.affiliation,
        speakerUrl: s.speakerUrl,
        anchor: sessionKey(d.date, s),
        sessionTitle: s.title,
        dayLabel: d.theme || d.date,
        start: s.start,
        type: s.type,
      });
    });
  });
  return Array.from(seen.values());
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

// ===== Main component =====
const ConferenceDetail = ({ conference }: { conference: Conference }) => {
  const c = conference;
  const speakers = React.useMemo(() => buildSpeakers(c), [c]);
  const totalSessions = c.days.reduce((n, d) => n + d.sessions.length, 0);
  const [activeDay, setActiveDay] = React.useState(0);
  const [agendaView, setAgendaView] = React.useState<"timeline" | "grid">("timeline");

  // Auth-gated notes — listens to the global TakeNotesPill auth state
  const [authed, setAuthed] = React.useState(false);
  const authChecked = true;
  const [notesById, setNotesById] = React.useState<Record<string, NoteRecord>>({});

  const loadNotes = React.useCallback(async () => {
    // Always load published notes (public)
    let merged: Record<string, NoteRecord> = {};
    try {
      const { data } = await axios.get<NoteRecord[]>(
        `${BACKEND_URL}/api/notebook/notes/public/${c.slug}`,
      );
      data.forEach((n) => (merged[n.session_id] = n));
    } catch (err) {
      console.warn(`[ConferenceDetail] Public notes fetch failed for ${c.slug}:`, err);
    }

    // If logged in, also load all notes (private + public)
    if (getToken()) {
      try {
        await adminApi.get("/auth/me");
        const { data } = await adminApi.get<NoteRecord[]>(`/notebook/notes/${c.slug}`);
        data.forEach((n) => (merged[n.session_id] = n));
        setAuthed(true);
      } catch {
        setAuthed(false);
      }
    } else {
      setAuthed(false);
    }
    setNotesById(merged);
  }, [c.slug]);

  React.useEffect(() => {
    loadNotes();
    const onAuth = () => loadNotes();
    window.addEventListener("notebook-auth-changed", onAuth);
    return () => window.removeEventListener("notebook-auth-changed", onAuth);
  }, [loadNotes]);

  const updateLocalNote = (sessionId: string, patch: Partial<NoteRecord>) => {
    setNotesById((prev) => ({
      ...prev,
      [sessionId]: {
        conference_slug: c.slug,
        session_id: sessionId,
        note: "",
        takeaways: [],
        status: "",
        is_public: false,
        updated_at: new Date().toISOString(),
        ...prev[sessionId],
        ...patch,
      },
    }));
  };

  const tocSections = React.useMemo(() => {
    const base = [
      { label: "Overview", id: "overview" },
      { label: "Agenda", id: "agenda" },
      { label: "Speakers", id: "speakers" },
    ];
    return base;
  }, []);

  // JSON-LD
  const jsonLd = React.useMemo(() => {
    const subEvents = c.days.flatMap((d) =>
      d.sessions
        .filter((s) => s.type === "keynote" || s.type === "talk" || s.type === "panel")
        .map((s) => ({
          "@type": "Event",
          name: s.title,
          startDate: d.date,
          location: c.venues[0]?.name || c.city,
          description: s.description || s.title,
          performer: s.speaker
            ? {
                "@type": "Person",
                name: s.speaker,
                affiliation: s.affiliation,
                url: s.speakerUrl,
              }
            : undefined,
        })),
    );
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${c.name} ${c.edition || c.year}`,
      startDate: c.startDate,
      endDate: c.endDate,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      description: c.summary,
      url: c.url,
      organizer: c.organizer ? { "@type": "Organization", name: c.organizer } : undefined,
      location: {
        "@type": "Place",
        name: c.venues[0]?.name || c.city,
        address: c.venues[0]?.address || c.city,
      },
      subEvent: subEvents,
    };
  }, [c]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20" data-testid="conference-detail">
      <TakeNotesPill />
      <SEO
        title={`${c.name} ${c.edition || c.year} · Conference Notebook | Venkata Pagadala`}
        description={c.summary}
        canonical={`https://venkatapagadala.com/notebook/conference/${c.slug}`}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <Link
              to="/notebook/conference"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
              data-testid="conference-detail-back"
            >
              <ArrowLeft size={12} /> Back to Conference Notebook
            </Link>

            {/* Hero */}
            <section id="overview" className="scroll-mt-28 mb-14">
              <div className="flex items-center gap-3 mb-4">
                <Mic size={18} className="text-muted-foreground/50" />
                <p className="font-mono text-[11px] text-muted-foreground/50 uppercase tracking-[0.3em]">
                  {c.organizer || "Conference"} · Live Notebook
                </p>
              </div>
              <h1
                className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4 text-glow"
                data-testid="conference-detail-title"
              >
                {c.name} {c.edition || c.year}
              </h1>

              <div className="flex items-center gap-4 flex-wrap text-muted-foreground/80 font-mono text-xs mb-5">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} /> {c.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} /> {c.city}
                </span>
                <span
                  className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 ${statusStyles[c.status]}`}
                >
                  {statusLabel[c.status]}
                </span>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    Official site <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-6">
                {c.summary}
              </p>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Days", value: c.days.length },
                  { label: "Sessions", value: totalSessions },
                  { label: "Speakers", value: speakers.length },
                  { label: "Hours", value: c.hoursOfTalks ?? "—" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="border border-border px-4 py-5"
                    data-testid={`conference-detail-stat-${s.label.toLowerCase()}`}
                  >
                    <span className="block font-mono text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-2">
                      {s.label}
                    </span>
                    <span className="font-display text-3xl font-bold text-foreground text-glow">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Quick action CTAs */}
              <div
                className="mt-6 flex flex-wrap gap-2"
                data-testid="conference-quick-actions"
              >
                <a
                  href="#agenda"
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border border-foreground/40 bg-foreground/[0.02] text-foreground px-4 py-2.5 hover:border-foreground/70 hover:bg-foreground/[0.05] transition-all"
                  data-testid="cta-view-agenda"
                >
                  <CalendarDays size={12} /> Agenda
                </a>
                <a
                  href="#speakers"
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border border-border text-foreground/85 px-4 py-2.5 hover:border-foreground/40 transition-all"
                  data-testid="cta-browse-speakers"
                >
                  <Mic size={12} /> Browse Speakers · {speakers.length}
                </a>
              </div>
            </section>
          </ScrollReveal>

          {/* Agenda — sticky day tabs + chronological timeline */}
          <section id="agenda" className="scroll-mt-28 mb-14">
            <ScrollReveal>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Agenda · 4-Day Timeline
                  </h2>
                </div>

                {/* View toggle */}
                <div
                  className="inline-flex border border-border"
                  data-testid="agenda-view-toggle"
                >
                  <button
                    onClick={() => setAgendaView("timeline")}
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 transition-colors ${
                      agendaView === "timeline"
                        ? "bg-foreground/[0.04] text-foreground"
                        : "text-muted-foreground/70 hover:text-foreground"
                    }`}
                    data-testid="agenda-view-timeline"
                  >
                    <LayoutList size={11} /> Timeline
                  </button>
                  <button
                    onClick={() => setAgendaView("grid")}
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border-l border-border transition-colors ${
                      agendaView === "grid"
                        ? "bg-foreground/[0.04] text-foreground"
                        : "text-muted-foreground/70 hover:text-foreground"
                    }`}
                    data-testid="agenda-view-grid"
                  >
                    <LayoutGrid size={11} /> Grid
                  </button>
                </div>
              </div>

              {/* Day tabs (sticky) */}
              <div
                className="sticky top-20 z-20 -mx-2 px-2 py-3 mb-6 bg-background/85 backdrop-blur border-b border-border/40"
                data-testid="conference-day-tabs"
              >
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                  {c.days.map((d, i) => (
                    <button
                      key={d.date}
                      onClick={() => {
                        setActiveDay(i);
                        const el = document.getElementById(`day-${i}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`shrink-0 font-mono text-[11px] tracking-wider uppercase px-3 py-2 border transition-all ${
                        activeDay === i
                          ? "border-foreground/50 text-foreground bg-foreground/[0.03]"
                          : "border-border text-muted-foreground/70 hover:border-foreground/30"
                      }`}
                      data-testid={`conference-day-tab-${i}`}
                    >
                      {d.theme || d.date.split(",")[0]}
                    </button>
                  ))}
                </div>

                {/* Time slots for active day */}
                <div
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
                  data-testid="conference-time-slots"
                >
                  <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mr-2">
                    <Clock size={9} /> Jump to
                  </span>
                  {c.days[activeDay]?.sessions
                    .filter(
                      (s) =>
                        s.type !== "registration" && s.type !== "break" && s.type !== "meal",
                    )
                    .map((s) => {
                      const id = sessionKey(c.days[activeDay].date, s);
                      const slug = getSessionUrlSlug(c, c.days[activeDay].date, s);
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            const el = document.getElementById(slug);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="shrink-0 font-mono text-[10px] tracking-wider text-muted-foreground/75 border border-border/60 px-2 py-1 hover:border-foreground/40 hover:text-foreground transition-all"
                          title={s.title}
                          data-testid={`time-slot-${slug}`}
                        >
                          {s.start}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Days */}
              <div className="space-y-12">
                {c.days.map((d, i) => (
                  <div key={d.date} id={`day-${i}`} className="scroll-mt-32">
                    <div className="border-l-2 border-foreground/30 pl-5 mb-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 mb-2">
                        {d.date}
                      </p>
                      {d.theme && (
                        <h3 className="font-display text-xl font-bold text-foreground mb-2">{d.theme}</h3>
                      )}
                      {d.themeSummary && (
                        <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl">
                          {d.themeSummary}
                        </p>
                      )}
                    </div>

                    {agendaView === "timeline" ? (
                      <div className="space-y-2">
                        {d.sessions.map((s, j) => {
                          const id = sessionKey(d.date, s);
                          const slug = getSessionUrlSlug(c, d.date, s);
                          return (
                            <SessionCard
                              key={id}
                              id={id}
                              session={s}
                              authed={authed}
                              authChecked={authChecked}
                              note={notesById[id]}
                              conferenceSlug={c.slug}
                              conferenceName={c.name}
                              conferenceEdition={c.edition}
                              conferenceDate={d.date}
                              onLocalUpdate={(patch) => updateLocalNote(id, patch)}
                              anchor={slug}
                              urlSlug={slug}
                              isFirst={j === 0}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                        data-testid={`day-grid-${i}`}
                      >
                        {d.sessions
                          .filter((s) => s.speaker)
                          .map((s) => {
                            const id = sessionKey(d.date, s);
                            const slug = getSessionUrlSlug(c, d.date, s);
                            return (
                              <GridSpeakerCard
                                key={id}
                                session={s}
                                anchor={slug}
                                hasNote={!!notesById[id]?.note}
                                conferenceSlug={c.slug}
                              />
                            );
                          })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* Speakers — photo cards linking to dedicated speaker profiles */}
          <section id="speakers" className="scroll-mt-28 mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <Mic size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  Speakers · {speakers.length}
                </h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-5 max-w-3xl">
                Tap any speaker to open their profile — bio, every talk, and the notes once they go live.
              </p>
              <div
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                data-testid="conference-speakers-grid"
              >
                {speakers.map((sp) => {
                  const profile = getSpeakerByName(sp.name);
                  return (
                    <Link
                      key={sp.name}
                      to={
                        profile
                          ? `/notebook/conference/speakers/${profile.slug}`
                          : `#${sp.anchor}`
                      }
                      className="group flex items-start gap-3 border border-border p-3 hover:border-foreground/30 transition-all"
                      data-testid={`conference-speaker-${sp.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <HoloPhoto
                        src={profile?.photo}
                        alt={sp.name}
                        size="md"
                        fallback={initials(sp.name)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="holo-aberration font-display text-sm font-bold text-foreground truncate group-hover:text-glow transition-all">
                            {sp.name}
                          </p>
                          <ArrowUpRight
                            size={11}
                            className="text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0"
                          />
                        </div>
                        {sp.affiliation && (
                          <p className="font-mono text-[10px] text-muted-foreground/70 truncate">
                            {sp.affiliation}
                          </p>
                        )}
                        <p className="font-mono text-[9px] text-muted-foreground/50 mt-1 truncate">
                          <Clock size={9} className="inline mr-1" />
                          {sp.start} · {sp.dayLabel}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollReveal>
          </section>
        </div>

        <PageSidebar sections={tocSections} shareTitle={`${c.name} ${c.edition || c.year}`}>
          {/* Live notes signal in the sidebar */}
          <div className="mt-8 border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <NotebookIcon size={11} className="text-emerald-300/80" />
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Live Notes
              </p>
            </div>
            <p className="font-mono text-[11px] text-foreground/80 leading-relaxed">
              Click any session to take notes — saves automatically. Toggle <span className="text-emerald-300/90">Public</span> to publish on the speaker&apos;s profile.
            </p>
          </div>
        </PageSidebar>
      </div>
    </div>
  );
};

// ===== Session card =====
interface SessionCardProps {
  id: string;
  session: Session;
  authed: boolean;
  authChecked: boolean;
  note?: NoteRecord;
  conferenceSlug: string;
  conferenceName: string;
  conferenceEdition?: string;
  conferenceDate: string;
  onLocalUpdate: (patch: Partial<NoteRecord>) => void;
  anchor: string;
  urlSlug: string;
  isFirst?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  id,
  session: s,
  authed,
  note,
  conferenceSlug,
  conferenceName,
  conferenceEdition,
  conferenceDate,
  onLocalUpdate,
  anchor,
  urlSlug,
}) => {
  const [open, setOpen] = React.useState(false);
  const Icon = sessionIcon[s.type];
  const isStructural = s.type === "break" || s.type === "meal" || s.type === "registration";
  const sessionPath = `/notebook/conference/${conferenceSlug}/sessions/${urlSlug}`;

  return (
    <div
      id={anchor}
      className={`scroll-mt-32 border border-border ${isStructural ? "bg-foreground/[0.01]" : ""}`}
      data-testid={`session-${anchor}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Time column */}
          <div className="w-24 shrink-0">
            <p className="font-mono text-[10px] text-foreground/80">{s.start}</p>
            <p className="font-mono text-[9px] text-muted-foreground/50">{s.end}</p>
          </div>

          {/* Type icon */}
          <div className="w-7 h-7 border border-border flex items-center justify-center shrink-0 mt-0.5">
            <Icon size={11} className="text-muted-foreground/70" />
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`font-mono text-[8px] tracking-[0.2em] uppercase border px-1.5 py-0.5 ${sessionTypeColor[s.type]}`}
              >
                {s.type}
              </span>
              {note?.status && (
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase border px-1.5 py-0.5 border-emerald-400/40 text-emerald-300/90 inline-flex items-center gap-1">
                  <CheckCircle2 size={9} /> {note.status}
                </span>
              )}
            </div>

            <h4
              className={`font-display ${isStructural ? "text-sm" : "text-base"} font-bold text-foreground leading-snug mb-2`}
            >
              {isStructural ? (
                s.title
              ) : (
                <Link
                  to={sessionPath}
                  className="hover:underline decoration-foreground/40 underline-offset-4"
                  data-testid={`session-link-${urlSlug}`}
                >
                  {s.title}
                </Link>
              )}
            </h4>

            {/* Speaker chip — inline within session, links to full profile */}
            {s.speaker && (() => {
              const profile = getSpeakerByName(s.speaker);
              return (
                <div
                  className="flex items-start gap-2.5 mb-3"
                  data-testid={`session-speaker-${anchor}`}
                >
                  <Link
                    to={
                      profile
                        ? `/notebook/conference/speakers/${profile.slug}`
                        : "#"
                    }
                    className="shrink-0"
                  >
                    <HoloPhoto
                      src={profile?.photo}
                      alt={s.speaker}
                      size="sm"
                      fallback={initials(s.speaker)}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {profile ? (
                        <Link
                          to={`/notebook/conference/speakers/${profile.slug}`}
                          className="font-mono text-[11px] text-foreground/90 hover:text-glow hover:underline underline-offset-4 transition-all"
                        >
                          {s.speaker}
                        </Link>
                      ) : (
                        <span className="font-mono text-[11px] text-foreground/90">{s.speaker}</span>
                      )}
                      {s.speakerUrl && (
                        <a
                          href={s.speakerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground/50 hover:text-foreground transition-colors"
                          aria-label={`${s.speaker} on LinkedIn`}
                        >
                          <Linkedin size={10} />
                        </a>
                      )}
                    </div>
                    {s.affiliation && (
                      <p className="font-mono text-[10px] text-muted-foreground/60">{s.affiliation}</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {s.description && (
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-2">{s.description}</p>
            )}

            {s.takeaways && s.takeaways.length > 0 && (
              <ul className="mt-2 space-y-1">
                {s.takeaways.map((t, i) => (
                  <li
                    key={`${anchor}-takeaway-${i}-${t.slice(0, 30)}`}
                    className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed pl-4 relative"
                  >
                    <span className="absolute left-0 text-foreground/30">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}

            {/* MY NOTES — permanent inline section per session card */}
            {!isStructural && (
              <div
                className="mt-5 pt-4 border-t border-border/60"
                data-testid={`session-my-notes-${anchor}`}
              >
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/55 inline-flex items-center gap-1.5">
                    <NotebookIcon size={10} /> My Notes
                  </span>
                  {note?.is_public && note.note && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] border border-emerald-400/45 text-emerald-300/95 bg-emerald-400/[0.04] px-1.5 py-0.5 inline-flex items-center gap-1">
                      <Globe2 size={9} /> Published
                    </span>
                  )}
                  {note?.note && !note?.is_public && authed && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] border border-border text-muted-foreground/70 px-1.5 py-0.5">
                      Draft
                    </span>
                  )}
                  {note?.status && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] border border-foreground/30 text-foreground/80 px-1.5 py-0.5">
                      {note.status}
                    </span>
                  )}
                  {note?.note && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/55">
                      {(note.note.match(/\b[\w'-]+\b/g) || []).length} words
                    </span>
                  )}
                </div>

                {/* Public note rendering — visible to everyone */}
                {note?.is_public && note.note ? (
                  <NoteContent
                    text={note.note}
                    takeaways={note.takeaways}
                    isPublic
                    status={note.status}
                    updatedAt={note.updated_at}
                    preview
                    attribution={{
                      conferenceName,
                      conferenceEdition,
                      conferenceDate,
                      sessionTitle: s.title,
                      sessionUrl: `/notebook/conference/${conferenceSlug}/sessions/${anchor}`,
                    }}
                    testId={`note-${anchor}`}
                  />
                ) : authed && note?.note ? (
                  // Logged in admin sees their private/draft notes preview here too
                  <NoteContent
                    text={note.note}
                    takeaways={note.takeaways}
                    status={note.status}
                    updatedAt={note.updated_at}
                    preview
                    attribution={{
                      conferenceName,
                      conferenceEdition,
                      conferenceDate,
                      sessionTitle: s.title,
                      sessionUrl: `/notebook/conference/${conferenceSlug}/sessions/${anchor}`,
                    }}
                    testId={`note-${anchor}`}
                  />
                ) : (
                  <p className="font-mono text-[11px] text-muted-foreground/50 italic">
                    {authed
                      ? "No notes yet — tap Add below to start writing."
                      : "Notes will appear here once published."}
                  </p>
                )}
              </div>
            )}

            {s.room && (
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-3">
                <MapPin size={9} className="inline mr-1" />
                {s.room}
              </p>
            )}

            {/* Action row — always visible */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {!isStructural && (
                <Link
                  to={`/notebook/conference/${conferenceSlug}/sessions/${anchor}`}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground border border-foreground/40 bg-foreground/[0.03] px-2.5 py-1.5 hover:border-foreground/70 hover:bg-foreground/[0.06] transition-all"
                  data-testid={`session-open-${anchor}`}
                >
                  <NotebookIcon size={10} />
                  Open session
                  <ArrowUpRight size={10} />
                </Link>
              )}

              {/* Quick edit toggle (auth-only) — section header says "My Notes", this just toggles the editor */}
              {authed && !isStructural && (
                <button
                  onClick={() => setOpen((o) => !o)}
                  className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border px-2.5 py-1.5 transition-all ${
                    note?.note
                      ? "border-emerald-400/45 text-emerald-300/95 bg-emerald-400/[0.04] hover:bg-emerald-400/[0.08]"
                      : "border-border text-foreground/85 hover:border-foreground/40"
                  }`}
                  data-testid={`session-notes-toggle-${anchor}`}
                >
                  <NotebookIcon size={10} />
                  {open ? "Hide editor" : note?.note ? "Edit notes" : "Add notes"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes editor */}
      {authed && open && (
        <NoteEditor
          sessionId={id}
          conferenceSlug={conferenceSlug}
          session={s}
          note={note}
          onLocalUpdate={onLocalUpdate}
        />
      )}
    </div>
  );
};

// ===== Note editor =====
interface NoteEditorProps {
  sessionId: string;
  conferenceSlug: string;
  session: Session;
  note?: NoteRecord;
  onLocalUpdate: (patch: Partial<NoteRecord>) => void;
}

// Field-notes template (matches the published reading format).
const buildNoteTemplate = (s: Session): string => {
  const heading = s.speaker
    ? `${s.speaker} — ${s.title}`
    : s.title;
  return `## ${heading}

**Key thesis:** _What's the core argument in one sentence?_

### Context that matters

_What's the backdrop / why does this matter right now…_

### What ${s.speaker ? s.speaker.split(" ")[0] : "the speaker"} actually said

_The key claim, with the data or example they used…_

### Key takeaways

- takeaway one
- takeaway two
- takeaway three

### Quotes worth keeping

> "..." — ${s.speaker || "speaker"}

### My take

_Where I agree, push back, or extend with my own context…_

### Open questions

- [ ] What I want to dig into next
- [ ] People to follow up with — DM / coffee
- [ ] Action item — me — by when
`;
};

const NoteEditor: React.FC<NoteEditorProps> = ({ sessionId, conferenceSlug, session, note, onLocalUpdate }) => {
  // Auto-seed the field-notes template into empty notes so users get structure
  // immediately on first open — no extra click required.
  const initialText = note?.note && note.note.trim().length > 0
    ? note.note
    : buildNoteTemplate(session);
  const [text, setText] = React.useState(initialText);
  const [takeaways, setTakeaways] = React.useState<string[]>(note?.takeaways || []);
  const [statusFlag, setStatusFlag] = React.useState<NoteStatus>((note?.status as NoteStatus) || "");
  const [isPublic, setIsPublic] = React.useState<boolean>(!!note?.is_public);
  const [chip, setChip] = React.useState("");
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = React.useCallback(
    async (next: { note?: string; takeaways?: string[]; status?: string; is_public?: boolean }) => {
      setSaveState("saving");
      try {
        const body = {
          note: next.note ?? text,
          takeaways: next.takeaways ?? takeaways,
          status: next.status ?? statusFlag,
          is_public: next.is_public ?? isPublic,
        };
        await adminApi.put(`/notebook/notes/${conferenceSlug}/${sessionId}`, body);
        onLocalUpdate(body);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch {
        setSaveState("error");
      }
    },
    [conferenceSlug, sessionId, text, takeaways, statusFlag, isPublic, onLocalUpdate],
  );

  const onTextChange = (v: string) => {
    setText(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist({ note: v }), 1200);
  };

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      const next = text + snippet;
      setText(next);
      persist({ note: next });
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = text.slice(0, start) + snippet + text.slice(end);
    setText(next);
    persist({ note: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  };
  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current;
    if (!el) return insertAtCursor(`${before}${after}`);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = text.slice(start, end);
    const next = text.slice(0, start) + before + sel + after + text.slice(end);
    setText(next);
    persist({ note: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = end + before.length;
    });
  };
  const applyTemplate = () => {
    if (text.trim().length > 0 && !confirm("Replace current note with the field-notes template?")) return;
    const tmpl = buildNoteTemplate(session);
    setText(tmpl);
    persist({ note: tmpl });
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const addTakeaway = () => {
    const v = chip.trim();
    if (!v) return;
    const next = [...takeaways, v];
    setTakeaways(next);
    setChip("");
    persist({ takeaways: next });
  };

  const removeTakeaway = (i: number) => {
    const next = takeaways.filter((_, idx) => idx !== i);
    setTakeaways(next);
    persist({ takeaways: next });
  };

  const setStatus = (s: NoteStatus) => {
    const next = statusFlag === s ? "" : s;
    setStatusFlag(next as NoteStatus);
    persist({ status: next });
  };

  const togglePublish = () => {
    const next = !isPublic;
    setIsPublic(next);
    persist({ is_public: next });
  };

  return (
    <div className="border-t border-border bg-foreground/[0.015] p-5" data-testid={`note-editor-${sessionId}`}>
      {/* Status flags + publish */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
          Status
        </span>
        {(["attended", "skipped", "revisit"] as NoteStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`font-mono text-[10px] uppercase tracking-[0.15em] border px-2 py-1 transition-colors ${
              statusFlag === s
                ? "border-foreground/50 text-foreground bg-foreground/[0.04]"
                : "border-border text-muted-foreground/70 hover:border-foreground/30"
            }`}
            data-testid={`status-${s}-${sessionId}`}
          >
            {s === "revisit" ? <RotateCw size={9} className="inline mr-1" /> : null}
            {s}
          </button>
        ))}

        <span className="ml-auto inline-flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
            Visibility
          </span>
          <button
            onClick={togglePublish}
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] border px-2 py-1 transition-colors ${
              isPublic
                ? "border-emerald-400/50 text-emerald-300/90 bg-emerald-400/[0.04]"
                : "border-border text-muted-foreground/70 hover:border-foreground/30"
            }`}
            data-testid={`publish-toggle-${sessionId}`}
            title={
              isPublic
                ? "Public — visible on the conference + speaker profile pages"
                : "Private — only you can see this"
            }
          >
            {isPublic ? <Globe2 size={10} /> : <Lock size={10} />}
            {isPublic ? "Public" : "Private"}
            {isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
        </span>
      </div>

      {/* Format toolbar */}
      <div className="flex flex-wrap items-center gap-1 mb-2" data-testid={`note-toolbar-${sessionId}`}>
        <button
          onClick={applyTemplate}
          className="font-mono text-[10px] uppercase tracking-[0.15em] border border-emerald-400/30 text-emerald-300/90 px-2 py-1 hover:bg-emerald-400/[0.06] transition-colors"
          data-testid={`note-template-${sessionId}`}
          title="Insert the field-notes template (Speaker → Key thesis → Takeaways → My take → Open questions)"
        >
          ★ Template
        </button>
        <span className="w-px h-4 bg-border/60 mx-1" />
        <ToolBtn onClick={() => insertAtCursor("\n\n## Heading\n\n")} title="H2">H2</ToolBtn>
        <ToolBtn onClick={() => insertAtCursor("\n\n### Subheading\n\n")} title="H3">H3</ToolBtn>
        <ToolBtn onClick={() => wrapSelection("**")} title="Bold">B</ToolBtn>
        <ToolBtn onClick={() => wrapSelection("_")} title="Italic">I</ToolBtn>
        <span className="w-px h-4 bg-border/60 mx-1" />
        <ToolBtn onClick={() => insertAtCursor("\n- ")} title="Arrow takeaway (renders as → bullet)">→</ToolBtn>
        <ToolBtn onClick={() => insertAtCursor("\n1. ")} title="Numbered list">1.</ToolBtn>
        <ToolBtn onClick={() => insertAtCursor("\n- [ ] ")} title="Task / action item">☐</ToolBtn>
        <ToolBtn onClick={() => insertAtCursor("\n\n> \"\" — speaker\n\n")} title="Quote">❝</ToolBtn>
        <span className="w-px h-4 bg-border/60 mx-1" />
        <ToolBtn onClick={() => { const u = prompt("Image URL?"); if (u) insertAtCursor(`\n\n![](${u})\n\n`); }} title="Image" testid={`note-image-${sessionId}`}>🖼</ToolBtn>
        <ToolBtn onClick={() => { const u = prompt("YouTube/Vimeo URL?"); if (u) insertAtCursor(`\n\n${u}\n\n`); }} title="Video" testid={`note-video-${sessionId}`}>▶</ToolBtn>
        <ToolBtn onClick={() => insertAtCursor("[link](https://)")} title="Link">🔗</ToolBtn>
      </div>

      {/* Note textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Live notes from this session — quotes, signal, links, ideas you want to revisit later. Click ★ Template for the field-notes scaffold."
        rows={text ? 18 : 5}
        className="w-full bg-background border border-border p-3 font-mono text-xs text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 resize-y leading-relaxed"
        data-testid={`note-textarea-${sessionId}`}
      />

      {/* Takeaways */}
      <div className="mt-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 block mb-2">
          My Takeaways
        </span>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {takeaways.map((t, i) => (
            <button
              key={`editor-takeaway-${sessionId}-${i}-${t.slice(0, 30)}`}
              onClick={() => removeTakeaway(i)}
              className="group font-mono text-[10px] border border-foreground/20 text-foreground/80 px-2 py-1 hover:border-rose-400/40 hover:text-rose-300/90 transition-colors"
              data-testid={`takeaway-${sessionId}-${i}`}
              title="Click to remove"
            >
              {t}
              <span className="ml-1.5 text-muted-foreground/40 group-hover:text-rose-400/70">×</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chip}
            onChange={(e) => setChip(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTakeaway();
              }
            }}
            placeholder="Add a takeaway and press Enter…"
            className="flex-1 bg-background border border-border px-3 py-2 font-mono text-xs text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40"
            data-testid={`takeaway-input-${sessionId}`}
          />
          <button
            onClick={addTakeaway}
            className="font-mono text-[10px] uppercase tracking-[0.2em] border border-border px-3 hover:border-foreground/40 transition-colors"
            data-testid={`takeaway-add-${sessionId}`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Save state */}
      <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted-foreground/60">
        <Save size={10} />
        {saveState === "saving" && "Saving…"}
        {saveState === "saved" && <span className="text-emerald-300/80">Saved</span>}
        {saveState === "idle" && (note?.updated_at ? `Last saved ${new Date(note.updated_at).toLocaleString()}` : "Auto-saves as you type")}
        {saveState === "error" && <span className="text-rose-300/80">Save failed — retrying on next change</span>}
      </div>
    </div>
  );
};

export default ConferenceDetail;

// Reusable toolbar button for the note editor
const ToolBtn: React.FC<{ onClick: () => void; title: string; children: React.ReactNode; testid?: string }> = ({ onClick, title, children, testid }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="font-mono text-[11px] border border-border/70 text-foreground/80 px-1.5 py-1 min-w-[24px] hover:border-foreground/40 hover:bg-foreground/[0.04] transition-colors"
    data-testid={testid}
  >
    {children}
  </button>
);

// ===== Grid view — speaker-centric card per session =====
const GridSpeakerCard = ({
  session,
  anchor,
  hasNote,
  conferenceSlug,
}: {
  session: Session;
  anchor: string;
  hasNote: boolean;
  conferenceSlug: string;
}) => {
  const profile = session.speaker ? getSpeakerByName(session.speaker) : undefined;
  return (
    <Link
      to={`/notebook/conference/${conferenceSlug}/sessions/${anchor}`}
      className="group flex flex-col border border-border hover:border-foreground/30 transition-all"
      data-testid={`grid-speaker-${anchor}`}
    >
      <div className="aspect-square overflow-hidden border-b border-border relative">
        <HoloPhoto
          src={profile?.photo}
          alt={session.speaker || ""}
          size="full"
          fallback={
            session.speaker
              ? session.speaker
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
              : "—"
          }
          className="border-0"
        />
        {hasNote && (
          <span
            className="absolute top-2 right-2 z-10 font-mono text-[8px] uppercase tracking-[0.15em] border border-emerald-400/50 text-emerald-300/95 bg-background/80 backdrop-blur px-1.5 py-0.5"
            title="Has notes"
          >
            Notes
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">
          {session.start} · {session.type}
        </p>
        <p className="font-display text-sm font-bold text-foreground leading-tight mb-1.5 group-hover:text-glow transition-all line-clamp-2">
          {session.title}
        </p>
        {session.speaker && (
          <p className="font-mono text-[11px] text-foreground/85 mt-auto">
            {session.speaker}
          </p>
        )}
        {session.affiliation && (
          <p className="font-mono text-[10px] text-muted-foreground/60 truncate">
            {session.affiliation}
          </p>
        )}
      </div>
    </Link>
  );
};
