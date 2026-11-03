// The AI Intelligence Graph's public API payloads (app/api/ai/*). Everything
// comes from the generated data modules, so the API says exactly what the
// page says. Drafts (unapproved forecasts and implications) never leave here.

import { nodes, edges, getNode, groupOf, membersOf, LAYERS, NODE_TYPE_META, RELATION_META, ONTOLOGY_COUNTS, type AiNode } from "@/data/aiOntology";
import { AI_DEAL_EDGES, AI_INTEL, intelFor } from "@/data/aiIntel";

export const API_VERSION = "2026-10-28";
export const API_NOTICE =
  "Facts and links from public filings and the AI Systems Map ontology. Every deal carries its source and the filing's own wording. Not investment advice.";
export const API_TERMS = "Quoted text belongs to its publisher. Reuse terms for the graph's own facts and links are published by the owner on the graph page; until then, link to the page.";
export const API_HOME = "https://venkatapagadala.com/notebook/ai/graph";

const slim = (n: AiNode) => ({
  id: n.id,
  name: n.name,
  type: n.type,
  typeLabel: NODE_TYPE_META[n.type].label,
  layer: n.layer,
  tagline: n.tagline,
  hq: n.hq ?? null,
  ticker: n.ticker ?? null,
  website: n.website ?? null,
  chokepoint: !!n.chokepoint,
  group: n.group ?? null,
  aliases: n.aliases ?? [],
});

/** The whole graph: entities, typed links, deals. */
export function graphPayload() {
  const asOf = Object.values(AI_INTEL)
    .map((x) => x.asOf)
    .filter((x): x is string => !!x)
    .sort()
    .pop();
  return {
    version: API_VERSION,
    notice: API_NOTICE,
    terms: API_TERMS,
    home: API_HOME,
    sourcesTo: asOf ?? null,
    counts: { ...ONTOLOGY_COUNTS, deals: AI_DEAL_EDGES.length, companyFiles: Object.values(AI_INTEL).filter((x) => x.series.some((s) => !s.metric.startsWith("share_"))).length },
    layers: LAYERS.map((L) => ({ id: L.id, label: L.label, short: L.short, blurb: L.blurb })),
    relations: Object.entries(RELATION_META).map(([id, m]) => ({ id, label: m.label, direction: m.dir })),
    nodes: nodes.map(slim),
    edges: edges.map((e) => ({ from: e.from, to: e.to, relation: e.relation, note: e.note ?? null })),
    deals: AI_DEAL_EDGES,
  };
}

/** One entity: its record, links, group, and the company file with sources (approved items only). */
export function entityPayload(id: string) {
  const n = getNode(id);
  if (!n) return null;
  const intel = intelFor(id);
  const links = edges
    .filter((e) => e.from === id || e.to === id)
    .map((e) => ({ other: e.from === id ? e.to : e.from, otherName: getNode(e.from === id ? e.to : e.from)?.name ?? null, relation: e.relation, direction: e.from === id ? "out" : "in", note: e.note ?? null }));
  const head = groupOf(id);
  return {
    version: API_VERSION,
    notice: API_NOTICE,
    terms: API_TERMS,
    page: `${API_HOME.replace(/\/graph$/, "")}/map/${id}`,
    entity: { ...slim(n), story: n.story, keyFacts: n.keyFacts ?? [], github: n.github ?? null },
    group: head ? { head, headName: getNode(head)?.name ?? head, units: membersOf(head) } : membersOf(id).length ? { head: id, headName: n.name, units: membersOf(id) } : null,
    links,
    file: intel
      ? {
          asOf: intel.asOf,
          deals: intel.deals,
          series: intel.series,
          people: intel.people,
          events: intel.events,
          forecasts: intel.forecasts.filter((f) => f.approved),
          implications: intel.implications.filter((i) => i.approved),
          pages: intel.pages,
          sources: intel.sources,
        }
      : null,
  };
}

export const allEntityIds = () => nodes.map((n) => n.id);
