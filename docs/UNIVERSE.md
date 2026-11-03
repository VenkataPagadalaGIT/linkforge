# Venkata Pagadala - Universe

The owned archive of everything Venkata shares, as one knowledge graph on venkatapagadala.com. LinkedIn is the first
source (every post, article and image since 2016); the website, Substack, YouTube, Instagram, Facebook, podcasts and
books join as their data arrives. Name and paths live in one file: `src/data/universe.ts`.

This file is the handover point: read it first in any new session. Private plans and owner decisions also live in
Obsidian (`LinkedIn/LinkedIn Archive — Knowledge Graph (Project).md`) and Notion (page "LinkedIn Archive — Knowledge
Graph (Project)" under LinkedIn).

## URLs (frozen once live)

| Page | URL |
|---|---|
| Hub (the Universe, filters, sidebar, cards) | `/venkata-pagadala-universe` |
| LinkedIn posts (list, then one page each) | `/venkata-pagadala-universe/linkedin/posts`, `.../posts/<slug>` |
| LinkedIn articles (list, then one page each, in full) | `/venkata-pagadala-universe/linkedin/articles`, `.../articles/<slug>` |
| Topics (areas, topics, subtopics; across every source) | `/venkata-pagadala-universe/topics/<slug>` |
| Site map section | `/sitemap/universe` |
| Home page section | `/` (the Universe band, loaded when it scrolls near) |

Redirects (`next.config.mjs`): every old `/linkedin...` URL 308s to its new home; `/sitemap/linkedin` 308s to
`/sitemap/universe`; `/venkata-pagadala-universe/linkedin`, `/venkata-pagadala-universe/topics` and `/linkedin/topics`
307 to the hub (delete that line when a real page is added there, or it will never show).

Slugs are frozen: post slugs by LinkedIn activity id (`scripts/linkedin/post-slugs.json`), topic slugs and article
slugs checked against HEAD by the data guard.

## Data

- Master copy (private) on the Extreme SSD: `LinkedIn-Data/` (exports, media, `processed/linkedin_master.sqlite`).
- Build: `scripts/linkedin/extract-linkedin-posts.py` then `scripts/linkedin/build-linkedin-archive.mjs` (see its header).
  It writes the tracked data modules `src/data/linkedin*Data.ts`; `--include-review` writes git-ignored `*.preview.ts`
  twins instead (local preview with `LINKEDIN_PREVIEW=1`).
- Topic tree: `src/data/linkedinTaxonomy.json` (10 areas, 45 topics, 16 subtopics); assignments in
  `scripts/linkedin/topic-assignments.json`.
- Every entry has a `source` (`LiSource`: linkedin today); the Source filter lists only sources with entries.
- Guard (runs in the preflight): `node scripts/linkedin/check-linkedin-data.mjs`: public items only, no drafts,
  no personal data, frozen slugs, safe article markup.
- Media is never in this repository (it is public). Pages read `NEXT_PUBLIC_LINKEDIN_MEDIA_BASE`, default
  `https://media.venkatapagadala.com/linkedin` (Cloudflare R2). Locally `.env.local` points it at port 4100.

## The view

One view only (owner's call, 2026-10-19): the Universe, `src/components/linkedin/LinkedInUniverse.tsx` (three.js via
React Three Fiber). The older 2D views (Topics, Timeline, Map, Story) were removed in `037c08ca`; the graph data
module is still generated and checked but not loaded.

- Opens on the formed galaxy with image cards popping up; "Ignite" replays the countdown and burst on demand.
- Click an area or topic (or the sidebar, or search) to fly there and open a revolving globe of its posts; hover a
  star or card to lock on (a pulse runs centre > area > topic > star, and on to the card on the globe).
- Topics menu (L1 > L2 > L3 > L4 posts with post and reaction counts), Images, Sound, Auto-orbit, ✕ All, Full screen.
- Sound (off by default, Web Audio only, no files): hum while on screen, a pentatonic note per star, pop ticks,
  warp on flights, a bell on open, Ignite beeps and boom.
- Follows the site theme (Auto, Light, Dark). Reduced motion: no countdown, burst, drift or auto-orbit.
- Home section: `src/components/home/HomeUniverse.tsx` + `LinkedInUniverseSection.tsx` (own filters).

## SEO

- Rules: `cms/rules.json` (title at most 60, description 140 to 160, one H1, on-site canonical, no em dash).
- `src/lib/seoText.ts` fits titles and descriptions to those rules; `src/data/universeSeo.ts` makes every post and
  article title and description unique across both kinds. Topics, the hub and the lists use the same fitters.
- Every Universe page sets its own Open Graph and Twitter card, a self canonical, `index, follow` (empty topics:
  `noindex, follow`), and JSON-LD (CollectionPage, SocialMediaPosting, Article, BreadcrumbList).
- All pages are server-rendered; the 3D view is client-only, and the sidebar, cards and noscript lists carry every
  link without JavaScript.
- Audit: `scripts/linkedin/audit-universe-seo.py` (usage in its header). 2026-10-20 on a production build: 1,007
  pages, all rules pass; open only the 376 share images that point at the R2 host.
- Google News: `publisher.js` loads site-wide in `app/layout.tsx`. It reports `publication-id-free` until the
  Publisher Center publication ID (init snippet) is added.

## Deploy

1. Claude runs `bash scripts/preflight-deploy.sh` from a clean, committed tree with a production server on
   `127.0.0.1:3402` (`next start -p 3402`) so the crawl gates run; it must print `PREFLIGHT PASSED`.
2. The owner runs, from this folder (not `~/Downloads`):
   `cd ~/Desktop/mono-mind-stage && railway up --detach --service mono-mind-frontend-v2`
3. Claude watches the deployment to SUCCESS and verifies the live domain (new pages, titles, canonicals, redirects,
   sitemap, and that a sample of existing pages kept their titles).
4. Then the owner says "push". Never click Deploy in Railway's dashboard (it rebuilds an old branch).

## Release log

- 2026-10-20, deployment `c3dbffca` from commit `3d974038` (branch `linkedin-archive`): first release of the Universe.
  Media host not live yet, so images show broken until R2 is set up.

## Open items

1. **R2 media (blocker for images):** create the bucket, connect `media.venkatapagadala.com`, store an R2-only token
   in the Keychain; then upload the public media and re-verify.
2. Google News publication ID (init snippet from Publisher Center).
3. Who engages with my posts: private only (Notion and Obsidian), and a new LinkedIn read needs the owner's yes.
4. Next sources: Instagram saved posts, YouTube channels, website, Substack. Archive part 2 (Shares, Comments).
5. Two big LinkedIn drafts: the owner decides per draft. Drafts never go public.

## Rules that never change

- This repository is public: no secrets, DMs, connection data or personal files.
- DMs only in Notion and Obsidian; other people's comments only in private Notion; no email addresses or phone
  numbers on public pages; video 0183 (third-party clip) stays off.
- Never push or deploy without the owner's yes; the owner runs the deploy.
