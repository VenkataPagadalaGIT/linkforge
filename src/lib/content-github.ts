/**
 * Reads the published copy of a content file from the repo's `content` branch
 * through the GitHub API, for every content type that goes live without a
 * deploy: news (src/lib/news-source.ts) and page SEO fields
 * (src/lib/seo-overrides.ts). See docs/NO_DEPLOY_PUBLISHING.md.
 *
 * One read per file per period for the whole server process. Next.js 14.2
 * gives the same cached read a different key in different page bundles (4 for
 * page SEO and 6 for news in the build of 2026-09-27), so without sharing,
 * each would ask GitHub on its own: up to about 76 requests an hour, past
 * GitHub's anonymous limit of 60. The signed refresh message clears the shared
 * reads (forgetReads) so a publish shows at once.
 *
 * Environment (all optional):
 *   CONTENT_GITHUB_TOKEN  read-only token; raises GitHub's limit, required if the repo turns private
 *   CONTENT_REPO          default VenkataPagadalaGIT/linkforge
 *   CONTENT_BRANCH        default content
 */

type Read = { at: number; ttl: number; result: Promise<unknown> };
type Shared = { reads: Map<string, Read>; good: Map<string, unknown> };
// On globalThis: the refresh route and the pages are separate bundles in one process.
const shared: Shared = ((globalThis as { __vpPublishedContent?: Shared }).__vpPublishedContent ??= {
  reads: new Map(),
  good: new Map(),
});
const RETRY_AFTER_FAILURE_MS = 60_000;

/** Where to read `file` (a repo path such as content/ai-updates.json).
 *  `override` is a URL serving the raw JSON (tests), or "off" for none. */
export function publishedFileUrl(file: string, override?: string): string | null {
  const o = (override || "").trim();
  if (o.toLowerCase() === "off") return null;
  if (o) return o;
  const repo = process.env.CONTENT_REPO || "VenkataPagadalaGIT/linkforge";
  const branch = process.env.CONTENT_BRANCH || "content";
  return `https://api.github.com/repos/${repo}/contents/${file}?ref=${encodeURIComponent(branch)}`;
}

/** Drop the shared reads, so the next read of every file asks GitHub. */
export function forgetReads(): void {
  shared.reads.clear();
}

// No `cache` option: this runs inside unstable_cache, which already makes
// nested fetches uncached. An explicit "no-store" would make Next.js 14.2
// treat a static page's re-render as dynamic and throw (patch-fetch.js), and
// the page would silently keep old content.
async function fetchJson(url: string, file: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "venkatapagadala.com",
  };
  const token = process.env.CONTENT_GITHUB_TOKEN;
  if (token && url.startsWith("https://api.github.com/")) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`[content] ${file}: GitHub answered ${res.status}; serving the last good copy, or the one built into the deploy`);
      return undefined;
    }
    return await res.json();
  } catch (e) {
    console.warn(`[content] ${file}: read failed (${(e as Error).message}); serving the last good copy, or the one built into the deploy`);
    return undefined;
  }
}

/**
 * The published copy of `file` that passes `problem` (which says why a copy
 * is refused, or returns null): the copy GitHub serves now; else the last
 * good copy this server process read; else null, and the caller serves the
 * copy built into the deploy. A good read is shared for `reuseMs`, a failed
 * one for a minute.
 */
export function readPublished(
  file: string,
  override: string | undefined,
  problem: (data: unknown) => string | null,
  reuseMs: number,
): Promise<unknown> {
  const url = publishedFileUrl(file, override);
  if (!url) return Promise.resolve(null);
  const recent = shared.reads.get(url);
  if (recent && Date.now() - recent.at < recent.ttl) return recent.result;
  const read: Read = { at: Date.now(), ttl: reuseMs, result: Promise.resolve(null) };
  read.result = fetchJson(url, file).then((data) => {
    const why = data === undefined ? "unreadable" : problem(data);
    if (!why) {
      shared.good.set(url, data);
      return data;
    }
    if (data !== undefined) console.warn(`[content] ${file}: published copy refused: ${why}`);
    read.ttl = Math.min(reuseMs, RETRY_AFTER_FAILURE_MS);
    return shared.good.get(url) ?? null;
  });
  shared.reads.set(url, read);
  return read.result;
}
