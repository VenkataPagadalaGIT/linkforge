# Publishing without deploys

**Goal:** a content change goes live on venkatapagadala.com about a minute after you say "publish". There is no build, no `railway up`, and no deploy.

**What publishes this way:**

| Content | File | Status |
| --- | --- | --- |
| News (AI updates), all 14 articles | `content/ai-updates.json` | Live since 2026-09-27 |
| Page SEO fields: the title, meta description, canonical and robots of any public page | `content/seo-overrides.json` | Built and tested 2026-09-27; switches on with the next deploy |

Still to come: pillars and contributor profiles, and page text such as the brightonSEO names. An H1 or body change is part of a page's code and still needs a deploy.

## How it works

1. **The source of truth is a file in the repo** (the table above).
2. **You ask; Claude edits the file on your Mac.** Then it runs the checks:
   ```bash
   node scripts/cms/publish.mjs check news
   node scripts/cms/publish.mjs check seo
   ```
3. **You say "publish".** Claude runs `node scripts/cms/publish.mjs publish news` (or `seo`). This:
   - runs the checks again; for SEO it also confirms that each changed page, and each canonical it points at, is a live page;
   - writes the file to the `content` branch on GitHub. No Railway service watches that branch, so nothing deploys;
   - sends the site a signed refresh message naming what changed.
4. **The site re-reads the file from GitHub** and re-renders what changed. The first visitor after a refresh may still get the old page while the new one renders; everyone after gets the new one.
5. **The script checks the live pages** until the change shows, and reports it.

**Safety:**
- **The site cannot be edited from outside.** The only thing it accepts is the refresh message, which is signed with a secret kept in your Mac's Keychain and in Railway. A forged or replayed message is refused.
- **Even a valid refresh can't inject content.** It only makes the site re-read the repo's own files and re-render pages.
- **If GitHub is unreachable or a published file is broken,** the site keeps the last good copy, or the copy built into the last deploy. Nothing disappears.
- **Every publish is a commit on the `content` branch,** so undo is a revert.

**One read for the whole server.** The site reads each file from GitHub at most once per period (5 minutes for news, an hour for SEO), shared by every page, and again at once after a refresh message. Next.js keeps separate cached copies per group of pages (6 for news and 4 for SEO in this build); without the shared read the site could ask GitHub about 76 times an hour, past GitHub's anonymous limit of 60 (`src/lib/content-github.ts`).

## News

The refresh updates the article pages, the news index, contributor profiles, `sitemap.xml`, `/sitemap`, `llms.txt` and `llms-full.txt`.

**Known limit:** an encyclopedia concept page lists related news from the copy built into the last deploy. A new article's title shows there after the next ordinary deploy.

### News checks (`src/lib/news-validate.ts`, shared by the site and the publisher)

**Blocking** (nothing publishes):
- the file is not a list of articles;
- a required field is missing or has the wrong type (`slug`, `title`, `date`, `summary`, `body`, `category`, and the lists);
- a slug is not lowercase letters, digits and hyphens, or two articles share a slug;
- the category is not one of the five;
- the date is not `YYYY-MM-DD`;
- the body contains unsafe HTML: `<script`, `<iframe`, `<object`, `<embed`, `<form`, `<style`, `<link`, `<meta`, `<base`, an `on...=` handler, or a `javascript:`, `vbscript:` or `data:` link;
- an em dash in a new or changed article.

**Warnings** (the publisher shows them, and you decide):
- an em dash in an article that did not change;
- a title over 60 characters;
- a summary outside 140 to 160 characters.

## Page SEO fields

### What an override does

The file names pages by path and sets any of four fields:

```json
{
  "pages": {
    "/about": {
      "title": "About Venkata Pagadala, AI systems architect",
      "description": "About Venkata Pagadala: AI systems architect and researcher...",
      "canonical": "/about",
      "robots": "index, follow"
    }
  }
}
```

- **title** is the exact `<title>`. No " · Venkata Pagadala" suffix is added, so write the whole title. It also becomes the page's Open Graph title (the preview on LinkedIn, Slack and Facebook), and its X title where the page sets its own X card. 276 pages inherit the site-wide X title today; that predates this change and is tracked separately.
- **description** is the meta description, and likewise the Open Graph description (and the X one where the page sets it).
- **canonical** is a page on this site: a path such as `/about`, or the full `https://venkatapagadala.com/...` address. `og:url` follows. A page whose canonical points at another page leaves `sitemap.xml`.
- **robots** is one of `index, follow`, `noindex, follow`, `index, nofollow`, `noindex, nofollow`. A noindex page leaves `sitemap.xml` and gets no separate googlebot tag. An indexable page keeps Google's large image previews.
- **Every field is optional.** A page the file does not name renders exactly as its code says, and removing an entry restores the page.
- **Not here:** the H1 and body text are part of the page's code, so they still need a deploy. The checks say so if you try.

### How the site applies it

- **Every public page reads the file.** That is all 50 page routes (1,084 pages): each exports its metadata through `withSeoOverrides` (`src/lib/seo-overrides.ts`). A test fails the preflight if a page skips it (C01).
- **The site caches the file under the "seo" tag.** A refresh message updates it within seconds; without one, the site re-reads it hourly.
- **Side effect: pages re-render hourly.** A page now re-renders at most once an hour, and only when visited, where most pages used to be built once per deploy.
- **The page cache is set up for this** (`next-cache-handler.cjs`). After a refresh, a page is served once more from the cache and re-rendered in the background. Next.js 14.2's stock behavior re-renders it blocking, and on routes limited to a fixed list of pages that answers 404 until the next deploy (R02, below).

### SEO checks (`src/lib/seo-validate.ts`; the numbers come from `cms/rules.json`)

**Blocking** (nothing publishes; the site also refuses such a copy):
- the file is not `{ "pages": { ... } }`;
- a path that is not a clean page path (`/about`: no trailing slash, query or `#`), or one under `/admin`, `/api` or `/_next`;
- an unknown field (the H1 gets its own message), or a field that is empty or not text;
- `<` or `>` in any field;
- a canonical off this site, on `http`, on `www`, with a query or `#`, or with a trailing slash;
- a robots value other than the four allowed.

**Blocking at publish only:**
- an em dash in a new or changed entry;
- a changed page that is not live, or a canonical that points at a page that is not live.

**Warnings:** a title over 60 characters; a description outside 140 to 160.

## Test cases

| ID | Case | Where |
| --- | --- | --- |
| N01 | The migrated news file validates: 14 articles, same content as the old code | `tests/frontend/news-validate.test.mjs` |
| N02 | Missing required field, wrong type, bad slug, duplicate slug, bad category, bad date: each blocked | same |
| N03 | Each kind of unsafe HTML in the body is blocked | same |
| N04 | An em dash blocks in a new or changed article and only warns in an unchanged one | same |
| N05 | Title and summary length problems are warnings, not blocks | same |
| S01 | A correctly signed refresh is accepted | `tests/frontend/content-signature.test.mjs` |
| S02 | Wrong secret, tampered body, a timestamp older or newer than 5 minutes, malformed or missing header: each refused | same |
| S03 | No secret configured on the site: every refresh refused | same |
| V01 | The committed SEO file and a full good entry pass | `tests/frontend/seo-validate.test.mjs` |
| V02 | Structure problems block: bad file shape, unknown or empty fields, the H1, bad and closed paths | same |
| V03 | A canonical must stay on this site as a clean page address, at runtime too | same |
| V04 | Robots must be one of the four allowed values, exactly | same |
| V05 | `<` or `>` in any field blocks, at runtime too | same |
| V06 | An em dash blocks a new or changed entry and only warns in an unchanged one | same |
| V07 | Title and description lengths warn, for changed entries only | same |
| V08 | Changed and removed pages are reported for the refresh message | same |
| V09 | The numbers come from `cms/rules.json`, not from the checker | same |
| A01 | No override leaves a page's metadata exactly as its code defines it | `tests/frontend/seo-apply.test.mjs` |
| A02 | A title is the exact `<title>`, and the Open Graph and X title where the page sets them; same for a description | same |
| A03 | A canonical replaces only the canonical: feeds stay, `og:url` follows | same |
| A04 | Robots: noindex drops Google's extras, index keeps them, googlebot never contradicts robots | same |
| A05 | Fields the override does not name stay as the code defines them | same |
| A06 | The page's own metadata object is never changed | same |
| F01 | A route and its params give the page path the file is keyed by | same |
| M01 | `sitemap.xml` leaves out pages set to noindex or canonicalised elsewhere | same |
| C01 | Every public page wraps its metadata in `withSeoOverrides` with its own route | `tests/frontend/seo-coverage.test.mjs` |
| K01 | A refreshed page is served once and re-rendered in the background, where the stock cache drops it | `tests/frontend/cache-handler.test.mjs` |
| K02 | A page never rendered is still a miss, so an unknown slug keeps its 404 | same |
| K03 | Refreshed data is dropped at once, so the re-render reads the new content | same |
| K04 | A page re-rendered after the refresh is an ordinary fresh hit again | same |
| K05 | Data over 2MB is not cached, as with the stock cache | same |
| G01 | One GitHub read serves every page for the period | `tests/frontend/content-github.test.mjs` |
| G02 | The refresh message makes the next read ask GitHub again | same |
| G03 | GitHub down or answering an error: the last good copy keeps serving | same |
| G04 | A copy that fails the checks is refused; the last good copy keeps serving | same |
| G05 | The read passes no cache option (an explicit no-store breaks static pages in Next.js 14.2) | same |
| E01 | End to end, with the real site running: an article absent from the source is not found | `scripts/cms/test_no_deploy_news.py` |
| E02 | Add it and send a signed refresh: the article page, the news index and `sitemap.xml` show it, with no rebuild | same |
| E03 | Edit its title and refresh: the page shows the new title | same |
| E04 | An unsigned, badly signed or tampered refresh is refused (401) and changes nothing | same |
| E05 | The source serves a broken or unsafe file: the site keeps the last good news | same |
| E06 | Remove the article and refresh: not found again, and gone from `sitemap.xml` | same |
| E07 | After a news refresh, every contributor and site-map section page still answers 200 | same |
| SE01 | With an empty SEO file, every page renders the metadata its code defines | `scripts/cms/test_no_deploy_seo.py` |
| SE02 | A title and description on a static page (`/about`) go live from a refresh naming only the tag | same |
| SE03 | A prerendered dynamic page (`/guides/what-is-jev`) takes its override | same |
| SE04 | A page rendered per request (`/experience`) takes its override | same |
| SE05 | Robots noindex: the tag says so, googlebot does not contradict it, the page leaves `sitemap.xml` | same |
| SE06 | A canonical moves the link and `og:url`, and the page leaves `sitemap.xml` | same |
| SE07 | Removing every override restores each page and `sitemap.xml` exactly | same |
| SE08 | Unsigned, wrongly signed or tampered refreshes, and bad page paths, are refused and change nothing | same |
| SE09 | A broken, unsafe or unreachable published copy keeps the last good overrides | same |
| SE10 | After a refresh, one page of every fixed-list route still answers 200, twice | same |
| R01 | With no overrides, all 1,084 pages of a local production build match the build before this change on every SEO field | `scripts/cms/inventory.py` + `scripts/cms/compare_seo_snapshots.py` |
| R02 | After a refresh of every page, all 1,084 pages still answer 200, re-render, and match again | same |

The E and SE tests run against a production build (`next start`) whose content sources point at a local stand-in for GitHub. Only the refresh message makes the site notice changes, which proves there is no deploy in the loop.

**Run everything:**
```bash
cd ~/Desktop/mono-mind-stage
node --test "tests/frontend/*.test.mjs"
node scripts/cms/publish.mjs check news
node scripts/cms/publish.mjs check seo
```
Then the end-to-end tests, with the "site-news-e2e" server from `.claude/launch.json` running on port 3412 (the SEO one first, then wait a minute: the site accepts 30 refreshes a minute):
```bash
python3 scripts/cms/test_no_deploy_seo.py
python3 scripts/cms/test_no_deploy_news.py
```
And the whole-site regression (R01, R02): crawl a production build of the previous commit and of this one with `SITE_BASE=http://127.0.0.1:<port> python3 scripts/cms/inventory.py <out>.json`, then `python3 scripts/cms/compare_seo_snapshots.py before.json after.json`. For R02, send a signed refresh for the "seo" and "news" tags first, then crawl twice.

**Results on 2026-09-27** (local production build, `next start`):
- **Unit tests:** 44 of 44 pass. That is 7 sign-in, 6 news checks, 3 signature, 9 SEO checks, 8 override logic, 1 page coverage, 5 page cache and 5 shared reader.
- **Control tests.** Each check was shown to fail on broken code:
  - C01 fails on a page that exports its metadata directly;
  - V03 fails with the canonical check switched off;
  - K01 shows the stock cache dropping a refreshed page.
- **R01:** all 1,084 pages match the build before this change on every SEO field. That covers the title, description, canonical, robots, H1, social tags, googlebot and schema types.
- **R02:** after one refresh of every page:
  - all 1,084 answer 200 and still match;
  - 584 of the 607 prerendered pages were really re-rendered.
- **End to end:** page SEO 10 of 10 (SE01 to SE10), news 7 of 7 (E01 to E07).
- **Publisher, against the local build** (dry-run and verify only, nothing written to GitHub):
  - P01: a page that is not live blocks the publish;
  - P02: a canonical that points at a page that is not live blocks;
  - P03: a valid change passes every check;
  - P04: `verify` confirms all four fields on live pages;
  - P05: `verify` names a page whose live title differs from the file.
- **In the preflight:** the unit tests and both file checks run on every deploy.

**Three problems the tests found, all fixed before release:**
1. **Refreshed pages turned into lasting 404s** (R02's first run: 516 pages).
   - The affected routes are limited to a fixed list of pages (`dynamicParams = false`): contributors, encyclopedia concepts, conference pages, guides, guide topics, solutions and site-map sections.
   - On those routes, Next.js 14.2 answers a blocking re-render with a 404 until the next deploy.
   - The code live today has the same trap for news. Once the refresh secret is set in Railway, the first news publish would 404 the 100 contributor pages and 18 site-map section pages.
   - Fixed by `next-cache-handler.cjs` (K01 to K05, E07, SE10, R02).
2. **Static pages kept old content after a refresh** (the first SEO end-to-end run: 5 of 10 failed, all on `/about`).
   - The read asked for `no-store`, which Next.js 14.2 treats as "this static page must be dynamic" and throws. The error was swallowed, and the last good copy was served and cached again.
   - The news index had the same flaw. It only looked right because the article page, read first, refreshed the shared copy.
   - Fixed by dropping the option (G05).
3. **Too many GitHub reads.** Next.js keeps separate cached copies of the same read per group of pages: 6 for news and 4 for SEO in this build. That is up to about 76 GitHub requests an hour, past the anonymous limit of 60. Fixed by one shared read per file per period (G01 to G04).

**Known, predates this change:** an unknown or removed article answers HTTP 200 with a "Not found" page marked noindex, instead of a true 404. Google will not index it, but it is a soft 404. It is tracked as a separate fix; E01 and E06 accept either outcome.

## Deployment plan

### Page SEO fields and the refresh fixes (this release)

**Step 1. Ship the code (you).** Do this before step 2.
- Claude runs the preflight; it must print `PREFLIGHT PASSED`.
- You run `railway up --detach --service mono-mind-frontend-v2`, then say "push". The backend redeploys on the push, with nothing changed.
- **Nothing visible changes.** Every page renders exactly as before (R01). Pages now re-render at most hourly, only when visited.
- Claude verifies on the live domain: the deployment id changed, a sample of pages keep their titles, `sitemap.xml` is unchanged, and `/api/revalidate` still refuses (503, no secret yet).

**Step 2. Turn on the one-minute refresh (you, about 2 minutes), only after step 1 is live.**
1. Copy the secret already in your Keychain:
   ```bash
   security find-generic-password -s vp-content-revalidate -a venkatapagadala.com -w | pbcopy
   ```
2. In Railway, open the `mono-mind-frontend-v2` service in production. Add `CONTENT_REVALIDATE_SECRET` with the pasted value, then apply the change.
3. **Strongly recommended:** add `CONTENT_GITHUB_TOKEN`. Create a fine-grained GitHub token with read-only "Contents" access to the linkforge repo only.
   - Railway's outbound addresses may be shared with other customers, and GitHub's anonymous limit of 60 reads an hour is counted per address.
   - The token is required if the repo turns private.

Without step 2, a publish still goes live, just slower: within 5 minutes for news and within about 2 hours for page SEO.

**Step 3. First SEO publish (together).**
- Pick one page from the CMS page, for example one of the titles over 60 characters.
- Claude writes the override and runs the check. You say "publish".
- Success means the page changes within about a minute and Railway shows no new deployment. Claude confirms with `node scripts/cms/publish.mjs verify seo` and a screenshot.

**Rollback:**
- **One SEO change:** remove the entry and publish. No deploy.
- **All overrides at once:** publish `{"pages": {}}` (no deploy), or set `CONTENT_SEO_SOURCE_URL=off` in Railway.
- **The code:** redeploy the previous site deployment (`6cb326ad`) in Railway.
  - If you roll back after step 2, also remove `CONTENT_REVALIDATE_SECRET`. The old code has the 404 trap described above.

### News (done 2026-09-27)

The code shipped in deployment `6cb326ad`, and the `content` branch was created. The first publish (an em dash fix) went live without a deploy through the 5-minute re-read, because the refresh secret is not set in Railway yet; step 2 above sets it.

- **Stop reading news from GitHub:** set `CONTENT_SOURCE_URL=off`. The site then serves the copy built into the deploy.
- **Undo one publish:** Claude publishes the previous version of the file, or reverts the commit on the `content` branch and sends a refresh.
