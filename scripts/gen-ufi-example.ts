/**
 * gen-ufi-example.ts: the figures the User-First Intelligence guide quotes
 * from this site's own data, computed once and written to
 * src/data/ufiExample.ts.
 *
 * Why a generator: the guide reads three large sources (the LinkedIn archive,
 * the Pew corpus and the persona library). Importing them into the guide would
 * ship well over a megabyte of data to every reader's browser, and typing the
 * figures by hand would let them drift from the pages they describe. This
 * script reads the sources, does the arithmetic, and writes a small module.
 *
 * Usage: npx tsx scripts/gen-ufi-example.ts [--check]
 * --check renders without writing and exits 1 if the file on disk differs,
 * so preflight can refuse a guide whose figures went stale.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LINKEDIN_POSTS } from "../src/data/linkedinPostsData";
import { LINKEDIN_GRAPH } from "../src/data/linkedinGraphData";
import taxonomy from "../src/data/linkedinTaxonomy.json";
import { CORPUS_DOCUMENTS, CORPUS_METRICS } from "../src/data/corpus";
import { PERSONA_COUNTS, PERSONAS, PERSONAS_LAST_UPDATED } from "../src/data/personas";
import { FRAMEWORK_COUNTS, FRAMEWORK_VERSION } from "../src/data/personaFramework";
import { BRIGHTONSEO_2026, TALKS } from "../src/data/talks";
import { TRANSCRIPT } from "../src/data/brightonTranscript";
import { SUPPORT_POSTS, SUPPORT_TOTALS } from "../src/data/brightonSupport";
import { PHOTOS } from "../src/data/brightonPhotos";
import { authorRole, linkedPapers } from "../src/data/research";

const OUT = join(__dirname, "..", "src", "data", "ufiExample.ts");
const check = process.argv.includes("--check");

type TaxNode = { id: string; level: number; parent: string | null; label: string; slug: string };
const nodes = (taxonomy as { nodes: TaxNode[] }).nodes;
const byId = new Map(nodes.map((n) => [n.id, n]));
const areaOf = (id: string): TaxNode | undefined => {
  let n = byId.get(id);
  while (n && n.parent) n = byId.get(n.parent);
  return n;
};

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  const m = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return Math.round(m * 10) / 10;
}

/* ── LinkedIn: what one author publishes, against what the audience answers ── */

const posts = LINKEDIN_POSTS;
const withReactions = posts.filter((p) => typeof p.engagement?.reactions === "number");
const asOf = withReactions.map((p) => p.engagement!.asOf).sort().at(-1)!;
const windowStart = (() => {
  const d = new Date(`${asOf}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
})();
const inWindow = withReactions.filter((p) => p.date.slice(0, 10) > windowStart && p.date.slice(0, 10) <= asOf);
const byArea = new Map<string, number[]>();
for (const p of inWindow) {
  const areas = new Set(p.topics.map((t) => areaOf(t)?.id).filter((a): a is string => Boolean(a)));
  for (const a of areas) {
    if (!byArea.has(a)) byArea.set(a, []);
    byArea.get(a)!.push(p.engagement!.reactions as number);
  }
}
const overall = median(inWindow.map((p) => p.engagement!.reactions as number));
const rows = [...byArea.entries()]
  .map(([id, r]) => {
    const n = byId.get(id)!;
    return { id, label: n.label, slug: n.slug, posts: r.length, medianReactions: median(r) };
  })
  .sort((a, b) => b.posts - a.posts || a.label.localeCompare(b.label));
const dates = posts.map((p) => p.date.slice(0, 10)).sort();
const graphNodes = LINKEDIN_GRAPH.nodes as { type: string }[];

const UFI_LINKEDIN = {
  source: "/venkata-pagadala-universe",
  posts: posts.filter((p) => p.type === "post").length,
  articles: posts.filter((p) => p.type === "article").length,
  firstDate: dates[0],
  lastDate: dates.at(-1),
  areas: nodes.filter((n) => n.level === 1).length,
  topics: nodes.filter((n) => n.level === 2).length,
  subtopics: nodes.filter((n) => n.level === 3).length,
  entities: graphNodes.filter((n) => n.type === "entity").length,
  graphNodes: graphNodes.length,
  graphLinks: (LINKEDIN_GRAPH.links as unknown[]).length,
  reactionsAsOf: asOf,
  windowStart,
  windowPosts: inWindow.length,
  medianReactions: overall,
  rows,
};

/* ── Pew: who uses which platform, by age (U.S. adults) ── */

const PLATFORMS: [string, string][] = [
  ["youtube", "YouTube"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["whatsapp", "WhatsApp"],
  ["reddit", "Reddit"],
  ["snapchat", "Snapchat"],
  ["x", "X"],
];
const AGES = ["18-29", "30-49", "50-64", "65+"] as const;
const everUse = CORPUS_METRICS.find((m) => m.slug === "ever_use");
if (!everUse) throw new Error("corpus metric ever_use is missing");
const doc = CORPUS_DOCUMENTS.find((d) => d.slug === everUse.document);
if (!doc) throw new Error(`corpus document ${everUse.document} is missing`);
const UFI_PEW_AGE = {
  title: doc.title,
  url: doc.url,
  published: doc.published,
  sampleSize: doc.sampleSize,
  fieldStart: doc.fieldStart,
  fieldEnd: doc.fieldEnd,
  ages: AGES,
  rows: PLATFORMS.map(([id, label]) => {
    const v = (everUse.values as Record<string, Record<string, number>>)[id];
    if (!v) throw new Error(`no ever_use values for ${id}`);
    const byAge = AGES.map((a) => {
      if (typeof v[a] !== "number") throw new Error(`no ${a} value for ${id}`);
      return v[a];
    });
    return { id, label, all: v[""], byAge };
  }),
};

/* ── Personas on this site ── */

const UFI_PERSONAS = {
  personas: PERSONA_COUNTS.personas(),
  studies: PERSONA_COUNTS.studies(),
  measuredTraits: PERSONA_COUNTS.measured(),
  inferredTraits: PERSONA_COUNTS.inferred(),
  lastUpdated: PERSONAS_LAST_UPDATED,
  frameworkDimensions: FRAMEWORK_COUNTS.dimensions,
  frameworkFamilies: FRAMEWORK_COUNTS.families,
  frameworkVersion: FRAMEWORK_VERSION,
};

/* ── The first persona, as a card: every trait with its grade ── */

const first = PERSONAS[0];
const UFI_PERSONA_CARD = {
  slug: first.slug,
  name: first.name,
  segment: first.segment,
  traits: first.traits.map((t) => ({ label: t.label, value: t.value, grade: t.grade })),
};

/* ── The brightonSEO San Diego 2026 talk, where the method was first presented ── */

const T = BRIGHTONSEO_2026;
const UFI_TALK = {
  title: T.title,
  tagline: T.tagline,
  event: T.event,
  date: T.startDate.slice(0, 10),
  track: T.track,
  page: `/research-and-talks/${T.slug}`,
  deck: T.links.find((l) => l.url.includes("speakerdeck.com"))!.url,
  player: T.slidesPlayer,
  video: { poster: T.video.poster, post: T.video.linkedinPost!, embed: T.video.linkedinEmbed!, duration: T.video.duration },
  chapters: T.chapters,
};

/*
 * What was said on stage, word for word from the talk transcript. Each pick is
 * an exact substring of one paragraph the speaker said; a pick that is not
 * found, is found twice, or crosses an unclear [inaudible] stretch fails the run.
 */
const SAID_PICKS: Record<string, string> = {
  direction: "I'm not saying traditional tools are bad, but they're only good for direction. The volume is not a strategy.",
  oneUser: "I don’t care about volume. I care about, is there one user that is going to buy my product? I'm going to answer them.",
  sources: "So these four slides will be the most important slides in this entire presentation.",
  notText: "And content doesn't mean that textual content. It can be video, audio, podcast, newsletters, whatever it may be.",
  movingTarget: "It's a moving target. You need to find where your users are spending the most time.",
  painPoints: "None of the traditional tools tell a problem or pain points, but analyzing and classifying data tells that.",
  atScale: "When you're working for an enterprise, you need to build a system at scale that can be used by multiple users.",
};
const said = (text: string) => {
  const hits = TRANSCRIPT.flatMap((c) =>
    c.paragraphs.filter((p) => p.speaker === "venkata" && p.text.includes(text)).map((p) => ({ c, p })),
  );
  if (hits.length !== 1) throw new Error(`said: ${hits.length} matches for "${text.slice(0, 40)}"`);
  if (text.includes("[inaudible]")) throw new Error(`said: unclear speech in "${text.slice(0, 40)}"`);
  const { c, p } = hits[0];
  return { text, at: p.at, chapterAt: c.at, chapter: c.title };
};
const UFI_SAID = Object.fromEntries(Object.entries(SAID_PICKS).map(([k, v]) => [k, said(v)]));

/*
 * What practitioners said about it in public, from the thank-you page's
 * capture. Picked for what they say about the work itself, one post per
 * person; members-only posts carry no quote and can never be picked.
 */
const PEER_PICKS = [
  "7504229185645776896", // classification work
  "7505681691353640960", // think deeply about search
  "7506548990558175232", // "User First, Algorithm Second"
  "7503463479006085121", // early preview
  "7505171629438554112", // search volume is a direction
  "7504401287434747904", // how to think
  "7506940282844762112", // intent classification
  "7506779557631422464", // in the audience
];
const shortRole = (headline: string) => {
  const segs = headline.split(" | ").map((s) => s.replace(/…$/, "").trim()).filter(Boolean);
  let role = segs[0] ?? "";
  for (let i = 1; role.length < 12 && i < segs.length; i++) role += `, ${segs[i]}`;
  return role.replace(/\s+-\s+.*$/, "").replace(/,\s*ex\s.*$/i, "").replace(/\.\s.*$/, "") || undefined;
};
const UFI_PEERS = {
  captured: SUPPORT_TOTALS.captured,
  posts: SUPPORT_TOTALS.posts,
  authors: SUPPORT_TOTALS.authors,
  reactions: SUPPORT_TOTALS.theirReactions,
  comments: SUPPORT_TOTALS.theirComments,
  people: SUPPORT_TOTALS.people,
  items: PEER_PICKS.map((id) => {
    const p = SUPPORT_POSTS.find((s) => s.id === id);
    if (!p || !p.public || !p.quote) throw new Error(`peer pick ${id} is missing, members-only or has no quote`);
    return { author: p.author, role: shortRole(p.headline), quote: p.quote, url: p.url, date: p.posted.slice(0, 10) };
  }),
};

/* ── Stage photos: the talk only. The title-slide shot (employer logos on screen) and the expo selfie stay on the recap page. ── */

const PHOTO_PICKS = ["stage-pointing-to-audience", "track-1-stage", "view-from-audience", "speaking-clicker-in-hand", "agenda-slide", "speaking-close-up"];
const UFI_PHOTOS = PHOTO_PICKS.map((slug) => {
  const p = PHOTOS.find((x) => x.src.includes(`-${slug}.webp`));
  if (!p) throw new Error(`photo ${slug} not found`);
  return { src: p.srcSm, width: p.widthSm, height: p.heightSm, alt: p.alt, caption: p.caption };
});

/* ── Long-form conversations about the ideas, each with its YouTube recording ── */

const EPISODE_PICKS = ["previsible-voices-of-search-2026", "seo-video-show-ai-search-trust-2026", "ai-seo-show-enterprise-ai-seo", "free-coalition-ai-agents-2026"];
const UFI_EPISODES = EPISODE_PICKS.map((slug) => {
  const t = TALKS.find((x) => x.slug === slug);
  const yt = t?.links.find((l) => l.url.startsWith("https://www.youtube.com/watch?v="));
  if (!t || !yt || !t.thumb) throw new Error(`episode ${slug} is missing, or has no YouTube link or thumbnail`);
  return { title: t.title, outlet: t.outlet, date: t.date, minutes: t.minutes, summary: t.summary, youtubeId: new URL(yt.url).searchParams.get("v")!, thumb: t.thumb };
});

/* ── Published papers ── */

// Authorship is stated with position ("Co-author, 4 of 5") so a co-authored paper never reads as sole work.
const UFI_PAPERS = linkedPapers.map((p) => ({ title: p.title, venue: p.venue, year: p.year, url: p.url, review: p.review, role: authorRole(p), summary: p.summary }));

const body = `// GENERATED by scripts/gen-ufi-example.ts from the LinkedIn archive, the Pew
// corpus, the persona library and the talk records. Do not edit by hand; rerun the script.

export const UFI_LINKEDIN = ${JSON.stringify(UFI_LINKEDIN, null, 2)} as const;

export const UFI_PEW_AGE = ${JSON.stringify(UFI_PEW_AGE, null, 2)} as const;

export const UFI_PERSONAS = ${JSON.stringify(UFI_PERSONAS, null, 2)} as const;

export const UFI_PERSONA_CARD = ${JSON.stringify(UFI_PERSONA_CARD, null, 2)} as const;

export const UFI_TALK = ${JSON.stringify(UFI_TALK, null, 2)} as const;

export const UFI_SAID = ${JSON.stringify(UFI_SAID, null, 2)} as const;

export const UFI_PEERS = ${JSON.stringify(UFI_PEERS, null, 2)} as const;

export const UFI_PHOTOS = ${JSON.stringify(UFI_PHOTOS, null, 2)} as const;

export const UFI_EPISODES = ${JSON.stringify(UFI_EPISODES, null, 2)} as const;

export const UFI_PAPERS = ${JSON.stringify(UFI_PAPERS, null, 2)} as const;
`;

if (check) {
  const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (onDisk !== body) {
    console.error("src/data/ufiExample.ts is stale; run: npx tsx scripts/gen-ufi-example.ts");
    process.exit(1);
  }
  console.log("ufiExample.ts is current");
} else {
  writeFileSync(OUT, body);
  console.log(`wrote ${OUT}: ${UFI_LINKEDIN.windowPosts} posts in window, ${UFI_PEW_AGE.rows.length} platforms`);
}
