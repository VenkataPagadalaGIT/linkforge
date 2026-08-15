# How a Neural Network Works: verified knowledge base

Foundation for the 3D explainer. Round 1 of the deep-research harness,
2026-08-15: 109 agents, every claim adversarially verified (3 skeptic votes),
23 of 24 claims passed unanimously. Facts below are safe to build on.
Round 2 (completed 2026-08-15, direct primary-source fetches) covers the
remaining areas; its findings and an explicit could-not-verify list are at
the bottom. The knowledge base is now complete enough to design the 3D
explainer from.

## Verified findings (round 1)

### AREA 1 (McCulloch-Pitts 1943)

AREA 1 (McCulloch-Pitts 1943): The paper's core proposal is that neural events can be treated by propositional logic because of the all-or-none character of nervous activity. The 1943 unit is a binary threshold/logic-gate model with fixed integer thresholds and absolute (veto-style) inhibition, contains NO learning rule, and is not the modern continuous weighted-sum-plus-differentiable-activation unit. The paper claims a realization result: any logical expression satisfying certain conditions can be realized by a corresponding net, including nets with feedback loops ('nets with circles').

Confidence: high
- McCulloch, W.S. & Pitts, W. (1943). A logical calculus of the ideas immanent in nervous activity. Bulletin of Mathematical Biophysics 5:115-133. DOI 10.1007/BF02478259
- https://link.springer.com/article/10.1007/BF02478259

Evidence notes: Verbatim abstract opening: 'Because of the "all-or-none" character of nervous activity, neural events and the relations among them can be treated by means of propositional logic.' Theorem 2 (nets without circles) and Theorem 10 (nets with circles) verified against the paper text. Label as SIMPLIFICATION-BY-CONVENTION: describing the 1943 unit as a 'weighted sum' is itself a modernization; the original uses counts of excitatory synapses vs an integer threshold plus absolute inhibition, not real-valued weights. Label as CONTESTED/HISTORICAL NOTE: the nets-with-circles treatment is sketchy by the authors' own admission and Kleene (1956) redid it after finding an apparent counterexample; cite the circles claim as what the paper CLAIMS, not as a clean proof. Votes 3-0 and 3-0.

### AREA 1 (Rosenblatt 1958, bibliography and nature of the work)

AREA 1 (Rosenblatt 1958, bibliography and nature of the work): Exact anchor is Rosenblatt, F. (1958), 'The perceptron: a probabilistic model for information storage and organization in the brain', Psychological Review 65(6):386-408, DOI 10.1037/h0042519, received April 23, 1958, theoretical work at Cornell Aeronautical Laboratory under ONR Contract Nonr-2381(00). It is a theory paper about a 'hypothetical nervous system', NOT a description of the Mark I perceptron machine (built and demonstrated ca. 1959-1960).

Confidence: high
- Rosenblatt (1958), Psychological Review 65(6):386-408, DOI 10.1037/h0042519
- https://homepages.math.uic.edu/~lreyzin/papers/rosenblatt58.pdf (full scan verified page-by-page)

Evidence notes: Header, page range, '(Received April 23, 1958)', and footnote 1 ('under the sponsorship of the Office of Naval Research, Contract Nonr-2381(00)') all verified against the scanned primary source; p. 387 states 'The theory has been developed for a hypothetical nervous system, or machine, called a perceptron.' Vote 3-0.

### AREA 1 (Rosenblatt 1958, the unit and the learning rule)

AREA 1 (Rosenblatt 1958, the unit and the learning rule): The A-unit is an all-or-nothing threshold unit that fires when the algebraic sum of excitatory and inhibitory impulse intensities reaches threshold theta; it is the direct structural ancestor of the modern weighted-sum-plus-threshold neuron (with ancestral credit shared with McCulloch-Pitts 1943, which originated the threshold-logic form). Critically, the 1958 learning rule is NOT the modern error-correction perceptron rule: it is a value-gain rule (alpha system: an A-unit gains value with activity; the gamma system decays inactive units). The error-corrective rule and the convergence theorem came later: Rosenblatt, Principles of Neurodynamics (1962); Block, Reviews of Modern Physics 34(1) (1962); Novikoff, Proc. Symp. Mathematical Theory of Automata (1962).

Confidence: high
- Rosenblatt (1958), Psychological Review 65(6):386-408, DOI 10.1037/h0042519 (p. 389 threshold mechanism; reinforcement-system table)
- Novikoff (1962), 'On Convergence Proofs on Perceptrons'; Block (1962), Rev. Mod. Phys. 34(1); Rosenblatt (1962), Principles of Neurodynamics

Evidence notes: p. 389 verbatim: 'If the algebraic sum of excitatory and inhibitory impulse intensities is equal to or greater than the threshold (theta) of the A-unit, then the A-unit fires, again on an all-or-nothing basis.' No error-correction rule or convergence theorem appears anywhere in the 1958 paper; independent histories place both in the 1962 works. KB NOTE: 'alpha' is overloaded - it names both the 1958 value-gain system and Block's 1962 'alpha-perceptron' machine class. Votes 3-0 and 3-0.

### AREA 1 (Rosenblatt 1958, the exact headline claim)

AREA 1 (Rosenblatt 1958, the exact headline claim): Conclusion 1 reads verbatim: 'In an environment of random stimuli, a system consisting of randomly connected units, subject to the parametric constraints discussed above, can learn to associate specific responses to specific stimuli.' An adjacent passage (after the ten numbered conclusions, same section, p. 406) claims learning/discrimination/generalization phenomena are predictable from six physical parameters: x, y, theta, omega, N_A, N_R.

Confidence: medium
- Rosenblatt (1958), Psychological Review 65(6), p. 405-406, DOI 10.1037/h0042519

Evidence notes: Verified verbatim against the primary PDF, but the vote was 2-1 (the dissent likely on the conflation of Conclusion 1 with the six-parameter passage, which are two adjacent passages, not one). CITATION GUIDANCE: cite them as two separate passages in the same Conclusions and Evaluation section.

### AREA 2 (Cybenko 1989 universal approximation, exact statement)

AREA 2 (Cybenko 1989 universal approximation, exact statement): Finite linear combinations of compositions of a fixed univariate function with affine functionals can uniformly approximate any continuous function of n real variables with support in the unit hypercube, under only mild conditions on the univariate function (formally: sums of alpha_j * sigma(y_j^T x + theta_j) are dense in C(I_n) for any continuous sigmoidal sigma; 'mild conditions' = continuous sigmoidal in Thm 2 / discriminatory in Thm 1). The paper positions this as settling an open question about REPRESENTABILITY in single-hidden-layer networks; the abstract makes no learnability claim and no unit-count claim ('finite linear combinations' gives no bound).

Confidence: high
- Cybenko, G. (1989). Approximation by Superpositions of a Sigmoidal Function. Mathematics of Control, Signals, and Systems 2(4):303-314. DOI 10.1007/BF02551274
- https://link.springer.com/article/10.1007/BF02551274

Evidence notes: Abstract and theorem statements verified verbatim against the extracted PDF. IMPORTANT FOR THE GUIDE: a companion paraphrase claiming Cybenko proves 'arbitrary decision regions can be approximated' as THE universal approximation result was REFUTED 0-3 - the theorem is about uniform approximation of continuous functions; the decision-region statement is a secondary corollary in the paper and must not be presented as the main theorem. Also note the result is approximation, not exact representation, though Cybenko's own abstract uses the word 'representability'. Votes 3-0 and 3-0.

### AREA 2 (Hornik-Stinchcombe-White 1989, exact statement and its limits)

AREA 2 (Hornik-Stinchcombe-White 1989, exact statement and its limits): Standard multilayer feedforward networks with as few as ONE hidden layer using arbitrary squashing functions can approximate any Borel measurable function between finite-dimensional spaces to any desired accuracy, provided sufficiently many hidden units are available. The paper EXPLICITLY disclaims the practical promises: 'Our results do not address the issue of how many units are needed' and attributes application failures to 'inadequate learning, inadequate numbers of hidden units, or the presence of a stochastic rather than a deterministic relation between input and target' - i.e., an existence result with no learnability guarantee. Exact anchor: Neural Networks 2(5):359-366, DOI 10.1016/0893-6080(89)90020-8; received 16 Sep 1988, revised and accepted 9 Mar 1989.

Confidence: high
- Hornik, K., Stinchcombe, M. & White, H. (1989). Multilayer Feedforward Networks are Universal Approximators. Neural Networks 2(5):359-366. DOI 10.1016/0893-6080(89)90020-8
- https://www.cs.cmu.edu/~epxing/Class/10715/reading/Kornick_et_al.pdf (original scan)

Evidence notes: Abstract and the p. 360 disclaimer passage verified verbatim against the original Pergamon scan; DOI metadata cross-checked via Crossref. This gives the explainer its exact 'what UAT does NOT promise' language in the authors' own words. Votes 3-0 and 3-0.

### AREA 7 (Backpropagation, the canonical paper)

AREA 7 (Backpropagation, the canonical paper): Exact anchor: Rumelhart, D.E., Hinton, G.E. & Williams, R.J., 'Learning representations by back-propagating errors', Nature 323:533-536, 9 October 1986, DOI 10.1038/323533a0. The paper defines backprop as a procedure that 'repeatedly adjusts the weights of the connections in the network so as to minimize a measure of the difference between the actual output vector of the net and the desired output vector' (gradient descent on E = summed squared output-target differences, weight change proportional to -dE/dW). The novelty the authors themselves claimed was NOT the chain-rule math but representation learning: hidden units 'come to represent important features of the task domain', and 'The ability to create useful new features distinguishes back-propagation from earlier, simpler methods such as the perceptron-convergence procedure' - explicit positioning against Rosenblatt-era single-layer learning.

Confidence: high
- Rumelhart, Hinton & Williams (1986). Nature 323:533-536. DOI 10.1038/323533a0
- https://www.nature.com/articles/323533a0

Evidence notes: DOI resolution, Nature article page, and full abstract transcription all verified; the loss in this paper is squared error, not cross-entropy (relevant when the guide contrasts with modern practice). INTERPRETIVE NOTE: 'Rosenblatt-era' is an accurate gloss of 'perceptron-convergence procedure' but the abstract does not name Rosenblatt. Votes 3-0 on all four constituent claims.

### AREA 7 (Credit attribution per the historical record)

AREA 7 (Credit attribution per the historical record): (a) Seppo Linnainmaa conceived reverse-mode differentiation in 1970 (Helsinki master's thesis) as a tool for rounding-error estimation, not learning; English publication only in 1976 (BIT 16(2):146-160, DOI 10.1007/BF01931367); he is 'often cited as the first published description of the reverse mode'. (b) Reverse mode was invented independently multiple times: Griewank documents Ostrowski using it ~5 years before Linnainmaa in chemical-engineering process models, Hachtel et al. using costate-equation gradients for circuit optimization in the 1960s, and Speelpenning (1980) arriving via compiler work and giving the first implementation that was actually automatic; its continuous-time essence is the Pontryagin maximum principle known earlier in control theory (Bryson & Ho 1969). (c) Werbos (1974) cast the method in formal discrete-time terms; his later work (Werbos 1982, per Griewank) was specifically motivated by neural-network backpropagation and compared forward vs reverse propagation including parallel-computation effects. (d) Within ML the method was reinvented several times (e.g., Parker 1985) and brought to fame by Rumelhart et al. 1986 and the PDP group, who learned of Parker's work only after their own independent discovery; so Rumelhart-Hinton-Williams independently discovered and popularized, rather than originated, the algorithm - no single inventor holds sole credit.

Confidence: high
- Griewank, A. (2012). Who Invented the Reverse Mode of Differentiation? Documenta Mathematica, Extra Volume ISMP, 389-400 (working mirror: https://ftp.gwdg.de/pub/misc/EMIS/journals/DMJDMV/vol-ismp/52_griewank-andreas-b.pdf)
- Baydin, Pearlmutter, Radul & Siskind (2018). Automatic differentiation in machine learning: a survey. JMLR 18(153):1-43. arXiv:1502.05767
- Linnainmaa (1976). BIT 16(2):146-160. DOI 10.1007/BF01931367
- Hecht-Nielsen (1989), Neurocomputing (underlying anchor for the Parker/PDP awareness-timing specifics)

Evidence notes: All passages verified verbatim against the Griewank PDF and the extracted arXiv 1502.05767 text; corroborated by Schmidhuber's independent history. CITATION HYGIENE: the emis.de URL for Griewank 2012 is dead (301-redirects); link the ftp.gwdg.de mirror or the ems.press Documenta Mathematica archive. Cite Hecht-Nielsen 1989 for the fine-grained Parker/PDP timing facts. Five constituent claims, all 3-0.

### AREA 7 (Backprop = reverse-mode AD, and its computational cost)

AREA 7 (Backprop = reverse-mode AD, and its computational cost): Backpropagation is a special case of reverse-mode automatic differentiation: applying reverse-mode AD to an objective evaluating a network's error as a function of its weights yields exactly the partial derivatives needed for weight updates. Cost ('cheap gradient principle'): for f: R^n -> R^m, reverse mode computes the full Jacobian in m*c*ops(f) time vs n*c*ops(f) for forward mode, where c < 6 guaranteed and typically ~2-3 (Griewank & Walther 2008); for a scalar loss (m=1) the whole gradient over ALL n weights costs a small constant multiple of ONE forward evaluation, independent of n. Formally OPS{grad f} <= omega * OPS{f}, with omega exactly 3 when counting multiplications of polynomial operations. This does NOT extend to a cheap Jacobian principle, and the bound covers operation count only - reverse mode carries extra memory cost for storing intermediates.

Confidence: high
- Baydin et al. (2018), JMLR 18(153), arXiv:1502.05767 (Section 4.2 and complexity passage, verified verbatim)
- Griewank (2012), Documenta Mathematica ISMP 389-400 (omega=3 and cheap-gradient statements verified verbatim)
- Griewank & Walther (2008), Evaluating Derivatives, 2nd ed., SIAM (underlying textbook anchor; Baur-Strassen theorem)

Evidence notes: This is the verified quantitative anchor for the explainer's 'backprop costs about the same as a forward pass' animation beat: gradient of the scalar loss over all ~13k weights costs roughly 2-3x one forward pass, never more than ~6x, regardless of parameter count. Votes 3-0 on all three constituent claims.

### AREA 8 (BatchNorm - the WHY is contested)

AREA 8 (BatchNorm - the WHY is contested): Santurkar, Tsipras, Ilyas & Madry (2018, NeurIPS; arXiv:1805.11604, v2 subtitled '(No, It Is Not About Internal Covariate Shift)') directly contests Ioffe & Szegedy's 2015 internal-covariate-shift explanation, demonstrating via noise-injection experiments that 'such distributional stability of layer inputs has little to do with the success of BatchNorm.' Their alternative: BatchNorm 'makes the optimization landscape significantly smoother', inducing 'a more predictive and stable behavior of the gradients, allowing for faster training.' Follow-up literature (e.g., 2020 ICS-revisiting work, mean-field analyses arXiv:1902.08129) keeps the question open. An honest explainer must present WHAT BatchNorm does as settled and WHY it helps as contested.

Confidence: high
- Santurkar, Tsipras, Ilyas & Madry (2018). How Does Batch Normalization Help Optimization? NeurIPS 2018. arXiv:1805.11604
- Ioffe & Szegedy (2015). Batch Normalization. arXiv:1502.03167 (the contested claim's origin - note: the Ioffe-Szegedy mechanics themselves were not independently verified in this round)

Evidence notes: Both abstract quotes verified verbatim against arXiv:1805.11604. The smoothness explanation is verified as the PAPER'S claim, not as settled fact - file under CONTESTED/INTERPRETIVE in the guide. Votes 3-0 and 3-0.

### CROSS-CUTTING LISTS FOR THE GUIDE - Simplifications-by-convention (verified as such)

CROSS-CUTTING LISTS FOR THE GUIDE - Simplifications-by-convention (verified as such): (1) calling the 1943 McCulloch-Pitts unit a 'weighted sum' modernizes it; (2) 'Rosenblatt invented the perceptron learning rule' conflates the 1958 value-gain rule with the 1962 error-correction rule; (3) 'Rumelhart-Hinton-Williams invented backprop' should read 'independently discovered and popularized'; (4) UAT statements imply nothing about how many units or whether gradient descent finds the approximation - the Hornik authors say so in their own words. Contested/interpretive claims (verified as contested): (1) why BatchNorm works (ICS vs landscape smoothness); (2) the McCulloch-Pitts nets-with-circles proof (Kleene found it obscure with an apparent counterexample); (3) fine-grained reverse-mode priority (Ostrowski possibly earlier than Linnainmaa, per Griewank).

Confidence: high
- Synthesis of the verified findings above; each item traces to the primary sources already listed

Evidence notes: These are the deliverable's required 'clearly separated' lists, restricted to items the adversarial verification actually established. Items the research question asked to flag but which produced no confirmed claims (biological 'firing' analogy validity, brain-backprop debate and Hinton's commentary, 'the network understands') are NOT included here and remain unverified.

## Verified by computation (not requiring a source)

The 784-16-16-10 network: weights 12544 + 256 + 160 = 12960; biases 42; total parameters 13002. The widely cited 13,002 is exact.

## Verified findings (round 2, 2026-08-15)

Round 2 method note: the workflow's search agents hit the session limit, so
every claim below was verified by direct fetch of the primary source in the
main session (official paper PDFs, publisher pages, PubMed abstracts, the
authors' own hosted files). Each entry names exactly what was fetched.

### AREA A (Activation functions)

- Nair & Hinton 2010, "Rectified Linear Units Improve Restricted Boltzmann
  Machines", ICML 2010. Abstract verified from Hinton's own hosted PDF
  (cs.toronto.edu/~hinton/absps/reluICML.pdf): binary RBM hidden units are
  generalized to infinite weight-tied copies with shifted biases ("Stepped
  Sigmoid Units"), approximated efficiently by NOISY rectified linear units;
  these learned better features for object recognition on NORB and face
  verification on LFW, and "preserve information about relative intensities."
  So the 2010 paper is about RBMs and noisy ReLUs, not plain feedforward nets.
- Glorot, Bordes & Bengio 2011, "Deep Sparse Rectifier Neural Networks",
  AISTATS (PMLR v15). Abstract verified from proceedings.mlr.press: rectifying
  neurons match or beat tanh networks, create "sparse representations with
  true zeros," and let purely supervised deep networks reach good performance
  "without requiring any unsupervised pre-training." This is the paper that
  made plain ReLU the feedforward default.
- Vanishing gradients: Bengio, Simard & Frasconi 1994, "Learning long-term
  dependencies with gradient descent is difficult", IEEE Transactions on
  Neural Networks, DOI 10.1109/72.279181 (title, venue, authors verified via
  Semantic Scholar record for the DOI). Hochreiter 1991,
  "Untersuchungen zu dynamischen neuronalen Netzen", Diplomarbeit, Technische
  Universitat Munchen, dated 15 Juni 1991, supervisor Jurgen Schmidhuber:
  title page verified verbatim from the thesis PDF hosted at
  bioinf.jku.at/publications/older/3804.pdf.
- GELU: Hendrycks & Gimpel 2016, arXiv:1606.08415. Abstract verified: "The
  GELU activation function is x*Phi(x), where Phi(x) [is] the standard
  Gaussian cumulative distribution function"; it weights inputs by magnitude
  rather than gating at zero like ReLU.
- Sigmoid/tanh era: LeCun et al., "Efficient BackProp" (1998). Verified from
  the paper PDF: "Sigmoids that are symmetric about the origin (e.g. ...)
  are preferred for the same reason that inputs should be normalized,
  namely, because they are more likely to produce outputs... " with the
  logistic and tanh named as the standard examples. Safe claim: LeCun's
  Efficient BackProp recommends origin-symmetric sigmoids (tanh family) over
  the plain logistic.

### AREA B (Loss and softmax)

- Softmax provenance: Bridle's NeurIPS 1989 paper "Training Stochastic Model
  Recognition Algorithms as Networks can Lead to Maximum Mutual Information
  Estimation of Parameters" (title verified against proceedings.neurips.cc
  for 1989). Goodfellow et al. chapter 6 itself cites "(Bridle, 1990)" in its
  softmax discussion, verified in the chapter text.
- Why cross-entropy pairs with softmax: verified verbatim from the free
  official chapter 6 text at deeplearningbook.org/contents/mlp.html, section
  6.2.2.3 "Softmax Units for Multinoulli Output Distributions":
  "the log in the log-likelihood can undo the exp of the softmax:
  log softmax(z)_i = z_i - log sum_j exp(z_j)"; and "objective functions that
  do not use a log to undo the exp of the softmax fail to learn when the
  argument to the exp becomes very negative, causing the gradient to vanish.
  In particular, squared error is a poor loss function for softmax units."
  The same section explains softmax saturation (an output saturates toward 1
  when its input is maximal and much larger than the rest, toward 0 in the
  opposite case).
- Goodfellow, Bengio & Courville, Deep Learning, MIT Press 2016, chapter 6
  section spine verified from the same page: 6.1 Example (XOR), 6.2
  Gradient-Based Learning (6.2.1 Cost Functions, 6.2.2 Output Units with
  6.2.2.1 Linear, 6.2.2.2 Sigmoid, 6.2.2.3 Softmax), 6.3 Hidden Units, 6.4
  Architecture Design (6.4.1 Universal Approximation Properties and Depth),
  6.5 Back-Propagation.

### AREA C (Gradient descent family)

- Stochastic approximation: Robbins & Monro 1951, "A Stochastic Approximation
  Method", Annals of Mathematical Statistics 22(3), DOI
  10.1214/aoms/1177729586 (title, year, DOI verified via the Semantic Scholar
  record). The paper gives an iterative scheme that converges in probability
  to the root of a function observable only through noisy measurements; this
  is the ancestral citation for SGD-style updates. (Description of the scheme
  is a standard summary; the theorem statement itself was not re-extracted.)
- Momentum: Polyak 1964, "Some methods of speeding up the convergence of
  iteration methods", USSR Computational Mathematics and Mathematical
  Physics, DOI 10.1016/0041-5553(64)90137-5 (title, year, author, DOI
  verified via the Semantic Scholar record). The heavy-ball formula itself
  is on the could-not-verify list below.
- Adam: Kingma & Ba, ICLR 2015, arXiv:1412.6980. Algorithm 1 verified
  verbatim from the paper PDF:
  - m_t = beta1*m_{t-1} + (1-beta1)*g_t  (biased first moment estimate)
  - v_t = beta2*v_{t-1} + (1-beta2)*g_t^2  (biased second raw moment
    estimate, elementwise square)
  - m_hat = m_t/(1-beta1^t), v_hat = v_t/(1-beta2^t)  (bias correction,
    needed because m and v start at zero and are "biased towards zero,
    especially during the initial timesteps")
  - theta_t = theta_{t-1} - alpha * m_hat / (sqrt(v_hat) + epsilon)
  - "Good default settings for the tested machine learning problems are
    alpha = 0.001, beta1 = 0.9, beta2 = 0.999 and epsilon = 10^-8."
  This also supplies the citable learning-rate anchor: 0.001 is the paper's
  own tested default stepsize.

### AREA D (Initialization and regularization formulas)

- Glorot & Bengio 2010, "Understanding the difficulty of training deep
  feedforward neural networks", AISTATS (PMLR v9). Verified verbatim from
  the official PDF, equation 16, the "normalized initialization":
  W ~ U[-sqrt(6)/sqrt(n_j + n_{j+1}), +sqrt(6)/sqrt(n_j + n_{j+1})],
  derived to keep activation variances and back-propagated gradient
  variances roughly constant across layers (analysis done for tanh-style
  symmetric activations). The paper also shows sigmoid saturation problems
  with random init.
- He et al. 2015, arXiv:1502.01852 ("Delving Deep into Rectifiers").
  Verified verbatim from the PDF: for ReLU, E[x_l^2] = (1/2)Var[y_{l-1}],
  giving the layer condition (1/2) n_l Var[w_l] = 1, i.e. "a zero-mean
  Gaussian distribution whose std is sqrt(2/n_l)". The factor 2 exists
  precisely because ReLU zeroes half the variance. Abstract also verified:
  this init plus PReLU produced 4.94% top-5 ImageNet error, "the first to
  surpass human-level performance (5.1%, Russakovsky et al.)".
- Dropout: Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov 2014,
  JMLR 15(56):1929-1958. Verified verbatim from the JMLR page and PDF:
  training samples a "thinned" network by dropping units with their
  connections; "If a unit is retained with probability p during training,
  the outgoing weights of that unit are multiplied by p at test time",
  which makes the expected training-time output equal the test-time output
  and implicitly averages the 2^n thinned networks. The paper's own MNIST
  setting: "All dropout nets use p = 0.5 for hidden units and p = 0.8 for
  input units" (p here = retention probability). For their SVHN convnet the
  retention schedule was p = (0.9, 0.75, 0.75, 0.5, 0.5, 0.5) from input to
  fully connected layers.

### AREA E (What networks learn / visualization)

- Zeiler & Fergus 2013, "Visualizing and Understanding Convolutional
  Networks", arXiv:1311.2901. Verified verbatim from the PDF: "The
  projections from each layer show the hierarchical nature of the features
  in the network. Layer 2 responds to corners and other edge/color
  conjunctions. Layer 3 has more complex invariances, capturing similar
  textures... Layer 4... more class-specific: dog faces...; bird's legs...",
  and the conclusion claims "compositionality, increasing invariance and
  class discrimination as we ascend the layers." Evidence is for AlexNet-
  style CNNs on ImageNet, NOT for MLPs; scope any hierarchy claim to CNNs.
  Their own caveat example: a layer-5 feature map that looks object-like
  actually fires on background grass.
- Olah, Mordvintsev & Schubert 2017, "Feature Visualization", Distill,
  DOI 10.23915/distill.00007. Verified from distill.pub: optimization-based
  visualizations of GoogLeNet/ImageNet channels; the authors explicitly
  caution that "neurons are not necessarily the right semantic units,"
  that meaningful directions in activation space are an open question, and
  that strong regularization blurs what came from the model vs the prior.
  File the pretty pictures as evidence-plus-interpretation, not proof.

### AREA F (Teaching structure convergence)

- 3Blue1Brown deep learning series, titles verified via YouTube oEmbed
  (author_name 3Blue1Brown): Ch1 "But what is a neural network?", Ch2
  "Gradient descent, how neural networks learn", Ch3 "Backpropagation,
  intuitively", Ch4 "Backpropagation calculus".
- Nielsen, neuralnetworksanddeeplearning.com, chapter list verified from the
  live site: 1 "Using neural nets to recognize handwritten digits", 2 "How
  the backpropagation algorithm works", 3 "Improving the way neural networks
  learn", 4 "A visual proof that neural nets can compute any function",
  5 "Why are deep neural networks hard to train?", 6 "Deep learning".
- Karpathy, Neural Networks: Zero to Hero, order verified from
  karpathy.ai/zero-to-hero.html: 1 "The spelled-out intro to neural networks
  and backpropagation: building micrograd", 2 "The spelled-out intro to
  language modeling: building makemore", 3 "Building makemore Part 2: MLP",
  4 "Building makemore Part 3: Activations & Gradients, BatchNorm".
- Goodfellow ch6 spine as in AREA B.
- CONVERGENCE (interpretive but now grounded): all four go
  network-and-units first, then loss, then gradient descent, then
  backpropagation as its own dedicated act, with training pathologies and
  improvements after. Karpathy inverts emphasis (backprop first via
  micrograd) but keeps backprop as the dedicated act. The 3D explainer's
  stage order should follow: structure, forward pass, loss, gradient
  descent, backprop, then what-networks-learn and what-goes-wrong.

### AREA G (Quantities for honest animation)

- MNIST, verified from Nielsen chapter 1 (which itself restates the official
  MNIST description): 60,000 training images, 10,000 test images, 28 by 28
  pixels, greyscale; writers were 250 people, half US Census Bureau
  employees, half high school students. Nielsen's 74-line network "can
  recognize digits with an accuracy over 96 percent"; chapter 1 also notes
  the then-record (2013) of 9,979 of 10,000 correct (Wan, Zeiler, Zhang,
  LeCun, Fergus) and that a well-tuned SVM reaches above 98.5 percent.
- Together with the round-1 computation: 784-16-16-10 = 13,002 parameters,
  and Adam's alpha = 0.001 default from AREA C, the animation can state
  every number it shows from a source.

### AREA H (Misconceptions, with sources)

- Crick 1989, "The recent excitement about neural networks", Nature
  337:129-132, DOI 10.1038/337129a0. Abstract verified via PubMed
  (PMID 2911347): "The remarkable properties of some recent computer
  algorithms for neural networks seemed to promise a fresh approach to
  understanding the computational properties of the brain. Unfortunately
  most of these neural nets are unrealistic in important respects." This is
  the canonical early objection that backprop-style nets are not brain
  models.
- Lillicrap, Santoro, Marris, Akerman & Hinton 2020, "Backpropagation and
  the brain", Nature Reviews Neuroscience 21:335-346, DOI
  10.1038/s41583-020-0277-3. Abstract verified via PubMed (PMID 32303713):
  backprop "historically... has been viewed as biologically problematic";
  strict backprop needs feedback connections to deliver error signals in a
  way cortex plausibly cannot; the authors "argue that feedback connections
  may instead induce neural activities whose differences can be used to
  locally approximate these signals" (the NGRAD idea). Note Hinton is a
  coauthor: this doubles as his citable position that the brain may
  approximate, not implement, backprop.
- Loss and error are not monotonic: Nakkiran, Kaplun, Bansal, Yang, Barak &
  Sutskever 2019, "Deep Double Descent: Where Bigger Models and More Data
  Hurt", arXiv:1912.02292. Abstract verified: "performance first gets worse
  and then gets better" as model size grows, the same pattern appears in
  training epochs, and there are regimes where "increasing (even
  quadrupling) the number of train samples actually hurts test performance."
  Use this to kill the "more is always better / curves always go down"
  misconception.
- Biological analogy limits: covered jointly by Crick 1989 and Lillicrap
  2020 above, plus the round-1 McCulloch-Pitts finding that even the
  original 1943 "neuron" was a logic gate, not a biological model.

### Round 2 could-not-verify list (explicit)

- Polyak 1964 heavy-ball formula: only title, author, year, journal, DOI
  verified. The update formula was not extracted from the paper (paywalled).
- Robbins & Monro 1951 theorem statement: bibliographic anchor verified;
  the convergence-in-probability description is a standard summary, not a
  fresh extraction.
- Bridle 1990 book-chapter title ("Probabilistic Interpretation of
  Feedforward Classification Network Outputs..."): verified only indirectly
  (Goodfellow ch6 cites Bridle 1990; the NeurIPS 1989 Bridle title is
  verified directly). Treat the exact 1990 chapter wording as unconfirmed.
- LeCun Efficient BackProp's specific 1.7159*tanh(2x/3) recommendation: the
  constant was not found in the extracted text; only the general
  symmetric-sigmoid preference is verified.
- Hinton's standalone public statements (talks/interviews) on backprop and
  the brain: not pinned to a transcript. Use Lillicrap et al. 2020 (Hinton
  as coauthor) instead.
- LeCun's original MNIST page: not fetched; MNIST facts are cited to
  Nielsen's chapter 1 restatement of the official description.