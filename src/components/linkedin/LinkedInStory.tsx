"use client";
import * as React from "react";
import { LINKEDIN_ENTRIES, SOURCE_LABEL, TOPIC_NODES, formatDay, fullUrl, getItem, getTopic, thumbUrl, topicCounts, topicLabel, type LiEntry } from "@/data/linkedinArchive";

/**
 * 04 Story: the archive as one animated piece, made to be watched and recorded (Reel mode frames it 9:16).
 *   1. a point cloud: every post a point, drifting
 *   2. one centre (me) appears; the areas burst out of it, the topics branch, every post flies to its topic
 *   3. the top posts (or the current search's matches) play as a slideshow in the centre, while a pulse travels
 *      centre > area > topic > post
 *   4. the graph dissolves back into the cloud and the loop starts again with the next posts
 * Focus: picking a topic (a click on its node, its area's name or one of its points, or the sidebar) or searching
 * lays every matching post out as thumbnails in rings around the centre and plays only those; the focus stays after a
 * post is opened and closed. Hovering a point or a thumbnail shows that post in the centre and keeps it there until
 * the pointer moves to another one or leaves the frame.
 * Canvas draws the 1,000 points and lines; the centre card and the thumbnails are HTML. Reduced motion: the assembled
 * graph, slides change without flights, pulses or turning ticks.
 */

interface Props {
  /** Entry keys matching the search and filters (null = everything): when set, the Story focuses on them. */
  matching: Set<string> | null;
  /** The topic picked in the sidebar or here (any level), or null. */
  activeTopic: string | null;
  onTopic: (id: string | null) => void;
  onOpenEntry: (key: string) => void;
  /** The page's search and filters (compact): shown in full screen, where the page's own are out of reach. */
  filters?: React.ReactNode;
}

const SLIDES = 7;
const SLIDE_S = 3.4;
const T_AREAS = 1.8;
const T_TOPICS = 3.4;
const T_POSTS = 4.8;
const T_SLIDES = 7.6;
const REDUCED_SLIDE_S = 5;
/** Focus: at most this many thumbnails around the centre (the rest are in the cards below). */
const MAX_TILES = 160;
// Radii as a share of R: the card sits inside HUB.
const HUB = 0.4;
const AREA_R = 0.47;
const TOPIC_R = 0.64;
const POST_R0 = 0.73;
const POST_R1 = 0.98;
const SHORT: Record<string, string> = {
  ai: "AI",
  seo: "SEO",
  "ai-search": "AI SEARCH",
  data: "DATA",
  building: "BUILDING",
  marketing: "MARKETING",
  events: "EVENTS",
  career: "CAREER",
  news: "NEWS",
  life: "LIFE",
};

type Area = { id: string; label: string; a: number; count: number };
type Topic = { id: string; area: string; a: number; count: number };
type Dot = { key: string; a: number; r: number; size: number; topic: string | null; ti: number; sx: number; sy: number; delay: number; phase: number };

/** Small seeded random numbers, so the layout is the same on every visit. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

function buildLayout() {
  const rand = seeded(983);
  const own = new Map<string, LiEntry[]>();
  const loose: LiEntry[] = [];
  for (const e of LINKEDIN_ENTRIES) {
    const t = e.topics[0];
    if (!t || getTopic(t)?.level !== 2) loose.push(e);
    else (own.get(t) ?? own.set(t, []).get(t)!).push(e);
  }
  const maxR = Math.max(1, ...LINKEDIN_ENTRIES.map((e) => e.engagement?.reactions ?? 0));
  const weight = (n: number) => Math.pow(n, 0.72);
  const areaList = TOPIC_NODES.filter((n) => n.level === 1)
    .map((a) => ({ a, topics: TOPIC_NODES.filter((t) => t.parent === a.id && (own.get(t.id)?.length ?? 0) > 0) }))
    .filter((x) => x.topics.length);
  const areaCount = (x: (typeof areaList)[number]) => x.topics.reduce((s, t) => s + own.get(t.id)!.length, 0);
  const GAP = 0.03;
  const full = Math.PI * 2 - GAP * areaList.length;
  const total = areaList.reduce((s, x) => s + weight(areaCount(x)), 0);
  const areas: Area[] = [];
  const topics: Topic[] = [];
  const dots: Dot[] = [];
  const dotFor = (e: LiEntry, a: number, r: number, topic: string | null) => {
    const reactions = e.engagement?.reactions ?? 0;
    const sr = 1.25 * Math.sqrt(rand()), sa = rand() * Math.PI * 2;
    // Flights sweep around the circle like a radar, from the top, clockwise.
    const sweep = (((a + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    dots.push({
      key: e.key,
      a,
      r,
      size: 0.9 + 2.8 * Math.sqrt(reactions / maxR) + (e.media.length ? 0.35 : 0),
      topic,
      ti: -1,
      sx: Math.cos(sa) * sr,
      sy: Math.sin(sa) * sr,
      delay: (sweep / (Math.PI * 2)) * 1.25 + rand() * 0.25,
      phase: rand() * Math.PI * 2,
    });
  };
  const sidebarCounts = topicCounts();
  let a0 = -Math.PI / 2;
  for (const x of areaList) {
    const n = areaCount(x);
    const span = (full * weight(n)) / total;
    // The label shows the same count as the sidebar (every entry under the area, not only its main-topic ones).
    areas.push({ id: x.a.id, label: SHORT[x.a.id] ?? x.a.label.toUpperCase(), a: a0 + span / 2, count: sidebarCounts.get(x.a.id) ?? n });
    const tw = x.topics.reduce((s, t) => s + weight(own.get(t.id)!.length), 0);
    let t0 = a0 + span * 0.04;
    for (const t of x.topics) {
      const list = own.get(t.id)!;
      const ts = (span * 0.92 * weight(list.length)) / tw;
      topics.push({ id: t.id, area: x.a.id, a: t0 + ts / 2, count: list.length });
      for (const e of list) dotFor(e, t0 + ts * (0.08 + 0.84 * rand()), POST_R0 + (POST_R1 - POST_R0) * Math.sqrt(rand()), t.id);
      t0 += ts;
    }
    a0 += span + GAP;
  }
  for (const e of loose) dotFor(e, rand() * Math.PI * 2, 1.01 + rand() * 0.05, null);
  const years = LINKEDIN_ENTRIES.map((e) => e.date.slice(0, 4)).sort();
  const topicIndex = new Map(topics.map((t, i) => [t.id, i]));
  for (const d of dots) d.ti = d.topic ? topicIndex.get(d.topic) ?? -1 : -1;
  return {
    areas,
    topics,
    dots,
    areaIndex: new Map(areas.map((a, i) => [a.id, i])),
    topicById: new Map(topics.map((t) => [t.id, t])),
    areaById: new Map(areas.map((a) => [a.id, a])),
    dotIndex: new Map(dots.map((d, i) => [d.key, i])),
    intro: { entries: LINKEDIN_ENTRIES.length, areas: areas.length, topics: topics.length, from: years[0], to: years[years.length - 1] },
  };
}

/** Where the circle sits in a canvas of this size (shared by the canvas and the HTML card). */
function geom(w: number, h: number, reel: boolean) {
  if (reel) {
    // Portrait: the circle as wide as the frame, under the title; the space below it carries a caption.
    const top = h * 0.12, bottom = h * 0.1;
    const R = Math.max(40, Math.min((w / 2) * 0.9, (h - top - bottom) / 2 * 0.86));
    return { cx: w / 2, cy: top + R * 1.1, R };
  }
  const R = Math.max(40, Math.min(w / 2, h / 2) * 0.86);
  return { cx: w / 2, cy: h / 2, R };
}

/**
 * Focus: thumbnails on a grid around the centre, filled nearest-first, so the most-reacted posts sit closest to the
 * centre and the whole reads as rings; a grid keeps square thumbnails from ever overlapping, and a wide frame holds
 * more of them.
 */
function tileLayout(keys: string[], w: number, h: number, reel: boolean) {
  const { cx, cy, R } = geom(w, h, reel);
  const T = Math.round(Math.max(24, Math.min(60, R * 0.15)));
  const G = T * 1.12;
  const keepOut = HUB * R + 6;
  const cells: { x: number; y: number; d: number; a: number }[] = [];
  // The usable frame: all of it, or in Reel the band between the title and the address.
  const top = reel ? h * 0.1 : 2, bottom = reel ? h * 0.92 : h - 2;
  const i0 = Math.ceil((2 + T / 2 - cx) / G - 0.5), i1 = Math.floor((w - 2 - T / 2 - cx) / G - 0.5);
  const j0 = Math.ceil((top + T / 2 - cy) / G - 0.5), j1 = Math.floor((bottom - T / 2 - cy) / G - 0.5);
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++) {
      const x = cx + (i + 0.5) * G, y = cy + (j + 0.5) * G;
      // Leave the hub (and the card in it) clear: the cell's nearest point must be outside it.
      const qx = Math.max(Math.abs(x - cx) - T / 2, 0), qy = Math.max(Math.abs(y - cy) - T / 2, 0);
      if (Math.hypot(qx, qy) < keepOut) continue;
      cells.push({ x, y, d: Math.hypot(x - cx, y - cy), a: Math.atan2(y - cy, x - cx) });
    }
  cells.sort((p, q) => p.d - q.d || p.a - q.a);
  const count = Math.min(keys.length, MAX_TILES, cells.length);
  const tiles = keys.slice(0, count).map((key, k) => ({ key, x: cells[k].x, y: cells[k].y, a: cells[k].a }));
  return { tiles, T, more: keys.length - tiles.length };
}

export default function LinkedInStory({ matching, activeTopic, onTopic, onOpenEntry, filters }: Props) {
  const layout = React.useMemo(buildLayout, []);
  const entryByKey = React.useMemo(() => new Map(LINKEDIN_ENTRIES.map((e) => [e.key, e])), []);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const probeRef = React.useRef<HTMLSpanElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [reel, setReel] = React.useState(false);
  const [playing, setPlaying] = React.useState(true);
  const [full, setFull] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  /** The centre card: "hidden", the intro, or an entry key. */
  const [card, setCard] = React.useState<string>("hidden");
  /** The post under the pointer (a point or a thumbnail): shown in the centre until another one is hovered. */
  const [preview, setPreview] = React.useState<string | null>(null);

  const byReactions = (a: LiEntry, b: LiEntry) => (b.engagement?.reactions ?? 0) - (a.engagement?.reactions ?? 0) || b.date.localeCompare(a.date);
  /** Focus: every entry that matches (posts, articles and media), most reactions first; null = no focus. */
  const focusKeys = React.useMemo(
    () => (matching ? LINKEDIN_ENTRIES.filter((e) => matching.has(e.key) && layout.dotIndex.has(e.key)).sort(byReactions).map((e) => e.key) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matching, layout],
  );
  const focused = focusKeys != null;
  // The slideshow: in focus, every match in turn; otherwise the top posts, seven per loop.
  const slideList = React.useMemo(
    () => focusKeys ?? LINKEDIN_ENTRIES.filter((e) => e.kind !== "media" && layout.dotIndex.has(e.key)).sort(byReactions).map((e) => e.key),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusKeys, layout],
  );
  const tiles = React.useMemo(() => (focusKeys && size.w ? tileLayout(focusKeys, size.w, size.h, reel) : null), [focusKeys, size, reel]);

  const [canFull, setCanFull] = React.useState(false);
  React.useEffect(() => setCanFull(!!document.fullscreenEnabled), []);
  /** t: the show's clock (resets each loop); wall: drift and twinkle, which never jump. */
  const clock = React.useRef({ t: 0, wall: 0, loop: 0, last: 0 });
  /** The frame must be drawn even if nothing moves (a resize, a jump, a new search, a theme change). */
  const dirty = React.useRef(true);
  const live = React.useRef({ size, reel, playing, reduced, matching, slideList, focused, tiles, preview, visible: true, card, hold: false });
  live.current = { ...live.current, size, reel, playing, reduced, matching, slideList, focused, tiles, preview, card };
  if (card === "hidden") live.current.hold = false; // a card that went away cannot hold the show
  React.useEffect(() => {
    dirty.current = true;
  }, [size, reel, playing, reduced, matching, slideList, tiles, preview]);
  const positions = React.useRef(new Float32Array(layout.dots.length * 2));
  /** Each point's place in the assembled graph, recomputed only when the frame changes size. */
  const targets = React.useRef({ key: "", xy: new Float32Array(layout.dots.length * 2) });
  /** Where the topic nodes and area names were drawn last frame (for clicks). */
  const hits = React.useRef<{ topics: [string, number, number][]; areas: [string, number, number, number, number][] }>({ topics: [], areas: [] });

  React.useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener?.("change", sync);
    return () => q.removeEventListener?.("change", sync);
  }, []);
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // The canvas fills the box inside its border: measure that (clientWidth), not the bordered box.
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => (live.current.visible = es.some((e) => e.isIntersecting)), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  React.useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  // A new search or topic restarts the show with its posts (a focus skips the intro).
  React.useEffect(() => {
    clock.current.t = live.current.reduced || focusKeys ? T_SLIDES : 0;
    clock.current.loop = 0;
    setPreview(null);
    dirty.current = true;
  }, [slideList, focusKeys]);
  const playRef = React.useRef<HTMLButtonElement>(null);
  /** Leave the topic focus; keyboard focus moves to Play first, since the tiles and this button are about to go. */
  const leaveFocus = React.useCallback(() => {
    if (wrapRef.current?.contains(document.activeElement)) playRef.current?.focus();
    onTopic(null);
  }, [onTopic]);
  // Esc leaves a topic focus, when the Story is on screen (unless a dialog is open or the key is for a text field).
  React.useEffect(() => {
    if (!activeTopic) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("[role=dialog]")) return;
      if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      if (!live.current.visible && !wrapRef.current?.contains(document.activeElement)) return;
      leaveFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTopic, leaveFocus]);
  // Resting on a post for a moment loads its full image ahead, so opening it is instant (a quick sweep loads nothing).
  React.useEffect(() => {
    const e = preview ? entryByKey.get(preview) : undefined;
    const it = e?.media[0] ? getItem(e.media[0]) : undefined;
    if (!it || it.kind !== "image") return;
    const t = window.setTimeout(() => (new Image().src = fullUrl(it)), 250);
    return () => window.clearTimeout(t);
  }, [preview, entryByKey]);
  // Keyboard: one tab stop for the thumbnails; arrow keys, Home and End move between them.
  const [rove, setRove] = React.useState(0);
  React.useEffect(() => setRove(0), [focusKeys]);
  const onTilesKey = (e: React.KeyboardEvent) => {
    const n = tiles?.tiles.length ?? 0;
    if (!n) return;
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : step ? (rove + step + n) % n : -1;
    if (to < 0) return;
    e.preventDefault();
    setRove(to);
    (e.currentTarget.querySelectorAll("[data-testid=linkedin-story-tile]")[to] as HTMLElement | undefined)?.focus();
  };

  /** The slides of the current loop. */
  const slidesFor = (loop: number, list: string[], all: boolean) => {
    if (all || list.length <= SLIDES) return list;
    const start = (loop * SLIDES) % list.length;
    return Array.from({ length: SLIDES }, (_, k) => list[(start + k) % list.length]);
  };

  React.useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let colors = { fg: "0 0% 96%", bg: "0 0% 4%" };
    let font = "ui-monospace, monospace";
    let lastColorRead = -1;
    clock.current.last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      const dt = Math.min(0.1, (now - clock.current.last) / 1000);
      clock.current.last = now;
      if (!L.visible) return;
      const { w, h } = L.size;
      if (!w || !h) return;
      if (now - lastColorRead > 1000) {
        const cs = getComputedStyle(document.documentElement);
        const next = { fg: cs.getPropertyValue("--foreground").trim() || colors.fg, bg: cs.getPropertyValue("--background").trim() || colors.bg };
        if (next.fg !== colors.fg || next.bg !== colors.bg) dirty.current = true;
        colors = next;
        if (probeRef.current) font = getComputedStyle(probeRef.current).fontFamily || font;
        lastColorRead = now;
      }
      const fg = (a: number) => `hsl(${colors.fg} / ${a})`;
      const bg = (a: number) => `hsl(${colors.bg} / ${a})`;

      // ---- time ----
      const c = clock.current;
      const skipIntro = L.reduced || L.focused;
      const slideS = L.reduced ? REDUCED_SLIDE_S : SLIDE_S;
      // A loop lasts as long as its slides (a search with 2 matches plays 2, not 7); a focus loops its slides only.
      const loopLen = (n: number) => (skipIntro ? T_SLIDES + Math.max(1, n) * slideS : T_SLIDES + n * slideS + 1.4);
      // The show stands still while paused, while a post is previewed, or while the card has the pointer or focus.
      const running = L.playing && !L.hold && !L.preview;
      if (running) c.t += dt;
      if (L.playing) c.wall += dt;
      if (skipIntro && c.t < T_SLIDES) c.t = T_SLIDES;
      // In focus, the slideshow plays the posts that have a thumbnail on screen.
      const list = L.focused && L.tiles ? L.slideList.slice(0, L.tiles.tiles.length) : L.slideList;
      let slides = slidesFor(c.loop, list, L.focused);
      if (c.t >= loopLen(slides.length)) {
        c.t = skipIntro ? T_SLIDES : c.t - loopLen(slides.length);
        c.loop++;
        slides = slidesFor(c.loop, list, L.focused);
      }
      const t = c.t;
      const n = slides.length;
      const outStart = skipIntro ? Infinity : T_SLIDES + n * slideS;
      const si = n && t >= T_SLIDES && t < T_SLIDES + n * slideS ? Math.min(n - 1, Math.floor((t - T_SLIDES) / slideS)) : -1;
      const slideKey = si >= 0 ? slides[si] : null;
      const slideT = si >= 0 ? t - T_SLIDES - si * slideS : 0;
      const shownKey = L.preview ?? slideKey;
      const wantCard = shownKey ?? (!L.focused && t >= T_AREAS && t < outStart ? "intro" : "hidden");
      if (wantCard !== L.card) {
        L.card = wantCard;
        setCard(wantCard);
        dirty.current = true;
      }
      // Nothing moves when paused or with reduced motion: draw only when something changed.
      if (!(L.playing && !L.reduced) && !dirty.current) return;
      dirty.current = false;
      const wall = c.wall;
      const pulseOn = !L.reduced && running;

      // ---- canvas ----
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg(1);
      ctx.fillRect(0, 0, w, h);
      const { cx, cy, R } = geom(w, h, L.reel);
      const s = R / 300;
      // The graph holds still so its names stay put; the hub's ticks turn.
      const tickSpin = L.reduced ? 0 : wall * 0.06;
      const out = skipIntro ? 0 : clamp01((t - outStart) / 1.3);
      const gather = 1 - ease(out);
      const at = (a: number, r: number): [number, number] => [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R];

      // Phase progress
      const areaK = (i: number) => (skipIntro ? 1 : ease(clamp01((t - T_AREAS - i * 0.08) / 0.8))) * gather;
      const topicK = (i: number) => (skipIntro ? 1 : ease(clamp01((t - T_TOPICS - i * 0.06) / 0.8))) * gather;
      const areaIndex = layout.areaIndex;

      // Highlighted path: the previewed post, or the current slide
      const hiDot = shownKey != null ? layout.dotIndex.get(shownKey) : undefined;
      const hi = hiDot != null ? layout.dots[hiDot] : null;
      const hiTopic = hi?.topic ? layout.topicById.get(hi.topic) : undefined;
      const hiArea = hiTopic ? layout.areaById.get(hiTopic.area) : undefined;
      const dimOthers = hi ? 0.55 : 1;
      const pulseT = L.preview ? 10 : slideT; // a preview shows its path at once

      // Hub: an instrument ring with ticks
      const hubK = skipIntro ? 1 : ease(clamp01((t - T_AREAS + 0.4) / 0.9)) * gather;
      if (hubK > 0) {
        ctx.strokeStyle = fg(0.35 * hubK);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, HUB * R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        for (let k = 0; k < 72; k++) {
          const a = (k / 72) * Math.PI * 2 - tickSpin;
          const len = k % 6 === 0 ? 7 : 3;
          ctx.moveTo(cx + Math.cos(a) * (HUB * R + 3), cy + Math.sin(a) * (HUB * R + 3));
          ctx.lineTo(cx + Math.cos(a) * (HUB * R + 3 + len * s), cy + Math.sin(a) * (HUB * R + 3 + len * s));
        }
        ctx.strokeStyle = fg(0.25 * hubK);
        ctx.stroke();
      }

      // Hub to areas
      ctx.lineWidth = 1;
      for (const [i, a] of layout.areas.entries()) {
        const k = areaK(i);
        if (k <= 0) continue;
        const [x0, y0] = at(a.a, HUB);
        const [x1, y1] = at(a.a, HUB + (AREA_R - HUB) * k);
        ctx.strokeStyle = fg((hi && hiArea?.id !== a.id ? 0.25 : 0.55) * k);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      // Areas to topics
      for (const tp of layout.topics) {
        const k = topicK(areaIndex.get(tp.area) ?? 0);
        if (k <= 0) continue;
        const area = layout.areaById.get(tp.area)!;
        const [x0, y0] = at(area.a, AREA_R);
        const [tx, ty] = at(tp.a, TOPIC_R);
        ctx.strokeStyle = fg((hi && hiTopic?.id !== tp.id ? 0.12 : 0.32) * k);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + (tx - x0) * k, y0 + (ty - y0) * k);
        ctx.stroke();
      }

      // Points: from the cloud to their topic (and back at the end of the loop)
      const pos = positions.current;
      const dots = layout.dots;
      const tkey = `${w}x${h}${L.reel ? "r" : ""}`;
      if (targets.current.key !== tkey) {
        const xy = targets.current.xy;
        dots.forEach((d, i) => {
          [xy[i * 2], xy[i * 2 + 1]] = at(d.a, d.r);
        });
        targets.current.key = tkey;
      }
      const txy = targets.current.xy;
      const topicXY = layout.topics.map((tp) => at(tp.a, TOPIC_R));
      // Only nodes that are drawn take clicks (none in the cloud phase, the outro or a focus).
      hits.current.topics = L.tiles ? [] : layout.topics.flatMap((tp, i) => (topicK(areaIndex.get(tp.area) ?? 0) > 0.05 ? [[tp.id, topicXY[i][0], topicXY[i][1]] as [string, number, number]] : []));
      const strings = new Path2D();
      const drift = L.reduced ? 0 : 0.025;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const p = skipIntro ? 1 : ease(clamp01((t - T_POSTS - d.delay) / 1.0)) * gather;
        const sx = cx + (d.sx + Math.sin(wall * 0.5 + d.phase) * drift) * R;
        const sy = cy + (d.sy + Math.cos(wall * 0.43 + d.phase * 1.3) * drift) * R;
        const x = sx + (txy[i * 2] - sx) * p, y = sy + (txy[i * 2 + 1] - sy) * p;
        pos[i * 2] = x;
        pos[i * 2 + 1] = y;
        if (d.ti >= 0 && p > 0.02) {
          strings.moveTo(topicXY[d.ti][0], topicXY[d.ti][1]);
          strings.lineTo(x, y);
        }
      }
      ctx.strokeStyle = fg(0.045 * dimOthers);
      ctx.stroke(strings);
      // Points share a few brightness levels, so each level is one path and one fill.
      const LEVELS = 12;
      const buckets: (Path2D | null)[] = new Array(LEVELS + 1).fill(null);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const match = !L.matching || L.matching.has(d.key);
        const twinkle = L.reduced ? 1 : 0.75 + 0.25 * Math.sin(wall * 2.2 + d.phase * 3);
        const onPath = hiTopic && d.topic === hiTopic.id;
        const alpha = (match ? (onPath ? 0.95 : 0.62 * dimOthers) : 0.12) * twinkle;
        const lv = Math.round(alpha * LEVELS);
        const path = buckets[lv] ?? (buckets[lv] = new Path2D());
        const r = Math.max(0.6, d.size * s * (match ? 1 : 0.7));
        path.moveTo(pos[i * 2] + r, pos[i * 2 + 1]);
        path.arc(pos[i * 2], pos[i * 2 + 1], r, 0, Math.PI * 2);
      }
      buckets.forEach((path, lv) => {
        if (!path) return;
        ctx.fillStyle = fg(lv / LEVELS);
        ctx.fill(path);
      });

      // Topic nodes
      for (const tp of layout.topics) {
        const k = topicK(areaIndex.get(tp.area) ?? 0);
        if (k <= 0) continue;
        const [x, y] = at(tp.a, TOPIC_R);
        ctx.fillStyle = bg(1);
        ctx.strokeStyle = fg((hiTopic?.id === tp.id ? 1 : 0.6) * k);
        ctx.beginPath();
        ctx.arc(x, y, (2 + Math.sqrt(tp.count) * 0.25) * s * (0.5 + 0.5 * k), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Focus: the graph steps back, and spokes run from the centre to each thumbnail
      const T = L.tiles;
      if (T) {
        ctx.fillStyle = bg(0.72);
        ctx.fillRect(0, 0, w, h);
        const spokes = new Path2D();
        for (const tile of T.tiles) {
          spokes.moveTo(cx + Math.cos(tile.a) * HUB * R, cy + Math.sin(tile.a) * HUB * R);
          spokes.lineTo(tile.x, tile.y);
        }
        ctx.strokeStyle = fg(0.14);
        ctx.stroke(spokes);
        ctx.strokeStyle = fg(0.4);
        ctx.beginPath();
        ctx.arc(cx, cy, HUB * R, 0, Math.PI * 2);
        ctx.stroke();
        const cur = shownKey ? T.tiles.find((x) => x.key === shownKey) : undefined;
        if (cur) {
          const x0 = cx + Math.cos(cur.a) * HUB * R, y0 = cy + Math.sin(cur.a) * HUB * R;
          const u = !pulseOn ? 1 : clamp01(pulseT / 0.7);
          const hx = x0 + (cur.x - x0) * ease(u), hy = y0 + (cur.y - y0) * ease(u);
          ctx.strokeStyle = fg(0.95);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(hx, hy);
          ctx.stroke();
          ctx.lineWidth = 1;
          if (u < 1) {
            ctx.save();
            ctx.shadowColor = fg(1);
            ctx.shadowBlur = 14;
            ctx.fillStyle = fg(1);
            ctx.beginPath();
            ctx.arc(hx, hy, 3.2 * s + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // The path of the shown post, with a pulse running along it
      if (!T && hi && hiTopic && hiArea && hiDot != null) {
        const pts: [number, number][] = [at(hiArea.a, HUB), at(hiArea.a, AREA_R), at(hiTopic.a, TOPIC_R), [pos[hiDot * 2], pos[hiDot * 2 + 1]]];
        const u = !pulseOn ? 1 : clamp01(pulseT / 0.9);
        const segs = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
        const total = segs.reduce((a, b) => a + b, 0);
        let left = total * ease(u);
        ctx.strokeStyle = fg(0.95);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        let head = pts[0];
        for (let k = 0; k < segs.length && left > 0; k++) {
          const f = Math.min(1, left / (segs[k] || 1));
          head = [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f];
          ctx.lineTo(head[0], head[1]);
          left -= segs[k];
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        if (u < 1) {
          ctx.save();
          ctx.shadowColor = fg(1);
          ctx.shadowBlur = 14;
          ctx.fillStyle = fg(1);
          ctx.beginPath();
          ctx.arc(head[0], head[1], 3.2 * s + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const ring = !pulseOn ? 0.5 : Math.max(0, pulseT - 0.9) % 1.2;
          const [px, py] = pts[3];
          ctx.strokeStyle = fg(Math.max(0, 0.9 - ring * 0.75));
          ctx.beginPath();
          ctx.arc(px, py, (6 + ring * 16) * s + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.save();
          ctx.shadowColor = fg(1);
          ctx.shadowBlur = 10;
          ctx.fillStyle = fg(1);
          ctx.beginPath();
          ctx.arc(px, py, 3.4 * s + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // The topic's name beside its node
        const [tx, ty] = pts[2];
        const right = Math.cos(hiTopic.a) >= 0;
        const fs = Math.max(9, Math.min(13, 11 * s));
        ctx.font = `600 ${fs}px ${font}`;
        ctx.textAlign = right ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 4;
        ctx.strokeStyle = bg(0.95);
        const label = topicLabel(hiTopic.id);
        const lw = ctx.measureText(label).width;
        // Keep the name inside the frame.
        const lx = right ? Math.min(tx + 9, w - 8 - lw) : Math.max(tx - 9, 8 + lw);
        ctx.strokeText(label, lx, ty);
        ctx.fillStyle = fg(1);
        ctx.fillText(label, lx, ty);
        ctx.lineWidth = 1;
      }

      // Area names (not in focus: the thumbnails take their place)
      const afs = Math.max(8, Math.min(12, 10.5 * s));
      ctx.font = `700 ${afs}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Place each name at the area's spoke; when it would overlap a name already placed, move it out along the spoke.
      const placed: [number, number, number, number][] = [];
      const areaHits: [string, number, number, number, number][] = [];
      for (const [i, a] of layout.areas.entries()) {
        const k = areaK(i);
        if (T || k <= 0.05) continue;
        const label = w > 560 ? `${a.label} · ${a.count}` : a.label;
        const tw = ctx.measureText(label).width + 8, th = afs + 4;
        let x = 0, y = 0;
        for (const r of [AREA_R, AREA_R + 0.075, AREA_R + 0.15, AREA_R + 0.225]) {
          [x, y] = at(a.a, r);
          const box: [number, number, number, number] = [x - tw / 2, y - th / 2, x + tw / 2, y + th / 2];
          if (!placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) {
            placed.push(box);
            break;
          }
        }
        areaHits.push([a.id, x - tw / 2, y - th / 2, x + tw / 2, y + th / 2]);
        ctx.globalAlpha = k * (hi && hiArea?.id !== a.id ? 0.55 : 1);
        ctx.lineWidth = 4;
        ctx.strokeStyle = bg(1);
        ctx.strokeText(label, x, y);
        ctx.fillStyle = fg(1);
        ctx.fillText(label, x, y);
        ctx.globalAlpha = 1;
      }
      hits.current.areas = areaHits;
      ctx.lineWidth = 1;

      // Reel frame: a title and the address, inside the recording
      if (L.reel) {
        const tfs = Math.max(10, Math.min(16, w * 0.032));
        ctx.font = `700 ${tfs}px ${font}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = fg(1);
        ctx.fillText("VP_", w * 0.07, h * 0.06);
        ctx.font = `500 ${tfs * 0.72}px ${font}`;
        ctx.fillStyle = fg(0.7);
        ctx.fillText(`MY LINKEDIN AS A KNOWLEDGE GRAPH · ${layout.intro.from} TO ${layout.intro.to}`, w * 0.07, h * 0.06 + tfs * 1.3);
        ctx.textAlign = "center";
        ctx.font = `600 ${tfs * 0.8}px ${font}`;
        ctx.fillStyle = fg(0.85);
        ctx.fillText("venkatapagadala.com/linkedin", w / 2, h - h * 0.045);
        // Caption under the circle: where the current post sits in the tree, and which slide this is.
        const capY = cy + R * 1.18;
        if (hiTopic && hiArea && capY < h * 0.86 && !T) {
          ctx.textAlign = "left";
          ctx.font = `600 ${tfs * 0.72}px ${font}`;
          ctx.fillStyle = fg(0.6);
          ctx.fillText(`${topicLabel(hiArea.id).toUpperCase()}   ${String(si + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`, w * 0.07, capY);
          let cfs = tfs * 1.25;
          ctx.font = `700 ${cfs}px ${font}`;
          const name = topicLabel(hiTopic.id);
          while (ctx.measureText(name).width > w * 0.86 && cfs > 9) {
            cfs -= 1;
            ctx.font = `700 ${cfs}px ${font}`;
          }
          ctx.fillStyle = fg(1);
          ctx.fillText(name, w * 0.07, capY + cfs * 1.5);
        } else if (t >= T_AREAS && !hi && !T && capY < h * 0.86 && !L.reduced && out === 0) {
          ctx.textAlign = "left";
          ctx.font = `600 ${tfs * 0.72}px ${font}`;
          ctx.fillStyle = fg(0.6);
          ctx.fillText("EVERY POST, ONE GRAPH", w * 0.07, capY);
          ctx.font = `700 ${tfs * 1.25}px ${font}`;
          ctx.fillStyle = fg(1);
          ctx.fillText(`${layout.intro.areas} areas · ${layout.intro.topics} topics`, w * 0.07, capY + tfs * 1.9);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // ---- interaction ----
  const local = (clientX: number, clientY: number) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [clientX - r.left, clientY - r.top] as const;
  };
  const nearest = (x: number, y: number) => {
    let best = -1, bd = 12 * 12;
    const pos = positions.current;
    for (let i = 0; i < layout.dots.length; i++) {
      const dx = pos[i * 2] - x, dy = pos[i * 2 + 1] - y, d = dx * dx + dy * dy;
      if (d < bd) [bd, best] = [d, i];
    }
    return best;
  };
  /** A topic node or an area name under the pointer. */
  const topicAt = (x: number, y: number) => {
    for (const [id, tx, ty] of hits.current.topics) if ((tx - x) ** 2 + (ty - y) ** 2 < 11 * 11) return id;
    for (const [id, x0, y0, x1, y1] of hits.current.areas) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return id;
    return null;
  };
  const next = () => {
    const c = clock.current;
    setPreview(null);
    const n = slidesFor(c.loop, slideList, focused).length;
    const slideS = reduced ? REDUCED_SLIDE_S : SLIDE_S;
    if (c.t < T_SLIDES && n) c.t = T_SLIDES;
    else {
      const k = Math.floor((c.t - T_SLIDES) / slideS) + 1;
      if (k >= n) {
        c.t = reduced || focused ? T_SLIDES : 0;
        c.loop++;
      } else c.t = T_SLIDES + k * slideS;
    }
    dirty.current = true;
  };
  const replay = () => {
    setPreview(null);
    clock.current.t = reduced || focused ? T_SLIDES : 0;
    clock.current.loop = 0;
    dirty.current = true;
  };
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapRef.current?.requestFullscreen?.().catch(() => {});
  };
  // The post viewer is a dialog on the page: leave full screen first, or it would open where it cannot be seen.
  const open = (key: string) => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {}).finally(() => onOpenEntry(key));
    else onOpenEntry(key);
  };
  const hold = (on: boolean) => {
    live.current.hold = on;
  };

  const { cx, cy, R } = geom(size.w, size.h, reel);
  const side = Math.round(R * 0.56);
  const entry = card !== "hidden" && card !== "intro" ? entryByKey.get(card) : undefined;
  const BTN = "font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40";
  const focusName = activeTopic ? topicLabel(activeTopic) : "Matches";

  return (
    <div ref={wrapRef} className={full ? "bg-background p-3 flex flex-col h-full" : ""} data-testid="linkedin-story">
      <style>{`@keyframes liCardIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}@keyframes liTileIn{from{opacity:0;transform:translate(-50%,-50%) scale(.3)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
      <span ref={probeRef} className="font-mono hidden" aria-hidden="true" />
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {full && filters && <div className="mb-1 w-full">{filters}</div>}
        <button ref={playRef} type="button" className={BTN} onClick={() => setPlaying((p) => !p)}>
          <span aria-hidden="true">{playing ? "❚❚ " : "▶ "}</span>
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" className={BTN} onClick={replay}>
          <span aria-hidden="true">↻ </span>Replay
        </button>
        <button type="button" className={BTN} onClick={next}>
          Next<span aria-hidden="true"> →</span>
        </button>
        <span className="w-2" />
        <button type="button" className={`${BTN} ${reel ? "border-foreground text-foreground" : ""}`} onClick={() => setReel((r) => !r)} aria-pressed={reel} data-testid="linkedin-story-reel">
          Reel 9:16
        </button>
        {canFull && (
          <button type="button" className={BTN} onClick={toggleFull}>
            {full ? "Exit full screen" : "Full screen"}
          </button>
        )}
        {focused && (
          <span className="ml-auto inline-flex flex-wrap items-center gap-2 border border-foreground/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground" data-testid="linkedin-story-focus">
            {focusName} · {focusKeys!.length}
            {tiles && tiles.more > 0 ? <span className="normal-case tracking-normal text-muted-foreground">(top {tiles.tiles.length} here, all in the cards below)</span> : null}
            {activeTopic && (
              <button type="button" onClick={leaveFocus} className="underline text-muted-foreground hover:text-foreground">
                All posts
              </button>
            )}
          </span>
        )}
      </div>
      <div className={`flex justify-center ${full ? "flex-1 min-h-0" : ""}`}>
        <div
          ref={boxRef}
          onMouseLeave={() => setPreview(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPreview(null);
          }}
          className={`relative overflow-hidden border border-border ${
            reel ? (full ? "h-full aspect-[9/16]" : "h-[78vh] max-h-[900px] aspect-[9/16] max-w-full") : full ? "w-full h-full" : "w-full aspect-[16/10] min-h-[460px] max-h-[80vh]"
          }`}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            role="img"
            aria-label={`Animated knowledge graph: ${layout.intro.entries} posts gather around one centre, branch into ${layout.intro.areas} areas and ${layout.intro.topics} topics, then the top posts play as a slideshow. The cards below list every post.`}
            onClick={(e) => {
              if (focused && tiles) return; // in focus, the thumbnails take the clicks
              const [x, y] = local(e.clientX, e.clientY);
              const tp = topicAt(x, y);
              if (tp) return onTopic(tp);
              const i = nearest(x, y);
              if (i < 0) return;
              // Opening a post also focuses its topic, so after the viewer closes its neighbours are right there.
              const main = entryByKey.get(layout.dots[i].key)?.topics[0];
              if (main) onTopic(main);
              open(layout.dots[i].key);
            }}
            onPointerMove={(e) => {
              if (focused && tiles) {
                e.currentTarget.style.cursor = "default";
                return;
              }
              if (e.pointerType !== "mouse") return; // touch: a tap opens, no hover preview to get stuck
              const [x, y] = local(e.clientX, e.clientY);
              const tp = topicAt(x, y);
              const i = tp ? -1 : nearest(x, y);
              e.currentTarget.style.cursor = tp || i >= 0 ? "pointer" : "default";
              if (i >= 0 && layout.dots[i].key !== preview) setPreview(layout.dots[i].key);
            }}
          />
          {tiles && (
            <div role="group" aria-label={`${focusName}: ${tiles.tiles.length} posts (arrow keys move between them)`} onKeyDown={onTilesKey}>
            {tiles.tiles.map((tile, k) => {
              const e = entryByKey.get(tile.key);
              if (!e) return null;
              const it = e.media[0] ? getItem(e.media[0]) : undefined;
              const on = tile.key === card;
              return (
                <button
                  key={tile.key}
                  type="button"
                  tabIndex={k === rove ? 0 : -1}
                  onPointerEnter={(ev) => ev.pointerType === "mouse" && setPreview(tile.key)}
                  onFocus={() => {
                    setRove(k);
                    setPreview(tile.key);
                  }}
                  onClick={() => open(tile.key)}
                  aria-label={`${e.title} (${formatDay(e.date)}${e.engagement?.reactions != null ? `, ${e.engagement.reactions} reactions` : ""})`}
                  className={`absolute overflow-hidden border bg-background transition-[border-color,box-shadow] ${on ? "z-10 border-foreground shadow-[0_0_0_2px_hsl(var(--foreground))]" : "border-foreground/30 hover:border-foreground"}`}
                  style={{
                    left: tile.x,
                    top: tile.y,
                    width: tiles.T,
                    height: tiles.T,
                    transform: "translate(-50%,-50%)",
                    animation: reduced ? undefined : `liTileIn 420ms cubic-bezier(.22,.8,.2,1) ${Math.min(0.9, k * 0.012)}s both`,
                  }}
                  data-testid="linkedin-story-tile"
                >
                  {it ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbUrl(it)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex flex-col justify-center gap-[3px] px-[20%]" aria-hidden="true">
                      <i className="block h-px bg-foreground/60" />
                      <i className="block h-px bg-foreground/60" />
                      <i className="block h-px w-2/3 bg-foreground/60" />
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          )}
          {card !== "hidden" && side > 60 && (
            // One stable element (keyboard focus survives slide changes); its content changes, with a short fade.
            <div
              role={entry ? "button" : undefined}
              tabIndex={entry ? 0 : -1}
              aria-label={entry ? `Open: ${entry.title}` : undefined}
              aria-hidden={entry ? undefined : true}
              onClick={() => entry && open(entry.key)}
              onKeyDown={(e) => {
                if (entry && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  open(entry.key);
                }
              }}
              onMouseEnter={() => hold(true)}
              onMouseLeave={() => hold(false)}
              onFocus={() => hold(true)}
              onBlur={() => hold(false)}
              className={`absolute z-20 overflow-hidden border border-foreground/50 bg-background text-left ${entry ? "cursor-pointer hover:border-foreground" : "pointer-events-none"}`}
              style={{ left: cx, top: cy, width: side, height: side, transform: "translate(-50%,-50%)" }}
            >
              <div key={card} className="flex h-full flex-col" style={{ animation: reduced ? undefined : "liCardIn 420ms cubic-bezier(.22,.8,.2,1)" }}>
                {entry ? <SlideCard entry={entry} side={side} /> : <IntroCard side={side} intro={layout.intro} />}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        <span className="text-foreground">View 04 · Story</span>{" "}
        <span className="normal-case tracking-normal">
          {focused
            ? `· ${
                focusKeys!.length
                  ? `every post in ${activeTopic ? focusName : "the search and filters"} around the centre; hover one to see it, click to open it. ${
                      activeTopic ? 'Esc or "All posts" goes back.' : "Clear the search or filters to go back."
                    }`
                  : "no posts match: clear the search or filters, or pick another topic."
              }`
            : "· every post gathers around one centre, then the top posts play in the middle. Hover a point to see it; click a topic, an area or a point to see all its posts."}{" "}
          To make a Reel: turn on Reel 9:16, go full screen and screen-record (⌘⇧5 on a Mac).
        </span>
      </p>
    </div>
  );
}

function IntroCard({ side, intro }: { side: number; intro: { entries: number; areas: number; topics: number; from: string; to: string } }) {
  return (
    <div className="flex h-full flex-col justify-center px-[8%]">
      {side >= 150 && (
        <p className="font-mono uppercase tracking-[0.2em] text-muted-foreground" style={{ fontSize: side * 0.045 }}>
          Venkata Pagadala · LinkedIn
        </p>
      )}
      <p className="font-display font-bold text-foreground leading-none" style={{ fontSize: side * 0.26, marginTop: side * 0.03 }}>
        {intro.entries}
      </p>
      <p className="font-mono text-foreground/90 leading-tight" style={{ fontSize: Math.max(7, side * 0.06) }}>
        posts, articles and media
      </p>
      <p className="font-mono uppercase tracking-[0.12em] text-muted-foreground leading-snug" style={{ fontSize: Math.max(7, side * 0.045), marginTop: side * 0.05 }}>
        {intro.areas} areas · {intro.topics} topics
        {side >= 150 ? ` · ${intro.from} to ${intro.to}` : ""}
      </p>
    </div>
  );
}

function SlideCard({ entry, side }: { entry: LiEntry; side: number }) {
  const cover = entry.media[0] ? getItem(entry.media[0]) : undefined;
  const main = entry.topics[0];
  const area = main ? getTopic(main)?.parent : undefined;
  const r = entry.engagement;
  const small = Math.max(7, side * 0.042);
  const roomy = side >= 170;
  return (
    <>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl(cover)} alt="" className="block w-full object-cover" style={{ height: side * (roomy ? 0.5 : 0.44) }} />
      ) : (
        <p className="font-mono text-foreground/80 overflow-hidden px-[7%] pt-[7%]" style={{ height: side * (roomy ? 0.5 : 0.44), fontSize: Math.max(7, side * 0.05), lineHeight: 1.4 }}>
          {entry.excerpt}
        </p>
      )}
      <div className="flex flex-1 flex-col px-[7%] py-[5%] min-h-0">
        {roomy && (
          <p className="font-mono uppercase tracking-[0.15em] text-muted-foreground truncate" style={{ fontSize: small }}>
            {SOURCE_LABEL[entry.source]} · {area ? `${topicLabel(area)} › ` : ""}
            {main ? topicLabel(main) : "Post"}
          </p>
        )}
        <p className={`font-mono font-semibold text-foreground ${roomy ? "line-clamp-3" : "line-clamp-2"}`} style={{ fontSize: Math.max(8, side * 0.056), lineHeight: 1.3, marginTop: roomy ? side * 0.015 : 0 }}>
          {entry.title}
        </p>
        <p className="mt-auto font-mono text-foreground truncate" style={{ fontSize: small }}>
          {r?.reactions != null ? `${r.reactions.toLocaleString("en-US")} reactions` : ""}
          {r?.comments && roomy ? ` · ${r.comments.toLocaleString("en-US")} comments` : ""}
          {` · ${roomy ? formatDay(entry.date) : entry.date.slice(0, 4)}`}
        </p>
      </div>
    </>
  );
}
