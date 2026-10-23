/**
 * Credits and inspiration: the sources this site learned from.
 *
 * Every interactive on this site was built from scratch, but nothing is built
 * in a vacuum. When a design, a technique, or a way of explaining something
 * taught us how to do our version better, it gets a permanent public credit
 * here. That is the deal: we learn openly, we credit openly.
 *
 * Add an entry whenever a new piece of work borrows an idea worth naming.
 * Keep `whatWeLearned` specific: "the shelf rail constraint" teaches a future
 * reader something, "great design" does not. Never include tokens, session
 * ids, or tracking parameters in URLs.
 */

export interface Inspiration {
  id: string;
  /** The work or person being credited. */
  title: string;
  /** Who made it. */
  creator: string;
  /** Public link to the work itself, stripped of any tokens or tracking. */
  url: string;
  /** What we specifically learned or borrowed, in plain words. */
  whatWeLearned: string;
  /** Where on this site the lesson shows up. */
  usedIn: { label: string; to: string }[];
  /** Month the influence landed, e.g. "July 2026". */
  when: string;
}

export const inspirations: Inspiration[] = [
  {
    id: "mint-complete-shelf",
    title: "The Complete Shelf (interactive 3D library)",
    creator: "Mint (mint.gg)",
    url: "https://play.mint.gg/complete-shelf",
    whatWeLearned:
      "The editorial grammar of a browsable 3D bookshelf: one volume always featured with its cover turned out, a large serif title panel, typeset spines, a ruler scrubber, and the discipline of railing the browse camera along one axis so spines stay readable. Our shelf re-implements that grammar procedurally, with typeset canvas textures instead of asset files, and fills it with nineteen genuinely free books.",
    usedIn: [
      { label: "The Complete Shelf", to: "/notebook/ai/shelf" },
      { label: "AI Roadmap", to: "/notebook/ai/roadmap" },
      { label: "AI Contributors", to: "/notebook/ai" },
    ],
    when: "July 2026",
  },
  {
    id: "3blue1brown",
    title: "But what is a GPT? (Neural networks series)",
    creator: "Grant Sanderson, 3Blue1Brown",
    url: "https://www.3blue1brown.com/topics/neural-networks",
    whatWeLearned:
      "That a mechanism becomes memorable when you can watch it happen: build the visual first, let the narration follow it, and never show a number the viewer cannot see move. The How LLMs Work guide is our attempt at that standard for the full transformer pipeline.",
    usedIn: [{ label: "How LLMs Work", to: "/guides/how-llms-work" }],
    when: "June 2026",
  },
  {
    id: "thrustmaster-f1-wheel",
    title: "Formula-style racing wheel design",
    creator: "Thrustmaster",
    url: "https://www.thrustmaster.com/",
    whatWeLearned:
      "The physical layout of a modern formula cockpit wheel: grip ergonomics, rotary and button placement, and the display-in-rim pattern. The 3D game's cockpit wheel is an original model informed by that layout, with its own control set.",
    usedIn: [{ label: "3D Game", to: "/3d-game" }],
    when: "July 2026",
  },
];
