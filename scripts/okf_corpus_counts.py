#!/usr/bin/env python3
"""The sanctioned way to count this site's corpus.

Every headline number the site publishes (concepts, topics, resources, the
free percentage, entities, edges) is derived here and nowhere else. The
point is that a reader does not have to take the numbers on faith: they can
run this and get a receipt, then hand the receipt to okf_attest.py, which
re-derives the same numbers and says whether the published claims match.

This is the executor for the OKF Attested Computation concept at
public/okf/computations/corpus-counts.md (OKF v0.2 section 10).

Usage:  python3 scripts/okf_corpus_counts.py          # prints the receipt as JSON
"""
import hashlib
import json
import os
import re
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO, "src", "data")

SOURCES = {
    "encyclopedia": os.path.join(DATA, "aiEncyclopedia.ts"),
    "roadmap": os.path.join(DATA, "aiRoadmap.ts"),
    "ontology": os.path.join(DATA, "aiOntologyData.ts"),
    "contributors": os.path.join(DATA, "aiContributors.ts"),
    "shelf": os.path.join(DATA, "libraryShelf.ts"),
}


def sha256(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def counts_via_typescript():
    """Count by importing the real modules, so the numbers are the ones the
    site renders rather than a regex's opinion of them."""
    script = """
import { encyclopediaConcepts } from './src/data/aiEncyclopedia';
import { roadmapTopics } from './src/data/aiRoadmap';
import { aiContributors } from './src/data/aiContributors';
import { shelfBooks } from './src/data/libraryShelf';
import { nodes, edges } from './src/data/aiOntology';

let resources = 0, free = 0, freemium = 0, paid = 0;
for (const t of roadmapTopics as any[]) {
  for (const r of [...t.bestVideos, ...t.bestCourses, ...t.books, ...t.githubRepos] as any[]) {
    resources++;
    if (r.access === 'paid') paid++;
    else if (r.access === 'freemium') freemium++;
    else free++;
  }
}
console.log(JSON.stringify({
  concepts: encyclopediaConcepts.length,
  categories: new Set((encyclopediaConcepts as any[]).map(c => c.category)).size,
  topics: roadmapTopics.length,
  coreTopics: (roadmapTopics as any[]).filter(t => t.week <= 18).length,
  electiveTopics: (roadmapTopics as any[]).filter(t => t.week > 18).length,
  resources, free, freemium, paid,
  freePercent: Math.round((100 * free) / resources),
  contributors: aiContributors.length,
  shelfBooks: shelfBooks.length,
  entities: nodes.length,
  edges: edges.length,
}));
"""
    out = subprocess.run(
        ["npx", "tsx", "-e", script],
        cwd=REPO, capture_output=True, text=True, timeout=300,
    )
    if out.returncode != 0:
        raise RuntimeError("count failed: " + (out.stderr or "")[-2000:])
    line = [l for l in out.stdout.strip().splitlines() if l.startswith("{")][-1]
    return json.loads(line)


def main():
    values = counts_via_typescript()
    receipt = {
        "computation": "corpus-counts",
        "runtime": "python",
        "values": values,
        # The inputs are hashed so an attester can tell whether the numbers
        # were derived from the data that actually ships.
        "input_digests": {k: sha256(v) for k, v in sorted(SOURCES.items())},
        "commit": subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=REPO,
            capture_output=True, text=True,
        ).stdout.strip(),
    }
    json.dump(receipt, sys.stdout, indent=2, sort_keys=True)
    print()


if __name__ == "__main__":
    main()
