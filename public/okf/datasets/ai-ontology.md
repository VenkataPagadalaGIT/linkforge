---
type: Dataset
title: AI Industry Ontology
description: The AI value chain as a typed graph, 471 entities across 7 layers with 1,245 edges, every edge reviewed twice for direction and factuality.
resource: https://venkatapagadala.com/notebook/ai/map
tags: [ontology, graph, industry]
generated: { by: claude-code/fable-5, at: 2026-07-30T05:30:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-04T11:30:00Z }
sources:
  - id: ontology-module
    resource: src/data/aiOntology.ts in the venkatapagadala.com repository
    title: Ontology data module (471 nodes, 1,245 edges)
    author: human:venkata-pagadala
    last_modified: 2026-07-13
---
# Shape

| Field | Meaning |
|---|---|
| layer | One of 7, from silicon to applications |
| type | Entity type (company, model, person, standard, ...) |
| edges | Typed, directed relationships between entities |

# Review discipline

All 1,245 edges went through two review passes with a verdict recorded per
edge. Related news links entities to https://venkatapagadala.com/ai-updates.

# Related

- Explorable as [Map of the AI Economy](../experiences/ai-economy-map.md).
- The structures behind it are explained in
  [Graph Types for AI Agents](../guides/graph-types-for-ai-agents.md).
