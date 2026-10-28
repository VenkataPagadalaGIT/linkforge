#!/usr/bin/env python3
"""
SEC EDGAR structured data into the ontology: identifiers (the CIK) and the
history of reported figures (revenue by quarter and by year, capital
expenditure) for every US-listed entity, from the XBRL "company facts" API.

Free and keyless, but the SEC asks every caller to say who they are:
SEC_USER_AGENT must be set to "Name email" before anything is fetched, and the
script refuses to run without it. It sleeps between calls (the SEC allows ten
requests a second) and never fetches a filing document, only the facts API.

Steps:
  --map             tickers > CIK from the SEC's company_tickers.json; writes entity.cik
  --facts SLUGS     company facts for these entities (comma list, or "all" for every entity with a CIK)
  --dry-run         print what would be written, write nothing
Every figure written carries its concept, the filing it came from (accession,
form, filed date) and the period it covers, so "where is this number from" is
answerable row by row.
"""
import datetime as dt, json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

UA = os.environ.get("SEC_USER_AGENT", "").strip()
SLEEP = 0.15
TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:0>10}.json"
# Concepts tried in order; the first one with USD facts wins.
CONCEPTS = {
    "revenue": ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"],
    "capex": ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"],
}
METRIC = {("revenue", "Q"): ("revenue_quarter_usd", "Quarterly revenue"), ("revenue", "Y"): ("revenue_usd", "Revenue"),
          ("capex", "Q"): ("capex_quarter_usd", "Quarterly capital expenditure"), ("capex", "Y"): ("capex_usd", "Capital expenditure")}


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def get(url):
    if not UA or "@" not in UA:
        raise SystemExit("SEC_USER_AGENT is not set. The SEC requires a User-Agent naming who is calling, for example\n"
                         "  export SEC_USER_AGENT='Venkata Pagadala you@example.com'\nNothing was fetched.")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip, deflate"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            import gzip
            data = gzip.decompress(data)
    time.sleep(SLEEP)
    return json.loads(data)


def us_ticker(t):
    """A plain US symbol (NVDA), not a foreign listing (005930.KS, TSE:4063) or a note."""
    return bool(t) and bool(re.fullmatch(r"[A-Z]{1,5}", t))


def step_map(dry):
    ents = query("SELECT slug, ticker FROM ontology.entity WHERE ticker IS NOT NULL AND cik IS NULL")
    todo = [(s, t) for s, t in ents if us_ticker(t)]
    print(f"entities with a US ticker and no CIK: {len(todo)}")
    if not todo:
        return
    table = get(TICKERS_URL)
    by_ticker = {row["ticker"].upper(): row for row in table.values()}
    st, found, missing = [], [], []
    for slug, t in todo:
        row = by_ticker.get(t.upper())
        if not row:
            missing.append((slug, t))
            continue
        found.append((slug, t, row["cik_str"], row["title"]))
        st.append(f"UPDATE ontology.entity SET cik={lit(str(row['cik_str']))}, updated_at=now() WHERE slug={lit(slug)};")
    for f in found:
        print("  ", *f)
    if missing:
        print("not in the SEC list (foreign or delisted):", missing)
    if dry:
        print("dry run: nothing written")
    elif st:
        sql("\n".join(st))
        print(f"wrote {len(st)} CIKs")


def period_label(f):
    """The calendar frame the SEC assigns (CY2025Q3, CY2025) as the site prints periods: Q3 2025, 2025."""
    fr = f.get("frame")
    if not fr:
        return None, None
    m = re.fullmatch(r"CY(\d{4})(?:Q([1-4]))?(I)?", fr)
    if not m or m.group(3):  # instant frames (I) are balances, not flows
        return None, None
    y, qn = m.group(1), m.group(2)
    return (f"Q{qn} {y}", "Q") if qn else (y, "Y")


def step_facts(slugs, dry):
    if slugs == ["all"]:
        ents = query("SELECT slug, cik, name FROM ontology.entity WHERE cik IS NOT NULL ORDER BY slug")
    else:
        ents = query("SELECT slug, cik, name FROM ontology.entity WHERE slug IN (" + ",".join(lit(s) for s in slugs) + ") AND cik IS NOT NULL")
    if not ents:
        raise SystemExit("no entities with a CIK among " + ",".join(slugs) + " (run --map first)")
    st = ["INSERT INTO source (slug, name, homepage, kind) SELECT 'sec-edgar', 'SEC EDGAR', 'https://www.sec.gov/edgar', 'government'"
          " WHERE NOT EXISTS (SELECT 1 FROM source WHERE slug='sec-edgar');"]
    total = 0
    for slug, cik, name in ents:
        data = get(FACTS_URL.format(cik=cik))
        gaap = data.get("facts", {}).get("us-gaap", {})
        company = data.get("entityName") or name
        rows = []
        for kind, concepts in CONCEPTS.items():
            for concept in concepts:
                facts = gaap.get(concept, {}).get("units", {}).get("USD", [])
                if not facts:
                    continue
                best = {}
                for f in facts:
                    label, pk = period_label(f)
                    if not label:
                        continue
                    key = (kind, pk, label)
                    # Several filings restate the same frame: keep the latest filed.
                    if key not in best or f["filed"] > best[key]["filed"]:
                        best[key] = {**f, "concept": concept}
                rows += [(k, v) for k, v in best.items()]
                break  # the first concept with data wins
        for (kind, pk, label), f in sorted(rows, key=lambda x: (x[0][0], x[1]["end"])):
            metric, mlabel = METRIC[(kind, pk)]
            accn = f["accn"]
            doc_slug = f"sec-{accn}"
            url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accn.replace('-', '')}/"
            title = f"{f['form']} filed {f['filed']}: {company}"
            st.append("INSERT INTO document (source_id, slug, title, url, published_on, retrieval, retrieved_at)"
                      f" SELECT s.id, {lit(doc_slug)}, {lit(title)}, {lit(url)}, {lit(f['filed'])}, 'sec-companyfacts-api', now()"
                      f" FROM source s WHERE s.slug='sec-edgar' AND NOT EXISTS (SELECT 1 FROM document WHERE slug={lit(doc_slug)});")
            st.append("INSERT INTO ontology.signal (entity_id, metric, period, value, unit, label, as_of, document_id, url, concept, form, accession, filed_on, period_start, period_end, retrieved_at)"
                      f" SELECT e.id, {lit(metric)}, {lit(label)}, {lit(f['val'])}, 'USD', {lit(mlabel)}, {lit(f['end'])}, d.id, {lit(url)}, {lit('us-gaap:' + f['concept'])},"
                      f" {lit(f['form'])}, {lit(accn)}, {lit(f['filed'])}, {lit(f['start'])}, {lit(f['end'])}, now()"
                      f" FROM ontology.entity e JOIN document d ON d.slug={lit(doc_slug)} WHERE e.slug={lit(slug)}"
                      " ON CONFLICT (entity_id, metric, period) DO UPDATE SET value=EXCLUDED.value, document_id=EXCLUDED.document_id, url=EXCLUDED.url,"
                      " concept=EXCLUDED.concept, form=EXCLUDED.form, accession=EXCLUDED.accession, filed_on=EXCLUDED.filed_on,"
                      " period_start=EXCLUDED.period_start, period_end=EXCLUDED.period_end, retrieved_at=now();")
            total += 1
        qs = sum(1 for (k, pk, _), _ in rows if pk == "Q")
        ys = sum(1 for (k, pk, _), _ in rows if pk == "Y")
        print(f"{slug} ({company}, CIK {cik}): {qs} quarterly + {ys} annual figures")
    if dry:
        print(f"dry run: {total} signal rows not written")
        return
    sql("\n".join(st))
    print(f"wrote {total} signal rows; now regenerate: python3 gen_ontology_intel_ts.py")


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    if "--map" in sys.argv:
        step_map(dry)
    if "--facts" in sys.argv:
        step_facts(sys.argv[sys.argv.index("--facts") + 1].split(","), dry)
    if "--map" not in sys.argv and "--facts" not in sys.argv:
        print(__doc__)
