"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";
import type { BookShelfProps } from "./BookShelf";

// Client-only mount for any BookShelf instance: three.js stays out of the
// main bundle and WebGL never runs during static generation. Callers own the
// fallback, because a shelf embedded above real content should quietly
// disappear where WebGL is unavailable rather than leave a hole.
const BookShelf = dynamic(() => import("./BookShelf"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function BookShelfLazy({
  fallback,
  ...props
}: BookShelfProps & { fallback?: React.ReactNode }) {
  const { ok: webgl, power: glPower } = useWebGL();
  if (webgl === null) return <div className="h-full w-full" aria-busy="true" />;
  if (webgl === false) return <>{fallback ?? null}</>;
  return <BookShelf {...props} glPower={glPower} />;
}
