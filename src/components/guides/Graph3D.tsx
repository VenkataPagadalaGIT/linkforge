"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Billboard, Text } from "@react-three/drei";
import { useTheme } from "@/components/theme/ThemeProvider";
import { viewTo3D, type GraphView } from "@/lib/graphModels";

// Fixed accent hues (legible on both themes). Neutral kinds flip with theme.
const ACCENT: Record<string, string> = {
  leaf: "#3fb6b6",
  product: "#3fb6b6",
  page: "#3fb6b6",
  brand: "#d39a4a",
  rule: "#d39a4a",
  query: "#d39a4a",
  concept: "#8b93e6",
  context: "#8b93e6",
  win: "#46b06e",
  user: "#46b06e",
};
const colorFor = (kind: string, dark: boolean) =>
  ACCENT[kind] ?? (dark ? "#a6a6b0" : "#6a6a76");

type N3 = ReturnType<typeof viewTo3D>["nodes"][number];

function Node({ node, color, textColor, dim, phase, onOver, onOut }: { node: N3; color: string; textColor: string; dim: boolean; phase: number; onOver: () => void; onOut: () => void; }) {
  const isBox = node.kind === "page";
  const ref = useRef<any>(null);
  const born = useRef<number | null>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    // Entrance: ease-in scale, staggered by phase. After the entrance settles,
    // the scene is STATIC — no idle bob, no ambient drift. Motion that doesn't
    // carry information is decoration; on a research figure it reads as jitter.
    // Hovered (lit) nodes get a faint 1.0→1.06 pulse so the user can see which
    // one they've selected without changing position (which would imply that
    // position has changed in the underlying graph — it hasn't).
    const dt = t - born.current - phase * 0.06;
    const s = Math.max(0, Math.min(1, dt / 0.5));
    const eased = 1 - (1 - s) * (1 - s);
    const litPulse = !dim ? 1 + Math.sin(t * 2.4) * 0.03 : 1;
    const dimScale = dim ? 0.92 : litPulse;
    g.scale.setScalar(eased * dimScale);
  });
  return (
    <group ref={ref} position={node.pos}>
      <mesh onPointerOver={onOver} onPointerOut={onOut}>
        {isBox ? <boxGeometry args={[node.size * 1.6, node.size * 1.6, node.size * 1.6]} /> : <sphereGeometry args={[node.size, 32, 32]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dim ? 0.04 : 0.4} roughness={0.35} metalness={0.1} transparent opacity={dim ? 0.22 : 1} />
      </mesh>
      <Billboard>
        <Text position={[0, node.size + 0.26, 0]} fontSize={0.24} color={textColor} anchorX="center" anchorY="middle" fillOpacity={dim ? 0.3 : 1} maxWidth={3.2} textAlign="center">
          {node.label}
        </Text>
      </Billboard>
    </group>
  );
}

function Scene({ view, dark }: { view: GraphView; dark: boolean }) {
  const { nodes, edges } = useMemo(() => viewTo3D(view), [view]);
  const posById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n.pos])), [nodes]);
  const [active, setActive] = useState<string | null>(null);

  const textColor = dark ? "#e8e8ea" : "#1a1a1f";
  const edgeColor = dark ? "#6f6f7a" : "#b0b0bc";

  const lit = useMemo(() => {
    if (!active) return null;
    const s = new Set<string>([active]);
    edges.forEach((e) => { if (e.source === active) s.add(e.target); if (e.target === active) s.add(e.source); });
    return s;
  }, [active, edges]);
  const nodeDim = (id: string) => (lit ? !lit.has(id) : false);
  const edgeOn = (a: string, b: string) => !lit || (lit.has(a) && lit.has(b));

  return (
    <>
      <ambientLight intensity={dark ? 0.6 : 0.95} />
      <pointLight position={[6, 6, 8]} intensity={dark ? 1.1 : 0.6} />
      {edges.map((e, i) => {
        const a = posById[e.source], b = posById[e.target];
        if (!a || !b) return null;
        const on = edgeOn(e.source, e.target);
        const win = e.kind === "win";
        const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        return (
          <group key={i}>
            <Line points={[a, b]} color={win ? "#46b06e" : edgeColor} lineWidth={on ? 1.5 : 0.5} dashed={!!e.dashed} dashSize={0.16} gapSize={0.1} transparent opacity={on ? 0.85 : 0.12} />
            {e.label && on && (
              <Billboard position={mid}>
                <Text fontSize={0.16} color={edgeColor} anchorX="center" anchorY="middle">{e.label}</Text>
              </Billboard>
            )}
          </group>
        );
      })}
      {nodes.map((n, i) => (
        <Node key={n.id} node={n} phase={i} color={colorFor(n.kind, dark)} textColor={textColor} dim={nodeDim(n.id)} onOver={() => setActive(n.id)} onOut={() => setActive(null)} />
      ))}
      {/* User-driven exploration only: no autoRotate. Spinning a research figure
          on idle implies the structure has a preferred axis of motion (it
          doesn't) and induces motion sickness on long reads. Drag to orbit. */}
      <OrbitControls enablePan={false} enableZoom minDistance={4} maxDistance={18} makeDefault />
    </>
  );
}

const Graph3D = ({ view }: { view: GraphView }) => {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  return (
    <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [0, 0.4, 9.5], fov: 50 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
      <Scene view={view} dark={dark} />
    </Canvas>
  );
};

export default Graph3D;
