// What is new about an entity, newest first: filing events, deals, releases and
// posts from official channels, and this site's AI news. Shared by the RSS
// feeds (app/api/ai/.../feed.xml) and the watchlist's "new since you looked".

import { getNode, newsFor, nodes } from "@/data/aiOntology";
import { AI_INTEL } from "@/data/aiIntel";
import { dealAmount } from "@/components/ai/intelModel";
import { entityPath } from "@/lib/graph-urls";

export interface FeedItem {
  id: string;
  entity: string;
  date: string;
  kind: "event" | "deal" | "post" | "news";
  title: string;
  url: string;
  detail: string;
}

const SITE = "https://venkatapagadala.com";
const SIDE: Record<string, string> = { buys: "buys from", sells: "sells to", receives: "is funded by", provides: "backs" };

export function feedFor(id: string): FeedItem[] {
  const n = getNode(id);
  if (!n) return [];
  const intel = AI_INTEL[id];
  const page = `${SITE}${entityPath(id)}`;
  const out: FeedItem[] = [];
  for (const e of intel?.events ?? [])
    out.push({ id: `ev:${id}:${e.date}:${e.headline}`, entity: id, date: e.date, kind: "event", title: `${n.name}: ${e.headline}`, url: e.url ?? page, detail: e.dateLabel ?? e.date });
  for (const d of intel?.deals ?? [])
    if (d.announcedOn)
      out.push({
        id: `deal:${d.id}:${id}`,
        entity: id,
        date: d.announcedOn,
        kind: "deal",
        title: `${n.name} ${SIDE[d.side] ?? d.side} ${d.counterpartyName}: ${dealAmount(d)}`,
        url: d.evidence[0]?.url ?? page,
        detail: d.summary,
      });
  for (const p of intel?.posts ?? [])
    if (p.publishedOn)
      out.push({ id: `post:${p.url}`, entity: id, date: p.publishedOn, kind: "post", title: `${n.name}: ${p.title ?? p.url}`, url: p.url, detail: p.summary });
  for (const u of newsFor(id))
    out.push({ id: `news:${u.id}`, entity: id, date: u.date, kind: "news", title: u.title, url: `${SITE}/ai-updates/${u.slug}`, detail: u.summary });
  // Same story from two routes (a deal and its event): keep the first.
  const seen = new Set<string>();
  return out
    .filter((x) => (seen.has(x.title) ? false : (seen.add(x.title), true)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Everything across the graph, newest first; at most two releases per company, so filings and news stay visible. */
export function feedAll(limit = 60): FeedItem[] {
  const ids = new Set([...Object.keys(AI_INTEL)]);
  const all: FeedItem[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    let posts = 0;
    for (const it of feedFor(id)) {
      if (seen.has(it.id) || (it.kind === "post" && ++posts > 2)) continue;
      seen.add(it.id);
      all.push(it);
    }
  }
  // Site news not tied to an entity with a file still belongs in the all-of-AI feed.
  for (const n of nodes) for (const it of feedFor(n.id).filter((x) => x.kind === "news")) if (!seen.has(it.id)) (seen.add(it.id), all.push(it));
  return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toUTCString();

export function rss(title: string, link: string, description: string, items: FeedItem[]): string {
  const body = items
    .map(
      (it) =>
        `<item><title>${esc(it.title)}</title><link>${esc(it.url)}</link><guid isPermaLink="false">${esc(it.id)}</guid>` +
        `<pubDate>${rfc822(it.date)}</pubDate><category>${it.kind}</category><description>${esc(it.detail)}</description></item>`,
    )
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(title)}</title><link>${esc(link)}</link>` +
    `<description>${esc(description)}</description><language>en</language>${body}</channel></rss>`
  );
}

export const feedUrl = (id: string) => `/api/ai/entity/${id}/feed.xml`;
export const SITE_URL = SITE;
