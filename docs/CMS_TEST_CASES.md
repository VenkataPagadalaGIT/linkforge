# Agentic CMS: use cases and test cases

Written alongside the Phase 1 build, 2026-08-17. Every case below is
executable: four suites, 100+ assertions, all green against a live backend.

Local setup:

```bash
# backend  http://localhost:8090   (launch config "backend")
# CMS UI   http://localhost:3402   (launch config "cms-review")
# sign in  admin@monomind.com / LocalReview2026!
python3 scripts/agent-draft-demo.py   # the agent contract, 8 steps
python3 scripts/cms-gate-tests.py     # the owner-side gates, 18 checks
python3 scripts/cms-security-tests.py # 44 attacks, all refused
python3 scripts/cms-ui-journey.py     # every screen driven, both themes
```

All four suites are idempotent. Each sweeps its own leftovers before it
starts and retires everything it made on the way out: pages get archived,
agent tokens get revoked. That matters because the first versions did not,
and their litter made the next run report bugs that were not there, twice.

---

## Part 1: how the CMS is used today (before)

| # | Job to be done | Today | Cost |
|---|---|---|---|
| B1 | Publish a news story | Edit `src/data/aiUpdates.ts`, build, preflight, `railway up`, verify live | ~10 min, a deploy, and a risk window over the whole site |
| B2 | Fix a typo in a guide | Same as B1 | Same |
| B3 | Change the site's default meta description | Not possible in one place. Metadata is written per page type in code | Multi-file edit plus a deploy |
| B4 | Add a new content type | Write a data module, a renderer, a route, sitemap wiring, llms wiring | A day of engineering |
| B5 | Let an agent contribute | Not possible. No API, no drafts, no review | Blocked |
| B6 | See what is unpublished | Not visible. Drafts live in git branches or nowhere | Blocked |
| B7 | Check a page's SEO before it ships | Read the code and reason about it | Error prone |
| B8 | Edit a blog post | Works in the legacy CMS, instantly, no deploy | Fine, but covers 1 of 10 content types |

The honest summary of the old CMS: **1 content type, 4 fields of SEO, no
globals, no page types, no drafts from anyone but you, no gates.**

---

## Part 2: how the Agentic CMS is used (after)

### UC1: Owner publishes a news story without a deploy
1. Pages, choose type "AI Update", enter a title, Create draft.
2. Fill blocks and per-page SEO. Anything left blank inherits from the type,
   then from globals.
3. Save, then Approve in the review queue.
4. Gates run server side; on pass, the page publishes.

**Acceptance:** no deploy occurred, and the resolved SEO shown before
approving is exactly what ships.

### UC2: Owner changes the whole site's defaults at once
1. Global SEO, edit the title template or the default description, Save.
2. Every page that had no page-level override now uses the new value.

**Acceptance:** one edit, no deploy, no page touched individually.

### UC3: Omniscite agent drafts a story, owner approves it
1. Agents, issue a token scoped to `ai-update`. Copy it once.
2. The agent calls `GET /cms/agent/schema` and reads its contract and rules.
3. The agent calls `POST /cms/agent/drafts` with blocks, SEO and sources.
4. The agent calls `POST /cms/agent/drafts/{id}/gates`, sees failures, fixes them.
5. The agent calls `POST /cms/agent/drafts/{id}/submit`. Status becomes `in_review`.
6. The owner opens the review queue, reads the content, the sources with fetch
   receipts, the resolved SEO and every gate, then approves or sends it back.

**Acceptance:** the agent never publishes. Proven in step 6 of the demo
script, where an agent token calling approve is refused.

### UC4: A bad draft is stopped
An agent writes an SEO title that resolves to 63 characters.

**Acceptance:** the gate fails, the queue shows "1 gate issue", and approval
returns HTTP 422 listing the failing gate. This is not hypothetical: it is
what the demo script produces today.

### UC5: Slug safety after publication
Owner tries to change a published page's slug.

**Acceptance:** the API refuses with "slug is frozen after publish; add a
redirect instead."

### UC6: Discarding work nobody wants
A draft is wrong in a way that revision will not fix.

**Acceptance:** Archive removes it from the queue and every list, the row
survives for the audit trail, and the same button refuses on a published
page because archiving a live URL without a redirect breaks links.

### UC7: Revoking an agent
Owner clicks Revoke on a token.

**Acceptance:** subsequent agent calls return 401. Drafts already filed stay
in the queue for a human decision.

---

## Part 3: test cases

### 3.1 Automated (run `scripts/agent-draft-demo.py`)

| ID | Test | Expected | Status |
|---|---|---|---|
| T1 | Issue a scoped agent token | 200, token returned once, hash stored | passing |
| T2 | Agent reads schema | allowed types plus the 6 rules | passing |
| T3 | Agent creates a draft | status `draft`, author `agent` | passing |
| T4 | Agent runs gates | per-check pass or fail with detail | passing |
| T5 | Agent attaches a source | source recorded with URL and fetch time | passing |
| T6 | Agent submits | status `in_review`, no publish | passing |
| T7 | **Agent attempts approve** | **401 or 403** | passing |
| T8 | Owner approves a failing draft | 422 with the failing gate named | passing |

### 3.2 Owner-side gates (run `scripts/cms-gate-tests.py`)

| ID | Test | Expected | Status |
|---|---|---|---|
| G1 | A clean draft is approved | 200, status becomes `published` | passing |
| G2 | A second page claims a published slug | 422 naming "slug is unique among published pages" | passing |
| G3 | SEO title resolves to 61+ chars | 422 naming "SEO title under 60 chars" | passing |
| G4 | Meta description outside 140-160 | 422 naming "meta description 140-160 chars" | passing |
| G5 | Em dash in the body copy | 422 naming "no em dashes in copy" | passing |
| G6 | Partial save (title only) | blocks, SEO and agent sources all survive | passing |
| G7 | Archive a published page | 409, unpublish first | passing |
| G8 | Archive a draft | 200, status `archived` | passing |
| G9 | An archived page | absent from the pages list and the review queue | passing |

Three real defects were found by writing these, and all three are fixed:

- **Slug collision.** Two drafts could both publish to the same URL. The
  gate now runs at approve time, where it can see the database.
- **Partial save wiped data.** `PUT /cms/pages/{id}` took a full document,
  so saving one tab reset `blocks` to empty and erased an agent's sources.
  It is now a patch that writes only the keys the caller sent.
- **No way to discard.** Reject only sent a draft back to draft, so junk
  accumulated forever. Archive is a soft delete that keeps the audit trail
  and refuses to touch a published page.

Gates still enforced but not yet covered by an automated case: agent draft
with zero sources, missing required blocks for a type, and a slug with
spaces or capitals. Those fire in the gate function and appear in the
review-queue list; they simply have no dedicated test yet.

### 3.3 Security (run `scripts/cms-security-tests.py`)

Threat model. Two principals: the **owner**, who holds an admin session and
is trusted to publish, and an **agent**, which holds a scoped token and
writes content the owner then reads in a browser. An agent is semi-trusted,
which means its output is untrusted input. One property must hold whatever
either of them sends: nothing reaches `published` without passing the gates.

| Group | What is tested | Cases |
|---|---|---|
| A | No session, no access, on every route | 5 |
| B | An agent token is not an admin session | 5 |
| C | The publish gate cannot be walked around | 3 |
| D | Agent URLs cannot carry script to the reviewer | 6 |
| E | Agent scope is enforced per page type | 1 |
| F | One agent cannot touch another agent's draft | 3 |
| G | Revoked, forged and missing tokens are refused | 3 |
| H | Token issuance validates its own scope input | 3 |
| I | Search input cannot break or hang the query | 5 |
| J | Globals cannot be set to something that breaks the site | 4 |
| K | A published URL cannot be moved out from under its links | 3 |
| L | An unknown page type cannot be smuggled in | 2 |
| M | Missing objects 404 rather than silently succeeding | 4 |
| N | The draft cap protects the review queue | 1 |

**Five real vulnerabilities were found and fixed.**

1. **Publish without gates (high).** `status` was directly writable, so
   `POST /cms/pages {"status": "published"}` put a page live having run
   zero gates, and `PUT` could promote any draft the same way. The claim
   that approval was the only path to published was simply false. Status is
   now restricted to `draft` and `in_review` on both routes; publishing and
   archiving are reachable only through their own routes, where the rules
   live.

2. **Script delivered to the reviewer (high).** Source URLs are written by
   an agent and rendered as `href` on the owner's review screen. React
   escapes text but not hrefs, so `javascript:alert(...)` would have run on
   click, in the one session that can publish. URLs are now restricted to
   http, https and site-relative at the API, on sources, block URLs,
   canonicals and OG images, with a second check in the UI for rows written
   before the rule existed.

3. **Published URLs could be moved (medium).** Only the slug was frozen
   after publish. The URL is route plus slug, and the route comes from the
   page type, so switching the type moved the page and broke every inbound
   link just as thoroughly. Both are frozen now.

4. **Search could crash or hang the API (medium).** The `q` parameter went
   into a Mongo `$regex` unescaped. A search for `a(` was a 500, and a
   crafted pattern is a CPU bomb. It is escaped now.

5. **Globals could deindex the site (medium).** The globals route accepted
   an arbitrary dict and wrote it straight to Mongo. `robotsPolicy` is
   inherited by every page that does not override it, so one typo could
   have taken the site out of the index. Globals are a validated model now,
   with an enum for robots and an absolute-URL rule for `siteUrl`.

Hardening added at the same time: agent tokens expire (90 days by default)
instead of living forever, and each token has an open-draft cap (25 by
default) so a runaway loop or a stolen token cannot flood the one thing
that does not scale, which is the owner's attention.

**Each of these was control-tested.** The guard was removed, the suite was
re-run, and the corresponding cases failed: create-with-published returned
200 and the page went live, the `javascript:` sources were accepted, and
the regex probes returned 500. A test that has never been seen to fail is
not evidence.

**Not covered, and worth knowing.** The admin token lives in
`localStorage`, so any XSS on an admin page can exfiltrate it; the URL
rules above are what keep agent content from becoming that XSS. There is
no rate limit on admin login. Nothing here has been tested against a real
adversary, only against the attacks listed.

### 3.4 Accessibility cases (both themes)

| ID | Test | Expected |
|---|---|---|
| A1 | Load every CMS screen in light and in dark | Readable in both; colours come from tokens only |
| A2 | Tab from the top of any screen | First stop is "Skip to content" and it works |
| A3 | Tab through a form | Every control reachable, focus ring always visible |
| A4 | Every input | Has a real `<label for>`; hints linked with `aria-describedby` |
| A5 | Save an item | The result is announced through the `role="status"` live region |
| A6 | Headings | Exactly one `h1` per screen, no skipped levels |
| A7 | Nav | `aria-current="page"` on the active item |
| A8 | Tables | `<caption>` and `<th scope>` present |
| A9 | Expandable detail | `aria-expanded` and `aria-controls` on the trigger |
| A10 | Contrast | `scripts/check-brand.py` passes: no pale accent without a dark pair, no text below the /70 floor |
| A11 | Status colours | Never colour alone: every state also carries a word ("gates pass", "revoked") |

### 3.5 Cascade cases

| ID | Setup | Expected resolved value |
|---|---|---|
| C1 | Page has its own SEO title | page value, `resolvedFrom.seoTitle = page` |
| C2 | Page title empty | type pattern applied, then the global template |
| C3 | Page description empty | global default, `resolvedFrom = globals` |
| C4 | Page canonical empty | built from site URL plus the type's route |
| C5 | Global robots set to noindex | every non-overriding page inherits noindex |

### 3.6 Accessibility results (measured, not asserted)

Run against both themes with a real admin session on 2026-08-17:

- All four screens render with the correct `h1` in dark and in light.
- Zero console errors and zero failed requests in either theme.
- Exactly one `aria-current="page"` per screen. This was broken: `/admin`
  is a prefix of every CMS route, so Dashboard was marked current on every
  screen and a screen reader was told there were two current pages.
- `scripts/check-brand.py` passes, so no accent colour lacks a dark pair
  and no text sits below the contrast floor.

### 3.7 Known gaps (honest list, not yet built)

- Block editor UI: blocks are stored and rendered in review, but the page
  editor form for editing them field by field is not built yet.
- Publishing writes to the CMS database; wiring published rows into the live
  Next.js routes with ISR is Phase 1's remaining half.
- Regeneration of sitemap, llms.txt and markdown twins on publish is
  specified but not implemented.
- Diff view in the review queue shows the draft, not a comparison against a
  previous published version.
- MCP server wrapper around these REST endpoints is not written; the agent
  surface is REST today.
