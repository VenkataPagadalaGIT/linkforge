"use client";
import { useEffect, useRef, useState } from "react";
import { HOME_SECTIONS } from "./aboutSections";

/*
 * A small spider agent crawls the About page, the way a search engine's spider
 * crawls a site. It walks a thread out to each section, "fetches" it, logs what
 * it found, and spins the web as it goes. Point at a section and it runs there;
 * click and you land on that section of /about.
 *
 * The frame of the web and every link are drawn on the server, so with scripts
 * off this is a still web of links. With reduced motion the web is drawn whole
 * and the spider rests at the hub. The animation runs only while it is on
 * screen, and moves the spider through refs, not React renders.
 */

const W = 1100;
const H = 270;
const HUB = { x: 550, y: 134 };
const RX = 468;
const RY = 96;
const N = HOME_SECTIONS.length;
/** Walking speed in viewBox units per second, and the pause to "fetch" a section. */
const SPEED = 190;
const DWELL = 1100;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Small radius nudges, so the web looks spun rather than drawn with a compass. */
const NUDGE = [0.02, -0.05, 0.06, -0.03, 0.04, -0.06, 0.05, -0.02, 0.06, -0.04, 0.03];

const NODES = HOME_SECTIONS.map((s, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / N + 0.14;
  const k = 1 + NUDGE[i];
  const x = r1(HUB.x + RX * k * Math.cos(a));
  const y = r1(HUB.y + RY * k * Math.sin(a));
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    ...s,
    i,
    x,
    y,
    // Labels sit above the top half and below the bottom half; at the far
    // left and right they run inward so nothing leaves the frame.
    anchor: (cos < -0.85 ? "start" : cos > 0.85 ? "end" : "middle") as "start" | "middle" | "end",
    ly: r1(y + (sin <= 0.15 ? -13 : 22)),
  };
});

/** Capture spiral: rings between the radials, each strand sagging a little toward the hub, as silk does. */
const RINGS = [0.2, 0.4, 0.6, 0.8].map((s) => {
  const pts = NODES.map((n) => ({ x: HUB.x + (n.x - HUB.x) * s, y: HUB.y + (n.y - HUB.y) * s }));
  let d = `M ${r1(pts[0].x)} ${r1(pts[0].y)}`;
  for (let k = 1; k <= N; k++) {
    const p = pts[k % N];
    const q = pts[k - 1];
    const mx = (p.x + q.x) / 2;
    const my = (p.y + q.y) / 2;
    d += ` Q ${r1(mx + (HUB.x - mx) * 0.1)} ${r1(my + (HUB.y - my) * 0.1)} ${r1(p.x)} ${r1(p.y)}`;
  }
  return d;
});

/** Anchor lines from the web's edge to the frame, the threads a real web hangs from. */
const leftmost = NODES.reduce((a, b) => (b.x < a.x ? b : a));
const rightmost = NODES.reduce((a, b) => (b.x > a.x ? b : a));
const topmost = NODES.reduce((a, b) => (b.y < a.y ? b : a));
const bottommost = NODES.reduce((a, b) => (b.y > a.y ? b : a));
const ANCHORS = [
  [leftmost.x, leftmost.y, 0, leftmost.y - 30],
  [rightmost.x, rightmost.y, W, rightmost.y + 24],
  [topmost.x, topmost.y, topmost.x - 60, 0],
  [bottommost.x, bottommost.y, bottommost.x + 70, H],
];

/** Eight legs, facing +x. Each pivots at its root; alternate legs swing in step. */
const LEGS = [0, 1, 2, 3].flatMap((i) =>
  [1, -1].map((side) => {
    const rx = 4.5 - i * 1.7;
    const knee = [8, 3, -2.5, -7][i];
    const foot = [13, 5, -5, -13][i];
    return {
      key: `${i}${side}`,
      rx,
      ry: side * 1.6,
      points: `0,0 ${r1(knee - rx)},${side * 8} ${r1(foot - rx)},${side * 13.5}`,
      phase: (i + (side > 0 ? 0 : 1)) % 2,
    };
  }),
);

type Seg = { x1: number; y1: number; x2: number; y2: number };
type Stop = { x: number; y: number; node: number | null };

const hubStop: Stop = { x: HUB.x, y: HUB.y, node: null };
const nodeStop = (i: number): Stop => ({ x: NODES[i].x, y: NODES[i].y, node: i });

function crawlLine(i: number): string {
  const n = NODES[i];
  const found = n.leaves.slice(0, 2).join(", ");
  return `GET /about#${n.id} → 200 · ${n.hint}${found ? ` · found: ${found}${n.leaves.length > 2 ? " …" : ""}` : ""}`;
}

export default function SpiderWeb() {
  const [segs, setSegs] = useState<Seg[]>([]);
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  const [log, setLog] = useState("waking up · the About page has 11 sections to crawl");
  const [ping, setPing] = useState<{ i: number; k: number } | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  const box = useRef<HTMLDivElement>(null);
  const spider = useRef<SVGGElement>(null);
  const live = useRef<SVGLineElement>(null);
  const legs = useRef<(SVGGElement | null)[]>([]);
  const sim = useRef({
    x: HUB.x,
    y: HUB.y,
    angle: -90,
    from: { x: HUB.x, y: HUB.y },
    to: null as Stop | null,
    t0: 0,
    dur: 0,
    queue: [] as Stop[],
    restUntil: 0,
    lapDone: false,
    running: false,
    pings: 0,
  });

  // Hand the spider a new target from wherever it stands. It spins a fresh
  // thread on the way, so the web gets denser the more people play with it.
  const sendTo = (i: number) => {
    const s = sim.current;
    s.queue = [nodeStop(i)];
    s.to = null;
    s.restUntil = 0;
    setFocus(i);
    setLog(`on my way to /about#${NODES[i].id} …`);
  };

  useEffect(() => {
    const s = sim.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Draw the finished web and rest at the hub.
      const lap: Seg[] = [];
      for (let i = 0; i < N; i++) {
        const a = NODES[i];
        const b = NODES[(i + 1) % N];
        lap.push({ x1: HUB.x, y1: HUB.y, x2: a.x, y2: a.y }, { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
      setSegs(lap);
      setVisited(new Set(NODES.map((n) => n.i)));
      setLog(`${N}/${N} sections indexed · pick one to open it`);
      return;
    }

    // The first lap: out to the top section, around the rim, back to the hub.
    s.queue = [...NODES.map((n) => nodeStop(n.i)), hubStop];

    let raf = 0;
    let last = performance.now();

    const place = (now: number, moving: boolean) => {
      const el = spider.current;
      if (el) el.setAttribute("transform", `translate(${r1(s.x)} ${r1(s.y)}) rotate(${r1(s.angle)})`);
      legs.current.forEach((g, k) => {
        if (!g) return;
        const leg = LEGS[k];
        const swing = moving ? Math.sin(now / 55 + (leg.phase ? Math.PI : 0)) * 15 : 0;
        g.setAttribute("transform", `translate(${leg.rx} ${leg.ry}) rotate(${r1(swing)})`);
      });
    };

    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      if (!s.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (!s.to) {
        if (now < s.restUntil) {
          place(now, false);
          raf = requestAnimationFrame(frame);
          return;
        }
        let next = s.queue.shift();
        if (!next && !s.lapDone) {
          s.lapDone = true;
          setLog(`${N}/${N} sections indexed · point at a section and I will run there`);
          s.restUntil = now + 4200;
          raf = requestAnimationFrame(frame);
          return;
        }
        if (!next) {
          // Patrol: out to a section, then home to the hub, with a rest between.
          const pick = Math.floor(Math.random() * N);
          s.queue = [hubStop];
          next = nodeStop(pick);
          setLog(`re-crawling /about#${NODES[pick].id} …`);
        }
        s.from = { x: s.x, y: s.y };
        s.to = next;
        s.t0 = now;
        s.dur = Math.max(260, (Math.hypot(next.x - s.x, next.y - s.y) / SPEED) * 1000);
        if (next.node !== null && s.lapDone === false) setLog(`crawling /about#${NODES[next.node].id} …`);
      }
      const to = s.to;
      if (to) {
        const t = Math.min(1, (now - s.t0) / s.dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        s.x = s.from.x + (to.x - s.from.x) * e;
        s.y = s.from.y + (to.y - s.from.y) * e;
        const target = (Math.atan2(to.y - s.from.y, to.x - s.from.x) * 180) / Math.PI;
        // Turn toward the thread smoothly rather than snapping.
        const delta = ((target - s.angle + 540) % 360) - 180;
        s.angle += delta * Math.min(1, dt / 90);
        const l = live.current;
        if (l) {
          l.setAttribute("x1", String(r1(s.from.x)));
          l.setAttribute("y1", String(r1(s.from.y)));
          l.setAttribute("x2", String(r1(s.x)));
          l.setAttribute("y2", String(r1(s.y)));
        }
        place(now, true);
        if (t >= 1) {
          const seg = { x1: r1(s.from.x), y1: r1(s.from.y), x2: to.x, y2: to.y };
          if (Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) > 4) setSegs((prev) => (prev.length > 80 ? [...prev.slice(-80), seg] : [...prev, seg]));
          if (l) {
            l.setAttribute("x1", String(to.x));
            l.setAttribute("x2", String(to.x));
            l.setAttribute("y1", String(to.y));
            l.setAttribute("y2", String(to.y));
          }
          if (to.node !== null) {
            const i = to.node;
            setVisited((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
            setLog(crawlLine(i));
            s.pings += 1;
            setPing({ i, k: s.pings });
            s.restUntil = now + DWELL;
          } else {
            s.restUntil = now + (s.lapDone ? 3800 : 600);
          }
          s.to = null;
        }
      }
      raf = requestAnimationFrame(frame);
    };

    // Crawl only while on screen.
    const io = new IntersectionObserver(([e]) => {
      s.running = e.isIntersecting;
    }, { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={box} className="relative">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          About me · a spider agent is indexing it
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          indexed {visited.size}/{N}
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="group" aria-label="The About page's sections, linked in a spider web">
        {/* The frame of the web: anchor lines, radials and the capture spiral */}
        <g className="stroke-foreground/15 pointer-events-none" fill="none" strokeWidth={0.8}>
          {ANCHORS.map(([x1, y1, x2, y2], k) => (
            <line key={`a${k}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
          {NODES.map((n) => (
            <line key={`r${n.id}`} x1={HUB.x} y1={HUB.y} x2={n.x} y2={n.y} />
          ))}
          {RINGS.map((d, k) => (
            <path key={`s${k}`} d={d} />
          ))}
        </g>

        {/* Silk the spider has spun, and the thread it is spinning now */}
        <g className="stroke-foreground/55 pointer-events-none" fill="none" strokeWidth={1.1} strokeLinecap="round">
          {segs.map((g, k) => (
            <line key={`g${k}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
          ))}
          <line ref={live} x1={HUB.x} y1={HUB.y} x2={HUB.x} y2={HUB.y} className="stroke-foreground/80" strokeWidth={1.3} />
        </g>

        {/* The sections: dew drops on the rim, each a link */}
        {NODES.map((n) => {
          const on = visited.has(n.i);
          const hot = focus === n.i;
          return (
            <a
              key={n.id}
              href={`/about#${n.id}`}
              aria-label={`${n.label}: ${n.hint}. Open it on the About page`}
              onMouseEnter={() => sendTo(n.i)}
              onFocus={() => sendTo(n.i)}
              onMouseLeave={() => setFocus(null)}
              onBlur={() => setFocus(null)}
              className="group outline-none"
            >
              {/* A generous invisible target, so the drop is easy to hit */}
              <circle cx={n.x} cy={n.y} r={20} className="fill-transparent" />
              <circle
                cx={n.x}
                cy={n.y}
                r={hot ? 7 : on ? 5 : 4}
                strokeWidth={1.2}
                className={`transition-all duration-300 ${on || hot ? "fill-foreground stroke-foreground" : "fill-background stroke-foreground/60"} group-hover:stroke-foreground group-focus-visible:stroke-foreground`}
              />
              <text
                x={n.x}
                y={n.ly}
                textAnchor={n.anchor}
                className={`font-mono uppercase transition-colors duration-300 ${on || hot ? "fill-foreground" : "fill-muted-foreground"} stroke-background group-hover:fill-foreground`}
                style={{ fontSize: 11.5, letterSpacing: "0.14em", paintOrder: "stroke", strokeWidth: 4 }}
              >
                {String(n.i + 1).padStart(2, "0")} {n.label}
              </text>
            </a>
          );
        })}

        {/* The "fetch" ping */}
        {ping && (
          <circle key={ping.k} cx={NODES[ping.i].x} cy={NODES[ping.i].y} r={6} className="spider-ping pointer-events-none fill-none stroke-foreground" strokeWidth={1} />
        )}

        {/* The hub */}
        <circle cx={HUB.x} cy={HUB.y} r={2.5} className="fill-foreground/60" />

        {/* The spider */}
        {/* Ignores the pointer: it often rests on a section's dot, and the click belongs to the link. */}
        <g
          ref={spider}
          transform={`translate(${HUB.x} ${HUB.y}) rotate(-90)`}
          className="pointer-events-none"
          style={{ filter: "drop-shadow(0 0 3px hsl(var(--foreground) / 0.35))" }}
        >
          <g className="stroke-foreground" fill="none" strokeWidth={1.15} strokeLinejoin="round" strokeLinecap="round">
            {LEGS.map((leg, k) => (
              <g
                key={leg.key}
                ref={(el) => {
                  legs.current[k] = el;
                }}
                transform={`translate(${leg.rx} ${leg.ry})`}
              >
                <polyline points={leg.points} />
              </g>
            ))}
          </g>
          <ellipse cx={-6.5} cy={0} rx={6.5} ry={5} className="fill-foreground" />
          <ellipse cx={3} cy={0} rx={4} ry={3.3} className="fill-foreground" />
          <circle cx={5.6} cy={1.2} r={0.8} className="fill-background" />
          <circle cx={5.6} cy={-1.2} r={0.8} className="fill-background" />
          {/* The agent's status light */}
          <circle cx={-7.5} cy={0} r={1.3} className="fill-background" />
        </g>
      </svg>

      <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground" aria-live="off">
        <span className="text-foreground">spider-agent</span> ▸ {log}
      </p>
    </div>
  );
}
