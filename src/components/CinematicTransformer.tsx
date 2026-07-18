"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

// Each "panel" is a 3D card that repositions between car and robot formations
interface PanelConfig {
  id: string;
  label: string;
  icon: string;
  // Car formation position/rotation
  car: { x: number; y: number; z: number; rotateX: number; rotateY: number; rotateZ: number; scale: number };
  // Robot formation position/rotation
  robot: { x: number; y: number; z: number; rotateX: number; rotateY: number; rotateZ: number; scale: number };
  color: string;
  delay: number;
}

const panels: PanelConfig[] = [
  {
    id: "chassis",
    label: "Neural Chassis",
    icon: "◇",
    car: { x: 0, y: 0, z: 0, rotateX: 25, rotateY: -15, rotateZ: 0, scale: 1.1 },
    robot: { x: 0, y: -20, z: 50, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 },
    color: "from-blue-500/20 to-cyan-500/10",
    delay: 0,
  },
  {
    id: "engine",
    label: "Compute Engine",
    icon: "⬡",
    car: { x: -220, y: 30, z: -80, rotateX: 20, rotateY: 35, rotateZ: -5, scale: 0.85 },
    robot: { x: -160, y: -100, z: -30, rotateX: -5, rotateY: 20, rotateZ: -8, scale: 0.9 },
    color: "from-violet-500/20 to-purple-500/10",
    delay: 0.05,
  },
  {
    id: "sensor",
    label: "Sensor Array",
    icon: "◈",
    car: { x: 220, y: 30, z: -80, rotateX: 20, rotateY: -35, rotateZ: 5, scale: 0.85 },
    robot: { x: 160, y: -100, z: -30, rotateX: -5, rotateY: -20, rotateZ: 8, scale: 0.9 },
    color: "from-emerald-500/20 to-teal-500/10",
    delay: 0.1,
  },
  {
    id: "nav",
    label: "Nav Cortex",
    icon: "△",
    car: { x: -110, y: -40, z: -40, rotateX: 30, rotateY: 10, rotateZ: -3, scale: 0.9 },
    robot: { x: -80, y: 60, z: 20, rotateX: 5, rotateY: 15, rotateZ: -3, scale: 0.85 },
    color: "from-amber-500/20 to-orange-500/10",
    delay: 0.15,
  },
  {
    id: "drive",
    label: "Drive Matrix",
    icon: "▽",
    car: { x: 110, y: -40, z: -40, rotateX: 30, rotateY: -10, rotateZ: 3, scale: 0.9 },
    robot: { x: 80, y: 60, z: 20, rotateX: 5, rotateY: -15, rotateZ: 3, scale: 0.85 },
    color: "from-rose-500/20 to-pink-500/10",
    delay: 0.2,
  },
  {
    id: "shield",
    label: "Armor Shield",
    icon: "⬢",
    car: { x: 0, y: 60, z: -120, rotateX: 15, rotateY: 0, rotateZ: 0, scale: 0.75 },
    robot: { x: 0, y: 140, z: -40, rotateX: 10, rotateY: 0, rotateZ: 0, scale: 0.8 },
    color: "from-sky-500/20 to-indigo-500/10",
    delay: 0.25,
  },
  {
    id: "core",
    label: "Power Core",
    icon: "◉",
    car: { x: -330, y: 0, z: -160, rotateX: 15, rotateY: 45, rotateZ: -8, scale: 0.7 },
    robot: { x: -240, y: 20, z: -60, rotateX: 0, rotateY: 30, rotateZ: -5, scale: 0.75 },
    color: "from-fuchsia-500/20 to-violet-500/10",
    delay: 0.3,
  },
  {
    id: "weapon",
    label: "Beam Array",
    icon: "✦",
    car: { x: 330, y: 0, z: -160, rotateX: 15, rotateY: -45, rotateZ: 8, scale: 0.7 },
    robot: { x: 240, y: 20, z: -60, rotateX: 0, rotateY: -30, rotateZ: 5, scale: 0.75 },
    color: "from-red-500/20 to-orange-500/10",
    delay: 0.35,
  },
];

// Floating energy particles
const EnergyParticles = ({ active }: { active: boolean }) => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, hsla(${200 + p.id * 12}, 80%, 70%, 0.6), transparent)`,
          }}
          animate={active ? {
            y: [0, -30, 0],
            x: [0, Math.sin(p.id) * 20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          } : {
            y: [0, -10, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Individual 3D Panel Card
const Panel3D = ({
  config,
  mode,
  mouseX,
  mouseY,
  isTransforming,
}: {
  config: PanelConfig;
  mode: "car" | "robot";
  mouseX: ReturnType<typeof useMotionValue>;
  mouseY: ReturnType<typeof useMotionValue>;
  isTransforming: boolean;
}) => {
  const pos = mode === "car" ? config.car : config.robot;

  // Add mouse parallax
  const parallaxX = useTransform(mouseX, (v: number) => (v + 0.5) * 30 - 15);
  const parallaxY = useTransform(mouseY, (v: number) => (v + 0.5) * 20 - 10);
  const smoothParallaxX = useSpring(parallaxX, { stiffness: 100, damping: 30 });
  const smoothParallaxY = useSpring(parallaxY, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="absolute"
      style={{
        left: "50%",
        top: "50%",
        x: smoothParallaxX,
        y: smoothParallaxY,
      }}
      animate={{
        translateX: pos.x - 100,
        translateY: pos.y - 70,
        translateZ: pos.z,
        rotateX: pos.rotateX,
        rotateY: pos.rotateY,
        rotateZ: pos.rotateZ,
        scale: pos.scale,
      }}
      transition={{
        type: "spring",
        stiffness: 60,
        damping: 20,
        delay: config.delay,
        mass: 1.2,
      }}
    >
      <motion.div
        className="relative w-[200px] h-[140px] cursor-pointer group/panel"
        whileHover={{ scale: 1.08, z: 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Card glow */}
        <div className={`absolute -inset-[1px] rounded-xl bg-gradient-to-br ${config.color} opacity-0 group-hover/panel:opacity-100 transition-opacity duration-500 blur-sm`} />

        {/* Card body */}
        <div className="relative h-full rounded-xl border border-border/20 bg-background/60 backdrop-blur-xl overflow-hidden">
          {/* Holographic top shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />

          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent pointer-events-none"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: config.delay * 5 }}
          />

          {/* Content */}
          <div className="relative p-5 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-2xl opacity-60 group-hover/panel:opacity-100 transition-opacity">
                {config.icon}
              </span>
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: config.delay * 3 }}
              />
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground/40 uppercase mb-1">
                {config.id}
              </p>
              <p className="text-xs font-medium text-foreground/80 group-hover/panel:text-foreground transition-colors">
                {config.label}
              </p>
            </div>
          </div>

          {/* Bottom prismatic line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), hsla(200, 80%, 60%, 0.2), transparent)",
            }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Edge refraction on hover */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover/panel:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              boxShadow: "inset 1px 0 0 rgba(200,220,255,0.08), inset -1px 0 0 rgba(255,200,180,0.06), inset 0 1px 0 rgba(200,255,200,0.04), inset 0 -1px 0 rgba(220,200,255,0.04)",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

const CinematicTransformer = () => {
  const [mode, setMode] = useState<"car" | "robot">("car");
  const [isTransforming, setIsTransforming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleTransform = useCallback(() => {
    setIsTransforming(true);
    setMode((prev) => (prev === "car" ? "robot" : "car"));
    setTimeout(() => setIsTransforming(false), 1500);
  }, []);

  return (
    <div className="relative">
      {/* Section header */}
      <div className="text-center mb-12">
        <motion.p
          className="font-mono text-[9px] tracking-[0.5em] text-muted-foreground/30 uppercase mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          [ Metamorphic Engine ]
        </motion.p>
        <motion.h2
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          Autonomous Transformer
        </motion.h2>
        <motion.p
          className="font-mono text-[10px] text-muted-foreground/40 max-w-lg mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Eight neural subsystems dynamically reconfigure between vehicle and autonomous mech formations.
          Hover to inspect. Click to initiate metamorphosis.
        </motion.p>
      </div>

      {/* 3D Scene container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative mx-auto overflow-visible"
        style={{ height: "520px", perspective: "1200px", perspectiveOrigin: "50% 40%" }}
      >
        {/* Ambient glow behind scene */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
            style={{
              background: mode === "car"
                ? "radial-gradient(ellipse, hsl(220, 80%, 60%), transparent 70%)"
                : "radial-gradient(ellipse, hsl(280, 80%, 60%), transparent 70%)",
              transition: "background 1.5s ease",
            }}
          />
        </div>

        {/* Energy particles */}
        <EnergyParticles active={isTransforming} />

        {/* Transformation burst effect */}
        <AnimatePresence>
          {isTransforming && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 2.5, 4] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="w-40 h-40 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsla(200, 90%, 80%, 0.3), hsla(260, 80%, 60%, 0.1), transparent 70%)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The 3D panels */}
        <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          {panels.map((panel) => (
            <Panel3D
              key={panel.id}
              config={panel}
              mode={mode}
              mouseX={mouseX}
              mouseY={mouseY}
              isTransforming={isTransforming}
            />
          ))}
        </div>

        {/* Ground reflection line */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[500px] h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.06), transparent)",
          }}
        />

        {/* Perspective grid floor */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[700px] h-[80px] pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, hsl(var(--foreground)) 0px, transparent 1px, transparent 60px),
              repeating-linear-gradient(0deg, hsl(var(--foreground)) 0px, transparent 1px, transparent 20px)
            `,
            maskImage: "linear-gradient(to bottom, transparent, white 30%, white 70%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, white 30%, white 70%, transparent)",
          }}
        />
      </div>

      {/* Mode label & controls */}
      <div className="flex flex-col items-center gap-6 mt-4">
        {/* Mode indicator */}
        <div className="flex items-center gap-4">
          <motion.div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: mode === "car" ? "hsl(var(--muted-foreground) / 0.6)" : "hsl(var(--muted-foreground) / 0.25)" }}
          >
            Vehicle
          </motion.div>
          <div className="w-8 h-[1px] bg-border/30" />
          <motion.div
            className="w-3 h-3 rounded-full border border-border/40 relative"
            animate={{
              borderColor: isTransforming ? "hsl(200, 80%, 60%)" : "hsl(var(--border) / 0.4)",
              boxShadow: isTransforming ? "0 0 12px hsla(200, 80%, 60%, 0.4)" : "0 0 0 transparent",
            }}
          >
            <motion.div
              className="absolute inset-[3px] rounded-full bg-foreground/60"
              animate={{ x: mode === "car" ? -1 : 1 }}
            />
          </motion.div>
          <div className="w-8 h-[1px] bg-border/30" />
          <motion.div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: mode === "robot" ? "hsl(var(--muted-foreground) / 0.6)" : "hsl(var(--muted-foreground) / 0.25)" }}
          >
            Mech
          </motion.div>
        </div>

        {/* Transform button */}
        <motion.button
          onClick={handleTransform}
          disabled={isTransforming}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative font-mono text-[10px] tracking-[0.3em] uppercase border border-border/30 px-10 py-3.5 text-muted-foreground/60 hover:text-foreground hover:border-foreground/30 transition-all duration-500 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span className="relative z-10">
            {isTransforming ? "◆ Morphing..." : mode === "car" ? "→ Initiate Transform" : "→ Revert Vehicle"}
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.button>

        {/* Transformation status */}
        <AnimatePresence>
          {isTransforming && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground/25 uppercase"
            >
              ◆ Reconfiguring subsystems...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CinematicTransformer;
