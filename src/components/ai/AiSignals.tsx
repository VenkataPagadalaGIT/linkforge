"use client";
import * as React from "react";
import { AI_SIGNALS, type Horizon, type SignalChart, type SignalGroup, type SignalList } from "@/data/aiSignals";
import { dayMonthYear, monthYear } from "./intelModel";

const HORIZONS: { key: Horizon; title: string; sub: string }[] = [
  { key: "history", title: "History", sub: "how it got here" },
  { key: "now", title: "Now", sub: "this week" },
  { key: "ahead", title: "Ahead", sub: "early signals" },
];
const COLORS = ["#ef4444", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

function compact(v: number): string {
  const a = Math.abs(v);
  for (const [d, s] of [[1e9, "B"], [1e6, "M"], [1e3, "K"]] as const) {
    if (a >= d) {
      const x = v / d;
      return `${x < 100 ? x.toFixed(1) : Math.round(x)}${s}`;
    }
  }
  return Math.round(v).toLocaleString("en-US");
}

/** Lines only in the SVG; every label is HTML so it stays readable at phone width. */
function LineChart({ c }: { c: SignalChart }) {
  const lines = c.lines.filter((l) => l.points.length > 1);
  if (!lines.length) return null;
  const t = (d: string) => Date.parse(d.length === 7 ? `${d}-01` : d);
  const xs = lines.flatMap((l) => l.points.map((p) => t(p[0])));
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const ymax = Math.max(1, ...lines.flatMap((l) => l.points.map((p) => p[1])));
  const gap = (c.grain === "week" ? 10 : 45) * 864e5;
  const W = 600, Hh = 150;
  const seg = (pts: [string, number][]) => {
    const out: string[][] = [[]];
    pts.forEach((p, i) => {
      if (i && t(p[0]) - t(pts[i - 1][0]) > gap) out.push([]);
      out[out.length - 1].push(`${(((t(p[0]) - x0) / Math.max(1, x1 - x0)) * W).toFixed(1)},${(Hh - (p[1] / ymax) * (Hh - 4)).toFixed(1)}`);
    });
    return out.filter((s) => s.length > 1);
  };
  const first = lines.map((l) => l.points[0][0]).sort()[0];
  const last = lines.map((l) => l.points[l.points.length - 1][0]).sort().slice(-1)[0];
  const label = c.grain === "month" ? monthYear : dayMonthYear;
  return (
    <figure className="mt-3 min-w-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{c.title}</span>
        <span className="normal-case tracking-normal">max {compact(ymax)} {c.unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${Hh}`} preserveAspectRatio="none" className="mt-1 h-28 w-full border-b border-l border-border" role="img" aria-label={c.title}>
        {lines.map((l, i) =>
          seg(l.points).map((s, k) => (
            <polyline key={`${l.key}-${k}`} points={s.join(" ")} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          )),
        )}
      </svg>
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
        <span>{label(first)}</span>
        <span>{label(last)}</span>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {lines.map((l, i) => (
          <li key={l.key} className="flex items-center gap-1 font-mono text-[10px] text-foreground">
            <span className="inline-block h-2 w-2 shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            {l.label} <span className="text-muted-foreground">{compact(l.points[l.points.length - 1][1])}</span>
          </li>
        ))}
      </ul>
      {c.note && <p className="mt-1 font-mono text-[10px] leading-snug text-muted-foreground">{c.note}</p>}
    </figure>
  );
}

function ListBlock({ l }: { l: SignalList }) {
  const [open, setOpen] = React.useState(false);
  const rows = open ? l.rows : l.rows.slice(0, 5);
  return (
    <div className="mt-3 min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{l.title}</p>
      <ul className="mt-1 divide-y divide-border border-y border-border">
        {rows.map((r, i) => (
          <li key={`${r.title}-${i}`} className="flex min-w-0 items-baseline gap-2 py-1.5 text-sm">
            {r.date && <span className="w-20 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">{dayMonthYear(r.date)}</span>}
            <span className="min-w-0 flex-1 break-words">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {r.title}
                </a>
              ) : (
                r.title
              )}
              {r.meta && <span className="block truncate font-mono text-[10px] text-muted-foreground">{r.meta}</span>}
            </span>
          </li>
        ))}
      </ul>
      {l.rows.length > 5 && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 font-mono text-[10px] text-muted-foreground underline hover:text-foreground">
          {open ? "Show fewer" : `Show all ${l.rows.length}`}
        </button>
      )}
      {l.note && <p className="mt-1 font-mono text-[10px] leading-snug text-muted-foreground">{l.note}</p>}
    </div>
  );
}

function GroupCard({ g }: { g: SignalGroup }) {
  return (
    <div className="min-w-0 border border-border bg-background p-3" data-testid={`ai-signal-${g.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <h4 className="font-display text-base font-bold text-foreground">{g.title}</h4>
        <span className="font-mono text-[10px] text-muted-foreground">
          {g.sourceUrl ? (
            <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {g.source}
            </a>
          ) : (
            g.source
          )}
          {g.readOn ? ` · read ${dayMonthYear(g.readOn)}` : ""}
        </span>
      </div>
      {g.kpis.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-px border border-border bg-border">
          {g.kpis.map((k) => (
            <div key={k.label} className="min-w-0 bg-background p-2">
              <dt className="font-mono text-[9px] uppercase leading-tight tracking-[0.14em] text-muted-foreground">{k.label}</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">{k.value}</dd>
              {k.sub && <dd className="font-mono text-[9px] leading-snug text-muted-foreground">{k.sub}</dd>}
            </div>
          ))}
        </dl>
      )}
      {g.charts.map((c) => (
        <LineChart key={c.title} c={c} />
      ))}
      {g.lists.map((l) => (
        <ListBlock key={l.title} l={l} />
      ))}
      {g.note && <p className="mt-2 font-mono text-[10px] leading-snug text-muted-foreground">{g.note}</p>}
    </div>
  );
}

/** Every signal we read about the company, sorted into history, now and ahead. */
export function SignalsSection({ id }: { id: string }) {
  const s = AI_SIGNALS[id];
  if (!s?.groups.length) return null;
  return (
    <section className="space-y-4" data-testid="ai-signals">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Signals: history, now and ahead</h3>
        <span className="font-mono text-[10px] text-muted-foreground">public sources · read {dayMonthYear(s.readOn)}</span>
      </div>
      {HORIZONS.map((h) => {
        const gs = s.groups.filter((g) => g.horizon === h.key);
        if (!gs.length) return null;
        return (
          <div key={h.key}>
            <p className="mb-2 font-display text-lg font-bold text-foreground">
              {h.title} <span className="font-mono text-[10px] font-normal text-muted-foreground">{h.sub}</span>
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {gs.map((g) => (
                <GroupCard key={g.id} g={g} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
