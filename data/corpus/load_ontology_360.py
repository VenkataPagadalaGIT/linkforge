#!/usr/bin/env python3
"""
Load one 360 company file (data/corpus/ontology/<company>_360_<date>.json) into
the ontology schema:

  people        public-role people with a display group (officer, director,
                founder, trustee, former_director), a Wikidata id for photos,
                and their exact source sentences
  affiliations  where else each person works or has worked: the links between
                companies that run through people
  legal         lawsuits and government actions as the company discloses them
  advisors      auditors, counsel and underwriters named in filings
  rounds        every financing from the first round to the IPO, with investors
                (lead, co-lead, participant) and an investor type
  facts         identity facts: founding, headcount, board, control, listing

Every item carries exact quotes; each becomes an evidence row pointing at its
document. Deterministic: nothing is fetched here. Re-running replaces this
file's rows (matched by source_file); photos set by fetch_people_photos.py are
kept.

Run: python3 load_ontology_360.py ontology/anthropic_360_2026-10-28.json
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

path = sys.argv[1]
SRC = os.path.basename(path)
D = json.load(open(path, encoding="utf8"))
ENT = D["entity"]
A = D.get("anchors", {})
DOC_URL = {d["slug"]: d["url"] for d in D.get("documents", [])}


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(xs):
    return "ARRAY[" + ",".join(lit(x) for x in xs) + "]::text[]" if xs else "NULL"


def eid(slug):
    return f"(SELECT id FROM ontology.entity WHERE slug={lit(slug)})" if slug else "NULL"


def ev_url(e):
    return A.get(e.get("anchor")) if e.get("anchor") else DOC_URL.get(e["doc"])


def with_evidence(kind, insert_sql, evidence):
    """One statement: insert the item, then its quotes as evidence rows keyed to the new id."""
    vals = ", ".join(f"({lit(e['doc'])}, {lit(ev_url(e))}, {lit(e['quote'])}, {lit(e.get('locator'))})" for e in evidence)
    return (f"WITH ins AS ({insert_sql} RETURNING id) INSERT INTO ontology.evidence (target_kind,target_id,document_id,url,quote,locator,retrieved_at,retrieval)"
            f" SELECT {lit(kind)}, ins.id, d.id, v.url, v.quote, v.locator, d.retrieved_at, d.retrieval"
            f" FROM ins, (VALUES {vals}) AS v(doc, url, quote, locator) JOIN document d ON d.slug = v.doc;")


st = []
for s in D.get("sources", []):
    st.append("INSERT INTO source (slug,name,homepage,kind) VALUES"
              f" ({lit(s['slug'])},{lit(s['name'])},{lit(s.get('homepage'))},{lit(s['kind'])})"
              " ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, homepage=EXCLUDED.homepage;")
for d in D.get("documents", []):
    st.append("INSERT INTO document (source_id, slug, title, url, published_on, retrieval, retrieved_at)"
              f" SELECT s.id, {lit(d['slug'])}, {lit(d['title'])}, {lit(d['url'])}, {lit(d.get('published_on'))}, 'curl', current_date"
              f" FROM source s WHERE s.slug={lit(d['source'])}"
              " ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, url=EXCLUDED.url, published_on=EXCLUDED.published_on;")

# Clear this file's previous rows (evidence first: it has no foreign key to its targets).
OWNED = {
    "person": f"SELECT id FROM ontology.person WHERE source_file={lit(SRC)}",
    "affiliation": f"SELECT id FROM ontology.affiliation WHERE source_file={lit(SRC)}",
    "legal_case": f"SELECT id FROM ontology.legal_case WHERE source_file={lit(SRC)}",
    "engagement": f"SELECT id FROM ontology.engagement WHERE source_file={lit(SRC)}",
    "funding_round": f"SELECT id FROM ontology.funding_round WHERE source_file={lit(SRC)}",
    "fact": f"SELECT id FROM ontology.fact WHERE source_file={lit(SRC)}",
    "agreement": f"SELECT id FROM ontology.agreement WHERE source_file={lit(SRC)}",
}
for kind, sel in OWNED.items():
    st.append(f"DELETE FROM ontology.evidence WHERE target_kind={lit(kind)} AND target_id IN ({sel});")
for table in ("affiliation", "legal_case", "engagement", "funding_round", "fact", "agreement", "filing"):
    st.append(f"DELETE FROM ontology.{table} WHERE source_file={lit(SRC)};")
# People are upserted (their photos stay); people this file no longer lists are removed.
slugs = [p["slug"] for p in D.get("people", [])]
st.append(f"DELETE FROM ontology.person WHERE source_file={lit(SRC)}" + (f" AND slug NOT IN ({', '.join(lit(s) for s in slugs)})" if slugs else "") + ";")
# Evidence for people listed here is rewritten below.
if slugs:
    st.append(f"DELETE FROM ontology.evidence WHERE target_kind='person' AND target_id IN (SELECT id FROM ontology.person WHERE slug IN ({', '.join(lit(s) for s in slugs)}));")

for p in D.get("people", []):
    first = p["evidence"][0]
    kind = "company_site" if first["doc"] in DOC_URL else "filing"  # documents listed in the file are company pages; the rest are filings
    st.append("INSERT INTO ontology.person (slug,name,public_role,entity_id,source_kind,source_url,site_path,sort_order,verification,grp,wikidata,source_file)"
              f" VALUES ({lit(p['slug'])},{lit(p['name'])},{lit(p['public_role'])},{eid(ENT)},{lit(kind)},{lit(ev_url(first))},{lit(p.get('site_path'))},"
              f"{lit(p.get('sort_order'))},'verified',{lit(p.get('group'))},{lit(p.get('wikidata'))},{lit(SRC)})"
              " ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, public_role=EXCLUDED.public_role, entity_id=EXCLUDED.entity_id, source_kind=EXCLUDED.source_kind,"
              " source_url=EXCLUDED.source_url, site_path=EXCLUDED.site_path, sort_order=EXCLUDED.sort_order, verification='verified', grp=EXCLUDED.grp,"
              " wikidata=EXCLUDED.wikidata, source_file=EXCLUDED.source_file, updated_at=now();")
    blocked = p.get("photo") is False
    st.append(f"UPDATE ontology.person SET photo_blocked={lit(blocked)}" + (", image_path=NULL, image_credit=NULL, image_license=NULL, image_license_url=NULL, image_page=NULL" if blocked else "")
              + f" WHERE slug={lit(p['slug'])};")
    for e in p["evidence"]:
        st.append("INSERT INTO ontology.evidence (target_kind,target_id,document_id,url,quote,locator,retrieved_at,retrieval)"
                  f" SELECT 'person', (SELECT id FROM ontology.person WHERE slug={lit(p['slug'])}), d.id, {lit(ev_url(e))}, {lit(e['quote'])}, {lit(e.get('locator'))},"
                  f" d.retrieved_at, d.retrieval FROM document d WHERE d.slug={lit(e['doc'])};")

for i, a in enumerate(D.get("affiliations", [])):
    st.append(with_evidence("affiliation",
        "INSERT INTO ontology.affiliation (person_id,org_name,org_entity_id,title,kind,period,start_year,end_year,current,sort_order,source_file)"
        f" VALUES ((SELECT id FROM ontology.person WHERE slug={lit(a['person'])}),{lit(a['org'])},{eid(a.get('org_entity'))},{lit(a['title'])},{lit(a['kind'])},"
        f"{lit(a.get('period'))},{lit(a.get('start_year'))},{lit(a.get('end_year'))},{lit(bool(a.get('current')))},{i + 1},{lit(SRC)})", a["evidence"]))

for c in D.get("legal", []):
    st.append(with_evidence("legal_case",
        "INSERT INTO ontology.legal_case (entity_id,slug,name,court,role,kind,filed,filed_on,status,status_on,counterparties,amount,summary,docket_url,sort_order,source_file)"
        f" VALUES ({eid(ENT)},{lit(c['slug'])},{lit(c['name'])},{lit(c.get('court'))},{lit(c['role'])},{lit(c['kind'])},{lit(c.get('filed'))},{lit(c.get('filed_on'))},"
        f"{lit(c['status'])},{lit(c.get('status_on'))},{arr(c.get('counterparties'))},{lit(c.get('amount'))},{lit(c['summary'])},{lit(c.get('docket_url'))},{lit(c.get('sort_order'))},{lit(SRC)})",
        c["evidence"]))

for g in D.get("advisors", []):
    st.append(with_evidence("engagement",
        "INSERT INTO ontology.engagement (entity_id,org_name,org_entity_id,role,since,until,current,sort_order,source_file)"
        f" VALUES ({eid(ENT)},{lit(g['org'])},{eid(g.get('org_entity'))},{lit(g['role'])},{lit(g.get('since'))},{lit(g.get('until'))},{lit(bool(g.get('current', True)))},"
        f"{lit(g.get('sort_order'))},{lit(SRC)})", g["evidence"]))

for r in D.get("rounds", []):
    st.append(with_evidence("funding_round",
        "INSERT INTO ontology.funding_round (entity_id,slug,round,tranche,kind,stage,started,ended,announced_on,investors,price_per_share,shares,amount,amount_qualifier,post_money,voting,summary,sort_order,source_file)"
        f" VALUES ({eid(ENT)},{lit(r['slug'])},{lit(r['round'])},{lit(r.get('tranche'))},{lit(r['kind'])},{lit(r['stage'])},{lit(r.get('started'))},{lit(r.get('ended'))},"
        f"{lit(r.get('announced_on'))},{lit(r.get('investors'))},{lit(r.get('price_per_share'))},{lit(r.get('shares'))},{lit(r.get('amount'))},{lit(r.get('amount_qualifier'))},"
        f"{lit(r.get('post_money'))},{lit(bool(r.get('voting', True)))},{lit(r['summary'])},{lit(r.get('sort_order'))},{lit(SRC)})", r["evidence"]))
    for w in r.get("who", []):
        st.append("INSERT INTO ontology.round_investor (round_id,investor_name,investor_entity_id,investor_kind,role)"
                  f" VALUES ((SELECT id FROM ontology.funding_round WHERE slug={lit(r['slug'])}),{lit(w['name'])},{eid(w.get('entity'))},{lit(w['kind'])},{lit(w['role'])})"
                  " ON CONFLICT (round_id, investor_name) DO UPDATE SET role=EXCLUDED.role, investor_kind=EXCLUDED.investor_kind, investor_entity_id=EXCLUDED.investor_entity_id;")

for f in D.get("facts", []):
    st.append(with_evidence("fact",
        "INSERT INTO ontology.fact (entity_id,key,label,value,as_of,sort_order,source_file)"
        f" VALUES ({eid(ENT)},{lit(f['key'])},{lit(f['label'])},{lit(f['value'])},{lit(f.get('as_of'))},{lit(f.get('sort_order'))},{lit(SRC)})"
        " ON CONFLICT (entity_id, key) DO UPDATE SET label=EXCLUDED.label, value=EXCLUDED.value, as_of=EXCLUDED.as_of, sort_order=EXCLUDED.sort_order, source_file=EXCLUDED.source_file",
        f["evidence"]))

for g in D.get("agreements", []):
    st.append(with_evidence("agreement",
        "INSERT INTO ontology.agreement (entity_id,exhibit,title,counterparty,counterparty_entity_id,kind,dated_on,url,redacted,sort_order,source_file)"
        f" VALUES ({eid(ENT)},{lit(g.get('exhibit'))},{lit(g['title'])},{lit(g.get('counterparty'))},{eid(g.get('counterparty_entity'))},{lit(g['kind'])},{lit(g.get('dated_on'))},"
        f"{lit(g.get('url'))},{lit(bool(g.get('redacted')))},{lit(g.get('sort_order'))},{lit(SRC)})", g["evidence"]))

# SEC filings (the IPO paper trail): the filing index itself is the record, so they carry no quotes.
for g in D.get("filings", []):
    st.append("INSERT INTO ontology.filing (entity_id,form,filed_on,accession,url,description,size,sort_order,source_file) VALUES"
              f" ({eid(ENT)},{lit(g['form'])},{lit(g['filed_on'])},{lit(g['accession'])},{lit(g['url'])},{lit(g.get('description'))},{lit(g.get('size'))},{lit(g.get('sort_order'))},{lit(SRC)})"
              " ON CONFLICT (entity_id, accession) DO UPDATE SET form=EXCLUDED.form, filed_on=EXCLUDED.filed_on, url=EXCLUDED.url, description=EXCLUDED.description,"
              " size=EXCLUDED.size, sort_order=EXCLUDED.sort_order, source_file=EXCLUDED.source_file, retrieved_at=current_date;")

sql("\n".join(st), timeout=300)
c = query(f"""SELECT
  (SELECT count(*) FROM ontology.person WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.affiliation WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.legal_case WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.engagement WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.funding_round WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.round_investor ri JOIN ontology.funding_round r ON r.id=ri.round_id WHERE r.source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.fact WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.agreement WHERE source_file={lit(SRC)}),
  (SELECT count(*) FROM ontology.evidence WHERE target_kind IN ('affiliation','legal_case','engagement','funding_round','fact','agreement')
     OR (target_kind='person' AND target_id IN (SELECT id FROM ontology.person WHERE source_file={lit(SRC)})))""")[0]
print(f"{ENT} 360 ({SRC}): filings={query(f'SELECT count(*) FROM ontology.filing WHERE source_file={lit(SRC)}')[0][0]} people={c[0]} affiliations={c[1]} legal={c[2]} advisors={c[3]} rounds={c[4]} round_investors={c[5]} facts={c[6]} agreements={c[7]} evidence={c[8]}")
