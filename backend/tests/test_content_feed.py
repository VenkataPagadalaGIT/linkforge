"""The public content feed, and proof the old agentic CMS routes are gone.

Runs the real app against a throwaway local MongoDB (see conftest.py).
"""
import pytest


def test_sitemap_feed_leaves_out_drafts(as_admin, sync_db):
    sync_db.posts.insert_many([
        {"slug": "live-post", "pillarSlug": "p", "status": "published"},
        {"slug": "draft-post", "pillarSlug": "p", "status": "draft"},
        {"slug": "legacy-post", "pillarSlug": "p"},
    ])
    slugs = {p["slug"] for p in as_admin.get("/api/content/sitemap").json()["posts"]}
    assert {"live-post", "legacy-post"} <= slugs
    assert "draft-post" not in slugs
    sync_db.posts.delete_many({"slug": {"$in": ["live-post", "draft-post", "legacy-post"]}})


@pytest.mark.parametrize("method,path", [
    ("get", "/api/cms/review"),
    ("get", "/api/cms/pages"),
    ("post", "/api/cms/agent-tokens"),
    ("post", "/api/cms/agent/drafts"),
    ("post", "/api/cms/profile/pause"),
])
def test_old_cms_routes_are_gone(as_admin, method, path):
    # Even with the admin login stubbed in, nothing answers: the edit doors
    # are removed, not just locked.
    assert getattr(as_admin, method)(path).status_code == 404


def test_post_editor_requires_login(client):
    # The one write door left must stay locked: with no login, or with a
    # made-up token, reading and writing posts are both refused.
    assert client.get("/api/admin/cms/posts").status_code == 401
    bad = {"Authorization": "Bearer not-a-real-token"}
    assert client.get("/api/admin/cms/posts", headers=bad).status_code == 401
    assert client.post("/api/admin/cms/posts", json={"slug": "x"}, headers=bad).status_code == 401


def test_post_editor_still_works(as_admin, sync_db):
    # The one content screen kept until posts move to the new flow.
    sync_db.posts.delete_many({})
    r = as_admin.get("/api/admin/cms/posts")
    assert r.status_code == 200, r.text
    assert r.json() == []
