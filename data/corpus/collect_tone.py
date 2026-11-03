#!/usr/bin/env python3
"""
News tone: GDELT's average tone of online news that names the company, day by
day for the last three months, with the share of all monitored articles that
mention it. From the GDELT DOC 2.0 API (free; it asks for at most one request
every 5 seconds, so this waits 6 and backs off when told to). GDELT scores
tone from the words in each article (negative below 0, positive above);
it is a measure of coverage, not of opinion research.

Queries reuse ontology/attention_queries.json (the name in quotes).

Run: python3 collect_tone.py [--only entity]
"""
import json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql

HERE = os.path.dirname(os.path.abspath(__file__))
Q = json.load(open(os.path.join(HERE, "ontology", "attention_queries.json"), encoding="utf8"))["queries"]
UA = "mono-mind-ai-graph (news tone; contact via venkatapagadala.com)"
API = "https://api.gdeltproject.org/api/v2/doc/doc?"


def get(params, tries=6):
    url = API + urllib.parse.urlencode(params)
    for attempt in range(tries):
        time.sleep(6)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as r:
                body = r.read().decode("utf8", "replace")
            if body.strip().startswith("Please limit"):
                raise urllib.error.HTTPError(url, 429, "rate", None, None)
            return json.loads(body or "{}")
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == tries - 1:
                raise
            wait = 20 * (attempt + 1)
            print(f"  GDELT asked to slow down; waiting {wait}s")
            time.sleep(wait)
    return {}


def lit(v):
    return "NULL" if v is None else ("'" + str(v).replace("'", "''") + "'")


def series(d):
    out = {}
    for s in d.get("timeline", []):
        for p in s.get("data", []):
            day = re.sub(r"^(\d{4})(\d{2})(\d{2}).*", r"\1-\2-\3", str(p.get("date", "")))
            out[day] = p.get("value")
    return out


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    for q in Q:
        if only and q["entity"] != only:
            continue
        name = q["query"].split(" -")[0]
        query = f'"{name}"'
        try:
            tone = series(get({"query": query, "mode": "timelinetone", "format": "json", "timespan": "3months"}))
            vol = series(get({"query": query, "mode": "timelinevol", "format": "json", "timespan": "3months"}))
        except urllib.error.HTTPError as e:
            # A refused request is not a neutral tone: write nothing and stop asking this run.
            print(f"{q['entity']}: GDELT refused ({e.code}); nothing written, stopping until the next run")
            return
        days = sorted(set(tone) | set(vol))
        if not days:
            print(f"{q['entity']}: GDELT returned no timeline; nothing written")
            continue
        ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(q['entity'])})"
        sql("\n".join(
            f"INSERT INTO ontology.tone (entity_id, source, day, tone, volume, query) VALUES ({ent}, 'gdelt', {lit(d)}, {lit(tone.get(d))}, {lit(vol.get(d))}, {lit(query)})"
            " ON CONFLICT (entity_id, source, day) DO UPDATE SET tone=EXCLUDED.tone, volume=EXCLUDED.volume, retrieved_at=current_date;" for d in days))
        vals = [v for v in tone.values() if v is not None]
        print(f"{q['entity']:18} {query:14} {len(days)} days, average tone {sum(vals) / len(vals):+.2f}" if vals else f"{q['entity']}: {len(days)} days")


if __name__ == "__main__":
    main()
