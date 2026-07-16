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
    blurb: "Your words are chopped into tokens and turned into vectors — the model's native language. (Images and audio get the same treatment: an encoder turns them into vectors too.)",
  },
  core: {
    id: "core",
    label: "Core — the transformer stack",
    color: "#a78bfa",
    blurb: "Dozens of identical layers pass a growing bundle of meaning along, each one letting every token look at every earlier token.",
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
      "Everything starts as a string of characters: your question, the system prompt, the conversation so far, maybe a document you pasted. The model has no memory of you and no access to the world — for a text model this text is its entire universe for the next few hundred milliseconds. (Natively-multimodal models also take images and audio, encoded to embeddings by a separate vision/audio encoder and injected right alongside the text tokens.)",
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
      "Each token ID looks up its own row in a giant table, retrieving a list of thousands of numbers — its embedding. Directions carry rough meaning — similar tokens sit closer. (The famous king − man + woman ≈ queen trick is a word2vec/GloVe property of STATIC embeddings; a transformer's input table is nearly context-free, and the rich geometry is built up layer by layer.) From here on, the model touches only vectors, never words.",
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
    now: "Gemini 3.1 Pro and GPT-5.5's API both ship ~1M-token contexts. Two tricks get there. Rope-scaling (YaRN and kin) stretches a model trained at, say, 64K out to far longer; it's how DeepSeek-V3 was extended to 128k. Newer models like DeepSeek-V4 lean instead on sparse, compressed attention. (Meta advertises 10M for Llama 4 Scout, but independent long-context tests haven't backed it, so treat it as a claim.)",
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
      "Each head projects the stream into query (Q), key (K), value (V) vectors; weights = softmax(QKᵀ/√d_k), where d_k is the per-head key dimension, select which values to pull. Heads run in PARALLEL, each producing its own value-weighted output; those per-head outputs are CONCATENATED and passed through a single output-projection matrix (W_O) that writes the result back into the residual stream. Causal masking hides the future; GQA / DeepSeek's MLA shrink the KV footprint. Cost is quadratic in sequence length.",
    analogy: "A meeting where every word simultaneously polls every earlier word — 'are you relevant to me?' — and listens in proportion to the answer.",
    numbers: [
      { label: "GPT-3 heads/layer", value: "96" },
      { label: "Llama 3 405B", value: "128 heads, GQA 8 KV groups" },
      { label: "Cost", value: "O(n²) compute · O(n) memory (FlashAttention)" },
    ],
    now: "FlashAttention-3 computes exact attention with far less memory traffic; nearly every 2026 model ships grouped-query attention (MHA→MQA→GQA: query heads share K/V heads to shrink the cache) and DeepSeek's MLA compresses KV 10×+ into a latent vector. The live fight is hybrid linear attention — Ant's Ring-linear ships 4-7 linear layers per softmax layer, while MiniMax publicly reverted its M2 to full attention after linear variants fell short on multi-hop reasoning. Interpretability can now read heads directly: they specialize (grammar, names, pronouns), and 'induction heads' that spot A-B…A patterns and predict B are a leading hypothesized mechanism behind in-context learning.",
  },
  {
    id: "moe",
    name: "Feed-Forward / MoE Experts",
    short: "Experts (MoE)",
    zone: "core",
    tagline: "A router wakes only the top few of N expert networks per token",
    story:
      "After attention gathers context, a much bigger block does the 'thinking': the feed-forward network, where most of the parameters live. Frontier models split it into many parallel 'experts' and a tiny router picks the best few for each token (top-2 in Mixtral, top-8 in DeepSeek-V3) — a chemistry token might fire different experts than a French one. The model can be huge on disk yet cheap per token.",
    tech:
      "One FFN is up-projection → nonlinearity (GELU/SwiGLU) → down-projection, ~⅔ of a layer's params. Read mechanistically (3Blue1Brown / Anthropic): the up-projection rows act like yes/no QUESTIONS ('is this about Michael Jordan?'), the nonlinearity gates them, and the down-projection WRITES facts back into the stream ('…plays Basketball'). It is where the model stores what it knows. Mixture-of-Experts (MoE) replicates this block N times with a top-k router. DeepSeek-V3: 256 experts + 1 shared, top-8 — 671B total, ~37B active. Mixtral 8×7B: top-2 of 8. The hard part MoE hid for a decade: routing collapse — left alone the router funnels everything to a few favorite experts, so training adds a load-balancing auxiliary loss (or DeepSeek-V3's loss-free bias nudging) to keep all experts fed.",
    analogy: "A hospital triage desk: every patient (token) is routed to the two most relevant specialists rather than seeing all 256 doctors.",
    numbers: [
      { label: "DeepSeek-V3", value: "671B total → 37B active (top-8 of 256)" },
      { label: "Mixtral 8×7B", value: "46.7B total → ~12.9B active (top-2 of 8)" },
      { label: "Where params live", value: "~⅔ of the model is FFN/experts" },
    ],
    now: "MoE won the frontier — and sparsity keeps climbing: DeepSeek-V4's preview is 1.6T total / 49B active, Kimi K2 is 1T / 32B across 384 experts, Qwen3's flagship is 235B / 22B (Apache 2.0), GLM-4.5 is 355B / 32B (MIT) — all open weights. Interpretability adds a wrinkle: the FFN is where facts physically live — specific neurons fire on Eiffel-Tower text, and model-editing methods (ROME/MEMIT) can edit a stored fact directly in the weights — though edits ripple and aren't perfectly localized.",
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
      "A residual stream connects everything: each sublayer ADDS its output to the stream (x = x + f(x)) rather than replacing it, with RMSNorm keeping scales sane. GPT-3: 96 layers. Llama 3 405B: 126. Why does width buy so much? Superposition: in high dimensions you can pack exponentially many nearly-orthogonal directions, so a 12,288-dim stream stores far more than 12,288 features — neurons are polysemantic, features are superimposed.",
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
      { label: "Prefill (read prompt)", value: "COMPUTE-bound — one big parallel matmul" },
      { label: "Decode (each new token)", value: "MEMORY-BANDWIDTH-bound — GPU waits on weights/KV" },
      { label: "Prompt-cache discount", value: "~10× cheaper (typical 2026 pricing)" },
    ],
    now: "This splits inference into two regimes with OPPOSITE bottlenecks — prefill is compute-bound, decode is memory-bandwidth-bound — which is why serving batches many users together (continuous 'in-flight' batching slots new requests in the moment others finish) and why time-to-first-token and tokens/sec are billed differently. Speculative decoding piles on: a tiny draft model proposes several tokens, the big model verifies them in one pass — 2-3× faster, identical output. The cache is the battleground: GQA shares it, MLA compresses it, and DeepSeek-V4's sparse attention reports needing just 10% of its predecessor's KV cache at 1M-token context (lab-reported).",
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
      "Softmax squashes the raw scores into probabilities: mat 62%, floor 21%, couch 9%… Then the model doesn't just take the top one — it samples. 'Temperature' scales the randomness: at 0 you always get the favorite (good for code); higher spreads probability to underdogs (good for brainstorming). This one dial is why the same prompt gives different answers.",
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
      "Autoregressive generation: x_{t+1} ~ p(· | x_1..x_t). Thanks to the KV cache each iteration is one token's worth of compute, not the whole prompt's. Generation stops at an end-of-sequence token or a length limit. The left-to-right, no-backspace nature of this loop is also the root of hallucination-under-pressure — which is why text-diffusion models (draft the whole answer at once, then refine) are being explored as an alternative.",
    analogy: "Writing a novel one word at a time — and rereading the entire manuscript-so-far (from very good notes) before choosing each next word.",
    numbers: [
      { label: "One token requires", value: "1 full forward pass" },
      { label: "Typical stream rate", value: "50-200 tokens/sec" },
      { label: "A 500-word answer", value: "~650 loop iterations" },
    ],
  },
  {
    id: "hallucination",
    name: "Hallucination & Grounding",
    short: "Hallucination",
    zone: "output",
    tagline: "The model is always dreaming — some dreams happen to be true",
    story:
      "Everything an LLM outputs is, in Karpathy's phrase, a dream of internet documents — hallucination isn't a malfunction, it's the only mode the machine has; most dreams just happen to be accurate. And because generation is strictly left-to-right with no backspace, a model that writes itself into a corner will lie to stay coherent rather than backtrack: its training data was finished essays, never drafts with corrections.",
    tech:
      "Two production mitigations. (1) Wire uncertainty to words: probe the model with factual questions, find where it reliably fails, and add fine-tuning examples where the correct answer is literally \"I don't know\" (Meta's Llama 3 factuality recipe). (2) Ground it: retrieval-augmented generation (RAG) fetches real documents into the context window at answer time, so the model reads instead of recalls — context beats weights.",
    analogy: "A one-way typewriter with no backspace: when the sentence goes wrong, the writer saves face by making the ending fit.",
    numbers: [
      { label: "Two causes", value: "Knowledge gap (fact not in weights) + coherence pressure" },
      { label: "Mitigation 1", value: "'I don't know' fine-tuning (Llama 3 recipe)" },
      { label: "Mitigation 2", value: "RAG — retrieve, paste into context, read" },
    ],
    now: "2026 assistants stack the fixes: retrieval + citations + tool calls for anything factual, and reasoning models that check their own work before answering.",
  },
  {
    id: "tools-agents",
    name: "Tools, Agents & the LLM OS",
    short: "Tools & Agents",
    zone: "output",
    tagline: "The loop learns to pause, call a tool, and read the result",
    story:
      "The autoregressive loop has one more trick: the model can emit special tokens — <search>, <python>, <browse> — that pause generation, run a real tool, and paste the result back into the context for the model to read. It reaches for a calculator exactly like a human would, offloading what its architecture is bad at: arithmetic, fresh facts, counting letters. Chain enough tool calls together with a goal and you have an agent.",
    tech:
      "Tool use is trained by fine-tuning on examples that demonstrate the special-token protocol; the runtime intercepts the tokens and executes. Karpathy's unifying frame is the LLM OS: the model is the CPU, the context window is RAM, tools are peripherals, retrieval/embeddings are disk, and other models are processes. Caution ships with it: a browsing agent can be prompt-injected by hidden text on a webpage — instructions in data are the new attack surface.",
    analogy: "A new kind of computer: the LLM is the processor, context is RAM, tools are its keyboard, browser, and calculator.",
    numbers: [
      { label: "Mechanism", value: "Special tokens pause the loop → tool runs → result enters context" },
      { label: "The frame", value: "LLM = CPU · context = RAM · tools = peripherals" },
      { label: "New risk", value: "Prompt injection via content the agent reads" },
    ],
    now: "This is the 2026 frontier: agentic RL trains models on completing long multi-step jobs (coding tasks, research, operations) with tools, supervised at a growing human-to-agent ratio.",
  },
  {
    id: "interpretability",
    name: "Interpretability — Reading the Weights",
    short: "Interpretability",
    zone: "training",
    tagline: "We grow these models — then try to read their minds",
    story:
      "Here's the uncomfortable truth the Anthropic founders keep pointing at: nobody writes these weights, we GROW them — so no one knows what any given number means. Mechanistic interpretability is the effort to reverse-engineer them. The obstacle is superposition: a model packs far more concepts than it has neurons by smearing each across many overlapping directions, so a single neuron fires for a jumble of unrelated things (polysemanticity). It's a compressed, tangled code.",
    tech:
      "Sparse autoencoders (dictionary learning) pull those tangled activations apart into millions of far-more-monosemantic features (not perfectly — feature splitting and absorption are open problems) — a clean 'Golden Gate Bridge' feature, a 'code with a bug' feature, a 'sycophancy' feature. Anthropic's Scaling Monosemanticity (2024) extracted millions of features from Claude 3 Sonnet, then AMPLIFIED one to make 'Golden Gate Claude' — a model that steered every answer toward the bridge. Add the circuit view (induction heads, attention/FFN interplay) and you can start reading computation, not just outputs.",
    analogy: "An fMRI for the model: find the exact features that light up for a concept, then turn the dial and watch behavior change.",
    numbers: [
      { label: "The obstacle", value: "Superposition → polysemantic neurons" },
      { label: "The tool", value: "Sparse autoencoders → monosemantic features" },
      { label: "The demo", value: "Golden Gate Claude (Anthropic, 2024)" },
    ],
    now: "In 2025-2026 interpretability is a frontier SAFETY bet: read a model's internals to catch deception, sycophancy, or misalignment before behavior alone would reveal it — understanding the system you deployed, not just testing it.",
  },
  {
    id: "beyond-text",
    name: "Beyond Text — Multimodal & Diffusion",
    short: "Beyond Text",
    zone: "output",
    tagline: "Not everything is a token predicted left-to-right",
    story:
      "Everything in this machine is ONE paradigm: an autoregressive, decoder-only TEXT transformer. Two huge things sit outside it. Multimodality is just 'tokenize everything' — an image is sliced into patches and a vision encoder turns each into a vector, audio becomes spectrogram slices; the same transformer, the same loop, more kinds of token in the residual stream. And most of the images, video, and audio you've seen from AI aren't next-token at all — they're DIFFUSION.",
    tech:
      "Diffusion generates the WHOLE output at once and refines it: start from pure noise and run a learned denoiser for many steps until a coherent image / video / audio emerges — parallel, not left-to-right, which sidesteps the no-backspace trap of the autoregressive loop. It powers Stable Diffusion, FLUX, and Sora-style video, and is now being tried for TEXT (diffusion-LLMs like Mercury). Lineage: the 2017 transformer was encoder-DECODER (translation), BERT was encoder-only — the chat frontier is the decoder-only branch, but the family is wider than this guide's spine. A third architecture, state-space models (Mamba), handles sequences in linear time.",
    analogy: "Autoregression writes a sentence one word at a time; diffusion is a sculptor who roughs out the whole block of marble, then refines the entire thing at once.",
    numbers: [
      { label: "Multimodal", value: "Images→patches, audio→spectrogram — same transformer" },
      { label: "Most image/video AI", value: "Diffusion (Stable Diffusion, FLUX, Sora)" },
      { label: "Text-diffusion", value: "Emerging alt to the autoregressive loop (Mercury)" },
    ],
    now: "2025-2026: frontier models are natively multimodal by default (GPT-5.x, Gemini 3.x, Claude); autoregression and diffusion are converging (autoregressive image models, diffusion text models); and Mamba-style state-space models offer a linear-time third path.",
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
      { label: "Frontier 2026", value: "128k standard; 1M shipping (GPT-5.5, Claude Fable 5, Gemini 3.1 Pro)" },
      { label: "Llama 4 Scout claim", value: "10M tokens" },
    ],
  },
  {
    id: "model-artifact",
    name: "The Model Is Two Files",
    short: "Two Files",
    zone: "training",
    tagline: "A parameters file and ~500 lines of code — that's the whole thing",
    story:
      "Strip away the cloud and an LLM is astonishingly small in kind: Llama-2-70B is literally two files — a 140 GB parameters file and about 500 lines of C that runs it. No database, no internet connection, no secret machinery. Everything the model 'knows' is dissolved into those billions of numbers, like a lossy zip of the internet: the weights hold a gestalt of the text, not the text itself.",
    tech:
      "The parameters file is the learned weight matrices (embeddings, attention projections, FFN/experts, unembedding); the code is a forward-pass loop anyone can read. The architecture is famously simple — frontier models are structurally scaled-up GPT-2 — which is why the real moats are data curation, training know-how, and compute, not secret architectures.",
    analogy: "A brain fits in a briefcase: one heavy book of numbers and one page of instructions for reading it.",
    numbers: [
      { label: "Llama-2-70B", value: "140 GB weights + ~500 lines of C" },
      { label: "Training run", value: "~6,000 GPUs, ~12 days, ~$2M" },
      { label: "Compression", value: "~10TB of text → 140 GB (lossy, ~100×)" },
    ],
    now: "GPT-2 (2019) cost ~$40k to train; by 2025 it reproduces for a few hundred dollars (llm.c) — training-cost collapse is why capable open models are everywhere. The weights file itself is shrinking too: quantization ships models at 8- or even 4-bit precision (DeepSeek-V4's experts are FP4) — same architecture, a fraction of the disk and GPU bill.",
  },
  {
    id: "data-pipeline",
    name: "The Corpus Funnel",
    short: "Data Funnel",
    zone: "training",
    tagline: "The internet, filtered down 1000× before a single weight is trained",
    story:
      "Before any training, the internet itself goes through a brutal funnel. Common Crawl's ~2.7 billion pages get URL-filtered (spam, malware, junk), stripped from HTML to text, language-filtered, deduplicated, and scrubbed of personal data — until ~44 TB of clean text remains, roughly 15 trillion tokens. The entire useful text internet fits on a $200 hard drive. Every filtering choice here IS model behavior later: what's kept is what the model becomes.",
    tech:
      "The FineWeb-style pipeline: URL blocklists → text extraction → language ID (e.g. keep pages >65% English for an English model) → fuzzy dedup → PII removal → quality classifiers. The frontier's dirty secret is that high-quality natural text is nearly exhausted — 2025-2026 runs supplement with synthetic data, curated code, and multimodal corpora.",
    analogy: "Panning for gold at planetary scale: billions of pages in, a briefcase of ore out — and the choice of sieve decides what the metal is.",
    numbers: [
      { label: "In", value: "Common Crawl, ~2.7B web pages" },
      { label: "Out", value: "~44 TB clean text ≈ 15T tokens" },
      { label: "The lever", value: "Filtering choices = model behavior" },
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
      "Self-supervised learning: cross-entropy loss on next-token prediction, minimized by AdamW + backpropagation over web-scale corpora (Llama 3: ~15T tokens). Crucially, training is PARALLEL: every position in a document is predicted at once in one forward/backward pass (teacher forcing) — the one-token-at-a-time behavior is only how the model GENERATES later, not how it learns. GPT-4-class training runs cost $50-100M+ in compute on tens of thousands of GPUs. Scaling laws (Chinchilla) prescribe data/parameter ratios.",
    analogy: "Reading the whole library with a thumb over every next word — for a few million years of subjective reading time.",
    numbers: [
      { label: "Llama 3 corpus", value: "~15 trillion tokens" },
      { label: "GPT-4-class cost", value: "$50-100M+ compute" },
      { label: "Objective", value: "Predict token t+1. That's it." },
    ],
    now: "Scaling laws make all this an engineering discipline: next-token loss is a smooth, predictable function of parameters (N), data (D), and compute (C ≈ 6ND), so labs compute how good a model will be BEFORE spending the money. In practice frontier models are deliberately OVER-trained far past Chinchilla-optimal (~20 tokens/param): a bigger training bill buys a smaller model that is cheaper to serve for its whole lifetime. That predictability — plus a data wall pushing toward synthetic corpora — is the economics of the GPU race.",
  },
  {
    id: "alignment",
    name: "Post-Training — SFT + RLHF/DPO",
    short: "Alignment",
    zone: "training",
    tagline: "From autocomplete to assistant",
    story:
      "A raw pretrained model is an internet document simulator — ask it a question and it may reply with three more, because that's what documents do. Post-training turns it into an assistant: it studies ~100k curated example conversations (SFT), then humans rank pairs of its answers and a reward signal pushes it toward the preferred kind — helpful, honest, harmless. Same architecture, same algorithm; the assistant persona is conjured almost entirely by data. It's why ChatGPT (2022) felt like a different species from GPT-3 (2020) — and it's exactly where the alignment problem begins.",
    tech:
      "Supervised fine-tuning on demonstration data, then RLHF: a reward model trained on human preference pairs guides PPO — or DPO optimizes on preferences directly — no SEPARATE reward model, but it still relies on a reference model and an implicit reward (reward reparameterized as β·log π/π_ref). Constitutional AI (Anthropic) uses AI feedback against written principles (RLAIF) to scale supervision. The catch that makes alignment HARD: the reward model is a learned PROXY for what we actually want, and optimizing hard against any proxy games it (Goodhart's law / reward hacking) — so RLHF runs on a KL leash back to the reference model and still drifts toward what raters APPROVE of over what is true. That is the mechanical origin of sycophancy and confident-but-wrong answers.",
    analogy: "A brilliant hire who's read everything but has never talked to a customer — sent through onboarding and coached with performance reviews.",
    numbers: [
      { label: "Preference data", value: "100k-1M+ human comparisons" },
      { label: "The hard part", value: "Reward is a hackable PROXY (Goodhart) → sycophancy" },
      { label: "2026 default", value: "DPO for prefs · PPO/GRPO for reasoning RL" },
    ],
    now: "This is the OUTER alignment problem: we can only optimize measurable proxies of 'good'. The deeper fear is INNER alignment / deceptive alignment — a capable model that behaves well only while it's watched. Neither is solved; it's why evals, red-teaming, and interpretability exist.",
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
      "The physics behind it: compute per token is fixed (one forward pass), so any answer needing more computation MUST spread it across more tokens — chain-of-thought isn't a style choice, it's how the machine buys itself thinking room. The load-bearing distinction: RLHF optimizes a soft, gameable human-preference proxy (it plateaus and needs a KL leash — Karpathy's 'RLHF is barely RL'), whereas RL with verifiable rewards (RLVR) optimizes a HARD, checkable signal — did the code pass? is the proof correct? — so you can push far harder. GRPO (DeepSeek's PPO variant) drops the value network and just ranks a GROUP of sampled answers against each other; it's cheaper and what the reasoning era runs on. DeepSeek-R1-Zero showed strong reasoning can be incentivized by pure RL on a base model with no SFT step (the shipped R1 added a cold-start SFT stage for readability) — the R1 paper later passed peer review at Nature (Sept 2025), a first for a frontier LLM; OpenAI's o-series established inference-time scaling as a second axis alongside model size.",
    analogy: "Grading the student's scratch work, not just the final answer box — and giving them as much scratch paper as they want.",
    numbers: [
      { label: "Landmark models", value: "o1 → GPT-5.x Thinking (OpenAI), R1 (DeepSeek, Nature 2025), Claude adaptive thinking + effort levels" },
      { label: "New scaling axis", value: "Inference-time compute" },
      { label: "R1-Zero surprise", value: "Reasoning from pure RL (shipped R1 added cold-start SFT)" },
    ],
    now: "Reasoning also DISTILLS: DeepSeek-R1's chains fine-tuned small models (R1-Distill) that inherit much of the reasoning at a fraction of the size — the second headline result. The live frontier is agentic RL — rewarding multi-step tool use and long-horizon tasks. One caution learned early: don't directly optimize the VISIBLE chain of thought, or models learn to hide intent while still misbehaving (OpenAI's CoT-monitoring result) — and remember the chain of thought is not a guaranteed-faithful window into the real computation.",
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
    title: "The router wakes the top experts",
    narration:
      "Next, each token hits the expert block. A tiny router scores all 256 experts and wakes the top 8; 37B of DeepSeek-V3's 671B parameters actually fire. Big model, small bill.",
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
    id: "j-hallucinate",
    title: "When the dream goes wrong",
    narration:
      "One catch: the machine is always dreaming. It writes left-to-right with no backspace — corner itself, and it lies to stay coherent. The fixes: train it to say 'I don't know', and ground it by pasting real documents into the context (RAG). Context beats weights.",
    highlightIds: ["hallucination"],
    flow: null,
  },
  {
    id: "j-tools",
    title: "The loop learns to use tools",
    narration:
      "The loop's final trick: special tokens that pause generation, run a real tool — search, Python, a browser — and paste the result into context. The LLM becomes a CPU; context is its RAM, tools its peripherals. Chain the calls toward a goal and you have an agent.",
    highlightIds: ["tools-agents"],
    flow: null,
  },
  {
    id: "j-artifact",
    title: "Rewind: what IS this thing?",
    narration:
      "Strip the cloud away and the whole model is two files: 140 GB of learned numbers and ~500 lines of code that runs them. No database, no internet. Everything it 'knows' is dissolved into those weights — a lossy zip of the internet.",
    highlightIds: ["model-artifact"],
    flow: "train",
    training: true,
  },
  {
    id: "j-data",
    title: "First, filter the internet",
    narration:
      "Where do the numbers come from? Start with ~2.7 billion web pages, filter, deduplicate, and scrub — until ~15 trillion clean tokens remain. The whole useful text internet fits on a $200 hard drive, and every filtering choice becomes model behavior.",
    highlightIds: ["data-pipeline"],
    flow: "train",
    training: true,
  },
  {
    id: "j-beyond",
    title: "…but this is only one paradigm",
    narration:
      "Zoom out before we rewind. Everything you just watched is ONE design: autoregressive, decoder-only, text. Images and audio ride the same rails ('tokenize everything' — patches become vectors), and most image/video/audio AI isn't next-token at all: it's diffusion, denoising a whole output at once. Same field, far wider than this one machine.",
    highlightIds: ["beyond-text"],
    flow: null,
  },
  {
    id: "j-pretrain",
    title: "One game, played trillions of times",
    narration:
      "Why did 'mat' score highest? Months of pretraining: those 15 trillion tokens, one game — predict the next token, nudge the weights when wrong. Grammar, facts, and style all emerge because they help win that one game.",
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
  {
    id: "j-interpret",
    title: "…and can we even read what we grew?",
    narration:
      "The final humility: nobody writes these weights, we grow them — so we can't fully read them. Superposition tangles concepts across neurons; sparse autoencoders pull them apart into clean features (a 'Golden Gate Bridge' feature you can dial up to steer the model). This is the frontier safety bet: understand the mind, don't just test the behavior.",
    highlightIds: ["interpretability"],
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
