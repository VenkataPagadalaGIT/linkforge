"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { aiContributors, SEGMENT_COLORS, type AIContributor } from "@/data/aiContributors";

interface Props {
  onSelect: (contributor: AIContributor) => void;
  selectedId?: string;
  filterSegment?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  contributor: AIContributor;
  color: string;
  alpha: number;
}

interface SegmentCluster {
  segment: string;
  cx: number;
  cy: number;
  color: string;
}

const AIContributorGraph = ({ onSelect, selectedId, filterSegment }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const clustersRef = useRef<SegmentCluster[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const animFrameRef = useRef<number>(0);
  const [hoveredContributor, setHoveredContributor] = useState<AIContributor | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const initNodes = useCallback((width: number, height: number) => {
    const filtered = filterSegment
      ? aiContributors.filter((c) => c.segment === filterSegment)
      : aiContributors;

    // Group by segment
    const segments = [...new Set(filtered.map((c) => c.segment))];
    const centerX = width / 2;
    const centerY = height / 2;
    const orbitRadius = Math.min(width, height) * 0.32;

    const clusters: SegmentCluster[] = segments.map((seg, i) => {
      const angle = (i / segments.length) * Math.PI * 2 - Math.PI / 2;
      return {
        segment: seg,
        cx: centerX + Math.cos(angle) * orbitRadius,
        cy: centerY + Math.sin(angle) * orbitRadius,
        color: SEGMENT_COLORS[seg] || "#888",
      };
    });
    clustersRef.current = clusters;

    const nodes: Node[] = [];
    segments.forEach((seg) => {
      const cluster = clusters.find((c) => c.segment === seg)!;
      const members = filtered.filter((c) => c.segment === seg);
      members.forEach((contributor, j) => {
        const burstAngle = (j / members.length) * Math.PI * 2 + Math.random() * 0.3;
        const burstRadius = 30 + Math.random() * 50 + (members.length > 3 ? j * 8 : j * 15);
        const baseRadius = Math.max(6, 16 - contributor.rank * 0.1);
        nodes.push({
          id: contributor.id,
          x: centerX + (Math.random() - 0.5) * 50,
          y: centerY + (Math.random() - 0.5) * 50,
          targetX: cluster.cx + Math.cos(burstAngle) * burstRadius,
          targetY: cluster.cy + Math.sin(burstAngle) * burstRadius,
          radius: baseRadius,
          contributor,
          color: cluster.color,
          alpha: 0,
        });
      });
    });
    nodesRef.current = nodes;
  }, [filterSegment]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nodes = nodesRef.current;
    const clusters = clustersRef.current;

    // Animate positions
    nodes.forEach((node) => {
      node.x += (node.targetX - node.x) * 0.06;
      node.y += (node.targetY - node.y) * 0.06;
      node.alpha = Math.min(1, node.alpha + 0.02);
    });

    // Draw cluster connections (lines from center to cluster)
    const centerX = w / 2;
    const centerY = h / 2;
    clusters.forEach((cluster) => {
      ctx.beginPath();
      ctx.moveTo(centerX * dpr, centerY * dpr);
      ctx.lineTo(cluster.cx * dpr, cluster.cy * dpr);
      ctx.strokeStyle = `${cluster.color}15`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw segment labels
    clusters.forEach((cluster) => {
      ctx.save();
      ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
      ctx.fillStyle = `${cluster.color}60`;
      ctx.textAlign = "center";
      const label = cluster.segment.length > 20 ? cluster.segment.slice(0, 18) + "…" : cluster.segment;
      ctx.fillText(label.toUpperCase(), cluster.cx * dpr, (cluster.cy - 65) * dpr);
      ctx.restore();
    });

    // Draw connection lines between nodes in same cluster
    clusters.forEach((cluster) => {
      const clusterNodes = nodes.filter((n) => n.contributor.segment === cluster.segment);
      for (let i = 0; i < clusterNodes.length; i++) {
        const a = clusterNodes[i];
        ctx.beginPath();
        ctx.moveTo(a.x * dpr, a.y * dpr);
        ctx.lineTo(cluster.cx * dpr, cluster.cy * dpr);
        ctx.strokeStyle = `${cluster.color}${Math.round(a.alpha * 12).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredRef.current === node.id;
      const isSelected = selectedId === node.id;
      const r = isHovered || isSelected ? node.radius * 1.5 : node.radius;

      // Glow
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x * dpr, node.y * dpr, (r + 8) * dpr, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          node.x * dpr, node.y * dpr, r * dpr * 0.5,
          node.x * dpr, node.y * dpr, (r + 8) * dpr
        );
        grad.addColorStop(0, `${node.color}40`);
        grad.addColorStop(1, `${node.color}00`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(node.x * dpr, node.y * dpr, r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isHovered || isSelected
        ? node.color
        : `${node.color}${Math.round(node.alpha * 180).toString(16).padStart(2, "0")}`;
      ctx.fill();

      // Border
      ctx.strokeStyle = isHovered || isSelected
        ? `${node.color}`
        : `${node.color}30`;
      ctx.lineWidth = isHovered || isSelected ? 2 : 0.5;
      ctx.stroke();

      // Initials
      ctx.save();
      ctx.font = `bold ${Math.max(8, r * 0.7) * dpr}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isHovered || isSelected ? "#fff" : `rgba(255,255,255,${node.alpha * 0.8})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initials = node.contributor.name.split(" ").map((w) => w[0]).join("");
      ctx.fillText(initials, node.x * dpr, node.y * dpr);
      ctx.restore();

      // Name label on hover
      if (isHovered || isSelected) {
        ctx.save();
        ctx.font = `bold ${11 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = node.color;
        ctx.textAlign = "center";
        ctx.fillText(node.contributor.name, node.x * dpr, (node.y - r - 10) * dpr);
        ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = `${node.color}99`;
        ctx.fillText(`#${node.contributor.rank}`, node.x * dpr, (node.y - r - 22) * dpr);
        ctx.restore();
      }
    });

    // Center node
    ctx.beginPath();
    ctx.arc(centerX * dpr, centerY * dpr, 4 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [selectedId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found: Node | null = null;
    for (const node of nodesRef.current) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
        found = node;
        break;
      }
    }

    hoveredRef.current = found?.id || null;
    canvas.style.cursor = found ? "pointer" : "default";

    if (found) {
      setHoveredContributor(found.contributor);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredContributor(null);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of nodesRef.current) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
        onSelect(node.contributor);
        return;
      }
    }
  }, [onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = 500;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      initNodes(w, h);
    };

    resize();
    animFrameRef.current = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initNodes, draw]);

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full"
        style={{ height: 500 }}
      />
      {hoveredContributor && (
        <div
          className="absolute pointer-events-none z-20 border border-border bg-background/95 backdrop-blur-sm p-3 max-w-[220px]"
          style={{
            left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 600) - 240),
            top: Math.max(0, tooltipPos.y - 60),
          }}
        >
          <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">
            #{hoveredContributor.rank} · {hoveredContributor.expertType}
          </p>
          <p className="font-display text-sm font-bold text-foreground mb-1">{hoveredContributor.name}</p>
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{hoveredContributor.affiliation}</p>
          <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">Click to view profile →</p>
        </div>
      )}
    </div>
  );
};

export default AIContributorGraph;
