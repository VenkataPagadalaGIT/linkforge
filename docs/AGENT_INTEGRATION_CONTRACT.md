# What a domain site must expose to be agent-writable

Reference implementation: venkatapagadala.com. Written 2026-08-19 to answer
one question: what does a site need so an Omniscite agent can research,
draft and propose content **without a human logging into that site**?

The answer is three things: datasets the agent can **read**, state the site
must **record**, and controls that make it safe to hand a credential to a
program. Today we have most of the third and almost none of the first.

---

## 0. Where we actually are

The agent surface on venkatapagadala.com is five routes:

| Route | Direction |
|---|---|
| `GET  /cms/agent/schema` | read (contract only) |
| `POST /cms/agent/drafts` | write |
| `POST /cms/agent/drafts/{id}/sources` | write |
| `POST /cms/agent/drafts/{id}/gates` | write |
| `POST /cms/agent/drafts/{id}/submit` | write |

**It is write-only.** An agent cannot list existing pages, read one, see the
internal link graph, or read the brand voice. It writes into a site it
cannot see.

That is not a theoretical problem. Three consequences are already visible:

- **The internal-links gate is unsatisfiable.** Approval checks that
  internal links carry anchor text, but nothing tells an agent which slugs
  exist, so it can only guess or omit them.
- **Duplicates are the default.** The slug-uniqueness gate exists precisely
  because two drafts collided on one URL. An agent that could read the
  inventory would not have written the second one.
- **Brand rules live in a gate, not in a contract.** "No em dashes" is
  enforced at approval and mentioned in the schema, but the fuller house
  style is a markdown file the agent never sees. The agent learns the rules
  by failing.

---

## 1. Datasets the site must let an agent READ

Ordered by how badly the absence hurts.

### 1.1 Content inventory (blocking)
`GET /cms/agent/inventory`

Every page: id, type, slug, canonical URL, title, status, primary keyword,
published date, last updated, word count, and whether it is thin or stale.

Without it an agent cannot answer "does this already exist?" That single
question is the difference between an agent that compounds the site and one
that fills it with near-duplicates competing for the same query.

### 1.2 Read one page (blocking for updates)
`GET /cms/agent/pages/{id}`

Blocks, resolved SEO, provenance. Until this exists an agent can only
*create*. It cannot refresh a stale page, fix a fact, or extend a section,
which is most of the actual work on a mature site.

### 1.3 Internal link graph (blocking for quality)
`GET /cms/agent/links`

Linkable slugs with their titles and topics, existing inbound and outbound
links with anchor text, and the orphan list. This is what turns "add
internal links" from a wish into an instruction, and it is how new content
gets wired into the site instead of landing as another orphan.

### 1.4 Entity and topic map (high value, site-specific)
`GET /cms/agent/entities`

The site's own vocabulary. On venkatapagadala.com that is 176 encyclopedia
concepts and the AI systems map. An agent should attach a new page to
entities that already exist rather than inventing a parallel vocabulary,
which is how a knowledge site stays a graph instead of a pile.

### 1.5 Brand and house style (cheap, high leverage)
`GET /cms/agent/brand`

Machine-readable: tone, banned words and punctuation, required disclosure
language, reading level, person and tense, examples of good and bad. Omniscite
already models this in `agents/brand_profile.py` (tone, exclusions,
guidelines, primary keywords, competitor terms). The site should serve its
own version so the same agent behaves differently per client without a code
change.

### 1.6 Page templates, not page types (blocking for quality)
`GET /cms/agent/templates/{type}`

This is the biggest single gap and it hides behind a name. We have page
*types*. We do not have page *templates*. Here is everything the contract
currently tells an agent about a guide:

```json
{ "label": "Guide / 3D Explainer",
  "route": "/guides/{slug}",
  "schemaType": "TechArticle",
  "requiredBlocks": ["p", "sources"],
  "extraFields": [ {"name": "kicker"}, {"name": "deck"}, {"name": "faqs"}, ... ] }
```

An agent reading that will write one paragraph, attach a sources block, and
**pass every gate**. Meanwhile a real guide on this site is a 3,000-word
structured explainer with a kicker, a deck, term cards, an interactive 3D
scene, FAQs, ordered sections and a sources list. The type describes the
field names. It says nothing about the shape of a good page.

A template must carry, per type:

- **Section plan.** Ordered sections: heading level, purpose in one line,
  target word range, required or optional. This is the outline the agent
  fills, so it stops inventing a structure per page.
- **Block whitelist per section.** Which block kinds are legal where. A
  `termcard` belongs in the vocabulary section, not the intro.
- **Quantitative targets.** Total words, heading count range, minimum
  internal links, minimum sources, FAQ count, reading level.
- **An exemplar.** A pointer to a real published page of this type that is
  considered the standard, fetched in full. "Write like this" beats any
  amount of prose instruction, and it keeps improving as the site does.
- **Anti-patterns.** What this type must never do, with a bad example.
- **SEO shape.** Title pattern, description pattern, schema type, what the
  H1 must contain, and how the slug is formed.
- **Required assets.** A guide needs an interactive scene id or a poster; a
  contributor page needs a photo credit. State it, do not let it fail late.
- **Acceptance criteria stated up front.** The same gates that run at
  approval, published in the template, so the agent knows the bar before it
  writes rather than discovering it by failing.

The test of a template is simple: an agent that has read it, and nothing
else, should produce a page a human would approve on the first pass.

### 1.7 Coverage and gaps (the reason to bother)
This one is Omniscite's data, not the site's, but the **join key is the
site's responsibility**: every page must expose a stable canonical URL and
its page-to-keyword mapping. Omniscite holds `client_keywords`,
`client_rankings`, `rank_history`, `crawl_audit`, `chatgpt_mentions` and the
context graph. None of it is usable for targeting unless it can be joined to
a specific page on the site.

---

## 2. The workflow: approve the plan before the prose

Today an agent goes straight to `POST /agent/drafts`. That is the wrong
first move. Research comes first, and the cheapest approval is the one that
happens before any words are written.

The flow should be five stages with **two approvals**:

**Stage 0, orient.** The agent reads `/agent/schema`, `/agent/inventory`,
`/agent/templates/{type}`, `/agent/brand` and `/agent/entities`. It now
knows what page types exist, what a good one looks like, what the site
already covers, and how the site sounds.

**Stage 1, research and propose a brief.** `POST /agent/briefs`

The agent does the keyword work in Omniscite and comes back with a plan,
not a page:

- proposed page type, and why that type
- primary keyword with volume, difficulty and intent
- supporting keywords
- SERP evidence: who ranks now and what shape those pages take
- which existing pages on the site this complements, and which it risks
  cannibalizing, cited by URL from the inventory
- the outline, mapped to the template's section plan
- the internal links it intends to add, by slug, in both directions
- the sources it intends to use

Status: `proposed`.

**Stage 2, human approves the brief.** This is the valuable approval.
Rejecting an outline costs a click. Rejecting 3,000 words costs the agent's
tokens, your reading time, and the temptation to accept something mediocre
because it already exists. Approving the brief pins the keyword, the type
and the outline, and those become part of the draft's provenance.

**Stage 3, draft to the template.** The agent fills the approved outline,
populates every field the template requires, adds the internal links it
promised, attaches sources with fetch timestamps, and runs
`/agent/drafts/{id}/gates` on itself until clean. Only then does it submit.

**Stage 4, human approves the draft.** As it works today: content, sources,
resolved SEO and every gate on one screen, with a diff against the approved
brief so you can see whether the agent wrote the page it said it would.

The brief is also the audit trail that matters. When a page underperforms
six months later, the question is "what did we think we were targeting?"
and the answer should be a record, not a memory.

---

## 3. State the site must RECORD

### 3.1 Provenance (have it)
Author, agent id and name, model, human oversight level, sources with URL
and fetch timestamp, and the gate results at submission. Already implemented
and already visible in the review queue.

### 3.2 Idempotency key (missing, causes real damage)
`POST /cms/agent/drafts` with `Idempotency-Key: <uuid>`, returning the
original draft on replay.

An agent that times out and retries currently creates a second draft. This
is not hypothetical: repeated demo runs produced six identical drafts in the
Pages list before the suites learned to clean up after themselves.

### 3.3 Task correlation and callback (missing)
An agent works on an assignment. It needs to carry an Omniscite task id onto
the draft, and the site needs to tell Omniscite what happened:

- draft carries `taskId` and `runId`
- site fires a signed webhook on submit, approve, reject and archive
- Omniscite closes the task, or reopens it with the rejection note

Without this the loop is open. Omniscite dispatches work and never learns
whether it shipped, so it cannot learn, retry, or report.

### 3.4 Cost and usage attribution (missing)
Tokens, API calls and dollars per agent, per task, per client. Omniscite has
a credits and cost ledger; the site records nothing. Given a $100 double-bill
has already happened once on this platform, an agent that can spend must be
an agent whose spend is attributable.

### 3.5 Queryable audit log (partial)
`cms_versions` snapshots every page edit, which is a good start, but there
is no queryable "who did what when" across tokens, approvals, rejections and
global changes. For a system where a program writes and a human approves,
the log is the evidence that the human was really in the loop.

---

## 4. Access controls

### 4.1 What is already true
- Tokens are scoped to page types, hashed at rest, shown once
- Tokens expire (90 days) and can be revoked instantly
- Each token has an open-draft cap (25) so it cannot flood the queue
- Agents cannot read or touch another agent's draft
- **There is no publish route an agent can call.** Enforced by absence,
  not by a policy an agent could argue with
- Agent-supplied URLs are restricted to http, https and site-relative, so
  agent content cannot deliver script to the reviewer's browser

### 4.2 What is missing

**Tenancy (blocking for multi-client).** One Omniscite will serve many
client sites. Today venkatapagadala.com's CMS has no concept of "which
client this is". Before the second site is connected, every token, draft and
webhook needs a site identity, and the site needs to reject anything
addressed to a different one. Retrofitting tenancy after the fact is the
expensive version of this.

**Request-rate limits.** The cap is on open drafts, not on request rate.
A loop can still hammer the API without ever creating a 26th draft.

**Field-level scope.** Today scope is "which page types". It should also be
"which fields": an agent that may draft body copy but not touch canonical
URLs or robots directives is a useful thing to be able to express.

**Stronger caller authentication.** A bearer token in an agent's environment
is the entire boundary. Add request signing (HMAC over body plus timestamp,
short replay window) and optionally an egress IP allowlist, so a leaked
token alone is not sufficient.

**Two-key rotation.** Rotation currently means revoke then reissue, with
downtime in between. Two simultaneously valid keys removes the excuse not to
rotate.

**A kill switch.** One action that disables all agent writes site-wide,
without revoking tokens individually and without a deploy.

**Signed webhooks both ways.** Site to Omniscite needs an HMAC signature and
a timestamp, or the callback is an open endpoint that anything can post to.

---

## 5. Edge cases and blast radius

The questions that decide whether this is safe to run unattended, each
answered against what the code does today, not what it is meant to do.

### 5.1 How does an agent know what page types exist?

It asks. `GET /agent/schema` returns every type the token may draft, and
each type now carries a `placement` block:

```json
"concept": {
  "placement": {
    "useWhen":  "One term, defined once, in plain words, with a difficulty level...",
    "neverFor": "Multi-concept tutorials, news, anything with a date. If it needs more than one H2, it is a guide.",
    "examples": ["/notebook/ai/encyclopedia/attention"],
    "decidedBy": "category"
  }
}
```

`useWhen` and `neverFor` are the dropdown you asked for, expressed as a
contract an agent can read and a human can audit. `decidedBy` names the
field that routes the page within the type: `section` on a notebook entry
(ai, business, conference), `category` on an update, `pillar` on an insight,
`week` on a roadmap topic. The schema rules now say, in order: choose the
type from placement and state why; set the decidedBy field; send only
declared fields and listed block kinds.

The brief stage (section 2) is where that choice gets checked. The first
line of a brief is "type: X, because Y", and a human sees it before a word
of body copy exists. An agent that wants to put a product page in the
newsroom has to say so out loud, in advance, in a form that costs one click
to refuse.

### 5.2 What happens when a new page template is introduced?

Today a type is a Python dict, so a new one is a code change and a deploy.
That is the right place for it for now: a type defines a route and a
renderer, and nothing else on the site should be able to add routes.

What does **not** happen automatically is worth stating:

- An existing token does **not** gain the new type. `allowedTypes` is a list
  stored at issue time, and a token issued with no scope gets the list of
  draftable types **as of that moment**, frozen. A new type has to be
  granted on purpose, token by token. Fail closed.
- An agent that read the schema yesterday has a stale contract. Every draft
  is validated against the live registry on receipt, so stale knowledge
  produces a 422, not a malformed page.
- When a type is **removed** or renamed, its existing pages keep their
  stored `type` string, and `run_gates` fails them on "known page type".
  They cannot be approved until someone decides what they are now.

What is missing and should be added before a second client: a
`schemaVersion` on the schema response and on every draft, so a draft
written against v3 of the contract is refused by a v4 server with a clear
message rather than a confusing one.

### 5.3 What is the crawl surface? What can the agent read?

Nothing it should not. The agent surface is `/cms/agent/*` and only that.
Every other route is behind an admin session. The agent token is a
different credential from the admin token, stored as a different kind of
record, checked by a different dependency; there is no path from one to the
other.

The agent has no access to:
- the repository, the build, the deploy, or any git or Railway credential
- the admin API: pages list, globals, review queue, other tokens
- other agents' drafts, even by id
- the public site's rendering code, page templates, or components

Its view of the site **should** come from the read endpoints in section 1
(inventory, links, entities, brand, templates), which are purpose-built
projections. It should not crawl the public site to learn it. Crawling is
slow, lossy, and tells the agent nothing about status, provenance, or what
is in review. The projection is the contract; the public HTML is an
artefact of it.

### 5.4 Can an agent break a page template, a feature, or the site?

The honest baseline first: **CMS content is not rendered on the public site
yet.** The CMS publishes to its own collection and nothing in the Next.js
app reads it. So today an agent cannot break anything a visitor sees,
because nothing it writes reaches a URL. That changes the moment rendering
is wired, which is why the boundary has to be in place before then.

The boundary is that **an agent writes data, never code or templates**, and
the data is validated against a fixed contract before it is stored:

| Layer | What it refuses | Since |
|---|---|---|
| `Block.kind` | any kind not in `BLOCK_KINDS` (16 kinds) | this commit |
| `fields` | any key the type does not declare; any select value outside its options; non-numeric numbers | this commit |
| URLs | any scheme other than http, https, site-relative | previous commit |
| `status` | anything but draft or in_review from a write | previous commit |
| `type` | unknown types; change of type after publish | previous commit |
| hub | agents cannot draft hubs at all, and no token can be scoped to them | this commit |

So an agent can no longer invent a block kind the renderer has never seen,
attach a field the template has no slot for, or create a navigation page
that reshapes the site. Each of those used to be accepted and stored, which
is exactly how "a content mistake" turns into "a site bug" later.

What the renderer must do, when it exists, to keep the promise:

- map each block kind to a component from a fixed table, and render
  nothing for a kind it does not know (defence in depth: the API refuses
  them, and the renderer ignores them anyway)
- never pass agent text through `dangerouslySetInnerHTML`; blocks are
  structured data, not HTML
- render into a **preview route** gated behind admin auth, so the reviewer
  sees the actual page at the actual template before approving, and a
  rendering failure shows up in review rather than in production
- fail one page at a time: a block that throws takes down its own slot
  with an error boundary, not the page, and never the route

And the blast radius of a bad approval is one page, by construction:
agents cannot touch globals, cannot change a type, cannot create hubs,
cannot alter another page, and a published page's slug and type are frozen.
The worst case is one wrong page at one URL, which is exactly the case
`cms_versions` and archive exist to reverse.

### 5.5 How do we know the job was done, and done right?

Three layers, two of which exist:

1. **Gates, before the human.** The agent runs its own gates, sees
   failures, fixes them, and only then submits. The human never sees a
   draft the agent knew was failing. (Exists.)
2. **Review with the evidence on one screen.** Content, sources with fetch
   receipts, resolved SEO with provenance, every gate with a verdict. The
   diff against the approved brief is the missing piece: did it write the
   page it promised? (Mostly exists; brief diff does not.)
3. **Callback to Omniscite.** Submitted, approved, rejected with notes, or
   archived, signed, with the task id. This is what closes the loop so
   Omniscite can retry, learn, and report. (Does not exist.)

Without the third, "was the job done" is a question only a human at the
review screen can answer. With it, Omniscite knows.

### 5.6 What Omniscite needs to send, and what it must never hold

Send: its task id and run id on every draft, a brief before a draft, an
`Idempotency-Key` on creation, and the model name in provenance.

Never hold: an admin session, a git credential, a deploy credential, or a
token scoped wider than the job. One token per agent per site, named for
what it does, with the narrowest type scope that does the work, revoked
when the work ends. The Agents screen is where the owner can see every
live credential and kill any of them in one click.

---

## 6. The generic contract

What makes this repeatable across clients is that the site implements a
small versioned interface, and Omniscite ships one client library. A new
client site then becomes configuration rather than code.

```
GET  /agent/schema             contract, rules, allowed types   HAVE
GET  /agent/templates/{type}   the blueprint for a good page    NEED
GET  /agent/brand              voice, style, banned words       NEED
GET  /agent/inventory          what already exists              NEED
GET  /agent/pages/{id}         read one page                    NEED
GET  /agent/links              linkable slugs + link graph      NEED
GET  /agent/entities           the site's own vocabulary        NEED

POST /agent/briefs             propose a plan, with keywords    NEED
     -> human approves the brief                                NEED
POST /agent/drafts             create (+ Idempotency-Key)       HAVE, no key
POST /agent/drafts/{id}/sources   attach evidence               HAVE
POST /agent/drafts/{id}/gates     self-check before asking      HAVE
POST /agent/drafts/{id}/submit    ask a human                   HAVE
     -> human approves the draft                                HAVE
POST /agent/tasks/{id}/status     report progress               NEED
webhook -> Omniscite           submitted/approved/rejected      NEED
```

Note the shape: **an agent should read seven things and write five, with a
human gate in the middle.** We currently let it read one and write four,
with the gate only at the end. That is backwards for producing content that
fits a site, and it puts the only approval at the most expensive moment.

---

## 7. What to build first

To unblock one real Omniscite agent writing one real page on
venkatapagadala.com, in order:

1. **Templates for all 10 types**, with a section plan, quantitative
   targets and an exemplar. Without this the agent writes a one-paragraph
   "guide" that passes every gate. This is content work more than code, and
   it is the one that decides whether the output is any good.
2. **`GET /agent/inventory`** so it stops duplicating
3. **`GET /agent/links`** so the internal-links gate becomes satisfiable
4. **`POST /agent/briefs` plus brief approval**, so keyword research is
   approved before prose is written
5. **`Idempotency-Key` on draft creation** so retries stop multiplying
6. **`GET /agent/brand`** so house style is a contract, not a failed gate
7. **Site identity on every token and draft** before a second client exists
8. **`schemaVersion` on the schema and on every draft**, so a stale agent
   fails clearly instead of confusingly
9. **An admin-only preview route that renders a draft at its real
   template**, before any CMS content is wired to public URLs
10. **Signed webhook back to Omniscite** to close the loop

Items 2, 3, 5 and 6 are a day of work against the module that already
exists. Item 1 is the long pole and cannot be skipped: every other item
improves how well the agent fits the site, but the template decides whether
what it writes is worth fitting. Item 7 is cheap now and expensive later.
Item 8 is what turns this from a demo into a pipeline.

Deliberately **not** on this list: letting an agent publish. The value of
this system is that a human approves, and every control above assumes it.
