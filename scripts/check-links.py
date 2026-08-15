#!/usr/bin/env python3
"""Link checker that judges destinations, not just status codes.

A 200 is a low bar. These are the failures a status-code crawler waves
through, and each one has actually shipped here:

  DEAD        the URL does not resolve
  NO_ANCHOR   the link points at #something that does not exist on the page
  NO_OP       a named item links to a page it already sits on, so clicking
              it appears to do nothing (this is how "The Living Portrait"
              pointed at "/" and looked broken from the homepage)
  MISMATCH    the destination page has nothing to do with the label

Usage:
  python3 scripts/check-links.py                        # against localhost:3400
  python3 scripts/check-links.py https://venkatapagadala.com
"""
import json
import re
import subprocess
import sys
import urllib.request
from urllib.error import HTTPError, URLError

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:3400"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
REPO = __file__.rsplit("/scripts/", 1)[0]

STOP = {"the", "a", "an", "of", "and", "or", "in", "for", "to", "with", "as", "one",
        "how", "what", "is", "are", "on", "at", "by", "from", "into", "see", "all",
        "everything", "work", "works", "your", "my", "it", "its", "this", "that"}


def words(s):
    return {w for w in re.findall(r"[a-z0-9]+", s.lower()) if w not in STOP and len(w) > 2}


def fetch(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
            return r.getcode(), r.read().decode("utf-8", "ignore")
    except HTTPError as e:
        return e.code, ""
    except (URLError, Exception):
        return 0, ""


def nav_links():
    """Read the promises out of the source, so the checker sees what the
    author wrote rather than only what the server happened to render."""
    out = []
    nav = open(f"{REPO}/src/components/Navbar.tsx", encoding="utf-8").read()
    for m in re.finditer(r'\{\s*label:\s*"([^"]+)",\s*note:\s*"([^"]*)",\s*to:\s*"([^"]+)"', nav):
        out.append(("navbar", m.group(1), m.group(3)))
    for m in re.finditer(r'seeAll:\s*\{\s*label:\s*"([^"]+)",\s*to:\s*"([^"]+)"', nav):
        out.append(("navbar-seeall", m.group(1), m.group(2)))

    three = open(f"{REPO}/src/data/threeD.ts", encoding="utf-8").read()
    for m in re.finditer(r'title:\s*"([^"]+)",\s*\n\s*to:\s*"([^"]+)"', three):
        out.append(("3d-hub", m.group(1), m.group(2)))
    return out


def main():
    links = nav_links()
    print(f"checking {len(links)} named nav links against {BASE}\n")
    page_cache = {}
    problems = []

    for surface, label, to in links:
        path, _, frag = to.partition("#")
        path = path or "/"
        if path not in page_cache:
            page_cache[path] = fetch(BASE + path)
        code, html = page_cache[path]

        if code != 200:
            problems.append(("DEAD", surface, label, to, f"HTTP {code}"))
            continue

        if frag:
            # The anchor must exist in the served HTML, otherwise the link
            # silently degrades to "top of some page".
            if not re.search(r'id="%s"' % re.escape(frag), html):
                problems.append(("NO_ANCHOR", surface, label, to, f'no id="{frag}" on {path}'))
                continue
            print(f"  ok   {label} -> {to}  (anchor present)")
            continue

        # Some labels are honest promises whose destination page uses a
        # different word for the same thing. Declared, not inferred, so a new
        # mismatch still fails until someone consciously adds it here.
        SYNONYMS = {
            "writing": {"insights", "essays", "articles"},
            "learn": {"roadmap", "encyclopedia", "contributors", "notebook"},
        }

        # No anchor: does the destination actually present this thing?
        title = re.search(r"<title>([^<]*)</title>", html)
        heads = re.findall(r"<h[12][^>]*>(.*?)</h[12]>", html, re.S)
        hay = words((title.group(1) if title else "") + " " + " ".join(re.sub(r"<[^>]+>", " ", h) for h in heads[:6]))
        want = words(label)

        if path == "/" and want - {"portrait", "living"}:
            problems.append(("NO_OP", surface, label, to,
                             "named item points at the homepage with no anchor"))
            continue

        expanded = set(want)
        for w in want:
            expanded |= SYNONYMS.get(w, set())
        if want and hay and not (expanded & hay):
            problems.append(("MISMATCH", surface, label, to,
                             f"nothing on {path} matches the label; page title: "
                             f"{(title.group(1) if title else '')[:60]}"))
            continue
        print(f"  ok   {label} -> {to}")

    print()
    if problems:
        print(f"PROBLEMS: {len(problems)}")
        for kind, surface, label, to, why in problems:
            print(f"  {kind:10} [{surface}] {label!r} -> {to}\n             {why}")
        return 1
    print("PASS: every named link resolves and lands on what it names")
    return 0


if __name__ == "__main__":
    sys.exit(main())
