// The sections of a company's 360 file that get their own indexable page under /notebook/ai/graph/<id>/<section>.
// Shared by the route, the site index (sitemap, HTML sitemap) and the company page's section nav, so a section
// exists in all three places or in none.
import { AI_360, type Entity360 } from "@/data/ai360";
import { AI_INTEL } from "@/data/aiIntel";
import { getNode } from "@/data/aiOntology";

export type Section360Id = "ipo" | "people" | "investors" | "legal" | "hiring" | "timeline";

export interface Section360 {
  id: Section360Id;
  /** Short label for navs and breadcrumbs. */
  label: string;
  /** Page title and heading, with the company name. */
  title: (name: string) => string;
  /** Meta description, from the file's own numbers. */
  description: (name: string, f: Entity360) => string;
  has: (f: Entity360) => boolean;
}

const money = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1).replace(/\.0$/, "")}B` : `$${Math.round(v / 1e6)}M`);
const n = (v: number) => v.toLocaleString("en-US");

const day = (d: string) => `${Number(d.slice(8, 10))} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export const SECTIONS_360: Section360[] = [
  {
    id: "ipo",
    label: "IPO",
    title: (name) => `${name} IPO: the filings, share classes, lock-up and what is set so far`,
    description: (name, f) => {
      const ipo = f.ipo!;
      const s1 = ipo.filings.find((x) => x.form === "S-1");
      const first = ipo.filings[ipo.filings.length - 1];
      const listing = ipo.terms.find((t) => t.key === "ipo_listing")?.value.replace(/ \(Class A common stock\)$/, "");
      const range = ipo.terms.find((t) => t.key === "ipo_price_range")?.value;
      return `${name}'s listing from its own filings: ${ipo.filings.length} SEC filings from the first confidential draft${first ? ` (${day(first.filedOn)})` : ""}${s1 ? ` to the public S-1 (${day(s1.filedOn)})` : ""}${listing ? `, ${listing}` : ""}; price range ${range && /not set/i.test(range) ? "not set yet" : range}; share classes, lock-up and use of proceeds, each with its sentence.`;
    },
    has: (f) => !!f.ipo,
  },
  {
    id: "people",
    label: "People",
    title: (name) => `${name} people: officers, board, founders and everyone with a public footprint`,
    description: (name, f) => {
      const fp = f.footprint?.total ?? 0;
      const li = f.footprint?.counts["linkedin:stated"] ?? 0;
      return `${name}'s ${f.people.length} officers, directors, founders and trustees with their other roles, ${n(fp)} people with a public footprint${li ? ` including ${n(li)} profiles naming it as employer` : ""}, and where its talent is, studied and works. Every line carries its source sentence.`;
    },
    has: (f) => f.people.length > 0 || !!f.footprint || !!f.talent,
  },
  {
    id: "investors",
    label: "Investors",
    title: (name) => `${name} investors: every funding round from the first to the IPO`,
    description: (name, f) => {
      const rounds = f.rounds.filter((r) => r.kind === "priced_round" && r.voting);
      const last = [...f.rounds].reverse().find((r) => r.postMoney);
      const investors = new Set(f.rounds.flatMap((r) => r.who.map((w) => w.name))).size;
      return `${name}'s ${f.rounds.length} financings${rounds.length ? ` from the ${rounds[0].round} to the ${rounds[rounds.length - 1].round}` : ""}${last?.postMoney ? `, latest ${money(last.postMoney)} post-money` : ""}, ${n(investors)} named investors with lead and co-lead roles, price per share round by round, the auditors, counsel and underwriters, and ${f.agreements.length} agreements on file.`;
    },
    has: (f) => f.rounds.length > 0,
  },
  {
    id: "legal",
    label: "Legal",
    title: (name) => `${name} lawsuits and legal matters, as it discloses them`,
    description: (name, f) => {
      const settled = f.legal.filter((c) => /settled/i.test(c.status)).length;
      const brought = f.legal.filter((c) => c.role === "plaintiff" || c.role === "petitioner").length;
      return `${f.legal.length} legal matters involving ${name}: ${brought} it brought, ${settled} settled, the rest pending, each with court, status and the exact sentence from the filing that discloses it.`;
    },
    has: (f) => f.legal.length > 0,
  },
  {
    id: "hiring",
    label: "Hiring",
    title: (name) => `${name} hiring: every open role by team, city and theme`,
    description: (name, f) => {
      const h = f.hiring!;
      return `${n(h.open)} open roles at ${name} on its public job board as of ${h.asOf}, ${n(h.new30)} posted in the last 30 days, across ${n(h.teamCount)} teams; what it hires for, where, and the newest roles.`;
    },
    has: (f) => !!f.hiring,
  },
  {
    id: "timeline",
    label: "Birth to now",
    title: (name) => `${name} from founding to now: its own record, public attention and milestones`,
    description: (name, f) => {
      const s = f.site;
      const a = f.attention;
      return `${name} month by month${s ? `: ${n(s.dated)} dated pages from its own sites since ${s.first?.slice(0, 4)}` : ""}${a ? `, ${n(a.total)} Hacker News stories naming it` : ""}, funding rounds, lawsuits and the IPO filing on one time axis, and which teams publish what.`;
    },
    has: (f) => !!f.site || !!f.attention,
  },
];

export const section360 = (id: string) => SECTIONS_360.find((s) => s.id === id);

/** The sections a company's file supports, in page order. */
export function sections360For(entity: string): Section360[] {
  const f = AI_360[entity];
  if (!f) return [];
  return SECTIONS_360.filter((s) => s.has(f));
}

/** Entities with at least one section page. */
export function entitiesWith360(): string[] {
  return Object.keys(AI_360).filter((id) => getNode(id) && sections360For(id).length > 0);
}

export const hasCompanyFile = (id: string) => (AI_INTEL[id]?.series ?? []).some((s) => !s.metric.startsWith("share_")) || (AI_INTEL[id]?.deals.length ?? 0) > 0;
