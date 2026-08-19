# 12 — Agentic CMS · Agent Onboarding, Access & Permissions

> How an external agent (Omniscite first) is authenticated to venkatapagadala.com, what it is told, what it may touch, what it may never touch, and how we prove all of that before it does real work. **Written 2026-08-19. Everything below is implemented and tested locally on branch `staging`; nothing is deployed yet.**

Companion documents in the repo: `docs/AGENT_INTEGRATION_CONTRACT.md` (what any site must expose), `docs/CMS_TEST_CASES.md` (all suites), `docs/site-profile.venkatapagadala.json` (the filled profile), `backend/site_profile.py` (the source of truth for the profile), `backend/agentic_cms.py` (the API).

## 1. The model in one paragraph

An agent never logs in. It holds a **token** the owner issued, scoped to page types, that expires in 90 days and can be revoked in one click. With that token it can read the site's **profile** (truth file, voice, topic map, keyword ownership, permissions, locks) and **schema** (page types with placement rules and templates), and it can **draft**, **revise**, self-check against the **gates**, and **submit for review**. It cannot publish. There is no publish route it can call; that is enforced by the route not existing, not by a policy. A human approves every draft, and every approval re-runs the gates on the server.

## 2. Authentication

**Credential.** `X-Agent-Token: omni_...`, issued on the Agents screen (`POST /cms/agent-tokens` as admin), scoped to page types, hashed with SHA-256 at rest, shown once. Expires after 90 days by default. Revoke on the Agents screen or `POST /cms/agent-tokens/{id}/revoke`; effect is immediate.

**What a token is not.** It is not an admin session. A different credential, a different stored record, a different dependency on every route. There is no path from an agent token to the admin API, the review queue, globals, other tokens, or other agents' drafts. All of that is tested.

**Authentication success layer: `GET /cms/agent/whoami`.** The first call an agent makes. A 200 means the credential works; everything after is permission, not authentication. The response is the agent's entire situation:

```json
{
  "authenticated": true,
  "agent":  { "id": "…", "name": "Omniscite research agent", "issuedAt": "…", "expiresAt": "2026-11-17T…" },
  "site":   { "siteId": "venkatapagadala-com", "siteUrl": "https://venkatapagadala.com", "profileVersion": "2026-08-19.1" },
  "scope":  { "types": ["ai-update", "concept"],
              "grants": { "ai-update": { "create": true, "update": true, "refresh": false, "proposeArchive": false,
                                          "seoFields": ["seoTitle", "metaDescription", "primaryKeyword"] },
                          "concept":   { "create": true, "update": true, "refresh": true,  "proposeArchive": true, "seoFields": ["…"] } } },
  "lockedPaths": ["/", "/guides/how-llms-work", "/guides/how-neural-networks-work", "/guides/hvac-system-troubleshooting", "/about", "/publications", "/notebook/ai/map"],
  "quota":  { "openDrafts": 0, "openDraftCap": 25 },
  "agentsPaused": false,
  "canPublish": false,
  "readNext": ["/cms/agent/profile", "/cms/agent/schema"],
  "thenTry":  ["POST /cms/agent/drafts/validate  (dry run, stores nothing)"]
}
```

**Failure modes.** 401 for missing, unknown, revoked or expired tokens, each with a distinct message. 403 when authentication succeeded but the profile, a lock, the type scope, or the pause switch refuses the operation; the message says which one and why. 422 when the payload breaks the template (unknown block kind, undeclared field, select outside its options, unsafe URL scheme). 429 when the agent is at its open-draft cap.

## 3. What an agent is told

| Endpoint | Carries |
| --- | --- |
| `GET /cms/agent/whoami` | identity, grants per type, locks, quota, pause state, what to read next |
| `GET /cms/agent/profile` | the owner's site profile: identity and purpose, truth file and claims policy, voice with exemplars and anti-exemplars, topic map and off-limits, keyword ownership, permissions, locked paths, update rules, editorial rules, operations |
| `GET /cms/agent/schema` | page types it may draft, each with route, schema type, required blocks, declared fields, and a **placement** block (`useWhen`, `neverFor`, `examples`, `decidedBy`); the 16 block kinds; the rules |

The profile answers "what is this site, how does it sound, what may I say, what is already covered." The schema answers "what shapes exist and which one is this." Neither requires crawling the public site, and an agent should not crawl it: the projections are the contract, the HTML is an artefact.

## 4. Permission matrix

Per page type, by **operation** and by **field group**. Three things must all be true for an agent write to be accepted: the token is scoped to the type, the site profile grants the operation on the type, and every field group the write touches is in the grant. A single agent can be narrowed further on the Agents screen; the profile is the ceiling and a token can never be widened past it.

Operations: `create` a new draft; `update` a published page via a revision through the review queue (the original is untouched until a human approves, then superseded); `refresh` a staleness-triggered revision; `propose archive` ask for a page to be retired. **There is no delete.** Hard delete does not exist for anyone; archive is the only path, and an agent can only propose it.

Field groups are the units of on-page permission. Every write is classified into them and refused if any group is outside the grant:

| Group | What it covers |
| --- | --- |
| `body` | Blocks: paragraphs, headings, lists, callouts, figures |
| `title` | The page title (H1) |
| `seoTitle` | <title> tag |
| `metaDescription` | Meta description |
| `primaryKeyword` | Target keyword |
| `canonical` | Canonical URL (owner-only by default) |
| `robots` | Robots directive (owner-only by default) |
| `ogImage` | Social share image |
| `schema` | Structured-data override (owner-only by default) |
| `templateFields` | The type's declared extra fields (category, company, faqs...) |
| `internalLinks` | Links to other pages on this site |
| `sources` | Citations with URL and fetch receipt |

Not on that list, on purpose: code, templates, components, routes, navigation, the slug or type of a published page, and publish. They are not fields, so there is no grant that reaches them. Canonical, robots and schema exist as groups but are owner-only for every type by default.

| Type | create | update | refresh | propose archive | body | title | seoTitle | metaDescription | primaryKeyword | templateFields | internalLinks | sources | canonical | robots | ogImage | schema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ai-update` | yes | yes | no | no | yes | yes | yes | yes | yes | yes | yes | yes | no | no | no | no |
| `guide` | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no |
| `concept` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | no | no | no | no |
| `insight` | yes | no | no | no | yes | yes | yes | yes | no | no | yes | yes | no | no | no | no |
| `notebook` | yes | yes | no | no | yes | yes | yes | yes | no | yes | yes | yes | no | no | no | no |
| `roadmap-topic` | no | yes | yes | no | yes | no | no | no | no | yes | yes | yes | no | no | no | no |
| `contributor` | no | yes | no | no | yes | no | no | no | no | no | no | yes | no | no | no | no |
| `publication` | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no |
| `hub` | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no |
| `lecture` | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no | no |

**Locked paths.** These refuse every agent operation regardless of type grant. Locks are the owner's last word and are checked before permissions.

| Path | Why |
| --- | --- |
| `/` | Home page. Content, titles, schema and the living portrait are owner-only. |
| `/guides/how-llms-work` | Flagship 3D guide; hand-built and expert-reviewed. |
| `/guides/how-neural-networks-work` | Flagship 3D guide with live in-browser training. |
| `/guides/hvac-system-troubleshooting` | Hand-built 3D troubleshooter. |
| `/about` | The owner's own words about the owner. |
| `/publications` | The owner's papers. |
| `/notebook/ai/map` | Ontology with 1,245 reviewed edges; edited by script, not by prose agents. |

**Kill switch.** `POST /cms/profile/pause {"paused": true}` refuses every agent write site-wide, instantly, with no deploy. Tokens stay valid so lifting it is one call. `whoami` reports the state so a well-behaved agent stops before it is refused.

### 4.1 Per-agent narrowing

`PUT /cms/agent-tokens/{id}/permissions` with `{"<type>": {"create": bool, "update": bool, "refresh": bool, "proposeArchive": bool, "fields": [group, ...]}}`. Unknown field groups (including `code`), unknown operations (including `delete`) and types outside the token's scope are refused. The agent's `whoami` reports the effective grant, which is the profile intersected with its own narrowing.

### 4.2 The activity log: who did that

Every call, agent or admin, allowed or refused, writes one row: timestamp, actor (kind, id, name), action, result (`ok` / `refused` / `error`), target (page id, type, slug, path), detail (the reason, for refusals), request id and IP. Actions logged: `auth`, `draft.create`, `draft.submit`, `revision.create`, `page.approve`, `page.reject`, `page.archive`, `token.issue`, `token.revoke`, `token.permissions`, `agents.pause`, `agents.resume`.

- `GET /cms/activity?actorId=&action=&result=&pageId=&q=&limit=` filterable, newest first
- `GET /cms/activity/summary` agents seen in the last hour, actions and refusals in 24h, drafts awaiting review, busiest agents
- Admin-only. An agent cannot read the log, including its own rows.

Refusals are logged deliberately. An agent repeatedly hitting a locked path or an ungranted field is a signal about that agent, and the log is where it shows.

### 4.3 The Agents screen

`/admin/cms/agents` is the operations console. Summary tiles (active now, actions and refusals in 24h, awaiting review, busiest). Three tabs: **Active** (every live token with scope, drafts, in review, published, refused, last seen, expires; expand a row for its effective permission matrix, narrow it there, and jump to its activity), **Activity log** (filter by text, result, actor), **Revoked**. Issuing a token is behind a button and shows the new token's live `whoami`.

## 5. What an agent can never do

- Publish. No route exists for it.
- Approve, reject or archive anything. Admin routes only.
- Read or write globals, the profile, other tokens, other agents' drafts, the review queue, or the pages list.
- Create a hub page. Hubs are navigation; they are not agent-draftable at the type level, cannot be in any token's scope, and are not advertised in the schema.
- Change a published page in place. The only path is a **revision**: a linked draft that goes through the queue; the original is untouched until a human approves, and is then superseded, not duplicated.
- Change the slug or type of a published page. Both are frozen; the URL has one owner.
- Delete anything. There is no delete operation to grant; the strongest action is propose archive, which a human decides.
- Write a field group outside its grant. Canonical, robots and schema are owner-only for every type by default; an individual agent can be narrowed further, never widened.
- Hide. Every call it makes is on the activity log with its name on it, including the ones that were refused.
- Send a block kind, a field, a select value, or a URL scheme the template does not declare. Refused with 422 before anything is stored.
- Touch code, templates, components, the repository, the build, the deploy, or any credential other than its own token.

## 6. Onboarding an Omniscite agent

Four stages. `scripts/onboard-agent.py` runs all four and prints a transcript that is the onboarding record.

1. **Issue.** Owner opens Agents, names the agent for what it does, ticks the narrowest type scope that does the job, issues. Copies the token once and hands it to Omniscite out of band. Never in a repo, never in a chat.
2. **Handshake.** The agent calls `whoami`. If 200, the credential works and it now holds its grants, locks and quota. If 401, stop; nothing else will work.
3. **Orient.** The agent reads `/agent/profile` and `/agent/schema`. It now knows the truth file, the voice, what is already owned by which page, which type to choose and why, and what fields and blocks are legal.
4. **Test operations.** `POST /agent/drafts/validate` (dry run: same checks as a real draft, nothing stored), then a real probe draft, then `/gates` on it, then `/submit`, then an attempt to call `/approve` with the agent token, which **must** return 401. The owner rejects and archives the probe. The agent is now trusted with real work.

Run locally today:

```
python3 scripts/onboard-agent.py --name "Omniscite research agent" --types ai-update concept
```

## 7. The workflow once onboarded

Research, propose a **brief** (type and why, primary keyword with volume and intent, SERP evidence, which existing pages it complements or risks cannibalizing, the outline against the template, the internal links it will add, the sources), owner approves the brief, agent drafts to the template, self-runs gates until clean, submits, owner approves the draft with the diff against the brief. Two approvals; the first is the cheap one. Briefs are not built yet; everything else is.

## 8. What still has to exist before this is "the best in the world"

Honest list, in order:

1. **Read endpoints for the site's own content**: `/agent/inventory` (what exists), `/agent/pages/{id}` (read one), `/agent/links` (what to link to), `/agent/entities` (the site's vocabulary). Today the agent writes into a site it cannot see, which is why the slug-uniqueness gate had to exist.
2. **Templates, not types.** A guide's contract today is `requiredBlocks: ["p", "sources"]`; one paragraph passes. Each type needs a section plan, quantitative targets, an exemplar to write like, anti-patterns, required assets, and the acceptance criteria stated up front.
3. **Briefs** with their own approval.
4. **`Idempotency-Key`** on draft creation, so a retried request does not create a second draft.
5. **Rendering.** CMS content is not wired to public URLs yet. When it is: a fixed kind-to-component table, unknown kinds rendered as nothing, never `dangerouslySetInnerHTML`, an admin-only preview route so the reviewer sees the real page at the real template, error boundary per block.
6. **Robots, sitemap, llms.txt regeneration on publish**, driven by the type's `sitemap` and `inLlmsTxt` settings, so discovery is a consequence of publishing rather than a separate job.
7. **Signed webhook back to Omniscite** on submit, approve, reject, archive, carrying the task id, so the loop closes and Omniscite learns.
8. **Tenancy**: site identity on every token and draft before a second client exists.
9. **`schemaVersion`** on the schema and every draft, so a stale agent fails clearly.
10. Request signing and rate limits, field-level scope, two-key rotation.

## 9. Test evidence

Four suites, all green on 2026-08-19: `agent-draft-demo.py` (8 steps), `cms-gate-tests.py` (18 checks), `cms-security-tests.py` (98 cases across groups A to V: auth, agent-vs-admin, publish bypass, URL schemes, scope, cross-agent isolation, revocation, token issuance, regex search, globals, frozen URLs, unknown types, 404s, draft cap, template boundary, hubs, profile grants, locks and revisions, kill switch, dry run, field-level grants and per-agent narrowing, activity log), `cms-ui-journey.py` (both themes). Every security guard was control-tested: remove the guard, watch the case fail, restore it.
