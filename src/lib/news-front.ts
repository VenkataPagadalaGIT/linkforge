/**
 * news-front.ts: every news-like item on the site, arranged as one newspaper front page for /ai-updates, titled
 * "Tech & Business: News and Updates" (owner, 2026-10-30: "lets add all content, but in this style", pointing at a
 * newspaper home page). Three published sources feed it, so a story published without a deploy appears at once:
 * AI Updates (content/ai-updates.json), Business Notebook notes (content/business.json) and the event files.
 *
 * Server only. Nothing is copied: every story links to the page that owns it.
 */
import { CATEGORY_META, type AIUpdate, type UpdateDealLogo, type UpdateHighlight } from "@/data/aiUpdates";
import type { EventFile } from "@/data/events";
import type { BusinessFile } from "@/lib/business-validate";
import { namesOf } from "@/lib/business-source";
import { articleHref } from "@/lib/business-paths";
import { plainText } from "@/lib/business-validate";

export type FrontSectionId = "business" | "technology" | "research" | "policy" | "events";

export interface FrontStory {
  id: string;
  href: string;
  kind: "event" | "update" | "note";
  section: FrontSectionId;
  /** Small label above the headline: the company, the filing type, "Event file". */
  kicker: string;
  title: string;
  summary: string;
  /** yyyy-mm-dd */
  date: string;
  readMin?: number;
  image?: { src: string; alt: string; width: number; height: number };
  logos?: { left: UpdateDealLogo; right: UpdateDealLogo; connector?: string };
  logo?: { src: string; alt: string };
  stat?: UpdateHighlight;
}

export interface FrontLead extends FrontStory {
  live: boolean;
  numbers: { label: string; value: string }[];
  sourceCount: number;
  feedHref: string;
}

export interface FrontPage {
  lead: FrontLead | null;
  top: FrontStory[];
  sections: { id: FrontSectionId; title: string; stories: FrontStory[] }[];
  latest: FrontStory[];
  updatedAt: string;
}

const SECTION_TITLES: Record<FrontSectionId, string> = {
  business: "Business",
  technology: "Technology",
  research: "Research",
  policy: "Policy",
  events: "Event files",
};

const UPDATE_SECTION: Record<AIUpdate["category"], FrontSectionId> = {
  industry: "business",
  "product-launch": "technology",
  "open-source": "technology",
  research: "research",
  policy: "policy",
};

/** Video thumbnails kept in public/news/thumbs/<id>.jpg (a local copy, so a visit loads nothing from YouTube). */
const VIDEO_THUMBS = new Set(["jw_o0xr8MWU"]);

function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const byDateDesc = (a: FrontStory, b: FrontStory) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

function fromUpdates(updates: AIUpdate[]): FrontStory[] {
  // Several stories can share one video (seven GTC 2026 stories share the keynote). The thumbnail goes once, to
  // the fullest story about that video.
  const owner = new Map<string, AIUpdate>();
  for (const u of updates) {
    const id = youtubeId(u.videoUrl);
    if (!id || !VIDEO_THUMBS.has(id)) continue;
    const cur = owner.get(id);
    if (!cur || words(u.body) > words(cur.body)) owner.set(id, u);
  }
  return updates.map((u) => {
    const vid = youtubeId(u.videoUrl);
    const withThumb = vid && owner.get(vid)?.slug === u.slug;
    return {
      id: `update:${u.slug}`,
      href: `/ai-updates/${u.slug}`,
      kind: "update",
      section: UPDATE_SECTION[u.category] ?? "technology",
      kicker: u.company || CATEGORY_META[u.category]?.label || "",
      title: u.title,
      summary: u.summary,
      date: u.date,
      readMin: Math.max(1, Math.round(words(u.body) / 230)),
      image: withThumb ? { src: `/news/thumbs/${vid}.jpg`, alt: `Video: ${u.title}`, width: 480, height: 360 } : undefined,
      logos: u.dealLogos,
      stat: u.highlights?.[0],
    };
  });
}

function fromNotes(b: BusinessFile): FrontStory[] {
  const names = namesOf(b);
  const name = (target: string, ref: string) => names[target as keyof typeof names]?.[ref];
  return b.articles.map((a) => {
    const company = b.companies.find((c) => c.slug === a.company);
    return {
      id: `note:${a.slug}`,
      href: articleHref(a.slug),
      kind: "note",
      section: "business",
      kicker: [company?.name, a.kind].filter(Boolean).join(" · "),
      title: a.title,
      summary: plainText(a.summary, name),
      date: a.eventDate,
      logo: company?.logo?.url ? { src: company.logo.url, alt: "" } : undefined,
    };
  });
}

function fromEvents(events: EventFile[], today: string): FrontLead[] {
  return events.map((e) => {
    const pick = ["impact", "counted", "frozen"];
    const facts = (e.facts ?? []) as { key: string; label: string; value: string }[];
    const chosen = pick.map((k) => facts.find((f) => f.key === k)).filter(Boolean) as typeof facts;
    return {
      id: `event:${e.slug}`,
      href: `/notebook/events/${e.slug}`,
      kind: "event",
      section: "events",
      kicker: "Event file",
      title: e.title,
      summary: e.summary ?? "",
      date: e.updatedAt.slice(0, 10),
      live: today >= e.window[0] && today <= e.window[1],
      numbers: (chosen.length ? chosen : facts.slice(0, 3)).map((f) => ({ label: f.label, value: f.value })),
      sourceCount: (e.sources ?? []).length,
      feedHref: `/feeds/${e.slug}`,
    };
  });
}

/** The front page: the newest event file leads, the two newest other stories sit beside it, the rest by section. */
export function buildFront({ updates, business, events, today }: { updates: AIUpdate[]; business: BusinessFile; events: EventFile[]; today: string }): FrontPage {
  const leads = fromEvents(events, today).sort(byDateDesc);
  const lead = leads[0] ?? null;
  const stories = [...fromUpdates(updates), ...fromNotes(business)].sort(byDateDesc);
  const top = stories.slice(0, 2);
  const shown = new Set(top.map((s) => s.id));
  const rest = [...stories.filter((s) => !shown.has(s.id)), ...leads.slice(1)];
  const order: FrontSectionId[] = ["business", "technology", "research", "policy", "events"];
  const sections = order
    .map((id) => ({ id, title: SECTION_TITLES[id], stories: rest.filter((s) => s.section === id) }))
    .filter((s) => s.stories.length > 0);
  const latest = [...leads, ...stories].sort(byDateDesc);
  return { lead, top, sections, latest, updatedAt: latest[0]?.date ?? today };
}
