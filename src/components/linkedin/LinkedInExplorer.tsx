"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  KIND_LABEL,
  LINKEDIN_ACTIVITY,
  PUBLIC_ITEMS,
  formatDay,
  formatDuration,
  fullUrl,
  posterUrl,
  thumbUrl,
  topicLabel,
  topicSlug,
  type LiItem,
  type LiKind,
} from "@/data/linkedinArchive";

/**
 * Search, filters, the knowledge graph and every item as a card, sharing one
 * state: whatever you search or filter lights up in the graph too.
 *
 * Server HTML: the whole graph and every card render with no filter applied,
 * and every card and node is a plain link to its media file, so the archive
 * is complete without JavaScript (corporate proxies that block scripts).
 */

// The graph and its data load as their own chunk (still server-rendered), so topic pages never ship them.
const LinkedInGraph = dynamic(() => import("./LinkedInGraph"));

type KindFilter = "all" | LiKind;

interface Props {
  /** Topic pages: show only this topic's items, without the graph. */
  topicId?: string;
}

const norm = (s: string) => s.toLowerCase();
/** A plain left click; modified clicks keep the browser's own behaviour (new tab, etc.). */
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
/** Controls that only work with JavaScript are hidden when scripts are blocked. */
const NOSCRIPT_STYLE = { __html: "<style>.li-js{display:none!important}</style>" };

export default function LinkedInExplorer({ topicId }: Props) {
  const hideGraph = !!topicId;
  const items = React.useMemo(() => (topicId ? PUBLIC_ITEMS.filter((i) => i.topics.includes(topicId)) : PUBLIC_ITEMS), [topicId]);
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [year, setYear] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState<string | null>(null);
  const [openIdx, setOpenIdx] = React.useState<string | null>(null);

  const itemsByIdx = React.useMemo(() => new Map(PUBLIC_ITEMS.map((i) => [i.idx, i])), []);
  const haystack = React.useMemo(
    () =>
      new Map(
        items.map((i) => [
          i.idx,
          norm(`${i.description} ${i.label} ${i.entities.join(" ")} ${i.topics.map(topicLabel).join(" ")} ${i.date} ${KIND_LABEL[i.kind]}`),
        ]),
      ),
    [items],
  );

  const terms = norm(query).split(/\s+/).filter(Boolean);
  const filtered = React.useMemo(
    () =>
      items.filter((i) => {
        if (kind !== "all" && i.kind !== kind) return false;
        if (year && !i.date.startsWith(year)) return false;
        if (topic && !hideGraph && !i.topics.includes(topic)) return false;
        const h = haystack.get(i.idx) ?? "";
        return terms.every((t) => h.includes(t));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, kind, year, topic, query, haystack, hideGraph],
  );
  const filterActive = kind !== "all" || !!year || !!query.trim() || (!!topic && !hideGraph);
  const matching = React.useMemo(() => (filterActive ? new Set(filtered.map((i) => i.idx)) : null), [filterActive, filtered]);

  const counts = React.useMemo(() => {
    const c: Record<KindFilter, number> = { all: items.length, image: 0, video: 0, document: 0 };
    for (const i of items) c[i.kind]++;
    return c;
  }, [items]);
  const years = React.useMemo(() => [...new Set(items.map((i) => i.date.slice(0, 4)))].sort().reverse(), [items]);

  const open = openIdx ? itemsByIdx.get(openIdx) ?? null : null;
  const openPos = open ? filtered.findIndex((i) => i.idx === open.idx) : -1;
  const step = (d: number) => {
    if (openPos < 0 || !filtered.length) return;
    setOpenIdx(filtered[(openPos + d + filtered.length) % filtered.length].idx);
  };

  const chip = (on: boolean) =>
    `font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border transition-colors ${
      on ? "border-foreground text-foreground bg-foreground/[0.06]" : "border-border text-muted-foreground/70 hover:text-foreground hover:border-foreground/40"
    }`;

  return (
    <div data-testid="linkedin-explorer">
      <noscript dangerouslySetInnerHTML={NOSCRIPT_STYLE} />
      {/* Controls (JS only) */}
      <div className="li-js flex flex-wrap items-center gap-2 mb-4">
        <label className="flex items-center gap-2 flex-1 min-w-[240px] border border-border px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Console, brightonSEO, Claude, keyword taxonomy…"
            className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
            data-testid="linkedin-search"
          />
        </label>
        {(["all", "image", "video", "document"] as KindFilter[]).map((k) =>
          counts[k] || k === "all" ? (
            <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={chip(kind === k)} data-testid={`linkedin-kind-${k}`}>
              {k === "all" ? "All" : `${KIND_LABEL[k as LiKind]}s`} · {counts[k]}
            </button>
          ) : null,
        )}
      </div>
      <div className="li-js flex flex-wrap items-center gap-1.5 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mr-1">Year</span>
        <button type="button" onClick={() => setYear(null)} aria-pressed={!year} className={chip(!year)}>All</button>
        {years.map((y) => (
          <button key={y} type="button" onClick={() => setYear(year === y ? null : y)} aria-pressed={year === y} className={chip(year === y)}>
            {y}
          </button>
        ))}
      </div>

      {!hideGraph && (
        <section className="mb-10" aria-labelledby="li-graph-h">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
            <h2 id="li-graph-h" className="font-display text-xl font-bold text-foreground">The knowledge graph</h2>
            <Legend />
          </div>
          <LinkedInGraph
            itemsByIdx={itemsByIdx}
            matching={matching}
            activeTopic={topic}
            onTopic={setTopic}
            onItem={setOpenIdx}
          />
          <p className="li-js mt-3 font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
            Three views: 01 Topics (each topic a flower), 02 Timeline (press Grow to replay the garden) and 03 Map (similar items
            together, outliers at the edge). Hover a topic or a name to light up everything connected to it, click a topic to
            filter the cards below, click any item to open it. Zoom with the buttons or Ctrl/⌘ and scroll, then drag to move.
          </p>
        </section>
      )}

      {/* Result line */}
      <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        <span data-testid="linkedin-count" aria-live="polite">
          {filtered.length} of {items.length} items
        </span>
        {topic && !hideGraph && (
          <span className="inline-flex items-center gap-2 border border-foreground/40 px-2 py-1 text-foreground">
            Topic: {topicLabel(topic)}
            <a href={`/linkedin/topics/${topicSlug(topic)}`} className="underline text-muted-foreground hover:text-foreground">page</a>
            <button type="button" onClick={() => setTopic(null)} className="underline text-muted-foreground hover:text-foreground">clear</button>
          </span>
        )}
        {filterActive && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setKind("all");
              setYear(null);
              if (!hideGraph) setTopic(null);
            }}
            className="underline hover:text-foreground"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Cards */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" data-testid="linkedin-grid">
        {filtered.map((it) => (
          <li key={it.idx}>
            <Card item={it} onOpen={() => setOpenIdx(it.idx)} />
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="font-mono text-sm text-muted-foreground py-10 text-center">Nothing matches. Try fewer words or reset the filters.</p>
      )}

      <Viewer item={open} onClose={() => setOpenIdx(null)} onPrev={() => step(-1)} onNext={() => step(1)} position={openPos} total={filtered.length} />
    </div>
  );
}

function Legend() {
  const dot = "inline-block w-2.5 h-2.5 border";
  return (
    <ul className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
      <li className="inline-flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-full border-2 border-foreground" /> Topic</li>
      <li className="inline-flex items-center gap-1.5"><i className="inline-block w-2 h-2 rotate-45 bg-sky-600 dark:bg-sky-300" /> Name</li>
      <li className="inline-flex items-center gap-1.5"><i className={`${dot} border-border`} /> Image</li>
      <li className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300"><i className={`${dot} border-rose-600 dark:border-rose-300`} /> Video</li>
      <li className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300"><i className="inline-block w-2.5 h-2.5 border border-amber-600 dark:border-amber-300" /> Document</li>
    </ul>
  );
}

function Card({ item, onOpen }: { item: LiItem; onOpen: () => void }) {
  return (
    <a
      href={fullUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        e.preventDefault();
        onOpen();
      }}
      className="group block h-full border border-border hover:border-foreground/50 transition-colors"
      data-testid={`linkedin-card-${item.idx}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl(item)}
          alt=""
          loading="lazy"
          decoding="async"
          width={480}
          height={Math.round((480 * (item.height || 3)) / (item.width || 4))}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
        {item.kind === "video" && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="w-10 h-10 rounded-full bg-black/70 text-white grid place-items-center text-sm" aria-hidden>▶</span>
          </span>
        )}
        <span className="absolute top-1.5 left-1.5 font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-black/75 text-white">
          {KIND_LABEL[item.kind]}
          {item.kind === "video" && item.duration ? ` · ${formatDuration(item.duration)}` : ""}
        </span>
        {item.review && (
          <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-amber-300 text-black">
            Pending review
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
          {formatDay(item.date)} · {item.label}
        </p>
        <p className="font-mono text-[11px] leading-snug text-foreground/90 line-clamp-3">{item.description}</p>
      </div>
    </a>
  );
}

function Viewer({
  item,
  onClose,
  onPrev,
  onNext,
  position,
  total,
}: {
  item: LiItem | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  position: number;
  total: number;
}) {
  // Keep the last item while the dialog animates closed, so it never flashes empty.
  const last = React.useRef<LiItem | null>(null);
  if (item) last.current = item;
  const shown = item ?? last.current;

  React.useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if ((e.target as Element | null)?.closest?.("video, input, textarea, select")) return; // let video seeking and typing work
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onPrev, onNext]);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 rounded-none sm:rounded-none border-border">
        {shown && (
          <div className="grid md:grid-cols-[1fr_320px] max-h-[90vh] overflow-y-auto md:overflow-hidden">
            <div className="bg-black flex items-center justify-center min-h-[200px] max-h-[55vh] md:max-h-[88vh]">
              {shown.kind === "video" ? (
                <video
                  key={shown.idx}
                  src={fullUrl(shown)}
                  poster={posterUrl(shown.idx)}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[55vh] md:max-h-[88vh] w-full"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={shown.idx} src={shown.kind === "document" ? thumbUrl(shown) : fullUrl(shown)} alt={shown.description} className="max-h-[55vh] md:max-h-[88vh] w-auto object-contain" />
              )}
            </div>
            <div className="p-5 md:overflow-y-auto md:max-h-[88vh] border-t md:border-t-0 md:border-l border-border">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                {formatDay(shown.date)} · {shown.label}
                {shown.kind === "video" && shown.duration ? ` · ${formatDuration(shown.duration)}` : ""}
              </p>
              <DialogTitle className="font-display text-lg font-bold text-foreground leading-snug mb-3">{shown.description}</DialogTitle>
              <DialogDescription className="sr-only">
                {KIND_LABEL[shown.kind]} from Venkata Pagadala&apos;s LinkedIn, {formatDay(shown.date)}.
              </DialogDescription>

              {shown.topics.filter((t) => t !== "other").length > 0 && (
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {shown.topics
                      .filter((t) => t !== "other")
                      .map((t) => (
                        <a key={t} href={`/linkedin/topics/${topicSlug(t)}`} className="font-mono text-[11px] px-2 py-1 border border-border text-foreground hover:border-foreground/50">
                          {topicLabel(t)}
                        </a>
                      ))}
                  </div>
                </div>
              )}
              {shown.entities.length > 0 && (
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">Names in it</p>
                  <p className="font-mono text-[11px] text-foreground/90 leading-relaxed">{shown.entities.join(" · ")}</p>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-6">
                <a href={fullUrl(shown)} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-foreground text-foreground text-center hover:bg-foreground hover:text-background transition-colors">
                  {shown.kind === "document" ? `Open ${(shown.docExt ?? "pdf").toUpperCase()}` : shown.kind === "video" ? "Open video file" : "Open full image"}
                </a>
                <a href={LINKEDIN_ACTIVITY} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-border text-muted-foreground text-center hover:text-foreground hover:border-foreground/50 transition-colors">
                  See my LinkedIn activity
                </a>
              </div>
              {position >= 0 && total > 1 && (
                <div className="flex items-center justify-between mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  <button type="button" onClick={onPrev} className="px-2 py-1 border border-border hover:text-foreground hover:border-foreground/50">← Prev</button>
                  <span>
                    {position + 1} / {total}
                  </span>
                  <button type="button" onClick={onNext} className="px-2 py-1 border border-border hover:text-foreground hover:border-foreground/50">Next →</button>
                </div>
              )}
              {shown.review && (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 bg-amber-300 text-black inline-block">Pending review: local preview only</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
