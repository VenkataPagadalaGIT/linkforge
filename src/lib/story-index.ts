/**
 * Every story as one ranked, filed list: the news articles, the Business Notebook notes and the event files. Server only.
 * Reuses the front page's own stories (news-front.ts), so a story published without a deploy is in the feed at once.
 *
 * Built ahead for 10,000 stories (docs/FEEDS_ARCHITECTURE.md): stories are filed under subjects, ranked by one function
 * anyone can read (news-rank.ts), and sent to the browser as light cards; a story's hundreds of posts load only when
 * someone opens it.
 */
import { EVENTS } from "@/data/events";
import { getNews } from "@/lib/news-source";
import { getBusiness } from "@/lib/business-source";
import { buildFront, type FrontStory } from "@/lib/news-front";
import { rankReasons, rankScore, rankStories } from "@/lib/news-rank";
import { coverOf } from "@/components/feeds/cover";
import { logoUrl } from "@/data/aiLogos";
import { orgLogo } from "@/data/aiOrgLogos";
import type { AIUpdate } from "@/data/aiUpdates";

export interface StoryCard {
  id: string;
  kind: "event" | "update" | "note";
  title: string;
  summary: string;
  date: string;
  kicker: string;
  href: string;
  /** A story with its own feed of sources opens there. */
  feedHref?: string;
  image?: string;
  video?: { id: string };
  logos?: FrontStory["logos"];
  logo?: string;
  stat?: { value: string; label: string };
  subjects: string[];
  /** Searched, not shown. */
  tags: string[];
  /** The companies in the story, for a card with no picture. */
  marks: string[];
  sources: number;
  documents: number;
  claims: number;
  live: boolean;
  score: number;
  why: string[];
}

/** Subjects for an article, from its own words. An event file is filed by hand in the taxonomy. */
function subjectsOf(u: AIUpdate): string[] {
  const text = `${u.title} ${(u.tags ?? []).join(" ")}`;
  const out = new Set<string>();
  if (/acqui|buy|invest|\$\d|billion|valuation|funding|stake|settlement/i.test(text)) out.add("Companies & Deals");
  if (u.category === "policy" || /copyright|court|regulat|lawsuit|safety|alignment/i.test(text)) out.add("Regulation");
  if (/chip|gpu|vera rubin|hardware|dynamo|inference|semiconductor/i.test(text)) out.add("Semiconductors");
  if (/robot|autonomous|self-driving/i.test(text)) out.add("Robotics & Autonomous Vehicles");
  out.add("Artificial Intelligence");
  return [...out];
}

const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const markOf = (name?: string | null) => (name ? orgLogo(name) ?? logoUrl(slugOf(name)) : null);
/** Stories that share one video get different stills of it, so a run of them does not read as one post repeated. */
const STILLS = ["maxresdefault", "maxres1", "maxres2"];
/** A still that shows the story's own subject. */
const OWN_STILL: Record<string, string> = { "nvidia-dlss-5-ai-graphics-breakthrough": "maxres3" };
const youtubeId = (url?: string) => url?.match(/(?:youtu\.be\/|[?&]v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;

export async function getStoryCards(today = new Date().toISOString().slice(0, 10)): Promise<StoryCard[]> {
  const [updates, business] = await Promise.all([getNews(), getBusiness()]);
  const events = Object.values(EVENTS);
  const front = buildFront({ updates, business, events, today });
  const bySlug = new Map(updates.map((u) => [`update:${u.slug}`, u]));
  const notes = new Map(business.articles.map((a) => [`note:${a.slug}`, a]));
  const stillsUsed = new Map<string, number>();
  const still = (vid: string, slug: string) => {
    if (OWN_STILL[slug]) return `https://i.ytimg.com/vi/${vid}/${OWN_STILL[slug]}.jpg`;
    const n = stillsUsed.get(vid) ?? 0;
    stillsUsed.set(vid, n + 1);
    return `https://i.ytimg.com/vi/${vid}/${STILLS[n % STILLS.length]}.jpg`;
  };
  const cards: StoryCard[] = front.latest.map((s) => {
    const u = bySlug.get(s.id);
    const ev = s.kind === "event" ? EVENTS[s.id.replace("event:", "")] : undefined;
    const vid = youtubeId(u?.videoUrl);
    const signals = {
      date: s.date,
      sources: ev ? ev.sources.length : notes.get(s.id)?.sources?.length ?? 0,
      documents: u?.documents?.length ?? 0,
      claims: ev ? ev.claims.length : 0,
      live: ev ? today >= ev.window[0] && today <= ev.window[1] : false,
    };
    return {
      id: s.id,
      kind: s.kind,
      title: s.title,
      summary: s.summary,
      kicker: s.kicker,
      href: s.href,
      ...(ev ? { feedHref: `/feeds/${ev.slug}?all=1` } : {}),
      image: ev ? coverOf(ev) ?? undefined : vid && u ? still(vid, u.slug) : s.image?.src,
      ...(vid ? { video: { id: vid } } : {}),
      logos: s.logos,
      logo: s.logo?.src ?? markOf(u?.company) ?? undefined,
      tags: u?.tags ?? [],
      marks: Array.from(new Set([s.logo?.src, ...[u?.company, ...(u?.tags ?? [])].map(markOf)].filter((x): x is string => Boolean(x)))).slice(0, 4),
      stat: s.stat ? { value: s.stat.stat, label: s.stat.label } : ev ? (() => { const f = ev.facts.find((x) => x.key === "impact"); return f ? { value: f.value, label: f.label } : undefined; })() : undefined,
      subjects: ev ? Array.from(new Set((ev.subjects ?? []).map((t) => t.path[1] ?? t.path[0]))) : u ? subjectsOf(u) : ["Companies & Deals"],
      ...signals,
      score: rankScore(signals, today),
      why: rankReasons(signals, today),
    };
  });
  return rankStories(cards, today);
}
