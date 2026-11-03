"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWebGL } from "@/lib/webgl";
import { HERO_PORTRAIT } from "@/data/heroPortrait";
import type { Twin } from "./twin";

// Client-only mount; three.js stays out of the main bundle and WebGL never
// runs during static generation.
const PortraitAssembly = dynamic(() => import("./PortraitAssembly"), {
  ssr: false,
  loading: () => <PlainPhoto />,
});

const MASK = "radial-gradient(ellipse 88% 88% at center, black 62%, transparent 100%)";

/**
 * The photograph, as plain server-renderable HTML. This is the SSR output
 * and every degraded state: corporate networks whose security proxies block
 * our scripts entirely (Chrome reports CORB), browsers without WebGL, and
 * the beat before the 3D chunk arrives. The person must always be visible;
 * the particles are an upgrade, never a requirement.
 *
 * Once scripts run, the twin's still sits on top, clipped to the right of
 * the banner's seam (.twin-ai-photo), so the split works without WebGL too.
 * It is added after hydration only: the server HTML and the first paint
 * fetch his photo and nothing else.
 */
function PlainPhoto() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="relative w-full h-full">
      <img
        src="/venkata-pagadala.jpeg"
        alt="Venkata Pagadala"
        className="w-full h-full object-cover"
        style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      />
      {mounted && (
        <img
          src={HERO_PORTRAIT.aiStill.src}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="twin-ai-photo pointer-events-none absolute inset-0 w-full h-full object-cover"
          style={{ maskImage: MASK, WebkitMaskImage: MASK }}
        />
      )}
    </div>
  );
}

export default function PortraitAssemblyLazy({ twin }: { twin?: Twin }) {
  const { ok: webgl, power: glPower } = useWebGL();
  // The photo is the default at every stage: during SSR and the WebGL probe
  // (webgl === null), and permanently when no context exists. The particle
  // portrait mounts only once WebGL is proven.
  if (webgl !== true) return <PlainPhoto />;
  return <PortraitAssembly glPower={glPower} twin={twin} />;
}
