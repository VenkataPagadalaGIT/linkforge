#!/usr/bin/env python3
"""
Load the corporate groups (ontology/groups.json): each unit's head entity, the
head's display name and tagline where the group changes them, and the words
people search with (entity_alias). Re-running replaces the whole set.

Run: python3 load_ontology_groups.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "ontology", "groups.json"), encoding="utf8"))["groups"]


def lit(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


known = {r[0] for r in query("SELECT slug FROM ontology.entity")}
missing = [s for g in G for s in [g["head"], *g["members"]] if s not in known]
if missing:
    raise SystemExit("unknown slugs: " + ", ".join(missing))
st = ["UPDATE ontology.entity SET parent_slug = NULL WHERE parent_slug IS NOT NULL;", "DELETE FROM ontology.entity_alias;"]
for g in G:
    sets = [f"{col}={lit(g[col])}" for col in ("name", "tagline") if g.get(col)]
    if sets:
        st.append(f"UPDATE ontology.entity SET {', '.join(sets)}, updated_at=now() WHERE slug={lit(g['head'])};")
    st.append(f"UPDATE ontology.entity SET parent_slug={lit(g['head'])}, updated_at=now() WHERE slug IN ({', '.join(lit(m) for m in g['members'])});")
    for a in g.get("aliases", []):
        st.append(f"INSERT INTO ontology.entity_alias (entity_id, alias) SELECT id, {lit(a)} FROM ontology.entity WHERE slug={lit(g['head'])} ON CONFLICT DO NOTHING;")
sql("\n".join(st))
n = query("SELECT count(*) FROM ontology.entity WHERE parent_slug IS NOT NULL")[0][0]
a = query("SELECT count(*) FROM ontology.entity_alias")[0][0]
print(f"groups={len(G)} units={n} aliases={a}")
