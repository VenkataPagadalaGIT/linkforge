import { EVENTS } from "@/data/events";
import { guides } from "@/data/guides";
import { rss, type FeedItem } from "@/lib/ai-feed";
import { getNews } from "@/lib/news-source";
import { SITE_URL } from "@/lib/site";

/** GET /rss.xml: what is new on the site, newest first. Generated from the same data as the pages, so it cannot go stale. */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const news = await getNews();
  const items: FeedItem[] = [
    ...news.map((u) => ({ id: `update-${u.slug}`, entity: "", date: u.date, kind: "news" as const, title: u.title, url: `${SITE_URL}/ai-updates/${u.slug}`, detail: u.summary })),
    ...Object.values(EVENTS).map((e) => ({ id: `event-${e.slug}`, entity: "", date: e.updatedAt.slice(0, 10), kind: "event" as const, title: e.title, url: `${SITE_URL}/notebook/events/${e.slug}`, detail: e.summary ?? "" })),
    ...guides.filter((g) => g.dateModified).map((g) => ({ id: `guide-${g.slug}`, entity: "", date: String(g.dateModified).slice(0, 10), kind: "post" as const, title: g.title, url: `${SITE_URL}/guides/${g.slug}`, detail: g.metaDescription ?? g.title })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);
  const xml = rss("Venkata Pagadala: what is new", SITE_URL, "News, event files and guides on AI and search, newest first.", items);
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
