---
type: Dataset
title: Top 100 AI Contributors
description: One hundred profiled people shaping AI, ranked, with bios, affiliations, education, timelines and curated reading lists.
resource: https://venkatapagadala.com/ai-contributors
tags: [people, directory]
generated: { by: claude-code/fable-5, at: 2026-07-30T05:30:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-04T11:30:00Z }
sources:
  - id: contributors-module
    resource: src/data/aiContributors.ts in the venkatapagadala.com repository
    title: Contributors data module (single source of truth)
    author: human:venkata-pagadala
    last_modified: 2026-07-27
---
# Shape

| Field | Meaning |
|---|---|
| rank | 1 to 100 |
| segment, specialty | Where in the field they work |
| affiliation | Current home |
| keyInfluence, bio | Why they matter |
| resources | Papers, talks, interviews, books per person |
| connections | Links to related contributors |

# Related

- Rendered as [The Top 100 Album](../experiences/top-100-album.md).
- People link to news at https://venkatapagadala.com/ai-updates and to
  roadmap resources they personally authored.
