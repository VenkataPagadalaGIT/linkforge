/**
 * How a page SEO override (content/seo-overrides.json) changes the metadata a
 * page's code defines. Pure, with type-only imports, so the node tests run it
 * directly. The server side is src/lib/seo-overrides.ts.
 */
import type { Metadata } from "next";
import type { SeoOverride } from "./seo-validate";

/** googleBot directives an indexable page keeps when its robots value is
 *  overridden (the site-wide max-image-preview and the like). */
export type RobotsExtras = Record<string, string | number | boolean>;

/** The page path for a route and its params: ("/guides/[slug]", { slug: "x" }) gives "/guides/x". */
export function fillRoute(route: string, params: Record<string, string | string[] | undefined> = {}): string {
  const path = route.replace(/\/\[\[?(?:\.\.\.)?([^\]]+)\]\]?/g, (_, name: string) => {
    const v = params[name];
    if (v === undefined || (Array.isArray(v) && !v.length)) return "";
    return `/${Array.isArray(v) ? v.join("/") : v}`;
  });
  return path || "/";
}

/** A robots value such as "noindex, follow" as Next.js metadata. An indexable
 *  page keeps the site's googleBot extras; a noindex page gets none, as the
 *  site's own noindex pages do today. */
export function robotsFor(value: string, extras?: RobotsExtras): Metadata["robots"] {
  const index = !/\bnoindex\b/.test(value);
  const follow = !/\bnofollow\b/.test(value);
  return index && extras ? { index, follow, googleBot: { ...extras, index, follow } } : { index, follow };
}

/**
 * The page's own metadata with the override applied. A title is the exact
 * <title> (no site suffix is added) and also the Open Graph and X title where
 * the page sets those; a description likewise. A canonical also becomes the
 * page's og:url where it sets one. Fields the override does not name, and
 * every other part of the metadata, stay as the code defines them.
 */
export function applySeoOverride(base: Metadata, o: SeoOverride | undefined, robotsExtras?: RobotsExtras): Metadata {
  if (!o) return base;
  const m: Metadata = { ...base };
  if (o.title) m.title = { absolute: o.title };
  if (o.description) m.description = o.description;
  if (base.openGraph && (o.title || o.description || o.canonical)) {
    m.openGraph = {
      ...base.openGraph,
      ...(o.title && { title: o.title }),
      ...(o.description && { description: o.description }),
      ...(o.canonical && base.openGraph.url && { url: o.canonical }),
    };
  }
  if (base.twitter && (o.title || o.description)) {
    m.twitter = {
      ...base.twitter,
      ...(o.title && { title: o.title }),
      ...(o.description && { description: o.description }),
    };
  }
  if (o.canonical) m.alternates = { ...base.alternates, canonical: o.canonical };
  if (o.robots) m.robots = robotsFor(o.robots, robotsExtras);
  return m;
}

/** Whether a page belongs in sitemap.xml once its override applies: not when
 *  it is set to noindex or its canonical points at another page. */
export function inSitemap(path: string, o: SeoOverride | undefined): boolean {
  if (!o) return true;
  if (o.robots && /\bnoindex\b/.test(o.robots)) return false;
  if (o.canonical) {
    const target = o.canonical.startsWith("/") ? o.canonical : new URL(o.canonical).pathname;
    if (target !== path) return false;
  }
  return true;
}
