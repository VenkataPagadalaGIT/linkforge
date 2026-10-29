# Global SEO and AI search jobs: collection and storage plan (2026-10-29)

Owner's ask: every job in SEO, AI search, AEO, GEO and AI visibility, at every level, in every company possible, in about 175 countries and their languages; store everything (description, salary, posted date, company, all fields) because the data serves many purposes; launch with the AI graph. Tools on hand: Bright Data, OpenRouter, DataForSEO.

Status: plan. Nothing paid has run. Unit prices below come from the vendors' own pages or our billing; volumes are assumptions until the pilot measures them.

## 1. What each source gives (checked 2026-10-29)

| Source | How | Fields (as the source names them) | Gaps |
|---|---|---|---|
| Bright Data, LinkedIn job listings (`gd_lpfll7v5hcqtkxl6l`) | Marketplace filter, $2.50 per 1,000 records, $0 when nothing matches | job_title, company_name, company_id, company_url, company_logo, job_location, country_code, job_posted_date, job_posted_time, job_seniority_level, job_employment_type, job_function, job_industries, job_num_applicants, job_description_formatted, job_summary, base_salary, job_base_pay_range, salary_standards, apply_link, is_easy_apply, application_availability, job_poster, job_posting_id, title_id, url (29) | Salary only where LinkedIn shows it; `job_poster` is a person: never published |
| Bright Data, Indeed job listings (`gd_l4dx9j9sscpvs7no2`, 7.38M records) | Same | job_title, company_name, company_link, company_website, company_rating, company_reviews_count, location, country, region, date_posted, date_posted_parsed, description, description_text, job_description_formatted, salary_formatted, job_type, benefits, qualifications, shift_schedule, is_expired, apply_link, jobid, url, srcname, domain, logo_url (28) | Indeed's country coverage only |
| Bright Data, Glassdoor job listings (`gd_lpfbbndm1xnopbrcr0`) | Same | job_title, job_overview, pay_range_employer_est, pay_range_glassdoor_est, pay_median_employer, pay_median_glassdoor, pay_range_currency, pay_type, company size, revenue, industry, sector, founded year, headquarters, ratings (culture, comp, work-life, management, CEO approval), benefits, job_application_link, job_posting_id, url (39) | Best salary data; fewer countries |
| DataForSEO Google Jobs SERP | Per page of 10 results: $0.0006 standard queue, $0.0012 priority; up to 200 results per keyword, location and language | job_id, title, employer_name, employer_url, employer_image_url, location, source_name, source_url, salary, contract_type, timestamp, time_ago | No description: `source_url` points to the original posting, which we read for the full text |
| Company job boards (Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Personio, Teamtailor) | Free public APIs (we already read 13 boards) | Full description, location, team, posted and updated dates, workplace type; pay ranges where published (pay-transparency states, EU) | Only companies we know |
| Company career pages | Free: the `JobPosting` structured data on the page | title, description, datePosted, validThrough, baseSalary (min, max, currency, unit), employmentType, hiringOrganization, jobLocation, applicantLocationRequirements | Not every site marks it up |
| Currency rates | Free: European Central Bank daily reference rates | Rate per currency per day | For salary comparison only; the original amount is always kept |

Rule kept from the AI graph work: no scraping of LinkedIn or Indeed pages ourselves; their data comes only from the licensed datasets.

## 2. The search plan

- **Themes (labels, not just keywords):** SEO (technical, content, local, e-commerce, international, enterprise), AEO, GEO / LLM optimization, AI visibility, AI search (marketing side), search and organic growth; plus a separate builder label for AI search engineering and product, because "AI search" also means engineers building search.
- **Keywords per language:** "SEO" is used as is in most languages; add local terms (for example 検索エンジン最適化 and SEO担当 in Japanese, Suchmaschinenoptimierung in German, référencement naturel in French, posicionamiento web in Spanish, otimização para mecanismos de busca in Portuguese, 搜索引擎优化 in Chinese, 검색엔진 최적화 in Korean). The list lives in a data file, one row per term, language and theme.
- **Countries:** start with 25 markets, then all countries the sources support (Google Jobs, LinkedIn `country_code`, Indeed and Glassdoor country sites).
- **Levels:** intern, entry, mid, senior, lead or staff, manager, director, head or VP, C-level; freelance and contract as their own flag.

Keyword matches are not enough. In our own 4,136 open roles, 7 titles matched these words and 1 was a real fit: "GEO" was a sales territory ("Account Executive, Geo Enterprise") and "AI Search" was a search engineer. Every posting goes through a classifier (section 4).

## 3. Storage: schema `jobs` in research_corpus (Postgres)

| Table | One row per | Key columns |
|---|---|---|
| `jobs.posting` | unique job | title, title_norm, company_name, company_id → `jobs.company`, country, region, city, workplace (onsite, hybrid, remote), employment_type, level, function, themes[], language, description_text, description_html, salary_min, salary_max, salary_currency, salary_period, salary_text, salary_basis (stated by employer, estimated by Glassdoor), salary_usd_year (derived), posted_on, valid_through, first_seen, last_seen, closed_on, applicants, relevance (core, adjacent, not relevant), dedupe_key |
| `jobs.posting_source` | posting × source | source (linkedin, indeed, glassdoor, google_jobs, ats, career_page), source_id, url, apply_url, fields jsonb (every field the source sent, unchanged), raw_capture_id, retrieved_at |
| `jobs.company` | employer | name, domain, linkedin_id, ats_type, ats_slug, size, industry, hq_country, ratings jsonb, entity_id → `ontology.entity` when the company is in the AI graph |
| `jobs.term` | search term | term, language, theme, countries[] |
| `jobs.query_run` | search executed | source, term, country, language, page or snapshot, results, cost_usd, run_at |
| `jobs.classification` | posting × model run | model, prompt version, labels jsonb (themes, level, function, relevance, skills, tools), confidence, cost_usd |
| `jobs.fx_rate` | currency × day | rate to USD (ECB) |

- Every raw response, paid or free, is archived whole: gzip on disk under `data/corpus/raw/jobs/` and a row in `ontology.raw_capture`. Fields not used today stay stored.
- Dedupe across sources by normalized title + company + city + posted week; the merged posting keeps every source row.
- Postings are never deleted: `closed_on` is set when a posting is missing from two runs in a row, so demand and pay can be tracked over time.
- People: `job_poster` (LinkedIn) is kept in the raw archive only, never in the site data.
- Size: about 5 KB of description per posting; 500,000 postings is about 2.5 GB plus the raw archive. Local Postgres holds it all; the site serves aggregates and live postings only (the Railway bill is Postgres memory).

## 4. Classification with OpenRouter (prices from openrouter.ai's model list, 2026-10-29)

| Model | Input per 1M tokens | Output per 1M tokens |
|---|---|---|
| openai/gpt-5-nano | $0.05 | $0.40 |
| mistralai/mistral-small-3.2-24b-instruct | $0.075 | $0.20 |
| google/gemini-2.5-flash-lite | $0.10 | $0.40 |
| openai/gpt-4o-mini | $0.15 | $0.60 |

- Input: title, company, location and the first part of the description (about 1,500 tokens). Output: one JSON object (about 200 tokens): relevance, themes, level, function, skills, tools (Semrush, Ahrefs, Search Console, Screaming Frog, Python...), salary parsed from text when no structured salary exists, language.
- Cost per posting with gpt-5-nano: 1,500 × $0.05/1M + 200 × $0.40/1M = $0.000155, before any reasoning tokens (the pilot measures them). 50,000 postings: about $7.75.
- A sample of 200 postings is labelled by two models; disagreements are read by hand to set the accuracy before scaling.

## 5. Pipelines (run through `run_pipelines.py`, so every pull has its time)

| Pipeline | Cadence | Cost class | Does |
|---|---|---|---|
| `jobs_google` | weekly | paid (DataForSEO) | Google Jobs by term × country × language; finds employers and the original posting URLs |
| `jobs_datasets` | monthly first, then weekly for new postings | paid (Bright Data) | LinkedIn, Indeed and Glassdoor listings whose titles match the terms, filtered by posted date after the last pull |
| `jobs_ats` | daily | free | Every known company's own job board; new employers from the other pipelines are added when their board type is detected |
| `jobs_pages` | daily | free | The `JobPosting` data on original posting URLs that are company career pages (one request a second, robots.txt respected) |
| `jobs_classify` | after each pull | paid (OpenRouter) | New or changed postings only |
| `jobs_fx` | daily | free | ECB rates |
| `jobs_lifecycle` | daily | free | first_seen, last_seen, closed_on |

Each paid pipeline has a cost cap in code, a lock against double runs, the raw archive, and runs only with the owner's yes.

## 6. Cost

**Pilot (needs the owner's yes; caps enforced in code):**

| Step | Size | Cap |
|---|---|---|
| DataForSEO Google Jobs | 25 countries × 8 terms × 5 pages = 1,000 pages × $0.0006 | $0.60 |
| Bright Data LinkedIn job listings | titles matching the terms, all countries, up to 2,000 records | $5.00 |
| Bright Data Indeed job listings | same, up to 1,000 records | $2.50 |
| Bright Data Glassdoor job listings | same, up to 500 records | $1.25 |
| OpenRouter classification | about 3,500 postings, gpt-5-nano | $3.00 |
| **Total** | | **$12.35** |

The pilot answers: how many postings per country and language, how many keyword matches are real, how often salary is present per source, overlap between sources, and the true cost per posting.

**Steady state (unit prices are real; volumes are assumptions until the pilot):**

| Scenario | Bright Data new postings | DataForSEO weekly sweep | OpenRouter | Monthly |
|---|---|---|---|---|
| Narrow: 50,000 live postings with the terms in the title, a quarter new each month | 12,500 × $2.50/1,000 × about 2 overlapping sources = about $62 | 175 countries × 20 terms × 5 pages = 17,500 pages × $0.0006 = $10.50 a sweep, about $45 | about $2 | about $110 |
| Broad: 500,000 postings that list SEO as a skill | about $625 | about $45 | about $20 | about $690 |

Free sources (company job boards, career pages, ECB) add no vendor cost.

## 7. What the data serves

- A jobs board: SEO and AI search jobs by country, language, level and company, each with its source and pulled date.
- Pay: salary ranges by country, level and theme, in the original currency and in USD per year, with how many postings state pay.
- Demand: AEO and GEO roles as a share of SEO roles, month by month; skills and tools employers ask for.
- Employers: who hires for search, how fast, at which levels; companies hiring SEO are also prospects for the agency.
- The AI graph: hiring signals on company pages (already live for 13 boards).
- Research and content: a labour-market paper, country pages, a monthly note.

## 8. Order

1. Free now: schema, term file for the first 25 markets, ATS collector stores descriptions and pay, `JobPosting` reader, ECB rates.
2. Pilot ($12.35 cap) after the owner's yes and the new OpenRouter key in `~/Desktop/sec/opnerouter.rtf`.
3. Pilot report with measured volumes and the real monthly cost; owner sets the monthly cap.
4. Scale country by country; the jobs board launches with the AI graph (localhost first, preprod after approval).
