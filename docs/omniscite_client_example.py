"""Reference client: Omniscite -> venkatapagadala.com Agentic CMS.

Copy into Omniscite and adapt. Deliberately dependency-free (urllib) so it
drops into any Python service. The call ORDER is the contract:

    whoami  ->  profile + schema  ->  validate (dry run)  ->  draft
            ->  sources  ->  gates  ->  submit  ->  [human approves]

There is no publish call. Approval is a human action in the CMS.

Local:  BASE = "http://localhost:8090/api"
Prod:   BASE = "https://<backend-host>/api"   (token must be reissued there)
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request


class CmsAgent:
    def __init__(self, base: str, token: str):
        self.base = base.rstrip("/")
        self.token = token

    def _call(self, method: str, path: str, body=None):
        req = urllib.request.Request(
            self.base + path, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"Content-Type": "application/json", "X-Agent-Token": self.token},
        )
        try:
            r = urllib.request.urlopen(req)
            return r.status, json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            # 403 = allowed to authenticate, not allowed to do THIS. The body
            # says which rule refused: a lock, a grant, a scope, or the pause.
            try:
                return e.code, json.loads(e.read() or b"null")
            except json.JSONDecodeError:
                return e.code, None

    # ---- read: orient before writing -------------------------------
    def whoami(self):   return self._call("GET", "/cms/agent/whoami")
    def profile(self):  return self._call("GET", "/cms/agent/profile")
    def schema(self):   return self._call("GET", "/cms/agent/schema")

    # ---- write: draft, evidence, self-check, submit -----------------
    def validate(self, draft: dict):  return self._call("POST", "/cms/agent/drafts/validate", draft)
    def create(self, draft: dict):    return self._call("POST", "/cms/agent/drafts", draft)
    def add_source(self, page_id, src):
        return self._call("POST", f"/cms/agent/drafts/{page_id}/sources", src)
    def gates(self, page_id):  return self._call("POST", f"/cms/agent/drafts/{page_id}/gates", {})
    def submit(self, page_id): return self._call("POST", f"/cms/agent/drafts/{page_id}/submit", {})

    # ---- propose a change to an already published page --------------
    def revise(self, page_id: str, change_summary: str, **fields):
        return self._call("POST", "/cms/agent/revisions",
                          {"pageId": page_id, "changeSummary": change_summary, **fields})


def run_once(base: str, token: str) -> int:
    """The whole loop, the way a real agent should do it."""
    a = CmsAgent(base, token)

    s, who = a.whoami()
    if s != 200:
        print(f"auth failed: {s} {who}"); return 1
    if who["agentsPaused"]:
        print("agents are paused site-wide; stopping"); return 0
    print(f"as {who['agent']['name']} on {who['site']['siteId']}; "
          f"can publish: {who['canPublish']}; quota {who['quota']['openDrafts']}/{who['quota']['openDraftCap']}")

    _, prof = a.profile()
    _, sch = a.schema()
    # Never target a keyword another page already owns: that is cannibalization.
    owned = prof["keywordOwnership"]
    target = "openai inference pricing"
    if target in owned:
        print(f"'{target}' is already owned by {owned[target]}; propose a revision, not a new page")
        return 0
    # Pick the type from placement rules, and be able to say why.
    t = "ai-update"
    print(f"type {t}: {sch['types'][t]['placement']['useWhen'][:70]}...")

    draft = {
        "type": t,
        "title": "OpenAI Revises Inference Pricing",
        "slug": "openai-revises-inference-pricing",
        "blocks": [{"kind": "p", "text": "A worked example filed by the Omniscite integration client."}],
        "fields": {"company": "OpenAI", "category": "industry"},
        "seo": {
            "seoTitle": "OpenAI Revises Inference Pricing",
            "metaDescription": (
                "OpenAI introduced revised inference pricing across its model tiers, changing "
                "the cost calculus for high volume agent workloads and long context applications."
            ),
        },
        "sources": [{"url": "https://openai.com/pricing", "fetchedAt": "2026-08-19T00:00:00Z", "httpStatus": 200}],
        "model": "claude-fable-5",
    }

    # Dry run first: same checks, nothing stored. Fix before you commit.
    s, dry = a.validate(draft)
    if not dry or not dry["wouldBeAccepted"]:
        bad = [c for c in (dry or {}).get("checks", []) if not c["ok"]]
        gates = [c for c in (dry or {}).get("gates", {}).get("checks", []) if not c["ok"]]
        print("dry run refused:", bad or gates); return 1
    print("dry run: would be accepted")

    s, page = a.create(draft)
    if s != 200:
        print(f"create refused: {s} {page}"); return 1
    pid = page["id"]
    a.add_source(pid, {"url": "https://platform.openai.com/docs/pricing",
                       "fetchedAt": "2026-08-19T00:00:00Z", "httpStatus": 200})

    _, g = a.gates(pid)
    if not g["passed"]:
        print("self-check failed, fix before asking a human:", g["failed"]); return 1

    _, sub = a.submit(pid)
    print(f"submitted {pid}: {sub['status']}. {sub['note']}")
    return 0


if __name__ == "__main__":
    import os, sys
    sys.exit(run_once(
        os.environ.get("CMS_BASE", "http://localhost:8090/api"),
        os.environ["CMS_AGENT_TOKEN"],
    ))
