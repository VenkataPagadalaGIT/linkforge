/**
 * Server-side helpers for fetching content from the Mono Mind API.
 * Used inside `generateMetadata()` in Next.js app route pages so that per-post
 * metadata, canonical URLs and Article JSON-LD are rendered into the initial
 * HTML — giving AI bots (GPTBot/ClaudeBot/PerplexityBot) and search engines
 * rich, crawlable information for each URL.
 */
import { BACKEND_URL, SITE_URL } from "./site";
import { aiUpdates as staticUpdates } from "@/data/aiUpdates";

async function fetchJSON<T = unknown>(path: string): Promise<T | null> {
  const url = `${BACKEND_URL}/api${path}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ----- Types mirrored loosely from the TS data module -----
export type Contributor = {
  id: string;
  name: string;
  rank: number;
  bio: string;
  longBio?: string;
  segment: string;
  specialty?: string[];
  affiliation?: string;
  expertType?: string;
  country?: string;
  education?: string;
  keyInfluence?: string;
  awards?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
};

export type AIUpdate = {
  id: string;
  slug: string;
  title: string;
  company: string;
  category: string;
  date: string;
  summary: string;
  takeaways?: string[];
  /** Contributor ids named in the story. */
  contributors?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription: string;
  pillarSlug: string;
  excerpt: string;
  tags?: string[];
  date: string;
};

export type Pillar = {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription: string;
  headline?: string;
  description?: string;
};

export type Sitemap = {
  contributors: { id: string }[];
  updates: { slug: string; date?: string }[];
  pillars: { slug: string }[];
  posts: { slug: string; pillarSlug: string; date?: string }[];
};

// ----- Fetch helpers -----
// STATIC FIRST, backend second: the opposite precedence from getUpdate, and
// deliberately so. The contributors dataset is maintained in the TS module
// (the client explorer and profile view both render from it), while the Mongo
// copy is a seed that goes stale the moment the file is edited. If the
// backend won here, a refreshed bio would ship in the page body while the
// title, description and JSON-LD kept serving the old Mongo text.
// No backend fallback, deliberately. The profile VIEW renders only from the
// file, so an id the backend knows and the file does not produced a 200 page
// whose body read "Contributor not found" while its title, canonical and
// Person JSON-LD described a real person. Five such soft 404s were live and
// in the sitemap. If the file does not have them, the page is a real 404.
export const getContributor = async (id: string): Promise<Contributor | null> => {
  const { aiContributors } = await import("@/data/aiContributors");
  const local = aiContributors.find((c) => c.id === id);
  return local ? (local as unknown as Contributor) : null;
};

// Backend first, static module second. The updates index and the client
// detail view both read the static module directly, so an article that only
// exists in the file was listed, rendered, and then 404ed by this server
// gate. The fallback keeps the three readers agreeing, and it means an
// article still serves when the backend is down, the same guarantee the
// guides already make.
export const getUpdate = async (slug: string): Promise<AIUpdate | null> => {
  const fromApi = await fetchJSON<AIUpdate>(`/content/updates/${encodeURIComponent(slug)}`);
  if (fromApi) return fromApi;
  const local = staticUpdates.find((u) => u.slug === slug);
  return local ? (local as unknown as AIUpdate) : null;
};

// Backend first, static module second, matching getUpdate. Insights content is
// authored in both places: the CMS writes to Mongo, and src/data/insights.ts
// ships with the build. Whichever holds a slug, the page must resolve.
export const getPost = async (slug: string): Promise<BlogPost | null> => {
  const fromApi = await fetchJSON<BlogPost>(`/content/posts/${encodeURIComponent(slug)}`);
  if (fromApi) return fromApi;
  const { getBlogBySlug } = await import("@/data/insights");
  const local = getBlogBySlug(slug);
  return local ? (local as unknown as BlogPost) : null;
};

export const getPillar = async (slug: string): Promise<Pillar | null> => {
  const fromApi = await fetchJSON<Pillar>(`/content/pillars/${encodeURIComponent(slug)}`);
  if (fromApi) return fromApi;
  const { getPillarBySlug } = await import("@/data/insights");
  const local = getPillarBySlug(slug);
  return local ? (local as unknown as Pillar) : null;
};

export const getSitemapData = () => fetchJSON<Sitemap>("/content/sitemap");

// ----- JSON-LD builders -----
export function articleJsonLd(opts: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  section?: string;
  keywords?: string[];
  authorName?: string;
  schemaType?: string;
  image?: string;
  /** Contributor ids named in the story, emitted as schema.org mentions. */
  mentions?: { id: string; name: string; affiliation?: string; photoUrl?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.schemaType || "Article",
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : { dateModified: opts.datePublished }),
    ...(opts.section ? { articleSection: opts.section } : {}),
    ...(opts.keywords && opts.keywords.length ? { keywords: opts.keywords.join(", ") } : {}),
    author: {
      "@type": "Person",
      name: opts.authorName || "Venkata Pagadala",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Venkata Pagadala",
      url: SITE_URL,
    },
    ...(opts.mentions && opts.mentions.length
      ? {
          mentions: opts.mentions.map((m) => ({
            "@type": "Person",
            "@id": `${SITE_URL}/ai-contributors/${m.id}#person`,
            name: m.name,
            url: `${SITE_URL}/ai-contributors/${m.id}`,
            ...(m.affiliation ? { affiliation: { "@type": "Organization", name: m.affiliation } } : {}),
            ...(m.photoUrl ? { image: `${SITE_URL}${m.photoUrl}` } : {}),
          })),
        }
      : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

export function personJsonLd(c: Contributor, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.name,
    description: c.bio,
    url,
    ...(c.affiliation ? { affiliation: { "@type": "Organization", name: c.affiliation } } : {}),
    ...(c.twitter ? { sameAs: [c.twitter, c.linkedin, c.website].filter(Boolean) } : {}),
    ...(c.expertType ? { jobTitle: c.expertType } : {}),
    ...(c.country ? { nationality: c.country } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
