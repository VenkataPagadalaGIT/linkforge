"use client";
import * as React from "react";
import { LINKEDIN_GRAPH } from "@/data/linkedinGraphData";
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
 * The LinkedIn knowledge graph: topics, the named things that recur, and every
 * item, laid out once at build time (ForceAtlas2) so the server HTML already
 * draws the whole picture. Topic nodes are real links (keyboard and no-JS);
 * item nodes are pointer shortcuts to the cards below, which carry the same
 * links for keyboards and screen readers. Labels are SVG text, in the DOM.
 * Thumbnails load only after the graph scrolls into view (JS); the server HTML
 * draws coloured dots so a visit without JS makes no image requests here.
 */

interface Props {
  itemsByIdx: Map<string, LiItem>;
  /** Item ids (idx) that match the current search and filters; null = no filter. */
  matching: Set<string> | null;
  activeTopic: string | null;
  onTopic: (topicId: string | null) => void;
  onItem: (idx: string) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** Outline in the page background colour so labels stay readable over nodes and edges, in both themes. */
const HALO: React.CSSProperties = {
  paintOrder: "stroke",
  stroke: "hsl(var(--background))",
  strokeWidth: 3.5,
  strokeLinejoin: "round",
};
/** A plain left click; modified clicks keep the browser's own behaviour (new tab, etc.). */
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export default function LinkedInGraph({ itemsByIdx, matching, activeTopic, onTopic, onItem }: Props) {
  const graph = LINKEDIN_GRAPH;
  const { width: W, height: H } = graph;
  const [view, setView] = React.useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = React.useState<string | null>(null);
  const [tip, setTip] = React.useState<{ idx: string; left: number; top: number } | null>(null);
  const [showThumbs, setShowThumbs] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const drag = React.useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  const nodeById = React.useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const neighbours = React.useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [a, b] of graph.edges) {
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    }
    return m;
  }, [graph]);

  // Load thumbnails once the graph is on screen.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || showThumbs) return;
    if (!("IntersectionObserver" in window)) {
      setShowThumbs(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setShowThumbs(true);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [showThumbs]);

  // What is lit: the hovered node and its neighbours, else the active topic's items.
  const focusId = hover ?? (activeTopic ? `t:${activeTopic}` : null);
  const lit = React.useMemo(
    () => (focusId ? new Set<string>([focusId, ...(neighbours.get(focusId) ?? [])]) : null),
    [focusId, neighbours],
  );
  const isLit = (n: LiGraphNode) => {
    if (n.type === "item" && matching && !matching.has(n.idx!)) return false;
    return lit ? lit.has(n.id) : true;
  };

  // Pan and zoom (progressive enhancement; the server picture is the unzoomed graph).
  const clampView = React.useCallback(
    (k: number, x: number, y: number) => {
      const kk = Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));
      return { k: kk, x: Math.min(0, Math.max(W - W * kk, x)), y: Math.min(0, Math.max(H - H * kk, y)) };
    },
    [W, H],
  );
  const zoomAt = React.useCallback(
    (factor: number, cx = W / 2, cy = H / 2) =>
      setView((v) => {
        const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.k * factor));
        const f = k / v.k;
        return clampView(k, cx - (cx - v.x) * f, cy - (cy - v.y) * f);
      }),
    [W, H, clampView],
  );

  React.useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return; // plain scrolling keeps scrolling the page
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, W, H]);

  // Dragging only pans when zoomed in; at 1x the page (and touch scrolling) behave normally.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || view.k <= 1) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
    if (!d.moved) return;
    const r = svgRef.current!.getBoundingClientRect();
    setView((v) => clampView(v.k, d.vx + ((e.clientX - d.x) / r.width) * W, d.vy + ((e.clientY - d.y) / r.height) * H));
  };
  const endDrag = () => {
    setTimeout(() => (drag.current = null), 0);
  };
  const wasDrag = () => !!drag.current?.moved;

  const showTip = (idx: string, target: Element) => {
    const wrap = wrapRef.current?.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (wrap) setTip({ idx, left: t.left - wrap.left + t.width / 2, top: t.top - wrap.top });
  };

  const topicR = (n: LiGraphNode) => 10 + Math.sqrt(n.count ?? 1) * 1.5;
  const itemR = 5.5;
  const edgesToDraw = lit ? graph.edges.filter(([a, b]) => lit.has(a) && lit.has(b)) : graph.edges;

  return (
    <div ref={wrapRef} className="relative" data-testid="linkedin-graph">
      <div className="overflow-x-auto border border-border bg-card/30">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full min-w-[720px] h-auto select-none"
          role="group"
          aria-label="Knowledge graph of the LinkedIn archive: topics, recurring names and every item. Each topic opens its page; the cards below list every item."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          style={{ cursor: view.k > 1 ? "grab" : "default", touchAction: view.k > 1 ? "none" : "pan-x pan-y" }}
        >
          <defs>
            <clipPath id="li-circle" clipPathUnits="objectBoundingBox">
              <circle cx="0.5" cy="0.5" r="0.5" />
            </clipPath>
          </defs>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {/* Edges */}
            <g className="stroke-muted-foreground" strokeOpacity={lit ? 0.45 : 0.1} strokeWidth={lit ? 0.6 : 0.4}>
              {edgesToDraw.map(([a, b]) => {
                const p = nodeById.get(a);
                const q = nodeById.get(b);
                if (!p || !q) return null;
                return <line key={`${a}|${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
              })}
            </g>

            {/* Items: pointer shortcuts (the cards below are the keyboard and screen-reader path) */}
            <g aria-hidden="true">
              {graph.nodes
                .filter((n) => n.type === "item")
                .map((n) => {
                  const it = itemsByIdx.get(n.idx!);
                  if (!it) return null;
                  const on = isLit(n);
                  const ring =
                    it.kind === "video"
                      ? "stroke-rose-600 dark:stroke-rose-300"
                      : it.kind === "document"
                      ? "stroke-amber-600 dark:stroke-amber-300"
                      : "stroke-muted-foreground";
                  const dot =
                    it.kind === "video"
                      ? "fill-rose-600 dark:fill-rose-300"
                      : it.kind === "document"
                      ? "fill-amber-600 dark:fill-amber-300"
                      : "fill-muted-foreground";
                  const isDoc = it.kind === "document";
                  return (
                    <a
                      key={n.id}
                      href={fullUrl(it)}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                      onClick={(e) => {
                        if (wasDrag()) {
                          e.preventDefault();
                          return;
                        }
                        if (!isPlainClick(e)) return;
                        e.preventDefault();
                        onItem(it.idx);
                      }}
                      onMouseEnter={(e) => {
                        setHover(n.id);
                        showTip(it.idx, e.currentTarget);
                      }}
                      onMouseLeave={() => {
                        setHover((h) => (h === n.id ? null : h));
                        setTip(null);
                      }}
                      style={{ opacity: on ? 1 : 0.12, transition: "opacity 160ms" }}
                    >
                      {isDoc ? (
                        <rect x={n.x - itemR} y={n.y - itemR} width={itemR * 2} height={itemR * 2} className={showThumbs ? "fill-card" : dot} />
                      ) : (
                        <circle cx={n.x} cy={n.y} r={itemR} className={showThumbs ? "fill-card" : dot} fillOpacity={showThumbs ? 1 : 0.55} />
                      )}
                      {showThumbs && (
                        <image
                          href={nodeImageUrl(it.idx)}
                          x={n.x - itemR}
                          y={n.y - itemR}
                          width={itemR * 2}
                          height={itemR * 2}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={isDoc ? undefined : "url(#li-circle)"}
                        />
                      )}
                      {isDoc ? (
                        <rect x={n.x - itemR} y={n.y - itemR} width={itemR * 2} height={itemR * 2} fill="none" className={ring} strokeWidth={1.2} />
                      ) : (
                        <circle cx={n.x} cy={n.y} r={itemR} fill="none" className={ring} strokeWidth={it.kind === "video" ? 1.4 : 0.5} />
                      )}
                      {it.kind === "video" && (
                        <path d={`M ${n.x - 1.6} ${n.y - 2.2} L ${n.x + 2.4} ${n.y} L ${n.x - 1.6} ${n.y + 2.2} Z`} className="fill-white" opacity={0.9} />
                      )}
                    </a>
                  );
                })}
            </g>

            {/* Recurring names */}
            <g>
              {graph.nodes
                .filter((n) => n.type === "entity")
                .map((n) => {
                  const on = isLit(n);
                  const labelled = (n.count ?? 0) >= 6 || (lit && lit.has(n.id)) || view.k >= 1.8;
                  return (
                    <g
                      key={n.id}
                      style={{ opacity: on ? 1 : 0.15, transition: "opacity 160ms" }}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                    >
                      <title>{`${n.label}: ${n.count} items`}</title>
                      <rect
                        x={n.x - 3.5}
                        y={n.y - 3.5}
                        width={7}
                        height={7}
                        transform={`rotate(45 ${n.x} ${n.y})`}
                        className="fill-sky-600 dark:fill-sky-300"
                      />
                      <text
                        x={n.x + 7}
                        y={n.y + 4}
                        className="fill-muted-foreground font-mono"
                        fontSize={11}
                        style={{ ...HALO, opacity: labelled ? 1 : 0, transition: "opacity 160ms" }}
                      >
                        {n.label}
                      </text>
                    </g>
                  );
                })}
            </g>

            {/* Topics: real links to the topic pages */}
            <g>
              {graph.nodes
                .filter((n) => n.type === "topic")
                .map((n) => {
                  const id = n.label;
                  const active = activeTopic === id;
                  const on = isLit(n) || active;
                  const r = topicR(n);
                  const content = (
                    <>
                      <circle cx={n.x} cy={n.y} r={r} className={active ? "fill-foreground" : "fill-background"} />
                      <circle cx={n.x} cy={n.y} r={r} fill="none" className="stroke-foreground" strokeWidth={active ? 2 : 1.2} />
                      <text x={n.x} y={n.y + 4} textAnchor="middle" className={`font-mono ${active ? "fill-background" : "fill-foreground"}`} fontSize={11} fontWeight={700}>
                        {n.count}
                      </text>
                      <text x={n.x} y={n.y + r + 13} textAnchor="middle" className="fill-foreground font-mono" fontSize={12.5} fontWeight={600} style={HALO}>
                        {topicLabel(id)}
                      </text>
                    </>
                  );
                  return id === "other" ? (
                    <g key={n.id} style={{ opacity: on ? 1 : 0.2 }}>
                      {content}
                    </g>
                  ) : (
                    <a
                      key={n.id}
                      href={`/linkedin/topics/${topicSlug(id)}`}
                      aria-label={`${topicLabel(id)}: ${n.count} items`}
                      onClick={(e) => {
                        if (wasDrag()) {
                          e.preventDefault();
                          return;
                        }
                        if (!isPlainClick(e)) return;
                        e.preventDefault();
                        onTopic(active ? null : id);
                      }}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                      onFocus={() => setHover(n.id)}
                      onBlur={() => setHover(null)}
                      style={{ opacity: on ? 1 : 0.2, transition: "opacity 160ms", cursor: "pointer" }}
                    >
                      {content}
                    </a>
                  );
                })}
            </g>
          </g>
        </svg>
      </div>

      {/* Zoom controls: JS only (hidden by the no-JS style in the explorer) */}
      <div className="li-js absolute top-2 right-2 flex gap-1">
        {[
          { label: "+", title: "Zoom in", fn: () => zoomAt(1.4) },
          { label: "−", title: "Zoom out", fn: () => zoomAt(1 / 1.4) },
          { label: "Reset", title: "Reset view", fn: () => setView({ k: 1, x: 0, y: 0 }) },
        ].map((b) => (
          <button
            key={b.title}
            type="button"
            onClick={b.fn}
            title={b.title}
            aria-label={b.title}
            className="font-mono text-[11px] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40"
          >
            {b.label}
          </button>
        ))}
      </div>

      {tip && itemsByIdx.get(tip.idx) && <HoverCard item={itemsByIdx.get(tip.idx)!} left={tip.left} top={tip.top} />}
    </div>
  );
}

function HoverCard({ item, left, top }: { item: LiItem; left: number; top: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-60 -translate-x-1/2 -translate-y-full border border-border bg-background shadow-lg"
      style={{ left, top: top - 8 }}
      role="tooltip"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(item)} alt="" className="block w-full h-32 object-cover" />
        {item.kind === "video" && (
          <span className="absolute bottom-1 right-1 font-mono text-[10px] px-1.5 py-0.5 bg-black/80 text-white">▶ {formatDuration(item.duration)}</span>
        )}
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
