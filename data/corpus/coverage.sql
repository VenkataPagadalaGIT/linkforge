-- The crosscheck: what the database holds, versus what the site publishes.
-- Run:  docker exec vp-research-db psql -U research -d research_corpus -f /dev/stdin < data/corpus/coverage.sql
\echo '=== WHAT IS STORED, BY METRIC ==='
SELECT m.slug AS metric, m.label,
       count(*) AS obs,
       count(DISTINCT o.subject) AS subjects,
       count(DISTINCT o.segment_id) AS segments,
       min(o.period) || ' to ' || max(o.period) AS span
FROM observation o JOIN metric m ON m.id = o.metric_id
GROUP BY 1,2 ORDER BY 3 DESC;

\echo ''
\echo '=== CURRENT-PERIOD CELLS, WHICH IS WHAT THE TOOL READS ==='
SELECT metric, count(*) AS current_cells
FROM v_latest GROUP BY 1 ORDER BY 2 DESC;

\echo ''
\echo '=== SEGMENT VOCABULARY, WITH PUBLISHED SAMPLE SIZES ==='
SELECT dimension, slug, label, n, moe
FROM segment ORDER BY sort_order, slug;

\echo ''
\echo '=== FIGURES REFUSED, AND WHY ==='
SELECT claim FROM do_not_assert ORDER BY id;
