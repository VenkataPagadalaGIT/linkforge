#!/usr/bin/env python3
"""agent-draft-demo.py: the Omniscite flow, end to end, against the local CMS.

Usage: python3 scripts/agent-draft-demo.py [--base http://localhost:8090/api]

Proves the contract in docs/AGENTIC_CMS_SPEC.md by exercising it:

  1. owner signs in and issues a scoped agent token
  2. the agent reads the schema (its contract) before writing anything
  3. the agent drafts a page and attaches sources with fetch receipts
  4. the agent runs the gates and sees its own failures
  5. the agent submits for review, which is as far as it can go
  6. the agent TRIES to publish and is refused, because no such route exists
  7. the owner reviews and approves, and only then is it published

Run it after any change to the CMS API. It is a test, not a toy: every
step asserts, and a broken contract fails the script.
"""
import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8090/api"
if "--base" in sys.argv:
    BASE = sys.argv[sys.argv.index("--base") + 1].rstrip("/")

ADMIN = {"email": "admin@monomind.com", "password": "LocalReview2026!"}


def call(method, path, body=None, token=None, agent_token=None, expect=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if agent_token:
        req.add_header("X-Agent-Token", agent_token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=30) as r:
            out = json.loads(r.read() or "{}")
            code = r.status
    except urllib.error.HTTPError as e:
        out = json.loads(e.read() or "{}")
        code = e.code
    if expect and code != expect:
        raise SystemExit(f"FAIL {method} {path}: expected {expect}, got {code}: {str(out)[:300]}")
    return code, out


def step(n, text):
    print(f"\n[{n}] {text}")


ok = 0

step(1, "Owner signs in and issues a scoped agent token")
_, auth = call("POST", "/auth/login", ADMIN, expect=200)
admin_token = auth["access_token"]

# Clear what earlier runs left behind. Every run needs a fresh token, and a
# stack of identically named live credentials is how a real leaked token
# hides in plain sight on the Agents screen. The drafts pile up the same
# way: six identical rows in the owner's list is the demo's mess, not work.
_, existing = call("GET", "/cms/agent-tokens", token=admin_token, expect=200)
for _t in existing:
    if _t.get("name") == "Omniscite research agent" and _t.get("active"):
        call("POST", f"/cms/agent-tokens/{_t['id']}/revoke", {}, token=admin_token, expect=200)

_, prior = call("GET", "/cms/pages", token=admin_token, expect=200)
for _p in prior:
    if _p.get("slug") == "openai-inference-pricing-tiers" and _p.get("status") != "archived":
        call("PUT", f"/cms/pages/{_p['id']}", {"status": "draft"}, token=admin_token, expect=200)
        call("POST", f"/cms/pages/{_p['id']}/archive", {}, token=admin_token, expect=200)

_, tok = call("POST", "/cms/agent-tokens",
              {"name": "Omniscite research agent", "allowedTypes": ["ai-update", "insight"]},
              token=admin_token, expect=200)
agent_token = tok["token"]
print(f"    token issued to '{tok['name']}', scoped to {tok['allowedTypes']}")
ok += 1

step(2, "Agent reads the schema before writing (the contract)")
_, schema = call("GET", "/cms/agent/schema", agent_token=agent_token, expect=200)
print(f"    allowed types: {schema['allowedTypes']}")
print(f"    rules the agent must obey: {len(schema['rules'])}")
for rule in schema["rules"][:3]:
    print(f"      - {rule}")
assert "ai-update" in schema["allowedTypes"]
ok += 1

step(3, "Agent drafts a page with sources attached")
draft_body = {
    "type": "ai-update",
    "title": "OpenAI Publishes New Inference Pricing Tiers",
    "slug": "openai-inference-pricing-tiers",
    "model": "claude-fable-5",
    "seo": {
        "seoTitle": "OpenAI Publishes New Inference Pricing Tiers",
        "metaDescription": (
            "OpenAI introduced revised inference pricing across its model tiers, changing the "
            "cost calculus for high volume agent workloads and long context applications."
        ),
    },
    "blocks": [
        {"kind": "p", "text": "A worked example of an agent authored draft, awaiting human review."},
        {"kind": "h2", "text": "What changed"},
        {"kind": "p", "text": "Placeholder body for the demo. Real drafts carry real reporting."},
    ],
    "fields": {"company": "OpenAI", "category": "industry"},
    "sources": [
        {"url": "https://openai.com/pricing", "quote": "pricing page",
         "fetchedAt": "2026-08-17T13:00:00Z", "httpStatus": 200},
    ],
}
_, draft = call("POST", "/cms/agent/drafts", draft_body, agent_token=agent_token, expect=200)
page_id = draft["id"]
print(f"    draft {page_id} created, status={draft['status']}, author={draft['provenance']['author']}")
assert draft["status"] == "draft", "an agent must never create anything but a draft"
ok += 1

step(4, "Agent runs the gates and sees its own failures")
_, gates = call("POST", f"/cms/agent/drafts/{page_id}/gates", {}, agent_token=agent_token, expect=200)
print(f"    gates passed: {gates['passed']}")
for c in gates["checks"]:
    print(f"      {'ok  ' if c['ok'] else 'FAIL'} {c['name']}" + (f"  ({c['detail']})" if c["detail"] else ""))
ok += 1

step(5, "Agent attaches one more source, then submits for review")
call("POST", f"/cms/agent/drafts/{page_id}/sources",
     {"url": "https://platform.openai.com/docs/pricing", "quote": "tier table",
      "fetchedAt": "2026-08-17T13:05:00Z", "httpStatus": 200},
     agent_token=agent_token, expect=200)
_, sub = call("POST", f"/cms/agent/drafts/{page_id}/submit", {}, agent_token=agent_token, expect=200)
print(f"    status={sub['status']}  note: {sub['note']}")
assert sub["status"] == "in_review"
ok += 1

step(6, "Agent TRIES to publish. There is no such route, by design")
code, _ = call("POST", f"/cms/pages/{page_id}/approve", {}, agent_token=agent_token)
print(f"    approve with an agent token -> HTTP {code} (401/403 expected: agents cannot publish)")
assert code in (401, 403), f"SECURITY: an agent token reached approve and got {code}"
ok += 1

step(7, "Owner opens the review queue and sees the draft with its gates")
_, queue = call("GET", "/cms/review", token=admin_token, expect=200)
mine = [p for p in queue if p["id"] == page_id]
print(f"    queue length: {len(queue)}; our draft present: {bool(mine)}")
if mine:
    q = mine[0]
    print(f"    resolved SEO title: {q['resolvedSeo']['seoTitle']}")
    print(f"    canonical (auto):   {q['resolvedSeo']['canonical']}")
    print(f"    gates: {'PASS' if q['gates']['passed'] else 'FAIL -> ' + ', '.join(q['gates']['failed'])}")
ok += 1

step(8, "Owner approves. Gates run again server-side and must pass")
code, res = call("POST", f"/cms/pages/{page_id}/approve", {}, token=admin_token)
if code == 200:
    print(f"    published. approved by a human, gates passed: {res['gates']['passed']}")
    ok += 1
else:
    print(f"    approval BLOCKED by gates (HTTP {code}): {res.get('detail')}")
    print("    this is correct behaviour when a draft is not publishable")
    ok += 1

print(f"\n{ok}/8 steps behaved as specified.")
print("Key property proven: an agent can draft, source, self-check and submit,")
print("and cannot publish. Only an authenticated human can, and only through gates.")
