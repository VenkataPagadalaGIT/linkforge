# Admin login: Google sign-in through Clerk

**Decision (2026-09-27):** the admin and the conference notebook at venkatapagadala.com move from a single email and password to **"Sign in with Google" through Clerk**, invite-only, with a backend email allowlist. Your Google account's 2-step verification or passkey is the second factor.

The code is ready: `backend/clerk_auth.py`, `backend/server.py`, the admin and notebook screens, and the tests below. Turning it on is the owner checklist below.

**Why this option.** It was verified three ways: the code, Clerk's official docs, and an adversarial review.
- **The verifier is already built** and refuses every forged or tampered token in the test suite.
- **Google sign-in and invite-only are on Clerk's free plan.** Clerk's pricing page lists MFA and passkeys as not included on the free plan, so Google's 2-step verification supplies the second factor at no cost.

**Rejected:**
- **Hand-built Google OAuth:** new security code to own, with no tests.
- **Clerk email and password:** without a paid plan it is just a password.
- **Cloudflare Access in front of `/admin`:** the admin API lives on `mono-mind-backend-production.up.railway.app`, outside the Cloudflare zone, and the site is DNS-only. It would protect nothing that matters.

**"Production" in this guide** means any Railway environment (production, staging, preprod, PR environments), because the code treats all of them as real deployments. Only a laptop is "dev".

## What changed in the code (2026-09-27)

| # | Change | Where |
| --- | --- | --- |
| 1 | **A Clerk outage says "try again", never crashes or hangs.** If Clerk's keys cannot be loaded, the check answers 503 "try again in a minute"; before, it was a 500. Cached keys keep working during an outage. Fetches time out after 5 s, run one at a time, are warmed at boot, and are retried every 5 s while there are no keys and at most once a minute afterwards. Made-up key ids cannot flood Clerk. | `backend/clerk_auth.py` |
| 2 | **Token checks run off the event loop,** so a slow Clerk cannot stall other requests. There is a test for this. | `backend/server.py` `get_current_admin` |
| 3 | **The old password login closes once Clerk is on in production.** The password endpoint returns 403, and old password tokens are refused, even with a stolen `JWT_SECRET`. `ALLOW_PASSWORD_LOGIN=true` (exactly that value) is the break-glass. | `backend/server.py` `password_login_allowed` |
| 4 | **Only our own site can use a token.** When `CLERK_AUTHORIZED_PARTIES` is set, a token from any other origin, or with no origin, is refused. In production with it unset, every Clerk token is refused (fail closed). | `backend/clerk_auth.py` |
| 5 | **Every email claim name works:** `email` (this guide), `primary_email`, and `primaryEmail` (Clerk's own docs example, which used to lock you out). | `clerk_auth.email_from_claims` |
| 6 | **"Is this production?" also recognises Railway's current variables,** `RAILWAY_ENVIRONMENT_NAME` and `RAILWAY_ENVIRONMENT_ID`, not only the legacy `RAILWAY_ENVIRONMENT`. | `clerk_auth.is_production` |
| 7 | **Every admin screen shares one gate** (`AdminGate`). A refused sign-in gets a sign-out screen that says why. A server or Clerk hiccup gets a "Try again" screen. Neither ever loops back to the login page. The posts screens used to show a blank page. | `src/lib/admin-client.ts`, `admin-auth-outcome.ts`, `AdminGate.tsx` |
| 8 | **Refreshing an admin page no longer bounces through the login page.** The check waits for Clerk to load, and signing in returns you to the page you asked for (same-site paths only). | `admin-client.ts` `waitForClerk`, `LoginSwitch.tsx` |
| 9 | **The conference notebook signs in with Google too.** The "Take Notes" pill sends you to Google sign-in and back to the same page. Clerk then loads on conference pages only in your browser, so visitors never download it and the pages stay static. | `TakeNotesPill.tsx`, `OwnerClerkIsland.tsx`, the three conference views |

**Shipping this code changes nothing for you on its own.** With no Clerk variables set, the admin and the notebook keep today's password login; the tests prove it (A11, and the Clerk-off paths). The switch happens only when you do the checklist.

## Owner cutover checklist

**Before you start**
1. **Deploy this code first**, with no Clerk variables yet: the frontend with `railway up`, and "push" for the backend. Check that the admin and the notebook still work with your password.
2. **Turn on 2-step verification or a passkey** on the Google account vdepagadala@gmail.com.

**Clerk and Google (about 30 minutes)**

3. **Clerk dashboard:** create a production instance for `venkatapagadala.com`. Add the DNS records it lists in Cloudflare exactly as shown, and set each one to **DNS only** (grey cloud), not proxied. Wait until Clerk marks them all verified.
4. **Google Cloud console:** create an OAuth client of type "Web application". Use the redirect URI shown on Clerk's Google connection page. On the OAuth consent screen, either set the publishing status to "In production" or add vdepagadala@gmail.com as a test user; otherwise Google blocks the sign-in. Clerk production instances need your own Google credentials; the shared ones are for development only.
5. **Clerk, SSO connections:** enable Google and paste in the client ID and secret.
6. **Clerk, Restrictions:** set sign-up to invite-only, and invite `vdepagadala@gmail.com`.
7. **Clerk, Sessions, Customize session token:** add exactly `{"email": "{{user.primary_email_address}}"}`. It must be the session token itself, not a separate JWT template.
8. **Rehearse before switching anything.** Open the invitation email, accept it, and complete "Continue with Google" on Clerk's sign-in page. Confirm in the Clerk dashboard that your user exists with that Gmail address. If this fails, stop here: nothing on the site has changed yet.
9. **Copy three values from Clerk:**
   - the publishable key (`pk_live_...`);
   - the Frontend API URL (for example `https://clerk.venkatapagadala.com`);
   - the JWKS URL, which is the Frontend API URL plus `/.well-known/jwks.json`.

**Switch over (a few minutes of lockout at most, given step 8 passed)**

10. **Frontend service:** set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`, then rebuild with `railway up`. The key is baked into the build.
11. **As soon as the new frontend is live, backend service:** set these, then deploy.
    ```
    CLERK_JWKS_URL=https://clerk.venkatapagadala.com/.well-known/jwks.json
    CLERK_ISSUER=https://clerk.venkatapagadala.com
    CLERK_AUTHORIZED_PARTIES=https://venkatapagadala.com
    ADMIN_ALLOWED_EMAILS=vdepagadala@gmail.com
    ```
    - Also set a new random `JWT_SECRET`. That retires any old password session outright.
    - Leave `ALLOW_PASSWORD_LOGIN` unset.
12. **Why this order:** the backend deploys faster than the frontend. Doing the frontend first keeps the old login working until the last moment. Setting only one side locks you out:
    - backend first: the password form shows but the password endpoint refuses it;
    - frontend first: Google sign-in shows but the backend cannot check it yet, so you see "The server did not accept this sign-in".

**Check it (Claude does this with you)**

13. **At `/admin/login`:** "Sign in with Google" should take you to the dashboard. Refreshing `/admin/cms/posts` should stay on that page.
14. **On a conference session page:** "Take Notes", then "Sign in with Google", should bring you back to the same page with notes unlocked. Save a test note.
15. **A Google account that is not invited** can't sign up. One that is signed in but not on the allowlist sees "This account cannot access the admin".
16. **The old password endpoint** must now refuse:
    ```bash
    curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"x@example.com","password":"x"}' https://mono-mind-backend-production.up.railway.app/api/auth/login
    ```
    Expect HTTP 403 and "Password login is disabled".
17. **After a week of normal use (admin and notebook),** Claude removes the password login code entirely: `/api/auth/login`, the HS256 session path, and the password seed. Only then does the break-glass go away.

## Staging

A staging or preprod rehearsal counts as production:
- Set `CLERK_AUTHORIZED_PARTIES` to the staging site's own origin.
- Password sign-in there needs `ALLOW_PASSWORD_LOGIN=true`.

## Rollback

**Quick, backend only:** set `ALLOW_PASSWORD_LOGIN=true` on the backend and deploy. Password sessions and the notebook's password path work again, but the admin login page still shows only the Google button until the full rollback.

**Full:**
1. Unset `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, then rebuild the frontend with `railway up`. Unsetting the variable alone does nothing, because it was inlined at build time.
2. Unset the four backend Clerk variables, then deploy.

## How it works

- **Clerk authenticates; authorization stays ours.** The backend checks the verified email against `ADMIN_ALLOWED_EMAILS`. Anyone else gets a 403 and a row in the activity log, so a stranger with a Clerk account still cannot reach the admin.
- **Tokens are verified locally** against Clerk's public keys (RS256), cached for a day, with no network call per request.
- **The admin client asks Clerk for a fresh, short-lived token per request.** No long-lived credential sits in the browser.

## Test cases

Run:
```bash
cd ~/Desktop/mono-mind-stage/backend
MONGO_URL=mongodb://127.0.0.1:27091 .venv/bin/python -m pytest -q tests/test_clerk_auth.py tests/test_admin_auth.py tests/test_content_feed.py
cd .. && node --test "tests/frontend/*.test.mjs"
```
- **Result on 2026-09-27:** 73 backend and 7 frontend tests pass. Without a local MongoDB, the 40 verifier cases still run and the rest skip.
- **Preflight:** the verifier cases and the 7 decision tests also run in `scripts/preflight-deploy.sh`.
- **Control test (rerun 2026-09-27):** with the backend fixes removed, 33 cases fail and the other 40 pass.
  - 25 of the failures are cases marked "yes": they fail because the behavior changed.
  - The other 8 are marked "new (symbol)": they fail only because a function they call did not exist yet.
  - Cases marked "guard" pass on the old code too. They were added after the review so a future change cannot lock the owner out of production sign-in or the notebook.

**`test_clerk_auth.py`: the verifier (no database)**

| ID | Case | New |
| --- | --- | --- |
| V01 | A valid token verifies | |
| V02 | A token signed with the wrong key is refused | |
| V03 | An unknown key id is refused | |
| V04 | A tampered signature is refused | |
| V05 | A garbage or empty string is refused | |
| V06 | RS256-to-HS256 algorithm confusion is refused | |
| V07 | `alg=none` is refused | |
| V08 | The wrong issuer is refused | |
| V09 | An expired token is refused | |
| V10 | The wrong authorized party (a token replayed from another site) is refused | |
| V11 | A token missing `sub` is refused | |
| V12 | A stranger's token verifies, but the stranger is not on the allowlist | |
| V13 | The allowlist ignores case and spaces | |
| V14 | With Clerk off, nothing is accepted | |
| V15 | Clerk down on first use: "try again" (ClerkKeysUnavailable), not a crash | yes |
| V16 | Clerk down later: the cached keys keep working | yes |
| V17 | 25 made-up key ids cause no extra fetches; one refetch per cooldown | yes |
| V18 | A rotated key is not fetched inside the cooldown, then is picked up | yes |
| V19 | A garbage JWKS response: "try again", not a crash | yes |
| V20 | A token with no origin (`azp`) is refused | yes |
| V21 | Production without `CLERK_AUTHORIZED_PARTIES` fails closed, for each of 4 production markers | yes |
| V22 | Locally, a missing `CLERK_AUTHORIZED_PARTIES` still works | new (symbol) |
| V23 | A trailing slash on the origin is ignored | |
| V24 | A missing or non-text key id is refused without a network fetch | yes |
| V25 | Email is read from `email`, `primary_email` or `primaryEmail`; non-text is ignored | new (symbol) |
| V26 | A laptop is not production | new (symbol) |
| V27 | An empty key set from Clerk keeps the cached keys | yes |
| V28 | EC and malformed keys are skipped; the RSA key still works | yes |
| V29 | 8 concurrent requests on a cold cache all verify, with one fetch | yes |
| V30 | After a failed first fetch, the retry comes after 5 s, not 60 | yes |
| V31 | Production with `CLERK_AUTHORIZED_PARTIES` set accepts our own token | guard |
| V32 | A made-up key id with healthy keys is a plain refusal, not "try again" | guard |

**`test_admin_auth.py`: the real login check, end to end**

| ID | Case | New |
| --- | --- | --- |
| A01 | The allowlisted owner gets in under all 3 claim names | yes, for `primaryEmail` |
| A02 | A token with no email is refused, with the fix in the message | |
| A03 | A stranger is refused (403) and logged | |
| A04 | A token from the wrong origin is refused | |
| A05 | Production without `CLERK_AUTHORIZED_PARTIES` refuses Clerk | yes |
| A06 | A Clerk outage is a 503 "try again" in under 3 seconds, not a 500 | yes |
| A07 | Production with Clerk refuses old password tokens | yes |
| A08 | Production with Clerk closes the password endpoint (403) | |
| A09 | The break-glass reopens both the password endpoint and password sessions | |
| A09b | Anything but exactly `true` keeps the break-glass closed, 5 values | yes |
| A10 | Clerk on, on a laptop, keeps password sessions | |
| A11 | Clerk off: the password login works end to end | |
| A12 | No login, an empty bearer, a garbage bearer or Basic auth is refused, 4 cases | |
| A13 | A hanging Clerk does not stall other requests; the sign-in is a bounded 503; the retry is instant | yes |
| A14 | The owner signs in with Clerk in production | guard |
| A15 | The conference notebook saves and reads notes with a Clerk sign-in in production | guard |

**`test_content_feed.py`: 8 cases.** The sitemap feed leaves out drafts; the 5 old CMS addresses return 404; the post editor refuses requests without a login and works with one.

**`tests/frontend/admin-auth-outcome.test.mjs`: 7 cases.** These are the admin screen's decisions:
- 200 is signed in;
- 403 is the not-allowlisted screen;
- 401 after a Clerk token is the refusal screen, not a loop;
- 401 without a token goes to the login page;
- no response, 5xx, 429 or a failed Clerk token is the retry screen;
- the post-sign-in redirect only allows same-site paths;
- the login link round-trips.
