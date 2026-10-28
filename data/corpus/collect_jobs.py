#!/usr/bin/env python3
"""
Hiring signals: every open role on each company's public job board
(ontology/job_boards.json) into ontology.job_posting. Greenhouse, Ashby and
Lever publish these boards as APIs for embedding on careers pages; one call
per board, no key, no cost. People are never collected: a posting is a role,
not a person.

Each run upserts what is on the board (last_seen = today, closed_on cleared)
and closes what dropped off since the last run (closed_on = today), so weekly
counts of new and closed roles come from history, not guesses.

Run: python3 collect_jobs.py [--only entity,entity] [--dry-run]
"""
import json, os, re, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
BOARDS = json.load(open(os.path.join(HERE, "ontology", "job_boards.json"), encoding="utf8"))["boards"]
UA = "mono-mind-ai-graph (public job boards; contact via venkatapagadala.com)"


def lit(v):
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def day(s):
    return s[:10] if s else None


def split_locs(*names):
    """Every place a posting names, in order, without repeats ("San Francisco, CA | New York City, NY" is two)."""
    out = []
    for n in names:
        for part in re.split(r"\s*(?:\||;|/| or )\s*", n or ""):
            part = part.strip(" ,")
            if part and part not in out:
                out.append(part)
    return out


def workplace_from_text(loc):
    if not loc:
        return None
    if re.search(r"remote[- ]friendly", loc, re.I):
        return "Remote-friendly"
    return "Remote" if re.search(r"\bremote\b", loc, re.I) else None


def postings(board):
    """Normalised postings as dicts: id, title, team, location, locations, workplace, type, url, published."""
    kind, slug = board.split(":", 1)
    if kind == "greenhouse":
        # The departments view carries each role's department without the description text.
        data = get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/departments")
        out, seen = [], set()
        for d in data.get("departments", []):
            for j in d.get("jobs", []):
                if j["id"] in seen:
                    continue
                seen.add(j["id"])
                loc = (j.get("location") or {}).get("name")
                out.append({"id": str(j["id"]), "title": j["title"].strip(), "team": d.get("name"), "location": loc, "locations": split_locs(loc),
                            "workplace": workplace_from_text(loc), "type": None, "url": j.get("absolute_url"),
                            "published": day(j.get("first_published") or j.get("updated_at"))})
        return out
    if kind == "ashby":
        # Ashby sets isRemote on hybrid roles too, so the workplace comes from workplaceType alone.
        data = get(f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=false")
        return [{"id": j["id"], "title": j["title"].strip(), "team": j.get("team") or j.get("department"), "location": j.get("location"),
                 "locations": split_locs(j.get("location"), *[x.get("location") for x in j.get("secondaryLocations") or []]),
                 "workplace": j.get("workplaceType") or workplace_from_text(j.get("location")), "type": j.get("employmentType"),
                 "url": j.get("jobUrl"), "published": day(j.get("publishedAt"))}
                for j in data.get("jobs", []) if j.get("isListed", True)]
    if kind == "lever":
        data = get(f"https://api.lever.co/v0/postings/{slug}?mode=json")
        out = []
        for j in data:
            c = j.get("categories") or {}
            out.append({"id": j["id"], "title": j["text"].strip(), "team": c.get("team"), "location": c.get("location"),
                        "locations": split_locs(c.get("location"), *(c.get("allLocations") or [])),
                        "workplace": {"remote": "Remote", "hybrid": "Hybrid", "on-site": "OnSite"}.get(j.get("workplaceType") or "") or workplace_from_text(c.get("location")),
                        "type": c.get("commitment"), "url": j.get("hostedUrl"),
                        "published": time.strftime("%Y-%m-%d", time.gmtime(j["createdAt"] / 1000)) if j.get("createdAt") else None})
        return out
    raise ValueError("unknown board kind " + kind)


def main():
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    dry = "--dry-run" in sys.argv
    known = {r[0] for r in query("SELECT slug FROM ontology.entity")}
    st = []
    for b in BOARDS:
        if only and b["entity"] not in only:
            continue
        if b["entity"] not in known:
            print("skip, unknown entity:", b["entity"])
            continue
        try:
            rows = postings(b["board"])
        except Exception as e:  # noqa: BLE001
            print(f"{b['entity']}: board {b['board']} failed ({str(e)[:80]}); nothing closed")
            continue
        eid = f"(SELECT id FROM ontology.entity WHERE slug={lit(b['entity'])})"
        st.append(f"INSERT INTO ontology.job_board (entity_id, board, careers_url) VALUES ({eid}, {lit(b['board'])}, {lit(b.get('careers_url'))})"
                  " ON CONFLICT (entity_id) DO UPDATE SET board=EXCLUDED.board, careers_url=EXCLUDED.careers_url;")
        ids = []
        for r in rows:
            ids.append(r["id"])
            locs = "ARRAY[" + ",".join(lit(x) for x in r["locations"]) + "]::text[]" if r["locations"] else "NULL"
            st.append("INSERT INTO ontology.job_posting (entity_id, board, external_id, title, team, location, locations, workplace, remote, employment_type, url, published_on)"
                      f" VALUES ({eid}, {lit(b['board'])}, {lit(r['id'])}, {lit(r['title'])}, {lit(r['team'])}, {lit(r['location'])}, {locs}, {lit(r['workplace'])},"
                      f" {lit(r['workplace'] == 'Remote')}, {lit(r['type'])}, {lit(r['url'])}, {lit(r['published'])})"
                      " ON CONFLICT (board, external_id) DO UPDATE SET title=EXCLUDED.title, team=EXCLUDED.team, location=EXCLUDED.location, locations=EXCLUDED.locations,"
                      " workplace=EXCLUDED.workplace, remote=EXCLUDED.remote, employment_type=EXCLUDED.employment_type, url=EXCLUDED.url, last_seen=current_date, closed_on=NULL;")
        # Roles that dropped off the board since the last run are closed today. Never on an empty answer: a board
        # that suddenly lists nothing is more likely broken than empty, so nothing is closed then.
        if ids:
            st.append(f"UPDATE ontology.job_posting SET closed_on=current_date WHERE board={lit(b['board'])} AND closed_on IS NULL"
                      f" AND external_id NOT IN ({', '.join(lit(x) for x in ids)});")
        print(f"{b['entity']:18} {b['board']:30} open now: {len(rows)}")
        time.sleep(0.5)
    if dry:
        print("dry run: nothing written")
        return
    sql("\n".join(st), timeout=300)
    c = query("SELECT count(*) FILTER (WHERE closed_on IS NULL), count(*) FILTER (WHERE closed_on = current_date), count(*) FROM ontology.job_posting")[0]
    print(f"open roles in DB: {c[0]}  closed today: {c[1]}  ever seen: {c[2]}")


if __name__ == "__main__":
    main()
