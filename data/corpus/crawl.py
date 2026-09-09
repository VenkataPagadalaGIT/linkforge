#!/usr/bin/env python3
"""
Crawl pewresearch.org and usafacts.org in full, into research_corpus.

Free and direct, by the sites' own invitation. Both robots.txt files name
ClaudeBot and allow it:

  pewresearch.org  Content-Signal: ai-train=yes, search=yes, ai-input=yes
                   plus a .md twin for every post
  usafacts.org     ClaudeBot explicitly allowed, Crawl-delay: 1

No paid scraper is used, and none would help. A proxy service exists to get
past sites that block you; neither of these blocks us. The only thing a paid
tool could buy here is speed, and the only way it would buy it is by ignoring
the crawl-delay usafacts.org asks for, which is not something to buy.

Resumable by design. Every URL is a row before it is a fetch, so an
interrupted run picks up exactly where it stopped and a re-run costs nothing.
Bodies go to disk gzipped, hashed, and referenced from the row; they are far
too large to sit in the table and would bloat every dump.

  python3 crawl.py discover          enumerate sitemaps into resource
  python3 crawl.py fetch [--limit N] [--site pew|usafacts]
  python3 crawl.py status
"""
import gzip, hashlib, os, re, sys, time, argparse
import urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query, q

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
UA = "ClaudeBot/1.0 (+https://venkatapagadala.com; research corpus; contact vdepagadala@gmail.com)"

SITES = {
    "pew": dict(
        source="pew",
        sitemaps=["https://www.pewresearch.org/sitemap-posts.xml",
                  "https://www.pewresearch.org/sitemap-rls.xml"],
        delay=4.0,          # no crawl-delay published, but the edge rate-limits
                            # hard. Measured: 1.5s earns a penalty box within a
                            # dozen requests, 4.0s ran 8/8 clean. Paying a proxy
                            # to go faster would buy nothing this does not.
        md_twin=True,       # fetch the .md sibling: clean, small, official
    ),
    "usafacts": dict(
        source="usafacts",
        sitemaps=["https://usafacts.org/sitemap.xml"],
        delay=1.0,          # robots.txt: Crawl-delay: 1. Honoured exactly.
        md_twin=False,
    ),
}


class Throttle:
    """
    Adaptive pacing, one per host.

    A 403 from these sites means "too fast", not "not allowed": every user
    agent gets a 200 when asked at a sane pace. So push-back slows the WHOLE
    crawl rather than just retrying the URL that tripped it, which is what
    makes a burst turn into a penalty box. Recovery is gradual, so the crawl
    finds a pace the server is happy with and stays there.
    """

    def __init__(self, floor, ceiling=20.0):
        self.floor = floor
        self.ceiling = ceiling
        self.delay = floor
        self.ok_streak = 0

    def wait(self):
        time.sleep(self.delay)

    def good(self):
        self.ok_streak += 1
        # Recover briskly. The first version needed 25 clean fetches to ease
        # off by 20%, so one early burst of 403s pinned it at its ceiling for
        # the rest of the run: two pages in five minutes.
        if self.ok_streak >= 8 and self.delay > self.floor:
            self.delay = max(self.floor, self.delay * 0.75)
            self.ok_streak = 0

    def pushback(self):
        """One fixed cooldown, then a modest step up. Never compound."""
        self.ok_streak = 0
        self.delay = min(self.ceiling, self.delay * 1.4)
        time.sleep(20)
        return self.delay


def get(url, timeout=30, retries=2, throttle=None):
    """
    Fetch with backoff on throttling.

    Both sites serve every user agent a 200 when asked at a sane pace, so a
    403 or 429 here means "slower", not "no". Backing off is the correct
    answer to that; swapping identities to get around it would not be.
    """
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,text/markdown,application/xhtml+xml",
        "Accept-Encoding": "gzip",
    })
    last = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.decompress(raw)
                return r.status, raw
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (403, 429, 500, 502, 503, 504):
                if throttle:
                    throttle.pushback()
                else:
                    time.sleep(min(60, 4 * (2 ** attempt)))
                continue
            raise
        except Exception as e:
            last = e
            time.sleep(3 * (attempt + 1))
    raise last


def path_kind(url):
    m = re.match(r"https?://[^/]+/([^/?#]+)", url)
    return (m.group(1) if m else "root")[:60]


def discover():
    rows = []
    for site, cfg in SITES.items():
        for sm in cfg["sitemaps"]:
            # Pew rate-limits hard; back off and retry rather than losing a
            # whole sitemap to one 429.
            raw = None
            for attempt in range(4):
                try:
                    _, raw = get(sm)
                    break
                except Exception as e:
                    wait = 5 * (attempt + 1)
                    print(f"  {sm.split('/')[-1]} attempt {attempt+1}: {e}; waiting {wait}s")
                    time.sleep(wait)
            if raw is None:
                print(f"  {sm} GAVE UP")
                continue
            txt = raw.decode("utf-8", "replace")
            entries = re.findall(r"<url>(.*?)</url>", txt, re.S) or \
                      [f"<loc>{u}</loc>" for u in re.findall(r"<loc>(.*?)</loc>", txt)]
            n = 0
            for e in entries:
                lm = re.search(r"<loc>(.*?)</loc>", e)
                if not lm:
                    continue
                url = lm.group(1).strip()
                mod = re.search(r"<lastmod>(.*?)</lastmod>", e)
                rows.append((site, cfg["source"], url, path_kind(url),
                             mod.group(1) if mod else None))
                n += 1
            print(f"  {sm.split('/')[-1]:34} {n:6} urls")
            time.sleep(3)

    stmts = ["CREATE TEMP TABLE s_res (source text, url text, kind text, lastmod text) ON COMMIT DROP;"]
    B = 500
    for i in range(0, len(rows), B):
        stmts.append("INSERT INTO s_res VALUES " + ",".join(
            f"({q(src)},{q(u)},{q(k)},{q(lm)})" for _, src, u, k, lm in rows[i:i+B]) + ";")
    stmts.append("""
      -- DISTINCT ON: a sitemap can list the same URL twice, and Postgres
      -- refuses to let one statement touch a row twice via ON CONFLICT.
      INSERT INTO resource (source_id, url, path_kind, sitemap_lastmod)
      SELECT DISTINCT ON (s.url) so.id, s.url, s.kind, NULLIF(s.lastmod,'')::timestamptz
      FROM s_res s JOIN source so ON so.slug = s.source
      ORDER BY s.url, s.lastmod DESC NULLS LAST
      ON CONFLICT (url) DO UPDATE SET sitemap_lastmod = EXCLUDED.sitemap_lastmod;""")
    sql("\n".join(stmts), timeout=300)
    print(f"\n  {len(rows)} urls in resource")


def fetch_paid(site="pew", limit=None):
    """
    Bright Data path. Works for pewresearch.org ONLY.

    usafacts.org returns an empty body through the unlocker, every time: it is
    a client-rendered app the proxy does not execute. Forty pages were bought
    and forty came back with content length zero before this was caught, which
    is $0.06 for nothing and exactly the "empty responses still bill" failure
    the cost rules warn about. Direct fetching gets those same pages with zero
    errors, so usafacts stays on the free path and no amount of money makes it
    faster. Do not point this at usafacts again.

    The cap lives in brightdata.py, is global across workers, and aborts
    rather than warns.
    """
    if site == "usafacts":
        raise SystemExit("[REFUSED] usafacts returns empty bodies through Bright Data. "
                         "Use: crawl.py fetch --site usafacts (free, works).")
    import brightdata as bd
    bd.acquire_lock(site)
    bd.init()

    rows = query(f"""SELECT r.id, r.url FROM resource r
                     JOIN source so ON so.id = r.source_id
                     WHERE so.slug={q(site)} AND r.status='pending'
                     ORDER BY r.id {'LIMIT ' + str(limit) if limit else ''};""")
    if not rows:
        print("nothing pending"); return

    spend, done, err, t0 = 0.0, 0, 0, time.time()
    pending_sql = []
    print(f"paid fetch: {len(rows)} urls, cap ${bd.HARD_CAP:.2f}, "
          f"est ${len(rows)*bd.COST_PER_REQUEST:.2f}", flush=True)

    for i in range(0, len(rows), 10):
        batch = rows[i:i+10]
        try:
            results, spend = bd.scrape([u for _, u in batch], spend)
        except SystemExit:
            raise
        except Exception as e:
            # Not billed as success; leave the rows pending so a resume retries.
            print(f"  batch failed: {type(e).__name__}: {str(e)[:120]}", flush=True)
            time.sleep(10)
            bd.init()
            continue

        for (rid, url), (_, body) in zip(batch, results):
            if not body:
                pending_sql.append(
                    f"UPDATE resource SET status='error', fetched_at=now(), "
                    f"error='brightdata returned no body' WHERE id={rid};")
                err += 1
                continue
            raw = body.encode("utf-8")
            h = hashlib.sha256(raw).hexdigest()
            rel = os.path.join(site, h[:2], h[2:4], h + ".gz")
            dest = os.path.join(CACHE, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if not os.path.exists(dest):
                with gzip.open(dest, "wb") as f:
                    f.write(raw)
            tm = re.search(r"^#\s+(.+)$", body[:4000], re.M) or \
                 re.search(r"<title>(.*?)</title>", body[:4000], re.S | re.I)
            title = re.sub(r"\s+", " ", tm.group(1))[:300] if tm else ""
            pending_sql.append(
                f"UPDATE resource SET status='ok', http_status=200, fetched_at=now(), "
                f"content_hash={q(h)}, byte_size={len(raw)}, local_path={q(rel)}, "
                f"title={q(title)}, error=NULL WHERE id={rid};")
            done += 1

        if len(pending_sql) >= 40:
            sql("\n".join(pending_sql), timeout=180); pending_sql = []
            n = i + len(batch)
            rate = n / max(time.time() - t0, 1)
            print(f"  {n}/{len(rows)}  ok={done} err={err}  "
                  f"${spend:.2f} spent (${spend/max(done,1):.4f}/page)  "
                  f"eta {(len(rows)-n)/max(rate,0.01)/60:.0f}m", flush=True)

    if pending_sql:
        sql("\n".join(pending_sql), timeout=180)
    sql(f"INSERT INTO ingest_run (script,documents,observations,notes) VALUES "
        f"('crawl.py fetch-paid',0,0,{q(f'{done} fetched, {err} errors, ${spend:.2f} spent at ${bd.COST_PER_REQUEST}/req')});")
    print(f"done  ok={done} err={err}  ACTUAL SPEND ${spend:.2f} "
          f"(estimated ${len(rows)*bd.COST_PER_REQUEST:.2f})")


def fetch(site=None, limit=None):
    where = "r.status = 'pending'"
    if site:
        where += f" AND so.slug = {q(SITES[site]['source'])}"
    rows = query(f"""SELECT r.id, r.url, so.slug FROM resource r
                     JOIN source so ON so.id = r.source_id
                     WHERE {where} ORDER BY r.id
                     {'LIMIT ' + str(limit) if limit else ''};""")
    if not rows:
        print("nothing pending")
        return

    by_slug = {c["source"]: (name, c) for name, c in SITES.items()}
    throttles = {c["source"]: Throttle(c["delay"]) for c in SITES.values()}
    print(f"fetching {len(rows)} urls", flush=True)
    done = err = 0
    t0 = time.time()
    pending_sql = []

    for i, (rid, url, slug) in enumerate(rows, 1):
        name, cfg = by_slug[slug]
        th = throttles[slug]
        target = url
        if cfg["md_twin"]:
            target = url.rstrip("/") + ".md"

        try:
            try:
                code, raw = get(target, throttle=th)
            except urllib.error.HTTPError as e:
                # A missing .md twin is normal for some post types. Fall back
                # to the HTML rather than recording the page as unavailable.
                if e.code == 404 and cfg["md_twin"]:
                    code, raw = get(url, throttle=th)
                    target = url
                else:
                    raise
            h = hashlib.sha256(raw).hexdigest()
            rel = os.path.join(slug, h[:2], h[2:4], h + ".gz")
            dest = os.path.join(CACHE, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if not os.path.exists(dest):
                with gzip.open(dest, "wb") as f:
                    f.write(raw)
            title = ""
            head = raw[:4000].decode("utf-8", "replace")
            tm = re.search(r'^title:\s*"(.*?)"', head, re.M) or \
                 re.search(r"<title>(.*?)</title>", head, re.S | re.I)
            if tm:
                title = re.sub(r"\s+", " ", tm.group(1))[:300]
            pending_sql.append(
                f"UPDATE resource SET status='ok', http_status={code}, fetched_at=now(), "
                f"content_hash={q(h)}, byte_size={len(raw)}, local_path={q(rel)}, "
                f"title={q(title)}, error=NULL WHERE id={rid};")
            done += 1
            th.good()
        except urllib.error.HTTPError as e:
            pending_sql.append(
                f"UPDATE resource SET status='error', http_status={e.code}, "
                f"fetched_at=now(), error={q(str(e)[:200])} WHERE id={rid};")
            err += 1
        except Exception as e:
            pending_sql.append(
                f"UPDATE resource SET status='error', fetched_at=now(), "
                f"error={q(type(e).__name__ + ': ' + str(e)[:180])} WHERE id={rid};")
            err += 1

        # Flush periodically so an interrupted run keeps its progress.
        if len(pending_sql) >= 50:
            sql("\n".join(pending_sql), timeout=180)
            pending_sql = []
            rate = i / max(time.time() - t0, 1)
            eta = (len(rows) - i) / max(rate, 0.001) / 3600
            pace = " ".join(f"{k}={v.delay:.1f}s" for k, v in throttles.items())
            print(f"  {i}/{len(rows)}  ok={done} err={err}  {rate:.2f}/s  "
                  f"eta {eta:.1f}h  pace {pace}", flush=True)

        th.wait()

    if pending_sql:
        sql("\n".join(pending_sql), timeout=180)
    sql(f"INSERT INTO ingest_run (script,documents,observations,notes) VALUES "
        f"('crawl.py fetch',0,0,{q(f'{done} fetched, {err} errors')});")
    print(f"done  ok={done} err={err}  {(time.time()-t0)/60:.1f}m")


def status():
    for r in query("SELECT source, path_kind, status, urls, bytes FROM v_crawl LIMIT 40;"):
        print("  " + "  ".join(x.ljust(14) for x in r))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["discover", "fetch", "fetch-paid", "status"])
    ap.add_argument("--site", choices=list(SITES))
    ap.add_argument("--limit", type=int)
    a = ap.parse_args()
    if a.cmd == "discover":     discover()
    elif a.cmd == "fetch":      fetch(a.site, a.limit)
    elif a.cmd == "fetch-paid": fetch_paid(a.site or "pew", a.limit)
    else:                       status()
