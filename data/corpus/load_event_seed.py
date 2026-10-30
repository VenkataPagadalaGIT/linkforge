#!/usr/bin/env python3
"""
Load an event's curated file (events/<slug>.seed.json) into events.event.seed, after checking that every
quote appears word for word in the stored source (events.document.body, whitespace collapsed). One quote
that is not in its source stops the load: the page never shows a sentence its source does not contain.

Run: python3 load_event_seed.py binance-hack-2026
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import sql, q, CONTAINER, DB, USER

HERE = os.path.dirname(os.path.abspath(__file__))
slug = sys.argv[1]
seed = json.load(open(os.path.join(HERE, "events", slug + ".seed.json"), encoding="utf8"))
p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                    f"SELECT COALESCE(jsonb_object_agg(url, body), '{{}}'::jsonb)::text FROM events.document WHERE event_slug={q(slug)} AND body IS NOT NULL"],
                   capture_output=True, text=True)
bodies = {u: re.sub(r"\s+", " ", b) for u, b in json.loads(p.stdout.strip() or "{}").items()}
checks = []
for f in seed.get("facts", []) + seed.get("claims", []):
    checks += [(f["key"], e["url"], e["quote"]) for e in f.get("evidence", [])]
for m in seed.get("moments", []) + seed.get("watch", []):
    checks.append((m.get("label"), m["url"], m["quote"]))
mon = seed.get("money", {})
checks += [(r["chain"], mon["source"], r["quote"]) for r in mon.get("rows", [])]
checks += [(r["who"], r["url"], r["quote"]) for r in mon.get("frozen", [])]
bad = []
for what, url, quote in checks:
    b = bodies.get(url)
    if b is None:
        bad.append(f"{what}: source not stored: {url}")
    elif re.sub(r"\s+", " ", quote) not in b:
        bad.append(f"{what}: quote not found in {url[:70]}: {quote[:90]}")
if bad:
    print("\n".join(bad))
    raise SystemExit(f"{len(bad)} of {len(checks)} quotes failed; nothing loaded")
sql(f"UPDATE events.event SET seed={q(json.dumps(seed, ensure_ascii=False))}::jsonb, summary={q(seed.get('summary'))}, seed_file={q(slug + '.seed.json')}, updated_at=now() WHERE slug={q(slug)};")
print(f"{slug}: {len(checks)} quotes checked word for word against {len(set(u for _, u, _ in checks))} stored sources; seed loaded")
