"use client";
import * as React from "react";
import { LINKEDIN_GRAPH } from "@/data/linkedinGraphData";
import { LI_VIEWS, type LiView } from "@/data/linkedinArchiveTypes";
import GraphPanel from "./GraphPanel";
import {
  engagementLine,
  entryPath,
  formatDay,
  getItem,
  getTopic,
  nodeImageUrl,
  thumbUrl,
  topicLabel,
  topicPath,
  type LiEntry,
  type LiGraphNode,
} from "@/data/linkedinArchive";

/**
 * The LinkedIn knowledge graph, in three views computed at build time:
 *   01 Topics    each L1 area a region; its L2 topics are flowers of entries (thumbnails at the centre, text posts
 *                as dots); L3 subtopics orbit their topic; the topic tree is drawn as fixed lines. Areas and topics
 *                can be dragged: their entries and lines move with them.
 *   02 Timeline  one lane per area; each entry a dot at its exact time, sized by reactions; "Grow" replays it
 *   03 Map       similar entries together (PCA of topics, subtopics and names), outliers at the edge
 * Selecting a topic (sidebar or graph) or searching zooms to what matches. Hover previews connections; a click
 * pins a node and opens its panel.
 *
 * No-JS: the server HTML is the Topics view, fully drawn; topic nodes are real links and every entry is a link
 * to its page. Entry nodes are pointer shortcuts (tabIndex -1, aria-hidden): the cards below are the keyboard path.
 */

export interface FocusRequest {
  /** "topic": zoom to a topic's entries; "matches": to the current matches; "all": fit everything. */
  kind: "topic" | "matches" | "all";
  id?: string;
  nonce: number;
}

interface Props {
  entriesByKey: Map<string, LiEntry>;
  /** Entry keys that match the search and filters; null = no filter. */
  matching: Set<string> | null;
  /** The topic selected in the sidebar (any level), or null. */
  activeTopic: string | null;
  focus: FocusRequest | null;
  onTopic: (topicId: string | null) => void;
  /** Open the entry's viewer, at this media item when given. */
  onOpenEntry: (key: string, idx?: string) => void;
}

const VIEW_META: Record<LiView, { n: string; label: string; hint: string }> = {
  topics: { n: "01", label: "Topics", hint: "areas, topics and subtopics; drag an area or a topic to move it" },
  timeline: { n: "02", label: "Timeline", hint: "one lane per area: every post at its time, sized by reactions" },
  map: { n: "03", label: "Map", hint: "similar posts sit together: typical at the centre, outliers at the edge" },
};
const MORPH_MS = 950;
const MAP_LABEL_MIN = 25; // mirrors the generator
const MIN_SCALE = 1;
const MAX_SCALE = 8;
/** Auto-zoom (search, sidebar) stops here, so the matches keep their surroundings in view. */
const FIT_MAX = 3.2;
const CARD = 6.5;
const HALO: React.CSSProperties = { paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 3.5, strokeLinejoin: "round" };
const halo = (size: number): React.CSSProperties => ({ ...HALO, strokeWidth: Math.max(3.5, size * 0.3) });
/** Below this many screen pixels per graph unit, topic and name labels wait for a zoom, a hover or a selection. */
const DETAIL_SCALE = 0.45;
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
const MOTION_CSS = `.li-m{transition:transform ${MORPH_MS}ms cubic-bezier(.22,.8,.2,1),opacity 400ms}.li-dragging .li-m{transition:opacity 400ms}@media (prefers-reduced-motion: reduce){.li-m,.li-zoom{transition:none!important}}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EMPTY: Set<string> = new Set();

export default function LinkedInGraph({ entriesByKey, matching, activeTopic, focus, onTopic, onOpenEntry }: Props) {
  const graph = LINKEDIN_GRAPH;
  const { width: W, height: H } = graph;
  const [view, setView] = React.useState<LiView>("topics");
  const [settled, setSettled] = React.useState(true);
  const [zoom, setZoom] = React.useState({ k: 1, x: 0, y: 0 });
  const [zoomAnim, setZoomAnim] = React.useState(false);
  const [hover, setHover] = React.useState<string | null>(null);
  const [pinned, setPinned] = React.useState<string | null>(null);
  const [tip, setTip] = React.useState<{ id: string; left: number; top: number } | null>(null);
  const [showThumbs, setShowThumbs] = React.useState(false);
  /** Screen pixels per graph unit at zoom 1 (the SVG's rendered width over its viewBox); labels keep a readable size. */
  const [screen, setScreen] = React.useState(0.6);
  const [reduced, setReduced] = React.useState(false);
  const [graphInView, setGraphInView] = React.useState(true);
  /** Drag offsets for areas (L1) and topics (L2), Topics view only. */
  const [offsets, setOffsets] = React.useState<Record<string, [number, number]>>({});
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [grow, setGrow] = React.useState<number | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const pan = React.useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const nodeDrag = React.useRef<{ id: string; x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppressClick = React.useRef(false);
  const settleTimer = React.useRef<number | undefined>(undefined);
  const pinTrigger = React.useRef<Element | null>(null);
  React.useEffect(() => () => window.clearTimeout(settleTimer.current), []);
  const onOpenRef = React.useRef(onOpenEntry);
  onOpenRef.current = onOpenEntry;

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
  const topicNodes = React.useMemo(() => graph.nodes.filter((n) => n.type === "topic"), [graph]);
  const entityNodes = React.useMemo(() => graph.nodes.filter((n) => n.type === "entity"), [graph]);
  const entryNodes = React.useMemo(() => graph.nodes.filter((n) => n.type === "entry"), [graph]);
  const entityIdByLabel = React.useMemo(() => new Map(entityNodes.map((n) => [n.label, n.id])), [entityNodes]);
  const regionById = React.useMemo(() => new Map(graph.regions.map((r) => [r.id, r])), [graph]);

  // Which area and topic each node moves with when dragged (Topics view).
  const group = React.useMemo(() => {
    const g = new Map<string, { area?: string; topic?: string }>();
    for (const n of topicNodes) {
      const t = getTopic(n.label);
      if (!t) continue;
      if (t.level === 1) g.set(n.id, { area: t.id });
      if (t.level === 2) g.set(n.id, { area: t.parent ?? undefined, topic: t.id });
      if (t.level === 3) g.set(n.id, { area: getTopic(t.parent ?? "")?.parent ?? undefined, topic: t.parent ?? undefined });
    }
    for (const n of entryNodes) {
      const main = entriesByKey.get(n.label)?.topics[0];
      if (main) g.set(n.id, { area: getTopic(main)?.parent ?? undefined, topic: main });
    }
    return g;
  }, [topicNodes, entryNodes, entriesByKey]);
  const offsetOf = React.useCallback(
    (id: string): [number, number] => {
      const g = group.get(id);
      if (!g) return [0, 0];
      const a = g.area ? offsets[g.area] ?? [0, 0] : [0, 0];
      const t = g.topic ? offsets[g.topic] ?? [0, 0] : [0, 0];
      return [a[0] + t[0], a[1] + t[1]];
    },
    [group, offsets],
  );

  React.useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener?.("change", sync);
    return () => q.removeEventListener?.("change", sync);
  }, []);
  React.useEffect(() => {
    const el = svgRef.current;
    if (!el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScreen(w / W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [W]);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return setShowThumbs(true);
    const io = new IntersectionObserver((es) => {
      const vis = es.some((e) => e.isIntersecting);
      setGraphInView(vis);
      if (vis) setShowThumbs(true);
    }, { rootMargin: "200px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const switchView = (v: LiView) => {
    if (v === view) return;
    setHover(null);
    setTip(null);
    setPlaying(false);
    setGrow(null);
    setSettled(false);
    setView(v);
    setZoom({ k: 1, x: 0, y: 0 });
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettled(true), reduced ? 0 : MORPH_MS);
  };

  // ---- positions ----
  const P = React.useCallback(
    (n: LiGraphNode): [number, number] => {
      const p = n.pos[view] ?? n.pos.topics ?? [W / 2, H / 2];
      if (view !== "topics") return p;
      const [dx, dy] = offsetOf(n.id);
      return [p[0] + dx, p[1] + dy];
    },
    [view, offsetOf, W, H],
  );
  const visible = (n: LiGraphNode) => !!n.pos[view];

  // ---- timeline replay ----
  const tl = graph.timeline;
  const axisX0 = tl.years[0]?.x0 ?? tl.left;
  const axisX1 = tl.years[tl.years.length - 1]?.x1 ?? W - 30;
  React.useEffect(() => {
    if (!playing) return;
    if (reduced) {
      const span = axisX1 - axisX0 || 1;
      const ends = tl.years.map((y) => (y.x1 - axisX0) / span);
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
    const start = performance.now() - (grow ?? 0) * 10000;
    const tick = (t: number) => {
      const g = Math.min(1, (t - start) / 10000);
      setGrow(g);
      if (g < 1) raf = requestAnimationFrame(tick);
      else {
        setPlaying(false);
        setGrow(null);
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
    const f = Math.min(0.999, Math.max(0, (growX - b.x0 - 4) / (b.x1 - b.x0 - 8 || 1)));
    return `${MONTHS[Math.floor(f * 12)]} ${b.year}`;
  })();
  const hiddenByGrow = (n: LiGraphNode) => view === "timeline" && growX != null && n.type === "entry" && (n.pos.timeline?.[0] ?? 0) > growX;

  // ---- what is lit ----
  const topicEntrySet = React.useMemo(() => {
    if (!activeTopic) return null;
    const t = getTopic(activeTopic);
    if (!t) return null;
    const s = new Set<string>([`t:${activeTopic}`]);
    for (const n of entryNodes) {
      const e = entriesByKey.get(n.label);
      if (!e) continue;
      const hit = t.level === 3 ? e.subtopics.includes(t.id) : t.level === 2 ? e.topics.includes(t.id) : e.topics.some((x) => getTopic(x)?.parent === t.id);
      if (hit) s.add(n.id);
    }
    for (let p = t.parent; p; p = getTopic(p)?.parent ?? null) s.add(`t:${p}`);
    for (const n of topicNodes) if (getTopic(n.label)?.parent === t.id) s.add(n.id);
    return s;
  }, [activeTopic, entryNodes, topicNodes, entriesByKey]);
  const focusId = pinned ?? hover;
  const lit = React.useMemo(() => {
    if (focusId) return new Set<string>([focusId, ...(neighbours.get(focusId) ?? [])]);
    return topicEntrySet;
  }, [focusId, neighbours, topicEntrySet]);
  const isLit = (n: LiGraphNode) => {
    if (n.type === "entry") {
      if (matching && !matching.has(n.label)) return false;
      if (hiddenByGrow(n)) return false;
    }
    return lit ? lit.has(n.id) : true;
  };

  // ---- zoom ----
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
  const animate = () => {
    setZoomAnim(true);
    window.setTimeout(() => setZoomAnim(false), 700);
  };
  /** Zoom (animated) so these points fill the view. */
  const fitTo = React.useCallback(
    (pts: [number, number][]) => {
      if (!pts.length) return;
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const pad = 40;
      const bw = Math.max(...xs) - Math.min(...xs) + 2 * pad, bh = Math.max(...ys) - Math.min(...ys) + 2 * pad;
      const k = Math.min(FIT_MAX, Math.max(MIN_SCALE, Math.min(W / bw, H / bh)));
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      animate();
      setZoom(clampView(k, W / 2 - cx * k, H / 2 - cy * k));
    },
    [W, H, clampView],
  );
  React.useEffect(() => {
    if (!focus) return;
    if (focus.kind === "all") {
      animate();
      setZoom({ k: 1, x: 0, y: 0 });
      return;
    }
    const ids =
      focus.kind === "topic" && topicEntrySet
        ? [...topicEntrySet]
        : focus.kind === "matches" && matching
        ? entryNodes.filter((n) => matching.has(n.label)).map((n) => n.id)
        : [];
    const pts = ids.map((id) => nodeById.get(id)).filter((n): n is LiGraphNode => !!n && visible(n)).map(P);
    // Zoom only when the matches are a part of the graph, not most of it.
    if (pts.length && pts.length < entryNodes.length * 0.6) fitTo(pts);
    else {
      animate();
      setZoom({ k: 1, x: 0, y: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce]);
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

  // ---- pointer: pan the view (when zoomed), or drag an area or topic (Topics view) ----
  const toGraph = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const;
  };
  // Drags apply at most once per animation frame (the latest pointer position), so moving an area stays smooth.
  const dragFrame = React.useRef(0);
  const dragPending = React.useRef<[string, number, number] | null>(null);
  const flushDrag = () => {
    window.cancelAnimationFrame(dragFrame.current);
    dragFrame.current = 0;
    const p = dragPending.current;
    dragPending.current = null;
    if (p) setOffsets((o) => ({ ...o, [p[0]]: [p[1], p[2]] }));
  };
  React.useEffect(() => () => window.cancelAnimationFrame(dragFrame.current), []);
  const startNodeDrag = (e: React.PointerEvent, topicId: string) => {
    if (view !== "topics" || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.stopPropagation();
    const [gx, gy] = toGraph(e);
    const o = offsets[topicId] ?? [0, 0];
    nodeDrag.current = { id: topicId, x: gx, y: gy, ox: o[0], oy: o[1], moved: false };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || zoom.k <= 1) return;
    pan.current = { x: e.clientX, y: e.clientY, vx: zoom.x, vy: zoom.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = nodeDrag.current;
    if (d) {
      const [gx, gy] = toGraph(e);
      const dx = (gx - d.x) / zoom.k, dy = (gy - d.y) / zoom.k;
      if (!d.moved && Math.hypot(dx, dy) < 2) return;
      if (!d.moved) {
        d.moved = true;
        setDragging(d.id);
        setTip(null);
        svgRef.current?.setPointerCapture?.(e.pointerId);
      }
      dragPending.current = [d.id, d.ox + dx, d.oy + dy];
      if (!dragFrame.current) dragFrame.current = window.requestAnimationFrame(flushDrag);
      return;
    }
    const p = pan.current;
    if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) p.moved = true;
    if (!p.moved) return;
    const r = svgRef.current!.getBoundingClientRect();
    setZoom((v) => clampView(v.k, p.vx + ((e.clientX - p.x) / r.width) * W, p.vy + ((e.clientY - p.y) / r.height) * H));
  };
  const endPointer = () => {
    if (dragPending.current) flushDrag();
    if (nodeDrag.current?.moved || pan.current?.moved) {
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
    }
    nodeDrag.current = null;
    pan.current = null;
    setDragging(null);
  };

  // ---- hover, tooltip, pin ----
  const showTip = React.useCallback((id: string, target: Element) => {
    const wrap = wrapRef.current?.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (wrap) setTip({ id, left: t.left - wrap.left + t.width / 2, top: t.top - wrap.top });
  }, []);
  const enter = React.useCallback((id: string, el: Element) => {
    if (nodeDrag.current) return;
    setHover(id);
    if (id.startsWith("e:")) showTip(id, el);
  }, [showTip]);
  const leave = React.useCallback((id: string) => {
    setHover((h) => (h === id ? null : h));
    setTip(null);
  }, []);
  const pinClick = React.useCallback((e: React.MouseEvent, id: string) => {
    if (suppressClick.current) return e.preventDefault();
    if (!isPlainClick(e)) return;
    e.preventDefault();
    setTip(null);
    pinTrigger.current = e.currentTarget;
    setPinned((p) => (p === id ? null : id));
  }, []);
  const unpin = React.useCallback(() => {
    const inDrawer = !!document.activeElement?.closest?.("[data-testid=linkedin-graph-panel]");
    setPinned((current) => {
      if (inDrawer) {
        const el = current ? document.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(current)}"]`) : null;
        const target = el && el.tabIndex >= 0 ? el : (pinTrigger.current as HTMLElement | null);
        window.setTimeout(() => target?.isConnected && target.focus({ preventScroll: true }), 0);
      }
      return null;
    });
  }, []);
  const pinFromPanel = React.useCallback(
    (id: string) => {
      setTip(null);
      setPinned(id);
      const n = nodeById.get(id);
      // When zoomed in, bring the newly pinned node into view.
      if (n && n.pos[view] && zoom.k > 1.2) {
        const p = P(n);
        animate();
        setZoom((v) => clampView(v.k, W / 2 - p[0] * v.k, H / 2 - p[1] * v.k));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeById, view, P, zoom.k, clampView, W, H],
  );
  const openFromPanel = React.useCallback((key: string, idx?: string) => onOpenRef.current(key, idx), []);
  React.useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("[role=dialog]")) return;
      if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      unpin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned, unpin]);
  const pinnedNode = pinned ? nodeById.get(pinned) : undefined;

  const move = (x: number, y: number, extra = ""): React.CSSProperties => ({ transform: `translate(${x}px, ${y}px)${extra}` });
  const restLines = settled ? graph.lines[view] : [];
  const litLines = lit && settled && lit.size < 400 ? graph.links.filter(([a, b]) => lit.has(a) && lit.has(b)) : [];
  const lensEntry = hover?.startsWith("e:") ? nodeById.get(hover) : pinned?.startsWith("e:") ? nodeById.get(pinned) : undefined;
  const meta = VIEW_META[view];
  // Level of detail: s is screen pixels per graph unit now. Label sizes are in graph units, so a label of at least
  // `px` screen pixels is px / s units (never smaller than its designed size, never more than `cap` times it).
  const s = screen * zoom.k;
  const detail = s >= DETAIL_SCALE;
  const fs = (base: number, px: number, cap = 2.6) => Math.min(base * cap, Math.max(base, px / s));
  // Timeline lane names: right-aligned in the left margin when they fit there, otherwise above their lane.
  const laneGap = tl.lanes.length > 1 ? tl.lanes[1].y - tl.lanes[0].y : 80;
  const laneLabel = (text: string, nodeX: number) => {
    const size = fs(11.5, 11);
    const fits = text.length * 0.62 * size <= tl.left - 30;
    return fits
      ? { size, x: 0, y: size * 0.35, anchor: "end" as const }
      : { size, x: 12 - nodeX, y: -laneGap * 0.36 + size * 0.35, anchor: "start" as const };
  };
  // Matches drawn in this view (entries with no topic exist only in the Timeline).
  const matchCount = matching ? entryNodes.filter((n) => matching.has(n.label) && n.pos[view]).length : null;
  const matchHidden = matching ? entryNodes.filter((n) => matching.has(n.label)).length - (matchCount ?? 0) : 0;
  const hasOffsets = Object.keys(offsets).length > 0;

  return (
    <div>
      <div ref={wrapRef} className={`relative ${dragging ? "li-dragging" : ""}`} data-testid="linkedin-graph" data-view={view} data-pinned={pinned ?? undefined}>
        <style>{MOTION_CSS}</style>
        <div className="li-js mb-2 flex flex-wrap items-center justify-start gap-1">
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
            { label: "Fit", title: "Fit everything", fn: () => { animate(); setZoom({ k: 1, x: 0, y: 0 }); } },
          ].map((b) => (
            <button key={b.title} type="button" onClick={b.fn} title={b.title} aria-label={b.title} className="font-mono text-[11px] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/40">
              {b.label}
            </button>
          ))}
          {view === "topics" && hasOffsets && (
            <button type="button" onClick={() => setOffsets({})} className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 border border-border bg-background/90 text-muted-foreground hover:text-foreground">
              Reset layout
            </button>
          )}
        </div>
        <div className="overflow-x-auto border border-border bg-card/30">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full min-w-[640px] sm:min-w-0 h-auto select-none"
            role="group"
            aria-label={`Knowledge graph of the LinkedIn archive, ${meta.label} view: ${meta.hint}. Activate an area, topic or subtopic to pin it and list its connections; the cards below list every post.`}
            onClick={(e) => {
              if (!suppressClick.current && !(e.target as Element).closest("a, [data-node-id]")) setPinned(null);
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerLeave={endPointer}
            onPointerCancel={endPointer}
            onLostPointerCapture={endPointer}
            style={{ cursor: dragging ? "grabbing" : zoom.k > 1 ? "grab" : "default", touchAction: zoom.k > 1 || dragging ? "none" : "pan-x pan-y pinch-zoom" }}
          >
            <g
              className="li-zoom"
              style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.k})`, transformOrigin: "0 0", transition: zoomAnim ? "transform 650ms cubic-bezier(.22,.8,.2,1)" : "none" }}
            >
              {/* View furniture */}
              {view === "topics" && settled && (
                <g aria-hidden="true">
                  {/* Drag handles at zoom 1: an area anywhere inside its circle, a topic anywhere in its flower (the
                      posts on top keep their own hover and click). Zoomed in, a drag pans instead. */}
                  {graph.regions.map((r) => {
                    const [dx, dy] = offsets[r.id] ?? [0, 0];
                    return (
                      <circle
                        key={r.id}
                        cx={r.x + dx}
                        cy={r.y + dy}
                        r={r.r}
                        fill={zoom.k <= 1 ? "transparent" : "none"}
                        className="stroke-border"
                        strokeDasharray="2 5"
                        strokeOpacity={dragging === r.id ? 1 : !lit || lit.has(`t:${r.id}`) ? 0.9 : 0.35}
                        style={zoom.k <= 1 ? { cursor: dragging === r.id ? "grabbing" : "grab", touchAction: "none" } : undefined}
                        onPointerDown={zoom.k <= 1 ? (ev) => startNodeDrag(ev, r.id) : undefined}
                      />
                    );
                  })}
                  {zoom.k <= 1 &&
                    topicNodes.map((n) => {
                      if (n.level !== 2 || !n.pos.topics) return null;
                      const [x, y] = P(n);
                      return (
                        <circle
                          key={`h${n.id}`}
                          cx={x}
                          cy={y}
                          r={5.4 * Math.sqrt((n.own ?? 0) + 2.5) + 4}
                          fill="transparent"
                          style={{ cursor: dragging === n.label ? "grabbing" : "grab", touchAction: "none" }}
                          onPointerDown={(ev) => startNodeDrag(ev, n.label)}
                        />
                      );
                    })}
                </g>
              )}
              {view === "timeline" && settled && (
                <g className="font-mono" aria-hidden="true">
                  {tl.years.map((y, k) => (
                    <g key={y.year}>
                      {k > 0 && <line x1={y.x0} x2={y.x0} y1={30} y2={tl.axisY} className="stroke-border" strokeDasharray="2 4" />}
                      <text x={(y.x0 + y.x1) / 2} y={tl.axisY + 22} textAnchor="middle" className="fill-muted-foreground" fontSize={fs(11, 10)}>
                        {y.year}
                      </text>
                    </g>
                  ))}
                  {tl.lanes.map((l) => (
                    <g key={l.id}>
                      <line x1={tl.left - 8} x2={W - 20} y1={l.y} y2={l.y} className="stroke-border" strokeOpacity={0.4} />
                      {l.id === "unsorted" &&
                        (() => {
                          const ll = laneLabel("No topic", tl.left - 16);
                          return (
                            <text x={tl.left - 16 + ll.x} y={l.y + ll.y} textAnchor={ll.anchor} className="fill-muted-foreground" fontSize={ll.size} style={halo(ll.size)}>
                              No topic
                            </text>
                          );
                        })()}
                    </g>
                  ))}
                  <line x1={axisX0} x2={axisX1} y1={tl.axisY} y2={tl.axisY} className="stroke-foreground" strokeOpacity={0.5} />
                  {growX != null && (
                    <g>
                      <line x1={growX} x2={growX} y1={24} y2={tl.axisY + 6} className="stroke-foreground" strokeWidth={1} />
                      <text x={growX + 6} y={36} className="fill-foreground" fontSize={11} style={HALO}>
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
                      <circle cx={graph.map.cx} cy={graph.map.cy} r={r.r} fill="none" className="stroke-muted-foreground" strokeOpacity={0.5} strokeDasharray="3 5" />
                      <text x={graph.map.cx + r.r * 0.71 + 4} y={graph.map.cy - r.r * 0.71 - 4} className="fill-muted-foreground" fontSize={10} style={HALO}>
                        {r.label.toUpperCase()}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Lines at rest (Topics: the fixed topic tree) and the lit neighbourhood */}
              <g className="stroke-muted-foreground" aria-hidden="true">
                {restLines.map(([a, b]) => {
                  const p = nodeById.get(a), q = nodeById.get(b);
                  if (!p || !q || !visible(p) || !visible(q)) return null;
                  const [x1, y1] = P(p), [x2, y2] = P(q);
                  const tree = view === "topics";
                  const on = !lit || (lit.has(a) && lit.has(b));
                  return <line key={`r${a}|${b}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={on ? (tree ? 0.45 : 0.28) : 0.06} strokeWidth={tree ? 0.8 : 0.6} />;
                })}
                {litLines.map(([a, b]) => {
                  const p = nodeById.get(a), q = nodeById.get(b);
                  if (!p || !q || !visible(p) || !visible(q)) return null;
                  if (p.type === "topic" && q.type === "topic" && view === "topics") return null; // drawn as the tree
                  const [x1, y1] = P(p), [x2, y2] = P(q);
                  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12, my = (y1 + y2) / 2 - (x2 - x1) * 0.12;
                  return <path key={`l${a}|${b}`} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" className="stroke-foreground" strokeOpacity={0.5} strokeWidth={0.6} />;
                })}
              </g>

              {/* Entries: thumbnail cards, text-post dots, article pages */}
              <g aria-hidden="true">
                {entryNodes.map((n) => {
                  if (!visible(n)) return null;
                  const e = entriesByKey.get(n.label);
                  if (!e) return null;
                  const [x, y] = P(n);
                  return (
                    <EntryNode
                      key={n.id}
                      node={n}
                      entry={e}
                      x={x}
                      y={y}
                      view={view}
                      on={isLit(n)}
                      match={!!matching && matching.has(n.label)}
                      hidden={hiddenByGrow(n)}
                      hot={hover === n.id || pinned === n.id}
                      thumbs={showThumbs}
                      onEnter={enter}
                      onLeave={leave}
                      onPin={pinClick}
                    />
                  );
                })}
              </g>

              {/* Recurring names */}
              <g>
                {entityNodes.map((n) => {
                  if (!visible(n)) return null;
                  const [x, y] = P(n);
                  const on = isLit(n);
                  const labelled = (view === "topics" && detail) || !!(lit && lit.has(n.id)) || hover === n.id || zoom.k >= 2;
                  const size = fs(11, 9);
                  const left = view === "topics" && x < W / 2;
                  return (
                    <g
                      key={n.id}
                      className="li-m"
                      style={{ ...move(x, y), opacity: on ? 1 : 0.15, cursor: "pointer" }}
                      onMouseEnter={(ev) => enter(n.id, ev.currentTarget)}
                      onMouseLeave={() => leave(n.id)}
                      onClick={(ev) => pinClick(ev, n.id)}
                      data-node-id={n.id}
                    >
                      <title>{`${n.label}: ${n.count} posts`}</title>
                      <rect x={-3.2} y={-3.2} width={6.4} height={6.4} transform="rotate(45)" className={`fill-sky-600 dark:fill-sky-300 ${pinned === n.id ? "stroke-foreground" : ""}`} strokeWidth={pinned === n.id ? 1.6 : 0} />
                      <text x={left ? -8 : 8} y={size * 0.35} textAnchor={left ? "end" : "start"} className="fill-muted-foreground font-mono" fontSize={size} style={{ ...halo(size), opacity: labelled ? 1 : 0, pointerEvents: labelled ? "auto" : "none" }}>
                        {n.label}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Topics: areas (L1), topics (L2), subtopics (L3). Real links to their pages; drag to move (Topics view). */}
              <g>
                {topicNodes.map((n) => {
                  if (!visible(n)) return null;
                  const t = getTopic(n.label);
                  if (!t) return null;
                  const [x, y] = P(n);
                  const active = activeTopic === t.id || pinned === n.id;
                  const on = isLit(n) || active;
                  const draggable = view === "topics" && (t.level === 1 || t.level === 2);
                  const style: React.CSSProperties = {
                    ...move(x, y),
                    opacity: on ? 1 : 0.22,
                    cursor: draggable ? (dragging === t.id ? "grabbing" : "grab") : "pointer",
                    ...(draggable ? { touchAction: "none" } : {}),
                  };
                  const onDown = draggable ? (ev: React.PointerEvent) => startNodeDrag(ev, t.id) : undefined;
                  const linkProps = {
                    href: topicPath(t.id),
                    "aria-label": `${t.label}: ${n.count} posts`,
                    "aria-expanded": pinned === n.id,
                    "data-node-id": n.id,
                    className: "li-m",
                    onClick: (ev: React.MouseEvent) => pinClick(ev, n.id),
                    onMouseEnter: (ev: React.MouseEvent) => enter(n.id, ev.currentTarget),
                    onMouseLeave: () => leave(n.id),
                    onFocus: (ev: React.FocusEvent) => enter(n.id, ev.currentTarget),
                    onBlur: () => leave(n.id),
                    onPointerDown: onDown,
                  };
                  if (t.level === 1) {
                    if (view === "timeline") {
                      const text = `${t.label} · ${n.count}`;
                      const { size, x: lx, y: ly, anchor } = laneLabel(text, x);
                      return (
                        <a key={n.id} {...linkProps} style={style}>
                          <text x={lx} y={ly} textAnchor={anchor} className={`font-mono ${active ? "fill-foreground" : "fill-muted-foreground"}`} fontSize={size} fontWeight={active ? 700 : 600} style={halo(size)}>
                            {t.label} · {n.count}
                          </text>
                        </a>
                      );
                    }
                    if (view === "map") {
                      const shown = active || !!(lit && lit.has(n.id)) || zoom.k >= 1.6;
                      const size = fs(13, 12);
                      return (
                        <a key={n.id} {...linkProps} style={{ ...style, opacity: shown ? 1 : 0, pointerEvents: shown ? "auto" : "none" }}>
                          <text y={size * 0.35} textAnchor="middle" className="fill-foreground font-mono" fontSize={size} fontWeight={700} style={halo(size)}>
                            {t.label.toUpperCase()}
                          </text>
                        </a>
                      );
                    }
                    // Topics view: the area's name always readable (about 12 screen pixels), on two lines when it is wider
                    // than its region (so neighbouring names do not collide); its count once there is room.
                    const size = fs(14, 11.5, 3.2);
                    const words = t.label.toUpperCase().split(" ");
                    const region = regionById.get(t.id);
                    let lines = [words.join(" ")];
                    if (region && words.length > 1 && lines[0].length * 0.66 * size > region.r * 1.8) {
                      let cut = 1;
                      for (let i = 1, best = Infinity; i < words.length; i++) {
                        const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
                        if (d < best) [best, cut] = [d, i];
                      }
                      lines = [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
                    }
                    if (detail) lines[lines.length - 1] += ` · ${n.count}`;
                    return (
                      <a key={n.id} {...linkProps} style={style}>
                        <text textAnchor="middle" className="fill-foreground font-mono" fontSize={size} fontWeight={700} letterSpacing="0.06em" style={halo(size)}>
                          {lines.map((l, k) => (
                            <tspan key={k} x={0} y={(k - (lines.length - 1) / 2) * size * 1.05 + size * 0.3}>
                              {l}
                            </tspan>
                          ))}
                        </text>
                      </a>
                    );
                  }
                  if (t.level === 2) {
                    const r = view === "map" ? 3 + Math.sqrt(n.count ?? 1) * 0.45 : 6 + Math.sqrt(n.own ?? 1) * 0.7;
                    const flowerR = 5.4 * Math.sqrt((n.own ?? 0) + 2.5) + 4;
                    const labelY = view === "topics" ? (n.labelAbove ? -flowerR - 6 : flowerR + 13) : r + 12;
                    const emphasised = active || !!(lit && lit.has(n.id)) || hover === n.id;
                    // The Map keeps its biggest topics named even before a zoom, so it can be read at a glance.
                    const labelShown =
                      emphasised || (detail ? view !== "map" || (n.count ?? 0) >= MAP_LABEL_MIN || zoom.k >= 1.8 : view === "map" && (n.count ?? 0) >= MAP_LABEL_MIN * 2);
                    const size = fs(11.5, 10, 2);
                    const lx = view === "map" && n.mapLabel ? n.mapLabel[0] : 0;
                    const ly = view === "map" && n.mapLabel ? n.mapLabel[1] : labelY;
                    return (
                      <a key={n.id} {...linkProps} style={style}>
                        <circle r={r} className={active ? "fill-foreground" : "fill-background"} />
                        <circle r={r} fill="none" className="stroke-foreground" strokeWidth={active ? 1.8 : 1} />
                        {view !== "map" && (
                          <text y={3.5} textAnchor="middle" className={`font-mono ${active ? "fill-background" : "fill-foreground"}`} fontSize={9.5} fontWeight={700}>
                            {n.count}
                          </text>
                        )}
                        <text x={lx} y={ly + (n.labelAbove && view === "topics" ? 0 : size - 11.5)} textAnchor="middle" className="fill-foreground font-mono" fontSize={size} fontWeight={600} style={{ ...halo(size), opacity: labelShown ? 1 : 0 }}>
                          {t.label}
                        </text>
                      </a>
                    );
                  }
                  // L3 subtopic: a small hexagon on its topic's rim; label on hover, pin or zoom
                  const shownLabel = active || !!(lit && lit.has(n.id)) || hover === n.id || s >= 1.3;
                  const size = fs(10, 9, 2);
                  return (
                    <a key={n.id} {...linkProps} style={style}>
                      <path d="M -3.6 0 L -1.8 -3.1 L 1.8 -3.1 L 3.6 0 L 1.8 3.1 L -1.8 3.1 Z" className={active ? "fill-foreground stroke-foreground" : "fill-background stroke-foreground"} strokeWidth={0.9} />
                      <text x={6} y={size * 0.35} className="fill-muted-foreground font-mono" fontSize={size} style={{ ...halo(size), opacity: shownLabel ? 1 : 0, pointerEvents: shownLabel ? "auto" : "none" }}>
                        {t.label} · {n.count}
                      </text>
                    </a>
                  );
                })}
              </g>

              {/* Lens: the hovered or pinned card, enlarged */}
              {lensEntry?.cover && showThumbs && lensEntry.pos[view] && (() => {
                const [x, y] = P(lensEntry);
                const L = Math.max(12, 36 / zoom.k);
                return (
                  <g style={{ pointerEvents: "none" }} aria-hidden="true">
                    <rect x={x - L / 2 - 1} y={y - L / 2 - 1} width={L + 2} height={L + 2} className="fill-background stroke-foreground" strokeWidth={0.8 / zoom.k} />
                    <image href={nodeImageUrl(lensEntry.cover)} x={x - L / 2} y={y - L / 2} width={L} height={L} preserveAspectRatio="xMidYMid slice" />
                  </g>
                );
              })()}
            </g>
          </svg>
        </div>

        {tip && tip.id !== pinned && entriesByKey.get(nodeById.get(tip.id)?.label ?? "") && (
          <EntryCard entry={entriesByKey.get(nodeById.get(tip.id)!.label)!} left={tip.left} top={tip.top} />
        )}
      </div>
      <div className="li-js mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70" data-testid="linkedin-graph-status">
        <p>
          <span className="text-foreground">View {meta.n} · {meta.label}</span> <span className="normal-case tracking-normal">· {meta.hint}</span>
        </p>
        <p>
          Zoom {zoom.k.toFixed(1)}×{matchCount != null ? ` · ${matchCount} match${matchCount === 1 ? "" : "es"} lit` : ""}
          {matchHidden > 0 ? ` · ${matchHidden} more in the Timeline` : ""}
          {activeTopic ? ` · ${topicLabel(activeTopic)}` : ""}
        </p>
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
            onChange={(ev) => {
              setPlaying(false);
              setGrow(Number(ev.target.value) / 1000);
            }}
            aria-label="Show posts up to this date"
            aria-valuetext={grow == null ? "All dates" : growLabel}
            className="flex-1 accent-current"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 w-16" aria-live={playing ? "off" : "polite"}>
            {grow == null ? "All" : growLabel}
          </span>
        </div>
      )}
      {pinnedNode && graphInView && (
        <div className="fixed z-40 inset-x-2 bottom-2 max-h-[42dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-24 sm:w-[340px] sm:max-h-[calc(100vh-7rem)] sm:pb-0">
          <GraphPanel
            node={pinnedNode}
            nodeById={nodeById}
            neighbours={neighbours.get(pinnedNode.id) ?? EMPTY}
            entriesByKey={entriesByKey}
            entityIdByLabel={entityIdByLabel}
            activeTopic={activeTopic}
            onPin={pinFromPanel}
            onOpenEntry={openFromPanel}
            onFilterTopic={onTopic}
            onClose={unpin}
          />
        </div>
      )}
    </div>
  );
}

interface EntryNodeProps {
  node: LiGraphNode;
  entry: LiEntry;
  x: number;
  y: number;
  view: LiView;
  on: boolean;
  match: boolean;
  hidden: boolean;
  hot: boolean;
  thumbs: boolean;
  onEnter: (id: string, el: Element) => void;
  onLeave: (id: string) => void;
  onPin: (e: React.MouseEvent, id: string) => void;
}

/** One entry; memoized so hovers, drags and Grow frames only re-render what changed. */
const EntryNode = React.memo(function EntryNode({ node, entry, x, y, view, on, match, hidden, hot, thumbs, onEnter, onLeave, onPin }: EntryNodeProps) {
  const card = !!node.cover && view !== "timeline";
  const r = view === "topics" ? 1.7 : node.size ?? 2;
  const item = node.cover ? getItem(node.cover) : undefined;
  const ring = item?.kind === "video" ? "stroke-rose-600 dark:stroke-rose-300" : item?.kind === "document" ? "stroke-amber-600 dark:stroke-amber-300" : "stroke-muted-foreground";
  return (
    <g className="li-m" style={{ transform: `translate(${x}px, ${y}px)${hidden ? " scale(0)" : ""}`, opacity: on ? 1 : hidden ? 0 : 0.1, pointerEvents: hidden ? "none" : "auto" }}>
      <a
        href={entryPath(entry)}
        tabIndex={-1}
        data-node-id={node.id}
        onClick={(e) => onPin(e, node.id)}
        onMouseEnter={(e) => onEnter(node.id, e.currentTarget)}
        onMouseLeave={() => onLeave(node.id)}
      >
        {match && <circle r={card ? CARD * 0.85 : r + 2.2} fill="none" className="stroke-foreground" strokeWidth={0.9} />}
        {entry.kind === "article" ? (
          <>
            <path d="M -3.6 -4.4 H 1.6 L 3.6 -2.4 V 4.4 H -3.6 Z" className={hot ? "fill-foreground" : "fill-background"} />
            <path d="M -3.6 -4.4 H 1.6 L 3.6 -2.4 V 4.4 H -3.6 Z M 1.6 -4.4 V -2.4 H 3.6" fill="none" className="stroke-foreground" strokeWidth={0.9} />
          </>
        ) : card ? (
          <>
            <rect x={-CARD / 2} y={-CARD / 2} width={CARD} height={CARD} className={thumbs ? "fill-card" : "fill-muted-foreground"} fillOpacity={thumbs ? 1 : 0.5} />
            {thumbs && <image href={nodeImageUrl(node.cover!)} x={-CARD / 2} y={-CARD / 2} width={CARD} height={CARD} preserveAspectRatio="xMidYMid slice" />}
            <rect x={-CARD / 2} y={-CARD / 2} width={CARD} height={CARD} fill="none" className={hot ? "stroke-foreground" : ring} strokeWidth={hot ? 1.2 : item?.kind === "image" ? 0.35 : 1} />
            {item?.kind === "video" && <path d="M -1.1 -1.6 L 1.8 0 L -1.1 1.6 Z" className="fill-white" opacity={0.9} />}
          </>
        ) : (
          <circle r={r} className={hot ? "fill-rose-600 dark:fill-rose-300" : node.cover ? "fill-foreground" : "fill-muted-foreground"} fillOpacity={hot ? 1 : node.cover ? 0.8 : 0.65} />
        )}
      </a>
    </g>
  );
});

function EntryCard({ entry, left, top }: { entry: LiEntry; left: number; top: number }) {
  const cover = entry.media[0] ? getItem(entry.media[0]) : undefined;
  return (
    <div className="pointer-events-none absolute z-20 w-64 -translate-x-1/2 -translate-y-full border border-border bg-background shadow-lg" style={{ left, top: top - 14 }} role="tooltip">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl(cover)} alt="" className="block w-full h-28 object-cover" />
      )}
      <div className="p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
          {entry.kind === "article" ? "Article" : entry.kind === "post" ? "Post" : "Media"} · {formatDay(entry.date)}
        </p>
        <p className="font-mono text-[11px] leading-snug text-foreground line-clamp-3">{entry.title}</p>
        {entry.engagement && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{engagementLine(entry)}</p>}
        {entry.topics.length > 0 && <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">{entry.topics.map(topicLabel).join(" · ")}</p>}
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground">Click to pin it</p>
      </div>
    </div>
  );
}
