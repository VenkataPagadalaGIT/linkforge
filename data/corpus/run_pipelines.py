#!/usr/bin/env python3
"""
Run the graph's pipelines (ontology/pipelines.json) that are due, in order,
and record every run in ontology.pipeline_run, so "how fresh is this" is a
fact the site can show. Free pipelines run when their cadence has lapsed (or
always with --force). Paid pipelines never run unless this invocation is
approved for them: --approve-paid linkedin,reddit together with a cap in the
environment (BD_CAP); their own scripts enforce the cap in code.

  python3 run_pipelines.py               run what is due
  python3 run_pipelines.py --only site   one pipeline, even if not due
  python3 run_pipelines.py --status      freshness table, no runs
  python3 run_pipelines.py --force       everything free, now

A pipeline that fails stops nothing else: the runner records the failure and
moves on, so one dead source never blocks the rest.
"""
import datetime as dt, json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, "ontology", "pipelines.json"), encoding="utf8"))["pipelines"]


def lit(v):
    return "NULL" if v is None else ("'" + str(v).replace("'", "''") + "'")


def last_runs():
    out = {}
    for pid, started, status in query("SELECT DISTINCT ON (pipeline) pipeline, started_at, status FROM ontology.pipeline_run ORDER BY pipeline, started_at DESC"):
        out[pid] = (dt.datetime.fromisoformat(started), status)
    return out


def due(p, last, now):
    if p["cadence_h"] == 0:
        return True
    if p["id"] not in last or last[p["id"]][1] != "ok":
        return True
    return (now - last[p["id"]][0]).total_seconds() >= p["cadence_h"] * 3600


def run(p):
    rid = query(f"INSERT INTO ontology.pipeline_run (pipeline) VALUES ({lit(p['id'])}) RETURNING id")[0][0]
    t0 = time.time()
    r = subprocess.run(["zsh", "-c", p["cmd"]], cwd=HERE, capture_output=True, text=True, timeout=6 * 3600)
    tail = (r.stdout + r.stderr).strip().splitlines()
    note = " | ".join(tail[-3:])[:900]
    status = "ok" if r.returncode == 0 else "failed"
    sql(f"UPDATE ontology.pipeline_run SET finished_at=now(), status={lit(status)}, note={lit(note)} WHERE id={rid};")
    print(f"{'OK ' if status == 'ok' else 'FAIL'} {p['id']:16} {time.time() - t0:7.1f}s  {tail[-1][:110] if tail else ''}", flush=True)
    return status


def status_table():
    last = last_runs()
    now = dt.datetime.now(dt.timezone.utc)
    print(f"{'pipeline':16} {'cost':5} {'cadence':8} {'last run':20} {'status':7} {'due':3}  writes")
    for p in P:
        l = last.get(p["id"])
        when = l[0].astimezone().strftime("%Y-%m-%d %H:%M") if l else "never"
        print(f"{p['id']:16} {p['cost']:5} {str(p['cadence_h']) + 'h':8} {when:20} {(l[1] if l else '-'):7} {'yes' if due(p, last, now) else 'no':3}  {p['writes']}")


def main():
    a = sys.argv
    if "--status" in a:
        return status_table()
    only = a[a.index("--only") + 1].split(",") if "--only" in a else None
    approved = set(a[a.index("--approve-paid") + 1].split(",")) if "--approve-paid" in a else set()
    force = "--force" in a
    last = last_runs()
    now = dt.datetime.now(dt.timezone.utc)
    ran = 0
    for p in P:
        if only and p["id"] not in only:
            continue
        if p["cost"] == "paid" and p["id"] not in approved:
            if only:
                print(f"SKIP {p['id']:16} paid: approve with --approve-paid {p['id']} and BD_CAP set")
            continue
        if not (only or force or due(p, last, now)):
            continue
        run(p)
        ran += 1
    print(f"ran {ran} pipelines")


if __name__ == "__main__":
    main()
