# The AI Intelligence Graph: sources, pipelines, and the agent loop

Written 2026-10-28. Code lives in `data/corpus/` (collectors, loaders, generators), the site reads `src/data/ai360.ts`, `aiIntel.ts`, `aiOntologyData.ts`. Every figure on the site carries the exact sentence it came from.

## 1. What each tool can do

| Source or tool | What it gives us | Cost | How we use it | Status |
|---|---|---|---|---|
| Company's own sites (sitemap crawl) | Every page: text, publish date, team, topics, authors; the full newsroom and research record from birth to now | Free, 1 request a second | `collect_site.py`; 6 Anthropic hosts (anthropic.com, Alignment Science blog, Transformer Circuits, claude.com, developer docs, support center) | Running: 587 + 4,100 + 4,200 + 4,500 pages |
| SEC EDGAR | Filings (S-1, 10-K, 10-Q, 8-K, proxies, Form D, 13F, Form 4), exhibits (every material contract), XBRL financial history | Free; needs a contact string in the User-Agent | S-1 read in the built-in browser; 19 financings, 14 agreements, 13 legal matters, 18 people, with 174 verified quotes; `sec_facts.py` for XBRL history | Blocked on the owner's contact string for the API |
| Company newsroom announcements | Lead investors, valuations, round dates, customer counts | Free | Quotes checked locally with `verify.py` | Done for Anthropic |
| OpenAlex | Every author whose paper lists the company as affiliation; ORCID | Free; page paging only without a key | `collect_openalex_people.py`; tiers confirmed / likely / unverified / model | 66 people shown, 491 raw |
| Wikidata | Founders, inception, LEI, OpenCorporates id, social handles, subreddit, YouTube channel id, LinkedIn company id | Free | Identity facts and cross-source ids (used `anthropicresearch` as the LinkedIn company id) | Pulled; to load as facts |
| Public job boards (Greenhouse, Ashby, Lever) | Every open role, team, city, workplace; closed roles over time | Free | `collect_jobs.py`; 13 boards, 4,130 roles | Daily |
| Hacker News (Algolia) | Stories naming the company by month; most discussed threads | Free | `collect_attention.py`; 8 companies | Daily |
| GDELT | News tone by day, article volume | Free, 1 request per 5 s | `collect_tone.py` | Refused all day on 2026-10-28; retries nightly |
| Wikimedia Commons | Free-licensed portraits with credit | Free | `fetch_people_photos.py` via curated Wikidata ids | 7 photos |
| Yahoo Finance (yfinance) | Price, day change, market cap, 52-week range for listed companies | Free, unofficial | `collect_market.py`; 111 of 135 listed companies | Daily; licensed feed before anything public |
| Bright Data Marketplace datasets | LinkedIn people profiles (115M, filter by `current_company_name` or company id), LinkedIn company pages, Crunchbase companies and people, Glassdoor reviews, G2 reviews, Indeed jobs, App Store and Play Store reviews, Trustpilot | $2.50 per 1,000 records; zero-match filters free; `records_limit` caps spend | `bd_pilot.py` (cap in code, lockfile, raw archive); LinkedIn = the "every employee" source | Pilot done 2026-10-28: 20 profiles for $0.05, all 20 name Anthropic as current employer; the sync search endpoint rejects `records_limit`, the async filter endpoint accepts it (snapshot builds in about 90 s) |
| Bright Data Scraper API | Reddit posts and comments by keyword, subreddit or author; X posts and profiles; YouTube channels, videos, comments, subtitles; GitHub repos; LinkedIn posts | $1.50 per 1,000 records | Reddit by keyword (`bd_pilot.py --reddit`); X profiles from LinkedIn `bio_links`; YouTube comments for the user-first layer | Pilot done 2026-10-28: 21 posts for $0.03; keyword discovery also returns memes that only mention the word in comments, so posts are kept only when the title or body names Anthropic or Claude |
| Bright Data SERP and Web Unlocker | Google results for any query; any blocked page as HTML or screenshot | $1.50 per 1,000 requests | Substack and X account discovery by search; pages that block plain requests | Zones active: `serp_origin_check`, `web_unlocker1`, `mcp_unlocker`, `mcp_browser` |
| DataForSEO (MCP connected) | Keywords the company's domain ranks for, traffic estimate, backlinks and referring domains, tech stack, whois, Google Trends, brand mentions with sentiment (content analysis), LLM mentions (how ChatGPT and others cite the brand), business listings | Per call; cheapest: Google Ads volume $0.06 per 1,000 keywords, SERP $0.0006 per page, Trends $0.0027 per 5 terms; brand-mention and LLM-mention endpoints priced per request | Demand side of user-first intelligence: what people search for about the company and its products; share of AI answers | Needs approval per run (no paid SEO APIs without a yes) |
| MCP scraper key (`~/Desktop/sec/mcpscraper.rtf`) | Unknown: the file holds one key and no label | Unknown | Nothing yet | Owner to say which service it is |
| Claude (Anthropic API or OpenRouter) | Reads new pages and proposes dated facts, people changes, deals and legal events as drafts with verified quotes | Sonnet-class list price about $3 per million input tokens | `agent_update.py`; refuses without `AI_AGENT_APPROVED=1` and a key; cap in code | Dry run works; no key on disk |
| CourtListener | Dockets and rulings for every case | Free with an account token | Legal timeline with filings | Owner creates the token |
| Reddit API | Posts and comments by subreddit, keyword and user, with scores | Free tier with an app | Alternative to Bright Data for Reddit | Owner creates the app |

## 2. The pipelines

`data/corpus/ontology/pipelines.json` lists every pipeline with cadence, cost class and what it writes. `python3 run_pipelines.py` runs what is due and logs each run to `ontology.pipeline_run` (status, note), so freshness is a fact the site can show. Paid pipelines run only with `--approve-paid <id>` and a cap in the environment; the scripts enforce the cap in code, hold a lockfile, and archive raw responses under `data/corpus/raw/` (ignored by git). `python3 run_pipelines.py --status` prints the freshness table.

Order: schema, loaders (groups, company files, deal batches, 360 files, market shares), collectors (SEC, GitHub, feeds, jobs, site, attention, tone, research people, market, photos, icons), paid (LinkedIn monthly, Reddit weekly), then generate and the brand gate.

## 3. The agent loop (how AI agents feed and update the graph)

1. Collectors bring in raw material on their cadence (pages, posts, filings, jobs, quotes). No judgement, no cost.
2. `agent_update.py` takes what is new since the last run, asks Claude for dated facts, people changes, deals and legal events, and keeps only items whose quote appears word for word in the source text.
3. Survivors land in `data/corpus/proposals/<entity>_<date>.json` as drafts. The owner approves; approved items are copied into the curated seed files, which the loaders own.
4. The generators rebuild the site's data files; the brand gate and the determinism check run; the preview shows the change before any deploy.

Nothing an agent writes reaches the site without a human approval, and every approved line still carries its quote.

## 4. What is still missing for a Palantir and Bloomberg standard

- One identity per company and person across sources (entity resolution): today name variants are merged by first and last name only.
- Filings at scale (every 10-K, 10-Q, 8-K, proxy, Form D, 13F, Form 4) once the SEC contact string is set.
- Change alerts (new officer, lawsuit, round, hiring spike) by email or Slack, on top of the RSS feeds that exist.
- A screener and typed query layer across companies; the API and MCP server exist for one entity at a time.
- Licensed market data before anything is public; Yahoo is for localhost.
- Accounts, audit trail and a removal process for anyone listed, before LinkedIn-derived rows go beyond localhost.

## 5. Pilot results (2026-10-28)

| Run | Asked | Got | Cost | Quality |
|---|---|---|---|---|
| LinkedIn people filter, current company = Anthropic | 20 | 20 | $0.05 | 20 of 20 name Anthropic as current employer, 13 in the US and 3 in Ireland; none of the 20 carries a job title or an experience list (only name, location, company, education, about). For roles, the Scraper API's collect-by-URL on each profile ($1.50 per 1,000) is the follow-up, so a full run is about $4 per 1,000 people for discovery plus detail |
| Reddit posts, keyword Anthropic, top, all time | 25 | 21 | $0.03 | 10 of 21 name Anthropic or Claude in the title or body; the rest matched the word in comments and were dropped |

Full-run estimate from these rates: all LinkedIn profiles naming Anthropic (about 5,300 staff, allow 9,000 records) $22.50; Reddit, 2,000 posts $3.00; X profiles for people with an X link in their LinkedIn bio, 1,000 profiles $1.50. Hard cap in code: $30 for LinkedIn, $10 for Reddit.
