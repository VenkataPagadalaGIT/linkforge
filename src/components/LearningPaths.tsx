"use client";
import { LEARNING_PATHS, aiContributors, SEGMENT_COLORS } from "@/data/aiContributors";
import { BookOpen, Clock, Zap, Flame, Sparkles } from "lucide-react";

interface Props {
  onSelectContributor?: (id: string) => void;
  exploredIds?: Set<string>;
}

const difficultyConfig = {
  beginner: { icon: Zap, label: "Beginner", color: "text-green-400" },
  intermediate: { icon: Flame, label: "Intermediate", color: "text-yellow-400" },
  advanced: { icon: Sparkles, label: "Advanced", color: "text-red-400" },
};

const LearningPaths = ({ onSelectContributor, exploredIds = new Set() }: Props) => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {LEARNING_PATHS.map((path) => {
        const contributors = path.contributorIds
          .map((id) => aiContributors.find((c) => c.id === id))
          .filter(Boolean);
        const explored = path.contributorIds.filter((id) => exploredIds.has(id)).length;
        const total = path.contributorIds.length;
        const progress = total > 0 ? (explored / total) * 100 : 0;
        const DiffIcon = difficultyConfig[path.difficulty].icon;

        return (
          <div key={path.id} className="border border-border p-6 border-glow-hover group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <BookOpen size={16} className="text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
              <div className="flex items-center gap-1.5">
                <DiffIcon size={10} className={difficultyConfig[path.difficulty].color} />
                <span className={`font-mono text-[9px] ${difficultyConfig[path.difficulty].color}`}>
                  {difficultyConfig[path.difficulty].label}
                </span>
              </div>
            </div>

            <h3 className="font-display text-base font-bold text-foreground mb-2">{path.title}</h3>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-4">{path.description}</p>

            {/* Time */}
            <div className="flex items-center gap-1.5 mb-4">
              <Clock size={10} className="text-muted-foreground/30" />
              <span className="font-mono text-[9px] text-muted-foreground/40">{path.estimatedTime}</span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] text-muted-foreground/30">Progress</span>
                <span className="font-mono text-[9px] text-muted-foreground/40">{explored}/{total}</span>
              </div>
              <div className="h-1 bg-border">
                <div
                  className="h-full bg-foreground/40 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Contributor chips */}
            <div className="flex flex-wrap gap-1.5">
              {contributors.map((c) => {
                if (!c) return null;
                const isExplored = exploredIds.has(c.id);
                const color = SEGMENT_COLORS[c.segment] || "#888";
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectContributor?.(c.id)}
                    className={`font-mono text-[9px] px-2 py-1 border transition-all ${
                      isExplored
                        ? "border-foreground/30 text-foreground"
                        : "border-border text-muted-foreground/40 hover:text-foreground hover:border-foreground/20"
                    }`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                      style={{ backgroundColor: isExplored ? color : `${color}40` }}
                    />
                    {c.name.split(" ").pop()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LearningPaths;
