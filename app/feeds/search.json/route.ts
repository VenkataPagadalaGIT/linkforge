import { NextResponse } from "next/server";
import { EVENTS } from "@/data/events";
import { LEARN_PHASES, LEARN_RESOURCES, LEARN_TOPICS } from "@/data/learnCatalog";
import { youtubeThumb } from "@/lib/learn-feed";
import type { SearchDoc } from "@/lib/feed-search";

// One static file with everything the feeds' search box can find. Built with the site, read by the browser when someone
// opens search, so the page itself stays light. Nothing here is written by hand: it comes from the catalog and the stories.
export const dynamic = "force-static";

function docs(): SearchDoc[] {
  const out: SearchDoc[] = [];
  const phase = new Map(LEARN_PHASES.map((p) => [p.id, p]));
  const firstTopic = new Map<string, string>();
  for (const t of LEARN_TOPICS) {
    const p = phase.get(t.phase);
    out.push({ id: `topic-${t.id}`, kind: "topic", title: t.topic, sub: `Week ${t.week} · Phase ${p?.n}: ${p?.label} · ${t.difficulty}`, text: t.description, href: `/feeds/learn?topic=${t.id}` });
    for (const r of t.resources) if (!firstTopic.has(r)) firstTopic.set(r, t.topic);
  }
  for (const r of LEARN_RESOURCES) {
    if (r.status === "dead") continue;
    out.push({ id: r.id, kind: r.format, title: r.title, sub: [r.creator, firstTopic.get(r.id)].filter(Boolean).join(" · "), href: `/feeds/learn?p=${r.id}`, thumb: youtubeThumb(r) ?? undefined });
  }
  for (const e of Object.values(EVENTS)) {
    for (const s of e.sources) {
      out.push({ id: `${e.slug}-s-${s.id}`, kind: "post", title: s.title, sub: `${e.title} · ${s.publisher || s.domain || s.platform}`, text: s.excerpt ?? undefined, href: `/feeds/${e.slug}?p=${encodeURIComponent(`s-${s.id}`)}`, thumb: s.thumb ?? undefined });
    }
    for (const c of e.claims) {
      out.push({ id: `${e.slug}-c-${c.key}`, kind: "post", title: c.claim, sub: `${e.title} · claim checked: ${c.verdict}`, text: c.explain, href: `/feeds/${e.slug}?p=${encodeURIComponent(`claim-${c.key}`)}` });
    }
  }
  return out;
}

export function GET() {
  return NextResponse.json(docs(), {
    headers: { "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=300, must-revalidate" },
  });
}
