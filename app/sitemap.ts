import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSiteIndex } from "@/lib/siteIndex";

// Built on each request from cached data (the site index and the published
// news), so an article published without a deploy is in sitemap.xml at once.
// A refresh message does not reach a statically cached sitemap route in this
// Next.js version (found by scripts/cms/test_no_deploy_news.py, E02).
export const dynamic = "force-dynamic";

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
