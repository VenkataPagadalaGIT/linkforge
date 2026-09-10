"use client";

/**
 * The two questions everyone conflates.
 *
 * "18-24 year olds are 35.4% of Snapchat's audience" and "58% of US adults
 * under 30 use Snapchat" look like rival estimates of one number. They are
 * answers to different questions:
 *
 *   COMPOSITION  of everyone on the platform, what share are this group?
 *                Columns sum to 100. Comes from ad dashboards.
 *   PENETRATION  of this group, what share are on the platform?
 *                Columns do not sum to anything. Comes from surveys.
 *
 * You cannot get one from the other without knowing how many people are in
 * each group, and no page that prints both ever does that step. The confusion
 * is expensive: composition tells you who is already there, penetration tells
 * you who you can still reach, and a budget built on the wrong one buys the
 * wrong audience.
 *
 * This makes the difference visible by letting you flip between them on the
 * same groups and watch the ranking change.
 */

import { useState } from "react";

export interface Band {
  label: string;
  /** Share of THIS GROUP who use the platform. Measured. */
  penetration?: number;
  penetrationN?: number;
  penetrationMoe?: number;
  /** Share of THE PLATFORM who are this group. From the ad platform. */
  composition?: number;
}

export default function TwoQuestions({
  platform,
  bands,
  penetrationSource,
  penetrationUrl,
  compositionSource,
  compositionUrl,
}: {
  platform: string;
  bands: Band[];
  penetrationSource: string;
  penetrationUrl: string;
  compositionSource: string;
  compositionUrl: string;
}) {
  const [mode, setMode] = useState<"penetration" | "composition">("penetration");

  const rows = bands
    .map((b) => ({ ...b, value: mode === "penetration" ? b.penetration : b.composition }))
    .filter((b) => b.value !== undefined) as (Band & { value: number })[];
  const max = Math.max(...rows.map((r) => r.value), 1);
  const sum = rows.reduce((n, r) => n + r.value, 0);

  const isPen = mode === "penetration";

  return (
    <div className="border border-border bg-card/20">
      <div className="p-5 border-b border-border">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
          Two questions, one platform
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setMode("penetration")}
            aria-pressed={isPen}
            className={`flex-1 text-left px-3 py-2.5 border transition-all ${
              isPen ? "border-foreground text-foreground bg-foreground/10" : "border-border/60 text-muted-foreground hover:border-foreground/40"
            }`}
          >
            <span className="block font-mono text-[11px] mb-0.5">
              What share of this group uses {platform}?
            </span>
            <span className="block font-mono text-[10px] text-muted-foreground">
              Penetration · measured by survey
            </span>
          </button>
          <button
            onClick={() => setMode("composition")}
            aria-pressed={!isPen}
            className={`flex-1 text-left px-3 py-2.5 border transition-all ${
              !isPen ? "border-foreground text-foreground bg-foreground/10" : "border-border/60 text-muted-foreground hover:border-foreground/40"
            }`}
          >
            <span className="block font-mono text-[11px] mb-0.5">
              What share of {platform} is this group?
            </span>
            <span className="block font-mono text-[10px] text-muted-foreground">
              Composition · reported by the ad platform
            </span>
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground w-28 shrink-0">
                {r.label}
              </span>
              <span className="flex-1 h-3 bg-secondary/50">
                <span
                  className="block h-full transition-all duration-500"
                  style={{
                    width: `${(r.value / max) * 100}%`,
                    background: isPen ? "#10b981" : "#f59e0b",
                    opacity: 0.75,
                  }}
                />
              </span>
              <span className="font-mono text-xs text-foreground w-12 text-right tabular-nums shrink-0">
                {r.value}%
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/90 w-24 text-right shrink-0">
                {isPen && r.penetrationN
                  ? `n=${r.penetrationN.toLocaleString()} ±${r.penetrationMoe}`
                  : ""}
              </span>
            </div>
          ))}
        </div>

        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-4 pt-4 border-t border-border/50">
          {isPen ? (
            <>
              These add to {Math.round(sum)}%, which means nothing: each bar is a separate
              question about a separate group, so there is no total to reach. This is the number
              that tells you who you can still reach.{" "}
              <a href={penetrationUrl} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-border hover:text-glow transition-all">
                {penetrationSource}
              </a>
            </>
          ) : (
            <>
              These add to roughly 100% because every user falls in exactly one band. That is the
              tell: a column that sums to 100 is describing the platform, not the country. It
              tells you who is already there, and nothing about who is not.{" "}
              <a href={compositionUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-foreground underline decoration-border hover:text-glow transition-all">
                {compositionSource}
              </a>
            </>
          )}
        </p>

        <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-3">
          You cannot convert between these without knowing how many people are in each band, and
          the bands here do not even line up: the survey asks US adults in 18-29, the ad platform
          reports 18-24 worldwide including under-18s it is not supposed to have. That is why this
          page shows them separately instead of quietly averaging them into one wrong number.
        </p>
      </div>
    </div>
  );
}
