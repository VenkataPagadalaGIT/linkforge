"use client";
import dynamic from "next/dynamic";

// Client-only: WebGL never runs during SSG. The guide's static sections
// (stage tables, journey transcript, FAQs) carry the SEO; this mounts the
// interactive 3D machine once the page is hydrated.
const LlmExplorer = dynamic(() => import("./LlmExplorer"), {
  ssr: false,
  loading: () => (
    <div className="my-8 border border-border h-[540px] flex items-center justify-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 animate-pulse">
        Loading interactive model…
      </p>
    </div>
  ),
});

const LlmExplorerLazy = () => <LlmExplorer />;

export default LlmExplorerLazy;
