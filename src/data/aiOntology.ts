// The AI Systems Map — a layered ontology of the AI industry value chain.
//
// Nodes are entities across the stack (labs, models, clouds, accelerators,
// foundries, equipment, memory, materials, minerals, energy, data centers,
// networking, capital, policy). Edges are typed dependencies. The data lives in
// aiOntologyData.ts (research-generated); this module defines the types, the
// display metadata, and the graph-traversal helpers the explorer + node pages use.

import { AI_NODES, AI_EDGES } from "./aiOntologyData";
import { aiUpdates, type AIUpdate } from "./aiUpdates";

export type LayerId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type NodeType =
  | "frontier-lab" | "model" | "cloud" | "accelerator" | "cpu"
  | "foundry" | "packaging" | "equipment" | "eda" | "memory"
  | "materials" | "mineral" | "energy" | "datacenter" | "networking"
  | "cooling" | "investor" | "government" | "standard"
  | "dataset" | "benchmark" | "framework" | "vertical" | "institution";

export type RelationType =
  | "depends_on" | "supplies" | "manufactures" | "designs" | "powers"
  | "hosts" | "invests_in" | "partners_with" | "competes_with"
  | "restricts" | "uses" | "used_by" | "sources";

export interface AiFact {
  label: string;
  value: string;
}

export interface AiNode {
  id: string;
  name: string;
  type: NodeType;
  layer: LayerId;
  tagline: string;
  story: string;
  hq?: string;
  ticker?: string;
  website?: string;
  github?: string;
  chokepoint?: boolean;
  keyFacts?: AiFact[];
  /** AIUpdate ids explicitly linked to this node (optional; newsFor also fuzzy-matches). */
  relatedUpdateIds?: string[];
}

export interface AiEdge {
  from: string;
  to: string;
  relation: RelationType;
  note?: string;
}

// ===== Display metadata =====

export interface LayerMeta {
  id: LayerId;
  label: string;
  short: string;
  blurb: string;
  color: string;
}

/** The 7 layers of the AI value chain, top (demand) to bottom (raw inputs). */
export const LAYERS: LayerMeta[] = [
  { id: 0, label: "Frontier labs & models", short: "Labs", color: "#e5e7eb",
    blurb: "The demand layer: the labs racing to build frontier models, and the models themselves." },
  { id: 1, label: "Cloud & compute", short: "Cloud", color: "#60a5fa",
    blurb: "Hyperscalers and neoclouds that rent the compute the labs train and serve on." },
  { id: 2, label: "Accelerators & chips", short: "Chips", color: "#34d399",
    blurb: "GPU, TPU and custom-silicon designers: the engines of AI compute." },
  { id: 3, label: "Foundries & packaging", short: "Fabs", color: "#fbbf24",
    blurb: "The factories that physically manufacture and package the chips." },
  { id: 4, label: "Equipment, EDA & memory", short: "Tools", color: "#f472b6",
    blurb: "The machines, design software and high-bandwidth memory the fabs and chips depend on." },
  { id: 5, label: "Materials & minerals", short: "Materials", color: "#a78bfa",
    blurb: "Wafers, photoresist, gases and the critical minerals mined at the bottom of the stack." },
  { id: 6, label: "Energy, infrastructure & capital", short: "Power", color: "#fb923c",
    blurb: "The power, data centers, networking, capital and policy that the whole stack rests on." },
];

export const LAYER_BY_ID = new Map<LayerId, LayerMeta>(LAYERS.map((l) => [l.id, l]));

export const NODE_TYPE_META: Record<NodeType, { label: string }> = {
  "frontier-lab": { label: "Frontier lab" },
  model: { label: "Model" },
  cloud: { label: "Cloud / compute" },
  accelerator: { label: "Accelerator" },
  cpu: { label: "CPU / IP" },
  foundry: { label: "Foundry" },
  packaging: { label: "Packaging" },
  equipment: { label: "Equipment" },
  eda: { label: "EDA software" },
  memory: { label: "Memory / HBM" },
  materials: { label: "Materials" },
  mineral: { label: "Critical mineral" },
  energy: { label: "Energy / power" },
  datacenter: { label: "Data center" },
  networking: { label: "Networking" },
  cooling: { label: "Cooling" },
  investor: { label: "Investor / capital" },
  government: { label: "Government / policy" },
  standard: { label: "Standard / protocol" },
  dataset: { label: "Dataset" },
  benchmark: { label: "Benchmark / eval" },
  framework: { label: "Framework / tooling" },
  vertical: { label: "Adopting vertical" },
  institution: { label: "Institution" },
};

type Dir = "up" | "down" | "make" | "capital" | "peer" | "policy";

export const RELATION_META: Record<RelationType, { label: string; dir: Dir }> = {
  depends_on: { label: "depends on", dir: "up" },
  uses: { label: "uses", dir: "up" },
  sources: { label: "sources", dir: "up" },
  supplies: { label: "supplies", dir: "down" },
  manufactures: { label: "manufactures", dir: "down" },
  powers: { label: "powers", dir: "down" },
  hosts: { label: "hosts", dir: "down" },
  used_by: { label: "used by", dir: "down" },
  designs: { label: "designs", dir: "make" },
  invests_in: { label: "invests in", dir: "capital" },
  partners_with: { label: "partners with", dir: "peer" },
  competes_with: { label: "competes with", dir: "peer" },
  restricts: { label: "restricts", dir: "policy" },
};

// ===== Data + indexes =====

export const nodes: AiNode[] = AI_NODES;
export const edges: AiEdge[] = AI_EDGES;

const byId = new Map<string, AiNode>(nodes.map((n) => [n.id, n]));
const outByNode = new Map<string, AiEdge[]>();
const inByNode = new Map<string, AiEdge[]>();
for (const e of edges) {
  // Defensive: only index well-formed edges (known relation + both endpoints exist).
  if (!RELATION_META[e.relation] || !byId.has(e.from) || !byId.has(e.to)) continue;
  (outByNode.get(e.from) ?? outByNode.set(e.from, []).get(e.from)!).push(e);
  (inByNode.get(e.to) ?? inByNode.set(e.to, []).get(e.to)!).push(e);
}

export const getNode = (id: string): AiNode | undefined => byId.get(id);
export const allNodeIds = (): string[] => nodes.map((n) => n.id);
export const nodesInLayer = (layer: LayerId): AiNode[] =>
  nodes.filter((n) => n.layer === layer).sort((a, b) => a.name.localeCompare(b.name));
export const chokepoints = (): AiNode[] => nodes.filter((n) => n.chokepoint);

export interface Relation {
  node: AiNode;
  relation: RelationType;
  note?: string;
}

const relate = (edge: AiEdge, otherId: string): Relation | null => {
  const node = byId.get(otherId);
  return node ? { node, relation: edge.relation, note: edge.note } : null;
};

/** Everything this node depends on / that supplies it (upstream in the value chain). */
export function upstreamOf(id: string): Relation[] {
  const out = (outByNode.get(id) ?? []).filter((e) => RELATION_META[e.relation]?.dir === "up");
  const inc = (inByNode.get(id) ?? []).filter((e) => RELATION_META[e.relation]?.dir === "down");
  return dedupeRelations([
    ...out.map((e) => relate(e, e.to)),
    ...inc.map((e) => relate(e, e.from)),
  ]);
}

/** Everything that depends on this node / that it supplies (downstream). */
export function downstreamOf(id: string): Relation[] {
  const out = (outByNode.get(id) ?? []).filter((e) => RELATION_META[e.relation]?.dir === "down");
  const inc = (inByNode.get(id) ?? []).filter((e) => RELATION_META[e.relation]?.dir === "up");
  return dedupeRelations([
    ...out.map((e) => relate(e, e.to)),
    ...inc.map((e) => relate(e, e.from)),
  ]);
}

/** Peer / capital / policy / make relations, grouped for the "context" section. */
export function contextOf(id: string): { capital: Relation[]; peers: Relation[]; policy: Relation[]; makes: Relation[] } {
  const out = outByNode.get(id) ?? [];
  const inc = inByNode.get(id) ?? [];
  const pick = (dir: Dir) =>
    dedupeRelations([
      ...out.filter((e) => RELATION_META[e.relation]?.dir === dir).map((e) => relate(e, e.to)),
      ...inc.filter((e) => RELATION_META[e.relation]?.dir === dir).map((e) => relate(e, e.from)),
    ]);
  return { capital: pick("capital"), peers: pick("peer"), policy: pick("policy"), makes: pick("make") };
}

/** Immediate neighbourhood (both directions) — used to seed the per-node 3D view. */
export function neighborsOf(id: string, limit = 14): AiNode[] {
  const seen = new Set<string>();
  const push = (r: Relation) => seen.add(r.node.id);
  upstreamOf(id).forEach(push);
  downstreamOf(id).forEach(push);
  const ctx = contextOf(id);
  [...ctx.capital, ...ctx.peers, ...ctx.policy, ...ctx.makes].forEach(push);
  return Array.from(seen).slice(0, limit).map((n) => byId.get(n)!).filter(Boolean);
}

function dedupeRelations(rs: (Relation | null)[]): Relation[] {
  const seen = new Set<string>();
  const out: Relation[] = [];
  for (const r of rs) {
    if (!r) continue;
    const k = `${r.node.id}|${r.relation}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out.sort((a, b) => a.node.name.localeCompare(b.node.name));
}

// ===== News wiring =====

const norm = (s: string) => s.toLowerCase();

/** AI updates linked to a node — explicit ids first, then a fuzzy company/tag match. */
export function newsFor(id: string): AIUpdate[] {
  const node = byId.get(id);
  if (!node) return [];
  const name = norm(node.name.split(" (")[0]);
  const explicit = new Set(node.relatedUpdateIds ?? []);
  return aiUpdates.filter((u) => {
    if (explicit.has(u.id)) return true;
    const hay = norm(`${u.company} ${u.title} ${(u.tags || []).join(" ")}`);
    return name.length > 3 && hay.includes(name);
  });
}

// ===== Search =====

export function searchNodes(q: string, limit = 20): AiNode[] {
  const s = norm(q).trim();
  if (!s) return [];
  return nodes
    .filter((n) => norm(`${n.name} ${n.id} ${n.tagline} ${NODE_TYPE_META[n.type].label}`).includes(s))
    .slice(0, limit);
}

export const ONTOLOGY_COUNTS = {
  nodes: nodes.length,
  edges: edges.length,
  chokepoints: nodes.filter((n) => n.chokepoint).length,
  layers: LAYERS.length,
};
