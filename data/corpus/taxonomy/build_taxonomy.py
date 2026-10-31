"""Build the Knowledge Graph Feeds subject taxonomy: subjects.outline -> checks -> subjects.json (here and public) -> Postgres.

  python3 taxonomy/build_taxonomy.py            check, write JSON, load events.subject and events.event_subject
  python3 taxonomy/build_taxonomy.py --check    check only (exit 1 on any problem); writes nothing

Checks, each a lesson from the telecom classification audit: every id unique; no two siblings share a label; no label
repeated anywhere at L3 and deeper (the "Deals & Promotions" x520 disease); levels step one at a time; every L1 maps to
an IPTC Media Topic; every story's subjects exist and each story has exactly one primary subject.
"""
import glob, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CORPUS = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(CORPUS))
sys.path.insert(0, CORPUS)
from db import CONTAINER, DB, USER  # noqa: E402

LINE = re.compile(r"^(?P<ind> *)(?P<label>[^\[:]+?)(?:\s+\[iptc (?P<iptc>\d{8})\])?(?:\s+::\s+(?P<desc>.+))?\s*$")


def slug(label: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", label.lower().replace("&", " "))).strip("-")


def parse(path: str):
    nodes, stack, problems = [], [], []
    for n, raw in enumerate(open(path, encoding="utf-8"), 1):
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        m = LINE.match(raw.rstrip("\n"))
        if not m:
            problems.append(f"line {n}: cannot read {raw.rstrip()!r}")
            continue
        ind = len(m["ind"])
        if ind % 2:
            problems.append(f"line {n}: indent must be a multiple of two spaces")
            continue
        level = ind // 2 + 1
        if level > len(stack) + 1:
            problems.append(f"line {n}: jumps from L{len(stack)} to L{level}")
            continue
        stack = stack[: level - 1]
        parent = stack[-1] if stack else None
        node = {
            "id": (parent["id"] + "/" if parent else "") + slug(m["label"]),
            "parent": parent["id"] if parent else None,
            "level": level,
            "label": m["label"].strip(),
            "description": (m["desc"] or "").strip() or None,
            "iptc": f"medtop:{m['iptc']}" if m["iptc"] else None,
            "path": (parent["path"] if parent else []) + [m["label"].strip()],
            "sort": len(nodes),
        }
        nodes.append(node)
        stack.append(node)
    return nodes, problems


def check(nodes, stories):
    problems = []
    ids = {}
    for x in nodes:
        if x["id"] in ids:
            problems.append(f"duplicate id {x['id']}")
        ids[x["id"]] = x
        if x["level"] == 1 and not x["iptc"]:
            problems.append(f"L1 {x['label']!r} has no IPTC mapping")
    sib = {}
    for x in nodes:
        key = (x["parent"], x["label"].lower())
        if key in sib:
            problems.append(f"siblings share the label {x['label']!r} under {x['parent']}")
        sib[key] = x
    deep = {}
    for x in nodes:
        if x["level"] >= 3:
            k = x["label"].lower()
            if k in deep:
                problems.append(f"label {x['label']!r} repeats at L3+: {deep[k]['id']} and {x['id']}")
            deep[k] = x
    for f, s in stories.items():
        prim = [t for t in s["subjects"] if t["role"] == "primary"]
        if len(prim) != 1:
            problems.append(f"{f}: needs exactly one primary subject, has {len(prim)}")
        for t in s["subjects"]:
            if t["id"] not in ids:
                problems.append(f"{f}: unknown subject {t['id']}")
            if t["role"] not in ("primary", "secondary"):
                problems.append(f"{f}: role must be primary or secondary ({t['id']})")
            if not (t.get("why") or "").strip():
                problems.append(f"{f}: {t['id']} has no reason")
    return problems


def sql(q: str) -> str:
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"],
                       input=q, capture_output=True, text=True)
    if p.returncode:
        raise SystemExit(f"[taxonomy] psql failed: {p.stderr.strip()}")
    return p.stdout


def lit(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


def main():
    only_check = "--check" in sys.argv
    nodes, problems = parse(os.path.join(HERE, "subjects.outline"))
    stories = {os.path.basename(f): json.load(open(f, encoding="utf-8")) for f in sorted(glob.glob(os.path.join(CORPUS, "events", "*.subjects.json")))}
    problems += check(nodes, stories)
    if problems:
        print("\n".join(f"[taxonomy] {p}" for p in problems))
        raise SystemExit(1)
    by_level = {}
    for x in nodes:
        by_level[x["level"]] = by_level.get(x["level"], 0) + 1
    print(f"[taxonomy] {len(nodes)} subjects, " + ", ".join(f"L{k} {v}" for k, v in sorted(by_level.items())) + f"; {len(stories)} story files")
    if only_check:
        return
    out = {
        "name": "Knowledge Graph Feeds subject taxonomy",
        "version": "1.0",
        "updated": "2026-10-31",
        "levels": max(by_level),
        "note": "L1 follows the IPTC Media Topics top level (CC BY 4.0, https://iptc.org/standards/media-topics/); L2 and deeper are authored for this site.",
        "subjects": [{k: x[k] for k in ("id", "parent", "level", "label", "description", "iptc", "path")} for x in nodes],
    }
    blob = json.dumps(out, ensure_ascii=False, indent=1)
    open(os.path.join(HERE, "subjects.json"), "w", encoding="utf-8").write(blob + "\n")
    pub = os.path.join(REPO, "public", "taxonomy")
    os.makedirs(pub, exist_ok=True)
    open(os.path.join(pub, "subjects.json"), "w", encoding="utf-8").write(blob + "\n")
    sql(open(os.path.join(CORPUS, "events_schema.sql"), encoding="utf-8").read())
    stmts = ["BEGIN;", "DELETE FROM events.event_subject;", "DELETE FROM events.subject;"]
    for x in nodes:
        stmts.append("INSERT INTO events.subject (id, parent_id, level, label, description, iptc, sort) VALUES (" +
                     ", ".join([lit(x["id"]), lit(x["parent"]), str(x["level"]), lit(x["label"]), lit(x["description"]), lit(x["iptc"]), str(x["sort"])]) + ");")
    known = set(r for r in sql("SELECT slug FROM events.event").split())
    for f, s in stories.items():
        if s["event"] not in known:
            print(f"[taxonomy] {f}: event {s['event']} is not loaded yet; skipped")
            continue
        for i, t in enumerate(s["subjects"]):
            stmts.append("INSERT INTO events.event_subject (event_slug, subject_id, role, why, sort) VALUES (" +
                         ", ".join([lit(s["event"]), lit(t["id"]), lit(t["role"]), lit(t["why"]), str(i)]) + ");")
    stmts.append("COMMIT;")
    sql("\n".join(stmts))
    print("[taxonomy] loaded: " + sql("SELECT (SELECT count(*) FROM events.subject) || ' subjects, ' || (SELECT count(*) FROM events.event_subject) || ' story filings'").strip())


if __name__ == "__main__":
    main()
