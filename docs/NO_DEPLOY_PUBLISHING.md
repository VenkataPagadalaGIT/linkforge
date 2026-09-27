# Publishing without deploys (news first)

**Goal:** a new or edited news article goes live on venkatapagadala.com about a minute after you say "publish". There is no build, no `railway up`, and no deploy.

**Scope of this step:** AI updates (news), the content you add most often, including all 14 existing articles. Insight posts can already be edited without a deploy in the post editor at `/admin/cms/posts`.

The same mechanism will later carry:
- pillars and contributor profiles;
- SEO fields for any page (title, description, canonical, robots);
- page text such as the brightonSEO names.

## How it works

1. **The source of truth is the file `content/ai-updates.json`.** It moved out of the code (`src/data/aiUpdates.ts`, which now only keeps the types and categories).
2. **You ask; Claude edits the file on your Mac.** Then it runs the checks:
   ```bash
   node scripts/cms/publish-news.mjs check
   ```
3. **You say "publish".** Claude runs:
   ```bash
   node scripts/cms/publish-news.mjs publish
   ```
   - This runs the checks again.
   - It writes the file to the `content` branch on GitHub. No Railway service watches that branch, so nothing deploys.
   - It sends the site a signed "refresh news" message.
4. **The site re-reads the file from GitHub** and updates the news pages, the news index, contributor profiles, `sitemap.xml`, `/sitemap`, `llms.txt` and `llms-full.txt`.
5. **The script checks the live page** until the change shows, and reports it.

**Safety:**
- **The site cannot be edited from outside.** The only thing it accepts is the refresh message, which is signed with a secret kept in your Mac's Keychain and in Railway. A forged or replayed message is refused.
- **Even a valid refresh can't inject content.** It only makes the site re-read the file from your repo.
- **If GitHub is unreachable or the file is broken,** the site keeps the copy built into the last deploy. News never disappears.
- **Every publish is a commit on the `content` branch,** so undo is a revert.

**Known limit:** an encyclopedia concept page lists related news from the copy built into the last deploy. A new article's title shows there after the next ordinary deploy. The article itself, the index, contributor profiles and every discovery surface update on publish.

## The checks (`news-validate.ts`, shared by the site and the publisher)

**Blocking** (nothing publishes):
- the file is not a list of articles;
- a required field is missing or has the wrong type (`slug`, `title`, `date`, `summary`, `body`, `category`, and the lists);
- a slug is not lowercase letters, digits and hyphens, or two articles share a slug;
- the category is not one of the five;
- the date is not `YYYY-MM-DD`;
- the body contains unsafe HTML: `<script`, `<iframe`, `<object`, `<embed`, `<form`, `<style`, `<link`, `<meta`, `<base`, an `on...=` handler, or a `javascript:`, `vbscript:` or `data:` link;
- an em dash in a new or changed article.

**Warnings** (the publisher shows them, and you decide):
- an em dash in an article that did not change (58 exist today);
- a title over 60 characters;
- a summary outside 140 to 160 characters.

## Test cases

| ID | Case | Where |
| --- | --- | --- |
| N01 | The migrated file validates: 14 articles, same content as the old code | `tests/frontend/news-validate.test.mjs` |
| N02 | Missing required field, wrong type, bad slug, duplicate slug, bad category, bad date: each blocked | same |
| N03 | Each kind of unsafe HTML in the body is blocked | same |
| N04 | An em dash blocks in a new or changed article and only warns in an unchanged one | same |
| N05 | Title and summary length problems are warnings, not blocks | same |
| S01 | A correctly signed refresh is accepted | `tests/frontend/content-signature.test.mjs` |
| S02 | Wrong secret, tampered body, a timestamp older or newer than 5 minutes, malformed or missing header: each refused | same |
| S03 | No secret configured on the site: every refresh refused | same |
| E01 | End to end, with the real site running: an article absent from the source returns 404 | `scripts/cms/test_no_deploy_news.py` |
| E02 | Add it to the source and send a signed refresh: within seconds the article page, the news index and `sitemap.xml` show it, with no rebuild | same |
| E03 | Edit its title and refresh: the page shows the new title | same |
| E04 | An unsigned or badly signed refresh is refused (401) and changes nothing | same |
| E05 | The source serves a broken file: the site keeps serving the last good news | same |
| E06 | Remove the article and refresh: the page returns 404 again | same |

The E tests run against a production build (`next start`) whose news source points at a local stand-in for GitHub. Only the refresh message makes the site notice changes, which proves there is no deploy in the loop.

**Run everything:**
```bash
cd ~/Desktop/mono-mind-stage
node --test "tests/frontend/*.test.mjs"
node scripts/cms/publish-news.mjs check
```
Then the end-to-end test, with the "site-news-e2e" server from `.claude/launch.json` running on port 3412:
```bash
python3 scripts/cms/test_no_deploy_news.py
```

**Results on 2026-09-27:**
- **Frontend tests:** 16 of 16 pass. That is 7 sign-in, 6 news checks and 3 signature.
- **News file check:** the 14 migrated articles pass.
- **End to end:** 6 of 6 pass.
- **In the preflight:** the frontend tests and the news file check run on every deploy.

**Two things the tests found:**
- **A security gap in the checks, fixed.** A `javascript:` link inside double quotes slipped through, because the checks read the escaped JSON text. They now read the actual text (N03).
- **`sitemap.xml` did not pick up a refresh.** In this Next.js version, a statically cached `sitemap.xml` ignores the refresh message, so it is now built on each request from cached data (E02).

**Known, predates this change:** an unknown or removed article answers HTTP 200 with a "Not found" page marked noindex, instead of a true 404. Google will not index it, but it is a soft 404. The same happens on the live site today. It is tracked as a separate fix; E01 and E06 accept either outcome.

## Deployment plan

**Step 1. Ship the code (you).**
- Run `railway up --detach --service mono-mind-frontend-v2`, then say "push".
- This also ships the earlier CMS merge and sign-in commits.
- Nothing visible changes. News still comes from the copy built into the deploy until the `content` branch exists.

**Step 2. One-time setup (about 10 minutes).**
1. **Claude creates the `content` branch** on GitHub on your "push".
2. **You create the refresh secret.** Run this on your Mac:
   ```bash
   S=$(openssl rand -hex 32); security add-generic-password -U -s vp-content-revalidate -a venkatapagadala.com -w "$S"; printf %s "$S" | pbcopy; unset S; echo "Copied. Paste into Railway as CONTENT_REVALIDATE_SECRET."
   ```
   It stores the secret in your Keychain and puts it on your clipboard; nobody else sees it.
3. **Railway, frontend service:** add `CONTENT_REVALIDATE_SECRET` with the pasted value.
4. **Recommended:** create a GitHub fine-grained token with read-only "Contents" access to the linkforge repo only, and add it as `CONTENT_GITHUB_TOKEN` on the frontend service.
   - Without it the site still reads a public repo, but within GitHub's lower anonymous limit.
   - It is required if the repo becomes private.
5. **Let Railway restart the frontend** with the new variables. This is a restart, not a rebuild.

**Step 3. First real publish (together).**
- Claude fixes one em dash in an existing article and runs `publish`.
- Success means the live page changes within about a minute, and there is no new deployment in Railway.

**Rollback:**
- **Stop reading from GitHub:** remove `CONTENT_GITHUB_TOKEN` and set `CONTENT_SOURCE_URL=off`. The site then serves the copy built into the deploy.
- **Undo one publish:** Claude publishes the previous version of the file, or reverts the commit on the `content` branch and sends a refresh.
