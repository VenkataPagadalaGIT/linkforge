#!/usr/bin/env python3
"""
Government records per company, from free public APIs (no key):

  USAspending.gov   federal awards (contracts, IDVs, grants) where the company is the recipient
  Senate LDA        lobbying disclosure filings where the company is the client: its own
                    in-house reports (expenses) and outside firms' reports (income), with
                    issues, lobbyists and the government entities contacted

Companies and name rules: ontology/gov_queries.json. Every raw response is archived under
raw/gov/ before parsing. Rows are replaced per company on each run (a filing that is
amended keeps its uuid). Run: python3 collect_gov.py [--only anthropic]
"""
import datetime as dt, gzip, json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, "ontology", "gov_queries.json"), encoding="utf8"))["companies"]
RAW = os.path.join(HERE, "raw", "gov")
UA = "venkatapagadala.com research (ontology refresh)"
AWARD_GROUPS = {"contracts": ["A", "B", "C", "D"], "idvs": ["IDV_A", "IDV_B", "IDV_B_A", "IDV_B_B", "IDV_B_C", "IDV_C", "IDV_D", "IDV_E"], "grants": ["02", "03", "04", "05"]}


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(xs):
    return "ARRAY[" + ",".join(lit(x) for x in xs) + "]::text[]" if xs else "NULL"


def get_json(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"user-agent": UA, "accept": "application/json", **({"content-type": "application/json"} if body else {})})
    for attempt in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(int(e.headers.get("Retry-After") or 10 * (attempt + 1)))
                continue
            raise


def archive(slug, kind, data):
    os.makedirs(RAW, exist_ok=True)
    with gzip.open(os.path.join(RAW, f"{slug}-{kind}-{dt.date.today().isoformat()}.json.gz"), "wt", encoding="utf8") as f:
        json.dump(data, f)


def awards(slug, c):
    out, raw = [], {}
    for group, codes in AWARD_GROUPS.items():
        page, raw[group] = 1, []
        while True:
            body = {"filters": {"recipient_search_text": [c["usaspending"]], "award_type_codes": codes, "time_period": [{"start_date": "2007-10-01", "end_date": dt.date.today().isoformat()}]},
                    "fields": ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Awarding Sub Agency", "Start Date", "End Date", "Description", "generated_internal_id"],
                    "limit": 100, "page": page, "sort": "Award Amount", "order": "desc"}
            d = get_json("https://api.usaspending.gov/api/v2/search/spending_by_award/", body)
            raw[group].append(d)
            for r in d.get("results", []):
                if re.search(c["recipient_match"], r.get("Recipient Name") or "", re.I):
                    out.append((group, r))
            if not d.get("page_metadata", {}).get("hasNext"):
                break
            page += 1
            time.sleep(1)
    archive(slug, "usaspending", raw)
    return out


def lobbying(slug, c):
    url = "https://lda.senate.gov/api/v1/filings/?" + urllib.parse.urlencode({"client_name": c["lda"], "ordering": "-dt_posted", "page_size": 25})
    out, raw = [], []
    while url:
        d = get_json(url)
        raw.append(d)
        out += [f for f in d.get("results", []) if re.search(c["client_match"], (f.get("client") or {}).get("name") or "", re.I)]
        url = d.get("next")
        time.sleep(1.5)  # the anonymous LDA API allows a request every second or so
    archive(slug, "lda", raw)
    return out


def main():
    only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None
    for slug, c in CFG.items():
        if only and slug not in only:
            continue
        ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(slug)})"
        aw = awards(slug, c)
        lf = lobbying(slug, c)
        st = [f"DELETE FROM ontology.gov_award WHERE entity_id={ent};", f"DELETE FROM ontology.lobbying_filing WHERE entity_id={ent};"]
        for group, r in aw:
            gid = r.get("generated_internal_id")
            st.append("INSERT INTO ontology.gov_award (entity_id,award_id,recipient,agency,sub_agency,amount,start_date,end_date,award_type,description,url) VALUES"
                      f" ({ent},{lit(r.get('Award ID') or gid)},{lit(r.get('Recipient Name'))},{lit(r.get('Awarding Agency'))},{lit(r.get('Awarding Sub Agency'))},"
                      f"{lit(r.get('Award Amount'))},{lit(r.get('Start Date'))},{lit(r.get('End Date'))},{lit(group)},{lit(r.get('Description'))},"
                      f"{lit('https://www.usaspending.gov/award/' + gid if gid else None)}) ON CONFLICT (entity_id, award_id) DO NOTHING;")
        for f in lf:
            acts = f.get("lobbying_activities") or []
            issues = sorted({a.get("general_issue_code_display") for a in acts if a.get("general_issue_code_display")})
            people = sorted({" ".join(filter(None, [(l.get("lobbyist") or {}).get("first_name"), (l.get("lobbyist") or {}).get("last_name")])).title() for a in acts for l in a.get("lobbyists") or []} - {""})
            ents = sorted({g.get("name").title() for a in acts for g in a.get("government_entities") or [] if g.get("name")})
            desc = " | ".join(filter(None, (a.get("description") for a in acts)))[:4000]
            st.append("INSERT INTO ontology.lobbying_filing (entity_id,filing_uuid,filing_year,filing_period,filing_type,registrant,client,income,expenses,posted_at,issues,lobbyists,entities,description,url) VALUES"
                      f" ({ent},{lit(f['filing_uuid'])},{lit(f.get('filing_year'))},{lit(f.get('filing_period_display'))},{lit(f.get('filing_type_display'))},"
                      f"{lit((f.get('registrant') or {}).get('name'))},{lit((f.get('client') or {}).get('name'))},{lit(f.get('income'))},{lit(f.get('expenses'))},{lit(f.get('dt_posted'))},"
                      f"{arr(issues)},{arr(people)},{arr(ents)},{lit(desc)},{lit(f.get('filing_document_url'))}) ON CONFLICT (entity_id, filing_uuid) DO NOTHING;")
        sql("\n".join(st), timeout=300)
        n = query(f"SELECT (SELECT count(*) FROM ontology.gov_award WHERE entity_id={ent}), (SELECT coalesce(sum(amount),0) FROM ontology.gov_award WHERE entity_id={ent}),"
                  f" (SELECT count(*) FROM ontology.lobbying_filing WHERE entity_id={ent})")[0]
        print(f"{slug}: {n[0]} federal awards (${float(n[1]):,.0f} obligated), {n[2]} lobbying filings", flush=True)


if __name__ == "__main__":
    import urllib.parse  # noqa: E402  (used in lobbying())
    main()
