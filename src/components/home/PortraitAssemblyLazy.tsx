"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// Client-only mount; without WebGL the portrait falls back to the plain
// photograph, because the person matters more than the particles.
const PortraitAssembly = dynamic(() => import("./PortraitAssembly"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function PortraitAssemblyLazy() {
  const { ok: webgl, power: glPower } = useWebGL();
  if (webgl === null) return <div className="h-full w-full" aria-busy="true" />;
  if (webgl === false)
    return (
      <img
        src="/venkata-pagadala.jpeg"
        alt="Venkata Pagadala"
        className="w-full h-full object-cover"
        style={{
          maskImage: "radial-gradient(ellipse 88% 88% at center, black 62%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 88% 88% at center, black 62%, transparent 100%)",
        }}
      />
    );
  return <PortraitAssembly glPower={glPower} />;
}
