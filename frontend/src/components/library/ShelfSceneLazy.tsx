"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// Client-only, so three.js stays out of the main bundle and WebGL never runs
// during static generation. The fallback is a prop rather than a hardcoded
// blank: the shelf carries real content, and a reader without WebGL should get
// the nineteen books as text instead of an empty rectangle.
const ShelfScene = dynamic(() => import("./ShelfScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function ShelfSceneLazy({ fallback }: { fallback?: React.ReactNode }) {
  const { ok: webgl, power: glPower } = useWebGL();
  // A definitive no-WebGL verdict hands the slot to the content fallback.
  if (webgl === false) return <>{fallback ?? <div className="h-full w-full" aria-hidden="true" />}</>;
  // Otherwise a poster still sits UNDER the scene: the canvas paints opaque
  // over it on its first frame, and on script-blocked corporate networks
  // (where no scene ever mounts) the still is what the reader sees.
  return (
    <div className="relative h-full w-full">
      <img
        src="/posters/shelf.jpg"
        alt="The Complete Shelf: Think Python pulled forward from a walnut shelf of free AI books"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0">
        {webgl === null ? <div className="h-full w-full" aria-busy="true" /> : <ShelfScene glPower={glPower} />}
      </div>
    </div>
  );
}
