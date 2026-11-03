# Every content change without a deploy: plan (2026-09-28)

## Goal

**Any content on venkatapagadala.com can be changed by the CMS agent and goes live about a minute after the owner says "publish".** That covers text, names, lists, links, numbers, news, posts, SEO fields, new items of an existing page type, and images.

There is no build and no `railway up` for any of it. A deploy is only for code: layout, components, the 3D scenes, and a brand-new page type.

## Why a name needs a deploy today

The site has two kinds of content.

| Kind | What | Change needs |
| --- | --- | --- |
| Read from GitHub while the site runs | News (`content/ai-updates.json`) and every page's title, description, canonical and robots (`content/seo-overrides.json`) | "publish" only |
| Built into the site | Everything else | a deploy |

Everything else is:
- 48 data files in `src/data` (2.5 MB): guides, personas, conferences and speakers, encyclopedia, AI map, roadmap, research and talks, the brightonSEO names and photos, and more.
- Text written directly into 36 page components: home, about, contact, projects, and others.
- 36 markdown copies and 355 images in `public/`.
- 73 browser-side components that import that data straight from code.
- Insight posts (22), pillars (6), contributors (100) and conference notes (47), which sit in the old backend database.

The agent can edit all of it. Only the first kind goes live without a deploy, because the live site has no edit door by design: it only re-reads content files when a signed refresh arrives.

## Design: one mechanism, built once, used by every content type

1. **Content files.** Each content type is a JSON file under `content/` (one file per item when a type is large). Files are published to the `content` branch, exactly like news.
2. **One content reader** for every type. It generalizes `src/lib/news-source.ts` and `src/lib/seo-overrides.ts`:
   - validates each copy, keeps the last good one, and falls back to the copy built into the deploy;
   - uses one shared GitHub read per file per period;
   - gives each type its own refresh tag.
3. **Pages read content on the server** and hand it to their components.
   - Browser-side components get it through a content provider instead of importing `src/data` directly.
   - The data files keep their TypeScript types. Their data moves to the content files, and the committed copy stays as the fallback.
4. **Page copy for fixed pages.** One `content/pages.json` holds named text blocks per page: headings, paragraphs, lists, stats.
   - A component renders `copy("about.intro")` and falls back to the text in code.
   - So existing text becomes editable block by block, and nothing breaks halfway.
5. **New items without a deploy.** Routes limited to a fixed list (`dynamicParams = false`) switch to reading their list from content, with a real 404 for an unknown slug.
   - This is tested by HTTP status, not by page text, because a 200 "not found" page (a soft 404) is what `dynamicParams = false` was added to prevent.
   - `next-cache-handler.cjs` already keeps refreshed pages from 404ing.
6. **Machine copies update on publish.** The markdown copies in `public/` become routes built from the same content, because a static file cannot change without a deploy. `llms.txt`, `llms-full.txt` and the published counts are computed from content at request time.
7. **One publisher.** `scripts/cms/publish.mjs` gets one kind per content type (check, publish, verify).
   - Shared checks: structure per type, unsafe HTML, working links, no em dashes.
   - Per-type rules live next to each type.
8. **Images outside the build:**
   - either the `content` branch, served through a site route (no new service);
   - or Cloudflare R2 (paid; the price comes from Cloudflare's page when the owner decides).
9. **Coverage you can see.**
   - The CMS page shows, per page type, whether it is editable without a deploy (yes, partly, no), plus one site-wide percentage.
   - A preflight test fails if a new data file appears in `src/data` without being registered as content or declared code-only, so coverage cannot quietly slip back.

## Order

Each phase runs plan and test cases, build, tests, then one deploy. After that deploy, the phase's content is publish-only for good. Most-edited content comes first.

| Phase | Covers | Done when |
| --- | --- | --- |
| **1. Foundation and fixed pages** | The generic reader, provider and publisher kinds. Page copy for home, about, contact, projects, publications, research and talks, and the brightonSEO recap (names, photo captions, stats). The markdown copies of those pages as routes. | Adding a brightonSEO name is an edit and "publish", live in about a minute, with no deploy |
| **2. Old database content to files** | Contributors (100), pillars (6), insight posts (22), conference notes (47). The old post editor and the backend content API retire. | A new insight post goes live on "publish"; the backend no longer serves content |
| **3. Structured collections** | Conferences, speakers and sessions, personas (33) and the framework, solutions, research. New items without a deploy (the fixed-list routing change). | A new speaker page goes live on "publish"; an unknown slug still answers a real 404 |
| **4. Guides and reference** | Guide text (the 3D parts stay code), encyclopedia (187), roadmap, AI map and ontology (455), library, AI agents stats. The generators write content files instead of TypeScript. | A guide paragraph or an encyclopedia entry changes on "publish" |
| **5. Images** | New and replaced images without a deploy, stored as the owner decides. | A new photo on the brightonSEO page goes live on "publish" |

**Stays code:**
- layout and components;
- the 3D scenes and their geometry data (the HVAC, neural network, quantum, LLM and Jev scenes);
- a brand-new page type (one deploy, after which its pages are content).

## Test cases (the same bar as news and SEO fields, for every content type)

- **Checks:**
  - a valid file passes;
  - each structure problem blocks;
  - unsafe HTML blocks;
  - an em dash blocks in a new or changed item;
  - broken links block.
- **End to end,** on a production build with a local stand-in for GitHub:
  - add, edit and remove an item;
  - a broken copy keeps the last good one;
  - an unsigned or forged refresh is refused;
  - the markdown copy and `llms.txt` follow the change;
  - for list routes, a new item answers 200 and an unknown slug answers a real 404.
- **Whole site** before every deploy:
  - with no content change, all 1,084 pages come out identical (R01);
  - after a refresh of everything, they are still identical (R02).
- **Live,** after every deploy: one real edit is published and verified, with no deploy.

## Risks and how each is handled

| Risk | Handling |
| --- | --- |
| 73 browser-side components import data directly | They move to the content provider, one type at a time, each covered by the whole-site regression |
| Large files (ontology 485 KB, encyclopedia 170 KB) | Under GitHub's 1 MB limit for this read. Reads are shared and cached, refreshed on publish; large types split into one file per item if needed |
| Soft 404s on new-item routes | Tested by HTTP status in the end-to-end cases before any route switches |
| GitHub's anonymous read limit (60 an hour) as files multiply | The shared read keeps it to one read per file per period. A read-only `CONTENT_GITHUB_TOKEN` becomes required from phase 2 |
| Security | Unchanged: the live site accepts only the signed refresh, content comes only from the repo, and the checks run both in the publisher and in the site |

## What the owner does

- Approve this order, or reorder it.
- Run one `railway up` per phase, from Terminal.
- Decide image storage at phase 5.
- Disconnect GitHub from `mono-mind-frontend-v2` in Railway (needed regardless; see the incident in `docs/NO_DEPLOY_PUBLISHING.md`).

## Cost

- No new services until images.
- No new money figures here: any paid option comes with the vendor's own price page.
