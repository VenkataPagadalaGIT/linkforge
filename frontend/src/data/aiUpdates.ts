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
  /** Primary documents: court records first, never buried under the text. */
  documents?: UpdateDocument[];
  /** A 30-second version and the long version. Readers pick their depth. */
  videos?: UpdateVideo[];
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
        description: "Where Anthropic sits among the 471 players in the AI value chain.",
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
      { label: "AI Concepts Encyclopedia", to: "/notebook/ai/encyclopedia", description: "110 AI concepts explained — foundation models, transformers, and more" },
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
