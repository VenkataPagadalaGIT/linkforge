"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import ScrollReveal from "@/components/ScrollReveal";
import GraphFigure from "@/components/guides/GraphFigure";
import {
  getNode,
  upstreamOf,
  downstreamOf,
  contextOf,
  newsFor,
  NODE_TYPE_META,
  LAYER_BY_ID,
  RELATION_META,
  type Relation,
} from "@/data/aiOntology";
import { buildNodeGraphView } from "@/lib/aiOntologyGraph";

const RelationList = ({ title, arrow, items, tone }: { title: string; arrow: string; items: Relation[]; tone: string }) => {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">
        {title} <span className={tone}>{arrow}</span> · {items.length}
      </p>
      <div className="space-y-1.5">
        {items.map((r) => (
          <Link
            key={`${r.node.id}-${r.relation}`}
            to={`/notebook/ai/map/${r.node.id}`}
            className="group flex items-baseline gap-2 border border-border px-3 py-2 hover:border-foreground/30 transition-all"
          >
            <span className={`font-mono text-[9px] uppercase tracking-wider ${tone} shrink-0 w-24`}>
              {RELATION_META[r.relation]?.label ?? r.relation}
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-display text-sm font-bold text-foreground group-hover:text-glow">{r.node.name}</span>
              {r.node.chokepoint && <span className="text-amber-300 text-[10px] ml-1">⬦</span>}
              {r.note && <span className="block font-mono text-[10px] text-muted-foreground/60 leading-relaxed">{r.note}</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function AiNodeView({ id }: { id: string }) {
  const node = getNode(id);
  if (!node) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="font-mono text-sm text-muted-foreground">Entity not found.</p>
          <Link to="/notebook/ai/map" className="font-mono text-xs text-foreground underline">← The AI Systems Map</Link>
        </div>
      </div>
    );
  }

  const layer = LAYER_BY_ID.get(node.layer)!;
  const up = upstreamOf(node.id);
  const down = downstreamOf(node.id);
  const ctx = contextOf(node.id);
  const news = newsFor(node.id);
  const view = React.useMemo(() => buildNodeGraphView(node.id), [node.id]);
  const context = [...ctx.peers, ...ctx.capital, ...ctx.policy, ...ctx.makes];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal>
          <Link to="/notebook/ai/map" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
            ← The AI Systems Map
          </Link>

          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="px-1.5 py-0.5 text-black font-bold" style={{ background: layer.color }}>
              L{layer.id} · {layer.short}
            </span>
            <span className="text-muted-foreground/60 border border-border px-2 py-0.5">{NODE_TYPE_META[node.type].label}</span>
            {node.chokepoint && <span className="text-amber-300 border border-amber-400/40 px-2 py-0.5">⬦ Chokepoint</span>}
            {node.hq && <span className="text-muted-foreground/50">{node.hq}</span>}
            {node.ticker && node.ticker !== "private" && node.ticker !== "nonprofit" && (
              <span className="text-muted-foreground/50">{node.ticker}</span>
            )}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-3">{node.name}</h1>
          <p className="font-mono text-base text-muted-foreground leading-relaxed max-w-3xl mb-4">{node.tagline}</p>

          <div className="flex flex-wrap gap-3 mb-8 font-mono text-[11px]">
            {node.website && (
              <a href={node.website} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-foreground border border-border px-3 py-1.5 hover:border-foreground/40 transition-all">
                Website ↗
              </a>
            )}
            {node.github && (
              <a href={node.github} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-foreground border border-border px-3 py-1.5 hover:border-foreground/40 transition-all">
                GitHub ↗
              </a>
            )}
          </div>

          {/* Story */}
          <p className="font-mono text-sm text-foreground/90 leading-loose max-w-3xl mb-10 whitespace-pre-line">{node.story}</p>

          {/* Key facts */}
          {node.keyFacts && node.keyFacts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
              {node.keyFacts.map((f, i) => (
                <div key={i} className="border border-border p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">{f.label}</p>
                  <p className="font-display text-sm font-bold text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>

        {/* Ecosystem visualization */}
        {view && (
          <ScrollReveal>
            <section className="mb-14">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-display text-xl font-bold text-foreground">How it fits the stack</h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-5 max-w-3xl">
                {node.name} with what it depends on (above) and what it feeds (below). The figure renders as a
                crawlable diagram and upgrades to an interactive 3D graph as it scrolls into view.
              </p>
              <div className="border border-border p-3">
                <GraphFigure view={view} />
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Relationships */}
        <ScrollReveal>
          <section className="grid md:grid-cols-2 gap-8 mb-14">
            <RelationList title="Depends on" arrow="↑" items={up} tone="text-emerald-300" />
            <RelationList title="Feeds" arrow="↓" items={down} tone="text-sky-300" />
          </section>
        </ScrollReveal>

        {context.length > 0 && (
          <ScrollReveal>
            <section className="mb-14">
              <RelationList title="Context — capital, rivals, policy" arrow="·" items={context} tone="text-fuchsia-300" />
            </section>
          </ScrollReveal>
        )}

        {/* Related news */}
        {news.length > 0 && (
          <ScrollReveal>
            <section className="mb-14">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 mb-4">
                In the news · {news.length}
              </p>
              <div className="space-y-2">
                {news.map((u) => (
                  <Link key={u.id} to={`/ai-updates/${u.slug}`} className="group block border border-border p-4 hover:border-foreground/30 transition-all">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
                      {u.company} · {u.date}
                    </p>
                    <p className="font-display text-sm font-bold text-foreground group-hover:text-glow">{u.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed mt-1 line-clamp-2">{u.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <Link to="/notebook/ai/map" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to the AI Systems Map
          </Link>
        </ScrollReveal>
      </div>
    </div>
  );
}
