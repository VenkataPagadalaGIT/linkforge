"use client";
import { useEffect, useRef, useState } from "react";
import { HOME_SECTIONS } from "./aboutSections";

/*
 * The home banner as a room you look into: a floor, a back wall and two side
 * walls, with a spider web strung between them. The web on the floor is the
 * About page: eleven sections on its rim, each with a small web of what it
 * holds. A second web hangs on the back wall, and bridge threads join the two.
 * The room turns with the pointer.
 *
 * Two spiders work it:
 *   - a Halloween spider drops in on a thread from under the menu, then
 *     crawls the eleven sections, now and then climbing the back wall;
 *   - an AI spider crawls the small webs, and pulls each thing it finds along
 *     the silk to the hub at the centre, where the index counts it.
 *
 * All of it is HTML and SVG: a small 3D projection in this file, no WebGL. The
 * section names are real links, drawn as HTML on top. Legs plant and step like
 * a real spider's: each foot stays where it is until the body has moved too
 * far from it, then lifts and lands ahead, in two alternating sets.
 *
 * Without scripts the section links render as a plain row. With reduced
 * motion the room is drawn once, still, with the web finished.
 */

/* ── Vector helpers (y is up) ───────────────────────────────────────── */

type V3 = { x: number; y: number; z: number };
const v = (x: number, y: number, z: number): V3 => ({ x, y, z });
const add = (a: V3, b: V3) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: V3, b: V3) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (a: V3, k: number) => v(a.x * k, a.y * k, a.z * k);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len = (a: V3) => Math.hypot(a.x, a.y, a.z);
const norm = (a: V3) => mul(a, 1 / (len(a) || 1));
const lerp3 = (a: V3, b: V3, t: number) => v(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
const r1 = (n: number) => Math.round(n * 10) / 10;

/* ── The room and the webs ──────────────────────────────────────────── */

const ROOM_X = 980;
const DEPTH = 1300;
const WALL_H = 860;
const FH = v(0, 0, 430); // floor hub: the index
const RIM = { x: 640, z: 300 };
const SEAM = v(0, 0, DEPTH);
const BH = v(0, 470, DEPTH); // back wall hub
const N = HOME_SECTIONS.length;

const NODES = HOME_SECTIONS.map((s, i) => {
  // 01 sits at the far side of the rim, and the rest run clockwise as seen from the front.
  const a = Math.PI / 2 - (i * 2 * Math.PI) / N;
  const p = v(FH.x + RIM.x * Math.cos(a), 0, FH.z + RIM.z * Math.sin(a));
  const n = s.leaves.length;
  const leaves = s.leaves.map((label, j) => {
    const la = a + (j - (n - 1) / 2) * 0.085;
    const k = 1.36 + (j % 2) * 0.06;
    return { label, p: v(FH.x + RIM.x * k * Math.cos(la), 0, FH.z + RIM.z * (k + 0.1) * Math.sin(la)) };
  });
  return { ...s, i, a, p, leaves };
});
const TOTAL_ITEMS = NODES.reduce((sum, n) => sum + n.leaves.length, 0);

/** A strand between two points that sags a little toward a centre, as silk does, as a short polyline. */
function sag(a: V3, b: V3, toward: V3, amount = 0.1, steps = 6): V3[] {
  const out: V3[] = [];
  const mid = lerp3(a, b, 0.5);
  const ctrl = lerp3(mid, toward, amount);
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    // quadratic Bézier a, ctrl, b
    const p = add(add(mul(a, (1 - t) * (1 - t)), mul(ctrl, 2 * (1 - t) * t)), mul(b, t * t));
    out.push(p);
  }
  return out;
}

type Line = V3[];

const ROOM_LINES: Line[] = (() => {
  const L: Line[] = [];
  for (let z = 0; z <= DEPTH; z += 130) L.push([v(-ROOM_X, 0, z), v(ROOM_X, 0, z)]);
  for (let x = -ROOM_X; x <= ROOM_X; x += 140) L.push([v(x, 0, 0), v(x, 0, DEPTH)]);
  for (let x = -ROOM_X; x <= ROOM_X; x += 140) L.push([v(x, 0, DEPTH), v(x, WALL_H, DEPTH)]);
  for (let y = 120; y <= WALL_H; y += 120) L.push([v(-ROOM_X, y, DEPTH), v(ROOM_X, y, DEPTH)]);
  for (const sx of [-ROOM_X, ROOM_X]) {
    for (let z = 0; z <= DEPTH; z += 160) L.push([v(sx, 0, z), v(sx, WALL_H, z)]);
    for (let y = 120; y <= WALL_H; y += 120) L.push([v(sx, y, 0), v(sx, y, DEPTH)]);
  }
  return L;
})();

const FLOOR_WEB: Line[] = (() => {
  const L: Line[] = [];
  for (const n of NODES) L.push([FH, n.p]);
  for (const k of [0.25, 0.5, 0.75, 1]) {
    for (let i = 0; i < N; i++) {
      const a = lerp3(FH, NODES[i].p, k);
      const b = lerp3(FH, NODES[(i + 1) % N].p, k);
      L.push(sag(a, b, FH, k === 1 ? 0.05 : 0.1));
    }
  }
  return L;
})();

const SUB_WEBS: Line[] = (() => {
  const L: Line[] = [];
  for (const n of NODES) {
    n.leaves.forEach((l, j) => {
      L.push([n.p, l.p]);
      if (j > 0) L.push(sag(n.leaves[j - 1].p, l.p, n.p, 0.15, 3));
    });
  }
  return L;
})();

/** The back web's anchors: around the wall's edges and along the seam with the floor. */
const BACK_ANCHORS: V3[] = [
  v(-ROOM_X, 140, DEPTH), v(-ROOM_X, 470, DEPTH), v(-ROOM_X, 780, DEPTH),
  v(-560, WALL_H, DEPTH), v(-160, WALL_H, DEPTH), v(260, WALL_H, DEPTH), v(640, WALL_H, DEPTH),
  v(ROOM_X, 760, DEPTH), v(ROOM_X, 430, DEPTH), v(ROOM_X, 120, DEPTH),
  v(560, 0, DEPTH), v(0, 0, DEPTH), v(-560, 0, DEPTH),
];

const BACK_WEB: Line[] = (() => {
  const L: Line[] = [];
  const sorted = [...BACK_ANCHORS].sort(
    (p, q) => Math.atan2(p.y - BH.y, p.x - BH.x) - Math.atan2(q.y - BH.y, q.x - BH.x),
  );
  for (const a of sorted) L.push([BH, a]);
  for (const k of [0.16, 0.3, 0.44, 0.58, 0.72, 0.86]) {
    for (let i = 0; i < sorted.length; i++) {
      L.push(sag(lerp3(BH, sorted[i], k), lerp3(BH, sorted[(i + 1) % sorted.length], k), BH, 0.12, 4));
    }
  }
  return L;
})();

/** Bridges: the floor web reaches the back wall along the floor; the far rim ties to the seam. */
const BRIDGES: Line[] = [
  [FH, SEAM],
  ...NODES.filter((n) => n.p.z > FH.z + RIM.z * 0.4).map((n) => [n.p, v(n.p.x * 1.15, 0, DEPTH)] as Line),
];

/* ── Camera: orbit the room, then fit the floor web into the banner's bottom band ── */

interface Cam {
  C: V3;
  R: V3;
  U: V3;
  F: V3;
  k: number;
  ox: number;
  oy: number;
}

const TARGET = v(0, 150, 640);
const DIST = 1700;
const FOCAL = 1000;

function orbit(yawDeg: number, elevDeg: number): Omit<Cam, "k" | "ox" | "oy"> {
  const yaw = (yawDeg * Math.PI) / 180;
  const el = (elevDeg * Math.PI) / 180;
  const C = add(TARGET, v(Math.sin(yaw) * Math.cos(el) * DIST, Math.sin(el) * DIST, -Math.cos(yaw) * Math.cos(el) * DIST));
  const F = norm(sub(TARGET, C));
  const R = norm(cross(v(0, 1, 0), F));
  const U = cross(F, R);
  return { C, R, U, F };
}

function raw(c: Omit<Cam, "k" | "ox" | "oy">, p: V3) {
  const d = sub(p, c.C);
  const z = Math.max(1, dot(d, c.F));
  return { x: (FOCAL * dot(d, c.R)) / z, y: (-FOCAL * dot(d, c.U)) / z, s: FOCAL / z };
}

const BASE_ELEV = 38;

/** Scale and place the neutral view so the floor web fills the band at the bottom of the banner. */
function fit(W: number, H: number, band: number): Pick<Cam, "k" | "ox" | "oy"> {
  const c = orbit(0, BASE_ELEV);
  const pts = NODES.flatMap((n) => [n.p, ...n.leaves.map((l) => l.p)]).map((p) => raw(c, p));
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const top = H - band + 44;
  const bottom = H - 96;
  const k = Math.min((W * 0.9) / (maxX - minX), (bottom - top) / (maxY - minY));
  return { k, ox: W / 2 - ((minX + maxX) / 2) * k, oy: bottom - maxY * k };
}

/* ── Spiders ────────────────────────────────────────────────────────── */

const FLOOR_N = v(0, 1, 0);
const WALL_N = v(0, 0, -1);

/** Leg layout, front to back: where each foot rests, and where it joins the body, in body lengths. */
const LEG_REST = [
  { f: 1.3, s: 1.05, rf: 0.38 },
  { f: 0.5, s: 1.35, rf: 0.2 },
  { f: -0.3, s: 1.35, rf: 0.02 },
  { f: -1.15, s: 1.15, rf: -0.16 },
];

type Kind = "halloween" | "ai";
interface Step {
  from: V3;
  to: V3;
  t: number;
}
interface Spider {
  kind: Kind;
  L: number;
  speed: number;
  pos: V3;
  fwd: V3;
  nrm: V3;
  path: V3[];
  seg: number;
  segT: number;
  feet: V3[];
  steps: (Step | null)[];
  group: 0 | 1;
  restUntil: number;
  hanging: boolean;
  laySilk: boolean;
  onArrive: (() => void) | null;
  moving: boolean;
}

function legSide(k: number) {
  return k % 2 === 0 ? 1 : -1;
}
function legIndex(k: number) {
  return Math.floor(k / 2);
}
/** Two sets that step in turn: front-left, second-right, third-left, back-right, and the mirror. */
function legGroup(k: number): 0 | 1 {
  return ((legIndex(k) + (legSide(k) > 0 ? 0 : 1)) % 2) as 0 | 1;
}

function surfaceAt(p: V3): V3 {
  return p.z >= DEPTH - 0.5 && p.y > 0.5 ? WALL_N : FLOOR_N;
}

function restFoot(sp: Spider, k: number): V3 {
  const side = norm(cross(sp.nrm, sp.fwd));
  const r = LEG_REST[legIndex(k)];
  return add(add(sp.pos, mul(sp.fwd, r.f * sp.L)), mul(side, legSide(k) * r.s * sp.L));
}

function makeSpider(kind: Kind, at: V3, L: number, speed: number): Spider {
  const sp: Spider = {
    kind,
    L,
    speed,
    pos: at,
    fwd: v(0, 0, 1),
    nrm: surfaceAt(at),
    path: [],
    seg: 0,
    segT: 0,
    feet: [],
    steps: Array(8).fill(null),
    group: 0,
    restUntil: 0,
    hanging: false,
    laySilk: true,
    onArrive: null,
    moving: false,
  };
  sp.feet = Array.from({ length: 8 }, (_, k) => restFoot(sp, k));
  return sp;
}

/* ── Component ──────────────────────────────────────────────────────── */

const AMBER = "#f2994a";
const AMBER_SOFT = "rgba(242,153,74,0.55)";
const PUMPKIN = "#ff7a18";

export default function WebScene({ band = 300 }: { band?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const refs = {
    room: useRef<SVGPathElement>(null),
    back: useRef<SVGPathElement>(null),
    bridge: useRef<SVGPathElement>(null),
    floor: useRef<SVGPathElement>(null),
    subs: useRef<SVGPathElement>(null),
    silk: useRef<SVGPathElement>(null),
    aiSilk: useRef<SVGPathElement>(null),
    drop: useRef<SVGPathElement>(null),
    beam: useRef<SVGPathElement>(null),
    hBody: useRef<SVGPathElement>(null),
    hMark: useRef<SVGPathElement>(null),
    hEyes: useRef<SVGPathElement>(null),
    hFemur: useRef<SVGPathElement>(null),
    hTibia: useRef<SVGPathElement>(null),
    hTarsus: useRef<SVGPathElement>(null),
    hFemurRim: useRef<SVGPathElement>(null),
    hTibiaRim: useRef<SVGPathElement>(null),
    hTarsusRim: useRef<SVGPathElement>(null),
    hSpec: useRef<SVGPathElement>(null),
    aBody: useRef<SVGPathElement>(null),
    aCore: useRef<SVGPathElement>(null),
    aFemur: useRef<SVGPathElement>(null),
    aTibia: useRef<SVGPathElement>(null),
    aTarsus: useRef<SVGPathElement>(null),
    packets: useRef<SVGPathElement>(null),
    pings: useRef<SVGPathElement>(null),
    drops: useRef<SVGPathElement>(null),
    dropsLit: useRef<SVGPathElement>(null),
    hub: useRef<HTMLDivElement>(null),
    hubInner: useRef<HTMLSpanElement>(null),
    corners: useRef<(HTMLDivElement | null)[]>([]),
  };
  const labelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const leafRefs = useRef<(HTMLSpanElement | null)[][]>(NODES.map(() => []));

  const [ready, setReady] = useState(false);
  const [wide, setWide] = useState(true);
  const [visited, setVisited] = useState(0);
  const [items, setItems] = useState(0);
  const [hLog, setHLog] = useState("dropping in from the menu …");
  const [aLog, setALog] = useState("warming up the index …");
  const hoverRef = useRef<number | null>(null);
  const sendRef = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = el.clientWidth;
    let H = el.clientHeight;
    let isWide = W >= 768;
    let F = fit(W, H, isWide ? band : 0);
    setWide(isWide);
    setReady(true);

    // Pointer: the room turns a little toward it, smoothed.
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduce) window.addEventListener("mousemove", onMove, { passive: true });

    // Redraw state: the static webs redraw only when the room turns or resizes.
    let lastCamKey = "";
    let silkDirty = true;
    const ro = new ResizeObserver(() => {
      W = el.clientWidth;
      H = el.clientHeight;
      isWide = W >= 768;
      F = fit(W, H, isWide ? band : 0);
      setWide(isWide);
      lastCamKey = "";
    });
    ro.observe(el);

    /* ── Crawl state ── */
    const visitedSet = new Set<number>();
    const collected = new Set<string>();
    const fresh = new Map<string, number>(); // leaf key -> time it was pulled
    const silk: Line[] = [];
    const aiSilk: Line[] = [];
    const pings: { p: V3; t0: number }[] = [];
    type Packet = { path: V3[]; d: number; total: number; key: string };
    const packets: Packet[] = [];
    let lapDone = false;
    let aiOrder: { node: number; leaf: number }[] = NODES.flatMap((n) => n.leaves.map((_, j) => ({ node: n.i, leaf: j })));
    let aiIndex = 0;

    const H_SP = makeSpider("halloween", v(260, WALL_H + 380, DEPTH), 34, 210);
    H_SP.hanging = true;
    H_SP.restUntil = performance.now() + 900;
    H_SP.fwd = v(0, -1, 0);
    H_SP.nrm = WALL_N;
    H_SP.feet = Array.from({ length: 8 }, (_, k) => restFoot(H_SP, k));
    const A_SP = makeSpider("ai", add(FH, v(-60, 0, -40)), 21, 175);

    const pathLen = (p: V3[]) => p.slice(1).reduce((s, q, i) => s + len(sub(q, p[i])), 0);
    let introDone = false;

    function go(sp: Spider, path: V3[], onArrive: (() => void) | null, laySilk = true) {
      sp.path = [sp.pos, ...path];
      sp.seg = 0;
      sp.segT = 0;
      sp.onArrive = onArrive;
      sp.laySilk = laySilk;
    }

    /** From wherever the Halloween spider is, a route to a rim section. */
    function routeToNode(sp: Spider, i: number): V3[] {
      const onWall = surfaceAt(sp.pos) === WALL_N || sp.hanging;
      return onWall ? [v(sp.pos.x, 0, DEPTH), FH, NODES[i].p] : [NODES[i].p];
    }

    function hArrive(i: number) {
      return () => {
        H_SP.restUntil = performance.now() + 1100;
        pings.push({ p: NODES[i].p, t0: performance.now() });
        if (!visitedSet.has(i)) {
          visitedSet.add(i);
          setVisited(visitedSet.size);
        }
        const n = NODES[i];
        const found = n.leaves.slice(0, 2).map((l) => l.label).join(", ");
        setHLog(`GET /about#${n.id} → 200 · ${n.hint}${found ? ` · found: ${found}${n.leaves.length > 2 ? " …" : ""}` : ""}`);
      };
    }

    function hNext() {
      if (hoverRef.current !== null) return;
      if (!introDone) {
        // Drop in on a thread from above, onto the back web.
        introDone = true;
        go(H_SP, [v(H_SP.pos.x, 560, DEPTH)], () => {
          H_SP.restUntil = performance.now() + 700;
          setHLog("landed on the back web · heading down to the About page …");
        }, false);
        return;
      }
      if (!lapDone) {
        const next = NODES.findIndex((n) => !visitedSet.has(n.i));
        if (next >= 0) {
          setHLog(`crawling /about#${NODES[next].id} …`);
          go(H_SP, routeToNode(H_SP, next), () => {
            hArrive(next)();
          });
          return;
        }
        lapDone = true;
        setHLog(`${N}/${N} sections crawled · point at a section and I will run there`);
        go(H_SP, [add(FH, v(90, 0, 40))], () => {
          H_SP.restUntil = performance.now() + 3500;
        });
        return;
      }
      // Patrol: a section, or a climb up the back wall to check the web there.
      if (Math.random() < 0.3) {
        setHLog("climbing the back wall to check the web …");
        go(H_SP, [SEAM, BH, add(BH, v(120, 160, 0)), BH, SEAM, FH], () => {
          H_SP.restUntil = performance.now() + 2500;
        });
      } else {
        const i = Math.floor(Math.random() * N);
        setHLog(`re-crawling /about#${NODES[i].id} …`);
        go(H_SP, routeToNode(H_SP, i), () => {
          hArrive(i)();
          H_SP.restUntil = performance.now() + 2600;
        });
      }
    }

    sendRef.current = (i: number) => {
      hoverRef.current = i;
      setHLog(`on my way to /about#${NODES[i].id} …`);
      H_SP.hanging = false;
      H_SP.restUntil = 0;
      go(H_SP, routeToNode(H_SP, i), () => {
        hArrive(i)();
        hoverRef.current = null;
      });
    };

    function aNext() {
      if (aiIndex >= aiOrder.length) {
        // Every item is in the index; keep re-checking a few at random.
        aiOrder = [...aiOrder].sort(() => Math.random() - 0.5).slice(0, 6);
        aiIndex = 0;
        A_SP.restUntil = performance.now() + 4000;
        setALog(`${TOTAL_ITEMS}/${TOTAL_ITEMS} items in the index · re-checking a few`);
        go(A_SP, [FH], null, false);
        return;
      }
      const { node, leaf } = aiOrder[aiIndex++];
      const n = NODES[node];
      const l = n.leaves[leaf];
      const key = `${node}:${leaf}`;
      setALog(`reading ${n.label.toLowerCase()} › ${l.label} …`);
      // Out along the section's thread, then to the item; the packet rides home on its own.
      go(
        A_SP,
        [n.p, l.p],
        () => {
          A_SP.restUntil = performance.now() + 650;
          const path = [l.p, n.p, FH];
          packets.push({ path, d: 0, total: pathLen(path), key });
          setALog(`pulled "${l.label}" → index`);
        },
        true,
      );
    }

    /* ── Render one frame ── */
    let raf = 0;
    let last = performance.now();
    let inView = true;
    let drawn = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);

    const camNow = () => {
      // A gentle turn: enough for the walls to move with the pointer, small
      // enough that the web on the floor always reads level.
      const o = orbit(cur.x * 3.5, BASE_ELEV + cur.y * 1.5);
      return { ...o, ...F };
    };

    function P(c: Cam, p: V3) {
      const q = raw(c, p);
      return { x: F.ox + q.x * F.k, y: F.oy + q.y * F.k, s: q.s * F.k };
    }

    const pathD = (c: Cam, lines: Line[]) => {
      let d = "";
      for (const line of lines) {
        for (let k = 0; k < line.length; k++) {
          const q = P(c, line[k]);
          d += `${k ? "L" : "M"}${r1(q.x)} ${r1(q.y)}`;
        }
      }
      return d;
    };

    function updateSpider(sp: Spider, dt: number, now: number) {
      sp.moving = false;
      if (sp.path.length > 1 && now >= sp.restUntil) {
        let budget = (sp.speed * dt) / 1000;
        while (budget > 0 && sp.seg < sp.path.length - 1) {
          const a = sp.path[sp.seg];
          const b = sp.path[sp.seg + 1];
          const segLen = len(sub(b, a)) || 0.0001;
          const left = segLen * (1 - sp.segT);
          const stepLen = Math.min(budget, left);
          sp.segT += stepLen / segLen;
          budget -= stepLen;
          sp.pos = lerp3(a, b, Math.min(1, sp.segT));
          const dir = norm(sub(b, a));
          const surf = sp.hanging ? WALL_N : surfaceAt(sp.pos);
          // Keep forward tangent to the surface.
          const fwdT = norm(sub(dir, mul(surf, dot(dir, surf))));
          if (len(fwdT) > 0.1) {
            sp.fwd = dot(sp.fwd, fwdT) < -0.6 ? fwdT : norm(lerp3(sp.fwd, fwdT, Math.min(1, dt / 120)));
          }
          sp.nrm = norm(lerp3(sp.nrm, surf, Math.min(1, dt / 160)));
          sp.moving = true;
          if (sp.segT >= 1) {
            if (sp.laySilk && sp.kind === "halloween") silk.push([a, b]);
            if (sp.laySilk && sp.kind === "ai") aiSilk.push([a, b]);
            if (sp.laySilk) silkDirty = true;
            if (silk.length > 90) silk.shift();
            if (aiSilk.length > 90) aiSilk.shift();
            sp.seg += 1;
            sp.segT = 0;
          }
        }
        if (sp.seg >= sp.path.length - 1) {
          sp.path = [];
          if (sp.hanging) sp.hanging = false;
          const cb = sp.onArrive;
          sp.onArrive = null;
          if (cb) cb();
        }
      }

      // Feet: plant, and step in two alternating sets when a foot falls too far behind its rest spot.
      const need: number[] = [];
      for (let k = 0; k < 8; k++) {
        const st = sp.steps[k];
        if (st) {
          st.t += dt / 115;
          if (st.t >= 1) {
            sp.feet[k] = st.to;
            sp.steps[k] = null;
          }
          continue;
        }
        if (len(sub(sp.feet[k], restFoot(sp, k))) > sp.L * (sp.hanging ? 0.35 : 0.55)) need.push(k);
      }
      const busy = sp.steps.some(Boolean);
      if (!busy && need.length) {
        if (!need.some((k) => legGroup(k) === sp.group)) sp.group = sp.group ? 0 : 1;
        for (const k of need) {
          if (legGroup(k) !== sp.group) continue;
          const ahead = sp.moving ? mul(sp.fwd, sp.L * 0.3) : v(0, 0, 0);
          sp.steps[k] = { from: sp.feet[k], to: add(restFoot(sp, k), ahead), t: 0 };
        }
        sp.group = sp.group ? 0 : 1;
      }
    }

    function footNow(sp: Spider, k: number): V3 {
      const st = sp.steps[k];
      if (!st) return sp.feet[k];
      const e = st.t < 0.5 ? 2 * st.t * st.t : 1 - Math.pow(-2 * st.t + 2, 2) / 2;
      return add(lerp3(st.from, st.to, e), mul(sp.nrm, Math.sin(Math.PI * Math.min(1, st.t)) * sp.L * 0.4));
    }

    type LegPaths = {
      femur: SVGPathElement | null;
      tibia: SVGPathElement | null;
      tarsus: SVGPathElement | null;
      rims?: [SVGPathElement | null, SVGPathElement | null, SVGPathElement | null];
    };

    function drawSpider(c: Cam, sp: Spider, body: SVGPathElement | null, legs: LegPaths, extra: (side: V3, c1: V3, c2: V3) => void) {
      const side = norm(cross(sp.nrm, sp.fwd));
      const lift = mul(sp.nrm, sp.L * 0.25);
      const c1 = add(add(sp.pos, mul(sp.fwd, sp.L * 0.35)), lift);
      const c2 = add(add(sp.pos, mul(sp.fwd, -sp.L * 0.66)), mul(sp.nrm, sp.L * 0.42));
      const ell = (cen: V3, rf: number, rs: number) => {
        let d = "";
        for (let t = 0; t < 16; t++) {
          const a = (t / 16) * Math.PI * 2;
          const q = P(c, add(add(cen, mul(sp.fwd, Math.cos(a) * rf)), mul(side, Math.sin(a) * rs)));
          d += `${t ? "L" : "M"}${r1(q.x)} ${r1(q.y)}`;
        }
        return `${d}Z`;
      };
      body?.setAttribute("d", ell(c2, sp.L * 0.78, sp.L * 0.6) + ell(c1, sp.L * 0.46, sp.L * 0.4));
      let fd = "";
      let td = "";
      let sd = "";
      const seg = (a: V3, b: V3) => {
        const p = P(c, a);
        const q = P(c, b);
        return `M${r1(p.x)} ${r1(p.y)}L${r1(q.x)} ${r1(q.y)}`;
      };
      for (let k = 0; k < 8; k++) {
        const r = LEG_REST[legIndex(k)];
        const sgn = legSide(k);
        const root = add(add(add(sp.pos, mul(sp.fwd, r.rf * sp.L)), mul(side, sgn * 0.24 * sp.L)), lift);
        const foot = footNow(sp, k);
        // A real leg: up and out from the body to the knee, down to the ankle, then a short foot.
        const knee = add(add(lerp3(root, foot, 0.36), mul(sp.nrm, sp.L * (sp.hanging ? 0.45 : 0.95))), mul(side, sgn * 0.32 * sp.L));
        const ankle = add(lerp3(knee, foot, 0.62), mul(sp.nrm, sp.L * (sp.hanging ? 0.15 : 0.3)));
        fd += seg(root, knee);
        td += seg(knee, ankle);
        sd += seg(ankle, foot);
      }
      // Palps: two short feelers in front of the head.
      for (const sgn of [1, -1]) {
        const a = add(add(c1, mul(sp.fwd, sp.L * 0.38)), mul(side, sgn * 0.13 * sp.L));
        const b = add(add(add(a, mul(sp.fwd, sp.L * 0.3)), mul(side, sgn * 0.12 * sp.L)), mul(sp.nrm, sp.L * 0.12));
        sd += seg(a, b);
      }
      const sc = P(c, sp.pos).s;
      const w = [Math.max(1.1, sp.L * 0.12 * sc), Math.max(0.9, sp.L * 0.085 * sc), Math.max(0.6, sp.L * 0.055 * sc)];
      const paths = [legs.femur, legs.tibia, legs.tarsus];
      [fd, td, sd].forEach((d, i) => {
        paths[i]?.setAttribute("d", d);
        paths[i]?.setAttribute("stroke-width", String(r1(w[i])));
        const rim = legs.rims?.[i];
        if (rim) {
          rim.setAttribute("d", d);
          rim.setAttribute("stroke-width", String(r1(w[i] + 1.6)));
        }
      });
      extra(side, c1, c2);
    }

    function frame(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      raf = requestAnimationFrame(frame);
      // Browsers already stop animation frames in background tabs; off screen,
      // this skips the work too. The first frame always draws, so the section
      // links are placed even if the banner starts off screen.
      if (!inView && drawn) return;
      drawn = true;

      cur.x += (target.x - cur.x) * 0.05;
      cur.y += (target.y - cur.y) * 0.05;
      const c = camNow();
      const camKey = `${cur.x.toFixed(4)},${cur.y.toFixed(4)},${W},${H}`;
      const camMoved = camKey !== lastCamKey;
      lastCamKey = camKey;

      if (!isWide) {
        // Phones: the room and the back web only, redrawn when something changed.
        if (camMoved) {
          refs.room.current?.setAttribute("d", pathD(c, ROOM_LINES));
          refs.back.current?.setAttribute("d", pathD(c, BACK_WEB));
        }
        return;
      }

      // Spiders think, then move.
      if (!H_SP.path.length && now >= H_SP.restUntil) hNext();
      if (!A_SP.path.length && now >= A_SP.restUntil) aNext();
      updateSpider(H_SP, dt, now);
      updateSpider(A_SP, dt, now);

      // Packets ride the silk to the hub.
      for (let k = packets.length - 1; k >= 0; k--) {
        const pk = packets[k];
        pk.d += (260 * dt) / 1000;
        if (pk.d >= pk.total) {
          packets.splice(k, 1);
          if (!collected.has(pk.key)) {
            collected.add(pk.key);
            setItems(collected.size);
          }
          fresh.set(pk.key, now);
          refs.hubInner.current?.animate([{ transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
        }
      }

      if (camMoved) {
        refs.room.current?.setAttribute("d", pathD(c, ROOM_LINES));
        refs.back.current?.setAttribute("d", pathD(c, BACK_WEB));
        refs.bridge.current?.setAttribute("d", pathD(c, BRIDGES));
        refs.floor.current?.setAttribute("d", pathD(c, FLOOR_WEB));
        refs.subs.current?.setAttribute("d", pathD(c, SUB_WEBS));
      }
      // Dew drops: every section and item, lit once crawled or collected.
      {
        let dim = "";
        let lit = "";
        const circ = (q: { x: number; y: number }, r: number) =>
          `M${r1(q.x - r)} ${r1(q.y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(r * 2)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-r * 2)} 0`;
        for (const n of NODES) {
          const q = P(c, n.p);
          const r = Math.max(2.2, 4.2 * q.s);
          if (visitedSet.has(n.i) || hoverRef.current === n.i) lit += circ(q, r);
          else dim += circ(q, r);
          n.leaves.forEach((l, j) => {
            const lq = P(c, l.p);
            const lr = Math.max(1.2, 2.4 * lq.s);
            if (collected.has(`${n.i}:${j}`)) lit += circ(lq, lr);
            else dim += circ(lq, lr);
          });
        }
        refs.drops.current?.setAttribute("d", dim);
        refs.dropsLit.current?.setAttribute("d", lit);
      }
      if (camMoved || silkDirty) {
        refs.silk.current?.setAttribute("d", pathD(c, silk));
        refs.aiSilk.current?.setAttribute("d", pathD(c, aiSilk));
        silkDirty = false;
      }

      // The thread the Halloween spider drops on, from above the room.
      if (H_SP.hanging) {
        const top = P(c, v(H_SP.pos.x, WALL_H + 900, DEPTH));
        const me = P(c, H_SP.pos);
        refs.drop.current?.setAttribute("d", `M${r1(top.x)} ${r1(top.y)}L${r1(me.x)} ${r1(me.y)}`);
      } else {
        refs.drop.current?.setAttribute("d", "");
      }

      drawSpider(
        c,
        H_SP,
        refs.hBody.current,
        {
          femur: refs.hFemur.current,
          tibia: refs.hTibia.current,
          tarsus: refs.hTarsus.current,
          rims: [refs.hFemurRim.current, refs.hTibiaRim.current, refs.hTarsusRim.current],
        },
        (side, c1, c2) => {
        // An hourglass on the abdomen and two glinting eyes: the Halloween part.
        const m = [
          add(c2, mul(H_SP.fwd, H_SP.L * 0.32)),
          add(c2, mul(side, H_SP.L * 0.16)),
          add(c2, mul(H_SP.fwd, -H_SP.L * 0.32)),
          add(c2, mul(side, -H_SP.L * 0.16)),
        ].map((p) => P(c, add(p, mul(H_SP.nrm, H_SP.L * 0.05))));
        refs.hMark.current?.setAttribute("d", `M${m.map((q) => `${r1(q.x)} ${r1(q.y)}`).join("L")}Z`);
        const e1 = P(c, add(add(c1, mul(H_SP.fwd, H_SP.L * 0.3)), mul(side, H_SP.L * 0.12)));
        const e2 = P(c, add(add(c1, mul(H_SP.fwd, H_SP.L * 0.3)), mul(side, -H_SP.L * 0.12)));
        const er = Math.max(0.8, H_SP.L * 0.07 * e1.s);
        refs.hEyes.current?.setAttribute(
          "d",
          `M${r1(e1.x - er)} ${r1(e1.y)}a${r1(er)} ${r1(er)} 0 1 0 ${r1(er * 2)} 0a${r1(er)} ${r1(er)} 0 1 0 ${r1(-er * 2)} 0` +
            `M${r1(e2.x - er)} ${r1(e2.y)}a${r1(er)} ${r1(er)} 0 1 0 ${r1(er * 2)} 0a${r1(er)} ${r1(er)} 0 1 0 ${r1(-er * 2)} 0`,
        );
        // A gloss on the abdomen, where light would catch it.
        const g = P(c, add(add(add(c2, mul(H_SP.fwd, H_SP.L * 0.22)), mul(side, H_SP.L * 0.2)), mul(H_SP.nrm, H_SP.L * 0.3)));
        const gr = Math.max(0.8, H_SP.L * 0.14 * g.s);
        refs.hSpec.current?.setAttribute("d", `M${r1(g.x - gr)} ${r1(g.y)}a${r1(gr)} ${r1(gr * 0.6)} 0 1 0 ${r1(gr * 2)} 0a${r1(gr)} ${r1(gr * 0.6)} 0 1 0 ${r1(-gr * 2)} 0`);
        },
      );

      drawSpider(c, A_SP, refs.aBody.current, { femur: refs.aFemur.current, tibia: refs.aTibia.current, tarsus: refs.aTarsus.current }, (_side, c1) => {
        // A glowing core that pulses: the AI part.
        const q = P(c, c1);
        const rr = Math.max(1.2, A_SP.L * (0.16 + 0.05 * Math.sin(now / 260)) * q.s);
        refs.aCore.current?.setAttribute("d", `M${r1(q.x - rr)} ${r1(q.y)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(rr * 2)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-rr * 2)} 0`);
        // While it reads an item, a scan line runs from it to the item.
        const reading = now < A_SP.restUntil && aiIndex > 0 && aiIndex <= aiOrder.length;
        if (reading) {
          const { node, leaf } = aiOrder[aiIndex - 1];
          const t = P(c, NODES[node].leaves[leaf].p);
          refs.beam.current?.setAttribute("d", `M${r1(q.x)} ${r1(q.y)}L${r1(t.x)} ${r1(t.y)}`);
        } else refs.beam.current?.setAttribute("d", "");
      });

      // Packets and pings.
      let pd = "";
      for (const pk of packets) {
        let d = pk.d;
        let pt = pk.path[0];
        for (let k = 0; k < pk.path.length - 1; k++) {
          const sl = len(sub(pk.path[k + 1], pk.path[k]));
          if (d <= sl) {
            pt = lerp3(pk.path[k], pk.path[k + 1], d / sl);
            break;
          }
          d -= sl;
          pt = pk.path[k + 1];
        }
        const q = P(c, pt);
        const rr = Math.max(1.6, 3.2 * q.s);
        pd += `M${r1(q.x - rr)} ${r1(q.y)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(rr * 2)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-rr * 2)} 0`;
      }
      refs.packets.current?.setAttribute("d", pd);
      let gd = "";
      for (let k = pings.length - 1; k >= 0; k--) {
        const age = (now - pings[k].t0) / 1100;
        if (age >= 1) {
          pings.splice(k, 1);
          continue;
        }
        const q = P(c, pings[k].p);
        const rr = (4 + age * 22) * Math.max(0.6, q.s);
        gd += `M${r1(q.x - rr)} ${r1(q.y)}a${r1(rr)} ${r1(rr * 0.45)} 0 1 0 ${r1(rr * 2)} 0a${r1(rr)} ${r1(rr * 0.45)} 0 1 0 ${r1(-rr * 2)} 0`;
      }
      refs.pings.current?.setAttribute("d", gd);
      refs.pings.current?.setAttribute("opacity", pings.length ? "0.8" : "0");

      // HTML on top: section links, the items a section holds, the hub's index, the corners.
      NODES.forEach((n) => {
        const a = labelRefs.current[n.i];
        if (!a) return;
        const q = P(c, n.p);
        // Each label sits straight out from the hub, like the numbers on a
        // clock face, so neighbouring sections can never collide.
        const hubQ = P(c, FH);
        let ux = q.x - hubQ.x;
        let uy = q.y - hubQ.y;
        const ul = Math.hypot(ux, uy) || 1;
        ux /= ul;
        uy /= ul;
        const gap = 14;
        const lx = q.x + ux * gap;
        const ly = q.y + uy * gap;
        const dx = ux > 0.25 ? "0%" : ux < -0.25 ? "-100%" : "-50%";
        const dy = uy > 0.6 ? "0%" : uy < -0.6 ? "-100%" : "-50%";
        const sc = Math.min(1.15, Math.max(0.92, q.s * 1.2));
        a.style.transformOrigin = `${ux > 0.25 ? "left" : ux < -0.25 ? "right" : "center"} center`;
        a.style.transform = `translate(${r1(lx)}px, ${r1(ly)}px) translate(${dx}, ${dy}) scale(${r1(sc * 100) / 100})`;
        a.style.opacity = String(Math.min(1, Math.max(0.55, q.s * 1.3)));
        n.leaves.forEach((l, j) => {
          const s = leafRefs.current[n.i]?.[j];
          if (!s) return;
          const lq = P(c, l.p);
          const t = fresh.get(`${n.i}:${j}`);
          const age = t ? (now - t) / 2600 : 1;
          const show = hoverRef.current === n.i ? 1 : Math.max(0, 1 - age);
          let vx = lq.x - q.x;
          let vy = lq.y - q.y;
          const vl = Math.hypot(vx, vy) || 1;
          vx /= vl;
          vy /= vl;
          s.style.transform = `translate(${r1(lq.x + vx * 8)}px, ${r1(lq.y + vy * 8)}px) translate(${vx > 0.25 ? "0%" : vx < -0.25 ? "-100%" : "-50%"}, ${vy > 0.6 ? "0%" : vy < -0.6 ? "-100%" : "-50%"})`;
          s.style.opacity = String(r1(show * 100) / 100);
        });
      });
      const hq = P(c, FH);
      if (refs.hub.current) refs.hub.current.style.transform = `translate(${r1(hq.x)}px, ${r1(hq.y)}px) translate(-50%, 45%)`;
      refs.corners.current.forEach((d, k) => {
        if (!d) return;
        const sx = k % 2 === 0 ? -1 : 1;
        const sy = k < 2 ? -1 : 1;
        d.style.transform = `translate(${r1(cur.x * 5 * sx)}px, ${r1(cur.y * 5 * sy)}px)`;
      });
    }

    if (reduce) {
      // One still frame: the web finished, every section and item in the index.
      NODES.forEach((n) => visitedSet.add(n.i));
      setVisited(N);
      setItems(TOTAL_ITEMS);
      setHLog(`${N}/${N} sections crawled · pick one to open it`);
      setALog(`${TOTAL_ITEMS}/${TOTAL_ITEMS} items in the index`);
      H_SP.hanging = false;
      introDone = true;
      H_SP.restUntil = Infinity;
      A_SP.restUntil = Infinity;
      H_SP.pos = add(FH, v(60, 0, -20));
      H_SP.feet = Array.from({ length: 8 }, (_, k) => restFoot(H_SP, k));
      for (let i = 0; i < N; i++) silk.push([FH, NODES[i].p]);
      requestAnimationFrame((t) => {
        inView = true;
        frame(t);
        cancelAnimationFrame(raf);
      });
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, [band]);

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden" data-testid="web-scene">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="ws-hallo-body" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#3c3c44" />
            <stop offset="55%" stopColor="#141416" />
            <stop offset="100%" stopColor="#050506" />
          </radialGradient>
          <filter id="ws-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path ref={refs.room} className="stroke-foreground/[0.07]" fill="none" strokeWidth={1} />
        <path ref={refs.back} className="stroke-foreground/[0.13]" fill="none" strokeWidth={0.9} />
        {wide && (
          <>
            <path ref={refs.bridge} className="stroke-foreground/[0.14]" fill="none" strokeWidth={0.9} />
            <path ref={refs.floor} className="stroke-foreground/[0.22]" fill="none" strokeWidth={0.9} />
            <path ref={refs.subs} className="stroke-foreground/[0.16]" fill="none" strokeWidth={0.8} />
            <path ref={refs.silk} className="stroke-foreground/60" fill="none" strokeWidth={1.2} strokeLinecap="round" />
            <path ref={refs.aiSilk} stroke={AMBER_SOFT} fill="none" strokeWidth={1} strokeLinecap="round" />
            <path ref={refs.drop} className="stroke-foreground/50" fill="none" strokeWidth={0.8} />
            <path ref={refs.drops} className="fill-background stroke-foreground/50" strokeWidth={1} />
            <path ref={refs.dropsLit} className="fill-foreground" />
            <path ref={refs.pings} className="stroke-foreground" fill="none" strokeWidth={1} opacity={0} />
            <path ref={refs.beam} stroke={AMBER} fill="none" strokeWidth={1} strokeDasharray="2 4" opacity={0.9} />
            <path ref={refs.packets} fill={AMBER} filter="url(#ws-glow)" />
            {/* The AI spider: warm, glowing, translucent */}
            <g filter="url(#ws-glow)">
              <path ref={refs.aFemur} stroke={AMBER} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path ref={refs.aTibia} stroke={AMBER} fill="none" strokeLinecap="round" />
              <path ref={refs.aTarsus} stroke={AMBER} fill="none" strokeLinecap="round" opacity={0.85} />
              <path ref={refs.aBody} fill="rgba(242,153,74,0.28)" stroke={AMBER} strokeWidth={1} />
              <path ref={refs.aCore} fill="#fff4e6" />
            </g>
            {/* The Halloween spider: dark, with a pumpkin hourglass and eyes */}
            <g>
              {/* Legs: a light rim under a dark stroke, so a dark spider still reads on a dark page */}
              <path ref={refs.hFemurRim} className="stroke-foreground/45" fill="none" strokeLinecap="round" />
              <path ref={refs.hTibiaRim} className="stroke-foreground/45" fill="none" strokeLinecap="round" />
              <path ref={refs.hTarsusRim} className="stroke-foreground/40" fill="none" strokeLinecap="round" />
              <path ref={refs.hFemur} stroke="#141416" fill="none" strokeLinecap="round" />
              <path ref={refs.hTibia} stroke="#141416" fill="none" strokeLinecap="round" />
              <path ref={refs.hTarsus} stroke="#1c1c20" fill="none" strokeLinecap="round" />
              <path ref={refs.hBody} fill="url(#ws-hallo-body)" className="stroke-foreground/55" strokeWidth={1} />
              <path ref={refs.hMark} fill={PUMPKIN} />
              <path ref={refs.hSpec} fill="rgba(255,255,255,0.32)" />
              <path ref={refs.hEyes} fill={PUMPKIN} filter="url(#ws-glow)" />
            </g>
          </>
        )}
      </svg>

      {/* Corner brackets, as before */}
      {["top-8 left-8 border-l border-t", "top-8 right-8 border-r border-t", "bottom-8 left-8 border-l border-b", "bottom-8 right-8 border-r border-b"].map((cls, k) => (
        <div
          key={cls}
          ref={(d) => {
            refs.corners.current[k] = d;
          }}
          aria-hidden="true"
          className={`pointer-events-none absolute h-12 w-12 border-foreground/20 ${cls}`}
        />
      ))}

      {wide && (
        <>
          {/* The index at the hub */}
          <div
            ref={refs.hub}
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 top-0 rounded-full border border-foreground/40 bg-background/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground backdrop-blur-sm ${ready ? "" : "hidden"}`}
          >
            <span ref={refs.hubInner} className="inline-block">
              index {items}/{TOTAL_ITEMS}
            </span>
          </div>

          {/* What each section holds: named when the AI spider pulls it in */}
          {NODES.map((n) =>
            n.leaves.map((l, j) => (
              <span
                key={`${n.id}-${j}`}
                ref={(s) => {
                  leafRefs.current[n.i][j] = s;
                }}
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] text-foreground/80 transition-opacity duration-300 ${ready ? "" : "hidden"}`}
                style={{ opacity: 0, textShadow: "0 0 6px hsl(var(--background))" }}
              >
                {l.label}
              </span>
            )),
          )}
        </>
      )}

      {/* The sections: real links. Before scripts run (or without them) they sit in a plain row. */}
      <nav
        aria-label="About me, section by section"
        className={wide ? (ready ? "contents" : "absolute bottom-24 left-0 right-0 flex flex-wrap justify-center gap-x-5 gap-y-2 px-8") : "hidden"}
      >
        {NODES.map((n) => (
          <a
            key={n.id}
            ref={(a) => {
              labelRefs.current[n.i] = a;
            }}
            href={`/about#${n.id}`}
            onMouseEnter={() => sendRef.current(n.i)}
            onFocus={() => sendRef.current(n.i)}
            className={`${ready ? "absolute left-0 top-0 origin-center" : "relative"} whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.14em] text-foreground/90 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-foreground`}
            style={{ textShadow: "0 0 8px hsl(var(--background)), 0 0 2px hsl(var(--background))" }}
          >
            <span className="text-muted-foreground">{String(n.i + 1).padStart(2, "0")}</span> {n.label}
          </a>
        ))}
      </nav>

      {/* The crawl log */}
      {wide && (
        <div className="pointer-events-none absolute bottom-14 left-0 right-0 mx-auto flex max-w-6xl items-end justify-between gap-6 px-6">
          <div className="min-w-0 space-y-0.5 font-mono text-[11px] text-muted-foreground">
            <p className="truncate">
              <span style={{ color: PUMPKIN }}>spider</span> ▸ {hLog}
            </p>
            <p className="truncate">
              <span style={{ color: AMBER }}>ai-spider</span> ▸ {aLog}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
            sections {visited}/{N} · items {items}/{TOTAL_ITEMS}
          </p>
        </div>
      )}
    </div>
  );
}
