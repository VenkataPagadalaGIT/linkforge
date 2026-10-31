-- 2026-10-30: event files (one breaking event read from every platform), kept apart from the AI graph's ontology schema.
CREATE SCHEMA IF NOT EXISTS events;
CREATE TABLE IF NOT EXISTS events.event (
  slug        text PRIMARY KEY,
  title       text NOT NULL,
  summary     text,
  window_from date,
  window_to   date,
  seed        jsonb,          -- the curated file: facts, moments, money trail, actors, claim checks, what to watch
  seed_file   text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- Everything read about the event: official statements, investigator reports, news, posts, videos, threads, comments.
CREATE TABLE IF NOT EXISTS events.document (
  id           bigserial PRIMARY KEY,
  event_slug   text NOT NULL REFERENCES events.event(slug) ON DELETE CASCADE,
  url          text NOT NULL,
  platform     text NOT NULL,   -- binance, x, web, news, reddit, youtube, tiktok, instagram, hackernews
  kind         text NOT NULL,   -- statement, report, article, post, video, thread, comment
  voice        text NOT NULL,   -- official, investigator, government, press, public
  title        text,
  author       text,            -- an organization or public role only; private people are never stored by name
  published_at timestamptz,
  metrics      jsonb,           -- views, likes, comments, score as the platform shows them on the day read
  body         text,            -- full text or transcript, for quote checks and claim matching
  source_call  text,            -- which archived call it came from
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_slug, url)
);
CREATE INDEX IF NOT EXISTS document_event_platform ON events.document (event_slug, platform);

-- 2026-10-31: the subject taxonomy (Knowledge Graph Feeds) and where each story sits in it. Authored in
-- taxonomy/subjects.outline, loaded by taxonomy/build_taxonomy.py. A story has one primary subject and any number of
-- secondary ones, each with the reason it was filed there.
CREATE TABLE IF NOT EXISTS events.subject (
  id          text PRIMARY KEY,        -- the slug path, e.g. technology/cybersecurity/hacks-breaches/crypto-exchange-hacks
  parent_id   text REFERENCES events.subject(id) ON DELETE CASCADE,
  level       smallint NOT NULL CHECK (level BETWEEN 1 AND 10),
  label       text NOT NULL,
  description text,
  iptc        text,                    -- IPTC Media Topic code where mapped (the top level today)
  sort        integer NOT NULL
);
CREATE TABLE IF NOT EXISTS events.event_subject (
  event_slug  text NOT NULL REFERENCES events.event(slug) ON DELETE CASCADE,
  subject_id  text NOT NULL REFERENCES events.subject(id),
  role        text NOT NULL CHECK (role IN ('primary', 'secondary')),
  why         text NOT NULL,
  PRIMARY KEY (event_slug, subject_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS event_subject_one_primary ON events.event_subject (event_slug) WHERE role = 'primary';
-- The order the subjects are listed in the story's file: most important first, so pages show them that way.
ALTER TABLE events.event_subject ADD COLUMN IF NOT EXISTS sort integer NOT NULL DEFAULT 0;
