"use client";
import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useWebGL } from "@/lib/webgl";
import { LINKEDIN_ENTRIES, TOPIC_NODES, formatDay, fullUrl, getItem, getTopic, thumbUrl, topicCounts, topicLabel, type LiEntry } from "@/data/linkedinArchive";

/**
 * 05 Universe: the archive as a 3D space to fly through, styled as mission control.
 *   Ignition  a countdown, a flash, and every post bursts out of one point (me) into a galaxy: each area a cluster,
 *             each topic a nebula, each post a star (brighter with more reactions)
 *   Field     the cursor ripples the stars around it (the star under it stays put, so it can be locked)
 *   Lock      hovering a star fires a radium pulse centre > area > topic > star and the telemetry locks on
 *   Images    the posts nearest the camera pop up as image cards beside their stars, so flying in reveals them
 *   Fly       a click on an area or topic (or the sidebar, or a search) flies the camera there and opens a halo of its
 *             posts around the cluster (facing the camera); a click on a star or card opens the post, and the focus stays for its neighbours
 *   Log       "explored" counts the topics visited (kept in this browser only)
 * One draw call for the stars (THREE.Points, custom shader); labels and cards are HTML in 3D. The page scrolls past it:
 * zoom is Ctrl/⌘ + scroll (any scroll in full screen), and on touch two fingers orbit. Rendering stops offscreen.
 * Reduced motion: no countdown, burst, drift, field or auto-orbit, and the camera jumps instead of flying.
 */

interface Props {
  matching: Set<string> | null;
  activeTopic: string | null;
  onTopic: (id: string | null) => void;
  onOpenEntry: (key: string) => void;
  /** The page's search: shown as a box in full screen, where the page's own box is out of reach. */
  query: string;
  onQuery: (q: string) => void;
}

const RADIUM = "#36ffb0";
const IGNITE_AT = 2.4;
const AREA_R = 11;
const MAX_CARDS = 72;
/** Image pop-ups: at most this many at once, the posts nearest the camera. */
const NEAR_CARDS = 22;
const LOG_KEY = "li-universe-explored";
const TAN_HALF_FOV = Math.tan((50 / 2) * (Math.PI / 180));
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

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rand: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, rand()))) * Math.cos(2 * Math.PI * rand());
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

function buildUniverse() {
  const rand = seeded(2026);
  const own = new Map<string, LiEntry[]>();
  const loose: LiEntry[] = [];
  for (const e of LINKEDIN_ENTRIES) {
    const t = e.topics[0];
    if (!t || getTopic(t)?.level !== 2) loose.push(e);
    else (own.get(t) ?? own.set(t, []).get(t)!).push(e);
  }
  const counts = topicCounts();
  const maxR = Math.max(1, ...LINKEDIN_ENTRIES.map((e) => e.engagement?.reactions ?? 0));
  const groups = TOPIC_NODES.filter((n) => n.level === 1)
    .map((a) => ({ a, topics: TOPIC_NODES.filter((t) => t.parent === a.id && (own.get(t.id)?.length ?? 0) > 0) }))
    .filter((x) => x.topics.length);
  const areas: { id: string; label: string; pos: THREE.Vector3; count: number }[] = [];
  const topics: { id: string; label: string; area: number; pos: THREE.Vector3; count: number }[] = [];
  const stars: { key: string; pos: THREE.Vector3; size: number; topic: number; area: number; delay: number; seed: number; image: boolean }[] = [];
  const size = (e: LiEntry) => 7 + 24 * Math.sqrt((e.engagement?.reactions ?? 0) / maxR) + (e.media.length ? 3 : 0);
  const n = groups.length;
  groups.forEach((g, i) => {
    // Areas on a flattened Fibonacci sphere: a galaxy you can orbit, every cluster in view.
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n), theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.6, Math.sin(phi) * Math.sin(theta)).normalize();
    const apos = dir.clone().multiplyScalar(AREA_R);
    const ai = areas.length;
    areas.push({ id: g.a.id, label: g.a.label, pos: apos, count: counts.get(g.a.id) ?? 0 });
    const m = g.topics.length;
    g.topics.forEach((t, j) => {
      const p2 = Math.acos(1 - (2 * (j + 0.5)) / m), th2 = Math.PI * (1 + Math.sqrt(5)) * j + i;
      const off = new THREE.Vector3(Math.sin(p2) * Math.cos(th2), Math.cos(p2), Math.sin(p2) * Math.sin(th2)).add(dir.clone().multiplyScalar(0.9)).normalize();
      const list = own.get(t.id)!;
      const tpos = apos.clone().add(off.multiplyScalar(2.4 + Math.sqrt(m) * 0.4));
      const ti = topics.length;
      topics.push({ id: t.id, label: t.label, area: ai, pos: tpos, count: counts.get(t.id) ?? list.length });
      const spread = 0.35 + Math.sqrt(list.length) * 0.085;
      for (const e of list) {
        const pos = new THREE.Vector3(tpos.x + gauss(rand) * spread, tpos.y + gauss(rand) * spread, tpos.z + gauss(rand) * spread);
        stars.push({ key: e.key, pos, size: size(e), topic: ti, area: ai, delay: (pos.length() / 18) * 0.5 + rand() * 0.45, seed: rand(), image: !!(e.media[0] && getItem(e.media[0])) });
      }
    });
  });
  for (const e of loose) {
    const d = new THREE.Vector3(gauss(rand), gauss(rand) * 0.6, gauss(rand)).normalize().multiplyScalar(17 + rand() * 3);
    stars.push({ key: e.key, pos: d, size: size(e) * 0.7, topic: -1, area: -1, delay: 0.5 + rand() * 0.4, seed: rand(), image: !!(e.media[0] && getItem(e.media[0])) });
  }
  const years = LINKEDIN_ENTRIES.map((e) => e.date.slice(0, 4)).sort();
  return {
    areas,
    topics,
    stars,
    starIndex: new Map(stars.map((s, i) => [s.key, i])),
    topicIndex: new Map(topics.map((t, i) => [t.id, i])),
    areaIndex: new Map(areas.map((a, i) => [a.id, i])),
    years: { from: years[0], to: years[years.length - 1] },
  };
}
type Universe = ReturnType<typeof buildUniverse>;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uIntro;
uniform vec3 uRayO;
uniform vec3 uRayD;
uniform float uField;
uniform float uScale;
uniform float uPixel;
uniform float uMaxPoint;
attribute float aDelay;
attribute float aSize;
attribute float aMatch;
attribute float aHot;
attribute float aSeed;
varying float vAlpha;
varying float vHot;
void main() {
  float k = uIntro > 0.5 ? clamp((uTime - ${IGNITE_AT.toFixed(2)} - aDelay) / 1.3, 0.0, 1.0) : 1.0;
  k = k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0;
  vec3 p = position * k;
  p += 0.05 * vec3(sin(uTime * 0.7 + aSeed * 6.28), cos(uTime * 0.6 + aSeed * 4.0), sin(uTime * 0.5 + aSeed * 9.0)) * uIntro;
  // The field: a ripple round the pointer's ray, sized to the view (uScale = camera distance / 34). Stars right on
  // the ray, and the locked star, stay put, so the one under the cursor can always be locked.
  vec3 w = p - uRayO;
  vec3 c = uRayO + uRayD * dot(w, uRayD);
  vec3 d = p - c;
  float dn = length(d) / uScale;
  float f = exp(-dn * dn / 2.4) * smoothstep(0.15, 0.8, dn) * (1.0 - aHot);
  p += (d / max(length(d), 1e-3)) * uField * 1.5 * uScale * f;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(aSize * (1.0 + aHot * 1.8) * (0.4 + 0.6 * aMatch) * uPixel / -mv.z, uMaxPoint);
  vAlpha = (0.18 + 0.82 * aMatch) * (k > 0.0 ? 1.0 : 0.0) * smoothstep(0.4, 2.5, -mv.z);
  vHot = aHot;
}`;
const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vAlpha;
varying float vHot;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  vec3 col = mix(uColor, uAccent, vHot);
  gl_FragColor = vec4(col, vAlpha * (pow(core, 2.4) * 0.9 + core * 0.12));
}`;

/** A tiny synth: clicks and whooshes made on the fly (no sound files). Off until the viewer turns it on. */
function makeSound() {
  let ctx: AudioContext | null = null;
  const get = () => (ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());
  const blip = (freq: number, dur = 0.035, vol = 0.035) => {
    const c = get(), o = c.createOscillator(), g = c.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  };
  const whoosh = () => {
    const c = get(), len = Math.floor(c.sampleRate * 0.9), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = "bandpass";
    f.frequency.setValueAtTime(300, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(2400, c.currentTime + 0.8);
    g.gain.value = 0.05;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  };
  return {
    blip,
    whoosh,
    resume: () => get().resume(),
    close: () => {
      ctx?.close().catch(() => {});
      ctx = null;
    },
  };
}

export default function LinkedInUniverse({ matching, activeTopic, onTopic, onOpenEntry, query, onQuery }: Props) {
  const gl = useWebGL();
  const u = React.useMemo(buildUniverse, []);
  const entryByKey = React.useMemo(() => new Map(LINKEDIN_ENTRIES.map((e) => [e.key, e])), []);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const igniteRef = React.useRef<HTMLButtonElement>(null);
  const [reduced, setReduced] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [hover, setHover] = React.useState<string | null>(null);
  const [igniteKey, setIgniteKey] = React.useState(0);
  const [count, setCount] = React.useState<string | null>(null);
  const [sound, setSound] = React.useState(false);
  const [orbit, setOrbit] = React.useState(true);
  const [images, setImages] = React.useState(true);
  const [full, setFull] = React.useState(false);
  const [canFull, setCanFull] = React.useState(false);
  const [touch, setTouch] = React.useState(false);
  React.useEffect(() => {
    setCanFull(!!document.fullscreenEnabled);
    setTouch(!!window.matchMedia?.("(pointer: coarse)").matches);
  }, []);
  const [explored, setExplored] = React.useState<Set<string>>(() => new Set());
  const [toast, setToast] = React.useState<string | null>(null);
  const synth = React.useMemo(() => (typeof window === "undefined" ? null : makeSound()), []);
  React.useEffect(() => () => synth?.close(), [synth]);
  const soundRef = React.useRef(sound);
  soundRef.current = sound;

  React.useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener?.("change", sync);
    return () => q.removeEventListener?.("change", sync);
  }, []);
  // Rendering stops while the view is off screen.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
      if (Array.isArray(saved)) setExplored(new Set(saved.filter((x) => typeof x === "string" && u.topicIndex.has(x))));
    } catch {
      // storage blocked: the log starts empty
    }
  }, [u]);
  React.useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  // Countdown, then ignition (skipped with reduced motion).
  React.useEffect(() => {
    if (reduced) return setCount(null);
    const steps: [number, string | null][] = [[0, "T-3"], [0.6, "T-2"], [1.2, "T-1"], [1.8, "IGNITION"], [IGNITE_AT + 0.6, null]];
    const timers = steps.map(([at, label]) => window.setTimeout(() => setCount(label), at * 1000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [igniteKey, reduced]);

  const logTopic = React.useCallback(
    (topicId: string | undefined) => {
      if (!topicId || !u.topicIndex.has(topicId)) return;
      setExplored((prev) => {
        if (prev.has(topicId)) return prev;
        const next = new Set(prev).add(topicId);
        try {
          localStorage.setItem(LOG_KEY, JSON.stringify([...next]));
        } catch {
          // storage blocked: the log lasts for this visit
        }
        if ([5, 15, 30, u.topics.length].includes(next.size)) setToast(next.size === u.topics.length ? "ALL TOPICS EXPLORED" : `LOG: ${next.size} TOPICS EXPLORED`);
        return next;
      });
    },
    [u],
  );
  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);
  React.useEffect(() => {
    if (activeTopic) logTopic(getTopic(activeTopic)?.level === 3 ? getTopic(activeTopic)?.parent ?? undefined : activeTopic);
  }, [activeTopic, logTopic]);

  const onHover = React.useCallback(
    (key: string | null) => {
      setHover(key);
      if (key) {
        logTopic(entryByKey.get(key)?.topics[0]);
        if (soundRef.current) synth?.blip(1500);
      }
    },
    [entryByKey, logTopic, synth],
  );
  // Resting on a post for a moment loads its full image ahead, so opening it is instant (a sweep loads nothing).
  React.useEffect(() => {
    const e = hover ? entryByKey.get(hover) : undefined;
    const it = e?.media[0] ? getItem(e.media[0]) : undefined;
    if (!it || it.kind !== "image") return;
    const t = window.setTimeout(() => (new Image().src = fullUrl(it)), 250);
    return () => window.clearTimeout(t);
  }, [hover, entryByKey]);
  const open = React.useCallback(
    (key: string) => {
      if (soundRef.current) {
        synth?.blip(880, 0.06);
        window.setTimeout(() => synth?.blip(1320, 0.08), 70);
      }
      // Opening a post from the whole galaxy also focuses its topic, so its neighbours are there after the viewer
      // closes; inside a focus or a search, the focus (and the page's filter) stays as it is.
      const main = entryByKey.get(key)?.topics[0];
      if (main && !activeTopic && !matching) {
        // The focus about to open replaces what is on screen: park keyboard focus on a control that stays.
        if (wrapRef.current?.contains(document.activeElement)) igniteRef.current?.focus();
        onTopic(main);
      }
      const go = () => onOpenEntry(key);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {}).finally(go);
      else go();
    },
    [onOpenEntry, onTopic, synth, entryByKey, activeTopic, matching],
  );
  const pick = React.useCallback(
    (id: string | null) => {
      if (soundRef.current && id) synth?.whoosh();
      onTopic(id);
    },
    [onTopic, synth],
  );
  /** Leave the focus; keyboard focus moves to Ignite first, since the cards are about to go. */
  const leaveFocus = React.useCallback(() => {
    if (wrapRef.current?.contains(document.activeElement)) igniteRef.current?.focus();
    onTopic(null);
  }, [onTopic]);
  // Esc leaves a focus, when the view is on screen (unless a dialog or a text field has it).
  React.useEffect(() => {
    if (!activeTopic) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("[role=dialog]")) return;
      if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      if (!visible && !wrapRef.current?.contains(document.activeElement)) return;
      leaveFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTopic, leaveFocus, visible]);

  // Focus: the topic's cluster (a subtopic flies to its topic), or the centre of a search's matches.
  const focusKeys = React.useMemo(
    () =>
      matching
        ? LINKEDIN_ENTRIES.filter((e) => matching.has(e.key) && u.starIndex.has(e.key))
            .sort((a, b) => (b.engagement?.reactions ?? 0) - (a.engagement?.reactions ?? 0) || b.date.localeCompare(a.date))
            .map((e) => e.key)
        : null,
    [matching, u],
  );
  const focus = React.useMemo(() => {
    if (!focusKeys) return null;
    const t = activeTopic ? getTopic(activeTopic) : undefined;
    let center: THREE.Vector3 | null = null, dist = 12;
    if (t?.level === 1 && u.areaIndex.has(t.id)) [center, dist] = [u.areas[u.areaIndex.get(t.id)!].pos, 18];
    else if (t) {
      const tid = t.level === 3 ? t.parent! : t.id;
      if (u.topicIndex.has(tid)) center = u.topics[u.topicIndex.get(tid)!].pos;
    }
    if (!center && focusKeys.length) {
      center = new THREE.Vector3();
      for (const k of focusKeys) center.add(u.stars[u.starIndex.get(k)!].pos);
      center.divideScalar(focusKeys.length);
      dist = 20;
    }
    return center ? { center: center.clone(), dist, keys: focusKeys.slice(0, MAX_CARDS), total: focusKeys.length, search: !t } : null;
  }, [focusKeys, activeTopic, u]);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapRef.current?.requestFullscreen?.().catch(() => {});
  };
  const hoverEntry = hover ? entryByKey.get(hover) : undefined;
  const BTN = "font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40";
  const DARK_BTN = "font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 border border-white/25 bg-black text-white/70 hover:text-white hover:border-white/60";
  const btn = full ? DARK_BTN : BTN;

  if (gl.ok === false)
    return (
      <div className="border border-border p-6 font-mono text-[12px] text-muted-foreground">
        This browser cannot draw 3D graphics (WebGL is off), so the Universe view is not available. The other views and the cards below show everything.
      </div>
    );

  return (
    <div ref={wrapRef} className={full ? "bg-black h-full flex flex-col p-3" : ""} data-testid="linkedin-universe">
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {full && (
          // In full screen the page's search box is out of reach: this one drives the same search.
          <label className="flex min-w-[220px] flex-1 items-center gap-2 border border-white/25 px-2 py-1 sm:flex-none sm:w-[300px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="seoweek, knowledge graph…"
              className="flex-1 bg-transparent font-mono text-[12px] text-white outline-none placeholder:text-white/35"
              data-testid="linkedin-universe-search"
            />
          </label>
        )}
        <button
          ref={igniteRef}
          type="button"
          className={btn}
          onClick={() => {
            setHover(null);
            setIgniteKey((k) => k + 1);
          }}
        >
          <span aria-hidden="true">↻ </span>Ignite
        </button>
        <button type="button" className={btn} onClick={() => setImages((v) => !v)} aria-pressed={images}>
          Images {images ? "on" : "off"}
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            if (!sound) synth?.resume();
            setSound((s) => !s);
          }}
          aria-pressed={sound}
        >
          Sound {sound ? "on" : "off"}
        </button>
        {!reduced && (
          <button type="button" className={btn} onClick={() => setOrbit((o) => !o)} aria-pressed={orbit}>
            Auto-orbit {orbit ? "on" : "off"}
          </button>
        )}
        <button type="button" className={btn} onClick={leaveFocus} disabled={!activeTopic} aria-disabled={!activeTopic}>
          ✕ All
        </button>
        {canFull && (
          <button type="button" className={btn} onClick={toggleFull}>
            {full ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </div>

      <div
        className={`relative overflow-hidden border border-border bg-black ${full ? "flex-1" : "w-full aspect-[16/10] min-h-[520px] max-h-[85vh]"}`}
        style={{ cursor: "crosshair" }}
      >
        {gl.ok && (
          <Canvas
            dpr={[1, 1.5]}
            frameloop={!visible ? "never" : reduced ? "demand" : "always"}
            camera={{ position: [0, 7, 34], fov: 50, near: 0.1, far: 200 }}
            gl={{ powerPreference: gl.power, antialias: false }}
            onCreated={({ gl: r }) => r.domElement.setAttribute("aria-hidden", "true")}
          >
            <color attach="background" args={["#000000"]} />
            <Scene
              u={u}
              igniteKey={igniteKey}
              reduced={reduced}
              matching={matching}
              hover={hover}
              onHover={onHover}
              onOpen={open}
              onPick={pick}
              activeTopic={activeTopic}
              focus={focus}
              orbit={orbit && !reduced}
              images={images}
              full={full}
              entryByKey={entryByKey}
            />
            <EffectComposer multisampling={0}>
              <Bloom intensity={1.15} luminanceThreshold={0.12} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
            </EffectComposer>
          </Canvas>
        )}

        {/* HUD */}
        <div className="pointer-events-none absolute z-40 left-3 top-3 font-mono text-white">
          <p className="text-[11px] font-bold tracking-[0.25em]">VP_ MISSION CONTROL</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/60">
            {u.stars.length} objects · {u.areas.length} sectors · {u.topics.length} topics · {u.years.from} to {u.years.to}
          </p>
          {focus && (
            <p className="mt-2 inline-block border border-[#36ffb0]/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#36ffb0]" data-testid="linkedin-universe-focus">
              {activeTopic ? topicLabel(activeTopic) : "Matches"} · {focus.total}
              {focus.total > focus.keys.length ? ` (top ${focus.keys.length} as cards)` : ""}
            </p>
          )}
        </div>
        {count && (
          <div className="pointer-events-none absolute z-40 inset-0 grid place-items-center" aria-hidden="true">
            <p className={`font-mono font-bold tracking-[0.4em] text-white ${count === "IGNITION" ? "text-4xl text-[#36ffb0]" : "text-3xl"}`}>{count}</p>
          </div>
        )}

        {hoverEntry && (
          <div className="pointer-events-none absolute z-40 bottom-3 left-3 w-[300px] max-w-[60%] border border-[#36ffb0]/50 bg-black/80 p-3 font-mono text-white" data-testid="linkedin-universe-target">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#36ffb0]">Target locked</p>
            <div className="mt-2 flex gap-3">
              {hoverEntry.media[0] && getItem(hoverEntry.media[0]) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(getItem(hoverEntry.media[0])!)} alt="" className="h-16 w-16 shrink-0 object-cover border border-white/20" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] leading-snug line-clamp-3">{hoverEntry.title}</p>
                <p className="mt-1 text-[10px] text-white/60">
                  {hoverEntry.engagement?.reactions != null ? `${hoverEntry.engagement.reactions} reactions · ` : ""}
                  {formatDay(hoverEntry.date)}
                </p>
              </div>
            </div>
            {hoverEntry.topics[0] && (
              <p className="mt-2 truncate text-[10px] uppercase tracking-[0.15em] text-white/60">
                {topicLabel(getTopic(hoverEntry.topics[0])?.parent ?? "")} › {topicLabel(hoverEntry.topics[0])}
              </p>
            )}
            <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/80">Click to open</p>
          </div>
        )}

        <div className="pointer-events-none absolute z-40 bottom-3 right-3 w-[200px] font-mono text-white" data-testid="linkedin-universe-log">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
            Explored <span className="text-white">{explored.size}</span> / {u.topics.length} topics
          </p>
          <div className="mt-1 h-[3px] w-full bg-white/15">
            <div className="h-full bg-[#36ffb0] transition-[width] duration-500" style={{ width: `${Math.min(100, (explored.size / u.topics.length) * 100)}%` }} />
          </div>
          <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-white/40">
            {touch && !full ? "Two fingers to orbit and zoom · tap to open" : `Drag to orbit · ${full ? "scroll" : "Ctrl/⌘ + scroll"} to zoom · click to fly`}
          </p>
        </div>

        {toast && (
          <div className="pointer-events-none absolute z-40 left-1/2 top-14 -translate-x-1/2 border border-[#36ffb0] bg-black/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-[#36ffb0]" role="status">
            {toast}
          </div>
        )}
      </div>
      <p className={`mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${full ? "text-white/50" : "text-muted-foreground/70"}`}>
        <span className={full ? "text-white" : "text-foreground"}>View 05 · Universe</span>{" "}
        <span className="normal-case tracking-normal">
          · every post a star around one core; the nearest posts pop up as images. Hover a star to lock on, click a sector or a topic to fly in and see its
          posts around it, click a card or a star to open it. Esc goes back. The cards below list everything.
        </span>
      </p>
    </div>
  );
}

interface Focus {
  center: THREE.Vector3;
  dist: number;
  keys: string[];
  total: number;
  search: boolean;
}
interface SceneProps {
  u: Universe;
  igniteKey: number;
  reduced: boolean;
  matching: Set<string> | null;
  hover: string | null;
  onHover: (key: string | null) => void;
  onOpen: (key: string) => void;
  onPick: (id: string | null) => void;
  activeTopic: string | null;
  focus: Focus | null;
  orbit: boolean;
  images: boolean;
  full: boolean;
  entryByKey: Map<string, LiEntry>;
}

/** One image card in 3D (the halo round a focus, or a pop-up beside a star). */
const Card = React.memo(function Card({
  entry,
  on,
  width,
  delay,
  reduced,
  onHover,
  onOpen,
  tabbable = true,
}: {
  tabbable?: boolean;
  entry: LiEntry;
  on: boolean;
  width: number;
  delay: number;
  reduced: boolean;
  onHover: (key: string) => void;
  onOpen: (key: string) => void;
}) {
  const it = entry.media[0] ? getItem(entry.media[0]) : undefined;
  return (
    <button
      type="button"
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(entry.key)}
      onFocus={() => onHover(entry.key)}
      onClick={() => onOpen(entry.key)}
      tabIndex={tabbable ? 0 : -1}
      aria-label={`${entry.title} (${formatDay(entry.date)})`}
      className={`block overflow-hidden border bg-black text-left transition-[transform,border-color] duration-200 ${on ? "scale-110 border-[#36ffb0]" : "border-white/30 hover:scale-105 hover:border-white"}`}
      style={{ width, animation: reduced ? undefined : `liPop 520ms cubic-bezier(.2,1.4,.4,1) ${delay}s both` }}
    >
      {it ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl(it)} alt="" className="block w-full object-cover" style={{ height: Math.round(width * 0.66) }} loading="lazy" />
      ) : (
        <p className="overflow-hidden p-1.5 font-mono text-[9px] leading-snug text-white/80" style={{ height: Math.round(width * 0.66) }}>
          {entry.excerpt || entry.title}
        </p>
      )}
      {width >= 90 && <p className="truncate px-1.5 py-1 font-mono text-[9px] text-white/80">{entry.title}</p>}
    </button>
  );
});

function Scene({ u, igniteKey, reduced, matching, hover, onHover, onOpen, onPick, activeTopic, focus, orbit, images, full, entryByKey }: SceneProps) {
  const { camera, size, gl, invalidate } = useThree();
  /** The element the controls listen on (R3F's outer div): touch and wheel handling must sit there. */
  const surface = useThree((st) => st.events.connected) as HTMLElement | undefined;
  const controls = React.useRef<OrbitControlsImpl>(null);
  const start = React.useRef(performance.now());
  React.useEffect(() => {
    start.current = performance.now();
    setNear([]);
    invalidate();
  }, [igniteKey, invalidate]);
  const elapsed = () => (reduced ? 999 : (performance.now() - start.current) / 1000);

  // ---- stars ----
  const geom = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = u.stars.length;
    const pos = new Float32Array(n * 3), delay = new Float32Array(n), sz = new Float32Array(n), seed = new Float32Array(n);
    u.stars.forEach((s, i) => {
      pos.set([s.pos.x, s.pos.y, s.pos.z], i * 3);
      delay[i] = s.delay;
      sz[i] = s.size;
      seed[i] = s.seed;
    });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aMatch", new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    g.setAttribute("aHot", new THREE.BufferAttribute(new Float32Array(n), 1));
    return g;
  }, [u]);
  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uIntro: { value: 1 },
          uRayO: { value: new THREE.Vector3(0, 0, 1000) },
          uRayD: { value: new THREE.Vector3(0, 0, -1) },
          uField: { value: 0 },
          uScale: { value: 1 },
          uPixel: { value: 1 },
          uMaxPoint: { value: 96 },
          uColor: { value: new THREE.Color("#ffffff") },
          uAccent: { value: new THREE.Color(RADIUM) },
        },
      }),
    [],
  );
  React.useEffect(() => () => (geom.dispose(), mat.dispose()), [geom, mat]);
  const matchRef = React.useRef(matching);
  matchRef.current = matching;
  React.useEffect(() => {
    const a = geom.getAttribute("aMatch") as THREE.BufferAttribute;
    u.stars.forEach((s, i) => (a.array[i] = !matching || matching.has(s.key) ? 1 : 0));
    a.needsUpdate = true;
    invalidate();
  }, [matching, geom, u, invalidate]);
  React.useEffect(() => {
    const a = geom.getAttribute("aHot") as THREE.BufferAttribute;
    (a.array as Float32Array).fill(0);
    const i = hover ? u.starIndex.get(hover) : undefined;
    if (i != null) a.array[i] = 1;
    a.needsUpdate = true;
    invalidate();
  }, [hover, geom, u, invalidate]);

  // ---- the cursor's field, and hover picking ----
  const pointer = React.useRef({ x: 0, y: 0, inside: false, downX: 0, downY: 0 });
  const field = React.useRef(0);
  const ray = React.useMemo(() => new THREE.Raycaster(), []);
  const ndc = React.useMemo(() => new THREE.Vector2(), []);
  const tmp = React.useMemo(() => new THREE.Vector3(), []);
  const hoverRef = React.useRef(hover);
  hoverRef.current = hover;
  const handlers = React.useRef({ onHover, onOpen });
  handlers.current = { onHover, onOpen };
  const pixelRef = React.useRef(28);
  React.useEffect(() => {
    const el = gl.domElement;
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = e.clientX - r.left;
      pointer.current.y = e.clientY - r.top;
    };
    /** The star under the pointer: within its drawn size (at least 16 px), skipping stars dimmed by a filter. */
    const nearest = () => {
      if (elapsed() < IGNITE_AT + 2) return null;
      const m = matchRef.current;
      let best: string | null = null, bd = Infinity;
      for (const s of u.stars) {
        if (m && !m.has(s.key)) continue;
        tmp.copy(s.pos).project(camera);
        if (tmp.z > 1) continue;
        const x = ((tmp.x + 1) / 2) * el.clientWidth, y = ((1 - tmp.y) / 2) * el.clientHeight;
        const d = (x - pointer.current.x) ** 2 + (y - pointer.current.y) ** 2;
        const reach = Math.max(16, (s.size * pixelRef.current) / Math.max(0.5, camera.position.distanceTo(s.pos)) / 2);
        if (d < reach * reach && d < bd) [bd, best] = [d, s.key];
      }
      return best;
    };
    const move = (e: PointerEvent) => {
      local(e);
      pointer.current.inside = true;
      if (e.buttons) return; // orbiting: no picking
      const k = nearest();
      if (k && k !== hoverRef.current) handlers.current.onHover(k);
    };
    const down = (e: PointerEvent) => {
      local(e);
      pointer.current.downX = pointer.current.x;
      pointer.current.downY = pointer.current.y;
    };
    const click = (e: MouseEvent) => {
      // A drag (orbit) is not a click.
      if (Math.hypot(pointer.current.x - pointer.current.downX, pointer.current.y - pointer.current.downY) > 5) return;
      local(e);
      const k = nearest();
      if (k) handlers.current.onOpen(k);
      else handlers.current.onHover(null); // a click on empty space releases the lock
    };
    const leave = () => (pointer.current.inside = false);
    // The page scrolls past the view: zoom only with Ctrl/⌘ held (any wheel in full screen). The controls listen on
    // the outer element, which also holds the cards and labels, so the switch sits there (capture: it runs first).
    const parent = surface ?? el.parentElement;
    const wheel = (e: WheelEvent) => {
      if (controls.current) controls.current.enableZoom = full || e.ctrlKey || e.metaKey;
    };
    // Touch zoom (two fingers) is always on.
    const touchDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" && controls.current) controls.current.enableZoom = true;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", down);
    el.addEventListener("click", click);
    el.addEventListener("pointerleave", leave);
    parent?.addEventListener("wheel", wheel, { capture: true });
    parent?.addEventListener("pointerdown", touchDown, { capture: true });
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("click", click);
      el.removeEventListener("pointerleave", leave);
      parent?.removeEventListener("wheel", wheel, { capture: true });
      parent?.removeEventListener("pointerdown", touchDown, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera, u, reduced, full, surface]);
  // Touch: one finger scrolls the page, two fingers orbit and zoom (in full screen, one finger orbits).
  React.useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.touches = full ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN } : { ONE: -1 as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE };
    // The browser combines touch-action down the tree, so it must be set where the controls set theirs.
    for (const el of [surface, gl.domElement]) if (el) el.style.touchAction = full ? "none" : "pan-y";
  }, [full, gl, surface]);

  // ---- camera flights: only when the destination really changes (not on every keystroke) ----
  const flight = React.useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; at: number; dur: number } | null>(null);
  const dest = focus ? `${focus.center.toArray().map((v) => v.toFixed(1)).join(",")}|${focus.dist}` : "home";
  React.useEffect(() => {
    // A search that matches nothing for a moment (a typo) keeps the camera where it is.
    if (matching && !matching.size && !activeTopic) return;
    const go = () => {
      const c = controls.current;
      if (!c) return;
      const t1 = focus ? focus.center.clone() : new THREE.Vector3();
      const dir = camera.position.clone().sub(c.target).normalize();
      const p1 = t1.clone().add(dir.multiplyScalar(focus ? focus.dist : 34));
      flight.current = { p0: camera.position.clone(), p1, t0: c.target.clone(), t1, at: performance.now(), dur: reduced ? 0 : 1400 };
      invalidate();
    };
    // A search's centre moves as it is typed: wait for the typing to settle.
    const t = window.setTimeout(go, focus?.search ? 350 : 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest]);

  // ---- halo: a focus's posts round its cluster, in the plane facing the camera ----
  const halo = React.useMemo(() => {
    if (!focus) return null;
    const n = focus.keys.length;
    const ppu = size.height / 2 / (focus.dist * TAN_HALF_FOV); // pixels per world unit at the focus distance
    // A grid round the cluster, filled nearest-first (rings in effect); a grid keeps the cards from overlapping.
    for (let card = 112; ; card -= 8) {
      const ch = Math.round(card * 0.66) + (card >= 90 ? 18 : 0);
      // Clear of the cluster (its topic names stay readable) and of the HUD bands at the top and bottom.
      const gx = card * 1.1, gy = ch * 1.14, keep = Math.max(110, Math.min(size.width, size.height) * 0.2);
      const cells: { x: number; y: number; d: number; a: number }[] = [];
      const hw = size.width / 2 - card / 2 - 8;
      const yTop = -size.height / 2 + 84 + ch / 2, yBottom = size.height / 2 - 8 - ch / 2;
      // The telemetry panel (bottom left) and the log (bottom right), in canvas pixels.
      const panels = [
        [0, size.height - 190, 330, size.height],
        [size.width - 230, size.height - 84, size.width, size.height],
      ];
      for (let i = -Math.floor(hw / gx); i <= Math.floor(hw / gx); i++)
        for (let j = Math.ceil(yTop / gy); j <= Math.floor(yBottom / gy); j++) {
          const x = i * gx, y = j * gy;
          const qx = Math.max(Math.abs(x) - card / 2, 0), qy = Math.max(Math.abs(y) - ch / 2, 0);
          if (Math.hypot(qx, qy) < keep) continue;
          const l = size.width / 2 + x - card / 2, r = l + card, tp = size.height / 2 + y - ch / 2, b = tp + ch;
          if (panels.some(([x0, y0, x1, y1]) => l < x1 && r > x0 && tp < y1 && b > y0)) continue;
          cells.push({ x, y, d: Math.hypot(x, y), a: Math.atan2(y, x) });
        }
      if (cells.length >= n || card <= 56) {
        cells.sort((p, q) => p.d - q.d || p.a - q.a);
        return { width: card, slots: cells.slice(0, n).map((c) => [c.x / ppu, -c.y / ppu] as [number, number]) };
      }
    }
  }, [focus, size]);

  // ---- image pop-ups: the posts nearest the camera, beside their stars ----
  const [near, setNear] = React.useState<string[]>([]);
  const nearClock = React.useRef(0);

  // ---- per frame ----
  const pulse = React.useRef<THREE.Mesh>(null);
  const flash = React.useRef<THREE.Mesh>(null);
  const wave = React.useRef<THREE.Mesh>(null);
  const core = React.useRef<THREE.Mesh>(null);
  const lines = React.useRef<THREE.LineSegments>(null);
  const haloRef = React.useRef<THREE.Group>(null);
  const pathPts = React.useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);
  const segs = React.useMemo(() => [0, 0, 0], []);
  useFrame((state, dt) => {
    const t = elapsed();
    mat.uniforms.uTime.value = reduced ? 0 : t;
    mat.uniforms.uIntro.value = reduced ? 0 : 1;
    pixelRef.current = state.viewport.dpr * Math.min(1.4, size.height / 600) * 28;
    mat.uniforms.uPixel.value = pixelRef.current;
    mat.uniforms.uMaxPoint.value = 96 * state.viewport.dpr;
    mat.uniforms.uScale.value = Math.max(0.15, camera.position.distanceTo(controls.current?.target ?? tmp.set(0, 0, 0)) / 34);
    // The field follows the pointer, and fades in and out.
    field.current += ((pointer.current.inside && !reduced && t > IGNITE_AT + 1.5 ? 1 : 0) - field.current) * Math.min(1, dt * 4);
    mat.uniforms.uField.value = field.current;
    ndc.set((pointer.current.x / size.width) * 2 - 1, -(pointer.current.y / size.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    mat.uniforms.uRayO.value.copy(ray.ray.origin);
    mat.uniforms.uRayD.value.copy(ray.ray.direction);
    // Ignition: a flash and a shockwave at the core.
    const it = t - IGNITE_AT;
    if (flash.current) {
      const on = it > 0 && it < 1.2;
      flash.current.visible = on;
      if (on) {
        flash.current.scale.setScalar(0.5 + it * 6);
        (flash.current.material as THREE.MeshBasicMaterial).opacity = Math.exp(-it * 4);
      }
    }
    if (wave.current) {
      const on = it > 0 && it < 2.2;
      wave.current.visible = on;
      if (on) {
        wave.current.scale.setScalar(1 + it * 14);
        (wave.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - it / 2.2);
      }
    }
    if (core.current) core.current.scale.setScalar((reduced ? 1 : t < IGNITE_AT ? 0.4 + 0.25 * Math.sin(t * 9) : 1 + 0.12 * Math.sin(t * 2.4)) * 0.45);
    if (lines.current) (lines.current.material as THREE.LineBasicMaterial).opacity = (reduced ? 1 : Math.min(1, Math.max(0, it - 1.4) / 1.2)) * 0.075;
    // The pulse runs centre > area > topic > star, again and again while a star is locked.
    if (pulse.current) {
      const i = hoverRef.current ? u.starIndex.get(hoverRef.current) : undefined;
      const s = i != null ? u.stars[i] : undefined;
      pulse.current.visible = !!s && s.topic >= 0 && !reduced;
      if (s && s.topic >= 0 && !reduced) {
        pathPts[0].set(0, 0, 0);
        pathPts[1].copy(u.areas[s.area].pos);
        pathPts[2].copy(u.topics[s.topic].pos);
        pathPts[3].copy(s.pos);
        for (let k = 0; k < 3; k++) segs[k] = pathPts[k].distanceTo(pathPts[k + 1]);
        let left = ((state.clock.elapsedTime % 1.4) / 1.4) * (segs[0] + segs[1] + segs[2]);
        let k = 0;
        while (k < 2 && left > segs[k]) left -= segs[k++];
        pulse.current.position.copy(pathPts[k]).lerp(pathPts[k + 1], Math.min(1, left / (segs[k] || 1)));
      }
    }
    // The halo always faces the camera.
    if (haloRef.current) haloRef.current.quaternion.copy(camera.quaternion);
    // Camera flight (the controls update themselves otherwise; updating twice would double the auto-orbit)
    const f = flight.current, c = controls.current;
    if (f && c) {
      const k = f.dur ? Math.min(1, (performance.now() - f.at) / f.dur) : 1;
      const e = ease(k);
      camera.position.lerpVectors(f.p0, f.p1, e);
      c.target.lerpVectors(f.t0, f.t1, e);
      c.update();
      if (k >= 1) flight.current = null;
      else invalidate();
    }
    // The halo's spacing was set for the focus distance: it scales with the camera, so zooming keeps cards apart.
    if (haloRef.current && focus) haloRef.current.scale.setScalar(camera.position.distanceTo(focus.center) / focus.dist);
    // Image pop-ups: every 0.3 s, the nearest posts with an image that are in view, spaced apart on screen.
    nearClock.current += dt;
    if (images && !focus && t > IGNITE_AT + 2.2 && (reduced || nearClock.current > 0.3)) {
      nearClock.current = 0;
      const cand: { key: string; d: number; x: number; y: number }[] = [];
      const m = matchRef.current;
      for (const s of u.stars) {
        if (!s.image || (m && !m.has(s.key))) continue;
        tmp.copy(s.pos).project(camera);
        if (tmp.z > 1 || Math.abs(tmp.x) > 0.9 || Math.abs(tmp.y) > 0.85) continue;
        cand.push({ key: s.key, d: camera.position.distanceTo(s.pos), x: tmp.x * size.width * 0.5, y: tmp.y * size.height * 0.5 });
      }
      cand.sort((a, b) => a.d - b.d);
      const chosen: typeof cand = [];
      for (const c of cand) {
        if (chosen.length >= NEAR_CARDS) break;
        if (chosen.every((o) => Math.abs(o.x - c.x) > 84 || Math.abs(o.y - c.y) > 70)) chosen.push(c);
      }
      const keys = chosen.map((c) => c.key).sort();
      setNear((prev) => (prev.join("|") === keys.join("|") ? prev : keys));
    }
  });
  React.useEffect(() => {
    if (!images || focus) setNear([]);
    invalidate();
  }, [images, focus, invalidate]);

  // ---- lines: centre > areas > topics > stars ----
  const lineGeom = React.useMemo(() => {
    const v: number[] = [];
    for (const a of u.areas) v.push(0, 0, 0, a.pos.x, a.pos.y, a.pos.z);
    for (const t of u.topics) {
      const a = u.areas[t.area].pos;
      v.push(a.x, a.y, a.z, t.pos.x, t.pos.y, t.pos.z);
    }
    for (const s of u.stars) {
      if (s.topic < 0) continue;
      const t = u.topics[s.topic].pos;
      v.push(t.x, t.y, t.z, s.pos.x, s.pos.y, s.pos.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, [u]);
  React.useEffect(() => () => lineGeom.dispose(), [lineGeom]);

  const path = React.useMemo(() => {
    const hi = hover ? u.stars[u.starIndex.get(hover) ?? -1] : undefined;
    return hi && hi.topic >= 0 ? [new THREE.Vector3(), u.areas[hi.area].pos, u.topics[hi.topic].pos, hi.pos] : null;
  }, [hover, u]);
  const hiStar = hover ? u.stars[u.starIndex.get(hover) ?? -1] : undefined;
  const activeNode = activeTopic ? getTopic(activeTopic) : undefined;
  const activeArea = activeNode ? (activeNode.level === 1 ? activeNode.id : activeNode.level === 2 ? activeNode.parent : getTopic(activeNode.parent ?? "")?.parent) : null;
  // Topic names: the locked star's, the focused topic's and, in a sector focus, its six biggest (more would collide).
  const showTopicLabels = new Set<number>();
  if (hiStar && hiStar.topic >= 0) showTopicLabels.add(hiStar.topic);
  if (activeNode && activeNode.level >= 2) {
    const tid = activeNode.level === 3 ? activeNode.parent! : activeNode.id;
    if (u.topicIndex.has(tid)) showTopicLabels.add(u.topicIndex.get(tid)!);
  }
  if (activeNode?.level === 1)
    u.topics
      .map((t, i) => ({ t, i }))
      .filter((x) => u.areas[x.t.area].id === activeArea)
      .sort((a, b) => b.t.count - a.t.count)
      .slice(0, 6)
      .forEach((x) => showTopicLabels.add(x.i));

  return (
    <>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom={full} enableDamping dampingFactor={0.08} minDistance={3} maxDistance={70} autoRotate={orbit && !focus} autoRotateSpeed={0.35} />
      <points geometry={geom} material={mat} frustumCulled={false} />
      <lineSegments ref={lines} geometry={lineGeom} frustumCulled={false}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.075} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {/* the core: me */}
      <mesh ref={core}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={wave} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1, 96]} />
        <meshBasicMaterial color={RADIUM} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {path && <Line points={path} color={RADIUM} lineWidth={2} transparent opacity={0.9} toneMapped={false} />}
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={RADIUM} toneMapped={false} />
      </mesh>

      {/* sector (area) names: buttons that fly there; keyed by the ignition, so a replay fades them in again */}
      {u.areas.map((a) => (
        <Html key={`${a.id}-${igniteKey}`} position={a.pos} center zIndexRange={[30, 20]}>
          <button
            type="button"
            onClick={() => onPick(activeTopic === a.id ? null : a.id)}
            title={`${a.label}: ${a.count} posts`}
            aria-label={`${a.label}: ${a.count} posts`}
            className={`whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              activeArea === a.id ? "text-[#36ffb0]" : "text-white/80 hover:text-[#36ffb0]"
            }`}
            style={{ textShadow: "0 0 8px rgba(0,0,0,.9)", animation: reduced ? undefined : `liFade 600ms ${IGNITE_AT + 1.6}s both` }}
          >
            {SHORT[a.id] ?? a.label} · {a.count}
          </button>
        </Html>
      ))}
      {u.topics.map((t, i) =>
        showTopicLabels.has(i) ? (
          <Html key={t.id} position={t.pos} center zIndexRange={[29, 20]}>
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className={`whitespace-nowrap font-mono text-[10px] tracking-[0.08em] ${activeTopic === t.id ? "text-[#36ffb0]" : "text-white/75 hover:text-[#36ffb0]"}`}
              style={{ textShadow: "0 0 8px rgba(0,0,0,.95)", transform: "translateY(-14px)" }}
            >
              {t.label} · {t.count}
            </button>
          </Html>
        ) : null,
      )}

      {/* image pop-ups beside the nearest stars */}
      {near.map((key) => {
        const s = u.stars[u.starIndex.get(key) ?? -1];
        const e = entryByKey.get(key);
        if (!s || !e) return null;
        return (
          <Html key={`n-${key}`} position={s.pos} zIndexRange={[15, 0]} style={{ transform: "translate(10px, -100%)" }}>
            <Card entry={e} on={hover === key} width={76} delay={0} reduced={reduced} onHover={onHover} onOpen={onOpen} tabbable={false} />
          </Html>
        );
      })}

      {/* the focus: its posts as a halo round the cluster, facing the camera */}
      {focus && halo && (
        <group ref={haloRef} position={focus.center}>
          {focus.keys.map((key, i) => {
            const e = entryByKey.get(key);
            const slot = halo.slots[i];
            if (!e || !slot) return null;
            return (
              <Html key={key} position={[slot[0], slot[1], 0]} center zIndexRange={[18, 0]}>
                <Card entry={e} on={hover === key} width={halo.width} delay={Math.min(1.1, i * 0.018)} reduced={reduced} onHover={onHover} onOpen={onOpen} />
              </Html>
            );
          })}
        </group>
      )}
      <Html position={[0, 0, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <style>{`@keyframes liFade{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}@keyframes liPop{0%{opacity:0;transform:scale(.2)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}`}</style>
      </Html>
    </>
  );
}
