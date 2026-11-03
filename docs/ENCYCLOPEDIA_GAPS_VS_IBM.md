# Encyclopedia gap analysis against IBM Think

Benchmarked our 176 concepts against IBM's own AI taxonomy, taken from
their live hubs on 2026-08-19: the 2026 Guide to AI, the 2026 Guide to
Machine Learning (15 sections), and the AI-theory, AI-for-code, Enterprise
AI, Responsible AI and AI-platforms hubs.

**Method note.** A first pass with substring matching produced 23 "gaps",
several of them false: it missed Computer Vision (we have it as a category
with Vision Transformer and VLA models), Model Training (we have Training
vs Inference, Distributed Training, Mixed-Precision Training) and Data
Science (we have Data Science vs ML vs AI). Every gap below was then
confirmed by searching the actual concept list. The crude count was wrong;
these are real.

## Where we are already ahead of IBM

Worth stating, because it sets what "filling gaps" should not cost us. On
the agent stack our depth exceeds IBM's published explainers: Agent
Harnesses & Scaffolding, Agent Memory/Planning/Reflection, Multi-Agent
Systems & Orchestration, Computer Use & Browser Agents, Model Context
Protocol, Context Engineering, Agentic Coding. Same on frontier technique:
Mechanistic Interpretability, Model Quantization & Compression, Knowledge
Distillation, Differential Privacy, Red Teaming, Synthetic Data.

IBM's advantage is not depth. It is **coverage of the commercial and
theoretical edges** we skipped, and that is exactly what the gap list is.

## Confirmed gaps, ranked by what they cost us

### Tier 1: real omissions in our own subject
These are technical or safety concepts a reader would reasonably expect in
an AI encyclopedia that claims completeness.

| Concept | Why it matters | Category |
| --- | --- | --- |
| **AI Safety** | We have AI Alignment and Red Teaming but no page for the parent field. A conspicuous hole given the site's positioning. | Safety |
| **Narrow AI (Weak AI) vs Strong AI** | The standard taxonomy every intro uses. We define AGI but never the contrast it sits against. | Core |
| **Superintelligence (ASI)** | The other end of the AGI axis; heavily searched. | Safety |
| **Technological Singularity** | Named concept with real literature. Currently absent. | Safety |
| ~~Prompt Injection & Jailbreaking~~ | **NOT A GAP. This analysis was wrong.** A `prompt-injection` concept already existed at rank 119. The gap search looked for "jailbreak" and never for "injection", so it missed it. Caught later by a duplicate-id check during implementation, not by review. The existing entry was extended to cover jailbreaking explicitly rather than duplicated. | Safety |
| **Agent-to-Agent protocols (A2A)** | We cover MCP but not the agent-to-agent side. Incomplete protocol story. | Agents |
| **ML Frameworks (PyTorch, TensorFlow, JAX)** | IBM makes "ML libraries" a first-class section. We have no tooling page at all. | MLOps |

### Tier 2: commercial concepts our audience actually needs
Our encyclopedia is written for practitioners; these are the practitioner
questions we do not answer.

| Concept | Why it matters |
| --- | --- |
| **Inference Cost & Token Economics** | The single most common real question in production AI, and we have nothing. Directly relevant to the site's SEO and agent work. |
| **AI Platforms** | How to evaluate a platform; IBM gives it a hub. |
| **Enterprise AI adoption** | The organizational layer: strategy, orchestration, scaling. |
| **Responsible AI** | We have Regulation & Governance and Alignment, but not the practice framework by its common name. |
| **Vibe Coding** | A named 2025-26 practice with genuine traction. We have Agentic Coding, which is adjacent but not the same thing. |

### Tier 3: deliberate non-goals
IBM covers AI in banking, retail, telecom, HR, sales, marketing, customer
service. **Recommend we do not follow.** That is IBM selling to verticals.
Chasing it would turn a technical reference into a content farm, which the
site profile explicitly names as what the site must never become.

## Recommendation

**Add 11 concepts** (Tier 1 and 2 minus prompt injection, which already
existed), taking the encyclopedia from 176 to 187. Skip Tier 3 entirely.

**Correction, recorded rather than quietly fixed.** The original
recommendation said 12 concepts to 188. One of the twelve, prompt
injection, was already covered. The gap search matched on "jailbreak" and
never on "injection". A duplicate-id check during implementation caught it;
review did not. The lesson is the one this codebase keeps relearning: a
search that reports ABSENCE has to be run against the thing you are
actually claiming is absent, and checked more than one way.

Sequence: Tier 1 first, because they are holes in what we already claim to
cover. AI Safety and Narrow vs Strong AI are the two that would most
embarrass us in front of a technical reader.

This is exactly the work the Agentic CMS was built for: each one is a
`concept` page type, which agents may create, and each needs sources.
Filing these as agent drafts through the review queue would be a real first
production run for the Omniscite integration rather than a test.


## Implementation record (2026-08-19)

Done. 176 to 187 concepts, plus one existing entry extended.

- 11 new concepts researched by 12 parallel agents, one per concept.
- **81 URLs machine-verified by me, not taken on the researchers' word.**
  This mattered: the agents reported that WebFetch was rate-limited during
  their run, so they had confirmed URLs only against search-result listings.
  79 resolved on the first check. The 2 that returned 403 were OpenAI pages
  blocking automation, confirmed alive in a real browser, not link rot.
- **All 21 videos checked against YouTube oEmbed for channel identity**, not
  just liveness. Every one was genuinely from the whitelisted channel the
  researcher claimed. No fabrications.
- Three defects found by integrity checks during assembly: the duplicate
  prompt-injection id above; prerequisites written as ids when this file
  uses display names; and duplicate resource keys. All fixed.
- `scripts/verify-resources.py` now also covers the concepts' own
  `learnMore` links, roughly 400 URLs that had no rot detector at all, and
  distinguishes hosts that block automation from genuinely dead links.
- A stale claim of "110 AI concepts" was found in `aiUpdates.ts` and fixed.
  It had been wrong since the encyclopedia passed 110.
