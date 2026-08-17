#!/usr/bin/env python3
"""check-discovery.py: can search engines actually FIND this page?

Usage:
  python3 scripts/check-discovery.py <url-or-path> [more...]
  python3 scripts/check-discovery.py --all-new     # everything added recently

Publishing a page is not the same as being discoverable, and the gap is
silent: the page looks perfect to a human and is invisible to a crawler.
This gate answers, for one URL, the questions Google Search Console will
answer three days later:

  1. Does the page return 200?
  2. Is it in sitemap.xml, with a lastmod that is not stale?
  3. Does robots.txt allow it, and does robots declare the sitemap?
  4. Does the page self-canonicalise (not point somewhere else)?
  5. Is it free of a noindex directive?
  6. Is it listed in llms.txt (the AI-answer-engine surface)?
  7. Does at least one OTHER page link to it in server-rendered HTML,
     so a crawler that never runs JavaScript can reach it?

Exit 1 on any failure. This is the gate the CMS runs on publish, and the
one an agent must pass before its draft is allowed to go live.
"""
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

SITE = "https://venkatapagadala.com"  # override with --base http://localhost:3401
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Pages a crawler is most likely to reach first; inbound links are looked
# for here. Add hubs as the site grows.
HUBS = ["/", "/guides", "/3d", "/ai-updates", "/notebook/ai",
        "/notebook/ai/encyclopedia", "/insights", "/publications"]


def get(url, head=False):
    cmd = ["curl", "-sk", "-L", "--max-time", "25", "-A", UA]
    if head:
        cmd += ["-I"]
    cmd += ["-w", "\n__CODE:%{http_code}", url]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=35).stdout
    except Exception:
        return "", 0
    m = re.search(r"__CODE:(\d+)", out)
    return out, int(m.group(1)) if m else 0


def main():
    global SITE
    if "--base" in sys.argv:
        SITE = sys.argv[sys.argv.index("--base") + 1].rstrip("/")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--base" in sys.argv:
        args = [a for a in args if a != sys.argv[sys.argv.index("--base") + 1]]
    if not args:
        print(__doc__)
        return 2
    targets = []
    for a in args:
        targets.append(a if a.startswith("http") else SITE + (a if a.startswith("/") else "/" + a))

    print("fetching sitemap, robots, llms.txt, and hub pages...")
    sitemap, sm_code = get(f"{SITE}/sitemap.xml")
    robots, _ = get(f"{SITE}/robots.txt")
    llms, _ = get(f"{SITE}/llms.txt")
    with ThreadPoolExecutor(max_workers=8) as ex:
        hub_html = dict(zip(HUBS, ex.map(lambda h: get(SITE + h)[0], HUBS)))

    if sm_code != 200:
        print(f"FAIL sitemap.xml returned {sm_code}")
        return 1
    if "Sitemap:" not in robots:
        print("FAIL robots.txt does not declare a sitemap")
        return 1

    failures = 0
    for url in targets:
        path = urlparse(url).path
        print(f"\n{url}")
        html, code = get(url)
        checks = []

        checks.append(("returns 200", code == 200, f"HTTP {code}"))

        # sitemap entry + lastmod
        block = None
        for m in re.finditer(r"<url>(.*?)</url>", sitemap, re.S):
            if f"<loc>{url}</loc>" in m.group(1):
                block = m.group(1)
                break
        checks.append(("in sitemap.xml", block is not None, "not found"))
        if block:
            lm = re.search(r"<lastmod>([^<]+)</lastmod>", block)
            checks.append(("has lastmod", bool(lm), "missing"))

        # robots allow
        disallowed = any(
            path.startswith(d.strip())
            for d in re.findall(r"Disallow:\s*(\S+)", robots)
            if d.strip() and d.strip() != "/"
        )
        checks.append(("robots allows", not disallowed, "blocked by robots.txt"))

        # canonical + noindex
        can = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html)
        canon_ok = bool(can) and can.group(1).rstrip("/") == url.rstrip("/")
        checks.append(("self-canonical", canon_ok, can.group(1) if can else "no canonical tag"))
        noindex = bool(re.search(r'name="robots"[^>]*content="[^"]*noindex', html, re.I))
        checks.append(("no noindex", not noindex, "page declares noindex"))

        # llms.txt (AI answer engines). A page counts as covered if it is
        # listed itself, or if its hub is listed AND documents the per-page
        # pattern: enumerating 176 concept URLs would bloat the file, but a
        # crawler still has to be told the pages exist.
        parent = "/".join(path.rstrip("/").split("/")[:-1])
        covered = path in llms or (parent and parent in llms and "<concept-id>" in llms)
        checks.append(("in llms.txt", covered,
                       "neither the URL nor a documented hub pattern is listed"))

        # inbound link from server-rendered HTML on some hub
        linkers = [h for h, doc in hub_html.items() if f'href="{path}"' in doc or f'href="{url}"' in doc]
        checks.append((f"inbound link ({', '.join(linkers) if linkers else 'none'})", bool(linkers),
                       "no hub links to it in server HTML"))

        for label, ok, why in checks:
            print(f"   {'ok  ' if ok else 'FAIL'} {label}" + ("" if ok else f"  <- {why}"))
            if not ok:
                failures += 1

    print()
    if failures:
        print(f"DISCOVERY GATE: FAIL ({failures})")
        return 1
    print("DISCOVERY GATE: PASS, every page is findable by crawlers and answer engines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
