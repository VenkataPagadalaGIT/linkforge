"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";
import type { BookShelfProps } from "./BookShelf";

// Client-only mount for any BookShelf instance: three.js stays out of the
// main bundle and WebGL never runs during static generation.
const BookShelf = dynamic(() => import("./BookShelf"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

/**
 * Optional poster: a still of the shelf layered UNDER the live scene. The
 * canvas paints opaque over it on the first frame; on script-blocked
 * corporate networks and WebGL-less machines the still is what remains, so
 * the slot is never a blank void. Callers may also pass a content fallback
 * (a book list) shown when WebGL is definitively absent.
 */
export default function BookShelfLazy({
  fallback,
  poster,
  posterAlt,
  ...props
}: BookShelfProps & { fallback?: React.ReactNode; poster?: string; posterAlt?: string }) {
  const { ok: webgl, power: glPower } = useWebGL();
  // A definitive no-WebGL verdict with a content fallback wins outright:
  // the fallback is real content and must not sit on top of a poster.
  if (webgl === false && fallback) return <>{fallback}</>;
  const scene =
    webgl === null ? (
      <div className="h-full w-full" aria-busy="true" />
    ) : webgl === false ? null : (
      <BookShelf {...props} glPower={glPower} />
    );
  if (!poster) return scene;
  return (
    <div className="relative h-full w-full">
      <img src={poster} alt={posterAlt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0">{scene}</div>
    </div>
  );
}
