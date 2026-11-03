import { NextResponse } from "next/server";
import { EVENTS } from "@/data/events";
import { LEARN_PHASES, LEARN_RESOURCES, LEARN_TOPICS } from "@/data/learnCatalog";
import { aiContributors } from "@/data/aiContributors";
import { guides } from "@/data/guides";
import { nodes } from "@/data/aiOntology";
import { logoUrl } from "@/data/aiLogos";
import { getStoryCards } from "@/lib/story-index";
import { entityPath } from "@/lib/graph-urls";
import type { SearchDoc } from "@/lib/feed-search";

// One file with everything the search box can find, read by the browser when someone opens search. Nothing is written by
// hand: it comes from the catalog, the stories and the graph. Order matters: a kind with no search words lists in this order.
export const dynamic = "force-dynamic";

async function docs(): Promise<SearchDoc[]> {
  const out: SearchDoc[] = [];
  const phase = new Map(LEARN_PHASES.map((p) => [p.id, p]));
  const firstTopic = new Map<string, (typeof LEARN_TOPICS)[number]>();
  for (const t of LEARN_TOPICS) {
    const p = phase.get(t.phase);
    const where = t.path === "roadmap" ? `AI Roadmap · Phase ${p?.n}: ${p?.label}` : `AI Encyclopedia · ${p?.label}`;
    out.push({ id: `topic-${t.id}`, kind: "topic", title: t.topic, sub: `${where} · ${t.difficulty} · ${t.resources.length} sources`, text: [t.description, ...(t.keyTerms ?? [])].join(" "), href: `/feeds/learn?topic=${t.id}`, level: t.difficulty, free: true, boost: t.path === "roadmap" ? 3 : 2 });
    for (const r of t.resources) if (!firstTopic.has(r)) firstTopic.set(r, t);
  }
  for (const r of LEARN_RESOURCES) {
    if (r.status === "dead") continue;
    const t = firstTopic.get(r.id);
    out.push({ id: r.id, kind: r.format, title: r.title, sub: [r.creator, t?.topic].filter(Boolean).join(" · "), text: t?.description, href: `/feeds/learn?p=${r.id}`, thumb: r.image, platform: r.platform, level: t?.difficulty, free: !r.access, url: r.url, youtube: r.youtube, noEmbed: r.noEmbed });
  }
  for (const s of await getStoryCards()) {
    out.push({ id: s.id, kind: "news", title: s.title, sub: [s.kicker, ...s.why].filter(Boolean).join(" · "), text: [s.summary, ...s.subjects].join(" "), href: s.feedHref ?? s.href, thumb: s.image, platform: "News", free: true, boost: Math.round(s.score * 6) + 2, date: s.date });
  }
  for (const g of guides) {
    out.push({ id: `guide-${g.slug}`, kind: "guide", title: g.title, sub: "Guide on this site", text: g.metaDescription, href: `/guides/${g.slug}`, platform: "This site", free: true, boost: 2 });
  }
  for (const c of aiContributors) {
    out.push({ id: `person-${c.id}`, kind: "person", title: c.name, sub: c.segment, text: c.bio, href: `/ai-contributors/${c.id}`, free: true });
  }
  for (const n of nodes) {
    out.push({ id: `company-${n.id}`, kind: "company", title: n.name, sub: n.tagline, text: n.story, href: entityPath(n.id), thumb: logoUrl(n.id) ?? undefined, free: true, boost: 1 });
  }
  for (const e of Object.values(EVENTS)) {
    for (const s of e.sources) {
      out.push({ id: `${e.slug}-s-${s.id}`, kind: "post", title: s.title, sub: `${e.title} · ${s.publisher || s.domain || s.platform}`, text: s.excerpt ?? undefined, href: `/feeds/${e.slug}?p=${encodeURIComponent(`s-${s.id}`)}`, thumb: s.thumb ?? undefined, platform: s.platform, url: s.url ?? undefined, date: s.date?.slice(0, 10) ?? undefined, free: true });
    }
    for (const c of e.claims) {
      out.push({ id: `${e.slug}-c-${c.key}`, kind: "post", title: c.claim, sub: `${e.title} · claim checked: ${c.verdict}`, text: c.explain, href: `/feeds/${e.slug}?p=${encodeURIComponent(`claim-${c.key}`)}`, free: true, boost: 1 });
    }
  }
  return out;
}

export async function GET() {
  return NextResponse.json(await docs(), { headers: { "Cache-Control": "public, max-age=300, must-revalidate" } });
}
