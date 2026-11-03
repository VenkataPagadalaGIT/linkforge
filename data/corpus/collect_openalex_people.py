#!/usr/bin/env python3
"""
People with a public research footprint: every author whose affiliation on a
paper is the company's OpenAlex institution, from the OpenAlex API (free, open
scholarly metadata, CC0). One row per author: their papers with the company,
first and latest year, most recent titles, ORCID when present. Institutions are
matched by exact OpenAlex id (ontology/openalex_institutions.json), never by
name: "Anthropic" also names an Italian marine research institute.

Each author gets a tier: confirmed (a paper matches a research page the company
published on its own site), likely (two or more papers outside self-publishing
hosts), unverified (the rest), or model (the AI itself listed as an author).
Only confirmed and likely authors are shown on the site.

Run: python3 collect_openalex_people.py [--only entity]
"""
import collections, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
INST = json.load(open(os.path.join(HERE, "ontology", "openalex_institutions.json"), encoding="utf8"))["institutions"]
UA = "mono-mind-ai-graph (research footprint; contact via venkatapagadala.com)"


def get(url):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as r:
                return json.loads(r.read())
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            if attempt == 4:
                raise
            time.sleep(10 * (attempt + 1))


# Not people: the model itself listed as an author ("Claude", "Claude Opus 4.6 (Anthropic)").
MODEL = re.compile(r"\b(claude|sonnet|opus|haiku)\b|anthropic|\bAI collaborator\b", re.I)
# Self-publishing hosts by DOI prefix (Zenodo, OSF, figshare, Preprints.org, SSRN, ResearchGate, Qeios): anyone can post there,
# so a paper there alone does not confirm an affiliation.
FRINGE = re.compile(r"10\.(5281|31219|6084|20944|2139|13140|32388)/", re.I)


def norm(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def lit(v):
    return "NULL" if v is None else ("'" + str(v).replace("'", "''") + "'")


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    for inst in INST:
        if only and inst["entity"] != only:
            continue
        iid = inst["openalex"].rsplit("/", 1)[-1]
        authors = {}
        # Page numbers, not cursors: without an API key OpenAlex allows page= paging (to 10,000 results) but not cursor paging.
        works_n, page = 0, 1
        while True:
            q = urllib.parse.urlencode({"filter": f"authorships.institutions.lineage:{iid}", "per-page": 200, "page": page,
                                        "select": "id,doi,title,publication_date,authorships,primary_location"})
            d = get("https://api.openalex.org/works?" + q)
            for w in d.get("results", []):
                works_n += 1
                for a in w.get("authorships", []):
                    if not any((i.get("id") or "").endswith(iid) for i in a.get("institutions", [])):
                        continue
                    au = a.get("author") or {}
                    if not au.get("id"):
                        continue
                    r = authors.setdefault(au["id"], {"name": au.get("display_name"), "orcid": au.get("orcid"), "works": []})
                    url = w.get("doi") or ((w.get("primary_location") or {}).get("landing_page_url")) or w["id"]
                    r["works"].append({"title": w.get("title"), "date": w.get("publication_date"), "url": url})
            if len(d.get("results", [])) < 200:
                break
            page += 1
            time.sleep(0.5)
        ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(inst['entity'])})"
        # Confirmation: a paper whose title matches a research page the company published on its own site.
        own = {norm(t[0]) for t in query(f"SELECT title FROM ontology.site_page WHERE entity_id={ent} AND section='research' AND title IS NOT NULL")}
        st = [f"DELETE FROM ontology.footprint WHERE source='openalex' AND entity_id={ent};"]
        tiers = collections.Counter()
        for aid, r in authors.items():
            ws = sorted(r["works"], key=lambda w: w["date"] or "", reverse=True)
            years = sorted({(w["date"] or "")[:4] for w in ws if w["date"]})
            matched = [w["title"] for w in ws if w["title"] and norm(w["title"]) in own]
            scholarly = [w for w in ws if not FRINGE.search(w["url"] or "")]
            tier = ("model" if MODEL.search(r["name"] or "") else "confirmed" if matched else "likely" if len(scholarly) >= 2 else "unverified")
            tiers[tier] += 1
            detail = {"works": len(ws), "years": [years[0], years[-1]] if years else None, "recent": ws[:3], "orcid": r["orcid"],
                      "tier": tier, "matched": matched[:5], "scholarly": len(scholarly)}
            st.append("INSERT INTO ontology.footprint (entity_id, source, source_id, name, headline, profile_url, evidence_url, first_seen, last_seen, is_current, detail)"
                      f" VALUES ({ent}, 'openalex', {lit(aid.rsplit('/', 1)[-1])}, {lit(r['name'])}, {lit(f'{len(ws)} paper' + ('s' if len(ws) != 1 else '') + ' with this affiliation')},"
                      f" {lit(aid)}, {lit(ws[0]['url'])}, {lit(ws[-1]['date'])}, {lit(ws[0]['date'])}, NULL, {lit(json.dumps(detail, ensure_ascii=False))}::jsonb);")
        sql("\n".join(st), timeout=300)
        print(f"{inst['entity']}: {works_n} works, {len(authors)} authors with the {iid} affiliation; " + ", ".join(f"{k} {v}" for k, v in tiers.most_common()))


if __name__ == "__main__":
    main()
