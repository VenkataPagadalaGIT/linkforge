"use client";
import * as React from "react";
import type { TopicGraphData, TopicGraphNode } from "@/data/events";

/**
 * A page's knowledge graph: the topic at the centre, its categories around it, and every person, fact, claim,
 * platform and figure on the outer ring, with the links between them. Laid out once, deterministically (no physics),
 * so the server HTML already holds the whole SVG for crawlers; tap or hover a node to light its links and read them.
 * The same graph is also written out as sentences for agents ("Read the graph as text").
 * Reusable by any page: pass { nodes, edges } with the kinds below.
 */
const KIND_LABEL: Record<string, string> = { actor: "People and organizations", fact: "Key facts", claim: "Claims", platform: "Platforms", money: "Money", category: "Category", event: "Topic" };
const VERDICT: Record<string, string> = { true: "#16a34a", false: "#ef4444", misleading: "#d97706", unconfirmed: "#3b82f6" };
const PLATFORM: Record<string, string> = { official: "#F0B90B", investigators: "#22c55e", news: "#60a5fa", youtube: "#FF0000", tiktok: "#25F4EE", instagram: "#E4405F", x: "#e5e7eb", reddit: "#FF4500", hackernews: "#F0652F" };
const EDGE: Record<string, string> = { carries: "#25F4EE", "is the source for": "#facc15", "is the evidence for the verdict on": "#60a5fa", lost: "#ef4444" };
const FILTERS = [
  { id: "", label: "Everything" },
  { id: "actor", label: "People" },
  { id: "fact", label: "Facts" },
  { id: "claim", label: "Claims" },
  { id: "platform", label: "Platforms" },
  { id: "money", label: "Money" },
];

function color(n: TopicGraphNode) {
  if (n.kind === "event") return "#ef4444";
  if (n.kind === "claim") return VERDICT[n.verdict ?? ""] ?? "#a3a3a3";
  if (n.kind === "platform") return PLATFORM[n.id.slice(2)] ?? "#a3a3a3";
  if (n.kind === "money") return "#f87171";
  if (n.kind === "fact") return "#fde047";
  if (n.kind === "actor") return "#93c5fd";
  return "#e5e7eb";
}

function radius(n: TopicGraphNode, maxCount: number, maxUsd: number) {
  if (n.kind === "event") return 26;
  if (n.kind === "category") return 11;
  if (n.kind === "platform") return 6 + 10 * Math.sqrt((n.count ?? 0) / Math.max(1, maxCount));
  if (n.kind === "money") return 5 + 11 * Math.sqrt((n.usd ?? 0) / Math.max(1, maxUsd));
  if (n.kind === "claim") return 6 + 7 * Math.sqrt((n.count ?? 0) / Math.max(1, maxCount));
  return 6;
}

const short = (s: string, n = 26) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Two decimals: the server and the browser can differ in the last digit of a cosine, which React reports as a
 * hydration mismatch on every coordinate. */
const r2 = (v: number) => Math.round(v * 100) / 100;

export function TopicGraph({ data, title = "The knowledge graph" }: { data: TopicGraphData; title?: string }) {
  const [focus, setFocus] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("");
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  const [wide, setWide] = React.useState(true);
  React.useLayoutEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 620));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);

  // Deterministic radial layout: centre, a ring of categories, and each category's items fanned out behind it.
  const layout = React.useMemo(() => {
    const pos = new Map<string, { x: number; y: number; a: number }>();
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    const center = data.nodes.find((n) => n.kind === "event");
    if (center) pos.set(center.id, { x: 0, y: 0, a: 0 });
    const cats = data.nodes.filter((n) => n.kind === "category");
    const children = new Map<string, string[]>();
    for (const e of data.edges) if (e.label === "includes" || e.label === "lost") children.set(e.source, [...(children.get(e.source) ?? []), e.target]);
    const total = cats.reduce((s, c) => s + Math.max(1, (children.get(c.id) ?? []).length), 0);
    let start = -Math.PI / 2;
    for (const c of cats) {
      const kids = [...new Set(children.get(c.id) ?? [])];
      const span = (2 * Math.PI * Math.max(1, kids.length)) / total;
      const mid = start + span / 2;
      pos.set(c.id, { x: r2(150 * Math.cos(mid)), y: r2(150 * Math.sin(mid)), a: mid });
      kids.forEach((k, i) => {
        const a = start + (span * (i + 0.5)) / kids.length;
        const r = 300 + (i % 2) * 52; // two staggered rings so neighbours do not collide
        pos.set(k, { x: r2(r * Math.cos(a)), y: r2(r * Math.sin(a)), a });
      });
      start += span;
    }
    return { pos, byId };
  }, [data]);

  const maxCount = Math.max(1, ...data.nodes.map((n) => n.count ?? 0));
  const maxUsd = Math.max(1, ...data.nodes.map((n) => n.usd ?? 0));
  const neighbours = React.useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of data.edges) {
      m.set(e.source, (m.get(e.source) ?? new Set()).add(e.target));
      m.set(e.target, (m.get(e.target) ?? new Set()).add(e.source));
    }
    return m;
  }, [data]);
  const lit = (id: string) => !focus || id === focus || neighbours.get(focus)?.has(id);
  const shown = (n: TopicGraphNode) => !filter || n.kind === filter || n.kind === "event" || n.kind === "category";
  const semantic = data.edges.filter((e) => !["includes", "has", "lost"].includes(e.label));
  const f = focus ? layout.byId.get(focus) : null;
  const links = focus ? data.edges.filter((e) => e.source === focus || e.target === focus) : [];
  const name = (id: string) => layout.byId.get(id)?.label ?? id;

  return (
    <div ref={setEl} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#05060a] text-white" data-testid="topic-graph">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">{title} · {data.nodes.length} nodes · {data.edges.length} links</p>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Show in the graph">
          {FILTERS.map((x) => (
            <button key={x.id || "all"} type="button" onClick={() => setFilter(x.id)} aria-pressed={filter === x.id}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] ${filter === x.id ? "bg-white text-black" : "bg-white/10 text-white/80 hover:bg-white/20"}`}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative" style={{ background: "radial-gradient(600px 400px at 50% 50%, rgba(239,68,68,0.16), transparent 70%), radial-gradient(500px 300px at 85% 10%, rgba(37,99,235,0.14), transparent)" }}>
        <svg viewBox="-470 -440 940 880" className="block h-auto w-full" role="img" aria-label={`${title}: ${data.nodes.length} nodes and ${data.edges.length} links`} onClick={() => setFocus(null)}>
          <defs>
            <filter id="tg-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {[150, 300, 352].map((r) => <circle key={r} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 6" />)}
          {data.edges.filter((e) => e.label === "includes" || e.label === "has" || e.label === "lost").map((e, i) => {
            const a = layout.pos.get(e.source), b = layout.pos.get(e.target);
            const tn = layout.byId.get(e.target);
            if (!a || !b || (tn && !shown(tn))) return null;
            return <line key={`s${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.12)" strokeWidth={1} opacity={lit(e.source) && lit(e.target) ? 1 : 0.25} />;
          })}
          {semantic.map((e, i) => {
            const a = layout.pos.get(e.source), b = layout.pos.get(e.target);
            const sn = layout.byId.get(e.source), tn = layout.byId.get(e.target);
            if (!a || !b || !sn || !tn || !shown(sn) || !shown(tn)) return null;
            const on = focus ? e.source === focus || e.target === focus : false;
            const mx = (a.x + b.x) * 0.25, my = (a.y + b.y) * 0.25; // bow towards the centre
            return (
              <path key={`e${i}`} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`} fill="none" stroke={EDGE[e.label] ?? "#a3a3a3"}
                strokeWidth={on ? 2.2 : Math.min(3, 0.6 + Math.log2(1 + e.weight) * 0.5)} opacity={focus ? (on ? 0.95 : 0.04) : 0.28} />
            );
          })}
          {data.nodes.filter(shown).map((n) => {
            const p = layout.pos.get(n.id);
            if (!p) return null;
            const r = radius(n, maxCount, maxUsd);
            const c = color(n);
            const out = n.kind !== "event" && n.kind !== "category";
            const anchor = Math.cos(p.a) > 0.25 ? "start" : Math.cos(p.a) < -0.25 ? "end" : "middle";
            const lx = r2(out ? p.x + Math.cos(p.a) * (r + 6) : p.x);
            const ly = r2(out ? p.y + Math.sin(p.a) * (r + 6) + 4 : p.y + r + 16);
            return (
              <g key={n.id} opacity={lit(n.id) ? 1 : 0.18} style={{ cursor: "pointer" }}
                onMouseEnter={() => setFocus(n.id)} onClick={(ev) => { ev.stopPropagation(); setFocus(focus === n.id ? null : n.id); }}>
                <title>{`${KIND_LABEL[n.kind] ?? n.kind}: ${n.label}`}</title>
                <circle cx={p.x} cy={p.y} r={r} fill={n.kind === "category" ? "#05060a" : c} stroke={c} strokeWidth={n.kind === "category" ? 2 : 0} filter={n.kind === "event" || focus === n.id ? "url(#tg-glow)" : undefined} />
                {(n.kind === "event" || n.kind === "category" || wide || focus === n.id) && (
                  <text x={lx} y={ly} textAnchor={out ? anchor : "middle"} fontSize={n.kind === "event" ? 15 : n.kind === "category" ? 12 : 11}
                    fontWeight={n.kind === "event" || n.kind === "category" ? 700 : 400} fill={n.kind === "category" ? "#fff" : "rgba(255,255,255,0.86)"}
                    style={{ paintOrder: "stroke", stroke: "#05060a", strokeWidth: 3 }}>
                    {short(n.label, n.kind === "event" ? 34 : 26)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {f && (
          <div className="absolute bottom-3 left-3 right-3 max-h-[45%] overflow-y-auto rounded-xl border border-white/15 bg-black/80 p-3 backdrop-blur sm:left-auto sm:w-80" aria-live="polite">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">{KIND_LABEL[f.kind] ?? f.kind}</p>
            <p className="font-display text-base font-bold leading-snug">{f.label}</p>
            {f.value && <p className="mt-1 text-sm text-white/85">{f.value}</p>}
            {f.role && <p className="mt-1 text-sm text-white/85">{f.role}</p>}
            {f.verdict && <p className="mt-1 font-mono text-[11px]" style={{ color: VERDICT[f.verdict] }}>Verdict: {f.verdict} · in {f.count} items</p>}
            {f.kind === "platform" && <p className="mt-1 font-mono text-[11px] text-white/70">{f.count} sources</p>}
            {f.usd != null && <p className="mt-1 font-mono text-[11px] text-white/70">${(f.usd / 1e6).toLocaleString("en-US", { maximumFractionDigits: 0 })}M</p>}
            <ul className="mt-2 space-y-0.5 font-mono text-[10px] text-white/70">
              {links.slice(0, 12).map((e, i) => (
                <li key={i}>{e.source === focus ? `${e.label} → ${short(name(e.target), 44)}` : `${short(name(e.source), 44)} ${e.label} this`}{e.weight > 1 && e.label === "carries" ? ` (${e.weight})` : ""}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <details className="border-t border-white/10 px-4 py-2">
        <summary className="cursor-pointer font-mono text-[10px] text-white/60 hover:text-white">Read the graph as text ({semantic.length} relationships)</summary>
        <ul className="mt-2 grid gap-0.5 font-mono text-[10px] text-white/75 sm:grid-cols-2">
          {semantic.map((e, i) => (
            <li key={i}>{name(e.source)} <span className="text-white/45">{e.label}</span> {name(e.target)}{e.weight > 1 ? ` (${e.weight})` : ""}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
