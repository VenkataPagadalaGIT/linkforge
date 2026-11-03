#!/usr/bin/env node
/**
 * Builds the /linkedin archive data: media items, posts and articles, the
 * browser's entry index, and the knowledge graph in three precomputed views.
 *
 * Inputs (all public material):
 *   --items  items.json from the media pipeline on the owner's SSD (public media only)
 *   --posts  posts.json from scripts/linkedin/extract-linkedin-posts.py (posts and articles)
 *   src/data/linkedinTaxonomy.json           the topic tree: L1 areas, L2 topics, L3 subtopics
 *   scripts/linkedin/topic-assignments.json  each entry's topics (classified, then audited)
 *
 * An "entry" is what the archive lists and the graph draws: a post, an article,
 * or a media item that belongs to no post. Media in a post take the post's topics.
 *
 * Views, computed once so the server-rendered SVG and the interactive graph match:
 *   topics   - each L1 area a region; its L2 topics are flowers (entries on a
 *              golden-angle spiral: thumbnails at the centre, text posts as dots
 *              around them); L3 subtopics orbit their topic; the tree is drawn (names: Map only)
 *   timeline - one lane per L1 area; each entry a dot at its exact time, sized
 *              by reactions (a beeswarm, so dots do not pile up)
 *   map      - PCA of entry features (topics, subtopics, names, kind, year):
 *              similar entries together, outliers at the edge
 *
 * Usage:
 *   node scripts/linkedin/build-linkedin-archive.mjs --items <items.json> --posts <posts.json> [--include-review]
 *
 * --include-review keeps items flagged `review` and unpublished drafts (local preview only) and writes
 * git-ignored *.preview.ts twins; scripts/linkedin/check-linkedin-data.mjs fails if any reach tracked files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const arg = (name) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : null);
const itemsPath = arg("--items");
const postsPath = arg("--posts");
const includeReview = args.includes("--include-review");
if (!itemsPath || !postsPath) {
  console.error("usage: build-linkedin-archive.mjs --items <items.json> --posts <posts.json> [--include-review]");
  process.exit(2);
}
const suffix = includeReview ? ".preview" : "";
const OUT = (name) => path.join(ROOT, `src/data/${name}${suffix}.ts`);

// Names that describe the account itself, not a subject.
const ENTITY_STOP = new Set(["Venkata Pagadala", "LinkedIn"]);
const ENTITY_MIN = 3;
/** Map view: L2 topics with at least this many entries keep their label visible (the 2D views are retired; kept so the graph data stays stable). */
const MAP_LABEL_MIN = 25;

/** Site copy rule: no em dashes, ever. */
const clean = (s) => String(s).replace(/\s*—\s*/g, ", ").replace(/–/g, "-").trim();
const round = (v) => Math.round(v * 10) / 10;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const GA = Math.PI * (3 - Math.sqrt(5)); // golden angle

/**
 * Captions come from the media classification, which calls the account holder
 * "owner" and prefixes videos with their length. Rewrite for public copy.
 */
const caption = (s) => {
  const t = clean(s)
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

// =====================================================================
// Topic tree and assignments
// =====================================================================
const TAX = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/linkedinTaxonomy.json"), "utf8")).nodes;
const T = new Map(TAX.map((n) => [n.id, n]));
const L1 = TAX.filter((n) => n.level === 1).map((n) => n.id);
const L2 = TAX.filter((n) => n.level === 2).map((n) => n.id);
const L3 = TAX.filter((n) => n.level === 3).map((n) => n.id);
const l1Of = (l2) => T.get(l2)?.parent;
const ASSIGN = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/linkedin/topic-assignments.json"), "utf8"));
const assigned = (key) => {
  const a = ASSIGN[key];
  if (!a) return null;
  const l2 = (a.l2 ?? []).filter((x) => T.get(x)?.level === 2);
  const l3 = (a.l3 ?? []).filter((x) => T.get(x)?.level === 3 && l2.includes(T.get(x).parent));
  return { l2, l3 };
};

// =====================================================================
// Media items, posts and articles
// =====================================================================
const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"))
  .filter((i) => includeReview || !i.review)
  .map((i) => {
    const out = {
      idx: i.idx, kind: i.kind, date: i.date, label: i.label, context: i.context, format: i.format,
      topics: [], subtopics: [],
      entities: i.entities.map(clean).filter((e) => !ENTITY_STOP.has(e)),
      description: caption(i.description), width: i.width, height: i.height,
    };
    if (i.kind === "video") out.duration = i.duration;
    if (i.kind === "document") out.docExt = i.docExt;
    if (i.review) out.review = true;
    return out;
  })
  .sort((a, b) => (a.date === b.date ? a.idx.localeCompare(b.idx) : b.date.localeCompare(a.date)));
if (!items.length) {
  console.error("build-linkedin-archive: no items to build (check --items and the review filter)");
  process.exit(1);
}
const itemByIdx = new Map(items.map((i) => [i.idx, i]));

const rawPosts = JSON.parse(fs.readFileSync(postsPath, "utf8"));
const unclassified = [];
const posts = rawPosts
  .filter((p) => includeReview || !p.draft)
  .filter((p) => p.date && (p.title || p.draft))
  .map((p) => {
    const key = `${p.type}:${p.id}`;
    const a = assigned(key);
    if (!a && !p.draft) unclassified.push(key);
    const out = {
      id: p.id, type: p.type, title: clean(p.title || "Untitled draft"), date: p.date, url: p.url ?? "",
      media: p.media.filter((m) => itemByIdx.has(m)),
      people: p.people.map((x) => ({ name: clean(x.name), url: x.url })),
      topics: a?.l2 ?? [], subtopics: a?.l3 ?? [], words: p.words, excerpt: clean(p.excerpt),
    };
    if (p.activityId) out.activityId = p.activityId;
    if (p.series) out.series = clean(p.series);
    if (p.edition) out.edition = p.edition;
    if (p.cover && itemByIdx.has(p.cover)) out.cover = p.cover;
    const cm = (p.commentMedia ?? []).filter((m) => itemByIdx.has(m));
    if (cm.length) out.commentMedia = cm;
    if (p.engagement) out.engagement = p.engagement;
    if (p.draft) out.review = true;
    return out;
  })
  .sort((a, b) => b.date.localeCompare(a.date));
// Article bodies: images not on the site go; an image without the author's alt text gets its public caption.
const bodies = Object.fromEntries(
  rawPosts
    .filter((p) => posts.some((q) => q.id === p.id))
    .map((p) => [p.id, p.html
      .replace(/<img [^>]*data-li-idx="(\d{4})"[^>]*>/g, (tag, idx) => {
        const it = itemByIdx.get(idx);
        if (!it) return "";
        const esc = it.description.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return tag.replace(/alt=""/, `alt="${esc}"`);
      })
      .replace(/<figure>(?:(?!<img)[\s\S])*?<\/figure>/g, "")]),
);
// Media join their post (first one wins) and take its topics.
for (const p of posts) for (const m of p.media) {
  const it = itemByIdx.get(m);
  if (!it.post) it.post = p.id;
  else if (it.post !== p.id) console.warn(`build-linkedin-archive: ${m} is in "${it.post}" and "${p.id}"; its card links the first`);
}
for (const p of posts) for (const m of p.commentMedia ?? []) {
  const it = itemByIdx.get(m);
  if (!it.post) { it.post = p.id; it.inComment = true; }
}
const postById = new Map(posts.map((p) => [p.id, p]));
for (const it of items) {
  const owner = it.post ? postById.get(it.post) : null;
  const a = owner ? { l2: owner.topics, l3: owner.subtopics } : assigned(`media:${it.idx}`);
  if (!owner && !a) unclassified.push(`media:${it.idx}`);
  it.topics = a?.l2 ?? [];
  it.subtopics = a?.l3 ?? [];
}

// =====================================================================
// Entries
// =====================================================================
const namesOf = (idxs) => [...new Set(idxs.flatMap((m) => itemByIdx.get(m)?.entities ?? []))];
const entries = [
  ...posts.map((p) => ({
    key: `${p.type}:${p.id}`, kind: p.type, id: p.id, title: p.title, date: p.date, excerpt: p.excerpt,
    media: p.media, commentMedia: p.commentMedia, url: p.url, activityId: p.activityId, engagement: p.engagement,
    topics: p.topics, subtopics: p.subtopics, names: namesOf([...p.media, ...(p.commentMedia ?? [])]),
    words: p.words, review: p.review, cover: p.cover ?? p.media[0] ?? p.commentMedia?.[0],
  })),
  ...items.filter((i) => !i.post).map((i) => ({
    key: `media:${i.idx}`, kind: "media", id: i.idx, title: i.description, date: i.date, excerpt: "",
    media: [i.idx], url: "", topics: i.topics, subtopics: i.subtopics, names: i.entities, review: i.review, cover: i.idx,
  })),
].sort((a, b) => b.date.localeCompare(a.date));

// Recurring names: in at least ENTITY_MIN entries.
const nameCount = new Map();
for (const e of entries) for (const n of e.names) nameCount.set(n, (nameCount.get(n) ?? 0) + 1);
const names = [...nameCount].filter(([, n]) => n >= ENTITY_MIN).sort((a, b) => b[1] - a[1]).map(([n]) => n);
const nameSet = new Set(names);

// Counts per topic node.
const count = new Map(TAX.map((n) => [n.id, 0]));
for (const e of entries) {
  for (const t of e.topics) count.set(t, count.get(t) + 1);
  for (const t of e.subtopics) count.set(t, count.get(t) + 1);
  for (const a of new Set(e.topics.map(l1Of))) count.set(a, count.get(a) + 1);
}
const main = (e) => e.topics[0] ?? null; // the L2 whose flower draws it
const own = new Map(L2.map((t) => [t, entries.filter((e) => main(e) === t)]));
const l1Main = (e) => (main(e) ? l1Of(main(e)) : "unsorted");
const maxReactions = Math.max(1, ...entries.map((e) => e.engagement?.reactions ?? 0));
const dotR = (e) => (e.kind === "article" ? 4 : e.kind === "media" ? 2.4 : round(1.6 + 4.4 * Math.sqrt((e.engagement?.reactions ?? 0) / maxReactions)));

// =====================================================================
// View 1: topics (areas, topic flowers, subtopic satellites)
// =====================================================================
const S = 5.4; // spiral spacing (a card is 6.5 units, a dot about 3)
const flowerR = (t) => S * Math.sqrt(own.get(t).length + 2.5) + 4;
const CHAR = 6.9; // label character width at 11.5px mono
const labelHalf = (t) => (T.get(t).label.length * CHAR) / 2;
const fp = (t) => Math.max(flowerR(t) + 9, labelHalf(t) * 0.3);
// How much two L2 topics share (entries carrying both): related flowers sit closer.
const shared = new Map();
for (const e of entries) for (const a of e.topics) for (const b of e.topics) if (a < b) shared.set(`${a}|${b}`, (shared.get(`${a}|${b}`) ?? 0) + 1);
const w2 = (a, b) => shared.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? 0;

const spiralPlace = (start, fits, flatten = 0.75, step = 0.9) => {
  for (let k = 0; k < 30000; k++) {
    const a = k * 0.31, r = k * step;
    const p = [start[0] + Math.cos(a) * r, start[1] + Math.sin(a) * r * flatten];
    if (fits(p)) return p;
  }
  return null;
};
// 1a. Inside each area: pack its topic flowers (largest first, near the topics they share most with).
const local = new Map(); // L2 -> [x, y] relative to its area centre
const areaR = new Map();
for (const a of L1) {
  const kids = L2.filter((t) => T.get(t).parent === a && own.get(t).length > 0).sort((x, y) => own.get(y).length - own.get(x).length);
  const placed = [];
  for (const t of kids) {
    let start = [0, 0], ws = 0;
    for (const p of placed) { const k = w2(t, p); if (k) { start = [start[0] + local.get(p)[0] * k, start[1] + local.get(p)[1] * k]; ws += k; } }
    if (ws) start = [start[0] / ws, start[1] / ws];
    const pos = placed.length ? spiralPlace(start, (q) => placed.every((p) => Math.hypot(local.get(p)[0] - q[0], (local.get(p)[1] - q[1]) * 1.08) >= fp(t) + fp(p) + 3), 0.8, 0.6) : [0, 0];
    if (!pos) throw new Error(`build-linkedin-archive: could not place the "${t}" flower`);
    local.set(t, pos);
    placed.push(t);
  }
  // re-centre the area on the box around its flowers, then its radius covers every flower (labels sit in the margin)
  if (placed.length) {
    const x0 = Math.min(...placed.map((t) => local.get(t)[0] - flowerR(t))), x1 = Math.max(...placed.map((t) => local.get(t)[0] + flowerR(t)));
    const y0 = Math.min(...placed.map((t) => local.get(t)[1] - flowerR(t))), y1 = Math.max(...placed.map((t) => local.get(t)[1] + flowerR(t)));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    for (const t of placed) local.set(t, [local.get(t)[0] - cx, local.get(t)[1] - cy]);
  }
  areaR.set(a, Math.max(36, ...placed.map((t) => Math.hypot(...local.get(t)) + flowerR(t) + 16)) + 8);
}
// 1b. Pack the areas themselves (largest first, near the areas they share entries with).
const sharedArea = (a, b) => L2.filter((x) => l1Of(x) === a).reduce((s, x) => s + L2.filter((y) => l1Of(y) === b).reduce((t, y) => t + w2(x, y), 0), 0);
const areaPos = new Map();
const areasBySize = L1.filter((a) => own.size && L2.some((t) => l1Of(t) === a && own.get(t).length)).sort((x, y) => areaR.get(y) - areaR.get(x));
for (const a of areasBySize) {
  const placed = [...areaPos.keys()];
  let start = [0, 0], ws = 0;
  for (const p of placed) { const k = sharedArea(a, p); if (k) { start = [start[0] + areaPos.get(p)[0] * k, start[1] + areaPos.get(p)[1] * k]; ws += k; } }
  if (ws) start = [start[0] / ws, start[1] / ws];
  const pos = placed.length ? spiralPlace(start, (q) => placed.every((p) => Math.hypot(areaPos.get(p)[0] - q[0], (areaPos.get(p)[1] - q[1]) * 1.1) >= areaR.get(a) + areaR.get(p) + 6), 0.72, 1.0) : [0, 0];
  if (!pos) throw new Error(`build-linkedin-archive: could not place the "${a}" area`);
  areaPos.set(a, pos);
}
const posT = new Map();
for (const a of areasBySize) {
  const [ax, ay] = areaPos.get(a);
  posT.set(`t:${a}`, [ax, ay - areaR.get(a) + 8]); // the area's label point, at the top of its region
  for (const t of L2.filter((x) => l1Of(x) === a && local.has(x))) {
    const [lx, ly] = local.get(t);
    const hx = ax + lx, hy = ay + ly;
    posT.set(`t:${t}`, [hx, hy]);
    // cards first (the flower's centre shows thumbnails), then text posts as dots around them
    const members = [...own.get(t)].sort((p, q) => (p.cover ? 0 : 1) - (q.cover ? 0 : 1) || q.date.localeCompare(p.date));
    members.forEach((e, k) => {
      const r = S * Math.sqrt(k + 2.5), ang = k * GA;
      posT.set(`e:${e.key}`, [hx + Math.cos(ang) * r, hy + Math.sin(ang) * r]);
    });
    // subtopics orbit just outside the flower
    const subs = L3.filter((s) => T.get(s).parent === t && count.get(s) > 0);
    subs.forEach((s, k) => {
      const ang = -Math.PI / 2 + (k + 0.5) * ((2 * Math.PI) / Math.max(subs.length, 1)) + 0.4;
      posT.set(`t:${s}`, [hx + Math.cos(ang) * (flowerR(t) + 5), hy + Math.sin(ang) * (flowerR(t) + 5)]);
    });
  }
}
// Each topic label goes below or above its flower, whichever collides less.
const labelSide = new Map();
{
  const rects = [];
  const circles = L2.filter((t) => posT.has(`t:${t}`)).map((t) => ({ x: posT.get(`t:${t}`)[0], y: posT.get(`t:${t}`)[1], r: flowerR(t) }));
  const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const hits = (rc) => circles.reduce((s, c) => {
    const nx = Math.max(rc.x0, Math.min(c.x, rc.x1)), ny = Math.max(rc.y0, Math.min(c.y, rc.y1));
    return s + (Math.hypot(nx - c.x, ny - c.y) < c.r - 2 ? 60 : 0);
  }, 0);
  for (const t of [...L2].filter((x) => posT.has(`t:${x}`)).sort((a, b) => own.get(b).length - own.get(a).length)) {
    const [x, y] = posT.get(`t:${t}`), R = flowerR(t), h = labelHalf(t);
    const cand = [
      { side: "below", x0: x - h, x1: x + h, y0: y + R + 3, y1: y + R + 17 },
      { side: "above", x0: x - h, x1: x + h, y0: y - R - 17, y1: y - R - 3 },
    ];
    let best = cand[0], cost = Infinity;
    for (const c of cand) { const v = rects.reduce((s, r) => s + overlap(c, r), 0) + hits(c) + (c.side === "above" ? 1 : 0); if (v < cost) { cost = v; best = c; } }
    rects.push(best);
    labelSide.set(t, best.side);
  }
}
// Recurring names are not drawn in the Topics view (the sidebar's topic tree is the one way to browse there, and many
// names repeat a topic, e.g. brightonSEO); they stay in the Map, in each post's panel and in search.
// Fit into the shared viewBox: regions and labels need room.
const M = 24, ENT_CHAR = 6.6;
const extents = [];
for (const a of areasBySize) { const [x, y] = areaPos.get(a), r = areaR.get(a); extents.push([x - r, y - r - 6], [x + r, y + r]); }
{
  const midX = (Math.min(...[...posT.values()].map((p) => p[0])) + Math.max(...[...posT.values()].map((p) => p[0]))) / 2;
  for (const [k, p] of posT) {
    if (k.startsWith("n:")) { const n = names.find((x) => `n:${slug(x)}` === k); const w = n.length * ENT_CHAR + 10; extents.push(p[0] < midX ? [p[0] - w, p[1]] : [p[0] + w, p[1]]); }
    extents.push(p);
  }
}
const xs = extents.map((p) => p[0]), ys = extents.map((p) => p[1]);
let W = Math.max(...xs) - Math.min(...xs) + 2 * M, H = Math.max(...ys) - Math.min(...ys) + 2 * M + 30;
W = Math.max(W, 1100); H = Math.max(H, 640);
if (W / H < 1.45) W = H * 1.45;
if (W / H > 1.9) H = W / 1.9;
W = Math.round(W); H = Math.round(H);
const regions = [];
{
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const dx = (W - (maxX - minX)) / 2 - minX, dy = (H - (maxY - minY)) / 2 - minY;
  for (const [k, p] of posT) posT.set(k, [round(p[0] + dx), round(p[1] + dy)]);
  for (const a of areasBySize) regions.push({ id: a, x: round(areaPos.get(a)[0] + dx), y: round(areaPos.get(a)[1] + dy), r: round(areaR.get(a)) });
}

// =====================================================================
// View 2: timeline (one lane per area, a beeswarm of dots by exact time)
// =====================================================================
const posL = new Map();
const yearsList = [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort();
const LEFT = 250, RIGHT = 30, TOP = 64, AXIS = H - 40;
const weights = yearsList.map((y) => Math.max(Math.sqrt(entries.filter((e) => e.date.startsWith(y)).length), 2.2));
const wsum = weights.reduce((a, b) => a + b, 0);
const bands = [];
{
  let x = LEFT;
  yearsList.forEach((y, k) => { const bw = ((W - LEFT - RIGHT) * weights[k]) / wsum; bands.push({ year: y, x0: x, x1: x + bw }); x += bw; });
}
const laneIds = [...areasBySize.filter((a) => entries.some((e) => l1Main(e) === a)).sort((a, b) => L1.indexOf(a) - L1.indexOf(b)), ...(entries.some((e) => l1Main(e) === "unsorted") ? ["unsorted"] : [])];
const laneY = new Map(laneIds.map((id, k) => [id, TOP + ((AXIS - 30 - TOP) * k) / Math.max(1, laneIds.length - 1)]));
const laneHalf = ((AXIS - 30 - TOP) / Math.max(1, laneIds.length - 1)) / 2 - 3;
const timeFrac = (d) => { const t = new Date(d.length === 10 ? `${d}T12:00:00Z` : d); const s = Date.UTC(t.getUTCFullYear(), 0, 1); return (t - s) / (366 * 864e5); };
{
  const placedByLane = new Map(laneIds.map((id) => [id, []]));
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    const lane = l1Main(e), y0 = laneY.get(lane), placed = placedByLane.get(lane), r = dotR(e);
    const b = bands.find((x) => x.year === e.date.slice(0, 4));
    const x = b.x0 + 4 + (b.x1 - b.x0 - 8) * timeFrac(e.date);
    const near = placed.filter((p) => Math.abs(p[0] - x) < r + 7);
    let best = y0, bestCost = Infinity;
    for (let k = 0; k <= 60; k++) {
      const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.4;
      if (Math.abs(off) > laneHalf - r) break;
      const y = y0 + off;
      const cost = near.reduce((s, p) => s + Math.max(0, p[2] + r + 0.4 - Math.hypot(p[0] - x, p[1] - y)), 0);
      if (cost === 0) { best = y; bestCost = 0; break; }
      if (cost < bestCost) { bestCost = cost; best = y; }
    }
    placed.push([x, best, r]);
    posL.set(`e:${e.key}`, [round(x), round(best)]);
  }
  for (const id of laneIds) if (id !== "unsorted") posL.set(`t:${id}`, [LEFT - 16, round(laneY.get(id))]);
}

// =====================================================================
// View 3: map (PCA of entry features)
// =====================================================================
const posM = new Map();
const mapped = entries.filter((e) => e.topics.length);
const feat = (e) => [
  ...L2.map((t) => (e.topics.includes(t) ? (t === main(e) ? 1.2 : 0.8) : 0)),
  ...L3.map((t) => (e.subtopics.includes(t) ? 0.6 : 0)),
  ...L1.map((a) => (e.topics.some((t) => l1Of(t) === a) ? 0.5 : 0)),
  ...names.map((n) => (e.names.includes(n) ? 0.4 : 0)),
  ...["post", "article", "media"].map((k) => (e.kind === k ? 0.25 : 0)),
  ((+e.date.slice(0, 4) - 2016) / 10) * 0.6,
];
const X = mapped.map(feat), D = X[0].length;
const mean = Array.from({ length: D }, (_, j) => X.reduce((s, r) => s + r[j], 0) / X.length);
const Xc = X.map((r) => r.map((v, j) => v - mean[j]));
const cov = Array.from({ length: D }, (_, a) => Array.from({ length: D }, (_, b) => Xc.reduce((s, r) => s + r[a] * r[b], 0) / Xc.length));
const power = (C, deflate) => {
  let v = Array.from({ length: D }, (_, k) => Math.sin(k + 1));
  for (let it = 0; it < 300; it++) {
    let nv = C.map((row) => row.reduce((s, c, j) => s + c * v[j], 0));
    if (deflate) { const d = nv.reduce((s, x, j) => s + x * deflate[j], 0); nv = nv.map((x, j) => x - d * deflate[j]); }
    const n = Math.hypot(...nv) || 1;
    v = nv.map((x) => x / n);
  }
  return v;
};
const signFix = (v) => { const k = v.reduce((bi, x, i) => (Math.abs(x) > Math.abs(v[bi]) ? i : bi), 0); return v[k] < 0 ? v.map((x) => -x) : v; };
const pc1 = signFix(power(cov, null)), pc2 = signFix(power(cov, pc1));
let pts = Xc.map((r) => [r.reduce((s, x, j) => s + x * pc1[j], 0), r.reduce((s, x, j) => s + x * pc2[j], 0)]);
{
  const groups = new Map();
  pts.forEach((p, k) => { const key = `${p[0].toFixed(3)},${p[1].toFixed(3)}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(k); });
  const span = Math.max(Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))) || 1;
  for (const ks of groups.values()) ks.forEach((k, j) => { if (!j) return; const r = (span / 140) * Math.sqrt(j), a = j * GA; pts[k] = [pts[k][0] + Math.cos(a) * r, pts[k][1] + Math.sin(a) * r]; });
  const MM = 60;
  const [x0, x1, y0, y1] = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
  const sc = Math.min((W - 2 * MM) / (x1 - x0 || 1), (H - 2 * MM) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
  pts = pts.map(([x, y]) => [ox + (x - x0) * sc, oy + (y1 - y) * sc]); // +PC2 points up
}
const sizeM = mapped.map((e) => (e.cover ? 3.6 : 1.9));
for (let pass = 0; pass < 30; pass++) {
  for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
    const dx = pts[b][0] - pts[a][0], dy = pts[b][1] - pts[a][1];
    const need = sizeM[a] + sizeM[b] + 0.6;
    if (Math.abs(dx) > need || Math.abs(dy) > need) continue;
    const d = Math.hypot(dx, dy) || 0.01;
    if (d < need) { const push = (need - d) / 2, ux = dx / d, uy = dy / d; pts[a][0] -= ux * push; pts[a][1] -= uy * push; pts[b][0] += ux * push; pts[b][1] += uy * push; }
  }
}
mapped.forEach((e, k) => posM.set(`e:${e.key}`, [round(pts[k][0]), round(pts[k][1])]));
const meanOf = (pred) => { const ks = mapped.map((e, k) => (pred(e) ? k : -1)).filter((k) => k >= 0); return ks.length ? [round(ks.reduce((s, k) => s + pts[k][0], 0) / ks.length), round(ks.reduce((s, k) => s + pts[k][1], 0) / ks.length)] : null; };
for (const t of L2) { const p = meanOf((e) => main(e) === t) ?? meanOf((e) => e.topics.includes(t)); if (p) posM.set(`t:${t}`, p); }
for (const a of L1) { const p = meanOf((e) => l1Main(e) === a); if (p) posM.set(`t:${a}`, p); }
for (const s of L3) { const p = meanOf((e) => e.subtopics.includes(s)); if (p) posM.set(`t:${s}`, p); }
for (const n of names) { const p = meanOf((e) => e.names.includes(n)); if (p) posM.set(`n:${slug(n)}`, p); }
// L2 labels on the map: start above the anchor, push apart, pull back toward it.
const mapLabel = new Map();
{
  const Ls = L2.filter((t) => posM.has(`t:${t}`)).map((t) => {
    const [ax, ay] = posM.get(`t:${t}`);
    return { t, ax, ay, x: ax, y: ay - 14, w: T.get(t).label.length * 6.7 + 8, h: 15, always: count.get(t) >= MAP_LABEL_MIN };
  });
  for (let pass = 0; pass < 400; pass++) {
    for (let i = 0; i < Ls.length; i++) for (let j = i + 1; j < Ls.length; j++) {
      const a = Ls[i], b = Ls[j];
      if (!a.always || !b.always) continue;
      const ox = (a.w + b.w) / 2 - Math.abs(a.x - b.x), oy = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
      if (ox > 0 && oy > 0) {
        if (oy < ox) { const d = (oy / 2 + 0.5) * Math.sign(a.y - b.y || 1); a.y += d; b.y -= d; }
        else { const d = (ox / 2 + 0.5) * Math.sign(a.x - b.x || 1); a.x += d; b.x -= d; }
      }
    }
    for (const l of Ls) { l.x += (l.ax - l.x) * 0.01; l.y += (l.ay - 14 - l.y) * 0.01; l.x = Math.max(l.w / 2 + 6, Math.min(W - l.w / 2 - 6, l.x)); l.y = Math.max(16, Math.min(H - 10, l.y)); }
  }
  for (const l of Ls) mapLabel.set(l.t, [round(l.x - l.ax), round(l.y - l.ay)]);
}
const cxM = pts.reduce((s, p) => s + p[0], 0) / pts.length, cyM = pts.reduce((s, p) => s + p[1], 0) / pts.length;
const dists = pts.map((p) => Math.hypot(p[0] - cxM, p[1] - cyM)).sort((a, b) => a - b);
const pct = (q) => dists[Math.min(dists.length - 1, Math.floor(q * dists.length))];
// Nearest neighbours in feature space (cosine): the map's hairlines.
const knn = new Set();
{
  const norm = X.map((r) => Math.hypot(...r) || 1);
  for (let a = 0; a < X.length; a++) {
    let best = [[-1, -1], [-1, -1]];
    for (let b = 0; b < X.length; b++) {
      if (a === b) continue;
      let dot = 0; for (let j = 0; j < D; j++) dot += X[a][j] * X[b][j];
      const s = dot / (norm[a] * norm[b]);
      if (s > best[0][0]) best = [[s, b], best[0]]; else if (s > best[1][0]) best[1] = [s, b];
    }
    for (const [, b] of best) if (b >= 0) knn.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
}

// =====================================================================
// Assemble
// =====================================================================
const at = (m, id) => (m.has(id) ? m.get(id) : null);
const nodes = [];
for (const n of TAX) {
  if (!count.get(n.id)) continue;
  const id = `t:${n.id}`;
  nodes.push({
    id, type: "topic", label: n.id, level: n.level, count: count.get(n.id),
    ...(n.level === 2 ? { own: own.get(n.id).length, labelAbove: labelSide.get(n.id) === "above" || undefined, mapLabel: mapLabel.get(n.id) } : {}),
    pos: { topics: at(posT, id), timeline: at(posL, id), map: at(posM, id) },
  });
}
for (const n of names) {
  const id = `n:${slug(n)}`;
  nodes.push({ id, type: "entity", label: n, count: nameCount.get(n), pos: { topics: at(posT, id), timeline: null, map: at(posM, id) } });
}
for (const e of entries) {
  const id = `e:${e.key}`;
  nodes.push({ id, type: "entry", label: e.key, entryKind: e.kind, ...(e.cover ? { cover: e.cover } : {}), size: dotR(e), pos: { topics: at(posT, id), timeline: at(posL, id), map: at(posM, id) } });
}
const links = [];
for (const e of entries) {
  for (const t of e.topics) links.push([`e:${e.key}`, `t:${t}`]);
  for (const t of e.subtopics) links.push([`e:${e.key}`, `t:${t}`]);
  for (const n of e.names) if (nameSet.has(n)) links.push([`e:${e.key}`, `n:${slug(n)}`]);
}
const tree = TAX.filter((n) => n.parent && count.get(n.id) && count.get(n.parent)).map((n) => [`t:${n.id}`, `t:${n.parent}`]);
links.push(...tree);
const lines = {
  topics: tree.filter(([a, b]) => posT.has(a) && posT.has(b)),
  timeline: [],
  map: [...knn].map((k) => { const [a, b] = k.split("|").map(Number); return [`e:${mapped[a].key}`, `e:${mapped[b].key}`]; }),
};
const asOf = posts.find((p) => p.engagement)?.engagement.asOf ?? "";
const graph = {
  width: W, height: H, nodes, links, lines, regions,
  timeline: { axisY: AXIS, left: LEFT, years: bands.map((b) => ({ year: b.year, x0: round(b.x0), x1: round(b.x1) })), lanes: laneIds.map((id) => ({ id, y: round(laneY.get(id)) })) },
  map: { cx: round(cxM), cy: round(cyM), rings: [{ r: round(pct(0.5)), label: "typical" }, { r: round(pct(0.9)), label: "outlier" }] },
  ...(asOf ? { engagementAsOf: asOf } : {}),
};

// The browser's entry index (compact; expanded by src/data/linkedinArchive.ts).
const engRaw = (e) => {
  const g = e.engagement;
  if (!g) return undefined;
  const flags = `${g.source === "page+analytics" ? "a" : ""}${g.impressionsAtLeast ? "f" : ""}${g.engagementsAtLeast ? "g" : ""}`;
  return [g.reactions ?? null, g.comments ?? null, g.reposts ?? null, g.impressions ?? null, g.engagements ?? null, flags];
};
const cut = (s, n) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, "")}...` : s);
const entriesRaw = entries.map((e) => {
  const r = { k: e.kind, i: e.id, t: e.title, d: e.date, x: cut(e.excerpt, e.kind === "article" ? 240 : 200), l2: e.topics };
  if (e.kind !== "media" && e.media.length) r.m = e.media;
  if (e.commentMedia?.length) r.cm = e.commentMedia;
  if (e.activityId) r.a = e.activityId;
  if (e.kind === "article") { r.u = e.url; r.w = e.words; }
  const g = engRaw(e); if (g) r.e = g;
  if (e.subtopics.length) r.l3 = e.subtopics;
  const ns = e.names.filter((n) => nameSet.has(n)); if (ns.length) r.n = ns;
  if (e.review) r.rv = 1;
  return r;
});

// Search text: every word of every post and article (tags and URLs out), so search finds what the short excerpt
// leaves out. Its own module, loaded only when someone searches.
const decodeEntities = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&");
const searchText = Object.fromEntries(
  entries
    .filter((e) => e.kind !== "media" && bodies[e.id])
    .map((e) => [
      e.key,
      decodeEntities(bodies[e.id].replace(/<[^>]+>/g, " "))
        .replace(/https?:\/\/\S+|\{\{media\}\}\S*/g, " ")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim(),
    ]),
);

const note = includeReview ? "Includes items pending review: LOCAL PREVIEW ONLY (git-ignored)." : "Public items only.";
const head = `/* GENERATED by scripts/linkedin/build-linkedin-archive.mjs. Do not edit by hand. ${note} */`;
const headMore = (more) => `/* GENERATED by scripts/linkedin/build-linkedin-archive.mjs. Do not edit by hand. ${note}\n * ${more} */`;
const asJson = (v) => `JSON.parse(${JSON.stringify(JSON.stringify(v))})`;
const files = {
  linkedinArchiveData: `${head}\nimport type { LiItem } from "./linkedinArchiveTypes";\n\nexport const LINKEDIN_ITEMS: LiItem[] = ${JSON.stringify(items)};\n`,
  linkedinGraphData: `${head}\nimport type { LiGraph } from "./linkedinArchiveTypes";\n\n// A JSON string: too big a literal for the type checker, and JSON.parse is the fastest way to load it.\nexport const LINKEDIN_GRAPH: LiGraph = ${asJson(graph)};\n`,
  linkedinPostsData: `${head}\nimport type { LiPost } from "./linkedinArchiveTypes";\n\nexport const LINKEDIN_POSTS: LiPost[] = ${JSON.stringify(posts)};\n`,
  linkedinPostBodiesData: `${headMore('Article bodies, rebuilt from an allowlist of tags by extract-linkedin-posts.py; "{{media}}" is the media base URL.')}\n\nexport const LINKEDIN_POST_BODIES: Record<string, string> = ${JSON.stringify(bodies)};\n`,
  linkedinEntriesData: `${headMore("The browser's entry index (every post, article and standalone media item, compact); full post records are server-only.")}\nimport type { LiEntryRaw } from "./linkedinArchiveTypes";\n\nexport const ENGAGEMENT_AS_OF = ${JSON.stringify(asOf)};\nexport const LINKEDIN_ENTRIES_RAW: LiEntryRaw[] = ${asJson(entriesRaw)};\n`,
  linkedinSearchData: `${headMore("Search text for each post and article (lowercase, tags and URLs removed), keyed by entry key; loaded only when someone searches.")}\n\nexport const LINKEDIN_SEARCH_TEXT: Record<string, string> = ${asJson(searchText)};\n`,
};
for (const [name, src] of Object.entries(files)) fs.writeFileSync(OUT(name), src);
const kb = (t) => (Buffer.byteLength(t) / 1024).toFixed(0);
console.log(
  `wrote ${Object.entries(files).map(([n, s]) => `${n} ${kb(s)} KB`).join(", ")}: ${items.length} items (${items.filter((i) => i.review).length} review), ` +
    `${posts.filter((p) => p.type === "article").length} articles, ${posts.filter((p) => p.type === "post").length} posts, ${entries.length} entries ` +
    `(${entries.filter((e) => !e.topics.length).length} without a topic), ${areasBySize.length} areas, ${L2.filter((t) => own.get(t).length).length} topic flowers, ` +
    `${names.length} names, viewBox ${W}x${H}`,
);
if (unclassified.length) console.warn(`build-linkedin-archive: ${unclassified.length} entries have no topic assignment yet (add them to scripts/linkedin/topic-assignments.json): ${unclassified.slice(0, 5).join(", ")}${unclassified.length > 5 ? ", ..." : ""}`);
