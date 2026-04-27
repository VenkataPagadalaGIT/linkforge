"use client";
import * as React from "react";
import axios from "axios";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import {
  ArrowLeft,
  ArrowRight,
  Linkedin,
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  Mic,
  Coffee,
  Utensils,
  PartyPopper,
  Hash,
  Notebook as NotebookIcon,
  RotateCw,
  Save,
  Globe2,
  Lock,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react";
import SEO from "@/components/SEO";
import HoloPhoto from "@/components/HoloPhoto";
import { type Conference, type Session, type SessionType } from "@/data/conferences";
import { getSpeakerByName } from "@/data/speakers";
import { adminApi, getToken } from "@/lib/admin-client";
import { BACKEND_URL } from "@/lib/site";

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

export interface SessionDetailContext {
  conference: Conference;
  session: Session;
  sessionId: string;
  dayDate: string;
  dayIndex: number;
  dayTheme?: string;
  prev?: { sessionId: string; title: string; start: string };
  next?: { sessionId: string; title: string; start: string };
}

const SessionDetail = ({ ctx }: { ctx: SessionDetailContext }) => {
  const { conference: c, session: s, sessionId, dayDate, dayTheme, prev, next } = ctx;
  const profile = s.speaker ? getSpeakerByName(s.speaker) : undefined;
  const Icon = sessionIcon[s.type];

  const [note, setNote] = React.useState<NoteRecord | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await axios.get<NoteRecord[]>(
          `${BACKEND_URL}/api/notebook/notes/public/${c.slug}`,
        );
        if (cancelled) return;
        const found = data.find((n) => n.session_id === sessionId);
        if (found) setNote(found);
      } catch {
        /* ignore */
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [c.slug, sessionId]);

  const tocSections = React.useMemo(
    () => [
      { label: "Session", id: "session-hero" },
      ...(s.speaker ? [{ label: "Speaker", id: "speaker" }] : []),
      ...(s.description ? [{ label: "Abstract", id: "abstract" }] : []),
      ...(s.takeaways && s.takeaways.length > 0 ? [{ label: "Suggested takeaways", id: "suggested" }] : []),
      { label: "My notes", id: "my-notes" },
    ],
    [s.speaker, s.description, s.takeaways],
  );

  const jsonLd = React.useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: s.title,
      startDate: dayDate,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      description: s.description || s.title,
      url: `https://venkatapagadala.com/notebook/conference/${c.slug}/sessions/${sessionId}`,
      location: { "@type": "Place", name: c.venues[0]?.name || c.city, address: c.city },
      superEvent: {
        "@type": "Event",
        name: `${c.name} ${c.edition || c.year}`,
        url: c.url,
      },
      performer: s.speaker
        ? { "@type": "Person", name: s.speaker, affiliation: s.affiliation, url: s.speakerUrl }
        : undefined,
    }),
    [c, s, sessionId, dayDate],
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20" data-testid="session-detail">
      <SEO
        title={`${s.title} · ${c.name} ${c.edition || c.year}`}
        description={s.description || s.title}
        canonical={`https://venkatapagadala.com/notebook/conference/${c.slug}/sessions/${sessionId}`}
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
              to={`/notebook/conference/${c.slug}#${sessionId}`}
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
              data-testid="session-back-link"
            >
              <ArrowLeft size={12} /> Back to {c.name} {c.edition || c.year} agenda
            </Link>

            {/* Session hero */}
            <section id="session-hero" className="scroll-mt-28 mb-12">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span
                  className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 inline-flex items-center gap-1.5 ${sessionTypeColor[s.type]}`}
                >
                  <Icon size={10} /> {s.type}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/60 inline-flex items-center gap-1">
                  <CalendarDays size={11} /> {dayDate}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/60 inline-flex items-center gap-1">
                  <Clock size={11} /> {s.start} – {s.end}
                </span>
                {dayTheme && (
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
                    · {dayTheme}
                  </span>
                )}
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-5 text-glow leading-tight"
                data-testid="session-title"
              >
                {s.title}
              </h1>

              <div className="flex items-center gap-4 flex-wrap text-muted-foreground/80 font-mono text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={11} /> {c.venues[0]?.name || c.city}
                </span>
                {note?.is_public && (
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-emerald-400/50 text-emerald-300/90 px-2 py-1 inline-flex items-center gap-1.5">
                    <Globe2 size={10} /> Field notes published
                  </span>
                )}
                {note?.status && (
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-foreground/30 text-foreground/80 px-2 py-1">
                    {note.status}
                  </span>
                )}
              </div>
            </section>
          </ScrollReveal>

          {/* Speaker block */}
          {s.speaker && (
            <section id="speaker" className="scroll-mt-28 mb-12">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-4">
                  <Mic size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">Speaker</h2>
                </div>
                <div className="border border-border p-6 grid sm:grid-cols-[120px_1fr] gap-5 items-start">
                  <Link
                    to={
                      profile
                        ? `/notebook/conference/speakers/${profile.slug}`
                        : "#"
                    }
                    className="block"
                    data-testid="session-speaker-photo"
                  >
                    <HoloPhoto
                      src={profile?.photo}
                      alt={s.speaker}
                      size="full"
                      loading="eager"
                      fallback={s.speaker
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    />
                  </Link>
                  <div className="min-w-0">
                    {profile ? (
                      <Link
                        to={`/notebook/conference/speakers/${profile.slug}`}
                        className="font-display text-2xl font-bold text-foreground hover:text-glow transition-all inline-flex items-center gap-2"
                      >
                        {s.speaker}
                        <ArrowRight size={14} className="text-muted-foreground/40" />
                      </Link>
                    ) : (
                      <p className="font-display text-2xl font-bold text-foreground">{s.speaker}</p>
                    )}
                    {s.affiliation && (
                      <p className="font-mono text-xs text-muted-foreground mt-1">{s.affiliation}</p>
                    )}
                    {profile?.bio && (
                      <p className="font-mono text-xs text-muted-foreground/85 mt-3 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mt-4">
                      {(profile?.linkedin || s.speakerUrl) && (
                        <a
                          href={profile?.linkedin || s.speakerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border border-border px-2.5 py-1.5 hover:border-foreground/40 transition-colors"
                        >
                          <Linkedin size={10} /> LinkedIn
                        </a>
                      )}
                      {profile?.podcastUrl && (
                        <a
                          href={profile.podcastUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border border-border px-2.5 py-1.5 hover:border-foreground/40 transition-colors"
                        >
                          <Headphones size={10} /> Podcast
                        </a>
                      )}
                      {profile && (
                        <Link
                          to={`/notebook/conference/speakers/${profile.slug}`}
                          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border border-border px-2.5 py-1.5 hover:border-foreground/40 transition-colors"
                          data-testid="session-open-speaker-profile"
                        >
                          Open profile <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </section>
          )}

          {/* Abstract */}
          {s.description && (
            <section id="abstract" className="scroll-mt-28 mb-12">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">Abstract</h2>
                </div>
                <p className="font-mono text-sm text-foreground/85 leading-relaxed border-l-2 border-foreground/20 pl-5 max-w-3xl">
                  {s.description}
                </p>
              </ScrollReveal>
            </section>
          )}

          {/* Suggested takeaways */}
          {s.takeaways && s.takeaways.length > 0 && (
            <section id="suggested" className="scroll-mt-28 mb-12">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-4">
                  <NotebookIcon size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Suggested takeaways
                  </h2>
                </div>
                <ul className="space-y-2 max-w-3xl">
                  {s.takeaways.map((t, i) => (
                    <li
                      key={i}
                      className="font-mono text-xs text-muted-foreground/90 leading-relaxed pl-5 relative"
                    >
                      <span className="absolute left-0 text-foreground/40">→</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </section>
          )}

          {/* MY NOTES */}
          <section id="my-notes" className="scroll-mt-28 mb-12">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <NotebookIcon size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">My notes</h2>
              </div>

              <NoteEditorFull
                conferenceSlug={c.slug}
                sessionId={sessionId}
                initial={note}
                onSaved={(n) => setNote(n)}
              />
            </ScrollReveal>
          </section>

          {/* Prev / Next nav */}
          <section className="mt-16 grid sm:grid-cols-2 gap-3">
            {prev ? (
              <Link
                to={`/notebook/conference/${c.slug}/sessions/${prev.sessionId}`}
                className="group border border-border p-5 hover:border-foreground/30 transition-colors"
                data-testid="session-prev"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 inline-flex items-center gap-1.5">
                  <ArrowLeft size={10} /> Previous
                </p>
                <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all line-clamp-2">
                  {prev.title}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">{prev.start}</p>
              </Link>
            ) : <span />}
            {next ? (
              <Link
                to={`/notebook/conference/${c.slug}/sessions/${next.sessionId}`}
                className="group border border-border p-5 hover:border-foreground/30 transition-colors text-right sm:col-start-2"
                data-testid="session-next"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 inline-flex items-center gap-1.5 justify-end">
                  Next <ArrowRight size={10} />
                </p>
                <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all line-clamp-2">
                  {next.title}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">{next.start}</p>
              </Link>
            ) : null}
          </section>
        </div>

        <PageSidebar sections={tocSections} shareTitle={s.title} />
      </div>
    </div>
  );
};

// ===== Long-form note editor =====
const NoteEditorFull = ({
  conferenceSlug,
  sessionId,
  initial,
  onSaved,
}: {
  conferenceSlug: string;
  sessionId: string;
  initial?: NoteRecord;
  onSaved: (n: NoteRecord) => void;
}) => {
  const [text, setText] = React.useState(initial?.note || "");
  const [takeaways, setTakeaways] = React.useState<string[]>(initial?.takeaways || []);
  const [statusFlag, setStatusFlag] = React.useState<NoteStatus>((initial?.status as NoteStatus) || "");
  const [isPublic, setIsPublic] = React.useState<boolean>(!!initial?.is_public);
  const [chip, setChip] = React.useState("");
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when notes load asynchronously
  React.useEffect(() => {
    if (!initial) return;
    setText(initial.note || "");
    setTakeaways(initial.takeaways || []);
    setStatusFlag((initial.status as NoteStatus) || "");
    setIsPublic(!!initial.is_public);
  }, [initial]);

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
        const { data } = await adminApi.put<NoteRecord>(
          `/notebook/notes/${conferenceSlug}/${sessionId}`,
          body,
        );
        onSaved(data);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch {
        setSaveState("error");
      }
    },
    [conferenceSlug, sessionId, text, takeaways, statusFlag, isPublic, onSaved],
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
    const nextV = statusFlag === s ? "" : s;
    setStatusFlag(nextV as NoteStatus);
    persist({ status: nextV });
  };

  const togglePublish = () => {
    const next = !isPublic;
    setIsPublic(next);
    persist({ is_public: next });
  };

  return (
    <div className="border border-border p-6 max-w-3xl" data-testid="session-note-editor-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
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
            data-testid={`status-${s}`}
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
            data-testid="publish-toggle"
          >
            {isPublic ? <Globe2 size={10} /> : <Lock size={10} />}
            {isPublic ? "Public" : "Private"}
            {isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Long-form notes — quotes, frameworks, links, questions, action items. Markdown-friendly. Autosaves every 1.2s."
        rows={16}
        className="w-full bg-background border border-border p-4 font-mono text-[13px] text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 resize-y leading-relaxed"
        data-testid="session-note-textarea"
      />

      <div className="mt-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 block mb-2">
          My takeaways
        </span>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {takeaways.map((t, i) => (
            <button
              key={i}
              onClick={() => removeTakeaway(i)}
              className="group font-mono text-[10px] border border-foreground/20 text-foreground/80 px-2 py-1 hover:border-rose-400/40 hover:text-rose-300/90 transition-colors"
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
            data-testid="session-takeaway-input"
          />
          <button
            onClick={addTakeaway}
            className="font-mono text-[10px] uppercase tracking-[0.2em] border border-border px-3 hover:border-foreground/40 transition-colors"
            data-testid="session-takeaway-add"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-muted-foreground/60">
        <Save size={10} />
        {saveState === "saving" && "Saving…"}
        {saveState === "saved" && <span className="text-emerald-300/80">Saved</span>}
        {saveState === "idle" &&
          (initial?.updated_at
            ? `Last saved ${new Date(initial.updated_at).toLocaleString()}`
            : "Auto-saves as you type")}
        {saveState === "error" && (
          <span className="text-rose-300/80">Save failed — retrying on next change</span>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;
