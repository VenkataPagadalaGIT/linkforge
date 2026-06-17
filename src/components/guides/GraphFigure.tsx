"use client";
import { useState } from "react";
import type { GraphView, GNode } from "@/lib/graphModels";

/**
 * GraphFigure — renders a GraphView as a self-contained, crawlable SVG.
 *
 * Everything is drawn statically (no animation needed to read it), so the
 * Puppeteer SSG snapshot captures the full diagram — every node and edge label
 * ends up in the prerendered HTML for crawlers and AI answer engines. Hover
 * highlighting is layered on as pure progressive enhancement.
 */

// Restrained, desaturated palette — distinct enough to teach, muted enough to
// sit inside the monochrome brand.
const KIND_COLOR: Record<string, string> = {
  class: "#9aa3ad",
  leaf: "#5ec8c8",
  product: "#5ec8c8",
  brand: "#d3a35e",
  concept: "#9aa0e6",
  attr: "#9a9aa2",
  external: "#7a7a82",
  rule: "#d3a35e",
  page: "#5ec8c8",
  entity: "#e8e8ea",
  query: "#d3a35e",
  nav: "#7a7a82",
  user: "#ffffff",
  context: "#9aa0e6",
  win: "#6fd08c",
  far: "#5a5a60",
  sim: "#7a7a82",
  default: "#cfcfd4",
};

const colorFor = (kind: string) => KIND_COLOR[kind] ?? KIND_COLOR.default;

// Naive word-wrap for labels so long page URLs / queries stay readable.
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
  /** Hide the built-in legend (e.g. when shown side-by-side). */
  hideLegend?: boolean;
}

const GraphFigure = ({ view, hideLegend }: Props) => {
  const [active, setActive] = useState<string | null>(null);
  const byId = new Map<string, GNode>(view.nodes.map((n) => [n.id, n]));

  // Neighbor set for hover highlighting.
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
  const edgeDim = (s: string, t: string) =>
    lit ? !(lit.has(s) && lit.has(t)) : false;

  return (
    <figure className="my-2">
      <div className="border border-border bg-card/40">
        <svg
          viewBox={`0 0 ${view.width} ${view.height}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${view.title} diagram: ${view.caption}`}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#6a6a72" />
            </marker>
            <marker id="arrowWin" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#6fd08c" />
            </marker>
          </defs>

          {/* Edges */}
          {view.edges.map((e, i) => {
            const s = byId.get(e.source);
            const t = byId.get(e.target);
            if (!s || !t) return null;
            const win = e.kind === "win";
            const dim = edgeDim(e.source, e.target);
            const stroke = win ? "#6fd08c" : e.kind === "sim" ? "#6a6a72" : "#56565e";
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;
            return (
              <g key={`e${i}`} opacity={dim ? 0.12 : 1} style={{ transition: "opacity 0.2s" }}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={stroke}
                  strokeWidth={win ? 2 : 1.2}
                  strokeDasharray={e.dashed ? "5 4" : undefined}
                  markerEnd={view.id === "vector-index" ? undefined : `url(#${win ? "arrowWin" : "arrow"})`}
                />
                {e.label && (
                  <text
                    x={mx}
                    y={my - 3}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="9"
                    fill={win ? "#6fd08c" : "#8a8a92"}
                  >
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
                  <rect x={n.x - 9} y={n.y - 9} width={18} height={18} rx={2} fill="#0c0c0d" stroke={c} strokeWidth={1.6} />
                ) : (
                  <circle cx={n.x} cy={n.y} r={r} fill="#0c0c0d" stroke={c} strokeWidth={1.8} />
                )}
                {/* label */}
                {lines.map((ln, li) => (
                  <text
                    key={li}
                    x={n.x}
                    y={n.y + r + 12 + li * 11}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="10.5"
                    fill="#e6e6e8"
                  >
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
                    fill={colorFor(n.kind)}
                    opacity={0.8}
                  >
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
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
