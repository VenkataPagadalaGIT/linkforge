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
function Placeholder({ text = "Preparing ignition…" }: { text?: string }) {
  return (
    <div className="grid place-items-center border border-border bg-black" style={{ height: "calc(min(max(78vh, 560px), 900px) + 96px)" }}>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{text}</p>
    </div>
  );
}

/**
 * Home page section: my LinkedIn as a universe. A full-width dark band; the 3D view mounts when it is about to be
 * seen. Without JavaScript (or before it mounts) the band still says what it is and links to the archive.
 */
export default function HomeUniverse() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [near, setNear] = React.useState(false);
  const gl = useWebGL();
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
    <section className="dark relative z-10 border-y border-border bg-black text-foreground" aria-labelledby="home-universe-h" data-testid="home-universe">
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">LinkedIn archive · mission control</p>
            <h2 id="home-universe-h" className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              My LinkedIn, as a universe
            </h2>
            <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
              Every post, article and image I have shared since 2016 is a star around one core, grouped by area, topic and subtopic. Search it, pick a level, or
              fly in and open any post.
            </p>
          </div>
          <a href="/linkedin" className="font-mono text-[11px] uppercase tracking-[0.15em] border border-foreground px-3 py-2 text-foreground transition-colors hover:bg-foreground hover:text-background">
            Open the full archive →
          </a>
        </div>
        <div ref={ref}>
          {gl.ok === false ? (
            <Placeholder text="3D is off in this browser: open the full archive above" />
          ) : near && gl.ok ? (
            <LinkedInUniverseSection />
          ) : (
            <Placeholder />
          )}
        </div>
      </div>
    </section>
  );
}
