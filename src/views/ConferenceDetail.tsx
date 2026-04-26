"use client";
import * as React from "react";
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
} from "lucide-react";
import SEO from "@/components/SEO";
import { type Conference, type Session, type SessionType } from "@/data/conferences";
import { adminApi, getToken } from "@/lib/admin-client";

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
  updated_at: string;
}

// stable id per session (deterministic from day+start+title)
const sessionKey = (dayDate: string, s: Session) =>
  `${dayDate}__${s.start}__${s.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

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

  // ===== Auth-gated notes =====
  const [authed, setAuthed] = React.useState(false);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [notesById, setNotesById] = React.useState<Record<string, NoteRecord>>({});

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const token = getToken();
      if (!token) {
        setAuthChecked(true);
        return;
      }
      try {
        await adminApi.get("/auth/me");
        const { data } = await adminApi.get<NoteRecord[]>(`/notebook/notes/${c.slug}`);
        if (cancelled) return;
        const map: Record<string, NoteRecord> = {};
        data.forEach((n) => (map[n.session_id] = n));
        setNotesById(map);
        setAuthed(true);
      } catch {
        // silent — public visitor
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [c.slug]);

  const updateLocalNote = (sessionId: string, patch: Partial<NoteRecord>) => {
    setNotesById((prev) => ({
      ...prev,
      [sessionId]: {
        conference_slug: c.slug,
        session_id: sessionId,
        note: "",
        takeaways: [],
        status: "",
        updated_at: new Date().toISOString(),
        ...prev[sessionId],
        ...patch,
      },
    }));
  };

  const tocSections = React.useMemo(() => {
    const base = [
      { label: "Overview", id: "overview" },
      { label: "Why It Matters", id: "why" },
      { label: "Venues", id: "venues" },
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
            </section>
          </ScrollReveal>

          {/* Why It Matters */}
          {c.whyItMatters && (
            <section id="why" className="scroll-mt-28 mb-14">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">Why It Matters</h2>
                </div>
                <p className="font-mono text-sm text-foreground/80 leading-relaxed border-l-2 border-foreground/20 pl-5 max-w-3xl">
                  {c.whyItMatters}
                </p>
                {c.takeaways && c.takeaways.length > 0 && (
                  <ul className="mt-6 space-y-2 max-w-3xl">
                    {c.takeaways.map((t, i) => (
                      <li
                        key={i}
                        className="font-mono text-xs text-muted-foreground/90 leading-relaxed pl-5 relative"
                      >
                        <span className="absolute left-0 text-foreground/40">→</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollReveal>
            </section>
          )}

          {/* Venues */}
          {c.venues.length > 0 && (
            <section id="venues" className="scroll-mt-28 mb-14">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-5">
                  <MapPin size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">Venues</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {c.venues.map((v, i) => {
                    const Wrap: React.ElementType = v.url ? "a" : "div";
                    const props = v.url ? { href: v.url, target: "_blank", rel: "noopener noreferrer" } : {};
                    return (
                      <Wrap
                        key={i}
                        {...props}
                        className={`block border border-border p-5 ${
                          v.url ? "hover:border-foreground/30 transition-all" : ""
                        }`}
                        data-testid={`conference-venue-${i}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-display text-base font-bold text-foreground">{v.name}</h3>
                          {v.url && <ExternalLink size={12} className="text-muted-foreground/40 mt-1" />}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground/70 mb-2">
                          {v.address ? `${v.address} · ` : ""}
                          {v.city}
                          {v.country ? `, ${v.country}` : ""}
                        </p>
                        {v.notes && (
                          <p className="font-mono text-xs text-muted-foreground leading-relaxed">{v.notes}</p>
                        )}
                      </Wrap>
                    );
                  })}
                </div>
              </ScrollReveal>
            </section>
          )}

          {/* Agenda — sticky day tabs + chronological timeline */}
          <section id="agenda" className="scroll-mt-28 mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <CalendarDays size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">Agenda · 4-Day Timeline</h2>
              </div>

              {/* Day tabs (sticky) */}
              <div
                className="sticky top-20 z-20 -mx-2 px-2 py-3 mb-6 bg-background/85 backdrop-blur border-b border-border/40"
                data-testid="conference-day-tabs"
              >
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
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

                    <div className="space-y-2">
                      {d.sessions.map((s, j) => {
                        const id = sessionKey(d.date, s);
                        return (
                          <SessionCard
                            key={id}
                            id={id}
                            session={s}
                            authed={authed}
                            authChecked={authChecked}
                            note={notesById[id]}
                            conferenceSlug={c.slug}
                            onLocalUpdate={(patch) => updateLocalNote(id, patch)}
                            anchor={id}
                            isFirst={j === 0}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* Speakers — chip cloud, links to inline session anchors */}
          <section id="speakers" className="scroll-mt-28 mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <Mic size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  Speakers · {speakers.length}
                </h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-5 max-w-3xl">
                Every speaker appears once below. Click any name to jump straight to their session inside the timeline.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2" data-testid="conference-speakers-grid">
                {speakers.map((sp) => (
                  <a
                    key={sp.name}
                    href={`#${sp.anchor}`}
                    className="group flex items-start gap-3 border border-border p-3 hover:border-foreground/30 transition-all"
                    data-testid={`conference-speaker-${sp.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="w-9 h-9 border border-border bg-foreground/[0.03] flex items-center justify-center font-mono text-[11px] text-foreground/70 group-hover:border-foreground/40 group-hover:text-foreground transition-colors shrink-0">
                      {initials(sp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-display text-sm font-bold text-foreground truncate group-hover:text-glow transition-all">
                          {sp.name}
                        </p>
                        {sp.speakerUrl && (
                          <Linkedin size={10} className="text-muted-foreground/40 shrink-0" />
                        )}
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
                  </a>
                ))}
              </div>
            </ScrollReveal>
          </section>
        </div>

        <PageSidebar sections={tocSections} shareTitle={`${c.name} ${c.edition || c.year}`}>
          {/* Live notes signal in the sidebar */}
          <div className="mt-8 border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              {authChecked && authed ? (
                <NotebookIcon size={11} className="text-emerald-300/80" />
              ) : (
                <Lock size={11} className="text-muted-foreground/40" />
              )}
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Live Notes
              </p>
            </div>
            {authed ? (
              <p className="font-mono text-[11px] text-foreground/80 leading-relaxed">
                Logged in. Click any session to add notes — saves automatically.
              </p>
            ) : (
              <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed">
                Public agenda view.{" "}
                <Link to="/admin/login" className="text-foreground underline-offset-4 hover:underline">
                  Sign in
                </Link>{" "}
                to take notes during sessions.
              </p>
            )}
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
  onLocalUpdate: (patch: Partial<NoteRecord>) => void;
  anchor: string;
  isFirst?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  id,
  session: s,
  authed,
  note,
  conferenceSlug,
  onLocalUpdate,
  anchor,
}) => {
  const [open, setOpen] = React.useState(false);
  const Icon = sessionIcon[s.type];
  const isStructural = s.type === "break" || s.type === "meal" || s.type === "registration";

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
              {s.title}
            </h4>

            {/* Speaker chip — inline within session */}
            {s.speaker && (
              <div className="flex items-start gap-2.5 mb-3" data-testid={`session-speaker-${anchor}`}>
                <div className="w-7 h-7 border border-border bg-foreground/[0.03] flex items-center justify-center font-mono text-[10px] text-foreground/70 shrink-0">
                  {initials(s.speaker)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] text-foreground/90">{s.speaker}</span>
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
            )}

            {s.description && (
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-2">{s.description}</p>
            )}

            {s.takeaways && s.takeaways.length > 0 && (
              <ul className="mt-2 space-y-1">
                {s.takeaways.map((t, i) => (
                  <li
                    key={i}
                    className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed pl-4 relative"
                  >
                    <span className="absolute left-0 text-foreground/30">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}

            {s.room && (
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-2">
                <MapPin size={9} className="inline mr-1" />
                {s.room}
              </p>
            )}

            {/* Notes toggle (auth-only) */}
            {authed && !isStructural && (
              <button
                onClick={() => setOpen((o) => !o)}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors border border-border px-2 py-1"
                data-testid={`session-notes-toggle-${anchor}`}
              >
                <NotebookIcon size={10} />
                {open ? "Hide notes" : note?.note ? "Edit notes" : "Add notes"}
                {note?.note ? <Circle size={6} className="text-emerald-400 fill-emerald-400" /> : null}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes editor */}
      {authed && open && (
        <NoteEditor
          sessionId={id}
          conferenceSlug={conferenceSlug}
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
  note?: NoteRecord;
  onLocalUpdate: (patch: Partial<NoteRecord>) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ sessionId, conferenceSlug, note, onLocalUpdate }) => {
  const [text, setText] = React.useState(note?.note || "");
  const [takeaways, setTakeaways] = React.useState<string[]>(note?.takeaways || []);
  const [statusFlag, setStatusFlag] = React.useState<NoteStatus>((note?.status as NoteStatus) || "");
  const [chip, setChip] = React.useState("");
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = React.useCallback(
    async (next: { note?: string; takeaways?: string[]; status?: string }) => {
      setSaveState("saving");
      try {
        const body = {
          note: next.note ?? text,
          takeaways: next.takeaways ?? takeaways,
          status: next.status ?? statusFlag,
        };
        await adminApi.put(`/notebook/notes/${conferenceSlug}/${sessionId}`, body);
        onLocalUpdate(body);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch {
        setSaveState("error");
      }
    },
    [conferenceSlug, sessionId, text, takeaways, statusFlag, onLocalUpdate],
  );

  const onTextChange = (v: string) => {
    setText(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist({ note: v }), 1200);
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

  return (
    <div className="border-t border-border bg-foreground/[0.015] p-5" data-testid={`note-editor-${sessionId}`}>
      {/* Status flags */}
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
      </div>

      {/* Note textarea */}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Live notes from this session — quotes, signal, links, ideas you want to revisit later…"
        rows={5}
        className="w-full bg-background border border-border p-3 font-mono text-xs text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 resize-y"
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
              key={i}
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
