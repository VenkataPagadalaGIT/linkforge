"use client";
import { useRef, useState, useMemo, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial, Edges, Text } from "@react-three/drei";
import * as THREE from "three";

// Floating mechanical core — a compound shape that slowly rotates and responds to mouse
const MechanicalCore = ({ mouse, onNavigate }: { mouse: React.MutableRefObject<{ x: number; y: number }>; onNavigate: (path: string) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth mouse follow
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.current.x * 0.4,
        0.03
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouse.current.y * 0.3,
        0.03
      );
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.15;
      innerRef.current.rotation.z += delta * 0.08;
    }
    if (ringRef1.current) ringRef1.current.rotation.x += delta * 0.3;
    if (ringRef2.current) ringRef2.current.rotation.y += delta * 0.25;
    if (ringRef3.current) ringRef3.current.rotation.z += delta * 0.2;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <group ref={innerRef}>
          {/* Central icosahedron */}
          <mesh>
            <icosahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial
              color="#1a1a2e"
              metalness={0.9}
              roughness={0.15}
              emissive="#0a1628"
              emissiveIntensity={0.3}
            />
            <Edges threshold={15} color="#4a9eff" lineWidth={1} />
          </mesh>

          {/* Inner glowing core */}
          <mesh scale={0.45}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00aaff"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>

          {/* Orbiting ring 1 */}
          <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[1.4, 0.015, 16, 100]} />
            <meshStandardMaterial
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>

          {/* Orbiting ring 2 */}
          <mesh ref={ringRef2} rotation={[0, Math.PI / 4, Math.PI / 6]}>
            <torusGeometry args={[1.7, 0.01, 16, 100]} />
            <meshStandardMaterial
              color="#7c5aff"
              emissive="#7c5aff"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>

          {/* Orbiting ring 3 */}
          <mesh ref={ringRef3} rotation={[Math.PI / 5, Math.PI / 3, 0]}>
            <torusGeometry args={[2.0, 0.008, 16, 100]} />
            <meshStandardMaterial
              color="#00ffd4"
              emissive="#00ffd4"
              emissiveIntensity={0.8}
              toneMapped={false}
            />
          </mesh>

          {/* Satellite nodes */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.1 + (i % 3) * 0.3;
            const y = Math.sin(i * 1.2) * 0.4;
            return (
              <FloatingNode
                key={i}
                position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
                index={i}
              />
            );
          })}

          {/* Floating panels — linked to pages */}
          {panelLinks.map((link, i) => {
            const angle = (i / 6) * Math.PI * 2 + 0.3;
            const radius = 1.8 + (i % 2) * 0.5;
            return (
              <FloatingPanel
                key={`panel-${link.path}`}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(i * 0.8) * 0.6,
                  Math.sin(angle) * radius,
                ]}
                rotation={[0, -angle + Math.PI / 2, 0]}
                index={i}
                label={link.label}
                onClickPanel={() => onNavigate(link.path)}
              />
            );
          })}
        </group>
      </Float>
    </group>
  );
};

// Small glowing satellite node
const FloatingNode = ({ position, index }: { position: [number, number, number]; index: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  const hue = (index * 40 + 180) % 360;

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.1;
      const s = 0.04 + Math.sin(state.clock.elapsedTime * 1.5 + index * 0.5) * 0.015;
      ref.current.scale.setScalar(s / 0.05);
    }
  });

  const color = `hsl(${hue}, 80%, 65%)`;

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        toneMapped={false}
      />
    </mesh>
  );
};

// Page link data for floating panels
const panelLinks = [
  { label: "Projects", path: "/projects" },
  { label: "Solutions", path: "/solutions" },
  { label: "Research", path: "/research" },
  { label: "Notebook", path: "/notebook" },
  { label: "Insights", path: "/insights" },
  { label: "About", path: "/about" },
];

// Floating holographic panel — clickable, links to a page
const FloatingPanel = ({
  position,
  rotation,
  index,
  label,
  onClickPanel,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
  label: string;
  onClickPanel: () => void;
}) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + index * 1.2) * 0.08;
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); onClickPanel(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {/* Panel background */}
      <mesh>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial
          color={hovered ? "#0f2a4a" : "#0a1628"}
          emissive={hovered ? "#2a5aff" : "#1a3a5c"}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={hovered ? 0.85 : 0.6}
          side={THREE.DoubleSide}
        />
        <Edges color={hovered ? "#6aadff" : "#4a9eff33"} lineWidth={hovered ? 1.2 : 0.5} />
      </mesh>

      {/* Label text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.06}
        color={hovered ? "#ffffff" : "#7abaff"}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>

      {/* Small arrow indicator */}
      <Text
        position={[0.18, -0.09, 0.01]}
        fontSize={0.04}
        color={hovered ? "#ffffff" : "#4a7aaa"}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        →
      </Text>
    </group>
  );
};

// Ambient particles
const Particles = () => {
  const count = 200;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#4a9eff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

// Light beams effect
const LightBeams = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 3, 0]} rotation={[0, (i / 3) * Math.PI * 2, 0.3 + i * 0.1]}>
          <planeGeometry args={[0.05, 8]} />
          <meshBasicMaterial
            color={i === 0 ? "#4a9eff" : i === 1 ? "#7c5aff" : "#00ffd4"}
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

const Scene = ({ mouse, onNavigate }: { mouse: React.MutableRefObject<{ x: number; y: number }>; onNavigate: (path: string) => void }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#4a9eff" />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color="#7c5aff" />
      <pointLight position={[0, 3, -5]} intensity={0.2} color="#00ffd4" />
      <spotLight
        position={[0, 8, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.8}
        color="#1a3a5c"
      />

      {/* Main object */}
      <MechanicalCore mouse={mouse} onNavigate={onNavigate} />

      {/* Ambient particles */}
      <Particles />

      {/* Volumetric light beams */}
      <LightBeams />
    </>
  );
};

const Cinematic3DScene = () => {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };

  const handleNavigate = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="font-mono text-[9px] tracking-[0.5em] text-muted-foreground/30 uppercase mb-3">
          [ Neural Architecture ]
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tight">
          Autonomous Core
        </h2>
        <p className="font-mono text-[10px] text-muted-foreground/40 max-w-md mx-auto leading-relaxed">
          A self-organizing neural substrate. Click the floating panels to navigate. Move your cursor to interact.
        </p>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full border border-border/10 overflow-hidden rounded-lg"
        style={{ height: "560px" }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-border/15 pointer-events-none z-10 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-border/15 pointer-events-none z-10 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-border/15 pointer-events-none z-10 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-border/15 pointer-events-none z-10 rounded-br-lg" />

        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene mouse={mouse} onNavigate={handleNavigate} />
          </Suspense>
        </Canvas>

        {/* Gradient overlays for cinematic feel */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-background/30 z-[1]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background/20 via-transparent to-background/20 z-[1]" />

        {/* HUD elements */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20 uppercase">
            SYS.ONLINE
          </p>
        </div>
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20 uppercase">
            ◆ LIVE
          </p>
        </div>
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/15 uppercase">
            DIMENSION: W-4
          </p>
        </div>
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/15 uppercase">
            PHASE: ACTIVE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cinematic3DScene;
