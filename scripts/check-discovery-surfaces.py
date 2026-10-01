#!/usr/bin/env python3
"""check-discovery-surfaces.py: every surface lists every page, and each leads to the others.

Usage: python3 scripts/check-discovery-surfaces.py --base http://127.0.0.1:3000

The site has five discovery surfaces, all rendered from one registry
(src/lib/siteIndex.ts): sitemap.xml, the HTML site map (/sitemap and
/sitemap/<section>), llms.txt, llms-full.txt and the OKF site index
(/okf/site-index.md). This gate proves, live against a running server (what a
crawler or an agent actually receives), that they agree. It fails the deploy if:

  1. Parity. A sitemap.xml URL is missing from /sitemap, from the section
     views, from llms-full.txt or from the OKF site index.
  2. llms.txt. It misses a section view, a guide, a guide topic or an AI update.
  3. Cross-links. A surface does not lead to the others: /sitemap, llms.txt,
     llms-full.txt, okf/index.md and okf/site-index.md each link the rest;
     sitemap.xml lists /sitemap and both llms files; robots.txt declares
     sitemap.xml; the footer links /sitemap and llms.txt.
  4. Machine files. A surface is not 200, has the wrong content type or still
     carries an unfilled {{placeholder}}; or a URL a surface names is not 200.
  5. OKF. A file in public/okf is unreachable from okf/index.md, a bundle link
     is broken, or the guides index misses a guide.
  6. Section views. A view /sitemap/<id> is missing or unlinked, or an unknown
     section does not hard-404.
  7. Anchors. An in-page anchor the map links to (a talk, an award, a video)
     does not exist on its page.
  8. Indexability. A sitemap.xml page is noindex or not 200; the conference
     logistics sessions stay 200 and noindex, and are on no surface.
"""
import argparse
import concurrent.futures
import json
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.request
from urllib.parse import urljoin, urlparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:3000")
B = ap.parse_args().base.rstrip("/")
CANONICAL = "https://venkatapagadala.com"

def fetch(path):
    try:
        r = urllib.request.urlopen(urllib.request.Request(B + path, headers={"User-Agent": "qa"}), timeout=60)
        return r.status, r.headers.get("Content-Type", ""), r.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, "", ""

def get(path):
    st, _, body = fetch(path)
    return st, body

fails = []
def check(label, cond, detail=""):
    print(("ok    " if cond else "FAIL  ") + label + (f"  [{detail}]" if detail else ""))
    if not cond:
        fails.append(label)

def short(items, n=8):
    items = list(items)
    return ", ".join(items[:n]) + (f" ... (+{len(items) - n})" if len(items) > n else "")

def hrefs(html):
    out = set()
    for h in re.findall(r'href="([^"]+)"', html):
        u = urlparse(h)
        if u.netloc and u.netloc not in urlparse(B).netloc and "localhost" not in u.netloc and "venkatapagadala.com" not in u.netloc:
            continue
        out.add((u.path.rstrip("/") or "/") + (("#" + u.fragment) if u.fragment else ""))
    return out

def canonical_paths(text):
    """Site paths a text names as canonical URLs; <templates> and trailing punctuation dropped."""
    out = set()
    for m in re.findall(r"https://venkatapagadala\.com(/[^\s)\]>\"'#]*)?", text):
        p = (m or "/").rstrip(".,;:")
        if "<" not in p:
            out.add(p.rstrip("/") or "/")
    return out

def md_links(body, at):
    """Canonical URLs plus markdown links resolved against the file's own URL."""
    out = canonical_paths(body)
    for t in re.findall(r"\]\(([^)\s]+)\)", body):
        u = urlparse(urljoin(CANONICAL + at, t))
        if u.netloc == "venkatapagadala.com":
            out.add(u.path.rstrip("/") or "/")
    return out

# --- 1. sitemap.xml and the HTML site map ------------------------------------
st, xml = get("/sitemap.xml")
check("sitemap.xml returns 200", st == 200)
xml_paths = sorted({(urlparse(u).path.rstrip("/") or "/") for u in re.findall(r"<loc>([^<]+)</loc>", xml)})
check("sitemap.xml lists pages", len(xml_paths) > 100, f"{len(xml_paths)} URLs")

st, whole = get("/sitemap")
check("/sitemap returns 200", st == 200)
linked = hrefs(whole)
linked_paths = {h.split("#")[0] for h in linked}
check(f"every sitemap.xml URL is linked from /sitemap ({len(xml_paths)})", all(p in linked_paths for p in xml_paths),
      short(p for p in xml_paths if p not in linked_paths))

# --- 6. section views --------------------------------------------------------
sections = sorted({p.split("/")[2] for p in xml_paths if re.fullmatch(r"/sitemap/[a-z]+", p)})
check("section views are in sitemap.xml", len(sections) >= 6, ", ".join(sections))
for want in ("guides", "topics", "videos", "awards", "sessions", "talks"):
    check(f"requested view /sitemap/{want} exists in sitemap.xml", want in sections)
union = set()
for s in sections:
    st_s, html_s = get(f"/sitemap/{s}")
    check(f"/sitemap/{s} returns 200 and is linked from /sitemap", st_s == 200 and f"/sitemap/{s}" in linked_paths)
    union |= {h.split("#")[0] for h in hrefs(html_s)}
check("the section views together link every sitemap.xml URL", all(p in union for p in xml_paths), short(p for p in xml_paths if p not in union))
check("an unknown section hard-404s", get("/sitemap/no-such-section")[0] == 404)

# --- 4. the machine surfaces -------------------------------------------------
SURFACES = {
    "/llms.txt": "text/plain",
    "/llms-full.txt": "text/plain",
    "/okf/site-index.md": "text/markdown",
    "/okf/guides/index.md": "text/markdown",
    "/okf/index.md": "text/markdown",
    "/robots.txt": "text/plain",
    "/sitemap.xml": "application/xml",
}
body = {}
for path, ctype in SURFACES.items():
    st, ct, text = fetch(path)
    body[path] = text
    check(f"{path} answers 200 as {ctype}, no unfilled {{{{placeholder}}}}", st == 200 and ct.startswith(ctype) and "{{" not in text, f"{st} {ct}")

llms_paths = canonical_paths(body["/llms.txt"])
full_paths = canonical_paths(body["/llms-full.txt"])
site_index_paths = md_links(body["/okf/site-index.md"], "/okf/site-index.md")
check("the OKF site index is an OKF concept (type: SiteIndex frontmatter)", body["/okf/site-index.md"].startswith("---\ntype: SiteIndex\n"))

# --- 1. parity with the machine surfaces --------------------------------------
for name, paths in (("llms-full.txt", full_paths), ("the OKF site index", site_index_paths)):
    miss = [p for p in xml_paths if p not in paths]
    check(f"every sitemap.xml URL is in {name} ({len(xml_paths)})", not miss, short(miss))

# --- 2. llms.txt names what an agent asks for first ---------------------------
want = {
    "section view": [p for p in xml_paths if re.fullmatch(r"/sitemap/[a-z]+", p)],
    "guide": [p for p in xml_paths if re.fullmatch(r"/guides/[^/]+", p) and p != "/guides/topics"],
    "guide topic": [p for p in xml_paths if re.fullmatch(r"/guides/topics/[^/]+", p)],
    "AI update": [p for p in xml_paths if re.fullmatch(r"/ai-updates/[^/]+", p)],
}
for kind, paths in want.items():
    miss = [p for p in paths if p not in llms_paths]
    hint = " (a section view llms.txt skips has no pages: drop it from sitemap.xml or give it pages)" if kind == "section view" and miss else ""
    check(f"llms.txt names every {kind} ({len(paths)})", bool(paths) and not miss, short(miss) + hint)

# --- 3. every surface leads to the others -------------------------------------
DISCOVERY = ["/sitemap", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/okf/index.md", "/okf/site-index.md"]
links = {
    "/sitemap": linked_paths,
    "/llms.txt": llms_paths,
    "/llms-full.txt": full_paths,
    "/okf/index.md": md_links(body["/okf/index.md"], "/okf/index.md"),
    "/okf/site-index.md": site_index_paths,
}
for surface, found in links.items():
    miss = [d for d in DISCOVERY if d != surface and d not in found]
    check(f"{surface} links every other discovery surface", not miss, "missing " + ", ".join(miss) if miss else "")
check("sitemap.xml lists /sitemap, /llms.txt and /llms-full.txt", all(p in xml_paths for p in ("/sitemap", "/llms.txt", "/llms-full.txt")))
check("robots.txt declares sitemap.xml", bool(re.search(r"(?im)^sitemap:\s*\S+/sitemap\.xml\s*$", body["/robots.txt"])))
st_h, home = get("/")
check("the footer links /sitemap and /llms.txt", 'href="/sitemap"' in home and 'href="/llms.txt"' in home)

# --- 5. the OKF bundle: no orphan file, no broken link, every guide ----------
on_disk = {"/" + p.relative_to(ROOT / "public").as_posix() for p in (ROOT / "public/okf").rglob("*.md")}
on_disk |= {"/okf/site-index.md", "/okf/guides/index.md"}
seen, queue, broken, bundle_links = set(), ["/okf/index.md"], [], set()
while queue:
    path = queue.pop()
    if path in seen:
        continue
    seen.add(path)
    st, text = get(path)
    if st != 200:
        broken.append(path)
        continue
    for p in md_links(text, path):
        if p.startswith("/okf/"):
            queue.append(p)
        else:
            bundle_links.add(p)
unreached = sorted(on_disk - seen - {"/okf/log.md"})  # log.md is found by convention (OKF spec)
check(f"every OKF file is reachable from okf/index.md ({len(on_disk)} files)", not unreached, short(unreached))
check(f"every OKF file the bundle links answers 200 ({len(seen)} followed)", not broken, short(broken))
guides_index = body["/okf/guides/index.md"]
slugs = [p.split("/")[2] for p in want["guide"]]
miss = [g for g in slugs if not re.search(r"\((?:[^)]*/guides/)?" + re.escape(g) + r"(?:\.md)?\)", guides_index)]
check(f"the OKF guides index lists every guide ({len(slugs)})", not miss, short(miss))

# --- 4. every URL a surface names answers 200 ---------------------------------
named = sorted((llms_paths | full_paths | site_index_paths | bundle_links) - set(xml_paths) - set(SURFACES) - seen)
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
    codes = dict(zip(named, ex.map(lambda p: get(p)[0], named)))
dead = [f"{p} ({c})" for p, c in codes.items() if c != 200]
check(f"every other URL the surfaces name answers 200 ({len(named)})", not dead, short(dead))

# --- 7. anchors --------------------------------------------------------------
anchors = sorted(h for h in linked if "#" in h and not h.startswith("#"))
pages, bad = {}, []
for h in anchors:
    page, frag = h.split("#", 1)
    if page not in pages:
        pages[page] = get(page)[1]
    if f'id="{frag}"' not in pages[page]:
        bad.append(h)
check(f"every in-page anchor the map links to exists ({len(anchors)})", not bad, short(bad))

# --- 8. indexability ---------------------------------------------------------
def robots_of(path):
    code, html = get(path)
    m = re.search(r'<meta name="robots" content="([^"]*)"', html)
    return path, code, (m.group(1) if m else "")
html_paths = [p for p in xml_paths if not re.search(r"\.(txt|xml|md)$", p)]
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
    results = list(ex.map(robots_of, html_paths))
check(f"no sitemap.xml page is noindex ({len(html_paths)} fetched)", not any("noindex" in r for _, _, r in results),
      short(p for p, _, r in results if "noindex" in r))
check("every sitemap.xml page answers 200", all(c == 200 for _, c, _ in results), short(p for p, c, _ in results if c != 200))
proc = subprocess.run(["npx", "tsx", "-e", 'import { conferences, listConferenceSessions, isLogisticsSession } from "./src/data/conferences"; console.log(JSON.stringify(conferences.flatMap(c => listConferenceSessions(c).filter(s => isLogisticsSession(s.session)).map(s => `/notebook/conference/${c.slug}/sessions/${s.urlSlug}`))));'],
                      capture_output=True, text=True, cwd=ROOT)
logistics = json.loads(proc.stdout.strip().splitlines()[-1]) if proc.returncode == 0 else []
check("logistics sessions found in the data", len(logistics) > 0, str(len(logistics)))
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex:
    lres = list(ex.map(robots_of, logistics))
check("logistics session pages still answer 200 (URLs are permanent)", all(code == 200 for _, code, _ in lres))
check("logistics session pages are noindex", all("noindex" in r for _, _, r in lres), short(p for p, _, r in lres if "noindex" not in r))
everywhere = set(xml_paths) | linked_paths | llms_paths | full_paths | site_index_paths
check("logistics session pages are on no surface", not any(p in everywhere for p in logistics), short(p for p in logistics if p in everywhere))

print(f"\n{'DISCOVERY SURFACES GATE: PASS' if not fails else f'DISCOVERY SURFACES GATE: FAIL ({len(fails)})'} "
      f"({len(xml_paths)} pages on every surface, {len(sections)} section views, {len(anchors)} anchors, "
      f"{len(seen)} OKF files, {len(named)} further named URLs)")
sys.exit(1 if fails else 0)
