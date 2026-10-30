/**
 * learnHub.ts: every guide and reference page, classified once (owner IA, 2026-10-30: "all the guides will live in
 * notebooks... a dedicated section called Learn... classify in the best way... internal links so crawlers can crawl").
 * Not to be confused with learn.ts, the lesson library behind the encyclopedia's deep dives.
 *
 * Three readers share this list, so they cannot drift apart: the Notebooks menu in the Navbar, the /guides hub
 * (titled Learn) and the Learn block on /notebook. The two hubs render it on the server, which is the crawl path:
 * the menu panel only renders when opened. Labels and groups can change freely; the URLs are frozen.
 */
import { threeDExperiences } from "@/data/threeD";

export interface LearnHubItem {
  label: string;
  note: string;
  to: string;
  badges?: string[];
}

export interface LearnHubSection {
  id: string;
  title: string;
  blurb: string;
  items: LearnHubItem[];
}

export const LEARN_HUB: LearnHubSection[] = [
  {
    id: "how-it-works",
    title: "How it works",
    blurb: "Systems taken apart one step at a time, most of them explorable in 3D.",
    items: [
      { label: "How LLMs Work", note: "21 stages you can explore", to: "/guides/how-llms-work" },
      { label: "How Neural Networks Work", note: "13,002 parameters, every fiber drawn", to: "/guides/how-neural-networks-work", badges: ["NEW"] },
      { label: "How Quantum Computers Work", note: "down the golden chandelier, plate by plate", to: "/guides/how-quantum-computers-work", badges: ["NEW"] },
      { label: "Graph Types for AI Agents", note: "one dataset, six structures", to: "/guides/graph-types-for-ai-agents" },
      { label: "What is Jev?", note: "a decision model, one ticket through the bench", to: "/guides/what-is-jev", badges: ["NEW"] },
      { label: "Inside a Home HVAC System", note: "same method, physical hardware", to: "/guides/hvac-system-troubleshooting" },
    ],
  },
  {
    id: "ai-reference",
    title: "AI reference",
    blurb: "The concepts, the people, the players and the numbers, kept current.",
    items: [
      { label: "AI Encyclopedia", note: "187 concepts, one page each", to: "/notebook/ai/encyclopedia" },
      { label: "AI Roadmap", note: "learn AI in 18 weeks + depth tracks", to: "/notebook/ai/roadmap" },
      { label: "AI Agent Statistics", note: "the numbers, updated monthly", to: "/notebook/ai/agents", badges: ["NEW"] },
      { label: "AI Contributors", note: "the 100 people building AI", to: "/ai-contributors" },
      { label: "Map of the AI Economy", note: "455 players, who controls what", to: "/notebook/ai/map" },
      { label: "The Complete Shelf", note: "19 free books", to: "/notebook/ai/shelf" },
    ],
  },
  {
    id: "seo-marketing",
    title: "SEO and marketing",
    blurb: "Working guides for search and marketing teams, from crawling a site to shipping an agent.",
    items: [
      { label: "Screaming Frog Guide 2026", note: "every screen, 76 screenshots", to: "/guides/screaming-frog" },
      { label: "AI Agents for Marketing", note: "build one from zero to production", to: "/guides/ai-agents-for-marketing" },
      { label: "User-First Intelligence", note: "the framework: people before algorithms", to: "/guides/user-first-intelligence", badges: ["NEW"] },
    ],
  },
];

/** Pages with an explorable 3D scene. Read from the 3D data so a new scene badges itself everywhere. */
export const THREE_D_PAGES = new Set(
  threeDExperiences.map((x) => x.to.split("#")[0]).filter((t) => t && t !== "/")
);

/** True when a name already says "3D", so a badge would only repeat it. */
export const saysThreeD = (name: string) => /\b3D\b/.test(name);

/** Adds the "3D" badge (first) to any item whose page has a 3D scene, unless its label already says 3D. */
export function with3d<T extends { to: string; label?: string; badges?: string[] }>(it: T): T {
  const page = it.to.split("#")[0];
  if (!THREE_D_PAGES.has(page) || (it.badges ?? []).includes("3D") || saysThreeD(it.label ?? "")) return it;
  return { ...it, badges: ["3D", ...(it.badges ?? [])] };
}
