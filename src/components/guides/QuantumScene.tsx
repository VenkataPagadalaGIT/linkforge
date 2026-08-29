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
import { QC_JOURNEY, qcStageById } from "@/data/quantum";
import { captureBuffer } from "@/lib/captureFlag";

/**
 * QuantumScene: a quantum computer as a film set.
 *
 * Same material language as NnScene and LlmScene: neutral studio lighting,
 * gunmetal plinths, muted act accents, soft-reflective floor, cinematic
 * camera rig. The centerpiece is the dilution refrigerator drawn honestly:
 * six plates at their real temperatures, drive lines that visibly attenuate
 * on the way down, a readout line that visibly amplifies on the way up
 * (TWPA at the mixing chamber, HEMT at 4 K), shields, and the chip. Every
 * number a label shows comes from src/data/quantum.ts, which traces to the
 * verified KB. The interference station is the pedagogical heart: wrong
 * answers cancel, right answers reinforce, and no station anywhere claims
 * the machine "tries everything at once".
 */

export type QcProgram =
  | "bit" | "superposition" | "bloch" | "entangle"
  | "chandelier" | "cold" | "wiring" | "chip" | "platforms"
  | "compile" | "pulse" | "interference" | "readout"
  | "decoherence" | "qec" | "reality";

export interface QcSceneState {
  selectedId: string | null;
  highlightIds: string[];
  onSelect: (id: string | null) => void;
  labels: boolean;
  program: QcProgram | null;
  focusStepId?: string | null;
  glPower?: "high-performance" | "default";
}

interface Ctx extends Omit<QcSceneState, "highlightIds"> {
  highlight: Set<string>;
  attract: boolean;
}
const SceneCtx = createContext<Ctx | null>(null);
const useScene = () => useContext(SceneCtx)!;

/* Act accents, muted for the studio look (house palette, mirrors NnScene). */
const ACCENT: Record<string, string> = {
  physics: "#5f8cb0", machine: "#b39a6b", program: "#8b84ad", hard: "#79a68d",
};
const stationColor = (id: string) => ACCENT[qcStageById(id)?.act ?? "physics"];

/* ---------------------------------------------------------------- *
 *  Camera choreography
 * ---------------------------------------------------------------- */

const DEFAULT_POSE = { pos: [2.2, 5.4, 16.5] as const, look: [-0.2, 2.4, -0.5] as const };
const DEFAULT_POS_V = new THREE.Vector3(...DEFAULT_POSE.pos);
const CAM_POSES: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = {
  "q-bit":           { pos: [1.1, 2.6, 6.6],  look: [1.2, 1.6, 3.2] },
  "q-superposition": { pos: [6.6, 2.9, 3.6],  look: [6.9, 1.7, 0.3] },
  "q-collapse":      { pos: [6.6, 2.9, 3.6],  look: [6.9, 1.7, 0.3] },
  "q-bloch":         { pos: [3.8, 2.9, 6.6],  look: [3.9, 1.9, 3.2] },
  "q-entangle":      { pos: [6.9, 2.7, 6.6],  look: [6.9, 1.6, 3.4] },
  "q-chandelier":    { pos: [1.4, 3.9, 6.9],  look: [-3.2, 2.9, 0] },
  "q-cold":          { pos: [-4.9, 3.4, 3.0], look: [-6.9, 2.6, -1.2] },
  "q-wiring":        { pos: [-0.4, 3.3, 4.2], look: [-3.2, 2.7, 0] },
  "q-chip":          { pos: [-6.2, 1.9, 5.2], look: [-6.4, 1.15, 2.6] },
  "q-platforms":     { pos: [-6.2, 2.6, -1.7],look: [-6.6, 1.4, -4.6] },
  "q-compile":       { pos: [0.2, 3.0, -1.6], look: [0.2, 1.8, -4.6] },
  "q-pulse":         { pos: [2.9, 2.9, -1.6], look: [2.9, 1.7, -4.6] },
  "q-interference":  { pos: [5.7, 3.1, -1.4], look: [5.7, 1.6, -4.6] },
  "q-combine":       { pos: [5.7, 3.1, -1.4], look: [5.7, 1.6, -4.6] },
  "q-readout":       { pos: [8.3, 2.9, -1.6], look: [8.3, 1.7, -4.6] },
  "q-decoherence":   { pos: [-0.5, 3.2, -5.0],look: [-0.5, 1.6, -8.2] },
  "q-qec":           { pos: [3.4, 4.1, -4.9], look: [3.4, 0.9, -8.2] },
  "q-reality":       { pos: [7.0, 3.2, -5.0], look: [7.0, 1.8, -8.4] },
};

const STAGE_POSE: Record<string, { pos: readonly [number, number, number]; look: readonly [number, number, number] }> = (() => {
  const m: typeof CAM_POSES = {};
  for (const step of QC_JOURNEY) {
    const pose = CAM_POSES[step.id];
    if (pose && !m[step.stageId]) m[step.stageId] = pose;
  }
  return m;
})();

function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const ctx = useScene();
  const { camera } = useThree();
  const want = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  useEffect(() => {
    const key = ctx.focusStepId ?? null;
    const pose = key
      ? CAM_POSES[key] ?? DEFAULT_POSE
      : ctx.selectedId
        ? STAGE_POSE[ctx.selectedId] ?? null
        : null;
    want.current = pose
      ? { pos: new THREE.Vector3(...pose.pos), look: new THREE.Vector3(...pose.look) }
      : null;
  }, [ctx.focusStepId, ctx.selectedId]);
  useFrame(() => {
    const target = want.current;
    const ob = controls.current;
    if (!target || !ob) return;
    camera.position.lerp(target.pos, 0.055);
    ob.target.lerp(target.look, 0.055);
    ob.update();
    if (camera.position.distanceTo(target.pos) < 0.03) want.current = null;
  });
  return null;
}

/* ---------------------------------------------------------------- *
 *  Shared studio pieces
 * ---------------------------------------------------------------- */

function Plinth({ w, d, color }: { w: number; d: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[w, 0.18, d]} />
        <meshStandardMaterial color="#16181c" roughness={0.5} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.185, 0]}>
        <boxGeometry args={[w * 0.99, 0.012, d * 0.99]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Station({
  id, children, labelPos = [0, 1.35, 0], halo = [2.2, 2.2, 1.6], plinth, noHalo = false,
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
  const stage = qcStageById(id);
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
              background: lit ? color : "rgba(10,10,11,0.82)",
              border: `1px solid ${color}`,
              padding: "3px 8px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}
          >
            {stage.short}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Animated program clock: 0..1 sawtooth with a period, shared shape. */
function useLoop(period: number, active: boolean) {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!active) { t.current = 0; return; }
    t.current = (t.current + dt / period) % 1;
  });
  return t;
}

/* ---------------------------------------------------------------- *
 *  Act I set pieces
 * ---------------------------------------------------------------- */

/** A small Bloch sphere with a steerable state arrow. */
function MiniBloch({
  radius = 0.42, arrow, dim = false, color = "#5f8cb0",
}: { radius?: number; arrow: React.MutableRefObject<THREE.Group | null>; dim?: boolean; color?: string }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshStandardMaterial color="#20242b" roughness={0.35} metalness={0.3} transparent opacity={dim ? 0.35 : 0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.006, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={dim ? 0.2 : 0.55} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius, 0.006, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={dim ? 0.12 : 0.3} />
      </mesh>
      <group ref={(g) => { arrow.current = g; }}>
        <mesh position={[0, radius * 0.5, 0]}>
          <cylinderGeometry args={[0.016, 0.016, radius, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dim ? 0.15 : 0.8} />
        </mesh>
        <mesh position={[0, radius + 0.05, 0]}>
          <coneGeometry args={[0.05, 0.12, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dim ? 0.15 : 0.9} />
        </mesh>
      </group>
      <Text position={[0, radius + 0.22, 0]} fontSize={0.09} color="#c8cfd9" anchorX="center">|0⟩</Text>
      <Text position={[0, -radius - 0.2, 0]} fontSize={0.09} color="#c8cfd9" anchorX="center">|1⟩</Text>
    </group>
  );
}

/** Bit vs qubit: a lamp that snaps, a sphere that glides. */
function BitStation() {
  const ctx = useScene();
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const arrow = useRef<THREE.Group>(null);
  useFrame((state) => {
    const active = ctx.program === "bit" || ctx.selectedId === "bit";
    const t = state.clock.elapsedTime;
    if (lamp.current) {
      const on = Math.floor(t) % 2 === 0;
      lamp.current.emissiveIntensity = THREE.MathUtils.lerp(
        lamp.current.emissiveIntensity, active && on ? 1.6 : 0.08, 0.25);
    }
    if (arrow.current) {
      const th = active ? (Math.sin(t * 0.7) * 0.5 + 0.5) * Math.PI : 0.001;
      const ph = active ? t * 0.9 : 0;
      arrow.current.rotation.set(0, ph, th);
    }
  });
  return (
    <group position={[1.2, 0, 3.2]}>
      <Station id="bit" labelPos={[0, 2.15, 0]} halo={[2.4, 2.1, 1.4]} plinth={{ w: 2.2, d: 1.2 }}>
        <mesh position={[-0.62, 0.85, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 1.3, 12]} />
          <meshStandardMaterial color="#2a2f36" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[-0.62, 1.62, 0]}>
          <sphereGeometry args={[0.17, 18, 14]} />
          <meshStandardMaterial ref={lamp} color="#3b4048" emissive="#e8ddb5" emissiveIntensity={0.08} roughness={0.3} />
        </mesh>
        <Text position={[-0.62, 0.42, 0.62]} fontSize={0.085} color="#9aa0ab" anchorX="center">bit: 0 or 1</Text>
        <group position={[0.62, 1.25, 0]}>
          <MiniBloch arrow={arrow} />
        </group>
        <Text position={[0.62, 0.42, 0.62]} fontSize={0.085} color="#9aa0ab" anchorX="center">qubit: α|0⟩+β|1⟩</Text>
      </Station>
    </group>
  );
}

/** 4 qubits above, 16 amplitude bars below, one winner per measurement. */
function SuperpositionStation() {
  const ctx = useScene();
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const flash = useRef<THREE.MeshBasicMaterial>(null);
  const loop = useLoop(6, true);
  // deterministic pseudo-amplitudes with a stable winner sequence
  const AMP = useMemo(() => Array.from({ length: 16 }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 2.399 + 1))), []);
  useFrame((state) => {
    const active = ctx.program === "superposition" || ctx.selectedId === "superposition";
    const t = state.clock.elapsedTime;
    const phase = loop.current; // 0..1: 0-0.7 breathe, 0.7-0.78 collapse, then rebuild
    const winner = Math.floor(t / 6) % 16;
    bars.current.forEach((m, i) => {
      if (!m) return;
      let h;
      if (!active) h = AMP[i] * 0.5;
      else if (phase < 0.7) h = AMP[i] * (0.5 + 0.12 * Math.sin(t * 2 + i));
      else if (phase < 0.86) h = i === winner ? 1.35 : 0.03;
      else h = THREE.MathUtils.lerp(i === winner ? 1.35 : 0.03, AMP[i] * 0.5, (phase - 0.86) / 0.14);
      m.scale.y = THREE.MathUtils.lerp(m.scale.y, h, 0.2);
      m.position.y = 0.42 + m.scale.y / 2;
    });
    if (flash.current) {
      const target = active && phase >= 0.7 && phase < 0.78 ? 0.5 : 0;
      flash.current.opacity = THREE.MathUtils.lerp(flash.current.opacity, target, 0.3);
    }
  });
  return (
    <group position={[6.9, 0, 0.3]}>
      <Station id="superposition" labelPos={[0, 2.5, 0]} halo={[2.7, 2.5, 1.6]} plinth={{ w: 2.5, d: 1.3 }}>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} ref={(m) => { bars.current[i] = m; }} position={[-1.05 + i * 0.14, 0.6, 0]} scale={[1, 0.4, 1]}>
            <boxGeometry args={[0.09, 1, 0.09]} />
            <meshStandardMaterial color="#5f8cb0" emissive="#5f8cb0" emissiveIntensity={0.5} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 1.1, -0.35]}>
          <planeGeometry args={[2.5, 1.9]} />
          <meshBasicMaterial ref={flash} color="#dbe6f2" transparent opacity={0} depthWrite={false} />
        </mesh>
        <Text position={[0, 2.12, 0]} fontSize={0.1} color="#c8cfd9" anchorX="center">4 qubits → 2⁴ = 16 amplitudes</Text>
        <Text position={[0, 0.32, 0.72]} fontSize={0.08} color="#9aa0ab" anchorX="center">measurement returns ONE outcome</Text>
      </Station>
    </group>
  );
}

/** The big Bloch globe running an H, X, Z gate loop. */
function BlochStation() {
  const ctx = useScene();
  const arrow = useRef<THREE.Group>(null);
  const gateText = useRef("H");
  const [gateLabel, setGateLabel] = useState("H: pole → equator");
  useFrame((state) => {
    if (!arrow.current) return;
    const active = ctx.program === "bloch" || ctx.selectedId === "bloch";
    if (!active) {
      arrow.current.rotation.set(0, 0, THREE.MathUtils.lerp(arrow.current.rotation.z, 0.001, 0.08));
      return;
    }
    const t = state.clock.elapsedTime % 9;
    let theta = 0.001, phi = 0, label = gateText.current;
    if (t < 3) { const k = Math.min(1, t / 1.2); theta = (k * Math.PI) / 2; phi = 0; label = "H: pole → equator"; }
    else if (t < 6) { const k = Math.min(1, (t - 3) / 1.2); theta = Math.PI / 2 + (k * Math.PI) / 2; phi = 0; label = "X: flip through"; }
    else { const k = Math.min(1, (t - 6) / 1.6); theta = Math.PI / 2; phi = k * Math.PI * 1.5; label = "Z: spin the phase"; }
    if (t >= 6 && t < 6.1) { /* re-enter equator */ }
    arrow.current.rotation.set(0, phi, t < 6 ? theta : Math.PI / 2);
    if (label !== gateText.current) { gateText.current = label; setGateLabel(label); }
  });
  return (
    <group position={[3.9, 0, 3.2]}>
      <Station id="bloch" labelPos={[0, 2.6, 0]} halo={[2.3, 2.6, 1.8]} plinth={{ w: 2.0, d: 1.5 }}>
        <group position={[0, 1.45, 0]} scale={1.9}>
          <MiniBloch arrow={arrow} />
        </group>
        <Text position={[0, 0.34, 0.85]} fontSize={0.09} color="#9aa0ab" anchorX="center">{gateLabel}</Text>
      </Station>
    </group>
  );
}

/** Bell pair: two dim spheres, one bond, meters that always agree. */
function EntangleStation() {
  const ctx = useScene();
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const bond = useRef<THREE.MeshBasicMaterial>(null);
  const mA = useRef<THREE.MeshStandardMaterial>(null);
  const mB = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const active = ctx.program === "entangle" || ctx.selectedId === "entangle";
    const t = state.clock.elapsedTime;
    const outcome = Math.floor(t / 2.4) % 2 === 0; // both 0 or both 1, together
    const settle = (t % 2.4) < 0.5;
    if (bond.current) bond.current.opacity = THREE.MathUtils.lerp(bond.current.opacity, active ? 0.75 : 0.2, 0.1);
    for (const [g, m] of [[a, mA], [b, mB]] as const) {
      if (g.current) {
        const th = active ? (settle ? (outcome ? Math.PI : 0.001) : Math.PI / 2) : 0.001;
        g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, th, 0.15);
      }
      if (m.current) {
        m.current.emissiveIntensity = THREE.MathUtils.lerp(
          m.current.emissiveIntensity, active && settle ? 1.4 : 0.15, 0.2);
        m.current.color.set(active && settle ? (outcome ? "#b0755f" : "#5f8cb0") : "#3b4048");
        m.current.emissive.copy(m.current.color);
      }
    }
  });
  return (
    <group position={[6.9, 0, 3.4]}>
      <Station id="entangle" labelPos={[0, 2.3, 0]} halo={[2.8, 2.3, 1.5]} plinth={{ w: 2.6, d: 1.2 }}>
        <group position={[-0.75, 1.3, 0]}><MiniBloch arrow={a} dim /></group>
        <group position={[0.75, 1.3, 0]}><MiniBloch arrow={b} dim /></group>
        <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshBasicMaterial ref={bond} color="#8fb4d4" transparent opacity={0.2} />
        </mesh>
        <mesh position={[-0.75, 0.52, 0.4]}>
          <boxGeometry args={[0.34, 0.16, 0.06]} />
          <meshStandardMaterial ref={mA} color="#3b4048" emissive="#3b4048" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0.75, 0.52, 0.4]}>
          <boxGeometry args={[0.34, 0.16, 0.06]} />
          <meshStandardMaterial ref={mB} color="#3b4048" emissive="#3b4048" emissiveIntensity={0.15} />
        </mesh>
        <Text position={[0, 0.3, 0.7]} fontSize={0.08} color="#9aa0ab" anchorX="center">(|00⟩+|11⟩)/√2 · meters always agree</Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Act II: the dilution refrigerator
 * ---------------------------------------------------------------- */

const FRIDGE_X = -3.2;
/** [y, radius, temp label, plate name] top to bottom. */
const PLATES: [number, number, string, string][] = [
  [5.35, 1.4, "300 K", "top plate"],
  [4.55, 1.26, "50 K", ""],
  [3.8, 1.14, "4 K", ""],
  [3.05, 1.0, "~0.9 K", "still"],
  [2.35, 0.9, "~0.1 K", "cold plate"],
  [1.68, 0.8, "~15 mK", "mixing chamber"],
];

/** Points a drive pulse follows: down the fridge on the -z side. */
const DRIVE_PATH: THREE.Vector3[] = (() => {
  const pts: THREE.Vector3[] = [new THREE.Vector3(FRIDGE_X - 0.55, 6.1, -0.55)];
  for (const [y, r] of PLATES) pts.push(new THREE.Vector3(FRIDGE_X - r * 0.55, y - 0.06, -r * 0.55));
  pts.push(new THREE.Vector3(FRIDGE_X - 0.2, 1.0, -0.2));
  pts.push(new THREE.Vector3(FRIDGE_X, 0.8, 0));
  return pts;
})();
/** Readout return path: up the +z side, via TWPA (MXC) and HEMT (4 K). */
const READ_PATH: THREE.Vector3[] = (() => {
  const pts: THREE.Vector3[] = [new THREE.Vector3(FRIDGE_X, 0.8, 0), new THREE.Vector3(FRIDGE_X + 0.25, 1.05, 0.25)];
  for (let i = PLATES.length - 1; i >= 0; i--) {
    const [y, r] = PLATES[i];
    pts.push(new THREE.Vector3(FRIDGE_X + r * 0.55, y + 0.06, r * 0.55));
  }
  pts.push(new THREE.Vector3(FRIDGE_X + 0.55, 6.1, 0.55));
  return pts;
})();

function pathPoint(path: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const f = THREE.MathUtils.clamp(t, 0, 0.9999) * (path.length - 1);
  const i = Math.floor(f);
  out.lerpVectors(path[i], path[i + 1], f - i);
  return out;
}

function Chandelier() {
  const ctx = useScene();
  const driveDot = useRef<THREE.Mesh>(null);
  const driveMat = useRef<THREE.MeshBasicMaterial>(null);
  const readDot = useRef<THREE.Mesh>(null);
  const readMat = useRef<THREE.MeshBasicMaterial>(null);
  const sweep = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const loop = useLoop(7, true);
  const plateGlow = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const driveGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(
    new THREE.CatmullRomCurve3(DRIVE_PATH).getPoints(80)), []);
  const readGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(
    new THREE.CatmullRomCurve3(READ_PATH).getPoints(80)), []);

  useFrame((state) => {
    const p = ctx.program;
    const wiring = p === "wiring" || ctx.selectedId === "wiring" || p === "pulse";
    const t = loop.current;
    // drive pulse: first half of the loop, dimming as it descends
    if (driveDot.current && driveMat.current) {
      const k = THREE.MathUtils.clamp(t * 2.2, 0, 1);
      pathPoint(DRIVE_PATH, k, tmp);
      driveDot.current.position.copy(tmp);
      driveDot.current.visible = wiring && t < 0.5;
      driveMat.current.opacity = wiring ? 1 - k * 0.72 : 0;
      driveDot.current.scale.setScalar(1 - k * 0.55);
    }
    // readout echo: second half, brightening at TWPA then HEMT
    if (readDot.current && readMat.current) {
      const k = THREE.MathUtils.clamp((t - 0.5) * 2.2, 0, 1);
      pathPoint(READ_PATH, k, tmp);
      readDot.current.position.copy(tmp);
      readDot.current.visible = wiring && t >= 0.5;
      const gain = k < 0.22 ? 0.3 : k < 0.75 ? 0.65 : 1.0; // TWPA then HEMT steps
      readMat.current.opacity = wiring ? gain : 0;
      readDot.current.scale.setScalar(0.5 + gain * 0.8);
    }
    // chandelier program: highlight sweep down the plates
    const sweeping = p === "chandelier" || ctx.selectedId === "chandelier";
    plateGlow.current.forEach((m, i) => {
      if (!m) return;
      let target = 0.12;
      if (sweeping) {
        const phase = (state.clock.elapsedTime * 0.6) % PLATES.length;
        target = Math.abs(phase - i) < 0.6 ? 0.85 : 0.12;
      }
      if (p === "cold" || ctx.selectedId === "cold") {
        const phase = (state.clock.elapsedTime * 0.5) % PLATES.length;
        target = Math.abs(phase - i) < 0.6 ? 0.85 : 0.12;
      }
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, target, 0.1);
    });
    if (sweep.current) {
      sweep.current.opacity = THREE.MathUtils.lerp(sweep.current.opacity, sweeping ? 0.06 : 0.03, 0.05);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <Station id="chandelier" labelPos={[FRIDGE_X, 6.5, 0]} halo={[3.4, 6.4, 3.4]} noHalo>
        <group position={[FRIDGE_X, 0, 0]}>
          {/* outer vacuum can, ghosted */}
          <mesh position={[0, 3.0, 0]}>
            <cylinderGeometry args={[1.72, 1.72, 5.9, 40, 1, true]} />
            <meshBasicMaterial ref={sweep} color="#aab6c4" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* plates + rods + per-plate attenuator barrels */}
          {PLATES.map(([y, r, temp, name], i) => (
            <group key={i}>
              <mesh position={[0, y, 0]}>
                <cylinderGeometry args={[r, r, 0.07, 40]} />
                <meshStandardMaterial
                  ref={(m) => { plateGlow.current[i] = m; }}
                  color="#c9a86a" emissive="#c9a86a" emissiveIntensity={0.12}
                  roughness={0.32} metalness={0.9}
                />
              </mesh>
              {i < PLATES.length - 1 && [0, 2.1, 4.2].map((a) => (
                <mesh key={a} position={[Math.cos(a) * (PLATES[i + 1][1] * 0.8), (y + PLATES[i + 1][0]) / 2, Math.sin(a) * (PLATES[i + 1][1] * 0.8)]}>
                  <cylinderGeometry args={[0.028, 0.028, y - PLATES[i + 1][0] - 0.07, 8]} />
                  <meshStandardMaterial color="#8f9aa6" roughness={0.4} metalness={0.8} />
                </mesh>
              ))}
              {i > 0 && (
                <mesh position={[-r * 0.55, y + 0.14, -r * 0.55]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.22, 10]} />
                  <meshStandardMaterial color="#a88f5e" roughness={0.35} metalness={0.85} />
                </mesh>
              )}
              <Text position={[r + 0.32, y, 0]} fontSize={0.11} color="#c8cfd9" anchorX="left">{temp}</Text>
              {name !== "" && (
                <Text position={[r + 0.32, y - 0.16, 0]} fontSize={0.07} color="#9aa0ab" anchorX="left">{name}</Text>
              )}
            </group>
          ))}
          {/* pulse tube on top */}
          <mesh position={[0.5, 5.95, 0.3]}>
            <cylinderGeometry args={[0.16, 0.16, 1.0, 14]} />
            <meshStandardMaterial color="#4a515b" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* HEMT at 4 K, TWPA + circulators at MXC */}
          <mesh position={[0.62, 3.62, 0.62]}>
            <boxGeometry args={[0.3, 0.18, 0.2]} />
            <meshStandardMaterial color="#5c6670" roughness={0.35} metalness={0.75} />
          </mesh>
          <Text position={[1.0, 3.62, 0.66]} fontSize={0.07} color="#9aa0ab" anchorX="left">HEMT +40 dB</Text>
          <mesh position={[0.5, 1.5, 0.5]}>
            <boxGeometry args={[0.34, 0.1, 0.14]} />
            <meshStandardMaterial color="#6b6154" roughness={0.35} metalness={0.8} />
          </mesh>
          <Text position={[0.88, 1.5, 0.55]} fontSize={0.07} color="#9aa0ab" anchorX="left">TWPA +20-30 dB</Text>
          {[0, 1].map((i) => (
            <mesh key={i} position={[0.3 + i * 0.18, 1.32, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
              <meshStandardMaterial color="#41474f" roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
          {/* magnetic shield can + chip inside */}
          <mesh position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 1.15, 28, 1, true]} />
            <meshStandardMaterial color="#39404a" roughness={0.45} metalness={0.7} transparent opacity={0.45} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.78, 0]} rotation={[-0.35, 0.6, 0]}>
            <boxGeometry args={[0.34, 0.02, 0.34]} />
            <meshStandardMaterial color="#1b2b4a" roughness={0.2} metalness={0.6} emissive="#2c4a7a" emissiveIntensity={0.5} />
          </mesh>
          {/* drive + readout lines */}
          <primitive object={new THREE.Line(driveGeo, new THREE.LineBasicMaterial({ color: "#7d8aa0", transparent: true, opacity: 0.5 }))} />
          <primitive object={new THREE.Line(readGeo, new THREE.LineBasicMaterial({ color: "#a08f6b", transparent: true, opacity: 0.5 }))} />
          <mesh ref={driveDot} visible={false}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshBasicMaterial ref={driveMat} color="#dbe6f2" transparent opacity={0} />
          </mesh>
          <mesh ref={readDot} visible={false}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshBasicMaterial ref={readMat} color="#e8d9ae" transparent opacity={0} />
          </mesh>
        </group>
      </Station>
      {/* wiring + cold are selectable sub-stations of the same tower */}
      <group position={[FRIDGE_X - 1.1, 0, -1.6]}>
        <Station id="wiring" labelPos={[0, 0.85, 0]} halo={[1.2, 0.9, 1.0]} noHalo plinth={{ w: 1.0, d: 0.8 }}>
          <Text position={[0, 0.5, 0]} fontSize={0.085} color="#9aa0ab" anchorX="center">−60 dB ↓ · ~+60 dB ↑</Text>
        </Station>
      </group>
    </group>
  );
}

/** Temperature ladder billboard. */
function ColdStation() {
  return (
    <group position={[-6.9, 0, -1.2]}>
      <Station id="cold" labelPos={[0, 3.15, 0]} halo={[2.1, 3.1, 1.1]} plinth={{ w: 1.9, d: 0.9 }}>
        {PLATES.map(([, , temp], i) => (
          <group key={i} position={[0, 2.62 - i * 0.42, 0]}>
            <mesh position={[-0.35, 0, 0]}>
              <boxGeometry args={[0.9 - i * 0.11, 0.09, 0.06]} />
              <meshStandardMaterial color="#c9a86a" emissive="#c9a86a" emissiveIntensity={0.25 + i * 0.1} roughness={0.4} metalness={0.7} />
            </mesh>
            <Text position={[0.45, 0, 0]} fontSize={0.1} color="#c8cfd9" anchorX="left">{temp}</Text>
          </group>
        ))}
        <Text position={[0, 0.28, 0.5]} fontSize={0.075} color="#9aa0ab" anchorX="center">deep space: 2.7 K · base plate ~150x colder</Text>
      </Station>
    </group>
  );
}

/** The transmon die, blown up to visible size. */
function ChipStation() {
  const ctx = useScene();
  const jj = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (!jj.current) return;
    const active = ctx.program === "chip" || ctx.selectedId === "chip";
    jj.current.emissiveIntensity = active ? 1.2 + Math.sin(state.clock.elapsedTime * 6) * 0.7 : 0.25;
  });
  const cross = (x: number, z: number, key: string) => (
    <group key={key} position={[x, 0.53, z]}>
      <mesh><boxGeometry args={[0.5, 0.015, 0.14]} /><meshStandardMaterial color="#aeb6c0" roughness={0.25} metalness={0.9} /></mesh>
      <mesh><boxGeometry args={[0.14, 0.015, 0.5]} /><meshStandardMaterial color="#aeb6c0" roughness={0.25} metalness={0.9} /></mesh>
    </group>
  );
  return (
    <group position={[-6.4, 0, 2.6]}>
      <Station id="chip" labelPos={[0, 1.75, 0]} halo={[2.2, 1.7, 1.9]} plinth={{ w: 2.0, d: 1.7 }}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.7, 0.06, 1.4]} />
          <meshStandardMaterial color="#1b2b4a" roughness={0.15} metalness={0.5} />
        </mesh>
        {cross(-0.4, -0.25, "q1")}
        {cross(0.42, 0.18, "q2")}
        {/* Josephson junction spark on q1 */}
        <mesh position={[-0.4, 0.55, -0.25]}>
          <boxGeometry args={[0.05, 0.02, 0.05]} />
          <meshStandardMaterial ref={jj} color="#e8d9ae" emissive="#e8d9ae" emissiveIntensity={0.25} />
        </mesh>
        {/* readout resonator meander */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.15 + i * 0.11, 0.535, 0.5 - (i % 2) * 0.1]}>
            <boxGeometry args={[0.1, 0.012, 0.03]} />
            <meshStandardMaterial color="#8fb4d4" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        <Text position={[0, 0.34, 0.86]} fontSize={0.08} color="#9aa0ab" anchorX="center">transmon: Al/AlOx/Al junction + shunt capacitor</Text>
      </Station>
    </group>
  );
}

/** Ion trap + tweezer array minis. */
function PlatformsStation() {
  const ctx = useScene();
  const ions = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const atoms = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const active = ctx.program === "platforms" || ctx.selectedId === "platforms";
    const t = state.clock.elapsedTime;
    ions.current.forEach((m, i) => {
      if (!m) return;
      const pair = Math.floor(t / 1.6) % 4;
      const lit = active && (i === pair || i === pair + 1);
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, lit ? 1.6 : 0.5, 0.2);
    });
    atoms.current.forEach((m, i) => {
      if (!m) return;
      // two atoms swap places on a loop: rearrangeable geometry
      if (active && (i === 5 || i === 10)) {
        const k = (Math.sin(t * 1.2) + 1) / 2;
        const a: [number, number] = [(5 % 4) * 0.22, Math.floor(5 / 4) * 0.22];
        const b: [number, number] = [(10 % 4) * 0.22, Math.floor(10 / 4) * 0.22];
        const from = i === 5 ? a : b, to = i === 5 ? b : a;
        m.position.x = -0.33 + THREE.MathUtils.lerp(from[0], to[0], k);
        m.position.z = -0.33 + THREE.MathUtils.lerp(from[1], to[1], k);
      }
    });
  });
  return (
    <group position={[-6.6, 0, -4.6]}>
      <Station id="platforms" labelPos={[0, 2.05, 0]} halo={[2.9, 2.0, 1.6]} plinth={{ w: 2.7, d: 1.4 }}>
        {/* ion trap: two gold blade electrodes, ion chain between */}
        <group position={[-0.75, 0, 0]}>
          <mesh position={[0, 0.75, -0.16]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[1.1, 0.05, 0.22]} />
            <meshStandardMaterial color="#c9a86a" roughness={0.3} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.75, 0.16]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[1.1, 0.05, 0.22]} />
            <meshStandardMaterial color="#c9a86a" roughness={0.3} metalness={0.9} />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[-0.4 + i * 0.2, 0.75, 0]}>
              <sphereGeometry args={[0.045, 12, 10]} />
              <meshStandardMaterial ref={(m) => { ions.current[i] = m; }} color="#8fb4d4" emissive="#8fb4d4" emissiveIntensity={0.5} />
            </mesh>
          ))}
          <Text position={[0, 0.32, 0.5]} fontSize={0.07} color="#9aa0ab" anchorX="center">trapped ions · &gt;99.9% fidelity</Text>
        </group>
        {/* tweezer array: 4x4 atoms on faint beams */}
        <group position={[0.75, 0, 0]}>
          {Array.from({ length: 16 }, (_, i) => (
            <group key={i}>
              <mesh position={[-0.33 + (i % 4) * 0.22, 0.62, -0.33 + Math.floor(i / 4) * 0.22]}>
                <cylinderGeometry args={[0.008, 0.02, 0.55, 6]} />
                <meshBasicMaterial color="#79a68d" transparent opacity={0.25} />
              </mesh>
              <mesh
                ref={(m) => { atoms.current[i] = m; }}
                position={[-0.33 + (i % 4) * 0.22, 0.9, -0.33 + Math.floor(i / 4) * 0.22]}
              >
                <sphereGeometry args={[0.035, 10, 8]} />
                <meshStandardMaterial color="#a9d4bd" emissive="#a9d4bd" emissiveIntensity={0.7} />
              </mesh>
            </group>
          ))}
          <Text position={[0, 0.32, 0.5]} fontSize={0.07} color="#9aa0ab" anchorX="center">neutral atoms · 1,000+ traps</Text>
        </group>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Act III set pieces
 * ---------------------------------------------------------------- */

function CompileStation() {
  const ctx = useScene();
  const boards = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame((state) => {
    const active = ctx.program === "compile" || ctx.selectedId === "compile";
    const step = Math.floor(state.clock.elapsedTime / 1.4) % 3;
    boards.current.forEach((m, i) => {
      if (!m) return;
      m.opacity = THREE.MathUtils.lerp(m.opacity, active && i === step ? 0.28 : 0.08, 0.15);
    });
  });
  const board = (x: number, title: string, sub: string, i: number) => (
    <group key={i} position={[x, 1.15, 0]}>
      <mesh>
        <planeGeometry args={[0.95, 1.3]} />
        <meshStandardMaterial color="#171a1f" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.95, 1.3]} />
        <meshBasicMaterial ref={(m) => { boards.current[i] = m; }} color="#8b84ad" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <Text position={[0, 0.5, 0.01]} fontSize={0.085} color="#c8cfd9" anchorX="center">{title}</Text>
      <Text position={[0, -0.52, 0.01]} fontSize={0.062} color="#9aa0ab" anchorX="center" maxWidth={0.85} textAlign="center">{sub}</Text>
      {/* three qubit wires with gate boxes */}
      {[0.22, 0.02, -0.18].map((y, w) => (
        <group key={w}>
          <mesh position={[0, y, 0.01]}><boxGeometry args={[0.8, 0.008, 0.001]} /><meshBasicMaterial color="#5d6672" /></mesh>
          <mesh position={[-0.2 + w * 0.18, y, 0.012]}><boxGeometry args={[0.09, 0.09, 0.001]} /><meshBasicMaterial color="#8b84ad" /></mesh>
        </group>
      ))}
    </group>
  );
  return (
    <group position={[0.2, 0, -4.6]}>
      <Station id="compile" labelPos={[0, 2.25, 0]} halo={[3.4, 2.2, 1.2]} plinth={{ w: 3.3, d: 1.0 }}>
        {board(-1.1, "circuit", "your algorithm", 0)}
        {board(0, "native gates", "rotations + CZ, SWAPs inserted", 1)}
        {board(1.1, "pulse schedule", "nanosecond timing", 2)}
      </Station>
    </group>
  );
}

function PulseStation() {
  const ctx = useScene();
  const wave = useRef<THREE.Line | null>(null);
  const arrow = useRef<THREE.Group>(null);
  const N = 60;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, []);
  useFrame((state) => {
    const active = ctx.program === "pulse" || ctx.selectedId === "pulse";
    const t = (state.clock.elapsedTime * 0.45) % 1;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const x = -1.0 + (i / (N - 1)) * 1.5;
      const center = -1.0 + t * 2.0;
      const env = Math.exp(-Math.pow((x - center) / 0.16, 2));
      const y = active ? env * Math.sin((x - center) * 60) * 0.22 : 0;
      pos.setXYZ(i, x, 1.05 + y + env * 0.1, 0);
    }
    pos.needsUpdate = true;
    if (arrow.current) {
      const hit = THREE.MathUtils.clamp((t - 0.62) / 0.3, 0, 1);
      arrow.current.rotation.z = active ? hit * Math.PI : 0.001;
    }
  });
  return (
    <group position={[2.9, 0, -4.6]}>
      <Station id="pulse" labelPos={[0, 2.25, 0]} halo={[2.6, 2.2, 1.2]} plinth={{ w: 2.4, d: 1.0 }}>
        <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#c3bbdd" }))} ref={wave} />
        <group position={[0.85, 1.15, 0]} scale={0.85}>
          <MiniBloch arrow={arrow} color="#8b84ad" />
        </group>
        <Text position={[0, 0.34, 0.55]} fontSize={0.08} color="#9aa0ab" anchorX="center">~20 ns shaped pulse = one exact rotation</Text>
      </Station>
    </group>
  );
}

/** The heart: two outcomes, waves cancel at one and reinforce at the other. */
function InterferenceStation() {
  const ctx = useScene();
  const N = 70;
  const geos = useMemo(() => [0, 1].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }), []);
  const pylons = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const active = ctx.program === "interference" || ctx.selectedId === "interference";
    const t = state.clock.elapsedTime;
    // two waves into the WRONG pylon (out of phase), two into the RIGHT (in phase)
    for (const [gi, g] of geos.entries()) {
      const pos = g.attributes.position as THREE.BufferAttribute;
      const targetX = gi === 0 ? -0.62 : 0.62;
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1);
        const x = THREE.MathUtils.lerp(-1.05, targetX, k);
        const base = 1.35 - k * 0.35;
        // both paths carry two components; wrong side has opposite phases
        const w1 = Math.sin(k * 22 - t * 4);
        const w2 = Math.sin(k * 22 - t * 4 + (gi === 0 ? Math.PI : 0));
        const amp = active ? (w1 + w2) * 0.075 * (1 - k * 0.3) : 0;
        pos.setXYZ(i, x, base + amp, 0);
      }
      pos.needsUpdate = true;
    }
    pylons.current.forEach((m, i) => {
      if (!m) return;
      const h = !active ? 0.3 : i === 0
        ? 0.06
        : 0.3 + ((Math.sin(t * 1.2) + 1) / 2) * 0.9;
      m.scale.y = THREE.MathUtils.lerp(m.scale.y, h, 0.08);
      m.position.y = 0.42 + m.scale.y / 2;
    });
  });
  return (
    <group position={[5.7, 0, -4.6]}>
      <Station id="interference" labelPos={[0, 2.35, 0]} halo={[2.6, 2.3, 1.2]} plinth={{ w: 2.4, d: 1.0 }}>
        {geos.map((g, i) => (
          <primitive key={i} object={new THREE.Line(g, new THREE.LineBasicMaterial({ color: i === 0 ? "#a08f6b" : "#a9d4bd", transparent: true, opacity: 0.9 }))} />
        ))}
        {[0, 1].map((i) => (
          <mesh key={i} ref={(m) => { pylons.current[i] = m; }} position={[i === 0 ? -0.62 : 0.62, 0.55, 0]} scale={[1, 0.3, 1]}>
            <boxGeometry args={[0.24, 1, 0.24]} />
            <meshStandardMaterial
              color={i === 0 ? "#6b6154" : "#79a68d"}
              emissive={i === 0 ? "#6b6154" : "#79a68d"}
              emissiveIntensity={i === 0 ? 0.25 : 0.8}
              roughness={0.4}
            />
          </mesh>
        ))}
        <Text position={[-0.62, 0.3, 0.35]} fontSize={0.07} color="#9aa0ab" anchorX="center">wrong: cancels</Text>
        <Text position={[0.62, 0.3, 0.35]} fontSize={0.07} color="#9aa0ab" anchorX="center">right: reinforces</Text>
        <Text position={[0, 2.02, 0]} fontSize={0.09} color="#c8cfd9" anchorX="center">interference IS the computation</Text>
      </Station>
    </group>
  );
}

/** IQ plane: shots landing in two clouds. */
function ReadoutStation() {
  const ctx = useScene();
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const M = 26;
  const targets = useMemo(() => Array.from({ length: M }, (_, i) => {
    const zero = i % 2 === 0;
    const h1 = Math.sin(i * 12.9898) * 43758.5453, h2 = Math.sin(i * 78.233) * 12543.21;
    const jx = (h1 - Math.floor(h1) - 0.5) * 0.3, jy = (h2 - Math.floor(h2) - 0.5) * 0.3;
    return { x: (zero ? -0.42 : 0.42) + jx, y: 1.25 + jy, zero };
  }), []);
  useFrame((state) => {
    const active = ctx.program === "readout" || ctx.selectedId === "readout";
    const t = state.clock.elapsedTime;
    dots.current.forEach((m, i) => {
      if (!m) return;
      const born = active && (t % 8) > i * 0.28;
      const s = born ? 1 : 0.001;
      m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, s, 0.2));
    });
  });
  return (
    <group position={[8.3, 0, -4.6]}>
      <Station id="readout" labelPos={[0, 2.3, 0]} halo={[2.3, 2.25, 1.1]} plinth={{ w: 2.1, d: 0.9 }}>
        <mesh position={[0, 1.25, -0.02]}>
          <planeGeometry args={[1.7, 1.35]} />
          <meshStandardMaterial color="#14171b" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.25, -0.01]}>
          <boxGeometry args={[0.006, 1.3, 0.001]} />
          <meshBasicMaterial color="#5d6672" />
        </mesh>
        {targets.map((p, i) => (
          <mesh key={i} ref={(m) => { dots.current[i] = m; }} position={[p.x, p.y, 0]} scale={0.001}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial
              color={p.zero ? "#8fb4d4" : "#c9a86a"}
              emissive={p.zero ? "#8fb4d4" : "#c9a86a"}
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}
        <Text position={[-0.42, 0.44, 0.05]} fontSize={0.08} color="#8fb4d4" anchorX="center">|0⟩ cloud</Text>
        <Text position={[0.42, 0.44, 0.05]} fontSize={0.08} color="#c9a86a" anchorX="center">|1⟩ cloud</Text>
        <Text position={[0, 0.26, 0.4]} fontSize={0.07} color="#9aa0ab" anchorX="center">dispersive shift ±χ · ~99% fidelity</Text>
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Act IV set pieces
 * ---------------------------------------------------------------- */

function DecoherenceStation() {
  const ctx = useScene();
  const t1 = useRef<THREE.Mesh>(null);
  const t2 = useRef<THREE.Mesh>(null);
  const arrow = useRef<THREE.Group>(null);
  const noise = useRef<THREE.Group>(null);
  useFrame((state) => {
    const active = ctx.program === "decoherence" || ctx.selectedId === "decoherence";
    const cycle = (state.clock.elapsedTime % 6) / 6;
    const drainT2 = active ? Math.max(0.04, 1 - cycle * 1.8) : 0.85; // T2 drains faster
    const drainT1 = active ? Math.max(0.04, 1 - cycle) : 0.85;
    if (t1.current) { t1.current.scale.y = drainT1; t1.current.position.y = 0.45 + drainT1 * 0.75; }
    if (t2.current) { t2.current.scale.y = drainT2; t2.current.position.y = 0.45 + drainT2 * 0.75; }
    if (arrow.current) {
      const shrink = active ? Math.max(0.15, 1 - cycle) : 1;
      arrow.current.scale.setScalar(shrink);
      arrow.current.rotation.y += active ? 0.12 * (1 - cycle) : 0.01;
      arrow.current.rotation.z = Math.PI / 2.6;
    }
    if (noise.current) {
      noise.current.rotation.y = state.clock.elapsedTime * (active ? 1.4 : 0.3);
      noise.current.visible = true;
    }
  });
  return (
    <group position={[-0.5, 0, -8.2]}>
      <Station id="decoherence" labelPos={[0, 2.5, 0]} halo={[2.7, 2.45, 1.4]} plinth={{ w: 2.5, d: 1.2 }}>
        <group position={[-0.75, 1.35, 0]} scale={0.95}>
          <MiniBloch arrow={arrow} color="#79a68d" />
          <group ref={noise}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[Math.cos(i * 2.1) * 0.62, Math.sin(i * 1.7) * 0.3, Math.sin(i * 2.1) * 0.62]}>
                <sphereGeometry args={[0.03, 8, 6]} />
                <meshBasicMaterial color="#b0755f" />
              </mesh>
            ))}
          </group>
        </group>
        {[
          { ref: t1, x: 0.45, label: "T1", color: "#c9a86a" },
          { ref: t2, x: 0.95, label: "T2", color: "#8b84ad" },
        ].map((b) => (
          <group key={b.label}>
            <mesh position={[b.x, 1.2, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 1.55, 12, 1, true]} />
              <meshStandardMaterial color="#3a4149" transparent opacity={0.25} side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={b.ref} position={[b.x, 1.2, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 1.5, 10]} />
              <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.6} />
            </mesh>
            <Text position={[b.x, 0.28, 0.3]} fontSize={0.08} color="#9aa0ab" anchorX="center">{b.label}</Text>
          </group>
        ))}
        <Text position={[0, 2.15, 0]} fontSize={0.085} color="#c8cfd9" anchorX="center">~100 µs coherence · ~30 ns gates</Text>
      </Station>
    </group>
  );
}

/** Surface-code grid: error flash, syndrome, decode sweep. */
function QecStation() {
  const ctx = useScene();
  const cells = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const G = 5;
  useFrame((state) => {
    const active = ctx.program === "qec" || ctx.selectedId === "qec";
    const t = state.clock.elapsedTime % 4;
    const seed = Math.floor(state.clock.elapsedTime / 4);
    const h = Math.abs(Math.sin(seed * 127.1) * 43758.5453);
    const errIdx = Math.floor((h - Math.floor(h)) * G * G);
    const er = Math.floor(errIdx / G), ec = errIdx % G;
    cells.current.forEach((m, i) => {
      if (!m) return;
      const r = Math.floor(i / G), c = i % G;
      const isData = (r + c) % 2 === 0;
      let color = isData ? "#3f4854" : "#2a2f36";
      let glow = 0.15;
      if (active) {
        const isErr = i === errIdx;
        const isNeighbor = Math.abs(r - er) + Math.abs(c - ec) === 1;
        if (t < 1.2 && isErr) { color = "#b0755f"; glow = 1.4; }
        else if (t >= 1.2 && t < 2.4 && isNeighbor && !isData) { color = "#c9a86a"; glow = 1.2; }
        else if (t >= 2.4 && t < 3.4) { color = "#79a68d"; glow = 0.5 + Math.max(0, 1 - Math.abs(t - 2.7) * 2); }
      }
      m.color.set(color);
      m.emissive.set(color);
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, glow, 0.25);
    });
  });
  return (
    <group position={[3.4, 0, -8.2]}>
      <Station id="qec" labelPos={[0, 2.05, 0]} halo={[2.6, 2.0, 2.2]} plinth={{ w: 2.4, d: 2.0 }}>
        {Array.from({ length: G * G }, (_, i) => {
          const r = Math.floor(i / G), c = i % G;
          return (
            <mesh key={i} position={[-0.72 + c * 0.36, 0.32, -0.72 + r * 0.36]}>
              <boxGeometry args={[0.28, 0.1, 0.28]} />
              <meshStandardMaterial ref={(m) => { cells.current[i] = m; }} color="#3f4854" emissive="#3f4854" emissiveIntensity={0.15} roughness={0.4} />
            </mesh>
          );
        })}
        <Text position={[0, 1.55, 0]} fontSize={0.09} color="#c8cfd9" anchorX="center">error → syndrome → decode, every ~1 µs</Text>
        <Text position={[0, 0.24, 1.2]} fontSize={0.075} color="#9aa0ab" anchorX="center">Willow 2024: bigger code, better qubit (~2x per step)</Text>
      </Station>
    </group>
  );
}

function RealityStation() {
  const ctx = useScene();
  const rows = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const LINES = [
    ["simulating nature", "the original point · best bet", "#79a68d"],
    ["breaking RSA", "proven · needs ~20M qubits", "#c9a86a"],
    ["search", "√N boost only", "#8fb4d4"],
    ["optimization & AI", "hopes, not theorems", "#b0755f"],
  ] as const;
  useFrame((state) => {
    const active = ctx.program === "reality" || ctx.selectedId === "reality";
    const step = Math.floor(state.clock.elapsedTime / 1.3) % (LINES.length + 1);
    rows.current.forEach((m, i) => {
      if (!m) return;
      m.opacity = THREE.MathUtils.lerp(m.opacity, active && i < step ? 0.3 : 0.06, 0.12);
    });
  });
  return (
    <group position={[7.0, 0, -8.4]}>
      <Station id="reality" labelPos={[0, 2.6, 0]} halo={[2.7, 2.55, 1.2]} plinth={{ w: 2.5, d: 1.0 }}>
        <mesh position={[0, 1.45, -0.02]}>
          <planeGeometry args={[2.3, 1.9]} />
          <meshStandardMaterial color="#14171b" roughness={0.5} metalness={0.4} />
        </mesh>
        <Text position={[0, 2.2, 0]} fontSize={0.1} color="#c8cfd9" anchorX="center">the honest scoreboard</Text>
        {LINES.map(([head, sub, color], i) => (
          <group key={head} position={[0, 1.82 - i * 0.42, 0]}>
            <mesh position={[0, 0, -0.005]}>
              <planeGeometry args={[2.2, 0.36]} />
              <meshBasicMaterial ref={(m) => { rows.current[i] = m; }} color={color} transparent opacity={0.06} depthWrite={false} />
            </mesh>
            <Text position={[-1.02, 0.05, 0.01]} fontSize={0.08} color={color} anchorX="left">{head}</Text>
            <Text position={[-1.02, -0.09, 0.01]} fontSize={0.06} color="#9aa0ab" anchorX="left">{sub}</Text>
          </group>
        ))}
      </Station>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Assembly
 * ---------------------------------------------------------------- */

function Dust() {
  const points = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      arr[i * 3] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 26 - 13;
      arr[i * 3 + 1] = Math.abs(Math.sin(i * 78.233) * 12543.21 % 1) * 7;
      arr[i * 3 + 2] = (Math.sin(i * 39.425) * 28653.12 % 1) * 22 - 11;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={points}>
      <pointsMaterial size={0.02} color="#5d6672" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Machine() {
  return (
    <group>
      <Chandelier />
      <ColdStation />
      <ChipStation />
      <PlatformsStation />
      <BitStation />
      <BlochStation />
      <SuperpositionStation />
      <EntangleStation />
      <CompileStation />
      <PulseStation />
      <InterferenceStation />
      <ReadoutStation />
      <DecoherenceStation />
      <QecStation />
      <RealityStation />
      <Dust />
    </group>
  );
}

export default function QuantumScene(props: QcSceneState) {
  const [interacted, setInteracted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const attract = !interacted && !props.selectedId && props.highlightIds.length === 0 && !props.focusStepId;
  const ctx: Ctx = { ...props, highlight: new Set(props.highlightIds), attract };

  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [60, 250, 800].map((ms) => window.setTimeout(nudge, ms));
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [...DEFAULT_POSE.pos], fov: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: props.glPower ?? "high-performance", failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: captureBuffer() }}
      onCreated={({ gl }) => {
        gl.setClearColor("#09090b");
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
      onPointerMissed={() => props.onSelect(null)}
      onPointerDown={() => setInteracted(true)}
      style={{ touchAction: "none" }}
    >
      <fog attach="fog" args={["#0a0a0b", 20, 54]} />
      <SceneCtx.Provider value={ctx}>
        <Machine />
        <CameraRig controls={controlsRef} />
      </SceneCtx.Provider>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[70, 48]} />
        <MeshReflectorMaterial
          blur={[280, 70]} resolution={640} mixBlur={1} mixStrength={7}
          roughness={0.92} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.3}
          color="#060607" metalness={0.4} mirror={0.35}
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
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={34} blur={2.4} far={5} />
      <Grid
        position={[0, 0.01, 0]} args={[40, 40]} cellSize={1} cellThickness={0.35}
        cellColor="#1c1f24" sectionSize={5} sectionThickness={0.7} sectionColor="#2a2e35"
        fadeDistance={36} infiniteGrid
      />
      <EffectComposer multisampling={0}>
        <Vignette eskil={false} offset={0.1} darkness={0.42} />
      </EffectComposer>
      <OrbitControls
        ref={controlsRef}
        target={[...DEFAULT_POSE.look]}
        enablePan enableDamping
        autoRotate={attract} autoRotateSpeed={0.5}
        onStart={() => setInteracted(true)}
        minDistance={3} maxDistance={30} maxPolarAngle={1.52}
      />
    </Canvas>
  );
}
