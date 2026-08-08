"use client";
import { useState, useMemo } from "react";
import { Link } from "@/lib/router-shim";
import { roadmapTopics, PHASES, type RoadmapTopic, type RoadmapResource } from "@/data/aiRoadmap";
import { roadmapToEncyclopedia, roadmapToContributors } from "@/data/crossLinks";
import { aiContributors } from "@/data/aiContributors";
import { Search, ChevronDown, ChevronUp, Video, BookOpen, Github, Lightbulb, Wrench, GraduationCap, Flag } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import CrossLinks from "@/components/CrossLinks";

const difficultyColors: Record<string, string> = {
  beginner: "border-green-500/30 text-green-400",
  intermediate: "border-yellow-500/30 text-yellow-400",
  advanced: "border-red-500/30 text-red-400",
};

/** When on, only resources that cost nothing are shown. This is the default
 *  because the roadmap's promise is free learning; the toggle exists so the
 *  paid classics are still discoverable for anyone who can buy them. */
const ResourceList = ({ items, icon: Icon, label, freeOnly }: { items: RoadmapResource[]; icon: React.ElementType; label: string; freeOnly?: boolean }) => {
  const shown = freeOnly ? items.filter((i) => i.access !== "paid") : items;
  if (!shown.length) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-2">
        <Icon size={11} /> {label} ({shown.length})
      </p>
      <div className="space-y-1">
        {shown.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-muted-foreground/30 shrink-0">{i + 1}.</span>
            <span className="truncate">{item.title}</span>
            {item.access === "paid" && (
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider border border-orange-600/40 text-orange-700 dark:text-orange-400/80 px-1 leading-[1.4]">
                paid
              </span>
            )}
            {item.access === "freemium" && (
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider border border-sky-600/40 text-sky-700 dark:text-sky-400/80 px-1 leading-[1.4]">
                free tier
              </span>
            )}
          </a>
        ))}
        {/* Author credits sit outside the resource anchor: a link inside a link
            is invalid HTML and browsers drop the inner one. */}
        {shown.some((i) => i.authors?.length) && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/30">by</span>
            {[...new Set(shown.flatMap((i) => i.authors ?? []))].map((id) => {
              const c = aiContributors.find((x) => x.id === id);
              if (!c) return null;
              return (
                <Link
                  key={id}
                  to={`/ai-contributors/${id}`}
                  className="font-mono text-[10px] text-muted-foreground/70 hover:text-foreground underline decoration-dotted decoration-muted-foreground/30 transition-colors"
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const TopicCard = ({ topic, freeOnly }: { topic: RoadmapTopic; freeOnly?: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      // Anchor target for the 3D roadmap shelf: scroll-mt clears the fixed
      // navbar so #topic-<id> lands with the card fully visible.
      id={`topic-${topic.id}`}
      className={`scroll-mt-24 border transition-all ${
        topic.isMilestone
          ? "border-yellow-500/30 bg-yellow-500/[0.03]"
          : "border-border hover:border-foreground/20"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`topic-panel-${topic.id}`}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div className="shrink-0 mt-0.5">
          <div
            className="w-8 h-8 border flex items-center justify-center font-mono text-[10px] font-bold"
            style={{ borderColor: topic.phaseColor + "40", color: topic.phaseColor }}
          >
            {topic.isMilestone ? <Flag size={14} /> : `W${topic.week}`}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-display text-sm font-bold text-foreground">
              {topic.topic}
            </h3>
            <span className={`font-mono text-[9px] uppercase tracking-wider border px-1.5 py-0.5 ${difficultyColors[topic.difficulty]}`}>
              {topic.difficulty}
            </span>
          </div>
          {/* Teaser only while collapsed: the panel below always renders the
              full description (kept in the DOM for crawlers), so leaving this
              visible when open printed the first two lines twice. Server
              HTML is unaffected, where expanded is always false. */}
          {!expanded && (
            <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-2">
              {topic.description}
            </p>
          )}
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground/30" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground/30" />
          )}
        </div>
      </button>

      {/* Always rendered, collapsed with CSS rather than removed from the DOM.
          Conditional rendering kept every resource link out of the server HTML,
          so search engines and AI crawlers never saw the 400+ free resources
          this page exists to surface. */}
      <div
        id={`topic-panel-${topic.id}`}
        hidden={!expanded}
        className="px-5 pb-5 border-t border-border pt-4"
      >
          <p className="font-mono text-xs text-muted-foreground/60 leading-relaxed mb-5">
            {topic.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ResourceList items={topic.bestVideos} icon={Video} label="Best Videos" freeOnly={freeOnly} />
            <ResourceList items={topic.bestCourses} icon={GraduationCap} label="Courses & Sites" freeOnly={freeOnly} />
            <ResourceList items={topic.books} icon={BookOpen} label="Books & Papers" freeOnly={freeOnly} />
            <ResourceList items={topic.githubRepos} icon={Github} label="GitHub Repos" freeOnly={freeOnly} />
          </div>

          {topic.tools && (
            <div className="mt-4 flex items-start gap-2">
              <Wrench size={11} className="text-muted-foreground/30 mt-0.5 shrink-0" />
              <p className="font-mono text-[11px] text-muted-foreground/40">
                <span className="text-muted-foreground/20 uppercase tracking-wider text-[9px]">Tools: </span>
                {topic.tools}
              </p>
            </div>
          )}

          {topic.proTips && (
            <div className="mt-3 flex items-start gap-2 border border-yellow-600/30 bg-yellow-500/[0.06] dark:border-yellow-500/20 dark:bg-yellow-500/[0.03] p-3">
              <Lightbulb size={12} className="text-yellow-700 dark:text-yellow-500/60 mt-0.5 shrink-0" />
              <p className="font-mono text-[11px] text-yellow-800 dark:text-yellow-200/70 leading-relaxed">
                {topic.proTips}
              </p>
            </div>
          )}

          <CrossLinks
            relatedConcepts={roadmapToEncyclopedia[topic.id]}
            relatedContributors={roadmapToContributors[topic.id]}
          />
      </div>
    </div>
  );
};

const AILearningRoadmap = () => {
  const [search, setSearch] = useState("");
  // Default ON: the page is a free-learning roadmap first.
  const [freeOnly, setFreeOnly] = useState(true);
  const [activePhase, setActivePhase] = useState<string>("");

  const filtered = useMemo(() => {
    let items = roadmapTopics;
    if (activePhase) {
      items = items.filter((t) => t.phase.includes(activePhase));
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.topic.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tools.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activePhase]);

  const stats = useMemo(() => {
    const videos = roadmapTopics.reduce((s, t) => s + t.bestVideos.length, 0);
    const courses = roadmapTopics.reduce((s, t) => s + t.bestCourses.length, 0);
    const repos = roadmapTopics.reduce((s, t) => s + t.githubRepos.length, 0);
    const books = roadmapTopics.reduce((s, t) => s + t.books.length, 0);
    return { videos, courses, repos, books };
  }, []);

  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: "Topics", value: roadmapTopics.filter(t => !t.isMilestone).length },
          { label: "Videos", value: `${stats.videos}+` },
          { label: "Courses", value: `${stats.courses}+` },
          { label: "Repos", value: `${stats.repos}+` },
          { label: "Books", value: `${stats.books}+` },
          { label: "Milestones", value: roadmapTopics.filter(t => t.isMilestone).length },
        ].map((s) => (
          <div key={s.label}>
            <p className="font-mono text-lg font-bold text-foreground">{s.value}</p>
            <p className="font-mono text-[9px] text-muted-foreground/25 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
        <input
          type="text"
          placeholder="Search topics, tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border border-border pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-foreground/30"
        />
      </div>

      {/* Phase filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setActivePhase("")}
          className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all ${
            !activePhase ? "border-foreground text-foreground" : "border-border text-muted-foreground/30 hover:text-muted-foreground"
          }`}
        >
          All Phases
        </button>
        {PHASES.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setActivePhase(activePhase === phase.label.split(": ")[1] ? "" : phase.label.split(": ")[1])}
            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all ${
              activePhase === phase.label.split(": ")[1]
                ? "text-foreground"
                : "border-border text-muted-foreground/30 hover:text-muted-foreground"
            }`}
            style={
              activePhase === phase.label.split(": ")[1]
                ? { borderColor: phase.color + "60", color: phase.color }
                : {}
            }
          >
            {phase.emoji} {phase.label.split(": ")[1]}
          </button>
        ))}
      
        <button
          type="button"
          onClick={() => setFreeOnly((v) => !v)}
          aria-pressed={freeOnly}
          className={`font-mono text-[10px] uppercase tracking-wider border px-2.5 py-1.5 transition-all ${
            freeOnly
              ? "border-green-600/50 text-green-700 dark:text-green-400 bg-green-500/[0.06]"
              : "border-border text-muted-foreground/60 hover:text-foreground"
          }`}
          title="Hide anything that costs money"
        >
          {freeOnly ? "✓ Free only" : "Free only"}
        </button>
      </div>

      {/* Topics */}
      <div className="space-y-2">
        {filtered.map((topic) => (
          <ScrollReveal key={topic.id} delay={0}>
            <TopicCard topic={topic} freeOnly={freeOnly} />
          </ScrollReveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="font-mono text-xs text-muted-foreground/30 text-center py-10">
          No topics found matching your search.
        </p>
      )}
    </div>
  );
};

export default AILearningRoadmap;
