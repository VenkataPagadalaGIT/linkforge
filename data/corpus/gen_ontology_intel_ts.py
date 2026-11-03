#!/usr/bin/env python3
"""
Generate src/data/aiIntel.ts: the company-file layer of the AI Systems Map.

For every entity with verified data in the ontology schema, it writes the
deals (with the filing's own qualifier and quoted evidence), measured series,
people in public roles, dated events, forecasts and implications, and links
to the entity's other pages on the site. Forecasts and implications carry
their approval flag; the page shows drafts only when NEXT_PUBLIC_SHOW_DRAFTS=1.

Run: python3 gen_ontology_intel_ts.py [--check]
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import CONTAINER, DB, USER

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "..", "..", "src", "data", "aiIntel.ts")
MONEY = {"equity", "convertible_note", "warrant", "debt", "grant", "guarantee", "acquisition"}
BUYER_OUT = {"depends_on", "customer_of", "uses", "sources"}       # from = buyer
BUYER_IN = {"supplies", "leases_to", "hosts", "licenses", "used_by"}  # to = buyer


def rows(q):
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                        "SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)::text FROM (" + q + ") t"],
                       capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit("QUERY FAILED:\n" + p.stderr[-2000:])
    return json.loads(p.stdout.strip() or "[]")


ev = rows("""
  SELECT e.target_kind, e.target_id, e.quote, e.url, e.locator, d.title, d.published_on, d.slug AS doc, s.kind AS source_kind, s.name AS publisher
  FROM ontology.evidence e LEFT JOIN document d ON d.id = e.document_id LEFT JOIN source s ON s.id = d.source_id
  ORDER BY e.id""")
by_target = {}
for e in ev:
    by_target.setdefault((e["target_kind"], e["target_id"]), []).append(e)


def evid(kind, tid):
    return [{"quote": e["quote"], "url": e["url"], "locator": e["locator"], "source": e["title"] or "", "publisher": e["publisher"],
             "publishedOn": e["published_on"], "secondary": e["source_kind"] == "aggregator"}
            for e in by_target.get((kind, tid), [])]


deals = rows("""
  SELECT dl.id, f.slug AS from_slug, f.name AS from_name, t.slug AS to_slug, t.name AS to_name, r.relation,
         dl.instrument, dl.stage, dl.amount, dl.amount_high, dl.amount_qualifier, dl.currency, dl.amount_basis,
         dl.announced_on, dl.term_start, dl.term_end, dl.money_direction, dl.summary
  FROM ontology.deal dl JOIN ontology.relation r ON r.id = dl.relation_id
  JOIN ontology.entity f ON f.id = r.from_id JOIN ontology.entity t ON t.id = r.to_id
  WHERE dl.stage NOT IN ('superseded','terminated')
  ORDER BY dl.amount DESC NULLS LAST, dl.id""")
series = rows("""
  SELECT n.slug, s.id, s.metric, s.label, s.unit, s.period, s.as_of, s.value, s.url
  FROM ontology.signal s JOIN ontology.entity n ON n.id = s.entity_id
  ORDER BY n.slug, s.metric, s.as_of NULLS LAST, s.period""")
people = rows("""
  SELECT n.slug AS entity, p.name, p.public_role, p.site_path, p.source_url
  FROM ontology.person p JOIN ontology.entity n ON n.id = p.entity_id
  WHERE p.verification = 'verified' ORDER BY n.slug, p.sort_order NULLS LAST, p.name""")
events = rows("""
  SELECT n.slug AS entity, e.occurred_on, e.date_label, e.kind, e.headline, e.url
  FROM ontology.event e JOIN ontology.event_entity ee ON ee.event_id = e.id JOIN ontology.entity n ON n.id = ee.entity_id
  ORDER BY n.slug, e.occurred_on, e.id""")
forecasts = rows("""
  SELECT n.slug AS entity, p.statement, p.basis, p.made_on, p.resolves_on, p.outcome, p.approved
  FROM ontology.prediction p JOIN ontology.entity n ON n.id = p.entity_id ORDER BY n.slug, p.resolves_on, p.id""")
implications = rows("""
  SELECT n.slug AS entity, i.audience, i.headline, i.body, i.approved
  FROM ontology.implication i JOIN ontology.entity n ON n.id = i.entity_id ORDER BY n.slug, i.sort_order NULLS LAST, i.id""")
segments = rows("""
  SELECT metric, label, measure, estimator, scope, sort_order FROM ontology.share_segment ORDER BY sort_order NULLS LAST, metric""")
share_rows = rows("""
  SELECT e.slug AS entity, e.name, s.id, s.metric, s.period, s.as_of, s.value, d.title AS doc_title, d.url AS doc_url, d.published_on
  FROM ontology.signal s JOIN ontology.entity e ON e.id = s.entity_id LEFT JOIN document d ON d.id = s.document_id
  WHERE s.metric LIKE 'share\\_%'
  ORDER BY s.metric, s.as_of DESC NULLS LAST, s.value DESC""")
pages = rows("""
  SELECT n.slug AS entity, p.kind, p.path, p.label FROM ontology.entity_page p JOIN ontology.entity n ON n.id = p.entity_id
  ORDER BY n.slug, p.kind, p.path""")
posts = rows("""
  SELECT n.slug AS entity, p.platform, p.url, p.title, p.author, p.published_on, p.retrieval, p.summary
  FROM ontology.post p JOIN ontology.entity n ON n.id = p.entity_id
  WHERE p.platform <> 'hackernews'  -- public discussion lives in the 360 file, not with official channels
  ORDER BY n.slug, p.published_on DESC NULLS LAST, p.id DESC""")

intel = {}


def bucket(slug):
    return intel.setdefault(slug, {"deals": [], "series": [], "people": [], "events": [], "forecasts": [],
                                   "implications": [], "pages": [], "posts": [], "sources": {}})


def note_sources(slug, evs):
    b = bucket(slug)
    for e in evs:
        key = e["url"].split("#")[0] if e["url"] else e["source"]
        s = b["sources"].setdefault(key, {"title": e["source"], "url": key, "publishedOn": e["publishedOn"], "secondary": e["secondary"], "quotes": 0})
        s["quotes"] += 1


for d in deals:
    evs = evid("deal", d["id"])
    for me, other, other_name in ((d["from_slug"], d["to_slug"], d["to_name"]), (d["to_slug"], d["from_slug"], d["from_name"])):
        is_from = me == d["from_slug"]
        if d["instrument"] in MONEY:
            gets = (d["money_direction"] == "from_to" and not is_from) or (d["money_direction"] == "to_from" and is_from)
            side = "receives" if gets else "provides"
        else:
            buyer = (is_from and d["relation"] in BUYER_OUT) or ((not is_from) and d["relation"] in BUYER_IN)
            side = "buys" if buyer else "sells"
        bucket(me)["deals"].append({
            "id": d["id"], "counterparty": other, "counterpartyName": other_name, "side": side, "relation": d["relation"],
            "instrument": d["instrument"], "stage": d["stage"], "amount": d["amount"], "amountHigh": d["amount_high"],
            "qualifier": d["amount_qualifier"], "currency": d["currency"], "basis": d["amount_basis"],
            "announcedOn": d["announced_on"], "termStart": d["term_start"], "termEnd": d["term_end"],
            "summary": d["summary"], "evidence": evs})
        note_sources(me, evs)

for s in series:
    b = bucket(s["slug"])
    if not b["series"] or b["series"][-1]["metric"] != s["metric"]:
        b["series"].append({"metric": s["metric"], "label": s["label"] or s["metric"], "unit": s["unit"], "points": []})
    evs = evid("signal", s["id"])
    b["series"][-1]["points"].append({"period": s["period"], "asOf": s["as_of"], "value": float(s["value"]), "url": s["url"],
                                      "quote": evs[0]["quote"] if evs else None})
    note_sources(s["slug"], evs)

for p in people:
    bucket(p["entity"])["people"].append({"name": p["name"], "role": p["public_role"], "sitePath": p["site_path"], "sourceUrl": p["source_url"]})
for e in events:
    bucket(e["entity"])["events"].append({"date": e["occurred_on"], "dateLabel": e["date_label"], "kind": e["kind"], "headline": e["headline"], "url": e["url"]})
for f in forecasts:
    bucket(f["entity"])["forecasts"].append({"statement": f["statement"], "basis": f["basis"], "madeOn": f["made_on"], "resolvesOn": f["resolves_on"],
                                             "outcome": f["outcome"], "approved": f["approved"]})
for i in implications:
    bucket(i["entity"])["implications"].append({"audience": i["audience"], "headline": i["headline"], "body": i["body"], "approved": i["approved"]})
for p in pages:
    bucket(p["entity"])["pages"].append({"kind": p["kind"], "path": p["path"], "label": p["label"]})
import re as _re


def plain(md):
    """Release notes are markdown: keep the words, drop the markup and links."""
    t = _re.sub(r"<!--.*?-->", " ", md or "", flags=_re.S)
    t = _re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = _re.sub(r"https?://\S+", "", t)
    t = _re.sub(r"[#*`>_]+", " ", t)
    return _re.sub(r"\s+", " ", t).strip()


for p in posts:
    b = bucket(p["entity"])
    if len(b["posts"]) < 12:
        b["posts"].append({"platform": p["platform"], "url": p["url"], "title": p["title"], "author": p["author"], "publishedOn": p["published_on"],
                           "retrieval": p["retrieval"], "summary": plain(p["summary"])[:240]})

ents = rows("SELECT n.slug, n.id FROM ontology.entity n")
for n in ents:
    if n["slug"] in intel:
        note_sources(n["slug"], evid("entity", n["id"]))

out = {}
for slug in sorted(intel):
    b = intel[slug]
    b["sources"] = sorted(b["sources"].values(), key=lambda s: (s["secondary"], -s["quotes"]))
    dates = [s["publishedOn"] for s in b["sources"] if s["publishedOn"]]
    b["asOf"] = max(dates) if dates else None
    out[slug] = b

HEADER = """// AUTO-GENERATED by data/corpus/gen_ontology_intel_ts.py from the ontology schema in research_corpus.
// The company-file layer of the AI Systems Map. Do not edit by hand.

export interface IntelEvidence { quote: string; url: string | null; locator: string | null; source: string; publisher: string | null; publishedOn: string | null; secondary: boolean }
export interface IntelDeal {
  id: number; counterparty: string; counterpartyName: string;
  /** Which way the deal runs for this entity. */
  side: "buys" | "sells" | "receives" | "provides";
  relation: string; instrument: string; stage: string;
  amount: number | null; amountHigh: number | null; qualifier: string | null; currency: string | null; basis: string | null;
  announcedOn: string | null; termStart: string | null; termEnd: string | null; summary: string; evidence: IntelEvidence[];
}
export interface IntelPoint { period: string; asOf: string | null; value: number; url: string | null; quote: string | null }
export interface IntelSeries { metric: string; label: string; unit: string | null; points: IntelPoint[] }
export interface IntelPerson { name: string; role: string; sitePath: string | null; sourceUrl: string }
export interface IntelEvent { date: string; dateLabel: string | null; kind: string; headline: string; url: string | null }
export interface IntelForecast { statement: string; basis: string; madeOn: string; resolvesOn: string; outcome: string; approved: boolean }
export interface IntelImplication { audience: string; headline: string; body: string; approved: boolean }
export interface IntelPage { kind: string; path: string; label: string }
export interface IntelPost { platform: string; url: string; title: string | null; author: string | null; publishedOn: string | null; retrieval: string; summary: string }
export interface IntelSource { title: string; url: string; publishedOn: string | null; secondary: boolean; quotes: number }
export interface EntityIntel {
  asOf: string | null; deals: IntelDeal[]; series: IntelSeries[]; people: IntelPerson[]; events: IntelEvent[];
  forecasts: IntelForecast[]; implications: IntelImplication[]; pages: IntelPage[]; posts: IntelPost[]; sources: IntelSource[];
}

"""
deal_edges = [{"from": d["from_slug"], "to": d["to_slug"], "relation": d["relation"], "instrument": d["instrument"], "stage": d["stage"],
               "amount": d["amount"], "amountHigh": d["amount_high"], "qualifier": d["amount_qualifier"], "basis": d["amount_basis"],
               "termStart": d["term_start"], "termEnd": d["term_end"], "moneyDirection": d["money_direction"], "summary": d["summary"]} for d in deals]
# Market share segments: the latest period's rows, each with its quote, and the earlier periods as history.
shares = []
for seg in segments:
    rs = [r for r in share_rows if r["metric"] == seg["metric"]]
    if not rs:
        continue
    latest = max((r["as_of"] or "") for r in rs)
    current = [r for r in rs if (r["as_of"] or "") == latest]
    out_rows = []
    for r in sorted(current, key=lambda x: -float(x["value"])):
        ev = evid("signal", r["id"])
        hist = [{"period": h["period"], "value": float(h["value"])} for h in rs if h["entity"] == r["entity"] and h["id"] != r["id"]]
        out_rows.append({"entity": r["entity"], "name": r["name"], "value": float(r["value"]), "period": r["period"], "asOf": r["as_of"],
                         "quote": ev[0]["quote"] if ev else None, "locator": ev[0]["locator"] if ev else None, "history": hist})
    src = current[0]
    shares.append({"metric": seg["metric"], "label": seg["label"], "measure": seg["measure"], "estimator": seg["estimator"], "scope": seg["scope"],
                   "period": src["period"], "source": {"title": src["doc_title"], "url": src["doc_url"], "publishedOn": src["published_on"]}, "rows": out_rows})

body = "/** Every deal as a link between two entities, for the graph's money view. */\n" \
       "export interface IntelDealEdge { from: string; to: string; relation: string; instrument: string; stage: string; amount: number | null; amountHigh: number | null; qualifier: string | null; basis: string | null; termStart: string | null; termEnd: string | null; moneyDirection: 'from_to' | 'to_from' | null; summary: string }\n" \
       "export const AI_DEAL_EDGES: IntelDealEdge[] = " + json.dumps(deal_edges, ensure_ascii=False, indent=1) + ";\n\n" \
       "export const AI_INTEL: Record<string, EntityIntel> = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n\n" \
       "export const intelFor = (id: string): EntityIntel | undefined => AI_INTEL[id];\n\n" \
       "/** Market shares by segment: each share with its estimator, period and the exact sentence it comes from. */\n" \
       "export interface ShareRow { entity: string; name: string; value: number; period: string; asOf: string | null; quote: string | null; locator: string | null; history: { period: string; value: number }[] }\n" \
       "export interface ShareSegment { metric: string; label: string; measure: string; estimator: string; scope: string; period: string; source: { title: string; url: string; publishedOn: string | null }; rows: ShareRow[] }\n" \
       "export const AI_SHARES: ShareSegment[] = " + json.dumps(shares, ensure_ascii=False, indent=1) + ";\n"
text = HEADER + body
if "--check" in sys.argv:
    cur = open(DEST, encoding="utf8").read() if os.path.exists(DEST) else ""
    print("entities", len(out), "up-to-date" if cur == text else "STALE")
    sys.exit(0 if cur == text else 1)
open(DEST, "w", encoding="utf8").write(text)
print(f"wrote {DEST}: {len(out)} entities: " + ", ".join(f"{k}({len(v['deals'])}d,{len(v['series'])}s,{len(v['people'])}p)" for k, v in out.items()))
