"""The public content feed, and proof the old agentic CMS routes are gone.

Runs the real FastAPI app against a throwaway MongoDB (never a shared or
production one). Only the admin login is stubbed.

    MONGO_URL=mongodb://127.0.0.1:27091 python -m pytest -q backend/tests/test_content_feed.py

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

os.environ["DB_NAME"] = f"feed_test_{uuid.uuid4().hex[:8]}"
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


def test_sitemap_feed_leaves_out_drafts(client):
    DB.posts.insert_many([
        {"slug": "live-post", "pillarSlug": "p", "status": "published"},
        {"slug": "draft-post", "pillarSlug": "p", "status": "draft"},
        {"slug": "legacy-post", "pillarSlug": "p"},
    ])
    slugs = {p["slug"] for p in client.get("/api/content/sitemap").json()["posts"]}
    assert {"live-post", "legacy-post"} <= slugs
    assert "draft-post" not in slugs


@pytest.mark.parametrize("method,path", [
    ("get", "/api/cms/review"),
    ("get", "/api/cms/pages"),
    ("post", "/api/cms/agent-tokens"),
    ("post", "/api/cms/agent/drafts"),
    ("post", "/api/cms/profile/pause"),
])
def test_old_cms_routes_are_gone(client, method, path):
    # Even with the admin login stubbed in, nothing answers: the edit doors
    # are removed, not just locked.
    assert getattr(client, method)(path).status_code == 404


def test_post_editor_still_works(client):
    # The one content screen kept until posts move to the new flow. The feed
    # test above leaves bare posts behind that the editor's full schema would
    # reject, so start this one from an empty collection.
    DB.posts.delete_many({})
    r = client.get("/api/admin/cms/posts")
    assert r.status_code == 200, r.text
    assert r.json() == []
