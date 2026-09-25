#!/usr/bin/env python3
"""check-sitemap-html.py: prove the HTML site map reaches every page.

Usage: python3 scripts/check-sitemap-html.py --base http://127.0.0.1:3000

Live against a running server, because what matters is what a crawler or an
agent receives. Fails the deploy if:

  1. Any URL in sitemap.xml is not linked from /sitemap (the whole-site page).
     Both read src/lib/siteIndex.ts, so this is the parity proof: a page the
     XML lists but the HTML map cannot reach is an orphan for every reader
     that navigates by links.
  2. Any section view /sitemap/<id> is missing, unlinked from /sitemap, or
     absent from sitemap.xml; or an unknown section does not hard-404.
  3. Any in-page anchor the map links to (a talk, an award, a video) does not
     exist on its page.
  4. The footer does not link /sitemap (the one link that makes it one hop
     from every page).
"""
import argparse
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:3000")
B = ap.parse_args().base.rstrip("/")

def get(path):
    try:
        r = urllib.request.urlopen(urllib.request.Request(B + path, headers={"User-Agent": "qa"}), timeout=60)
        return r.status, r.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""

fails = []
def check(label, cond, detail=""):
    print(("ok    " if cond else "FAIL  ") + label + (f"  [{detail}]" if detail else ""))
    if not cond: fails.append(label)

def hrefs(html):
    out = set()
    for h in re.findall(r'href="([^"]+)"', html):
        u = urlparse(h)
        if u.netloc and u.netloc not in urlparse(B).netloc and "localhost" not in u.netloc and "venkatapagadala.com" not in u.netloc:
            continue
        out.add((u.path or "/") + (("#" + u.fragment) if u.fragment else ""))
    return out

st, xml = get("/sitemap.xml")
check("sitemap.xml returns 200", st == 200)
xml_paths = sorted({(urlparse(u).path or "/") for u in re.findall(r"<loc>([^<]+)</loc>", xml)})
check("sitemap.xml lists pages", len(xml_paths) > 100, f"{len(xml_paths)} URLs")

st, whole = get("/sitemap")
check("/sitemap returns 200", st == 200)
linked = hrefs(whole)
linked_paths = {h.split("#")[0] for h in linked}
missing = [p for p in xml_paths if p not in linked_paths]
check(f"every sitemap.xml URL is linked from /sitemap ({len(xml_paths)})", not missing, ", ".join(missing[:8]) + (" ..." if len(missing) > 8 else ""))

sections = sorted({p.split("/")[2] for p in xml_paths if re.fullmatch(r"/sitemap/[a-z]+", p)})
check("section views are in sitemap.xml", len(sections) >= 6, ", ".join(sections))
for want in ("guides", "topics", "videos", "awards", "sessions", "talks"):
    check(f"requested view /sitemap/{want} exists in sitemap.xml", want in sections)
union = set()
for s in sections:
    st_s, html_s = get(f"/sitemap/{s}")
    check(f"/sitemap/{s} returns 200 and is linked from /sitemap", st_s == 200 and f"/sitemap/{s}" in linked_paths)
    union |= {h.split("#")[0] for h in hrefs(html_s)}
check("the section views together link every sitemap.xml URL", all(p in union for p in xml_paths), ", ".join([p for p in xml_paths if p not in union][:8]))
check("an unknown section hard-404s", get("/sitemap/no-such-section")[0] == 404)

anchors = sorted(h for h in linked if "#" in h and not h.startswith("#"))
pages = {}
bad = []
for h in anchors:
    page, frag = h.split("#", 1)
    if page not in pages:
        pages[page] = get(page)[1]
    if f'id="{frag}"' not in pages[page]:
        bad.append(h)
check(f"every in-page anchor the map links to exists ({len(anchors)})", not bad, ", ".join(bad[:8]))

st_h, home = get("/")
check("the footer links /sitemap", 'href="/sitemap"' in home)

print(f"\n{'SITEMAP HTML GATE: PASS' if not fails else f'SITEMAP HTML GATE: FAIL ({len(fails)})'} "
      f"({len(xml_paths)} pages in sitemap.xml, {len(sections)} section views, {len(anchors)} anchors)")
sys.exit(1 if fails else 0)
