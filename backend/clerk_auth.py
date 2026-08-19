"""clerk_auth.py: verify Clerk session tokens for the admin surface.

Design, and the reasoning behind it:

- Clerk AUTHENTICATES; this module also AUTHORIZES. Clerk will happily
  authenticate anyone who signs up to the Clerk application, so trusting
  "authenticated by Clerk" alone would open the admin to the public. Every
  verified token is checked against ADMIN_ALLOWED_EMAILS, and anyone else
  gets a 403 and a row on the activity log.

- Verification is local, against Clerk's JWKS (RS256). No network call per
  request: the JWKS is fetched once and cached, re-fetched only when an
  unknown key id appears (Clerk rotates keys) or the cache is older than a
  day. A verification outage therefore cannot take the admin down with it.

- This module is OPTIONAL at runtime. If CLERK_JWKS_URL is unset the
  feature is off and the legacy password login stands alone, so local dev
  and the test suites run unchanged with no Clerk account at all.

Environment:
  CLERK_JWKS_URL        https://<instance>.clerk.accounts.dev/.well-known/jwks.json
  CLERK_ISSUER          https://<instance>.clerk.accounts.dev  (token `iss` must match)
  ADMIN_ALLOWED_EMAILS  comma-separated allowlist; defaults to ADMIN_EMAIL
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import jwt as pyjwt
import requests

# Read at call time, not import time, so tests and reconfiguration work
# without a process restart.
def _jwks_url() -> str:
    return os.environ.get("CLERK_JWKS_URL", "").strip()

def _issuer() -> str:
    return os.environ.get("CLERK_ISSUER", "").strip().rstrip("/")

_JWKS_TTL_SEC = 86400
_jwks_cache: Dict[str, Any] = {"keys": {}, "fetched_at": 0.0}


def clerk_enabled() -> bool:
    return bool(_jwks_url() and _issuer())


def _fetch_jwks() -> None:
    resp = requests.get(_jwks_url(), timeout=5)
    resp.raise_for_status()
    keys = {}
    for k in resp.json().get("keys", []):
        if k.get("kid"):
            keys[k["kid"]] = pyjwt.algorithms.RSAAlgorithm.from_jwk(k)
    _jwks_cache["keys"] = keys
    _jwks_cache["fetched_at"] = time.time()


def _key_for(kid: str):
    stale = time.time() - _jwks_cache["fetched_at"] > _JWKS_TTL_SEC
    if kid not in _jwks_cache["keys"] or stale:
        # Unknown kid usually means Clerk rotated keys; refresh once.
        _fetch_jwks()
    return _jwks_cache["keys"].get(kid)


def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
    """Return the verified claims, or None if this is not a valid Clerk
    token. None (rather than raising) lets the caller fall through to the
    legacy verifier, so both auth paths can coexist during migration."""
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
    key = _key_for(header.get("kid", ""))
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
    # Clerk sets azp to the origin that requested the token. When present it
    # must be one of ours, or a token minted for another site is replayable.
    azp = claims.get("azp")
    allowed_azp = {o.strip().rstrip("/") for o in
                   os.environ.get("CLERK_AUTHORIZED_PARTIES", "").split(",") if o.strip()}
    if azp and allowed_azp and azp.rstrip("/") not in allowed_azp:
        return None
    return claims


def allowed_admin_emails(default_admin: str) -> set:
    raw = os.environ.get("ADMIN_ALLOWED_EMAILS", "") or default_admin
    return {e.strip().lower() for e in raw.split(",") if e.strip()}
