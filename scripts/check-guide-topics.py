#!/usr/bin/env python3
"""check-guide-topics.py: prove the guide-topic taxonomy has no orphans.

Usage: python3 scripts/check-guide-topics.py --base http://127.0.0.1:3000

This is a LIVE check against a running server, not the TS data model: it
proves what a crawler or an agent actually receives, not what the source
intends. It fails the deploy if any of these break:

  1. Every guide has at least one tag (an untagged guide is invisible to the
     whole topic layer, which is the definition of an orphan here).
  2. /guides links to every topic hub (the one page every future guide's
     topics are reachable from, so the guarantee holds no matter how many
     guides get added later).
  3. Every topic hub returns 200, is in the sitemap, links back to /guides,
     and lists a real link to every guide that carries that tag (and no
     guide that doesn't).
  4. Every guide's own page links each of its tags to the matching hub, so a
     reader (or crawler) reaches "everything else like this" from EITHER
     direction: guide -> topic, or topic -> guide.
  5. A slug that doesn't exist hard-404s rather than soft-404ing at HTTP 200.
"""
import argparse
import re
import sys
import urllib.request

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "qa"})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        return r.status, r.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")

def topic_slug(tag):
    s = tag.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:3000")
args = ap.parse_args()
B = args.base.rstrip("/")

fails = []
def check(label, cond, detail=""):
    print(("ok    " if cond else "FAIL  ") + label + (f"  [{detail}]" if detail else ""))
    if not cond: fails.append(label)

# Pull the guide list straight from the data module so this gate needs no
# hand-maintained fixture and can never drift from what actually ships.
import json
import subprocess

proc = subprocess.run(
    ["npx", "tsx", "-e", 'import { guides } from "./src/data/guides"; console.log(JSON.stringify(guides.map(g => ({ slug: g.slug, tags: g.tags }))));'],
    capture_output=True, text=True,
)
if proc.returncode != 0:
    print(proc.stderr[-4000:])
    sys.exit(1)
guide_rows = json.loads(proc.stdout.strip().splitlines()[-1])

for g in guide_rows:
    check(f"guide '{g['slug']}' has at least one tag", len(g["tags"]) > 0, str(g["tags"]))

topics = {}
for g in guide_rows:
    for tag in g["tags"]:
        topics.setdefault(topic_slug(tag), {"label": tag, "guides": []})["guides"].append(g["slug"])

st, guides_html = get(B + "/guides")
check("/guides is reachable", st == 200)
for slug, t in topics.items():
    check(f"/guides links to topic hub '{slug}'", f'/guides/topics/{slug}' in guides_html)

check("no guide uses the reserved slug 'topics'", all(g["slug"] != "topics" for g in guide_rows))
check("/guides links to the A to Z topics page", 'href="/guides/topics"' in guides_html)
st_az, az_html = get(B + "/guides/topics")
check("/guides/topics (A to Z) returns 200", st_az == 200)
for slug in topics:
    check(f"A to Z page links to hub '{slug}'", f'/guides/topics/{slug}"' in az_html)

st_sm, sitemap = get(B + "/sitemap.xml")
check("sitemap lists /guides/topics", "/guides/topics</loc>" in sitemap)
for slug in topics:
    check(f"sitemap lists /guides/topics/{slug}", f"/guides/topics/{slug}</loc>" in sitemap)

for slug, t in topics.items():
    st_h, html = get(B + f"/guides/topics/{slug}")
    ok = st_h == 200
    check(f"topic hub /guides/topics/{slug} returns 200", ok)
    if not ok: continue
    check(f"hub '{slug}' links back to /guides", 'to="/guides"' in html or 'href="/guides"' in html)
    for gs in t["guides"]:
        check(f"hub '{slug}' links to guide '{gs}'", f'/guides/{gs}"' in html)
    # every OTHER guide must be absent from this hub's guide links
    other = [g["slug"] for g in guide_rows if g["slug"] not in t["guides"]]
    leaked = [gs for gs in other if re.search(rf'href="[^"]*?/guides/{re.escape(gs)}"', html)]
    check(f"hub '{slug}' lists only its own guides", not leaked, str(leaked))

for g in guide_rows:
    st_g, html = get(B + f"/guides/{g['slug']}")
    check(f"guide '{g['slug']}' is reachable", st_g == 200)
    for tag in g["tags"]:
        slug = topic_slug(tag)
        check(f"guide '{g['slug']}' links its tag '{tag}' to the hub", f'/guides/topics/{slug}"' in html)

st_bad, _ = get(B + "/guides/topics/this-topic-does-not-exist")
check("an unknown topic slug hard-404s", st_bad == 404, str(st_bad))

n = len(fails)
print(f"\n{'GUIDE TOPICS GATE: PASS' if not fails else f'GUIDE TOPICS GATE: FAIL ({n})'} "
      f"({len(guide_rows)} guides, {len(topics)} topics, every guide reachable both ways, no orphans)")
sys.exit(1 if fails else 0)
