/**
 * agentsGuide.ts: Guide record for "The Complete Guide to AI Agents for
 * Marketing: From Zero to Production".
 *
 * One real job, "watch 5 companies and tell me what changed", taken from
 * first principles to a running agent, then five more marketing agents of
 * rising difficulty, then cost, tests, success criteria and production.
 * Every agent is runnable from the public companion repo
 * (github.com/VenkataPagadalaGIT/marketing-ai-agents).
 *
 * Evidence stance. Model IDs and prices were read from OpenRouter's live
 * model list; paper numbers from the papers themselves (MAST percentages
 * from arXiv 2503.13657 v3); API fields from OpenRouter's docs. Sources
 * checked 2026-10-14. The body blocks are GENERATED from the guide markdown
 * (agentsGuideBlocks.ts); edit the markdown and regenerate.
 */

import type { Guide, DefinedTerm, ComparisonRow, FaqItem, Block } from "./guides";
import { agentsGuideBlocks } from "./agentsGuideBlocks";

export const AGENTS_REPO_URL = "https://github.com/VenkataPagadalaGIT/marketing-ai-agents";

const agentsTerms: DefinedTerm[] = [
  {
    slug: "ai-agent",
    term: "AI agent",
    aka: ["LLM agent", "agentic system"],
    oneLiner:
      "An AI agent is a program that uses a language model to decide what to do next, does it with tools, looks at the result, and repeats until a goal is met.",
    inDepth:
      "Every agent has four parts: a model that reasons and chooses, tools it can call, memory of what happened before, and a loop with limits that runs the cycle and stops it. A chatbot answers one message; an agent pursues a goal across many steps, and each pass through the loop is one model call.",
    analogy: "A researcher with a checklist and a phone: they decide who to call next based on what the last call told them.",
    example: "A competitor monitor that reads five companies' blogs and news every morning, decides what is new and important, and sends a three-line digest.",
    agentRole: "The 20 percent of the job that needs judgment; the other 80 percent stays as plain code.",
  },
  {
    slug: "llm-workflow",
    term: "LLM workflow",
    aka: ["workflow", "prompt chain"],
    oneLiner:
      "A workflow is code that calls a language model at fixed points; the code, not the model, decides the next step.",
    inDepth:
      "Workflows are cheaper, faster and easier to test than agents because every step is a function you can run on its own. Anthropic's Building effective agents describes five patterns: prompt chaining, routing, parallelization, orchestrator-workers and evaluator-optimizer. Most production systems are workflows with a small agent inside.",
    analogy: "An assembly line where one station happens to be a skilled writer.",
    example: "Translate 100 product descriptions: the same three steps for every item, no decisions about what to do next.",
    agentRole: "The default. Reach for an agent only when the next step depends on what the last step found.",
  },
  {
    slug: "tool",
    term: "Tool",
    aka: ["function calling", "tool use"],
    oneLiner:
      "A tool is a function the model can ask your code to run, described by a name, a purpose and typed arguments.",
    inDepth:
      "The model never runs anything itself; it returns a request such as fetch_page with a URL, and your code decides whether to run it, runs it, and hands back a trimmed result. Good tools do one thing, return the minimum the model needs, and say in their description when to use them.",
    analogy: "The buttons on a control panel: the operator chooses which to press, the machine does the work.",
    example: "search_serp, fetch_page and brand_facts in the content brief agent; fetch_page returns headings and a word count, never raw HTML.",
    agentRole: "Where most cost and most injection risk enter. Trim outputs and never let the model choose a destination for data.",
  },
  {
    slug: "react-loop",
    term: "ReAct loop",
    aka: ["think, act, observe", "tool-using agent loop"],
    oneLiner:
      "ReAct is the pattern of interleaving reasoning and tool calls in a loop: think, act, observe the result, repeat.",
    inDepth:
      "Introduced by Yao et al. in 2022, ReAct showed that letting a model reason between actions beat both pure reasoning and pure acting on knowledge tasks. Production versions add what the paper did not need: a step cap, caps on expensive tools, and a token limit on what each tool result adds to the context.",
    analogy: "A detective who writes a note after every clue before deciding where to look next.",
    example: "The content brief agent returns {thought, tool, args} each step until it chooses finish or hits the step cap.",
    agentRole: "The core of any agent that has to decide its own path, such as research and triage.",
  },
  {
    slug: "orchestrator-workers",
    term: "Orchestrator-workers",
    aka: ["manager pattern", "supervisor and subagents"],
    oneLiner:
      "Orchestrator-workers is a pattern where a lead model breaks a job into tasks, hands each to a specialist, and combines the results.",
    inDepth:
      "Specialists see only the brief and their own task, which keeps each context small. Pass typed objects between agents, not chat transcripts, and give every worker its own call cap on a shared cost counter so one runaway worker cannot spend the whole budget.",
    analogy: "A campaign manager who writes the brief and assigns the landing page, emails, social posts and ads to four people.",
    example: "The campaign orchestrator: a manager plans 2 to 6 typed tasks, four specialists run in parallel, a reviewer scores each asset, a human approves.",
    agentRole: "Multi-channel work where the split varies by brief. If the split never varies, make the manager a Python list.",
  },
  {
    slug: "evaluator-optimizer",
    term: "Evaluator-optimizer",
    aka: ["writer-critic loop", "reflection"],
    oneLiner:
      "Evaluator-optimizer is a loop where one model writes, another scores the draft against criteria, and the writer revises using the feedback.",
    inDepth:
      "It works when the criteria are clear and a critique actually improves the next draft. Cap the number of revisions, and put any check that code can do (numbers, banned words, length) in code before the critic runs.",
    analogy: "An editor and a writer passing a draft back and forth, with a deadline.",
    example: "The analytics narrator: a strong model writes the weekly note, a grounding check rejects invented numbers, a cheap critic scores it, at most two revisions.",
    agentRole: "Client-facing writing where accuracy and tone both matter.",
  },
  {
    slug: "guardrail",
    term: "Guardrail",
    aka: ["output check", "policy check"],
    oneLiner:
      "A guardrail is a check, usually in code, that blocks or flags a model output before it reaches a person or a system.",
    inDepth:
      "Layer them: schema validation on every model answer, rule checks (banned words, required phone number, PII patterns, length), and a human gate for anything public, paid or sent to customers. A 15-line code guardrail is more reliable than a longer prompt.",
    analogy: "The spell-check and the legal review that sit between a draft and the send button.",
    example: "The review responder refuses drafts that promise refunds, mention a diagnosis, or omit the phone number on a negative review.",
    agentRole: "Mandatory on anything irreversible or customer-facing.",
  },
  {
    slug: "grounding-check",
    term: "Grounding check",
    aka: ["fact check against source", "number check"],
    oneLiner:
      "A grounding check verifies that every fact or number in a model's output exists in the source data it was given.",
    inDepth:
      "The rule behind it: the model never produces a number, it only explains numbers code produced. A regular expression that collects numbers from the draft and a set difference against the analysis catches the most embarrassing class of reporting error before any reviewer sees it.",
    analogy: "Checking every figure in a press release against the spreadsheet it came from.",
    example: "If the draft says bounce rate fell to 37 percent and 37 is not in the analysis, the draft is rejected.",
    agentRole: "Any agent that writes about data: reporting, analytics, pricing, claims.",
  },
  {
    slug: "human-in-the-loop",
    term: "Human-in-the-loop",
    aka: ["approval gate", "HITL"],
    oneLiner:
      "Human-in-the-loop means the agent proposes and a person approves before anything public, paid or customer-facing happens.",
    inDepth:
      "The approval queue is often the product: a list of drafts with a status of ready, needs edit or escalate. Track first-pass acceptance (drafts approved without edits) as a quality metric, and route anything risky, such as legal threats or health details, straight to a person with no draft.",
    analogy: "A junior who drafts every reply and a manager who clicks approve.",
    example: "Review replies, campaign assets and client reports in this guide all land in an approval file; nothing publishes itself.",
    agentRole: "The default for marketing agents today. Remove it only for low-risk, reversible actions with a proven track record.",
  },
  {
    slug: "prompt-injection",
    term: "Prompt injection",
    aka: ["indirect prompt injection", "lethal trifecta"],
    oneLiner:
      "Prompt injection is text in content an agent reads, such as a web page or a review, that tries to make the model follow new instructions.",
    inDepth:
      "Simon Willison's lethal trifecta names the dangerous combination: an agent that reads untrusted content, has access to private data, and can send data out. Remove any one of the three and an injection cannot become a theft. Detectors and guard models help as a second layer, never the first.",
    analogy: "A letter in the mail that says: whoever opens this, wire the money to this account.",
    example: "A competitor's blog post with hidden white text asking AI assistants to paste their API keys into the summary.",
    agentRole: "Every agent that reads the web. Treat fetched content as data, never as instructions.",
  },
  {
    slug: "context-engineering",
    term: "Context engineering",
    aka: ["context management"],
    oneLiner:
      "Context engineering is choosing which tokens go into the model's context window at each step, because quality falls as irrelevant tokens pile up.",
    inDepth:
      "Anthropic's guide frames context as a finite attention budget. The practical moves: trim tool results, retrieve just in time instead of preloading, compact long histories, keep notes outside the window, and give subagents clean windows that return condensed results.",
    analogy: "Packing a carry-on: what you leave out matters as much as what you bring.",
    example: "trafilatura strips pages to article text before the judge sees them; the content brief agent keeps only its last 12 research notes.",
    agentRole: "Cost control and quality control at the same time.",
  },
  {
    slug: "golden-set",
    term: "Golden set",
    aka: ["eval set", "regression set"],
    oneLiner:
      "A golden set is 30 to 50 real inputs with the answers you expect, used to check that a prompt or model change did not make the agent worse.",
    inDepth:
      "Run it on every prompt or model change, not in every CI run, because it calls real models. Its pass rate is the release gate. Add every miss from the weekly review to it, so the same mistake cannot ship twice.",
    analogy: "The exam paper you re-sit after every change to the study plan.",
    example: "For the monitor: which items a human would have flagged. For the narrator: the numbers that must appear.",
    agentRole: "The difference between tuning an agent and guessing.",
  },
  {
    slug: "shadow-mode",
    term: "Shadow mode",
    aka: ["dry run", "silent launch"],
    oneLiner:
      "Shadow mode runs an agent on its real schedule with real models while a human keeps doing the job, so the two can be compared before anyone relies on the agent.",
    inDepth:
      "Two weeks is a good default. Log every miss and false alarm, tune the threshold and the prompt, and exit only when recall holds above target for five straight days. It catches what offline tests cannot: real inputs, real timing, real noise.",
    analogy: "A new pilot flying alongside the captain before taking the controls.",
    example: "The monitor sends its digest to the builder, not to Priya, for weeks 2 and 3 of the rollout.",
    agentRole: "The step between tests passing and a user depending on it.",
  },
];

const agentsComparison: ComparisonRow[] = [
  {
    type: "Single-step",
    isA: "One model call, maybe one tool",
    answers: "What is this?",
    structure: "Prompt plus tools",
    example: "Classify a support email as sales, complaint or spam",
    bestFor: "Classification and extraction at scale",
    limit: "Cannot adapt to what it finds",
  },
  {
    type: "ReAct agent",
    isA: "A think, act, observe loop",
    answers: "What should I look at next?",
    structure: "Loop with step and tool caps",
    example: "Fetch five blogs, decide what is new, summarize",
    bestFor: "Research and triage with varied inputs",
    limit: "Cost varies with the number of steps",
  },
  {
    type: "Planning agent",
    isA: "Writes a plan, executes it, replans on failure",
    answers: "What are the steps to reach this goal?",
    structure: "Plan object plus executor",
    example: "A 30-day content calendar that adjusts as research comes in",
    bestFor: "Multi-step projects with dependencies",
    limit: "Plans drift; needs checkpoints",
  },
  {
    type: "Orchestrator-workers",
    isA: "A lead model delegating to specialists",
    answers: "Who should do which part?",
    structure: "Manager, typed tasks, workers, reviewer",
    example: "Landing page, emails, social and ads from one brief",
    bestFor: "Work that splits differently each time",
    limit: "Coordination failures; more calls",
  },
  {
    type: "Long-running autonomous",
    isA: "Pursues a goal for hours or days with memory",
    answers: "What should happen next in this program?",
    structure: "Durable state, scheduler, self-correction",
    example: "An A/B test program: propose, launch, read results, propose next",
    bestFor: "Rarely worth the risk for marketing today",
    limit: "Hard to test; high blast radius",
  },
];

const agentsFaqs: FaqItem[] = [
  {
    q: "What is an AI agent in marketing?",
    a: "An AI agent is a program that uses a language model to decide its next step, act with tools such as fetching a page or querying analytics, check the result, and repeat until a goal is met. In marketing that means jobs like monitoring competitors, drafting review replies, writing content briefs or explaining weekly analytics, with a person approving anything public.",
  },
  {
    q: "What is the difference between an AI agent and a workflow?",
    a: "In a workflow your code decides the next step and calls the model at fixed points; in an agent the model decides. Workflows are cheaper, faster and easier to test, so use one whenever you can write every step down in advance. Use an agent only when the next step depends on what the last step found.",
  },
  {
    q: "Do I need a framework like LangGraph, CrewAI or an agent SDK?",
    a: "Not to start. All six agents in this guide are plain Python with Pydantic schemas and one shared OpenRouter client, so every pattern is visible. Move to a framework when you need durable state, complex graphs or team conventions, and you will know which features you need.",
  },
  {
    q: "How much does it cost to run a marketing AI agent?",
    a: "With a cheap model for judging and a stronger model for writing, the agents in this guide cost cents per run: about $0.02 to $0.06 for a daily five-company monitor and $0.01 to $0.04 for a weekly analytics note. The bigger cost is usually the person's time to review, which is why the success metrics focus on adoption and first-pass acceptance.",
  },
  {
    q: "How do I stop an agent from looping or overspending?",
    a: "Use three walls: a spend limit on the API key itself, per-run caps in code on calls and dollars, and per-step caps such as max tokens, a maximum number of loop steps and limits on expensive tools. Then write a test that proves the agent stops when the model never says it is done.",
  },
  {
    q: "Should an AI agent publish content or reply to customers on its own?",
    a: "Not today. Public, paid and customer-facing actions are irreversible, so the agents in this guide end in an approval queue and a person clicks approve. Track how often drafts are approved without edits; that number tells you when, if ever, a narrow action can be automated.",
  },
  {
    q: "How do I test an AI agent?",
    a: "In layers: unit tests for the code steps, contract tests that reject bad model output, behavior tests that prove the loop and budget caps hold, and an end-to-end dry run, all offline with a mock model. Then run real models with no side effects on 20 to 30 real inputs, and keep a golden set of 30 to 50 cases as the release gate for prompt changes.",
  },
  {
    q: "How do I protect an AI agent from prompt injection?",
    a: "Assume any web page, review or crawl it reads may contain instructions aimed at the model. Remove at least one leg of the lethal trifecta: keep private data out of prompts that read untrusted text, and never let the model choose where data is sent. Add detectors as a second layer only.",
  },
  {
    q: "What is the best first AI agent for a marketing team?",
    a: "A competitor or market monitor: it is high value, it touches nothing public, its worst failure is a boring digest, and it can be built and tested in a weekend. It also teaches every core skill, including dedupe, cheap-model judging, structured output, budgets and scheduling.",
  },
];

const howTos: Guide["howTos"] = [
  {
    name: "How to build a competitor monitoring AI agent",
    description:
      "Build a daily digest agent that watches five companies and reports only what changed, using code for collection and two cheap model steps for judgment.",
    steps: [
      { name: "Write a one-page spec", text: "Name the user, the job, the inputs, the output, what to skip, what it must never do, the limits per run, and what done means. Fill in the ROI line before writing code." },
      { name: "Define the output schemas", text: "Write Pydantic models for every object the model returns, such as a Judgement with a 0 to 10 relevance score, a category and a short reason, so bad output never reaches the digest." },
      { name: "Collect in code", text: "Read RSS feeds with feedparser, fetch pages with httpx and strip them to article text with trafilatura, and give every item a content hash so nothing is judged twice." },
      { name: "Judge with a cheap model", text: "Score each new item 0 to 10 against a rubric and keep only items at or above the threshold." },
      { name: "Summarize with a stronger model", text: "Write a one or two sentence summary and a why-it-matters line per item, using only the source text." },
      { name: "Deliver and remember", text: "Send one digest to Slack or email, send nothing on quiet days, and store every item, score, digest and run cost in SQLite or Postgres." },
      { name: "Test offline, then dry run", text: "Run the whole pipeline with a mock model for $0, then with real models on 20 to 30 real inputs without sending, and read every output." },
    ],
  },
  {
    name: "How to take an AI agent to production",
    description: "A five-week rollout from spec to go-live with two weeks of shadow mode and a one-person pilot.",
    steps: [
      { name: "Week 1: spec and build", text: "Write the spec, build with a mock model until offline tests pass, and dry run on real inputs." },
      { name: "Weeks 2 and 3: shadow mode", text: "Run on schedule with real models but deliver to yourself while the human keeps doing the job; compare daily and tune until recall holds above target for five straight days." },
      { name: "Week 4: pilot", text: "Deliver live to one user, check in daily, and turn their feedback into golden-set cases." },
      { name: "Week 5: go-live", text: "Roll out to everyone, then hold a 30-minute weekly review of the ten worst outputs." },
      { name: "Production checklist", text: "Secrets in a secret manager, one capped API key per agent, idempotent runs, retries with backoff, timeouts, a run log, alerts, a kill switch, a human gate on anything public, versioned prompts, no PII in prompts, and tracing." },
    ],
  },
];

const tail: Block[] = [
  { kind: "h2", text: "Glossary", id: "glossary" },
  ...agentsTerms.map((t) => ({ kind: "termcard" as const, termSlug: t.slug })),
  { kind: "h2", text: "Frequently asked questions", id: "faq" },
  { kind: "faq" },
  {
    kind: "related",
    items: [
      { label: "How LLMs work, in 3D", href: "/guides/how-llms-work" },
      { label: "Graph types for AI agents", href: "/guides/graph-types-for-ai-agents" },
      { label: "What is Jev: a decision model inside an agent harness", href: "/guides/what-is-jev" },
      { label: "AI agents statistics", href: "/notebook/ai/agents" },
    ],
  },
];

export const agentsGuide: Guide = {
  slug: "ai-agents-for-marketing",
  title: "The Complete Guide to AI Agents for Marketing",
  metaTitle: "AI Agents for Marketing: Build One From Zero to Production",
  metaDescription:
    "What AI agents are, when to use one instead of a workflow, and how to build six marketing agents with code, costs, tests and a production checklist.",
  agentSummary:
    "A field guide to AI agents for marketing teams. One job, monitoring five competitors, goes from first principles to a running agent; five more agents follow (review replies, SEO content briefs, an analytics narrator, a campaign orchestrator and a multi-client SEO audit swarm), each with its pattern, code, ROI, costs and failure modes. Then cost limits with OpenRouter, offline tests, success metrics, the MAST failure research, a five-week rollout and prompt-injection defense. All six agents are in a public MIT-licensed repo with 42 offline tests and a prompt pack generated from the code. Sources checked 2026-10-14.",
  headline: "The Complete Guide to AI Agents for Marketing: From Zero to Production",
  kicker: "Field Guide",
  subhead:
    "One real problem, \"watch 5 companies and tell me what changed\", from first principles to a running agent, then five more marketing agents of rising difficulty, with the code, the costs, the tests and the rollout plan.",
  deck: "Parts 1 to 4 explain what agents are and when to use one. Parts 5 to 8 build the first agent end to end. Parts 9 to 13 add five more, from a review reply drafter to a multi-client SEO audit swarm. Parts 14 to 18 cover cost limits, testing, success criteria, production and security. Every agent runs from the public companion repo, offline, for $0: github.com/VenkataPagadalaGIT/marketing-ai-agents.",
  author: {
    name: "Venkata Pagadala",
    title: "AI Product Manager (Search · SEO · GEO)",
    org: "AT&T",
    url: "/about",
    bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the How LLMs Work and How Neural Networks Work 3D explainers on this site.",
  },
  image: {
    src: "/posters/ai-agents-for-marketing-og.jpg",
    width: 1200,
    height: 630,
    alt: "AI Agents for Marketing field guide: the agent loop, where goal and context go to the LLM, it decides the next step, calls a tool, and checks whether the goal is met.",
  },
  datePublished: "2026-10-14",
  dateModified: "2026-10-14",
  readingTime: "40 min read",
  tags: ["AI Agents", "Agentic AI", "AI Agents for Marketing", "Marketing Automation", "Context Engineering", "Prompt Injection", "AI Evaluation", "OpenRouter", "Python"],
  terms: agentsTerms,
  comparison: agentsComparison,
  comparisonHeaders: ["Type", "What it is", "Question it answers", "Structure", "Marketing example", "Best for", "Limit"],
  termRoleLabel: "In a marketing agent",
  faqs: agentsFaqs,
  blocks: [...agentsGuideBlocks, ...tail],
  howTos,
};
