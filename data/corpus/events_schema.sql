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
