"use client";
import * as React from "react";
import { Link } from "@/lib/router-shim";
import { getNode, groupOf, LAYER_BY_ID, NODE_TYPE_META, RELATION_META, type AiNode } from "@/data/aiOntology";
import { logoUrl } from "@/data/aiLogos";
import { FollowButton } from "./Watch";
import { DEGREE, rankedSearch, searchAll, type AiScope, type Analysis, type CategoryHit, type Edge, type GroupHit } from "./intelModel";
import { fileSections, scrollToSection } from "./entityFile";

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
// Dossier: who the entity is, the table of contents of its file, and the graph's questions
// ---------------------------------------------------------------------------

/**
 * The side panel for a selected entity. Its figures live once, in the file below the stage; the panel names the entity,
 * lists the file's sections with what each holds (click to scroll there), and keeps the questions only the graph can
 * answer: who is exposed, what it depends on, how it connects to another entity.
 */
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
  const headId = groupOf(id);
  const head = headId ? getNode(headId) : undefined;
  const sections = fileSections(id);
  const filled = sections.filter((s) => !s.empty);
  const empty = sections.filter((s) => s.empty);

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

      <nav aria-label="Sections of this file" data-testid="intel-dossier-toc">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">In this file</p>
        <ol className="divide-y divide-border border border-border">
          {filled.map((s) => (
            <li key={s.id} className="flex items-center">
              <button type="button" onClick={() => scrollToSection(s.id)} className="flex min-w-0 flex-1 items-baseline justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-foreground/[0.06]">
                <span className="font-mono text-[11px] text-foreground">{s.label}</span>
                {s.count && <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{s.count}</span>}
              </button>
              {s.pages.map((p) => (
                <Link key={p.href} to={p.href} title={`${p.label}: its own page`} aria-label={`${p.label}: its own page`} className="shrink-0 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
                  ↗
                </Link>
              ))}
            </li>
          ))}
        </ol>
        {empty.length > 0 && <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">Not collected yet: {empty.map((s) => s.label).join(" · ")}.</p>}
      </nav>

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
    </div>
  );
}
