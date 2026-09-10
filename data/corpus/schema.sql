-- ============================================================================
-- research_corpus
--
-- Canonical home for every external figure the site publishes. The site used
-- to read numbers straight off web pages into a TypeScript file, which meant
-- provenance lived in a code comment and a refresh was a diff against memory.
-- This is the fix: one fact table, every value carrying the document it came
-- from, when it was retrieved and how.
--
-- The site still ships static TypeScript. This database GENERATES that file;
-- it is not read at request time. So a build never depends on a live DB, and
-- there is still exactly one place a number can come from.
--
-- Shape is a narrow star. One row per published figure:
--   (document, metric, subject, segment, period) -> value
-- That one grain holds platform reach, access rates, news habits, national
-- statistics and full time series without a table per source.
-- ============================================================================

-- NOT destructive. This file is safe to re-run: it only adds what is missing.
-- It used to lead with a DROP CASCADE, which silently emptied a loaded corpus
-- the first time it was re-run to add a table. To rebuild from nothing, run
-- reset.sql explicitly.

-- Who published it. The organisation of record.
CREATE TABLE IF NOT EXISTS source (
  id            serial PRIMARY KEY,
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  homepage      text,
  kind          text NOT NULL CHECK (kind IN ('survey','government','aggregator','vendor','academic')),
  -- Whether the publisher permits machine reading, and where that is stated.
  access_note   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- A specific publication: one fact sheet, one report, one dataset page.
-- Sample size and field dates live here because they qualify every figure
-- inside the document, not the source as a whole.
CREATE TABLE IF NOT EXISTS document (
  id              serial PRIMARY KEY,
  source_id       int NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  url             text NOT NULL,
  published_on    date,
  -- How this was obtained, verbatim enough to repeat it.
  retrieval       text NOT NULL,
  retrieved_at    date NOT NULL,
  sample_size     int,
  field_start     date,
  field_end       date,
  moe_overall     numeric(4,2),
  population      text,
  notes           text
);

-- A population cut. n and moe are as published, and null when the publisher
-- does not publish them rather than estimated.
CREATE TABLE IF NOT EXISTS segment (
  id            serial PRIMARY KEY,
  slug          text NOT NULL UNIQUE,
  dimension     text NOT NULL,
  label         text NOT NULL,
  n             int,
  moe           numeric(4,2),
  source_doc_id int REFERENCES document(id),
  sort_order    int NOT NULL DEFAULT 0
);

-- What is being measured, stated precisely enough that two documents using
-- the same metric are genuinely comparable.
CREATE TABLE IF NOT EXISTS metric (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  unit        text NOT NULL DEFAULT 'percent',
  definition  text NOT NULL
);

-- The fact table. subject is the thing measured where there is one
-- (a platform, a news channel); null means the metric stands alone.
-- segment_id null means the national figure.
CREATE TABLE IF NOT EXISTS observation (
  id           bigserial PRIMARY KEY,
  document_id  int NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  metric_id    int NOT NULL REFERENCES metric(id),
  subject      text,
  segment_id   int REFERENCES segment(id),
  period       text NOT NULL,
  value        numeric(12,2) NOT NULL,
  -- 'measured' is a published cell. Nothing derived is stored here; the
  -- estimator combines at read time so a derived number can never be
  -- mistaken later for one somebody published.
  basis        text NOT NULL DEFAULT 'measured' CHECK (basis = 'measured'),
  note         text,
  UNIQUE (document_id, metric_id, subject, segment_id, period)
);

-- Figures that failed verification. Kept so a later refresh cannot quietly
-- reintroduce a number that was already rejected once.
CREATE TABLE IF NOT EXISTS do_not_assert (
  id         serial PRIMARY KEY,
  claim      text NOT NULL,
  reason     text NOT NULL,
  caught_on  date NOT NULL DEFAULT current_date
);

-- One row per load, so a figure can always be traced to the run that wrote it.
CREATE TABLE IF NOT EXISTS ingest_run (
  id           serial PRIMARY KEY,
  started_at   timestamptz NOT NULL DEFAULT now(),
  script       text NOT NULL,
  documents    int NOT NULL DEFAULT 0,
  observations int NOT NULL DEFAULT 0,
  notes        text
);

CREATE INDEX IF NOT EXISTS obs_metric_seg_idx ON observation (metric_id, segment_id);
CREATE INDEX IF NOT EXISTS obs_subject_idx ON observation (subject);
CREATE INDEX IF NOT EXISTS obs_period_idx ON observation (period);
CREATE INDEX IF NOT EXISTS obs_doc_idx ON observation (document_id);

-- Current-period figures, which is what the tool actually reads.
CREATE OR REPLACE VIEW v_latest AS
SELECT DISTINCT ON (o.metric_id, o.subject, o.segment_id)
       m.slug AS metric, o.subject, s.slug AS segment, s.dimension,
       o.period, o.value, d.slug AS document, d.url, d.published_on
FROM observation o
JOIN metric m   ON m.id = o.metric_id
JOIN document d ON d.id = o.document_id
LEFT JOIN segment s ON s.id = o.segment_id
ORDER BY o.metric_id, o.subject, o.segment_id, o.period DESC;

-- The coverage answer: what is stored versus what the site publishes.
CREATE OR REPLACE VIEW v_coverage AS
SELECT src.name AS source, d.slug AS document, d.published_on,
       count(*) AS observations,
       count(DISTINCT o.metric_id) AS metrics,
       count(DISTINCT o.subject) AS subjects,
       count(DISTINCT o.segment_id) AS segments,
       min(o.period) AS earliest, max(o.period) AS latest
FROM observation o
JOIN document d ON d.id = o.document_id
JOIN source src ON src.id = d.source_id
GROUP BY src.name, d.slug, d.published_on
ORDER BY src.name, d.slug;

-- ============================================================================
-- CRAWL LAYER
--
-- Every URL either site publishes, whether or not a figure has been extracted
-- from it yet. This is the difference between "we read some pages" and "we
-- know what exists". An observation points at a document; a document points at
-- the resource it was read from; the resource records the exact bytes and when
-- they were fetched.
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource (
  id            bigserial PRIMARY KEY,
  source_id     int REFERENCES source(id) ON DELETE SET NULL,
  url           text NOT NULL UNIQUE,
  -- The section of the site, taken from the first path segment. Lets a query
  -- ask for "every answers page" without pattern-matching URLs.
  path_kind     text,
  sitemap_lastmod timestamptz,
  -- pending -> ok | error | skipped
  status        text NOT NULL DEFAULT 'pending',
  http_status   int,
  fetched_at    timestamptz,
  content_hash  text,
  byte_size     int,
  -- Gzipped body on disk, relative to data/corpus/cache. Bodies are too large
  -- for rows and would bloat every dump; the hash is what makes the pairing
  -- verifiable.
  local_path    text,
  title         text,
  error         text
);

CREATE INDEX IF NOT EXISTS resource_status_idx ON resource (status);
CREATE INDEX IF NOT EXISTS resource_kind_idx ON resource (path_kind);
CREATE INDEX IF NOT EXISTS resource_source_idx ON resource (source_id);

-- Which document a resource produced, once figures have been extracted.
ALTER TABLE document ADD COLUMN IF NOT EXISTS resource_id bigint REFERENCES resource(id);

CREATE OR REPLACE VIEW v_crawl AS
SELECT src.name AS source, r.path_kind, r.status,
       count(*) AS urls,
       pg_size_pretty(sum(r.byte_size)::bigint) AS bytes,
       min(r.fetched_at) AS first_fetch, max(r.fetched_at) AS last_fetch
FROM resource r LEFT JOIN source src ON src.id = r.source_id
GROUP BY 1,2,3 ORDER BY 1,4 DESC;

-- ============================================================================
-- VERSIONING AND EXTRACTION
--
-- A crawl that overwrites its own last result cannot tell you what changed,
-- which is the whole point of re-crawling. Every fetch appends a version row;
-- the resource row holds the current state, the version rows hold the history.
-- A re-crawl compares hashes: same hash means nothing moved and there is
-- nothing to re-extract.
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_version (
  id           bigserial PRIMARY KEY,
  resource_id  bigint NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  http_status  int,
  content_hash text NOT NULL,
  byte_size    int,
  local_path   text,
  -- true when this fetch differs from the one before it. The re-crawl report
  -- is one query away: which pages actually changed since a given date.
  changed      boolean NOT NULL DEFAULT true,
  via          text NOT NULL DEFAULT 'direct'   -- direct | brightdata
);

CREATE INDEX IF NOT EXISTS rv_resource_idx ON resource_version (resource_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS rv_changed_idx ON resource_version (changed, fetched_at DESC);

-- Which resource produced which figures, and whether that page still needs
-- mining. Without this, "have we extracted this page yet" is a guess.
CREATE TABLE IF NOT EXISTS extraction (
  id            bigserial PRIMARY KEY,
  resource_id   bigint NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  content_hash  text NOT NULL,
  extracted_at  timestamptz NOT NULL DEFAULT now(),
  extractor     text NOT NULL,
  observations  int NOT NULL DEFAULT 0,
  tables_found  int NOT NULL DEFAULT 0,
  notes         text,
  UNIQUE (resource_id, content_hash, extractor)
);

-- Pages fetched but never mined, newest first. This is the work queue.
CREATE OR REPLACE VIEW v_unextracted AS
SELECT r.id, r.url, r.path_kind, r.byte_size, r.title, s.slug AS source
FROM resource r
JOIN source s ON s.id = r.source_id
LEFT JOIN extraction e ON e.resource_id = r.id AND e.content_hash = r.content_hash
WHERE r.status = 'ok' AND e.id IS NULL
ORDER BY r.byte_size DESC NULLS LAST;

-- What actually changed on a re-crawl.
CREATE OR REPLACE VIEW v_changed AS
SELECT r.url, r.path_kind, v.fetched_at, v.content_hash, v.via
FROM resource_version v
JOIN resource r ON r.id = v.resource_id
WHERE v.changed
ORDER BY v.fetched_at DESC;

-- ============================================================================
-- COMPETITIVE LAYER
--
-- Who currently ranks for the questions this site answers, what they claim,
-- and what they actually measured. The point is not to copy them. Every page
-- ranking for these queries recycles the same platform ad-reach figures, which
-- count ad impressions rather than people, and they disagree with each other
-- by twenty points without ever saying why. That disagreement IS the story,
-- and no one is telling it, so it is stored here as content.
-- ============================================================================

CREATE TABLE IF NOT EXISTS serp_query (
  id           serial PRIMARY KEY,
  keyword      text NOT NULL,
  location     text NOT NULL DEFAULT 'United States',
  device       text NOT NULL DEFAULT 'desktop',
  our_slug     text,                    -- the page of ours aimed at it
  checked_at   timestamptz NOT NULL DEFAULT now(),
  has_ai_overview boolean NOT NULL DEFAULT false,
  UNIQUE (keyword, location, device)
);

CREATE TABLE IF NOT EXISTS serp_result (
  id           bigserial PRIMARY KEY,
  query_id     int NOT NULL REFERENCES serp_query(id) ON DELETE CASCADE,
  rank_absolute int NOT NULL,
  result_type  text NOT NULL,           -- organic | ai_overview | people_also_ask
  domain       text,
  url          text,
  title        text,
  description  text,
  -- true when the AI Overview cites this domain: the answer engine's own
  -- shortlist, which is a different and more useful ranking than position.
  cited_by_ai  boolean NOT NULL DEFAULT false,
  UNIQUE (query_id, rank_absolute, result_type, url)
);

-- What a competitor asserts, and what it actually measured. A claim with no
-- sample size is not a weaker version of a measured claim, it is a different
-- kind of object, and the basis column is what keeps those apart.
CREATE TABLE IF NOT EXISTS competitor_claim (
  id           bigserial PRIMARY KEY,
  query_id     int REFERENCES serp_query(id) ON DELETE SET NULL,
  domain       text NOT NULL,
  url          text NOT NULL,
  subject      text,                    -- platform or topic the claim is about
  claim        text NOT NULL,
  value_text   text,
  -- ad_audience: platform self-reported ad reach, counts accounts not people
  -- survey: a probability sample with a published n
  -- vendor_panel: opt-in panel, not representative
  -- unstated: no basis given at all, which is the most common case
  basis        text NOT NULL DEFAULT 'unstated',
  population   text,                    -- global | us | unstated
  sample_size  int,
  moe          numeric(4,2),
  cited_source text,
  captured_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cc_subject_idx ON competitor_claim (subject);
CREATE INDEX IF NOT EXISTS cc_domain_idx ON competitor_claim (domain);
CREATE INDEX IF NOT EXISTS sr_query_idx ON serp_result (query_id, rank_absolute);

-- Who the answer engine trusts, across every query checked.
CREATE OR REPLACE VIEW v_ai_citations AS
SELECT domain, count(*) AS times_cited,
       count(DISTINCT query_id) AS queries,
       min(url) AS example
FROM serp_result WHERE cited_by_ai AND domain IS NOT NULL
GROUP BY domain ORDER BY 2 DESC;

-- ============================================================================
-- COMPETITOR PAGES
--
-- The page-level picture: for each platform, who currently owns the query,
-- how many claims that page makes, which sources it cites, and how fresh it
-- says it is. Claim-level basis is recorded only where the page states it;
-- guessing a basis per claim would be the same fabrication this whole corpus
-- exists to avoid, so it is left unstated rather than inferred.
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_page (
  id            serial PRIMARY KEY,
  domain        text NOT NULL,
  url           text NOT NULL UNIQUE,
  subject       text NOT NULL,
  title         text,
  claim_count   int NOT NULL DEFAULT 0,
  -- The most recent period the page itself references. A page citing Q4 2025
  -- in 2026 is telling you how stale its freshest number is.
  latest_year   text,
  latest_period text,
  retrieved_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitor_source (
  id            bigserial PRIMARY KEY,
  page_id       int NOT NULL REFERENCES competitor_page(id) ON DELETE CASCADE,
  domain        text NOT NULL,
  url           text NOT NULL,
  -- primary: the organisation that produced the number
  -- secondary: another aggregator
  kind          text NOT NULL DEFAULT 'primary',
  UNIQUE (page_id, url)
);

CREATE INDEX IF NOT EXISTS cp_subject_idx ON competitor_page (subject);

-- Which sources the whole competitive set leans on.
CREATE OR REPLACE VIEW v_competitor_sources AS
SELECT cs.domain, count(DISTINCT cp.subject) AS platforms,
       count(*) AS times_cited, min(cs.url) AS example
FROM competitor_source cs JOIN competitor_page cp ON cp.id = cs.page_id
GROUP BY cs.domain ORDER BY 3 DESC;
