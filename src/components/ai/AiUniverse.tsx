"use client";
import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useRouter } from "next/navigation";
import { useWebGL } from "@/lib/webgl";
import { useTheme } from "@/components/theme/ThemeProvider";
import { nodes as ALL_NODES, getNode, groupOf, LAYERS, membersOf, NODE_TYPE_META, type AiNode, type NodeType } from "@/data/aiOntology";
import { AI_DEAL_EDGES, AI_INTEL, type IntelDealEdge } from "@/data/aiIntel";
import { AI_LOGO_IDS, logoUrl } from "@/data/aiLogos";
import {
  ALL_CATS,
  CAT_COLOR,
  CATS,
  DEAL_NODES,
  DEGREE,
  EDGES,
  EDGES_OF,
  INSTRUMENT_LABEL,
  LAYER_LIGHT,
  MONEY_INSTRUMENTS,
  compareEntities,
  dayMonthYear,
  dealKey,
  dealShort,
  dealsOf,
  moneyRunsFromTo,
  periodLabel,
  reach,
  scopeOf,
  seriesValue,
  shortestPath,
  type AiScope,
  type Analysis,
  type Cat,
  type Edge,
} from "./intelModel";
import { Dossier, SearchBox } from "./IntelDossier";

/**
 * The AI Universe: the AI economy as a 3D space to fly through, styled as mission control.
 *   Galaxy    each layer of the stack is a cluster (labs at the top, power and capital at the bottom), each entity
 *             type a nebula inside it, each entity a star in its layer's colour, bigger with more links
 *   Lock      hovering a star locks the telemetry on it; a click opens its dossier (numbers first, every deal with
 *             the source's own words) and draws its links; a double click opens its page
 *   Money     the deals from filings as arcs between the parties, as thick as the amount, with dots running the way
 *             the money runs
 *   Ask       who is exposed if it fails, what it depends on, how two entities connect, and what two share, in 3D
 *   Index     the panel lists layers, then types, then entities, with links, deals and chokepoints
 * One draw call for the stars (THREE.Points, custom shader); labels are HTML in 3D. The page scrolls past it: zoom is
 * Ctrl/⌘ + scroll (any scroll in full screen); on touch one finger turns it sideways and two fingers zoom. Rendering
 * stops off screen. Reduced motion: no countdown, burst, drift or auto-orbit, and the camera jumps instead of flying.
 */

interface Props {
  scope: AiScope;
  onScope: (s: AiScope) => void;
  /** Shown instead of the view where the browser cannot draw 3D (WebGL off). */
  fallback?: React.ReactNode;
}

const RADIUM = "#36ffb0";
/** The accent on white: the same green, dark enough to read (about 5:1 on white). */
const RADIUM_ON_LIGHT = "#0a7d50";
const RISK: [string, string] = ["#f87171", "#b91c1c"];
const IGNITE_AT = 2.4;
/** Seconds into the show by which every star has landed: the galaxy opens at this point, already formed. */
const SETTLED = IGNITE_AT + 6;
const AREA_R = 12.5;
/** The layout's turn about the vertical axis (radians): chosen to keep the clusters' centres furthest apart on screen from the opening camera. */
const THETA0 = 2.7;
/** The galaxy's reach from the centre (the furthest star plus a label), for fitting the home view. */
const GALAXY_R = 16.5;
/** The camera distance at which the whole galaxy fits the view with a margin, for the view's aspect and a 50° fov. */
const fitDistance = (aspect: number) => Math.max(30, (GALAXY_R / 0.86) / (Math.tan((25 * Math.PI) / 180) * Math.min(1, aspect)));
const PANEL_W = 380;
/** Below this width of the view, the panel sits under it instead of over its right side. */
const WIDE = 960;
/** Dots running along each money arc. */
const FLOW_PER = 3;
/** Cards: at most this many at once, the entities nearest the camera. */
const NEAR_CARDS = 18;
const CARD_W = 172;
/** Entities that get a card: those with a site icon or a company file. */
const CARD_IDS = new Set([...AI_LOGO_IDS, ...Object.entries(AI_INTEL).filter(([, v]) => v.series.length).map(([k]) => k)]);
/** One figure for a card, the first that the company file has. */
const FIGURE_ORDER = ["revenue_usd", "post_money_valuation_usd", "funding_round_committed_capital_usd", "capital_raised_total_usd", "customers_100k_ttm"];
const headlineFigure = (id: string): string | null => {
  const intel = AI_INTEL[id];
  if (!intel) return null;
  for (const m of FIGURE_ORDER) {
    const s = intel.series.find((x) => x.metric === m);
    const p = s?.points[s.points.length - 1];
    if (s && p) return `${s.label.replace(/\s*\((more than|approximately)\)$/, "").replace(/^Customers with.*$/, "Customers at $100K+")} ${seriesValue(s, p.value)} · ${periodLabel(p.period)}`;
  }
  return null;
};
const initials = (name: string) =>
  name
    .replace(/\s*\([^)]*\)\s*$/, "")
    .split(/[\s/-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

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

const CHOKE_IDS = new Set(ALL_NODES.filter((n) => n.chokepoint).map((n) => n.id));
const TYPE_COUNT = new Set(ALL_NODES.map((n) => n.type)).size;
const AS_OF = Object.values(AI_INTEL)
  .map((x) => x.asOf)
  .filter((x): x is string => !!x)
  .sort()
  .pop() ?? null;
const byDegree = (a: string, b: string) => (DEGREE.get(b) ?? 0) - (DEGREE.get(a) ?? 0) || a.localeCompare(b);
const layerColor = (layer: number, light: boolean) => (light ? LAYER_LIGHT[layer] : LAYERS[layer].color);
/** A label's name: without a trailing parenthesis ("TSMC (Taiwan Semiconductor ...)" > "TSMC"); the panel shows the full name. */
const shortName = (id: string) => {
  const name = getNode(id)?.name ?? id;
  const s = name.replace(/\s*\([^)]*\)\s*$/, "");
  return s.length >= 2 ? s : name;
};

// ---------------------------------------------------------------------------
// The ticker: the headline figures and the biggest deals, from the company files
// ---------------------------------------------------------------------------

const TICKER_METRICS: [string, string][] = [
  ["revenue_usd", "revenue"],
  ["revenue_quarter_usd", "quarterly revenue"],
  ["net_revenue_retention_pct", "net revenue retention"],
  ["customers_100k_ttm", "customers at $100K+"],
  ["adjusted_operating_margin_pct", "adjusted operating margin"],
  ["post_money_valuation_usd", "post-money valuation"],
  ["funding_round_committed_capital_usd", "round, committed"],
  ["capital_raised_total_usd", "capital raised to date"],
  ["cash_and_equivalents_usd", "cash"],
];
interface TickerItem { id: string; name: string; what: string; value: string; deal: boolean }
const TICKER: TickerItem[] = (() => {
  const nm = (id: string) => getNode(id)?.name ?? id;
  const items: TickerItem[] = [];
  for (const [metric, what] of TICKER_METRICS)
    for (const [id, intel] of Object.entries(AI_INTEL)) {
      const s = intel.series.find((x) => x.metric === metric);
      const p = s?.points[s.points.length - 1];
      if (s && p) items.push({ id, name: nm(id), what: `${what} · ${periodLabel(p.period)}`, value: seriesValue(s, p.value), deal: false });
    }
  for (const d of AI_DEAL_EDGES) {
    if (d.amount == null) continue;
    const id = AI_INTEL[d.from]?.series.length ? d.from : AI_INTEL[d.to]?.series.length ? d.to : d.from;
    items.push({ id, name: `${nm(d.from)} → ${nm(d.to)}`, what: INSTRUMENT_LABEL[d.instrument] ?? d.instrument.replace(/_/g, " "), value: dealShort(d), deal: true });
  }
  return items;
})();

function Ticker({ onPick, reduced }: { onPick: (id: string) => void; reduced: boolean }) {
  if (!TICKER.length) return null;
  const row = (copy: number) => (
    <ul className="flex shrink-0" aria-hidden={copy === 1 ? true : undefined}>
      {TICKER.map((it, i) => (
        <li key={i} className="border-r border-border">
          <button
            type="button"
            tabIndex={copy === 1 ? -1 : 0}
            onClick={() => onPick(it.id)}
            className="flex items-baseline gap-2 whitespace-nowrap px-3 py-1.5 hover:bg-foreground/[0.06] focus-visible:outline-offset-[-2px]"
          >
            <span className="font-bold text-foreground">{it.name}</span>
            <span className="text-muted-foreground">{it.what}</span>
            <span className={`font-bold ${it.deal ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>{it.value}</span>
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={`group mb-2 border border-border bg-background font-mono text-[10px] uppercase tracking-[0.12em] ${reduced ? "overflow-x-auto" : "overflow-hidden"}`}
      data-testid="ai-universe-ticker"
      aria-label="Headline figures and the largest deals from filings"
      role="region"
    >
      <div className={`flex w-max ${reduced ? "" : "animate-[aiTicker_90s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"}`}>
        {row(0)}
        {!reduced && row(1)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The universe: layers as clusters, types as nebulae, entities as stars
// ---------------------------------------------------------------------------

interface UArea { layer: number; pos: THREE.Vector3; ids: string[]; links: number; deals: number; choke: number; extent: number }
interface UType { key: string; type: NodeType; label: string; area: number; pos: THREE.Vector3; ids: string[]; links: number; choke: number; spread: number }
interface UStar { id: string; pos: THREE.Vector3; size: number; type: number; area: number; delay: number; seed: number }

const linksTouching = (ids: Set<string>) => {
  const seen = new Set<Edge>();
  for (const id of ids) for (const e of EDGES_OF.get(id) ?? []) seen.add(e);
  return seen.size;
};

function buildAiUniverse() {
  const rand = seeded(455);
  const maxDeg = Math.max(1, ...DEGREE.values());
  const areas: UArea[] = [];
  const types: UType[] = [];
  const stars: UStar[] = [];
  const n = LAYERS.length;
  LAYERS.forEach((L, i) => {
    // Layers on a flattened Fibonacci sphere, in stack order: the labs at the top, power and capital at the bottom.
    // Turned by THETA0 so that, from the opening camera, no cluster sits in front of another or of the core.
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n), theta = Math.PI * (1 + Math.sqrt(5)) * i + THETA0;
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.6, Math.sin(phi) * Math.sin(theta)).normalize();
    const apos = dir.clone().multiplyScalar(AREA_R);
    const members = ALL_NODES.filter((x) => x.layer === L.id);
    const idSet = new Set(members.map((x) => x.id));
    areas.push({
      layer: L.id,
      pos: apos,
      ids: [...idSet],
      links: linksTouching(idSet),
      deals: AI_DEAL_EDGES.filter((d) => idSet.has(d.from) || idSet.has(d.to)).length,
      choke: members.filter((x) => x.chokepoint).length,
      extent: 1,
    });
    const groups = new Map<NodeType, AiNode[]>();
    for (const x of members) (groups.get(x.type) ?? groups.set(x.type, []).get(x.type)!).push(x);
    const list = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const m = list.length;
    list.forEach(([type, ns], j) => {
      const p2 = Math.acos(1 - (2 * (j + 0.5)) / m), th2 = Math.PI * (1 + Math.sqrt(5)) * j + i;
      const off = new THREE.Vector3(Math.sin(p2) * Math.cos(th2), Math.cos(p2), Math.sin(p2) * Math.sin(th2)).add(dir.clone().multiplyScalar(0.9)).normalize();
      const tpos = apos.clone().add(off.multiplyScalar(m === 1 ? 0 : 2.3 + Math.sqrt(m) * 0.45));
      const spread = 0.45 + Math.sqrt(ns.length) * 0.12;
      const tIds = new Set(ns.map((x) => x.id));
      const ti = types.length;
      types.push({ key: `${L.id}:${type}`, type, label: NODE_TYPE_META[type].label, area: i, pos: tpos, ids: [...tIds], links: linksTouching(tIds), choke: ns.filter((x) => x.chokepoint).length, spread });
      // The best-connected sit at the nebula's heart; the rest scatter outwards.
      ns.slice()
        .sort((a, b) => byDegree(a.id, b.id))
        .forEach((x, k) => {
          const r = spread * (0.3 + 0.7 * Math.sqrt((k + 0.5) / ns.length)) * (0.75 + rand() * 0.5);
          const pos = tpos.clone().add(new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).normalize().multiplyScalar(r));
          const deg = DEGREE.get(x.id) ?? 0;
          stars.push({
            id: x.id,
            pos,
            size: 6 + 26 * Math.sqrt(deg / maxDeg) + (DEAL_NODES.has(x.id) ? 4 : 0),
            type: ti,
            area: i,
            delay: (pos.length() / 18) * 0.5 + rand() * 0.45,
            seed: rand(),
          });
        });
    });
  });
  for (const s of stars) areas[s.area].extent = Math.max(areas[s.area].extent, s.pos.distanceTo(areas[s.area].pos));
  return {
    areas,
    types,
    stars,
    starIndex: new Map(stars.map((s, k) => [s.id, k])),
    typeIndex: new Map(types.map((t, k) => [t.key, k])),
  };
}
type Uni = ReturnType<typeof buildAiUniverse>;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uIntro;
uniform vec3 uRayO;
uniform vec3 uRayD;
uniform float uField;
uniform float uScale;
uniform float uPixel;
uniform float uMaxPoint;
uniform float uSizeK;
attribute float aDelay;
attribute float aSize;
attribute float aMatch;
attribute float aHot;
attribute float aSeed;
attribute float aChoke;
attribute vec3 aColor;
varying float vAlpha;
varying float vHot;
varying float vChoke;
varying vec3 vColor;
void main() {
  float k = uIntro > 0.5 ? clamp((uTime - ${IGNITE_AT.toFixed(2)} - aDelay) / 1.3, 0.0, 1.0) : 1.0;
  k = k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0;
  vec3 p = position * k;
  p += 0.04 * vec3(sin(uTime * 0.7 + aSeed * 6.28), cos(uTime * 0.6 + aSeed * 4.0), sin(uTime * 0.5 + aSeed * 9.0)) * uIntro;
  // The field: a ripple round the pointer's ray, sized to the view (uScale = camera distance / 34). The star right on
  // the ray, and the locked star, stay put, so the one under the cursor can always be locked.
  vec3 w = p - uRayO;
  vec3 c = uRayO + uRayD * dot(w, uRayD);
  vec3 d = p - c;
  float dn = length(d) / uScale;
  float f = exp(-dn * dn / 2.4) * smoothstep(0.15, 0.8, dn) * (1.0 - aHot);
  p += (d / max(length(d), 1e-3)) * uField * 1.1 * uScale * f;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(aSize * uSizeK * (1.0 + aHot * 1.4) * (0.4 + 0.6 * aMatch) * uPixel / -mv.z, uMaxPoint);
  vAlpha = (0.14 + 0.86 * aMatch) * (k > 0.0 ? 1.0 : 0.0) * smoothstep(0.4, 2.5, -mv.z);
  vHot = aHot;
  vChoke = aChoke;
  vColor = aColor;
}`;
const FRAG = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uRisk;
uniform float uBoost;
uniform float uCrisp;
uniform float uChoke;
varying float vAlpha;
varying float vHot;
varying float vChoke;
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  vec3 col = mix(mix(vColor, uRisk, vChoke * uChoke), uAccent, vHot);
  float shape;
  if (uCrisp > 0.5) {
    // Light: a crisp dot, like a plotted point.
    shape = 1.0 - smoothstep(0.34, 0.42, r);
  } else {
    // Dark: a soft glow with a white-hot centre (bloom finishes it).
    shape = pow(core, 2.4) * 0.9 + core * 0.12;
    col = mix(col, vec3(1.0), pow(core, 7.0) * 0.6);
  }
  gl_FragColor = vec4(col, min(1.0, vAlpha * uBoost * shape));
  #include <colorspace_fragment>
}`;
/** The dots that run along the money arcs. */
const FLOW_VERT = /* glsl */ `
uniform float uSize;
attribute vec3 aColor;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize / -mv.z, 2.0, 16.0);
  vColor = aColor;
}`;
const FLOW_FRAG = /* glsl */ `
uniform float uCrisp;
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  float a = uCrisp > 0.5 ? 1.0 - smoothstep(0.36, 0.46, r) : pow(core, 1.5);
  vec3 col = uCrisp > 0.5 ? vColor : mix(vColor, vec3(1.0), pow(core, 4.0) * 0.7);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

/** A soft round glow, for the nebula haze behind each layer. */
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.35, "rgba(255,255,255,0.3)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A money arc: a curve that bows away from the centre, so arcs between near neighbours still read. */
function arcPoints(a: THREE.Vector3, b: THREE.Vector3, lift: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const span = a.distanceTo(b);
  const out = mid.lengthSq() > 1e-4 ? mid.clone().normalize() : new THREE.Vector3(0, 1, 0);
  const ctrl = mid.clone().add(out.multiplyScalar(span * 0.3 + lift)).add(new THREE.Vector3(0, span * 0.12 + lift * 0.5, 0));
  return new THREE.QuadraticBezierCurve3(a.clone(), ctrl, b.clone()).getPoints(32);
}

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------

interface Fly { center: THREE.Vector3; dist: number; key: string; outward?: boolean }
interface SceneProps {
  u: Uni;
  igniteKey: number;
  /** Play the ignition show; otherwise the galaxy starts formed. */
  play: boolean;
  reduced: boolean;
  light: boolean;
  accent: string;
  match: Set<string> | null;
  hover: string | null;
  /** Stars drawn hot (accent): the selection, the second entity, a path's end. */
  hot: string[];
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
  onArea: (layer: number | null) => void;
  onType: (key: string | null) => void;
  focusArea: number | null;
  focusType: string | null;
  links: Edge[];
  /** Where links are drawn from (they grow out of it). */
  origin: string | null;
  path: string[] | null;
  deals: IntelDealEdge[];
  labels: string[];
  fly: Fly;
  orbit: boolean;
  full: boolean;
  choke: boolean;
  /** Analysing: the pointer's ripple stops, so lines and labels stay on their stars. */
  calm: boolean;
  /** The panel over the view's right side, in pixels: the galaxy centres in the open part. */
  panelPx: number;
  cards: boolean;
  maxCards: number;
  /** Entities to favour for cards: the selection's own group. */
  favoured: Set<string>;
}

/** A card beside a star: the entity's icon, name and one figure from its file. */
const Card = React.memo(function Card({
  id,
  on,
  delay,
  reduced,
  light,
  onHover,
  onSelect,
  onOpen,
}: {
  id: string;
  on: boolean;
  delay: number;
  reduced: boolean;
  light: boolean;
  onHover: (id: string) => void;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const n = getNode(id);
  if (!n) return null;
  const logo = logoUrl(id);
  const fig = headlineFigure(id);
  return (
    <button
      type="button"
      tabIndex={-1}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(id)}
      onClick={() => onSelect(id)}
      onDoubleClick={() => onOpen(id)}
      aria-label={n.name}
      className={`flex items-center gap-2 border bg-background/95 px-1.5 py-1 text-left transition-[transform,border-color] duration-200 ${
        on ? "scale-105 border-[color:var(--uni-a)]" : "border-border hover:scale-105 hover:border-foreground"
      }`}
      style={{ width: CARD_W, animation: reduced ? undefined : `aiPop 520ms cubic-bezier(.2,1.4,.4,1) ${delay}s both` }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 bg-white object-contain p-0.5" loading="lazy" draggable={false} />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center font-mono text-[11px] font-bold text-black" style={{ background: layerColor(n.layer, light) }} aria-hidden="true">
          {initials(n.name)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-mono text-[10px] font-bold leading-tight text-foreground">{shortName(id)}</span>
        <span className="block truncate font-mono text-[9px] leading-tight text-muted-foreground">{fig ?? `${NODE_TYPE_META[n.type].label} · ${DEGREE.get(id) ?? 0} links`}</span>
      </span>
    </button>
  );
});

function Scene({
  u,
  igniteKey,
  play,
  reduced,
  light,
  accent,
  match,
  hover,
  hot,
  onHover,
  onSelect,
  onOpen,
  onArea,
  onType,
  focusArea,
  focusType,
  links,
  origin,
  path,
  deals,
  labels,
  fly,
  orbit,
  full,
  choke,
  calm,
  panelPx,
  cards,
  maxCards,
  favoured,
}: SceneProps) {
  const { camera, size, gl, invalidate } = useThree();
  /** The element the controls listen on (R3F's outer div): touch and wheel handling must sit there. */
  const surface = useThree((st) => st.events.connected) as HTMLElement | undefined;
  const controls = React.useRef<OrbitControlsImpl>(null);
  const ci = light ? 1 : 0;
  // The show's clock: from zero when Ignite plays it, otherwise already past the burst (every star landed).
  const start = React.useRef(performance.now() - (play ? 0 : SETTLED * 1000));
  React.useEffect(() => {
    start.current = performance.now() - (play ? 0 : SETTLED * 1000);
    invalidate();
  }, [igniteKey, play, invalidate]);
  const elapsed = () => (reduced ? 999 : (performance.now() - start.current) / 1000);

  // The panel covers the right of the view: shift the projection's centre left by half its width (a wider virtual
  // frame, of which the canvas shows the left part), so the galaxy sits in the middle of what can be seen.
  // The HUD takes the top-left corner: the frame also gets a band above the canvas, so the scene sits a little lower.
  React.useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    const P = Math.min(panelPx, size.width * 0.45);
    const T = size.height >= 500 ? 72 : 0;
    c.aspect = (size.width + P) / (size.height + T);
    if (P > 0 || T > 0) c.setViewOffset(size.width + P, size.height + T, P, 0, size.width, size.height);
    else c.clearViewOffset();
    c.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, panelPx, invalidate]);

  // ---- stars ----
  const geom = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = u.stars.length;
    const pos = new Float32Array(n * 3), delay = new Float32Array(n), sz = new Float32Array(n), seed = new Float32Array(n), chk = new Float32Array(n);
    u.stars.forEach((s, i) => {
      pos.set([s.pos.x, s.pos.y, s.pos.z], i * 3);
      delay[i] = s.delay;
      sz[i] = s.size;
      seed[i] = s.seed;
      chk[i] = CHOKE_IDS.has(s.id) ? 1 : 0;
    });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aChoke", new THREE.BufferAttribute(chk, 1));
    g.setAttribute("aMatch", new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    g.setAttribute("aHot", new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
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
          uAccent: { value: new THREE.Color(RADIUM) },
          uRisk: { value: new THREE.Color(RISK[0]) },
          uBoost: { value: 1 },
          uCrisp: { value: 0 },
          uSizeK: { value: 1 },
          uChoke: { value: 0 },
        },
      }),
    [],
  );
  React.useEffect(() => () => (geom.dispose(), mat.dispose()), [geom, mat]);
  React.useEffect(() => {
    const a = geom.getAttribute("aColor") as THREE.BufferAttribute;
    const c = new THREE.Color();
    u.stars.forEach((s, i) => {
      c.set(layerColor(s.area, light));
      a.setXYZ(i, c.r, c.g, c.b);
    });
    a.needsUpdate = true;
    mat.uniforms.uAccent.value.set(accent);
    mat.uniforms.uRisk.value.set(RISK[light ? 1 : 0]);
    mat.uniforms.uBoost.value = light ? 0.9 : 1;
    mat.uniforms.uCrisp.value = light ? 1 : 0;
    mat.uniforms.uSizeK.value = light ? 0.55 : 1;
    mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    mat.needsUpdate = true;
    invalidate();
  }, [light, accent, geom, mat, u, invalidate]);
  React.useEffect(() => {
    mat.uniforms.uChoke.value = choke ? 1 : 0;
    invalidate();
  }, [choke, mat, invalidate]);
  const ink = light ? "#141414" : "#ffffff";
  const blend = light ? THREE.NormalBlending : THREE.AdditiveBlending;
  const matchRef = React.useRef(match);
  matchRef.current = match;
  React.useEffect(() => {
    const a = geom.getAttribute("aMatch") as THREE.BufferAttribute;
    u.stars.forEach((s, i) => (a.array[i] = !match || match.has(s.id) ? 1 : 0));
    a.needsUpdate = true;
    invalidate();
  }, [match, geom, u, invalidate]);
  const hotKey = [hover, ...hot].join("|");
  React.useEffect(() => {
    const a = geom.getAttribute("aHot") as THREE.BufferAttribute;
    (a.array as Float32Array).fill(0);
    for (const id of [hover, ...hot]) {
      const i = id ? u.starIndex.get(id) : undefined;
      if (i != null) a.array[i] = 1;
    }
    a.needsUpdate = true;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotKey, geom, u, invalidate]);

  // ---- the cursor's field, and picking ----
  const pointer = React.useRef({ x: 0, y: 0, inside: false, downX: 0, downY: 0 });
  const field = React.useRef(0);
  const ray = React.useMemo(() => new THREE.Raycaster(), []);
  const ndc = React.useMemo(() => new THREE.Vector2(), []);
  const tmp = React.useMemo(() => new THREE.Vector3(), []);
  const hoverRef = React.useRef(hover);
  hoverRef.current = hover;
  const handlers = React.useRef({ onHover, onSelect, onOpen });
  handlers.current = { onHover, onSelect, onOpen };
  const pixelRef = React.useRef(28);
  React.useEffect(() => {
    const el = gl.domElement;
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = e.clientX - r.left;
      pointer.current.y = e.clientY - r.top;
    };
    /** The star under the pointer: within its drawn size (at least 14 px). Lit stars win over dimmed ones, which
     * need the pointer closer. */
    const nearest = () => {
      if (elapsed() < IGNITE_AT + 2) return null;
      const m = matchRef.current;
      let best: string | null = null, bd = Infinity;
      for (const s of u.stars) {
        tmp.copy(s.pos).project(camera);
        if (tmp.z > 1) continue;
        const x = ((tmp.x + 1) / 2) * el.clientWidth, y = ((1 - tmp.y) / 2) * el.clientHeight;
        const lit = !m || m.has(s.id);
        const d = ((x - pointer.current.x) ** 2 + (y - pointer.current.y) ** 2) * (lit ? 1 : 4);
        const reach = Math.max(14, (s.size * pixelRef.current) / Math.max(0.5, camera.position.distanceTo(s.pos)) / 2);
        if (d < reach * reach && d < bd) [bd, best] = [d, s.id];
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
      handlers.current.onSelect(k);
      if (!k) handlers.current.onHover(null);
    };
    const dbl = (e: MouseEvent) => {
      local(e);
      const k = nearest();
      if (k) handlers.current.onOpen(k);
    };
    const leave = () => (pointer.current.inside = false);
    // The page scrolls past the view: zoom only with Ctrl/⌘ held (any wheel in full screen). The controls listen on
    // the outer element, which also holds the labels, so the switch sits there (capture: it runs first).
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
    el.addEventListener("dblclick", dbl);
    el.addEventListener("pointerleave", leave);
    parent?.addEventListener("wheel", wheel, { capture: true });
    parent?.addEventListener("pointerdown", touchDown, { capture: true });
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("click", click);
      el.removeEventListener("dblclick", dbl);
      el.removeEventListener("pointerleave", leave);
      parent?.removeEventListener("wheel", wheel, { capture: true });
      parent?.removeEventListener("pointerdown", touchDown, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera, u, reduced, full, surface]);
  // Touch: one finger turns the graph. On the page, touch-action pan-y keeps vertical swipes for scrolling, so a
  // sideways drag turns it and an up-down swipe still scrolls past it; two fingers orbit and zoom. In full screen one
  // finger orbits freely.
  React.useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.touches = full ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN } : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    for (const el of [surface, gl.domElement]) if (el) el.style.touchAction = full ? "none" : "pan-y";
  }, [full, gl, surface]);

  // ---- camera flights: only when the destination changes ----
  const flight = React.useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; at: number; dur: number } | null>(null);
  const lastFly = React.useRef("");
  React.useEffect(() => {
    if (fly.key === lastFly.current) return;
    const first = !lastFly.current;
    lastFly.current = fly.key;
    const c = controls.current;
    if (!c) return;
    const dir = camera.position.clone().sub(c.target).normalize();
    const t1 = fly.center.clone();
    // Looking at a cluster from inside the galaxy, the view is a tangle: come round to its outside.
    if (fly.outward && t1.lengthSq() > 4) {
      const out = t1.clone().normalize();
      if (dir.dot(out) < 0.35) dir.copy(out.multiplyScalar(0.7).add(dir.multiplyScalar(0.3)).normalize());
    }
    flight.current = { p0: camera.position.clone(), p1: t1.clone().add(dir.multiplyScalar(fly.dist)), t0: c.target.clone(), t1, at: performance.now(), dur: reduced || first ? 0 : 1300 };
    invalidate();
  }, [fly, camera, reduced, invalidate]);

  // ---- lines: centre > layers > types > stars ----
  const lineGeom = React.useMemo(() => {
    const v: number[] = [];
    for (const a of u.areas) v.push(0, 0, 0, a.pos.x, a.pos.y, a.pos.z);
    for (const t of u.types) {
      const a = u.areas[t.area].pos;
      v.push(a.x, a.y, a.z, t.pos.x, t.pos.y, t.pos.z);
    }
    for (const s of u.stars) {
      const t = u.types[s.type].pos;
      v.push(t.x, t.y, t.z, s.pos.x, s.pos.y, s.pos.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, [u]);
  React.useEffect(() => () => lineGeom.dispose(), [lineGeom]);

  // ---- the links being read: they grow out of the selection ----
  const linkEnds = React.useMemo(
    () =>
      links
        .map((e) => {
          const a = u.starIndex.get(e.from), b = u.starIndex.get(e.to);
          if (a == null || b == null) return null;
          const p = u.stars[a].pos, q = u.stars[b].pos;
          return e.to === origin ? { o: q, t: p, cat: e.cat } : { o: p, t: q, cat: e.cat };
        })
        .filter((x): x is { o: THREE.Vector3; t: THREE.Vector3; cat: Cat } => !!x),
    [links, u, origin],
  );
  const linkGeom = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linkEnds.length * 6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(linkEnds.length * 6), 3));
    return g;
  }, [linkEnds]);
  React.useEffect(() => () => linkGeom.dispose(), [linkGeom]);
  const drawAt = React.useRef(0);
  const drawn = React.useRef(1);
  React.useEffect(() => {
    const col = linkGeom.getAttribute("color") as THREE.BufferAttribute;
    const c = new THREE.Color();
    linkEnds.forEach((x, i) => {
      c.set(CAT_COLOR[x.cat][ci]);
      col.setXYZ(i * 2, c.r, c.g, c.b);
      col.setXYZ(i * 2 + 1, c.r, c.g, c.b);
    });
    col.needsUpdate = true;
    drawAt.current = performance.now();
    drawn.current = 0;
    invalidate();
  }, [linkGeom, linkEnds, ci, invalidate]);

  // ---- money arcs, and the dots that run along them ----
  const maxAmt = React.useMemo(() => Math.max(1, ...AI_DEAL_EDGES.map((d) => d.amountHigh ?? d.amount ?? 0)), []);
  const arcs = React.useMemo(() => {
    const perPair = new Map<string, number>();
    return deals.map((d) => {
      const a = u.stars[u.starIndex.get(d.from)!].pos, b = u.stars[u.starIndex.get(d.to)!].pos;
      const k = dealKey(d.from, d.to);
      const nth = perPair.get(k) ?? 0;
      perPair.set(k, nth + 1);
      const pts = arcPoints(a, b, nth * 1.6);
      const amt = d.amountHigh ?? d.amount;
      return {
        d,
        key: `${d.from}|${d.to}|${d.instrument}|${nth}`,
        pts,
        /** The same curve, in the direction the money runs. */
        flow: moneyRunsFromTo(d) ? pts : pts.slice().reverse(),
        mid: pts[16],
        width: amt ? 1.2 + 4.8 * Math.sqrt(amt / maxAmt) : 1,
        money: MONEY_INSTRUMENTS.has(d.instrument),
      };
    });
  }, [deals, u, maxAmt]);
  const flowMat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLOW_VERT,
        fragmentShader: FLOW_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uSize: { value: 90 }, uCrisp: { value: 0 } },
      }),
    [],
  );
  React.useEffect(() => () => flowMat.dispose(), [flowMat]);
  React.useEffect(() => {
    flowMat.uniforms.uCrisp.value = light ? 1 : 0;
    flowMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    flowMat.needsUpdate = true;
  }, [light, flowMat]);
  const flowGeom = React.useMemo(() => {
    const n = arcs.length * FLOW_PER;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    arcs.forEach((a, i) => {
      c.set(a.money ? CAT_COLOR.capital[ci] : CAT_COLOR.supply[ci]);
      for (let k = 0; k < FLOW_PER; k++) col.set([c.r, c.g, c.b], (i * FLOW_PER + k) * 3);
    });
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return g;
  }, [arcs, ci]);
  React.useEffect(() => () => flowGeom.dispose(), [flowGeom]);

  // ---- a path: a line through it and a pulse running along it ----
  const pathPts = React.useMemo(() => (path && path.length > 1 ? path.map((id) => u.stars[u.starIndex.get(id)!].pos) : null), [path, u]);
  const segs = React.useMemo(() => (pathPts ? pathPts.slice(1).map((q, k) => pathPts[k].distanceTo(q)) : []), [pathPts]);

  // ---- atmosphere (dark only): far dust and a coloured haze behind each layer ----
  const dustGeom = React.useMemo(() => {
    const rand = seeded(7);
    const n = 1600;
    const v = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).normalize().multiplyScalar(60 + rand() * 50);
      v.set([d.x, d.y, d.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);
  React.useEffect(() => () => dustGeom.dispose(), [dustGeom]);
  const glow = React.useMemo(() => glowTexture(), []);
  React.useEffect(() => () => glow.dispose(), [glow]);

  // ---- cards: the entities nearest the camera that have an icon or a file, beside their stars ----
  const [near, setNear] = React.useState<string[]>([]);
  const nearRef = React.useRef(near);
  nearRef.current = near;
  /** Where the layer names and the cards sit on screen this frame: the other keeps out of them. */
  const areaBoxes = React.useRef<[number, number, number, number][]>([]);
  const cardBoxes = React.useRef<[number, number, number, number][]>([]);
  const favRef = React.useRef(favoured);
  favRef.current = favoured;
  const nearClock = React.useRef(0);
  const panelRef = React.useRef(panelPx);
  panelRef.current = panelPx;
  React.useEffect(() => {
    if (!cards) setNear([]);
    invalidate();
  }, [cards, invalidate]);

  // ---- labels: the ones that would overlap a more important one hide (checked a few times a second) ----
  const labelEls = React.useRef(new Map<string, HTMLElement>());
  const areaEls = React.useRef(new Map<number, HTMLElement>());
  const placeClock = React.useRef(1);
  const labelsRef = React.useRef(labels);
  labelsRef.current = labels;
  const hotRef = React.useRef(hot);
  hotRef.current = hot;

  // ---- per frame ----
  const pulse = React.useRef<THREE.Mesh>(null);
  const flash = React.useRef<THREE.Mesh>(null);
  const wave = React.useRef<THREE.Mesh>(null);
  const core = React.useRef<THREE.Mesh>(null);
  const lines = React.useRef<THREE.LineSegments>(null);
  const dust = React.useRef<THREE.Points>(null);
  useFrame((state, dt) => {
    const t = elapsed();
    mat.uniforms.uTime.value = reduced ? 0 : t;
    mat.uniforms.uIntro.value = reduced ? 0 : 1;
    pixelRef.current = state.viewport.dpr * Math.min(1.4, size.height / 600) * 28;
    mat.uniforms.uPixel.value = pixelRef.current;
    // Light: plotted points stay small even close up (big flat discs read as blots on white).
    mat.uniforms.uMaxPoint.value = (light ? 22 : 96) * state.viewport.dpr;
    mat.uniforms.uScale.value = Math.max(0.15, camera.position.distanceTo(controls.current?.target ?? tmp.set(0, 0, 0)) / 34);
    flowMat.uniforms.uSize.value = 90 * state.viewport.dpr;
    // The field follows the pointer, and fades in and out (off while a selection is being read).
    field.current += ((pointer.current.inside && !reduced && !calm && t > IGNITE_AT + 1.5 ? 1 : 0) - field.current) * Math.min(1, dt * 4);
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
    if (core.current) core.current.scale.setScalar((reduced ? 1 : t < IGNITE_AT ? 0.4 + 0.25 * Math.sin(t * 9) : 1 + 0.12 * Math.sin(t * 2.4)) * 0.2);
    if (lines.current) (lines.current.material as THREE.LineBasicMaterial).opacity = (reduced ? 1 : Math.min(1, Math.max(0, it - 1.4) / 1.2)) * (light ? 0.1 : 0.06);
    if (dust.current && !reduced) dust.current.rotation.y += dt * 0.004;
    // The links grow out of the selection.
    if (drawn.current < 1) {
      const k = reduced ? 1 : Math.min(1, (performance.now() - drawAt.current) / 650);
      drawn.current = k;
      const e = ease(k);
      const pos = linkGeom.getAttribute("position") as THREE.BufferAttribute;
      linkEnds.forEach((x, i) => {
        pos.setXYZ(i * 2, x.o.x, x.o.y, x.o.z);
        pos.setXYZ(i * 2 + 1, x.o.x + (x.t.x - x.o.x) * e, x.o.y + (x.t.y - x.o.y) * e, x.o.z + (x.t.z - x.o.z) * e);
      });
      pos.needsUpdate = true;
      if (k < 1) invalidate();
    }
    // Money dots, the way the money runs.
    if (arcs.length && !reduced) {
      const pos = flowGeom.getAttribute("position") as THREE.BufferAttribute;
      const clock = state.clock.elapsedTime;
      arcs.forEach((a, i) => {
        for (let k = 0; k < FLOW_PER; k++) {
          const f = ((clock * 0.22 + k / FLOW_PER + i * 0.137) % 1) * (a.flow.length - 1);
          const j = Math.floor(f);
          tmp.copy(a.flow[j]).lerp(a.flow[Math.min(j + 1, a.flow.length - 1)], f - j);
          pos.setXYZ(i * FLOW_PER + k, tmp.x, tmp.y, tmp.z);
        }
      });
      pos.needsUpdate = true;
    }
    // The pulse runs along the path, again and again.
    if (pulse.current) {
      pulse.current.visible = !!pathPts && !reduced;
      if (pathPts && !reduced) {
        let left = ((state.clock.elapsedTime % 1.6) / 1.6) * segs.reduce((x, y) => x + y, 0);
        let k = 0;
        while (k < segs.length - 1 && left > segs[k]) left -= segs[k++];
        pulse.current.position.copy(pathPts[k]).lerp(pathPts[k + 1], Math.min(1, left / (segs[k] || 1)));
      }
    }
    // Labels: the layer names keep their place, then entity names in order of importance; one that would overlap a
    // name already placed hides (the selection's names always show).
    placeClock.current += dt;
    if (placeClock.current > 0.12) {
      placeClock.current = 0;
      const W = size.width, Hh = size.height;
      // The HUD's corner (title, counts, focus line) is taken; a layer name that would run into it hides.
      const hud: [number, number, number, number] = [0, 0, 540, 100];
      const boxes: [number, number, number, number][] = [hud];
      const overlaps = (b: [number, number, number, number]) => boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
      // Bigger clusters keep their place; a name that would sit on another moves up a step or two, else hides.
      for (const a of u.areas.slice().sort((p, q) => q.ids.length - p.ids.length)) {
        tmp.set(a.pos.x, a.pos.y + a.extent + 0.4, a.pos.z).project(camera);
        const x = ((tmp.x + 1) / 2) * W, y = ((1 - tmp.y) / 2) * Hh;
        let lift = 0, clear = false;
        if (tmp.z <= 1)
          for (const step of [0, 20, 40]) {
            const box: [number, number, number, number] = [x - 75, y - step - 9, x + 75, y - step + 9];
            if (!overlaps(box)) {
              boxes.push(box);
              lift = step;
              clear = true;
              break;
            }
          }
        const el = areaEls.current.get(a.layer);
        if (!el) continue;
        const v = clear ? "visible" : "hidden";
        if (el.style.visibility !== v) el.style.visibility = v;
        const tr = lift ? `translateY(-${lift}px)` : "";
        if (el.style.transform !== tr) el.style.transform = tr;
      }
      areaBoxes.current = boxes.slice(1);
      for (const b of cardBoxes.current) boxes.push(b);
      const hotNow = new Set(hotRef.current);
      const carded = new Set(nearRef.current);
      for (const id of labelsRef.current) {
        const el = labelEls.current.get(id);
        const i = u.starIndex.get(id);
        if (!el || i == null) continue;
        tmp.copy(u.stars[i].pos).project(camera);
        // A card carries the name: no label under it.
        let show = tmp.z <= 1 && !carded.has(id);
        if (show) {
          const x = ((tmp.x + 1) / 2) * W + 9, y = ((1 - tmp.y) / 2) * Hh;
          const big = hotNow.has(id);
          const box: [number, number, number, number] = [x, y - 8, x + shortName(id).length * (big ? 7.4 : 6.1) + 6, y + 8];
          const hit = boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
          if (hit && !big) show = false;
          else boxes.push(box);
        }
        const v = show ? "visible" : "hidden";
        if (el.style.visibility !== v) el.style.visibility = v;
      }
    }
    // Cards: every 0.3 s, the nearest entities with an icon or a file that are in view, spaced apart on screen, out
    // of the HUD's corner and from under the panel; the selection always gets one.
    nearClock.current += dt;
    if (cards && t > IGNITE_AT + 2.2 && (reduced || nearClock.current > 0.3)) {
      nearClock.current = 0;
      const m = matchRef.current;
      const hotNow = new Set(hotRef.current);
      // Ranked: the selection and its group first, then the best connected; distance only breaks ties.
      const cand: { id: string; d: number; x: number; y: number; rank: number }[] = [];
      for (const s of u.stars) {
        if (!CARD_IDS.has(s.id) || (m && !m.has(s.id))) continue;
        tmp.copy(s.pos).project(camera);
        if (tmp.z > 1 || Math.abs(tmp.x) > 0.93 || Math.abs(tmp.y) > 0.9) continue;
        const px = ((tmp.x + 1) / 2) * size.width, py = ((1 - tmp.y) / 2) * size.height;
        if (px > size.width - panelRef.current - 24 - CARD_W || (py < 120 && px < 560) || py < 56) continue;
        const box: [number, number, number, number] = [px + 10, py - 50, px + 10 + CARD_W, py - 6];
        if (areaBoxes.current.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        const rank = (hotNow.has(s.id) ? 1e6 : 0) + (favRef.current.has(s.id) ? 1e4 : 0) + (DEGREE.get(s.id) ?? 0) * 10 - Math.min(9, camera.position.distanceTo(s.pos) / 10);
        cand.push({ id: s.id, d: camera.position.distanceTo(s.pos), x: px, y: py, rank });
      }
      cand.sort((a, b) => b.rank - a.rank);
      const chosen: typeof cand = [];
      for (const c of cand) {
        if (chosen.length >= maxCards) break;
        if (chosen.every((o) => Math.abs(o.x - c.x) > CARD_W + 8 || Math.abs(o.y - c.y) > 54)) chosen.push(c);
      }
      cardBoxes.current = chosen.map((c) => [c.x + 10, c.y - 50, c.x + 10 + CARD_W, c.y - 6]);
      const keys = chosen.map((c) => c.id).sort();
      setNear((prev) => (prev.join("|") === keys.join("|") ? prev : keys));
    }
    // Camera flight (the controls update themselves otherwise; updating twice would double the auto-orbit).
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
  });

  const labelStyle = { textShadow: "0 0 8px var(--uni-halo), 0 0 2px var(--uni-halo)" };
  const typeLabels = hot.length ? [] : u.types.filter((t) => (focusType ? t.key === focusType : focusArea != null && t.area === focusArea));
  const hotSet = new Set(hot);

  return (
    <>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom={full} enableDamping dampingFactor={0.08} minDistance={3} maxDistance={80} autoRotate={orbit} autoRotateSpeed={hot.length ? 0.45 : 0.3} />
      {!light && (
        <points ref={dust} geometry={dustGeom} frustumCulled={false}>
          <pointsMaterial size={0.16} sizeAttenuation color="#ffffff" transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </points>
      )}
      {!light &&
        u.areas.map((a) => (
          <sprite key={`haze-${a.layer}`} position={a.pos} scale={[a.extent * 2.6, a.extent * 2.6, 1]}>
            <spriteMaterial map={glow} color={LAYERS[a.layer].color} transparent opacity={match ? 0.05 : 0.09} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        ))}
      <points geometry={geom} material={mat} frustumCulled={false} />
      <lineSegments ref={lines} geometry={lineGeom} frustumCulled={false}>
        <lineBasicMaterial color={ink} transparent opacity={0.06} depthWrite={false} blending={blend} toneMapped={false} />
      </lineSegments>
      {linkEnds.length > 0 && (
        <lineSegments geometry={linkGeom} frustumCulled={false}>
          <lineBasicMaterial vertexColors transparent opacity={light ? 0.8 : 0.75} depthWrite={false} blending={blend} toneMapped={false} />
        </lineSegments>
      )}
      {arcs.map((a) => (
        <Line key={a.key} points={a.pts} color={a.money ? CAT_COLOR.capital[ci] : CAT_COLOR.supply[ci]} lineWidth={a.width} transparent opacity={light ? 0.85 : 0.7} toneMapped={false} />
      ))}
      {arcs.length > 0 && !reduced && <points geometry={flowGeom} material={flowMat} frustumCulled={false} />}
      {pathPts && <Line points={pathPts} color={accent} lineWidth={2.5} transparent opacity={0.95} toneMapped={false} />}
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={ink} toneMapped={false} />
      </mesh>
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={light ? accent : "#ffffff"} transparent opacity={0} depthWrite={false} blending={blend} toneMapped={false} />
      </mesh>
      <mesh ref={wave} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={blend} toneMapped={false} />
      </mesh>

      {/* layer names, above each cluster: they fly there; keyed by the ignition, so a replay fades them in again */}
      {u.areas.map((a) => (
        <Html key={`${a.layer}-${igniteKey}`} position={[a.pos.x, a.pos.y + a.extent + 0.4, a.pos.z]} center zIndexRange={[40000, 30000]}>
          <button
            ref={(el) => {
              if (el) areaEls.current.set(a.layer, el);
              else areaEls.current.delete(a.layer);
            }}
            type="button"
            tabIndex={-1}
            onClick={() => onArea(focusArea === a.layer && !focusType ? null : a.layer)}
            title={`${LAYERS[a.layer].label}: ${a.ids.length} entities`}
            className={`flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              focusArea === a.layer ? "text-[color:var(--uni-a)]" : "text-foreground/85 hover:text-[color:var(--uni-a)]"
            }`}
            style={{ ...labelStyle, animation: reduced || !play ? undefined : `aiFade 600ms ${IGNITE_AT + 1.6}s both` }}
          >
            <span className="inline-block h-2 w-2" style={{ background: layerColor(a.layer, light) }} aria-hidden="true" />
            L{a.layer} · {LAYERS[a.layer].short} · {a.ids.length}
          </button>
        </Html>
      ))}
      {typeLabels.map((t) => (
        <Html key={t.key} position={t.pos} center zIndexRange={[35000, 30000]}>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onType(t.key)}
            className={`whitespace-nowrap font-mono text-[10px] tracking-[0.08em] ${focusType === t.key ? "text-[color:var(--uni-a)]" : "text-foreground/80 hover:text-[color:var(--uni-a)]"}`}
            style={{ ...labelStyle, transform: `translateY(-${Math.round(14 + t.spread * 6)}px)` }}
          >
            {t.label} · {t.ids.length}
          </button>
        </Html>
      ))}
      {/* entity names beside their stars */}
      {labels.map((id) => {
        const i = u.starIndex.get(id);
        if (i == null) return null;
        const on = hotSet.has(id);
        return (
          <Html key={`e-${id}`} position={u.stars[i].pos} zIndexRange={on ? [39000, 36000] : [20000, 10000]} style={{ transform: "translate(9px, -50%)", pointerEvents: "none" }}>
            <button
              ref={(el) => {
                if (el) labelEls.current.set(id, el);
                else labelEls.current.delete(id);
              }}
              type="button"
              tabIndex={-1}
              title={getNode(id)?.name}
              onClick={() => onSelect(id)}
              onPointerEnter={() => onHover(id)}
              className={`pointer-events-auto whitespace-nowrap font-mono ${on ? "text-[12px] font-bold text-[color:var(--uni-a)]" : "text-[10px] text-foreground/85 hover:text-[color:var(--uni-a)]"}`}
              style={labelStyle}
            >
              {shortName(id)}
            </button>
          </Html>
        );
      })}
      {/* cards beside the nearest stars */}
      {near.map((id, k) => {
        const i = u.starIndex.get(id);
        if (i == null) return null;
        return (
          <Html key={`c-${id}`} position={u.stars[i].pos} zIndexRange={hotSet.has(id) ? [38000, 36000] : [15000, 8000]} style={{ transform: "translate(10px, calc(-100% - 6px))" }}>
            <Card id={id} on={hotSet.has(id) || hover === id} delay={Math.min(0.5, k * 0.03)} reduced={reduced} light={light} onHover={onHover} onSelect={onSelect} onOpen={onOpen} />
          </Html>
        );
      })}
      {/* deal amounts at the top of each arc */}
      {arcs.map((a) => (
        <Html key={`d-${a.key}`} position={a.mid} center zIndexRange={[25000, 20000]} style={{ pointerEvents: "none" }}>
          <span className="block whitespace-nowrap border border-border bg-background/85 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-foreground" title={a.d.summary}>
            <span className={`font-bold ${a.money ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>{dealShort(a.d)}</span>
            <span className="text-muted-foreground"> {INSTRUMENT_LABEL[a.d.instrument] ?? a.d.instrument.replace(/_/g, " ")}</span>
          </span>
        </Html>
      ))}
      <Html position={[0, 0, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <style>{`@keyframes aiFade{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}@keyframes aiPop{0%{opacity:0;transform:scale(.2)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}`}</style>
      </Html>
    </>
  );
}

// ---------------------------------------------------------------------------
// The index: layers, then types, then entities
// ---------------------------------------------------------------------------

function IndexTable({
  u,
  light,
  focusArea,
  focusType,
  selected,
  onArea,
  onType,
  onSelect,
  onHover,
}: {
  u: Uni;
  light: boolean;
  focusArea: number | null;
  focusType: string | null;
  selected: string | null;
  onArea: (layer: number | null) => void;
  onType: (key: string | null) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const level = focusType ? 3 : focusArea != null ? 2 : 1;
  const t = focusType ? u.types[u.typeIndex.get(focusType) ?? -1] : undefined;
  const th = "px-1.5 py-1.5 text-right font-normal";
  const num = "px-1.5 text-right tabular-nums text-foreground/80";
  const crumb = "underline decoration-dotted underline-offset-2 hover:text-foreground";
  const rowBtn = "flex w-full items-center gap-2 py-1.5 text-left text-foreground/90 hover:text-foreground";
  return (
    <div data-testid="ai-universe-index">
      <nav aria-label="Index path" className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <button type="button" onClick={() => onArea(null)} aria-current={level === 1 ? "location" : undefined} className={level === 1 ? "text-[color:var(--uni-a)]" : crumb}>
          All layers
        </button>
        {focusArea != null && (
          <>
            <span aria-hidden="true">›</span>
            <button type="button" onClick={() => onType(null)} aria-current={level === 2 ? "location" : undefined} className={level === 2 ? "text-[color:var(--uni-a)]" : crumb}>
              L{focusArea} {LAYERS[focusArea].short}
            </button>
          </>
        )}
        {t && (
          <>
            <span aria-hidden="true">›</span>
            <span aria-current="location" className="text-[color:var(--uni-a)]">
              {t.label}
            </span>
          </>
        )}
      </nav>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            <th className="w-[44%] px-3 py-1.5 text-left font-normal">{level === 1 ? "Layer" : level === 2 ? "Type" : "Entity"}</th>
            {level < 3 && <th className={th}>Entities</th>}
            <th className={th}>Links</th>
            {level !== 2 && <th className={th}>Deals</th>}
            <th className={`${th} pr-3`}>Choke</th>
          </tr>
        </thead>
        <tbody>
          {level === 1 &&
            u.areas.map((a) => (
              <tr key={a.layer} className="border-t border-border hover:bg-foreground/[0.06]">
                <td className="max-w-0 px-3 py-0">
                  <button type="button" onClick={() => onArea(a.layer)} className={rowBtn} title={LAYERS[a.layer].label}>
                    <span className="h-2 w-2 shrink-0" style={{ background: layerColor(a.layer, light) }} aria-hidden="true" />
                    <span className="truncate">
                      L{a.layer} · {LAYERS[a.layer].short}
                    </span>
                  </button>
                </td>
                <td className={num}>{a.ids.length}</td>
                <td className={num}>{a.links.toLocaleString("en-US")}</td>
                <td className={num}>{a.deals || "·"}</td>
                <td className={`${num} pr-3 text-muted-foreground`}>{a.choke || "·"}</td>
              </tr>
            ))}
          {level === 2 &&
            u.types
              .filter((x) => x.area === focusArea)
              .sort((a, b) => b.ids.length - a.ids.length || a.label.localeCompare(b.label))
              .map((x) => (
                <tr key={x.key} className="border-t border-border hover:bg-foreground/[0.06]">
                  <td className="max-w-0 px-3 py-0">
                    <button type="button" onClick={() => onType(x.key)} className={rowBtn}>
                      <span className="h-2 w-2 shrink-0 border border-foreground/50" aria-hidden="true" />
                      <span className="truncate">{x.label}</span>
                    </button>
                  </td>
                  <td className={num}>{x.ids.length}</td>
                  <td className={num}>{x.links.toLocaleString("en-US")}</td>
                  <td className={`${num} pr-3 text-muted-foreground`}>{x.choke || "·"}</td>
                </tr>
              ))}
          {level === 3 &&
            t &&
            t.ids
              .slice()
              .sort(byDegree)
              .map((id) => (
                <tr
                  key={id}
                  className={`border-t border-border ${selected === id ? "bg-[color:var(--uni-a10)]" : "hover:bg-foreground/[0.06]"}`}
                  onMouseEnter={() => onHover(id)}
                  onMouseLeave={() => onHover(null)}
                >
                  <td className="max-w-0 px-3 py-0">
                    <button type="button" onClick={() => onSelect(id)} className={rowBtn}>
                      {logoUrl(id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl(id)!} alt="" width={16} height={16} className="h-4 w-4 shrink-0 bg-white object-contain" loading="lazy" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 border border-foreground/30" aria-hidden="true" />
                      )}
                      <span className="truncate">{getNode(id)?.name ?? id}</span>
                    </button>
                  </td>
                  <td className={num}>{DEGREE.get(id) ?? 0}</td>
                  <td className={num}>{dealsOf(id).length || "·"}</td>
                  <td className={`${num} pr-3 text-amber-700 dark:text-amber-300`}>{CHOKE_IDS.has(id) ? "⬦" : <span className="text-muted-foreground">·</span>}</td>
                </tr>
              ))}
        </tbody>
      </table>
      {level === 1 && (
        <p className="border-t border-border px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
          Each star is an entity in its layer&apos;s colour, bigger with more links. Click a star or a row for its file. Money draws the deals from filings;
          Chokepoints lights the single points of failure.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The view
// ---------------------------------------------------------------------------

export default function AiUniverse({ scope, onScope, fallback }: Props) {
  const gl = useWebGL();
  const router = useRouter();
  // It follows the site's theme: white space and dark points in light, black space and glowing stars in dark.
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme === "light";
  const accent = light ? RADIUM_ON_LIGHT : RADIUM;
  const ci = light ? 1 : 0;
  const themeVars = {
    "--uni-a": accent,
    "--uni-a50": light ? "rgba(10,125,80,.5)" : "rgba(54,255,176,.5)",
    "--uni-a10": light ? "rgba(10,125,80,.1)" : "rgba(54,255,176,.1)",
    "--uni-halo": light ? "rgba(255,255,255,.95)" : "rgba(0,0,0,.9)",
  } as React.CSSProperties;
  const u = React.useMemo(buildAiUniverse, []);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const firstBtnRef = React.useRef<HTMLButtonElement>(null);

  const selected = scope.entity;
  const compare = scope.entity ? scope.compare : null;
  const focusArea = scope.layer;
  const focusType = scope.type;

  const [reduced, setReduced] = React.useState(false);
  /** On screen? Rendering stops off screen. */
  const [visible, setVisible] = React.useState(false);
  const [hover, setHover] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis>("none");
  const [hops, setHops] = React.useState(1);
  const [pathTo, setPathTo] = React.useState<string | null>(null);
  const [money, setMoney] = React.useState(false);
  const [choke, setChoke] = React.useState(false);
  const [labelsOn, setLabelsOn] = React.useState(true);
  const [cards, setCards] = React.useState(true);
  const [cats, setCats] = React.useState<Set<Cat>>(() => new Set(ALL_CATS));
  const [orbit, setOrbit] = React.useState(true);
  const [full, setFull] = React.useState(false);
  const [panelOpen, setPanelOpen] = React.useState(true);
  const [igniteKey, setIgniteKey] = React.useState(0);
  /** The galaxy opens already formed; the ignition show (countdown, burst) plays only when Ignite is pressed. */
  const [play, setPlay] = React.useState(false);
  const [count, setCount] = React.useState<string | null>(null);
  const [boxW, setBoxW] = React.useState(0);
  const [boxH, setBoxH] = React.useState(0);
  const [canFull, setCanFull] = React.useState(false);
  const [touch, setTouch] = React.useState(false);
  const wide = boxW >= WIDE;
  const phone = boxW > 0 && boxW < 640;
  /** The open part of the view (beside the panel) over its height: the home view fits the galaxy to it. */
  const viewAspect = boxH ? Math.max(0.4, (boxW - (wide && panelOpen ? PANEL_W + 12 : 0)) / boxH) : 1.6;

  React.useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener?.("change", sync);
    return () => q.removeEventListener?.("change", sync);
  }, []);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return setVisible(true);
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  React.useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  React.useEffect(() => {
    setCanFull(!!document.fullscreenEnabled);
    setTouch(!!window.matchMedia?.("(pointer: coarse)").matches);
  }, []);
  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    setBoxW(el.clientWidth);
    setBoxH(el.clientHeight);
    if (!("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => {
      setBoxW(el.clientWidth);
      setBoxH(el.clientHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [gl.ok]);
  // Countdown, then ignition: only on Ignite (and never with reduced motion).
  React.useEffect(() => {
    if (reduced || !play) return setCount(null);
    const steps: [number, string | null][] = [[0, "T-3"], [0.6, "T-2"], [1.2, "T-1"], [1.8, "IGNITION"], [IGNITE_AT + 0.6, null]];
    const timers = steps.map(([at, label]) => window.setTimeout(() => setCount(label), at * 1000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [igniteKey, reduced, play]);
  // A new selection starts a fresh reading.
  React.useEffect(() => {
    setAnalysis("none");
    setPathTo(null);
    if (selected) setPanelOpen(true);
  }, [selected]);

  const select = React.useCallback((id: string | null) => onScope(id ? scopeOf(id) : { ...scope, entity: null, compare: null }), [onScope, scope]);
  const toArea = React.useCallback((layer: number | null) => onScope({ layer, type: null, entity: null, compare: null }), [onScope]);
  const toType = React.useCallback(
    (key: string | null) => onScope(key ? { layer: Number(key.split(":")[0]), type: key, entity: null, compare: null } : { layer: scope.layer, type: null, entity: null, compare: null }),
    [onScope, scope.layer],
  );
  const reset = () => {
    onScope({ layer: null, type: null, entity: null, compare: null });
    setMoney(false);
    setChoke(false);
    setHover(null);
  };
  const open = React.useCallback(
    (id: string) => {
      const go = () => router.push(`/notebook/ai/map/${id}`);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {}).finally(go);
      else go();
    },
    [router],
  );
  // Esc steps back: the question, the comparison, the selection, the type, the layer.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("[role=dialog]")) return;
      if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      if (!visible && !wrapRef.current?.contains(document.activeElement)) return;
      if (analysis !== "none") setAnalysis("none");
      else if (compare) onScope({ ...scope, compare: null });
      else if (selected) select(null);
      else if (focusType) toType(null);
      else if (focusArea != null) toArea(null);
      else {
        setMoney(false);
        setChoke(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [analysis, compare, selected, focusType, focusArea, visible, onScope, scope, select, toType, toArea]);

  // ---- what to light, draw, label and fly to ----
  const reachResult = React.useMemo(
    () => (selected && (analysis === "exposed" || analysis === "depends") ? reach(selected, analysis, hops, cats) : null),
    [selected, analysis, hops, cats],
  );
  const pathResult = React.useMemo(() => (selected && analysis === "path" && pathTo ? shortestPath(selected, pathTo, cats) : undefined), [selected, analysis, pathTo, cats]);
  const comparison = React.useMemo(() => (selected && compare && compare !== selected ? compareEntities(selected, compare) : null), [selected, compare]);
  const typeIds = React.useMemo(() => (focusType ? u.types[u.typeIndex.get(focusType) ?? -1]?.ids ?? null : null), [focusType, u]);
  const areaIds = React.useMemo(() => (focusArea != null ? u.areas[focusArea]?.ids ?? null : null), [focusArea, u]);
  /** The selection's corporate group: its units (a head) or its head (a unit). */
  const family = React.useMemo(() => {
    if (!selected) return new Set<string>();
    const head = groupOf(selected);
    return new Set(head ? [head] : membersOf(selected));
  }, [selected]);
  const neighbors = React.useMemo(() => {
    if (!selected) return [] as string[];
    const s = new Set<string>(family);
    for (const e of EDGES_OF.get(selected) ?? []) if (cats.has(e.cat)) s.add(e.from === selected ? e.to : e.from);
    const dealers = new Set(dealsOf(selected).map((d) => (d.from === selected ? d.to : d.from)));
    for (const x of dealers) s.add(x);
    return [...s].sort((a, b) => Number(family.has(b)) - Number(family.has(a)) || Number(dealers.has(b)) - Number(dealers.has(a)) || byDegree(a, b));
  }, [selected, cats, family]);

  const match = React.useMemo<Set<string> | null>(() => {
    if (reachResult) return reachResult.ids;
    if (pathResult) return new Set(pathResult.ids);
    if (selected && analysis === "path" && pathTo) return new Set([selected, pathTo]);
    if (comparison && selected && compare) return new Set([selected, compare, ...comparison.shared.filter((x) => cats.has(x.cat)).map((x) => x.id)]);
    if (selected) return new Set([selected, ...neighbors]);
    const meet = (b: Set<string> | null, x: Set<string>) => (b ? new Set([...b].filter((id) => x.has(id))) : new Set(x));
    let base: Set<string> | null = typeIds ? new Set(typeIds) : areaIds ? new Set(areaIds) : null;
    if (money) base = meet(base, DEAL_NODES);
    if (choke) base = meet(base, CHOKE_IDS);
    return base;
  }, [reachResult, pathResult, analysis, pathTo, comparison, selected, compare, neighbors, typeIds, areaIds, money, choke, cats]);

  const links = React.useMemo<Edge[]>(() => {
    if (reachResult) return reachResult.edges;
    if (pathResult) return pathResult.edges;
    if (comparison && selected && compare) {
      const shared = new Set(comparison.shared.filter((x) => cats.has(x.cat)).map((x) => x.id));
      const pick = (me: string) => (EDGES_OF.get(me) ?? []).filter((e) => cats.has(e.cat) && shared.has(e.from === me ? e.to : e.from));
      return [...comparison.direct, ...pick(selected), ...pick(compare)];
    }
    if (selected) return (EDGES_OF.get(selected) ?? []).filter((e) => cats.has(e.cat));
    return [];
  }, [reachResult, pathResult, comparison, selected, compare, cats]);

  const deals = React.useMemo(() => {
    const ok = AI_DEAL_EDGES.filter((d) => u.starIndex.has(d.from) && u.starIndex.has(d.to));
    if (selected) return analysis === "none" && !compare ? ok.filter((d) => d.from === selected || d.to === selected) : [];
    return money ? ok : [];
  }, [selected, analysis, compare, money, u]);

  const labels = React.useMemo(() => {
    const top = (ids: Iterable<string>, k: number) => [...ids].sort(byDegree).slice(0, k);
    if (pathResult) return pathResult.ids;
    if (!labelsOn) return [selected, compare].filter((x): x is string => !!x);
    if (reachResult && selected) return [selected, ...top([...reachResult.ids].filter((x) => x !== selected), 20)];
    if (comparison && selected && compare) return [selected, compare, ...comparison.shared.filter((x) => cats.has(x.cat)).slice(0, 18).map((x) => x.id)];
    if (selected) return [selected, ...(pathTo ? [pathTo] : []), ...neighbors.slice(0, phone ? 8 : 18)];
    if (match) return top(match, typeIds ? 24 : money ? 20 : 14);
    return top(
      u.stars.map((s) => s.id),
      12,
    );
  }, [pathResult, labelsOn, reachResult, comparison, selected, compare, pathTo, neighbors, match, typeIds, money, u, cats, phone]);

  const fly = React.useMemo(() => {
    const P = (id: string) => u.stars[u.starIndex.get(id)!].pos;
    // The distance at which every one of these stars fits the open part of the view (50° fov), with a margin.
    const around = (c: THREE.Vector3, ids: Iterable<string>, k = 1.15, min = 9, max = 64) => {
      let r = 0;
      for (const id of ids) {
        const i = u.starIndex.get(id);
        if (i != null) r = Math.max(r, u.stars[i].pos.distanceTo(c));
      }
      return Math.min(max, Math.max(min, (r * k + 1.5) / (Math.tan((25 * Math.PI) / 180) * Math.min(1, viewAspect))));
    };
    if (pathResult && pathResult.ids.length > 1) {
      const c = new THREE.Vector3();
      for (const id of pathResult.ids) c.add(P(id));
      c.divideScalar(pathResult.ids.length);
      return { center: c, dist: around(c, pathResult.ids, 1.3), key: `path:${pathResult.ids.join(">")}` };
    }
    if (selected && reachResult) return { center: P(selected).clone(), dist: around(P(selected), reachResult.ids), key: `reach:${selected}:${analysis}:${hops}` };
    if (selected && compare && match) {
      const c = P(selected).clone().add(P(compare)).multiplyScalar(0.5);
      return { center: c, dist: around(c, match, 1.15), key: `cmp:${selected}:${compare}` };
    }
    if (selected) {
      // Centred between the entity and its links, so the whole neighbourhood is in frame with the entity near the middle.
      const c = P(selected).clone();
      if (neighbors.length) {
        const mid = new THREE.Vector3();
        for (const id of neighbors) mid.add(P(id));
        c.lerp(mid.divideScalar(neighbors.length), 0.45);
      }
      // Framed on the entity, its deal parties and its most connected links (the rest can sit outside the frame).
      const parties = dealsOf(selected).map((d) => (d.from === selected ? d.to : d.from));
      return { center: c, dist: around(c, [selected, ...parties, ...neighbors.slice(0, 14)]), key: `sel:${selected}`, outward: true };
    }
    if (focusType) {
      const t = u.types[u.typeIndex.get(focusType) ?? -1];
      if (t) return { center: t.pos.clone(), dist: Math.max(7, t.spread * 5 + 4), key: `type:${focusType}`, outward: true };
    }
    if (focusArea != null) return { center: u.areas[focusArea].pos.clone(), dist: 21, key: `area:${focusArea}`, outward: true };
    return { center: new THREE.Vector3(), dist: fitDistance(viewAspect), key: `home:${viewAspect.toFixed(2)}` };
  }, [pathResult, selected, reachResult, analysis, hops, compare, match, neighbors, focusType, focusArea, u, viewAspect]);

  const selNode = selected ? getNode(selected) : undefined;
  const cmpNode = compare ? getNode(compare) : undefined;
  const chip = (() => {
    if (selNode && reachResult) return `${analysis === "exposed" ? `Exposed if ${selNode.name} fails` : `${selNode.name} depends on`} · ${reachResult.ids.size - 1}`;
    if (selNode && analysis === "path" && pathTo)
      return pathResult ? `${selNode.name} to ${getNode(pathTo)?.name} · ${pathResult.edges.length} ${pathResult.edges.length === 1 ? "step" : "steps"}` : `No path to ${getNode(pathTo)?.name}`;
    if (selNode && cmpNode && comparison) return `${selNode.name} and ${cmpNode.name} · ${comparison.shared.length} shared`;
    if (selNode) {
      const nd = dealsOf(selNode.id).length;
      return `${selNode.name} · ${DEGREE.get(selNode.id) ?? 0} links${nd ? ` · ${nd} ${nd === 1 ? "deal" : "deals"}` : ""}`;
    }
    const parts: string[] = [];
    if (focusType) {
      const t = u.types[u.typeIndex.get(focusType) ?? -1];
      if (t) parts.push(`L${t.area} ${t.label}`);
    } else if (focusArea != null) parts.push(`L${focusArea} ${LAYERS[focusArea].label}`);
    if (money) parts.push("Deals");
    if (choke) parts.push("Chokepoints");
    return parts.length ? `${parts.join(" · ")} · ${match?.size ?? 0}` : null;
  })();
  const legend = React.useMemo(() => {
    if (!selected) return [];
    const counts = new Map<Cat, number>();
    for (const e of EDGES_OF.get(selected) ?? []) counts.set(e.cat, (counts.get(e.cat) ?? 0) + 1);
    return CATS.filter((c) => counts.get(c.id)).map((c) => ({ c, n: counts.get(c.id)! }));
  }, [selected]);
  const hoverNode = hover && hover !== selected ? getNode(hover) : undefined;
  const panelPx = wide && panelOpen ? PANEL_W + 12 : 0;
  const hot = [selected, compare, pathTo].filter((x): x is string => !!x);
  const anything = !!(selected || focusArea != null || money || choke);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapRef.current?.requestFullscreen?.().catch(() => {});
  };
  const BTN =
    "shrink-0 whitespace-nowrap focus-visible:outline-offset-[-2px] font-mono text-[10px] leading-[15px] uppercase tracking-[0.15em] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40 disabled:opacity-50";
  const on = "border-[color:var(--uni-a50)] text-[color:var(--uni-a)]";

  if (gl.ok === false) return <>{fallback ?? null}</>;

  const panel = (
    <aside
      aria-label={selNode ? `${selNode.name}: dossier` : "Index of the AI economy"}
      className={`flex flex-col border border-border bg-background font-mono text-foreground shadow-sm dark:shadow-2xl ${
        wide ? "absolute right-3 top-3 z-40 w-[380px] max-h-[calc(100%-1.5rem)]" : "mt-2 w-full"
      }`}
      data-testid="ai-universe-panel"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]">
          {selNode ? "Dossier" : "Index"}
          <span className="font-normal text-muted-foreground"> · {selNode ? `L${selNode.layer} ${LAYERS[selNode.layer].short}` : focusType ? "L3 entities" : focusArea != null ? "L2 types" : "L1 layers"}</span>
        </p>
        <div className="flex items-center gap-3">
          {selNode && (
            <button type="button" onClick={() => select(null)} className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">
              ← Index
            </button>
          )}
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            aria-label={panelOpen ? "Minimize the panel" : "Open the panel"}
            className="px-1 text-[12px] text-foreground/80 hover:text-foreground"
          >
            {panelOpen ? "▾" : "▴"}
          </button>
        </div>
      </div>
      {panelOpen && (
        <div className="min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/.45)_transparent]">
          {selNode ? (
            <div className="p-3">
              <Dossier
                id={selNode.id}
                onSelect={(id) => select(id)}
                analysis={analysis}
                setAnalysis={setAnalysis}
                hops={hops}
                setHops={setHops}
                pathTo={pathTo}
                setPathTo={setPathTo}
                pathResult={pathResult}
                reachCount={reachResult?.ids.size ?? 0}
              />
            </div>
          ) : (
            <IndexTable u={u} light={light} focusArea={focusArea} focusType={focusType} selected={selected} onArea={toArea} onType={toType} onSelect={(id) => select(id)} onHover={setHover} />
          )}
        </div>
      )}
    </aside>
  );

  return (
    <div ref={wrapRef} style={themeVars} className={full ? "bg-background h-full flex flex-col overflow-auto p-3" : ""} data-testid="ai-universe">
      <style>{`@keyframes aiTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <Ticker onPick={(id) => select(id)} reduced={reduced} />
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="shrink-0 sm:w-64">
          <SearchBox compact placeholder={`Search ${ALL_NODES.length} companies, chips, topics`} onPick={(id) => select(id)} onPickScope={onScope} />
        </div>
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {/* Replays the ignition show; with reduced motion there is no show, so no button */}
          {!reduced && (
            <button
              ref={firstBtnRef}
              type="button"
              className={BTN}
              onClick={() => {
                setHover(null);
                setPlay(true);
                setIgniteKey((k) => k + 1);
              }}
            >
              <span aria-hidden="true">↻ </span>Ignite
            </button>
          )}
          <button type="button" className={BTN} onClick={reset} disabled={!anything}>
            ✕ All
          </button>
          <button type="button" className={BTN} onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen}>
            {selNode ? "Dossier" : "Index"} {panelOpen ? "▴" : "▾"}
          </button>
          <button type="button" className={`${BTN} ${money ? on : ""}`} onClick={() => setMoney((v) => !v)} aria-pressed={money} data-testid="ai-universe-money">
            Money {money ? "on" : "off"}
          </button>
          <button type="button" className={`${BTN} ${choke ? on : ""}`} onClick={() => setChoke((v) => !v)} aria-pressed={choke}>
            Chokepoints {choke ? "on" : "off"}
          </button>
          <button type="button" className={BTN} onClick={() => setCards((v) => !v)} aria-pressed={cards}>
            Cards {cards ? "on" : "off"}
          </button>
          <button type="button" className={BTN} onClick={() => setLabelsOn((v) => !v)} aria-pressed={labelsOn}>
            Labels {labelsOn ? "on" : "off"}
          </button>
          {!reduced && (
            <button type="button" className={BTN} onClick={() => setOrbit((o) => !o)} aria-pressed={orbit}>
              Auto-orbit {orbit ? "on" : "off"}
            </button>
          )}
          {canFull && (
            <button type="button" className={BTN} onClick={toggleFull}>
              {full ? "Exit full screen" : "Full screen"}
            </button>
          )}
        </div>
      </div>

      <div className={`relative ${full ? "flex-1 min-h-[420px]" : ""}`}>
        {/* first in the DOM on wide screens, so the keyboard reaches the panel before the 3D labels */}
        {wide && panel}
        <div
          ref={boxRef}
          className={`relative overflow-hidden border border-border bg-background ${full ? "h-full" : "w-full aspect-[16/10] min-h-[560px] max-h-[86vh]"}`}
          style={{
            cursor: "crosshair",
            // Light: engineering paper (a faint dot grid) behind the transparent scene.
            ...(light ? { backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.07) 1px, transparent 1.2px)", backgroundSize: "22px 22px" } : {}),
          }}
          data-testid="ai-universe-view"
        >
          {gl.ok && (
            <Canvas
              className="isolate"
              dpr={[1, 1.5]}
              frameloop={!visible ? "never" : reduced ? "demand" : "always"}
              camera={{ position: [0, 9, 43], fov: 50, near: 0.1, far: 300 }}
              gl={{ powerPreference: gl.power, antialias: light, alpha: true }}
              onCreated={({ gl: r, camera }) => {
                r.domElement.setAttribute("aria-hidden", "true");
                // The view sets the camera's aspect itself (it widens the frame for the panel).
                (camera as THREE.PerspectiveCamera & { manual?: boolean }).manual = true;
              }}
            >
              {!light && <color attach="background" args={["#000000"]} />}
              <Scene
                u={u}
                igniteKey={igniteKey}
                play={play}
                reduced={reduced}
                light={light}
                accent={accent}
                match={match}
                hover={hover}
                hot={hot}
                onHover={setHover}
                onSelect={select}
                onOpen={open}
                onArea={toArea}
                onType={toType}
                focusArea={focusArea}
                focusType={focusType}
                links={links}
                origin={selected}
                path={pathResult?.ids ?? null}
                deals={deals}
                labels={labels}
                fly={fly}
                orbit={orbit && !reduced}
                full={full}
                choke={choke}
                calm={!!(selected || analysis !== "none")}
                panelPx={panelPx}
                cards={cards}
                maxCards={phone ? 4 : NEAR_CARDS}
                favoured={family}
              />
              {/* Glow only on black: on white it would wash the points out. */}
              {!light && (
                <EffectComposer multisampling={0}>
                  <Bloom intensity={1.1} luminanceThreshold={0.12} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
                </EffectComposer>
              )}
            </Canvas>
          )}

          {/* mission-control corners */}
          {["left-1.5 top-1.5 border-l border-t", "right-1.5 top-1.5 border-r border-t", "left-1.5 bottom-1.5 border-l border-b", "right-1.5 bottom-1.5 border-r border-b"].map((c) => (
            <span key={c} aria-hidden="true" className={`pointer-events-none absolute z-30 h-3 w-3 border-[color:var(--uni-a50)] ${c}`} />
          ))}

          {/* HUD */}
          <div className="pointer-events-none absolute z-40 left-3 top-3 max-w-[calc(100%-1.5rem)] font-mono text-foreground">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]">AI Intelligence Graph</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {u.stars.length} objects · {phone ? "" : `${LAYERS.length} layers · ${TYPE_COUNT} types · `}
              {EDGES.length.toLocaleString("en-US")} links · {AI_DEAL_EDGES.length} deals
            </p>
            {AS_OF && <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Sources to {dayMonthYear(AS_OF)}</p>}
            {chip && (
              <p className="mt-2 inline-block max-w-full truncate border border-[color:var(--uni-a50)] bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--uni-a)]" data-testid="ai-universe-focus">
                {chip}
              </p>
            )}
          </div>
          {count && (
            <div className="pointer-events-none absolute z-40 inset-0 grid place-items-center" aria-hidden="true">
              <p className={`font-mono font-bold tracking-[0.4em] text-foreground ${count === "IGNITION" ? "text-4xl text-[color:var(--uni-a)]" : "text-3xl"}`}>{count}</p>
            </div>
          )}

          {/* the star under the pointer */}
          {hoverNode && boxW >= 640 && (
            <div
              className="pointer-events-none absolute z-40 bottom-3 left-3 w-[300px] max-w-[45%] border border-[color:var(--uni-a50)] bg-background/90 p-3 font-mono text-foreground"
              data-testid="ai-universe-target"
            >
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[color:var(--uni-a)]">
                Target locked · L{hoverNode.layer} {LAYERS[hoverNode.layer].short}
              </span>
              <span className="mt-1.5 flex items-center gap-2">
                {logoUrl(hoverNode.id) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl(hoverNode.id)!} alt="" width={28} height={28} className="h-7 w-7 shrink-0 bg-white object-contain p-0.5" />
                )}
                <span className="block font-display text-base font-bold leading-tight">{hoverNode.name}</span>
              </span>
              <span className="mt-1 block text-[10px] leading-snug text-muted-foreground line-clamp-2">{hoverNode.tagline}</span>
              <span className="mt-1.5 block text-[10px] uppercase tracking-[0.15em] text-foreground/80">
                {NODE_TYPE_META[hoverNode.type].label} · {DEGREE.get(hoverNode.id) ?? 0} links
                {dealsOf(hoverNode.id).length ? ` · ${dealsOf(hoverNode.id).length} deals` : ""}
                {CHOKE_IDS.has(hoverNode.id) ? " · chokepoint" : ""}
              </span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Click for its file · double-click for its page</span>
            </div>
          )}

          {/* legend and how to fly */}
          <div className="absolute z-40 bottom-3 font-mono text-foreground" style={{ right: wide && panelOpen ? PANEL_W + 24 : 12 }} data-testid="ai-universe-legend">
            {legend.length > 0 && boxW >= 640 && (
              <ul className="mb-1.5 space-y-0.5 text-right">
                {legend.map(({ c, n }) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setCats((s) => {
                          const x = new Set(s);
                          if (x.has(c.id)) x.delete(c.id);
                          else x.add(c.id);
                          return x;
                        })
                      }
                      aria-pressed={cats.has(c.id)}
                      title={c.hint}
                      className={`inline-flex items-center gap-1.5 bg-background/70 px-1 text-[10px] uppercase tracking-[0.12em] ${cats.has(c.id) ? "text-foreground/90" : "text-muted-foreground line-through"}`}
                    >
                      <i className="inline-block h-[2px] w-3" style={{ background: CAT_COLOR[c.id][ci] }} />
                      {c.label} · {n}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {deals.length > 0 && boxW >= 640 && (
              <p className="mb-1 bg-background/70 px-1 text-right text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <i className="mr-1 inline-block h-[3px] w-3 align-middle" style={{ background: CAT_COLOR.supply[ci] }} />
                Compute and supply
                <i className="mx-1 ml-3 inline-block h-[3px] w-3 align-middle" style={{ background: CAT_COLOR.capital[ci] }} />
                Capital · dots run with the money
              </p>
            )}
            <p className="bg-background/70 px-1 text-right text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              {touch && !full ? "Swipe sideways to turn · two fingers to zoom · tap a star" : `Drag to orbit · ${full ? "scroll" : "Ctrl/⌘ + scroll"} to zoom · click a star`}
            </p>
          </div>
        </div>
        {!wide && panel}
      </div>
    </div>
  );
}
