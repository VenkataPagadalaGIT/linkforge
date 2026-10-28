#!/bin/zsh
# Refresh the AI Intelligence Graph's data end to end: schema, loaders, free
# collectors, generators, checks. Run from anywhere; nothing here spends money.
# Paid steps (Bright Data, OpenRouter, Claude) are separate and gated.
set -e
cd "$(dirname "$0")"
echo "== schema"
docker exec -i vp-research-db psql -U research -d research_corpus -v ON_ERROR_STOP=1 -q -f - < ontology_schema.sql 2>&1 | grep -v NOTICE || true
echo "== groups"
python3 load_ontology_groups.py
echo "== company files"
for f in ontology/*_20??-??-??.json; do case "$f" in *market_share_*|*_360_*|*/deals_*) ;; *) python3 load_ontology_company.py "$f";; esac; done
echo "== deal batches"
for f in ontology/deals_20??-??-??.json; do [ -e "$f" ] && python3 load_ontology_deals.py "$f"; done
echo "== 360 files (people and their other roles, rounds and investors, legal, advisors, facts)"
for f in ontology/*_360_20??-??-??.json; do [ -e "$f" ] && python3 load_ontology_360.py "$f"; done
echo "== market shares"
for f in ontology/market_share_*.json; do python3 load_ontology_shares.py "$f"; done
echo "== SEC (skipped unless SEC_USER_AGENT is set)"
if [ -n "$SEC_USER_AGENT" ]; then python3 sec_facts.py --map && python3 sec_facts.py --facts all; fi
echo "== GitHub release notes (free; GITHUB_TOKEN raises the hourly limit)"
python3 collect_posts.py --github all --max-calls ${GH_MAX_CALLS:-50} || true
echo "== feeds"
python3 collect_posts.py --feeds || true
echo "== hiring (every open role on public job boards; free)"
python3 collect_jobs.py | tail -1 || true
echo "== people photos (Wikimedia Commons, free licenses only; new people only)"
python3 fetch_people_photos.py | tail -1 || true
echo "== icons"
python3 fetch_logos.py | head -1
echo "== generate"
python3 gen_ontology_ts.py | tail -1
python3 gen_ontology_intel_ts.py | cut -c1-120
python3 gen_ontology_360_ts.py | cut -c1-120
python3 gen_ontology_ts.py --check
python3 gen_ontology_intel_ts.py --check
python3 gen_ontology_360_ts.py --check
echo "== brand"
python3 ../../scripts/check-brand.py | tail -1
echo "refresh done $(date '+%Y-%m-%d %H:%M')"
