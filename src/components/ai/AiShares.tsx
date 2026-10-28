"use client";
import * as React from "react";
import { AI_SHARES, type ShareSegment } from "@/data/aiIntel";
import { logoUrl } from "@/data/aiLogos";
import { dayMonthYear } from "./intelModel";

/**
 * Market shares, one card per segment: each company's share with its bar, earlier periods where the source gives
 * them, the part of the market the source does not break out, the estimator and period, and the exact sentence
 * every figure comes from. Shares are estimates by the named firm unless a company's own filing states them.
 */

export const isShareMetric = (metric: string) => metric.startsWith("share_");
/** The segments an entity has a share in. */
export const sharesOf = (id: string) => AI_SHARES.filter((g) => g.rows.some((r) => r.entity === id));
export const shareSegment = (metric: string) => AI_SHARES.find((g) => g.metric === metric);
/** 72.5% stays 72.5%; 40% stays 40%. */
export const pctText = (v: number) => `${Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : v.toFixed(1)}%`;
const shortName = (name: string) => {
  const s = name.replace(/\s*\([^)]*\)\s*$/, "");
  return s.length >= 2 ? s : name;
};

export function ShareCard({ seg, highlight, onPick }: { seg: ShareSegment; highlight?: string | null; onPick?: (id: string) => void }) {
  const listed = seg.rows.reduce((a, r) => a + r.value, 0);
  const others = Math.round((100 - listed) * 10) / 10;
  const max = Math.max(others, ...seg.rows.map((r) => r.value), 1);
  // One quote can carry several companies' shares (Amazon, Microsoft, Google "respectively"): show it once.
  const quotes = [...new Map(seg.rows.filter((r) => r.quote).map((r) => [r.quote as string, r])).values()];
  return (
    <div className="border border-border p-4" data-testid="ai-share-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">{seg.label}</h4>
        <span className="font-mono text-[10px] text-muted-foreground">
          {seg.period} · {seg.estimator}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{seg.measure}</p>
      <ul className="mt-3 space-y-2">
        {seg.rows.map((r) => {
          const on = highlight === r.entity;
          const logo = logoUrl(r.entity);
          return (
            <li key={r.entity} className="font-mono text-[11px]">
              <div className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_3.5rem] items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPick?.(r.entity)}
                  disabled={!onPick}
                  title={r.name}
                  className={`flex min-w-0 items-center gap-1.5 text-left ${onPick ? "hover:underline" : ""} ${on ? "font-bold text-foreground" : "text-foreground/90"}`}
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0 bg-white object-contain" loading="lazy" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 border border-foreground/30" aria-hidden="true" />
                  )}
                  <span className="truncate">{shortName(r.name)}</span>
                </button>
                <span className="block h-2 w-full bg-foreground/10" aria-hidden="true">
                  <span className={`block h-full ${on ? "bg-emerald-700 dark:bg-emerald-300" : "bg-foreground/55"}`} style={{ width: `${(r.value / max) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums font-bold text-foreground">{pctText(r.value)}</span>
              </div>
              {r.history.length > 0 && (
                <p className="mt-0.5 pl-5 text-[10px] text-muted-foreground">
                  Earlier: {r.history.map((h) => `${h.period} ${pctText(h.value)}`).join(" · ")}
                </p>
              )}
            </li>
          );
        })}
        {others > 0.05 && (
          <li className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_3.5rem] items-center gap-2 font-mono text-[11px] text-muted-foreground" title="100 minus the shares listed above">
            <span className="truncate pl-5">Others</span>
            <span className="block h-2 w-full border border-dashed border-foreground/30" aria-hidden="true">
              <span className="block h-full bg-foreground/15" style={{ width: `${(others / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{pctText(others)}</span>
          </li>
        )}
      </ul>
      <details className="mt-3">
        <summary className="cursor-pointer font-mono text-[10px] text-muted-foreground hover:text-foreground">Exact text in the source</summary>
        <ul className="mt-2 space-y-1.5">
          {quotes.map((r) => (
            <li key={r.entity}>
              <blockquote className="border-l-2 border-border pl-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                &ldquo;{r.quote}&rdquo;
                {r.locator && <span className="block text-[9px] uppercase tracking-[0.12em]">{r.locator}</span>}
              </blockquote>
            </li>
          ))}
        </ul>
        <a href={seg.source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-mono text-[10px] text-muted-foreground underline hover:text-foreground">
          {seg.source.title}
          {seg.source.publishedOn ? `, ${dayMonthYear(seg.source.publishedOn)}` : ""} ↗
        </a>
      </details>
    </div>
  );
}

/** An entity's market shares, for its page: the segments it is in, with its own row highlighted. */
export function EntityShares({ id, onPick }: { id: string; onPick?: (id: string) => void }) {
  const segs = sharesOf(id);
  if (!segs.length) return null;
  return (
    <section className="mb-14" aria-labelledby="market-share" data-testid="ai-entity-shares">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Market share</p>
      <h2 id="market-share" className="sr-only">
        Market share
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {segs.map((g) => (
          <ShareCard key={g.metric} seg={g} highlight={id} onPick={onPick} />
        ))}
      </div>
    </section>
  );
}
