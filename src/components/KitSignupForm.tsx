"use client";
import { useEffect, useRef } from "react";

const KitSignupForm = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Avoid duplicate scripts
    const existing = containerRef.current.querySelector("script");
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://venkata-pagadala.kit.com/1790be7946/index.js";
    script.async = true;
    script.dataset.uid = "1790be7946";
    containerRef.current.appendChild(script);
  }, []);

  return <div ref={containerRef} />;
};

export default KitSignupForm;
