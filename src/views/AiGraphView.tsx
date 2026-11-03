"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { Link } from "@/lib/router-shim";
import { getNode, LAYERS, LAYER_BY_ID, NODE_TYPE_META, ONTOLOGY_COUNTS, type AiNode } from "@/data/aiOntology";
import { logoUrl } from "@/data/aiLogos";
import { EntityList, LayerLegend, VIEWS, ViewSwitch } from "@/components/ai/Views";
import { AI_DEAL_EDGES, AI_INTEL } from "@/data/aiIntel";
import { EDGES, EMPTY_SCOPE, scopeOf, type AiScope } from "@/components/ai/intelModel";
import AiDashboard from "@/components/ai/AiDashboard";
import { entityFromPath, entityPath, GRAPHS, hubPath } from "@/lib/graph-urls";

/** What the server sends, and what shows until the 3D view has loaded (or where it cannot run). */
function StagePlaceholder({ flat }: { flat?: boolean }) {
  return (
    <div className="grid w-full aspect-[16/10] min-h-[560px] max-h-[86vh] place-items-center border border-border bg-background p-6 text-center font-mono">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">{flat ? "Flat graph" : "AI Intelligence Graph"}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Starting the view</p>
        <noscript>
          <p className="mt-3 max-w-md text-[11px] normal-case tracking-normal text-muted-foreground">
            The graph needs JavaScript. The file below carries the same figures, and the list view links every entity.
          </p>
        </noscript>
      </div>
    </div>
  );
}

// The 3D view and the flat graph load in the browser only (WebGL and canvas); the file below renders on the server.
const AiUniverse = dynamic(() => import("@/components/ai/AiUniverse"), { ssr: false, loading: () => <StagePlaceholder /> });
const IntelGraph = dynamic(() => import("@/components/ai/IntelGraph"), { ssr: false, loading: () => <StagePlaceholder flat /> });

type View = "universe" | "flat" | "list";

/**
 * The page's state is its URL: /notebook/ai/graph/<entity> for an entity (plus ?compare=), ?layer= and ?type= for a
 * segment of the hub, ?view= for the rendering. ?focus=<entity> was the old spelling of the entity page and is read once.
 */
function readUrl(): { scope: AiScope; view: View } {
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get("view");
  const view: View = v === "flat" || v === "list" ? v : "universe";
  const id = entityFromPath(window.location.pathname) ?? sp.get("focus");
  const n = id ? getNode(id) : undefined;
  if (n) {
    const cmp = sp.get("compare");
    return { scope: { ...scopeOf(n.id), compare: cmp && getNode(cmp) && cmp !== n.id ? cmp : null }, view };
  }
  const layer = Number(sp.get("layer"));
  const type = sp.get("type");
  if (sp.has("layer") && LAYERS.some((L) => L.id === layer)) {
    return { scope: { layer, type: type && type.startsWith(`${layer}:`) ? type : null, entity: null, compare: null }, view };
  }
  return { scope: EMPTY_SCOPE, view };
}

function urlFor(scope: AiScope, view: View): string {
  const sp = new URLSearchParams();
  if (scope.entity) {
    if (scope.compare) sp.set("compare", scope.compare);
  } else if (scope.layer != null) {
    sp.set("layer", String(scope.layer));
    if (scope.type) sp.set("type", scope.type);
  }
  if (view !== "universe") sp.set("view", view);
  const qs = sp.toString();
  return `${scope.entity ? entityPath(scope.entity) : hubPath()}${qs ? `?${qs}` : ""}`;
}

const EXT = "border border-border px-3 py-1.5 font-mono text-[11px] text-foreground/80 hover:border-foreground/40 hover:text-foreground transition-all";

/** The entity page's own head: breadcrumb, name, what it is, and where it lives on the web. The crumbs stay in the page (the graph refocuses) but are real links for crawlers. */
function EntityHeader({ node, onScope }: { node: AiNode; onScope: (s: AiScope) => void }) {
  const layer = LAYER_BY_ID.get(node.layer)!;
  const logo = logoUrl(node.id);
  const stay = (s: AiScope) => (e: React.MouseEvent) => {
    e.preventDefault();
    onScope(s);
  };
  return (
    <div className="mb-4" data-testid="ai-entity-header">
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <Link to={GRAPHS.ai.notebook} className="hover:text-foreground">{GRAPHS.ai.notebookName}</Link>
        <span aria-hidden="true">›</span>
        <Link to={hubPath()} onClick={stay(EMPTY_SCOPE)} className="hover:text-foreground">{GRAPHS.ai.name}</Link>
        <span aria-hidden="true">›</span>
        <Link to={`${hubPath()}?layer=${node.layer}`} onClick={stay({ layer: node.layer, type: null, entity: null, compare: null })} className="hover:text-foreground">
          L{layer.id} {layer.label}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-foreground">{node.name}</span>
      </nav>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="px-1.5 py-0.5 font-bold text-black" style={{ background: layer.color }}>
          L{layer.id} · {layer.short}
        </span>
        <span className="border border-border px-2 py-0.5 text-muted-foreground">{NODE_TYPE_META[node.type].label}</span>
        {node.chokepoint && <span className="border border-amber-400/40 px-2 py-0.5 text-amber-700 dark:text-amber-300">⬦ Chokepoint</span>}
        {node.hq && <span className="text-muted-foreground">{node.hq}</span>}
        {node.ticker && node.ticker !== "private" && node.ticker !== "nonprofit" && <span className="text-muted-foreground">{node.ticker}</span>}
      </div>
      <div className="mt-2 flex items-center gap-3">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={44} height={44} className="h-11 w-11 shrink-0 bg-white object-contain p-1" />
        )}
        <h1 className="font-display text-3xl font-bold text-foreground text-glow sm:text-4xl">{node.name}</h1>
      </div>
      <p className="mt-2 max-w-3xl font-mono text-xs leading-relaxed text-muted-foreground">{node.tagline}</p>
      {(node.website || node.github) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {node.website && (
            <a href={node.website} target="_blank" rel="noopener noreferrer" className={EXT}>
              Website ↗
            </a>
          )}
          {node.github && (
            <a href={node.github} target="_blank" rel="noopener noreferrer" className={EXT}>
              GitHub ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One page for the whole graph and for every entity in it. With no entity it is the hub (/notebook/ai/graph); with one it
 * is that entity's page (/notebook/ai/graph/<id>): the same stage focused on it, and its file below. Picking another
 * entity in the stage moves the URL (a step in the history), never the page.
 */
export default function AiGraphView({ entity }: { entity?: string }) {
  const [scope, setScope] = React.useState<AiScope>(() => (entity && getNode(entity) ? scopeOf(entity) : EMPTY_SCOPE));
  const [view, setView] = React.useState<View>("universe");
  // The URL is read once after mount (the query adds compare, layer, type and view to what the path said) and written
  // only after that read has landed in state; back and forward re-read it.
  const [ready, setReady] = React.useState(false);
  const lastEntity = React.useRef<string | null>(entity ?? null);
  React.useEffect(() => {
    if (entity && getNode(entity)) setScope(scopeOf(entity));
  }, [entity]);
  React.useEffect(() => {
    const apply = () => {
      const s = readUrl();
      lastEntity.current = s.scope.entity;
      setScope(s.scope);
      setView(s.view);
    };
    apply();
    setReady(true);
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);
  React.useEffect(() => {
    if (!ready) return;
    const next = urlFor(scope, view);
    if (next === `${window.location.pathname}${window.location.search}`) return;
    // Moving between entities is a step in the history (back returns to the previous one); anything else rewrites the entry.
    const push = scope.entity !== lastEntity.current;
    lastEntity.current = scope.entity;
    if (push) window.history.pushState(window.history.state, "", next);
    else window.history.replaceState(window.history.state, "", next);
  }, [scope, view, ready]);

  const node = scope.entity ? getNode(scope.entity) : undefined;
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
        {node ? (
          <EntityHeader node={node} onScope={setScope} />
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <Link to={GRAPHS.ai.map} className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
                ← The AI Systems Map
              </Link>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-1">AI Notebook · Intelligence graph</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow">{GRAPHS.ai.name}</h1>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mt-2">
                Every company, chip, mineral, power source, fund and policy in the AI economy, linked by how they depend on, fund, supply and compete with each other.
                Pick any entity, layer or category: the graph flies there and the file below follows, from the whole stack down to one company&apos;s deals and filings.
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
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ViewSwitch current={view} onPick={(v) => setView(v)} />
          <p className="font-mono text-[10px] text-muted-foreground">{VIEWS.find((x) => x.id === view)?.hint}</p>
        </div>

        {view === "universe" && <AiUniverse scope={scope} onScope={setScope} fallback={<IntelGraph selected={scope.entity} onSelect={onSelectFlat} />} />}
        {view === "flat" && <IntelGraph selected={scope.entity} onSelect={onSelectFlat} />}
        {view === "list" && <EntityList scope={scope} onPick={onSelectFlat} onScope={setScope} />}

        <div className="mt-3">
          <LayerLegend compact active={scope.layer} onScope={setScope} />
        </div>

        <AiDashboard scope={scope} onScope={setScope} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground/70">
          <p>
            Links come from the AI Systems Map ontology. Deals carry the filing&apos;s own wording and a quote, checked against the document
            {asOf ? `; latest source ${asOf}` : ""}. Not investment advice.
          </p>
          <button type="button" onClick={() => setView("list")} className="underline hover:text-foreground">
            Browse every entity as a list →
          </button>
        </div>
      </div>
    </div>
  );
}
