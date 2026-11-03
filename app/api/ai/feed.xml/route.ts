import { SITE_URL, feedAll, rss } from "@/lib/ai-feed";

/** GET /api/ai/feed.xml: what is new across the whole AI Intelligence Graph, newest first. */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const xml = rss(
    "AI Intelligence Graph: all of AI",
    `${SITE_URL}/notebook/ai/graph`,
    "Filing events, deals, releases and news across the AI economy, each linked to its source. Not investment advice.",
    feedAll(60),
  );
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
