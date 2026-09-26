"""CMS guard rails: the defects found in the 2026-09-26 audit, pinned as tests.

Runs the real FastAPI app against a throwaway MongoDB (never a shared or
production one). Only the admin login is stubbed; agent routes go through the
real token check with a real token minted by the admin endpoint.

    MONGO_URL=mongodb://127.0.0.1:27091 python -m pytest -q backend/tests/test_cms_guards.py

The test refuses to run unless MONGO_URL points at localhost, and it uses a
fresh database name per run.
"""
import os
import sys
import uuid

import pytest

MONGO_URL = os.environ.get("MONGO_URL", "")
if not MONGO_URL.startswith(("mongodb://127.0.0.1", "mongodb://localhost")):
    pytest.skip("needs a local throwaway MongoDB in MONGO_URL", allow_module_level=True)

os.environ["DB_NAME"] = f"cms_test_{uuid.uuid4().hex[:8]}"
os.environ.setdefault("JWT_SECRET", "test-secret-" + uuid.uuid4().hex)
os.environ.pop("RAILWAY_ENVIRONMENT", None)
os.environ["ENVIRONMENT"] = "test"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402
import server  # noqa: E402

ADMIN = {"email": "owner@test.local", "role": "admin"}
# Direct edits in tests go through a plain synchronous client, never the app's async one.
DB = MongoClient(MONGO_URL)[os.environ["DB_NAME"]]
server.app.dependency_overrides[server.get_current_admin] = lambda: ADMIN


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c
    DB.client.drop_database(os.environ["DB_NAME"])


@pytest.fixture(scope="module")
def agent(client):
    r = client.post("/api/cms/agent-tokens", json={"name": "test agent", "allowedTypes": ["notebook", "concept"]})
    assert r.status_code == 200, r.text
    return {"X-Agent-Token": r.json()["token"]}


def draft(client, agent, **over):
    body = {"type": "notebook", "title": "A test note", "fields": {"section": "ai"},
            "blocks": [{"kind": "p", "text": "Body text."}],
            "sources": [{"url": "https://example.com/source"}]}
    body.update(over)
    r = client.post("/api/cms/agent/drafts", json=body, headers=agent)
    return r


def test_submitting_a_live_page_is_refused_and_it_stays_live(client, agent):
    r = draft(client, agent, title="Live page guard")
    assert r.status_code == 200, r.text
    page_id = r.json()["id"]
    DB.cms_pages.update_one({"id": page_id}, {"$set": {"status": "published"}})
    r = client.post(f"/api/cms/agent/drafts/{page_id}/submit", headers=agent)
    assert r.status_code == 409
    page = client.get(f"/api/cms/pages/{page_id}").json()
    assert page["status"] == "published"


def test_pause_stops_every_agent_write(client, agent):
    r = draft(client, agent, title="Pause guard")
    page_id = r.json()["id"]
    assert client.post("/api/cms/profile/pause", json={"paused": True}).status_code == 200
    try:
        assert client.post(f"/api/cms/agent/drafts/{page_id}/submit", headers=agent).status_code == 423
        assert client.post(f"/api/cms/agent/drafts/{page_id}/gates", headers=agent).status_code == 423
        src = {"url": "https://example.com/other"}
        assert client.post(f"/api/cms/agent/drafts/{page_id}/sources", json=src, headers=agent).status_code == 423
        assert draft(client, agent, title="Created while paused").status_code == 403
    finally:
        client.post("/api/cms/profile/pause", json={"paused": False})


def test_locked_paths_apply_to_new_drafts(client, agent):
    profile = client.get("/api/cms/profile").json()
    profile.setdefault("lockedPaths", []).append({"path": "/notebook/ai/locked-note", "why": "owner keeps this one"})
    assert client.put("/api/cms/profile", json=profile).status_code == 200
    r = draft(client, agent, title="Locked note", slug="locked-note")
    assert r.status_code == 403
    assert "locked" in r.json()["detail"]


def test_route_placeholders_fill_from_fields_and_unfilled_ones_fail_the_gate():
    from agentic_cms import fill_route, resolve_seo, run_gates
    assert fill_route("/notebook/{section}/{slug}", {"slug": "x", "fields": {"section": "AI"}}) == "/notebook/ai/x"
    g = {"siteUrl": "https://example.com", "siteName": "Site"}
    page = {"type": "notebook", "slug": "x", "title": "T", "fields": {}, "blocks": [], "seo": {}}
    gates = run_gates(page, resolve_seo(page, g))
    failed = gates["failed"]
    assert "canonical fully resolved" in failed


def test_required_template_fields_and_robots_are_gated():
    from agentic_cms import resolve_seo, run_gates
    g = {"siteUrl": "https://example.com", "siteName": "Site"}
    page = {"type": "concept", "slug": "x", "title": "T", "fields": {}, "blocks": [],
            "seo": {"robots": "index, sometimes"}}
    failed = run_gates(page, resolve_seo(page, g))["failed"]
    assert "required template fields present" in failed
    assert "robots directive valid" in failed


def test_sitemap_feed_leaves_out_drafts(client):
    DB.posts.insert_many([
        {"slug": "live-post", "pillarSlug": "p", "status": "published"},
        {"slug": "draft-post", "pillarSlug": "p", "status": "draft"},
        {"slug": "legacy-post", "pillarSlug": "p"},
    ])
    slugs = {p["slug"] for p in client.get("/api/content/sitemap").json()["posts"]}
    assert {"live-post", "legacy-post"} <= slugs
    assert "draft-post" not in slugs
