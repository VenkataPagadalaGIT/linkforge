-- The Learn catalog: one row per distinct resource on the AI Roadmap and in the AI Encyclopedia. Same site project, kept apart from `ontology` and
-- `events`. A later source (encyclopedia, shelf) adds rows here, not another list. Loaded by learn_catalog.py.
CREATE SCHEMA IF NOT EXISTS learn;

CREATE TABLE IF NOT EXISTS learn.resource (
  id          text PRIMARY KEY,
  url         text NOT NULL UNIQUE,
  title       text NOT NULL,
  format      text NOT NULL CHECK (format IN ('video','course','book','repo')),
  access      text CHECK (access IN ('paid','freemium')),
  creator     text,
  authors     jsonb NOT NULL DEFAULT '[]',
  status      text NOT NULL CHECK (status IN ('ok','dead','unverified')),
  embeddable  boolean,
  checked_at  timestamptz NOT NULL
);

-- Where a resource sits on the roadmap. The same resource can sit under several topics.
CREATE TABLE IF NOT EXISTS learn.placement (
  resource text NOT NULL REFERENCES learn.resource(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  topic    text NOT NULL,
  list     text NOT NULL,
  pos      int  NOT NULL,
  PRIMARY KEY (resource, topic)
);

-- Every check, kept: when a link died is worth knowing, and the page title is the proof it went to the right place.
CREATE TABLE IF NOT EXISTS learn.link_check (
  resource   text NOT NULL,
  checked_at timestamptz NOT NULL,
  status     text NOT NULL,
  http       int,
  final_url  text,
  page_title text,
  channel    text,
  overlap    numeric,
  note       text,
  PRIMARY KEY (resource, checked_at)
);

ALTER TABLE learn.resource ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE learn.resource ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE learn.resource DROP CONSTRAINT IF EXISTS resource_format_check;
ALTER TABLE learn.resource ADD CONSTRAINT resource_format_check CHECK (format IN ('video','course','book','repo','guide','paper'));
