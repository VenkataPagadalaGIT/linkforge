"use client";
/**
 * FutureCityScene, hero-banner pass: a year-2040 establishing shot rebuilt
 * around the detailed humanoid and vehicle assets in ./assets. A levitating
 * cloud brain over a central plaza, articulated humanoids walking the loop
 * (one pauses to watch the landing pad), a kneeling pair assembling a frame
 * in sync with the beam cycle, one idle unit posed three-quarter to the
 * camera in the near field, angular pickups and a smooth sedan gliding the
 * ring road, and a slow semi on an outer bypass that makes the towers read
 * tall.
 *
 * Cinematography: cool moonlight key from camera-left, a low warm amber rim
 * spot raking from behind the plaza so silhouettes get an edge, dim fill, a
 * barely-reflective ground (drei MeshReflectorMaterial, hero mode only),
 * selective Bloom on the emissives (hero mode only), sparse dust motes in
 * the rim light, and a low 3/4 dolly start so the machines dominate frame.
 *
 * Background mode stays cheap by design: plain ground, no postprocessing,
 * capped dpr, dimmed emissives, pointer events off, slow fixed orbit.
 * No shadow maps anywhere; contact shadows are soft dark discs fed by a
 * tiny in-code radial gradient texture. No external assets of any kind.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Grid,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  Trail,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Robot from "./assets/Robot";
import { AirCar, CargoBoat, CyberSemi, CyberTruck, MonoPod, Sedan } from "./assets/Vehicles";

export interface FutureCitySceneProps {
  /** Background mode: pointer-events off, slow fixed orbit, dimmer, capped dpr. */
  background?: boolean;
  /** WebGL powerPreference proven usable by the lazy wrapper's probe. */
  glPower?: "high-performance" | "default";
}

interface Ctx {
  background: boolean;
  /** prefers-reduced-motion: freeze every loop, hold one composed frame. */
  still: boolean;
  /** Emissive multiplier; background mode runs everything dimmer. */
  dim: number;
}
// Nullable: during HMR a remounting tree can briefly read a stale context
// module. The non-null assertion below is safe once mounted under the provider.
const SceneCtx = createContext<Ctx | null>(null);
const useScene = () => useContext(SceneCtx)!;

/* ---------------------------------------------------------------- *
 *  Drive mode: click a machine, take its controls
 * ---------------------------------------------------------------- */

interface DriveSel {
  id: string;
  label: string;
  kind: "car" | "boat" | "bot";
}
interface DriveApi {
  sel: DriveSel | null;
  set: (d: DriveSel | null) => void;
  /** th: -0.7..1 throttle · st: -1..1 steer · bk: 0/1 held brake. */
  input: { current: { th: number; st: number; bk: number } };
  /** The object the chase camera follows while driving. */
  target: { current: THREE.Object3D | null };
}
const DriveCtx = createContext<DriveApi | null>(null);
const useDrive = () => useContext(DriveCtx);

/* ---------------------------------------------------------------- *
 *  Palette: monochrome structures, one ice accent family, sparse amber
 * ---------------------------------------------------------------- */

const ICE = "#9fb4d0";
const ICE_BRIGHT = "#cfe4ff";
const AMBER = "#d9a860";

const M = {
  hull: { color: "#9aa0ab", metalness: 0.7, roughness: 0.35 },
  graphite: { color: "#3a3d44", metalness: 0.55, roughness: 0.5 },
  slab: { color: "#26282d", metalness: 0.4, roughness: 0.65 },
  joint: { color: "#4a4e56", metalness: 0.55, roughness: 0.5 },
} as const;

/** Humanoid scale: the old capsule figures stood ~1.25 units; the detailed
 *  asset is 1.75 at scale 1, so 0.82 lands ~1.44, the requested ~15% bump. */
const ROBOT_SCALE = 0.82;

/* ---------------------------------------------------------------- *
 *  Paths: everything that moves rides an arc-length-sampled curve
 * ---------------------------------------------------------------- */

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Ring road around the block, slightly irregular so it reads designed, not generated. */
const ROAD = new THREE.CatmullRomCurve3(
  [
    v3(15, 0, 1), v3(12.5, 0, 8.5), v3(3.5, 0, 12.5), v3(-7, 0, 11.5), v3(-13.5, 0, 5),
    v3(-14.5, 0, -3.5), v3(-9.5, 0, -10.5), v3(0.5, 0, -13), v3(10, 0, -10.5), v3(14.5, 0, -5.5),
  ],
  true,
  "catmullrom",
  0.5
);
/** Ring-road surface height: ribbon sits at 0.01 with half-height 0.077. */
const ROAD_Y = 0.09;

/** Outer bypass: one slow lane for the semi, wide enough to skirt everything. */
const BYPASS = new THREE.CatmullRomCurve3(
  [
    v3(22, 0, 4), v3(15, 0, 15), v3(2, 0, 20), v3(-12, 0, 17.5), v3(-20.5, 0, 8),
    v3(-22, 0, -6), v3(-13.5, 0, -17), v3(2, 0, -21), v3(15, 0, -16.5), v3(21.5, 0, -7),
  ],
  true,
  "catmullrom",
  0.5
);
const BYPASS_Y = 0.082;

/** Elevated flyover: an OPEN viaduct arc that sweeps across the BACK of the
 *  scene, both ends RAMPING DOWN TO GRADE in the fog (a floating deck end reads broken; a ramp reads like an interchange), crossing over the ring road
 *  behind the plaza and over the bypass on the west. It deliberately never
 *  encloses the plaza: the camera's foreground stays clear and no pylon can
 *  land in the pedestrian field. The curve carries real y: deck height IS
 *  the path (higher over the west bypass crossing for semi clearance). */
const FLYOVER = new THREE.CatmullRomCurve3(
  [
    v3(30.5, 0.1, 8.6), v3(26.5, 1.5, 6.6), v3(19, 2.7, -1), v3(11, 3.1, -7.5),
    v3(2, 3.2, -11.5), v3(-7, 3.05, -11.8), v3(-15, 2.85, -8.5), v3(-22, 2.6, -2.5),
    v3(-27.5, 1.4, 3.4), v3(-31, 0.1, 5.2),
  ],
  false,
  "catmullrom",
  0.5
);
/** Wheels-on-deck offset: half the flattened ribbon above the curve line. */
const FLYOVER_Y = 0.075;

/** Cargo canal along the north edge, outside the bypass: two barge lanes. */
const CANAL = new THREE.CatmullRomCurve3(
  [
    v3(25, 0, 25.6), v3(10, 0, 25.1), v3(-12, 0, 25.5), v3(-25, 0, 26.3),
    v3(-25.5, 0, 28.4), v3(-10, 0, 28.9), v3(12, 0, 28.6), v3(25.5, 0, 28.1),
  ],
  true,
  "catmullrom",
  0.5
);
/** Water clamp box for player-driven barges. */
const CANAL_BOUNDS = { zMin: 24.4, zMax: 29.7, xMax: 29 } as const;

/** Pedestrian loop around the plaza under the brain. */
const WALKWAY = new THREE.CatmullRomCurve3(
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const r = 4.3 + ((i * 29) % 5) * 0.06;
    return v3(Math.cos(a) * r, 0, Math.sin(a) * r);
  }),
  true
);

/** Landing pad centre; the pausing walker turns to face it. */
const PAD_POS = v3(8.2, 0, -5.4);

const DRONE_PATHS = [
  // wide patrol that sinks toward the landing pad on each lap
  new THREE.CatmullRomCurve3(
    [
      v3(12, 5, 2), v3(8.4, 2.4, -5.2), v3(2, 4.4, -9.5), v3(-6, 5.6, -8.5),
      v3(-11.5, 4.4, -1), v3(-7.5, 3.6, 7), v3(2, 5, 9.5), v3(9, 4.6, 6.5),
    ],
    true
  ),
  // tight tilted orbit around the cloud brain
  new THREE.CatmullRomCurve3(
    [
      v3(5.4, 4.2, 0), v3(3.8, 5.3, 3.8), v3(0, 5.9, 5.4), v3(-3.8, 5.2, 3.8),
      v3(-5.4, 4.5, 0), v3(-3.8, 3.9, -3.8), v3(0, 3.5, -5.4), v3(3.8, 3.9, -3.8),
    ],
    true
  ),
  // long high sweep across the whole block
  new THREE.CatmullRomCurve3(
    [
      v3(16, 7.2, -6), v3(4, 6.4, -11.5), v3(-8, 7.6, -9.5), v3(-15.5, 6.6, 0),
      v3(-8, 5.8, 8.5), v3(4, 7, 10.5), v3(13.5, 6.2, 5),
    ],
    true
  ),
];

const DRONES = [
  { path: 0, offset: 0, speed: 0.02 },
  { path: 0, offset: 0.5, speed: 0.02 },
  { path: 1, offset: 0.2, speed: 0.034 },
  { path: 2, offset: 0.45, speed: 0.016 },
  { path: 2, offset: 0.85, speed: 0.016 },
];

/** Circle colliders every driven machine resolves against. Vehicles register
 *  themselves on mount; statics are listed once. Crude circles beat objects
 *  passing through each other, which is what breaks the illusion fastest. */
const COLLIDERS = new Set<{ o: THREE.Object3D; r: number }>();

const TOWERS = [
  { x: -8.5, z: -7.5, w: 1.15, h: 9.5 },
  { x: -10.6, z: -4.2, w: 0.85, h: 6.2 },
  { x: 9.6, z: -8.4, w: 1.3, h: 11 },
  { x: 11.6, z: -5, w: 0.7, h: 5 },
];

const STATIC_COLS: { x: number; z: number; r: number }[] = [
  ...TOWERS.map((t) => ({ x: t.x, z: t.z, r: t.w * 0.75 + 0.45 })),
  { x: 6.2, z: 5.8, r: 2.7 }, // the construction site
];

/* ---------------------------------------------------------------- *
 *  Contact shadows: soft dark discs, no shadow maps anywhere
 * ---------------------------------------------------------------- */

/** In-code radial gradient (alphaMap reads green); Linear filtering so the
 *  64px falloff stays smooth at any disc size. */
let _shadowTex: THREE.DataTexture | null = null;
function shadowTex(): THREE.DataTexture {
  if (_shadowTex) return _shadowTex;
  const S = 64;
  const data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5) / S - 0.5;
      const dy = (y + 0.5) / S - 0.5;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      const a = 1 - r;
      const f = Math.round(a * a * (3 - 2 * a) * 255); // smoothstep falloff
      const i = (y * S + x) * 4;
      data[i] = f;
      data[i + 1] = f;
      data[i + 2] = f;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, S, S);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  _shadowTex = tex;
  return tex;
}

/** Soft grounding disc; w and l are the footprint in local units. */
function ContactShadow({
  w,
  l,
  opacity = 0.42,
  y = 0.008,
}: {
  w: number;
  l: number;
  opacity?: number;
  y?: number;
}) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w, l, 1]} renderOrder={1}>
      <circleGeometry args={[0.5, 24]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={opacity}
        alphaMap={shadowTex()}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Cloud brain: wireframe shell, pulsing core, slow particle rings
 * ---------------------------------------------------------------- */

function CloudBrain() {
  const ctx = useScene();
  const root = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const swarm = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  // Three tilted rings, each drifting at its own speed: an orbit, not a blender.
  const rings = useMemo(
    () => [
      { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.45, 0, 0.2)), r: 1.95, speed: 0.16, n: 30 },
      { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, -0.35)), r: 2.35, speed: -0.11, n: 30 },
      { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(1.15, 0, 0.5)), r: 2.7, speed: 0.07, n: 24 },
    ],
    []
  );
  const N = 84;

  useFrame(({ clock }) => {
    if (!root.current || !shell.current || !core.current || !coreMat.current || !swarm.current) return;
    const t = ctx.still ? 0 : clock.elapsedTime;
    root.current.position.y = 4.6 + Math.sin(t * 0.5) * 0.1;
    shell.current.rotation.y = t * 0.06;
    shell.current.rotation.x = 0.2 + Math.sin(t * 0.11) * 0.05;
    const pulse = ctx.still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.9);
    core.current.scale.setScalar(1 + pulse * 0.07);
    coreMat.current.emissiveIntensity = (0.8 + 1.0 * pulse) * ctx.dim;
    let i = 0;
    for (const ring of rings) {
      for (let k = 0; k < ring.n; k++) {
        const a = (k / ring.n) * Math.PI * 2 + t * ring.speed;
        v.set(Math.cos(a) * ring.r, Math.sin(k * 2.7) * 0.12, Math.sin(a) * ring.r).applyQuaternion(ring.q);
        tmp.position.copy(v);
        tmp.scale.setScalar(0.028 + ((k * 13) % 7) / 900);
        tmp.updateMatrix();
        swarm.current.setMatrixAt(i++, tmp.matrix);
      }
    }
    swarm.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} position={[0, 4.6, 0]}>
      <mesh ref={core}>
        <sphereGeometry args={[0.6, 24, 18]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#101722"
          emissive={ICE_BRIGHT}
          emissiveIntensity={1.2}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      {/* soft halo around the core: cheap glow that Bloom then picks up */}
      <mesh>
        <sphereGeometry args={[1.0, 20, 14]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.07 * ctx.dim} depthWrite={false} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color={ICE} wireframe transparent opacity={0.28 * ctx.dim} />
      </mesh>
      <instancedMesh ref={swarm} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.75 * ctx.dim} depthWrite={false} />
      </instancedMesh>
      {/* the brain is the scene's practical light: nearby hulls pick up its color */}
      <pointLight color={ICE} intensity={6 * ctx.dim} distance={16} decay={2} />
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Humanoids: detailed articulated asset, three duty loops
 * ---------------------------------------------------------------- */

interface WalkerSpec {
  offset: number;
  speed: number;
  phase: number;
  /** Curve parameter where this walker stops for a beat. */
  pauseAt?: number;
  /** Seconds spent idling at the pause point. */
  pauseFor?: number;
}

/** Phases are chosen for the frozen poster too: sin(1.2) puts the first
 *  walker mid-stride on the camera side of the loop under reduced motion. */
const WALKERS: WalkerSpec[] = [
  { offset: 0.13, speed: 0.03, phase: 1.2 },
  { offset: 0.44, speed: 0.027, phase: 3.35, pauseAt: 0.9, pauseFor: 4.2 },
  { offset: 0.72, speed: 0.033, phase: 5.05 },
];

function Walker({ offset, speed, phase, pauseAt, pauseFor = 4 }: WalkerSpec) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const [paused, setPaused] = useState(false);
  const u = useRef(offset);
  const pauseStart = useRef(0);
  const yaw = useRef<number | null>(null);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    if (!ctx.still) {
      if (paused) {
        if (clock.elapsedTime - pauseStart.current > pauseFor) setPaused(false);
      } else {
        const prev = u.current;
        let next = prev + speed * delta;
        // crossing test that survives the 1 -> 0 wrap
        if (pauseAt !== undefined && (prev < pauseAt ? next >= pauseAt : next >= pauseAt + 1)) {
          next = pauseAt;
          setPaused(true);
          pauseStart.current = clock.elapsedTime;
        }
        u.current = next % 1;
      }
    }
    WALKWAY.getPointAt(u.current, p);
    WALKWAY.getTangentAt(u.current, tan);
    g.position.set(p.x, 0.01, p.z);
    // while paused, turn to watch the landing pad; otherwise face the path
    const target = paused
      ? Math.atan2(PAD_POS.x - p.x, PAD_POS.z - p.z)
      : Math.atan2(tan.x, tan.z);
    if (yaw.current === null || ctx.still) {
      yaw.current = target;
    } else {
      let dh = target - yaw.current;
      if (dh > Math.PI) dh -= Math.PI * 2;
      if (dh < -Math.PI) dh += Math.PI * 2;
      yaw.current += dh * Math.min(1, 4 * delta);
    }
    g.rotation.y = yaw.current;
  });

  return (
    <group ref={group}>
      <Robot
        pose={paused ? "idle" : "walk"}
        phase={phase}
        scale={ROBOT_SCALE}
        dim={ctx.dim}
        frozen={ctx.still}
      />
      <ContactShadow w={0.85} l={1.05} opacity={0.4} />
    </group>
  );
}

/** Near-field unit in three-quarter view, close to the hero camera start so
 *  the visor band, joint spheres and two-tone shells actually read. */
function IdleRobot() {
  const ctx = useScene();
  const drive = useDrive();
  const group = useRef<THREE.Group>(null);
  const vel = useRef(0);
  const [moving, setMoving] = useState(false);
  const driven = drive?.sel?.id === "hero-bot";
  useFrame((_, delta) => {
    const g = group.current;
    if (!g || !driven || !drive) return;
    const inp = drive.input.current;
    vel.current += (inp.th * 1.7 - vel.current) * Math.min(1, delta * 3);
    if (Math.abs(inp.th) < 0.05) vel.current *= 1 - Math.min(1, delta * 3);
    if (inp.bk) vel.current *= 1 - Math.min(1, delta * 6);
    g.rotation.y -= inp.st * 2.6 * delta;
    g.position.x += Math.sin(g.rotation.y) * vel.current * delta;
    g.position.z += Math.cos(g.rotation.y) * vel.current * delta;
    // stay inside the fog bowl
    const r = Math.hypot(g.position.x, g.position.z);
    if (r > 27) {
      g.position.x *= 27 / r;
      g.position.z *= 27 / r;
    }
    // the robot slides out of overlaps like everything else
    const resolve = (ox: number, oz: number, orr: number) => {
      const dx = g.position.x - ox;
      const dz = g.position.z - oz;
      const rs = 0.45 + orr;
      const d2 = dx * dx + dz * dz;
      if (d2 > rs * rs || d2 < 1e-6) return;
      const d = Math.sqrt(d2);
      const push = rs - d;
      g.position.x += (dx / d) * push;
      g.position.z += (dz / d) * push;
      vel.current *= 0.5;
    };
    COLLIDERS.forEach((c) => {
      if (c.o !== g) resolve(c.o.position.x, c.o.position.z, c.r);
    });
    for (const sc of STATIC_COLS) resolve(sc.x, sc.z, sc.r);
    const isMoving = Math.abs(vel.current) > 0.12;
    if (isMoving !== moving) setMoving(isMoving);
    drive.target.current = g;
  });
  const clickable = !!drive && !ctx.background;
  return (
    <group
      ref={group}
      position={[4.7, 0.008, 9.2]}
      rotation={[0, 1.35, 0]}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation();
              drive!.set({ id: "hero-bot", label: "HUMANOID", kind: "bot" });
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={clickable ? () => (document.body.style.cursor = "auto") : undefined}
    >
      <Robot
        pose={driven && moving ? "walk" : "idle"}
        phase={0.7}
        scale={ROBOT_SCALE}
        dim={ctx.dim}
        frozen={ctx.still}
      />
      <ContactShadow w={0.85} l={1.05} opacity={0.42} />
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Build site: a frame going up, a kneeling pair working the beam cycle
 * ---------------------------------------------------------------- */

/** Three full assemble cycles (the asset's loop runs 3.125 s) per beam
 *  placement, so the kneel-reach loop stays in step with the lift. */
const BEAM_PERIOD = 9.375;

/** Ground loop the panel carrier walks: past the stack, around the open
 *  front of the structure, back along the rear, never through the glass. */
const CARRY_PATH = new THREE.CatmullRomCurve3(
  [
    v3(-1.9, 0, -0.6), v3(-2.3, 0, 0.55), v3(-1.3, 0, 1.6), v3(0.4, 0, 1.85),
    v3(1.7, 0, 1.3), v3(2.2, 0, 0.2), v3(1.5, 0, -1.25), v3(-0.3, 0, -1.5),
  ],
  true,
  "catmullrom",
  0.5
);

/** Welder: a kneeling unit works the rear column joint inside the ground
 *  floor; a spark point flickers deterministically with a matching light. */
function Welder() {
  const ctx = useScene();
  const sparkMat = useRef<THREE.MeshBasicMaterial>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = ctx.still ? 0 : clock.elapsedTime;
    // gated flicker: bursts while the internal reach cycle is "on the joint"
    const cyc = ((t * 0.32 + 0.8 * 0.17) % 1 + 1) % 1;
    const working = cyc > 0.2 && cyc < 0.75 ? 1 : 0;
    const flick = working * Math.max(0, Math.sin(t * 31) * Math.sin(t * 17.3) + 0.35);
    if (sparkMat.current) sparkMat.current.opacity = Math.min(1, flick) * ctx.dim;
    if (sparkLight.current) sparkLight.current.intensity = flick * 1.6 * ctx.dim;
  });
  return (
    <group>
      <group position={[0.85, 0, -0.2]} rotation={[0, Math.PI, 0]}>
        <Robot pose="assemble" phase={0.8} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
      </group>
      <mesh position={[0.85, 0.38, -0.72]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial ref={sparkMat} color={ICE_BRIGHT} transparent depthWrite={false} />
      </mesh>
      <pointLight ref={sparkLight} position={[0.85, 0.45, -0.68]} color={ICE_BRIGHT} distance={2.6} decay={2} />
    </group>
  );
}

/** Panel airlift loop: rise off the stack, ferry across, seat on the slab. */
const LIFT_PERIOD = 14;

function BuildSite() {
  const ctx = useScene();
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshStandardMaterial>(null);
  const lift = useRef<THREE.Group>(null);
  const liftMat = useRef<THREE.MeshStandardMaterial>(null);
  /** 0..1 beam height each frame; the kneeling pair's guideRef, so their
   *  hands visibly ride the beam instead of pantomiming beside it. */
  const riseRef = useRef(0);
  // ghost outline of the floors that do not exist yet
  const holoGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.9, 1.05, 1.9)), []);

  useFrame(({ clock }) => {
    const m = beam.current;
    const mat = beamMat.current;
    if (m && mat) {
      // one placement cycle: lift, seat, quiet dissolve, repeat
      const p = ctx.still ? 0.6 : (clock.elapsedTime % BEAM_PERIOD) / BEAM_PERIOD;
      const rise = THREE.MathUtils.smoothstep(Math.min(p / 0.55, 1), 0, 1);
      m.position.y = 0.3 + rise * 1.9;
      mat.opacity = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.15) : 1;
      m.visible = mat.opacity > 0.01;
      riseRef.current = rise * mat.opacity;
    }
    const lg = lift.current;
    const lm = liftMat.current;
    if (lg && lm) {
      // drone pair ferries a wall panel: stack, up, across, seat, dissolve
      const p = ctx.still ? 0.42 : (clock.elapsedTime % LIFT_PERIOD) / LIFT_PERIOD;
      const up = THREE.MathUtils.smoothstep(Math.min(p / 0.3, 1), 0, 1);
      const across = THREE.MathUtils.smoothstep(p, 0.32, 0.58);
      const seat = THREE.MathUtils.smoothstep(p, 0.6, 0.72);
      lg.position.set(
        -1.7 + across * 1.7,
        0.35 + up * 2.1 - seat * 0.85,
        -0.6 + across * 0.25
      );
      lm.opacity = p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.12) : 1;
      lg.visible = lm.opacity > 0.01;
    }
  });
  return (
    <group position={[6.2, 0.004, 5.8]} rotation={[0, -0.5, 0]}>
      {/* full-height corner columns span both built levels */}
      {[[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <boxGeometry args={[0.09, 2.2, 0.09]} />
          <meshStandardMaterial {...M.joint} />
        </mesh>
      ))}
      {/* ground floor is DONE: slab on top, glass infill on the two back sides */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.05, 0.07, 2.05]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      <mesh position={[0, 0.55, -0.85]}>
        <boxGeometry args={[1.66, 1.05, 0.035]} />
        <meshStandardMaterial color="#10131a" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-0.85, 0.55, 0]}>
        <boxGeometry args={[0.035, 1.05, 1.66]} />
        <meshStandardMaterial color="#10131a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* level two is bones: one top beam in, the rest arriving */}
      <mesh position={[0, 2.2, -0.85]}>
        <boxGeometry args={[1.8, 0.09, 0.09]} />
        <meshStandardMaterial {...M.joint} />
      </mesh>
      {/* the beam the ground pair is placing */}
      <mesh ref={beam} position={[0, 0.3, 0.85]}>
        <boxGeometry args={[1.8, 0.09, 0.09]} />
        <meshStandardMaterial
          ref={beamMat}
          {...M.hull}
          transparent
          emissive={ICE}
          emissiveIntensity={0.25 * ctx.dim}
        />
      </mesh>
      {/* holographic blueprint: the two floors that only exist as intent yet */}
      {[2.85, 3.95].map((y, i) => (
        <lineSegments key={i} geometry={holoGeo} position={[0, y, 0]}>
          <lineBasicMaterial color={ICE} transparent opacity={(0.2 - i * 0.07) * ctx.dim} />
        </lineSegments>
      ))}
      {/* panel stack waiting on the ground */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-1.7, 0.08 + i * 0.055, -0.6]} rotation={[0, 0.12 * i, 0]}>
          <boxGeometry args={[0.72, 0.045, 0.5]} />
          <meshStandardMaterial {...M.hull} />
        </mesh>
      ))}
      {/* drone pair ferrying one panel up to the slab */}
      <group ref={lift}>
        <mesh>
          <boxGeometry args={[0.72, 0.045, 0.5]} />
          <meshStandardMaterial
            ref={liftMat}
            {...M.hull}
            transparent
            emissive={ICE}
            emissiveIntensity={0.2 * ctx.dim}
          />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.26, 0.34, 0]}>
            <mesh>
              <capsuleGeometry args={[0.035, 0.09, 3, 8]} />
              <meshStandardMaterial {...M.joint} />
            </mesh>
            {/* taut lift cables down to the panel corners */}
            <mesh position={[0, -0.17, 0]}>
              <boxGeometry args={[0.006, 0.3, 0.006]} />
              <meshStandardMaterial color="#3a3d44" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
      {/* the kneeling pair at the beam ends: guideRef couples their hands
          and gaze to the beam's actual height every frame */}
      <group position={[1.3, 0, 0.85]} rotation={[0, -Math.PI / 2, 0]}>
        <Robot pose="assemble" phase={0} guideRef={riseRef} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        <ContactShadow w={1.0} l={1.3} opacity={0.42} />
      </group>
      <group position={[-1.3, 0, 0.85]} rotation={[0, Math.PI / 2, 0]}>
        <Robot pose="assemble" phase={2.94} guideRef={riseRef} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        <ContactShadow w={1.0} l={1.3} opacity={0.42} />
      </group>
      {/* panel carrier: hauls a panel around the open front on a fixed loop */}
      <PathRider curve={CARRY_PATH} offset={0.2} lapSpeed={0.05} y={0} scale={ROBOT_SCALE}>
        {() => (
          <>
            <Robot pose="carry" phase={1.1} dim={ctx.dim} frozen={ctx.still} />
            <mesh position={[0, 0.82, 0.4]} rotation={[0.12, 0, 0]}>
              <boxGeometry args={[0.62, 0.05, 0.46]} />
              <meshStandardMaterial {...M.hull} />
            </mesh>
            <ContactShadow w={0.9} l={1.2} opacity={0.4} />
          </>
        )}
      </PathRider>
      {/* welder inside the ground floor, sparking the rear column joint */}
      <Welder />
      {/* site supervisor at a holo console, reading the build */}
      <group position={[2.05, 0, -0.35]} rotation={[0, -Math.PI / 2 - 0.25, 0]}>
        <Robot pose="operate" phase={2.2} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        <ContactShadow w={0.8} l={0.9} opacity={0.38} />
        {/* the console it is reading: two legs, tilted holo pane */}
        <group position={[0, 0, 0.62]}>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.22, 0.42, 0]}>
              <cylinderGeometry args={[0.018, 0.024, 0.84, 8]} />
              <meshStandardMaterial {...M.graphite} />
            </mesh>
          ))}
          <mesh position={[0, 0.88, 0]} rotation={[-0.42, 0, 0]}>
            <planeGeometry args={[0.6, 0.34]} />
            <meshBasicMaterial color={ICE} transparent opacity={0.1 * ctx.dim} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.88, 0.002]} rotation={[-0.42, 0, 0]}>
            <planeGeometry args={[0.52, 0.05]} />
            <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.2 * ctx.dim} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* the third builder works ON the finished slab, seating the airlifted
          panels at the level-two edge */}
      <group position={[0.28, 1.155, 0.02]} rotation={[0, -Math.PI / 2 + 0.3, 0]}>
        <Robot pose="assemble" phase={1.5} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Drones: propless lozenges banking through their patrol curves
 * ---------------------------------------------------------------- */

function Drone({ curve, offset, speed }: { curve: THREE.CatmullRomCurve3; offset: number; speed: number }) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const strobe = useRef<THREE.MeshBasicMaterial>(null);
  const t = useRef(offset);
  const heading = useRef<number | null>(null);
  const bank = useRef(0);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    if (!ctx.still) t.current = (t.current + speed * delta) % 1;
    curve.getPointAt(t.current, p);
    curve.getTangentAt(t.current, tan);
    g.position.copy(p);
    const h = Math.atan2(tan.x, tan.z);
    // bank into turns from the frame-to-frame heading change, normalized
    // across the +-pi wrap so the roll never snaps
    let dh = heading.current === null ? 0 : h - heading.current;
    if (dh > Math.PI) dh -= Math.PI * 2;
    if (dh < -Math.PI) dh += Math.PI * 2;
    heading.current = h;
    const target = ctx.still ? 0 : THREE.MathUtils.clamp(-dh * 22, -0.45, 0.45);
    bank.current += (target - bank.current) * Math.min(1, 5 * delta);
    g.rotation.order = "YXZ"; // heading first, then pitch and roll
    g.rotation.set(-tan.y * 0.7, h, bank.current);
    if (strobe.current)
      strobe.current.opacity =
        (ctx.still ? 0.5 : Math.sin(clock.elapsedTime * 5 + offset * 40) > 0.65 ? 1 : 0.12) * ctx.dim;
  });

  return (
    <group ref={group}>
      {/* hull: a flattened lozenge, no rotors: 2040 does not spin props */}
      <mesh scale={[1, 0.32, 1.45]}>
        <sphereGeometry args={[0.17, 12, 8]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      <mesh position={[0, -0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.013, 6, 24]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.7 * ctx.dim} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.02, -0.26]}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshBasicMaterial ref={strobe} color={AMBER} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Roadways and traffic
 * ---------------------------------------------------------------- */

function RoadStuds() {
  const ctx = useScene();
  const N = 56;
  const ref = useRef<THREE.InstancedMesh>(null);
  // Static: matrices are laid down once, before first paint.
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const t = i / N;
      ROAD.getPointAt(t, p);
      ROAD.getTangentAt(t, tan);
      side.set(tan.z, 0, -tan.x).normalize(); // perpendicular in the ground plane
      const s = i % 2 === 0 ? 1 : -1;
      tmp.position.set(p.x + side.x * 0.68 * s, 0.055, p.z + side.z * 0.68 * s);
      tmp.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.05, 0.02, 0.18]} />
      <meshBasicMaterial color={ICE} transparent opacity={0.4 * ctx.dim} depthWrite={false} />
    </instancedMesh>
  );
}

function Roadway() {
  const ctx = useScene();
  // A tube flattened on y becomes the ribbon; the same curve at a hairline
  // radius becomes the center guide line.
  const ribbon = useMemo(() => new THREE.TubeGeometry(ROAD, 128, 0.55, 8, true), []);
  const guide = useMemo(() => new THREE.TubeGeometry(ROAD, 128, 0.02, 6, true), []);
  return (
    <group>
      <mesh geometry={ribbon} scale={[1, 0.14, 1]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#141519" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh geometry={guide} position={[0, 0.085, 0]}>
        <meshBasicMaterial color={ICE} transparent opacity={0.18 * ctx.dim} depthWrite={false} />
      </mesh>
      <RoadStuds />
    </group>
  );
}

/** The bypass lane: wider, darker, fainter guide; the semi's territory. */
function BypassRoad() {
  const ctx = useScene();
  const ribbon = useMemo(() => new THREE.TubeGeometry(BYPASS, 160, 0.85, 8, true), []);
  const guide = useMemo(() => new THREE.TubeGeometry(BYPASS, 160, 0.02, 6, true), []);
  return (
    <group>
      <mesh geometry={ribbon} scale={[1, 0.08, 1]} position={[0, 0.012, 0]}>
        <meshStandardMaterial color="#121317" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh geometry={guide} position={[0, 0.08, 0]}>
        <meshBasicMaterial color={ICE} transparent opacity={0.12 * ctx.dim} depthWrite={false} />
      </mesh>
    </group>
  );
}


/** The flyover: flattened-tube deck riding the elevated curve, a faint
 *  guide line, instanced edge lights, and pylons that drop to grade only
 *  where they will not spear the ring road or the plaza. */
function FlyoverRoad() {
  const ctx = useScene();
  const deck = useMemo(() => new THREE.TubeGeometry(FLYOVER, 160, 0.62, 8, false), []);
  const guide = useMemo(() => new THREE.TubeGeometry(FLYOVER, 160, 0.02, 6, false), []);
  // Pylon placement: sample the deck, drop a pier unless it lands on the
  // ring road ribbon, inside the plaza, or on the bypass lane.
  const pylons = useMemo(() => {
    const roadPts = ROAD.getSpacedPoints(140);
    const bypassPts = BYPASS.getSpacedPoints(140);
    const out: { x: number; z: number; h: number }[] = [];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const p = FLYOVER.getPointAt(i / N);
      const nearRoad = roadPts.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 1.35 ** 2);
      const nearBypass = bypassPts.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 1.1 ** 2);
      const inPlaza = p.x * p.x + p.z * p.z < 5.6 ** 2;
      const h = p.y - 0.12; // top ends clear of the deck underside
      if (h > 0.7 && !nearRoad && !nearBypass && !inPlaza) out.push({ x: p.x, z: p.z, h });
    }
    return out;
  }, []);
  const piers = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = piers.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    pylons.forEach((py, i) => {
      tmp.position.set(py.x, py.h / 2, py.z);
      tmp.scale.set(1, py.h, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [pylons]);
  const lights = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = lights.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    const N = 64;
    for (let i = 0; i < N; i++) {
      FLYOVER.getPointAt(i / N, p);
      FLYOVER.getTangentAt(i / N, tan);
      side.set(tan.z, 0, -tan.x).normalize();
      const s = i % 2 === 0 ? 1 : -1;
      tmp.position.set(p.x + side.x * 0.55 * s, p.y + 0.085, p.z + side.z * 0.55 * s);
      tmp.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh geometry={deck} scale={[1, 0.12, 1]}>
        <meshStandardMaterial color="#16171c" metalness={0.55} roughness={0.5} />
      </mesh>
      <mesh geometry={guide} position={[0, 0.075, 0]}>
        <meshBasicMaterial color={ICE} transparent opacity={0.16 * ctx.dim} depthWrite={false} />
      </mesh>
      <instancedMesh ref={lights} args={[undefined, undefined, 64]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.02, 0.16]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.35 * ctx.dim} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={piers} args={[undefined, undefined, 26]} count={pylons.length} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.14, 1, 8]} />
        <meshStandardMaterial color="#1d1f24" metalness={0.6} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

/**
 * Rides a closed curve at a constant lap speed, +Z aligned to the tangent.
 * Children receive the wheel-spin speed (world speed divided by the group
 * scale, so the asset's unscaled wheel radii roll at true ground speed).
 */
function PathRider({
  curve,
  offset,
  lapSpeed,
  y,
  scale = 1,
  driveId,
  driveLabel,
  driveMax = 4,
  driveKind = "car",
  hitR,
  children,
}: {
  curve: THREE.CatmullRomCurve3;
  offset: number;
  lapSpeed: number;
  y: number;
  scale?: number;
  /** Present = this rider is clickable and player-drivable. */
  driveId?: string;
  driveLabel?: string;
  driveMax?: number;
  driveKind?: "car" | "boat";
  /** Collision circle radius before scale; boats and semis pass bigger. */
  hitR?: number;
  children: (wheelSpeed: number) => ReactNode;
}) {
  const ctx = useScene();
  const drive = useDrive();
  const group = useRef<THREE.Group>(null);
  const u = useRef(offset);
  const vel = useRef(0);
  const wasDriven = useRef(false);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  const len = useMemo(() => curve.getLength(), [curve]);
  const driven = !!driveId && drive?.sel?.id === driveId;
  const selfR = (hitR ?? (driveKind === "boat" ? 2.6 : 1.4)) * scale;
  const yieldF = useRef(1);
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    const entry = { o: g as THREE.Object3D, r: selfR };
    COLLIDERS.add(entry);
    return () => {
      COLLIDERS.delete(entry);
    };
  }, [selfR]);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (driven && drive) {
      // player control: throttle eases velocity, steering scales with speed
      wasDriven.current = true;
      const inp = drive.input.current;
      vel.current += (inp.th * driveMax - vel.current) * Math.min(1, delta * 1.8);
      if (Math.abs(inp.th) < 0.05) vel.current *= 1 - Math.min(1, delta * 1.4);
      if (inp.bk) vel.current *= 1 - Math.min(1, delta * 5);
      const steerAuthority = Math.min(1, Math.abs(vel.current) / 1.2);
      g.rotation.y -= inp.st * 1.7 * delta * steerAuthority * Math.sign(vel.current || 1);
      g.position.x += Math.sin(g.rotation.y) * vel.current * delta;
      g.position.z += Math.cos(g.rotation.y) * vel.current * delta;
      if (driveKind === "boat") {
        g.position.y += (0.02 - g.position.y) * Math.min(1, delta * 3);
        g.position.z = Math.min(CANAL_BOUNDS.zMax, Math.max(CANAL_BOUNDS.zMin, g.position.z));
        g.position.x = Math.min(CANAL_BOUNDS.xMax, Math.max(-CANAL_BOUNDS.xMax, g.position.x));
      } else {
        // eased return to grade: driving off the flyover lands, not falls
        g.position.y += (ROAD_Y - g.position.y) * Math.min(1, delta * 2.5);
      }
      // resolve collisions: slide out of overlaps, bleed speed on contact
      const px = g.position;
      const resolve = (ox: number, oz: number, orr: number) => {
        const dx = px.x - ox;
        const dz = px.z - oz;
        const rs = selfR + orr;
        const d2 = dx * dx + dz * dz;
        if (d2 > rs * rs || d2 < 1e-6) return;
        const d = Math.sqrt(d2);
        const push = rs - d;
        px.x += (dx / d) * push;
        px.z += (dz / d) * push;
        vel.current *= 0.55;
      };
      COLLIDERS.forEach((c) => {
        if (c.o !== g) resolve(c.o.position.x, c.o.position.z, c.r);
      });
      for (const sc of STATIC_COLS) resolve(sc.x, sc.z, sc.r);
      drive.target.current = g;
      return;
    }
    if (wasDriven.current) {
      // released: rejoin the loop at the nearest curve param
      wasDriven.current = false;
      vel.current = 0;
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < 160; i++) {
        const uu = i / 160;
        curve.getPointAt(uu, p);
        const dx = p.x - g.position.x;
        const dz = p.z - g.position.z;
        const dd = dx * dx + dz * dz;
        if (dd < bd) {
          bd = dd;
          best = uu;
        }
      }
      u.current = best;
    }
    // yield to the player: traffic eases to a stop near the driven machine
    let want = 1;
    const pt = drive?.sel ? drive.target.current : null;
    if (pt && pt !== g) {
      const dx = pt.position.x - g.position.x;
      const dz = pt.position.z - g.position.z;
      const near = selfR + 2.8;
      if (dx * dx + dz * dz < near * near) want = 0;
    }
    yieldF.current += (want - yieldF.current) * Math.min(1, delta * 2.5);
    if (!ctx.still) u.current = (u.current + lapSpeed * delta * yieldF.current) % 1;
    curve.getPointAt(u.current, p);
    curve.getTangentAt(u.current, tan);
    // y is additive so elevated curves (the flyover) carry their own height
    // while the flat ground loops keep behaving exactly as before
    g.position.set(p.x, p.y + y, p.z);
    g.rotation.y = Math.atan2(tan.x, tan.z);
  });
  const wheelSpeed = ctx.still ? 0 : (len * lapSpeed) / scale;
  const clickable = !!driveId && !!drive && !ctx.background;
  return (
    <group
      ref={group}
      scale={scale}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation();
              drive!.set({ id: driveId!, label: driveLabel ?? driveId!, kind: driveKind });
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={clickable ? () => (document.body.style.cursor = "auto") : undefined}
    >
      {children(wheelSpeed)}
    </group>
  );
}

/** Rear-marker light trail, subtler than the old pass; frozen scenes keep the marker only. */
function TailTrail({ y, z }: { y: number; z: number }) {
  const ctx = useScene();
  const marker = (
    <mesh position={[0, y, z]}>
      <sphereGeometry args={[0.035, 6, 6]} />
      <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.85 * ctx.dim} depthWrite={false} />
    </mesh>
  );
  if (ctx.still) return marker;
  return (
    <Trail width={0.22} length={3.2} decay={2.6} color={ICE} attenuation={(w) => w * w}>
      {marker}
    </Trail>
  );
}


/** Two machines keep the flyover alive without crowding it. */
function FlyoverTraffic() {
  const ctx = useScene();
  return (
    <>
      <PathRider curve={FLYOVER} offset={0.15} lapSpeed={0.02} y={FLYOVER_Y} scale={0.88} driveId="truck-3" driveLabel="CYBERTRUCK">
        {(s) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} />
            <ContactShadow w={1.4} l={3.0} opacity={0.4} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      <PathRider curve={FLYOVER} offset={0.62} lapSpeed={0.02} y={FLYOVER_Y} scale={0.92} driveId="sedan-3" driveLabel="ROBOTAXI">
        {(s) => (
          <>
            <Sedan dim={ctx.dim} speed={s} />
            <ContactShadow w={1.1} l={2.2} opacity={0.38} y={0.012} />
            <TailTrail y={0.44} z={-1.05} />
          </>
        )}
      </PathRider>
    </>
  );
}

/** The canal: still dark water, two shoreline guides, cargo barge lanes. */
function Canal() {
  const ctx = useScene();
  return (
    <group>
      <mesh position={[0, -0.02, 27.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[66, 8.6]} />
        <meshPhysicalMaterial color="#0a1420" metalness={0.85} roughness={0.22} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      {[23.6, 30.5].map((z) => (
        <mesh key={z} position={[0, 0.015, z]}>
          <boxGeometry args={[64, 0.02, 0.06]} />
          <meshBasicMaterial color={ICE} transparent opacity={0.14 * ctx.dim} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Two electric barges hauling the fleet's containers, clickable like cars. */
function BoatTraffic() {
  const ctx = useScene();
  const boat = (offset: number, id: string, ph: number) => (
    <PathRider curve={CANAL} offset={offset} lapSpeed={0.006} y={0} scale={1.35} driveId={id} driveLabel="CARGO BARGE" driveMax={2.4} driveKind="boat">
      {() => (
        <>
          <CargoBoat dim={ctx.dim} phase={ph} />
          {!ctx.still && !ctx.background && (
            <Trail width={0.55} length={5} decay={3} color="#dfe9f5" attenuation={(w) => w * w}>
              <mesh position={[0, 0.08, -2.15]}>
                <sphereGeometry args={[0.02, 4, 4]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </Trail>
          )}
        </>
      )}
    </PathRider>
  );
  return (
    <>
      {boat(0.12, "boat-1", 0)}
      {boat(0.62, "boat-2", 2.4)}
    </>
  );
}

/** Holographic lane beacons on the ring road shoulder, cycling ice-amber. */
function TrafficBeacons() {
  const ctx = useScene();
  const spots = useMemo(() => {
    return [0.16, 0.5, 0.84].map((uu) => {
      const pt = ROAD.getPointAt(uu);
      const tn = ROAD.getTangentAt(uu);
      const side = new THREE.Vector3(tn.z, 0, -tn.x).normalize();
      return { x: pt.x + side.x * 1.2, z: pt.z + side.z * 1.2 };
    });
  }, []);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = ctx.still ? 0 : clock.elapsedTime;
    spots.forEach((_, i) => {
      const phase = (t * 0.35 + i * 0.33) % 1;
      for (let k = 0; k < 2; k++) {
        const m = mats.current[i * 2 + k];
        if (!m) continue;
        const on = phase < 0.5 ? k === 0 : k === 1;
        m.opacity = (on ? 0.85 : 0.12) * ctx.dim;
      }
    });
  });
  return (
    <>
      {spots.map((sp, i) => (
        <group key={i} position={[sp.x, 0, sp.z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 1.4, 8]} />
            <meshStandardMaterial color="#1d1f24" metalness={0.6} roughness={0.5} />
          </mesh>
          {[0, 1].map((k) => (
            <mesh key={k} position={[0, 1.5 - k * 0.18, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial
                ref={(el) => {
                  mats.current[i * 2 + k] = el;
                }}
                color={k === 0 ? ICE_BRIGHT : AMBER}
                transparent
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/** While driving, the camera falls in behind the controlled machine. */
function ChaseCam({ controls }: { controls: { current: { enabled: boolean } | null } }) {
  const drive = useDrive();
  const want = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const t = drive?.sel ? drive.target.current : null;
    const oc = controls.current;
    if (!t) {
      if (oc && !oc.enabled) oc.enabled = true;
      return;
    }
    if (oc && oc.enabled) oc.enabled = false;
    const bot = drive!.sel!.kind === "bot";
    const back = bot ? 4.2 : 7.8;
    const up = bot ? 2.2 : 3.2;
    want
      .set(-Math.sin(t.rotation.y) * back, up, -Math.cos(t.rotation.y) * back)
      .add(t.position);
    camera.position.lerp(want, Math.min(1, delta * 2.4));
    camera.lookAt(t.position.x, t.position.y + 1.1, t.position.z);
  });
  return null;
}

/** In-canvas layer keeps only the idle invitation; the active cockpit lives
 *  in a viewport-fixed portal so it never moves with scroll or layout. */
function CanvasHint() {
  const drive = useDrive();
  if (!drive || drive.sel) return null;
  return (
    <Html fullscreen zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 12, bottom: 12, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6b6b74" }}>
        CLICK A VEHICLE, BARGE, OR THE NEAR HUMANOID TO DRIVE IT
      </div>
    </Html>
  );
}

/** AirCarDock rides inside the semi's PathRider, so its whole landing cycle
 *  happens in trailer-local space: approach, touch down on the solar roof,
 *  sit docked with rotors spun down, lift off, peel away. The landing zone
 *  is marked by four ice corner brackets on the trailer top. */
const DOCK_PERIOD = 34;

function AirCarDock() {
  const ctx = useScene();
  const car = useRef<THREE.Group>(null);
  const rotorRef = useRef(1);
  useFrame(({ clock }) => {
    const g = car.current;
    if (!g) return;
    const p = ctx.still ? 0.45 : (clock.elapsedTime % DOCK_PERIOD) / DOCK_PERIOD;
    const ss = THREE.MathUtils.smoothstep;
    const flyIn = ss(p, 0.02, 0.2);
    const down = ss(p, 0.24, 0.34);
    const up = ss(p, 0.62, 0.72);
    const away = ss(p, 0.74, 0.98);
    // behind-and-above approach, settle at the marked zone, mirror out
    g.position.set(
      0,
      4.4 - 2.2 * flyIn + (2.24 - (4.4 - 2.2)) * down + 1.9 * up + 0.4 * away,
      -6.5 + 4.5 * flyIn + 6.5 * away
    );
    g.rotation.z = 0.08 * Math.sin(clock.elapsedTime * 0.8) * (1 - down + up * 0.5);
    // rotors spin down while docked, back up before liftoff
    rotorRef.current = ctx.still ? 0.3 : Math.max(0.12, 1 - down + up);
  });
  return (
    <group>
      <group ref={car}>
        <AirCar dim={ctx.dim} rotorRef={rotorRef} />
      </group>
      {/* landing zone brackets on the trailer roof */}
      {([[-0.42, -2.42], [0.42, -2.42], [-0.42, -1.58], [0.42, -1.58]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 2.11, z]}>
          <boxGeometry args={[0.16, 0.008, 0.16]} />
          <meshBasicMaterial color={ICE} transparent opacity={0.4 * ctx.dim} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Equal lap speeds keep the ring spacing constant forever: no overtaking,
 *  no eventual overlap during long homepage dwells. */
function RingTraffic() {
  const ctx = useScene();
  return (
    <>
      {/* hero pickup: frozen offset 0.1 parks it on the camera side */}
      <PathRider curve={ROAD} offset={0.1} lapSpeed={0.027} y={ROAD_Y} scale={0.92} driveId="truck-1" driveLabel="CYBERTRUCK">
        {(s) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} />
            <ContactShadow w={1.5} l={3.2} opacity={0.48} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.45} lapSpeed={0.027} y={ROAD_Y} scale={0.88} driveId="truck-2" driveLabel="CYBERTRUCK">
        {(s) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} />
            <ContactShadow w={1.5} l={3.2} opacity={0.48} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      {/* second sedan and a narrow single-track pod fill the ring out */}
      <PathRider curve={ROAD} offset={0.28} lapSpeed={0.027} y={ROAD_Y} scale={0.85} driveId="sedan-2" driveLabel="ROBOTAXI">
        {(s) => (
          <>
            <Sedan dim={ctx.dim} speed={s} />
            <ContactShadow w={1.1} l={2.2} opacity={0.4} y={0.012} />
            <TailTrail y={0.44} z={-1.05} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.62} lapSpeed={0.027} y={ROAD_Y} scale={0.85} driveId="pod-1" driveLabel="MONOPOD" driveMax={5}>
        {(s) => (
          <>
            <MonoPod dim={ctx.dim} speed={s} />
            <ContactShadow w={0.55} l={1.4} opacity={0.38} y={0.012} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.78} lapSpeed={0.027} y={ROAD_Y} scale={0.9} driveId="sedan-1" driveLabel="ROBOTAXI">
        {(s) => (
          <>
            <Sedan dim={ctx.dim} speed={s} />
            <ContactShadow w={1.1} l={2.5} opacity={0.45} y={0.012} />
            <TailTrail y={0.42} z={-1.16} />
          </>
        )}
      </PathRider>
      {/* the semi on the outer bypass: slow, huge, half in the fog; its
          frozen offset 0.6 parks it on the far arc for the reduced-motion
          poster, exactly where scale reads best against the towers */}
      <PathRider curve={BYPASS} offset={0.6} lapSpeed={0.009} y={BYPASS_Y} driveId="semi-1" driveLabel="VENKATAPAGADALA SEMI" driveMax={3} hitR={3.4}>
        {(s) => (
          <>
            <CyberSemi dim={ctx.dim} speed={s} />
            <AirCarDock />
            <ContactShadow w={1.9} l={10} opacity={0.5} y={0.01} />
          </>
        )}
      </PathRider>
      {/* two more of the fleet, spaced a third of a lap apart */}
      <PathRider curve={BYPASS} offset={0.27} lapSpeed={0.009} y={BYPASS_Y} driveId="semi-2" driveLabel="VENKATAPAGADALA SEMI" driveMax={3} hitR={3.4}>
        {(s) => (
          <>
            <CyberSemi dim={ctx.dim} speed={s} />
            <ContactShadow w={1.9} l={10} opacity={0.5} y={0.01} />
          </>
        )}
      </PathRider>
      <PathRider curve={BYPASS} offset={0.93} lapSpeed={0.009} y={BYPASS_Y} driveId="semi-3" driveLabel="VENKATAPAGADALA SEMI" driveMax={3} hitR={3.4}>
        {(s) => (
          <>
            <CyberSemi dim={ctx.dim} speed={s} />
            <ContactShadow w={1.9} l={10} opacity={0.5} y={0.01} />
          </>
        )}
      </PathRider>
    </>
  );
}

/* ---------------------------------------------------------------- *
 *  Home base: monolith towers, landing pad, holographic rings
 * ---------------------------------------------------------------- */

function TowerLights() {
  const ctx = useScene();
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 72;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    const ice = new THREE.Color(ICE);
    const amber = new THREE.Color(AMBER);
    let i = 0;
    TOWERS.forEach((t, ti) => {
      const rows = Math.floor(t.h / 0.9);
      for (let r = 0; r < rows && i < N; r++) {
        for (let c = 0; c < 3 && i < N; c++) {
          // deterministic sparse fill: most windows stay dark
          if ((r * 31 + c * 17 + ti * 7) % 4 !== 0) continue;
          tmp.position.set(t.x - t.w * 0.28 + c * t.w * 0.28, 0.9 + r * 0.9, t.z + t.w / 2 + 0.012);
          tmp.scale.setScalar(1);
          tmp.updateMatrix();
          m.setMatrixAt(i, tmp.matrix);
          m.setColorAt(i, (r * 13 + c + ti) % 7 === 0 ? amber : ice);
          i++;
        }
      }
    });
    // park unused instances at zero scale so they never draw
    for (; i < N; i++) {
      tmp.position.set(0, -10, 0);
      tmp.scale.setScalar(0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.09, 0.035, 0.02]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.55 * ctx.dim} depthWrite={false} />
    </instancedMesh>
  );
}

function Towers() {
  const ctx = useScene();
  return (
    <group>
      {TOWERS.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]}>
            <boxGeometry args={[t.w, t.h, t.w]} />
            <meshStandardMaterial {...(i % 2 === 0 ? M.graphite : M.slab)} />
          </mesh>
          {/* one lit edge per monolith: the only ornament they get */}
          <mesh position={[t.w / 2, t.h * 0.46, t.w / 2]}>
            <boxGeometry args={[0.025, t.h * 0.86, 0.025]} />
            <meshBasicMaterial color={ICE} transparent opacity={0.5 * ctx.dim} />
          </mesh>
        </group>
      ))}
      <TowerLights />
    </group>
  );
}

function HomeBase() {
  const ctx = useScene();
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const RINGS = [
    { y: 1.4, r: 1.45 },
    { y: 2.3, r: 1.2 },
    { y: 3.2, r: 0.95 },
  ];
  useFrame(({ clock }) => {
    const t = ctx.still ? 0 : clock.elapsedTime;
    RINGS.forEach((ring, i) => {
      const mesh = rings.current[i];
      const mat = mats.current[i];
      if (!mesh || !mat) return;
      mesh.position.y = ring.y + Math.sin(t * 0.7 + i * 1.4) * 0.07;
      mat.opacity = (0.14 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 2.1))) * ctx.dim;
    });
  });
  return (
    <group position={[8.2, 0, -5.4]}>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[1.9, 2.05, 0.18, 28]} />
        <meshStandardMaterial {...M.slab} />
      </mesh>
      <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.58, 40]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.5 * ctx.dim} side={THREE.DoubleSide} />
      </mesh>
      {RINGS.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          position={[0, ring.y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[ring.r, 0.018, 6, 48]} />
          <meshBasicMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color={ICE_BRIGHT}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Ground: barely-reflective in hero mode, plain in background mode
 * ---------------------------------------------------------------- */

function GroundPlane() {
  const ctx = useScene();
  return (
    <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[30, 48]} />
      {ctx.background ? (
        <meshStandardMaterial color="#0e0f12" metalness={0.35} roughness={0.75} />
      ) : (
        <MeshReflectorMaterial
          resolution={512}
          blur={[220, 80]}
          mixBlur={0.85}
          mixStrength={0.55}
          mirror={0.35}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0e0f12"
          metalness={0.5}
          roughness={0.8}
        />
      )}
    </mesh>
  );
}

/** The plaza is now just its lit boundary ring over the reflective floor. */
function PlazaRing() {
  const ctx = useScene();
  return (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4.95, 5.05, 48]} />
      <meshBasicMaterial
        color={ICE}
        transparent
        opacity={0.3 * ctx.dim}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Atmosphere: sparse dust motes drifting through the rim light
 * ---------------------------------------------------------------- */

function DustMotes() {
  const ctx = useScene();
  const N = 60;
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  // deterministic scatter: hashed, no Math.random, same field every load
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const h = (n: number) => {
          const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return s - Math.floor(s);
        };
        const a = h(1) * Math.PI * 2;
        const r = 2.5 + h(2) * 10.5;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          y: 0.4 + h(3) * 4.2,
          rise: 0.05 + h(4) * 0.08,
          sway: 0.3 + h(5) * 0.5,
          swaySpeed: 0.1 + h(6) * 0.25,
          phase: h(7) * Math.PI * 2,
          s: 0.014 + h(8) * 0.02,
        };
      }),
    []
  );
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = ctx.still ? 0 : clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const d = seeds[i];
      tmp.position.set(
        d.x + Math.sin(t * d.swaySpeed + d.phase) * d.sway,
        0.3 + ((d.y - 0.3 + t * d.rise) % 4.6),
        d.z + Math.cos(t * d.swaySpeed * 0.8 + d.phase) * d.sway
      );
      tmp.scale.setScalar(d.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      {/* warm-tinted so the motes read as caught in the amber rim light */}
      <meshBasicMaterial color="#d9c8a8" transparent opacity={0.28 * ctx.dim} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Aircraft: distant, silent, crossing occasionally
 * ---------------------------------------------------------------- */

function Aircraft() {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const strobe = useRef<THREE.MeshBasicMaterial>(null);
  const PERIOD = 46; // seconds between pass starts
  const PASS = 17; // seconds on screen; the rest of the period is empty sky
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    if (ctx.still) {
      g.visible = false;
      return;
    }
    const p = (clock.elapsedTime % PERIOD) / PASS;
    g.visible = p <= 1;
    if (!g.visible) return;
    g.position.set(-58 + 116 * p, 15.5, -26 - 5 * p);
    g.rotation.y = Math.atan2(116, -5);
    if (strobe.current)
      strobe.current.opacity = (Math.sin(clock.elapsedTime * 7) > 0.75 ? 1 : 0.1) * ctx.dim;
  });
  return (
    <group ref={group} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 2.4, 4, 8]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[3.6, 0.05, 0.9]} />
        <meshStandardMaterial {...M.graphite} />
      </mesh>
      <mesh position={[0, 0.05, -1.3]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial ref={strobe} color={AMBER} transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Lighting: moonlight key, amber rim, dim fill
 * ---------------------------------------------------------------- */

/** Low warm spot raking from behind the plaza toward the camera side, so
 *  the humanoid silhouettes pick up an amber edge. No shadow casting. */
function RimLight() {
  const ctx = useScene();
  const spot = useRef<THREE.SpotLight>(null);
  useLayoutEffect(() => {
    const s = spot.current;
    if (!s) return;
    // static target: one manual matrix update stands in for scene insertion
    s.target.position.set(1.5, 0.7, 4.5);
    s.target.updateMatrixWorld();
  }, []);
  return (
    <spotLight
      ref={spot}
      position={[-5.5, 1.9, -12.5]}
      color="#e2a763"
      intensity={60 * (ctx.background ? 0.7 : 1)}
      distance={42}
      angle={0.62}
      penumbra={0.85}
      decay={1.45}
    />
  );
}

/* ---------------------------------------------------------------- *
 *  Composition + camera
 * ---------------------------------------------------------------- */

function World() {
  const ctx = useScene();
  return (
    <>
      <GroundPlane />
      <PlazaRing />
      <CloudBrain />
      <Roadway />
      <BypassRoad />
      <FlyoverRoad />
      <Canal />
      <BoatTraffic />
      <TrafficBeacons />
      <Towers />
      <HomeBase />
      <BuildSite />
      {WALKERS.map((w, i) => (
        <Walker key={i} {...w} />
      ))}
      {/* the near-field showcase unit is framed for the hero camera; the
          background orbit never reads it, so it stays hero-only */}
      {!ctx.background && <IdleRobot />}
      <RingTraffic />
      <FlyoverTraffic />
      {/* one air car cruising the high sweep, rotors always up */}
      <PathRider curve={DRONE_PATHS[2]} offset={0.3} lapSpeed={0.012} y={0} scale={1.1}>
        {() => <AirCar dim={ctx.dim} />}
      </PathRider>
      {DRONES.map((d, i) => (
        <Drone key={i} curve={DRONE_PATHS[d.path]} offset={d.offset} speed={d.speed} />
      ))}
      <Aircraft />
      <DustMotes />
      <RimLight />
    </>
  );
}

const BG_LOOK = new THREE.Vector3(0, 2.7, 0);

/** Background mode owns the camera: a slow fixed-radius orbit, no controls. */
function BackgroundRig() {
  const ctx = useScene();
  useFrame(({ camera, clock }) => {
    const th = 0.65 + (ctx.still ? 0 : clock.elapsedTime * 0.03);
    camera.position.set(Math.sin(th) * 21, 6.6, Math.cos(th) * 21);
    camera.lookAt(BG_LOOK);
  });
  return null;
}

function usePrefersReducedMotion() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return still;
}

/** The cockpit, docked to the VIEWPORT (portal to body): bottom-center,
 *  same place no matter how the page scrolls. The wheel is alive: an rAF
 *  loop eases the rim toward the live steering input (keyboard included)
 *  and layers in micro road-feel while throttle is applied, so it reads
 *  as a machine being driven, not a static widget. */
function DriveOverlay({ api, sel }: { api: DriveApi; sel: DriveSel | null }) {
  const [gear, setGear] = useState<"R" | "N" | "D">("D");
  const [pedal, setPedal] = useState<0 | 1>(0);
  const [braking, setBraking] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const shown = useRef(0);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    setGear("D");
    setPedal(0);
    setBraking(false);
    api.input.current.th = 0;
    api.input.current.st = 0;
    api.input.current.bk = 0;
  }, [sel?.id, api]);

  // gear + pedal resolve into throttle; brake is its own held channel
  useEffect(() => {
    api.input.current.th = pedal === 1 ? (gear === "D" ? 1 : gear === "R" ? -0.7 : 0) : 0;
  }, [api, gear, pedal]);
  useEffect(() => {
    api.input.current.bk = braking ? 1 : 0;
  }, [api, braking]);

  // the living wheel: ease toward input, add road-feel under throttle
  useEffect(() => {
    if (!sel) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const target = api.input.current.st * 120;
      shown.current += (target - shown.current) * 0.18;
      const feel =
        Math.abs(api.input.current.th) > 0.05
          ? Math.sin(t * 7.1) * 1.3 + Math.sin(t * 13.7) * 0.7
          : Math.sin(t * 1.9) * 0.4;
      const el = wheelRef.current;
      if (el) el.style.transform = `rotate(${shown.current + feel}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sel, api]);

  // keyboard: throttle, steer, space brakes, Esc exits
  useEffect(() => {
    if (!sel) return;
    const input = api.input;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "arrowup"].includes(k)) input.current.th = 1;
      if (["s", "arrowdown"].includes(k)) input.current.th = -0.7;
      if (["a", "arrowleft"].includes(k)) input.current.st = -1;
      if (["d", "arrowright"].includes(k)) input.current.st = 1;
      if (k === " ") input.current.bk = 1;
      if (k === "escape") api.set(null);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "s", "arrowup", "arrowdown"].includes(k)) input.current.th = 0;
      if (["a", "d", "arrowleft", "arrowright"].includes(k)) input.current.st = 0;
      if (k === " ") input.current.bk = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      input.current.th = 0;
      input.current.st = 0;
      input.current.bk = 0;
    };
  }, [sel, api]);

  if (!sel) return null;

  const onWheelDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = e.clientX - api.input.current.st * 70;
  };
  const onWheelMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    api.input.current.st = Math.max(-1, Math.min(1, (e.clientX - dragStart.current) / 70));
  };
  const onWheelUp = () => {
    dragStart.current = null;
    api.input.current.st = 0;
  };

  const base: React.CSSProperties = {
    userSelect: "none",
    touchAction: "none",
    fontFamily: "monospace",
    color: "#cfe4ff",
  };
  const gearBtn = (g: "R" | "N" | "D"): React.CSSProperties => ({
    ...base,
    fontSize: 13,
    padding: "9px 14px",
    borderRadius: 7,
    cursor: "pointer",
    textAlign: "center",
    border: `1px solid ${gear === g ? "#9fb4d0" : "#2c2e35"}`,
    background: gear === g ? "rgba(159,180,208,0.18)" : "rgba(16,17,20,0.92)",
    color: gear === g ? "#e6f0ff" : "#9a9aa3",
  });
  const pedalStyle = (active: boolean): React.CSSProperties => ({
    ...base,
    fontSize: 11,
    letterSpacing: "0.12em",
    padding: "15px 17px",
    borderRadius: 8,
    cursor: "pointer",
    border: `1px solid ${active ? "#9fb4d0" : "#2c2e35"}`,
    background: active ? "rgba(159,180,208,0.2)" : "rgba(16,17,20,0.92)",
  });

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 16,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        pointerEvents: "none",
      }}
    >
      <div style={{ ...base, fontSize: 10, letterSpacing: "0.2em", color: "#9a9aa3", background: "rgba(10,10,11,0.82)", padding: "5px 10px", borderRadius: 6 }}>
        DRIVING · {sel.label} · WASD + SPACE BRAKE · ESC EXITS
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, pointerEvents: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {(["R", "N", "D"] as const).map((g) => (
            <div key={g} style={gearBtn(g)} onPointerDown={() => setGear(g)}>
              {g}
            </div>
          ))}
        </div>
        <div
          ref={wheelRef}
          style={{
            ...base,
            width: 104,
            height: 104,
            borderRadius: "50%",
            border: "3px solid #3a3d44",
            background: "rgba(13,14,17,0.94)",
            position: "relative",
            cursor: "grab",
            willChange: "transform",
          }}
          onPointerDown={onWheelDown}
          onPointerMove={onWheelMove}
          onPointerUp={onWheelUp}
          onPointerCancel={onWheelUp}
        >
          <div style={{ position: "absolute", left: "50%", top: 7, bottom: "50%", width: 4, marginLeft: -2, background: "#3a3d44", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: "50%", left: 9, right: 9, height: 4, marginTop: -2, background: "#3a3d44", borderRadius: 2 }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 24, height: 24, margin: "-12px 0 0 -12px", borderRadius: "50%", background: "#23252b", border: "1px solid #4a4e56" }} />
          <div style={{ position: "absolute", left: "50%", top: 10, width: 7, height: 7, marginLeft: -3.5, borderRadius: "50%", background: "#9fb4d0" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={pedalStyle(pedal === 1)}
            onPointerDown={() => setPedal(1)}
            onPointerUp={() => setPedal(0)}
            onPointerLeave={() => setPedal(0)}
          >
            ACCEL
          </div>
          <div
            style={pedalStyle(braking)}
            onPointerDown={() => setBraking(true)}
            onPointerUp={() => setBraking(false)}
            onPointerLeave={() => setBraking(false)}
          >
            BRAKE
          </div>
        </div>
        <div style={{ ...pedalStyle(false), color: "#e2937e" }} onPointerDown={() => api.set(null)}>
          ✕ EXIT
        </div>
      </div>
    </div>
  );
}

export default function FutureCityScene(props: FutureCitySceneProps) {
  const background = props.background ?? false;
  const still = usePrefersReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const [driveSel, setDriveSel] = useState<DriveSel | null>(null);
  const driveInput = useRef({ th: 0, st: 0, bk: 0 });
  const driveTarget = useRef<THREE.Object3D | null>(null);
  const orbitRef = useRef<{ enabled: boolean } | null>(null);
  const driveApi = useMemo<DriveApi>(
    () => ({ sel: driveSel, set: setDriveSel, input: driveInput, target: driveTarget }),
    [driveSel]
  );
  const ctx: Ctx = { background, still, dim: background ? 0.55 : 1 };
  const lightDim = background ? 0.8 : 1;

  // Same mount nudge as HvacScene/LlmScene: some browsers (notably
  // Edge/Windows) miss r3f's first ResizeObserver measurement and the canvas
  // sticks at 300x150. A window "resize" forces a re-measure.
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [60, 250, 800].map((ms) => window.setTimeout(nudge, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
    <Canvas
      // Background mode caps dpr: it sits behind content, it does not get to
      // spend retina pixels.
      dpr={background ? [1, 1.5] : [1, 2]}
      // Hero start: a low 3/4 dolly angle so the humanoids and vehicles
      // dominate the frame instead of the skyline.
      camera={{ position: [9.5, 2.2, 15.5], fov: 40 }}
      // powerPreference nudges hybrid-GPU Windows laptops onto the discrete
      // GPU; leaving failIfMajorPerformanceCaveat false lets weak/software
      // GPUs still render instead of hard-failing on Edge.
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: props.glPower ?? "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0a0a0b");
        // Some Windows/Edge GPUs drop the WebGL context under memory pressure
        // or a driver reset. preventDefault on "lost" lets the browser fire
        // "restored" so three.js rebuilds instead of freezing on a blank canvas.
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
      onPointerDown={background ? undefined : () => setInteracted(true)}
      style={background ? { pointerEvents: "none", touchAction: "none" } : { touchAction: "none" }}
    >
      <fog attach="fog" args={["#0a0a0b", 18, 56]} />
      <SceneCtx.Provider value={ctx}>
        <DriveCtx.Provider value={background ? null : driveApi}>
          <World />
          {background && <BackgroundRig />}
          {!background && <ChaseCam controls={orbitRef} />}
          {!background && <CanvasHint />}
        </DriveCtx.Provider>
      </SceneCtx.Provider>

      <Grid
        position={[0, 0.005, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.35}
        cellColor="#1c1f24"
        sectionSize={5}
        sectionThickness={0.7}
        sectionColor="#2a2e35"
        fadeDistance={38}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* fill stays dim: the key and rim do the modelling */}
      <ambientLight intensity={0.18 * lightDim} />
      <hemisphereLight args={["#8fa3c0", "#26262c", 0.3 * lightDim]} />
      {/* cool moonlight key from camera-left of the hero start */}
      <directionalLight position={[-11, 11, 20]} color="#b9cfec" intensity={1.4 * lightDim} />
      {/* faint counter-fill so the dark sides never go to pure black */}
      <directionalLight position={[8, 5, -6]} intensity={0.22 * lightDim} />
      {/* procedural studio environment: real reflections on every hull
          without fetching a single asset (CSP-safe, offline-safe); side
          formers pushed up so the brushed metals keep a horizon to mirror */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} color="#cdd3dd" />
        <Lightformer intensity={1.6} position={[-8, 3, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} color="#9fb4d0" />
        <Lightformer intensity={1.2} position={[8, 2.5, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[7, 3, 1]} color="#d9c9a8" />
        <Lightformer intensity={0.6} position={[0, 2, -9]} scale={[10, 2, 1]} color="#7d8aa0" />
      </Environment>

      {/* selective glow, hero mode only: threshold high enough that only the
          emissives and light bars cross it, never the hulls */}
      {!background && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}

      {!background && (
        <OrbitControls
          ref={orbitRef as never}
          target={[0, 1.7, 0]}
          enablePan
          enableDamping
          autoRotate={!interacted && !still}
          autoRotateSpeed={0.35}
          onStart={() => setInteracted(true)}
          minDistance={5}
          maxDistance={36}
          maxPolarAngle={1.56}
        />
      )}
    </Canvas>
    {!background &&
      typeof document !== "undefined" &&
      createPortal(<DriveOverlay api={driveApi} sel={driveSel} />, document.body)}
    </>
  );
}
