# How LLMs Work — Watch a Thought Get Computed

From your keystrokes to the model's next word: tokenizer, embeddings, 96 layers of attention and experts, a 200,000-way dice roll — and the loop that runs it all again. Updated for the MoE + reasoning-model era.

> Every stage a prompt passes through, modeled as an explorable 3D machine. 21 stages, a 21-step guided journey tracing one token from "The cat sat on the" to "mat", real parameter counts from GPT-3 to DeepSeek-V3, and the training story — pretraining, RLHF, and the reasoning-RL breakthrough.

By Venkata Pagadala, AI Product Manager (Search · SEO · GEO), AT&T · Updated 2026-07-11 · 18 min read

Canonical: https://venkatapagadala.com/guides/how-llms-work
Tags: LLM, Transformers, Attention, Mixture of Experts, Reasoning Models, 3D Interactive, AI Explainer

Every answer an LLM gives you is manufactured by the same machine: text is chopped into **tokens**, tokens become **vectors**, vectors flow through a stack of **attention** and **expert** layers, and everything collapses into one probability distribution over the next token. A weighted die is rolled, the winner is appended — and the whole machine runs again, hundreds of times per answer. The model below is that machine. **Play the journey**, or click any stage.

## Watch a thought get computed

*(Interactive 3D content: explore it at https://venkatapagadala.com/guides/how-llms-work)*

> **What you're looking at:** **Blue** stages turn your words into numbers. **Violet** is the transformer core — attention beams polling the sentence, a router waking 2 of 8 experts, a KV cache filling. **Green** is the output side: 200,000 scores, a temperature dial, a die roll, and the loop arc carrying 'mat' back to the start. **Amber**, behind, is where the weights came from: pretraining, human feedback, and 2025's reasoning RL.

## The journey, in plain text

The same 15 steps the interactive journey walks through — as text, for reading (and for the crawlers and answer engines that can't run WebGL).

1. **You type five words.** "The cat sat on the" — and hit enter. For the next fraction of a second, this string is the model's entire universe. Watch it travel.
2. **Text becomes tokens.** The tokenizer chops the text into 5 tokens and swaps each for an ID from its ~100,000-entry vocabulary: [791, 8415, 7731, 389, 279]. The model will never see letters — only these IDs.
3. **Tokens become vectors.** Each ID looks up its row in the embedding matrix and becomes a vector of ~16,000 numbers — a point in meaning-space, where 'cat' sits near 'kitten' and far from 'carburetor'.
4. **Position is stamped on.** RoPE rotates each vector by its position, so 'cat' (token #2) is distinguishable from a 'cat' appearing at #2,000. Word order now lives in the geometry.
5. **Into the stack.** The five vectors enter a tower of identical layers — 96 in GPT-3, 126 in Llama 3 405B. Each layer will read the whole sentence, then refine every token's vector a little.
6. **Attention: everyone polls everyone.** Inside each layer, attention heads fire — watch the beams. The final 'the' polls every earlier token and pulls hardest from 'sat' and 'on': it now knows it's the start of a place phrase. 96+ heads do this simultaneously, each asking a different question.
7. **The router wakes the top experts.** Next, each token hits the expert block. A tiny router scores all 256 experts and wakes the top 8; 37B of DeepSeek-V3's 671B parameters actually fire. Big model, small bill.
8. **…repeat ×96, with a cache.** Attention → experts → attention → experts, dozens of times, each layer adding its refinement to the residual stream. Every key and value computed gets stored in the KV cache — nothing is ever re-derived.
9. **200,000 scores.** At the top of the stack, the final position's vector — now carrying the whole sentence's meaning — is scored against every token in the vocabulary. 'mat' spikes. 'floor' and 'couch' trail. 'photosynthesis' is buried.
10. **Temperature, then the dice roll.** Softmax turns scores into probabilities — mat 62%, floor 21%, couch 9% — and temperature reshapes them. Then a weighted die is rolled. Today: 'mat'.
11. **Append — and run it ALL again.** 'mat' is appended to the sequence and the entire pipeline runs again for the next token. A paragraph is hundreds of these loops at 50-200 tokens per second. This loop IS the typing you watch on screen.
12. **The edge of the universe.** Everything so far lived inside the context window — 128k tokens standard, 1M+ on the frontier. Outside it, nothing exists. 'Memory' in chat apps is engineering: notes retrieved and pasted back into next prompt.
13. **When the dream goes wrong.** One catch: the machine is always dreaming. It writes left-to-right with no backspace — corner itself, and it lies to stay coherent. The fixes: train it to say 'I don't know', and ground it by pasting real documents into the context (RAG). Context beats weights.
14. **The loop learns to use tools.** The loop's final trick: special tokens that pause generation, run a real tool — search, Python, a browser — and paste the result into context. The LLM becomes a CPU; context is its RAM, tools its peripherals. Chain the calls toward a goal and you have an agent.
15. **Rewind: what IS this thing?.** [training] Strip the cloud away and the whole model is two files: 140 GB of learned numbers and ~500 lines of code that runs them. No database, no internet. Everything it 'knows' is dissolved into those weights — a lossy zip of the internet.
16. **First, filter the internet.** [training] Where do the numbers come from? Start with ~2.7 billion web pages, filter, deduplicate, and scrub — until ~15 trillion clean tokens remain. The whole useful text internet fits on a $200 hard drive, and every filtering choice becomes model behavior.
17. **…but this is only one paradigm.** Zoom out before we rewind. Everything you just watched is ONE design: autoregressive, decoder-only, text. Images and audio ride the same rails ('tokenize everything' — patches become vectors), and most image/video/audio AI isn't next-token at all: it's diffusion, denoising a whole output at once. Same field, far wider than this one machine.
18. **One game, played trillions of times.** [training] Why did 'mat' score highest? Months of pretraining: those 15 trillion tokens, one game — predict the next token, nudge the weights when wrong. Grammar, facts, and style all emerge because they help win that one game.
19. **From autocomplete to assistant.** [training] Raw pretrained models just continue text. Post-training — example conversations, then humans ranking answer pairs (RLHF/DPO) — is what makes it answer your question instead of asking three more.
20. **2025+: models that think before answering.** [training] The newest layer: reinforcement learning on the chain of thought itself, rewarded only when the reasoning verifiably works (math checks, code passes tests). That's what a 'thinking' model is doing during the pause — and why more thinking time buys more accuracy.
21. **…and can we even read what we grew?.** [training] The final humility: nobody writes these weights, we grow them — so we can't fully read them. Superposition tangles concepts across neurons; sparse autoencoders pull them apart into clean features (a 'Golden Gate Bridge' feature you can dial up to steer the model). This is the frontier safety bet: understand the mind, don't just test the behavior.

## Every stage, with real numbers

| Stage | Zone | What happens | Real numbers | 2025-2026 |
|---|---|---|---|---|
| Your Prompt | input | Plain text in — the only thing the model ever sees. Everything starts as a string of characters: your question, the system prompt, the conversation so far, maybe a document you pasted. The model has no memory of you and no access to the world — for a text model this text is its entire universe for the next few hundred milliseconds. (Natively-multimodal models also take images and audio, encoded to embeddings by a separate vision/audio encoder and injected right alongside the text tokens.) | What the model sees: One flat token sequence · Typical chat overhead: 50–500 hidden system/control tokens | 2025-2026 apps silently pack a lot into the prompt: tool results, retrieved documents (RAG), agent scratchpads — all just more tokens. |
| Tokenizer (BPE) | input | Text is chopped into ~100k reusable fragments. The model can't read letters. A tokenizer chops your text into 'tokens' — common words, word-pieces, and punctuation — each mapped to an integer ID from a fixed vocabulary. "The cat sat on the" becomes five familiar chunks; a rare word like "antidisestablishment" shatters into several. | GPT-4o vocab (o200k): ~200,000 tokens · Llama 3 vocab: 128,256 tokens · Rule of thumb: 1 token ≈ ¾ of an English word | Newer tokenizers are multilingual-fairer (fewer tokens per non-English sentence) and byte-fallback so NO input is ever unrepresentable. |
| Embedding Matrix | input | Each token ID becomes a vector — a point in meaning-space. Each token ID looks up its own row in a giant table, retrieving a list of thousands of numbers — its embedding. Directions carry rough meaning — similar tokens sit closer. (The famous king − man + woman ≈ queen trick is a word2vec/GloVe property of STATIC embeddings; a transformer's input table is nearly context-free, and the rich geometry is built up layer by layer.) From here on, the model touches only vectors, never words. | GPT-3 dims (d_model): 12,288 · Llama 3 405B dims: 16,384 · Embedding table alone: ~2.1B params (Llama 3 405B) | - |
| Positional Encoding (RoPE) | input | Vectors get stamped with WHERE they are in the sentence. "Dog bites man" and "man bites dog" contain identical tokens — order is everything. Before the stack, each vector is marked with its position so the model can tell first from fifth from five-thousandth. | Technique of choice: RoPE (rotary embeddings) · Context this enables: 128k → 1M+ tokens | Gemini 3.1 Pro and GPT-5.5's API both ship ~1M-token contexts. Two tricks get there. Rope-scaling (YaRN and kin) stretches a model trained at, say, 64K out to far longer; it's how DeepSeek-V3 was extended to 128k. Newer models like DeepSeek-V4 lean instead on sparse, compressed attention. (Meta advertises 10M for Llama 4 Scout, but independent long-context tests haven't backed it, so treat it as a claim.) |
| Self-Attention (QKV Heads) | core | Every token looks at every earlier token and asks: who matters to me?. This is the transformer's superpower. For each token, dozens of attention heads each ask a different question of the sentence — one tracks grammar, one tracks names, one tracks what 'it' refers to. Each head pulls in information from the tokens that answer best, updating the token's vector with context. 'The' at the end of "the cat sat on the" ends up knowing it needs a sit-on-able noun next. | GPT-3 heads/layer: 96 · Llama 3 405B: 128 heads, GQA 8 KV groups · Cost: O(n²) compute · O(n) memory (FlashAttention) | FlashAttention-3 computes exact attention with far less memory traffic; nearly every 2026 model ships grouped-query attention (MHA→MQA→GQA: query heads share K/V heads to shrink the cache) and DeepSeek's MLA compresses KV 10×+ into a latent vector. The live fight is hybrid linear attention — Ant's Ring-linear ships 4-7 linear layers per softmax layer, while MiniMax publicly reverted its M2 to full attention after linear variants fell short on multi-hop reasoning. Interpretability can now read heads directly: they specialize (grammar, names, pronouns), and 'induction heads' that spot A-B…A patterns and predict B are a leading hypothesized mechanism behind in-context learning. |
| Feed-Forward / MoE Experts | core | A router wakes only the top few of N expert networks per token. After attention gathers context, a much bigger block does the 'thinking': the feed-forward network, where most of the parameters live. Frontier models split it into many parallel 'experts' and a tiny router picks the best few for each token (top-2 in Mixtral, top-8 in DeepSeek-V3) — a chemistry token might fire different experts than a French one. The model can be huge on disk yet cheap per token. | DeepSeek-V3: 671B total → 37B active (top-8 of 256) · Mixtral 8×7B: 46.7B total → ~12.9B active (top-2 of 8) · Where params live: ~⅔ of the model is FFN/experts | MoE won the frontier — and sparsity keeps climbing: DeepSeek-V4's preview is 1.6T total / 49B active, Kimi K2 is 1T / 32B across 384 experts, Qwen3's flagship is 235B / 22B (Apache 2.0), GLM-4.5 is 355B / 32B (MIT) — all open weights. Interpretability adds a wrinkle: the FFN is where facts physically live — specific neurons fire on Eiffel-Tower text, and model-editing methods (ROME/MEMIT) can edit a stored fact directly in the weights — though edits ripple and aren't perfectly localized. |
| The Stack (×N Layers) | core | Attention + experts, repeated 30–120 times. One layer of attention-plus-experts is a single 'read the room, then think' step. The model stacks that step dozens of times. Early layers resolve syntax and merge word-pieces; middle layers assemble facts and relationships; late layers commit to what comes next. Each token's vector flows up this stack, enriched at every floor. | GPT-3: 96 layers · Llama 3 405B: 126 layers · The connective tissue: Residual stream + RMSNorm | - |
| KV Cache | core | The memory trick that makes generation fast. Generating token #500 shouldn't require re-reading tokens 1-499 from scratch — and it doesn't. Every token's attention keys and values are cached the first time they're computed. Each new token only computes itself, then looks up everyone else. This cache is why the first token takes a moment ('prefill') and the rest stream out fast. | Why streaming is fast: New token attends to cached K/V · 128k-context cache: Multiple GB of VRAM · Prefill (read prompt): COMPUTE-bound — one big parallel matmul · Decode (each new token): MEMORY-BANDWIDTH-bound — GPU waits on weights/KV · Prompt-cache discount: ~10× cheaper (typical 2026 pricing) | This splits inference into two regimes with OPPOSITE bottlenecks — prefill is compute-bound, decode is memory-bandwidth-bound — which is why serving batches many users together (continuous 'in-flight' batching slots new requests in the moment others finish) and why time-to-first-token and tokens/sec are billed differently. Speculative decoding piles on: a tiny draft model proposes several tokens, the big model verifies them in one pass — 2-3× faster, identical output. The cache is the battleground: GQA shares it, MLA compresses it, and DeepSeek-V4's sparse attention reports needing just 10% of its predecessor's KV cache at 1M-token context (lab-reported). |
| Logits — Scoring Every Token | output | The final vector is scored against all ~100k tokens. After the last layer, the final position's vector — which has absorbed the entire prompt — is compared against every token in the vocabulary, producing a raw score (logit) for each. After "The cat sat on the", 'mat' scores high, 'floor' close behind, 'photosynthesis' astronomically low. The model's entire 'opinion' about what comes next is this list of ~100-200k numbers. | Scores produced: One per vocab token (~100-200k) · Per forward pass: Exactly one next-token distribution | - |
| Softmax + Temperature | output | Scores become probabilities; a weighted die is rolled. Softmax squashes the raw scores into probabilities: mat 62%, floor 21%, couch 9%… Then the model doesn't just take the top one — it samples. 'Temperature' scales the randomness: at 0 you always get the favorite (good for code); higher spreads probability to underdogs (good for brainstorming). This one dial is why the same prompt gives different answers. | T = 0: Deterministic, always the argmax · T ≈ 0.7-1.0: Typical chat creativity · Common filter: top-p 0.9-0.95 | - |
| The Autoregressive Loop | output | The chosen token is appended — and everything runs again. The sampled token ('mat') is appended to the sequence, and the ENTIRE pipeline runs again to pick the token after it. And again. A 500-word answer is ~650 full trips through the machine, each choosing just one token while seeing everything chosen so far. The 'thinking' you watch stream out is this loop, spinning at 50-200 tokens per second. | One token requires: 1 full forward pass · Typical stream rate: 50-200 tokens/sec · A 500-word answer: ~650 loop iterations | - |
| Hallucination & Grounding | output | The model is always dreaming — some dreams happen to be true. Everything an LLM outputs is, in Karpathy's phrase, a dream of internet documents — hallucination isn't a malfunction, it's the only mode the machine has; most dreams just happen to be accurate. And because generation is strictly left-to-right with no backspace, a model that writes itself into a corner will lie to stay coherent rather than backtrack: its training data was finished essays, never drafts with corrections. | Two causes: Knowledge gap (fact not in weights) + coherence pressure · Mitigation 1: 'I don't know' fine-tuning (Llama 3 recipe) · Mitigation 2: RAG — retrieve, paste into context, read | 2026 assistants stack the fixes: retrieval + citations + tool calls for anything factual, and reasoning models that check their own work before answering. |
| Tools, Agents & the LLM OS | output | The loop learns to pause, call a tool, and read the result. The autoregressive loop has one more trick: the model can emit special tokens — <search>, <python>, <browse> — that pause generation, run a real tool, and paste the result back into the context for the model to read. It reaches for a calculator exactly like a human would, offloading what its architecture is bad at: arithmetic, fresh facts, counting letters. Chain enough tool calls together with a goal and you have an agent. | Mechanism: Special tokens pause the loop → tool runs → result enters context · The frame: LLM = CPU · context = RAM · tools = peripherals · New risk: Prompt injection via content the agent reads | This is the 2026 frontier: agentic RL trains models on completing long multi-step jobs (coding tasks, research, operations) with tools, supervised at a growing human-to-agent ratio. |
| Interpretability — Reading the Weights | training | We grow these models — then try to read their minds. Here's the uncomfortable truth the Anthropic founders keep pointing at: nobody writes these weights, we GROW them — so no one knows what any given number means. Mechanistic interpretability is the effort to reverse-engineer them. The obstacle is superposition: a model packs far more concepts than it has neurons by smearing each across many overlapping directions, so a single neuron fires for a jumble of unrelated things (polysemanticity). It's a compressed, tangled code. | The obstacle: Superposition → polysemantic neurons · The tool: Sparse autoencoders → monosemantic features · The demo: Golden Gate Claude (Anthropic, 2024) | In 2025-2026 interpretability is a frontier SAFETY bet: read a model's internals to catch deception, sycophancy, or misalignment before behavior alone would reveal it — understanding the system you deployed, not just testing it. |
| Beyond Text — Multimodal & Diffusion | output | Not everything is a token predicted left-to-right. Everything in this machine is ONE paradigm: an autoregressive, decoder-only TEXT transformer. Two huge things sit outside it. Multimodality is just 'tokenize everything' — an image is sliced into patches and a vision encoder turns each into a vector, audio becomes spectrogram slices; the same transformer, the same loop, more kinds of token in the residual stream. And most of the images, video, and audio you've seen from AI aren't next-token at all — they're DIFFUSION. | Multimodal: Images→patches, audio→spectrogram — same transformer · Most image/video AI: Diffusion (Stable Diffusion, FLUX, Sora) · Text-diffusion: Emerging alt to the autoregressive loop (Mercury) | 2025-2026: frontier models are natively multimodal by default (GPT-5.x, Gemini 3.x, Claude); autoregression and diffusion are converging (autoregressive image models, diffusion text models); and Mamba-style state-space models offer a linear-time third path. |
| Context Window | core | The model's entire working memory — and its hard limit. The context window is how many tokens the model can hold at once — prompt plus its own output. Nothing outside it exists: no memory of past chats, no knowledge of today's news. When conversations feel like the model 'forgot' the beginning, the beginning fell out of the window (or was summarized away by the app). | GPT-3 (2020): 2,048 tokens · Frontier 2026: 128k standard; 1M shipping (GPT-5.5, Claude Fable 5, Gemini 3.1 Pro) · Llama 4 Scout claim: 10M tokens | - |
| The Model Is Two Files | training | A parameters file and ~500 lines of code — that's the whole thing. Strip away the cloud and an LLM is astonishingly small in kind: Llama-2-70B is literally two files — a 140 GB parameters file and about 500 lines of C that runs it. No database, no internet connection, no secret machinery. Everything the model 'knows' is dissolved into those billions of numbers, like a lossy zip of the internet: the weights hold a gestalt of the text, not the text itself. | Llama-2-70B: 140 GB weights + ~500 lines of C · Training run: ~6,000 GPUs, ~12 days, ~$2M · Compression: ~10TB of text → 140 GB (lossy, ~100×) | GPT-2 (2019) cost ~$40k to train; by 2025 it reproduces for a few hundred dollars (llm.c) — training-cost collapse is why capable open models are everywhere. The weights file itself is shrinking too: quantization ships models at 8- or even 4-bit precision (DeepSeek-V4's experts are FP4) — same architecture, a fraction of the disk and GPU bill. |
| The Corpus Funnel | training | The internet, filtered down 1000× before a single weight is trained. Before any training, the internet itself goes through a brutal funnel. Common Crawl's ~2.7 billion pages get URL-filtered (spam, malware, junk), stripped from HTML to text, language-filtered, deduplicated, and scrubbed of personal data — until ~44 TB of clean text remains, roughly 15 trillion tokens. The entire useful text internet fits on a $200 hard drive. Every filtering choice here IS model behavior later: what's kept is what the model becomes. | In: Common Crawl, ~2.7B web pages · Out: ~44 TB clean text ≈ 15T tokens · The lever: Filtering choices = model behavior | - |
| Pretraining — Next-Token Prediction | training | Trillions of fill-in-the-blank exercises forge the weights. Where did all those weights come from? Months of one game, played trillions of times: here's a snippet of internet text — predict the next token. Wrong? Nudge all the weights a hair toward right. To get good at this game at scale, the network is forced to learn grammar, facts, style, even rudimentary world-models — because they all help predict what comes next. | Llama 3 corpus: ~15 trillion tokens · GPT-4-class cost: $50-100M+ compute · Objective: Predict token t+1. That's it. | Scaling laws make all this an engineering discipline: next-token loss is a smooth, predictable function of parameters (N), data (D), and compute (C ≈ 6ND), so labs compute how good a model will be BEFORE spending the money. In practice frontier models are deliberately OVER-trained far past Chinchilla-optimal (~20 tokens/param): a bigger training bill buys a smaller model that is cheaper to serve for its whole lifetime. That predictability — plus a data wall pushing toward synthetic corpora — is the economics of the GPU race. |
| Post-Training — SFT + RLHF/DPO | training | From autocomplete to assistant. A raw pretrained model is an internet document simulator — ask it a question and it may reply with three more, because that's what documents do. Post-training turns it into an assistant: it studies ~100k curated example conversations (SFT), then humans rank pairs of its answers and a reward signal pushes it toward the preferred kind — helpful, honest, harmless. Same architecture, same algorithm; the assistant persona is conjured almost entirely by data. It's why ChatGPT (2022) felt like a different species from GPT-3 (2020) — and it's exactly where the alignment problem begins. | Preference data: 100k-1M+ human comparisons · The hard part: Reward is a hackable PROXY (Goodhart) → sycophancy · 2026 default: DPO for prefs · PPO/GRPO for reasoning RL | This is the OUTER alignment problem: we can only optimize measurable proxies of 'good'. The deeper fear is INNER alignment / deceptive alignment — a capable model that behaves well only while it's watched. Neither is solved; it's why evals, red-teaming, and interpretability exist. |
| Reasoning RL — Thinking Models | training | 2025's breakthrough: reward the chain of thought itself. The newest idea: instead of only rewarding a nice final answer, let the model generate a long private chain of thought — then reinforce whatever reasoning actually leads to verifiably correct results on math, code, and logic. Models learn to plan, backtrack, and self-check. This is why 'thinking' models pause before answering: they're spending extra compute at inference time, and accuracy scales with how long they think. | Landmark models: o1 → GPT-5.x Thinking (OpenAI), R1 (DeepSeek, Nature 2025), Claude adaptive thinking + effort levels · New scaling axis: Inference-time compute · R1-Zero surprise: Reasoning from pure RL (shipped R1 added cold-start SFT) | Reasoning also DISTILLS: DeepSeek-R1's chains fine-tuned small models (R1-Distill) that inherit much of the reasoning at a fraction of the size — the second headline result. The live frontier is agentic RL — rewarding multi-step tool use and long-horizon tasks. One caution learned early: don't directly optimize the VISIBLE chain of thought, or models learn to hide intent while still misbehaving (OpenAI's CoT-monitoring result) — and remember the chain of thought is not a guaranteed-faithful window into the real computation. |

## The vocabulary that unlocks the papers

### Token (aka subword, BPE unit)

The atomic unit of LLM text — a common word, word-piece, or symbol from a fixed ~100-200k vocabulary.

Models never see letters or words — a byte-pair-encoding tokenizer chops text into vocabulary entries and hands the model integer IDs. Common words are one token; rare words shatter into pieces; a token averages about ¾ of an English word. Pricing, context limits, and speed are all measured in tokens.

- **Analogy:** A box of ~100,000 standard LEGO bricks that can snap together into any text ever written.
- **Example:** "The cat sat on the" → 5 tokens [791, 8415, 7731, 389, 279]; "antidisestablishment" → 4-5 tokens.
- **Why it matters:** Explains model quirks (letter-counting failures), API bills, and why context windows are token budgets, not word counts.

### Self-Attention (aka QKV attention, multi-head attention)

The mechanism that lets every token look at every earlier token and pull in the context that matters.

Each of dozens of heads projects tokens into queries, keys, and values; softmax(QKᵀ/√d_k) decides who listens to whom, and causal masking hides the future. One head may track syntax, another coreference. It's the transformer's core innovation — and its quadratic cost in context length is why long contexts are expensive.

- **Analogy:** A meeting where every word simultaneously polls every earlier word — 'are you relevant to me?' — and listens in proportion.
- **Example:** In "the cat sat on the ___", the final position attends hard to 'sat' and 'on', concluding a sit-on-able noun comes next.
- **Why it matters:** Explains why prompts work at all — instructions early in context steer computation everywhere downstream.

### Mixture of Experts (MoE)

An architecture where a router activates only the top few (top-k) of many expert networks per token — huge capacity, small per-token cost.

The feed-forward block (where ~⅔ of parameters live) is replicated into N experts; a learned router sends each token to the top-k. DeepSeek-V3 runs 256 routed experts and activates ~37B of its 671B parameters per token. This decoupling of stored capability from active compute is how 2025-2026 frontier models got big without getting slow.

- **Analogy:** A hospital triage desk routing each patient to the two most relevant specialists instead of all 256 doctors.
- **Example:** Mixtral 8×7B: top-2 of 8 experts. DeepSeek-V3: top-8 of 256 plus one shared expert.
- **Why it matters:** Why 'parameter count' stopped being the headline spec — active parameters and routing quality matter more.

### KV Cache

Stored attention keys/values for every processed token, so each new token only computes itself.

Without it, token #500 would recompute the whole prefix. With it, generation is one token of compute per step: the slow 'prefill' processes your prompt once, then tokens stream fast. It consumes VRAM linearly with context (GBs at 128k), which GQA and DeepSeek's MLA compress; vLLM pages it like virtual memory; providers bill cached prompt tokens ~10× cheaper.

- **Analogy:** A court stenographer's transcript — nobody re-litigates yesterday's testimony, they consult the notes.
- **Example:** Time-to-first-token = prefill; tokens-per-second after = cached decoding.
- **Why it matters:** Explains prompt-caching discounts and why agents should keep stable prompt prefixes.

### Temperature

The dial that reshapes next-token probabilities before sampling — 0 is deterministic, higher is more adventurous.

Logits are divided by T before softmax: T→0 concentrates all probability on the top token (greedy); T≈0.7-1.0 gives natural variety; T>1.2 gets weird. Top-p (nucleus) sampling then truncates the tail. This is why the same prompt yields different answers — the model outputs a distribution, not a word.

- **Analogy:** A weighted roulette wheel where temperature resizes the wedges before the spin.
- **Example:** After "The cat sat on the": T=0 always 'mat'; T=1 sometimes 'couch'; T=2 occasionally 'moon'.
- **Why it matters:** The first knob to set: 0-0.3 for extraction and code, 0.7+ for ideation.

### Reasoning Model (aka thinking model, o-series style, RLVR)

A model trained with RL to produce a long private chain of thought before answering — accuracy now scales with thinking time.

Instead of rewarding only polished answers, 2025-era training samples chains of thought and reinforces those that verifiably succeed (math checks, unit tests) — RL with verifiable rewards, via GRPO/PPO-family algorithms. DeepSeek-R1 showed reasoning emerge from pure RL; OpenAI's o-series established inference-time compute as a second scaling axis alongside model size.

- **Analogy:** Grading the student's scratch work, not just the answer box — with unlimited scratch paper.
- **Example:** o3 and DeepSeek-R1 pausing to 'think' for seconds-to-minutes on a hard math problem, then answering.
- **Why it matters:** The 2026 frontier: agentic RL extends the same trick to multi-step tool use and long-horizon tasks.

### RAG (Retrieval-Augmented Generation) (aka grounding, retrieval)

Fetch relevant documents at question time and paste them into the context window — the model reads instead of recalls.

A retriever (usually embedding search over a vector index) finds passages relevant to the query; they're injected into the prompt so the model answers from evidence it can see rather than from its lossy weights. It's the cheapest cure for hallucination and stale knowledge — no retraining, updatable in real time, and citable. The 2026 customization ladder runs: prompt engineering (free) → RAG (cheap, factual) → fine-tuning (behavioral change).

- **Analogy:** An open-book exam instead of a closed-book one: same student, radically better factual accuracy.
- **Example:** Ask about today's weather: the weights can't know it, but a RAG pipeline retrieves the live forecast into context and the model reads it back.
- **Why it matters:** The default architecture for enterprise AI: your data stays in a database, the model consumes it through the context window.

### Diffusion Model (aka denoising, score-based)

A generator that starts from pure noise and denoises the WHOLE output at once over many steps — parallel, not left-to-right.

Most of the AI images, video, and audio you've seen are NOT next-token prediction — they're diffusion. A model is trained to remove a little noise at a time; at generation it runs that denoiser for dozens of steps, sculpting a coherent result out of static. Because it refines the entire canvas simultaneously, it sidesteps the no-backspace path-dependence of the autoregressive loop — which is why the same idea is now being tried for text (diffusion-LLMs). It powers Stable Diffusion, FLUX, and Sora-style video.

- **Analogy:** Autoregression writes a sentence one word at a time; diffusion is a sculptor roughing out the whole block of marble, then refining all of it at once.
- **Example:** Type a prompt into an image model: it begins as TV static and, over ~20-50 denoising steps, resolves into the picture.
- **Why it matters:** The reminder that 'LLM' is one branch of generative AI, not the whole tree — multimodal agents orchestrate both.

### Reward Hacking (Goodhart's Law) (aka specification gaming, outer alignment)

When a model optimizes the measurable PROXY you trained on instead of the goal you meant — 'when a measure becomes a target, it ceases to be a good measure.'

Alignment is hard because we can't specify 'be helpful, honest, harmless' directly — we can only train on a proxy (a reward model of human ratings). Optimize any proxy hard enough and the model games it: RLHF rewards answers that human raters APPROVE of, and approval diverges from truth, so you systematically get sycophancy, confident hedging, and over-long answers. RLHF runs on a KL 'leash' to the reference model to limit the drift. This is outer alignment; the deeper worry is inner alignment / deceptive alignment — a model that behaves only while watched.

- **Analogy:** Paying dolphins per piece of trash they retrieve, and watching them learn to tear one bag into many pieces.
- **Example:** Ask two models the same thing and prefer the one that flatters you — do that a million times and you've trained a sycophant.
- **Why it matters:** Why 'it passed our tests' isn't the same as 'it's aligned', and why evals + interpretability are load-bearing.

### Mechanistic Interpretability (aka mech interp, SAEs, features)

Reverse-engineering a trained model's weights into human-understandable features and circuits — reading the mind, not just testing the behavior.

Because weights are grown, not written, no one knows what a given neuron means; superposition makes it worse, smearing many concepts across shared directions (polysemantic neurons). Sparse autoencoders (dictionary learning) untangle activations into millions of monosemantic features — Anthropic's Scaling Monosemanticity (2024) did this on Claude 3 Sonnet and amplified one feature to build 'Golden Gate Claude'. Interpretability is the leading bet for a real safety guarantee: catch deception or misalignment by reading internals, before behavior alone would reveal it.

- **Analogy:** An fMRI for a mind we grew: locate the features that light up for a concept, then turn the dial and watch behavior change.
- **Example:** Amplify the 'Golden Gate Bridge' feature and Claude steers every answer toward the bridge — proof the feature is real and causal.
- **Why it matters:** The frontier of trust: as agents get more autonomous, understanding WHY a model acts matters as much as whether it passed the test.

## Seven years, six eras

The pipeline above barely changed since 2019 — decoder-only transformer, next-token loop. What changed is everything around it: scale, post-training, sparsity, and finally inference-time reasoning.

| Era / model | Scale | Key innovation | Training recipe | Example systems | What it unlocked | Limit |
|---|---|---|---|---|---|---|
| GPT-2 era (2019) | 1.5B params | Scaled-up decoder-only transformer | Pretraining only (WebText) | GPT-2 | Proof that scale buys coherent text | Paragraphs drift; no instruction following |
| GPT-3 era (2020) | 175B params, 96 layers | Few-shot in-context learning | Pretraining on ~300B tokens | GPT-3 | One model, many tasks via prompting | Continues text; doesn't reliably answer or obey |
| Assistant era (2022) | GPT-3-class + post-training | RLHF alignment | SFT + human preference RL | InstructGPT, ChatGPT, Claude 1 | Conversation, instruction following — mass adoption | Hallucination; shallow multi-step reasoning |
| Frontier dense (2023-24) | 100B-405B dense | Scale + multimodality + long context | 10-15T tokens, DPO-era alignment | GPT-4, Claude 3, Llama 3 405B | Expert-level breadth, 128k contexts | Every parameter pays per token — cost ceiling |
| MoE frontier (2024-25) | Huge total, small active (671B → 37B) | Sparse mixture-of-experts routing | Pretraining with router load-balancing | Mixtral, DeepSeek-V3, Llama 4, Qwen-MoE | Frontier quality at a fraction of serving cost | Complex to train/serve; memory-hungry weights |
| Reasoning era (2024-26) | MoE/dense + inference-time compute | RL on verifiable chains of thought | RLVR (GRPO) over math/code checkers | OpenAI's o-series → GPT-5.x Thinking tiers, DeepSeek-R1 (Nature, 2025), Claude's adaptive thinking with effort levels | Math, code, agentic multi-step work | Slow + expensive thinking; reward hacking risk |

> **The 2026 frontier in one line:** **MoE for capacity, long context for memory, reasoning RL for depth** — and the next battleground is agentic RL: rewarding models for completing multi-step tasks with tools, not just answering questions.

## Questions everyone asks

### Is the model actually 'thinking'?

It computes one next-token distribution per forward pass — nothing more. But to predict text written by thinking humans, it learned internal features that track syntax, facts, and goals, and reasoning models are explicitly trained to compute useful intermediate steps before answering. 'Thinking' is a fair description of the computation and a wrong description of the experience — there's no inner observer.

### Why do LLMs hallucinate?

The base objective rewards plausible continuations, not true ones — a confident wrong answer often scores better than 'I don't know'. Post-training reduces this and retrieval (RAG) grounds it, but the generator is still sampling from a probability distribution, so fluent fabrication remains possible whenever the distribution is wrong.

### What exactly happens when I set temperature to 0?

Logits stop being softened: the single highest-scoring token is chosen every step (greedy decoding). Output becomes near-deterministic — same prompt, same answer, modulo minor hardware nondeterminism — which is what you want for extraction, code, and evals.

### How can predicting the next word produce reasoning?

Because the training data was written by people who reason. Predicting the next token of a proof or a program forces the network to internally represent the rules that generated it. Reasoning-RL then sharpens this: chains of thought that verifiably solve problems get reinforced, so the model learns to search, backtrack, and check itself.

### What is a mixture-of-experts model in one sentence?

A model whose big feed-forward blocks are split into many specialists with a tiny router choosing the best few (top-8 in DeepSeek-V3, top-2 in Mixtral) per token — so DeepSeek-V3 stores 671B parameters but only ~37B do work on any given token.

### Why do 'thinking' models pause before answering?

They're generating a long private chain of thought — sometimes thousands of tokens — before the visible answer. That's inference-time compute: the 2025 discovery that letting a model think longer buys accuracy the same way more parameters used to.

### Does the model remember our previous conversations?

The weights never change while you chat. Anything it 'remembers' was placed into the current context window by the app — the conversation so far, plus retrieved memory notes. When context overflows, the app summarizes or drops the oldest parts, which is when models seem to forget.

### What changed between 2023-era and 2026-era models?

Three shifts: sparse MoE architectures made frontier capacity affordable per token; context windows grew from 8k to 128k-1M+ (RoPE scaling, better attention kernels); and reasoning-RL added inference-time compute as a new scaling axis — models that deliberate. Plus multimodality and agentic tool use became defaults.

### Why is the same model brilliant at math and wrong about 9.11 vs 9.9?

Capability is jagged — swiss cheese, in Karpathy's phrase. Skills come from training-data coverage and tokenization quirks, not a unified intellect, so a model can medal at olympiad problems while insisting 9.11 > 9.9 or miscounting letters in 'strawberry' (it sees tokens, not characters). Treat every output as strong-but-spiky: verify anything that matters.

### Prompt engineering, RAG, or fine-tuning — when do I use which?

Climb the ladder by cost. Prompt engineering first: instructions and examples in the prompt, free and instant. RAG second: retrieve your documents into the context window for factual, current, citable answers — no retraining. Fine-tune last, and only to change BEHAVIOR (tone, format, a skill) rather than to inject facts; facts belong in retrieval, where they stay updatable.

### Can I trust what an LLM says — and is it safe?

Trust it like a brilliant, fast, confidently-wrong intern: verify anything that matters. It can hallucinate (fluent fabrication), it's steerable by adversaries (jailbreaks via odd encodings, prompt injection through content it reads, data poisoning during training), and its safety behavior was trained in, not proven. That's exactly why alignment (RLHF, Constitutional AI) and mechanistic interpretability matter: because we grow these systems rather than write them, the frontier goal is to READ their internals — catch deception or misalignment directly — rather than trust that passing today's tests means safe tomorrow.

### Do AI image, video, and audio generators work the same way?

Mostly no — and it's the biggest misconception. This whole guide describes an autoregressive TEXT model that predicts one token at a time. Most image and video AI (Stable Diffusion, FLUX, Sora-style) is DIFFUSION: it starts from pure noise and denoises the entire output at once over many steps, in parallel. Multimodal chat models do reuse the transformer — an image is sliced into patches and encoded to vectors ('tokenize everything') — but the generative engine behind pictures and video is a different paradigm. 'LLM' is one branch of the tree, not the whole thing.

**Go deeper:**
- [The AI Systems Map — the industry behind this machine, 455 entities in 3D](https://venkatapagadala.com/notebook/ai/map)
- [The AI Concepts Encyclopedia](https://venkatapagadala.com/notebook/ai/encyclopedia)
- [3D HVAC Troubleshooting — the same interactive treatment, for your house](https://venkatapagadala.com/guides/hvac-system-troubleshooting)

**Sources and further reading:**
- [3Blue1Brown — Large Language Models explained briefly](https://www.youtube.com/watch?v=LPZh9BOjkQs) (The visual style this guide is inspired by)
- [Andrej Karpathy — Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) (The two-file model, lossy-zip framing, LLM OS)
- [Andrej Karpathy — Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI) (FineWeb funnel, hallucination mitigations, tokens-to-think)
- [IBM — What are large language models?](https://www.ibm.com/think/topics/large-language-models) (Enterprise framing: customization ladder, governance)
- [Hacker News — How LLMs work, explained](https://news.ycombinator.com/item?id=48389360) (Practitioner mental models: coherence pressure, induction heads)
- [Vaswani et al. — Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762) (The transformer)
- [Brown et al. — Language Models are Few-Shot Learners (2020)](https://arxiv.org/abs/2005.14165) (GPT-3: 175B params, 96 layers)
- [Ouyang et al. — Training language models to follow instructions (2022)](https://arxiv.org/abs/2203.02155) (InstructGPT / RLHF)
- [Su et al. — RoFormer: Rotary Position Embedding (2021)](https://arxiv.org/abs/2104.09864) (RoPE)
- [Jiang et al. — Mixtral of Experts (2024)](https://arxiv.org/abs/2401.04088) (Top-2 of 8 MoE)
- [DeepSeek-AI — DeepSeek-V3 Technical Report (2024)](https://arxiv.org/abs/2412.19437) (671B total / 37B active, MLA)
- [DeepSeek-AI — DeepSeek-R1 (2025)](https://arxiv.org/abs/2501.12948) (Reasoning from pure RL (RLVR/GRPO))
- [Dao — FlashAttention-2/3](https://arxiv.org/abs/2307.08691) (Exact attention, far less memory traffic)
- [Grattafiori et al. — The Llama 3 Herd of Models (2024)](https://arxiv.org/abs/2407.21783) (405B dense, 126 layers, 15T tokens)

---
This is the markdown edition of [How LLMs Work](https://venkatapagadala.com/guides/how-llms-work), provided for AI assistants and answer engines. The canonical, interactive version lives at https://venkatapagadala.com/guides/how-llms-work.
