"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface CardData {
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  description: string;
  tags: string[];
  phase: number; // 0-1 representing "4th dimension" position
}

const cards: CardData[] = [
  {
    title: "Omniscite",
    subtitle: "Neural Agent Orchestration",
    metric: "12",
    metricLabel: "Agents",
    description: "Multi-agent system that coordinates autonomous AI workers across complex enterprise workflows.",
    tags: ["LLM", "Agents", "RAG"],
    phase: 0,
  },
  {
    title: "Knowledge Graph",
    subtitle: "Semantic Taxonomy Engine",
    metric: "50K+",
    metricLabel: "Nodes",
    description: "Self-evolving knowledge graph that maps relationships across AI research, patents, and market data.",
    tags: ["NLP", "Graph DB", "ML"],
    phase: 0.25,
  },
  {
    title: "Context Graph",
    subtitle: "Service Domain Mapper",
    metric: "200+",
    metricLabel: "Domains",
    description: "Visual intelligence system that maps service relationships and reveals hidden market opportunities.",
    tags: ["Viz", "D3", "Canvas"],
    phase: 0.5,
  },
  {
    title: "SearchOS",
    subtitle: "Enterprise Search Platform",
    metric: "404K+",
    metricLabel: "Impressions",
    description: "AI-powered search orchestration layer that unifies organic, paid, and agentic search channels.",
    tags: ["SEO", "AI Search", "Automation"],
    phase: 0.75,
  },
];

const HolographicCard = ({ card, index }: { card: CardData; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { stiffness: 200, damping: 30 });

  // Holographic gradient position
  const gradX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const gradY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // 4D phase shift animation
  const phaseOffset = card.phase * Math.PI * 2;

  return (
    <motion.div
      className="relative group"
      style={{ perspective: 1200 }}
      initial={{ opacity: 0, y: 60, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 4D Phase Shadow — the "shadow" in the 4th dimension */}
      <motion.div
        className="absolute -inset-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: isHovered
            ? `conic-gradient(from ${phaseOffset}rad, transparent, rgba(255,255,255,0.03), transparent, rgba(255,255,255,0.05), transparent)`
            : "none",
          filter: "blur(20px)",
        }}
      />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative border border-border bg-card cursor-crosshair overflow-hidden"
      >
        {/* Holographic refraction overlay */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
          style={{
            background: useTransform(
              [gradX, gradY],
              ([x, y]) =>
                `linear-gradient(${135 + (x as number) * 0.5}deg, 
                  transparent ${20 + (y as number) * 0.3}%, 
                  rgba(255,255,255,0.03) ${40 + (x as number) * 0.2}%, 
                  rgba(200,200,255,0.06) ${50 + (y as number) * 0.1}%, 
                  rgba(255,220,200,0.04) ${60 + (x as number) * 0.3}%, 
                  transparent ${80 + (y as number) * 0.2}%)`
            ),
          }}
        />

        {/* Scan line effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          }}
        />

        {/* Prismatic edge light */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            boxShadow: isHovered
              ? `inset 0 0 30px rgba(255,255,255,0.03), 
                 inset 1px 0 0 rgba(200,220,255,0.1),
                 inset -1px 0 0 rgba(255,200,180,0.08),
                 inset 0 1px 0 rgba(200,255,200,0.06),
                 inset 0 -1px 0 rgba(220,200,255,0.06)`
              : "none",
          }}
        />

        {/* Card content */}
        <div className="relative z-5 p-8" style={{ transform: "translateZ(0)" }}>
          {/* Phase indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-8 h-8">
              {/* 4D tesseract wireframe icon */}
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <motion.rect
                  x="4" y="4" width="16" height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors duration-500"
                  animate={isHovered ? { rotate: 45, scale: 0.8 } : { rotate: 0, scale: 1 }}
                  style={{ transformOrigin: "12px 12px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.rect
                  x="12" y="12" width="16" height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-muted-foreground/20 group-hover:text-foreground/40 transition-colors duration-500"
                  animate={isHovered ? { rotate: -45, scale: 1.1 } : { rotate: 0, scale: 1 }}
                  style={{ transformOrigin: "20px 20px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Connecting lines (4th dimension edges) */}
                <motion.line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="0.3"
                  className="text-muted-foreground/15 group-hover:text-foreground/30 transition-colors duration-500" />
                <motion.line x1="20" y1="4" x2="28" y2="12" stroke="currentColor" strokeWidth="0.3"
                  className="text-muted-foreground/15 group-hover:text-foreground/30 transition-colors duration-500" />
                <motion.line x1="4" y1="20" x2="12" y2="28" stroke="currentColor" strokeWidth="0.3"
                  className="text-muted-foreground/15 group-hover:text-foreground/30 transition-colors duration-500" />
                <motion.line x1="20" y1="20" x2="28" y2="28" stroke="currentColor" strokeWidth="0.3"
                  className="text-muted-foreground/15 group-hover:text-foreground/30 transition-colors duration-500" />
              </svg>
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground/40 uppercase">
                Phase {(card.phase * 360).toFixed(0)}°
              </p>
            </div>
          </div>

          {/* Title block */}
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 tracking-tight">
            {card.title}
          </h3>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-6">
            {card.subtitle}
          </p>

          {/* Metric */}
          <div className="mb-6">
            <motion.span
              className="font-display text-5xl font-bold text-foreground inline-block"
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {card.metric}
            </motion.span>
            <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground/40 uppercase mt-1">
              {card.metricLabel}
            </p>
          </div>

          {/* Description */}
          <p className="font-mono text-xs text-muted-foreground/60 leading-relaxed mb-6 max-w-sm">
            {card.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag, i) => (
              <motion.span
                key={tag}
                className="font-mono text-[9px] tracking-wider uppercase px-3 py-1 border border-border text-muted-foreground/40 group-hover:text-muted-foreground/70 group-hover:border-foreground/20 transition-all duration-500"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + i * 0.05 + 0.5 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>

          {/* Phase shift line — the "4th dimension" visual */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{
              background: isHovered
                ? `linear-gradient(90deg, transparent, rgba(200,220,255,0.3) ${card.phase * 100}%, rgba(255,200,180,0.2), transparent)`
                : "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
            }}
            animate={isHovered ? { scaleX: [1, 1.02, 1], opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

const HolographicCards = () => {
  const [time, setTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    const tick = () => {
      setTime((t) => t + 0.005);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Ambient 4D grid — represents the tesseract projection */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-[0.02]" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 50}
              x2="1000"
              y2={i * 50}
              stroke="white"
              strokeWidth="0.5"
              style={{
                transform: `translateY(${Math.sin(time + i * 0.3) * 5}px)`,
              }}
            />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 50}
              y1="0"
              x2={i * 50 + Math.sin(time + i * 0.2) * 20}
              y2="1000"
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {cards.map((card, index) => (
          <HolographicCard key={card.title} card={card} index={index} />
        ))}
      </div>

      {/* 4D Dimension label */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p className="font-mono text-[9px] tracking-[0.5em] text-muted-foreground/20 uppercase">
          Phase Space · W-Axis Projection · 4D → 3D
        </p>
      </motion.div>
    </div>
  );
};

export default HolographicCards;
