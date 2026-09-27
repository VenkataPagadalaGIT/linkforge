/**
 * Where the site reads news at runtime: the published copy of
 * content/ai-updates.json on the repo's `content` branch, so an article goes
 * live without a deploy (docs/NO_DEPLOY_PUBLISHING.md).
 *
 * - Cached under the "news" tag. The signed /api/revalidate message refreshes
 *   it within seconds of a publish; otherwise it is re-read every 5 minutes.
 * - A copy that fails the structure and safety checks is refused, and the
 *   last good copy keeps serving. With no good copy yet (the branch does not
 *   exist, GitHub is down), the copy built into the deploy serves.
 *
 * Environment (all optional):
 *   CONTENT_GITHUB_TOKEN  read-only token; raises GitHub's limit, required if the repo turns private
 *   CONTENT_REPO          default VenkataPagadalaGIT/linkforge
 *   CONTENT_BRANCH        default content
 *   CONTENT_SOURCE_URL    a different URL serving the raw JSON (tests), or "off" to use the built-in copy only
 */
import { unstable_cache } from "next/cache";
import { aiUpdates as builtIn, type AIUpdate } from "@/data/aiUpdates";
import { validateNews } from "@/lib/news-validate";

export const NEWS_TAG = "news";

function sourceUrl(): string | null {
  const override = (process.env.CONTENT_SOURCE_URL || "").trim();
  if (override.toLowerCase() === "off") return null;
  if (override) return override;
  const repo = process.env.CONTENT_REPO || "VenkataPagadalaGIT/linkforge";
  const branch = process.env.CONTENT_BRANCH || "content";
  return `https://api.github.com/repos/${repo}/contents/content/ai-updates.json?ref=${encodeURIComponent(branch)}`;
}

// The last copy that passed the checks, kept for this server process so a
// broken publish never takes live articles down.
let lastGood: AIUpdate[] | null = null;

async function readPublished(): Promise<AIUpdate[] | null> {
  const url = sourceUrl();
  if (!url) return null;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "venkatapagadala.com",
  };
  const token = process.env.CONTENT_GITHUB_TOKEN;
  if (token && url.startsWith("https://api.github.com/")) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return lastGood;
    const data: unknown = await res.json();
    const check = validateNews(data, undefined, false);
    if (!check.ok) {
      console.warn(`[news] published copy refused: ${check.issues.find((i) => i.level === "block")?.message}`);
      return lastGood;
    }
    lastGood = data as AIUpdate[];
    return lastGood;
  } catch {
    return lastGood;
  }
}

const cachedPublished = unstable_cache(readPublished, ["news-published-v1"], {
  tags: [NEWS_TAG],
  revalidate: 300,
});

/** Every news article, newest publish first (the file's order). */
export async function getNews(): Promise<AIUpdate[]> {
  try {
    return (await cachedPublished()) ?? builtIn;
  } catch {
    return builtIn;
  }
}

export async function getNewsArticle(slug: string): Promise<{ update: AIUpdate; prev: AIUpdate | null; next: AIUpdate | null } | null> {
  const all = await getNews();
  const i = all.findIndex((u) => u.slug === slug);
  if (i < 0) return null;
  return { update: all[i], prev: i > 0 ? all[i - 1] : null, next: i < all.length - 1 ? all[i + 1] : null };
}
