"use client";

import { useMemo, useState } from "react";
import {
  FRAMEWORK,
  FRAMEWORK_FAMILIES,
  type FrameworkDimension,
  type FrameworkSelection,
} from "@/data/personaFramework";

/**
 * The whole library on one surface, the way the workbook is one worksheet.
 *
 * Every dimension is server-rendered with no filter applied, so a crawler or
 * a reader with scripts blocked gets all 463 rows; the filter is an
 * enhancement that narrows what is already on the page. Rows are dense on
 * purpose: this is a reference to search and cite, not a page to read top to
 * bottom, and each row carries an id so a cited dimension has a URL.
 */

const SELECTIONS: FrameworkSelection[] = ["Single", "Multiple", "Numeric", "Text", "Repeated", "Scale"];
const HANDLINGS = Array.from(new Set(FRAMEWORK.map((d) => d.handling))).sort();

const chip = (on: boolean) =>
  `font-mono text-[10px] uppercase tracking-wider border px-2 py-1 transition-colors ${
    on ? "border-foreground/40 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
  }`;

function matches(d: FrameworkDimension, q: string): boolean {
  if (!q) return true;
  const hay = `${d.id} ${d.name} ${d.values.join(" ")} ${d.rule} ${d.ask} ${d.basis}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export default function FrameworkBrowser() {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("");
  const [sel, setSel] = useState<FrameworkSelection[]>([]);
  const [handling, setHandling] = useState<string[]>([]);

  const shown = useMemo(
    () =>
      FRAMEWORK.filter(
        (d) =>
          (!family || d.family === family) &&
          (sel.length === 0 || sel.includes(d.selection)) &&
          (handling.length === 0 || handling.includes(d.handling)) &&
          matches(d, q),
      ),
    [q, family, sel, handling],
  );

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const filtered = q || family || sel.length || handling.length;

  const field =
    "font-mono text-xs bg-transparent border border-border text-foreground px-2 py-1.5 placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/60";

  return (
    <div className="border border-border bg-card/20">
      {/* Filter bar. State starts empty, so the server renders every row. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 border-b border-border">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search dimensions, values, rules"
          aria-label="Search the framework"
          className={`${field} min-w-[220px] flex-1`}
        />
        {/* A <select> is as wide as its longest option, and "38 Professional &
            organizational buying roles" is wider than a phone. Cap it. */}
        <label className="flex items-center gap-2 min-w-0 max-w-full">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">Family</span>
          <select value={family} onChange={(e) => setFamily(e.target.value)} className={`${field} min-w-0 max-w-[62vw] sm:max-w-none`}>
            <option value="">All 42</option>
            {FRAMEWORK_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.id} {f.name}
              </option>
            ))}
          </select>
        </label>
        <p className="font-mono text-[10px] text-muted-foreground tabular-nums ml-auto" aria-live="polite">
          {shown.length} of {FRAMEWORK.length} dimensions
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setFamily("");
              setSel([]);
              setHandling([]);
            }}
            className={chip(false)}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 border-b border-border">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Selection type">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Selection</span>
          {SELECTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setSel(toggle(sel, s))} aria-pressed={sel.includes(s)} className={chip(sel.includes(s))}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Handling requirement">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Handling</span>
          {HANDLINGS.map((h) => (
            <button key={h} type="button" onClick={() => setHandling(toggle(handling, h))} aria-pressed={handling.includes(h)} className={chip(handling.includes(h))}>
              {h}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && (
        <p className="font-mono text-xs text-muted-foreground px-4 py-6">
          Nothing matches. The library is extensible: a missing dimension is what P457 is for.
        </p>
      )}

      {FRAMEWORK_FAMILIES.map((f) => {
        const rows = shown.filter((d) => d.family === f.id);
        if (rows.length === 0) return null;
        return (
          <section key={f.id} id={f.slug} aria-labelledby={`${f.slug}-h`} className="border-b border-border last:border-b-0 scroll-mt-28">
            <div className="flex items-baseline gap-3 px-4 py-3 bg-background/60">
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{f.id}</span>
              <h3 id={`${f.slug}-h`} className="font-display text-base font-bold text-foreground">
                {f.name}
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {rows.length === f.count ? f.count : `${rows.length} of ${f.count}`}
              </span>
            </div>
            <ol>
              {rows.map((d) => (
                <li
                  key={d.id}
                  id={d.id}
                  className="grid sm:grid-cols-[minmax(0,230px)_minmax(0,1fr)] gap-x-6 gap-y-2 px-4 py-3 border-t border-border/40 scroll-mt-28"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-muted-foreground tabular-nums">{d.id}</p>
                    <h4 className="font-display text-sm font-bold text-foreground leading-snug">{d.name}</h4>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {d.selection} · {d.handling}
                    </p>
                    {d.scope && <p className="font-mono text-[10px] text-muted-foreground/80 mt-1 leading-snug">{d.scope}</p>}
                  </div>
                  <div className="min-w-0 font-mono text-[11px] leading-relaxed">
                    <p className="text-foreground/85">{d.values.join(" · ")}</p>
                    <p className="text-muted-foreground mt-1">
                      <span className="text-foreground">Rule.</span> {d.rule}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      <span className="text-foreground">Ask.</span> {d.ask}
                    </p>
                    {d.evidence && (
                      <p className="text-muted-foreground mt-1">
                        <span className="text-foreground">Evidence.</span> {d.evidence}
                      </p>
                    )}
                    <p className="text-muted-foreground/80 mt-1">
                      {d.basis}
                      {d.sourceUrl && (
                        <>
                          {" "}
                          <a
                            href={d.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline decoration-border hover:decoration-foreground transition-colors"
                          >
                            Source ↗
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
