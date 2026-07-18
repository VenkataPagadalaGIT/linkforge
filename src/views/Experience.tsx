"use client";
import { useState } from "react";
import HolographicCards from "@/components/HolographicCards";
import WireframeGrid from "@/components/WireframeGrid";
import ScrollReveal from "@/components/ScrollReveal";
import CinematicTransformer from "@/components/CinematicTransformer";
import Cinematic3DScene from "@/components/Cinematic3DScene";
import ApiantStyle3D from "@/components/ApiantStyle3D";
import SEO from "@/components/SEO";

interface ComponentEntry {
  id: string;
  name: string;
  tag: string;
  description: string;
  tech: string[];
  component: React.ReactNode;
}

const ComponentCard = ({ entry, index }: { entry: ComponentEntry; index: number }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative">
      {/* Connector line */}
      {index > 0 && (
        <div className="absolute left-6 -top-16 w-[1px] h-16 bg-gradient-to-b from-transparent via-border/20 to-border/10" />
      )}

      {/* Component header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Index marker */}
        <div className="flex-shrink-0 w-12 h-12 border border-border/20 flex items-center justify-center font-mono text-[10px] text-muted-foreground/40">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground tracking-tight">
              {entry.name}
            </h2>
            <span className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/25 uppercase border border-border/15 px-2 py-0.5">
              {entry.tag}
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/40 leading-relaxed max-w-xl">
            {entry.description}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {entry.tech.map((t) => (
              <span
                key={t}
                className="font-mono text-[8px] tracking-wider text-muted-foreground/20 uppercase"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors uppercase border border-border/10 px-3 py-1.5 hover:border-border/25"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Component render area */}
      {expanded && (
        <div className="relative border border-border/10 rounded-sm overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/10 bg-background/50">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
              <span className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20 uppercase">
                {entry.id}
              </span>
            </div>
            <span className="font-mono text-[8px] text-muted-foreground/15 uppercase">
              Interactive Preview
            </span>
          </div>

          {/* Component */}
          <div className="p-6 sm:p-8">
            {entry.component}
          </div>
        </div>
      )}
    </div>
  );
};

const components: ComponentEntry[] = [
  {
    id: "holographic-cards",
    name: "Holographic Cards",
    tag: "4D Phase System",
    description:
      "Venture-ready AI assets projected from 4-dimensional phase space. Hover to shift dimensions. Each card exists at a unique phase angle along the W-axis.",
    tech: ["CSS 3D", "Framer Motion", "Phase Shift"],
    component: <HolographicCards />,
  },
  {
    id: "cinematic-3d",
    name: "Autonomous Core",
    tag: "Three.js Scene",
    description:
      "A self-organizing neural substrate rendered in real-time WebGL. Floating mechanical icosahedron with orbiting rings, satellite nodes, and volumetric light beams.",
    tech: ["React Three Fiber", "WebGL", "Three.js"],
    component: <Cinematic3DScene />,
  },
  {
    id: "cinematic-transformer",
    name: "Cinematic Transformer",
    tag: "Metamorphic Engine",
    description:
      "Eight neural subsystems dynamically reconfigure between vehicle and autonomous mech formations using spring physics and 3D CSS perspective transforms.",
    tech: ["Framer Motion", "CSS 3D", "Spring Physics"],
    component: <CinematicTransformer />,
  },
  {
    id: "apiant-3d",
    name: "System Assembly",
    tag: "Platform Scene",
    description:
      "Modular AI subsystems self-organize above a deployment platform with glowing edge borders, floating metallic blocks, and ambient star particles.",
    tech: ["React Three Fiber", "WebGL", "Three.js"],
    component: <ApiantStyle3D />,
  },
];

const Experience = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative overflow-hidden">
      <SEO
        title="Component Library | Interactive Systems | Venkata Pagadala"
        description="A curated library of cinematic 3D interactive components — holographic cards, Three.js scenes, metamorphic transformers, and more."
        canonical="https://venkatapagadala.com/experience"
      />

      <WireframeGrid />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Library header */}
        <ScrollReveal>
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[1px] bg-border/20" />
              <p className="font-mono text-[9px] tracking-[0.5em] text-muted-foreground/25 uppercase">
                Component Library
              </p>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
              Interactive Systems
            </h1>
            <p className="font-mono text-xs text-muted-foreground/40 max-w-lg leading-relaxed">
              A curated collection of cinematic, interactive components.
              Each module is self-contained, mouse-reactive, and built
              for high-fidelity visual storytelling.
            </p>

            {/* Stats bar */}
            <div className="flex items-center gap-8 mt-8 pt-6 border-t border-border/10">
              {[
                { label: "Components", value: String(components.length).padStart(2, "0") },
                { label: "Renderers", value: "02" },
                { label: "Frameworks", value: "03" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-mono text-lg font-semibold text-foreground/80">{stat.value}</p>
                  <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/25 uppercase mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Component list */}
        <div className="space-y-24">
          {components.map((entry, i) => (
            <ScrollReveal key={entry.id}>
              <ComponentCard entry={entry} index={i} />
            </ScrollReveal>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-32 pt-8 border-t border-border/10 text-center">
          <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground/15 uppercase">
            {components.length} components · WebGL + CSS 3D + Framer Motion
          </p>
        </div>
      </div>
    </div>
  );
};

export default Experience;
