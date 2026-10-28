"use client";
import * as React from "react";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useRouter } from "next/navigation";
import { nodes as ALL_NODES, getNode, LAYERS, NODE_TYPE_META, RELATION_META } from "@/data/aiOntology";
import { AI_DEAL_EDGES } from "@/data/aiIntel";
import { ALL_CATS, CAT_COLOR, CATS, DEAL_NODES, DEGREE, EDGES, LAYER_LIGHT, dealAmount, reach, shortestPath, type Analysis, type Cat, type Edge } from "./intelModel";
import { Dossier, SearchBox } from "./IntelDossier";

// The flat analysis view of the AI intelligence graph: a 2D network (or the
// supply chain in layer bands, or only the money) on a canvas, with the same
// dossier and graph questions as the 3D universe.

type Mode = "network" | "supply" | "money";
interface Pos { x: number; y: number }

// ---------------------------------------------------------------------------
// Layouts (built once per page load)
// ---------------------------------------------------------------------------

let NETWORK: Map<string, Pos> | null = null;
function networkLayout(): Map<string, Pos> {
  if (NETWORK) return NETWORK;
  const g = new Graph({ type: "undirected", multi: false, allowSelfLoops: false });
  // Deterministic start: one ring per layer, so the layout is the same on every load.
  for (const L of LAYERS) {
    const ns = ALL_NODES.filter((n) => n.layer === L.id);
    ns.forEach((n, i) => {
      const a = (i / Math.max(1, ns.length)) * Math.PI * 2 + L.id * 0.9;
      const r = 20 + L.id * 9;
      g.addNode(n.id, { x: Math.cos(a) * r, y: Math.sin(a) * r });
    });
  }
  for (const e of EDGES) {
    if (!g.hasNode(e.from) || !g.hasNode(e.to)) continue;
    const k = g.edge(e.from, e.to);
    if (k) g.setEdgeAttribute(k, "weight", (g.getEdgeAttribute(k, "weight") as number) + 1);
    else g.addEdge(e.from, e.to, { weight: 1 });
  }
  for (const d of AI_DEAL_EDGES) {
    const k = g.hasNode(d.from) && g.hasNode(d.to) ? g.edge(d.from, d.to) : undefined;
    if (k) g.setEdgeAttribute(k, "weight", (g.getEdgeAttribute(k, "weight") as number) + 2);
  }
  const settings = { ...forceAtlas2.inferSettings(g), linLogMode: true, gravity: 1.5, scalingRatio: 8, slowDown: 4, barnesHutOptimize: true };
  forceAtlas2.assign(g, { iterations: 600, settings, getEdgeWeight: "weight" });
  NETWORK = new Map();
  g.forEachNode((id, a) => NETWORK!.set(id, { x: a.x as number, y: a.y as number }));
  return NETWORK;
}

let LAYERED: Map<string, Pos> | null = null;
function layeredLayout(): Map<string, Pos> {
  if (LAYERED) return LAYERED;
  const net = networkLayout();
  LAYERED = new Map();
  let top = 0;
  const STEP = 3.2;
  for (const L of LAYERS) {
    const ns = ALL_NODES.filter((n) => n.layer === L.id).sort((a, b) => net.get(a.id)!.x - net.get(b.id)!.x);
    const rows = Math.max(1, Math.ceil(ns.length / 44));
    const perRow = Math.ceil(ns.length / rows);
    ns.forEach((n, i) => {
      const row = i % rows;
      const col = Math.floor(i / rows);
      LAYERED!.set(n.id, { x: (col - perRow / 2) * STEP + (row % 2) * (STEP / 2), y: top + row * STEP });
    });
    top += rows * STEP + 9;
  }
  return LAYERED;
}

/** Layer band tops for the supply-chain view, in world units. */
function layerBands(pos: Map<string, Pos>) {
  return LAYERS.map((L) => {
    const ys = ALL_NODES.filter((n) => n.layer === L.id).map((n) => pos.get(n.id)!.y);
    const xs = ALL_NODES.filter((n) => n.layer === L.id).map((n) => pos.get(n.id)!.x);
    return { L, top: Math.min(...ys), bottom: Math.max(...ys), left: Math.min(...xs) };
  });
}

// ---------------------------------------------------------------------------
// The graph
// ---------------------------------------------------------------------------

const FEATURED = ["anthropic", "openai", "nvidia", "tsmc", "asml", "sk-hynix", "gallium", "taiwan-strait"].filter((x) => getNode(x));

export default function IntelGraph({ selected: selectedProp, onSelect }: { selected?: string | null; onSelect?: (id: string | null) => void } = {}) {
  /** On the graph page the selection is shared with the 3D view and the dashboard (and kept in the URL there). */
  const controlled = onSelect !== undefined;
  const router = useRouter();
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [size, setSize] = React.useState({ w: 800, h: 600 });
  const [mode, setMode] = React.useState<Mode>("network");
  const [layers, setLayers] = React.useState<Set<number>>(() => new Set(LAYERS.map((l) => l.id)));
  const [cats, setCats] = React.useState<Set<Cat>>(() => new Set<Cat>(ALL_CATS));
  const [chokeOnly, setChokeOnly] = React.useState(false);
  const [selectedState, setSelectedState] = React.useState<string | null>(null);
  const selected = controlled ? selectedProp ?? null : selectedState;
  const setSelected = React.useCallback((id: string | null) => (controlled ? onSelect!(id) : setSelectedState(id)), [controlled, onSelect]);
  const [hover, setHover] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis>("none");
  const [hops, setHops] = React.useState(1);
  const [pathTo, setPathTo] = React.useState<string | null>(null);
  const [dark, setDark] = React.useState(true);
  const cam = React.useRef({ k: 1, x: 0, y: 0 });
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const anim = React.useRef<number | null>(null);

  const pos = React.useMemo(() => (mode === "supply" ? layeredLayout() : networkLayout()), [mode]);

  // Theme tracking (the site toggles a .dark class on <html>).
  React.useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // Deep links: ?focus=<id>&mode=<mode>
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const f = sp.get("focus");
    const m = sp.get("mode");
    if (m === "supply" || m === "money" || m === "network") setMode(m);
    if (!controlled && f && getNode(f)) setSelected(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!controlled) {
      if (selected) sp.set("focus", selected);
      else sp.delete("focus");
    }
    if (mode !== "network") sp.set("mode", mode);
    else sp.delete("mode");
    const qs = sp.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [selected, mode, controlled]);

  // Size the canvas to its box.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const visible = React.useMemo(() => {
    const s = new Set<string>();
    for (const n of ALL_NODES) {
      if (!layers.has(n.layer)) continue;
      if (chokeOnly && !n.chokepoint) continue;
      if (mode === "money" && !DEAL_NODES.has(n.id)) continue;
      s.add(n.id);
    }
    return s;
  }, [layers, chokeOnly, mode]);

  const visibleEdges = React.useMemo(
    () => (mode === "money" ? [] : EDGES.filter((e) => cats.has(e.cat) && visible.has(e.from) && visible.has(e.to))),
    [cats, visible, mode],
  );

  const reachResult = React.useMemo(
    () => (selected && (analysis === "exposed" || analysis === "depends") ? reach(selected, analysis, hops, cats) : null),
    [selected, analysis, hops, cats],
  );
  const pathResult = React.useMemo(
    () => (selected && analysis === "path" && pathTo ? shortestPath(selected, pathTo, cats) : undefined),
    [selected, analysis, pathTo, cats],
  );

  // Which nodes and edges are lit.
  const focus = React.useMemo(() => {
    if (reachResult) return { ids: reachResult.ids, edges: new Set(reachResult.edges) };
    if (pathResult) return { ids: new Set(pathResult.ids), edges: new Set(pathResult.edges) };
    const c = selected ?? hover;
    if (!c) return null;
    const ids = new Set([c]);
    const es = new Set<Edge>();
    for (const e of visibleEdges) {
      if (e.from === c || e.to === c) {
        ids.add(e.from === c ? e.to : e.from);
        es.add(e);
      }
    }
    if (mode === "money") for (const d of AI_DEAL_EDGES) if (d.from === c || d.to === c) ids.add(d.from === c ? d.to : d.from);
    return { ids, edges: es };
  }, [reachResult, pathResult, selected, hover, visibleEdges, mode]);

  // Fit the camera to a set of nodes.
  const fit = React.useCallback(
    (ids: Iterable<string>, animate = true) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, n = 0;
      for (const id of ids) {
        const p = pos.get(id);
        if (!p) continue;
        n++;
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      if (!n) return;
      const pad = 70;
      const w = Math.max(maxX - minX, 6), h = Math.max(maxY - minY, 6);
      const k = Math.min((size.w - pad * 2) / w, (size.h - pad * 2) / h, 60);
      const target = { k, x: size.w / 2 - ((minX + maxX) / 2) * k, y: size.h / 2 - ((minY + maxY) / 2) * k };
      if (!animate) {
        cam.current = target;
        force();
        return;
      }
      const start = { ...cam.current };
      const t0 = performance.now();
      if (anim.current) cancelAnimationFrame(anim.current);
      const step = (t: number) => {
        const u = Math.min(1, (t - t0) / 450);
        const e = 1 - Math.pow(1 - u, 3);
        cam.current = { k: start.k + (target.k - start.k) * e, x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e };
        force();
        if (u < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    },
    [pos, size.w, size.h],
  );

  // Refit when the view or the canvas size changes.
  React.useEffect(() => {
    fit(visible, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, size.w, size.h]);

  // Fly to the selection's neighbourhood.
  React.useEffect(() => {
    if (focus && (selected || analysis !== "none")) fit(focus.ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, analysis, hops, pathTo]);

  const radius = (id: string) => {
    const d = DEGREE.get(id) ?? 0;
    return Math.min(14, 2.6 + Math.sqrt(d) * 1.05) + (DEAL_NODES.has(id) ? 1.5 : 0);
  };

  // Draw.
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const fg = `hsl(${css.getPropertyValue("--foreground").trim() || "0 0% 96%"})`;
    const bg = `hsl(${css.getPropertyValue("--background").trim() || "0 0% 4%"})`;
    const muted = `hsl(${css.getPropertyValue("--muted-foreground").trim() || "0 0% 60%"})`;
    const ci = dark ? 0 : 1;
    const { k, x: tx, y: ty } = cam.current;
    const S = (p: Pos) => ({ x: p.x * k + tx, y: p.y * k + ty });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    // Supply-chain bands.
    if (mode === "supply") {
      for (const b of layerBands(pos)) {
        if (!layers.has(b.L.id)) continue;
        const t = S({ x: 0, y: b.top }).y - 14;
        const bot = S({ x: 0, y: b.bottom }).y + 14;
        ctx.fillStyle = dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)";
        ctx.fillRect(0, t, size.w, bot - t);
        ctx.fillStyle = dark ? b.L.color : LAYER_LIGHT[b.L.id];
        ctx.fillRect(0, t, 3, bot - t);
        ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = fg;
        ctx.textBaseline = "top";
        ctx.fillText(`L${b.L.id} · ${b.L.label}`, 10, t + 4);
      }
    }

    const lit = focus;
    // Base edges.
    ctx.lineCap = "round";
    for (const e of visibleEdges) {
      const a = pos.get(e.from), b = pos.get(e.to);
      if (!a || !b) continue;
      const on = lit?.edges.has(e);
      if (lit && !on) {
        ctx.globalAlpha = 0.035;
      } else {
        ctx.globalAlpha = on ? 0.9 : 0.14;
      }
      ctx.strokeStyle = CAT_COLOR[e.cat][ci];
      ctx.lineWidth = on ? 1.6 : 0.6;
      const p = S(a), q = S(b);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }

    // Deal edges: thickness by amount, drawn in every view.
    const maxAmt = Math.max(...AI_DEAL_EDGES.map((d) => d.amountHigh ?? d.amount ?? 0), 1);
    for (const d of AI_DEAL_EDGES) {
      if (!visible.has(d.from) || !visible.has(d.to)) continue;
      const a = pos.get(d.from), b = pos.get(d.to);
      if (!a || !b) continue;
      const on = !lit || (lit.ids.has(d.from) && lit.ids.has(d.to));
      const amt = d.amountHigh ?? d.amount ?? maxAmt * 0.05;
      const money = ["equity", "convertible_note", "guarantee", "warrant", "debt"].includes(d.instrument);
      ctx.globalAlpha = on ? (mode === "money" ? 0.85 : 0.6) : 0.05;
      ctx.strokeStyle = money ? CAT_COLOR.capital[ci] : CAT_COLOR.supply[ci];
      ctx.lineWidth = 1 + 7 * Math.sqrt(amt / maxAmt);
      const p = S(a), q = S(b);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      if (on && (mode === "money" || (lit && (selected === d.from || selected === d.to)))) {
        ctx.globalAlpha = 1;
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        const label = dealAmount(d);
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        const w = ctx.measureText(label).width + 8;
        ctx.fillStyle = bg;
        ctx.fillRect(mx - w / 2, my - 7, w, 14);
        ctx.fillStyle = fg;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(label, mx, my);
        ctx.textAlign = "left";
      }
    }

    // Relation labels on the lit edges when zoomed in.
    if (lit && lit.edges.size && lit.edges.size <= 60 && k > 4) {
      ctx.globalAlpha = 1;
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const e of lit.edges) {
        const a = pos.get(e.from), b = pos.get(e.to);
        if (!a || !b) continue;
        const p = S(a), q = S(b);
        ctx.fillStyle = CAT_COLOR[e.cat][ci];
        ctx.fillText(RELATION_META[e.relation].label, (p.x + q.x) / 2, (p.y + q.y) / 2 - 6);
      }
      ctx.textAlign = "left";
    }

    // Nodes.
    for (const id of visible) {
      const n = getNode(id)!;
      const p = S(pos.get(id)!);
      if (p.x < -20 || p.y < -20 || p.x > size.w + 20 || p.y > size.h + 20) continue;
      const on = !lit || lit.ids.has(id);
      const r = radius(id) * Math.min(1.6, Math.max(0.7, Math.sqrt(k / 8)));
      ctx.globalAlpha = on ? 1 : 0.12;
      ctx.fillStyle = dark ? LAYERS[n.layer].color : LAYER_LIGHT[n.layer];
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (n.chokepoint) {
        ctx.strokeStyle = CAT_COLOR.capital[ci];
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (id === selected || id === pathTo) {
        ctx.strokeStyle = fg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Labels: lit nodes, big nodes, and everything once zoomed in.
    ctx.globalAlpha = 1;
    ctx.textBaseline = "middle";
    const placed: { x: number; y: number; w: number }[] = [];
    const order = [...visible].sort((a, b) => (lit ? Number(lit.ids.has(b)) - Number(lit.ids.has(a)) : 0) || (DEGREE.get(b) ?? 0) - (DEGREE.get(a) ?? 0));
    for (const id of order) {
      const deg = DEGREE.get(id) ?? 0;
      const isLit = !!lit && lit.ids.has(id);
      if (lit && !isLit && k < 14) continue;
      if (!lit && deg < (k > 14 ? 0 : k > 7 ? 6 : 16) && !(mode === "money")) continue;
      const n = getNode(id)!;
      const p = S(pos.get(id)!);
      if (p.x < 0 || p.y < 0 || p.x > size.w || p.y > size.h) continue;
      const strong = id === selected || id === hover || id === pathTo;
      ctx.font = `${strong ? "bold 12px" : isLit || mode === "money" ? "11px" : "10px"} ui-monospace, SFMono-Regular, Menlo, monospace`;
      const label = n.name.length > 34 ? `${n.name.slice(0, 33)}…` : n.name;
      const w = ctx.measureText(label).width;
      const lx = p.x + radius(id) + 4;
      if (placed.some((b) => Math.abs(b.y - p.y) < 11 && lx < b.x + b.w + 6 && lx + w > b.x - 6)) continue;
      placed.push({ x: lx, y: p.y, w });
      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(lx - 2, p.y - 7, w + 4, 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = strong ? fg : isLit ? fg : muted;
      ctx.fillText(label, lx, p.y);
    }
    ctx.globalAlpha = 1;
  });

  // Wheel zoom needs a non-passive listener so the page does not scroll underneath.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const c = cam.current;
      const k = Math.max(0.5, Math.min(120, c.k * Math.exp(-e.deltaY * 0.0015)));
      cam.current = { k, x: sx - ((sx - c.x) * k) / c.k, y: sy - ((sy - c.y) * k) / c.k };
      force();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pointer: pan, zoom, hover, select.
  const drag = React.useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const hitTest = (sx: number, sy: number): string | null => {
    const { k, x: tx, y: ty } = cam.current;
    let best: string | null = null;
    let bd = Infinity;
    for (const id of visible) {
      const p = pos.get(id)!;
      const dx = p.x * k + tx - sx, dy = p.y * k + ty - sy;
      const d = dx * dx + dy * dy;
      const r = radius(id) * Math.min(1.6, Math.max(0.7, Math.sqrt(k / 8))) + 5;
      if (d < r * r && d < bd) {
        bd = d;
        best = id;
      }
    }
    return best;
  };

  const select = (id: string | null) => {
    setSelected(id);
    if (!id) setAnalysis("none");
    else if (analysis === "path") setAnalysis("none");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_340px] border border-border">
      {/* Left rail */}
      <aside className="border-b lg:border-b-0 lg:border-r border-border p-4 space-y-5 lg:max-h-[calc(100vh-11rem)] lg:overflow-auto">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Find</p>
          <SearchBox
            placeholder="Companies, chips, minerals…"
            onPick={(id) => select(id)}
            onPickScope={(sc) => {
              // A category: show only its layer, and fit the view to it.
              if (sc.layer == null) return;
              select(null);
              setLayers(new Set([sc.layer]));
            }}
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">View</p>
          <div className="grid grid-cols-3 gap-1" role="tablist">
            {([
              ["network", "Network"],
              ["supply", "Supply chain"],
              ["money", "Money"],
            ] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`border px-1 py-1.5 font-mono text-[10px] ${mode === m ? "border-foreground text-foreground bg-foreground/[0.06]" : "border-border text-muted-foreground hover:border-foreground/40"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed mt-2">
            {mode === "network"
              ? "Entities pulled together by their links. Clusters are communities: a supply chain, a capital group, a rivalry."
              : mode === "supply"
                ? "The value chain from labs at the top to minerals, energy and capital at the bottom."
                : `The ${AI_DEAL_EDGES.length} deals quoted from filings. Line width is the amount.`}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Layers</p>
          <ul className="space-y-1">
            {LAYERS.map((L) => {
              const on = layers.has(L.id);
              const count = ALL_NODES.filter((n) => n.layer === L.id).length;
              return (
                <li key={L.id}>
                  <button
                    onClick={() => setLayers((s) => { const t = new Set(s); if (t.has(L.id)) t.delete(L.id); else t.add(L.id); return t; })}
                    className={`w-full flex items-center gap-2 font-mono text-[11px] text-left ${on ? "text-foreground" : "text-muted-foreground/70 line-through"}`}
                    aria-pressed={on}
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: dark ? L.color : LAYER_LIGHT[L.id] }} />
                    <span className="flex-1 truncate">L{L.id} · {L.label}</span>
                    <span className="text-muted-foreground/70">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Link types</p>
          <ul className="space-y-1">
            {CATS.map((c) => {
              const on = cats.has(c.id);
              const count = EDGES.filter((e) => e.cat === c.id).length;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setCats((s) => { const t = new Set(s); if (t.has(c.id)) t.delete(c.id); else t.add(c.id); return t; })}
                    className={`w-full flex items-center gap-2 font-mono text-[11px] text-left ${on ? "text-foreground" : "text-muted-foreground/70 line-through"}`}
                    aria-pressed={on}
                    title={c.hint}
                  >
                    <span className="inline-block w-3 h-[2px]" style={{ background: CAT_COLOR[c.id][dark ? 0 : 1] }} />
                    <span className="flex-1">{c.label}</span>
                    <span className="text-muted-foreground/70">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <label className="flex items-center gap-2 font-mono text-[11px] text-foreground cursor-pointer">
          <input type="checkbox" checked={chokeOnly} onChange={(e) => setChokeOnly(e.target.checked)} />
          Chokepoints only
        </label>
        <div className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed border-t border-border pt-3">
          Scroll to zoom, drag to pan, click to open a dossier, double-click to open the entity page. Thick lines are deals quoted from filings; rings mark chokepoints.
        </div>
      </aside>

      {/* Canvas */}
      <div
        ref={wrapRef}
        className="relative h-[70vh] lg:h-[calc(100vh-11rem)] min-h-[520px] touch-none select-none bg-background"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (drag.current) {
            const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
            if (drag.current.moved) {
              cam.current = { ...cam.current, x: cam.current.x + dx, y: cam.current.y + dy };
              drag.current.x = e.clientX;
              drag.current.y = e.clientY;
              force();
            }
            return;
          }
          const h = hitTest(e.clientX - rect.left, e.clientY - rect.top);
          if (h !== hover) setHover(h);
        }}
        onPointerUp={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const wasDrag = drag.current?.moved;
          drag.current = null;
          if (wasDrag) return;
          const h = hitTest(e.clientX - rect.left, e.clientY - rect.top);
          select(h);
        }}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const h = hitTest(e.clientX - rect.left, e.clientY - rect.top);
          if (h) router.push(`/notebook/ai/map/${h}`);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <canvas ref={canvasRef} style={{ width: size.w, height: size.h, cursor: hover ? "pointer" : "grab" }} aria-label="AI Intelligence Graph" role="img" />
        <div className="absolute top-3 right-3 flex gap-1">
          <button onClick={() => fit(visible)} className="border border-border bg-background/80 px-2 py-1 font-mono text-[10px] text-foreground hover:border-foreground/40">
            Fit
          </button>
          {selected && (
            <button onClick={() => select(null)} className="border border-border bg-background/80 px-2 py-1 font-mono text-[10px] text-foreground hover:border-foreground/40">
              Clear
            </button>
          )}
        </div>
        {hover && hover !== selected && (
          <div className="pointer-events-none absolute left-3 bottom-3 border border-border bg-background/90 px-3 py-2 max-w-sm">
            <p className="font-display text-sm font-bold text-foreground">{getNode(hover)?.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              L{getNode(hover)?.layer} · {NODE_TYPE_META[getNode(hover)!.type].label} · {DEGREE.get(hover) ?? 0} links
            </p>
          </div>
        )}
      </div>

      {/* Dossier */}
      <aside className="border-t lg:border-t-0 lg:border-l border-border p-4 lg:max-h-[calc(100vh-11rem)] lg:overflow-auto">
        {selected ? (
          <Dossier
            id={selected}
            onSelect={(id) => select(id)}
            analysis={analysis}
            setAnalysis={setAnalysis}
            hops={hops}
            setHops={setHops}
            pathTo={pathTo}
            setPathTo={setPathTo}
            pathResult={pathResult}
            reachCount={reachResult ? reachResult.ids.size - 1 : 0}
          />
        ) : (
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">Dossier</p>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              Pick any entity to see its money, its links and who is exposed to it. Start with one of these:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FEATURED.map((f) => (
                <button key={f} onClick={() => select(f)} className="border border-border px-2 py-1 font-mono text-[11px] text-foreground hover:border-foreground/40">
                  {getNode(f)?.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
