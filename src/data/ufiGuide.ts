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

import type { Block, ComparisonRow, DefinedTerm, FaqItem, Guide, Tone } from "./guides";
import {
  UFI_EPISODES,
  UFI_LINKEDIN,
  UFI_PAPERS,
  UFI_PEERS,
  UFI_PERSONA_CARD,
  UFI_PERSONAS,
  UFI_PEW_AGE,
  UFI_PHOTOS,
  UFI_SAID,
  UFI_TALK,
} from "./ufiExample";
import { UFI_CLIPS, UFI_SLIDES } from "./ufiMedia";
import { UFI_TOOL_SHOTS } from "./ufiToolShots";
import { PROFILE } from "./profile";
import { UFI_AI_CITATIONS, UFI_AI_SPLIT, UFI_AI_SUMMARY, UFI_MIGRATION, UFI_REVIEWS, UFI_TELECOM, reviewShare } from "./ufiShowcase";

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
  pewTeens2024: "https://www.pewresearch.org/internet/2024/12/12/teens-social-media-and-technology-2024/",
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
    example: "In India, Facebook passed Orkut in monthly visitors in July 2010; among U.S. teens, Facebook use fell from 71% in 2014-15 to 32% in 2024.",
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

const PHOTO = "/venkata-pagadala-avatar.webp";
const ME = { by: "Venkata Pagadala", role: "creator of User-First Intelligence", photo: PHOTO };

/** Where each recorded conversation meets this guide. */
const EPISODE_LINKS: Record<string, string> = {
  ctpzOwKYi98: "Closest to this guide's sections on [zero-volume demand](#why-now) and [personalization](#personalization).",
  yrPWjyu0CKk: "Closest to [the twenty demand sources](#demand-sources): finding demand beyond Google.",
  qwyIY0vWO8g: "Closest to [the industry map](#industry-map): classifying queries at enterprise scale.",
  J21YdzbNG8U: "Closest to [the rule](#personalization) that agents gather and classify while people decide.",
};

/* The talk where the method was first presented: its slides, its clips and its words, all from generated data. */
const TALK = UFI_TALK;
const EVENT = TALK.event;
/** The talk page's transcript anchor for a chapter that starts at `s` seconds. */
const moment = (s: number) => `${TALK.page}#t-${s}`;
const chapter = (s: number) => {
  const c = TALK.chapters.find((x) => x.at === s);
  if (!c) throw new Error(`no talk chapter starts at ${s} s`);
  return { at: c.at, title: c.title, href: moment(c.at) };
};
/** A line I said on stage, word for word, with the moment to hear it. */
const SAID = (key: keyof typeof UFI_SAID): Block => {
  const s = UFI_SAID[key];
  return { kind: "quote", text: s.text, by: ME.by, photo: PHOTO, said: { event: EVENT, at: s.at, href: moment(s.chapterAt) } };
};
/** A slide as presented; `listenAt` must be the start of a talk chapter. */
const SLIDE = (key: keyof typeof UFI_SLIDES, caption?: string, listenAt?: number): Block => {
  const s = UFI_SLIDES[key];
  return {
    kind: "slide",
    n: s.n,
    deck: TALK.deck,
    event: EVENT,
    image: { src: s.src, width: s.width, height: s.height },
    alt: s.alt,
    caption,
    listen: listenAt === undefined ? undefined : { at: chapter(listenAt).at, href: chapter(listenAt).href },
  };
};
/** A captioned stage clip, published here on 23 October 2026. */
const CLIP = (key: keyof typeof UFI_CLIPS, caption?: string): Block => {
  const c = UFI_CLIPS[key];
  return {
    kind: "clip",
    title: c.title,
    src: c.src,
    poster: { ...c.poster },
    duration: c.duration,
    uploaded: "2026-10-23",
    event: EVENT,
    transcript: c.transcript,
    chapter: chapter(c.chapter.at),
    caption,
  };
};
const compact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.?0+$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);
const SHORT: Record<string, string> = {
  "Devices & Hardware": "Devices",
  "Mobile & Wireless Carriers": "Mobile & Wireless",
  "Internet & Broadband (ISP)": "Internet & Broadband",
  "Communication Services": "Communication",
  "Support & Account": "Support",
  "Apps & Digital Services": "Apps & Digital",
  "Deals & Promotions": "Deals",
  "Network & Infrastructure": "Network",
  "Business & Enterprise": "Business",
  "Stores & Locations": "Stores",
  "Reviews & Comparisons": "Reviews",
  "Telecom Concepts & How-It-Works": "How it works",
  "Industry & Regulatory": "Regulatory",
  "Telecom Careers, Skills & Certifications": "Careers",
};
const T = UFI_TELECOM;
const A = UFI_AI_CITATIONS;
const S = UFI_AI_SPLIT;
const R = UFI_REVIEWS;
const M = UFI_MIGRATION;
const AI = UFI_AI_SUMMARY;
const rating = (r: number) => `${r.toFixed(2)}★`;
const persona = UFI_PERSONA_CARD;

const ufiBlocks: Block[] = [
  {
    kind: "highlightkey",
    items: [
      { color: "y", label: "Yellow: the key idea" },
      { color: "g", label: "Green: what to do" },
      { color: "b", label: "Blue: the evidence" },
    ],
  },

  /* 1. What it is */
  { kind: "h2", id: "what-is-ufi", text: "What is User-First Intelligence?", toc: "What is User-First Intelligence?" },
  {
    kind: "plain",
    text: "Start with the people, not the keywords. Find out who they are, where they ask for help and what they need, put all of it on one map of your industry, and build what that map says is missing.",
  },
  {
    kind: "p",
    text: "**User-First Intelligence (UFI)** is a framework for understanding demand from the person outward. It starts with [[y:who people are]], follows them to [[y:the platforms where they spend time and ask for help]], collects what they need in their own words, and places all of it on one map of an industry, so a business can decide what to build, publish or fix for each audience, in the format and on the platform that audience prefers.",
  },
  {
    kind: "callout",
    title: "The definition, in one sentence",
    text: "User-First Intelligence is the practice of modeling demand from people outward (who they are, where they ask, what they need) and mapping it to an industry, so that what a business builds, publishes and fixes follows its users rather than an algorithm. (Venkata Pagadala, 2026)",
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
  {
    kind: "p",
    text: "The name states the order of work. **User first**: begin with the person, not the keyword, the ranking or the model. **Intelligence**: turn scattered signals into decisions, with the evidence attached. The algorithm still matters. [[y:It comes second]], because algorithms change every few months and the needs behind them change far more slowly.",
  },
  { kind: "quote", text: "Start with the person. The algorithm comes second.", ...ME },

  /* 2. How it differs */
  { kind: "h2", id: "how-is-it-different", text: "How is User-First Intelligence different from SEO and keyword research?", toc: "UFI vs SEO and keyword research" },
  {
    kind: "plain",
    text: "Keyword research looks at the search box. User-First Intelligence looks at the person, and the search box is only one of the places that person asks.",
  },
  {
    kind: "split",
    left: {
      title: "Keyword-first",
      items: [
        "Starts from the search box",
        "Counts phrases that have search volume",
        "Plans one platform at a time",
        "Keeps score with rankings",
        "Treats personas as slides",
      ],
    },
    right: {
      title: "User-first",
      items: [
        "Starts from the person and the need",
        "Counts every place people ask, in their own words",
        "Puts every platform on one industry map",
        "Keeps score with outcomes: tasks done, sales, customers kept",
        "Grades every persona trait by its evidence",
      ],
    },
  },
  {
    kind: "p",
    text: "A keyword tool sees only the part of demand that reaches a search box in a countable phrasing. People also ask in Facebook groups and on Reddit, watch demonstrations on YouTube and TikTok, read reviews before they buy, and increasingly put the whole question to an AI assistant. [[y:Search is one side of the coin.]]",
  },
  {
    kind: "iceberg",
    tip: { label: "Search queries with volume", detail: "What keyword tools count: one phrasing, one market, one month." },
    layers: [
      { label: "Long-tail and zero-volume questions", detail: "Asked, but too rare, too new or too specific for a tool to count." },
      { label: "Conversations in communities", detail: "Facebook groups, Reddit and forums: the context, the trade-offs, what failed." },
      { label: "Video and the comments under it", detail: "YouTube, TikTok and Instagram: demonstrations and the questions they raise." },
      { label: "Reviews and support tickets", detail: "What happened after the purchase, and what broke." },
      { label: "AI assistant conversations", detail: "Private; visible only through what the engines retrieve and cite." },
      { label: "Market signals", detail: "Earnings calls, job postings and regulations: why a need matters to the business." },
    ],
    caption: "The demand iceberg: an illustration of the idea, not drawn to scale.",
  },
  SAID("direction"),
  CLIP(
    "its-a-conversation",
    "My own car question had no measurable search volume, and four AI engines answered it anyway. The slide behind me is the difference this section describes: keywords only, or keywords plus the conversations where buyers ask.",
  ),
  { kind: "comparison" },
  {
    kind: "p",
    text: "**UFI does not replace SEO.** Search engines remain the largest demand source most businesses can measure, and technical SEO still decides whether a page can be found at all. UFI decides which needs deserve a page, a video, a product feature or nothing, and for whom; SEO, [answer engine optimization](/solutions/aeo) and [generative engine optimization](/guides/topics/geo) make the chosen answers easy to find.",
  },

  /* 3. Why now */
  { kind: "h2", id: "why-now", text: "Why does User-First Intelligence matter now?", toc: "Why it matters now" },
  {
    kind: "plain",
    text: "People ask in more places than ever, AI answers now sit between the question and the page, keyword volume misses much of what people need, and audiences keep moving between platforms.",
  },
  {
    kind: "stats",
    items: [
      { value: `${AI.searchesWithSummary}%`, label: "Google searches with an AI summary", note: `${AI.adults} U.S. adults' browsing, ${AI.month}`, tone: "sky" },
      { value: `${AI.clicksWithSummary}% vs ${AI.clicksWithout}%`, label: "clicked a result, with and without a summary", tone: "amber" },
      { value: `${AI.clicksInsideSummary}%`, label: "clicked a link inside the summary", tone: "rose" },
      { value: "~40%", label: "of young U.S. users looking for lunch went to TikTok or Instagram", note: "Google, citing its own research, 2022", tone: "violet" },
    ],
    caption: `Sources: [Pew Research Center, 2025](${SRC.pewAiSummary}); [TechCrunch, 2022](${SRC.techcrunch}), where Google said the figure came from a survey of U.S. users aged 18 to 24.`,
  },
  {
    kind: "bars",
    title: "When an AI summary appears, people click less",
    max: 16,
    items: [
      { label: "Clicked a result, no summary on the page", value: AI.clicksWithout, display: `${AI.clicksWithout}% of visits`, tone: "sky" },
      { label: "Clicked a result, summary on the page", value: AI.clicksWithSummary, display: `${AI.clicksWithSummary}% of visits`, tone: "amber" },
      { label: "Clicked a link inside the summary", value: AI.clicksInsideSummary, display: `${AI.clicksInsideSummary}% of visits`, tone: "rose" },
    ],
    caption: `Pew Research Center, July 2025: ${AI.adults} U.S. adults' Google searches in ${AI.month}.`,
  },
  {
    kind: "list",
    ordered: true,
    items: [
      "**People ask in more places.** A homeowner with a leaking roof might ask an AI assistant, read an AI summary on Google, watch a contractor on YouTube and post in a local Reddit thread before calling anyone. Every new platform that takes off sends a keyword list out of date.",
      "**AI answers sit between the question and the page.** [[b:When an AI summary appeared, people clicked a traditional result in 8% of visits, against 15% without one.]]",
      "**Volume is a model, not a census.** A search volume is a tool's estimate for one phrasing, one market and one period. When I was choosing a $60,000 three-row SUV for my young family, the answers I trusted came from a Facebook group of owners: which trim, which dealer, what they wished they had known. Questions like those rarely register as volume, yet AI engines answer them by reading exactly those communities.",
      `**Audiences move.** [[b:Among U.S. teens, Facebook use fell from 71% in 2014-15 to 32% in 2024]] ([Pew Research Center, 2024](${SRC.pewTeens2024})). A plan built on last year's platform map is a plan for last year's audience.`,
    ],
  },
  SLIDE(
    "zero-volume-is-not-zero-demand",
    "The line I opened the method with on stage. A zero in a keyword tool describes the tool, not the market.",
    135,
  ),
  { kind: "quote", text: "Zero volume does not mean zero demand.", ...ME },
  SAID("oneUser"),
  {
    kind: "callout",
    title: "What User-First Intelligence is not",
    text: "It is not a tool, though tools can run it. It is not a replacement for SEO. It is not surveillance: it works from public, licensed and consented data, in aggregate, and private conversations are never a listening feed. And it is not demographic destiny: age, place and identity are starting points to test, never a verdict on what a person wants.",
  },

  /* 4. Principles */
  { kind: "h2", id: "principles", text: "What are the principles of User-First Intelligence?", toc: "The eight principles" },
  { kind: "plain", text: "Eight rules hold the framework together. Every study can be checked against them." },
  {
    kind: "cards",
    columns: 4,
    items: [
      { kicker: "01", title: "People before keywords", text: "Start with who is asking and why. A keyword is one way one person phrases a need, on one platform, at one moment." },
      { kicker: "02", title: "Search is one source of many", text: "Search engines show one side of the coin. Communities, video, reviews, marketplaces, AI assistants and the market itself show the rest." },
      { kicker: "03", title: "Zero volume is not zero demand", text: "A volume estimate describes a tool's view of one phrasing. [[g:When it reads zero, ask where else the need is expressed.]]" },
      { kicker: "04", title: "Keep evidence in its lane", text: "A competitor's page is evidence of coverage, not of demand. [[g:Label every claim measured, derived or inferred]], and keep its source and date." },
      { kicker: "05", title: "Design the map before you fill it", text: "An ontology drawn from broad category to specific need, against the questions it must answer, turns scattered signals into decisions." },
      { kicker: "06", title: "Format follows platform", text: "And platform follows persona. Text is not the answer everywhere; choose the form from the person, the place and the task." },
      { kicker: "07", title: "People move; watch the movement", text: "Audiences migrate and rivals arrive from below and from next door. [[g:Track the series, not the snapshot.]]" },
      { kicker: "08", title: "Agents gather; people decide", text: "AI agents collect and classify at scale. People set the questions, check the samples and make the calls." },
    ],
  },

  /* 5. How it works */
  { kind: "h2", id: "how-it-works", text: "How does the User-First Intelligence framework work?", toc: "How the framework works" },
  {
    kind: "plain",
    text: "Five questions, answered in order, all writing to one shared map of the industry. Machines do the gathering and sorting; people make the decisions.",
  },
  {
    kind: "cards",
    columns: 3,
    items: [
      { kicker: "Step 1 · Users", title: "Who are the people behind the questions?", text: "Write down their situations, the tasks they are trying to finish and what stands in their way. \"Switching providers\" can mean a person worried about losing a number, a family comparing total cost or a business moving forty lines.", foot: "Output: situations and tasks" },
      { kicker: "Step 2 · Personas", title: "Which groups do they form?", text: "Group people into personas and grade every trait: [[y:measured, derived or inferred]]. Age, life stage, interests, constraints and channel habits all belong; none decides behavior on its own.", foot: "Output: evidence-graded personas" },
      { kicker: "Step 3 · Platforms", title: "Where do they spend time, ask and trust?", text: "Map the three relations for each persona and platform, then [[g:collect what people say there, in their own words, with the source and date of every record]].", foot: "Output: an attention map and a demand log" },
      { kicker: "Step 4 · Content", title: "What answers them, and what is missing?", text: "Place every record on the industry map, then compare demand with your coverage, your competitors' and the best available answer, surface by surface.", foot: "Output: ranked gaps, each with its format" },
      { kicker: "Step 5 · Business", title: "What should we build, publish or fix?", text: "Rank the gaps by value and effort and decide. [[y:Some of the best findings are not content at all]]: reviews about long waits point to a booking feature first.", foot: "Output: decisions and their measured results" },
      { kicker: "The rule", title: "Agents gather and classify; people decide", text: "Agents collect, classify and watch for change; people write the questions, design the map and check samples. See the [guide to AI agents for marketing](/guides/ai-agents-for-marketing).", foot: "Every decision keeps its evidence" },
    ],
  },
  {
    kind: "details",
    summary: "Technical deep dive: the record every signal becomes",
    blocks: [
      { kind: "p", text: "Every question, post, comment and review becomes one record with its provenance attached. Roles come from a closed list (structure, coverage, answerability, demand); entities and intents come from the ontology; personas and journey stages come from the persona framework. Nothing is stored that the decision does not need." },
      {
        kind: "code",
        caption: "A demand record (JSON)",
        code: `{
  "id": "rec_000184",
  "text": "Which trim fits two car seats and adults in the third row?",
  "surface": "community_thread",
  "source_url": "https://example.com/thread/0184",
  "collected_at": "2026-10-23",
  "role": "demand",
  "language": "en",
  "entity": "three_row_suv.seating",
  "intent": "compare",
  "journey_stage": "consider",
  "persona": "parent_young_children",
  "label_confidence": 0.86
}`,
      },
      { kind: "p", text: "Two fields carry most of the weight. **role** stops coverage from posing as demand. **collected_at** makes every count a dated observation, so a later run is compared with an earlier one rather than mixed into it." },
    ],
  },

  /* 6. Demand sources */
  { kind: "h2", id: "demand-sources", text: "Where do people ask? The twenty demand sources", toc: "The twenty demand sources" },
  {
    kind: "plain",
    text: "Search is one source. Here are twenty, in five groups, each answering a different question about the same need.",
  },
  {
    kind: "cards",
    columns: 3,
    items: [
      { kicker: "Group 1", title: "Search and language", text: "What people type, and what the words mean: the entities and terms around a topic.", chips: ["Search demand", "Wikis and reference"], foot: "Watch out: volume is an estimate for one phrasing." },
      { kicker: "Group 2", title: "Social conversations", text: "Questions in context: what people tried, which answer failed, which trade-off they cannot resolve.", chips: ["YouTube", "X", "Reddit", "TikTok", "Facebook groups", "Instagram"], foot: "Watch out: one lively thread does not size a market." },
      { kicker: "Group 3", title: "Customer experience", text: "What customers valued, what disappointed them and how they describe the gap.", chips: ["Google Business Profile reviews", "Marketplaces", "App reviews"], foot: "Watch out: reviews show a reason to investigate, not the cause." },
      { kicker: "Group 4", title: "Market context", text: "Pricing, priorities, investment and constraints: why a need matters to the business.", chips: ["Competitors", "Public data", "Earnings calls", "Job postings", "Regulations"], foot: "Watch out: coverage is not demand." },
      { kicker: "Group 5", title: "Expert knowledge", text: "Specialist interpretation and the questions just starting to appear.", chips: ["Conferences", "Newsletters", "Podcasts", "Research papers"], foot: "Watch out: experts lead; check whether customers follow." },
      { kicker: "Handle with care", title: "AI assistants and private messages", text: "AI conversations are private: observe what engines retrieve and cite, and treat any \"AI search volume\" as a vendor's model. Snapchat, WhatsApp and direct messages are not a listening feed; learn their role from interviews and surveys.", tone: "rose" },
    ],
  },
  {
    kind: "p",
    text: `I presented the twenty-source map at [brightonSEO San Diego 2026](/research-and-talks/brightonseo-san-diego-2026) and wrote it up for [Previsible](${SRC.previsible}). [[g:Follow the need across sources]]: if it appears in queries, community threads, video comments and reviews, those views should inform one decision, not four departmental reports.`,
  },
  {
    kind: "embed",
    provider: "speakerdeck",
    title: `Slides: ${TALK.title}, ${EVENT}`,
    src: `${TALK.player}?slide=${UFI_SLIDES["twenty-demand-sources"].n}`,
    href: `${TALK.deck}?slide=${UFI_SLIDES["twenty-demand-sources"].n}`,
    poster: {
      src: UFI_SLIDES["twenty-demand-sources"].src,
      width: UFI_SLIDES["twenty-demand-sources"].width,
      height: UFI_SLIDES["twenty-demand-sources"].height,
      alt: UFI_SLIDES["twenty-demand-sources"].alt,
    },
    open: "Click through the deck from here",
    caption: "The slide as I presented it, five groups and twenty sources, with the deck behind it. Each moment below opens the talk's transcript where I walk through that part of the method.",
    chapters: [464, 480, 512, 557, 583, 633].map(chapter),
  },
  SAID("sources"),
  {
    kind: "details",
    summary: "Technical deep dive: collecting responsibly",
    blocks: [
      {
        kind: "list",
        items: [
          "**Public, licensed or consented only.** Respect each platform's terms and robots rules; never scrape private groups or messages.",
          "**Aggregate before you publish.** Report themes and counts, not people; strip names and handles from anything that leaves the analysis.",
          "**Archive the raw response, then parse.** A paid or rate-limited source cannot always be re-read, and fields discarded at parse time are gone.",
          "**Date-stamp every record** and keep the collection method beside it, so two runs can be compared like with like.",
          "**Count what came back empty.** A surface that produced nothing is a finding about coverage, not an absence of demand.",
        ],
      },
    ],
  },

  /* 7. Platform and format */
  { kind: "h2", id: "platform-and-format", text: "Which platform and which format for which persona?", toc: "Platform and format by persona" },
  {
    kind: "plain",
    text: "Different ages live on different platforms, and different needs want different formats. Use age as a starting guess, then check it against your own audience.",
  },
  {
    kind: "heatmap",
    corner: "Platform",
    columns: ["All adults", ...PEW.ages.map((a) => (a === "65+" ? "65 and older" : a.replace("-", " to ")))],
    rows: PEW.rows.map((r) => ({ label: r.label, values: [r.all, ...r.byAge] })),
    unit: "%",
    max: 100,
    caption: `Share of U.S. adults who say they ever use each platform: darker means more. Pew Research Center, ${PEW.title}, published ${longDate(PEW.published)}; ${PEW.sampleSize.toLocaleString("en-US")} adults surveyed ${longDate(PEW.fieldStart)} to ${longDate(PEW.fieldEnd)}. Ever use is not daily use, and use is not trust. More segments on the [persona data page](/personas/data).`,
  },
  {
    kind: "p",
    text: `[[b:Among adults aged 18 to 29, ${tiktok.byAge[0]}% use TikTok and ${snapchat.byAge[0]}% use Snapchat, against ${tiktok.byAge[3]}% and ${snapchat.byAge[3]}% of those 65 and older.]] So if your audience is 18 to 25, short video on TikTok and Snapchat may reach it far better than a blog post. [[g:Check the prior against your own analytics]]: the same persona may still finish the purchase after a search.`,
  },
  {
    kind: "cards",
    columns: 3,
    items: [
      { kicker: "Visual and quick", title: "How it looks, how to set it up", text: "A short vertical video where the persona already watches, linked to a page with the full steps." },
      { kicker: "Complex decision", title: "Plans, prices, trade-offs", text: "A comparison page with a clear table and honest trade-offs, written to be quoted by AI answers and found in search." },
      { kicker: "Lived experience", title: "Is it worth it? What went wrong?", text: "Useful answers in the communities where owners talk, plus first-hand reviews and case studies on your own site." },
      { kicker: "Local and now", title: "Open now, wait times, book a visit", text: "Accurate local listings, a working booking flow and a page about what to expect. Content alone will not fix a broken visit." },
      { kicker: "Professional buyer", title: "Buying for a team or a committee", text: "Long-form guides, data and talks on LinkedIn, in newsletters and at conferences, where professionals build trust." },
      { kicker: "An agent buys", title: "Compare, book or buy on the person's behalf", text: "Structured, machine-readable offers (schema.org markup, feeds, clear policies and prices) so an agent can verify every fact it needs." },
    ],
  },
  SLIDE(
    "five-personas-five-questions",
    "Same car, same city, five people. Each asks a different question, trusts different sources and is won by a different format. The community buyer, marked on the slide, was me.",
  ),
  SAID("notText"),

  /* 8. Industry map */
  { kind: "h2", id: "industry-map", text: "How do you build the industry map? Ontologies, knowledge graphs and intent", toc: "Ontologies and knowledge graphs" },
  {
    kind: "plain",
    text: "Before collecting anything, draw the shelves: the kinds of things in your industry and how they relate. Then every question, from any platform, lands on one shelf, and you can compare them.",
  },
  {
    kind: "stats",
    items: [
      { value: "5.56M", label: "raw queries collected", note: "one industry, many sources", tone: "sky" },
      { value: compact(T.keywords), label: "keywords kept and sized", note: "zero-volume included", tone: "violet" },
      { value: T.topics.toLocaleString("en-US"), label: "topics on the map", tone: "amber" },
      { value: String(T.categories.length), label: "top-level categories", tone: "emerald" },
    ],
    caption: `A whole industry, telecommunications, classified onto one designed map. The 5.56 million raw queries and the 37,712 topics were presented at brightonSEO San Diego 2026 and in the [Previsible write-up](${SRC.previsible}); the category totals below come from the same taxonomy export.`,
  },
  {
    kind: "tabs",
    tabs: [
      {
        label: "The map",
        blocks: [
          {
            kind: "radial",
            hub: "Telecom",
            nodes: T.categories.map((c) => ({ label: c.label, short: SHORT[c.label], value: c.keywords, dots: c.topics, display: `${compact(c.keywords)} keywords` })),
            caption: "Each circle is a top-level category, sized by its keywords; each dot around it is one of its second-level topics. Hover or tap a circle for its numbers.",
          },
        ],
      },
      {
        label: "By keywords",
        blocks: [
          {
            kind: "bars",
            items: T.categories.map((c, i) => ({ label: c.label, value: c.keywords, display: compact(c.keywords), note: `${c.topics} topics`, tone: (["sky", "violet", "amber", "rose", "emerald"] as const)[i % 5] })),
            caption: "Keywords classified into each top-level category, including keywords with zero reported volume.",
          },
        ],
      },
      {
        label: "By search volume",
        blocks: [
          {
            kind: "bars",
            items: [...T.categories]
              .sort((a, b) => b.monthlyVolume - a.monthlyVolume)
              .map((c, i) => ({ label: c.label, value: c.monthlyVolume, display: `${compact(c.monthlyVolume)} / mo`, tone: (["sky", "violet", "amber", "rose", "emerald"] as const)[i % 5] })),
            caption: `Summed estimated monthly searches per category (${compact(T.monthlyVolume)} across the industry). A vendor's estimate, so read it as relative size, not a census.`,
          },
        ],
      },
    ],
  },
  CLIP(
    "classify-the-queries",
    "The same map, presented on stage. A pile of queries proves nothing; classified onto personas and an industry map, it shows where to build. The platform on the slides is my own, shown to illustrate the method, not to sell it.",
  ),
  { kind: "h3", id: "ontology", text: "Ontology: design the classes before the data arrives" },
  {
    kind: "p",
    text: `An ontology defines what kinds of things exist in an industry and how they relate: products, problems, needs, places, people, providers. Design it top down, from broad category to specific need, with modifiers that cut across every branch. [[g:Write the competency questions first]], the questions the map must answer, such as "which storm-damage needs, in which towns, have no good answer?" ([Ren et al., 2014](${SRC.ren})). See the [ontology topic](/guides/topics/ontology).`,
  },
  {
    kind: "flow",
    steps: [
      { label: "Roofing", detail: "Industry" },
      { label: "Residential", detail: "Segment" },
      { label: "Repair", detail: "Service" },
      { label: "Storm damage", detail: "Problem" },
      { label: "Hail damage", detail: "Specific need" },
      { label: "Insurance claim", detail: "Task" },
    ],
    caption: "One path through a roofing ontology, from broad category to the task a person is trying to finish. Modifiers cut across every level: location, price, urgency, comparison.",
  },
  { kind: "termcard", termSlug: "industry-ontology" },
  { kind: "h3", id: "knowledge-graph", text: "Knowledge graph: connect the entities to everything around them" },
  {
    kind: "p",
    text: `A knowledge graph holds the specific entities (products, brands, places, conditions, competitors) and the links between them. Google brought the idea to search in 2012 as "things, not strings" ([Google, 2012](${SRC.googleKg})). In UFI the graph reaches past the company: [[y:an industrial context graph covers the industry and its adjacent markets]], so a rival arriving from next door appears on the same map. See the [knowledge graphs topic](/guides/topics/knowledge-graphs) and the [graph types guide](/guides/graph-types-for-ai-agents).`,
  },
  { kind: "termcard", termSlug: "industrial-context-graph" },
  { kind: "h3", id: "source-roles", text: "Source roles: keep evidence in its lane" },
  {
    kind: "p",
    text: "Each source gets exactly one role. **Structure** says what exists. **Coverage** says who answers. **Answerability** says whether the best answer is good enough. **Demand** says who asks. [[y:Coverage never counts as demand]]: that one rule prevents the most common error in content research, copying what competitors publish and calling it what people want.",
  },
  { kind: "termcard", termSlug: "source-role" },
  { kind: "h3", id: "intent", text: "Intent: why the person is asking" },
  {
    kind: "p",
    text: `Every record is classified twice: **where** it sits on the map, and **why** the person is asking: to research, compare, purchase, get support or reach something they already know. [Broder (2002)](${SRC.broder}) separated navigational, informational and transactional web searches; what is new is that the same words carry different intent in a search box, an AI assistant, a forum and a video comment, so UFI labels intent per surface and records [named entities](/notebook/ai/encyclopedia/named-entity) as it goes.`,
  },
  {
    kind: "details",
    summary: "Technical deep dive: the ontology and a competency question in code",
    blocks: [
      { kind: "p", text: "A fragment of an industry ontology in Turtle, then one competency question compiled to SPARQL. Both are sketches of the pattern, not a production schema." },
      {
        kind: "code",
        caption: "Ontology fragment (Turtle)",
        code: `@prefix ufi:  <https://venkatapagadala.com/ufi#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ufi:Need          a owl:Class .
ufi:StormDamage   a owl:Class ; rdfs:subClassOf ufi:Need .
ufi:HailDamage    a owl:Class ; rdfs:subClassOf ufi:StormDamage .
ufi:Town          a owl:Class .
ufi:Page          a owl:Class .

ufi:about     a owl:ObjectProperty ; rdfs:range ufi:Need .
ufi:inTown    a owl:ObjectProperty ; rdfs:range ufi:Town .
ufi:answers   a owl:ObjectProperty ; rdfs:domain ufi:Page ; rdfs:range ufi:Need .
ufi:role      a owl:ObjectProperty .   # structure | coverage | answerability | demand`,
      },
      {
        kind: "code",
        caption: "Competency question: which hail-damage needs, in which towns, have demand and no page that answers them? (SPARQL)",
        code: `PREFIX ufi:  <https://venkatapagadala.com/ufi#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?town ?need (COUNT(?ask) AS ?asks)
WHERE {
  ?ask  ufi:role ufi:Demand ; ufi:about ?need ; ufi:inTown ?town .
  ?need rdfs:subClassOf* ufi:HailDamage .
  FILTER NOT EXISTS {
    ?page ufi:role ufi:Coverage ; ufi:answers ?need ; ufi:inTown ?town .
  }
}
GROUP BY ?town ?need
ORDER BY DESC(?asks)`,
      },
      { kind: "p", text: `Two rates tell you whether the map works: the share of competency questions the ontology can express at all (schema pass rate), and the share the graph can actually answer (instance coverage). The open [ufi package](${SRC.repo}) reports both.` },
    ],
  },

  /* 9. Retrieval */
  { kind: "h2", id: "retrieval", text: "Where does retrieval fit? From embeddings to AI answers", toc: "Retrieval and AI answers" },
  {
    kind: "plain",
    text: "Retrieval means finding the closest matches fast. UFI uses it to sort millions of questions onto the map, and AI engines use it to decide which pages to read and cite.",
  },
  { kind: "h3", id: "retrieval-inside", text: "Inside: retrieval sorts demand onto the map" },
  {
    kind: "flow",
    steps: [
      { label: "Collect", detail: "Records with source, role and date" },
      { label: "Embed", detail: "Each record becomes a vector" },
      { label: "Retrieve", detail: "Nearest nodes on the map" },
      { label: "Decide", detail: "A model picks one, or none" },
      { label: "Check", detail: "Gold sample and review queue" },
      { label: "Map", detail: "Entity, intent, persona, stage" },
    ],
    caption: "Classification at scale, in two passes: retrieval narrows each record to a few candidates, then a model makes the call.",
  },
  {
    kind: "p",
    text: `[Embeddings](/notebook/ai/encyclopedia/embeddings) turn each question, review and post into a vector, and a [vector index](/notebook/ai/encyclopedia/vector-databases) finds the nearest nodes of the ontology in milliseconds. The expensive step, a model's decision, runs only on a handful of candidates, with the graph supplying each node's definition, neighbors and examples. [[y:This is retrieval-augmented generation turned inward]] ([Lewis et al., 2020](${SRC.lewis})): the pattern that grounds a chatbot in documents grounds a classifier in an industry map, and graph-based retrieval extends it to questions about the whole corpus ([Edge et al., 2024](${SRC.edge})). [[g:Sort into a map you designed rather than clustering]]: clusters describe the data you happened to collect, not the industry.`,
  },
  { kind: "h3", id: "retrieval-outside", text: "Outside: AI engines retrieve before they answer" },
  {
    kind: "fanout",
    root: "Which three-row SUV is best for a family with two car seats?",
    rootNote: "One question from one parent",
    branches: [
      "three-row SUV third-row legroom for adults",
      "car seat fit, three-row SUV, LATCH positions",
      "hybrid three-row SUV real-world fuel economy",
      "three-row SUV owner reviews, common problems",
      "best time of year to buy a three-row SUV",
      "three-row SUV insurance cost for a young family",
    ],
    caption: "Query fan-out, illustrated: the kind of sub-searches an engine issues for one question. Examples, not a capture of any engine's real queries.",
  },
  {
    kind: "p",
    text: `Google describes its AI Mode as using a **query fan-out** technique: it breaks a question into subtopics and issues many searches at once on the person's behalf ([Google, 2025](${SRC.googleAiMode})). [[y:A brand is chosen by the sub-questions, not only the head question]], and each engine reads different kinds of sources, so [[g:map how each need fans out]] (try the [Fan-out Journey](/personas/fanout-journey)) and measure presence answer surface by answer surface.`,
  },
  SLIDE(
    "what-each-engine-retrieved",
    "My own question about a car, asked of four engines in 2026. Each one went to different sources before answering: a Facebook group, Reddit threads, dealer pages. One engine's result says little about the others.",
    421,
  ),
  { kind: "termcard", termSlug: "answer-surface" },
  {
    kind: "details",
    summary: "Technical deep dive: two-pass classification in code",
    blocks: [
      {
        kind: "code",
        caption: "Pass 1 retrieves, pass 2 decides, a gold sample checks (Python-style sketch)",
        code: `# Pass 1: retrieval narrows each record to a few candidate nodes
q = embed(record.text)                        # one vector per record
candidates = index.search(q, k=8)             # cosine similarity over node vectors

# Pass 2: a model decides, with the graph's context and a fixed output schema
context = [graph.describe(node) for node in candidates]   # definition, neighbors, examples
label = llm.classify(
    text=record.text,
    candidates=context,
    schema={
        "node": "one of the candidates, or NONE",
        "intent": ["research", "compare", "purchase", "support", "navigate"],
        "confidence": "0 to 1",
        "reason": "one sentence",
    },
)

# Quality: agreement with a gold sample labeled by people
kappa = cohen_kappa(gold.labels, model.labels)   # report with n and an interval`,
      },
      { kind: "p", text: "Cosine similarity, cos(q, n) = q·n / (‖q‖ ‖n‖), ranks the candidates. Allowing **NONE** stops forced labels; rejected records go to a review queue, and recurring rejects show where the map needs a new node. Cost stays flat as the ontology grows, because the model only ever sees the few candidates retrieval hands it." },
    ],
  },

  /* 10. Gaps */
  { kind: "h2", id: "gaps", text: "How do you find the gaps that matter?", toc: "Finding the gaps" },
  {
    kind: "plain",
    text: "A gap is something people clearly need that nobody answers well where they look. Find them by comparing demand with what you, your competitors and the best answers already cover.",
  },
  {
    kind: "matrix",
    x: "How much people need it",
    y: "How well it is answered",
    quadrants: {
      tl: { title: "Maintain or prune", text: "Well answered, little need. Keep it accurate; do not invest more." },
      tr: { title: "Defend", text: "Big need, well answered. Keep it fresh and watch the competitors." },
      bl: { title: "Watch", text: "Little need, little coverage. Early signals can move it right." },
      br: { title: "Close the gap", text: "Big need, poorly answered. This is where to build, publish or fix first.", highlight: true },
    },
    caption: "The gap matrix: every node on the map lands in one quadrant, per answer surface.",
  },
  {
    kind: "p",
    text: `Gaps are an outcome of **query discovery**, the framework's first task: [[y:find the questions people ask about the industry's entities, on any surface and in their own words, before deciding which to answer]]. A **Content Gap Score** turns the comparison into a ranking; its open reference implementation is published on [GitHub](${SRC.repo}).`,
  },
  { kind: "h3", id: "gaps-ai-answers", text: "Evidence 1: who AI answers cite" },
  {
    kind: "stats",
    items: [
      { value: A.prompts.toLocaleString("en-US"), label: "prompts in one topic", tone: "sky" },
      { value: A.answers.toLocaleString("en-US"), label: "AI answers read", tone: "violet" },
      { value: `${S.platforms}%`, label: "of citations went to third-party platforms", tone: "amber" },
      { value: `${S.brands}%`, label: `went to the ${A.brands.length} leading brands combined`, tone: "emerald" },
    ],
  },
  {
    kind: "tabs",
    tabs: [
      {
        label: "Who gets cited",
        blocks: [
          {
            kind: "bars",
            max: 55,
            items: [
              { label: "Third-party platforms", value: S.platforms, display: `${S.platforms}%`, note: "YouTube, Reddit, Wikipedia, Medium, LinkedIn, Stack Overflow, Google", tone: "amber" },
              { label: `The ${A.brands.length} leading brands`, value: S.brands, display: `${S.brands}%`, note: "brands masked", tone: "emerald" },
              { label: "Brand pages outside the tracked set", value: S.brandOwned, display: `${S.brandOwned}%`, tone: "violet" },
              { label: "Everything else", value: S.rest, display: `${S.rest}%`, note: "the long tail of sites", tone: "muted" },
            ],
          },
        ],
      },
      {
        label: "Third-party sources",
        blocks: [
          {
            kind: "bars",
            items: A.sources.filter((s) => s.group === "platform").map((s) => ({ label: s.label, value: s.share, display: `${s.share}%`, tone: "amber" as const })),
          },
        ],
      },
      {
        label: "Brands (masked)",
        blocks: [
          {
            kind: "bars",
            items: A.brands.map((b) => ({ label: b.label, value: b.share, display: `${b.share.toFixed(1)}%`, tone: "emerald" as const })),
          },
        ],
      },
    ],
  },
  {
    kind: "p",
    text: `[[b:YouTube alone took ${S.youtube}% of all citations, twice the leading brand's ${S.leader}%]], and third-party platforms together out-cited the ${A.brands.length} leading brands combined. [[g:Be present where the engines read]]: the video, the community answer and the reference entry, not only your own pages. Brand names are masked; the platforms are named because they are the finding.`,
  },
  {
    kind: "callout",
    title: "About this data",
    text: `One topic in an ${A.vertical} vertical, ${A.market}, all AI platforms in the index, non-brand prompts. Shares are of all cited sources, computed ${longDate(A.computed)} from a commercial AI-citation index for the author's research. Treat it as one topic's picture, not a law.`,
  },
  { kind: "h3", id: "gaps-reviews", text: "Evidence 2: what customers praise and what they complain about" },
  {
    kind: "stats",
    items: [
      { value: R.total.toLocaleString("en-US"), label: "store reviews", tone: "sky" },
      { value: R.withText.toLocaleString("en-US"), label: `with text (${Math.round((R.withText / R.total) * 100)}%)`, tone: "violet" },
      { value: `${reviewShare(R.praise[0].mentions)}%`, label: `top praise: ${R.praise[0].label.toLowerCase()}`, tone: "emerald" },
      { value: `${reviewShare(R.complaints[0].mentions)}%`, label: `top complaint: ${R.complaints[0].label.toLowerCase()}`, tone: "rose" },
    ],
  },
  {
    kind: "tabs",
    tabs: [
      {
        label: "Topics",
        blocks: [
          {
            kind: "bars",
            max: 45,
            items: R.topics.map((t) => ({ label: t.label, value: reviewShare(t.mentions), display: `${reviewShare(t.mentions)}% · ${rating(t.rating)}`, tone: "sky" as const })),
            caption: "Share of reviews with text that mention each topic, with those reviews' average star rating.",
          },
        ],
      },
      {
        label: "Praise",
        blocks: [
          {
            kind: "bars",
            max: 45,
            items: R.praise.map((t) => ({ label: t.label, value: reviewShare(t.mentions), display: `${reviewShare(t.mentions)}% · ${rating(t.rating)}`, tone: "emerald" as const })),
          },
        ],
      },
      {
        label: "Complaints",
        blocks: [
          {
            kind: "bars",
            max: 5,
            items: R.complaints.map((t) => ({ label: t.label, value: reviewShare(t.mentions), display: `${reviewShare(t.mentions)}% · ${rating(t.rating)}`, tone: "rose" as const })),
            caption: "Complaints are rare but severe: each bar is a small share of reviews, and most of those reviews average below 2.5 stars.",
          },
        ],
      },
    ],
  },
  {
    kind: "p",
    text: `[[b:The top complaint, ${R.complaints[0].label.toLowerCase()}, appears in ${reviewShare(R.complaints[0].mentions)}% of reviews, and those reviews average ${R.complaints[0].rating} stars; long waits appear in ${reviewShare(R.complaints[1].mentions)}% and average ${R.complaints[1].rating}.]] No blog post fixes a wait. [[g:Fix the experience first]]: digital check-in and in-app appointments, then a page that tells people what to expect and how to book. Reviews of one U.S. telecom retailer's stores; the retailer is not named, and themes were assigned by a classifier, several per review where they apply.`,
  },
  SLIDE(
    "pain-point-to-product",
    "The same review themes as I presented them, with the long-wait row boxed: the pain point became two product ideas, not an article.",
    761,
  ),
  SAID("painPoints"),
  {
    kind: "details",
    summary: "Technical deep dive: the Content Gap Score",
    blocks: [
      { kind: "p", text: "The score ranks entities on the map. Every term comes from one source role, so coverage can never pose as demand, and reported search volume is not an input at all." },
      {
        kind: "code",
        caption: "From the open ufi package's README",
        code: `prior(e) = β·rel(e) + (1 − β)·dem(e)
CGS(e)   = prior(e) · (1 − own(e)) · [ α·(1 − cov_K(e)) + (1 − α)·mean_q(1 − ans(q,e)) ]

rel(e)    topic-sensitive PageRank over the structure graph, rank-normalized    (structure)
dem(e)    rank-normalized count of user questions linked to e                   (demand)
own(e)    the organization's own coverage, graded 0, ½ or 1                     (coverage)
cov_K(e)  mean of the same grade over the competitor set K                      (coverage)
ans(q,e)  whether the web answers competency question q about e                 (answerability)`,
      },
      { kind: "p", text: "α moves weight between the two deficits; β between structure and demand. The first bracket term is the instance gap (nobody covers this entity), the second the schema gap (nobody answers this question about it); they are reported separately because they call for different content. The score is a specification: no published study has yet tested what it predicts." },
    ],
  },

  /* 11. Migration */
  { kind: "h2", id: "audience-migration", text: "How do you see where the audience is moving?", toc: "Where audiences move" },
  {
    kind: "plain",
    text: "Audiences move from one platform to another, sometimes in a year. A snapshot hides it; watching the same numbers over time shows it early.",
  },
  {
    kind: "pair",
    blocks: [
      {
        kind: "slope",
        title: "India: monthly visitors, millions",
        from: M.india.from,
        to: M.india.to,
        unit: "M",
        series: [
          { label: "Orkut", from: M.india.orkut.from, to: M.india.orkut.to, tone: "violet" },
          { label: "Facebook", from: M.india.facebook.from, to: M.india.facebook.to, tone: "sky" },
        ],
        caption: `[comScore, 2010](${SRC.comscore}): Facebook took the top spot in July 2010.`,
      },
      {
        kind: "slope",
        title: "U.S. teens who use each site",
        from: M.teens.from,
        to: M.teens.to,
        unit: "%",
        series: [
          { label: "Facebook", from: M.teens.facebook.from, to: M.teens.facebook.to, tone: "sky" },
          { label: "X", from: M.teens.x.from, to: M.teens.x.to, tone: "rose" },
        ],
        caption: `[Pew Research Center, 2024](${SRC.pewTeens2024}): teens aged 13 to 17.`,
      },
    ],
  },
  { kind: "p", text: "UFI watches the persona and platform links over time, and a short list of early signals:" },
  {
    kind: "cards",
    columns: 3,
    items: [
      { kicker: "Signal", title: "New words", text: "Terms that appear in people's questions before any tool reports volume for them." },
      { kicker: "Signal", title: "Rising mentions", text: "A product, a problem or a platform named more often in communities and reviews." },
      { kicker: "Signal", title: "Entrants from below", text: "Cheaper, simpler offers that start with customers the leaders ignore: Clayton Christensen's disruptive innovation." },
      { kicker: "Signal", title: "Convergence from beside", text: "Products from an adjacent market that start to answer the same need, the way the phone absorbed the camera." },
      { kicker: "Signal", title: "Company moves", text: "Earnings calls, job postings and patents that show where competitors are investing." },
      { kicker: "Signal", title: "Answer drift", text: "AI engines that start citing different sources for the same need." },
    ],
  },
  SAID("movingTarget"),
  { kind: "termcard", termSlug: "audience-migration" },

  /* 12. Personalization */
  { kind: "h2", id: "personalization", text: "What happens when every result is personal?", toc: "Personalization and agents" },
  {
    kind: "plain",
    text: "Your results are not my results, and AI answers change even between two tries. So stop chasing one position, and know your people well enough to be present wherever their answers come from.",
  },
  {
    kind: "p",
    text: `Search results already vary from person to person, and AI answers vary more. [[b:A 2013 audit of Google found that personalization changed about 11.7% of results on average]], driven mainly by being signed in and by location ([Hannak et al., 2013](${SRC.hannak})). AI assistants compose their answers instead of ranking pages: ask the same question twice and the answer, and its sources, can change, and researchers at OpenAI found that a chatbot's responses can differ with nothing more than the user's name ([Eloundou et al., 2025](${SRC.eloundou})). As assistants remember more about each user, that variation will grow.`,
  },
  { kind: "quote", text: "What your tools see is not what your users see.", ...ME },
  {
    kind: "split",
    left: {
      title: "What a rank tracker sees",
      items: ["One query, one phrasing", "One location, signed out", "One results page, one position", "A snapshot of a moving target"],
    },
    right: {
      title: "What User-First Intelligence measures",
      items: [
        "Each persona's questions, in their own words",
        "Every engine and surface they use",
        "Presence and citations across repeated runs",
        "Outcomes: tasks finished, sales, customers kept",
      ],
    },
  },
  { kind: "p", text: "Here is where I think this goes. [[y:These are predictions, not findings]]:" },
  {
    kind: "cards",
    columns: 2,
    items: [
      { kicker: "Prediction 1", title: "Position will matter less, presence more", text: "When every result is personal there is no single rank to win. What a brand controls is whether it is present, and trusted, in the sources each engine reads for each persona.", tone: "sky" },
      { kicker: "Prediction 2", title: "Optimize for the persona, not the position", text: "The stable unit is not a keyword at rank three. It is a need, held by a persona, on a platform, and it survives personalization because it describes the person.", tone: "violet" },
      { kicker: "Prediction 3", title: "Personal agents will standardize demand, not end it", text: "When people hand tasks to their own agents (a flight that lands before noon, a checked bag, under $500), the agents ask in patterns their principals set. Needs repeat across a persona. [[g:Publish offers an agent can verify.]]", tone: "amber" },
      { kicker: "Prediction 4", title: "Measurement moves to panels and outcomes", text: "Teams will sample answers through persona panels, prompts in each persona's words run across engines, and judge success by completed tasks and revenue.", tone: "emerald" },
    ],
  },
  { kind: "quote", text: "Agents gather. People decide.", ...ME },
  CLIP(
    "agents-do-the-gathering",
    "How I run it today: declared agents, each with a role, sources and checks, doing most of the gathering and classifying, and a person verifying what they produce. The percentage is my own estimate of my own work, not a benchmark.",
  ),
  {
    kind: "details",
    summary: "Technical deep dive: measuring answers when results are personal",
    blocks: [
      {
        kind: "list",
        items: [
          "**Build a persona panel.** For each persona and need, write prompts in that persona's own words (from the demand log, not from a keyword list), with the context they would give an assistant.",
          "**Repeat runs.** Run every prompt on every engine several times; a single run of a generative answer is an anecdote.",
          "**Measure presence with an interval.** Presence rate = runs that cite you ÷ runs; report a Wilson interval so small panels do not overclaim.",
          "**Measure stability.** Jaccard overlap of cited domains between runs and between engines, J(A, B) = |A ∩ B| ÷ |A ∪ B|, shows how much the answer moves.",
          "**Watch drift.** Re-run the same panel on a schedule; a falling presence rate with a stable panel is answer drift, not a change in demand.",
        ],
      },
    ],
  },

  /* 13. Method */
  { kind: "h2", id: "method", text: "How do you run a User-First Intelligence study?", toc: "Run a UFI study" },
  {
    kind: "plain",
    text: "Seven steps from a business question to a decision. A small business can do it in a week with a spreadsheet; a large one runs it continuously with agents.",
  },
  { kind: "timeline", items: METHOD.map((s, i) => ({ date: `Step ${i + 1}`, title: s.name, text: s.text })) },
  SAID("atScale"),

  /* 14. LinkedIn example */
  { kind: "h2", id: "example-linkedin", text: "Worked example: my LinkedIn, mapped as a knowledge graph", toc: "Example: LinkedIn graph" },
  {
    kind: "plain",
    text: "I ran the framework on my own posts: sorted ten years of them onto a map you can explore right here, then compared what I write most with what my readers respond to most.",
  },
  {
    kind: "universe",
    poster: {
      src: "/guides/user-first-intelligence/linkedin-universe.webp",
      width: 1600,
      height: 999,
      alt: "The Venkata Pagadala Universe: ten years of LinkedIn posts drawn as a knowledge graph, with clusters for SEO, AI, events, building, data, AI search, marketing, news, life and career",
    },
    caption: `Live: the [Venkata Pagadala Universe](${L.source}), ${L.posts} posts and ${L.articles} articles on a designed taxonomy of ${L.areas} areas, ${L.topics} topics and ${L.subtopics} subtopics, with ${L.entities} named entities; ${L.graphNodes.toLocaleString("en-US")} nodes and ${L.graphLinks.toLocaleString("en-US")} links. Drag it, or swipe sideways on a phone, to turn it; tap a star to open the post.`,
  },
  {
    kind: "cards",
    columns: 2,
    items: [
      { kicker: "Stars", title: "Each star is one thing I shared", text: "Every post and article since 2016, with the videos, images and documents inside them. Bigger and brighter means more of it.", tone: "sky" },
      { kicker: "Clusters", title: "Each cluster is an area of the map", text: "The ten areas of a designed taxonomy (SEO and search, AI and LLMs, events, building, data, AI search and more), each split into topics and subtopics. Lines join each post to its topics, so overlaps show.", tone: "violet" },
      { kicker: "Try it", title: "Turn it, search it, open a post", text: "Drag, or swipe sideways on a phone, to turn it. Search for any word, pick a topic level, or tap a star to read the post it stands for.", tone: "amber" },
      { kicker: "In UFI terms", title: "Classify first, then compare", text: "[[y:The taxonomy is the industry map, every post is a record placed on it, and reactions are the audience's demand signal.]] The two charts below compare what I supply with what readers answer.", tone: "emerald" },
    ],
  },
  {
    kind: "pair",
    blocks: [
      {
        kind: "bars",
        title: "What I published (posts, 12 months)",
        items: L.rows.map((r) => ({ label: r.label, value: r.posts, display: String(r.posts), href: `/venkata-pagadala-universe/topics/${r.slug}`, tone: "sky" as const })),
      },
      {
        kind: "bars",
        title: "What readers answered (median reactions)",
        items: L.rows.map((r) => ({ label: r.label, value: r.medianReactions, display: String(r.medianReactions), tone: (r.medianReactions > L.medianReactions ? "emerald" : "rose") as Tone })),
        caption: `Green: above my median post overall (${L.medianReactions}); red: below it.`,
      },
    ],
  },
  {
    kind: "p",
    text: `[[b:${linkedinReading}]] ${small.length ? `${joinAnd(small)} had fewer than ten posts each, too few to read. ` : ""}[[g:The decision is not to stop writing about AI]]; it is to write about AI the way the stronger areas work: through things I built, data I measured and lessons a reader can use. Posts published ${longDate(L.windowStart)} to ${longDate(L.reactionsAsOf)}, reactions counted on ${longDate(L.reactionsAsOf)}; a post can sit in more than one area. Descriptive, not causal.`,
  },
  { kind: "quote", text: "Supply is not demand, even on one profile.", ...ME },

  /* 15. Personas example */
  { kind: "h2", id: "example-personas", text: "Worked example: evidence-graded personas on this site", toc: "Example: graded personas" },
  {
    kind: "plain",
    text: "Every line on a persona says how sure we are: measured by a study, borrowed from a wider group, or just an assumption to test.",
  },
  {
    kind: "traits",
    title: persona.name,
    subtitle: persona.segment,
    href: `/personas/${persona.slug}`,
    items: persona.traits.map((t) => ({ label: t.label, value: t.value, grade: t.grade })),
    caption: "Notice the inferred lines. My own story (trusting owners in a Facebook group over sales pages) is one person's experience; on the card it stays an assumption until a study measures it. That is the point of grading.",
  },
  {
    kind: "p",
    text: `The [personas on this site](/personas) are built this way, from ${P.studies} named studies with published methods, samples and field dates: ${P.measuredTraits} traits measured and ${P.inferredTraits} inferred, shown rather than hidden. Behind them, the [Global Persona Framework](/personas/framework) (version of ${P.frameworkVersion}) lists ${P.frameworkDimensions} dimensions in ${P.frameworkFamilies} families, and states its own rule: [[y:identity does not determine behavior or interests]]. The [Persona Builder](/personas/builder) turns the framework's questions into a brief, and the [Fan-out Journey](/personas/fanout-journey) shows one persona's need becoming dozens of questions across a purchase.`,
  },

  /* 16. Measure */
  { kind: "h2", id: "measure", text: "How do you measure User-First Intelligence?", toc: "How to measure it" },
  { kind: "plain", text: "Measure what changed for people and for the business first. Rankings still count where they exist; they are no longer the scoreboard." },
  {
    kind: "cards",
    columns: 3,
    items: [
      { kicker: "Outcomes", title: "Tasks, sales, customers kept", text: "Qualified visits, leads, sales and retention, traced to the decisions the study produced.", tone: "emerald" },
      { kicker: "Coverage", title: "Priority nodes answered well", text: "The share of priority nodes you answer well, per answer surface: results, AI answers, video, communities, reviews.", tone: "sky" },
      { kicker: "Map quality", title: "Questions the map can answer", text: "The share of competency questions the ontology can express, and the share the graph actually answers.", tone: "violet" },
      { kicker: "Classification", title: "Agreement with people", text: "Agreement with a gold sample checked by people, reported with its sample size.", tone: "amber" },
      { kicker: "Evidence", title: "Measured, not inferred", text: "The share of persona traits and claims that are measured, and how old the evidence is.", tone: "rose" },
      { kicker: "Instruments", title: "One figure per instrument", text: "Volume and traffic estimates from different tools are different models. [[g:Compare like with like and never mix them in one chart.]]", tone: "fg" },
    ],
  },

  /* 17. Origin */
  { kind: "h2", id: "origin", text: "Where did User-First Intelligence come from?", toc: "Where UFI came from" },
  { kind: "plain", text: "From a decade of search work and a habit of starting with the user, written down in public along the way." },
  {
    kind: "timeline",
    items: [
      { date: "August 2024", title: "User-First Optimization", text: `I described programmatic SEO as [UFO, User-First Optimization](${POST("2024-08-22-programmatic-seo-pseo-ufo-user-first-optimization-rich")}), plus rich data, plus scaled implementation: what value do you give the user that is better than your competitors?` },
      { date: "April 2025", title: "Users stay constant", text: `[UFO became my stated strategy](${POST("2025-04-20-ufo-user-first-focused-optimization-is-my-strategy")}): algorithms, devices and results pages come and go; users stay constant, whether the engine is a search engine or an answer engine.` },
      { date: "September 2026", title: "User first, algorithm second", text: `At brightonSEO San Diego I presented [Industrial Level Classification with Intent](/research-and-talks/brightonseo-san-diego-2026): industry-wide demand research connecting queries, including zero-volume ones, to personas, intent and pain points. The [slides](${SRC.slides}), the [write-up on Previsible](${SRC.previsible}) and a [recap post](${POST("2026-09-17-brightonseo-2026-san-diego-usa")}) are public.` },
      { date: "October 2026", title: "User-First Intelligence, named and specified", text: `The framework took its name, and an open reference implementation of its Content Gap Score was published on [GitHub](${SRC.repo}).` },
      { date: longDate("2026-10-23"), title: `This reference guide, version ${UFI_VERSION}`, text: "A research paper and a book on User-First Intelligence are in preparation. Until they are out, this page is the framework's public reference; it is versioned, and changes will be noted here. UFI is my independent work, not a product or a position of my employer." },
    ],
  },

  {
    kind: "p",
    text: `I first presented the method on ${longDate(TALK.date)}, in ${TALK.track} at ${EVENT}, under the line "${TALK.tagline}". This is the recording, with the slides and the room as they were that morning.`,
  },
  {
    kind: "embed",
    provider: "linkedin",
    title: `Full recording: ${TALK.title}, ${EVENT}`,
    src: TALK.video.embed,
    href: TALK.video.post,
    poster: {
      src: TALK.video.poster,
      width: 1920,
      height: 1080,
      alt: `${TALK.title}, ${EVENT}: the twenty demand sources slide beside Venkata Pagadala on the ${TALK.track} stage`,
    },
    open: `Play the full talk here (${Math.round(TALK.video.duration / 60)} min)`,
    caption: "LinkedIn's player loads only when you open it. Each moment below opens the talk's transcript at that point.",
    chapters: [135, 291, 389, 464, 660, 827].map(chapter),
  },
  {
    kind: "gallery",
    label: "Photos from the talk",
    items: UFI_PHOTOS.map((ph) => ({ ...ph })),
    caption: `On stage in ${TALK.track}. More photos, the slides and everyone who showed up are on the [talk's recap page](${TALK.page}).`,
  },

  /* 17b. What practitioners said */
  { kind: "h2", id: "practitioners", text: "What did practitioners say when they heard it?", toc: "What practitioners said" },
  {
    kind: "plain",
    text: "Before and after the talk, people who work in search wrote about it in public. These are their own words, each linked to the post it came from.",
  },
  {
    kind: "stats",
    items: [
      { value: String(UFI_PEERS.posts), label: `public posts by ${UFI_PEERS.authors} people and pages named the talk`, tone: "sky" },
      { value: UFI_PEERS.reactions.toLocaleString("en-US"), label: "reactions on those posts", tone: "violet" },
      { value: String(UFI_PEERS.comments), label: "comments on those posts", tone: "amber" },
      { value: String(UFI_PEERS.people), label: "people thanked by name on the recap page", tone: "emerald" },
    ],
    caption: `Counted on ${longDate(UFI_PEERS.captured)} from public LinkedIn posts that name me in the brightonSEO context. LinkedIn's counts keep moving; my own posts are not included.`,
  },
  {
    kind: "voices",
    items: UFI_PEERS.items.map((v) => ({ ...v })),
    caption: `Quoted as posted. Every post and every name is on the [${EVENT} thank-you page](${TALK.page}).`,
  },

  /* 18. Related ideas */
  { kind: "h2", id: "related-work", text: "How does User-First Intelligence relate to existing ideas?", toc: "Related ideas" },
  { kind: "plain", text: "It stands on decades of well-tested ideas and combines them into one working system." },
  {
    kind: "timeline",
    items: [
      { date: "1986", title: "User-centered design", text: "Norman and Draper put the user at the center of system design. UFI applies that stance to demand research and content." },
      { date: "1999", title: "Personas", text: "Alan Cooper made users concrete for product teams. UFI grades every persona trait by its evidence." },
      { date: "2002", title: "A taxonomy of web search", text: `[Broder](${SRC.broder}) separated navigational, informational and transactional searches: intent, classified.` },
      { date: "2010", title: "People ask their networks", text: `[Morris, Teevan and Panovich](${SRC.morris}) showed people put questions to their social networks, not only to search engines.` },
      { date: "2012", title: "Market structure from text", text: `[Netzer, Feldman, Goldenberg and Fresko](${SRC.netzer}) mapped a market's structure from forum text.` },
      { date: "2014", title: "Competency questions", text: `[Ren et al.](${SRC.ren}) used competency questions to decide what an ontology must answer.` },
      { date: "2016", title: "Jobs to be done; competition from search data", text: `Christensen, Hall, Dillon and Duncan asked what a customer hires a product to do; [Ringel and Skiera](${SRC.ringel}) mapped competition among more than a thousand products from search data.` },
      { date: "2019", title: "Customer needs from user-generated content", text: `[Timoshenko and Hauser](${SRC.timoshenko}) found customer needs in user-generated content with machine learning.` },
      { date: "2024", title: "Generative engine optimization", text: `[Aggarwal et al.](${SRC.aggarwal}) studied how sources gain visibility in AI-generated answers; Google's [people-first content](${SRC.peopleFirst}) guidance points the same way.` },
      { date: "2026", title: "User-First Intelligence", text: "[[y:The combination, run as one system]]: a designed industry map every demand source lands on; evidence with roles and grades; persona, platform and format decided together; agents at scale; and a loop that watches where people move.", tone: "emerald" },
    ],
  },

  /* 19. FAQ and citation */
  /* 19b. Watch, read and try */
  { kind: "h2", id: "watch-read-try", text: "Where can you watch, read and try User-First Intelligence?", toc: "Watch, read and try it" },
  {
    kind: "plain",
    text: "Recorded conversations where I work through these ideas, tools on this site that run parts of the method, and the papers behind it.",
  },
  { kind: "h3", id: "conversations", text: "Conversations about the ideas" },
  {
    kind: "episodes",
    items: UFI_EPISODES.map((e) => ({ ...e, why: EPISODE_LINKS[e.youtubeId] })),
    caption: "Each player loads from YouTube only when you press play.",
  },
  { kind: "h3", id: "tools", text: "Tools you can use today" },
  {
    kind: "p",
    text: "The [LinkedIn knowledge graph](#example-linkedin) above is one live tool. These four run the persona side of the method, in your browser, on public data.",
  },
  {
    kind: "tools",
    items: [
      {
        title: "Persona Builder",
        text: "Answer the framework's follow-up questions and grade the evidence for each answer as you go. You get a persona brief with no invented biography.",
        href: UFI_TOOL_SHOTS["persona-builder"].path,
        image: { ...UFI_TOOL_SHOTS["persona-builder"] },
        alt: "Screenshot of the Persona Builder on this site: a starter path, the framework's questions and the composite persona brief beside them",
        cta: "Build a persona",
      },
      {
        title: "Persona Fanout Journey",
        text: "One starting query, fanned out by persona scenario and by every stage of the buyer's journey. Every question says which inputs produced it and how to check it.",
        href: UFI_TOOL_SHOTS["fanout-journey"].path,
        image: { ...UFI_TOOL_SHOTS["fanout-journey"] },
        alt: "Screenshot of the Persona Fanout Journey: one query about buying a car, fanned out by buyer scenario and journey stage into specific questions",
        cta: "Fan out a query",
      },
      {
        title: "Global Persona Framework",
        text: `The classification library behind the personas: ${UFI_PERSONAS.frameworkDimensions} dimensions in ${UFI_PERSONAS.frameworkFamilies} families, each with its definition, its follow-up question and the evidence a value needs.`,
        href: UFI_TOOL_SHOTS["persona-framework"].path,
        image: { ...UFI_TOOL_SHOTS["persona-framework"] },
        alt: "Screenshot of the Global Persona Framework page: the library's rules of use and its dimensions",
        cta: "Browse the framework",
      },
      {
        title: "Audience Personas",
        text: "Personas where every trait is graded measured, derived or inferred, and links to the study behind it. Build anyone and see where they actually are.",
        href: UFI_TOOL_SHOTS["personas"].path,
        image: { ...UFI_TOOL_SHOTS["personas"] },
        alt: "Screenshot of the Audience Personas page: a persona built from published figures, with the platforms where people like them are",
        cta: "See the personas",
      },
    ],
  },
  { kind: "h3", id: "papers", text: "Research papers" },
  {
    kind: "papers",
    items: UFI_PAPERS.map((pp) => ({ ...pp })),
    request: {
      title: "Ask for the working paper",
      text: "The User-First Intelligence paper and a book are in preparation. Researchers, editors and practitioners can ask me for the working paper. If you publish books on marketing, research or AI and would like to talk about the book, write to me directly.",
      href: `mailto:${PROFILE.email}?subject=${encodeURIComponent("User-First Intelligence: working paper request")}`,
      label: "Request the paper",
    },
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
      { label: "Pew Research Center (2024). Teens, Social Media and Technology 2024", href: SRC.pewTeens2024, note: "Facebook use among U.S. teens: 71% in 2014-15, 32% in 2024; X: 33% to 17%." },
      { label: "comScore (2010). Facebook captures top spot among social networking sites in India", href: SRC.comscore, note: "July 2009 to July 2010: Facebook 7.5 to 20.9 million monthly visitors; Orkut 17.1 to 19.9 million." },
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
  readingTime: "38 min read",
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
