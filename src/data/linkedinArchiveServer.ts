import "server-only";
/**
 * Server-only LinkedIn archive data: every post's full record, the article and
 * post lists, every topic node with its entries, and the counts. Pages and the
 * site registry import this; browser components never do (they use the compact
 * entry index in linkedinArchive.ts), so full post records never ship to the browser.
 */
import { LINKEDIN_POSTS } from "./linkedinPostsData";
import {
  LINKEDIN_ENTRIES,
  PUBLIC_ITEMS,
  TOPIC_NODES,
  childTopics,
  getTopicBySlug,
  inTopic,
  topicCounts,
  type LiEntry,
  type LiPost,
  type LiTopicNode,
} from "./linkedinArchive";

export { LINKEDIN_POSTS };

/** Articles, newest first (drafts exist only in local preview data). */
export const LINKEDIN_ARTICLES: LiPost[] = LINKEDIN_POSTS.filter((p) => p.type === "article");
/** Posts (not articles), newest first. */
export const LINKEDIN_SOCIAL_POSTS: LiPost[] = LINKEDIN_POSTS.filter((p) => p.type === "post");
const postById = new Map(LINKEDIN_POSTS.map((p) => [p.id, p]));
export const getLinkedInPost = (id: string) => postById.get(id);

/** Articles (or posts) of the same type that share the most topics with this one. */
export function relatedPosts(p: LiPost, limit = 3) {
  return LINKEDIN_POSTS.filter((q) => q.id !== p.id && q.type === p.type)
    .map((q) => ({ q, n: q.topics.filter((t) => p.topics.includes(t)).length * 2 + q.subtopics.filter((t) => p.subtopics.includes(t)).length * 3 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || (b.q.engagement?.reactions ?? 0) - (a.q.engagement?.reactions ?? 0))
    .slice(0, limit)
    .map((x) => x.q);
}

export interface LinkedInTopicPage extends LiTopicNode {
  /** Entries under it (any level below counts), newest first. */
  entries: LiEntry[];
  posts: LiPost[];
  articles: LiPost[];
  /** Media items under it. */
  itemCount: number;
  children: (LiTopicNode & { count: number })[];
}

const COUNTS = topicCounts();
/**
 * Every topic node in the tree has a page. A node with no entries today still renders, noindex, so a live URL never
 * breaks; only nodes with entries are listed in the registry.
 */
export const ALL_LINKEDIN_TOPICS: LinkedInTopicPage[] = TOPIC_NODES.map((n) => {
  const entries = LINKEDIN_ENTRIES.filter((e) => inTopic(e, n.id));
  const keys = new Set(entries.map((e) => e.key));
  return {
    ...n,
    entries,
    posts: LINKEDIN_SOCIAL_POSTS.filter((p) => keys.has(`post:${p.id}`)),
    articles: LINKEDIN_ARTICLES.filter((p) => keys.has(`article:${p.id}`)),
    itemCount: PUBLIC_ITEMS.filter((i) => inTopic(i, n.id)).length,
    children: childTopics(n.id).map((c) => ({ ...c, count: COUNTS.get(c.id) ?? 0 })),
  };
});
/** Topics with at least one entry, in tree order: the ones listed and linked. */
export const LINKEDIN_TOPICS = ALL_LINKEDIN_TOPICS.filter((t) => t.entries.length > 0);
export const getLinkedInTopic = (slug: string) => {
  const n = getTopicBySlug(slug);
  return n ? ALL_LINKEDIN_TOPICS.find((t) => t.id === n.id) : undefined;
};

const years = LINKEDIN_ENTRIES.map((e) => e.date.slice(0, 4)).sort();
export const LINKEDIN_COUNTS = {
  entries: LINKEDIN_ENTRIES.length,
  items: PUBLIC_ITEMS.length,
  images: PUBLIC_ITEMS.filter((i) => i.kind === "image").length,
  videos: PUBLIC_ITEMS.filter((i) => i.kind === "video").length,
  documents: PUBLIC_ITEMS.filter((i) => i.kind === "document").length,
  articles: LINKEDIN_ARTICLES.length,
  posts: LINKEDIN_SOCIAL_POSTS.length,
  areas: LINKEDIN_TOPICS.filter((t) => t.level === 1).length,
  topics: LINKEDIN_TOPICS.filter((t) => t.level === 2).length,
  subtopics: LINKEDIN_TOPICS.filter((t) => t.level === 3).length,
  firstYear: years[0] ?? "",
  lastYear: years[years.length - 1] ?? "",
};
