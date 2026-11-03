/**
 * Titles and meta descriptions for every LinkedIn post and article page of Venkata Pagadala - Universe, within the
 * owner's lengths (cms/rules.json, via src/lib/seoText.ts) and unique across both kinds: a post that shares an
 * article's title or opening (the post announcing it) must not collide with it. Made once, articles first, then posts
 * oldest first; a title or description already taken gets the day, then a running number.
 * Server only (it reads the full post records).
 */
import { LINKEDIN_ARTICLES, LINKEDIN_SOCIAL_POSTS } from "./linkedinArchiveServer";
import { UNIVERSE_NAME, formatDay, topicLabel, type LiPost } from "./linkedinArchive";
import { fitDescription, fitTitle } from "@/lib/seoText";

const SUFFIXES = [` · ${UNIVERSE_NAME}`, " · Venkata Pagadala"];
const count = (n: number | undefined, w: string) => (n ? `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}` : "");

/** The first candidate nobody has taken yet (the candidates end in an endless numbered run). */
function take(seen: Set<string>, candidates: Iterable<string>) {
  for (const c of candidates) {
    if (seen.has(c)) continue;
    seen.add(c);
    return c;
  }
  throw new Error("unreachable");
}

const SEO = (() => {
  const titles = new Set<string>(), descriptions = new Set<string>();
  const out = new Map<string, { title: string; description: string }>();
  const posts = [...LINKEDIN_SOCIAL_POSTS].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const p of [...LINKEDIN_ARTICLES, ...posts]) {
    const article = p.type === "article";
    const day = formatDay(p.date.slice(0, 10));
    const topics = p.topics.slice(0, 2).map(topicLabel).join(" and ");
    const stats = [count(p.engagement?.reactions, "reaction"), count(p.engagement?.comments, "comment")].filter(Boolean).join(", ");
    const tail = article
      ? [`An article by Venkata Pagadala, first published on LinkedIn on ${day} and kept here in full`, topics && `On ${topics}`, `With its images, in ${UNIVERSE_NAME}`]
      : [`A LinkedIn post by Venkata Pagadala, ${day}`, topics && `On ${topics}`, stats && `${stats} on LinkedIn`, `Kept in full with its media and engagement, in ${UNIVERSE_NAME}`, "Read it here, or see the original on LinkedIn"];
    const lead = p.excerpt || p.title;
    const title = take(
      titles,
      (function* () {
        yield fitTitle(p.title, SUFFIXES);
        yield fitTitle(p.title, [` (${day}) · Venkata Pagadala`, ` (${day})`]);
        for (let k = 2; ; k++) yield fitTitle(p.title, [` (${day}, ${k})`]);
      })(),
    );
    const description = take(
      descriptions,
      (function* () {
        yield fitDescription(lead, ...tail);
        yield fitDescription(`${day}: ${lead}`, ...tail);
        for (let k = 2; ; k++) yield fitDescription(`${day} (${k}): ${lead}`, ...tail);
      })(),
    );
    out.set(`${p.type}:${p.id}`, { title, description });
  }
  return out;
})();

/** The page title and meta description of a post or article. */
export const seoFor = (p: Pick<LiPost, "type" | "id">) => SEO.get(`${p.type}:${p.id}`)!;
