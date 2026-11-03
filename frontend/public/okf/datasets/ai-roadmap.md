---
type: Dataset
title: AI Learning Roadmap
description: An 18-week zero-to-hero AI curriculum, 28 topics, 420 curated resources, 388 of them free (92%), every link opened and checked by hand.
resource: https://venkatapagadala.com/notebook/ai/roadmap
tags: [education, free, curriculum]
generated: { by: claude-code/fable-5, at: 2026-07-30T05:30:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-04T11:30:00Z }
sources:
  - id: roadmap-module
    resource: src/data/aiRoadmap.ts in the venkatapagadala.com repository
    title: Roadmap data module (single source of truth)
    author: human:venkata-pagadala
    last_modified: 2026-07-30
---
# Schema

| Field | Meaning |
|---|---|
| topic | One of 28 topics across 6 phases (Foundations to Specialize & Build) |
| week | Position in the 18-week plan |
| difficulty | beginner, intermediate, advanced |
| resources | bestVideos, bestCourses, books, githubRepos per topic |
| access | absent means free; freemium and paid carry visible badges |

# Counts (audited July 2026)

420 resources: 115 videos, 121 courses, 84 books, 100 repos. 388 free, 13
freemium, 19 paid.[^roadmap-module] Paid entries exist only where genuinely outstanding and
are always badged.

# Related

- Rendered as [The AI Roadmap Shelf](../experiences/roadmap-shelf.md) and
  [The Complete Shelf](../experiences/complete-shelf.md).

[^roadmap-module]: Roadmap data module (single source of truth)
