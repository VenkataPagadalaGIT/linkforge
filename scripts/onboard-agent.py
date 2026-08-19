#!/usr/bin/env python3
"""Onboard an agent to this site, the way Omniscite will.

Four stages, the same four the docs describe:
  1. ISSUE     the owner issues a scoped token (admin side)
  2. HANDSHAKE the agent proves the token works and learns its grants
  3. ORIENT    the agent reads the profile and schema
  4. TEST OPS  the agent dry-runs a draft, then files one for real, then
               runs its own gates, then submits. Nothing is published.

Usage:
  python3 scripts/onboard-agent.py --name "Omniscite research agent" --types ai-update concept
  python3 scripts/onboard-agent.py --token omni_...        # skip stage 1, use an existing token

Exit 0 means the agent is ready for real work. Every stage prints what it
learned so the transcript doubles as the onboarding record.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

API = "http://localhost:8090/api"
ADMIN = {"email": "admin@monomind.com", "password": "LocalReview2026!"}


def call(method, path, body=None, headers=None):
    req = urllib.request.Request(API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", **(headers or {})})
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"null")
        except json.JSONDecodeError:
            return e.code, None


def stage(n, title):
    print(f"\n[{n}] {title}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default="Omniscite research agent")
    ap.add_argument("--types", nargs="*", default=["ai-update", "concept"])
    ap.add_argument("--token", help="skip issuing; use this token")
    args = ap.parse_args()

    token = args.token
    if not token:
        stage(1, "ISSUE: owner issues a scoped token")
        _, auth = call("POST", "/auth/login", ADMIN)
        admin = {"Authorization": f"Bearer {auth['access_token']}"}
        status, tok = call("POST", "/cms/agent-tokens",
                           {"name": args.name, "allowedTypes": args.types}, admin)
        if status != 200:
            print(f"    refused: {tok}"); return 1
        token = tok["token"]
        print(f"    issued '{tok['name']}' scoped to {tok['allowedTypes']}, expires {tok['expiresAt'][:10]}")
        print(f"    token shown once: {token[:12]}...  (hand this to the agent out of band)")
    else:
        stage(1, "ISSUE: skipped, using the token supplied")

    A = {"X-Agent-Token": token}

    stage(2, "HANDSHAKE: the agent proves the credential and learns its grants")
    status, who = call("GET", "/cms/agent/whoami", None, A)
    if status != 200:
        print(f"    FAILED: HTTP {status} {who}. The token does not work. Stop here."); return 1
    print(f"    authenticated as '{who['agent']['name']}' on {who['site']['siteId']} (profile {who['site']['profileVersion']})")
    print(f"    can publish: {who['canPublish']}   paused: {who['agentsPaused']}   quota: {who['quota']['openDrafts']}/{who['quota']['openDraftCap']}")
    for t, g in who["scope"]["grants"].items():
        ops = [op for op in ("create", "update", "refresh", "proposeArchive") if g[op]]
        print(f"    {t:14s} may: {', '.join(ops) or 'nothing'};  seo fields: {g['seoFields'] or 'none'}")
    print(f"    locked paths: {', '.join(who['lockedPaths'])}")
    if who["agentsPaused"]:
        print("    agents are paused site-wide; onboarding can continue, real work cannot")

    stage(3, "ORIENT: read the profile and the schema")
    _, prof = call("GET", "/cms/agent/profile", None, A)
    _, sch = call("GET", "/cms/agent/schema", None, A)
    print(f"    site purpose: {prof['identity']['purpose'][:90]}...")
    print(f"    truth file: {len(prof['truthFile']['owner']['claimsAllowed'])} allowed claims, "
          f"{len(prof['truthFile']['owner']['claimsForbidden'])} forbidden; money figures never guessed: "
          f"{prof['truthFile']['claimsPolicy']['moneyFiguresNeverGuessed']}")
    print(f"    voice: banned punctuation {prof['voice']['bannedPunctuation']}, {len(prof['voice']['bannedWords'])} banned words, "
          f"{len(prof['voice']['exemplars'])} exemplars")
    print(f"    keyword ownership: {len(prof['keywordOwnership'])} keywords already owned by a page")
    print(f"    types offered: {list(sch['types'].keys())}")
    for t, spec in sch["types"].items():
        print(f"      {t:14s} use when: {spec['placement']['useWhen'][:70]}...")
    print(f"    rules: {len(sch['rules'])}; first: {sch['rules'][0]}")

    stage(4, "TEST OPS: dry run, then a real draft, then gates, then submit")
    first_type = next(iter(sch["types"]), None)
    if not first_type:
        print("    no draftable types in scope; nothing to test"); return 1
    probe = {
        "type": first_type, "title": "Onboarding probe",
        "slug": "onboarding-probe",
        "blocks": [{"kind": "p", "text": "A probe draft filed during agent onboarding. It proves the contract end to end and is archived afterwards."}],
        "seo": {"seoTitle": "Onboarding probe",
                "metaDescription": "A probe draft filed during agent onboarding to prove the contract end to end; it is never published and is archived immediately after the check."},
        "sources": [{"url": "https://venkatapagadala.com/", "fetchedAt": "2026-08-19T00:00:00Z", "httpStatus": 200}],
        "model": "onboarding-script",
    }
    status, dry = call("POST", "/cms/agent/drafts/validate", probe, A)
    print(f"    dry run: HTTP {status}, would be accepted: {dry.get('wouldBeAccepted')}")
    for c in dry.get("checks", []):
        print(f"      {'ok  ' if c['ok'] else 'FAIL'} {c['name']}{('  ' + c['detail']) if c.get('detail') and not c['ok'] else ''}")
    failing = [c["name"] for c in dry.get("gates", {}).get("checks", []) if not c["ok"]]
    print(f"      gates: {'all pass' if not failing else 'failing: ' + ', '.join(failing)}")
    if not dry.get("wouldBeAccepted"):
        print("    the probe would be refused; fix the payload before real work"); return 1

    status, draft = call("POST", "/cms/agent/drafts", probe, A)
    print(f"    real draft: HTTP {status}, id {draft.get('id')}, status {draft.get('status')}")
    status, gates = call("POST", f"/cms/agent/drafts/{draft['id']}/gates", {}, A)
    print(f"    self-check: gates passed = {gates.get('passed')}")
    status, sub = call("POST", f"/cms/agent/drafts/{draft['id']}/submit", {}, A)
    print(f"    submit: HTTP {status}, status {sub.get('status')}, note: {sub.get('note')}")
    status, _ = call("POST", f"/cms/pages/{draft['id']}/approve", {}, A)
    print(f"    attempt to publish with the agent token: HTTP {status} (must be 401/403)")
    if status not in (401, 403):
        print("    THE AGENT COULD PUBLISH. Stop everything."); return 1

    # Tidy: the probe is evidence, not content.
    _, auth = call("POST", "/auth/login", ADMIN)
    admin = {"Authorization": f"Bearer {auth['access_token']}"}
    call("POST", f"/cms/pages/{draft['id']}/reject", {"notes": "onboarding probe"}, admin)
    call("POST", f"/cms/pages/{draft['id']}/archive", {}, admin)
    print("    probe archived")

    print("\nREADY. The agent authenticated, learned its grants, read the profile and schema,")
    print("proved it can draft, self-check and submit, and proved it cannot publish.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
