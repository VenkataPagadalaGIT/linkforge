/**
 * learnReference.ts: the encyclopedia, served as a W3Schools-style reference.
 *
 * One source of truth: src/data/aiEncyclopedia.ts. This module adds NO
 * content of its own; it orders the 175 concepts into a stable reading
 * sequence (category, then difficulty, then rank), resolves prerequisite
 * names into links, and centralizes the injection point where interactive
 * builds (3D guides today, videos as they ship) attach to concepts.
 *
 * To put a new video or 3D build on a concept page, add one entry to
 * INTERACTIVE_FOR. To add resources, edit the concept's learnMore in the
 * encyclopedia file: every surface updates together.
 */
import {
  ENCYCLOPEDIA_CATEGORIES,
  encyclopediaConcepts,
  type EncyclopediaConcept,
} from "./aiEncyclopedia";

const DIFF_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const CAT_ORDER = new Map(ENCYCLOPEDIA_CATEGORIES.map((c, i) => [c.label, i]));

/** The canonical reading order for the whole reference. */
export const refConcepts: EncyclopediaConcept[] = [...encyclopediaConcepts].sort((a, b) => {
  const ca = CAT_ORDER.get(a.category) ?? 99;
  const cb = CAT_ORDER.get(b.category) ?? 99;
  if (ca !== cb) return ca - cb;
  const da = DIFF_ORDER[a.difficulty] ?? 9;
  const db = DIFF_ORDER[b.difficulty] ?? 9;
  if (da !== db) return da - db;
  return a.rank - b.rank;
});

export const refConceptById = (id: string) => refConcepts.find((c) => c.id === id);

const byName = new Map(encyclopediaConcepts.map((c) => [c.concept.toLowerCase(), c]));
/** Resolve a prerequisite name to its concept (all names verified to resolve). */
export const refConceptByName = (name: string) => byName.get(name.toLowerCase());

export const refPrevNext = (id: string) => {
  const i = refConcepts.findIndex((c) => c.id === id);
  return {
    prev: i > 0 ? refConcepts[i - 1] : null,
    next: i >= 0 && i < refConcepts.length - 1 ? refConcepts[i + 1] : null,
  };
};

export const refCategoryMeta = (label: string) =>
  ENCYCLOPEDIA_CATEGORIES.find((c) => c.label === label);

export const REF_COUNTS = {
  concepts: refConcepts.length,
  categories: ENCYCLOPEDIA_CATEGORIES.length,
};

/* ------------------------------------------------------------------ *
 *  Injection point: interactive builds attached to concepts.
 *  One entry here puts the card on the concept's reference page.
 * ------------------------------------------------------------------ */

export interface RefInteractive {
  label: string;
  href: string;
  note: string;
}

export const INTERACTIVE_FOR: Record<string, RefInteractive> = {
  "neural-network": {
    label: "Fly through all 13,002 parameters in 3D",
    href: "/guides/how-neural-networks-work",
    note: "Every weight drawn, a 16-step guided journey, and a Train mode where it really learns.",
  },
  "backpropagation": {
    label: "Watch backprop flow through 12,960 fibers",
    href: "/guides/how-neural-networks-work",
    note: "The backward amber wave, staged in 3D, then run for real in Train mode.",
  },
  "gradient-descent": {
    label: "Watch gradient descent race on a real terrain",
    href: "/guides/how-neural-networks-work",
    note: "Two balls, plain SGD vs momentum, on paths computed by actually running the algorithms.",
  },
  "loss-function": {
    label: "See cross-entropy fill a physical meter",
    href: "/guides/how-neural-networks-work",
    note: "Confident wrongness costs 4.61; confident rightness costs 0.36. Watch it live in Train mode.",
  },
  "llm": {
    label: "How LLMs Work: the 3D walkthrough",
    href: "/guides/how-llms-work",
    note: "21 stages from your keystrokes to the next token, with the full training story.",
  },
  "transformer": {
    label: "The transformer stack, explorable in 3D",
    href: "/guides/how-llms-work",
    note: "Attention beams, expert routing, the KV cache: click every stage.",
  },
  "attention-mechanism": {
    label: "Watch attention poll the sentence",
    href: "/guides/how-llms-work",
    note: "The journey step where every token asks every earlier token what matters.",
  },
  "tokenization": {
    label: "Watch text become tokens",
    href: "/guides/how-llms-work",
    note: "Five words become five IDs at the tokenizer station.",
  },
  "embeddings": {
    label: "Vectors in meaning-space, staged in 3D",
    href: "/guides/how-llms-work",
    note: "The embedding wall: token IDs become points where distance means similarity.",
  },
  "rag": {
    label: "Graph Types for AI Agents: retrieval structures compared",
    href: "/guides/graph-types-for-ai-agents",
    note: "One dataset modeled six ways: vector index, knowledge graph, and friends.",
  },
  "knowledge-graph": {
    label: "Knowledge graphs vs five other structures, in 3D",
    href: "/guides/graph-types-for-ai-agents",
    note: "The same records as taxonomy, ontology, knowledge graph, and vector index.",
  },
};

/** Base path of the one-and-only learning surface. */
export const REF_BASE = "/notebook/ai/encyclopedia";

export const refHref = (id: string) => `${REF_BASE}/${id}`;

/* ------------------------------------------------------------------ *
 *  Deep dives: the fact-checked lesson content, merged into concepts.
 *  Concept id -> lesson slugs from src/data/learn.ts, rendered inline
 *  on the concept's page. One place to read; nothing behind a hop.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 *  News injection: concept id -> AI Update slugs.
 *  Same pattern as INTERACTIVE_FOR: one entry puts an "In the news"
 *  block on the concept page, and the story gains an inbound link from
 *  the concept it is actually about. Explicit rather than tag-derived,
 *  because a wrong automatic match is worse than no link.
 * ------------------------------------------------------------------ */

export const NEWS_FOR: Record<string, string[]> = {
  "inference-optimization": ["stripe-openrouter-acquisition-7-billion"],
  "llm": ["stripe-openrouter-acquisition-7-billion"],
  "ai-agents": ["stripe-openrouter-acquisition-7-billion"],
};

export const DEEP_DIVES: Record<string, string[]> = {
  "artificial-intelligence": ["what-is-ai", "history-of-ai"],
  "machine-learning": ["what-is-machine-learning"],
  "deep-learning": ["ai-vs-ml-vs-deep-learning", "training-in-practice"],
  "agi": ["types-of-ai"],
  "gradient-descent": ["how-machines-learn"],
  "supervised-learning": ["supervised-learning"],
  "unsupervised-learning": ["unsupervised-learning"],
  "reinforcement-learning": ["reinforcement-learning"],
  "overfitting-underfitting": ["overfitting-and-generalization"],
  "neural-network": ["what-is-a-neural-network"],
  "backpropagation": ["how-a-network-learns"],
  "llm": ["from-networks-to-llms"],
  "hallucination": ["what-networks-can-and-cannot-do"],
};
