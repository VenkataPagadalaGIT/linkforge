#!/usr/bin/env python3
"""End-to-end: page SEO fields change with no rebuild (SE01 to SE10 in docs/NO_DEPLOY_PUBLISHING.md).

Needs a production build running with its content sources pointed at the local
stand-in for GitHub that this script serves:

    CONTENT_SOURCE_URL=http://127.0.0.1:3499/ai-updates.json \\
    CONTENT_SEO_SOURCE_URL=http://127.0.0.1:3499/seo-overrides.json \\
    CONTENT_REVALIDATE_SECRET=<the TEST_SECRET below> \\
    node node_modules/next/dist/bin/next start -p 3412
    python3 scripts/cms/test_no_deploy_seo.py

(.claude/launch.json "site-news-e2e" starts exactly that.) Between steps the
only thing that changes is the file served here plus one signed refresh
message, so every pass proves a change without a deploy. Three kinds of page
are covered: prerendered static (/about), prerendered dynamic
(/guides/what-is-jev) and rendered per request (/experience).
"""
import hashlib
import hmac
import html
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

SITE = os.environ.get("SITE", "http://127.0.0.1:3412")
TEST_SECRET = "e2e-test-secret-not-used-anywhere-else-0123456789abcdef0123456789"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NEWS = json.load(open(os.path.join(ROOT, "content", "ai-updates.json")))
STATIC, DYNAMIC, PER_REQUEST = "/about", "/guides/what-is-jev", "/experience"
PAGES = [STATIC, DYNAMIC, PER_REQUEST]
EMPTY = {"pages": {}}

state = {"seo": json.dumps(EMPTY).encode(), "status": 200}


class Source(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/seo-overrides.json"):
            status, body = state["status"], state["seo"]
        elif self.path.startswith("/ai-updates.json"):
            status, body = 200, json.dumps(NEWS).encode()
        else:
            status, body = 404, b"{}"
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


def serve(data=None, raw=None, status=200):
    state["seo"] = raw if raw is not None else json.dumps(data).encode()
    state["status"] = status


def http(path, method="GET", body=None, headers=None):
    req = urllib.request.Request(SITE + path, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def refresh(tags=("seo",), paths=None, secret=TEST_SECRET, sign=True, tamper=False, raw_paths=False):
    msg = {"tags": list(tags)}
    if paths is not None:
        msg["paths"] = paths if raw_paths else list(paths)
    body = json.dumps(msg)
    t = int(time.time())
    sig = hmac.new(secret.encode(), f"{t}.{body}".encode(), hashlib.sha256).hexdigest()
    headers = {"content-type": "application/json"}
    if sign:
        headers["x-content-signature"] = f"t={t},v1={sig}"
    if tamper:
        body = json.dumps({"tags": list(tags), "paths": ["/admin"]})
    return http("/api/revalidate", "POST", body.encode(), headers)


def fields(path):
    """The SEO fields as the page renders them; canonical and og:url as paths."""
    s, body = http(path)

    def meta(attr, name):
        m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', body)
        return html.unescape(m.group(1)) if m else None

    def as_path(u):
        return (urlparse(u).path or "/") if u else None

    title = re.search(r"<title>([^<]*)</title>", body)
    canonical = re.search(r'<link rel="canonical" href="([^"]*)"', body)
    return {
        "status": s,
        "title": html.unescape(title.group(1)) if title else None,
        "description": meta("name", "description"),
        "canonical": as_path(canonical.group(1)) if canonical else None,
        "robots": meta("name", "robots"),
        "googlebot": meta("name", "googlebot"),
        "og:title": meta("property", "og:title"),
        "og:description": meta("property", "og:description"),
        "og:url": as_path(meta("property", "og:url")),
        "twitter:title": meta("name", "twitter:title"),
    }


def sitemap_paths():
    return {urlparse(u).path or "/" for u in re.findall(r"<loc>([^<]+)</loc>", http("/sitemap.xml")[1])}


def eventually(check, what, timeout=25):
    until = time.time() + timeout
    last = None
    while time.time() < until:
        last = check()
        if last is True:
            return
        time.sleep(1)
    raise AssertionError(f"{what} (last: {last})")


def shows(path, **want):
    """A check for eventually(): True once the page renders every wanted field."""
    def check():
        got = fields(path)
        diff = {k: got.get(k) for k, v in want.items() if got.get(k) != v}
        return True if not diff else diff
    return check


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


T1, D1 = "About Venkata Pagadala, set without a deploy", "A description set in the content file and live without a rebuild."
T2, T3, T4 = "What is Jev: a title set without a deploy", "Experience, set without a deploy", "Last good title"


def main():
    srv = ThreadingHTTPServer(("127.0.0.1", 3499), Source)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    status, _ = http("/about")
    if status != 200:
        print(f"The site is not answering at {SITE} (HTTP {status}). Start it first (see the docstring).")
        return 2
    serve(EMPTY)
    s, body = refresh(paths=PAGES)
    if s != 200:
        print(f"The site refused the test refresh (HTTP {s}: {body[:120]}). Is CONTENT_REVALIDATE_SECRET the test secret?")
        return 2
    own = {p: fields(p) for p in PAGES}
    listed = sitemap_paths()

    @case("SE01 with an empty overrides file every page renders the metadata its code defines")
    def _():
        assert own[STATIC]["title"] == "About · Venkata Pagadala", own[STATIC]["title"]
        assert all(own[p]["status"] == 200 and own[p]["title"] and own[p]["canonical"] == p for p in PAGES), own
        assert {STATIC, DYNAMIC, PER_REQUEST} <= listed, "a test page is missing from sitemap.xml"

    @case("SE02 a title and description on a static page go live from a refresh that names only the tag")
    def _():
        serve({"pages": {STATIC: {"title": T1, "description": D1}}})
        assert refresh()[0] == 200
        eventually(shows(STATIC, title=T1, description=D1, **{"og:title": T1, "og:description": D1}), "new title and description")
        got = fields(STATIC)
        assert got["twitter:title"] == own[STATIC]["twitter:title"], "the X title follows only where the page sets its own"
        assert got["canonical"] == STATIC and got["robots"] == own[STATIC]["robots"], "fields not in the file changed"
        assert fields(PER_REQUEST)["title"] == own[PER_REQUEST]["title"], "a page the file does not name changed"

    @case("SE03 a prerendered dynamic page takes its override")
    def _():
        serve({"pages": {STATIC: {"title": T1, "description": D1}, DYNAMIC: {"title": T2}}})
        assert refresh(paths=[DYNAMIC])[0] == 200
        eventually(shows(DYNAMIC, title=T2, **{"og:title": T2}), "guide title")

    @case("SE04 a page rendered per request takes its override")
    def _():
        serve({"pages": {STATIC: {"title": T1, "description": D1}, DYNAMIC: {"title": T2}, PER_REQUEST: {"title": T3}}})
        assert refresh(paths=[PER_REQUEST])[0] == 200
        eventually(shows(PER_REQUEST, title=T3), "experience title")

    @case("SE05 robots noindex: the tag says so, googlebot does not contradict it, and the page leaves sitemap.xml")
    def _():
        serve({"pages": {STATIC: {"title": T1, "description": D1}, DYNAMIC: {"robots": "noindex, follow"}}})
        assert refresh(paths=[DYNAMIC, PER_REQUEST])[0] == 200
        eventually(shows(DYNAMIC, robots="noindex, follow", googlebot=None, title=own[DYNAMIC]["title"]), "noindex guide")
        eventually(lambda: sitemap_paths() == listed - {DYNAMIC} or "sitemap.xml not updated", "sitemap.xml without the guide")
        eventually(shows(PER_REQUEST, title=own[PER_REQUEST]["title"]), "experience back to its own title")

    @case("SE06 a canonical moves the link and og:url, and the page leaves sitemap.xml")
    def _():
        serve({"pages": {STATIC: {"title": T1, "description": D1, "canonical": "/contact"}}})
        assert refresh(paths=[STATIC, DYNAMIC])[0] == 200
        eventually(shows(STATIC, canonical="/contact", **{"og:url": "/contact"}), "canonical to /contact")
        eventually(lambda: sitemap_paths() == listed - {STATIC} or "sitemap.xml not updated", "sitemap.xml without /about")

    @case("SE07 removing every override restores each page and sitemap.xml exactly")
    def _():
        serve(EMPTY)
        assert refresh(paths=PAGES)[0] == 200
        for p in PAGES:
            eventually(lambda p=p: fields(p) == own[p] or {k: v for k, v in fields(p).items() if own[p].get(k) != v}, f"{p} restored")
        eventually(lambda: sitemap_paths() == listed or "sitemap.xml differs", "sitemap.xml restored")

    @case("SE08 unsigned, wrongly signed or tampered refreshes are refused; bad paths are refused; nothing changes")
    def _():
        serve({"pages": {STATIC: {"title": "Should not appear"}}})
        assert refresh(sign=False)[0] == 401
        assert refresh(secret="x" * 64)[0] == 401
        assert refresh(tamper=True)[0] == 401
        for bad in (["../etc/passwd"], ["https://evil.example/x"], ["/about/"], "/about", ["/a"] * 201, [7]):
            assert refresh(paths=bad, raw_paths=True)[0] == 400, f"paths {str(bad)[:40]} accepted"
        time.sleep(2)
        assert fields(STATIC)["title"] == own[STATIC]["title"], "the page changed without a valid refresh"

    @case("SE09 a broken, unsafe or unreachable published copy keeps the last good overrides")
    def _():
        serve({"pages": {STATIC: {"title": T4}}})
        assert refresh(paths=[STATIC])[0] == 200
        eventually(shows(STATIC, title=T4), "last good title")
        for name, kwargs in (
            ("not JSON", {"raw": b"{ this is not json"}),
            ("a <script> in a title", {"data": {"pages": {STATIC: {"title": "<script>alert(1)</script>"}}}}),
            ("an off-site canonical", {"data": {"pages": {STATIC: {"canonical": "https://evil.example/"}}}}),
            ("an unknown field", {"data": {"pages": {STATIC: {"h1": "x"}}}}),
            ("GitHub answering 500", {"data": EMPTY, "status": 500}),
        ):
            serve(**kwargs)
            assert refresh(paths=[STATIC])[0] == 200
            time.sleep(2)
            got = fields(STATIC)
            assert got["title"] == T4 and got["canonical"] == STATIC, f"{name}: page changed to {got['title']!r}, {got['canonical']!r}"
        serve(EMPTY)
        assert refresh(paths=PAGES)[0] == 200
        eventually(shows(STATIC, title=own[STATIC]["title"]), "clean up: back to the page's own title")

    @case("SE10 after a refresh, one page of every fixed-list route still answers 200, twice")
    def _():
        # The trap: Next.js 14.2 turned a refreshed page on a dynamicParams =
        # false route into a lasting 404 (next-cache-handler.cjs, R02).
        assert refresh()[0] == 200
        prefixes = ("/ai-contributors/", "/notebook/ai/encyclopedia/", "/notebook/conference/speakers/", "/guides/topics/",
                    "/guides/", "/solutions/", "/sitemap/")
        paths = sorted(sitemap_paths())
        sample = [next((p for p in paths if p.startswith(pre) and p.count("/") == pre.count("/") and p != "/guides/topics"), None) for pre in prefixes]
        sample += [next((p for p in paths if "/sessions/" in p), None),
                   next((p for p in paths if p.startswith("/notebook/conference/") and p.count("/") == 3 and "/speakers" not in p), None)]
        assert all(sample), f"a route has no page in sitemap.xml: {sample}"
        bad = [f"{p} {s}" for p in sample for s in (http(p)[0], http(p)[0]) if s != 200]
        assert not bad, f"not 200: {bad}"

    srv.shutdown()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)} of {len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
