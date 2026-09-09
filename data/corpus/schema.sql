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

DROP TABLE IF EXISTS observation, do_not_assert, segment, metric, document, source, ingest_run CASCADE;

-- Who published it. The organisation of record.
CREATE TABLE source (
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
CREATE TABLE document (
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
CREATE TABLE segment (
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
CREATE TABLE metric (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  unit        text NOT NULL DEFAULT 'percent',
  definition  text NOT NULL
);

-- The fact table. subject is the thing measured where there is one
-- (a platform, a news channel); null means the metric stands alone.
-- segment_id null means the national figure.
CREATE TABLE observation (
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
CREATE TABLE do_not_assert (
  id         serial PRIMARY KEY,
  claim      text NOT NULL,
  reason     text NOT NULL,
  caught_on  date NOT NULL DEFAULT current_date
);

-- One row per load, so a figure can always be traced to the run that wrote it.
CREATE TABLE ingest_run (
  id           serial PRIMARY KEY,
  started_at   timestamptz NOT NULL DEFAULT now(),
  script       text NOT NULL,
  documents    int NOT NULL DEFAULT 0,
  observations int NOT NULL DEFAULT 0,
  notes        text
);

CREATE INDEX ON observation (metric_id, segment_id);
CREATE INDEX ON observation (subject);
CREATE INDEX ON observation (period);
CREATE INDEX ON observation (document_id);

-- Current-period figures, which is what the tool actually reads.
CREATE VIEW v_latest AS
SELECT DISTINCT ON (o.metric_id, o.subject, o.segment_id)
       m.slug AS metric, o.subject, s.slug AS segment, s.dimension,
       o.period, o.value, d.slug AS document, d.url, d.published_on
FROM observation o
JOIN metric m   ON m.id = o.metric_id
JOIN document d ON d.id = o.document_id
LEFT JOIN segment s ON s.id = o.segment_id
ORDER BY o.metric_id, o.subject, o.segment_id, o.period DESC;

-- The coverage answer: what is stored versus what the site publishes.
CREATE VIEW v_coverage AS
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
