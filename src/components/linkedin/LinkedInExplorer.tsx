"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import TopicTree from "./TopicTree";
import type { FocusRequest } from "./LinkedInGraph";
import {
  KIND_LABEL,
  LINKEDIN_ENTRIES,
  engagementLine,
  entryPath,
  formatDateTime,
  formatDay,
  formatDuration,
  fullUrl,
  getItem,
  getTopic,
  inTopic,
  posterUrl,
  thumbUrl,
  topicCounts,
  topicLabel,
  topicPath,
  topicTrail,
  type LiEntry,
  type LiItem,
  type LiKind,
} from "@/data/linkedinArchive";

/**
 * The archive hub: the topic tree as a sidebar, search and filters, the knowledge graph and every post, article and
 * standalone media item as a card, all sharing one state. Whatever you search, filter or pick in the sidebar lights
 * up in the graph, and the graph zooms to it.
 *
 * Search covers each entry's title, excerpt, topics, names and media descriptions at once, and every word of every
 * post and article as soon as the full-text index arrives (it loads when the search box is first used).
 *
 * Server HTML: the sidebar, the graph and the first page of cards render with no filter applied, every card and
 * node is a plain link, and every topic row links to its page, so the archive works without JavaScript.
 */

// The graph and its data load as their own chunk (still server-rendered), so topic pages never ship them.
const LinkedInGraph = dynamic(() => import("./LinkedInGraph"));

type KindFilter = "all" | "post" | "article" | LiKind;
type SortOrder = "newest" | "engaging";
const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "post", label: "Posts" },
  { id: "article", label: "Articles" },
  { id: "video", label: "Videos" },
  { id: "image", label: "Images" },
  { id: "document", label: "Documents" },
];
/** The sidebar's last row: entries with no topic (one-line replies and reshares). */
const NONE = "_none";
const PAGE = 60;

interface Props {
  /** Topic pages: only this topic's entries, without the graph or the sidebar. */
  topicId?: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const squash = (s: string) => s.replace(/[^a-z0-9]+/g, "");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Each search word must match at the start of a word ("graph" finds "graphs", "search" does not find "research",
 * "ai" does not find "said"); punctuation around a word is ignored ("seo," is "seo"). Words of five or more letters
 * also match with spaces and punctuation between their letters, still from a word start, so "seoweek" finds
 * "SEO Week"; and a multi-word query also matches run together ("knowledge graph" finds "#KnowledgeGraph").
 * Returns null for an empty query.
 */
function compileQuery(q: string): ((text: string) => boolean) | null {
  const terms = norm(q)
    .split(/\s+/)
    .map((t) => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter(Boolean);
  if (!terms.length) return null;
  const START = "(?:^|[^a-z0-9])";
  const loose = (sq: string) => new RegExp(START + sq.split("").map(escapeRe).join("[^a-z0-9]*"));
  const each = terms.map((t) => {
    const exact = new RegExp(START + escapeRe(t));
    const sq = squash(t);
    const flex = sq.length >= 5 ? loose(sq) : null;
    return (text: string) => exact.test(text) || (!!flex && flex.test(text));
  });
  const joined = squash(terms.join(""));
  const whole = terms.length > 1 && joined.length >= 5 ? loose(joined) : null;
  return (text) => each.every((m) => m(text)) || (!!whole && whole.test(text));
}
/** A plain left click; modified clicks keep the browser's own behaviour (new tab, etc.). */
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
/** Controls that only work with JavaScript are hidden when scripts are blocked; the sidebar always shows. */
const NOSCRIPT_STYLE = { __html: "<style>.li-js{display:none!important}.li-tree{display:block!important}</style>" };
const entryKindLabel = (e: LiEntry) => (e.kind === "article" ? "Article" : e.kind === "post" ? "Post" : KIND_LABEL[getItem(e.id)?.kind ?? "image"]);
const mediaOf = (e: LiEntry) => [...e.media, ...(e.commentMedia ?? [])].map(getItem).filter((x): x is LiItem => !!x);
const hasKind = (e: LiEntry, k: KindFilter) =>
  k === "all" ? true : k === "post" || k === "article" ? e.kind === k : e.media.some((m) => getItem(m)?.kind === k);
const newestFirst = (a: LiEntry, b: LiEntry) => b.date.localeCompare(a.date);

export default function LinkedInExplorer({ topicId }: Props) {
  const scoped = !!topicId;
  const entries = React.useMemo(() => (topicId ? LINKEDIN_ENTRIES.filter((e) => inTopic(e, topicId)) : LINKEDIN_ENTRIES).slice().sort(newestFirst), [topicId]);
  const entriesByKey = React.useMemo(() => new Map(LINKEDIN_ENTRIES.map((e) => [e.key, e])), []);
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [year, setYear] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortOrder>("newest");
  const [shown, setShown] = React.useState(PAGE);
  const [open, setOpen] = React.useState<{ key: string; idx?: string } | null>(null);
  const [focus, setFocus] = React.useState<FocusRequest | null>(null);
  const [treeOpen, setTreeOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Full text: loaded once, on first use of the search box.
  const [fullText, setFullText] = React.useState<Record<string, string> | null>(null);
  const loading = React.useRef(false);
  const loadFullText = React.useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    import("@/data/linkedinSearchData")
      .then((m) => setFullText(m.LINKEDIN_SEARCH_TEXT))
      .catch(() => (loading.current = false));
  }, []);
  React.useEffect(() => {
    if (query.trim()) loadFullText();
  }, [query, loadFullText]);

  const haystack = React.useMemo(
    () =>
      new Map(
        entries.map((e) => {
          const areas = [...new Set(e.topics.map((t) => getTopic(t)?.parent).filter(Boolean) as string[])];
          const text = norm(
            [
              e.title,
              e.excerpt,
              entryKindLabel(e),
              e.date.slice(0, 10),
              ...areas.map(topicLabel),
              ...e.topics.map(topicLabel),
              ...e.subtopics.map(topicLabel),
              ...e.names,
              ...mediaOf(e).map((it) => `${it.description} ${it.label} ${it.entities.join(" ")} ${KIND_LABEL[it.kind]}`),
              fullText?.[e.key] ?? "",
            ].join(" "),
          );
          return [e.key, text];
        }),
      ),
    [entries, fullText],
  );

  const matcher = React.useMemo(() => compileQuery(query), [query]);
  // Everything but the topic: the sidebar counts follow the search, the kind and the year.
  const beforeTopic = React.useMemo(
    () =>
      entries.filter((e) => {
        if (!hasKind(e, kind)) return false;
        if (year && !e.date.startsWith(year)) return false;
        if (!matcher) return true;
        const h = haystack.get(e.key);
        return !!h && matcher(h);
      }),
    [entries, kind, year, matcher, haystack],
  );
  const filtered = React.useMemo(() => {
    const list = !topic || scoped ? beforeTopic : topic === NONE ? beforeTopic.filter((e) => !e.topics.length) : beforeTopic.filter((e) => inTopic(e, topic));
    return sort === "engaging" ? [...list].sort((a, b) => (b.engagement?.reactions ?? -1) - (a.engagement?.reactions ?? -1) || newestFirst(a, b)) : list;
  }, [beforeTopic, topic, scoped, sort]);
  const filterActive = kind !== "all" || !!year || !!matcher || (!!topic && !scoped);
  const matching = React.useMemo(() => (filterActive ? new Set(filtered.map((e) => e.key)) : null), [filterActive, filtered]);
  // The graph (about 1,100 nodes) follows the typing at its own pace, so the search box stays responsive.
  const graphMatching = React.useDeferredValue(matching);

  const treeCounts = React.useMemo(() => topicCounts(beforeTopic), [beforeTopic]);
  const unsorted = React.useMemo(() => beforeTopic.filter((e) => !e.topics.length).length, [beforeTopic]);
  const kindCounts = React.useMemo(() => {
    const c = Object.fromEntries(KIND_FILTERS.map((k) => [k.id, 0])) as Record<KindFilter, number>;
    for (const e of entries) for (const k of KIND_FILTERS) if (hasKind(e, k.id)) c[k.id]++;
    return c;
  }, [entries]);
  const years = React.useMemo(() => [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort().reverse(), [entries]);

  // New filters start the list from the top, and ask the graph to zoom to what they match.
  const signature = `${query.trim()}|${kind}|${year}|${topic}|${query.trim() && fullText ? 1 : 0}`;
  const firstSig = React.useRef(signature);
  React.useEffect(() => {
    setShown(PAGE);
    if (scoped || signature === firstSig.current) return;
    firstSig.current = "";
    const onlyTopic = !!topic && topic !== NONE && !matcher && kind === "all" && !year;
    const t = window.setTimeout(
      () => setFocus((f) => ({ kind: onlyTopic ? "topic" : filterActive ? "matches" : "all", id: onlyTopic ? topic! : undefined, nonce: (f?.nonce ?? 0) + 1 })),
      query.trim() ? 350 : 0,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

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
          <div className="li-js flex flex-wrap items-center gap-2 mb-3">
            <label className="flex items-center gap-2 flex-1 min-w-[240px] border border-border px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Search</span>
              <input
                type="search"
                value={query}
                onFocus={loadFullText}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="seoweek, knowledge graph, Claude, Search Console…"
                className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
                data-testid="linkedin-search"
              />
            </label>
          </div>
          <div className="li-js flex flex-wrap items-center gap-1.5 mb-3">
            {KIND_FILTERS.map((k) =>
              kindCounts[k.id] || k.id === "all" ? (
                <button key={k.id} type="button" onClick={() => setKind(k.id)} aria-pressed={kind === k.id} className={chip(kind === k.id)} data-testid={`linkedin-kind-${k.id}`}>
                  {k.label} · {kindCounts[k.id]}
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

          {activeNode && !scoped && <ActiveTopic id={activeNode.id} count={filtered.length} onSelect={selectTopic} />}

          {!scoped && (
            <section className="mb-10" aria-labelledby="li-graph-h">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                <h2 id="li-graph-h" className="font-display text-xl font-bold text-foreground">The knowledge graph</h2>
                <Legend />
              </div>
              <LinkedInGraph
                entriesByKey={entriesByKey}
                matching={graphMatching}
                activeTopic={activeNode?.id ?? null}
                focus={focus}
                onTopic={selectTopic}
                onOpenEntry={openFromGraph}
                query={query}
                onQuery={setQuery}
              />
              <p className="li-js mt-3 font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
                Five views: 01 Topics (each area a region; each topic a flower of its posts, with its subtopics around it and
                the tree drawn as lines; drag an area or a topic, anywhere inside its circle, to move it), 02 Timeline (one lane per area; press Grow to
                replay it), 03 Map (similar posts together, outliers at the edge), 04 Story (an animated tour: every post
                gathers around one centre, then the top posts play as a slideshow; Reel 9:16 frames it for Instagram) and 05 Universe
                (a 3D galaxy of every post: fly into a topic, lock on to a star, open its post). Search, or pick a topic in the sidebar,
                and the graph lights and zooms to what matches. Hover anything to preview what it connects to; click it to pin
                it and walk the graph from its panel. Esc, ✕ or a click on empty space unpins. Zoom with the buttons or Ctrl/⌘
                and scroll, then drag to move.
              </p>
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
                  <a href="/linkedin/posts" className="underline">Every post, by year</a>, and each topic page in the sidebar list the rest.
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

function Legend() {
  const sq = "inline-block w-2.5 h-2.5 border";
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
      <li className="inline-flex items-center gap-1.5"><b className="text-foreground">AREA</b></li>
      <li className="inline-flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-full border border-foreground" /> Topic</li>
      <li className="inline-flex items-center gap-1.5">
        <svg viewBox="-4 -4 8 8" className="w-2.5 h-2.5" aria-hidden="true"><path d="M -3.6 0 L -1.8 -3.1 L 1.8 -3.1 L 3.6 0 L 1.8 3.1 L -1.8 3.1 Z" className="fill-background stroke-foreground" strokeWidth={0.9} /></svg> Subtopic
      </li>
      <li className="inline-flex items-center gap-1.5"><i className="inline-block w-2 h-2 rotate-45 bg-sky-600 dark:bg-sky-300" /> Name (Map)</li>
      <li className="inline-flex items-center gap-1.5">
        <svg viewBox="-5 -6 10 12" className="w-2.5 h-3" aria-hidden="true"><path d="M -4.5 -5.5 H 2 L 4.5 -3 V 5.5 H -4.5 Z M 2 -5.5 V -3 H 4.5" className="fill-background stroke-foreground" strokeWidth={1.2} /></svg> Article
      </li>
      <li className="inline-flex items-center gap-1.5"><i className={`${sq} border-border bg-muted-foreground/40`} /> Post with media</li>
      <li className="inline-flex items-center gap-1.5"><i className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Text post</li>
      <li className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300"><i className={`${sq} border-rose-600 dark:border-rose-300`} /> Video</li>
      <li className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300"><i className={`${sq} border-amber-600 dark:border-amber-300`} /> Document</li>
    </ul>
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
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">{formatDay(entry.date)}</p>
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
                {entryKindLabel(shown)} · {shown.date.length > 10 ? formatDateTime(shown.date) : formatDay(shown.date)}
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
