#!/usr/bin/env python3
"""
Load one company file (data/corpus/ontology/<company>_<date>.json) into the
ontology schema: relations with deals and quoted evidence, measured signals,
people in public roles, dated events, draft forecasts and implications, and
links to the company's other pages on the site.

Deterministic: the file holds every quote and URL; nothing is fetched here.
Re-running replaces this file's rows (matched by entity and source_file), so a
corrected file can be loaded again without duplicates.

Run: python3 load_ontology_company.py ontology/anthropic_2026-10-28.json
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

path = sys.argv[1]
SRC = os.path.basename(path)
D = json.load(open(path, encoding="utf8"))
ENT = D["entity"]
A = D["anchors"]
DOC = D["document"]


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def eid(slug):
    return f"(SELECT id FROM ontology.entity WHERE slug={lit(slug)})"


def doc_id():
    return f"(SELECT id FROM document WHERE slug={lit(DOC)})"


def evidence(kind, target_sql, quote, anchor, locator):
    url = A.get(anchor) if anchor else None
    return (f"INSERT INTO ontology.evidence (target_kind,target_id,document_id,url,quote,locator,retrieved_at,retrieval)"
            f" SELECT {lit(kind)}, ({target_sql}), d.id, {lit(url)}, {lit(quote)}, {lit(locator)}, d.retrieved_at, d.retrieval"
            f" FROM document d WHERE d.slug={lit(DOC)};")


st = []
# Clear this file's previous rows for this entity, so a re-run replaces them.
st.append(f"DELETE FROM ontology.evidence WHERE target_kind='signal' AND target_id IN (SELECT id FROM ontology.signal WHERE entity_id={eid(ENT)});")
st.append(f"DELETE FROM ontology.signal WHERE entity_id={eid(ENT)};")
st.append(f"DELETE FROM ontology.evidence WHERE target_kind='person' AND target_id IN (SELECT id FROM ontology.person WHERE entity_id={eid(ENT)});")
st.append(f"DELETE FROM ontology.person WHERE entity_id={eid(ENT)};")
st.append(f"DELETE FROM ontology.event WHERE source_file={lit(SRC)};")
st.append(f"DELETE FROM ontology.prediction WHERE source_file={lit(SRC)};")
st.append(f"DELETE FROM ontology.implication WHERE source_file={lit(SRC)};")
st.append(f"DELETE FROM ontology.entity_page WHERE entity_id={eid(ENT)};")

for pg in D.get("pages", []):
    st.append(f"INSERT INTO ontology.entity_page (entity_id,kind,path,label) VALUES ({eid(ENT)},{lit(pg['kind'])},{lit(pg['path'])},{lit(pg['label'])});")

for r in D.get("relations", []):
    key = f"from_id={eid(r['from'])} AND to_id={eid(r['to'])} AND relation={lit(r['relation'])}"
    st.append("INSERT INTO ontology.relation (from_id,to_id,relation,note,verification,verified_on,seed_source)"
              f" SELECT {eid(r['from'])},{eid(r['to'])},{lit(r['relation'])},{lit(r.get('note'))},{lit(r.get('verification','unverified'))},current_date,{lit(SRC)}"
              f" ON CONFLICT (from_id,to_id,relation) DO UPDATE SET verification=EXCLUDED.verification, verified_on=current_date, updated_at=now();")
    for dl in r.get("deals", []):
        match = f"relation_id=(SELECT id FROM ontology.relation WHERE {key}) AND instrument={lit(dl['instrument'])} AND summary={lit(dl['summary'])}"
        st.append(f"DELETE FROM ontology.evidence WHERE target_kind='deal' AND target_id IN (SELECT id FROM ontology.deal WHERE {match});")
        st.append(f"DELETE FROM ontology.deal WHERE {match};")
        st.append("INSERT INTO ontology.deal (relation_id,instrument,stage,amount,amount_high,amount_qualifier,currency,amount_basis,capacity_gw,announced_on,term_start,term_end,money_direction,summary)"
                  f" SELECT id,{lit(dl['instrument'])},{lit(dl['stage'])},{lit(dl.get('amount'))},{lit(dl.get('amount_high'))},{lit(dl.get('qualifier'))},{lit(dl.get('currency'))},{lit(dl.get('amount_basis'))},"
                  f"{lit(dl.get('capacity_gw'))},{lit(dl.get('announced_on'))},{lit(dl.get('term_start'))},{lit(dl.get('term_end'))},{lit(dl.get('money_direction'))},{lit(dl['summary'])}"
                  f" FROM ontology.relation WHERE {key};")
        for e in dl.get("evidence", []):
            st.append(evidence("deal", f"SELECT id FROM ontology.deal WHERE {match}", e["quote"], e.get("anchor"), e.get("locator")))

for s in D.get("signals", []):
    url = A.get(s.get("anchor"))
    st.append("INSERT INTO ontology.signal (entity_id,metric,period,value,unit,document_id,url,as_of,label)"
              f" VALUES ({eid(ENT)},{lit(s['metric'])},{lit(s['period'])},{lit(s['value'])},{lit(s.get('unit'))},{doc_id()},{lit(url)},{lit(s.get('as_of'))},{lit(s.get('label'))});")
    st.append(evidence("signal", f"SELECT id FROM ontology.signal WHERE entity_id={eid(ENT)} AND metric={lit(s['metric'])} AND period={lit(s['period'])}",
                       s["quote"], s.get("anchor"), s.get("locator")))

for p in D.get("people", []):
    url = A.get(p.get("anchor"))
    st.append("INSERT INTO ontology.person (slug,name,public_role,entity_id,source_kind,source_url,site_path,sort_order,verification)"
              f" VALUES ({lit(p['slug'])},{lit(p['name'])},{lit(p['public_role'])},{eid(ENT)},'filing',{lit(url)},{lit(p.get('site_path'))},{lit(p.get('sort_order'))},'verified')"
              " ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, public_role=EXCLUDED.public_role, entity_id=EXCLUDED.entity_id, source_url=EXCLUDED.source_url,"
              " site_path=EXCLUDED.site_path, sort_order=EXCLUDED.sort_order, verification='verified', updated_at=now();")
    st.append(evidence("person", f"SELECT id FROM ontology.person WHERE slug={lit(p['slug'])}", p["quote"], p.get("anchor"), "Management"))

for ev in D.get("events", []):
    url = A.get(ev.get("anchor"))
    st.append("INSERT INTO ontology.event (kind,occurred_on,headline,document_id,url,date_label,source_file)"
              f" VALUES ({lit(ev['kind'])},{lit(ev['occurred_on'])},{lit(ev['headline'])},{doc_id()},{lit(url)},{lit(ev.get('date_label'))},{lit(SRC)});")
    st.append(f"INSERT INTO ontology.event_entity (event_id,entity_id,role) SELECT max(id), {eid(ENT)}, 'subject' FROM ontology.event WHERE source_file={lit(SRC)} AND headline={lit(ev['headline'])} ON CONFLICT DO NOTHING;")

for pr in D.get("predictions", []):
    st.append("INSERT INTO ontology.prediction (statement,basis,made_on,resolves_on,approved,entity_id,source_file)"
              f" VALUES ({lit(pr['statement'])},{lit(pr['basis'])},{lit(pr['made_on'])},{lit(pr['resolves_on'])},{lit(pr.get('approved', False))},{eid(ENT)},{lit(SRC)});")

for im in D.get("implications", []):
    st.append("INSERT INTO ontology.implication (entity_id,audience,headline,body,approved,sort_order,source_file)"
              f" VALUES ({eid(ENT)},{lit(im['audience'])},{lit(im['headline'])},{lit(im['body'])},{lit(im.get('approved', False))},{lit(im.get('sort_order'))},{lit(SRC)});")

eu = D.get("entity_update")
if eu:
    sets = []
    for col, key in (("tagline", "tagline"), ("story", "story"), ("ticker", "ticker")):
        if key in eu:
            sets.append(f"{col}={lit(eu[key])}")
    if "keyFacts" in eu:
        sets.append("key_facts=" + lit(json.dumps(eu["keyFacts"], ensure_ascii=False)) + "::jsonb")
    sets.append(f"verification={lit(eu.get('verification', 'verified'))}, verified_on=current_date, updated_at=now()")
    st.append(f"UPDATE ontology.entity SET {', '.join(sets)} WHERE slug={lit(ENT)};")
    st.append(f"DELETE FROM ontology.evidence WHERE target_kind='entity' AND target_id={eid(ENT)};")
    for e in eu.get("evidence", []):
        st.append(evidence("entity", f"SELECT id FROM ontology.entity WHERE slug={lit(ENT)}", e["quote"], e.get("anchor"), e.get("locator")))

# Other entities this file corrects (a rename the filing proves), each with its quote.
for cu in D.get("counterparty_updates", []):
    sets = [f"{col}={lit(cu[col])}" for col in ("name", "tagline") if col in cu]
    st.append(f"UPDATE ontology.entity SET {', '.join(sets)}, updated_at=now() WHERE slug={lit(cu['slug'])};")
    st.append(f"DELETE FROM ontology.evidence WHERE target_kind='entity' AND target_id={eid(cu['slug'])}"
              f" AND document_id=(SELECT id FROM document WHERE slug={lit(DOC)});")
    for e in cu.get("evidence", []):
        st.append(evidence("entity", f"SELECT id FROM ontology.entity WHERE slug={lit(cu['slug'])}", e["quote"], e.get("anchor"), e.get("locator")))

sql("\n".join(st))
c = query(f"""SELECT
  (SELECT count(*) FROM ontology.deal dl JOIN ontology.relation r ON r.id=dl.relation_id WHERE r.from_id={eid(ENT)} OR r.to_id={eid(ENT)}),
  (SELECT count(*) FROM ontology.signal WHERE entity_id={eid(ENT)}),
  (SELECT count(*) FROM ontology.person WHERE entity_id={eid(ENT)}),
  (SELECT count(*) FROM ontology.event WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.prediction WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.implication WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.evidence)""")[0]
print(f"{ENT}: deals={c[0]} signals={c[1]} people={c[2]} events={c[3]} predictions={c[4]} implications={c[5]} evidence_total={c[6]}")
