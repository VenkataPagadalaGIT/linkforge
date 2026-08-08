/**
 * Everything on this site that runs in three dimensions, in one list.
 *
 * The nav's 3D menu and the /3d hub both read from here, so adding the next
 * 3D experience is one entry, not three edits. Every one of these is
 * generated geometry running in the browser: no model files, no downloads.
 */

export interface ThreeDExperience {
  title: string;
  to: string;
  /** One line for the menu. */
  note: string;
  /** A fuller sentence for the hub card. */
  blurb: string;
  /** Small-caps tags on the hub card. */
  tags: string[];
  badge?: string;
}

export const threeDExperiences: ThreeDExperience[] = [
  {
    title: "3D Game: the 2040 City",
    to: "/3d-game",
    note: "walk and drive a 2040 city",
    blurb:
      "A city that runs itself, and you can interrupt it. Walk the humanoid, greet the crew, or take the controls of any truck, robotaxi, semi or barge from a formula-style cockpit.",
    tags: ["playable", "procedural traffic", "cockpit"],
  },
  {
    title: "The Living Portrait",
    to: "/",
    note: "65k tiles wearing a neural net",
    blurb:
      "The homepage portrait assembles from sixty-five thousand mosaic tiles, wears a pulsing neural net, tilts with your pointer, and shatters and heals when you click it.",
    tags: ["65,536 tiles", "chain firing", "on the homepage"],
    badge: "new",
  },
  {
    title: "How LLMs Work",
    to: "/guides/how-llms-work",
    note: "21 stages, explorable in 3D",
    blurb:
      "Every stage a prompt passes through, modeled as an explorable machine: tokenizer, attention, MoE experts, KV cache, sampling, and the training story, with a guided token journey.",
    tags: ["21 stages", "guided journey", "teardown"],
  },
  {
    title: "Inside a Home HVAC System",
    to: "/guides/hvac-system-troubleshooting",
    note: "same method, physical hardware",
    blurb:
      "A full split system in 3D wired to a fault ontology: watch healthy power-on sequences, trip cold-climate faults, and diagnose from symptoms like a tech would.",
    tags: ["fault library", "diagnosis", "teardown"],
  },
  {
    title: "The Complete Shelf",
    to: "/notebook/ai/shelf",
    note: "19 free books, in 3D",
    blurb:
      "A walnut shelf of nineteen genuinely free AI books, typeset covers and spines generated in code. Pull one out, inspect it, and read it free at the publisher.",
    tags: ["19 volumes", "all free", "typeset in code"],
  },
  {
    title: "The AI Roadmap, as a Shelf",
    to: "/notebook/ai/roadmap",
    note: "28 topics as clothbound volumes",
    blurb:
      "The 18-week curriculum as a shelf of twenty-eight volumes: cloth colour from the phase, thickness from the resource count, and every volume opens into its real resources.",
    tags: ["28 topics", "92% free", "curriculum"],
  },
  {
    title: "The Top 100, as One Book",
    to: "/notebook/ai",
    note: "a glass album of 100 faces",
    blurb:
      "One glass-bound album with a hundred photo pages, one per contributor. It starts closed with an etched title, opens itself or lets you pull the cover, and every page opens a profile.",
    tags: ["100 pages", "glass case", "page turns"],
    badge: "new",
  },
  {
    title: "Map of the AI Economy",
    to: "/notebook/ai/map",
    note: "455 players, who controls what",
    blurb:
      "The whole AI value chain as one dependency graph: 455 entities across 7 layers, explorable flat or in 3D, with every edge reviewed by hand.",
    tags: ["455 entities", "7 layers", "graph"],
  },
];
