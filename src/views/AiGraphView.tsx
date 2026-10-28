"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { Link } from "@/lib/router-shim";
import { getNode, LAYERS, ONTOLOGY_COUNTS } from "@/data/aiOntology";
import { AI_DEAL_EDGES, AI_INTEL } from "@/data/aiIntel";
import { EDGES, EMPTY_SCOPE, type AiScope } from "@/components/ai/intelModel";
import AiDashboard from "@/components/ai/AiDashboard";

/** What the server sends, and what shows until the 3D view has loaded (or where it cannot run). */
function StagePlaceholder({ flat }: { flat?: boolean }) {
  return (
    <div className="grid w-full aspect-[16/10] min-h-[560px] max-h-[86vh] place-items-center border border-border bg-background p-6 text-center font-mono">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">{flat ? "Flat graph" : "AI Intelligence Graph"}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Starting the view</p>
        <noscript>
          <p className="mt-3 max-w-md text-[11px] normal-case tracking-normal text-muted-foreground">
            The graph needs JavaScript. The dashboard below carries the same figures, and the list view links every entity.
          </p>
        </noscript>
      </div>
    </div>
  );
}

// The 3D view and the flat graph load in the browser only (WebGL and canvas); the dashboard renders on the server.
const AiUniverse = dynamic(() => import("@/components/ai/AiUniverse"), { ssr: false, loading: () => <StagePlaceholder /> });
const IntelGraph = dynamic(() => import("@/components/ai/IntelGraph"), { ssr: false, loading: () => <StagePlaceholder flat /> });

type View = "universe" | "flat";

/** The page's state in the URL, so any view can be linked: ?focus=, ?compare=, ?layer=, ?type=, ?view=. */
function readUrl(): { scope: AiScope; view: View } {
  const sp = new URLSearchParams(window.location.search);
  const view: View = sp.get("view") === "flat" ? "flat" : "universe";
  const focus = sp.get("focus");
  const n = focus ? getNode(focus) : undefined;
  if (n) {
    const cmp = sp.get("compare");
    return { scope: { layer: n.layer, type: `${n.layer}:${n.type}`, entity: n.id, compare: cmp && getNode(cmp) && cmp !== n.id ? cmp : null }, view };
  }
  const layer = Number(sp.get("layer"));
  const type = sp.get("type");
  if (sp.has("layer") && LAYERS.some((L) => L.id === layer)) {
    return { scope: { layer, type: type && type.startsWith(`${layer}:`) ? type : null, entity: null, compare: null }, view };
  }
  return { scope: EMPTY_SCOPE, view };
}

export default function AiGraphView() {
  const [scope, setScope] = React.useState<AiScope>(EMPTY_SCOPE);
  const [view, setView] = React.useState<View>("universe");
  // The URL is read once, and written only after that read has landed in state (otherwise the first write, with the
  // empty starting scope, would wipe the link being opened).
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const s = readUrl();
    setScope(s.scope);
    setView(s.view);
    setReady(true);
  }, []);
  React.useEffect(() => {
    if (!ready) return;
    const sp = new URLSearchParams(window.location.search);
    for (const k of ["focus", "compare", "layer", "type", "view"]) sp.delete(k);
    if (scope.entity) {
      sp.set("focus", scope.entity);
      if (scope.compare) sp.set("compare", scope.compare);
    } else if (scope.layer != null) {
      sp.set("layer", String(scope.layer));
      if (scope.type) sp.set("type", scope.type);
    }
    if (view === "flat") sp.set("view", "flat");
    const qs = sp.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [scope, view, ready]);

  const companyFiles = Object.values(AI_INTEL).filter((x) => x.series.some((s) => !s.metric.startsWith("share_")) || x.people.length).length;
  const asOf = Object.values(AI_INTEL)
    .map((x) => x.asOf)
    .filter((x): x is string => !!x)
    .sort()
    .pop();
  const onSelectFlat = React.useCallback(
    (id: string | null) => {
      const n = id ? getNode(id) : undefined;
      setScope(n ? { layer: n.layer, type: `${n.layer}:${n.type}`, entity: n.id, compare: null } : { ...scope, entity: null, compare: null });
    },
    [scope],
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <Link
              to="/notebook/ai/map"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              ← The AI Systems Map
            </Link>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-1">AI Notebook · Intelligence graph</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow">The AI Intelligence Graph</h1>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mt-2">
              Every company, chip, mineral, power source, fund and policy in the AI economy, linked by how they depend on, fund, supply and compete with each other.
              Pick any entity, layer or category: the graph flies there and the dashboard below follows, from the whole stack down to one company&apos;s deals and filings.
            </p>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 font-mono">
            {[
              [ONTOLOGY_COUNTS.nodes.toLocaleString("en-US"), "entities"],
              [EDGES.length.toLocaleString("en-US"), "typed links"],
              [String(AI_DEAL_EDGES.length), "deals quoted from filings"],
              [String(companyFiles), companyFiles === 1 ? "company file" : "company files"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-xl font-bold text-foreground">{v}</dd>
                <dd className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div role="tablist" aria-label="Graph view" className="mb-2 inline-flex border border-border font-mono text-[10px] uppercase tracking-[0.18em]">
          {(
            [
              ["universe", "3D universe"],
              ["flat", "Flat graph"],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 ${view === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`ai-graph-view-${v}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "universe" ? (
          <AiUniverse scope={scope} onScope={setScope} fallback={<IntelGraph selected={scope.entity} onSelect={onSelectFlat} />} />
        ) : (
          <IntelGraph selected={scope.entity} onSelect={onSelectFlat} />
        )}

        <AiDashboard scope={scope} onScope={setScope} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground/70">
          <p>
            Links come from the AI Systems Map ontology. Deals carry the filing&apos;s own wording and a quote, checked against the document
            {asOf ? `; latest source ${asOf}` : ""}. Not investment advice.
          </p>
          <Link to="/notebook/ai/map" className="underline hover:text-foreground">
            Browse every entity as a list →
          </Link>
        </div>
      </div>
    </div>
  );
}
