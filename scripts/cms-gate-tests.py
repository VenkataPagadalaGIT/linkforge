#!/usr/bin/env python3
"""Regression tests for the human side of the Agentic CMS.

scripts/agent-draft-demo.py proves the agent contract (draft, source,
self-check, submit, cannot publish). This proves the owner-side rules that
only exist once a human is in the loop: uniqueness at the URL level, the
gate results the approve route recomputes, and archiving.

Usage:  python3 scripts/cms-gate-tests.py [--api http://localhost:8090/api]

Every test cleans up after itself, so the review queue is left as it was.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

ADMIN = {"email": "admin@monomind.com", "password": "LocalReview2026!"}

# 157 chars: inside the 140-160 gate, so it is the description a test page
# uses when it wants everything except the property under test to pass.
GOOD_DESC = (
    "OpenAI introduced revised inference pricing across its model tiers, changing "
    "the cost calculus for high volume agent workloads and long context applications."
)

failures: list[str] = []


def failed_gates(body) -> list[str]:
    """Pull the gate names out of a 422. FastAPI nests our dict under
    'detail', and reading the wrong level is how a test passes by accident:
    a 200 body also contains every gate name, including the ones that
    passed, so a naive substring search on the whole body proves nothing."""
    detail = (body or {}).get("detail")
    if isinstance(detail, dict):
        return list(detail.get("failed") or [])
    return []


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{f'  ({detail})' if detail else ''}")
    if not ok:
        failures.append(label)


class Api:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.token = self.call("POST", "/auth/login", ADMIN)[1]["access_token"]

    def call(self, method: str, path: str, body=None, auth: bool = False):
        headers = {"Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = f"Bearer {self.token}"
        req = urllib.request.Request(
            self.base + path,
            method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers=headers,
        )
        try:
            r = urllib.request.urlopen(req)
            return r.status, json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"null")

    def a(self, method: str, path: str, body=None):
        return self.call(method, path, body, auth=True)


def make_page(api: Api, slug: str, title: str, desc: str = GOOD_DESC) -> str:
    status, page = api.a("POST", "/cms/pages", {
        "type": "ai-update", "slug": slug, "title": title, "status": "draft",
        "blocks": [{"kind": "p", "text": "Body copy written for a gate test."}],
        "seo": {"seoTitle": title, "metaDescription": desc},
    })
    if status != 200:
        raise SystemExit(f"could not create a test page: {status} {page}")
    return page["id"]


SLUG_PREFIX = "gate-test-"


def retire(api: Api, page_id: str) -> None:
    """Archive a page whatever state it is in, so tests leave no residue."""
    api.a("PUT", f"/cms/pages/{page_id}", {"status": "draft"})
    api.a("POST", f"/cms/pages/{page_id}/archive")


def sweep(api: Api) -> int:
    """Retire every page this suite has ever created.

    Without this the suite is not idempotent: a run that ends badly leaves
    a published gate-test page behind, and the next run's uniqueness gate
    fires against its own litter and reports a bug that is not there.
    """
    _, rows = api.a("GET", "/cms/pages")
    stale = [p for p in rows
             if p.get("slug", "").startswith(SLUG_PREFIX) and p.get("status") != "archived"]
    for p in stale:
        retire(api, p["id"])
    return len(stale)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8090/api")
    args = ap.parse_args()
    api = Api(args.api)

    swept = sweep(api)
    if swept:
        print(f"swept {swept} page(s) left over from an earlier run")

    made: list[str] = []
    try:
        print("\n[1] A clean draft publishes")
        clean = make_page(api, "gate-test-clean", "Short Title A")
        made.append(clean)
        status, body = api.a("POST", f"/cms/pages/{clean}/approve")
        check("approve returns 200", status == 200, str(body.get("status")))
        check("status becomes published", body.get("status") == "published")

        print("\n[2] A second page cannot take a published URL")
        dupe = make_page(api, "gate-test-clean", "Short Title B")
        made.append(dupe)
        status, body = api.a("POST", f"/cms/pages/{dupe}/approve")
        check("approve is refused", status == 422, f"HTTP {status}")
        check("the reason names slug uniqueness",
              "slug is unique among published pages" in failed_gates(body),
              str(failed_gates(body)))

        print("\n[3] An over-length SEO title blocks approval")
        long_title = "OpenAI Publishes New Inference Pricing Tiers For Every Model Family"
        longp = make_page(api, "gate-test-long-title", long_title)
        made.append(longp)
        status, body = api.a("POST", f"/cms/pages/{longp}/approve")
        check("approve is refused", status == 422, f"HTTP {status}")
        check("the reason names the title length",
              "SEO title under 60 chars" in failed_gates(body), str(failed_gates(body)))

        print("\n[4] A short meta description blocks approval")
        shortd = make_page(api, "gate-test-short-desc", "Short Title C", desc="Too short.")
        made.append(shortd)
        status, body = api.a("POST", f"/cms/pages/{shortd}/approve")
        check("approve is refused", status == 422, f"HTTP {status}")
        check("the reason names the description length",
              "meta description 140-160 chars" in failed_gates(body), str(failed_gates(body)))

        print("\n[5] An em dash in the copy blocks approval")
        emp = make_page(api, "gate-test-em-dash", "Short Title D")
        made.append(emp)
        status, _ = api.a("PUT", f"/cms/pages/{emp}", {
            "blocks": [{"kind": "p", "text": "This copy contains an em dash — which house style forbids."}],
        })
        check("a partial save is accepted", status == 200, f"HTTP {status}")
        status, body = api.a("POST", f"/cms/pages/{emp}/approve")
        check("approve is refused", status == 422, f"HTTP {status}")
        check("the reason names the house style rule",
              "no em dashes in copy" in failed_gates(body), str(failed_gates(body)))

        print("\n[6] A partial save does not erase the fields it did not send")
        keep = make_page(api, "gate-test-partial-save", "Short Title E")
        made.append(keep)
        api.a("PUT", f"/cms/pages/{keep}", {
            "provenance": {"author": "agent", "agentName": "probe",
                           "sources": [{"url": "https://example.com/a"}]},
        })
        api.a("PUT", f"/cms/pages/{keep}", {"title": "Short Title E2"})
        _, row = api.a("GET", f"/cms/pages/{keep}")
        check("the title change landed", row.get("title") == "Short Title E2", row.get("title", ""))
        check("blocks survived the title-only save", len(row.get("blocks") or []) == 1,
              f"{len(row.get('blocks') or [])} blocks")
        check("agent sources survived the title-only save",
              len(((row.get("provenance") or {}).get("sources")) or []) == 1,
              str(((row.get("provenance") or {}).get("sources")) or []))
        check("the SEO block survived the title-only save",
              bool((row.get("seo") or {}).get("metaDescription")), "")

        print("\n[7] Archiving")
        status, _ = api.a("POST", f"/cms/pages/{clean}/archive")
        check("a published page cannot be archived directly", status == 409, f"HTTP {status}")
        status, body = api.a("POST", f"/cms/pages/{dupe}/archive")
        check("a draft can be archived", status == 200, f"HTTP {status}")
        _, row = api.a("GET", f"/cms/pages/{dupe}")
        check("its status becomes archived", row.get("status") == "archived", row.get("status", ""))

        print("\n[8] Archived pages leave the working lists")
        _, listing = api.a("GET", "/cms/pages?status=draft")
        check("archived page is absent from drafts",
              all(p["id"] != dupe for p in listing), f"{len(listing)} drafts")
        _, queue = api.a("GET", "/cms/review")
        check("archived page is absent from the review queue",
              all(p["id"] != dupe for p in queue), f"{len(queue)} in review")
    finally:
        for pid in made:
            retire(api, pid)

    print()
    if failures:
        print(f"{len(failures)} FAILED: {', '.join(failures)}")
        return 1
    print("All owner-side gate tests passed. Test pages were archived on the way out.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
