"use client";
import { useState } from "react";
import type { GraphView, GNode } from "@/lib/graphModels";
import Graph3DLazy from "./Graph3DLazy";

/**
 * GraphFigure — renders a GraphView as a self-contained, crawlable SVG.
 *
 * Everything is drawn statically (no animation needed to read it), so the
 * server-rendered HTML contains every node and edge label for crawlers and AI
 * answer engines. Hover highlighting is pure progressive enhancement.
 *
 * Colors: structural tones (node fill, text, edges) are driven by the site's
 * theme CSS variables so the figure flips correctly between dark and light
 * mode, matching the rest of venkatapagadala.com. Categorical accents stay
 * fixed (they read on both themes).
 */

// Theme-reactive structural tokens (resolve via CSS variables on :root/.dark).
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";
const FAINT = "hsl(var(--muted-foreground) / 0.45)";
// Fixed accents — mid-tones legible on both dark and light.
const TEAL = "#34a8a8";
const AMBER = "#c08a3a";
const PERIW = "#7b84d6";
const GREEN = "#3fa468";

const KIND_COLOR: Record<string, string> = {
  class: MUTED,
  leaf: TEAL,
  product: TEAL,
  brand: AMBER,
  concept: PERIW,
  attr: MUTED,
  external: MUTED,
  rule: AMBER,
  page: TEAL,
  entity: FG,
  query: AMBER,
  nav: MUTED,
  user: FG,
  win: GREEN,
  far: FAINT,
  sim: MUTED,
  default: MUTED,
};

const colorFor = (kind: string) => KIND_COLOR[kind] ?? KIND_COLOR.default;

function wrap(text: string, maxChars = 22): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

interface Props {
  view: GraphView;
  hideLegend?: boolean;
}

const GraphFigure = ({ view, hideLegend }: Props) => {
  const [active, setActive] = useState<string | null>(null);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const byId = new Map<string, GNode>(view.nodes.map((n) => [n.id, n]));

  const neighbors = (id: string) => {
    const set = new Set<string>([id]);
    for (const e of view.edges) {
      if (e.source === id) set.add(e.target);
      if (e.target === id) set.add(e.source);
    }
    return set;
  };
  const lit = active ? neighbors(active) : null;
  const isDim = (id: string) => (lit ? !lit.has(id) : false);
  const edgeDim = (s: string, t: string) => (lit ? !(lit.has(s) && lit.has(t)) : false);

  return (
    <figure className="my-2">
      <div className="relative border border-border bg-card/40">
        <button
          type="button"
          onClick={() => setMode((m) => (m === "2d" ? "3d" : "2d"))}
          className="absolute top-2 right-2 z-10 font-mono text-[10px] px-2 py-1 border border-border bg-background/70 backdrop-blur text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          aria-label={mode === "2d" ? "Explore this graph in 3D" : "Back to 2D figure"}
        >
          {mode === "2d" ? "Explore in 3D ⤢" : "← 2D"}
        </button>
        <svg
          viewBox={`0 0 ${view.width} ${view.height}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${view.title} diagram: ${view.caption}`}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: MUTED }} />
            </marker>
            <marker id="arrowWin" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: GREEN }} />
            </marker>
          </defs>

          {/* Edges */}
          {view.edges.map((e, i) => {
            const s = byId.get(e.source);
            const t = byId.get(e.target);
            if (!s || !t) return null;
            const win = e.kind === "win";
            const dim = edgeDim(e.source, e.target);
            const stroke = win ? GREEN : e.kind === "sim" ? MUTED : BORDER;
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;
            return (
              <g key={`e${i}`} opacity={dim ? 0.12 : 1} style={{ transition: "opacity 0.2s" }}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  style={{ stroke }}
                  strokeWidth={win ? 2 : 1.2}
                  strokeDasharray={e.dashed ? "5 4" : undefined}
                  markerEnd={view.id === "vector-index" ? undefined : `url(#${win ? "arrowWin" : "arrow"})`}
                />
                {e.label && (
                  <text x={mx} y={my - 3} textAnchor="middle" className="font-mono" fontSize="9" style={{ fill: win ? GREEN : MUTED }}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {view.nodes.map((n) => {
            const c = colorFor(n.kind);
            const r = 7 * (n.size ?? 1);
            const dim = isDim(n.id);
            const lines = wrap(n.label);
            const isRect = n.kind === "page";
            return (
              <g
                key={n.id}
                opacity={dim ? 0.25 : 1}
                style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive(null)}
              >
                {isRect ? (
                  <rect x={n.x - 9} y={n.y - 9} width={18} height={18} rx={2} style={{ fill: CARD, stroke: c }} strokeWidth={1.6} />
                ) : (
                  <circle cx={n.x} cy={n.y} r={r} style={{ fill: CARD, stroke: c }} strokeWidth={1.8} />
                )}
                {lines.map((ln, li) => (
                  <text key={li} x={n.x} y={n.y + r + 12 + li * 11} textAnchor="middle" className="font-mono" fontSize="10.5" style={{ fill: FG }}>
                    {ln}
                  </text>
                ))}
                {n.sub && (
                  <text
                    x={n.x}
                    y={n.y + r + 12 + lines.length * 11}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="9"
                    style={{ fill: c, opacity: 0.85 }}
                  >
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {mode === "3d" && (
          <div className="absolute inset-0 bg-background">
            <Graph3DLazy view={view} />
          </div>
        )}
      </div>

      {!hideLegend && (
        <figcaption className="mt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2">
            {view.legend.map((l) => (
              <span key={l.kind} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-full border" style={{ borderColor: colorFor(l.kind) }} />
                {l.label}
              </span>
            ))}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed">
            <span className="text-foreground">{view.title}.</span> {view.caption}
          </p>
        </figcaption>
      )}
    </figure>
  );
};

export default GraphFigure;
