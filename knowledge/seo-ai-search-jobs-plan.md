# The Search Jobs Census: plan v2 (2026-10-29)

Owner's ask: the largest study ever done of jobs in SEO, AI search, AEO, GEO and AI visibility: every country, every language, every level, every company; store every aspect (titles, salary, duties, responsibilities, AI skills, SEO skills, marketing skills, levels) and classify by company and company type (public, private, agency, full-time, contract and every other possibility). Benchmark to beat: Nozzle's "Poisoned Google SERPs" (published 10 Oct 2026, updated 21 Oct 2026).

Status: plan. Nothing paid has run. Unit prices come from vendor pages or our own billing; volumes are assumptions until the pilot measures them.

## 1. The bar, and how we clear it

Nozzle's study (read 2026-10-29): 56.1 million SERPs judged, 53 countries, three devices, 20 Aug to 21 Oct 2026, one outcome (the share of "poisoned" SERPs), a sample of the keywords Nozzle tracks for its customers; interactive SERP comparisons, daily charts, a country map, an industry breakdown, six downloadable CSVs with column definitions, a methodology section and stated limitations.

"10,000 times" is not a meaningful target in raw counts (it would mean 561 billion SERPs). The study wins on the dimensions that make research cited and reused:

| Dimension | Nozzle | The Search Jobs Census |
|---|---|---|
| Universe | A sample of its customers' keywords | Every posting matching the terms, from every source we can license or read, in every country those sources cover (target 175) |
| Depth | One outcome per SERP | About 120 structured fields per job: pay, duties, skills in four families, tools, level, company type, ownership |
| Languages | Not stated | Search terms and labels in every language of the countries covered; original text kept |
| Time | Two months | A census, then a monthly index that never stops (closed jobs are kept) |
| Comparability | Own definitions | Duties mapped to O*NET 13-1161.01 (Search Marketing Strategists) and ISCO 2513; our own extension for AEO, GEO and AI visibility, which the standard taxonomies do not cover yet |
| Proof | Method described | Every number links to the postings behind it, with source and pulled date; classifier accuracy measured against a hand-checked sample and published |
| Openness | Six CSVs | The full aggregate dataset (CSV and Parquet), the codebook, the term lists, the prompts and the code |
| Use | Read the report | An explorer: any country × level × skill × company type × pay band; a page per country and per role; an API |

## 2. What we record for every job (the codebook)

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

## 3. Sources (checked 2026-10-29)

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

## 4. Storage

- **Everything:** Postgres `research_corpus`, schema `jobs` (posting, posting_source with every field each source sent as jsonb, company, term, query_run, extraction, fx_rate, taxonomy tables for skills, tasks and tools). Local, on the research database.
- **Raw:** every response, paid or free, archived whole as gzip under `data/corpus/raw/jobs/` and logged in `ontology.raw_capture`; fields not used today stay stored.
- **Public:** the aggregate dataset and codebook as CSV and Parquet files on Cloudflare R2; the site serves aggregates and live jobs only (not the full database, which would raise the Railway Postgres bill).
- **People:** recruiter names in LinkedIn records (`job_poster`) stay in the raw archive and never reach the site or the public files.

## 5. Cost for every country (unit prices are real; volumes are assumptions)

| Part | Assumption | Formula | One-time census | Monthly after |
|---|---|---|---|---|
| Google Jobs sweep | 175 countries × about 12 terms in their languages × 10 pages, plus 30 large countries split into 25 cities | (21,000 + 90,000) pages × $0.0006 | about $67 | about $67 (monthly) to $290 (weekly) |
| Job datasets (LinkedIn, Indeed, Glassdoor) | 200,000 to 1,000,000 matching records across the three | records × $2.50 / 1,000 | $500 to $2,500 | $62 to $250 for new postings |
| Company enrichment | 50,000 to 200,000 employers, up to three company datasets each | records × $2.50 / 1,000 | $375 to $1,500 | small (new employers only) |
| Extraction | 2,500 tokens in, 700 out per job, gpt-5-nano | 300,000 to 1,000,000 × $0.000405 | $122 to $405 | $10 to $40 |
| Checking sample | 5% of jobs re-read by gemini-2.5-flash, $0.0025 each | 15,000 to 50,000 × $0.0025 | $38 to $125 | small |
| **Total** | | | **about $1,100 to $4,600** | **about $150 to $600** |

Reasoning tokens (gpt-5-nano is a reasoning model) can raise extraction cost; the pilot measures them. Storage on the local database and free sources add no vendor cost.

## 6. The pilot first ($12.35 cap, needs the owner's yes)

| Step | Size | Cap |
|---|---|---|
| DataForSEO Google Jobs | 25 countries × 8 terms × 5 pages = 1,000 pages | $0.60 |
| Bright Data LinkedIn job listings | titles matching the terms, all countries, up to 2,000 records | $5.00 |
| Bright Data Indeed job listings | up to 1,000 records | $2.50 |
| Bright Data Glassdoor job listings | up to 500 records | $1.25 |
| OpenRouter extraction | about 3,500 jobs | $3.00 |
| **Total** | | **$12.35** |

It measures volume per country and language, how many keyword matches are real (in our own 4,136 roles only 1 of 7 was: "GEO" was a sales territory, "AI Search" an engineer), how often pay is stated per source, overlap between sources, field coverage, and the true cost per job. The census budget is then set from measured numbers.

## 7. Quality

- Two models label the same 1,000 jobs; disagreements are read by a person; accuracy per field is published with the study.
- The term lists are tested for precision and recall per language on the pilot (a term is dropped when most of its matches are false).
- Every published number has a query behind it and is re-computed in the pre-release check (the same discipline as the site's attested counts).
- Claims register: any "largest" or "first" claim is checked against earlier studies before publication.

## 8. Order

1. Free now: schema, codebook, term lists for the first 25 markets (with native-language terms), skill and task taxonomies, company job boards storing full descriptions and pay, the `JobPosting` reader, ECB rates.
2. Pilot ($12.35) after the owner's yes and the new OpenRouter key in `~/Desktop/sec/opnerouter.rtf`.
3. Pilot report: measured volumes, precision, field coverage, cost per job; the owner sets the census budget.
4. Census: all sources, all countries; extraction; checking sample.
5. Publication: report, explorer, country and role pages, open dataset and codebook, methodology and limitations; launch with the AI graph (localhost first, preprod after approval).
6. Monthly index from then on.
