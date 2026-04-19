"use client";
import { useState, useCallback, useMemo, useRef, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "@/lib/router-shim";
import { ArrowRight, Network, Brain, List, ExternalLink } from "lucide-react";
import { services } from "@/components/ServicesGrid";
import ContextGraphCanvas from "@/components/ContextGraphCanvas";

type ViewMode = "graph" | "neural" | "structured";

const serviceColors: Record<string, string> = {
  "AI Product": "#3B82F6",
  "AEO": "#8B5CF6",
  "Technical": "#EF4444",
  "Programmatic": "#06B6D4",
  "Editorial": "#10B981",
  "Performance": "#F59E0B",
};

interface GraphNode {
  id: string;
  label: string;
  slug: string;
  tagline: string;
  items: string[];
  color: string;
  x: number;
  y: number;
  r: number;
  children: { label: string; x: number; y: number; r: number }[];
}

function buildServiceNodes(): GraphNode[] {
  const cx = 400, cy = 320, orbitR = 200;
  return services.map((s, i) => {
    const angle = (i / services.length) * Math.PI * 2 - Math.PI / 2;
    const jitter = (i % 2 === 0 ? 1 : -1) * 20;
    const x = cx + Math.cos(angle) * (orbitR + jitter);
    const y = cy + Math.sin(angle) * (orbitR + jitter);
    const r = 28 + s.items.length * 1.5;
    const color = serviceColors[s.title] || "#888";
    const children = s.items.map((item, ci) => {
      const cAngle = angle + ((ci - (s.items.length - 1) / 2) * 0.45);
      const baseDist = r + 50 + ci * 12;
      const stagger = ci % 2 === 0 ? 18 : 0;
      return { label: item, x: x + Math.cos(cAngle) * (baseDist + stagger), y: y + Math.sin(cAngle) * (baseDist + stagger), r: 7 + Math.random() * 4 };
    });
    return { id: s.slug, label: s.title, slug: s.slug, tagline: s.tagline, items: s.items, color, x, y, r, children };
  });
}

// ── Neural Net Canvas ──
const NeuralSolutionsCanvas = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const dragRef = useRef<{ dragging: boolean; nodeIdx: number; offsetX: number; offsetY: number }>({ dragging: false, nodeIdx: -1, offsetX: 0, offsetY: 0 });
  const activeLayerRef = useRef<number>(-1);
  const hoveredChildRef = useRef<string | null>(null);
  const [activeService, setActiveService] = useState<{ title: string; slug: string; tagline: string; items: string[]; color: string; highlightItem?: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number; color: string } | null>(null);
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number; layer: number; label: string; color: string; isMain: boolean }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my, active: true };

      // Handle dragging
      if (dragRef.current.dragging && dragRef.current.nodeIdx >= 0) {
        const n = nodes[dragRef.current.nodeIdx];
        n.x = mx - dragRef.current.offsetX;
        n.y = my - dragRef.current.offsetY;
        n.vx = 0;
        n.vy = 0;
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const hitR = n.isMain ? 20 : 12;
        if (Math.hypot(n.x - mx, n.y - my) < hitR) {
          dragRef.current = { dragging: true, nodeIdx: i, offsetX: mx - n.x, offsetY: my - n.y };
          canvas.style.cursor = "grabbing";
          break;
        }
      }
    };
    const onMouseUp = () => {
      dragRef.current.dragging = false;
      dragRef.current.nodeIdx = -1;
      canvas.style.cursor = "pointer";
    };
    const onClick = (e: MouseEvent) => {
      if (dragRef.current.dragging) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const n of nodes) {
        if (!n.isMain) continue;
        if (Math.hypot(n.x - mx, n.y - my) < 30) {
          const s = services[n.layer];
          navigate(`/solutions/${s.slug}`);
          return;
        }
      }
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
      activeLayerRef.current = -1;
      dragRef.current.dragging = false;
      dragRef.current.nodeIdx = -1;
      setActiveService(null);
      setTooltip(null);
      canvas.style.cursor = "default";
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const layers = services.length;
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    const nodes: typeof nodesRef.current = [];

    // Responsive layout: if narrow, use 2 rows × 3 cols; otherwise 1 row × 6 cols
    const isMobile = cw < 600;
    const cols = isMobile ? 3 : layers;
    const rows = isMobile ? 2 : 1;

    services.forEach((s, li) => {
      const color = serviceColors[s.title] || "#888";
      const col = isMobile ? li % cols : li;
      const row = isMobile ? Math.floor(li / cols) : 0;
      const xBase = (cw / (cols + 1)) * (col + 1);
      const rowHeight = isMobile ? ch / rows : ch;
      const yBase = isMobile ? row * rowHeight + 40 : 50;
      nodes.push({ x: xBase, y: yBase, vx: 0, vy: 0, r: isMobile ? 8 : 10, layer: li, label: s.title, color, isMain: true });
      const itemCount = s.items.length;
      s.items.forEach((item, ci) => {
        const startY = yBase + (isMobile ? 40 : 55);
        const maxY = isMobile ? rowHeight - 20 : ch - 30;
        const spacingY = Math.min(isMobile ? 32 : 45, (maxY - startY) / itemCount);
        const xItem = xBase;
        const yItem = startY + ci * spacingY;
        nodes.push({ x: xItem, y: yItem, vx: 0, vy: 0, r: isMobile ? 3.5 : 5, layer: li, label: item, color, isMain: false });
      });
    });
    nodesRef.current = nodes;

    let lastCheck = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio;
      const rw = canvas.offsetWidth;
      const rh = canvas.offsetHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rw, rh);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseActive = mouseRef.current.active;
      const aLayer = activeLayerRef.current;

      // Physics: spring back to base positions with gentle wobble
      const isDragging = dragRef.current.dragging;
      const physicsTime = Date.now() * 0.001;
      for (let ni = 0; ni < nodes.length; ni++) {
        const n = nodes[ni];
        if (isDragging && ni === dragRef.current.nodeIdx) continue;

        // Compute base position (responsive)
        const isMob = rw < 600;
        const nCols = isMob ? 3 : layers;
        const nRows = isMob ? 2 : 1;
        const col = isMob ? n.layer % nCols : n.layer;
        const row = isMob ? Math.floor(n.layer / nCols) : 0;
        const xBase = (rw / (nCols + 1)) * (col + 1);
        const rowH = isMob ? rh / nRows : rh;
        let yBase: number;
        if (n.isMain) {
          yBase = isMob ? row * rowH + 40 : 50;
        } else {
          const childrenOfLayer = nodes.filter(nd => nd.layer === n.layer && !nd.isMain);
          const childIdx = childrenOfLayer.indexOf(n);
          const itemCount = childrenOfLayer.length;
          const startY = (isMob ? row * rowH + 40 : 50) + (isMob ? 40 : 55);
          const maxY = isMob ? rowH - 20 : rh - 30;
          const spacingY = Math.min(isMob ? 32 : 45, (maxY - startY) / itemCount);
          yBase = startY + childIdx * spacingY;
        }

        // Gentle idle wobble
        const wobbleX = Math.sin(physicsTime * 0.4 + ni * 1.7) * 2;
        const wobbleY = Math.cos(physicsTime * 0.35 + ni * 2.1) * 1.5;
        const targetX = xBase + wobbleX;
        const targetY = yBase + wobbleY;

        // Spring toward target
        n.vx += (targetX - n.x) * 0.04;
        n.vy += (targetY - n.y) * 0.04;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
      }

      // Update cursor
      if (!isDragging && mouseActive) {
        let overNode = false;
        for (const n of nodes) {
          const hitR = n.isMain ? 30 : 15;
          if (Math.hypot(n.x - mx, n.y - my) < hitR) { overNode = true; break; }
        }
        canvas.style.cursor = overNode ? "grab" : "default";
      }

      // Detect hovered node with strong hysteresis
      const now = Date.now();
      if (mouseActive && now - lastCheck > 100) {
        lastCheck = now;
        let foundLayer = -1;
        let foundChild: string | null = null;
        const currentLayer = activeLayerRef.current;

        // If already on a layer, use VERY generous stickiness
        if (currentLayer >= 0) {
          // Find the main node of current layer
          const mainNode = nodes.find(n => n.isMain && n.layer === currentLayer);
          if (mainNode) {
            // Stay active if mouse is within a wide column around the main node's X position
            const xDist = Math.abs(mx - mainNode.x);
            if (xDist < 120) {
              foundLayer = currentLayer;
              // Check if hovering a specific child
              for (const n of nodes) {
                if (n.isMain || n.layer !== currentLayer) continue;
                if (Math.hypot(n.x - mx, n.y - my) < 25) {
                  foundChild = n.label;
                  break;
                }
              }
            }
          }
        }

        // If not sticking to current, check for new main nodes
        if (foundLayer < 0) {
          for (const n of nodes) {
            if (!n.isMain) continue;
            if (Math.hypot(n.x - mx, n.y - my) < 40) {
              foundLayer = n.layer;
              break;
            }
          }
        }
        // Check child nodes
        if (foundLayer < 0) {
          for (const n of nodes) {
            if (n.isMain) continue;
            if (Math.hypot(n.x - mx, n.y - my) < 20) {
              foundLayer = n.layer;
              foundChild = n.label;
              break;
            }
          }
        }

        if (foundLayer !== activeLayerRef.current || foundChild !== hoveredChildRef.current) {
          activeLayerRef.current = foundLayer;
          hoveredChildRef.current = foundChild;
          if (foundLayer >= 0) {
            const s = services[foundLayer];
            setActiveService({ title: s.title, slug: s.slug, tagline: s.tagline, items: s.items, color: serviceColors[s.title] || "#888", highlightItem: foundChild || undefined });
          } else {
            setActiveService(null);
          }
          // Update tooltip for child nodes
          if (foundChild && foundLayer >= 0) {
            const childNode = nodes.find(n => !n.isMain && n.label === foundChild && n.layer === foundLayer);
            if (childNode) {
              const rect = canvas.getBoundingClientRect();
              setTooltip({ label: foundChild, x: childNode.x, y: childNode.y, color: serviceColors[services[foundLayer].title] || "#888" });
            } else {
              setTooltip(null);
            }
          } else {
            setTooltip(null);
          }
        }
      }

      // ── Draw connections ──
      // Same-layer connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          if (a.layer !== b.layer) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > 220) continue;
          const isActive = aLayer === a.layer;
          const alpha = (1 - dist / 220) * (isActive ? 0.4 : (aLayer >= 0 ? 0.03 : 0.12));
          ctx.strokeStyle = isActive ? a.color : "#ffffff";
          ctx.globalAlpha = alpha;
          ctx.lineWidth = isActive ? 1.2 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Cross-layer connections
      for (const a of nodes) {
        for (const b of nodes) {
          if (Math.abs(b.layer - a.layer) !== 1) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > 350) continue;
          const isActive = aLayer === a.layer || aLayer === b.layer;
          const alpha = (1 - dist / 350) * (isActive ? 0.15 : (aLayer >= 0 ? 0.02 : 0.04));
          ctx.strokeStyle = "#fff";
          ctx.globalAlpha = alpha;
          ctx.lineWidth = a.isMain && b.isMain ? 0.8 : 0.3;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // ── Draw nodes ──
      ctx.globalAlpha = 1;
      const hChild = hoveredChildRef.current;
      for (const n of nodes) {
        const isActive = aLayer === n.layer;
        const isDimmed = aLayer >= 0 && !isActive;
        const isHoveredChild = !n.isMain && hChild === n.label && isActive;
        const nodeColor = isActive ? n.color : "#ffffff";

        // Glow
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = isHoveredChild ? 0.2 : (isActive ? 0.1 : (isDimmed ? 0.008 : 0.025));
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (isHoveredChild ? 8 : 5), 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        const nodeScale = isHoveredChild ? 1.8 : (isActive && n.isMain ? 1.3 : 1);
        ctx.globalAlpha = n.isMain
          ? (isActive ? 0.9 : (isDimmed ? 0.1 : 0.4))
          : (isHoveredChild ? 0.9 : (isActive ? 0.7 : (isDimmed ? 0.06 : 0.2)));
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * nodeScale, 0, Math.PI * 2);
        ctx.fill();

        // Hovered child ring
        if (isHoveredChild) {
          ctx.strokeStyle = n.color;
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Main node labels
        if (n.isMain) {
          const isMob = canvas.offsetWidth < 600;
          ctx.globalAlpha = isActive ? 0.95 : (isDimmed ? 0.12 : 0.45);
          ctx.fillStyle = isActive ? n.color : "#ffffff";
          const mainFontSize = isMob ? (isActive ? 8 : 7) : (isActive ? 11 : 10);
          ctx.font = `700 ${mainFontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.fillText(n.label.toUpperCase(), n.x, n.y - (isMob ? 14 : 20));
          const count = services[n.layer]?.items.length || 0;
          ctx.globalAlpha = isActive ? 0.5 : (isDimmed ? 0.06 : 0.18);
          ctx.font = `400 ${isMob ? 6 : 8}px 'JetBrains Mono', monospace`;
          ctx.fillText(`${count} capabilities`, n.x, n.y - (isMob ? 5 : 9));
        }

        // Child node labels
        if (!n.isMain && isActive) {
          const isMob = canvas.offsetWidth < 600;
          const cw = canvas.offsetWidth;
          ctx.globalAlpha = isHoveredChild ? 1 : 0.85;
          ctx.fillStyle = n.color;
          const fontSize = isMob ? (isHoveredChild ? 9 : 8) : (isHoveredChild ? 13 : 11);
          ctx.font = `${isHoveredChild ? '700' : '500'} ${fontSize}px 'JetBrains Mono', monospace`;
          const maxLabelWidth = isMob ? 80 : 220;
          let displayLabel = n.label;
          if (ctx.measureText(displayLabel).width > maxLabelWidth && !isHoveredChild) {
            while (ctx.measureText(displayLabel + '…').width > maxLabelWidth && displayLabel.length > 3) {
              displayLabel = displayLabel.slice(0, -1);
            }
            displayLabel += '…';
          }
          const labelW = ctx.measureText(displayLabel).width;
          const labelOffset = isMob ? 10 : 16;
          const padding = 8;

          // Determine side: prefer alternating, but clamp to stay in canvas
          const parent = nodes.find(p => p.isMain && p.layer === n.layer);
          let preferLeft = parent ? n.x < parent.x : false;
          // Check if label fits on preferred side; if not, flip
          if (preferLeft) {
            const labelX = n.x - n.r * nodeScale - labelOffset;
            if (labelX - labelW < padding) preferLeft = false;
          } else {
            const labelX = n.x + n.r * nodeScale + labelOffset;
            if (labelX + labelW > cw - padding) preferLeft = true;
          }

          ctx.textAlign = preferLeft ? "right" : "left";
          const labelX = preferLeft
            ? n.x - n.r * nodeScale - labelOffset
            : n.x + n.r * nodeScale + labelOffset;

          ctx.strokeStyle = "rgba(0,0,0,0.8)";
          ctx.lineWidth = 3;
          ctx.strokeText(displayLabel, labelX, n.y + 4);
          ctx.fillText(displayLabel, labelX, n.y + 4);
        }
      }
      ctx.globalAlpha = 1;

      // Data signal particles
      const time = Date.now() * 0.001;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!a.isMain) continue;
        const isActive = aLayer === a.layer;
        if (aLayer >= 0 && !isActive) continue;
        for (let j = 0; j < nodes.length; j++) {
          const b = nodes[j];
          if (b.layer !== a.layer || b.isMain || i === j) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > 180) continue;
          const t = ((time * 0.5 + i * 0.3 + j * 0.1) % 1);
          ctx.fillStyle = isActive ? a.color : "#ffffff";
          ctx.globalAlpha = isActive ? 0.7 : 0.2;
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, isActive ? 2 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [navigate]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 640 }}>
      <canvas ref={canvasRef} className="w-full h-full cursor-default" style={{ minHeight: 640 }} />
      {/* Floating tooltip for child nodes */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="child-tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[60] pointer-events-none px-3 py-1.5 rounded-md border bg-background/95 backdrop-blur-lg shadow-xl"
            style={{
              left: tooltip.x + 16,
              top: tooltip.y - 12,
              borderColor: tooltip.color + '50',
              boxShadow: `0 4px 20px ${tooltip.color}20`,
            }}
          >
            <span className="font-mono text-xs font-semibold whitespace-nowrap" style={{ color: tooltip.color }}>
              {tooltip.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Info panel when hovering a domain — CLICKABLE */}
      <AnimatePresence mode="wait">
        {activeService && (
          <motion.div
            key="info-panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
            className="absolute top-4 right-4 z-50 max-w-xs border-2 bg-background/95 backdrop-blur-xl p-5 cursor-pointer group hover:bg-background transition-all shadow-2xl rounded-lg"
            style={{ borderColor: activeService.color + "50", boxShadow: `0 8px 32px ${activeService.color}15, 0 0 0 1px ${activeService.color}10` }}
            onClick={() => navigate(`/solutions/${activeService.slug}`)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <motion.span 
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeService.color }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <h3 className="font-display text-lg font-bold tracking-wide" style={{ color: activeService.color }}>
                  {activeService.title}
                </h3>
              </div>
              <ExternalLink size={12} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/70 mb-3 leading-relaxed">
              {activeService.tagline}
            </p>
            <div className="border-t border-border/50 pt-3 space-y-1.5">
              {activeService.items.map((item, i) => {
                const isHighlighted = activeService.highlightItem === item;
                return (
                  <motion.div 
                    key={item} 
                    className={`flex items-center gap-2 py-1 px-2 -mx-2 rounded transition-all ${isHighlighted ? 'bg-foreground/8' : 'hover:bg-foreground/3'}`}
                    animate={isHighlighted ? { x: [0, 3, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="font-mono text-[9px] w-4" style={{ color: isHighlighted ? activeService.color : undefined, opacity: isHighlighted ? 0.9 : 0.35 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`font-mono text-[11px] ${isHighlighted ? 'font-bold' : ''}`} style={{ color: isHighlighted ? activeService.color : undefined, opacity: isHighlighted ? 1 : 0.75 }}>{item}</span>
                    {isHighlighted && (
                      <motion.span 
                        className="font-mono text-[8px] ml-auto" 
                        style={{ color: activeService.color }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >●</motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="border-t border-border/50 mt-3 pt-3 flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase group-hover:opacity-100 opacity-70 transition-opacity" style={{ color: activeService.color }}>
              Explore {activeService.title} <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Legend — bottom left, below canvas content */}
      <div className="absolute bottom-4 left-4 z-40 pointer-events-none">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {services.map((s) => {
            const isActive = activeService?.title === s.title;
            return (
              <span
                key={s.slug}
                className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider transition-all duration-300"
                style={{ color: isActive ? serviceColors[s.title] : 'rgba(255,255,255,0.4)', opacity: activeService ? (isActive ? 1 : 0.25) : 0.5 }}
              >
                <span className="w-2 h-2 rounded-full transition-all duration-300" style={{ backgroundColor: isActive ? serviceColors[s.title] : 'rgba(255,255,255,0.3)' }} />
                {s.title} ({s.items.length})
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Structured View ──
const StructuredView = () => (
  <div className="space-y-6">
    {services.map((service, i) => (
      <motion.div
        key={service.slug}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08, duration: 0.4 }}
      >
        <Link
          to={`/solutions/${service.slug}`}
          className="group block border border-border p-6 sm:p-8 border-glow-hover hover:bg-secondary/20 transition-all"
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: serviceColors[service.title] }}
                />
                <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground group-hover:text-glow transition-all">
                  {service.title}
                </h3>
              </div>
              <p className="font-mono text-xs text-muted-foreground/50 mb-4 ml-7">{service.tagline}</p>
              <div className="flex flex-wrap gap-2 ml-7">
                {service.items.map((item) => (
                  <span key={item} className="font-mono text-[10px] border border-border px-3 py-1 text-muted-foreground/60">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-foreground transition-all mt-2 flex-shrink-0" />
          </div>
        </Link>
      </motion.div>
    ))}
  </div>
);

// ── JSON-LD for SEO ──
const JsonLdScript = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Venkata Pagadala — Enterprise Solutions",
    "provider": {
      "@type": "Person",
      "name": "Venkata Pagadala",
      "url": "https://venkatapagadala.com",
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Solutions",
      "itemListElement": services.map((s, i) => ({
        "@type": "Offer",
        "position": i + 1,
        "itemOffered": {
          "@type": "Service",
          "name": s.title,
          "description": s.tagline,
          "serviceType": s.items,
        },
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

// ── Main Component ──
const SolutionsGraph = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("neural");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredChild, setHoveredChild] = useState<{ label: string; x: number; y: number; parentColor: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const baseNodes = useMemo(() => buildServiceNodes(), []);
  const [nodePositions, setNodePositions] = useState<GraphNode[]>(() => buildServiceNodes());
  const nodes = nodePositions;
  const dragState = useRef<{ dragging: boolean; nodeId: string | null }>({ dragging: false, nodeId: null });
  const targetPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocities = useRef<Map<string, { vx: number; vy: number }>>(new Map());
  const childVelocities = useRef<Map<string, { vx: number; vy: number }>>(new Map());
  const animFrame = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  // Physics loop for jellyfish motion
  // Idle wobble offsets — computed each frame from time
  const idleTimeRef = useRef(0);

  useEffect(() => {
    const spring = 0.08;
    const damping = 0.75;
    const childSpring = 0.04;
    const childDamping = 0.7;

    const tick = () => {
      idleTimeRef.current += 0.016; // ~60fps
      const t = idleTimeRef.current;
      const dragging = dragState.current.dragging;

      setNodePositions(prev => {
        const next = prev.map((n, ni) => {
          const isDragTarget = dragging && n.id === dragState.current.nodeId;

          // Idle wobble: each node gets unique sine-based drift
          const wobbleX = Math.sin(t * 0.4 + ni * 1.7) * 3 + Math.sin(t * 0.7 + ni * 2.3) * 1.5;
          const wobbleY = Math.cos(t * 0.35 + ni * 2.1) * 2.5 + Math.cos(t * 0.6 + ni * 1.1) * 1.2;

          const baseNode = baseNodes.find(b => b.id === n.id)!;

          if (isDragTarget) {
            // Spring toward mouse
            const vel = velocities.current.get(n.id) || { vx: 0, vy: 0 };
            vel.vx = (vel.vx + (targetPos.current.x - n.x) * spring) * damping;
            vel.vy = (vel.vy + (targetPos.current.y - n.y) * spring) * damping;
            velocities.current.set(n.id, vel);
            const newX = n.x + vel.vx;
            const newY = n.y + vel.vy;

            const newChildren = n.children.map((c, ci) => {
              const key = `${n.id}-${ci}`;
              const cv = childVelocities.current.get(key) || { vx: 0, vy: 0 };
              const baseChild = baseNode.children[ci];
              const offsetX = baseChild ? baseChild.x - baseNode.x : 0;
              const offsetY = baseChild ? baseChild.y - baseNode.y : 0;
              const stiffness = childSpring * (1 - ci * 0.003);
              cv.vx = (cv.vx + (newX + offsetX - c.x) * stiffness) * childDamping;
              cv.vy = (cv.vy + (newY + offsetY - c.y) * stiffness) * childDamping;
              childVelocities.current.set(key, cv);
              return { ...c, x: c.x + cv.vx, y: c.y + cv.vy };
            });

            return { ...n, x: newX, y: newY, children: newChildren };
          } else {
            // Idle: gently float around base position
            const idleX = baseNode.x + wobbleX;
            const idleY = baseNode.y + wobbleY;
            const vel = velocities.current.get(n.id) || { vx: 0, vy: 0 };
            vel.vx = (vel.vx + (idleX - n.x) * 0.03) * 0.85;
            vel.vy = (vel.vy + (idleY - n.y) * 0.03) * 0.85;
            velocities.current.set(n.id, vel);
            const newX = n.x + vel.vx;
            const newY = n.y + vel.vy;

            const newChildren = n.children.map((c, ci) => {
              const childWobbleX = Math.sin(t * 0.3 + ni * 1.7 + ci * 0.9) * 2 + Math.sin(t * 0.55 + ci * 2.5) * 1;
              const childWobbleY = Math.cos(t * 0.25 + ni * 2.1 + ci * 1.3) * 1.8 + Math.cos(t * 0.5 + ci * 1.7) * 0.8;
              const baseChild = baseNode.children[ci];
              const targetCX = newX + (baseChild.x - baseNode.x) + childWobbleX;
              const targetCY = newY + (baseChild.y - baseNode.y) + childWobbleY;
              const key = `${n.id}-${ci}`;
              const cv = childVelocities.current.get(key) || { vx: 0, vy: 0 };
              cv.vx = (cv.vx + (targetCX - c.x) * 0.02) * 0.88;
              cv.vy = (cv.vy + (targetCY - c.y) * 0.02) * 0.88;
              childVelocities.current.set(key, cv);
              return { ...c, x: c.x + cv.vx, y: c.y + cv.vy };
            });

            return { ...n, x: newX, y: newY, children: newChildren };
          }
        });

        return next;
      });

      animFrame.current = requestAnimationFrame(tick);
    };

    animFrame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame.current);
  }, [baseNodes]);

  const handleDragStart = useCallback((e: ReactMouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pt = getSVGPoint(e.clientX, e.clientY);
    dragState.current = { dragging: true, nodeId };
    isDraggingRef.current = true;
    targetPos.current = pt;
    velocities.current.set(nodeId, { vx: 0, vy: 0 });
  }, [getSVGPoint]);

  const handleDragMove = useCallback((e: ReactMouseEvent) => {
    if (!dragState.current.dragging) return;
    targetPos.current = getSVGPoint(e.clientX, e.clientY);
  }, [getSVGPoint]);

  const handleDragEnd = useCallback(() => {
    dragState.current = { dragging: false, nodeId: null };
    setTimeout(() => { isDraggingRef.current = false; }, 800);
  }, []);
  const cx = 400, cy = 320;

  const handleChildHover = useCallback((e: ReactMouseEvent<SVGElement>, label: string, color: string) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoveredChild({ label, x, y, parentColor: color });
  }, []);

  const isActive = useCallback(
    (id: string) => hoveredNode === id || selectedNode?.id === id,
    [hoveredNode, selectedNode]
  );

  const totalServices = services.reduce((s, c) => s + c.items.length, 0);

  const views: { mode: ViewMode; icon: typeof Network; label: string }[] = [
    { mode: "graph", icon: Network, label: "Context Graph" },
    { mode: "neural", icon: Brain, label: "Neural Net" },
    { mode: "structured", icon: List, label: "Structured" },
  ];

  return (
    <div className="w-full">
      <JsonLdScript />

      {/* Stats bar + View toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border border-border p-4 gap-4">
        <div className="flex items-center gap-6">
          <h2 className="font-display text-xl font-bold text-foreground">
            <span className="text-muted-foreground">Solutions</span> Graph
          </h2>
          {/* View toggle */}
          <div className="flex border border-border">
            {views.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-all ${
                  viewMode === mode
                    ? "bg-foreground text-background"
                    : "text-muted-foreground/50 hover:text-foreground hover:bg-secondary/20"
                }`}
                title={label}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-6 sm:gap-8">
          {[
            { value: services.length.toString(), label: "DOMAINS" },
            { value: totalServices.toString(), label: "CAPABILITIES" },
            { value: "Enterprise", label: "SCALE" },
          ].map((stat) => (
            <div key={stat.label} className="text-right">
              <p className="font-mono text-sm font-bold text-foreground">{stat.value}</p>
              <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "structured" && (
          <motion.div key="structured" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <StructuredView />
          </motion.div>
        )}

        {viewMode === "neural" && (
          <motion.div key="neural" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="border border-border relative overflow-hidden" style={{ minHeight: 640 }}>
              <NeuralSolutionsCanvas />
              {/* Overlay labels */}
              <div className="absolute bottom-4 left-4 font-mono text-[9px] text-muted-foreground/30 tracking-widest uppercase">
                Neural Network Mode — {services.length} Layers × {totalServices} Nodes
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "graph" && (
          <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex gap-6">
              {/* Categories panel */}
              <div className="hidden lg:block w-56 flex-shrink-0 border border-border p-4">
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/50 uppercase mb-4">
                  Domains ▾
                </p>
                <div className="space-y-1">
                   {services.map((s, i) => {
                    return (
                      <div
                        key={s.slug}
                        className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-secondary/20 transition-all text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-muted-foreground/20" />
                        <span className="font-mono text-[11px] flex-1 text-muted-foreground/40">{s.title}</span>
                        <span className="font-mono text-[9px] text-muted-foreground/20">{s.items.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Graph */}
              <div className="flex-1 border border-border relative overflow-hidden" style={{ minHeight: 640 }}>
                <ContextGraphCanvas />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden semantic content for SEO/AI crawlers */}
      <div className="sr-only" aria-label="Solutions structured data">
        <h2>Solutions by Venkata Pagadala</h2>
        {services.map((s) => (
          <section key={s.slug} aria-label={s.title}>
            <h3>{s.title} — {s.tagline}</h3>
            <ul>
              {s.items.map((item) => (<li key={item}>{item}</li>))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SolutionsGraph;
