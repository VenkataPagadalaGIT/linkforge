#!/usr/bin/env python3
"""Attacks on the Clerk token verifier (backend/clerk_auth.py).

No Clerk account needed: we generate our own RSA keypair, publish it as a
JWKS through a throwaway HTTP server, point the verifier at it, and then
try to get a forged token past it. Every case here is a way an attacker
would try to mint an admin session.
"""
from __future__ import annotations

import json, os, sys, threading, time
from http.server import BaseHTTPRequestHandler, HTTPServer

import jwt as pyjwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

failures = []
def check(label, ok, detail=""):
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{f'  ({detail})' if detail else ''}")
    if not ok: failures.append(label)

# --- a real keypair, and a second one for the wrong-key test ---
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
KID = "test-key-1"

def jwk_for(pub, kid):
    n = pub.public_numbers().n
    e = pub.public_numbers().e
    import base64
    b64 = lambda i: base64.urlsafe_b64encode(i.to_bytes((i.bit_length()+7)//8, "big")).rstrip(b"=").decode()
    return {"kty": "RSA", "kid": kid, "use": "sig", "alg": "RS256", "n": b64(n), "e": b64(e)}

JWKS = {"keys": [jwk_for(key.public_key(), KID)]}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps(JWKS).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a): pass

srv = HTTPServer(("127.0.0.1", 0), Handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

ISSUER = f"https://test.clerk.local"
os.environ["CLERK_JWKS_URL"] = f"http://127.0.0.1:{port}/jwks.json"
os.environ["CLERK_ISSUER"] = ISSUER
os.environ["CLERK_AUTHORIZED_PARTIES"] = "https://venkatapagadala.com"
os.environ["ADMIN_ALLOWED_EMAILS"] = "vdepagadala@gmail.com, admin@monomind.com"

import clerk_auth
priv_pem = key.private_bytes(serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
other_pem = other.private_bytes(serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8, serialization.NoEncryption())

def mint(priv=priv_pem, kid=KID, alg="RS256", **over):
    claims = {"iss": ISSUER, "sub": "user_123", "email": "vdepagadala@gmail.com",
              "azp": "https://venkatapagadala.com",
              "iat": int(time.time()), "exp": int(time.time()) + 300}
    claims.update(over)
    return pyjwt.encode(claims, priv, algorithm=alg, headers={"kid": kid})

print("\n[1] A valid Clerk token verifies")
c = clerk_auth.verify_clerk_token(mint())
check("valid token returns claims", c is not None and c["email"] == "vdepagadala@gmail.com")

print("\n[2] Forgery and tampering are rejected")
check("token signed with the wrong key", clerk_auth.verify_clerk_token(mint(priv=other_pem)) is None)
check("unknown kid", clerk_auth.verify_clerk_token(mint(kid="not-a-key")) is None)
tampered = mint()[:-4] + "AAAA"
check("tampered signature", clerk_auth.verify_clerk_token(tampered) is None)
check("garbage string", clerk_auth.verify_clerk_token("not.a.jwt") is None)

print("\n[3] Algorithm confusion is rejected")
# PyJWT refuses to *create* these, which is its own defence. A real attacker
# hand-crafts them, so we assemble the raw JWTs ourselves to be sure OUR
# verifier is what rejects them, not the encoder.
import base64, hashlib, hmac
def b64u(b): return base64.urlsafe_b64encode(b).rstrip(b"=").decode()
def raw_jwt(header, payload, sig_bytes):
    h = b64u(json.dumps(header).encode()); p = b64u(json.dumps(payload).encode())
    return f"{h}.{p}.{b64u(sig_bytes)}"
claims = {"iss": ISSUER, "sub": "u", "email": "vdepagadala@gmail.com",
          "iat": int(time.time()), "exp": int(time.time())+300, "azp": "https://venkatapagadala.com"}
# RS256->HS256: HMAC the signing input with the PEM public key as the secret.
pub_pem = key.public_key().public_bytes(serialization.Encoding.PEM,
    serialization.PublicFormat.SubjectPublicKeyInfo)
hdr = {"alg": "HS256", "kid": KID, "typ": "JWT"}
signing_input = f"{b64u(json.dumps(hdr).encode())}.{b64u(json.dumps(claims).encode())}".encode()
sig = hmac.new(pub_pem, signing_input, hashlib.sha256).digest()
hs = f"{signing_input.decode()}.{b64u(sig)}"
check("RS256->HS256 confusion", clerk_auth.verify_clerk_token(hs) is None)
# alg=none with an empty signature.
none = raw_jwt({"alg": "none", "typ": "JWT"}, claims, b"")
check("alg=none", clerk_auth.verify_clerk_token(none) is None)

print("\n[4] Claim checks")
check("wrong issuer", clerk_auth.verify_clerk_token(mint(iss="https://evil.clerk.local")) is None)
check("expired token", clerk_auth.verify_clerk_token(mint(exp=int(time.time())-10)) is None)
check("wrong authorized party (replayed from another site)",
      clerk_auth.verify_clerk_token(mint(azp="https://evil.example")) is None)
check("missing required sub", clerk_auth.verify_clerk_token(mint(sub=None)) is None)

print("\n[5] Authorization: authenticated is not authorized")
# The verifier returns claims for any valid Clerk user; the ALLOWLIST in
# get_current_admin is what stops a stranger who signed up to Clerk.
allowed = clerk_auth.allowed_admin_emails("admin@monomind.com")
check("the owner is on the allowlist", "vdepagadala@gmail.com" in allowed)
stranger = clerk_auth.verify_clerk_token(mint(email="stranger@gmail.com"))
check("a stranger's token still verifies (auth) ...", stranger is not None)
check("... but the stranger is not on the allowlist (authz)",
      "stranger@gmail.com" not in allowed)

print("\n[6] Disabled by default")
os.environ.pop("CLERK_JWKS_URL"); os.environ.pop("CLERK_ISSUER")
check("verifier is off when unconfigured", clerk_auth.clerk_enabled() is False)
check("an off verifier accepts nothing", clerk_auth.verify_clerk_token(mint()) is None)

srv.shutdown()
print()
if failures:
    print(f"{len(failures)} FAILED: {', '.join(failures)}"); sys.exit(1)
print("All Clerk verifier tests passed.")
