/**
 * The LinkedIn archive (/linkedin): Venkata's own LinkedIn media, kept on this
 * site so the work lives here first and LinkedIn is one place it is shared.
 *
 * Items come from linkedinArchiveData.ts and the precomputed graph from
 * linkedinGraphData.ts (both generated; the graph module is imported only by
 * the graph component so topic pages do not ship it). This module is shared by
 * server and browser code, so it holds only the small post index
 * (LINKEDIN_POST_REFS); every post's full record, the topic lists and the counts
 * live in linkedinArchiveServer.ts, which only server code imports.
 * Media files are served from LINKEDIN_MEDIA_BASE (Cloudflare R2 in production,
 * a local static server in development), never from this repository.
 */
import { LINKEDIN_ITEMS } from "./linkedinArchiveData";
import { ENGAGEMENT_AS_OF, LINKEDIN_POST_REFS_RAW } from "./linkedinPostRefsData";
import type { LiEngagement, LiItem, LiKind, LiPost } from "./linkedinArchiveTypes";

export type { LiItem, LiKind, LiGraph, LiGraphNode, LiPost, LiPerson, LiEngagement } from "./linkedinArchiveTypes";
export { LINKEDIN_ITEMS, ENGAGEMENT_AS_OF };

/** A post on LinkedIn, from its activity id. */
export const activityUrl = (activityId: string) => `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;

/** The browser's post index (articles, and posts some public media belongs to), expanded to full LiPost shape. */
export const LINKEDIN_POST_REFS: LiPost[] = LINKEDIN_POST_REFS_RAW.map((r) => ({
  ...r,
  url: r.url ?? (r.activityId ? activityUrl(r.activityId) : ""),
  people: r.people ?? [],
  topics: r.topics ?? [],
  words: r.words ?? 0,
  engagement: r.engagement ? { asOf: ENGAGEMENT_AS_OF, ...r.engagement } : undefined,
}));

export const LINKEDIN_PROFILE = "https://www.linkedin.com/in/venkata-pagadala";
export const LINKEDIN_ACTIVITY = `${LINKEDIN_PROFILE}/recent-activity/all/`;

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
/** An image for a media item (share cards, structured data): the image, a video's poster, a document's thumbnail. */
export const imageUrlFor = (idx?: string) => {
  const it = idx ? LINKEDIN_ITEMS.find((i) => i.idx === idx) : undefined;
  if (!it) return undefined;
  return it.kind === "video" ? posterUrl(it.idx) : it.kind === "document" ? thumbUrl(it) : fullUrl(it);
};
/** Text cut to at most n characters at a word boundary (whole characters, so emoji survive). */
export const clipText = (s: string, n: number) => {
  const chars = Array.from(s);
  if (chars.length <= n) return s;
  return `${chars.slice(0, n).join("").replace(/\s+\S*$/, "").replace(/[,;:]$/, "")}...`;
};

interface TopicMeta {
  /** URL slug. FROZEN once live: never change it without the owner's redirect plan. */
  slug: string;
  label: string;
  blurb: string;
}

/** Topic ids come from the media classification; labels and blurbs are site copy. */
export const TOPIC_META: Record<string, TopicMeta> = {
  ai_llm: { slug: "ai-and-llms", label: "AI and LLMs", blurb: "Large language models, AI assistants and the tools built on them, as I used and wrote about them." },
  seo_search: { slug: "seo-and-search", label: "SEO and search", blurb: "Search engine optimization in practice: rankings, crawling, content and technical SEO." },
  events_conferences: { slug: "events-and-conferences", label: "Events and conferences", blurb: "Conferences I attended, spoke at or covered, from the Google Webmaster Conference to brightonSEO." },
  product_tools: { slug: "products-and-tools", label: "Products and tools", blurb: "Software, dashboards and tools: screenshots of the products I built, tested or reviewed." },
  google_updates: { slug: "google-algorithm-updates", label: "Google algorithm updates", blurb: "Core updates, ranking volatility and Google's own status announcements, tracked as they happened." },
  marketing_growth: { slug: "marketing-and-growth", label: "Marketing and growth", blurb: "Marketing strategy, agencies, demand and growth." },
  data_engineering: { slug: "data-engineering", label: "Data engineering", blurb: "Keyword taxonomies, data pipelines and the systems behind them." },
  motivation_quotes: { slug: "quotes-and-motivation", label: "Quotes and motivation", blurb: "Quote cards and short lessons shared along the way." },
  content_social: { slug: "content-and-social", label: "Content and social", blurb: "Content strategy and social media, including LinkedIn itself." },
  speaking_media: { slug: "speaking-and-media", label: "Speaking and media", blurb: "Talks, podcasts and videos where I present." },
  career_education: { slug: "career-and-education", label: "Career and education", blurb: "Courses, certificates and career milestones." },
  personal_life: { slug: "life", label: "Life", blurb: "Moments outside work that I chose to share publicly." },
  search_console_analytics: { slug: "search-console-and-analytics", label: "Search Console and analytics", blurb: "Google Search Console and analytics reports, read closely." },
  awards_recognition: { slug: "awards-and-recognition", label: "Awards and recognition", blurb: "Awards, mentions and recognition." },
  company_brand: { slug: "companies-and-brands", label: "Companies and brands", blurb: "Companies I worked with or built." },
  health_awareness: { slug: "health-awareness", label: "Health awareness", blurb: "Health awareness posts." },
  community_volunteering: { slug: "community-and-volunteering", label: "Community and volunteering", blurb: "Community work and volunteering." },
  other: { slug: "other", label: "Other", blurb: "Everything else." },
};

export const topicLabel = (id: string) => TOPIC_META[id]?.label ?? id.replace(/_/g, " ");
export const topicSlug = (id: string) => TOPIC_META[id]?.slug ?? id.replace(/_/g, "-");

export const KIND_LABEL: Record<LiKind, string> = { image: "Image", video: "Video", document: "Document" };

/** Items the site may show. Review items exist only in local preview data. */
export const PUBLIC_ITEMS: LiItem[] = LINKEDIN_ITEMS;


/** Posts with the most reactions first (ties: newest first). */
export const mostEngaging = (list: LiPost[], limit = 12) =>
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
export function engagementLine(p: Pick<LiPost, "engagement">) {
  const e = p.engagement;
  if (!e) return "";
  const n = (v: number | undefined, w: string, floor = false) => (v == null ? null : `${floor ? "at least " : ""}${v.toLocaleString("en-US")} ${w}${v === 1 ? "" : "s"}`);
  return [n(e.reactions, "reaction"), n(e.comments, "comment"), n(e.reposts, "repost"), n(e.impressions, "impression", e.impressionsAtLeast)].filter(Boolean).join(" · ");
}
/**
 * A post outside the browser index, rebuilt from its timeline bar: title, exact time, counts with their source and
 * floor flag, media count; topics come from the caller (the node's graph neighbours). Enough for a card and a link.
 */
export function postFromNode(
  n: { id: string; label: string; postType?: LiPost["type"]; count?: number; meta?: [string, number | null, number | null, number | null, number | null, string] },
  topics: string[] = [],
): LiPost {
  const [date, reactions, comments, reposts, impressions, flags] = n.meta ?? ["", null, null, null, null, ""];
  const e: LiEngagement = { asOf: ENGAGEMENT_AS_OF, source: flags.includes("a") ? "page+analytics" : "page" };
  if (reactions != null) e.reactions = reactions;
  if (comments != null) e.comments = comments;
  if (reposts != null) e.reposts = reposts;
  if (impressions != null) e.impressions = impressions;
  if (flags.includes("f")) e.impressionsAtLeast = true;
  const has = reactions != null || comments != null || reposts != null || impressions != null;
  // count = media items (articles: images); stand-in ids so lengths read right in cards and the panel.
  const media = Array.from({ length: n.count ?? 0 }, (_, k) => `?${k}`);
  return { id: n.id.slice(2), type: n.postType ?? "post", title: n.label, date, url: "", media, people: [], topics, words: 0, excerpt: "", engagement: has ? e : undefined };
}
/** This site's page for an article (or post). */
export const postPath = (p: Pick<LiPost, "id" | "type">) => `/linkedin/${p.type === "article" ? "articles" : "posts"}/${p.id}`;
/** Minutes to read at 230 words a minute. */
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 230));
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

/** Topics that most often share items with this one. */
export function relatedTopics(id: string, limit = 6) {
  const counts = new Map<string, number>();
  for (const it of PUBLIC_ITEMS) {
    if (!it.topics.includes(id)) continue;
    for (const t of it.topics) if (t !== id && t !== "other") counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t, n]) => ({ id: t, slug: topicSlug(t), label: topicLabel(t), shared: n }));
}

/** Named things (events, companies, products) that appear most in a set of items. */
export function topEntities(items: LiItem[], limit = 12) {
  const counts = new Map<string, number>();
  for (const it of items) for (const e of it.entities) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, n]) => ({ name, count: n }));
}

export const formatDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

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
