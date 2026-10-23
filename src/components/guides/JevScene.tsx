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
import { EXAMPLE, JOURNEY, KINDS, stationById, type FlowSegment } from "@/data/jev";

/**
 * JevScene: the decision bench, rendered like a product shoot.
 *
 * Same material language as the HVAC and LLM machines: neutral studio light,
 * graphite panels, muted functional accents per kind, a soft-reflective
 * floor, no bloom. The front row is the worked example (a ticket becomes
 * state and questions, Jev stamps three typed answers, the rules gate routes
 * it, the generator next door writes what Jev never will). The back row is
 * the agent harness from act two, dimmed until the journey gets there.
 *
 * Every instrument animates to the numbers in the data module when its step
 * is lit, so what the reader sees on the dial is what the tables say.
 */

export interface JevSceneState {
  selectedId: string | null;
  highlightIds: string[];
  onSelect: (id: string | null) => void;
  running: boolean;
  labels: boolean;
  /** Act two (the harness row) is in play. */
  act2: boolean;
  flow: FlowSegment;
  /** Journey step id, drives the cinematic camera. Null = free camera. */
  focusStepId?: string | null;
  glPower?: "high-performance" | "default";
}

interface Ctx extends Omit<JevSceneState, "highlightIds"> {
  highlight: Set<string>;
  attract: boolean;
}
const SceneCtx = createContext<Ctx | null>(null);
const useScene = () => useContext(SceneCtx)!;

const kindColor = (id: string) => KINDS[stationById(id)?.kind ?? "decision"].color;
const PANEL = "#33363d";
const PANEL_DARK = "#2b2e34";
const INK = "#e7e5e4";
const INK_DIM = "#9aa0ab";

/* ---------------------------------------------------------------- *
 *  Camera choreography, one pose per journey step
 * ---------------------------------------------------------------- */

type Pose = { pos: readonly [number, number, number]; look: readonly [number, number, number] };
const DEFAULT_POSE: Pose = { pos: [1.2, 5.8, 17.5], look: [0.4, 1.5, -0.8] };
const DEFAULT_POS_V = new THREE.Vector3(...DEFAULT_POSE.pos);
const CAM_POSES: Record<string, Pose> = {
  "j-request": { pos: [-9.4, 2.7, 5.2], look: [-9.2, 1.4, 0] },
  "j-state": { pos: [-6.0, 3.0, 6.2], look: [-5.4, 1.2, 0.8] },
  "j-jev": { pos: [-1.4, 3.1, 6.0], look: [-1.4, 1.2, 0] },
  "j-choice": { pos: [2.6, 3.6, 6.2], look: [2.6, 1.2, -0.6] },
  "j-score": { pos: [4.8, 2.6, 4.6], look: [4.8, 1.3, 0] },
  "j-noul": { pos: [7.0, 2.6, 4.6], look: [6.9, 1.2, 0] },
  "j-rules": { pos: [10.2, 3.2, 5.4], look: [10.0, 1.2, 0.2] },
  "j-not": { pos: [8.6, 3.4, 1.0], look: [8.6, 1.2, -3.4] },
  "j-context": { pos: [-7.0, 3.4, -2.0], look: [-7.0, 1.1, -6.5] },
  "j-gate": { pos: [-2.5, 3.4, -2.0], look: [-2.5, 1.1, -6.5] },
  "j-loop": { pos: [1.0, 4.6, -1.0], look: [0.4, 1.6, -5.4] },
  "j-prove": { pos: [6.5, 3.4, -2.0], look: [6.5, 1.1, -6.5] },
};

/** Explore focus: clicking a station reuses the journey pose that lit it. */
const STATION_POSE: Record<string, Pose> = (() => {
  const m: Record<string, Pose> = {};
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
        ? STATION_POSE[focusKey] ?? DEFAULT_POSE
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
 *  Design language
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

/** Smoothly animated scalar, one per instrument. */
function useEase(target: number, speed = 0.06) {
  const v = useRef(0);
  useFrame(() => {
    v.current = THREE.MathUtils.lerp(v.current, target, speed);
  });
  return v;
}

function Station({
  id,
  children,
  labelPos = [0, 1.35, 0],
  halo = [2.2, 2.2, 1.4],
  plinth,
}: {
  id: string;
  children: React.ReactNode;
  labelPos?: [number, number, number];
  halo?: [number, number, number];
  plinth?: { w: number; d: number };
}) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  const station = stationById(id);
  const selected = ctx.selectedId === id;
  const lit = selected || ctx.highlight.has(id);
  const color = kindColor(id);
  // the harness row sits back until act two, or until a reader clicks into it
  const dimmed = station?.act === 2 && !ctx.act2 && !lit;

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
      <group>
        {plinth && <Plinth w={plinth.w} d={plinth.d} color={color} />}
        {children}
      </group>
      <mesh position={[0, halo[1] / 2 - 0.1, 0]}>
        <boxGeometry args={halo} />
        <meshBasicMaterial ref={haloMat} color={color} transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {/* During a guided step only the lit stations are named, so a close-up is
          never crowded by the label of a neighbour that happens to be near the
          camera; the overview and Explore mode name everything. */}
      {((ctx.labels && !ctx.focusStepId) || selected || lit) && station && (
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
              opacity: dimmed ? 0.4 : 1,
              boxShadow: lit ? `0 0 14px ${color}66` : "none",
            }}
          >
            {station.short}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Flow: pulses riding the conduits
 * ---------------------------------------------------------------- */

const PATHS: Record<Exclude<FlowSegment, null>, THREE.Vector3[]> = {
  intake: [new THREE.Vector3(-9.0, 1.2, 0.2), new THREE.Vector3(-6.4, 0.9, 0.9), new THREE.Vector3(-1.4, 1.2, 0)],
  decide: [new THREE.Vector3(-1.4, 1.2, 0), new THREE.Vector3(2.6, 1.5, 1.1), new THREE.Vector3(6.9, 1.1, 0)],
  act: [new THREE.Vector3(6.9, 1.1, 0), new THREE.Vector3(8.4, 1.7, 0.2), new THREE.Vector3(10.0, 1.0, 0)],
  harness: [new THREE.Vector3(-7.0, 1.0, -6.5), new THREE.Vector3(-2.5, 1.0, -6.5), new THREE.Vector3(2.0, 1.0, -6.5)],
  loop: [new THREE.Vector3(2.0, 1.0, -6.5), new THREE.Vector3(-2.8, 4.8, -3.2), new THREE.Vector3(-6.4, 1.4, 0.4)],
};
const SEGMENT_COLOR: Record<Exclude<FlowSegment, null>, string> = {
  intake: "#5f8cb0",
  decide: "#8b84ad",
  act: "#b39a6b",
  harness: "#5f8cb0",
  loop: "#79a68d",
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
  out.set(
    2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x),
    2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y),
    2 * (1 - t) * (b.z - a.z) + 2 * t * (c.z - b.z),
  ).normalize();
}

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
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        ref={mat}
        color={PANEL_DARK}
        roughness={0.4}
        metalness={0.6}
        emissive={SEGMENT_COLOR[segment]}
        emissiveIntensity={0.08}
        transparent={segment === "loop"}
        opacity={segment === "loop" ? 0.55 : 1}
      />
    </mesh>
  );
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const GOLDEN = 0.6180339887;

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
  const back = segment === "harness" || segment === "loop";

  useFrame((state) => {
    if (!mesh.current || !mat.current) return;
    const active = ctx.flow === segment;
    const visible = ctx.running || active;
    const speed = active ? 0.3 : 0.13;
    const rest = back ? (ctx.act2 ? 0.3 : 0.04) : 0.3;
    const targetOpacity = !visible ? 0 : active ? 0.95 : rest;
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, targetOpacity, 0.08);
    const t0 = state.clock.elapsedTime * speed;
    for (let i = 0; i < N; i++) {
      const t = (t0 * (1 + ((i * 7) % 5) * 0.016) + ((i * GOLDEN) % 1)) % 1;
      sampleQuadratic(pts, t, v);
      sampleTangent(pts, t, tan);
      const fade = THREE.MathUtils.smoothstep(t, 0, 0.14) * (1 - THREE.MathUtils.smoothstep(t, 0.86, 1));
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
      <meshBasicMaterial ref={mat} color="#cbd5e1" transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

function Dust() {
  const N = 110;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: -14 + ((i * 37) % 280) / 10,
        y: 0.3 + ((i * 53) % 70) / 10,
        z: -9 + ((i * 71) % 150) / 10,
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
 *  Act one: the decision bench
 * ---------------------------------------------------------------- */

function Panel({ w, h, d = 0.08, color = PANEL }: { w: number; h: number; d?: number; color?: string }) {
  return (
    <mesh position={[0, h / 2, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.5} />
    </mesh>
  );
}

function Lamp({ position, color, on, size = 0.07 }: { position: [number, number, number]; color: string; on: boolean; size?: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (mat.current) mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, on ? 0.7 : 0.08, 0.1);
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.08} roughness={0.3} />
    </mesh>
  );
}

function TicketPanel() {
  const ctx = useScene();
  const lit = ctx.highlight.has("ticket") || ctx.selectedId === "ticket";
  return (
    <Station id="ticket" labelPos={[0, 2.05, 0]} halo={[2.3, 2.1, 0.9]} plinth={{ w: 2.2, d: 0.9 }}>
      <group position={[0, 0.22, 0]}>
        <Panel w={1.9} h={1.45} />
        <mesh position={[0, 1.38, 0.045]}>
          <boxGeometry args={[1.9, 0.08, 0.02]} />
          <meshStandardMaterial color="#5f8cb0" emissive="#5f8cb0" emissiveIntensity={0.35} />
        </mesh>
        <Text position={[-0.82, 1.2, 0.05]} fontSize={0.075} color={INK_DIM} anchorX="left">
          SUPPORT TICKET · NEW
        </Text>
        <Text position={[-0.82, 0.86, 0.05]} fontSize={0.12} color={INK} anchorX="left" anchorY="top" maxWidth={1.66} lineHeight={1.25}>
          {`"${EXAMPLE.ticket}"`}
        </Text>
        <Text position={[-0.82, 0.32, 0.05]} fontSize={0.07} color={INK_DIM} anchorX="left" anchorY="top" maxWidth={1.66} lineHeight={1.3}>
          three decisions: login failure? · which team? · how severe?
        </Text>
        <Lamp position={[0.8, 1.2, 0.06]} color="#79a68d" on={lit} size={0.04} />
      </group>
    </Station>
  );
}

function StateStore() {
  return (
    <Station id="state" labelPos={[0, 1.55, 0]} halo={[1.7, 1.5, 1.3]} plinth={{ w: 1.6, d: 1.2 }}>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, 0.34 + k * 0.22, 0]}>
          <boxGeometry args={[1.25, 0.14, 0.9]} />
          <meshStandardMaterial color={k === 2 ? "#3a4653" : PANEL} roughness={0.5} metalness={0.55} />
        </mesh>
      ))}
      <Text position={[0, 1.0, 0.47]} fontSize={0.1} color="#9db8cc" anchorX="center">
        {"{ text · JSON }"}
      </Text>
      <Text position={[0, 0.16, 0.62]} fontSize={0.065} color={INK_DIM} anchorX="center">
        state: the whole world Jev sees
      </Text>
    </Station>
  );
}

function QuestionRack() {
  const tags = ["NOUL", "CHOICE", "SCORE"];
  const lines = ["login failure?", "which team?", "how severe?"];
  return (
    <Station id="questions" labelPos={[0, 1.6, 0]} halo={[2.1, 1.6, 1.0]} plinth={{ w: 2.0, d: 0.9 }}>
      {tags.map((t, i) => (
        <group key={t} position={[-0.62 + i * 0.62, 0.22, 0]} rotation={[-0.12, 0, 0]}>
          <Panel w={0.54} h={0.82} color={PANEL_DARK} />
          <mesh position={[0, 0.76, 0.045]}>
            <boxGeometry args={[0.54, 0.06, 0.02]} />
            <meshStandardMaterial color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.3} />
          </mesh>
          <Text position={[0, 0.58, 0.05]} fontSize={0.075} color="#c4bfe0" anchorX="center">
            {t}
          </Text>
          <Text position={[0, 0.36, 0.05]} fontSize={0.06} color={INK} anchorX="center" maxWidth={0.48} lineHeight={1.25} textAlign="center">
            {lines[i]}
          </Text>
        </group>
      ))}
    </Station>
  );
}

function JevCore() {
  const ctx = useScene();
  const lit = ctx.highlight.has("jev") || ctx.selectedId === "jev";
  const active = ctx.flow === "decide" || lit;
  const lid = useRef<THREE.Mesh>(null);
  const lamps = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (lid.current) {
      // the press: a slow stamp when deciding, at rest otherwise
      const y = active ? 1.06 - Math.max(0, Math.sin(t * 2.2)) * 0.18 : 1.06;
      lid.current.position.y = THREE.MathUtils.lerp(lid.current.position.y, y, 0.15);
    }
    lamps.current.forEach((m, i) => {
      if (!m) return;
      const on = active && Math.sin(t * 2.2 - i * 0.9) > 0.3;
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, on ? 0.7 : 0.08, 0.15);
    });
  });
  return (
    <Station id="jev" labelPos={[0, 1.95, 0]} halo={[2.3, 2.1, 1.6]} plinth={{ w: 2.2, d: 1.5 }}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.7, 0.56, 1.15]} />
        <meshStandardMaterial color={PANEL} roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh ref={lid} position={[0, 1.06, 0]}>
        <boxGeometry args={[1.2, 0.34, 0.85]} />
        <meshStandardMaterial color="#3b3752" roughness={0.4} metalness={0.7} />
      </mesh>
      <Text position={[0, 1.08, 0.44]} fontSize={0.2} color="#d8d3ee" anchorX="center">
        JEV
      </Text>
      <Text position={[0, 0.52, 0.59]} fontSize={0.065} color={INK_DIM} anchorX="center">
        System One · decides, never writes
      </Text>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.5 + i * 0.5, 0.82, 0.56]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial ref={(el) => { lamps.current[i] = el; }} color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.08} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.32, 0.62]}>
          <boxGeometry args={[0.2, 0.08, 0.1]} />
          <meshStandardMaterial color="#5f8cb0" emissive="#5f8cb0" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </Station>
  );
}

const CHOICE_ORDER = ["authentication", "platform", "billing", "insufficient_evidence"] as const;
const CHOICE_SHORT: Record<(typeof CHOICE_ORDER)[number], string> = {
  authentication: "auth",
  platform: "platform",
  billing: "billing",
  insufficient_evidence: "unclear",
};

function ChoiceBoard() {
  const ctx = useScene();
  const lit = ctx.highlight.has("choice") || ctx.selectedId === "choice";
  const ease = useEase(lit ? 1 : 0.18, 0.05);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const probs = EXAMPLE.answers.team.probabilities;
  useFrame(() => {
    bars.current.forEach((b, i) => {
      if (!b) return;
      const p = probs[CHOICE_ORDER[i]];
      const h = 0.06 + p * 1.1 * ease.current;
      b.scale.y = h;
      b.position.y = 0.34 + h / 2;
    });
  });
  return (
    <Station id="choice" labelPos={[0, 1.95, 0]} halo={[2.1, 2.1, 1.1]} plinth={{ w: 2.0, d: 1.0 }}>
      <group position={[0, 0.22, -0.3]}>
        <Panel w={1.8} h={1.5} color={PANEL_DARK} />
      </group>
      <Text position={[0, 1.6, -0.25]} fontSize={0.075} color={INK_DIM} anchorX="center">
        which team? → authentication
      </Text>
      {CHOICE_ORDER.map((id, i) => (
        <group key={id}>
          <mesh ref={(el) => { bars.current[i] = el; }} position={[-0.6 + i * 0.4, 0.4, 0]}>
            <boxGeometry args={[0.24, 1, 0.24]} />
            <meshStandardMaterial
              color={id === "authentication" ? "#8b84ad" : "#4a4760"}
              emissive="#8b84ad"
              emissiveIntensity={id === "authentication" ? 0.35 : 0.08}
              roughness={0.5}
            />
          </mesh>
          <Text position={[-0.6 + i * 0.4, 0.25, 0.2]} fontSize={0.055} color={INK_DIM} anchorX="center">
            {CHOICE_SHORT[id]}
          </Text>
          <Text position={[-0.6 + i * 0.4, 1.5, 0.2]} fontSize={0.07} color={id === "authentication" ? "#d8d3ee" : INK_DIM} anchorX="center">
            {probs[id].toFixed(2)}
          </Text>
        </group>
      ))}
    </Station>
  );
}

function ScoreLadder() {
  const ctx = useScene();
  const lit = ctx.highlight.has("score") || ctx.selectedId === "score";
  const ease = useEase(lit ? 1 : 0, 0.05);
  const carriage = useRef<THREE.Group>(null);
  const score = EXAMPLE.answers.severity.score;
  const H = 1.25;
  useFrame(() => {
    if (carriage.current) carriage.current.position.y = 0.36 + (score / 2) * H * ease.current;
  });
  const legend = EXAMPLE.questions[2].options ?? [];
  return (
    <Station id="score" labelPos={[0, 2.05, 0]} halo={[1.9, 2.2, 1.1]} plinth={{ w: 1.8, d: 1.0 }}>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.36 + H / 2, 0]}>
          <boxGeometry args={[0.06, H + 0.1, 0.06]} />
          <meshStandardMaterial color="#3a3d45" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {[0, 1, 2].map((lvl) => (
        <group key={lvl}>
          <mesh position={[0, 0.36 + (lvl / 2) * H, 0]}>
            <boxGeometry args={[0.7, 0.035, 0.08]} />
            <meshStandardMaterial color="#6a6d78" roughness={0.5} metalness={0.5} />
          </mesh>
          <Text position={[0.5, 0.36 + (lvl / 2) * H, 0]} fontSize={0.065} color={INK_DIM} anchorX="left">
            {`${lvl} ${legend[lvl]?.label ?? ""}`}
          </Text>
        </group>
      ))}
      <group ref={carriage} position={[0, 0.36, 0]}>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.8, 0.09, 0.14]} />
          <meshStandardMaterial color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.45} roughness={0.4} />
        </mesh>
        <Text position={[-0.5, 0, 0.1]} fontSize={0.1} color="#d8d3ee" anchorX="right">
          {score.toFixed(2)}
        </Text>
      </group>
      <Text position={[0, 1.78, 0]} fontSize={0.07} color={INK_DIM} anchorX="center">
        how severe? weighted mean on your scale
      </Text>
    </Station>
  );
}

function NoulDial() {
  const ctx = useScene();
  const lit = ctx.highlight.has("noul") || ctx.selectedId === "noul";
  const ease = useEase(lit ? 1 : 0, 0.05);
  const needle = useRef<THREE.Group>(null);
  const p = EXAMPLE.answers.login_failure.noul;
  useFrame(() => {
    if (!needle.current) return;
    // rest at 0.5 (both outcomes equally likely), sweep to the answer when lit
    const value = 0.5 + (p - 0.5) * ease.current;
    needle.current.rotation.z = Math.PI / 2 - value * Math.PI;
  });
  return (
    <Station id="noul" labelPos={[0, 1.95, 0]} halo={[1.9, 2.0, 1.1]} plinth={{ w: 1.8, d: 1.0 }}>
      <group position={[0, 0.5, 0]}>
        <mesh position={[0, 0, -0.06]}>
          <cylinderGeometry args={[0.85, 0.85, 0.08, 40, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={PANEL_DARK} roughness={0.5} metalness={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[0.66, 0.78, 40, 1, 0, Math.PI]} />
          <meshStandardMaterial color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <group ref={needle}>
          <mesh position={[0, 0.36, 0.05]}>
            <boxGeometry args={[0.035, 0.72, 0.03]} />
            <meshStandardMaterial color="#e7e5e4" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#3a3d45" roughness={0.3} metalness={0.8} />
        </mesh>
        <Text position={[-0.9, 0.02, 0.05]} fontSize={0.07} color={INK_DIM} anchorX="right">
          no
        </Text>
        <Text position={[0.9, 0.02, 0.05]} fontSize={0.07} color={INK_DIM} anchorX="left">
          yes
        </Text>
      </group>
      <Text position={[0, 1.55, 0]} fontSize={0.13} color="#d8d3ee" anchorX="center">
        {`P(yes) = ${p.toFixed(2)}`}
      </Text>
      <Text position={[0, 1.78, 0]} fontSize={0.07} color={INK_DIM} anchorX="center">
        explicitly reports a login failure?
      </Text>
    </Station>
  );
}

function ConfidenceMeter() {
  const ctx = useScene();
  const lit = ctx.highlight.has("confidence") || ctx.selectedId === "confidence";
  const ease = useEase(lit ? 1 : 0, 0.05);
  const fill = useRef<THREE.Mesh>(null);
  const c = EXAMPLE.answers.team.confidence;
  const W = 1.3;
  useFrame(() => {
    if (!fill.current) return;
    const w = Math.max(0.02, W * c * ease.current);
    fill.current.scale.x = w;
    fill.current.position.x = -W / 2 + w / 2;
  });
  return (
    <Station id="confidence" labelPos={[0, 1.25, 0]} halo={[1.7, 1.3, 0.8]} plinth={{ w: 1.6, d: 0.7 }}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[W + 0.08, 0.22, 0.2]} />
        <meshStandardMaterial color={PANEL_DARK} roughness={0.5} metalness={0.55} />
      </mesh>
      <mesh ref={fill} position={[-W / 2, 0.5, 0.06]}>
        <boxGeometry args={[1, 0.14, 0.12]} />
        <meshStandardMaterial color="#8b84ad" emissive="#8b84ad" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 0.82, 0]} fontSize={0.08} color="#d8d3ee" anchorX="center">
        {`confidence ${c.toFixed(2)}`}
      </Text>
      <Text position={[0, 0.25, 0.12]} fontSize={0.055} color={INK_DIM} anchorX="center">
        of the Choice beside it: how concentrated, not how right
      </Text>
    </Station>
  );
}

function RulesGate() {
  const ctx = useScene();
  const lit = ctx.highlight.has("rules") || ctx.selectedId === "rules";
  const active = lit || ctx.flow === "act";
  const token = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!token.current) return;
    // a ticket token slides through the gate into the authentication lane
    const t = active ? (state.clock.elapsedTime * 0.35) % 1 : 0;
    token.current.position.x = -0.9 + t * 1.9;
    token.current.position.z = t < 0.55 ? 0 : -(t - 0.55) * 0.9;
    (token.current.material as THREE.MeshStandardMaterial).opacity = active ? 0.9 : 0;
  });
  const lanes: { label: string; z: number; color: string }[] = [
    { label: "authentication queue", z: -0.4, color: "#79a68d" },
    { label: "review by a person", z: 0.0, color: "#b39a6b" },
    { label: "blocked", z: 0.4, color: "#a07070" },
  ];
  return (
    <Station id="rules" labelPos={[0, 2.05, 0]} halo={[2.4, 2.2, 1.6]} plinth={{ w: 2.3, d: 1.5 }}>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.85, 0]}>
          <boxGeometry args={[0.12, 1.3, 0.12]} />
          <meshStandardMaterial color="#3a3d45" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.35, 0.14, 0.16]} />
        <meshStandardMaterial color="#3a3d45" roughness={0.4} metalness={0.7} />
      </mesh>
      <Text position={[0, 1.5, 0.09]} fontSize={0.07} color="#e2d5b8" anchorX="center">
        IF noul {">"} 0.9 AND team = auth
      </Text>
      {lanes.map((l, i) => (
        <group key={l.label}>
          <Lamp position={[-0.3 + i * 0.3, 1.28, 0.1]} color={l.color} on={active && i === 0} size={0.045} />
          <mesh position={[0.9, 0.24, l.z]}>
            <boxGeometry args={[1.0, 0.04, 0.3]} />
            <meshStandardMaterial color={l.color} emissive={l.color} emissiveIntensity={active && i === 0 ? 0.35 : 0.06} roughness={0.6} />
          </mesh>
          <Text position={[1.45, 0.3, l.z]} fontSize={0.055} color={INK_DIM} anchorX="left">
            {l.label}
          </Text>
        </group>
      ))}
      <mesh ref={token} position={[-0.9, 0.36, 0]}>
        <boxGeometry args={[0.18, 0.12, 0.14]} />
        <meshStandardMaterial color="#e7e5e4" emissive="#b39a6b" emissiveIntensity={0.3} transparent opacity={0} />
      </mesh>
      <Text position={[0, 0.16, 0.85]} fontSize={0.06} color={INK_DIM} anchorX="center">
        your code: thresholds · routing · permissions
      </Text>
    </Station>
  );
}

function GeneratorDesk() {
  const ctx = useScene();
  const lit = ctx.highlight.has("generator") || ctx.selectedId === "generator";
  const lines = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lines.current.forEach((m, i) => {
      if (!m) return;
      // typing: each line grows in turn, then the page resets
      const phase = ((t * 0.5 + i * 0.22) % 1.6) / 1.6;
      const w = lit ? Math.min(1, phase * 1.8) * (0.7 + (i % 3) * 0.12) : 0.25 + (i % 3) * 0.12;
      m.scale.x = w;
      m.position.x = -0.62 + (w * 1.24) / 2;
    });
  });
  return (
    <Station id="generator" labelPos={[0, 2.0, 0]} halo={[2.2, 2.1, 1.2]} plinth={{ w: 2.1, d: 1.1 }}>
      <group position={[0, 0.22, -0.2]}>
        <Panel w={1.7} h={1.45} />
        <mesh position={[0, 1.38, 0.045]}>
          <boxGeometry args={[1.7, 0.08, 0.02]} />
          <meshStandardMaterial color="#79a68d" emissive="#79a68d" emissiveIntensity={0.35} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} ref={(el) => { lines.current[i] = el; }} position={[-0.62, 1.12 - i * 0.16, 0.05]}>
            <boxGeometry args={[1.24, 0.06, 0.02]} />
            <meshStandardMaterial color="#9fbfae" emissive="#79a68d" emissiveIntensity={0.2} />
          </mesh>
        ))}
        <Text position={[0, 0.16, 0.05]} fontSize={0.07} color={INK_DIM} anchorX="center">
          generative model: replies · code · explanations
        </Text>
      </group>
      <Text position={[0, 0.12, 0.5]} fontSize={0.06} color={INK_DIM} anchorX="center">
        not Jev
      </Text>
    </Station>
  );
}

/* ---------------------------------------------------------------- *
 *  Act two: inside an agent harness
 * ---------------------------------------------------------------- */

function ChunkStore() {
  const ctx = useScene();
  const lit = ctx.highlight.has("chunks") || ctx.selectedId === "chunks";
  const ease = useEase(lit ? 1 : 0, 0.05);
  const shutters = useRef<(THREE.Mesh | null)[]>([]);
  const chunks = [
    { label: "login fn", open: 1.0 },
    { label: "trace", open: 0.6 },
    { label: "search", open: 0.3 },
    { label: "styles", open: 0.0 },
  ];
  useFrame(() => {
    shutters.current.forEach((m, i) => {
      if (!m) return;
      const open = chunks[i].open * ease.current;
      const h = 0.9 * (1 - open) + 0.04;
      m.scale.y = h;
      m.position.y = 0.36 + 0.92 - h / 2;
    });
  });
  return (
    <Station id="chunks" labelPos={[0, 1.8, 0]} halo={[2.4, 1.9, 1.2]} plinth={{ w: 2.3, d: 1.1 }}>
      {chunks.map((c, i) => (
        <group key={c.label} position={[-0.78 + i * 0.52, 0, 0]}>
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[0.42, 0.92, 0.5]} />
            <meshStandardMaterial color="#3a4653" emissive="#5f8cb0" emissiveIntensity={0.25} roughness={0.5} />
          </mesh>
          <mesh ref={(el) => { shutters.current[i] = el; }} position={[0, 0.82, 0.27]}>
            <boxGeometry args={[0.44, 1, 0.04]} />
            <meshStandardMaterial color="#22252b" roughness={0.6} metalness={0.5} />
          </mesh>
          <Text position={[0, 0.2, 0.32]} fontSize={0.055} color={INK_DIM} anchorX="center">
            {c.label}
          </Text>
          <Text position={[0, 1.4, 0.1]} fontSize={0.055} color="#9db8cc" anchorX="center">
            {["full", "long", "short", "hidden"][i]}
          </Text>
        </group>
      ))}
    </Station>
  );
}

function PolicyGate() {
  const ctx = useScene();
  const lit = ctx.highlight.has("policy") || ctx.selectedId === "policy";
  return (
    <Station id="policy" labelPos={[0, 1.85, 0]} halo={[2.1, 2.0, 1.3]} plinth={{ w: 2.0, d: 1.2 }}>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]}>
          <boxGeometry args={[0.12, 1.1, 0.12]} />
          <meshStandardMaterial color="#3a3d45" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[1.25, 0.14, 0.16]} />
        <meshStandardMaterial color="#3a3d45" roughness={0.4} metalness={0.7} />
      </mesh>
      <Text position={[0, 1.3, 0.09]} fontSize={0.07} color="#e2d5b8" anchorX="center">
        validate args · files · operation
      </Text>
      <group position={[-1.1, 0.5, 0.3]}>
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.3]} />
          <meshStandardMaterial color="#3b3752" roughness={0.4} metalness={0.7} />
        </mesh>
        <Text position={[0, 0.05, 0.16]} fontSize={0.06} color="#d8d3ee" anchorX="center">
          risk?
        </Text>
        <Text position={[0, -0.07, 0.16]} fontSize={0.05} color={INK_DIM} anchorX="center">
          Jev · Noul
        </Text>
      </group>
      <Lamp position={[-0.3, 1.08, 0.1]} color="#79a68d" on={lit} size={0.045} />
      <Lamp position={[0, 1.08, 0.1]} color="#b39a6b" on={false} size={0.045} />
      <Lamp position={[0.3, 1.08, 0.1]} color="#a07070" on={false} size={0.045} />
      <Text position={[0, 0.16, 0.7]} fontSize={0.06} color={INK_DIM} anchorX="center">
        allow · review · block: decided by policy
      </Text>
    </Station>
  );
}

function ToolsBench() {
  const ctx = useScene();
  const lit = ctx.highlight.has("tools") || ctx.selectedId === "tools";
  const tiles = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tiles.current.forEach((m, i) => {
      if (!m) return;
      // the runner walks the checks; the last one fails until the fix lands
      const phase = (t * 0.6) % 6;
      const running = lit && phase > i;
      const fail = i === 4 && lit && phase > 4 && phase < 5.4;
      const col = fail ? "#a07070" : "#79a68d";
      m.color.set(running ? col : "#3a4a44");
      m.emissive.set(col);
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, running ? 0.45 : 0.06, 0.15);
    });
  });
  return (
    <Station id="tools" labelPos={[0, 1.75, 0]} halo={[2.2, 1.9, 1.2]} plinth={{ w: 2.1, d: 1.1 }}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.7, 0.56, 0.9]} />
        <meshStandardMaterial color={PANEL} roughness={0.45} metalness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-0.6 + i * 0.3, 0.9, 0.2]}>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial ref={(el) => { tiles.current[i] = el; }} color="#3a4a44" emissive="#79a68d" emissiveIntensity={0.06} roughness={0.5} />
        </mesh>
      ))}
      <Text position={[0, 1.2, 0.2]} fontSize={0.065} color={INK_DIM} anchorX="center">
        apply patch · run checks
      </Text>
      <Text position={[0, 0.5, 0.47]} fontSize={0.06} color="#9fbfae" anchorX="center">
        results become next turn&apos;s evidence
      </Text>
    </Station>
  );
}

function MeasureBench() {
  const ctx = useScene();
  const lit = ctx.highlight.has("bench") || ctx.selectedId === "bench";
  const ease = useEase(lit ? 1 : 0.2, 0.05);
  const towers = useRef<(THREE.Mesh | null)[]>([]);
  const heights = [0.55, 0.9, 0.4, 0.7];
  useFrame(() => {
    towers.current.forEach((m, i) => {
      if (!m) return;
      const h = 0.1 + heights[i] * ease.current;
      m.scale.y = h;
      m.position.y = 0.36 + h / 2;
    });
  });
  const labels = ["baseline", "candidate", "cost", "latency"];
  return (
    <Station id="bench" labelPos={[0, 1.8, 0]} halo={[2.3, 1.9, 1.2]} plinth={{ w: 2.2, d: 1.1 }}>
      {labels.map((l, i) => (
        <group key={l}>
          <mesh ref={(el) => { towers.current[i] = el; }} position={[-0.75 + i * 0.5, 0.4, 0]}>
            <boxGeometry args={[0.3, 1, 0.3]} />
            <meshStandardMaterial color={i === 1 ? "#b39a6b" : "#5d564a"} emissive="#b39a6b" emissiveIntensity={i === 1 ? 0.3 : 0.08} roughness={0.5} />
          </mesh>
          <Text position={[-0.75 + i * 0.5, 0.24, 0.22]} fontSize={0.05} color={INK_DIM} anchorX="center">
            {l}
          </Text>
        </group>
      ))}
      <Text position={[0, 1.45, 0]} fontSize={0.065} color="#e2d5b8" anchorX="center">
        same tasks, both ways: success · cost · latency · wrong actions
      </Text>
    </Station>
  );
}

/* ---------------------------------------------------------------- *
 *  Assembly
 * ---------------------------------------------------------------- */

function Bench() {
  const ctx = useScene();
  return (
    <group>
      <group position={[-9.2, 0, 0]}><TicketPanel /></group>
      <group position={[-6.4, 0, 0.3]}><StateStore /></group>
      <group position={[-4.2, 0, 1.6]}><QuestionRack /></group>
      <group position={[-1.4, 0, 0]}><JevCore /></group>
      <group position={[2.6, 0, 0]}><ChoiceBoard /></group>
      {/* front-right of the Choice board it reads: clear of the Choice label from
          the overview, and out of the centre of the step-4 close-up */}
      <group position={[3.8, 0, 2.1]}><ConfidenceMeter /></group>
      <group position={[4.8, 0, 0]}><ScoreLadder /></group>
      <group position={[6.9, 0, 0]}><NoulDial /></group>
      <group position={[10.0, 0, 0]}><RulesGate /></group>
      <group position={[8.6, 0, -3.4]}><GeneratorDesk /></group>

      <group position={[-7.0, 0, -6.5]}><ChunkStore /></group>
      <group position={[-2.5, 0, -6.5]}><PolicyGate /></group>
      <group position={[2.0, 0, -6.5]}><ToolsBench /></group>
      <group position={[6.5, 0, -6.5]}><MeasureBench /></group>
      <mesh position={[-0.2, 0.02, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17, 3.4]} />
        <meshBasicMaterial color="#b39a6b" transparent opacity={ctx.act2 ? 0.04 : 0.012} />
      </mesh>
      <Text position={[-8.2, 0.03, -4.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.16} color="#6b6355" anchorX="left">
        ACT TWO · INSIDE AN AGENT HARNESS
      </Text>

      {(["intake", "decide", "act", "harness", "loop"] as const).map((s) => (
        <FlowConduit key={s} segment={s} />
      ))}
      {(["intake", "decide", "act", "harness", "loop"] as const).map((s) => (
        <FlowParticles key={s} segment={s} />
      ))}
    </group>
  );
}

export default function JevScene(props: JevSceneState) {
  const [interacted, setInteracted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const attract = !interacted && !props.selectedId && props.highlightIds.length === 0 && !props.focusStepId;
  const ctx: Ctx = { ...props, highlight: new Set(props.highlightIds), attract };

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
        <Bench />
        <Dust />
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
