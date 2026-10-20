"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// The Universe and the archive's data load only when the section comes near the screen, so the home page's first
// load carries none of it.
const LinkedInUniverseSection = dynamic(() => import("@/components/linkedin/LinkedInUniverseSection"), {
  ssr: false,
  loading: () => <Placeholder />,
});

/** Holds the space the view will take (its controls row plus the 3D box), so mounting it never shifts the page. */
function Placeholder() {
  return (
    <div className="grid place-items-center border border-border bg-background" style={{ height: "calc(min(max(78vh, 560px), 900px) + 96px)" }}>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Preparing ignition…</p>
    </div>
  );
}

/**
 * Home page section: Venkata Pagadala - Universe (every source in one graph; LinkedIn first). A full-width band in the site's theme (light or dark); the 3D view
 * mounts when it is about to be seen. Without JavaScript (or before it mounts) the band still says what it is and links to the archive.
 */
/** Mounted only once the section is near: probes WebGL, then loads the view (or says 3D is off, in one short line). */
function NearUniverse() {
  const gl = useWebGL();
  if (gl.ok === false)
    return (
      <p className="border border-border px-4 py-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        3D is off in this browser. Open the full archive above to see every post.
      </p>
    );
  return gl.ok ? <LinkedInUniverseSection /> : <Placeholder />;
}

export default function HomeUniverse() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [near, setNear] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setNear(true);
    // Only once it is about to scroll into view: the hero above it is a full screen tall.
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "0px 0px 150px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className="relative z-10 border-y border-border bg-background text-foreground" aria-labelledby="home-universe-h" data-testid="home-universe">
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mission control · every source, one graph</p>
            <h2 id="home-universe-h" className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Venkata Pagadala - Universe
            </h2>
            <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
              Everything I share, as stars around one core, grouped by area, topic and subtopic. LinkedIn is the first source (every post, article and
              image since 2016); my website, Substack, YouTube and more join next. Search it, pick a level, or fly in and open any post.
            </p>
          </div>
          <a href="/linkedin" className="font-mono text-[11px] uppercase tracking-[0.15em] border border-foreground px-3 py-2 text-foreground transition-colors hover:bg-foreground hover:text-background">
            Open the full archive →
          </a>
        </div>
        <div ref={ref}>{near ? <NearUniverse /> : <Placeholder />}</div>
      </div>
    </section>
  );
}
