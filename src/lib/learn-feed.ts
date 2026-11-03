import { LEARN_RESOURCES, LEARN_TOPICS, type LearnFormat, type LearnLevel, type LearnResource, type LearnTopic } from "@/data/learnCatalog";

/**
 * Learn: the AI Roadmap as a feed, in learning order. The reader's choices decide everything: phase, topics, level,
 * format, free or not. The order is the roadmap's own, never engagement, because the point is to learn faster.
 */
export const FORMATS: { id: LearnFormat; label: string; plural: string }[] = [
  { id: "video", label: "Video", plural: "Videos" },
  { id: "course", label: "Course", plural: "Courses" },
  { id: "book", label: "Book", plural: "Books" },
  { id: "repo", label: "Repo", plural: "Repos" },
];
export const LEVELS: { id: LearnLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export interface LearnPrefs {
  /** "all" or one phase id: what the dial is on. */
  phase: string;
  /** One topic to stay on, set by "Only" or a link. */
  only: string | null;
  /** Topics switched off. */
  off: string[];
  /** Levels switched on; empty means all. */
  levels: LearnLevel[];
  /** Formats switched on; empty means all. */
  formats: LearnFormat[];
  freeOnly: boolean;
  view: "scroll" | "swipe";
  sound: boolean;
}
export const DEFAULT_LEARN: LearnPrefs = { phase: "all", only: null, off: [], levels: [], formats: [], freeOnly: false, view: "scroll", sound: true };

export type LearnPost =
  | { kind: "topic"; id: string; topic: LearnTopic; shown: number }
  | { kind: "res"; id: string; topic: LearnTopic; r: LearnResource }
  | { kind: "end"; id: "end" };

const RES = new Map(LEARN_RESOURCES.map((r) => [r.id, r]));
export const resourceById = (id: string) => RES.get(id);
export const liveResources = (t: LearnTopic) => t.resources.map((id) => RES.get(id)).filter((r): r is LearnResource => Boolean(r) && r!.status !== "dead");

export function youtubeThumb(r: LearnResource): string | null {
  return r.youtube?.id ? `https://i.ytimg.com/vi/${r.youtube.id}/hqdefault.jpg` : null;
}
export function youtubeEmbed(r: LearnResource): string | null {
  if (r.noEmbed || !r.youtube) return null;
  const { id, list } = r.youtube;
  if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${list ? `&list=${list}` : ""}`;
  if (list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&autoplay=1&rel=0`;
  return null;
}

export const resourceFits = (r: LearnResource, p: Pick<LearnPrefs, "formats" | "freeOnly">) => (!p.formats.length || p.formats.includes(r.format)) && (!p.freeOnly || !r.access);
export const topicFits = (t: LearnTopic, p: Pick<LearnPrefs, "phase" | "only" | "off" | "levels">) =>
  p.only ? t.id === p.only : (p.phase === "all" || t.phase === p.phase) && !p.off.includes(t.id) && (!p.levels.length || p.levels.includes(t.difficulty));

/** The feed for these choices: each topic opens with its intro, then its resources; a resource shows once, at its first topic. */
export function buildLearnFeed(p: LearnPrefs): LearnPost[] {
  const used = new Set<string>();
  const out: LearnPost[] = [];
  for (const t of LEARN_TOPICS) {
    if (!topicFits(t, p)) continue;
    const res = liveResources(t).filter((r) => resourceFits(r, p) && !used.has(r.id));
    if (!res.length) continue;
    res.forEach((r) => used.add(r.id));
    out.push({ kind: "topic", id: `t-${t.id}`, topic: t, shown: res.length });
    for (const r of res) out.push({ kind: "res", id: r.id, topic: t, r });
  }
  if (out.length) out.push({ kind: "end", id: "end" });
  return out;
}

/** Where a shared or searched post lives, so a link to it can open the right place whatever the reader's filters are. */
export function topicOfResource(id: string): LearnTopic | undefined {
  return LEARN_TOPICS.find((t) => t.resources.includes(id));
}
