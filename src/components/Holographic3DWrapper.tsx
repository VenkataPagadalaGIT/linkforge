"use client";
import { useRef, useState, useCallback, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface Holographic3DWrapperProps {
  children: ReactNode;
  className?: string;
  phase?: number; // 0-1 for unique phase angle
  intensity?: "subtle" | "medium" | "strong";
}

const intensityConfig = {
  subtle: { tilt: 8, refraction: 0.03, glow: 0.02 },
  medium: { tilt: 12, refraction: 0.05, glow: 0.04 },
  strong: { tilt: 15, refraction: 0.07, glow: 0.06 },
};

const Holographic3DWrapper = ({
  children,
  className = "",
  phase = 0,
  intensity = "medium",
}: Holographic3DWrapperProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const config = intensityConfig[intensity];

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [config.tilt, -config.tilt]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-config.tilt, config.tilt]), {
    stiffness: 200,
    damping: 30,
  });

  const gradX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const gradY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const phaseOffset = phase * Math.PI * 2;

  return (
    <motion.div className="relative group" style={{ perspective: 1200 }}>
      {/* 4D phase shadow */}
      <motion.div
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: isHovered
            ? `conic-gradient(from ${phaseOffset}rad, transparent, rgba(255,255,255,${config.glow}), transparent, rgba(255,255,255,${config.glow * 1.5}), transparent)`
            : "none",
          filter: "blur(16px)",
        }}
      />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative overflow-hidden ${className}`}
      >
        {/* Holographic refraction overlay */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[5]"
          style={{
            background: useTransform(
              [gradX, gradY],
              ([x, y]) =>
                `linear-gradient(${135 + (x as number) * 0.5}deg, 
                  transparent ${20 + (y as number) * 0.3}%, 
                  rgba(255,255,255,${config.refraction}) ${40 + (x as number) * 0.2}%, 
                  rgba(200,200,255,${config.refraction * 1.5}) ${50 + (y as number) * 0.1}%, 
                  rgba(255,220,200,${config.refraction}) ${60 + (x as number) * 0.3}%, 
                  transparent ${80 + (y as number) * 0.2}%)`
            ),
          }}
        />

        {/* Scan lines */}
        <div
          className="absolute inset-0 pointer-events-none z-[5] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
          }}
        />

        {/* Prismatic edge light */}
        <div
          className="absolute inset-0 pointer-events-none z-[6] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            boxShadow: isHovered
              ? `inset 1px 0 0 rgba(200,220,255,0.08),
                 inset -1px 0 0 rgba(255,200,180,0.06),
                 inset 0 1px 0 rgba(200,255,200,0.04),
                 inset 0 -1px 0 rgba(220,200,255,0.04)`
              : "none",
          }}
        />

        {/* Phase shift bottom line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px] z-[6]"
          style={{
            background: isHovered
              ? `linear-gradient(90deg, transparent, rgba(200,220,255,0.2) ${phase * 100}%, rgba(255,200,180,0.15), transparent)`
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
          }}
          animate={isHovered ? { scaleX: [1, 1.02, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Children */}
        <div className="relative z-[1]">{children}</div>
      </motion.div>
    </motion.div>
  );
};

export default Holographic3DWrapper;
