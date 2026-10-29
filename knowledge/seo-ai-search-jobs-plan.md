# The AI SEO job market study: plan v3 (2026-10-29)

Owner's ask: the largest study ever done of jobs in SEO, AI search, AEO, GEO and AI visibility: every country, every language, every level, every company; store every aspect (titles, salary, duties, responsibilities, AI skills, SEO skills, marketing skills, levels) and classify by company and company type (public, private, agency, full-time, contract and every other possibility).

Owner's clarification (2026-10-29): Nozzle's "Poisoned Google SERPs" study is the model for the style and format. We publish the same kind of study for the AI SEO job market.

Status: plan. Nothing paid has run. Next free step: a clickable mockup of the study page on sample data, numbered M1 to M16 as in section 2. Unit prices come from vendor pages or our own billing; volumes are assumptions until the pilot measures them.

## 1. The model: Nozzle's study (read 2026-10-29)

Facts: by Derek Perkins, published 10 Oct 2026, updated 21 Oct 2026, "data through" 21 Oct 2026. 56.1 million SERPs judged (29.9 million since 13 Sep), 53 countries, desktop, iPhone and Android, 20 Aug to 21 Oct 2026, a sample of the SERPs Nozzle tracks for its customers. Six gzipped CSV downloads. JSON-LD types on the page include Report and VideoObject. Source: https://nozzle.io/research/poisoned-google-serps/

What makes the format work:
- **One plain sentence and four numbers first.** A short dek says what happened; a band of four big numbers gives the scale.
- **Show, then tell.** Real examples you can pick and compare (wipe, side by side, flip) come before any chart.
- **Every chart carries its evidence.** A caption explains each mark, then a collapsible table, then a download with its row count, then a note on each column.
- **Before and after everywhere.** Tiles and dumbbell charts read "baseline to now", so change is the unit of every module.
- **Honest thresholds.** Thin days are drawn hollow; a country below a minimum sample is not coloured on the map.
- **The reader filters.** Country and device chips and metric tabs redraw the chart and the tiles.
- **A practical close.** What it does to the reader's own sites, then how to tell it apart from a real ranking change.
- **A short method.** Run-in definitions, the counts, the dates, the sample.
- **A living page.** Published, updated and "data through" dates in the byline; dated update sections.

## 2. Our study page, module by module

| # | Module | Modeled on | What it shows | Reader controls | Fields it needs |
|---|---|---|---|---|---|
| M1 | Hero | Hero | Kicker, two-tone title, byline (published, updated, postings through, read time), one-sentence finding, four numbers: postings analyzed, countries, share of SEO postings that ask for AI search skills, pay gap of AI search roles | none | counts, ai_exposure, pay |
| M2 | Key findings 01 to 05 | Key findings + film | Five numbered findings, each a bold claim and one sentence with its number; a short film of the posting viewer | play the film | all |
| M3 | Updates | Dated updates | One dated note per monthly refresh: what changed in the data and the method | none | run log |
| M4 | What it looks like | SERP comparisons | Four real postings as cards; the viewer marks every duty and skill by family; the same title then and now, or the original language beside the English | pick a posting; Annotated, Side by side, Flip; jump to duties, skills, pay, requirements | posting text, duties, skills, pay, company type, source |
| M5 | By the numbers | By the numbers | Definitions; baseline-to-now tiles; monthly chart of the share of SEO postings asking for AI search skills, with event lines (AI Overviews in the US on 14 May 2024, ChatGPT search on 31 Oct 2024, AI Mode in the US on 20 May 2025) and hollow points for thin months | country, level and company-type chips; tabs for postings, AI share, median pay | posted_on, ai_exposure, country, level, company_type, pay |
| M6 | What employers ask for | What takes their place | Dumbbells: how often each skill or tool appears in classic SEO postings against AI search postings, grouped "asked more" and "asked less" | tabs: skills, tools | skills, tools |
| M7 | Where the jobs are | Where it hit | World map with a Europe inset; five bins; a country needs a minimum number of postings to be coloured; four short findings under the map | metric toggle | country, ai_exposure |
| M8 | By company type | Industry ridgelines | One ridge per company type (in-house brand, agency, software vendor, publisher, e-commerce, staffing) on one scale | hover | company_type, posted_on |
| M9 | What it pays | (new) | Pay range by level, in local currency, USD or purchasing power; how many postings state pay, by country | country, currency | pay fields, fx_rate |
| M10 | Who hires | (new) | Ownership (public, private, private-equity owned, venture-backed, government, nonprofit), size, top employers with links to the AI graph | sort | company fields |
| M11 | Titles and levels | (new) | The title ladder from specialist to head; new titles (AEO, GEO, AI search); postings per level | level | title_norm, level |
| M12 | How to read an AI SEO job posting | How to tell it from a real ranking change | Four rules: GEO can be a sales territory; "AI search" can be an engineer; stated pay against estimated pay; agency or in-house | none | (classifier rules) |
| M13 | Explore the postings | (new) | Search and filter the postings behind every number, each with its source and pulled date | search, filters | posting, posting_source |
| M14 | Method | Method | Run-in definitions: postings, sources, matched, classified, counted once, pay, company type, countries and languages, thresholds, accuracy | none | provenance |
| M15 | Downloads | Download the data | One gzipped CSV per module plus Parquet and the codebook, each with its row count and column notes; no person data | download | aggregates |
| M16 | Machine-readable | Report JSON-LD | Report plus Dataset JSON-LD with each download as a distribution, so the data shows in Google Dataset Search | none | page metadata |

## 3. Where we go further than the model

| Dimension | Nozzle | The AI SEO job market study |
|---|---|---|
| Universe | A sample of its customers' keywords | Every posting matching the terms, from every source we can license or read, in every country those sources cover (target 175) |
| Depth | One outcome per SERP | About 120 structured fields per job: pay, duties, skills in four families, tools, level, company type, ownership |
| Languages | Not stated | Search terms and labels in every language of the countries covered; the original text kept beside the English |
| Time | Two months | A census, then a monthly refresh that never stops (closed postings are kept) |
| Comparability | Own definitions | Duties mapped to O*NET 13-1161.01 (Search Marketing Strategists) and ISCO 2513; our own extension for AEO, GEO and AI visibility |
| Proof | Method described | Every number links to the postings behind it (M13); classifier accuracy against a hand-checked sample is published |
| Openness | Six CSVs | CSV and Parquet, the codebook, the term lists, the prompts and the code |
| Findability | Report JSON-LD | Report and Dataset JSON-LD (M16) |

## 4. What we record for every job (the codebook)

**Posting:** title as written, title in English, normalized title, language; country, region, city, coordinates; workplace (onsite, hybrid, remote) and where remote applies; employment type (full-time, part-time, contract, freelance, internship, apprenticeship, temporary); schedule; posted date, valid-through date, first seen, last seen, closed; applicants; easy apply; every source it appears on, with its own ids and links.

**Pay:** minimum, maximum, currency, period (hour, day, month, year); stated by the employer or estimated (Glassdoor); converted to USD a year with that day's ECB rate; bonus, commission and equity mentioned; benefits listed.

**Role:** level (intern, entry, mid, senior, lead or staff, manager, director, head or VP, C-level); years of experience asked; people managed; reports to; function family (SEO, AEO and GEO, AI search marketing, AI search engineering and product, content, technical, analytics, paid search, growth); specialization (technical, content, local, e-commerce, international, enterprise, link building and digital PR, programmatic, app stores, video); O*NET and ISCO codes.

**Duties and responsibilities:** every duty sentence as written, each also mapped to a normalized task (O*NET task where one exists, our own task list otherwise); requirements split into must-have and nice-to-have.

**Skills, in four families, each from a fixed list with an "other" field:**
- SEO skills: keyword research, technical audits, crawling and indexing, site architecture, structured data, Core Web Vitals, international and hreflang, local and Business Profile, e-commerce, migrations, log analysis, content optimization, link building, digital PR, reporting.
- AI skills: AEO, GEO, AI visibility tracking, LLM prompting, AI content workflows, AI agents and automation, retrieval and embeddings, machine learning, evaluating AI output.
- Marketing skills: content strategy, copywriting, paid search, conversion optimization, analytics, email and CRM, social, PR, brand, product marketing, marketing operations.
- Technical skills: HTML, CSS, JavaScript, SQL, Python, APIs, BigQuery and data warehouses, cloud.

**Tools named:** normalized vendor list (Semrush, Ahrefs, Moz, Screaming Frog, Sitebulb, Search Console, GA4, Looker Studio, BigQuery, Adobe Analytics, Botify, Conductor, BrightEdge, seoClarity, Similarweb, Surfer, Clearscope, MarketMuse, HubSpot, Salesforce, WordPress, Shopify, ChatGPT, Claude, Gemini, Perplexity, and AI visibility trackers), plus anything else as written.

**Requirements:** education level and field, certifications, human languages required, travel, visa sponsorship, security clearance.

**AI exposure:** whether the job mentions AI search, AI Overviews or LLMs; required or nice-to-have; the share of duties that involve AI.

**Company:** name and normalized name, domain, LinkedIn id; headquarters country; size band; revenue band; industry (NAICS and ISIC); ownership (public, private, private-equity owned, venture-backed, government, nonprofit, education, cooperative); listed or not, exchange and ticker; type relative to search (in-house brand, agency, consultancy, software vendor, publisher or media, marketplace, e-commerce, staffing firm posting for a client); funding stage; founded year; ratings; link to the AI graph when the company is in it.

**Provenance:** source, pulled date and time, raw record id, model and prompt version, confidence, whether a person checked it.

Company type comes from several sources, in this order: the company's own filings and Wikidata (stock exchange and ticker), the LinkedIn company profile's organization type, Glassdoor's `company_type` on job listings, Crunchbase for funding and ownership, and a model reading the company description and the job text for agency, in-house or staffing (checked on a hand-labelled sample).

## 5. Sources (checked 2026-10-29)

| Source | Gives | Price |
|---|---|---|
| Bright Data, LinkedIn job listings (`gd_lpfll7v5hcqtkxl6l`, 29 fields) | Full description, salary or pay range, seniority, employment type, function, industries, posted date and time, applicants, company | $2.50 per 1,000 records; $0 when nothing matches |
| Bright Data, Indeed job listings (`gd_l4dx9j9sscpvs7no2`, 28 fields, 7.38M records) | Description, salary, benefits, qualifications, job type, company rating | Same |
| Bright Data, Glassdoor job listings (`gd_lpfbbndm1xnopbrcr0`, 39 fields) | Employer and Glassdoor pay ranges, company type, size, revenue, industry, ratings | Same |
| Bright Data company datasets (LinkedIn companies, Glassdoor companies 2.48M, Crunchbase 2.3M) | Organization type, size, industry, funding, ownership | Same |
| DataForSEO Google Jobs | Employer, location, salary, contract type, posted time, the original posting's link; up to 200 results per term, country and language; no description | $0.0006 per page of 10 (standard queue) |
| Company job boards (Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Personio, Teamtailor) | Full description, published pay ranges, dates | Free |
| Company career pages (`JobPosting` structured data) | Title, description, dates, base salary, employment type, location | Free |
| ECB reference rates, World Bank PPP | Currency conversion, purchasing-power comparison | Free |
| O*NET, ISCO/ESCO | Standard tasks and occupation codes | Free |
| OpenRouter (classification and extraction) | gpt-5-nano $0.05 per 1M input tokens and $0.40 per 1M output; gemini-2.5-flash $0.30 and $2.50 (for the checking sample) | As listed |

No scraping of LinkedIn or Indeed pages ourselves: their data comes only from the licensed datasets.

## 6. Storage

- **Everything:** Postgres `research_corpus`, schema `jobs` (posting, posting_source with every field each source sent as jsonb, company, term, query_run, extraction, fx_rate, taxonomy tables for skills, tasks and tools). Local, on the research database.
- **Raw:** every response, paid or free, archived whole as gzip under `data/corpus/raw/jobs/` and logged in `ontology.raw_capture`; fields not used today stay stored.
- **Public:** the aggregate dataset and codebook as CSV and Parquet files on Cloudflare R2; the site serves aggregates and live jobs only (not the full database, which would raise the Railway Postgres bill).
- **People:** recruiter names in LinkedIn records (`job_poster`) stay in the raw archive and never reach the site or the public files.

## 7. Cost for every country (unit prices are real; volumes are assumptions)

| Part | Assumption | Formula | One-time census | Monthly after |
|---|---|---|---|---|
| Google Jobs sweep | 175 countries × about 12 terms in their languages × 10 pages, plus 30 large countries split into 25 cities | (21,000 + 90,000) pages × $0.0006 | about $67 | about $67 (monthly) to $290 (weekly) |
| Job datasets (LinkedIn, Indeed, Glassdoor) | 200,000 to 1,000,000 matching records across the three | records × $2.50 / 1,000 | $500 to $2,500 | $62 to $250 for new postings |
| Company enrichment | 50,000 to 200,000 employers, up to three company datasets each | records × $2.50 / 1,000 | $375 to $1,500 | small (new employers only) |
| Extraction | 2,500 tokens in, 700 out per job, gpt-5-nano | 300,000 to 1,000,000 × $0.000405 | $122 to $405 | $10 to $40 |
| Checking sample | 5% of jobs re-read by gemini-2.5-flash, $0.0025 each | 15,000 to 50,000 × $0.0025 | $38 to $125 | small |
| **Total** | | | **about $1,100 to $4,600** | **about $150 to $600** |

Reasoning tokens (gpt-5-nano is a reasoning model) can raise extraction cost; the pilot measures them. Storage on the local database and free sources add no vendor cost.

## 8. The pilot first ($12.35 cap, needs the owner's yes)

| Step | Size | Cap |
|---|---|---|
| DataForSEO Google Jobs | 25 countries × 8 terms × 5 pages = 1,000 pages | $0.60 |
| Bright Data LinkedIn job listings | titles matching the terms, all countries, up to 2,000 records | $5.00 |
| Bright Data Indeed job listings | up to 1,000 records | $2.50 |
| Bright Data Glassdoor job listings | up to 500 records | $1.25 |
| OpenRouter extraction | about 3,500 jobs | $3.00 |
| **Total** | | **$12.35** |

It measures volume per country and language, how many keyword matches are real (in our own 4,136 roles only 1 of 7 was: "GEO" was a sales territory, "AI Search" an engineer), how often pay is stated per source, overlap between sources, field coverage, and the true cost per job. The census budget is then set from measured numbers.

## 9. Quality

- Two models label the same 1,000 jobs; disagreements are read by a person; accuracy per field is published with the study.
- The term lists are tested for precision and recall per language on the pilot (a term is dropped when most of its matches are false).
- Every published number has a query behind it and is re-computed in the pre-release check (the same discipline as the site's attested counts).
- Claims register: any "largest" or "first" claim is checked against earlier studies before publication.

## 10. Order

1. Free now: a clickable mockup of the study page on sample data, schema, codebook, term lists for the first 25 markets (with native-language terms), skill and task taxonomies, company job boards storing full descriptions and pay, the `JobPosting` reader, ECB rates.
2. Pilot ($12.35) after the owner's yes and the new OpenRouter key in `~/Desktop/sec/opnerouter.rtf`.
3. Pilot report: measured volumes, precision, field coverage, cost per job; the owner sets the census budget.
4. Census: all sources, all countries; extraction; checking sample.
5. Publication: the study page in the format of section 2, plus country and role pages, the open dataset and codebook; launch with the AI graph (localhost first, preprod after approval).
6. Monthly index from then on.
