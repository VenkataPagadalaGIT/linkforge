import { getNode, nodes } from "@/data/aiOntology";
import { SITE_URL, feedFor, rss } from "@/lib/ai-feed";
import { entityPath } from "@/lib/graph-urls";

/**
 * GET /api/ai/entity/<id>/feed.xml: an RSS feed of what is new about one entity (filing events, deals, releases
 * from its official channels, this site's news), newest first. Follow it in any feed reader.
 */
export const dynamic = "force-static";
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return nodes.map((n) => ({ id: n.id }));
}

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const n = getNode(params.id);
  if (!n) return new Response("No such entity", { status: 404 });
  const xml = rss(
    `AI Intelligence Graph: ${n.name}`,
    `${SITE_URL}${entityPath(n.id)}`,
    `Filing events, deals, releases and news for ${n.name}, each linked to its source. Not investment advice.`,
    feedFor(n.id).slice(0, 50),
  );
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
