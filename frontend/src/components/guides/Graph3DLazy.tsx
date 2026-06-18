"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Client-only: the WebGL scene must never run during SSG/prerender, so the
// crawlable HTML is unaffected. Loaded on demand when scrolled into view.
const Graph3D = dynamic(() => import("./Graph3D"), {
  ssr: false,
  loading: () => (
    <div className="my-2 border border-border bg-card/40 flex items-center justify-center" style={{ height: 460 }}>
      <span className="font-mono text-[11px] text-muted-foreground/70">Loading interactive 3D…</span>
    </div>
  ),
});

const Graph3DLazy = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [show]);

  return (
    <div ref={ref}>
      {show ? (
        <Graph3D />
      ) : (
        <div className="my-2 border border-border bg-card/40 flex items-center justify-center" style={{ height: 460 }}>
          <span className="font-mono text-[11px] text-muted-foreground/70">Interactive 3D — scroll to load</span>
        </div>
      )}
    </div>
  );
};

export default Graph3DLazy;
