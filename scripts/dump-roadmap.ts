// Prints the AI Roadmap as JSON for data/corpus/learn_catalog.py, so Python reads exactly what the site renders.
import { roadmapTopics, PHASES } from "../src/data/aiRoadmap";
import { aiContributors } from "../src/data/aiContributors";

const names = Object.fromEntries(aiContributors.map((c) => [c.id, c.name]));
process.stdout.write(JSON.stringify({ topics: roadmapTopics, phases: PHASES, names }) + "\n");
