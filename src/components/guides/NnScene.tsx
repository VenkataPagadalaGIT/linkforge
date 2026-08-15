"use client";
import { useMemo, useRef, useState, useEffect, createContext, useContext } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  Text,
} from "@react-three/drei";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  NN_JOURNEY,
  NN_DEMO_PROBS,
  nnStageById,
  type NnFlow,
} from "@/data/nn";

/**
 * NnScene: the 784-16-16-10 network as a film set.
 *
 * Same material language as LlmScene and HvacScene: neutral studio lighting,
 * gunmetal plinths, muted act accents, soft-reflective floor, cinematic
 * camera rig. The centerpiece is honest: all 12,960 weights are really
 * drawn (one GPU line each), the digit really dissolves into 784 pixels,
 * the descent paths on the loss terrain are computed by running actual
 * gradient descent on the terrain function, and every number a label shows
 * comes from src/data/nn.ts, which traces to the verified KB.
 */

export type NnProgram =
  | "pixels" | "reveal" | "neuron" | "weights"
  | "forward" | "relu" | "softmax" | "loss"
  | "descent" | "backprop" | "adam" | "training"
  | "init" | "dropout" | "features" | "brain";

export interface NnSceneState {
  selectedId: string | null;
  highlightIds: string[];
  onSelect: (id: string | null) => void;
  running: boolean;
  labels: boolean;
  flow: NnFlow;
  /** Journey program driving the scene animation. Null = free explore. */
  program: NnProgram | null;
  /** Journey step id for the cinematic camera. Null = free camera. */
  focusStepId?: string | null;
  glPower?: "high-performance" | "default";
}

interface Ctx extends Omit<NnSceneState, "highlightIds"> {
  highlight: Set<string>;
  attract: boolean;
}
const SceneCtx = createContext<Ctx | null>(null);
const useScene = () => useContext(SceneCtx)!;

/* Act accents, muted for the studio look (mirrors ZONES colors). */
const ACCENT: Record<string, string> = {
  machine: "#5f8cb0", forward: "#8b84ad", learning: "#b39a6b", learned: "#79a68d",
};
const stationColor = (id: string) => ACCENT[nnStageById(id)?.act ?? "machine"];

/* ---------------------------------------------------------------- *
 *  Geometry of the machine
 * ---------------------------------------------------------------- */

const WALL_X = -7.5;
const WALL_CY = 2.5;
const CELL = 0.088;
const L1_X = -3.5;
const L2_X = 0.5;
const OUT_X = 4.5;
const BARS_X = 7.1;

/** Hidden layers: 4x4 grids in the YZ plane, so the lattice has depth. */
function hiddenPos(i: number, x: number): [number, number, number] {
  const row = Math.floor(i / 4);
  const col = i % 4;
  return [x, 1.7 + row * 0.55, -0.85 + col * 0.55];
}
function outPos(i: number): [number, number, number] {
  return [OUT_X, 1.15 + i * 0.3, 0];
}

/** Procedural "5": stroke rasterizer over the 28x28 grid. Row 0 = top. */
function digitIntensity(row: number, col: number): number {
  const inBox = (r0: number, r1: number, c0: number, c1: number) =>
    row >= r0 && row <= r1 && col >= c0 && col <= c1;
  const on =
    inBox(4, 6, 7, 20) || // top bar
    inBox(7, 13, 7, 10) || // left stem
    inBox(12, 14, 7, 19) || // middle bar
    inBox(14, 22, 16, 19) || // right stem
    inBox(20, 23, 6, 17); // bottom bar
  if (!on) return 0;
  // deterministic per-pixel jitter: handwriting is not uniform ink
  const h = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
  return 0.7 + 0.3 * Math.abs(h - Math.floor(h));
}

const PIXELS: { y: number; z: number; v: number }[] = (() => {
  const out: { y: number; z: number; v: number }[] = [];
  for (let r = 0; r < 28; r++)
    for (let c = 0; c < 28; c++)
      out.push({
        y: WALL_CY + (13.5 - r) * CELL,
        z: (13.5 - c) * CELL,
        v: digitIntensity(r, c),
      });
  return out;
})();

/* ---------------------------------------------------------------- *
 *  Camera choreography
 * ---------------------------------------------------------------- */

const DEFAULT_POSE = { pos: [1.6, 5.2, 15.5] as const, look: [-0.3, 2.2, 0] as const };
const DEFAULT_POS_V = new THREE.Vector3(...DEFAULT_POSE.pos);
const CAM_POSES: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = {
  "j-pixels": { pos: [-5.1, 2.9, 3.8], look: [-7.5, 2.5, 0] },
  "j-reveal": { pos: [1.6, 5.2, 15.5], look: [-0.3, 2.2, 0] },
  "j-neuron": { pos: [-3.0, 2.9, 4.6], look: [-3.5, 2.3, 1.5] },
  "j-weights": { pos: [-1.2, 4.8, 13.0], look: [-1.7, 2.4, 0] },
  "j-forward": { pos: [0.8, 4.6, 12.6], look: [-0.4, 2.5, 0] },
  "j-relu": { pos: [-1.3, 3.0, 5.6], look: [-1.5, 2.4, 0] },
  "j-softmax": { pos: [5.6, 3.3, 4.9], look: [7.1, 2.4, 0] },
  "j-loss": { pos: [7.8, 3.2, 1.8], look: [7.5, 2.0, -2.4] },
  "j-descent": { pos: [-2.6, 5.6, -0.6], look: [-2.6, 0.7, -6.4] },
  "j-backprop": { pos: [0.8, 4.6, 12.6], look: [-0.4, 2.5, 0] },
  "j-adam": { pos: [0.2, 4.6, -1.6], look: [-0.6, 0.9, -6.2] },
  "j-training": { pos: [4.8, 3.3, -1.0], look: [4.8, 1.6, -6.2] },
  "j-init": { pos: [-6.6, 3.0, -2.6], look: [-6.8, 1.3, -6.0] },
  "j-dropout": { pos: [-2.6, 3.8, -5.4], look: [-2.6, 1.2, -10.0] },
  "j-features": { pos: [2.1, 3.8, -5.4], look: [2.1, 1.2, -10.0] },
  "j-brain": { pos: [6.8, 3.8, -5.4], look: [6.9, 1.2, -10.0] },
};

const STAGE_POSE: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = (() => {
  const m: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = {};
  for (const step of NN_JOURNEY) {
    const pose = CAM_POSES[step.id];
    if (pose && !m[step.stageId]) m[step.stageId] = pose;
  }
  return m;
})();

function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const ctx = useScene();
  const { camera, size } = useThree();
  const overrideRef = useRef(false);
  const lastStep = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    overrideRef.current = false;
  }, [size.width, size.height]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const onStart = () => { overrideRef.current = true; };
    c.addEventListener("start", onStart);
    return () => c.removeEventListener("start", onStart);
  }, [controls]);

  useFrame(() => {
    const focusKey = ctx.focusStepId ?? ctx.selectedId ?? null;
    if (focusKey !== lastStep.current) {
      lastStep.current = focusKey;
      overrideRef.current = false;
    }
    if (overrideRef.current) return;
    if (!focusKey && ctx.attract && camera.position.distanceTo(DEFAULT_POS_V) < 0.5) return;
    const pose = ctx.focusStepId
      ? CAM_POSES[ctx.focusStepId] ?? DEFAULT_POSE
      : focusKey
        ? STAGE_POSE[focusKey] ?? DEFAULT_POSE
        : DEFAULT_POSE;
    const c = controls.current;
    camera.position.lerp(new THREE.Vector3(...pose.pos), 0.04);
    if (c) {
      c.target.lerp(new THREE.Vector3(...pose.look), 0.05);
      c.update();
    }
  });
  return null;
}

/* ---------------------------------------------------------------- *
 *  Shared program clock: one wave position drives the whole machine.
 *  The wave sweeps machine-space x. Forward: left to right. Backward:
 *  right to left in amber. Idle: a faint forward whisper.
 * ---------------------------------------------------------------- */

const WAVE_X0 = -8.8;
const WAVE_X1 = 8.2;
const WAVE_SPAN = WAVE_X1 - WAVE_X0;

function useWave() {
  const ctx = useScene();
  const wave = useRef({ x: WAVE_X0, dir: 1 as 1 | -1, strength: 0 });
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = ctx.program;
    const backward = p === "backprop" || ctx.flow === "backward";
    const active =
      p === "forward" || p === "relu" || p === "softmax" || p === "loss" ||
      p === "backprop" || p === "training" || ctx.flow === "forward" || ctx.flow === "backward";
    const period = p === "training" ? 2.6 : 4.2;
    const frac = (t % period) / period;
    const x = backward ? WAVE_X1 - frac * WAVE_SPAN : WAVE_X0 + frac * WAVE_SPAN;
    wave.current.x = x;
    wave.current.dir = backward ? -1 : 1;
    const idle = ctx.running ? 0.16 : 0;
    wave.current.strength = active ? 1 : idle;
  });
  return wave;
}
const WaveCtx = createContext<React.MutableRefObject<{ x: number; dir: 1 | -1; strength: number }> | null>(null);
const useWaveRef = () => useContext(WaveCtx)!;

/* ---------------------------------------------------------------- *
 *  Design language: plinth with accent light strip (same as LlmScene)
 * ---------------------------------------------------------------- */

function Plinth({ w, d, color }: { w: number; d: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[w, 0.16, d]} />
        <meshStandardMaterial color="#26282e" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.055, d / 2 + 0.012]}>
        <boxGeometry args={[w * 0.94, 0.028, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.055, -d / 2 - 0.012]}>
        <boxGeometry args={[w * 0.94, 0.028, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Station wrapper: selection halo + label (id = stage id)
 * ---------------------------------------------------------------- */

function Station({
  id,
  children,
  labelPos = [0, 1.35, 0],
  halo = [2.2, 2.2, 1.4],
  plinth,
  noHalo = false,
}: {
  id: string;
  children: React.ReactNode;
  labelPos?: [number, number, number];
  halo?: [number, number, number];
  plinth?: { w: number; d: number };
  noHalo?: boolean;
}) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  const selected = ctx.selectedId === id;
  const lit = selected || ctx.highlight.has(id);
  const stage = nnStageById(id);
  const color = stationColor(id);

  useFrame(() => {
    if (haloMat.current) {
      const target = selected ? 0.2 : lit ? 0.12 : hover ? 0.1 : 0;
      haloMat.current.opacity = THREE.MathUtils.lerp(haloMat.current.opacity, target, 0.12);
    }
    if (group.current) {
      const s = lit ? 1.02 : 1;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, s, 0.1));
    }
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    ctx.onSelect(selected ? null : id);
  };

  return (
    <group
      ref={group}
      onClick={click}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
    >
      {plinth && <Plinth w={plinth.w} d={plinth.d} color={color} />}
      {children}
      <mesh position={[0, halo[1] / 2 - 0.1, 0]} visible={!noHalo}>
        <boxGeometry args={halo} />
        <meshBasicMaterial ref={haloMat} color={color} transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {((ctx.labels && (!ctx.program || lit)) || selected || lit) && stage && (
        <Html position={labelPos} center distanceFactor={9} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <div
            style={{
              font: "600 10px ui-monospace, monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: lit ? "#0a0a0a" : color,
              background: lit ? color : "rgba(8,8,10,0.82)",
              border: `1px solid ${color}${lit ? "" : "55"}`,
              padding: "2px 6px",
              whiteSpace: "nowrap",
              boxShadow: lit ? `0 0 14px ${color}66` : "none",
            }}
          >
            {stage.short}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  The pixel wall: 784 instanced cubes carrying the digit
 * ---------------------------------------------------------------- */

function PixelWall() {
  const ctx = useScene();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const colA = useMemo(() => new THREE.Color("#dbe6f2"), []);
  const colB = useMemo(() => new THREE.Color("#141519"), []);
  const c = useMemo(() => new THREE.Color(), []);
  const assembleT = useRef(1);

  // Seed instance colors once: brightness = pixel value.
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < 784; i++) {
      c.copy(colB).lerp(colA, PIXELS[i].v);
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [c, colA, colB]);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    // "pixels" program: the digit re-assembles, cells scaling in as a sweep.
    const target = ctx.program === "pixels" ? 0 : 1;
    if (ctx.program === "pixels" && assembleT.current > 0.999) assembleT.current = 0;
    assembleT.current = Math.min(1, assembleT.current + dt * (target === 1 ? 0.6 : 0.35));
    const sweep = ctx.program === "pixels" ? (state.clock.elapsedTime * 0.35) % 1.4 : 2;
    for (let i = 0; i < 784; i++) {
      const p = PIXELS[i];
      const row = Math.floor(i / 28) / 28;
      const grow = THREE.MathUtils.clamp(sweep * 1.6 - row, 0.15, 1);
      const s = (0.25 + 0.75 * p.v) * grow;
      tmp.position.set(WALL_X, p.y, p.z);
      tmp.scale.setScalar(Math.max(0.12, s));
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <Station id="pixels" labelPos={[0, WALL_CY + 1.75, 0]} halo={[1.2, 3.2, 3.2]} noHalo={false}>
      {/* backing frame */}
      <mesh position={[-0.09, WALL_CY, 0]}>
        <boxGeometry args={[0.06, 2.75, 2.75]} />
        <meshStandardMaterial color="#26282e" roughness={0.4} metalness={0.6} />
      </mesh>
      <instancedMesh ref={mesh} args={[undefined, undefined, 784]} frustumCulled={false}>
        <boxGeometry args={[0.05, CELL * 0.86, CELL * 0.86]} />
        <meshStandardMaterial roughness={0.45} metalness={0.2} emissive="#8fa8c4" emissiveIntensity={0.3} />
      </instancedMesh>
      <Text position={[0, WALL_CY - 1.72, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.11} color="#9aa0ab" anchorX="center">
        28 x 28 = 784 inputs
      </Text>
    </Station>
  );
}

/* ---------------------------------------------------------------- *
 *  Weight fibers: every one of the 12,960 weights as a GPU line,
 *  with a shader that carries the forward/backward pulse.
 * ---------------------------------------------------------------- */

const fiberVertex = /* glsl */ `
  attribute float aT;
  attribute float aSeed;
  varying float vT;
  varying float vSeed;
  void main() {
    vT = aT;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fiberFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uPulseColor;
  uniform float uBase;
  uniform float uPulse;      // wave position in bundle-space 0..1 (can overshoot)
  uniform float uStrength;   // 0..1
  varying float vT;
  varying float vSeed;
  void main() {
    float base = uBase * (0.35 + 0.65 * vSeed);
    float d = (vT - uPulse) * 6.0;
    float pulse = exp(-d * d) * uStrength * (0.5 + 0.5 * vSeed);
    vec3 col = uColor * base + uPulseColor * pulse;
    float a = base + pulse;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`;

interface BundleSpec {
  from: [number, number, number][];
  fromWeight?: number[]; // per-source brightness (pixel values)
  to: [number, number, number][];
  x0: number;
  x1: number;
  base: number;
}

function FiberBundle({ spec }: { spec: BundleSpec }) {
  const ctx = useScene();
  const wave = useWaveRef();
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geo = useMemo(() => {
    const n = spec.from.length * spec.to.length;
    const pos = new Float32Array(n * 2 * 3);
    const aT = new Float32Array(n * 2);
    const aSeed = new Float32Array(n * 2);
    let k = 0;
    for (let i = 0; i < spec.from.length; i++) {
      const f = spec.from[i];
      const w = spec.fromWeight ? spec.fromWeight[i] : 1;
      for (let j = 0; j < spec.to.length; j++) {
        const t = spec.to[j];
        pos.set(f, k * 3);
        pos.set(t, (k + 1) * 3);
        aT[k] = 0;
        aT[k + 1] = 1;
        const h = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const seed = (0.2 + 0.8 * Math.abs(h - Math.floor(h))) * (0.3 + 0.7 * w);
        aSeed[k] = seed;
        aSeed[k + 1] = seed;
        k += 2;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    return g;
  }, [spec]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#4a5f78") },
      uPulseColor: { value: new THREE.Color("#cfe4ff") },
      uBase: { value: spec.base },
      uPulse: { value: -2 },
      uStrength: { value: 0 },
    }),
    [spec.base],
  );

  useFrame(() => {
    const m = mat.current;
    if (!m) return;
    const w = wave.current;
    // map machine-space wave x into this bundle's 0..1
    const local = (w.x - spec.x0) / (spec.x1 - spec.x0);
    m.uniforms.uPulse.value = local;
    m.uniforms.uStrength.value = THREE.MathUtils.lerp(
      m.uniforms.uStrength.value,
      w.strength,
      0.1,
    );
    const backward = w.dir === -1;
    (m.uniforms.uPulseColor.value as THREE.Color).set(backward ? "#e8b36a" : "#cfe4ff");
    // weights program: the lattice itself is the star
    const boost =
      ctx.program === "weights" || ctx.selectedId === "weights" ? 2.2 :
      ctx.program === "dropout" ? 0.55 : 1;
    m.uniforms.uBase.value = spec.base * boost;
  });

  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={fiberVertex}
        fragmentShader={fiberFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function Fibers() {
  const specs = useMemo<BundleSpec[]>(() => {
    const wallPts: [number, number, number][] = PIXELS.map((p) => [WALL_X + 0.03, p.y, p.z]);
    const wallW = PIXELS.map((p) => p.v);
    const l1: [number, number, number][] = Array.from({ length: 16 }, (_, i) => hiddenPos(i, L1_X));
    const l2: [number, number, number][] = Array.from({ length: 16 }, (_, i) => hiddenPos(i, L2_X));
    const out: [number, number, number][] = Array.from({ length: 10 }, (_, i) => outPos(i));
    return [
      { from: wallPts, fromWeight: wallW, to: l1, x0: WALL_X, x1: L1_X, base: 0.05 },
      { from: l1, to: l2, x0: L1_X, x1: L2_X, base: 0.16 },
      { from: l2, to: out, x0: L2_X, x1: OUT_X, base: 0.16 },
    ];
  }, []);
  return (
    <group>
      {specs.map((s, i) => (
        <FiberBundle key={i} spec={s} />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Neurons: 16 + 16 + 10 spheres with wave-driven glow and dropout
 * ---------------------------------------------------------------- */

function hash01(n: number) {
  const h = Math.sin(n * 91.17) * 43758.5453;
  return Math.abs(h - Math.floor(h));
}

function NeuronSphere({
  pos, x, index, layer, radius = 0.1, color = "#b9c4d4",
}: {
  pos: [number, number, number];
  x: number;
  index: number;
  layer: "l1" | "l2" | "out";
  radius?: number;
  color?: string;
}) {
  const ctx = useScene();
  const wave = useWaveRef();
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = mat.current;
    const ms = mesh.current;
    if (!m || !ms) return;
    const w = wave.current;
    const d = (w.x - x) * 0.9;
    const flash = Math.exp(-d * d) * w.strength;
    // dropout program: hidden neurons blink out in changing halves
    let alive = 1;
    if (ctx.program === "dropout" && layer !== "out") {
      const round = Math.floor(state.clock.elapsedTime * 1.1);
      alive = hash01(index * 7.3 + round * 131 + (layer === "l2" ? 57 : 0)) > 0.5 ? 1 : 0;
    }
    // init program: "dead start" dims everything briefly in a breathing cycle
    let initDim = 1;
    if (ctx.program === "init") {
      const t = (state.clock.elapsedTime % 6) / 6;
      initDim = t < 0.5 ? 0.25 : 1;
    }
    const base = layer === "out" ? 0.3 : 0.22;
    m.emissiveIntensity = THREE.MathUtils.lerp(
      m.emissiveIntensity,
      (base + flash * 1.6) * alive * initDim + 0.04,
      0.15,
    );
    const s = alive ? 1 : 0.25;
    ms.scale.setScalar(THREE.MathUtils.lerp(ms.scale.x, s, 0.2));
  });
  return (
    <mesh ref={mesh} position={pos}>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.2} roughness={0.35} metalness={0.4} />
    </mesh>
  );
}

function Lattice() {
  return (
    <Station id="layers" labelPos={[0.5, 5.3, 0]} halo={[9.6, 4.6, 2.6]} noHalo>
      {/* invisible click slab across the three neuron columns */}
      <mesh position={[0.5, 2.6, 0]} visible={false}>
        <boxGeometry args={[8.6, 4.4, 2.2]} />
        <meshBasicMaterial />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (
        <NeuronSphere key={`a${i}`} pos={hiddenPos(i, L1_X)} x={L1_X} index={i} layer="l1" />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <NeuronSphere key={`b${i}`} pos={hiddenPos(i, L2_X)} x={L2_X} index={i} layer="l2" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`o${i}`}>
          <NeuronSphere pos={outPos(i)} x={OUT_X} index={i} layer="out" radius={0.11} color="#a8d2b8" />
          <Text position={[OUT_X + 0.34, 1.15 + i * 0.3, 0]} fontSize={0.14} color="#9aa0ab" anchorX="left">
            {String(i)}
          </Text>
        </group>
      ))}
      {/* layer captions */}
      <Text position={[L1_X, 0.9, 0]} fontSize={0.11} color="#9aa0ab" anchorX="center">
        16 neurons
      </Text>
      <Text position={[L2_X, 0.9, 0]} fontSize={0.11} color="#9aa0ab" anchorX="center">
        16 neurons
      </Text>
      <Text position={[OUT_X, 0.82, 0]} fontSize={0.11} color="#9aa0ab" anchorX="center">
        10 outputs
      </Text>
    </Station>
  );
}

/* ---------------------------------------------------------------- *
 *  The spotlight neuron: w·x + b on a pedestal (station: neuron)
 * ---------------------------------------------------------------- */

function SpotlightNeuron() {
  const ctx = useScene();
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (!ring.current) return;
    const active = ctx.program === "neuron" || ctx.selectedId === "neuron";
    const pulse = active ? 0.5 + 0.25 * Math.sin(state.clock.elapsedTime * 2.4) : 0.16;
    ring.current.emissiveIntensity = THREE.MathUtils.lerp(ring.current.emissiveIntensity, pulse, 0.1);
  });
  // eight sample dendrites fanning out toward the wall
  const dendrites = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 7 - 0.5) * 1.5;
      pts.push([-1.4, 0.55 * Math.sin(a), 0.9 * Math.cos(a) - 0.45]);
    }
    return pts;
  }, []);
  return (
    <group position={[L1_X, 2.25, 1.5]}>
      <Station id="neuron" labelPos={[0, 0.95, 0]} halo={[1.9, 1.7, 1.6]}>
        <mesh>
          <sphereGeometry args={[0.22, 28, 28]} />
          <meshStandardMaterial ref={ring} color="#c9d6e8" emissive="#7fa4c9" emissiveIntensity={0.2} roughness={0.3} metalness={0.5} />
        </mesh>
        {dendrites.map((p, i) => {
          const dir = new THREE.Vector3(...p);
          const len = dir.length();
          const mid = dir.clone().multiplyScalar(0.5);
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          return (
            <mesh key={i} position={mid.toArray()} quaternion={quat}>
              <cylinderGeometry args={[0.006, 0.006, len, 5]} />
              <meshStandardMaterial color="#4a5f78" emissive="#7fa4c9" emissiveIntensity={0.25} transparent opacity={0.8} />
            </mesh>
          );
        })}
        <Text position={[0, -0.42, 0]} fontSize={0.12} color="#c8cfd9" anchorX="center">
          a = f(w · x + b)
        </Text>
        <Text position={[0, -0.62, 0]} fontSize={0.085} color="#9aa0ab" anchorX="center">
          784 weights, 1 bias
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Parameter counter (station: weights)
 * ---------------------------------------------------------------- */

function ParamCounter() {
  return (
    <group position={[-1.5, 0, 2.6]}>
      <Station id="weights" labelPos={[0, 1.5, 0]} halo={[2.5, 1.5, 0.8]} plinth={{ w: 2.3, d: 0.7 }}>
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[2.1, 0.9, 0.1]} />
          <meshStandardMaterial color="#1c1e23" roughness={0.35} metalness={0.6} emissive="#5f8cb0" emissiveIntensity={0.05} />
        </mesh>
        <Text position={[0, 0.92, 0.08]} fontSize={0.2} color="#dbe6f2" anchorX="center">
          13,002
        </Text>
        <Text position={[0, 0.66, 0.08]} fontSize={0.08} color="#9aa0ab" anchorX="center">
          12,960 weights + 42 biases
        </Text>
        <Text position={[0, 0.5, 0.08]} fontSize={0.07} color="#9aa0ab" anchorX="center">
          12,544 + 256 + 160 fibers, all drawn
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  ReLU gates: translucent plates the signal must cross
 * ---------------------------------------------------------------- */

function ReluGate({ x }: { x: number }) {
  const ctx = useScene();
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!mat.current) return;
    const active = ctx.program === "relu" || ctx.selectedId === "relu";
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, active ? 0.3 : 0.08, 0.08);
    mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, active ? 0.5 : 0.1, 0.08);
  });
  return (
    <mesh position={[x, 2.55, 0]}>
      <boxGeometry args={[0.05, 2.7, 2.4]} />
      <meshStandardMaterial ref={mat} color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.1} transparent opacity={0.08} roughness={0.3} />
    </mesh>
  );
}

function ReluStation() {
  const ctx = useScene();
  const kink = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!kink.current) return;
    const active = ctx.program === "relu" || ctx.selectedId === "relu";
    kink.current.rotation.z = active ? Math.sin(state.clock.elapsedTime) * 0.04 : 0;
  });
  return (
    <group position={[-1.5, 0, -2.2]}>
      <Station id="relu" labelPos={[0, 1.9, 0]} halo={[2.0, 2.0, 0.9]} plinth={{ w: 1.8, d: 0.8 }}>
        {/* the ReLU graph as physical neon: flat then up */}
        <group ref={kink} position={[0, 0.85, 0]}>
          <mesh position={[-0.4, 0, 0]}>
            <boxGeometry args={[0.8, 0.035, 0.035]} />
            <meshStandardMaterial color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.32, 0.32, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.95, 0.035, 0.035]} />
            <meshStandardMaterial color="#c9c2ea" emissive="#c9c2ea" emissiveIntensity={0.8} />
          </mesh>
        </group>
        <Text position={[0, 0.45, 0]} fontSize={0.11} color="#c8cfd9" anchorX="center">
          max(0, z)
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Softmax board: raw scores morph into probabilities
 * ---------------------------------------------------------------- */

function SoftmaxBoard() {
  const ctx = useScene();
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  // raw pre-softmax "scores" chosen so their softmax is the demo distribution
  const raw = useMemo(() => NN_DEMO_PROBS.map((d) => 0.15 + d.p * 0.55), []);
  useFrame(() => {
    const norm = ctx.program === "softmax" || ctx.program === "loss" ||
      ctx.program === "descent" || ctx.program === "backprop" ||
      ctx.program === "adam" || ctx.program === "training" ||
      ctx.selectedId === "softmax" || ctx.selectedId === "loss";
    for (let i = 0; i < 10; i++) {
      const b = bars.current[i];
      if (!b) continue;
      const target = norm ? Math.max(0.015, NN_DEMO_PROBS[i].p) * 1.9 : raw[i];
      b.scale.x = THREE.MathUtils.lerp(b.scale.x, target, 0.08);
    }
  });
  return (
    <group position={[BARS_X, 0, 0]}>
      <Station id="softmax" labelPos={[0.3, 4.6, 0]} halo={[1.6, 3.5, 0.9]} plinth={{ w: 1.7, d: 1.0 }}>
        {NN_DEMO_PROBS.map((d, i) => (
          <group key={d.digit}>
            <mesh
              ref={(el) => { bars.current[i] = el; }}
              position={[0, 1.15 + i * 0.3, 0]}
              scale={[0.3, 1, 1]}
            >
              <boxGeometry args={[1, 0.16, 0.16]} />
              <meshStandardMaterial
                color={i === 5 ? "#79a68d" : "#57626e"}
                emissive={i === 5 ? "#79a68d" : "#5f8cb0"}
                emissiveIntensity={i === 5 ? 0.55 : 0.3}
                roughness={0.4}
                metalness={0.4}
              />
            </mesh>
            <Text position={[-0.35, 1.15 + i * 0.3, 0]} fontSize={0.11} color="#9aa0ab" anchorX="right">
              {d.digit}
            </Text>
          </group>
        ))}
        <Text position={[0.3, 0.82, 0]} fontSize={0.09} color="#9aa0ab" anchorX="center">
          exp(z) / sum: totals 1.00
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Loss pylon: -log(p correct) as a physical meter
 * ---------------------------------------------------------------- */

function LossPylon() {
  const ctx = useScene();
  const fill = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!fill.current) return;
    const active = ctx.program === "loss" || ctx.selectedId === "loss";
    // breathe between "confident right" (0.36) and "confident wrong" (4.61), scaled
    const t = active ? (Math.sin(state.clock.elapsedTime * 0.8) + 1) / 2 : 0;
    const lossNorm = 0.36 / 4.61 + t * (1 - 0.36 / 4.61) * 0.85;
    const target = active ? lossNorm * 2.2 : (0.36 / 4.61) * 2.2;
    fill.current.scale.y = THREE.MathUtils.lerp(fill.current.scale.y, target, 0.06);
    fill.current.position.y = 0.4 + fill.current.scale.y / 2;
  });
  return (
    <group position={[7.5, 0, -2.4]}>
      <Station id="loss" labelPos={[0, 3.4, 0]} halo={[1.5, 3.2, 1.2]} plinth={{ w: 1.3, d: 1.0 }}>
        {/* glass tube */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 2.3, 16, 1, true]} />
          <meshStandardMaterial color="#3a4149" roughness={0.15} metalness={0.2} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={fill} position={[0, 0.5, 0]} scale={[1, 0.2, 1]}>
          <cylinderGeometry args={[0.12, 0.12, 1, 14]} />
          <meshStandardMaterial color="#b39a6b" emissive="#b39a6b" emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
        <Text position={[0, 2.95, 0]} fontSize={0.11} color="#c8cfd9" anchorX="center">
          L = -log p(correct)
        </Text>
        <Text position={[0, 0.22, 0.55]} fontSize={0.08} color="#9aa0ab" anchorX="center">
          0.7 right = 0.36 · 0.01 right = 4.61
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Loss terrain: real gradient descent runs on a real height field
 * ---------------------------------------------------------------- */

/** The terrain function: a tilted bowl with a ridge and a shallow trap. */
function terrainH(u: number, v: number) {
  const bowl = 0.16 * (u * u + v * v);
  const ridge = 0.42 * Math.exp(-((u + 0.4) * (u + 0.4)) * 2.2) * Math.exp(-v * v * 0.4);
  const wobble = 0.1 * Math.sin(2.1 * u) * Math.cos(1.7 * v);
  return bowl + ridge + wobble;
}
function terrainGrad(u: number, v: number): [number, number] {
  const e = 0.001;
  return [
    (terrainH(u + e, v) - terrainH(u - e, v)) / (2 * e),
    (terrainH(u, v + e) - terrainH(u, v - e)) / (2 * e),
  ];
}

/** Precomputed descent paths: plain SGD (jittery) vs momentum/Adam-like. */
function descentPaths() {
  const sgd: [number, number][] = [];
  const adam: [number, number][] = [];
  let su = 2.3, sv = 1.6;
  let au = 2.3, av = 1.6;
  let mu = 0, mv = 0;
  for (let i = 0; i < 260; i++) {
    // SGD: bigger steps + deterministic noise = zigzag
    const [g1, g2] = terrainGrad(su, sv);
    const n1 = Math.sin(i * 12.9) * 0.5, n2 = Math.cos(i * 7.7) * 0.5;
    su -= 0.055 * (g1 * 3.2 + n1 * 0.35);
    sv -= 0.055 * (g2 * 3.2 + n2 * 0.35);
    sgd.push([su, sv]);
    // momentum: beta 0.9 accumulation, smoother and faster through the wobble
    const [h1, h2] = terrainGrad(au, av);
    mu = 0.9 * mu + 0.1 * h1;
    mv = 0.9 * mv + 0.1 * h2;
    au -= 0.14 * mu * 3.2;
    av -= 0.14 * mv * 3.2;
    adam.push([au, av]);
  }
  return { sgd, adam };
}

function LossTerrain() {
  const ctx = useScene();
  const paths = useMemo(descentPaths, []);
  const sgdBall = useRef<THREE.Mesh>(null);
  const adamBall = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(4.6, 3.4, 60, 44);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / 1.6;
      const v = p.getY(i) / 1.6;
      p.setZ(i, terrainH(u, v));
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state) => {
    const active =
      ctx.program === "descent" || ctx.program === "adam" || ctx.program === "training" ||
      ctx.selectedId === "descent" || ctx.selectedId === "adam";
    const t = active ? (state.clock.elapsedTime * 26) % paths.sgd.length : 0;
    const i = Math.floor(t);
    const place = (ball: THREE.Mesh | null, path: [number, number][]) => {
      if (!ball) return;
      const [u, v] = path[Math.min(i, path.length - 1)];
      ball.position.set(u * 1.6 * (4.6 / 3.2) * 0.695, terrainH(u, v) + 0.09, -v * 1.6 * (3.4 / 3.2) * 0.63);
    };
    place(sgdBall.current, paths.sgd);
    place(adamBall.current, paths.adam);
  });

  return (
    <group position={[-2.6, 0.3, -6]}>
      <Station id="descent" labelPos={[0, 1.9, 0]} halo={[5.0, 2.0, 3.8]} plinth={{ w: 4.9, d: 3.7 }}>
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}>
          <meshStandardMaterial color="#2e3138" roughness={0.55} metalness={0.5} emissive="#b39a6b" emissiveIntensity={0.05} wireframe={false} />
        </mesh>
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.265, 0]}>
          <meshStandardMaterial color="#b39a6b" roughness={0.6} emissive="#b39a6b" emissiveIntensity={0.12} wireframe transparent opacity={0.16} />
        </mesh>
        <mesh ref={sgdBall}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#c8cfd9" emissive="#c8cfd9" emissiveIntensity={0.4} />
        </mesh>
        <mesh ref={adamBall}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#e8b36a" emissive="#e8b36a" emissiveIntensity={0.6} />
        </mesh>
        <Text position={[0, 1.55, 1.6]} fontSize={0.1} color="#c8cfd9" anchorX="center">
          theta gets nudged against the slope
        </Text>
      </Station>
    </group>
  );
}

/** Adam pedestal: the update rule as a lit formula stack. */
function AdamPedestal() {
  return (
    <group position={[1.4, 0, -6]}>
      <Station id="adam" labelPos={[0, 2.0, 0]} halo={[1.9, 2.0, 1.1]} plinth={{ w: 1.7, d: 1.0 }}>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.6, 1.25, 0.08]} />
          <meshStandardMaterial color="#1c1e23" roughness={0.35} metalness={0.6} emissive="#b39a6b" emissiveIntensity={0.06} />
        </mesh>
        <Text position={[0, 1.34, 0.07]} fontSize={0.085} color="#e0d4b8" anchorX="center">
          m = 0.9m + 0.1g
        </Text>
        <Text position={[0, 1.16, 0.07]} fontSize={0.085} color="#e0d4b8" anchorX="center">
          v = 0.999v + 0.001g²
        </Text>
        <Text position={[0, 0.97, 0.07]} fontSize={0.075} color="#9aa0ab" anchorX="center">
          bias-correct both, then
        </Text>
        <Text position={[0, 0.78, 0.07]} fontSize={0.085} color="#e0d4b8" anchorX="center">
          step 0.001 · m / sqrt(v)
        </Text>
        <Text position={[0, 0.55, 0.07]} fontSize={0.07} color="#9aa0ab" anchorX="center">
          defaults from the 2015 paper
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Training monitor: the accuracy curve draws itself, wobbling
 * ---------------------------------------------------------------- */

function TrainingMonitor() {
  const ctx = useScene();
  const N = 90;
  const dots = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  // honest curve: fast rise, wobble, slow saturation just above 96
  const curve = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      const rise = 1 - Math.exp(-x * 5.2);
      const wobble = 0.035 * Math.sin(i * 1.7) * Math.exp(-x * 1.4) + 0.008 * Math.sin(i * 3.1);
      pts.push(Math.min(0.968, 0.1 + rise * 0.88 + wobble));
    }
    return pts;
  }, []);
  useFrame((state) => {
    const m = dots.current;
    if (!m) return;
    const active = ctx.program === "training" || ctx.selectedId === "training";
    const reveal = active ? Math.floor(((state.clock.elapsedTime * 14) % (N + 30))) : N;
    for (let i = 0; i < N; i++) {
      const shown = i <= reveal;
      tmp.position.set(-0.85 + (i / (N - 1)) * 1.7, 0.62 + curve[i] * 1.05, 0.05);
      tmp.scale.setScalar(shown ? 1 : 0.001);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={[4.8, 0, -6.2]}>
      <Station id="training" labelPos={[0, 2.4, 0]} halo={[2.4, 2.4, 1.0]} plinth={{ w: 2.2, d: 0.9 }}>
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[2.0, 1.5, 0.08]} />
          <meshStandardMaterial color="#16181c" roughness={0.3} metalness={0.6} emissive="#b39a6b" emissiveIntensity={0.05} />
        </mesh>
        <instancedMesh ref={dots} args={[undefined, undefined, N]} frustumCulled={false}>
          <boxGeometry args={[0.022, 0.022, 0.02]} />
          <meshStandardMaterial color="#8fd3a8" emissive="#79a68d" emissiveIntensity={0.8} />
        </instancedMesh>
        <Text position={[0, 1.86, 0.06]} fontSize={0.09} color="#c8cfd9" anchorX="center">
          test accuracy: 10,000 held-out digits
        </Text>
        <Text position={[0, 0.52, 0.06]} fontSize={0.075} color="#9aa0ab" anchorX="center">
          simple net: over 96% (Nielsen, ch. 1)
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Init pedestal: a dead start and a healthy start, side by side
 * ---------------------------------------------------------------- */

function InitPedestal() {
  const ctx = useScene();
  const dead = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const healthy = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const active = ctx.program === "init" || ctx.selectedId === "init";
    const t = state.clock.elapsedTime;
    for (let i = 0; i < 6; i++) {
      const d = dead.current[i];
      const h = healthy.current[i];
      // dead: each successive layer loses the signal (vanishing by depth)
      if (d) d.emissiveIntensity = THREE.MathUtils.lerp(
        d.emissiveIntensity,
        active ? Math.max(0.02, 0.7 * Math.pow(0.42, i) * (0.6 + 0.4 * Math.sin(t * 2))) : 0.08,
        0.1,
      );
      // healthy: variance held steady across depth
      if (h) h.emissiveIntensity = THREE.MathUtils.lerp(
        h.emissiveIntensity,
        active ? 0.55 + 0.15 * Math.sin(t * 2 + i * 0.5) : 0.14,
        0.1,
      );
    }
  });
  return (
    <group position={[-6.8, 0, -6]}>
      <Station id="init" labelPos={[0, 2.3, 0]} halo={[2.6, 2.3, 1.2]} plinth={{ w: 2.4, d: 1.1 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i}>
            <mesh position={[-0.6, 0.55 + i * 0.28, 0]}>
              <boxGeometry args={[0.4, 0.14, 0.4]} />
              <meshStandardMaterial
                ref={(el) => { dead.current[i] = el; }}
                color="#3a4149" emissive="#8fa8c4" emissiveIntensity={0.08} roughness={0.4} metalness={0.5}
              />
            </mesh>
            <mesh position={[0.6, 0.55 + i * 0.28, 0]}>
              <boxGeometry args={[0.4, 0.14, 0.4]} />
              <meshStandardMaterial
                ref={(el) => { healthy.current[i] = el; }}
                color="#3a4149" emissive="#8fd3a8" emissiveIntensity={0.14} roughness={0.4} metalness={0.5}
              />
            </mesh>
          </group>
        ))}
        <Text position={[-0.6, 0.28, 0.4]} fontSize={0.075} color="#9aa0ab" anchorX="center">
          bad start: signal dies
        </Text>
        <Text position={[0.6, 0.28, 0.4]} fontSize={0.075} color="#9aa0ab" anchorX="center">
          sqrt(2/n): it survives
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Dropout panel (station), feature boards, brain panel: front row
 * ---------------------------------------------------------------- */

function DropoutPanel() {
  const ctx = useScene();
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const active = ctx.program === "dropout" || ctx.selectedId === "dropout";
    const round = Math.floor(state.clock.elapsedTime * 1.1);
    for (let i = 0; i < 9; i++) {
      const m = mats.current[i];
      if (!m) continue;
      const alive = !active || hash01(i * 3.7 + round * 91) > 0.5;
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, alive ? 0.5 : 0.03, 0.15);
      m.opacity = THREE.MathUtils.lerp(m.opacity, alive ? 1 : 0.2, 0.15);
    }
  });
  return (
    <group position={[-2.6, 0, -10]}>
      <Station id="dropout" labelPos={[0, 2.1, 0]} halo={[2.1, 2.1, 1.0]} plinth={{ w: 1.9, d: 0.9 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-0.5 + (i % 3) * 0.5, 0.75 + Math.floor(i / 3) * 0.5, 0]}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshStandardMaterial
              ref={(el) => { mats.current[i] = el; }}
              color="#b9c4d4" emissive="#8fa8c4" emissiveIntensity={0.3} roughness={0.35} metalness={0.4} transparent opacity={1}
            />
          </mesh>
        ))}
        <Text position={[0, 0.36, 0]} fontSize={0.09} color="#c8cfd9" anchorX="center">
          keep each with p = 0.5
        </Text>
      </Station>
    </group>
  );
}

function FeatureBoards() {
  const ctx = useScene();
  const glow = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const active = ctx.program === "features" || ctx.selectedId === "features";
    const step = Math.floor(state.clock.elapsedTime * 0.7) % 3;
    for (let i = 0; i < 3; i++) {
      const m = glow.current[i];
      if (!m) continue;
      const on = active && step === i;
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, on ? 0.35 : 0.06, 0.08);
    }
  });
  const labels = ["edges + corners", "textures", "parts (dog faces)"];
  return (
    <group position={[2.1, 0, -10]}>
      <Station id="features" labelPos={[0, 2.2, 0]} halo={[3.4, 2.2, 1.0]} plinth={{ w: 3.2, d: 0.9 }}>
        {Array.from({ length: 3 }, (_, b) => (
          <group key={b} position={[-1.05 + b * 1.05, 1.05, 0]}>
            <mesh>
              <boxGeometry args={[0.9, 0.9, 0.07]} />
              <meshStandardMaterial
                ref={(el) => { glow.current[b] = el; }}
                color="#1c1e23" roughness={0.35} metalness={0.55} emissive="#79a68d" emissiveIntensity={0.06}
              />
            </mesh>
            {/* board contents: stripes, checker, blob */}
            {b === 0 &&
              Array.from({ length: 4 }, (_, i) => (
                <mesh key={i} position={[-0.24 + i * 0.16, 0, 0.05]} rotation={[0, 0, 0.5]}>
                  <boxGeometry args={[0.05, 0.62, 0.015]} />
                  <meshStandardMaterial color="#8fd3a8" emissive="#79a68d" emissiveIntensity={0.4} />
                </mesh>
              ))}
            {b === 1 &&
              Array.from({ length: 9 }, (_, i) => (
                <mesh key={i} position={[-0.22 + (i % 3) * 0.22, -0.22 + Math.floor(i / 3) * 0.22, 0.05]}>
                  <boxGeometry args={[0.13, 0.13, 0.015]} />
                  <meshStandardMaterial
                    color={i % 2 ? "#8fd3a8" : "#3a4149"}
                    emissive={i % 2 ? "#79a68d" : "#3a4149"}
                    emissiveIntensity={i % 2 ? 0.35 : 0.05}
                  />
                </mesh>
              ))}
            {b === 2 && (
              <group position={[0, 0, 0.05]}>
                <mesh position={[0, 0.1, 0]}>
                  <sphereGeometry args={[0.16, 14, 14]} />
                  <meshStandardMaterial color="#8fd3a8" emissive="#79a68d" emissiveIntensity={0.35} />
                </mesh>
                <mesh position={[-0.09, 0.14, 0.1]}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                  <meshStandardMaterial color="#16181c" />
                </mesh>
                <mesh position={[0.09, 0.14, 0.1]}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                  <meshStandardMaterial color="#16181c" />
                </mesh>
                <mesh position={[0, -0.14, 0.02]} rotation={[0.5, 0, 0]}>
                  <coneGeometry args={[0.09, 0.22, 10]} />
                  <meshStandardMaterial color="#8fd3a8" emissive="#79a68d" emissiveIntensity={0.3} />
                </mesh>
              </group>
            )}
            <Text position={[0, -0.62, 0.06]} fontSize={0.07} color="#9aa0ab" anchorX="center">
              {labels[b]}
            </Text>
          </group>
        ))}
        <Text position={[0, 0.28, 0.4]} fontSize={0.07} color="#9aa0ab" anchorX="center">
          verified in CNNs (Zeiler-Fergus 2013), not tiny MLPs
        </Text>
      </Station>
    </group>
  );
}

function BrainPanel() {
  const ctx = useScene();
  const wire = useRef<THREE.MeshStandardMaterial>(null);
  const arrow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const active = ctx.program === "brain" || ctx.selectedId === "brain";
    if (wire.current)
      wire.current.emissiveIntensity = THREE.MathUtils.lerp(
        wire.current.emissiveIntensity, active ? 0.4 : 0.1, 0.08,
      );
    if (arrow.current) {
      const blink = active ? (Math.sin(state.clock.elapsedTime * 3) > 0 ? 0.7 : 0.12) : 0.12;
      arrow.current.emissiveIntensity = THREE.MathUtils.lerp(arrow.current.emissiveIntensity, blink, 0.2);
    }
  });
  return (
    <group position={[6.9, 0, -10]}>
      <Station id="brain" labelPos={[0, 2.3, 0]} halo={[2.3, 2.3, 1.2]} plinth={{ w: 2.1, d: 1.0 }}>
        <mesh position={[-0.45, 1.05, 0]}>
          <icosahedronGeometry args={[0.42, 1]} />
          <meshStandardMaterial ref={wire} color="#79a68d" emissive="#79a68d" emissiveIntensity={0.1} wireframe />
        </mesh>
        {/* the questioned backward arrow between cortex and network */}
        <mesh position={[0.35, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.07, 0.2, 10]} />
          <meshStandardMaterial ref={arrow} color="#e8b36a" emissive="#e8b36a" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0.62, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
          <meshStandardMaterial color="#e8b36a" emissive="#e8b36a" emissiveIntensity={0.12} />
        </mesh>
        <Text position={[0, 0.42, 0]} fontSize={0.08} color="#c8cfd9" anchorX="center">
          exact backprop in cortex? open question
        </Text>
        <Text position={[0, 0.26, 0]} fontSize={0.065} color="#9aa0ab" anchorX="center">
          Crick 1989 · Lillicrap + Hinton 2020
        </Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Forward/backward status caption over the lattice
 * ---------------------------------------------------------------- */

function FlowCaption() {
  const ctx = useScene();
  if (ctx.program !== "forward" && ctx.program !== "backprop") return null;
  const backward = ctx.program === "backprop";
  return (
    <Text position={[-1.5, 6.1, 0]} fontSize={0.18} color={backward ? "#e8b36a" : "#cfe4ff"} anchorX="center">
      {backward ? "error flows backward: every weight gets its blame" : "784 numbers become 16, 16, then 10"}
    </Text>
  );
}

/* ---------------------------------------------------------------- *
 *  Ambient dust
 * ---------------------------------------------------------------- */

function Dust() {
  const N = 120;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: (hash01(i * 3.1) - 0.5) * 30,
        y: hash01(i * 7.7) * 7 + 0.3,
        z: (hash01(i * 5.3) - 0.5) * 20,
        s: 0.008 + hash01(i * 9.1) * 0.014,
        v: 0.05 + hash01(i * 11.7) * 0.1,
      })),
    [],
  );
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      tmp.position.set(s.x + Math.sin(t * s.v + i) * 0.4, s.y + Math.sin(t * s.v * 0.7 + i * 2) * 0.3, s.z);
      tmp.scale.setScalar(s.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#5a6372" transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Assembly
 * ---------------------------------------------------------------- */

function Machine() {
  const wave = useWave();
  return (
    <WaveCtx.Provider value={wave}>
      <group>
        <PixelWall />
        <Fibers />
        <Lattice />
        <SpotlightNeuron />
        <ParamCounter />
        <ReluGate x={-1.5} />
        <ReluGate x={2.5} />
        <ReluStation />
        <SoftmaxBoard />
        <LossPylon />
        <FlowCaption />
        {/* training row */}
        <InitPedestal />
        <LossTerrain />
        <AdamPedestal />
        <TrainingMonitor />
        {/* front row */}
        <DropoutPanel />
        <FeatureBoards />
        <BrainPanel />
        <Dust />
      </group>
    </WaveCtx.Provider>
  );
}

export default function NnScene(props: NnSceneState) {
  const [interacted, setInteracted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const attract = !interacted && !props.selectedId && props.highlightIds.length === 0 && !props.focusStepId;
  const ctx: Ctx = { ...props, highlight: new Set(props.highlightIds), attract };

  // Mount nudge: some browsers miss r3f's first ResizeObserver measurement.
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
      dpr={[1, 2]}
      camera={{ position: [...DEFAULT_POSE.pos], fov: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: props.glPower ?? "high-performance", failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        gl.setClearColor("#09090b");
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
      onPointerMissed={() => props.onSelect(null)}
      onPointerDown={() => setInteracted(true)}
      style={{ touchAction: "none" }}
    >
      <fog attach="fog" args={["#0a0a0b", 20, 52]} />
      <SceneCtx.Provider value={ctx}>
        <Machine />
        <CameraRig controls={controlsRef} />
      </SceneCtx.Provider>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[70, 46]} />
        <MeshReflectorMaterial
          blur={[280, 70]}
          resolution={640}
          mixBlur={1}
          mixStrength={7}
          roughness={0.92}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#060607"
          metalness={0.4}
          mirror={0.35}
        />
      </mesh>

      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 9, 5]} intensity={1.25} />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} />
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} color="#cdd3dd" />
        <Lightformer intensity={1.1} position={[-8, 3, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} color="#9fb4d0" />
        <Lightformer intensity={0.9} position={[8, 2.5, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[7, 3, 1]} color="#d9c9a8" />
        <Lightformer intensity={0.5} position={[0, 2, -9]} scale={[10, 2, 1]} color="#7d8aa0" />
      </Environment>
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={32} blur={2.4} far={5} />
      <Grid
        position={[0, 0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.35}
        cellColor="#1c1f24"
        sectionSize={5}
        sectionThickness={0.7}
        sectionColor="#2a2e35"
        fadeDistance={36}
        infiniteGrid
      />

      <EffectComposer multisampling={0}>
        <Vignette eskil={false} offset={0.1} darkness={0.42} />
      </EffectComposer>

      <OrbitControls
        ref={controlsRef}
        target={[...DEFAULT_POSE.look]}
        enablePan
        enableDamping
        autoRotate={attract}
        autoRotateSpeed={0.5}
        onStart={() => setInteracted(true)}
        minDistance={3}
        maxDistance={30}
        maxPolarAngle={1.52}
      />
    </Canvas>
  );
}
