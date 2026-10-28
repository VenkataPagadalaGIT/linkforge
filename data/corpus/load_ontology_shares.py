#!/usr/bin/env python3
"""
Load market shares (data/corpus/ontology/market_share_<date>.json) into the
ontology: the publishers and documents, one share_segment row per segment,
and one ontology.signal per entity and period with the quoted sentence as its
evidence. Deterministic: the file holds every quote and URL; nothing is
fetched here. Re-running replaces the rows of each segment it names.

Run: python3 load_ontology_shares.py ontology/market_share_2026-10-28.json
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

path = sys.argv[1]
D = json.load(open(path, encoding="utf8"))


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


known = {r[0] for r in query("SELECT slug FROM ontology.entity")}
missing = [r["entity"] for seg in D["segments"] for r in seg["rows"] if r["entity"] not in known]
if missing:
    raise SystemExit("unknown entities: " + ", ".join(sorted(set(missing))))

st = []
for s in D["sources"]:
    st.append("INSERT INTO source (slug, name, homepage, kind) VALUES "
              f"({lit(s['slug'])}, {lit(s['name'])}, {lit(s['homepage'])}, {lit(s['kind'])}) ON CONFLICT (slug) DO NOTHING;")
for d in D["documents"]:
    st.append("INSERT INTO document (source_id, slug, title, url, published_on, retrieval, retrieved_at)"
              f" SELECT s.id, {lit(d['slug'])}, {lit(d['title'])}, {lit(d['url'])}, {lit(d['published_on'])}, 'web', now()"
              f" FROM source s WHERE s.slug={lit(d['source'])}"
              " ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, url=EXCLUDED.url, published_on=EXCLUDED.published_on;")

n = 0
for seg in D["segments"]:
    m = seg["metric"]
    st.append("INSERT INTO ontology.share_segment (metric, label, measure, estimator, scope, sort_order) VALUES "
              f"({lit(m)}, {lit(seg['label'])}, {lit(seg['measure'])}, {lit(seg['estimator'])}, {lit(seg['scope'])}, {lit(seg.get('sort_order'))})"
              " ON CONFLICT (metric) DO UPDATE SET label=EXCLUDED.label, measure=EXCLUDED.measure, estimator=EXCLUDED.estimator,"
              " scope=EXCLUDED.scope, sort_order=EXCLUDED.sort_order;")
    st.append(f"DELETE FROM ontology.evidence WHERE target_kind='signal' AND target_id IN (SELECT id FROM ontology.signal WHERE metric={lit(m)});")
    st.append(f"DELETE FROM ontology.signal WHERE metric={lit(m)};")
    doc = next(x for x in D["documents"] if x["slug"] == seg["doc"])
    for r in seg["rows"]:
        sig = f"(SELECT s.id FROM ontology.signal s JOIN ontology.entity e ON e.id=s.entity_id WHERE e.slug={lit(r['entity'])} AND s.metric={lit(m)} AND s.period={lit(r['period'])})"
        st.append("INSERT INTO ontology.signal (entity_id, metric, period, value, unit, label, as_of, document_id, url)"
                  f" SELECT e.id, {lit(m)}, {lit(r['period'])}, {lit(r['value'])}, 'pct', {lit(seg['measure'] + ' (' + seg['estimator'] + ')')}, {lit(r['as_of'])}, d.id, {lit(doc['url'])}"
                  f" FROM ontology.entity e, document d WHERE e.slug={lit(r['entity'])} AND d.slug={lit(seg['doc'])};")
        st.append("INSERT INTO ontology.evidence (target_kind, target_id, document_id, url, quote, locator, retrieved_at, retrieval)"
                  f" SELECT 'signal', {sig}, d.id, {lit(doc['url'])}, {lit(r['quote'])}, {lit(r.get('locator'))}, d.retrieved_at, d.retrieval"
                  f" FROM document d WHERE d.slug={lit(seg['doc'])};")
        n += 1

sql("\n".join(st))
c = query("SELECT count(*) FROM ontology.signal WHERE metric LIKE 'share\\_%'")[0][0]
print(f"segments={len(D['segments'])} rows written={n} share signals in DB={c}")
