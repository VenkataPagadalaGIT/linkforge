"use client";
import * as React from "react";
import { KIND_FILTERS, type KindFilter, type SourceFilter } from "@/lib/linkedinSearch";

/**
 * The archive's search, source, kind and year filters. The hub shows them in full above the graph; the full-screen views
 * and the home page's Universe show the compact form (one row, the year as a menu), driving the same state.
 */
interface Props {
  query: string;
  onQuery: (q: string) => void;
  onSearchFocus?: () => void;
  kind: KindFilter;
  onKind: (k: KindFilter) => void;
  kindCounts: Record<KindFilter, number>;
  year: string | null;
  onYear: (y: string | null) => void;
  years: string[];
  /** Where entries come from (LinkedIn today; more sources join as their data arrives). */
  source: SourceFilter;
  onSource: (s: SourceFilter) => void;
  sources: { id: Exclude<SourceFilter, "all">; label: string; count: number }[];
  compact?: boolean;
  /** Test ids only on the hub's copy, so the page never has two elements with one id. */
  testIds?: boolean;
}

export default function ArchiveFilters({ query, onQuery, onSearchFocus, kind, onKind, kindCounts, year, onYear, years, source, onSource, sources, compact = false, testIds = false }: Props) {
  const total = sources.reduce((n, s) => n + s.count, 0);
  const chip = (on: boolean) =>
    `font-mono uppercase transition-colors border ${compact ? "text-[10px] tracking-[0.15em] px-2 py-1" : "text-[10px] tracking-[0.2em] px-3 py-2"} ${
      on ? "border-foreground text-foreground bg-foreground/[0.06]" : "border-border text-muted-foreground/70 hover:text-foreground hover:border-foreground/40"
    }`;
  const search = (
    <label className={`flex items-center gap-2 border border-border ${compact ? "min-w-[220px] flex-1 px-2 py-1 sm:max-w-[320px]" : "flex-1 min-w-[240px] px-3 py-2"}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Search</span>
      <input
        type="search"
        value={query}
        onFocus={onSearchFocus}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={compact ? "seoweek, knowledge graph…" : "seoweek, knowledge graph, Claude, Search Console…"}
        className={`flex-1 bg-transparent outline-none font-mono text-foreground placeholder:text-muted-foreground/70 ${compact ? "text-[12px]" : "text-sm"}`}
        data-testid={testIds ? "linkedin-search" : undefined}
      />
    </label>
  );
  const kinds = KIND_FILTERS.map((k) =>
    kindCounts[k.id] || k.id === "all" ? (
      <button key={k.id} type="button" onClick={() => onKind(k.id)} aria-pressed={kind === k.id} className={chip(kind === k.id)} data-testid={testIds ? `linkedin-kind-${k.id}` : undefined}>
        {k.label} · {kindCounts[k.id]}
      </button>
    ) : null,
  );
  if (compact)
    return (
      <div className="flex flex-wrap items-center gap-1" data-testid="linkedin-filters-compact">
        {search}
        <label className="flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
          Source
          <select value={source} onChange={(e) => onSource(e.target.value as SourceFilter)} className="bg-transparent text-foreground outline-none" aria-label="Source">
            <option value="all" className="bg-background">
              All · {total}
            </option>
            {sources.map((s) => (
              <option key={s.id} value={s.id} className="bg-background">
                {s.label} · {s.count}
              </option>
            ))}
          </select>
        </label>
        {kinds}
        <label className="flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
          Year
          <select value={year ?? ""} onChange={(e) => onYear(e.target.value || null)} className="bg-transparent text-foreground outline-none" aria-label="Year">
            <option value="" className="bg-background">All</option>
            {years.map((y) => (
              <option key={y} value={y} className="bg-background">
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  return (
    <>
      <div className="li-js flex flex-wrap items-center gap-2 mb-3">{search}</div>
      <div className="li-js flex flex-wrap items-center gap-1.5 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mr-1">Source</span>
        <button type="button" onClick={() => onSource("all")} aria-pressed={source === "all"} className={chip(source === "all")} data-testid={testIds ? "linkedin-source-all" : undefined}>
          All · {total}
        </button>
        {sources.map((s) => (
          <button key={s.id} type="button" onClick={() => onSource(source === s.id ? "all" : s.id)} aria-pressed={source === s.id} className={chip(source === s.id)} data-testid={testIds ? `linkedin-source-${s.id}` : undefined}>
            {s.label} · {s.count}
          </button>
        ))}
      </div>
      <div className="li-js flex flex-wrap items-center gap-1.5 mb-3">{kinds}</div>
      <div className="li-js flex flex-wrap items-center gap-1.5 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mr-1">Year</span>
        <button type="button" onClick={() => onYear(null)} aria-pressed={!year} className={chip(!year)}>
          All
        </button>
        {years.map((y) => (
          <button key={y} type="button" onClick={() => onYear(year === y ? null : y)} aria-pressed={year === y} className={chip(year === y)}>
            {y}
          </button>
        ))}
      </div>
    </>
  );
}
