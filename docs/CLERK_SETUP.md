# Admin login with Clerk

Clerk replaces the password login for the venkatapagadala.com admin with
passkeys and MFA, the same identity provider already running on Omniscite.
The code is built and tested; turning it on is four environment variables
and a few dashboard clicks, all owner actions because they involve creating
a Clerk application and its keys.

**Until those variables are set, nothing changes:** the site runs on the
legacy password login (now throttled and lockout-protected), and every test
suite passes with Clerk off. Clerk switches on the moment the keys exist.

## What you do in the Clerk dashboard

1. Create a Clerk application (or reuse the Omniscite one; a separate app is
   cleaner so a compromise of one is not both).
2. Enable the sign-in methods you want: **passkeys** first, plus email code
   as a fallback, and **turn sign-up OFF** so no stranger can self-register.
   Add `vdepagadala@gmail.com` as the only user.
3. Session token: add an `email` claim to the session token template
   (Dashboard, Sessions, Edit) so the backend can read which admin signed
   in. The verifier refuses a token with no email.
4. Copy the **Publishable key**, the **Frontend API / issuer URL**, and the
   **JWKS URL** (`https://<instance>.clerk.accounts.dev/.well-known/jwks.json`).

## Environment variables

Frontend (Railway frontend service):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

Backend (Railway backend service):

```
CLERK_JWKS_URL=https://<instance>.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://<instance>.clerk.accounts.dev
CLERK_AUTHORIZED_PARTIES=https://venkatapagadala.com
ADMIN_ALLOWED_EMAILS=vdepagadala@gmail.com
```

Optional, and recommended once Clerk works: leave `ALLOW_PASSWORD_LOGIN`
unset. In production with Clerk enabled the password endpoint returns 403;
set `ALLOW_PASSWORD_LOGIN=true` only as a temporary break-glass.

## How it works

- **Authentication is Clerk's, authorization stays ours.** Clerk will
  authenticate anyone it is told to. The backend additionally checks the
  verified email against `ADMIN_ALLOWED_EMAILS`; anyone else gets 403 and a
  row on the Agents activity log. A stranger signing up to the Clerk app
  still cannot reach the admin.
- **Tokens are verified locally** against Clerk's JWKS (RS256), cached, no
  network call per request, so a Clerk outage cannot lock you out for the
  life of a cached key.
- **The API client asks Clerk for a fresh short-lived token per request**
  instead of reading a long-lived one from localStorage. This also retires
  the localStorage credential that was the standing XSS-theft caveat.
- **Agents are untouched.** Omniscite's `X-Agent-Token` path is separate
  from admin auth; Clerk sits only on the human login. Nothing in the agent
  contract changes.

## Verified

`scripts/clerk-verify-tests.py` runs 17 attacks against the verifier with a
self-signed JWKS and no Clerk account: forgery, wrong key, unknown key id,
tampering, RS256-to-HS256 algorithm confusion, alg=none, wrong issuer,
expired, wrong authorized party, missing claims, and the authenticated-but-
not-allowlisted case. All refused. The full CMS suite passes with Clerk off,
so the fallback path is unchanged.

## Rollback

Unset `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` on the frontend and the four
backend variables. The next boot is back on the password login. No code
change, no redeploy of a different build.
