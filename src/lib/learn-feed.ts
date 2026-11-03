import type { LearnFormat, LearnLevel, LearnPhase, LearnResource, LearnTopic } from "@/data/learnCatalog";

/**
 * Learn: the AI Roadmap and the AI Encyclopedia as a feed, in learning order. The reader's choices decide everything:
 * phase, topics, level, format, platform, free or not. The order is the curriculum's own, never engagement, because the
 * point is to learn faster. Types only from the catalog: the browser fetches the data from /feeds/learn.json.
 */
export interface LearnData {
  checkedAt: string;
  phases: LearnPhase[];
  topics: LearnTopic[];
  resources: LearnResource[];
}

export const FORMATS: { id: LearnFormat; label: string; plural: string }[] = [
  { id: "video", label: "Video", plural: "Videos" },
  { id: "course", label: "Course", plural: "Courses" },
  { id: "guide", label: "Guide", plural: "Guides" },
  { id: "book", label: "Book", plural: "Books" },
  { id: "paper", label: "Paper", plural: "Papers" },
  { id: "repo", label: "Repo", plural: "Repos" },
];
export const LEVELS: { id: LearnLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export interface LearnPrefs {
  /** "all", or one phase or Encyclopedia category. */
  phase: string;
  /** One topic to stay on, set by "Only", a link or a search. */
  only: string | null;
  /** Topics switched off. */
  off: string[];
  /** Levels switched on; empty means all. */
  levels: LearnLevel[];
  /** Formats switched on; empty means all. */
  formats: LearnFormat[];
  /** Platforms picked; empty means all. */
  platforms: string[];
  freeOnly: boolean;
}
export const DEFAULT_LEARN: LearnPrefs = { phase: "all", only: null, off: [], levels: [], formats: [], platforms: [], freeOnly: false };

export type LearnPost = { kind: "topic"; id: string; topic: LearnTopic; shown: number; images: string[] } | { kind: "res"; id: string; topic: LearnTopic; r: LearnResource };

export const byId = (d: LearnData) => new Map(d.resources.map((r) => [r.id, r]));
export const resourcesOf = (t: LearnTopic, res: Map<string, LearnResource>) => t.resources.map((id) => res.get(id)).filter((r): r is LearnResource => Boolean(r));

export const resourceFits = (r: LearnResource, p: LearnPrefs) => (!p.formats.length || p.formats.includes(r.format)) && (!p.freeOnly || !r.access) && (!p.platforms.length || p.platforms.includes(r.platform));
export const topicFits = (t: LearnTopic, p: LearnPrefs) =>
  p.only ? t.id === p.only : (p.phase === "all" || t.phase === p.phase) && !p.off.includes(t.id) && (!p.levels.length || p.levels.includes(t.difficulty));

/** The feed for these choices: each topic opens with its intro, then its sources; a source shows once, at its first topic. */
export function buildLearnFeed(d: LearnData, p: LearnPrefs, res = byId(d)): LearnPost[] {
  const used = new Set<string>();
  const out: LearnPost[] = [];
  for (const t of d.topics) {
    if (!topicFits(t, p)) continue;
    const list = resourcesOf(t, res).filter((r) => resourceFits(r, p) && !used.has(r.id));
    if (!list.length) continue;
    list.forEach((r) => used.add(r.id));
    out.push({ kind: "topic", id: `t-${t.id}`, topic: t, shown: list.length, images: list.map((r) => r.image).filter((x): x is string => Boolean(x)).slice(0, 6) });
    for (const r of list) out.push({ kind: "res", id: r.id, topic: t, r });
  }
  return out;
}

export function youtubeEmbed(y: { id?: string; list?: string } | undefined, muted: boolean, start = 0): string | null {
  if (!y) return null;
  const tail = `autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&rel=0&modestbranding=1${start ? `&start=${start}` : ""}`;
  if (y.id) return `https://www.youtube-nocookie.com/embed/${y.id}?${tail}${y.list ? `&list=${y.list}` : ""}`;
  if (y.list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${y.list}&${tail}`;
  return null;
}
