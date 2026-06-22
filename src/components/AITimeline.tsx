"use client";
import { AI_TIMELINE, aiContributors, SEGMENT_COLORS } from "@/data/aiContributors";

interface Props {
  onSelectContributor?: (id: string) => void;
}

const AITimeline = ({ onSelectContributor }: Props) => {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-8">
        {AI_TIMELINE.map((entry) => (
          <div key={entry.year} className="relative pl-12 sm:pl-16">
            {/* Year marker */}
            <div className="absolute left-0 top-0 w-8 sm:w-12 h-8 sm:h-12 border border-border bg-background flex items-center justify-center">
              <span className="font-mono text-[10px] sm:text-xs text-foreground font-bold">{entry.year}</span>
            </div>

            {/* Connector */}
            <div className="absolute left-4 sm:left-6 top-4 sm:top-6 w-4 sm:w-6 h-px bg-border" />

            <div className="space-y-2 pt-1">
              {entry.events.map((event, i) => {
                const contributor = aiContributors.find((c) => c.id === event.contributorId);
                const color = contributor ? SEGMENT_COLORS[contributor.segment] || "#888" : "#888";

                return (
                  <button
                    key={`${entry.year}-${i}`}
                    onClick={() => onSelectContributor?.(event.contributorId)}
                    className="w-full text-left border border-border p-3 sm:p-4 hover:border-foreground/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                          {contributor?.name || event.contributorId}
                        </span>
                        <p className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                          {event.event}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AITimeline;
