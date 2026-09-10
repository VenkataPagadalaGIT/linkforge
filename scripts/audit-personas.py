#!/usr/bin/env python3
"""
Full audit of the persona surface: discoverability, rendering, on-page, schema.

Written because "is it linked, will it rank, does it render" deserves a check
that fails loudly rather than an assurance. Everything here is asserted against
the served HTML, which is what a crawler actually gets. Run against the dev
server or the live domain:

    python3 scripts/audit-personas.py http://127.0.0.1:3402
"""
import json, re, sys, html, urllib.request, urllib.error
from collections import defaultdict

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3402").rstrip("/")

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "persona-audit/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, r.read().decode("utf-8", "replace")

def text_of(h):
    h = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    h = re.sub(r"<style.*?</style>", " ", h, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h)))

def jsonld(h):
    out = []
    for m in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', h, re.S):
        try:
            out.append(json.loads(html.unescape(m)))
        except Exception:
            out.append({"@type": "PARSE_ERROR"})
    return out

# --- the URL set, from the site's own sitemap ---
_, sm = get("/sitemap.xml")
sitemap = set(re.findall(r"<loc>([^<]+)</loc>", sm))
persona_urls = sorted(u for u in sitemap if "/personas" in u)
paths = [re.sub(r"^https?://[^/]+", "", u) for u in persona_urls]

_, llms = get("/llms.txt")
llms_urls = set(re.findall(r"https?://[^)\s]+/personas[^)\s]*", llms))

pages, inbound = {}, defaultdict(set)
fails, warns = [], []

for p in paths:
    try:
        code, h = get(p)
    except urllib.error.HTTPError as e:
        fails.append(f"{p} HTTP {e.code}")
        continue
    body = text_of(h)
    ld = jsonld(h)
    types = [d.get("@type") for d in ld]
    links = set(re.findall(r'href="(/personas[^"#?]*)"', h))
    for l in links:
        if l.rstrip("/") != p.rstrip("/"):
            inbound[l.rstrip("/")].add(p)
    title = (re.search(r"<title>(.*?)</title>", h, re.S) or [None, ""])[1]
    desc = (re.search(r'<meta name="description" content="(.*?)"', h, re.S) or [None, ""])[1]
    canon = (re.search(r'<link rel="canonical" href="(.*?)"', h, re.S) or [None, ""])[1]
    h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", h, re.S)
    pages[p] = dict(code=code, bytes=len(h), words=len(body.split()), title=html.unescape(title),
                    desc=html.unescape(desc), canon=canon, h1=len(h1s), types=types,
                    outlinks=len(links), og=bool(re.search(r'property="og:title"', h)))

    if code != 200: fails.append(f"{p} HTTP {code}")
    if not title: fails.append(f"{p} no <title>")
    if not desc: fails.append(f"{p} no meta description")
    if not canon: fails.append(f"{p} no canonical")
    if len(h1s) != 1: fails.append(f"{p} has {len(h1s)} h1")
    if not ld: fails.append(f"{p} no JSON-LD")
    if "PARSE_ERROR" in types: fails.append(f"{p} invalid JSON-LD")
    if "BreadcrumbList" not in types: fails.append(f"{p} no BreadcrumbList")
    if len(body.split()) < 250: fails.append(f"{p} only {len(body.split())} words rendered server-side")
    if len(html.unescape(title)) > 65: warns.append(f"{p} title {len(html.unescape(title))} chars")
    if not pages[p]["og"]: warns.append(f"{p} no og:title")
    if f"{BASE}{p}".replace(BASE, "https://venkatapagadala.com") not in llms_urls and p not in ("/personas/us-dad-30-49-three-row-suv",):
        warns.append(f"{p} not in llms.txt")

orphans = [p for p in paths if not inbound.get(p.rstrip("/"))]
for o in orphans:
    fails.append(f"{o} ORPHAN: no internal link points to it")

print(f"BASE {BASE}")
print(f"pages audited        {len(pages)}")
print(f"in sitemap           {len(persona_urls)}")
print(f"in llms.txt          {len([p for p in paths if 'https://venkatapagadala.com'+p in llms_urls])}")
print(f"median words (SSR)   {sorted(v['words'] for v in pages.values())[len(pages)//2] if pages else 0}")
print(f"median inbound links {sorted(len(inbound.get(p.rstrip('/'), ())) for p in paths)[len(paths)//2]}")
sc = defaultdict(int)
for v in pages.values():
    for t in v["types"]: sc[t] += 1
print("schema types         " + ", ".join(f"{k}×{v}" for k, v in sorted(sc.items(), key=lambda x: -x[1])))
print()
if fails:
    print(f"FAIL ({len(fails)})")
    for f in fails[:25]: print("  x " + f)
else:
    print("FAIL (0)")
if warns:
    print(f"\nWARN ({len(warns)})")
    for w in warns[:20]: print("  ! " + w)
sys.exit(1 if fails else 0)
