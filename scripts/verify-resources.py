#!/usr/bin/env python3
"""verify-resources.py: prove every curated encyclopedia resource is alive.

Usage: python3 scripts/verify-resources.py [--sample N]

Reads src/data/encyclopediaResources.ts, extracts every URL, and checks:
  - YouTube videos: oEmbed answers, or the watch page carries the expected
    title (some elite channels disable embedding; the link is still good).
  - Guides: HTTP 200 after redirects, still on the same host.
Exit 1 if anything is dead, printing exactly what and where. Run before
any deploy that touches the encyclopedia, and re-run quarterly: link rot
is real and this file is the detector.
"""
import json
import random
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

SRC = "src/data/encyclopediaResources.ts"
CONCEPTS_SRC = "src/data/aiEncyclopedia.ts"

def read_entries():
    t = open(SRC, encoding="utf-8").read()
    vids = re.findall(r'\{ title: ("(?:[^"\\]|\\.)*"), url: ("(?:[^"\\]|\\.)*"), channel: ("(?:[^"\\]|\\.)*") \}', t)
    guides = re.findall(r'\{ title: ("(?:[^"\\]|\\.)*"), url: ("(?:[^"\\]|\\.)*"), brand: ("(?:[^"\\]|\\.)*") \}', t)
    v = [(json.loads(a), json.loads(b)) for a, b, _ in vids]
    g = [(json.loads(a), json.loads(b)) for a, b, _ in guides]
    return v, g

def read_learn_more():
    """The concepts' own learnMore links.

    These render as the third resource bucket on every concept page and
    were checked by nothing until now: roughly 400 URLs with no rot
    detector, which is how a reference site quietly fills with 404s.
    """
    t = open(CONCEPTS_SRC, encoding="utf-8").read()
    pairs = re.findall(
        r'\{ title: ("(?:[^"\\]|\\.)*"), url: ("(?:[^"\\]|\\.)*") \}', t)
    return [(json.loads(a), json.loads(b)) for a, b in pairs]


def check_video(item):
    title, url = item
    vid = re.search(r"v=([\w-]{11})", url)
    if not vid:
        return f"BAD VIDEO URL: {url}"
    o = subprocess.run(["curl", "-s", "--max-time", "20",
        f"https://www.youtube.com/oembed?url={url}&format=json"],
        capture_output=True, text=True).stdout
    try:
        json.loads(o)
        return None
    except Exception:
        pass
    w = subprocess.run(["curl", "-s", "--max-time", "20", "-A", "Mozilla/5.0", url],
        capture_output=True, text=True).stdout
    m = re.search(r'<meta name="title" content="([^"]*)"', w)
    if m and m.group(1).strip()[:30] == title.strip()[:30]:
        return None
    return f"DEAD/CHANGED VIDEO: {url} ({title[:50]})"

# Hosts that refuse automated requests with a 403 while serving the page
# normally to a browser. A bot block is not link rot, and treating it as
# rot trains everyone to ignore the gate. Links on these hosts are reported
# separately as unmachine-checkable, never silently passed: re-open them by
# hand when this file is next audited.
BOT_BLOCKED_HOSTS = {"openai.com", "www.ibm.com", "ibm.com"}


def check_guide(item):
    title, url = item
    host = urlparse(url).netloc.replace("www.", "")
    if host in {h.replace("www.", "") for h in BOT_BLOCKED_HOSTS}:
        return None  # counted separately by main(), not asserted alive
    p = subprocess.run(["curl", "-sk", "-L", "--max-time", "18", "-A",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "-o", "/dev/null",
        "-w", "%{http_code} %{url_effective}", url],
        capture_output=True, text=True)
    try:
        code, final = p.stdout.split(" ", 1)
    except ValueError:
        return f"UNREACHABLE: {url}"
    if code != "200":
        return f"HTTP {code}: {url}"
    if urlparse(final).netloc.replace("www.", "") != urlparse(url).netloc.replace("www.", ""):
        return f"REDIRECTED OFF-HOST: {url} -> {final}"
    return None

def main():
    sample = None
    if "--sample" in sys.argv:
        sample = int(sys.argv[sys.argv.index("--sample") + 1])
    videos, guides = read_entries()
    learn = read_learn_more()
    if sample:
        random.seed(7)
        videos = random.sample(videos, min(sample, len(videos)))
        guides = random.sample(guides, min(sample, len(guides)))
        learn = random.sample(learn, min(sample, len(learn)))
    print(f"checking {len(videos)} videos, {len(guides)} guides, {len(learn)} learnMore links")
    problems = []
    for i, v in enumerate(videos):
        r = check_video(v)
        if r: problems.append(r)
        time.sleep(0.1)
        if (i + 1) % 50 == 0: print(f"  videos {i+1}/{len(videos)}")
    with ThreadPoolExecutor(max_workers=12) as ex:
        for r in ex.map(check_guide, guides):
            if r: problems.append(r)
    with ThreadPoolExecutor(max_workers=12) as ex:
        for r in ex.map(check_guide, learn):
            if r: problems.append(f"[learnMore] {r}")
    skipped = [u for _, u in (guides + learn)
               if urlparse(u).netloc.replace("www.", "")
               in {h.replace("www.", "") for h in BOT_BLOCKED_HOSTS}]
    if problems:
        print(f"\nRESOURCE GATE: FAIL ({len(problems)})")
        for p in problems:
            print("  x", p)
        return 1
    print("\nRESOURCE GATE: PASS, every machine-checkable link is alive")
    if skipped:
        print(f"  note: {len(skipped)} links on hosts that block automation "
              f"({', '.join(sorted(BOT_BLOCKED_HOSTS))}) were NOT machine-checked. "
              "Open them by hand at the next audit.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
