// How an override changes a page's metadata (src/lib/seo-apply.ts): A01 to A06 in docs/NO_DEPLOY_PUBLISHING.md.
// Run: node --test "tests/frontend/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { applySeoOverride, fillRoute, inSitemap, robotsFor } from "../../src/lib/seo-apply.ts";

const EXTRAS = { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 };
const page = () => ({
  title: "About",
  description: "The page's own description.",
  keywords: ["a", "b"],
  alternates: { canonical: "/about", types: { "application/rss+xml": [{ url: "/rss.xml", title: "RSS" }] } },
  openGraph: { title: "About · Venkata Pagadala", description: "OG description", url: "/about", images: [{ url: "/og.png" }] },
  twitter: { card: "summary_large_image", title: "X title", description: "X description" },
});

test("A01 no override leaves the page's metadata exactly as its code defines it", () => {
  const base = page();
  assert.equal(applySeoOverride(base, undefined, EXTRAS), base);
});

test("A02 a title is the exact <title>, and also the Open Graph and X title the page sets", () => {
  const m = applySeoOverride(page(), { title: "A new title" }, EXTRAS);
  assert.deepEqual(m.title, { absolute: "A new title" });
  assert.equal(m.openGraph.title, "A new title");
  assert.equal(m.twitter.title, "A new title");
  assert.equal(m.description, "The page's own description.", "description untouched");
  assert.equal(m.openGraph.description, "OG description");
  const d = applySeoOverride(page(), { description: "A new description" }, EXTRAS);
  assert.equal(d.description, "A new description");
  assert.equal(d.openGraph.description, "A new description");
  assert.equal(d.twitter.description, "A new description");
  assert.equal(d.title, "About", "title untouched");
  const bare = applySeoOverride({ title: "Brand" }, { title: "Brand kit" }, EXTRAS);
  assert.equal(bare.openGraph, undefined, "a page without its own Open Graph keeps inheriting the site's");
  assert.equal(bare.twitter, undefined);
});

test("A03 a canonical replaces only the canonical: feeds stay, og:url follows", () => {
  const m = applySeoOverride(page(), { canonical: "/guides/what-is-jev" }, EXTRAS);
  assert.equal(m.alternates.canonical, "/guides/what-is-jev");
  assert.deepEqual(m.alternates.types, page().alternates.types);
  assert.equal(m.openGraph.url, "/guides/what-is-jev");
  const noUrl = applySeoOverride({ openGraph: { title: "T" } }, { canonical: "/x" }, EXTRAS);
  assert.equal(noUrl.openGraph.url, undefined, "no og:url is invented");
});

test("A04 robots: noindex drops the Google extras, index keeps them, and googlebot never contradicts robots", () => {
  assert.deepEqual(robotsFor("noindex, follow", EXTRAS), { index: false, follow: true });
  assert.deepEqual(robotsFor("noindex, nofollow", EXTRAS), { index: false, follow: false });
  assert.deepEqual(robotsFor("index, follow", EXTRAS), { index: true, follow: true, googleBot: { ...EXTRAS, index: true, follow: true } });
  assert.deepEqual(robotsFor("index, nofollow", EXTRAS).googleBot.follow, false);
  const m = applySeoOverride({ ...page(), robots: { index: false, follow: false } }, { robots: "index, follow" }, EXTRAS);
  assert.equal(m.robots.index, true);
  assert.equal(m.robots.googleBot["max-image-preview"], "large");
});

test("A05 fields the override does not name stay as the code defines them", () => {
  const m = applySeoOverride(page(), { title: "T", description: "D", canonical: "/c", robots: "noindex, follow" }, EXTRAS);
  assert.deepEqual(m.keywords, ["a", "b"]);
  assert.deepEqual(m.openGraph.images, [{ url: "/og.png" }]);
  assert.equal(m.twitter.card, "summary_large_image");
});

test("A06 the page's own metadata object is never changed", () => {
  const base = page();
  const before = JSON.stringify(base);
  applySeoOverride(base, { title: "T", description: "D", canonical: "/c", robots: "noindex, follow" }, EXTRAS);
  assert.equal(JSON.stringify(base), before);
});

test("F01 a route and its params give the page path the file is keyed by", () => {
  assert.equal(fillRoute("/"), "/");
  assert.equal(fillRoute("/about", {}), "/about");
  assert.equal(fillRoute("/guides/[slug]", { slug: "what-is-jev" }), "/guides/what-is-jev");
  assert.equal(fillRoute("/insights/[slug]/[postSlug]", { slug: "ai", postSlug: "rag" }), "/insights/ai/rag");
  assert.equal(fillRoute("/notebook/conference/[slug]/sessions/[sessionId]", { slug: "b", sessionId: "s1" }), "/notebook/conference/b/sessions/s1");
  assert.equal(fillRoute("/docs/[...parts]", { parts: ["a", "b"] }), "/docs/a/b");
  assert.equal(fillRoute("/docs/[[...parts]]", {}), "/docs");
});

test("M01 sitemap.xml leaves out pages an override sets to noindex or canonicalises elsewhere", () => {
  assert.equal(inSitemap("/about", undefined), true);
  assert.equal(inSitemap("/about", { title: "T" }), true);
  assert.equal(inSitemap("/about", { robots: "index, nofollow" }), true);
  assert.equal(inSitemap("/about", { robots: "noindex, follow" }), false);
  assert.equal(inSitemap("/about", { canonical: "/about" }), true);
  assert.equal(inSitemap("/about", { canonical: "https://venkatapagadala.com/about" }), true);
  assert.equal(inSitemap("/about", { canonical: "/contact" }), false);
  assert.equal(inSitemap("/", { canonical: "https://venkatapagadala.com" }), true);
});
