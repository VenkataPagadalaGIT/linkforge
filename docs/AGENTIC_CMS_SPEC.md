# Agentic CMS: research and specification

Researched and written 2026-08-17, after the owner looked at the existing
admin and correctly said: "I don't see page types, existing content, SEO
tags, global-level updates, or schemas."

This document is the research behind the build. Sources are cited inline so
every design choice can be checked rather than trusted. It supersedes the
architecture sketch in `CMS_PLAN.md`, which stays valid on sequencing.

---

## 0. Findings that change the design

Five things the research turned up that we would otherwise have got wrong.

**1. Our llms.txt is not spec-conformant, and an agent parsing it strictly
finds zero links.** The [llms.txt spec](https://llmstxt.org/) defines file
lists as "a markdown list, containing a required markdown hyperlink
`[name](url)`, then optionally a `:` and notes about the file." Our file uses
`- URL: https://...` lines and H3 headings, neither of which is in the
format. Audit of the live file: 1 H1 (correct, required), 2 blockquote lines
(correct), 10 H2 sections (correct), **16 H3 headings (not in the spec)** and
**0 conformant link items**. It reads beautifully to a human and parses to
nothing. This is exactly the failure the owner suspected, and it is the
strongest argument for generating these files from data instead of editing
them by hand.

**2. Google retired FAQ and HowTo rich results, but AI engines still read
them.** FAQPage and HowTo rich results were discontinued in Google Search
during 2026, while ChatGPT, Perplexity, Claude and AI Overviews continue to
consume that structured data for extraction and citation. Google also
published guidance that **structured data is not required for AI Overviews**.
Practical consequence for us: keep FAQPage and HowTo for answer engines, stop
counting on them for rich snippets, and prioritise the schema types that
still earn results: Organization, Article, BreadcrumbList.

**3. The reference implementation for agent publishing already exists, and
its core rule is a one-liner worth copying.** Sanity's Agent Actions are
"schema-aware APIs for LLM-driven content workflows" where the schema is the
contract and outputs are validated against it, and the governing principle is
that **AI writes to a release, and only a human or an explicit rule publishes
that release**. That is precisely the draft-then-approve model we specified,
independently arrived at, which is reassuring.

**4. Layered SEO configuration is the standard pattern, not a nicety.**
Mature SEO tooling (SEOmatic for Craft is the clearest example) uses
site-wide defaults, then section overrides, then entry overrides, where each
layer falls back to the one above. Our current site has page-level metadata
only, with no global layer at all, which is why every new page type needs
bespoke metadata code.

**5. AI disclosure is becoming a legal requirement, not an ethics choice.**
EU AI Act Article 50 and California SB 942 both require machine-readable
disclosure of AI-generated content, and C2PA Content Credentials (2.3, with
Google, OpenAI, Meta and Adobe participating) is the standard that carries
it, including an AI Disclosure assertion covering model provenance and the
degree of human oversight. Since agents will draft content here, the CMS
should record human-oversight metadata from day one, even before we emit
C2PA manifests.

---

## 1. Content standpoint: what a page actually is

### 1.1 Three levels of configuration

The thing missing from today's admin. Every setting resolves through a
cascade, each level falling back to the one above:

```
GLOBAL          site name, default title template, org schema, social
   |            profiles, default OG image, robots policy, nav, footer
   v
PAGE TYPE       per-type defaults: title pattern, schema type, sitemap
   |            priority/changefreq, required blocks, default CTA
   v
PAGE            everything overridable per page, and nothing else
```

**Global** is a singleton (headless CMS vocabulary: a "global" or
"singleton"): one row, edited in one screen, referenced everywhere.

### 1.2 The ten page types

Not invented; these are what the site already publishes:

| # | Type | Schema.org | Distinctive fields |
|---|---|---|---|
| 1 | AI Update | Article | highlights, takeaways, My View, documents, video, deal logos |
| 2 | Guide / 3D Explainer | TechArticle | blocks, defined terms, comparison, FAQs, sources, interactive slot |
| 3 | Encyclopedia Concept | DefinedTerm | category, difficulty, prerequisites, key terms, resources, deep dive |
| 4 | Insight / Essay | BlogPosting | pillar, body, figures |
| 5 | Notebook Entry | Article | conference, sessions, speakers, dates |
| 6 | Roadmap Topic | LearningResource | week, prerequisites, outcomes, free resources |
| 7 | Contributor Profile | Person | bio, photo + credit, links, related news |
| 8 | Publication | ScholarlyArticle | abstract, DOI, JEL, citation, venue |
| 9 | Hub / Landing | CollectionPage | query-driven lists, intro, featured |
| 10 | Lecture / Course | Course + VideoObject | lessons, video, transcript, captions, exercises |

Each type is the shared spine plus a small typed extension. That is the
"template library" the owner asked for.

### 1.3 Field types the editor must support

Text, rich text (block editor), slug, number, boolean, date, select, tags,
media (image, video, file, with credit and alt), reference (to another page),
list of references, repeater (arrays of grouped fields), JSON, and code. Two
project-specific ones matter: **interactive slot** (a named 3D scene or video
id) and **diagram** (image, SVG, or mermaid source).

### 1.4 Blocks, not a blob

The current CMS has a single `body`. Every serious content model uses ordered
blocks so sections and headings are data. **Reuse the block union already in
`src/data/guides.ts`** (`p`, `h2`, `h3`, `list`, `callout`, `code`, `image`,
`figure`, `comparison`, `termcard`, `faq`, `related`, `sources`, `details`,
plus interactive slots) rather than inventing a second vocabulary. Headings
then generate the table of contents, the JSON-LD, and the anchor links for
free, and the renderer stays exactly the one the site already ships.

---

## 2. SEO standpoint: what must be controllable, and where

### 2.1 Global level (missing today)

Site name, default title template (`%page% · %site%`), default meta
description, default OG image, Organization schema (name, logo, sameAs
profiles), Person schema, robots policy, hreflang defaults, sitemap defaults,
verification tokens, redirect table, 404 policy.

### 2.2 Page-type level (missing today)

Title pattern per type, default schema type, sitemap priority and change
frequency, canonical rule, whether the type appears in llms.txt, required
blocks, and the discovery rules that apply to it.

### 2.3 Page level (partly present today)

SEO title, meta description, canonical (with a self-canonical default),
robots (index/noindex, follow/nofollow), OG and Twitter overrides, primary
keyword and intent, internal links, schema overrides, and publish dates.

### 2.4 Structured data, 2026 reality

Emit per type: Organization and Person once globally; Article or TechArticle
or DefinedTerm per page; BreadcrumbList on anything nested; FAQPage and
HowTo where genuinely present, understanding these now serve answer engines
rather than Google rich results. **Hard rule from Google's own guidance: the
JSON-LD must match the visible HTML.** The CMS should generate schema from
the same fields that render, never from a separate free-text box, which is
how the two drift apart.

---

## 3. AI and answer-engine standpoint

### 3.1 Generated discovery artifacts

On every publish, regenerate and verify, never hand-edit:

- `sitemap.xml` with accurate `lastmod`
- `llms.txt`, **conformant**: H1, blockquote summary, optional detail
  paragraphs, then H2 sections whose items are `- [Name](url): note`.
  Reserve an `## Optional` section for links agents may skip, which is the
  spec's own convention for secondary material.
- `llms-full.txt` as the concatenated long form (a widely adopted companion
  convention rather than part of the core spec)
- per-page markdown twins at `/<path>.md`
- OKF dataset docs
- JSON-LD, from the rendered fields

### 3.2 Answer-engine formatting rules the CMS should enforce

Questions as headings with the answer in the first sentence beneath, because
that is the pattern extraction engines reward. Facts near the top. Explicit
dates and sources. Tables for comparisons. These are lint rules the editor
can check while writing, not vibes.

### 3.3 Provenance and disclosure

Record on every page: author (human or agent id), model and version if
AI-assisted, degree of human oversight, sources fetched with timestamps and
HTTP status, and the gate receipts. This satisfies the EU AI Act Article 50 /
California SB 942 direction of travel and gives us the raw material to emit
C2PA-style AI Disclosure assertions later without re-instrumenting anything.

---

## 4. Agent standpoint

### 4.1 The contract

```
Agent  ->  reads schema  ->  drafts into typed fields  ->  attaches sources
                                        |
                            validation against the schema
                                        |
                              owner review queue (diff, gates, preview)
                                        |
                                  human approve  ->  publish
```

**Agents never publish.** This matches the reference implementation: AI
writes to a release, a human releases it.

### 4.2 Interface: MCP server, not a bespoke API

MCP is now the standard way agents discover and call tools, and every serious
CMS is shipping one. Expose the CMS as an MCP server with a small, safe tool
surface:

| Tool | Permission |
|---|---|
| `list_page_types`, `get_schema(type)` | read |
| `search_content`, `get_page(slug)` | read |
| `create_draft(type, fields, sources)` | write, draft only |
| `patch_draft(id, ops)` | write, draft only |
| `attach_source(id, url, quote, fetched_at)` | write, draft only |
| `run_gates(id)` | read, returns pass/fail with reasons |
| `submit_for_review(id)` | write, draft only |

No `publish` tool exists. That is the enforcement: not a policy an agent
might ignore, but an endpoint that does not exist.

### 4.3 Schema as the contract

Give the agent the JSON Schema for a type and validate every write against
it. A generated value lands in a typed field or is rejected. This is what
makes agent output boring and safe instead of creative and wrong.

### 4.4 The gates an agent must clear

Already built as scripts; they become publish-blocking services:

| Gate | What it prevents |
|---|---|
| `okf_attest.py` | stated counts drifting from the data |
| `check-brand.py` | unreadable contrast, unpaired accent colors |
| `check-links.py` | a named link that lands on the wrong thing |
| `verify-resources.py` | dead or off-topic curated resources |
| `check-discovery.py` | published but undiscoverable pages |
| schema validation | malformed or incomplete typed content |
| source verification | a factual claim with no live source |

---

## 5. Global-level and type-level operations the owner asked for

Beyond editing one page:

- **Bulk field edit** across a type (retitle a pattern, add a tag)
- **Global find and replace** with preview and per-page approval
- **Redirects** table with loop detection
- **Orphan report**: pages with no inbound internal link
- **Broken link sweep** across all content, scheduled
- **Schema coverage report**: which pages lack required structured data
- **Discovery sweep**: re-run `check-discovery.py` across the whole site
- **Regenerate artifacts**: sitemap, llms files, twins, on demand
- **Content freshness**: pages whose sources are older than N months

---

## 6. Build sequence

Unchanged from `CMS_PLAN.md`, now with the research behind each step:

0. **Gates as a service** (they exist; wrap them)
1. **Globals + one page type end to end** (AI Update), published without a
   deploy via ISR
2. **MCP server + review queue** so Omniscite agents can draft
3. **Remaining types**, encyclopedia first
4. **Bulk and global operations**, template library polish

**Immediate fix, independent of the CMS: make llms.txt conformant.** It is a
small change, it is currently costing us machine readability, and it proves
the generate-from-data principle before we build anything larger.

---

## Sources

- [The /llms.txt file, v2](https://llmstxt.org/) for the format spec
- [Sanity Agent Actions](https://www.sanity.io/agent-actions) for schema-aware agent writes and the write-to-release rule
- [SEOmatic guide](https://billymedia.co.uk/blog/seomatic-for-craft-cms-complete-guide) for the global to section to entry cascade
- [Structured data after Google I/O 2026](https://www.digitalapplied.com/blog/structured-data-after-io-2026-schema-updates) and [FAQ schema in 2026](https://www.quattr.com/blog/faq-schema-in-2026) for what schema still earns results
- [C2PA implementation guide](https://c2pa.org/a-new-implementation-guide-for-content-credentials/) and [Content Credentials 2026 status](https://www.textsight.ai/blog/c2pa-content-credentials-guide/) for provenance and AI disclosure
- [CMS platforms with MCP server support](https://www.llmcms.org/guides/best-cms-mcp-server-support-ai-agents-2026) for the agent interface pattern
- [Headless CMS content modelling best practices](https://tbw.rangle.io/headless-cms-playbook/content-modelling/best-practices-for-content-modelling) for globals, reusable modules and field naming
