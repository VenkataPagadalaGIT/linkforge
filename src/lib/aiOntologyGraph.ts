// Builds a GraphView (nodes with deterministic x/y + typed edges) for a single
// ontology node's immediate neighbourhood, so the existing GraphFigure renderer
// (SSR SVG + 3D upgrade) can visualise "what this is and how it fits the stack".

import { getNode, upstreamOf, downstreamOf, contextOf, LAYER_BY_ID } from "@/data/aiOntology";
import type { GraphView, GNode, GEdge } from "@/lib/graphModels";

const W = 780;
const H = 500;

function spread(n: number, x0: number, x1: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [(x0 + x1) / 2];
  return Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * i) / (n - 1));
}

export function buildNodeGraphView(nodeId: string): GraphView | null {
  const node = getNode(nodeId);
  if (!node) return null;

  const up = upstreamOf(nodeId).slice(0, 7);
  const down = downstreamOf(nodeId).slice(0, 7);
  const ctx = contextOf(nodeId);
  const peers = [...ctx.peers, ...ctx.makes, ...ctx.capital].slice(0, 4);

  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  const seen = new Set<string>();
  const add = (g: GNode) => {
    if (seen.has(g.id)) return;
    seen.add(g.id);
    nodes.push(g);
  };
  const rel = (r: string) => r.replace(/_/g, " ");

  add({ id: node.id, label: node.name, x: W / 2, y: H / 2, kind: "entity", size: 1.6,
        sub: LAYER_BY_ID.get(node.layer)?.short });

  const ux = spread(up.length, W * 0.12, W * 0.88);
  up.forEach((r, i) => {
    add({ id: r.node.id, label: r.node.name, x: ux[i], y: 72, kind: "product",
          sub: r.node.chokepoint ? "chokepoint" : undefined });
    edges.push({ source: node.id, target: r.node.id, label: rel(r.relation) });
  });

  const dx = spread(down.length, W * 0.12, W * 0.88);
  down.forEach((r, i) => {
    add({ id: r.node.id, label: r.node.name, x: dx[i], y: H - 72, kind: "rule",
          sub: r.node.chokepoint ? "chokepoint" : undefined });
    edges.push({ source: r.node.id, target: node.id, label: rel(r.relation) });
  });

  peers.forEach((r, i) => {
    const left = i % 2 === 0;
    const row = Math.floor(i / 2);
    add({ id: r.node.id, label: r.node.name, x: left ? W * 0.05 : W * 0.95, y: H / 2 + (row * 96 - 48), kind: "concept" });
    edges.push({ source: node.id, target: r.node.id, label: rel(r.relation), dashed: true });
  });

  return {
    id: `ai-node-${node.id}`,
    title: `${node.name} in the AI stack`,
    caption: `${node.name} with its immediate upstream dependencies (top) and downstream dependents (bottom) in the AI value chain. Hover a node in 3D, or read the full relationships below.`,
    width: W,
    height: H,
    nodes,
    edges,
    legend: [
      { kind: "entity", label: node.name },
      ...(up.length ? [{ kind: "product", label: "Depends on ↑" }] : []),
      ...(down.length ? [{ kind: "rule", label: "Feeds ↓" }] : []),
      ...(peers.length ? [{ kind: "concept", label: "Related" }] : []),
    ],
  };
}
