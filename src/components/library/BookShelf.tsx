"use client";
/**
 * BookShelf: the generic browsable 3D library.
 *
 * One volume is always featured: it slides out of the run, turns its cover to
 * you, and the editorial panel names it. Browsing rails the camera along the
 * shelf; inspecting hands over orbit, pan and zoom. The Complete Shelf, the
 * AI Roadmap and the AI Contributors shelves are all this component with
 * different volumes.
 *
 * Everything is generated: covers and spines are typeset at runtime onto 2D
 * canvases with system Georgia, so a shelf ships as data plus this file, with
 * no model files, no font files, and no downloads. Texture memory is the one
 * thing that scales with volume count, so it is budgeted explicitly:
 * spine resolution drops as the shelf grows, and cover textures are created
 * only when a volume is featured, in a small LRU that disposes the oldest.
 *
 * Interaction design credit: Mint's "Complete Shelf" (play.mint.gg), see
 * /credits. This is an original implementation of that grammar.
 */
import { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Link } from "@/lib/router-shim";

/* ---------------------------------------------------------------- *
 *  Public data model
 * ---------------------------------------------------------------- */
export interface ShelfAction {
  label: string;
  href: string;
  /** external opens a new tab; internal renders a router link */
  external?: boolean;
}

export interface ShelfDetail {
  label: string;
  href: string;
  /** small uppercase chip: VIDEO, COURSE, BOOK, REPO, PAID, ... */
  badge?: string;
  badge2?: string;
}

export interface ShelfVolume {
  id: string;
  /** Spine text, kept short so it fits the board. */
  spineTitle: string;
  title: string;
  /** The line under the title: an author, an affiliation, a week number. */
  byline: string;
  /** Small-caps eyebrow in the inspect panel: topic, phase, category. */
  eyebrow: string;
  /** One or two sentences for the inspect panel. */
  note: string;
  cloth: string;
  foil: string;
  /** height, thickness (spine width), depth, in metres at 1:1 scale. */
  dims: [number, number, number];
  motif: "rule" | "circle" | "grid" | "arc" | "chevron" | "dots" | "band";
  /** Primary action: read free, view profile, open topic. */
  primary?: ShelfAction;
  /** Inline secondary link after the byline (e.g. a contributor profile). */
  bylineLink?: ShelfAction;
  /** Line-item links in the inspect panel: a topic's resources. */
  details?: ShelfDetail[];
  /** Trailing link under the details: "all N resources in the roadmap". */
  detailsMore?: ShelfAction;
  /** Small text stamped at the foot of the cover. */
  coverFoot?: string;
}

export interface BookShelfProps {
  volumes: ShelfVolume[];
  /** Eyebrow typeset on every cover: the shelf's name. */
  coverBrand: string;
  /** Foot mark on every spine, default "VP_". */
  shelfMark?: string;
  /** Two caption lines shown top-right. */
  captions?: [string, string];
  glPower?: "high-performance" | "default";
}

/* ---------------------------------------------------------------- *
 *  Palette. Warm editorial: cream paper, walnut, brass foil.
 * ---------------------------------------------------------------- */
const CREAM = "#f2ece1";
const CREAM_DEEP = "#e6ddcd";
const WALNUT = "#5e4634";
const WALNUT_DARK = "#3c2c1f";
const PAGE = "#efe7d6";
const INK = "#2e2418";
const SERIF = "Georgia, 'Times New Roman', serif";

const GAP = 0.006;
const DECK_TOP = -0.135;
/** Featured pose, tuned so shelf volumes fill just over half the frame and
 *  the featured cover most of it at the browse camera distance. */
const OUT_Z = 0.27;
const LIFT = 0.02;

interface Placed extends ShelfVolume {
  x: number;
  index: number;
}

function layoutVolumes(volumes: ShelfVolume[]): Placed[] {
  let cursor = 0;
  const out: Placed[] = [];
  volumes.forEach((b, i) => {
    const w = b.dims[1];
    out.push({ ...b, x: cursor + w / 2, index: i });
    cursor += w + GAP;
  });
  const total = cursor - GAP;
  return out.map((b) => ({ ...b, x: b.x - total / 2 }));
}

/* ---------------------------------------------------------------- *
 *  Typeset textures: canvas 2D with system Georgia.
 * ---------------------------------------------------------------- */
function isDarkCloth(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = probe;
  }
  if (line) lines.push(line);
  return lines;
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  motif: ShelfVolume["motif"],
  cx: number,
  cy: number,
  R: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  if (motif === "rule") {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - R, cy + i * R * 0.4);
      ctx.lineTo(cx + R, cy + i * R * 0.4);
      ctx.stroke();
    }
  } else if (motif === "circle") {
    const offs: [number, number, number][] = [
      [0, 0, 0.72],
      [0.16, -0.1, 0.55],
      [-0.12, 0.14, 0.62],
    ];
    for (const [ox, oy, r] of offs) {
      ctx.beginPath();
      ctx.arc(cx + ox * R, cy + oy * R, R * r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (motif === "grid") {
    const s = R * 0.3, gap = R * 0.52;
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) ctx.strokeRect(cx + i * gap - s / 2, cy + j * gap - s / 2, s, s);
  } else if (motif === "arc") {
    for (const r of [0.5, 0.78]) {
      ctx.beginPath();
      ctx.arc(cx, cy + R * 0.3, R * r, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.9, cy + R * 0.3);
    ctx.lineTo(cx + R * 0.9, cy + R * 0.3);
    ctx.stroke();
  } else if (motif === "chevron") {
    for (let i = 0; i < 3; i++) {
      const y = cy - R * 0.35 + i * R * 0.35;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.55, y + R * 0.22);
      ctx.lineTo(cx, y - R * 0.1);
      ctx.lineTo(cx + R * 0.55, y + R * 0.22);
      ctx.stroke();
    }
  } else if (motif === "dots") {
    const gap = R * 0.45;
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        ctx.beginPath();
        ctx.arc(cx + i * gap, cy + j * gap, R * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (motif === "band") {
    ctx.globalAlpha = 0.7;
    ctx.fillRect(cx - R, cy - R * 0.14, R * 2, R * 0.28);
    ctx.globalAlpha = 0.85;
    for (const dy of [-R * 0.34, R * 0.34]) {
      ctx.beginPath();
      ctx.moveTo(cx - R, cy + dy);
      ctx.lineTo(cx + R, cy + dy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function finishTexture(canvas: HTMLCanvasElement, mipmaps: boolean): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (!mipmaps) {
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
  }
  return tex;
}

function makeCoverTexture(book: Placed, brand: string, hiRes: boolean): THREE.CanvasTexture {
  const W = hiRes ? 720 : 560, H = hiRes ? 1024 : 800;
  const s = W / 720; // scale all metrics from the 720-wide design
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = isDarkCloth(book.cloth);
  const ink = dark ? "#f2e9d8" : INK;
  const sub = dark ? "rgba(242,233,216,0.72)" : "rgba(46,36,24,0.68)";

  ctx.fillStyle = book.cloth;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createLinearGradient(0, 0, W, 0);
  vg.addColorStop(0, "rgba(0,0,0,0.10)");
  vg.addColorStop(0.12, "rgba(0,0,0,0)");
  vg.addColorStop(0.88, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.10)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = book.foil;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2.5 * s;
  ctx.strokeRect(38 * s, 38 * s, W - 76 * s, H - 76 * s);
  ctx.lineWidth = 1;
  ctx.strokeRect(50 * s, 50 * s, W - 100 * s, H - 100 * s);
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.fillStyle = sub;
  ctx.font = `${24 * s}px ${SERIF}`;
  ctx.fillText(brand.toUpperCase().split("").join(" "), W / 2, 118 * s);

  ctx.fillStyle = ink;
  let size = 62 * s;
  ctx.font = `bold ${size}px ${SERIF}`;
  let lines = wrapLines(ctx, book.title, W - 170 * s);
  if (lines.length > 3) {
    size = 50 * s;
    ctx.font = `bold ${size}px ${SERIF}`;
    lines = wrapLines(ctx, book.title, W - 170 * s);
  }
  let y = 208 * s;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += size * 1.16;
  }
  ctx.fillStyle = sub;
  ctx.font = `italic ${32 * s}px ${SERIF}`;
  ctx.fillText(book.byline, W / 2, y + 16 * s);

  drawMotif(ctx, book.motif, W / 2, 660 * s, 150 * s, book.foil);

  if (book.coverFoot) {
    ctx.fillStyle = sub;
    ctx.font = `${22 * s}px ${SERIF}`;
    ctx.fillText(book.coverFoot.toUpperCase().split("").join(" "), W / 2, H - 78 * s);
  }
  return finishTexture(canvas, true);
}

function makeSpineTexture(book: Placed, mark: string, hiRes: boolean): THREE.CanvasTexture {
  const W = hiRes ? 240 : 144, H = hiRes ? 1024 : 640;
  const s = H / 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = isDarkCloth(book.cloth);
  const ink = dark ? "#f2e9d8" : INK;

  ctx.fillStyle = book.cloth;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createLinearGradient(0, 0, W, 0);
  vg.addColorStop(0, "rgba(0,0,0,0.14)");
  vg.addColorStop(0.25, "rgba(0,0,0,0)");
  vg.addColorStop(0.75, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.14)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = book.foil;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3 * s;
  for (const yy of [64, 78]) {
    ctx.beginPath();
    ctx.moveTo(W * 0.15, yy * s);
    ctx.lineTo(W * 0.85, yy * s);
    ctx.stroke();
  }
  for (const yy of [H - 150 * s, H - 136 * s]) {
    ctx.beginPath();
    ctx.moveTo(W * 0.15, yy);
    ctx.lineTo(W * 0.85, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(W / 2, 120 * s);
  ctx.rotate(Math.PI / 2);
  ctx.textBaseline = "middle";
  let size = 46 * s;
  ctx.font = `bold ${size}px ${SERIF}`;
  let tw = ctx.measureText(book.spineTitle).width;
  const room = H - 120 * s - 190 * s;
  if (tw > room * 0.72) {
    size = Math.max(28 * s, Math.floor((size * room * 0.72) / tw));
    ctx.font = `bold ${size}px ${SERIF}`;
    tw = ctx.measureText(book.spineTitle).width;
  }
  ctx.fillStyle = ink;
  ctx.fillText(book.spineTitle, 0, 0);
  ctx.font = `${24 * s}px ${SERIF}`;
  const aw = ctx.measureText(book.byline).width;
  if (tw + 40 * s + aw < room) {
    ctx.globalAlpha = 0.7;
    ctx.fillText(book.byline, tw + 40 * s, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.8;
  ctx.font = `${22 * s}px ${SERIF}`;
  ctx.fillText(String(book.index + 1).padStart(2, "0"), W / 2, H - 96 * s);
  ctx.font = `bold ${20 * s}px monospace`;
  ctx.fillText(mark, W / 2, H - 34 * s);
  ctx.globalAlpha = 1;

  return finishTexture(canvas, hiRes);
}

/* ---------------------------------------------------------------- *
 *  Cover LRU: covers exist only for recently featured volumes, so a
 *  hundred-volume shelf never holds a hundred cover textures.
 * ---------------------------------------------------------------- */
class CoverCache {
  private map = new Map<string, THREE.CanvasTexture>();
  constructor(private capacity: number) {}
  get(key: string, make: () => THREE.CanvasTexture): THREE.CanvasTexture {
    const hit = this.map.get(key);
    if (hit) {
      this.map.delete(key);
      this.map.set(key, hit);
      return hit;
    }
    const tex = make();
    this.map.set(key, tex);
    if (this.map.size > this.capacity) {
      const [oldKey, oldTex] = this.map.entries().next().value as [string, THREE.CanvasTexture];
      this.map.delete(oldKey);
      oldTex.dispose();
    }
    return tex;
  }
  disposeAll() {
    this.map.forEach((t) => t.dispose());
    this.map.clear();
  }
}

/* ---------------------------------------------------------------- *
 *  Selection context
 * ---------------------------------------------------------------- */
interface SelCtx {
  focus: number;
  inspecting: boolean;
  setInspecting: (v: boolean) => void;
  setTarget: (x: number) => void;
  target: number;
  layout: Placed[];
  coverBrand: string;
  shelfMark: string;
  hiRes: boolean;
  covers: CoverCache;
}
const Sel = createContext<SelCtx | null>(null);
const useSel = () => {
  const v = useContext(Sel);
  if (!v) throw new Error("BookShelf context missing");
  return v;
};

/* ---------------------------------------------------------------- *
 *  One volume
 * ---------------------------------------------------------------- */
function Volume({ book }: { book: Placed }) {
  const g = useRef<THREE.Group>(null);
  const { focus, inspecting, setInspecting, setTarget, coverBrand, shelfMark, hiRes, covers } = useSel();
  const [hovered, setHovered] = useState(false);
  const [h, t, d] = book.dims;
  const isFocus = focus === book.index;
  const baseY = DECK_TOP + h / 2;

  const mats = useMemo(() => {
    const cloth = new THREE.MeshStandardMaterial({ color: book.cloth, roughness: 0.82, metalness: 0.02 });
    const paper = new THREE.MeshStandardMaterial({ color: PAGE, roughness: 0.95 });
    const spine = new THREE.MeshStandardMaterial({ map: makeSpineTexture(book, shelfMark, hiRes), roughness: 0.8 });
    // The cover starts as bare cloth and gets its typeset texture the first
    // time this volume is featured; see the isFocus effect below.
    const cover = new THREE.MeshStandardMaterial({ color: book.cloth, roughness: 0.8 });
    return { cloth, paper, spine, cover };
  }, [book, shelfMark, hiRes]);
  useEffect(
    () => () => {
      mats.spine.map?.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  useEffect(() => {
    if (!isFocus) return;
    // Cache-owned: the LRU disposes evicted covers, the material just points.
    const tex = covers.get(book.id, () => makeCoverTexture(book, coverBrand, hiRes));
    mats.cover.map = tex;
    mats.cover.color.set("#ffffff");
    mats.cover.needsUpdate = true;
  }, [isFocus, book, mats, coverBrand, hiRes, covers]);

  useFrame((_, delta) => {
    const o = g.current;
    if (!o) return;
    const outZ = isFocus ? OUT_Z : hovered ? 0.014 : 0;
    const upY = baseY + (isFocus ? LIFT : 0);
    const yaw = isFocus ? Math.PI / 2 : 0;
    const k = Math.min(1, delta * 5.5);
    o.position.z += (outZ - o.position.z) * k;
    o.position.y += (upY - o.position.y) * k;
    o.rotation.y += (yaw - o.rotation.y) * k;
  });

  return (
    <group position={[book.x, 0, 0]}>
      <group
        ref={g}
        position={[0, baseY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isFocus) setInspecting(!inspecting);
          else setTarget(book.x);
        }}
      >
        <mesh position={[0, -0.001, -0.002]} material={mats.paper}>
          <boxGeometry args={[t * 0.88, h * 0.965, d * 0.97]} />
        </mesh>
        <RoundedBox args={[t, h, d]} radius={0.0022} smoothness={3} material={mats.cloth} />
        <mesh position={[0, 0, d / 2 + 0.0004]} material={mats.spine}>
          <planeGeometry args={[t - 0.003, h - 0.003]} />
        </mesh>
        <mesh position={[-t / 2 - 0.0004, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.cover}>
          <planeGeometry args={[d - 0.004, h - 0.004]} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Walnut casework: a deck and a lip, nothing behind.
 * ---------------------------------------------------------------- */
function Shelving({ span }: { span: number }) {
  const walnut = useMemo(
    () => new THREE.MeshStandardMaterial({ color: WALNUT, roughness: 0.55, metalness: 0.04 }),
    [],
  );
  const walnutDark = useMemo(() => new THREE.MeshStandardMaterial({ color: WALNUT_DARK, roughness: 0.7 }), []);
  useEffect(
    () => () => {
      walnut.dispose();
      walnutDark.dispose();
    },
    [walnut, walnutDark],
  );
  return (
    <group>
      <mesh position={[0, DECK_TOP - 0.026, 0.02]} material={walnut}>
        <boxGeometry args={[span, 0.052, 0.4]} />
      </mesh>
      <mesh position={[0, DECK_TOP - 0.026, 0.221]} material={walnutDark}>
        <boxGeometry args={[span, 0.052, 0.002]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Camera: railed in browse, free in inspect
 * ---------------------------------------------------------------- */
function Rig({ controls }: { controls: React.MutableRefObject<{ enabled: boolean; target: THREE.Vector3 } | null> }) {
  const { camera } = useThree();
  const { focus, inspecting, target, layout } = useSel();
  const look = useMemo(() => new THREE.Vector3(), []);
  const want = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const k = Math.min(1, delta * 3.2);
    const b = layout[focus];
    if (!b) return;
    const centerY = DECK_TOP + b.dims[0] / 2 + LIFT;
    if (!inspecting) {
      if (controls.current) controls.current.enabled = false;
      camera.position.x += (target - camera.position.x) * k;
      camera.position.y += (0.045 - camera.position.y) * k;
      camera.position.z += (0.77 - camera.position.z) * k;
      look.set(camera.position.x, 0.015, 0.04);
      camera.lookAt(look);
    } else {
      // Far enough back that the whole case fits the frame on arrival.
      want.set(b.x, centerY, OUT_Z + 0.42);
      if (controls.current?.enabled !== true) {
        camera.position.lerp(want, k);
        look.set(b.x, centerY, OUT_Z);
        camera.lookAt(look);
        if (camera.position.distanceTo(want) <= 0.02 && controls.current) {
          controls.current.target.set(b.x, centerY, OUT_Z);
          controls.current.enabled = true;
        }
      }
    }
  });
  return null;
}

/* ---------------------------------------------------------------- *
 *  Scene
 * ---------------------------------------------------------------- */
function SceneBody({ controls, span }: { controls: React.MutableRefObject<any>; span: number }) {
  const { setInspecting, layout } = useSel();
  return (
    <>
      <color attach="background" args={[CREAM]} />
      <fog attach="fog" args={[CREAM, 1.5, 4.2]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-0.7, 1.1, 0.9]} intensity={1.0} color="#fff6e8" />
      <directionalLight position={[0.9, 0.4, 0.7]} intensity={0.3} color="#ffe9cf" />
      <Environment resolution={64} frames={1}>
        <mesh scale={12}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={CREAM_DEEP} side={THREE.BackSide} />
        </mesh>
      </Environment>

      <mesh position={[0, 0, -0.6]} onClick={() => setInspecting(false)}>
        <planeGeometry args={[Math.max(14, span * 2), 6]} />
        <meshBasicMaterial color={CREAM} />
      </mesh>

      <Shelving span={span + 0.8} />
      {layout.map((b) => (
        <Volume key={b.id} book={b} />
      ))}
      <ContactShadows
        position={[0, DECK_TOP + 0.001, 0]}
        opacity={0.32}
        scale={span + 1.2}
        blur={2.2}
        far={0.5}
        color="#4a3423"
      />
      <Rig controls={controls} />
      <OrbitControls
        ref={controls}
        enabled={false}
        enablePan
        enableZoom
        minDistance={0.14}
        maxDistance={0.9}
        maxPolarAngle={Math.PI * 0.62}
        minPolarAngle={Math.PI * 0.22}
      />
    </>
  );
}

/* ---------------------------------------------------------------- *
 *  Action links, internal or external, same look.
 * ---------------------------------------------------------------- */
function ActionLink({
  action,
  style,
  className,
}: {
  action: ShelfAction;
  style?: React.CSSProperties;
  className?: string;
}) {
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {action.label}
      </a>
    );
  }
  if (action.href.startsWith("#")) {
    return (
      <a href={action.href} className={className} style={style}>
        {action.label}
      </a>
    );
  }
  return (
    <Link to={action.href} className={className} style={style}>
      {action.label}
    </Link>
  );
}

/* ---------------------------------------------------------------- *
 *  The shelf
 * ---------------------------------------------------------------- */
const BookShelf = ({ volumes, coverBrand, shelfMark = "VP_", captions, glPower = "high-performance" }: BookShelfProps) => {
  const layout = useMemo(() => layoutVolumes(volumes), [volumes]);
  const span = layout.length ? layout[layout.length - 1].x - layout[0].x : 1;
  // Above ~40 volumes the spine textures drop resolution and covers render at
  // the smaller size; the LRU keeps at most eight covers alive either way.
  const hiRes = volumes.length <= 40;
  const covers = useMemo(() => new CoverCache(8), []);
  useEffect(() => () => covers.disposeAll(), [covers]);

  const [target, setTargetRaw] = useState(layout[0]?.x ?? 0);
  const [inspecting, setInspecting] = useState(false);
  const controls = useRef<any>(null);
  const drag = useRef<{ x: number; base: number; moved: boolean } | null>(null);
  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const minX = layout[0]?.x ?? 0;
  const maxX = layout[layout.length - 1]?.x ?? 0;
  const clamp = (x: number) => Math.max(minX, Math.min(maxX, x));
  const nearestIndex = (x: number) => {
    let best = 0;
    layout.forEach((b, i) => {
      if (Math.abs(b.x - x) < Math.abs(layout[best].x - x)) best = i;
    });
    return best;
  };
  const focus = useMemo(() => nearestIndex(target), [target, layout]);
  const book = layout[focus];

  const leaveInspect = () => {
    setInspecting(false);
    if (controls.current) controls.current.enabled = false;
  };
  const setTarget = (x: number) => {
    setTargetRaw(clamp(x));
    if (inspecting) leaveInspect();
  };
  const enterInspect = () => setInspecting(true);
  const setInspectingSafe = (v: boolean) => (v ? enterInspect() : leaveInspect());

  const step = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(layout.length - 1, focus + dir));
    setTarget(layout[next].x);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
      if (e.key === "Enter" && !inspecting) enterInspect();
      if (e.key === "Escape" && inspecting) leaveInspect();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const ctx: SelCtx = {
    focus,
    inspecting,
    setInspecting: setInspectingSafe,
    setTarget,
    target,
    layout,
    coverBrand,
    shelfMark,
    hiRes,
    covers,
  };

  return (
    <div ref={wrap} className="relative w-full h-full" style={{ background: CREAM }}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [layout[0]?.x ?? 0, 0.045, 0.77], fov: 34, near: 0.01, far: 12 }}
        gl={{ antialias: true, powerPreference: glPower }}
        onWheel={(e) => {
          if (inspecting) return;
          setTargetRaw((t) => clamp(t + e.deltaY * 0.0006));
          if (wheelSnap.current) clearTimeout(wheelSnap.current);
          wheelSnap.current = setTimeout(() => {
            setTargetRaw((t) => layout[nearestIndex(t)].x);
          }, 260);
        }}
        onPointerDown={(e) => {
          if (inspecting) return;
          drag.current = { x: e.clientX, base: target, moved: false };
        }}
        onPointerMove={(e) => {
          if (!drag.current || inspecting) return;
          const dx = (e.clientX - drag.current.x) / (wrap.current?.clientWidth || 1);
          if (Math.abs(e.clientX - drag.current.x) > 4) drag.current.moved = true;
          setTargetRaw(clamp(drag.current.base - dx * span * 1.2));
        }}
        onPointerUp={() => {
          if (drag.current?.moved) setTargetRaw((t) => layout[nearestIndex(t)].x);
          drag.current = null;
        }}
        onPointerLeave={() => {
          if (drag.current?.moved) setTargetRaw((t) => layout[nearestIndex(t)].x);
          drag.current = null;
        }}
        style={{ touchAction: "none", cursor: inspecting ? "default" : "grab" }}
      >
        <Suspense fallback={null}>
          <Sel.Provider value={ctx}>
            <SceneBody controls={controls} span={span} />
          </Sel.Provider>
        </Suspense>
      </Canvas>

      <div
        className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(40,26,15,0) 0%, rgba(40,26,15,0.28) 100%)" }}
      />

      {captions && (
        <div className="absolute top-5 right-6 text-right pointer-events-none hidden sm:block">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "#8a7860" }}>
            {captions[0]}
          </p>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "#b3a58c" }}>
            {captions[1]}
          </p>
        </div>
      )}

      {!inspecting && (
        <>
          <button
            type="button"
            aria-label="Previous volume"
            onClick={() => step(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border grid place-items-center transition-colors"
            style={{ borderColor: "#c9bba1", color: "#6b5c46", background: "rgba(255,253,248,0.55)" }}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next volume"
            onClick={() => step(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border grid place-items-center transition-colors"
            style={{ borderColor: "#c9bba1", color: "#6b5c46", background: "rgba(255,253,248,0.55)" }}
          >
            →
          </button>
        </>
      )}

      {book && !inspecting && (
        <div
          className="absolute left-0 bottom-10 sm:bottom-12 pt-10 pb-6 pl-6 sm:pl-10 pr-16 sm:pr-24 max-w-[92%] sm:max-w-[46%] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(242,236,225,0.94) 55%, rgba(242,236,225,0) 100%)",
          }}
        >
          <p className="font-mono text-[11px] tracking-[0.2em] mb-2 flex items-center gap-3" style={{ color: "#8a7860" }}>
            {String(focus + 1).padStart(2, "0")}
            <span className="inline-block w-10 h-px" style={{ background: "#c9bba1" }} />
            {String(layout.length).padStart(2, "0")}
          </p>
          <h2
            className="text-3xl sm:text-5xl font-bold leading-[1.04] mb-2"
            style={{ fontFamily: SERIF, color: INK }}
          >
            {book.title}
          </h2>
          <p className="italic text-base sm:text-lg mb-5" style={{ fontFamily: SERIF, color: "#6b5c46" }}>
            {book.byline}
          </p>
          <div className="flex items-center gap-6 pointer-events-auto">
            <button
              type="button"
              onClick={enterInspect}
              className="font-mono text-[11px] uppercase tracking-[0.18em] pb-1 border-b transition-colors"
              style={{ color: INK, borderColor: INK }}
            >
              Inspect volume ↗
            </button>
            {book.primary && (
              <ActionLink
                action={book.primary}
                className="font-mono text-[11px] uppercase tracking-[0.18em] pb-1 transition-colors"
                style={{ color: "#8a7860" }}
              />
            )}
          </div>
        </div>
      )}

      {book && inspecting && (
        <div className="absolute left-0 right-0 bottom-8 p-5 sm:p-7 pointer-events-none">
          <div
            className="max-w-xl mx-auto p-5 sm:p-6 border pointer-events-auto"
            style={{ background: "rgba(255,253,248,0.94)", borderColor: "#d8cbb4" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#8a7860" }}>
              {book.eyebrow}
            </p>
            <h3
              className="text-xl sm:text-2xl font-bold mt-1.5 mb-1 leading-tight"
              style={{ fontFamily: SERIF, color: INK }}
            >
              {book.title}
            </h3>
            <p className="font-mono text-xs mb-3" style={{ color: "#6b5c46" }}>
              {book.byline}
              {book.bylineLink && (
                <>
                  {" · "}
                  <ActionLink
                    action={book.bylineLink}
                    className="underline decoration-dotted"
                    style={{ color: "#7a5c2e" }}
                  />
                </>
              )}
            </p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: "#4a3f30" }}>
              {book.note}
            </p>
            {book.details && book.details.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto pr-1 space-y-1.5">
                {book.details.map((r) => (
                  <a
                    key={r.href + r.label}
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-baseline gap-2 group"
                  >
                    {r.badge && (
                      <span
                        className="font-mono text-[8px] uppercase tracking-widest border px-1 py-0.5 shrink-0"
                        style={{ borderColor: "#d8cbb4", color: "#8a7860" }}
                      >
                        {r.badge}
                      </span>
                    )}
                    {r.badge2 && (
                      <span
                        className="font-mono text-[8px] uppercase tracking-widest border px-1 py-0.5 shrink-0"
                        style={{ borderColor: "#b08a3e", color: "#8a6d2e" }}
                      >
                        {r.badge2}
                      </span>
                    )}
                    <span
                      className="font-mono text-[11px] leading-snug underline-offset-2 group-hover:underline"
                      style={{ color: "#4a3f30" }}
                    >
                      {r.label}
                    </span>
                  </a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              {book.primary && (
                <ActionLink
                  action={book.primary}
                  className="font-mono text-[11px] uppercase tracking-wider border px-3 py-2"
                  style={{ borderColor: "#7a5c2e", color: "#5a4220" }}
                />
              )}
              {book.detailsMore && (
                <ActionLink
                  action={book.detailsMore}
                  className="font-mono text-[11px] uppercase tracking-wider"
                  style={{ color: "#7a5c2e" }}
                />
              )}
              <button
                type="button"
                onClick={leaveInspect}
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{ color: "#8a7860" }}
              >
                Back to the shelf
              </button>
              <span className="font-mono text-[10px]" style={{ color: "#a1927b" }}>
                drag to orbit · scroll to zoom
              </span>
            </div>
          </div>
        </div>
      )}

      {!inspecting && (
        <div className="absolute left-0 right-0 bottom-0 h-10 flex items-center px-6 sm:px-10 gap-4">
          <div className="relative flex-1 h-full">
            {layout.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={b.title}
                onClick={() => setTarget(b.x)}
                className="absolute top-1/2 -translate-y-1/2 transition-all"
                style={{
                  left: `${(i / Math.max(1, layout.length - 1)) * 100}%`,
                  width: i === focus ? 3 : 1,
                  marginLeft: i === focus ? -1.5 : -0.5,
                  height: i === focus ? 20 : 10,
                  background: i === focus ? "#f2e9d8" : "rgba(242,233,216,0.5)",
                }}
              />
            ))}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none"
              style={{ background: "rgba(242,233,216,0.3)" }}
            />
          </div>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.22em] shrink-0 hidden sm:block"
            style={{ color: "rgba(242,233,216,0.75)" }}
          >
            drag · scroll · arrow keys
          </span>
        </div>
      )}
    </div>
  );
};

export default BookShelf;
