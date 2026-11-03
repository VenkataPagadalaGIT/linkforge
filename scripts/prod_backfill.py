"""Additive backfill of prod Mongo from seed_data/content.json.

Run INSIDE the deployed backend container (railway ssh), where MONGO_URL /
DB_NAME are in the environment and seed_data/content.json is baked into the
image. Never deletes anything:
  - conference_notes: insert missing (by session_id); update an existing note
    only when the seed text differs AND the prod copy is not newer.
  - contributors / ai_updates / pillars / posts: insert missing by the same
    unique keys the server's own seeder uses; existing docs untouched.
"""
import json
import os

from pymongo import MongoClient

client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

with open("seed_data/content.json") as f:
    seed = json.load(f)

report = {}

ins = upd = skipped = 0
notes = db["conference_notes"]
for n in seed.get("conference_notes", []):
    key = {"session_id": n["session_id"]}
    existing = notes.find_one(key)
    if existing is None:
        notes.insert_one(dict(n))
        ins += 1
    elif (existing.get("note") or "") != (n.get("note") or "") and (
        existing.get("updated_at") or ""
    ) <= (n.get("updated_at") or ""):
        notes.update_one(key, {"$set": {k: v for k, v in n.items() if k != "_id"}})
        upd += 1
    else:
        skipped += 1
report["conference_notes"] = {"inserted": ins, "updated": upd, "untouched": skipped}

for coll_name, seed_key, unique in (
    ("contributors", "contributors", "id"),
    ("ai_updates", "updates", "id"),
    ("pillars", "pillars", "id"),
    ("posts", "posts", "id"),
):
    coll = db[coll_name]
    added = 0
    for doc in seed.get(seed_key, []):
        if coll.find_one({unique: doc[unique]}) is None:
            coll.insert_one(dict(doc))
            added += 1
    report[coll_name] = {"inserted": added, "total_now": coll.count_documents({})}

print(json.dumps(report, indent=2))
