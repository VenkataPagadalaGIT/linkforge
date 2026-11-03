"use client";
import dynamic from "next/dynamic";

// Client-only: WebGL never runs during SSG. The server HTML carries the
// poster still, so the slot is never a hole for a reader whose scripts were
// blocked; the interactive bench mounts over it once the page hydrates.
const POSTER = "/posters/what-is-jev.jpg";
const POSTER_ALT =
  "Conceptual Jev workflow as a 3D bench: supplied evidence on the left, the Jev model stamping typed answers (Choice, Score, Noul), the application's rules gate routing the ticket, and the generative model at the next desk.";

const JevExplorer = dynamic(() => import("./JevExplorer"), {
  ssr: false,
  loading: () => (
    <div className="my-8 border border-border h-[540px] relative overflow-hidden" data-testid="jev-explorer-poster">
      <img src={POSTER} alt={POSTER_ALT} className="absolute inset-0 w-full h-full object-cover" />
      <p className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 animate-pulse">
        Loading interactive model…
      </p>
    </div>
  ),
});

const JevExplorerLazy = () => <JevExplorer />;

export default JevExplorerLazy;
