"use client";
import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/components/theme/ThemeProvider";
import { buildKnowledgeGraph3D, type GNode3D } from "@/lib/graphModels";

// Categorical accent colors — mid-tones legible on both themes.
const KIND_COLOR: Record<string, string> = {
  product: "#3fb6b6",
  brand: "#d39a4a",
  concept: "#8b93e6",
  attr: "#9a9aa6",
  external: "#7a7a86",
};

function Node({
  node,
  color,
  textColor,
  dim,
  onOver,
  onOut,
}: {
  node: GNode3D;
  color: string;
  textColor: string;
  dim: boolean;
  onOver: () => void;
  onOut: () => void;
}) {
  return (
    <group position={node.pos}>
      <mesh onPointerOver={onOver} onPointerOut={onOut}>
        <sphereGeometry args={[node.size ?? 0.4, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dim ? 0.05 : 0.45}
          roughness={0.35}
          metalness={0.1}
          transparent
          opacity={dim ? 0.25 : 1}
        />
      </mesh>
      <Billboard>
        <Text
          position={[0, (node.size ?? 0.4) + 0.28, 0]}
          fontSize={0.26}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0}
          fillOpacity={dim ? 0.3 : 1}
        >
          {node.label}
        </Text>
      </Billboard>
    </group>
  );
}

function Scene({ resolved }: { resolved: "light" | "dark" }) {
  const { nodes, edges } = useMemo(() => buildKnowledgeGraph3D(), []);
  const posById = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n.pos])),
    [nodes]
  );
  const [active, setActive] = useState<string | null>(null);

  const textColor = resolved === "dark" ? "#e8e8ea" : "#1a1a1f";
  const edgeColor = resolved === "dark" ? "#6f6f7a" : "#b4b4c0";
  const winColor = "#46b06e";

  const neighbors = useMemo(() => {
    if (!active) return null;
    const s = new Set<string>([active]);
    edges.forEach((e) => {
      if (e.source === active) s.add(e.target);
      if (e.target === active) s.add(e.source);
    });
    return s;
  }, [active, edges]);

  const nodeDim = (id: string) => (neighbors ? !neighbors.has(id) : false);
  const edgeLit = (a: string, b: string) =>
    !neighbors || (neighbors.has(a) && neighbors.has(b));

  return (
    <>
      <ambientLight intensity={resolved === "dark" ? 0.6 : 0.9} />
      <pointLight position={[6, 6, 8]} intensity={resolved === "dark" ? 1.1 : 0.7} />

      {edges.map((e, i) => {
        const a = posById[e.source];
        const b = posById[e.target];
        if (!a || !b) return null;
        const lit = edgeLit(e.source, e.target);
        const mid: [number, number, number] = [
          (a[0] + b[0]) / 2,
          (a[1] + b[1]) / 2,
          (a[2] + b[2]) / 2,
        ];
        return (
          <group key={i}>
            <Line
              points={[a, b]}
              color={e.label === "sameAs" ? winColor : edgeColor}
              lineWidth={lit ? 1.6 : 0.6}
              dashed={!!e.dashed}
              dashSize={0.18}
              gapSize={0.12}
              transparent
              opacity={lit ? 0.9 : 0.15}
            />
            {e.label && lit && (
              <Billboard position={mid}>
                <Text fontSize={0.17} color={edgeColor} anchorX="center" anchorY="middle">
                  {e.label}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}

      {nodes.map((n) => (
        <Node
          key={n.id}
          node={n}
          color={KIND_COLOR[n.kind] ?? "#9a9aa6"}
          textColor={textColor}
          dim={nodeDim(n.id)}
          onOver={() => setActive(n.id)}
          onOut={() => setActive(null)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={5}
        maxDistance={16}
        autoRotate
        autoRotateSpeed={0.6}
        makeDefault
      />
    </>
  );
}

const Graph3D = () => {
  const { resolvedTheme } = useTheme();
  const resolved = resolvedTheme === "light" ? "light" : "dark";
  return (
    <figure className="my-2">
      <div className="border border-border bg-card/40" style={{ height: 460 }}>
        <Canvas
          camera={{ position: [0, 0.5, 9], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
        >
          <Scene resolved={resolved} />
        </Canvas>
      </div>
      <figcaption className="mt-3">
        <p className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed">
          <span className="text-foreground">Knowledge graph, in 3D.</span> Drag to orbit,
          scroll to zoom, hover any entity to trace its relationships. Same facts as the figure
          above — entities and typed edges, now explorable in space.
        </p>
      </figcaption>
    </figure>
  );
};

export default Graph3D;
