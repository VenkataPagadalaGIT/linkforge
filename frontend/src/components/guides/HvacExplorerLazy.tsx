"use client";
import dynamic from "next/dynamic";

// Client-only: WebGL never runs during SSG. The guide's static sections
// (paths, fault library, scenarios-as-text) carry the SEO; this mounts the
// interactive 3D explorer once the page is hydrated.
const HvacExplorer = dynamic(() => import("./HvacExplorer"), {
  ssr: false,
  loading: () => (
    <div className="my-8 border border-border h-[540px] flex items-center justify-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 animate-pulse">
        Loading interactive model…
      </p>
    </div>
  ),
});

const HvacExplorerLazy = () => <HvacExplorer />;

export default HvacExplorerLazy;
