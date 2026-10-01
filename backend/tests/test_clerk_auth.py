"""The Clerk token verifier (backend/clerk_auth.py), attacked directly.

No database and no Clerk account: clerk_testkit publishes our own keys as a
JWKS. Ported from scripts/clerk-verify-tests.py (the 17 original attacks,
V01 to V14), plus the 2026-09-26 hardening (V15 onward): Clerk outages,
key-id floods, origin checks that fail closed in production, and every
email claim name.
"""
import hashlib
import hmac
import json
import time

import pytest

import clerk_auth
from clerk_testkit import ISSUER, ORIGIN, OWNER, JwksServer, Keypair, raw_jwt, reset_verifier_cache

PROD_VARS = ("RAILWAY_ENVIRONMENT", "RAILWAY_ENVIRONMENT_NAME", "RAILWAY_ENVIRONMENT_ID", "ENVIRONMENT")


@pytest.fixture(scope="module")
def keys():
    return Keypair("key-1"), Keypair("key-2")


@pytest.fixture
def jwks(keys):
    srv = JwksServer(keys[0])
    yield srv
    srv.close()


@pytest.fixture(autouse=True)
def env(monkeypatch, jwks):
    monkeypatch.setenv("CLERK_JWKS_URL", jwks.url)
    monkeypatch.setenv("CLERK_ISSUER", ISSUER)
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", ORIGIN)
    monkeypatch.setenv("ADMIN_ALLOWED_EMAILS", f"{OWNER}, second@example.com")
    for name in PROD_VARS:
        monkeypatch.delenv(name, raising=False)
    reset_verifier_cache()
    yield
    reset_verifier_cache()


def verify(token):
    return clerk_auth.verify_clerk_token(token)


# ---------- V01 to V14: the original attacks ----------

def test_v01_valid_token_verifies(keys):
    claims = verify(keys[0].mint())
    assert claims is not None and claims["email"] == OWNER


def test_v02_token_signed_with_the_wrong_key(keys):
    assert verify(keys[1].mint(kid="key-1")) is None


def test_v03_unknown_key_id(keys):
    assert verify(keys[0].mint(kid="not-a-key")) is None


def test_v04_tampered_signature(keys):
    assert verify(keys[0].mint()[:-4] + "AAAA") is None


def test_v05_garbage_string():
    assert verify("not.a.jwt") is None
    assert verify("") is None


def test_v06_rs256_to_hs256_confusion(keys):
    # HMAC the signing input with the PUBLIC key as the secret: the classic
    # algorithm-confusion forgery.
    claims = {"iss": ISSUER, "sub": "u", "email": OWNER, "azp": ORIGIN,
              "iat": int(time.time()), "exp": int(time.time()) + 300}
    header = {"alg": "HS256", "kid": "key-1", "typ": "JWT"}
    unsigned = raw_jwt(header, claims, b"").rsplit(".", 1)[0]
    sig = hmac.new(keys[0].public_pem, unsigned.encode(), hashlib.sha256).digest()
    forged = raw_jwt(header, claims, sig)
    assert verify(forged) is None


def test_v07_alg_none(keys):
    claims = {"iss": ISSUER, "sub": "u", "email": OWNER, "azp": ORIGIN,
              "iat": int(time.time()), "exp": int(time.time()) + 300}
    assert verify(raw_jwt({"alg": "none", "typ": "JWT"}, claims, b"")) is None


def test_v08_wrong_issuer(keys):
    assert verify(keys[0].mint(iss="https://evil.clerk.local")) is None


def test_v09_expired(keys):
    assert verify(keys[0].mint(exp=int(time.time()) - 60)) is None


def test_v10_wrong_authorized_party(keys):
    assert verify(keys[0].mint(azp="https://evil.example")) is None


def test_v11_missing_required_sub(keys):
    assert verify(keys[0].mint(drop=("sub",))) is None


def test_v12_authenticated_is_not_authorized(keys):
    # A stranger who signs up to the Clerk app gets a valid token; only the
    # allowlist (checked by the server) keeps them out.
    stranger = verify(keys[0].mint(email="stranger@gmail.com"))
    assert stranger is not None
    assert "stranger@gmail.com" not in clerk_auth.allowed_admin_emails("admin@example.com")


def test_v13_allowlist_ignores_case_and_spaces(monkeypatch):
    monkeypatch.setenv("ADMIN_ALLOWED_EMAILS", "  Owner@Example.com ,second@example.com ")
    assert clerk_auth.allowed_admin_emails("x@y") == {OWNER, "second@example.com"}
    monkeypatch.delenv("ADMIN_ALLOWED_EMAILS")
    assert clerk_auth.allowed_admin_emails("Admin@Example.com") == {"admin@example.com"}


def test_v14_off_when_unconfigured(monkeypatch, keys):
    monkeypatch.delenv("CLERK_JWKS_URL")
    monkeypatch.delenv("CLERK_ISSUER")
    assert clerk_auth.clerk_enabled() is False
    assert verify(keys[0].mint()) is None


# ---------- V15 onward: 2026-09-26 hardening ----------

def test_v15_clerk_down_on_first_use_says_try_again(jwks, keys):
    # Not a crash and not "refused": a distinct signal the server turns into 503.
    jwks.mode = "fail"
    with pytest.raises(clerk_auth.ClerkKeysUnavailable):
        verify(keys[0].mint())


def test_v16_clerk_down_later_keeps_the_cached_keys(jwks, keys):
    assert verify(keys[0].mint()) is not None  # primes the cache
    jwks.mode = "fail"
    clerk_auth._jwks_cache["fetched_at"] -= 2 * 86400  # cache is now stale...
    clerk_auth._jwks_cache["attempted_at"] -= 120      # ...and a refetch is due
    assert verify(keys[0].mint()) is not None  # refetch fails, cached key still works
    assert jwks.hits == 2


def test_v17_made_up_key_ids_cannot_flood_clerk(jwks, keys):
    assert verify(keys[0].mint()) is not None
    for i in range(25):
        assert verify(keys[0].mint(kid=f"random-{i}")) is None
    assert jwks.hits == 1  # every unknown kid fell inside the cooldown
    clerk_auth._jwks_cache["attempted_at"] -= clerk_auth._REFETCH_COOLDOWN_SEC + 1
    assert verify(keys[0].mint(kid="random-after-cooldown")) is None
    assert jwks.hits == 2  # one refetch per cooldown, no more


def test_v18_key_rotation_waits_for_the_cooldown_then_is_picked_up(jwks, keys):
    assert verify(keys[0].mint()) is not None
    jwks.keys = [keys[0], keys[1]]  # Clerk publishes a new key
    assert verify(keys[1].mint()) is None  # inside the cooldown: no fetch, not yet known
    assert jwks.hits == 1
    clerk_auth._jwks_cache["attempted_at"] -= clerk_auth._REFETCH_COOLDOWN_SEC + 1
    assert verify(keys[1].mint()) is not None
    assert jwks.hits == 2


def test_v19_garbage_jwks_says_try_again(jwks, keys):
    jwks.mode = "garbage"
    with pytest.raises(clerk_auth.ClerkKeysUnavailable):
        verify(keys[0].mint())


def test_v20_missing_authorized_party_is_refused(keys):
    assert verify(keys[0].mint(drop=("azp",))) is None


@pytest.mark.parametrize("var,value", [
    ("RAILWAY_ENVIRONMENT", "production"),
    ("RAILWAY_ENVIRONMENT_NAME", "production"),
    ("RAILWAY_ENVIRONMENT_ID", "abc-123"),
    ("ENVIRONMENT", "production"),
])
def test_v21_production_without_authorized_parties_fails_closed(monkeypatch, keys, var, value):
    monkeypatch.delenv("CLERK_AUTHORIZED_PARTIES")
    monkeypatch.setenv(var, value)
    assert clerk_auth.is_production() is True
    assert verify(keys[0].mint()) is None


def test_v22_local_without_authorized_parties_still_works(monkeypatch, keys):
    monkeypatch.delenv("CLERK_AUTHORIZED_PARTIES")
    assert clerk_auth.is_production() is False
    assert verify(keys[0].mint()) is not None


def test_v23_authorized_party_trailing_slash_is_ignored(monkeypatch, keys):
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", ORIGIN + "/, https://www.venkatapagadala.com")
    assert verify(keys[0].mint(azp=ORIGIN)) is not None
    assert verify(keys[0].mint(azp=ORIGIN + "/")) is not None


def test_v24_missing_or_odd_key_id_is_refused_without_a_fetch(jwks, keys):
    claims = {"iss": ISSUER, "sub": "u", "email": OWNER, "azp": ORIGIN,
              "iat": int(time.time()), "exp": int(time.time()) + 300}
    assert verify(raw_jwt({"alg": "RS256", "typ": "JWT"}, claims, b"x")) is None
    assert verify(raw_jwt({"alg": "RS256", "kid": 7, "typ": "JWT"}, claims, b"x")) is None
    assert jwks.hits == 0


@pytest.mark.parametrize("claims,expected", [
    ({"email": "Owner@Example.com"}, OWNER),
    ({"primary_email": "owner@example.com"}, OWNER),
    ({"primaryEmail": " owner@example.com "}, OWNER),       # Clerk's docs example name
    ({"email": "", "primaryEmail": "owner@example.com"}, OWNER),
    ({"email": {"not": "a string"}}, ""),
    ({}, ""),
])
def test_v25_email_from_every_claim_name(claims, expected):
    assert clerk_auth.email_from_claims(claims) == expected


def test_v26_is_production_is_false_on_a_laptop():
    assert clerk_auth.is_production() is False


# ---------- added after the 2026-09-27 review ----------

def test_v27_an_empty_key_set_keeps_the_cached_keys(jwks, keys):
    assert verify(keys[0].mint()) is not None
    jwks.mode = "empty"
    clerk_auth._jwks_cache["fetched_at"] -= 2 * 86400
    clerk_auth._jwks_cache["attempted_at"] -= 120
    assert verify(keys[0].mint()) is not None
    assert jwks.hits == 2


def test_v28_unusable_keys_are_skipped_and_the_rsa_key_still_works(jwks, keys):
    jwks.mode = "mixed"
    assert verify(keys[0].mint()) is not None


def test_v29_cold_cache_concurrent_requests_all_wait_for_one_fetch(jwks, keys):
    import threading
    jwks.delay = 0.5
    results = []
    def worker():
        results.append(verify(keys[0].mint()) is not None)
    threads = [threading.Thread(target=worker) for _ in range(8)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert results == [True] * 8
    assert jwks.hits == 1


def test_v30_after_a_failed_first_fetch_the_retry_comes_in_seconds(jwks, keys):
    jwks.mode = "fail"
    with pytest.raises(clerk_auth.ClerkKeysUnavailable):
        verify(keys[0].mint())
    jwks.mode = "ok"
    with pytest.raises(clerk_auth.ClerkKeysUnavailable):
        verify(keys[0].mint())  # inside the short backoff: no second fetch yet
    assert jwks.hits == 1
    clerk_auth._jwks_cache["attempted_at"] -= clerk_auth._EMPTY_RETRY_SEC + 1
    assert verify(keys[0].mint()) is not None  # not the 60 s cooldown
    assert jwks.hits == 2


def test_v31_production_with_authorized_parties_accepts_our_own_token(monkeypatch, keys):
    monkeypatch.setenv("RAILWAY_ENVIRONMENT_NAME", "production")
    assert verify(keys[0].mint()) is not None


def test_v32_a_made_up_key_id_with_healthy_keys_is_a_plain_refusal(jwks, keys):
    assert verify(keys[0].mint()) is not None
    assert verify(keys[0].mint(kid="made-up")) is None  # refused, not "try again"
