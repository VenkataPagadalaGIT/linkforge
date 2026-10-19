"use client";
import * as React from "react";
import { LINKEDIN_GRAPH } from "@/data/linkedinGraphData";
import { LI_VIEWS, type LiView } from "@/data/linkedinArchiveTypes";
import {
  fullUrl,
  nodeImageUrl,
  thumbUrl,
  topicLabel,
  topicSlug,
  formatDay,
  formatDuration,
  type LiGraphNode,
  type LiItem,
} from "@/data/linkedinArchive";

/**
 * The LinkedIn knowledge graph, in three views computed at build time:
 *   01 Topics    each topic a flower, its items on a golden-angle spiral; recurring names orbit the garden
 *   02 Timeline  a growing garden: year bands, one lane per topic, a stem per item; "Grow" replays it
 *   03 Map       a semantic map (PCA of item features): typical items at the centre, outliers at the edge
 * Switching views morphs every node to its new place (CSS transitions, no per-frame JS).
 *
 * No-JS: the server HTML is the Topics view, fully drawn; topic nodes are real links and the cards
 * below carry every item's link. Item nodes are pointer shortcuts (tabIndex -1, aria-hidden).
 * Labels are SVG text, so they are in the DOM for readers, crawlers and audits.
 */

interface Props {
  itemsByIdx: Map<string, LiItem>;
  /** Item ids (idx) that match the current search and filters; null = no filter. */
  matching: Set<string> | null;
  activeTopic: string | null;
  onTopic: (topicId: string | null) => void;
  onItem: (idx: string) => void;
}

const VIEW_META: Record<LiView, { n: string; label: string; hint: string }> = {
  topics: { n: "01", label: "Topics", hint: "each topic a flower: its items spiral out from the hub" },
  timeline: { n: "02", label: "Timeline", hint: "a growing garden: one stem per item, by date and topic" },
  map: { n: "03", label: "Map", hint: "similar items sit together: typical at the centre, outliers at the edge" },
};
const MORPH_MS = 950;
/** Map view: topics with at least this many items keep their label visible (mirrors the generator). */
const MAP_LABEL_MIN = 20;
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const CARD = 8;
/** Outline in the page background colour so labels stay readable over nodes and edges, in both themes. */
const HALO: React.CSSProperties = { paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 3.5, strokeLinejoin: "round" };
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
/** Node morphs live in CSS so reduced motion can switch them off (and the HTML stays small). */
const MOTION_CSS = `.li-m{transition:transform ${MORPH_MS}ms cubic-bezier(.22,.8,.2,1),opacity 400ms}@media (prefers-reduced-motion: reduce){.li-m{transition:none}}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function LinkedInGraph({ itemsByIdx, matching, activeTopic, onTopic, onItem }: Props) {
  const graph = LINKEDIN_GRAPH;
  const { width: W, height: H } = graph;
  const [view, setView] = React.useState<LiView>("topics");
  const [settled, setSettled] = React.useState(true);
  const [zoom, setZoom] = React.useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = React.useState<string | null>(null);
  const [tip, setTip] = React.useState<{ idx: string; left: number; top: number } | null>(null);
  const [showThumbs, setShowThumbs] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  /** Timeline "grow" cursor, 0..1 across the time axis; null = everything shown. */
  const [grow, setGrow] = React.useState<number | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const drag = React.useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const settleTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(settleTimer.current), []);
  const onItemRef = React.useRef(onItem);
  onItemRef.current = onItem;

  const nodeById = React.useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const neighbours = React.useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [a, b] of graph.links) {
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    }
    return m;
  }, [graph]);
  // Flower radius per topic (items whose first real topic it is), for label placement.
  const flowerR = React.useMemo(() => {
    const n = new Map<string, number>();
    for (const it of itemsByIdx.values()) {
      const p = it.topics.find((t) => t !== "other") ?? "other";
      n.set(p, (n.get(p) ?? 0) + 1);
    }
    return (t: string) => 6.4 * Math.sqrt((n.get(t) ?? 0) + 2.5) + 4;
  }, [itemsByIdx]);

  React.useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener?.("change", sync);
    return () => q.removeEventListener?.("change", sync);
  }, []);

  // Thumbnails load once the graph is on screen.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || showThumbs) return;
    if (!("IntersectionObserver" in window)) return setShowThumbs(true);
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setShowThumbs(true);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [showThumbs]);

  const switchView = (v: LiView) => {
    if (v === view) return;
    setHover(null);
    setTip(null);
    setPlaying(false);
    setGrow(null);
    setSettled(false);
    setView(v);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettled(true), reduced ? 0 : MORPH_MS);
  };

  const tl = graph.timeline;
  const axisX0 = tl.years[0]?.x0 ?? tl.left;
  const axisX1 = tl.years[tl.years.length - 1]?.x1 ?? W - 30;
  // Grow: replay the timeline from the first post to today.
  React.useEffect(() => {
    if (!playing) return;
    if (reduced) {
      // Reduced motion: step one year at a time instead of a continuous sweep.
      const span = axisX1 - axisX0 || 1;
      const ends = graph.timeline.years.map((y) => (y.x1 - axisX0) / span);
      let k = ends.findIndex((e) => e > (grow ?? 0) + 1e-6);
      if (k < 0) k = 0;
      const id = window.setInterval(() => {
        if (k >= ends.length) {
          window.clearInterval(id);
          setPlaying(false);
          setGrow(null);
          return;
        }
        setGrow(ends[k++]);
      }, 700);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    const start = performance.now() - (grow ?? 0) * 9000;
    const tick = (t: number) => {
      const g = Math.min(1, (t - start) / 9000);
      setGrow(g);
      if (g < 1) raf = requestAnimationFrame(tick);
      else {
        setPlaying(false);
        setGrow(null); // fully grown: back to "All"
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reduced]);
  const growX = grow == null ? null : axisX0 + (axisX1 - axisX0) * grow;
  const growLabel = (() => {
    if (growX == null) return "";
    const b = tl.years.find((y) => growX >= y.x0 && growX <= y.x1) ?? tl.years[tl.years.length - 1];
    const f = Math.min(0.999, Math.max(0, (growX - b.x0 - 6) / (b.x1 - b.x0 - 12 || 1)));
    return `${MONTHS[Math.floor(f * 12)]} ${b.year}`;
  })();

  const items = React.useMemo(() => graph.nodes.filter((n) => n.type === "item"), [graph]);
  const entityNodes = React.useMemo(() => graph.nodes.filter((n) => n.type === "entity"), [graph]);
  const topicNodes = React.useMemo(() => graph.nodes.filter((n) => n.type === "topic"), [graph]);
  const timelineXs = React.useMemo(() => items.map((n) => n.pos.timeline?.[0] ?? 0).sort((a, b) => a - b), [items]);
  const growCut = React.useMemo(() => {
    if (growX == null) return null;
    let c = 0;
    while (c < timelineXs.length && timelineXs[c] <= growX) c++;
    return c ? timelineXs[c - 1] : -Infinity;
  }, [growX, timelineXs]);

  // What is lit: the hovered node and its neighbours, else the active topic's.
  const focusId = hover ?? (activeTopic ? `t:${activeTopic}` : null);
  const lit = React.useMemo(() => (focusId ? new Set<string>([focusId, ...(neighbours.get(focusId) ?? [])]) : null), [focusId, neighbours]);
  const visible = (n: LiGraphNode) => !!n.pos[view];
  const isLit = (n: LiGraphNode) => {
    if (n.type === "item") {
      if (matching && !matching.has(n.idx!)) return false;
      if (view === "timeline" && growCut != null && (n.pos.timeline?.[0] ?? 0) > growCut) return false;
    }
    return lit ? lit.has(n.id) : true;
  };
  const P = (n: LiGraphNode): [number, number] => n.pos[view] ?? n.pos.topics ?? [W / 2, H / 2];

  // Pan and zoom (progressive enhancement).
  const clampView = React.useCallback(
    (k: number, x: number, y: number) => {
      const kk = Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));
      return { k: kk, x: Math.min(0, Math.max(W - W * kk, x)), y: Math.min(0, Math.max(H - H * kk, y)) };
    },
    [W, H],
  );
  const zoomAt = React.useCallback(
    (f: number, cx = W / 2, cy = H / 2) =>
      setZoom((v) => {
        const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.k * f));
        const r = k / v.k;
        return clampView(k, cx - (cx - v.x) * r, cy - (cy - v.y) * r);
      }),
    [W, H, clampView],
  );
  React.useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setTip(null);
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, W, H]);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || zoom.k <= 1) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: zoom.x, vy: zoom.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
    if (!d.moved) return;
    const r = svgRef.current!.getBoundingClientRect();
    setZoom((v) => clampView(v.k, d.vx + ((e.clientX - d.x) / r.width) * W, d.vy + ((e.clientY - d.y) / r.height) * H));
  };
  const endDrag = () => {
    setTimeout(() => (drag.current = null), 0);
  };
  const wasDrag = () => !!drag.current?.moved;
  const showTip = React.useCallback((idx: string, target: Element) => {
    const wrap = wrapRef.current?.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (wrap) setTip({ idx, left: t.left - wrap.left + t.width / 2, top: t.top - wrap.top });
  }, []);
  const itemEnter = React.useCallback((idx: string, el: Element) => {
    setHover(`i:${idx}`);
    showTip(idx, el);
  }, [showTip]);
  const itemLeave = React.useCallback((idx: string) => {
    setHover((h) => (h === `i:${idx}` ? null : h));
    setTip(null);
  }, []);
  const itemOpen = React.useCallback((e: React.MouseEvent, idx: string) => {
    if (drag.current?.moved) return e.preventDefault();
    if (!isPlainClick(e)) return;
    e.preventDefault();
    onItemRef.current(idx);
  }, []);

  const move = (x: number, y: number, extra = ""): React.CSSProperties => ({ transform: `translate(${x}px, ${y}px)${extra}` });

  const stems = React.useMemo(
    () =>
      view === "timeline" && settled
        ? items.map((n) => {
            const p = n.pos.timeline;
            if (!p || (matching && !matching.has(n.idx!)) || (growCut != null && p[0] > growCut) || (lit && !lit.has(n.id))) return null;
            return <line key={`s${n.id}`} x1={p[0]} x2={p[0]} y1={tl.axisY} y2={p[1] + CARD / 2} className="stroke-muted-foreground" strokeOpacity={0.08} strokeWidth={0.6} />;
          })
        : null,
    [view, settled, items, matching, growCut, lit, tl.axisY],
  );
  const restLines = settled ? graph.lines[view] : [];
  const litLines = lit && settled ? graph.links.filter(([a, b]) => lit.has(a) && lit.has(b)) : [];
  const hoveredItem = hover?.startsWith("i:") ? nodeById.get(hover) : undefined;
  const meta = VIEW_META[view];

  return (
    <>
    <div ref={wrapRef} className="relative" data-testid="linkedin-graph" data-view={view}>
      <style>{MOTION_CSS}</style>
      {/* Controls: views, grow, zoom (JS only) */}
      <div className="li-js mb-2 flex flex-wrap justify-end gap-1 sm:mb-0 sm:absolute sm:top-2 sm:right-2 sm:z-10">
        {LI_VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => switchView(v)}
            aria-pressed={view === v}
            className={`font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 border ${
              view === v ? "border-foreground text-foreground bg-foreground/[0.08]" : "border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
            data-testid={`linkedin-view-${v}`}
          >
            {VIEW_META[v].n} {VIEW_META[v].label}
          </button>
        ))}
        <span className="w-2" />
        {[
          { label: "+", title: "Zoom in", fn: () => zoomAt(1.4) },
          { label: "−", title: "Zoom out", fn: () => zoomAt(1 / 1.4) },
          { label: "Reset", title: "Reset view", fn: () => setZoom({ k: 1, x: 0, y: 0 }) },
        ].map((b) => (
          <button key={b.title} type="button" onClick={b.fn} title={b.title} aria-label={b.title} className="font-mono text-[11px] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40">
            {b.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto border border-border bg-card/30">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full min-w-[720px] h-auto select-none"
          role="group"
          aria-label={`Knowledge graph of the LinkedIn archive, ${meta.label} view: ${meta.hint}. Each topic opens its page; the cards below list every item.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          style={{ cursor: zoom.k > 1 ? "grab" : "default", touchAction: zoom.k > 1 ? "none" : "pan-x pan-y" }}
        >
          <g transform={`translate(${zoom.x} ${zoom.y}) scale(${zoom.k})`}>
            {/* View furniture */}
            {view === "timeline" && settled && (
              <g className="font-mono" aria-hidden="true">
                {tl.years.map((y, k) => (
                  <g key={y.year}>
                    {k > 0 && <line x1={y.x0} x2={y.x0} y1={24} y2={tl.axisY} className="stroke-border" strokeDasharray="2 4" />}
                    <text x={(y.x0 + y.x1) / 2} y={tl.axisY + 22} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
                      {y.year}
                    </text>
                  </g>
                ))}
                <line x1={axisX0} x2={axisX1} y1={tl.axisY} y2={tl.axisY} className="stroke-foreground" strokeOpacity={0.5} />
                {stems}
                {growX != null && (
                  <g>
                    <line x1={growX} x2={growX} y1={18} y2={tl.axisY + 6} className="stroke-foreground" strokeWidth={1} />
                    <text x={growX + 6} y={30} className="fill-foreground" fontSize={11} style={HALO}>
                      {growLabel.toUpperCase()}
                    </text>
                  </g>
                )}
              </g>
            )}
            {view === "map" && settled && (
              <g className="font-mono" aria-hidden="true">
                <line x1={graph.map.cx} x2={graph.map.cx} y1={20} y2={H - 20} className="stroke-border" strokeDasharray="1 5" />
                <line x1={20} x2={W - 20} y1={graph.map.cy} y2={graph.map.cy} className="stroke-border" strokeDasharray="1 5" />
                <text x={W - 24} y={graph.map.cy - 6} textAnchor="end" className="fill-muted-foreground" fontSize={10}>PC1 →</text>
                <text x={graph.map.cx + 6} y={30} className="fill-muted-foreground" fontSize={10}>PC2 ↑</text>
                {graph.map.rings.map((r) => (
                  <g key={r.label}>
                    <circle cx={graph.map.cx} cy={graph.map.cy} r={r.r} fill="none" className="stroke-muted-foreground" strokeOpacity={0.6} strokeDasharray="3 5" />
                    <text x={graph.map.cx + r.r * 0.71 + 4} y={graph.map.cy - r.r * 0.71 - 4} className="fill-muted-foreground" fontSize={10} style={HALO}>
                      {r.label.toUpperCase()}
                    </text>
                  </g>
                ))}
                <circle cx={graph.map.cx} cy={graph.map.cy} r={3} className="fill-foreground" />
                <text x={graph.map.cx + 7} y={graph.map.cy + 14} className="fill-foreground" fontSize={10} style={HALO}>CENTROID</text>
              </g>
            )}

            {/* Hairlines at rest, then the lit neighbourhood */}
            <g className="stroke-muted-foreground" aria-hidden="true">
              {restLines.map(([a, b]) => {
                const p = nodeById.get(a), q = nodeById.get(b);
                if (!p || !q || !visible(p) || !visible(q) || !isLit(p)) return null;
                const [x1, y1] = P(p), [x2, y2] = P(q);
                return <line key={`r${a}|${b}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={lit ? 0.06 : view === "map" ? 0.32 : 0.16} strokeWidth={view === "map" ? 0.7 : 0.5} />;
              })}
              {litLines.map(([a, b]) => {
                const p = nodeById.get(a), q = nodeById.get(b);
                if (!p || !q || !visible(p) || !visible(q)) return null;
                const [x1, y1] = P(p), [x2, y2] = P(q);
                // A gentle arc reads as a link rather than a grid line.
                const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12, my = (y1 + y2) / 2 - (x2 - x1) * 0.12;
                return <path key={`l${a}|${b}`} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" className="stroke-foreground" strokeOpacity={0.55} strokeWidth={0.7} />;
              })}
            </g>

            {/* Items: square image cards (pointer shortcuts; the cards below are the keyboard path) */}
            <g aria-hidden="true">
              {items.map((n) => {
                const it = itemsByIdx.get(n.idx!);
                if (!it) return null;
                const [x, y] = P(n);
                const hidden = view === "timeline" && growCut != null && (n.pos.timeline?.[0] ?? 0) > growCut;
                return (
                  <ItemNode key={n.id} it={it} x={x} y={y} on={isLit(n)} hidden={hidden} thumbs={showThumbs} onEnter={itemEnter} onLeave={itemLeave} onOpen={itemOpen} />
                );
              })}
            </g>

            {/* Recurring names */}
            <g>
              {entityNodes.map((n) => {
                  const shown = visible(n);
                  const [x, y] = P(n);
                  const on = shown && isLit(n);
                  const labelled = view === "topics" || (lit && lit.has(n.id)) || zoom.k >= 1.8 || (view !== "map" && (n.count ?? 0) >= 6);
                  const leftSide = view === "topics" && x < W / 2;
                  return (
                    <g
                      key={n.id}
                      className="li-m"
                      style={{ ...move(x, y), opacity: shown ? (on ? 1 : 0.15) : 0, pointerEvents: shown ? "auto" : "none" }}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                    >
                      <title>{`${n.label}: ${n.count} items`}</title>
                      <rect x={-3.5} y={-3.5} width={7} height={7} transform="rotate(45)" className="fill-sky-600 dark:fill-sky-300" />
                      <text
                        x={leftSide ? -8 : 8}
                        y={4}
                        textAnchor={leftSide ? "end" : "start"}
                        className="fill-muted-foreground font-mono"
                        fontSize={11}
                        style={{ ...HALO, opacity: labelled ? 1 : 0, transition: "opacity 200ms", pointerEvents: labelled ? "auto" : "none" }}
                      >
                        {n.label}
                      </text>
                    </g>
                  );
                })}
            </g>

            {/* Topics: real links to the topic pages */}
            <g>
              {topicNodes.map((n) => {
                  const id = n.label;
                  const shown = visible(n);
                  const [x, y] = P(n);
                  const active = activeTopic === id;
                  const on = shown && (isLit(n) || active);
                  const r = view === "map" ? 4 + Math.sqrt(n.count ?? 1) * 0.6 : 8 + Math.sqrt(n.count ?? 1);
                  const inTimeline = view === "timeline";
                  const labelY = view === "topics" ? (n.labelAbove ? -flowerR(id) - 7 : flowerR(id) + 14) : r + 13;
                  const content = inTimeline ? (
                    <>
                      <line x1={6} x2={W} y1={0} y2={0} className="stroke-border" strokeOpacity={0.35} pointerEvents="none" />
                      <text x={0} y={4} textAnchor="end" className={`font-mono ${active ? "fill-foreground" : "fill-muted-foreground"}`} fontSize={11} fontWeight={active ? 700 : 500} style={HALO}>
                        {topicLabel(id)} · {n.own ?? n.count}
                      </text>
                    </>
                  ) : (
                    <>
                      <circle r={r} className={active ? "fill-foreground" : "fill-background"} />
                      <circle r={r} fill="none" className="stroke-foreground" strokeWidth={active ? 2 : 1.2} />
                      {view !== "map" && (
                        <text y={4} textAnchor="middle" className={`font-mono ${active ? "fill-background" : "fill-foreground"}`} fontSize={11} fontWeight={700}>
                          {n.own ?? n.count}
                        </text>
                      )}
                      {view === "map" && n.mapLabel ? (
                        <>
                          {Math.hypot(n.mapLabel[0], n.mapLabel[1]) > r + 14 && ((n.count ?? 0) >= MAP_LABEL_MIN || active || (lit && lit.has(n.id))) && (
                            <line x1={0} y1={0} x2={n.mapLabel[0]} y2={n.mapLabel[1] + 3} className="stroke-muted-foreground" strokeOpacity={0.5} strokeWidth={0.6} />
                          )}
                          <text
                            x={n.mapLabel[0]}
                            y={n.mapLabel[1]}
                            textAnchor="middle"
                            className="fill-foreground font-mono"
                            fontSize={11}
                            fontWeight={600}
                            style={(() => {
                              const shownLabel = (n.count ?? 0) >= MAP_LABEL_MIN || active || !!(lit && lit.has(n.id)) || zoom.k >= 1.8;
                              return { ...HALO, opacity: shownLabel ? 1 : 0, transition: "opacity 200ms", pointerEvents: shownLabel ? "auto" : "none" };
                            })()}
                          >
                            {topicLabel(id)}
                          </text>
                        </>
                      ) : (
                        <text y={labelY} textAnchor="middle" className="fill-foreground font-mono" fontSize={12.5} fontWeight={600} style={HALO}>
                          {topicLabel(id)}
                        </text>
                      )}
                    </>
                  );
                  const style: React.CSSProperties = { ...move(x, y), opacity: shown ? (on ? 1 : 0.2) : 0, pointerEvents: shown ? "auto" : "none" };
                  return id === "other" ? (
                    <g key={n.id} className="li-m" style={style}>
                      {content}
                    </g>
                  ) : (
                    <a
                      key={n.id}
                      href={`/linkedin/topics/${topicSlug(id)}`}
                      aria-label={`${topicLabel(id)}: ${n.count} items tagged`}
                      className="li-m"
                      onClick={(e) => {
                        if (wasDrag()) return e.preventDefault();
                        if (!isPlainClick(e)) return;
                        e.preventDefault();
                        onTopic(active ? null : id);
                      }}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                      onFocus={() => setHover(n.id)}
                      onBlur={() => setHover(null)}
                      style={{ ...style, cursor: "pointer" }}
                    >
                      {content}
                    </a>
                  );
                })}
            </g>

            {/* Lens: the hovered card, enlarged on top */}
            {hoveredItem && showThumbs && (() => {
              const it = itemsByIdx.get(hoveredItem.idx!);
              if (!it) return null;
              const [x, y] = P(hoveredItem);
              const L = Math.max(12, 34 / zoom.k);
              return (
                <g style={{ pointerEvents: "none" }} aria-hidden="true">
                  <rect x={x - L / 2 - 1} y={y - L / 2 - 1} width={L + 2} height={L + 2} className="fill-background stroke-foreground" strokeWidth={0.8} />
                  <image href={nodeImageUrl(it.idx)} x={x - L / 2} y={y - L / 2} width={L} height={L} preserveAspectRatio="xMidYMid slice" />
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      {/* HUD: view readout (JS only, hidden without scripts) */}
      <div className="li-js hidden sm:block pointer-events-none absolute top-2 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 leading-relaxed">
        <p>
          <span className="text-foreground">View {meta.n} · {meta.label}</span> · {items.length} items
        </p>
        <p className="normal-case tracking-normal">{meta.hint}</p>
      </div>
      <div className="li-js hidden sm:block pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        Zoom {zoom.k.toFixed(1)}×{hover ? ` · ${hover.startsWith("t:") ? topicLabel(hover.slice(2)) : hover.startsWith("e:") ? nodeById.get(hover)?.label : formatDay(itemsByIdx.get(hover.slice(2))?.date ?? "2020-01-01")}` : ""}
      </div>

      {tip && itemsByIdx.get(tip.idx) && <HoverCard item={itemsByIdx.get(tip.idx)!} left={tip.left} top={tip.top} />}
    </div>
      {view === "timeline" && (
        <div className="li-js mt-2 flex items-center gap-3 border border-border bg-background/90 px-3 py-1.5">
          <button
            type="button"
            onClick={() => {
              if (playing) return setPlaying(false);
              if (grow == null || grow >= 1) setGrow(0);
              setPlaying(true);
            }}
            aria-pressed={playing}
            className="shrink-0 min-w-[88px] text-left font-mono text-[10px] uppercase tracking-[0.2em] text-foreground"
            data-testid="linkedin-grow"
          >
            <span aria-hidden="true">{playing ? "❚❚ " : "▶ "}</span>
            {playing ? "Pause" : "Grow"}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round((grow ?? 1) * 1000)}
            onChange={(e) => {
              setPlaying(false);
              setGrow(Number(e.target.value) / 1000);
            }}
            aria-label="Show items up to this date"
            aria-valuetext={grow == null ? "All dates" : growLabel}
            className="flex-1 accent-current"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 w-16" aria-live={playing ? "off" : "polite"}>
            {grow == null ? "All" : growLabel}
          </span>
        </div>
      )}

    </>
  );
}

interface ItemNodeProps {
  it: LiItem;
  x: number;
  y: number;
  on: boolean;
  hidden: boolean;
  thumbs: boolean;
  onEnter: (idx: string, el: Element) => void;
  onLeave: (idx: string) => void;
  onOpen: (e: React.MouseEvent, idx: string) => void;
}

/** One item card; memoized so hovers and Grow frames only re-render the cards whose state changed. */
const ItemNode = React.memo(function ItemNode({ it, x, y, on, hidden, thumbs, onEnter, onLeave, onOpen }: ItemNodeProps) {
  const ring = it.kind === "video" ? "stroke-rose-600 dark:stroke-rose-300" : it.kind === "document" ? "stroke-amber-600 dark:stroke-amber-300" : "stroke-muted-foreground";
  const dot = it.kind === "video" ? "fill-rose-600 dark:fill-rose-300" : it.kind === "document" ? "fill-amber-600 dark:fill-amber-300" : "fill-muted-foreground";
  return (
    <g className="li-m" style={{ transform: `translate(${x}px, ${y}px)${hidden ? " scale(0)" : ""}`, opacity: on ? 1 : hidden ? 0 : 0.12, pointerEvents: hidden ? "none" : "auto" }}>
      <a
        href={fullUrl(it)}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        onClick={(e) => onOpen(e, it.idx)}
        onMouseEnter={(e) => onEnter(it.idx, e.currentTarget)}
        onMouseLeave={() => onLeave(it.idx)}
      >
        <rect x={-CARD / 2} y={-CARD / 2} width={CARD} height={CARD} className={thumbs ? "fill-card" : dot} fillOpacity={thumbs ? 1 : 0.6} />
        {thumbs && <image href={nodeImageUrl(it.idx)} x={-CARD / 2} y={-CARD / 2} width={CARD} height={CARD} preserveAspectRatio="xMidYMid slice" />}
        <rect x={-CARD / 2} y={-CARD / 2} width={CARD} height={CARD} fill="none" className={ring} strokeWidth={it.kind === "image" ? 0.4 : 1.2} />
        {it.kind === "video" && <path d="M -1.4 -2 L 2.2 0 L -1.4 2 Z" className="fill-white" opacity={0.9} />}
      </a>
    </g>
  );
});

function HoverCard({ item, left, top }: { item: LiItem; left: number; top: number }) {
  return (
    <div className="pointer-events-none absolute z-20 w-60 -translate-x-1/2 -translate-y-full border border-border bg-background shadow-lg" style={{ left, top: top - 26 }} role="tooltip">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(item)} alt="" className="block w-full h-32 object-cover" />
        {item.kind === "video" && <span className="absolute bottom-1 right-1 font-mono text-[10px] px-1.5 py-0.5 bg-black/80 text-white">▶ {formatDuration(item.duration)}</span>}
      </div>
      <div className="p-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
          {formatDay(item.date)} · {item.label}
        </p>
        <p className="font-mono text-[11px] leading-snug text-foreground">{item.description}</p>
      </div>
    </div>
  );
}
