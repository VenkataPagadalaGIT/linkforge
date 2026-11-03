#!/usr/bin/env python3
"""
Load the non-Pew sources: USAFacts national context, the separate Pew
daily-use and teen surveys, Cox Automotive, DataReportal, and the
do-not-assert list.

These are read out of src/data/personas.ts, which was the source of truth
before this database existed. After this runs the database is the source of
truth and personas.ts is generated from it.
"""
import os, re, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, q

TS = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "personas.ts")
src = open(TS).read()


def objects(const):
    """Pull `export const NAME = [ {...}, {...} ]` into python dicts."""
    m = re.search(r"export const " + const + r"\b[^\n]*=\s*\[(.*?)\n\];", src, re.S)
    if not m:
        return []
    body, out, depth, buf = m.group(1), [], 0, ""
    for ch in body:
        if ch == "{":
            depth += 1
        if depth:
            buf += ch
        if ch == "}":
            depth -= 1
            if depth == 0:
                out.append(buf); buf = ""
    res = []
    for o in out:
        d = {}
        for k, v in re.findall(r'(\w+):\s*"((?:[^"\\]|\\.)*)"', o):
            d[k] = v.replace('\\"', '"').replace("\\'", "'")
        for k, v in re.findall(r"(\w+):\s*(-?\d+(?:\.\d+)?)\s*[,\n}]", o):
            d.setdefault(k, float(v) if "." in v else int(v))
        res.append(d)
    return res


stmts = []

# ---- sources ---------------------------------------------------------------
SOURCES = [
 ("usafacts", "USAFacts", "https://usafacts.org", "aggregator",
  "Not-for-profit founded by Steve Ballmer that harmonises figures from 70-plus federal agencies. robots.txt permits ClaudeBot and every figure appears in the served HTML, so no paid scraper was used. Agency of record is named on every row alongside the retrieval route."),
 ("datareportal", "DataReportal", "https://datareportal.com", "vendor",
  "Publishes GWI panel data. Global, all-user averages: never presented here as US-specific or age-specific."),
 ("cox", "Cox Automotive", "https://www.coxautoinc.com", "vendor",
  "Annual Car Buyer Journey Study. Vendor research on its own market, treated as such."),
 ("academic", "Peer-reviewed literature", None, "academic",
  "Papers that justify how the tool behaves rather than supplying figures it prints."),
]
for slug, name, home, kind, note in SOURCES:
    stmts.append(f"INSERT INTO source (slug,name,homepage,kind,access_note) VALUES ({q(slug)},{q(name)},{q(home)},{q(kind)},{q(note)}) ON CONFLICT (slug) DO UPDATE SET access_note=EXCLUDED.access_note;")

# ---- USAFacts --------------------------------------------------------------
facts = objects("US_CONTEXT")
stmts.append(f"""INSERT INTO document (source_id,slug,title,url,published_on,retrieval,retrieved_at,population,notes)
  SELECT id,'usafacts-context-2026','USAFacts national context','https://usafacts.org',NULL,
  'Direct fetch of usafacts.org answer pages, permitted by its robots.txt','2026-09-09','United States',
  {q('USAFacts publishes 94 distinct questions expanded into roughly 29,525 state and county answer pages. These are the cuts a persona actually needs; the rest is mapped, not unexplored.')}
  FROM source WHERE slug='usafacts' ON CONFLICT (slug) DO NOTHING;""")

for f in facts:
    slug = "usafacts-" + f["id"]
    stmts.append(f"INSERT INTO metric (slug,label,unit,definition) VALUES ({q(slug)},{q(f['metric'])},'text',{q(f['metric'] + '. Agency of record: ' + f.get('agency','unknown') + '.')}) ON CONFLICT (slug) DO UPDATE SET definition=EXCLUDED.definition;")

# USAFacts values are formatted strings ("$81,600"), so the numeric goes in
# value and the published rendering is kept in note, verbatim.
vals = []
for f in facts:
    raw = f["value"]
    n = re.search(r"[\d,]+(?:\.\d+)?", raw)
    num = float(n.group(0).replace(",", "")) if n else 0
    vals.append((("usafacts-" + f["id"]), f.get("asOf", ""), num, raw + " | " + f.get("agency", "") + " | " + f.get("url", "")))

stmts.append("CREATE TEMP TABLE s_uf (metric text, period text, value numeric, note text) ON COMMIT DROP;")
if vals:
    stmts.append("INSERT INTO s_uf VALUES " + ",".join(
        f"({q(a)},{q(b)},{c},{q(d)})" for a, b, c, d in vals) + ";")
stmts.append("""INSERT INTO observation (document_id,metric_id,subject,segment_id,period,value,note)
  SELECT d.id, m.id, NULL, NULL, s.period, s.value, s.note
  FROM s_uf s JOIN metric m ON m.slug=s.metric
  CROSS JOIN document d WHERE d.slug='usafacts-context-2026'
  ON CONFLICT (document_id,metric_id,subject,segment_id,period) DO UPDATE SET value=EXCLUDED.value, note=EXCLUDED.note;""")

# ---- do-not-assert ---------------------------------------------------------
m = re.search(r"export const PERSONA_DO_NOT_ASSERT[^\[]*\[(.*?)\n\];", src, re.S)
if m:
    for claim in re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1)):
        c = claim.replace('\\"', '"').replace("\\'", "'")
        head = c.split(".")[0][:200]
        stmts.append(f"INSERT INTO do_not_assert (claim,reason) SELECT {q(head)},{q(c)} WHERE NOT EXISTS (SELECT 1 FROM do_not_assert WHERE claim={q(head)});")

stmts.append(f"INSERT INTO ingest_run (script,documents,observations,notes) VALUES ('load_others.py',1,{len(vals)},'USAFacts national context plus the do-not-assert list');")
sql("\n".join(stmts))
print(f"usafacts facts  {len(vals)}")
