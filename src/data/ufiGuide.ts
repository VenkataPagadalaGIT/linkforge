/**
 * ufiGuide.ts: Guide record for "User-First Intelligence", the framework's
 * public reference page (/guides/user-first-intelligence).
 *
 * What this page is for. It is the canonical, citable definition of the
 * framework Venkata Pagadala created: the page press, publishers, readers and
 * AI answer engines are pointed to. It states the framework in full (five
 * steps, one map, one rule, a loop; eight principles; a seven-step method)
 * and shows it working on public data. It deliberately leaves out what the
 * forthcoming paper and book will publish first: the paper's measurements,
 * the case data behind them, the scoring formula's internals and the
 * book's chapter playbooks.
 *
 * Evidence stance. Every external figure carries a link to its source, read
 * on 2026-10-23. Figures about this site's own data (the LinkedIn graph, the
 * Pew platform table, the persona library) are computed by
 * scripts/gen-ufi-example.ts into ufiExample.ts, never typed here.
 * Predictions are labeled as predictions.
 *
 * Name. "User-First Intelligence", hyphenated like Google's "mobile-first"
 * and "people-first", is the canonical form; "User First Intelligence" and
 * "UFI" are listed as alternate names so either spelling resolves here.
 */

import type { Block, ComparisonRow, DefinedTerm, FaqItem, Guide } from "./guides";
import { UFI_LINKEDIN, UFI_PERSONAS, UFI_PEW_AGE } from "./ufiExample";

export const UFI_GUIDE_URL = "https://venkatapagadala.com/guides/user-first-intelligence";
export const UFI_VERSION = "1.0";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthYear = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const longDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const joinAnd = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/* ── Sources, defined once and linked from the text ── */

const SRC = {
  pewAiSummary:
    "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/",
  pewTeens: "https://www.pewresearch.org/internet/fact-sheet/teens-and-social-media-fact-sheet/",
  comscore: "https://www.comscore.com/Insights/Press-Releases/2010/8/Facebook-Captures-Top-Spot-among-Social-Networking-Sites-in-India",
  techcrunch:
    "https://techcrunch.com/2022/07/12/google-exec-suggests-instagram-and-tiktok-are-eating-into-googles-core-products-search-and-maps/",
  googleAiMode: "https://blog.google/products/search/google-search-ai-mode-update/",
  googleKg: "https://blog.google/products/search/introducing-knowledge-graph-things-not/",
  peopleFirst: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  hannak: "https://doi.org/10.1145/2488388.2488435",
  eloundou: "https://proceedings.iclr.cc/paper_files/paper/2025/hash/92af0c8c2664429de2bb44c2692d84ae-Abstract-Conference.html",
  lewis: "https://arxiv.org/abs/2005.11401",
  edge: "https://arxiv.org/abs/2404.16130",
  broder: "https://doi.org/10.1145/792550.792552",
  morris: "https://doi.org/10.1145/1753326.1753587",
  netzer: "https://doi.org/10.1287/mksc.1120.0713",
  ringel: "https://doi.org/10.1287/mksc.2015.0950",
  timoshenko: "https://doi.org/10.1287/mksc.2018.1123",
  ren: "https://doi.org/10.1007/978-3-319-07443-6_50",
  aggarwal: "https://doi.org/10.1145/3637528.3671900",
  previsible: "https://previsible.com/brightonseo/demand-research-beyond-keywords/",
  slides: "https://speakerdeck.com/venkatapagadala1/industrial-context-graphs",
  repo: "https://github.com/VenkataPagadalaGIT/ufi",
};

const POST = (slug: string) => `/venkata-pagadala-universe/linkedin/posts/${slug}`;

/* ── Figures from this site's own data (generated) ── */

const L = UFI_LINKEDIN;
const P = UFI_PERSONAS;
const PEW = UFI_PEW_AGE;
const pewRow = (id: string) => PEW.rows.find((r) => r.id === id)!;
const tiktok = pewRow("tiktok");
const snapchat = pewRow("snapchat");

const top = L.rows[0];
const sizable = L.rows.filter((r) => r.posts >= 10 && r.id !== top.id);
const stronger = sizable.filter((r) => r.medianReactions > L.medianReactions).map((r) => r.label);
const small = L.rows.filter((r) => r.posts < 10).map((r) => r.label);
const linkedinReading =
  top.medianReactions < L.medianReactions
    ? `${top.label} is what I publish most (${top.posts} posts), yet its median post drew ${top.medianReactions} reactions, fewer than my median post overall (${L.medianReactions}). ${joinAnd(stronger)} each drew more per post.`
    : `${top.label} is what I publish most (${top.posts} posts), and its median post drew ${top.medianReactions} reactions against ${L.medianReactions} for my median post overall.`;

/* ── Glossary: the framework's terms, in the order the page uses them ── */

const ufiTerms: DefinedTerm[] = [
  {
    slug: "user-first-intelligence",
    term: "User-First Intelligence (UFI)",
    aka: ["User First Intelligence", "UFI", "user-first intelligence framework"],
    oneLiner:
      "User-First Intelligence (UFI) is a framework for understanding demand from the person outward: who people are, where they spend time and ask for help, what they need in their own words, and how that maps to an industry, so a business decides what to build, publish or fix for each audience.",
    inDepth:
      "UFI joins five steps (users, personas, platforms, content, business) to one industry map (an ontology and a knowledge graph) under one rule (AI agents gather and classify; people decide), and repeats as a loop. It treats search engines as one demand source among many, keeps every piece of evidence tied to its source, and judges success by outcomes rather than rankings alone. Venkata Pagadala created and named it in 2026.",
    analogy: "A census of your customers' questions, taken everywhere they actually ask them, filed in one atlas of your industry.",
    example:
      "A roofing company (a hypothetical example) finds homeowners asking about storm-damage insurance claims in local Facebook groups and on Reddit long before they search, and publishes a claims checklist and a short video where those owners spend time.",
    agentRole: "The umbrella. Every other term on this page is one of its parts.",
  },
  {
    slug: "demand-surface",
    term: "Demand surface",
    aka: ["demand source"],
    oneLiner:
      "A demand surface is any place where people state a need in their own words: a search box, an AI assistant, a forum thread, a video comment, a review, a support ticket or a post in a group.",
    inDepth:
      "Each surface shows a different slice of the same need. A keyword tool shows the part that reaches a search box in a countable phrasing; communities show the context and the trade-offs people cannot resolve; reviews show what happened after the purchase. UFI keeps the surface and the collection date on every record.",
    analogy: "Different windows into the same room.",
    example: "The twenty demand sources in five groups, listed in the section on where people ask.",
    agentRole: "Step 3, platforms, collects from them.",
  },
  {
    slug: "evidence-graded-persona",
    term: "Evidence-graded persona",
    aka: ["graded persona"],
    oneLiner:
      "An evidence-graded persona is an audience segment whose every trait is labeled measured, derived or inferred, so a reader can see which parts come from data and which are assumptions to test.",
    inDepth:
      "Personas fail when invented detail is stated with the same confidence as a measured fact. Measured means a study reports the trait for this population; derived means real data from a wider population; inferred means no source yet. Identity never determines behavior: age, place and background are priors to check against what people do.",
    analogy: "A dossier with a confidence mark beside every line.",
    example: "[The 3-row SUV dad](/personas/us-dad-30-49-three-row-suv) on this site, built from three named studies and graded trait by trait.",
    agentRole: "Step 2, personas.",
  },
  {
    slug: "attention-map",
    term: "Attention map",
    oneLiner:
      "An attention map shows, for each persona, the platforms where it spends time, where it asks questions and where it trusts the answers, with the evidence for each link.",
    inDepth:
      "Reach is not trust. A platform can reach an audience without being where it decides, so UFI records three relations per persona and platform (uses, asks, trusts) and watches how they change, because audiences move.",
    analogy: "A map of the rooms a person walks through on the way to a decision.",
    example: `Among U.S. adults aged 18 to 29, ${tiktok.byAge[0]}% say they ever use TikTok and ${snapchat.byAge[0]}% Snapchat, against ${tiktok.byAge[3]}% and ${snapchat.byAge[3]}% of those 65 and older (Pew Research Center, 2025).`,
    agentRole: "Step 3, platforms.",
  },
  {
    slug: "industry-ontology",
    term: "Industry ontology",
    oneLiner:
      "An industry ontology is a designed map of an industry: the kinds of things in it, the relations between them and the specific things in each kind, from broad category to specific need.",
    inDepth:
      "UFI designs the map before it collects the data, top down from category to need, with modifiers that cut across every branch: location, price, urgency, comparison. The competency questions, the questions the map must be able to answer, are written first, so the map serves the decisions rather than whatever data arrived first.",
    analogy: "The shelving plan of a library, drawn before the books arrive.",
    example: "Roofing, then residential, then repair, then storm damage, then hail damage, then an insurance claim, with location and urgency as modifiers.",
    agentRole: "The one map, its schema.",
  },
  {
    slug: "industrial-context-graph",
    term: "Industrial context graph",
    aka: ["industry knowledge graph"],
    oneLiner:
      "An industrial context graph is a knowledge graph of an industry and its adjacent markets that links entities to the personas, problems, platforms, places, products and competitors around them, with the source of every link.",
    inDepth:
      "Covering the adjacent markets means a rival arriving from next door appears on the same map as the incumbents. Every statement carries its source, its role and the date it was retrieved, so a conclusion can always be traced back to the evidence that supports it.",
    analogy: "An atlas that shows the neighboring countries, not only your own.",
    example: "Home internet linked to wireless carriers, satellite providers and municipal fiber, because all of them answer the same household's need.",
    agentRole: "The one map, its contents.",
  },
  {
    slug: "source-role",
    term: "Source role",
    oneLiner:
      "A source role says what a piece of evidence can prove: structure (what exists), coverage (who answers), answerability (whether the best answer is good enough) or demand (who asks).",
    inDepth:
      "Each source has exactly one role, and conclusions are drawn only from the role that can support them. The rule that coverage never counts as demand prevents the most common error in content research: copying what competitors publish and calling it what people want.",
    analogy: "Witnesses who may testify only about what they saw.",
    example: "A competitor's three hundred location pages are coverage. Forum threads asking which provider serves a street are demand.",
    agentRole: "Keeps the map honest.",
  },
  {
    slug: "query-discovery",
    term: "Query discovery",
    oneLiner:
      "Query discovery is finding the questions people ask about an industry's entities, on any surface and in their own words, before deciding which of them to answer.",
    inDepth:
      "It is the framework's first task. A content gap is one outcome of discovery, not its purpose: discovery also surfaces product problems, service failures and new markets that no keyword list would show.",
    analogy: "Listening to the whole room before deciding who to answer.",
    example: "Store reviews that complain about long waits point to a booking feature before they point to a blog post.",
    agentRole: "Steps 3 and 4.",
  },
  {
    slug: "content-gap",
    term: "Content gap",
    aka: ["Content Gap Score"],
    oneLiner:
      "A content gap is a need that people express, that the industry map can locate, and that an organization does not answer well enough on the surfaces where those people look.",
    inDepth: `UFI ranks gaps by how much a need matters (its place in the map and the demand linked to it), whether the organization covers it, how well competitors cover it, and how well the best available answer serves it. The open reference implementation of the Content Gap Score is published on [GitHub](${SRC.repo}).`,
    analogy: "The empty shelf where customers keep asking for a book.",
    example: "Many owners ask which trim of a three-row SUV fits two car seats and a third row of adults, and no dealer, maker or reviewer page answers it plainly.",
    agentRole: "Step 4, content, and the input to step 5.",
  },
  {
    slug: "answer-surface",
    term: "Answer surface",
    oneLiner:
      "An answer surface is where a person receives an answer: a results page, an AI Overview, a chat assistant, a video, a marketplace listing or a store page.",
    inDepth:
      "AI answer engines retrieve and cite different kinds of sources, so the same need can be won on one surface and lost on another. UFI measures presence surface by surface instead of assuming one ranking stands for all.",
    analogy: "The different counters where a customer can be served.",
    example: "A brand cited in Google's AI Overviews for a need can be absent from a chat assistant's answer to the same question.",
    agentRole: "Steps 4 and 5.",
  },
  {
    slug: "audience-migration",
    term: "Audience migration",
    oneLiner:
      "Audience migration is a lasting shift in where a group spends time, asks questions or trusts answers, from one platform or channel to another.",
    inDepth:
      "Snapshots hide it and series reveal it. UFI tracks persona and platform links over time and watches early signals: new terms, rising mentions, entrants from below and convergence from adjacent markets.",
    analogy: "A river that changes course one season at a time.",
    example: "In India, Facebook passed Orkut in monthly visitors in July 2010; among U.S. teens, Facebook use fell from 71% in 2014-15 to about three in ten by 2025.",
    agentRole: "The loop.",
  },
  {
    slug: "format-platform-fit",
    term: "Format-platform fit",
    oneLiner:
      "Format-platform fit is the match between a need, the platform where a person meets it and the form of answer that helps them act there.",
    inDepth:
      "Text is not the answer everywhere. A setup problem may need a short demonstration, a comparison a clear table, a local visit an accurate booking page. UFI chooses the format from the persona, the platform and the task, then checks whether people finished the task.",
    analogy: "Serving soup in a bowl and bread on a plate.",
    example: "A forty-second video for how to fold the third row, and a comparison table for which trim to buy.",
    agentRole: "Step 4, content.",
  },
];

/* ── How UFI compares with the approaches readers already know ── */

const ufiComparison: ComparisonRow[] = [
  {
    type: "Keyword research",
    isA: "The search box",
    answers: "Keyword volumes, rankings, SERP features",
    structure: "Keyword",
    example: "A keyword list and a content calendar",
    bestFor: "Sizing search demand; SEO",
    limit: "Needs that never reach a search box in a countable phrasing; estimates differ by tool",
  },
  {
    type: "Audience research",
    isA: "An audience's online footprint",
    answers: "Follows, mentions, sites and channels used",
    structure: "Audience segment",
    example: "Where an audience pays attention",
    bestFor: "Media planning and outreach",
    limit: "What the audience needs and asks, placed on a map of the industry",
  },
  {
    type: "Classic personas",
    isA: "Workshops and interviews",
    answers: "Qualitative research",
    structure: "Archetype",
    example: "Persona documents",
    bestFor: "Shared empathy inside a team",
    limit: "Invented detail stated as fact; rarely updated",
  },
  {
    type: "Jobs to be done",
    isA: "The job a customer hires a product to do",
    answers: "Customer interviews",
    structure: "Job",
    example: "Job statements and desired outcomes",
    bestFor: "Product strategy",
    limit: "Scale, and where people express the job across platforms",
  },
  {
    type: "Search everywhere optimization",
    isA: "Search on every platform",
    answers: "Queries and visibility on Google, YouTube, TikTok, Amazon and others",
    structure: "Platform and query",
    example: "A visibility plan per platform",
    bestFor: "Distribution across platforms",
    limit: "Platform reports stay in silos without one industry map that decides which needs matter",
  },
  {
    type: "User-First Intelligence",
    isA: "People, then the platforms they use",
    answers: "Twenty demand sources in five groups, plus the answer surfaces",
    structure: "A need on the industry map, for a persona, on a platform",
    example: "What to build, publish or fix, in which format and where, with the evidence attached",
    bestFor: "Strategy across search, AI answers, social, product and service",
    limit: "Needs a designed map and disciplined evidence handling; slower to start than a keyword list",
  },
];

/* ── Questions people ask about the framework ── */

const ufiFaqs: FaqItem[] = [
  {
    q: "What is User-First Intelligence?",
    a: "User-First Intelligence (UFI) is a framework, created by Venkata Pagadala, for understanding demand from people outward: who they are, where they spend time and ask for help, what they need in their own words, and how that maps to an industry, so a business decides what to build, publish or fix for each audience.",
  },
  {
    q: "Who created User-First Intelligence?",
    a: "Venkata Pagadala, a search and AI product leader and researcher. It grew out of his User-First Optimization posts in 2024 and 2025 and his brightonSEO San Diego 2026 talk, with the line \"user first, algorithm second\", and he named and specified it as User-First Intelligence in October 2026.",
  },
  {
    q: "Is User-First Intelligence the same as SEO?",
    a: "No. SEO makes pages easy for search engines to find and show. UFI decides which needs matter, for whom and where, before any optimization. SEO, GEO and AEO are among its outputs, and it also produces decisions about video, communities, products and service.",
  },
  {
    q: "Does zero search volume mean zero demand?",
    a: "No. Search volume is a tool's estimate for one phrasing, one market and one period. People often express the same need in communities, reviews, videos and AI assistants before, or instead of, typing a countable query. Zero volume is a reason to look elsewhere, not a verdict.",
  },
  {
    q: "What data does User-First Intelligence use?",
    a: "Twenty demand sources in five groups (search and language, social conversations, customer experience, market context and expert knowledge), plus the answer surfaces where people receive answers. It works from public, licensed and consented data, in aggregate, and keeps the source, role and date of every record.",
  },
  {
    q: "Do I need a knowledge graph to start?",
    a: "No. Start with a one-page map: your industry's main categories, the needs under each and the personas who hold them. A graph pays off when sources, markets and competitors multiply and you need to connect them.",
  },
  {
    q: "How does User-First Intelligence handle AI search?",
    a: "AI assistants are both a demand surface and an answer surface. UFI maps the sub-questions an engine fans a question out into, measures presence and citations engine by engine, and treats vendor figures for AI prompt volume as models to check, not counts.",
  },
  {
    q: "How do you target an audience when search and AI results are personalized?",
    a: "Target the unit that personalization does not change: a need, held by a persona, on a platform. Be present and trusted in the sources each engine reads for that persona, and measure outcomes instead of one tracked position that no customer sees.",
  },
  {
    q: "Will personal AI agents make demand research obsolete?",
    a: "No. Agents will ask on behalf of people, in patterns their principals set, and those needs and constraints repeat across a persona. Knowing the patterns, and publishing offers an agent can verify, becomes more valuable, not less.",
  },
  {
    q: "Can a small business use User-First Intelligence?",
    a: "Yes. Pick three personas, five sources and a one-page map, run the seven steps in a week, and act on the top three gaps. The method scales down; only the tooling grows.",
  },
  {
    q: "Is User-First Intelligence ethical?",
    a: "It is designed to be: public, licensed and consented data only, in aggregate; private conversations are never a listening feed; personas are graded by evidence; and identity is never used to decide what a person is offered or denied.",
  },
  {
    q: "How do I cite User-First Intelligence?",
    a: `Pagadala, V. (2026). User-First Intelligence (UFI): A framework for understanding people before algorithms (Version ${UFI_VERSION}). venkatapagadala.com. ${UFI_GUIDE_URL}`,
  },
];

/* ── The method, as steps (also emitted as HowTo JSON-LD) ── */

const METHOD = [
  {
    name: "Frame the decision and write the questions first",
    text: "Decide what the study must inform (a content plan, a product, a market entry) and write the competency questions the map must answer before collecting any data.",
  },
  {
    name: "Define the personas and grade the evidence",
    text: "Record each persona's situation, tasks, constraints and channel habits, and mark every trait measured, derived or inferred.",
  },
  {
    name: "Map platforms and attention",
    text: "For each persona, note where it spends time, where it asks and where it trusts answers. Use survey data as the prior and your own analytics as the check.",
  },
  {
    name: "Collect demand in people's own words",
    text: "Pull questions, posts, comments, reviews and queries from the platforms on the attention map, keeping each record's source, role and date. Keep competitors' coverage apart from demand.",
  },
  {
    name: "Classify everything onto one industry map",
    text: "Place each record by entity, need, intent, persona and journey stage. Let AI agents do the first pass, check a gold sample by hand and fix the map where it fails.",
  },
  {
    name: "Compare demand, supply and competitors to find the gaps",
    text: "For every node, compare the need with your coverage, your competitors' coverage and the quality of the best available answer, surface by surface, and rank the gaps by value and effort.",
  },
  {
    name: "Decide, ship, measure and refresh",
    text: "Choose what to build, publish or fix, in which format and on which platform. Measure completed tasks and business outcomes, re-run the collection on a schedule and watch where people move.",
  },
];

/* ── The page ── */

const ufiBlocks: Block[] = [
  { kind: "h2", id: "what-is-ufi", text: "What is User-First Intelligence?", toc: "What is User-First Intelligence?" },
  {
    kind: "p",
    text: "**User-First Intelligence (UFI)** is a framework for understanding demand from the person outward. It starts with who people are, follows them to the platforms where they spend time and ask for help, collects what they need in their own words, and places all of it on one map of an industry, so a business can decide what to build, publish or fix for each audience, in the format and on the platform that audience prefers.",
  },
  {
    kind: "p",
    text: "In one line: **Users → Personas → Platforms → Content → Business.** AI agents gather and classify the signals at every step. People make the calls.",
  },
  {
    kind: "callout",
    title: "The definition, in one sentence",
    text: "User-First Intelligence is the practice of modeling demand from people outward (who they are, where they ask, what they need) and mapping it to an industry, so that what a business builds, publishes and fixes follows its users rather than an algorithm. (Venkata Pagadala, 2026)",
  },
  {
    kind: "p",
    text: "The name states the order of work. **User first**: begin with the person, not the keyword, the ranking or the model. **Intelligence**: turn scattered signals into decisions, with the evidence attached. The algorithm still matters. It comes second, because algorithms change every few months and the needs behind them change far more slowly.",
  },
  {
    kind: "framework",
    steps: [
      { name: "Users", question: "Who are the people behind the questions?", note: "Start from people, not keywords." },
      { name: "Personas", question: "Which groups do they form, and what do they need?", note: "Every trait graded: measured, derived or inferred." },
      { name: "Platforms", question: "Where do they spend time, ask and trust?", note: "Twenty demand sources and an attention map." },
      { name: "Content", question: "What answers them, and what is missing?", note: "Gaps by need, surface and format." },
      { name: "Business", question: "What should we build, publish or fix?", note: "Decisions, measured as outcomes." },
    ],
    map: {
      title: "One industry ontology and knowledge graph",
      items: ["Entities", "Needs and intents", "Personas", "Platforms and surfaces", "Competitors", "Sources, roles and dates"],
    },
    rule: "AI agents gather and classify. People decide.",
    loop: "Measure the outcomes, watch where people move, refresh the map.",
    caption: "The User-First Intelligence framework: five steps, one map, one rule and a loop.",
  },

  { kind: "h2", id: "how-is-it-different", text: "How is User-First Intelligence different from SEO and keyword research?", toc: "UFI vs SEO and keyword research" },
  {
    kind: "p",
    text: "Keyword research starts at the search box. It lists the phrases people type, estimates how often they type them and tracks who ranks. That is useful, and it is one side of the coin. People also ask in Facebook groups and on Reddit, watch demonstrations on YouTube and TikTok, read reviews before they buy, and increasingly put the whole question to an AI assistant. A keyword tool sees only the part of that demand that reaches a search box in a countable phrasing.",
  },
  {
    kind: "p",
    text: "User-First Intelligence starts one step earlier, with the person, and treats every place they ask as evidence about the same need. SEO and its counterparts for AI answers, [answer engine optimization](/solutions/aeo) (AEO) and [generative engine optimization](/guides/topics/geo) (GEO), become outputs of the framework rather than its starting point.",
  },
  { kind: "comparison" },
  {
    kind: "p",
    text: "**UFI does not replace SEO.** Search engines remain the largest demand source most businesses can measure, and technical SEO still decides whether a page can be found at all. UFI decides which needs deserve a page, a video, a product feature or nothing, and for whom. SEO, GEO and AEO make the chosen answers easy to find.",
  },

  { kind: "h2", id: "why-now", text: "Why does User-First Intelligence matter now?", toc: "Why it matters now" },
  { kind: "p", text: "Four shifts make a keyword-first plan break more often than it used to." },
  {
    kind: "list",
    ordered: true,
    items: [
      "**People ask in more places.** A homeowner with a leaking roof might ask an AI assistant, read an AI summary on Google, watch a contractor on YouTube and post in a local Reddit thread before calling anyone. Every new platform that takes off sends a keyword list and a content plan out of date.",
      `**AI answers sit between the question and the page.** In a Pew Research Center study of 900 U.S. adults' browsing in March 2025, 18% of Google searches produced an AI summary. When one appeared, people clicked a traditional result in 8% of visits, against 15% when none appeared, and clicked a link inside the summary in 1% ([Pew Research Center, 2025](${SRC.pewAiSummary})).`,
      "**Volume is a model, not a census.** A search volume is a tool's estimate for one phrasing, one market and one period. **Zero volume does not mean zero demand.** When I was choosing a $60,000 three-row SUV for my young family, the answers I trusted came from a Facebook group of owners, not from sales pages: which trim, which dealer, what they wished they had known. Questions like those rarely register as volume, yet AI engines answer them by reading exactly those communities.",
      `**Audiences move.** In India, Facebook passed Orkut in monthly visitors in July 2010, 20.9 million to 19.9 million ([comScore, 2010](${SRC.comscore})). Among U.S. teens, Facebook use fell from 71% in 2014-15 to about three in ten by 2025 ([Pew Research Center](${SRC.pewTeens})). A plan built on last year's platform map is a plan for last year's audience.`,
    ],
  },
  {
    kind: "p",
    text: `Google has said as much in public. In 2022 a Google executive said that, in the company's own studies, almost 40% of young people looking for a place to have lunch went to TikTok or Instagram instead of Google Maps or Search; Google later said the figure came from a survey of U.S. users aged 18 to 24 ([TechCrunch, 2022](${SRC.techcrunch})).`,
  },
  {
    kind: "callout",
    title: "What User-First Intelligence is not",
    text: "It is not a tool, though tools can run it. It is not a replacement for SEO. It is not surveillance: it works from public, licensed and consented data, in aggregate, and private conversations are never a listening feed. And it is not demographic destiny: age, place and identity are starting points to test, never a verdict on what a person wants.",
  },

  { kind: "h2", id: "principles", text: "What are the principles of User-First Intelligence?", toc: "The eight principles" },
  { kind: "p", text: "Eight principles hold the framework together. Each is a rule a study can be checked against." },
  {
    kind: "list",
    ordered: true,
    items: [
      "**People before keywords.** Start with who is asking and why. A keyword is one way one person phrases a need, on one platform, at one moment.",
      "**Search is one source of many.** Search engines show one side of the coin. Communities, video, reviews, marketplaces, AI assistants and the market itself show the rest.",
      "**Zero volume is not zero demand.** A volume estimate describes a tool's view of one phrasing. When it reads zero, ask where else the need is expressed.",
      "**Keep evidence in its lane.** A competitor's page is evidence of coverage, not of demand. A review is evidence of experience, not of search volume. Label every claim measured, derived or inferred, and keep its source and date.",
      "**Design the map before you fill it.** An industry ontology, drawn from broad category to specific need and written against the questions it must answer, turns scattered signals into something a team can act on. Clustering whatever data arrived first does not.",
      "**Format follows platform, and platform follows persona.** Text is not the answer everywhere. Choose the form of the answer from the person, the place they meet it and the task they are trying to finish.",
      "**People move, so watch the movement.** Audiences migrate between platforms, and rivals arrive from below and from adjacent markets. Track the series, not the snapshot.",
      "**Agents gather; people decide.** AI agents collect and classify at a scale no team can match. People set the questions, check the samples and make the calls, and every decision keeps the evidence that justified it.",
    ],
  },

  { kind: "h2", id: "how-it-works", text: "How does the User-First Intelligence framework work?", toc: "How the framework works" },
  {
    kind: "p",
    text: "The framework has five steps, one map, one rule and a loop. The steps are the questions a study answers, in order. The map is where every answer lands. The rule decides who does what. The loop keeps the whole thing current.",
  },
  { kind: "h3", id: "step-users", text: "1. Users: who are the people behind the questions?" },
  {
    kind: "p",
    text: "Begin with the people a business serves, or wants to serve, rather than with its catalogue or its keyword list. Write down the situations they are in, the tasks they are trying to finish and the obstacles in their way. In telecom, \"switching providers\" can mean a person worried about losing a phone number, a family comparing total cost or a business moving forty lines. One topic label hides three different people.",
  },
  { kind: "h3", id: "step-personas", text: "2. Personas: which groups do they form, and what do they need?" },
  {
    kind: "p",
    text: "Group people into personas and grade every trait. **Measured** means a study reports it for this population. **Derived** means real data from a wider population. **Inferred** means no source yet: an assumption to test, never a finding. Age band, life stage, interests, constraints, budget and channel habits all belong in a persona; none of them determines behavior on its own.",
  },
  {
    kind: "p",
    text: `This site publishes the method in the open: [evidence-graded personas](/personas) built from probability surveys, the [Global Persona Framework](/personas/framework) of ${P.frameworkDimensions} dimensions in ${P.frameworkFamilies} families, a [Persona Builder](/personas/builder) that asks the framework's follow-up questions, and a [Fan-out Journey](/personas/fanout-journey) that turns one persona's need into the questions it raises at each stage of a purchase.`,
  },
  { kind: "h3", id: "step-platforms", text: "3. Platforms: where do they spend time, ask and trust?" },
  {
    kind: "p",
    text: "For each persona, map three relations to each platform: where it **spends time**, where it **asks** and where it **trusts** the answer. Reach is not trust; a platform can reach an audience without being where it decides. Then collect what people say on those platforms, in their own words, with the source and date of every record. The twenty demand sources below are the checklist.",
  },
  { kind: "h3", id: "step-content", text: "4. Content: what answers them, and what is missing?" },
  {
    kind: "p",
    text: "Place every question, post, comment and review on the industry map by entity, intent, persona and stage of the journey. For each node, compare how much people need it with how well you, your competitors and the best available answers serve it, surface by surface. Then choose the form of the answer: a page, a short video, a comparison table, a tool, a booking flow, or a change to the product itself.",
  },
  { kind: "h3", id: "step-business", text: "5. Business: what should we build, publish or fix?" },
  {
    kind: "p",
    text: "Rank the gaps by what they are worth and what they cost to close, decide, and measure the result as an outcome: a task completed, a qualified visit, a sale, a customer kept. Some of the best findings are not content at all. Store reviews that complain about long waits point to a booking feature before they point to a blog post.",
  },
  { kind: "h3", id: "the-map", text: "The map: one ontology and knowledge graph for every signal" },
  {
    kind: "p",
    text: "Every step reads from and writes to one map of the industry: an ontology that defines the kinds of things and their relations, and a knowledge graph that holds the specific entities and the evidence attached to them. Because a TikTok comment and a Google query land on the same node, they can be compared. Without the map, every platform produces its own report and nobody sees the whole customer.",
  },
  { kind: "h3", id: "the-rule", text: "The rule: AI agents gather and classify, people decide" },
  {
    kind: "p",
    text: "AI agents do the work that does not scale for people: collecting from many platforms, classifying millions of records, drafting the first map and watching for change. People write the questions, design the map, check samples of the agents' work and make the decisions. The [guide to AI agents for marketing](/guides/ai-agents-for-marketing) shows how to build such agents with limits, tests and costs under control.",
  },
  { kind: "h3", id: "the-loop", text: "The loop: measure, watch, refresh" },
  {
    kind: "p",
    text: "A study is a cycle, not a report. Measure what the decisions changed, re-run the collection on a schedule and watch where people move. The map is never finished, because the industry and its audience never stop changing.",
  },

  { kind: "h2", id: "demand-sources", text: "Where do people ask? The twenty demand sources", toc: "The twenty demand sources" },
  {
    kind: "p",
    text: `Search demand is one box in a map of twenty demand sources, grouped in five families by the job each does. I presented the map at [brightonSEO San Diego 2026](/research-and-talks/brightonseo-san-diego-2026) and wrote it up for [Previsible](${SRC.previsible}).`,
  },
  {
    kind: "table",
    caption:
      "The twenty demand sources in five groups, from the brightonSEO San Diego 2026 talk. Snapchat, AI assistants and support tickets extend the list where they apply.",
    headers: ["Group", "Sources", "What it tells you", "Watch out for"],
    rows: [
      [
        "Search and language",
        "Search demand; wikis and reference works",
        "What people type, and what the words mean: the entities and terms around a topic",
        "Volume is an estimate for one phrasing; reference works describe what exists, not what people want",
      ],
      [
        "Social conversations",
        "YouTube, X, Reddit, TikTok, Facebook groups, Instagram",
        "Questions in context: what people tried, which answer failed, which trade-off they cannot resolve",
        "One lively thread does not size a market; look for recurrence",
      ],
      [
        "Customer experience",
        "Google Business Profile reviews, marketplaces, app reviews",
        "What customers valued, what disappointed them and how they describe the gap",
        "Reviews show a reason to investigate, not the cause",
      ],
      [
        "Market context",
        "Competitors, public data, earnings calls, job postings, regulations",
        "Pricing, priorities, investment and constraints: why a need matters to the business",
        "Coverage is not demand; a hiring pattern suggests, it does not confirm",
      ],
      [
        "Expert knowledge",
        "Conferences, newsletters, podcasts, research papers",
        "Specialist interpretation and the questions just starting to appear",
        "Experts lead; check whether customers follow",
      ],
    ],
  },
  {
    kind: "p",
    text: "Two surfaces need care. **AI assistants** are where many questions now go, but the conversations are private: what you can observe is what the engines retrieve and cite, and any figure for \"AI search volume\" is a vendor's model, so read how it is built before trusting it. **Private messages** on Snapchat, WhatsApp and in direct messages are not a public listening feed; learn their role from interviews, surveys and voluntary feedback.",
  },

  { kind: "h2", id: "platform-and-format", text: "Which platform and which format for which persona?", toc: "Platform and format by persona" },
  {
    kind: "p",
    text: "Platform use differs sharply by age, which makes age a useful prior and a poor verdict. Among U.S. adults, the youngest group is far more likely to use TikTok, Instagram, Snapchat and Reddit, while YouTube and Facebook reach most groups:",
  },
  {
    kind: "table",
    caption: `Share of U.S. adults who say they ever use each platform. Pew Research Center, ${PEW.title}, published ${longDate(PEW.published)}; ${PEW.sampleSize.toLocaleString("en-US")} adults surveyed ${longDate(PEW.fieldStart)} to ${longDate(PEW.fieldEnd)}. Ever use is not daily use, and use is not trust.`,
    headers: ["Platform", "All adults", "18 to 29", "30 to 49", "50 to 64", "65 and older"],
    rows: PEW.rows.map((r) => [r.label, `${r.all}%`, ...r.byAge.map((v) => `${v}%`)]),
  },
  {
    kind: "p",
    text: `Read the table as a starting point for an attention map, then check it against your own audience: your analytics, your community, your customers' answers. If your audience is 18 to 25, TikTok and Snapchat may reach it far better than a blog post; the same persona may still finish the purchase after a search. The data behind this table, and more segments, are on the [persona data page](/personas/data).`,
  },
  { kind: "h3", id: "format-fit", text: "Format-platform fit: match the answer to the moment" },
  {
    kind: "decision",
    items: [
      {
        when: "The need is visual and quick: how a product looks, how to set something up, whether it fits",
        use: "A short vertical video where the persona already watches (TikTok, Instagram Reels, YouTube Shorts), linked to a page with the full steps",
      },
      {
        when: "The decision is complex: plans, prices, trade-offs between options",
        use: "A comparison page with a clear table and honest trade-offs, written to be quoted by AI answers and found in search",
      },
      {
        when: "The question is about lived experience: is it worth it, what went wrong, what do owners say",
        use: "Useful answers in the communities where owners talk (Reddit, Facebook groups), plus first-hand reviews and case studies on your own site",
      },
      {
        when: "The task is local and immediate: open now, wait times, book a visit",
        use: "Accurate local listings, a working booking flow and a page about what to expect; content alone will not fix a broken visit",
      },
      {
        when: "The buyer is professional: buying for a team, a budget or a committee",
        use: "Long-form guides, data and talks on LinkedIn, in newsletters and at conferences, where professionals build trust",
      },
      {
        when: "An AI agent will act for the person: compare, book or buy",
        use: "Structured, machine-readable offers (schema.org markup, feeds, clear policies and prices) so the agent can verify every fact it needs",
      },
    ],
  },

  { kind: "h2", id: "industry-map", text: "How do you build the industry map? Ontologies, knowledge graphs and intent", toc: "Ontologies and knowledge graphs" },
  {
    kind: "p",
    text: "The map is the framework's backbone, and it is designed, not discovered. Four layers matter: the ontology, the knowledge graph, the source roles and the classification of intent. The [graph types guide](/guides/graph-types-for-ai-agents) explains each underlying structure, from taxonomy to vector index, in depth.",
  },
  { kind: "h3", id: "ontology", text: "Ontology: design the classes before the data arrives" },
  {
    kind: "p",
    text: `An ontology defines what kinds of things exist in an industry and how they relate: products, problems, needs, places, people, providers. Design it top down, from broad category to specific need, with modifiers that cut across every branch: location, price, urgency, comparison. Write the **competency questions** first, the questions the map must be able to answer, such as "which storm-damage needs, in which towns, have no good answer?" ([Ren et al., 2014](${SRC.ren})). A map built from whatever data arrived first answers the questions that data happened to raise, not the ones the business needs. See the [ontology topic](/guides/topics/ontology).`,
  },
  { kind: "termcard", termSlug: "industry-ontology" },
  { kind: "h3", id: "knowledge-graph", text: "Knowledge graph: connect the entities to everything around them" },
  {
    kind: "p",
    text: `A knowledge graph holds the specific entities (products, brands, places, conditions, competitors) and the links between them. Google brought the idea to search in 2012 under the line "things, not strings" ([Google, 2012](${SRC.googleKg})). In UFI the graph reaches past the company: an **industrial context graph** covers the industry and its adjacent markets, so a rival arriving from next door appears on the same map. Every statement carries its source, its role and the date it was retrieved. See the [knowledge graphs topic](/guides/topics/knowledge-graphs).`,
  },
  { kind: "termcard", termSlug: "industrial-context-graph" },
  { kind: "h3", id: "source-roles", text: "Source roles: keep evidence in its lane" },
  {
    kind: "p",
    text: "Each source gets exactly one role. **Structure** says what exists: registries, standards bodies, encyclopedias. **Coverage** says who answers: your pages and your competitors'. **Answerability** says whether the best available answer is good enough. **Demand** says who asks. The rule that coverage never counts as demand prevents the most common error in content research: copying what competitors publish and calling it what people want.",
  },
  { kind: "termcard", termSlug: "source-role" },
  { kind: "h3", id: "intent", text: "Intent and classification at scale" },
  {
    kind: "p",
    text: `Every record is classified twice over: **where** it sits on the map (the entity and the need) and **why** the person is asking, to research, compare, purchase, get support or reach something they already know. The idea is old; [Broder (2002)](${SRC.broder}) separated navigational, informational and transactional web searches. What is new is that the same words carry different intent in a search box, an AI assistant, a forum and a video comment, so UFI labels intent per surface and records [named entities](/notebook/ai/encyclopedia/named-entity) as it goes.`,
  },
  {
    kind: "p",
    text: "At scale, classification runs in two passes. Retrieval narrows each record to a few candidate nodes on the map; then a language model makes the final call with structured output, and a gold sample checked by people measures how often it is right. Sorting into a map you designed works better than clustering, because clusters describe the data you happened to collect, not the industry. The [classification](/notebook/ai/encyclopedia/classification-regression) entry covers the underlying models.",
  },

  { kind: "h2", id: "retrieval", text: "Where does retrieval fit? From embeddings to AI answers", toc: "Retrieval and AI answers" },
  {
    kind: "p",
    text: "Retrieval appears twice in User-First Intelligence: inside the system, as the engine that classifies demand, and outside it, as the way AI answer engines decide what to say and whom to cite.",
  },
  { kind: "h3", id: "retrieval-inside", text: "Inside: retrieval classifies demand" },
  {
    kind: "p",
    text: `[Embeddings](/notebook/ai/encyclopedia/embeddings) turn each question, review and post into a vector, and a [vector index](/notebook/ai/encyclopedia/vector-databases) finds the nearest nodes of the ontology in milliseconds. That narrows millions of records to a handful of candidates each, so the expensive step, a model's decision, runs only where it is needed. The knowledge graph then supplies the context the model needs to choose well: the node's definition, its neighbors and its examples. This is [retrieval-augmented generation](/notebook/ai/encyclopedia/rag) turned inward ([Lewis et al., 2020](${SRC.lewis})): the pattern that grounds a chatbot in documents grounds a classifier in an industry map, and graph-based retrieval extends it to questions about the whole corpus ([Edge et al., 2024](${SRC.edge})).`,
  },
  { kind: "h3", id: "retrieval-outside", text: "Outside: AI engines retrieve before they answer" },
  {
    kind: "p",
    text: `AI answer engines do not answer from one ranked list. Google describes its AI Mode as using a **query fan-out** technique: it breaks a question into subtopics and issues many searches at once on the person's behalf ([Google, 2025](${SRC.googleAiMode})). The answer is composed from what those searches retrieve, and the sources cited differ from engine to engine. Two consequences follow. A brand is chosen by the sub-questions, not only the head question, so mapping how one need fans out into many questions matters more than ever (try the [Fan-out Journey](/personas/fanout-journey)). And because each engine reads different kinds of sources, presence has to be measured answer surface by answer surface: your pages, the communities, the videos, the reviews and the reference works the engines read.`,
  },
  { kind: "termcard", termSlug: "answer-surface" },

  { kind: "h2", id: "gaps", text: "How do you find the gaps that matter?", toc: "Finding the gaps" },
  {
    kind: "p",
    text: "A gap is a need that people express, that the map can locate, and that an organization does not answer well enough on the surfaces where those people look. Gaps are an outcome of **query discovery**, the framework's first task: find the questions people ask about the industry's entities, on any surface and in their own words, before deciding which to answer.",
  },
  {
    kind: "p",
    text: `For each node on the map, compare four things: how much it matters (its place in the map and the demand linked to it), whether you cover it, how well your competitors cover it and how well the best available answer actually answers it. A **Content Gap Score** combines them into a ranking; its open reference implementation is published on [GitHub](${SRC.repo}). Three habits keep the ranking honest: compare like with like, keep competitors' coverage out of the demand side, and read the real examples behind every high score before acting on it.`,
  },
  { kind: "termcard", termSlug: "content-gap" },
  {
    kind: "p",
    text: "Gaps are not only content. A cluster of reviews about long waits points to a change in the service. A rising question in an adjacent market points to a new offer. A competitor's answer that AI engines keep citing points to a trust problem, not a keyword problem.",
  },

  { kind: "h2", id: "audience-migration", text: "How do you see where the audience is moving?", toc: "Where audiences move" },
  {
    kind: "p",
    text: `Audiences migrate. In India in 2010, Facebook overtook Orkut in monthly visitors within a few months ([comScore, 2010](${SRC.comscore})); over the following decade, U.S. teenagers moved toward YouTube, TikTok, Instagram and Snapchat while their use of Facebook fell by more than half ([Pew Research Center](${SRC.pewTeens})). A snapshot of today's platforms shows neither shift. A series shows both.`,
  },
  { kind: "p", text: "UFI watches the persona and platform links over time, and a short list of early signals:" },
  {
    kind: "list",
    items: [
      "**New words**: terms that appear in people's questions before any tool reports volume for them.",
      "**Rising mentions** of a product, a problem or a platform in communities and reviews.",
      "**Entrants from below**: cheaper, simpler offers that start with customers the leaders ignore, the pattern Clayton Christensen called disruptive innovation.",
      "**Convergence from beside**: products from an adjacent market that start to answer the same need, the way the phone absorbed the camera and the music player.",
      "**Company signals**: earnings calls, job postings and patents that show where competitors are investing.",
      "**Answer drift**: AI engines that start citing different sources for the same need.",
    ],
  },
  { kind: "termcard", termSlug: "audience-migration" },

  { kind: "h2", id: "personalization", text: "What happens when every result is personal?", toc: "Personalization and agents" },
  {
    kind: "p",
    text: `Search results already vary from person to person, and AI answers vary more. A 2013 audit of Google web search found that personalization changed about 11.7% of results on average, driven mainly by being signed in and by location ([Hannak et al., 2013](${SRC.hannak})). AI assistants compose their answers instead of ranking pages: ask the same question twice and the answer, and the sources it cites, can change. Researchers at OpenAI found that a chatbot's responses can differ with nothing more than the user's name ([Eloundou et al., 2025](${SRC.eloundou})). As assistants remember more about each user, that variation will grow.`,
  },
  {
    kind: "callout",
    title: "What your tools see is not what your users see",
    text: "A rank tracker checks one view, from one place, signed out. Each of your customers sees their own. The more personal the results, the less a single tracked position says about any real person.",
  },
  { kind: "p", text: "Here is where I think this goes. These are predictions, not findings:" },
  {
    kind: "list",
    ordered: true,
    items: [
      "**Position will matter less, and presence more.** When every result is personal there is no single rank to win. What a brand can control is whether it is present, and trusted, in the sources each engine reads for each persona: its own pages, the communities, the videos, the reviews and the reference works.",
      "**Optimize for the persona, not the position.** The stable unit is not a keyword at rank three. It is a need, held by a persona, on a platform, and it survives personalization because it describes the person rather than the page.",
      "**Personal agents will not end demand research; they will standardize it.** When people hand tasks to their own AI agents (book a flight that lands before noon, with a checked bag, under $500), the agents will ask on their behalf in patterns their principals set. Needs, constraints and preferences repeat across a persona even when every individual answer differs. A business that knows those patterns, and publishes offers an agent can verify, will be chosen.",
      "**Measurement will move from rankings to panels and outcomes.** Teams will sample answers through persona panels (prompts written in each persona's words, run across engines) and judge success by completed tasks and revenue rather than a position no customer sees.",
    ],
  },
  {
    kind: "p",
    text: "User-First Intelligence is built for that world. It never depended on one shared results page. It depends on knowing the people, where they really spend their time and what they need.",
  },

  { kind: "h2", id: "method", text: "How do you run a User-First Intelligence study?", toc: "Run a UFI study" },
  {
    kind: "p",
    text: "Seven steps take a team from a question to a decision. A small business can run them in a week with a spreadsheet; an enterprise runs them continuously with agents.",
  },
  { kind: "list", ordered: true, items: METHOD.map((s) => `**${s.name}.** ${s.text}`) },

  { kind: "h2", id: "example-linkedin", text: "Worked example: my LinkedIn, mapped as a knowledge graph", toc: "Example: LinkedIn graph" },
  {
    kind: "p",
    text: `I run the framework on my own work first. My LinkedIn archive, ${L.posts} posts and ${L.articles} articles from ${monthYear(L.firstDate)} to ${monthYear(L.lastDate)}, is classified into a designed taxonomy of ${L.areas} areas, ${L.topics} topics and ${L.subtopics} subtopics, with ${L.entities} named entities such as people, companies, products and events. The result is a knowledge graph of ${L.graphNodes.toLocaleString("en-US")} nodes and ${L.graphLinks.toLocaleString("en-US")} links that anyone can explore in the [Venkata Pagadala Universe](${L.source}).`,
  },
  {
    kind: "p",
    text: `Then the UFI question: does what I publish match what my audience responds to? In the twelve months to ${longDate(L.reactionsAsOf)} I published ${L.windowPosts} posts with reactions recorded, and my median post drew ${L.medianReactions} reactions.`,
  },
  {
    kind: "table",
    caption: `Posts per area of the map and median reactions per post, for posts published ${longDate(L.windowStart)} to ${longDate(L.reactionsAsOf)}; reactions counted on ${longDate(L.reactionsAsOf)}. A post can sit in more than one area, so the column adds up to more than ${L.windowPosts}. Descriptive, not causal: timing, format and audience growth also move reactions.`,
    headers: ["Area of the map", "Posts", "Median reactions"],
    rows: L.rows.map((r) => [`[${r.label}](/venkata-pagadala-universe/topics/${r.slug})`, String(r.posts), String(r.medianReactions)]),
  },
  {
    kind: "p",
    text: `${linkedinReading} ${small.length ? `${joinAnd(small)} had fewer than ten posts each, too few to read. ` : ""}Supply is not demand, even on one profile. The decision that follows is not to stop writing about AI. It is to write about AI the way the stronger areas work: through things I built, data I measured and lessons a reader can use.`,
  },

  { kind: "h2", id: "example-personas", text: "Worked example: evidence-graded personas on this site", toc: "Example: graded personas" },
  {
    kind: "p",
    text: `The [personas on this site](/personas) are built the UFI way. The first, [the 3-row SUV dad](/personas/us-dad-30-49-three-row-suv), a U.S. man aged 30 to 49 with a young family who is shopping for a three-row SUV, is assembled from ${P.studies} studies with published methods, samples and field dates. Each trait carries its grade, so a reader sees at once that ${P.measuredTraits} traits are measured and ${P.inferredTraits} are inferred: assumptions to test, shown rather than hidden.`,
  },
  {
    kind: "p",
    text: `Behind it, the [Global Persona Framework](/personas/framework) (version of ${P.frameworkVersion}) lists ${P.frameworkDimensions} dimensions in ${P.frameworkFamilies} families, from age and life stage to search, information and AI behavior, and states its own rule: identity does not determine behavior or interests. The [Persona Builder](/personas/builder) turns the framework's questions into a brief, and the [Fan-out Journey](/personas/fanout-journey) shows how one persona's need becomes dozens of questions across the stages of a purchase, the same fan-out AI engines perform when they answer.`,
  },

  { kind: "h2", id: "measure", text: "How do you measure User-First Intelligence?", toc: "How to measure it" },
  {
    kind: "list",
    items: [
      "**Outcomes first**: tasks completed, qualified visits, leads, sales and customers kept, traced to the decisions the study produced.",
      "**Coverage of the map**: the share of priority nodes you answer well, per answer surface (search results, AI answers, video, communities, reviews).",
      "**Quality of the map**: the share of competency questions the ontology can express, and the share the graph can actually answer.",
      "**Quality of classification**: agreement with a gold sample checked by people, reported with its sample size.",
      "**Quality of evidence**: the share of persona traits and claims that are measured rather than inferred, and how old the evidence is.",
      "**Discipline with instruments**: one figure per instrument. Volume and traffic estimates from different tools are different models; compare like with like and never mix them in one chart.",
    ],
  },
  { kind: "p", text: "Rankings still matter where a ranking still exists. They are no longer the scoreboard." },

  { kind: "h2", id: "origin", text: "Where did User-First Intelligence come from?", toc: "Where UFI came from" },
  { kind: "p", text: "The framework grew out of a decade of search work and a habit of starting with the user. The public record:" },
  {
    kind: "list",
    items: [
      `**August 2024**: I described programmatic SEO as [UFO, User-First Optimization](${POST("2024-08-22-programmatic-seo-pseo-ufo-user-first-optimization-rich")}), plus rich data, plus scaled implementation, with UFO asking what value you give the user that is better than your competitors.`,
      `**April 2025**: [UFO, user first optimization, became my stated strategy](${POST("2025-04-20-ufo-user-first-focused-optimization-is-my-strategy")}). Algorithms, devices and results pages come and go; users stay constant, whether the engine is a search engine or an answer engine.`,
      `**September 2026**: at brightonSEO San Diego I presented [Industrial Level Classification with Intent](/research-and-talks/brightonseo-san-diego-2026) under the line **user first, algorithm second**: industry-wide demand research that connects queries, including zero-volume ones, to personas, intent and customer pain points. The [slides](${SRC.slides}), the [write-up on Previsible](${SRC.previsible}) and a [recap post](${POST("2026-09-17-brightonseo-2026-san-diego-usa")}) are public.`,
      `**October 2026**: I named and specified the framework as User-First Intelligence, and published an open reference implementation of its Content Gap Score on [GitHub](${SRC.repo}).`,
      `**${longDate("2026-10-23")}**: this reference guide, version ${UFI_VERSION}.`,
    ],
  },
  {
    kind: "p",
    text: "A research paper and a book on User-First Intelligence are in preparation. Until they are out, this page is the framework's public reference. It is versioned, and changes will be noted here. UFI is my independent work; it is not a product or a position of my employer.",
  },

  { kind: "h2", id: "related-work", text: "How does User-First Intelligence relate to existing ideas?", toc: "Related ideas" },
  { kind: "p", text: "UFI stands on well-tested ideas and combines them into one working system." },
  {
    kind: "list",
    items: [
      "**User-centered design** put the user at the center of system design in the 1980s (Norman and Draper, 1986). UFI applies that stance to demand research and content.",
      "**Personas** made users concrete for product teams (Cooper, 1999). UFI grades every persona trait by its evidence.",
      "**Jobs to be done** asks what a customer hires a product to do (Christensen, Hall, Dillon and Duncan, 2016). UFI adds the scale and the platform view that interviews alone cannot give, and keeps interviews for the job behind the words.",
      `**People ask their networks**, not only search engines ([Morris, Teevan and Panovich, 2010](${SRC.morris})).`,
      `**Market structure can be read from text and search**: forum text can map a market ([Netzer, Feldman, Goldenberg and Fresko, 2012](${SRC.netzer})); search data can map competition among more than a thousand products ([Ringel and Skiera, 2016](${SRC.ringel})); machine learning can find customer needs in user-generated content ([Timoshenko and Hauser, 2019](${SRC.timoshenko})). Each answers one question from one kind of source.`,
      `**Ontology engineering** uses competency questions to decide what an ontology must answer ([Ren et al., 2014](${SRC.ren})).`,
      `**Generative engine optimization** studies how sources gain visibility in AI-generated answers ([Aggarwal et al., 2024](${SRC.aggarwal})).`,
      `**People-first content** is Google's own guidance: make content for people, not for search engines ([Google Search Central](${SRC.peopleFirst})).`,
    ],
  },
  {
    kind: "p",
    text: "What UFI adds is the combination, run as one system: a designed industry map that every demand source lands on; evidence with roles and grades; persona, platform and format decisions made together; AI agents doing the collection and classification at scale; and a loop that watches where people move.",
  },

  { kind: "h2", id: "faq", text: "Frequently asked questions about User-First Intelligence", toc: "FAQ" },
  { kind: "faq" },

  { kind: "h2", id: "cite", text: "How to cite User-First Intelligence", toc: "How to cite" },
  {
    kind: "callout",
    title: "Cite this framework",
    text: `Pagadala, V. (2026). *User-First Intelligence (UFI): A framework for understanding people before algorithms* (Version ${UFI_VERSION}). venkatapagadala.com. ${UFI_GUIDE_URL}`,
  },
  {
    kind: "code",
    caption: "BibTeX",
    code: `@misc{pagadala2026ufi,
  author       = {Pagadala, Venkata},
  title        = {User-First Intelligence (UFI): A Framework for Understanding People Before Algorithms},
  year         = {2026},
  month        = oct,
  note         = {Version ${UFI_VERSION}. Reference guide},
  howpublished = {\\url{${UFI_GUIDE_URL}}}
}`,
  },
  {
    kind: "p",
    text: "Quote the one-sentence definition with attribution and a link to this page. When the paper and the book are published, their details will be added here.",
  },

  {
    kind: "sources",
    items: [
      { label: "Pew Research Center (2025). Google users are less likely to click on links when an AI summary appears in the results", href: SRC.pewAiSummary, note: "900 U.S. adults' browsing, March 2025: AI summaries on 18% of searches; result clicks 8% with a summary, 15% without." },
      { label: "Pew Research Center (2025). Social Media Fact Sheet", href: PEW.url, note: "Platform use by age, the source of the table above." },
      { label: "Pew Research Center. Teens and social media", href: SRC.pewTeens, note: "Facebook use among U.S. teens: 71% in 2014-15, about three in ten by 2025." },
      { label: "comScore (2010). Facebook captures top spot among social networking sites in India", href: SRC.comscore, note: "July 2010: Facebook 20.9 million monthly visitors, Orkut 19.9 million." },
      { label: "TechCrunch (2022). Google exec suggests Instagram and TikTok are eating into Google's core products, Search and Maps", href: SRC.techcrunch, note: "The 40% lunch-search remark and Google's note that it came from a survey of U.S. users aged 18 to 24." },
      { label: "Google (2025). AI Mode in Google Search: updates from Google I/O 2025", href: SRC.googleAiMode, note: "Describes the query fan-out technique." },
      { label: "Google (2012). Introducing the Knowledge Graph: things, not strings", href: SRC.googleKg },
      { label: "Google Search Central. Creating helpful, reliable, people-first content", href: SRC.peopleFirst },
      { label: "Hannak et al. (2013). Measuring personalization of web search. WWW 2013", href: SRC.hannak },
      { label: "Eloundou et al. (2025). First-person fairness in chatbots. ICLR 2025", href: SRC.eloundou },
      { label: "Lewis et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks", href: SRC.lewis },
      { label: "Edge et al. (2024). From local to global: a graph RAG approach to query-focused summarization", href: SRC.edge },
      { label: "Broder (2002). A taxonomy of web search. SIGIR Forum", href: SRC.broder },
      { label: "Morris, Teevan and Panovich (2010). What do people ask their social networks, and why? CHI 2010", href: SRC.morris },
      { label: "Netzer, Feldman, Goldenberg and Fresko (2012). Mine your own business: market-structure surveillance through text mining. Marketing Science", href: SRC.netzer },
      { label: "Ringel and Skiera (2016). Visualizing asymmetric competition among more than 1,000 products using big search data. Marketing Science", href: SRC.ringel },
      { label: "Timoshenko and Hauser (2019). Identifying customer needs from user-generated content. Marketing Science", href: SRC.timoshenko },
      { label: "Ren et al. (2014). Towards competency question-driven ontology authoring. ESWC 2014", href: SRC.ren },
      { label: "Aggarwal et al. (2024). GEO: Generative engine optimization. KDD 2024", href: SRC.aggarwal },
      { label: "Pagadala (2026). User First, Algorithm Second: Researching Demand Beyond Search Volume. Previsible", href: SRC.previsible },
      { label: "Pagadala (2026). Industrial context graphs: brightonSEO San Diego 2026 slides", href: SRC.slides },
      { label: "ufi: open reference implementation of the Content Gap Score", href: SRC.repo },
    ],
  },
  {
    kind: "related",
    items: [
      { label: "About Venkata Pagadala, who created User-First Intelligence", href: "/about" },
      { label: "Evidence-graded personas and platform reach", href: "/personas" },
      { label: "The Global Persona Framework: 463 dimensions in 42 families", href: "/personas/framework" },
      { label: "The Fan-out Journey: one need, every question it raises", href: "/personas/fanout-journey" },
      { label: "Knowledge graph vs vector database vs ontology", href: "/guides/graph-types-for-ai-agents" },
      { label: "The complete guide to AI agents for marketing", href: "/guides/ai-agents-for-marketing" },
      { label: "The Venkata Pagadala Universe: a LinkedIn archive as a knowledge graph", href: "/venkata-pagadala-universe" },
      { label: "brightonSEO San Diego 2026: Industrial Level Classification with Intent", href: "/research-and-talks/brightonseo-san-diego-2026" },
    ],
  },
];

export const ufiGuide: Guide = {
  slug: "user-first-intelligence",
  title: "User-First Intelligence (UFI)",
  metaTitle: "User-First Intelligence: A Framework by Venkata Pagadala",
  metaDescription:
    "User-First Intelligence (UFI) starts with people, not keywords: find what they need wherever they ask, map it to your industry, and decide what to build.",
  agentSummary:
    "The reference definition of User-First Intelligence (UFI), the framework created by Venkata Pagadala for understanding demand from people outward. It covers the five steps (users, personas, platforms, content, business), the one industry map (an ontology and a knowledge graph) and the one rule (AI agents gather and classify; people decide), eight principles, a seven-step method, twenty demand sources in five groups, platform use by age, ontologies, source roles, intent, retrieval and query fan-out, gap finding, audience migration, predictions for personalized search and personal AI agents, two worked examples on public data, related work and how to cite it.",
  kicker: `The framework · Created by Venkata Pagadala · Version ${UFI_VERSION}`,
  headline: "User-First Intelligence",
  subhead:
    "Understand **people** before **algorithms**: who they are, where they ask, what they need, and what to **build** for them",
  deck:
    "User-First Intelligence (UFI) starts with people, not keywords. It follows the people you serve to every place they ask for help (search engines, AI assistants, video, social platforms, communities and reviews), sorts what they say onto one map of your industry, and turns the gaps into decisions about what to build, publish or fix, in the format and on the platform each audience prefers.",
  author: {
    name: "Venkata Pagadala",
    title: "Lead Technical Product Manager, Automation, AI & SEO",
    org: "AT&T",
    url: "/about",
    bio: "Created User-First Intelligence. Researches how people search and how AI systems answer, with papers in Springer Nature's Discover Artificial Intelligence and on SSRN; presented the method at brightonSEO San Diego 2026.",
  },
  datePublished: "2026-10-23",
  dateModified: "2026-10-23",
  readingTime: "28 min read",
  tags: [
    "User-First Intelligence",
    "Personas",
    "Search Demand",
    "Knowledge Graphs",
    "Ontology",
    "Classification",
    "Embeddings",
    "RAG",
    "AEO",
    "GEO",
    "AI Agents",
    "Content Strategy",
  ],
  terms: ufiTerms,
  termRoleLabel: "In the framework",
  comparison: ufiComparison,
  comparisonHeaders: ["Approach", "Starts from", "Main data", "Unit", "Output", "Best for", "Blind spot"],
  faqs: ufiFaqs,
  blocks: ufiBlocks,
  howTos: [
    {
      name: "How to run a User-First Intelligence study",
      description:
        "Seven steps from a business question to a decision, using personas, platforms, demand from every surface and one industry map.",
      steps: METHOD,
    },
  ],
  concept: {
    name: "User-First Intelligence",
    alternateName: ["User First Intelligence", "UFI"],
    termCode: "UFI",
    description:
      "A framework, created by Venkata Pagadala, for understanding demand from people outward: who they are, where they ask, what they need, and how that maps to an industry, so a business decides what to build, publish or fix for each audience.",
  },
};
