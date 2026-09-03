export type UpdateCategory = "product-launch" | "research" | "industry" | "open-source" | "policy";

export interface RelatedLink {
  label: string;
  to: string; // internal route
  description: string;
}

export interface UpdateHighlight {
  /** The big number, NYT front-page style. Keep it under 8 characters. */
  stat: string;
  label: string;
}

export interface UpdateDocument {
  label: string;
  /** Who hosts it: CourtListener, GovInfo, Justia, the administrator. */
  source: string;
  url: string;
}

export interface UpdateVideo {
  /** short = under a minute, clip = news segment, full = complete analysis. */
  kind: "short" | "clip" | "full";
  label: string;
  /** A leading slash means a locally hosted file rendered as a real player. */
  url: string;
  duration?: string;
}

/** Company logos for an M&A or partnership story (official brand assets). */
export interface UpdateDealLogo {
  name: string;
  onLight: string;
  onDark: string;
  source: string;
  height?: number;
}

export interface AIUpdate {
  id: string;
  slug: string;
  title: string;
  company: string;
  category: UpdateCategory;
  date: string;
  summary: string;
  takeaways: string[];
  tocSections: string[];
  videoUrl?: string;
  videoLabel?: string;
  body: string;
  /** Contributor ids this story is about. Renders as profile links here, and
   *  lets each profile list the news mentioning that person. */
  contributors?: string[];
  /** Scannable stat cards rendered above the fold. */
  highlights?: UpdateHighlight[];
  /** The analyst read: what the owner thinks it means, clearly labelled as
   *  opinion and kept separate from the reported facts above it. */
  myView?: { points: string[]; caveat?: string };
  /** Primary documents: court records first, never buried under the text. */
  documents?: UpdateDocument[];
  /** A 30-second version and the long version. Readers pick their depth. */
  videos?: UpdateVideo[];
  /** Two-company logo lockup, rendered above the summary. */
  dealLogos?: { left: UpdateDealLogo; right: UpdateDealLogo; connector?: string };
  sourceUrl: string;
  tags: string[];
  relatedLinks: RelatedLink[];
}

export const CATEGORY_META: Record<UpdateCategory, { label: string; color: string }> = {
  "product-launch": { label: "Product Launch", color: "hsl(var(--primary))" },
  research: { label: "Research", color: "#10b981" },
  industry: { label: "Industry", color: "#f59e0b" },
  "open-source": { label: "Open Source", color: "#8b5cf6" },
  policy: { label: "Policy & Safety", color: "#ef4444" },
};

export const aiUpdates: AIUpdate[] = [
  {
    id: "nvidia-hugging-face-acquisition",
    slug: "nvidia-acquires-hugging-face",
    title: "NVIDIA to Acquire Hugging Face for $12.93 Billion",
    company: "NVIDIA",
    category: "industry",
    date: "2026-09-03",
    summary:
      "NVIDIA said on September 3, 2026 that it has agreed to acquire Hugging Face for $12,930,300,000. The vendor that supplies the industry's training and inference hardware is buying the hub where 3 million open models are distributed. NVIDIA's post says the platform stays open, and says nothing about regulatory approval or a closing date.",
    takeaways: [
      "The official figure is $12,930,300,000, stated by Jensen Huang on NVIDIA's newsroom. CNBC reports about $11.9 billion goes to shareholders, with up to $1 billion held back as equity-based retention awards for Hugging Face employees who join.",
      "What the price buys, per NVIDIA's own numbers: 3 million models, 1 million applications, 500,000 datasets, 18 million developers and researchers, and 200,000 companies on the platform.",
      "This is NVIDIA's second largest deal, behind the roughly $20 billion it paid for most of Groq's AI chip assets in December 2025.",
      "Huang's commitment runs one sentence: Hugging Face \"will remain an open platform for the entire AI ecosystem.\" The announcement defines no governance mechanism behind it.",
      "Pre-announcement reporting drifted. Bloomberg had NVIDIA nearing $14 billion on September 2 and $13 billion on September 3. Publish the newsroom figure, not the round one.",
    ],
    tocSections: ["What Happened", "The Numbers", "What NVIDIA Did Not Say", "Why It Matters"],
    contributors: ["huang", "delangue", "wolf"],
    highlights: [
      { stat: "$12.93B", label: "official price, per NVIDIA's newsroom" },
      { stat: "3M", label: "models hosted on Hugging Face" },
      { stat: "18M", label: "developers and researchers on the platform" },
      { stat: "#2", label: "largest NVIDIA deal ever, after Groq's ~$20B" },
    ],
    documents: [
      {
        label: "NVIDIA to Acquire Hugging Face (the announcement, with the exact price)",
        source: "NVIDIA Newsroom, 3 Sep 2026",
        url: "https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/",
      },
      {
        label: "Hugging Face approached NVIDIA's Huang weeks ahead of the $12.9B deal",
        source: "CNBC, 3 Sep 2026",
        url: "https://www.cnbc.com/2026/09/03/nvidia-agrees-to-buy-hugging-face-for-almost-13-billion-ai-expansion.html",
      },
      {
        label: "NVIDIA confirms it will buy Hugging Face for $12.9 billion",
        source: "TechCrunch, 3 Sep 2026",
        url: "https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/",
      },
      {
        label: "NVIDIA agrees to buy Hugging Face for $12.9 billion, report says (pre-announcement)",
        source: "CNBC, 27 Aug 2026",
        url: "https://www.cnbc.com/2026/08/27/nvidia-hugging-face-acquisition.html",
      },
      {
        label: "NVIDIA closes in on Hugging Face acquisition (the first report)",
        source: "TechCrunch, 26 Aug 2026",
        url: "https://techcrunch.com/2026/08/26/nvidia-closes-in-on-hugging-face-acquisition/",
      },
    ],
    body: `<h3 id="what-happened">What Happened</h3>
<p>On September 3, 2026, NVIDIA announced it has agreed to acquire Hugging Face. Jensen Huang stated the price himself on the company newsroom: $12,930,300,000.</p>
<p>The deal did not appear from nowhere. TechCrunch reported NVIDIA closing in on the acquisition on August 26, and CNBC reported an agreement on August 27, a week before the official post. CNBC also reports that Hugging Face approached Huang weeks ahead of the deal, which makes this a seller-initiated transaction rather than a hostile approach.</p>
<p>Hugging Face is the default distribution point for open models. If you have pulled a model in the last three years, you almost certainly pulled it from Hugging Face. The company that makes the hardware those models run on now owns the shelf they sit on.</p>

<h3 id="the-numbers">The Numbers</h3>
<p>Every figure below comes from NVIDIA's own announcement unless marked otherwise. We do not round the price, because the exact number is the one in the primary source.</p>
<ul>
<li><strong>$12,930,300,000</strong> total consideration</li>
<li><strong>About $11.9 billion</strong> to Hugging Face shareholders, plus <strong>up to $1 billion</strong> in equity-based retention awards for employees who join NVIDIA (CNBC)</li>
<li><strong>3 million</strong> models on the platform</li>
<li><strong>1 million</strong> applications</li>
<li><strong>500,000</strong> datasets</li>
<li><strong>18 million</strong> developers, researchers and creators</li>
<li><strong>200,000</strong> companies using the platform</li>
<li><strong>500</strong> NVIDIA models and <strong>250</strong> NVIDIA open datasets already published there</li>
</ul>
<p>For scale, NVIDIA paid roughly <strong>$20 billion</strong> for most of Groq's AI chip assets in December 2025. Hugging Face is the second largest deal in company history, and it cost about 65 percent of what the Groq assets did.</p>
<p>One note on sourcing. Bloomberg reported on September 2 that NVIDIA was nearing a $14 billion deal, then reported $13 billion on September 3. Both were reasonable at the time. Neither is the number to publish now.</p>

<h3 id="what-nvidia-did-not-say">What NVIDIA Did Not Say</h3>
<p>The absences in this announcement are as informative as the figures.</p>
<ul>
<li><strong>No regulatory language.</strong> The post contains no mention of antitrust review, closing conditions, or an expected close date. For a deal this size between a dominant hardware supplier and the main distribution channel for the software that runs on that hardware, silence on review is conspicuous rather than neutral.</li>
<li><strong>No Hugging Face statement.</strong> At the time of writing there is no post about the acquisition on the Hugging Face blog, and no statement there from Clement Delangue or Thomas Wolf. Everything currently known about intent comes from the buyer.</li>
<li><strong>No definition of open.</strong> Huang says the platform "will remain an open platform for the entire AI ecosystem." The post attaches no governance structure, no foundation, no independent board, and no time commitment to that sentence.</li>
</ul>
<p>Precedent is worth holding in mind. When NVIDIA took Groq's assets in December 2025, CNBC characterized the structure as preserving a "fiction of competition," because Groq continued as a nominally independent company after its technology and most of its staff moved across. Watch for whether Hugging Face is kept independent in the same nominal way.</p>

<h3 id="why-it-matters">Why It Matters</h3>
<p>If your work touches how AI systems find and cite content, this is a distribution story rather than a chip story.</p>
<p>Answer engines and agents run on a narrow set of models, and those models reach the people building with them through a small number of hubs. Hugging Face is the largest. Owning it concentrates two decisions inside one company: which hardware AI runs on, and which models are easy to find and pull. Consolidation upstream of the model layer eventually narrows the surface that <a href="/insights/answer-engine-optimization">answer engine optimization</a> works against.</p>
<p>The practical read for this quarter:</p>
<ul>
<li><strong>Nothing breaks tomorrow.</strong> The deal is announced, not closed, and no close date was given. Model downloads, Spaces and inference endpoints keep working.</li>
<li><strong>Watch the terms of service, not the press release.</strong> Any real change in what open means will show up first in Hub terms, licensing defaults or rate limits, not in a blog post.</li>
<li><strong>Treat model distribution as a supplier dependency.</strong> Teams pulling open weights from a single hub in production have a concentration question to answer, and the counterparty just changed.</li>
</ul>`,
    sourceUrl: "https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/",
    tags: [
      "Acquisition",
      "NVIDIA",
      "Hugging Face",
      "Open Source",
      "Open Weights",
      "AI Infrastructure",
      "Model Distribution",
    ],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO, announced the acquisition and stated the price" },
      { label: "Clement Delangue", to: "/ai-contributors/delangue", description: "Hugging Face co-founder and CEO" },
      { label: "Thomas Wolf", to: "/ai-contributors/wolf", description: "Hugging Face co-founder and chief science officer" },
      { label: "Answer Engine Optimization", to: "/insights/answer-engine-optimization", description: "Why model distribution shapes what answer engines cite" },
    ],
  },
  {
    id: "rise-of-ai-agents",
    slug: "rise-of-ai-agents-2026",
    title: "The Rise of AI Agents: A $2.5 Billion Week and the Numbers Behind It",
    company: "AI Industry",
    category: "industry",
    date: "2026-09-03",
    summary:
      "In the last week of August 2026, the personal AI agent became a venture category of its own: Instinct, an invite-only assistant built by a 23-year-old former Sierra researcher, was reported at a $2.5 billion valuation, and Town entered talks at $1 billion a day later. The same week, McKinsey's State of AI survey found 40% of large enterprises now scaling AI agents, and Salesforce reported Agentforce crossed $1.5 billion in ARR. The hype and the data finally arrived together, along with Gartner's standing prediction that over 40% of agentic AI projects will be canceled by the end of 2027.",
    takeaways: [
      "The Wall Street Journal reported on August 26 that Instinct closed a $250 million Series B co-led by Index Ventures and Benchmark at a $2.5 billion valuation, roughly five times its early-August mark per Forbes. A day later, Newcomer reported Town in talks at $1 billion, led by the same firm backing Instinct.",
      "The enterprise data landed the same week: 40% of $1 billion-plus organizations are scaling AI agents in at least one function, up from 27% a year earlier (McKinsey, n=1,719), and 57.3% of organizations surveyed by LangChain have agents in production.",
      "The vendors' own numbers point the same direction: Salesforce reported Agentforce ARR above $1.5 billion, up over 240% year over year, and Microsoft telemetry shows more than 80% of the Fortune 500 running active AI agents.",
      "The counterweight is just as concrete: Gartner predicts over 40% of agentic AI projects will be canceled by the end of 2027, and several of the week's headline valuations are reported talks, not closed rounds.",
    ],
    tocSections: [
      "The Week the Personal Agent Became a Category",
      "The Enterprise Numbers Behind the Hype",
      "How Capable Are They, Really",
      "The Case for Caution",
    ],
    myView: {
      points: [
        "The consumer wave is a distribution story, not a capability story | Instinct and Town wrap the same frontier models everyone else uses. What changed is who they reach: people who will never open a developer tool, served over text messages and phone calls. A $2.5 billion price on an invite-only assistant is a bet on owning the personal-assistant relationship itself, the same wedge the browser and the smartphone home screen once were.",
        "The bifurcation is the real statistic | Large enterprises scaling agents jumped from 27% to 40% in a year while smaller firms sat flat at 22%, and Deloitte found 85% of organizations testing agents but only 15% running them at orchestrated scale. The gap between demo and deployment is where the next two years of winners and losers get decided, and it is widening, not closing.",
        "Benchmark saturation means the frontier moved | When seven models score 95% or better on SWE-bench Verified, the benchmark has stopped measuring the frontier. The number to watch is METR's task horizon: the length of task agents can complete is doubling roughly every 131 days. Hour-long tasks became day-long tasks; when day-long becomes week-long, org charts change, not just toolchains.",
        "Gartner's cancellation call and the funding records are both right | This is the classic shape of an infrastructure boom: capital overbuilds, most projects die, and the rails that survive run everything. Over 40% of agentic projects canceled by 2027 and a record $510 billion H1 for venture capital are not contradictory data points. They are the same story told from both ends.",
      ],
      caveat:
        "Several of the week's headline numbers are reported talks rather than closed rounds (Town at $1 billion, Cognition at $40 billion), and the platform metrics (Agentforce work units, Claude Code run rate, Microsoft's Fortune 500 telemetry) are the vendors' own figures, not audited ones. The living statistics page linked below tracks which is which.",
    },
    highlights: [
      { stat: "$2.5B", label: "Instinct valuation, reported Aug 26 (WSJ)" },
      { stat: "40%", label: "of large enterprises scaling agents (McKinsey)" },
      { stat: "$1.5B+", label: "Agentforce ARR, up 240% Y/Y (Salesforce)" },
      { stat: "97%", label: "top SWE-bench Verified score, vs 49% in Oct 2024" },
    ],
    documents: [
      {
        label: "WSJ: The latest viral AI assistant rocketing across Silicon Valley",
        source: "The Wall Street Journal, 26 Aug 2026",
        url: "https://www.wsj.com/tech/ai/the-latest-viral-ai-assistant-rocketing-across-silicon-valley-abb46276",
      },
      {
        label: "McKinsey, The State of AI in 2026: On the road to ROI (n=1,719)",
        source: "McKinsey & Company, 25 Aug 2026",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
      },
      {
        label: "Salesforce Q2 FY27 earnings: Agentforce ARR exceeds $1.5 billion",
        source: "Salesforce press release, 26 Aug 2026",
        url: "https://www.salesforce.com/news/press-releases/2026/08/26/fy27-q2-earnings/",
      },
      {
        label: "Gartner: over 40% of agentic AI projects will be canceled by end of 2027",
        source: "Gartner press release, 25 Jun 2025",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027",
      },
      {
        label: "METR, Time Horizon 1.1: agent task horizons doubling every ~131 days",
        source: "METR, 29 Jan 2026",
        url: "https://metr.org/blog/2026-1-29-time-horizon-1-1/",
      },
      {
        label: "LangChain, State of Agent Engineering (n=1,340)",
        source: "LangChain",
        url: "https://www.langchain.com/state-of-agent-engineering",
      },
    ],
    body: `<h3 id="the-week-the-personal-agent-became-a-category">The Week the Personal Agent Became a Category</h3>
<p>On August 26, the Wall Street Journal reported that Instinct, an invite-only AI assistant that handles errands and makes purchases over text messages and phone calls, closed a $250 million Series B co-led by Index Ventures and Benchmark at a $2.5 billion valuation, bringing its total funding to $350 million. Its founder, Noah Shinn, is a 23-year-old former researcher at Sierra, the agent company Bret Taylor co-founded. Forbes, publishing the same day, noted the valuation had jumped roughly fivefold from just over $500 million in early August, and described the round as still in talks even as other outlets reported it closed. That discrepancy is worth keeping.</p>
<p>One day later, Newcomer reported that Town, an assistant startup founded by former Plaid CTO Jean-Denis Greze that gives users customizable agent characters, was in talks to raise at a $1 billion valuation in a round led by Index, the same firm backing Instinct. LinkedIn News framed the pair as the arrival of AI agents "for normal people": assistants positioned as personal help rather than developer tools, with user bases running from investors to plumbers.</p>
<p>The week did not happen in isolation. On August 12, Bloomberg-sourced reporting said Cognition, maker of the Devin coding agent, was already in talks to raise at a valuation of at least $40 billion, less than three months after closing its previous round at $26 billion post-money. And the capital backdrop is the largest ever: Crunchbase counted a record $510 billion in global venture funding in the first half of 2026, with more than 70% of second-quarter capital going to AI companies.</p>
<h3 id="the-enterprise-numbers-behind-the-hype">The Enterprise Numbers Behind the Hype</h3>
<p>What makes this moment different from the agent hype of 2024 is that the enterprise data arrived in the same news cycle. McKinsey's State of AI survey, published August 25 with 1,719 respondents across 97 countries, found that 40% of large organizations (over $1 billion in revenue) are now scaling AI agents in at least one business function, up from 27% a year earlier. Smaller organizations sat flat at 22%, and McKinsey's AI high performers were more than three times as likely to be scaling agents across most functions. LangChain's State of Agent Engineering survey of 1,340 practitioners found 57.3% of organizations with agents in production, up from 51% the prior year. KPMG's quarterly pulse of US enterprise leaders adds the texture: 53% deploying agents, with the share orchestrating multiple agents across workflows doubling in a quarter, from 9% to 18%.</p>
<p>The maturity gap is just as measurable. Deloitte's August 12 study of 501 US organizations found 85% testing or expanding agents, but only 15% at scaled, orchestrated multi-agent adoption. Most of the market is still in the pilot phase it claims to be past.</p>
<p>The platform companies' own numbers point the same way, with the usual caveat that they are the companies' own numbers. Salesforce reported on August 26 that Agentforce passed $1.5 billion in annual recurring revenue, up over 240% year over year, alongside 7 billion "Agentic Work Units" delivered to date, 3.2 billion of them in the most recent quarter. Microsoft's security telemetry counts more than 80% of the Fortune 500 running active AI agents. Anthropic disclosed that Claude Code, its agentic coding tool, passed a $2.5 billion revenue run rate, more than double where it started the year.</p>
<h3 id="how-capable-are-they-really">How Capable Are They, Really</h3>
<p>The benchmark story of 2026 is saturation at the top. As of the Vals AI leaderboard update on August 26, the best model scores 97.00% on SWE-bench Verified, the standard test of whether an agent can resolve real GitHub issues. In October 2024 the state of the art was 49%. Seven of the 86 evaluated models now score 95% or better, which is why the field's attention is shifting to harder, messier tests of computer use and long-horizon work.</p>
<p>The more durable measurement comes from METR, which tracks the length of task an agent can complete with a 50% success rate. On the post-2023 trend, that task horizon is doubling roughly every 131 days, and the longest measured horizon has reached about 17.4 hours of human-equivalent work. If the doubling holds, tasks that take a person a full week come into range within a couple of years. That single curve, not any one benchmark score, is the load-bearing fact under every agent valuation in this article.</p>
<h3 id="the-case-for-caution">The Case for Caution</h3>
<ul>
<li><strong>Gartner's standing prediction.</strong> Over 40% of agentic AI projects will be canceled by the end of 2027, driven by escalating costs, unclear business value, and inadequate risk controls. The same firm coined "agent washing" for vendors rebranding chatbots and RPA as agents.</li>
<li><strong>Talks are not closes.</strong> Town's $1 billion and Cognition's $40 billion are reported negotiations, not completed rounds. Even Instinct's $250 million was described by Forbes as still in talks on the day others reported it raised.</li>
<li><strong>Company numbers are company numbers.</strong> Agentforce work units, Claude Code's run rate, and Microsoft's Fortune 500 telemetry are self-reported and unaudited. Directionally consistent, independently unverified.</li>
<li><strong>The surveys measure different bars.</strong> "In production" (LangChain, 57.3%), "scaling in at least one function" (McKinsey, 40%), and "scaled multi-agent orchestration" (Deloitte, 15%) are three different thresholds. The spread between them is the honest picture of where adoption actually stands.</li>
</ul>
<p>Every number in this article, and dozens more, lives on this site's <a href="/notebook/ai/agents">AI Agent Statistics page</a>, a living reference updated monthly where each figure links to its source and is labeled by kind: survey, forecast, company claim, benchmark, or funding.</p>
<p>Coverage: <a href="https://www.wsj.com/tech/ai/the-latest-viral-ai-assistant-rocketing-across-silicon-valley-abb46276" target="_blank" rel="noopener noreferrer">WSJ on Instinct</a> · <a href="https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai" target="_blank" rel="noopener noreferrer">McKinsey State of AI</a> · <a href="https://www.salesforce.com/news/press-releases/2026/08/26/fy27-q2-earnings/" target="_blank" rel="noopener noreferrer">Salesforce Q2 FY27</a> · <a href="https://metr.org/blog/2026-1-29-time-horizon-1-1/" target="_blank" rel="noopener noreferrer">METR Time Horizon 1.1</a> · <a href="https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027" target="_blank" rel="noopener noreferrer">Gartner</a></p>
<p><em>This article summarizes contemporaneous news reports, published surveys, and the companies' own figures. Reported valuations are not confirmed transactions. It is not investment advice.</em></p>`,
    sourceUrl: "https://www.wsj.com/tech/ai/the-latest-viral-ai-assistant-rocketing-across-silicon-valley-abb46276",
    tags: ["AI agents", "Instinct", "Town", "Cognition", "Agentforce", "SWE-bench", "METR", "agentic AI", "venture capital"],
    relatedLinks: [
      {
        label: "AI Agent Statistics",
        to: "/notebook/ai/agents",
        description: "The living reference behind this article: 81 verified numbers on adoption, money, scale, and capability, updated monthly.",
      },
      {
        label: "How LLMs Work",
        to: "/guides/how-llms-work",
        description: "The models underneath every agent: the stages a prompt passes through, in explorable 3D.",
      },
      {
        label: "Map of the AI Economy",
        to: "/notebook/ai/map",
        description: "Where the agent companies sit among 455 players in the AI value chain.",
      },
    ],
  },
  {
    id: "stripe-openrouter-acquisition",
    slug: "stripe-openrouter-acquisition-7-billion",
    title: "Stripe Agrees to Buy AI Model Router OpenRouter for More Than $7 Billion",
    company: "Stripe",
    category: "industry",
    date: "2026-08-16",
    summary:
      "Bloomberg reported on August 16, 2026 that Stripe has agreed to acquire OpenRouter, the gateway developers use to route requests across hundreds of AI models, for more than $7 billion. That is roughly five times the $1.3 billion valuation OpenRouter set less than three months earlier. Neither company has confirmed the deal: both declined to comment, and nothing appears in Stripe's newsroom.",
    takeaways: [
      "Bloomberg reported the agreement on August 16, 2026 at more than $7 billion. The Wall Street Journal had reported talks around $10 billion on July 23, so the reported figure moved down as the deal firmed up.",
      "OpenRouter raised a $113 million Series B led by Alphabet's CapitalG in May 2026 at about $1.3 billion, itself more than double the roughly $547 million it was worth a year before. A sale above $7 billion is about 5x that May mark.",
      "Neither party has confirmed. Stripe's spokesperson said the firm does not comment on rumors or speculation; OpenRouter declined to comment. Treat the price as reported, not official, until one of them says so.",
      "It lands while Stripe, with Advent, is pursuing a roughly $53 billion takeover bid for PayPal. Two very different bets on where payment infrastructure goes next.",
    ],
    tocSections: [
      "What OpenRouter Actually Does",
      "The Numbers Behind the Price",
      "Why a Payments Company Wants a Model Router",
      "What Is Not Confirmed",
    ],
    dealLogos: {
      left: {
        name: "Stripe",
        onLight: "/logos/stripe-on-light.svg",
        onDark: "/logos/stripe-on-dark.svg",
        source: "Stripe official logo kit, stripe.com/newsroom/brand-assets",
        height: 26,
      },
      right: {
        name: "OpenRouter",
        onLight: "/logos/openrouter-on-light.svg",
        onDark: "/logos/openrouter-on-dark.svg",
        source: "OpenRouter official brand assets, openrouter.ai/brand",
        height: 22,
      },
      connector: "reportedly acquires",
    },
    myView: {
      points: [
        "Stripe is buying the meter, not the router | Stripe's entire franchise is sitting in the middle of a transaction and metering it. OpenRouter already counts every token for 10 million developers across 500+ models, and its volume roughly doubled in three months. That is the same toll-booth position, installed on the rail that is growing fastest.",
        "It is the only neutral vantage point in AI, and there is exactly one | No model lab can see cross-provider demand: OpenAI sees OpenAI. A router sees who switches from whom, at what price, the moment quality slips. That dataset compounds with volume and cannot be rebuilt later, because neutrality is earned early or never. The 5x markup in three months is the price of that scarcity, not of the revenue.",
        "It completes the agent-payments thesis | Stripe spent the past year shipping rails so AI agents can buy things. The gap was that the thing agents buy most is inference itself. Owning the gateway means Stripe can authorize, meter, and settle the machine economy's most common transaction, then bundle it into one developer bill: the same wedge that won it payments.",
        "The PayPal bid is the tell | Stripe also has a roughly $53 billion offer outstanding for PayPal. Two hedges on incompatible futures: one where payments consolidate into scale, one where the fastest-growing transactions are machines paying for compute. This one costs about 13 percent of that bid, which makes it cheap optionality on becoming the default rail of the second future.",
      ],
      caveat:
        "Gateway margins are thin and structurally squeezable. Model providers can route around an aggregator, and every hyperscaler wants this layer. Stripe would be paying a strategic-position multiple for a business whose moat is neutrality and switching cost rather than technology. And nothing here is confirmed.",
    },
    highlights: [
      { stat: "$7B+", label: "reported purchase price (Bloomberg)" },
      { stat: "5x", label: "of OpenRouter's May 2026 valuation" },
      { stat: "500+", label: "models routed, across 80+ providers" },
      { stat: "10M+", label: "users, per OpenRouter's own site" },
    ],
    documents: [
      {
        label: "Bloomberg: Stripe finalizes deal to acquire OpenRouter for over $7 billion",
        source: "Bloomberg, 16 Aug 2026",
        url: "https://www.bloomberg.com/news/articles/2026-08-16/stripe-nears-deal-to-buy-ai-firm-openrouter-for-over-7-billion",
      },
      {
        label: "Stripe will reportedly acquire AI gateway startup OpenRouter for $7B+",
        source: "TechCrunch, 16 Aug 2026",
        url: "https://techcrunch.com/2026/08/16/stripe-will-reportedly-acquire-ai-gateway-startup-openrouter-for-7b/",
      },
      {
        label: "Stripe clinches over $7 billion deal to buy AI firm OpenRouter",
        source: "Fortune, 16 Aug 2026",
        url: "https://fortune.com/2026/08/16/stripe-7-billion-deal-ai-firm-openrouter-acquisition/",
      },
      {
        label: "OpenRouter raises $113M Series B (the company's own announcement)",
        source: "OpenRouter, May 2026",
        url: "https://openrouter.ai/announcements/series-b",
      },
      {
        label: "OpenRouter more than doubles valuation to $1.3B in a year",
        source: "TechCrunch, 26 May 2026",
        url: "https://techcrunch.com/2026/05/26/openrouter-more-than-doubles-valuation-to-1-3b-in-a-year/",
      },
    ],
    videos: [
      {
        kind: "short",
        label: "The deal in 30 seconds, narrated",
        url: "/videos/stripe-openrouter-acquisition-7-billion-30s.mp4",
        duration: "0:29",
      },
    ],
    body: `<h3 id="what-openrouter-actually-does">What OpenRouter Actually Does</h3>
<p>OpenRouter is a gateway. Instead of wiring your application separately to OpenAI, Anthropic, Google, Meta and a long tail of open-weight providers, you send one request to OpenRouter and it routes to whichever model fits the job, the budget, or whatever is actually up right now. One API key, one bill, one place to switch models when a cheaper or better one appears. The company describes itself as "the unified interface for every model"; its founder, Alex Atallah, who earlier co-founded the NFT marketplace OpenSea, has called it a single access point that prevents lock-in.</p>
<p>Founded in 2023 and based in New York, it sits at a peculiar spot in the stack: it owns no models and trains nothing, but it sees the traffic. Its own site currently advertises 500+ models across 80+ providers, 10 million users, and more than 200 trillion tokens routed per month.</p>
<h3 id="the-numbers-behind-the-price">The Numbers Behind the Price</h3>
<p>The price is startling mostly because of how recent the last one was. In May 2026 OpenRouter announced a $113 million Series B led by CapitalG, Alphabet's growth fund, with NVIDIA's NVentures, ServiceNow, MongoDB, Snowflake and Databricks ventures arms joining existing backers Andreessen Horowitz and Menlo Ventures. That round valued the company at about $1.3 billion, already more than double the roughly $547 million it commanded a year earlier. A sale above $7 billion is roughly five times that mark, agreed less than three months later.</p>
<p>The growth underneath it is the argument. At the Series B the company reported 25 trillion tokens per week, about 100 trillion a month and a fivefold rise in six months. Its site now claims north of 200 trillion a month. Note the moving target on users, too: the May round and most coverage cite 8 million and 400+ models, while OpenRouter's own homepage today says 10 million and 500+. Both are the company's own figures, at different dates, and neither is independently audited.</p>
<h3 id="why-a-payments-company-wants-a-model-router">Why a Payments Company Wants a Model Router</h3>
<p>Stripe's thesis, visible in its shipping over the past year, is that AI agents will become economic actors that buy things, and that somebody has to meter and settle what they consume. A router is exactly that meter: it already counts tokens per customer, per model, per provider, and bills for them. Buying OpenRouter puts Stripe in the path of model traffic the way it sits in the path of card traffic, with usage data that no model vendor has in aggregate.</p>
<p>The strategic context is louder than the price. Stripe, alongside private equity firm Advent, has an outstanding takeover bid for PayPal valuing it near $53 billion, reported in mid-July. Buying a model gateway for $7 billion while bidding $53 billion for a payments incumbent is a company hedging two futures at once: the one where payment rails consolidate, and the one where the interesting transactions are machines paying for inference.</p>
<h3 id="what-is-not-confirmed">What Is Not Confirmed</h3>
<ul>
<li><strong>No official announcement.</strong> As of this writing there is nothing about OpenRouter in Stripe's newsroom, and no post on OpenRouter's announcements page. Everything here traces to reporting, not to the parties.</li>
<li><strong>Both companies declined to comment.</strong> Stripe said it "does not comment on rumors or speculation"; OpenRouter declined. That is not a denial, and it is not a confirmation.</li>
<li><strong>The number moved once already.</strong> The Journal reported roughly $10 billion in July; Bloomberg reported more than $7 billion in August. Final terms, structure, and any earnout are unreported.</li>
<li><strong>Closing is not agreement.</strong> Deals of this size face regulatory review and can be restructured or abandoned. Nothing here says the transaction has closed.</li>
</ul>
<p>Coverage: <a href="https://www.bloomberg.com/news/articles/2026-08-16/stripe-nears-deal-to-buy-ai-firm-openrouter-for-over-7-billion" target="_blank" rel="noopener noreferrer">Bloomberg</a> · <a href="https://techcrunch.com/2026/08/16/stripe-will-reportedly-acquire-ai-gateway-startup-openrouter-for-7b/" target="_blank" rel="noopener noreferrer">TechCrunch</a> · <a href="https://fortune.com/2026/08/16/stripe-7-billion-deal-ai-firm-openrouter-acquisition/" target="_blank" rel="noopener noreferrer">Fortune</a> · <a href="https://www.reuters.com/business/finance/stripe-advent-offer-buy-paypal-more-than-53-billion-2026-07-15/" target="_blank" rel="noopener noreferrer">Reuters on the PayPal bid</a></p>
<p><em>This article summarizes contemporaneous news reports and the companies' own published figures. Neither company has confirmed the transaction. It is not investment advice.</em></p>`,
    sourceUrl: "https://www.bloomberg.com/news/articles/2026-08-16/stripe-nears-deal-to-buy-ai-firm-openrouter-for-over-7-billion",
    tags: ["Stripe", "OpenRouter", "acquisition", "AI infrastructure", "model routing", "AI gateway", "payments"],
    relatedLinks: [
      {
        label: "How LLMs Work",
        to: "/guides/how-llms-work",
        description: "What a router actually routes: the stages every prompt passes through, in explorable 3D.",
      },
      {
        label: "Map of the AI Economy",
        to: "/notebook/ai/map",
        description: "Where gateways and inference providers sit among the 455 players in the value chain.",
      },
      {
        label: "AI Encyclopedia: Inference",
        to: "/notebook/ai/encyclopedia/inference-optimization",
        description: "The economics OpenRouter arbitrages: latency, cost per token, and provider choice.",
      },
    ],
  },
  {
    id: "nvidia-ssi-partnership",
    slug: "nvidia-safe-superintelligence-5b-partnership",
    title: "NVIDIA Puts $5 Billion Into Ilya Sutskever's Safe Superintelligence",
    company: "NVIDIA",
    category: "industry",
    date: "2026-07-27",
    summary:
      "NVIDIA is investing $5 billion in Safe Superintelligence and giving it access to the Vera Rubin platform, enough to raise SSI's compute by an order of magnitude. NVIDIA says it committed after being granted rare access to research SSI has kept closed for two years.",
    takeaways: [
      "NVIDIA invests $5 billion and pairs it with access to its next-generation Vera Rubin platform, which SSI says lifts its compute by an order of magnitude.",
      "The two companies will also collaborate on NVIDIA's current and future compute platforms, using what NVIDIA calls SSI's insights into where AI is heading.",
      "NVIDIA states it entered the partnership after obtaining rare access to SSI's closely guarded research. SSI has shipped no product and has no revenue.",
      "SSI was founded in 2024 and is led by Ilya Sutskever and Daniel Levy. Sutskever became CEO in mid-2025 after co-founder Daniel Gross left for Meta.",
    ],
    tocSections: ["What Was Announced", "Why NVIDIA Did It", "What It Signals"],
    contributors: ["sutskever", "huang"],
    highlights: [
      { stat: "$5B", label: "NVIDIA investment in SSI" },
      { stat: "10x", label: "increase in SSI compute" },
      { stat: "2024", label: "year SSI was founded" },
      { stat: "$0", label: "SSI revenue to date" },
    ],
    documents: [
      {
        label: "Official announcement, NVIDIA investor relations",
        source: "NVIDIA Corporation",
        url: "https://investor.nvidia.com/news/press-release-details/2026/Ilya-Sutskevers-Safe-Superintelligence-Inc--and-NVIDIA-Announce-Long-Term-Strategic-Partnership/default.aspx",
      },
      {
        label: "Press release, full text",
        source: "NVIDIA Newsroom",
        url: "https://nvidianews.nvidia.com/news/ilya-sutskevers-safe-superintelligence-inc-and-nvidia-announce-long-term-strategic-partnership",
      },
      {
        label: "Wire distribution copy",
        source: "GlobeNewswire, 27 Jul 2026",
        url: "https://www.globenewswire.com/news-release/2026/07/27/3333561/0/en/Ilya-Sutskever-s-Safe-Superintelligence-Inc-and-NVIDIA-Announce-Long-Term-Strategic-Partnership.html",
      },
    ],
    body: `<h3 id="what-was-announced">What Was Announced</h3>
<p>On July 27, 2026, NVIDIA and Safe Superintelligence Inc. announced what both call a long-term strategic partnership. NVIDIA is investing $5 billion and giving SSI access to its next-generation Vera Rubin platform. SSI says the combination raises its available compute by an order of magnitude, and the two companies will work together on NVIDIA's current and future platforms.</p>
<h3 id="why-nvidia-did-it">Why NVIDIA Did It</h3>
<p>The detail worth pausing on is in NVIDIA's own wording: it entered the partnership after obtaining rare access to research SSI has kept closed since it was founded. SSI has released no product, published little, and has no revenue. NVIDIA is underwriting a research direction it has seen and the public has not.</p>
<p>Sutskever's track record is the collateral. He was a co-author on AlexNet, worked on AlphaGo and sequence-to-sequence learning, contributed to the GPT series, and led the research behind OpenAI's reasoning models.</p>
<h3 id="what-it-signals">What It Signals</h3>
<ul>
<li><strong>Compute is the moat, and it is being allocated by conviction.</strong> A pre-product lab getting a ten-fold compute increase says frontier capacity now moves on judgement about people, not on traction.</li>
<li><strong>The chip supplier is picking winners.</strong> NVIDIA investing in a lab that buys its hardware is a closed loop worth watching, and it is not the first such deal.</li>
<li><strong>Alignment-first framing is now fundable at scale.</strong> SSI's stated purpose is a safe superintelligence, and that thesis just attracted $5 billion without a product.</li>
</ul>
<p><em>This article summarizes NVIDIA's own announcement and contemporaneous reporting.</em></p>`,
    sourceUrl: "https://nvidianews.nvidia.com/news/ilya-sutskevers-safe-superintelligence-inc-and-nvidia-announce-long-term-strategic-partnership",
    tags: ["NVIDIA", "Safe Superintelligence", "Ilya Sutskever", "compute", "AI safety"],
    relatedLinks: [
      {
        label: "Ilya Sutskever",
        to: "/ai-contributors/sutskever",
        description: "Co-founder and CEO of SSI, and one of the most cited researchers in modern AI.",
      },
      {
        label: "Map of the AI Economy",
        to: "/notebook/ai/map",
        description: "Where compute suppliers and frontier labs sit in the value chain.",
      },
    ],
  },
  {
    id: "karpathy-joins-anthropic",
    slug: "andrej-karpathy-joins-anthropic-pretraining",
    title: "Andrej Karpathy Joins Anthropic's Pre-Training Team",
    company: "Anthropic",
    category: "industry",
    date: "2026-05-19",
    summary:
      "The OpenAI founding member and former Tesla AI director has joined Anthropic to work on pre-training, building a group that uses Claude to accelerate pretraining research. Eureka Labs, the education company he founded in 2024, is paused rather than closed.",
    takeaways: [
      "Karpathy joined Anthropic's pre-training team in May 2026, forming a group that uses Claude to speed up pretraining research itself.",
      "He was a founding member of OpenAI, then Director of AI at Tesla, then returned to OpenAI, before founding Eureka Labs in 2024.",
      "Eureka Labs is paused, not shut down. His teaching work, including Neural Networks: Zero to Hero and nanoGPT, remains free and widely used.",
      "The move puts one of the field's best-known educators inside a frontier lab's core training effort.",
    ],
    tocSections: ["What Happened", "Why It Matters", "What He Leaves Behind"],
    contributors: ["karpathy", "dario-amodei"],
    highlights: [
      { stat: "May 2026", label: "joined Anthropic" },
      { stat: "2015", label: "OpenAI founding member" },
      { stat: "5 yrs", label: "Director of AI at Tesla" },
      { stat: "Free", label: "his courses remain" },
    ],
    body: `<h3 id="what-happened">What Happened</h3>
<p>Andrej Karpathy joined Anthropic's pre-training team in May 2026, reported by TechCrunch on the 19th. The role is not a research-advisor seat: he is building a group that uses Claude to accelerate pretraining research, which means using the model to help improve how the next model is trained.</p>
<h3 id="why-it-matters">Why It Matters</h3>
<p>Karpathy is unusual in having been at the centre of three distinct eras: a founding member of OpenAI in 2015, Director of AI at Tesla through the Autopilot years, then back at OpenAI, then out on his own with Eureka Labs. Very few people have built at that level and then taught it publicly for free.</p>
<p>Pre-training is also the least glamorous and most consequential part of the stack. It is where capability is actually set, before any fine-tuning or product work.</p>
<h3 id="what-he-leaves-behind">What He Leaves Behind</h3>
<p>Eureka Labs is paused rather than wound up. His teaching material stays where it was and stays free: Neural Networks: Zero to Hero, Let's build GPT from scratch, nanoGPT, minGPT, and nanochat. Those remain among the most recommended free resources for learning how a language model actually works, and several of them anchor this site's own learning roadmap.</p>
<p><em>This article summarizes contemporaneous reporting.</em></p>`,
    sourceUrl: "https://techcrunch.com/2026/05/19/openai-co-founder-andrej-karpathy-joins-anthropics-pre-training-team/",
    tags: ["Anthropic", "Andrej Karpathy", "pre-training", "Claude", "AI education"],
    relatedLinks: [
      {
        label: "Andrej Karpathy",
        to: "/ai-contributors/karpathy",
        description: "Full profile: OpenAI founding member, Tesla, Eureka Labs, and now Anthropic.",
      },
      {
        label: "Free AI Roadmap",
        to: "/notebook/ai/roadmap",
        description: "His Zero to Hero series and nanoGPT anchor several topics in the curriculum.",
      },
    ],
  },
  {
    id: "anthropic-settlement-final-approval",
    slug: "anthropic-copyright-settlement-final-approval",
    title: "Court Gives Final Approval to Anthropic's $1.5 Billion Author Settlement",
    company: "Anthropic",
    category: "policy",
    date: "2026-07-20",
    summary:
      "A federal judge granted final approval to Anthropic's $1.5 billion settlement with book authors and publishers on July 20, 2026, the largest known copyright settlement in U.S. history. Roughly 500,000 pirated books, about $3,000 per work, and a fair use ruling on AI training that survives intact.",
    takeaways: [
      "U.S. District Judge Araceli Martínez-Olguín granted final approval on July 20, 2026. It is the largest known settlement of a U.S. copyright case.",
      "The fund pays about $3,000 per work across an estimated 500,000 books, shared by the authors and publishers who hold the rights, with a reported claims rate of 92.77 percent.",
      "The June 2025 ruling that training on lawfully acquired books is fair use still stands. What Anthropic paid for was downloading and keeping millions of pirated copies.",
      "The settlement is not binding precedent: it resolved before any appeal, opt-outs are pursuing separate suits, and parallel cases against other AI labs continue.",
    ],
    tocSections: [
      "The Ruling Behind It",
      "What It Does Not Settle",
      "Why It Matters",
    ],
    highlights: [
      { stat: "$1.5B", label: "largest known U.S. copyright settlement" },
      { stat: "$3,000", label: "per book, paid to rightsholders" },
      { stat: "500,000", label: "pirated books covered" },
      { stat: "92.77%", label: "reported claims rate" },
    ],
    documents: [
      {
        label: "Full federal docket, No. 3:24-cv-05417",
        source: "CourtListener / RECAP",
        url: "https://www.courtlistener.com/docket/69058235/bartz-v-anthropic-pbc/",
      },
      {
        label: "Judge Alsup's June 2025 fair use order",
        source: "Justia, Doc. 231",
        url: "https://docs.justia.com/cases/federal/district-courts/california/candce/3:2024cv05417/434709/231",
      },
      {
        label: "Official case archive",
        source: "GovInfo, U.S. Government Publishing Office",
        url: "https://www.govinfo.gov/app/details/USCOURTS-cand-3_24-cv-05417",
      },
      {
        label: "Settlement administration site",
        source: "JND Legal Administration",
        url: "https://www.anthropiccopyrightsettlement.com/",
      },
    ],
    videos: [
      {
        kind: "short",
        label: "The settlement in 30 seconds",
        url: "/videos/anthropic-settlement-30s.mp4",
        duration: "0:30",
      },
      {
        kind: "clip",
        label: "News clip: Anthropic's $1.5B payout",
        url: "https://www.youtube.com/watch?v=ISzkEVbasac",
        duration: "Scripps News",
      },
      {
        kind: "full",
        label: "IP lawyers on the settlement: The Briefing",
        url: "https://www.youtube.com/watch?v=5iHD3XtMLIM",
        duration: "Weintraub Tobin",
      },
    ],
    body: `<h3 id="the-ruling-behind-it">The Ruling Behind It</h3>
<p>In June 2025, Judge William Alsup split the case in two: training on books Anthropic had lawfully bought was "quintessentially transformative" fair use, but downloading more than seven million pirated books and keeping them in a central library was infringement. That claim was headed to a trial where the Copyright Act allows up to $150,000 per work for willful infringement (17 U.S.C. § 504(c)). Anthropic settled first. Judge Alsup, now retired, gave preliminary approval in September 2025; Judge Araceli Martínez-Olguín held the fairness hearing on May 14, 2026 and granted final approval on July 20, rejecting objections that the deal was too small. Law.com reported she also cut the requested attorneys' fees by about $86 million.</p>
<h3 id="what-it-does-not-settle">What It Does Not Settle</h3>
<ul>
<li><strong>No binding precedent.</strong> One district court, resolved before appeal. Other courts can go the other way.</li>
<li><strong>Opt-outs are still suing.</strong> Authors and publishers who declined the deal have their own cases pending.</li>
<li><strong>The industry question stays open.</strong> Training suits against OpenAI, Meta, Google, and Midjourney continue.</li>
</ul>
<h3 id="why-it-matters">Why It Matters</h3>
<ul>
<li><strong>Pirated training data now has a price:</strong> $3,000 per work, at class scale, blessed by a court.</li>
<li><strong>The split matters more than the payout.</strong> Training on lawful copies stands as fair use. The acquisition path is what cost $1.5 billion.</li>
<li><strong>Provenance is now a balance sheet item.</strong> "Where did the corpus come from" is the first diligence question, not a footnote.</li>
</ul>
<p>Coverage: <a href="https://www.reuters.com/world/us-judge-approves-anthropics-15-billion-settlement-copyright-lawsuit-2026-07-20/" target="_blank" rel="noopener noreferrer">Reuters</a> · <a href="https://techcrunch.com/2026/07/20/anthropics-landmark-1-5b-copyright-settlement-is-approved/" target="_blank" rel="noopener noreferrer">TechCrunch</a> · <a href="https://publishers.org/news/aap-welcomes-courts-final-settlement-approval-in-bartz-v-anthropic/" target="_blank" rel="noopener noreferrer">AAP statement</a></p>
<p><em>This article summarizes public court records and contemporaneous news reports. It is not legal advice.</em></p>`,
    sourceUrl: "https://www.reuters.com/world/us-judge-approves-anthropics-15-billion-settlement-copyright-lawsuit-2026-07-20/",
    tags: ["Anthropic", "copyright", "fair use", "class action", "AI training data", "Bartz v. Anthropic"],
    relatedLinks: [
      {
        label: "How LLMs Work",
        to: "/guides/how-llms-work",
        description: "What training on text actually means, stage by stage, in an explorable 3D walkthrough.",
      },
      {
        label: "Map of the AI Economy",
        to: "/notebook/ai/map",
        description: "Where Anthropic sits among the 455 players in the AI value chain.",
      },
    ],
  },
  {
    id: "nvidia-nemoclaw",
    slug: "nvidia-nemoclaw-secure-ai-agents",
    title: "NVIDIA NemoClaw: Secure, Always-On AI Agents With One Command",
    company: "NVIDIA",
    category: "open-source",
    date: "2026-03-16",
    summary: "Announced at GTC 2026, NemoClaw is NVIDIA's open-source stack that adds privacy and security controls to OpenClaw. It bundles Nemotron models and the new OpenShell runtime into a single-command install for autonomous AI agents.",
    takeaways: [
      "NemoClaw adds enterprise-grade privacy and security guardrails to OpenClaw — what Jensen called 'the operating system for personal AI.'",
      "Uses a privacy router that splits inference between local Nemotron models and cloud frontier models, keeping sensitive data on your hardware.",
      "Microsoft Security already reports a 160x improvement in finding AI-based attacks using Nemotron and OpenShell.",
      "Deploys with one command on GeForce RTX, RTX PRO workstations, DGX Station (up to 1T parameter models), and DGX Spark.",
    ],
    tocSections: ["Key Architecture", "Where It Runs", "Why It Matters"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang",
    body: `<h3 id="key-architecture">Key Architecture</h3>
<ul>
<li><strong>Privacy router</strong> — routes inference between local open models (Nemotron running on your hardware) and cloud frontier models, with policy-based security guardrails</li>
<li><strong>OpenShell runtime</strong> — isolated sandbox with data privacy and security controls for autonomous AI agents ("claws")</li>
<li><strong>NVIDIA Agent Toolkit</strong> — the software layer that secures OpenClaw agent operations</li>
<li><strong>One-command install:</strong> <code>curl -fsSL https://nvidia.com/nemoclaw.sh | bash</code></li>
</ul>

<h3 id="where-it-runs">Where It Runs</h3>
<p>NemoClaw deploys on any dedicated compute: GeForce RTX PCs/laptops, RTX PRO workstations, DGX Station (748GB coherent memory, 20 petaflops, runs models up to 1 trillion parameters), and DGX Spark (supports clustering up to four systems into a compact "desktop data center").</p>

<h3 id="why-it-matters">Why It Matters</h3>
<p>Jensen made the enterprise security case explicit during the keynote: agentic systems inside corporate networks can access sensitive information, execute code, and communicate externally. He paused and told the audience to think about the implications. NemoClaw is designed to fill exactly that security gap.</p>
<p>Microsoft Security is already using Nemotron and OpenShell for adversarial learning, reporting a <strong>160x improvement</strong> in finding and mitigating AI-based attacks.</p>
<p>Jensen's bottom line: just as every company needed an HTTP strategy, a Linux strategy, and a Kubernetes strategy, <strong>every company now needs an OpenClaw strategy</strong>.</p>`,
    sourceUrl: "https://www.nvidia.com/en-us/ai/nemoclaw/",
    tags: ["AI Agents", "Security", "Open Source", "NVIDIA", "OpenClaw", "NemoClaw", "GTC 2026"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO who announced NemoClaw at GTC 2026" },
      { label: "AI Agents & Automation", to: "/insights/ai-agents-automation", description: "Deep dive into agentic AI systems" },
      { label: "AI Learning Roadmap", to: "/notebook/ai/roadmap", description: "Learn AI fundamentals — free 18-week curriculum" },
    ],
  },
  {
    id: "nvidia-vera-rubin-platform",
    slug: "nvidia-vera-rubin-platform-gtc-2026",
    title: "NVIDIA Vera Rubin Platform: Seven Chips, Five Racks, One AI Supercomputer",
    company: "NVIDIA",
    category: "product-launch",
    date: "2026-03-16",
    summary: "The headline hardware announcement at GTC 2026: the Vera Rubin platform combines seven new chips and five rack-scale systems into one coherent AI supercomputer. Jensen claims 40 million times more compute in 10 years since DGX-1.",
    takeaways: [
      "Seven new chips and five rack-scale systems designed to function as one massive AI supercomputer, supported by 80+ NVIDIA MGX ecosystem partners.",
      "Vera Rubin NVL72 trains large MoE models with 1/4 the GPUs vs. Blackwell and delivers 10x inference throughput per watt at 1/10 cost per token.",
      "Groq 3 LPX rack delivers 35x higher inference throughput per megawatt — Samsung manufactures the LP30 chip, shipping Q3 2026.",
      "First rack already running at Microsoft Azure. AWS deploying 1M+ NVIDIA GPUs plus Groq LPUs.",
    ],
    tocSections: ["The Lineup", "Key Numbers", "What's Next"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang",
    body: `<h3 id="the-lineup">The Lineup</h3>
<ul>
<li><strong>Vera Rubin NVL72 GPU rack</strong> — 72 Rubin GPUs + 36 Vera CPUs connected by NVLink 6, with ConnectX-9 SuperNICs and BlueField-4 DPUs. Trains large MoE models with 1/4 the GPUs vs. Blackwell; delivers 10x higher inference throughput per watt at 1/10 the cost per token.</li>
<li><strong>Vera CPU rack</strong> — 256 Vera CPUs in a liquid-cooled rack, purpose-built for reinforcement learning and agentic AI. 2x efficiency, 50% faster than traditional CPUs. Uses LPDDR5 — the only data center CPU to do so.</li>
<li><strong>Groq 3 LPX inference rack</strong> — 256 LPU processors with 128GB on-chip SRAM and 640 TB/s scale-up bandwidth. Delivers up to 35x higher inference throughput per megawatt. Samsung manufactures the LP30 chip; shipping Q3 2026.</li>
<li><strong>BlueField-4 STX storage rack</strong> — AI-native storage with 5x token throughput, 4x energy efficiency, and 2x faster data ingestion.</li>
<li><strong>Spectrum-6 SPX Ethernet rack</strong> — NVIDIA's first co-packaged optics switch in full production, co-developed with TSMC.</li>
</ul>

<h3 id="key-numbers">Key Numbers From the Keynote</h3>
<ul>
<li>3.6 exaflops of compute, 260 TB/s all-to-all NVLink bandwidth</li>
<li>100% liquid cooled with 45°C hot water</li>
<li>Installation time: 2 days → 2 hours</li>
<li>First rack already running at Microsoft Azure (confirmed by Satya Nadella)</li>
<li>AWS deploying 1M+ NVIDIA GPUs plus Groq LPUs</li>
</ul>

<h3 id="whats-next">What's Next</h3>
<p><strong>Rubin Ultra</strong> (taping out now): 144 GPUs in one NVLink domain via the new Kyber rack. Beyond that, the <strong>Feynman</strong> generation: new GPU, LP40 LPU, Rosa CPU, BlueField-5, CX10.</p>`,
    sourceUrl: "https://nvidianews.nvidia.com/news/nvidia-vera-rubin-platform",
    tags: ["NVIDIA", "Hardware", "Vera Rubin", "GPU", "Data Center", "GTC 2026"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO — architect of the Vera Rubin platform" },
      { label: "Bill Dally", to: "/ai-contributors/dally", description: "NVIDIA Chief Scientist — accelerated computing research" },
      { label: "Top 100 AI Contributors", to: "/notebook/ai", description: "Explore the people shaping AI in 2026" },
    ],
  },
  {
    id: "nvidia-dynamo-1",
    slug: "nvidia-dynamo-1-ai-factory-os",
    title: "Dynamo 1.0: NVIDIA's Operating System for AI Factories Enters Production",
    company: "NVIDIA",
    category: "product-launch",
    date: "2026-03-16",
    summary: "Dynamo 1.0 is NVIDIA's inference optimization software that delivers up to 7x performance boost on Blackwell GPUs. It rearchitects inference by splitting work between GPUs (prefill/attention) and Groq LPUs (decode/generation).",
    takeaways: [
      "Delivers up to 7x inference performance boost on Blackwell GPUs — same hardware, updated software stack.",
      "Uses disaggregated inference: splits prefill/attention (memory-heavy) to GPUs and decode/generation (bandwidth-limited) to Groq LPUs.",
      "Already adopted by AWS, Azure, Google Cloud, Oracle, plus Cursor, Perplexity, ByteDance, PayPal, and Pinterest.",
      "Standalone modules available: KVBM (memory), NIXL (GPU-to-GPU data movement), Grove (scaling).",
    ],
    tocSections: ["The Core Insight", "Performance", "Adoption"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang",
    body: `<h3 id="the-core-insight">The Core Insight</h3>
<p>Jensen explained that throughput and latency are "enemies of each other" in chip design. Dynamo solves this via <strong>disaggregated inference</strong> — splitting prefill and attention (memory-heavy) to Rubin GPUs, and decode/token generation (bandwidth-limited) to Groq LPUs.</p>

<h3 id="performance">Performance</h3>
<ul>
<li>Up to <strong>7x inference performance boost</strong> on Blackwell GPUs</li>
<li>Token speeds jumping from 700 to nearly 5,000 per second — same hardware, updated software stack</li>
<li>Token generation speed across a one-gigawatt factory: 2 million → 700 million (350x increase in two years)</li>
</ul>

<h3 id="adoption">Adoption</h3>
<p>Already deployed across:</p>
<ul>
<li><strong>Cloud providers:</strong> AWS, Microsoft Azure, Google Cloud, Oracle</li>
<li><strong>AI-native companies:</strong> Cursor, Perplexity, Baseten, Deep Infra, Fireworks</li>
<li><strong>Enterprise:</strong> ByteDance, Meituan, PayPal, Pinterest</li>
</ul>
<p>Core modules available standalone: <strong>KVBM</strong> (memory management), <strong>NIXL</strong> (GPU-to-GPU data movement), <strong>Grove</strong> (scaling). NVIDIA also contributes TensorRT-LLM CUDA kernels to the <strong>FlashInfer</strong> project for integration with vLLM, SGLang, and LangChain.</p>`,
    sourceUrl: "https://nvidianews.nvidia.com/news/dynamo-1-0",
    tags: ["NVIDIA", "Inference", "Dynamo", "AI Infrastructure", "GTC 2026"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO who introduced Dynamo 1.0" },
      { label: "AI & ML for Search", to: "/insights/ai-ml-search-optimization", description: "How AI transforms search infrastructure" },
    ],
  },
  {
    id: "nvidia-nemotron-coalition",
    slug: "nvidia-nemotron-coalition-open-frontier-models",
    title: "NVIDIA Launches Nemotron Coalition: Open Frontier Models With Mistral, Cursor, Perplexity",
    company: "NVIDIA",
    category: "open-source",
    date: "2026-03-16",
    summary: "NVIDIA announced the Nemotron Coalition — a first-of-its-kind collaboration with Mistral AI, Cursor, LangChain, Perplexity, and others to jointly develop Nemotron 4, the next-gen open frontier model, on NVIDIA DGX Cloud.",
    takeaways: [
      "First-of-its-kind global collaboration to jointly develop Nemotron 4 on NVIDIA DGX Cloud, then release for anyone to specialize.",
      "Coalition members: Mistral AI, Cursor, LangChain, Perplexity, Reflection AI, Sarvam, Thinking Machines Lab, Black Forest Labs.",
      "Nemotron 3 already ranks among the top three models in the world when running in OpenClaw. Adopted by CrowdStrike, Cursor, Perplexity, ServiceNow.",
      "Jensen frames open models as essential to sovereign AI: every country should be able to fine-tune base models into domain-specific intelligence.",
    ],
    tocSections: ["Coalition Members", "Current Models", "Why It Matters"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang",
    body: `<h3 id="coalition-members">Coalition Members</h3>
<p><strong>Mistral AI, Cursor, LangChain, Perplexity, Reflection AI, Sarvam, Thinking Machines Lab, and Black Forest Labs</strong> will jointly develop <strong>Nemotron 4</strong> on NVIDIA DGX Cloud, then release it for anyone to specialize.</p>

<h3 id="current-models">Current Model Family</h3>
<ul>
<li><strong>Nemotron 3</strong> — Omni-understanding models for AI agents. Jensen showed that Nemotron 3 in OpenClaw ranks among the top three models in the world. Already adopted by CodeRabbit, CrowdStrike, Cursor, Factory, Perplexity, and ServiceNow.</li>
<li><strong>Nemotron Nano 3</strong> — Available on Amazon Bedrock, powering Salesforce Agentforce. Salesforce calls it the most cost-efficient model for summarization and generation on their Agentic Benchmark for CRM.</li>
<li><strong>Cosmos 3</strong> — First world foundation model unifying synthetic world generation, vision reasoning, and action simulation. Built for robotics and autonomous systems.</li>
</ul>

<h3 id="why-it-matters">Why It Matters</h3>
<p>This signals NVIDIA's shift from pure hardware to actively shaping the model ecosystem. By partnering with companies that are actual users of these models (Cursor for coding, Perplexity for search, LangChain for agent frameworks), they're ensuring Nemotron models are optimized for real-world agentic workloads.</p>`,
    sourceUrl: "https://nvidianews.nvidia.com/news/nvidia-launches-nemotron-coalition-of-leading-global-ai-labs-to-advance-open-frontier-models",
    tags: ["Open Source", "NVIDIA", "Nemotron", "Mistral", "Cursor", "Perplexity", "GTC 2026"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO — driving open frontier model strategy" },
      { label: "Demis Hassabis", to: "/ai-contributors/hassabis", description: "Google DeepMind CEO — competing frontier model developer" },
      { label: "AI Concepts Encyclopedia", to: "/notebook/ai/encyclopedia", description: "187 AI concepts explained — foundation models, transformers, and more" },
    ],
  },
  {
    id: "nvidia-robotaxis-uber",
    slug: "nvidia-robotaxis-uber-28-cities-2028",
    title: "NVIDIA-Powered Robotaxis to Launch With Uber Across 28 Cities by 2028",
    company: "NVIDIA",
    category: "industry",
    date: "2026-03-16",
    summary: "Jensen Huang declared 'the ChatGPT moment for self-driving cars has arrived.' NVIDIA-powered robotaxis will launch with Uber across 28 cities on four continents by 2028, starting with LA and SF Bay Area in H1 2027.",
    takeaways: [
      "NVIDIA-powered robotaxis launching with Uber across 28 cities on four continents by 2028, starting with LA and SF Bay Area in H1 2027.",
      "BYD, Geely, Isuzu, and Nissan building Level 4 vehicles on NVIDIA DRIVE Hyperion — representing 18 million cars built per year.",
      "NVIDIA Halos OS: unified safety architecture built on ASIL D-certified DriveOS with NCAP five-star active safety stack.",
      "Bolt, Grab, and Lyft also scaling robotaxi development. Amazon advancing in-cabin AI with Alexa on NVIDIA DRIVE AGX.",
    ],
    tocSections: ["Uber Partnership", "Automotive Partners", "Halos OS"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang",
    body: `<h3 id="uber-partnership">Uber Partnership</h3>
<ul>
<li>NVIDIA-powered robotaxis launching with Uber across <strong>28 cities on four continents</strong> by 2028</li>
<li>Starting with Los Angeles and SF Bay Area in <strong>H1 2027</strong></li>
<li>Running on NVIDIA's full-stack DRIVE AV software, Alpamayo open models, and Halos operating system</li>
</ul>

<h3 id="automotive-partners">Automotive Partners</h3>
<p><strong>BYD, Geely, Isuzu, and Nissan</strong> (with Nissan powered by Wayve software) are building Level 4-ready vehicles on NVIDIA DRIVE Hyperion. These four new partners represent <strong>18 million cars built per year</strong>, joining existing partners Mercedes, Toyota, and GM.</p>

<h3 id="halos-os">NVIDIA Halos OS</h3>
<p>A unified safety architecture for AI-driven vehicles, built on ASIL D-certified DriveOS foundations with a three-layer architecture integrating safety middleware and an NCAP five-star active safety stack.</p>
<p>Beyond Uber, <strong>Bolt, Grab, and Lyft</strong> are also scaling robotaxi development on NVIDIA's platform. Amazon is advancing Alexa Custom Assistant with multimodal edge AI on NVIDIA DRIVE AGX for in-cabin AI intelligence.</p>`,
    sourceUrl: "https://nvidianews.nvidia.com/news/drive-hyperion-level-4",
    tags: ["Autonomous Vehicles", "NVIDIA", "Uber", "Robotaxi", "Self-Driving", "GTC 2026"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO — driving autonomous vehicle strategy" },
      { label: "Sebastian Thrun", to: "/ai-contributors/thrun", description: "Pioneer of autonomous vehicles — Stanford/Waymo" },
      { label: "Pieter Abbeel", to: "/ai-contributors/abbeel", description: "Robotics and reinforcement learning expert" },
    ],
  },
  {
    id: "nvidia-dlss-5",
    slug: "nvidia-dlss-5-ai-graphics-breakthrough",
    title: "NVIDIA DLSS 5: Fusing 3D Graphics With Generative AI — 'The GPT Moment for Graphics'",
    company: "NVIDIA",
    category: "product-launch",
    date: "2026-03-16",
    summary: "NVIDIA calls DLSS 5 their most significant graphics breakthrough since real-time ray tracing in 2018. It fuses controllable 3D graphics with generative AI to produce photoreal lighting and materials in real-time 16ms frames.",
    takeaways: [
      "Fuses controllable 3D graphics (structured, predictive) with generative AI (probabilistic, photoreal) — Jensen called it 'the GPT moment for graphics.'",
      "Produces photoreal lighting and materials in real-time 16-millisecond frames. 375,000x compute increase since original GeForce.",
      "Publishers signed on: Bethesda, CAPCOM, NetEase, Tencent, Ubisoft, Warner Bros. Games. Arriving fall 2026.",
      "Jensen predicts this pattern — fusing structured data with generative AI — will repeat in industry after industry.",
    ],
    tocSections: ["Technical Approach", "Historical Context", "Publishers"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang",
    body: `<h3 id="technical-approach">Technical Approach</h3>
<p>Jensen described DLSS 5 as fusing two fundamentally different approaches: <strong>controllable 3D graphics</strong> (structured, completely predictive) with <strong>generative AI</strong> (probabilistic yet highly realistic). DLSS 5 infuses pixels with AI-generated photoreal lighting and materials in real-time 16-millisecond frames.</p>
<p>Jensen noted this concept of fusing structured information with generative AI will repeat in industry after industry. Structured data is the foundation of trustworthy AI.</p>

<h3 id="historical-context">Historical Context</h3>
<p>Since the original GeForce, NVIDIA has delivered a 375,000x increase in compute: programmable shaders (GeForce 3, 2001) → CUDA (GeForce 8800 GTX, 2006) → real-time ray tracing (RTX 2080 Ti, 2018) → path tracing and neural shaders (RTX 5090, 2025) → DLSS 5.</p>

<h3 id="publishers">Publishers Signed On</h3>
<p>Bethesda, CAPCOM, Hotta Studio, NetEase, NCSOFT, S-GAME, Tencent, Ubisoft, and Warner Bros. Games. Arriving fall 2026.</p>
<p><strong>The caveat:</strong> This kind of predictive rendering can create visual "hallucinations" — artifacts when the AI prediction gets it wrong. This has been a sore point for gamers historically, but the breadth of publisher commitment suggests the industry believes it's solvable.</p>`,
    sourceUrl: "https://nvidianews.nvidia.com/news/nvidia-dlss-5-delivers-ai-powered-breakthrough-in-visual-fidelity-for-games",
    tags: ["NVIDIA", "DLSS", "Graphics", "Gaming", "Generative AI", "GTC 2026"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO who unveiled DLSS 5" },
      { label: "Ian Goodfellow", to: "/ai-contributors/goodfellow", description: "Inventor of GANs — foundational to generative AI" },
    ],
  },
  {
    id: "gtc-2026-big-numbers",
    slug: "nvidia-gtc-2026-keynote-big-numbers",
    title: "GTC 2026 Keynote: Jensen's Big Numbers — $1T Demand, 40M× Compute, Agentic AI Era",
    company: "NVIDIA",
    category: "industry",
    date: "2026-03-16",
    summary: "Jensen Huang's 2-hour GTC 2026 keynote laid out paradigm shifts: $1 trillion in AI infrastructure demand through 2027, computing demand up 1 million times in 2 years, 'every SaaS company will become an AaaS company,' and 'tokens per watt' as the new CEO metric.",
    takeaways: [
      "$1 trillion in AI infrastructure demand through 2027 (up from $500B one year ago). $150 billion in AI startup investment — largest VC wave in history.",
      "Computing demand up 1 million times in 2 years. 40 million times more compute in 10 years from DGX-1 to Vera Rubin.",
      "Every SaaS company will become an AaaS company — 'agentic as a service,' manufacturing tokens instead of storing files.",
      "'Tokens per watt' is the new CEO metric. Jensen predicts annual token budgets will become a standard recruiting tool.",
    ],
    tocSections: ["Big Numbers", "Paradigm Shifts", "Notable Moments"],
    videoUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    videoLabel: "NVIDIA GTC 2026 Full Keynote — Jensen Huang (2h 20min)",
    body: `<h3 id="big-numbers">The Big Numbers</h3>
<ul>
<li><strong>$1 trillion in demand through 2027</strong> — up from $500B just one year ago. Jensen said he's "certain computing demand will be much higher than that"</li>
<li><strong>Computing demand up 1 million times in 2 years</strong> — 10,000x increase in per-task compute × ~100x more usage</li>
<li><strong>$150 billion in AI startup investment</strong> — the largest venture investment wave in human history, with individual rounds hitting billions</li>
<li><strong>40 million times more compute in 10 years</strong> — from DGX-1 to Vera Rubin</li>
<li><strong>Token generation: 2M → 700M per second</strong> — 350x increase in a one-gigawatt factory over two years</li>
</ul>

<h3 id="paradigm-shifts">The Paradigm Shifts</h3>
<ul>
<li><strong>"The inference inflection has arrived"</strong> — AI now has to think, reason, and do; inference is the dominant workload</li>
<li><strong>Computing shifted from retrieval to generation</strong> — this single shift changes how computers are architected</li>
<li><strong>"Moore's law has run out of steam"</strong> — accelerated computing with continuous algorithmic optimization is the only path forward</li>
<li><strong>Every SaaS company will become an AaaS company</strong> — "agentic as a service," manufacturing and consuming tokens instead of just storing files</li>
<li><strong>"Tokens per watt" is the new CEO metric</strong> — every data center is power-constrained</li>
<li><strong>Token budgets as employee compensation</strong> — Jensen predicts annual token budgets will become a standard recruiting tool, amplifying engineers 10x</li>
</ul>

<h3 id="notable-moments">Notable Moments</h3>
<p>A Disney Research Olaf robot walked onstage, trained using NVIDIA's Newton physics simulator and Isaac Lab on a Jetson compute module. Jensen teased future Disneyland AI characters. 110 robots were on display at the GTC show floor.</p>
<p>30,000 attendees from 190 countries. 17 press releases and three major blog posts dropped in a single day.</p>`,
    sourceUrl: "https://www.youtube.com/live/jw_o0xr8MWU",
    tags: ["NVIDIA", "GTC 2026", "Jensen Huang", "Agentic AI", "AI Infrastructure", "Keynote"],
    relatedLinks: [
      { label: "Jensen Huang", to: "/ai-contributors/huang", description: "NVIDIA CEO — delivered this keynote" },
      { label: "Satya Nadella", to: "/ai-contributors/nadella", description: "Microsoft CEO — confirmed Vera Rubin running at Azure" },
      { label: "Dario Amodei", to: "/ai-contributors/dario-amodei", description: "Anthropic CEO — endorsed Vera Rubin in press release" },
      { label: "Sam Altman", to: "/ai-contributors/altman", description: "OpenAI CEO — endorsed NVIDIA infrastructure" },
    ],
  },
];
