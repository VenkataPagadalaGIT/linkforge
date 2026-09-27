"""Inventory of venkatapagadala.com for the CMS page.

Usage: python scripts/cms/inventory.py .cms/inventory.json

Reads the live sitemap, fetches every page, and extracts the on-page SEO fields
(title, meta description, H1, canonical, meta robots, schema types). Maps each URL
to its route template in app/ so pages group into page types. Writes JSON.
"""
import concurrent.futures as cf
import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

BASE = "https://venkatapagadala.com"
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1]
UA = {"User-Agent": "vp-cms-inventory/1.0 (site owner audit)"}
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)


def get(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.geturl(), dict(r.headers), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, url, dict(e.headers or {}), ""
    except Exception as e:  # noqa: BLE001
        return 0, url, {}, f"ERROR {e}"


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self.in_title = "", False
        self.meta, self.canonical = {}, ""
        self.h1s, self.h1_depth, self.h1_buf = [], 0, []
        self.ld, self.in_ld, self.ld_buf = [], False, []

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title" and not self.title:
            self.in_title = True
        elif tag == "meta":
            key = (a.get("name") or a.get("property") or "").lower()
            if key and key not in self.meta:
                self.meta[key] = a.get("content", "")
        elif tag == "link" and "canonical" in a.get("rel", "").lower().split():
            self.canonical = self.canonical or a.get("href", "")
        elif tag == "h1":
            self.h1_depth += 1
            self.h1_buf = []
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self.in_ld, self.ld_buf = True, []

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "h1" and self.h1_depth:
            self.h1_depth -= 1
            self.h1s.append(re.sub(r"\s+", " ", "".join(self.h1_buf)).strip())
        elif tag == "script" and self.in_ld:
            self.in_ld = False
            self.ld.append("".join(self.ld_buf))

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.h1_depth:
            self.h1_buf.append(data)
        if self.in_ld:
            self.ld_buf.append(data)


def ld_types(blobs):
    types = []

    def walk(x):
        if isinstance(x, dict):
            t = x.get("@type")
            for v in (t if isinstance(t, list) else [t]):
                if isinstance(v, str) and v not in types:
                    types.append(v)
            for k in ("@graph", "mainEntity", "itemListElement", "hasPart"):
                if k in x:
                    walk(x[k])
        elif isinstance(x, list):
            for i in x:
                walk(i)

    for b in blobs:
        try:
            walk(json.loads(b))
        except Exception:  # noqa: BLE001
            pass
    return types


# --- route templates from app/ ---
routes = []
for root, _dirs, files in os.walk(os.path.join(REPO, "app")):
    if "page.tsx" not in files:
        continue
    rel = os.path.relpath(root, os.path.join(REPO, "app"))
    segs = [] if rel == "." else rel.split(os.sep)
    segs = [s for s in segs if not (s.startswith("(") and s.endswith(")"))]
    if segs and segs[0] in ("admin", "api"):
        continue
    routes.append("/" + "/".join(segs))


def match(path):
    parts = [p for p in path.strip("/").split("/") if p]
    best = None
    for r in routes:
        rp = [p for p in r.strip("/").split("/") if p]
        ok, dyn = True, 0
        if rp and rp[-1].startswith("[...") or (rp and rp[-1].startswith("[[...")):
            if len(parts) < len(rp) - 1:
                continue
            fixed = rp[:-1]
            dyn = 10
            ok = all(f == p or f.startswith("[") for f, p in zip(fixed, parts))
        else:
            if len(rp) != len(parts):
                continue
            for f, p in zip(rp, parts):
                if f.startswith("["):
                    dyn += 1
                elif f != p:
                    ok = False
                    break
        if ok and (best is None or dyn < best[0]):
            best = (dyn, r)
    return best[1] if best else "(no route)"


# --- sitemap ---
_, _, _, xml = get(BASE + "/sitemap.xml")
locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)
if "<sitemapindex" in xml:
    child = []
    for sm in locs:
        child += re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", get(sm)[3])
    locs = child
locs = list(dict.fromkeys(locs))


def one(url):
    status, final, headers, body = get(url)
    p = Page()
    try:
        p.feed(body)
    except Exception:  # noqa: BLE001
        pass
    path = re.sub(r"^https?://[^/]+", "", url) or "/"
    return {
        "url": path,
        "status": status,
        "redirected": final.rstrip("/") != url.rstrip("/"),
        "route": match(path.split("?")[0]),
        "title": re.sub(r"\s+", " ", p.title).strip(),
        "description": p.meta.get("description", ""),
        "h1": p.h1s[0] if p.h1s else "",
        "h1Count": len(p.h1s),
        "canonical": re.sub(r"^https?://[^/]+", "", p.canonical) if p.canonical.startswith(BASE) else p.canonical,
        "robots": p.meta.get("robots", "") or headers.get("X-Robots-Tag", headers.get("x-robots-tag", "")),
        "ogImage": bool(p.meta.get("og:image")),
        "schema": ld_types(p.ld),
    }


with cf.ThreadPoolExecutor(max_workers=8) as ex:
    pages = list(ex.map(one, locs))

robots_txt = get(BASE + "/robots.txt")[3]
json.dump({"base": BASE, "routes": sorted(routes), "pages": pages, "robotsTxt": robots_txt}, open(OUT, "w"), indent=0)

bad = [p for p in pages if p["status"] != 200]
by_route = {}
for p in pages:
    by_route[p["route"]] = by_route.get(p["route"], 0) + 1
print(f"pages={len(pages)} non200={len(bad)} routes_used={len(by_route)} routes_defined={len(routes)}")
for r, n in sorted(by_route.items(), key=lambda x: -x[1]):
    print(f"{n:5}  {r}")
