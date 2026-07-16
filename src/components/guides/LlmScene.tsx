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
  Trail,
} from "@react-three/drei";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ZONES,
  JOURNEY,
  stageById,
  DEMO_TOKENS,
  DEMO_TOKEN_IDS,
  DEMO_LOGITS,
  type FlowSegment,
} from "@/data/llm";

/**
 * LlmScene — the "How LLMs Work" machine, rendered like a film set.
 *
 * Rendered like a professional product shoot, matching HvacScene's material
 * language: neutral studio lighting (white key, cool + warm fills), gunmetal
 * and graphite materials, muted functional zone accents, a soft-reflective
 * floor, and a camera rig that flies to each journey step (the user can
 * always grab the camera; it re-engages on step change). No bloom — polish
 * comes from materials and light, not glow.
 */

export interface LlmSceneState {
  selectedId: string | null;
  highlightIds: string[];
  onSelect: (id: string | null) => void;
  running: boolean;
  labels: boolean;
  training: boolean;
  flow: FlowSegment;
  /** Journey step id — drives the cinematic camera. Null = free camera. */
  focusStepId?: string | null;
}

interface Ctx extends Omit<LlmSceneState, "highlightIds"> {
  highlight: Set<string>;
  /** True when nothing is focused/selected and the camera should idle-orbit. */
  attract: boolean;
}
const SceneCtx = createContext<Ctx | null>(null);
const useScene = () => useContext(SceneCtx)!;

const ACCENT: Record<string, string> = {
  input: "#5f8cb0", core: "#8b84ad", output: "#79a68d", training: "#b39a6b",
};
const zoneColor = (id: string) => ACCENT[stageById(id)?.zone ?? "core"];

/* ---------------------------------------------------------------- *
 *  Camera choreography — one pose per journey step
 * ---------------------------------------------------------------- */

const DEFAULT_POSE = { pos: [1.5, 5.4, 16.5] as const, look: [-0.5, 2.0, 0] as const };
const DEFAULT_POS_V = new THREE.Vector3(...DEFAULT_POSE.pos);
const CAM_POSES: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = {
  "j-prompt": { pos: [-9.2, 2.6, 5.4], look: [-9, 1.7, 0] },
  "j-tokenize": { pos: [-6.6, 2.7, 5.0], look: [-6.6, 1.15, 0] },
  "j-embed": { pos: [-4.0, 2.6, 4.8], look: [-4.2, 1.25, 0] },
  "j-position": { pos: [-3.6, 3.4, 3.6], look: [-4.2, 2.05, 0.5] },
  "j-stack": { pos: [-0.4, 3.8, 7.2], look: [-0.8, 2.0, 0] },
  "j-attention": { pos: [-2.0, 2.3, 5.8], look: [-2.0, 1.05, 2.4] },
  "j-experts": { pos: [0.6, 2.3, 5.8], look: [0.6, 1.05, 2.4] },
  "j-repeat": { pos: [2.4, 4.6, 5.6], look: [-0.8, 2.0, -0.8] },
  "j-logits": { pos: [4.4, 2.9, 5.2], look: [4.2, 1.5, 0] },
  "j-sample": { pos: [6.8, 2.7, 4.6], look: [6.6, 1.15, 0] },
  "j-loop": { pos: [-0.5, 7.5, 13.5], look: [-1.2, 3.4, 0] },
  "j-context": { pos: [0.5, 6.5, 17.5], look: [-0.5, 2.4, 0] },
  "j-beyond": { pos: [2.0, 2.6, 9.8], look: [2.0, 1.3, 5.6] },
  "j-hallucinate": { pos: [9.5, 2.7, 4.8], look: [9.4, 1.4, 0.4] },
  "j-tools": { pos: [9.9, 3.0, 1.4], look: [9.6, 1.3, -3.2] },
  "j-artifact": { pos: [-9.2, 3.2, -2.2], look: [-9.2, 1.2, -6.5] },
  "j-data": { pos: [-7.1, 3.2, -2.2], look: [-7.1, 1.4, -6.5] },
  "j-pretrain": { pos: [-5.0, 3.2, -2.2], look: [-5, 1.3, -6.5] },
  "j-align": { pos: [-1.0, 3.2, -2.2], look: [-1, 1.3, -6.5] },
  "j-reason": { pos: [3.0, 3.2, -2.2], look: [3, 1.3, -6.5] },
  "j-interpret": { pos: [5.7, 3.2, -2.2], look: [5.7, 1.4, -6.5] },
};

/** Explore-mode focus: clicking a stage flies the camera to frame it. Auto-derived
 *  from the journey — each step already has a tuned pose plus the stages it
 *  highlights — so it stays in sync with zero hand-maintained duplicate table. */
const STAGE_POSE: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = (() => {
  const m: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = {};
  for (const step of JOURNEY) {
    const pose = CAM_POSES[step.id];
    if (!pose) continue;
    for (const sid of step.highlightIds) if (!m[sid]) m[sid] = pose;
  }
  return m;
})();

function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const ctx = useScene();
  const { camera, size } = useThree();
  const overrideRef = useRef(false);
  const lastStep = useRef<string | null | undefined>(undefined);

  // Layout changes (panel toggle, fullscreen enter/exit, window resize) re-engage
  // the rig so the current pose re-frames for the new canvas instead of leaving
  // the camera stranded wherever the last grab put it.
  useEffect(() => {
    overrideRef.current = false;
  }, [size.width, size.height]);

  // A user grab pauses the rig until the next step change.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const onStart = () => { overrideRef.current = true; };
    c.addEventListener("start", onStart);
    return () => c.removeEventListener("start", onStart);
  }, [controls]);

  useFrame(() => {
    // Journey drives the cinematic camera; in Explore, a selected stage flies the
    // camera to frame that component, and deselecting ("view all") eases back to the
    // overview. A user grab pauses the rig until the focus target next changes.
    const focusKey = ctx.focusStepId ?? ctx.selectedId ?? null;
    if (focusKey !== lastStep.current) {
      lastStep.current = focusKey;
      overrideRef.current = false; // re-engage whenever the focus target changes
    }
    if (overrideRef.current) return;
    // Deselected ("view all"): fly home first; only once settled does the attract
    // auto-orbit take over — otherwise it would idle wherever the close-up left it.
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
 *  Design language — plinth with zone-colored light strip
 * ---------------------------------------------------------------- */

function Plinth({ w, d, color }: { w: number; d: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[w, 0.16, d]} />
        <meshStandardMaterial color="#26282e" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* front + back light strips — the unifying visual signature */}
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
 *  Stage wrapper — selection, halo, label
 * ---------------------------------------------------------------- */

function Stage({
  id,
  children,
  labelPos = [0, 1.35, 0],
  halo = [2.2, 2.2, 1.4],
  plinth,
  dimInInference = false,
  noHalo = false,
}: {
  id: string;
  children: React.ReactNode;
  labelPos?: [number, number, number];
  halo?: [number, number, number];
  plinth?: { w: number; d: number };
  dimInInference?: boolean;
  noHalo?: boolean;
}) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  const selected = ctx.selectedId === id;
  const lit = selected || ctx.highlight.has(id);
  const stage = stageById(id);
  const color = zoneColor(id);
  const dimmed = dimInInference && !ctx.training && !lit;

  useFrame(() => {
    if (haloMat.current) {
      const target = selected ? 0.42 : lit ? 0.3 : hover ? 0.14 : 0;
      haloMat.current.opacity = THREE.MathUtils.lerp(haloMat.current.opacity, target, 0.12);
    }
    if (group.current) {
      const s = lit ? 1.03 : 1;
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
      <group visible={!dimmed}>
        {plinth && <Plinth w={plinth.w} d={plinth.d} color={color} />}
        {children}
      </group>
      {dimmed && (
        <mesh visible={false} position={[0, halo[1] / 2, 0]}>
          <boxGeometry args={halo} />
          <meshBasicMaterial />
        </mesh>
      )}
      <mesh position={[0, halo[1] / 2 - 0.1, 0]} visible={!noHalo}>
        <boxGeometry args={halo} />
        <meshBasicMaterial ref={haloMat} color={color} transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {(ctx.labels || selected || lit) && stage && !dimmed && (
        <Html position={labelPos} center distanceFactor={14} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
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
              opacity: dimmed ? 0.35 : 1,
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
 *  Flow particles — tokens moving through the machine
 * ---------------------------------------------------------------- */

const PATHS: Record<Exclude<FlowSegment, null>, THREE.Vector3[]> = {
  input: [new THREE.Vector3(-9, 1.7, 0), new THREE.Vector3(-6.6, 1.35, 0), new THREE.Vector3(-4.2, 1.5, 0)],
  core: [new THREE.Vector3(-4.2, 1.5, 0), new THREE.Vector3(-0.8, 0.8, 0), new THREE.Vector3(-0.8, 3.5, 0)],
  output: [new THREE.Vector3(-0.8, 3.5, 0), new THREE.Vector3(4.2, 2.1, 0), new THREE.Vector3(6.6, 1.5, 0)],
  loop: [new THREE.Vector3(6.6, 1.5, 0), new THREE.Vector3(-1, 6.4, 0.6), new THREE.Vector3(-9, 2.1, 0)],
  train: [new THREE.Vector3(-5, 1.1, -6.5), new THREE.Vector3(-1, 1.1, -6.5), new THREE.Vector3(3, 1.1, -6.5)],
};

function sampleQuadratic(pts: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const [a, b, c] = pts;
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
}

function sampleTangent(pts: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const [a, b, c] = pts;
  // derivative of the quadratic bezier
  out.set(
    2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x),
    2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y),
    2 * (1 - t) * (b.z - a.z) + 2 * t * (c.z - b.z),
  ).normalize();
}

/** The physical rail the data pulses travel on — thin graphite conduit. */
function FlowConduit({ segment }: { segment: Exclude<FlowSegment, null> }) {
  const ctx = useScene();
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const geo = useMemo(() => {
    const [a, b, c] = PATHS[segment];
    const curve = new THREE.QuadraticBezierCurve3(a, b, c);
    return new THREE.TubeGeometry(curve, 40, segment === "loop" ? 0.008 : 0.013, 6, false);
  }, [segment]);
  useFrame(() => {
    if (!mat.current) return;
    const active = ctx.flow === segment;
    mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, active ? 0.35 : 0.08, 0.08);
  });
  const accent = segment === "train" ? "#b39a6b" : segment === "loop" ? "#79a68d" : "#5f8cb0";
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        ref={mat}
        color="#2b2e34"
        roughness={0.4}
        metalness={0.6}
        emissive={accent}
        emissiveIntensity={0.08}
        transparent={segment === "loop"}
        opacity={segment === "loop" ? 0.55 : 1}
      />
    </mesh>
  );
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const GOLDEN = 0.6180339887;

/** Data pulses — small elongated streaks riding the conduit, fading at the
 *  endpoints, irregularly spaced. Fiber-optic, not bouncing balls. */
function FlowParticles({ segment }: { segment: Exclude<FlowSegment, null> }) {
  const ctx = useScene();
  const N = 7;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const pts = PATHS[segment];
  const color = segment === "train" ? "#c9a86a" : "#cbd5e1";

  useFrame((state) => {
    if (!mesh.current || !mat.current) return;
    const active = ctx.flow === segment;
    const visible = ctx.running || active;
    const speed = active ? 0.3 : 0.13;
    const targetOpacity = !visible ? 0 : active ? 0.95 : segment === "loop" || segment === "train" ? 0.04 : 0.3;
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, targetOpacity, 0.08);
    const t0 = state.clock.elapsedTime * speed;
    for (let i = 0; i < N; i++) {
      // golden-ratio phase + slight per-pulse speed variance: no metronome
      const t = (t0 * (1 + ((i * 7) % 5) * 0.016) + ((i * GOLDEN) % 1)) % 1;
      sampleQuadratic(pts, t, v);
      sampleTangent(pts, t, tan);
      // fade in/out at the endpoints via scale envelope
      const fade =
        THREE.MathUtils.smoothstep(t, 0, 0.14) * (1 - THREE.MathUtils.smoothstep(t, 0.86, 1));
      tmp.position.copy(v);
      q.setFromUnitVectors(Y_AXIS, tan);
      tmp.quaternion.copy(q);
      const len = (active ? 0.24 : 0.15) * (0.35 + 0.65 * fade);
      const thick = (active ? 0.026 : 0.018) * (0.5 + 0.5 * fade);
      tmp.scale.set(thick, len, thick);
      tmp.updateMatrix();
      mesh.current.setMatrixAt(i, tmp.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <capsuleGeometry args={[1, 2.2, 3, 8]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Ambient dust — depth cue
 * ---------------------------------------------------------------- */

function Dust() {
  const N = 140;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: -14 + ((i * 37) % 260) / 10,
        y: 0.3 + ((i * 53) % 70) / 10,
        z: -8 + ((i * 71) % 140) / 10,
        s: 0.008 + ((i * 13) % 10) / 450,
        ph: (i * 97) % 63,
      })),
    [],
  );
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    seeds.forEach((p, i) => {
      tmp.position.set(p.x + Math.sin(t * 0.05 + p.ph) * 0.4, p.y + Math.sin(t * 0.11 + p.ph * 2) * 0.25, p.z);
      tmp.scale.setScalar(p.s);
      tmp.updateMatrix();
      mesh.current!.setMatrixAt(i, tmp.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#475569" transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Individual stage models
 * ---------------------------------------------------------------- */

const PANEL = "#33363d";

function PromptPanel() {
  return (
    <Stage id="prompt" labelPos={[0, 3.0, 0]} halo={[2.6, 2.6, 0.6]} plinth={{ w: 2.5, d: 0.9 }}>
      <group position={[0, 1.7, 0]}>
        <mesh>
          <boxGeometry args={[2.3, 1.5, 0.1]} />
          <meshStandardMaterial color={PANEL} roughness={0.25} metalness={0.6} emissive="#5f8cb0" emissiveIntensity={0.05} />
        </mesh>
        {/* screen glow frame */}
        <mesh position={[0, 0, 0.055]}>
          <planeGeometry args={[2.14, 1.34]} />
          <meshBasicMaterial color="#15181d" />
        </mesh>
        <Text position={[0, 0.28, 0.07]} fontSize={0.23} color="#e7e5e4" anchorX="center">
          The cat sat
        </Text>
        <Text position={[0, -0.05, 0.07]} fontSize={0.23} color="#e7e5e4" anchorX="center">
          on the█
        </Text>
        <Text position={[0, -0.5, 0.07]} fontSize={0.1} color="#8fa8bd" anchorX="center">
          your prompt
        </Text>
      </group>
    </Stage>
  );
}

function Tokenizer() {
  const ctx = useScene();
  const blade = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (blade.current) blade.current.position.y = 1.55 + (ctx.running ? Math.sin(state.clock.elapsedTime * 5) * 0.12 : 0);
  });
  return (
    <Stage id="tokenizer" labelPos={[0, 2.9, 0]} halo={[2.5, 2.6, 1.2]} plinth={{ w: 2.4, d: 1.1 }}>
      <mesh ref={blade} position={[0, 1.55, 0]}>
        <boxGeometry args={[1.9, 0.07, 0.5]} />
        <meshStandardMaterial color="#5f8cb0" roughness={0.25} metalness={0.7} emissive="#5f8cb0" emissiveIntensity={0.55} />
      </mesh>
      {DEMO_TOKENS.map((tok, i) => (
        <group key={i} position={[-0.84 + i * 0.42, 0.95, 0]}>
          <mesh>
            <boxGeometry args={[0.36, 0.26, 0.1]} />
            <meshStandardMaterial color={PANEL} roughness={0.35} metalness={0.5} emissive="#5f8cb0" emissiveIntensity={0.18} />
          </mesh>
          <Text position={[0, 0.03, 0.07]} fontSize={0.085} color="#d1d5db" anchorX="center">
            {tok}
          </Text>
          <Text position={[0, -0.08, 0.07]} fontSize={0.055} color="#8f949d" anchorX="center">
            {String(DEMO_TOKEN_IDS[i])}
          </Text>
        </group>
      ))}
    </Stage>
  );
}

function EmbeddingWall() {
  const ctx = useScene();
  const cols = 12, rows = 7;
  const inst = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    if (!inst.current) return;
    const t = state.clock.elapsedTime;
    let k = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const wobble = ctx.running ? Math.sin(t * 1.6 + c * 0.7 + r * 1.1) * 0.04 : 0;
        tmp.position.set(-0.72 + c * 0.13, 0.55 + r * 0.13 + wobble, 0);
        tmp.scale.setScalar(0.05);
        tmp.updateMatrix();
        inst.current.setMatrixAt(k++, tmp.matrix);
      }
    }
    inst.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <Stage id="embeddings" labelPos={[0, 2.7, 0]} halo={[2.2, 2.4, 1.2]} plinth={{ w: 2.1, d: 1.3 }}>
      <instancedMesh ref={inst} args={[undefined, undefined, cols * rows]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9db8cc" emissive="#5f8cb0" emissiveIntensity={0.4} roughness={0.3} metalness={0.4} />
      </instancedMesh>
      {DEMO_TOKENS.map((_, i) => (
        <mesh key={i} position={[-0.56 + i * 0.28, 1.05, 0.45]}>
          <boxGeometry args={[0.09, 0.9 + (i % 3) * 0.12, 0.09]} />
          <meshStandardMaterial color="#c3d3e0" emissive="#5f8cb0" emissiveIntensity={0.55} roughness={0.25} metalness={0.4} />
        </mesh>
      ))}
    </Stage>
  );
}

function PositionalDial() {
  const ctx = useScene();
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ring.current && ctx.running) ring.current.rotation.z += delta * 0.8;
  });
  return (
    <Stage id="positional" labelPos={[0, 1.15, 0]} halo={[1.1, 1.3, 0.9]}>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.45, 0]}>
        <torusGeometry args={[0.34, 0.045, 12, 44]} />
        <meshStandardMaterial color="#5f8cb0" emissive="#5f8cb0" emissiveIntensity={0.5} roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#c3d3e0" emissive="#5f8cb0" emissiveIntensity={0.7} />
      </mesh>
    </Stage>
  );
}

function TransformerStack() {
  const layers = 6;
  return (
    <Stage id="layers" labelPos={[0, 4.4, 0]} halo={[2.6, 4.0, 2.0]} plinth={{ w: 2.5, d: 1.9 }}>
      {Array.from({ length: layers }).map((_, i) => (
        <group key={i} position={[0, 0.85 + i * 0.5, 0]}>
          <mesh>
            <boxGeometry args={[2.1, 0.32, 1.5]} />
            <meshStandardMaterial color={PANEL} roughness={0.22} metalness={0.72} emissive="#8b84ad" emissiveIntensity={0.06 + (i / layers) * 0.08} />
          </mesh>
          {/* per-layer light seam */}
          <mesh position={[0, -0.12, 0.76]}>
            <boxGeometry args={[1.96, 0.02, 0.015]} />
            <meshStandardMaterial color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.45} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <Text position={[1.25, 2.1, 0]} fontSize={0.16} color="#a9a1c4" anchorX="left" rotation={[0, 0, Math.PI / 2]}>
        × 96 layers
      </Text>
    </Stage>
  );
}

function AttentionPlate() {
  const ctx = useScene();
  const lines = useRef<(THREE.Line | null)[]>([]);
  const nodeX = (i: number) => -0.8 + i * 0.4;
  const pairs = useMemo(() => {
    const p: [number, number][] = [];
    for (let j = 1; j < 5; j++) for (let i = 0; i < j; i++) p.push([i, j]);
    return p;
  }, []);
  const lit = () => ctx.selectedId === "attention" || ctx.highlight.has("attention");
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const on = lit();
    lines.current.forEach((ln, k) => {
      if (!ln) return;
      const m = ln.material as THREE.LineBasicMaterial;
      const base = on ? 0.8 : ctx.running ? 0.28 : 0.12;
      m.opacity = base * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + k * 0.9)));
          });
  });
  return (
    <Stage id="attention" labelPos={[0, 1.75, 0]} halo={[2.3, 1.9, 0.8]} plinth={{ w: 2.25, d: 0.7 }}>
      <mesh position={[0, 0.75, -0.06]}>
        <boxGeometry args={[2.15, 1.5, 0.06]} />
        <meshStandardMaterial color="#2b2e34" roughness={0.3} metalness={0.6} emissive="#8b84ad" emissiveIntensity={0.05} />
      </mesh>
      {DEMO_TOKENS.map((tok, i) => (
        <group key={i} position={[nodeX(i), 0.32, 0]}>
          <mesh>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#d8d3e8" emissive="#8b84ad" emissiveIntensity={0.6} />
          </mesh>
          <Text position={[0, -0.16, 0]} fontSize={0.07} color="#a3a3a3" anchorX="center">
            {tok}
          </Text>
        </group>
      ))}
      {pairs.map(([i, j], k) => {
        const from = new THREE.Vector3(nodeX(i), 0.32, 0.02);
        const to = new THREE.Vector3(nodeX(j), 0.32, 0.02);
        const mid = from.clone().lerp(to, 0.5);
        mid.y += 0.22 + (j - i) * 0.12;
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(18));
        return (
          <primitive
            key={k}
            object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#8b84ad", transparent: true, opacity: 0.2 }))}
            ref={(el: THREE.Line) => { lines.current[k] = el; }}
          />
        );
      })}
    </Stage>
  );
}

function MoEPlate() {
  const ctx = useScene();
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const slot = Math.floor(state.clock.elapsedTime / 1.1);
    const a = slot % 8;
    const b = (slot * 3 + 1) % 8;
    const lit = ctx.selectedId === "moe" || ctx.highlight.has("moe");
    mats.current.forEach((m, i) => {
      if (!m) return;
      const active = (ctx.running || lit) && (i === a || i === b);
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, active ? 0.9 : 0.07, 0.15);
          });
  });
  return (
    <Stage id="moe" labelPos={[0, 1.75, 0]} halo={[2.1, 1.9, 0.9]} plinth={{ w: 2.0, d: 0.8 }}>
      <mesh position={[0, 0.75, -0.06]}>
        <boxGeometry args={[1.95, 1.5, 0.06]} />
        <meshStandardMaterial color="#2b2e34" roughness={0.3} metalness={0.6} emissive="#8b84ad" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0, 1.18, 0.05]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshStandardMaterial color="#d8d3e8" emissive="#8b84ad" emissiveIntensity={0.65} />
      </mesh>
      <Text position={[0.24, 1.18, 0.05]} fontSize={0.07} color="#a3a3a3" anchorX="left">
        router
      </Text>
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        return (
          <mesh key={i} position={[-0.66 + col * 0.44, 0.62 - row * 0.42, 0.05]}>
            <boxGeometry args={[0.34, 0.3, 0.14]} />
            <meshStandardMaterial
              ref={(el) => { mats.current[i] = el; }}
              color={PANEL}
              roughness={0.3}
              metalness={0.55}
              emissive="#8b84ad"
              emissiveIntensity={0.07}
            />
          </mesh>
        );
      })}
    </Stage>
  );
}

function KvCache() {
  const ctx = useScene();
  const slabs = 7;
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const filled = ctx.running ? Math.floor(state.clock.elapsedTime * 1.4) % (slabs + 1) : 3;
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, i < filled ? 0.5 : 0.04, 0.1);
    });
  });
  return (
    <Stage id="kv-cache" labelPos={[0, 1.9, 0]} halo={[1.5, 1.9, 1.2]} plinth={{ w: 1.4, d: 1.1 }}>
      {Array.from({ length: slabs }).map((_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.2, 0]}>
          <boxGeometry args={[1.15, 0.13, 0.85]} />
          <meshStandardMaterial
            ref={(el) => { mats.current[i] = el; }}
            color="#2b2d33"
            roughness={0.3}
            metalness={0.6}
            emissive="#8b84ad"
            emissiveIntensity={0.04}
          />
        </mesh>
      ))}
    </Stage>
  );
}

function ContextFrame() {
  // Edges only — a wireframe boxGeometry draws triangle diagonals across the
  // scene, which read as stray artifacts. EdgesGeometry gives a clean frame.
  // noHalo: a 13m halo box washes out the whole machine when this stage is
  // highlighted — instead the frame itself brightens.
  const ctx = useScene();
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(13, 5, 3)), []);
  useFrame(() => {
    if (!mat.current) return;
    const lit = ctx.selectedId === "context-window" || ctx.highlight.has("context-window");
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, lit ? 0.55 : 0.18, 0.1);
  });
  return (
    <Stage id="context-window" labelPos={[0, 5.3, 0]} halo={[13.4, 5.4, 3.4]} noHalo>
      <lineSegments geometry={edges} position={[0, 2.5, 0]}>
        <lineBasicMaterial ref={mat} color="#64748b" transparent opacity={0.18} />
      </lineSegments>
    </Stage>
  );
}

function LogitsBoard() {
  const ctx = useScene();
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const on = ctx.selectedId === "logits" || ctx.highlight.has("logits") || ctx.highlight.has("sampling") || ctx.running;
    bars.current.forEach((mesh, i) => {
      if (!mesh) return;
      const target = on ? (DEMO_LOGITS[i].p / 62) * 1.5 : 0.04;
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, target, 0.08);
      mesh.position.y = 0.55 + mesh.scale.y / 2;
    });
  });
  return (
    <Stage id="logits" labelPos={[0, 3.1, 0]} halo={[2.6, 3.0, 1.0]} plinth={{ w: 2.55, d: 1.3 }}>
      {DEMO_LOGITS.map((d, i) => (
        <group key={d.token} position={[-1.05 + i * 0.35, 0, 0]}>
          <mesh ref={(el) => { bars.current[i] = el; }} position={[0, 0.55, 0]} scale={[1, 0.04, 1]}>
            <boxGeometry args={[0.24, 1, 0.24]} />
            <meshStandardMaterial
              color={i === 0 ? "#79a68d" : "#2b2e34"}
              emissive="#79a68d"
              emissiveIntensity={i === 0 ? 0.6 : 0.1}
              roughness={0.3}
             
            />
          </mesh>
          <Text position={[0, 0.32, 0.3]} fontSize={0.08} color={i === 0 ? "#8fbfa3" : "#8f949d"} anchorX="center" rotation={[-0.5, 0, 0]}>
            {d.token}
          </Text>
        </group>
      ))}
    </Stage>
  );
}

function Sampler() {
  const ctx = useScene();
  const die = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (die.current && (ctx.running || ctx.highlight.has("sampling"))) {
      die.current.rotation.x += delta * 1.6;
      die.current.rotation.y += delta * 2.1;
    }
  });
  return (
    <Stage id="sampling" labelPos={[0, 2.5, 0]} halo={[1.7, 2.4, 1.2]} plinth={{ w: 1.6, d: 1.2 }}>
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 28]} />
        <meshStandardMaterial color="#2b2d33" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.09]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.05, 0.4, 0.04]} />
        <meshStandardMaterial color="#79a68d" emissive="#79a68d" emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
      <mesh ref={die} position={[0, 1.45, 0]}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#79a68d" emissive="#79a68d" emissiveIntensity={0.45} roughness={0.25} metalness={0.5} />
      </mesh>
      <Text position={[0, 0.5, 0.12]} fontSize={0.08} color="#8fbfa3" anchorX="center">
        T
      </Text>
    </Stage>
  );
}

function LoopArc() {
  const ctx = useScene();
  const chip = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!chip.current) return;
    const active = ctx.running || ctx.flow === "loop";
    chip.current.visible = active;
    if (active) {
      const t = (state.clock.elapsedTime * 0.22) % 1;
      sampleQuadratic(PATHS.loop, t, v);
      chip.current.position.copy(v);
    }
  });
  return (
    <Stage id="loop" labelPos={[-1, 7.1, 0.6]} halo={[0.1, 0.1, 0.1]}>
      <Trail width={0.3} length={2.5} color="#79a68d" attenuation={(t) => t * t}>
        <group ref={chip}>
          <mesh>
            <boxGeometry args={[0.5, 0.3, 0.1]} />
            <meshStandardMaterial color="#20242a" emissive="#79a68d" emissiveIntensity={0.55} roughness={0.25} metalness={0.5} />
          </mesh>
          <Text position={[0, 0, 0.08]} fontSize={0.14} color="#d6e5db" anchorX="center">
            mat
          </Text>
        </group>
      </Trail>
    </Stage>
  );
}

/** Hallucination — the output panel flickers between truth and mirage. */
function Hallucination() {
  const ctx = useScene();
  const matTrue = useRef<any>(null);
  const matFalse = useRef<any>(null);
  useFrame((state) => {
    const lit = ctx.selectedId === "hallucination" || ctx.highlight.has("hallucination");
    const t = state.clock.elapsedTime;
    // slow flicker: mostly 'mat', occasionally glitching to 'moon'
    const glitch = (ctx.running || lit) && Math.sin(t * 1.3) > 0.55;
    if (matTrue.current) matTrue.current.opacity = THREE.MathUtils.lerp(matTrue.current.opacity, glitch ? 0.08 : 1, 0.2);
    if (matFalse.current) matFalse.current.opacity = THREE.MathUtils.lerp(matFalse.current.opacity, glitch ? 1 : 0.06, 0.2);
  });
  return (
    <Stage id="hallucination" labelPos={[0, 2.9, 0]} halo={[2.3, 2.7, 1.0]} plinth={{ w: 2.2, d: 1.0 }}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.9, 1.3, 0.1]} />
        <meshStandardMaterial color={PANEL} roughness={0.25} metalness={0.6} emissive="#79a68d" emissiveIntensity={0.05} />
      </mesh>
      <Text position={[0, 1.82, 0.07]} fontSize={0.11} color="#a3a3a3" anchorX="center">
        The cat sat on the…
      </Text>
      <group position={[0, 1.38, 0.07]}>
        <Text fontSize={0.34} color="#8fbfa3" anchorX="center">
          mat
          <meshBasicMaterial ref={matTrue} transparent opacity={1} color="#8fbfa3" />
        </Text>
        <Text fontSize={0.34} color="#c49a9a" anchorX="center">
          moon
          <meshBasicMaterial ref={matFalse} transparent opacity={0.06} color="#c49a9a" />
        </Text>
      </group>
      {/* grounding anchor: RAG block feeding the panel */}
      <mesh position={[-1.35, 0.55, 0]}>
        <boxGeometry args={[0.55, 0.5, 0.4]} />
        <meshStandardMaterial color="#252a2c" roughness={0.35} metalness={0.5} emissive="#79a68d" emissiveIntensity={0.35} />
      </mesh>
      <Text position={[-1.35, 0.55, 0.22]} fontSize={0.1} color="#8fbfa3" anchorX="center">
        RAG
      </Text>
      <mesh position={[-0.85, 0.9, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 0.75, 6]} />
        <meshStandardMaterial color="#79a68d" emissive="#79a68d" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </Stage>
  );
}

/** Tools & agents — the LLM OS: orchestrator core with orbiting tools. */
function ToolsAgents() {
  const ctx = useScene();
  const orbit = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (orbit.current && (ctx.running || ctx.training || true)) orbit.current.rotation.y += delta * 0.45;
  });
  const TOOLS = [
    { label: "search", color: "#5f8cb0" },
    { label: "python", color: "#b39a6b" },
    { label: "browser", color: "#a98bb8" },
  ];
  return (
    <Stage id="tools-agents" labelPos={[0, 2.9, 0]} halo={[2.6, 2.8, 2.6]} plinth={{ w: 2.4, d: 2.4 }}>
      {/* the CPU core */}
      <mesh position={[0, 1.35, 0]}>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color="#79a68d" emissive="#79a68d" emissiveIntensity={0.5} roughness={0.25} metalness={0.55} />
      </mesh>
      <Text position={[0, 0.78, 0.4]} fontSize={0.09} color="#8fbfa3" anchorX="center">
        LLM = CPU
      </Text>
      {/* orbiting peripherals */}
      <group ref={orbit} position={[0, 1.35, 0]}>
        {TOOLS.map((t, i) => {
          const a = (i / TOOLS.length) * Math.PI * 2;
          return (
            <group key={t.label} position={[Math.cos(a) * 1.0, Math.sin(i * 2.1) * 0.18, Math.sin(a) * 1.0]}>
              <mesh>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#2b2e34" roughness={0.3} metalness={0.6} emissive={t.color} emissiveIntensity={0.4} />
              </mesh>
              <Text position={[0, -0.28, 0]} fontSize={0.08} color={t.color} anchorX="center">
                {t.label}
              </Text>
            </group>
          );
        })}
        {/* orbit ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.0, 0.008, 8, 64]} />
          <meshBasicMaterial color="#79a68d" transparent opacity={0.22} />
        </mesh>
      </group>
    </Stage>
  );
}

/* --- training row ------------------------------------------------ */

/** The model artifact — two files: weights + code. */
function ModelArtifact() {
  const ctx = useScene();
  const cube = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (cube.current && (ctx.training || ctx.running)) cube.current.rotation.y += delta * 0.2;
  });
  return (
    <Stage id="model-artifact" labelPos={[0, 2.5, 0]} halo={[2.0, 2.5, 1.8]} plinth={{ w: 1.8, d: 1.6 }} dimInInference>
      <mesh ref={cube} position={[-0.3, 1.05, 0]}>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color="#35312a" roughness={0.3} metalness={0.6} emissive="#b39a6b" emissiveIntensity={0.35} />
      </mesh>
      <Text position={[-0.3, 1.05, 0.45]} fontSize={0.1} color="#c9b280" anchorX="center">
        140 GB
      </Text>
      <Text position={[-0.3, 0.86, 0.45]} fontSize={0.06} color="#9aa0ab" anchorX="center">
        parameters
      </Text>
      <mesh position={[0.62, 0.78, 0.1]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.5, 0.68, 0.04]} />
        <meshStandardMaterial color="#2b2d33" roughness={0.35} metalness={0.4} emissive="#b39a6b" emissiveIntensity={0.18} />
      </mesh>
      <Text position={[0.62, 0.86, 0.14]} rotation={[0, -0.35, 0]} fontSize={0.07} color="#c9b280" anchorX="center">
        ~500
      </Text>
      <Text position={[0.62, 0.72, 0.14]} rotation={[0, -0.35, 0]} fontSize={0.05} color="#9aa0ab" anchorX="center">
        lines of C
      </Text>
    </Stage>
  );
}

/** The corpus funnel — the internet filtered 1000× down. */
function DataFunnel() {
  const ctx = useScene();
  const drops = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const N = 12;
  useFrame((state) => {
    if (!drops.current) return;
    const t = state.clock.elapsedTime;
    const on = ctx.training || ctx.running;
    for (let i = 0; i < N; i++) {
      const p = on ? (t * 0.35 + i / N) % 1 : (i / N) * 0.4;
      // fall from wide rim (y 2.1, r 0.75) to spout (y 0.9, r 0.06)
      const y = 2.1 - p * 1.2;
      const r = 0.75 - p * 0.69;
      const a = i * 2.4 + t * 0.4;
      tmp.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      tmp.scale.setScalar(0.045 - p * 0.02);
      tmp.updateMatrix();
      drops.current.setMatrixAt(i, tmp.matrix);
    }
    drops.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <Stage id="data-pipeline" labelPos={[0, 2.9, 0]} halo={[2.0, 2.8, 1.8]} plinth={{ w: 1.8, d: 1.6 }} dimInInference>
      {/* funnel */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.8, 0.1, 1.1, 24, 1, true]} />
        <meshStandardMaterial color="#3a3630" roughness={0.4} metalness={0.55} side={THREE.DoubleSide} emissive="#b39a6b" emissiveIntensity={0.1} />
      </mesh>
      <instancedMesh ref={drops} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#c9b280" transparent opacity={0.85} />
      </instancedMesh>
      {/* clean output cube */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#35312a" roughness={0.3} metalness={0.6} emissive="#b39a6b" emissiveIntensity={0.45} />
      </mesh>
      <Text position={[0, 2.35, 0]} fontSize={0.09} color="#c9b280" anchorX="center">
        2.7B pages → 15T tokens
      </Text>
    </Stage>
  );
}

function Pretraining() {
  const ctx = useScene();
  const pile = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (pile.current && (ctx.training || ctx.running)) pile.current.rotation.y = state.clock.elapsedTime * 0.15;
  });
  return (
    <Stage id="pretraining" labelPos={[0, 2.6, 0]} halo={[2.4, 2.6, 2.0]} plinth={{ w: 2.2, d: 1.8 }} dimInInference>
      <group ref={pile}>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 2.4) * 0.5, 0.35 + i * 0.18, Math.cos(i * 2.4) * 0.5]} rotation={[0, i * 0.7, 0]}>
            <boxGeometry args={[0.9, 0.1, 0.65]} />
            <meshStandardMaterial color="#3a3630" roughness={0.5} metalness={0.3} emissive="#b39a6b" emissiveIntensity={0.14} />
          </mesh>
        ))}
      </group>
      <Text position={[0, 2.2, 0]} fontSize={0.12} color="#c9b280" anchorX="center">
        15T tokens
      </Text>
    </Stage>
  );
}

function Alignment() {
  return (
    <Stage id="alignment" labelPos={[0, 2.4, 0]} halo={[2.2, 2.4, 1.4]} plinth={{ w: 2.0, d: 1.2 }} dimInInference>
      <mesh position={[-0.45, 1.0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.14]} />
        <meshStandardMaterial color="#252a2c" roughness={0.3} metalness={0.4} emissive="#79a68d" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[-0.45, 1.0, 0.09]} fontSize={0.24} color="#9ac4a8" anchorX="center">
        ✓
      </Text>
      <mesh position={[0.45, 1.0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.14]} />
        <meshStandardMaterial color="#2c2526" roughness={0.3} metalness={0.4} emissive="#b08585" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0.45, 1.0, 0.09]} fontSize={0.24} color="#c4a5a5" anchorX="center">
        ✗
      </Text>
      <Text position={[0, 0.45, 0.1]} fontSize={0.09} color="#c9b280" anchorX="center">
        humans rank answers
      </Text>
    </Stage>
  );
}

function ReasoningRl() {
  const ctx = useScene();
  const helix = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (helix.current && (ctx.training || ctx.running)) helix.current.rotation.y += delta * 0.5;
  });
  return (
    <Stage id="reasoning" labelPos={[0, 2.7, 0]} halo={[2.0, 2.7, 2.0]} plinth={{ w: 1.8, d: 1.8 }} dimInInference>
      <group ref={helix}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 0.9) * 0.45, 0.35 + i * 0.13, Math.cos(i * 0.9) * 0.45]}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color="#b39a6b" emissive="#b39a6b" emissiveIntensity={0.3 + (i / 14) * 0.45} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.12]} />
        <meshStandardMaterial color="#252a2c" emissive="#79a68d" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 2.3, 0.08]} fontSize={0.2} color="#9ac4a8" anchorX="center">
        ✓
      </Text>
    </Stage>
  );
}

/** Interpretability — a feature dictionary: a grid of mostly-dark cells with a
 *  few monosemantic features lit and one amplified (the steered feature). */
function Interpretability() {
  const ctx = useScene();
  const cols = 9, rows = 6;
  const inst = useRef<THREE.InstancedMesh>(null);
  const hero = useRef<THREE.MeshStandardMaterial>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const lit = useMemo(() => new Set([7, 12, 20, 29, 38, 41, 47]), []); // scattered monosemantic features
  useFrame((state) => {
    const on = ctx.training || ctx.running || ctx.selectedId === "interpretability" || ctx.highlight.has("interpretability");
    if (inst.current) {
      const t = state.clock.elapsedTime;
      let k = 0;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        tmp.position.set(-0.72 + c * 0.18, 0.55 + r * 0.2, 0);
        tmp.scale.setScalar(0.07);
        tmp.updateMatrix();
        inst.current.setMatrixAt(k, tmp.matrix);
        const feat = lit.has(k);
        const b = feat && on ? 0.55 + 0.25 * Math.sin(t * 2 + k) : 0.05;
        col.setRGB(b * 0.7, b * 0.66, b * 0.42); // brass glow
        inst.current.setColorAt(k, col);
        k++;
      }
      inst.current.instanceMatrix.needsUpdate = true;
      if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
    }
    if (hero.current) hero.current.emissiveIntensity = THREE.MathUtils.lerp(hero.current.emissiveIntensity, on ? 1.1 : 0.15, 0.1);
  });
  return (
    <Stage id="interpretability" labelPos={[0, 2.5, 0]} halo={[2.4, 2.6, 1.6]} plinth={{ w: 2.2, d: 1.4 }} dimInInference>
      {/* the scan board */}
      <mesh position={[0, 1.15, -0.05]}>
        <boxGeometry args={[2.0, 1.5, 0.06]} />
        <meshStandardMaterial color="#2b2e34" roughness={0.4} metalness={0.55} emissive="#b39a6b" emissiveIntensity={0.05} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, cols * rows]} position={[0, 0, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.4} toneMapped={false} />
      </instancedMesh>
      {/* the amplified 'Golden Gate' feature — one cell pulled out + a dial */}
      <mesh position={[0.78, 1.72, 0.12]}>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshStandardMaterial ref={hero} color="#c9a86a" emissive="#c9a86a" emissiveIntensity={0.15} roughness={0.35} />
      </mesh>
      <Text position={[0.78, 1.9, 0.12]} fontSize={0.07} color="#c9b280" anchorX="center">
        steer
      </Text>
    </Stage>
  );
}

/** Beyond Text — a side exhibit: an image patch-grid (multimodal 'tokenize
 *  everything') and a diffusion denoise strip (noise → clean, in parallel). */
function BeyondText() {
  const ctx = useScene();
  const patches = useRef<THREE.InstancedMesh>(null);
  const denoise = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const on = ctx.running || ctx.selectedId === "beyond-text" || ctx.highlight.has("beyond-text");
    if (patches.current) {
      let k = 0;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        tmp.position.set(-0.62 + c * 0.16, 0.62 + r * 0.16, 0.06);
        tmp.scale.setScalar(0.13);
        tmp.updateMatrix();
        patches.current.setMatrixAt(k++, tmp.matrix);
      }
      patches.current.instanceMatrix.needsUpdate = true;
    }
    // diffusion strip: a wave of "resolve" sweeping left→right, over and over
    const sweep = on ? (state.clock.elapsedTime * 0.5) % 1.6 : 1.2;
    denoise.current.forEach((m, i) => {
      if (!m) return;
      const cleaned = Math.max(0, Math.min(1, sweep - i / 6)); // 0 = noisy, 1 = clean
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 0.15 + cleaned * 0.5, 0.12);
      m.roughness = 0.8 - cleaned * 0.45;
    });
  });
  return (
    <Stage id="beyond-text" labelPos={[0, 2.5, 0]} halo={[3.0, 2.6, 0.9]} plinth={{ w: 2.9, d: 0.9 }}>
      {/* left board: multimodal patch grid */}
      <mesh position={[-0.5, 1.2, 0]}>
        <boxGeometry args={[1.5, 1.4, 0.08]} />
        <meshStandardMaterial color="#2b2e34" roughness={0.4} metalness={0.55} emissive="#79a68d" emissiveIntensity={0.05} />
      </mesh>
      <instancedMesh ref={patches} args={[undefined, undefined, 16]} position={[-0.5, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9db8cc" emissive="#5f8cb0" emissiveIntensity={0.35} roughness={0.4} />
      </instancedMesh>
      <Text position={[-0.5, 0.32, 0.1]} fontSize={0.09} color="#9aa0ab" anchorX="center">
        image → patches
      </Text>
      {/* right strip: diffusion denoise */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0.7 + i * 0.16, 1.2, 0.05]}>
          <boxGeometry args={[0.13, 0.9, 0.13]} />
          <meshStandardMaterial
            ref={(el) => { denoise.current[i] = el; }}
            color="#79a68d"
            emissive="#79a68d"
            emissiveIntensity={0.15}
            roughness={0.8}
            metalness={0.3}
          />
        </mesh>
      ))}
      <Text position={[1.18, 0.55, 0.1]} fontSize={0.09} color="#9aa0ab" anchorX="center">
        noise → image (diffusion)
      </Text>
    </Stage>
  );
}

/* ---------------------------------------------------------------- *
 *  Scene assembly
 * ---------------------------------------------------------------- */

function Machine() {
  const ctx = useScene();
  return (
    <group>
      <group position={[-9, 0, 0]}><PromptPanel /></group>
      <group position={[-6.6, 0, 0]}><Tokenizer /></group>
      <group position={[-4.2, 0, 0]}><EmbeddingWall /></group>
      <group position={[-4.2, 1.85, 0.5]}><PositionalDial /></group>
      <group position={[-0.8, 0, 0]}><TransformerStack /></group>
      <group position={[-2.0, 0.3, 2.4]}><AttentionPlate /></group>
      <group position={[0.6, 0.3, 2.4]}><MoEPlate /></group>
      <group position={[-0.8, 0, -2.6]}><KvCache /></group>
      <group position={[4.2, 0, 0]}><LogitsBoard /></group>
      <group position={[6.6, 0, 0]}><Sampler /></group>
      <LoopArc />
      <group position={[2.0, 0, 5.6]}><BeyondText /></group>
      <ContextFrame />
      <group position={[9.4, 0, 0.4]}><Hallucination /></group>
      <group position={[9.6, 0, -3.2]}><ToolsAgents /></group>
      <group position={[-9.2, 0, -6.5]}><ModelArtifact /></group>
      <group position={[-7.1, 0, -6.5]}><DataFunnel /></group>
      <group position={[-5, 0, -6.5]}><Pretraining /></group>
      <group position={[-1, 0, -6.5]}><Alignment /></group>
      <group position={[3, 0, -6.5]}><ReasoningRl /></group>
      <group position={[5.7, 0, -6.5]}><Interpretability /></group>
      <mesh position={[-2.0, 0.02, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 3.4]} />
        <meshBasicMaterial color="#b39a6b" transparent opacity={ctx.training ? 0.04 : 0.012} />
      </mesh>
      <FlowConduit segment="input" />
      <FlowConduit segment="core" />
      <FlowConduit segment="output" />
      <FlowConduit segment="loop" />
      <FlowParticles segment="input" />
      <FlowParticles segment="core" />
      <FlowParticles segment="output" />
      <FlowParticles segment="loop" />
      <FlowParticles segment="train" />
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Canvas wrapper (default export, lazy-loaded)
 * ---------------------------------------------------------------- */

export default function LlmScene(props: LlmSceneState) {
  const [interacted, setInteracted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const attract = !interacted && !props.selectedId && props.highlightIds.length === 0 && !props.focusStepId;
  const ctx: Ctx = { ...props, highlight: new Set(props.highlightIds), attract };

  // Same mount nudge as HvacScene: some browsers (notably Edge/Windows) miss
  // r3f's first ResizeObserver measurement and the canvas sticks at 300x150.
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
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
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

      {/* studio floor — reflections sell the scale */}
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

      {/* the cinematic pass */}
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
