/**
 * Regenerate the research and talks block of public/llms.txt and
 * public/llms-full.txt from the site's own data.
 *
 * Both files carried a hand-written "Published Research" section that had
 * drifted into telling AI clients something false: it introduced an SSRN
 * preprint as a peer-reviewed paper, linked the journal paper through a
 * ResearchGate mirror instead of its DOI, and did not list the Springer paper
 * at all. A description that misleads an answer engine is worse than none, so
 * the section is now generated from src/data/research.ts and src/data/talks.ts
 * and replaced wholesale.
 *
 *   npx tsx scripts/gen-llms-research.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { linkedPapers, authorRole, GOOGLE_SCHOLAR_URL } from "../src/data/research";
import { BRIGHTONSEO_2026, TALKS, RECOGNITION, formatTalkDate } from "../src/data/talks";

const SITE = "https://venkatapagadala.com";

function section(): string {
  const L: string[] = [];
  L.push("## Research & Talks");
  L.push("");
  L.push("Peer-reviewed and preprint research on AI and search, conference talks, podcasts, interviews and recognition. Each item states its peer-review status and authorship position.");
  L.push(`- URL: ${SITE}/research-and-talks`);
  L.push(`- Full paper records: ${SITE}/publications`);
  L.push(`- Google Scholar: ${GOOGLE_SCHOLAR_URL}`);
  L.push("");
  L.push("### Papers");
  L.push("");
  for (const p of linkedPapers) {
    const status = p.review === "peer-reviewed" ? "Peer reviewed" : "Preprint, not peer reviewed";
    const where = [p.venue, p.volume ? `vol. ${p.volume}` : "", p.issue ? `no. ${p.issue}` : "", p.pageRange ? `pp. ${p.pageRange}` : ""]
      .filter(Boolean).join(", ");
    L.push(`- ${p.title} (${p.year}). ${status}. ${where}. ${authorRole(p)}. ${p.doiUrl ?? p.url}`);
  }
  L.push("");
  L.push("### Talks and workshops");
  L.push("");
  L.push(`- ${BRIGHTONSEO_2026.title} ("${BRIGHTONSEO_2026.tagline}"), ${BRIGHTONSEO_2026.event}, ${formatTalkDate(BRIGHTONSEO_2026.startDate.slice(0, 10))}, ${BRIGHTONSEO_2026.track}. ${BRIGHTONSEO_2026.summary} Session: ${BRIGHTONSEO_2026.links[0].url} Slides: ${BRIGHTONSEO_2026.links[1].url}`);
  for (const t of TALKS.filter((x) => x.kind === "workshop")) {
    L.push(`- ${t.title}, ${t.outlet}, ${formatTalkDate(t.date)}. ${t.summary}`);
  }
  L.push("");
  L.push("### Podcasts and interviews");
  L.push("");
  for (const t of TALKS.filter((x) => x.kind !== "workshop")) {
    const link = t.links[0]?.url ?? `${SITE}/research-and-talks#${t.slug}`;
    L.push(`- "${t.title}", ${t.outlet}, ${formatTalkDate(t.date)}${t.minutes ? `, ${t.minutes} min` : ""}. ${link}`);
  }
  L.push("");
  L.push("### Recognition");
  L.push("");
  for (const r of RECOGNITION) {
    L.push(`- ${r.claim} (${r.source}, ${r.date.slice(0, 4)}). ${r.url}`);
  }
  L.push("");
  return L.join("\n");
}

for (const file of ["public/llms.txt", "public/llms-full.txt"]) {
  const txt = readFileSync(file, "utf8");
  const heads = ["## Research & Talks", "## Published Research"];
  const at = heads.map((h) => txt.indexOf(h)).find((i) => i >= 0);
  if (at === undefined) throw new Error(`${file}: no research section to replace`);
  const next = txt.indexOf("\n## ", at + 5);
  const out = txt.slice(0, at) + section() + (next >= 0 ? txt.slice(next + 1) : "");
  writeFileSync(file, out);
  console.log(`${file}: research section regenerated`);
}
