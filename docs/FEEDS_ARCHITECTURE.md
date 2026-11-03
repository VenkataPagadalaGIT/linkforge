# Knowledge Graph Feeds: how it is built, and how it holds at 10,000 stories

The reader decides what they see. The order is explainable. Nothing is ranked by what keeps people scrolling.

## The layers

| Layer | What it does | Where |
| --- | --- | --- |
| Catalog | One record per thing: every roadmap and Encyclopedia resource, with format, platform, creator, image and a checked link | Postgres `learn.*`, `data/corpus/learn_catalog.py`, generates `src/data/learnCatalog.ts` |
| Stories | Every story, filed under subjects | `src/lib/story-index.ts` (news, notes, event files), Postgres `events.*` |
| Ranking | One small function: freshness, evidence, claims checked, live | `src/lib/news-rank.ts` (tests: `tests/frontend/news-rank.test.mjs`) |
| Search | Topics, resources, news, people, companies, posts | `src/lib/feed-search.ts`, `/feeds/search.json` |
| Screens | One feed shell, loaded on demand | `CardFeed.tsx` (News, Learn, Search), `KnowledgeFeed.tsx` (one story's sources) |

The browser reads `/feeds/news.json`, `/feeds/learn.json` and `/feeds/search.json` only when needed, so the pages stay light.

## How a story is ranked

`score = 0.60 freshness + 0.25 evidence + 0.15 checked + 0.25 if live`

- Freshness halves every 14 days.
- Evidence is sources read and primary documents kept, on a log scale; 300 is the top.
- Checked is claims given a verdict against their sources, up to 10.
- No personal signal and no engagement signal. Every card says why it is there.

## What changes as the corpus grows

| Stories | What holds | What to change |
| --- | --- | --- |
| Today, about 15 | Everything | Nothing |
| 1,000 | Ranking, subjects, one news file | Send the top 500 ranked cards; page the rest by subject and month |
| 10,000 | Ranking (tested at 10,000 in under a second), subjects, story pages | Compute the score in Postgres. One static file per subject and month. Move story posts out of `src/data/events.ts` so each loads only when opened |
| Search past about 5 MB of index | The `search()` seam | Replace the single file with a Postgres full-text endpoint (`tsvector`, plus `pgvector` for meaning). The search box and feed do not change |
| Many stories a day | The event pipeline | The agent system: find the day's story, collect under paid-API caps, verify quotes, file under subjects, publish |

## Rules that do not change

- Every post belongs to something the reader can switch off.
- A link or search result opens exactly that post, whatever the reader's filters would hide, for that visit only.
- A failed check is never treated as a dead link. Dead links never reach a feed.
- Labels say only what is true: "link checked" means a machine checked it on that date.
