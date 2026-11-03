"use client";
import { useRef, useEffect } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  layer: number;
}

const NeuralNetBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;

    // Create nodes in layered structure
    const nodes: Node[] = [];
    const layers = 6;
    const nodesPerLayer = 8;

    for (let l = 0; l < layers; l++) {
      for (let n = 0; n < nodesPerLayer; n++) {
        const xBase = (cw / (layers + 1)) * (l + 1);
        const yBase = (ch / (nodesPerLayer + 1)) * (n + 1);
        nodes.push({
          x: xBase + (Math.random() - 0.5) * 60,
          y: yBase + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 2 + Math.random() * 2,
          layer: l,
        });
      }
    }

    const draw = () => {
      const dpr = window.devicePixelRatio;
      const rw = canvas.offsetWidth;
      const rh = canvas.offsetHeight;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rw, rh);

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        const xBase = (rw / (layers + 1)) * (node.layer + 1);
        const yIdx = nodes.filter((n) => n.layer === node.layer).indexOf(node);
        const yBase = (rh / (nodesPerLayer + 1)) * (yIdx + 1);

        // Drift back to base position
        node.vx += (xBase - node.x) * 0.0005;
        node.vy += (yBase - node.y) * 0.0005;

        // Damping
        node.vx *= 0.998;
        node.vy *= 0.998;

        // Add subtle noise
        node.vx += (Math.random() - 0.5) * 0.02;
        node.vy += (Math.random() - 0.5) * 0.02;
      }

      // Draw connections between adjacent layers
      for (const nodeA of nodes) {
        for (const nodeB of nodes) {
          if (nodeB.layer === nodeA.layer + 1) {
            const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
            const maxDist = 300;
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.06;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(nodeA.x, nodeA.y);
              ctx.lineTo(nodeB.x, nodeB.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.fillStyle = `rgba(255, 255, 255, 0.12)`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow
        ctx.fillStyle = `rgba(255, 255, 255, 0.03)`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

export default NeuralNetBackground;
