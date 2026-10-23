"""A stand-in for Clerk: our own RSA keys, published as a JWKS by a throwaway
local HTTP server, and a minter for session tokens. No Clerk account needed.

The server can be switched to fail (HTTP 500) or to return garbage, and it
counts every fetch, so tests can prove how the verifier behaves when Clerk
is down or when someone floods it with made-up key ids.
"""
from __future__ import annotations

import base64
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import jwt as pyjwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

ISSUER = "https://clerk.test.local"
ORIGIN = "https://venkatapagadala.com"
OWNER = "owner@example.com"


def _b64u_int(i: int) -> str:
    return base64.urlsafe_b64encode(i.to_bytes((i.bit_length() + 7) // 8, "big")).rstrip(b"=").decode()


class Keypair:
    def __init__(self, kid: str):
        self.kid = kid
        self.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.pem = self.key.private_bytes(serialization.Encoding.PEM,
                                          serialization.PrivateFormat.PKCS8,
                                          serialization.NoEncryption())
        self.public_pem = self.key.public_key().public_bytes(serialization.Encoding.PEM,
                                                             serialization.PublicFormat.SubjectPublicKeyInfo)

    def jwk(self) -> dict:
        n = self.key.public_key().public_numbers()
        return {"kty": "RSA", "kid": self.kid, "use": "sig", "alg": "RS256",
                "n": _b64u_int(n.n), "e": _b64u_int(n.e)}

    def mint(self, kid: str | None = None, alg: str = "RS256", drop=(), **over) -> str:
        now = int(time.time())
        claims = {"iss": ISSUER, "sub": "user_123", "email": OWNER, "azp": ORIGIN,
                  "iat": now, "exp": now + 300}
        for name in drop:
            claims.pop(name, None)
        claims.update(over)
        return pyjwt.encode(claims, self.pem, algorithm=alg, headers={"kid": kid or self.kid})


class JwksServer:
    """Serves {"keys": [...]} for the keypairs in `self.keys`."""

    def __init__(self, *keypairs: Keypair):
        self.keys = list(keypairs)
        # "ok" | "fail" (HTTP 500) | "garbage" (not JSON) | "empty" ({"keys": []})
        # | "mixed" (an EC key and a broken RSA key alongside the real ones)
        self.mode = "ok"
        self.delay = 0.0  # seconds to wait before answering (slow or hanging Clerk)
        self.hits = 0
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                outer.hits += 1
                if outer.delay:
                    time.sleep(outer.delay)
                if outer.mode == "fail":
                    self.send_response(500)
                    self.end_headers()
                    return
                keys = [k.jwk() for k in outer.keys]
                if outer.mode == "empty":
                    keys = []
                elif outer.mode == "mixed":
                    keys = [{"kty": "EC", "kid": "ec-key", "crv": "P-256", "x": "AA", "y": "AA"},
                            {"kty": "RSA", "kid": "broken", "n": "!!", "e": "AQAB"}] + keys
                body = (b"this is not json" if outer.mode == "garbage"
                        else json.dumps({"keys": keys}).encode())
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args):
                pass

        self._srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self._srv.daemon_threads = True
        self.url = f"http://127.0.0.1:{self._srv.server_address[1]}/.well-known/jwks.json"
        threading.Thread(target=self._srv.serve_forever, daemon=True).start()

    def close(self):
        self._srv.shutdown()


def reset_verifier_cache():
    import clerk_auth
    clerk_auth._jwks_cache.update(keys={}, fetched_at=0.0, attempted_at=0.0, last_ok=False)


def raw_jwt(header: dict, payload: dict, signature: bytes) -> str:
    """Hand-assemble a JWT, the way an attacker would, so the VERIFIER (not
    the encoder) is what has to reject it."""
    def b64u(b: bytes) -> str:
        return base64.urlsafe_b64encode(b).rstrip(b"=").decode()
    return f"{b64u(json.dumps(header).encode())}.{b64u(json.dumps(payload).encode())}.{b64u(signature)}"
