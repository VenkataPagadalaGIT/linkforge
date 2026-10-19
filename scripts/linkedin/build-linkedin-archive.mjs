#!/usr/bin/env node
/**
 * Builds src/data/linkedinArchiveData.ts for the /linkedin archive.
 *
 * Input: items.json written by the media pipeline that runs on the owner's
 * SSD (LinkedIn-Data/web/linkedin/items.json). It holds only items the
 * classification cleared for the public site: no DM media, no personal data.
 *
 * The graph layout (ForceAtlas2) is computed here, once, so the server-rendered
 * SVG and the interactive graph show the same picture and the page needs no
 * JavaScript to draw it.
 *
 * Usage:
 *   node scripts/linkedin/build-linkedin-archive.mjs --items <path/to/items.json> [--include-review]
 *
 * --include-review keeps items flagged `review` (local preview only).
 * scripts/linkedin/check-linkedin-data.mjs fails if any such item is present,
 * so a preview build can never be committed or deployed by accident.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// Public builds write the tracked modules; --include-review writes git-ignored *.preview.ts twins
// that next.config.mjs swaps in only when LINKEDIN_PREVIEW=1 (local preview).

const args = process.argv.slice(2);
const itemsPath = args[args.indexOf("--items") + 1];
const includeReview = args.includes("--include-review");
const suffix = includeReview ? ".preview" : "";
const OUT_ITEMS = path.join(ROOT, `src/data/linkedinArchiveData${suffix}.ts`);
const OUT_GRAPH = path.join(ROOT, `src/data/linkedinGraphData${suffix}.ts`);
if (!itemsPath || args.indexOf("--items") < 0) {
  console.error("usage: build-linkedin-archive.mjs --items <items.json> [--include-review]");
  process.exit(2);
}

// Entities that describe the account itself, not a subject.
const ENTITY_STOP = new Set(["Venkata Pagadala", "LinkedIn"]);
const ENTITY_MIN = 3;
const W = 1000;
const H = 640;

/** Site copy rule: no em dashes, ever. */
const clean = (s) => String(s).replace(/\s*—\s*/g, ", ").replace(/–/g, "-").trim();

/**
 * Captions come from the media classification, which calls the account holder
 * "owner" and prefixes videos with their length. Rewrite for public copy:
 * name him, drop identity guesses, drop the length (shown as a badge instead).
 */
const caption = (s) => {
  let t = clean(s)
    .replace(/^\d+(\.\d+)?s\s+/, "")
    .replace(/\s*\((likely|probably|possibly|presumably)\s+(the\s+)?owner\)/gi, "")
    .replace(/\bthe owner's\b/gi, "Venkata's")
    .replace(/\bowner's\b/gi, "Venkata's")
    .replace(/\bthe owner\b/gi, "Venkata")
    .replace(/\bowner\b/gi, "Venkata")
    .replace(/\s{2,}/g, " ")
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const raw = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
const items = raw
  .filter((i) => includeReview || !i.review)
  .map((i) => {
    const out = {
      idx: i.idx,
      kind: i.kind,
      date: i.date,
      label: i.label,
      context: i.context,
      format: i.format,
      topics: i.topics,
      entities: i.entities.map(clean).filter((e) => !ENTITY_STOP.has(e)),
      description: caption(i.description),
      width: i.width,
      height: i.height,
    };
    if (i.kind === "video") out.duration = i.duration;
    if (i.kind === "document") out.docExt = i.docExt;
    if (i.review) out.review = true;
    return out;
  })
  .sort((a, b) => (a.date === b.date ? a.idx.localeCompare(b.idx) : b.date.localeCompare(a.date)));

// ---- graph: items joined to their topics and to frequent entities ----
const topicCount = new Map();
const entityCount = new Map();
for (const it of items) {
  for (const t of it.topics) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
  for (const e of it.entities) entityCount.set(e, (entityCount.get(e) ?? 0) + 1);
}
const entities = [...entityCount].filter(([, n]) => n >= ENTITY_MIN).map(([e]) => e);
const entitySet = new Set(entities);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const g = new Graph({ type: "undirected" });
const topics = [...topicCount.keys()].sort((a, b) => topicCount.get(b) - topicCount.get(a));
topics.forEach((t, k) => {
  const a = (2 * Math.PI * k) / topics.length;
  g.addNode(`t:${t}`, { x: Math.cos(a) * 100, y: Math.sin(a) * 100, size: 6 + Math.sqrt(topicCount.get(t)) });
});
entities.forEach((e, k) => {
  const a = (2 * Math.PI * k) / entities.length;
  g.addNode(`e:${slug(e)}`, { x: Math.cos(a) * 60, y: Math.sin(a) * 60, size: 3 });
});
items.forEach((it, k) => {
  const a = (2 * Math.PI * k) / items.length;
  g.addNode(`i:${it.idx}`, { x: Math.cos(a) * 140, y: Math.sin(a) * 140, size: 1 });
  for (const t of it.topics) g.addEdge(`i:${it.idx}`, `t:${t}`, { weight: 1 });
  for (const e of it.entities) if (entitySet.has(e) && !g.hasEdge(`i:${it.idx}`, `e:${slug(e)}`)) g.addEdge(`i:${it.idx}`, `e:${slug(e)}`, { weight: 0.6 });
});

forceAtlas2.assign(g, {
  iterations: 600,
  settings: { ...forceAtlas2.inferSettings(g), outboundAttractionDistribution: true, scalingRatio: 8, gravity: 0.8, barnesHutOptimize: true },
});

// Normalise into the W x H box with a margin for labels.
const xs = g.mapNodes((_, a) => a.x);
const ys = g.mapNodes((_, a) => a.y);
const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const M = 50;
const sx = (W - 2 * M) / (maxX - minX || 1);
const sy = (H - 2 * M) / (maxY - minY || 1);
const s = Math.min(sx, sy);
const ox = (W - (maxX - minX) * s) / 2;
const oy = (H - (maxY - minY) * s) / 2;
const pos = new Map();
g.forEachNode((id, a) => pos.set(id, { x: ox + (a.x - minX) * s, y: oy + (a.y - minY) * s }));

// Light collision relaxation so item thumbnails overlap less.
const ids = [...pos.keys()];
const radius = (id) => (id.startsWith("t:") ? 40 : id.startsWith("e:") ? 9 : 5.5);
for (let pass = 0; pass < 60; pass++) {
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      const p = pos.get(ids[a]);
      const q = pos.get(ids[b]);
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const min = ids[a].startsWith("t:") && ids[b].startsWith("t:") ? 95 : Math.min(radius(ids[a]), 18) + Math.min(radius(ids[b]), 18);
      if (d < min) {
        const push = (min - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        const bothTopics = ids[a].startsWith("t:") && ids[b].startsWith("t:");
        const pa = ids[a].startsWith("t:") && !bothTopics ? 0.2 : 1;
        const pb = ids[b].startsWith("t:") && !bothTopics ? 0.2 : 1;
        p.x -= ux * push * pa; p.y -= uy * push * pa;
        q.x += ux * push * pb; q.y += uy * push * pb;
      }
    }
  }
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round = (v) => Math.round(v * 10) / 10;

const nodes = [];
for (const t of topics) {
  const p = pos.get(`t:${t}`);
  nodes.push({ id: `t:${t}`, type: "topic", x: round(clamp(p.x, 20, W - 20)), y: round(clamp(p.y, 20, H - 20)), label: t, count: topicCount.get(t) });
}
for (const e of entities) {
  const p = pos.get(`e:${slug(e)}`);
  nodes.push({ id: `e:${slug(e)}`, type: "entity", x: round(clamp(p.x, 12, W - 12)), y: round(clamp(p.y, 12, H - 12)), label: e, count: entityCount.get(e) });
}
for (const it of items) {
  const p = pos.get(`i:${it.idx}`);
  nodes.push({ id: `i:${it.idx}`, type: "item", x: round(clamp(p.x, 8, W - 8)), y: round(clamp(p.y, 8, H - 8)), label: "", idx: it.idx, kind: it.kind });
}
const edges = [];
g.forEachEdge((_, __, src, tgt) => edges.push(src.startsWith("i:") ? [src, tgt] : [tgt, src]));

const note = includeReview ? "Includes items pending review: LOCAL PREVIEW ONLY (git-ignored)." : "Public items only.";
const itemsSrc = `/* GENERATED by scripts/linkedin/build-linkedin-archive.mjs. Do not edit by hand. ${note} */
import type { LiItem } from "./linkedinArchiveTypes";

export const LINKEDIN_ITEMS: LiItem[] = ${JSON.stringify(items)};
`;
const graphSrc = `/* GENERATED by scripts/linkedin/build-linkedin-archive.mjs. Do not edit by hand. ${note} */
import type { LiGraph } from "./linkedinArchiveTypes";

export const LINKEDIN_GRAPH: LiGraph = ${JSON.stringify({ width: W, height: H, nodes, edges })};
`;
fs.writeFileSync(OUT_ITEMS, itemsSrc);
fs.writeFileSync(OUT_GRAPH, graphSrc);
const kb = (t) => (Buffer.byteLength(t) / 1024).toFixed(0);
console.log(`wrote ${path.relative(ROOT, OUT_ITEMS)} (${kb(itemsSrc)} KB) and ${path.relative(ROOT, OUT_GRAPH)} (${kb(graphSrc)} KB): ${items.length} items (${items.filter((i) => i.review).length} review), ${topics.length} topics, ${entities.length} entities, ${edges.length} edges`);
