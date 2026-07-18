"use client";
import { useState, useMemo } from "react";
import { roadmapTopics, PHASES, type RoadmapTopic, type RoadmapResource } from "@/data/aiRoadmap";
import { roadmapToEncyclopedia, roadmapToContributors } from "@/data/crossLinks";
import { Search, ChevronDown, ChevronUp, Video, BookOpen, Github, Lightbulb, Wrench, GraduationCap, Flag } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import CrossLinks from "@/components/CrossLinks";

const difficultyColors: Record<string, string> = {
  beginner: "border-green-500/30 text-green-400",
  intermediate: "border-yellow-500/30 text-yellow-400",
  advanced: "border-red-500/30 text-red-400",
};

const ResourceList = ({ items, icon: Icon, label }: { items: RoadmapResource[]; icon: React.ElementType; label: string }) => {
  if (!items.length) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-2">
        <Icon size={11} /> {label} ({items.length})
      </p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
          >
            <span className="text-muted-foreground/30 mr-2">{i + 1}.</span>
            {item.title}
          </a>
        ))}
      </div>
    </div>
  );
};

const TopicCard = ({ topic }: { topic: RoadmapTopic }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border transition-all ${
        topic.isMilestone
          ? "border-yellow-500/30 bg-yellow-500/[0.03]"
          : "border-border hover:border-foreground/20"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
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
          <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-2">
            {topic.description}
          </p>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground/30" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground/30" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <p className="font-mono text-xs text-muted-foreground/60 leading-relaxed mb-5">
            {topic.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ResourceList items={topic.bestVideos} icon={Video} label="Best Videos" />
            <ResourceList items={topic.bestCourses} icon={GraduationCap} label="Courses & Sites" />
            <ResourceList items={topic.books} icon={BookOpen} label="Books & Papers" />
            <ResourceList items={topic.githubRepos} icon={Github} label="GitHub Repos" />
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
            <div className="mt-3 flex items-start gap-2 border border-yellow-500/10 bg-yellow-500/[0.02] p-3">
              <Lightbulb size={12} className="text-yellow-500/50 mt-0.5 shrink-0" />
              <p className="font-mono text-[11px] text-yellow-200/60 leading-relaxed">
                {topic.proTips}
              </p>
            </div>
          )}

          <CrossLinks
            relatedConcepts={roadmapToEncyclopedia[topic.id]}
            relatedContributors={roadmapToContributors[topic.id]}
          />
        </div>
      )}
    </div>
  );
};

const AILearningRoadmap = () => {
  const [search, setSearch] = useState("");
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
      </div>

      {/* Topics */}
      <div className="space-y-2">
        {filtered.map((topic) => (
          <ScrollReveal key={topic.id} delay={0}>
            <TopicCard topic={topic} />
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
