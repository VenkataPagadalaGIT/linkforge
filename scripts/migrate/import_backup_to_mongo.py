#!/usr/bin/env python3
"""
Import a Mono Mind content backup (produced from the live /api endpoints) into a
target MongoDB — e.g. a new Railway-hosted Mongo, as part of migrating off
Emergent.

Collection names match exactly what backend/server.py reads:
  contributors, ai_updates, pillars, posts, conference_notes

Usage:
  export MONGO_URL="mongodb://...railway..."      # target DB connection string
  export DB_NAME="monomind"                       # target database name
  export BACKUP_DIR="/path/to/monomind_backup_YYYYMMDD-HHMMSS"
  python3 import_backup_to_mongo.py [--wipe] [--dry-run]

Safe by default: upserts by natural key (id/slug/session_id); never drops a
collection unless you pass --wipe. Read the backup, report a plan, then write.
"""
import os, sys, json

try:
    import pymongo
except ImportError:
    sys.exit("pymongo not installed. Run: pip install pymongo")

WIPE = "--wipe" in sys.argv
DRY = "--dry-run" in sys.argv

BACKUP_DIR = os.environ.get("BACKUP_DIR")
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

if not BACKUP_DIR or not os.path.isdir(BACKUP_DIR):
    sys.exit(f"Set BACKUP_DIR to a valid backup folder (got: {BACKUP_DIR!r})")
if not DRY and (not MONGO_URL or not DB_NAME):
    sys.exit("Set MONGO_URL and DB_NAME (or use --dry-run to preview only)")


def load(name):
    fp = os.path.join(BACKUP_DIR, f"{name}.json")
    if not os.path.exists(fp):
        return None
    with open(fp) as f:
        return json.load(f)


# Map backup file -> (target collection, natural key for upsert)
PLAN = [
    ("contributors", "contributors", "id"),
    ("updates", "ai_updates", "slug"),
    ("pillars", "pillars", "slug"),
    ("posts", "posts", "slug"),
]


def docs_for(name):
    data = load(name)
    return data if isinstance(data, list) else []


def conference_docs():
    """conference_notes_public.json is {conference_slug: [notes...]}."""
    data = load("conference_notes_public")
    out = []
    if isinstance(data, dict):
        for _slug, notes in data.items():
            if isinstance(notes, list):
                out.extend(notes)
    return out


def main():
    print(f"Backup:  {BACKUP_DIR}")
    print(f"Target:  {DB_NAME} @ {'<dry-run>' if DRY else MONGO_URL.split('@')[-1][:40]}")
    print(f"Mode:    {'WIPE+import' if WIPE else 'upsert'}{' (DRY RUN)' if DRY else ''}\n")

    tasks = [(coll, key, docs_for(fname)) for fname, coll, key in PLAN]
    tasks.append(("conference_notes", "session_id", conference_docs()))

    print("Plan:")
    for coll, key, docs in tasks:
        print(f"  {coll:<18} {len(docs):>4} docs  (upsert key: {key})")
    print()

    if DRY:
        print("Dry run — no writes performed.")
        return

    client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    db = client[DB_NAME]

    for coll, key, docs in tasks:
        c = db[coll]
        if WIPE:
            c.delete_many({})
        n = 0
        for d in docs:
            d.pop("_id", None)  # never carry source _id
            kv = d.get(key)
            if kv is None:
                c.insert_one(d)
            else:
                c.replace_one({key: kv}, d, upsert=True)
            n += 1
        print(f"  {coll:<18} wrote {n} docs (now {c.count_documents({})})")

    print("\nDone. NOTE: admin_users, contact_submissions, newsletter_subscribers")
    print("are NOT in this content backup — handle those separately at cutover.")


if __name__ == "__main__":
    main()
