# The CMS for venkatapagadala.com

There is one CMS, and it has three parts.

- **The CMS page**, in Claude as "venkatapagadala.com CMS", shows:
  - every page type and every page's SEO fields;
  - the site-wide rules and the agent permissions;
  - page-level editing: edits you save wait in its Edits list.

  The page holds no password or key and cannot change the site.
- **This folder** is the one source of truth that the CMS page and every check read:
  - `page-types.json`: the 15 page types, with each type's route, where its content lives, what a change needs today, and the plan.
  - `rules.json`: your SEO rules. Titles up to 60 characters, descriptions 140 to 160, one H1, a canonical on this site, the allowed robots values, and no em dashes.
  - `permissions.json`: what Venkata Claude may do on each page type ("Live on your OK", "Draft for review" or "Blocked"). Anything not listed is blocked.
- **Scripts** in `scripts/cms/`:
  - `inventory.py` reads the live site;
  - `build_view.py` builds the CMS page from that inventory and this folder;
  - `publish.mjs` checks and publishes the no-deploy content: news (`content/ai-updates.json`) and page SEO fields (`content/seo-overrides.json`).

## How an edit reaches the site

News (AI updates) and every page's title, description, canonical and robots publish without a deploy: see [docs/NO_DEPLOY_PUBLISHING.md](../docs/NO_DEPLOY_PUBLISHING.md).

1. You edit a page on the CMS page and save it. It waits in Edits as "Waiting for Claude".
2. You tell Claude "apply my CMS edits". For each edit, Claude writes the fields into `content/seo-overrides.json`, runs `node scripts/cms/publish.mjs check seo`, and marks the edit "Applied". An H1 or body change is code: Claude edits the page instead.
3. You say "publish": `node scripts/cms/publish.mjs publish seo` checks that each page is live, writes the file to the `content` branch and refreshes those pages. No deploy. A code change (H1, body) still needs `railway up`, which you run.
4. Claude checks the live page and marks the edit "Live", or "Not applied" with the reason.

## Rebuild the CMS page

```bash
python scripts/cms/inventory.py .cms/inventory.json
python scripts/cms/build_view.py .cms/inventory.json .cms/venkatapagadala-cms.html
```

Then republish that file to the same artifact. Git ignores `.cms/`, so none of it is committed or uploaded.

## What was retired (2026-09-26)

The first agentic CMS was removed:
- `backend/agentic_cms.py`, `backend/site_profile.py` and the `/api/cms/*` routes;
- the admin screens for pages, review, global SEO, agents and site profile.

It was never connected to a live page, and it held no data in production: no pages, drafts, settings or agent keys. Its SEO rules and permission model continue in this folder. The post editor at `/admin/cms/posts` stays until posts move to this flow.
