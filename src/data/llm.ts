/**
 * llm.ts — the "How LLMs Work" pipeline ontology.
 *
 * Data-only module (no React/three imports) powering the interactive 3D
 * LLM explainer: every stage a prompt passes through on its way to a
 * response, plus the training stages that made the model useful. The 3D
 * scene, the journey walkthrough, the explore panels, and the crawlable
 * static tables all render from this one file.
 *
 * Numbers are real published figures (GPT-3, Llama 3, Mixtral,
 * DeepSeek-V3/R1, o-series) current as of mid-2026.
 */

export type LlmZone = "input" | "core" | "output" | "training";

export interface LlmZoneMeta {
  id: LlmZone;
  label: string;
  color: string;
  blurb: string;
}

export const ZONES: Record<LlmZone, LlmZoneMeta> = {
  input: {
    id: "input",
    label: "Input — text becomes numbers",
    color: "#38bdf8",
    blurb: "Your words are chopped into tokens and turned into vectors — the only language the model speaks.",
  },
  core: {
    id: "core",
    label: "Core — the transformer stack",
    color: "#a78bfa",
    blurb: "Dozens of identical layers pass a growing bundle of meaning along, each one letting every token look at every other token.",
  },
  output: {
    id: "output",
    label: "Output — one token at a time",
    color: "#34d399",
    blurb: "All that computation collapses into a single choice: the next token. Then the whole thing runs again.",
  },
  training: {
    id: "training",
    label: "Training — where the weights came from",
    color: "#fbbf24",
    blurb: "Trillions of tokens of next-word practice, then human feedback, then — since 2025 — reinforcement learning on reasoning itself.",
  },
};

export interface LlmStage {
  id: string;
  name: string;
  /** Short label drawn in the 3D scene. */
  short: string;
  zone: LlmZone;
  tagline: string;
  /** Plain-English story — what actually happens here. */
  story: string;
  /** The precise technical mechanism. */
  tech: string;
  /** A physical-world analogy. */
  analogy: string;
  /** Real published figures. */
  numbers: { label: string; value: string }[];
  /** What changed in the 2025-2026 frontier. */
  now?: string;
}

export const STAGES: LlmStage[] = [
  {
    id: "prompt",
    name: "Your Prompt",
    short: "Prompt",
    zone: "input",
    tagline: "Plain text in — the only thing the model ever sees",
    story:
      "Everything starts as a string of characters: your question, the system prompt, the conversation so far, maybe a document you pasted. The model has no memory of you and no access to the world — this text is its entire universe for the next few hundred milliseconds.",
    tech:
      "The chat UI assembles a single sequence: system prompt + alternating user/assistant turns, wrapped in special control tokens (e.g. <|im_start|>). Multimodal models additionally splice in image or audio patches encoded as token-like embeddings.",
    analogy: "A relay race where the only baton is a strip of paper with words on it.",
    numbers: [
      { label: "What the model sees", value: "One flat token sequence" },
      { label: "Typical chat overhead", value: "50–500 hidden system/control tokens" },
    ],
    now: "2025-2026 apps silently pack a lot into the prompt: tool results, retrieved documents (RAG), agent scratchpads — all just more tokens.",
  },
  {
    id: "tokenizer",
    name: "Tokenizer (BPE)",
    short: "Tokenizer",
    zone: "input",
    tagline: "Text is chopped into ~100k reusable fragments",
    story:
      "The model can't read letters. A tokenizer chops your text into 'tokens' — common words, word-pieces, and punctuation — each mapped to an integer ID from a fixed vocabulary. \"The cat sat on the\" becomes five familiar chunks; a rare word like \"antidisestablishment\" shatters into several.",
    tech:
      "Byte-Pair Encoding (BPE): start from raw bytes, repeatedly merge the most frequent adjacent pair until the vocabulary budget is spent. GPT-4o's o200k_base uses ~200k entries; Llama 3 uses 128k. Tokenization is why models miscount letters — 'strawberry' is 1-3 opaque chunks, not 10 characters.",
    analogy: "LEGO-izing language: a box of ~100,000 standard bricks that can snap together into any text ever written.",
    numbers: [
      { label: "GPT-4o vocab (o200k)", value: "~200,000 tokens" },
      { label: "Llama 3 vocab", value: "128,256 tokens" },
      { label: "Rule of thumb", value: "1 token ≈ ¾ of an English word" },
    ],
    now: "Newer tokenizers are multilingual-fairer (fewer tokens per non-English sentence) and byte-fallback so NO input is ever unrepresentable.",
  },
  {
    id: "embeddings",
    name: "Embedding Matrix",
    short: "Embeddings",
    zone: "input",
    tagline: "Each token ID becomes a vector — a point in meaning-space",
    story:
      "Each token ID looks up its own row in a giant table, retrieving a list of thousands of numbers — its embedding. Directions in this space carry meaning: king − man + woman lands near queen. From here on, the model never touches words again — only these vectors.",
    tech:
      "A learned matrix of shape vocab × d_model (e.g. 128,256 × 16,384 for Llama 3 405B). The lookup output is the token's initial residual-stream state. The same matrix (tied or untied) is reused at the far end to turn vectors back into token scores.",
    analogy: "A GPS coordinate for every word — except the map has 16,000 dimensions and 'nearby' means 'similar in meaning'.",
    numbers: [
      { label: "GPT-3 dims (d_model)", value: "12,288" },
      { label: "Llama 3 405B dims", value: "16,384" },
      { label: "Embedding table alone", value: "~2.1B params (Llama 3 405B)" },
    ],
  },
  {
    id: "positional",
    name: "Positional Encoding (RoPE)",
    short: "Position",
    zone: "input",
    tagline: "Vectors get stamped with WHERE they are in the sentence",
    story:
      "\"Dog bites man\" and \"man bites dog\" contain identical tokens — order is everything. Before the stack, each vector is marked with its position so the model can tell first from fifth from five-thousandth.",
    tech:
      "Rotary Position Embedding (RoPE) rotates each query/key vector by an angle proportional to its position — relative distances fall out of the geometry. Long-context models stretch RoPE (YaRN, NTK scaling) to reach 128k-1M+ tokens without retraining from scratch.",
    analogy: "Numbering the pages of a shuffled manuscript so any two pages know how far apart they are.",
    numbers: [
      { label: "Technique of choice", value: "RoPE (rotary embeddings)" },
      { label: "Context this enables", value: "128k → 1M+ tokens" },
    ],
    now: "Gemini ships 1-2M-token contexts; Llama 4 Scout advertises 10M. RoPE-scaling tricks are a big part of how.",
  },
  {
    id: "attention",
    name: "Self-Attention (QKV Heads)",
    short: "Attention",
    zone: "core",
    tagline: "Every token looks at every earlier token and asks: who matters to me?",
    story:
      "This is the transformer's superpower. For each token, dozens of attention heads each ask a different question of the sentence — one tracks grammar, one tracks names, one tracks what 'it' refers to. Each head pulls in information from the tokens that answer best, updating the token's vector with context. 'The' at the end of \"the cat sat on the\" ends up knowing it needs a sit-on-able noun next.",
    tech:
      "Each head projects the stream into query (Q), key (K), value (V) vectors; attention weights = softmax(QKᵀ/√d). Causal masking hides future tokens. Frontier models use grouped-query attention (GQA) or DeepSeek's multi-head latent attention (MLA) to shrink the KV footprint. Cost is quadratic in sequence length — the reason long context is expensive.",
    analogy: "A meeting where every word simultaneously polls every earlier word — 'are you relevant to me?' — and listens in proportion to the answer.",
    numbers: [
      { label: "GPT-3 heads/layer", value: "96" },
      { label: "Llama 3 405B", value: "128 heads, GQA 8 KV groups" },
      { label: "Complexity", value: "O(n²) in context length" },
    ],
    now: "FlashAttention-3 computes exact attention with far less memory traffic; MLA (DeepSeek) compresses KV 10×+. Attention is now the best-understood part of the stack thanks to interpretability work.",
  },
  {
    id: "moe",
    name: "Feed-Forward / MoE Experts",
    short: "Experts (MoE)",
    zone: "core",
    tagline: "A router wakes only 2 of N expert networks per token",
    story:
      "After attention gathers context, a much bigger block does the 'thinking': the feed-forward network, where most of the parameters live. Frontier models split it into many parallel 'experts' and a tiny router picks the best 1-2 for each token — a chemistry token might fire different experts than a French one. The model can be huge on disk yet cheap per token.",
    tech:
      "Classic FFN: two linear layers with a nonlinearity (SwiGLU), ~⅔ of layer params. Mixture-of-Experts (MoE): the FFN is replicated N times; a learned router (top-k softmax) sends each token to k experts. DeepSeek-V3: 256 routed experts + 1 shared, top-8 — 671B total params, ~37B active per token. Mixtral 8×7B: top-2 of 8.",
    analogy: "A hospital triage desk: every patient (token) is routed to the two most relevant specialists rather than seeing all 256 doctors.",
    numbers: [
      { label: "DeepSeek-V3", value: "671B total → 37B active (top-8 of 256)" },
      { label: "Mixtral 8×7B", value: "top-2 of 8 experts" },
      { label: "Where params live", value: "~⅔ of the model is FFN/experts" },
    ],
    now: "MoE won the frontier: GPT-4-class systems, Gemini, DeepSeek, Qwen-MoE and Llama 4 all use sparse experts to decouple capability from per-token cost.",
  },
  {
    id: "layers",
    name: "The Stack (×N Layers)",
    short: "Layer Stack",
    zone: "core",
    tagline: "Attention + experts, repeated 30–120 times",
    story:
      "One layer of attention-plus-experts is a single 'read the room, then think' step. The model stacks that step dozens of times. Early layers resolve syntax and merge word-pieces; middle layers assemble facts and relationships; late layers commit to what comes next. Each token's vector flows up this stack, enriched at every floor.",
    tech:
      "A residual stream connects everything: each sublayer ADDS its output to the stream (x = x + f(x)) rather than replacing it, with RMSNorm keeping scales sane. GPT-3: 96 layers. Llama 3 405B: 126. Interpretability work reads the stream mid-stack and finds increasingly abstract features layer by layer.",
    analogy: "An assembly line of 100 stations — each station reads the whole chassis, then bolts on one refinement.",
    numbers: [
      { label: "GPT-3", value: "96 layers" },
      { label: "Llama 3 405B", value: "126 layers" },
      { label: "The connective tissue", value: "Residual stream + RMSNorm" },
    ],
  },
  {
    id: "kv-cache",
    name: "KV Cache",
    short: "KV Cache",
    zone: "core",
    tagline: "The memory trick that makes generation fast",
    story:
      "Generating token #500 shouldn't require re-reading tokens 1-499 from scratch — and it doesn't. Every token's attention keys and values are cached the first time they're computed. Each new token only computes itself, then looks up everyone else. This cache is why the first token takes a moment ('prefill') and the rest stream out fast.",
    tech:
      "Per layer, per head: K and V tensors for the whole prefix, appended as generation proceeds. VRAM cost grows linearly with context — often gigabytes for 128k contexts — which is why GQA/MLA compress it. Serving stacks (vLLM's PagedAttention) manage it like virtual memory; prompt caching bills cached tokens ~10× cheaper.",
    analogy: "Court stenographer's notes: nobody re-litigates yesterday's testimony — they consult the transcript.",
    numbers: [
      { label: "Why streaming is fast", value: "New token attends to cached K/V" },
      { label: "128k-context cache", value: "Multiple GB of VRAM" },
      { label: "Prompt-cache discount", value: "~10× cheaper (typical 2026 pricing)" },
    ],
    now: "Speculative decoding adds a second trick: a tiny draft model proposes several tokens, the big model verifies them in one pass — 2-3× faster output with identical results.",
  },
  {
    id: "logits",
    name: "Logits — Scoring Every Token",
    short: "Logits",
    zone: "output",
    tagline: "The final vector is scored against all ~100k tokens",
    story:
      "After the last layer, the final position's vector — which has absorbed the entire prompt — is compared against every token in the vocabulary, producing a raw score (logit) for each. After \"The cat sat on the\", 'mat' scores high, 'floor' close behind, 'photosynthesis' astronomically low. The model's entire 'opinion' about what comes next is this list of ~100-200k numbers.",
    tech:
      "The unembedding: multiply the final hidden state by a d_model × vocab matrix (often the embedding matrix transposed). One forward pass produces logits for ONE next-token position — this is why output is generated token by token.",
    analogy: "A judging panel scoring all 200,000 possible next words in one instant — most get a shrug, a handful get high marks.",
    numbers: [
      { label: "Scores produced", value: "One per vocab token (~100-200k)" },
      { label: "Per forward pass", value: "Exactly one next-token distribution" },
    ],
  },
  {
    id: "sampling",
    name: "Softmax + Temperature",
    short: "Sampling",
    zone: "output",
    tagline: "Scores become probabilities; a weighted die is rolled",
    story:
      "Softmax squashes the raw scores into probabilities: mat 62%, floor 21%, chair 9%… Then the model doesn't just take the top one — it samples. 'Temperature' scales the randomness: at 0 you always get the favorite (good for code); higher spreads probability to underdogs (good for brainstorming). This one dial is why the same prompt gives different answers.",
    tech:
      "p(token) = softmax(logits / T). Top-p (nucleus) sampling truncates to the smallest set covering e.g. 95% of the mass; top-k keeps the k best. Repetition penalties down-weight recent tokens. Greedy decoding (T=0) is deterministic modulo hardware nondeterminism.",
    analogy: "A weighted roulette wheel where the wedge sizes are the probabilities — temperature reshapes the wedges before the spin.",
    numbers: [
      { label: "T = 0", value: "Deterministic, always the argmax" },
      { label: "T ≈ 0.7-1.0", value: "Typical chat creativity" },
      { label: "Common filter", value: "top-p 0.9-0.95" },
    ],
  },
  {
    id: "loop",
    name: "The Autoregressive Loop",
    short: "The Loop",
    zone: "output",
    tagline: "The chosen token is appended — and everything runs again",
    story:
      "The sampled token ('mat') is appended to the sequence, and the ENTIRE pipeline runs again to pick the token after it. And again. A 500-word answer is ~650 full trips through the machine, each choosing just one token while seeing everything chosen so far. The 'thinking' you watch stream out is this loop, spinning at 50-200 tokens per second.",
    tech:
      "Autoregressive generation: x_{t+1} ~ p(· | x_1..x_t). Thanks to the KV cache each iteration is one token's worth of compute, not the whole prompt's. Generation stops at an end-of-sequence token or a length limit.",
    analogy: "Writing a novel one word at a time — and rereading the entire manuscript-so-far (from very good notes) before choosing each next word.",
    numbers: [
      { label: "One token requires", value: "1 full forward pass" },
      { label: "Typical stream rate", value: "50-200 tokens/sec" },
      { label: "A 500-word answer", value: "~650 loop iterations" },
    ],
  },
  {
    id: "context-window",
    name: "Context Window",
    short: "Context",
    zone: "core",
    tagline: "The model's entire working memory — and its hard limit",
    story:
      "The context window is how many tokens the model can hold at once — prompt plus its own output. Nothing outside it exists: no memory of past chats, no knowledge of today's news. When conversations feel like the model 'forgot' the beginning, the beginning fell out of the window (or was summarized away by the app).",
    tech:
      "Fixed maximum sequence length set by training + RoPE scaling. Attention cost grows quadratically and KV cache linearly with it. 'Memory' features in chat products are engineering on top: the app retrieves notes and pastes them into the prompt.",
    analogy: "A desk of fixed size: any paper not on the desk right now might as well not exist.",
    numbers: [
      { label: "GPT-3 (2020)", value: "2,048 tokens" },
      { label: "Frontier 2026", value: "128k standard, 1M+ shipping" },
      { label: "Llama 4 Scout claim", value: "10M tokens" },
    ],
  },
  {
    id: "pretraining",
    name: "Pretraining — Next-Token Prediction",
    short: "Pretraining",
    zone: "training",
    tagline: "Trillions of fill-in-the-blank exercises forge the weights",
    story:
      "Where did all those weights come from? Months of one game, played trillions of times: here's a snippet of internet text — predict the next token. Wrong? Nudge all the weights a hair toward right. To get good at this game at scale, the network is forced to learn grammar, facts, style, even rudimentary world-models — because they all help predict what comes next.",
    tech:
      "Self-supervised learning: cross-entropy loss on next-token prediction, minimized by AdamW + backpropagation over web-scale corpora (Llama 3: ~15T tokens). GPT-4-class training runs cost $50-100M+ in compute on tens of thousands of GPUs. Scaling laws (Chinchilla) prescribe data/parameter ratios.",
    analogy: "Reading the whole library with a thumb over every next word — for a few million years of subjective reading time.",
    numbers: [
      { label: "Llama 3 corpus", value: "~15 trillion tokens" },
      { label: "GPT-4-class cost", value: "$50-100M+ compute" },
      { label: "Objective", value: "Predict token t+1. That's it." },
    ],
    now: "The frontier hit a data wall — high-quality web text is largely consumed — so 2025-2026 runs lean on synthetic data, curriculum curation, and multimodal corpora.",
  },
  {
    id: "alignment",
    name: "Post-Training — SFT + RLHF/DPO",
    short: "Alignment",
    zone: "training",
    tagline: "From autocomplete to assistant",
    story:
      "A pretrained model is a savant autocomplete — ask it a question and it might continue with three more questions. Post-training turns it into an assistant: first it studies curated example conversations (SFT), then humans rank pairs of its answers and a reinforcement signal pushes it toward the preferred kind — helpful, honest, harmless. This step is why ChatGPT (2022) felt like a different species from GPT-3 (2020).",
    tech:
      "Supervised fine-tuning on demonstration data, then RLHF: a reward model trained on human preference pairs guides PPO — or, more common now, DPO optimizes on preferences directly, no reward model needed. Constitutional AI (Anthropic) uses AI feedback against written principles (RLAIF) to scale supervision.",
    analogy: "A brilliant hire who's read everything but has never talked to a customer — sent through onboarding and coached with performance reviews.",
    numbers: [
      { label: "Preference data", value: "100k-1M+ human comparisons" },
      { label: "2026 default", value: "DPO-family (simpler than PPO)" },
    ],
  },
  {
    id: "reasoning",
    name: "Reasoning RL — Thinking Models",
    short: "Reasoning RL",
    zone: "training",
    tagline: "2025's breakthrough: reward the chain of thought itself",
    story:
      "The newest idea: instead of only rewarding a nice final answer, let the model generate a long private chain of thought — then reinforce whatever reasoning actually leads to verifiably correct results on math, code, and logic. Models learn to plan, backtrack, and self-check. This is why 'thinking' models pause before answering: they're spending extra compute at inference time, and accuracy scales with how long they think.",
    tech:
      "RL with verifiable rewards (RLVR): sample chains of thought, score them with automatic checkers (unit tests, math verification), update with GRPO/PPO-style algorithms. DeepSeek-R1 showed reasoning emerging from pure RL on a base model; OpenAI's o-series established inference-time scaling as a second axis alongside model size.",
    analogy: "Grading the student's scratch work, not just the final answer box — and giving them as much scratch paper as they want.",
    numbers: [
      { label: "Landmark models", value: "o1/o3 (OpenAI), R1 (DeepSeek), Claude thinking modes" },
      { label: "New scaling axis", value: "Inference-time compute" },
      { label: "R1's surprise", value: "Reasoning emerged from RL alone" },
    ],
    now: "This is the live frontier in 2026: agentic RL — rewarding multi-step tool use and long-horizon tasks, not just single answers.",
  },
];

/* ====================================================================== *
 *  The Journey — a guided walkthrough of one token's generation
 * ====================================================================== */

/** Which particle path segment is animated during a step. */
export type FlowSegment = "input" | "core" | "output" | "loop" | "train" | null;

export interface JourneyStep {
  id: string;
  title: string;
  narration: string;
  /** Stages lit in the 3D scene. */
  highlightIds: string[];
  /** Particle segment to energize. */
  flow: FlowSegment;
  /** Switch the scene into training mode for this step. */
  training?: boolean;
}

export const JOURNEY: JourneyStep[] = [
  {
    id: "j-prompt",
    title: "You type five words",
    narration:
      "\"The cat sat on the\" — and hit enter. For the next fraction of a second, this string is the model's entire universe. Watch it travel.",
    highlightIds: ["prompt"],
    flow: "input",
  },
  {
    id: "j-tokenize",
    title: "Text becomes tokens",
    narration:
      "The tokenizer chops the text into 5 tokens and swaps each for an ID from its ~100,000-entry vocabulary: [791, 8415, 7731, 389, 279]. The model will never see letters — only these IDs.",
    highlightIds: ["tokenizer"],
    flow: "input",
  },
  {
    id: "j-embed",
    title: "Tokens become vectors",
    narration:
      "Each ID looks up its row in the embedding matrix and becomes a vector of ~16,000 numbers — a point in meaning-space, where 'cat' sits near 'kitten' and far from 'carburetor'.",
    highlightIds: ["embeddings"],
    flow: "input",
  },
  {
    id: "j-position",
    title: "Position is stamped on",
    narration:
      "RoPE rotates each vector by its position, so 'cat' (token #2) is distinguishable from a 'cat' appearing at #2,000. Word order now lives in the geometry.",
    highlightIds: ["positional"],
    flow: "input",
  },
  {
    id: "j-stack",
    title: "Into the stack",
    narration:
      "The five vectors enter a tower of identical layers — 96 in GPT-3, 126 in Llama 3 405B. Each layer will read the whole sentence, then refine every token's vector a little.",
    highlightIds: ["layers"],
    flow: "core",
  },
  {
    id: "j-attention",
    title: "Attention: everyone polls everyone",
    narration:
      "Inside each layer, attention heads fire — watch the beams. The final 'the' polls every earlier token and pulls hardest from 'sat' and 'on': it now knows it's the start of a place phrase. 96+ heads do this simultaneously, each asking a different question.",
    highlightIds: ["attention"],
    flow: "core",
  },
  {
    id: "j-experts",
    title: "The router wakes two experts",
    narration:
      "Next, each token hits the expert block. A tiny router scores all 256 experts and wakes just the top few — 37B of DeepSeek-V3's 671B parameters actually fire. Big model, small bill.",
    highlightIds: ["moe"],
    flow: "core",
  },
  {
    id: "j-repeat",
    title: "…repeat ×96, with a cache",
    narration:
      "Attention → experts → attention → experts, dozens of times, each layer adding its refinement to the residual stream. Every key and value computed gets stored in the KV cache — nothing is ever re-derived.",
    highlightIds: ["layers", "kv-cache"],
    flow: "core",
  },
  {
    id: "j-logits",
    title: "200,000 scores",
    narration:
      "At the top of the stack, the final position's vector — now carrying the whole sentence's meaning — is scored against every token in the vocabulary. 'mat' spikes. 'floor' and 'couch' trail. 'photosynthesis' is buried.",
    highlightIds: ["logits"],
    flow: "output",
  },
  {
    id: "j-sample",
    title: "Temperature, then the dice roll",
    narration:
      "Softmax turns scores into probabilities — mat 62%, floor 21%, couch 9% — and temperature reshapes them. Then a weighted die is rolled. Today: 'mat'.",
    highlightIds: ["sampling"],
    flow: "output",
  },
  {
    id: "j-loop",
    title: "Append — and run it ALL again",
    narration:
      "'mat' is appended to the sequence and the entire pipeline runs again for the next token. A paragraph is hundreds of these loops at 50-200 tokens per second. This loop IS the typing you watch on screen.",
    highlightIds: ["loop", "kv-cache"],
    flow: "loop",
  },
  {
    id: "j-context",
    title: "The edge of the universe",
    narration:
      "Everything so far lived inside the context window — 128k tokens standard, 1M+ on the frontier. Outside it, nothing exists. 'Memory' in chat apps is engineering: notes retrieved and pasted back into next prompt.",
    highlightIds: ["context-window"],
    flow: null,
  },
  {
    id: "j-pretrain",
    title: "Rewind: where the weights came from",
    narration:
      "Why did 'mat' score highest? Months of pretraining: ~15 trillion tokens of text, one game — predict the next token, nudge the weights when wrong. Grammar, facts, and style all emerge because they help win that one game.",
    highlightIds: ["pretraining"],
    flow: "train",
    training: true,
  },
  {
    id: "j-align",
    title: "From autocomplete to assistant",
    narration:
      "Raw pretrained models just continue text. Post-training — example conversations, then humans ranking answer pairs (RLHF/DPO) — is what makes it answer your question instead of asking three more.",
    highlightIds: ["alignment"],
    flow: "train",
    training: true,
  },
  {
    id: "j-reason",
    title: "2025+: models that think before answering",
    narration:
      "The newest layer: reinforcement learning on the chain of thought itself, rewarded only when the reasoning verifiably works (math checks, code passes tests). That's what a 'thinking' model is doing during the pause — and why more thinking time buys more accuracy.",
    highlightIds: ["reasoning"],
    flow: "train",
    training: true,
  },
];

/* ====================================================================== *
 *  Helpers
 * ====================================================================== */

export const stageById = (id: string) => STAGES.find((s) => s.id === id);
export const stagesInZone = (zone: LlmZone) => STAGES.filter((s) => s.zone === zone);
export const journeyStepById = (id: string) => JOURNEY.find((j) => j.id === id);

/** The demo sentence traced by the scene + journey. */
export const DEMO_TOKENS = ["The", "cat", "sat", "on", "the"];
export const DEMO_TOKEN_IDS = [791, 8415, 7731, 389, 279];
/** Candidate next-tokens shown on the logits board (prob as %). */
export const DEMO_LOGITS: { token: string; p: number }[] = [
  { token: "mat", p: 62 },
  { token: "floor", p: 21 },
  { token: "couch", p: 9 },
  { token: "bed", p: 4 },
  { token: "roof", p: 2 },
  { token: "table", p: 1.5 },
  { token: "moon", p: 0.5 },
];

export const LLM_COUNTS = {
  stages: STAGES.length,
  journeySteps: JOURNEY.length,
  zones: Object.keys(ZONES).length,
};
