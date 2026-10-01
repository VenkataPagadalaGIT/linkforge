/**
 * guideTopics.ts: the topic-hub layer over guides.ts.
 *
 * Every guide carries `tags`. This module turns those tags into a real,
 * crawlable taxonomy: one static page per topic at /guides/topics/<slug>,
 * listing every guide that carries it. Nothing here is hand-authored beyond
 * the slug function; add a tag to a guide and its hub page, its entry in the
 * sidebar, and its sitemap row all follow with zero other edits.
 *
 * Why this exists: a flat list on /guides works for 6 guides. It stops
 * working, and stops being crawlable in any organized way, well before 10,000.
 * The fix is the standard topic-cluster pattern: hub pages that group content
 * by subject, linked from a persistent side menu on every guide-family page,
 * so a reader (or a crawler, or an agent) is never more than one click from
 * "everything else like this" and no guide is reachable only by knowing its
 * exact URL in advance. That is also what "no orphan URLs at scale" means in
 * practice: every guide's tags are a set of hub pages that already list it,
 * and every hub page is already linked from the sidebar this module powers.
 */
import { guides, type Guide } from "./guides";

export const topicSlug = (tag: string): string =>
  tag
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export interface GuideTopic {
  slug: string;
  /** The tag exactly as guides.ts spells it; the page heading and menu label. */
  label: string;
  guides: Guide[];
}

// /guides/topics is the A to Z index; a guide with that slug would be shadowed
// by it and silently unreachable, so the build refuses instead.
if (guides.some((g) => g.slug === "topics")) throw new Error('guideTopics: no guide may use the slug "topics"');

/** One entry per distinct tag across every guide, alphabetized by label. */
export const GUIDE_TOPICS: GuideTopic[] = (() => {
  const bySlug = new Map<string, GuideTopic>();
  for (const g of guides) {
    for (const tag of g.tags) {
      const slug = topicSlug(tag);
      const existing = bySlug.get(slug);
      if (existing) {
        // A second, differently-cased or -spaced tag colliding on the same
        // slug would silently merge two topics into one; fail loudly instead
        // of losing a topic at build time.
        if (existing.label !== tag) {
          throw new Error(`guideTopics: "${existing.label}" and "${tag}" both slugify to "${slug}"`);
        }
        existing.guides.push(g);
      } else {
        bySlug.set(slug, { slug, label: tag, guides: [g] });
      }
    }
  }
  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label));
})();

export const getTopicBySlug = (slug: string): GuideTopic | undefined => GUIDE_TOPICS.find((t) => t.slug === slug);

/** Every guide's own tags, resolved to {label, slug} pairs, in the guide's declared order. */
export const topicsForGuide = (g: Pick<Guide, "tags">): { label: string; slug: string }[] =>
  g.tags.map((tag) => ({ label: tag, slug: topicSlug(tag) }));
