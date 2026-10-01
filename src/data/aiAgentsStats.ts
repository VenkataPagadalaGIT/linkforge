/**
 * aiAgentsStats.ts: the single source of truth for /notebook/ai/agents,
 * the living "AI agent statistics" reference page.
 *
 * The contract that makes this page citable:
 *   - Every row was verified by actually fetching the source and seeing the
 *     number. Nothing is quoted from memory or from aggregator listicles.
 *   - Every row carries the date the number refers to (asOf), not the date
 *     we found it.
 *   - Every row is honest about what KIND of number it is. A vendor survey,
 *     an analyst forecast, and a company's own press release are not the
 *     same thing, and the page labels them differently.
 *   - Killed stats stay killed: AGENTS_DO_NOT_ASSERT lists numbers that
 *     failed verification so a future monthly refresh never resurrects one.
 *
 * Monthly refresh: append a new entry to AGENTS_MONTHS (newest first),
 * update rows whose sources have newer editions (bump asOf), bump
 * AGENTS_LAST_UPDATED, and record what changed in that month's `changes`.
 * The page renders entirely from this file.
 */

export type StatKind =
  | "survey"
  | "projection"
  | "company_claim"
  | "benchmark"
  | "funding"
  | "market_estimate";

export const KIND_LABEL: Record<StatKind, string> = {
  survey: "survey",
  projection: "forecast",
  company_claim: "company claim",
  benchmark: "benchmark",
  funding: "funding",
  market_estimate: "market estimate",
};

export interface AgentStat {
  stat: string;
  value: string;
  /** The period the number refers to, e.g. "2026-08" or "Q2 2026". */
  asOf: string;
  source: string;
  url: string;
  kind: StatKind;
}

export interface StatTable {
  id: string;
  /** Question-form heading, the way a reader actually asks it. */
  question: string;
  blurb?: string;
  rows: AgentStat[];
}

export interface HeroStat {
  label: string;
  value: string;
  asOf: string;
  source: string;
  url: string;
}

export interface MonthEntry {
  /** e.g. "August 2026" */
  month: string;
  narrative: string[];
  changes: string[];
}

export const AGENTS_LAST_UPDATED = "2026-08-29";
export const AGENTS_FIRST_PUBLISHED = "2026-08-29";

/** Snippet-shaped opening answer. Filled from the verified synthesis. */
export const AGENTS_HEADLINE =
  "AI agents crossed from pilots to production in 2026. Among large enterprises (over $1 billion in revenue), 40% now report scaling AI agents in at least one business function, up from 27% a year earlier (McKinsey, published Aug 25, 2026), and 57.3% of organizations surveyed by LangChain have agents running in production. The money is keeping pace: Salesforce's Agentforce passed $1.5 billion in ARR, up over 240% year over year (Aug 26, 2026), and Anthropic's Claude Code passed a $2.5 billion revenue run rate. The caution flag is just as concrete: Gartner predicts over 40% of agentic AI projects will be canceled by the end of 2027.";

export const AGENTS_HERO: HeroStat[] = [
  {
    label: "Large enterprises ($1B+ revenue) scaling AI agents in one or more functions",
    value: "40%, up from 27% last year",
    asOf: "Q2 2026 (published 2026-08-25)",
    source: "McKinsey, The State of AI in 2026 (n=1,719)",
    url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
  },
  {
    label: "Organizations with AI agents in production",
    value: "57.3% (up from 51% the prior year)",
    asOf: "Survey fielded Nov 18 - Dec 2, 2025 (n=1,340)",
    source: "LangChain, State of Agent Engineering",
    url: "https://www.langchain.com/state-of-agent-engineering",
  },
  {
    label: "Salesforce Agentforce annual recurring revenue",
    value: "over $1.5 billion, up over 240% Y/Y",
    asOf: "Q2 FY27 (quarter ended 2026-07-31, announced 2026-08-26)",
    source: "Salesforce Q2 FY27 earnings press release",
    url: "https://www.salesforce.com/news/press-releases/2026/08/26/fy27-q2-earnings/",
  },
  {
    label: "Claude Code run-rate revenue",
    value: "over $2.5 billion, more than doubled since the beginning of 2026",
    asOf: "2026-02-12",
    source: "Anthropic Series G funding announcement",
    url: "https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation",
  },
  {
    label: "Fortune 500 companies with active AI agents (Microsoft first-party telemetry)",
    value: "more than 80%",
    asOf: "2025-11 (published 2026-02-10)",
    source: "Microsoft Security Blog",
    url: "https://www.microsoft.com/en-us/security/blog/2026/02/10/80-of-fortune-500-use-active-ai-agents-observability-governance-and-security-shape-the-new-frontier/",
  },
  {
    label: "Top SWE-bench Verified score (Claude Opus 5, bash-only harness)",
    value: "97.00% (vs 49.0% state of the art in Oct 2024)",
    asOf: "2026-08-26",
    source: "Vals AI SWE-bench Verified leaderboard",
    url: "https://www.vals.ai/benchmarks/swebench",
  },
  {
    label: "How fast agent task horizons are doubling (post-2023 trend, METR)",
    value: "every ~131 days; longest measured 50% horizon ~17.4 hours",
    asOf: "2026-01-29 / 2026-05-08",
    source: "METR, Time Horizon 1.1",
    url: "https://metr.org/blog/2026-1-29-time-horizon-1-1/",
  },
  {
    label: "Agentic AI projects Gartner predicts will be canceled by end of 2027",
    value: "over 40%",
    asOf: "announced 2025-06-25",
    source: "Gartner press release",
    url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027",
  },
  {
    label: "Global venture funding in H1 2026, with AI share of Q2 capital",
    value: "$510B (record; >70% of Q2 capital went to AI companies)",
    asOf: "H1 2026 (published 2026-07-02)",
    source: "Crunchbase News",
    url: "https://news.crunchbase.com/venture/global-startup-exits-ipo-ma-soar-ai-q2-h1-2026/",
  },
];

export const AGENTS_TABLES: StatTable[] = [
  {
    id: "adoption",
    question: "How many companies are actually using AI agents?",
    rows: [
      {
        stat: "Large organizations (over $1B annual revenue) scaling AI agents in one or more functions",
        value: "40%, up from 27% last year",
        asOf: "Q2 2026 (survey fielded May 4 - June 8, 2026; published 2026-08-25)",
        source: "McKinsey, The State of AI in 2026: On the road to ROI (n=1,719 across 97 nations)",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        kind: "survey",
      },
      {
        stat: "Smaller organizations (under $1B revenue) scaling AI agents, flat year over year",
        value: "22%",
        asOf: "Q2 2026 (survey fielded May 4 - June 8, 2026)",
        source: "McKinsey, The State of AI in 2026",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        kind: "survey",
      },
      {
        stat: "Organizations reaching the scaling phase with AI agents across the enterprise (all sizes); coding agents similar; chatbots remain the most widely scaled AI tool",
        value: "About 2 in 10 for AI agents; about 2 in 10 for software coding agents (31% at larger enterprises); 47% for chatbots",
        asOf: "Q2 2026 (survey fielded May 4 - June 8, 2026)",
        source: "McKinsey, The State of AI in 2026",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        kind: "survey",
      },
      {
        stat: "Respondents whose organizations decided against buying at least one software product because the functionality could be built in-house with agentic coding tools",
        value: "32% (nearly half of AI high performers vs 31% of other respondents)",
        asOf: "Q2 2026 (survey fielded May 4 - June 8, 2026)",
        source: "McKinsey, The State of AI in 2026",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        kind: "survey",
      },
      {
        stat: "AI high performers (about 6% of respondents) vs others on scaling agents; cost constraints on AI use",
        value: "More than 3x as likely to be scaling agents in most business functions; 2x for software coding agents; 2.7x for other agentic AI. About 20% of all respondents say AI operating costs (including tokens) constrained AI use; about 1 in 10 report cost-constrained use for each of chatbots, AI agents, and coding agents",
        asOf: "Q2 2026 (survey fielded May 4 - June 8, 2026)",
        source: "McKinsey, The State of AI in 2026",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        kind: "survey",
      },
      {
        stat: "Respondents with AI agents in production, plus share actively developing agents with concrete deployment plans",
        value: "57.3% in production (up from 51% the prior year); 30.4% actively developing. By size: 67% of 10k+ employee orgs vs 50% of sub-100 orgs have agents in production",
        asOf: "Survey fielded Nov 18 - Dec 2, 2025 (n=1,340)",
        source: "LangChain, State of Agent Engineering report",
        url: "https://www.langchain.com/state-of-agent-engineering",
        kind: "survey",
      },
      {
        stat: "US enterprise leaders ($1B+ revenue orgs) deploying AI agents, and share orchestrating multiple agents across workflows",
        value: "53% deploying agents (vs 55% the prior quarter); 18% orchestrating multiple agents, doubled from 9%",
        asOf: "Q2 2026 (survey fielded April 28 - May 25, 2026; published 2026-06-24; n=204)",
        source: "KPMG, AI Quarterly Pulse Survey Q2 2026",
        url: "https://kpmg.com/us/en/media/news/q2-ai-pulse-2026.html",
        kind: "survey",
      },
      {
        stat: "US organizations' AI agent maturity: testing, expanding, and scaled orchestrated multi-agent adoption",
        value: "42% testing/small deployments; 43% expanding across more than one function; only 15% have scaled, orchestrated multi-agent adoption",
        asOf: "Survey fielded April - June 2026 (n=501); published 2026-08-12",
        source: "Deloitte, AI agents are only the beginning: The path to agentic transformation",
        url: "https://www.deloitte.com/us/en/insights/industry/technology/path-to-agentic-transformation.html",
        kind: "survey",
      },
      {
        stat: "Organizations with a mature governance model for agentic AI, and expected agent use by 2027",
        value: "Only 21% report mature agentic AI governance; 74% expect their companies to use AI agents at least 'moderately' by 2027 (23% 'extensively', 5% fully integrated)",
        asOf: "Survey fielded Aug - Sep 2025 (n=3,235, 24 countries); analysis published 2026-04-24",
        source: "Deloitte, State of AI in the Enterprise 2026",
        url: "https://www.deloitte.com/us/en/insights/topics/emerging-technologies/ai-agents-scaling-faster.html",
        kind: "survey",
      },
      {
        stat: "Senior US executives saying AI agents are already being adopted; depth of adoption; budget intent",
        value: "79% adopting agents; of adopters, 35% adopting broadly and 17% fully adopted in almost all workflows; 88% plan to increase AI-related budgets in the next 12 months due to agentic AI; 66% of adopters report increased productivity; 18% not using agents at all",
        asOf: "Survey fielded April 22-28, 2025 (n=308 US business executives)",
        source: "PwC, AI Agent Survey",
        url: "https://www.pwc.com/us/en/tech-effect/ai-analytics/ai-agent-survey.html",
        kind: "survey",
      },
      {
        stat: "Enterprise IT leaders planning to expand AI agent use in the next 12 months, and share who had already implemented agents",
        value: "96% plan to expand agent use (about half aiming for significant, organization-wide expansion); 57% implemented AI agents in the past two years (21% within the last year)",
        asOf: "Released 2025-04-16 (n=nearly 1,500 enterprise IT leaders, 14 countries)",
        source: "Cloudera, The Future of Enterprise AI Agents",
        url: "https://www.cloudera.com/about/news-and-blogs/press-releases/2025-04-16-96-percent-of-enterprises-are-expanding-use-of-ai-agents-according-to-latest-data-from-cloudera.html",
        kind: "survey",
      },
      {
        stat: "Overall enterprise AI context from the same McKinsey 2026 survey: regular AI use and enterprise-wide scaling",
        value: "Nearly 9 in 10 use AI regularly in at least one function; 44% report AI scaling across the enterprise (up from 38%); 54% of $1B+ orgs scaling enterprise-wide vs one-third of smaller orgs; 37% attribute at least some EBIT impact to AI (flat YoY)",
        asOf: "Q2 2026 (survey fielded May 4 - June 8, 2026)",
        source: "McKinsey, The State of AI in 2026",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        kind: "survey",
      },
    ],
  },
  {
    id: "money",
    question: "How much money is flowing into AI agents?",
    blurb: "Funding rounds and revenue figures are hard events; market-size projections are analyst models and are labeled as such.",
    rows: [
      {
        stat: "Instinct (AI personal assistant) raising a Series B co-led by Index Ventures and Benchmark; WSJ reports the startup began testing Instinct in private beta in February 2026",
        value: "$250M Series B at $2.5B valuation",
        asOf: "2026-08-26",
        source: "The Wall Street Journal (Kate Clark, exclusive), confirmed by direct fetch",
        url: "https://www.wsj.com/tech/ai/the-latest-viral-ai-assistant-rocketing-across-silicon-valley-abb46276",
        kind: "funding",
      },
      {
        stat: "Instinct's cumulative funding after the Series B; founder Noah Shinn is 23 (per TechCrunch) and a former Sierra researcher (per Newcomer); corroborated independently by Newcomer",
        value: "$350M total raised at $2.5B valuation",
        asOf: "2026-08-26",
        source: "TechCrunch (Aug 26, 2026); corroborated by Newcomer (Aug 27, 2026)",
        url: "https://techcrunch.com/2026/08/26/viral-ai-startup-instinct-has-raised-350-million-at-a-2-5-billion-valuation/",
        kind: "funding",
      },
      {
        stat: "Instinct's valuation jumped roughly fivefold in weeks: $75M Series A led by Mamoon Hamid of Kleiner Perkins valued it over $500M in early August 2026; weeks later the Benchmark/Index round valued it over $2.5B",
        value: "over $500M (early Aug 2026) to over $2.5B (Aug 26, 2026)",
        asOf: "2026-08-26",
        source: "Forbes (Iain Martin and Rashi Shrivastava)",
        url: "https://www.forbes.com/sites/iainmartin/2026/08/26/vcs-are-so-obsessed-with-this-ai-assistant-that-its-valuation-jumped-fivefold-in-weeks/",
        kind: "funding",
      },
      {
        stat: "Town (enterprise personal-assistant startup, founded by ex-Plaid CTO Jean-Denis Greze and ex-Google applied-AI product director Tony Vincent) in talks to raise at a round led by Index Ventures; reported deal-in-progress, not closed",
        value: "raising at $1B valuation (in talks)",
        asOf: "2026-08-27",
        source: "Newcomer (Madeline Renbarger and Eric Newcomer)",
        url: "https://www.newcomer.co/p/amid-personal-assistant-investor",
        kind: "funding",
      },
      {
        stat: "Town's prior round: Series A led by Andreessen Horowitz with Forerunner Ventures, First Round, Alt Capital, and Conviction participating; Town was approaching 10,000 users and claimed 99% two-month retention among users who built at least one custom automation",
        value: "$55M Series A",
        asOf: "2026-06-03",
        source: "Fortune Term Sheet (Lily Mae Lazarus, exclusive)",
        url: "https://fortune.com/2026/06/03/towns-ai-assistants-andreessen-horowitz-forerunner-55-million/",
        kind: "funding",
      },
      {
        stat: "Sierra (Bret Taylor's AI customer-agent company) Series E led by Tiger Global and GV; CNBC, Yahoo Finance, and Tech Startups put the valuation at $15.8B; Taylor's own announcement says 'over $15 billion'",
        value: "$950M round; post-money above $15B ($15.8B per CNBC)",
        asOf: "2026-05-04",
        source: "TechCrunch; cross-checked against CNBC and Tech Startups",
        url: "https://techcrunch.com/2026/05/04/sierra-raises-950m-as-the-race-to-own-enterprise-ai-gets-serious/",
        kind: "funding",
      },
      {
        stat: "Sierra customer base and revenue: more than 40% of the Fortune 50 as customers; ARR of $100M in late November 2025 rising to $150M by early February 2026 (company-disclosed)",
        value: ">40% of Fortune 50 customers; $100M ARR (Nov 2025) to $150M ARR (Feb 2026)",
        asOf: "2026-02",
        source: "Sierra company claims via TechCrunch",
        url: "https://techcrunch.com/2026/05/04/sierra-raises-950m-as-the-race-to-own-enterprise-ai-gets-serious/",
        kind: "company_claim",
      },
      {
        stat: "Cognition (maker of AI software engineer Devin) raised more than $1B led by Lux Capital, General Catalyst, and 8VC; more than doubled its $10.2B post-money valuation from September 2025",
        value: ">$1B raised at $25B pre-money / $26B post-money",
        asOf: "2026-05-27",
        source: "TechCrunch (Julie Bort)",
        url: "https://techcrunch.com/2026/05/27/ai-coding-startup-cognition-raises-1b-at-25b-pre-money-valuation/",
        kind: "funding",
      },
      {
        stat: "Cognition revenue: annualized run-rate with enterprise usage of Devin growing 50% month-over-month for six months; customers include Mercedes-Benz, NASA, Goldman Sachs, and Santander",
        value: "$492M annualized revenue run-rate",
        asOf: "2026-05",
        source: "Cognition company claims via TechCrunch",
        url: "https://techcrunch.com/2026/05/27/ai-coding-startup-cognition-raises-1b-at-25b-pre-money-valuation/",
        kind: "company_claim",
      },
      {
        stat: "Cognition reportedly already in talks for another round, predicated on reaching a $1B annualized revenue run rate, per sources cited by Bloomberg; reported talks, not a closed round",
        value: "at least $40B valuation (reported talks)",
        asOf: "2026-08-12",
        source: "TechCrunch (citing Bloomberg)",
        url: "https://techcrunch.com/2026/08/12/ai-coding-startup-cognition-reportedly-already-in-talks-to-raise-at-40b-valuation/",
        kind: "funding",
      },
      {
        stat: "Cognition acquired The Interaction Company of California, maker of consumer texting agent Poke (launched March 2026; works over iMessage, SMS, Telegram, and WhatsApp in select markets), per co-founder Marvin von Hagen",
        value: "'low nine figures' acquisition",
        asOf: "2026-07-24",
        source: "TechCrunch, 'Why Cognition bought Poke'",
        url: "https://techcrunch.com/2026/07/24/why-cognition-bought-poke-ai-personality-is-becoming-a-competitive-advantage/",
        kind: "funding",
      },
      {
        stat: "Macro context: global venture funding hit a record in H1 2026, surpassing the $440B invested in all of 2025; more than 70% of Q2 2026 startup capital went to AI companies, up from just under 50% a year earlier; OpenAI and Anthropic alone took $217B (43% of H1)",
        value: "$510B global VC in H1 2026; >70% of Q2 capital to AI; OpenAI+Anthropic $217B (43% of H1)",
        asOf: "H1 2026",
        source: "Crunchbase News (Gene Teare, July 2, 2026)",
        url: "https://news.crunchbase.com/venture/global-startup-exits-ipo-ma-soar-ai-q2-h1-2026/",
        kind: "funding",
      },
      {
        stat: "SpaceX confirmed intent to acquire Anysphere (maker of Cursor), described by Crunchbase as the largest startup acquisition ever; confirmed intent, not yet a completed transaction",
        value: "$60B acquisition (largest startup M&A on record)",
        asOf: "Q2 2026",
        source: "Crunchbase News (July 2, 2026)",
        url: "https://news.crunchbase.com/venture/global-startup-exits-ipo-ma-soar-ai-q2-h1-2026/",
        kind: "funding",
      },
      {
        stat: "Grand View Research estimate for the global AI agents market; North America held a 39.63% revenue share in 2025; treat as a vendor market estimate, definitions vary widely",
        value: "$182.97B by 2033 (49.6% CAGR, 2026-2033)",
        asOf: "2026-03",
        source: "Grand View Research press release",
        url: "https://www.grandviewresearch.com/press-release/global-ai-agents-market-report",
        kind: "market_estimate",
      },
      {
        stat: "MarketsandMarkets AI agents market estimate; note the large spread vs Grand View's figure, these are vendor estimates with differing scopes, cite with attribution, not as consensus",
        value: "$7.84B (2025) to $52.62B (2030), 46.3% CAGR",
        asOf: "2025 (report TC 9168 PR published April 23, 2025)",
        source: "MarketsandMarkets press release",
        url: "https://www.marketsandmarkets.com/PressReleases/ai-agents.asp",
        kind: "market_estimate",
      },
    ],
  },
  {
    id: "scale",
    question: "How big are the agent platforms?",
    blurb: "Most of these are companies reporting their own numbers. That does not make them false, but the label says what they are.",
    rows: [
      {
        stat: "Salesforce Agentforce deals closed since launch (Oct 2024)",
        value: "over 29,000 deals, up 50% Q/Q",
        asOf: "Q4 FY26 (quarter ended 2026-01-31, announced 2026-02-25)",
        source: "Salesforce Q4 FY26 earnings press release",
        url: "https://www.salesforce.com/news/press-releases/2026/02/25/fy26-q4-earnings/",
        kind: "company_claim",
      },
      {
        stat: "Agentforce ARR at end of fiscal 2026",
        value: "$800 million ARR, up 169% Y/Y (Agentforce + Data 360 combined: exceeds $2.9 billion, up over 200% Y/Y, a figure that includes $1.1 billion Informatica Cloud ARR)",
        asOf: "Q4 FY26 (announced 2026-02-25)",
        source: "Salesforce Q4 FY26 earnings press release",
        url: "https://www.salesforce.com/news/press-releases/2026/02/25/fy26-q4-earnings/",
        kind: "company_claim",
      },
      {
        stat: "Agentforce ARR two quarters later; note Salesforce broadened the definition this quarter ('Effective Q2 FY27, Agentforce ARR includes our AI offerings, Slackbot and Headless 360')",
        value: "exceeded $1.5 billion, up over 240% Y/Y (Agentforce + Data 360: nearly $3.9 billion, up over 210% Y/Y)",
        asOf: "Q2 FY27 (quarter ended 2026-07-31, announced 2026-08-26)",
        source: "Salesforce Q2 FY27 earnings press release",
        url: "https://www.salesforce.com/news/press-releases/2026/08/26/fy27-q2-earnings/",
        kind: "company_claim",
      },
      {
        stat: "Agentic Work Units (Salesforce's metric for tasks accomplished by an AI agent) delivered across Agentforce and Slack",
        value: "7.0 billion AWUs delivered to date, with 3.2 billion in Q2 alone, growing 97% Q/Q",
        asOf: "Q2 FY27 (announced 2026-08-26)",
        source: "Salesforce Q2 FY27 earnings press release",
        url: "https://www.salesforce.com/news/press-releases/2026/08/26/fy27-q2-earnings/",
        kind: "company_claim",
      },
      {
        stat: "Claude Code run-rate revenue (agentic coding tool, GA May 2025)",
        value: "over $2.5 billion run-rate revenue; more than doubled since the beginning of 2026",
        asOf: "2026-02-12",
        source: "Anthropic Series G funding announcement",
        url: "https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation",
        kind: "company_claim",
      },
      {
        stat: "Claude Code user and business adoption growth",
        value: "weekly active users doubled since January 1, 2026; business subscriptions quadrupled since the start of 2026; enterprise use is over half of all Claude Code revenue",
        asOf: "2026-02-12",
        source: "Anthropic Series G funding announcement",
        url: "https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation",
        kind: "company_claim",
      },
      {
        stat: "Combined users of OpenAI's Codex and ChatGPT Work, roughly double the count from two weeks earlier (ChatGPT Work launched 2026-07-09); OpenAI did not define the activity window",
        value: "10 million users",
        asOf: "2026-07-21",
        source: "OpenAI (Codex lead Tibo Sottiaux on X; also shared with Bloomberg), reported by Unite.AI and 9to5Mac",
        url: "https://www.unite.ai/openai-says-codex-and-chatgpt-work-hit-10-million-users/",
        kind: "company_claim",
      },
      {
        stat: "OpenAI Codex weekly active users, standalone; up more than 6x since the desktop app launched in February 2026, with knowledge workers about 20% of users",
        value: "more than 5 million weekly active users",
        asOf: "2026-06-02",
        source: "OpenAI, 'Codex is becoming a productivity tool for everyone'",
        url: "https://openai.com/index/codex-for-knowledge-work/",
        kind: "company_claim",
      },
      {
        stat: "Microsoft 365 Copilot paid seats; was more than 20 million as of April 2026, so roughly 10 million seats added in one quarter",
        value: "over 30 million paid seats",
        asOf: "Q4 FY26 (quarter ended 2026-06-30, announced 2026-07-29)",
        source: "Microsoft FY26 Q4 earnings, reported by CNBC (Jordan Novet)",
        url: "https://www.cnbc.com/2026/07/29/microsoft-msft-q4-earnings-report-2026.html",
        kind: "company_claim",
      },
      {
        stat: "GitHub Copilot total users (Satya Nadella on the FY26 Q4 earnings call); up from 15 million developers at Build 2025",
        value: "50 million users",
        asOf: "2026-07-29",
        source: "Microsoft FY26 Q4 earnings call via CNBC; 15M baseline verified at Microsoft's Build 2025 blog",
        url: "https://www.cnbc.com/2026/07/29/microsoft-msft-q4-earnings-report-2026.html",
        kind: "company_claim",
      },
      {
        stat: "Fortune 500 companies using active AI agents built with low-code/no-code tools, per Microsoft first-party telemetry (active = deployed to production with real activity in the past 28 days, Nov 2025)",
        value: "more than 80% of Fortune 500 companies",
        asOf: "2025-11 (published 2026-02-10)",
        source: "Microsoft Security Blog",
        url: "https://www.microsoft.com/en-us/security/blog/2026/02/10/80-of-fortune-500-use-active-ai-agents-observability-governance-and-security-shape-the-new-frontier/",
        kind: "company_claim",
      },
      {
        stat: "Organizations that have used Microsoft Copilot Studio to build AI agents and automations",
        value: "more than 230,000 organizations, including 90% of the Fortune 500",
        asOf: "2025-05-19 (Build 2025)",
        source: "Microsoft Official Blog, Build 2025",
        url: "https://blogs.microsoft.com/blog/2025/05/19/microsoft-build-2025-the-age-of-ai-agents-and-building-the-open-agentic-web/",
        kind: "company_claim",
      },
      {
        stat: "Google Gemini Enterprise (agent platform) paid monthly active user growth",
        value: "40% growth in paid monthly active users quarter-over-quarter (Q1 2026)",
        asOf: "Q1 2026 (stated 2026-04-22 at Google Cloud Next '26)",
        source: "Google Cloud Blog, 'Welcome to Google Cloud Next 26'",
        url: "https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26",
        kind: "company_claim",
      },
      {
        stat: "Per-customer agent fleets Google cited on Gemini Enterprise: Virgin Voyages managing 1,000+ specialized agents; GE Appliances 800+ across manufacturing, logistics, and supply chain; WPP thousands; KPMG 100+ in its first month",
        value: "1,000+ (Virgin Voyages), 800+ (GE Appliances), thousands (WPP), 100+ in first month (KPMG)",
        asOf: "2026-04-22 (Google Cloud Next '26)",
        source: "Google Cloud Blog",
        url: "https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26",
        kind: "company_claim",
      },
      {
        stat: "MCP (Model Context Protocol) server count listed on PulseMCP, a daily-updated public directory; most listed servers are community-built and other registries list far fewer, so treat as an upper-bound directory count",
        value: "21,989 servers",
        asOf: "2026-08-29 (live count re-fetched and confirmed)",
        source: "PulseMCP server directory",
        url: "https://www.pulsemcp.com/servers",
        kind: "market_estimate",
      },
    ],
  },
  {
    id: "benchmarks",
    question: "How capable are AI agents right now?",
    rows: [
      {
        stat: "Top SWE-bench Verified score (bash-only mini-swe-agent harness): Claude Opus 5 leads all 86 evaluated models",
        value: "97.00%",
        asOf: "2026-08-26",
        source: "Vals AI, SWE-bench Verified leaderboard",
        url: "https://www.vals.ai/benchmarks/swebench",
        kind: "benchmark",
      },
      {
        stat: "SWE-bench Verified is saturating: seven of 86 evaluated models score 95% or better, with the leader 3 points from perfect",
        value: "7 of 86 models at >=95%",
        asOf: "2026-08-26",
        source: "Vals AI, SWE-bench Verified leaderboard",
        url: "https://www.vals.ai/benchmarks/swebench",
        kind: "benchmark",
      },
      {
        stat: "Best open-weight model on SWE-bench Verified: DeepSeek V4 Pro 0813, second overall, 0.60 points behind the closed leader",
        value: "96.40%",
        asOf: "2026-08-26",
        source: "Vals AI, SWE-bench Verified leaderboard",
        url: "https://www.vals.ai/benchmarks/swebench",
        kind: "benchmark",
      },
      {
        stat: "2024 baseline for the same benchmark: upgraded Claude 3.5 Sonnet set the then-state-of-the-art on SWE-bench Verified, up from 33.4% for its predecessor (vs 97% today, a ~2x improvement in 22 months)",
        value: "49.0%",
        asOf: "2024-10-22",
        source: "Anthropic announcement",
        url: "https://www.anthropic.com/news/3-5-models-and-computer-use",
        kind: "company_claim",
      },
      {
        stat: "OSWorld 2024 baseline: in the original paper the best model completed 12.24% of real computer tasks vs a 72.36% human baseline",
        value: "12.24% (human: 72.36%)",
        asOf: "2024-04",
        source: "OSWorld paper / official project site (arXiv 2404.07972, NeurIPS 2024)",
        url: "https://osworld-v1.xlang.ai/",
        kind: "benchmark",
      },
      {
        stat: "Current OSWorld-Verified best: Claude Mythos Preview, pass@1 on 361 tasks at 100 max steps (5-run avg, Anthropic's revised harness, self-reported in the Claude 5 system card); agents now exceed the 72.4% human baseline on OSWorld 1.0-era tasks",
        value: "85.4%",
        asOf: "2026-06",
        source: "Steel.dev OSWorld leaderboard (tracking the Claude 5 system card)",
        url: "https://leaderboard.steel.dev/leaderboards/osworld/",
        kind: "company_claim",
      },
      {
        stat: "OSWorld 2.0 (released June 2026, 108 long-horizon tasks across 31 self-hosted websites, ~1.6h median human completion time) resets the ladder: the best agent, Claude Opus 4.8 with maximum thinking and batched tool calls, completes only 20.6% of tasks at 500 steps; GPT-5.5 plateaus near 14%",
        value: "20.6% binary / 54.8% partial",
        asOf: "2026-06",
        source: "OSWorld 2.0 official site / paper (arXiv 2606.29537), XLang Lab HKU",
        url: "https://osworld-v2.xlang.ai/",
        kind: "benchmark",
      },
      {
        stat: "WebArena current best tracked result: WebTactix system using DeepSeek v3.2, 594 of 812 tasks correct (74.34% as reported by the project page, which excludes 13 tasks with no valid evaluation outcome; strictly 594/812 = 73.2%) vs the original 2023 GPT-4 baseline of 14.41% and a 78.24% human baseline",
        value: "74.34% (594 tasks correct)",
        asOf: "2026-02",
        source: "Steel.dev WebArena leaderboard, citing the WebTactix project page",
        url: "https://leaderboard.steel.dev/leaderboards/webarena/",
        kind: "benchmark",
      },
      {
        stat: "GAIA current best: OPS-Agentic-Search (Alibaba Cloud), an official GAIA leaderboard submission using a multi-model ensemble, tied at 92.36% with openJiuwen-deepagent, vs OpenAI Deep Research at 67.36% pass@1 in Feb 2025",
        value: "92.36%",
        asOf: "2026-03",
        source: "Steel.dev GAIA leaderboard, tracking the official Hugging Face GAIA leaderboard",
        url: "https://leaderboard.steel.dev/leaderboards/gaia/",
        kind: "benchmark",
      },
      {
        stat: "METR's original finding: the length of software tasks (measured by how long they take human professionals) that frontier AI agents can complete with 50% reliability has been 'doubling approximately every 7 months for the last 6 years'; Claude 3.7 Sonnet's 50% time horizon was approximately one hour",
        value: "doubling ~every 7 months (2019-2025)",
        asOf: "2025-03-19",
        source: "METR, 'Measuring AI Ability to Complete Long Tasks' (arXiv 2503.14499)",
        url: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/",
        kind: "benchmark",
      },
      {
        stat: "METR Time Horizon 1.1 update: overall P50 doubling time of 196.5 days across the full 2019-2026 trend, but post-2023 progress is faster at 130.8 days [CI 107-161] (~4.3 months) on the expanded 228-task suite; Claude Opus 4.5's 50% horizon measured at 320 minutes [CI 170-729]",
        value: "doubling every ~131 days post-2023",
        asOf: "2026-01-29",
        source: "METR blog, 'Time Horizon 1.1'",
        url: "https://metr.org/blog/2026-1-29-time-horizon-1-1/",
        kind: "benchmark",
      },
      {
        stat: "Longest measured 50% time horizon to date: Claude Mythos Preview (early snapshot, Inspect harness) at ~1,045 minutes [CI 509-3,304 min], with Claude Opus 4.6 at ~719 minutes; METR cautions that 'measurements above 16 hrs are unreliable with our current task suite'",
        value: "~1,045 minutes (~17.4 hours)",
        asOf: "2026-05-08",
        source: "METR, Task-Completion Time Horizons data page",
        url: "https://metr.org/time-horizons/",
        kind: "benchmark",
      },
    ],
  },
  {
    id: "projections",
    question: "What do the forecasts say?",
    blurb: "Every row here is a prediction, not a measurement. Forecasts from the same firms have missed before.",
    rows: [
      {
        stat: "Over 40% of agentic AI projects will be canceled by the end of 2027, due to escalating costs, unclear business value or inadequate risk controls",
        value: "over 40% canceled by end of 2027",
        asOf: "2025-06-25 (announced); target end of 2027",
        source: "Gartner press release (confirmed verbatim on gartner.com)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027",
        kind: "projection",
      },
      {
        stat: "Agent washing: Gartner estimates only about 130 of the thousands of agentic AI vendors are real (the rest rebrand AI assistants, RPA and chatbots without substantial agentic capabilities)",
        value: "only about 130 of thousands of vendors",
        asOf: "2025-06-25",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027",
        kind: "market_estimate",
      },
      {
        stat: "At least 15% of day-to-day work decisions will be made autonomously through agentic AI by 2028, up from 0% in 2024",
        value: "at least 15% by 2028, up from 0% in 2024",
        asOf: "2025-06-25 (announced); target 2028",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027",
        kind: "projection",
      },
      {
        stat: "33% of enterprise software applications will include agentic AI by 2028, up from less than 1% in 2024",
        value: "33% by 2028, up from <1% in 2024",
        asOf: "2025-06-25 (announced); target 2028",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027",
        kind: "projection",
      },
      {
        stat: "40% of enterprise applications will be integrated with task-specific AI agents by the end of 2026, up from less than 5% in 2025",
        value: "40% by end of 2026, up from <5% in 2025",
        asOf: "2025-08-26 (announced, updated 2025-09-05); target end of 2026",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025",
        kind: "projection",
      },
      {
        stat: "Gartner's best-case scenario: agentic AI could drive approximately 30% of enterprise application software revenue by 2035; same release predicts one-third of agentic AI implementations will combine agents with different skills by 2027 and at least 50% of knowledge workers will develop new skills to work with, govern or create AI agents by 2029",
        value: "~30% of enterprise app software revenue, surpassing $450 billion, by 2035 (up from 2% in 2025)",
        asOf: "2025-08-26 (announced); target 2035",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025",
        kind: "projection",
      },
      {
        stat: "Up to $234 billion of enterprise application spending is exposed to 'agentic arbitrage' between now and 2030 (the 'Saaspocalypse' thesis: agents complete tasks across systems, breaking the seat-license model)",
        value: "up to $234 billion exposed by 2030 (~20% of enterprise app SaaS spend)",
        asOf: "2026-07-01 (announced); horizon through 2030",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2026-07-01-gartner-says-us-dollars-234-billion-in-enterprise-application-software-spend-is-at-risk-from-agentic-artificial-intelligence",
        kind: "projection",
      },
      {
        stat: "At least 80% of governments will deploy AI agents to automate routine decision-making by 2028; by 2029, 70% of government agencies will require explainable AI and human-in-the-loop mechanisms for all automated decisions impacting citizen service delivery",
        value: "at least 80% of governments by 2028; 70% requiring XAI/HITL by 2029",
        asOf: "2026-03-17 (announced); targets 2028/2029",
        source: "Gartner press release (confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2026-03-17-gartner-predicts-at-least-80-percent-of-governments-will-deploy-ai-agents-to-automate-routine-decision-making-by-2028",
        kind: "projection",
      },
      {
        stat: "By 2028, AI agents will outnumber sellers by 10 times, yet fewer than 40% of sellers will say AI agents have improved productivity",
        value: "agents outnumber sellers 10:1 by 2028; <40% of sellers report productivity gains",
        asOf: "2026-07-28 (announced); target 2028",
        source: "Gartner press release (full body fetched and confirmed verbatim)",
        url: "https://www.gartner.com/en/newsroom/press-releases/2026-07-28-gartner-predicts-ai-agents-will-outnumber-sellers-10-to-1-by-2028-yet-fewer-than-40-percent-of-sellers-will-say-agents-improved-productivity",
        kind: "projection",
      },
      {
        stat: "By 2026, 40% of all G2000 job roles will involve working with AI agents; by 2026, 70% of G2000 CEOs will focus AI ROI on growth, aiming to boost revenue and reinvent business models without growing headcount",
        value: "40% of G2000 job roles by 2026; 70% of G2000 CEOs",
        asOf: "2025-10-23 (announced); target 2026",
        source: "IDC FutureScape 2026 press release (confirmed verbatim)",
        url: "https://my.idc.com/getdoc.jsp?containerId=prUS53883425",
        kind: "projection",
      },
      {
        stat: "IDC: by 2030, 45% of organizations will orchestrate AI agents at scale; by 2028 pure seat-based pricing will be obsolete, forcing 70% of vendors to refactor their value proposition; by 2030 up to 20% of G1000 organizations will have faced lawsuits, substantial fines and CIO dismissals from inadequate agent controls and governance",
        value: "45% of organizations orchestrating agents at scale by 2030",
        asOf: "2025-10-23 (announced); targets 2028-2030",
        source: "IDC FutureScape 2026 press release (confirmed verbatim)",
        url: "https://my.idc.com/getdoc.jsp?containerId=prUS53883425",
        kind: "projection",
      },
      {
        stat: "As AI's hype fades, enterprises will defer a quarter of their planned AI spend into 2027, with fewer than one-third of decision-makers able to tie the value of AI to their organization's financial growth",
        value: "25% of planned AI spend deferred into 2027; <1/3 tie AI to financial growth",
        asOf: "2025-10-28 (announced); prediction for 2026-2027",
        source: "Forrester 2026 Technology & Security Predictions (confirmed verbatim)",
        url: "https://www.forrester.com/press-newsroom/forrester-tech-security-2026-predictions/",
        kind: "projection",
      },
      {
        stat: "McKinsey forecasts agentic commerce (AI agents that shop, negotiate and transact on behalf of humans) could orchestrate as much as $1 trillion in US retail revenue by 2030; the global estimate is independently corroborated by McKinsey's own LinkedIn post and Retail Dive",
        value: "up to $1 trillion US; $3-5 trillion global by 2030",
        asOf: "2025-10 (research published); target 2030",
        source: "Digital Commerce 360 reporting McKinsey agentic commerce research",
        url: "https://www.digitalcommerce360.com/2025/10/20/mckinsey-forecast-5-trillion-agentic-commerce-sales-2030/",
        kind: "projection",
      },
      {
        stat: "Stanford WORKBank audit of the US workforce: share of tasks where the workers performing them express a positive attitude toward AI agent automation (1,500 domain workers, 104 occupations, 844 tasks, 52 AI experts); share of Y Combinator AI companies mapped to tasks workers do not want automated",
        value: "46.1% of tasks; 41.0% of YC companies in low-desire zones",
        asOf: "survey fielded Jan-May 2025 (paper last revised 2026-02-01)",
        source: "Stanford SALT Lab, Future of Work with AI Agents (arXiv:2506.06576)",
        url: "https://arxiv.org/html/2506.06576",
        kind: "survey",
      },
      {
        stat: "Anthropic Economic Index 'Cadences' report (usage data Apr 10-Jun 10, 2026 plus survey of ~9,700 Claude users): expectations of AI capability vs perceived job risk, skill value, productivity, and agentic session structure (median blog-post-producing agentic Claude Code session contains a single human prompt vs 13 rounds of back-and-forth in chat)",
        value: "over 1/3 expect AI to do most/nearly all their tasks next year; 10% rate own job loss likely; 57% skills more valuable; 86% speed gains",
        asOf: "2026-04-10 to 2026-06-10 (data period); published 2026-06-26",
        source: "Anthropic Economic Index: Cadences (confirmed verbatim)",
        url: "https://www.anthropic.com/research/economic-index-june-2026-report",
        kind: "survey",
      },
    ],
  },
  {
    id: "landscape",
    question: "Who is building what?",
    rows: [
      {
        stat: "IBM's citable definition of an AI agent: 'An artificial intelligence (AI) agent is a system that autonomously performs tasks by designing workflows with available tools.' (verbatim, by Anna Gutowska, AI Engineer, Developer Advocate, IBM)",
        value: "definition (verbatim quote; confirmed word-for-word on live page)",
        asOf: "2026-08-29 (page live, undated)",
        source: "IBM Think, 'What are AI agents?'",
        url: "https://www.ibm.com/think/topics/ai-agents",
        kind: "company_claim",
      },
      {
        stat: "Anthropic's definition distinguishes workflows ('systems where LLMs and tools are orchestrated through predefined code paths') from agents: 'systems where LLMs dynamically direct their own processes and tool usage, maintaining control over how they accomplish tasks' (verbatim)",
        value: "definition (both quotes confirmed verbatim on live page)",
        asOf: "2024-12-19 (publication date; live as of 2026-08-29)",
        source: "Anthropic, 'Building Effective Agents'",
        url: "https://www.anthropic.com/engineering/building-effective-agents",
        kind: "company_claim",
      },
      {
        stat: "OpenAI's definition, page 4 of its agents guide: 'Agents are systems that independently accomplish tasks on your behalf.' The guide adds that applications that integrate LLMs but don't use them to control workflow execution (simple chatbots, single-turn LLMs, sentiment classifiers) are not agents",
        value: "definition (verbatim; confirmed by reading the PDF directly)",
        asOf: "2025-04 guide (PDF re-verified 2026-08-29)",
        source: "OpenAI, 'A Practical Guide to Building Agents' (PDF)",
        url: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf",
        kind: "company_claim",
      },
      {
        stat: "LangChain (langchain-ai/langchain, self-described 'The agent engineering platform.') GitHub stars",
        value: "145,255 stars (24,243 forks)",
        asOf: "2026-08-29 (re-verified via live API call)",
        source: "GitHub API, langchain-ai/langchain",
        url: "https://api.github.com/repos/langchain-ai/langchain",
        kind: "benchmark",
      },
      {
        stat: "LangGraph (langchain-ai/langgraph) GitHub stars; PyPI downloads of the langgraph package in the trailing month",
        value: "40,685 stars; 66,035,075 downloads last month (11,259,434 last week)",
        asOf: "2026-08-29 (re-verified via live API calls)",
        source: "GitHub API + PyPI Stats (pypistats.org)",
        url: "https://pypistats.org/api/packages/langgraph/recent",
        kind: "benchmark",
      },
      {
        stat: "CrewAI (crewAIInc/crewAI) GitHub stars; PyPI downloads of the crewai package in the trailing month",
        value: "57,803 stars; 29,105,346 downloads last month",
        asOf: "2026-08-29 (re-verified via live API calls)",
        source: "GitHub API + PyPI Stats (pypistats.org)",
        url: "https://pypistats.org/api/packages/crewai/recent",
        kind: "benchmark",
      },
      {
        stat: "Microsoft AutoGen (microsoft/autogen, 'A programming framework for agentic AI') GitHub stars",
        value: "60,696 stars (9,164 forks)",
        asOf: "2026-08-29 (re-verified via live API call)",
        source: "GitHub API, microsoft/autogen",
        url: "https://api.github.com/repos/microsoft/autogen",
        kind: "benchmark",
      },
      {
        stat: "OpenAI Agents SDK for Python (openai/openai-agents-python) GitHub stars",
        value: "29,064 stars (4,629 forks)",
        asOf: "2026-08-29 (re-verified via live API call)",
        source: "GitHub API, openai/openai-agents-python",
        url: "https://api.github.com/repos/openai/openai-agents-python",
        kind: "benchmark",
      },
      {
        stat: "Consumer agent Instinct (operated by Spear Street Technology; Forbes, citing California corporate filings, identifies founder Noah Shinn as a former Sierra researcher) is still in private/invite-only beta, connects to users' apps and devices and communicates via texts and calls. Note: Forbes, published the same day, described the $2.5B round as still in talks",
        value: "$250M Series B; $350M total raised; $2.5B valuation",
        asOf: "2026-08-26",
        source: "TechCrunch (ex-Sierra detail: Forbes, Aug 26)",
        url: "https://techcrunch.com/2026/08/26/viral-ai-startup-instinct-has-raised-350-million-at-a-2-5-billion-valuation/",
        kind: "funding",
      },
      {
        stat: "Town's assistants are customizable named characters ('Townies', e.g. a bunny, a silver fox, a capybara) whose personality the user shapes; Series A led by Andreessen Horowitz in June 2026, Forerunner Ventures also became an investor",
        value: "$55M Series A led by a16z, June 2026",
        asOf: "2026-07-16 (article date)",
        source: "Inc. (Lisa Bonos), 'How Town Became Silicon Valley's New Favorite AI Tool'",
        url: "https://www.inc.com/lisa-bonos/how-town-became-silicon-valleys-new-favorite-ai-tool/91372608",
        kind: "funding",
      },
      {
        stat: "In its second month out of beta, Town said its user count had more than quadrupled since early June 2026 (revenue and userbase size undisclosed; many companies Inc. spoke to were still on free trials)",
        value: "users 'more than quadrupled since early June'; $15-$199/mo individual, team plans from $59/seat",
        asOf: "2026-07-16",
        source: "Inc. (Lisa Bonos)",
        url: "https://www.inc.com/lisa-bonos/how-town-became-silicon-valleys-new-favorite-ai-tool/91372608",
        kind: "company_claim",
      },
      {
        stat: "Weeks after its Series A, Town was in talks to raise at a $1 billion valuation in a round led by Index Ventures, the same firm backing Instinct's round, with Newcomer itself noting surprise that Index is backing both startups at the heart of the personal-agent frenzy",
        value: "$1B valuation (round in talks; raise amount undisclosed)",
        asOf: "2026-08-27",
        source: "Newcomer",
        url: "https://www.newcomer.co/p/amid-personal-assistant-investor",
        kind: "funding",
      },
    ],
  },
];

export const AGENTS_MONTHS: MonthEntry[] = [
  {
    month: "August 2026",
    narrative: [
      "August 2026 was the month the personal AI assistant became a venture category of its own. On August 26, the Wall Street Journal reported that Instinct, the invite-only assistant built by 23-year-old former Sierra researcher Noah Shinn, closed a $250 million Series B co-led by Index Ventures and Benchmark, bringing total funding to $350 million at a $2.5 billion valuation. Forbes noted the same day that the valuation had jumped roughly fivefold in a matter of weeks, from just over $500 million in early August. One day later, Newcomer reported that Town, the enterprise assistant startup founded by ex-Plaid CTO Jean-Denis Greze, was in talks to raise at a $1 billion valuation in a round led by Index, the same firm backing Instinct. Earlier in the month, on August 12, Bloomberg-sourced reporting said Cognition was already in talks to raise at a valuation of at least $40 billion, less than three months after closing its round at $26 billion post-money.",
      "The enterprise data caught up with the hype in the same week. McKinsey's State of AI survey, published August 25, found 40% of large organizations (over $1 billion in revenue) now scaling AI agents in at least one function, up from 27% a year earlier, while smaller firms sit flat at 22%. Deloitte's August 12 study of 501 US organizations put a finer point on the maturity gap: 85% are testing or expanding agents, but only 15% have reached scaled, orchestrated multi-agent adoption. And on August 26, Salesforce reported Agentforce ARR exceeding $1.5 billion, up over 240% year over year, alongside a new usage metric: 7 billion Agentic Work Units delivered to date, 3.2 billion of them in the most recent quarter.",
      "Capability benchmarks kept moving underneath it all. As of the Vals AI leaderboard update on August 26, Claude Opus 5 tops SWE-bench Verified at 97.00%, with seven of 86 evaluated models now at 95% or better, which is why the field's attention is shifting to harder tests like OSWorld 2.0, where the best agent completes just 20.6% of long-horizon computer tasks. The gap between saturated coding benchmarks and unsolved real-world autonomy is now the clearest single picture of where AI agents actually stand.",
    ],
    changes: [
      "First published: 81 verified statistics across 6 categories, each checked against its source.",
    ],
  },
];

/**
 * Numbers that FAILED verification. Never publish these; each monthly
 * refresh checks its new rows against this list first.
 */
export const AGENTS_DO_NOT_ASSERT: string[] = [
  "Do not claim Cognition's $492M run-rate was 'up from $37 million in May 2025'. The $37M baseline is not in the cited TechCrunch primary source; it circulates only in secondary aggregators (The Decoder, Sacra, TheNextWeb). Cite only the $492M figure.",
  "Do not claim Instinct 'is only about a year old'. Company age is not confirmed in the TechCrunch article or the Newcomer corroboration. Founder age (23) and ex-Sierra background are verified; company age is not.",
  "Do not attribute Gartner's '~30% of enterprise application software revenue by 2035, surpassing $450 billion' best case to the July 1, 2026 press release. That release contains no 2035 or 30% figure. The claim is real Gartner but comes from the separate Aug 26, 2025 release ('Gartner Predicts 40% of Enterprise Apps Will Feature Task-Specific AI Agents by 2026').",
  "Do not assert Gartner's supposed worldwide agentic AI spending forecast of $201.9 billion in 2026 (up 141% YoY), $752.7 billion by 2029 (119% CAGR), or chatbot spending peaking at $264.7 billion. These numbers exist only on one blogger's posts citing a paywalled Gartner document, with no Gartner newsroom confirmation and conflicting secondhand totals. Killed as unverifiable.",
  "Do not claim the official MCP Registry has ~2,000 servers per third-party trackers. That side-claim could not be confirmed by fetch and was removed. Only the PulseMCP directory count (21,989 as of 2026-08-29) is verified, and it is an upper-bound community directory count, not an official registry count.",
  "Do not date the Cognition/Poke acquisition coverage to July 23, 2026. The verified TechCrunch article date is July 24, 2026, and the deal value is 'low nine figures' per co-founder Marvin von Hagen, not a disclosed dollar figure.",
  "Do not claim Gartner's 'AI agents will outnumber sellers 10 to 1' prediction was first announced on 2025-11-18. That earlier-announcement claim was unsupported and removed; the verified release is dated 2026-07-28 and cites a Jan-Feb 2026 CSO survey.",
  "Do not place Forerunner Ventures inside Town's Series A round itself. The Inc. article says Forerunner pitched its way in and became an investor but does not place it in the Series A; the Fortune piece lists it as a participant. Cite carefully per source.",
  "Do not present the Instinct $250M Series B as universally confirmed closed on Aug 26: Forbes, published the same day, described the $2.5B round as still in talks. WSJ, TechCrunch, and Newcomer report it as raised/closed. Flag the discrepancy if precision matters.",
  "Do not present Grand View ($182.97B by 2033) and MarketsandMarkets ($52.62B by 2030) market sizes as consensus. They are vendor estimates with wildly different scopes; always attribute by name.",
  "Do not describe SpaceX's $60B Anysphere (Cursor) acquisition as completed. It is confirmed intent per Crunchbase, not a closed transaction. Same for Cognition's reported $40B round and Town's $1B round: reported talks, not closed.",
];

export const AGENTS_COUNTS = {
  stats: () => AGENTS_TABLES.reduce((n, t) => n + t.rows.length, 0),
  tables: () => AGENTS_TABLES.length,
};
