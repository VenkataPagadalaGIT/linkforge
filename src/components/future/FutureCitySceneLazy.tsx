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

export default function FutureCitySceneLazy({
  background = false,
  game = false,
  // Defaults off, so a caller has to ask for sound rather than opt out of it.
  audio = false,
}: {
  background?: boolean;
  game?: boolean;
  audio?: boolean;
}) {
  const { ok: webgl, power: glPower } = useWebGL();
  // Same three-way gate as LlmExplorer: null while the probe runs, false
  // when no context works, true mounts the scene with the proven power mode.
  const scene =
    webgl === null ? (
      <div className="h-full w-full" aria-busy="true" />
    ) : webgl === false ? (
      <div className="h-full w-full" aria-hidden="true" />
    ) : (
      <FutureCityScene background={background} game={game} audio={audio} glPower={glPower} />
    );
  // Game mode layers a poster still UNDER the scene: the canvas paints
  // opaque over it on its first frame, so on script-blocked corporate
  // networks (proxies swap our JS for block pages) and WebGL-less machines
  // the reader sees the city instead of a white void. Background mode stays
  // quiet: a poster behind page content would be noise.
  if (!game) return scene;
  return (
    <div className="relative h-full w-full">
      <img
        src="/posters/3d-game.jpg"
        alt="The 2040 city: a humanoid robot walking past queued traffic"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0">{scene}</div>
    </div>
  );
}
