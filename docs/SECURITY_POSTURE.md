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

**Admin auth**
- Clerk (passkeys where the plan allows, Google, email code), invite-only
  sign-up, email allowlist on the backend. Wrong account gets a clean
  "not authorized" screen, not a redirect loop.
- Legacy password login as fallback, throttled: 8 failures per IP and per
  account then a cooldown; the correct password is also refused during
  cooldown so an attacker cannot time the window. Failed logins are logged.
- Boot refuses to start in production with a default JWT secret, default
  admin password, or wildcard CORS.
- Clerk tokens verified locally against the JWKS (RS256); alg-confusion,
  alg=none, wrong issuer, wrong authorized party, expired, and forged
  tokens all refused. 17 attack tests.

**Agent surface**
- No publish route. Scoped tokens, hashed at rest, shown once, expiring,
  revocable, per-agent open-draft cap.
- Rate limit per token, separate from the draft cap.
- Optional HMAC request signing with replay protection.
- Two-key rotation with a grace window (no-downtime credential roll).
- Tenancy: tokens and drafts stamped with the site id; a token minted for
  one site is refused on another.
- Field-level grants; block-kind, field and URL-scheme validation so agent
  content cannot carry script to the reviewer's browser.
- Every action and every refusal logged with actor, target and reason.
- One kill switch pauses all agent writes site-wide with no deploy.

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
  is real but DoS-only and mitigated by Cloudflare in front, full fix is
  Next 15. postcss is a build-time tool, not a runtime exposure. **Planned:
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
3. Clerk production instance: invite-only, email claim, authorized parties,
   allowlist. Reissue the agent token against prod (tokens are per-site).
4. Confirm the Omniscite plaintext secret files stay gitignored (verified
   today: untracked, ignored, never in history).

## Test evidence

Six API suites, all green and idempotent: agent-draft-demo, cms-gate-tests,
cms-security-tests (98 cases), multi-agent-test, clerk-verify-tests (17),
cms-hardening-tests (15). Security guards are control-tested: the guard is
removed, the suite re-run, and the matching cases fail, so a passing suite
is evidence rather than decoration.
