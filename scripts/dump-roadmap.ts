// Prints the AI Roadmap and the AI Encyclopedia as JSON for data/corpus/learn_catalog.py, so Python reads exactly what
// the site renders.
import { roadmapTopics, PHASES } from "../src/data/aiRoadmap";
import { aiContributors } from "../src/data/aiContributors";
import { ENCYCLOPEDIA_CATEGORIES, encyclopediaConcepts } from "../src/data/aiEncyclopedia";
import { GUIDES_FOR, VIDEOS_FOR } from "../src/data/encyclopediaResources";

const names = Object.fromEntries(aiContributors.map((c) => [c.id, c.name]));
process.stdout.write(
  JSON.stringify({ topics: roadmapTopics, phases: PHASES, names, concepts: encyclopediaConcepts, categories: ENCYCLOPEDIA_CATEGORIES, videos: VIDEOS_FOR, guides: GUIDES_FOR }) + "\n",
);
