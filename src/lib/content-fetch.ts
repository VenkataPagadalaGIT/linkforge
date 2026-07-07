/**
 * Server-side helpers for fetching content from the Mono Mind API.
 * Used inside `generateMetadata()` in Next.js app route pages so that per-post
 * metadata, canonical URLs and Article JSON-LD are rendered into the initial
 * HTML — giving AI bots (GPTBot/ClaudeBot/PerplexityBot) and search engines
 * rich, crawlable information for each URL.
 */
import { BACKEND_URL, SITE_URL } from "./site";

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
export const getContributor = (id: string) =>
  fetchJSON<Contributor>(`/content/contributors/${encodeURIComponent(id)}`);

export const getUpdate = (slug: string) =>
  fetchJSON<AIUpdate>(`/content/updates/${encodeURIComponent(slug)}`);

export const getPost = (slug: string) =>
  fetchJSON<BlogPost>(`/content/posts/${encodeURIComponent(slug)}`);

export const getPillar = (slug: string) =>
  fetchJSON<Pillar>(`/content/pillars/${encodeURIComponent(slug)}`);

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
