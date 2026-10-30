#!/usr/bin/env python3
"""
Read one breaking event from every platform into events.document. Config: events/<slug>.json.

  free        official statements (Binance announcement API, official X posts by id via the public
              fxtwitter API), investigator and press pages, Hacker News stories
  discover    paid: DataForSEO Google News and Google results (to find TikTok, Instagram and X posts),
              MCP Scraper Reddit threads with comments and YouTube search, Bright Data X posts by profile
  transcribe  paid: MCP Scraper transcripts of the most-watched YouTube and TikTok videos, Instagram posts
  parse       free: archives -> events.document (event_parse.py)

Every paid call is archived under raw/events/<slug>/ before parsing and is never bought twice; hard caps
per provider are enforced in code (each call reserves its worst case first); a lock refuses a second copy.
Private people are never stored by name: authors are kept only for organizations and public roles.

Run: python3 event_collect.py free --event binance-hack-2026
     python3 event_collect.py discover --event binance-hack-2026 --cap-usd 1 --credit-cap 7000 --bd-cap 3
"""
import argparse, datetime as dt, gzip, html, json, os, re, sys, time, urllib.error, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import sql, q
from paid_signals import dfs_auth, http, mcps, rtf_text

HERE = os.path.dirname(os.path.abspath(__file__))
BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
X_DS = "gd_lwxkxvnf1cynvib9co"  # Bright Data: X (formerly Twitter) - Posts
BD_RATE = 0.0015                  # $1.50 per 1,000 records delivered (scrapers)


def cfg(slug):
    return json.load(open(os.path.join(HERE, "events", slug + ".json"), encoding="utf8"))


def arch(slug, name):
    return os.path.join(HERE, "raw", "events", slug, re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:150] + ".json.gz")


def load(slug, name):
    p = arch(slug, name)
    if not os.path.exists(p):
        return None
    try:
        with gzip.open(p, "rb") as f:
            return json.loads(f.read())
    except Exception:  # noqa: BLE001 - truncated by a killed run: drop it and fetch that one again
        os.remove(p)
        return None


def save(slug, name, d):
    os.makedirs(os.path.dirname(arch(slug, name)), exist_ok=True)
    with gzip.open(arch(slug, name), "wb") as f:
        f.write(json.dumps(d).encode())


def text_of_html(raw):
    t = re.sub(r"(?is)<(script|style|noscript|svg|nav|footer)[^>]*>.*?</\1>", " ", raw)
    t = html.unescape(re.sub(r"(?s)<[^>]+>", " ", t))
    t = re.sub("[​‌‍⁠﻿]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def upsert(slug, docs):
    st = []
    for d in docs:
        st.append("INSERT INTO events.document (event_slug,url,platform,kind,voice,title,author,published_at,metrics,body,source_call,retrieved_at) VALUES "
                  f"({q(slug)},{q(d['url'])},{q(d['platform'])},{q(d['kind'])},{q(d['voice'])},{q(d.get('title'))},{q(d.get('author'))},{q(d.get('published_at'))},"
                  f"{q(json.dumps(d.get('metrics') or {}))}::jsonb,{q(d.get('body'))},{q(d.get('source_call'))},now())"
                  # A search result that finds an official, investigator or government page never relabels it as press or public.
                  " ON CONFLICT (event_slug,url) DO UPDATE SET"
                  " platform=CASE WHEN events.document.voice IN ('official','investigator','government') THEN events.document.platform ELSE EXCLUDED.platform END,"
                  " kind=CASE WHEN events.document.voice IN ('official','investigator','government') THEN events.document.kind ELSE EXCLUDED.kind END,"
                  " voice=CASE WHEN events.document.voice IN ('official','investigator','government') AND EXCLUDED.voice NOT IN ('official','investigator','government') THEN events.document.voice ELSE EXCLUDED.voice END,"
                  " author=COALESCE(CASE WHEN events.document.voice IN ('official','investigator','government') THEN events.document.author END, EXCLUDED.author),"
                  " title=COALESCE(events.document.title, EXCLUDED.title), published_at=COALESCE(events.document.published_at, EXCLUDED.published_at),"
                  " metrics=events.document.metrics || EXCLUDED.metrics,"
                  " body=CASE WHEN length(coalesce(EXCLUDED.body,'')) > length(coalesce(events.document.body,'')) THEN EXCLUDED.body ELSE events.document.body END,"
                  " source_call=EXCLUDED.source_call, retrieved_at=now();")
    if st:
        sql("\n".join(st), timeout=300)


def ensure_event(c):
    sql(f"INSERT INTO events.event (slug,title,window_from,window_to) VALUES ({q(c['slug'])},{q(c['title'])},{q(c['window'][0])},{q(c['window'][1])})"
        " ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, window_from=EXCLUDED.window_from, window_to=EXCLUDED.window_to, updated_at=now();")


# ---------------------------------------------------------------- free
def walk_text(o, out):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "text" and isinstance(v, str):
                out.append(v)
            else:
                walk_text(v, out)
    elif isinstance(o, list):
        for v in o:
            walk_text(v, out)


def free(c):
    slug, docs, notes = c["slug"], [], []
    for code in c.get("binance_announcements", []):
        url = f"https://www.binance.com/bapi/composite/v1/public/cms/article/detail/query?articleCode={code}"
        try:
            d = load(slug, "binance-" + code) or http(url, {"User-Agent": BROWSER, "Accept": "application/json"})
            save(slug, "binance-" + code, d)
            a = d.get("data") or {}
            body = a.get("body") or ""
            parts = []
            try:
                walk_text(json.loads(body), parts)
                text = re.sub(r"\s+", " ", " ".join(parts)).strip()
            except (ValueError, TypeError):
                text = text_of_html(body)
            pub = a.get("publishDate")
            docs.append({"url": f"https://www.binance.com/en/support/announcement/detail/{code}", "platform": "binance", "kind": "statement", "voice": "official",
                         "title": a.get("title"), "author": "Binance", "body": text, "source_call": "binance-" + code,
                         "published_at": dt.datetime.fromtimestamp(pub / 1000, dt.timezone.utc).isoformat() if isinstance(pub, (int, float)) else None})
            notes.append(f"binance announcement {len(text)} chars")
        except Exception as e:  # noqa: BLE001
            notes.append(f"FAIL binance {code}: {type(e).__name__} {str(e)[:80]}")
    for user, pid in c.get("x_posts", []):
        name = f"x-{user}-{pid}"
        try:
            d = load(slug, name) or http(f"https://api.fxtwitter.com/{user}/status/{pid}", {"User-Agent": "curl/8.4"})
            save(slug, name, d)
            t = d.get("tweet") or {}
            ts = t.get("created_timestamp")
            docs.append({"url": f"https://x.com/{user}/status/{pid}", "platform": "x", "kind": "post",
                         "voice": "investigator" if user.lower() == "zachxbt" else "official", "title": (t.get("text") or "")[:140],
                         "author": (t.get("author") or {}).get("name") or user, "body": t.get("text"), "source_call": name,
                         "published_at": dt.datetime.fromtimestamp(ts, dt.timezone.utc).isoformat() if ts else None,
                         "metrics": {k: t.get(k) for k in ("likes", "retweets", "replies", "views") if t.get(k) is not None}})
        except Exception as e:  # noqa: BLE001
            notes.append(f"FAIL x {user}/{pid}: {type(e).__name__}")
    ok = 0
    for p in c.get("pages", []):
        name = "page-" + re.sub(r"^https?://(www\.)?", "", p["url"])[:90]
        try:
            d = load(slug, name)
            if d is None:
                req = urllib.request.Request(p["url"], headers={"User-Agent": BROWSER, "Accept": "text/html,application/xhtml+xml"})
                with urllib.request.urlopen(req, timeout=40) as r:
                    raw = r.read().decode("utf8", errors="replace")
                d = {"url": p["url"], "html": raw}
                save(slug, name, d)
            raw = d["html"]
            m = re.search(r"(?is)<title[^>]*>(.*?)</title>", raw)
            pm = re.search(r'(?i)"datePublished"\s*:\s*"([^"]+)"', raw) or re.search(r'(?i)<meta[^>]+(?:article:published_time|datePublished)[^>]+content="([^"]+)"', raw)
            docs.append({"url": p["url"], "platform": "web" if p["voice"] != "press" else "news", "kind": "report" if p["voice"] != "press" else "article",
                         "voice": p["voice"], "author": p.get("author"), "title": html.unescape(m.group(1)).strip()[:300] if m else None,
                         "published_at": pm.group(1) if pm else None, "body": text_of_html(raw), "source_call": name})
            ok += 1
        except Exception as e:  # noqa: BLE001
            notes.append(f"FAIL page {p['url'][:70]}: {type(e).__name__} {getattr(e, 'code', '')}")
    notes.append(f"pages {ok}/{len(c.get('pages', []))}")
    since = int(dt.datetime.fromisoformat(c["window"][0] + "T00:00:00+00:00").timestamp())
    try:
        d = http(f"https://hn.algolia.com/api/v1/search_by_date?query={urllib.request.quote(c['hn_query'])}&tags=story&numericFilters=created_at_i>{since}&hitsPerPage=100",
                 {"User-Agent": "mono-mind-ai-graph/1.0"})
        save(slug, "hackernews", d)
        hits = [h for h in d.get("hits", []) if re.search(r"binance", h.get("title") or "", re.I)]
        docs += [{"url": f"https://news.ycombinator.com/item?id={h['objectID']}", "platform": "hackernews", "kind": "thread", "voice": "public",
                  "title": h.get("title"), "published_at": h.get("created_at"), "source_call": "hackernews",
                  "metrics": {"points": h.get("points"), "comments": h.get("num_comments"), "link": h.get("url")}} for h in hits]
        notes.append(f"hackernews {len(hits)} stories")
    except Exception as e:  # noqa: BLE001
        notes.append(f"FAIL hackernews: {type(e).__name__}")
    upsert(slug, docs)
    print("free:", "; ".join(notes))
    return 3 if any(n.startswith("FAIL") for n in notes) else 0


# ---------------------------------------------------------------- paid
class Budget:
    def __init__(self, usd, credits, bd):
        self.cap = {"dfs": usd, "mcps": credits, "bd": bd}
        self.used = {"dfs": 0.0, "mcps": 0, "bd": 0.0}
        self.log = open(os.path.join(HERE, "raw", "events", "spend_log.jsonl"), "a")

    def reserve(self, prov, worst, what):
        if self.used[prov] + worst > self.cap[prov]:
            print(f"[BUDGET] stop before {what}: {prov} {self.used[prov]} + {worst} worst case > cap {self.cap[prov]}")
            return False
        return True

    def spend(self, prov, amount, what, extra=None):
        self.used[prov] += amount
        self.log.write(json.dumps({"at": dt.datetime.now().isoformat(timespec="seconds"), "provider": prov, "call": what, "amount": amount, **(extra or {})}) + "\n")
        self.log.flush()


def lock():
    p = os.path.join(HERE, "raw", "events", ".lock")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if os.path.exists(p):
        pid = int(open(p).read().strip() or 0)
        try:
            os.kill(pid, 0)
            raise SystemExit(f"[LOCK] event_collect already running (pid {pid}). Refusing a duplicate.")
        except ProcessLookupError:
            pass
    open(p, "w").write(str(os.getpid()))
    return p


def dfs_call(slug, b, name, endpoint, body, worst):
    old = load(slug, name)
    if old and old.get("status_code") == 20000 and (old.get("tasks") or [{}])[0].get("status_code") == 20000:
        return old
    if not b.reserve("dfs", worst, name):
        return None
    d = http(f"https://api.dataforseo.com/v3/{endpoint}", {"Authorization": dfs_auth(), "Content-Type": "application/json"}, body)
    save(slug, name, d)
    t = (d.get("tasks") or [{}])[0]
    b.spend("dfs", float(d.get("cost") or 0), name, {"status": t.get("status_code")})
    print(f"dfs  {name:34} ${float(d.get('cost') or 0):.4f}  {t.get('status_code')} {str(t.get('status_message'))[:50]}", flush=True)
    return d


def mcps_call(slug, b, name, tool, args, worst):
    old = load(slug, name)
    if old and "result" in old and not (old["result"] or {}).get("isError"):
        return old
    if not b.reserve("mcps", worst, name):
        return None
    key = re.findall(r"sk_[A-Za-z0-9_-]{20,}", rtf_text("mcpscraper.rtf"))[0]
    try:
        d = mcps(tool, args, key)
    except urllib.error.HTTPError as e:
        print(f"mcps {name}: HTTP {e.code}")
        return None
    save(slug, name, d)
    err = (d.get("result") or {}).get("isError") or "error" in d
    b.spend("mcps", worst, name, {"error": bool(err)})
    print(f"mcps {name:34} <= {worst} credits{'  ERROR ' + str((d.get('result') or {}).get('content'))[:120] if err else ''}", flush=True)
    return d


def bd_x(slug, b, c):
    """Bright Data X posts by profile for the official and investigator accounts, inside the event window."""
    name = "bd-x-profiles"
    st = load(slug, name) or {}
    if st.get("records") is not None:
        return st
    tok = re.findall(r"[A-Za-z0-9-]{32,}", rtf_text("brightdata.rtf"))[0]
    h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    per = 40
    if not st.get("snapshot_id"):
        worst = len(c["x_profiles"]) * per * BD_RATE
        if not b.reserve("bd", worst, name):
            return None
        body = {"input": [{"url": f"https://x.com/{u}", "start_date": c["window"][0] + "T00:00:00.000Z", "end_date": c["window"][1] + "T23:59:59.000Z"} for u in c["x_profiles"]],
                "limit_per_input": per}
        url = f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={X_DS}&type=discover_new&discover_by=profile_url&include_errors=true&notify=false"
        try:
            r = http(url, h, body)
        except urllib.error.HTTPError as e:
            st = {"error": f"HTTP {e.code}: {e.read()[:300].decode(errors='ignore')}"}
            save(slug, name, st)
            print("bd   X trigger failed:", st["error"][:200])
            return st
        st = {"snapshot_id": r.get("snapshot_id"), "worst": worst}
        save(slug, name, st)
        print("bd   X snapshot", st["snapshot_id"], flush=True)
    for _ in range(90):
        p = http(f"https://api.brightdata.com/datasets/v3/progress/{st['snapshot_id']}", h)
        if p.get("status") == "ready":
            break
        if p.get("status") == "failed":
            st["error"] = "snapshot failed"
            save(slug, name, st)
            return st
        time.sleep(10)
    else:
        print("bd   X snapshot not ready after 15 min; the id is saved, the next run collects it without a new trigger")
        return st
    req = urllib.request.Request(f"https://api.brightdata.com/datasets/v3/snapshot/{st['snapshot_id']}?format=json", headers=h)
    with urllib.request.urlopen(req, timeout=300) as r:
        recs = json.loads(r.read())
    st["records"] = recs
    save(slug, name, st)
    good = [x for x in recs if not x.get("error")]
    b.spend("bd", len(good) * BD_RATE, name, {"records": len(good)})
    print(f"bd   X {len(good)} posts (${len(good) * BD_RATE:.4f})", flush=True)
    return st


def bd_keyword(slug, b, name, dataset, inputs, per):
    """Bright Data scraper discovery by keyword (TikTok, Instagram): trigger once, keep the snapshot id, collect when ready."""
    st = load(slug, name) or {}
    if st.get("records") is not None or st.get("error"):
        return st
    tok = re.findall(r"[A-Za-z0-9-]{32,}", rtf_text("brightdata.rtf"))[0]
    h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    if not st.get("snapshot_id"):
        worst = len(inputs) * per * BD_RATE
        if not b.reserve("bd", worst, name):
            return None
        url = f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={dataset}&type=discover_new&discover_by=keyword&include_errors=true&notify=false"
        try:
            r = http(url, h, {"input": inputs, "limit_per_input": per})
        except urllib.error.HTTPError as e:
            st = {"error": f"HTTP {e.code}: {e.read()[:400].decode(errors='ignore')}"}
            save(slug, name, st)
            print(f"bd   {name} trigger refused (no charge): {st['error'][:220]}")
            return st
        st = {"snapshot_id": r.get("snapshot_id"), "worst": worst}
        save(slug, name, st)
        print(f"bd   {name} snapshot {st['snapshot_id']}", flush=True)
    for _ in range(90):
        p = http(f"https://api.brightdata.com/datasets/v3/progress/{st['snapshot_id']}", h)
        if p.get("status") in ("ready", "failed"):
            break
        time.sleep(10)
    if p.get("status") != "ready":
        print(f"bd   {name}: snapshot {p.get('status')}; id saved for the next run")
        return st
    req = urllib.request.Request(f"https://api.brightdata.com/datasets/v3/snapshot/{st['snapshot_id']}?format=json", headers=h)
    with urllib.request.urlopen(req, timeout=300) as r:
        recs = json.loads(r.read())
    st["records"] = recs
    save(slug, name, st)
    good = [x for x in recs if not x.get("error")]
    b.spend("bd", len(good) * BD_RATE, name, {"records": len(good)})
    print(f"bd   {name} {len(good)} records (${len(good) * BD_RATE:.4f})", flush=True)
    return st


def social(c, b):
    slug = c["slug"]
    bd_keyword(slug, b, "bd-tiktok", "gd_lu702nij2f790tmv9h", [{"search_keyword": "binance hack", "country": ""}], 30)
    bd_keyword(slug, b, "bd-instagram", "gd_lk5ns7kz21pck8jpis", [{"keyword": "binance hack"}], 30)
    bd_keyword(slug, b, "bd-reddit", "gd_lvz8ah06191smkebj4", [{"keyword": "binance hack", "date": "Past week", "sort_by": "Top"}], 40)


def discover(c, b):
    slug = c["slug"]
    for i, qy in enumerate(c["news_queries"]):
        dfs_call(slug, b, f"news-{i}", "serp/google/news/live/advanced", [{"keyword": qy, "location_code": 2840, "language_code": "en", "depth": 30}], 0.03)
    for plat, qy in c["social_queries"].items():
        dfs_call(slug, b, f"serp-{plat}", "serp/google/organic/live/advanced", [{"keyword": qy, "location_code": 2840, "language_code": "en", "depth": 30}], 0.05)
    mcps_call(slug, b, "reddit", "reddit_trending", {"topic": c["reddit_topic"], "window": "week", "maxThreads": 8, "includeComments": True,
                                                     "maxCommentsPerThread": 40, "idempotencyKey": f"{slug}-reddit-1"}, 1200)
    mcps_call(slug, b, "youtube", "youtube_harvest", {"mode": "search", "query": c["youtube_query"], "maxVideos": 25}, 10)
    bd_x(slug, b, c)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["free", "discover", "social", "transcribe", "parse"])
    ap.add_argument("--event", required=True)
    ap.add_argument("--cap-usd", type=float, default=0)
    ap.add_argument("--credit-cap", type=int, default=0)
    ap.add_argument("--bd-cap", type=float, default=0)
    ap.add_argument("--top", type=int, default=6)
    a = ap.parse_args()
    c = cfg(a.event)
    ensure_event(c)
    if a.mode == "free":
        sys.exit(free(c))
    if a.mode == "parse":
        from event_parse import parse
        sys.exit(parse(c))
    if a.cap_usd <= 0 and a.credit_cap <= 0 and a.bd_cap <= 0:
        raise SystemExit("Refusing: pass the owner-approved caps (--cap-usd, --credit-cap, --bd-cap).")
    lk = lock()
    b = Budget(a.cap_usd, a.credit_cap, a.bd_cap)
    try:
        if a.mode == "discover":
            discover(c, b)
        elif a.mode == "social":
            social(c, b)
        else:
            from event_parse import transcribe
            transcribe(c, b, a.top, mcps_call)
    finally:
        os.remove(lk)
        print(f"\nspent: DataForSEO ${b.used['dfs']:.4f} (cap {b.cap['dfs']}), MCP Scraper <= {b.used['mcps']} credits (cap {b.cap['mcps']}), "
              f"Bright Data ${b.used['bd']:.4f} (cap {b.cap['bd']})")


if __name__ == "__main__":
    main()
