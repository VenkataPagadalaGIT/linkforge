"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import { nodes as ALL_NODES, getNode, LAYERS, NODE_TYPE_META, type AiNode } from "@/data/aiOntology";
import { AI_INTEL } from "@/data/aiIntel";
import { AI_360 } from "@/data/ai360";
import { logoUrl } from "@/data/aiLogos";
import { DEGREE, dealsOf, type AiScope } from "./intelModel";
import { sections360For } from "@/lib/ai360-sections";
import { entityPath, sectionPath } from "@/lib/graph-urls";

/**
 * One experience, four views. The map page and the graph page share this switch: Map is the layered catalog
 * (/notebook/ai/map), 2D and 3D are the graph page's two renderings, List is a sortable table of every entity.
 * Slugs are frozen, so the switch routes between the two pages instead of inventing new URLs.
 */
export type ViewId = "map" | "flat" | "universe" | "list";
export const VIEWS: { id: ViewId; label: string; hint: string }[] = [
  { id: "map", label: "Map", hint: "The stack layer by layer, every entity as a chip" },
  { id: "flat", label: "2D graph", hint: "Nodes and typed links on a flat canvas" },
  { id: "universe", label: "3D universe", hint: "Layers as clusters, money as arcs, brand marks on the biggest stars" },
  { id: "list", label: "List", hint: "Every entity in a sortable table with its files" },
];

export function ViewSwitch({ current, onPick, scopeQuery }: { current: ViewId; onPick?: (v: Exclude<ViewId, "map">) => void; scopeQuery?: string }) {
  const q = scopeQuery ? `&${scopeQuery}` : "";
  return (
    <div role="tablist" aria-label="View" className="inline-flex border border-border font-mono text-[10px] uppercase tracking-[0.18em]" data-testid="ai-view-switch">
      {VIEWS.map((v) => {
        const cls = `px-3 py-1.5 ${current === v.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`;
        if (v.id === "map") {
          return (
            <Link key={v.id} to="/notebook/ai/map" role="tab" aria-selected={current === "map"} title={v.hint} className={cls} data-testid="ai-graph-view-map">
              {v.label}
            </Link>
          );
        }
        const id = v.id as Exclude<ViewId, "map">;
        if (onPick) {
          return (
            <button key={v.id} type="button" role="tab" aria-selected={current === v.id} title={v.hint} onClick={() => onPick(id)} className={cls} data-testid={`ai-graph-view-${v.id}`}>
              {v.label}
            </button>
          );
        }
        return (
          <Link key={v.id} to={`/notebook/ai/graph?view=${v.id}${q}`} role="tab" aria-selected={current === v.id} title={v.hint} className={cls} data-testid={`ai-graph-view-${v.id}`}>
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The seven layers, defined
// ---------------------------------------------------------------------------

const byDegree = (a: AiNode, b: AiNode) => (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0);

/** What each layer means, with its counts and the names people know, so the classification reads at a glance. */
export function LayerLegend({ onScope, active, compact = false }: { onScope?: (s: AiScope) => void; active?: number | null; compact?: boolean }) {
  const [open, setOpen] = React.useState(!compact);
  return (
    <section className="border border-border" aria-labelledby="ai-layers-heading" data-testid="ai-layer-legend">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
        <span id="ai-layers-heading" className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">
          How the AI stack is classified · {LAYERS.length} layers, demand at the top, the ground at the bottom
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ol className="grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-7">
          {LAYERS.map((L) => {
            const members = ALL_NODES.filter((n) => n.layer === L.id);
            const examples = members
              .slice()
              .sort(byDegree)
              .filter((n) => logoUrl(n.id))
              .slice(0, 4);
            const choke = members.filter((n) => n.chokepoint).length;
            const types = new Set(members.map((n) => n.type)).size;
            const on = active === L.id;
            const Inner = (
              <>
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                  <span className="inline-block h-2.5 w-2.5" style={{ background: L.color }} aria-hidden="true" />
                  L{L.id} · {L.label}
                </span>
                <span className="mt-1.5 block font-mono text-[11px] leading-snug text-foreground/85">{L.blurb}</span>
                <span className="mt-2 block font-mono text-[10px] text-muted-foreground">
                  {members.length} entities · {types} types{choke ? ` · ${choke} chokepoints` : ""}
                </span>
                {examples.length > 0 && (
                  <span className="mt-2 flex items-center gap-1" aria-label={`Examples: ${examples.map((e) => e.name).join(", ")}`}>
                    {examples.map((e) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={e.id} src={logoUrl(e.id)!} alt="" title={e.name} width={18} height={18} loading="lazy" className="h-[18px] w-[18px] bg-white object-contain" />
                    ))}
                    <span className="ml-1 truncate font-mono text-[9px] text-muted-foreground">{examples.map((e) => e.name.split(" (")[0]).slice(0, 3).join(", ")}</span>
                  </span>
                )}
              </>
            );
            return (
              <li key={L.id} className={`bg-background ${on ? "outline outline-1 outline-foreground/60" : ""}`}>
                {onScope ? (
                  <button type="button" onClick={() => onScope({ layer: on ? null : L.id, type: null, entity: null, compare: null })} className="block h-full w-full p-3 text-left hover:bg-foreground/[0.04]" aria-pressed={on}>
                    {Inner}
                  </button>
                ) : (
                  <Link to={`/notebook/ai/graph?layer=${L.id}`} className="block h-full p-3 hover:bg-foreground/[0.04]">
                    {Inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The list view: every entity, sortable, with its files
// ---------------------------------------------------------------------------

type SortKey = "name" | "layer" | "type" | "links" | "deals" | "file";
const fmt = (v: number) => v.toLocaleString("en-US");
const hasFile = (id: string) => (AI_INTEL[id]?.series ?? []).some((s) => !s.metric.startsWith("share_")) || (AI_INTEL[id]?.deals.length ?? 0) > 0;

export function EntityList({ scope, onPick, onScope }: { scope: AiScope; onPick: (id: string) => void; onScope?: (s: AiScope) => void }) {
  const [sort, setSort] = React.useState<SortKey>("links");
  const [dir, setDir] = React.useState<1 | -1>(-1);
  const [q, setQ] = React.useState("");
  const rows = React.useMemo(() => {
    let xs = ALL_NODES.slice();
    if (scope.type) xs = xs.filter((n) => `${n.layer}:${n.type}` === scope.type);
    else if (scope.layer != null) xs = xs.filter((n) => n.layer === scope.layer);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      xs = xs.filter((n) => n.name.toLowerCase().includes(s) || (n.aliases ?? []).some((a) => a.toLowerCase().includes(s)) || NODE_TYPE_META[n.type].label.toLowerCase().includes(s));
    }
    const key = (n: AiNode): string | number => {
      switch (sort) {
        case "name": return n.name.toLowerCase();
        case "layer": return n.layer;
        case "type": return NODE_TYPE_META[n.type].label;
        case "links": return DEGREE.get(n.id) ?? 0;
        case "deals": return dealsOf(n.id).length;
        case "file": return (hasFile(n.id) ? 2 : 0) + (AI_360[n.id] ? 1 : 0);
      }
    };
    return xs.sort((a, b) => {
      const ka = key(a), kb = key(b);
      const c = typeof ka === "number" && typeof kb === "number" ? ka - kb : String(ka).localeCompare(String(kb));
      return c * dir || a.name.localeCompare(b.name);
    });
  }, [scope, sort, dir, q]);
  const th = (k: SortKey, label: string, right = false) => (
    <th className={`px-2 py-2 font-normal ${right ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => {
          if (sort === k) setDir((d) => (d === 1 ? -1 : 1));
          else {
            setSort(k);
            setDir(k === "name" || k === "type" ? 1 : -1);
          }
        }}
        className={`uppercase tracking-[0.15em] ${sort === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        aria-sort={sort === k ? (dir === 1 ? "ascending" : "descending") : "none"}
      >
        {label}
        {sort === k ? (dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
  return (
    <div className="border border-border bg-background" data-testid="ai-entity-list">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or type"
          aria-label="Filter the list"
          className="w-full max-w-xs border border-border bg-transparent px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40"
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {fmt(rows.length)} entities{scope.layer != null ? ` in L${scope.layer}` : ""}
          {scope.layer != null && onScope && (
            <button type="button" onClick={() => onScope({ layer: null, type: null, entity: null, compare: null })} className="ml-2 underline decoration-dotted hover:text-foreground">
              all layers
            </button>
          )}
        </p>
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[760px] font-mono text-[11px]">
          <thead className="sticky top-0 bg-background text-[9px]">
            <tr className="border-b border-border">
              {th("name", "Entity")}
              {th("layer", "Layer")}
              {th("type", "Type")}
              {th("links", "Links", true)}
              {th("deals", "Deals", true)}
              {th("file", "Files")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((n) => {
              const L = LAYERS[n.layer];
              const secs = sections360For(n.id);
              return (
                <tr key={n.id} className="hover:bg-foreground/[0.03]">
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => onPick(n.id)} className="inline-flex items-center gap-2 text-left font-bold text-foreground hover:underline">
                      {logoUrl(n.id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl(n.id)!} alt="" width={18} height={18} loading="lazy" className="h-[18px] w-[18px] shrink-0 bg-white object-contain" />
                      ) : (
                        <span className="inline-block h-[18px] w-[18px] shrink-0" style={{ background: L.color, opacity: 0.6 }} aria-hidden="true" />
                      )}
                      {n.name}
                      {n.chokepoint && <span className="text-amber-700 dark:text-amber-300" title="Chokepoint">⬦</span>}
                    </button>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="inline-block h-2 w-2" style={{ background: L.color }} aria-hidden="true" /> L{n.layer} {L.short}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">{NODE_TYPE_META[n.type].label}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{DEGREE.get(n.id) ?? 0}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{dealsOf(n.id).length || ""}</td>
                  <td className="px-2 py-1.5">
                    <span className="flex flex-wrap gap-1">
                      <Link to={entityPath(n.id)} className="border border-border px-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
                        Page
                      </Link>
                      {hasFile(n.id) && <span className="border border-emerald-600/40 px-1 text-[9px] uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">File</span>}
                      {secs.map((s) => (
                        <Link key={s.id} to={sectionPath(n.id, s.id)} className="border border-border px-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
                          {s.label}
                        </Link>
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
