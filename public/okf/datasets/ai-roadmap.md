---
type: Dataset
title: AI Learning Roadmap
description: An 18-week zero-to-hero core plus seven elective depth tracks, 35 topics, 473 curated resources, 440 of them free (93%), every link opened and checked by hand.
resource: https://venkatapagadala.com/notebook/ai/roadmap
tags: [education, free, curriculum]
generated: { by: claude-code/fable-5, at: 2026-08-08T09:00:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-08T09:00:00Z }
sources:
  - id: roadmap-module
    resource: src/data/aiRoadmap.ts in the venkatapagadala.com repository
    title: Roadmap data module (single source of truth)
    author: human:venkata-pagadala
    last_modified: 2026-08-08
---
# Schema

| Field | Meaning |
|---|---|
| topic | One of 35 topics across 7 phases (Foundations to Depth Tracks) |
| week | Position in the plan; weeks 19-25 are elective depth tracks |
| difficulty | beginner, intermediate, advanced |
| resources | bestVideos, bestCourses, books, githubRepos per topic |
| access | absent means free; freemium and paid carry visible badges |

# Counts (audited July 2026, extended August 2026)

473 resources: 127 videos, 134 courses, 93 books, 119 repos. 440 free (93%),
14 freemium, 19 paid.[^roadmap-module] Paid entries exist only where genuinely outstanding and
are always badged.

# Related

- Rendered as [The AI Roadmap Shelf](../experiences/roadmap-shelf.md) and
  [The Complete Shelf](../experiences/complete-shelf.md).

[^roadmap-module]: Roadmap data module (single source of truth)
