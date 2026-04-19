import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
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

  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1.0 : path.startsWith("/insights") || path.startsWith("/ai-") ? 0.8 : 0.6,
  }));
}
