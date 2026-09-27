#!/usr/bin/env python3
"""End-to-end: news changes go live with no rebuild (E01 to E07 in docs/NO_DEPLOY_PUBLISHING.md).

Needs a production build running with its news source pointed at the local
stand-in for GitHub that this script serves:

    CONTENT_SOURCE_URL=http://127.0.0.1:3499/ai-updates.json \\
    CONTENT_REVALIDATE_SECRET=<the TEST_SECRET below> \\
    node node_modules/next/dist/bin/next start -p 3412
    python3 scripts/cms/test_no_deploy_news.py

(.claude/launch.json "site-news-e2e" starts exactly that.) Between steps the
only thing that changes is the file served here plus one signed refresh
message, so every pass proves an update without a deploy.
"""
import hashlib
import hmac
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SITE = os.environ.get("SITE", "http://127.0.0.1:3412")
TEST_SECRET = "e2e-test-secret-not-used-anywhere-else-0123456789abcdef0123456789"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = json.load(open(os.path.join(ROOT, "content", "ai-updates.json")))
SLUG = "no-deploy-e2e-article"

state = {"body": json.dumps(BASE).encode()}


class Source(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(state["body"])

    def log_message(self, *a):
        pass


def serve(data=None, raw=None):
    state["body"] = raw if raw is not None else json.dumps(data).encode()


def http(path, method="GET", body=None, headers=None):
    req = urllib.request.Request(SITE + path, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def refresh(secret=TEST_SECRET, tamper=False, sign=True):
    body = json.dumps({"tags": ["news"]})
    t = int(time.time())
    sig = hmac.new(secret.encode(), f"{t}.{body}".encode(), hashlib.sha256).hexdigest()
    headers = {"content-type": "application/json"}
    if sign:
        headers["x-content-signature"] = f"t={t},v1={sig}"
    if tamper:
        body = json.dumps({"tags": ["news", "x"]})
    return http("/api/revalidate", "POST", body.encode(), headers)


def eventually(check, what, timeout=25):
    until = time.time() + timeout
    last = None
    while time.time() < until:
        last = check()
        if last is True:
            return
        time.sleep(1)
    raise AssertionError(f"{what} (last: {last})")


def gone(path):
    """A removed or unknown article: a 404, or the existing 'Not found' page,
    which answers 200 with noindex (a soft 404 that predates this change and is
    tracked separately)."""
    s, body = http(path)
    return s == 404 or (s == 200 and "<title>Not found" in body and 'content="noindex' in body) or s


def article(title="No-deploy test article", summary="S" * 150):
    return {
        "id": "e2e", "slug": SLUG, "title": title, "company": "Test", "category": "research", "date": "2026-09-27",
        "summary": summary, "body": "<p>Published without a deploy.</p>", "sourceUrl": "https://example.com",
        "takeaways": ["t"], "tocSections": ["Intro"], "tags": ["test"], "relatedLinks": [],
    }


results = []


def case(name):
    def wrap(fn):
        try:
            fn()
            results.append((name, True, ""))
            print(f"  ok    {name}")
        except AssertionError as e:
            results.append((name, False, str(e)))
            print(f"  FAIL  {name}: {e}")
        return fn
    return wrap


def main():
    srv = ThreadingHTTPServer(("127.0.0.1", 3499), Source)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    status, _ = http("/ai-updates")
    if status != 200:
        print(f"The site is not answering at {SITE} (HTTP {status}). Start it first (see the docstring).")
        return 2
    serve(BASE)
    s, body = refresh()
    if s != 200:
        print(f"The site refused the test refresh (HTTP {s}: {body[:120]}). Is CONTENT_REVALIDATE_SECRET the test secret?")
        return 2

    @case("E01 an article missing from the source is not found (404 or the noindex Not found page)")
    def _():
        eventually(lambda: gone(f"/ai-updates/{SLUG}"), "expected not found")

    @case("E02 add it and refresh: article page, news index and sitemap.xml show it, no rebuild")
    def _():
        serve(BASE[:1] + [article()] + BASE[1:])
        assert refresh()[0] == 200
        eventually(lambda: (lambda r: r[0] == 200 and "No-deploy test article" in r[1] or r[0])(http(f"/ai-updates/{SLUG}")), "article page")
        eventually(lambda: "No-deploy test article" in http("/ai-updates")[1] or "missing from index", "news index")
        eventually(lambda: f"/ai-updates/{SLUG}" in http("/sitemap.xml")[1] or "missing from sitemap.xml", "sitemap.xml")

    @case("E03 edit the title and refresh: the page shows the new title")
    def _():
        serve(BASE[:1] + [article(title="Edited without a deploy")] + BASE[1:])
        assert refresh()[0] == 200
        eventually(lambda: "Edited without a deploy" in http(f"/ai-updates/{SLUG}")[1] or "old title", "new title")

    @case("E04 unsigned, wrongly signed or tampered refreshes are refused and change nothing")
    def _():
        serve(BASE)  # would remove the article if a refresh got through
        assert refresh(sign=False)[0] == 401
        assert refresh(secret="x" * 64)[0] == 401
        assert refresh(tamper=True)[0] == 401
        time.sleep(2)
        s, body = http(f"/ai-updates/{SLUG}")
        assert s == 200 and "Edited without a deploy" in body, f"article changed without a valid refresh (HTTP {s})"

    @case("E05 a broken source keeps the last good news")
    def _():
        serve(raw=b"{ this is not json")
        assert refresh()[0] == 200
        time.sleep(3)
        s, body = http(f"/ai-updates/{SLUG}")
        assert s == 200 and "Edited without a deploy" in body, f"article lost after a broken publish (HTTP {s})"
        bad = BASE[:1] + [dict(article(title="Script attempt"), body="<script>alert(1)</script>")] + BASE[1:]
        serve(bad)
        assert refresh()[0] == 200
        time.sleep(3)
        s, body = http(f"/ai-updates/{SLUG}")
        assert s == 200 and "Script attempt" not in body, "an unsafe publish was served"

    @case("E06 remove it and refresh: not found again, and gone from sitemap.xml")
    def _():
        serve(BASE)
        assert refresh()[0] == 200
        eventually(lambda: gone(f"/ai-updates/{SLUG}"), "not found after removal")
        eventually(lambda: f"/ai-updates/{SLUG}" not in http("/sitemap.xml")[1] or "still in sitemap.xml", "sitemap.xml")

    @case("E07 after a news refresh every contributor and site-map section page still answers 200")
    def _():
        # The trap: Next.js 14.2 turned a refreshed page on a dynamicParams =
        # false route into a lasting 404 (next-cache-handler.cjs). Each page is
        # asked twice: the first answer may be the old page, the second the
        # re-rendered one; both must be 200.
        assert refresh()[0] == 200
        locs = re.findall(r"<loc>([^<]+)</loc>", http("/sitemap.xml")[1])
        paths = [re.sub(r"^https?://[^/]+", "", u) for u in locs]
        pages = [p for p in paths if p.startswith("/ai-contributors/") or p.startswith("/sitemap/")]
        assert len(pages) > 50, f"only {len(pages)} contributor and section pages in sitemap.xml"
        bad = [f"{p} {s}" for p in pages for s in (http(p)[0], http(p)[0]) if s != 200]
        assert not bad, f"{len(bad)} answers were not 200, e.g. {bad[:3]}"

    srv.shutdown()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)} of {len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
