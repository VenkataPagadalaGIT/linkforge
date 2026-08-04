"use client";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";

// Client-only mount; three.js stays out of the main bundle and WebGL never
// runs during static generation.
const PortraitAssembly = dynamic(() => import("./PortraitAssembly"), {
  ssr: false,
  loading: () => <PlainPhoto />,
});

/**
 * The photograph, as plain server-renderable HTML. This is the SSR output
 * and every degraded state: corporate networks whose security proxies block
 * our scripts entirely (Chrome reports CORB), browsers without WebGL, and
 * the beat before the 3D chunk arrives. The person must always be visible;
 * the particles are an upgrade, never a requirement.
 */
function PlainPhoto() {
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
}

export default function PortraitAssemblyLazy() {
  const { ok: webgl, power: glPower } = useWebGL();
  // The photo is the default at every stage: during SSR and the WebGL probe
  // (webgl === null), and permanently when no context exists. The particle
  // portrait mounts only once WebGL is proven.
  if (webgl !== true) return <PlainPhoto />;
  return <PortraitAssembly glPower={glPower} />;
}
