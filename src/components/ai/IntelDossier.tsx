"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import { getNode, groupOf, LAYER_BY_ID, LAYERS, membersOf, NODE_TYPE_META, RELATION_META, type AiNode } from "@/data/aiOntology";
import { intelFor, type IntelDeal } from "@/data/aiIntel";
import { logoUrl } from "@/data/aiLogos";
import { isShareMetric, pctText, sharesOf } from "./AiShares";
import { FollowButton } from "./Watch";
import { CAT_COLOR, CATS, DEGREE, EDGES_OF, INSTRUMENT_LABEL, KPI_PRIORITY, dealAmount, monthYear, orderSeries, rankedSearch, searchAll, seriesValue, type AiScope, type Analysis, type CategoryHit, type Edge, type GroupHit } from "./intelModel";

// ---------------------------------------------------------------------------
// Search box (command-palette style)
// ---------------------------------------------------------------------------

export function SearchBox({
  placeholder,
  onPick,
  onPickScope,
  autoFocus,
  compact,
}: {
  placeholder: string;
  onPick: (id: string) => void;
  /** Also offer categories (layers and types of entity): picking one drills there. */
  onPickScope?: (s: AiScope) => void;
  autoFocus?: boolean;
  /** The 3D view's toolbar: a short input on a translucent background. */
  compact?: boolean;
}) {
  const [q, setQ] = React.useState("");
  const [i, setI] = React.useState(0);
  const grouped = !!onPickScope;
  const res = React.useMemo(() => (grouped ? searchAll(q) : { groups: [], categories: [], members: [], memberOf: null, matches: rankedSearch(q, 8) }), [q, grouped]);
  type Row = { key: string; cat: CategoryHit; n?: undefined; g?: undefined } | { key: string; g: GroupHit; n?: undefined; cat?: undefined } | { key: string; n: AiNode; cat?: undefined; g?: undefined };
  const groups: { title: string | null; rows: Row[] }[] = [];
  if (res.groups.length) groups.push({ title: "Companies", rows: res.groups.map((g) => ({ key: `g-${g.id}`, g })) });
  if (res.categories.length) groups.push({ title: "Categories", rows: res.categories.map((c) => ({ key: `c-${c.scope.type ?? c.scope.layer}`, cat: c })) });
  if (res.members.length) groups.push({ title: res.memberOf, rows: res.members.map((n) => ({ key: `m-${n.id}`, n })) });
  if (res.matches.length) groups.push({ title: groups.length ? "Names and topics" : null, rows: res.matches.map((n) => ({ key: `n-${n.id}`, n })) });
  const flat = groups.flatMap((g) => g.rows);
  const pick = (r: Row) => {
    if (r.cat) onPickScope?.(r.cat.scope);
    else if (r.g) onPick(r.g.id);
    else onPick(r.n.id);
    setQ("");
    setI(0);
  };
  let k = -1;
  return (
    <div className="relative">
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQ(e.target.value);
          setI(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setI((x) => Math.min(x + 1, flat.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setI((x) => Math.max(x - 1, 0));
          } else if (e.key === "Enter" && flat[i]) pick(flat[i]);
          else if (e.key === "Escape") setQ("");
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={!!q && flat.length > 0}
        aria-autocomplete="list"
        className={`w-full border border-border font-mono text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-foreground/40 ${
          compact ? "bg-background/90 px-2 py-1 text-[11px] leading-[15px]" : "bg-transparent px-3 py-2 text-sm"
        }`}
        data-testid="intel-graph-search"
      />
      {q && flat.length > 0 && (
        <div className="absolute z-50 mt-1 w-full min-w-[300px] max-h-[26rem] overflow-auto border border-border bg-background shadow-lg" role="listbox" data-testid="intel-graph-search-results">
          {groups.map((g) => (
            <div key={g.title ?? "all"} role="group" aria-label={g.title ?? "Results"}>
              {g.title && <p className="border-b border-border px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{g.title}</p>}
              {g.rows.map((r) => {
                k += 1;
                const idx = k;
                const active = idx === i;
                return (
                  <button
                    key={r.key}
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setI(idx)}
                    onClick={() => pick(r)}
                    className={`block w-full px-3 py-1.5 text-left ${active ? "bg-foreground/[0.06]" : ""} hover:bg-foreground/[0.06]`}
                  >
                    {r.g ? (
                      <>
                        <span className="font-display text-sm font-bold text-foreground">{r.g.name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">Group · {r.g.units} units across the stack</span>
                      </>
                    ) : r.cat ? (
                      <>
                        <span className="font-mono text-[12px] font-bold text-foreground">{r.cat.label}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">{r.cat.count} entities · open the segment</span>
                      </>
                    ) : (
                      <>
                        <span className="font-display text-sm font-bold text-foreground">{r.n.name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          L{r.n.layer} · {NODE_TYPE_META[r.n.type].label}
                          {r.n.ticker && r.n.ticker !== "private" ? ` · ${r.n.ticker}` : ""} · {DEGREE.get(r.n.id) ?? 0} links
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {q && flat.length === 0 && (
        <p className="absolute z-50 mt-1 w-full min-w-[240px] border border-border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground shadow-lg">No entity or category matches.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dossier: one entity's file, numbers first
// ---------------------------------------------------------------------------

const SIDE_LABEL: Record<IntelDeal["side"], string> = { buys: "buys from", sells: "sells to", receives: "funded by", provides: "backs" };

export function Dossier({
  id,
  onSelect,
  analysis,
  setAnalysis,
  hops,
  setHops,
  pathTo,
  setPathTo,
  pathResult,
  reachCount,
}: {
  id: string;
  onSelect: (id: string) => void;
  analysis: Analysis;
  setAnalysis: (a: Analysis) => void;
  hops: number;
  setHops: (h: number) => void;
  pathTo: string | null;
  setPathTo: (id: string | null) => void;
  pathResult: { ids: string[]; edges: Edge[] } | null | undefined;
  reachCount: number;
}) {
  const n = getNode(id)!;
  const layer = LAYER_BY_ID.get(n.layer)!;
  const intel = intelFor(id);
  const headId = groupOf(id);
  const head = headId ? getNode(headId) : undefined;
  const units = membersOf(id)
    .map((x) => getNode(x)!)
    .filter(Boolean)
    .sort((a, b) => (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0));
  const rel = EDGES_OF.get(id) ?? [];
  // One chip per counterparty in each category: two links to the same company (it supplies and it invests) are one chip, its title listing both.
  const byCat = CATS.map((c) => {
    const seen = new Map<string, { other: string; notes: string[]; count: number }>();
    for (const e of rel.filter((x) => x.cat === c.id)) {
      const other = e.from === id ? e.to : e.from;
      const cur = seen.get(other) ?? { other, notes: [], count: 0 };
      cur.count += 1;
      cur.notes.push(e.note ?? RELATION_META[e.relation].label);
      seen.set(other, cur);
    }
    return { c, items: [...seen.values()].sort((a, b) => (DEGREE.get(b.other) ?? 0) - (DEGREE.get(a.other) ?? 0)) };
  }).filter((x) => x.items.length);
  const deals = (intel?.deals ?? []).slice().sort((a, b) => (b.amountHigh ?? b.amount ?? 0) - (a.amountHigh ?? a.amount ?? 0));
  const kpis = orderSeries((intel?.series ?? []).filter((s) => KPI_PRIORITY.includes(s.metric))).slice(0, 4);
  const shares = sharesOf(id).map((g) => ({ g, r: g.rows.find((x) => x.entity === id)! }));
  const hasFile = (intel?.series ?? []).some((s) => !isShareMetric(s.metric)) || (intel?.people.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2 font-mono text-[9px] uppercase tracking-[0.2em]">
          <span className="px-1.5 py-0.5 text-black font-bold" style={{ background: layer.color }}>
            L{layer.id} · {layer.short}
          </span>
          <span className="text-muted-foreground/70 border border-border px-1.5 py-0.5">{NODE_TYPE_META[n.type].label}</span>
          {n.chokepoint && <span className="text-amber-700 dark:text-amber-300 border border-amber-400/40 px-1.5 py-0.5">⬦ Chokepoint</span>}
        </div>
        <div className="flex items-center gap-2.5">
          {logoUrl(id) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl(id)!} alt="" width={36} height={36} className="h-9 w-9 shrink-0 bg-white object-contain p-0.5" />
          )}
          <h2 className="font-display text-2xl font-bold text-foreground leading-tight">{n.name}</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-1">{n.tagline}</p>
        <div className="mt-2">
          <FollowButton id={id} />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
          {[n.hq, n.ticker && n.ticker !== "private" ? n.ticker : null].filter(Boolean).join(" · ")}
        </p>
        {head && (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Part of{" "}
            <button type="button" onClick={() => onSelect(head.id)} className="text-foreground underline decoration-dotted underline-offset-2 hover:text-[color:var(--uni-a,inherit)]">
              {head.name}
            </button>
          </p>
        )}
      </div>

      {units.length > 0 && (
        <div data-testid="intel-dossier-units">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Group · {units.length} {units.length === 1 ? "unit" : "units"}</p>
          <ul className="divide-y divide-border border border-border">
            {units.slice(0, 6).map((u) => (
              <li key={u.id}>
                <button type="button" onClick={() => onSelect(u.id)} className="flex w-full items-baseline justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-foreground/[0.06]">
                  <span className="truncate font-mono text-[11px] text-foreground">{u.name}</span>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    L{u.layer} {LAYERS[u.layer].short} · {DEGREE.get(u.id) ?? 0} links
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {units.length > 6 && <p className="mt-1 font-mono text-[10px] text-muted-foreground">+{units.length - 6} more in the dashboard below</p>}
        </div>
      )}

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-2" data-testid="intel-dossier-kpis">
          {kpis.map((s) => {
            const p = s.points[s.points.length - 1];
            return (
              <div key={s.metric} className="border border-border p-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70 leading-tight">{s.label.replace(/\s*\((more than|approximately)\)$/, "")}</p>
                <p className="font-display text-lg font-bold text-foreground">{seriesValue(s, p.value)}</p>
                <p className="font-mono text-[9px] text-muted-foreground/70">{p.period}</p>
              </div>
            );
          })}
        </div>
      )}

      {shares.length > 0 && (
        <div data-testid="intel-dossier-shares">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Market share</p>
          <ul className="space-y-1.5">
            {shares.map(({ g, r }) => {
              const rank = g.rows.findIndex((x) => x.entity === id) + 1;
              return (
                <li key={g.metric} className="border border-border px-2.5 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-xs font-bold text-foreground">{g.label}</span>
                    <span className="font-mono text-[13px] font-bold text-foreground">{pctText(r.value)}</span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/70">
                    #{rank} of {g.rows.length} listed · {g.period} · {g.estimator}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {deals.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Money · {deals.length} {deals.length === 1 ? "deal" : "deals"} from filings</p>
          <ul className="space-y-1.5">
            {deals.slice(0, 10).map((d) => {
              const ev = d.evidence[0];
              return (
                <li key={`${d.id}-${d.side}`} className="border border-border px-2.5 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <button onClick={() => onSelect(d.counterparty)} className="font-display text-xs font-bold text-foreground hover:underline text-left">
                      <span className="font-mono text-[9px] font-normal uppercase tracking-[0.15em] text-muted-foreground/70 mr-1">{SIDE_LABEL[d.side]}</span>
                      {d.counterpartyName}
                    </button>
                    <span className="font-mono text-[11px] text-foreground whitespace-nowrap">{dealAmount(d)}</span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/70">
                    {INSTRUMENT_LABEL[d.instrument] ?? d.instrument.replace(/_/g, " ")}
                    {d.termEnd ? ` · to ${monthYear(d.termEnd)}` : ""}
                  </p>
                  {ev && (
                    <details className="mt-1">
                      <summary className="cursor-pointer font-mono text-[10px] text-muted-foreground/70 hover:text-foreground">Exact text in the source</summary>
                      <blockquote className="mt-1 border-l-2 border-border pl-2 font-mono text-[10px] leading-relaxed text-muted-foreground">&ldquo;{ev.quote}&rdquo;</blockquote>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-mono text-[10px] text-muted-foreground/70 underline hover:text-foreground">
                          {ev.source || "Source"} ↗
                        </a>
                      )}
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Ask the graph</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setAnalysis(analysis === "exposed" ? "none" : "exposed")}
            aria-pressed={analysis === "exposed"}
            className={`border px-2 py-2 font-mono text-[10px] text-left ${analysis === "exposed" ? "border-foreground text-foreground bg-foreground/[0.06]" : "border-border text-muted-foreground hover:border-foreground/40"}`}
          >
            Who is exposed if it fails?
          </button>
          <button
            onClick={() => setAnalysis(analysis === "depends" ? "none" : "depends")}
            aria-pressed={analysis === "depends"}
            className={`border px-2 py-2 font-mono text-[10px] text-left ${analysis === "depends" ? "border-foreground text-foreground bg-foreground/[0.06]" : "border-border text-muted-foreground hover:border-foreground/40"}`}
          >
            What does it depend on?
          </button>
        </div>
        {(analysis === "exposed" || analysis === "depends") && (
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span>Steps</span>
            {[1, 2, 3].map((h) => (
              <button key={h} onClick={() => setHops(h)} aria-pressed={hops === h} className={`w-7 border py-1 ${hops === h ? "border-foreground text-foreground" : "border-border text-muted-foreground/70"}`}>
                {h}
              </button>
            ))}
            <span className="ml-auto text-foreground">{reachCount} entities</span>
          </div>
        )}
        <div className="mt-2">
          <p className="font-mono text-[10px] text-muted-foreground mb-1">How is it connected to…</p>
          <SearchBox
            placeholder="Pick a second entity"
            onPick={(t) => {
              setPathTo(t);
              setAnalysis("path");
            }}
          />
          {analysis === "path" && pathTo && (
            <div className="mt-2 border border-border p-2.5">
              {pathResult ? (
                <ol className="space-y-1">
                  {pathResult.ids.map((pid, k) => {
                    const e = pathResult.edges[k];
                    return (
                      <li key={pid} className="font-mono text-[11px] text-foreground">
                        <button onClick={() => onSelect(pid)} className="font-bold hover:underline">
                          {getNode(pid)?.name}
                        </button>
                        {e && (
                          <span className="block text-[10px] text-muted-foreground/70 pl-3">
                            ↓ {e.from === pid ? RELATION_META[e.relation].label : `${RELATION_META[e.relation].label} (reverse)`}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="font-mono text-[11px] text-muted-foreground">No path with the link types switched on.</p>
              )}
              <button
                onClick={() => {
                  setPathTo(null);
                  setAnalysis("none");
                }}
                className="mt-2 font-mono text-[10px] text-muted-foreground/70 underline"
              >
                Clear path
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Links · {rel.length}</p>
        <div className="space-y-2">
          {byCat.map(({ c, items }) => (
            <div key={c.id}>
              <p className="font-mono text-[10px] text-muted-foreground mb-1">
                <i className="inline-block w-2.5 h-[2px] align-middle mr-1.5 bg-current" style={{ color: CAT_COLOR[c.id][0] }} />
                {c.label} · {items.length}
              </p>
              <div className="flex flex-wrap gap-1">
                {items.slice(0, 12).map(({ other, notes, count }) => (
                  <button
                    key={other}
                    onClick={() => onSelect(other)}
                    title={[...new Set(notes)].join(" · ")}
                    className="inline-flex items-center gap-1.5 border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground/90 hover:border-foreground/40"
                  >
                    {logoUrl(other) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl(other)!} alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0 bg-white object-contain" loading="lazy" />
                    )}
                    {getNode(other)?.name ?? other}
                    {count > 1 && <span className="text-muted-foreground">×{count}</span>}
                  </button>
                ))}
                {items.length > 12 && <span className="font-mono text-[10px] text-muted-foreground/70 px-1">+{items.length - 12}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {intel && intel.people.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">People · {intel.people.length}</p>
          <ul className="space-y-1">
            {intel.people.slice(0, 5).map((p) => (
              <li key={p.name} className="font-mono text-[11px] text-foreground">
                {p.sitePath ? (
                  <Link to={p.sitePath} className="font-bold hover:underline">
                    {p.name}
                  </Link>
                ) : (
                  <span className="font-bold">{p.name}</span>
                )}
                <span className="text-muted-foreground"> · {p.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to={`/notebook/ai/map/${id}`}
        className="block text-center border border-foreground/60 px-3 py-2 font-mono text-xs text-foreground hover:bg-foreground hover:text-background transition-colors"
      >
        Open the full {hasFile ? "company file" : "entity page"} →
      </Link>
    </div>
  );
}
