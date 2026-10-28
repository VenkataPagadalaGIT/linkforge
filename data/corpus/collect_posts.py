#!/usr/bin/env python3
"""
Content from official channels into ontology.post: release notes from each
entity's GitHub organisation, and the feeds listed in ontology/post_sources.json
(company blogs, Substack, podcasts). Each row records how it was collected.

  --github SLUGS      releases for these entities' GitHub orgs (comma list, or "all"); free API, 60 calls an hour
                      without GITHUB_TOKEN, so a run covers at most --max-calls (default 40)
  --feeds             every RSS/Atom feed in ontology/post_sources.json (free)
  --reddit SLUGS      public threads naming the entity, from Reddit's JSON endpoint (free, needs REDDIT_UA="app:name:version (by u/you)")
  --dry-run           print, write nothing

Not here, on purpose: LinkedIn and X. Direct scraping breaks their terms; the
route is Bright Data's licensed datasets or MCP Scraper, which cost money and
run only after the paid-call preflight is approved. Personal profiles are
never collected; people enter the graph in public roles from official sources.

Validation (typing each post into a dated statement with its quote) runs
through OpenRouter in validate_posts.py, also behind the preflight.
"""
import datetime as dt, json, os, re, sys, time, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "ontology", "post_sources.json")
GH_TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
PRE = re.compile(r"[-.](rc|alpha|beta|dev|pre)[.\-]?[0-9]", re.I)
calls = 0
MAX_CALLS = int(sys.argv[sys.argv.index("--max-calls") + 1]) if "--max-calls" in sys.argv else 40


def lit(v):
    if v is None or v == "":
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def get_json(url, headers=None):
    global calls
    calls += 1
    if calls > MAX_CALLS:
        raise SystemExit(f"stopped at {MAX_CALLS} calls (--max-calls raises it)")
    h = {"User-Agent": "mono-mind-ai-graph (official-channel collector)", **(headers or {})}
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def post_row(entity_slug, platform, url, title, author, published_on, retrieval, summary):
    return ("INSERT INTO ontology.post (entity_id, platform, url, title, author, published_on, retrieval, summary)"
            f" SELECT e.id, {lit(platform)}, {lit(url)}, {lit(title)}, {lit(author)}, {lit(published_on)}, {lit(retrieval)}, {lit(summary)}"
            f" FROM ontology.entity e WHERE e.slug={lit(entity_slug)}"
            " ON CONFLICT (url) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, retrieved_at=now();")


def github(slugs, dry):
    ents = query("SELECT slug, github FROM ontology.entity WHERE github IS NOT NULL" + ("" if slugs == ["all"] else " AND slug IN (" + ",".join(lit(s) for s in slugs) + ")"))
    headers = {"Accept": "application/vnd.github+json", **({"Authorization": f"Bearer {GH_TOKEN}"} if GH_TOKEN else {})}
    st, n = [], 0
    for slug, gh in ents:
        m = re.match(r"https?://github\.com/([^/]+)(?:/([^/]+))?", gh or "")
        if not m:
            continue
        org, repo = m.group(1), m.group(2)
        try:
            repos = [repo] if repo else [r["name"] for r in get_json(f"https://api.github.com/orgs/{org}/repos?sort=pushed&per_page=4&type=public", headers)]
            for r in repos:
                for rel in get_json(f"https://api.github.com/repos/{org}/{r}/releases?per_page=5", headers):
                    # Drafts and pre-releases (rc, alpha, beta, dev builds) are noise for an intelligence feed.
                    if rel.get("draft") or rel.get("prerelease") or PRE.search(rel.get("tag_name") or ""):
                        continue
                    title = f"{r} {rel.get('tag_name') or ''}: {rel.get('name') or ''}".strip(": ")
                    st.append(post_row(slug, "github", rel["html_url"], title[:200], (rel.get("author") or {}).get("login"), (rel.get("published_at") or "")[:10] or None,
                                       "github-api", (rel.get("body") or "")[:600]))
                    n += 1
        except Exception as e:  # noqa: BLE001
            print(f"  {slug}: {str(e)[:80]}")
            if "403" in str(e) or "429" in str(e):
                print("  GitHub rate limit reached: set GITHUB_TOKEN for 5,000 calls an hour")
                break
        print(f"{slug}: {n} releases so far ({calls} calls)")
    if dry:
        print(f"dry run: {n} posts not written")
    elif st:
        sql("\n".join(st))
        print(f"wrote {n} github posts")


def feeds(dry):
    import feedparser
    cfg = json.load(open(SOURCES, encoding="utf8")) if os.path.exists(SOURCES) else {}
    st, n = [], 0
    for slug, src in cfg.items():
        for feed in src.get("feeds", []):
            d = feedparser.parse(feed["url"])
            for e in d.entries[:20]:
                pub = e.get("published_parsed") or e.get("updated_parsed")
                day = dt.date(*pub[:3]).isoformat() if pub else None
                st.append(post_row(slug, feed.get("platform", "company_blog"), e.get("link"), (e.get("title") or "")[:200], e.get("author"), day, "rss",
                                   re.sub(r"<[^>]+>", "", e.get("summary") or "")[:600]))
                n += 1
            print(f"{slug}: {feed['url']} -> {len(d.entries)} entries")
    if dry:
        print(f"dry run: {n} posts not written")
    elif st:
        sql("\n".join(st))
        print(f"wrote {n} feed posts")


def reddit(slugs, dry):
    ua = os.environ.get("REDDIT_UA", "").strip()
    if not ua:
        raise SystemExit("REDDIT_UA is not set (Reddit asks for 'platform:app:version (by u/name)'); nothing fetched")
    ents = query("SELECT slug, name FROM ontology.entity WHERE slug IN (" + ",".join(lit(s) for s in slugs) + ")")
    st, n = [], 0
    for slug, name in ents:
        q = urllib.parse.quote(f'"{name.split(" (")[0]}"')
        data = get_json(f"https://www.reddit.com/search.json?q={q}&sort=top&t=month&limit=15", {"User-Agent": ua})
        for c in data.get("data", {}).get("children", []):
            p = c["data"]
            st.append(post_row(slug, "reddit", "https://www.reddit.com" + p["permalink"], p.get("title", "")[:200], p.get("author"),
                               dt.datetime.utcfromtimestamp(p["created_utc"]).date().isoformat(), "reddit-json", f"r/{p.get('subreddit')} · {p.get('score')} points · {p.get('num_comments')} comments"))
            n += 1
        time.sleep(2)
        print(f"{slug}: {n} threads")
    if dry:
        print(f"dry run: {n} posts not written")
    elif st:
        sql("\n".join(st))
        print(f"wrote {n} reddit posts")


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    if "--github" in sys.argv:
        github(sys.argv[sys.argv.index("--github") + 1].split(","), dry)
    if "--feeds" in sys.argv:
        feeds(dry)
    if "--reddit" in sys.argv:
        reddit(sys.argv[sys.argv.index("--reddit") + 1].split(","), dry)
    if not any(a in sys.argv for a in ("--github", "--feeds", "--reddit")):
        print(__doc__)
