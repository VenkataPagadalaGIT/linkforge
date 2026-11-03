"use client";

/**
 * PersonaExplorer: build an audience from the top down and watch real
 * survey data respond.
 *
 * The design problem this solves. Every persona tool on the market gets
 * MORE confident as you add attributes: pick man, then 33, then dad, then
 * $100k, and it hands you a single confident profile. That profile is
 * arithmetic fiction, because no study measured that intersection.
 *
 * Pew publishes MARGINALS, not crosstabs. There is a published figure for
 * men, and one for 30-49s, and none for men aged 30-49. So this explorer
 * inverts the usual behaviour: each lens you add is shown SEPARATELY, and
 * the moment you hold two lenses at once it says plainly that no study
 * measures the overlap. Selecting an attribute Pew does not publish at all
 * (children, city, purchase intent) returns the reason rather than a number.
 *
 * Losing confidence as you add detail is the honest behaviour, and it is
 * the thing worth teaching.
 */

import { useMemo, useState } from "react";
import PlatformMark from "./PlatformMark";
import {
  DIMENSION_LABEL,
  PLATFORMS,
  SEGMENTS,
  UNMEASURED_ATTRIBUTES,
  type Dimension,
  reachFor,
  segmentById,
} from "@/data/personas";

const DIMENSIONS: Dimension[] = ["gender", "age", "income", "education"];

export default function PersonaExplorer() {
  // One selection per dimension. Null means "all US adults" for that lens.
  const [picked, setPicked] = useState<Partial<Record<Dimension, string>>>({});
  const [unmeasured, setUnmeasured] = useState<string[]>([]);

  const activeIds = DIMENSIONS.map((d) => picked[d]).filter(Boolean) as string[];
  const lensCount = activeIds.length;

  /** Ranked platforms for the single active lens, else the national baseline. */
  const primaryId = activeIds[0];
  const ranked = useMemo(() => {
    const rows = PLATFORMS.map((p) => {
      const pct = primaryId ? reachFor(p.id, primaryId) ?? p.overall : p.overall;
      return { ...p, pct, delta: pct - p.overall };
    });
    return rows.sort((a, b) => b.pct - a.pct);
  }, [primaryId]);

  const primary = primaryId ? segmentById(primaryId) : undefined;

  const toggle = (d: Dimension, id: string) =>
    setPicked((prev) => ({ ...prev, [d]: prev[d] === id ? undefined : id }));

  const reset = () => {
    setPicked({});
    setUnmeasured([]);
  };

  return (
    <div className="border border-border bg-card/20">
      {/* Control deck */}
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Build an audience · Data responds live
          </p>
          {(lensCount > 0 || unmeasured.length > 0) && (
            <button
              onClick={reset}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-3">
          {DIMENSIONS.map((d) => (
            <div key={d} className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 w-32 shrink-0">
                {DIMENSION_LABEL[d]}
              </span>
              {SEGMENTS.filter((s) => s.dimension === d).map((s) => {
                const on = picked[d] === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(d, s.id)}
                    aria-pressed={on}
                    className={`font-mono text-[11px] px-2.5 py-1 border transition-all ${
                      on
                        ? "border-foreground text-foreground bg-foreground/10"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          ))}

          {/* The attributes people reach for that no study publishes. */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 w-32 shrink-0">
              Also try
            </span>
            {UNMEASURED_ATTRIBUTES.map((a) => {
              const on = unmeasured.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() =>
                    setUnmeasured((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))
                  }
                  aria-pressed={on}
                  className={`font-mono text-[11px] px-2.5 py-1 border border-dashed transition-all ${
                    on
                      ? "border-foreground/70 text-foreground bg-foreground/5"
                      : "border-border/60 text-muted-foreground/80 hover:text-foreground"
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Honesty banners, before the numbers rather than after them */}
      {lensCount > 1 && (
        <div className="px-5 py-3 border-b border-border bg-secondary/30">
          <p className="font-mono text-[11px] text-foreground leading-relaxed">
            You are holding {lensCount} lenses at once. No study measures that overlap.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-1">
            Pew publishes each dimension separately. Showing{" "}
            <span className="text-foreground">{primary?.label}</span> below, and listing the others
            as their own separate readings. Multiplying them together would invent a number.
          </p>
        </div>
      )}

      {unmeasured.length > 0 && (
        <div className="px-5 py-3 border-b border-border">
          {UNMEASURED_ATTRIBUTES.filter((a) => unmeasured.includes(a.id)).map((a) => (
            <p key={a.id} className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-1">
              <span className="text-foreground">{a.label}: no data. </span>
              {a.why}
            </p>
          ))}
        </div>
      )}

      {/* The bars */}
      <div className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <p className="font-mono text-[11px] text-foreground">
            {primary ? primary.label : "All US adults"}
            <span className="text-muted-foreground"> · ever use each platform</span>
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/80">
            {primary
              ? `n=${primary.n.toLocaleString()} · margin of error ±${primary.moe.toFixed(1)}pp`
              : "n=5,022 · margin of error ±1.9pp"}
          </p>
        </div>

        <div className="space-y-2.5">
          {ranked.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="shrink-0" style={{ lineHeight: 0 }}>
                <PlatformMark id={p.id} color={`var(--pf-${p.id}, ${p.color})`} />
              </span>
              <span className="font-mono text-[11px] text-muted-foreground w-20 shrink-0">
                {p.name}
              </span>
              <div className="flex-1 h-5 bg-secondary/40 relative overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{ width: `${p.pct}%`, background: `var(--pf-${p.id}, ${p.color})`, opacity: 0.85 }}
                />
              </div>
              <span className="font-mono text-sm text-foreground w-11 text-right shrink-0 tabular-nums">
                {p.pct}%
              </span>
              <span
                className="font-mono text-[10px] w-14 text-right shrink-0 tabular-nums text-muted-foreground"
                title="Difference from all US adults"
              >
                {primaryId ? (p.delta > 0 ? `+${p.delta}` : p.delta === 0 ? "0" : p.delta) : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Secondary lenses, shown separately and never merged */}
        {lensCount > 1 && (
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
              The other lenses, read separately
            </p>
            <div className="space-y-4">
              {activeIds.slice(1).map((sid) => {
                const seg = segmentById(sid);
                if (!seg) return null;
                const rows = PLATFORMS.map((p) => ({
                  ...p,
                  pct: reachFor(p.id, sid) ?? p.overall,
                }))
                  .sort((a, b) => b.pct - a.pct)
                  .slice(0, 4);
                return (
                  <div key={sid}>
                    <p className="font-mono text-[11px] text-foreground mb-1.5">
                      {seg.label}
                      <span className="text-muted-foreground/80">
                        {" "}
                        · n={seg.n.toLocaleString()} · ±{seg.moe.toFixed(1)}pp
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rows.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 border border-border/60 px-2 py-1"
                        >
                          <PlatformMark id={p.id} color={`var(--pf-${p.id}, ${p.color})`} size={14} />
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {p.name}
                          </span>
                          <span className="font-mono text-[11px] text-foreground tabular-nums">
                            {p.pct}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed mt-5 pt-4 border-t border-border/40">
          Every figure: Pew Research Center, Americans&apos; Social Media Use 2025, surveyed Feb 5 to
          June 18 2025, n=5,022. The right-hand column is the difference from all US adults. Bars are
          the share who say they EVER use a platform, which is reach, not time spent.
        </p>
      </div>
    </div>
  );
}
