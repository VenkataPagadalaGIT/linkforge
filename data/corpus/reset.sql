-- Destructive. Wipes the corpus so schema.sql can rebuild it from nothing.
-- Kept in its own file precisely so it can never happen by accident: schema.sql
-- is re-run often, and it once emptied a loaded corpus because it led with this.
DROP VIEW IF EXISTS v_latest, v_coverage, v_crawl CASCADE;
DROP TABLE IF EXISTS observation, do_not_assert, segment, metric, document, resource, source, ingest_run CASCADE;
