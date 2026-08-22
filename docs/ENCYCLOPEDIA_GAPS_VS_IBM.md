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
| **Prompt Injection & Jailbreaking** | We have Red Teaming but not the specific attack class, which is the one practitioners hit. | Safety |
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

**Add 12 concepts** (Tier 1 and 2), taking the encyclopedia from 176 to
188. Skip Tier 3 entirely.

Sequence: Tier 1 first, because they are holes in what we already claim to
cover. AI Safety, Narrow/Strong AI, and Prompt Injection are the three that
would most embarrass us in front of a technical reader.

This is exactly the work the Agentic CMS was built for: each one is a
`concept` page type, which agents may create, and each needs sources.
Filing these as agent drafts through the review queue would be a real first
production run for the Omniscite integration rather than a test.
