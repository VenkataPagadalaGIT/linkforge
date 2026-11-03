/**
 * business-graph.ts: the business side of the site's other datasets, for the Business Notebook (owner, 2026-10-30:
 * "in Business notebooks lets ensure to have all business related", for example /notebook/ai/graph/anthropic).
 *
 * Nothing is copied. Each entry links to the page that owns it (the AI Intelligence Graph, AI Updates, the event
 * files), so a file updated there is current here. Server only: the hub passes plain lists to the view.
 */
import { nodes } from "@/data/aiOntology";
import { AI_360 } from "@/data/ai360";
import type { AIUpdate } from "@/data/aiUpdates";
import { EVENTS } from "@/data/events";
import { entityPath } from "@/lib/graph-urls";

export type BusinessGraphEntry = { name: string; href: string };
export type BusinessSector = { id: string; title: string; detailed: BusinessGraphEntry[]; profiles: BusinessGraphEntry[] };
export type BusinessNewsItem = { href: string; title: string; date: string; company: string };
export type BusinessEventItem = { href: string; title: string; summary: string; updatedAt: string };

/**
 * The graph's business sectors, in reading order. A sector holds companies and also the markets and money flows
 * around them ("AI capex super-cycle", "Stargate Project"). Models, policy, standards, datasets and research stay in
 * the AI Notebook.
 */
const SECTORS: [type: string, title: string][] = [
  ["frontier-lab", "Frontier labs"],
  ["vertical", "Enterprise AI and adopters"],
  ["cloud", "Cloud and compute"],
  ["datacenter", "Data centers and servers"],
  ["accelerator", "Chips and accelerators"],
  ["cpu", "CPUs and chip IP"],
  ["foundry", "Foundries"],
  ["packaging", "Advanced packaging"],
  ["memory", "Memory and HBM"],
  ["equipment", "Chip equipment"],
  ["eda", "Chip design software (EDA)"],
  ["materials", "Materials"],
  ["networking", "Networking"],
  ["energy", "Energy and power"],
  ["cooling", "Cooling"],
  ["investor", "Investors and capital"],
];

const byName = (a: BusinessGraphEntry, b: BusinessGraphEntry) => a.name.localeCompare(b.name);

/** Every business entry in the graph, by sector. "Detailed" entries have a full file (AI_360); the rest a profile. */
export function businessSectors(): BusinessSector[] {
  return SECTORS.map(([type, title]) => {
    const inSector = nodes.filter((n) => n.type === type);
    const entry = (n: (typeof nodes)[number]) => ({ name: n.name, href: entityPath(n.id) });
    return {
      id: type,
      title,
      detailed: inSector.filter((n) => AI_360[n.id]).map(entry).sort(byName),
      profiles: inSector.filter((n) => !AI_360[n.id]).map(entry).sort(byName),
    };
  }).filter((s) => s.detailed.length + s.profiles.length > 0);
}

/** AI Updates filed as industry news (deals, acquisitions, partnerships, hires), newest first. */
export function businessNews(updates: AIUpdate[]): BusinessNewsItem[] {
  return updates
    .filter((u) => u.category === "industry")
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((u) => ({ href: `/ai-updates/${u.slug}`, title: u.title, date: u.date, company: u.company }));
}

/** The event files: one story read from every platform. */
export function businessEvents(): BusinessEventItem[] {
  return Object.values(EVENTS).map((e) => ({ href: `/notebook/events/${e.slug}`, title: e.title, summary: e.summary ?? "", updatedAt: e.updatedAt }));
}

/** The graph page for a Business Notebook company, when the graph has an entity with the same id. */
export function graphFileFor(slug: string): BusinessGraphEntry | null {
  const n = nodes.find((x) => x.id === slug);
  return n ? { name: n.name, href: entityPath(n.id) } : null;
}
