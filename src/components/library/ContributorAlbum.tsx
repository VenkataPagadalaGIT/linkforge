"use client";
/**
 * ContributorAlbum: the Top 100 as ONE book with a hundred photo pages.
 *
 * A hundred spines ask the reader to squint; a single opened volume asks them
 * to turn a page, which everybody already knows how to do. Each page carries
 * one person: their photo (or a monogram when we hold no photo), name,
 * affiliation and rank, and clicking a page opens the full profile.
 *
 * Construction: the book is two visible page planes over growing/shrinking
 * page stacks, plus a single animated leaf that only exists mid-turn. The
 * flying leaf shows the receding page on its front and the newly revealed
 * page on its back, so fifty leaves never exist as geometry at once. Page
 * faces are typeset onto canvases (system Georgia again); photos load lazily
 * into the canvas and the texture updates when they arrive. A small LRU keeps
 * the texture population bounded no matter how far someone reads.
 */
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Link, useNavigate } from "@/lib/router-shim";
import { aiContributors, type AIContributor } from "@/data/aiContributors";

const CREAM = "#f2ece1";
const CREAM_DEEP = "#e6ddcd";
const WALNUT = "#5e4634";
const WALNUT_DARK = "#3c2c1f";
const PAPER = "#f7f1e6";
const INK = "#2e2418";
const SERIF = "Georgia, 'Times New Roman', serif";

/** Page size in metres; the open spread is two pages wide. */
const PAGE_W = 0.185;
const PAGE_H = 0.26;
const DECK_TOP = -0.155;
const BOOK_Y = DECK_TOP + PAGE_H / 2 + 0.018;
/** Seconds for one page turn. */
const FLIP_S = 0.55;

const people = [...aiContributors].sort((a, b) => a.rank - b.rank);
/** Leaf k: front face = person 2k, back face = person 2k+1. */
const LEAF_COUNT = Math.ceil(people.length / 2);
const MONOGRAM_CLOTHS = ["#4a5c6a", "#7d8471", "#8b6f5c", "#5f7470", "#7a4f4a", "#6a5a7a", "#3f5245", "#35424a"];

/* ---------------------------------------------------------------- *
 *  Page faces: -1 = title page, people.length = colophon.
 * ---------------------------------------------------------------- */
function drawPageChrome(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createLinearGradient(0, 0, W, 0);
  vg.addColorStop(0, "rgba(90,66,32,0.10)");
  vg.addColorStop(0.1, "rgba(0,0,0,0)");
  vg.addColorStop(0.9, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(90,66,32,0.06)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(122,92,46,0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, W - 60, H - 60);
}

function makePageTexture(index: number): { tex: THREE.CanvasTexture; person?: AIContributor } {
  const W = 620, H = 880;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  drawPageChrome(ctx, W, H);
  ctx.textAlign = "center";

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  if (index === -1) {
    // Title page
    ctx.fillStyle = "rgba(46,36,24,0.65)";
    ctx.font = `26px ${SERIF}`;
    ctx.fillText("T H E   A I   N O T E B O O K", W / 2, 200);
    ctx.fillStyle = INK;
    ctx.font = `bold 72px ${SERIF}`;
    ctx.fillText("Top 100", W / 2, 330);
    ctx.fillText("AI Contributors", W / 2, 415);
    ctx.font = `italic 30px ${SERIF}`;
    ctx.fillStyle = "rgba(46,36,24,0.7)";
    ctx.fillText("One page per person.", W / 2, 500);
    ctx.fillText("Turn the pages, meet the field.", W / 2, 545);
    ctx.font = `24px ${SERIF}`;
    ctx.fillText("2026 edition", W / 2, 700);
    ctx.font = `bold 22px monospace`;
    ctx.fillText("VP_", W / 2, H - 80);
    return { tex };
  }
  if (index >= people.length) {
    // Colophon
    ctx.fillStyle = INK;
    ctx.font = `bold 44px ${SERIF}`;
    ctx.fillText("That is the hundred.", W / 2, 330);
    ctx.font = `italic 28px ${SERIF}`;
    ctx.fillStyle = "rgba(46,36,24,0.7)";
    ctx.fillText("The full directory, with profiles,", W / 2, 420);
    ctx.fillText("timelines and reading lists,", W / 2, 460);
    ctx.fillText("continues below this book.", W / 2, 500);
    return { tex };
  }

  const p = people[index];
  // rank
  ctx.fillStyle = "rgba(122,92,46,0.8)";
  ctx.font = `24px ${SERIF}`;
  ctx.fillText(`Nº ${String(p.rank).padStart(2, "0")}`, W / 2, 78);

  // photo frame
  const px = W / 2 - 190, py = 110, ps = 380;
  ctx.strokeStyle = "rgba(122,92,46,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px - 6, py - 6, ps + 12, ps + 12);

  const finishText = () => {
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    let size = 46;
    ctx.font = `bold ${size}px ${SERIF}`;
    if (ctx.measureText(p.name).width > W - 120) {
      size = 38;
      ctx.font = `bold ${size}px ${SERIF}`;
    }
    ctx.fillText(p.name, W / 2, py + ps + 86);
    ctx.font = `italic 26px ${SERIF}`;
    ctx.fillStyle = "rgba(46,36,24,0.72)";
    const aff = p.affiliation.length > 44 ? p.affiliation.slice(0, 43) + "…" : p.affiliation;
    ctx.fillText(aff, W / 2, py + ps + 128);
    ctx.font = `20px ${SERIF}`;
    ctx.fillStyle = "rgba(122,92,46,0.75)";
    const seg = p.segment.toUpperCase();
    ctx.fillText(seg.length > 40 ? seg.slice(0, 40) : seg, W / 2, py + ps + 168);
    ctx.font = `18px ${SERIF}`;
    ctx.fillStyle = "rgba(46,36,24,0.45)";
    ctx.fillText("C L I C K   T O   O P E N   P R O F I L E", W / 2, H - 56);
  };

  if (p.photoUrl) {
    // paper placeholder while the photo loads
    ctx.fillStyle = "rgba(122,92,46,0.08)";
    ctx.fillRect(px, py, ps, ps);
    finishText();
    const img = new Image();
    img.onload = () => {
      // cover-crop into the square
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, px, py, ps, ps);
      tex.needsUpdate = true;
    };
    img.src = p.photoUrl;
  } else {
    // monogram
    const cloth = MONOGRAM_CLOTHS[index % MONOGRAM_CLOTHS.length];
    ctx.fillStyle = cloth;
    ctx.fillRect(px, py, ps, ps);
    ctx.fillStyle = "rgba(242,233,216,0.92)";
    ctx.font = `bold 130px ${SERIF}`;
    const initials = p.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");
    ctx.fillText(initials, W / 2, py + ps / 2 + 45);
    finishText();
  }
  return { tex, person: p };
}

/** Mirrored copy for the back face of the flying leaf. */
function mirrored(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  const t = tex.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.x = -1;
  t.offset.x = 1;
  t.needsUpdate = true;
  return t;
}

class PageCache {
  private map = new Map<number, { tex: THREE.CanvasTexture }>();
  get(i: number): THREE.CanvasTexture {
    const hit = this.map.get(i);
    if (hit) {
      this.map.delete(i);
      this.map.set(i, hit);
      return hit.tex;
    }
    const made = makePageTexture(i);
    this.map.set(i, made);
    if (this.map.size > 16) {
      const [k, v] = this.map.entries().next().value as [number, { tex: THREE.CanvasTexture }];
      this.map.delete(k);
      v.tex.dispose();
    }
    return made.tex;
  }
  disposeAll() {
    this.map.forEach((v) => v.tex.dispose());
    this.map.clear();
  }
}

/* ---------------------------------------------------------------- *
 *  The book
 * ---------------------------------------------------------------- */
interface FlipState {
  dir: 1 | -1;
  t: number;
  /** leaf being turned (forward: leaf k; backward: leaf k-1) */
  leaf: number;
}

function Book({
  spread,
  flip,
  onPageClick,
  cache,
}: {
  spread: number;
  flip: FlipState | null;
  onPageClick: (personIndex: number) => void;
  cache: PageCache;
}) {
  const leafRef = useRef<THREE.Group>(null);

  // Visible faces for the current spread. During a forward flip the right
  // display already shows the page beneath the flying leaf; the left display
  // switches when the leaf lands (the parent advances `spread` at that point).
  const leftIndex = spread === 0 ? -1 : 2 * spread - 1;
  const rightUnder = flip && flip.dir === 1 ? 2 * (spread + 1) : 2 * spread;
  const leftUnder = flip && flip.dir === -1 ? (spread - 1 === 0 ? -1 : 2 * (spread - 1) - 1) : leftIndex;

  const leftTex = cache.get(Math.min(leftUnder, people.length));
  const rightTex = cache.get(Math.min(rightUnder, people.length));

  // Flying leaf faces
  const flyFrontTex = flip ? cache.get(Math.min(flip.dir === 1 ? 2 * flip.leaf : 2 * flip.leaf, people.length)) : null;
  const flyBackRaw = flip ? cache.get(Math.min(2 * flip.leaf + 1, people.length)) : null;
  const flyBackTex = useMemo(() => (flyBackRaw ? mirrored(flyBackRaw) : null), [flyBackRaw]);
  useEffect(() => () => flyBackTex?.dispose(), [flyBackTex]);

  useFrame(() => {
    const g = leafRef.current;
    if (!g || !flip) return;
    const e = flip.t < 0.5 ? 2 * flip.t * flip.t : 1 - Math.pow(-2 * flip.t + 2, 2) / 2; // easeInOutQuad
    const theta = flip.dir === 1 ? Math.PI * e : Math.PI * (1 - e);
    g.rotation.y = -theta;
  });

  const mats = useMemo(
    () => ({
      paperEdge: new THREE.MeshStandardMaterial({ color: "#e8dfcc", roughness: 0.9 }),
      cover: new THREE.MeshStandardMaterial({ color: "#46414d", roughness: 0.75 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const leftStack = Math.max(0.0015, spread * 0.0011);
  const rightStack = Math.max(0.0015, (LEAF_COUNT - spread) * 0.0011);
  const leftPerson = leftUnder >= 0 && leftUnder < people.length ? leftUnder : null;
  const rightPerson = rightUnder >= 0 && rightUnder < people.length ? rightUnder : null;

  return (
    <group position={[0, BOOK_Y, 0]}>
      {/* covers, slightly larger than the pages */}
      <RoundedBox args={[PAGE_W + 0.012, PAGE_H + 0.012, 0.006]} radius={0.002} position={[-(PAGE_W + 0.012) / 2, 0, -0.006 - Math.max(leftStack, rightStack)]} material={mats.cover} />
      <RoundedBox args={[PAGE_W + 0.012, PAGE_H + 0.012, 0.006]} radius={0.002} position={[(PAGE_W + 0.012) / 2, 0, -0.006 - Math.max(leftStack, rightStack)]} material={mats.cover} />
      {/* page stacks */}
      <mesh position={[-PAGE_W / 2, 0, -leftStack / 2]} material={mats.paperEdge}>
        <boxGeometry args={[PAGE_W, PAGE_H, leftStack]} />
      </mesh>
      <mesh position={[PAGE_W / 2, 0, -rightStack / 2]} material={mats.paperEdge}>
        <boxGeometry args={[PAGE_W, PAGE_H, rightStack]} />
      </mesh>
      {/* visible pages */}
      <mesh
        position={[-PAGE_W / 2, 0, 0.0002]}
        onClick={(e) => {
          e.stopPropagation();
          if (leftPerson !== null) onPageClick(leftPerson);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (leftPerson !== null) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshStandardMaterial map={leftTex} roughness={0.9} />
      </mesh>
      <mesh
        position={[PAGE_W / 2, 0, 0.0002]}
        onClick={(e) => {
          e.stopPropagation();
          if (rightPerson !== null) onPageClick(rightPerson);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (rightPerson !== null) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshStandardMaterial map={rightTex} roughness={0.9} />
      </mesh>
      {/* the flying leaf, existing only mid-turn */}
      {flip && flyFrontTex && flyBackTex && (
        <group ref={leafRef} position={[0, 0, 0.001]}>
          <mesh position={[PAGE_W / 2, 0, 0.0001]}>
            <planeGeometry args={[PAGE_W, PAGE_H]} />
            <meshStandardMaterial map={flyFrontTex} roughness={0.9} side={THREE.FrontSide} />
          </mesh>
          <mesh position={[PAGE_W / 2, 0, -0.0001]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[PAGE_W, PAGE_H]} />
            <meshStandardMaterial map={flyBackTex} roughness={0.9} side={THREE.FrontSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Shelving() {
  const walnut = useMemo(() => new THREE.MeshStandardMaterial({ color: WALNUT, roughness: 0.55 }), []);
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
        <boxGeometry args={[1.4, 0.052, 0.4]} />
      </mesh>
      <mesh position={[0, DECK_TOP - 0.026, 0.221]} material={walnutDark}>
        <boxGeometry args={[1.4, 0.052, 0.002]} />
      </mesh>
    </group>
  );
}

/** Aspect-aware static camera plus a gentle parallax toward the pointer. */
function Rig() {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(0, BOOK_Y, 0), []);
  useFrame((state, delta) => {
    const aspect = state.size.width / Math.max(1, state.size.height);
    const z = Math.max(0.5, 0.66 / aspect);
    const k = Math.min(1, delta * 3);
    camera.position.x += (state.pointer.x * 0.045 - camera.position.x) * k;
    camera.position.y += (BOOK_Y + 0.02 + state.pointer.y * 0.025 - camera.position.y) * k;
    camera.position.z += (z - camera.position.z) * k;
    camera.lookAt(look);
  });
  return null;
}

/* ---------------------------------------------------------------- *
 *  Public component
 * ---------------------------------------------------------------- */
const ContributorAlbum = ({ glPower = "high-performance" }: { glPower?: "high-performance" | "default" }) => {
  const [spread, setSpread] = useState(0);
  const [flip, setFlip] = useState<FlipState | null>(null);
  const flipRef = useRef<FlipState | null>(null);
  const navigate = useNavigate();
  const cache = useMemo(() => new PageCache(), []);
  useEffect(() => () => cache.disposeAll(), [cache]);
  const wrap = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number } | null>(null);

  // spreadRef mirrors the state so turn() never needs a side effect inside a
  // state updater, which React may legally drop.
  const spreadRef = useRef(0);
  useEffect(() => {
    spreadRef.current = spread;
  }, [spread]);

  const turn = useCallback((dir: 1 | -1) => {
    if (flipRef.current) return;
    const s = spreadRef.current;
    if (dir === 1 && s >= LEAF_COUNT) return;
    if (dir === -1 && s <= 0) return;
    const f: FlipState = { dir, t: 0, leaf: dir === 1 ? s : s - 1 };
    flipRef.current = f;
    setFlip(f);
  }, []);

  // Drive the flip clock outside the 3D tree so HTML chrome stays in sync.
  useEffect(() => {
    if (!flip) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const f = flipRef.current;
      if (!f) return;
      f.t = Math.min(1, f.t + (now - last) / 1000 / FLIP_S);
      last = now;
      if (f.t >= 1) {
        flipRef.current = null;
        setFlip(null);
        setSpread((s) => s + f.dir);
      } else {
        setFlip({ ...f });
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!flip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const rect = wrap.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 80 || rect.top > window.innerHeight - 80) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        turn(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        turn(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  // The person the card names: the right page, else the left at the very end.
  const rightIdx = 2 * spread;
  const featured = rightIdx < people.length ? people[rightIdx] : people[people.length - 1];
  // The spread shows two people; the counter names the visible range.
  const counter =
    spread === 0
      ? "01"
      : spread >= LEAF_COUNT
        ? String(people.length)
        : `${String(2 * spread).padStart(2, "0")}-${String(2 * spread + 1).padStart(2, "0")}`;

  return (
    <div ref={wrap} className="relative w-full h-full" style={{ background: CREAM }}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, BOOK_Y + 0.02, 0.6], fov: 34, near: 0.01, far: 12 }}
        gl={{ antialias: true, powerPreference: glPower }}
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX };
        }}
        onPointerUp={(e) => {
          if (swipe.current && Math.abs(e.clientX - swipe.current.x) > 48) {
            turn(e.clientX < swipe.current.x ? 1 : -1);
          }
          swipe.current = null;
        }}
        style={{ touchAction: "pan-y" }}
      >
        <Suspense fallback={null}>
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
          <Shelving />
          <Book
            spread={spread}
            flip={flip}
            cache={cache}
            onPageClick={(i) => navigate(`/ai-contributors/${people[i].id}`)}
          />
          <ContactShadows position={[0, DECK_TOP + 0.001, 0]} opacity={0.32} scale={1.6} blur={2.2} far={0.5} color="#4a3423" />
          <Rig />
        </Suspense>
      </Canvas>

      <div
        className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(40,26,15,0) 0%, rgba(40,26,15,0.22) 100%)" }}
      />

      <div className="absolute top-5 right-6 text-right pointer-events-none hidden sm:block">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "#8a7860" }}>
          01 volume · {people.length} pages
        </p>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "#b3a58c" }}>
          one page per person
        </p>
      </div>

      {/* docked card: same treatment at every width */}
      <div className="absolute left-0 right-0 bottom-0 border-t" style={{ background: "rgba(247,242,232,0.97)", borderColor: "#d8cbb4" }}>
        <div className="absolute -top-px left-0 right-0 h-[3px]" style={{ background: "rgba(201,187,161,0.4)" }}>
          <div
            className="absolute top-0 bottom-0 transition-all"
            style={{ width: `${(spread / LEAF_COUNT) * 100}%`, background: "#7a5c2e" }}
          />
        </div>
        <div className="px-4 sm:px-6 pt-3 pb-3.5 max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.2em] mb-1" style={{ color: "#8a7860" }}>
                {counter} / {people.length}
                <span className="ml-3" style={{ color: "#b3a58c" }}>
                  swipe, arrows, or click a page
                </span>
              </p>
              <h3 className="text-lg sm:text-xl font-bold leading-tight truncate" style={{ fontFamily: SERIF, color: INK }}>
                {featured.name}
              </h3>
              <p className="italic text-sm truncate" style={{ fontFamily: SERIF, color: "#6b5c46" }}>
                {featured.affiliation}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/ai-contributors/${featured.id}`}
                className="font-mono text-[10px] uppercase tracking-[0.14em] border px-3 py-2 whitespace-nowrap hidden sm:block"
                style={{ borderColor: "#7a5c2e", color: "#5a4220" }}
              >
                Open profile →
              </Link>
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => turn(-1)}
                className="w-9 h-9 border grid place-items-center"
                style={{ borderColor: "#c9bba1", color: "#6b5c46", background: "rgba(255,253,248,0.7)" }}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => turn(1)}
                className="w-9 h-9 border grid place-items-center"
                style={{ borderColor: "#c9bba1", color: "#6b5c46", background: "rgba(255,253,248,0.7)" }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorAlbum;
