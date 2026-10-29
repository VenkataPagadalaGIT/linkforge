#!/usr/bin/env python3
"""
Generate src/data/aiFreshness.ts: when every part of each company's file was pulled.

One row per source per entity: what the source is, which sections of the file it
feeds, the date of the data itself (a filing's date, the newest posting), when it
was last pulled (the exact time when the pull ran through run_pipelines.py, which
logs every run in ontology.pipeline_run; otherwise the day stored with the rows),
how often it should be pulled, and the pipeline that pulls it again.

Sources read by hand (filings, newsroom pages) have no pipeline: they are re-read
when a new document is filed. Paid sources say so, and only run with the owner's yes.

Run: python3 gen_freshness_ts.py [--check]
"""
import collections, json, os, subprocess, sys
from urllib.parse import urlparse
sys.path.insert(0, os.path.dirname(__file__))
from db import CONTAINER, DB, USER

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "..", "..", "src", "data", "aiFreshness.ts")
PIPES = {p["id"]: p for p in json.load(open(os.path.join(HERE, "ontology", "pipelines.json"), encoding="utf8"))["pipelines"]}
MAX_DOCS = 6  # documents listed one by one per entity; the rest are grouped by site


def rows(q):
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                        "SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)::text FROM (" + q + ") t"], capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit("QUERY FAILED:\n" + p.stderr[-2000:])
    return json.loads(p.stdout.strip() or "[]")


slug = {r["id"]: r["slug"] for r in rows("SELECT id, slug FROM ontology.entity")}
runs = {r["pipeline"]: r for r in rows("""
  SELECT DISTINCT ON (pipeline) pipeline, started_at, finished_at, status FROM ontology.pipeline_run
  WHERE status IN ('ok', 'partial') AND finished_at IS NOT NULL ORDER BY pipeline, finished_at DESC""")}
last_any = {r["pipeline"]: r for r in rows("""
  SELECT DISTINCT ON (pipeline) pipeline, started_at, finished_at, status FROM ontology.pipeline_run ORDER BY pipeline, started_at DESC""")}
out = collections.defaultdict(list)


def stamp(pipeline, day):
    """(pulledAt, pulledOn): the exact time of the last good run when it is the pull behind these rows, else the stored day."""
    r = runs.get(pipeline) if pipeline else None
    if r and (day is None or r["finished_at"][:10] >= day):
        return r["finished_at"], None
    return None, day


def add(ent, sid, label, detail, sections, data_as_of, pulled_at, pulled_on, pipeline, cost, url=None):
    if ent is None or ent not in slug:
        return
    p = PIPES.get(pipeline) if pipeline else None
    out[slug[ent]].append({"id": sid, "label": label, "detail": detail, "sections": sections, "dataAsOf": data_as_of,
                           "pulledAt": pulled_at, "pulledOn": pulled_on, "cadenceH": p["cadence_h"] if p else None,
                           "pipeline": pipeline, "cost": cost, "url": url})


# 1) The documents behind the file's quoted figures (filings, newsroom pages), by what they back.
KIND_SECTIONS = {"funding_round": ["investors"], "affiliation": ["people"], "person": ["people"], "engagement": ["investors"],
                 "deal": ["money"], "legal_case": ["legal"], "agreement": ["investors"], "fact": ["overview", "f360"], "entity": ["overview"]}
ev = rows("""
  SELECT e.target_kind AS kind, COALESCE(d.url, e.url) AS url, d.title, d.published_on, e.retrieved_at,
    CASE e.target_kind
      WHEN 'signal' THEN (SELECT entity_id FROM ontology.signal WHERE id = e.target_id)
      WHEN 'funding_round' THEN (SELECT entity_id FROM ontology.funding_round WHERE id = e.target_id)
      WHEN 'person' THEN (SELECT entity_id FROM ontology.person WHERE id = e.target_id)
      WHEN 'affiliation' THEN (SELECT p.entity_id FROM ontology.affiliation a JOIN ontology.person p ON p.id = a.person_id WHERE a.id = e.target_id)
      WHEN 'engagement' THEN (SELECT entity_id FROM ontology.engagement WHERE id = e.target_id)
      WHEN 'legal_case' THEN (SELECT entity_id FROM ontology.legal_case WHERE id = e.target_id)
      WHEN 'agreement' THEN (SELECT entity_id FROM ontology.agreement WHERE id = e.target_id)
      WHEN 'fact' THEN (SELECT entity_id FROM ontology.fact WHERE id = e.target_id)
      WHEN 'entity' THEN e.target_id
    END AS entity_id,
    CASE WHEN e.target_kind = 'signal' THEN (SELECT metric FROM ontology.signal WHERE id = e.target_id)
         WHEN e.target_kind = 'fact' THEN (SELECT key FROM ontology.fact WHERE id = e.target_id) END AS metric,
    CASE WHEN e.target_kind = 'deal' THEN (SELECT jsonb_build_array(r.from_id, r.to_id) FROM ontology.deal dl JOIN ontology.relation r ON r.id = dl.relation_id WHERE dl.id = e.target_id) END AS deal_ends
  FROM ontology.evidence e LEFT JOIN document d ON d.id = e.document_id
  WHERE COALESCE(d.url, e.url) IS NOT NULL""")
docs = collections.defaultdict(lambda: {"sections": set(), "quotes": 0, "title": None, "published": None, "retrieved": None})
for e in ev:
    ents = e["deal_ends"] or [e["entity_id"]]
    if e["kind"] == "signal":
        secs = ["share"] if (e["metric"] or "").startswith("share_") else ["financials", "overview"]
    elif e["kind"] == "fact" and (e["metric"] or "").startswith("ipo_"):
        secs = ["ipo"]
    else:
        secs = KIND_SECTIONS.get(e["kind"], ["overview"])
    for ent in ents:
        d = docs[(ent, e["url"])]
        d["sections"].update(secs)
        d["quotes"] += 1
        d["title"] = d["title"] or e["title"]
        d["published"] = max(filter(None, [d["published"], e["published_on"]]), default=None)
        d["retrieved"] = max(filter(None, [d["retrieved"], e["retrieved_at"]]), default=None)
by_ent = collections.defaultdict(list)
for (ent, url), d in docs.items():
    by_ent[ent].append((url, d))
for ent, items in by_ent.items():
    items.sort(key=lambda x: (-x[1]["quotes"], x[0]))
    for url, d in items[:MAX_DOCS]:
        host = urlparse(url).netloc.replace("www.", "")
        add(ent, "doc:" + url, d["title"] or host, f"{d['quotes']} quoted {'passage' if d['quotes'] == 1 else 'passages'} · {host}",
            sorted(d["sections"]), d["published"], None, d["retrieved"], None, "manual", url)
    rest = collections.defaultdict(list)
    for url, d in items[MAX_DOCS:]:
        rest[urlparse(url).netloc.replace("www.", "")].append(d)
    for host, ds in sorted(rest.items()):
        add(ent, "docs:" + host, f"{len(ds)} more pages on {host}", f"{sum(x['quotes'] for x in ds)} quoted passages",
            sorted(set().union(*(x["sections"] for x in ds))), max(filter(None, (x["published"] for x in ds)), default=None),
            None, max(filter(None, (x["retrieved"] for x in ds)), default=None), None, "manual", None)

# 2) Public job boards.
for r in rows("""
  SELECT b.entity_id, b.board, b.careers_url, count(p.id) FILTER (WHERE p.closed_on IS NULL) AS open, max(p.last_seen) AS last_seen, max(p.published_on) AS newest
  FROM ontology.job_board b LEFT JOIN ontology.job_posting p ON p.entity_id = b.entity_id AND p.board = b.board
  GROUP BY 1, 2, 3"""):
    at, on = stamp("jobs", r["last_seen"])
    add(r["entity_id"], "jobs:" + r["board"], f"{r['board'].split(':')[0].title()} job board", f"{r['open']:,} open roles",
        ["people"], r["newest"], at, on, "jobs", "free", r["careers_url"])

# 3) The company's own websites (and the people named as authors there).
for r in rows("SELECT entity_id, count(*) AS pages, count(DISTINCT host) AS hosts, max(retrieved_at) AS day, max(published_on) FILTER (WHERE published_on <= retrieved_at) AS newest FROM ontology.site_page GROUP BY 1"):
    at, on = stamp("site", r["day"])
    add(r["entity_id"], "site", "Its own websites", f"{r['pages']:,} pages on {r['hosts']} {'site' if r['hosts'] == 1 else 'sites'}",
        ["f360", "news", "customers"], r["newest"], at, on, "site", "free")

# 4) Public attention and news tone.
att = rows("SELECT entity_id, sum(items) AS items, max(retrieved_at) AS day, max(month) AS newest FROM ontology.attention GROUP BY 1")
tone = {r["entity_id"]: r for r in rows("SELECT entity_id, count(*) AS days, max(retrieved_at) AS day, max(day) AS newest FROM ontology.tone GROUP BY 1")}
for r in att:
    at, on = stamp("attention", r["day"])
    # Attention is counted by month, so the data runs to the pull itself rather than to the first day of a month.
    add(r["entity_id"], "attention", "Hacker News", f"{r['items']:,} stories naming it", ["f360"], None, at, on, "attention", "free")
    t = tone.get(r["entity_id"])
    if t:
        at, on = stamp("tone", t["day"])
        add(r["entity_id"], "tone", "GDELT news tone", f"{t['days']} days", ["f360"], t["newest"], at, on, "tone", "free")
    else:
        g = last_any.get("tone")
        add(r["entity_id"], "tone", "GDELT news tone", "not collected yet: GDELT refused every request" + (f" (last try {g['started_at'][:10]})" if g else ""),
            ["f360"], None, None, None, "tone", "free")

# 5) People with a public footprint.
captured = {r["tag"]: r["at"] for r in rows("SELECT tag, max(captured_at) AS at FROM ontology.raw_capture GROUP BY 1")}
for r in rows("SELECT entity_id, source, count(*) AS n, max(retrieved_at) AS day FROM ontology.footprint GROUP BY 1, 2"):
    if r["source"] == "linkedin":
        add(r["entity_id"], "linkedin", "LinkedIn profiles (Bright Data dataset)", f"{r['n']:,} profiles naming it as employer", ["people"],
            None, captured.get("linkedin-filter"), None if captured.get("linkedin-filter") else r["day"], "linkedin", "paid")
    elif r["source"] == "openalex":
        at, on = stamp("research_people", r["day"])
        add(r["entity_id"], "openalex", "OpenAlex research papers", f"{r['n']:,} authors read", ["people"], None, at, on, "research_people", "free")
    elif r["source"] == "company_site":
        at, on = stamp("site", r["day"])
        add(r["entity_id"], "bylines", "Bylines on its own sites", f"{r['n']:,} people named as authors", ["people"], None, at, on, "site", "free")

# 6) Posts from official channels, and Reddit.
for r in rows("SELECT entity_id, platform, count(*) AS n, max(retrieved_at) AS at, max(published_on) AS newest FROM ontology.post WHERE platform IN ('github', 'reddit') GROUP BY 1, 2"):
    if r["platform"] == "github":
        add(r["entity_id"], "github", "GitHub releases", f"{r['n']} release notes", ["people"], r["newest"], r["at"], None, "github_releases", "free")
    else:
        add(r["entity_id"], "reddit", "Reddit posts (Bright Data)", f"{r['n']} posts", ["f360"], r["newest"], r["at"], None, "reddit", "paid")

# 7) SEC filings (EDGAR's company filing index, read in the browser; a pull needs the SEC contact string).
for r in rows("SELECT entity_id, count(*) AS n, max(retrieved_at) AS day, max(filed_on) AS newest FROM ontology.filing GROUP BY 1"):
    add(r["entity_id"], "edgar", "SEC EDGAR filing index", f"{r['n']} filings", ["ipo"], r["newest"], None, r["day"], None, "manual",
        None)

# 8) Government records: federal awards and lobbying disclosures.
for r in rows("SELECT entity_id, count(*) AS n, sum(amount) AS total, max(retrieved_at) AS day, max(start_date) AS newest FROM ontology.gov_award GROUP BY 1"):
    at, on = stamp("gov", r["day"])
    add(r["entity_id"], "usaspending", "USAspending.gov federal awards", f"{r['n']} awards", ["gov"], r["newest"], at, on, "gov", "free", "https://www.usaspending.gov/")
for r in rows("SELECT entity_id, count(*) AS n, max(retrieved_at) AS day, max(posted_at)::date AS newest FROM ontology.lobbying_filing GROUP BY 1"):
    at, on = stamp("gov", r["day"])
    add(r["entity_id"], "lda", "Senate lobbying disclosures (LDA)", f"{r['n']} filings", ["gov"], r["newest"], at, on, "gov", "free", "https://lda.senate.gov/")

# 9) Market quotes for listed companies.
for r in rows("SELECT entity_id, max(day) AS day, max(retrieved_at) AS at FROM ontology.market_quote GROUP BY 1"):
    add(r["entity_id"], "market", "Market quote (Yahoo Finance, unofficial)", None, ["f360"], r["day"], r["at"], None, "market", "free")

for k in out:
    out[k].sort(key=lambda s: (s["cost"] == "manual", s["id"]))

pipes = []
for pid, p in PIPES.items():
    if pid in ("schema", "generate", "brand_gate"):
        continue
    ok, la = runs.get(pid), last_any.get(pid)
    pipes.append({"id": pid, "why": p.get("why"), "cadenceH": p["cadence_h"], "cost": p["cost"],
                  "lastOk": ok["finished_at"] if ok else None, "lastStatus": la["status"] if la else None, "lastRun": la["started_at"] if la else None})

text = (
    "// Generated by data/corpus/gen_freshness_ts.py from the research corpus. Do not edit by hand.\n"
    "// When each part of a company's file was pulled, from which source, and how often it should be pulled again.\n\n"
    'export type FreshCost = "free" | "paid" | "manual";\n'
    "export interface FreshSource {\n"
    "  id: string;\n  label: string;\n  detail: string | null;\n  /** File sections this source feeds (FileSectionId). */\n  sections: string[];\n"
    "  /** The data's own date: a filing's date, the newest posting or page. */\n  dataAsOf: string | null;\n"
    "  /** Exact time of the last pull, when it ran through run_pipelines.py. */\n  pulledAt: string | null;\n"
    "  /** The day of the last pull, when only the day is stored. */\n  pulledOn: string | null;\n"
    "  cadenceH: number | null;\n  pipeline: string | null;\n  cost: FreshCost;\n  url: string | null;\n}\n"
    "export interface PipelineState { id: string; why: string | null; cadenceH: number; cost: string; lastOk: string | null; lastStatus: string | null; lastRun: string | null }\n\n"
    "export const AI_FRESHNESS: Record<string, FreshSource[]> = " + json.dumps(dict(sorted(out.items())), ensure_ascii=False, indent=1) + ";\n\n"
    "export const AI_PIPELINES: PipelineState[] = " + json.dumps(pipes, ensure_ascii=False, indent=1) + ";\n\n"
    "export const freshnessOf = (id: string): FreshSource[] => AI_FRESHNESS[id] ?? [];\n"
)
if "--check" in sys.argv:
    cur = open(DEST, encoding="utf8").read() if os.path.exists(DEST) else ""
    print("aiFreshness.ts is current" if cur == text else "aiFreshness.ts is STALE: run gen_freshness_ts.py")
    sys.exit(0 if cur == text else 1)
open(DEST, "w", encoding="utf8").write(text)
print(f"wrote {DEST}: {len(out)} entities, {sum(len(v) for v in out.values())} sources, {len(pipes)} pipelines; "
      f"anthropic: {[s['id'] for s in out.get('anthropic', [])]}")
