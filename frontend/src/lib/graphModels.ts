/**
 * graphModels.ts
 *
 * The teaching engine behind the "Graph Types for AI Agents" guide.
 *
 * One shared domain — a running-shoe retailer + its content site — is modeled
 * SIX ways using real `graphology` graphs. Each builder returns a `GraphView`
 * (nodes with deterministic x/y coordinates + typed edges) that the SVG figure
 * component renders. Because every layout is deterministic (no Math.random),
 * the Puppeteer SSG pass and the client hydration produce identical output.
 *
 * The point is contrast: the SAME information becomes a tree, a schema, a web
 * of facts, a content map, a user-aware overlay, and a similarity cloud —
 * depending on which structure you choose.
 */

import Graph from "graphology";

export interface GNode {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Visual category — drives color/shape in the renderer. */
  kind: string;
  /** Optional secondary line shown under the label. */
  sub?: string;
  /** Relative node size (1 = default). */
  size?: number;
}

export interface GEdge {
  source: string;
  target: string;
  label?: string;
  kind?: string;
  dashed?: boolean;
}

export interface LegendItem {
  kind: string;
  label: string;
}

export interface GraphView {
  id: string;
  title: string;
  caption: string;
  width: number;
  height: number;
  nodes: GNode[];
  edges: GEdge[];
  legend: LegendItem[];
}

const W = 760;
const H = 460;

/** Serialize a graphology graph (whose nodes carry x/y/kind attrs) to a GraphView. */
function toView(
  graph: Graph,
  meta: { id: string; title: string; caption: string; legend: LegendItem[] }
): GraphView {
  const nodes: GNode[] = [];
  graph.forEachNode((id, attr) => {
    nodes.push({
      id,
      label: (attr.label as string) ?? id,
      x: attr.x as number,
      y: attr.y as number,
      kind: (attr.kind as string) ?? "default",
      sub: attr.sub as string | undefined,
      size: (attr.size as number) ?? 1,
    });
  });

  const edges: GEdge[] = [];
  graph.forEachEdge((_e, attr, source, target) => {
    edges.push({
      source,
      target,
      label: attr.label as string | undefined,
      kind: attr.kind as string | undefined,
      dashed: attr.dashed as boolean | undefined,
    });
  });

  return { ...meta, width: W, height: H, nodes, edges };
}

/* ------------------------------------------------------------------ *
 * 1. TAXONOMY — a strict hierarchy. Pure parent → child. One way down.
 * ------------------------------------------------------------------ */
export function buildTaxonomy(): GraphView {
  const g = new Graph({ type: "directed" });

  // level 0
  g.addNode("footwear", { label: "Footwear", x: W / 2, y: 50, kind: "class" });
  // level 1
  g.addNode("running", { label: "Running Shoes", x: W / 2, y: 150, kind: "class" });
  // level 2
  g.addNode("road", { label: "Road Running", x: W * 0.3, y: 260, kind: "class" });
  g.addNode("trail", { label: "Trail Running", x: W * 0.7, y: 260, kind: "class" });
  // level 3 — instances/leaves
  g.addNode("pegasus", { label: "Nike Pegasus 41", x: W * 0.15, y: 380, kind: "leaf" });
  g.addNode("clifton", { label: "Hoka Clifton 9", x: W * 0.42, y: 380, kind: "leaf" });
  g.addNode("speedgoat", { label: "Hoka Speedgoat 6", x: W * 0.72, y: 380, kind: "leaf" });

  g.addEdge("footwear", "running", { label: "is-a" });
  g.addEdge("running", "road", { label: "is-a" });
  g.addEdge("running", "trail", { label: "is-a" });
  g.addEdge("road", "pegasus", { label: "is-a" });
  g.addEdge("road", "clifton", { label: "is-a" });
  g.addEdge("trail", "speedgoat", { label: "is-a" });

  return toView(g, {
    id: "taxonomy",
    title: "Taxonomy",
    caption:
      "A strict tree. Every node has exactly one parent and the only relationship is “is-a”. Great for navigation; blind to any link that isn’t hierarchy.",
    legend: [
      { kind: "class", label: "Category" },
      { kind: "leaf", label: "Product" },
    ],
  });
}

/* ------------------------------------------------------------------ *
 * 2. ONTOLOGY — the schema / blueprint (T-Box). Classes + the *types*
 *    of relationships and rules allowed. No real-world instances yet.
 * ------------------------------------------------------------------ */
export function buildOntology(): GraphView {
  const g = new Graph({ type: "directed" });

  g.addNode("Product", { label: "Product", x: W / 2, y: H / 2, kind: "class", size: 1.4 });
  g.addNode("Brand", { label: "Brand", x: W * 0.16, y: 110, kind: "class" });
  g.addNode("Category", { label: "Category", x: W * 0.84, y: 110, kind: "class" });
  g.addNode("Activity", { label: "Activity", x: W * 0.84, y: H - 90, kind: "class" });
  g.addNode("Attribute", { label: "Attribute", x: W * 0.16, y: H - 90, kind: "class" });
  g.addNode("rule", {
    label: "Rule",
    sub: "every Product hasBrand exactly 1 Brand",
    x: W / 2,
    y: H - 60,
    kind: "rule",
  });

  g.addEdge("Product", "Brand", { label: "hasBrand" });
  g.addEdge("Product", "Category", { label: "belongsTo" });
  g.addEdge("Product", "Activity", { label: "suitedFor" });
  g.addEdge("Product", "Attribute", { label: "hasAttribute" });
  g.addEdge("Product", "rule", { label: "constrained-by", kind: "rule", dashed: true });

  return toView(g, {
    id: "ontology",
    title: "Ontology",
    caption:
      "The blueprint: the classes that exist, the relationship *types* allowed between them, and the rules. It defines meaning — not data. Reusable across every product you ever add.",
    legend: [
      { kind: "class", label: "Class / Type" },
      { kind: "rule", label: "Constraint" },
    ],
  });
}

/* ------------------------------------------------------------------ *
 * 3. KNOWLEDGE GRAPH — real instances (A-Box) populating the ontology.
 *    Facts about actual entities, plus links out to the wider web.
 * ------------------------------------------------------------------ */
export function buildKnowledgeGraph(): GraphView {
  const g = new Graph({ type: "directed" });

  g.addNode("pegasus", { label: "Nike Pegasus 41", x: W * 0.34, y: 150, kind: "product", size: 1.3 });
  g.addNode("clifton", { label: "Hoka Clifton 9", x: W * 0.64, y: 300, kind: "product", size: 1.3 });

  g.addNode("nike", { label: "Nike", x: W * 0.12, y: 80, kind: "brand" });
  g.addNode("hoka", { label: "Hoka", x: W * 0.86, y: 380, kind: "brand" });
  g.addNode("road", { label: "Road Running", x: W * 0.5, y: 60, kind: "concept" });
  g.addNode("maxCush", { label: "Max Cushioning", x: W * 0.88, y: 180, kind: "attr" });
  g.addNode("modCush", { label: "Moderate Cushioning", x: W * 0.12, y: 250, kind: "attr" });
  g.addNode("wikidata", { label: "Wikidata: Nike", sub: "sameAs", x: W * 0.1, y: 400, kind: "external" });

  g.addEdge("pegasus", "nike", { label: "madeBy" });
  g.addEdge("clifton", "hoka", { label: "madeBy" });
  g.addEdge("pegasus", "road", { label: "suitedFor" });
  g.addEdge("clifton", "road", { label: "suitedFor" });
  g.addEdge("pegasus", "modCush", { label: "has" });
  g.addEdge("clifton", "maxCush", { label: "has" });
  g.addEdge("nike", "wikidata", { label: "sameAs", kind: "external", dashed: true });

  return toView(g, {
    id: "knowledge-graph",
    title: "Knowledge Graph",
    caption:
      "The ontology, populated with real facts. Named entities and typed, directed edges — machine-readable and resolvable to the wider web via sameAs. This is what AI answer engines reason over.",
    legend: [
      { kind: "product", label: "Product" },
      { kind: "brand", label: "Brand" },
      { kind: "concept", label: "Concept" },
      { kind: "attr", label: "Attribute" },
      { kind: "external", label: "External / sameAs" },
    ],
  });
}

/* ------------------------------------------------------------------ *
 * 4. INFORMATION GRAPH — content & URLs mapped onto entities + demand.
 *    Which page covers what, targets which query, links to what.
 * ------------------------------------------------------------------ */
export function buildInformationGraph(): GraphView {
  const g = new Graph({ type: "directed" });

  // Left column: content assets (pages)
  g.addNode("guide", { label: "“Best Road Running Shoes 2026”", sub: "/guides/road-shoes", x: W * 0.22, y: 90, kind: "page", size: 1.3 });
  g.addNode("review", { label: "Pegasus 41 Review", sub: "/reviews/pegasus-41", x: W * 0.22, y: 230, kind: "page" });
  g.addNode("cat", { label: "Road Shoes Category", sub: "/c/road-running", x: W * 0.22, y: 370, kind: "page" });

  // Middle: entities (from the KG)
  g.addNode("pegasus", { label: "Nike Pegasus 41", x: W * 0.56, y: 150, kind: "entity" });
  g.addNode("clifton", { label: "Hoka Clifton 9", x: W * 0.56, y: 300, kind: "entity" });

  // Right: search demand
  g.addNode("q1", { label: "“best road running shoes”", x: W * 0.86, y: 110, kind: "query" });
  g.addNode("q2", { label: "“nike pegasus 41 review”", x: W * 0.86, y: 320, kind: "query" });

  g.addEdge("guide", "pegasus", { label: "mentions" });
  g.addEdge("guide", "clifton", { label: "mentions" });
  g.addEdge("review", "pegasus", { label: "about" });
  g.addEdge("cat", "clifton", { label: "lists" });
  g.addEdge("guide", "review", { label: "internal-link", kind: "nav", dashed: true });
  g.addEdge("guide", "q1", { label: "targets" });
  g.addEdge("review", "q2", { label: "targets" });

  return toView(g, {
    id: "information-graph",
    title: "Information Graph",
    caption:
      "Maps your content ecosystem onto the entity graph and onto real search demand: which URL covers which entity, targets which query, and links where. This is where SEO meets the knowledge layer.",
    legend: [
      { kind: "page", label: "Page / URL" },
      { kind: "entity", label: "Entity" },
      { kind: "query", label: "Search demand" },
      { kind: "nav", label: "Internal link" },
    ],
  });
}

/* ------------------------------------------------------------------ *
 * 5. CONTEXT GRAPH — the KG with a live user/intent/time/trust overlay
 *    that re-weights which answer wins *right now, for this person*.
 * ------------------------------------------------------------------ */
export function buildContextGraph(): GraphView {
  const g = new Graph({ type: "directed" });

  // Knowledge core
  g.addNode("pegasus", { label: "Nike Pegasus 41", x: W * 0.4, y: 130, kind: "product" });
  g.addNode("clifton", { label: "Hoka Clifton 9", x: W * 0.62, y: 300, kind: "product", size: 1.45 });
  g.addNode("road", { label: "Road Running", x: W * 0.5, y: 60, kind: "concept" });

  // Context overlay
  g.addNode("user", { label: "User", sub: "intent: buy", x: W * 0.12, y: H / 2, kind: "user", size: 1.4 });
  g.addNode("stage", { label: "Decision stage", x: W * 0.16, y: 120, kind: "context" });
  g.addNode("loc", { label: "Atlanta · in-stock", x: W * 0.14, y: H - 110, kind: "context" });
  g.addNode("fresh", { label: "Review < 30 days", x: W * 0.86, y: 150, kind: "context" });
  g.addNode("trust", { label: "Verified retailer", x: W * 0.86, y: 340, kind: "context" });

  g.addEdge("pegasus", "road", { label: "suitedFor" });
  g.addEdge("clifton", "road", { label: "suitedFor" });
  g.addEdge("user", "stage", { label: "in", kind: "context" });
  g.addEdge("user", "loc", { label: "at", kind: "context" });
  g.addEdge("user", "clifton", { label: "best-match (0.92)", kind: "win" });
  g.addEdge("fresh", "clifton", { label: "boosts", kind: "context", dashed: true });
  g.addEdge("trust", "clifton", { label: "boosts", kind: "context", dashed: true });
  g.addEdge("user", "pegasus", { label: "match (0.61)", kind: "context", dashed: true });

  return toView(g, {
    id: "context-graph",
    title: "Context Graph",
    caption:
      "Layers user, intent, journey stage, location, freshness and trust over the knowledge graph — then scores which answer wins for THIS person at THIS moment. The decision layer for AEO/GEO and agents.",
    legend: [
      { kind: "product", label: "Product" },
      { kind: "user", label: "User" },
      { kind: "context", label: "Context signal" },
      { kind: "win", label: "Selected answer" },
    ],
  });
}

/* ------------------------------------------------------------------ *
 * 6. VECTOR / EMBEDDING INDEX — no schema, no typed edges. Meaning is
 *    proximity. Retrieval = nearest neighbors, not graph traversal.
 * ------------------------------------------------------------------ */
export function buildVectorSpace(): GraphView {
  const g = new Graph({ type: "undirected" });

  // Points placed by "semantic" position; the query sits among its neighbors.
  g.addNode("q", { label: "“cushioned shoes for my first marathon”", x: W * 0.5, y: H * 0.52, kind: "query", size: 1.4 });
  g.addNode("clifton", { label: "Hoka Clifton 9", x: W * 0.4, y: H * 0.38, kind: "product" });
  g.addNode("pegasus", { label: "Nike Pegasus 41", x: W * 0.62, y: H * 0.42, kind: "product" });
  g.addNode("bondi", { label: "Hoka Bondi 8", x: W * 0.46, y: H * 0.7, kind: "product" });
  g.addNode("speedgoat", { label: "Speedgoat (trail)", x: W * 0.82, y: H * 0.24, kind: "far" });
  g.addNode("sandal", { label: "Hiking sandal", x: W * 0.86, y: H * 0.8, kind: "far" });

  // "Edges" here are just similarity (distance) — dashed, unlabeled-ish.
  g.addEdge("q", "clifton", { label: "0.91", kind: "sim", dashed: true });
  g.addEdge("q", "pegasus", { label: "0.88", kind: "sim", dashed: true });
  g.addEdge("q", "bondi", { label: "0.85", kind: "sim", dashed: true });

  return toView(g, {
    id: "vector-index",
    title: "Vector / Embedding Index",
    caption:
      "No typed relationships — the dashed lines are similarity scores (cosine distance), not semantic edges. Meaning lives in the positions: things close to the query are retrieved, things far away aren’t. Fast and fuzzy; can’t tell you why two items match or guarantee a fact.",
    legend: [
      { kind: "query", label: "Query embedding" },
      { kind: "product", label: "Near neighbor" },
      { kind: "far", label: "Distant (irrelevant)" },
      { kind: "sim", label: "Cosine similarity" },
    ],
  });
}

/** All six views, in pedagogical order. */
export function buildAllViews(): GraphView[] {
  return [
    buildTaxonomy(),
    buildOntology(),
    buildKnowledgeGraph(),
    buildInformationGraph(),
    buildContextGraph(),
    buildVectorSpace(),
  ];
}

export const VIEW_BUILDERS: Record<string, () => GraphView> = {
  taxonomy: buildTaxonomy,
  ontology: buildOntology,
  "knowledge-graph": buildKnowledgeGraph,
  "information-graph": buildInformationGraph,
  "context-graph": buildContextGraph,
  "vector-index": buildVectorSpace,
};

/* ------------------------------------------------------------------ *
 * 3D data — the knowledge graph laid out in space for the interactive
 * <Graph3D> centerpiece (react-three-fiber). Deterministic positions.
 * ------------------------------------------------------------------ */
export interface GNode3D {
  id: string;
  label: string;
  kind: string;
  pos: [number, number, number];
  size?: number;
}
export interface GEdge3D {
  source: string;
  target: string;
  label?: string;
  dashed?: boolean;
}

export function buildKnowledgeGraph3D(): { nodes: GNode3D[]; edges: GEdge3D[] } {
  const nodes: GNode3D[] = [
    { id: "road", label: "Road Running", kind: "concept", pos: [0, 2.3, 0], size: 0.42 },
    { id: "pegasus", label: "Nike Pegasus 41", kind: "product", pos: [-1.9, 0.7, 0.6], size: 0.55 },
    { id: "clifton", label: "Hoka Clifton 9", kind: "product", pos: [1.9, 0.5, -0.5], size: 0.55 },
    { id: "nike", label: "Nike", kind: "brand", pos: [-3.1, -0.5, -0.9], size: 0.45 },
    { id: "hoka", label: "Hoka", kind: "brand", pos: [3.1, -0.7, 0.7], size: 0.45 },
    { id: "modCush", label: "Moderate Cushioning", kind: "attr", pos: [-2.5, -1.9, 1.1], size: 0.36 },
    { id: "maxCush", label: "Max Cushioning", kind: "attr", pos: [2.5, -1.7, -1.1], size: 0.36 },
    { id: "wikidata", label: "Wikidata: Nike", kind: "external", pos: [-3.8, -2.1, -1.7], size: 0.34 },
  ];
  const edges: GEdge3D[] = [
    { source: "pegasus", target: "nike", label: "madeBy" },
    { source: "clifton", target: "hoka", label: "madeBy" },
    { source: "pegasus", target: "road", label: "suitedFor" },
    { source: "clifton", target: "road", label: "suitedFor" },
    { source: "pegasus", target: "modCush", label: "has" },
    { source: "clifton", target: "maxCush", label: "has" },
    { source: "nike", target: "wikidata", label: "sameAs", dashed: true },
  ];
  return { nodes, edges };
}

/**
 * viewTo3D — project any 2D GraphView into 3D coordinates so the interactive
 * <Graph3D> can render ANY of the six figures. Deterministic: x/y come from the
 * curated 2D layout (centered + scaled), z is a stable per-node spread so the
 * graph reads as dimensional rather than flat. No randomness → SSR-safe.
 */
export function viewTo3D(view: GraphView): {
  nodes: { id: string; label: string; kind: string; pos: [number, number, number]; size: number }[];
  edges: { source: string; target: string; label?: string; kind?: string; dashed?: boolean }[];
} {
  const { width: W, height: H } = view;
  const zFor = (id: string) => {
    let s = 0;
    for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
    return ((s % 1000) / 1000 - 0.5) * 3.4;
  };
  const nodes = view.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    kind: n.kind,
    pos: [(n.x / W - 0.5) * 8.4, (0.5 - n.y / H) * 5.2, zFor(n.id)] as [number, number, number],
    size: 0.26 * (n.size ?? 1) + 0.16,
  }));
  const edges = view.edges.map((e) => ({
    source: e.source,
    target: e.target,
    label: e.label,
    kind: e.kind,
    dashed: e.dashed,
  }));
  return { nodes, edges };
}
