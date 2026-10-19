import "server-only";
/**
 * Server-only LinkedIn archive data: every post's full record, the article and
 * post lists, the topic lists and the counts. Pages and the site registry import
 * this; browser components never do (they use LINKEDIN_POST_REFS from
 * linkedinArchive.ts), so 900+ post records never ship to the browser.
 */
import { LINKEDIN_POSTS } from "./linkedinPostsData";
import { PUBLIC_ITEMS, TOPIC_META, topicLabel, topicSlug, type LiPost } from "./linkedinArchive";

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
    .map((q) => ({ q, n: q.topics.filter((t) => p.topics.includes(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || b.q.date.localeCompare(a.q.date))
    .slice(0, limit)
    .map((x) => x.q);
}

/**
 * Every topic that has a page ("Other" has none). Pages exist for all of them so
 * a URL never 404s once live; a topic that currently has no items renders noindex
 * and stays out of the site registry.
 */
export const ALL_LINKEDIN_TOPICS = Object.keys(TOPIC_META)
  .filter((id) => id !== "other")
  .map((id) => ({
    id,
    ...TOPIC_META[id],
    items: PUBLIC_ITEMS.filter((i) => i.topics.includes(id)),
    posts: LINKEDIN_ARTICLES.filter((p) => p.topics.includes(id)),
    socialPosts: LINKEDIN_SOCIAL_POSTS.filter((p) => p.topics.includes(id)),
  }));

/** Topics with at least one item or article, largest first: the ones listed and linked. */
export const LINKEDIN_TOPICS = ALL_LINKEDIN_TOPICS.filter((t) => t.items.length + t.posts.length + t.socialPosts.length > 0).sort((a, b) => b.items.length - a.items.length);

export const getLinkedInTopic = (slug: string) => ALL_LINKEDIN_TOPICS.find((t) => t.slug === slug);

const years = PUBLIC_ITEMS.map((i) => i.date.slice(0, 4)).sort();
export const LINKEDIN_COUNTS = {
  items: PUBLIC_ITEMS.length,
  images: PUBLIC_ITEMS.filter((i) => i.kind === "image").length,
  videos: PUBLIC_ITEMS.filter((i) => i.kind === "video").length,
  documents: PUBLIC_ITEMS.filter((i) => i.kind === "document").length,
  articles: LINKEDIN_ARTICLES.length,
  posts: LINKEDIN_SOCIAL_POSTS.length,
  topics: LINKEDIN_TOPICS.length,
  firstYear: years[0] ?? "",
  lastYear: years[years.length - 1] ?? "",
  years: [...new Set(years)].sort().reverse(),
};

