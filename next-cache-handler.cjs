/**
 * The page cache (next.config.mjs `cacheHandler`): Next.js 14.2's own file
 * cache, with one change. When a signed content refresh (revalidateTag or
 * revalidatePath, see docs/NO_DEPLOY_PUBLISHING.md) marks a cached page
 * stale, the old page is served once and re-rendered in the background,
 * instead of a blocking re-render.
 *
 * Why: on a route limited to its known pages (dynamicParams = false), Next.js
 * 14.2 answers the blocking re-render with a 404 (NoFallbackError in
 * next/dist/server/base-server.js) and keeps answering 404 until the next
 * deploy. The whole-site refresh test (R02) found this on 516 pages:
 * contributors, encyclopedia concepts, conference pages, guides, guide topics,
 * solutions and site-map sections. Next.js's own comment in the stock get()
 * names this alternative: "if we want to be a background revalidation
 * instead we return data.lastModified = -1".
 *
 * Only pages change. Data entries (fetch, unstable_cache) keep the stock
 * behavior: a refreshed tag drops them at once, so the background re-render
 * reads the new content. Tests: tests/frontend/cache-handler.test.mjs.
 */
const FileSystemCache = require("next/dist/server/lib/incremental-cache/file-system-cache").default;
const { NEXT_META_SUFFIX, RSC_PREFETCH_SUFFIX, RSC_SUFFIX } = require("next/dist/lib/constants");

// The stock handler skips data entries over 2MB, but only when no custom
// handler is set (next/dist/server/lib/incremental-cache/index.js). Keep the
// same limit so switching this handler on changes nothing else.
const FETCH_ITEM_LIMIT = 2 * 1024 * 1024;

class ContentRefreshCache extends FileSystemCache {
  async get(key, ctx = {}) {
    const hit = await super.get(key, ctx);
    if (hit || ctx.kindHint !== "app" || !this.flushToDisk) return hit;
    return this.stalePage(key);
  }

  async set(key, data, ctx = {}) {
    if (ctx.fetchCache && JSON.stringify(data).length > FETCH_ITEM_LIMIT) return;
    return super.set(key, data, ctx);
  }

  /** The page still on disk, marked for a background re-render; null if
   *  there is none (a page never rendered, such as an unknown slug, stays a
   *  miss and keeps its 404). */
  async stalePage(key) {
    try {
      const htmlPath = this.getFilePath(`${key}.html`, "app");
      const html = await this.fs.readFile(htmlPath, "utf8");
      const suffix = this.experimental && this.experimental.ppr ? RSC_PREFETCH_SUFFIX : RSC_SUFFIX;
      const pageData = await this.fs.readFile(this.getFilePath(`${key}${suffix}`, "app"), "utf8");
      let meta = {};
      try {
        meta = JSON.parse(await this.fs.readFile(htmlPath.replace(/\.html$/, NEXT_META_SUFFIX), "utf8"));
      } catch {}
      return {
        lastModified: -1,
        value: { kind: "PAGE", html, pageData, postponed: meta.postponed, headers: meta.headers, status: meta.status },
      };
    } catch {
      return null;
    }
  }
}

module.exports = ContentRefreshCache;
