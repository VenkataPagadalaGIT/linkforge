// The sections of one entity's file, with what each holds. The dossier's table of contents in the graph views and the
// file's own section bar read the same list, so a section is in both places or in neither.
import { getNode, membersOf, newsFor } from "@/data/aiOntology";
import { AI_360 } from "@/data/ai360";
import { AI_INTEL } from "@/data/aiIntel";
import { DEGREE, dealsOf } from "./intelModel";
import { sharesOf } from "./AiShares";
import { hasCompanyFile, sections360For } from "@/lib/ai360-sections";
import { sectionPath } from "@/lib/graph-urls";

export type FileSectionId = "overview" | "f360" | "connections" | "money" | "financials" | "investors" | "share" | "people" | "legal" | "news" | "earnings";

export interface FileSection {
  id: FileSectionId;
  label: string;
  /** What the section holds, in a few words; null when nothing is collected for it yet. */
  count: string | null;
  /** The section's own indexable pages, when it has them. */
  pages: { label: string; href: string }[];
  empty: boolean;
}

const fmt = (v: number) => v.toLocaleString("en-US");
const some = (k: number, word: string, plural = `${word}s`) => (k ? `${fmt(k)} ${k === 1 ? word : plural}` : null);

export function fileSections(id: string): FileSection[] {
  const n = getNode(id);
  if (!n) return [];
  const f = AI_360[id];
  const intel = AI_INTEL[id];
  const own = new Set<string>(sections360For(id).map((s) => s.id));
  const page = (s: string, label: string) => (own.has(s) ? [{ label, href: sectionPath(id, s) }] : []);
  const units = membersOf(id).length;
  const links = DEGREE.get(id) ?? 0;
  const deals = dealsOf(id).length;
  const figures = (intel?.series ?? []).filter((s) => !s.metric.startsWith("share_")).length;
  const rounds = f?.rounds.length ?? 0;
  const shares = sharesOf(id).length;
  const people = f?.people.length || intel?.people.length || 0;
  const roles = f?.hiring?.open ?? 0;
  const legal = f?.legal.length ?? 0;
  const news = (intel?.events.length ?? 0) + newsFor(id).length;
  const listed = !!n.ticker && n.ticker !== "private" && !/proposed/i.test(n.ticker);
  const sections: FileSection[] = [
    { id: "overview", label: "Overview", count: units ? `${some(units, "unit")} in the group` : null, pages: [], empty: false },
    { id: "f360", label: "360", count: f ? "birth to now" : null, pages: page("timeline", "Birth to now"), empty: !f },
    { id: "connections", label: "Connections", count: some(links, "link"), pages: [], empty: !links },
    { id: "money", label: "Money", count: some(deals, "deal"), pages: [], empty: !deals },
    ...(hasCompanyFile(id) ? [{ id: "financials" as const, label: "Financials", count: some(figures, "figure") ?? "from its filings", pages: [], empty: false }] : []),
    { id: "investors", label: "Investors", count: some(rounds, "round"), pages: page("investors", "Investors"), empty: !rounds },
    { id: "share", label: "Market share", count: some(shares, "segment"), pages: [], empty: !shares },
    {
      id: "people",
      label: "People and hiring",
      count: [some(people, "person", "people"), some(roles, "open role")].filter(Boolean).join(" · ") || null,
      pages: [...page("people", "People"), ...page("hiring", "Hiring")],
      empty: !people && !roles,
    },
    { id: "legal", label: "Legal", count: some(legal, "matter"), pages: page("legal", "Legal"), empty: !legal },
    { id: "news", label: "News and events", count: some(news, "item"), pages: [], empty: !news },
    { id: "earnings", label: "Earnings calls", count: listed ? "not collected yet" : null, pages: [], empty: true },
  ];
  return sections;
}

/** The DOM id of a section of the file on the page. */
export const sectionDomId = (id: string) => `ai-dash-${id}`;

/** Scroll the page to a section of the file, leaving fullscreen first when the graph has it. */
export function scrollToSection(id: string) {
  const go = () => {
    const el = document.getElementById(sectionDomId(id));
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {}).finally(go);
  else go();
}
