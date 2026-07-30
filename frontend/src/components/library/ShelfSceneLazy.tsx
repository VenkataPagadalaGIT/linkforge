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
  if (webgl === null) return <div className="h-full w-full" aria-busy="true" />;
  if (webgl === false) return <>{fallback ?? <div className="h-full w-full" aria-hidden="true" />}</>;
  return <ShelfScene glPower={glPower} />;
}
