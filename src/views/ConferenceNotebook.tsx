"use client";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import {
  ArrowLeft,
  Mic,
  CalendarDays,
  MapPin,
  ExternalLink,
  Sparkles,
  BookOpen,
  Notebook as NotebookIcon,
  Users,
} from "lucide-react";
import SEO from "@/components/SEO";

type Status = "attended" | "upcoming" | "speaking";

interface Conference {
  name: string;
  year: number;
  location: string;
  date: string;
  status: Status;
  topic: string;
  notes?: string;
  url?: string;
  takeaways?: string[];
}

// Initial seed — extend over time. Items render newest-first.
const conferences: Conference[] = [
  {
    name: "NeurIPS",
    year: 2026,
    location: "Vancouver, Canada",
    date: "Dec 8–14, 2026",
    status: "upcoming",
    topic: "Foundation models, retrieval, and AI safety",
    url: "https://nips.cc",
  },
  {
    name: "MozCon",
    year: 2026,
    location: "Seattle, WA",
    date: "Aug 3–5, 2026",
    status: "upcoming",
    topic: "AI-driven SEO, AEO, and the evolution of search",
    url: "https://moz.com/mozcon",
  },
  {
    name: "Google I/O",
    year: 2025,
    location: "Mountain View, CA",
    date: "May 2025",
    status: "attended",
    topic: "Gemini, AI Overviews, and search redefined",
    notes:
      "AI Overviews are the new featured snippet. The structured-data + entity + freshness signals matter even more for retrieval into AI answers.",
    takeaways: [
      "Optimise for entity-level recognition, not keyword density",
      "Author + publisher schema are non-trivial trust signals for AI",
      "Programmatic SEO still works when paired with retrieval-grade content",
    ],
  },
  {
    name: "BrightonSEO",
    year: 2025,
    location: "Brighton, UK",
    date: "Apr 2025",
    status: "attended",
    topic: "Technical SEO at enterprise scale",
    notes:
      "Crawl budget and JavaScript rendering are still the highest-leverage technical wins. AEO & GEO are emerging as first-class disciplines.",
    takeaways: [
      "Render-blocking JS is the silent ranking killer for SPAs",
      "Internal linking topology trumps backlink quantity at scale",
      "Schema is the API contract you give to LLMs",
    ],
  },
  {
    name: "SMX Advanced",
    year: 2024,
    location: "Seattle, WA",
    date: "Jun 2024",
    status: "attended",
    topic: "Generative search, structured data, and crawl budget",
    notes:
      "First conference where generative AI was the dominant theme. Engineering-led SEO is the differentiator going forward.",
  },
];

const tocSections = [
  { label: "Overview", id: "overview" },
  { label: "Upcoming", id: "upcoming" },
  { label: "Notes", id: "notes" },
  { label: "Talks", id: "talks" },
];

const statusStyles: Record<Status, string> = {
  attended: "border-foreground/20 text-foreground/70",
  upcoming: "border-emerald-400/40 text-emerald-300/90",
  speaking: "border-amber-400/40 text-amber-300/90",
};

const statusLabel: Record<Status, string> = {
  attended: "Attended",
  upcoming: "Upcoming",
  speaking: "Speaking",
};

const upcoming = conferences.filter((c) => c.status === "upcoming");
const attended = conferences.filter((c) => c.status !== "upcoming");

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
                  { label: "Attended", value: attended.length, icon: BookOpen },
                  { label: "Upcoming", value: upcoming.length, icon: CalendarDays },
                  { label: "Talks", value: 0, icon: Users },
                ].map((s) => {
                  const I = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="border border-border px-4 py-5"
                      data-testid={`conference-stat-${s.label.toLowerCase()}`}
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

          {/* Upcoming */}
          <section id="upcoming" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-6">
                <CalendarDays size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">Upcoming</h2>
              </div>
              {upcoming.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground/60 border border-dashed border-border/50 px-4 py-6">
                  No upcoming conferences on the calendar yet.
                </p>
              ) : (
                <div className="space-y-3" data-testid="conference-upcoming-list">
                  {upcoming.map((c) => (
                    <ConferenceCard key={`${c.name}-${c.year}`} c={c} />
                  ))}
                </div>
              )}
            </ScrollReveal>
          </section>

          {/* Notes (attended) */}
          <section id="notes" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen size={14} className="text-muted-foreground/50" />
                <h2 className="font-display text-xl font-bold text-foreground">Field Notes</h2>
              </div>
              <div className="space-y-3" data-testid="conference-attended-list">
                {attended.map((c) => (
                  <ConferenceCard key={`${c.name}-${c.year}`} c={c} expanded />
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* Talks placeholder */}
          <section id="talks" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="border border-border p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-muted-foreground/40" />
                  <h2 className="font-display text-xl font-bold text-foreground">Talks</h2>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6">
                  Slides and recordings from talks I&apos;ve given live here. Nothing published yet — first one
                  drops alongside the next conference.
                </p>
                <div className="border border-foreground/20 bg-foreground/[0.02] p-4">
                  <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed">
                    <span className="text-foreground">Want me to speak at your event?</span>{" "}
                    Reach out via the{" "}
                    <Link to="/contact" className="text-foreground underline-offset-4 hover:underline">
                      contact page
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </section>
        </div>

        <PageSidebar sections={tocSections} shareTitle="Conference Notebook" />
      </div>
    </div>
  );
};

const ConferenceCard = ({ c, expanded = false }: { c: Conference; expanded?: boolean }) => {
  const Wrap: React.ElementType = c.url ? "a" : "div";
  const wrapProps = c.url
    ? { href: c.url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrap
      {...wrapProps}
      className={`block border border-border p-6 group ${
        c.url ? "hover:border-foreground/30 transition-all border-glow-hover" : ""
      }`}
      data-testid={`conference-card-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-glow transition-all">
              {c.name} {c.year}
            </h3>
            <span
              className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-2 py-1 ${statusStyles[c.status]}`}
            >
              {statusLabel[c.status]}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-muted-foreground/70 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={11} /> {c.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={11} /> {c.location}
            </span>
          </div>
        </div>
        {c.url && (
          <ExternalLink
            size={14}
            className="text-muted-foreground/30 group-hover:text-foreground transition-colors mt-1 shrink-0"
          />
        )}
      </div>

      <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">{c.topic}</p>

      {expanded && c.notes && (
        <p className="font-mono text-xs text-foreground/80 leading-relaxed border-l-2 border-foreground/20 pl-4 mb-3">
          {c.notes}
        </p>
      )}

      {expanded && c.takeaways && c.takeaways.length > 0 && (
        <ul className="space-y-1.5 mt-3">
          {c.takeaways.map((t, i) => (
            <li
              key={i}
              className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed pl-4 relative"
            >
              <span className="absolute left-0 text-foreground/40">→</span>
              {t}
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
};

export default ConferenceNotebook;
