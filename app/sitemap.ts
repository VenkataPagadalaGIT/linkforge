import type { MetadataRoute } from "next";
import { toDate } from "@/lib/date";
import { aiUpdates } from "@/data/aiUpdates";
import { PERSONAS, PERSONAS_LAST_UPDATED } from "@/data/personas";
import { SITE_URL } from "@/lib/site";
import { getSitemapData } from "@/lib/content-fetch";
import { guides } from "@/data/guides";
import { refConcepts, REF_BASE } from "@/data/learnReference";
import { nodes as aiOntologyNodes } from "@/data/aiOntology";
import { conferences, listConferenceSessions } from "@/data/conferences";
import { speakers } from "@/data/speakers";
import { aiContributors } from "@/data/aiContributors";

// Re-generate the sitemap at most once per hour so new content appears
// without a rebuild.
export const revalidate = 3600;

const STATIC_ROUTES = [
  "",
  "/about",
  "/projects",
  "/publications",
  "/insights",
  "/solutions",
  "/research",
  "/notebook",
  "/personas",
  "/notebook/ai",
  "/notebook/ai/agents",
  "/notebook/ai/roadmap",
  "/notebook/ai/encyclopedia",
  "/notebook/ai/map",
  "/notebook/ai/graph",
  "/notebook/ai/shelf",
  "/credits",
  "/3d",
  "/notebook/business",
  "/notebook/conference",
  "/ai-updates",
  "/ai-contributors",
  "/experience",
  "/contact",
  "/guides",
  "/3d-game",
  // Machine-readable resources for AI answer engines. Self-canonical, so
  // they belong here; the /guides/<slug>.md twins deliberately do NOT (they
  // canonical back to the HTML page).
  "/llms.txt",
  "/llms-full.txt",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const data = await getSitemapData();

  const urls: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1.0 : path.startsWith("/insights") || path.startsWith("/ai-") ? 0.8 : 0.6,
  }));

  // Updates come from the backend AND the static module, deduped by slug:
  // an article that ships in the file alone must be crawlable the same day.
  const seenUpdates = new Set<string>();
  if (data) {
    for (const u of data.updates) {
      seenUpdates.add(u.slug);
      urls.push({
        url: `${SITE_URL}/ai-updates/${u.slug}`,
        lastModified: u.date ? toDate(u.date) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    // Contributors deliberately do NOT come from the backend here. The
    // profile page renders from src/data/aiContributors.ts, so listing the
    // Mongo copy advertised five ids that render "not found" while omitting
    // five that render fine. Enumerated below from the file instead.
    for (const p of data.pillars) {
      urls.push({
        url: `${SITE_URL}/insights/${p.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
    for (const p of data.posts) {
      urls.push({
        url: `${SITE_URL}/insights/${p.pillarSlug}/${p.slug}`,
        lastModified: p.date ? toDate(p.date) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  for (const g of guides) {
    urls.push({
      url: `${SITE_URL}/guides/${g.slug}`,
      lastModified: g.dateModified ? toDate(g.dateModified) : now,
      changeFrequency: "monthly",
      priority: 0.9,
    });
  }
  for (const c of refConcepts) {
    urls.push({
      url: `${SITE_URL}${REF_BASE}/${c.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  // Solutions detail pages — internally linked and indexable, but were absent
  // from the sitemap (audit: 160 indexable URLs missing).
  const solutionSlugs = ["ai-product", "aeo", "technical", "programmatic", "editorial", "performance"];
  for (const slug of solutionSlugs) {
    urls.push({ url: `${SITE_URL}/solutions/${slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  // AI Systems Map — one topic page per ontology entity.
  for (const n of aiOntologyNodes) {
    urls.push({
      url: `${SITE_URL}/notebook/ai/map/${n.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: n.chokepoint ? 0.7 : 0.6,
    });
  }

  // One contributor URL per profile the site can actually render.
  for (const c of aiContributors) {
    urls.push({
      url: `${SITE_URL}/ai-contributors/${c.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Conference notebook: conferences, their sessions, and speaker profiles.
  // These are indexable and internally linked, but were absent from the
  // sitemap entirely (an audit found 154 such URLs), so search engines only
  // ever reached them by crawling.
  for (const c of conferences) {
    urls.push({
      url: `${SITE_URL}/notebook/conference/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
    // urlSlug is the form the conference page links and the route resolves.
    for (const { urlSlug } of listConferenceSessions(c)) {
      urls.push({
        url: `${SITE_URL}/notebook/conference/${c.slug}/sessions/${urlSlug}`,
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.4,
      });
    }
  }
  for (const s of speakers) {
    urls.push({
      url: `${SITE_URL}/notebook/conference/speakers/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const p of PERSONAS) {
    urls.push({
      url: `${SITE_URL}/personas/${p.slug}`,
      lastModified: toDate(PERSONAS_LAST_UPDATED),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const u of aiUpdates) {
    if (seenUpdates.has(u.slug)) continue;
    urls.push({
      url: `${SITE_URL}/ai-updates/${u.slug}`,
      lastModified: toDate(u.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return urls;
}
