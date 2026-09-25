/**
 * discovery.ts: the machine-readable surfaces, rendered from one registry.
 *
 * /sitemap.xml, the HTML site map (/sitemap), /llms.txt, /llms-full.txt and
 * the OKF site index (/okf/site-index.md) all list the pages that
 * src/lib/siteIndex.ts enumerates. Nothing here is hand-maintained except the
 * narrative prose in src/content/llms.md and src/content/llms-full.md; every
 * section that names pages (guides, topics, updates, research, the page index)
 * is rendered from data, so a page added to the registry appears on every
 * surface at the next build with no second edit, and backend-served content
 * (AI updates, insights) within the hour. See docs/SITE_DISCOVERY.md.
 *
 * The llms files used to be static, patched by three scripts. Anything added
 * without running them went stale: on 2026-09-25 llms.txt listed 5 of 14 AI
 * updates, llms-full.txt 1 of 7 guides, and the OKF guides index 5 of 7.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSections, getSiteIndex, type SiteEntry } from "@/lib/siteIndex";
import { guides } from "@/data/guides";
import { GUIDE_TOPICS } from "@/data/guideTopics";
import { aiUpdates } from "@/data/aiUpdates";
import { linkedPapers, accessNote, authorRole, citationLine, GOOGLE_SCHOLAR_URL } from "@/data/research";
import { BRIGHTONSEO_2026, TALKS, RECOGNITION, formatTalkDate } from "@/data/talks";
import { SUPPORT_TOTALS } from "@/data/brightonSupport";

/** Machine files always name the canonical host, whatever host renders them. */
export const CANONICAL = "https://venkatapagadala.com";
const abs = (href: string) => `${CANONICAL}${href === "/" ? "" : href}`;
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso?: string) => (iso && /^\d{4}-\d{2}/.test(iso) ? `${MONTH[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : "");

function discoverySection(): string {
  return [
    "## Discovery surfaces",
    "",
    "Every page on this site is listed in one registry that feeds all of these, so they always agree:",
    `- HTML site map, with a view per section: ${CANONICAL}/sitemap`,
    `- XML sitemap: ${CANONICAL}/sitemap.xml`,
    `- This guide for AI agents: ${CANONICAL}/llms.txt`,
    `- Every page with its title, by section: ${CANONICAL}/llms-full.txt`,
    `- Open Knowledge Format bundle: ${CANONICAL}/okf/index.md (every page: ${CANONICAL}/okf/site-index.md)`,
  ].join("\n");
}

/** Newest first by publication date; the data order breaks ties. */
const guidesNewestFirst = () => guides.map((g, i) => ({ g, i })).sort((a, b) => b.g.datePublished.localeCompare(a.g.datePublished) || a.i - b.i).map((x) => x.g);

function guidesSection(): string {
  const L = [
    "## Reference Guides",
    "",
    `Visualized reference guides, newest first. Each ships a plain-markdown edition for AI assistants and answer engines: the .md URL carries the complete text, tables, and image references. Every guide is also listed by topic: ${CANONICAL}/guides/topics`,
    "",
  ];
  for (const g of guidesNewestFirst()) {
    L.push(`### ${g.title}`, g.agentSummary ?? g.metaDescription, `- URL: ${abs(`/guides/${g.slug}`)}`);
    if (existsSync(join(process.cwd(), "public", "guides", `${g.slug}.md`))) L.push(`- Markdown edition: ${abs(`/guides/${g.slug}.md`)}`);
    L.push("");
  }
  return L.join("\n").trimEnd();
}

function topicsSection(): string {
  const n = new Set(GUIDE_TOPICS.flatMap((t) => t.guides.map((g) => g.slug))).size;
  const L = [
    "## Guide Topics",
    "",
    `Every reference guide is tagged, and every tag has its own page listing every guide that carries it: ${GUIDE_TOPICS.length} topics over ${n} guides.`,
    "",
    `- All topics, A to Z: ${CANONICAL}/guides/topics`,
  ];
  for (const t of GUIDE_TOPICS) L.push(`- ${t.label} (${t.guides.length} guide${t.guides.length === 1 ? "" : "s"}): ${abs(`/guides/topics/${t.slug}`)}`);
  return L.join("\n");
}

function updatesSection(entries: SiteEntry[]): string {
  const L = [
    "## AI Updates",
    "",
    "News with primary sources attached: court documents, official filings, and original announcements linked from every article.",
    `- URL: ${CANONICAL}/ai-updates`,
    "",
  ];
  for (const e of entries.filter((x) => x.section === "updates" && !x.hub)) {
    const u = aiUpdates.find((a) => `/ai-updates/${a.slug}` === e.href);
    L.push(`### ${e.title}${e.note ? ` (${monthYear(e.note)})` : ""}`);
    if (u?.summary) L.push(u.summary);
    L.push(`- URL: ${abs(e.href)}`, "");
  }
  return L.join("\n").trimEnd();
}

function researchSection(): string {
  const L: string[] = [];
  L.push("## Research & Talks", "");
  L.push("Peer-reviewed and preprint research on AI and search, conference talks, podcasts, interviews and recognition. Each item states its peer-review status and authorship position.");
  L.push(`- URL: ${CANONICAL}/research-and-talks`);
  L.push(`- Markdown edition: ${CANONICAL}/research-and-talks.md`);
  L.push(`- Full paper records: ${CANONICAL}/publications`);
  L.push(`- Full paper records, markdown: ${CANONICAL}/publications.md`);
  L.push(`- Google Scholar: ${GOOGLE_SCHOLAR_URL}`, "", "### Papers", "");
  for (const p of linkedPapers) {
    const status = p.review === "peer-reviewed" ? "Peer reviewed" : "Preprint, not peer reviewed";
    const access = accessNote(p);
    L.push(
      `- ${p.title} (${p.year}). ${status}. ${citationLine(p)}. ${authorRole(p)}.` +
        (p.authors ? ` Authors in printed order: ${p.authors.join(", ")}.` : "") +
        (access ? ` ${access}.` : "") +
        ` ${p.doiUrl ?? p.url}`,
    );
  }
  L.push("", "### Talks and workshops", "");
  L.push(`- ${BRIGHTONSEO_2026.title} ("${BRIGHTONSEO_2026.tagline}"), ${BRIGHTONSEO_2026.event}, ${formatTalkDate(BRIGHTONSEO_2026.startDate.slice(0, 10))}, ${BRIGHTONSEO_2026.track}. ${BRIGHTONSEO_2026.summary} Session: ${BRIGHTONSEO_2026.links[0].url} Slides: ${BRIGHTONSEO_2026.links[1].url}`);
  if (SUPPORT_TOTALS.posts > 0) {
    L.push(`- Recap and thank-you page for the ${BRIGHTONSEO_2026.event} talk: the recording, the slides, my posts, and ${SUPPORT_TOTALS.posts} LinkedIn posts about it by ${SUPPORT_TOTALS.authors} people and pages, every one linked. ${CANONICAL}/research-and-talks/brightonseo-san-diego-2026 (markdown with the full transcript: ${CANONICAL}/research-and-talks/brightonseo-san-diego-2026.md)`);
  }
  for (const t of TALKS.filter((x) => x.kind === "workshop")) L.push(`- ${t.title}, ${t.outlet}, ${formatTalkDate(t.date)}. ${t.summary}`);
  L.push("", "### Podcasts and interviews", "");
  for (const t of TALKS.filter((x) => x.kind !== "workshop")) {
    const link = t.links[0]?.url ?? `${CANONICAL}/research-and-talks#${t.slug}`;
    L.push(`- "${t.title}", ${t.outlet}, ${formatTalkDate(t.date)}${t.minutes ? `, ${t.minutes} min` : ""}. ${link}`);
  }
  L.push("", "### Recognition", "");
  for (const r of RECOGNITION) L.push(`- ${r.claim} (${r.source}, ${r.date.slice(0, 4)}). ${r.url}`);
  return L.join("\n");
}

/** The longest shared path prefix of a section's pages, for "each at <prefix><slug>". */
function sharedPrefix(hrefs: string[]): string {
  const parts = hrefs.map((h) => h.split("#")[0].split("/").slice(0, -1));
  if (!parts.length) return "";
  const out: string[] = [];
  for (let i = 0; i < parts[0].length; i++) {
    const seg = parts[0][i];
    if (parts.every((p) => p[i] === seg)) out.push(seg);
    else break;
  }
  const prefix = out.join("/");
  return prefix.length > 1 ? `${prefix}/` : "";
}

function siteIndexSection(entries: SiteEntry[]): string {
  const L = [
    "## Every section of the site",
    "",
    `Generated from the same registry as sitemap.xml, so this list is always complete. Every URL with its title is in ${CANONICAL}/llms-full.txt.`,
    "",
  ];
  // A shared prefix is named only when it is a page itself, so an agent that
  // follows it never lands on a 404 (there is no speakers index, for one).
  const isPage = new Set(entries.filter((e) => e.xml).map((e) => e.href));
  for (const s of buildSections(entries).filter((x) => x.count > 0)) {
    const pages = s.groups.flatMap((g) => g.entries).filter((e) => e.xml).map((e) => e.href);
    const shared = pages.length > 3 ? sharedPrefix(pages) : "";
    const prefix = shared && isPage.has(shared.replace(/\/$/, "")) ? shared : "";
    L.push(`- ${s.meta.label} (${s.count}): ${abs(`/sitemap/${s.meta.id}`)}${prefix ? `, each page under ${abs(prefix)}` : ""}. ${s.meta.blurb}`);
  }
  return L.join("\n");
}

function everyPageSection(entries: SiteEntry[]): string {
  const L = ["## Every page, by section", "", `The complete list, generated from the same registry as ${CANONICAL}/sitemap.xml and ${CANONICAL}/sitemap.`, ""];
  for (const s of buildSections(entries).filter((x) => x.count > 0)) {
    L.push(`### ${s.meta.label} (${s.count})`, "", `- Site map view: ${abs(`/sitemap/${s.meta.id}`)}`);
    for (const h of s.hubs) L.push(`- ${h.title}: ${abs(h.href)}`);
    for (const g of s.groups) {
      if (g.label) L.push("", `#### ${g.label}`);
      for (const e of g.entries) L.push(`- ${e.title}${e.note ? ` (${e.note})` : ""}: ${abs(e.href)}`);
    }
    L.push("");
  }
  return L.join("\n").trimEnd();
}

/** Fill {{placeholders}} in a narrative; an unknown placeholder is a build error, never a silent gap. */
function fill(template: string, sections: Record<string, () => string>): string {
  return template.replace(/\{\{([a-z-]+)\}\}/g, (_, key: string) => {
    const f = sections[key];
    if (!f) throw new Error(`discovery: unknown placeholder {{${key}}}`);
    return f();
  });
}

function narrative(file: "llms.md" | "llms-full.md"): string {
  return readFileSync(join(process.cwd(), "src", "content", file), "utf8");
}

export async function renderLlms(file: "llms.md" | "llms-full.md"): Promise<string> {
  const entries = await getSiteIndex();
  return fill(narrative(file), {
    discovery: discoverySection,
    guides: guidesSection,
    topics: topicsSection,
    updates: () => updatesSection(entries),
    research: researchSection,
    "site-index": () => siteIndexSection(entries),
    "every-page": () => everyPageSection(entries),
  }).replace(/\n{3,}/g, "\n\n");
}

/** OKF concept: every page on the site, by section. */
export async function renderOkfSiteIndex(): Promise<string> {
  const entries = await getSiteIndex();
  const sections = buildSections(entries).filter((x) => x.count > 0);
  const total = entries.filter((e) => e.xml).length;
  const L = [
    "---",
    "type: SiteIndex",
    "title: Every page on venkatapagadala.com",
    `description: All ${total} pages of the site by section, plus the talks, videos, papers and mentions that live on them, generated from the registry behind sitemap.xml.`,
    `resource: ${CANONICAL}/sitemap`,
    "tags: [site-index, sitemap, navigation]",
    `generated: { by: src/lib/siteIndex.ts, at: ${new Date().toISOString().slice(0, 19)}Z }`,
    "---",
    "# Every page, by section",
    "",
    `The same list as ${CANONICAL}/sitemap.xml, ${CANONICAL}/sitemap and ${CANONICAL}/llms-full.txt, rendered from one registry so they cannot disagree. The guide for AI agents is ${CANONICAL}/llms.txt; the rest of this bundle starts at [index.md](index.md).`,
    "",
  ];
  for (const s of sections) {
    L.push(`## ${s.meta.label}`, "", s.meta.blurb, "", `* [Site map view](${abs(`/sitemap/${s.meta.id}`)})`);
    for (const h of s.hubs) L.push(`* [${h.title}](${abs(h.href)})`);
    for (const g of s.groups) {
      if (g.label) L.push("", `### ${g.label}`, "");
      for (const e of g.entries) L.push(`* [${e.title}](${abs(e.href)})${e.note ? ` - ${e.note}` : ""}`);
    }
    L.push("");
  }
  return L.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * OKF guides index: every guide, newest first. A guide with an OKF concept file
 * links it and uses the concept's own description; any other guide links its
 * markdown edition (or its page) and uses the guide's metaDescription.
 */
export function renderOkfGuidesIndex(): string {
  const L = ["# Guides", ""];
  for (const g of guidesNewestFirst()) {
    const conceptPath = join(process.cwd(), "public", "okf", "guides", `${g.slug}.md`);
    const concept = existsSync(conceptPath) ? readFileSync(conceptPath, "utf8") : null;
    const twin = existsSync(join(process.cwd(), "public", "guides", `${g.slug}.md`));
    const href = concept ? `${g.slug}.md` : twin ? abs(`/guides/${g.slug}.md`) : abs(`/guides/${g.slug}`);
    const described = concept?.match(/^description: (.+)$/m)?.[1];
    L.push(`* [${g.title}](${href}) - ${described ?? g.metaDescription}`);
  }
  return L.join("\n") + "\n";
}
