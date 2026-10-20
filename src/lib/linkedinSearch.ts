/**
 * Search and filters for the LinkedIn archive, shared by the archive hub (LinkedInExplorer) and the home page's
 * Universe section, so both find exactly the same posts.
 *
 * Search covers an entry's title, excerpt, topics (with their area), names and media captions, plus every word of
 * the post when the full-text index (linkedinSearchData, loaded on first use) has arrived.
 */
import * as React from "react";
import { KIND_LABEL, SOURCES, SOURCE_LABEL, getItem, getTopic, inTopic, topicLabel, type LiEntry, type LiItem, type LiKind, type LiSource } from "@/data/linkedinArchive";

export type KindFilter = "all" | "post" | "article" | LiKind;
export const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "post", label: "Posts" },
  { id: "article", label: "Articles" },
  { id: "video", label: "Videos" },
  { id: "image", label: "Images" },
  { id: "document", label: "Documents" },
];

/** The source filter: one source, or all of them. */
export type SourceFilter = "all" | LiSource;
/** Entries per source, for the filter (only sources with entries are offered). */
export function sourceCounts(entries: LiEntry[]) {
  const c = new Map<LiSource, number>();
  for (const e of entries) c.set(e.source, (c.get(e.source) ?? 0) + 1);
  return SOURCES.filter((s) => c.get(s)).map((s) => ({ id: s, label: SOURCE_LABEL[s], count: c.get(s)! }));
}

export const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
export const squash = (s: string) => s.replace(/[^a-z0-9]+/g, "");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Each search word must match at the start of a word ("graph" finds "graphs", "search" does not find "research",
 * "ai" does not find "said"); punctuation around a word is ignored ("seo," is "seo"). Words of five or more letters
 * also match with spaces and punctuation between their letters, still from a word start, so "seoweek" finds
 * "SEO Week"; and a multi-word query also matches run together ("knowledge graph" finds "#KnowledgeGraph").
 * Returns null for an empty query.
 */
export function compileQuery(q: string): ((text: string) => boolean) | null {
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

export const entryKindLabel = (e: LiEntry) => (e.kind === "article" ? "Article" : e.kind === "post" ? "Post" : KIND_LABEL[getItem(e.id)?.kind ?? "image"]);
export const mediaOf = (e: LiEntry) => [...e.media, ...(e.commentMedia ?? [])].map(getItem).filter((x): x is LiItem => !!x);
export const hasKind = (e: LiEntry, k: KindFilter) =>
  k === "all" ? true : k === "post" || k === "article" ? e.kind === k : e.media.some((m) => getItem(m)?.kind === k);

/** The searchable text of one entry (normalized). */
export function entryHaystack(e: LiEntry, fullText?: Record<string, string> | null) {
  const areas = [...new Set(e.topics.map((t) => getTopic(t)?.parent).filter(Boolean) as string[])];
  return norm(
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
}

/** The full-text index, loaded once on demand. */
export function useFullText() {
  const [fullText, setFullText] = React.useState<Record<string, string> | null>(null);
  const loading = React.useRef(false);
  const load = React.useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    import("@/data/linkedinSearchData")
      .then((m) => setFullText(m.LINKEDIN_SEARCH_TEXT))
      .catch(() => (loading.current = false));
  }, []);
  return { fullText, load };
}

/**
 * Search, kind, year and topic over a list of entries: the state, and the keys that match (null when nothing is
 * filtered). Used where there is no archive hub around (the home page's Universe).
 */
export function useArchiveFilter(entries: LiEntry[]) {
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [source, setSource] = React.useState<SourceFilter>("all");
  const [year, setYear] = React.useState<string | null>(null);
  const [topic, setTopic] = React.useState<string | null>(null);
  const { fullText, load } = useFullText();
  React.useEffect(() => {
    if (query.trim()) load();
  }, [query, load]);
  const haystack = React.useMemo(() => new Map(entries.map((e) => [e.key, entryHaystack(e, fullText)])), [entries, fullText]);
  const matcher = React.useMemo(() => compileQuery(query), [query]);
  const active = kind !== "all" || source !== "all" || !!year || !!matcher || !!topic;
  const matching = React.useMemo(() => {
    if (!active) return null;
    return new Set(
      entries
        .filter(
          (e) =>
            hasKind(e, kind) &&
            (source === "all" || e.source === source) &&
            (!year || e.date.startsWith(year)) &&
            (!topic || inTopic(e, topic)) &&
            (!matcher || matcher(haystack.get(e.key) ?? "")),
        )
        .map((e) => e.key),
    );
  }, [active, entries, kind, source, year, topic, matcher, haystack]);
  // The same filters without the topic (the Topics menu counts within them).
  const nonTopic = kind !== "all" || source !== "all" || !!year || !!matcher;
  const countIn = React.useMemo(() => {
    if (!nonTopic) return null;
    return new Set(
      entries
        .filter((e) => hasKind(e, kind) && (source === "all" || e.source === source) && (!year || e.date.startsWith(year)) && (!matcher || matcher(haystack.get(e.key) ?? "")))
        .map((e) => e.key),
    );
  }, [nonTopic, entries, kind, source, year, matcher, haystack]);
  const kindCounts = React.useMemo(() => {
    const c = Object.fromEntries(KIND_FILTERS.map((k) => [k.id, 0])) as Record<KindFilter, number>;
    for (const e of entries) for (const k of KIND_FILTERS) if (hasKind(e, k.id)) c[k.id]++;
    return c;
  }, [entries]);
  const years = React.useMemo(() => [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort().reverse(), [entries]);
  const sources = React.useMemo(() => sourceCounts(entries), [entries]);
  return { query, setQuery, kind, setKind, source, setSource, sources, year, setYear, topic, setTopic, matching, countIn, kindCounts, years, loadFullText: load };
}
