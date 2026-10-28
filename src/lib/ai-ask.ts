// "Ask the graph": retrieval over the AI Intelligence Graph for the Ask route.
// Server-side only. It finds the entities a question is about and builds the
// evidence blocks the model may answer from: each block is a fact the page
// shows, with where it came from. Nothing outside these blocks reaches the
// model, so an answer can only cite what the graph holds.

import { getNode, groupOf, membersOf, LAYERS, NODE_TYPE_META, RELATION_META } from "@/data/aiOntology";
import { intelFor } from "@/data/aiIntel";
import { EDGES_OF, dealAmount, periodLabel, rankedSearch, seriesValue } from "@/components/ai/intelModel";

export interface EvidenceBlock { n: number; entity: string; entityName: string; kind: string; text: string; url: string | null }

const STOP = new Set(
  "the a an of to in on and or is are was were what who whom which does do did how with for from by it its that this will can could be vs versus about between into than then them they their there these those has have had when where why much many more most".split(" "),
);
const MAX_CHARS = 16000;

/** The entities a question names, best first: the whole question, then its words and pairs of words. */
export function entitiesFor(question: string, max = 4): string[] {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9.+&-]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  const score = new Map<string, number>();
  const add = (ids: { id: string }[], w: number) => ids.forEach((n, i) => score.set(n.id, (score.get(n.id) ?? 0) + w / (i + 1)));
  add(rankedSearch(question, 5), 3);
  for (let i = 0; i < words.length; i++) {
    add(rankedSearch(words[i], 4), 1);
    if (i + 1 < words.length) add(rankedSearch(`${words[i]} ${words[i + 1]}`, 3), 2);
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);
}

/** Evidence blocks for these entities, within the character budget. */
export function evidenceFor(ids: string[]): EvidenceBlock[] {
  const out: EvidenceBlock[] = [];
  let used = 0;
  const push = (entity: string, kind: string, text: string, url: string | null) => {
    if (used + text.length > MAX_CHARS) return false;
    used += text.length;
    out.push({ n: out.length + 1, entity, entityName: getNode(entity)?.name ?? entity, kind, text, url });
    return true;
  };
  for (const id of ids) {
    const n = getNode(id);
    if (!n) continue;
    const page = `https://venkatapagadala.com/notebook/ai/map/${id}`;
    const head = groupOf(id);
    const units = membersOf(id);
    push(
      id,
      "entry",
      `${n.name} (L${n.layer} ${LAYERS[n.layer].label}; ${NODE_TYPE_META[n.type].label}${n.ticker && n.ticker !== "private" ? `; ${n.ticker}` : ""}${n.hq ? `; ${n.hq}` : ""}${n.chokepoint ? "; a supply-chain chokepoint" : ""}${head ? `; part of ${getNode(head)?.name}` : ""}${units.length ? `; group units: ${units.map((u) => getNode(u)?.name).join(", ")}` : ""}). ${n.tagline}. ${n.story.slice(0, 700)}`,
      page,
    );
    if (n.keyFacts?.length) push(id, "key facts", n.keyFacts.map((f) => `${f.label}: ${f.value}`).join("; "), page);
    const intel = intelFor(id);
    if (intel) {
      for (const d of intel.deals.slice(0, 10)) {
        const ev = d.evidence[0];
        const side = d.side === "buys" ? "buys from" : d.side === "sells" ? "sells to" : d.side === "receives" ? "is funded by" : "backs";
        push(id, "deal", `${n.name} ${side} ${d.counterpartyName}: ${dealAmount(d)} (${d.instrument.replace(/_/g, " ")}${d.termEnd ? `, to ${d.termEnd}` : ""}). ${d.summary}${ev ? ` Source text: "${ev.quote}" (${ev.source})` : ""}`, ev?.url ?? null);
      }
      for (const s of intel.series.slice(0, 12)) {
        const pts = s.points.slice(-6).map((p) => `${periodLabel(p.period)}: ${seriesValue(s, p.value)}`).join("; ");
        const q = s.points[s.points.length - 1]?.quote;
        push(id, "figure", `${n.name}, ${s.label}: ${pts}.${q ? ` Source text: "${q}"` : ""}`, s.points[s.points.length - 1]?.url ?? null);
      }
      if (intel.people.length) push(id, "people", intel.people.map((p) => `${p.name}, ${p.role}`).join("; "), intel.people[0].sourceUrl);
      for (const e of intel.events.slice(-8)) push(id, "event", `${e.dateLabel ?? e.date}: ${e.headline}`, e.url);
      for (const f of intel.forecasts.filter((x) => x.approved)) push(id, "forecast", `Forecast made ${f.madeOn}, resolves ${f.resolvesOn} (${f.outcome}): ${f.statement}. Basis: ${f.basis}`, page);
    }
    // Links, by what they mean, names only.
    const groups: Record<string, string[]> = {};
    for (const e of EDGES_OF.get(id) ?? []) {
      const other = e.from === id ? e.to : e.from;
      const label = e.from === id ? RELATION_META[e.relation].label : `${RELATION_META[e.relation].label} (by them)`;
      (groups[label] ??= []).push(getNode(other)?.name ?? other);
    }
    const linkText = Object.entries(groups)
      .map(([k, v]) => `${k}: ${v.slice(0, 12).join(", ")}${v.length > 12 ? ` and ${v.length - 12} more` : ""}`)
      .join(". ");
    if (linkText) push(id, "links", `${n.name} links. ${linkText}.`, page);
  }
  return out;
}

export const SYSTEM_PROMPT = `You are the analyst for the AI Intelligence Graph on venkatapagadala.com, a map of the AI economy built from public filings and a typed ontology.
Answer only from the numbered evidence blocks. Cite every fact with its block number in square brackets, like [E3]. If the blocks do not cover the question, say exactly what is missing instead of guessing; never add outside knowledge.
Keep amounts with the filing's own qualifier (at least, up to, about) and never add different kinds of money together.
Plain English, short sentences, at most 180 words unless a list is needed. No em dashes. No investment advice: describe exposure and dependence, never what to buy or sell.`;
