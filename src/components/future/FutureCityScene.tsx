"use client";
/**
 * FutureCityScene: a year-2040 establishing shot. A levitating cloud brain
 * over a central plaza, faceless humanoid robots walking a loop while a pair
 * assembles a frame, autonomous drones on curved patrol paths, driverless
 * cars gliding a ring road with light trails, monolith towers with a landing
 * pad and holographic rings, and a silent aircraft crossing high up now and
 * then.
 *
 * Built to survive as a homepage background, so restraint is the design:
 * one ice-blue emissive family plus sparse amber, low-poly primitives,
 * instancing for every repeated glow, no shadow passes, no postprocessing
 * (same call as LlmScene: polish comes from materials and light, not glow).
 * Draw calls stay under ~100. Loaded lazily, three.js never touches the
 * main bundle.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Grid, Lightformer, OrbitControls, Trail } from "@react-three/drei";
import * as THREE from "three";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  glass: { color: "#12141a", metalness: 0.9, roughness: 0.18 },
  car: { color: "#181b21", metalness: 0.85, roughness: 0.3 },
} as const;

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

/** Pedestrian loop around the plaza under the brain. */
const WALKWAY = new THREE.CatmullRomCurve3(
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const r = 4.3 + ((i * 29) % 5) * 0.06;
    return v3(Math.cos(a) * r, 0, Math.sin(a) * r);
  }),
  true
);

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

const CARS = [
  { offset: 0, speed: 0.03 },
  { offset: 0.38, speed: 0.026 },
  { offset: 0.72, speed: 0.034 },
];

const TOWERS = [
  { x: -8.5, z: -7.5, w: 1.15, h: 9.5 },
  { x: -10.6, z: -4.2, w: 0.85, h: 6.2 },
  { x: 9.6, z: -8.4, w: 1.3, h: 11 },
  { x: 11.6, z: -5, w: 0.7, h: 5 },
];

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
      {/* soft halo around the core: cheap glow without a bloom pass */}
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
 *  Robots: stylized figures, blank domes, no faces, no marks
 * ---------------------------------------------------------------- */

function Robot({ mode, phase }: { mode: "walk" | "assemble"; phase: number }) {
  const ctx = useScene();
  const root = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!root.current || !armL.current || !armR.current || !legL.current || !legR.current) return;
    const t = ctx.still ? 0 : clock.elapsedTime;
    const amp = ctx.still ? 0 : 1;
    if (mode === "walk") {
      const s = Math.sin(t * 3.6 + phase) * 0.5 * amp;
      legL.current.rotation.x = s;
      legR.current.rotation.x = -s;
      armL.current.rotation.x = -s * 0.65;
      armR.current.rotation.x = s * 0.65;
      root.current.position.y = Math.abs(Math.sin(t * 3.6 + phase)) * 0.03 * amp;
    } else {
      // both arms working at chest height, slightly out of phase: reads as
      // handling a part, not waving
      armL.current.rotation.x = -1.3 + Math.sin(t * 1.2 + phase) * 0.28 * amp;
      armR.current.rotation.x = -1.3 + Math.sin(t * 1.2 + phase + 0.9) * 0.28 * amp;
      root.current.rotation.x = 0.07;
    }
  });

  return (
    <group ref={root}>
      <mesh position={[0, 0.82, 0]}>
        <capsuleGeometry args={[0.125, 0.34, 4, 10]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      {/* head: a smooth blank dome, deliberately faceless */}
      <mesh position={[0, 1.16, 0]}>
        <sphereGeometry args={[0.095, 12, 10]} />
        <meshStandardMaterial {...M.joint} />
      </mesh>
      {/* chest light: the one identity mark they get */}
      <mesh position={[0, 0.9, 0.135]}>
        <boxGeometry args={[0.08, 0.025, 0.02]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.85 * ctx.dim} />
      </mesh>
      <group ref={armL} position={[-0.185, 0.97, 0]}>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.032, 0.26, 4, 8]} />
          <meshStandardMaterial {...M.joint} />
        </mesh>
      </group>
      <group ref={armR} position={[0.185, 0.97, 0]}>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.032, 0.26, 4, 8]} />
          <meshStandardMaterial {...M.joint} />
        </mesh>
      </group>
      <group ref={legL} position={[-0.07, 0.46, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial {...M.hull} />
        </mesh>
      </group>
      <group ref={legR} position={[0.07, 0.46, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial {...M.hull} />
        </mesh>
      </group>
    </group>
  );
}

function Walker({ offset, speed, phase }: { offset: number; speed: number; phase: number }) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const t = useRef(offset);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (!ctx.still) t.current = (t.current + speed * delta) % 1;
    WALKWAY.getPointAt(t.current, p);
    WALKWAY.getTangentAt(t.current, tan);
    g.position.set(p.x, 0.05, p.z);
    g.rotation.y = Math.atan2(tan.x, tan.z);
  });
  return (
    <group ref={group}>
      <Robot mode="walk" phase={phase} />
    </group>
  );
}

function Walkers() {
  const walkers = [
    { offset: 0, speed: 0.03 },
    { offset: 0.36, speed: 0.027 },
    { offset: 0.68, speed: 0.033 },
  ];
  return (
    <>
      {walkers.map((w, i) => (
        <Walker key={i} offset={w.offset} speed={w.speed} phase={i * 2.1} />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- *
 *  Build site: a frame going up, one beam placed on loop by a pair
 * ---------------------------------------------------------------- */

function BuildSite() {
  const ctx = useScene();
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const m = beam.current;
    const mat = beamMat.current;
    if (!m || !mat) return;
    // one placement cycle: lift for ~5.5s, seat, dissolve, repeat. The loop
    // reads as steady work, not a glitch, because the dissolve is quiet.
    const p = ctx.still ? 0.6 : (clock.elapsedTime % 10) / 10;
    const rise = THREE.MathUtils.smoothstep(Math.min(p / 0.55, 1), 0, 1);
    m.position.y = 0.3 + rise * 1.9;
    mat.opacity = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.15) : 1;
    m.visible = mat.opacity > 0.01;
  });
  return (
    <group position={[6.2, 0, 5.8]} rotation={[0, -0.5, 0]}>
      {/* columns done, one top beam and one mid beam in, the rest still to come */}
      {[[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <boxGeometry args={[0.09, 2.2, 0.09]} />
          <meshStandardMaterial {...M.joint} />
        </mesh>
      ))}
      <mesh position={[0, 2.2, -0.85]}>
        <boxGeometry args={[1.8, 0.09, 0.09]} />
        <meshStandardMaterial {...M.joint} />
      </mesh>
      <mesh position={[-0.85, 1.15, 0]}>
        <boxGeometry args={[0.09, 0.09, 1.8]} />
        <meshStandardMaterial {...M.joint} />
      </mesh>
      {/* the beam the pair is placing */}
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
      {/* the assembly pair, facing the frame from either side */}
      <group position={[1.7, 0, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <Robot mode="assemble" phase={0} />
      </group>
      <group position={[-1.7, 0, 0.4]} rotation={[0, Math.PI / 2, 0]}>
        <Robot mode="assemble" phase={1.7} />
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
    // across the ±π wrap so the roll never snaps
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
 *  Roadway and cars
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

function Car({ offset, speed }: { offset: number; speed: number }) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const t = useRef(offset);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (!ctx.still) t.current = (t.current + speed * delta) % 1;
    ROAD.getPointAt(t.current, p);
    ROAD.getTangentAt(t.current, tan);
    g.position.set(p.x, 0.14, p.z);
    g.rotation.y = Math.atan2(tan.x, tan.z);
  });
  const marker = (
    <mesh position={[0, 0.06, -0.58]}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.9 * ctx.dim} depthWrite={false} />
    </mesh>
  );
  return (
    <group ref={group}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.52, 0.14, 1.1]} />
        <meshStandardMaterial {...M.car} />
      </mesh>
      <mesh position={[0, 0.13, -0.06]}>
        <boxGeometry args={[0.42, 0.1, 0.58]} />
        <meshStandardMaterial {...M.glass} />
      </mesh>
      <mesh position={[0, 0.03, 0.56]}>
        <boxGeometry args={[0.44, 0.02, 0.03]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.9 * ctx.dim} />
      </mesh>
      {/* the light trail is what sells the glide; frozen scenes keep the marker only */}
      {ctx.still ? (
        marker
      ) : (
        <Trail width={0.4} length={4.5} decay={2.2} color={ICE} attenuation={(w) => w * w}>
          {marker}
        </Trail>
      )}
    </group>
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

function Plaza() {
  const ctx = useScene();
  return (
    <group>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[5.4, 5.55, 0.05, 40]} />
        <meshStandardMaterial color="#17181c" metalness={0.45} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.95, 5.05, 48]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.3 * ctx.dim} side={THREE.DoubleSide} />
      </mesh>
    </group>
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
 *  Composition + camera
 * ---------------------------------------------------------------- */

function World() {
  return (
    <>
      <Plaza />
      <CloudBrain />
      <Roadway />
      <Towers />
      <HomeBase />
      <BuildSite />
      <Walkers />
      {DRONES.map((d, i) => (
        <Drone key={i} curve={DRONE_PATHS[d.path]} offset={d.offset} speed={d.speed} />
      ))}
      {CARS.map((c, i) => (
        <Car key={i} offset={c.offset} speed={c.speed} />
      ))}
      <Aircraft />
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

export default function FutureCityScene(props: FutureCitySceneProps) {
  const background = props.background ?? false;
  const still = usePrefersReducedMotion();
  const [interacted, setInteracted] = useState(false);
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
    <Canvas
      // Background mode caps dpr: it sits behind content, it does not get to
      // spend retina pixels.
      dpr={background ? [1, 1.5] : [1, 2]}
      camera={{ position: [13, 7, 18.5], fov: 42 }}
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
        <World />
        {background && <BackgroundRig />}
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

      <ambientLight intensity={0.35 * lightDim} />
      <hemisphereLight args={["#ffffff", "#3a3a40", 0.4 * lightDim]} />
      <directionalLight position={[6, 10, 6]} intensity={0.95 * lightDim} />
      <directionalLight position={[-7, 5, -4]} intensity={0.4 * lightDim} />
      {/* procedural studio environment: real reflections on every hull
          without fetching a single asset (CSP-safe, offline-safe) */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} color="#cdd3dd" />
        <Lightformer intensity={1.1} position={[-8, 3, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} color="#9fb4d0" />
        <Lightformer intensity={0.9} position={[8, 2.5, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[7, 3, 1]} color="#d9c9a8" />
        <Lightformer intensity={0.5} position={[0, 2, -9]} scale={[10, 2, 1]} color="#7d8aa0" />
      </Environment>

      {!background && (
        <OrbitControls
          target={[0, 2.7, 0]}
          enablePan
          enableDamping
          autoRotate={!interacted && !still}
          autoRotateSpeed={0.4}
          onStart={() => setInteracted(true)}
          minDistance={6}
          maxDistance={36}
          maxPolarAngle={1.5}
        />
      )}
    </Canvas>
  );
}
