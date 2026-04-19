"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define wireframe shapes as sets of connected line segments
// Each point is normalized 0-1, we'll scale to canvas size

interface Point { x: number; y: number }
interface Line { from: Point; to: Point; group: string }

// Car wireframe - side profile
const carLines: Line[] = [
  // Body
  { from: { x: 0.15, y: 0.55 }, to: { x: 0.85, y: 0.55 }, group: "body" },
  { from: { x: 0.15, y: 0.55 }, to: { x: 0.15, y: 0.45 }, group: "body" },
  { from: { x: 0.15, y: 0.45 }, to: { x: 0.25, y: 0.45 }, group: "body" },
  { from: { x: 0.85, y: 0.55 }, to: { x: 0.85, y: 0.45 }, group: "body" },
  { from: { x: 0.85, y: 0.45 }, to: { x: 0.75, y: 0.45 }, group: "body" },
  // Roof
  { from: { x: 0.25, y: 0.45 }, to: { x: 0.35, y: 0.3 }, group: "roof" },
  { from: { x: 0.35, y: 0.3 }, to: { x: 0.65, y: 0.3 }, group: "roof" },
  { from: { x: 0.65, y: 0.3 }, to: { x: 0.75, y: 0.45 }, group: "roof" },
  // Windshield
  { from: { x: 0.35, y: 0.3 }, to: { x: 0.38, y: 0.45 }, group: "windshield" },
  { from: { x: 0.65, y: 0.3 }, to: { x: 0.62, y: 0.45 }, group: "windshield" },
  // Hood
  { from: { x: 0.75, y: 0.45 }, to: { x: 0.9, y: 0.48 }, group: "hood" },
  { from: { x: 0.9, y: 0.48 }, to: { x: 0.92, y: 0.55 }, group: "hood" },
  // Trunk
  { from: { x: 0.25, y: 0.45 }, to: { x: 0.1, y: 0.48 }, group: "trunk" },
  { from: { x: 0.1, y: 0.48 }, to: { x: 0.08, y: 0.55 }, group: "trunk" },
  // Front wheel
  { from: { x: 0.72, y: 0.55 }, to: { x: 0.72, y: 0.62 }, group: "wheel-f" },
  { from: { x: 0.78, y: 0.55 }, to: { x: 0.78, y: 0.62 }, group: "wheel-f" },
  { from: { x: 0.72, y: 0.62 }, to: { x: 0.78, y: 0.62 }, group: "wheel-f" },
  // Rear wheel
  { from: { x: 0.22, y: 0.55 }, to: { x: 0.22, y: 0.62 }, group: "wheel-r" },
  { from: { x: 0.28, y: 0.55 }, to: { x: 0.28, y: 0.62 }, group: "wheel-r" },
  { from: { x: 0.22, y: 0.62 }, to: { x: 0.28, y: 0.62 }, group: "wheel-r" },
  // Headlight
  { from: { x: 0.88, y: 0.48 }, to: { x: 0.92, y: 0.5 }, group: "light" },
  // Taillight
  { from: { x: 0.08, y: 0.5 }, to: { x: 0.12, y: 0.48 }, group: "light" },
  // Undercarriage detail
  { from: { x: 0.3, y: 0.55 }, to: { x: 0.7, y: 0.55 }, group: "under" },
  { from: { x: 0.4, y: 0.55 }, to: { x: 0.4, y: 0.58 }, group: "under" },
  { from: { x: 0.6, y: 0.55 }, to: { x: 0.6, y: 0.58 }, group: "under" },
];

// Robot wireframe - standing figure
const robotLines: Line[] = [
  // Head
  { from: { x: 0.45, y: 0.12 }, to: { x: 0.55, y: 0.12 }, group: "head" },
  { from: { x: 0.55, y: 0.12 }, to: { x: 0.56, y: 0.2 }, group: "head" },
  { from: { x: 0.56, y: 0.2 }, to: { x: 0.44, y: 0.2 }, group: "head" },
  { from: { x: 0.44, y: 0.2 }, to: { x: 0.45, y: 0.12 }, group: "head" },
  // Eyes
  { from: { x: 0.47, y: 0.15 }, to: { x: 0.49, y: 0.15 }, group: "eyes" },
  { from: { x: 0.51, y: 0.15 }, to: { x: 0.53, y: 0.15 }, group: "eyes" },
  // Neck
  { from: { x: 0.48, y: 0.2 }, to: { x: 0.48, y: 0.24 }, group: "neck" },
  { from: { x: 0.52, y: 0.2 }, to: { x: 0.52, y: 0.24 }, group: "neck" },
  // Chest/Torso
  { from: { x: 0.38, y: 0.24 }, to: { x: 0.62, y: 0.24 }, group: "torso" },
  { from: { x: 0.62, y: 0.24 }, to: { x: 0.6, y: 0.44 }, group: "torso" },
  { from: { x: 0.6, y: 0.44 }, to: { x: 0.4, y: 0.44 }, group: "torso" },
  { from: { x: 0.4, y: 0.44 }, to: { x: 0.38, y: 0.24 }, group: "torso" },
  // Chest detail (car hood remnant)
  { from: { x: 0.42, y: 0.28 }, to: { x: 0.58, y: 0.28 }, group: "chest-detail" },
  { from: { x: 0.42, y: 0.28 }, to: { x: 0.44, y: 0.36 }, group: "chest-detail" },
  { from: { x: 0.58, y: 0.28 }, to: { x: 0.56, y: 0.36 }, group: "chest-detail" },
  { from: { x: 0.44, y: 0.36 }, to: { x: 0.56, y: 0.36 }, group: "chest-detail" },
  // Left arm
  { from: { x: 0.38, y: 0.24 }, to: { x: 0.28, y: 0.26 }, group: "arm-l" },
  { from: { x: 0.28, y: 0.26 }, to: { x: 0.26, y: 0.38 }, group: "arm-l" },
  { from: { x: 0.26, y: 0.38 }, to: { x: 0.24, y: 0.48 }, group: "arm-l" },
  { from: { x: 0.24, y: 0.48 }, to: { x: 0.22, y: 0.52 }, group: "arm-l" },
  { from: { x: 0.3, y: 0.26 }, to: { x: 0.28, y: 0.38 }, group: "arm-l" },
  // Right arm
  { from: { x: 0.62, y: 0.24 }, to: { x: 0.72, y: 0.26 }, group: "arm-r" },
  { from: { x: 0.72, y: 0.26 }, to: { x: 0.74, y: 0.38 }, group: "arm-r" },
  { from: { x: 0.74, y: 0.38 }, to: { x: 0.76, y: 0.48 }, group: "arm-r" },
  { from: { x: 0.76, y: 0.48 }, to: { x: 0.78, y: 0.52 }, group: "arm-r" },
  { from: { x: 0.7, y: 0.26 }, to: { x: 0.72, y: 0.38 }, group: "arm-r" },
  // Waist
  { from: { x: 0.42, y: 0.44 }, to: { x: 0.58, y: 0.44 }, group: "waist" },
  { from: { x: 0.42, y: 0.44 }, to: { x: 0.42, y: 0.5 }, group: "waist" },
  { from: { x: 0.58, y: 0.44 }, to: { x: 0.58, y: 0.5 }, group: "waist" },
  // Left leg
  { from: { x: 0.42, y: 0.5 }, to: { x: 0.4, y: 0.65 }, group: "leg-l" },
  { from: { x: 0.4, y: 0.65 }, to: { x: 0.38, y: 0.78 }, group: "leg-l" },
  { from: { x: 0.38, y: 0.78 }, to: { x: 0.34, y: 0.82 }, group: "leg-l" },
  { from: { x: 0.34, y: 0.82 }, to: { x: 0.42, y: 0.82 }, group: "leg-l" },
  { from: { x: 0.46, y: 0.5 }, to: { x: 0.44, y: 0.65 }, group: "leg-l" },
  // Right leg
  { from: { x: 0.58, y: 0.5 }, to: { x: 0.6, y: 0.65 }, group: "leg-r" },
  { from: { x: 0.6, y: 0.65 }, to: { x: 0.62, y: 0.78 }, group: "leg-r" },
  { from: { x: 0.62, y: 0.78 }, to: { x: 0.66, y: 0.82 }, group: "leg-r" },
  { from: { x: 0.66, y: 0.82 }, to: { x: 0.58, y: 0.82 }, group: "leg-r" },
  { from: { x: 0.54, y: 0.5 }, to: { x: 0.56, y: 0.65 }, group: "leg-r" },
  // Shoulder pads (wheel remnants)
  { from: { x: 0.28, y: 0.22 }, to: { x: 0.34, y: 0.22 }, group: "shoulder" },
  { from: { x: 0.28, y: 0.22 }, to: { x: 0.28, y: 0.28 }, group: "shoulder" },
  { from: { x: 0.34, y: 0.22 }, to: { x: 0.34, y: 0.28 }, group: "shoulder" },
  { from: { x: 0.66, y: 0.22 }, to: { x: 0.72, y: 0.22 }, group: "shoulder" },
  { from: { x: 0.66, y: 0.22 }, to: { x: 0.66, y: 0.28 }, group: "shoulder" },
  { from: { x: 0.72, y: 0.22 }, to: { x: 0.72, y: 0.28 }, group: "shoulder" },
];

// Pad arrays to same length by duplicating last element
function padLines(lines: Line[], targetLength: number): Line[] {
  const result = [...lines];
  while (result.length < targetLength) {
    result.push(result[result.length - 1]);
  }
  return result;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// Easing function for dramatic transformation
function easeInOutBack(t: number): number {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

const TransformerMorph = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);
  const targetRef = useRef(0); // 0 = car, 1 = robot
  const [isRobot, setIsRobot] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; hue: number }[]>([]);
  const timeRef = useRef(0);

  const maxLen = Math.max(carLines.length, robotLines.length);
  const paddedCar = padLines(carLines, maxLen);
  const paddedRobot = padLines(robotLines, maxLen);

  const handleTransform = useCallback(() => {
    const next = !isRobot;
    setIsRobot(next);
    targetRef.current = next ? 1 : 0;
    setIsTransforming(true);
    // Spawn explosion particles
    const newParticles = Array.from({ length: 60 }, () => ({
      x: 0.5,
      y: 0.45,
      vx: (Math.random() - 0.5) * 0.03,
      vy: (Math.random() - 0.5) * 0.03,
      life: 1,
      hue: Math.random() * 360,
    }));
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [isRobot]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      timeRef.current += 0.016;

      // Smoothly animate progress toward target
      const speed = 0.02;
      const diff = targetRef.current - progressRef.current;
      if (Math.abs(diff) > 0.001) {
        progressRef.current += diff * speed * 3;
      } else {
        progressRef.current = targetRef.current;
        if (isTransforming) setIsTransforming(false);
      }

      const t = easeInOutBack(Math.max(0, Math.min(1, progressRef.current)));

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw holographic grid floor
      ctx.save();
      ctx.globalAlpha = 0.08;
      const gridY = h * 0.85;
      for (let i = -10; i <= 10; i++) {
        const xOff = w / 2 + i * 60 + (mx - 0.5) * 20;
        ctx.beginPath();
        ctx.moveTo(xOff, gridY - 40);
        ctx.lineTo(xOff + (i * 15), gridY + 40);
        ctx.strokeStyle = `hsl(${200 + i * 5}, 80%, 60%)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.1, gridY + j * 10 - 20);
        ctx.lineTo(w * 0.9, gridY + j * 10 - 20);
        ctx.strokeStyle = `hsl(220, 60%, 50%)`;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
      ctx.restore();

      // Draw morphing lines
      for (let i = 0; i < maxLen; i++) {
        const carLine = paddedCar[i];
        const robotLine = paddedRobot[i];

        const from = lerpPoint(carLine.from, robotLine.from, t);
        const to = lerpPoint(carLine.to, robotLine.to, t);

        // Parallax offset based on mouse
        const parallax = 0.015;
        const ox = (mx - 0.5) * parallax * w;
        const oy = (my - 0.5) * parallax * h;

        const x1 = from.x * w + ox;
        const y1 = from.y * h + oy;
        const x2 = to.x * w + ox;
        const y2 = to.y * h + oy;

        // Holographic color based on position and time
        const hue = (i * 7 + timeRef.current * 30) % 360;
        const saturation = 70 + Math.sin(timeRef.current * 2 + i) * 20;
        const lightness = 55 + Math.sin(timeRef.current * 3 + i * 0.5) * 15;

        // Main line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Glow layer
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsla(${hue}, 90%, 70%, 0.25)`;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Vertex dots
        ctx.beginPath();
        ctx.arc(x1, y1, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 80%, 0.8)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw scan line effect
      const scanY = (timeRef.current * 80) % h;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      const scanGrad = ctx.createLinearGradient(0, scanY, w, scanY);
      scanGrad.addColorStop(0, "hsla(180, 100%, 80%, 0)");
      scanGrad.addColorStop(0.3, "hsla(180, 100%, 80%, 0.08)");
      scanGrad.addColorStop(0.7, "hsla(280, 100%, 80%, 0.08)");
      scanGrad.addColorStop(1, "hsla(280, 100%, 80%, 0)");
      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015;
        p.vy += 0.0003; // gravity

        if (p.life <= 0) return false;

        const px = p.x * w;
        const py = p.y * h;

        ctx.beginPath();
        ctx.arc(px, py, p.life * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.life * 0.8})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 70%, ${p.life})`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        return true;
      });

      // Label
      ctx.save();
      ctx.font = "10px monospace";
      ctx.fillStyle = `hsla(0, 0%, 100%, 0.15)`;
      ctx.textAlign = "center";
      const label = t < 0.5 ? "[ VEHICLE MODE ]" : "[ ROBOT MODE ]";
      ctx.fillText(label, w / 2, h - 15);
      ctx.restore();

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [isTransforming, maxLen, paddedCar, paddedRobot]);

  return (
    <div className="relative">
      {/* Title */}
      <div className="text-center mb-8">
        <p className="font-mono text-[9px] tracking-[0.4em] text-muted-foreground/30 uppercase mb-2">
          [ Morphic Engine ]
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow mb-2">
          Transformer Sequence
        </h2>
        <p className="font-mono text-[10px] text-muted-foreground/40 max-w-md mx-auto">
          Click to initiate phase-shift transformation between vehicle and autonomous mech configurations.
        </p>
      </div>

      {/* Canvas container */}
      <div className="relative border border-border/30 overflow-hidden group">
        {/* Prismatic corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-border/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-border/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-border/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-border/20 pointer-events-none" />

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleTransform}
          className="w-full cursor-pointer"
          style={{ height: "420px" }}
        />

        {/* Holographic overlay gradient */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/40 via-transparent to-background/20" />
      </div>

      {/* Transform button */}
      <div className="flex justify-center mt-6">
        <motion.button
          onClick={handleTransform}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="font-mono text-[10px] tracking-[0.3em] uppercase border border-border/40 px-8 py-3 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all relative overflow-hidden group"
        >
          <span className="relative z-10">
            {isRobot ? "→ Vehicle Mode" : "→ Robot Mode"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </motion.button>
      </div>

      {/* Status indicator */}
      <AnimatePresence>
        {isTransforming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center mt-4"
          >
            <span className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground/30 uppercase animate-pulse">
              ◆ Transforming...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransformerMorph;
