"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import ScrollReveal from "@/components/ScrollReveal";
import AiOntologyGraph, { EDGE_CAT_COLOR, EDGE_CAT_LABEL } from "@/components/ai/AiOntologyGraph";
import { ONTOLOGY_COUNTS } from "@/data/aiOntology";

const CAT_ORDER = ["up", "down", "capital", "peer", "policy", "make"];

export default function AiGraphView() {
  const [query, setQuery] = React.useState("");
  const [chokeOnly, setChokeOnly] = React.useState(false);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-[1500px] mx-auto px-6">
        <ScrollReveal>
          <Link
            to="/notebook/ai/map"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            ← The AI Systems Map (stack view)
          </Link>

          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">
            AI Notebook · Dependency graph
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">
            The AI Systems Map — Graph
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-5">
            The whole ontology as one node-edge graph — {ONTOLOGY_COUNTS.nodes} entities in {ONTOLOGY_COUNTS.layers} layers.
            Hover any node and its edges light up, each <span className="text-foreground">coloured and labelled by the actual
            relation</span> (an investor shows as “invests in”, not “depends on”). Click a node to open its topic page.
            ⬦ rings mark chokepoints.
          </p>

          {/* Edge relation legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-8">
            {CAT_ORDER.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/80">
                <i className="inline-block w-3 h-[2px]" style={{ background: EDGE_CAT_COLOR[c] }} />
                {EDGE_CAT_LABEL[c]}
              </span>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-border px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Find</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nvidia, TSMC, HBM, energy…"
                className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/40"
                data-testid="ai-graph-search"
              />
            </div>
            <button
              onClick={() => setChokeOnly((v) => !v)}
              className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border transition-all ${
                chokeOnly
                  ? "border-amber-400/60 text-amber-300 bg-amber-400/[0.06]"
                  : "border-border text-muted-foreground/70 hover:border-foreground/40"
              }`}
            >
              ⬦ Chokepoints · {ONTOLOGY_COUNTS.chokepoints}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
              {ONTOLOGY_COUNTS.nodes} nodes · {ONTOLOGY_COUNTS.edges} links
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <AiOntologyGraph query={query} chokeOnly={chokeOnly} />
        </ScrollReveal>
      </div>
    </div>
  );
}
