#!/usr/bin/env node
/**
 * Builds src/data/linkedinArchiveData.ts for the /linkedin archive.
 *
 * Input: items.json written by the media pipeline that runs on the owner's
 * SSD (LinkedIn-Data/web/linkedin/items.json). It holds only items the
 * classification cleared for the public site: no DM media, no personal data.
 *
 * Three graph layouts are computed here, once, so the server-rendered SVG and
 * the interactive graph show the same picture and the page needs no
 * JavaScript to draw it:
 *   topics   - each topic a "flower": its items on a golden-angle spiral around
 *              the hub, flowers packed by shared items, recurring names orbiting
 *   timeline - a growing garden: year bands on x, one lane per topic on y
 *   map      - a semantic map: PCA of item features (topics, names, kind,
 *              context, year), typical items at the centre, outliers at the edge
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
/** Map view: topics with at least this many items keep their label visible; smaller ones show it on hover. Mirrored in LinkedInGraph.tsx. */
const MAP_LABEL_MIN = 20;

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

if (!items.length) {
  console.error("build-linkedin-archive: no items to build (check --items and the review filter)");
  process.exit(1);
}

// ---- shared counts ----
const topicCount = new Map();
const entityCount = new Map();
for (const it of items) {
  for (const t of it.topics) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
  for (const e of it.entities) entityCount.set(e, (entityCount.get(e) ?? 0) + 1);
}
const entities = [...entityCount].filter(([, n]) => n >= ENTITY_MIN).sort((a, b) => b[1] - a[1]).map(([e]) => e);
const entitySet = new Set(entities);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const primary = (it) => it.topics.find((t) => t !== "other") ?? "other";
const topics = [...topicCount.keys()].sort((a, b) => topicCount.get(b) - topicCount.get(a));
const round = (v) => Math.round(v * 10) / 10;
const GA = Math.PI * (3 - Math.sqrt(5)); // golden angle

// =====================================================================
// View 1: topics as flowers
// =====================================================================
const S = 6.4; // spiral spacing (card is 8 units)
const members = new Map(topics.map((t) => [t, []]));
for (const it of items) {
  const p = primary(it);
  if (!members.has(p)) members.set(p, []);
  members.get(p).push(it);
}
const flowerR = (t) => S * Math.sqrt(members.get(t).length + 2.5) + 4;
// Topic labels (mirror of TOPIC_META labels in src/data/linkedinArchive.ts) set how much room a flower needs.
const LABELS = { ai_llm: "AI and LLMs", seo_search: "SEO and search", events_conferences: "Events and conferences", product_tools: "Products and tools", google_updates: "Google algorithm updates", marketing_growth: "Marketing and growth", data_engineering: "Data engineering", motivation_quotes: "Quotes and motivation", content_social: "Content and social", speaking_media: "Speaking and media", career_education: "Career and education", personal_life: "Life", search_console_analytics: "Search Console and analytics", awards_recognition: "Awards and recognition", company_brand: "Companies and brands", health_awareness: "Health awareness", community_volunteering: "Community and volunteering", other: "Other" };
const CHAR = 7.4; // width of one character at the label size (12.5, mono)
const labelHalf = (t) => ((LABELS[t] ?? t).length * CHAR) / 2;
const footprint = (t) => Math.max(flowerR(t) + 13, labelHalf(t) * 0.7);
const co = new Map();
for (const it of items) for (const a of it.topics) for (const b of it.topics) if (a < b) co.set(`${a}|${b}`, (co.get(`${a}|${b}`) ?? 0) + 1);
const w = (a, b) => co.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? 0;

const hub = new Map();
const order = [...members.keys()].sort((a, b) => members.get(b).length - members.get(a).length || (topicCount.get(b) ?? 0) - (topicCount.get(a) ?? 0));
for (const t of order) {
  const placed = [...hub.keys()];
  if (!placed.length) { hub.set(t, { x: 0, y: 0 }); continue; }
  let ax = 0, ay = 0, ws = 0;
  for (const p of placed) { const k = w(t, p); if (k) { ax += hub.get(p).x * k; ay += hub.get(p).y * k; ws += k; } }
  if (ws) { ax /= ws; ay /= ws; }
  const R = flowerR(t);
  for (let step = 0; step < 20000; step++) {
    const a = step * 0.31, r = step * 0.9;
    const x = ax + Math.cos(a) * r, y = ay + Math.sin(a) * r * 0.7; // flattened: wide screens
    if (placed.every((p) => Math.hypot(hub.get(p).x - x, (hub.get(p).y - y) * 1.25) >= footprint(t) + footprint(p) + 8)) { hub.set(t, { x, y }); break; }
  }
}
for (const t of order) if (!hub.has(t)) throw new Error(`build-linkedin-archive: could not place the "${t}" flower`);
const posT = new Map();
for (const t of order) {
  const h = hub.get(t);
  posT.set(`t:${t}`, [h.x, h.y]);
  members.get(t).forEach((it, k) => {
    const r = S * Math.sqrt(k + 2.5), a = k * GA;
    posT.set(`i:${it.idx}`, [h.x + Math.cos(a) * r, h.y + Math.sin(a) * r]);
  });
}
// Each topic label goes below or above its flower, whichever collides less
// with labels and flowers already placed (largest topics choose first).
const labelSide = new Map();
{
  const rects = [];
  const circles = order.map((t) => ({ x: hub.get(t).x, y: hub.get(t).y, r: flowerR(t) }));
  const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const circleHit = (rc) => circles.reduce((sum, c) => {
    const nx = Math.max(rc.x0, Math.min(c.x, rc.x1)), ny = Math.max(rc.y0, Math.min(c.y, rc.y1));
    return sum + (Math.hypot(nx - c.x, ny - c.y) < c.r - 2 ? 60 : 0);
  }, 0);
  for (const t of order) {
    const h = hub.get(t), R = flowerR(t), half = labelHalf(t);
    const cand = [
      { side: "below", x0: h.x - half, x1: h.x + half, y0: h.y + R + 3, y1: h.y + R + 18 },
      { side: "above", x0: h.x - half, x1: h.x + half, y0: h.y - R - 18, y1: h.y - R - 3 },
    ];
    let best = cand[0], bestCost = Infinity;
    for (const c of cand) {
      const cost = rects.reduce((sum, r) => sum + overlap(c, r), 0) + circleHit(c) + (c.side === "above" ? 1 : 0);
      if (cost < bestCost) { bestCost = cost; best = c; }
    }
    rects.push(best);
    labelSide.set(t, best.side);
  }
}

// Recurring names stand in two annotation columns, left and right of the garden,
// each on the side (and at the height) where its items mostly sit.
{
  const ptsT = [...posT.values()];
  const gx0 = Math.min(...ptsT.map((p) => p[0]), ...order.map((t) => hub.get(t).x - labelHalf(t)));
  const gx1 = Math.max(...ptsT.map((p) => p[0]), ...order.map((t) => hub.get(t).x + labelHalf(t)));
  const gy0 = Math.min(...ptsT.map((p) => p[1])), gy1 = Math.max(...ptsT.map((p) => p[1]));
  const cx = (gx0 + gx1) / 2;
  const sides = { left: [], right: [] };
  for (const e of entities) {
    let sx = 0, sy = 0, n = 0;
    for (const it of items) if (it.entities.includes(e)) { const p = posT.get(`i:${it.idx}`); sx += p[0]; sy += p[1]; n++; }
    (sx / n < cx ? sides.left : sides.right).push({ e, y: sy / n, x: sx / n });
  }
  // Balance the columns: move the names closest to the centre to the shorter side.
  while (Math.abs(sides.left.length - sides.right.length) > 2) {
    const [from, to] = sides.left.length > sides.right.length ? [sides.left, sides.right] : [sides.right, sides.left];
    from.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
    to.push(from.shift());
  }
  for (const [side, list] of Object.entries(sides)) {
    list.sort((a, b) => a.y - b.y);
    const gap = 15;
    // keep natural heights where possible, then push apart and fit within the garden's height
    for (let pass = 0; pass < 100; pass++) for (let k = 1; k < list.length; k++) if (list[k].y - list[k - 1].y < gap) { const d = (gap - (list[k].y - list[k - 1].y)) / 2; list[k - 1].y -= d; list[k].y += d; }
    const top = gy0 - 10, bottom = gy1 + 10;
    if (list.length && (list[0].y < top || list[list.length - 1].y > bottom)) {
      const span = Math.max(bottom - top, gap * (list.length - 1));
      list.forEach((it, k) => (it.y = (top + bottom) / 2 - span / 2 + (list.length > 1 ? (span * k) / (list.length - 1) : span / 2)));
    }
    const x = side === "left" ? gx0 - 26 : gx1 + 26;
    for (const it of list) posT.set(`e:${slug(it.e)}`, [x, it.y]);
  }
}
// Fit into the shared viewBox (labels need room).
const M = 24;
const ENT_CHAR = 6.6; // entity label character width (11, mono)
const midX = (Math.min(...[...posT.values()].map((p) => p[0])) + Math.max(...[...posT.values()].map((p) => p[0]))) / 2;
const extents = [];
for (const [k, p] of posT) {
  if (k.startsWith("e:")) {
    const e = entities.find((x) => `e:${slug(x)}` === k);
    const w = e.length * ENT_CHAR + 10;
    extents.push(p[0] < midX ? [p[0] - w, p[1]] : [p[0] + w, p[1]]);
  } else if (k.startsWith("t:")) {
    const t = k.slice(2);
    const ly = labelSide.get(t) === "above" ? p[1] - flowerR(t) - 20 : p[1] + flowerR(t) + 18;
    extents.push([p[0] - labelHalf(t), ly], [p[0] + labelHalf(t), ly]);
  }
  extents.push(p);
}
const xsT = extents.map((p) => p[0]), ysT = extents.map((p) => p[1]);
let W = Math.max(...xsT) - Math.min(...xsT) + 2 * M;
let H = Math.max(...ysT) - Math.min(...ysT) + 2 * M + 40;
W = Math.max(W, 1000);
H = Math.max(H, 560);
if (W / H < 1.55) W = H * 1.55;
if (W / H > 1.9) H = W / 1.9;
W = Math.round(W); H = Math.round(H);
{
  const minX = Math.min(...xsT), maxX = Math.max(...xsT), minY = Math.min(...ysT), maxY = Math.max(...ysT);
  const dx = (W - (maxX - minX)) / 2 - minX, dy = (H - (maxY - minY)) / 2 - minY;
  for (const [k, p] of posT) posT.set(k, [round(p[0] + dx), round(p[1] + dy)]);
}

// =====================================================================
// View 2: timeline garden
// =====================================================================
const posL = new Map();
const yearsList = [...new Set(items.map((i) => i.date.slice(0, 4)))].sort();
const yCount = new Map(yearsList.map((y) => [y, items.filter((i) => i.date.startsWith(y)).length]));
const LEFT = 262, RIGHT = 30, TOP = 78, AXIS = H - 40;
const weights = yearsList.map((y) => Math.max(Math.sqrt(yCount.get(y)), 2.2));
const wsum = weights.reduce((a, b) => a + b, 0);
const bands = [];
{
  let x = LEFT;
  yearsList.forEach((y, k) => { const bw = ((W - LEFT - RIGHT) * weights[k]) / wsum; bands.push({ year: y, x0: x, x1: x + bw }); x += bw; });
}
const laneTopics = order.filter((t) => t !== "other").concat(order.includes("other") ? ["other"] : []);
const laneY = new Map(laneTopics.map((t, k) => [t, TOP + ((AXIS - 34 - TOP) * k) / Math.max(1, laneTopics.length - 1)]));
const dayFrac = (d) => { const t = new Date(`${d}T00:00:00Z`); const s = Date.UTC(t.getUTCFullYear(), 0, 1); return (t - s) / (366 * 864e5); };
const lanePlaced = new Map(laneTopics.map((t) => [t, []]));
const LANE_GAP = (AXIS - 34 - TOP) / Math.max(1, laneTopics.length - 1);
const OFF = [0, -9, 9].filter((o) => Math.abs(o) <= LANE_GAP / 2 - 4);
const MIN_D = 8.6; // a card is 8 units: no two cards closer than this
for (const it of [...items].sort((a, b) => a.date.localeCompare(b.date))) {
  const b = bands.find((x) => x.year === it.date.slice(0, 4));
  let x = b.x0 + 6 + (b.x1 - b.x0 - 12) * dayFrac(it.date);
  const t = primary(it), y0 = laneY.get(t), placed = lanePlaced.get(t);
  let px = x, y = y0, found = false;
  for (let shift = 0; shift < 40 && !found; shift++) {
    px = x + shift * MIN_D;
    for (const o of OFF) {
      if (placed.every((p) => Math.abs(p[0] - px) >= MIN_D || Math.abs(p[1] - (y0 + o)) >= MIN_D)) { y = y0 + o; found = true; break; }
    }
  }
  placed.push([px, y]);
  x = px;
  posL.set(`i:${it.idx}`, [round(x), round(y)]);
}
for (const t of laneTopics) posL.set(`t:${t}`, [LEFT - 16, round(laneY.get(t))]);
{
  const ps = items.map((it) => posL.get(`i:${it.idx}`));
  let clashes = 0;
  for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) if (Math.abs(ps[a][0] - ps[b][0]) < 8 && Math.abs(ps[a][1] - ps[b][1]) < 8) clashes++;
  if (clashes) throw new Error(`build-linkedin-archive: ${clashes} overlapping timeline cards`);
}

// =====================================================================
// View 3: semantic map (PCA)
// =====================================================================
const posM = new Map();
const features = (it) => {
  const v = [];
  for (const t of topics) v.push(it.topics.includes(t) ? 1 : 0);
  for (const e of entities) v.push(it.entities.includes(e) ? 0.8 : 0);
  for (const k of ["image", "video", "document"]) v.push(it.kind === k ? 0.5 : 0);
  for (const c of ["post", "article", "comment", "profile"]) v.push(it.context === c ? 0.4 : 0);
  v.push(((+it.date.slice(0, 4) - 2018) / 8) * 0.9);
  return v;
};
const X = items.map(features);
const D = X[0].length;
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
const pc1 = signFix(power(cov, null));
const pc2 = signFix(power(cov, pc1));
let pts = Xc.map((r) => [r.reduce((s, x, j) => s + x * pc1[j], 0), r.reduce((s, x, j) => s + x * pc2[j], 0)]);
// Items with identical features share a point: spread each stack on a small spiral.
{
  const groups = new Map();
  pts.forEach((p, k) => { const key = `${p[0].toFixed(3)},${p[1].toFixed(3)}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(k); });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const unit = span / 120;
  for (const ks of groups.values()) ks.forEach((k, j) => { if (j === 0) return; const r = unit * Math.sqrt(j) * 1.1, a = j * GA; pts[k] = [pts[k][0] + Math.cos(a) * r, pts[k][1] + Math.sin(a) * r]; });
}
{
  const MM = 70;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sc = Math.min((W - 2 * MM) / (x1 - x0 || 1), (H - 2 * MM) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
  pts = pts.map(([x, y]) => [ox + (x - x0) * sc, oy + (y1 - y) * sc]); // +PC2 points up
}
// Light collision pass so cards do not sit on top of each other.
for (let pass = 0; pass < 40; pass++) {
  for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
    const dx = pts[b][0] - pts[a][0], dy = pts[b][1] - pts[a][1], d = Math.hypot(dx, dy) || 0.01;
    if (d < 9) { const push = (9 - d) / 2, ux = dx / d, uy = dy / d; pts[a][0] -= ux * push; pts[a][1] -= uy * push; pts[b][0] += ux * push; pts[b][1] += uy * push; }
  }
}
items.forEach((it, k) => posM.set(`i:${it.idx}`, [round(pts[k][0]), round(pts[k][1])]));
const meanOf = (pred) => { const ks = items.map((it, k) => (pred(it) ? k : -1)).filter((k) => k >= 0); return ks.length ? [round(ks.reduce((s, k) => s + pts[k][0], 0) / ks.length), round(ks.reduce((s, k) => s + pts[k][1], 0) / ks.length)] : null; };
// Topic anchors sit where the topic's own items cluster (primary topic), not at the mean of everything it touches.
for (const t of order) posM.set(`t:${t}`, meanOf((it) => primary(it) === t) ?? meanOf((it) => it.topics.includes(t)));
// Topic labels: start just above each anchor, then push apart (build time), with a pull back to the anchor.
const mapLabel = new Map();
{
  const L = order.map((t) => {
    const a = posM.get(`t:${t}`);
    const r = 8 + Math.sqrt(topicCount.get(t));
    return { t, ax: a[0], ay: a[1], x: a[0], y: a[1] - r - 9, w: (LABELS[t] ?? t).length * 6.7 + 8, h: 15, always: topicCount.get(t) >= MAP_LABEL_MIN };
  });
  for (let pass = 0; pass < 400; pass++) {
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j];
      if (!a.always || !b.always) continue; // small topics label only on hover; they do not push the main labels
      const ox = (a.w + b.w) / 2 - Math.abs(a.x - b.x), oy = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
      if (ox > 0 && oy > 0) {
        if (oy < ox) { const d = (oy / 2 + 0.5) * Math.sign(a.y - b.y || 1); a.y += d; b.y -= d; }
        else { const d = (ox / 2 + 0.5) * Math.sign(a.x - b.x || 1); a.x += d; b.x -= d; }
      }
    }
    for (const l of L) { l.x += (l.ax - l.x) * 0.01; l.y += (l.ay - 18 - l.y) * 0.01; l.x = Math.max(l.w / 2 + 6, Math.min(W - l.w / 2 - 6, l.x)); l.y = Math.max(16, Math.min(H - 10, l.y)); }
  }
  for (const l of L) mapLabel.set(l.t, [round(l.x - l.ax), round(l.y - l.ay)]);
}
for (const e of entities) posM.set(`e:${slug(e)}`, meanOf((it) => it.entities.includes(e)));
const cxM = pts.reduce((s, p) => s + p[0], 0) / pts.length, cyM = pts.reduce((s, p) => s + p[1], 0) / pts.length;
const dists = pts.map((p) => Math.hypot(p[0] - cxM, p[1] - cyM)).sort((a, b) => a - b);
const pct = (q) => dists[Math.min(dists.length - 1, Math.floor(q * dists.length))];
// Nearest neighbours in feature space (cosine): the map's hairlines.
const norm = X.map((r) => Math.hypot(...r) || 1);
const knn = [];
for (let a = 0; a < X.length; a++) {
  const sims = [];
  for (let b = 0; b < X.length; b++) if (a !== b) sims.push([X[a].reduce((s, x, j) => s + x * X[b][j], 0) / (norm[a] * norm[b]), b]);
  sims.sort((p, q) => q[0] - p[0]);
  for (const [, b] of sims.slice(0, 2)) { const k = a < b ? `${a}|${b}` : `${b}|${a}`; if (!knn.includes(k)) knn.push(k); }
}

// =====================================================================
// Assemble
// =====================================================================
const at = (m, id) => (m.has(id) && m.get(id) ? m.get(id) : null);
const nodes = [];
for (const t of order) nodes.push({ id: `t:${t}`, type: "topic", label: t, count: topicCount.get(t), own: members.get(t).length, labelAbove: labelSide.get(t) === "above" || undefined, mapLabel: mapLabel.get(t), pos: { topics: at(posT, `t:${t}`), timeline: at(posL, `t:${t}`), map: at(posM, `t:${t}`) } });
for (const e of entities) nodes.push({ id: `e:${slug(e)}`, type: "entity", label: e, count: entityCount.get(e), pos: { topics: at(posT, `e:${slug(e)}`), timeline: null, map: at(posM, `e:${slug(e)}`) } });
for (const it of items) nodes.push({ id: `i:${it.idx}`, type: "item", label: "", idx: it.idx, kind: it.kind, pos: { topics: at(posT, `i:${it.idx}`), timeline: at(posL, `i:${it.idx}`), map: at(posM, `i:${it.idx}`) } });
const links = [];
for (const it of items) {
  for (const t of it.topics) links.push([`i:${it.idx}`, `t:${t}`]);
  for (const e of it.entities) if (entitySet.has(e)) links.push([`i:${it.idx}`, `e:${slug(e)}`]);
}
const lines = {
  topics: items.map((it) => [`i:${it.idx}`, `t:${primary(it)}`]),
  timeline: [],
  map: knn.map((k) => { const [a, b] = k.split("|").map(Number); return [`i:${items[a].idx}`, `i:${items[b].idx}`]; }),
};
const graph = {
  width: W, height: H, nodes, links, lines,
  timeline: { axisY: AXIS, left: LEFT, years: bands.map((b) => ({ year: b.year, x0: round(b.x0), x1: round(b.x1) })) },
  map: { cx: round(cxM), cy: round(cyM), rings: [{ r: round(pct(0.5)), label: "typical" }, { r: round(pct(0.9)), label: "outlier" }] },
};

const note = includeReview ? "Includes items pending review: LOCAL PREVIEW ONLY (git-ignored)." : "Public items only.";
const itemsSrc = `/* GENERATED by scripts/linkedin/build-linkedin-archive.mjs. Do not edit by hand. ${note} */
import type { LiItem } from "./linkedinArchiveTypes";

export const LINKEDIN_ITEMS: LiItem[] = ${JSON.stringify(items)};
`;
const graphSrc = `/* GENERATED by scripts/linkedin/build-linkedin-archive.mjs. Do not edit by hand. ${note} */
import type { LiGraph } from "./linkedinArchiveTypes";

export const LINKEDIN_GRAPH: LiGraph = ${JSON.stringify(graph)};
`;
fs.writeFileSync(OUT_ITEMS, itemsSrc);
fs.writeFileSync(OUT_GRAPH, graphSrc);
const kb = (t) => (Buffer.byteLength(t) / 1024).toFixed(0);
console.log(`wrote ${path.relative(ROOT, OUT_ITEMS)} (${kb(itemsSrc)} KB) and ${path.relative(ROOT, OUT_GRAPH)} (${kb(graphSrc)} KB): ${items.length} items (${items.filter((i) => i.review).length} review), ${order.length} flowers, ${entities.length} names, viewBox ${W}x${H}, ${lines.map.length} map hairlines`);
