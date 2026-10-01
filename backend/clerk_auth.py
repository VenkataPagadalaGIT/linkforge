"""clerk_auth.py: verify Clerk session tokens for the admin surface.

Design, and the reasoning behind it:

- Clerk AUTHENTICATES; this module also AUTHORIZES. Clerk will happily
  authenticate anyone who signs up to the Clerk application, so trusting
  "authenticated by Clerk" alone would open the admin to the public. Every
  verified token is checked against ADMIN_ALLOWED_EMAILS, and anyone else
  gets a 403 and a row on the activity log.

- Verification is local, against Clerk's JWKS (RS256). No network call per
  request: the JWKS is fetched once (and warmed at boot) and cached,
  re-fetched only when an unknown key id appears (Clerk rotates keys) or the
  cache is older than a day. A failed fetch keeps the cached keys in use.
  When keys cannot be loaded at all, verify_clerk_token raises
  ClerkKeysUnavailable, which the server answers with 503 "try again": a
  Clerk outage is never a 500 and never a misleading "sign-in refused".
- Re-fetches are rate-limited (once per 60 s while keys are cached, every
  5 s while there are none) and serialized by a lock, so concurrent requests
  on a cold cache wait for the one fetch instead of failing, and a flood of
  tokens with made-up key ids cannot turn the backend into a request
  amplifier against Clerk.

- The token must come from one of our own origins (the `azp` claim). In
  production this is fail-closed: with CLERK_AUTHORIZED_PARTIES unset, no
  Clerk token is accepted.

- This module is OPTIONAL at runtime. If CLERK_JWKS_URL is unset the
  feature is off and the legacy password login stands alone, so local dev
  and the test suites run unchanged with no Clerk account at all.

Environment:
  CLERK_JWKS_URL            https://<frontend-api>/.well-known/jwks.json
  CLERK_ISSUER              https://<frontend-api>  (token `iss` must match)
  CLERK_AUTHORIZED_PARTIES  comma-separated origins, e.g. https://venkatapagadala.com
                            (required in production)
  ADMIN_ALLOWED_EMAILS      comma-separated allowlist; defaults to ADMIN_EMAIL
"""
from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any, Dict, Optional

import jwt as pyjwt
import requests

logger = logging.getLogger("mono-mind.clerk")

_JWKS_TTL_SEC = 86400
# At most one JWKS fetch per this many seconds while keys are cached...
_REFETCH_COOLDOWN_SEC = 60
# ...and a quicker retry while there are no keys at all (a failed first fetch).
_EMPTY_RETRY_SEC = 5
_FETCH_TIMEOUT_SEC = 5
_fetch_lock = threading.Lock()
_jwks_cache: Dict[str, Any] = {"keys": {}, "fetched_at": 0.0, "attempted_at": 0.0, "last_ok": False}


class ClerkKeysUnavailable(Exception):
    """Clerk's signing keys could not be loaded, so a Clerk token cannot be
    checked right now. The server answers 503 (try again), not 401."""


# Read at call time, not import time, so tests and reconfiguration work
# without a process restart.
def _jwks_url() -> str:
    return os.environ.get("CLERK_JWKS_URL", "").strip()


def _issuer() -> str:
    return os.environ.get("CLERK_ISSUER", "").strip().rstrip("/")


def _authorized_parties() -> set:
    raw = os.environ.get("CLERK_AUTHORIZED_PARTIES", "")
    return {o.strip().rstrip("/") for o in raw.split(",") if o.strip()}


def is_production() -> bool:
    """A real deployment, not a laptop. Railway sets RAILWAY_ENVIRONMENT on
    older services and RAILWAY_ENVIRONMENT_NAME / _ID on current ones; any of
    them, or ENVIRONMENT=production, counts."""
    return bool(
        os.environ.get("RAILWAY_ENVIRONMENT")
        or os.environ.get("RAILWAY_ENVIRONMENT_NAME")
        or os.environ.get("RAILWAY_ENVIRONMENT_ID")
        or os.environ.get("ENVIRONMENT", "").lower() in ("production", "prod")
    )


def clerk_enabled() -> bool:
    return bool(_jwks_url() and _issuer())


def _refresh_jwks() -> None:
    """Fetch the JWKS, rate-limited and one fetch at a time. Never raises:
    on any failure the previously cached keys stay in use. Callers that
    arrive during a fetch wait for it, then read the fresh cache."""
    with _fetch_lock:
        now = time.time()
        cooldown = _REFETCH_COOLDOWN_SEC if _jwks_cache["keys"] else _EMPTY_RETRY_SEC
        if now - _jwks_cache["attempted_at"] < cooldown:
            return
        _jwks_cache["attempted_at"] = now
        try:
            resp = requests.get(_jwks_url(), timeout=_FETCH_TIMEOUT_SEC)
            resp.raise_for_status()
            keys = {}
            for k in resp.json().get("keys", []):
                if not (isinstance(k, dict) and k.get("kid")):
                    continue
                try:
                    keys[k["kid"]] = pyjwt.algorithms.RSAAlgorithm.from_jwk(k)
                except Exception:  # not an RSA key, or malformed: skip it
                    continue
            if keys:
                _jwks_cache["keys"] = keys
                _jwks_cache["fetched_at"] = now
                _jwks_cache["last_ok"] = True
            else:
                _jwks_cache["last_ok"] = False
                logger.warning("Clerk JWKS had no usable RSA keys; keeping cached keys")
        except Exception as exc:  # network, HTTP status, bad JSON
            _jwks_cache["last_ok"] = False
            logger.warning("Clerk JWKS refresh failed (%s); keeping cached keys", type(exc).__name__)


def warm_jwks() -> None:
    """Load the keys at boot so the first sign-in does not pay for the
    fetch. Never raises."""
    if clerk_enabled():
        _refresh_jwks()


def _key_for(kid: str):
    stale = time.time() - _jwks_cache["fetched_at"] > _JWKS_TTL_SEC
    if kid not in _jwks_cache["keys"] or stale:
        # Unknown kid usually means Clerk rotated keys; refresh (rate-limited).
        _refresh_jwks()
    key = _jwks_cache["keys"].get(kid)
    if key is None and not _jwks_cache["last_ok"]:
        # We cannot tell a real new key from a made-up one while Clerk is
        # unreachable: say "try again", not "refused".
        raise ClerkKeysUnavailable()
    return key


def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
    """Return the verified claims, or None if this is not a valid Clerk
    token. Raises ClerkKeysUnavailable when Clerk's keys cannot be loaded
    right now. Blocking (it may fetch the JWKS): call it off the event loop."""
    if not clerk_enabled():
        return None
    try:
        header = pyjwt.get_unverified_header(token)
    except pyjwt.InvalidTokenError:
        return None
    if header.get("alg") != "RS256":
        # Legacy tokens are HS256; anything else is not ours. Never let a
        # token choose a weaker algorithm than the key demands.
        return None
    kid = header.get("kid")
    if not isinstance(kid, str) or not kid:
        return None
    key = _key_for(kid)
    if key is None:
        return None
    try:
        claims = pyjwt.decode(
            token, key=key, algorithms=["RS256"],
            issuer=_issuer(),
            options={"require": ["exp", "iat", "iss", "sub"]},
            leeway=10,
        )
    except pyjwt.InvalidTokenError:
        return None
    # Clerk sets azp to the origin that requested the token. It must be one
    # of ours, or a token minted for another site on the same Clerk instance
    # is replayable here.
    allowed = _authorized_parties()
    azp = claims.get("azp")
    if allowed:
        if not isinstance(azp, str) or azp.rstrip("/") not in allowed:
            return None
    elif is_production():
        logger.warning("CLERK_AUTHORIZED_PARTIES is unset in production; refusing Clerk tokens")
        return None
    return claims


def email_from_claims(claims: Dict[str, Any]) -> str:
    """The signed-in email, from whichever claim name the session token
    template uses: `email` (our setup guide), `primary_email`, or
    `primaryEmail` (Clerk's own docs example). Lowercased; "" if none."""
    for name in ("email", "primary_email", "primaryEmail"):
        value = claims.get(name)
        if isinstance(value, str) and value.strip():
            return value.strip().lower()
    return ""


def allowed_admin_emails(default_admin: str) -> set:
    raw = os.environ.get("ADMIN_ALLOWED_EMAILS", "") or default_admin
    return {e.strip().lower() for e in raw.split(",") if e.strip()}
