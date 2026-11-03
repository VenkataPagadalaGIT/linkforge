#!/usr/bin/env python3
"""check-event-schema.py: one correct Event per Conference Notebook page.

Usage: python3 scripts/check-event-schema.py --base http://127.0.0.1:3000

Born from two defects that shipped together: every conference and session
page carried two Event blocks that disagreed (the view's copy used a date like
"Monday, April 27, 2026" and the organizer's site as the event URL), and the
session route read a `venue` field the data no longer has, so every session
was placed in a city instead of its venue. For every conference and session
page in sitemap.xml this fails the deploy unless:

  - there is exactly one top-level Event, whose url is the page itself;
  - startDate is ISO 8601 (date or date-time);
  - location is a Place named for the conference's venue, with a PostalAddress
    carrying addressLocality and addressCountry;
  - on a conference page, every subEvent has a name, its own url, an ISO
    startDate and a location.
"""
import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:3000")
B = ap.parse_args().base.rstrip("/")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?$")

def get(path):
    try:
        r = urllib.request.urlopen(urllib.request.Request(B + path, headers={"User-Agent": "qa"}), timeout=60)
        return r.status, r.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""

fails = []
def check(label, cond, detail=""):
    if not cond:
        print(f"FAIL  {label}  [{detail}]")
        fails.append(label)
    return cond

proc = subprocess.run(["npx", "tsx", "-e", 'import { conferences } from "./src/data/conferences"; console.log(JSON.stringify(Object.fromEntries(conferences.map(c => [c.slug, c.venues?.[0]?.name ?? `${c.city}, ${c.country}`]))));'], capture_output=True, text=True)
if proc.returncode != 0:
    print(proc.stderr[-2000:]); sys.exit(1)
venue = json.loads(proc.stdout.strip().splitlines()[-1])

xml = get("/sitemap.xml")[1]
paths = sorted({urlparse(u).path for u in re.findall(r"<loc>([^<]+)</loc>", xml)})
pages = [p for p in paths if re.fullmatch(r"/notebook/conference/[^/]+(/sessions/[^/]+)?", p) and p.split("/")[3] in venue]

def audit(path):
    st, html = get(path)
    if st != 200:
        return path, [f"HTTP {st}"]
    nodes = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        d = json.loads(block)
        nodes += d if isinstance(d, list) else [d]
    events = [n for n in nodes if isinstance(n, dict) and n.get("@type") == "Event"]
    problems = []
    if len(events) != 1:
        return path, [f"{len(events)} top-level Events, expected 1"]
    e = events[0]
    if urlparse(e.get("url", "")).path != path:
        problems.append(f"url is {e.get('url')}")
    if not ISO.match(str(e.get("startDate", ""))):
        problems.append(f"startDate {e.get('startDate')!r} is not ISO 8601")
    loc = e.get("location") or {}
    addr = loc.get("address") if isinstance(loc, dict) else None
    slug = path.split("/")[3]
    if not (isinstance(loc, dict) and loc.get("@type") == "Place" and loc.get("name") == venue[slug]):
        problems.append(f"location {json.dumps(loc)[:90]} is not the venue {venue[slug]!r}")
    if not (isinstance(addr, dict) and addr.get("@type") == "PostalAddress" and addr.get("addressLocality") and addr.get("addressCountry")):
        problems.append("address is not a PostalAddress with locality and country")
    for i, sub in enumerate(e.get("subEvent") or []):
        if not (sub.get("name") and urlparse(sub.get("url", "")).path.startswith(path + "/sessions/") and ISO.match(str(sub.get("startDate", ""))) and sub.get("location")):
            problems.append(f"subEvent {i} ({sub.get('name', '')[:40]}) lacks name, own url, ISO startDate or location")
            break
    return path, problems

with ThreadPoolExecutor(max_workers=16) as ex:
    results = list(ex.map(audit, pages))
for path, problems in results:
    check(path, not problems, "; ".join(problems))
confs = [p for p in pages if "/sessions/" not in p]
print(f"\n{'EVENT SCHEMA GATE: PASS' if not fails else f'EVENT SCHEMA GATE: FAIL ({len(fails)})'} "
      f"({len(confs)} conference pages, {len(pages) - len(confs)} session pages, one valid Event each)")
sys.exit(1 if fails else 0)
