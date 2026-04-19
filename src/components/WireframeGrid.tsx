"use client";
import { useEffect, useRef, useState } from "react";

const WireframeGrid = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.05;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.05;
      setMouse({ ...currentRef.current });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Room — Floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60vh] grid-perspective"
        style={{
          transform: `perspective(800px) rotateX(${55 + mouse.y * 3}deg) rotateZ(${mouse.x * 2}deg)`,
          transition: "none",
        }}
      >
        <div
          className="w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            backgroundPosition: `${mouse.x * 15}px ${mouse.y * 10}px`,
          }}
        />
      </div>

      {/* 3D Room — Back Wall */}
      <div
        className="absolute top-[10%] left-[10%] right-[10%] h-[45%]"
        style={{
          transform: `perspective(1200px) rotateY(${mouse.x * 1.5}deg) rotateX(${-mouse.y * 1}deg)`,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          backgroundPosition: `${mouse.x * 20}px ${mouse.y * 20}px`,
        }}
      />

      {/* Layered Grid Panels — like reference image 2 */}
      {[
        { left: "18%", rotY: -35, scale: 0.7, opacity: 0.15, depth: 3 },
        { left: "32%", rotY: -20, scale: 0.8, opacity: 0.2, depth: 2 },
        { left: "48%", rotY: 0, scale: 0.9, opacity: 0.25, depth: 1.5 },
        { left: "62%", rotY: 15, scale: 0.8, opacity: 0.2, depth: 2 },
        { left: "76%", rotY: 30, scale: 0.7, opacity: 0.15, depth: 2.5 },
      ].map((panel, i) => (
        <div
          key={i}
          className="absolute top-[15%] w-[16%] h-[50%]"
          style={{
            left: panel.left,
            transform: `
              perspective(800px) 
              rotateY(${panel.rotY + mouse.x * panel.depth * 3}deg) 
              rotateX(${mouse.y * panel.depth * 1.5}deg) 
              scale(${panel.scale})
              translateZ(${mouse.x * panel.depth * 10}px)
            `,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,${panel.opacity}) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,${panel.opacity}) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: `${mouse.x * panel.depth * 5}px ${mouse.y * panel.depth * 5}px`,
            border: `1px solid rgba(255,255,255,${panel.opacity * 0.8})`,
          }}
        />
      ))}

      {/* Vertical scan line */}
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-foreground/10 to-transparent animate-scan-line" />

      {/* Corner brackets with parallax */}
      <div
        className="absolute top-8 left-8 w-12 h-12 border-l border-t border-foreground/20"
        style={{ transform: `translate(${mouse.x * -5}px, ${mouse.y * -5}px)` }}
      />
      <div
        className="absolute top-8 right-8 w-12 h-12 border-r border-t border-foreground/20"
        style={{ transform: `translate(${mouse.x * 5}px, ${mouse.y * -5}px)` }}
      />
      <div
        className="absolute bottom-8 left-8 w-12 h-12 border-l border-b border-foreground/20"
        style={{ transform: `translate(${mouse.x * -5}px, ${mouse.y * 5}px)` }}
      />
      <div
        className="absolute bottom-8 right-8 w-12 h-12 border-r border-b border-foreground/20"
        style={{ transform: `translate(${mouse.x * 5}px, ${mouse.y * 5}px)` }}
      />
    </div>
  );
};

export default WireframeGrid;
