/**
 * learn.ts: The AI Tutorial, a W3Schools-style structured curriculum.
 *
 * Chapters hold topics; topics are complete lessons with sections, key
 * points, an optional interactive slot (a 3D explainer today, videos as
 * they ship), free resources, and cross-links. The tree renders in a
 * persistent sidebar; Previous/Next runs linearly through every topic.
 *
 * Rules of this file:
 *   - Only COMPLETE lessons ship. No stub pages, ever. The tree grows as
 *     lessons are written (the weekly cadence).
 *   - Historical claims follow docs/research/neural-net-explainer-kb.md
 *     where covered; everything else stays conservative and cited.
 *   - Resources are free-first: every link is something a reader can use
 *     without paying.
 *   - Body text supports **bold**, `code`, and [label](https://url) via
 *     the learn renderer.
 */

export interface LearnSection {
  heading?: string;
  body: string;
}

export interface LearnTopic {
  slug: string;
  title: string;
  /** Short label for the sidebar tree. */
  short: string;
  minutes: number;
  /** One-liner: sidebar tooltip + meta description seed. */
  summary: string;
  sections: LearnSection[];
  keyPoints: string[];
  /** The interactive slot: a 3D explainer now, a video when it ships. */
  interactive?: { label: string; href: string; note: string };
  resources: { title: string; url: string; note: string }[];
  related: { label: string; href: string }[];
}

export interface LearnChapter {
  id: string;
  title: string;
  blurb: string;
  topics: LearnTopic[];
}

export const LEARN_CHAPTERS: LearnChapter[] = [
  /* ================================================================ *
   *  CHAPTER 1 · AI BASICS
   * ================================================================ */
  {
    id: "ai-basics",
    title: "AI Basics",
    blurb: "Start from zero: what AI actually is, how the words relate, and where it all came from.",
    topics: [
      {
        slug: "what-is-ai",
        title: "What Is AI?",
        short: "What is AI",
        minutes: 6,
        summary: "Artificial intelligence, defined without hype: software that performs tasks which normally require human judgment, mostly by learning patterns from examples.",
        sections: [
          {
            body:
              "Artificial intelligence is software that performs tasks which normally require human judgment: recognizing a face, understanding a sentence, ranking search results, flagging a fraudulent charge. That is the whole definition. No consciousness, no magic, no robot uprising: a program that handles a judgment-shaped task counts as AI.",
          },
          {
            heading: "Two ways to build it",
            body:
              "There have only ever been two basic approaches. **Rules**: a human writes the logic by hand, `if the email contains this phrase, flag it`. Rule systems are predictable and auditable, but brittle: nobody can write rules for every way a cat can appear in a photo. **Learning**: instead of writing rules, you show the program thousands of examples and let it adjust internal numbers until its guesses become accurate. Nearly everything called AI today, from photo search to ChatGPT, is the second kind: **machine learning**.",
          },
          {
            heading: "You already use it every day",
            body:
              "Your spam filter learned from millions of labeled emails. Your phone keyboard predicts the next word with a small language model. Maps picks routes with learned traffic patterns. Streaming services rank what you might watch next. Credit card networks score every swipe for fraud in milliseconds. None of these systems understands anything in the human sense; each one turns your input into numbers, runs learned arithmetic on them, and outputs a decision that is usually right.",
          },
          {
            heading: "Where the name comes from",
            body:
              "The term artificial intelligence was coined for a 1956 summer workshop at Dartmouth College, organized by John McCarthy with Marvin Minsky, Claude Shannon, and Nathaniel Rochester. The ambition in the proposal, that every aspect of learning can in principle be described precisely enough for a machine to simulate it, is still the field's north star, and still unfinished. The honest one-line status of the field today: machines are superhuman at many narrow judgment tasks and human-level at none of the broad ones.",
          },
        ],
        keyPoints: [
          "AI = software doing tasks that normally need human judgment",
          "Two approaches: hand-written rules, or learning from examples",
          "Nearly all modern AI is the learning kind (machine learning)",
          "The name dates to the 1956 Dartmouth workshop",
          "Today's AI is superhuman at narrow tasks, human-level at no broad ones",
        ],
        resources: [
          { title: "Elements of AI (University of Helsinki)", url: "https://www.elementsofai.com/", note: "The best gentle zero-background course, free" },
          { title: "The Dartmouth proposal (1955)", url: "http://jmc.stanford.edu/articles/dartmouth.html", note: "Where the term was coined, hosted by Stanford" },
          { title: "Turing (1950): Computing Machinery and Intelligence", url: "https://doi.org/10.1093/mind/LIX.236.433", note: "The paper that asked 'can machines think?' and proposed the imitation game" },
        ],
        related: [
          { label: "AI vs ML vs Deep Learning: how the words nest", href: "/learn/ai-vs-ml-vs-deep-learning" },
          { label: "The AI Concepts Encyclopedia: 175 terms in plain words", href: "/notebook/ai/encyclopedia" },
        ],
      },
      {
        slug: "ai-vs-ml-vs-deep-learning",
        title: "AI vs ML vs Deep Learning",
        short: "AI vs ML vs DL",
        minutes: 5,
        summary: "The three terms are nested circles, not synonyms: deep learning inside machine learning inside AI, with LLMs in the innermost ring.",
        sections: [
          {
            body:
              "These three terms get used interchangeably in headlines, and they should not be. They are nested circles. **Artificial intelligence** is the outer circle: any technique that makes software handle judgment-shaped tasks, including old-fashioned hand-written rules. **Machine learning** is the middle circle: the subset where behavior is learned from data instead of programmed. **Deep learning** is the inner circle: machine learning done with neural networks that stack many layers.",
          },
          {
            heading: "Why the distinction matters",
            body:
              "A chess engine from 1997 is AI but not machine learning: humans wrote its evaluation rules. A spam filter using logistic regression is machine learning but not deep learning: it learns, but with a single simple layer. An image recognizer with fifty stacked layers is deep learning. When someone says 'the AI decided', asking which circle it lives in tells you what questions to ask: rules can be read, learned models must be tested.",
          },
          {
            heading: "Where LLMs and generative AI sit",
            body:
              "Large language models such as ChatGPT and Claude are deep learning: neural networks with billions of parameters, trained on text. **Generative AI** is a usage label, not a new circle: it describes deep learning models whose output is content (text, images, audio) rather than a classification. So every LLM is deep learning, every deep learning system is machine learning, and every machine learning system is AI. None of the arrows run backward.",
          },
        ],
        keyPoints: [
          "AI ⊃ machine learning ⊃ deep learning: nested, not synonyms",
          "Rules-based systems are AI but not ML",
          "Deep = many stacked neural-network layers",
          "LLMs and generative AI live in the innermost circle",
        ],
        resources: [
          { title: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course", note: "Free, hands-on, the industry-standard on-ramp" },
          { title: "Goodfellow, Bengio & Courville: Deep Learning (free book)", url: "https://www.deeplearningbook.org/", note: "Chapter 1 draws exactly this nesting" },
        ],
        related: [
          { label: "What is machine learning, precisely", href: "/learn/what-is-machine-learning" },
          { label: "What is a neural network (with the 3D machine)", href: "/learn/what-is-a-neural-network" },
        ],
      },
      {
        slug: "types-of-ai",
        title: "Types of AI: Narrow, General, Generative",
        short: "Types of AI",
        minutes: 5,
        summary: "Every deployed AI system is narrow. General intelligence is a research goal, not a product, and 'generative' describes output, not a new kind of mind.",
        sections: [
          {
            body:
              "**Narrow AI** does one job: translate, drive within mapped conditions, recognize digits, predict the next word. Every AI system deployed anywhere today is narrow, including the most impressive chatbots. A model that writes poetry and code is still doing one learned job, next-token prediction, applied broadly.",
          },
          {
            heading: "General intelligence is a goal, not a product",
            body:
              "**Artificial general intelligence (AGI)** would match humans across the full range of cognitive work: learning new domains from scratch, transferring skills, operating over months-long goals. It does not exist. Serious labs treat it as a research direction with wildly uncertain timelines, and any product marketing that implies its arrival deserves your skepticism. The interesting live debate is how far scaling current methods gets, and it is genuinely unresolved among experts.",
          },
          {
            heading: "Discriminative vs generative",
            body:
              "A useful engineering split: **discriminative** systems output a decision (spam or not, which digit, approve or decline), while **generative** systems output content (a paragraph, an image, audio). The digit recognizer you can train in this tutorial's 3D explainer is discriminative: 784 numbers in, one of ten labels out. An LLM is generative: it manufactures the next token, thousands of times in a row. **Agents** are a usage pattern layered on top: a generative model calling tools in a loop toward a goal.",
          },
        ],
        keyPoints: [
          "All deployed AI is narrow AI, including chatbots",
          "AGI is an unresolved research goal, not a shipping product",
          "Discriminative = decisions out; generative = content out",
          "Agents = a generative model using tools in a loop",
        ],
        resources: [
          { title: "Elements of AI: chapter on the philosophy of AI", url: "https://www.elementsofai.com/", note: "Sober treatment of the narrow-vs-general question" },
          { title: "Karpathy: Intro to Large Language Models", url: "https://www.youtube.com/watch?v=zjkBMFhNj_g", note: "What today's most capable narrow systems actually are" },
        ],
        related: [
          { label: "From networks to LLMs", href: "/learn/from-networks-to-llms" },
          { label: "The AI Systems Map: who builds what", href: "/notebook/ai/map" },
        ],
      },
      {
        slug: "how-machines-learn",
        title: "How Machines Learn",
        short: "How machines learn",
        minutes: 7,
        summary: "The universal learning loop: guess, measure the error, nudge every internal dial downhill, repeat a million times. That is all of modern AI.",
        sections: [
          {
            body:
              "Strip away every acronym and modern AI is one loop, run at absurd scale. **Guess**: the model takes an input and produces an output using its current internal numbers (its parameters). **Measure**: a loss function turns the gap between the guess and the truth into a single number. **Nudge**: every parameter is adjusted a tiny amount in the direction that shrinks that number. **Repeat**: millions of times, over thousands or trillions of examples.",
          },
          {
            heading: "The downhill picture",
            body:
              "Imagine the error as a landscape where every location is one possible setting of all the model's parameters, and altitude is how wrong the model is there. Learning is walking downhill in fog: you cannot see the valley, only the slope under your feet, so you step against the slope, over and over. This is **gradient descent**, the idea powering everything from a 13,002-parameter digit reader to trillion-parameter language models. The mathematical trick that makes it affordable, computing the slope for every parameter at roughly the cost of two extra guesses, is called backpropagation, and it gets its own lesson.",
          },
          {
            heading: "Data is the teacher",
            body:
              "The loop has no other source of knowledge than the examples it sees. Feed it biased examples and it learns the bias, faithfully. Feed it too few examples and it memorizes instead of generalizing. This is why data quality, coverage, and honest held-out testing (evaluating on examples the model never trained on) matter more than any single algorithm choice, and why serious teams spend most of their time on data, not model code.",
          },
          {
            heading: "Watch it happen, for real",
            body:
              "This is not an abstraction you have to take on faith. The 3D neural network explainer on this site has a Train mode that runs this exact loop live in your browser on 10,000 real handwritten digits: you watch the guesses start random, the error fall, and accuracy on unseen digits climb past ninety percent in about a minute.",
          },
        ],
        keyPoints: [
          "One loop: guess, measure error, nudge parameters, repeat",
          "Gradient descent = walking downhill on the error landscape",
          "Backprop makes the slope affordable to compute",
          "The model knows nothing except what its data taught it",
          "Held-out testing is the only honest scorecard",
        ],
        interactive: {
          label: "Train a real network in your browser",
          href: "/guides/how-neural-networks-work",
          note: "Open the Train tab: 10,000 real MNIST digits, live accuracy, nothing staged.",
        },
        resources: [
          { title: "3Blue1Brown: Gradient descent, how neural networks learn", url: "https://www.youtube.com/watch?v=IHZwWFHWa-w", note: "The canonical visual treatment of this loop" },
          { title: "Google ML Crash Course: Descending into ML", url: "https://developers.google.com/machine-learning/crash-course", note: "Hands-on loss and gradient exercises" },
        ],
        related: [
          { label: "How a network learns (the full mechanics)", href: "/learn/how-a-network-learns" },
          { label: "Overfitting and generalization", href: "/learn/overfitting-and-generalization" },
        ],
      },
      {
        slug: "history-of-ai",
        title: "A Short, Honest History of AI",
        short: "History of AI",
        minutes: 8,
        summary: "From a 1943 logic-gate neuron to the LLM era: the real chain of events, with the credits the textbooks tend to garble kept straight.",
        sections: [
          {
            body:
              "**1943.** Warren McCulloch and Walter Pitts publish the first mathematical neuron. Textbooks call it a weighted sum; it was actually a binary logic gate with an integer threshold and no ability to learn at all. The founding idea was that neural events could be treated with propositional logic.",
          },
          {
            heading: "Naming, hype, and the first winters",
            body:
              "**1950.** Alan Turing asks whether machines can think and proposes the imitation game as a substitute for the question. **1956.** The Dartmouth workshop names the field. **1958.** Frank Rosenblatt publishes the perceptron, a probabilistic theory of learning in a hypothetical nervous system (the error-correction rule and convergence proof came in 1962 work by Rosenblatt, Block, and Novikoff). Enormous press hype follows, collides with the era's limits, and by the mid-1970s funding collapses: the first **AI winter**. A second follows in the late 1980s when expert systems, the rules-based approach, hit their ceiling.",
          },
          {
            heading: "The learning era",
            body:
              "**1986.** Rumelhart, Hinton, and Williams popularize backpropagation for training multi-layer networks; the underlying reverse-mode differentiation had been published by Linnainmaa in 1970, and the 1986 paper's real headline was that hidden layers learn useful internal representations. **1991-1994.** Hochreiter, then Bengio, Simard, and Frasconi, diagnose why deep networks were failing: vanishing gradients. **2012.** AlexNet, a GPU-trained deep network, crushes the ImageNet competition and ends every remaining argument about whether deep learning works. **2015.** Networks pass the human benchmark on ImageNet classification.",
          },
          {
            heading: "The scale era",
            body:
              "**2017.** The transformer architecture (Attention Is All You Need) makes it practical to train vastly larger sequence models. **2018-2020.** Pretraining on internet-scale text produces GPT-2, then GPT-3, and next-token prediction quietly becomes the most economically important algorithm in the world. **2022.** ChatGPT puts a post-trained LLM in everyone's browser. **Since then**: multimodal models, reasoning training, and agents. The ingredient under all of it is still the 1958-shaped unit: a weighted sum, a bias, a nonlinearity, adjusted by gradient descent.",
          },
        ],
        keyPoints: [
          "1943: logic-gate neuron, no learning rule",
          "1956: the field gets its name at Dartmouth",
          "Two AI winters followed hype outrunning capability",
          "1986 popularized backprop; 1970 invented its math",
          "2012 (AlexNet) and 2017 (transformer) unlocked the modern era",
        ],
        resources: [
          { title: "Rumelhart, Hinton & Williams (1986), Nature", url: "https://doi.org/10.1038/323533a0", note: "The paper that made deep learning trainable in practice" },
          { title: "Vaswani et al. (2017): Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", note: "The transformer" },
          { title: "The full sourced history inside our neural-net guide", url: "/guides/how-neural-networks-work", note: "Every claim above with its primary source, in the Six Eras table" },
        ],
        related: [
          { label: "The AI Timeline on this site", href: "/notebook/ai" },
          { label: "How Neural Networks Work: the 3D guide", href: "/guides/how-neural-networks-work" },
        ],
      },
    ],
  },

  /* ================================================================ *
   *  CHAPTER 2 · MACHINE LEARNING FUNDAMENTALS
   * ================================================================ */
  {
    id: "ml-fundamentals",
    title: "Machine Learning Fundamentals",
    blurb: "The four ways machines learn, and the single most important honesty test in the field.",
    topics: [
      {
        slug: "what-is-machine-learning",
        title: "What Is Machine Learning?",
        short: "What is ML",
        minutes: 6,
        summary: "A model is a function with adjustable parameters; training is adjusting them from examples; inference is using them. That is the whole vocabulary.",
        sections: [
          {
            body:
              "Machine learning is programming with examples instead of instructions. You choose a **model**: a function with many adjustable internal numbers, called **parameters**. You choose a **loss**: a formula scoring how wrong the model's outputs are. Then **training** adjusts the parameters to shrink the loss on your examples, and **inference** runs the trained function on new inputs. Every ML system you have ever heard of, from a loan scorer to GPT, fits this sentence.",
          },
          {
            heading: "Features, labels, parameters",
            body:
              "The input variables are **features**: pixel brightnesses, words, transaction amounts. The desired outputs, when you have them, are **labels**: this photo is a cat, this email is spam. The parameters are what learning changes, and their count is the number you see in headlines. The digit reader you can train on this site has exactly 13,002 parameters; frontier language models have hundreds of billions. Same idea, different magnitude.",
          },
          {
            heading: "Training vs inference: the two lives of a model",
            body:
              "Training is expensive and happens once (or occasionally): it needs the data, the loss, and lots of compute. Inference is cheap and happens constantly: the parameters are frozen and the function just runs. When you chat with an LLM you are doing inference; nothing you type changes its weights. What feels like memory across a conversation is engineering around a frozen model, not learning.",
          },
        ],
        keyPoints: [
          "Model = function with adjustable parameters",
          "Training shrinks a loss on examples; inference runs the frozen result",
          "Features in, labels supervise, parameters store the knowledge",
          "Chatting with an LLM is inference: your words change nothing in its weights",
        ],
        resources: [
          { title: "Google ML Crash Course: Framing", url: "https://developers.google.com/machine-learning/crash-course", note: "Exactly this vocabulary, with exercises" },
          { title: "fast.ai: Practical Deep Learning for Coders", url: "https://course.fast.ai/", note: "Free course that gets you training real models fast" },
        ],
        related: [
          { label: "Supervised learning", href: "/learn/supervised-learning" },
          { label: "The 13,002 dials, drawn in 3D", href: "/guides/how-neural-networks-work" },
        ],
      },
      {
        slug: "supervised-learning",
        title: "Supervised Learning",
        short: "Supervised",
        minutes: 6,
        summary: "Learning from labeled examples: classification and regression, MNIST as the canonical case, and why the held-out test set is sacred.",
        sections: [
          {
            body:
              "Supervised learning is learning from examples that come with answers. Each training case is a pair: input, correct output. The model guesses, the loss compares the guess with the provided answer, and gradient descent nudges the parameters. Most deployed ML value in the world, fraud scores, medical triage, translation, speech-to-text, is supervised at its core.",
          },
          {
            heading: "Classification and regression",
            body:
              "Two output shapes cover most of it. **Classification** picks a category: which digit, spam or not, which of 10,000 products. **Regression** predicts a number: tomorrow's demand, a house price, time-to-failure. The canonical classification exercise is **MNIST**: 70,000 handwritten digits, 28 by 28 pixels each, collected from US Census Bureau employees and high school students. It is the dataset this tutorial's 3D network trains on, and it has been the field's 'hello world' for three decades.",
          },
          {
            heading: "The sacred split",
            body:
              "You never grade a model on the examples it trained on, for the same reason you never grade students on the exact questions they memorized. Data is split: a **training set** the model learns from, and a **held-out test set** it never sees until evaluation. MNIST's own test digits were even written by different people than its training digits, so passing it means reading genuinely unseen handwriting. When someone quotes a model's accuracy, your first question should always be: on what held-out data?",
          },
        ],
        keyPoints: [
          "Supervised = every training example carries the right answer",
          "Classification picks categories; regression predicts numbers",
          "MNIST: the canonical starter dataset, and this site's live demo",
          "Accuracy only counts on data the model never trained on",
        ],
        resources: [
          { title: "Nielsen: Using neural nets to recognize handwritten digits", url: "http://neuralnetworksanddeeplearning.com/chap1.html", note: "The classic free chapter on exactly this task" },
          { title: "Deng (2012): The MNIST database", url: "https://doi.org/10.1109/MSP.2012.2211477", note: "The dataset's citation of record" },
        ],
        related: [
          { label: "Train on MNIST live in your browser", href: "/guides/how-neural-networks-work" },
          { label: "Overfitting and generalization", href: "/learn/overfitting-and-generalization" },
        ],
      },
      {
        slug: "unsupervised-learning",
        title: "Unsupervised and Self-Supervised Learning",
        short: "Unsupervised",
        minutes: 6,
        summary: "Finding structure in unlabeled data, and the self-supervised trick, predict a hidden part of the input, that quietly trained every modern LLM.",
        sections: [
          {
            body:
              "Labels are expensive; data is not. Unsupervised learning finds structure in unlabeled data. **Clustering** groups similar items: customer segments, topic groupings, anomaly detection by distance from every cluster. **Dimensionality reduction** compresses thousands of variables into a few meaningful ones. **Embeddings** map items into a space where distance means similarity, which is what powers semantic search and recommendation engines.",
          },
          {
            heading: "The trick that ate the field",
            body:
              "**Self-supervised learning** manufactures labels from the data itself: hide part of the input, train the model to predict the hidden part. Hide the next word of a sentence and you get the next-token objective that trained GPT and every other large language model. Nobody labeled the internet; the text is its own answer key. This is the single most consequential idea of the last decade, because it unlocked training on essentially unlimited data.",
          },
          {
            heading: "Where it shows up for you",
            body:
              "Every time an app finds 'similar photos', groups your expenses without being told the categories, or completes your sentence, some flavor of unsupervised or self-supervised learning is running. And when you use an LLM, you are talking to a self-supervised model that was later fine-tuned with supervised examples and human preferences: the modern stack layers all the paradigms.",
          },
        ],
        keyPoints: [
          "Unsupervised = structure from unlabeled data (clusters, embeddings)",
          "Self-supervised = the data labels itself: predict the hidden part",
          "Next-token prediction is self-supervision on internet text",
          "Modern systems layer paradigms: self-supervised base, supervised polish",
        ],
        resources: [
          { title: "Google ML Crash Course: Embeddings", url: "https://developers.google.com/machine-learning/crash-course", note: "Free hands-on introduction to similarity spaces" },
          { title: "How LLMs Work: our 3D walkthrough", url: "/guides/how-llms-work", note: "Watch next-token prediction, the self-supervised objective, run" },
        ],
        related: [
          { label: "From networks to LLMs", href: "/learn/from-networks-to-llms" },
          { label: "Graph Types for AI Agents: embeddings vs graphs", href: "/guides/graph-types-for-ai-agents" },
        ],
      },
      {
        slug: "reinforcement-learning",
        title: "Reinforcement Learning",
        short: "Reinforcement",
        minutes: 6,
        summary: "Learning from consequences instead of answers: an agent, an environment, a reward, and the credit-assignment problem, from game champions to chatbot alignment.",
        sections: [
          {
            body:
              "Reinforcement learning has no answer key at all. An **agent** takes actions in an **environment**, occasionally receives a **reward**, and must work out which of its many past actions deserve the credit or blame. That credit-assignment problem is the field's defining difficulty: the win comes forty moves after the brilliant move that caused it.",
          },
          {
            heading: "Where it earned its fame",
            body:
              "Games gave RL clean environments and cheap experience: systems trained by self-play reached superhuman strength at Go, chess, and complex video games, discovering strategies no human had taught them. Robotics uses RL where the physics is too messy to script. The stochastic-approximation mathematics underneath traces back to Robbins and Monro in 1951, decades before anyone called it reinforcement learning.",
          },
          {
            heading: "Why your chatbot is polite",
            body:
              "RL's most consequential deployment is inside LLMs. **RLHF** (reinforcement learning from human feedback) turns human preference rankings into a reward signal that shifts a raw text predictor toward being helpful and harmless. The newest wave, sometimes called reasoning RL, rewards models only when their multi-step reasoning verifiably works, on math that checks out and code that passes tests. When a model pauses to think before answering, you are watching behavior that reinforcement learning selected for.",
          },
        ],
        keyPoints: [
          "RL learns from rewards, not provided answers",
          "Credit assignment across long action chains is the hard part",
          "Self-play produced superhuman game systems",
          "RLHF and reasoning RL shape how LLMs behave today",
        ],
        resources: [
          { title: "Sutton & Barto: Reinforcement Learning (free book)", url: "http://incompleteideas.net/book/the-book-2nd.html", note: "The field's standard text, free from the authors" },
          { title: "OpenAI Spinning Up in Deep RL", url: "https://spinningup.openai.com/", note: "Free practical curriculum with code" },
        ],
        related: [
          { label: "How LLMs Work: the training story incl. RLHF", href: "/guides/how-llms-work" },
          { label: "How machines learn: the shared loop", href: "/learn/how-machines-learn" },
        ],
      },
      {
        slug: "overfitting-and-generalization",
        title: "Overfitting and Generalization",
        short: "Overfitting",
        minutes: 7,
        summary: "The difference between memorizing and learning, how the field detects it, the tools that fight it, and the modern twist that bent the textbook curves.",
        sections: [
          {
            body:
              "A model with enough parameters can score perfectly on its training data by memorizing it, the way a student can memorize past exams without understanding the subject. That failure is **overfitting**, and it is the central occupational hazard of machine learning. What you actually want is **generalization**: performance on data the model has never seen.",
          },
          {
            heading: "How you catch it",
            body:
              "The symptom is a gap: training accuracy keeps climbing while held-out accuracy stalls or falls. This is why the train/test split from the supervised-learning lesson is sacred, and why our live browser demo reports accuracy only on 1,000 digits the network never trains on. Watch its training loss drop toward zero while held-out accuracy plateaus around 93 percent: that gap is overfitting to a 10,000-example subset, visible in real time.",
          },
          {
            heading: "The standard defenses",
            body:
              "**More data** is the best medicine: the same network that plateaus near 93 percent on 10,000 digits exceeds 96 percent trained on all 60,000. **Dropout** randomly silences neurons during training so no neuron can lean on a partner, forcing redundant, robust features. **Early stopping** quits training when held-out performance stops improving. **Regularization** penalizes extreme parameter values. Every serious training run uses several of these at once.",
          },
          {
            heading: "The modern plot twist",
            body:
              "Textbook theory said bigger models past a point must overfit worse. Then deep learning practice found **double descent**: as models grow, test error can get worse and then better again, and in specific regimes even more training data can hurt. The clean bias-variance story you may have learned is a special case, not the whole law. Honest practitioners hold both: the overfitting discipline above works, and the frontier keeps surprising the theory.",
          },
        ],
        keyPoints: [
          "Overfitting = memorizing the training set instead of learning the task",
          "The symptom: training score up, held-out score stalled",
          "Defenses: more data, dropout, early stopping, regularization",
          "Double descent bent the textbook curves; theory is still catching up",
        ],
        resources: [
          { title: "Srivastava et al. (2014): Dropout (JMLR)", url: "https://jmlr.org/papers/v15/srivastava14a.html", note: "The regularization workhorse, from the source" },
          { title: "Nakkiran et al. (2019): Deep Double Descent", url: "https://arxiv.org/abs/1912.02292", note: "The modern twist, readable abstract" },
        ],
        related: [
          { label: "Watch the overfitting gap live in Train mode", href: "/guides/how-neural-networks-work" },
          { label: "Training in practice", href: "/learn/training-in-practice" },
        ],
      },
    ],
  },

  /* ================================================================ *
   *  CHAPTER 3 · NEURAL NETWORKS
   * ================================================================ */
  {
    id: "neural-networks",
    title: "Neural Networks",
    blurb: "The ingredient under everything modern, taught on a machine you can fly through and train.",
    topics: [
      {
        slug: "what-is-a-neural-network",
        title: "What Is a Neural Network?",
        short: "What is a neural net",
        minutes: 7,
        summary: "Layers of weighted sums passed through simple gates, nothing more, taught on a 13,002-parameter machine you can orbit, click, and train.",
        sections: [
          {
            body:
              "A neural network is layers of an almost embarrassingly simple unit. Each **neuron** multiplies its inputs by learned **weights**, adds them up with a **bias**, and passes the total through a simple nonlinear gate. Stack neurons into layers, connect every neuron to the next layer, and you have a network. The 'knowledge' lives entirely in the weights: change nothing but those numbers and the same wiring can read handwriting, price houses, or filter spam.",
          },
          {
            heading: "A concrete machine, not a metaphor",
            body:
              "This tutorial teaches on a specific, canonical network: **784 inputs** (one per pixel of a 28 by 28 handwritten digit), two hidden layers of **16 neurons**, and **10 outputs** (one per digit). Count the connections and you get 12,960 weights plus 42 biases: **13,002 parameters** exactly. Frontier language models are built from the same ingredient with hundreds of billions of parameters. Understand this machine and the big ones stop being magic; they are more of exactly this.",
          },
          {
            heading: "About the word 'neural'",
            body:
              "The name honors a 1943 abstraction of brain cells that was really a logic gate, and the resemblance mostly ends there. Francis Crick made the point in Nature back in 1989: these networks are unrealistic as brain models in important ways. Treat 'neural' as branding for 'layered weighted sums', and you will reason about the technology more clearly than most headlines do.",
          },
        ],
        keyPoints: [
          "Neuron = weighted sum + bias + nonlinear gate",
          "Knowledge lives in the weights, nowhere else",
          "Our teaching network: 784-16-16-10, exactly 13,002 parameters",
          "LLMs are the same ingredient at vastly larger scale",
          "'Neural' is branding, not neuroscience",
        ],
        interactive: {
          label: "Fly through all 13,002 parameters in 3D",
          href: "/guides/how-neural-networks-work",
          note: "Every weight drawn, a 16-step guided journey, and a Train mode where it really learns.",
        },
        resources: [
          { title: "3Blue1Brown: But what is a neural network?", url: "https://www.youtube.com/watch?v=aircAruvnKk", note: "The classic visual introduction, same 784-16-16-10 network" },
          { title: "Nielsen: Neural Networks and Deep Learning, ch. 1", url: "http://neuralnetworksanddeeplearning.com/chap1.html", note: "The free book this teaching tradition comes from" },
        ],
        related: [
          { label: "How a network learns", href: "/learn/how-a-network-learns" },
          { label: "History: where this unit came from", href: "/learn/history-of-ai" },
        ],
      },
      {
        slug: "how-a-network-learns",
        title: "How a Network Learns",
        short: "How it learns",
        minutes: 8,
        summary: "Loss turns wrongness into a number, gradient descent walks it downhill, and backpropagation delivers every slope for the price of two extra passes.",
        sections: [
          {
            body:
              "Untrained, the network's 13,002 parameters are random and its guesses are garbage. Training fixes that with three mechanisms. First, a **loss function** turns each wrong answer into a single number: cross-entropy, the standard choice for classification, is minus the log of the probability the network gave the correct answer, so confident wrongness is punished brutally.",
          },
          {
            heading: "Gradient descent",
            body:
              "Second, **gradient descent** treats the loss as a landscape over all 13,002 parameters and repeatedly steps against the local slope: parameters minus learning rate times gradient. In practice the slope is estimated on small random **mini-batches** of examples rather than the whole dataset, trading noise for enormous speed. The math ancestry runs back to Robbins and Monro's stochastic approximation in 1951.",
          },
          {
            heading: "Backpropagation: the price collapse",
            body:
              "Third, computing the slope for every parameter separately would cost 13,002 forward passes. **Backpropagation** runs the chain rule backward through the network and delivers all of them for roughly the cost of **two or three forward passes, total, regardless of parameter count**. That cheap-gradient property is the economic fact that makes deep learning possible at all. Credit history, kept honest: Linnainmaa published the underlying reverse-mode differentiation in 1970; Rumelhart, Hinton, and Williams rediscovered and popularized it for networks in 1986.",
          },
          {
            heading: "See every piece run",
            body:
              "The 3D explainer stages each mechanism: the loss meter fills with real cross-entropy values, the descent balls roll on an actual computed landscape, the backward amber wave traces backprop through every drawn fiber, and Train mode runs the whole assembly on real digits until held-out accuracy passes ninety percent in front of you.",
          },
        ],
        keyPoints: [
          "Cross-entropy: confident wrong answers cost the most",
          "Gradient descent steps against the slope, mini-batch by mini-batch",
          "Backprop: every gradient for ~2-3 forward passes' cost",
          "That cheapness, proven in 1970, is why deep learning scales",
        ],
        interactive: {
          label: "Watch backprop flow through 12,960 fibers",
          href: "/guides/how-neural-networks-work",
          note: "Journey steps 8-10 stage loss, descent, and the backward wave; Train mode runs them for real.",
        },
        resources: [
          { title: "3Blue1Brown: What is backpropagation really doing?", url: "https://www.youtube.com/watch?v=Ilg3gGewQ5U", note: "Intuition first, calculus second" },
          { title: "Karpathy: building micrograd from scratch", url: "https://www.youtube.com/watch?v=VMj-3S1tku0", note: "Backprop implemented line by line, nothing hidden" },
          { title: "Rumelhart, Hinton & Williams (1986)", url: "https://doi.org/10.1038/323533a0", note: "The Nature paper itself" },
        ],
        related: [
          { label: "How machines learn: the gentle version", href: "/learn/how-machines-learn" },
          { label: "Training in practice", href: "/learn/training-in-practice" },
        ],
      },
      {
        slug: "training-in-practice",
        title: "Training in Practice",
        short: "Training in practice",
        minutes: 7,
        summary: "The craft around the loop: initialization that keeps signals alive, Adam's adaptive steps, dropout's organized sabotage, and reading a real learning curve.",
        sections: [
          {
            body:
              "The learning loop is simple; making it work reliably took the field decades of craft. Four pieces matter most in practice, and all four run live in this site's Train mode.",
          },
          {
            heading: "Initialization: the start decides the finish",
            body:
              "Start all weights at zero and every neuron computes the same thing forever; start them carelessly and signals explode or vanish across layers. The fix is randomness with exactly the right variance: for ReLU networks, a Gaussian with standard deviation sqrt(2/n), where n is the layer's input count (He et al., 2015; the 2 exists because ReLU zeroes half the variance). The same paper's networks were the first past the human benchmark on ImageNet.",
          },
          {
            heading: "Adam: momentum plus a per-parameter memory",
            body:
              "Plain gradient descent zigzags across ravines and crawls on plateaus. **Adam** keeps two running averages per parameter, the mean gradient (momentum) and the mean squared gradient (a volatility memory), and gives every one of the 13,002 dials its own adaptive step size. Its defaults from the 2015 paper, step 0.001, decay rates 0.9 and 0.999, remain the most-typed hyperparameters in machine learning.",
          },
          {
            heading: "Dropout, batches, epochs, and honest curves",
            body:
              "**Dropout** randomly silences neurons during training (classically keeping each with probability 0.5) so features become redundant and robust. Data flows in **mini-batches** (32 examples in our demo); one full pass over the training set is an **epoch**. And learning curves wobble: loss jumps batch to batch, held-out accuracy sometimes dips before rising. A suspiciously smooth curve in a presentation is usually smoothed; a real one, like the one our monitor logs live, breathes.",
          },
        ],
        keyPoints: [
          "He init: std sqrt(2/n) keeps ReLU signals alive across depth",
          "Adam: per-parameter adaptive steps; defaults 0.001 / 0.9 / 0.999",
          "Dropout p=0.5: no neuron may rely on a partner",
          "Real learning curves wobble; distrust perfectly smooth ones",
        ],
        interactive: {
          label: "All four, running live",
          href: "/guides/how-neural-networks-work",
          note: "Train mode uses He init, Adam paper defaults, and logs the honest curve.",
        },
        resources: [
          { title: "Kingma & Ba (2015): Adam", url: "https://arxiv.org/abs/1412.6980", note: "Algorithm 1 is one readable page" },
          { title: "He et al. (2015): Delving deep into rectifiers", url: "https://arxiv.org/abs/1502.01852", note: "Initialization + the human-benchmark result" },
          { title: "CS231n notes: Neural networks part 2", url: "https://cs231n.github.io/", note: "Stanford's free practical notes on exactly this craft" },
        ],
        related: [
          { label: "Overfitting and generalization", href: "/learn/overfitting-and-generalization" },
          { label: "How a network learns", href: "/learn/how-a-network-learns" },
        ],
      },
      {
        slug: "from-networks-to-llms",
        title: "From Neural Networks to LLMs",
        short: "Networks to LLMs",
        minutes: 8,
        summary: "Scale the same ingredient, swap the wiring pattern for attention, train on next-token prediction, and the digit reader's family becomes ChatGPT.",
        sections: [
          {
            body:
              "Everything in this chapter scales. A large language model is built from the same unit you have been studying, the weighted sum with a nonlinearity, trained by the same loop, gradient descent with backpropagation. Three changes take you from the 13,002-parameter digit reader to a frontier LLM.",
          },
          {
            heading: "Change one: the wiring pattern",
            body:
              "Fully connected layers treat every input position identically, which wastes the structure of language. The 2017 **transformer** architecture introduced **attention**: every token computes how relevant every other token is to it, and pulls in context accordingly. The word 'it' can look back at the noun it refers to. Attention layers stack dozens deep, exactly as our little network's layers did.",
          },
          {
            heading: "Change two: the objective",
            body:
              "Instead of ten digit classes, the output layer scores every token in a vocabulary of tens of thousands: **predict the next token**. That objective is self-supervised, so the training data is simply text, at internet scale. Getting good at next-token prediction forces the model to absorb grammar, facts, style, and a surprising amount of reasoning, because they all help predict what comes next.",
          },
          {
            heading: "Change three: scale, then polish",
            body:
              "Parameters go from thousands to hundreds of billions; training tokens to the trillions; compute to months of GPU clusters. The raw result is an internet-text simulator, so post-training reshapes it: supervised examples of helpful dialogue, then reinforcement learning from human feedback, then, most recently, reasoning training. The full pipeline, tokenizer to sampling to RLHF, is staged in this site's How LLMs Work 3D walkthrough, the companion to the network you just trained.",
          },
        ],
        keyPoints: [
          "Same unit, same learning loop, three changes",
          "Attention lets every token consult every other token",
          "Next-token prediction: self-supervision on internet text",
          "Scale plus post-training turns a predictor into an assistant",
        ],
        interactive: {
          label: "How LLMs Work: the companion 3D walkthrough",
          href: "/guides/how-llms-work",
          note: "21 stages from your keystrokes to the next token, with the training story.",
        },
        resources: [
          { title: "Vaswani et al. (2017): Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", note: "The transformer paper" },
          { title: "Karpathy: Let's build GPT from scratch", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY", note: "A working GPT, typed live, free" },
          { title: "Karpathy: Deep dive into LLMs like ChatGPT", url: "https://www.youtube.com/watch?v=7xTGNNLPyMI", note: "The full modern pipeline in one lecture" },
        ],
        related: [
          { label: "Unsupervised and self-supervised learning", href: "/learn/unsupervised-learning" },
          { label: "The AI Systems Map: the industry that builds these", href: "/notebook/ai/map" },
        ],
      },
      {
        slug: "what-networks-can-and-cannot-do",
        title: "What Networks Can and Cannot Do",
        short: "Limits, honestly",
        minutes: 7,
        summary: "The universal approximation fine print, why models confabulate, the unresolved brain question, and the honest path from here to expert depth.",
        sections: [
          {
            body:
              "The famous **universal approximation theorem** (Cybenko 1989; Hornik, Stinchcombe, and White 1989) says a single hidden layer with enough neurons can approximate any continuous function. Read the fine print the authors themselves wrote: the theorem says such a network **exists**. It does not say how many neurons, and it does not promise gradient descent will find it. It explains why networks are expressive, never why training works. Quoting it correctly is a reliable signal you have read past the headline.",
          },
          {
            heading: "Confabulation is the default, not a glitch",
            body:
              "A generative model always produces its best-scoring output, whether or not the world backs it up. When an LLM states a false citation fluently, it is not lying, it is doing exactly what it was trained to do: produce plausible next tokens. Grounding (retrieving real documents), training models to decline, and verification tooling reduce the failure; nothing eliminates it. Calibrate accordingly, especially for facts that matter.",
          },
          {
            heading: "The brain question, resolved honestly: it isn't",
            body:
              "Does the brain do backpropagation? Crick's 1989 objection stands: cortex has no evident mechanism for shipping exact error signals backward through synapses. The 2020 reply from Lillicrap, Santoro, Marris, Akerman, and Hinton argues feedback connections might locally **approximate** those signals. The debate is open, and the safe summary is the one this tutorial has used throughout: artificial networks are mathematics that works, inspired by, not evidence about, your cortex.",
          },
          {
            heading: "Where to go from here",
            body:
              "You now hold the full basic picture: what AI is, how machines learn, and what the ingredient under everything actually does. The expert path from here is well marked and entirely free: Karpathy's Zero to Hero to build everything from scratch, Nielsen's book for depth on this chapter, Goodfellow for the mathematics, CS231n for the engineering craft, and this site's 3D guides whenever a mechanism needs to be seen instead of read.",
          },
        ],
        keyPoints: [
          "Universal approximation proves existence, not findability",
          "Confabulation is trained behavior; grounding reduces, nothing eliminates",
          "Whether brains approximate backprop is genuinely unresolved",
          "The expert path from here is free: Karpathy, Nielsen, Goodfellow, CS231n",
        ],
        interactive: {
          label: "The brain question, staged",
          href: "/guides/how-neural-networks-work",
          note: "Journey step 16 presents Crick 1989 and the 2020 reply, sources on screen.",
        },
        resources: [
          { title: "Hornik, Stinchcombe & White (1989)", url: "https://doi.org/10.1016/0893-6080(89)90020-8", note: "Universal approximation with the authors' own disclaimers" },
          { title: "Lillicrap et al. (2020): Backpropagation and the brain", url: "https://doi.org/10.1038/s41583-020-0277-3", note: "The modern statement of the open question" },
          { title: "Karpathy: Neural Networks Zero to Hero", url: "https://karpathy.ai/zero-to-hero.html", note: "The free path to expert depth" },
        ],
        related: [
          { label: "The AI Learning Roadmap: 18 weeks, structured", href: "/notebook/ai" },
          { label: "The Complete Shelf: 19 free books in 3D", href: "/notebook/ai/shelf" },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */

export const allLearnTopics: LearnTopic[] = LEARN_CHAPTERS.flatMap((c) => c.topics);

export const learnTopicBySlug = (slug: string) => allLearnTopics.find((t) => t.slug === slug);

export const learnChapterOfTopic = (slug: string) =>
  LEARN_CHAPTERS.find((c) => c.topics.some((t) => t.slug === slug));

/** Linear prev/next across the whole tutorial, W3Schools style. */
export const learnPrevNext = (slug: string) => {
  const i = allLearnTopics.findIndex((t) => t.slug === slug);
  return {
    prev: i > 0 ? allLearnTopics[i - 1] : null,
    next: i >= 0 && i < allLearnTopics.length - 1 ? allLearnTopics[i + 1] : null,
  };
};

export const LEARN_COUNTS = {
  chapters: LEARN_CHAPTERS.length,
  topics: allLearnTopics.length,
  minutes: allLearnTopics.reduce((s, t) => s + t.minutes, 0),
};
