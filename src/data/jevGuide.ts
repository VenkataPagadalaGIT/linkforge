/**
 * jevGuide.ts: Guide record for "What is Jev".
 *
 * Jev is TypeSafe AI's System One decision model (released 2026-09-15). The
 * article follows the reader-first arc: definition, how it differs from the
 * assistants people already use, why it matters, the honesty caveat, then
 * the mechanism one piece at a time, with the 3D bench riding on top.
 *
 * Evidence stance. Every figure is one of: a value from TypeSafe's own
 * documentation, an independent published finding, or an illustration that
 * says so. No Jev request was made for this guide, and the examples are not
 * recorded model output. Sources checked 2026-09-24. Type-only import keeps
 * this file free of a runtime cycle with guides.ts.
 */

import type { Guide, DefinedTerm, ComparisonRow, FaqItem, Block } from "./guides";
import { JEV_COUNTS, JEV_FACTS } from "./jev";

const jevTerms: DefinedTerm[] = [
  {
    slug: "jev",
    term: "Jev",
    aka: ["jev-1.13.0", "jev-latest"],
    oneLiner:
      "Jev is an AI model from TypeSafe AI that makes decisions from evidence and answer options supplied by an application, returning choices, scores and probabilities instead of text.",
    inDepth:
      "Released on 2026-09-15 as TypeSafe's first System One model, Jev is served through one endpoint (POST /v1/systemone). An application sends it a state (text or JSON) and a map of typed questions; every question is evaluated against the same state, independently, in one request. Jev never generates a sentence, which is why TypeSafe bills it on input tokens only. The current version is jev-1.13.0, reachable through the jev-latest alias.",
    analogy: "A judge who only answers the questions on the docket, with a probability attached, and never writes an opinion.",
    example: "Given a support ticket and the question \"which team should investigate?\" with four named teams, Jev returns the most probable team and the probability of every team.",
    agentRole: "At the joints of a workflow: routing, triage, relevance, verification and gating, next to a generative model that does the writing.",
  },
  {
    slug: "system-one-model",
    term: "System One model",
    aka: ["System 1 model", "decision model"],
    oneLiner:
      "A System One model is TypeSafe's term for a model that evaluates supplied evidence and returns typed decisions and calibrated probabilities rather than generated text.",
    inDepth:
      "The name borrows Daniel Kahneman's distinction, from Thinking, Fast and Slow, between fast intuitive System 1 thinking and slow deliberate System 2 reasoning. TypeSafe says these models understand natural-language input, are trained so their probabilities reflect outcomes, and do not write replies, produce code or explain their reasoning. The application defines the possible answers through primitives; the model picks among them.",
    analogy: "Recognizing a face versus writing a biography of the person. Both are intelligence; only one produces prose.",
    example: "Jev is the first System One model. A generative model such as those behind ChatGPT or Claude is the contrasting case: it produces the text.",
    agentRole: "The fast, cheap judgment inside an application, called many times per task; the generative model is called for the parts that need words.",
  },
  {
    slug: "state",
    term: "State",
    aka: ["evidence", "context"],
    oneLiner:
      "State is the evidence an application supplies to Jev in a request: a string, a JSON object, or an array of text values, and the only material the model can use.",
    inDepth:
      "Text only; TypeSafe documents no image, audio or video input. Two limits apply at once: state plus all questions must fit within 64,000 tokens, and state plus the single longest question within 32,000. TypeSafe documents that accuracy falls as the state grows with content unrelated to the decision, and that the model does not treat state as hostile by default, so retrieval, trimming and sanitizing stay with the application.",
    analogy: "The case file handed to a reviewer. They judge what is in the folder, not what is in the archive.",
    example: "The ticket text plus the customer's account record as JSON, sent together as one state for three questions.",
    agentRole: "Whatever a retrieval step selects becomes the state. If the evidence is not in it, Jev cannot use it and will not fetch it.",
  },
  {
    slug: "choice",
    term: "Choice",
    oneLiner:
      "A Choice is a Jev question that picks one option from a set the application declares, and returns the chosen option, a probability for every option, and a confidence value.",
    inDepth:
      "The request names each option and describes it. The response holds choice (the highest-probability option), probabilities (summing to 1 across the declared options) and confidence, a 0 to 1 statistic computed from how concentrated the distribution is. Because the application writes the options, a Choice cannot invent one, which is also why a good option set includes a place for genuine ambiguity such as \"insufficient evidence\".",
    analogy: "A ballot count that reports every candidate's share, not just the winner.",
    example: "\"Which team should handle this ticket?\" with returns, shipping and billing as options; TypeSafe's documented example returned returns with probability 1.0.",
    agentRole: "Routing and classification: which queue, which tool, which intent label, which workflow.",
  },
  {
    slug: "score",
    term: "Score",
    oneLiner:
      "A Score is a Jev question that rates the state on an ordered scale the application defines, returning a probability for each level and the probability-weighted position on that scale.",
    inDepth:
      "The request supplies levels as an ordered array of descriptions from low to high. The response holds probabilities keyed by level number, score (the sum of each level times its probability), a legend mapping numbers back to descriptions, and confidence. With levels 0, 1 and 2, TypeSafe's documented severity example is 0 x 0.0 + 1 x 0.57 + 2 x 0.43 = 1.43. That number is a position on the scale you wrote; it is not a percentage and not the probability of being correct.",
    analogy: "A thermometer whose markings you wrote yourself. The reading only means what your scale says.",
    example: "\"How severe is the reported issue?\" on Cosmetic, Broken or degraded, Blocking; 1.43 sits between the second and third rung.",
    agentRole: "Ranking and prioritizing: relevance of a passage, urgency of a message, risk of an action, quality of a draft.",
  },
  {
    slug: "noul",
    term: "Noul",
    aka: ["yes/no question", "boolean question"],
    oneLiner:
      "A Noul is TypeSafe's name for a yes/no question whose answer is a single probability, between 0 and 1, that the answer is yes.",
    inDepth:
      "The request holds instructions and an optional criteria object clarifying what true and false mean. The response holds one field, noul. A value near 1 is a strong yes, near 0 a strong no, and near 0.5 means the model gives both similar weight. There is no separate confidence field, because a two-outcome distribution is fully described by that one number.",
    analogy: "A gauge with one needle. Where it points is the whole answer.",
    example: "\"Is the customer asking for a human agent?\" on \"Can I please just talk to a real person?\"; TypeSafe's documented example returned 0.99.",
    agentRole: "Verification and gating: does this passage answer the question, does this command touch credentials, is this claim stated in the document.",
  },
  {
    slug: "confidence",
    term: "Confidence",
    oneLiner:
      "Confidence is a 0 to 1 statistic on Choice and Score answers that describes how concentrated the returned probability distribution is; it is not a measure of whether the answer is correct.",
    inDepth:
      "One dominant option reads near 1, an even spread reads low. TypeSafe returns the full probabilities as well, so an application can define its own measure. Its guidance is that different actions in the same system deserve different thresholds, set by the consequences of being wrong, and that the right values depend on the domain and the model's measured performance on it. Noul answers carry no confidence field.",
    analogy: "A show of hands. Unanimous tells you the room agrees; it does not tell you the room is right.",
    example: "A Choice that puts 0.71 on one team and spreads the rest reads as moderate confidence; the same team at 1.0 reads as high.",
    agentRole: "The number that decides between act automatically, proceed carefully, and send to a person, once thresholds are validated on real examples.",
  },
  {
    slug: "agent-harness",
    term: "Agent harness",
    aka: ["orchestration layer", "agent loop"],
    oneLiner:
      "An agent harness is the ordinary software around a model that retrieves context, decides what runs, enforces permissions, runs tools and records what happened.",
    inDepth:
      "In a coding agent the harness selects which files and traces the model sees, validates proposed tool calls against policy, executes permitted ones in an isolated environment, and feeds the results back as evidence for the next turn. Jev can take specific judgment points inside that loop, such as relevance scoring, model routing and risk flags; TypeSafe and LangChain both describe it as a component beside the coding model, not a replacement for it.",
    analogy: "The workshop around the mechanic: the parts desk, the permit board, the test bay and the logbook.",
    example: "LangChain's post describes a middleware that asks Jev whether a proposed tool call is risky and blocks it before execution.",
    agentRole: "Everything that is neither the decision nor the prose: retrieval, policy, execution, provenance and measurement.",
  },
  {
    slug: "structured-output",
    term: "Structured output",
    aka: ["JSON mode", "schema-constrained generation"],
    oneLiner:
      "Structured output is a generative-model feature that constrains the format of generated text to a schema; it guarantees the shape of a response, not the correctness of its values.",
    inDepth:
      "OpenAI, Anthropic and Perplexity document structured-output modes for their APIs. A generative model in that mode still produces text token by token, then conforms it to a JSON schema. Jev differs in kind: it does not generate text at all and returns probabilities over answers the application declared. Neither approach proves that the chosen value is right; a September 2026 preprint on Jev-style models reports a 0% type-error rate alongside large accuracy swings.",
    analogy: "A form that will not let you leave a box blank. It cannot tell you whether what you wrote in the box is true.",
    example: "Asking a generative model to \"return JSON with a team field\" versus asking Jev a Choice with four teams: the first constrains a sentence, the second returns a distribution.",
    agentRole: "The alternative to Jev for bounded decisions, and one of the baselines a fair pilot compares it against.",
  },
];

const jevComparison: ComparisonRow[] = [
  {
    type: "Jev",
    isA: "A specialized decision model from TypeSafe AI, accessed through an API",
    answers: "Bounded decisions for software",
    structure: "Typed answers with probabilities: Choice, Score, Noul",
    example: "Classify a query with a defined intent taxonomy",
    bestFor: "Routing, triage, relevance, verification, gating, at high volume",
    limit: "No text, code or conversation; no web access; typed does not mean correct",
  },
  {
    type: "ChatGPT",
    isA: "OpenAI's general assistant product, with the OpenAI API behind it",
    answers: "Analysis and creation in conversation",
    structure: "Generated text, optionally constrained to a JSON schema",
    example: "Explain a topic or help develop a research report",
    bestFor: "Open-ended writing, reasoning and coding help",
    limit: "Slower and costlier per decision; structured output constrains format, not truth",
  },
  {
    type: "Claude",
    isA: "Anthropic's family of generative models and assistant experiences",
    answers: "Generative models and agents",
    structure: "Generated text and code, with documented structured outputs",
    example: "Analyze evidence, draft a document, generate a patch",
    bestFor: "Agents that must read, reason and produce work",
    limit: "A different kind of offering; compare specific model versions on the same task, not brands",
  },
  {
    type: "Perplexity",
    isA: "A search-and-synthesis product with its own Sonar models and an Agent API",
    answers: "Search with sources, plus creation tools",
    structure: "Cited answers; the Agent API documents JSON-schema structured outputs",
    example: "Research a topic and inspect the cited sources",
    bestFor: "Questions that need the live web and citations",
    limit: "Retrieval is the product; it is not a decision endpoint for your own state",
  },
];

const jevFaqs: FaqItem[] = [
  {
    q: "Who makes Jev?",
    a: "Jev is developed by TypeSafe AI, which released it on 2026-09-15 and describes it as a System One model for structured, probabilistic decisions. Its founder, Diogo Almeida, wrote the launch post.",
  },
  {
    q: "Can Jev replace ChatGPT?",
    a: "No. Jev does not write, code or hold a conversation, so it is not a replacement for ChatGPT's conversational and creative functions. It can be a component in an application that also uses a generative model, for the parts of a task that mean choosing among defined answers.",
  },
  {
    q: "Does Jev search the web?",
    a: "No. The documented endpoint evaluates the state your application supplies. Your code has to do the retrieval and pass the relevant evidence in; if a fact is not in the state, Jev cannot use it.",
  },
  {
    q: "Does Jev eliminate hallucinations?",
    a: "No. Restricting the answer format prevents invalid outputs, but a permitted option can still be the wrong option for the evidence. TypeSafe documents limitations around arithmetic, dates, indirection, irrelevant context and adversarial content, and a September 2026 preprint shows large accuracy swings with a 0% type-error rate.",
  },
  {
    q: "Is Jev free?",
    a: "No. On 2026-09-24 TypeSafe's documentation priced jev-1.13.0 at $0.042 per million input tokens with free output tokens. Free output does not make the service free, and the surrounding application, retrieval and any other models have their own costs. Check TypeSafe's current pricing before estimating a workload.",
  },
  {
    q: "How fast is Jev?",
    a: "TypeSafe reports 70 ms to 500 ms end-to-end responses and 40x to 200x speedups over the frontier models it compared, measured on short, simplified demo inputs from the US West Coast, and says its headline evals figures sit at the higher end of real-world gains. Latency on your own workload is something to measure, not assume.",
  },
  {
    q: "Can I run Jev myself, or is it open weights?",
    a: "Not as of 2026-09-24: TypeSafe had released neither Jev's weights nor a technical paper on its architecture. It is available through TypeSafe's API and through gateways that list it, including OpenRouter, Vercel AI Gateway and Cloudflare's AI docs. Check each provider's current terms.",
  },
];

const jevBlocks: Block[] = [
  { kind: "h2", text: "What is Jev?", id: "what-is-jev" },
  {
    kind: "p",
    text: "**Jev is an AI model from TypeSafe AI that makes decisions using evidence and answer options supplied by an application.** It returns choices, scores and probabilities that software can use directly to classify information, route tasks and select the next step in a workflow. It does not write text, produce code or explain itself.",
  },
  {
    kind: "p",
    text: "TypeSafe calls Jev a System One model, after the fast, intuitive System 1 of Daniel Kahneman's Thinking, Fast and Slow. A developer might ask it which team should receive a support ticket, or whether a retrieved passage is relevant to a question. When the workflow then needs a reply or a code change, a generative model does that part. The two kinds of model sit side by side; Jev decides at the joints.",
  },
  {
    kind: "callout",
    title: "In one sentence",
    text: "Your application supplies evidence and a defined question. Jev returns a typed decision with probabilities. Your code decides what happens next.",
  },
  {
    kind: "p",
    text: "For someone building an AI product, the practical question is whether a particular decision has a clearly defined answer space. Routing, triage, relevance and yes/no verification do. Open-ended writing does not. Jev is a candidate for the first group, and its value depends on how accurately and cheaply it handles your actual workload, which this guide will keep coming back to.",
  },
  {
    kind: "p",
    text: "The model below walks one support ticket through the whole thing. On the left, the evidence your code supplies; in the middle, Jev stamping three typed answers; on the right, the rules gate where your own software turns answers into actions, and the generative model at the next desk doing the writing Jev never will. Press play, or click any station.",
  },
  { kind: "jev" },
  {
    kind: "callout",
    title: "How to read the model",
    text: "Size, height and distance represent responsibilities, not speed, intelligence or cost. The Score numbers on the ladder are TypeSafe's documented severity example; the Choice bars and the Noul needle show the shape of an answer and were not produced by Jev. No live request is made.",
  },

  { kind: "h2", text: "How does Jev work?", id: "how-jev-works" },
  {
    kind: "p",
    text: "An application sends Jev two essential ingredients: the evidence to evaluate, called the **state**, and **questions** that specify what to decide. The request also names the model. State can be text or structured data, such as a record represented in JSON. The response returns one answer per question, and every question in the request is evaluated against the same state, independently.",
  },
  {
    kind: "code",
    caption: "The shape of a request and response, adapted from TypeSafe's API reference. The values are illustrative.",
    code: `POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <API_KEY>

{
  "model": "jev-latest",
  "state": "The latest release prevents users from signing in.",
  "questions": {
    "login_failure": {
      "type": "noul",
      "instructions": "Does the ticket explicitly report a login failure?"
    },
    "team": {
      "type": "choice",
      "instructions": "Which team should investigate?",
      "criteria": {
        "authentication": "Sign-in, sessions, passwords",
        "platform": "Releases, infrastructure, outages",
        "billing": "Charges, invoices, refunds",
        "insufficient_evidence": "The ticket does not say"
      }
    },
    "severity": {
      "type": "score",
      "instructions": "How severe is the reported issue?",
      "criteria": ["Cosmetic", "Broken or degraded", "Blocking"]
    }
  }
}

// response (illustrative values)
{
  "model": "jev-1.13.0",
  "answers": {
    "login_failure": { "type": "noul", "noul": 0.96 },
    "team": {
      "type": "choice",
      "choice": "authentication",
      "probabilities": { "authentication": 0.71, "platform": 0.19, "insufficient_evidence": 0.07, "billing": 0.03 },
      "confidence": 0.62
    },
    "severity": {
      "type": "score",
      "score": 1.43,
      "probabilities": { "0": 0.0, "1": 0.57, "2": 0.43 },
      "legend": { "0": "Cosmetic", "1": "Broken or degraded", "2": "Blocking" },
      "confidence": 0.35
    }
  },
  "usage": { "input_tokens": 118, "output_tokens": 0 }
}`,
  },
  {
    kind: "p",
    text: "Consider the ticket that says \"The latest release prevents users from signing in.\" The application asks whether the ticket explicitly reports a login failure, which team should investigate from a list of teams with clear descriptions of their responsibilities, and how severe the issue is on a scale it defined.",
  },
  {
    kind: "p",
    text: "The application then consumes those answers and applies its own rules. A routing decision may determine which queue receives the ticket. It does not, by itself, authorize a production change; that authority lives in a permission check written in ordinary code.",
  },
  {
    kind: "p",
    text: "Jev can also support coding agents. It can contribute decisions about which context is relevant or whether a proposed action is permitted while a coding model generates the patch and ordinary tools run the checks. The surrounding software, the harness, still manages retrieval, execution and observations. TypeSafe is explicit that Jev is not a drop-in replacement for the model behind a coding agent.",
  },

  { kind: "h2", text: "What do Choice, Score and Noul return?", id: "choice-score-noul" },
  {
    kind: "p",
    text: "Jev's three question types answer different kinds of question, and each returns a different shape. The three cards below are the whole vocabulary.",
  },
  { kind: "termcard", termSlug: "choice" },
  { kind: "termcard", termSlug: "score" },
  { kind: "termcard", termSlug: "noul" },
  {
    kind: "p",
    text: "A Score needs a defined scale. With levels numbered 0, 1 and 2, a score of 1.43 is a weighted position on that scale. It is not automatically a percentage, and it is not the probability of being correct. Choice and Score also carry a confidence value derived from their probability distribution; a Noul does not, because its single probability already describes both outcomes.",
  },
  { kind: "termcard", termSlug: "confidence" },
  {
    kind: "p",
    text: "A confident answer can still be wrong. Useful thresholds for \"act automatically\", \"proceed carefully\" and \"send to a person\" have to be validated on examples from the intended task, and TypeSafe's own guidance is that different actions in the same system deserve different thresholds, set by the consequences of getting each one wrong.",
  },

  { kind: "h2", text: "The journey, step by step", id: "journey" },
  {
    kind: "p",
    text: `The same ${JEV_COUNTS.journeySteps} steps the model plays, as text. The first ${JEV_COUNTS.act1} stations are the decision bench; the last ${JEV_COUNTS.act2} are inside an agent harness, where the same three primitives take on retrieval, gating and measurement jobs.`,
  },
  { kind: "jevjourney" },
  { kind: "h3", text: "Every station on the bench", id: "stations" },
  { kind: "jevstations" },

  { kind: "h2", text: "How is Jev different from ChatGPT, Claude and Perplexity?", id: "compared" },
  {
    kind: "p",
    text: "The comparison involves different kinds of offering. Jev is a specialized model accessed through an API. ChatGPT and Perplexity are assistant products, while Claude refers both to Anthropic's models and to an assistant ecosystem. Putting them in one table is fair only if the table says what each one is for.",
  },
  { kind: "comparison" },
  {
    kind: "p",
    text: "The distinction is not simply \"Jev returns JSON and the others return text.\" The OpenAI, Anthropic and Perplexity APIs all document structured-output modes. Those features constrain the format of a response; they do not prove that the values in it are correct, and neither does a typed answer from Jev.",
  },
  { kind: "termcard", termSlug: "structured-output" },
  {
    kind: "p",
    text: "For a fair developer comparison, choose specific model versions, give them equivalent evidence and output requirements, and measure the completed task. Comparing Jev's token price with the price of a ChatGPT or Perplexity subscription compares different service bundles and tells you nothing.",
  },

  { kind: "h2", text: "An SEO example: labeling keyword intent", id: "seo-example" },
  {
    kind: "p",
    text: "Suppose an SEO team has thousands of search queries and wants consistent intent labels before deciding which pages to create or improve. The team can define the labels, write a rubric, and evaluate Jev as one classification option among several. The examples below are an illustrative human labeling scheme, not recorded Jev predictions.",
  },
  {
    kind: "list",
    items: [
      "\"how does fiber internet work\" → **Informational**: asks for an explanation.",
      "\"fiber vs cable for gaming\" → **Commercial investigation**: compares alternatives for a use case.",
      "\"buy prepaid SIM card\" → **Transactional**: expresses an intention to purchase.",
      "\"provider account login\" → **Navigational**: looks for a particular destination.",
      "\"apple\" → **Unclear**: the query alone does not establish the intended subject.",
    ],
  },
  {
    kind: "callout",
    title: "Leave room for ambiguity",
    text: "An answer set should have a place for genuine uncertainty. Forcing every query into a commercial category turns \"we do not know\" into a confident-looking content recommendation, and a Choice will happily put its probability mass wherever the options allow.",
  },
  {
    kind: "p",
    text: "A useful pilot compares Jev with the existing rules, an appropriately small classifier, and a structured-output language model. Reviewers label a separate test set, resolve disagreements, and check which categories each system confuses. Inspect the ambiguous cases, not just an overall accuracy score; that is where the systems differ and where the content decisions go wrong.",
  },
  {
    kind: "p",
    text: "Query classification is only one possible application. A similar approach could assess whether retrieved passages address a question, or route an SEO request to an existing workflow. Those are proposed uses. Better classification must be demonstrated, and a higher Google ranking does not follow automatically from adopting any particular AI model.",
  },

  { kind: "h2", text: "What does Jev cost, and what are its context limits?", id: "pricing" },
  {
    kind: "p",
    text: `On ${JEV_FACTS.checked}, TypeSafe's documentation listed Jev 1.13 as \`${JEV_FACTS.modelId}\`, priced at **$${JEV_FACTS.inputPerMtok} per million input tokens** with **free output tokens**. It documents text input only, including JSON structures, and no native image, audio or video input.`,
  },
  {
    kind: "list",
    items: [
      `State plus all questions must fit within ${JEV_FACTS.contextTotal.toLocaleString("en-US")} tokens.`,
      `State plus the single longest question must fit within ${JEV_FACTS.contextLongest.toLocaleString("en-US")} tokens.`,
      "Both conditions apply at once, which matters when one request carries several questions with long rubrics.",
    ],
  },
  {
    kind: "p",
    text: "As an illustration, 100,000 calls with 1,000 billed input tokens each would use 100 million input tokens and cost $4.20 at that rate. A real estimate must include the question and rubric tokens, retries, retrieval, any other models, and the surrounding application. This calculation is not a measured production cost.",
  },

  { kind: "h2", text: "What are Jev's limitations, and what evidence should you check?", id: "limitations" },
  {
    kind: "p",
    text: "A response can follow the correct format and still select the wrong answer. TypeSafe's own limitations page for Jev 1.13 documents literal reading (it answers the question you wrote, not the one you meant), unreliable arithmetic and counting, dates read as text rather than ordered quantities, trouble with double negatives and indirection, accuracy that falls as irrelevant state grows, no default suspicion of adversarial content, and confusion when instructions contradict the criteria. Keep exact calculations and permission checks in ordinary code.",
  },
  {
    kind: "p",
    text: "TypeSafe reports 70 ms to 500 ms end-to-end responses and speed advantages of 40x to 200x on selected decision workloads, with headline evals figures of 193.6x faster and 444.6x cheaper. Its launch post also states the conditions: short, simplified demo inputs chosen to emphasize the difference in sampling, measurements taken from laptops on the US West Coast where the service is hosted, and comparison models run through TypeSafe's own wrapper, which constrains them to emit structured decisions compatible with its API. TypeSafe itself says the headline evals figures sit at the higher end of real-world gains.",
  },
  {
    kind: "p",
    text: "The vendor's workflow evals use consensus reference labels averaged from two frontier models rather than independently adjudicated human answers, and they assume the surrounding workflow code is correct. Agreement with that reference is useful evidence about the tested setup; it is not a general correctness guarantee.",
  },
  {
    kind: "p",
    text: "Early independent research gives reasons to investigate both the benefits and the failure modes. A September 2026 preprint by Sun and Xu reports that renaming two options from 0/1 to no/yes, with the question, state and rubrics unchanged, changed 70.4 answers per hundred on their open-weights setup and moved AUC from .94 to .23, while the type-error rate stayed at 0%; on the hosted model the same swap moved AUC from .81 to .58. A second preprint by Rafe and Das coded 195,857 Texas crash narratives with a 27-question schema, audited the probabilities against 2,416 blinded human judgments, reports an F1 of 0.908 against human labels, and finds that calibration varies by model and must be audited; recalibrating on labeled data cut calibration error by a factor of 3.3. These are reported findings, not experiments reproduced for this guide.",
  },
  {
    kind: "details",
    summary: "Documented, proposed, or still needs evidence",
    blocks: [
      {
        kind: "list",
        items: [
          "**Documented by TypeSafe:** Jev returns Choice, Score and Noul decisions rather than text or code; input-only pricing; the 64k and 32k context conditions; the Jev 1.13 limitations list.",
          "**Proposed architecture, needs a harness to exist:** per-chunk context visibility, conditional instructions, shared retrieval and cache-aware model routing inside coding agents (TypeSafe cookbooks, LangChain).",
          "**Unsupported:** typed outputs guarantee correct decisions. Format validity and decision accuracy are separate properties.",
          "**Vendor-reported, conditions stated:** the 40x to 200x speed and 193.6x / 444.6x evals figures. Useful about that setup; not a measurement of yours.",
          "**Needs an end-to-end comparison on your tasks:** that a Jev-assisted workflow is cheaper, faster or more accurate than your current one. This guide reports no such experiment.",
        ],
      },
    ],
  },

  { kind: "h2", text: "When is Jev worth evaluating?", id: "when" },
  {
    kind: "decision",
    items: [
      { when: "A recurring task has a bounded answer space, useful evidence is available, and the application can handle uncertainty", use: "Evaluate Jev. \"Which of these approved workflows fits this request?\" is a natural candidate." },
      { when: "You need open-ended writing, code generation, or an unfamiliar problem investigated", use: "Start with a generative assistant or coding agent. Add Jev only where a decision inside that work is bounded." },
      { when: "A fragile prompt asks a generative model to \"return JSON\" for a classification", use: "Compare Jev, a small classifier and the structured-output mode on the same labeled test set." },
      { when: "The decision involves exact arithmetic, date comparison or a permission", use: "Ordinary code. Jev's own documentation says so." },
    ],
  },
  {
    kind: "p",
    text: "A system can use both kinds of model, but the additional component should earn its place through measured results. Before adoption, evaluate decision quality, total cost per successful task, response-time variability, and the number of cases that still need human review. Record model versions and repeat the relevant checks whenever the model, the rubric or the input distribution changes.",
  },

  { kind: "h2", text: "Frequently asked questions", id: "faq" },
  { kind: "faq" },

  {
    kind: "related",
    items: [
      { label: "How LLMs Work: the generative model at the next desk, as a 3D machine", href: "/guides/how-llms-work" },
      { label: "AI agents, in the encyclopedia", href: "/notebook/ai/encyclopedia/ai-agents" },
      { label: "Agent harness, in the encyclopedia", href: "/notebook/ai/encyclopedia/agent-harness" },
      { label: "Tool use, in the encyclopedia", href: "/notebook/ai/encyclopedia/tool-use" },
      { label: "Hallucination, in the encyclopedia", href: "/notebook/ai/encyclopedia/hallucination" },
      { label: "AI Agent Statistics, updated monthly", href: "/notebook/ai/agents" },
    ],
  },
  {
    kind: "sources",
    items: [
      { label: "TypeSafe AI: API reference", href: "https://docs.typesafe.ai/api", note: "Endpoint, request and response shapes. Checked 2026-09-24." },
      { label: "TypeSafe AI: Models", href: "https://docs.typesafe.ai/models", note: "jev-1.13.0, $0.042 per million input tokens, free output, 64k and 32k context conditions, text-only input. Checked 2026-09-24." },
      { label: "TypeSafe AI: Choice", href: "https://docs.typesafe.ai/primitives/choice", note: "Option map in, choice plus probabilities plus confidence out." },
      { label: "TypeSafe AI: Score", href: "https://docs.typesafe.ai/primitives/score", note: "Ordered levels, probability-weighted score, the 1.43 severity example." },
      { label: "TypeSafe AI: Noul", href: "https://docs.typesafe.ai/primitives/noul", note: "Probability of yes; no separate confidence field." },
      { label: "TypeSafe AI: Confidence", href: "https://docs.typesafe.ai/confidence", note: "Derived from the distribution; thresholds depend on consequences and domain." },
      { label: "TypeSafe AI: System One", href: "https://docs.typesafe.ai/concepts/system-one", note: "The definition and the Kahneman reference." },
      { label: "TypeSafe AI: Jev 1.13 jaggedness", href: "https://docs.typesafe.ai/model-jaggedness/jev-1.13", note: "Documented limitations, last reviewed 2026-09-17 per the page." },
      { label: "TypeSafe AI: Jev with coding agents", href: "https://docs.typesafe.ai/introduction/coding-agents", note: "Not a drop-in replacement for a coding model; where it fits instead." },
      { label: "TypeSafe AI: Function calling cookbook", href: "https://docs.typesafe.ai/cookbooks/function_calling", note: "Bounded tool selection and closed-set arguments." },
      { label: "TypeSafe AI: Introducing System One models and Jev", href: "https://typesafe.ai/blog/introducing-system-one-models-and-jev", note: "Launch post, 2026-09-15, Diogo Almeida. Speed and cost claims with their stated conditions." },
      { label: "TypeSafe AI: Workflow evals", href: "https://evals.typesafe.ai/", note: "The 193.6x and 444.6x figures and the consensus reference-label method." },
      { label: "Sun and Xu, Type-Safe Is Not Error-Free (arXiv 2609.26758)", href: "https://arxiv.org/abs/2609.26758", note: "Option-name sensitivity; 0% type errors alongside large accuracy swings. Preprint." },
      { label: "Rafe and Das, Calibrated Decisions at Scale (arXiv 2609.24052)", href: "https://arxiv.org/abs/2609.24052", note: "Crash narratives coded with Jev, audited against 2,416 blinded human judgments. Preprint." },
      { label: "Vercel: What is Jev", href: "https://vercel.com/i/what-is-jev", note: "Introductory explainer; Jev on Vercel AI Gateway." },
      { label: "Vercel KB: classify, route and score with Jev and AI SDK", href: "https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk", note: "Integration guidance." },
      { label: "LangChain: Building a harness with Jev", href: "https://www.langchain.com/blog/building-a-harness-with-jev", note: "Routing, relevance and tool-risk gating inside an agent harness, 2026-09-17." },
      { label: "OpenRouter: Jev 1.13", href: "https://openrouter.ai/typesafe/jev-1.13", note: "Gateway listing and pricing." },
      { label: "Cloudflare AI docs: Jev", href: "https://developers.cloudflare.com/ai/models/typesafe/jev/", note: "Gateway listing." },
      { label: "OpenAI: Structured outputs", href: "https://platform.openai.com/docs/guides/structured-outputs", note: "Schema-constrained generation on the OpenAI API." },
      { label: "Anthropic: Structured outputs", href: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs", note: "Schema-constrained generation on the Claude API." },
      { label: "Anthropic: Intro to Claude", href: "https://platform.claude.com/docs/en/intro", note: "What Claude refers to: models and the developer platform." },
      { label: "Perplexity: Structured outputs", href: "https://docs.perplexity.ai/guides/structured-outputs", note: "JSON-schema output control on the Perplexity API." },
    ],
  },
];

export const jevGuide: Guide = {
  slug: "what-is-jev",
  title: "What is Jev",
  metaTitle: "What Is Jev? TypeSafe AI's Decision Model, Explained in 3D",
  metaDescription:
    "Learn what Jev is, how TypeSafe AI's decision model works, its pricing and limits, and how it compares with ChatGPT, Claude, and Perplexity.",
  headline: "What is Jev? TypeSafe AI's Decision Model, Explained",
  kicker: "Interactive Explainer",
  subhead:
    "A support ticket walks through a 3D decision bench: your code supplies the evidence and the questions, Jev stamps three typed answers with probabilities, and your rules decide what happens next. Then the same model inside a coding agent, and the evidence to check before you believe any of it.",
  deck: `Jev, released by TypeSafe AI on ${JEV_FACTS.released}, decides instead of writing. ${JEV_COUNTS.stations} stations across ${JEV_COUNTS.kinds} kinds of responsibility, a ${JEV_COUNTS.journeySteps}-step guided journey from a ticket to a routed queue and on into an agent harness, the three answer shapes (Choice, Score, Noul) as working instruments, pricing and context limits from the vendor's own pages, and two independent preprints on where it fails. Sources checked ${JEV_FACTS.checked}.`,
  author: {
    name: "Venkata Pagadala",
    title: "AI Product Manager (Search · SEO · GEO)",
    org: "AT&T",
    url: "/about",
    bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the How LLMs Work and How Neural Networks Work 3D explainers on this site.",
  },
  image: {
    src: "/posters/what-is-jev-og.jpg",
    width: 1200,
    height: 630,
    alt: "Conceptual Jev workflow as a 3D bench: supplied evidence, the Jev model stamping typed answers, the application's rules gate, and the generative model at the next desk.",
  },
  datePublished: "2026-09-24",
  dateModified: "2026-09-24",
  readingTime: "17 min read",
  tags: ["Jev", "TypeSafe AI", "System One model", "AI Agents", "Classification", "Structured Outputs", "3D Interactive", "AI Explainer"],
  terms: jevTerms,
  comparison: jevComparison,
  faqs: jevFaqs,
  blocks: jevBlocks,
  termRoleLabel: "Where it sits in an application",
  comparisonHeaders: ["Offering", "What it is", "Primary role", "Output", "Example job", "Best for", "Limit"],
  howTos: [
    {
      name: "How to evaluate Jev for a classification task",
      description: "A pilot that produces evidence instead of a demo: the same labeled test set, several candidate systems, and the numbers that decide.",
      steps: [
        { name: "Define the answer space", text: "Write the labels and a rubric for each, and include an explicit option for genuine ambiguity such as \"unclear\" or \"insufficient evidence\"." },
        { name: "Label a held-out test set", text: "Have reviewers label a separate sample, resolve disagreements, and keep it out of any prompt or rubric tuning." },
        { name: "Run every candidate on the same inputs", text: "Jev, your existing rules, an appropriately small classifier, and a structured-output generative model, with equivalent evidence and output requirements and pinned model versions." },
        { name: "Inspect the confusions", text: "Compare which categories each system confuses and read the ambiguous cases, not just an overall accuracy score." },
        { name: "Measure the whole task", text: "Cost per successful task including rubric tokens, retries and retrieval; median and tail latency; the share of cases that still need a person." },
        { name: "Set thresholds by consequence", text: "Choose confidence or probability thresholds per action from the test set, based on what a wrong automatic decision costs." },
        { name: "Record and repeat", text: "Record model versions and the input distribution, and rerun the checks whenever the model, the rubric or the inputs change." },
      ],
    },
  ],
};
