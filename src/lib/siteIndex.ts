/**
 * siteIndex.ts: every page on the site, listed once.
 *
 * Every discovery surface reads this list, so they cannot disagree: a page
 * added here appears in all of them within the hour, and a page missing here
 * is missing from all of them:
 *   sitemap.xml (app/sitemap.ts), the HTML site map (/sitemap and
 *   /sitemap/<section>), /llms.txt, /llms-full.txt and the OKF site index
 *   (/okf/site-index.md), the last three rendered by src/lib/discovery.ts.
 * Two deploy gates hold it: scripts/check-route-coverage.py fails when an app
 * route is neither registered here nor listed in NOT_INDEXED_ROUTES, and
 * scripts/check-discovery-surfaces.py proves against the running server that
 * every URL in sitemap.xml is on every other surface. docs/SITE_DISCOVERY.md
 * is the how-to.
 *
 * An entry is either a page of this site (it carries `xml`: the same
 * lastModified, changeFrequency and priority sitemap.ts used to compute
 * inline) or an item that lives on a page, such as a talk, an award or a
 * video (no `xml`; its href is the anchor on the page that holds it).
 */
import type { MetadataRoute } from "next";
import { toDate } from "@/lib/date";
import { getSitemapData } from "@/lib/content-fetch";
import { aiUpdates } from "@/data/aiUpdates";
import { PERSONAS, PERSONAS_LAST_UPDATED } from "@/data/personas";
import { QUESTIONS } from "@/data/corpusQuestions";
import { guides } from "@/data/guides";
import { GUIDE_TOPICS } from "@/data/guideTopics";
import { refConcepts, REF_BASE } from "@/data/learnReference";
import { nodes as aiOntologyNodes, LAYER_BY_ID } from "@/data/aiOntology";
import { conferences, isLogisticsSession, listConferenceSessions } from "@/data/conferences";
import { speakers } from "@/data/speakers";
import { aiContributors } from "@/data/aiContributors";
import { pillarPages, blogPosts } from "@/data/insights";
import { BRIGHTONSEO_2026, KIND_LABEL, RECOGNITION, TALKS, byDateDesc } from "@/data/talks";
import { linkedPapers } from "@/data/research";

export type SectionId =
  | "guides" | "topics" | "videos" | "awards" | "sessions" | "talks"
  | "research" | "pages" | "personas" | "notebook" | "encyclopedia" | "map"
  | "contributors" | "updates" | "insights" | "speakers" | "solutions" | "machines";

export interface SectionMeta {
  id: SectionId;
  label: string;
  blurb: string;
  /** Shown first in the filter bar: the views the owner asked for by name. */
  featured?: boolean;
}

/** Display order of the filter bar and of the whole-site page. */
export const SECTIONS: SectionMeta[] = [
  { id: "guides", label: "Guides", blurb: "Reference guides and interactive 3D teardowns.", featured: true },
  { id: "topics", label: "Topics", blurb: "Every guide topic, each with a page listing the guides that carry it.", featured: true },
  { id: "videos", label: "Videos", blurb: "Talks, workshops and interviews you can watch now.", featured: true },
  { id: "awards", label: "Awards & recognition", blurb: "Lists, credits and mentions, each worded the way its source words it.", featured: true },
  { id: "sessions", label: "Sessions", blurb: "The Conference Notebook: every keynote, talk and panel, by conference.", featured: true },
  { id: "talks", label: "Talks", blurb: "Talks, workshops, podcasts and interviews.", featured: true },
  { id: "research", label: "Research papers", blurb: "Published papers and the research hub." },
  { id: "pages", label: "Main pages", blurb: "Home, about, experience and the site's front doors." },
  { id: "personas", label: "Personas", blurb: "Audience personas backed by published research, and the persona tools." },
  { id: "notebook", label: "AI Notebook", blurb: "The AI and business notebooks: roadmap, statistics and the book shelf." },
  { id: "encyclopedia", label: "AI Encyclopedia", blurb: "Every AI concept, one page each, by category." },
  { id: "map", label: "AI Systems Map", blurb: "Every entity in the AI value chain, one page each, by layer." },
  { id: "contributors", label: "AI Contributors", blurb: "The people building AI, in ranked order." },
  { id: "updates", label: "AI Updates", blurb: "AI news with primary sources, newest first." },
  { id: "insights", label: "Insights", blurb: "Essays on AI, search and systems, by pillar." },
  { id: "speakers", label: "Speakers", blurb: "Every speaker in the Conference Notebook, A to Z." },
  { id: "solutions", label: "Solutions", blurb: "What I build and deliver." },
  { id: "machines", label: "For machines", blurb: "Machine-readable files for search engines and AI agents." },
];

export const sectionById = (id: string) => SECTIONS.find((s) => s.id === id);

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

export interface SiteEntry {
  /** Site path, optionally with an #anchor. */
  href: string;
  title: string;
  section: SectionId;
  group?: string;
  note?: string;
  /** A section's own front door, listed above its groups. */
  hub?: boolean;
  /** Not a row of its own (the site map's own pages; the filter bar links them). */
  hidden?: boolean;
  /** Present when this is a page of the site that belongs in sitemap.xml. */
  xml?: { lastModified: Date; changeFrequency: ChangeFrequency; priority: number };
}

// title, section, hub; order within a section is the order below
const STATIC_ROUTES: [string, string, SectionId, boolean?][] = [
  ["", "Home", "pages"],
  ["/about", "About", "pages"],
  ["/experience", "Experience", "pages"],
  ["/projects", "Projects", "pages"],
  ["/contact", "Contact", "pages"],
  ["/credits", "Credits and inspiration", "pages"],
  ["/3d", "Everything in 3D", "pages"],
  ["/3d-game", "3D game: the 2040 city", "pages"],
  ["/guides", "All guides (Teardowns)", "guides", true],
  ["/research-and-talks", "Research and talks", "talks", true],
  ["/research-and-talks/brightonseo-san-diego-2026", "brightonSEO San Diego 2026: recap and thank you", "talks"],
  ["/publications", "Publications", "research", true],
  ["/research", "Research", "research", true],
  ["/personas", "Audience personas", "personas", true],
  ["/personas/data", "Persona data and sources", "personas"],
  ["/personas/builder", "Persona Builder", "personas"],
  ["/personas/fanout-journey", "Persona Fanout Journey", "personas"],
  ["/personas/framework", "Global Persona Framework", "personas"],
  ["/notebook", "Notebooks", "notebook", true],
  ["/notebook/ai", "AI Notebook", "notebook"],
  ["/notebook/ai/agents", "AI agent statistics", "notebook"],
  ["/notebook/ai/roadmap", "AI roadmap", "notebook"],
  ["/notebook/ai/shelf", "The complete shelf: free AI books", "notebook"],
  ["/notebook/business", "Business Notebook", "notebook"],
  ["/notebook/ai/encyclopedia", "AI Encyclopedia", "encyclopedia", true],
  ["/notebook/ai/map", "AI Systems Map", "map", true],
  ["/notebook/ai/graph", "AI Systems Map: graph view", "map", true],
  ["/ai-contributors", "AI Contributors", "contributors", true],
  ["/ai-updates", "AI Updates", "updates", true],
  ["/insights", "Insights", "insights", true],
  ["/notebook/conference", "Conference Notebook", "sessions", true],
  ["/solutions", "Solutions", "solutions", true],
  ["/llms.txt", "llms.txt: a guide to this site for AI agents", "machines"],
  ["/llms-full.txt", "llms-full.txt: the full-text edition", "machines"],
];

/**
 * Routes that exist but are deliberately kept out of every site map and index.
 * scripts/check-route-coverage.py fails the deploy for any app route that is
 * neither registered above nor listed here, and requires each route listed
 * here to serve noindex. A pattern ending in /* covers the subtree.
 */
export const NOT_INDEXED_ROUTES: { route: string; reason: string }[] = [
  { route: "/admin", reason: "CMS administration, behind sign-in" },
  { route: "/admin/*", reason: "CMS administration, behind sign-in" },
  { route: "/brand", reason: "internal brand reference sheet" },
  { route: "/library", reason: "internal component showcase" },
];

// Titles as the solutions grid names them; the route itself only knows slugs.
const SOLUTIONS: [string, string][] = [
  ["ai-product", "AI Product"],
  ["aeo", "Answer Engine Optimization (AEO)"],
  ["technical", "Technical SEO"],
  ["programmatic", "Programmatic SEO"],
  ["editorial", "Editorial SEO"],
  ["performance", "Performance Analytics"],
];

const humanize = (slug: string) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const initial = (s: string) => {
  const c = s.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "0-9";
};
const year = (d: string) => d.slice(0, 4);

export async function getSiteIndex(): Promise<SiteEntry[]> {
  const now = new Date();
  const data = await getSitemapData();
  const out: SiteEntry[] = [];

  for (const [path, title, section, hub] of STATIC_ROUTES) {
    out.push({
      href: path || "/",
      title,
      section,
      hub,
      xml: {
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1.0 : path.startsWith("/insights") || path.startsWith("/ai-") ? 0.8 : 0.6,
      },
    });
  }

  // Guides and their topics
  for (const g of guides) {
    out.push({
      href: `/guides/${g.slug}`, title: g.title, section: "guides", note: g.readingTime,
      xml: { lastModified: g.dateModified ? toDate(g.dateModified) : now, changeFrequency: "monthly", priority: 0.9 },
    });
  }
  out.push({
    href: "/guides/topics", title: "Guide topics, A to Z", section: "topics", hub: true,
    xml: { lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  });
  for (const t of GUIDE_TOPICS) {
    out.push({
      href: `/guides/topics/${t.slug}`, title: t.label, section: "topics", group: initial(t.label),
      note: `${t.guides.length} guide${t.guides.length === 1 ? "" : "s"}`,
      xml: {
        lastModified: t.guides.reduce((max, g) => {
          const d = g.dateModified ? toDate(g.dateModified) : now;
          return d > max ? d : max;
        }, new Date(0)),
        changeFrequency: "monthly",
        priority: 0.5,
      },
    });
  }

  // Talks, videos, recognition and papers: items that live on /research-and-talks
  const brighton = BRIGHTONSEO_2026 as typeof BRIGHTONSEO_2026 & { video: { youtubeId?: string; src?: string } };
  out.push({
    href: `/research-and-talks#${brighton.slug}`, title: `${brighton.title}: ${brighton.tagline}`, section: "talks",
    group: "Talks and workshops", note: `${brighton.event}`,
  });
  for (const t of [...TALKS].sort(byDateDesc)) {
    const kindGroup = t.kind === "talk" || t.kind === "workshop" ? "Talks and workshops" : "Podcasts and interviews";
    out.push({
      href: `/research-and-talks#${t.slug}`, title: t.title, section: "talks", group: kindGroup,
      note: `${KIND_LABEL[t.kind]}, ${t.outlet}, ${year(t.date)}`,
    });
  }
  // Only what can be watched today: a recording on this site or on YouTube.
  // The brightonSEO recording appears here on its own once it is hosted.
  const videoItems = [
    ...(brighton.video.youtubeId || brighton.video.src ? [{ slug: brighton.slug, title: brighton.title, where: brighton.video.src ? "on this site" : "on YouTube", date: brighton.startDate }] : []),
    ...TALKS.filter((t) => t.video?.src || t.video?.youtubeId || t.links.some((l) => /youtube\.com|youtu\.be/.test(l.url))).map((t) => ({
      slug: t.slug,
      title: t.title,
      where: t.video?.src ? "on this site" : "on YouTube",
      date: t.date,
    })),
  ].sort(byDateDesc);
  for (const v of videoItems) {
    out.push({ href: `/research-and-talks#${v.slug}`, title: v.title, section: "videos", note: `Watch ${v.where}, ${year(v.date)}` });
  }
  for (const r of [...RECOGNITION].sort(byDateDesc)) {
    out.push({ href: `/research-and-talks#${r.slug}`, title: r.claim, section: "awards", note: `${r.source}, ${year(r.date)}` });
  }
  for (const p of linkedPapers) {
    out.push({ href: `/research-and-talks#${p.slug}`, title: p.title, section: "research", note: `${p.venue}, ${p.year}` });
  }

  // Personas
  for (const p of PERSONAS) {
    out.push({
      href: `/personas/${p.slug}`, title: p.name, section: "personas", group: "Personas",
      xml: { lastModified: toDate(PERSONAS_LAST_UPDATED), changeFrequency: "monthly", priority: 0.7 },
    });
  }
  for (const q of QUESTIONS) {
    out.push({
      href: `/personas/${q.slug}`, title: q.title, section: "personas", group: "Questions the data answers",
      xml: { lastModified: toDate(PERSONAS_LAST_UPDATED), changeFrequency: "monthly", priority: 0.7 },
    });
  }

  // AI Encyclopedia, by category
  for (const c of refConcepts) {
    out.push({
      href: `${REF_BASE}/${c.id}`, title: c.concept, section: "encyclopedia", group: c.category,
      xml: { lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    });
  }

  // AI Systems Map, by layer
  for (const n of aiOntologyNodes) {
    out.push({
      href: `/notebook/ai/map/${n.id}`, title: n.name, section: "map", group: LAYER_BY_ID.get(n.layer)?.label ?? "Other",
      xml: { lastModified: now, changeFrequency: "monthly", priority: n.chokepoint ? 0.7 : 0.6 },
    });
  }

  // AI Contributors, in ranked order
  for (const c of [...aiContributors].sort((a, b) => a.rank - b.rank)) {
    out.push({
      href: `/ai-contributors/${c.id}`, title: c.name, section: "contributors", note: `#${c.rank}`,
      xml: { lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    });
  }

  // AI Updates: backend first, then the static module, deduped by slug, so an
  // article that ships in the file alone is still listed the same day
  const updateTitle = (slug: string) => aiUpdates.find((u) => u.slug === slug)?.title ?? humanize(slug);
  const updates: SiteEntry[] = [];
  const seenUpdates = new Set<string>();
  if (data) {
    for (const u of data.updates) {
      seenUpdates.add(u.slug);
      updates.push({
        href: `/ai-updates/${u.slug}`, title: updateTitle(u.slug), section: "updates", note: u.date ? u.date.slice(0, 10) : undefined,
        xml: { lastModified: u.date ? toDate(u.date) : now, changeFrequency: "monthly", priority: 0.7 },
      });
    }
  }
  for (const u of aiUpdates) {
    if (seenUpdates.has(u.slug)) continue;
    updates.push({
      href: `/ai-updates/${u.slug}`, title: u.title, section: "updates", note: u.date.slice(0, 10),
      xml: { lastModified: toDate(u.date), changeFrequency: "monthly", priority: 0.7 },
    });
  }
  out.push(...updates.sort((a, b) => (b.note ?? "").localeCompare(a.note ?? "")));

  // Insights: the backend decides which exist (as sitemap.xml always has);
  // titles come from the local module, falling back to the slug
  if (data) {
    const pillarTitle = (slug: string) => pillarPages.find((p) => p.slug === slug)?.title ?? humanize(slug);
    for (const p of data.pillars) {
      out.push({
        href: `/insights/${p.slug}`, title: `${pillarTitle(p.slug)}: overview`, section: "insights", group: pillarTitle(p.slug),
        xml: { lastModified: now, changeFrequency: "monthly", priority: 0.8 },
      });
    }
    for (const p of data.posts) {
      out.push({
        href: `/insights/${p.pillarSlug}/${p.slug}`,
        title: blogPosts.find((b) => b.slug === p.slug)?.title ?? humanize(p.slug),
        section: "insights",
        group: pillarTitle(p.pillarSlug),
        xml: { lastModified: p.date ? toDate(p.date) : now, changeFrequency: "monthly", priority: 0.7 },
      });
    }
  }

  // Conference Notebook: each conference, then its sessions in schedule order
  for (const c of conferences) {
    const conf = `${c.name} ${c.year}`;
    out.push({
      href: `/notebook/conference/${c.slug}`, title: conf, section: "sessions", hub: true,
      xml: { lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    });
    for (const { session, urlSlug } of listConferenceSessions(c)) {
      // registration, breaks and meals are noindex pages: listed nowhere
      if (isLogisticsSession(session)) continue;
      out.push({
        href: `/notebook/conference/${c.slug}/sessions/${urlSlug}`,
        title: session.title,
        section: "sessions",
        group: conf,
        note: session.speaker,
        xml: { lastModified: now, changeFrequency: "yearly", priority: 0.4 },
      });
    }
  }
  for (const s of [...speakers].sort((a, b) => a.name.localeCompare(b.name))) {
    out.push({
      href: `/notebook/conference/speakers/${s.slug}`, title: s.name, section: "speakers", group: initial(s.name), note: s.company,
      xml: { lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    });
  }

  for (const [slug, title] of SOLUTIONS) {
    out.push({
      href: `/solutions/${slug}`, title, section: "solutions",
      xml: { lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    });
  }

  // Files the footer already links that are not pages of their own
  for (const [href, title] of [
    ["/sitemap.xml", "sitemap.xml"],
    ["/okf/index.md", "Open Knowledge Format bundle (okf/index.md)"],
    ["/okf/site-index.md", "OKF site index: every page, by section"],
    ["/rss.xml", "RSS feed"],
    ["/robots.txt", "robots.txt"],
  ]) {
    out.push({ href, title, section: "machines" });
  }

  // The site map's own pages: in sitemap.xml, reached through the filter bar
  out.push({ href: "/sitemap", title: "Site map", section: "machines", hidden: true, xml: { lastModified: now, changeFrequency: "weekly", priority: 0.5 } });
  for (const s of SECTIONS) {
    out.push({ href: `/sitemap/${s.id}`, title: `Site map: ${s.label}`, section: s.id, hidden: true, xml: { lastModified: now, changeFrequency: "weekly", priority: 0.3 } });
  }

  return out;
}

export interface SectionGroup {
  label: string;
  entries: SiteEntry[];
}
export interface SectionView {
  meta: SectionMeta;
  /** Entries in the view, not counting its start-here pages: 7 guides, not 8. */
  count: number;
  hubs: SiteEntry[];
  groups: SectionGroup[];
}

/** Letter groups sort A to Z with "0-9" first; every other grouping keeps its data order. */
export function buildSections(entries: SiteEntry[]): SectionView[] {
  return SECTIONS.map((meta) => {
    const rows = entries.filter((e) => e.section === meta.id && !e.hidden);
    const hubs = rows.filter((e) => e.hub);
    const groups: SectionGroup[] = [];
    for (const e of rows.filter((r) => !r.hub)) {
      const label = e.group ?? "";
      let g = groups.find((x) => x.label === label);
      if (!g) groups.push((g = { label, entries: [] }));
      g.entries.push(e);
    }
    if (groups.length > 1 && groups.every((g) => g.label === "0-9" || /^[A-Z]$/.test(g.label))) {
      groups.sort((a, b) => (a.label === "0-9" ? -1 : b.label === "0-9" ? 1 : a.label.localeCompare(b.label)));
    }
    return { meta, count: rows.length - hubs.length, hubs, groups };
  });
}
