"use client";
import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Glowing edge platform (the tablet base)
const Platform = () => {
  const edgeRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (edgeRef.current) {
      const mat = edgeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group position={[0, -0.8, 0]} rotation={[-0.15, 0.3, 0]}>
      {/* Main platform body */}
      <RoundedBox args={[4.5, 0.15, 3]} radius={0.12} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.95}
          roughness={0.1}
        />
      </RoundedBox>

      {/* Glowing edge border - top */}
      <mesh ref={edgeRef} position={[0, 0.08, 0]}>
        <boxGeometry args={[4.55, 0.02, 3.05]} />
        <meshStandardMaterial
          color="#0a0a0a"
          emissive="#ff6b1a"
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* Edge glow lines */}
      {[
        { pos: [0, 0.085, 1.52] as [number, number, number], size: [4.4, 0.015, 0.015] as [number, number, number] },
        { pos: [0, 0.085, -1.52] as [number, number, number], size: [4.4, 0.015, 0.015] as [number, number, number] },
        { pos: [2.24, 0.085, 0] as [number, number, number], size: [0.015, 0.015, 3.0] as [number, number, number] },
        { pos: [-2.24, 0.085, 0] as [number, number, number], size: [0.015, 0.015, 3.0] as [number, number, number] },
      ].map((edge, i) => (
        <mesh key={i} position={edge.pos}>
          <boxGeometry args={edge.size} />
          <meshStandardMaterial
            color="#ff6b1a"
            emissive="#ff8c42"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Corner glow dots */}
      {[
        [2.2, 0.09, 1.48],
        [-2.2, 0.09, 1.48],
        [2.2, 0.09, -1.48],
        [-2.2, 0.09, -1.48],
      ].map((pos, i) => (
        <mesh key={`corner-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial
            color="#ff6b1a"
            emissive="#ffaa44"
            emissiveIntensity={5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Grid floor on platform */}
      <mesh ref={gridRef} position={[0, 0.081, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.3, 2.85]} />
        <meshStandardMaterial
          color="#050505"
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Grid lines */}
      <GridLines />

      {/* Bottom indicator lights */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`led-${i}`} position={[-1.4 + i * 0.4, -0.07, 1.48]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial
            color="#ff6b1a"
            emissive="#ff6b1a"
            emissiveIntensity={2 + Math.sin(i * 0.8) * 1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// Grid lines on the platform surface
const GridLines = () => {
  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const gridSize = 4;
    const spacing = 0.45;
    // Horizontal
    for (let i = -gridSize; i <= gridSize; i++) {
      result.push({
        start: new THREE.Vector3(-2.1, 0.083, i * spacing * 0.7),
        end: new THREE.Vector3(2.1, 0.083, i * spacing * 0.7),
      });
    }
    // Vertical
    for (let i = -5; i <= 5; i++) {
      result.push({
        start: new THREE.Vector3(i * spacing, 0.083, -1.4),
        end: new THREE.Vector3(i * spacing, 0.083, 1.4),
      });
    }
    return result;
  }, []);

  return (
    <group>
      {lines.map((l, i) => {
        const points = [l.start, l.end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: "#1a1a1a", transparent: true, opacity: 0.6 });
        const lineObj = new THREE.Line(geometry, material);
        return <primitive key={i} object={lineObj} />;
      })}
    </group>
  );
};

// Floating 3D blocks that erupt from the platform
const FloatingBlock = ({
  position,
  size,
  color,
  emissive,
  delay,
  floatSpeed,
  rotationSpeed,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive: string;
  delay: number;
  floatSpeed: number;
  rotationSpeed: number;
}) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * floatSpeed + delay) * 0.15;
      ref.current.rotation.y += rotationSpeed * 0.005;
      ref.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.3 + delay) * 0.1;
    }
  });

  return (
    <Float speed={floatSpeed * 0.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <RoundedBox ref={ref} args={size} radius={0.02} smoothness={2} position={position}>
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={0.4}
        />
      </RoundedBox>
    </Float>
  );
};

// Central hero block with "A" logo feel
const CentralBlock = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    }
  });

  return (
    <group ref={ref} position={[0, 0.6, 0]} rotation={[-0.15, 0.3, 0]}>
      {/* Main screen/card */}
      <RoundedBox args={[1.6, 1.1, 0.06]} radius={0.04} smoothness={4}>
        <meshStandardMaterial
          color="#080808"
          metalness={0.9}
          roughness={0.1}
          emissive="#0a1a2a"
          emissiveIntensity={0.2}
        />
      </RoundedBox>

      {/* Screen glass overlay */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[1.5, 1.0]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.7}
          roughness={0.05}
          transparent
          opacity={0.7}
          emissive="#1a2a3a"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Glowing "V" shape on screen */}
      <group position={[0, 0.05, 0.04]}>
        {/* Left stroke */}
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.04, 0.5, 0.01]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
        {/* Right stroke */}
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.04, 0.5, 0.01]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Edge glow */}
      <mesh position={[0, -0.56, 0]}>
        <boxGeometry args={[1.6, 0.01, 0.07]} />
        <meshStandardMaterial
          color="#ff6b1a"
          emissive="#ff6b1a"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// All the floating blocks around the platform
const FloatingBlocks3D = () => {
  const blocks = [
    // Large panels - left side
    { pos: [-2.2, 1.8, -0.5] as [number, number, number], size: [0.7, 0.5, 0.05] as [number, number, number], color: "#2a2a2a", emissive: "#331a0a", delay: 0, speed: 1.2, rot: 0.5 },
    { pos: [-1.6, 2.5, 0.3] as [number, number, number], size: [0.5, 0.35, 0.04] as [number, number, number], color: "#1a1a1a", emissive: "#1a1a2a", delay: 1, speed: 0.8, rot: -0.3 },
    { pos: [-1.0, 1.5, -0.8] as [number, number, number], size: [0.4, 0.6, 0.04] as [number, number, number], color: "#252525", emissive: "#2a1a0a", delay: 2, speed: 1.5, rot: 0.7 },

    // Right side blocks
    { pos: [1.8, 2.0, -0.3] as [number, number, number], size: [0.6, 0.45, 0.05] as [number, number, number], color: "#2a2a2a", emissive: "#3a2a0a", delay: 0.5, speed: 1.0, rot: -0.4 },
    { pos: [1.2, 2.8, 0.5] as [number, number, number], size: [0.5, 0.4, 0.04] as [number, number, number], color: "#1a1a1a", emissive: "#0a1a2a", delay: 1.5, speed: 1.3, rot: 0.6 },
    { pos: [2.0, 1.3, 0.2] as [number, number, number], size: [0.35, 0.5, 0.04] as [number, number, number], color: "#222222", emissive: "#2a0a0a", delay: 2.5, speed: 0.9, rot: -0.5 },

    // Top blocks  
    { pos: [0.3, 3.0, -0.2] as [number, number, number], size: [0.55, 0.4, 0.06] as [number, number, number], color: "#282828", emissive: "#3a2a1a", delay: 0.8, speed: 1.1, rot: 0.3 },
    { pos: [-0.5, 2.6, 0.4] as [number, number, number], size: [0.4, 0.3, 0.05] as [number, number, number], color: "#1e1e1e", emissive: "#1a2a1a", delay: 1.8, speed: 1.4, rot: -0.6 },

    // Small accent blocks
    { pos: [-0.8, 1.8, 0.6] as [number, number, number], size: [0.25, 0.25, 0.25] as [number, number, number], color: "#ff6b1a", emissive: "#ff8c42", delay: 0.3, speed: 2.0, rot: 1.0 },
    { pos: [0.9, 1.6, -0.6] as [number, number, number], size: [0.2, 0.2, 0.2] as [number, number, number], color: "#cc4400", emissive: "#ff6b1a", delay: 1.2, speed: 1.8, rot: -0.8 },
    { pos: [0.5, 2.2, 0.8] as [number, number, number], size: [0.15, 0.3, 0.15] as [number, number, number], color: "#ff9944", emissive: "#ffaa44", delay: 2.2, speed: 1.6, rot: 0.9 },

    // Metallic accent panels
    { pos: [-1.5, 1.2, 0.7] as [number, number, number], size: [0.5, 0.03, 0.35] as [number, number, number], color: "#3a3a3a", emissive: "#1a1a1a", delay: 0.6, speed: 0.7, rot: 0.2 },
    { pos: [1.5, 2.5, -0.6] as [number, number, number], size: [0.45, 0.03, 0.3] as [number, number, number], color: "#333333", emissive: "#2a2a2a", delay: 1.6, speed: 0.6, rot: -0.2 },
  ];

  return (
    <group rotation={[-0.15, 0.3, 0]}>
      {blocks.map((b, i) => (
        <FloatingBlock
          key={i}
          position={b.pos}
          size={b.size}
          color={b.color}
          emissive={b.emissive}
          delay={b.delay}
          floatSpeed={b.speed}
          rotationSpeed={b.rot}
        />
      ))}
    </group>
  );
};

// Ambient star particles
const StarParticles = () => {
  const ref = useRef<THREE.Points>(null);
  const count = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 0.03 + 0.005;
    }
    return s;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#ff9955"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

// Mouse-reactive camera wrapper
const SceneContent = ({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.current.x * 0.15,
        0.03
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouse.current.y * 0.08,
        0.03
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.05} />
      <pointLight position={[3, 4, 2]} intensity={1.5} color="#ff6b1a" distance={15} decay={2} />
      <pointLight position={[-3, 3, -2]} intensity={0.8} color="#ff9944" distance={12} decay={2} />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#4a6aff" distance={10} decay={2} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffaa44" distance={15} decay={2} />
      <spotLight
        position={[0, 8, 3]}
        angle={0.25}
        penumbra={1}
        intensity={1.5}
        color="#ff8844"
        target-position={[0, 0, 0]}
      />

      {/* Scene elements */}
      <Platform />
      <CentralBlock />
      <FloatingBlocks3D />
      <StarParticles />
    </group>
  );
};

const ApiantStyle3D = () => {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="font-mono text-[9px] tracking-[0.5em] text-muted-foreground/30 uppercase mb-3">
          [ Integration Matrix ]
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tight">
          System Assembly
        </h2>
        <p className="font-mono text-[10px] text-muted-foreground/40 max-w-lg mx-auto leading-relaxed">
          Modular AI subsystems self-organize above the deployment platform.
          Move your cursor to inspect the orbital field.
        </p>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full overflow-hidden rounded-lg"
        style={{ height: "600px" }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-border/10 pointer-events-none z-10 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-border/10 pointer-events-none z-10 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-border/10 pointer-events-none z-10 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-border/10 pointer-events-none z-10 rounded-br-lg" />

        <Canvas
          camera={{ position: [0, 2, 6], fov: 40 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <SceneContent mouse={mouse} />
          </Suspense>
        </Canvas>

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-background/40 z-[1]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background/30 via-transparent to-background/30 z-[1]" />

        {/* Warm ambient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none z-[0]"
          style={{
            background: "radial-gradient(ellipse, hsla(25, 90%, 50%, 0.06), transparent 70%)",
          }}
        />

        {/* HUD corners */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/15 uppercase">
            PLATFORM.ACTIVE
          </p>
        </div>
        <div className="absolute top-4 right-4 z-10 pointer-events-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60 animate-pulse" />
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20 uppercase">
            LIVE
          </p>
        </div>
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/10 uppercase">
            13 MODULES LOADED
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiantStyle3D;
