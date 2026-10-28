#!/usr/bin/env python3
"""
Bright Data pilot for "everyone with a public footprint": a small, capped,
locked, archived run that measures real cost and match quality before any bulk
pull. Follows the paid-api-cost-safety rules:

  cap        HARD_CAP_USD is enforced in code before every paid call, from the
             provider's published rates (Marketplace $2.50 per 1,000 records;
             Scraper API $1.50 per 1,000 records); the run stops when the next
             call could cross it
  lock       one instance at a time (a lockfile with a live pid)
  archive    every raw response is gzipped under data/corpus/raw/brightdata/
             before parsing (that is also the resume state)
  pilot      LinkedIn: at most --linkedin N profiles whose current company is
             the entity (dataset gd_l1viktl72bvl7bjuj0, sync search endpoint)
             Reddit: at most --reddit N posts found by keyword (scraper
             gd_lvz8ah06191smkebj4, discover by keyword)

The API key is read at runtime from the owner's sec folder and never printed.
Personal data (LinkedIn rows) stays in the local database and the local raw
archive; nothing is published by this script.

Run: python3 bd_pilot.py --entity anthropic --company "Anthropic" --company-id anthropicresearch --linkedin 20 --reddit 25 [--cap 1.00] [--dry-run]
"""
import atexit, datetime as dt, gzip, json, os, re, subprocess, sys, time, urllib.error, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw", "brightdata")
LOCK = os.path.join(RAW, "pilot.lock")
RATE_MARKET = 2.50 / 1000   # Marketplace datasets, per record
RATE_SCRAPER = 1.50 / 1000  # Scraper API, per record
LINKEDIN_DS = "gd_l1viktl72bvl7bjuj0"
REDDIT_DS = "gd_lvz8ah06191smkebj4"
COMPANY_DS = "gd_l1vikfnt1wgvvqz95w"
RELATED = {"Anthropic": ["Claude"], "OpenAI": ["ChatGPT", "GPT-"], "Google DeepMind": ["Gemini"], "Mistral": ["Le Chat"]}
spent = 0.0
HARD_CAP = 1.00


def key():
    txt = subprocess.run(["textutil", "-convert", "txt", "-stdout", os.path.expanduser("~/Desktop/sec/brightdata.rtf")], capture_output=True, text=True).stdout
    return re.findall(r"\b[A-Za-z0-9_-]{30,}\b", txt)[0]


def lit(v):
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def acquire_lock():
    os.makedirs(RAW, exist_ok=True)
    if os.path.exists(LOCK):
        pid = int(open(LOCK).read().strip() or 0)
        if pid and subprocess.run(["kill", "-0", str(pid)], capture_output=True).returncode == 0:
            raise SystemExit(f"[LOCK] a Bright Data pilot is already running (pid {pid}); refusing a duplicate")
    open(LOCK, "w").write(str(os.getpid()))
    atexit.register(lambda: os.path.exists(LOCK) and os.remove(LOCK))


def call(method, url, body=None, timeout=120):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read()


def archive(tag, payload):
    path = os.path.join(RAW, f"{dt.datetime.now().strftime('%Y%m%d-%H%M%S')}-{tag}.json.gz")
    with gzip.open(path, "wt", encoding="utf8") as f:
        f.write(payload if isinstance(payload, str) else payload.decode("utf8", "replace"))
    return path


def budget_check(expected_records, rate, what):
    global spent
    worst = expected_records * rate
    if spent + worst > HARD_CAP:
        raise SystemExit(f"[BUDGET] {what}: up to ${worst:.3f} more would pass the ${HARD_CAP:.2f} cap (spent ${spent:.3f}); stopping")


def snapshot_wait(snap, what):
    """Marketplace filter snapshots: poll the metadata endpoint, then download. Endpoint names differ across docs, so try both families."""
    meta_urls = [f"https://api.brightdata.com/datasets/snapshots/{snap}", f"https://api.brightdata.com/datasets/v3/progress/{snap}"]
    dl_urls = [f"https://api.brightdata.com/datasets/snapshots/{snap}/download?format=json", f"https://api.brightdata.com/datasets/v3/snapshot/{snap}?format=json"]
    for _ in range(60):
        time.sleep(10)
        status = None
        for mu in meta_urls:
            try:
                _, p = call("GET", mu)
                pj = json.loads(p)
                status = pj.get("status") or pj.get("state")
                break
            except urllib.error.HTTPError as e:
                if e.code != 404:
                    print(f"{what}: metadata HTTP {e.code}: {e.read()[:160]}")
        print(f"{what}: snapshot {snap} status {status}", flush=True)
        if status in ("ready", "done", "completed", "success"):
            break
        if status in ("failed", "error"):
            return None
    for du in dl_urls:
        try:
            _, out = call("GET", du, timeout=300)
            return out
        except urllib.error.HTTPError as e:
            if e.code != 404:
                print(f"{what}: download HTTP {e.code}: {e.read()[:160]}")
    return None


def linkedin_pilot(entity, company, company_id, n, dry):
    global spent
    budget_check(n, RATE_MARKET, "LinkedIn filter")
    flt = {"operator": "or", "filters": [{"name": "current_company_name", "operator": "=", "value": company}]}
    for cid in [c for c in (company_id or "").split(",") if c]:  # the slug and LinkedIn's numeric id both count
        flt["filters"].append({"name": "current_company_company_id", "operator": "=", "value": cid})
    body = {"dataset_id": LINKEDIN_DS, "filter": flt, "records_limit": n}
    print(f"LinkedIn: filtering {LINKEDIN_DS} for current company {company!r} (records_limit {n}, worst case ${n * RATE_MARKET:.3f})", flush=True)
    if dry:
        return 0
    try:
        status, raw = call("POST", "https://api.brightdata.com/datasets/filter", body)
    except urllib.error.HTTPError as e:
        err = e.read()[:400]
        print(f"LinkedIn: HTTP {e.code}: {err}")
        if e.code == 402:
            raise SystemExit("[FUNDS] Bright Data says the account lacks funds; nothing charged")
        return 0
    snap = json.loads(raw).get("snapshot_id")
    print("LinkedIn: snapshot", snap, flush=True)
    out = snapshot_wait(snap, "LinkedIn")
    if out is None:
        print("LinkedIn: no records downloaded (snapshot id kept above for a later fetch)")
        return 0
    path = archive("linkedin-filter", out)
    try:
        data = json.loads(out)
    except ValueError:
        data = [json.loads(l) for l in out.decode("utf8", "replace").splitlines() if l.strip()]
    recs = data if isinstance(data, list) else data.get("records") or data.get("data") or []
    recs = [r for r in recs if isinstance(r, dict)]
    spent += len(recs) * RATE_MARKET
    store_raw("linkedin-filter", path, recs, len(recs) * RATE_MARKET)
    print(f"LinkedIn: {len(recs)} records (${len(recs) * RATE_MARKET:.3f}); archived {os.path.basename(path)}")
    ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(entity)})"
    st = []
    for r in recs:
        cur = r.get("current_company") or {}
        title = cur.get("title") or r.get("position")  # the current role sits on the current_company object
        detail = {"position": title, "city": r.get("city"), "country": r.get("country_code"), "current_company": cur.get("name") or r.get("current_company_name"),
                  "company_id": r.get("current_company_company_id"), "followers": r.get("followers"), "connections": r.get("connections"),
                  "bio_links": r.get("bio_links") or [], "experience_count": len(r.get("experience") or []), "tier": "stated"}
        st.append("INSERT INTO ontology.footprint (entity_id, source, source_id, name, headline, location, profile_url, evidence_url, is_current, detail)"
                  f" VALUES ({ent}, 'linkedin', {lit(r.get('linkedin_id') or r.get('id') or r.get('url'))}, {lit(r.get('name'))}, {lit(title)}, {lit(r.get('location') or r.get('city'))},"
                  f" {lit(r.get('url'))}, {lit(r.get('url'))}, true, {lit(json.dumps(detail, ensure_ascii=False))}::jsonb)"
                  " ON CONFLICT (entity_id, source, source_id) DO UPDATE SET name=EXCLUDED.name, headline=EXCLUDED.headline, location=EXCLUDED.location, detail=EXCLUDED.detail, retrieved_at=current_date;")
    if st:
        sql("\n".join(st))
    named = sum(1 for r in recs if (r.get("current_company_name") or (r.get("current_company") or {}).get("name") or "").strip().lower() == company.lower())
    titles = [((r.get("current_company") or {}).get("title") or r.get("position") or "") for r in recs]
    titled = sum(1 for t in titles if t)
    print(f"LinkedIn quality: {named}/{len(recs)} name the company exactly; {titled}/{len(recs)} carry a title; sample titles: " + "; ".join(t[:40] or "?" for t in titles[:6]))
    return len(recs)


def reddit_pilot(entity, keyword, n, dry):
    global spent
    budget_check(n, RATE_SCRAPER, "Reddit discovery")
    url = f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={REDDIT_DS}&type=discover_new&discover_by=keyword&include_errors=true&notify=false"
    body = {"input": [{"keyword": keyword, "date": "All time", "sort_by": "Top"}], "limit_per_input": n}
    print(f"Reddit: discovering up to {n} posts for {keyword!r} (worst case ${n * RATE_SCRAPER:.3f})")
    if dry:
        return 0
    try:
        status, raw = call("POST", url, body)
    except urllib.error.HTTPError as e:
        print(f"Reddit: trigger HTTP {e.code}: {e.read()[:300]}")
        return 0
    snap = json.loads(raw).get("snapshot_id")
    print("Reddit: snapshot", snap)
    for _ in range(60):
        time.sleep(10)
        try:
            _, p = call("GET", f"https://api.brightdata.com/datasets/v3/progress/{snap}")
        except urllib.error.HTTPError as e:
            print("Reddit: progress HTTP", e.code, e.read()[:200])
            continue
        pj = json.loads(p)
        if pj.get("status") in ("ready", "done", "completed"):
            break
        if pj.get("status") in ("failed", "error"):
            print("Reddit: run failed:", pj)
            return 0
    else:
        print("Reddit: still running after 10 minutes; nothing loaded (re-run later with the snapshot id)")
        return 0
    _, out = call("GET", f"https://api.brightdata.com/datasets/v3/snapshot/{snap}?format=json", timeout=300)
    path = archive("reddit-discover", out)
    recs = json.loads(out)
    recs = [r for r in recs if isinstance(r, dict) and r.get("url")]
    spent += len(recs) * RATE_SCRAPER
    store_raw("reddit-discover", path, recs, len(recs) * RATE_SCRAPER)
    # Keyword discovery also returns posts that only carry the word in comments; keep the ones that name the company or its product.
    rel = re.compile("|".join(re.escape(w) for w in [keyword] + RELATED.get(keyword, [])), re.I)
    kept = [r for r in recs if rel.search((r.get("title") or "") + " " + (r.get("description") or ""))]
    print(f"Reddit: {len(recs)} posts (${len(recs) * RATE_SCRAPER:.3f}), {len(kept)} name {keyword} or its products in title or body; archived {os.path.basename(path)}")
    recs = kept
    ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(entity)})"
    st = []
    for r in recs:
        summary = f"r/{(r.get('community_name') or '').lstrip('r/')} · {r.get('num_upvotes') or 0} upvotes · {r.get('num_comments') or 0} comments"
        st.append("INSERT INTO ontology.post (entity_id, platform, url, title, author, published_on, retrieval, summary)"
                  f" VALUES ({ent}, 'reddit', {lit(r['url'])}, {lit((r.get('title') or '')[:200])}, NULL, {lit((r.get('date_posted') or '')[:10] or None)}, 'brightdata-scraper', {lit(summary)})"
                  " ON CONFLICT (url) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, retrieved_at=now();")
    if st:
        sql("\n".join(st))
    return len(recs)


def company_record(entity, company_id, dry):
    """The company's own LinkedIn page as one Marketplace record: followers, size bucket, locations, specialties, funding, affiliated pages."""
    global spent
    budget_check(1, RATE_MARKET, "LinkedIn company record")
    # The company dataset keys pages by URL; its company_id is LinkedIn's number, not the slug.
    body = {"dataset_id": COMPANY_DS, "filter": {"name": "url", "operator": "=", "value": f"https://www.linkedin.com/company/{company_id}"}, "records_limit": 1}
    print(f"Company page: filtering {COMPANY_DS} for /company/{company_id} (1 record, ${RATE_MARKET:.4f})", flush=True)
    if dry:
        return 0
    try:
        _, raw = call("POST", "https://api.brightdata.com/datasets/filter", body)
    except urllib.error.HTTPError as e:
        print(f"Company page: HTTP {e.code}: {e.read()[:300]}")
        return 0
    snap = json.loads(raw).get("snapshot_id")
    out = snapshot_wait(snap, "Company page")
    if out is None:
        return 0
    path = archive("linkedin-company", out)
    try:
        data = json.loads(out)
    except ValueError:
        data = [json.loads(l) for l in out.decode("utf8", "replace").splitlines() if l.strip()]
    recs = [r for r in (data if isinstance(data, list) else [data]) if isinstance(r, dict)]
    spent += len(recs) * RATE_MARKET
    store_raw("linkedin-company", path, recs, len(recs) * RATE_MARKET)
    for r in recs:
        keep = {k: r.get(k) for k in ("name", "followers", "employees_in_linkedin", "company_size", "headquarters", "founded", "industries", "specialties", "formatted_locations",
                                      "country_codes_array", "affiliated", "funding", "investors", "stock_info", "alumni", "url", "website", "slogan", "organization_type", "crunchbase_url")}
        ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(entity)})"
        sql(f"INSERT INTO ontology.fact (entity_id, key, label, value, as_of, sort_order, source_file) VALUES ({ent}, 'linkedin_page', 'LinkedIn page',"
            f" {lit(json.dumps(keep, ensure_ascii=False))}, current_date, 90, 'brightdata:linkedin-company') ON CONFLICT (entity_id, key) DO UPDATE SET value=EXCLUDED.value, as_of=EXCLUDED.as_of;")
        print(f"Company page: followers {r.get('followers')}, employees on LinkedIn {r.get('employees_in_linkedin')}, size {r.get('company_size')}, HQ {r.get('headquarters')}, locations {len(r.get('formatted_locations') or [])}")
    return len(recs)


def linkedin_detail(entity, urls, dry):
    """Full profiles (title, experience, education) for profile URLs the filter found: Scraper API, collect by URL."""
    global spent
    n = len(urls)
    budget_check(n, RATE_SCRAPER, "LinkedIn detail")
    print(f"LinkedIn detail: scraping {n} profiles by URL (worst case ${n * RATE_SCRAPER:.3f})", flush=True)
    if dry or not urls:
        return 0
    try:
        _, raw = call("POST", f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={LINKEDIN_DS}&include_errors=true&notify=false", {"input": [{"url": u} for u in urls]}, timeout=300)
    except urllib.error.HTTPError as e:
        print(f"LinkedIn detail: trigger HTTP {e.code}: {e.read()[:300]}")
        return 0
    snap = json.loads(raw).get("snapshot_id")
    print("LinkedIn detail: snapshot", snap, flush=True)
    for _ in range(180):
        time.sleep(15)
        try:
            _, p = call("GET", f"https://api.brightdata.com/datasets/v3/progress/{snap}")
        except urllib.error.HTTPError as e:
            print("LinkedIn detail: progress HTTP", e.code, e.read()[:160])
            continue
        st = json.loads(p).get("status")
        if st in ("ready", "done", "completed"):
            break
        if st in ("failed", "error"):
            print("LinkedIn detail: run failed")
            return 0
    else:
        print("LinkedIn detail: still running after 45 minutes; snapshot id kept above")
        return 0
    _, out = call("GET", f"https://api.brightdata.com/datasets/v3/snapshot/{snap}?format=json", timeout=600)
    path = archive("linkedin-detail", out)
    recs = [r for r in json.loads(out) if isinstance(r, dict)]
    good = [r for r in recs if r.get("name") and not r.get("error")]
    spent += len(good) * RATE_SCRAPER
    store_raw("linkedin-detail", path, recs, len(good) * RATE_SCRAPER)
    print(f"LinkedIn detail: {len(good)} profiles of {len(recs)} results (${len(good) * RATE_SCRAPER:.3f}); archived {os.path.basename(path)}")
    ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(entity)})"
    st = []
    for r in good:
        cur = r.get("current_company") or {}
        title = cur.get("title") or r.get("position")
        exp = [{"company": e.get("company"), "title": e.get("title"), "start": e.get("start_date"), "end": e.get("end_date"), "location": e.get("location"),
                "positions": [{"title": p.get("title"), "start": p.get("start_date"), "end": p.get("end_date")} for p in (e.get("positions") or [])]} for e in (r.get("experience") or [])]
        edu = [{"school": e.get("title"), "degree": e.get("degree"), "field": e.get("field"), "start": e.get("start_year"), "end": e.get("end_year")} for e in (r.get("education") or [])]
        detail = {"position": title, "city": r.get("city"), "country": r.get("country_code"), "current_company": cur.get("name") or r.get("current_company_name"),
                  "company_id": r.get("current_company_company_id"), "followers": r.get("followers"), "connections": r.get("connections"), "bio_links": r.get("bio_links") or [],
                  "experience": exp, "education": edu, "about": (r.get("about") or "")[:600], "languages": r.get("languages") or [], "tier": "stated", "detail": True}
        st.append("INSERT INTO ontology.footprint (entity_id, source, source_id, name, headline, location, profile_url, evidence_url, is_current, detail)"
                  f" VALUES ({ent}, 'linkedin', {lit(r.get('linkedin_id') or r.get('id') or r.get('url'))}, {lit(r.get('name'))}, {lit(title)}, {lit(r.get('location') or r.get('city'))},"
                  f" {lit(r.get('url'))}, {lit(r.get('url'))}, true, {lit(json.dumps(detail, ensure_ascii=False))}::jsonb)"
                  " ON CONFLICT (entity_id, source, source_id) DO UPDATE SET name=EXCLUDED.name, headline=EXCLUDED.headline, location=EXCLUDED.location, profile_url=EXCLUDED.profile_url,"
                  " detail=EXCLUDED.detail, retrieved_at=current_date;")
    if st:
        sql("\n".join(st), timeout=600)
    titled = sum(1 for r in good if (r.get("current_company") or {}).get("title") or r.get("position"))
    withexp = sum(1 for r in good if r.get("experience"))
    print(f"LinkedIn detail quality: {titled}/{len(good)} have a title, {withexp}/{len(good)} have an experience list")
    return len(good)


def store_raw(tag, path, recs, cost):
    sql("INSERT INTO ontology.raw_capture (source, tag, path, records, cost_usd, payload)"
        f" VALUES ('brightdata', {lit(tag)}, {lit(path)}, {len(recs)}, {cost:.4f}, {lit(json.dumps(recs, ensure_ascii=False))}::jsonb);", timeout=600)


def main():
    global HARD_CAP
    a = sys.argv
    g = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    entity, company, company_id = g("--entity"), g("--company"), g("--company-id")
    n_li, n_rd = int(g("--linkedin", "0")), int(g("--reddit", "0"))
    HARD_CAP = float(g("--cap", "1.00"))
    dry = "--dry-run" in a
    acquire_lock()
    print(f"cap ${HARD_CAP:.2f} enforced in code; lock {LOCK}; raw archive {RAW}")
    if "--company-record" in a and company_id:
        company_record(entity, company_id.split(",")[0], dry)
    if n_li:
        linkedin_pilot(entity, company, company_id, n_li, dry)
    n_detail = int(g("--detail", "0"))
    if n_detail:
        urls = [u for (u,) in query(f"SELECT profile_url FROM ontology.footprint WHERE source='linkedin' AND profile_url IS NOT NULL AND entity_id=(SELECT id FROM ontology.entity WHERE slug={lit(entity)})"
                                    " AND (detail->>'detail') IS NULL ORDER BY id") if u][:n_detail]
        linkedin_detail(entity, urls, dry)
    if n_rd:
        reddit_pilot(entity, company, n_rd, dry)
    print(f"spent (from published rates): ${spent:.3f} of ${HARD_CAP:.2f}")


if __name__ == "__main__":
    main()
