#!/usr/bin/env python3
"""
Seed ontology.entity and ontology.relation from the July 2026 map file.

Reads src/data/aiOntologyData.ts (the hand-generated AI Systems Map), parses
its node and edge literals, and upserts them with verification = 'unverified'
and seed_order set to their position in the file. Re-running is a no-op for
unchanged rows. Nothing here reads the network.

Run: python3 load_ontology_seed.py [path-to-aiOntologyData.ts]
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "src", "data", "aiOntologyData.ts")
SEED = "src/data/aiOntologyData.ts (July 2026 research, hand-generated, unverified)"


def parse(path):
    s = open(path, encoding="utf8").read()
    i, j = s.find("export const AI_NODES"), s.find("export const AI_EDGES")
    nodes = [json.loads(l.strip().rstrip(",")) for l in s[i:j].split("\n") if l.strip().startswith('{"id"')]
    edges = [json.loads(l.strip().rstrip(",")) for l in s[j:].split("\n") if l.strip().startswith('{"from"')]
    return nodes, edges


def lit(v):
    """SQL literal for a Python value."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def jsonb(v):
    return "NULL" if v is None else lit(json.dumps(v, ensure_ascii=False)) + "::jsonb"


def textarr(v):
    return "NULL" if v is None else "ARRAY[" + ",".join(lit(x) for x in v) + "]::text[]"


nodes, edges = parse(SRC)
head = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, cwd=HERE).stdout.strip()
seed = SEED + (" @ " + head if head else "")

stmts = []
for k, n in enumerate(nodes):
    stmts.append(
        "INSERT INTO ontology.entity (slug,name,type,layer,tagline,story,hq,ticker,website,github,chokepoint,key_facts,related_update_ids,seed_source,seed_order) VALUES ("
        + ",".join([lit(n["id"]), lit(n["name"]), lit(n["type"]), lit(n["layer"]), lit(n["tagline"]), lit(n["story"]),
                    lit(n.get("hq")), lit(n.get("ticker")), lit(n.get("website")), lit(n.get("github")),
                    lit(bool(n.get("chokepoint"))), jsonb(n.get("keyFacts")), textarr(n.get("relatedUpdateIds")), lit(seed), lit(k)])
        + ") ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, type=EXCLUDED.type, layer=EXCLUDED.layer, tagline=EXCLUDED.tagline,"
          " story=EXCLUDED.story, hq=EXCLUDED.hq, ticker=EXCLUDED.ticker, website=EXCLUDED.website, github=EXCLUDED.github,"
          " chokepoint=EXCLUDED.chokepoint, key_facts=EXCLUDED.key_facts, related_update_ids=EXCLUDED.related_update_ids,"
          " seed_source=EXCLUDED.seed_source, seed_order=EXCLUDED.seed_order, updated_at=now()"
          " WHERE ontology.entity.verification = 'unverified';")

for k, e in enumerate(edges):
    stmts.append(
        "INSERT INTO ontology.relation (from_id,to_id,relation,note,seed_source,seed_order)"
        " SELECT f.id, t.id, " + lit(e["relation"]) + ", " + lit(e.get("note")) + ", " + lit(seed) + ", " + lit(k)
        + " FROM ontology.entity f, ontology.entity t WHERE f.slug=" + lit(e["from"]) + " AND t.slug=" + lit(e["to"])
        + " ON CONFLICT (from_id,to_id,relation) DO UPDATE SET note=EXCLUDED.note, seed_source=EXCLUDED.seed_source,"
          " seed_order=EXCLUDED.seed_order, updated_at=now() WHERE ontology.relation.verification = 'unverified';")

sql("\n".join(stmts))
ne = query("SELECT count(*) FROM ontology.entity")[0][0]
nr = query("SELECT count(*) FROM ontology.relation")[0][0]
print(f"parsed {len(nodes)} nodes, {len(edges)} edges; table counts: entity={ne} relation={nr}")
if int(ne) < len(nodes) or int(nr) < len(edges):
    raise SystemExit("LOAD INCOMPLETE")
