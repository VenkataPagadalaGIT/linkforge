#!/usr/bin/env python3
"""
Load verified deals, evidence, events and signals into the ontology schema
from an archived JSON file in data/corpus/ontology/. Deterministic: the file
holds the quotes and URLs, nothing is fetched here.

A relation listed in the file is created if missing. Its note is NOT
rewritten here: the site's text changes only through gen_ontology_ts.py after
the owner approves. Only the verification flag moves (verified or stale).

Run: python3 load_ontology_deals.py ontology/deals_2026-10-27.json
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "ontology", "deals_2026-10-27.json")
D = json.load(open(path, encoding="utf8"))


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


st = []
for s in D["sources"]:
    st.append(f"INSERT INTO source (slug,name,homepage,kind) VALUES ({lit(s['slug'])},{lit(s['name'])},{lit(s['homepage'])},{lit(s['kind'])}) ON CONFLICT (slug) DO NOTHING;")
for d in D["documents"]:
    st.append("INSERT INTO document (source_id,slug,title,url,published_on,retrieval,retrieved_at) SELECT id,"
              + ",".join(lit(x) for x in [d["slug"], d["title"], d["url"], d.get("published_on"), d["retrieval"], d["retrieved_at"]])
              + f" FROM source WHERE slug={lit(d['source'])} ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, url=EXCLUDED.url, published_on=EXCLUDED.published_on, retrieval=EXCLUDED.retrieval, retrieved_at=EXCLUDED.retrieved_at;")

for ev in D.get("events", []):
    st.append(f"DELETE FROM ontology.event WHERE headline={lit(ev['headline'])} AND occurred_on={lit(ev['occurred_on'])};")
    st.append(f"INSERT INTO ontology.event (kind,occurred_on,headline,document_id) SELECT {lit(ev['kind'])},{lit(ev['occurred_on'])},{lit(ev['headline'])},id FROM document WHERE slug={lit(ev['document'])};")
    for ent in ev.get("entities", []):
        st.append(f"INSERT INTO ontology.event_entity (event_id,entity_id) SELECT e.id, n.id FROM ontology.event e, ontology.entity n WHERE e.headline={lit(ev['headline'])} AND e.occurred_on={lit(ev['occurred_on'])} AND n.slug={lit(ent)} ON CONFLICT DO NOTHING;")

for sg in D.get("signals", []):
    st.append("INSERT INTO ontology.signal (entity_id,metric,period,value,unit,document_id,url) SELECT n.id,"
              + ",".join(lit(x) for x in [sg["metric"], sg["period"], sg["value"], sg.get("unit")])
              + f", d.id, d.url FROM ontology.entity n, document d WHERE n.slug={lit(sg['entity'])} AND d.slug={lit(sg['document'])}"
              + " ON CONFLICT (entity_id,metric,period) DO UPDATE SET value=EXCLUDED.value, unit=EXCLUDED.unit, document_id=EXCLUDED.document_id, url=EXCLUDED.url;")

for r in D["relations"]:
    key = f"from_id=(SELECT id FROM ontology.entity WHERE slug={lit(r['from'])}) AND to_id=(SELECT id FROM ontology.entity WHERE slug={lit(r['to'])}) AND relation={lit(r['relation'])}"
    st.append("INSERT INTO ontology.relation (from_id,to_id,relation,note,verification,verified_on,seed_source)"
              f" SELECT f.id,t.id,{lit(r['relation'])},{lit(r.get('note'))},{lit(r.get('verification','unverified'))},current_date,{lit(os.path.basename(path))}"
              f" FROM ontology.entity f, ontology.entity t WHERE f.slug={lit(r['from'])} AND t.slug={lit(r['to'])}"
              f" ON CONFLICT (from_id,to_id,relation) DO UPDATE SET verification=EXCLUDED.verification, verified_on=current_date, updated_at=now();")
    for dl in r.get("deals", []):
        # Replace this deal's rows (same relation, instrument and summary) so a re-run does not duplicate.
        st.append(f"DELETE FROM ontology.evidence WHERE target_kind='deal' AND target_id IN (SELECT id FROM ontology.deal WHERE relation_id=(SELECT id FROM ontology.relation WHERE {key}) AND instrument={lit(dl['instrument'])} AND summary={lit(dl['summary'])});")
        st.append(f"DELETE FROM ontology.deal WHERE relation_id=(SELECT id FROM ontology.relation WHERE {key}) AND instrument={lit(dl['instrument'])} AND summary={lit(dl['summary'])};")
        st.append("INSERT INTO ontology.deal (relation_id,instrument,stage,amount,currency,amount_basis,capacity_gw,announced_on,term_start,term_end,money_direction,summary)"
                  f" SELECT id,{lit(dl['instrument'])},{lit(dl['stage'])},{lit(dl.get('amount'))},{lit(dl.get('currency'))},{lit(dl.get('amount_basis'))},{lit(dl.get('capacity_gw'))},"
                  f"{lit(dl.get('announced_on'))},{lit(dl.get('term_start'))},{lit(dl.get('term_end'))},{lit(dl.get('money_direction'))},{lit(dl['summary'])}"
                  f" FROM ontology.relation WHERE {key};")
        for e in dl.get("evidence", []):
            st.append("INSERT INTO ontology.evidence (target_kind,target_id,document_id,url,quote,locator,retrieved_at,retrieval)"
                      f" SELECT 'deal', dl.id, d.id, d.url, {lit(e['quote'])}, {lit(e.get('locator'))}, d.retrieved_at, d.retrieval"
                      f" FROM ontology.deal dl, document d WHERE dl.relation_id=(SELECT id FROM ontology.relation WHERE {key}) AND dl.instrument={lit(dl['instrument'])} AND dl.summary={lit(dl['summary'])} AND d.slug={lit(e['document'])};")

sql("\n".join(st))
c = query("SELECT (SELECT count(*) FROM ontology.deal), (SELECT count(*) FROM ontology.evidence), (SELECT count(*) FROM ontology.event), (SELECT count(*) FROM ontology.signal), (SELECT count(*) FROM ontology.relation WHERE verification='verified'), (SELECT count(*) FROM ontology.relation)")[0]
print(f"deals={c[0]} evidence={c[1]} events={c[2]} signals={c[3]} verified_relations={c[4]} relations={c[5]}")
