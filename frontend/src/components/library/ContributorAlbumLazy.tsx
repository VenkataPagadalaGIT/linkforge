"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// Client-only mount: three.js stays out of the main bundle and WebGL never
// runs during static generation. Without WebGL the album quietly disappears;
// the full contributor directory below it is the real content either way.
const ContributorAlbum = dynamic(() => import("./ContributorAlbum"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function ContributorAlbumLazy({ fallback }: { fallback?: React.ReactNode }) {
  const { ok: webgl, power: glPower } = useWebGL();
  if (webgl === null) return <div className="h-full w-full" aria-busy="true" />;
  if (webgl === false) return <>{fallback ?? null}</>;
  return <ContributorAlbum glPower={glPower} />;
}
