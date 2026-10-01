/**
 * gen-brighton-md.ts: the markdown edition of the brightonSEO San Diego 2026
 * recap and thank-you page.
 *
 *   public/research-and-talks/brightonseo-san-diego-2026.md
 *
 * Usage: npx tsx scripts/gen-brighton-md.ts           write it
 *        npx tsx scripts/gen-brighton-md.ts --check   fail if it is stale (preflight)
 *
 * Built from the same modules the page renders (src/data/talks.ts,
 * brightonSupport.ts, brightonTranscript.ts, brightonPhotos.ts), so it cannot
 * say something the page does not, and it runs in the page's order: the
 * thank-you and its numbers, every name, the talk, the photos, the posts. The
 * full transcript with timestamps is the part an assistant most needs and the
 * HTML makes hardest to reach.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { BRIGHTONSEO_2026 as T, formatClock, formatTalkDate } from "../src/data/talks";
import { MY_TALK_POSTS, NEXT_TALK_POST, SUPPORT_POSTS, SUPPORT_TOTALS as N, THANK_YOU } from "../src/data/brightonSupport";
import { TRANSCRIPT, TRANSCRIPT_META } from "../src/data/brightonTranscript";
import { PHOTOS } from "../src/data/brightonPhotos";

const SITE = "https://venkatapagadala.com";
const PATH = "/research-and-talks/brightonseo-san-diego-2026";
const OUT = join(process.cwd(), "public", `${PATH.slice(1)}.md`);
const day = (iso: string) => formatTalkDate(iso.slice(0, 10));
const num = (v: number) => v.toLocaleString("en-US");

const L: string[] = [];
L.push("---");
L.push(`title: "brightonSEO San Diego 2026: Recap and Thank You"`);
L.push(`canonical: ${SITE}${PATH}`);
L.push(`talk: "${T.title} (${T.tagline})"`);
L.push(`event: "${T.event}, ${T.track}, ${formatTalkDate(T.startDate.slice(0, 10))}, 9:15 AM Pacific"`);
L.push(`speaker: Venkata Pagadala`);
if (N.captured) L.push(`linkedin_counts_as_of: ${N.captured}`);
L.push("---", "");
L.push("# brightonSEO 2026", "");
L.push(
  `On ${formatTalkDate(T.startDate.slice(0, 10))}, Venkata Pagadala spoke in ${T.track} at ${T.event}: "${T.title}" (${T.tagline}). This page is his thank-you: the numbers, the names, the video and photos, and every post, linked back to where it was written.`,
  "",
);
L.push(`HTML page: ${SITE}${PATH}`, "");

L.push("## Thank you to everyone behind these numbers", "");
const wall = SUPPORT_POSTS.filter((p) => p.phase !== "next");
if (wall.length) {
  L.push(
    `- ${num(N.reactions)} reactions on the ${num(N.talkPosts)} LinkedIn posts about the talk: ${num(N.myReactions)} on his ${N.myPosts} posts, ${num(N.theirReactions)} on the ${num(N.posts)} posts by others.`,
  );
  L.push(`- ${num(N.comments)} comments: ${num(N.myComments)} on his posts, ${num(N.theirComments)} on theirs.`);
  L.push(`- ${num(N.posts)} posts by ${num(N.authors)} people and pages named the talk: ${N.before} before, ${N.day} on the day, ${N.after} after.`);
  L.push(`- ${num(N.people)} people thanked by name.`);
  L.push(`- Counts as LinkedIn showed them on ${formatTalkDate(N.captured)}.`, "");
}
L.push(
  "To everyone who supported him, guided him directly, mentored him, and came to the session at brightonSEO: thank you. Some posted, commented and shared. Some guided him through the slides and the presentation. Some were in the room in Track 1.",
  "",
  "To Kelvin Newman, Carmen Aragones and the brightonSEO team. And to his mom, to whom the talk was dedicated.",
  "",
);

if (THANK_YOU.length) {
  L.push("## Everyone, by name", "", `${THANK_YOU.length} names, in alphabetical order, each with their LinkedIn.`, "");
  for (const t of THANK_YOU) L.push(`- ${t.name}: ${t.url}`);
  L.push("");
}

L.push("## The talk", "", T.summary, "");
for (const l of T.links) L.push(`- ${l.label}: ${l.internal ? SITE + l.url : l.url}`);
if (T.video.linkedinPost) L.push(`- Full recording (LinkedIn, ${Math.round(T.video.duration / 60)} minutes): ${T.video.linkedinPost}`);
L.push(`- Slides (Speaker Deck player): ${T.slidesPlayer}`);
L.push(`- Captions (WebVTT): ${SITE}${TRANSCRIPT_META.vtt}`, "");

if (PHOTOS.length) {
  L.push("## Photos", "");
  for (const p of PHOTOS) L.push(`- ${p.alt}. ${SITE}${p.src}`);
  L.push("");
}

if (wall.length) {
  L.push("## LinkedIn posts", "");
  for (const [id, title] of [["before", "Before the talk"], ["day", "On the day"], ["after", "After the talk"]] as const) {
    const posts = wall.filter((p) => p.phase === id);
    if (!posts.length) continue;
    L.push(`### ${title}`, "");
    for (const p of posts) {
      const who = p.headline ? `${p.author} (${p.headline})` : p.author;
      const counts = p.reactions !== null && p.comments !== null ? ` ${num(p.reactions)} reactions, ${num(p.comments)} comments.` : "";
      const words = p.quote ? ` "${p.quote}"` : " Shared with signed-in LinkedIn members only.";
      L.push(`- ${who}, ${day(p.posted)}:${words}${counts} ${p.url}`);
    }
    L.push("");
  }
}
if (MY_TALK_POSTS.length) {
  L.push("### Venkata's posts about the talk", "");
  for (const m of MY_TALK_POSTS) L.push(`- ${day(m.posted)}, ${m.label}: ${num(m.reactions)} reactions, ${num(m.comments)} comments. ${m.url}`);
  L.push("");
}

L.push("## Chapters", "");
for (const c of TRANSCRIPT) L.push(`- ${formatClock(c.at)} ${c.title}`);
L.push("");

L.push("## Transcript", "");
L.push(
  `${TRANSCRIPT_META.source}. ${num(TRANSCRIPT_META.words)} words. Timestamps are from the ${Math.round(TRANSCRIPT_META.duration / 60)}-minute recording. ${TRANSCRIPT_META.inaudible} unclear passages are marked [inaudible] rather than guessed. The first lines are the session host's introduction.`,
  "",
);
for (const c of TRANSCRIPT) {
  L.push(`### ${formatClock(c.at)} ${c.title}`, "");
  for (const p of c.paragraphs) L.push(`[${formatClock(p.at)}] ${p.speaker === "host" ? "Host: " : ""}${p.text}`, "");
}

if (NEXT_TALK_POST) {
  L.push("## What came next", "");
  L.push(`The FCDC Expert Series, 14 October 2026: building AI agents for marketing functions. ${NEXT_TALK_POST.url}`, "");
}

const md = L.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
if (md.includes("—")) throw new Error("em dash in the generated markdown");
if (process.argv.includes("--check")) {
  const now = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (now !== md) {
    console.error(`stale: ${OUT} does not match the data; run npx tsx scripts/gen-brighton-md.ts`);
    process.exit(1);
  }
  console.log(`${PATH}.md matches the data`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, md);
  console.log(`wrote ${OUT} (${md.split(/\s+/).length} words)`);
}
