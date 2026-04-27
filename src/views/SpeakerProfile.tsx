"use client";
import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import {
  ArrowLeft,
  Linkedin,
  Mic,
  CalendarDays,
  MapPin,
  Headphones,
  ExternalLink,
  Sparkles,
  BookOpen,
  Notebook as NotebookIcon,
} from "lucide-react";
import SEO from "@/components/SEO";
import HoloPhoto from "@/components/HoloPhoto";
import { type Speaker, getSpeakerTalks, type SpeakerTalk, photoSourceFor } from "@/data/speakers";
import { adminApi, getToken } from "@/lib/admin-client";
import axios from "axios";
import { BACKEND_URL } from "@/lib/site";

interface NoteRecord {
  conference_slug: string;
  session_id: string;
  note: string;
  takeaways: string[];
  status: string;
  is_public: boolean;
  updated_at: string;
}

const trackColor: Record<string, string> = {
  "The Science": "border-amber-400/40 text-amber-300/90",
  "The Psychology": "border-fuchsia-400/40 text-fuchsia-300/90",
  "The Ecosystem": "border-emerald-400/40 text-emerald-300/90",
  "The Future": "border-sky-400/40 text-sky-300/90",
};

const sessionTypeStyle: Record<string, string> = {
  keynote: "border-amber-400/40 text-amber-300/90",
  talk: "border-foreground/30 text-foreground/80",
  panel: "border-fuchsia-400/40 text-fuchsia-300/90",
};

const SpeakerProfile = ({ speaker }: { speaker: Speaker }) => {
  const talks = React.useMemo(() => getSpeakerTalks(speaker.name), [speaker.name]);
  const [notesById, setNotesById] = React.useState<Record<string, NoteRecord>>({});
  const [authed, setAuthed] = React.useState(false);

  // Pull public notes (no auth) + admin notes (if logged in) and merge by session_id
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Group talks by conference slug
      const slugs = Array.from(new Set(talks.map((t) => t.conferenceSlug)));
      const merged: Record<string, NoteRecord> = {};

      // Public notes first
      await Promise.all(
        slugs.map(async (slug) => {
          try {
            const { data } = await axios.get<NoteRecord[]>(
              `${BACKEND_URL}/api/notebook/notes/public/${slug}`,
            );
            data.forEach((n) => (merged[`${slug}::${n.session_id}`] = n));
          } catch {
            /* ignore */
          }
        }),
      );

      // Admin notes (overrides public ones — same data, just full set)
      if (getToken()) {
        try {
          await adminApi.get("/auth/me");
          if (cancelled) return;
          await Promise.all(
            slugs.map(async (slug) => {
              try {
                const { data } = await adminApi.get<NoteRecord[]>(`/notebook/notes/${slug}`);
                data.forEach((n) => (merged[`${slug}::${n.session_id}`] = n));
              } catch {
                /* ignore */
              }
            }),
          );
          setAuthed(true);
        } catch {
          /* not logged in — keep only public */
        }
      }
      if (!cancelled) setNotesById(merged);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [talks]);

  const tocSections = React.useMemo(
    () => [
      { label: "Profile", id: "profile" },
      { label: "About", id: "about" },
      { label: "Talks", id: "talks" },
    ],
    [],
  );

  const jsonLd = React.useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Person",
      name: speaker.name,
      jobTitle: speaker.role,
      worksFor: { "@type": "Organization", name: speaker.company },
      sameAs: [speaker.linkedin, speaker.website].filter(Boolean),
      description: speaker.bio,
      image: speaker.photo,
    }),
    [speaker],
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20" data-testid="speaker-profile">
      <SEO
        title={`${speaker.name} · ${speaker.role}, ${speaker.company}`}
        description={speaker.bio}
        canonical={`https://venkatapagadala.com/notebook/conference/speakers/${speaker.slug}`}
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
              to="/notebook/conference/seo-week-2026"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
              data-testid="speaker-back-link"
            >
              <ArrowLeft size={12} /> Back to SEO Week 2026
            </Link>

            {/* Profile hero */}
            <section id="profile" className="scroll-mt-28 mb-14">
              <div className="grid sm:grid-cols-[260px_1fr] gap-8 items-start">
                <div data-testid="speaker-photo" className="w-full max-w-[260px]">
                  <HoloPhoto
                    src={speaker.photo}
                    alt={speaker.name}
                    size="full"
                    loading="eager"
                    interactive={false}
                    fallback={speaker.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  />
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40" data-testid="speaker-photo-source">
                    {(() => {
                      const src = photoSourceFor(speaker.slug);
                      if (src === "linkedin") return "Photo · LinkedIn";
                      if (src === "seoweek") return "Photo · seoweek.org";
                      return "Photo · initials";
                    })()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Mic size={16} className="text-muted-foreground/50" />
                    <p className="font-mono text-[11px] text-muted-foreground/50 uppercase tracking-[0.3em]">
                      Speaker Profile
                    </p>
                  </div>
                  <h1
                    className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3 text-glow"
                    data-testid="speaker-name"
                  >
                    {speaker.name}
                  </h1>
                  <p className="font-mono text-sm text-foreground/80 mb-1" data-testid="speaker-role">
                    {speaker.role}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground/80 mb-5" data-testid="speaker-company">
                    {speaker.company}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    {speaker.dayTrack && (
                      <span
                        className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 ${trackColor[speaker.dayTrack] || "border-border text-muted-foreground/70"}`}
                        data-testid="speaker-track"
                      >
                        {speaker.dayTrack}
                      </span>
                    )}
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-border text-muted-foreground/70 px-2 py-1">
                      {talks.length} {talks.length === 1 ? "talk" : "talks"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {speaker.linkedin && (
                      <a
                        href={speaker.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border border-border px-3 py-2 hover:border-foreground/40 transition-colors"
                        data-testid="speaker-linkedin"
                      >
                        <Linkedin size={11} /> LinkedIn
                      </a>
                    )}
                    {speaker.podcastUrl && (
                      <a
                        href={speaker.podcastUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border border-border px-3 py-2 hover:border-foreground/40 transition-colors"
                        data-testid="speaker-podcast"
                      >
                        <Headphones size={11} /> Podcast
                      </a>
                    )}
                    {speaker.website && (
                      <a
                        href={speaker.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border border-border px-3 py-2 hover:border-foreground/40 transition-colors"
                      >
                        <ExternalLink size={11} /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* About */}
          <section id="about" className="scroll-mt-28 mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">About</h2>
              </div>
              <p
                className="font-mono text-sm text-foreground/85 leading-relaxed border-l-2 border-foreground/20 pl-5 max-w-3xl"
                data-testid="speaker-bio"
              >
                {speaker.bio}
              </p>
            </ScrollReveal>
          </section>

          {/* Talks timeline */}
          <section id="talks" className="scroll-mt-28 mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-5">
                <BookOpen size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  Talks · {talks.length}
                </h2>
              </div>
              {talks.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground/60 border border-dashed border-border/50 px-4 py-6">
                  No talks indexed yet.
                </p>
              ) : (
                <div className="space-y-5" data-testid="speaker-talks">
                  {talks.map((t) => {
                    const note = notesById[`${t.conferenceSlug}::${t.sessionId}`];
                    return (
                      <TalkCard
                        key={`${t.conferenceSlug}-${t.sessionId}`}
                        talk={t}
                        note={note}
                        authed={authed}
                      />
                    );
                  })}
                </div>
              )}
            </ScrollReveal>
          </section>
        </div>

        <PageSidebar sections={tocSections} shareTitle={speaker.name}>
          <div className="mt-8 border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <NotebookIcon size={11} className="text-muted-foreground/50" />
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Notes Status
              </p>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed">
              {authed
                ? "Logged in — you can see all notes for this speaker."
                : Object.keys(notesById).length > 0
                  ? "Showing published notes only. Sign in to see your private drafts."
                  : "No published notes yet for this speaker."}
            </p>
          </div>
        </PageSidebar>
      </div>
    </div>
  );
};

const TalkCard = ({
  talk,
  note,
  authed,
}: {
  talk: SpeakerTalk;
  note?: NoteRecord;
  authed: boolean;
}) => {
  const showNote = !!note && (note.is_public || authed) && note.note.trim().length > 0;
  return (
    <article
      className="border border-border p-6"
      data-testid={`speaker-talk-${talk.conferenceSlug}-${talk.sessionId}`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`font-mono text-[8px] tracking-[0.2em] uppercase border px-1.5 py-0.5 ${sessionTypeStyle[talk.type] || "border-border text-muted-foreground/60"}`}
        >
          {talk.type}
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
          {talk.conferenceName} {talk.conferenceEdition || ""}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">·</span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/60">
          <CalendarDays size={10} /> {talk.dayDate}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">·</span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/60">
          <MapPin size={10} /> {talk.city}
        </span>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground leading-snug mb-2">
        <Link
          to={`/notebook/conference/${talk.conferenceSlug}#${talk.sessionId}`}
          className="hover:text-glow transition-all"
        >
          {talk.title}
        </Link>
      </h3>

      <p className="font-mono text-[10px] text-muted-foreground/70 mb-3">
        {talk.start} – {talk.end} · {talk.dayTheme || talk.dayDate}
      </p>

      {talk.description && (
        <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">{talk.description}</p>
      )}

      {talk.takeaways && talk.takeaways.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {talk.takeaways.map((tk, i) => (
            <li
              key={i}
              className="font-mono text-[11px] text-muted-foreground/85 leading-relaxed pl-4 relative"
            >
              <span className="absolute left-0 text-foreground/30">→</span>
              {tk}
            </li>
          ))}
        </ul>
      )}

      {showNote && note && (
        <div
          className="mt-5 border-t border-border pt-4"
          data-testid={`speaker-talk-note-${talk.sessionId}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <NotebookIcon size={11} className="text-foreground/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
              {note.is_public ? "Field notes" : "Private notes"}
            </span>
            {note.status && (
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] border border-emerald-400/40 text-emerald-300/90 px-1.5 py-0.5">
                {note.status}
              </span>
            )}
          </div>
          <div className="font-mono text-[12.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
            {note.note}
          </div>
          {note.takeaways.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {note.takeaways.map((t, i) => (
                <span
                  key={i}
                  className="font-mono text-[10px] border border-foreground/20 text-foreground/80 px-2 py-1"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default SpeakerProfile;
