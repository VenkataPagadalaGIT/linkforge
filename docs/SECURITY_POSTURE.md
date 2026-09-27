# Security posture: venkatapagadala.com + Agentic CMS

Written 2026-08-19, before the production cutover. Records what is enforced,
what was found and fixed, what is triaged-and-accepted, and the owner
actions that gate the cutover.

## The two things that actually protect the site

1. **The admin credential is the crown jewel, not the agent tokens.** An
   agent, even with a stolen token, can at worst fill the review queue with
   drafts a human rejects. It cannot publish (no route exists), cannot
   change globals, cannot touch locked pages, and every call is logged. The
   real target is admin access, so that is where the hardening concentrated.
2. **Authorization is server-side and ours.** Clerk authenticates; the
   backend then checks the email against an allowlist. "Signed in with
   Clerk" is not "is an admin." This is why the Clerk org/billing bypass
   advisory does not apply to us: we do not delegate authorization to Clerk.

## Enforced today

Updated 2026-09-27. The first agentic CMS and its agent surface (tokens,
drafts, review queue) were removed on 2026-09-26: they held no data. There
is no agent write path on the site.

**Admin auth**
- **Today, live:** the legacy email + password form. It is throttled: after
  8 failures per IP and per account there is a cooldown, and the correct
  password is also refused during the cooldown so an attacker cannot time
  the window. Failed logins are logged. Clerk is built but NOT switched on
  in production yet.
- **Planned cutover** (docs/CLERK_SETUP.md): "Sign in with Google" through
  Clerk, invite-only, with a backend email allowlist. Google's 2-step
  verification is the second factor.
  - With Clerk on in any Railway environment, the password login returns
    403 and old password sessions are refused, unless
    ALLOW_PASSWORD_LOGIN=true is set.
- **Boot guard:** the backend refuses to start in production with a
  default JWT secret, a default admin password, or wildcard CORS.
- **Clerk tokens are verified locally** against the JWKS (RS256), and
  refused when:
  - the alg is confused, or alg=none;
  - the issuer is wrong, or the token is expired or forged;
  - the authorized party is wrong or missing. In production an unset
    CLERK_AUTHORIZED_PARTIES fails closed.
- **A Clerk outage** answers 503 "try again", never a 500 or a hang.
  Fetches are bounded by a 5 s timeout, done one at a time, and
  rate-limited.
- **Refused and unavailable sign-ins** show a sign-out screen or a retry
  screen, never a redirect loop.
- **Tests:** 40 verifier cases, 25 end-to-end login cases, and 7
  decision tests.

**Transport / headers**
- Site and API both send X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, HSTS (prod), and the site adds a restrictive
  Permissions-Policy.

## Found and fixed in this review

| Finding | Severity | Fix |
| --- | --- | --- |
| `/_next/image` was an open proxy (`hostname: "**"`) while nothing used next/image | High | Optimizer disabled entirely |
| Agent scope refusals were not logged | Medium | Logged on draft and revision routes |
| Publish gate bypass via writable `status` | High | Fixed earlier (status restricted to draft/in_review) |
| Agent URLs could carry `javascript:` to the reviewer | High | Fixed earlier (URL-scheme allowlist) |
| No rate limit, signing, rotation, or tenancy on agents | Medium | All added this review |
| No security headers | Medium | Added both layers |
| Stale "110 AI concepts" and unverified learnMore links | Low | Fixed; verifier extended |

## Triaged and accepted, with reasons

- **npm: 4 prod-dep highs need major upgrades.** Clerk org/billing/
  reverification bypass does not apply (we use none of those; authorization
  is our allowlist). Next image DoS is moot (optimizer off); Next RSC DoS
  is real but DoS-only. Correction 2026-09-27: Cloudflare is NOT in front.
  It is the DNS host only (records are DNS-only, traffic goes straight to
  Railway), so it mitigates nothing today. Full fix is Next 15. postcss is a build-time tool, not a runtime exposure. **Planned:
  a gated Clerk v7 + Next 15 upgrade after cutover, with all suites as the
  gate. Not forced now, because a double-major upgrade untested before a
  cutover is the reckless option.**
- **Login throttle and agent rate limit are in-process.** Correct for a
  single instance. A multi-instance deploy moves both to Mongo or a shared
  cache. Documented at both call sites.
- **No full Content-Security-Policy yet.** The 3D scenes and inline Next
  runtime need a worked allowlist; a hasty CSP that breaks the flagship
  guides is worse than none. Baseline headers are in; CSP is its own task.
- **Local Mongo is unauthenticated.** Localhost only; prod Mongo is
  separate and credentialed.

## Owner actions that gate the cutover

1. Set real `JWT_SECRET`, `ADMIN_PASSWORD`, `CORS_ORIGINS` on Railway. The
   boot guard refuses to start without them.
2. Rotate any secret that has ever been in a public repo or a chat.
3. Clerk production instance with Google sign-in: invite-only, email claim,
   authorized parties, allowlist. The step-by-step cutover checklist is in
   docs/CLERK_SETUP.md. (The agent token system was removed with the first
   agentic CMS on 2026-09-26; there is no agent token to reissue.)
4. Confirm the Omniscite plaintext secret files stay gitignored (verified
   today: untracked, ignored, never in history).

## Test evidence

Current (2026-09-27), in backend/tests/, run against a throwaway local
MongoDB (see conftest.py): test_clerk_auth.py (40 verifier attacks and
hardening cases, no database needed), test_admin_auth.py (25 end-to-end
login cases), test_content_feed.py (8), plus tests/frontend/admin-auth-outcome.test.mjs (7). 80 in all, green. Control-tested:
with the 2026-09-27 backend fixes removed, 33 cases fail (25 on changed
behavior, 8 on functions that did not exist) and the other 40 pass, so a passing suite is evidence rather than decoration. The
verifier cases and the frontend decision tests also run in the preflight.

The earlier suites (agent-draft-demo, cms-gate-tests, cms-security-tests,
multi-agent-test, cms-hardening-tests) were removed on 2026-09-26 with the
first agentic CMS they tested. clerk-verify-tests (17) was ported into
test_clerk_auth.py.
