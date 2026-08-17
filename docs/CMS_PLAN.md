# CMS + Agent Publishing: the plan

Written 2026-08-17, after the owner named the real pain: **every content
change costs a full deploy.** This document is the thinking, the sequence,
and the decisions that are already made. It is not a wish list.

---

## 1. The problem, stated precisely

Content on this site currently lives in three different places:

| Where | Examples | Cost of a change |
|---|---|---|
| TypeScript data files | guides, AI updates, encyclopedia (176), roadmap, contributors | Full deploy: build, gates, `railway up`, verify. Ten minutes and a risk window. |
| Existing CMS (Postgres via backend) | blog posts, pillars | Instant. No deploy. |
| Static public files | llms.txt, OKF docs, markdown twins | Deploy, and they must be regenerated in lockstep with the data. |

So the site has two content systems and only one of them is fast. Everything
the owner publishes most (news, concepts, guides) sits in the slow one.

**But the slow one is not stupid.** Code-as-content bought real things:
type safety, git history, review, and above all the **gate suite**:

- `scripts/okf_attest.py` (published counts must match the data)
- `scripts/check-brand.py` (contrast and accent pairs)
- `scripts/check-links.py` (every named link lands on what it names)
- `scripts/verify-resources.py` (551 curated links must still be alive)
- `scripts/preflight-deploy.sh` (the deploy gate that runs them)

Those gates are the reason this site's facts hold up. **Any CMS that lets
content bypass them is a downgrade, not an upgrade**, and it becomes actively
dangerous the moment agents can publish. The junk-resources incident (an
elite-source sweep that quietly produced a Linear-vs-Latent Discriminant
Analysis mixup, caught only because a checker existed) is the proof.

**Design rule #1: the CMS does not replace the gates. It runs them.**

---

## 2. Target architecture

```
Omniscite research agents ─┐
                           ├─► POST /cms/drafts  (scoped token, DRAFT only)
Owner (admin UI) ──────────┘            │
                                        ▼
                            Postgres: content.* tables
                                        │
                          owner opens the review queue
                          diff + gate results + preview URL
                                        │
                                  APPROVE (owner only)
                                        ▼
                        gate suite runs SERVER-SIDE, blocking
                    ┌───────────────────┴────────────────────┐
                    ▼                                        ▼
              all gates pass                            any gate fails
              status = published                    stays draft + failure list
                    │
                    ▼
        Next.js ISR revalidates that path (no deploy)
        + regenerates llms.txt / OKF / markdown twins
```

Decisions already made, with reasons:

1. **Postgres, not files.** The house rule is Postgres only (no SQLite, no
   Parquet). The existing CMS backend already speaks to it.
2. **ISR, not rebuild.** `revalidatePath()` on publish. Content updates in
   seconds; code still deploys the normal way. This is what kills the pain.
3. **Agents can never publish.** They can only create drafts. Approval is a
   human action, always, and it is the owner's alone.
4. **Gates run server-side on approve, not in CI.** A gate that only runs at
   deploy time cannot protect a deploy-less publish path.
5. **Provenance is a first-class column, not a convention.** Every draft
   records who or what made it, which sources it fetched, and the verification
   receipts. An agent-authored claim without a live source URL cannot publish.
6. **Migration is incremental.** The TypeScript data files stay authoritative
   until a type is fully migrated and verified. No big-bang cutover.

---

## 3. The content model

### 3.1 Shared spine (every page type has these)

| Field | Notes |
|---|---|
| `slug` | Immutable once published. Slug changes are a hard rule violation on this site. |
| `type` | One of the page types in 3.2. |
| `status` | `draft` / `in_review` / `published` / `archived`. |
| `seoTitle` | Under 60 chars, gate-enforced. |
| `metaDescription` | 140-160 chars, gate-enforced. |
| `canonical` | Defaults to the site URL for the slug; overridable. |
| `headings` | Derived from sections; drives the on-page TOC and the JSON-LD. |
| `sections[]` | Ordered blocks, see 3.3. This is "page contents". |
| `internalLinks[]` | Explicit, typed, and checked. See 3.4. |
| `diagrams[]` | Figures: image, SVG, mermaid source, or a named 3D scene id. |
| `discussion` | Optional commentary block. On updates this renders as **My View** (opinion, labelled). |
| `provenance` | Author (human or agent id), sources fetched, gate receipts, timestamps. |
| `publishedAt` / `updatedAt` | Real dates, shown to readers and in JSON-LD. |

### 3.2 The template library (10 page types)

These are not invented; they are what the site already publishes:

1. **AI Update** (news): highlights, takeaways, My View, primary documents, video, body.
2. **Guide / 3D Explainer**: blocks, defined terms, comparison table, FAQs, sources, interactive slot.
3. **Encyclopedia Concept**: definition, key terms, prerequisites, unlocks, resources (videos / guides / courses), interactive slot, deep dive.
4. **Insight / Essay**: long-form prose with pull quotes and figures.
5. **Notebook Entry**: conference or business field notes; sessions, speakers, dates.
6. **Roadmap Topic**: week, prerequisites, curated free resources, outcomes.
7. **Contributor Profile**: bio, photo with credit, links, related news.
8. **Publication / Paper**: SSRN-style record (abstract, citation, DOI, JEL).
9. **Hub / Landing**: an index page assembled from queries over other types.
10. **Lecture / Course**: ordered lessons, video, transcript, captions, exercises.

Each type = shared spine + a small typed extension. New types are additive.

### 3.3 Section blocks

Reuse the block union that already exists in `src/data/guides.ts` rather than
inventing a second vocabulary: `p`, `h2`, `h3`, `list`, `callout`, `code`,
`image`, `figure`, `comparison`, `termcard`, `faq`, `related`, `sources`,
`details`, plus the interactive slots. The CMS editor renders one form per
block kind. **The renderer stays the same**, which means the CMS cannot
invent layouts the site does not have (the classification-Excel lesson:
downloads must match the house format, never a new one).

### 3.4 Internal links, done properly

Internal links are a typed table, not free text in prose:

```
internal_link(from_slug, to_slug, anchor_text, relation, position)
```

Why it earns its own table:

- The **link checker already enforces** that a named link lands on what it
  names. With a table, that check runs on every publish instead of per deploy.
- Orphan detection becomes a query: pages with zero inbound links.
- The `NEWS_FOR` / `INTERACTIVE_FOR` / `DEEP_DIVES` maps that exist today in
  `learnReference.ts` are exactly this table, hand-written. They migrate into it.
- Agents proposing links can be constrained: **the target must exist and the
  anchor text must match the target's title or a declared synonym.** That is
  precisely the rule that caught "All explainers" pointing at a page branded
  "Teardowns".

---

## 4. Agent integration (Omniscite)

**The contract:** an agent is a research assistant with a typewriter, never a
publisher.

```
POST /cms/drafts            create draft (scoped token, rate-limited)
POST /cms/drafts/:id/facts  attach a fact with its source URL + fetched-at
GET  /cms/drafts/:id/gates  run the gate suite, get pass/fail + reasons
```

Every draft an agent creates must carry, per claim:

- the **source URL**, fetched and stored with an HTTP status and timestamp
- the **quoted passage** the claim rests on
- a **confidence** and an explicit `unverified` list (the deep-research
  harness already produces exactly this shape)

The review queue then shows the owner: rendered preview, a diff against the
live version, gate results, and every claim next to its source. Approve
publishes; reject returns it with notes. **Nothing reaches readers without
that click.**

Anti-junk rules, learned the hard way this month:

- A resource link that does not return 200 with an on-topic title is dropped,
  not published (`verify-resources.py` becomes a publish gate).
- Counts stated in copy must be derived from data, never typed
  (`okf_attest.py` becomes a publish gate).
- Company logos and any third-party asset need a recorded source and a usage
  note, as `DealLogos` already does.

---

## 4b. The discovery checklist (queued: Agent X must run this)

Added 2026-08-17 after Search Console reported "URL is unknown to Google,
no referring sitemaps detected" for a page that had been live for two days.
The sitemap was correct; the lesson is that **publishing and being findable
are different events, and nobody was checking the second one.**

`scripts/check-discovery.py` is that check, and it belongs in the CMS as a
blocking publish gate. For every URL it answers:

| Check | Why it exists |
|---|---|
| Returns 200 | A published row means nothing if the route 404s. |
| In `sitemap.xml` | The single biggest discovery signal, and the thing GSC complains about. |
| Has a `lastmod` | Google reprioritizes on freshness; a missing or stale date wastes the publish. |
| `robots.txt` allows it, and declares the sitemap | One bad Disallow silently deletes a page from search. |
| Self-canonical | A canonical pointing elsewhere hands the page's value away. |
| No `noindex` | The most common accidental un-publish. |
| Listed in `llms.txt`, or covered by a documented hub pattern | The AI answer-engine surface. Enumerating 176 concept URLs would bloat the file, so a hub plus an explicit `/<concept-id>` pattern counts; nothing else does. |
| At least one inbound link in **server-rendered** HTML | A link that only exists inside a JavaScript menu is invisible to crawlers that do not execute JS, which is exactly how this site's nav is built. |

It caught two real gaps the moment it was written: the Stripe/OpenRouter
story and the 176 encyclopedia concept pages were in the sitemap but absent
from `llms.txt`. Both fixed the same day.

**Rules this hard-codes for agents:**

1. An agent's draft cannot be approved until the discovery gate would pass
   for its slug (sitemap entry planned, hub link planned, llms coverage).
2. Publishing must also **regenerate** `sitemap.xml`, `llms.txt`,
   `llms-full.txt`, the OKF docs and the markdown twin, then re-run the gate
   against the live URL. Regeneration is part of publish, not a chore
   someone remembers.
3. Every publish ends with an IndexNow submission of the new and changed
   URLs, and the receipt is stored on the content version.
4. The gate runs again 48 hours later as a scheduled sweep, because
   discovery can regress silently when a hub page is redesigned.

**Owner-only step the gate cannot do:** submitting or resubmitting
`sitemap.xml` inside Google Search Console. Google will find it via
robots.txt eventually, but explicit submission is what produces the
"referring sitemap" attribution that report was missing. That belongs on
the launch checklist as a human action.

---

## 5. Sequencing (what to build, in order)

**Phase 0 · Make the gates callable (small, high leverage).**
Wrap the five scripts behind one entry point that takes content and returns
structured pass/fail JSON. Nothing else works safely without this. The scripts
already exist; this is packaging, not invention.

**Phase 1 · One type, end to end: AI Updates.**
Highest publishing velocity, most deploy pain, smallest schema. Migrate the
model to Postgres, render via ISR, publish from the existing admin UI. Success
test: publish a news story with a My View, documents and a video **without a
deploy**, and see it live in under a minute.

**Phase 2 · Agent drafts + approval queue.**
Token issuing, the three endpoints, the review UI with diff and gate results.
Success test: an Omniscite agent researches a story, files a draft with
sources, and the owner publishes it in two clicks.

**Phase 3 · The remaining high-volume types.**
Encyclopedia concepts (176, plus the resource injection maps), then guides.
Roadmap, contributors, publications last: they change rarely, so they get the
least benefit and can stay in code longer than anything else.

**Phase 4 · Template library and the authoring polish.**
Type-specific starter templates, bulk operations, scheduled publishing,
redirects table, and an internal-link suggester that proposes targets and
makes the owner accept them.

---

## 6. What could go wrong (and the mitigation)

| Risk | Mitigation |
|---|---|
| Content in the DB drifts from what the gates assume | Gates run on the DB content at publish, not on files. |
| Prod and local databases diverge (this has bitten before) | One canonical Postgres for content; local reads it read-only, or a verified snapshot. |
| An agent floods the queue | Scoped tokens, rate limits, one open draft per slug. |
| A publish breaks a live page | ISR revalidates a single path; keep the previous version and offer one-click revert. |
| The CMS becomes a second source of truth for the same page | A type is either code or CMS, never both. Migration flips it exactly once. |
| Losing the audit trail git gave us | `content_versions` table: every publish is an immutable row with author and diff. |

---

## 7. What this does NOT change

- Slugs stay frozen. The CMS must refuse to change a published slug without an
  explicit redirect.
- The brand and accessibility rules still apply, enforced by the same gate.
- No em dashes in copy, ever.
- Deploys still exist. They are for **code**. That is the point: separate the
  two, so publishing a paragraph never risks the neural-network explainer.
