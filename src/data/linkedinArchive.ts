/**
 * The LinkedIn archive (/linkedin): Venkata's own LinkedIn media, kept on this
 * site so the work lives here first and LinkedIn is one place it is shared.
 *
 * Items come from linkedinArchiveData.ts and the precomputed graph from
 * linkedinGraphData.ts (both generated; the graph module is imported only by
 * the graph component so topic pages do not ship it).
 * Media files are served from LINKEDIN_MEDIA_BASE (Cloudflare R2 in production,
 * a local static server in development), never from this repository.
 */
import { LINKEDIN_ITEMS } from "./linkedinArchiveData";
import type { LiItem, LiKind } from "./linkedinArchiveTypes";

export type { LiItem, LiKind, LiGraph, LiGraphNode } from "./linkedinArchiveTypes";
export { LINKEDIN_ITEMS };

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

/**
 * Every topic that has a page ("Other" has none). Pages exist for all of them so
 * a URL never 404s once live; a topic that currently has no items renders noindex
 * and stays out of the site registry.
 */
export const ALL_LINKEDIN_TOPICS = Object.keys(TOPIC_META)
  .filter((id) => id !== "other")
  .map((id) => ({ id, ...TOPIC_META[id], items: PUBLIC_ITEMS.filter((i) => i.topics.includes(id)) }));

/** Topics with at least one item, largest first: the ones listed and linked. */
export const LINKEDIN_TOPICS = ALL_LINKEDIN_TOPICS.filter((t) => t.items.length > 0).sort((a, b) => b.items.length - a.items.length);

export const getLinkedInTopic = (slug: string) => ALL_LINKEDIN_TOPICS.find((t) => t.slug === slug);

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

const years = PUBLIC_ITEMS.map((i) => i.date.slice(0, 4)).sort();
export const LINKEDIN_COUNTS = {
  items: PUBLIC_ITEMS.length,
  images: PUBLIC_ITEMS.filter((i) => i.kind === "image").length,
  videos: PUBLIC_ITEMS.filter((i) => i.kind === "video").length,
  documents: PUBLIC_ITEMS.filter((i) => i.kind === "document").length,
  topics: LINKEDIN_TOPICS.length,
  firstYear: years[0] ?? "",
  lastYear: years[years.length - 1] ?? "",
  years: [...new Set(years)].sort().reverse(),
};

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
