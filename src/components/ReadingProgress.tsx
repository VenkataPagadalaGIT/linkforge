import { aiContributors, SEGMENT_COLORS } from "@/data/aiContributors";
import { CheckCircle2, Circle } from "lucide-react";

interface Props {
  exploredIds: Set<string>;
}

const ReadingProgress = ({ exploredIds }: Props) => {
  const total = aiContributors.length;
  const explored = aiContributors.filter((c) => exploredIds.has(c.id)).length;
  const progress = total > 0 ? (explored / total) * 100 : 0;

  // Group by segment
  const segments = new Map<string, { total: number; explored: number }>();
  aiContributors.forEach((c) => {
    const seg = segments.get(c.segment) || { total: 0, explored: 0 };
    seg.total++;
    if (exploredIds.has(c.id)) seg.explored++;
    segments.set(c.segment, seg);
  });

  return (
    <div className="border border-border p-6">
      {/* Overall */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">Your Progress</span>
        <span className="font-mono text-sm font-bold text-foreground">{explored}/{total}</span>
      </div>
      <div className="h-2 bg-border mb-6">
        <div
          className="h-full bg-foreground/60 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* By segment */}
      <div className="space-y-3">
        {Array.from(segments.entries()).map(([segment, data]) => {
          const color = SEGMENT_COLORS[segment] || "#888";
          const segProgress = data.total > 0 ? (data.explored / data.total) * 100 : 0;
          return (
            <div key={segment}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {data.explored === data.total ? (
                    <CheckCircle2 size={10} style={{ color }} />
                  ) : (
                    <Circle size={10} className="text-muted-foreground/20" />
                  )}
                  <span className="font-mono text-[9px] text-muted-foreground/50">{segment}</span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/30">{data.explored}/{data.total}</span>
              </div>
              <div className="h-0.5 bg-border ml-5">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${segProgress}%`, backgroundColor: `${color}80` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadingProgress;
