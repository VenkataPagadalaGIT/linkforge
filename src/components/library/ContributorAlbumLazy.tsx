"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// Client-only mount: three.js stays out of the main bundle and WebGL never
// runs during static generation. The directory below the album is the real
// content either way; the poster keeps this slot from being a blank void.
const ContributorAlbum = dynamic(() => import("./ContributorAlbum"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function ContributorAlbumLazy({ fallback }: { fallback?: React.ReactNode }) {
  const { ok: webgl, power: glPower } = useWebGL();
  if (webgl === false && fallback) return <>{fallback}</>;
  // Poster under the scene: opaque canvas covers it on frame one; on
  // script-blocked corporate networks the open album still is what remains.
  return (
    <div className="relative h-full w-full">
      <img
        src="/posters/album.jpg"
        alt="The Top 100 album open at page one: Geoffrey Hinton"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0">
        {webgl === true ? <ContributorAlbum glPower={glPower} /> : <div className="h-full w-full" aria-busy="true" />}
      </div>
    </div>
  );
}
