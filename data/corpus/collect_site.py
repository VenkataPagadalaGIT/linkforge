#!/usr/bin/env python3
"""
The company's own record, birth to now: every dated page in the sitemap
sections listed in ontology/site_sources.json (newsroom, research). For each
page, its title and the publish date the page itself states (JSON-LD
datePublished or article:published_time). Free; one request a second; robots
checked per site. Pages already stored with a date are skipped unless
--refresh.

Run: python3 collect_site.py [--only entity] [--refresh] [--limit N]
"""
import html, json, os, re, sys, time, urllib.error, urllib.request, urllib.robotparser
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
SITES = json.load(open(os.path.join(HERE, "ontology", "site_sources.json"), encoding="utf8"))["sites"]
UA = "mono-mind-ai-graph (company newsroom timeline; contact via venkatapagadala.com)"


def get(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(int(e.headers.get("Retry-After") or 0) or 20 * (attempt + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if attempt < 3:
                time.sleep(10 * (attempt + 1))
                continue
            raise


def lit(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


def page_meta(raw):
    title = re.search(r'<meta property="og:title" content="([^"]*)"', raw) or re.search(r"<title>(.*?)</title>", raw, re.S)
    t = html.unescape(title.group(1)).strip() if title else None
    if t:
        t = re.sub(r"\s*\\\s*Anthropic$", "", t)
    d = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})', raw) or re.search(r'article:published_time"\s+content="(\d{4}-\d{2}-\d{2})', raw)
    return t, d.group(1) if d else None


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    refresh = "--refresh" in sys.argv
    for site in SITES:
        if only and site["entity"] != only:
            continue
        base = re.match(r"https?://[^/]+", site["sitemap"]).group(0)
        # Read robots.txt with our own user agent: the parser's default agent can be refused, which it treats as "disallow all".
        rp = urllib.robotparser.RobotFileParser()
        rp.parse(get(base + "/robots.txt").splitlines())
        locs = re.findall(r"<loc>([^<]+)</loc>", get(site["sitemap"]))
        want = [u for u in locs if any(re.match(rf"{re.escape(base)}/{s}/[^/]+/?$", u) for s in site["sections"]) and rp.can_fetch(UA, u)]
        have = {r[0] for r in query(f"SELECT url FROM ontology.site_page WHERE published_on IS NOT NULL")} if not refresh else set()
        todo = [u for u in want if u not in have][: limit or None]
        print(f"{site['entity']}: {len(locs)} sitemap URLs, {len(want)} in {', '.join(site['sections'])}, {len(todo)} to read")
        n = 0
        for u in todo:
            try:
                title, day = page_meta(get(u))
            except Exception as e:  # noqa: BLE001
                print("  failed:", u, str(e)[:60])
                continue
            section = u[len(base) + 1:].split("/")[0]
            sql("INSERT INTO ontology.site_page (entity_id, url, section, title, published_on)"
                f" VALUES ((SELECT id FROM ontology.entity WHERE slug={lit(site['entity'])}), {lit(u)}, {lit(section)}, {lit(title)}, {lit(day)})"
                " ON CONFLICT (url) DO UPDATE SET title=EXCLUDED.title, published_on=EXCLUDED.published_on, retrieved_at=current_date;")
            n += 1
            if n % 50 == 0:
                print(f"  {n}/{len(todo)}")
            time.sleep(1)
        c = query(f"SELECT count(*), count(published_on), COALESCE(min(published_on)::text,'-'), COALESCE(max(published_on)::text,'-') FROM ontology.site_page sp JOIN ontology.entity e ON e.id=sp.entity_id WHERE e.slug={lit(site['entity'])}")[0]
        print(f"{site['entity']}: pages stored {c[0]}, dated {c[1]}, from {c[2]} to {c[3]}")


if __name__ == "__main__":
    main()
