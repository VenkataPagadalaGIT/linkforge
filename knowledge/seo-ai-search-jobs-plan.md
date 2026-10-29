# The AI SEO job market study: plan v4 (2026-10-29)

Owner's ask: the largest study ever done of jobs in SEO, AI search, AEO, GEO and AI visibility: every country, every language, every level, every company; store every aspect (titles, salary, duties, responsibilities, AI skills, SEO skills, marketing skills, levels) and classify by company and company type (public, private, agency, full-time, contract and every other possibility).

Owner's clarification (2026-10-29): Nozzle's "Poisoned Google SERPs" study is the model for the style and format. We publish the same kind of study for the AI SEO job market.

Status: plan v4. Nothing paid has run. Every vendor and price below was cross-checked on 29 Oct 2026 against the vendor's own page, its docs or our own accounts. Job counts are estimates until the free counts in section 8 run. Vendor research: Obsidian `Tools/Job data at scale` and its Notion page under Tools.

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

## 5. Sources (cross-checked 2026-10-29)

| Source | What it gives | Price | Verdict |
|---|---|---|---|
| TheirStack | 258M job postings from 367K sources in 195 countries since 2021, duplicates merged across LinkedIn, Indeed, Glassdoor, company sites and ATSs. Filters for job title, description, country, posting date, seniority, salary and company type. | 1 API credit per job: $900 a month for 200,000; $1,200 for 500,000; $1,500 for 1M. Unused credits roll over for 12 months. | Main candidate |
| Coresignal | 486M postings since August 2020 in 195+ countries, from company sites, professional networks, ATSs and aggregators. Filters for title, company, location, skills, date and seniority. | Search is free; 1 credit per job collected: $1,000 a month for 150,000; $1,500 for 1M. Bulk datasets from $1,000. | Main candidate, with room for other topics |
| Bright Data datasets | LinkedIn, Indeed (7.38M records) and Glassdoor job listings, one dataset per source, not merged | $2.50 per 1,000 records; $0 when nothing matches. The order screen shows the record count and total before purchase. | Cheapest for LinkedIn alone; how far back it reaches is unconfirmed |
| Bright Data scrapers | Live LinkedIn, Indeed and Glassdoor jobs by URL or keyword | $1.50 per 1,000 delivered records; 5,000 free credits a month | Fresh jobs only |
| DataForSEO Google Jobs | Jobs Google lists today: employer, location, salary, contract type, original link; no description | $0.0006 per page of 10 jobs | One pass to top up |
| Company job boards | Greenhouse, Lever and Ashby public APIs, no login needed | Free | Top-up for known employers |
| Company career pages | `JobPosting` structured data: title, description, dates, salary, employment type | Free, or 1 MCP Scraper credit per page | Full text for jobs found only on Google |
| Techmap | 451M postings since 2020 in 250 countries and territories | API $1 per 1,000, but only the last 3 months; US history $5,999 one-time | Not a fit |
| Apify LinkedIn job actors | LinkedIn's public job search, open jobs only | $0.10 to $2 per 1,000 | Ruled out: we would be scraping LinkedIn |
| Web Data Commons | Job markup extracted yearly from Common Crawl; 50,000 sites used it by 2022 | Free | A sample, not a census |
| ECB reference rates, World Bank PPP | Currency conversion, purchasing-power comparison | Free | |
| O*NET, ISCO/ESCO | Standard tasks and occupation codes | Free | |
| OpenRouter | Reading and labelling each job | About $0.20 per 1,000 jobs with gpt-5-nano in batch; $0.60 with claude-haiku-5.5 | |

We never scrape LinkedIn or Indeed ourselves, and nothing is collected while signed in. LinkedIn's user agreement, section 8.2, bars scraping by software, crawlers, browser plugins "or any other means or processes".

## 6. Storage

- **Everything:** Postgres `research_corpus`, schema `jobs` (posting, posting_source with every field each source sent as jsonb, company, term, query_run, extraction, fx_rate, taxonomy tables for skills, tasks and tools). Local, on the research database.
- **Raw:** every response, paid or free, archived whole as gzip under `data/corpus/raw/jobs/` and logged in `ontology.raw_capture`; fields not used today stay stored.
- **Public:** the aggregate dataset and codebook as CSV and Parquet files on Cloudflare R2; the site serves aggregates and live jobs only (not the full database, which would raise the Railway Postgres bill).
- **People:** recruiter names in LinkedIn records (`job_poster`) stay in the raw archive and never reach the site or the public files.

## 7. Cost (unit prices verified; job counts are estimates)

**Countries:** there are 195: the 193 UN members plus the Holy See and Palestine. The ISO list has 249 codes because it counts territories. Google's job search runs in all of Latin America, North America and Sub-Saharan Africa, and only in listed countries elsewhere.

**Volume assumption:** Semrush counted 3,900 open SEO listings on Indeed US on 25 Nov 2025. Listings turn over about monthly, which suggests about 40,000 a year on Indeed US alone. Assuming the US holds about 30% of the world's SEO jobs gives 120,000 to 300,000 unique SEO jobs worldwide in 2026.

| Option | What you get | Cost |
|---|---|---|
| Snapshot | Every SEO job open today: one Google Jobs pass, the free job boards, AI reading | About $30 to $60 |
| **Vendor, one time (recommended)** | Every 2026 SEO job to date, merged across sources: TheirStack or Coresignal, plus one Google Jobs pass and AI reading | About $1,000 to $1,600 |
| Bright Data, LinkedIn only | 2026 LinkedIn SEO jobs, plus one Google Jobs pass and AI reading | About $250 to $610 |
| Bright Data, three datasets | Adds Indeed and Glassdoor | About $500 to $1,220 |
| Ongoing to year-end | History plus weekly Google passes and live scrapers to 31 Dec | About $980 to $2,400; company details add $240 to $600 |

Every option costs under 1 cent per job. For all of 2026 in one pull, pull once in early January 2027.

## 8. First step: count before buying (replaces the $12.35 pilot)

1. The owner opens free accounts at Coresignal, a 7-day trial with 2,000 credits, and TheirStack. Only the owner can create accounts.
2. I count SEO jobs posted since 1 Jan 2026 in every country. Coresignal's search is free; TheirStack returns the total with each search for 1 credit; Bright Data's order screen shows its counts too.
3. I pull a free sample of about 100 jobs from each, to compare descriptions, pay, seniority and company fields.
4. The owner picks the vendor, the topics (SEO only, or SEO with AI and marketing jobs) and the budget, and says yes.

Spend before the main purchase: $0.

## 9. Quality

- Two models label the same 1,000 jobs; disagreements are read by a person; accuracy per field is published with the study.
- The term lists are tested for precision and recall per language on the samples; a term is dropped when most of its matches are false.
- A sample of records is checked against the live posting in a logged-out browser: the one good use of a browser here.
- Every published number has a query behind it and is recomputed in the pre-release check.
- Claims register: any "largest" or "first" claim is checked against earlier studies before publication.

## 10. Order

1. Free now: schema, codebook, term lists with native-language terms, and the clickable mockup of the study page.
2. Free counts and samples, as in section 8.
3. One purchase, after the owner's yes.
4. One Google Jobs pass and the free job boards.
5. Duplicates merged locally; AI reading with a checked sample.
6. Publication: the study page in the format of section 2, country and role pages, the open dataset and codebook; launch with the AI graph, localhost first and preprod after approval.
7. Refresh monthly, or one pull in January 2027 for the full year.

## 11. Why not collect in a browser

- A browser only sees jobs still open, so January to September 2026 is out of reach.
- At an estimated 5 to 15 pages a minute, 200,000 jobs take 200 to 700 hours. Hosted browsers cost $240 to $3,200 for the same pages.
- Collecting while signed in breaches LinkedIn's user agreement: hiQ paid $500,000 and deleted its data in December 2022. Logged-out collection of public data won in Meta v. Bright Data, January 2024, one district court ruling.
- Browsers stay for spot checks.

## 12. Open decisions for the owner

- Open the Coresignal and TheirStack accounts.
- Topics: SEO only, or SEO plus AI and marketing jobs.
- Vendor and budget, after the counts.
- Timing: now for 2026 to date, or early January 2027 for the full year.
