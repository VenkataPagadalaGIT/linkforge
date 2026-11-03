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

const youtubeId = (url?: string) => url?.match(/(?:youtu\.be\/|[?&]v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;

export async function getStoryCards(today = new Date().toISOString().slice(0, 10)): Promise<StoryCard[]> {
  const [updates, business] = await Promise.all([getNews(), getBusiness()]);
  const events = Object.values(EVENTS);
  const front = buildFront({ updates, business, events, today });
  const bySlug = new Map(updates.map((u) => [`update:${u.slug}`, u]));
  const cards: StoryCard[] = front.latest.map((s) => {
    const u = bySlug.get(s.id);
    const ev = s.kind === "event" ? EVENTS[s.id.replace("event:", "")] : undefined;
    const vid = youtubeId(u?.videoUrl);
    const signals = {
      date: s.date,
      sources: ev ? ev.sources.length : 0,
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
      ...(ev ? { feedHref: `/feeds/${ev.slug}` } : {}),
      image: ev ? coverOf(ev) ?? undefined : s.image?.src ?? (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : undefined),
      ...(vid ? { video: { id: vid } } : {}),
      logos: s.logos,
      logo: s.logo?.src,
      stat: s.stat ? { value: s.stat.stat, label: s.stat.label } : ev ? (() => { const f = ev.facts.find((x) => x.key === "impact"); return f ? { value: f.value, label: f.label } : undefined; })() : undefined,
      subjects: ev ? Array.from(new Set((ev.subjects ?? []).map((t) => t.path[1] ?? t.path[0]))) : u ? subjectsOf(u) : ["Companies & Deals"],
      ...signals,
      score: rankScore(signals, today),
      why: rankReasons(signals, today),
    };
  });
  return rankStories(cards, today);
}
