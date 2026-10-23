/**
 * The /about sections the home page links to, each with a one-line hint and
 * the few things inside it. The hero's spider web and the strip on phones
 * both read this, and every number in it is counted from the same data the
 * About page uses, so the three never disagree.
 */
import {
  ABOUT_SECTIONS,
  COLLEAGUE_RECS,
  FOCUS_AREAS,
  LINKEDIN_STATS,
  PEER_QUOTES,
  compactStat,
} from "@/data/profile";
import { linkedPapers } from "@/data/research";
import { BRIGHTONSEO_2026, RECOGNITION, TALKS, byDateDesc } from "@/data/talks";

export interface HomeSection {
  id: string;
  label: string;
  hint: string;
  leaves: string[];
}

/** The About page's last three sections (bios, questions, contact) stay on that page. */
const HOME_IDS = ["about", "numbers", "roles", "work", "story", "peers", "speaking", "research", "recognition", "experience", "education"];

const media = TALKS.filter((t) => t.kind !== "workshop").sort(byDateDesc);
const stat = (prefix: string) => LINKEDIN_STATS.find((s) => s.label.startsWith(prefix))?.value ?? "";

const DETAIL: Record<string, { hint: string; leaves: string[] }> = {
  about: {
    hint: "User First Intelligence",
    leaves: ["User First Intelligence", "Agentic AI", "Enterprise SEO", "AI search and AEO"],
  },
  numbers: {
    hint: `${compactStat(stat("Post impressions"))} impressions`,
    leaves: [
      `${compactStat(stat("Post impressions"))} impressions in 12 months`,
      `${compactStat(stat("LinkedIn followers"))} LinkedIn followers`,
      `${compactStat(stat("Members reached"))} members reached`,
      `${stat("Recommendations")} recommendations`,
    ],
  },
  roles: {
    hint: "Six roles, one field",
    leaves: ["Speaker", "Researcher", "Podcast guest", "Product leader", "Educator and builder", "Creator"],
  },
  work: {
    hint: `${FOCUS_AREAS.length} focus areas`,
    leaves: FOCUS_AREAS.map((f) => f.short),
  },
  story: {
    hint: "2014 to today",
    leaves: ["2014: software developer", "2016: first search role", "2019: SEO engineering at scale", "2022: SEO product, Apartments.com", "2025: AI product lead, AT&T"],
  },
  peers: {
    hint: `${PEER_QUOTES.length + COLLEAGUE_RECS.length} quotes`,
    leaves: PEER_QUOTES.slice(0, 5).map((q) => q.name),
  },
  speaking: {
    hint: `${TALKS.length + 1} talks and episodes`,
    leaves: [BRIGHTONSEO_2026.event, ...media.slice(0, 4).map((t) => t.outlet)],
  },
  research: {
    hint: `${linkedPapers.length} papers`,
    leaves: linkedPapers.map((p) => p.shortTitle),
  },
  recognition: {
    hint: `${RECOGNITION.length} lists and mentions`,
    leaves: RECOGNITION.map((r) => (r.publishedOn && r.publishedOn !== "LinkedIn" ? r.publishedOn : r.source)),
  },
  experience: {
    hint: "AT&T, CoStar, AAC",
    leaves: ["AT&T", "CoStar Group (Apartments.com)", "American Addiction Centers", "Sprout for Business"],
  },
  education: {
    hint: "M.S., MBA, B.E.",
    leaves: ["New England College", "KL University", "Harvard (certificate)", "MIT (certificate)"],
  },
};

export const HOME_SECTIONS: HomeSection[] = HOME_IDS.map((id) => {
  const s = ABOUT_SECTIONS.find((x) => x.id === id);
  return { id, label: s?.label ?? id, ...DETAIL[id] };
});
