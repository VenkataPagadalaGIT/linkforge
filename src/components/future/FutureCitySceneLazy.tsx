"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// Client-only: WebGL never runs during SSG and three.js stays out of the main
// bundle. This scene can sit behind homepage content, so every non-3D state
// has to stay quiet: no spinner copy, just the page's own dark canvas.
const FutureCityScene = dynamic(() => import("./FutureCityScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function FutureCitySceneLazy({ background = false, game = false }: { background?: boolean; game?: boolean }) {
  const { ok: webgl, power: glPower } = useWebGL();
  // Same three-way gate as LlmExplorer: null while the probe runs (empty
  // shell), false when no context works (quiet fallback, page content is
  // unaffected), true mounts the scene with the proven power mode.
  if (webgl === null) return <div className="h-full w-full" aria-busy="true" />;
  if (webgl === false) return <div className="h-full w-full" aria-hidden="true" />;
  return <FutureCityScene background={background} game={game} glPower={glPower} />;
}
