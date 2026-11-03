"""The admin login check (server.get_current_admin), end to end.

Runs the real app against a throwaway local MongoDB (conftest.py) with no
stubbed login, and a stand-in Clerk from clerk_testkit. Covers the
2026-09-26 cutover plan: Google or any Clerk sign-in works for allowlisted
emails under every claim name; strangers are refused; once Clerk is on in
production the old password login and its tokens are dead unless the
break-glass is set; a Clerk outage is a 401, never a 500 or a hang.
"""
import time

import pytest

import clerk_auth
from clerk_testkit import ISSUER, ORIGIN, OWNER, JwksServer, Keypair, reset_verifier_cache
from conftest import ADMIN_EMAIL, ADMIN_PASSWORD

ME = "/api/auth/me"


@pytest.fixture(scope="module")
def key():
    return Keypair("admin-key")


@pytest.fixture
def jwks(key):
    srv = JwksServer(key)
    yield srv
    srv.close()


@pytest.fixture
def clerk_on(monkeypatch, jwks):
    monkeypatch.setenv("CLERK_JWKS_URL", jwks.url)
    monkeypatch.setenv("CLERK_ISSUER", ISSUER)
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", ORIGIN)
    monkeypatch.setenv("ADMIN_ALLOWED_EMAILS", OWNER)
    reset_verifier_cache()
    yield
    reset_verifier_cache()


@pytest.fixture
def production(monkeypatch, server_mod):
    monkeypatch.setattr(server_mod, "IS_PRODUCTION", True)
    monkeypatch.setenv("RAILWAY_ENVIRONMENT_NAME", "production")


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Clerk sign-in ----------

@pytest.mark.parametrize("claim", ["email", "primary_email", "primaryEmail"])
def test_a01_allowlisted_owner_gets_in_under_every_claim_name(client, clerk_on, key, claim):
    token = key.mint(drop=("email",), **{claim: OWNER})
    r = client.get(ME, headers=bearer(token))
    assert r.status_code == 200, r.text
    assert r.json()["email"] == OWNER


def test_a02_token_without_an_email_claim_is_refused_with_the_fix(client, clerk_on, key):
    r = client.get(ME, headers=bearer(key.mint(drop=("email",))))
    assert r.status_code == 401
    assert "session token" in r.json()["detail"]


def test_a03_stranger_is_refused_and_logged(client, clerk_on, key, sync_db):
    r = client.get(ME, headers=bearer(key.mint(email="stranger@gmail.com", sub="user_stranger")))
    assert r.status_code == 403
    assert sync_db.cms_activity.find_one({"actor.id": "user_stranger", "result": "refused"})


def test_a04_wrong_origin_is_refused(client, clerk_on, key):
    assert client.get(ME, headers=bearer(key.mint(azp="https://evil.example"))).status_code == 401


def test_a05_production_without_authorized_parties_refuses_clerk(client, clerk_on, production, key, monkeypatch):
    monkeypatch.delenv("CLERK_AUTHORIZED_PARTIES")
    assert client.get(ME, headers=bearer(key.mint())).status_code == 401


def test_a06_clerk_outage_is_a_503_try_again_not_a_500(client, clerk_on, jwks, key):
    jwks.mode = "fail"
    started = time.monotonic()
    r = client.get(ME, headers=bearer(key.mint()))
    assert r.status_code == 503
    assert "try again" in r.json()["detail"]
    assert time.monotonic() - started < 3


# ---------- the old password login ----------

def legacy_token(server_mod):
    return server_mod.create_access_token(ADMIN_EMAIL)


def test_a07_production_with_clerk_refuses_old_password_tokens(client, clerk_on, production, server_mod):
    r = client.get(ME, headers=bearer(legacy_token(server_mod)))
    assert r.status_code == 401
    assert "Password sessions are disabled" in r.json()["detail"]


def test_a08_production_with_clerk_closes_the_password_login(client, clerk_on, production):
    r = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 403


def test_a09_break_glass_reopens_both(client, clerk_on, production, server_mod, monkeypatch):
    monkeypatch.setenv("ALLOW_PASSWORD_LOGIN", "true")
    assert client.get(ME, headers=bearer(legacy_token(server_mod))).status_code == 200
    r = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text


@pytest.mark.parametrize("value", ["false", "0", "", "yes", "TRUE "])
def test_a09b_anything_but_true_keeps_the_break_glass_closed(client, clerk_on, production, server_mod, monkeypatch, value):
    monkeypatch.setenv("ALLOW_PASSWORD_LOGIN", value)
    expected_open = value.strip().lower() == "true"
    r = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert (r.status_code == 200) is expected_open
    client.cookies.clear()
    assert (client.get(ME, headers=bearer(legacy_token(server_mod))).status_code == 200) is expected_open


def test_a10_clerk_on_but_not_production_keeps_password_sessions(client, clerk_on, server_mod):
    # Local dev and the staging checks are unchanged until production.
    assert client.get(ME, headers=bearer(legacy_token(server_mod))).status_code == 200


def test_a11_clerk_off_password_login_works_end_to_end(client):
    r = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    client.cookies.clear()  # prove the bearer token alone is enough
    assert client.get(ME, headers=bearer(r.json()["access_token"])).status_code == 200


# ---------- no login at all ----------

@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer "}, {"Authorization": "Bearer garbage"},
                                     {"Authorization": "Basic abc"}])
def test_a12_no_or_broken_login_is_refused(client, clerk_on, headers):
    assert client.get(ME, headers=headers).status_code == 401


def test_a13_a_slow_clerk_does_not_stall_other_requests(client, clerk_on, jwks, key, monkeypatch):
    # While one sign-in waits on a hanging Clerk, the rest of the API answers.
    import threading
    monkeypatch.setattr(clerk_auth, "_FETCH_TIMEOUT_SEC", 2)
    jwks.delay = 3
    slow = {}
    def sign_in():
        started = time.monotonic()
        slow["status"] = client.get(ME, headers=bearer(key.mint())).status_code
        slow["took"] = time.monotonic() - started
    t = threading.Thread(target=sign_in)
    t.start()
    time.sleep(0.3)
    started = time.monotonic()
    assert client.get("/api/").status_code == 200
    assert time.monotonic() - started < 1  # not stuck behind the slow sign-in
    t.join()
    assert slow["status"] == 503 and slow["took"] < 4  # bounded by the fetch timeout
    started = time.monotonic()
    assert client.get(ME, headers=bearer(key.mint())).status_code == 503
    assert time.monotonic() - started < 1  # inside the retry backoff: no second wait


def test_a14_owner_signs_in_with_clerk_in_production(client, clerk_on, production, key):
    r = client.get(ME, headers=bearer(key.mint()))
    assert r.status_code == 200, r.text
    assert r.json()["email"] == OWNER


def test_a15_conference_notebook_works_with_a_clerk_sign_in_in_production(client, clerk_on, production, key):
    body = {"note": "Clerk-signed note", "takeaways": [], "status": "draft", "is_public": False}
    r = client.put("/api/notebook/notes/test-conf/s1", json=body, headers=bearer(key.mint()))
    assert r.status_code == 200, r.text
    r = client.get("/api/notebook/notes/test-conf", headers=bearer(key.mint()))
    assert r.status_code == 200 and any(n.get("note") == "Clerk-signed note" for n in r.json())
