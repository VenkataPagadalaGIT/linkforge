"use client";

/**
 * DailyUsePanel: habit, not reach.
 *
 * "Ever use" says a platform is reachable. "Daily use" says it is a habit,
 * and it is the closer answer to what people mean when they ask where an
 * audience spends its time. Kept visually distinct and separately sourced,
 * because it is a different survey with a different sample and field window.
 */

import { useState } from "react";
import PlatformMark from "./PlatformMark";
import { DAILY_USE, PLATFORMS } from "@/data/personas";

const COLS = ["facebook", "youtube", "tiktok", "x"] as const;
const GROUPS = [
  { key: "all", label: "Everyone" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "race", label: "Race" },
  { key: "income", label: "Income" },
  { key: "education", label: "Education" },
  { key: "community", label: "Community" },
] as const;

export default function DailyUsePanel() {
  const [group, setGroup] = useState<string>("age");
  const rows = DAILY_USE.filter((r) => r.dimension === group || r.dimension === "all");
  const colorOf = (id: string) => PLATFORMS.find((p) => p.id === id)?.color ?? "#888";
  const nameOf = (id: string) => PLATFORMS.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="border border-border bg-card/20">
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-1">
          Daily use by
        </span>
        {GROUPS.filter((g) => g.key !== "all").map((g) => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            aria-pressed={group === g.key}
            className={`font-mono text-[11px] px-2.5 py-1 border transition-all ${
              group === g.key
                ? "border-foreground text-foreground bg-foreground/10"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">
                Group
              </th>
              {COLS.map((c) => (
                <th key={c} className="py-3 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">
                  <span className="flex items-center justify-end gap-1.5">
                    <PlatformMark id={c} color={colorOf(c)} size={16} />
                    {nameOf(c)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.segmentId}
                className={`border-b border-border/40 ${r.dimension === "all" ? "bg-secondary/25" : ""}`}
              >
                <td className="py-3 px-4 font-mono text-xs text-foreground whitespace-nowrap">
                  {r.label}
                </td>
                {COLS.map((c) => {
                  const v = r[c];
                  return (
                    <td key={c} className="py-3 px-3 align-middle">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm text-foreground tabular-nums leading-none">
                          {v}
                          <span className="text-[9px] text-muted-foreground ml-0.5">%</span>
                        </span>
                        <span className="block h-[3px] w-full max-w-[70px] bg-secondary/60">
                          <span
                            className="block h-full transition-all duration-500"
                            style={{ width: `${v}%`, background: colorOf(c), opacity: 0.9 }}
                          />
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed p-4 border-t border-border/60">
        % who visit or use each platform at least once a day, combining &quot;several times a day&quot;
        and &quot;about once a day&quot;. A SEPARATE survey from the reach figures above: 5,123 US
        adults, February 24 to March 2 2025. Only these four platforms were asked about. Estimates
        for Asian adults represent English speakers only.
      </p>
    </div>
  );
}
