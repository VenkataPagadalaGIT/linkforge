---
type: Attested Computation
title: Corpus counts for venkatapagadala.com
description: The sanctioned way to count this site's corpus, so a reader can check the published numbers instead of trusting them.
resource: https://venkatapagadala.com/notebook/ai
tags: [counts, verification, provenance]
runtime: python
parameters: []
executor:
  resource: scripts/okf_corpus_counts.py
  receipt: [computation, runtime, values, input_digests, commit]
attester:
  resource: scripts/okf_attest.py
generated: { by: claude-code/fable-5, at: 2026-08-08T17:40:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-08T17:40:00Z }
sources:
  - id: data-modules
    resource: src/data/ in the venkatapagadala.com repository
    title: The five data modules every published count is derived from
    author: human:venkata-pagadala
    last_modified: 2026-08-08
---
# Definition

Every headline number this site publishes comes from one place: the data
modules that also render the pages. Nothing is typed by hand into copy, so a
number in the navigation and the same number in `llms.txt` cannot drift
apart without the check below failing.

The computation imports the real modules rather than parsing them, so the
counts are exactly what the site renders, not a regular expression's opinion
of the source.

# Computation

```python
concepts        = len(encyclopediaConcepts)
categories      = len({c.category for c in encyclopediaConcepts})
topics          = len(roadmapTopics)
coreTopics      = len([t for t in roadmapTopics if t.week <= 18])
electiveTopics  = len([t for t in roadmapTopics if t.week > 18])
resources       = sum(len(t.bestVideos) + len(t.bestCourses)
                      + len(t.books) + len(t.githubRepos) for t in roadmapTopics)
free            = count(r for r in all_resources if r.access is absent)
freePercent     = round(100 * free / resources)
contributors    = len(aiContributors)
shelfBooks      = len(shelfBooks)
entities        = len(nodes)
edges           = len(edges)
```

# Receipt

A run returns the derived `values`, a SHA-256 `input_digest` for each of the
five source modules, and the `commit` they were read at. The digests are what
make the receipt evidence rather than an assertion: they say which bytes
produced the numbers.

# Verdict

The attester re-derives every value itself rather than trusting the receipt,
then reads the published claims out of `llms.txt`, `llms-full.txt`, the OKF
dataset concepts and the site's navigation, and compares. It exits non-zero
if any published number disagrees with the data it claims to describe, so it
runs as a gate and not as decoration. Pass `--live` to check the deployed
domain rather than the working tree.

Known good at the time of writing: 175 concepts across 10 categories, 35
topics (28 core plus 7 elective depth tracks), 473 resources of which 440 are
free (93%), 100 contributors, 19 shelf books, 455 entities and 1,161 edges.

# Related

- The numbers this computation backs are published in
  [the datasets](../datasets/index.md).
