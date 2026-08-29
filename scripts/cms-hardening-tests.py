#!/usr/bin/env python3
"""Tests for the agent-surface hardening: rate limit, request signing,
two-key rotation, and site tenancy.

Each is a property that only matters once real agents run at real volume
against a real deployment, so each is exercised against the live backend.

Usage: python3 scripts/cms-hardening-tests.py
"""
from __future__ import annotations
import hashlib, hmac, json, sys, time, urllib.error, urllib.request

API = "http://localhost:8090/api"
ADMIN = {"email": "admin@monomind.com", "password": "LocalReview2026!"}
PREFIX = "harden-test-"
failures = []
def check(label, ok, detail=""):
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{f'  ({detail})' if detail else ''}")
    if not ok: failures.append(label)

def call(method, path, body=None, admin_tok=None, headers=None):
    h = {"Content-Type": "application/json", **(headers or {})}
    if admin_tok: h["Authorization"] = f"Bearer {admin_tok}"
    req = urllib.request.Request(API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None, headers=h)
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b"null")
        except json.JSONDecodeError: return e.code, None

def main():
    _, auth = call("POST", "/auth/login", ADMIN); T = auth["access_token"]
    # sweep
    _, toks = call("GET", "/cms/agent-tokens", None, T)
    for t in toks or []:
        if t.get("name","").startswith("harden-test") and t.get("active"):
            call("POST", f"/cms/agent-tokens/{t['id']}/revoke", {}, T)

    print("\n[1] Tokens are stamped with the site they were issued for")
    _, tok = call("POST", "/cms/agent-tokens",
                  {"name": "harden-test base", "allowedTypes": ["ai-update"]}, T)
    _, who = call("GET", "/cms/agent/whoami", None, headers={"X-Agent-Token": tok["token"]})
    check("whoami returns 200 for a same-site token", who is not None and who.get("authenticated"))
    _, listing = call("GET", "/cms/agent-tokens", None, T)
    mine = next(x for x in listing if x["name"] == "harden-test base")
    check("the token carries a siteId", bool(mine.get("siteId")), mine.get("siteId"))
    check("no key hash is ever listed", "tokenHash" not in mine and "prevTokenHash" not in mine)

    print("\n[2] Rate limit: a looping client is throttled, not the queue")
    _, rl = call("POST", "/cms/agent-tokens",
                 {"name": "harden-test rl", "allowedTypes": ["ai-update"], "rateLimitPerMin": 5}, T)
    codes = []
    for _ in range(8):
        s, _ = call("GET", "/cms/agent/whoami", None, headers={"X-Agent-Token": rl["token"]})
        codes.append(s)
    check("first requests pass, then 429", codes[:5] == [200]*5 and codes[5] == 429, str(codes))
    _, log = call("GET", "/cms/activity?result=refused&limit=20", None, T)
    check("the throttle is logged", any("rate limit" in (r.get("detail") or "") for r in log))
    check("an out-of-range rate is rejected at issue",
          call("POST", "/cms/agent-tokens",
               {"name":"harden-test bad","allowedTypes":["ai-update"],"rateLimitPerMin":99999}, T)[0] == 400)

    print("\n[3] Request signing: required tokens must prove each write")
    _, sg = call("POST", "/cms/agent-tokens",
                 {"name": "harden-test signed", "allowedTypes": ["ai-update"], "requireSigning": True}, T)
    raw = sg["token"]
    _, who = call("GET", "/cms/agent/whoami", None, headers={"X-Agent-Token": raw})
    check("whoami works UNSIGNED so a client can bootstrap", who is not None and who.get("signingRequired") is True)
    body = {"type": "ai-update", "title": "Signed probe", "slug": PREFIX + "signed",
            "blocks": [{"kind": "p", "text": "x"}]}
    raw_body = json.dumps(body).encode()
    # unsigned write is refused
    s, _ = call("POST", "/cms/agent/drafts", body, headers={"X-Agent-Token": raw})
    check("an unsigned write is refused", s == 401, f"HTTP {s}")
    # correctly signed write is accepted
    ts = str(int(time.time()))
    sig = hmac.new(raw.encode(), f"{ts}.".encode() + raw_body, hashlib.sha256).hexdigest()
    req = urllib.request.Request(API + "/cms/agent/drafts", method="POST", data=raw_body,
        headers={"Content-Type": "application/json", "X-Agent-Token": raw,
                 "X-Agent-Timestamp": ts, "X-Agent-Signature": sig})
    try:
        r = urllib.request.urlopen(req); s = r.status
    except urllib.error.HTTPError as e:
        s = e.code
    check("a correctly signed write is accepted", s == 200, f"HTTP {s}")
    # a stale timestamp is refused (replay protection)
    old_ts = str(int(time.time()) - 9999)
    old_sig = hmac.new(raw.encode(), f"{old_ts}.".encode() + raw_body, hashlib.sha256).hexdigest()
    req = urllib.request.Request(API + "/cms/agent/drafts", method="POST", data=raw_body,
        headers={"Content-Type": "application/json", "X-Agent-Token": raw,
                 "X-Agent-Timestamp": old_ts, "X-Agent-Signature": old_sig})
    try:
        r = urllib.request.urlopen(req); s = r.status
    except urllib.error.HTTPError as e:
        s = e.code
    check("a stale (replayed) timestamp is refused", s == 401, f"HTTP {s}")
    # a wrong signature is refused
    req = urllib.request.Request(API + "/cms/agent/drafts", method="POST", data=raw_body,
        headers={"Content-Type": "application/json", "X-Agent-Token": raw,
                 "X-Agent-Timestamp": str(int(time.time())), "X-Agent-Signature": "deadbeef"})
    try:
        r = urllib.request.urlopen(req); s = r.status
    except urllib.error.HTTPError as e:
        s = e.code
    check("a forged signature is refused", s == 401, f"HTTP {s}")

    print("\n[4] Two-key rotation: no-downtime credential roll")
    _, rt = call("POST", "/cms/agent-tokens",
                 {"name": "harden-test rotate", "allowedTypes": ["ai-update"]}, T)
    old_key = rt["token"]; tid = rt["id"]   # id from issue, never a name lookup
    s, res = call("POST", f"/cms/agent-tokens/{tid}/rotate", {"graceMinutes": 60}, T)
    new_key = res["token"]
    check("rotate returns a new key", s == 200 and new_key != old_key)
    check("the NEW key works immediately",
          call("GET","/cms/agent/whoami",None,headers={"X-Agent-Token":new_key})[0] == 200)
    check("the OLD key still works inside the grace window",
          call("GET","/cms/agent/whoami",None,headers={"X-Agent-Token":old_key})[0] == 200)
    s, res0 = call("POST", f"/cms/agent-tokens/{tid}/rotate", {"graceMinutes": 0}, T)
    newer = res0["token"]
    check("rotating with zero grace kills the previous key at once",
          call("GET","/cms/agent/whoami",None,headers={"X-Agent-Token":new_key})[0] == 401
          and call("GET","/cms/agent/whoami",None,headers={"X-Agent-Token":newer})[0] == 200)

    # tidy
    _, rows = call("GET", "/cms/pages?includeArchived=true", None, T)
    for p in rows or []:
        if p.get("slug","").startswith(PREFIX) and p.get("status") != "archived":
            call("PUT", f"/cms/pages/{p['id']}", {"status": "draft"}, T)
            call("POST", f"/cms/pages/{p['id']}/archive", {}, T)
    for t in call("GET","/cms/agent-tokens",None,T)[1]:
        if t.get("name","").startswith("harden-test") and t.get("active"):
            call("POST", f"/cms/agent-tokens/{t['id']}/revoke", {}, T)

    print()
    if failures:
        print(f"{len(failures)} FAILED: {', '.join(failures)}"); return 1
    print("All hardening tests passed.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
