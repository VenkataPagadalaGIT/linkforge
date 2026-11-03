"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LAYERS, nodesInLayer, edges as ALL_EDGES, RELATION_META, type AiNode, type RelationType } from "@/data/aiOntology";

// Canvas-rendered layered graph of the whole ontology — fast for hundreds of
// nodes. Bands L0 (top) → L6 (bottom); dots coloured by layer. Hovering a node
// lights up its edges, each coloured + labelled by its actual relation. Click a
// node to open its topic page. The crawlable node links live in the Stack view.

const CW = 1400;
const LEFT = 172;
const COLS = 12;
const ROW_H = 28;
const TOP = 14;

const layerColor = (id: number) => LAYERS.find((l) => l.id === id)?.color ?? "#8a8a8a";

// Edge colour by relation CATEGORY (resolved relative to the hovered node):
// depends-on/uses (green), supplies/feeds (blue), invests_in (amber),
// partner/rival (fuchsia), restricts (red), designs (slate).
export const EDGE_CAT_COLOR: Record<string, string> = {
  up: "#34d399", down: "#38bdf8", capital: "#fbbf24", peer: "#e879f9", policy: "#f87171", make: "#cbd5e1",
};
export const EDGE_CAT_LABEL: Record<string, string> = {
  up: "depends on / uses", down: "supplies / feeds", capital: "invests in", peer: "partner / rival", policy: "restricts", make: "designs",
};
function edgeCategory(relation: RelationType, outgoing: boolean): string {
  const dir = RELATION_META[relation]?.dir;
  if (dir === "up") return outgoing ? "up" : "down";
  if (dir === "down") return outgoing ? "down" : "up";
  return dir || "peer";
}

interface P { x: number; y: number; node: AiNode }

export default function AiOntologyGraph({ query = "", chokeOnly = false }: { query?: string; chokeOnly?: boolean }) {
  const router = useRouter();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number | undefined>(undefined);
  const [hover, setHover] = React.useState<string | null>(null);

  const { pos, bands, height } = React.useMemo(() => {
    const pos = new Map<string, P>();
    const bands: { id: number; short: string; color: string; top: number; count: number }[] = [];
    const colW = (CW - LEFT - 24) / COLS;
    let y = TOP;
    for (const layer of LAYERS) {
      const ns = nodesInLayer(layer.id);
      const rows = Math.max(1, Math.ceil(ns.length / COLS));
      const top = y;
      ns.forEach((n, i) => {
        pos.set(n.id, { x: LEFT + (i % COLS) * colW + colW / 2, y: top + Math.floor(i / COLS) * ROW_H + ROW_H / 2, node: n });
      });
      bands.push({ id: layer.id, short: layer.short, color: layer.color, top, count: ns.length });
      y += rows * ROW_H + 12;
    }
    return { pos, bands, height: y };
  }, []);

  const adj = React.useMemo(() => {
    const m = new Map<string, { id: string; rel: RelationType; outgoing: boolean }[]>();
    for (const e of ALL_EDGES) {
      if (!RELATION_META[e.relation]) continue;
      (m.get(e.from) ?? m.set(e.from, []).get(e.from)!).push({ id: e.to, rel: e.relation, outgoing: true });
      (m.get(e.to) ?? m.set(e.to, []).get(e.to)!).push({ id: e.from, rel: e.relation, outgoing: false });
    }
    return m;
  }, []);

  const q = query.trim().toLowerCase();

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const fg = `hsl(${css.getPropertyValue("--foreground").trim() || "0 0% 96%"})`;
    const muted = `hsl(${css.getPropertyValue("--muted-foreground").trim() || "0 0% 60%"})`;
    ctx.clearRect(0, 0, CW, height);

    // band labels
    ctx.textBaseline = "middle";
    for (const b of bands) {
      ctx.fillStyle = b.color;
      ctx.fillRect(0, b.top - 6, 3, (bands.find((x) => x.id === b.id + 1)?.top ?? height) - b.top);
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillStyle = fg;
      ctx.fillText(`L${b.id} · ${b.short}`, 12, b.top + 8);
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillStyle = muted;
      ctx.fillText(String(b.count), 12, b.top + 24);
    }

    const neighbors = hover ? new Set((adj.get(hover) ?? []).map((a) => a.id)) : null;

    // hovered node's edges — coloured + labelled by their actual relation
    if (hover) {
      const h = pos.get(hover);
      if (h) {
        ctx.textBaseline = "middle";
        for (const a of adj.get(hover) ?? []) {
          const o = pos.get(a.id);
          if (!o) continue;
          const color = EDGE_CAT_COLOR[edgeCategory(a.rel, a.outgoing)] ?? "#888";
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(o.x, o.y);
          ctx.stroke();
          // the relation itself, at the edge midpoint
          ctx.globalAlpha = 1;
          ctx.font = "9px ui-monospace, monospace";
          ctx.fillStyle = color;
          ctx.fillText(a.rel.replace(/_/g, " "), (h.x + o.x) / 2, (h.y + o.y) / 2 - 4);
        }
        ctx.globalAlpha = 1;
      }
    }

    // dots
    for (const { x, y, node } of pos.values()) {
      if (chokeOnly && !node.chokepoint) continue;
      const isHover = node.id === hover;
      const isNeighbor = neighbors?.has(node.id) ?? false;
      const matched = !q || `${node.name} ${node.id} ${node.tagline}`.toLowerCase().includes(q);
      ctx.globalAlpha = (hover && !isHover && !isNeighbor) || (!hover && !matched) ? 0.16 : 1;
      ctx.beginPath();
      ctx.arc(x, y, isHover ? 6 : node.chokepoint ? 4.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = layerColor(node.layer);
      ctx.fill();
      if (node.chokepoint) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else if (isHover) {
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      // labels: hovered, its neighbours, chokepoints, or search matches
      if (isHover || isNeighbor || (!hover && (node.chokepoint || (q && matched)))) {
        ctx.globalAlpha = isHover || isNeighbor ? 1 : 0.9;
        ctx.font = `${isHover ? "bold 11px" : "9px"} ui-monospace, monospace`;
        ctx.fillStyle = fg;
        const label = node.name.length > 24 ? node.name.slice(0, 23) + "…" : node.name;
        ctx.fillText(label, x + 8, y);
      }
    }
    ctx.globalAlpha = 1;
  }, [hover, bands, pos, adj, q, chokeOnly, height]);

  React.useEffect(() => { draw(); }, [draw]);

  const nodeAt = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = CW / rect.width;
    const mx = (clientX - rect.left) * scale;
    const my = (clientY - rect.top) * scale;
    let best: string | null = null;
    let bestD = 12 * 12;
    for (const { x, y, node } of pos.values()) {
      if (chokeOnly && !node.chokepoint) continue;
      const d = (x - mx) ** 2 + (y - my) ** 2;
      if (d < bestD) { bestD = d; best = node.id; }
    }
    return best;
  };

  return (
    <div className="border border-border/70 overflow-x-auto" data-testid="ai-ontology-graph">
      <canvas
        ref={canvasRef}
        width={CW}
        height={height}
        style={{ width: "100%", height: "auto", display: "block", cursor: hover ? "pointer" : "default" }}
        onMouseMove={(e) => {
          const cx = e.clientX;
          const cy = e.clientY;
          if (rafRef.current) return; // coalesce to one hit-test per frame
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = undefined;
            const id = nodeAt(cx, cy);
            setHover((prev) => (prev === id ? prev : id));
          });
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const id = nodeAt(e.clientX, e.clientY);
          if (id) router.push(`/notebook/ai/map/${id}`);
        }}
      />
    </div>
  );
}
