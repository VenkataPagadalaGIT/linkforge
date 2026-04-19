"use client";
import { useEffect, useRef, useState } from "react";

const FloatingBlocks = () => {
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
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.06;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.06;
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

  const blocks = [
    { w: 64, h: 64, top: 15, left: 10, depth: 2.5, delay: 0 },
    { w: 40, h: 40, top: 25, left: 80, depth: 1.5, delay: 1 },
    { w: 80, h: 32, top: 60, left: 70, depth: 3, delay: 2 },
    { w: 32, h: 80, top: 70, left: 15, depth: 2, delay: 0.5 },
    { w: 48, h: 48, top: 40, left: 50, depth: 1.8, delay: 1.5 },
    { w: 24, h: 56, top: 20, left: 40, depth: 2.2, delay: 3 },
    { w: 56, h: 24, top: 35, left: 25, depth: 1.3, delay: 0.8 },
    { w: 36, h: 36, top: 55, left: 60, depth: 2.8, delay: 2.5 },
    { w: 44, h: 20, top: 80, left: 45, depth: 1.6, delay: 1.2 },
    { w: 28, h: 44, top: 12, left: 65, depth: 2.1, delay: 0.3 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {blocks.map((b, i) => {
        const translateX = mouse.x * b.depth * 15;
        const translateY = mouse.y * b.depth * 15;
        const rotateX = mouse.y * b.depth * 5;
        const rotateY = mouse.x * b.depth * 5;

        return (
          <div
            key={i}
            className="absolute border border-foreground/10"
            style={{
              width: b.w,
              height: b.h,
              top: `${b.top}%`,
              left: `${b.left}%`,
              transform: `
                perspective(600px)
                translate(${translateX}px, ${translateY}px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
              `,
              animation: `float-block ${4 + b.depth}s ease-in-out infinite`,
              animationDelay: `${b.delay}s`,
              background: `rgba(255,255,255,${0.02 + (i % 3) * 0.01})`,
            }}
          >
            {/* 3D face effect on some blocks */}
            {i % 3 === 0 && (
              <div
                className="absolute inset-0 border-r border-b border-foreground/5"
                style={{
                  transform: `translateZ(${4 + b.depth * 2}px)`,
                  background: `rgba(255,255,255,0.03)`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FloatingBlocks;
