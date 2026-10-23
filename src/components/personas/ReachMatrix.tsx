"use client";

/**
 * ReachMatrix: the whole published dataset as one grid.
 *
 * Replaces a 42-row text table. Every cell carries the number AND a bar in
 * the platform's brand colour scaled to it, so a gradient like Instagram
 * falling 80 to 19 across age, or Reddit climbing 17 to 37 across income,
 * is visible before a single figure is read.
 *
 * The bar rather than a heat-mapped background is deliberate: a saturated
 * cell fill breaks text contrast in one theme or the other, while a bar
 * under stable foreground text reads correctly in both.
 */

import { useState } from "react";
import PlatformMark from "./PlatformMark";
import {
  DIMENSION_LABEL,
  PLATFORMS,
  SEGMENTS,
  type Dimension,
  reachFor,
} from "@/data/personas";

const DIMENSIONS: Dimension[] = ["gender", "age", "income", "education"];

export default function ReachMatrix() {
  const [dim, setDim] = useState<Dimension>("age");
  const cols = SEGMENTS.filter((s) => s.dimension === dim);

  const rows = [...PLATFORMS].sort((a, b) => b.overall - a.overall);

  return (
    <div className="border border-border bg-card/20">
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-1">
          Cut by
        </span>
        {DIMENSIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDim(d)}
            aria-pressed={dim === d}
            className={`font-mono text-[11px] px-2.5 py-1 border transition-all ${
              dim === d
                ? "border-foreground text-foreground bg-foreground/10"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {DIMENSION_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80 sticky left-0 bg-background">
                Platform
              </th>
              <th className="text-right py-3 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80 whitespace-nowrap">
                All adults
              </th>
              {cols.map((c) => (
                <th
                  key={c.id}
                  className="text-right py-3 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80 whitespace-nowrap"
                >
                  {c.label}
                  <span className="block font-normal tracking-normal text-muted-foreground/70 normal-case mt-0.5">
                    ±{c.moe.toFixed(1)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border/40">
                <td className="py-3 px-4 sticky left-0 bg-background">
                  <span className="flex items-center gap-2.5">
                    <PlatformMark id={p.id} color={`var(--pf-${p.id}, ${p.color})`} size={20} />
                    <span className="font-mono text-xs text-foreground">{p.name}</span>
                  </span>
                </td>
                <td className="py-3 px-3 text-right align-middle">
                  <span className="font-mono text-sm text-muted-foreground tabular-nums">
                    {p.overall}
                  </span>
                </td>
                {cols.map((c) => {
                  const v = reachFor(p.id, c.id);
                  if (v === undefined) {
                    return (
                      <td key={c.id} className="py-3 px-3 text-right">
                        <span className="font-mono text-xs text-muted-foreground/70">n/a</span>
                      </td>
                    );
                  }
                  const delta = v - p.overall;
                  return (
                    <td key={c.id} className="py-3 px-3 align-middle">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm text-foreground tabular-nums leading-none">
                          {v}
                          <span className="text-[9px] text-muted-foreground ml-0.5">%</span>
                        </span>
                        <span
                          className="block h-[3px] w-full max-w-[64px]"
                          style={{ background: "hsl(var(--border))" }}
                        >
                          <span
                            className="block h-full transition-all duration-500"
                            style={{ width: `${v}%`, background: `var(--pf-${p.id}, ${p.color})`, opacity: 0.9 }}
                          />
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground tabular-nums leading-none">
                          {delta > 0 ? `+${delta}` : delta === 0 ? "0" : delta}
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
        % of US adults who say they EVER use each platform. Bar length is the value; the small
        figure beneath is the difference from all adults. ± is the published margin of error for
        that column. Pew Research Center, Americans&apos; Social Media Use 2025, n=5,022, surveyed
        Feb 5 to June 18 2025. Columns are read independently: there is no published figure for any
        combination of two columns.
      </p>
    </div>
  );
}
