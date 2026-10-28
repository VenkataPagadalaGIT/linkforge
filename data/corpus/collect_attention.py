#!/usr/bin/env python3
"""
Public attention, birth to now: how many Hacker News stories have the
company's name in the title, month by month, and the most-discussed threads.
From the Algolia HN Search API, which is free and public. Queries live in
ontology/attention_queries.json; each is a name that means only this company
in a story title. Usernames are not stored.

Run: python3 collect_attention.py [--only entity] [--top 15]
"""
import datetime as dt, json, os, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
Q = json.load(open(os.path.join(HERE, "ontology", "attention_queries.json"), encoding="utf8"))["queries"]
UA = "mono-mind-ai-graph (public attention; contact via venkatapagadala.com)"
API = "https://hn.algolia.com/api/v1/"
# Whole words only: no typo matches, no prefix matches; "-word" in a query excludes a word (advanced syntax).
EXACT = {"typoTolerance": "false", "queryType": "prefixNone", "advancedSyntax": "true"}


def get(path, params):
    url = API + path + "?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(15 * (attempt + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            # A dropped connection is retried, never counted as zero stories.
            if attempt < 3:
                time.sleep(10 * (attempt + 1))
                continue
            raise


def lit(v):
    return "NULL" if v is None else ("'" + str(v).replace("'", "''") + "'")


def months(since):
    y, m = map(int, since.split("-"))
    today = dt.date.today()
    while (y, m) <= (today.year, today.month):
        yield dt.date(y, m, 1)
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)


def ts(d):
    return int(dt.datetime(d.year, d.month, d.day, tzinfo=dt.timezone.utc).timestamp())


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    top = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 15
    for q in Q:
        if only and q["entity"] != only:
            continue
        ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(q['entity'])})"
        st, total = [], 0
        ms = list(months(q["since"]))
        for i, m in enumerate(ms):
            nxt = ms[i + 1] if i + 1 < len(ms) else (dt.date(m.year + (m.month == 12), (m.month % 12) + 1, 1))
            r = get("search", {"query": q["query"], "tags": "story", "restrictSearchableAttributes": "title", "hitsPerPage": 0, **EXACT,
                               "numericFilters": f"created_at_i>={ts(m)},created_at_i<{ts(nxt)}"})
            n = int(r.get("nbHits", 0))
            total += n
            st.append(f"INSERT INTO ontology.attention (entity_id, source, month, items, query) VALUES ({ent}, 'hackernews', {lit(m.isoformat())}, {n}, {lit(q['query'])})"
                      " ON CONFLICT (entity_id, source, month) DO UPDATE SET items=EXCLUDED.items, query=EXCLUDED.query, retrieved_at=current_date;")
            time.sleep(0.25)
        # The most-discussed threads: popularity-ranked search over titles.
        r = get("search", {"query": q["query"], "tags": "story", "restrictSearchableAttributes": "title", "hitsPerPage": top, "numericFilters": "points>50", **EXACT})
        for h in r.get("hits", []):
            url = f"https://news.ycombinator.com/item?id={h['objectID']}"
            dom = urllib.parse.urlparse(h.get("url") or "").netloc.replace("www.", "")
            summary = f"{h.get('points') or 0:,} points · {h.get('num_comments') or 0:,} comments" + (f" · links to {dom}" if dom else "")
            st.append("INSERT INTO ontology.post (entity_id, platform, url, title, author, published_on, retrieval, summary)"
                      f" VALUES ({ent}, 'hackernews', {lit(url)}, {lit((h.get('title') or '')[:200])}, NULL, {lit((h.get('created_at') or '')[:10] or None)}, 'hn-algolia', {lit(summary)})"
                      " ON CONFLICT (url) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, retrieved_at=now();")
        sql("\n".join(st))
        print(f"{q['entity']:18} {q['query']:12} {len(ms)} months, {total:,} stories, {len(r.get('hits', []))} top threads")


if __name__ == "__main__":
    main()
