-- ============================================================================
-- ontology: the AI Systems Map as data
--
-- The map used to live only in src/data/aiOntologyData.ts, hand-generated in
-- July 2026. This schema is its source of truth from now on. Entities and
-- typed relations keep the exact shape the site renders, and every money
-- figure, event, company claim and forecast gets its own row with provenance,
-- instead of living inside a free-text note.
--
-- The site still ships static TypeScript. gen_ontology_ts.py generates
-- src/data/aiOntologyData.ts from these tables; a build never reads the DB.
--
-- Safe to re-run: it only adds what is missing.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS ontology;

-- One row per thing in the map: company, product, material, site, program,
-- policy instrument, index. Columns mirror the AiNode type the site renders.
CREATE TABLE IF NOT EXISTS ontology.entity (
  id                 serial PRIMARY KEY,
  slug               text NOT NULL UNIQUE,
  name               text NOT NULL,
  type               text NOT NULL,
  layer              smallint NOT NULL CHECK (layer BETWEEN 0 AND 6),
  tagline            text NOT NULL,
  story              text NOT NULL,
  hq                 text,
  ticker             text,
  website            text,
  github             text,
  chokepoint         boolean NOT NULL DEFAULT false,
  -- Ordered [{label, value}] pairs, exactly as rendered.
  key_facts          jsonb,
  related_update_ids text[],
  -- Added by this program; not rendered until the site reads them.
  country            text,
  lifecycle          text NOT NULL DEFAULT 'active'
                     CHECK (lifecycle IN ('active','acquired','merged','defunct','planned')),
  verification       text NOT NULL DEFAULT 'unverified'
                     CHECK (verification IN ('unverified','verified','disputed','stale')),
  verified_on        date,
  seed_source        text,
  -- Position in the seed file, so regeneration reproduces it byte for byte.
  seed_order         int,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ontology.entity_identifier (
  entity_id  int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('ticker','exchange','cik','lei','isin','wikidata','sec_name')),
  value      text NOT NULL,
  PRIMARY KEY (entity_id, kind, value)
);

CREATE TABLE IF NOT EXISTS ontology.entity_alias (
  entity_id  int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  alias      text NOT NULL,
  language   text NOT NULL DEFAULT 'en',
  PRIMARY KEY (entity_id, alias)
);

-- A typed edge. The 13 relations the site renders plus the ones a deal
-- record needs. Direction is from -> to, read as "from <relation> to".
CREATE TABLE IF NOT EXISTS ontology.relation (
  id            serial PRIMARY KEY,
  from_id       int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  to_id         int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  relation      text NOT NULL CHECK (relation IN (
                  'depends_on','supplies','manufactures','designs','powers','hosts',
                  'invests_in','partners_with','competes_with','restricts','uses','used_by','sources',
                  'guarantees','acquired','leases_to','licenses','customer_of')),
  note          text,
  verification  text NOT NULL DEFAULT 'unverified'
                CHECK (verification IN ('unverified','verified','disputed','stale','superseded')),
  verified_on   date,
  valid_from    date,
  valid_to      date,
  seed_source   text,
  seed_order    int,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_id, to_id, relation)
);
CREATE INDEX IF NOT EXISTS relation_from_idx ON ontology.relation(from_id);
CREATE INDEX IF NOT EXISTS relation_to_idx   ON ontology.relation(to_id);

-- The money on an edge. One relation can carry several deals over time
-- (a letter of intent, then the definitive agreement that superseded it).
CREATE TABLE IF NOT EXISTS ontology.deal (
  id               serial PRIMARY KEY,
  relation_id      int NOT NULL REFERENCES ontology.relation(id) ON DELETE CASCADE,
  instrument       text NOT NULL CHECK (instrument IN (
                     'equity','convertible_note','warrant','compute_commitment','supply_agreement',
                     'lease','guarantee','debt','grant','acquisition','revenue_commitment','licence')),
  stage            text NOT NULL CHECK (stage IN (
                     'rumored','loi','definitive','funded','delivered','superseded','terminated')),
  amount           numeric(18,2),
  currency         char(3),
  -- What the amount is: the announced headline, a cap, what was actually
  -- funded, or a third-party estimate. Never mix them in one row.
  amount_basis     text CHECK (amount_basis IN ('announced','cap','funded','estimate')),
  capacity_gw      numeric(8,3),
  announced_on     date,
  term_start       date,
  term_end         date,
  -- Which way the money moves relative to the edge direction.
  money_direction  text CHECK (money_direction IN ('from_to','to_from','none')),
  summary          text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deal_relation_idx ON ontology.deal(relation_id);

-- A citation: the document and the exact words that support a row.
-- Reuses the corpus document table so provenance has one home.
CREATE TABLE IF NOT EXISTS ontology.evidence (
  id            serial PRIMARY KEY,
  target_kind   text NOT NULL CHECK (target_kind IN ('entity','relation','deal','claim','event','prediction','person')),
  target_id     int NOT NULL,
  document_id   int REFERENCES public.document(id),
  url           text,
  quote         text NOT NULL,
  -- Anchor, page or section that locates the quote inside the document.
  locator       text,
  retrieved_at  date NOT NULL,
  retrieval     text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_target_idx ON ontology.evidence(target_kind, target_id);

-- Something that happened on a date: an earnings call, a filing, a press
-- release, a policy action, an outage, a hire.
CREATE TABLE IF NOT EXISTS ontology.event (
  id           serial PRIMARY KEY,
  kind         text NOT NULL CHECK (kind IN (
                 'earnings_call','filing','press_release','policy','outage','product_launch','deal','personnel','other')),
  occurred_on  date NOT NULL,
  headline     text NOT NULL,
  document_id  int REFERENCES public.document(id),
  url          text,
  summary      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ontology.event_entity (
  event_id   int NOT NULL REFERENCES ontology.event(id) ON DELETE CASCADE,
  entity_id  int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  role       text,
  PRIMARY KEY (event_id, entity_id)
);
CREATE TABLE IF NOT EXISTS ontology.event_relation (
  event_id     int NOT NULL REFERENCES ontology.event(id) ON DELETE CASCADE,
  relation_id  int NOT NULL REFERENCES ontology.relation(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, relation_id)
);

-- A forward-looking statement a company made, with its number and date.
-- This is what earnings calls contribute. The quote is mandatory.
CREATE TABLE IF NOT EXISTS ontology.claim (
  id             serial PRIMARY KEY,
  entity_id      int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  event_id       int REFERENCES ontology.event(id),
  metric         text NOT NULL,
  value          numeric(20,4),
  unit           text,
  value_text     text,
  stated_on      date NOT NULL,
  horizon_start  date,
  horizon_end    date,
  speaker        text,
  quote          text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS claim_entity_idx ON ontology.claim(entity_id);

-- A measured time-series point: capex, revenue, RPO, shipments, prices.
-- basis is constrained to measured, as in the corpus: nothing derived is
-- stored beside a published figure.
CREATE TABLE IF NOT EXISTS ontology.signal (
  id           serial PRIMARY KEY,
  entity_id    int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  metric       text NOT NULL,
  period       text NOT NULL,
  value        numeric(20,4) NOT NULL,
  unit         text,
  basis        text NOT NULL DEFAULT 'measured' CHECK (basis = 'measured'),
  document_id  int REFERENCES public.document(id),
  url          text,
  UNIQUE (entity_id, metric, period)
);

-- Our call. Every forecast names its basis and the date it resolves, and is
-- scored afterwards. No row without resolves_on.
CREATE TABLE IF NOT EXISTS ontology.prediction (
  id            serial PRIMARY KEY,
  statement     text NOT NULL,
  basis         text NOT NULL,
  -- The relation ids and claim ids the statement rests on.
  path          jsonb,
  made_on       date NOT NULL,
  resolves_on   date NOT NULL,
  outcome       text NOT NULL DEFAULT 'pending'
                CHECK (outcome IN ('pending','right','wrong','partly','void')),
  scored_on     date,
  scoring_note  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- People in public roles only: an executive, a researcher, a founder, named
-- by the company itself, a filing, a paper or a talk. source_kind is
-- constrained so nothing scraped from a social network can be stored here.
CREATE TABLE IF NOT EXISTS ontology.person (
  id            serial PRIMARY KEY,
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  public_role   text NOT NULL,
  entity_id     int REFERENCES ontology.entity(id) ON DELETE SET NULL,
  focus         text,
  source_kind   text NOT NULL CHECK (source_kind IN (
                  'company_site','filing','paper','conference_talk','github','press_release','official_bio')),
  source_url    text NOT NULL,
  started_on    date,
  ended_on      date,
  verification  text NOT NULL DEFAULT 'unverified'
                CHECK (verification IN ('unverified','verified','disputed','stale')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2026-10-28: company-file fields for the first vertical slice (Anthropic).
ALTER TABLE ontology.deal ADD COLUMN IF NOT EXISTS amount_high numeric(18,2);
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS as_of date;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS site_path text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS sort_order int;
ALTER TABLE ontology.prediction ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
ALTER TABLE ontology.prediction ADD COLUMN IF NOT EXISTS entity_id int REFERENCES ontology.entity(id) ON DELETE CASCADE;
-- Every kind of row that can carry quoted evidence. One definition, the full list: re-running this file
-- must never narrow it below the rows already stored (the 360 tables added the last six kinds).

-- What a fact means for a reader, written in the owner's voice. Drafts stay
-- off production until approved.
CREATE TABLE IF NOT EXISTS ontology.implication (
  id          serial PRIMARY KEY,
  entity_id   int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  audience    text NOT NULL CHECK (audience IN ('marketers','seo','developers','everyone')),
  headline    text NOT NULL,
  body        text NOT NULL,
  approved    boolean NOT NULL DEFAULT false,
  sort_order  int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Links from a map entity to pages elsewhere on the site.
CREATE TABLE IF NOT EXISTS ontology.entity_page (
  entity_id  int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('business_company','business_note','guide','update')),
  path       text NOT NULL,
  label      text NOT NULL,
  PRIMARY KEY (entity_id, path)
);
ALTER TABLE ontology.event ADD COLUMN IF NOT EXISTS date_label text;
ALTER TABLE ontology.event ADD COLUMN IF NOT EXISTS source_file text;
ALTER TABLE ontology.prediction ADD COLUMN IF NOT EXISTS source_file text;
ALTER TABLE ontology.implication ADD COLUMN IF NOT EXISTS source_file text;
ALTER TABLE ontology.deal ADD COLUMN IF NOT EXISTS amount_qualifier text;

-- Corporate groups (2026-10-28): a unit's head entity. Loaded from ontology/groups.json by load_ontology_groups.py.
ALTER TABLE ontology.entity ADD COLUMN IF NOT EXISTS parent_slug text REFERENCES ontology.entity(slug) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS entity_parent_slug_idx ON ontology.entity (parent_slug);

-- ---------------------------------------------------------------------------
-- 2026-10-28: the intelligence program (history, identifiers, earnings calls,
-- posts across platforms, watchlists, the forecast record).
-- ---------------------------------------------------------------------------

-- Identifiers: the SEC's company id, so filings attach to the right entity.
ALTER TABLE ontology.entity ADD COLUMN IF NOT EXISTS cik text;
CREATE INDEX IF NOT EXISTS entity_cik_idx ON ontology.entity (cik);

-- History: a measured figure taken from structured filing data carries its
-- concept, the filing and the form, not only a URL.
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS concept text;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS form text;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS accession text;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS filed_on date;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS period_end date;
ALTER TABLE ontology.signal ADD COLUMN IF NOT EXISTS retrieved_at timestamptz;

-- Earnings calls and the documents around them. The text stays on disk
-- (text_path); the row holds where it came from and when.
CREATE TABLE IF NOT EXISTS ontology.transcript (
  id            serial PRIMARY KEY,
  entity_id     int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('earnings_release','prepared_remarks','earnings_call','shareholder_letter','8k_exhibit','investor_day')),
  period        text NOT NULL,
  held_on       date,
  url           text NOT NULL,
  accession     text,
  document_id   int REFERENCES public.document(id),
  retrieval     text,
  retrieved_at  timestamptz,
  text_path     text,
  summary       text,
  UNIQUE (entity_id, kind, period)
);

-- Content from official channels: company blogs, release notes, talks,
-- papers, executives' public posts. Each row names how it was collected.
CREATE TABLE IF NOT EXISTS ontology.post (
  id            serial PRIMARY KEY,
  entity_id     int REFERENCES ontology.entity(id) ON DELETE CASCADE,
  person_id     int REFERENCES ontology.person(id) ON DELETE SET NULL,
  platform      text NOT NULL CHECK (platform IN ('company_blog','github','youtube','substack','reddit','linkedin','x','podcast','conference','paper','hackernews')),
  url           text NOT NULL UNIQUE,
  title         text,
  author        text,
  published_on  date,
  retrieved_at  timestamptz NOT NULL DEFAULT now(),
  retrieval     text NOT NULL,
  summary       text,
  raw_path      text
);
CREATE INDEX IF NOT EXISTS post_entity_idx ON ontology.post (entity_id, published_on DESC);

-- A dated, typed statement taken from a transcript or a post (guidance,
-- capex, supply, demand...), with its quote. Forecasts rest on these.
CREATE TABLE IF NOT EXISTS ontology.statement (
  id             serial PRIMARY KEY,
  entity_id      int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  transcript_id  int REFERENCES ontology.transcript(id) ON DELETE CASCADE,
  post_id        int REFERENCES ontology.post(id) ON DELETE CASCADE,
  kind           text NOT NULL CHECK (kind IN ('guidance','capex','supply','demand','pricing','hiring','risk','product','partnership','regulation')),
  said_on        date NOT NULL,
  speaker        text,
  quote          text NOT NULL,
  url            text,
  approved       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS statement_entity_idx ON ontology.statement (entity_id, said_on DESC);

-- Watchlists: an address follows an entity; a digest goes out when it has
-- new filings, deals, statements or posts. Nothing is sent before confirmed_at.
CREATE TABLE IF NOT EXISTS ontology.watch (
  id            serial PRIMARY KEY,
  email         text NOT NULL,
  entity_id     int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  confirmed_at  timestamptz,
  last_sent_at  timestamptz,
  UNIQUE (email, entity_id)
);

-- The forecast record, as the site shows it: made, resolved, right.
CREATE OR REPLACE VIEW ontology.forecast_record AS
  SELECT count(*)                                       AS made,
         count(*) FILTER (WHERE outcome <> 'pending')   AS resolved,
         count(*) FILTER (WHERE outcome = 'right')      AS hits,
         count(*) FILTER (WHERE outcome = 'partly')     AS partly,
         count(*) FILTER (WHERE outcome = 'wrong')      AS misses
  FROM ontology.prediction
  WHERE approved;

-- Market share segments (2026-10-28): what a share series measures, who estimated it, and where it sits in the
-- stack. The figures themselves are ontology.signal rows whose metric names the segment (share_*_pct).
CREATE TABLE IF NOT EXISTS ontology.share_segment (
  metric      text PRIMARY KEY,
  label       text NOT NULL,
  measure     text NOT NULL,
  estimator   text NOT NULL,
  scope       text NOT NULL,
  sort_order  int
);

-- Hiring (2026-10-28): each company's public job board, and every posting seen on it. A posting that drops off
-- the board gets closed_on; first_seen and last_seen make weekly trends possible without re-reading anything.
CREATE TABLE IF NOT EXISTS ontology.job_board (
  entity_id    int PRIMARY KEY REFERENCES ontology.entity(id) ON DELETE CASCADE,
  board        text NOT NULL UNIQUE,
  careers_url  text
);
CREATE TABLE IF NOT EXISTS ontology.job_posting (
  id               serial PRIMARY KEY,
  entity_id        int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  board            text NOT NULL,
  external_id      text NOT NULL,
  title            text NOT NULL,
  team             text,
  location         text,
  remote           boolean,
  employment_type  text,
  url              text NOT NULL,
  published_on     date,
  first_seen       date NOT NULL DEFAULT current_date,
  last_seen        date NOT NULL DEFAULT current_date,
  closed_on        date,
  UNIQUE (board, external_id)
);
CREATE INDEX IF NOT EXISTS job_posting_entity_idx ON ontology.job_posting (entity_id, closed_on);
-- Workplace as the board states it (Remote, Hybrid, OnSite); Ashby flags hybrid roles isRemote, so a boolean overstated remote work.
ALTER TABLE ontology.job_posting ADD COLUMN IF NOT EXISTS workplace text;
ALTER TABLE ontology.job_posting ADD COLUMN IF NOT EXISTS locations text[];

-- ===== 360 company file (2026-10-28): people's other roles, legal matters, advisors, funding rounds =====
-- People: a Wikidata id for matching, a display group, and a free-licensed photo with its credit.
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS wikidata text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS grp text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS image_credit text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS image_license text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS image_license_url text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS image_page text;
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS source_file text;
-- Where else a person works or has worked: the links between companies that run through people.
CREATE TABLE IF NOT EXISTS ontology.affiliation (
  id serial PRIMARY KEY,
  person_id int NOT NULL REFERENCES ontology.person(id) ON DELETE CASCADE,
  org_name text NOT NULL,
  org_entity_id int REFERENCES ontology.entity(id) ON DELETE SET NULL,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('executive','director','founder','trustee','employee','investor','advisor','government','academic','nonprofit')),
  period text,
  start_year int,
  end_year int,
  current boolean NOT NULL DEFAULT false,
  sort_order int,
  source_file text NOT NULL
);
-- Lawsuits and government actions, as the company itself discloses them (or as court records show them).
CREATE TABLE IF NOT EXISTS ontology.legal_case (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  court text,
  role text NOT NULL CHECK (role IN ('defendant','plaintiff','petitioner','respondent','subject')),
  kind text NOT NULL,
  filed text,
  filed_on date,
  status text NOT NULL,
  status_on date,
  counterparties text[],
  amount numeric,
  summary text NOT NULL,
  docket_url text,
  sort_order int,
  source_file text NOT NULL
);
-- Advisors and service providers named in filings: auditors, counsel, underwriters.
CREATE TABLE IF NOT EXISTS ontology.engagement (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  org_name text NOT NULL,
  org_entity_id int REFERENCES ontology.entity(id) ON DELETE SET NULL,
  role text NOT NULL,
  since text,
  until text,
  current boolean NOT NULL DEFAULT true,
  sort_order int,
  source_file text NOT NULL
);
-- Every financing from the first round to the IPO, each tranche as the filing lists it.
CREATE TABLE IF NOT EXISTS ontology.funding_round (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  round text NOT NULL,
  tranche text,
  kind text NOT NULL CHECK (kind IN ('priced_round','note_conversion','safe_conversion','secondary_resale','convertible_note','strategic_commitment','ipo')),
  stage text NOT NULL CHECK (stage IN ('pre_public','ipo','post_public')),
  started text,
  ended text,
  announced_on date,
  investors int,
  price_per_share numeric,
  shares bigint,
  amount numeric,
  amount_qualifier text,
  post_money numeric,
  voting boolean,
  summary text NOT NULL,
  sort_order int,
  source_file text NOT NULL
);
CREATE TABLE IF NOT EXISTS ontology.round_investor (
  id serial PRIMARY KEY,
  round_id int NOT NULL REFERENCES ontology.funding_round(id) ON DELETE CASCADE,
  investor_name text NOT NULL,
  investor_entity_id int REFERENCES ontology.entity(id) ON DELETE SET NULL,
  investor_kind text NOT NULL,
  role text NOT NULL CHECK (role IN ('lead','co_lead','participant')),
  UNIQUE (round_id, investor_name)
);
-- Identity facts with their sentence: founding, headquarters, headcount, governance, listing.
CREATE TABLE IF NOT EXISTS ontology.fact (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  as_of date,
  sort_order int,
  source_file text NOT NULL,
  UNIQUE (entity_id, key)
);
-- A person whose only free photo is not a portrait (a holiday snapshot) shows initials instead.
ALTER TABLE ontology.person ADD COLUMN IF NOT EXISTS photo_blocked boolean NOT NULL DEFAULT false;

-- ===== Birth to now (2026-10-28): the company's own website, public attention, news tone =====
-- Every dated page in the sections of a company's sitemap we follow (newsroom, research): its own record of what it did when.
CREATE TABLE IF NOT EXISTS ontology.site_page (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  url text NOT NULL UNIQUE,
  section text NOT NULL,
  title text,
  published_on date,
  retrieved_at date NOT NULL DEFAULT current_date
);
CREATE INDEX IF NOT EXISTS site_page_entity_idx ON ontology.site_page (entity_id, published_on);
-- Public attention: how many stories a forum's public search finds naming the company, month by month.
CREATE TABLE IF NOT EXISTS ontology.attention (
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  source text NOT NULL,
  month date NOT NULL,
  items int NOT NULL,
  query text NOT NULL,
  retrieved_at date NOT NULL DEFAULT current_date,
  PRIMARY KEY (entity_id, source, month)
);
-- News tone: GDELT's average tone of online news that names the company, day by day, with article volume.
CREATE TABLE IF NOT EXISTS ontology.tone (
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  source text NOT NULL,
  day date NOT NULL,
  tone numeric,
  volume numeric,
  query text NOT NULL,
  retrieved_at date NOT NULL DEFAULT current_date,
  PRIMARY KEY (entity_id, source, day)
);
-- Hacker News threads join the official-channel posts (public discussion; usernames are not stored).
ALTER TABLE ontology.post DROP CONSTRAINT IF EXISTS post_platform_check;
ALTER TABLE ontology.post ADD CONSTRAINT post_platform_check CHECK (platform IN ('company_blog','github','youtube','substack','reddit','linkedin','x','podcast','conference','paper','hackernews'));

-- ===== Public footprint (2026-10-28): everyone linked to a company in a public source =====
-- One row per person per source: a paper's author affiliation, a LinkedIn profile that names the company, an X bio,
-- a Substack. Source-specific detail (works, years, titles) sits in `detail`. Names come only as the source shows them.
CREATE TABLE IF NOT EXISTS ontology.footprint (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_id text NOT NULL,
  name text NOT NULL,
  headline text,
  location text,
  profile_url text,
  evidence_url text,
  first_seen date,
  last_seen date,
  is_current boolean,
  detail jsonb,
  retrieved_at date NOT NULL DEFAULT current_date,
  UNIQUE (entity_id, source, source_id)
);
CREATE INDEX IF NOT EXISTS footprint_entity_idx ON ontology.footprint (entity_id, source);

-- ===== Market data (2026-10-28): daily quotes for listed companies, from a free unofficial feed on localhost =====
CREATE TABLE IF NOT EXISTS ontology.market_quote (
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  day date NOT NULL,
  price numeric,
  currency text,
  market_cap numeric,
  change_1d_pct numeric,
  year_high numeric,
  year_low numeric,
  source text NOT NULL DEFAULT 'yahoo',
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, symbol, day)
);

-- Whole-site reading (2026-10-28): every page of the company's sites, with text, team, topics and authors.
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS host text;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'page';
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS modified_on date;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS word_count int;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS team text;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS topics text[];
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS authors jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ontology.site_page ADD COLUMN IF NOT EXISTS http_status int;
UPDATE ontology.site_page SET host = split_part(split_part(url, '://', 2), '/', 1) WHERE host IS NULL;
CREATE INDEX IF NOT EXISTS site_page_host_idx ON ontology.site_page (host, kind);

-- Material agreements a filing lists (the S-1 exhibit index): who the company signed what with, and when.
CREATE TABLE IF NOT EXISTS ontology.agreement (
  id serial PRIMARY KEY,
  entity_id int NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  exhibit text,
  title text NOT NULL,
  counterparty text,
  counterparty_entity_id int REFERENCES ontology.entity(id) ON DELETE SET NULL,
  kind text NOT NULL,
  dated_on date,
  url text,
  redacted boolean NOT NULL DEFAULT false,
  sort_order int,
  source_file text NOT NULL
);
ALTER TABLE ontology.evidence DROP CONSTRAINT IF EXISTS evidence_target_kind_check;
ALTER TABLE ontology.evidence ADD CONSTRAINT evidence_target_kind_check CHECK (target_kind = ANY (ARRAY['entity','relation','deal','claim','event','prediction','person','signal','implication','affiliation','legal_case','engagement','funding_round','job_posting','fact','agreement']));
-- Pipeline runs: what ran, when, how it went, so freshness is a fact and not a memory.
CREATE TABLE IF NOT EXISTS ontology.pipeline_run (
  id serial PRIMARY KEY,
  pipeline text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','partial','failed','skipped')),
  rows_written int,
  spend_usd numeric NOT NULL DEFAULT 0,
  note text
);
CREATE INDEX IF NOT EXISTS pipeline_run_idx ON ontology.pipeline_run (pipeline, started_at DESC);

-- Every raw paid-API response, kept whole in the database as well as on disk, so a backup carries it.
CREATE TABLE IF NOT EXISTS ontology.raw_capture (
  id serial PRIMARY KEY,
  source text NOT NULL,
  tag text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  path text,
  records int,
  cost_usd numeric,
  payload jsonb NOT NULL
);

-- SEC filings per company, read from EDGAR's company filing index: the IPO paper trail (confidential drafts, the
-- public S-1, amendments with the price range, the final prospectus) and, after listing, the periodic reports.
CREATE TABLE IF NOT EXISTS ontology.filing (
  id bigserial PRIMARY KEY,
  entity_id integer NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  form text NOT NULL,
  filed_on date NOT NULL,
  accession text NOT NULL,
  url text NOT NULL,
  description text,
  size text,
  sort_order integer,
  source_file text,
  retrieved_at date NOT NULL DEFAULT current_date,
  UNIQUE (entity_id, accession)
);

-- Federal awards to a company (USAspending.gov), matched on the recipient's own name, not a substring search.
CREATE TABLE IF NOT EXISTS ontology.gov_award (
  id bigserial PRIMARY KEY,
  entity_id integer NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  award_id text NOT NULL,
  recipient text NOT NULL,
  agency text,
  sub_agency text,
  amount numeric,
  start_date date,
  end_date date,
  award_type text,
  description text,
  url text,
  retrieved_at date NOT NULL DEFAULT current_date,
  UNIQUE (entity_id, award_id)
);

-- Lobbying disclosure filings (Senate LDA) where the company is the client: its own in-house reports (expenses) and
-- outside firms' reports (income from the company), with issues, lobbyists and government entities contacted.
CREATE TABLE IF NOT EXISTS ontology.lobbying_filing (
  id bigserial PRIMARY KEY,
  entity_id integer NOT NULL REFERENCES ontology.entity(id) ON DELETE CASCADE,
  filing_uuid text NOT NULL,
  filing_year integer,
  filing_period text,
  filing_type text,
  registrant text,
  client text,
  income numeric,
  expenses numeric,
  posted_at timestamptz,
  issues text[],
  lobbyists text[],
  entities text[],
  description text,
  url text,
  retrieved_at date NOT NULL DEFAULT current_date,
  UNIQUE (entity_id, filing_uuid)
);

-- 2026-10-30: 'partial' (a collector hit its own call cap) is a valid run status
ALTER TABLE ontology.pipeline_run DROP CONSTRAINT IF EXISTS pipeline_run_status_check;
ALTER TABLE ontology.pipeline_run ADD CONSTRAINT pipeline_run_status_check CHECK (status IN ('running','ok','partial','failed','skipped'));
