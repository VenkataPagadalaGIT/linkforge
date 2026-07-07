export interface AIGlossaryTerm {
  term: string;
  definition: string;
  pioneeredBy?: string[]; // contributor ids
  relatedTerms?: string[];
  category: "architecture" | "technique" | "concept" | "application" | "infrastructure";
}

export const AI_GLOSSARY: AIGlossaryTerm[] = [
  {
    term: "Transformer",
    definition: "The dominant neural network architecture for sequence processing, based on self-attention mechanisms. Introduced in 'Attention Is All You Need' (2017), it replaced RNNs and became the foundation of GPT, BERT, and virtually every modern language model.",
    pioneeredBy: ["gomez"],
    relatedTerms: ["Attention Mechanism", "LLM", "Foundation Model"],
    category: "architecture",
  },
  {
    term: "Large Language Model (LLM)",
    definition: "Neural networks with billions of parameters trained on massive text corpora to understand and generate human language. GPT-4, Claude, Gemini, and LLaMA are leading examples. They demonstrate emergent capabilities that scale with size and data.",
    pioneeredBy: ["altman", "touvron", "lecun"],
    relatedTerms: ["Transformer", "Foundation Model", "Fine-tuning"],
    category: "architecture",
  },
  {
    term: "Convolutional Neural Network (CNN)",
    definition: "A neural network architecture designed for processing grid-like data (images). Uses learned filters to detect features at different scales. Revolutionized computer vision and inspired modern architectures.",
    pioneeredBy: ["lecun"],
    relatedTerms: ["Deep Learning", "Computer Vision"],
    category: "architecture",
  },
  {
    term: "State-Space Model (SSM)",
    definition: "An alternative to Transformers that processes sequences with linear-time complexity instead of quadratic attention. Mamba and S4 are leading SSM architectures, offering potential advantages for very long sequences.",
    pioneeredBy: ["gu"],
    relatedTerms: ["Transformer", "Mamba"],
    category: "architecture",
  },
  {
    term: "Reinforcement Learning from Human Feedback (RLHF)",
    definition: "A technique for aligning AI systems with human preferences by training a reward model on human comparisons, then optimizing the AI policy against it. Core to making ChatGPT helpful and safe.",
    pioneeredBy: ["leike", "altman"],
    relatedTerms: ["Alignment", "Reward Model", "AI Safety"],
    category: "technique",
  },
  {
    term: "Backpropagation",
    definition: "The algorithm for computing gradients in neural networks, enabling them to learn from errors. Popularized by Hinton in 1986, it remains the fundamental training mechanism for all deep learning.",
    pioneeredBy: ["hinton"],
    relatedTerms: ["Deep Learning", "Gradient Descent"],
    category: "technique",
  },
  {
    term: "Meta-Learning (MAML)",
    definition: "Learning to learn — training models that can quickly adapt to new tasks from very few examples. Model-Agnostic Meta-Learning (MAML) provides a general framework applicable across domains.",
    pioneeredBy: ["finn"],
    relatedTerms: ["Few-Shot Learning", "Transfer Learning"],
    category: "technique",
  },
  {
    term: "Retrieval-Augmented Generation (RAG)",
    definition: "Combining LLMs with external knowledge retrieval to generate more accurate, up-to-date, and verifiable responses. The model retrieves relevant documents before generating answers.",
    relatedTerms: ["LLM", "Knowledge Graph", "Vector Database"],
    category: "technique",
  },
  {
    term: "Attention Mechanism",
    definition: "A technique allowing neural networks to focus on relevant parts of input when producing output. Self-attention (used in Transformers) lets each position attend to all other positions in a sequence.",
    pioneeredBy: ["gomez"],
    relatedTerms: ["Transformer", "Self-Attention"],
    category: "technique",
  },
  {
    term: "Foundation Model",
    definition: "Large AI models trained on broad data that can be adapted to many downstream tasks. They represent a paradigm shift from task-specific to general-purpose AI. GPT-4, Claude, and LLaMA are foundation models.",
    pioneeredBy: ["altman", "touvron", "lecun"],
    relatedTerms: ["LLM", "Pre-training", "Fine-tuning"],
    category: "concept",
  },
  {
    term: "AI Alignment",
    definition: "The challenge of ensuring AI systems pursue goals that are beneficial to humans. Includes technical approaches (RLHF, constitutional AI) and governance frameworks. Considered by many the most important unsolved problem in AI.",
    pioneeredBy: ["leike", "hinton", "dragan"],
    relatedTerms: ["RLHF", "AI Safety", "Value Alignment"],
    category: "concept",
  },
  {
    term: "Artificial General Intelligence (AGI)",
    definition: "Hypothetical AI with human-level cognitive abilities across all domains — able to reason, learn, and adapt like a human. No consensus on timeline; estimates range from 5 to 50+ years.",
    pioneeredBy: ["altman", "hinton", "silver"],
    relatedTerms: ["Foundation Model", "AI Safety"],
    category: "concept",
  },
  {
    term: "Stochastic Parrots",
    definition: "A critique arguing that LLMs are sophisticated pattern matchers that don't truly understand language — they 'parrot' statistical patterns. From Bender et al.'s influential 2021 paper challenging AI hype.",
    pioneeredBy: ["bender"],
    relatedTerms: ["LLM", "AI Ethics"],
    category: "concept",
  },
  {
    term: "The Hardware Lottery",
    definition: "The observation that certain AI research directions succeed not because they're best, but because they're compatible with available hardware. Explains why neural networks dominated — they fit GPUs.",
    pioneeredBy: ["hooker"],
    relatedTerms: ["GPU Computing", "AI Infrastructure"],
    category: "concept",
  },
  {
    term: "Open-Weight Models",
    definition: "AI models released with their trained weights publicly available (though not always fully open-source). LLaMA, Mistral, and Falcon exemplify this trend toward democratizing AI access.",
    pioneeredBy: ["touvron", "wolf"],
    relatedTerms: ["Foundation Model", "Open Source AI"],
    category: "concept",
  },
  {
    term: "GPU Computing for AI",
    definition: "Using Graphics Processing Units for parallel AI training. NVIDIA's CUDA platform made GPUs the default hardware for deep learning, creating a trillion-dollar industry shift.",
    pioneeredBy: ["dally"],
    relatedTerms: ["TPU", "AI Hardware", "The Hardware Lottery"],
    category: "infrastructure",
  },
  {
    term: "Model Context Protocol (MCP)",
    definition: "A protocol enabling AI agents to interact with external tools and data sources in real-time. Allows LLMs to read databases, call APIs, and perform actions beyond text generation.",
    relatedTerms: ["AI Agents", "A2A Protocol"],
    category: "infrastructure",
  },
  {
    term: "AI-Driven Drug Discovery",
    definition: "Using AI (especially generative models) to identify, design, and optimize drug candidates. Insilico Medicine achieved the first AI-designed drug to enter clinical trials.",
    pioneeredBy: ["zhavoronkov"],
    relatedTerms: ["Generative AI", "AI for Science"],
    category: "application",
  },
  {
    term: "Word Embeddings (GloVe)",
    definition: "Representing words as dense vectors in continuous space, capturing semantic relationships. GloVe (Global Vectors) counts co-occurrences to learn that 'king - man + woman ≈ queen.'",
    pioneeredBy: ["socher"],
    relatedTerms: ["NLP", "Vector Space"],
    category: "technique",
  },
  {
    term: "Agent-to-Agent (A2A) Protocol",
    definition: "Communication framework allowing autonomous AI agents to coordinate, delegate tasks, and share context. Enables multi-agent systems where specialized agents collaborate on complex workflows.",
    relatedTerms: ["MCP", "AI Agents", "Multi-Agent Systems"],
    category: "infrastructure",
  },
];

export interface NarrativeChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  narrative: string;
  contributorIds: string[];
  keyTakeaway: string;
}

export const NARRATIVE_CHAPTERS: NarrativeChapter[] = [
  {
    id: "godfathers",
    number: 1,
    title: "The Godfathers",
    subtitle: "How three researchers built the foundation of modern AI",
    narrative: "Modern AI begins with three names: Geoffrey Hinton, Yann LeCun, and Yoshua Bengio. For decades, they championed neural networks when the rest of computer science had abandoned them. Hinton's backpropagation (1986) gave networks the ability to learn. LeCun's CNNs (1998) gave them eyes. Their 2018 Turing Award was a victory lap — but also a starting gun. By 2024, Hinton had left Google to warn the world about the technology he helped create, while LeCun was plotting world models at Meta. The godfather era isn't over — it's entering its most consequential phase.",
    contributorIds: ["hinton", "lecun"],
    keyTakeaway: "The people who built AI are now split on whether it's humanity's greatest achievement or greatest threat. Both perspectives deserve study.",
  },
  {
    id: "chatgpt-moment",
    number: 2,
    title: "The ChatGPT Moment",
    subtitle: "When AI stopped being a research curiosity and became a global phenomenon",
    narrative: "November 30, 2022, changed everything. ChatGPT reached 100 million users in two months — the fastest adoption of any technology in history. Behind it: Sam Altman's relentless shipping culture, Mira Murati's engineering leadership, and years of RLHF refinement by researchers like Jan Leike. But the real story isn't the product — it's the chain reaction. Within months, Google merged DeepMind with Brain. Meta released LLaMA. Anthropic raised billions. The entire industry reorganized around a single insight: language models are the platform, and the race is existential.",
    contributorIds: ["altman", "murati", "leike", "pichai"],
    keyTakeaway: "ChatGPT didn't invent the technology — it proved the market. Understanding the difference between research breakthroughs and product-market fit is key to reading AI's trajectory.",
  },
  {
    id: "open-source-revolution",
    number: 3,
    title: "The Open Source Revolution",
    subtitle: "How a leaked model and a French startup democratized AI",
    narrative: "When Meta released LLaMA in February 2023, the weights leaked within a week. What followed was extraordinary: within months, the open-source community had fine-tuned variants that rivaled proprietary models at a fraction of the cost. Hugo Touvron's paper became the most consequential release in AI's democratization. Thomas Wolf's Hugging Face provided the infrastructure — a GitHub for models. Percy Liang's HELM gave everyone a standard benchmark. Sara Hooker's research on efficient ML showed that compute wasn't destiny. Together, they proved a thesis: AI doesn't have to be a closed game for trillion-dollar companies.",
    contributorIds: ["touvron", "wolf", "liang", "hooker"],
    keyTakeaway: "Open-source AI is the most important counterbalance to corporate AI concentration. Its success or failure will shape whether AI becomes a public good or a private monopoly.",
  },
  {
    id: "safety-debate",
    number: 4,
    title: "The Safety Debate",
    subtitle: "The most important argument in technology — and nobody agrees",
    narrative: "AI safety went from a niche concern to a global priority in 18 months. Hinton left Google specifically to speak freely about existential risks. Jan Leike left OpenAI for Anthropic, publicly citing insufficient commitment to safety. Gary Marcus argues current approaches are fundamentally flawed. Emily Bender's 'Stochastic Parrots' paper challenged whether LLMs understand anything at all. Tristan Harris brought the message to mainstream audiences. Anca Dragan approaches it from robotics — if a physical AI misaligns, the consequences are immediate. There is no consensus. But the quality of the disagreement is exceptional, and understanding all sides is essential.",
    contributorIds: ["hinton", "leike", "marcus", "bender", "harris", "dragan"],
    keyTakeaway: "AI safety isn't one problem — it's a constellation of technical, philosophical, and political challenges. The smartest people in the field disagree profoundly. That's a feature, not a bug.",
  },
  {
    id: "infrastructure-wars",
    number: 5,
    title: "The Infrastructure Wars",
    subtitle: "Whoever controls the compute controls the future",
    narrative: "AI is built on silicon. Bill Dally's GPU architectures at NVIDIA made the company the most valuable in the world. Jeff Dean's systems at Google — MapReduce, TensorFlow, TPUs — created the infrastructure stack that trains frontier models. Sundar Pichai bet Google's future on AI-first, merging DeepMind with Brain. The infrastructure layer is where the real power concentrates: training a frontier model costs hundreds of millions in compute. This creates natural monopolies — and understanding who controls this layer is critical to understanding AI's political economy.",
    contributorIds: ["dally", "dean", "pichai"],
    keyTakeaway: "Follow the compute. The infrastructure layer — chips, cloud, and training frameworks — determines who can build frontier AI and who can't.",
  },
  {
    id: "next-paradigm",
    number: 6,
    title: "The Next Paradigm",
    subtitle: "What comes after the Transformer?",
    narrative: "The Transformer has dominated for seven years — an eternity in AI. But cracks are showing. Albert Gu's Mamba architecture offers linear-time sequence modeling, directly challenging attention's quadratic scaling. LeCun's world models propose learning through observation rather than language. David Silver's departure from DeepMind to found Ineffable Intelligence suggests reinforcement learning still has untapped potential. Chelsea Finn's work on meta-learning and embodied AI points toward physical intelligence. The next paradigm may not replace Transformers entirely — but whoever finds the next architectural breakthrough will reshape the field as profoundly as 'Attention Is All You Need' did in 2017.",
    contributorIds: ["gu", "lecun", "silver", "finn"],
    keyTakeaway: "Transformers won the hardware lottery. The next paradigm will be determined by whoever finds an architecture that's both better AND compatible with available compute.",
  },
];

export interface CuratedReadingList {
  id: string;
  title: string;
  description: string;
  level: "essential" | "intermediate" | "advanced";
  items: { title: string; author: string; type: "paper" | "book" | "talk" | "podcast" | "course"; url: string; why: string }[];
}

export const CURATED_READING_LISTS: CuratedReadingList[] = [
  {
    id: "essential-papers",
    title: "The 10 Papers That Defined Modern AI",
    description: "If you read nothing else, read these. Each paper marked a paradigm shift.",
    level: "essential",
    items: [
      { title: "Learning representations by back-propagating errors", author: "Hinton et al.", type: "paper", url: "https://www.nature.com/articles/323533a0", why: "Where it all started. Backpropagation made neural networks trainable." },
      { title: "Attention Is All You Need", author: "Vaswani, Gomez et al.", type: "paper", url: "https://arxiv.org/abs/1706.03762", why: "The Transformer paper. The architecture behind GPT, BERT, and every modern LLM." },
      { title: "Mastering the Game of Go", author: "Silver et al.", type: "paper", url: "https://www.nature.com/articles/nature16961", why: "AlphaGo — when AI surpassed human intuition in the most complex board game." },
      { title: "LLaMA: Open and Efficient Foundation Language Models", author: "Touvron et al.", type: "paper", url: "https://arxiv.org/abs/2302.13971", why: "Ignited the open-source LLM revolution. Changed who could build AI." },
      { title: "On the Dangers of Stochastic Parrots", author: "Bender et al.", type: "paper", url: "https://dl.acm.org/doi/10.1145/3442188.3445922", why: "The most important critique of LLMs. Essential counterpoint to the hype." },
      { title: "The Hardware Lottery", author: "Hooker", type: "paper", url: "https://arxiv.org/abs/2009.06489", why: "Why certain AI approaches won — not because they're best, but because they fit the hardware." },
      { title: "HELM: Holistic Evaluation of Language Models", author: "Liang et al.", type: "paper", url: "https://arxiv.org/abs/2211.09110", why: "How to actually measure LLM quality. The benchmark standard." },
      { title: "Model-Agnostic Meta-Learning (MAML)", author: "Finn et al.", type: "paper", url: "https://arxiv.org/abs/1703.03400", why: "Teaching AI to learn from few examples. Elegant and foundational." },
      { title: "Mamba: Linear-Time Sequence Modeling", author: "Gu & Dao", type: "paper", url: "https://arxiv.org/abs/2312.00752", why: "The leading challenger to Transformer dominance. May define the next era." },
      { title: "A Path Towards Autonomous Machine Intelligence", author: "LeCun", type: "paper", url: "https://openreview.net/forum?id=BZ5a1r-kVsf", why: "LeCun's vision for AI that learns like humans — through world models, not just language." },
    ],
  },
  {
    id: "podcast-masterclass",
    title: "The AI Podcast Masterclass",
    description: "Long-form conversations that give you direct access to how the best minds think.",
    level: "essential",
    items: [
      { title: "Geoffrey Hinton: Godfather of AI", author: "Lex Fridman Podcast", type: "podcast", url: "https://www.youtube.com/watch?v=rGgGOccMEiY", why: "The most important living AI researcher explains why he's now worried about his own creation." },
      { title: "Sam Altman: OpenAI CEO", author: "Lex Fridman Podcast", type: "podcast", url: "https://www.youtube.com/watch?v=L_Guz73e6fw", why: "The person shipping AI to billions explains his strategy, fears, and vision for AGI." },
      { title: "The AI Dilemma", author: "Tristan Harris & Aza Raskin", type: "talk", url: "https://www.youtube.com/watch?v=xoVJKj8lcNQ", why: "The best accessible introduction to AI risks. 50M+ views for a reason." },
      { title: "AlphaGo Documentary", author: "DeepMind", type: "talk", url: "https://www.youtube.com/watch?v=WXuK6gekU1Y", why: "The most emotional AI content ever made. Watch Lee Sedol's face when he realizes the machine is better." },
      { title: "David Silver: AlphaGo, AlphaZero", author: "Lex Fridman Podcast", type: "podcast", url: "https://www.youtube.com/watch?v=uPUEq8d73JI", why: "The creator of AlphaGo explains reinforcement learning in a way that makes you rethink everything." },
    ],
  },
  {
    id: "advanced-reading",
    title: "Deep Dive: Architecture & Systems",
    description: "For practitioners who want to understand the engineering behind frontier AI.",
    level: "advanced",
    items: [
      { title: "Efficiently Modeling Long Sequences with S4", author: "Gu et al.", type: "paper", url: "https://arxiv.org/abs/2111.00396", why: "The technical foundation behind Mamba. Dense but rewarding." },
      { title: "MapReduce: Simplified Data Processing", author: "Dean & Ghemawat", type: "paper", url: "https://research.google/pubs/pub62/", why: "The system design paper that enabled training at scale. Still relevant." },
      { title: "TensorFlow: Large-Scale Machine Learning", author: "Abadi, Dean et al.", type: "paper", url: "https://arxiv.org/abs/1605.08695", why: "How Google built the framework that trained a generation of models." },
      { title: "GloVe: Global Vectors for Word Representation", author: "Pennington, Socher et al.", type: "paper", url: "https://nlp.stanford.edu/projects/glove/", why: "Word embeddings that showed language has geometry. Beautiful result." },
      { title: "Llama 2: Open Foundation Models", author: "Touvron et al.", type: "paper", url: "https://arxiv.org/abs/2307.09288", why: "The engineering details behind the model that democratized LLMs." },
    ],
  },
];
