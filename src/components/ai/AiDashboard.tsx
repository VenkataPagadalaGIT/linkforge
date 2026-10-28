"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import { nodes as ALL_NODES, getNode, groupOf, LAYERS, membersOf, NODE_TYPE_META, RELATION_META, newsFor, type AiNode } from "@/data/aiOntology";
import { AI_DEAL_EDGES, AI_INTEL, intelFor, type IntelDealEdge, type IntelEvidence } from "@/data/aiIntel";
import { logoUrl } from "@/data/aiLogos";
import {
  ALL_CATS,
  CAT_COLOR,
  CATS,
  DEGREE,
  EDGES,
  EDGES_OF,
  INSTRUMENT_LABEL,
  compareEntities,
  dayMonthYear,
  dealAmount,
  dealsOf,
  monthYear,
  orderSeries,
  periodLabel,
  reach,
  seriesValue,
  type AiScope,
  type Cat,
  type Edge,
} from "./intelModel";
import { SearchBox } from "./IntelDossier";
import { ShareCard, isShareMetric } from "./AiShares";
import { FollowButton, WatchlistStrip, useWatchlist } from "./Watch";
import { AI_360 } from "@/data/ai360";
import { Company360, HiringSection, HiringTable, InvestorsSection, LegalSection, PeopleSection, AdvisorsSection, has360, money } from "./Ai360";
import { AI_SHARES } from "@/data/aiIntel";

const SHOW_DRAFTS = process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1";
const PLATFORM_LABEL: Record<string, string> = { company_blog: "Blog", github: "GitHub release", youtube: "YouTube", substack: "Substack", reddit: "Reddit", linkedin: "LinkedIn", x: "X", podcast: "Podcast", conference: "Talk", paper: "Paper" };

/**
 * The dashboard under the graph: it follows the graph's selection (all of AI, a layer, a type, one entity) and
 * drills down the same way, like a market terminal's sector screens. Every figure comes from the ontology; a feed
 * that is not collected yet says so and lists what it will cover, instead of showing anything that looks like data.
 */

type Tab = "overview" | "f360" | "connections" | "money" | "investors" | "share" | "people" | "legal" | "news" | "earnings";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "f360", label: "360" },
  { id: "connections", label: "Connections" },
  { id: "money", label: "Money" },
  { id: "investors", label: "Investors" },
  { id: "share", label: "Market share" },
  { id: "people", label: "People and hiring" },
  { id: "legal", label: "Legal" },
  { id: "news", label: "News and events" },
  { id: "earnings", label: "Earnings calls" },
];

const CHOKE = new Set(ALL_NODES.filter((n) => n.chokepoint).map((n) => n.id));
const byDegree = (a: string, b: string) => (DEGREE.get(b) ?? 0) - (DEGREE.get(a) ?? 0) || a.localeCompare(b);
const isPublic = (n: AiNode) => !!n.ticker && n.ticker !== "private" && !/proposed/i.test(n.ticker);
const typeKey = (n: AiNode) => `${n.layer}:${n.type}`;
const fmt = (v: number) => v.toLocaleString("en-US");

/** Supply-chain links as dependent > supplier pairs (which way the dependency runs, whatever the verb). */
const DEP = EDGES.flatMap((e) => {
  const dir = RELATION_META[e.relation]?.dir;
  if (dir === "up") return [{ dep: e.from, sup: e.to, e }];
  if (dir === "down") return [{ dep: e.to, sup: e.from, e }];
  return [];
});
const LAYER_OF = new Map(ALL_NODES.map((n) => [n.id, n.layer]));
/** How many supply links run from each layer (dependent) to each layer (supplier). */
const MATRIX = (() => {
  const m = LAYERS.map(() => LAYERS.map(() => 0));
  for (const { dep, sup } of DEP) m[LAYER_OF.get(dep)!][LAYER_OF.get(sup)!] += 1;
  return m;
})();

/** Segments whose market shares are still to be sourced: the segment and the players the graph already holds. */
const SHARE_PLAN: { scope: string; segment: string; players: string[]; metric: string }[] = [
  { scope: "2", segment: "Data-center AI accelerators", players: ["nvidia", "amd", "broadcom", "google-tpu"], metric: "share_ai_accelerator_revenue_pct" },
  { scope: "3:packaging", segment: "Advanced packaging", players: ["cowos", "ase", "amkor"], metric: "share_advanced_packaging_pct" },
  { scope: "4:equipment", segment: "Lithography", players: ["asml"], metric: "share_lithography_pct" },
  { scope: "0", segment: "Consumer AI assistants", players: ["openai-consumer", "gemini-model", "claude-model"], metric: "share_consumer_assistant_pct" },
].filter((p) => !AI_SHARES.some((g) => g.metric === p.metric));
/** A company file means figures from the company's own documents, not only a market-share estimate. */
const hasFile = (id: string) => (AI_INTEL[id]?.series ?? []).some((s) => !isShareMetric(s.metric)) || (AI_INTEL[id]?.people.length ?? 0) > 0;

function idsIn(scope: AiScope): string[] {
  if (scope.entity) return [scope.entity];
  if (scope.type) return ALL_NODES.filter((n) => typeKey(n) === scope.type).map((n) => n.id);
  if (scope.layer != null) return ALL_NODES.filter((n) => n.layer === scope.layer).map((n) => n.id);
  return ALL_NODES.map((n) => n.id);
}

function statsOf(ids: string[]) {
  const S = new Set(ids);
  const touching = new Set<Edge>();
  for (const id of ids) for (const e of EDGES_OF.get(id) ?? []) touching.add(e);
  let dependsOut = 0, suppliesOut = 0;
  for (const { dep, sup } of DEP) {
    if (S.has(dep) && !S.has(sup)) dependsOut += 1;
    if (S.has(sup) && !S.has(dep)) suppliesOut += 1;
  }
  return {
    entities: ids.length,
    links: touching.size,
    deals: AI_DEAL_EDGES.filter((d) => S.has(d.from) || S.has(d.to)).length,
    choke: ids.filter((id) => CHOKE.has(id)).length,
    publicCos: ids.filter((id) => isPublic(getNode(id)!)).length,
    files: ids.filter(hasFile).length,
    dependsOut,
    suppliesOut,
  };
}

/** A deal's quotes: they live on the company files, matched by party, instrument and summary. */
function dealEvidence(d: IntelDealEdge): IntelEvidence[] {
  for (const side of [d.from, d.to]) {
    const hit = AI_INTEL[side]?.deals.find((x) => x.instrument === d.instrument && x.summary === d.summary);
    if (hit?.evidence.length) return hit.evidence;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

const H = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="mb-2 flex items-baseline justify-between gap-3">
    <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{children}</h3>
    {aside && <span className="font-mono text-[10px] text-muted-foreground">{aside}</span>}
  </div>
);

function Kpis({ items }: { items: [string, string, string?][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4 lg:grid-cols-8">
      {items.map(([label, value, sub]) => (
        <div key={label} className="bg-background p-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground leading-tight">{label}</dt>
          <dd className="mt-1 font-display text-xl font-bold tabular-nums text-foreground">{value}</dd>
          {sub && <dd className="font-mono text-[9px] text-muted-foreground">{sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color?: string }) {
  return (
    <span className="block h-1.5 w-full bg-foreground/10" aria-hidden="true">
      <span className="block h-full" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%`, background: color ?? "hsl(var(--foreground) / 0.6)" }} />
    </span>
  );
}

function EntityChip({ id, onPick, note }: { id: string; onPick: (id: string) => void; note?: string }) {
  const n = getNode(id);
  return (
    <button type="button" onClick={() => onPick(id)} title={note} className="border border-border px-1.5 py-0.5 text-left font-mono text-[10px] text-foreground/90 hover:border-foreground/40">
      {n?.name ?? id}
    </button>
  );
}

function NotCollected({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-border p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">{title}</p>
      <div className="mt-2 space-y-2 font-mono text-[11px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function SegmentOverview({ scope, ids, onScope }: { scope: AiScope; ids: string[]; onScope: (s: AiScope) => void }) {
  const st = statsOf(ids);
  // The next level down: layers, then types, then entities.
  const rows: { key: string; label: string; ids: string[]; to: AiScope }[] =
    scope.type != null
      ? ids
          .slice()
          .sort(byDegree)
          .map((id) => ({ key: id, label: getNode(id)!.name, ids: [id], to: { ...scope, entity: id, compare: null } }))
      : scope.layer != null
        ? [...new Set(ids.map((id) => typeKey(getNode(id)!)))]
            .map((k) => ({ key: k, label: NODE_TYPE_META[getNode(ids.find((id) => typeKey(getNode(id)!) === k)!)!.type].label, ids: ids.filter((id) => typeKey(getNode(id)!) === k), to: { layer: scope.layer, type: k, entity: null, compare: null } }))
            .sort((a, b) => b.ids.length - a.ids.length)
        : LAYERS.map((L) => ({ key: String(L.id), label: `L${L.id} · ${L.label}`, ids: ids.filter((id) => LAYER_OF.get(id) === L.id), to: { layer: L.id, type: null, entity: null, compare: null } }));
  const rowStats = rows.map((r) => ({ r, s: statsOf(r.ids) }));
  const maxLinks = Math.max(1, ...rowStats.map((x) => x.s.links));
  const leaders = ids.slice().sort(byDegree).slice(0, 10);
  const maxDeg = Math.max(1, ...leaders.map((id) => DEGREE.get(id) ?? 0));
  const chokes = ids
    .filter((id) => CHOKE.has(id))
    .map((id) => ({ id, n: reach(id, "exposed", 1, new Set(ALL_CATS)).ids.size - 1 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const level = scope.type != null ? "Entity" : scope.layer != null ? "Type" : "Layer";
  return (
    <div className="space-y-6">
      <Kpis
        items={[
          ["Entities", fmt(st.entities)],
          ["Links", fmt(st.links)],
          ["Deals from filings", fmt(st.deals)],
          ["Chokepoints", fmt(st.choke)],
          ["Public companies", fmt(st.publicCos)],
          ["Company files", fmt(st.files)],
          ["Depends on outside", fmt(st.dependsOut), "supply links in"],
          ["Supplies outside", fmt(st.suppliesOut), "supply links out"],
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <H aside={`${rows.length} rows · click to drill in`}>{level === "Layer" ? "The stack by layer" : level === "Type" ? "Types in this layer" : "Entities in this type"}</H>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-3 py-2 text-left font-normal">{level}</th>
                  {level !== "Entity" && <th className="px-2 py-2 text-right font-normal">Entities</th>}
                  <th className="px-2 py-2 text-left font-normal">Links</th>
                  <th className="px-2 py-2 text-right font-normal">Deals</th>
                  <th className="px-2 py-2 text-right font-normal">Choke</th>
                  <th className="px-2 py-2 text-right font-normal" title="Supply links to suppliers outside the row">Needs</th>
                  <th className="px-3 py-2 text-right font-normal" title="Supply links to dependents outside the row">Feeds</th>
                </tr>
              </thead>
              <tbody>
                {rowStats.map(({ r, s }) => (
                  <tr key={r.key} className="border-t border-border hover:bg-foreground/[0.04]">
                    <td className="max-w-0 px-3 py-0">
                      <button type="button" onClick={() => onScope(r.to)} className="block w-full truncate py-1.5 text-left text-foreground hover:underline" title={r.label}>
                        {r.label}
                      </button>
                    </td>
                    {level !== "Entity" && <td className="px-2 text-right tabular-nums text-foreground/85">{s.entities}</td>}
                    <td className="w-[22%] px-2">
                      <span className="flex items-center gap-2">
                        <span className="w-8 shrink-0 text-right tabular-nums text-foreground/85">{s.links}</span>
                        <Bar value={s.links} max={maxLinks} />
                      </span>
                    </td>
                    <td className="px-2 text-right tabular-nums text-foreground/85">{s.deals || "·"}</td>
                    <td className="px-2 text-right tabular-nums text-foreground/85">{s.choke || "·"}</td>
                    <td className="px-2 text-right tabular-nums text-muted-foreground">{s.dependsOut}</td>
                    <td className="px-3 text-right tabular-nums text-muted-foreground">{s.suppliesOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <H aside="links">Most connected</H>
            <ol className="space-y-1">
              {leaders.map((id, k) => (
                <li key={id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_2.5rem_30%] items-center gap-2 font-mono text-[11px]">
                  <span className="text-right tabular-nums text-muted-foreground">{k + 1}</span>
                  <button type="button" onClick={() => onScope({ layer: LAYER_OF.get(id)!, type: typeKey(getNode(id)!), entity: id, compare: null })} className="truncate text-left text-foreground hover:underline">
                    {getNode(id)!.name}
                  </button>
                  <span className="text-right tabular-nums text-foreground/85">{DEGREE.get(id) ?? 0}</span>
                  <Bar value={DEGREE.get(id) ?? 0} max={maxDeg} />
                </li>
              ))}
            </ol>
          </div>
          {chokes.length > 0 && (
            <div>
              <H aside="entities that depend on it">Chokepoints</H>
              <ul className="space-y-1">
                {chokes.map(({ id, n }) => (
                  <li key={id} className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
                    <button type="button" onClick={() => onScope({ layer: LAYER_OF.get(id)!, type: typeKey(getNode(id)!), entity: id, compare: null })} className="truncate text-left text-foreground hover:underline">
                      <span className="text-amber-700 dark:text-amber-300" aria-hidden="true">
                        ⬦{" "}
                      </span>
                      {getNode(id)!.name}
                    </button>
                    <span className="tabular-nums text-foreground/85">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {scope.layer == null ? <LayerMatrix onScope={onScope} /> : <LayerFlows ids={ids} />}
    </div>
  );
}

/** Which layer leans on which: supply links from each layer (rows, the dependents) to each layer (columns, the suppliers). */
function LayerMatrix({ onScope }: { onScope: (s: AiScope) => void }) {
  const max = Math.max(1, ...MATRIX.flat());
  return (
    <div>
      <H aside="supply links · row depends on column">How the stack leans on itself</H>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-3 py-2 text-left font-normal">Depends on →</th>
              {LAYERS.map((L) => (
                <th key={L.id} className="px-2 py-2 text-center font-normal" title={L.label}>
                  L{L.id} {L.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAYERS.map((R) => (
              <tr key={R.id} className="border-t border-border">
                <td className="px-3 py-0">
                  <button type="button" onClick={() => onScope({ layer: R.id, type: null, entity: null, compare: null })} className="py-1.5 text-left text-foreground hover:underline" title={R.label}>
                    L{R.id} {R.short}
                  </button>
                </td>
                {LAYERS.map((C) => {
                  const v = MATRIX[R.id][C.id];
                  return (
                    <td key={C.id} className="px-2 py-1.5 text-center tabular-nums text-foreground" style={{ background: v ? `hsl(var(--foreground) / ${(0.04 + 0.26 * (v / max)).toFixed(3)})` : undefined }}>
                      {v || <span className="text-muted-foreground">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A segment's supply links in and out, by the other side's layer. */
function LayerFlows({ ids }: { ids: string[] }) {
  const S = new Set(ids);
  const needs = LAYERS.map(() => 0), feeds = LAYERS.map(() => 0);
  for (const { dep, sup } of DEP) {
    if (S.has(dep) && !S.has(sup)) needs[LAYER_OF.get(sup)!] += 1;
    if (S.has(sup) && !S.has(dep)) feeds[LAYER_OF.get(dep)!] += 1;
  }
  const max = Math.max(1, ...needs, ...feeds);
  const col = (title: string, vals: number[]) => (
    <div>
      <H>{title}</H>
      <ul className="space-y-1">
        {LAYERS.map((L) => (
          <li key={L.id} className="grid grid-cols-[minmax(0,9rem)_2.5rem_minmax(0,1fr)] items-center gap-2 font-mono text-[11px]">
            <span className="truncate text-foreground/90" title={L.label}>
              L{L.id} {L.short}
            </span>
            <span className="text-right tabular-nums text-foreground/85">{vals[L.id] || "·"}</span>
            <Bar value={vals[L.id]} max={max} />
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {col("It depends on (supply links, by layer)", needs)}
      {col("Depends on it (supply links, by layer)", feeds)}
    </div>
  );
}

function EntityOverview({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const n = getNode(id)!;
  const intel = intelFor(id);
  const headId = groupOf(id);
  const head = headId ? getNode(headId) : undefined;
  const units = membersOf(id)
    .map((x) => getNode(x)!)
    .filter(Boolean)
    .sort((a, b) => a.layer - b.layer || (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0));
  const all = new Set(ALL_CATS);
  const ex1 = reach(id, "exposed", 1, all).ids.size - 1, ex2 = reach(id, "exposed", 2, all).ids.size - 1;
  const dp1 = reach(id, "depends", 1, all).ids.size - 1, dp2 = reach(id, "depends", 2, all).ids.size - 1;
  const series = orderSeries(intel?.series ?? []);
  const fileSeries = series.filter((s) => !isShareMetric(s.metric));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            L{n.layer} {LAYERS[n.layer].short} · {NODE_TYPE_META[n.type].label}
            {n.ticker && n.ticker !== "private" ? ` · ${n.ticker}` : ""}
            {n.hq ? ` · ${n.hq}` : ""}
            {n.chokepoint ? " · chokepoint" : ""}
          </p>
          <div className="mt-1 flex items-center gap-3">
            {logoUrl(id) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl(id)!} alt="" width={40} height={40} className="h-10 w-10 shrink-0 bg-white object-contain p-0.5" />
            )}
            <h3 className="font-display text-2xl font-bold text-foreground">{n.name}</h3>
          </div>
          <p className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">{n.tagline}</p>
          {head && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Part of{" "}
              <button type="button" onClick={() => onPick(head.id)} className="text-foreground underline decoration-dotted underline-offset-2 hover:text-foreground">
                {head.name}
              </button>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FollowButton id={id} />
          <Link to={`/notebook/ai/map/${id}`} className="border border-foreground/60 px-3 py-2 font-mono text-xs text-foreground hover:bg-foreground hover:text-background transition-colors">
            Open the full {fileSeries.length ? "company file" : "entity page"} →
          </Link>
        </div>
      </div>
      <Kpis
        items={[
          ["Links", fmt(DEGREE.get(id) ?? 0)],
          ["Deals from filings", fmt(dealsOf(id).length)],
          ["Exposed if it fails", fmt(ex1), `${fmt(ex2)} within 2 steps`],
          ["It depends on", fmt(dp1), `${fmt(dp2)} within 2 steps`],
          ...series.slice(0, 4).map((s): [string, string, string] => {
            const p = s.points[s.points.length - 1];
            return [s.label.replace(/\s*\((more than|approximately)\)$/, ""), seriesValue(s, p.value), periodLabel(p.period)];
          }),
        ]}
      />
      {!fileSeries.length && (
        <p className="font-mono text-[11px] text-muted-foreground">No company file yet: revenue, customers and other figures appear here once they are taken from its filings.</p>
      )}
      {units.length > 0 && (
        <div data-testid="ai-dashboard-units">
          <H aside={`${units.length} units · where each sits in the stack`}>The group</H>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-3 py-2 text-left font-normal">Unit</th>
                  <th className="px-2 py-2 text-left font-normal">Layer</th>
                  <th className="px-2 py-2 text-left font-normal">Type</th>
                  <th className="px-2 py-2 text-right font-normal">Links</th>
                  <th className="px-3 py-2 text-right font-normal">Deals</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-foreground/[0.04]">
                    <td className="px-3 py-0">
                      <button type="button" onClick={() => onPick(u.id)} className="py-1.5 text-left text-foreground hover:underline">
                        {u.name}
                      </button>
                    </td>
                    <td className="px-2 text-foreground/85">
                      L{u.layer} {LAYERS[u.layer].short}
                    </td>
                    <td className="px-2 text-foreground/85">{NODE_TYPE_META[u.type].label}</td>
                    <td className="px-2 text-right tabular-nums text-foreground/85">{DEGREE.get(u.id) ?? 0}</td>
                    <td className="px-3 text-right tabular-nums text-foreground/85">{dealsOf(u.id).length || "·"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <H>What it is</H>
          <p className="font-mono text-[12px] leading-relaxed text-foreground/90">{n.story}</p>
        </div>
        {n.keyFacts && n.keyFacts.length > 0 && (
          <div>
            <H aside="from its map entry">Key facts</H>
            <dl className="divide-y divide-border border border-border">
              {n.keyFacts.map((f) => (
                <div key={f.label} className="grid grid-cols-[40%_minmax(0,1fr)] gap-3 px-3 py-1.5 font-mono text-[11px]">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      {series.length > 4 && (
        <div>
          <H aside="from its filings">More figures</H>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {series.slice(4).map((s) => {
              const p = s.points[s.points.length - 1];
              return (
                <div key={s.metric} className="border border-border p-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground leading-tight">{s.label.replace(/\s*\((more than|approximately)\)$/, "")}</p>
                  <p className="font-display text-lg font-bold text-foreground">{seriesValue(s, p.value)}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">{periodLabel(p.period)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="font-mono text-[10px] text-muted-foreground">
        Pick a link to move the graph there:{" "}
        {(EDGES_OF.get(id) ?? [])
          .map((e) => (e.from === id ? e.to : e.from))
          .filter((x, i, a) => a.indexOf(x) === i)
          .sort(byDegree)
          .slice(0, 8)
          .map((x, i) => (
            <React.Fragment key={x}>
              {i ? " · " : ""}
              <button type="button" onClick={() => onPick(x)} className="underline hover:text-foreground">
                {getNode(x)?.name ?? x}
              </button>
            </React.Fragment>
          ))}
      </p>
    </div>
  );
}

/** One entity's links, by what they mean. */
const ROLE_GROUPS: { id: string; label: string; test: (me: string, e: Edge) => boolean }[] = [
  { id: "suppliers", label: "Its suppliers", test: (me, e) => (RELATION_META[e.relation].dir === "up" && e.from === me) || (RELATION_META[e.relation].dir === "down" && e.to === me) },
  { id: "customers", label: "Who depends on it", test: (me, e) => (RELATION_META[e.relation].dir === "down" && e.from === me) || (RELATION_META[e.relation].dir === "up" && e.to === me) },
  { id: "backers", label: "Backed by", test: (me, e) => e.cat === "capital" && e.to === me },
  { id: "backs", label: "Backs", test: (me, e) => e.cat === "capital" && e.from === me },
  { id: "partners", label: "Partners", test: (_me, e) => e.relation === "partners_with" },
  { id: "rivals", label: "Rivals", test: (_me, e) => e.relation === "competes_with" },
  { id: "policy", label: "Policy", test: (_me, e) => e.cat === "policy" },
  { id: "designs", label: "Designs", test: (_me, e) => e.cat === "make" },
];

function EntityConnections({ id, compare, onPick, onCompare }: { id: string; compare: string | null; onPick: (id: string) => void; onCompare: (id: string | null) => void }) {
  const mine = EDGES_OF.get(id) ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROLE_GROUPS.map((g) => {
          const items = mine.filter((e) => g.test(id, e));
          if (!items.length) return null;
          const others = [...new Map(items.map((e) => [e.from === id ? e.to : e.from, e])).entries()].sort((a, b) => byDegree(a[0], b[0]));
          return (
            <div key={g.id} className="border border-border p-3">
              <H aside={String(others.length)}>{g.label}</H>
              <div className="flex flex-wrap gap-1">
                {others.slice(0, 16).map(([o, e]) => (
                  <EntityChip key={o} id={o} onPick={onPick} note={e.note ?? RELATION_META[e.relation].label} />
                ))}
                {others.length > 16 && <span className="px-1 font-mono text-[10px] text-muted-foreground">+{others.length - 16}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border border-border p-4" data-testid="ai-dashboard-compare">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <H>Compare two: what {getNode(id)!.name} shares with another entity</H>
          <div className="w-full max-w-xs">
            <SearchBox placeholder="Compare with…" onPick={(x) => onCompare(x === id ? null : x)} />
          </div>
        </div>
        {compare && compare !== id ? <Comparison a={id} b={compare} onPick={onPick} onClear={() => onCompare(null)} /> : (
          <p className="font-mono text-[11px] text-muted-foreground">Pick a second entity to see their direct links, the suppliers, backers, rivals and regulators they share, and the deals with the same parties. The graph lights the same set.</p>
        )}
      </div>
    </div>
  );
}

function Comparison({ a, b, onPick, onClear }: { a: string; b: string; onPick: (id: string) => void; onClear: () => void }) {
  const c = React.useMemo(() => compareEntities(a, b), [a, b]);
  const A = getNode(a)!, B = getNode(b)!;
  const byCat = CATS.map((k) => ({ k, rows: c.shared.filter((x) => x.cat === k.id) })).filter((x) => x.rows.length);
  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px]">
        <span className="text-foreground">
          <b>{c.shared.length}</b> shared of {A.name}&apos;s {c.counts.a} and {B.name}&apos;s {c.counts.b} connections
        </span>
        <span className="text-foreground">
          Direct:{" "}
          {c.direct.length ? c.direct.map((e) => `${getNode(e.from)?.name} ${RELATION_META[e.relation].label} ${getNode(e.to)?.name}`).join("; ") : "none"}
        </span>
        {c.path && c.path.ids.length > 2 && (
          <span className="text-muted-foreground">
            Shortest chain: {c.path.ids.map((x) => getNode(x)?.name).join(" → ")}
          </span>
        )}
        <button type="button" onClick={onClear} className="ml-auto text-[10px] uppercase tracking-[0.15em] text-muted-foreground underline hover:text-foreground">
          Clear
        </button>
      </div>
      {c.sharedDeals.length > 0 && (
        <div>
          <H>Deals with the same party</H>
          <ul className="space-y-1 font-mono text-[11px]">
            {c.sharedDeals.map((x) => (
              <li key={x.id} className="text-foreground/90">
                <button type="button" onClick={() => onPick(x.id)} className="font-bold hover:underline">
                  {getNode(x.id)?.name}
                </button>
                : {A.name} {dealAmount(x.a)} ({INSTRUMENT_LABEL[x.a.instrument] ?? x.a.instrument}); {B.name} {dealAmount(x.b)} ({INSTRUMENT_LABEL[x.b.instrument] ?? x.b.instrument})
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[620px] border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-3 py-2 text-left font-normal">Shared</th>
              <th className="px-3 py-2 text-left font-normal">{A.name}</th>
              <th className="px-3 py-2 text-left font-normal">{B.name}</th>
            </tr>
          </thead>
          {byCat.map(({ k, rows }) => (
            <tbody key={k.id}>
              <tr className="border-t border-border bg-foreground/[0.03]">
                <td colSpan={3} className="px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  <i className="mr-1.5 inline-block h-[2px] w-3 align-middle" style={{ background: CAT_COLOR[k.id][0] }} />
                  {k.label} · {rows.length}
                </td>
              </tr>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-1.5">
                    <button type="button" onClick={() => onPick(r.id)} className="text-left text-foreground hover:underline">
                      {getNode(r.id)?.name ?? r.id}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-foreground/80">{r.a.join(", ")}</td>
                  <td className="px-3 py-1.5 text-foreground/80">{r.b.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">&ldquo;(them)&rdquo; means the link points the other way: Microsoft invests in (them) reads as Microsoft invests in this company.</p>
    </div>
  );
}

function SegmentConnections({ ids, onPick }: { ids: string[]; onPick: (id: string) => void }) {
  const S = new Set(ids);
  const touching = new Set<Edge>();
  for (const id of ids) for (const e of EDGES_OF.get(id) ?? []) touching.add(e);
  const mix = CATS.map((c) => ({ c, n: [...touching].filter((e) => e.cat === c.id).length }));
  const maxMix = Math.max(1, ...mix.map((x) => x.n));
  // Who outside the segment it leans on most, and who leans on it.
  const count = (pick: (d: { dep: string; sup: string }) => string | null) => {
    const m = new Map<string, number>();
    for (const d of DEP) {
      const o = pick(d);
      if (o) m.set(o, (m.get(o) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || byDegree(a[0], b[0])).slice(0, 10);
  };
  const suppliers = count((d) => (S.has(d.dep) && !S.has(d.sup) ? d.sup : null));
  const dependents = count((d) => (S.has(d.sup) && !S.has(d.dep) ? d.dep : null));
  const list = (title: string, rows: [string, number][]) => (
    <div>
      <H aside="supply links">{title}</H>
      {rows.length ? (
        <ol className="space-y-1">
          {rows.map(([id, n]) => (
            <li key={id} className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
              <button type="button" onClick={() => onPick(id)} className="truncate text-left text-foreground hover:underline">
                {getNode(id)?.name ?? id}
              </button>
              <span className="tabular-nums text-foreground/85">{n}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="font-mono text-[11px] text-muted-foreground">None outside this segment.</p>
      )}
    </div>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div>
        <H aside={`${fmt(touching.size)} links`}>Link mix</H>
        <ul className="space-y-1.5">
          {mix.map(({ c, n }) => (
            <li key={c.id} className="grid grid-cols-[minmax(0,9rem)_3rem_minmax(0,1fr)] items-center gap-2 font-mono text-[11px]" title={c.hint}>
              <span className="text-foreground/90">{c.label}</span>
              <span className="text-right tabular-nums text-foreground/85">{n}</span>
              <Bar value={n} max={maxMix} color={CAT_COLOR[c.id][0]} />
            </li>
          ))}
        </ul>
      </div>
      {list(ids.length === ALL_NODES.length ? "Most depended-on suppliers" : "It leans most on (outside)", ids.length === ALL_NODES.length ? count((d) => d.sup) : suppliers)}
      {list(ids.length === ALL_NODES.length ? "Most dependent entities" : "Leans on it most (outside)", ids.length === ALL_NODES.length ? count((d) => d.dep) : dependents)}
    </div>
  );
}

function MoneyTab({ ids, onPick }: { ids: string[]; onPick: (id: string) => void }) {
  const S = new Set(ids);
  const deals = AI_DEAL_EDGES.filter((d) => S.has(d.from) || S.has(d.to)).sort((a, b) => (b.amountHigh ?? b.amount ?? -1) - (a.amountHigh ?? a.amount ?? -1));
  if (!deals.length)
    return (
      <NotCollected title="No deals from filings here yet">
        <p>Deals enter the graph from filings and primary documents, each with its own wording and the exact quote. This segment has none so far.</p>
      </NotCollected>
    );
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[760px] border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-3 py-2 text-left font-normal">Parties (money runs →)</th>
              <th className="px-2 py-2 text-left font-normal">Kind</th>
              <th className="px-2 py-2 text-right font-normal">Amount</th>
              <th className="px-2 py-2 text-left font-normal">Term</th>
              <th className="px-3 py-2 text-left font-normal">Source</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d, k) => {
              const forward = d.moneyDirection !== "to_from";
              const [p, q] = forward ? [d.from, d.to] : [d.to, d.from];
              const ev = dealEvidence(d)[0];
              return (
                <tr key={k} className="border-t border-border align-top">
                  <td className="px-3 py-1.5">
                    <button type="button" onClick={() => onPick(p)} className="text-foreground hover:underline">
                      {getNode(p)?.name}
                    </button>
                    <span className="text-muted-foreground"> → </span>
                    <button type="button" onClick={() => onPick(q)} className="text-foreground hover:underline">
                      {getNode(q)?.name}
                    </button>
                    <p className="mt-0.5 max-w-[46ch] text-[10px] leading-snug text-muted-foreground">{d.summary}</p>
                  </td>
                  <td className="px-2 py-1.5 text-foreground/85">{INSTRUMENT_LABEL[d.instrument] ?? d.instrument.replace(/_/g, " ")}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right font-bold text-foreground">{dealAmount(d)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-foreground/85">{d.termStart || d.termEnd ? `${monthYear(d.termStart) || "?"} to ${monthYear(d.termEnd) || "?"}` : "·"}</td>
                  <td className="px-3 py-1.5">
                    {ev ? (
                      <details>
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{ev.source || "Source"}</summary>
                        <blockquote className="mt-1 max-w-[52ch] border-l-2 border-border pl-2 text-[10px] leading-relaxed text-muted-foreground">&ldquo;{ev.quote}&rdquo;</blockquote>
                        {ev.url && (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground underline hover:text-foreground">
                            Open the source ↗
                          </a>
                        )}
                      </details>
                    ) : (
                      <span className="text-muted-foreground">·</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">Amounts keep the filing&apos;s own wording (at least, up to, about). They are not added up: a compute commitment, a lease and an equity round are different kinds of money.</p>
    </div>
  );
}

function ShareTab({ scope, onPick }: { scope: AiScope; onPick: (id: string) => void }) {
  const node = scope.entity ? getNode(scope.entity) : undefined;
  const keys = node ? [String(node.layer), typeKey(node)] : scope.type ? [scope.type, String(scope.layer)] : scope.layer != null ? [String(scope.layer)] : null;
  const fits = (segScope: string) => !keys || keys.some((k) => segScope === k || segScope.startsWith(`${k}:`) || k.startsWith(`${segScope}:`));
  const segs = AI_SHARES.filter((g) => (node ? g.rows.some((r) => r.entity === node.id) || fits(g.scope) : fits(g.scope)));
  const others = AI_SHARES.filter((g) => !segs.includes(g));
  const plan = SHARE_PLAN.filter((p) => fits(p.scope));
  return (
    <div className="space-y-6">
      {segs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {segs.map((g) => (
            <ShareCard key={g.metric} seg={g} highlight={node?.id} onPick={onPick} />
          ))}
        </div>
      ) : (
        <NotCollected title="No sourced market share for this segment yet">
          <p>Shares go in only with the estimator, the period and the exact sentence they come from. Until then this panel stays empty rather than showing a guess.</p>
        </NotCollected>
      )}
      {others.length > 0 && (
        <p className="font-mono text-[10px] text-muted-foreground">
          Other segments with sourced shares:{" "}
          {others.map((g, i) => (
            <React.Fragment key={g.metric}>
              {i ? " · " : ""}
              {g.label} ({g.period})
            </React.Fragment>
          ))}
          . Open All of AI to see every segment.
        </p>
      )}
      {plan.length > 0 && (
        <div>
          <H aside="segment · players already in the graph">To source next</H>
          <ul className="divide-y divide-border border border-border">
            {plan.map((p) => (
              <li key={p.segment} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 font-mono text-[11px]">
                <span className="text-foreground">{p.segment}</span>
                <span className="flex flex-wrap gap-1">
                  {p.players
                    .filter((id) => getNode(id))
                    .map((id) => (
                      <EntityChip key={id} id={id} onPick={onPick} />
                    ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Shares are estimates by the firm named on each card, for the period shown, unless a company&apos;s own filing states them. Different firms measure differently, so shares
        from different cards are not compared or added. &ldquo;Others&rdquo; is 100 minus the shares listed.
      </p>
    </div>
  );
}

function NewsTab({ ids }: { ids: string[] }) {
  const items = React.useMemo(() => {
    const out: { key: string; date: string; label: string; what: string; href: string | null; internal: boolean; who: string }[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      for (const ev of AI_INTEL[id]?.events ?? []) {
        const key = `${ev.date}|${ev.headline}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ key, date: ev.date, label: ev.dateLabel ?? dayMonthYear(ev.date), what: ev.headline, href: ev.url, internal: false, who: getNode(id)?.name ?? id });
      }
      for (const u of newsFor(id)) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        out.push({ key: u.id, date: u.date, label: dayMonthYear(u.date), what: u.title, href: `/ai-updates/${u.slug}`, internal: true, who: u.company });
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [ids]);
  return (
    <div className="space-y-4">
      {items.length ? (
        <ol className="divide-y divide-border border border-border">
          {items.map((it) => (
            <li key={it.key} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-3 py-2 font-mono text-[11px] sm:grid-cols-[7.5rem_10rem_minmax(0,1fr)]">
              <span className="tabular-nums text-muted-foreground">{it.label}</span>
              <span className="hidden truncate text-muted-foreground sm:block">{it.who}</span>
              <span className="text-foreground">
                {it.href ? (
                  it.internal ? (
                    <Link to={it.href} className="hover:underline">
                      {it.what}
                    </Link>
                  ) : (
                    <a href={it.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {it.what} ↗
                    </a>
                  )
                ) : (
                  it.what
                )}
                <span className="ml-2 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{it.internal ? "news" : "filing"}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="font-mono text-[11px] text-muted-foreground">No dated events or news linked here yet.</p>
      )}
      <NotCollected title="Wider news feed: not collected yet">
        <p>Today this lists events taken from filings and this site&apos;s own AI updates. A news feed with entity linking (who did what, on which date, from which source) is next, so every move lands on the right company.</p>
      </NotCollected>
    </div>
  );
}

function EarningsTab({ ids, onPick }: { ids: string[]; onPick: (id: string) => void }) {
  const listed = ids
    .map((id) => getNode(id)!)
    .filter(isPublic)
    .sort((a, b) => byDegree(a.id, b.id));
  const filing = ids.map((id) => getNode(id)!).filter((n) => n.ticker && /proposed/i.test(n.ticker));
  return (
    <div className="space-y-4">
      <NotCollected title="Earnings calls: not collected yet">
        <p>
          The plan: each listed company&apos;s results release and prepared remarks (from its SEC filings and investor relations pages), turned into dated signals: guidance,
          capex, supply limits, demand, with the quote behind each one. Those signals feed the forecasts.
        </p>
      </NotCollected>
      {filing.length > 0 && (
        <p className="font-mono text-[11px] text-foreground">
          Filing to list, so no calls yet: {filing.map((n) => `${n.name} (${n.ticker})`).join(", ")}.
        </p>
      )}
      <div>
        <H aside={`${listed.length} listed companies`}>Coverage</H>
        {listed.length ? (
          <div className="flex flex-wrap gap-1">
            {listed.slice(0, 60).map((n) => (
              <button key={n.id} type="button" onClick={() => onPick(n.id)} className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground/90 hover:border-foreground/40">
                {n.ticker} <span className="text-muted-foreground">{n.name}</span>
              </button>
            ))}
            {listed.length > 60 && <span className="px-1 font-mono text-[10px] text-muted-foreground">+{listed.length - 60}</span>}
          </div>
        ) : (
          <p className="font-mono text-[11px] text-muted-foreground">No listed companies in this segment.</p>
        )}
      </div>
    </div>
  );
}

function PeopleTab({ ids, onPick }: { ids: string[]; onPick: (id: string) => void }) {
  const with360 = ids.filter((id) => (AI_360[id]?.people.length ?? 0) > 0);
  const people = ids.filter((id) => !with360.includes(id)).flatMap((id) => (AI_INTEL[id]?.people ?? []).map((p) => ({ ...p, at: getNode(id)?.name ?? id })));
  const posts = ids
    .flatMap((id) => (AI_INTEL[id]?.posts ?? []).map((p) => ({ ...p, at: getNode(id)?.name ?? id })))
    .sort((a, b) => (b.publishedOn ?? "").localeCompare(a.publishedOn ?? ""))
    .slice(0, 30);
  return (
    <div className="space-y-6">
      {ids.length === 1 ? <HiringSection id={ids[0]} /> : <HiringTable ids={ids} onPick={onPick} />}
      {with360.length > 0 && <PeopleSection ids={with360} onPick={onPick} />}
      {posts.length > 0 && (
        <div>
          <H aside="official channels only · newest first">Posts and releases</H>
          <ol className="divide-y divide-border border border-border">
            {posts.map((p) => (
              <li key={p.url} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-3 py-2 font-mono text-[11px] sm:grid-cols-[7.5rem_9rem_minmax(0,1fr)]">
                <span className="tabular-nums text-muted-foreground">{p.publishedOn ? dayMonthYear(p.publishedOn) : "undated"}</span>
                <span className="hidden truncate text-muted-foreground sm:block">{p.at}</span>
                <span className="min-w-0 text-foreground">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {p.title || p.url} ↗
                  </a>
                  <span className="ml-2 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{PLATFORM_LABEL[p.platform] ?? p.platform}</span>
                  {p.summary && <span className="block truncate text-[10px] text-muted-foreground">{p.summary}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {people.length > 0 && <H aside="from filings">More people in public roles</H>}
      {people.length ? (
        <ul className="divide-y divide-border border border-border">
          {people.map((p) => (
            <li key={`${p.at}-${p.name}`} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)] gap-3 px-3 py-2 font-mono text-[11px] sm:grid-cols-[minmax(0,12rem)_10rem_minmax(0,1fr)]">
              {p.sitePath ? (
                <Link to={p.sitePath} className="font-bold text-foreground hover:underline">
                  {p.name}
                </Link>
              ) : (
                <span className="font-bold text-foreground">{p.name}</span>
              )}
              <span className="hidden text-muted-foreground sm:block">{p.at}</span>
              <span className="text-foreground/85">
                {p.role}{" "}
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground underline hover:text-foreground">
                  source ↗
                </a>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        !with360.length && <p className="font-mono text-[11px] text-muted-foreground">No people in public roles recorded here yet.</p>
      )}
      <NotCollected title={posts.length ? "More platforms: not collected yet" : "Posts across platforms: not collected yet"}>
        <p>
          {posts.length ? "Release notes come from each company's GitHub organisation. " : ""}People enter only in public roles, from filings, company pages, talks and papers. Blogs,
          talks, papers and executives&apos; public posts come next, from official channels; LinkedIn and X only through licensed datasets. No scraping of personal profiles.
        </p>
      </NotCollected>
    </div>
  );
}

/** Companies in view that have a 360 file, with what each one covers. */
function Files360({ ids, onPick, only }: { ids: string[]; onPick: (id: string) => void; only?: "rounds" }) {
  const files = ids.filter((id) => has360(id) && (!only || (AI_360[id]?.[only].length ?? 0) > 0));
  return (
    <div className="space-y-3">
      <H aside={`${files.length} of ${fmt(ids.length)} entities`}>{only === "rounds" ? "Funding histories" : "360 company files"}</H>
      {files.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((id) => {
            const f = AI_360[id]!;
            const last = [...f.rounds].reverse().find((r) => r.postMoney);
            return (
              <li key={id}>
                <button type="button" onClick={() => onPick(id)} className="block w-full border border-border p-3 text-left hover:border-foreground/40">
                  <span className="font-display text-sm font-bold text-foreground">{getNode(id)?.name ?? id}</span>
                  <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                    {[
                      f.people.length && `${f.people.length} people`,
                      f.rounds.length && `${f.rounds.length} financings`,
                      last && `${money(last.postMoney)} last valuation`,
                      f.legal.length && `${f.legal.length} legal matters`,
                      f.hiring && `${fmt(f.hiring.open)} open roles`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="font-mono text-[11px] text-muted-foreground">No 360 file in this segment yet.</p>
      )}
      <NotCollected title="How a 360 file is built">
        <p>
          One company at a time, from its own documents: officers, board and founders with their other roles; every financing with its investors; lawsuits it discloses;
          auditors, counsel and underwriters; and every open role on its public job board. Each line carries the exact sentence it comes from.
        </p>
      </NotCollected>
    </div>
  );
}

function No360({ name }: { name: string }) {
  return (
    <NotCollected title={`${name}: 360 file not built yet`}>
      <p>The 360 file adds people and their other roles, funding rounds, legal matters, advisors and hiring, each from the company&apos;s own documents. Anthropic&apos;s is the first; the companies with filings come next.</p>
    </NotCollected>
  );
}

// ---------------------------------------------------------------------------
// The forecast record, and Ask the graph
// ---------------------------------------------------------------------------

/** Forecasts made, resolved and right, over the entities in view. Drafts count only on localhost. */
function ForecastRecord({ ids }: { ids: string[] }) {
  const all = ids.flatMap((id) => (AI_INTEL[id]?.forecasts ?? []).map((f) => ({ ...f, at: getNode(id)?.name ?? id })));
  const shown = all.filter((f) => f.approved || SHOW_DRAFTS);
  const made = shown.length;
  const resolved = shown.filter((f) => f.outcome !== "pending").length;
  const hits = shown.filter((f) => f.outcome === "right").length;
  const open = shown.filter((f) => f.outcome === "pending").sort((a, b) => a.resolvesOn.localeCompare(b.resolvesOn));
  return (
    <div className="border border-border p-3" data-testid="ai-forecast-record">
      <H aside={made ? `${made} made · ${resolved} resolved · ${resolved ? `${Math.round((hits / resolved) * 100)}% right` : "no score yet"}` : undefined}>Forecast record</H>
      {made === 0 ? (
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          No forecast published here yet. Each one names its basis and the date it resolves, is scored afterwards, and the hit rate shows here in public once the first resolves.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {open.slice(0, 4).map((f) => (
            <li key={`${f.at}-${f.statement}`} className="font-mono text-[11px] leading-snug text-foreground">
              <span className="text-muted-foreground">{f.at} · resolves {dayMonthYear(f.resolvesOn)}</span>
              {!f.approved && <span className="ml-2 border border-amber-400/40 px-1 text-[9px] uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">Draft</span>}
              <span className="block">{f.statement}</span>
            </li>
          ))}
          {resolved > 0 && <li className="font-mono text-[10px] text-muted-foreground">{hits} of {resolved} resolved forecasts were right.</li>}
        </ul>
      )}
    </div>
  );
}

const ASK_EXAMPLES = ["Who is exposed if TSMC fails?", "What does Anthropic pay AWS?", "How are Anthropic and OpenAI connected?"];

/** A plain-English question, answered by Claude from the graph's sourced facts (POST /api/ai/ask), with citations. */
function AskBox({ onPick }: { onPick: (id: string) => void }) {
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [res, setRes] = React.useState<{ answer?: string; evidence?: { n: number; entity: string; entityName: string; kind: string; url: string | null; text: string }[]; message?: string; error?: string } | null>(null);
  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/ai/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
      setRes(await r.json());
    } catch {
      setRes({ error: "The question did not reach the server." });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="border border-border p-3" data-testid="ai-ask">
      <H aside="answers only from the graph's sourced facts, with citations">Ask the graph</H>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex gap-1.5"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={300}
          placeholder="Who is exposed if TSMC fails?"
          aria-label="Ask the graph a question"
          className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-foreground/40"
        />
        <button type="submit" disabled={busy || !q.trim()} className="border border-foreground/60 px-3 py-2 font-mono text-xs text-foreground hover:bg-foreground hover:text-background disabled:opacity-50">
          {busy ? "Asking" : "Ask"}
        </button>
      </form>
      <p className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px] text-muted-foreground">
        {ASK_EXAMPLES.map((x) => (
          <button key={x} type="button" onClick={() => { setQ(x); ask(x); }} className="border border-border px-1.5 py-0.5 hover:border-foreground/40 hover:text-foreground">
            {x}
          </button>
        ))}
      </p>
      {res && (
        <div className="mt-3 font-mono text-[12px] leading-relaxed text-foreground" aria-live="polite">
          {res.message && <p className="text-muted-foreground">{res.message}</p>}
          {res.error && <p className="text-muted-foreground">{res.error}</p>}
          {res.answer && <p className="whitespace-pre-line">{res.answer}</p>}
          {res.evidence && res.evidence.length > 0 && (
            <ol className="mt-2 space-y-1 border-t border-border pt-2 text-[10px] text-muted-foreground">
              {res.evidence.map((e) => (
                <li key={e.n}>
                  [E{e.n}]{" "}
                  <button type="button" onClick={() => onPick(e.entity)} className="text-foreground hover:underline">
                    {e.entityName}
                  </button>{" "}
                  · {e.kind}
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="ml-1 underline hover:text-foreground">
                      source ↗
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">Not investment advice.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The dashboard
// ---------------------------------------------------------------------------

export default function AiDashboard({ scope, onScope }: { scope: AiScope; onScope: (s: AiScope) => void }) {
  const [tab, setTab] = React.useState<Tab>("overview");
  const ids = React.useMemo(() => idsIn(scope), [scope]);
  // Opening a followed entity marks what it had so far as seen.
  const watch = useWatchlist();
  const { markSeen } = watch;
  React.useEffect(() => {
    if (scope.entity) markSeen(scope.entity);
  }, [scope.entity, markSeen]);
  const node = scope.entity ? getNode(scope.entity) : undefined;
  const typeName = scope.type ? NODE_TYPE_META[scope.type.split(":")[1] as AiNode["type"]]?.label : null;
  const pick = (id: string) => {
    const n = getNode(id);
    if (n) onScope({ layer: n.layer, type: typeKey(n), entity: id, compare: null });
  };
  // A comparison opens on the Connections tab.
  React.useEffect(() => {
    if (scope.compare) setTab("connections");
  }, [scope.compare]);
  const crumbs: { label: string; to: AiScope | null }[] = [{ label: "All of AI", to: scope.layer != null ? { layer: null, type: null, entity: null, compare: null } : null }];
  if (scope.layer != null) crumbs.push({ label: `L${scope.layer} ${LAYERS[scope.layer].label}`, to: scope.type || scope.entity ? { layer: scope.layer, type: null, entity: null, compare: null } : null });
  if (scope.type && typeName) crumbs.push({ label: typeName, to: scope.entity ? { layer: scope.layer, type: scope.type, entity: null, compare: null } : null });
  if (node) crumbs.push({ label: node.name, to: null });

  return (
    <section className="mt-6 border border-border bg-background" aria-label="Dashboard" data-testid="ai-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <nav aria-label="Dashboard level" className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]">
          <span className="mr-1 font-bold text-foreground">Dashboard</span>
          {crumbs.map((c, i) => (
            <React.Fragment key={c.label}>
              <span className="text-muted-foreground" aria-hidden="true">
                ›
              </span>
              {c.to ? (
                <button type="button" onClick={() => onScope(c.to!)} className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground">
                  {c.label}
                </button>
              ) : (
                <span aria-current={i === crumbs.length - 1 ? "location" : undefined} className="text-foreground">
                  {c.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Follows the graph · {ids.length === 1 ? "1 entity" : `${fmt(ids.length)} entities`}</p>
      </div>
      <WatchlistStrip onPick={pick} />
      <div role="tablist" aria-label="Dashboard sections" className="flex overflow-x-auto border-b border-border [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`ai-dash-${t.id}`}
            id={`ai-dash-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap border-r border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
              tab === t.id ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`ai-dash-${tab}`} aria-labelledby={`ai-dash-tab-${tab}`} className="p-4">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <AskBox onPick={pick} />
              <ForecastRecord ids={ids} />
            </div>
            {node ? <EntityOverview id={node.id} onPick={pick} /> : <SegmentOverview scope={scope} ids={ids} onScope={onScope} />}
          </div>
        )}
        {tab === "connections" &&
          (node ? (
            <EntityConnections id={node.id} compare={scope.compare} onPick={pick} onCompare={(x) => onScope({ ...scope, compare: x })} />
          ) : (
            <SegmentConnections ids={ids} onPick={pick} />
          ))}
        {tab === "money" && <MoneyTab ids={ids} onPick={pick} />}
        {tab === "share" && <ShareTab scope={scope} onPick={pick} />}
        {tab === "news" && <NewsTab ids={ids} />}
        {tab === "earnings" && <EarningsTab ids={ids} onPick={pick} />}
        {tab === "people" && <PeopleTab ids={ids} onPick={pick} />}
        {tab === "f360" && (node ? (has360(node.id) ? <Company360 id={node.id} onPick={pick} onTab={(t) => setTab(t as Tab)} /> : <No360 name={node.name} />) : <Files360 ids={ids} onPick={pick} />)}
        {tab === "investors" &&
          (node ? (
            (AI_360[node.id]?.rounds.length ?? 0) > 0 ? (
              <div className="space-y-6">
                <InvestorsSection id={node.id} onPick={pick} />
                <AdvisorsSection id={node.id} />
              </div>
            ) : (
              <NotCollected title={`${node.name}: funding history not collected yet`}>
                <p>Rounds come from the company&apos;s own filings (S-1, Form D, proxy) and announcements: date, amount, price per share, valuation and who led, each with its sentence.</p>
              </NotCollected>
            )
          ) : (
            <Files360 ids={ids} onPick={pick} only="rounds" />
          ))}
        {tab === "legal" &&
          (ids.some((id) => (AI_360[id]?.legal.length ?? 0) > 0) ? (
            <LegalSection ids={ids} onPick={pick} />
          ) : (
            <NotCollected title="Legal: not collected yet">
              <p>Lawsuits and government actions come from each company&apos;s own filings first, then from public court dockets, each with the sentence or docket entry behind it.</p>
            </NotCollected>
          ))}
      </div>
    </section>
  );
}
