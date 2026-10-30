#!/usr/bin/env python3
"""
Free public signals per company, into ontology.series_point and ontology.watch_item.

  wikipedia         daily views of the company's articles (Wikimedia REST, human users only)
  pypi              daily downloads of its Python packages, last ~180 days (pypistats.org, mirrors excluded)
  npm               daily downloads of its npm packages since first publish (api.npmjs.org)
  github            stars and forks of every public repo in its org, on the day we read them
  app_store         App Store rating and rating count on the day we read them; each version as a dated item
  statuspage        incidents from its public status page (the last 50 the page publishes)
  federal_register  Federal Register documents whose text names the company
  huggingface       its Hugging Face datasets: downloads in the last 30 days and likes, on the day we read them

All free, no keys. Sources per company: ontology/signal_sources.json. Every raw response is archived
under raw/signals/<day>/ before parsing. Re-runs upsert, so nothing is counted twice. A source that
fails is reported and the run exits 3 (partial); a failure is never written as zero.

Run: python3 collect_signals.py [--only anthropic] [--sources wikipedia,npm]
"""
import argparse, datetime as dt, gzip, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import sql, query, q

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "mono-mind-ai-graph/1.0 (signals collector; https://venkatapagadala.com)"
TODAY = dt.date.today()
RAW = os.path.join(HERE, "raw", "signals", TODAY.isoformat())


def slug(s):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", s).strip("_")[:120]


def get(url, name, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            os.makedirs(RAW, exist_ok=True)
            with gzip.open(os.path.join(RAW, slug(name) + ".json.gz"), "wb") as f:
                f.write(body)
            return json.loads(body.decode("utf8", errors="replace"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < tries - 1:
                time.sleep(6 * (i + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if i < tries - 1:
                time.sleep(6 * (i + 1))
                continue
            raise


def points(eid, source, series, subject, grain, pts):
    pts = [(d, v) for d, v in pts if v is not None]
    if not pts:
        return []
    out = []
    for k in range(0, len(pts), 500):
        vals = ",".join(f"({eid},{q(source)},{q(series)},{q(subject)},{q(str(d))},{q(grain)},{float(v)},current_date)" for d, v in pts[k:k + 500])
        out.append("INSERT INTO ontology.series_point (entity_id,source,series,subject,period,grain,value,retrieved_at) VALUES " + vals +
                   " ON CONFLICT (entity_id,source,series,subject,period) DO UPDATE SET value=EXCLUDED.value, grain=EXCLUDED.grain, retrieved_at=EXCLUDED.retrieved_at;")
    return out


def items(eid, source, rows):
    out = []
    for r in rows:
        out.append("INSERT INTO ontology.watch_item (entity_id,source,item_key,kind,title,url,happened_at,ended_at,detail,retrieved_at) VALUES "
                   f"({eid},{q(source)},{q(str(r['key']))},{q(r.get('kind'))},{q(r.get('title'))},{q(r.get('url'))},{q(r.get('happened_at'))},{q(r.get('ended_at'))},"
                   f"{q(json.dumps(r.get('detail') or {}, ensure_ascii=False))}::jsonb,current_date)"
                   " ON CONFLICT (entity_id,source,item_key) DO UPDATE SET kind=EXCLUDED.kind, title=EXCLUDED.title, url=EXCLUDED.url,"
                   " happened_at=EXCLUDED.happened_at, ended_at=EXCLUDED.ended_at, detail=EXCLUDED.detail, retrieved_at=EXCLUDED.retrieved_at;")
    return out


def wikipedia(eid, cfg):
    st, n = [], 0
    end = (TODAY - dt.timedelta(days=1)).strftime("%Y%m%d")
    for a in cfg:
        start = a.get("since", "2015-07-01").replace("-", "")
        t = urllib.parse.quote(a["title"], safe="")
        d = get(f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/{t}/daily/{start}00/{end}00", "wikipedia-" + a["title"])
        pts = [(dt.date(int(i["timestamp"][:4]), int(i["timestamp"][4:6]), int(i["timestamp"][6:8])), i["views"]) for i in d.get("items", [])]
        st += points(eid, "wikipedia", "views", a["title"], "day", pts)
        n += len(pts)
    return st, f"{n} article-days"


def pypi(eid, cfg):
    st, n = [], 0
    for pkg in cfg:
        d = get(f"https://pypistats.org/api/packages/{urllib.parse.quote(pkg)}/overall?mirrors=false", "pypi-" + pkg)
        pts = [(r["date"], r["downloads"]) for r in d.get("data", []) if r.get("category") == "without_mirrors"]
        st += points(eid, "pypi", "downloads", pkg, "day", pts)
        n += len(pts)
        time.sleep(1)
    return st, f"{n} package-days"


def npm(eid, cfg):
    st, n = [], 0
    last = TODAY - dt.timedelta(days=1)
    for p in cfg:
        a = dt.date.fromisoformat(p.get("since", "2015-01-10"))
        pts = []
        while a <= last:
            b = min(a + dt.timedelta(days=539), last)
            d = get(f"https://api.npmjs.org/downloads/range/{a}:{b}/{p['name']}", f"npm-{p['name']}-{a}")
            pts += [(r["day"], r["downloads"]) for r in d.get("downloads", [])]
            a = b + dt.timedelta(days=1)
        while pts and not pts[0][1]:  # days before the first publish read as zero; they are not data
            pts.pop(0)
        # npm's stats service has outages that it reports as 0 downloads (13-15 and 19-21 Oct 2026 for
        # packages doing millions a day). A zero after the first publish is a gap, never a real zero.
        pts = [(d, v) for d, v in pts if v]
        st += points(eid, "npm", "downloads", p["name"], "day", pts)
        n += len(pts)
    return st, f"{n} package-days"


def github(eid, org):
    repos, page = [], 1
    while page <= 10:
        d = get(f"https://api.github.com/orgs/{org}/repos?per_page=100&page={page}&type=public", f"github-{org}-{page}")
        repos += d
        if len(d) < 100:
            break
        page += 1
    own = [r for r in repos if not r.get("fork")]
    st = []
    for r in own:
        st += points(eid, "github", "stars", r["full_name"], "snapshot", [(TODAY, r["stargazers_count"])])
        st += points(eid, "github", "forks", r["full_name"], "snapshot", [(TODAY, r["forks_count"])])
    st += items(eid, "github", [{"key": r["full_name"], "kind": "repo", "title": r["name"], "url": r["html_url"], "happened_at": r.get("created_at"),
                                 "detail": {"description": (r.get("description") or "")[:240], "language": r.get("language"), "archived": r.get("archived"), "pushed_at": r.get("pushed_at")}}
                                for r in own])
    return st, f"{len(own)} repos ({len(repos) - len(own)} forks skipped)"


def app_store(eid, cfg):
    st, out = [], []
    for a in cfg:
        d = get(f"https://itunes.apple.com/lookup?id={a['id']}&country={a.get('country', 'us')}", f"appstore-{a['id']}")
        r = (d.get("results") or [None])[0]
        if not r:
            raise RuntimeError(f"App Store lookup returned nothing for {a['id']}")
        subj = f"{a['id']}:{a.get('country', 'us')}"
        st += points(eid, "app_store", "rating", subj, "snapshot", [(TODAY, r.get("averageUserRating"))])
        st += points(eid, "app_store", "rating_count", subj, "snapshot", [(TODAY, r.get("userRatingCount"))])
        st += items(eid, "app_store", [{"key": f"{a['id']}:{r.get('version')}", "kind": "version", "title": f"{r.get('trackName')} {r.get('version')}",
                                        "url": r.get("trackViewUrl", "").split("?")[0], "happened_at": r.get("currentVersionReleaseDate"),
                                        "detail": {"notes": (r.get("releaseNotes") or "")[:600]}}])
        out.append(f"{r.get('averageUserRating'):.2f} from {r.get('userRatingCount'):,} ratings")
    return st, "; ".join(out)


def statuspage(eid, base):
    d = get(base.rstrip("/") + "/api/v2/incidents.json", "statuspage")
    inc = d.get("incidents", [])
    rows = [{"key": i["id"], "kind": i.get("impact"), "title": i.get("name"), "url": i.get("shortlink"), "happened_at": i.get("created_at"),
             "ended_at": i.get("resolved_at"), "detail": {"status": i.get("status"), "components": [c.get("name") for c in i.get("components") or []]}}
            for i in inc]
    return items(eid, "statuspage", rows), f"{len(rows)} incidents, oldest {min((r['happened_at'] for r in rows), default='-')[:10]}"


def federal_register(eid, term):
    fields = "".join(f"&fields[]={f}" for f in ("document_number", "title", "type", "publication_date", "html_url", "agencies", "abstract"))
    d = get(f"https://www.federalregister.gov/api/v1/documents.json?conditions[term]={urllib.parse.quote(term)}&per_page=100&order=newest{fields}", "federal_register")
    rows = [{"key": r["document_number"], "kind": r.get("type"), "title": r.get("title"), "url": r.get("html_url"), "happened_at": r.get("publication_date"),
             "detail": {"agencies": [a.get("name") for a in r.get("agencies") or [] if a.get("name")], "abstract": (r.get("abstract") or "")[:600]}}
            for r in d.get("results", [])]
    return items(eid, "federal_register", rows), f"{len(rows)} documents (the API counts {d.get('count')})"


def huggingface(eid, author):
    d = get(f"https://huggingface.co/api/datasets?author={urllib.parse.quote(author)}&limit=100&full=true", "huggingface")
    st = []
    for r in d:
        st += points(eid, "huggingface", "downloads_30d", r["id"], "snapshot", [(TODAY, r.get("downloads"))])
        st += points(eid, "huggingface", "likes", r["id"], "snapshot", [(TODAY, r.get("likes"))])
    st += items(eid, "huggingface", [{"key": r["id"], "kind": "dataset", "title": r["id"].split("/", 1)[-1], "url": f"https://huggingface.co/datasets/{r['id']}",
                                      "happened_at": r.get("createdAt"), "detail": {"lastModified": r.get("lastModified")}} for r in d])
    return st, f"{len(d)} datasets"


RUN = {"wikipedia": wikipedia, "pypi": pypi, "npm": npm, "github": lambda e, c: github(e, c), "app_store": app_store,
       "statuspage": statuspage, "federal_register": federal_register, "huggingface": huggingface}
KEY = {"github": "github_org", "huggingface": "huggingface_author"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--sources")
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(HERE, "ontology", "signal_sources.json"), encoding="utf8"))
    ents = [k for k in cfg if k != "note" and (not a.only or k in a.only.split(","))]
    ids = {s: int(i) for s, i in query("SELECT slug, id FROM ontology.entity WHERE slug IN (" + ",".join(q(e) for e in ents) + ")")}
    want = a.sources.split(",") if a.sources else list(RUN)
    failed = 0
    for ent in ents:
        if ent not in ids:
            print(f"skip {ent}: not in ontology.entity")
            continue
        for src in want:
            c = cfg[ent].get(KEY.get(src, src))
            if not c:
                continue
            t0 = time.time()
            try:
                st, note = RUN[src](ids[ent], c)
                if st:
                    sql("\n".join(st), timeout=300)
                print(f"OK   {ent:10} {src:17} {time.time() - t0:5.1f}s  {note}", flush=True)
            except Exception as e:  # noqa: BLE001 - one source failing must not stop the others
                failed += 1
                print(f"FAIL {ent:10} {src:17} {type(e).__name__}: {str(e)[:160]}", flush=True)
    if failed:
        sys.exit(3)


if __name__ == "__main__":
    main()
