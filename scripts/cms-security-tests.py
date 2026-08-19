#!/usr/bin/env python3
"""Security tests for the Agentic CMS.

Every case here is an attack that either worked before the fix or would
work if a guard were removed. They run against a live backend, not mocks,
because the guards live in routes and pydantic models rather than in a
layer a unit test could stand in for.

Usage:  python3 scripts/cms-security-tests.py [--api http://localhost:8090/api]

Threat model. Two principals:
  - the owner, holding an admin session. Trusted to publish, but the CMS
    should still refuse to let a slip publish ungated content.
  - an agent, holding a scoped token. Semi-trusted: it writes content the
    owner reads in a browser, so its output is untrusted input.
And one property that must hold no matter what either of them sends:
nothing reaches `published` without passing the gates.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

ADMIN = {"email": "admin@monomind.com", "password": "LocalReview2026!"}
SLUG_PREFIX = "sec-test-"
GOOD_DESC = (
    "OpenAI introduced revised inference pricing across its model tiers, changing "
    "the cost calculus for high volume agent workloads and long context applications."
)

failures: list[str] = []


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{f'  ({detail})' if detail else ''}")
    if not ok:
        failures.append(label)


class Api:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.token = self.call("POST", "/auth/login", ADMIN)[1]["access_token"]

    def call(self, method, path, body=None, headers=None):
        h = {"Content-Type": "application/json", **(headers or {})}
        req = urllib.request.Request(
            self.base + path, method=method,
            data=json.dumps(body).encode() if body is not None else None, headers=h)
        try:
            r = urllib.request.urlopen(req)
            return r.status, json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            try:
                return e.code, json.loads(e.read() or b"null")
            except json.JSONDecodeError:
                return e.code, None

    def admin(self, method, path, body=None):
        return self.call(method, path, body, {"Authorization": f"Bearer {self.token}"})

    def agent(self, method, path, body=None, token=""):
        return self.call(method, path, body, {"X-Agent-Token": token})


def sweep(api: Api) -> None:
    """Retire this suite's pages and revoke its tokens.

    Each run issues three tokens. Without this they pile up on the Agents
    screen, and a list of live credentials nobody recognises is exactly the
    condition that makes a real leaked token invisible.
    """
    _, rows = api.admin("GET", "/cms/pages?includeArchived=true")
    for p in rows or []:
        if (p.get("slug", "").startswith(SLUG_PREFIX) or p.get("title") == "Flagship stand-in") \
                and p.get("status") != "archived":
            api.admin("PUT", f"/cms/pages/{p['id']}", {"status": "draft"})
            api.admin("POST", f"/cms/pages/{p['id']}/archive")
    _, tokens = api.admin("GET", "/cms/agent-tokens")
    for t in tokens or []:
        if t.get("name", "").startswith("sec-test") and t.get("active"):
            api.admin("POST", f"/cms/agent-tokens/{t['id']}/revoke")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8090/api")
    args = ap.parse_args()
    api = Api(args.api)
    sweep(api)

    print("\n[A] Authentication: no session, no access")
    for method, path in [("GET", "/cms/pages"), ("GET", "/cms/globals"),
                         ("GET", "/cms/review"), ("GET", "/cms/agent-tokens"),
                         ("POST", "/cms/pages")]:
        status, _ = api.call(method, path, {} if method == "POST" else None)
        check(f"unauthenticated {method} {path}", status in (401, 403), f"HTTP {status}")

    print("\n[B] An agent token is not an admin session")
    _, tok = api.admin("POST", "/cms/agent-tokens",
                       {"name": "sec-test agent", "allowedTypes": ["ai-update"]})
    agent_token = tok["token"]
    for method, path in [("GET", "/cms/pages"), ("GET", "/cms/review"),
                         ("PUT", "/cms/globals"), ("GET", "/cms/agent-tokens"),
                         ("POST", "/cms/agent-tokens")]:
        status, _ = api.call(method, path, {} if method != "GET" else None,
                             {"X-Agent-Token": agent_token})
        check(f"agent token on {method} {path}", status in (401, 403), f"HTTP {status}")

    print("\n[C] The publish gate cannot be walked around")
    status, created = api.admin("POST", "/cms/pages", {
        "type": "ai-update", "slug": SLUG_PREFIX + "direct-publish",
        "title": "Direct publish attempt", "status": "published",
    })
    check("create with status=published is rejected", status == 422, f"HTTP {status}")

    _, page = api.admin("POST", "/cms/pages", {
        "type": "ai-update", "slug": SLUG_PREFIX + "patch-publish",
        "title": "Patch publish attempt",
    })
    pid = page["id"]
    status, _ = api.admin("PUT", f"/cms/pages/{pid}", {"status": "published"})
    check("patch to status=published is rejected", status == 422, f"HTTP {status}")
    _, row = api.admin("GET", f"/cms/pages/{pid}")
    check("the page is still a draft", row["status"] == "draft", row["status"])

    print("\n[D] Agent-supplied URLs cannot carry script to the reviewer")
    for bad in ["javascript:alert(document.cookie)",
                "JaVaScRiPt:alert(1)",
                "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
                "vbscript:msgbox(1)"]:
        status, _ = api.agent("POST", "/cms/agent/drafts", {
            "type": "ai-update", "title": "Source scheme probe",
            "slug": SLUG_PREFIX + "scheme",
            "sources": [{"url": bad}],
        }, agent_token)
        check(f"source url {bad.split(':')[0]}: is rejected", status == 422, f"HTTP {status}")

    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Block url probe", "slug": SLUG_PREFIX + "blockurl",
        "blocks": [{"kind": "image", "url": "javascript:alert(1)"}],
    }, agent_token)
    check("block url javascript: is rejected", status == 422, f"HTTP {status}")

    status, ok_draft = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Legitimate draft", "slug": SLUG_PREFIX + "legit",
        "sources": [{"url": "https://example.com/a"}],
    }, agent_token)
    check("an https source is accepted", status == 200, f"HTTP {status}")

    print("\n[E] Agent scope is enforced per type")
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "guide", "title": "Out of scope", "slug": SLUG_PREFIX + "scope",
    }, agent_token)
    check("drafting an out-of-scope type is refused", status == 403, f"HTTP {status}")

    print("\n[F] One agent cannot touch another agent's draft")
    _, tok2 = api.admin("POST", "/cms/agent-tokens",
                        {"name": "sec-test other agent", "allowedTypes": ["ai-update"]})
    other = tok2["token"]
    victim = ok_draft["id"]
    for method, path in [("POST", f"/cms/agent/drafts/{victim}/sources"),
                         ("POST", f"/cms/agent/drafts/{victim}/gates"),
                         ("POST", f"/cms/agent/drafts/{victim}/submit")]:
        body = {"url": "https://evil.example/x"} if path.endswith("sources") else {}
        status, _ = api.agent(method, path, body, other)
        check(f"other agent on {path.rsplit('/', 1)[1]}", status == 404, f"HTTP {status}")

    print("\n[G] Revoked tokens stop working immediately")
    # Revoke by the id the issue call returned, not by name. Names repeat
    # across runs, and looking one up by name revoked a stale token from an
    # earlier run while leaving this one live: the test then reported a
    # revocation bug that did not exist.
    api.admin("POST", f"/cms/agent-tokens/{tok2['id']}/revoke")
    status, _ = api.agent("GET", "/cms/agent/schema", None, other)
    check("a revoked token is refused", status == 401, f"HTTP {status}")
    status, _ = api.agent("GET", "/cms/agent/schema", None, "omni_not-a-real-token")
    check("a forged token is refused", status == 401, f"HTTP {status}")
    status, _ = api.call("GET", "/cms/agent/schema")
    check("a missing token is refused", status == 401, f"HTTP {status}")

    print("\n[H] Token issuance validates its own scope input")
    status, _ = api.admin("POST", "/cms/agent-tokens",
                          {"name": "bad scope", "allowedTypes": ["ai-update", "not-a-type"]})
    check("an unknown page type in scope is rejected", status == 400, f"HTTP {status}")
    _, listing = api.admin("GET", "/cms/agent-tokens")
    check("token hashes are never listed",
          all("tokenHash" not in t for t in listing), f"{len(listing)} tokens")
    check("issued tokens carry an expiry",
          all(t.get("expiresAt") for t in listing if t["name"].startswith("sec-test")), "")

    print("\n[I] Search input cannot break or hang the query")
    for probe in ["a(", "(((((((((((a", ".*", "[", "\\"]:
        status, rows = api.admin("GET", f"/cms/pages?q={urllib.parse.quote(probe)}")
        check(f"regex metacharacter {probe!r} is handled",
              status == 200 and isinstance(rows, list), f"HTTP {status}")

    print("\n[J] Globals cannot be set to something that breaks the site")
    status, _ = api.admin("PUT", "/cms/globals", {"robotsPolicy": "noindex-everything"})
    check("an invalid robots policy is rejected", status == 422, f"HTTP {status}")
    status, _ = api.admin("PUT", "/cms/globals", {"siteUrl": "notaurl"})
    check("a relative siteUrl is rejected", status == 422, f"HTTP {status}")
    status, _ = api.admin("PUT", "/cms/globals", {"defaultOgImage": "javascript:alert(1)"})
    check("a javascript og image is rejected", status == 422, f"HTTP {status}")
    _, g = api.admin("GET", "/cms/globals")
    check("globals survived the attempts",
          g["robotsPolicy"] in {"index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"},
          g["robotsPolicy"])

    print("\n[K] A published URL cannot be moved out from under its links")
    _, pub = api.admin("POST", "/cms/pages", {
        "type": "ai-update", "slug": SLUG_PREFIX + "frozen", "title": "Frozen URL",
        "blocks": [{"kind": "p", "text": "Body copy."}],
        "seo": {"seoTitle": "Frozen URL", "metaDescription": GOOD_DESC},
    })
    api.admin("POST", f"/cms/pages/{pub['id']}/approve")
    status, _ = api.admin("PUT", f"/cms/pages/{pub['id']}", {"slug": SLUG_PREFIX + "moved"})
    check("slug is frozen after publish", status == 400, f"HTTP {status}")
    status, _ = api.admin("PUT", f"/cms/pages/{pub['id']}", {"type": "guide"})
    check("page type is frozen after publish", status == 400, f"HTTP {status}")
    status, _ = api.admin("POST", f"/cms/pages/{pub['id']}/archive")
    check("a published page cannot be archived away", status == 409, f"HTTP {status}")

    print("\n[L] An unknown page type cannot be smuggled in")
    status, _ = api.admin("POST", "/cms/pages", {
        "type": "totally-made-up", "slug": SLUG_PREFIX + "badtype", "title": "Bad type"})
    check("create with an unknown type is rejected", status == 400, f"HTTP {status}")
    status, _ = api.admin("PUT", f"/cms/pages/{pid}", {"type": "totally-made-up"})
    check("patch to an unknown type is rejected", status == 400, f"HTTP {status}")

    print("\n[M] Missing objects 404 rather than silently succeeding")
    for method, path in [("POST", "/cms/pages/nope/approve"),
                         ("POST", "/cms/pages/nope/reject"),
                         ("POST", "/cms/pages/nope/archive"),
                         ("GET", "/cms/pages/nope")]:
        status, _ = api.admin(method, path, {} if method == "POST" else None)
        check(f"{method} {path}", status == 404, f"HTTP {status}")

    print("\n[N] The draft cap protects the review queue")
    _, capped = api.admin("POST", "/cms/agent-tokens",
                          {"name": "sec-test capped", "allowedTypes": ["ai-update"],
                           "openDraftCap": 2})
    ct = capped["token"]
    codes = []
    for i in range(4):
        status, _ = api.agent("POST", "/cms/agent/drafts", {
            "type": "ai-update", "title": f"Flood {i}", "slug": f"{SLUG_PREFIX}flood-{i}",
        }, ct)
        codes.append(status)
    check("the cap stops the flood", codes[:2] == [200, 200] and codes[2] == 429, str(codes))

    print("\n[O] An agent cannot send content the templates do not define")
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Bad block kind", "slug": SLUG_PREFIX + "badkind",
        "blocks": [{"kind": "script", "text": "alert(1)"}],
    }, agent_token)
    check("an unknown block kind is refused", status == 422, f"HTTP {status}")
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Stray field", "slug": SLUG_PREFIX + "strayfield",
        "fields": {"notInTemplate": "x"},
    }, agent_token)
    check("a field the template does not declare is refused", status == 422, f"HTTP {status}")
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Bad select", "slug": SLUG_PREFIX + "badselect",
        "fields": {"category": "not-an-option"},
    }, agent_token)
    check("a select value outside its options is refused", status == 422, f"HTTP {status}")
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "Good fields", "slug": SLUG_PREFIX + "goodfields",
        "fields": {"category": "research", "company": "OpenAI"},
    }, agent_token)
    check("valid template fields are accepted", status == 200, f"HTTP {status}")

    print("\n[P] Agents cannot create navigation")
    status, _ = api.admin("POST", "/cms/agent-tokens",
                          {"name": "sec-test hub", "allowedTypes": ["hub"]})
    check("a token scoped to hub cannot be issued", status == 400, f"HTTP {status}")
    _, wide = api.admin("POST", "/cms/agent-tokens", {"name": "sec-test wide"})
    check("a default-scope token excludes hub", "hub" not in wide["allowedTypes"],
          str(wide["allowedTypes"]))
    _, sch = api.agent("GET", "/cms/agent/schema", None, wide["token"])
    check("the schema does not advertise hub to agents", "hub" not in sch["types"])
    check("the schema carries placement rules for every type it offers",
          all("placement" in t for t in sch["types"].values()), f"{len(sch['types'])} types")
    check("the schema tells the agent to choose by placement",
          any("placement" in r for r in sch["rules"]))

    print("\n[Q] The owner's profile governs what an agent may do")
    status, who = api.agent("GET", "/cms/agent/whoami", None, agent_token)
    check("whoami succeeds with a valid token", status == 200, f"HTTP {status}")
    check("whoami says it cannot publish", who and who.get("canPublish") is False)
    check("whoami names the site and profile version",
          bool(who and who["site"].get("siteId") and who["site"].get("profileVersion")))
    check("whoami lists the locked paths", "/" in (who or {}).get("lockedPaths", []))
    status, _ = api.agent("GET", "/cms/agent/whoami", None, "omni_forged")
    check("whoami refuses a bad token", status == 401, f"HTTP {status}")

    status, prof = api.agent("GET", "/cms/agent/profile", None, agent_token)
    check("an agent can read the profile", status == 200 and "truthFile" in prof, f"HTTP {status}")
    status, _ = api.agent("PUT", "/cms/profile", {"voice": {}}, agent_token)
    check("an agent cannot write the profile", status in (401, 403), f"HTTP {status}")

    # guide: create is not permitted by profile even if the token is scoped to it
    _, gtok = api.admin("POST", "/cms/agent-tokens", {"name": "sec-test guide", "allowedTypes": ["guide"]})
    status, body = api.agent("POST", "/cms/agent/drafts", {
        "type": "guide", "title": "Agent guide", "slug": SLUG_PREFIX + "guide"}, gtok["token"])
    check("profile blocks create on a type the token is scoped to", status == 403, f"HTTP {status}")
    check("the refusal explains itself", "not permitted" in str(body), str(body)[:80])

    print("\n[R] Locked pages stay locked, and revisions go through the queue")
    # publish a concept the profile allows updates on, then revise it
    _, c = api.admin("POST", "/cms/pages", {
        "type": "concept", "slug": SLUG_PREFIX + "concept", "title": "Concept under test",
        "blocks": [{"kind": "p", "text": "Definition."}],
        "fields": {"category": "basics", "difficulty": "beginner"},
        "seo": {"seoTitle": "Concept under test", "metaDescription": GOOD_DESC}})
    api.admin("POST", f"/cms/pages/{c['id']}/approve")
    _, ctok = api.admin("POST", "/cms/agent-tokens", {"name": "sec-test concept", "allowedTypes": ["concept"]})
    status, rev = api.agent("POST", "/cms/agent/revisions", {
        "pageId": c["id"], "changeSummary": "Tighten the definition",
        "blocks": [{"kind": "p", "text": "A tighter definition."}],
        "sources": [{"url": "https://example.com/src"}]}, ctok["token"])
    check("an agent can propose a revision to a permitted page", status == 200, f"HTTP {status}")
    check("the revision is a separate draft linked to the original",
          rev and rev.get("revisionOf") == c["id"] and rev.get("status") == "draft")
    _, orig = api.admin("GET", f"/cms/pages/{c['id']}")
    check("the original is untouched until approval", orig["status"] == "published"
          and orig["blocks"][0]["text"] == "Definition.")
    status, _ = api.agent("POST", "/cms/agent/revisions", {
        "pageId": c["id"], "changeSummary": "x", "seo": {"robots": "noindex,follow"}}, ctok["token"])
    check("an agent cannot set SEO fields outside its grant (robots)", status == 403, f"HTTP {status}")

    # approve the revision: it goes live, the original is superseded
    api.agent("POST", f"/cms/agent/drafts/{rev['id']}/submit", {}, ctok["token"])
    status, _ = api.admin("POST", f"/cms/pages/{rev['id']}/approve")
    check("approving the revision publishes it", status == 200, f"HTTP {status}")
    _, orig = api.admin("GET", f"/cms/pages/{c['id']}")
    check("the original is superseded, not duplicated",
          orig["status"] == "archived" and orig.get("supersededBy") == rev["id"], orig["status"])

    # a locked path refuses even a permitted type
    _, locked = api.admin("POST", "/cms/pages", {
        "type": "guide", "slug": "how-llms-work", "title": "Flagship stand-in",
        "blocks": [{"kind": "p", "text": "x"}, {"kind": "sources", "items": ["a"]}],
        "seo": {"seoTitle": "Flagship stand-in", "metaDescription": GOOD_DESC}})
    if locked and locked.get("id"):
        api.admin("POST", f"/cms/pages/{locked['id']}/approve")
        status, body = api.agent("POST", "/cms/agent/revisions", {
            "pageId": locked["id"], "changeSummary": "touch the flagship"}, gtok["token"])
        check("a locked path refuses revision regardless of type", status == 403, f"HTTP {status}")
        check("the lock reason is stated", "locked" in str(body), str(body)[:80])
        api.admin("PUT", f"/cms/pages/{locked['id']}", {"status": "draft"})
        api.admin("POST", f"/cms/pages/{locked['id']}/archive")

    print("\n[S] Kill switch")
    api.admin("POST", "/cms/profile/pause", {"paused": True})
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "During pause", "slug": SLUG_PREFIX + "paused"}, agent_token)
    check("no agent can draft while paused", status == 403, f"HTTP {status}")
    status, who = api.agent("GET", "/cms/agent/whoami", None, agent_token)
    check("whoami reports the pause", status == 200 and who.get("agentsPaused") is True)
    api.admin("POST", "/cms/profile/pause", {"paused": False})
    status, _ = api.agent("POST", "/cms/agent/drafts", {
        "type": "ai-update", "title": "After pause", "slug": SLUG_PREFIX + "unpaused"}, agent_token)
    check("lifting the pause restores drafting", status == 200, f"HTTP {status}")

    print("\n[T] Dry run stores nothing")
    _, before = api.admin("GET", "/cms/pages?includeArchived=true")
    status, dry = api.agent("POST", "/cms/agent/drafts/validate", {
        "type": "ai-update", "title": "Dry run", "slug": SLUG_PREFIX + "dry",
        "blocks": [{"kind": "p", "text": "x"}]}, agent_token)
    _, after = api.admin("GET", "/cms/pages?includeArchived=true")
    check("validate returns a verdict", status == 200 and dry.get("dryRun") and "wouldBeAccepted" in dry)
    check("validate creates no page", len(before) == len(after), f"{len(before)} -> {len(after)}")

    sweep(api)
    print()
    if failures:
        print(f"{len(failures)} FAILED: {', '.join(failures)}")
        return 1
    print("All security tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
