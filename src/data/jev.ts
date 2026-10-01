/**
 * jev.ts: the "What is Jev" decision bench.
 *
 * Data-only module (no React or three imports) behind the interactive 3D
 * explainer at /guides/what-is-jev. The scene, the guided journey, the
 * explore panels and the crawlable static tables all render from this file,
 * so the page, its markdown twin and the 3D cannot drift apart.
 *
 * Evidence stance. Everything with a number is one of three things, and the
 * text says which: a value from TypeSafe's own documentation (cited), an
 * independent published finding (cited), or an illustration of the shape a
 * response takes. The support-ticket walkthrough is an illustration: no Jev
 * request was made for this guide, and none of its probabilities are
 * recorded model output. Sources were checked on 2026-09-24.
 */

export type JevKind = "evidence" | "decision" | "rule" | "work";

export interface JevKindMeta {
  id: JevKind;
  label: string;
  /** Muted functional accent, the same family as the LLM and HVAC scenes. */
  color: string;
  blurb: string;
}

export const KINDS: Record<JevKind, JevKindMeta> = {
  evidence: {
    id: "evidence",
    label: "Evidence: what your application supplies",
    color: "#5f8cb0",
    blurb: "The request, the state it becomes, and the questions your code writes. Jev never goes looking for any of it.",
  },
  decision: {
    id: "decision",
    label: "Decision: what Jev returns",
    color: "#8b84ad",
    blurb: "A typed answer for every question, with a probability for every allowed outcome. No sentences, no code, no explanation.",
  },
  rule: {
    id: "rule",
    label: "Rules: what your code enforces",
    color: "#b39a6b",
    blurb: "Thresholds, permissions and routing live in ordinary software. A probability can inform a rule; it cannot replace one.",
  },
  work: {
    id: "work",
    label: "Work: what generative models and tools do",
    color: "#79a68d",
    blurb: "Writing the reply, producing the patch, running the tests. Jev sits beside this work and helps choose; it does not do it.",
  },
};

/** Verified facts the copy is built from. Every one carries its source. */
export const JEV_FACTS = {
  vendor: "TypeSafe AI",
  released: "2026-09-15",
  checked: "2026-09-24",
  modelId: "jev-1.13.0",
  aliases: ["jev-latest", "jev-preview"],
  endpoint: "POST https://api.typesafe.ai/v1/systemone",
  /** USD per million input tokens, from docs.typesafe.ai/models. */
  inputPerMtok: 0.042,
  outputPerMtok: 0,
  /** State plus all questions, in tokens. */
  contextTotal: 64_000,
  /** State plus the single longest question, in tokens. */
  contextLongest: 32_000,
  inputTypes: "Text only: a string, a JSON object, or an array of text values. No image, audio or video input.",
  /** Vendor-reported, from the launch post; the post itself calls these the higher end of real-world gains. */
  latencyClaim: "70 ms to 500 ms end to end",
  speedClaim: "40x to 200x faster than the frontier models it was compared against",
  evalsClaim: "193.6x faster and 444.6x cheaper on TypeSafe's own workflow evals",
  sources: {
    models: "https://docs.typesafe.ai/models",
    api: "https://docs.typesafe.ai/api",
    launch: "https://typesafe.ai/blog/introducing-system-one-models-and-jev",
    evals: "https://evals.typesafe.ai/",
  },
} as const;

/* ------------------------------------------------------------------ *
 *  The worked example: one support ticket, three questions
 * ------------------------------------------------------------------ */

export interface ExampleQuestion {
  key: string;
  type: "noul" | "choice" | "score";
  text: string;
  /** Choice options or Score levels, in declaration order. */
  options?: { id: string; label: string }[];
}

export const EXAMPLE = {
  ticket: "The latest release prevents users from signing in.",
  questions: [
    { key: "login_failure", type: "noul", text: "Does the ticket explicitly report a login failure?" },
    {
      key: "team",
      type: "choice",
      text: "Which team should investigate?",
      options: [
        { id: "authentication", label: "Authentication: sign-in, sessions, passwords" },
        { id: "platform", label: "Platform: releases, infrastructure, outages" },
        { id: "billing", label: "Billing: charges, invoices, refunds" },
        { id: "insufficient_evidence", label: "Insufficient evidence: the ticket does not say" },
      ],
    },
    {
      key: "severity",
      type: "score",
      text: "How severe is the reported issue?",
      options: [
        { id: "0", label: "Cosmetic" },
        { id: "1", label: "Broken or degraded" },
        { id: "2", label: "Blocking" },
      ],
    },
  ] as ExampleQuestion[],
  /**
   * The shape of an answer set. The Score numbers are TypeSafe's documented
   * example for a three-level severity rubric (docs.typesafe.ai/primitives/score);
   * the Noul and Choice numbers are illustrative and were not produced by Jev.
   */
  answers: {
    login_failure: { noul: 0.96 },
    team: {
      choice: "authentication",
      probabilities: { authentication: 0.71, platform: 0.19, insufficient_evidence: 0.07, billing: 0.03 },
      confidence: 0.62,
    },
    severity: { score: 1.43, probabilities: { "0": 0.0, "1": 0.57, "2": 0.43 }, confidence: 0.35 },
  },
  /** What the application's own rule does with those answers. Never the model. */
  outcome: "Route to the Authentication queue. A person confirms before anything about the release changes.",
} as const;

/* ------------------------------------------------------------------ *
 *  Stations: every object on the bench
 * ------------------------------------------------------------------ */

export interface JevStation {
  id: string;
  name: string;
  /** Short label drawn in the scene. */
  short: string;
  kind: JevKind;
  /** 1 = the decision bench (what Jev is); 2 = inside an agent harness. */
  act: 1 | 2;
  tagline: string;
  /** Plain-English story: what happens here. */
  story: string;
  /** The precise mechanism. */
  tech: string;
  analogy: string;
  numbers: { label: string; value: string }[];
  /** Where the claim comes from; empty means "an illustration in this guide". */
  source?: { label: string; href: string };
}

export const STATIONS: JevStation[] = [
  {
    id: "ticket",
    name: "The request",
    short: "Request",
    kind: "evidence",
    act: 1,
    tagline: "A support ticket lands. Somebody has to decide what happens to it",
    story:
      "Every day a queue fills with tickets like this one: \"The latest release prevents users from signing in.\" Before anyone can fix anything, three small decisions get made, usually by a person skimming: is this really a login failure, which team owns it, and how bad is it. Those three decisions are the kind of work Jev exists for.",
    tech:
      "A decision has a bounded answer space when you can write every allowed outcome down in advance. Routing, triage, relevance and yes/no verification all qualify. Open-ended writing does not, and Jev is not built for it.",
    analogy: "A mail room. Sorting the post is a decision job; writing the letters is not.",
    numbers: [
      { label: "Decisions in this example", value: "3 (a yes/no, a routing choice, a severity)" },
      { label: "Text generated by Jev", value: "None" },
    ],
  },
  {
    id: "state",
    name: "State",
    short: "State",
    kind: "evidence",
    act: 1,
    tagline: "The evidence, exactly as your code supplied it",
    story:
      "Your application sends Jev the material to judge: the ticket text, and perhaps the customer record as JSON. TypeSafe calls this the state. It is the whole world Jev sees for that request. If a fact is not in the state, Jev cannot use it, and it will not go and fetch it.",
    tech:
      "The state field accepts a string, a JSON object, or an array of text values. Text only: no image, audio or video input is documented. State plus every question must fit in 64,000 tokens, and state plus the single longest question in 32,000. Accuracy is documented to fall as the state fills with content unrelated to the decision, so retrieval and trimming stay your job.",
    analogy: "The case file handed to a reviewer. They judge what is in the folder, not what is in the archive.",
    numbers: [
      { label: "Accepted input", value: "string, JSON object, array of text" },
      { label: "State + all questions", value: "64k tokens" },
      { label: "State + longest question", value: "32k tokens" },
    ],
    source: { label: "TypeSafe: Models", href: "https://docs.typesafe.ai/models" },
  },
  {
    id: "questions",
    name: "Questions",
    short: "Questions",
    kind: "evidence",
    act: 1,
    tagline: "Your code writes the questions and every allowed answer",
    story:
      "Alongside the state goes a map of questions, each with a type. For the ticket: a Noul (does it explicitly report a login failure?), a Choice (which team, from a list you define with a description of each), and a Score (how severe, on levels you define). The answer space is yours. Jev cannot invent a fourth team.",
    tech:
      "Each question is an object with a type (noul, choice or score), instructions, and type-specific criteria: a map of option names to descriptions for a Choice, an ordered array of level descriptions for a Score, an optional true/false clarification for a Noul. All questions in a request see the same state and are evaluated independently.",
    analogy: "A form with the boxes already printed. The reviewer ticks; they do not add new boxes.",
    numbers: [
      { label: "Question types", value: "3: Noul, Choice, Score" },
      { label: "Questions per request", value: "one or many, one answer each" },
    ],
    source: { label: "TypeSafe: API reference", href: "https://docs.typesafe.ai/api" },
  },
  {
    id: "jev",
    name: "Jev",
    short: "Jev",
    kind: "decision",
    act: 1,
    tagline: "A System One model: it decides, it does not write",
    story:
      "Jev reads the state, evaluates every question against it in the same call, and returns a typed answer for each. It never produces a sentence. TypeSafe borrows the name from Daniel Kahneman's fast, intuitive System 1, as opposed to the slow, deliberate System 2 that generative models spend their tokens on.",
    tech:
      "Released 2026-09-15 by TypeSafe AI. Served at POST /v1/systemone with a model field (jev-1.13.0, or the jev-latest alias). TypeSafe describes a parallel sampler that produces all outputs in a single query rather than generating tokens one at a time, and a training method it calls Reinforcement Learning for Calibrated Decisions. As of 2026-09-24 neither the weights nor an architecture paper had been released, so those descriptions are the vendor's.",
    analogy: "A judge who only ever answers the questions on the docket, with a probability attached, and never writes an opinion.",
    numbers: [
      { label: "Model ID", value: "jev-1.13.0 (jev-latest)" },
      { label: "Input price", value: "$0.042 per million tokens" },
      { label: "Output price", value: "free" },
      { label: "Vendor-reported latency", value: "70 to 500 ms end to end" },
    ],
    source: { label: "TypeSafe: Introducing System One models and Jev", href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev" },
  },
  {
    id: "choice",
    name: "Choice",
    short: "Choice",
    kind: "decision",
    act: 1,
    tagline: "Pick one option, and show the probability of every option",
    story:
      "For \"which team should investigate?\", a Choice returns the option with the highest probability and the full distribution over all of them. In the illustration, authentication carries most of the mass, platform some, and insufficient evidence a little. That last option matters: an answer set with room for genuine ambiguity stops uncertainty from being forced into a confident-looking label.",
    tech:
      "Request: type \"choice\", instructions, and criteria as a map of option name to description. Response: choice (the highest-probability option), probabilities (summing to 1 across the declared options), and confidence, a 0 to 1 statistic computed from how concentrated the distribution is. A flat distribution means low confidence.",
    analogy: "A ballot count that reports every candidate's share, not just the winner.",
    numbers: [
      { label: "Returns", value: "choice, probabilities, confidence" },
      { label: "Illustration", value: "authentication 0.71 · platform 0.19 · insufficient evidence 0.07 · billing 0.03" },
    ],
    source: { label: "TypeSafe: Choice", href: "https://docs.typesafe.ai/primitives/choice" },
  },
  {
    id: "score",
    name: "Score",
    short: "Score",
    kind: "decision",
    act: 1,
    tagline: "A position on a scale you defined, as a weighted mean over its levels",
    story:
      "For \"how severe?\", a Score returns a probability for each level and a single number: the probability-weighted position on the scale. TypeSafe's documented severity example puts 0.57 on \"broken or degraded\" and 0.43 on \"blocking\", which works out to 1.43 on a 0 to 2 scale. That 1.43 is a position between two rungs. It is not a percentage and not the probability of being right.",
    tech:
      "Request: type \"score\", instructions, and criteria as an ordered array of level descriptions from low to high. Response: probabilities keyed by level number, score (the sum of level times probability, so 0 x 0.0 + 1 x 0.57 + 2 x 0.43 = 1.43), legend (level numbers mapped back to their descriptions), and confidence.",
    analogy: "A thermometer whose markings you wrote yourself. The reading only means what your scale says it means.",
    numbers: [
      { label: "Returns", value: "score, probabilities, legend, confidence" },
      { label: "Documented example", value: "0.00 · 0.57 · 0.43 across three levels = 1.43" },
    ],
    source: { label: "TypeSafe: Score", href: "https://docs.typesafe.ai/primitives/score" },
  },
  {
    id: "noul",
    name: "Noul",
    short: "Noul",
    kind: "decision",
    act: 1,
    tagline: "One number: the probability that the answer is yes",
    story:
      "For \"does the ticket explicitly report a login failure?\", a Noul returns a single value between 0 and 1. Near 1 is a strong yes, near 0 a strong no, near 0.5 an admission that the model gives both similar weight. It is TypeSafe's word for a yes/no question whose answer is a probability, and it is the smallest possible decision.",
    tech:
      "Request: type \"noul\", instructions, and an optional criteria object describing what true and false mean. Response: a noul field holding the probability of yes. There is no separate confidence field, because a two-outcome distribution is fully described by that one number.",
    analogy: "A gauge with one needle. Where it points is the whole answer.",
    numbers: [
      { label: "Returns", value: "noul (probability of yes)" },
      { label: "Confidence field", value: "none; the probability is the whole distribution" },
    ],
    source: { label: "TypeSafe: Noul", href: "https://docs.typesafe.ai/primitives/noul" },
  },
  {
    id: "confidence",
    name: "Confidence",
    short: "Confidence",
    kind: "decision",
    act: 1,
    tagline: "How concentrated the probabilities are. Not how right the answer is",
    story:
      "Choice and Score answers carry a confidence value derived from their own distribution: one dominant option reads near 1, an even spread reads low. It is a statistic about the answer's shape. A confident answer can still be wrong, which is why the thresholds that decide \"act automatically\", \"proceed carefully\" or \"send to a person\" need to be set on examples from your actual task, not copied from a default.",
    tech:
      "TypeSafe computes confidence from the probability distribution and returns the full probabilities too, so an application can define its own measure. Its guidance: different actions in the same system deserve different thresholds, set by the consequences of being wrong, and the right values depend on the domain and the model's measured performance there.",
    analogy: "A show of hands. Unanimous tells you the room agrees; it does not tell you the room is right.",
    numbers: [
      { label: "Carried by", value: "Choice and Score (not Noul)" },
      { label: "Range", value: "0 to 1, from the distribution's spread" },
    ],
    source: { label: "TypeSafe: Confidence", href: "https://docs.typesafe.ai/confidence" },
  },
  {
    id: "rules",
    name: "Application rules",
    short: "Rules",
    kind: "rule",
    act: 1,
    tagline: "Your code turns answers into actions. The model never does",
    story:
      "The answers come back and ordinary software takes over: a threshold on the Noul, a routing table keyed by the Choice, a severity band from the Score. In the example the ticket goes to the Authentication queue. Nothing about the release itself changes, because a routing decision does not authorize a production change; a permission check in code does.",
    tech:
      "Keep exact arithmetic, date comparison and permission checks in code. TypeSafe documents that Jev reads numbers and dates as text, answers the question you wrote rather than the one you meant, and does not treat state as hostile by default. Model output is an input to a rule, never the rule.",
    analogy: "The sorter puts the letter in the tray. Who is allowed to open the vault is written on the wall, not decided by the sorter.",
    numbers: [
      { label: "Decided by code", value: "thresholds, routing, permissions, retries" },
      { label: "Decided by Jev", value: "probabilities over your declared answers" },
    ],
    source: { label: "TypeSafe: Jev 1.13 jaggedness", href: "https://docs.typesafe.ai/model-jaggedness/jev-1.13" },
  },
  {
    id: "generator",
    name: "Generative model",
    short: "Generator",
    kind: "work",
    act: 1,
    tagline: "The writer next door: replies, code and explanations come from here",
    story:
      "When the workflow needs a reply to the customer, a patch for the bug, or an explanation of anything, that is a generative model's job. Jev does not search the web, does not write, does not hold a conversation, and TypeSafe says so plainly. A system can use both kinds of model; the usual shape is Jev deciding at the joints and a generative model doing the prose in between.",
    tech:
      "TypeSafe: Jev \"is not a drop-in replacement for the LLM behind\" coding agents and \"does not generate text, write code, or hold a conversation.\" Structured-output modes on OpenAI, Anthropic and Perplexity APIs constrain the format of generated text; they do not make its values correct, and neither does a typed answer from Jev.",
    analogy: "The sorting desk and the writing desk sit in the same room and do different jobs.",
    numbers: [
      { label: "Jev writes", value: "nothing" },
      { label: "Documented for generation", value: "not trained for it; slow and ineffective when forced" },
    ],
    source: { label: "TypeSafe: Jev with coding agents", href: "https://docs.typesafe.ai/introduction/coding-agents" },
  },
  /* ---------------- Act 2: inside an agent harness ---------------- */
  {
    id: "chunks",
    name: "Context selection",
    short: "Context",
    kind: "evidence",
    act: 2,
    tagline: "Choose what the coding model sees this turn",
    story:
      "Inside a coding agent, the harness retrieves candidate material for the task: the login function, part of a failure trace, a few search hits, the project rules. Not all of it should go into this turn's prompt. Jev can score each candidate's relevance so the harness shows the login code in full, a summary of the trace, and hides the unrelated page styles until a later question needs them.",
    tech:
      "A proposed harness design, not a Jev feature: visibility levels per authorized, versioned chunk (hidden, short summary, long summary, full). Jev can classify or score candidates; the harness must retrieve them, write any summaries, respect the token budget and keep provenance. Scoring cannot repair a retrieval that missed the evidence.",
    analogy: "A mechanic's service history. Bring the relevant pages to the bench; leave the rest in the file, not in the bin.",
    numbers: [
      { label: "Status", value: "architecture proposal (LangChain, TypeSafe cookbooks)" },
      { label: "Jev's part", value: "relevance scores; retrieval stays with the harness" },
    ],
    source: { label: "LangChain: Building a harness with Jev", href: "https://www.langchain.com/blog/building-a-harness-with-jev" },
  },
  {
    id: "policy",
    name: "Policy gate",
    short: "Policy",
    kind: "rule",
    act: 2,
    tagline: "A risk judgment, then a real permission check, before any tool runs",
    story:
      "The coding model proposes an action: edit the login function, run a command. Jev can answer \"does this proposed command touch credentials?\" as a Noul. Then deterministic code validates the tool's arguments, the allowed files and the operation, and only a permitted action executes. A high risk score cannot override a hard deny, and a low one cannot grant permission.",
    tech:
      "Progressive disclosure: capability description first, the chosen tool's schema next, full documentation on demand. Jev chooses among declared tool names or closed-set argument values; free-form arguments need deterministic construction or a generative model, then validation. Analyze the action and its target at execution time, not the command's name.",
    analogy: "A risk flag on the work order, then the foreman checks the permit before the machine starts.",
    numbers: [
      { label: "Jev's part", value: "advisory risk judgment (Noul or Choice)" },
      { label: "Enforcement", value: "schemas, access checks, sandbox, approval" },
    ],
    source: { label: "TypeSafe: Function calling", href: "https://docs.typesafe.ai/cookbooks/function_calling" },
  },
  {
    id: "tools",
    name: "Tools and tests",
    short: "Tools",
    kind: "work",
    act: 2,
    tagline: "Apply the patch, run the checks, feed the result back as evidence",
    story:
      "Permitted tools apply the proposed fix and run the relevant checks. If login still fails, the new trace becomes state for the next turn; if the checks pass, the harness prepares the diff and its evidence for review. A passing test is evidence about the cases it tested, not proof that every user path works, so completion is judged against the task's acceptance criteria.",
    tech:
      "Keep typed records of actions, tool output, affected files, versions and validation results. Bound retries; route uncertainty to more evidence or to review. Test results come from the runner in an isolated environment; a model's \"looks good\" cannot substitute for running the checks.",
    analogy: "Fit the part, start the engine, listen. What you hear goes on the next work order.",
    numbers: [
      { label: "Loop", value: "propose, execute permitted tools, observe, repeat" },
      { label: "Stops when", value: "acceptance criteria met, or review requested" },
    ],
  },
  {
    id: "bench",
    name: "Measurement bench",
    short: "Measure",
    kind: "rule",
    act: 2,
    tagline: "Run it both ways on the same tasks before believing the diagram",
    story:
      "None of this is proven by drawing it. Run a baseline agent and the Jev-assisted agent on the same representative tasks with comparable models, tools and budgets, then ask: did it finish correctly, what did the whole task cost, how long did people wait, and how often did it allow or block the wrong action. TypeSafe's own numbers come from its workflow evals with reference labels averaged from two frontier models; that is useful evidence about that setup, not a guarantee about yours.",
    tech:
      "Held-out tasks and repeated runs. Report task success, cost per successful task, median and tail latency, evidence recall, calibration, false allows and false blocks. Compare individual mechanisms as well as the whole system so a gain can be attributed. An artificially weak baseline overstates the benefit.",
    analogy: "Two cars, same track, same day, stopwatch and fuel gauge. Anything else is a brochure.",
    numbers: [
      { label: "Vendor evals", value: "193.6x faster, 444.6x cheaper, vs consensus reference labels" },
      { label: "Independent", value: "arXiv 2609.24052: F1 0.908 vs 2,416 blinded human judgments" },
    ],
    source: { label: "TypeSafe: Workflow evals", href: "https://evals.typesafe.ai/" },
  },
];

export const stationById = (id: string) => STATIONS.find((s) => s.id === id);
export const stationsOfKind = (k: JevKind) => STATIONS.filter((s) => s.kind === k);

/* ------------------------------------------------------------------ *
 *  The guided journey
 * ------------------------------------------------------------------ */

export type FlowSegment = "intake" | "decide" | "act" | "harness" | "loop" | null;

export interface JevStep {
  id: string;
  title: string;
  narration: string;
  highlightIds: string[];
  flow: FlowSegment;
  act: 1 | 2;
}

export const JOURNEY: JevStep[] = [
  {
    id: "j-request",
    title: "A request arrives",
    narration:
      "A support ticket says: \"The latest release prevents users from signing in.\" Three small decisions have to be made before anyone can help: is it really a login failure, which team owns it, and how severe is it. Follow those three decisions through the bench.",
    highlightIds: ["ticket"],
    flow: "intake",
    act: 1,
  },
  {
    id: "j-state",
    title: "Your app supplies the state and the questions",
    narration:
      "The application packages the evidence as state (the ticket text, maybe the account record as JSON) and writes three typed questions with every allowed answer spelled out. Jev sees exactly this and nothing else. It does not search, fetch or remember.",
    highlightIds: ["state", "questions"],
    flow: "intake",
    act: 1,
  },
  {
    id: "j-jev",
    title: "Jev answers every question in one call",
    narration:
      "All three questions are evaluated against the same state in a single request, and a typed answer comes back for each. No sentence is generated at any point. That is the whole trick of a System One model, and the reason it can be priced on input tokens alone.",
    highlightIds: ["jev"],
    flow: "decide",
    act: 1,
  },
  {
    id: "j-choice",
    title: "Choice: which team?",
    narration:
      "The Choice returns the most probable team and the probability of every team, including \"insufficient evidence\". In this illustration authentication takes 0.71 of the mass. Because the distribution is not flat, the confidence value is moderate rather than high; your code can read either.",
    highlightIds: ["choice", "confidence"],
    flow: "decide",
    act: 1,
  },
  {
    id: "j-score",
    title: "Score: where on the scale?",
    narration:
      "The Score spreads probability across the levels you defined and reports the weighted position. TypeSafe's documented severity example lands at 1.43 on a 0 to 2 scale: between \"broken or degraded\" and \"blocking\", leaning to the former. It is a position, not a percentage.",
    highlightIds: ["score"],
    flow: "decide",
    act: 1,
  },
  {
    id: "j-noul",
    title: "Noul: how likely is yes?",
    narration:
      "The Noul is one number: the probability that the ticket explicitly reports a login failure. Near 1 says yes with conviction, near 0.5 says the evidence cuts both ways. No confidence field is needed, because that single value already describes the whole yes/no distribution.",
    highlightIds: ["noul"],
    flow: "decide",
    act: 1,
  },
  {
    id: "j-rules",
    title: "Your code decides what happens next",
    narration:
      "Answers in hand, ordinary software applies its rules: Noul above the threshold and Choice says authentication, so the ticket goes to the Authentication queue. A routing decision never authorizes a production change; permissions, arithmetic and dates stay in code, where TypeSafe's own limitations page says they belong.",
    highlightIds: ["rules"],
    flow: "act",
    act: 1,
  },
  {
    id: "j-not",
    title: "What Jev is not",
    narration:
      "The reply to the customer and the fix for the bug come from the generative model at the next desk. Jev does not write, code, chat or browse. Structured-output modes on generative APIs constrain the format of text; neither they nor Jev's typed answers guarantee the values are right.",
    highlightIds: ["generator"],
    flow: null,
    act: 1,
  },
  {
    id: "j-context",
    title: "Inside an agent: choose what the model sees",
    narration:
      "The same three primitives can sit inside a coding agent. Here the harness has retrieved the login function, a failure trace, some search hits and the page styles. Jev scores each for relevance; the harness shows the login code in full, summarizes the trace and hides the styles for this turn. Hidden means not in this prompt, never deleted.",
    highlightIds: ["chunks"],
    flow: "harness",
    act: 2,
  },
  {
    id: "j-gate",
    title: "Check before acting",
    narration:
      "The coding model wants to edit the login function. Jev can flag the risk of the proposed action as a Noul. Then code validates the arguments, the files and the operation, and only a permitted tool runs. The flag advises; the policy decides; a high score cannot override a hard deny.",
    highlightIds: ["policy"],
    flow: "harness",
    act: 2,
  },
  {
    id: "j-loop",
    title: "Fix, test, repeat",
    narration:
      "Tools apply the patch and run the checks. A failing check is new evidence and flows back into the state for the next turn; a passing one goes to review with its diff. The loop is bounded by code, and the test runner, not a model's opinion, establishes whether the checks passed.",
    highlightIds: ["tools"],
    flow: "loop",
    act: 2,
  },
  {
    id: "j-prove",
    title: "Prove the benefit",
    narration:
      "Run the baseline agent and the Jev-assisted one on the same held-out tasks and measure success, cost per successful task, latency, and wrong allows or blocks. TypeSafe reports large speed and cost gains on its own evals and says they sit at the higher end of real-world results. Independent preprints already show both promise and failure modes. Measure yours.",
    highlightIds: ["bench"],
    flow: null,
    act: 2,
  },
];

export const JEV_COUNTS = {
  stations: STATIONS.length,
  journeySteps: JOURNEY.length,
  kinds: Object.keys(KINDS).length,
  questionTypes: 3,
  act1: STATIONS.filter((s) => s.act === 1).length,
  act2: STATIONS.filter((s) => s.act === 2).length,
};
