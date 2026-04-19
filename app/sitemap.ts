import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSitemapData } from "@/lib/content-fetch";

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
  "/notebook/ai",
  "/notebook/ai/roadmap",
  "/notebook/ai/encyclopedia",
  "/notebook/business",
  "/ai-updates",
  "/ai-contributors",
  "/experience",
  "/contact",
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

  if (data) {
    for (const u of data.updates) {
      urls.push({
        url: `${SITE_URL}/ai-updates/${u.slug}`,
        lastModified: u.date ? new Date(u.date) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    for (const c of data.contributors) {
      urls.push({
        url: `${SITE_URL}/ai-contributors/${c.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
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
        lastModified: p.date ? new Date(p.date) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  return urls;
}
