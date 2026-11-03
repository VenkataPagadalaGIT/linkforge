import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { forgetReads } from "@/lib/content-github";
import { verifyContentSignature } from "@/lib/content-signature";
import { NEWS_TAG } from "@/lib/news-source";
import { SEO_TAG } from "@/lib/seo-overrides";
import { BUSINESS_TAG } from "@/lib/business-source";
import { PAGE_PATH } from "@/lib/seo-validate";

/**
 * The only way in from outside: a signed "re-read published content" message
 * (docs/NO_DEPLOY_PUBLISHING.md). It carries no content. It can only make the
 * site re-read the repo's own files, for allowlisted tags, and re-render the
 * page paths it names.
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
  // Page SEO fields: every page that reads them carries the tag, and
  // sitemap.xml is built per request. The publisher also names the changed
  // pages in "paths".
  [SEO_TAG]: [],
  // Business Notebook: its pages, plus every surface that lists them
  [BUSINESS_TAG]: [
    { path: "/notebook/business" },
    { path: "/notebook/business/[slug]", type: "page" },
    { path: "/notebook/business/companies/[slug]", type: "page" },
    { path: "/notebook/business/people/[slug]", type: "page" },
    { path: "/sitemap" },
    { path: "/sitemap/[section]", type: "page" },
    { path: "/llms.txt" },
    { path: "/llms-full.txt" },
  ],
};
const MAX_PATHS = 200;

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
  let paths: unknown;
  try {
    ({ tags, paths } = JSON.parse(body) as { tags?: unknown; paths?: unknown });
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!Array.isArray(tags) || !tags.length || !tags.every((t) => typeof t === "string" && t in PATHS)) {
    return NextResponse.json({ error: `tags must be a non-empty list from: ${Object.keys(PATHS).join(", ")}` }, { status: 400 });
  }
  if (paths !== undefined && (!Array.isArray(paths) || paths.length > MAX_PATHS || !paths.every((p) => typeof p === "string" && PAGE_PATH.test(p)))) {
    return NextResponse.json({ error: `paths must be a list of up to ${MAX_PATHS} page paths such as /about` }, { status: 400 });
  }
  forgetReads();
  for (const tag of tags as string[]) {
    revalidateTag(tag);
    for (const { path, type } of PATHS[tag]) revalidatePath(path, type);
  }
  const pages = (paths as string[] | undefined) ?? [];
  for (const path of pages) revalidatePath(path);
  return NextResponse.json({ revalidated: tags, paths: pages.length, at: new Date(now).toISOString() });
}
