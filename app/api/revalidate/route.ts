import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyContentSignature } from "@/lib/content-signature";
import { NEWS_TAG } from "@/lib/news-source";

/**
 * The only way in from outside: a signed "re-read published content" message
 * (docs/NO_DEPLOY_PUBLISHING.md). It carries no content. It can only make the
 * site re-read the repo's own file, for an allowlisted tag.
 */
export const dynamic = "force-dynamic";

type PathToRefresh = { path: string; type?: "page" | "layout" };
const PATHS: Record<string, PathToRefresh[]> = {
  [NEWS_TAG]: [
    { path: "/ai-updates" },
    { path: "/ai-updates/[slug]", type: "page" },
    { path: "/ai-contributors/[id]", type: "page" },
    { path: "/sitemap.xml" },
    { path: "/sitemap" },
    { path: "/sitemap/[section]", type: "page" },
    { path: "/llms.txt" },
    { path: "/llms-full.txt" },
  ],
};

// A small in-process limit: a leaked secret can at most force re-reads.
const RATE_PER_MINUTE = 30;
let recent: number[] = [];

export async function POST(req: Request) {
  const body = await req.text();
  const now = Date.now();
  const verdict = verifyContentSignature({
    secret: process.env.CONTENT_REVALIDATE_SECRET,
    header: req.headers.get("x-content-signature"),
    body,
    nowMs: now,
  });
  if (!verdict.ok) {
    return NextResponse.json({ error: verdict.reason }, { status: verdict.reason === "not-configured" ? 503 : 401 });
  }
  recent = recent.filter((t) => now - t < 60_000);
  if (recent.length >= RATE_PER_MINUTE) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  recent.push(now);

  let tags: unknown;
  try {
    tags = (JSON.parse(body) as { tags?: unknown }).tags;
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!Array.isArray(tags) || !tags.length || !tags.every((t) => typeof t === "string" && t in PATHS)) {
    return NextResponse.json({ error: `tags must be a non-empty list from: ${Object.keys(PATHS).join(", ")}` }, { status: 400 });
  }
  for (const tag of tags as string[]) {
    revalidateTag(tag);
    for (const { path, type } of PATHS[tag]) revalidatePath(path, type);
  }
  return NextResponse.json({ revalidated: tags, at: new Date(now).toISOString() });
}
