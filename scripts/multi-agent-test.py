#!/usr/bin/env python3
"""Prove a fleet of agents can work the CMS at once, safely.

Omniscite will run several agents doing different jobs. This asserts the
properties that matter when more than one program writes to one site:

  1. each agent gets its own scoped credential
  2. they can work CONCURRENTLY without corrupting each other
  3. an agent cannot touch another agent's draft, even knowing its id
  4. each agent's grant is enforced independently
  5. every draft is attributed to the agent that filed it
  6. the activity log can answer "who did that" per agent
  7. the kill switch stops the whole fleet at once

Usage: python3 scripts/multi-agent-test.py
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "http://localhost:8090/api"
ADMIN = {"email": "admin@monomind.com", "password": "LocalReview2026!"}
PREFIX = "fleet-test-"
GOOD_DESC = ("OpenAI introduced revised inference pricing across its model tiers, changing "
             "the cost calculus for high volume agent workloads and long context applications.")

failures: list[str] = []
def check(label, ok, detail=""):
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{f'  ({detail})' if detail else ''}")
    if not ok: failures.append(label)

def call(method, path, body=None, admin_tok=None, agent_tok=None):
    h = {"Content-Type": "application/json"}
    if admin_tok: h["Authorization"] = f"Bearer {admin_tok}"
    if agent_tok: h["X-Agent-Token"] = agent_tok
    req = urllib.request.Request(API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None, headers=h)
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b"null")
        except json.JSONDecodeError: return e.code, None

# The fleet: three jobs, three scopes, deliberately different grants.
FLEET = [
    {"name": "fleet-test news watcher",   "types": ["ai-update"],           "narrow": None},
    {"name": "fleet-test encyclopedist",  "types": ["concept"],             "narrow": None},
    {"name": "fleet-test body-only",      "types": ["ai-update"],
     "narrow": {"ai-update": {"fields": ["body", "sources"]}}},
]

def main() -> int:
    _, auth = call("POST", "/auth/login", ADMIN)
    T = auth["access_token"]

    # sweep prior runs so the test is idempotent
    _, rows = call("GET", "/cms/pages?includeArchived=true", None, T)
    for p in rows or []:
        if p.get("slug", "").startswith(PREFIX) and p.get("status") != "archived":
            call("PUT", f"/cms/pages/{p['id']}", {"status": "draft"}, T)
            call("POST", f"/cms/pages/{p['id']}/archive", {}, T)
    _, toks = call("GET", "/cms/agent-tokens", None, T)
    for t in toks or []:
        if t.get("name", "").startswith("fleet-test") and t.get("active"):
            call("POST", f"/cms/agent-tokens/{t['id']}/revoke", {}, T)

    print("\n[1] Each agent gets its own scoped credential")
    for a in FLEET:
        s, tok = call("POST", "/cms/agent-tokens", {"name": a["name"], "allowedTypes": a["types"]}, T)
        a["id"], a["token"] = tok["id"], tok["token"]
        if a["narrow"]:
            call("PUT", f"/cms/agent-tokens/{a['id']}/permissions", a["narrow"], T)
        check(f"issued for {a['name']}", s == 200, f"scope {tok['allowedTypes']}")

    print("\n[2] The fleet works concurrently without interfering")
    def file_draft(a):
        t = a["types"][0]
        payload = {
            "type": t, "title": f"Fleet draft by {a['name']}",
            "slug": f"{PREFIX}{a['id']}",
            "blocks": [{"kind": "p", "text": "Concurrent draft filed by a fleet member."}],
            "sources": [{"url": "https://example.com/fleet"}],
        }
        # the narrowed agent may not write SEO, so only the others send it
        if not a["narrow"]:
            payload["seo"] = {"seoTitle": f"Fleet {a['id'][:6]}", "metaDescription": GOOD_DESC}
            if t == "concept":
                payload["fields"] = {"category": "basics", "difficulty": "beginner"}
        return a, call("POST", "/cms/agent/drafts", payload, agent_tok=a["token"])

    with ThreadPoolExecutor(max_workers=len(FLEET)) as ex:
        results = list(ex.map(file_draft, FLEET))
    for a, (s, page) in results:
        a["page"] = page if s == 200 else None
        check(f"{a['name']} filed concurrently", s == 200, f"HTTP {s}")
    ids = [a["page"]["id"] for a, _ in results if a.get("page")]
    check("every concurrent draft got a distinct id", len(set(ids)) == len(ids), f"{len(ids)} drafts")

    print("\n[3] An agent cannot touch another agent's draft")
    a0, a1 = FLEET[0], FLEET[1]
    if a1.get("page"):
        s, _ = call("POST", f"/cms/agent/drafts/{a1['page']['id']}/submit", {}, agent_tok=a0["token"])
        check("cross-agent submit is refused", s == 404, f"HTTP {s}")
        s, _ = call("POST", f"/cms/agent/drafts/{a1['page']['id']}/sources",
                    {"url": "https://evil.example/x"}, agent_tok=a0["token"])
        check("cross-agent source injection is refused", s == 404, f"HTTP {s}")

    print("\n[4] Each agent's grant is enforced independently")
    narrowed = FLEET[2]
    s, body = call("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Grant probe", "slug": PREFIX + "grant",
        "seo": {"metaDescription": "Trying to write a field this agent was not granted."},
    }, agent_tok=narrowed["token"])
    check("narrowed agent refused an ungranted field", s == 403, f"HTTP {s}")
    s, _ = call("POST", "/cms/agent/drafts", {
        "type": "concept", "title": "Scope probe", "slug": PREFIX + "scope",
    }, agent_tok=narrowed["token"])
    check("narrowed agent refused a type outside its scope", s == 403, f"HTTP {s}")

    print("\n[5] Every draft is attributed to the agent that filed it")
    _, queue_pages = call("GET", "/cms/pages", None, T)
    mine = {p["id"]: p for p in queue_pages if p.get("slug", "").startswith(PREFIX)}
    for a, _ in results:
        if a.get("page"):
            p = mine.get(a["page"]["id"])
            check(f"{a['name']} is named on its draft",
                  bool(p) and (p.get("provenance") or {}).get("agentName") == a["name"],
                  (p or {}).get("provenance", {}).get("agentName", "missing"))

    print("\n[6] The log answers 'who did that', per agent")
    for a, _ in results:
        _, log = call("GET", f"/cms/activity?actorId={a['id']}", None, T)
        acts = {r["action"] for r in log}
        check(f"{a['name']} has its own audit trail", "draft.create" in acts, f"{len(log)} rows")
    _, refused = call("GET", "/cms/activity?result=refused&limit=100", None, T)
    fleet_refusals = [r for r in refused if (r["actor"].get("name") or "").startswith("fleet-test")]
    check("refusals are attributed too", len(fleet_refusals) >= 2, f"{len(fleet_refusals)} refusals logged")

    print("\n[7] The kill switch stops the whole fleet at once")
    call("POST", "/cms/profile/pause", {"paused": True}, T)
    def probe(a):
        return call("POST", "/cms/agent/drafts", {
            "type": a["types"][0], "title": "During pause", "slug": PREFIX + "paused-" + a["id"],
        }, agent_tok=a["token"])[0]
    with ThreadPoolExecutor(max_workers=len(FLEET)) as ex:
        codes = list(ex.map(probe, FLEET))
    check("every agent is stopped by one switch", all(c == 403 for c in codes), str(codes))
    call("POST", "/cms/profile/pause", {"paused": False}, T)
    s, _ = call("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "After pause", "slug": PREFIX + "resumed",
        "seo": {"seoTitle": "After pause", "metaDescription": GOOD_DESC},
        "blocks": [{"kind": "p", "text": "x"}],
    }, agent_tok=FLEET[0]["token"])
    check("lifting the switch restores the fleet", s == 200, f"HTTP {s}")

    # tidy: retire everything this run created
    _, rows = call("GET", "/cms/pages?includeArchived=true", None, T)
    for p in rows or []:
        if p.get("slug", "").startswith(PREFIX) and p.get("status") != "archived":
            call("PUT", f"/cms/pages/{p['id']}", {"status": "draft"}, T)
            call("POST", f"/cms/pages/{p['id']}/archive", {}, T)
    for a in FLEET:
        call("POST", f"/cms/agent-tokens/{a['id']}/revoke", {}, T)

    print()
    if failures:
        print(f"{len(failures)} FAILED: {', '.join(failures)}"); return 1
    print("Fleet test passed. Multiple agents can work this CMS at once, safely.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
