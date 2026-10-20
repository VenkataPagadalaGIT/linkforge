/**
 * Venkata Pagadala - Universe (UNIVERSE_PATH): everything Venkata shares, as one
 * graph by topic, kept on this site so the work lives here first. LinkedIn is
 * the first source (its posts, articles and media); each source has its pages
 * under the Universe (LINKEDIN_PATH), and topics span every source.
 *
 * Shared by server and browser code. It holds the media items, the topic tree
 * (linkedinTaxonomy.json: L1 areas, L2 topics, L3 subtopics) and the compact
 * entry index (every post, article and standalone media item). Full post
 * records, article bodies, topic lists and counts live in
 * linkedinArchiveServer.ts, which only server code imports; the graph lives in
 * linkedinGraphData.ts, imported only by the graph component.
 * Media files are served from LINKEDIN_MEDIA_BASE (Cloudflare R2 in production,
 * a local static server in development), never from this repository.
 */
import { LINKEDIN_ITEMS } from "./linkedinArchiveData";
import { ENGAGEMENT_AS_OF, LINKEDIN_ENTRIES_RAW } from "./linkedinEntriesData";
import TAXONOMY from "./linkedinTaxonomy.json";
import type { LiEngagement, LiEntry, LiEntryRaw, LiItem, LiKind, LiPost, LiSource, LiTopicNode } from "./linkedinArchiveTypes";
import { LINKEDIN_ARTICLES_PATH, LINKEDIN_POSTS_PATH, UNIVERSE_PATH } from "./universe";

export * from "./universe";

export type { LiItem, LiKind, LiGraph, LiGraphNode, LiPost, LiPerson, LiEngagement, LiEntry, LiEntryKind, LiSource, LiTopicNode } from "./linkedinArchiveTypes";

/** Display names for every source the archive knows (only those with entries appear in filters). */
export const SOURCE_LABEL: Record<LiSource, string> = {
  linkedin: "LinkedIn",
  website: "Website",
  substack: "Substack",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  podcast: "Podcast",
  book: "Book",
};
export const SOURCES = Object.keys(SOURCE_LABEL) as LiSource[];
export { LINKEDIN_ITEMS, ENGAGEMENT_AS_OF };

export const LINKEDIN_PROFILE = "https://www.linkedin.com/in/venkata-pagadala";
export const LINKEDIN_ACTIVITY = `${LINKEDIN_PROFILE}/recent-activity/all/`;
/** A post on LinkedIn, from its activity id. */
export const activityUrl = (activityId: string) => `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;

export const LINKEDIN_MEDIA_BASE = (
  process.env.NEXT_PUBLIC_LINKEDIN_MEDIA_BASE || "https://media.venkatapagadala.com/linkedin"
).replace(/\/+$/, "");

/** 480px-wide thumbnail (every kind). */
export const thumbUrl = (it: Pick<LiItem, "idx">) => `${LINKEDIN_MEDIA_BASE}/t/${it.idx}.webp`;
/** 96px square used inside the graph. */
export const nodeImageUrl = (idx: string) => `${LINKEDIN_MEDIA_BASE}/n/${idx}.webp`;
/** The full media: large image, the video file, or the document. */
export const fullUrl = (it: Pick<LiItem, "idx" | "kind" | "docExt">) =>
  it.kind === "video"
    ? `${LINKEDIN_MEDIA_BASE}/v/${it.idx}.mp4`
    : it.kind === "document"
    ? `${LINKEDIN_MEDIA_BASE}/d/${it.idx}.${it.docExt ?? "pdf"}`
    : `${LINKEDIN_MEDIA_BASE}/f/${it.idx}.webp`;
/** Video poster (960px). */
export const posterUrl = (idx: string) => `${LINKEDIN_MEDIA_BASE}/p/${idx}.webp`;
const itemByIdx = new Map(LINKEDIN_ITEMS.map((i) => [i.idx, i]));
export const getItem = (idx: string) => itemByIdx.get(idx);
/** An image for a media item (share cards, structured data): the image, a video's poster, a document's thumbnail. */
export const imageUrlFor = (idx?: string) => {
  const it = idx ? itemByIdx.get(idx) : undefined;
  if (!it) return undefined;
  return it.kind === "video" ? posterUrl(it.idx) : it.kind === "document" ? thumbUrl(it) : fullUrl(it);
};
/** Text cut to at most n characters at a word boundary (whole characters, so emoji survive). */
export const clipText = (s: string, n: number) => {
  const chars = Array.from(s);
  if (chars.length <= n) return s;
  return `${chars.slice(0, n).join("").replace(/\s+\S*$/, "").replace(/[,;:]$/, "")}...`;
};

// ---------------------------------------------------------------------------
// The topic tree
// ---------------------------------------------------------------------------
export const TOPIC_NODES: LiTopicNode[] = (TAXONOMY.nodes as LiTopicNode[]).map((n) => ({ ...n, level: n.level as 1 | 2 | 3 }));
const topicById = new Map(TOPIC_NODES.map((n) => [n.id, n]));
const topicBySlug = new Map(TOPIC_NODES.map((n) => [n.slug, n]));
export const getTopic = (id: string) => topicById.get(id);
export const getTopicBySlug = (slug: string) => topicBySlug.get(slug);
export const topicLabel = (id: string) => topicById.get(id)?.label ?? id.replace(/[_-]/g, " ");
export const topicSlug = (id: string) => topicById.get(id)?.slug ?? id;
export const topicPath = (id: string) => `${UNIVERSE_PATH}/topics/${topicSlug(id)}`;
export const childTopics = (id: string | null) => TOPIC_NODES.filter((n) => n.parent === id);
/** The topic and its ancestors, root first (L1, L2, L3). */
export function topicTrail(id: string): LiTopicNode[] {
  const out: LiTopicNode[] = [];
  for (let n = topicById.get(id); n; n = n.parent ? topicById.get(n.parent) : undefined) out.unshift(n);
  return out;
}
/** Does this entry (or item) sit under the topic, at any level? */
export function inTopic(e: { topics: string[]; subtopics: string[] }, id: string) {
  const t = topicById.get(id);
  if (!t) return false;
  if (t.level === 3) return e.subtopics.includes(id);
  if (t.level === 2) return e.topics.includes(id);
  return e.topics.some((x) => topicById.get(x)?.parent === id);
}
/** L1 areas of an entry, main first. */
export const areasOf = (e: { topics: string[] }) => [...new Set(e.topics.map((t) => topicById.get(t)?.parent).filter(Boolean) as string[])];

// ---------------------------------------------------------------------------
// Entries: every post, article and standalone media item (the browser index)
// ---------------------------------------------------------------------------
function expand(r: LiEntryRaw): LiEntry {
  let engagement: LiEngagement | undefined;
  if (r.e) {
    const [reactions, comments, reposts, impressions, engagements, flags] = r.e;
    engagement = { asOf: ENGAGEMENT_AS_OF, source: flags.includes("a") ? "page+analytics" : "page" };
    if (reactions != null) engagement.reactions = reactions;
    if (comments != null) engagement.comments = comments;
    if (reposts != null) engagement.reposts = reposts;
    if (impressions != null) engagement.impressions = impressions;
    if (engagements != null) engagement.engagements = engagements;
    if (flags.includes("f")) engagement.impressionsAtLeast = true;
    if (flags.includes("g")) engagement.engagementsAtLeast = true;
  }
  const media = r.k === "media" ? [r.i] : r.m ?? [];
  return {
    key: `${r.k}:${r.i}`,
    kind: r.k,
    source: r.src ?? "linkedin",
    id: r.i,
    title: r.t,
    date: r.d,
    excerpt: r.x,
    media,
    commentMedia: r.cm,
    url: r.u ?? (r.a ? activityUrl(r.a) : ""),
    activityId: r.a,
    engagement,
    topics: r.l2,
    subtopics: r.l3 ?? [],
    names: r.n ?? [],
    words: r.w,
    review: r.rv ? true : undefined,
  };
}
export const LINKEDIN_ENTRIES: LiEntry[] = LINKEDIN_ENTRIES_RAW.map(expand);
const entryByKey = new Map(LINKEDIN_ENTRIES.map((e) => [e.key, e]));
export const getEntry = (key: string) => entryByKey.get(key);
/** The entry a media item belongs to: its post or article, or itself. */
export const entryForItem = (it: LiItem) => entryByKey.get(it.post ? `post:${it.post}` : "") ?? entryByKey.get(it.post ? `article:${it.post}` : "") ?? entryByKey.get(`media:${it.idx}`);
/** This site's page for an entry: the post or article page, or the full media file. */
export function entryPath(e: Pick<LiEntry, "kind" | "id">) {
  if (e.kind === "article") return `${LINKEDIN_ARTICLES_PATH}/${e.id}`;
  if (e.kind === "post") return `${LINKEDIN_POSTS_PATH}/${e.id}`;
  const it = itemByIdx.get(e.id);
  return it ? fullUrl(it) : UNIVERSE_PATH;
}

export const KIND_LABEL: Record<LiKind, string> = { image: "Image", video: "Video", document: "Document" };
/** Items the site may show. Review items exist only in local preview data. */
export const PUBLIC_ITEMS: LiItem[] = LINKEDIN_ITEMS;

/** Most reactions first (ties: newest first). */
export const mostEngaging = <T extends { engagement?: LiEngagement; date: string }>(list: T[], limit = 12) =>
  [...list].sort((a, b) => (b.engagement?.reactions ?? 0) - (a.engagement?.reactions ?? 0) || b.date.localeCompare(a.date)).slice(0, limit);
/** Where engagement numbers came from (LiEngagement.source keys). */
export const ENGAGEMENT_SOURCES: Record<string, string> = {
  page: "LinkedIn activity page (reactions, comments, reposts)",
  "page+analytics": "LinkedIn activity page (reactions, comments, reposts) and LinkedIn creator analytics export (impressions, engagements)",
};
export const engagementSource = (e: Pick<LiEngagement, "source">) => ENGAGEMENT_SOURCES[e.source] ?? e.source;
/** The LinkedIn URL of an article or post (posts may only carry their activity id). */
export const linkedinUrl = (p: Pick<LiPost, "url" | "activityId">) => p.url || (p.activityId ? activityUrl(p.activityId) : "");
/** "262 reactions · 89 comments · 11 reposts · 31,130 impressions" (only the numbers that exist). */
export function engagementLine(p: { engagement?: LiEngagement }) {
  const e = p.engagement;
  if (!e) return "";
  const n = (v: number | undefined, w: string, floor = false) => (v == null ? null : `${floor ? "at least " : ""}${v.toLocaleString("en-US")} ${w}${v === 1 ? "" : "s"}`);
  return [n(e.reactions, "reaction"), n(e.comments, "comment"), n(e.reposts, "repost"), n(e.impressions, "impression", e.impressionsAtLeast)].filter(Boolean).join(" · ");
}
/** This site's page for an article (or post). */
export const postPath = (p: Pick<LiPost, "id" | "type">) => `${p.type === "article" ? LINKEDIN_ARTICLES_PATH : LINKEDIN_POSTS_PATH}/${p.id}`;
/** Minutes to read at 230 words a minute. */
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 230));
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
export const formatDay = (day: string) =>
  new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
export const formatDuration = (s?: number) => {
  if (!s && s !== 0) return "";
  const total = Math.round(s);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
/** ISO 8601 duration for structured data, e.g. PT4M19S. */
export const isoDuration = (s?: number) => {
  if (!s) return undefined;
  const total = Math.round(s);
  return `PT${Math.floor(total / 60)}M${total % 60}S`;
};

/** Topics that most often share entries with this one (same level). */
export function relatedTopics(id: string, limit = 6) {
  const t = topicById.get(id);
  if (!t) return [];
  const counts = new Map<string, number>();
  for (const e of LINKEDIN_ENTRIES) {
    if (!inTopic(e, id)) continue;
    const peers = t.level === 3 ? e.subtopics : t.level === 2 ? e.topics : areasOf(e);
    for (const p of peers) if (p !== id) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([x, n]) => ({ id: x, slug: topicSlug(x), label: topicLabel(x), shared: n }));
}
/** Named things (events, companies, products, people) that appear most in a set of entries. */
export function topNames(list: { names: string[] }[], limit = 12) {
  const counts = new Map<string, number>();
  for (const e of list) for (const n of e.names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, n]) => ({ name, count: n }));
}
/** Entries under each topic node (any level), for the sidebar and the topic pages. */
export function topicCounts(list: LiEntry[] = LINKEDIN_ENTRIES) {
  const c = new Map<string, number>(TOPIC_NODES.map((n) => [n.id, 0]));
  for (const e of list) {
    for (const t of e.topics) c.set(t, (c.get(t) ?? 0) + 1);
    for (const t of e.subtopics) c.set(t, (c.get(t) ?? 0) + 1);
    for (const a of areasOf(e)) c.set(a, (c.get(a) ?? 0) + 1);
  }
  return c;
}
