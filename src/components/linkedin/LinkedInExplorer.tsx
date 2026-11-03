"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import TopicTree from "./TopicTree";
import ArchiveFilters from "./ArchiveFilters";
import UniverseHelp from "./UniverseHelp";
import { KIND_FILTERS, compileQuery, entryHaystack, entryKindLabel, hasKind, mediaOf, sourceCounts, useFullText, type KindFilter, type SourceFilter } from "@/lib/linkedinSearch";
import {
  KIND_LABEL,
  LINKEDIN_ENTRIES,
  SOURCE_LABEL,
  engagementLine,
  entryPath,
  formatDateTime,
  formatDay,
  formatDuration,
  fullUrl,
  getTopic,
  inTopic,
  posterUrl,
  thumbUrl,
  topicCounts,
  topicLabel,
  topicPath,
  topicTrail,
  LINKEDIN_POSTS_PATH,
  type LiEntry,
} from "@/data/linkedinArchive";

/**
 * The archive hub: the topic tree as a sidebar, search and filters, the Universe (the archive in 3D, the one view)
 * and every post, article and standalone media item as a card, all sharing one state. Whatever you search, filter or
 * pick in the sidebar lights up in the Universe, and it flies there.
 *
 * Search covers each entry's title, excerpt, topics, names and media descriptions at once, and every word of every
 * post and article as soon as the full-text index arrives (it loads when the search box is first used).
 *
 * Server HTML: the sidebar and the first page of cards render with no filter applied, every card is a plain link,
 * and every topic row links to its page, so the archive works without JavaScript (the Universe needs it, and WebGL).
 */

/** The Universe's size before it loads (its one-row toolbar, 25px buttons plus an 8px gap = 33px, then its box), so
 *  mounting it never shifts the page. Keep in step with the toolbar and box in LinkedInUniverse.tsx. */
const UNIVERSE_BOX = "w-full aspect-[16/10] min-h-[520px] max-h-[85vh]";
// The Universe (three.js) loads as its own chunk, in the browser only; topic pages never ship it.
const LinkedInUniverse = dynamic(() => import("./LinkedInUniverse"), {
  ssr: false,
  loading: () => (
    <div className="li-js pt-[33px]" aria-hidden="true">
      <div className={`${UNIVERSE_BOX} grid place-items-center border border-border bg-background`}>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Loading the Universe…</p>
      </div>
    </div>
  ),
});

type SortOrder = "newest" | "engaging";
/** The sidebar's last row: entries with no topic (one-line replies and reshares). */
const NONE = "_none";
const PAGE = 60;

interface Props {
  /** Topic pages: only this topic's entries, without the Universe or the sidebar. */
  topicId?: string;
}

/** A plain left click; modified clicks keep the browser's own behaviour (new tab, etc.). */
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
/** Controls that only work with JavaScript are hidden when scripts are blocked; the sidebar always shows. */
const NOSCRIPT_STYLE = { __html: "<style>.li-js{display:none!important}.li-tree{display:block!important}</style>" };
const newestFirst = (a: LiEntry, b: LiEntry) => b.date.localeCompare(a.date);

export default function LinkedInExplorer({ topicId }: Props) {
  const scoped = !!topicId;
  const entries = React.useMemo(() => (topicId ? LINKEDIN_ENTRIES.filter((e) => inTopic(e, topicId)) : LINKEDIN_ENTRIES).slice().sort(newestFirst), [topicId]);
  const entriesByKey = React.useMemo(() => new Map(LINKEDIN_ENTRIES.map((e) => [e.key, e])), []);
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [source, setSource] = React.useState<SourceFilter>("all");
  const sources = React.useMemo(() => sourceCounts(entries), [entries]);
  const [year, setYear] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortOrder>("newest");
  const [shown, setShown] = React.useState(PAGE);
  const [open, setOpen] = React.useState<{ key: string; idx?: string } | null>(null);
  const [treeOpen, setTreeOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Full text: loaded once, on first use of the search box.
  const { fullText, load: loadFullText } = useFullText();
  React.useEffect(() => {
    if (query.trim()) loadFullText();
  }, [query, loadFullText]);

  const haystack = React.useMemo(() => new Map(entries.map((e) => [e.key, entryHaystack(e, fullText)])), [entries, fullText]);

  const matcher = React.useMemo(() => compileQuery(query), [query]);
  // Everything but the topic: the sidebar counts follow the search, the kind and the year.
  const beforeTopic = React.useMemo(
    () =>
      entries.filter((e) => {
        if (!hasKind(e, kind)) return false;
        if (source !== "all" && e.source !== source) return false;
        if (year && !e.date.startsWith(year)) return false;
        if (!matcher) return true;
        const h = haystack.get(e.key);
        return !!h && matcher(h);
      }),
    [entries, kind, source, year, matcher, haystack],
  );
  const filtered = React.useMemo(() => {
    const list = !topic || scoped ? beforeTopic : topic === NONE ? beforeTopic.filter((e) => !e.topics.length) : beforeTopic.filter((e) => inTopic(e, topic));
    return sort === "engaging" ? [...list].sort((a, b) => (b.engagement?.reactions ?? -1) - (a.engagement?.reactions ?? -1) || newestFirst(a, b)) : list;
  }, [beforeTopic, topic, scoped, sort]);
  const filterActive = kind !== "all" || source !== "all" || !!year || !!matcher || (!!topic && !scoped);
  const matching = React.useMemo(() => (filterActive ? new Set(filtered.map((e) => e.key)) : null), [filterActive, filtered]);
  // The Universe (about 1,000 stars) follows the typing at its own pace, so the search box stays responsive.
  const graphMatching = React.useDeferredValue(matching);
  // The Universe's Topics menu counts within the search and filters, whatever the topic.
  const nonTopicActive = kind !== "all" || source !== "all" || !!year || !!matcher;
  const countIn = React.useDeferredValue(React.useMemo(() => (nonTopicActive ? new Set(beforeTopic.map((e) => e.key)) : null), [nonTopicActive, beforeTopic]));

  const treeCounts = React.useMemo(() => topicCounts(beforeTopic), [beforeTopic]);
  const unsorted = React.useMemo(() => beforeTopic.filter((e) => !e.topics.length).length, [beforeTopic]);
  const kindCounts = React.useMemo(() => {
    const c = Object.fromEntries(KIND_FILTERS.map((k) => [k.id, 0])) as Record<KindFilter, number>;
    for (const e of entries) for (const k of KIND_FILTERS) if (hasKind(e, k.id)) c[k.id]++;
    return c;
  }, [entries]);
  const years = React.useMemo(() => [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort().reverse(), [entries]);

  // New filters start the list from the top (the Universe flies to what they match on its own).
  const signature = `${query.trim()}|${kind}|${source}|${year}|${topic}`;
  React.useEffect(() => setShown(PAGE), [signature]);

  // Screen readers hear the result count once typing pauses, not on every keystroke (and not on page load).
  const [announce, setAnnounce] = React.useState("");
  const countText = `${filtered.length} of ${entries.length} posts, articles and media`;
  const firstCount = React.useRef(true);
  React.useEffect(() => {
    if (firstCount.current) {
      firstCount.current = false;
      return;
    }
    const t = window.setTimeout(() => setAnnounce(countText), 700);
    return () => window.clearTimeout(t);
  }, [countText]);

  const selectTopic = React.useCallback((id: string | null) => setTopic(id), []);
  const resetAll = () => {
    setQuery("");
    setKind("all");
    setSource("all");
    setYear(null);
    if (!scoped) setTopic(null);
  };

  const openEntry = open ? entriesByKey.get(open.key) ?? null : null;
  const openPos = openEntry ? filtered.findIndex((e) => e.key === openEntry.key) : -1;
  const step = (d: number) => {
    if (openPos < 0 || !filtered.length) return;
    setOpen({ key: filtered[(openPos + d + filtered.length) % filtered.length].key });
  };
  const openFromGraph = React.useCallback((key: string, idx?: string) => setOpen({ key, idx }), []);

  const chip = (on: boolean) =>
    `font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border transition-colors ${
      on ? "border-foreground text-foreground bg-foreground/[0.06]" : "border-border text-muted-foreground/70 hover:text-foreground hover:border-foreground/40"
    }`;
  const activeNode = topic && topic !== NONE ? getTopic(topic) : undefined;

  return (
    <div className={mounted ? "li-js-on" : ""} data-testid="linkedin-explorer">
      <noscript dangerouslySetInnerHTML={NOSCRIPT_STYLE} />
      <div className={scoped ? "" : "lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8"}>
        {!scoped && (
          <aside className="mb-6 lg:mb-0" aria-label="Browse by topic">
            <button
              type="button"
              onClick={() => setTreeOpen((o) => !o)}
              aria-expanded={treeOpen}
              className="li-js lg:hidden w-full flex items-center justify-between border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground"
            >
              <span>Browse by topic{activeNode ? `: ${activeNode.label}` : topic === NONE ? ": no topic" : ""}</span>
              <span aria-hidden="true">{treeOpen ? "▴" : "▾"}</span>
            </button>
            <div className={`li-tree ${treeOpen ? "block" : "hidden"} mt-2 lg:mt-0 lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2`}>
              <TopicTree counts={treeCounts} active={topic} mode="filter" onSelect={selectTopic} total={beforeTopic.length} extra={{ id: NONE, label: "No topic (replies, reshares)", count: unsorted }} />
            </div>
          </aside>
        )}

        <div className="min-w-0">
          {/* Controls (JS only) */}
          <ArchiveFilters
            query={query}
            onQuery={setQuery}
            onSearchFocus={loadFullText}
            kind={kind}
            onKind={setKind}
            kindCounts={kindCounts}
            source={source}
            onSource={setSource}
            sources={sources}
            year={year}
            onYear={setYear}
            years={years}
            testIds
          />

          {activeNode && !scoped && <ActiveTopic id={activeNode.id} count={filtered.length} onSelect={selectTopic} />}

          {!scoped && (
            <section className="mb-10" aria-labelledby="li-graph-h">
              <h2 id="li-graph-h" className="sr-only">The Universe, in 3D</h2>
              <LinkedInUniverse
                matching={graphMatching}
                activeTopic={activeNode?.id ?? null}
                onTopic={selectTopic}
                onOpenEntry={openFromGraph}
                countIn={countIn}
                help={false}
                filters={
                  <ArchiveFilters
                    compact
                    query={query}
                    onQuery={setQuery}
                    onSearchFocus={loadFullText}
                    kind={kind}
                    onKind={setKind}
                    kindCounts={kindCounts}
                    source={source}
                    onSource={setSource}
                    sources={sources}
                    year={year}
                    onYear={setYear}
                    years={years}
                  />
                }
              />
              {/* server-rendered, so the cards below sit where they will stay when the 3D view arrives */}
              <UniverseHelp />
              <noscript>
                <p className="font-mono text-[11px] text-muted-foreground">The 3D Universe needs JavaScript. Every post, article and image is listed below and in the topics.</p>
              </noscript>
            </section>
          )}

          {/* Result line */}
          <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            <span data-testid="linkedin-count">
              {filtered.length} of {entries.length} posts, articles and media
              {query.trim() && !fullText ? " · loading full text…" : ""}
            </span>
            {topic === NONE && (
              <span className="inline-flex items-center gap-2 border border-foreground/40 px-2 py-1 text-foreground">
                No topic
                <button type="button" onClick={() => setTopic(null)} className="underline text-muted-foreground hover:text-foreground">clear</button>
              </span>
            )}
            {filterActive && (
              <button type="button" onClick={resetAll} className="li-js underline hover:text-foreground">
                Reset all
              </button>
            )}
            <span className="li-js ml-auto inline-flex items-center gap-1.5">
              Sort
              {(["newest", "engaging"] as SortOrder[]).map((s) => (
                <button key={s} type="button" onClick={() => setSort(s)} aria-pressed={sort === s} className={`px-2 py-1 border ${sort === s ? "border-foreground text-foreground" : "border-border hover:text-foreground"}`}>
                  {s === "newest" ? "Newest" : "Most reactions"}
                </button>
              ))}
            </span>
          </div>

          {/* Cards */}
          <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3" data-testid="linkedin-grid">
            {filtered.slice(0, shown).map((e) => (
              <li key={e.key}>
                <EntryCard entry={e} onOpen={() => setOpen({ key: e.key })} />
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p className="font-mono text-sm text-muted-foreground py-10 text-center">Nothing matches. Try fewer words or reset the filters.</p>
          )}
          {filtered.length > shown && (
            <div className="li-js mt-5 flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => setShown((n) => n + PAGE)} className={chip(false)} data-testid="linkedin-more">
                Show {Math.min(PAGE, filtered.length - shown)} more
              </button>
              <button type="button" onClick={() => setShown(filtered.length)} className={chip(false)}>
                Show all {filtered.length}
              </button>
            </div>
          )}
          {entries.length > PAGE && (
          <noscript>
            <p className="mt-5 font-mono text-[11px] text-muted-foreground text-center">
              The newest {Math.min(PAGE, filtered.length)} are shown here.{" "}
              {scoped ? (
                "The full list follows."
              ) : (
                <>
                  <a href={LINKEDIN_POSTS_PATH} className="underline">Every LinkedIn post, by year</a>, and each topic page in the sidebar list the rest.
                </>
              )}
            </p>
          </noscript>
          )}

          <span className="sr-only" aria-live="polite">
            {announce}
          </span>

          <Viewer
            entry={openEntry}
            request={open}
            onClose={() => setOpen(null)}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            position={openPos}
            total={filtered.length}
          />
        </div>
      </div>
    </div>
  );
}

/** The topic picked in the sidebar: where it sits in the tree, what it covers, and its page. */
function ActiveTopic({ id, count, onSelect }: { id: string; count: number; onSelect: (id: string | null) => void }) {
  const trail = topicTrail(id);
  const t = trail[trail.length - 1];
  return (
    <div className="mb-6 border border-foreground/40 p-4" data-testid="linkedin-active-topic">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Topic path" className="flex flex-wrap items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {trail.map((n, k) => (
              <React.Fragment key={n.id}>
                {k > 0 && <span aria-hidden="true">›</span>}
                {k < trail.length - 1 ? (
                  <button type="button" onClick={() => onSelect(n.id)} className="underline decoration-dotted underline-offset-2 hover:text-foreground">
                    {n.label}
                  </button>
                ) : (
                  <span className="text-foreground">{n.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">{t.label}</h2>
          {t.description && <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground max-w-2xl">{t.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={topicPath(t.id)} className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
            Its page
          </a>
          <button type="button" onClick={() => onSelect(null)} className="font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-border text-muted-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {count} shown below and lit in the graph
      </p>
    </div>
  );
}

function EntryCard({ entry, onOpen }: { entry: LiEntry; onOpen: () => void }) {
  const media = mediaOf(entry);
  const cover = media[0];
  const main = entry.topics[0];
  const area = main ? getTopic(main)?.parent : undefined;
  const r = entry.engagement;
  const isMedia = entry.kind === "media";
  return (
    <a
      href={entryPath(entry)}
      {...(isMedia ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        e.preventDefault();
        onOpen();
      }}
      className="group flex flex-col h-full border border-border hover:border-foreground/50 transition-colors"
      data-testid={`linkedin-card-${entry.key}`}
    >
      {cover ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl(cover)}
            alt=""
            loading="lazy"
            decoding="async"
            width={480}
            height={Math.round((480 * (cover.height || 3)) / (cover.width || 4))}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
          {cover.kind === "video" && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="w-10 h-10 rounded-full bg-black/70 text-white grid place-items-center text-sm" aria-hidden>▶</span>
            </span>
          )}
          <span className="absolute top-1.5 left-1.5 font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-black/75 text-white">
            {entryKindLabel(entry)}
            {cover.kind === "video" && cover.duration ? ` · ${formatDuration(cover.duration)}` : ""}
          </span>
          {media.length > 1 && (
            <span className="absolute top-1.5 right-1.5 font-mono text-[9px] px-1.5 py-0.5 bg-black/75 text-white">+{media.length - 1}</span>
          )}
          {entry.review && (
            <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-amber-300 text-black">Pending review</span>
          )}
        </div>
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-foreground/[0.03] p-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 border border-border text-muted-foreground">{entryKindLabel(entry)}</span>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-foreground/80 line-clamp-6">{entry.excerpt || entry.title}</p>
        </div>
      )}
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-1" data-testid="linkedin-card-source">
          {SOURCE_LABEL[entry.source]} · {formatDay(entry.date)}
        </p>
        <p className="font-mono text-[11px] leading-snug text-foreground line-clamp-3">{entry.title}</p>
        {r && (r.reactions != null || r.comments != null) && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {[r.reactions != null ? `${r.reactions.toLocaleString("en-US")} reactions` : "", r.comments ? `${r.comments.toLocaleString("en-US")} comments` : ""].filter(Boolean).join(" · ")}
          </p>
        )}
        {main && (
          <p className="mt-auto pt-1.5 font-mono text-[10px] leading-snug text-muted-foreground/80 truncate">
            {area ? `${topicLabel(area)} › ` : ""}
            {topicLabel(main)}
          </p>
        )}
      </div>
    </a>
  );
}

function Viewer({
  entry,
  request,
  onClose,
  onPrev,
  onNext,
  position,
  total,
}: {
  entry: LiEntry | null;
  /** The open request (a new object each time a card, node or arrow opens an entry), with the media to start at. */
  request: { key: string; idx?: string } | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  position: number;
  total: number;
}) {
  // Keep the last entry while the dialog animates closed, so it never flashes empty.
  const last = React.useRef<LiEntry | null>(null);
  if (entry) last.current = entry;
  const shown = entry ?? last.current;
  const media = React.useMemo(() => (shown ? mediaOf(shown) : []), [shown]);
  const commentSet = React.useMemo(() => new Set(shown?.commentMedia ?? []), [shown]);
  // Each open request starts at its media item (or the first), decided while rendering so no frame shows the
  // previous entry's position.
  const [sel, setSel] = React.useState<{ req: typeof request; mi: number }>({ req: null, mi: 0 });
  let mi = sel.mi;
  if (request && request !== sel.req) {
    const k = request.idx && entry ? mediaOf(entry).findIndex((m) => m.idx === request.idx) : 0;
    mi = k < 0 ? 0 : k;
    setSel({ req: request, mi });
  }
  const setMi = (k: number) => setSel((v) => ({ ...v, mi: k }));
  const it = media[mi];

  React.useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if ((e.target as Element | null)?.closest?.("video, input, textarea, select")) return; // let video seeking and typing work
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entry, onPrev, onNext]);

  const BTN = "font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border text-center transition-colors";
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`${media.length ? "max-w-5xl" : "max-w-2xl"} w-[95vw] p-0 gap-0 rounded-none sm:rounded-none border-border`}>
        {shown && (
          <div className={`${media.length ? "grid md:grid-cols-[1fr_340px]" : ""} max-h-[90vh] overflow-y-auto md:overflow-hidden`}>
            {it && (
              <div className="flex flex-col bg-black min-h-[200px]">
                <div className="flex-1 flex items-center justify-center max-h-[55vh] md:max-h-[80vh]">
                  {it.kind === "video" ? (
                    <video key={it.idx} src={fullUrl(it)} poster={posterUrl(it.idx)} controls autoPlay playsInline className="max-h-[55vh] md:max-h-[80vh] w-full" />
                  ) : (
                    // The thumbnail shows at once (as the background, in the image's own shape); the full image paints over it.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={it.idx}
                      src={it.kind === "document" ? thumbUrl(it) : fullUrl(it)}
                      alt={it.description}
                      width={it.width || undefined}
                      height={it.height || undefined}
                      className="max-h-[55vh] md:max-h-[80vh] h-auto max-w-full object-contain"
                      style={{ background: `url("${thumbUrl(it)}") center / contain no-repeat` }}
                      onLoad={(ev) => (ev.currentTarget.style.background = "none")}
                    />
                  )}
                </div>
                {media.length > 1 && (
                  <ul className="flex gap-1 overflow-x-auto p-1.5 bg-black/90" aria-label="Media in it">
                    {media.map((m, k) => (
                      <li key={m.idx} className="shrink-0">
                        <button type="button" onClick={() => setMi(k)} aria-pressed={k === mi} aria-label={`${KIND_LABEL[m.kind]} ${k + 1} of ${media.length}${commentSet.has(m.idx) ? ", from my comment" : ""}`} className={`relative block w-14 h-14 border ${k === mi ? "border-white" : "border-white/20 hover:border-white/60"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbUrl(m)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          {m.kind === "video" && <span className="absolute bottom-0 right-0 font-mono text-[8px] px-0.5 bg-black/80 text-white" aria-hidden="true">▶</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className={`p-5 ${media.length ? "md:overflow-y-auto md:max-h-[88vh] border-t md:border-t-0 md:border-l border-border" : ""}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                {SOURCE_LABEL[shown.source]} {entryKindLabel(shown).toLowerCase()} · {shown.date.length > 10 ? formatDateTime(shown.date) : formatDay(shown.date)}
              </p>
              <DialogTitle className="font-display text-lg font-bold text-foreground leading-snug mb-3">{shown.title}</DialogTitle>
              <DialogDescription className="sr-only">
                {entryKindLabel(shown)} from Venkata Pagadala&apos;s LinkedIn, {formatDay(shown.date)}.
              </DialogDescription>
              {shown.kind !== "media" && shown.excerpt && <p className="font-mono text-[11px] leading-relaxed text-muted-foreground mb-3">{shown.excerpt}</p>}
              {engagementLine(shown) && <p className="font-mono text-[10px] leading-relaxed text-foreground mb-4" data-testid="linkedin-viewer-engagement">{engagementLine(shown)}</p>}
              {it && media.length > 0 && (
                <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/80 mb-4">
                  {media.length > 1 ? `${mi + 1} of ${media.length} · ` : ""}
                  {commentSet.has(it.idx) ? "From my comment · " : ""}
                  {it.kind === "video" && it.duration ? `${formatDuration(it.duration)} · ` : ""}
                  {shown.kind === "media" ? it.label : it.description}
                </p>
              )}
              {shown.topics.length > 0 && (
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">Topics</p>
                  <div className="flex flex-col gap-1">
                    {shown.topics.map((t) => {
                      const area = getTopic(t)?.parent;
                      const subs = shown.subtopics.filter((s) => getTopic(s)?.parent === t);
                      return (
                        <p key={t} className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                          {area && <a href={topicPath(area)} className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">{topicLabel(area)} ›</a>}
                          <a href={topicPath(t)} className="px-2 py-0.5 border border-border text-foreground hover:border-foreground/50">{topicLabel(t)}</a>
                          {subs.map((s) => (
                            <a key={s} href={topicPath(s)} className="px-2 py-0.5 border border-border text-muted-foreground hover:text-foreground">⬡ {topicLabel(s)}</a>
                          ))}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
              {shown.names.length > 0 && (
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">Names in it</p>
                  <p className="font-mono text-[11px] text-foreground/90 leading-relaxed">{shown.names.join(" · ")}</p>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-5">
                {shown.kind !== "media" && (
                  <a href={entryPath(shown)} className={`${BTN} border-foreground text-foreground hover:bg-foreground hover:text-background`} data-testid="linkedin-viewer-read">
                    Read it here
                  </a>
                )}
                {it && (
                  <a href={fullUrl(it)} target="_blank" rel="noopener noreferrer" className={`${BTN} ${shown.kind === "media" ? "border-foreground text-foreground hover:bg-foreground hover:text-background" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"}`}>
                    {it.kind === "document" ? `Open ${(it.docExt ?? "pdf").toUpperCase()}` : it.kind === "video" ? "Open video file" : "Open full image"}
                  </a>
                )}
                {shown.url && (
                  <a href={shown.url} target="_blank" rel="noopener noreferrer" className={`${BTN} border-border text-muted-foreground hover:text-foreground hover:border-foreground/50`}>
                    See it on LinkedIn ↗
                  </a>
                )}
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
