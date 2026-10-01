"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import {
  LAYERS,
  nodesInLayer,
  upstreamOf,
  downstreamOf,
  contextOf,
  NODE_TYPE_META,
  ONTOLOGY_COUNTS,
  type AiNode,
} from "@/data/aiOntology";

// Precompute each node's connected neighbourhood once (upstream + downstream + context).
function useNeighborhoods() {
  return React.useMemo(() => {
    const up = new Map<string, Set<string>>();
    const down = new Map<string, Set<string>>();
    for (const layer of LAYERS) {
      for (const n of nodesInLayer(layer.id)) {
        up.set(n.id, new Set(upstreamOf(n.id).map((r) => r.node.id)));
        const ctx = contextOf(n.id);
        const d = new Set(downstreamOf(n.id).map((r) => r.node.id));
        [...ctx.peers, ...ctx.capital, ...ctx.policy, ...ctx.makes].forEach((r) => d.add(r.node.id));
        down.set(n.id, d);
      }
    }
    return { up, down };
  }, []);
}

const layerColor = (id: number) => LAYERS.find((l) => l.id === id)?.color ?? "#888";

export default function AiSystemsMap() {
  const [focus, setFocus] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [chokeOnly, setChokeOnly] = React.useState(false);
  const { up, down } = useNeighborhoods();

  const q = query.trim().toLowerCase();
  const matches = React.useCallback(
    (n: AiNode) => {
      if (chokeOnly && !n.chokepoint) return false;
      if (!q) return true;
      return `${n.name} ${n.id} ${n.tagline} ${NODE_TYPE_META[n.type].label}`.toLowerCase().includes(q);
    },
    [q, chokeOnly],
  );

  const upSet = focus ? up.get(focus) : undefined;
  const downSet = focus ? down.get(focus) : undefined;

  const chipState = (n: AiNode): "focus" | "up" | "down" | "dim" | "normal" => {
    if (focus) {
      if (n.id === focus) return "focus";
      if (upSet?.has(n.id)) return "up";
      if (downSet?.has(n.id)) return "down";
      return "dim";
    }
    if (q || chokeOnly) return matches(n) ? "normal" : "dim";
    return "normal";
  };

  return (
    <div data-testid="ai-systems-map">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-border px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Find</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nvidia, TSMC, HBM, ASML, energy…"
            className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/40"
            data-testid="ai-map-search"
          />
        </div>
        <button
          onClick={() => setChokeOnly((v) => !v)}
          className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border transition-all ${
            chokeOnly
              ? "border-amber-400/60 text-amber-300 bg-amber-400/[0.06]"
              : "border-border text-muted-foreground/70 hover:border-foreground/40"
          }`}
          data-testid="ai-map-chokepoints"
        >
          ⬦ Chokepoints · {ONTOLOGY_COUNTS.chokepoints}
        </button>
        <a
          href="/notebook/ai/graph"
          className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border border-border text-muted-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors"
          data-testid="ai-map-graphlink"
        >
          Graph view →
        </a>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          {ONTOLOGY_COUNTS.nodes} nodes · {ONTOLOGY_COUNTS.edges} links
        </span>
      </div>

      {focus && (
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="text-muted-foreground/50">Highlighting</span>
          <span className="inline-flex items-center gap-1 text-emerald-300"><i className="w-2 h-2 inline-block bg-emerald-400" /> depends on ↑</span>
          <span className="inline-flex items-center gap-1 text-sky-300"><i className="w-2 h-2 inline-block bg-sky-400" /> feeds ↓</span>
          <button onClick={() => setFocus(null)} className="text-muted-foreground/60 hover:text-foreground underline">clear</button>
        </div>
      )}

      {/* Layer bands */}
      <div className="space-y-3">
        {LAYERS.map((layer) => {
          const layerNodes = nodesInLayer(layer.id);
          return (
            <section
              key={layer.id}
              className="border border-border/70"
              data-testid={`ai-map-layer-${layer.id}`}
            >
              <div className="grid md:grid-cols-[220px_1fr]">
                {/* Layer rail */}
                <div
                  className="p-4 border-b md:border-b-0 md:border-r border-border/70"
                  style={{ boxShadow: `inset 3px 0 0 ${layer.color}` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 text-black font-bold"
                      style={{ background: layer.color }}
                    >
                      L{layer.id}
                    </span>
                    <h3 className="font-display text-sm font-bold text-foreground">{layer.label}</h3>
                  </div>
                  <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/60">{layer.blurb}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 mt-2">
                    {layerNodes.length} entities
                  </p>
                </div>

                {/* Node chips */}
                <div className="p-3 flex flex-wrap gap-1.5 content-start">
                  {layerNodes.map((n) => {
                    const st = chipState(n);
                    const dimmed = st === "dim";
                    const ring =
                      st === "focus"
                        ? "ring-1 ring-foreground"
                        : st === "up"
                        ? "ring-1 ring-emerald-400/70"
                        : st === "down"
                        ? "ring-1 ring-sky-400/70"
                        : "";
                    return (
                      <a
                        key={n.id}
                        href={`/notebook/ai/map/${n.id}`}
                        onMouseEnter={() => setFocus(n.id)}
                        onMouseLeave={() => setFocus((f) => (f === n.id ? null : f))}
                        onFocus={() => setFocus(n.id)}
                        title={`${n.name} — ${n.tagline}`}
                        className={`group inline-flex items-center gap-1.5 border px-2 py-1 transition-all ${ring} ${
                          dimmed ? "opacity-25" : "opacity-100"
                        } border-border hover:border-foreground/50`}
                        data-testid={`ai-map-node-${n.id}`}
                      >
                        <span
                          className="w-1.5 h-1.5 shrink-0"
                          style={{ background: layerColor(n.layer) }}
                        />
                        <span className="font-mono text-[11px] text-foreground/90 group-hover:text-foreground whitespace-nowrap">
                          {n.name}
                        </span>
                        {n.chokepoint && (
                          <span className="text-amber-300 text-[10px] leading-none" title="Supply-chain chokepoint">
                            ⬦
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 font-mono text-[10px] text-muted-foreground/50 leading-relaxed">
        Hover any entity to light up what it <span className="text-emerald-300">depends on</span> and what it{" "}
        <span className="text-sky-300">feeds</span>. Tap to open its topic — story, 3D placement in the stack, and the
        news attached to it. ⬦ marks a supply-chain chokepoint.
      </p>
    </div>
  );
}
