/**
 * gen-research-md.ts: render the research surfaces to their markdown twins.
 *
 *   public/research-and-talks.md   the collection: talk, papers, media, recognition
 *   public/publications.md         the full paper records: abstracts, keywords, citations
 *
 * Usage: npx tsx scripts/gen-research-md.ts
 * Writes public/research-and-talks.md from src/data/research.ts and
 * src/data/talks.ts, the same two files the page renders from, so the twin
 * cannot drift into saying something the page does not.
 *
 * Why a twin at all: an agent fetching the HTML has to strip a nav, a footer
 * and a few hundred utility classes to reach eleven facts. The markdown is
 * those eleven facts. It also survives the case the site has hit before, where
 * a corporate proxy blocks .js and the rendered page arrives empty.
 *
 * What it must never do is improve on the page. Peer-review status, authorship
 * position, access, and the wording of every third-party claim are copied, not
 * paraphrased, because those are exactly the lines that get overstated.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  GOOGLE_SCHOLAR_URL,
  accessNote,
  authorRole,
  citationLine,
  linkedPapers,
  researchPapers,
} from "../src/data/research";
import {
  BRIGHTONSEO_2026,
  KIND_LABEL,
  RECOGNITION,
  TALKS,
  byDateDesc,
  formatClock,
  formatTalkDate,
} from "../src/data/talks";

const SITE = "https://venkatapagadala.com";
const PAGE = `${SITE}/research-and-talks`;
const out: string[] = [];
const push = (s = "") => out.push(s);

const peerReviewed = linkedPapers.filter((p) => p.review === "peer-reviewed");
const preprints = linkedPapers.filter((p) => p.review === "preprint");
const media = TALKS.filter((t) => t.kind !== "workshop").sort(byDateDesc);
const workshops = TALKS.filter((t) => t.kind === "workshop");

push("---");
push("type: Collection");
push("title: Research, Talks & Interviews");
push("person: Venkata Pagadala");
push(`canonical: ${PAGE}`);
push(`generated_from: src/data/research.ts, src/data/talks.ts`);
push(`generated_at: ${new Date().toISOString().slice(0, 10)}`);
push("---");
push();

push("# Research, Talks & Interviews");
push();
push(
  `${peerReviewed.length} peer-reviewed papers, ${preprints.length} preprint, ` +
    `${BRIGHTONSEO_2026.event}, ${media.length} podcasts, interviews and talks. ` +
    "Every item links to its source, and every claim is worded as its source words it.",
);
push();
push(`Canonical: ${PAGE}`);
push(`Google Scholar: ${GOOGLE_SCHOLAR_URL}`);
push();

push("## Contents");
push();
push(`- [Featured talk](#featured-talk): ${BRIGHTONSEO_2026.title}`);
push(`- [Research papers](#research-papers): ${linkedPapers.length}`);
if (workshops.length) push(`- [Talks & workshops](#talks--workshops): ${workshops.length}`);
push(`- [Podcasts & interviews](#podcasts--interviews): ${media.length}`);
push(`- [Recognition](#recognition): ${RECOGNITION.length}`);
push("- [Related](#related)");
push();

// ---------------------------------------------------------------- the talk
push("## Featured talk");
push();
push(`### ${BRIGHTONSEO_2026.title}`);
push();
push(`*${BRIGHTONSEO_2026.tagline}*`);
push();
push(
  `${BRIGHTONSEO_2026.event} · ${BRIGHTONSEO_2026.track} · ` +
    `${formatTalkDate(BRIGHTONSEO_2026.startDate.slice(0, 10))}, 9:15 AM · ${BRIGHTONSEO_2026.city} · 15 min edit`,
);
push();
push(BRIGHTONSEO_2026.summary);
push();
for (const l of BRIGHTONSEO_2026.links) {
  push(`- [${l.label}](${l.internal ? SITE + l.url : l.url})`);
}
push();
push("Chapters in the fifteen-minute edit:");
push();
for (const c of BRIGHTONSEO_2026.chapters) push(`- ${formatClock(c.at)} ${c.title}`);
push();
push(
  "The recording is not published yet. The chapter list above is the outline of " +
    "the talk as delivered, taken from the edit's own chapter file.",
);
push();

// -------------------------------------------------------------- the papers
push("## Research papers");
push();
for (const p of linkedPapers) {
  push(`### ${p.title}`);
  push();
  const status = p.review === "peer-reviewed" ? "Peer reviewed" : "Preprint, not peer reviewed";
  const access = accessNote(p);
  push(`- Status: ${status}`);
  push(`- Citation: ${citationLine(p)} (${p.year})`);
  if (p.authors) push(`- Authors: ${p.authors.join(", ")}${authorRole(p) ? ` (${authorRole(p)})` : ""}`);
  if (p.doiUrl) push(`- DOI: ${p.doiUrl}`);
  push(`- Publisher record: ${p.url}`);
  if (access) push(`- Access: ${access}`);
  if (p.license) push(`- Licence: ${p.license}`);
  if (p.keywords?.length) push(`- Keywords: ${p.keywords.join(", ")}`);
  push();
  push(p.abstract ?? p.summary);
  push();
}

const unlinked = researchPapers.filter((p) => p.url === "");
if (unlinked.length) {
  push("### Listed without a public link");
  push();
  push(
    "Published, but no public repository record has been supplied, so no URL is " +
      "given rather than a dead one:",
  );
  push();
  for (const p of unlinked) push(`- ${p.title}. ${p.venue}, ${p.year}.`);
  push();
}

// ----------------------------------------------------------- the workshops
if (workshops.length) {
  push("## Talks & workshops");
  push();
  for (const t of workshops) {
    push(`### ${t.title}`);
    push();
    push(`${t.outlet} · ${formatTalkDate(t.date)} · ${KIND_LABEL[t.kind]}`);
    push();
    push(t.summary);
    push();
    if (t.video?.src) push(`Recording: ${SITE}${t.video.src}`);
    push();
  }
  push(
    "The method from the talk, built as a tool: " +
      `[Audience Personas](${SITE}/personas). Build any audience and see where it ` +
      "actually is, with the margin of error drawn rather than hidden.",
  );
  push();
}

// ----------------------------------------------------- podcasts, interviews
push("## Podcasts & interviews");
push();
for (const t of media) {
  push(`### ${t.title}`);
  push();
  push(
    `${t.outlet} · ${formatTalkDate(t.date)} · ${KIND_LABEL[t.kind]}` +
      (t.minutes ? ` · ${t.minutes} min` : ""),
  );
  push();
  push(t.summary);
  push();
  for (const l of t.links) push(`- [${l.label}](${l.url})`);
  push();
}

// ------------------------------------------------------------- recognition
push("## Recognition");
push();
push("Each line says what its source says, and no more.");
push();
for (const r of RECOGNITION) {
  push(`### ${r.claim}`);
  push();
  push(`${r.source}${r.publishedOn ? ` on ${r.publishedOn}` : ""} · ${formatTalkDate(r.date)}`);
  push();
  if (r.quote) {
    push(`> ${r.quote}`);
    push();
  }
  push(`Source: ${r.url}`);
  push();
}

push("## Related");
push();
push(`- [Audience Personas](${SITE}/personas): build any audience and see where it is`);
push(`- [Publications](${SITE}/publications): full records, abstracts and keywords`);
push(`- [Conference Notebook](${SITE}/notebook/conference): talks and speakers tracked`);
push(`- [About](${SITE}/about)`);
push();

// ------------------------------------------------- the full record edition
// /publications is the record page: every paper the site claims, including the
// one with no public URL, with the abstract and the author's own keywords.
const rec: string[] = [];
const recPush = (s = "") => rec.push(s);

recPush("---");
recPush("type: Collection");
recPush("title: Published Research");
recPush("person: Venkata Pagadala");
recPush(`canonical: ${SITE}/publications`);
recPush("generated_from: src/data/research.ts");
recPush(`generated_at: ${new Date().toISOString().slice(0, 10)}`);
recPush("---");
recPush();
recPush("# Published Research");
recPush();
recPush(
  "Full records for every paper the site claims. Each one states its " +
    "peer-review status, its authorship position, and where the full text can " +
    "actually be read.",
);
recPush();
recPush(`Collection page: ${PAGE}`);
recPush(`Google Scholar: ${GOOGLE_SCHOLAR_URL}`);
recPush();
recPush("## Contents");
recPush();
for (const p of researchPapers) {
  const st = p.review === "peer-reviewed" ? "peer reviewed" : p.review === "preprint" ? "preprint" : "published";
  recPush(`- ${p.title} (${p.year}, ${st})`);
}
recPush();

for (const p of researchPapers) {
  recPush(`## ${p.title}`);
  recPush();
  const status =
    p.review === "peer-reviewed"
      ? "Peer reviewed"
      : p.review === "preprint"
        ? "Preprint, not peer reviewed"
        : "Published; review status not established here";
  recPush(`- Status: ${status}`);
  recPush(`- Citation: ${citationLine(p)} (${p.year})`);
  if (p.authors) recPush(`- Authors: ${p.authors.join(", ")}${authorRole(p) ? ` (${authorRole(p)})` : ""}`);
  if (p.affiliation) recPush(`- Affiliation at publication: ${p.affiliation}`);
  if (p.dateWritten) recPush(`- Date written: ${p.dateWritten}`);
  if (p.postedOnline) recPush(`- Posted online: ${p.postedOnline}`);
  if (p.pages) recPush(`- Length: ${p.pages} pages`);
  if (p.doiUrl) recPush(`- DOI: ${p.doiUrl}`);
  if (p.url) recPush(`- Publisher record: ${p.url}`);
  else recPush("- Publisher record: none supplied, so no link is given rather than a dead one");
  const acc = accessNote(p);
  if (acc) recPush(`- Access: ${acc}`);
  if (p.license) recPush(`- Licence: ${p.license}`);
  if (p.jel) recPush(`- JEL classification: ${p.jel}`);
  if (p.keywords?.length) recPush(`- Keywords: ${p.keywords.join(", ")}`);
  recPush();
  recPush(p.abstract ?? p.summary);
  recPush();
}

const TWINS: Array<[string, string]> = [
  ["research-and-talks.md", out.join("\n")],
  ["publications.md", rec.join("\n")],
];

// --check is the preflight gate: it proves the published twins still match the
// data rather than rewriting them. A twin nobody regenerates is the same
// failure as no twin, except it looks maintained.
const check = process.argv.includes("--check");
let stale = 0;
for (const [name, body] of TWINS) {
  const target = join(process.cwd(), "public", name);
  if (check) {
    const current = existsSync(target) ? readFileSync(target, "utf8") : "";
    if (current !== body) {
      console.error(`public/${name} is stale.`);
      stale++;
    } else {
      console.log(`public/${name} matches the data`);
    }
  } else {
    writeFileSync(target, body);
    console.log(`wrote public/${name} (${body.length} bytes)`);
  }
}
if (stale) {
  console.error("Run: npx tsx scripts/gen-research-md.ts");
  process.exit(1);
}
