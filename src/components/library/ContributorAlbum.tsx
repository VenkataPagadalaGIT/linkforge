"use client";
/**
 * ContributorAlbum: the Top 100 as ONE book with a hundred photo pages.
 *
 * The book starts CLOSED, standing on the deck with its title stamped on the
 * cloth, and opens itself after a beat. The reader can also take over at any
 * point: grab the cover and pull. Past a third of the arc the book commits
 * and swings fully open; let go earlier and it falls shut. The same physics
 * runs in reverse from page one.
 *
 * Open, it is a hundred photo pages, one person per page, and clicking a page
 * opens that person's profile. Construction: two visible page planes over
 * growing/shrinking page stacks, one flying leaf that only exists mid-turn,
 * and a hinged front cover whose inner face IS the title page, so the reveal
 * during the opening arc is the real first spread, not a stand-in. Pages are
 * typeset onto canvases; photos load lazily into them; a small LRU bounds
 * texture memory however far someone reads.
 */
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { captureBuffer } from "@/lib/captureFlag";
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
/** Cover boards overhang the page block evenly on three sides. */
const COVER_W = PAGE_W + 0.01;
const COVER_H = PAGE_H + 0.014;
const COVER_T = 0.006;
const DECK_TOP = -0.155;
const BOOK_Y = DECK_TOP + COVER_H / 2 + 0.016;
/** Seconds for one page turn. */
const FLIP_S = 0.55;
/** Below this the cover falls shut on release; above, it commits and opens. */
const OPEN_COMMIT = 0.3;

const people = [...aiContributors].sort((a, b) => a.rank - b.rank);
/** Leaf k: front face = person 2k, back face = person 2k+1. */
const LEAF_COUNT = Math.ceil(people.length / 2);
const MONOGRAM_CLOTHS = ["#4a5c6a", "#7d8471", "#8b6f5c", "#5f7470", "#7a4f4a", "#6a5a7a", "#3f5245", "#35424a"];

/* ---------------------------------------------------------------- *
 *  Typeset faces. Index -1 = title page, people.length = colophon.
 * ---------------------------------------------------------------- */
function drawPageChrome(ctx: CanvasRenderingContext2D, W: number, H: number, side: "left" | "right") {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // The gutter: pages darken toward the spine, not symmetrically.
  const spineAtRight = side === "left";
  const vg = ctx.createLinearGradient(0, 0, W, 0);
  const inner = "rgba(90,66,32,0.16)";
  const outer = "rgba(90,66,32,0.05)";
  vg.addColorStop(0, spineAtRight ? outer : inner);
  vg.addColorStop(spineAtRight ? 0.06 : 0.14, "rgba(0,0,0,0)");
  vg.addColorStop(spineAtRight ? 0.86 : 0.94, "rgba(0,0,0,0)");
  vg.addColorStop(1, spineAtRight ? inner : outer);
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const side: "left" | "right" = index === -1 || (index >= 0 && index % 2 === 1) ? "left" : "right";
  drawPageChrome(ctx, W, H, side);
  ctx.textAlign = "center";

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;

  if (index === -1) {
    // Title page: the inner face of the front cover.
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
  ctx.fillStyle = "rgba(122,92,46,0.8)";
  ctx.font = `24px ${SERIF}`;
  ctx.fillText(`Nº ${String(p.rank).padStart(2, "0")}`, W / 2, 78);

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
    ctx.fillStyle = "rgba(122,92,46,0.08)";
    ctx.fillRect(px, py, ps, ps);
    finishText();
    const img = new Image();
    img.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, px, py, ps, ps);
      tex.needsUpdate = true;
    };
    img.src = p.photoUrl;
  } else {
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

/**
 * The front cover's face: etched lettering on TRANSPARENT ground, because the
 * cover itself is glass. Only the letters, rules and ornament are drawn; the
 * board's frosted transmission does the rest, so the first page shimmers
 * through the case before the book ever opens.
 */
function makeCoverFaceTexture(): THREE.CanvasTexture {
  const W = 640, H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Etched glass in two passes: a wide soft halo first, then the same marks
  // crisp on top. One pass with a glyph-level glow read as out-of-focus.
  const etch = "rgba(238,224,190,0.96)";
  const drawMarks = () => {
    ctx.strokeStyle = etch;
    ctx.fillStyle = etch;
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.font = `24px ${SERIF}`;
    ctx.fillText("T H E   A I   N O T E B O O K", W / 2, 170);
    ctx.font = `bold 84px ${SERIF}`;
    ctx.fillText("Top 100", W / 2, 330);
    ctx.font = `bold 62px ${SERIF}`;
    ctx.fillText("AI Contributors", W / 2, 415);
    ctx.lineWidth = 2;
    for (const y of [480, 492]) {
      ctx.beginPath();
      ctx.moveTo(W * 0.24, y);
      ctx.lineTo(W * 0.76, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(W / 2, 590, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, 590, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `26px ${SERIF}`;
    ctx.fillText("2026 EDITION", W / 2, 730);
    ctx.font = `bold 22px monospace`;
    ctx.fillText("VP_", W / 2, H - 70);
  };
  ctx.globalAlpha = 0.5;
  ctx.shadowColor = "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 10;
  drawMarks();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  drawMarks();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/** Mirrored copy for faces that are read after a half-turn. */
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
  leaf: number;
}

function Book({
  spread,
  flip,
  openP,
  onPageClick,
  onCoverGrab,
  cache,
}: {
  spread: number;
  flip: FlipState | null;
  /** 0 = closed, 1 = fully open. */
  openP: number;
  onPageClick: (personIndex: number) => void;
  onCoverGrab: (clientX: number) => void;
  cache: PageCache;
}) {
  const leafRef = useRef<THREE.Group>(null);
  const bookRef = useRef<THREE.Group>(null);
  const open = openP > 0.985;

  const leftIndex = spread === 0 ? -1 : 2 * spread - 1;
  const rightUnder = flip && flip.dir === 1 ? 2 * (spread + 1) : 2 * spread;
  const leftUnder = flip && flip.dir === -1 ? (spread - 1 === 0 ? -1 : 2 * (spread - 1) - 1) : leftIndex;

  const leftTex = cache.get(Math.min(leftUnder, people.length));
  const rightTex = cache.get(Math.min(rightUnder, people.length));
  const titleTexInner = useMemo(() => mirrored(cache.get(-1)), [cache]);
  const coverFace = useMemo(() => makeCoverFaceTexture(), []);
  useEffect(
    () => () => {
      titleTexInner.dispose();
      coverFace.dispose();
    },
    [titleTexInner, coverFace],
  );

  const flyFrontTex = flip ? cache.get(Math.min(2 * flip.leaf, people.length)) : null;
  const flyBackRaw = flip ? cache.get(Math.min(2 * flip.leaf + 1, people.length)) : null;
  const flyBackTex = useMemo(() => (flyBackRaw ? mirrored(flyBackRaw) : null), [flyBackRaw]);
  useEffect(() => () => flyBackTex?.dispose(), [flyBackTex]);

  useFrame(() => {
    const g = leafRef.current;
    if (g && flip) {
      const e = flip.t < 0.5 ? 2 * flip.t * flip.t : 1 - Math.pow(-2 * flip.t + 2, 2) / 2;
      g.rotation.y = -(flip.dir === 1 ? Math.PI * e : Math.PI * (1 - e));
    }
    // Closed, the book stands centered and slightly angled toward the reader;
    // open, the spine takes the centre. Both follow the cover's arc.
    const b = bookRef.current;
    if (b) {
      b.position.x = -(PAGE_W / 2) * (1 - openP);
      b.rotation.y = -0.34 * (1 - openP);
    }
  });

  const mats = useMemo(
    () => ({
      paperEdge: new THREE.MeshStandardMaterial({ color: "#e8dfcc", roughness: 0.9 }),
      // A glass-bound album: frosted enough that the first page shimmers
      // through the closed case rather than reading clearly, with a faint
      // cool tint so the glass exists against the cream room.
      cover: new THREE.MeshPhysicalMaterial({
        color: "#eef4f1",
        transmission: 0.92,
        roughness: 0.24,
        metalness: 0,
        ior: 1.5,
        thickness: 0.012,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
        attenuationColor: new THREE.Color("#cfe3da"),
        attenuationDistance: 0.35,
      }),
      coverDark: new THREE.MeshPhysicalMaterial({
        color: "#dbe7e2",
        transmission: 0.85,
        roughness: 0.3,
        metalness: 0,
        ior: 1.5,
        thickness: 0.02,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const leftStack = Math.max(0.0015, spread * 0.0011);
  const rightStack = Math.max(0.0015, (LEAF_COUNT - spread) * 0.0011);
  const leftPerson = leftUnder >= 0 && leftUnder < people.length ? leftUnder : null;
  const rightPerson = rightUnder >= 0 && rightUnder < people.length ? rightUnder : null;
  // Hinge-symmetric: at spread 0 the closed cover rests just in front of the
  // block; opened, the same arc lands it exactly behind the growing left stack.
  const coverZ = leftStack + 0.0045;

  return (
    <group ref={bookRef} position={[0, BOOK_Y, 0]}>
      {/* spine ridge */}
      <RoundedBox args={[0.011, COVER_H, 0.019]} radius={0.003} position={[-0.0045, 0, -0.0015]} material={mats.coverDark} />
      {/* back cover, always behind the right block */}
      <RoundedBox
        args={[COVER_W, COVER_H, COVER_T]}
        radius={0.002}
        position={[COVER_W / 2 - 0.005, 0, -(rightStack + 0.0045)]}
        material={mats.cover}
      />
      {/* right page stack + visible right page */}
      <mesh position={[PAGE_W / 2, 0, -rightStack / 2]} material={mats.paperEdge}>
        <boxGeometry args={[PAGE_W, PAGE_H, rightStack]} />
      </mesh>
      <mesh
        position={[PAGE_W / 2, 0, 0.0002]}
        onClick={(e) => {
          e.stopPropagation();
          if (open && rightPerson !== null) onPageClick(rightPerson);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (open && rightPerson !== null) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshStandardMaterial map={rightTex} roughness={0.9} />
      </mesh>

      {/* left block exists only once the book is open */}
      {open && (
        <>
          <mesh position={[-PAGE_W / 2, 0, -leftStack / 2]} material={mats.paperEdge}>
            <boxGeometry args={[PAGE_W, PAGE_H, leftStack]} />
          </mesh>
          {/* at spread 0 the title page IS the cover's inner face */}
          {spread > 0 && (
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
          )}
        </>
      )}

      {/* front cover, hinged at the spine */}
      <group rotation={[0, -Math.PI * openP, 0]}>
        <RoundedBox
          args={[COVER_W, COVER_H, COVER_T]}
          radius={0.002}
          position={[COVER_W / 2 - 0.005, 0, coverZ]}
          material={mats.cover}
        />
        {/* stamped outer face */}
        <mesh
          position={[COVER_W / 2 - 0.005, 0, coverZ + COVER_T / 2 + 0.0004]}
          onPointerDown={(e) => {
            if (openP < 0.985) {
              e.stopPropagation();
              onCoverGrab(e.clientX);
            }
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (openP < 0.985) document.body.style.cursor = "grab";
          }}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <planeGeometry args={[COVER_W - 0.006, COVER_H - 0.006]} />
          {/* etched lettering floats on the glass: transparent ground, no
              depth write so the board's transmission shows through it */}
          <meshStandardMaterial map={coverFace} transparent depthWrite={false} roughness={0.5} />
        </mesh>
        {/* inner face: the title page, revealed by the opening arc */}
        <mesh position={[COVER_W / 2 - 0.005, 0, coverZ - COVER_T / 2 - 0.0004]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[PAGE_W, PAGE_H]} />
          <meshStandardMaterial map={titleTexInner} roughness={0.9} />
        </mesh>
      </group>

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

  // Cover state. openP is animated toward openTarget unless the reader is
  // dragging; a grab cancels the automatic opening for good.
  const [openP, setOpenP] = useState(0);
  const openPRef = useRef(0);
  const openTarget = useRef<number | null>(null);
  const coverDrag = useRef<{ x: number; p0: number; moved: boolean } | null>(null);
  const interacted = useRef(false);
  const open = openP > 0.985;

  const setOpen = useCallback((p: number) => {
    openPRef.current = p;
    setOpenP(p);
  }, []);

  // Animation clock for the cover: ease toward the target.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = openTarget.current;
      if (t !== null && !coverDrag.current) {
        const p = openPRef.current;
        const next = p + (t - p) * Math.min(1, dt * 3.4);
        if (Math.abs(t - next) < 0.003) {
          setOpen(t);
          openTarget.current = null;
        } else {
          setOpen(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setOpen]);

  // The book opens itself after a beat, unless the reader got there first.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!interacted.current && openPRef.current < 0.02) openTarget.current = 1;
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  const spreadRef = useRef(0);
  useEffect(() => {
    spreadRef.current = spread;
  }, [spread]);

  const turn = useCallback((dir: 1 | -1) => {
    interacted.current = true;
    if (openPRef.current < 0.985) {
      if (dir === 1) openTarget.current = 1;
      return;
    }
    if (flipRef.current) return;
    const s = spreadRef.current;
    if (dir === -1 && s <= 0) {
      // page one, going back: close the book
      openTarget.current = 0;
      return;
    }
    if (dir === 1 && s >= LEAF_COUNT) return;
    const f: FlipState = { dir, t: 0, leaf: dir === 1 ? s : s - 1 };
    flipRef.current = f;
    setFlip(f);
  }, []);

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
      if (e.key === "ArrowRight" || (e.key === "Enter" && openPRef.current < 0.985)) {
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

  const rightIdx = 2 * spread;
  const featured = rightIdx < people.length ? people[rightIdx] : people[people.length - 1];
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
        gl={{ antialias: true, powerPreference: glPower, preserveDrawingBuffer: captureBuffer() }}
        onPointerDown={(e) => {
          if (openPRef.current >= 0.985) swipe.current = { x: e.clientX };
        }}
        onPointerMove={(e) => {
          const d = coverDrag.current;
          if (!d) return;
          if (Math.abs(e.clientX - d.x) > 4) d.moved = true;
          const w = wrap.current?.clientWidth || 1;
          // pulling leftward opens; the drag maps to about half the container
          const p = Math.max(0, Math.min(1, d.p0 + (d.x - e.clientX) / (w * 0.45)));
          openTarget.current = null;
          setOpen(p);
        }}
        onPointerUp={(e) => {
          const d = coverDrag.current;
          if (d) {
            coverDrag.current = null;
            // the final push: past the commit point it swings itself
            openTarget.current = !d.moved ? 1 : openPRef.current > OPEN_COMMIT ? 1 : 0;
            return;
          }
          if (swipe.current && Math.abs(e.clientX - swipe.current.x) > 48) {
            turn(e.clientX < swipe.current.x ? 1 : -1);
          }
          swipe.current = null;
        }}
        onPointerLeave={() => {
          const d = coverDrag.current;
          if (d) {
            coverDrag.current = null;
            openTarget.current = openPRef.current > OPEN_COMMIT ? 1 : 0;
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
            openP={openP}
            cache={cache}
            onPageClick={(i) => navigate(`/ai-contributors/${people[i].id}`)}
            onCoverGrab={(clientX) => {
              interacted.current = true;
              openTarget.current = null;
              coverDrag.current = { x: clientX, p0: openPRef.current, moved: false };
            }}
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

      {/* closed: one quiet invitation */}
      {!open && (
        <div className="absolute left-0 right-0 bottom-8 flex justify-center pointer-events-none">
          <p
            className="font-mono text-[10px] tracking-[0.24em] uppercase px-4 py-2 border"
            style={{ color: "#6b5c46", borderColor: "#c9bba1", background: "rgba(255,253,248,0.7)" }}
          >
            {openP < 0.02 ? "Pull the cover open, or wait" : "Keep pulling…"}
          </p>
        </div>
      )}

      {/* open: the docked card */}
      {open && (
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
      )}
    </div>
  );
};

export default ContributorAlbum;
