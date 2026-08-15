"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import ScrollReveal from "@/components/ScrollReveal";
import AiSystemsMap from "@/components/ai/AiSystemsMap";
import { LAYERS, ONTOLOGY_COUNTS, chokepoints } from "@/data/aiOntology";

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="border border-border p-5">
    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">{label}</p>
    <p className="font-display text-3xl font-bold text-foreground text-glow">{value}</p>
  </div>
);

export default function AiSystemsMapView() {
  const chokes = React.useMemo(
    () => chokepoints().sort((a, b) => a.layer - b.layer).slice(0, 18),
    [],
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <Link
            to="/notebook/ai"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            ← AI Notebook
          </Link>

          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
            AI Notebook · Live systems map
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">
            The AI Systems Map
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-8">
            Every layer of the AI value chain as one dependency graph: from the frontier labs at the top
            down through cloud, chips, foundries, equipment, memory, materials and minerals, to the energy,
            data centers and capital the whole thing rests on. Trace what any company <span className="text-emerald-700 dark:text-emerald-300">depends on</span>,
            what <span className="text-sky-700 dark:text-sky-300">feeds it</span>, and where the <span className="text-amber-700 dark:text-amber-300">chokepoints</span> are.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
            <Stat label="Entities" value={ONTOLOGY_COUNTS.nodes} />
            <Stat label="Dependencies" value={ONTOLOGY_COUNTS.edges} />
            <Stat label="Chokepoints" value={<span className="text-amber-700 dark:text-amber-300">{ONTOLOGY_COUNTS.chokepoints}</span>} />
            <Stat label="Layers" value={ONTOLOGY_COUNTS.layers} />
          </div>
        </ScrollReveal>

        {/* The map */}
        <ScrollReveal>
          <AiSystemsMap />
        </ScrollReveal>

        {/* Chokepoints spotlight */}
        <ScrollReveal>
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-700 dark:text-amber-300">⬦</span>
              <h2 className="font-display text-xl font-bold text-foreground">The chokepoints</h2>
            </div>
            <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-5 max-w-3xl">
              A handful of single points of dependency hold up the entire stack. Remove any one and the
              frontier stalls, which is exactly why they define the geopolitics of AI.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {chokes.map((n) => (
                <Link
                  key={n.id}
                  to={`/notebook/ai/map/${n.id}`}
                  className="group border border-amber-400/25 hover:border-amber-400/60 p-3 transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-700 dark:text-amber-300 text-xs">⬦</span>
                    <p className="font-display text-sm font-bold text-foreground group-hover:text-glow">{n.name}</p>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed mt-1 line-clamp-2">
                    {n.tagline}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Connected layers of the notebook */}
        <ScrollReveal>
          <section className="mt-16 border-t border-border/50 pt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-4">
              Connected in the AI Notebook
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { to: "/notebook/ai/encyclopedia", label: "Encyclopedia", blurb: "The concepts, defined, from transformers to RAG to agents." },
                { to: "/notebook/ai/roadmap", label: "Roadmap", blurb: "A structured path from fundamentals to frontier." },
                { to: "/ai-updates", label: "AI Updates", blurb: "The news, attached to the entities it moves." },
              ].map((c) => (
                <Link key={c.to} to={c.to} className="group border border-border p-5 hover:border-foreground/30 transition-all">
                  <p className="font-display text-base font-bold text-foreground group-hover:text-glow mb-1">{c.label} →</p>
                  <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed">{c.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
