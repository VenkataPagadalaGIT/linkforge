#!/usr/bin/env python3
"""check-route-coverage.py: no page ships unregistered.

Usage: python3 scripts/check-route-coverage.py --base http://127.0.0.1:3000

Crawlers and AI agents find pages through the discovery surfaces (sitemap.xml,
/sitemap, llms.txt, llms-full.txt, the OKF site index), and every one of them
reads a single registry: src/lib/siteIndex.ts. A route added under app/
without an entry there is missing from all five at once, and nothing about
the page itself looks wrong. This gate turns that silent gap into a failed
deploy. Run it against a freshly built server (preflight builds first).

  1. Routes. Every page.tsx and route.ts under app/ is either registered (at
     least one of its URLs is in sitemap.xml or llms-full.txt, or, for an OKF
     file, linked from /okf/index.md) or listed in NOT_INDEXED_ROUTES in
     src/lib/siteIndex.ts with a reason. A listed route must serve noindex and
     appear on no surface, and every listed pattern must still match a route.
  2. Pages. Every page the build prerendered (.next/prerender-manifest.json)
     is in sitemap.xml, is a machine file on the surfaces, falls under
     NOT_INDEXED_ROUTES, or serves noindex by design (the conference logistics
     sessions do). This is the instance check: a new guide, topic or session
     that renders but was never registered fails here, by URL.
"""
import argparse
import concurrent.futures
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urljoin, urlparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:3000")
B = ap.parse_args().base.rstrip("/")
CANONICAL = "https://venkatapagadala.com"
METADATA_ROUTES = {"sitemap.ts": "/sitemap.xml", "robots.ts": "/robots.txt", "manifest.ts": "/manifest.webmanifest"}
ASSET = re.compile(r"\.(ico|png|jpe?g|svg|webp|gif|webmanifest)$")

fails = []
def check(label, cond, detail=""):
    print(("ok    " if cond else "FAIL  ") + label + (f"  [{detail}]" if detail else ""))
    if not cond:
        fails.append(label)

def get(path):
    try:
        r = urllib.request.urlopen(urllib.request.Request(B + path, headers={"User-Agent": "qa"}), timeout=60)
        return r.status, dict(r.headers), r.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), ""

def noindex(headers, html):
    tag = re.search(r'<meta[^>]+name="robots"[^>]+content="([^"]*)"', html)
    return "noindex" in (tag.group(1) if tag else "") or "noindex" in headers.get("X-Robots-Tag", "")

def canonical_paths(text):
    """Every site path a text names as a canonical URL. A template such as
    .../speakers/<speaker> is not a URL and never counts as registration."""
    out = set()
    for m in re.findall(r"https://venkatapagadala\.com(/[^\s)\]>\"'#]*)?", text):
        p = (m or "/").rstrip(".,;:")
        if "<" not in p:
            out.add(p.rstrip("/") or "/")
    return out

# --- the registry's own record of deliberately hidden routes --------------------
src = (ROOT / "src/lib/siteIndex.ts").read_text()
block = re.search(r"NOT_INDEXED_ROUTES[^=]*=\s*\[(.*?)\n\];", src, re.S)
NOT_INDEXED = re.findall(r'\{\s*route:\s*"([^"]+)",\s*reason:\s*"([^"]+)"\s*\}', block.group(1) if block else "")
check("NOT_INDEXED_ROUTES parsed from src/lib/siteIndex.ts", len(NOT_INDEXED) > 0, f"{len(NOT_INDEXED)} entries")

def hidden_by(path):
    for pattern, reason in NOT_INDEXED:
        if (pattern.endswith("/*") and path.startswith(pattern[:-1])) or path == pattern:
            return pattern, reason
    return None

# --- every route the app defines ---------------------------------------------
routes = []
for f in sorted((ROOT / "app").rglob("*")):
    if not f.is_file():
        continue
    rel = f.relative_to(ROOT / "app")
    dirs = list(rel.parts[:-1])
    if not dirs and f.name in METADATA_ROUTES:
        routes.append((METADATA_ROUTES[f.name], str(rel)))
    elif re.fullmatch(r"(page|route)\.(tsx|ts|jsx|js)", f.name):
        segs = [d for d in dirs if not (d.startswith("(") and d.endswith(")")) and not d.startswith("@")]
        routes.append(("/" + "/".join(segs), str(rel)))
check("app routes found", len(routes) > 20, f"{len(routes)} routes")

def route_regex(route):
    rx = ""
    for seg in [s for s in route.split("/") if s]:
        if seg.startswith("[[..."):
            rx += r"(?:/.*)?"
        elif seg.startswith("[..."):
            rx += r"/.+"
        elif seg.startswith("["):
            rx += r"/[^/]+"
        else:
            rx += "/" + re.escape(seg)
    return re.compile("^" + (rx or "/") + "$")

# --- what the surfaces list --------------------------------------------------
st, _, xml = get("/sitemap.xml")
check("sitemap.xml returns 200", st == 200)
xml_paths = {(urlparse(u).path.rstrip("/") or "/") for u in re.findall(r"<loc>([^<]+)</loc>", xml)}
st, _, full = get("/llms-full.txt")
check("llms-full.txt returns 200", st == 200)
full_paths = canonical_paths(full)
st, _, okf_index = get("/okf/index.md")
check("okf/index.md returns 200", st == 200)
okf_linked = {urlparse(urljoin(CANONICAL + "/okf/index.md", t)).path for t in re.findall(r"\]\(([^)\s]+)\)", okf_index)}
st, _, html_map = get("/sitemap")
map_paths = {urlparse(h).path.rstrip("/") or "/" for h in re.findall(r'href="([^"#]+)', html_map) if not urlparse(h).netloc}
listed = xml_paths | full_paths | okf_linked

# --- 1. routes ---------------------------------------------------------------
print("\nroute                                                  status")
unregistered = []
for route, file in routes:
    hidden = hidden_by(route)
    if hidden:
        print(f"  {route:<52} not indexed ({hidden[1]})")
        continue
    rx = route_regex(route)
    urls = [p for p in listed if rx.match(p)]
    print(f"  {route:<52} {len(urls)} URL{'s' if len(urls) != 1 else ''} registered" if urls else f"  {route:<52} UNREGISTERED ({file})")
    if not urls:
        unregistered.append(f"{route} ({file})")
check("every app route is registered in src/lib/siteIndex.ts or in NOT_INDEXED_ROUTES", not unregistered,
      "; ".join(unregistered) + " -> add it to getSiteIndex(), or to NOT_INDEXED_ROUTES with a reason" if unregistered else "")

stale = [p for p, _ in NOT_INDEXED if not any((p.endswith("/*") and r.startswith(p[:-1])) or r == p for r, _ in routes)]
check("every NOT_INDEXED_ROUTES entry still matches a route", not stale, ", ".join(stale))

static_hidden = sorted({r for r, _ in routes if hidden_by(r) and "[" not in r})
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    served = dict(zip(static_hidden, ex.map(get, static_hidden)))
not_noindex = [r for r, (code, h, html) in served.items() if code == 200 and not noindex(h, html)]
check(f"every NOT_INDEXED route that answers 200 serves noindex ({len(static_hidden)} checked)", not not_noindex, ", ".join(not_noindex))
leaked = sorted(p for p in (xml_paths | full_paths | map_paths) if hidden_by(p))
check("no NOT_INDEXED route appears on sitemap.xml, /sitemap or llms-full.txt", not leaked, ", ".join(leaked[:8]))

# --- 2. every prerendered page -----------------------------------------------
manifest = ROOT / ".next/prerender-manifest.json"
check(".next/prerender-manifest.json exists (run next build first)", manifest.exists())
if manifest.exists():
    pre = sorted(p for p in json.loads(manifest.read_text())["routes"]
                 if not p.startswith("/_") and p not in ("/404", "/500") and not ASSET.search(p))
    buckets = {"in sitemap.xml": [], "machine file on the surfaces": [], "not indexed": [], "noindex by design": [], "UNREGISTERED": []}
    rest = []
    for p in pre:
        if p in xml_paths:
            buckets["in sitemap.xml"].append(p)
        elif p in full_paths or p in okf_linked:
            buckets["machine file on the surfaces"].append(p)
        elif hidden_by(p):
            buckets["not indexed"].append(p)
        else:
            rest.append(p)
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
        for p, (code, h, html) in zip(rest, ex.map(get, rest)):
            buckets["noindex by design" if code == 200 and noindex(h, html) else "UNREGISTERED"].append(p)
    print(f"\n{len(pre)} prerendered pages: " + ", ".join(f"{len(v)} {k}" for k, v in buckets.items()))
    check("every prerendered page is registered, a listed machine file, not indexed, or noindex",
          not buckets["UNREGISTERED"], ", ".join(buckets["UNREGISTERED"][:10]))
    missing = sorted(p for p in xml_paths if not ASSET.search(p) and "[" not in p and p not in pre)
    print(f"({len(missing)} sitemap.xml pages render on demand rather than at build; the surfaces gate fetches each one)")

print(f"\n{'ROUTE COVERAGE GATE: PASS' if not fails else f'ROUTE COVERAGE GATE: FAIL ({len(fails)})'} "
      f"({len(routes)} routes, {len(NOT_INDEXED)} deliberately not indexed)")
sys.exit(1 if fails else 0)
