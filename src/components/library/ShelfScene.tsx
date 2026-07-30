"use client";
/**
 * The Complete Shelf.
 *
 * A continuous walnut shelf of nineteen clothbound volumes. One volume is
 * always featured: it slides out of the run, turns its cover to you, and the
 * editorial panel names it. Browsing moves along the shelf; inspecting hands
 * you orbit, pan and zoom on the featured book.
 *
 * Every cover and spine is typeset at runtime onto a 2D canvas with the same
 * serif the panel uses, then applied as a texture. That keeps the whole
 * library procedural (no model files, no font files, no downloads) while
 * still giving each volume real typography: eyebrow, title, author, an
 * abstract foil motif, and a spine that reads top to bottom like a spine.
 */
import { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { shelfBooks, type ShelfBook } from "@/data/libraryShelf";

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

/** Book pitch along the shelf, from real thicknesses plus a hair of air. */
const GAP = 0.006;
/** Top surface of the walnut deck. Books SIT on this, so short volumes and
 *  tall ones share a baseline the way they do on a real shelf. */
const DECK_TOP = -0.135;
/** Featured-book pose: pulled toward camera, lifted, cover turned out.
 *  With the browse camera at z 0.77 these land the reference proportions:
 *  shelf volumes fill just over half the frame, the featured cover most of it. */
const OUT_Z = 0.27;
const LIFT = 0.02;

interface Placed extends ShelfBook {
  x: number;
  index: number;
}

const LAYOUT: Placed[] = (() => {
  let cursor = 0;
  const out: Placed[] = [];
  shelfBooks.forEach((b, i) => {
    const w = b.dims[1];
    out.push({ ...b, x: cursor + w / 2, index: i });
    cursor += w + GAP;
  });
  const total = cursor - GAP;
  return out.map((b) => ({ ...b, x: b.x - total / 2 }));
})();

const SHELF_SPAN = LAYOUT.length ? LAYOUT[LAYOUT.length - 1].x - LAYOUT[0].x : 1;

const nearestIndex = (x: number) => {
  let best = 0;
  LAYOUT.forEach((b, i) => {
    if (Math.abs(b.x - x) < Math.abs(LAYOUT[best].x - x)) best = i;
  });
  return best;
};

/* ---------------------------------------------------------------- *
 *  Selection context
 * ---------------------------------------------------------------- */
interface SelCtx {
  focus: number;
  inspecting: boolean;
  setInspecting: (v: boolean) => void;
  setTarget: (x: number) => void;
  target: number;
}
const Sel = createContext<SelCtx>({
  focus: 0,
  inspecting: false,
  setInspecting: () => {},
  setTarget: () => {},
  target: 0,
});

/* ---------------------------------------------------------------- *
 *  Typeset textures. Canvas 2D with system Georgia: real typography
 *  with zero font files and zero network fetches.
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
  motif: ShelfBook["motif"],
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
    // Overlapping offset circles, the hand-drawn-orbit look of the reference.
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

function makeCoverTexture(book: Placed): THREE.CanvasTexture {
  const W = 720, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = isDarkCloth(book.cloth);
  const ink = dark ? "#f2e9d8" : INK;
  const sub = dark ? "rgba(242,233,216,0.72)" : "rgba(46,36,24,0.68)";

  ctx.fillStyle = book.cloth;
  ctx.fillRect(0, 0, W, H);
  // faint edge darkening so the cloth reads as material, not flat fill
  const vg = ctx.createLinearGradient(0, 0, W, 0);
  vg.addColorStop(0, "rgba(0,0,0,0.10)");
  vg.addColorStop(0.12, "rgba(0,0,0,0)");
  vg.addColorStop(0.88, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.10)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // double border rule
  ctx.strokeStyle = book.foil;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(38, 38, W - 76, H - 76);
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, W - 100, H - 100);
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  // eyebrow
  ctx.fillStyle = sub;
  ctx.font = `24px ${SERIF}`;
  ctx.fillText("T H E   C O M P L E T E   S H E L F", W / 2, 118);

  // title, wrapped
  ctx.fillStyle = ink;
  let size = 62;
  ctx.font = `bold ${size}px ${SERIF}`;
  let lines = wrapLines(ctx, book.title, W - 170);
  if (lines.length > 3) {
    size = 50;
    ctx.font = `bold ${size}px ${SERIF}`;
    lines = wrapLines(ctx, book.title, W - 170);
  }
  let y = 208;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += size * 1.16;
  }
  // author
  ctx.fillStyle = sub;
  ctx.font = `italic 32px ${SERIF}`;
  ctx.fillText(book.author, W / 2, y + 16);

  // motif in the lower middle
  drawMotif(ctx, book.motif, W / 2, 660, 150, book.foil);

  // bottom label
  ctx.fillStyle = sub;
  ctx.font = `22px ${SERIF}`;
  ctx.fillText("F R E E   T O   R E A D   O N L I N E", W / 2, H - 78);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeSpineTexture(book: Placed): THREE.CanvasTexture {
  const W = 240, H = 1024;
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

  // foil rules top and bottom
  ctx.strokeStyle = book.foil;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  for (const yy of [64, 78]) {
    ctx.beginPath();
    ctx.moveTo(36, yy);
    ctx.lineTo(W - 36, yy);
    ctx.stroke();
  }
  for (const yy of [H - 150, H - 136]) {
    ctx.beginPath();
    ctx.moveTo(36, yy);
    ctx.lineTo(W - 36, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // title down the spine
  ctx.save();
  ctx.translate(W / 2, 120);
  ctx.rotate(Math.PI / 2);
  ctx.textBaseline = "middle";
  let size = 46;
  ctx.font = `bold ${size}px ${SERIF}`;
  let tw = ctx.measureText(book.spineTitle).width;
  const room = H - 120 - 190;
  if (tw > room * 0.72) {
    size = Math.max(28, Math.floor((size * room * 0.72) / tw));
    ctx.font = `bold ${size}px ${SERIF}`;
    tw = ctx.measureText(book.spineTitle).width;
  }
  ctx.fillStyle = ink;
  ctx.fillText(book.spineTitle, 0, 0);
  // author after the title when there is room for it
  ctx.font = `24px ${SERIF}`;
  const aw = ctx.measureText(book.author).width;
  if (tw + 40 + aw < room) {
    ctx.globalAlpha = 0.7;
    ctx.fillText(book.author, tw + 40, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // volume number and mark at the foot
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.8;
  ctx.font = `22px ${SERIF}`;
  ctx.fillText(String(book.index + 1).padStart(2, "0"), W / 2, H - 96);
  ctx.font = `bold 20px monospace`;
  ctx.fillText("VP_", W / 2, H - 34);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------------------------------------------------------------- *
 *  One volume
 * ---------------------------------------------------------------- */
function Volume({ book }: { book: Placed }) {
  const g = useRef<THREE.Group>(null);
  const { focus, inspecting, setInspecting, setTarget } = useContext(Sel);
  const [hovered, setHovered] = useState(false);
  const [h, t, d] = book.dims;
  const isFocus = focus === book.index;
  const baseY = DECK_TOP + h / 2;

  const mats = useMemo(() => {
    const cloth = new THREE.MeshStandardMaterial({ color: book.cloth, roughness: 0.82, metalness: 0.02 });
    const paper = new THREE.MeshStandardMaterial({ color: PAGE, roughness: 0.95 });
    const cover = new THREE.MeshStandardMaterial({ map: makeCoverTexture(book), roughness: 0.8 });
    const spine = new THREE.MeshStandardMaterial({ map: makeSpineTexture(book), roughness: 0.8 });
    return { cloth, paper, cover, spine };
  }, [book]);
  useEffect(
    () => () => {
      mats.cover.map?.dispose();
      mats.spine.map?.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  useFrame((_, delta) => {
    const o = g.current;
    if (!o) return;
    // The featured volume slides out, lifts, and turns its cover to camera.
    // Hover eases a book out a few millimetres: the entire affordance.
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
        {/* text block, inset so the cloth reads as a wrapped case */}
        <mesh position={[0, -0.001, -0.002]} material={mats.paper}>
          <boxGeometry args={[t * 0.88, h * 0.965, d * 0.97]} />
        </mesh>
        {/* the case */}
        <RoundedBox args={[t, h, d]} radius={0.0022} smoothness={3} material={mats.cloth} />
        {/* typeset spine, facing the aisle */}
        <mesh position={[0, 0, d / 2 + 0.0004]} material={mats.spine}>
          <planeGeometry args={[t - 0.003, h - 0.003]} />
        </mesh>
        {/* typeset front cover on the -x face, revealed when the book turns */}
        <mesh position={[-t / 2 - 0.0004, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.cover}>
          <planeGeometry args={[d - 0.004, h - 0.004]} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Walnut casework: a deck and a lip, nothing behind. The reference
 *  reads open and editorial precisely because there is no bookcase
 *  cave around the run, just volumes standing on a plank.
 * ---------------------------------------------------------------- */
function Shelving() {
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
  const span = SHELF_SPAN + 0.8;
  return (
    <group>
      {/* deck the books stand on */}
      <mesh position={[0, DECK_TOP - 0.026, 0.02]} material={walnut}>
        <boxGeometry args={[span, 0.052, 0.4]} />
      </mesh>
      {/* darker front face catches the shadowed foot of the frame */}
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
  const { focus, inspecting, target } = useContext(Sel);
  const look = useMemo(() => new THREE.Vector3(), []);
  const want = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const k = Math.min(1, delta * 3.2);
    const b = LAYOUT[focus];
    const centerY = DECK_TOP + b.dims[0] / 2 + LIFT;
    if (!inspecting) {
      if (controls.current) controls.current.enabled = false;
      camera.position.x += (target - camera.position.x) * k;
      camera.position.y += (0.045 - camera.position.y) * k;
      camera.position.z += (0.77 - camera.position.z) * k;
      look.set(camera.position.x, 0.015, 0.04);
      camera.lookAt(look);
    } else {
      // Far enough back that the whole case fits the frame on arrival; the
      // reader zooms from there.
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
function SceneBody({ controls }: { controls: React.MutableRefObject<any> }) {
  const { setInspecting } = useContext(Sel);
  return (
    <>
      <color attach="background" args={[CREAM]} />
      <fog attach="fog" args={[CREAM, 1.5, 4.2]} />
      {/* soft editorial key from high left, warm fill from the right */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[-0.7, 1.1, 0.9]} intensity={1.0} color="#fff6e8" />
      <directionalLight position={[0.9, 0.4, 0.7]} intensity={0.3} color="#ffe9cf" />
      <Environment resolution={64} frames={1}>
        <mesh scale={12}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={CREAM_DEEP} side={THREE.BackSide} />
        </mesh>
      </Environment>

      {/* clicking the empty room puts the featured book back */}
      <mesh position={[0, 0, -0.6]} onClick={() => setInspecting(false)}>
        <planeGeometry args={[14, 6]} />
        <meshBasicMaterial color={CREAM} />
      </mesh>

      <Shelving />
      {LAYOUT.map((b) => (
        <Volume key={b.id} book={b} />
      ))}
      <ContactShadows
        position={[0, DECK_TOP + 0.001, 0]}
        opacity={0.32}
        scale={SHELF_SPAN + 1.2}
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
 *  Public component: canvas plus the editorial chrome
 * ---------------------------------------------------------------- */
const ShelfScene = ({ glPower = "high-performance" }: { glPower?: "high-performance" | "default" }) => {
  const [target, setTargetRaw] = useState(LAYOUT[0]?.x ?? 0);
  const [inspecting, setInspecting] = useState(false);
  const controls = useRef<any>(null);
  const drag = useRef<{ x: number; base: number; moved: boolean } | null>(null);
  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const minX = LAYOUT[0]?.x ?? 0;
  const maxX = LAYOUT[LAYOUT.length - 1]?.x ?? 0;
  const clamp = (x: number) => Math.max(minX, Math.min(maxX, x));
  const focus = useMemo(() => nearestIndex(target), [target]);
  const book = LAYOUT[focus];

  const setTarget = (x: number) => {
    setTargetRaw(clamp(x));
    if (inspecting) leaveInspect();
  };
  const leaveInspect = () => {
    setInspecting(false);
    if (controls.current) controls.current.enabled = false;
  };
  const enterInspect = () => setInspecting(true);
  const setInspectingSafe = (v: boolean) => (v ? enterInspect() : leaveInspect());

  const step = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(LAYOUT.length - 1, focus + dir));
    setTarget(LAYOUT[next].x);
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

  return (
    <div ref={wrap} className="relative w-full h-full" style={{ background: CREAM }}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [LAYOUT[0]?.x ?? 0, 0.045, 0.77], fov: 34, near: 0.01, far: 12 }}
        gl={{ antialias: true, powerPreference: glPower }}
        onWheel={(e) => {
          if (inspecting) return;
          setTargetRaw((t) => clamp(t + e.deltaY * 0.0006));
          if (wheelSnap.current) clearTimeout(wheelSnap.current);
          wheelSnap.current = setTimeout(() => {
            setTargetRaw((t) => LAYOUT[nearestIndex(t)].x);
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
          setTargetRaw(clamp(drag.current.base - dx * SHELF_SPAN * 1.2));
        }}
        onPointerUp={() => {
          if (drag.current?.moved) setTargetRaw((t) => LAYOUT[nearestIndex(t)].x);
          drag.current = null;
        }}
        onPointerLeave={() => {
          if (drag.current?.moved) setTargetRaw((t) => LAYOUT[nearestIndex(t)].x);
          drag.current = null;
        }}
        style={{ touchAction: "none", cursor: inspecting ? "default" : "grab" }}
      >
        <Suspense fallback={null}>
          <Sel.Provider value={{ focus, inspecting, setInspecting: setInspectingSafe, setTarget, target }}>
            <SceneBody controls={controls} />
          </Sel.Provider>
        </Suspense>
      </Canvas>

      {/* grounded fade at the foot of the frame */}
      <div
        className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(40,26,15,0) 0%, rgba(40,26,15,0.28) 100%)" }}
      />

      {/* top-right: the count line, reference style */}
      <div className="absolute top-5 right-6 text-right pointer-events-none hidden sm:block">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "#8a7860" }}>
          {String(LAYOUT.length).padStart(2, "0")} volumes · all free
        </p>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "#b3a58c" }}>
          01 continuous shelf
        </p>
      </div>

      {/* prev / next round buttons at mid height */}
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

      {/* the editorial panel: index, big serif title, author, actions */}
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
            {String(LAYOUT.length).padStart(2, "0")}
          </p>
          <h2
            className="text-3xl sm:text-5xl font-bold leading-[1.04] mb-2"
            style={{ fontFamily: SERIF, color: INK }}
          >
            {book.title}
          </h2>
          <p className="italic text-base sm:text-lg mb-5" style={{ fontFamily: SERIF, color: "#6b5c46" }}>
            {book.author}
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
            <a
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.18em] pb-1 transition-colors"
              style={{ color: "#8a7860" }}
            >
              Read free ↗
            </a>
          </div>
        </div>
      )}

      {/* inspect panel */}
      {book && inspecting && (
        <div className="absolute left-0 right-0 bottom-8 p-5 sm:p-7 pointer-events-none">
          <div
            className="max-w-xl mx-auto p-5 sm:p-6 border pointer-events-auto"
            style={{ background: "rgba(255,253,248,0.94)", borderColor: "#d8cbb4" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#8a7860" }}>
              {book.topic}
            </p>
            <h3
              className="text-xl sm:text-2xl font-bold mt-1.5 mb-1 leading-tight"
              style={{ fontFamily: SERIF, color: INK }}
            >
              {book.title}
            </h3>
            <p className="font-mono text-xs mb-3" style={{ color: "#6b5c46" }}>
              {book.author}
              {book.contributorId && (
                <>
                  {" · "}
                  <a
                    href={`/ai-contributors/${book.contributorId}`}
                    className="underline decoration-dotted"
                    style={{ color: "#7a5c2e" }}
                  >
                    profile
                  </a>
                </>
              )}
            </p>
            <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: "#4a3f30" }}>
              {book.note}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <a
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] uppercase tracking-wider border px-3 py-2"
                style={{ borderColor: "#7a5c2e", color: "#5a4220" }}
              >
                Read it free →
              </a>
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

      {/* bottom ruler scrubber */}
      {!inspecting && (
        <div className="absolute left-0 right-0 bottom-0 h-10 flex items-center px-6 sm:px-10 gap-4">
          <div className="relative flex-1 h-full">
            {LAYOUT.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={b.title}
                onClick={() => setTarget(b.x)}
                className="absolute top-1/2 -translate-y-1/2 transition-all"
                style={{
                  left: `${(i / (LAYOUT.length - 1)) * 100}%`,
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

export default ShelfScene;
