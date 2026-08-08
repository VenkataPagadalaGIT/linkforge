---
type: Dataset
title: AI Concepts Encyclopedia
description: 167 AI concepts across 10 categories with key terms, prerequisites, difficulty levels, and curated learn-more links. Reviewed July 2026, extended August 2026.
resource: https://venkatapagadala.com/notebook/ai/encyclopedia
tags: [concepts, reference]
generated: { by: claude-code/fable-5, at: 2026-08-08T09:00:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-08T09:00:00Z }
sources:
  - id: encyclopedia-module
    resource: src/data/aiEncyclopedia.ts in the venkatapagadala.com repository
    title: Encyclopedia data module (single source of truth)
    author: human:venkata-pagadala
    last_modified: 2026-08-08
---
# Schema

| Field | Meaning |
|---|---|
| category | One of 10, Foundations through Emerging Topics |
| difficulty | beginner, intermediate, advanced |
| keyTerms | The vocabulary the concept unlocks |
| prerequisites | Concepts to read first |
| learnMore | Curated external links, checked by hand |
