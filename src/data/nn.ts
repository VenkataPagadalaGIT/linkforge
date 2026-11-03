/**
 * nn.ts: the "How a Neural Network Works" guide's single source of truth.
 *
 * Every number and every historical claim in this file traces to
 * docs/research/neural-net-explainer-kb.md, a two-round, adversarially
 * verified knowledge base built from primary sources only (original papers,
 * publisher pages, PubMed, the authors' own hosted PDFs). Nothing here is
 * from memory. If a fact needs to change, change the KB first.
 *
 * The demo network is the canonical MNIST teaching network: 784-16-16-10.
 * Its parameter count is computed, not quoted: 12,544 + 256 + 160 weights
 * plus 42 biases = 13,002 parameters exactly.
 */

export type NnAct = "machine" | "forward" | "learning" | "learned";

export interface NnActMeta {
  id: NnAct;
  label: string;
  color: string;
  blurb: string;
}

export const NN_ACTS: Record<NnAct, NnActMeta> = {
  machine: {
    id: "machine",
    label: "Act I: The machine at rest",
    color: "#38bdf8",
    blurb:
      "A handwritten digit becomes 784 numbers, and those numbers meet a lattice of 13,002 adjustable dials. Nothing has been learned yet: this is pure structure.",
  },
  forward: {
    id: "forward",
    label: "Act II: A thought moves forward",
    color: "#a78bfa",
    blurb:
      "One forward pass: multiply, add, gate, repeat. At the far end, ten raw scores become ten probabilities and the network commits to a guess.",
  },
  learning: {
    id: "learning",
    label: "Act III: Learning",
    color: "#fbbf24",
    blurb:
      "The wrong guess becomes a number, the number becomes a slope, and the error flows backward through every weight. Sixty thousand examples, again and again.",
  },
  learned: {
    id: "learned",
    label: "Act IV: What it learned, and what it is not",
    color: "#34d399",
    blurb:
      "Why starting values matter, why forgetting on purpose helps, what the layers actually detect, and the honest answer to the brain question.",
  },
};

export interface NnStage {
  id: string;
  name: string;
  /** Short label drawn in the 3D scene. */
  short: string;
  act: NnAct;
  tagline: string;
  /** Plain-English story: what actually happens here. */
  story: string;
  /** The precise technical mechanism. */
  tech: string;
  /** A physical-world analogy. */
  analogy: string;
  /** Real, source-verified figures. */
  numbers: { label: string; value: string }[];
  /** The primary source behind this stage, verified in the KB. */
  paper?: string;
}

export const NN_STAGES: NnStage[] = [
  /* ---------------- ACT I : THE MACHINE ---------------- */
  {
    id: "pixels",
    name: "A Digit Becomes Numbers",
    short: "784 pixels",
    act: "machine",
    tagline: "The network never sees a five. It sees 784 brightness values.",
    story:
      "Start with one handwritten digit from MNIST, the dataset this network learns from: 28 by 28 pixels, grayscale. Unroll the grid into a single column of 784 numbers between 0 (black) and 1 (white). That column is the entire input. No shapes, no strokes, no idea of 'five': just 784 brightnesses in a fixed order.",
    tech:
      "MNIST holds 60,000 training images written by about 250 people, half US Census Bureau employees and half high school students, plus 10,000 test images written by a different 250 people, so the test really is unseen handwriting. Each 28x28 image flattens to a 784-dimensional vector. Pixel values are scaled to [0, 1] before entering the network.",
    analogy:
      "A player piano roll: the song exists only as hole positions. The machine reads holes, not music.",
    numbers: [
      { label: "Image size", value: "28 x 28 = 784 pixels" },
      { label: "Training set", value: "60,000 images" },
      { label: "Test set", value: "10,000 images" },
      { label: "Training-set writers", value: "~250 people" },
      { label: "Test-set writers", value: "a different ~250 people" },
    ],
    paper:
      "MNIST as described in Nielsen, Neural Networks and Deep Learning, chapter 1 (the official dataset description).",
  },
  {
    id: "layers",
    name: "The Shape of the Machine",
    short: "784-16-16-10",
    act: "machine",
    tagline: "Four columns of neurons, connected left to right.",
    story:
      "The classic teaching network: 784 input values, two hidden layers of 16 neurons each, and 10 output neurons, one per digit. Information only flows left to right. Each neuron in one layer connects to every neuron in the next: that is where the machine's flexibility lives, and its entire 'knowledge' will be stored in the strengths of those connections.",
    tech:
      "A fully connected feedforward network (a multilayer perceptron). Layer sizes 784, 16, 16, 10. Between layers, connections form weight matrices of shape 16x784, 16x16, and 10x16. The two 16s are a teaching choice, small enough to draw; real systems use wider and deeper stacks.",
    analogy:
      "An assembly line with four stations. Every station hands its output to the next; nothing skips ahead and nothing flows backward, yet.",
    numbers: [
      { label: "Layers", value: "784 in, 16, 16, 10 out" },
      { label: "Connections (weights)", value: "12,544 + 256 + 160 = 12,960" },
      { label: "Output meaning", value: "one neuron per digit 0-9" },
    ],
  },
  {
    id: "neuron",
    name: "One Neuron, One Decision",
    short: "w·x + b",
    act: "machine",
    tagline: "Multiply each input by a weight, add them up, add a bias.",
    story:
      "Zoom into a single hidden neuron. It takes all 784 pixel values, multiplies each by its own private weight, sums the lot, and adds one more number, the bias. Big positive weights mean 'this pixel being bright excites me'; negative weights mean the opposite. The sum then passes through a gate (next act) to become the neuron's activation.",
    tech:
      "activation = f(w · x + b), where w is this neuron's 784 weights, x the input vector, b the bias, and f the nonlinearity. Historical honesty: the 1943 McCulloch-Pitts unit that started this field was a binary logic gate with an integer threshold and no learning rule at all; even calling it a 'weighted sum' modernizes it. Rosenblatt's 1958 perceptron paper was a probabilistic theory of a 'hypothetical nervous system', and its learning rule was a value-gain rule, not the error-correction rule textbooks teach.",
    analogy:
      "A judge with 784 informants. Each informant's tip is weighted by trust, everything is tallied, and the judge's mood (the bias) shifts the verdict threshold.",
    numbers: [
      { label: "Weights into one hidden neuron", value: "784" },
      { label: "Bias per neuron", value: "1" },
      { label: "First artificial neuron", value: "1943, a logic gate, no learning" },
    ],
    paper:
      "McCulloch & Pitts 1943, Bulletin of Mathematical Biophysics 5:115-133, DOI 10.1007/BF02478259; Rosenblatt 1958, Psychological Review 65(6):386-408, DOI 10.1037/h0042519.",
  },
  {
    id: "weights",
    name: "13,002 Dials",
    short: "13,002 params",
    act: "machine",
    tagline: "Every connection drawn. This lattice IS the network's memory.",
    story:
      "Here is every parameter at once: 12,544 fibers from pixels to the first hidden layer, 256 between the hidden layers, 160 into the output, plus 42 biases. 13,002 adjustable numbers. Training will touch nothing else: no code changes, no new wiring. Learning is only this: nudging 13,002 dials until the machine stops being wrong.",
    tech:
      "784x16 + 16x16 + 16x10 = 12,544 + 256 + 160 = 12,960 weights; 16 + 16 + 10 = 42 biases; 13,002 total, computed, not quoted. For scale: frontier language models carry hundreds of billions of parameters, but they are made of exactly this ingredient.",
    analogy:
      "A mixing console with 13,002 knobs. The song (the wiring) never changes; mastering it is all in the knob positions.",
    numbers: [
      { label: "Weights", value: "12,960" },
      { label: "Biases", value: "42" },
      { label: "Total parameters", value: "13,002 exactly" },
    ],
  },

  /* ---------------- ACT II : FORWARD ---------------- */
  {
    id: "forward",
    name: "The Forward Pass",
    short: "Forward pass",
    act: "forward",
    tagline: "784 numbers ripple through the lattice and become 10.",
    story:
      "Watch one thought happen. The pixel column enters, every first-layer neuron computes its weighted sum simultaneously, activations light up, and the wave rolls right: 784 numbers become 16, then 16, then 10. No decisions, no branching, no memory: just arithmetic flowing through fixed wiring, identical every single time.",
    tech:
      "Each layer computes a = f(Wx + b): one matrix multiply, one vector add, one elementwise nonlinearity. Three such steps take a 784-vector to a 10-vector. On modern hardware the whole pass is microseconds; matrix multiplication is the entire runtime cost.",
    analogy:
      "A pinball dropped through three banks of pins. The pins never move during play; where the ball lands is determined entirely by how the pins were set.",
    numbers: [
      { label: "Compute shape", value: "3 matrix multiplies" },
      { label: "784 numbers in", value: "10 numbers out" },
      { label: "Branches or loops", value: "none" },
    ],
  },
  {
    id: "relu",
    name: "ReLU: the Gate",
    short: "ReLU",
    act: "forward",
    tagline: "If the sum is negative, output zero. That kink is the magic.",
    story:
      "Without a nonlinearity between layers, stacking them would be pointless: three chained matrix multiplies collapse into one, and the deep network flattens into a shallow one. The fix is almost embarrassingly simple. ReLU: keep positive values, zero out negatives. That single kink lets depth mean something, and it replaced the smooth sigmoid curves that had quietly strangled deep networks with vanishing gradients.",
    tech:
      "ReLU(z) = max(0, z). Nair & Hinton 2010 introduced noisy rectified units inside restricted Boltzmann machines; Glorot, Bordes & Bengio 2011 showed plain ReLU lets deep supervised networks train well without pre-training, producing 'sparse representations with true zeros'. The vanishing-gradient disease it treats was diagnosed in Hochreiter's 1991 Munich thesis and Bengio, Simard & Frasconi 1994. Earlier practice preferred origin-symmetric sigmoids (tanh) per LeCun's Efficient BackProp. The modern smooth cousin is GELU: x times the Gaussian CDF of x.",
    analogy:
      "A one-way valve in a pipe. Forward pressure flows; backward pressure reads as zero. A wall of straight pipes bends water like a curve, one valve at a time.",
    numbers: [
      { label: "ReLU", value: "max(0, z)" },
      { label: "Deep nets without pre-training", value: "AISTATS 2011 result" },
      { label: "GELU", value: "x · Phi(x)" },
    ],
    paper:
      "Nair & Hinton, ICML 2010; Glorot, Bordes & Bengio, AISTATS 2011 (PMLR v15); Hochreiter 1991 (TU Munich thesis); Bengio, Simard & Frasconi 1994, IEEE TNN, DOI 10.1109/72.279181; Hendrycks & Gimpel 2016, arXiv:1606.08415.",
  },
  {
    id: "softmax",
    name: "Softmax: Scores to Beliefs",
    short: "Softmax",
    act: "forward",
    tagline: "Ten raw scores become ten probabilities that sum to one.",
    story:
      "The last layer emits ten raw scores. Softmax exponentiates each and divides by the total, turning scores into a confidence distribution: 'seventy percent five, twenty percent six, a sliver of everything else'. Exponentiation makes the race rich-get-richer: a modest lead in score becomes a decisive lead in probability.",
    tech:
      "softmax(z)_i = exp(z_i) / sum_j exp(z_j). Its use as a neural output layer traces to John Bridle's work around 1989-1990. Softmax can saturate: when one input towers over the rest, its output pins near 1 and the others near 0, which is exactly why the choice of loss function next door matters so much.",
    analogy:
      "An auction where every bid is compounded before comparison. Confidence is not linear in score; it is exponential.",
    numbers: [
      { label: "Formula", value: "exp(z_i) / sum exp(z_j)" },
      { label: "Output", value: "10 probabilities, sum = 1" },
      { label: "Named and popularized", value: "Bridle, 1989-1990" },
    ],
    paper:
      "Bridle, NeurIPS 1989 (Training Stochastic Model Recognition Algorithms as Networks...); cited as the softmax origin by Goodfellow, Bengio & Courville 2016, ch. 6.",
  },
  {
    id: "loss",
    name: "Loss: How Wrong, Exactly",
    short: "Cross-entropy",
    act: "forward",
    tagline: "One number that says how badly the network just failed.",
    story:
      "The image was a 5; the network said '70% five'. Good, but not perfect, and 'not perfect' must become a single number to optimize. Cross-entropy loss is the negative log of the probability given to the correct answer: confident and right is a tiny loss, confident and wrong is a huge one. This one number is what the whole training process will push downhill.",
    tech:
      "L = -log p_correct. The pairing with softmax is not taste, it is chemistry: the log undoes the exp, log softmax(z)_i = z_i - log sum_j exp(z_j), so gradients stay alive even when softmax saturates. Squared error, by contrast, 'is a poor loss function for softmax units': when the exp saturates, its gradient vanishes and learning stalls. The 1986 backprop paper itself still used squared error; cross-entropy became the classification standard later.",
    analogy:
      "A fine that scales with confident wrongness. Whisper a wrong answer, small fine; pound the table with a wrong answer, enormous fine.",
    numbers: [
      { label: "Loss for p_correct = 0.7", value: "0.36" },
      { label: "Loss for p_correct = 0.01", value: "4.61" },
      { label: "Why not squared error", value: "softmax saturation kills its gradient" },
    ],
    paper:
      "Goodfellow, Bengio & Courville, Deep Learning, MIT Press 2016, section 6.2.2.3 (free at deeplearningbook.org): 'the log in the log-likelihood can undo the exp of the softmax'.",
  },

  /* ---------------- ACT III : LEARNING ---------------- */
  {
    id: "descent",
    name: "Gradient Descent",
    short: "Downhill",
    act: "learning",
    tagline: "Roll downhill in a 13,002-dimensional landscape.",
    story:
      "Imagine the loss as terrain: every point is one setting of all 13,002 dials, altitude is how wrong the network is there. Training is walking downhill: measure the slope where you stand, step against it, repeat. You cannot see the whole landscape, only the slope underfoot, and in 13,002 dimensions that turns out to be enough.",
    tech:
      "theta <- theta - eta * gradient, with learning rate eta. In practice the slope is estimated on small random mini-batches rather than all 60,000 images: stochastic gradient descent, whose ancestral citation is Robbins & Monro's 1951 stochastic approximation method (find a root using only noisy measurements). Nielsen's framing: estimating from a sample is polling instead of running the full election.",
    analogy:
      "Descending a mountain at night with a flashlight pointed at your boots. No map, no summit view: slope, step, repeat.",
    numbers: [
      { label: "Update rule", value: "theta <- theta - eta · grad" },
      { label: "Dimensions of the landscape", value: "13,002" },
      { label: "Stochastic ancestor", value: "Robbins & Monro, 1951" },
    ],
    paper:
      "Robbins & Monro 1951, Annals of Mathematical Statistics 22(3), DOI 10.1214/aoms/1177729586.",
  },
  {
    id: "backprop",
    name: "Backpropagation",
    short: "Backprop",
    act: "learning",
    tagline: "The error flows backward, blaming every weight precisely.",
    story:
      "Gradient descent needs the slope with respect to all 13,002 parameters. Computing each one separately would take 13,002 forward passes. Backpropagation gets every single one in a cost of roughly two to three forward passes, total, by running the chain rule backward through the network: the error signal enters at the loss and flows right to left, and each weight learns exactly how much it contributed to the mistake.",
    tech:
      "Backprop is reverse-mode automatic differentiation applied to the loss. The cheap gradient principle: the full gradient costs a small constant multiple of one forward pass (typically 2-3x, provably under ~6x), independent of parameter count. That constant is why training giant networks is possible at all. Credit history, verified: Linnainmaa published reverse-mode in 1970 for rounding-error analysis; Werbos formalized it for networks; Rumelhart, Hinton & Williams 1986 independently rediscovered and popularized it, and their true headline was that hidden units 'come to represent important features of the task domain'.",
    analogy:
      "After a lost relay race, the blame report writes itself backward from the finish line, and producing it costs no more than rerunning the race twice.",
    numbers: [
      { label: "Full gradient cost", value: "~2-3 forward passes" },
      { label: "Guaranteed bound", value: "under ~6x one pass" },
      { label: "Naive alternative", value: "13,002 forward passes" },
    ],
    paper:
      "Rumelhart, Hinton & Williams 1986, Nature 323:533-536, DOI 10.1038/323533a0; Linnainmaa 1970/1976, BIT 16(2), DOI 10.1007/BF01931367; cheap-gradient bound per Griewank 2012 and Baydin et al. 2018, JMLR 18(153).",
  },
  {
    id: "adam",
    name: "Momentum and Adam",
    short: "Adam",
    act: "learning",
    tagline: "A heavy ball with a memory of the terrain.",
    story:
      "Raw gradient descent stutters: it zigzags across ravines and crawls on plateaus. Two upgrades fixed it. Momentum (Polyak, 1964) lets updates accumulate like a rolling ball, smoothing the zigzag. Adam adds a second memory: how large gradients have recently been, per dial, so each of the 13,002 dials gets its own adaptive step size. Adam with its default settings remains the workhorse optimizer of deep learning.",
    tech:
      "Adam keeps two exponential moving averages: m_t = beta1·m + (1-beta1)·g (the mean of gradients) and v_t = beta2·v + (1-beta2)·g² (the mean of squared gradients), corrects both for their zero start (m_hat = m/(1-beta1^t), v_hat = v/(1-beta2^t)), then steps theta <- theta - alpha · m_hat / (sqrt(v_hat) + epsilon). The paper's own tested defaults: alpha 0.001, beta1 0.9, beta2 0.999, epsilon 1e-8.",
    analogy:
      "A bowling ball with a co-pilot: inertia carries it through washboard bumps, and the co-pilot eases off the throttle on any axis that has been violent lately.",
    numbers: [
      { label: "First moment decay (beta1)", value: "0.9" },
      { label: "Second moment decay (beta2)", value: "0.999" },
      { label: "Default step (alpha)", value: "0.001" },
    ],
    paper:
      "Kingma & Ba, Adam, ICLR 2015, arXiv:1412.6980 (Algorithm 1, verified verbatim); Polyak 1964, DOI 10.1016/0041-5553(64)90137-5.",
  },
  {
    id: "training",
    name: "60,000 Teachers",
    short: "Training run",
    act: "learning",
    tagline: "Loop: guess, measure, blame, nudge. Accuracy climbs past 96%.",
    story:
      "Now run the whole loop: forward pass, loss, backprop, Adam step, next mini-batch. Sweep all 60,000 images (one epoch), then sweep again. Watch accuracy on the 10,000 held-out test images climb: past 90 within the first epochs, then past 96 for this simple architecture. And watch honestly: the curve wobbles. Learning is noisy, and progress is not a straight line.",
    tech:
      "Nielsen's 74-line network of this exact shape reaches over 96 percent accuracy. The 2013 record he cites classified 9,979 of 10,000 correctly (Wan, Zeiler, Zhang, LeCun, Fergus). Modern caution against 'curves only go down': deep double descent (Nakkiran et al. 2019) shows test error can get worse before better as models grow or train longer, and more data can even hurt in specific regimes.",
    analogy:
      "Practicing free throws with instant, precise coaching after every shot. Ten thousand shots later the form is grooved, though no single day's practice looked like smooth progress.",
    numbers: [
      { label: "Simple MLP accuracy", value: "over 96% (Nielsen)" },
      { label: "2013 record he cites", value: "9,979 / 10,000" },
      { label: "Curves are", value: "non-monotonic (double descent)" },
    ],
    paper:
      "Nielsen, Neural Networks and Deep Learning, ch. 1; Nakkiran, Kaplun, Bansal, Yang, Barak & Sutskever 2019, arXiv:1912.02292.",
  },

  /* ---------------- ACT IV : LEARNED ---------------- */
  {
    id: "init",
    name: "Initialization",
    short: "First values",
    act: "learned",
    tagline: "Where the 13,002 dials START decides whether learning happens.",
    story:
      "Before the first example, every weight needs a value. Set them all to zero and every neuron computes the same thing forever; too big and signals explode; too small and they fade to nothing by layer three. The fix is starting randomness with exactly the right variance, tuned to layer width, so the signal neither swells nor dies as it crosses the network.",
    tech:
      "Glorot & Bengio 2010: draw from U[-sqrt(6)/sqrt(n_in + n_out), +sqrt(6)/sqrt(n_in + n_out)], derived to keep activation and gradient variances steady across layers (tanh-era analysis). He et al. 2015: for ReLU networks use a zero-mean Gaussian with std sqrt(2/n); the 2 exists precisely because ReLU zeroes half the variance. The same paper's PReLU + this init produced 4.94% top-5 ImageNet error, the first result past the 5.1% human-level benchmark.",
    analogy:
      "Tuning an orchestra before the concert. Nobody plays the symphony yet; but if every section starts wildly sharp or flat, the rehearsal process itself breaks.",
    numbers: [
      { label: "Glorot init", value: "U[±sqrt(6)/sqrt(n_in+n_out)]" },
      { label: "He init for ReLU", value: "std = sqrt(2/n)" },
      { label: "First past human-level ImageNet", value: "4.94% vs 5.1% (2015)" },
    ],
    paper:
      "Glorot & Bengio 2010, AISTATS (PMLR v9), eq. 16 verified; He, Zhang, Ren & Sun 2015, arXiv:1502.01852.",
  },
  {
    id: "dropout",
    name: "Dropout",
    short: "Dropout",
    act: "learned",
    tagline: "Randomly silence neurons so none can memorize alone.",
    story:
      "A network can ace training by memorizing quirks that never generalize: overfitting. Dropout fights it with organized sabotage: during training, each hidden neuron is switched off at random (the classic setting keeps each with probability 0.5). No neuron can rely on a specific partner, so the network is forced to learn redundant, robust features. At test time everyone is present again.",
    tech:
      "Training samples a 'thinned' subnetwork every step. At test time the full network runs, with each unit's outgoing weights multiplied by its retention probability p, making expected training output equal actual test output; this implicitly averages the 2^n thinned networks. The paper's MNIST setting: retain hidden units with p = 0.5, inputs with p = 0.8.",
    analogy:
      "A team where random members skip each rehearsal. Nobody can hide behind a star performer, so everyone learns the whole play.",
    numbers: [
      { label: "Hidden retention (MNIST)", value: "p = 0.5" },
      { label: "Input retention (MNIST)", value: "p = 0.8" },
      { label: "Test-time rule", value: "multiply outgoing weights by p" },
    ],
    paper:
      "Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov 2014, JMLR 15(56):1929-1958.",
  },
  {
    id: "features",
    name: "What the Layers Detect",
    short: "Features",
    act: "learned",
    tagline: "Simple parts near the input, digit ideas near the output.",
    story:
      "What did the hidden layers actually learn? The honest answer for our small network: 16 fuzzy brightness templates per layer that defy tidy labels. The famous edges-to-textures-to-parts hierarchy was demonstrated in convolutional networks: Zeiler & Fergus projected features back to pixels and found corners and edge-color pairs in layer 2, textures in layer 3, class-specific parts like dog faces by layer 4. Treat the clean hierarchy as a CNN result, not a universal law.",
    tech:
      "Zeiler & Fergus 2013 (deconvnet visualizations of an AlexNet-style CNN) reported 'compositionality, increasing invariance and class discrimination as we ascend the layers', plus a warning: one object-like layer-5 feature map actually fired on background grass. Olah et al.'s Distill 2017 feature visualizations extend this by optimization, and caution that neurons may not be the right semantic units at all.",
    analogy:
      "Handwriting analysis in stages: first pen strokes, then loops and crossings, then whole letters. Except in our tiny network the stages smear together, and pretending otherwise would be fiction.",
    numbers: [
      { label: "CNN layer 2 (verified)", value: "corners, edge/color pairs" },
      { label: "CNN layer 4-5", value: "class-specific parts" },
      { label: "Caveat", value: "evidence is for CNNs, not tiny MLPs" },
    ],
    paper:
      "Zeiler & Fergus 2013, arXiv:1311.2901; Olah, Mordvintsev & Schubert 2017, Distill, DOI 10.23915/distill.00007.",
  },
  {
    id: "brain",
    name: "Is This How Brains Work?",
    short: "The brain question",
    act: "learned",
    tagline: "No. And the reasons why not are worth knowing precisely.",
    story:
      "The word 'neural' oversells it. Francis Crick said it in Nature in 1989: these networks are 'unrealistic in important respects' as brain models. The sharpest issue is backpropagation itself: cortex has no evident mechanism to ship exact error signals backward through the same synapses. Thirty years later, Lillicrap, Hinton and colleagues gave the modern reply: the brain may not implement backprop, but feedback connections could induce activity differences that locally approximate its error signals. The debate is open; the machine you just explored is mathematics, not neuroscience.",
    tech:
      "Crick 1989 (Nature 337:129-132) is the canonical skeptical citation. Lillicrap et al. 2020 (Nature Reviews Neuroscience 21:335-346, with Hinton as coauthor) states backprop 'historically... has been viewed as biologically problematic' and argues feedback connections 'may instead induce neural activities whose differences can be used to locally approximate these signals'. Also remember the origin story: even the 1943 'neuron' was a logic gate abstraction, not biology.",
    analogy:
      "Planes and birds both fly, and studying birds inspired planes. But a 747 is not evidence about feathers, and this network is not evidence about your cortex.",
    numbers: [
      { label: "The objection", value: "Crick, Nature, 1989" },
      { label: "The modern reply", value: "Lillicrap et al., 2020 (NGRAD idea)" },
      { label: "Verdict", value: "inspiration, not implementation" },
    ],
    paper:
      "Crick 1989, Nature, DOI 10.1038/337129a0; Lillicrap, Santoro, Marris, Akerman & Hinton 2020, Nature Reviews Neuroscience, DOI 10.1038/s41583-020-0277-3.",
  },
];

/* ------------------------------------------------------------------ *
 *  The guided journey: 16 steps, one per stage, in teaching order.
 *  The order follows the verified convergence of 3Blue1Brown, Nielsen,
 *  Karpathy and Goodfellow ch. 6: structure, forward pass, loss,
 *  gradient descent, backprop, then what-was-learned.
 * ------------------------------------------------------------------ */

export type NnFlow = "input" | "forward" | "backward" | "train" | null;

export interface NnJourneyStep {
  id: string;
  /** Stage this step teaches (drives highlight + detail panel). */
  stageId: string;
  title: string;
  narration: string;
  /** Which flow animation to energize. */
  flow: NnFlow;
  /** Scene program: named animation state the 3D scene enacts. */
  program:
    | "pixels"
    | "reveal"
    | "neuron"
    | "weights"
    | "forward"
    | "relu"
    | "softmax"
    | "loss"
    | "descent"
    | "backprop"
    | "adam"
    | "training"
    | "init"
    | "dropout"
    | "features"
    | "brain";
}

export const NN_JOURNEY: NnJourneyStep[] = [
  {
    id: "j-pixels",
    stageId: "pixels",
    title: "A five becomes 784 numbers",
    narration:
      "Someone wrote a five. Scanned at 28 by 28, it is now 784 brightness values between 0 and 1, and that column of numbers is all the network will ever see. Watch the image dissolve into its pixels.",
    flow: "input",
    program: "pixels",
  },
  {
    id: "j-reveal",
    stageId: "layers",
    title: "The machine appears",
    narration:
      "Pull back: 784 inputs, two hidden layers of 16, ten outputs. Every neuron connects to every neuron in the next column. This wiring never changes; everything the network will ever know must fit in the strengths of these connections.",
    flow: null,
    program: "reveal",
  },
  {
    id: "j-neuron",
    stageId: "neuron",
    title: "Inside one neuron",
    narration:
      "One hidden neuron, up close. 784 inputs arrive, each multiplied by its own weight; the products are summed and a bias is added. That is the whole neuron. In 1943 this was a logic gate; today it is a weighted sum. Still no intelligence in sight, just arithmetic.",
    flow: null,
    program: "neuron",
  },
  {
    id: "j-weights",
    stageId: "weights",
    title: "All 13,002 dials at once",
    narration:
      "Every connection, drawn: 12,544 fibers into the first layer, 256 more, then 160, plus 42 biases. 13,002 adjustable numbers. Training will change nothing but these. Hold this image: learning is only dial-turning at scale.",
    flow: null,
    program: "weights",
  },
  {
    id: "j-forward",
    stageId: "forward",
    title: "A thought moves through",
    narration:
      "The pixels enter and the wave rolls: 784 numbers become 16, become 16, become 10. Three matrix multiplications, a few microseconds, zero decisions. Every answer this network ever gives is exactly this ripple, replayed.",
    flow: "forward",
    program: "forward",
  },
  {
    id: "j-relu",
    stageId: "relu",
    title: "The gate that made depth work",
    narration:
      "Between layers stands a brutally simple gate: negatives become zero, positives pass. Without it, three layers would collapse into one. With it, the network can bend straight lines into any shape. The smooth curves it replaced used to strangle deep nets; this kink set them free.",
    flow: "forward",
    program: "relu",
  },
  {
    id: "j-softmax",
    stageId: "softmax",
    title: "Ten scores become a belief",
    narration:
      "The output layer holds ten raw scores. Softmax exponentiates and normalizes them into probabilities that sum to one: seventy percent five, twenty percent six, slivers elsewhere. The network has committed to a belief.",
    flow: "forward",
    program: "softmax",
  },
  {
    id: "j-loss",
    stageId: "loss",
    title: "Wrongness becomes one number",
    narration:
      "The truth was five; the belief was seventy percent five. Cross-entropy turns that gap into a single number: minus the log of the probability given to the right answer. Confidently wrong is punished brutally; the log exists to undo softmax's exp so learning never stalls.",
    flow: "forward",
    program: "loss",
  },
  {
    id: "j-descent",
    stageId: "descent",
    title: "Downhill in 13,002 dimensions",
    narration:
      "Picture the loss as terrain over all possible dial settings. Training is walking downhill by flashlight: measure the slope underfoot, step against it, repeat, one mini-batch at a time. This idea, stochastic approximation, is older than the computer that runs it: 1951.",
    flow: "train",
    program: "descent",
  },
  {
    id: "j-backprop",
    stageId: "backprop",
    title: "The error flows backward",
    narration:
      "The slope has 13,002 components and backpropagation delivers every one of them for the price of roughly two extra forward passes. Watch the error enter at the loss and flow right to left, splitting blame precisely at every junction. This cheapness is why deep learning exists.",
    flow: "backward",
    program: "backprop",
  },
  {
    id: "j-adam",
    stageId: "adam",
    title: "A heavy ball with a memory",
    narration:
      "Two balls race downhill. Plain gradient descent zigzags and stalls. Adam rolls with momentum and remembers how violent each direction has been, giving all 13,002 dials their own step size. Defaults straight from the 2015 paper: step 0.001, memories 0.9 and 0.999.",
    flow: "train",
    program: "adam",
  },
  {
    id: "j-training",
    stageId: "training",
    title: "Sixty thousand teachers",
    narration:
      "Loop everything: forward, loss, backward, step. Sweep the 60,000 training images again and again and watch test accuracy climb past 96 percent, wobbling as it goes. The wobble is honest: learning curves are noisy, and sometimes worse comes before better.",
    flow: "train",
    program: "training",
  },
  {
    id: "j-init",
    stageId: "init",
    title: "Why the start decides the finish",
    narration:
      "Rewind to before the first example. Start all dials at zero and the network is symmetric and stuck forever. Start too large or too small and signals explode or fade. The cure is randomness with exactly the right variance: sqrt(2/n) for ReLU layers. Watch a bad start die and a good one breathe.",
    flow: null,
    program: "init",
  },
  {
    id: "j-dropout",
    stageId: "dropout",
    title: "Forgetting on purpose",
    narration:
      "During training, half the hidden neurons vanish at random, every step a different half. No neuron can lean on a partner, so features become redundant and robust. At test time everyone returns, with outgoing weights scaled by the survival rate.",
    flow: null,
    program: "dropout",
  },
  {
    id: "j-features",
    stageId: "features",
    title: "What did it actually learn?",
    narration:
      "In big convolutional networks, researchers projected features back to pixels and found a hierarchy: edges and corners early, textures next, dog faces deep. Our 16-neuron layers hold fuzzier templates that defy tidy labels. The hierarchy story is real, verified, and belongs to CNNs.",
    flow: null,
    program: "features",
  },
  {
    id: "j-brain",
    stageId: "brain",
    title: "The honest ending",
    narration:
      "Is this how your brain works? No. Crick said it in Nature in 1989; the sharpest problem is backprop itself, which cortex has no clean way to implement. The 2020 reply from Lillicrap and Hinton: feedback loops might approximate it locally. The debate is open. What you explored is mathematics that works, not a brain.",
    flow: null,
    program: "brain",
  },
];

/* ------------------------------------------------------------------ *
 *  Network constants: computed, and used by both scene and copy.
 * ------------------------------------------------------------------ */

export const NN_LAYERS = [784, 16, 16, 10] as const;
export const NN_WEIGHTS = 784 * 16 + 16 * 16 + 16 * 10; // 12,960
export const NN_BIASES = 16 + 16 + 10; // 42
export const NN_PARAMS = NN_WEIGHTS + NN_BIASES; // 13,002

export const NN_COUNTS = {
  stages: NN_STAGES.length,
  journeySteps: NN_JOURNEY.length,
  acts: Object.keys(NN_ACTS).length,
  params: NN_PARAMS,
};

/** Demo output distribution shown at the softmax stage (illustrative). */
export const NN_DEMO_PROBS: { digit: string; p: number }[] = [
  { digit: "0", p: 0.01 },
  { digit: "1", p: 0.0 },
  { digit: "2", p: 0.01 },
  { digit: "3", p: 0.04 },
  { digit: "4", p: 0.01 },
  { digit: "5", p: 0.7 },
  { digit: "6", p: 0.2 },
  { digit: "7", p: 0.0 },
  { digit: "8", p: 0.02 },
  { digit: "9", p: 0.01 },
];

export const nnStageById = (id: string) => NN_STAGES.find((s) => s.id === id);
export const nnStagesInAct = (act: NnAct) => NN_STAGES.filter((s) => s.act === act);
export const nnJourneyStepById = (id: string) => NN_JOURNEY.find((j) => j.id === id);
