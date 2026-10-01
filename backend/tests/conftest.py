"""Shared setup for the backend tests that run the real app.

Suites that start the FastAPI app need a throwaway local MongoDB:

    MONGO_URL=mongodb://127.0.0.1:27091 .venv/bin/python -m pytest -q tests/test_clerk_auth.py tests/test_admin_auth.py tests/test_content_feed.py

Without a local MONGO_URL they skip; the pure verifier tests in
test_clerk_auth.py run anyway. The environment is fixed here, once, before
the app is imported, so every suite in one run shares one app and one
fresh database.

The older suites (test_api.py, test_auth_content_admin.py) call whatever
REACT_APP_BACKEND_URL points at and never import the app. Never point
that at production.
"""
import os
import sys
import uuid

import pytest

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

LOCAL_MONGO = os.environ.get("MONGO_URL", "").startswith(("mongodb://127.0.0.1", "mongodb://localhost"))
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "a-real-test-password-" + uuid.uuid4().hex[:8]

if LOCAL_MONGO:
    os.environ["DB_NAME"] = f"test_{uuid.uuid4().hex[:8]}"
    os.environ["JWT_SECRET"] = "test-secret-" + uuid.uuid4().hex
    os.environ["ADMIN_EMAIL"] = ADMIN_EMAIL
    os.environ["ADMIN_PASSWORD"] = ADMIN_PASSWORD
    os.environ["ENVIRONMENT"] = "test"
    for name in ("RAILWAY_ENVIRONMENT", "RAILWAY_ENVIRONMENT_NAME", "RAILWAY_ENVIRONMENT_ID",
                 "ALLOW_PASSWORD_LOGIN", "CLERK_JWKS_URL", "CLERK_ISSUER",
                 "CLERK_AUTHORIZED_PARTIES", "ADMIN_ALLOWED_EMAILS"):
        os.environ.pop(name, None)


@pytest.fixture(scope="session")
def server_mod():
    if not LOCAL_MONGO:
        pytest.skip("needs a local throwaway MongoDB in MONGO_URL")
    import server
    return server


@pytest.fixture(scope="session")
def app_client(server_mod):
    from fastapi.testclient import TestClient
    from pymongo import MongoClient
    with TestClient(server_mod.app) as c:
        yield c
    MongoClient(os.environ["MONGO_URL"]).drop_database(server_mod.DB_NAME)


@pytest.fixture
def client(app_client, server_mod):
    """The app with no stubbed login and an empty cookie jar, so a cookie
    set by one test (the login endpoint sets one) can never authenticate
    another."""
    server_mod.app.dependency_overrides.pop(server_mod.get_current_admin, None)
    app_client.cookies.clear()
    yield app_client
    app_client.cookies.clear()
    server_mod.app.dependency_overrides.pop(server_mod.get_current_admin, None)


@pytest.fixture
def as_admin(client, server_mod):
    """The app with the admin login stubbed in, for tests about other things."""
    server_mod.app.dependency_overrides[server_mod.get_current_admin] = lambda: {"email": ADMIN_EMAIL, "role": "admin"}
    return client


@pytest.fixture(scope="session")
def sync_db(server_mod):
    # Direct edits in tests go through a plain synchronous client, never the app's async one.
    from pymongo import MongoClient
    return MongoClient(os.environ["MONGO_URL"])[server_mod.DB_NAME]
