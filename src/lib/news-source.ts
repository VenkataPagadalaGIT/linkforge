/**
 * Where the site reads news at runtime: the published copy of
 * content/ai-updates.json on the repo's `content` branch, so an article goes
 * live without a deploy (docs/NO_DEPLOY_PUBLISHING.md).
 *
 * - Cached under the "news" tag. The signed /api/revalidate message refreshes
 *   it within seconds of a publish; otherwise it is re-read every 5 minutes.
 * - A copy that fails the structure and safety checks is refused, and the
 *   last good copy keeps serving. With no good copy yet (the branch does not
 *   exist, GitHub is down), the copy built into the deploy serves. Reading and
 *   the last good copy are shared by the whole server (src/lib/content-github.ts).
 *
 * Environment (optional): CONTENT_SOURCE_URL, a different URL serving the raw
 * JSON (tests), or "off" to use the built-in copy only. The GitHub settings are
 * in src/lib/content-github.ts.
 */
import { unstable_cache } from "next/cache";
import { aiUpdates as builtIn, type AIUpdate } from "@/data/aiUpdates";
import { readPublished } from "@/lib/content-github";
import { validateNews } from "@/lib/news-validate";

export const NEWS_TAG = "news";

function problem(data: unknown): string | null {
  const check = validateNews(data, undefined, false);
  return check.ok ? null : check.issues.find((i) => i.level === "block")?.message ?? "refused";
}

async function readNews(): Promise<AIUpdate[] | null> {
  return (await readPublished("content/ai-updates.json", process.env.CONTENT_SOURCE_URL, problem, 300_000)) as AIUpdate[] | null;
}

const cachedPublished = unstable_cache(readNews, ["news-published-v1"], {
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
