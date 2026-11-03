#!/usr/bin/env python3
"""Compare two crawls from scripts/cms/inventory.py field by field (R01 and R02
in docs/NO_DEPLOY_PUBLISHING.md).

Usage: python3 scripts/cms/compare_seo_snapshots.py before.json after.json

Use it around any change to how pages build their metadata: crawl a local
production build before and after, with no SEO overrides published, and every
page must come out the same. Exits 1 and lists the differences otherwise.
"""
import json
import sys

FIELDS = ("status", "title", "description", "canonical", "robots", "h1", "h1Count", "ogImage", "schema", "social")


def load(path):
    return {p["url"]: p for p in json.load(open(path))["pages"]}


before, after = load(sys.argv[1]), load(sys.argv[2])
missing = sorted(set(before) - set(after))
extra = sorted(set(after) - set(before))
diffs = []
for url in sorted(set(before) & set(after)):
    for f in FIELDS:
        if before[url].get(f) != after[url].get(f):
            diffs.append((url, f, before[url].get(f), after[url].get(f)))

print(f"pages before={len(before)} after={len(after)} compared={len(set(before) & set(after))}")
print(f"missing after={len(missing)} new after={len(extra)} field differences={len(diffs)}")
for u in missing[:20]:
    print(f"  missing  {u}")
for u in extra[:20]:
    print(f"  new      {u}")
for url, f, a, b in diffs[:40]:
    print(f"  {url}  {f}: {json.dumps(a)[:120]} -> {json.dumps(b)[:120]}")
sys.exit(1 if missing or extra or diffs else 0)
