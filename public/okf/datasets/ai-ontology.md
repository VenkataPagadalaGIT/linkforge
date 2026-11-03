---
type: Dataset
title: AI Industry Ontology
description: The AI value chain as a typed graph, 455 entities across 7 layers with 1,161 edges, every edge reviewed twice for direction and factuality.
resource: https://venkatapagadala.com/notebook/ai/map
tags: [ontology, graph, industry]
generated: { by: claude-code/fable-5, at: 2026-07-30T05:30:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-08T09:00:00Z }
sources:
  - id: ontology-module
    resource: src/data/aiOntology.ts in the venkatapagadala.com repository
    title: Ontology data module (455 nodes, 1,161 edges)
    author: human:venkata-pagadala
    last_modified: 2026-07-13
---
# Schema

| Field | Meaning |
|---|---|
| layer | One of 7, from silicon to applications |
| type | Entity type (company, model, person, standard, ...) |
| edges | Typed, directed relationships between entities |

# Review discipline

The review passes covered 1,245 candidate edges with a verdict recorded per
edge; 84 were cut, leaving the 1,161 that ship. Related news links entities to https://venkatapagadala.com/ai-updates.

# Related

- Explorable as [Map of the AI Economy](../experiences/ai-economy-map.md).
- The structures behind it are explained in
  [Graph Types for AI Agents](../guides/graph-types-for-ai-agents.md).
