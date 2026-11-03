"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { Block, Tone } from "@/data/guides";
import { inline } from "./inline";

/**
 * RichBlocks: the visual block kinds a guide can use (charts, cards, maps,
 * timelines, tabs). Every one renders as plain server HTML or SVG, so the
 * picture and every number in it reach readers, crawlers and agents without
 * scripts. Colors come from the brand's stage tokens (app/globals.css), which
 * carry a light and a dark value each; nothing here hard-codes a theme.
 */

const TONE: Record<Tone, string> = {
  sky: "var(--stage-discover)",
  violet: "var(--stage-explore)",
  amber: "var(--stage-compare)",
  rose: "var(--stage-decide)",
  emerald: "var(--stage-own)",
  muted: "hsl(var(--foreground) / 0.35)",
  fg: "hsl(var(--foreground) / 0.85)",
};
const CYCLE: Tone[] = ["sky", "violet", "amber", "rose", "emerald"];
/** Two decimals: server and browser math can differ in the last digit, which breaks hydration. */
const r2 = (n: number) => Math.round(n * 100) / 100;
const tone = (t: Tone | undefined, i = 0) => TONE[t ?? CYCLE[i % CYCLE.length]];

const kicker = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground";
const Html = ({ text, className, as: Tag = "p" }: { text: string; className?: string; as?: "p" | "span" | "div" }) => (
  <Tag className={className} dangerouslySetInnerHTML={{ __html: inline(text) }} />
);
const Caption = ({ text }: { text?: string }) =>
  text ? <Html text={text} className="font-mono text-[11px] text-muted-foreground/80 mt-2 leading-relaxed [overflow-wrap:anywhere]" /> : null;

type B<K extends Block["kind"]> = Extract<Block, { kind: K }>;

/* ── In plain words ─────────────────────────────────────────────────── */

export function PlainWords({ block }: { block: B<"plain"> }) {
  return (
    <div className="my-6 border-l-2 pl-4 py-1" style={{ borderColor: TONE.emerald }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1.5" style={{ color: TONE.emerald }}>
        In plain words
      </p>
      <Html text={block.text} className="font-display text-lg sm:text-xl text-foreground leading-snug" />
    </div>
  );
}

/* ── Big numbers ────────────────────────────────────────────────────── */

export function Stats({ block }: { block: B<"stats"> }) {
  const n = block.items.length;
  // Two across on phones: four tiles stacked one by one made a long, empty column.
  const cols = n >= 4 ? "grid-cols-2 lg:grid-cols-4" : n === 3 ? "sm:grid-cols-3" : "grid-cols-2";
  return (
    <figure className="my-8">
      <div className={`grid gap-3 ${cols}`}>
        {block.items.map((s, i) => (
          <div key={i} className="border border-border bg-card/30 p-4">
            <p className="font-display text-2xl sm:text-3xl font-bold leading-none" style={{ color: s.tone ? tone(s.tone) : undefined }}>
              {s.value}
            </p>
            <p className={`${kicker} mt-2`}>{s.label}</p>
            {s.note && <Html text={s.note} className="font-mono text-[11px] text-muted-foreground leading-snug mt-2" />}
          </div>
        ))}
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Horizontal bars ────────────────────────────────────────────────── */

export function Bars({ block }: { block: B<"bars"> }) {
  const max = block.max ?? Math.max(...block.items.flatMap((it) => [it.value, it.compare ?? 0]), 1);
  const [l1, l2] = block.legend ?? [];
  return (
    <figure className="my-8">
      {block.title && <p className={`${kicker} mb-3`}>{block.title}</p>}
      {l1 && (
        <div className="flex flex-wrap gap-4 mb-3 font-mono text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-4" style={{ background: TONE.sky }} />
            {l1}
          </span>
          {l2 && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-1 w-4" style={{ background: TONE.amber }} />
              {l2}
            </span>
          )}
        </div>
      )}
      <div className="space-y-2.5">
        {block.items.map((it, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] gap-1 sm:gap-4 items-center">
            {it.href ? (
              <Html text={`[${it.label}](${it.href})`} className="font-mono text-[11.5px] text-foreground/90 truncate" />
            ) : (
              <p className="font-mono text-[11.5px] text-foreground/90 truncate" title={it.label}>
                {it.label}
              </p>
            )}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="h-2.5 bg-foreground/[0.07]">
                  <div className="h-full" style={{ width: `${Math.max(0.5, (it.value / max) * 100)}%`, background: tone(it.tone ?? "sky") }} />
                </div>
                {typeof it.compare === "number" && (
                  <div className="h-1 bg-foreground/[0.05]">
                    <div className="h-full" style={{ width: `${Math.max(0.5, (it.compare / max) * 100)}%`, background: TONE.amber }} />
                  </div>
                )}
              </div>
              <span className="font-mono text-[11px] text-foreground tabular-nums whitespace-nowrap text-right min-w-[4.5rem]">
                {it.display ?? it.value}
                {typeof it.compare === "number" && <span className="text-muted-foreground"> · {it.compareDisplay ?? it.compare}</span>}
              </span>
            </div>
            {it.note && <Html text={it.note} className="sm:col-start-2 font-mono text-[10.5px] text-muted-foreground -mt-0.5" />}
          </div>
        ))}
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Tabs: stacked panels on the server, tabs once scripts run ──────── */

export function Tabs({ labels, panels }: { labels: string[]; panels: ReactNode[] }) {
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => setEnhanced(true), []);
  return (
    <div className="my-8 border border-border bg-card/20">
      {enhanced && (
        <div role="tablist" className="flex flex-wrap gap-1 border-b border-border p-2">
          {labels.map((l, i) => (
            <button
              key={l}
              role="tab"
              type="button"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={`font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 transition-colors ${
                active === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <div className="px-4 sm:px-5 pb-2">
        {panels.map((p, i) => (
          <div key={i} role={enhanced ? "tabpanel" : undefined} hidden={enhanced && active !== i}>
            {!enhanced && <p className={`${kicker} pt-4`}>{labels[i]}</p>}
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Heat map ───────────────────────────────────────────────────────── */

export function Heatmap({ block }: { block: B<"heatmap"> }) {
  const max = block.max ?? Math.max(...block.rows.flatMap((r) => r.values), 1);
  return (
    <figure className="my-8">
      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-secondary/30">
              <th scope="col" className={`${kicker} text-left p-3 border-b border-border`}>
                {block.corner ?? ""}
              </th>
              {block.columns.map((c) => (
                <th key={c} scope="col" className={`${kicker} text-center p-3 border-b border-border`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="font-mono text-xs text-foreground font-semibold text-left p-3 border-b border-border/50">
                  {r.label}
                </th>
                {r.values.map((v, j) => {
                  const a = 0.08 + 0.8 * (v / max);
                  return (
                    <td
                      key={j}
                      className="font-mono text-xs text-center p-3 border-b border-l border-border/50 tabular-nums"
                      style={{ background: `hsl(var(--foreground) / ${a.toFixed(2)})`, color: a > 0.5 ? "hsl(var(--background))" : undefined }}
                    >
                      {v}
                      {block.unit ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Cards ──────────────────────────────────────────────────────────── */

export function Cards({ block }: { block: B<"cards"> }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[block.columns ?? 3];
  return (
    <div className={`my-8 grid gap-3 ${cols}`}>
      {block.items.map((c, i) => (
        <div key={i} className="border border-border bg-card/30 p-4 flex flex-col" style={{ borderTopColor: tone(c.tone, i), borderTopWidth: 3 }}>
          {c.kicker && (
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: tone(c.tone, i) }}>
              {c.kicker}
            </p>
          )}
          {c.href ? (
            <Html as="p" text={`[${c.title}](${c.href})`} className="font-display text-base font-bold text-foreground mt-1 leading-snug" />
          ) : (
            <p className="font-display text-base font-bold text-foreground mt-1 leading-snug">{c.title}</p>
          )}
          <Html text={c.text} className="font-mono text-[11.5px] text-muted-foreground leading-relaxed mt-2" />
          {c.chips && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {c.chips.map((ch) => (
                <li key={ch} className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground/85">
                  {ch}
                </li>
              ))}
            </ul>
          )}
          {c.foot && <Html text={c.foot} className="font-mono text-[10.5px] text-muted-foreground/80 leading-snug mt-auto pt-3" />}
        </div>
      ))}
    </div>
  );
}

/* ── Timeline ───────────────────────────────────────────────────────── */

export function Timeline({ block }: { block: B<"timeline"> }) {
  return (
    <ol className="my-8 relative border-l border-border ml-2 space-y-6">
      {block.items.map((t, i) => (
        <li key={i} className="pl-6 relative">
          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: tone(t.tone, i) }} />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t.date}</p>
          <p className="font-display text-base font-bold text-foreground mt-0.5">{t.title}</p>
          <Html text={t.text} className="font-mono text-xs text-muted-foreground leading-relaxed mt-1" />
        </li>
      ))}
    </ol>
  );
}

/* ── Flow ───────────────────────────────────────────────────────────── */

export function Flow({ block }: { block: B<"flow"> }) {
  const n = block.steps.length;
  return (
    <figure className="my-8">
      <ol className="flex flex-col md:flex-row md:items-stretch gap-2">
        {block.steps.map((s, i) => (
          <li key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1 min-w-0">
            <div className="flex-1 border border-border bg-card/30 p-3 h-full" style={{ borderTopColor: tone(undefined, i), borderTopWidth: 3 }}>
              <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: tone(undefined, i) }}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="font-display text-sm font-bold text-foreground mt-0.5 leading-snug">{s.label}</p>
              {s.detail && <Html text={s.detail} className="font-mono text-[10.5px] text-muted-foreground leading-snug mt-1.5" />}
            </div>
            {i < n - 1 && (
              <span aria-hidden="true" className="self-center font-mono text-xs text-muted-foreground">
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Query fan-out ──────────────────────────────────────────────────── */

export function Fanout({ block }: { block: B<"fanout"> }) {
  return (
    <figure className="my-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr] items-center">
        <div className="border-2 p-4" style={{ borderColor: TONE.sky }}>
          <p className={kicker}>What the person asks</p>
          <p className="font-display text-base font-bold text-foreground mt-1 leading-snug">{block.root}</p>
          {block.rootNote && <Html text={block.rootNote} className="font-mono text-[10.5px] text-muted-foreground mt-2" />}
        </div>
        <div className="relative border-l-2 pl-4 space-y-1.5" style={{ borderColor: TONE.sky }}>
          <p className={`${kicker} mb-2`}>What the engine searches for</p>
          {block.branches.map((b, i) => (
            <p key={i} className="font-mono text-[11.5px] text-foreground/90 flex gap-2">
              <span aria-hidden="true" style={{ color: tone(undefined, i) }}>
                ↳
              </span>
              <span>{b}</span>
            </p>
          ))}
        </div>
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── The demand iceberg ─────────────────────────────────────────────── */

export function Iceberg({ block }: { block: B<"iceberg"> }) {
  const n = block.layers.length;
  return (
    <figure className="my-8 border border-border bg-card/20 p-4 sm:p-6">
      <div className="mx-auto w-full sm:w-3/5 border p-3 text-center" style={{ borderColor: TONE.sky }}>
        <p className="font-display text-sm font-bold text-foreground">{block.tip.label}</p>
        <Html text={block.tip.detail} className="font-mono text-[10.5px] text-muted-foreground mt-1" />
      </div>
      <div className="my-3 flex items-center gap-3" aria-hidden="true">
        <span className="flex-1 border-t-2 border-dashed" style={{ borderColor: TONE.sky }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: TONE.sky }}>
          What a keyword tool can count ↑ · What people actually express ↓
        </span>
        <span className="flex-1 border-t-2 border-dashed" style={{ borderColor: TONE.sky }} />
      </div>
      <div className="space-y-2">
        {block.layers.map((l, i) => (
          <div
            key={i}
            className="mx-auto border border-border p-3"
            style={{ width: `${Math.min(100, 70 + (30 * (i + 1)) / n)}%`, background: `hsl(var(--foreground) / ${(0.03 + 0.03 * i).toFixed(2)})` }}
          >
            <p className="font-display text-sm font-bold text-foreground">{l.label}</p>
            <Html text={l.detail} className="font-mono text-[10.5px] text-muted-foreground mt-0.5" />
          </div>
        ))}
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Industry map: a hub, its categories, and a dot per topic ───────── */

export function Radial({ block }: { block: B<"radial"> }) {
  const W = 1000;
  const H = 760;
  const cx = W / 2;
  const cy = H / 2;
  const R = 255;
  const max = Math.max(...block.nodes.map((n) => n.value), 1);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const n = block.nodes.length;
  return (
    <figure className="my-8">
      <div className="border border-border bg-card/20">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={block.caption ?? block.hub}>
          <title>{block.caption ?? block.hub}</title>
          {block.nodes.map((node, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const x = r2(cx + R * Math.cos(a));
            const y = r2(cy + R * Math.sin(a));
            return <line key={`l${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(var(--foreground) / 0.18)" strokeWidth={1} />;
          })}
          {block.nodes.map((node, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const x = r2(cx + R * Math.cos(a));
            const y = r2(cy + R * Math.sin(a));
            const r = r2(9 + 27 * Math.sqrt(node.value / max));
            const color = tone(undefined, i);
            const spread = Math.min(4.4, 62 / Math.sqrt(Math.max(node.dots, 1)));
            const dots = Array.from({ length: node.dots }, (_, k) => {
              const rr = r + 7 + spread * Math.sqrt(k + 1);
              const t = k * golden;
              return <circle key={k} cx={r2(x + rr * Math.cos(t))} cy={r2(y + rr * Math.sin(t))} r={1.7} fill={color} opacity={0.75} />;
            });
            const outer = r + 10 + spread * Math.sqrt(node.dots + 1);
            const lx = r2(cx + (R + outer + 8) * Math.cos(a));
            const ly = r2(cy + (R + outer + 8) * Math.sin(a));
            const cos = Math.cos(a);
            const anchor = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";
            return (
              <g key={`n${i}`}>
                <title>{`${node.label}: ${node.display ?? node.value} · ${node.dots} topics`}</title>
                {dots}
                <circle cx={x} cy={y} r={r} fill={color} opacity={0.9} />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground) / 0.9)"
                  fontFamily="var(--font-mono, ui-monospace), monospace"
                  fontSize={i < 9 ? 13 : 11}
                >
                  {node.short ?? node.label}
                  {i < 9 && node.display && (
                    <tspan x={lx} dy={15} fill="hsl(var(--foreground) / 0.6)" fontSize={11}>
                      {node.display}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={30} fill="hsl(var(--foreground))" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--background))" fontSize={12} fontWeight={700} fontFamily="var(--font-mono, ui-monospace), monospace">
            {block.hub}
          </text>
        </svg>
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Two columns: the old way and the new way ───────────────────────── */

export function Split({ block }: { block: B<"split"> }) {
  return (
    <figure className="my-8">
      <div className="grid gap-3 md:grid-cols-2">
        {[block.left, block.right].map((side, i) => (
          <div key={i} className="border border-border p-4" style={i === 1 ? { borderColor: TONE.emerald, borderWidth: 2 } : { opacity: 0.85 }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: i === 1 ? TONE.emerald : undefined }}>
              {i === 0 ? "Before" : "User-First Intelligence"}
            </p>
            <p className="font-display text-base font-bold text-foreground mt-1">{side.title}</p>
            <ul className="mt-3 space-y-1.5">
              {side.items.map((it, j) => (
                <li key={j} className="font-mono text-[11.5px] text-muted-foreground leading-snug flex gap-2">
                  <span aria-hidden="true" style={{ color: i === 1 ? TONE.emerald : undefined }}>
                    {i === 1 ? "+" : "·"}
                  </span>
                  <Html as="span" text={it} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── A persona card, every trait graded ─────────────────────────────── */

const GRADE: Record<"measured" | "derived" | "inferred", { label: string; tone: Tone; note: string }> = {
  measured: { label: "Measured", tone: "emerald", note: "a study reports it for this population" },
  derived: { label: "Derived", tone: "amber", note: "real data from a wider population" },
  inferred: { label: "Inferred", tone: "rose", note: "no source yet: an assumption to test" },
};

export function Traits({ block }: { block: B<"traits"> }) {
  return (
    <figure className="my-8 border border-border bg-card/30">
      <div className="p-4 border-b border-border">
        <p className={kicker}>Persona</p>
        {block.href ? (
          <Html text={`[${block.title}](${block.href})`} className="font-display text-xl font-bold text-foreground mt-1" />
        ) : (
          <p className="font-display text-xl font-bold text-foreground mt-1">{block.title}</p>
        )}
        {block.subtitle && <p className="font-mono text-xs text-muted-foreground mt-1">{block.subtitle}</p>}
        <div className="flex flex-wrap gap-4 mt-3">
          {(Object.keys(GRADE) as (keyof typeof GRADE)[]).map((g) => (
            <span key={g} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: TONE[GRADE[g].tone] }} />
              <span className="text-foreground/90">{GRADE[g].label}</span>: {GRADE[g].note}
            </span>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {block.items.map((t, i) => (
          <li key={i} className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_minmax(0,16rem)_1fr] gap-x-3 gap-y-0.5 px-4 py-2.5 items-baseline">
            <span className="h-2 w-2 rounded-full translate-y-[-1px]" style={{ background: TONE[GRADE[t.grade].tone] }} title={GRADE[t.grade].label} />
            <span className="font-mono text-xs text-foreground">{t.label}</span>
            <span className="col-start-2 sm:col-start-auto font-mono text-[11px] text-muted-foreground">{t.value}</span>
          </li>
        ))}
      </ul>
      {block.caption && (
        <div className="px-4 pb-3">
          <Caption text={block.caption} />
        </div>
      )}
    </figure>
  );
}

/* ── Two-by-two ─────────────────────────────────────────────────────── */

export function Matrix({ block }: { block: B<"matrix"> }) {
  const q = block.quadrants;
  const cell = (c: { title: string; text: string; highlight?: boolean }) => (
    <div className="border border-border p-4 min-h-[8rem]" style={c.highlight ? { borderColor: TONE.rose, borderWidth: 2, background: "hsl(var(--foreground) / 0.04)" } : undefined}>
      <p className="font-display text-base font-bold" style={{ color: c.highlight ? TONE.rose : undefined }}>
        {c.title}
      </p>
      <Html text={c.text} className="font-mono text-[11px] text-muted-foreground leading-snug mt-1.5" />
    </div>
  );
  return (
    <figure className="my-8">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div className="flex items-center justify-center">
          <span className={`${kicker} [writing-mode:vertical-rl] rotate-180 whitespace-nowrap`}>{block.y} →</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cell(q.tl)}
          {cell(q.tr)}
          {cell(q.bl)}
          {cell(q.br)}
        </div>
        <span />
        <p className={`${kicker} text-center`}>{block.x} →</p>
      </div>
      <Caption text={block.caption} />
    </figure>
  );
}

/* ── Before and after ───────────────────────────────────────────────── */

export function Slope({ block }: { block: B<"slope"> }) {
  const W = 520;
  const H = 300;
  const xl = 150;
  const xr = 370;
  const top = 40;
  const bottom = H - 40;
  const vals = block.series.flatMap((s) => [s.from, s.to]);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(...vals);
  const y = (v: number) => r2(bottom - ((v - lo) / (hi - lo || 1)) * (bottom - top));
  const fmt = (v: number) => `${v}${block.unit ?? ""}`;
  // Nudge labels that would collide at either end.
  const place = (ys: number[]) => {
    const idx = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]);
    const out = [...ys];
    for (let k = 1; k < idx.length; k++) {
      const prev = out[idx[k - 1]];
      if (out[idx[k]] - prev < 16) out[idx[k]] = prev + 16;
    }
    return out;
  };
  const leftY = place(block.series.map((s) => y(s.from)));
  const rightY = place(block.series.map((s) => y(s.to)));
  return (
    <figure className="my-6 border border-border bg-card/20 p-3">
      {block.title && <p className={`${kicker} mb-1 px-1`}>{block.title}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={block.title ?? "Before and after"}>
        <title>{block.title ?? "Before and after"}</title>
        <line x1={xl} y1={top - 14} x2={xl} y2={bottom + 6} stroke="hsl(var(--foreground) / 0.15)" />
        <line x1={xr} y1={top - 14} x2={xr} y2={bottom + 6} stroke="hsl(var(--foreground) / 0.15)" />
        <text x={xl} y={H - 12} textAnchor="middle" fill="hsl(var(--foreground) / 0.7)" fontSize={12} fontFamily="ui-monospace, monospace">
          {block.from}
        </text>
        <text x={xr} y={H - 12} textAnchor="middle" fill="hsl(var(--foreground) / 0.7)" fontSize={12} fontFamily="ui-monospace, monospace">
          {block.to}
        </text>
        {block.series.map((s, i) => {
          const c = tone(s.tone, i);
          return (
            <g key={s.label}>
              <line x1={xl} y1={y(s.from)} x2={xr} y2={y(s.to)} stroke={c} strokeWidth={3} />
              <circle cx={xl} cy={y(s.from)} r={5} fill={c} />
              <circle cx={xr} cy={y(s.to)} r={5} fill={c} />
              <text x={xl - 10} y={leftY[i]} textAnchor="end" dominantBaseline="middle" fill={c} fontSize={12.5} fontFamily="ui-monospace, monospace">
                {s.label} {fmt(s.from)}
              </text>
              <text x={xr + 10} y={rightY[i]} dominantBaseline="middle" fill={c} fontSize={12.5} fontFamily="ui-monospace, monospace">
                {fmt(s.to)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="px-1">
        <Caption text={block.caption} />
      </div>
    </figure>
  );
}

/* ── Two charts side by side ────────────────────────────────────────── */

export function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 my-2">{children}</div>;
}

/* ── A pull quote with the author's photo ───────────────────────────── */

export function Quote({ block }: { block: B<"quote"> }) {
  return (
    <figure className="my-10 border-y border-border py-6 grid grid-cols-[auto_1fr] gap-4 sm:gap-6 items-center">
      {block.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.photo}
          alt={block.by}
          width={72}
          height={72}
          loading="lazy"
          className="h-14 w-14 sm:h-[72px] sm:w-[72px] rounded-full object-cover border border-border"
        />
      ) : (
        <span />
      )}
      <div>
        <blockquote>
          <Html text={`\u201c${block.text}\u201d`} className="font-display text-xl sm:text-2xl font-bold text-foreground leading-snug" />
        </blockquote>
        <figcaption className="font-mono text-[11px] text-muted-foreground mt-2">
          {block.by}
          {block.role ? ` · ${block.role}` : ""}
          {block.said && (
            <>
              {" · "}
              <a href={block.said.href} className="underline decoration-border underline-offset-4 hover:text-foreground">
                said on stage, {block.said.event}, at {Math.floor(block.said.at / 60)}:{String(block.said.at % 60).padStart(2, "0")} ▶
              </a>
            </>
          )}
        </figcaption>
      </div>
    </figure>
  );
}

/* ── The key to the reading highlights ──────────────────────────────── */

export function HighlightKey({ block }: { block: B<"highlightkey"> }) {
  return (
    <div className="my-6 flex flex-wrap items-center gap-x-4 gap-y-2 border border-border bg-card/20 px-4 py-3">
      <span className={kicker}>How to read this page</span>
      {block.items.map((k) => (
        <span key={k.color} className="font-mono text-[11px] text-foreground">
          <mark className={`hl hl-${k.color}`}>{k.label}</mark>
        </span>
      ))}
    </div>
  );
}
