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
