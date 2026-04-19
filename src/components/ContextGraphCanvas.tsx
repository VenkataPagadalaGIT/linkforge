"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "@/lib/router-shim";
import { ArrowRight, ExternalLink } from "lucide-react";
import { services } from "@/components/ServicesGrid";

const serviceColors: Record<string, string> = {
  "AI Product": "#3B82F6",
  "AEO": "#8B5CF6",
  "Technical": "#EF4444",
  "Programmatic": "#06B6D4",
  "Editorial": "#10B981",
  "Performance": "#F59E0B",
};

interface DomainNode {
  id: string;
  label: string;
  slug: string;
  tagline: string;
  items: string[];
  color: string;
  baseAngle: number;
  // Physics state
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface ChildNode {
  label: string;
  parentIdx: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  r: number;
  progress: number; // 0 = collapsed at parent, 1 = fully expanded
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface ActiveService {
  title: string;
  slug: string;
  tagline: string;
  items: string[];
  color: string;
  highlightItem?: string;
}

const ContextGraphCanvas = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  // State refs for animation loop
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const parallaxRef = useRef({ x: 0, y: 0 });
  const domainsRef = useRef<DomainNode[]>([]);
  const childrenRef = useRef<ChildNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const expandedRef = useRef<number>(-1);
  const hoveredDomainRef = useRef<number>(-1);
  const hoveredChildRef = useRef<number>(-1);
  const dragRef = useRef<{ active: boolean; idx: number; offsetX: number; offsetY: number }>({ active: false, idx: -1, offsetX: 0, offsetY: 0 });

  // React state for overlays
  const [activeService, setActiveService] = useState<ActiveService | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<number>(-1);

  // Hub center
  const centerRef = useRef({ x: 400, y: 320 });
  const orbitR = 180;

  const initGraph = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    centerRef.current = { x: cx, y: cy };

    // Build domain nodes in hexagonal ring
    const domains: DomainNode[] = services.map((s, i) => {
      const angle = (i / services.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * orbitR;
      const y = cy + Math.sin(angle) * orbitR;
      return {
        id: s.slug,
        label: s.title,
        slug: s.slug,
        tagline: s.tagline,
        items: s.items,
        color: serviceColors[s.title] || "#888",
        baseAngle: angle,
        x, y,
        vx: 0, vy: 0,
        r: 22,
      };
    });
    domainsRef.current = domains;

    // Build all children (initially collapsed at parent positions)
    const children: ChildNode[] = [];
    domains.forEach((d, di) => {
      d.items.forEach((item, ci) => {
        children.push({
          label: item,
          parentIdx: di,
          x: d.x, y: d.y,
          vx: 0, vy: 0,
          targetX: d.x, targetY: d.y,
          r: 4,
          progress: 0,
        });
      });
    });
    childrenRef.current = children;

    // Particles
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.15 + 0.03,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      if (domainsRef.current.length === 0) {
        initGraph(w, h);
      } else {
        // Update center
        centerRef.current = { x: w / 2, y: h / 2 };
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Compute child target positions for expanded domain
    const computeChildTargets = (domainIdx: number) => {
      const d = domainsRef.current[domainIdx];
      if (!d) return;
      const childNodes = childrenRef.current.filter(c => c.parentIdx === domainIdx);
      const count = childNodes.length;
      const awayAngle = Math.atan2(d.y - centerRef.current.y, d.x - centerRef.current.x);
      const arcSpread = Math.PI * 0.85;
      childNodes.forEach((child, ci) => {
        const angleOffset = count === 1 ? 0 : (ci / (count - 1) - 0.5) * arcSpread;
        const angle = awayAngle + angleOffset;
        const dist = 70 + ci * 12;
        child.targetX = d.x + Math.cos(angle) * dist;
        child.targetY = d.y + Math.sin(angle) * dist;
      });
    };

    const collapseAllChildren = () => {
      childrenRef.current.forEach(c => {
        const d = domainsRef.current[c.parentIdx];
        c.targetX = d.x;
        c.targetY = d.y;
      });
    };

    // Hit testing
    const hitTestDomain = (mx: number, my: number): number => {
      for (let i = 0; i < domainsRef.current.length; i++) {
        const d = domainsRef.current[i];
        if (Math.hypot(d.x - mx, d.y - my) < d.r + 8) return i;
      }
      return -1;
    };

    const hitTestChild = (mx: number, my: number): number => {
      const expanded = expandedRef.current;
      if (expanded < 0) return -1;
      for (let i = 0; i < childrenRef.current.length; i++) {
        const c = childrenRef.current[i];
        if (c.parentIdx !== expanded) continue;
        if (c.progress < 0.3) continue;
        if (Math.hypot(c.x - mx, c.y - my) < c.r + 8) return i;
      }
      return -1;
    };

    const hitTestHub = (mx: number, my: number): boolean => {
      return Math.hypot(mx - centerRef.current.x, my - centerRef.current.y) < 30;
    };

    // Event handlers
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my, active: true };

      // Parallax
      parallaxRef.current = {
        x: (mx - w / 2) * 0.015,
        y: (my - h / 2) * 0.015,
      };

      if (dragRef.current.active) {
        const d = domainsRef.current[dragRef.current.idx];
        if (d) {
          const tx = mx - dragRef.current.offsetX;
          const ty = my - dragRef.current.offsetY;
          d.vx += (tx - d.x) * 0.08;
          d.vy += (ty - d.y) * 0.08;
        }
        return;
      }

      // Hover detection
      const di = hitTestDomain(mx, my);
      const ci = hitTestChild(mx, my);
      hoveredDomainRef.current = di;
      hoveredChildRef.current = ci;

      canvas.style.cursor = di >= 0 || ci >= 0 ? "pointer" : "default";

      // Update overlay
      if (di >= 0) {
        const s = services[di];
        setActiveService({
          title: s.title, slug: s.slug, tagline: s.tagline,
          items: s.items, color: serviceColors[s.title] || "#888",
        });
      } else if (expandedRef.current < 0) {
        setActiveService(null);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const di = hitTestDomain(mx, my);
      if (di >= 0) {
        dragRef.current = { active: true, idx: di, offsetX: mx - domainsRef.current[di].x, offsetY: my - domainsRef.current[di].y };
        canvas.style.cursor = "grabbing";
      }
    };

    let dragMoved = false;
    const onMouseMoveDrag = () => {
      if (dragRef.current.active) dragMoved = true;
    };
    canvas.addEventListener("mousemove", onMouseMoveDrag);

    const onMouseUp = () => {
      if (dragRef.current.active && !dragMoved) {
        // It was a click, not a drag
      }
      dragRef.current.active = false;
      dragMoved = false;
      canvas.style.cursor = "default";
    };

    const onClick = (e: MouseEvent) => {
      if (dragMoved) { dragMoved = false; return; }
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const di = hitTestDomain(mx, my);
      if (di >= 0) {
        if (expandedRef.current === di) {
          // Collapse
          expandedRef.current = -1;
          setSelectedDomain(-1);
          collapseAllChildren();
          setActiveService(null);
        } else {
          // Expand this domain
          expandedRef.current = di;
          setSelectedDomain(di);
          collapseAllChildren();
          computeChildTargets(di);
          const s = services[di];
          setActiveService({
            title: s.title, slug: s.slug, tagline: s.tagline,
            items: s.items, color: serviceColors[s.title] || "#888",
          });
        }
        return;
      }

      const ci = hitTestChild(mx, my);
      if (ci >= 0) {
        const child = childrenRef.current[ci];
        const parentD = domainsRef.current[child.parentIdx];
        setActiveService(prev => prev ? { ...prev, highlightItem: child.label } : null);
        return;
      }

      if (hitTestHub(mx, my)) {
        return; // hub click does nothing special
      }

      // Background click — collapse
      expandedRef.current = -1;
      setSelectedDomain(-1);
      collapseAllChildren();
      setActiveService(null);
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
      hoveredDomainRef.current = -1;
      hoveredChildRef.current = -1;
      dragRef.current.active = false;
      if (expandedRef.current < 0) setActiveService(null);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onMouseLeave);

    // ── DRAW LOOP ──
    const draw = () => {
      const dpr = window.devicePixelRatio;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      timeRef.current += 0.016;
      const t = timeRef.current;
      const px = parallaxRef.current.x;
      const py = parallaxRef.current.y;
      const cx = centerRef.current.x;
      const cy = centerRef.current.y;
      const expanded = expandedRef.current;
      const hoveredD = hoveredDomainRef.current;
      const hoveredC = hoveredChildRef.current;

      // 1. Background grid with parallax
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      const gridSize = 50;
      const offsetX = (px * 2) % gridSize;
      const offsetY = (py * 2) % gridSize;
      for (let x = offsetX; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = offsetY; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Ambient particles
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x + px, p.y + py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });

      // Particle connections
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x + px, particles[i].y + py);
            ctx.lineTo(particles[j].x + px, particles[j].y + py);
            ctx.strokeStyle = `rgba(255,255,255,${0.03 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }

      const domains = domainsRef.current;
      const children = childrenRef.current;

      // 3. Physics: update domain positions (idle wobble + drag)
      domains.forEach((d, i) => {
        if (dragRef.current.active && dragRef.current.idx === i) {
          // Drag physics: damping
          d.vx *= 0.75;
          d.vy *= 0.75;
          d.x += d.vx;
          d.y += d.vy;
        } else {
          // Idle wobble toward base position
          const baseX = cx + Math.cos(d.baseAngle) * orbitR;
          const baseY = cy + Math.sin(d.baseAngle) * orbitR;
          const wobbleX = Math.sin(t * 0.4 + i * 1.7) * 4 + Math.sin(t * 0.7 + i * 2.3) * 2;
          const wobbleY = Math.cos(t * 0.35 + i * 2.1) * 3.5 + Math.cos(t * 0.6 + i * 1.1) * 1.5;
          const targetX = baseX + wobbleX;
          const targetY = baseY + wobbleY;
          d.vx += (targetX - d.x) * 0.03;
          d.vy += (targetY - d.y) * 0.03;
          d.vx *= 0.88;
          d.vy *= 0.88;
          d.x += d.vx;
          d.y += d.vy;
        }
      });

      // 4. Physics: update children (spring toward target with staggered jellyfish)
      children.forEach((c, ci) => {
        const d = domains[c.parentIdx];
        const isExpanded = expanded === c.parentIdx;
        
        if (isExpanded) {
          c.progress = Math.min(1, c.progress + 0.04);
          const childIdx = children.filter(ch => ch.parentIdx === c.parentIdx).indexOf(c);
          const count = d.items.length;
          const awayAngle = Math.atan2(d.y - cy, d.x - cx);
          const arcSpread = Math.PI * 0.85;
          const angleOffset = count === 1 ? 0 : (childIdx / (count - 1) - 0.5) * arcSpread;
          const angle = awayAngle + angleOffset;
          const dist = 70 + childIdx * 12;
          c.targetX = d.x + Math.cos(angle) * dist;
          c.targetY = d.y + Math.sin(angle) * dist;
        } else {
          c.progress = Math.max(0, c.progress - 0.06);
          c.targetX = d.x;
          c.targetY = d.y;
        }

        // Jellyfish spring with stagger
        const childIdx = children.filter(ch => ch.parentIdx === c.parentIdx).indexOf(c);
        const stiffness = 0.06 * (1 - childIdx * 0.004);
        const wobbleX = Math.sin(t * 0.3 + ci * 0.9) * 1.5 * c.progress;
        const wobbleY = Math.cos(t * 0.25 + ci * 1.3) * 1.2 * c.progress;
        c.vx += (c.targetX + wobbleX - c.x) * stiffness;
        c.vy += (c.targetY + wobbleY - c.y) * stiffness;
        c.vx *= 0.82;
        c.vy *= 0.82;
        c.x += c.vx;
        c.y += c.vy;
      });

      // 5. Draw hub-to-domain connections
      domains.forEach((d, i) => {
        const isExp = expanded === i;
        const isHov = hoveredD === i;
        const isDimmed = expanded >= 0 && !isExp;
        const isActive = isExp || isHov;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = isActive ? d.color : "rgba(255,255,255,0.08)";
        ctx.globalAlpha = isDimmed ? 0.03 : (isExp ? 0.5 : (isHov ? 0.4 : 0.12));
        ctx.lineWidth = isExp ? 1.5 : (isHov ? 1.2 : 0.6);
        ctx.setLineDash(isActive ? [] : [4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Traveling energy pulse
        if (!isDimmed) {
          const pulseT = ((t * 0.3 + i * 0.5) % 1);
          const pulseX = cx + (d.x - cx) * pulseT;
          const pulseY = cy + (d.y - cy) * pulseT;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, isExp ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? d.color : "#ffffff";
          ctx.globalAlpha = isActive ? 0.6 : 0.15;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // 6. Draw inter-domain faint connections (adjacent)
      for (let i = 0; i < domains.length; i++) {
        const j = (i + 1) % domains.length;
        const a = domains[i], b = domains[j];
        const bothDimmed = expanded >= 0 && expanded !== i && expanded !== j;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.globalAlpha = bothDimmed ? 0.01 : 0.04;
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 7. Draw parent-to-child lines + child nodes (color only when expanded)
      children.forEach((c, ci) => {
        if (c.progress < 0.01) return;
        const d = domains[c.parentIdx];
        const parentActive = expanded === c.parentIdx;
        const childColor = parentActive ? d.color : "#ffffff";

        // Line from parent to child
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = childColor;
        ctx.globalAlpha = c.progress * 0.35;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Child glow
        const isHovChild = hoveredC === ci;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * (isHovChild ? 6 : 3.5), 0, Math.PI * 2);
        ctx.fillStyle = childColor;
        ctx.globalAlpha = c.progress * (isHovChild ? 0.15 : 0.06);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Child node
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * (isHovChild ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fillStyle = childColor;
        ctx.globalAlpha = c.progress * (isHovChild ? 0.9 : 0.7);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label (fade in after progress > 0.5)
        if (c.progress > 0.5) {
          const labelAlpha = (c.progress - 0.5) * 2;
          ctx.globalAlpha = labelAlpha * (isHovChild ? 1 : 0.75);
          ctx.fillStyle = childColor;
          ctx.font = `${isHovChild ? '700' : '500'} ${isHovChild ? 11 : 9}px 'JetBrains Mono', monospace`;
          // Position label away from center
          const awayAngle = Math.atan2(c.y - cy, c.x - cx);
          const labelDist = c.r * 2 + 6;
          const lx = c.x + Math.cos(awayAngle) * labelDist;
          const ly = c.y + Math.sin(awayAngle) * labelDist;
          ctx.textAlign = Math.cos(awayAngle) > 0 ? "left" : "right";
          ctx.textBaseline = "middle";
          // Background stroke for readability
          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.lineWidth = 2.5;
          ctx.strokeText(c.label, lx, ly);
          ctx.fillText(c.label, lx, ly);
          ctx.globalAlpha = 1;
        }
      });

      // 8. Draw domain nodes
      domains.forEach((d, i) => {
        const isExp = expanded === i;
        const isHov = hoveredD === i;
        const isDimmed = expanded >= 0 && !isExp;
        const isActive = isExp || isHov;
        const breathe = Math.sin(t * 1.2 + i * 1.5) * 2;
        const nodeColor = isActive ? d.color : "#ffffff";

        // Outer glow halo
        const glowR = d.r + 12 + breathe;
        ctx.beginPath();
        ctx.arc(d.x, d.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = isDimmed ? 0.01 : (isExp ? 0.08 : (isHov ? 0.06 : 0.015));
        ctx.fill();
        ctx.globalAlpha = 1;

        // Hollow circle (stroke)
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = isExp ? 2.5 : (isHov ? 2 : 1);
        ctx.globalAlpha = isDimmed ? 0.12 : (isExp ? 0.9 : (isHov ? 0.8 : 0.25));
        ctx.stroke();

        // Fill on hover/expand
        if (isActive) {
          ctx.fillStyle = d.color;
          ctx.globalAlpha = isExp ? 0.15 : 0.08;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = isDimmed ? 0.15 : (isExp ? 1 : (isHov ? 0.9 : 0.35));
        ctx.font = `700 ${isExp ? 11 : 10}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 2;
        ctx.strokeText(d.label.toUpperCase(), d.x, d.y - d.r - 14);
        ctx.fillText(d.label.toUpperCase(), d.x, d.y - d.r - 14);

        // Capability count
        ctx.globalAlpha = isDimmed ? 0.08 : (isExp ? 0.6 : 0.2);
        ctx.font = "400 8px 'JetBrains Mono', monospace";
        ctx.strokeText(`${d.items.length} capabilities`, d.x, d.y - d.r - 3);
        ctx.fillText(`${d.items.length} capabilities`, d.x, d.y - d.r - 3);
        ctx.globalAlpha = 1;
      });

      // 9. Draw hub
      const hubBreath = Math.sin(t * 0.8) * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 28 + hubBreath, 0, Math.PI * 2);
      ctx.strokeStyle = expanded >= 0 ? domains[expanded].color : "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = expanded >= 0 ? domains[expanded].color : "rgba(255,255,255,0.3)";
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "700 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SOLUTIONS", cx, cy - 1);

      ctx.font = "400 7px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillText("CONSTELLATION", cx, cy + 40 + hubBreath);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousemove", onMouseMoveDrag);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [initGraph, navigate]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: 640 }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: 640 }} />

      {/* Info panel overlay */}
      <AnimatePresence mode="wait">
        {activeService && (
          <motion.div
            key={`panel-${activeService.slug}`}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
            className="absolute top-4 right-4 z-50 max-w-xs w-72 border-2 bg-background/95 backdrop-blur-xl p-5 cursor-pointer group hover:bg-background transition-all shadow-2xl rounded-lg"
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-40">
        <div className="flex flex-wrap gap-3">
          {services.map((s, i) => {
            const isActive = selectedDomain === i;
            return (
              <button
                key={s.slug}
                onClick={() => {
                  if (expandedRef.current === i) {
                    expandedRef.current = -1;
                    setSelectedDomain(-1);
                    setActiveService(null);
                  } else {
                    expandedRef.current = i;
                    setSelectedDomain(i);
                    setActiveService({
                      title: s.title, slug: s.slug, tagline: s.tagline,
                      items: s.items, color: serviceColors[s.title] || "#888",
                    });
                  }
                }}
                className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider cursor-pointer hover:opacity-100 transition-all duration-300"
                style={{
                  color: isActive ? serviceColors[s.title] : "rgba(255,255,255,0.5)",
                  opacity: selectedDomain >= 0 ? (isActive ? 1 : 0.25) : 0.6
                }}
              >
                <span
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ backgroundColor: isActive ? serviceColors[s.title] : "rgba(255,255,255,0.4)" }}
                />
                {s.title}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[8px] text-muted-foreground/20 mt-2 tracking-widest uppercase pointer-events-none">
          Click domain to explore · Drag to move · Click background to reset
        </p>
      </div>
    </div>
  );
};

export default ContextGraphCanvas;
