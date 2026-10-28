// The AI intelligence graph's shared model: link categories, colours, money
// formatting, the typed edge list, and the two graph questions (who is exposed,
// how two entities connect). The 3D universe and the flat graph both use it.

import { edges as ALL_EDGES, nodes as ALL_NODES, getNode, GROUP_MEMBERS, LAYERS, membersOf, NODE_TYPE_META, RELATION_META, type AiNode, type RelationType } from "@/data/aiOntology";
import { AI_DEAL_EDGES, type IntelDealEdge } from "@/data/aiIntel";

export type Cat = "supply" | "capital" | "peer" | "policy" | "make";
export type Analysis = "none" | "exposed" | "depends" | "path";

/** Where the reader is: all of AI, a layer, a type in it, one entity, and a second entity to compare it with. */
export interface AiScope { layer: number | null; type: string | null; entity: string | null; compare: string | null }
export const EMPTY_SCOPE: AiScope = { layer: null, type: null, entity: null, compare: null };
/** The scope of one entity: its layer and type come with it, so the index and the dashboard open where it sits. */
export function scopeOf(id: string | null): AiScope {
  const n = id ? getNode(id) : undefined;
  return n ? { layer: n.layer, type: `${n.layer}:${n.type}`, entity: n.id, compare: null } : EMPTY_SCOPE;
}

export const CATS: { id: Cat; label: string; hint: string }[] = [
  { id: "supply", label: "Supply chain", hint: "depends on, supplies, hosts, leases" },
  { id: "capital", label: "Capital", hint: "invests in, guarantees, acquired" },
  { id: "peer", label: "Partners and rivals", hint: "partners with, competes with" },
  { id: "policy", label: "Policy", hint: "restricts" },
  { id: "make", label: "Designs", hint: "designs" },
];
export const ALL_CATS: Cat[] = CATS.map((c) => c.id);

// [dark theme, light theme]. Light shades are the -700 of each hue so lines and
// dots clear contrast on white.
export const CAT_COLOR: Record<Cat, [string, string]> = {
  supply: ["#34d399", "#047857"],
  capital: ["#fbbf24", "#b45309"],
  peer: ["#e879f9", "#a21caf"],
  policy: ["#f87171", "#b91c1c"],
  make: ["#cbd5e1", "#475569"],
};
/** Layer colours on white (the -700 of each layer's hue). */
export const LAYER_LIGHT = ["#374151", "#1d4ed8", "#047857", "#b45309", "#be185d", "#6d28d9", "#c2410c"];

export const catOf = (r: RelationType): Cat => {
  const d = RELATION_META[r]?.dir;
  if (d === "up" || d === "down") return "supply";
  if (d === "capital" || d === "peer" || d === "policy" || d === "make") return d;
  return "peer";
};

/** Instruments that move money itself (the rest buy or sell a product: compute, chips, leases). */
export const MONEY_INSTRUMENTS = new Set(["equity", "convertible_note", "warrant", "debt", "grant", "guarantee", "acquisition"]);
/** Relations where the deal's `to` side is the buyer (so money runs to > from). */
const BUYER_IN = new Set(["supplies", "leases_to", "hosts", "licenses", "used_by"]);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const usd = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${Math.round(v / 1e6)}M`);
export const dealAmount = (d: { amount: number | null; amountHigh: number | null; qualifier: string | null }) =>
  d.amount == null ? "amount not disclosed" : d.amountHigh != null ? `${usd(d.amount)} to ${usd(d.amountHigh)}` : `${d.qualifier ? d.qualifier + " " : ""}${usd(d.amount)}`;
const QUALIFIER_MARK: Record<string, string> = {
  "at least": "≥",
  "at least about": "≥~",
  "up to": "≤",
  "up to about": "≤~",
  about: "~",
  "more than": ">",
};
/** A deal's amount in a few characters, for a label on the graph: ≥$110.0B, ~$161.2B, $125.0B-150.0B. */
export const dealShort = (d: { amount: number | null; amountHigh: number | null; qualifier: string | null }) =>
  d.amount == null
    ? "undisclosed"
    : d.amountHigh != null
      ? `${usd(d.amount)}-${usd(d.amountHigh).slice(1)}`
      : `${(d.qualifier && QUALIFIER_MARK[d.qualifier]) ?? ""}${usd(d.amount)}`;
export const monthYear = (iso: string | null) => (iso ? `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : "");
export const dayMonthYear = (iso: string | null) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : "");

export const INSTRUMENT_LABEL: Record<string, string> = {
  compute_commitment: "compute",
  lease: "lease",
  convertible_note: "notes",
  equity: "equity",
  guarantee: "guarantee",
  supply_agreement: "supply",
  warrant: "warrant",
  debt: "debt",
  grant: "grant",
  acquisition: "acquisition",
};

/** Which way the money runs on a deal: true when it runs from > to. */
export function moneyRunsFromTo(d: IntelDealEdge): boolean {
  if (d.moneyDirection === "from_to") return true;
  if (d.moneyDirection === "to_from") return false;
  // No stated direction: the buyer pays the seller.
  return !BUYER_IN.has(d.relation);
}

// ---------------------------------------------------------------------------
// The typed edge list and its indexes (built once per page load)
// ---------------------------------------------------------------------------

export interface Edge { from: string; to: string; relation: RelationType; cat: Cat; note?: string }

export const EDGES: Edge[] = ALL_EDGES.filter((e) => e.from !== e.to && RELATION_META[e.relation]).map((e) => ({
  from: e.from,
  to: e.to,
  relation: e.relation,
  cat: catOf(e.relation),
  note: e.note,
}));
export const DEGREE = new Map<string, number>();
for (const e of EDGES) {
  DEGREE.set(e.from, (DEGREE.get(e.from) ?? 0) + 1);
  DEGREE.set(e.to, (DEGREE.get(e.to) ?? 0) + 1);
}
export const EDGES_OF = new Map<string, Edge[]>();
for (const e of EDGES) {
  (EDGES_OF.get(e.from) ?? EDGES_OF.set(e.from, []).get(e.from)!).push(e);
  (EDGES_OF.get(e.to) ?? EDGES_OF.set(e.to, []).get(e.to)!).push(e);
}
export const DEAL_NODES = new Set(AI_DEAL_EDGES.flatMap((d) => [d.from, d.to]));
export const dealKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const DEALS_BY_PAIR = new Map<string, IntelDealEdge[]>();
for (const d of AI_DEAL_EDGES) {
  const k = dealKey(d.from, d.to);
  (DEALS_BY_PAIR.get(k) ?? DEALS_BY_PAIR.set(k, []).get(k)!).push(d);
}
export const dealsOf = (id: string) => AI_DEAL_EDGES.filter((d) => d.from === id || d.to === id);

// ---------------------------------------------------------------------------
// The two graph questions
// ---------------------------------------------------------------------------

/** Directional reach: who is exposed if `start` fails, or what `start` depends on, within `hops` steps. */
export function reach(start: string, kind: "exposed" | "depends", hops: number, cats: Set<Cat>): { ids: Set<string>; edges: Edge[] } {
  const ids = new Set([start]);
  const used: Edge[] = [];
  let frontier = [start];
  for (let h = 0; h < hops; h++) {
    const next: string[] = [];
    for (const x of frontier) {
      for (const e of EDGES_OF.get(x) ?? []) {
        if (!cats.has(e.cat)) continue;
        const dir = RELATION_META[e.relation]?.dir;
        let y: string | null = null;
        if (kind === "exposed") {
          // Who is hurt if x fails: whoever depends on x, and whoever backs x.
          if (dir === "up" && e.to === x) y = e.from;
          else if (dir === "down" && e.from === x) y = e.to;
          else if (dir === "capital" && e.to === x) y = e.from;
        } else {
          // What x depends on: its suppliers and its backers.
          if (dir === "up" && e.from === x) y = e.to;
          else if (dir === "down" && e.to === x) y = e.from;
          else if (dir === "capital" && e.to === x) y = e.from;
        }
        if (y && !ids.has(y)) {
          ids.add(y);
          next.push(y);
          used.push(e);
        }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return { ids, edges: used };
}

/** The shortest chain of links between two entities (any direction), using only the given link types. */
export function shortestPath(a: string, b: string, cats: Set<Cat>): { ids: string[]; edges: Edge[] } | null {
  if (a === b) return { ids: [a], edges: [] };
  const prev = new Map<string, { id: string; e: Edge }>();
  const seen = new Set([a]);
  const q = [a];
  while (q.length) {
    const x = q.shift()!;
    for (const e of EDGES_OF.get(x) ?? []) {
      if (!cats.has(e.cat)) continue;
      const n = e.from === x ? e.to : e.from;
      if (seen.has(n)) continue;
      seen.add(n);
      prev.set(n, { id: x, e });
      if (n === b) {
        const ids = [b];
        const es: Edge[] = [];
        let cur = b;
        while (cur !== a) {
          const p = prev.get(cur)!;
          es.unshift(p.e);
          ids.unshift(p.id);
          cur = p.id;
        }
        return { ids, edges: es };
      }
      q.push(n);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Search ranked the way an analyst expects: the name first (exact or ticker, then prefix, then a word in it), then
 * the layer or type ("chips" finds the chip makers), then the description; inside each tier the best-connected first.
 */
export function rankedSearch(q: string, limit = 8): AiNode[] {
  const s = fold(q.trim());
  if (!s) return [];
  const word = new RegExp(`(^|[^a-z0-9])${escapeRe(s)}`);
  const out: { n: AiNode; score: number }[] = [];
  for (const n of ALL_NODES) {
    const name = fold(n.name);
    const L = LAYERS[n.layer];
    const ticker = n.ticker && n.ticker !== "private" ? fold(n.ticker) : "";
    const aliases = (n.aliases ?? []).map(fold);
    let tier = 0;
    if (name === s || ticker === s || n.id === s || aliases.includes(s)) tier = 7;
    else if (name.startsWith(s) || aliases.some((a) => a.startsWith(s))) tier = 6;
    else if (word.test(name)) tier = 5;
    else if (name.includes(s) || n.id.replace(/-/g, " ").includes(s)) tier = 4;
    else if (word.test(fold(`${NODE_TYPE_META[n.type].label} ${L.label} ${L.short}`))) tier = 3;
    else if (word.test(fold(n.tagline))) tier = 2;
    else if (fold(n.tagline).includes(s)) tier = 1;
    if (tier) out.push({ n, score: tier * 1000 + Math.min(999, DEGREE.get(n.id) ?? 0) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.n);
}

// ---------------------------------------------------------------------------
// Figures
// ---------------------------------------------------------------------------

/** A period as people read it: 2026-09-30 > 30 Sep 2026, 2026-06 > Jun 2026, H1 2026 stays. */
export const periodLabel = (p: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(p) ? dayMonthYear(p) : /^\d{4}-\d{2}$/.test(p) ? monthYear(`${p}-01`) : p;

/** A measured value with its unit and the filing's own qualifier: $16.3B, ~900%, 11,900+. */
export function seriesValue(s: { metric: string; label: string; unit: string | null }, v: number) {
  const more = /more than/.test(s.label);
  const approx = /approximately/.test(s.label);
  const core =
    s.unit === "USD"
      ? usd(v)
      : s.unit === "pct" || /_pct$/.test(s.metric)
        ? `${Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1)}%`
        : Math.round(v).toLocaleString("en-US");
  return `${approx ? "~" : ""}${core}${more ? "+" : ""}`;
}

// ---------------------------------------------------------------------------
// Compare two: how two entities connect
// ---------------------------------------------------------------------------

/** How `other` relates to `me` on one link, read from me's side: "depends on", "invests in (them)". */
export function relationFrom(me: string, e: Edge): string {
  const label = RELATION_META[e.relation].label;
  return e.from === me ? label : `${label} (them)`;
}

export interface SharedLink {
  id: string;
  cat: Cat;
  /** How each side relates to the shared entity. */
  a: string[];
  b: string[];
}

/** Everything two entities have in common: direct links, shared neighbours by kind, deals with the same party, and the shortest chain. */
export function compareEntities(a: string, b: string) {
  const direct = (EDGES_OF.get(a) ?? []).filter((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
  const side = (me: string) => {
    const m = new Map<string, { cats: Set<Cat>; rel: string[] }>();
    for (const e of EDGES_OF.get(me) ?? []) {
      const o = e.from === me ? e.to : e.from;
      if (o === a || o === b) continue;
      const x = m.get(o) ?? m.set(o, { cats: new Set(), rel: [] }).get(o)!;
      x.cats.add(e.cat);
      const r = relationFrom(me, e);
      if (!x.rel.includes(r)) x.rel.push(r);
    }
    return m;
  };
  const sa = side(a), sb = side(b);
  const shared: SharedLink[] = [];
  for (const [id, x] of sa) {
    const y = sb.get(id);
    if (!y) continue;
    // The kind that matters most for exposure: supply, then capital, then policy, then the rest.
    const order: Cat[] = ["supply", "capital", "policy", "peer", "make"];
    const cat = order.find((c) => x.cats.has(c) || y.cats.has(c)) ?? "peer";
    shared.push({ id, cat, a: x.rel, b: y.rel });
  }
  shared.sort((p, q) => (DEGREE.get(q.id) ?? 0) - (DEGREE.get(p.id) ?? 0));
  const dealParties = (me: string) => new Map(dealsOf(me).map((d) => [d.from === me ? d.to : d.from, d] as const));
  const da = dealParties(a), db = dealParties(b);
  const sharedDeals = [...da.keys()].filter((id) => db.has(id)).map((id) => ({ id, a: da.get(id)!, b: db.get(id)! }));
  return {
    direct,
    shared,
    sharedDeals,
    path: shortestPath(a, b, new Set(ALL_CATS)),
    counts: { a: sa.size, b: sb.size },
  };
}

// ---------------------------------------------------------------------------
// Search by category: "chips" finds the layer, its companies, and the topics that name chips
// ---------------------------------------------------------------------------

/** The words people search with, per layer and per entity type (besides the labels themselves). */
const LAYER_WORDS: Record<number, string[]> = {
  0: ["lab", "labs", "ai lab", "model", "models", "llm", "llms", "foundation model", "frontier"],
  1: ["cloud", "clouds", "hyperscaler", "hyperscalers", "compute", "neocloud", "neoclouds", "gpu cloud"],
  2: ["chip", "chips", "semiconductor", "semiconductors", "semis", "gpu", "gpus", "accelerator", "accelerators", "asic", "asics", "tpu", "silicon"],
  3: ["foundry", "foundries", "fab", "fabs", "packaging", "advanced packaging"],
  4: ["equipment", "lithography", "euv", "tools", "eda", "memory", "hbm", "dram"],
  5: ["material", "materials", "mineral", "minerals", "mining", "miners", "rare earth", "rare earths", "wafer", "wafers"],
  6: ["energy", "power", "electricity", "grid", "data center", "data centers", "datacenter", "capital", "investor", "investors", "policy", "regulation", "networking", "cooling"],
};
const TYPE_WORDS: Partial<Record<AiNode["type"], string[]>> = {
  accelerator: ["chip", "chips", "gpu", "gpus", "accelerator", "accelerators", "asic", "asics", "tpu"],
  cpu: ["cpu", "cpus", "arm", "x86", "processor", "processors"],
  memory: ["memory", "hbm", "dram", "nand"],
  foundry: ["foundry", "foundries", "fab", "fabs"],
  packaging: ["packaging", "cowos", "chiplet", "chiplets"],
  equipment: ["equipment", "lithography", "euv", "tools"],
  eda: ["eda", "chip design"],
  cloud: ["cloud", "clouds", "hyperscaler", "hyperscalers", "neocloud", "neoclouds"],
  "frontier-lab": ["lab", "labs", "ai lab", "ai labs"],
  model: ["model", "models", "llm", "llms"],
  energy: ["energy", "power", "nuclear", "gas", "grid", "electricity"],
  datacenter: ["data center", "data centers", "datacenter", "datacenters"],
  investor: ["investor", "investors", "vc", "capital", "fund", "funds"],
  government: ["policy", "policies", "regulation", "regulator", "regulators", "government", "export controls"],
  mineral: ["mineral", "minerals", "mining", "rare earth", "rare earths"],
  materials: ["material", "materials", "wafer", "wafers", "photoresist", "gases"],
  networking: ["networking", "network", "optics", "optical", "interconnect"],
  cooling: ["cooling", "liquid cooling"],
  dataset: ["data", "dataset", "datasets", "training data"],
  benchmark: ["benchmark", "benchmarks", "eval", "evals"],
  framework: ["framework", "frameworks", "tooling", "library"],
  standard: ["standard", "standards", "protocol", "protocols"],
};

export interface CategoryHit { scope: AiScope; label: string; count: number }
export interface GroupHit { id: string; name: string; units: number }
export interface SearchResults {
  /** Corporate groups whose name or aliases match ("google" > Alphabet). */
  groups: GroupHit[];
  categories: CategoryHit[];
  /** The best group's units, or the best category's entities: public companies first, then the best-connected. */
  members: AiNode[];
  memberOf: string | null;
  /** Entities that match by name or description, beyond the members. */
  matches: AiNode[];
}

const wordsOf = (label: string) => fold(label).split(/[^a-z0-9]+/).filter(Boolean);

export function searchAll(q: string): SearchResults {
  const s = fold(q.trim());
  if (!s) return { groups: [], categories: [], members: [], memberOf: null, matches: [] };
  // A word matches when it is the query, or (from three letters) starts with it; a phrase when it starts with it.
  const hits = (list: string[]) => list.some((w) => w === s || (s.length >= 3 && w.startsWith(s)));
  const groups: GroupHit[] = [];
  for (const [head, units] of GROUP_MEMBERS) {
    const n = getNode(head);
    if (n && (hits(wordsOf(n.name)) || hits((n.aliases ?? []).map(fold)))) groups.push({ id: head, name: n.name, units: units.length });
  }
  groups.sort((a, b) => b.units - a.units);
  const scored: { hit: CategoryHit; score: number; ids: string[] }[] = [];
  for (const L of LAYERS) {
    const ids = ALL_NODES.filter((n) => n.layer === L.id).map((n) => n.id);
    const byLabel = hits(wordsOf(`${L.label} ${L.short}`));
    const bySyn = hits(LAYER_WORDS[L.id] ?? []);
    if (byLabel || bySyn) scored.push({ hit: { scope: { layer: L.id, type: null, entity: null, compare: null }, label: `L${L.id} · ${L.label}`, count: ids.length }, score: (byLabel ? 3 : 2) * 1000 + ids.length, ids });
  }
  const types = new Map<string, { layer: number; type: AiNode["type"]; ids: string[] }>();
  for (const n of ALL_NODES) {
    const k = `${n.layer}:${n.type}`;
    (types.get(k) ?? types.set(k, { layer: n.layer, type: n.type, ids: [] }).get(k)!).ids.push(n.id);
  }
  for (const [key, t] of types) {
    const label = NODE_TYPE_META[t.type].label;
    const byLabel = hits(wordsOf(label));
    const bySyn = hits(TYPE_WORDS[t.type] ?? []);
    if ((byLabel || bySyn) && t.ids.length >= 2)
      scored.push({ hit: { scope: { layer: t.layer, type: key, entity: null, compare: null }, label: `${label} · L${t.layer} ${LAYERS[t.layer].short}`, count: t.ids.length }, score: (byLabel ? 2 : 1) * 1000 + t.ids.length, ids: t.ids });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const isPublic = (n: AiNode) => !!n.ticker && n.ticker !== "private" && !/proposed/i.test(n.ticker);
  // A matching group wins: its units are what the reader wants to see under "google".
  const g = groups[0];
  const members = g
    ? membersOf(g.id)
        .map((id) => getNode(id)!)
        .sort((a, b) => (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0))
        .slice(0, 8)
    : best
      ? best.ids
          .map((id) => getNode(id)!)
          .sort((a, b) => Number(isPublic(b)) - Number(isPublic(a)) || (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0))
          .slice(0, 6)
      : [];
  const shown = new Set([...members.map((n) => n.id), ...groups.map((x) => x.id)]);
  const matches = rankedSearch(q, 16)
    .filter((n) => !shown.has(n.id))
    .slice(0, g || best ? 5 : 8);
  return { groups: groups.slice(0, 3), categories: scored.slice(0, 4).map((x) => x.hit), members, memberOf: g ? `Units of ${g.name}` : best ? `In ${best.hit.label}` : null, matches };
}
