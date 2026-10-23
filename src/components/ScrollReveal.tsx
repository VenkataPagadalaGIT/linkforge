"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Reveals children with a fade/slide when they enter the viewport.
 * On the very first client render we keep content visible so that:
 *   - SSR HTML is crawlable by AI / search bots (no opacity:0 in delivered HTML)
 *   - Elements already in the initial viewport never get stuck hidden
 * Offscreen elements are then hidden on mount and animated in as they scroll.
 */
const ScrollReveal = ({ children, className = "", delay = 0 }: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    // If element is already in viewport on mount, OR is taller than the
    // viewport (e.g., a 9000px note article on a 852px phone — where 10%
    // of the target can never be visible at once), reveal immediately.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const inView = rect.top < vh && rect.bottom > 0;
    const tallerThanViewport = rect.height > vh;
    if (inView || tallerThanViewport) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      // Any visible pixel triggers reveal. Threshold 0.1 broke for tall
      // children (e.g., 9000px note articles) on mobile, where the viewport
      // can't physically contain 10% of the target → reveal never fired
      // and the section stayed at opacity:0 indefinitely.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // Before hydration effect runs (first paint), stay fully visible so the
  // server-rendered content remains visible for both users and crawlers.
  const visible = !mounted || isVisible;

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
