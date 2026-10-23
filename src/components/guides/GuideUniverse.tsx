"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";
import type { Block } from "@/data/guides";
import { inline } from "./inline";

type UniverseBlock = Extract<Block, { kind: "universe" }>;

// The view and the archive's data load only when the figure comes near the
// screen, so the guide's first load carries none of it (as on the home page).
const LinkedInUniverseSection = dynamic(() => import("@/components/linkedin/LinkedInUniverseSection"), {
  ssr: false,
  loading: () => null,
});

/** The still: what the server renders, what readers without scripts or WebGL see, and what shows until the view is near. */
function Poster({ poster }: { poster: UniverseBlock["poster"] }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={poster.src} alt={poster.alt} width={poster.width} height={poster.height} loading="lazy" className="block h-auto w-full" />
  );
}

/** Probes WebGL once near, then swaps the still for the live view (or keeps the still where 3D is off). */
function Live({ poster }: { poster: UniverseBlock["poster"] }) {
  const gl = useWebGL();
  return gl.ok ? <LinkedInUniverseSection /> : <Poster poster={poster} />;
}

/**
 * The author's LinkedIn knowledge graph, inside a guide: the same Universe the
 * home page shows, with its search, topic levels and one-finger turning.
 */
export default function GuideUniverse({ block }: { block: UniverseBlock }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [near, setNear] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setNear(true);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "0px 0px 300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <figure className="my-8" data-testid="guide-universe">
      <div ref={ref} className="border border-border bg-background">
        {near ? <Live poster={block.poster} /> : <Poster poster={block.poster} />}
      </div>
      {block.caption && (
        <figcaption
          className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground/80"
          dangerouslySetInnerHTML={{ __html: inline(block.caption) }}
        />
      )}
    </figure>
  );
}
