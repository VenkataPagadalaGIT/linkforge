"use client";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  CalendarDays,
  MapPin,
  Sparkles,
  BookOpen,
  Notebook as NotebookIcon,
  Users,
} from "lucide-react";
import SEO from "@/components/SEO";
import { conferences, type Conference } from "@/data/conferences";

const tocSections = [
  { label: "Overview", id: "overview" },
  { label: "Featured", id: "featured" },
  { label: "All Conferences", id: "all" },
  { label: "Field Notes", id: "notes" },
];

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

const totalSpeakers = conferences.reduce((acc, c) => acc + (c.speakerCount ?? 0), 0);
const totalHours = conferences.reduce((acc, c) => acc + (c.hoursOfTalks ?? 0), 0);
const upcoming = conferences.filter((c) => c.status === "upcoming");
const attended = conferences.filter((c) => c.status === "attended");
const featured = conferences[0];

const ConferenceNotebook = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20" data-testid="conference-notebook">
      <SEO
        title="Conference Notebook | AI & SEO | Venkata Pagadala"
        description="Field notes, talks, and takeaways from AI, SEO, and engineering conferences — a live notebook by Venkata Pagadala."
        canonical="https://venkatapagadala.com/notebook/conference"
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <Link
              to="/notebook"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
              data-testid="conference-back-link"
            >
              <ArrowLeft size={12} /> Back to Notebooks
            </Link>

            <div className="mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Mic size={18} className="text-muted-foreground/50" />
                <p className="font-mono text-[11px] text-muted-foreground/50 uppercase tracking-[0.3em]">
                  Conference Notebook
                </p>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4 text-glow">
                Conference Notebook
              </h1>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Field notes from the conferences I attend and speak at. Curated takeaways, hallway conversations, and the
                ideas that survived the flight home.
              </p>
            </div>
          </ScrollReveal>

          {/* Overview / stats */}
          <section id="overview" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Conferences", value: conferences.length, icon: NotebookIcon },
                  { label: "Upcoming", value: upcoming.length, icon: CalendarDays },
                  { label: "Speakers", value: totalSpeakers, icon: Users },
                  { label: "Hours of Talks", value: totalHours, icon: BookOpen },
                ].map((s) => {
                  const I = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="border border-border px-4 py-5"
                      data-testid={`conference-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <I size={12} className="text-muted-foreground/40" />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase">
                          {s.label}
                        </span>
                      </div>
                      <p className="font-display text-3xl font-bold text-foreground text-glow">{s.value}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </section>

          {/* Featured */}
          {featured && (
            <section id="featured" className="scroll-mt-28 mb-16">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">Featured · Live Notebook</h2>
                </div>
                <FeaturedCard c={featured} />
              </ScrollReveal>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section id="all" className="scroll-mt-28 mb-16">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-6">
                  <CalendarDays size={14} className="text-muted-foreground/50" />
                  <h2 className="font-display text-xl font-bold text-foreground">Upcoming</h2>
                </div>
                <div className="space-y-3" data-testid="conference-upcoming-list">
                  {upcoming.map((c) => (
                    <ConferenceCard key={c.slug} c={c} />
                  ))}
                </div>
              </ScrollReveal>
            </section>
          )}

          {/* Field Notes (attended) */}
          <section id="notes" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">Field Notes</h2>
              </div>
              {attended.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground/60 border border-dashed border-border/50 px-4 py-6">
                  No field notes published yet — first one drops alongside the next conference.
                </p>
              ) : (
                <div className="space-y-3" data-testid="conference-attended-list">
                  {attended.map((c) => (
                    <ConferenceCard key={c.slug} c={c} />
                  ))}
                </div>
              )}
            </ScrollReveal>
          </section>
        </div>

        <PageSidebar sections={tocSections} shareTitle="Conference Notebook" />
      </div>
    </div>
  );
};

const FeaturedCard = ({ c }: { c: Conference }) => {
  const totalSessions = c.days.reduce((n, d) => n + d.sessions.length, 0);
  return (
    <Link
      to={`/notebook/conference/${c.slug}`}
      className="block border border-foreground/20 bg-foreground/[0.02] p-8 group hover:border-foreground/40 transition-all border-glow-hover"
      data-testid={`conference-featured-${c.slug}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <h3 className="font-display text-2xl font-bold text-foreground group-hover:text-glow transition-all">
              {c.name} {c.edition || c.year}
            </h3>
            <span
              className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 ${statusStyles[c.status]}`}
            >
              {statusLabel[c.status]}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-muted-foreground/70 font-mono text-[11px] mb-4">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={11} /> {c.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={11} /> {c.city}
            </span>
            {c.organizer && <span>by {c.organizer}</span>}
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">{c.summary}</p>
        </div>
        <ArrowRight
          size={18}
          className="text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all mt-2 shrink-0"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Days", value: c.days.length },
          { label: "Sessions", value: totalSessions },
          { label: "Speakers", value: c.speakerCount ?? 0 },
          { label: "Hours", value: c.hoursOfTalks ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-border px-3 py-2">
            <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-wider mr-2">
              {s.label}
            </span>
            <span className="font-mono text-xs text-foreground/80">{s.value}</span>
          </div>
        ))}
      </div>
    </Link>
  );
};

const ConferenceCard = ({ c }: { c: Conference }) => {
  return (
    <Link
      to={`/notebook/conference/${c.slug}`}
      className="block border border-border p-6 group hover:border-foreground/30 transition-all border-glow-hover"
      data-testid={`conference-card-${c.slug}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-glow transition-all">
              {c.name} {c.edition || c.year}
            </h3>
            <span
              className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 ${statusStyles[c.status]}`}
            >
              {statusLabel[c.status]}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-muted-foreground/70 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={11} /> {c.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={11} /> {c.city}
            </span>
          </div>
        </div>
        <ArrowRight
          size={14}
          className="text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all mt-1 shrink-0"
        />
      </div>
      <p className="font-mono text-xs text-muted-foreground leading-relaxed">{c.topic}</p>
    </Link>
  );
};

export default ConferenceNotebook;
