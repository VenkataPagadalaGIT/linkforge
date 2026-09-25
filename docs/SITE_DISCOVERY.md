# Site discovery: how every page reaches crawlers and AI agents

One registry, five surfaces, two deploy gates. Add a page to the registry and it
appears on every surface at the next build, with no second edit. Forget the
registry and the deploy fails.

## The five surfaces

| Surface | URL | Who reads it | What it lists |
|---|---|---|---|
| XML sitemap | `/sitemap.xml` | Search engines | Every indexable page, with lastmod, changefreq and priority |
| HTML site map | `/sitemap`, plus one view per section at `/sitemap/<section>` | People, and crawlers that navigate by links | Every page and every talk, video, paper and award, by section |
| llms.txt | `/llms.txt` | AI agents, first stop | Who this is, every section view, every guide, guide topic and AI update |
| llms-full.txt | `/llms-full.txt` | AI agents, full read | The long-form profile, guides, topics, AI updates and research, plus every page on the site with its title |
| OKF site index | `/okf/site-index.md` | Agents reading the Open Knowledge Format bundle | Every page, by section, as an OKF concept |

All five are rendered from `src/lib/siteIndex.ts` (`getSiteIndex()`), so they
cannot disagree. The OKF guides index (`/okf/guides/index.md`) is generated from
the guide data the same way.

Each is built at `next build` (every deploy) and regenerated at most once an
hour after that (`revalidate = 3600`), so content served by the backend, such as
AI updates and insights, appears without a deploy.

## Adding a page

**Content in an existing data module.** A new guide in `src/data/guides.ts`, an
AI update in `src/data/aiUpdates.ts`, a persona, a guide topic, a conference
session, a speaker, an encyclopedia concept: nothing else to do. The registry
reads the module, so the page is on all five surfaces at the next build.

**A new route** (a new `app/**/page.tsx`). Register it in `getSiteIndex()`:

- A single page: add a row to `STATIC_ROUTES`: `[path, title, section, hub?]`.
- A family of pages: loop over its data module, like the guides loop, giving each
  entry an `href`, `title`, `section` and `xml` block.
- A page that must stay out of search: add it to `NOT_INDEXED_ROUTES` with a
  reason, and give the page `robots: { index: false }` in its metadata. A pattern
  ending in `/*` covers a subtree (`/admin/*`).

**A new section.** Add it to `SECTIONS` (`id`, `label`, `blurb`). Its view
`/sitemap/<id>` and its line in llms.txt appear on their own.

**Words for agents.** The hand-written prose lives in `src/content/llms.md` and
`src/content/llms-full.md`. Never list pages there by hand; drop in a
placeholder and the list is rendered from data:

| Placeholder | Renders |
|---|---|
| `{{discovery}}` | Links to all five surfaces |
| `{{guides}}` | Every guide, newest first, with its summary, URL and markdown edition |
| `{{topics}}` | Every guide topic with its guide count |
| `{{updates}}` | Every AI update with its date and summary |
| `{{research}}` | Papers, talks, podcasts and recognition |
| `{{site-index}}` | Every section: page count, view URL and URL prefix (llms.txt) |
| `{{every-page}}` | Every page with its title, by section (llms-full.txt) |

An unknown placeholder fails the build (`discovery: unknown placeholder`), so a
typo can never ship as a silent gap. The Audience Personas block in `llms.md` is
regenerated from the research database by `data/corpus/gen_llms_section.py`.

**A guide's summary for agents.** Set `agentSummary` on the guide record: one
fact-dense paragraph of what the guide covers and what it counts. Without it the
`metaDescription` stands in.

**An OKF concept for a guide** (optional). Add `public/okf/guides/<slug>.md`. The
OKF guides index links it and uses its `description`; a guide without one links
its markdown edition instead.

## What the gates prove

Both run in `scripts/preflight-deploy.sh` after its build, against the server at
`$PERSONA_BASE` (start that server from the same commit).

`scripts/check-route-coverage.py` fails when:

- any route under `app/` is neither registered nor listed in `NOT_INDEXED_ROUTES`;
- a `NOT_INDEXED_ROUTES` entry no longer matches a route, or its page is not
  noindex, or it appears on any surface;
- any page the build prerendered is not in sitemap.xml, not a listed machine
  file, not deliberately hidden, and not noindex. This catches one guide, topic or
  session that renders but was never registered, by URL;
- a file in `public/` sits at a route's path (see below).

`scripts/check-discovery-surfaces.py` fails when:

- any sitemap.xml URL is missing from `/sitemap`, the section views,
  llms-full.txt or the OKF site index;
- llms.txt misses a section view, guide, guide topic or AI update;
- any surface stops linking the others (see the map below);
- a surface is not 200, has the wrong content type, or carries an unfilled
  placeholder, or any URL a surface names is not 200;
- a file in `public/okf` is unreachable from `okf/index.md`, or the OKF guides
  index misses a guide;
- a sitemap.xml page is noindex or not 200, or a noindex conference logistics
  session leaks onto a surface.

Both were control-tested on 2026-09-25 by planting each failure: an orphan
route, a stale hidden-route entry, an unregistered prerendered page, a missing
section in llms-full.txt, a missing section in the OKF site index, a guide
dropped from llms.txt, an orphan OKF file and a static `public/llms.txt`. Every
one failed the gate.

For a single URL, `scripts/check-discovery.py <path>` answers what Search
Console will: 200, in sitemap.xml, allowed by robots.txt, self-canonical, not
noindex, listed for agents, and linked from a hub.

## Who links whom

```
every page's footer ──> /sitemap, /llms.txt, /sitemap.xml, /okf/index.md
robots.txt ───────────> sitemap.xml
sitemap.xml ──────────> every indexable page, including /sitemap, /llms.txt, /llms-full.txt
/sitemap ─────────────> every page and item, sitemap.xml, llms.txt, llms-full.txt, OKF index, OKF site index
llms.txt ─────────────> all surfaces, every section view, every guide, topic and AI update
llms-full.txt ────────> all surfaces, every page
okf/index.md ─────────> OKF site index, guides index, llms.txt, llms-full.txt, sitemap.xml, /sitemap
okf/site-index.md ────> every page, all surfaces
```

## Files

| File | Role |
|---|---|
| `src/lib/siteIndex.ts` | The registry: `SECTIONS`, `STATIC_ROUTES`, `NOT_INDEXED_ROUTES`, `getSiteIndex()` |
| `src/lib/discovery.ts` | Renders llms.txt, llms-full.txt and the two OKF indexes |
| `src/content/llms.md`, `src/content/llms-full.md` | Hand-written prose with placeholders |
| `app/sitemap.ts` | sitemap.xml |
| `app/sitemap/page.tsx`, `app/sitemap/[section]/page.tsx`, `src/views/SiteMapView.tsx` | The HTML site map |
| `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts` | Serve the llms files |
| `app/okf/site-index.md/route.ts`, `app/okf/guides/index.md/route.ts` | Serve the generated OKF indexes |
| `scripts/check-route-coverage.py`, `scripts/check-discovery-surfaces.py` | The two deploy gates |
| `scripts/okf_attest.py` | Checks the counts written in the prose against the data |

Do not recreate `public/llms.txt`, `public/llms-full.txt` or
`public/okf/guides/index.md`. A static file at a route's path is served instead
of the route and the build does not warn (tested 2026-09-25: a planted
`public/llms.txt` replaced the generated file). `check-route-coverage.py` fails
the deploy if one appears.

## Why it works this way

The llms files used to be static, patched by `scripts/gen-llms-topics.ts` and
`scripts/gen-llms-research.ts`. Anything added without rerunning them went
stale. On 2026-09-25 llms.txt listed 5 of 14 AI updates, llms-full.txt listed 1
of 7 guides and 1 of 14 AI updates, and the OKF guides index listed 5 of 7
guides. Both scripts are retired; the lists are now rendered from the same
registry as sitemap.xml.
