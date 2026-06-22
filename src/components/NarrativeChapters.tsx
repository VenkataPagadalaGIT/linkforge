"use client";
import { useState } from "react";
import { NARRATIVE_CHAPTERS, type NarrativeChapter } from "@/data/aiNotebook";
import { aiContributors, SEGMENT_COLORS } from "@/data/aiContributors";
import { ChevronDown, ChevronUp, BookOpen, Lightbulb } from "lucide-react";

interface Props {
  onSelectContributor?: (id: string) => void;
}

const NarrativeChapters = ({ onSelectContributor }: Props) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {NARRATIVE_CHAPTERS.map((chapter) => {
        const isExpanded = expandedId === chapter.id;
        const contributors = chapter.contributorIds
          .map((id) => aiContributors.find((c) => c.id === id))
          .filter(Boolean);

        return (
          <div key={chapter.id} className="border border-border overflow-hidden">
            {/* Chapter header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : chapter.id)}
              className="w-full text-left p-6 sm:p-8 flex items-start justify-between gap-4 group hover:bg-foreground/[0.02] transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] text-muted-foreground/30 tracking-widest">
                    CH.{String(chapter.number).padStart(2, "0")}
                  </span>
                  <BookOpen size={12} className="text-muted-foreground/20" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground group-hover:text-glow transition-all mb-1">
                  {chapter.title}
                </h3>
                <p className="font-mono text-xs text-muted-foreground/60">{chapter.subtitle}</p>
              </div>
              <div className="text-muted-foreground/30 mt-2 shrink-0">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-6 sm:px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Narrative */}
                <div className="border-l-2 border-foreground/10 pl-6 mb-6">
                  <p className="font-mono text-[13px] text-foreground/70 leading-[1.9]">
                    {chapter.narrative}
                  </p>
                </div>

                {/* Key takeaway */}
                <div className="border border-foreground/20 bg-foreground/[0.02] p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={12} className="text-foreground/50" />
                    <span className="font-mono text-[10px] text-foreground/50 uppercase tracking-widest">Key Takeaway</span>
                  </div>
                  <p className="font-mono text-xs text-foreground/70 leading-relaxed italic">
                    {chapter.keyTakeaway}
                  </p>
                </div>

                {/* Featured contributors */}
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-3">
                    Featured in this chapter
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contributors.map((c) => {
                      if (!c) return null;
                      const color = SEGMENT_COLORS[c.segment] || "#888";
                      return (
                        <button
                          key={c.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectContributor?.(c.id);
                          }}
                          className="flex items-center gap-2 border border-border px-3 py-2 hover:border-foreground/20 transition-all group/chip"
                        >
                          <div
                            className="w-6 h-6 flex items-center justify-center font-mono text-[8px] font-bold text-background shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {c.name.split(" ").map((w) => w[0]).join("")}
                          </div>
                          <div className="text-left">
                            <p className="font-mono text-[11px] text-foreground group-hover/chip:text-glow transition-all">
                              {c.name}
                            </p>
                            <p className="font-mono text-[9px] text-muted-foreground/30">
                              #{c.rank} · {c.expertType}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NarrativeChapters;
