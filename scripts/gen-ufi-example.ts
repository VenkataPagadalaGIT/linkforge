/**
 * gen-ufi-example.ts: the figures the User-First Intelligence guide quotes
 * from this site's own data, computed once and written to
 * src/data/ufiExample.ts.
 *
 * Why a generator: the guide reads three large sources (the LinkedIn archive,
 * the Pew corpus and the persona library). Importing them into the guide would
 * ship well over a megabyte of data to every reader's browser, and typing the
 * figures by hand would let them drift from the pages they describe. This
 * script reads the sources, does the arithmetic, and writes a small module.
 *
 * Usage: npx tsx scripts/gen-ufi-example.ts [--check]
 * --check renders without writing and exits 1 if the file on disk differs,
 * so preflight can refuse a guide whose figures went stale.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LINKEDIN_POSTS } from "../src/data/linkedinPostsData";
import { LINKEDIN_GRAPH } from "../src/data/linkedinGraphData";
import taxonomy from "../src/data/linkedinTaxonomy.json";
import { CORPUS_DOCUMENTS, CORPUS_METRICS } from "../src/data/corpus";
import { PERSONA_COUNTS, PERSONAS, PERSONAS_LAST_UPDATED } from "../src/data/personas";
import { FRAMEWORK_COUNTS, FRAMEWORK_VERSION } from "../src/data/personaFramework";

const OUT = join(__dirname, "..", "src", "data", "ufiExample.ts");
const check = process.argv.includes("--check");

type TaxNode = { id: string; level: number; parent: string | null; label: string; slug: string };
const nodes = (taxonomy as { nodes: TaxNode[] }).nodes;
const byId = new Map(nodes.map((n) => [n.id, n]));
const areaOf = (id: string): TaxNode | undefined => {
  let n = byId.get(id);
  while (n && n.parent) n = byId.get(n.parent);
  return n;
};

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  const m = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return Math.round(m * 10) / 10;
}

/* ── LinkedIn: what one author publishes, against what the audience answers ── */

const posts = LINKEDIN_POSTS;
const withReactions = posts.filter((p) => typeof p.engagement?.reactions === "number");
const asOf = withReactions.map((p) => p.engagement!.asOf).sort().at(-1)!;
const windowStart = (() => {
  const d = new Date(`${asOf}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
})();
const inWindow = withReactions.filter((p) => p.date.slice(0, 10) > windowStart && p.date.slice(0, 10) <= asOf);
const byArea = new Map<string, number[]>();
for (const p of inWindow) {
  const areas = new Set(p.topics.map((t) => areaOf(t)?.id).filter((a): a is string => Boolean(a)));
  for (const a of areas) {
    if (!byArea.has(a)) byArea.set(a, []);
    byArea.get(a)!.push(p.engagement!.reactions as number);
  }
}
const overall = median(inWindow.map((p) => p.engagement!.reactions as number));
const rows = [...byArea.entries()]
  .map(([id, r]) => {
    const n = byId.get(id)!;
    return { id, label: n.label, slug: n.slug, posts: r.length, medianReactions: median(r) };
  })
  .sort((a, b) => b.posts - a.posts || a.label.localeCompare(b.label));
const dates = posts.map((p) => p.date.slice(0, 10)).sort();
const graphNodes = LINKEDIN_GRAPH.nodes as { type: string }[];

const UFI_LINKEDIN = {
  source: "/venkata-pagadala-universe",
  posts: posts.filter((p) => p.type === "post").length,
  articles: posts.filter((p) => p.type === "article").length,
  firstDate: dates[0],
  lastDate: dates.at(-1),
  areas: nodes.filter((n) => n.level === 1).length,
  topics: nodes.filter((n) => n.level === 2).length,
  subtopics: nodes.filter((n) => n.level === 3).length,
  entities: graphNodes.filter((n) => n.type === "entity").length,
  graphNodes: graphNodes.length,
  graphLinks: (LINKEDIN_GRAPH.links as unknown[]).length,
  reactionsAsOf: asOf,
  windowStart,
  windowPosts: inWindow.length,
  medianReactions: overall,
  rows,
};

/* ── Pew: who uses which platform, by age (U.S. adults) ── */

const PLATFORMS: [string, string][] = [
  ["youtube", "YouTube"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["whatsapp", "WhatsApp"],
  ["reddit", "Reddit"],
  ["snapchat", "Snapchat"],
  ["x", "X"],
];
const AGES = ["18-29", "30-49", "50-64", "65+"] as const;
const everUse = CORPUS_METRICS.find((m) => m.slug === "ever_use");
if (!everUse) throw new Error("corpus metric ever_use is missing");
const doc = CORPUS_DOCUMENTS.find((d) => d.slug === everUse.document);
if (!doc) throw new Error(`corpus document ${everUse.document} is missing`);
const UFI_PEW_AGE = {
  title: doc.title,
  url: doc.url,
  published: doc.published,
  sampleSize: doc.sampleSize,
  fieldStart: doc.fieldStart,
  fieldEnd: doc.fieldEnd,
  ages: AGES,
  rows: PLATFORMS.map(([id, label]) => {
    const v = (everUse.values as Record<string, Record<string, number>>)[id];
    if (!v) throw new Error(`no ever_use values for ${id}`);
    const byAge = AGES.map((a) => {
      if (typeof v[a] !== "number") throw new Error(`no ${a} value for ${id}`);
      return v[a];
    });
    return { id, label, all: v[""], byAge };
  }),
};

/* ── Personas on this site ── */

const UFI_PERSONAS = {
  personas: PERSONA_COUNTS.personas(),
  studies: PERSONA_COUNTS.studies(),
  measuredTraits: PERSONA_COUNTS.measured(),
  inferredTraits: PERSONA_COUNTS.inferred(),
  lastUpdated: PERSONAS_LAST_UPDATED,
  frameworkDimensions: FRAMEWORK_COUNTS.dimensions,
  frameworkFamilies: FRAMEWORK_COUNTS.families,
  frameworkVersion: FRAMEWORK_VERSION,
};

/* ── The first persona, as a card: every trait with its grade ── */

const first = PERSONAS[0];
const UFI_PERSONA_CARD = {
  slug: first.slug,
  name: first.name,
  segment: first.segment,
  traits: first.traits.map((t) => ({ label: t.label, value: t.value, grade: t.grade })),
};

const body = `// GENERATED by scripts/gen-ufi-example.ts from the LinkedIn archive, the Pew
// corpus and the persona library. Do not edit by hand; rerun the script.

export const UFI_LINKEDIN = ${JSON.stringify(UFI_LINKEDIN, null, 2)} as const;

export const UFI_PEW_AGE = ${JSON.stringify(UFI_PEW_AGE, null, 2)} as const;

export const UFI_PERSONAS = ${JSON.stringify(UFI_PERSONAS, null, 2)} as const;

export const UFI_PERSONA_CARD = ${JSON.stringify(UFI_PERSONA_CARD, null, 2)} as const;
`;

if (check) {
  const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (onDisk !== body) {
    console.error("src/data/ufiExample.ts is stale; run: npx tsx scripts/gen-ufi-example.ts");
    process.exit(1);
  }
  console.log("ufiExample.ts is current");
} else {
  writeFileSync(OUT, body);
  console.log(`wrote ${OUT}: ${UFI_LINKEDIN.windowPosts} posts in window, ${UFI_PEW_AGE.rows.length} platforms`);
}
