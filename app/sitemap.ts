import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSiteIndex } from "@/lib/siteIndex";

// Re-generate the sitemap at most once per hour so new content appears
// without a rebuild.
export const revalidate = 3600;

// Every page of the site is enumerated once, in src/lib/siteIndex.ts, which
// the HTML site map (/sitemap) reads too. This file only formats that list.
// The /guides/<slug>.md twins deliberately stay out: they canonical back to
// the HTML page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSiteIndex();
  return entries
    .filter((e) => e.xml)
    .map((e) => ({
      url: `${SITE_URL}${e.href === "/" ? "" : e.href}`,
      lastModified: e.xml!.lastModified,
      changeFrequency: e.xml!.changeFrequency,
      priority: e.xml!.priority,
    }));
}
