# How Neural Networks Work: Fly Through 13,002 Parameters

A handwritten five becomes 784 numbers, ripples through a lattice you can orbit, and comes out as a belief. Then the error flows backward and you watch the machine learn. Every fiber drawn, every claim from the original papers.

> The canonical 784-16-16-10 MNIST network as an explorable 3D machine: 16 stations across 4 acts, a 16-step guided journey from pixels to the brain question, all 12,960 weight connections really drawn, and a training row where gradient descent is really computed on an illustrative loss terrain, and a Train mode where the network genuinely learns 10,000 real MNIST digits in your browser.

By Venkata Pagadala, AI Product Manager (Search · SEO · GEO), AT&T · Updated 2026-08-15 · 20 min read

Canonical: https://venkatapagadala.com/guides/how-neural-networks-work
Tags: Neural Networks, Deep Learning, Backpropagation, Gradient Descent, MNIST, 3D Interactive, AI Explainer

Strip away the mythology and a neural network is a small machine: numbers flow left to right through weighted connections, one gate keeps things nonlinear, and learning is nothing but nudging **13,002 dials** downhill against an error signal. The model below is that machine, drawn honestly: every one of its 12,960 weight fibers is really rendered, the descent balls really run gradient descent on the terrain, and every claim traces to the original paper. **Play the journey**, or click any station.

## Watch a digit get recognized, then watch the network learn

*(Interactive 3D content: explore it at https://venkatapagadala.com/guides/how-neural-networks-work)*

> **What you're looking at:** **Blue**, left: a handwritten five dissolving into 784 pixels, and the lattice they feed. **Violet**, center: the forward pass, the ReLU gates, softmax and the loss meter. **Amber**, back row: the training machinery, a loss terrain with racing descent balls, the Adam formulas, an accuracy monitor. **Green**, back row right: dropout, what the layers detect, and the honest brain question.

> **What is computed and what is staged:** **Real, always:** the lattice is the true 784-16-16-10 wiring with all **12,960 weight fibers drawn one for one**; the descent balls follow paths produced by **actually running gradient descent and momentum** on the terrain function; every number, formula, and quote comes from the cited paper. **Real, in Train mode:** press Train and this exact network **genuinely trains in your browser** on 10,000 real MNIST digits: the wall shows the digit being learned, the neurons carry its actual activations, the belief bars are the network's live output, fiber brightness tracks learned weight magnitudes, and the accuracy curve is a real log against 1,000 held-out digits (the seeded reference run reaches 92.8% in 20 epochs; Nielsen reports 96%+ with the full 60,000). **Staged in the guided journey:** the choreographed signal flows, the hand-drawn five, and the terrain, a 2D stand-in for a 13,002-dimensional loss surface. An explainer that blurs this line does not deserve your trust, so here it is in writing.

### Train it yourself, for real

Open the **Train** tab in the explorer above. The browser fetches 10,000 genuine MNIST digits (a deterministic first-10,000 slice, so nothing is cherry-picked) plus 1,000 held-out test digits, and runs the same loop this guide teaches: forward pass, cross-entropy, backpropagation, Adam with the paper's default settings. Early on the belief bars flail and the amber truth marker disagrees with the green guess; a minute later the network is right about nine times in ten on handwriting it has never seen. That transition, chaos becoming competence with nothing but gradient nudges, is the entire field in one minute.

## The journey, in plain text

The same 16 steps the interactive journey walks through, as text, for reading (and for the crawlers and answer engines that can't run WebGL).

1. **A five becomes 784 numbers.** Someone wrote a five. Scanned at 28 by 28, it is now 784 brightness values between 0 and 1, and that column of numbers is all the network will ever see. Watch the image dissolve into its pixels.
2. **The machine appears.** Pull back: 784 inputs, two hidden layers of 16, ten outputs. Every neuron connects to every neuron in the next column. This wiring never changes; everything the network will ever know must fit in the strengths of these connections.
3. **Inside one neuron.** One hidden neuron, up close. 784 inputs arrive, each multiplied by its own weight; the products are summed and a bias is added. That is the whole neuron. In 1943 this was a logic gate; today it is a weighted sum. Still no intelligence in sight, just arithmetic.
4. **All 13,002 dials at once.** Every connection, drawn: 12,544 fibers into the first layer, 256 more, then 160, plus 42 biases. 13,002 adjustable numbers. Training will change nothing but these. Hold this image: learning is only dial-turning at scale.
5. **A thought moves through.** The pixels enter and the wave rolls: 784 numbers become 16, become 16, become 10. Three matrix multiplications, a few microseconds, zero decisions. Every answer this network ever gives is exactly this ripple, replayed.
6. **The gate that made depth work.** Between layers stands a brutally simple gate: negatives become zero, positives pass. Without it, three layers would collapse into one. With it, the network can bend straight lines into any shape. The smooth curves it replaced used to strangle deep nets; this kink set them free.
7. **Ten scores become a belief.** The output layer holds ten raw scores. Softmax exponentiates and normalizes them into probabilities that sum to one: seventy percent five, twenty percent six, slivers elsewhere. The network has committed to a belief.
8. **Wrongness becomes one number.** The truth was five; the belief was seventy percent five. Cross-entropy turns that gap into a single number: minus the log of the probability given to the right answer. Confidently wrong is punished brutally; the log exists to undo softmax's exp so learning never stalls.
9. **Downhill in 13,002 dimensions.** Picture the loss as terrain over all possible dial settings. Training is walking downhill by flashlight: measure the slope underfoot, step against it, repeat, one mini-batch at a time. This idea, stochastic approximation, is older than the computer that runs it: 1951.
10. **The error flows backward.** The slope has 13,002 components and backpropagation delivers every one of them for the price of roughly two extra forward passes. Watch the error enter at the loss and flow right to left, splitting blame precisely at every junction. This cheapness is why deep learning exists.
11. **A heavy ball with a memory.** Two balls race downhill. Plain gradient descent zigzags and stalls. Adam rolls with momentum and remembers how violent each direction has been, giving all 13,002 dials their own step size. Defaults straight from the 2015 paper: step 0.001, memories 0.9 and 0.999.
12. **Sixty thousand teachers.** Loop everything: forward, loss, backward, step. Sweep the 60,000 training images again and again and watch test accuracy climb past 96 percent, wobbling as it goes. The wobble is honest: learning curves are noisy, and sometimes worse comes before better.
13. **Why the start decides the finish.** Rewind to before the first example. Start all dials at zero and the network is symmetric and stuck forever. Start too large or too small and signals explode or fade. The cure is randomness with exactly the right variance: sqrt(2/n) for ReLU layers. Watch a bad start die and a good one breathe.
14. **Forgetting on purpose.** During training, half the hidden neurons vanish at random, every step a different half. No neuron can lean on a partner, so features become redundant and robust. At test time everyone returns, with outgoing weights scaled by the survival rate.
15. **What did it actually learn?.** In big convolutional networks, researchers projected features back to pixels and found a hierarchy: edges and corners early, textures next, dog faces deep. Our 16-neuron layers hold fuzzier templates that defy tidy labels. The hierarchy story is real, verified, and belongs to CNNs.
16. **The honest ending.** Is this how your brain works? No. Crick said it in Nature in 1989; the sharpest problem is backprop itself, which cortex has no clean way to implement. The 2020 reply from Lillicrap and Hinton: feedback loops might approximate it locally. The debate is open. What you explored is mathematics that works, not a brain.

## Every station, with sources

| Station | Act | What happens | Real numbers | Primary source |
|---|---|---|---|---|
| A Digit Becomes Numbers | machine | The network never sees a five. It sees 784 brightness values. Start with one handwritten digit from MNIST, the dataset this network learns from: 28 by 28 pixels, grayscale. Unroll the grid into a single column of 784 numbers between 0 (black) and 1 (white). That column is the entire input. No shapes, no strokes, no idea of 'five': just 784 brightnesses in a fixed order. | Image size: 28 x 28 = 784 pixels · Training set: 60,000 images · Test set: 10,000 images · Training-set writers: ~250 people · Test-set writers: a different ~250 people | MNIST as described in Nielsen, Neural Networks and Deep Learning, chapter 1 (the official dataset description). |
| The Shape of the Machine | machine | Four columns of neurons, connected left to right. The classic teaching network: 784 input values, two hidden layers of 16 neurons each, and 10 output neurons, one per digit. Information only flows left to right. Each neuron in one layer connects to every neuron in the next: that is where the machine's flexibility lives, and its entire 'knowledge' will be stored in the strengths of those connections. | Layers: 784 in, 16, 16, 10 out · Connections (weights): 12,544 + 256 + 160 = 12,960 · Output meaning: one neuron per digit 0-9 | computed in this guide |
| One Neuron, One Decision | machine | Multiply each input by a weight, add them up, add a bias. Zoom into a single hidden neuron. It takes all 784 pixel values, multiplies each by its own private weight, sums the lot, and adds one more number, the bias. Big positive weights mean 'this pixel being bright excites me'; negative weights mean the opposite. The sum then passes through a gate (next act) to become the neuron's activation. | Weights into one hidden neuron: 784 · Bias per neuron: 1 · First artificial neuron: 1943, a logic gate, no learning | McCulloch & Pitts 1943, Bulletin of Mathematical Biophysics 5:115-133, DOI 10.1007/BF02478259; Rosenblatt 1958, Psychological Review 65(6):386-408, DOI 10.1037/h0042519. |
| 13,002 Dials | machine | Every connection drawn. This lattice IS the network's memory. Here is every parameter at once: 12,544 fibers from pixels to the first hidden layer, 256 between the hidden layers, 160 into the output, plus 42 biases. 13,002 adjustable numbers. Training will touch nothing else: no code changes, no new wiring. Learning is only this: nudging 13,002 dials until the machine stops being wrong. | Weights: 12,960 · Biases: 42 · Total parameters: 13,002 exactly | computed in this guide |
| The Forward Pass | forward | 784 numbers ripple through the lattice and become 10. Watch one thought happen. The pixel column enters, every first-layer neuron computes its weighted sum simultaneously, activations light up, and the wave rolls right: 784 numbers become 16, then 16, then 10. No decisions, no branching, no memory: just arithmetic flowing through fixed wiring, identical every single time. | Compute shape: 3 matrix multiplies · 784 numbers in: 10 numbers out · Branches or loops: none | computed in this guide |
| ReLU: the Gate | forward | If the sum is negative, output zero. That kink is the magic. Without a nonlinearity between layers, stacking them would be pointless: three chained matrix multiplies collapse into one, and the deep network flattens into a shallow one. The fix is almost embarrassingly simple. ReLU: keep positive values, zero out negatives. That single kink lets depth mean something, and it replaced the smooth sigmoid curves that had quietly strangled deep networks with vanishing gradients. | ReLU: max(0, z) · Deep nets without pre-training: AISTATS 2011 result · GELU: x · Phi(x) | Nair & Hinton, ICML 2010; Glorot, Bordes & Bengio, AISTATS 2011 (PMLR v15); Hochreiter 1991 (TU Munich thesis); Bengio, Simard & Frasconi 1994, IEEE TNN, DOI 10.1109/72.279181; Hendrycks & Gimpel 2016, arXiv:1606.08415. |
| Softmax: Scores to Beliefs | forward | Ten raw scores become ten probabilities that sum to one. The last layer emits ten raw scores. Softmax exponentiates each and divides by the total, turning scores into a confidence distribution: 'seventy percent five, twenty percent six, a sliver of everything else'. Exponentiation makes the race rich-get-richer: a modest lead in score becomes a decisive lead in probability. | Formula: exp(z_i) / sum exp(z_j) · Output: 10 probabilities, sum = 1 · Named and popularized: Bridle, 1989-1990 | Bridle, NeurIPS 1989 (Training Stochastic Model Recognition Algorithms as Networks...); cited as the softmax origin by Goodfellow, Bengio & Courville 2016, ch. 6. |
| Loss: How Wrong, Exactly | forward | One number that says how badly the network just failed. The image was a 5; the network said '70% five'. Good, but not perfect, and 'not perfect' must become a single number to optimize. Cross-entropy loss is the negative log of the probability given to the correct answer: confident and right is a tiny loss, confident and wrong is a huge one. This one number is what the whole training process will push downhill. | Loss for p_correct = 0.7: 0.36 · Loss for p_correct = 0.01: 4.61 · Why not squared error: softmax saturation kills its gradient | Goodfellow, Bengio & Courville, Deep Learning, MIT Press 2016, section 6.2.2.3 (free at deeplearningbook.org): 'the log in the log-likelihood can undo the exp of the softmax'. |
| Gradient Descent | learning | Roll downhill in a 13,002-dimensional landscape. Imagine the loss as terrain: every point is one setting of all 13,002 dials, altitude is how wrong the network is there. Training is walking downhill: measure the slope where you stand, step against it, repeat. You cannot see the whole landscape, only the slope underfoot, and in 13,002 dimensions that turns out to be enough. | Update rule: theta <- theta - eta · grad · Dimensions of the landscape: 13,002 · Stochastic ancestor: Robbins & Monro, 1951 | Robbins & Monro 1951, Annals of Mathematical Statistics 22(3), DOI 10.1214/aoms/1177729586. |
| Backpropagation | learning | The error flows backward, blaming every weight precisely. Gradient descent needs the slope with respect to all 13,002 parameters. Computing each one separately would take 13,002 forward passes. Backpropagation gets every single one in a cost of roughly two to three forward passes, total, by running the chain rule backward through the network: the error signal enters at the loss and flows right to left, and each weight learns exactly how much it contributed to the mistake. | Full gradient cost: ~2-3 forward passes · Guaranteed bound: under ~6x one pass · Naive alternative: 13,002 forward passes | Rumelhart, Hinton & Williams 1986, Nature 323:533-536, DOI 10.1038/323533a0; Linnainmaa 1970/1976, BIT 16(2), DOI 10.1007/BF01931367; cheap-gradient bound per Griewank 2012 and Baydin et al. 2018, JMLR 18(153). |
| Momentum and Adam | learning | A heavy ball with a memory of the terrain. Raw gradient descent stutters: it zigzags across ravines and crawls on plateaus. Two upgrades fixed it. Momentum (Polyak, 1964) lets updates accumulate like a rolling ball, smoothing the zigzag. Adam adds a second memory: how large gradients have recently been, per dial, so each of the 13,002 dials gets its own adaptive step size. Adam with its default settings remains the workhorse optimizer of deep learning. | First moment decay (beta1): 0.9 · Second moment decay (beta2): 0.999 · Default step (alpha): 0.001 | Kingma & Ba, Adam, ICLR 2015, arXiv:1412.6980 (Algorithm 1, verified verbatim); Polyak 1964, DOI 10.1016/0041-5553(64)90137-5. |
| 60,000 Teachers | learning | Loop: guess, measure, blame, nudge. Accuracy climbs past 96%. Now run the whole loop: forward pass, loss, backprop, Adam step, next mini-batch. Sweep all 60,000 images (one epoch), then sweep again. Watch accuracy on the 10,000 held-out test images climb: past 90 within the first epochs, then past 96 for this simple architecture. And watch honestly: the curve wobbles. Learning is noisy, and progress is not a straight line. | Simple MLP accuracy: over 96% (Nielsen) · 2013 record he cites: 9,979 / 10,000 · Curves are: non-monotonic (double descent) | Nielsen, Neural Networks and Deep Learning, ch. 1; Nakkiran, Kaplun, Bansal, Yang, Barak & Sutskever 2019, arXiv:1912.02292. |
| Initialization | learned | Where the 13,002 dials START decides whether learning happens. Before the first example, every weight needs a value. Set them all to zero and every neuron computes the same thing forever; too big and signals explode; too small and they fade to nothing by layer three. The fix is starting randomness with exactly the right variance, tuned to layer width, so the signal neither swells nor dies as it crosses the network. | Glorot init: U[±sqrt(6)/sqrt(n_in+n_out)] · He init for ReLU: std = sqrt(2/n) · First past human-level ImageNet: 4.94% vs 5.1% (2015) | Glorot & Bengio 2010, AISTATS (PMLR v9), eq. 16 verified; He, Zhang, Ren & Sun 2015, arXiv:1502.01852. |
| Dropout | learned | Randomly silence neurons so none can memorize alone. A network can ace training by memorizing quirks that never generalize: overfitting. Dropout fights it with organized sabotage: during training, each hidden neuron is switched off at random (the classic setting keeps each with probability 0.5). No neuron can rely on a specific partner, so the network is forced to learn redundant, robust features. At test time everyone is present again. | Hidden retention (MNIST): p = 0.5 · Input retention (MNIST): p = 0.8 · Test-time rule: multiply outgoing weights by p | Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov 2014, JMLR 15(56):1929-1958. |
| What the Layers Detect | learned | Simple parts near the input, digit ideas near the output. What did the hidden layers actually learn? The honest answer for our small network: 16 fuzzy brightness templates per layer that defy tidy labels. The famous edges-to-textures-to-parts hierarchy was demonstrated in convolutional networks: Zeiler & Fergus projected features back to pixels and found corners and edge-color pairs in layer 2, textures in layer 3, class-specific parts like dog faces by layer 4. Treat the clean hierarchy as a CNN result, not a universal law. | CNN layer 2 (verified): corners, edge/color pairs · CNN layer 4-5: class-specific parts · Caveat: evidence is for CNNs, not tiny MLPs | Zeiler & Fergus 2013, arXiv:1311.2901; Olah, Mordvintsev & Schubert 2017, Distill, DOI 10.23915/distill.00007. |
| Is This How Brains Work? | learned | No. And the reasons why not are worth knowing precisely. The word 'neural' oversells it. Francis Crick said it in Nature in 1989: these networks are 'unrealistic in important respects' as brain models. The sharpest issue is backpropagation itself: cortex has no evident mechanism to ship exact error signals backward through the same synapses. Thirty years later, Lillicrap, Hinton and colleagues gave the modern reply: the brain may not implement backprop, but feedback connections could induce activity differences that locally approximate its error signals. The debate is open; the machine you just explored is mathematics, not neuroscience. | The objection: Crick, Nature, 1989 · The modern reply: Lillicrap et al., 2020 (NGRAD idea) · Verdict: inspiration, not implementation | Crick 1989, Nature, DOI 10.1038/337129a0; Lillicrap, Santoro, Marris, Akerman & Hinton 2020, Nature Reviews Neuroscience, DOI 10.1038/s41583-020-0277-3. |

## The vocabulary that unlocks the papers

### Artificial Neuron (aka unit, perceptron unit)

A function that multiplies each input by a weight, sums them, adds a bias, and passes the result through a nonlinearity.

The modern unit computes a = f(w · x + b). Its 1943 ancestor from McCulloch and Pitts was a binary logic gate with an integer threshold and no learning rule at all; even calling it a weighted sum modernizes it. Rosenblatt's 1958 perceptron paper described a probabilistic theory of a hypothetical nervous system, and its learning rule was a value-gain rule, not the error-correction rule usually taught. The convergence theorem arrived in 1962 work by Rosenblatt, Block, and Novikoff.

- **Analogy:** A judge with hundreds of informants: each tip weighted by trust, tallied, and nudged by the judge's mood before the verdict.
- **Example:** One hidden neuron in this guide's network holds 784 weights and 1 bias: 785 of the 13,002 parameters.
- **Why it matters:** Every parameter count you read about any model, from this 13,002 to hundreds of billions, is counting these weights and biases.

### ReLU (aka rectified linear unit)

The activation max(0, z): negatives become zero, positives pass through unchanged.

Without a nonlinearity, stacked layers collapse into one matrix multiply. ReLU's kink is the cheapest possible bend. Nair and Hinton introduced noisy rectified units in restricted Boltzmann machines in 2010; Glorot, Bordes and Bengio showed in 2011 that plain ReLU lets deep supervised networks train without pre-training, producing sparse representations with true zeros. It also sidesteps the vanishing gradients that saturating sigmoids caused, a disease diagnosed by Hochreiter in 1991 and Bengio, Simard and Frasconi in 1994.

- **Analogy:** A one-way valve: forward pressure flows, backward pressure reads zero.
- **Example:** ReLU(2.3) = 2.3, ReLU(-0.7) = 0.
- **Why it matters:** The default hidden activation in modern networks; its smooth cousin GELU, x times the Gaussian CDF, powers transformers.

### Softmax

The output layer that exponentiates ten raw scores and normalizes them into probabilities summing to one.

softmax(z)_i = exp(z_i) / sum_j exp(z_j). Its use as a neural output layer traces to John Bridle's papers around 1989-1990. Exponentiation makes the contest rich-get-richer: modest score gaps become decisive probability gaps. Softmax can saturate when one input towers over the rest, which is exactly why it must be paired with a log-based loss.

- **Analogy:** An auction where every bid is compounded before comparison.
- **Example:** Scores (2.0, 1.0, 0.1) become probabilities (0.66, 0.24, 0.10).
- **Why it matters:** The same layer produces every LLM's next-token distribution; temperature is a dial on this exact formula.

### Cross-Entropy Loss (aka negative log-likelihood)

The training loss: minus the log of the probability the network gave the correct answer.

Confidently right costs nearly nothing; confidently wrong costs enormously. The pairing with softmax is mechanical, not aesthetic: the log undoes the exp, log softmax(z)_i = z_i - log sum_j exp(z_j), so the gradient survives even when softmax saturates. Goodfellow, Bengio and Courville state it directly: squared error is a poor loss for softmax units because when the exp saturates, the gradient vanishes and learning stalls. The 1986 backprop paper itself still used squared error.

- **Analogy:** A fine scaled to confident wrongness: whisper a wrong guess, small fine; pound the table wrongly, enormous fine.
- **Example:** p(correct) = 0.7 gives loss 0.36; p(correct) = 0.01 gives loss 4.61.
- **Why it matters:** Perplexity, the standard language-model metric, is this loss exponentiated.

### Gradient Descent (aka SGD, stochastic gradient descent)

Repeatedly measure the loss's slope and step the parameters against it: theta becomes theta minus eta times the gradient.

The loss is a landscape over all 13,002 parameters; training walks downhill using only the local slope. The stochastic variant estimates that slope from small random mini-batches instead of all 60,000 images, which is faster and noisier. Its ancestral citation is Robbins and Monro's 1951 stochastic approximation method: converge to a root using only noisy measurements. Nielsen's framing: polling instead of running the full election.

- **Analogy:** Descending a mountain at night with a flashlight pointed at your boots.
- **Example:** With learning rate 0.001, a weight with gradient +2.0 moves by -0.002.
- **Why it matters:** Every modern model, including every LLM, is trained by a descendant of this loop.

### Backpropagation (aka reverse-mode autodiff)

The chain rule run backward through the network, delivering the gradient for every parameter in one cheap backward sweep.

Backprop is reverse-mode automatic differentiation applied to the loss. The cheap gradient principle says the full gradient over all n parameters costs a small constant multiple of one forward pass, typically 2-3x and provably under about 6x, independent of n. The credit history is layered: Linnainmaa published reverse-mode in 1970 for rounding-error analysis, Werbos formalized it for networks, and Rumelhart, Hinton and Williams independently rediscovered and popularized it in 1986; their stated headline was that hidden units come to represent important features of the task domain.

- **Analogy:** After a lost relay race, the blame report writes itself backward from the finish line, at the cost of rerunning the race twice.
- **Example:** This network: all 13,002 gradients for roughly the price of 2-3 forward passes, versus 13,002 passes done naively.
- **Why it matters:** The reason deep learning is economically possible; PyTorch's autograd and JAX's grad are this algorithm, industrialized.

### Adam (aka adaptive moment estimation)

The default optimizer: gradient descent with a momentum memory and a per-parameter step size learned from recent gradient magnitudes.

Adam keeps two exponential moving averages: m (the mean of gradients, decay 0.9) and v (the mean of squared gradients, decay 0.999). Both start at zero and are bias-corrected, then the update is alpha times m-hat over the square root of v-hat. The paper's own tested defaults: alpha 0.001, beta1 0.9, beta2 0.999, epsilon 1e-8. Momentum itself goes back to Polyak, 1964.

- **Analogy:** A bowling ball with a co-pilot: inertia smooths the washboard, and the co-pilot eases the throttle on any axis that has been violent lately.
- **Example:** A parameter with consistently tiny gradients gets larger effective steps; a violent one gets damped.
- **Why it matters:** The optimizer behind most modern training runs; its defaults are the most-typed hyperparameters in machine learning.

### Weight Initialization (aka Glorot init, He init)

Starting weights drawn randomly with a variance tuned to layer width, so signals neither explode nor vanish across depth.

All-zero starts make neurons identical forever; careless randomness kills deep networks before training begins. Glorot and Bengio 2010 proposed uniform draws in plus or minus sqrt(6)/sqrt(n_in + n_out), keeping activation and gradient variances steady (tanh-era analysis). He et al. 2015 derived the ReLU version, a zero-mean Gaussian with standard deviation sqrt(2/n); the 2 exists because ReLU zeroes half the variance. That paper's PReLU plus this init produced 4.94% top-5 ImageNet error, the first past the 5.1% human benchmark.

- **Analogy:** Tuning the orchestra before rehearsal: nobody plays the symphony yet, but starting wildly out of tune breaks rehearsal itself.
- **Example:** A 784-input ReLU layer initializes with std sqrt(2/784), roughly 0.05.
- **Why it matters:** Why 'just train it' works at all today; bad init was a silent killer of the field's first three decades.

### Dropout

During training, randomly silence each hidden neuron (classically keep with p = 0.5) so no neuron can rely on another.

Each training step samples a thinned subnetwork; over a run this implicitly trains an ensemble of 2^n networks with shared weights. At test time the full network runs with each unit's outgoing weights multiplied by its retention probability, making expected training output equal actual test output. The JMLR 2014 paper's MNIST setting: retain hidden units with p = 0.5 and inputs with p = 0.8.

- **Analogy:** A team where random members skip each rehearsal: nobody can hide behind the star, so everyone learns the whole play.
- **Example:** A 16-neuron layer under p = 0.5 trains a different 8-ish-neuron layer every step.
- **Why it matters:** The classic weapon against overfitting, and the cleanest example of why forcing redundancy improves generalization.

### Universal Approximation Theorem

One hidden layer with enough units can approximate any continuous function: an existence result, not a training guarantee.

Cybenko 1989 and Hornik, Stinchcombe and White 1989 proved versions of this independently. Read the fine print the authors themselves wrote: the results do not say how many units are needed, and they do not promise gradient descent will find the approximation. Hornik's paper explicitly blames practical failures on inadequate learning, inadequate units, or noisy data. The theorem explains why networks are expressive, never why training works.

- **Analogy:** A proof that a perfect key exists somewhere in an infinite keyshop, with no directions to the right drawer.
- **Example:** A width-limited two-layer ReLU network can fit any curve you can draw, given enough neurons.
- **Why it matters:** The most misquoted theorem in AI; citing it correctly signals you read past the headline.

## Six eras, 1943 to today

The unit barely changed since 1958: weighted sum, bias, nonlinearity. What changed is everything around it, and most popular histories get the credits wrong. This table keeps them straight.

| Era | What it was | What it established | Mechanism | Anchor | What it unlocked | Limit |
|---|---|---|---|---|---|---|
| 1943 · Logic neuron | McCulloch & Pitts: neurons as propositional logic | Binary threshold gates can express logical claims; nets with loops sketched | No learning rule at all; fixed integer thresholds, veto inhibition | The original paper, Bulletin of Mathematical Biophysics 5:115-133 | Founding abstraction: computation from neuron-like parts | Cannot learn; the 'weighted sum' reading is a later modernization |
| 1958 · Perceptron | Rosenblatt: a probabilistic theory of a hypothetical nervous system | Randomly connected units can learn associations from random stimuli | Value-gain learning (alpha system); error-correction rule came in 1962 | Psychological Review 65(6):386-408; Mark I machine built ~1959-60 | First learning claim; birth of trainable networks | Single layer; the famous convergence theorem is 1962 (Block, Novikoff) |
| 1986 · Backprop era | Rumelhart, Hinton & Williams popularize gradient learning in depth | Hidden units learn useful internal representations | Squared-error gradient descent via the chain rule run backward | Nature 323:533-536; reverse mode itself dates to Linnainmaa 1970 | Multi-layer training that actually works | Saturating sigmoids: gradients vanish with depth (Hochreiter 1991) |
| 2010-2012 · ReLU + depth | Rectifiers, GPUs and data make deep supervised learning practical | Deep nets train from scratch, no unsupervised pre-training needed | max(0, z) activations, cross-entropy loss, minibatch SGD | Nair & Hinton 2010; Glorot, Bordes & Bengio, AISTATS 2011 | The activation switch that unlocked modern depth | Still needed init and regularization science to be reliable |
| 2014-2015 · Training science | Adam, dropout, and principled initialization mature the recipe | Training becomes robust and mostly hyperparameter-forgiving | Adam (alpha 0.001), dropout p 0.5, He init sqrt(2/n) | Kingma & Ba ICLR 2015; Srivastava et al. JMLR 2014; He et al. 2015 | The default stack this guide animates | Why some pieces work is still argued (see the BatchNorm debate) |
| Today · Honest open questions | The same loop at billion-parameter scale, with humility required | Networks work; several whys remain contested | Double descent bends the curves; brain-backprop link unresolved | Nakkiran et al. 2019; Lillicrap, Santoro, Marris, Akerman & Hinton 2020 | Reading the field without the folklore | An explainer that hides these caveats is selling, not teaching |

> **Why this guide is unusually careful:** Every fact here survived a two-round, adversarially verified research pass against primary sources: the original 1943 and 1958 papers, the 1986 Nature paper, the Adam and dropout papers, PubMed abstracts for the brain debate. Where the field itself is uncertain (why BatchNorm helps, whether cortex approximates backprop), the guide says **contested** instead of picking a side. The knowledge base with every citation is linked in the sources.

## Questions everyone asks

### How many parameters does this network have, exactly?

13,002. Computed, not quoted: 784x16 + 16x16 + 16x10 = 12,544 + 256 + 160 = **12,960 weights**, plus 16 + 16 + 10 = **42 biases**. The 3D scene draws every one of the 12,960 weight fibers.

### Is a neural network really like a brain?

No, and the caveat has pedigree. Francis Crick wrote in Nature in 1989 that these nets are 'unrealistic in important respects' as brain models. The sharpest problem is backpropagation itself: cortex has no evident mechanism for shipping exact error signals backward. Lillicrap, Santoro, Marris, Akerman and Hinton's 2020 review argues feedback connections may **locally approximate** those signals. Open question; treat 'neural' as branding.

### Who invented backpropagation?

No single person. Reverse-mode differentiation was published by **Linnainmaa in 1970** (for rounding-error analysis, not learning), applied toward networks by **Werbos**, and independently rediscovered and popularized by **Rumelhart, Hinton and Williams in 1986**, whose real headline was representation learning. Saying '1986 invented backprop' fails a history check.

### Why is ReLU such a big deal? It's just max(0, z).

Two reasons. Without any nonlinearity, stacked layers collapse into a single matrix multiply, so depth means nothing. And the saturating curves used before it (sigmoid, tanh) made gradients **vanish** across depth, a failure diagnosed by Hochreiter (1991) and Bengio, Simard and Frasconi (1994). Glorot, Bordes and Bengio showed in 2011 that the rectifier lets deep networks train from scratch, no pre-training required.

### Why cross-entropy loss instead of squared error?

Because of softmax's exp. Goodfellow, Bengio and Courville put it plainly: the **log in the log-likelihood undoes the exp of the softmax**, so gradients survive saturation; squared error 'is a poor loss function for softmax units' because its gradient vanishes exactly when the network is most confidently wrong.

### What does Adam actually do?

It keeps two running memories per parameter: the average gradient (momentum, decay 0.9) and the average squared gradient (decay 0.999), corrects both for starting at zero, and steps each parameter by **alpha times m-hat over sqrt(v-hat)**. The 2015 paper's tested defaults, alpha 0.001, beta1 0.9, beta2 0.999, are still the ones everyone types.

### How accurate does this little network get on MNIST?

Over **96 percent** on the 10,000 held-out test digits, per Nielsen's book, whose 74-line implementation is this exact architecture. For context, he cites the 2013 record of 9,979/10,000 (Wan, Zeiler, Zhang, LeCun, Fergus) and notes a well-tuned SVM exceeds 98.5 percent. Modern convolutional nets essentially saturate the benchmark.

### Does the loss always go down while training?

No. Curves wobble batch to batch, and the **deep double descent** results (Nakkiran et al., 2019) show test error can get worse before better as models grow or train longer; in specific regimes, even adding training data hurts. Distrust any explainer whose curves only glide smoothly downward.

### Can one hidden layer really approximate any function?

Yes, with the fine print the theorem's own authors wrote. Cybenko (1989) and Hornik, Stinchcombe and White (1989) proved **existence**: some width suffices for any continuous function. Hornik's paper explicitly does not say how many units, and blames real-world failures on 'inadequate learning' among other things. The theorem never promised gradient descent would find the solution.

### What do the hidden layers actually learn?

In big convolutional networks, projected visualizations show a real hierarchy: **corners and edge/color pairs in layer 2, textures in layer 3, class-specific parts like dog faces in layer 4** (Zeiler and Fergus, 2013). In this guide's 16-neuron layers, the honest answer is fuzzier brightness templates that defy tidy labels; the clean hierarchy story belongs to CNNs.

## Related on this site

- [How LLMs Work: the same treatment for the transformer that grew out of this machine](https://venkatapagadala.com/guides/how-llms-work)
- [The AI Learning Roadmap: where neural networks sit in an 18-week path](https://venkatapagadala.com/notebook/ai)
- [The AI Concepts Encyclopedia: 176 concepts with definitions and sources](https://venkatapagadala.com/notebook/ai/encyclopedia)

## Sources & further reading

- [3Blue1Brown: But what is a neural network? (Deep learning chapter 1)](https://www.youtube.com/watch?v=aircAruvnKk) · The visual grammar this guide builds on; chapters 1-4 cover network, gradient descent, backprop
- [Nielsen: Neural Networks and Deep Learning (free book)](http://neuralnetworksanddeeplearning.com/) · The 784-16-16-10 network, MNIST facts, and the over-96% figure come from chapter 1
- [Karpathy: Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) · Backprop-first teaching: building micrograd from scratch
- [Deng (2012): The MNIST database of handwritten digit images for machine learning research](https://doi.org/10.1109/MSP.2012.2211477) · IEEE Signal Processing Magazine; the dataset the Train mode really trains on
- [Goodfellow, Bengio & Courville: Deep Learning, ch. 6 (free)](https://www.deeplearningbook.org/contents/mlp.html) · Softmax-with-log-likelihood argument, section 6.2.2.3
- [McCulloch & Pitts (1943): A logical calculus of the ideas immanent in nervous activity](https://doi.org/10.1007/BF02478259) · The 1943 unit: a logic gate, no learning rule
- [Rosenblatt (1958): The perceptron: a probabilistic model](https://doi.org/10.1037/h0042519) · Psychological Review 65(6); a theory paper, not the Mark I machine
- [Cybenko (1989): Approximation by superpositions of a sigmoidal function](https://doi.org/10.1007/BF02551274) · Universal approximation: existence only
- [Hornik, Stinchcombe & White (1989): Multilayer feedforward networks are universal approximators](https://doi.org/10.1016/0893-6080(89)90020-8) · With the authors' own disclaimers about unit counts and learning
- [Rumelhart, Hinton & Williams (1986): Learning representations by back-propagating errors](https://doi.org/10.1038/323533a0) · Nature 323; the popularizing paper, squared-error loss
- [Linnainmaa (1976): Taylor expansion of the accumulated rounding error](https://doi.org/10.1007/BF01931367) · Reverse-mode differentiation, published before backprop was backprop
- [Griewank (2012): Who invented the reverse mode of differentiation?](https://ftp.gwdg.de/pub/misc/EMIS/journals/DMJDMV/vol-ismp/52_griewank-andreas-b.pdf) · The credit history and the cheap gradient principle
- [Baydin, Pearlmutter, Radul & Siskind (2018): Automatic differentiation in ML: a survey](https://arxiv.org/abs/1502.05767) · Backprop as reverse-mode AD; cost bounds
- [Nair & Hinton (2010): Rectified linear units improve restricted Boltzmann machines](https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf) · Noisy ReLUs in RBMs, NORB and LFW gains
- [Glorot, Bordes & Bengio (2011): Deep sparse rectifier neural networks](https://proceedings.mlr.press/v15/glorot11a.html) · Plain ReLU: deep supervised training without pre-training
- [Bengio, Simard & Frasconi (1994): Learning long-term dependencies with gradient descent is difficult](https://doi.org/10.1109/72.279181) · Vanishing gradients, IEEE TNN
- [Hendrycks & Gimpel (2016): Gaussian Error Linear Units](https://arxiv.org/abs/1606.08415) · GELU = x · Phi(x)
- [Bridle (1989): Training stochastic model recognition algorithms as networks](https://proceedings.neurips.cc/paper_files/paper/1989/hash/0336dcbab05b9d5ad24f4333c7658a0e-Abstract.html) · Softmax's entry into neural networks
- [Robbins & Monro (1951): A stochastic approximation method](https://doi.org/10.1214/aoms/1177729586) · The ancestor of SGD
- [Polyak (1964): Some methods of speeding up the convergence of iteration methods](https://doi.org/10.1016/0041-5553(64)90137-5) · Momentum
- [Kingma & Ba (2015): Adam: a method for stochastic optimization](https://arxiv.org/abs/1412.6980) · Algorithm 1 and the defaults quoted in this guide
- [Glorot & Bengio (2010): Understanding the difficulty of training deep feedforward networks](https://proceedings.mlr.press/v9/glorot10a.html) · Normalized initialization, eq. 16
- [He, Zhang, Ren & Sun (2015): Delving deep into rectifiers](https://arxiv.org/abs/1502.01852) · sqrt(2/n) init; 4.94% vs 5.1% human top-5
- [Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov (2014): Dropout](https://jmlr.org/papers/v15/srivastava14a.html) · JMLR 15(56); p values and the test-time scaling rule
- [Zeiler & Fergus (2013): Visualizing and understanding convolutional networks](https://arxiv.org/abs/1311.2901) · The layer-hierarchy evidence, scoped to CNNs
- [Olah, Mordvintsev & Schubert (2017): Feature visualization](https://distill.pub/2017/feature-visualization/) · Distill; what is shown vs interpreted
- [Crick (1989): The recent excitement about neural networks](https://doi.org/10.1038/337129a0) · Nature 337; the canonical brain-model objection
- [Lillicrap, Santoro, Marris, Akerman & Hinton (2020): Backpropagation and the brain](https://doi.org/10.1038/s41583-020-0277-3) · Nature Reviews Neuroscience; the NGRAD reply
- [Nakkiran, Kaplun, Bansal, Yang, Barak & Sutskever (2019): Deep double descent](https://arxiv.org/abs/1912.02292) · Worse before better; more data can hurt
