"use client";
import { useMemo, useRef, useState, useEffect, createContext, useContext } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Html, Lightformer, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  ZONES,
  stageById,
  DEMO_TOKENS,
  DEMO_TOKEN_IDS,
  DEMO_LOGITS,
  type FlowSegment,
} from "@/data/llm";

/**
 * LlmScene — the "How LLMs Work" machine, in 3D.
 *
 * A left-to-right pipeline: prompt → tokenizer → embedding wall → transformer
 * stack (attention beams + MoE router plates) → logits board → sampler → an
 * autoregressive loop arc back to the prompt. A training row (pretraining,
 * alignment, reasoning RL) sits behind and lights up in training mode.
 * Everything is driven by the same ids as src/data/llm.ts.
 */

export interface LlmSceneState {
  selectedId: string | null;
  highlightIds: string[];
  onSelect: (id: string | null) => void;
  running: boolean;
  labels: boolean;
  training: boolean;
  flow: FlowSegment;
}

interface Ctx extends Omit<LlmSceneState, "highlightIds"> {
  highlight: Set<string>;
}
const SceneCtx = createContext<Ctx | null>(null);
const useScene = () => useContext(SceneCtx)!;

const zoneColor = (id: string) => ZONES[stageById(id)?.zone ?? "core"].color;

/* ---------------------------------------------------------------- *
 *  Stage wrapper — selection, halo, label
 * ---------------------------------------------------------------- */

function Stage({
  id,
  children,
  labelPos = [0, 1.35, 0],
  halo = [2.2, 2.2, 1.4],
  dimInInference = false,
}: {
  id: string;
  children: React.ReactNode;
  labelPos?: [number, number, number];
  halo?: [number, number, number];
  dimInInference?: boolean;
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
      const target = selected ? 0.5 : lit ? 0.34 : hover ? 0.16 : 0;
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
      <group visible={!dimmed}>{children}</group>
      {dimmed && <group scale={[1, 1, 1]}>{/* keep bounds clickable when dimmed */}
        <mesh visible={false}><boxGeometry args={halo} /><meshBasicMaterial /></mesh>
      </group>}
      {/* halo shell */}
      <mesh position={[0, halo[1] / 2 - 0.1, 0]}>
        <boxGeometry args={halo} />
        <meshBasicMaterial ref={haloMat} color={color} transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {(ctx.labels || selected || lit) && stage && (
        <Html position={labelPos} center distanceFactor={14} style={{ pointerEvents: "none" }}>
          <div
            style={{
              font: "600 10px ui-monospace, monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: lit ? "#0a0a0a" : color,
              background: lit ? color : "rgba(10,10,10,0.78)",
              border: `1px solid ${color}${lit ? "" : "66"}`,
              padding: "2px 6px",
              whiteSpace: "nowrap",
              opacity: dimmed ? 0.35 : 1,
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
  loop: [new THREE.Vector3(6.6, 1.5, 0), new THREE.Vector3(-1, 6.2, 0.6), new THREE.Vector3(-9, 2.1, 0)],
  train: [new THREE.Vector3(-5, 1.1, -6.5), new THREE.Vector3(-1, 1.1, -6.5), new THREE.Vector3(3, 1.1, -6.5)],
};

function sampleQuadratic(pts: THREE.Vector3[], t: number, out: THREE.Vector3) {
  // quadratic bezier through [p0, p1(control), p2]
  const [a, b, c] = pts;
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
}

function FlowParticles({ segment }: { segment: Exclude<FlowSegment, null> }) {
  const ctx = useScene();
  const N = 7;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const pts = PATHS[segment];
  const color = segment === "train" ? "#fbbf24" : segment === "loop" ? "#34d399" : "#7dd3fc";

  useFrame((state) => {
    if (!mesh.current || !mat.current) return;
    const active = ctx.flow === segment;
    const visible = ctx.running || active;
    const speed = active ? 0.42 : 0.18;
    const targetOpacity = !visible ? 0 : active ? 0.95 : segment === "loop" || segment === "train" ? 0.06 : 0.28;
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, targetOpacity, 0.08);
    const t0 = state.clock.elapsedTime * speed;
    for (let i = 0; i < N; i++) {
      const t = (t0 + i / N) % 1;
      sampleQuadratic(pts, t, v);
      tmp.position.copy(v);
      const s = active ? 0.09 + 0.03 * Math.sin(t * Math.PI) : 0.055;
      tmp.scale.setScalar(s);
      tmp.updateMatrix();
      mesh.current.setMatrixAt(i, tmp.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Individual stage models
 * ---------------------------------------------------------------- */

const PANEL = "#161616";
const EDGE = "#2a2a2a";

function PromptPanel() {
  return (
    <Stage id="prompt" labelPos={[0, 3.0, 0]} halo={[2.6, 2.6, 0.5]}>
      <group position={[0, 1.7, 0]}>
        <mesh>
          <boxGeometry args={[2.3, 1.5, 0.12]} />
          <meshStandardMaterial color={PANEL} roughness={0.4} metalness={0.4} emissive="#38bdf8" emissiveIntensity={0.05} />
        </mesh>
        <Text position={[0, 0.25, 0.08]} fontSize={0.23} color="#e5e5e5" anchorX="center" font={undefined}>
          The cat sat
        </Text>
        <Text position={[0, -0.08, 0.08]} fontSize={0.23} color="#e5e5e5" anchorX="center">
          on the█
        </Text>
        <Text position={[0, -0.52, 0.08]} fontSize={0.11} color="#7dd3fc" anchorX="center">
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
    <Stage id="tokenizer" labelPos={[0, 2.9, 0]} halo={[2.5, 2.6, 1.2]}>
      <group position={[0, 0, 0]}>
        {/* the splitter blade */}
        <mesh ref={blade} position={[0, 1.55, 0]}>
          <boxGeometry args={[1.9, 0.08, 0.5]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.6} emissive="#38bdf8" emissiveIntensity={0.4} />
        </mesh>
        {/* token chips coming out below */}
        {DEMO_TOKENS.map((tok, i) => (
          <group key={i} position={[-0.84 + i * 0.42, 0.95, 0]}>
            <mesh>
              <boxGeometry args={[0.36, 0.26, 0.1]} />
              <meshStandardMaterial color={PANEL} roughness={0.45} emissive="#38bdf8" emissiveIntensity={0.16} />
            </mesh>
            <Text position={[0, 0.03, 0.07]} fontSize={0.085} color="#bae6fd" anchorX="center">
              {tok}
            </Text>
            <Text position={[0, -0.08, 0.07]} fontSize={0.055} color="#525252" anchorX="center">
              {String(DEMO_TOKEN_IDS[i])}
            </Text>
          </group>
        ))}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[2.2, 0.12, 0.9]} />
          <meshStandardMaterial color="#111111" roughness={0.6} />
        </mesh>
      </group>
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
    <Stage id="embeddings" labelPos={[0, 2.7, 0]} halo={[2.2, 2.4, 1.0]}>
      {/* the matrix wall */}
      <instancedMesh ref={inst} args={[undefined, undefined, cols * rows]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.5} roughness={0.4} />
      </instancedMesh>
      {/* five vector columns rising in front */}
      {DEMO_TOKENS.map((_, i) => (
        <mesh key={i} position={[-0.56 + i * 0.28, 1.05, 0.45]}>
          <boxGeometry args={[0.09, 0.9 + (i % 3) * 0.12, 0.09]} />
          <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0.2]}>
        <boxGeometry args={[1.9, 0.1, 1.1]} />
        <meshStandardMaterial color="#111111" roughness={0.6} />
      </mesh>
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
    <Stage id="positional" labelPos={[0, 1.15, 0]} halo={[1.1, 1.3, 0.8]}>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.45, 0]}>
        <torusGeometry args={[0.34, 0.05, 12, 40]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.55} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
    </Stage>
  );
}

function TransformerStack() {
  const layers = 6;
  return (
    <Stage id="layers" labelPos={[0, 4.4, 0]} halo={[2.6, 4.0, 2.0]}>
      {Array.from({ length: layers }).map((_, i) => (
        <mesh key={i} position={[0, 0.85 + i * 0.5, 0]}>
          <boxGeometry args={[2.1, 0.32, 1.5]} />
          <meshStandardMaterial
            color={PANEL}
            roughness={0.35}
            metalness={0.55}
            emissive="#a78bfa"
            emissiveIntensity={0.1 + (i / layers) * 0.12}
          />
        </mesh>
      ))}
      <Text position={[1.25, 2.1, 0]} fontSize={0.16} color="#a78bfa" anchorX="left" rotation={[0, 0, Math.PI / 2]}>
        × 96 layers
      </Text>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[2.5, 0.12, 1.9]} />
        <meshStandardMaterial color="#111111" roughness={0.6} />
      </mesh>
    </Stage>
  );
}

/** Attention detail plate — 5 token nodes, animated beams between them. */
function AttentionPlate() {
  const ctx = useScene();
  const lines = useRef<(THREE.Line | null)[]>([]);
  const nodeX = (i: number) => -0.8 + i * 0.4;
  const pairs = useMemo(() => {
    const p: [number, number][] = [];
    for (let j = 1; j < 5; j++) for (let i = 0; i < j; i++) p.push([i, j]);
    return p;
  }, []);
  const lit = ctx.selectedId === "attention" || ctx.highlight.has("attention");
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lines.current.forEach((ln, k) => {
      if (!ln) return;
      const m = ln.material as THREE.LineBasicMaterial;
      const base = lit ? 0.75 : ctx.running ? 0.3 : 0.12;
      m.opacity = base * (0.45 + 0.55 * Math.abs(Math.sin(t * 1.7 + k * 0.9)));
    });
  });
  return (
    <Stage id="attention" labelPos={[0, 1.75, 0]} halo={[2.3, 1.9, 0.7]}>
      <mesh position={[0, 0.75, -0.06]}>
        <boxGeometry args={[2.15, 1.5, 0.06]} />
        <meshStandardMaterial color="#131313" roughness={0.5} emissive="#a78bfa" emissiveIntensity={0.05} />
      </mesh>
      {/* token nodes */}
      {DEMO_TOKENS.map((tok, i) => (
        <group key={i} position={[nodeX(i), 0.32, 0]}>
          <mesh>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={0.8} />
          </mesh>
          <Text position={[0, -0.16, 0]} fontSize={0.07} color="#a3a3a3" anchorX="center">
            {tok}
          </Text>
        </group>
      ))}
      {/* attention arcs */}
      {pairs.map(([i, j], k) => {
        const from = new THREE.Vector3(nodeX(i), 0.32, 0.02);
        const to = new THREE.Vector3(nodeX(j), 0.32, 0.02);
        const mid = from.clone().lerp(to, 0.5);
        mid.y += 0.22 + (j - i) * 0.12;
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(18));
        return (
          // eslint-disable-next-line react/no-unknown-property
          <primitive
            key={k}
            object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0.2 }))}
            ref={(el: THREE.Line) => { lines.current[k] = el; }}
          />
        );
      })}
    </Stage>
  );
}

/** MoE plate — router + 8 experts, 2 lit at a time. */
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
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, active ? 1.0 : 0.08, 0.15);
    });
  });
  return (
    <Stage id="moe" labelPos={[0, 1.75, 0]} halo={[2.1, 1.9, 0.8]}>
      <mesh position={[0, 0.75, -0.06]}>
        <boxGeometry args={[1.95, 1.5, 0.06]} />
        <meshStandardMaterial color="#131313" roughness={0.5} emissive="#a78bfa" emissiveIntensity={0.05} />
      </mesh>
      {/* router */}
      <mesh position={[0, 1.18, 0.05]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshStandardMaterial color="#e9d5ff" emissive="#a78bfa" emissiveIntensity={0.9} />
      </mesh>
      <Text position={[0.24, 1.18, 0.05]} fontSize={0.07} color="#a3a3a3" anchorX="left">
        router
      </Text>
      {/* experts 2×4 */}
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        return (
          <mesh key={i} position={[-0.66 + col * 0.44, 0.62 - row * 0.42, 0.05]}>
            <boxGeometry args={[0.34, 0.3, 0.14]} />
            <meshStandardMaterial
              ref={(el) => { mats.current[i] = el; }}
              color={PANEL}
              roughness={0.4}
              emissive="#a78bfa"
              emissiveIntensity={0.08}
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
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, i < filled ? 0.55 : 0.05, 0.1);
    });
  });
  return (
    <Stage id="kv-cache" labelPos={[0, 1.9, 0]} halo={[1.5, 1.9, 1.2]}>
      {Array.from({ length: slabs }).map((_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.2, 0]}>
          <boxGeometry args={[1.15, 0.13, 0.85]} />
          <meshStandardMaterial
            ref={(el) => { mats.current[i] = el; }}
            color="#141414"
            roughness={0.45}
            metalness={0.5}
            emissive="#a78bfa"
            emissiveIntensity={0.05}
          />
        </mesh>
      ))}
    </Stage>
  );
}

function ContextFrame() {
  return (
    <Stage id="context-window" labelPos={[0, 5.3, 0]} halo={[13.4, 5.4, 3.4]}>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[13, 5, 3]} />
        <meshBasicMaterial color="#525252" wireframe transparent opacity={0.1} />
      </mesh>
    </Stage>
  );
}

function LogitsBoard() {
  const ctx = useScene();
  const mats = useRef<(THREE.Mesh | null)[]>([]);
  const lit = () => ctx.selectedId === "logits" || ctx.highlight.has("logits") || ctx.highlight.has("sampling") || ctx.running;
  useFrame(() => {
    const on = lit();
    mats.current.forEach((mesh, i) => {
      if (!mesh) return;
      const target = on ? (DEMO_LOGITS[i].p / 62) * 1.5 : 0.04;
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, target, 0.08);
      mesh.position.y = 0.55 + (mesh.scale.y * 1.0) / 2;
    });
  });
  return (
    <Stage id="logits" labelPos={[0, 3.1, 0]} halo={[2.6, 3.0, 1.0]}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[2.5, 0.12, 1.2]} />
        <meshStandardMaterial color="#111111" roughness={0.6} />
      </mesh>
      {DEMO_LOGITS.map((d, i) => (
        <group key={d.token} position={[-1.05 + i * 0.35, 0, 0]}>
          <mesh ref={(el) => { mats.current[i] = el; }} position={[0, 0.55, 0]} scale={[1, 0.04, 1]}>
            <boxGeometry args={[0.24, 1, 0.24]} />
            <meshStandardMaterial
              color={i === 0 ? "#34d399" : "#1f2937"}
              emissive={i === 0 ? "#34d399" : "#34d399"}
              emissiveIntensity={i === 0 ? 0.7 : 0.12}
              roughness={0.35}
            />
          </mesh>
          <Text position={[0, 0.32, 0.3]} fontSize={0.08} color={i === 0 ? "#6ee7b7" : "#737373"} anchorX="center" rotation={[-0.5, 0, 0]}>
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
    <Stage id="sampling" labelPos={[0, 2.5, 0]} halo={[1.7, 2.4, 1.2]}>
      {/* temperature dial */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 28]} />
        <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0.09]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.06, 0.4, 0.04]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.8} />
      </mesh>
      {/* the weighted die */}
      <mesh ref={die} position={[0, 1.45, 0]}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.35} roughness={0.25} metalness={0.4} />
      </mesh>
      <Text position={[0, 0.5, 0.12]} fontSize={0.08} color="#6ee7b7" anchorX="center">
        T
      </Text>
    </Stage>
  );
}

/** The chosen token flying back to the prompt. */
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
    <Stage id="loop" labelPos={[-1, 6.9, 0.6]} halo={[0.1, 0.1, 0.1]}>
      <group ref={chip}>
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshStandardMaterial color="#0a0a0a" emissive="#34d399" emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
        <Text position={[0, 0, 0.08]} fontSize={0.14} color="#6ee7b7" anchorX="center">
          mat
        </Text>
      </group>
    </Stage>
  );
}

/* --- training row ------------------------------------------------ */

function Pretraining() {
  const ctx = useScene();
  const pile = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (pile.current && (ctx.training || ctx.running)) {
      pile.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });
  return (
    <Stage id="pretraining" labelPos={[0, 2.6, 0]} halo={[2.4, 2.6, 2.0]} dimInInference>
      <group ref={pile}>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 2.4) * 0.5, 0.3 + i * 0.18, Math.cos(i * 2.4) * 0.5]} rotation={[0, i * 0.7, 0]}>
            <boxGeometry args={[0.9, 0.1, 0.65]} />
            <meshStandardMaterial color="#1c1917" roughness={0.6} emissive="#fbbf24" emissiveIntensity={0.12} />
          </mesh>
        ))}
      </group>
      <Text position={[0, 2.2, 0]} fontSize={0.12} color="#fcd34d" anchorX="center">
        15T tokens
      </Text>
    </Stage>
  );
}

function Alignment() {
  return (
    <Stage id="alignment" labelPos={[0, 2.4, 0]} halo={[2.2, 2.4, 1.4]} dimInInference>
      <mesh position={[-0.45, 1.0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.15]} />
        <meshStandardMaterial color="#052e16" roughness={0.4} emissive="#34d399" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[-0.45, 1.0, 0.1]} fontSize={0.24} color="#86efac" anchorX="center">
        ✓
      </Text>
      <mesh position={[0.45, 1.0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.15]} />
        <meshStandardMaterial color="#450a0a" roughness={0.4} emissive="#f87171" emissiveIntensity={0.25} />
      </mesh>
      <Text position={[0.45, 1.0, 0.1]} fontSize={0.24} color="#fca5a5" anchorX="center">
        ✗
      </Text>
      <Text position={[0, 0.45, 0]} fontSize={0.1} color="#fcd34d" anchorX="center">
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
    <Stage id="reasoning" labelPos={[0, 2.7, 0]} halo={[2.0, 2.7, 2.0]} dimInInference>
      <group ref={helix}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 0.9) * 0.45, 0.3 + i * 0.13, Math.cos(i * 0.9) * 0.45]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3 + (i / 14) * 0.5} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.12]} />
        <meshStandardMaterial color="#052e16" emissive="#34d399" emissiveIntensity={0.6} />
      </mesh>
      <Text position={[0, 2.25, 0.09]} fontSize={0.2} color="#86efac" anchorX="center">
        ✓
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
      {/* pipeline */}
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
      <ContextFrame />
      {/* training row (behind) */}
      <group position={[-5, 0, -6.5]}><Pretraining /></group>
      <group position={[-1, 0, -6.5]}><Alignment /></group>
      <group position={[3, 0, -6.5]}><ReasoningRl /></group>
      {/* training row base line */}
      <mesh position={[-1, 0.02, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 3.4]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={ctx.training ? 0.05 : 0.015} />
      </mesh>
      {/* flow particles */}
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
  const ctx: Ctx = { ...props, highlight: new Set(props.highlightIds) };
  const [interacted, setInteracted] = useState(false);
  const attract = !interacted && !props.selectedId && props.highlightIds.length === 0;

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
      camera={{ position: [1.5, 5.2, 15.5], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0a0a0a");
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
      onPointerMissed={() => props.onSelect(null)}
      onPointerDown={() => setInteracted(true)}
      style={{ touchAction: "none" }}
    >
      <SceneCtx.Provider value={ctx}>
        <Machine />
      </SceneCtx.Provider>

      {/* lighting rig */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 10, 6]} intensity={0.7} />
      <directionalLight position={[-8, 6, -4]} intensity={0.3} color="#a78bfa" />
      <Environment resolution={64}>
        <Lightformer position={[0, 6, -9]} scale={[14, 3, 1]} intensity={1.2} color="#a78bfa" />
        <Lightformer position={[-8, 4, 4]} scale={[3, 3, 1]} intensity={0.8} color="#38bdf8" />
        <Lightformer position={[8, 4, 4]} scale={[3, 3, 1]} intensity={0.8} color="#34d399" />
      </Environment>
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={30} blur={2.2} far={5} />
      <Grid
        position={[0, 0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#1c1c1c"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#262626"
        fadeDistance={34}
        infiniteGrid
      />

      <OrbitControls
        target={[-0.5, 2.0, 0]}
        enablePan
        enableDamping
        autoRotate={attract}
        autoRotateSpeed={0.5}
        onStart={() => setInteracted(true)}
        minDistance={3}
        maxDistance={28}
        maxPolarAngle={1.52}
      />
    </Canvas>
  );
}
