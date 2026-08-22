export type EncyclopediaDifficulty = "beginner" | "intermediate" | "advanced";

export type EncyclopediaCategory =
  | "Core ML Concepts"
  | "Math & Optimization"
  | "Architectures"
  | "NLP & Language"
  | "Computer Vision"
  | "Generative AI"
  | "Reinforcement Learning"
  | "MLOps & Infrastructure"
  | "AI Agents & Applications"
  | "Safety, Ethics & Governance";

export interface EncyclopediaConcept {
  id: string;
  concept: string;
  description: string;
  category: EncyclopediaCategory;
  difficulty: EncyclopediaDifficulty;
  emoji: string;
  keyTerms: string[];
  prerequisites: string[];
  learnMore: { title: string; url: string }[];
  rank: number;
  realWorldApps?: string;
}

export const ENCYCLOPEDIA_CATEGORIES: { label: EncyclopediaCategory; emoji: string; color: string }[] = [
  { label: "Core ML Concepts", emoji: "🧠", color: "#22c55e" },
  { label: "Math & Optimization", emoji: "📐", color: "#3b82f6" },
  { label: "Architectures", emoji: "🏗️", color: "#eab308" },
  { label: "NLP & Language", emoji: "🗣️", color: "#f97316" },
  { label: "Computer Vision", emoji: "👁️", color: "#ef4444" },
  { label: "Generative AI", emoji: "🎨", color: "#a855f7" },
  { label: "Reinforcement Learning", emoji: "🎮", color: "#06b6d4" },
  { label: "MLOps & Infrastructure", emoji: "⚙️", color: "#64748b" },
  { label: "AI Agents & Applications", emoji: "🤖", color: "#ec4899" },
  { label: "Safety, Ethics & Governance", emoji: "🛡️", color: "#14b8a6" },
];

export const encyclopediaConcepts: EncyclopediaConcept[] = [
  {
    id: "artificial-intelligence", concept: "Artificial Intelligence (AI)", emoji: "🧠",
    description: "Software that performs tasks which normally require human judgment: recognizing images, understanding language, ranking results, flagging fraud. There are two ways to build it, hand-written rules or machine learning from examples, and nearly everything called AI today is the learning kind. The term was coined for the 1956 Dartmouth workshop; today's systems are superhuman at many narrow tasks and human-level at no broad ones.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 0,
    keyTerms: ["Narrow AI", "Rules vs learning", "Dartmouth workshop", "Turing test"],
    prerequisites: [],
    learnMore: [
      { title: "Elements of AI (University of Helsinki)", url: "https://www.elementsofai.com/" },
      { title: "The Dartmouth proposal (1955)", url: "http://jmc.stanford.edu/articles/dartmouth.html" },
      { title: "Turing (1950): Computing Machinery and Intelligence", url: "https://doi.org/10.1093/mind/LIX.236.433" },
    ],
    realWorldApps: "Spam filters, maps routing, recommendations, fraud scoring, chat assistants",
  },
  // === Core ML Concepts (1–15) ===
  {
    id: "machine-learning", concept: "Machine Learning (ML)", emoji: "🧠",
    description: "A subset of AI where systems learn patterns from data instead of being explicitly programmed. The three main paradigms are supervised, unsupervised, and reinforcement learning.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 1,
    keyTerms: ["Training data", "Model", "Features", "Labels", "Prediction"],
    prerequisites: [],
    learnMore: [
      { title: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" },
      { title: "Andrew Ng's ML Specialization", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
    ],
    realWorldApps: "Spam filtering, recommendation systems, fraud detection, medical diagnosis",
  },
  {
    id: "supervised-learning", concept: "Supervised Learning", emoji: "🧠",
    description: "Learning from labeled examples, the model sees inputs paired with correct outputs and learns to predict outputs for new inputs. Includes classification and regression. In business language this is predictive AI, the discriminative counterpart of generative AI: it scores and forecasts instead of creating content.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 2,
    keyTerms: ["Labels", "Classification", "Regression", "Training set", "Test set", "Predictive AI"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "StatQuest: Supervised Learning", url: "https://www.youtube.com/watch?v=nKW8Ndu7Mjw" },
    ],
    realWorldApps: "Email spam detection, image classification, price prediction, medical diagnosis",
  },
  {
    id: "unsupervised-learning", concept: "Unsupervised Learning", emoji: "🧠",
    description: "Learning patterns from unlabeled data, the model discovers hidden structure without being told the 'right answer'. Includes clustering, dimensionality reduction, and anomaly detection. A fourth classic task is association-rule mining (Apriori), the market-basket analysis behind frequently-bought-together.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 3,
    keyTerms: ["Clustering", "Dimensionality reduction", "Anomaly detection", "K-Means", "Association rules (Apriori)"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "StatQuest: K-Means Clustering", url: "https://www.youtube.com/watch?v=4b5d3muPQmA" },
    ],
    realWorldApps: "Customer segmentation, anomaly detection, topic modeling, data compression",
  },
  {
    id: "neural-network", concept: "Neural Network", emoji: "🧠",
    description: "A computing system inspired by biological brains, composed of layers of interconnected nodes (neurons). Each connection has a weight that's adjusted during training. The foundation of deep learning. The lineage starts at the 1958 perceptron; stack layers of them and you have the feedforward multilayer perceptron every deep net elaborates.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 4,
    keyTerms: ["Neurons", "Layers", "Weights", "Bias", "Activation function", "Perceptron", "Feedforward MLP"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "3Blue1Brown: Neural Networks", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi" },
      { title: "Neural Networks & Deep Learning · free book", url: "http://neuralnetworksanddeeplearning.com/" },
    ],
    realWorldApps: "Image recognition, speech synthesis, game playing, autonomous vehicles",
  },
  {
    id: "deep-learning", concept: "Deep Learning", emoji: "🧠",
    description: "A subset of ML using neural networks with many layers (hence 'deep'). Excels at learning hierarchical representations from raw data, each layer learns increasingly abstract features.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 5,
    keyTerms: ["Hidden layers", "Feature hierarchy", "Representation learning", "End-to-end learning"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "fast.ai · Practical Deep Learning", url: "https://course.fast.ai/" },
      { title: "Dive into Deep Learning", url: "https://d2l.ai" },
    ],
    realWorldApps: "Self-driving cars, language translation, drug discovery, artistic generation",
  },
  {
    id: "features-labels", concept: "Features & Labels", emoji: "🧠",
    description: "Features are the input variables (columns) used to make predictions. Labels are the output variable (what you're trying to predict). Feature engineering, crafting good inputs, is often more important than the model choice.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 6,
    keyTerms: ["Feature vector", "Target variable", "Feature engineering", "Feature selection"],
    prerequisites: [],
    learnMore: [
      { title: "Google: Feature Engineering", url: "https://developers.google.com/machine-learning/crash-course/numerical-data/normalization" },
    ],
    realWorldApps: "Any ML system, choosing the right features determines model quality",
  },
  {
    id: "overfitting-underfitting", concept: "Overfitting & Underfitting", emoji: "🧠",
    description: "Overfitting: the model memorizes training data but fails on new data (too complex). Underfitting: the model is too simple to capture patterns. The goal is the sweet spot, generalizing well to unseen data.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 7,
    keyTerms: ["Generalization", "Training error", "Validation error", "Model complexity"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "StatQuest: Overfitting & Underfitting", url: "https://www.youtube.com/watch?v=EuBBz3bI-aA" },
    ],
  },
  {
    id: "bias-variance", concept: "Bias-Variance Tradeoff", emoji: "🧠",
    description: "Bias: error from overly simplistic assumptions (underfitting). Variance: error from sensitivity to training data fluctuations (overfitting). The tradeoff is fundamental, reducing one often increases the other. Every architecture also carries an inductive bias, assumptions baked into its structure, like CNNs assuming nearby pixels matter most.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 8,
    keyTerms: ["Bias", "Variance", "Tradeoff", "Model complexity", "Generalization", "Inductive bias"],
    prerequisites: ["Overfitting & Underfitting"],
    learnMore: [
      { title: "StatQuest: Bias-Variance", url: "https://www.youtube.com/watch?v=EuBBz3bI-aA" },
    ],
  },
  {
    id: "classification-regression", concept: "Classification vs Regression", emoji: "🧠",
    description: "Classification predicts discrete categories (spam/not spam, cat/dog). Regression predicts continuous values (price, temperature). The choice depends on whether your output is a category or a number.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 9,
    keyTerms: ["Binary classification", "Multi-class", "Linear regression", "Logistic regression"],
    prerequisites: ["Supervised Learning"],
    learnMore: [
      { title: "StatQuest: Linear Regression", url: "https://www.youtube.com/watch?v=PaFPbb66DxQ" },
    ],
    realWorldApps: "Disease diagnosis (classification), house price prediction (regression)",
  },
  {
    id: "transfer-learning", concept: "Transfer Learning", emoji: "🧠",
    description: "Using a model trained on one task as the starting point for a different task. Instead of training from scratch, you fine-tune a pretrained model, dramatically reducing data and compute requirements. Multi-task learning is the sibling trick: one model trained on several tasks at once, sharing what transfers.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 10,
    keyTerms: ["Pre-training", "Fine-tuning", "Domain adaptation", "Feature extraction", "Multi-task learning"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Transfer Learning · CS231n", url: "https://cs231n.github.io/transfer-learning/" },
    ],
    realWorldApps: "Medical imaging with limited data, NLP with pretrained LLMs, custom image classifiers",
  },
  {
    id: "training-inference", concept: "Training vs Inference", emoji: "🧠",
    description: "Training: the process of learning from data (expensive, slow, uses GPUs). Inference: using the trained model to make predictions (fast, cheap). Understanding this distinction is key to ML economics.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 11,
    keyTerms: ["Training loop", "Forward pass", "Batch size", "Epoch", "Latency"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "NVIDIA: Training vs Inference", url: "https://blogs.nvidia.com/blog/difference-deep-learning-training-inference-ai/" },
    ],
  },
  {
    id: "regularization", concept: "Regularization", emoji: "🧠",
    description: "Techniques to prevent overfitting by adding constraints to the model. L1 (Lasso) drives weights to zero for feature selection. L2 (Ridge) penalizes large weights. Dropout randomly disables neurons during training.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 12,
    keyTerms: ["L1/Lasso", "L2/Ridge", "Dropout", "Early stopping", "Weight decay"],
    prerequisites: ["Overfitting & Underfitting"],
    learnMore: [
      { title: "StatQuest: Regularization", url: "https://www.youtube.com/watch?v=Q81RR3yKn30" },
    ],
  },
  {
    id: "few-shot-zero-shot", concept: "Few-Shot & Zero-Shot Learning", emoji: "🧠",
    description: "Few-shot: learning from just a handful of examples. Zero-shot: performing tasks with no examples, using only a description. LLMs excel at both, GPT-3 showed that scale enables few-shot learning.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 13,
    keyTerms: ["In-context learning", "Prompt engineering", "Meta-learning", "Generalization"],
    prerequisites: ["Transfer Learning"],
    learnMore: [
      { title: "GPT-3 Paper: Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165" },
    ],
    realWorldApps: "Chatbots answering novel questions, classifying with minimal labeled data",
  },
  {
    id: "linear-regression", concept: "Linear Regression", emoji: "🧠",
    description: "The simplest ML model, fits a straight line (or hyperplane) through data points to predict a continuous value. Despite its simplicity, it's the starting point for understanding all regression models.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 14,
    keyTerms: ["Slope", "Intercept", "Least squares", "R-squared", "Coefficients"],
    prerequisites: [],
    learnMore: [
      { title: "StatQuest: Linear Regression", url: "https://www.youtube.com/watch?v=PaFPbb66DxQ" },
    ],
  },
  {
    id: "semi-supervised", concept: "Semi-Supervised Learning", emoji: "🧠",
    description: "A hybrid approach using a small amount of labeled data with a large amount of unlabeled data. Leverages the structure in unlabeled data to improve learning, practical when labeling is expensive.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 15,
    keyTerms: ["Pseudo-labels", "Self-training", "Consistency regularization"],
    prerequisites: ["Supervised Learning", "Unsupervised Learning"],
    learnMore: [
      { title: "scikit-learn: Semi-Supervised Learning", url: "https://scikit-learn.org/stable/modules/semi_supervised.html" },
    ],
  },

  // === Math & Optimization (16–25) ===
  {
    id: "gradient-descent", concept: "Gradient Descent", emoji: "📐",
    description: "The fundamental optimization algorithm for training neural networks. It iteratively adjusts model parameters in the direction that reduces the loss function, like walking downhill to find the valley. Convex problems have a single global minimum, which is why classical optimization loved them; deep networks are wildly non-convex and work anyway.",
    category: "Math & Optimization", difficulty: "beginner", rank: 16,
    keyTerms: ["Learning rate", "Stochastic gradient descent (SGD)", "Minibatch", "Convergence", "Convexity"],
    prerequisites: [],
    learnMore: [
      { title: "3Blue1Brown: Gradient Descent", url: "https://www.youtube.com/watch?v=IHZwWFHWa-w" },
    ],
  },
  {
    id: "backpropagation", concept: "Backpropagation", emoji: "📐",
    description: "The algorithm for computing gradients in neural networks by propagating errors backward through layers. Popularized by Hinton in 1986, it's the engine that makes deep learning possible.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 17,
    keyTerms: ["Chain rule", "Computational graph", "Gradient flow", "Autograd"],
    prerequisites: ["Gradient Descent", "Neural Network"],
    learnMore: [
      { title: "3Blue1Brown: Backpropagation", url: "https://www.youtube.com/watch?v=Ilg3gGewQ5U" },
      { title: "Karpathy: Backprop Ninja", url: "https://www.youtube.com/watch?v=q8SA3rM6ckI" },
    ],
  },
  {
    id: "loss-function", concept: "Loss Function", emoji: "📐",
    description: "A function that measures how wrong the model's predictions are. Training = minimizing the loss. Common losses: MSE (regression), cross-entropy (classification), contrastive (embeddings). The formal name for training-by-average-loss is empirical risk minimization.",
    category: "Math & Optimization", difficulty: "beginner", rank: 18,
    keyTerms: ["MSE", "Cross-entropy", "Contrastive loss", "Objective function", "Empirical risk minimization"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "StatQuest: Cross Entropy", url: "https://www.youtube.com/watch?v=6ArSys5qHAU" },
    ],
  },
  {
    id: "activation-functions", concept: "Activation Functions", emoji: "📐",
    description: "Non-linear functions applied to neuron outputs, they give neural networks the ability to learn complex patterns. ReLU, Sigmoid, Tanh, GELU, and Swish are the most common.",
    category: "Math & Optimization", difficulty: "beginner", rank: 19,
    keyTerms: ["ReLU", "Sigmoid", "Tanh", "GELU", "Vanishing gradient"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "StatQuest: ReLU", url: "https://www.youtube.com/watch?v=68BZ5f7P94Q" },
    ],
  },
  {
    id: "embeddings", concept: "Embeddings", emoji: "📐",
    description: "Dense vector representations that capture semantic meaning. Words, images, and even users can be embedded into continuous vector spaces where similar items are close together.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 20,
    keyTerms: ["Word2Vec", "GloVe", "Embedding space", "Cosine similarity", "Dimensionality"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "Jay Alammar: Illustrated Word2Vec", url: "https://jalammar.github.io/illustrated-word2vec/" },
    ],
    realWorldApps: "Search engines, recommendation systems, RAG, semantic similarity",
  },
  {
    id: "dimensionality-reduction", concept: "Dimensionality Reduction", emoji: "📐",
    description: "Reducing the number of features while preserving important information. PCA, t-SNE, and UMAP are the main techniques, essential for visualization and fighting the curse of dimensionality. LDA is the supervised counterpart: it projects using class labels, where PCA ignores them.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 21,
    keyTerms: ["PCA", "t-SNE", "UMAP", "Curse of dimensionality", "Feature compression", "LDA (Linear Discriminant Analysis)"],
    prerequisites: ["Unsupervised Learning"],
    learnMore: [
      { title: "StatQuest: PCA", url: "https://www.youtube.com/watch?v=FgakZw6K1QQ" },
    ],
  },
  {
    id: "feature-engineering", concept: "Feature Engineering", emoji: "📐",
    description: "The art of creating, transforming, and selecting input features to improve model performance. Often more impactful than model choice, 'garbage in, garbage out' applies doubly to ML. Feature selection is its own toolkit: filter methods score features statistically, wrappers like RFE search subsets, and embedded methods like L1 select while training. Imputation, filling missing values sensibly, is the unglamorous step most real datasets need first.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 22,
    keyTerms: ["Feature scaling", "One-hot encoding", "Feature crosses", "Polynomial features", "Feature selection", "RFE & mutual information", "Missing-value imputation"],
    prerequisites: ["Features & Labels"],
    learnMore: [
      { title: "Kaggle: Feature Engineering", url: "https://www.kaggle.com/learn/feature-engineering" },
    ],
  },
  {
    id: "k-means", concept: "K-Means Clustering", emoji: "📐",
    description: "The simplest clustering algorithm, assigns data points to K groups by iteratively moving cluster centers to minimize within-cluster distances. Fast, intuitive, but requires choosing K upfront. It is one member of a family: hierarchical clustering builds a dendrogram of merges, DBSCAN finds arbitrary shapes by density, and Gaussian mixtures soften assignments via EM.",
    category: "Math & Optimization", difficulty: "beginner", rank: 23,
    keyTerms: ["Centroids", "Elbow method", "Inertia", "K selection", "Hierarchical clustering", "DBSCAN", "Gaussian mixtures & EM", "Spectral clustering"],
    prerequisites: ["Unsupervised Learning"],
    learnMore: [
      { title: "StatQuest: K-Means", url: "https://www.youtube.com/watch?v=4b5d3muPQmA" },
    ],
  },
  {
    id: "anomaly-detection", concept: "Anomaly Detection", emoji: "📐",
    description: "Identifying rare, unusual data points that differ significantly from the majority. Critical for fraud detection, cybersecurity, manufacturing defects, and health monitoring.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 24,
    keyTerms: ["Outlier", "Isolation Forest", "Autoencoder", "Statistical threshold"],
    prerequisites: ["Unsupervised Learning"],
    learnMore: [
      { title: "scikit-learn: Anomaly Detection", url: "https://scikit-learn.org/stable/modules/outlier_detection.html" },
    ],
    realWorldApps: "Credit card fraud, network intrusion, equipment failure prediction",
  },
  {
    id: "boosting", concept: "Boosting (XGBoost, LightGBM)", emoji: "📐",
    description: "An ensemble technique that combines many weak learners (usually decision trees) sequentially, with each new tree correcting the errors of previous ones. XGBoost and LightGBM dominate Kaggle competitions.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 25,
    keyTerms: ["Gradient boosting", "XGBoost", "LightGBM", "CatBoost", "Ensemble"],
    prerequisites: ["Supervised Learning"],
    learnMore: [
      { title: "StatQuest: XGBoost", url: "https://www.youtube.com/watch?v=OtD8wVaFm6E" },
    ],
    realWorldApps: "Tabular data competitions, ranking systems, click prediction",
  },

  // === Architectures (26–40) ===
  {
    id: "transformer", concept: "Transformer Architecture", emoji: "🏗️",
    description: "THE architecture that changed everything (2017). Uses self-attention to process sequences in parallel, replacing RNNs. Foundation of GPT, BERT, and virtually every modern AI system.",
    category: "Architectures", difficulty: "intermediate", rank: 26,
    keyTerms: ["Self-attention", "Multi-head attention", "Positional encoding", "Encoder-decoder"],
    prerequisites: ["Neural Network", "Attention Mechanism"],
    learnMore: [
      { title: "The Illustrated Transformer · Jay Alammar", url: "https://jalammar.github.io/illustrated-transformer/" },
      { title: "Attention Is All You Need (paper)", url: "https://arxiv.org/abs/1706.03762" },
    ],
  },
  {
    id: "attention-mechanism", concept: "Attention Mechanism", emoji: "🏗️",
    description: "A technique allowing models to focus on relevant parts of input when producing output. Self-attention (in Transformers) lets each position attend to all other positions in a sequence.",
    category: "Architectures", difficulty: "intermediate", rank: 27,
    keyTerms: ["Query", "Key", "Value", "Attention weights", "Softmax"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "Jay Alammar: Illustrated Attention", url: "https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/" },
    ],
  },
  {
    id: "self-attention", concept: "Self-Attention", emoji: "🏗️",
    description: "A special case of attention where a sequence attends to itself, each token computes relationships with every other token. This is the core mechanism powering Transformers.",
    category: "Architectures", difficulty: "intermediate", rank: 28,
    keyTerms: ["QKV matrices", "Attention score", "Multi-head", "Causal masking"],
    prerequisites: ["Attention Mechanism"],
    learnMore: [
      { title: "Karpathy: Let's build GPT", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY" },
    ],
  },
  {
    id: "cnn", concept: "Convolutional Neural Network (CNN)", emoji: "🏗️",
    description: "Architecture designed for grid-like data (images). Uses learned filters (kernels) to detect features at different scales, edges → textures → objects. Revolutionized computer vision.",
    category: "Architectures", difficulty: "intermediate", rank: 29,
    keyTerms: ["Convolution", "Kernel", "Pooling", "Feature map", "Stride"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "CNN Explainer · Interactive Visualization", url: "https://poloclub.github.io/cnn-explainer/" },
      { title: "Stanford CS231n", url: "https://cs231n.github.io/" },
    ],
  },
  {
    id: "rnn", concept: "Recurrent Neural Network (RNN)", emoji: "🏗️",
    description: "Architecture for sequential data that maintains a hidden state across time steps. Suffers from vanishing gradients for long sequences, largely replaced by Transformers but still relevant for understanding.",
    category: "Architectures", difficulty: "intermediate", rank: 30,
    keyTerms: ["Hidden state", "Vanishing gradient", "Sequence-to-sequence", "Time steps"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "Colah: Understanding LSTMs", url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/" },
    ],
  },
  {
    id: "lstm", concept: "LSTM (Long Short-Term Memory)", emoji: "🏗️",
    description: "An RNN variant that solves the vanishing gradient problem using gates (forget, input, output) that control information flow. Was the dominant sequence architecture before Transformers.",
    category: "Architectures", difficulty: "intermediate", rank: 31,
    keyTerms: ["Forget gate", "Input gate", "Output gate", "Cell state", "GRU"],
    prerequisites: ["Recurrent Neural Network (RNN)"],
    learnMore: [
      { title: "Colah: Understanding LSTMs (MUST READ)", url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/" },
    ],
  },
  {
    id: "gpt", concept: "GPT (Generative Pre-trained Transformer)", emoji: "🏗️",
    description: "A decoder-only Transformer trained to predict the next token. Each GPT generation, from GPT-1 through GPT-5 and beyond, showed that scaling this simple idea produces increasingly capable AI. The architecture behind ChatGPT.",
    category: "Architectures", difficulty: "intermediate", rank: 32,
    keyTerms: ["Autoregressive", "Next-token prediction", "Decoder-only", "Scaling laws"],
    prerequisites: ["Transformer Architecture"],
    learnMore: [
      { title: "Jay Alammar: Illustrated GPT-2", url: "https://jalammar.github.io/illustrated-gpt2/" },
      { title: "Karpathy: nanoGPT", url: "https://github.com/karpathy/nanoGPT" },
    ],
  },
  {
    id: "bert", concept: "BERT (Bidirectional Encoder)", emoji: "🏗️",
    description: "An encoder-only Transformer that reads text bidirectionally (both left-to-right and right-to-left). Trained with masked language modeling. Still a workhorse for cheap, high-volume classification, extraction, and retrieval, where a small encoder beats paying for a generative model.",
    category: "Architectures", difficulty: "intermediate", rank: 33,
    keyTerms: ["Masked language modeling", "Encoder-only", "Bidirectional context", "Fine-tuning"],
    prerequisites: ["Transformer Architecture"],
    learnMore: [
      { title: "Jay Alammar: Illustrated BERT", url: "https://jalammar.github.io/illustrated-bert/" },
    ],
    realWorldApps: "Google Search, sentiment analysis, document classification, question answering",
  },
  {
    id: "ssm-mamba", concept: "State Space Models (Mamba)", emoji: "🏗️",
    description: "An alternative to Transformers that processes sequences with linear-time complexity instead of quadratic attention. Mamba and S4 are the foundational SSM architectures, and hybrid attention-SSM designs now appear in production models, offering advantages for very long sequences.",
    category: "Architectures", difficulty: "advanced", rank: 34,
    keyTerms: ["Linear complexity", "Selective SSM", "S4", "Long-range dependencies"],
    prerequisites: ["Transformer Architecture"],
    learnMore: [
      { title: "Mamba Paper", url: "https://arxiv.org/abs/2312.00752" },
    ],
  },
  {
    id: "vision-transformer", concept: "Vision Transformer (ViT)", emoji: "🏗️",
    description: "Applying the Transformer architecture to images by splitting them into patches and treating each patch as a token. Showed that attention can match or exceed CNNs for vision tasks at scale.",
    category: "Architectures", difficulty: "advanced", rank: 35,
    keyTerms: ["Patch embedding", "Position embedding", "CLS token", "Image patches"],
    prerequisites: ["Transformer Architecture", "Convolutional Neural Network (CNN)"],
    learnMore: [
      { title: "ViT Paper · An Image is Worth 16x16 Words", url: "https://arxiv.org/abs/2010.11929" },
    ],
  },
  {
    id: "multimodal-models", concept: "Multimodal Models", emoji: "🏗️",
    description: "AI models that process multiple types of data, text, images, audio, video, simultaneously. Today's frontier models from OpenAI, Google, and Anthropic are all natively multimodal; text-only models are the exception, not the rule.",
    category: "Architectures", difficulty: "advanced", rank: 36,
    keyTerms: ["Cross-modal attention", "Vision-language", "Contrastive learning", "CLIP"],
    prerequisites: ["Transformer Architecture"],
    learnMore: [
      { title: "CLIP Paper · OpenAI", url: "https://arxiv.org/abs/2103.00020" },
    ],
    realWorldApps: "Image captioning, visual Q&A, document understanding, video analysis",
  },
  {
    id: "knowledge-distillation", concept: "Knowledge Distillation", emoji: "🏗️",
    description: "Training a smaller 'student' model to mimic a larger 'teacher' model's behavior. The student learns from the teacher's soft outputs (probabilities), capturing knowledge that's lost with hard labels alone.",
    category: "Architectures", difficulty: "advanced", rank: 37,
    keyTerms: ["Teacher model", "Student model", "Soft labels", "Temperature scaling"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Distilling the Knowledge in a Neural Network · Hinton", url: "https://arxiv.org/abs/1503.02531" },
    ],
  },
  {
    id: "quantization", concept: "Model Quantization & Compression", emoji: "🏗️",
    description: "Reducing model size and computational cost by using lower-precision numbers (e.g., 32-bit → 4-bit floats). Enables running LLMs on consumer hardware. GPTQ, GGUF, and AWQ are popular methods.",
    category: "Architectures", difficulty: "advanced", rank: 38,
    keyTerms: ["INT8", "INT4", "GPTQ", "GGUF", "AWQ", "Mixed precision"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Hugging Face: Quantization Guide", url: "https://huggingface.co/docs/transformers/quantization" },
    ],
    realWorldApps: "Running LLMs locally, mobile AI, edge deployment",
  },
  {
    id: "nas", concept: "Neural Architecture Search (NAS)", emoji: "🏗️",
    description: "Using AI to design AI architectures. Instead of hand-designing networks, NAS automatically searches for optimal architectures, the meta approach to building neural networks. Evolutionary search, mutating and selecting architectures, was an early NAS engine and still wins where gradients cannot go.",
    category: "Architectures", difficulty: "advanced", rank: 39,
    keyTerms: ["Search space", "Controller", "Reinforcement learning NAS", "EfficientNet", "Evolutionary search"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Neural Architecture Search · Google AI Blog", url: "https://research.google/blog/using-machine-learning-to-explore-neural-network-architecture/" },
    ],
  },
  {
    id: "neuro-symbolic", concept: "Neuro-Symbolic AI", emoji: "🏗️",
    description: "Combining neural networks (learning from data) with symbolic AI (logical reasoning). Aims to get the best of both worlds, learning ability plus interpretable, compositional reasoning.",
    category: "Architectures", difficulty: "advanced", rank: 40,
    keyTerms: ["Symbolic reasoning", "Knowledge graphs", "Logical rules", "Hybrid systems"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "Gary Marcus: The Next Decade in AI", url: "https://arxiv.org/abs/2002.06177" },
    ],
  },

  // === NLP & Language (41–55) ===
  {
    id: "nlp", concept: "Natural Language Processing (NLP)", emoji: "🗣️",
    description: "The branch of AI focused on enabling computers to understand, interpret, and generate human language. Encompasses tasks from sentiment analysis to machine translation to question answering. Two umbrella terms live underneath: understanding (NLU) versus generation (NLG), plus text mining, the enterprise word for extracting signal from document piles.",
    category: "NLP & Language", difficulty: "beginner", rank: 41,
    keyTerms: ["Tokenization", "Parsing", "NER", "Sentiment analysis", "Machine translation", "NLU & NLG", "Text mining"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "Hugging Face NLP Course (Free)", url: "https://huggingface.co/learn/llm-course" },
      { title: "Stanford CS224n", url: "https://web.stanford.edu/class/cs224n/" },
    ],
  },
  {
    id: "tokenization", concept: "Tokenization", emoji: "🗣️",
    description: "Breaking text into smaller units (tokens) for processing. Modern tokenizers use subword methods (BPE, SentencePiece), 'unhappiness' → ['un', 'happiness']. Token count determines cost and context window usage. Classical pipelines normalized words first: stemming crudely chops endings, lemmatization maps to dictionary forms; subword tokenizers made most of that unnecessary.",
    category: "NLP & Language", difficulty: "beginner", rank: 42,
    keyTerms: ["BPE", "SentencePiece", "WordPiece", "Token", "Vocabulary", "Stemming & lemmatization"],
    prerequisites: ["Natural Language Processing (NLP)"],
    learnMore: [
      { title: "Hugging Face: Tokenizers", url: "https://huggingface.co/learn/llm-course/chapter6/1" },
    ],
  },
  {
    id: "word2vec", concept: "Word2Vec & Word Embeddings", emoji: "🗣️",
    description: "Representing words as dense vectors where semantic relationships are captured geometrically. The famous result: king - man + woman ≈ queen. Predecessor to modern embeddings used in LLMs. Before neural embeddings, LSA reached similar ground statistically by factorizing the term-document matrix with SVD.",
    category: "NLP & Language", difficulty: "intermediate", rank: 43,
    keyTerms: ["Skip-gram", "CBOW", "GloVe", "Cosine similarity", "Embedding space", "LSA (latent semantic analysis)"],
    prerequisites: ["Embeddings"],
    learnMore: [
      { title: "Jay Alammar: Illustrated Word2Vec", url: "https://jalammar.github.io/illustrated-word2vec/" },
    ],
  },
  {
    id: "prompt-engineering", concept: "Prompt Engineering", emoji: "🗣️",
    description: "The art and science of crafting inputs to LLMs to get optimal outputs. Techniques include zero-shot, few-shot, chain-of-thought, ReAct, and system prompts. One of the most practical everyday AI skills.",
    category: "NLP & Language", difficulty: "beginner", rank: 44,
    keyTerms: ["Zero-shot", "Few-shot", "Chain-of-thought", "System prompt", "Temperature"],
    prerequisites: [],
    learnMore: [
      { title: "Anthropic Prompt Engineering Guide", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview" },
      { title: "OpenAI Prompt Engineering Guide", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
    ],
    realWorldApps: "Every interaction with ChatGPT, Claude, Gemini, it's the universal AI interface",
  },
  {
    id: "rag", concept: "Retrieval-Augmented Generation (RAG)", emoji: "🗣️",
    description: "Combining LLMs with external knowledge retrieval. Instead of relying solely on training data, RAG retrieves relevant documents and passes them to the LLM, reducing hallucinations and adding current information. Contextual retrieval prepends document context to each chunk before embedding, a simple fix for chunks that lose their meaning alone.",
    category: "NLP & Language", difficulty: "intermediate", rank: 45,
    keyTerms: ["Retriever", "Generator", "Vector search", "Chunking", "Context window", "Contextual retrieval"],
    prerequisites: ["Embeddings", "Transformer Architecture"],
    learnMore: [
      { title: "RAG Paper · Meta", url: "https://arxiv.org/abs/2005.11401" },
      { title: "LangChain RAG Tutorial", url: "https://docs.langchain.com/oss/python/deepagents/rag" },
    ],
    realWorldApps: "Enterprise chatbots, document Q&A, customer support, legal research",
  },
  {
    id: "fine-tuning", concept: "Fine-Tuning LLMs", emoji: "🗣️",
    description: "Adapting a pretrained LLM to a specific task or domain by training on additional data. LoRA and QLoRA enable efficient fine-tuning by only updating a small fraction of parameters.",
    category: "NLP & Language", difficulty: "advanced", rank: 46,
    keyTerms: ["LoRA", "QLoRA", "PEFT", "Instruction tuning", "Adapter layers"],
    prerequisites: ["Transfer Learning", "Transformer Architecture"],
    learnMore: [
      { title: "LoRA Paper", url: "https://arxiv.org/abs/2106.09685" },
      { title: "Hugging Face PEFT", url: "https://huggingface.co/docs/peft" },
    ],
  },
  {
    id: "chain-of-thought", concept: "Chain-of-Thought Reasoning", emoji: "🗣️",
    description: "A prompting technique where the model 'shows its work' by reasoning step-by-step before answering. Dramatically improves performance on math, logic, and complex reasoning tasks.",
    category: "NLP & Language", difficulty: "intermediate", rank: 47,
    keyTerms: ["Step-by-step reasoning", "Scratchpad", "Tree-of-thought", "Self-consistency"],
    prerequisites: ["Prompt Engineering"],
    learnMore: [
      { title: "Chain-of-Thought Paper · Google (2022)", url: "https://arxiv.org/abs/2201.11903" },
    ],
  },
  {
    id: "vector-databases", concept: "Vector Databases", emoji: "🗣️",
    description: "Specialized databases optimized for storing and searching high-dimensional vectors (embeddings). Enable fast similarity search, the backbone of RAG, recommendation systems, and semantic search.",
    category: "NLP & Language", difficulty: "intermediate", rank: 48,
    keyTerms: ["HNSW", "ANN search", "Cosine similarity", "Pinecone", "ChromaDB", "Weaviate"],
    prerequisites: ["Embeddings"],
    learnMore: [
      { title: "Pinecone: What are Vector Databases?", url: "https://www.pinecone.io/learn/vector-database/" },
    ],
    realWorldApps: "RAG systems, recommendation engines, image search, semantic search",
  },
  {
    id: "llm-scaling", concept: "LLM Scaling Laws", emoji: "🗣️",
    description: "The empirical finding that LLM performance improves predictably with more data, compute, and parameters. Chinchilla scaling laws (2022) showed that most models were undertrained relative to their size.",
    category: "NLP & Language", difficulty: "advanced", rank: 49,
    keyTerms: ["Chinchilla", "Compute-optimal", "Emergent abilities", "Power law"],
    prerequisites: ["GPT (Generative Pre-trained Transformer)"],
    learnMore: [
      { title: "Chinchilla Paper · DeepMind", url: "https://arxiv.org/abs/2203.15556" },
    ],
  },
  {
    id: "rlhf", concept: "RLHF (Reinforcement Learning from Human Feedback)", emoji: "🗣️",
    description: "The technique that made ChatGPT helpful and safe. Trains a reward model on human preferences, then optimizes the LLM against it. The key ingredient between a base model and a useful assistant.",
    category: "NLP & Language", difficulty: "advanced", rank: 50,
    keyTerms: ["Reward model", "PPO", "Preference data", "Constitutional AI", "DPO"],
    prerequisites: ["Fine-Tuning LLMs", "Reinforcement Learning (RL)"],
    learnMore: [
      { title: "InstructGPT Paper · OpenAI", url: "https://arxiv.org/abs/2203.02155" },
      { title: "Hugging Face TRL", url: "https://huggingface.co/docs/trl" },
    ],
  },
  {
    id: "context-window", concept: "Context Window & Long Context", emoji: "🗣️",
    description: "The maximum number of tokens an LLM can process at once. A window of roughly one million tokens is now standard at the frontier, with a few models advertising ten million. That is enough for entire codebases or books, but effective recall degrades well before the advertised limit, so the usable window is usually much smaller than the number on the spec sheet. Long context has a known failure mode: models attend best to the start and end of the window, the lost-in-the-middle effect.",
    category: "NLP & Language", difficulty: "intermediate", rank: 51,
    keyTerms: ["Token limit", "Context length", "Needle-in-a-haystack", "KV cache", "Lost-in-the-middle"],
    prerequisites: ["Tokenization", "Transformer Architecture"],
    learnMore: [
      { title: "Anthropic: Long Context", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows" },
    ],
  },
  {
    id: "text-generation", concept: "Text Generation & Sampling", emoji: "🗣️",
    description: "How LLMs produce text, sampling from probability distributions over tokens. Temperature controls randomness. Top-k and top-p (nucleus) sampling balance creativity and coherence.",
    category: "NLP & Language", difficulty: "intermediate", rank: 52,
    keyTerms: ["Temperature", "Top-k", "Top-p (nucleus)", "Beam search", "Greedy decoding"],
    prerequisites: ["GPT (Generative Pre-trained Transformer)"],
    learnMore: [
      { title: "Hugging Face: Text Generation", url: "https://huggingface.co/blog/how-to-generate" },
    ],
  },
  {
    id: "sentiment-analysis", concept: "Sentiment Analysis", emoji: "🗣️",
    description: "Determining the emotional tone of text, positive, negative, or neutral. One of the most common NLP applications. Modern approaches use fine-tuned BERT or zero-shot LLMs.",
    category: "NLP & Language", difficulty: "beginner", rank: 53,
    keyTerms: ["Polarity", "Aspect-based", "Opinion mining", "Valence"],
    prerequisites: ["Natural Language Processing (NLP)"],
    learnMore: [
      { title: "Hugging Face: Sentiment Analysis", url: "https://huggingface.co/tasks/text-classification" },
    ],
    realWorldApps: "Brand monitoring, product reviews, social media analysis, customer feedback",
  },
  {
    id: "machine-translation", concept: "Machine Translation", emoji: "🗣️",
    description: "Automatically translating text between languages. Evolved from rule-based → statistical → neural (seq2seq) → Transformer-based. Google Translate and DeepL use Transformer architectures.",
    category: "NLP & Language", difficulty: "intermediate", rank: 54,
    keyTerms: ["Seq2seq", "BLEU score", "Encoder-decoder", "Parallel corpus"],
    prerequisites: ["Transformer Architecture"],
    learnMore: [
      { title: "Jay Alammar: Seq2Seq with Attention", url: "https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/" },
    ],
  },
  {
    id: "named-entity", concept: "Named Entity Recognition (NER)", emoji: "🗣️",
    description: "Identifying and classifying named entities in text, persons, organizations, locations, dates, etc. A fundamental NLP task used in information extraction, search, and knowledge graphs.",
    category: "NLP & Language", difficulty: "intermediate", rank: 55,
    keyTerms: ["Entity types", "BIO tagging", "SpaCy", "Token classification"],
    prerequisites: ["Natural Language Processing (NLP)"],
    learnMore: [
      { title: "spaCy NER Tutorial", url: "https://spacy.io/usage/linguistic-features#named-entities" },
    ],
    realWorldApps: "Document processing, search engines, news analysis, compliance",
  },

  // === Computer Vision (56–65) ===
  {
    id: "image-classification", concept: "Image Classification", emoji: "👁️",
    description: "Assigning a label to an entire image. The task that started the deep learning revolution, AlexNet won ImageNet 2012 by a huge margin, proving deep learning works.",
    category: "Computer Vision", difficulty: "beginner", rank: 56,
    keyTerms: ["ImageNet", "Top-5 accuracy", "Softmax", "ResNet", "EfficientNet"],
    prerequisites: ["Convolutional Neural Network (CNN)"],
    learnMore: [
      { title: "Kaggle: Computer Vision", url: "https://www.kaggle.com/learn/computer-vision" },
    ],
  },
  {
    id: "object-detection", concept: "Object Detection", emoji: "👁️",
    description: "Locating and classifying multiple objects within an image with bounding boxes. YOLO (You Only Look Once) made real-time detection practical. Used in autonomous driving, security, and robotics.",
    category: "Computer Vision", difficulty: "intermediate", rank: 57,
    keyTerms: ["Bounding box", "IoU", "YOLO", "Anchor boxes", "Non-max suppression"],
    prerequisites: ["Convolutional Neural Network (CNN)"],
    learnMore: [
      { title: "Ultralytics YOLO Docs", url: "https://docs.ultralytics.com/" },
    ],
    realWorldApps: "Self-driving cars, surveillance, retail analytics, medical imaging",
  },
  {
    id: "semantic-segmentation", concept: "Semantic Segmentation", emoji: "👁️",
    description: "Classifying every pixel in an image, assigning each pixel to a category. More granular than object detection. Used in autonomous driving, medical imaging, and satellite imagery.",
    category: "Computer Vision", difficulty: "intermediate", rank: 58,
    keyTerms: ["Pixel-wise classification", "U-Net", "Mask", "Instance segmentation"],
    prerequisites: ["Convolutional Neural Network (CNN)"],
    learnMore: [
      { title: "Papers With Code: Segmentation", url: "https://huggingface.co/tasks/image-segmentation" },
    ],
  },
  {
    id: "yolo", concept: "YOLO (You Only Look Once)", emoji: "👁️",
    description: "A real-time object detection system that processes the entire image in a single forward pass. The family is updated almost yearly (YOLOv8, YOLO11, YOLO26 and beyond), each generation faster and more accurate, keeping it the go-to for practical deployment.",
    category: "Computer Vision", difficulty: "intermediate", rank: 59,
    keyTerms: ["Real-time detection", "Grid cells", "Confidence score", "NMS-free inference"],
    prerequisites: ["Object Detection"],
    learnMore: [
      { title: "Ultralytics YOLO (current models)", url: "https://docs.ultralytics.com/models/" },
    ],
  },
  {
    id: "image-generation", concept: "Image Generation", emoji: "👁️",
    description: "Creating new images from text descriptions or other inputs. Stable Diffusion, Midjourney, FLUX, and the image models built into ChatGPT and Gemini can generate photorealistic images from text prompts.",
    category: "Computer Vision", difficulty: "intermediate", rank: 60,
    keyTerms: ["Text-to-image", "Diffusion", "CLIP guidance", "Inpainting"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Stable Diffusion Guide", url: "https://stability.ai/stable-image" },
    ],
  },
  {
    id: "neural-style-transfer", concept: "Neural Style Transfer", emoji: "👁️",
    description: "Applying the artistic style of one image to the content of another, e.g., making your photo look like a Van Gogh painting. Uses CNN feature representations to separate content from style.",
    category: "Computer Vision", difficulty: "intermediate", rank: 61,
    keyTerms: ["Content loss", "Style loss", "Gram matrix", "Feature extraction"],
    prerequisites: ["Convolutional Neural Network (CNN)"],
    learnMore: [
      { title: "A Neural Algorithm of Artistic Style", url: "https://arxiv.org/abs/1508.06576" },
    ],
  },
  {
    id: "deepfakes", concept: "Deepfakes & Face Synthesis", emoji: "👁️",
    description: "AI-generated fake videos and images that swap faces or create entirely synthetic people. Uses GANs and diffusion models. Raises serious ethical concerns about misinformation.",
    category: "Computer Vision", difficulty: "advanced", rank: 62,
    keyTerms: ["Face swap", "Face reenactment", "Detection methods", "DeepFaceLab"],
    prerequisites: ["GANs (Generative Adversarial Networks)", "Image Generation"],
    learnMore: [
      { title: "MIT Media Lab: Detecting Deepfakes", url: "https://www.media.mit.edu/projects/detect-fakes/overview/" },
    ],
  },
  {
    id: "time-series", concept: "Time Series Forecasting", emoji: "🧠",
    description: "Predicting future values based on historical temporal data. Traditional methods (ARIMA) are being augmented by deep learning (LSTMs, Transformers). Critical for finance, weather, and demand planning. Stationarity, whether the series' statistics drift over time, decides which methods are even valid.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 63,
    keyTerms: ["ARIMA", "Seasonality", "Trend", "Lag features", "Prophet", "Stationarity"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "Facebook Prophet", url: "https://facebook.github.io/prophet/" },
    ],
    realWorldApps: "Stock prediction, weather forecasting, demand planning, energy grid",
  },
  {
    id: "data", concept: "Data · The Fuel of AI", emoji: "🧠",
    description: "AI is only as good as its data. Understanding data quality, bias, preprocessing, augmentation, and the data lifecycle is fundamental. 'More data beats better algorithms', but only if the data is good. Ground-truth labeling (annotation workflows, human-in-the-loop review, active learning) and class imbalance, fixed by resampling like SMOTE or by class weights, are the two practical crafts here.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 64,
    keyTerms: ["Data quality", "Data augmentation", "Data pipeline", "Label noise", "Data drift", "Data labeling & ground truth", "Class imbalance & SMOTE", "Active learning"],
    prerequisites: [],
    learnMore: [
      { title: "Andrew Ng: Data-Centric AI", url: "https://datacentricai.org/" },
    ],
  },
  {
    id: "synthetic-data", concept: "Synthetic Data", emoji: "🎨",
    description: "Artificially generated data that mimics real-world data. Used when real data is scarce, expensive, or privacy-sensitive. GANs and diffusion models can create realistic synthetic training data.",
    category: "Generative AI", difficulty: "intermediate", rank: 65,
    keyTerms: ["Data augmentation", "Privacy-preserving", "Distribution matching"],
    prerequisites: ["Data · The Fuel of AI"],
    learnMore: [
      { title: "NVIDIA: Synthetic Data", url: "https://developer.nvidia.com/blog/tag/synthetic-data/" },
    ],
  },

  // === Generative AI (66–75) ===
  {
    id: "diffusion-models", concept: "Diffusion Models", emoji: "🎨",
    description: "The architecture behind most modern image and video generators, including Stable Diffusion and the image models inside the major assistants. Works by learning to reverse a noise-adding process, start from pure noise, gradually denoise to create an image. Replaced GANs as the dominant generative approach.",
    category: "Generative AI", difficulty: "advanced", rank: 66,
    keyTerms: ["DDPM", "Noise schedule", "Denoising", "U-Net backbone", "Classifier-free guidance"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "DDPM Paper", url: "https://arxiv.org/abs/2006.11239" },
      { title: "Hugging Face Diffusion Course", url: "https://huggingface.co/learn/diffusion-course" },
    ],
  },
  {
    id: "gans", concept: "GANs (Generative Adversarial Networks)", emoji: "🎨",
    description: "Two neural networks in competition: a generator creates fake data, a discriminator tries to detect it. The adversarial game produces increasingly realistic outputs. Introduced by Goodfellow in 2014.",
    category: "Generative AI", difficulty: "advanced", rank: 67,
    keyTerms: ["Generator", "Discriminator", "Adversarial training", "Mode collapse"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Original GAN Paper · Goodfellow", url: "https://arxiv.org/abs/1406.2661" },
    ],
  },
  {
    id: "vaes", concept: "VAEs (Variational Autoencoders)", emoji: "🎨",
    description: "Generative models that learn a compressed latent space representation. Unlike GANs, VAEs can both generate AND encode data. The latent space is continuous, enabling smooth interpolation between outputs.",
    category: "Generative AI", difficulty: "advanced", rank: 68,
    keyTerms: ["Latent space", "KL divergence", "Encoder", "Decoder", "Reparameterization"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Understanding VAEs · Towards Data Science", url: "https://lilianweng.github.io/posts/2018-08-12-vae/" },
    ],
  },
  {
    id: "stable-diffusion", concept: "Stable Diffusion & Text-to-Image", emoji: "🎨",
    description: "The open-source text-to-image model that democratized AI art. Works in a compressed latent space (not pixel space) for efficiency. SDXL and SD 3.5 produce photorealistic images from text prompts, and open-weight successors such as FLUX build on the same latent-diffusion recipe.",
    category: "Generative AI", difficulty: "intermediate", rank: 69,
    keyTerms: ["Latent diffusion", "CLIP text encoder", "U-Net", "ControlNet", "LoRA"],
    prerequisites: ["Diffusion Models"],
    learnMore: [
      { title: "Stable Diffusion WebUI", url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui" },
      { title: "ComfyUI", url: "https://github.com/Comfy-Org/ComfyUI" },
    ],
    realWorldApps: "AI art, product mockups, game asset generation, marketing visuals",
  },
  {
    id: "text-to-video", concept: "Text-to-Video Generation", emoji: "🎨",
    description: "Generating video from text descriptions. Google's Veo, Runway's Gen models, Kling, and OpenAI's Sora pushed the field from short silent clips to video with native synchronized audio; the leaderboard changes every few months. Extends diffusion models with temporal consistency, the next frontier of generative AI.",
    category: "Generative AI", difficulty: "advanced", rank: 70,
    keyTerms: ["Temporal consistency", "Video diffusion", "Frame interpolation", "Sora"],
    prerequisites: ["Diffusion Models"],
    learnMore: [
      { title: "OpenAI Sora Technical Report", url: "https://openai.com/sora" },
    ],
  },
  {
    id: "voice-cloning", concept: "Voice Cloning & TTS", emoji: "🎨",
    description: "AI systems that can replicate any voice from a short sample, or generate natural-sounding speech from text. ElevenLabs and OpenAI's TTS models can produce indistinguishable synthetic voices.",
    category: "Generative AI", difficulty: "intermediate", rank: 71,
    keyTerms: ["Text-to-speech", "Voice synthesis", "Speaker embedding", "Prosody"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Hugging Face Audio Course: Text-to-Speech", url: "https://huggingface.co/learn/audio-course/chapter6/introduction" },
    ],
    realWorldApps: "Audiobooks, dubbing, accessibility, virtual assistants, podcasting",
  },
  {
    id: "music-generation", concept: "AI Music Generation", emoji: "🎨",
    description: "Creating original music using AI, from background scores to full songs with vocals. Suno and Udio generate music from text prompts. The copyright fight moved from open question to concrete outcome: major labels have signed licensing deals with both while other suits continue, and licensed models change what users may download and reuse.",
    category: "Generative AI", difficulty: "intermediate", rank: 72,
    keyTerms: ["Audio tokens", "Music transformer", "MIDI generation", "Audio diffusion"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Google MusicLM", url: "https://google-research.github.io/seanet/musiclm/examples/" },
    ],
  },
  {
    id: "code-generation", concept: "AI Code Generation", emoji: "🎨",
    description: "LLMs trained on code that can write, debug, and explain programs. GitHub Copilot, Claude, and other frontier models can generate working code from natural language descriptions, and coding agents can now carry out whole tasks. Transforming software development.",
    category: "Generative AI", difficulty: "intermediate", rank: 73,
    keyTerms: ["Code completion", "Copilot", "CodeLlama", "Code review", "Agentic coding"],
    prerequisites: ["GPT (Generative Pre-trained Transformer)"],
    learnMore: [
      { title: "GitHub Copilot", url: "https://github.com/features/copilot" },
    ],
    realWorldApps: "Software development, code review, documentation, debugging, prototyping",
  },
  {
    id: "3d-generation", concept: "3D Generation & NeRFs", emoji: "🎨",
    description: "Creating 3D objects and scenes from text or 2D images. Neural Radiance Fields (NeRFs) reconstruct 3D scenes from photos. Gaussian Splatting (2023) was a breakthrough for real-time 3D rendering and is now the standard approach.",
    category: "Generative AI", difficulty: "advanced", rank: 74,
    keyTerms: ["NeRF", "Gaussian splatting", "3D reconstruction", "Point clouds"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "NeRF Paper", url: "https://arxiv.org/abs/2003.08934" },
    ],
  },
  {
    id: "image-editing", concept: "AI Image Editing & Inpainting", emoji: "🎨",
    description: "Using AI to edit specific parts of an image, removing objects, changing backgrounds, adding elements. Inpainting fills in missing or masked regions. Powered by diffusion models.",
    category: "Generative AI", difficulty: "intermediate", rank: 75,
    keyTerms: ["Inpainting", "Outpainting", "Mask", "ControlNet", "Image-to-image"],
    prerequisites: ["Diffusion Models"],
    learnMore: [
      { title: "ControlNet Paper", url: "https://arxiv.org/abs/2302.05543" },
    ],
  },

  // === Reinforcement Learning (76–85) ===
  {
    id: "reinforcement-learning", concept: "Reinforcement Learning (RL)", emoji: "🎮",
    description: "Learning through trial and error, an agent takes actions in an environment, receives rewards/penalties, and learns a policy to maximize cumulative reward. Behind AlphaGo and game-playing AI. The multi-armed bandit is RL stripped to a single state, where the explore-exploit tradeoff appears in its purest form.",
    category: "Reinforcement Learning", difficulty: "intermediate", rank: 76,
    keyTerms: ["Agent", "Environment", "Reward", "Policy", "Episode", "Multi-armed bandits"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "Spinning Up in Deep RL · OpenAI", url: "https://spinningup.openai.com/" },
      { title: "David Silver's RL Course", url: "https://www.youtube.com/playlist?list=PLqYmG7hTraZDM-OYHWgPebj2MfCFzFObQ" },
    ],
  },
  {
    id: "q-learning", concept: "Q-Learning & Deep Q-Networks (DQN)", emoji: "🎮",
    description: "Q-Learning estimates the value of actions in each state. Deep Q-Networks (DQN) use neural networks to approximate Q-values, DeepMind's DQN played Atari games at superhuman level (2013). SARSA is Q-learning's on-policy sibling: it learns from the action actually taken rather than the greedy one.",
    category: "Reinforcement Learning", difficulty: "intermediate", rank: 77,
    keyTerms: ["Q-value", "Bellman equation", "Experience replay", "Target network", "SARSA"],
    prerequisites: ["Reinforcement Learning (RL)"],
    learnMore: [
      { title: "DQN Paper · DeepMind", url: "https://arxiv.org/abs/1312.5602" },
    ],
  },
  {
    id: "policy-gradient", concept: "Policy Gradient & Actor-Critic", emoji: "🎮",
    description: "Policy gradient methods directly optimize the policy (action selection) rather than value estimates. Actor-Critic combines both: the actor selects actions, the critic evaluates them.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 78,
    keyTerms: ["REINFORCE", "Advantage function", "A2C", "A3C", "Baseline"],
    prerequisites: ["Q-Learning & Deep Q-Networks (DQN)"],
    learnMore: [
      { title: "OpenAI Spinning Up: Policy Gradient", url: "https://spinningup.openai.com/en/latest/algorithms/vpg.html" },
    ],
  },
  {
    id: "ppo", concept: "PPO (Proximal Policy Optimization)", emoji: "🎮",
    description: "For years the default RL algorithm, simpler and more stable than its predecessors, and the method used in the original RLHF pipelines. Newer group-relative variants have largely displaced it for language-model post-training, though PPO remains a standard baseline in robotics and control. Used in RLHF to fine-tune ChatGPT, in robotics, and in game AI. Balances exploration with stable training.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 79,
    keyTerms: ["Clipping", "Trust region", "Surrogate objective", "KL penalty"],
    prerequisites: ["Policy Gradient & Actor-Critic"],
    learnMore: [
      { title: "PPO Paper · OpenAI", url: "https://arxiv.org/abs/1707.06347" },
    ],
  },
  {
    id: "markov-decision", concept: "Markov Decision Process (MDP)", emoji: "🎮",
    description: "The mathematical framework underlying RL. Defines states, actions, transition probabilities, and rewards. The Markov property: the future depends only on the current state, not history.",
    category: "Reinforcement Learning", difficulty: "intermediate", rank: 80,
    keyTerms: ["State space", "Action space", "Transition function", "Discount factor"],
    prerequisites: [],
    learnMore: [
      { title: "Sutton & Barto: RL Book (Free)", url: "http://incompleteideas.net/book/the-book-2nd.html" },
    ],
  },
  {
    id: "reward-shaping", concept: "Reward Design & Reward Hacking", emoji: "🎮",
    description: "Designing reward functions is RL's hardest problem. Reward hacking: agents find unintended shortcuts to maximize reward without actually solving the task. A core challenge in AI alignment.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 81,
    keyTerms: ["Sparse rewards", "Reward shaping", "Goodhart's law", "Specification gaming"],
    prerequisites: ["Reinforcement Learning (RL)"],
    learnMore: [
      { title: "DeepMind: Specification Gaming", url: "https://deepmindsafetyresearch.medium.com/specification-gaming-the-flip-side-of-ai-ingenuity-c85bdb0deeb4" },
    ],
  },
  {
    id: "multi-agent-rl", concept: "Multi-Agent Reinforcement Learning", emoji: "🎮",
    description: "Multiple agents learning simultaneously in a shared environment, they can cooperate, compete, or both. Adds complexity: each agent's optimal strategy depends on what others do.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 82,
    keyTerms: ["Nash equilibrium", "Cooperative", "Competitive", "Self-play"],
    prerequisites: ["Reinforcement Learning (RL)"],
    learnMore: [
      { title: "OpenAI Five · Dota 2", url: "https://openai.com/index/openai-five/" },
    ],
  },
  {
    id: "world-models", concept: "World Models", emoji: "🎮",
    description: "AI that builds internal models of how the world works, predicting what happens next without actually experiencing it. Championed by Yann LeCun, who left Meta at the end of 2025 to found AMI Labs (Advanced Machine Intelligence) specifically to pursue this, as the next paradigm: learning through observation, not just language.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 83,
    keyTerms: ["Predictive model", "Imagination", "Model-based RL", "JEPA"],
    prerequisites: ["Reinforcement Learning (RL)"],
    learnMore: [
      { title: "LeCun: A Path Towards Autonomous Machine Intelligence", url: "https://openreview.net/forum?id=BZ5a1r-kVsf" },
    ],
  },
  {
    id: "sim-to-real", concept: "Sim-to-Real Transfer", emoji: "🎮",
    description: "Training RL agents in simulation and deploying them in the real world. Overcomes the cost and danger of real-world training. Domain randomization helps bridge the gap between sim and reality. The wider framing is physical AI: models trained largely in simulated worlds and digital twins before they ever touch hardware.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 84,
    keyTerms: ["Domain randomization", "Simulation", "Reality gap", "Digital twin", "Physical AI"],
    prerequisites: ["Reinforcement Learning (RL)"],
    learnMore: [
      { title: "OpenAI: Sim-to-Real Robotics", url: "https://openai.com/index/solving-rubiks-cube/" },
    ],
  },
  {
    id: "inverse-rl", concept: "Inverse Reinforcement Learning", emoji: "🎮",
    description: "Learning the reward function from observing expert behavior, inferring WHAT the expert is optimizing, not just imitating their actions. Key for building AI that understands human preferences.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 85,
    keyTerms: ["Reward inference", "Expert demonstrations", "Imitation learning", "IRL"],
    prerequisites: ["Reinforcement Learning (RL)"],
    learnMore: [
      { title: "Ng & Russell: IRL Paper", url: "https://ai.stanford.edu/~ang/papers/icml00-irl.pdf" },
    ],
  },

  // === MLOps & Infrastructure (86–95) ===
  {
    id: "gpu-tpu", concept: "GPU & TPU Computing", emoji: "⚙️",
    description: "GPUs (NVIDIA) and TPUs (Google) are the hardware that makes deep learning possible. Their parallel processing capabilities accelerate matrix operations by 100x+ versus CPUs. This is the same lineage as high-performance computing: AI clusters are supercomputers, ranked and benchmarked as such.",
    category: "MLOps & Infrastructure", difficulty: "beginner", rank: 86,
    keyTerms: ["CUDA", "Tensor cores", "HBM", "Accelerator generations (Hopper, Blackwell, Rubin)", "TPU", "Parallelism", "HPC & supercomputing"],
    prerequisites: [],
    learnMore: [
      { title: "NVIDIA CUDA Guide", url: "https://developer.nvidia.com/cuda" },
    ],
  },
  {
    id: "model-deployment", concept: "Model Deployment & Serving", emoji: "⚙️",
    description: "Getting trained models into production where they serve real users. Involves containerization (Docker), API frameworks (FastAPI), model servers (TensorRT, vLLM), and monitoring. Serving splits two ways: real-time endpoints optimized for latency, and batch jobs optimized for throughput and cost.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 87,
    keyTerms: ["Docker", "FastAPI", "TensorRT", "vLLM", "Latency", "Throughput", "Triton & inference servers", "Batch vs real-time"],
    prerequisites: ["Training vs Inference"],
    learnMore: [
      { title: "Made With ML · MLOps", url: "https://madewithml.com/" },
    ],
  },
  {
    id: "mlops", concept: "MLOps (ML Operations)", emoji: "⚙️",
    description: "The practice of deploying, monitoring, and maintaining ML models in production. Combines ML, DevOps, and data engineering. The difference between a notebook prototype and a reliable production system. CI/CD carries over from software engineering: every model change flows through automated test, build, and deploy stages. LLMOps is the same discipline rebuilt around LLM apps, where prompts and evals become the artifacts under version control.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 88,
    keyTerms: ["CI/CD for ML", "Model registry", "Feature store", "A/B testing", "Monitoring", "LLMOps"],
    prerequisites: ["Model Deployment & Serving"],
    learnMore: [
      { title: "Full Stack Deep Learning", url: "https://fullstackdeeplearning.com/" },
      { title: "Chip Huyen: Designing ML Systems", url: "https://www.amazon.com/Designing-Machine-Learning-Systems-Production-Ready/dp/1098107969" },
    ],
  },
  {
    id: "experiment-tracking", concept: "Experiment Tracking", emoji: "⚙️",
    description: "Systematically logging hyperparameters, metrics, and artifacts for every ML experiment. Without it, ML research is unreproducible chaos. Weights & Biases and MLflow are the standards.",
    category: "MLOps & Infrastructure", difficulty: "beginner", rank: 89,
    keyTerms: ["Hyperparameters", "Metrics logging", "Artifact tracking", "Reproducibility"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "Weights & Biases · Free Courses", url: "https://wandb.ai/site/courses" },
    ],
  },
  {
    id: "data-pipeline", concept: "Data Pipelines & ETL", emoji: "⚙️",
    description: "Automated workflows for collecting, cleaning, transforming, and loading data for ML. The unsexy but critical infrastructure that makes everything else possible. At big-data scale the same jobs run on engines like Spark over data lakes, while SQL over relational databases remains where most structured training data actually lives.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 90,
    keyTerms: ["ETL", "Apache Airflow", "dbt", "Data warehouse", "Feature store", "Apache Spark & data lakes", "SQL & relational databases"],
    prerequisites: [],
    learnMore: [
      { title: "Apache Airflow", url: "https://airflow.apache.org/" },
    ],
  },
  {
    id: "edge-ai", concept: "Edge AI & On-Device ML", emoji: "⚙️",
    description: "Running AI models directly on devices (phones, IoT, cars) instead of in the cloud. Enables low-latency, privacy-preserving AI. Requires model compression and optimization.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 91,
    keyTerms: ["LiteRT (formerly TensorFlow Lite)", "CoreML", "ONNX", "Edge TPU", "Model optimization", "On-device NPUs"],
    prerequisites: ["Model Quantization & Compression"],
    learnMore: [
      { title: "LiteRT (formerly TensorFlow Lite)", url: "https://developers.google.com/edge/litert" },
    ],
    realWorldApps: "Smartphone cameras, smart speakers, autonomous vehicles, industrial IoT",
  },
  {
    id: "federated-learning", concept: "Federated Learning", emoji: "⚙️",
    description: "Training ML models across multiple devices/organizations without sharing raw data, each participant trains locally and shares only model updates. Preserves privacy while enabling collaborative learning.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 92,
    keyTerms: ["Privacy-preserving", "Aggregation", "Non-IID data", "Communication efficiency"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Google: Federated Learning", url: "https://research.google/blog/federated-learning-collaborative-machine-learning-without-centralized-training-data/" },
    ],
  },
  {
    id: "distributed-training", concept: "Distributed Training", emoji: "⚙️",
    description: "Training models across multiple GPUs or machines. Essential for frontier models, which are trained on clusters ranging from tens of thousands to several hundred thousand accelerators. Techniques: data parallelism, model parallelism, pipeline parallelism. Gradient accumulation fakes bigger batches on small GPUs, and checkpointing is what lets thousand-GPU runs survive hardware failures.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 93,
    keyTerms: ["Data parallelism", "Model parallelism", "FSDP", "DeepSpeed", "Gradient sync", "Gradient accumulation", "Checkpointing"],
    prerequisites: ["GPU & TPU Computing"],
    learnMore: [
      { title: "PyTorch Distributed Training", url: "https://docs.pytorch.org/tutorials/intermediate/ddp_tutorial.html" },
    ],
  },
  {
    id: "model-versioning", concept: "Model Versioning & Registry", emoji: "⚙️",
    description: "Tracking different versions of ML models with their metadata, performance metrics, and lineage. Essential for reproducibility and production deployment. MLflow Model Registry is the standard.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 94,
    keyTerms: ["Model registry", "Version control", "Lineage", "Rollback", "Staging"],
    prerequisites: ["Experiment Tracking"],
    learnMore: [
      { title: "MLflow Model Registry", url: "https://mlflow.org/docs/latest/model-registry/" },
    ],
  },
  {
    id: "monitoring", concept: "ML Monitoring & Observability", emoji: "⚙️",
    description: "Watching ML models in production for degradation. Models decay over time as data distributions shift. Monitoring detects data drift, concept drift, and performance drops before they impact users. Training-serving skew, features computed differently offline and online, is the classic silent killer here.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 95,
    keyTerms: ["Data drift", "Concept drift", "Model degradation", "Alerting", "Retraining", "Training-serving skew"],
    prerequisites: ["Model Deployment & Serving"],
    learnMore: [
      { title: "Evidently AI · ML Monitoring", url: "https://www.evidentlyai.com/" },
    ],
  },

  // === AI Agents & Applications (96–105) ===
  {
    id: "ai-agents", concept: "AI Agents", emoji: "🤖",
    description: "AI systems that can plan, use tools, browse the web, write code, and complete multi-step tasks autonomously. The defining frontier of the current AI era. Frameworks such as LangGraph and CrewAI, plus vendor SDKs (OpenAI Agents SDK, Claude Agent SDK, Microsoft Agent Framework), are common starting points. The 2023 Auto-GPT and BabyAGI wave proved both the appetite and the limits; today's agents descend from those loops running on far better models.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 96,
    keyTerms: ["Tool use", "Planning", "ReAct", "Reasoning loop", "Autonomy", "Auto-GPT era"],
    prerequisites: ["Prompt Engineering", "GPT (Generative Pre-trained Transformer)"],
    learnMore: [
      { title: "Anthropic: Building Effective Agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { title: "LangGraph Documentation", url: "https://langchain-ai.github.io/langgraph/" },
    ],
    realWorldApps: "Coding assistants, research automation, customer service, data analysis",
  },
  {
    id: "tool-use", concept: "Tool Use & Function Calling", emoji: "🤖",
    description: "LLMs that can call external tools, APIs, databases, calculators, web browsers. Transforms LLMs from text generators into action-taking agents. Function calling is now supported by every major vendor, and the Model Context Protocol (MCP) has become the industry-standard way to connect models to tools. The substrate is the humble API, a documented endpoint the model can call, which is why giving a model an API and giving it a tool mean the same thing.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 97,
    keyTerms: ["Function calling", "API integration", "MCP", "Tool selection", "APIs"],
    prerequisites: ["AI Agents"],
    learnMore: [
      { title: "OpenAI: Function Calling", url: "https://platform.openai.com/docs/guides/function-calling" },
    ],
  },
  {
    id: "autonomous-vehicles", concept: "Autonomous Vehicles & Robotics", emoji: "🤖",
    description: "Self-driving cars and intelligent robots that perceive, plan, and act in the physical world. Combines computer vision, RL, sensor fusion, and path planning. Tesla, Waymo, and Figure lead the field.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 98,
    keyTerms: ["Lidar", "Sensor fusion", "Path planning", "SLAM", "End-to-end driving"],
    prerequisites: ["Image Classification", "Reinforcement Learning (RL)"],
    learnMore: [
      { title: "Waymo Research", url: "https://waymo.com/research/" },
    ],
  },
  {
    id: "recommendation-systems", concept: "Recommendation Systems", emoji: "🤖",
    description: "AI that suggests content, products, or connections based on user behavior and preferences. Powers Netflix, YouTube, Amazon, and TikTok. Uses collaborative filtering, content-based, and hybrid approaches.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 99,
    keyTerms: ["Collaborative filtering", "Content-based", "Matrix factorization", "Cold start"],
    prerequisites: ["Machine Learning (ML)", "Embeddings"],
    learnMore: [
      { title: "Google: Recommendation Systems Course", url: "https://developers.google.com/machine-learning/recommendation" },
    ],
  },
  {
    id: "drug-discovery", concept: "AI-Driven Drug Discovery", emoji: "🤖",
    description: "Using AI to identify, design, and optimize drug candidates, dramatically accelerating the traditional 10-15 year drug development cycle. AlphaFold made protein structure prediction reliable enough to use as a tool. Insilico Medicine's rentosertib is the first candidate whose biological target and molecule were both found with generative AI, and it cleared a Phase IIa readout in 2025. It is still investigational, not approved, which is the honest state of the field.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 100,
    keyTerms: ["Protein folding", "AlphaFold", "Molecular generation", "Drug target"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "AlphaFold · DeepMind", url: "https://alphafold.ebi.ac.uk/" },
    ],
  },
  {
    id: "xai", concept: "Explainable AI (XAI)", emoji: "🤖",
    description: "Techniques to make AI decisions interpretable by humans. SHAP and LIME explain individual predictions. Critical for healthcare, finance, and legal applications where decisions must be justified.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 101,
    keyTerms: ["SHAP", "LIME", "Feature importance", "Attention visualization", "Interpretability"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "SHAP Documentation", url: "https://shap.readthedocs.io/" },
      { title: "Christoph Molnar: Interpretable ML (Free Book)", url: "https://christophm.github.io/interpretable-ml-book/" },
    ],
  },
  {
    id: "search-ranking", concept: "AI-Powered Search & Ranking", emoji: "🤖",
    description: "Using ML to improve search results and ranking. Moved from keyword matching to semantic understanding. Encoder models moved search from keyword matching to semantic understanding, and vector search enables meaning-based retrieval. The frontier has moved again: major engines now generate an answer as the primary result and cite sources into it, so visibility increasingly means being cited rather than being ranked.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 102,
    keyTerms: ["Semantic search", "Learning to rank", "BM25", "Cross-encoder", "Bi-encoder"],
    prerequisites: ["Embeddings", "BERT (Bidirectional Encoder)"],
    learnMore: [
      { title: "Pinecone: Semantic Search", url: "https://www.pinecone.io/learn/semantic-search/" },
    ],
  },
  {
    id: "conversational-ai", concept: "Conversational AI & Chatbots", emoji: "🤖",
    description: "AI systems for natural dialogue, from simple rule-based chatbots to LLM-powered assistants. Key challenges: maintaining context, handling ambiguity, knowing when to escalate to humans.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 103,
    keyTerms: ["Dialog management", "Intent recognition", "Slot filling", "Conversation memory"],
    prerequisites: ["Natural Language Processing (NLP)", "GPT (Generative Pre-trained Transformer)"],
    learnMore: [
      { title: "Rasa Documentation", url: "https://rasa.com/docs/" },
    ],
  },
  {
    id: "medical-ai", concept: "AI in Healthcare & Medical Imaging", emoji: "🤖",
    description: "AI for diagnosis, treatment planning, drug discovery, and medical imaging. CNNs match or exceed radiologists for certain diagnoses. Faces unique challenges: regulation, liability, bias in clinical data.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 104,
    keyTerms: ["Medical imaging", "Clinical NLP", "FDA approval", "Diagnostic AI"],
    prerequisites: ["Convolutional Neural Network (CNN)", "Deep Learning"],
    learnMore: [
      { title: "Google Health AI", url: "https://health.google/" },
    ],
  },
  {
    id: "creative-ai", concept: "AI for Creative Industries", emoji: "🤖",
    description: "AI tools transforming art, music, writing, film, and design. From AI-assisted writing to AI-generated music and video. Raises questions about authorship, copyright, and the future of creative work.",
    category: "AI Agents & Applications", difficulty: "beginner", rank: 105,
    keyTerms: ["AI art", "AI writing", "Generative design", "Copyright", "Human-AI collaboration"],
    prerequisites: [],
    learnMore: [
      { title: "Runway ML", url: "https://runway.com/" },
    ],
  },

  // === Safety, Ethics & Governance (106–110) ===
  {
    id: "ai-alignment", concept: "AI Alignment", emoji: "🛡️",
    description: "The challenge of ensuring AI systems pursue goals beneficial to humans. The most important unsolved problem in AI. Includes technical approaches (RLHF, Constitutional AI) and governance frameworks.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 106,
    keyTerms: ["Value alignment", "Outer alignment", "Inner alignment", "Reward hacking"],
    prerequisites: [],
    learnMore: [
      { title: "AI Safety Fundamentals", url: "https://bluedot.org/" },
      { title: "Anthropic: Core Views on AI Safety", url: "https://www.anthropic.com/news/core-views-on-ai-safety" },
    ],
  },
  {
    id: "ai-bias", concept: "AI Bias & Fairness", emoji: "🛡️",
    description: "AI systems can perpetuate and amplify societal biases present in training data. Understanding, measuring, and mitigating bias is critical for responsible AI deployment. Formal fairness metrics (demographic parity, equalized odds, predictive parity) famously conflict: satisfying all of them at once is mathematically impossible in most real settings.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 107,
    keyTerms: ["Training data bias", "Algorithmic fairness", "Disparate impact", "Fairlearn", "Demographic parity", "Equalized odds"],
    prerequisites: [],
    learnMore: [
      { title: "Fairlearn Documentation", url: "https://fairlearn.org/" },
      { title: "Weapons of Math Destruction (Book)", url: "https://www.amazon.com/Weapons-Math-Destruction-Increases-Inequality/dp/0553418815" },
    ],
    realWorldApps: "Hiring algorithms, criminal justice, lending decisions, healthcare",
  },
  {
    id: "hallucination", concept: "AI Hallucinations", emoji: "🛡️",
    description: "When AI generates confident but factually incorrect or fabricated information. A fundamental limitation of current LLMs, they predict plausible text, not truthful text. RAG and grounding techniques help reduce it.",
    category: "Safety, Ethics & Governance", difficulty: "beginner", rank: 108,
    keyTerms: ["Confabulation", "Grounding", "Factual accuracy", "RAG as mitigation"],
    prerequisites: ["GPT (Generative Pre-trained Transformer)"],
    learnMore: [
      { title: "Anthropic: Reducing Hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" },
    ],
  },
  {
    id: "red-teaming", concept: "Red Teaming AI Systems", emoji: "🛡️",
    description: "Systematically testing AI systems by trying to make them fail, produce harmful outputs, or bypass safety measures. Essential for finding vulnerabilities before deployment. Both manual and automated approaches.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 109,
    keyTerms: ["Jailbreaking", "Adversarial attacks", "Safety evaluation", "Prompt injection"],
    prerequisites: ["Prompt Engineering"],
    learnMore: [
      { title: "Anthropic: Red Teaming", url: "https://arxiv.org/abs/2209.07858" },
    ],
  },
  {
    id: "ai-regulation", concept: "AI Regulation & Governance", emoji: "🛡️",
    description: "The emerging legal and policy landscape for AI. The EU AI Act is the first comprehensive AI law. Its obligations phase in over several years, and a 2026 amendment pushed the high-risk rules for standalone systems to December 2027 and for AI embedded in regulated products to August 2028. Treat the phase-in dates as current as of reading, not fixed. Understanding regulation is now a career advantage, every AI team needs someone who understands compliance. Inside companies this arrives as model governance: model cards, model risk management, and the audit trails standards like ISO/IEC 42001 formalize.",
    category: "Safety, Ethics & Governance", difficulty: "beginner", rank: 110,
    keyTerms: ["EU AI Act", "Risk categories", "Compliance", "Transparency requirements", "Model governance & model cards"],
    prerequisites: [],
    learnMore: [
      { title: "EU AI Act Overview", url: "https://artificialintelligenceact.eu/" },
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
    ],
  },
  {
    id: "mcp", concept: "Model Context Protocol (MCP)", emoji: "🔌",
    description: "An open standard, introduced by Anthropic in late 2024, for connecting AI models to external tools, data sources, and applications through one common interface. Developers expose a capability once as an MCP server and any compatible model can use it, replacing per-model custom integrations. By 2026 it is supported by every major AI vendor. MCP standardizes model-to-tool wiring; the sibling A2A protocol aims to do the same for agent-to-agent communication.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 111,
    keyTerms: ["MCP server", "MCP client", "Tool discovery", "Transport", "Capability", "A2A (Agent2Agent protocol)"],
    prerequisites: ["Tool Use & Function Calling", "AI Agents"],
    learnMore: [
      { title: "Model Context Protocol (official)", url: "https://modelcontextprotocol.io/" },
      { title: "Hugging Face MCP Course (free)", url: "https://huggingface.co/learn/mcp-course" },
    ],
    realWorldApps: "Connecting assistants to codebases, databases, design tools, and internal APIs",
  },
  {
    id: "reasoning-models", concept: "Reasoning Models & Test-Time Compute", emoji: "🧩",
    description: "LLMs trained to produce a long internal chain of reasoning before answering, spending extra compute at inference time to get better answers on math, code, and logic. OpenAI's o-series and DeepSeek-R1 established this as a second scaling axis alongside model size. Most frontier assistants now offer a thinking mode built on this idea.",
    category: "NLP & Language", difficulty: "intermediate", rank: 112,
    keyTerms: ["Test-time compute", "Thinking tokens", "RLVR", "Verifiable rewards", "Long CoT"],
    prerequisites: ["Chain-of-Thought Reasoning", "LLM Scaling Laws"],
    learnMore: [
      { title: "DeepSeek-R1 paper", url: "https://arxiv.org/abs/2501.12948" },
      { title: "The RLHF Book (free)", url: "https://rlhfbook.com/" },
    ],
    realWorldApps: "Competition math, code debugging, scientific analysis, agentic planning",
  },
  {
    id: "moe", concept: "Mixture-of-Experts (MoE)", emoji: "🔀",
    description: "A Transformer variant where each layer holds many parallel expert subnetworks and a router activates only a few per token. This decouples total parameter count from per-token compute, so models can grow far larger without proportional cost. Many frontier and open-weight LLMs use MoE.",
    category: "Architectures", difficulty: "advanced", rank: 113,
    keyTerms: ["Router", "Sparse activation", "Expert", "Load balancing", "Active parameters"],
    prerequisites: ["Transformer Architecture", "LLM Scaling Laws"],
    learnMore: [
      { title: "Hugging Face: Mixture of Experts explained", url: "https://huggingface.co/blog/moe" },
    ],
    realWorldApps: "Frontier LLMs, cost-efficient serving, large open-weight models",
  },
  {
    id: "computer-use", concept: "Computer Use & Browser Agents", emoji: "🖱️",
    description: "Agents that operate software the way a person does: looking at the screen, moving the cursor, clicking, and typing, or driving a web browser directly. Introduced commercially in 2024-2025 and now built into AI-enabled browsers. It turns any existing application into something an AI can operate, with no API required.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 114,
    keyTerms: ["Screen understanding", "GUI automation", "Browser agent", "Action space", "Grounding"],
    prerequisites: ["AI Agents", "Multimodal Models"],
    learnMore: [
      { title: "Anthropic: Developing computer use", url: "https://www.anthropic.com/news/developing-computer-use" },
    ],
    realWorldApps: "Form filling, QA testing, legacy software automation, research workflows",
  },
  {
    id: "agentic-coding", concept: "Agentic Coding", emoji: "⌨️",
    description: "Coding assistance that goes beyond autocomplete: an agent reads the codebase, plans, edits multiple files, runs tests and commands, and iterates until the task is done. Tools built on this pattern made it the dominant developer AI workflow. Vibe coding names the casual end of the spectrum, prompt and accept whatever runs, in contrast to disciplined workflows with tests and review.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 115,
    keyTerms: ["Codebase context", "Multi-file edit", "Test loop", "Tool permissions", "Plan mode", "Vibe coding"],
    prerequisites: ["AI Code Generation", "AI Agents"],
    learnMore: [
      { title: "Claude Code best practices", url: "https://code.claude.com/docs/en/best-practices" },
    ],
    realWorldApps: "Feature implementation, refactoring, migrations, bug fixing, code review",
  },
  {
    id: "grpo", concept: "GRPO (Group Relative Policy Optimization)", emoji: "📊",
    description: "A reinforcement learning algorithm that simplifies PPO by dropping the value network: it samples a group of responses per prompt and scores each one against the group average. Introduced in DeepSeekMath and used to train DeepSeek-R1, it became a standard recipe for training reasoning models on verifiable rewards like math and unit tests.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 116,
    keyTerms: ["Group baseline", "No value network", "Verifiable reward", "Policy gradient", "Rollouts"],
    prerequisites: ["PPO (Proximal Policy Optimization)", "RLHF (Reinforcement Learning from Human Feedback)"],
    learnMore: [
      { title: "DeepSeekMath paper (GRPO)", url: "https://arxiv.org/abs/2402.03300" },
      { title: "The RLHF Book (free)", url: "https://rlhfbook.com/" },
    ],
    realWorldApps: "Training reasoning models, math and code post-training, open-weight R1 replications",
  },
  {
    id: "llm-eval", concept: "LLM Evaluation & Benchmarks", emoji: "📏",
    description: "Measuring what language models can actually do, via static benchmarks, head-to-head human preference arenas, and LLM-as-judge scoring. Benchmark saturation and training-data contamination make honest evaluation one of the field's hardest open problems: leaderboard gains do not always translate to real-world capability. In practice evals are the CI of AI products: rubric-scored suites run on every prompt or model change, increasingly with agent trajectories under test.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 117,
    keyTerms: ["MMLU", "SWE-bench", "LLM-as-judge", "Contamination", "Elo arena", "Agent evals", "Prompt evals"],
    prerequisites: ["LLM Scaling Laws", "AI Hallucinations"],
    learnMore: [
      { title: "Hugging Face Evaluation Guidebook", url: "https://github.com/huggingface/evaluation-guidebook" },
    ],
    realWorldApps: "Model selection, regression testing, procurement decisions, safety assessment",
  },
  {
    id: "context-engineering", concept: "Context Engineering", emoji: "💬",
    description: "The practice of deciding what occupies a model's context window on each call: system instructions, tool definitions, retrieved documents, and prior turns. Once an agent runs for many steps the binding constraint stops being prompt wording and becomes the budget of useful tokens, so compaction, summarising older turns, keeping notes outside the window, and retrieving just in time matter more than phrasing.",
    category: "NLP & Language", difficulty: "intermediate", rank: 118,
    keyTerms: ["Compaction", "Just-in-time retrieval", "Token budget", "Sub-agents", "Context rot"],
    prerequisites: ["Prompt Engineering", "Context Window & Long Context"],
    learnMore: [
      { title: "Anthropic: Effective context engineering for AI agents", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
    ],
    realWorldApps: "Long-running coding agents, research assistants, customer support over long histories",
  },
  {
    id: "prompt-injection", concept: "Prompt Injection & Jailbreaking", emoji: "💉",
    description: "An attack where instructions hidden inside content the model reads are followed as if the user had issued them. Direct injection comes from whoever is typing; indirect injection arrives through a fetched web page, document, or tool result, which makes it the central security problem for tool-using agents. Jailbreaking is the neighbouring but distinct problem: persuading a model to ignore its own policy, rather than smuggling in someone else's instructions. No complete fix exists for either, so defences layer restricted permissions, separation of instructions from data, and human confirmation before consequential actions.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 119,
    keyTerms: ["Indirect injection", "Jailbreaking", "Tool poisoning", "Instruction hierarchy", "Least privilege"],
    prerequisites: ["Red Teaming AI Systems", "AI Agents"],
    learnMore: [
      { title: "OWASP GenAI Top 10: Prompt Injection", url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/" },
      { title: "Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection (Greshake et al.)", url: "https://arxiv.org/abs/2302.12173" },
      { title: "NIST AI 100-2 E2025, Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations", url: "https://csrc.nist.gov/pubs/ai/100/2/e2025/final" },
    ],
    realWorldApps: "Agent security review, browser agents, email and document assistants, threat modelling",
  },
  {
    id: "mech-interp", concept: "Mechanistic Interpretability", emoji: "⚖️",
    description: "Reverse engineering a network's internal computation into human-readable parts: features, the circuits that combine them, and how information moves between layers. Sparse autoencoders are the main tool for pulling interpretable features out of layers whose individual neurons each represent many unrelated things. It differs from feature-attribution methods, which say which inputs mattered without describing the mechanism that used them.",
    category: "Safety, Ethics & Governance", difficulty: "advanced", rank: 120,
    keyTerms: ["Sparse autoencoders", "Circuits", "Superposition", "Feature steering", "Attribution graphs"],
    prerequisites: ["Explainable AI (XAI)", "Transformer Architecture"],
    learnMore: [
      { title: "Anthropic: Tracing the thoughts of a large language model", url: "https://www.anthropic.com/research/tracing-thoughts-language-model" },
      { title: "Transformer Circuits: mechanistic interpretability essay", url: "https://transformer-circuits.pub/2022/mech-interp-essay/index.html" },
    ],
    realWorldApps: "Safety auditing, debugging model behaviour, steering outputs, alignment research",
  },
  {
    id: "inference-optimization", concept: "Inference Optimization", emoji: "🔧",
    description: "The engineering that makes serving a model affordable. Generation splits into a compute-bound prefill over the prompt and a memory-bound decode of one token at a time, so throughput and cost are set by the KV cache, continuous batching, attention memory layout, and speculative decoding, where a small draft model proposes tokens a larger model verifies in one pass. Two deployments of the same weights can differ by an order of magnitude in cost per token. Attention itself gets slimmed too: multi-query and grouped-query attention shrink the KV cache that dominates serving memory. Routing sends easy queries to cheap models and hard ones to frontier models; cascades escalate only on failure.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 121,
    keyTerms: ["KV cache", "Continuous batching", "Speculative decoding", "Prefill vs decode", "PagedAttention", "MQA & GQA", "Model routing & cascades"],
    prerequisites: ["Training vs Inference", "Model Quantization & Compression"],
    learnMore: [
      { title: "Hugging Face: Optimizing LLM inference", url: "https://huggingface.co/docs/transformers/llm_optims" },
    ],
    realWorldApps: "Cost control at scale, latency-sensitive products, self-hosted model serving",
  },
  {
    id: "vla-models", concept: "Vision-Language-Action Models", emoji: "🤖",
    description: "Models that take camera images plus a natural-language instruction and output robot actions directly, trained across large mixed datasets of demonstrations rather than one policy per task. They port the pretrain-then-adapt pattern from language into physical control. The property under test is generalisation: whether a policy handles objects, scenes, and phrasings it never saw during training.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 122,
    keyTerms: ["Action tokens", "Flow matching policy", "Teleoperation data", "Generalist policy", "Embodied AI"],
    prerequisites: ["Multimodal Models", "Autonomous Vehicles & Robotics"],
    learnMore: [
      { title: "Physical Intelligence: pi-zero, a vision-language-action flow model", url: "https://www.pi.website/blog/pi0" },
    ],
    realWorldApps: "Warehouse manipulation, household robots, industrial pick and place, humanoid control",
  },
  {
    id: "multi-agent-orchestration", concept: "Multi-Agent Systems & Orchestration", emoji: "🤖",
    description: "Splitting a task across several LLM agents with separate contexts and roles, coordinated by an orchestrator that fans out subtasks and merges what comes back. It pays off when subtasks are genuinely independent and each needs its own large context. It also multiplies token spend and makes failures harder to trace, so a single well-scoped agent is often the better answer. Research simulacra like Stanford's generative agents showed dozens of LLM agents producing believable social behavior.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 123,
    keyTerms: ["Orchestrator", "Fan-out", "Sub-agent", "Handoff", "Token multiplication", "Generative agents (simulacra)"],
    prerequisites: ["AI Agents", "Tool Use & Function Calling"],
    learnMore: [
      { title: "Anthropic: How we built our multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
    ],
    realWorldApps: "Deep research tools, large-scale code migration, parallel document review",
  },

  // === Completeness pass, 2026-08: the classics the deep-learning era skips
  // and the frontier ideas the classics never met. ===
  {
    id: "decision-trees", concept: "Decision Trees & Random Forests", emoji: "🧠",
    description: "A decision tree splits data with a cascade of if-then questions; a random forest averages hundreds of trees trained on random slices of the data. On tabular business data they remain brutally hard to beat, and unlike neural networks a single tree can be read and explained line by line.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 124,
    keyTerms: ["Splitting criterion", "Gini impurity", "Ensemble", "Bagging", "Feature importance"],
    prerequisites: ["Supervised Learning"],
    learnMore: [
      { title: "scikit-learn: Decision Trees guide", url: "https://scikit-learn.org/stable/modules/tree.html" },
      { title: "StatQuest: the clearest tree and forest walkthroughs", url: "https://www.youtube.com/@statquest" },
    ],
    realWorldApps: "Credit scoring, churn prediction, fraud flags, any tabular dataset in industry",
  },
  {
    id: "svm", concept: "Support Vector Machines (SVM)", emoji: "🧠",
    description: "A classifier that finds the boundary with the widest possible margin between classes, and uses the kernel trick to draw curved boundaries by implicitly working in a higher-dimensional space. Pre-deep-learning state of the art, and still strong on small, clean datasets.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 125,
    keyTerms: ["Margin", "Support vectors", "Kernel trick", "Hyperplane", "Soft margin"],
    prerequisites: ["Supervised Learning", "Classification vs Regression"],
    learnMore: [
      { title: "scikit-learn: Support Vector Machines guide", url: "https://scikit-learn.org/stable/modules/svm.html" },
    ],
    realWorldApps: "Text classification with few examples, bioinformatics, image classification before CNNs took over",
  },
  {
    id: "evaluation-metrics", concept: "Evaluation Metrics & Cross-Validation", emoji: "🧠",
    description: "How you know a model works: accuracy, precision, recall, F1, ROC curves, and cross-validation to test on data the model never saw. Choosing the wrong metric is the classic silent failure, a 99% accurate cancer detector that never says cancer is worthless. Class imbalance is the classic trap here; the fixes, resampling and class weights, live in the Data entry.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 126,
    keyTerms: ["Precision & recall", "F1 score", "ROC-AUC", "Confusion matrix", "K-fold cross-validation", "Class imbalance"],
    prerequisites: ["Supervised Learning"],
    learnMore: [
      { title: "scikit-learn: model evaluation guide", url: "https://scikit-learn.org/stable/modules/model_evaluation.html" },
      { title: "Google ML Crash Course: classification", url: "https://developers.google.com/machine-learning/crash-course" },
    ],
    realWorldApps: "Every model review meeting, medical test validation, A/B testing, leaderboard design",
  },
  {
    id: "self-supervised-learning", concept: "Self-Supervised Learning", emoji: "🧠",
    description: "Learning from unlabeled data by inventing the labels: predict the next word, fill in the masked patch, decide whether two crops came from the same image. This is the idea that unlocked LLMs, since the internet is unlabeled and labeling it is impossible.",
    category: "Core ML Concepts", difficulty: "advanced", rank: 127,
    keyTerms: ["Pretext task", "Masked modeling", "Next-token prediction", "Contrastive objective", "Representation learning"],
    prerequisites: ["Neural Network", "Embeddings"],
    learnMore: [
      { title: "Lilian Weng: Self-Supervised Representation Learning", url: "https://lilianweng.github.io/posts/2019-11-10-self-supervised/" },
      { title: "Meta AI: SSL, the dark matter of intelligence", url: "https://ai.meta.com/blog/self-supervised-learning-the-dark-matter-of-intelligence/" },
    ],
    realWorldApps: "LLM pretraining, image encoders like DINO, speech models like Whisper, protein models",
  },
  {
    id: "continual-learning", concept: "Continual Learning & Catastrophic Forgetting", emoji: "🧠",
    description: "Neural networks trained on a new task tend to overwrite what they knew, which is why models are retrained from scratch instead of updated in place. Continual learning studies how to add knowledge without erasing the old, one of the most practical unsolved problems in the field.",
    category: "Core ML Concepts", difficulty: "advanced", rank: 128,
    keyTerms: ["Catastrophic forgetting", "Replay buffer", "Elastic weight consolidation", "Task interference", "Online learning"],
    prerequisites: ["Neural Network", "Transfer Learning"],
    learnMore: [
      { title: "A Comprehensive Survey of Continual Learning (2023)", url: "https://arxiv.org/abs/2302.00487" },
    ],
    realWorldApps: "Personalization without retraining, robots that learn on the job, keeping deployed models current",
  },
  {
    id: "meta-learning", concept: "Meta-Learning (Learning to Learn)", emoji: "🧠",
    description: "Training a model across many small tasks so it can pick up a brand-new task from a handful of examples. The explicit version of what LLMs turned out to do implicitly, in-context learning at scale made dedicated meta-learning algorithms like MAML mostly historical.",
    category: "Core ML Concepts", difficulty: "advanced", rank: 129,
    keyTerms: ["MAML", "Few-shot tasks", "Inner and outer loop", "Task distribution", "In-context learning"],
    prerequisites: ["Few-Shot & Zero-Shot Learning", "Gradient Descent"],
    learnMore: [
      { title: "Lilian Weng: Meta-Learning, Learning to Learn Fast", url: "https://lilianweng.github.io/posts/2018-11-30-meta-learning/" },
    ],
    realWorldApps: "Few-shot classification, rapid adaptation in robotics, historically the road to in-context learning",
  },
  {
    id: "causal-ml", concept: "Causal Inference & ML", emoji: "🧠",
    description: "Correlation predicts, causation decides. Causal inference asks what happens if you intervene: does the discount cause retention, or do loyal customers just use discounts? Tools like randomized experiments, uplift models, and instrumental variables answer questions prediction alone cannot.",
    category: "Core ML Concepts", difficulty: "advanced", rank: 130,
    keyTerms: ["Intervention", "Counterfactual", "Confounder", "Uplift modeling", "A/B testing"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "Causal Inference for the Brave and True (free book)", url: "https://matheusfacure.github.io/python-causality-handbook/landing-page.html" },
    ],
    realWorldApps: "Pricing and promotion decisions, medical treatment effects, policy evaluation, marketing attribution",
  },
  {
    id: "symbolic-ai", concept: "Symbolic AI & Expert Systems", emoji: "🧠",
    description: "The first fifty years of AI: intelligence as explicit rules, logic, and hand-built knowledge bases rather than learned weights. Expert systems ran real businesses in the 1980s before brittleness killed the boom. The ideas survive inside knowledge graphs, planners, and neuro-symbolic hybrids.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 131,
    keyTerms: ["Rule-based systems", "Knowledge base", "Inference engine", "GOFAI", "AI winter"],
    prerequisites: [],
    learnMore: [
      { title: "Stanford Encyclopedia of Philosophy: Artificial Intelligence", url: "https://plato.stanford.edu/entries/artificial-intelligence/" },
    ],
    realWorldApps: "Tax and insurance rule engines, medical coding, the knowledge-graph half of modern hybrids",
  },
  {
    id: "linear-algebra-ml", concept: "Linear Algebra for ML", emoji: "📐",
    description: "The substrate everything runs on: data is vectors, models are matrices, and a forward pass is matrix multiplication. You need a working feel for dot products, matrix shapes, and eigenvectors, not proofs. GPUs exist because this one operation dominates all of AI. SVD, the workhorse matrix decomposition, is the machinery behind PCA and the low-rank idea LoRA reuses.",
    category: "Math & Optimization", difficulty: "beginner", rank: 132,
    keyTerms: ["Vector", "Matrix multiplication", "Dot product", "Eigenvalues", "Rank", "SVD (singular value decomposition)"],
    prerequisites: [],
    learnMore: [
      { title: "3Blue1Brown: Essence of Linear Algebra", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" },
      { title: "Mathematics for Machine Learning (free book)", url: "https://mml-book.github.io/" },
    ],
    realWorldApps: "Every single forward pass, embeddings, attention, PCA, graphics, and the GPU market",
  },
  {
    id: "probability-bayes", concept: "Probability & Bayes' Theorem", emoji: "📐",
    description: "Machine learning is applied probability: models output distributions, training maximizes likelihood, and Bayes' theorem tells you how to update belief when evidence arrives. It is also the antidote to the classic diagnostic fallacy, a positive test for a rare disease usually still means you are fine.",
    category: "Math & Optimization", difficulty: "beginner", rank: 133,
    keyTerms: ["Conditional probability", "Prior and posterior", "Likelihood", "Distributions", "Expectation"],
    prerequisites: [],
    learnMore: [
      { title: "Khan Academy: Statistics and Probability", url: "https://www.khanacademy.org/math/statistics-probability" },
      { title: "3Blue1Brown: Bayes theorem, visualized", url: "https://www.youtube.com/watch?v=HZGCoVF3YvM" },
    ],
    realWorldApps: "Spam filters, medical diagnosis, language model sampling, risk models, A/B test analysis",
  },
  {
    id: "information-theory", concept: "Information Theory: Entropy & KL Divergence", emoji: "📐",
    description: "Shannon's mathematics of surprise. Entropy measures how unpredictable a distribution is, cross-entropy is the loss nearly every classifier and LLM trains on, and KL divergence measures how far one distribution drifts from another, which is how RLHF keeps a tuned model close to its base.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 134,
    keyTerms: ["Entropy", "Cross-entropy loss", "KL divergence", "Bits", "Perplexity"],
    prerequisites: ["Probability & Bayes' Theorem", "Loss Function"],
    learnMore: [
      { title: "Chris Olah: Visual Information Theory", url: "https://colah.github.io/posts/2015-09-Visual-Information/" },
    ],
    realWorldApps: "The loss function of LLMs, compression, perplexity benchmarks, the KL penalty in RLHF",
  },
  {
    id: "optimizers", concept: "Optimizers: SGD, Momentum & Adam", emoji: "📐",
    description: "Gradient descent says which direction to step; optimizers decide how big and how smart the step is. Momentum smooths the path, Adam adapts the step size per parameter, and AdamW is the default that trains nearly every modern model. Small detail, enormous practical consequence.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 135,
    keyTerms: ["SGD", "Momentum", "Adam & AdamW", "Learning rate schedule", "Warmup"],
    prerequisites: ["Gradient Descent"],
    learnMore: [
      { title: "Sebastian Ruder: An overview of gradient descent optimization", url: "https://www.ruder.io/optimizing-gradient-descent/" },
    ],
    realWorldApps: "Every training run; learning-rate schedules are often the difference between converging and diverging",
  },
  {
    id: "bayesian-ml", concept: "Bayesian ML & Uncertainty", emoji: "📐",
    description: "Instead of one best model, keep a distribution over models and let predictions carry error bars. Bayesian methods quantify what the model does not know, which matters when a wrong-but-confident answer costs money or lives. The ideas power probabilistic programming and calibrated forecasting.",
    category: "Math & Optimization", difficulty: "advanced", rank: 136,
    keyTerms: ["Posterior distribution", "Uncertainty quantification", "MCMC", "Probabilistic programming", "Calibration"],
    prerequisites: ["Probability & Bayes' Theorem"],
    learnMore: [
      { title: "Bayesian Methods for Hackers (free book)", url: "https://github.com/CamDavidsonPilon/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers" },
    ],
    realWorldApps: "Drug trials, demand forecasting with error bars, active learning, autonomous-system safety cases",
  },
  {
    id: "residual-connections", concept: "Residual Connections & ResNet", emoji: "🏗️",
    description: "A shortcut that adds a layer's input to its output, letting gradients flow through very deep networks instead of vanishing. ResNet used it to jump from 20-layer to 150-layer networks in 2015, and every transformer block since is built around the same skip connection.",
    category: "Architectures", difficulty: "intermediate", rank: 137,
    keyTerms: ["Skip connection", "Identity mapping", "Vanishing gradients", "Deep networks", "ResNet"],
    prerequisites: ["Neural Network", "Backpropagation"],
    learnMore: [
      { title: "Deep Residual Learning for Image Recognition (the ResNet paper)", url: "https://arxiv.org/abs/1512.03385" },
      { title: "Dive into Deep Learning: ResNet chapter", url: "https://d2l.ai/chapter_convolutional-modern/resnet.html" },
    ],
    realWorldApps: "Inside every modern architecture: CNNs, transformers, diffusion U-Nets, all of them",
  },
  {
    id: "normalization-layers", concept: "Normalization Layers (BatchNorm to RMSNorm)", emoji: "🏗️",
    description: "Layers that rescale activations so training stays stable as networks get deep. BatchNorm made deep CNNs trainable, LayerNorm made transformers possible, and RMSNorm is the leaner variant inside most current LLMs. Unglamorous, and load-bearing for everything.",
    category: "Architectures", difficulty: "intermediate", rank: 138,
    keyTerms: ["Batch normalization", "Layer normalization", "RMSNorm", "Internal covariate shift", "Training stability"],
    prerequisites: ["Neural Network", "Activation Functions"],
    learnMore: [
      { title: "Batch Normalization (the original paper)", url: "https://arxiv.org/abs/1502.03167" },
      { title: "Dive into Deep Learning: Batch Normalization", url: "https://d2l.ai/chapter_convolutional-modern/batch-norm.html" },
    ],
    realWorldApps: "Every deep network trained since 2015; pre-norm vs post-norm is a real LLM design decision",
  },
  {
    id: "autoencoders", concept: "Autoencoders", emoji: "🏗️",
    description: "A network trained to compress its input into a small code and reconstruct it, learning structure with no labels at all. The bottleneck forces the model to keep only what matters. Variants denoise images, detect anomalies, and, as VAEs, define the latent spaces diffusion models paint in.",
    category: "Architectures", difficulty: "intermediate", rank: 139,
    keyTerms: ["Encoder & decoder", "Bottleneck", "Latent space", "Reconstruction loss", "Denoising"],
    prerequisites: ["Neural Network", "Unsupervised Learning"],
    learnMore: [
      { title: "Deep Learning Book: Autoencoders chapter (free)", url: "https://www.deeplearningbook.org/contents/autoencoders.html" },
    ],
    realWorldApps: "Anomaly detection in fraud and manufacturing, image compression, the latent space of Stable Diffusion",
  },
  {
    id: "graph-neural-networks", concept: "Graph Neural Networks (GNNs)", emoji: "🏗️",
    description: "Networks that operate on graphs by passing messages between connected nodes, so a node's representation absorbs its neighborhood. Where CNNs assume a grid and transformers assume a sequence, GNNs assume relationships, which is what fraud rings, molecules, and social networks actually are.",
    category: "Architectures", difficulty: "advanced", rank: 140,
    keyTerms: ["Message passing", "Node embeddings", "Graph convolution", "Aggregation", "Link prediction"],
    prerequisites: ["Neural Network", "Embeddings"],
    learnMore: [
      { title: "A Gentle Introduction to Graph Neural Networks (Distill)", url: "https://distill.pub/2021/gnn-intro/" },
      { title: "Stanford CS224W: Machine Learning with Graphs", url: "https://web.stanford.edu/class/cs224w/" },
    ],
    realWorldApps: "Fraud detection, drug discovery, recommendation graphs, traffic prediction, chip placement",
  },
  {
    id: "positional-encoding", concept: "Positional Encoding & RoPE", emoji: "🏗️",
    description: "Attention treats its input as an unordered set, so word order has to be injected explicitly. Early transformers added sine-wave position signals; modern LLMs rotate query and key vectors by position (RoPE), which extends more gracefully to long contexts. Context-window tricks usually live here.",
    category: "Architectures", difficulty: "advanced", rank: 141,
    keyTerms: ["Position embeddings", "Sinusoidal encoding", "RoPE", "Relative position", "Context extension"],
    prerequisites: ["Transformer Architecture", "Attention Mechanism"],
    learnMore: [
      { title: "The Illustrated Transformer (Jay Alammar)", url: "https://jalammar.github.io/illustrated-transformer/" },
      { title: "RoFormer: Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864" },
    ],
    realWorldApps: "Why a model knows 'dog bites man' from 'man bites dog', and how million-token contexts are stretched",
  },
  {
    id: "speech-recognition", concept: "Speech Recognition (ASR) & Whisper", emoji: "🗣️",
    description: "Turning audio into text. Whisper made near-human transcription open source and free to run on a laptop, trained on 680,000 hours of web audio in 90-plus languages. ASR is the front door of voice assistants, meeting notes, subtitles, and every voice-first AI interface.",
    category: "NLP & Language", difficulty: "intermediate", rank: 142,
    keyTerms: ["ASR", "Mel spectrogram", "Whisper", "Word error rate", "Diarization"],
    prerequisites: ["Neural Network", "Transformer Architecture"],
    learnMore: [
      { title: "OpenAI: Introducing Whisper", url: "https://openai.com/index/whisper/" },
      { title: "Hugging Face Audio Course (free)", url: "https://huggingface.co/learn/audio-course/chapter0/introduction" },
    ],
    realWorldApps: "Meeting transcription, voice assistants, call-center analytics, subtitles, medical dictation",
  },
  {
    id: "dpo", concept: "DPO & Preference Optimization", emoji: "🗣️",
    description: "Direct Preference Optimization tunes a model on pairs of preferred and rejected answers with a simple classification-style loss, no reward model and no RL loop. It made preference tuning accessible to anyone with a GPU, and most open models now align with DPO or one of its descendants.",
    category: "NLP & Language", difficulty: "advanced", rank: 143,
    keyTerms: ["Preference pairs", "Implicit reward", "Reference model", "DPO vs RLHF", "Chosen and rejected"],
    prerequisites: ["Fine-Tuning LLMs", "RLHF (Reinforcement Learning from Human Feedback)"],
    learnMore: [
      { title: "Direct Preference Optimization (the DPO paper)", url: "https://arxiv.org/abs/2305.18290" },
      { title: "Hugging Face: fine-tune Llama 2 with DPO", url: "https://huggingface.co/blog/dpo-trl" },
    ],
    realWorldApps: "Alignment of most open-weights chat models, style tuning, harmlessness training on a budget",
  },
  {
    id: "lora-peft", concept: "LoRA & Parameter-Efficient Fine-Tuning", emoji: "🗣️",
    description: "Instead of updating billions of weights, LoRA freezes the model and trains two small low-rank matrices per layer, often under one percent of the parameters. Fine-tuning that needed a cluster now fits on one consumer GPU, and swapping adapters swaps skills without touching the base model.",
    category: "NLP & Language", difficulty: "intermediate", rank: 144,
    keyTerms: ["Low-rank adaptation", "Adapters", "QLoRA", "Frozen base model", "PEFT"],
    prerequisites: ["Fine-Tuning LLMs"],
    learnMore: [
      { title: "LoRA: Low-Rank Adaptation of Large Language Models", url: "https://arxiv.org/abs/2106.09685" },
      { title: "Hugging Face PEFT (blog + library)", url: "https://huggingface.co/blog/peft" },
    ],
    realWorldApps: "Custom-styled image models, domain-tuned chatbots, per-customer adapters served from one base",
  },
  {
    id: "open-weights-slm", concept: "Open-Weights & Small Language Models", emoji: "🗣️",
    description: "Models whose weights you can download, run, and tune yourself: the Llama, Qwen, DeepSeek, and Mistral lines. Small language models in the 1B to 14B range now do real work on laptops and phones. The open-versus-closed gap keeps narrowing, and pricing power follows it.",
    category: "NLP & Language", difficulty: "intermediate", rank: 145,
    keyTerms: ["Open weights vs open source", "SLM", "Local inference", "Model licenses", "Distilled models"],
    prerequisites: ["Large Language Models (LLMs)"],
    learnMore: [
      { title: "LMArena: community leaderboard across open and closed models", url: "https://lmarena.ai/" },
      { title: "Ollama: run open models locally", url: "https://ollama.com/" },
    ],
    realWorldApps: "On-device assistants, data-sovereign deployments, edge inference, fine-tuned vertical models",
  },
  {
    id: "contrastive-clip", concept: "Contrastive Learning & CLIP", emoji: "👁️",
    description: "Train two encoders so matching pairs land close in embedding space and mismatched pairs land far apart. CLIP did this for 400 million image-caption pairs and got zero-shot classification for free: name the classes in English and it picks one. The bridge most multimodal systems stand on.",
    category: "Computer Vision", difficulty: "advanced", rank: 146,
    keyTerms: ["Contrastive loss", "Shared embedding space", "Zero-shot classification", "Image-text pairs", "InfoNCE"],
    prerequisites: ["Embeddings", "Multimodal Models"],
    learnMore: [
      { title: "OpenAI: CLIP, connecting text and images", url: "https://openai.com/index/clip/" },
      { title: "Lilian Weng: Contrastive Representation Learning", url: "https://lilianweng.github.io/posts/2021-05-31-contrastive/" },
    ],
    realWorldApps: "Visual search, image moderation, the text encoder guiding Stable Diffusion, dataset curation",
  },
  {
    id: "ocr-document-ai", concept: "OCR & Document AI", emoji: "👁️",
    description: "Reading text out of scans, PDFs, and photos, then understanding the document's structure: tables, forms, signatures, layouts. Classic OCR engines like Tesseract now share the field with vision-language models that read a whole invoice and answer questions about it directly.",
    category: "Computer Vision", difficulty: "intermediate", rank: 147,
    keyTerms: ["OCR", "Layout analysis", "Table extraction", "Document VQA", "Handwriting recognition"],
    prerequisites: ["Convolutional Neural Network (CNN)", "Multimodal Models"],
    learnMore: [
      { title: "Tesseract OCR (open source since 2005)", url: "https://github.com/tesseract-ocr/tesseract" },
      { title: "PaddleOCR: modern multilingual OCR toolkit", url: "https://github.com/PaddlePaddle/PaddleOCR" },
    ],
    realWorldApps: "Invoice processing, KYC document checks, digitizing archives, receipt scanning, accessibility",
  },
  {
    id: "flow-matching", concept: "Flow Matching & Modern Diffusion", emoji: "🎨",
    description: "A cleaner way to train generative models: learn a velocity field that transports noise to data along straight paths, instead of learning to undo many noising steps. Simpler math, fewer sampling steps, and it now powers state-of-the-art image generators and robot policies alike.",
    category: "Generative AI", difficulty: "advanced", rank: 148,
    keyTerms: ["Velocity field", "Probability flow", "Rectified flow", "ODE sampling", "Continuous normalizing flows"],
    prerequisites: ["Diffusion Models"],
    learnMore: [
      { title: "Flow Matching for Generative Modeling", url: "https://arxiv.org/abs/2210.02747" },
      { title: "Flow Matching Guide and Code (Meta)", url: "https://arxiv.org/abs/2412.06264" },
    ],
    realWorldApps: "Current image and video generators, fast few-step sampling, robot action policies like pi-zero",
  },
  {
    id: "watermarking-detection", concept: "AI Watermarking & Content Detection", emoji: "🛡️",
    description: "Embedding an invisible statistical signature in generated text, images, or audio so provenance can be checked later, plus the harder question of detecting AI content that was never watermarked. Reliable detection without a watermark remains largely unsolved, which is why provenance standards matter.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 149,
    keyTerms: ["SynthID", "Statistical watermark", "Provenance", "C2PA content credentials", "Detection false positives"],
    prerequisites: ["Text Generation & Sampling"],
    learnMore: [
      { title: "Scalable watermarking for LLM outputs (SynthID-Text, Nature)", url: "https://www.nature.com/articles/s41586-024-08025-4" },
    ],
    realWorldApps: "Platform content labeling, deepfake forensics, newsroom verification, academic integrity tools",
  },
  {
    id: "constitutional-ai", concept: "Constitutional AI & RLAIF", emoji: "🛡️",
    description: "Alignment where the feedback comes from AI guided by an explicit list of principles, a constitution, instead of thousands of human raters. The model critiques and revises its own outputs against the principles, making the values legible and editable rather than buried in rater preferences.",
    category: "Safety, Ethics & Governance", difficulty: "advanced", rank: 150,
    keyTerms: ["Constitution", "Self-critique", "RLAIF", "Principle-based feedback", "Harmlessness"],
    prerequisites: ["RLHF (Reinforcement Learning from Human Feedback)", "AI Alignment"],
    learnMore: [
      { title: "Constitutional AI: Harmlessness from AI Feedback", url: "https://arxiv.org/abs/2212.08073" },
    ],
    realWorldApps: "How Claude is trained, scalable alignment pipelines, auditable AI values",
  },
  {
    id: "differential-privacy", concept: "Differential Privacy & ML Privacy", emoji: "🛡️",
    description: "A mathematical guarantee that a model or statistic barely changes whether or not any single person's data is included, enforced by adding calibrated noise. The gold standard for training on sensitive data, used by the US Census, Apple, and Google, with a real accuracy cost to budget for.",
    category: "Safety, Ethics & Governance", difficulty: "advanced", rank: 151,
    keyTerms: ["Privacy budget (epsilon)", "Noise injection", "DP-SGD", "Membership inference", "Anonymization limits"],
    prerequisites: ["Machine Learning (ML)", "Probability & Bayes' Theorem"],
    learnMore: [
      { title: "Programming Differential Privacy (free book)", url: "https://programming-dp.com/" },
    ],
    realWorldApps: "US Census releases, keyboard prediction telemetry, medical research on patient data",
  },
  {
    id: "agi", concept: "AGI (Artificial General Intelligence)", emoji: "🛡️",
    description: "The contested idea of AI matching humans across most cognitive work, rather than excelling at one task. Definitions vary so much that serious frameworks now grade levels of generality and autonomy instead of arguing over a single finish line. The term drives lab missions, policy, and billions in capital.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 152,
    keyTerms: ["Narrow vs general AI", "Levels of AGI", "Autonomy", "Superintelligence", "Capability thresholds"],
    prerequisites: ["Large Language Models (LLMs)"],
    learnMore: [
      { title: "Levels of AGI (Google DeepMind)", url: "https://arxiv.org/abs/2311.02462" },
    ],
    realWorldApps: "Lab charters and safety policies, compute governance debates, how AI progress gets measured",
  },
  {
    id: "agent-memory-planning", concept: "Agent Memory, Planning & Reflection", emoji: "🤖",
    description: "What separates an agent from a chatbot: somewhere to keep state beyond the context window, a way to break goals into steps, and the habit of checking its own work. Memory stores and retrieval, plan-then-execute loops, and reflection passes are the current toolkit, all still far from solved.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 153,
    keyTerms: ["Long-term memory", "Task decomposition", "Reflection", "Scratchpad", "Context management"],
    prerequisites: ["AI Agents", "Retrieval-Augmented Generation (RAG)"],
    learnMore: [
      { title: "Lilian Weng: LLM Powered Autonomous Agents", url: "https://lilianweng.github.io/posts/2023-06-23-agent/" },
    ],
    realWorldApps: "Coding agents that survive long tasks, personal assistants that remember you, research agents",
  },
  {
    id: "hyperparameter-tuning", concept: "Hyperparameter Tuning", emoji: "⚙️",
    description: "The knobs you set before training, learning rate, batch size, architecture width, decide whether a run converges or burns money. Tuning ranges from grid and random search to Bayesian optimization, and in deep learning the learning-rate schedule is almost always the knob that matters most. AutoML pushes the same search over whole models and features, and Neural Architecture Search applies it to the architecture itself.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 154,
    keyTerms: ["Learning rate", "Grid vs random search", "Bayesian optimization", "Early stopping", "Sweeps", "AutoML"],
    prerequisites: ["Gradient Descent", "Overfitting & Underfitting"],
    learnMore: [
      { title: "Google Research: Deep Learning Tuning Playbook", url: "https://github.com/google-research/tuning_playbook" },
    ],
    realWorldApps: "Every serious training run; sweep tooling in W&B and Optuna exists for exactly this",
  },

  // === Market-coverage pass, 2026-08-08: gaps confirmed by the IBM Think
  // audit after adversarial verification. The intro-classifier family is now
  // complete, and the data-practice layer (leakage, EDA, augmentation) that
  // practitioner curricula lead with finally has teaching targets here. ===
  {
    id: "logistic-regression", concept: "Logistic Regression", emoji: "🧠",
    description: "The industry-default baseline classifier: a linear model pushed through a sigmoid so its output reads as a probability. It is also the bridge to deep learning, since a single sigmoid neuron trained with cross-entropy IS logistic regression. Interpretable, fast, and the first thing to try before anything fancier.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 155,
    keyTerms: ["Sigmoid", "Decision boundary", "Log odds", "Cross-entropy", "Baseline model"],
    prerequisites: ["Linear Regression", "Classification vs Regression"],
    learnMore: [
      { title: "scikit-learn: Logistic regression guide", url: "https://scikit-learn.org/stable/modules/linear_model.html" },
    ],
    realWorldApps: "Credit default scoring, click-through prediction, medical risk models, every A/B test readout",
  },
  {
    id: "data-leakage", concept: "Data Leakage", emoji: "🧠",
    description: "When information from outside the training set sneaks into training, so the model aces validation and faceplants in production. Classic forms: preprocessing before the split, target information hiding in a feature, duplicate rows across splits, and peeking into the future on time series. The number-one practical reason ML projects report great numbers and then fail.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 156,
    keyTerms: ["Target leakage", "Train-test contamination", "Temporal look-ahead", "Pipeline ordering", "Benchmark contamination"],
    prerequisites: ["Evaluation Metrics & Cross-Validation"],
    learnMore: [
      { title: "scikit-learn: common pitfalls (leakage section)", url: "https://scikit-learn.org/stable/common_pitfalls.html" },
      { title: "Kaggle: Data Leakage lesson", url: "https://www.kaggle.com/code/alexisbcook/data-leakage" },
    ],
    realWorldApps: "Why deployed models underperform their offline metrics; also why LLM benchmark scores get contested",
  },
  {
    id: "eda", concept: "Exploratory Data Analysis (EDA)", emoji: "🧠",
    description: "The discipline of looking at the data before modeling it: distributions, missing values, outliers, correlations, and the weird rows that reveal how the data was actually collected. An hour of EDA routinely saves a week of debugging a model trained on data you did not understand.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 157,
    keyTerms: ["Distributions", "Outliers", "Missing values", "Correlation matrix", "Data profiling"],
    prerequisites: [],
    learnMore: [
      { title: "NIST Engineering Statistics Handbook: EDA", url: "https://www.itl.nist.gov/div898/handbook/eda/eda.htm" },
    ],
    realWorldApps: "The first day of every real ML project; where data leakage and label problems get caught early",
  },
  {
    id: "data-augmentation", concept: "Data Augmentation", emoji: "🧠",
    description: "Stretching a dataset by transforming what you have: flips, crops, and color jitter for images, mixup and CutMix across examples, back-translation for text, SpecAugment for audio. A data-side regularizer that buys accuracy for free when labels are expensive, and standard practice in every vision pipeline.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 158,
    keyTerms: ["Flips & crops", "Mixup & CutMix", "Back-translation", "SpecAugment", "Label-preserving transforms"],
    prerequisites: ["Overfitting & Underfitting"],
    learnMore: [
      { title: "torchvision transforms (the standard toolkit)", url: "https://pytorch.org/vision/stable/transforms.html" },
      { title: "A survey on image data augmentation (open access)", url: "https://journalofbigdata.springeropen.com/articles/10.1186/s40537-019-0197-0" },
    ],
    realWorldApps: "Every vision model in production, low-data medical imaging, robust speech recognition",
  },
  {
    id: "knn", concept: "k-Nearest Neighbors (kNN)", emoji: "🧠",
    description: "Classify a point by asking what its k closest neighbors are. No training at all, just distance and a vote, which makes it the clearest intuition pump in ML and a surprisingly modern one: nearest-neighbor search over embeddings is exactly how vector databases retrieve, so kNN quietly powers RAG.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 159,
    keyTerms: ["Distance metrics", "Choice of k", "Lazy learning", "Curse of dimensionality", "Nearest-neighbor search"],
    prerequisites: ["Supervised Learning"],
    learnMore: [
      { title: "scikit-learn: Nearest Neighbors guide", url: "https://scikit-learn.org/stable/modules/neighbors.html" },
    ],
    realWorldApps: "Similarity search, recommendation fallbacks, anomaly detection, the retrieval half of RAG",
  },
  {
    id: "naive-bayes", concept: "Naive Bayes", emoji: "🧠",
    description: "A classifier that applies Bayes' theorem with one bold simplification: treat every feature as independent. Wrong assumption, great results, especially on text, where it filtered spam for a decade and still makes a hard-to-beat baseline. Also the cleanest example of a generative classifier next to logistic regression's discriminative approach.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 160,
    keyTerms: ["Conditional independence", "Prior & likelihood", "Generative vs discriminative", "Spam filtering", "Laplace smoothing"],
    prerequisites: ["Probability & Bayes' Theorem", "Classification vs Regression"],
    learnMore: [
      { title: "scikit-learn: Naive Bayes guide", url: "https://scikit-learn.org/stable/modules/naive_bayes.html" },
    ],
    realWorldApps: "Spam and abuse filters, quick text classification baselines, medical triage scoring",
  },
  {
    id: "data-science", concept: "Data Science vs ML vs AI", emoji: "🧠",
    description: "The disambiguation everyone needs once: AI is the goal (machines doing intelligent things), ML is the dominant method (learning from data), deep learning is ML with neural networks, and data science is the wider craft of extracting insight from data, modeling included but also analysis, experimentation, and communication. Data engineering builds the pipelines all of them stand on.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 161,
    keyTerms: ["AI vs ML vs DL", "Analytics", "Data engineering", "Statistics", "Decision science"],
    prerequisites: [],
    learnMore: [
      { title: "IBM: What is data science?", url: "https://www.ibm.com/think/topics/data-science" },
    ],
    realWorldApps: "Reading job postings correctly, scoping projects, knowing which specialist a problem needs",
  },
  {
    id: "monte-carlo", concept: "Monte Carlo Methods", emoji: "📐",
    description: "Answering hard questions by random sampling: estimate what you cannot compute by simulating it many times. The name behind MCMC in Bayesian inference, Monte Carlo returns in reinforcement learning, dropout-based uncertainty, and the tree search that powered AlphaGo. One idea, remarkable reach.",
    category: "Math & Optimization", difficulty: "advanced", rank: 162,
    keyTerms: ["Random sampling", "MCMC", "Monte Carlo Tree Search", "Simulation", "Variance reduction"],
    prerequisites: ["Probability & Bayes' Theorem"],
    learnMore: [
      { title: "Sutton & Barto: RL, An Introduction (free, MC chapters)", url: "http://incompleteideas.net/book/the-book-2nd.html" },
      { title: "Bayesian Methods for Hackers (MCMC in practice)", url: "https://github.com/CamDavidsonPilon/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers" },
    ],
    realWorldApps: "AlphaGo's tree search, risk simulation in finance, Bayesian posterior sampling, uncertainty estimates",
  },
  {
    id: "bag-of-words", concept: "Bag-of-Words & TF-IDF", emoji: "🗣️",
    description: "The pre-neural way to turn text into numbers: count the words, weight the rare ones higher (TF-IDF), ignore the order. Crude and still load-bearing, since BM25, its direct descendant, powers the sparse half of hybrid retrieval in modern RAG stacks and remains the search baseline to beat.",
    category: "NLP & Language", difficulty: "beginner", rank: 163,
    keyTerms: ["Term frequency", "TF-IDF", "BM25", "Sparse vectors", "N-grams"],
    prerequisites: ["Tokenization"],
    learnMore: [
      { title: "scikit-learn: text feature extraction", url: "https://scikit-learn.org/stable/modules/feature_extraction.html" },
      { title: "Speech and Language Processing (Jurafsky & Martin, free draft)", url: "https://web.stanford.edu/~jurafsky/slp3/" },
    ],
    realWorldApps: "Search engines, the sparse side of hybrid RAG retrieval, quick text classifiers, deduplication",
  },
  {
    id: "text-summarization", concept: "Text Summarization", emoji: "🗣️",
    description: "Compressing a document while keeping what matters, either by extracting the key sentences or by generating new text (abstractive). LLMs made the abstractive kind everyday technology, and moved the hard problem to faithfulness: a fluent summary that quietly invents a detail is worse than a clumsy accurate one.",
    category: "NLP & Language", difficulty: "intermediate", rank: 164,
    keyTerms: ["Extractive vs abstractive", "ROUGE", "Faithfulness", "Hallucinated details", "Long-document summarization"],
    prerequisites: ["Large Language Models (LLMs)"],
    learnMore: [
      { title: "Hugging Face: the summarization task", url: "https://huggingface.co/tasks/summarization" },
    ],
    realWorldApps: "Meeting notes, news digests, legal document review, the TLDR button in every product",
  },
  {
    id: "topic-modeling", concept: "Topic Modeling", emoji: "🗣️",
    description: "Discovering what a pile of documents is about without reading them: classic LDA finds word-cooccurrence themes, modern BERTopic clusters documents in embedding space and labels the clusters. The workhorse of content intelligence, from research-literature mapping to SEO keyword clustering.",
    category: "NLP & Language", difficulty: "intermediate", rank: 165,
    keyTerms: ["LDA (Latent Dirichlet Allocation)", "NMF", "BERTopic", "Embedding clustering", "Topic coherence"],
    prerequisites: ["Unsupervised Learning", "Embeddings"],
    learnMore: [
      { title: "BERTopic documentation", url: "https://maartengr.github.io/BERTopic/" },
      { title: "scikit-learn: LDA and NMF decomposition", url: "https://scikit-learn.org/stable/modules/decomposition.html" },
    ],
    realWorldApps: "Voice-of-customer mining, SEO content clustering, research trend mapping, feed curation",
  },
  {
    id: "information-extraction", concept: "Information Extraction", emoji: "🗣️",
    description: "Turning free text into structured facts: the umbrella above named entity recognition that adds relation extraction, event extraction, and entity linking. LLMs with structured output turned this from a pipeline of brittle models into a prompt, and it is exactly how knowledge graphs get built from documents.",
    category: "NLP & Language", difficulty: "intermediate", rank: 166,
    keyTerms: ["Relation extraction", "Entity linking", "Event extraction", "Structured output", "Knowledge graph construction"],
    prerequisites: ["Named Entity Recognition (NER)"],
    learnMore: [
      { title: "Speech and Language Processing: IE chapters (free draft)", url: "https://web.stanford.edu/~jurafsky/slp3/" },
      { title: "spaCy: industrial-strength NLP", url: "https://spacy.io/" },
    ],
    realWorldApps: "Building knowledge graphs, contract analysis, pharma literature mining, CRM auto-fill",
  },
  {
    id: "ai-stack", concept: "The AI Stack", emoji: "⚙️",
    description: "How the pieces fit: silicon and clouds at the bottom, then data infrastructure, then foundation models, then orchestration and tooling, then the applications people actually touch. Knowing the layers turns a soup of company names into a map, and explains who depends on whom when one layer wobbles.",
    category: "MLOps & Infrastructure", difficulty: "beginner", rank: 167,
    keyTerms: ["Infrastructure layer", "Model layer", "Orchestration", "Application layer", "Value chain"],
    prerequisites: [],
    learnMore: [
      { title: "This site's Map of the AI Economy (455 entities, 7 layers)", url: "/notebook/ai/map" },
      { title: "a16z: Emerging Architectures for LLM Applications", url: "https://a16z.com/emerging-architectures-for-llm-applications/" },
    ],
    realWorldApps: "Vendor decisions, reading AI news critically, spotting chokepoints and single points of failure",
  },

  // === Market sweep round 2, 2026-08-08: gaps confirmed against the union
  // catalog of Google's ML glossary, Hugging Face Learn, DeepLearning.AI,
  // MIT 6.S191/6.036, Anthropic's courses, Wikipedia's ML outline, and AWS. ===
  {
    id: "pgm-hmm", concept: "Probabilistic Graphical Models & HMMs", emoji: "📐",
    description: "Networks of random variables whose edges encode dependence: Bayesian networks for causal structure, hidden Markov models for sequences with hidden state. Pre-deep-learning speech recognition and gene finding ran on HMMs and Viterbi decoding, and the toolkit (EM, Kalman filters) still runs tracking, robotics, and diagnosis systems today.",
    category: "Math & Optimization", difficulty: "advanced", rank: 168,
    keyTerms: ["Bayesian networks", "Hidden Markov Models", "Viterbi algorithm", "Expectation-Maximization", "Kalman filters"],
    prerequisites: ["Probability & Bayes' Theorem"],
    learnMore: [
      { title: "Stanford CS228: Probabilistic Graphical Models (free notes)", url: "https://ermongroup.github.io/cs228-notes/" },
      { title: "Speech and Language Processing: HMM chapters (free draft)", url: "https://web.stanford.edu/~jurafsky/slp3/" },
    ],
    realWorldApps: "Object tracking, medical diagnosis networks, gene finding, GPS sensor fusion via Kalman filters",
  },
  {
    id: "evolutionary-algorithms", concept: "Evolutionary & Swarm Optimization", emoji: "📐",
    description: "Optimization by natural selection: keep a population of candidate solutions, score them with a fitness function, breed and mutate the winners. Genetic algorithms, genetic programming, and particle swarms search spaces gradients cannot touch, which is why neuroevolution keeps resurfacing for architecture search and game agents.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 169,
    keyTerms: ["Genetic algorithms", "Fitness function", "Mutation & crossover", "Particle swarm", "Neuroevolution"],
    prerequisites: ["Machine Learning (ML)"],
    learnMore: [
      { title: "Essentials of Metaheuristics (free book, Sean Luke)", url: "https://cs.gmu.edu/~sean/book/metaheuristics/" },
    ],
    realWorldApps: "Scheduling and routing, NASA's evolved antenna designs, architecture search, game-playing agents",
  },
  {
    id: "face-recognition", concept: "Face Detection & Recognition", emoji: "👁️",
    description: "Finding faces in images, then matching them to identities via face embeddings, where verification is one-to-one and identification is one-to-many. Accuracy went superhuman in the deep-learning era, which is exactly why the ethics got harder: demographic error gaps, surveillance concerns, and outright bans in some jurisdictions are part of the topic, not a footnote.",
    category: "Computer Vision", difficulty: "intermediate", rank: 170,
    keyTerms: ["Face embeddings", "Verification vs identification", "Liveness detection", "NIST FRVT", "Demographic error gaps"],
    prerequisites: ["Convolutional Neural Network (CNN)", "Embeddings"],
    learnMore: [
      { title: "NIST FRVT: the standard face-recognition evaluation", url: "https://pages.nist.gov/frvt/html/frvt11.html" },
      { title: "OpenCV documentation", url: "https://docs.opencv.org/4.x/" },
    ],
    realWorldApps: "Phone unlock, passport e-gates, photo library grouping, and the regulation debates around all three",
  },
  {
    id: "quantum-ml", concept: "Quantum Machine Learning", emoji: "⚙️",
    description: "Running learning algorithms on quantum hardware: variational circuits as models, qubits as the substrate. The honest status in 2026 is that no practical ML advantage exists yet, today's NISQ devices are small and noisy, and classical hardware keeps winning. Worth understanding because the mathematics is elegant and the hardware curve is real; not worth switching careers for.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 171,
    keyTerms: ["Qubits", "Variational quantum circuits", "NISQ era", "Quantum advantage", "Hybrid quantum-classical"],
    prerequisites: ["Linear Algebra for ML"],
    learnMore: [
      { title: "PennyLane: hands-on quantum ML (free)", url: "https://pennylane.ai/qml/" },
    ],
    realWorldApps: "Research labs, chemistry and materials simulation, long-horizon bets by IBM and Google",
  },
  {
    id: "agent-harness", concept: "Agent Harnesses & Scaffolding", emoji: "🤖",
    description: "The engineering around the model that turns it into a dependable agent: the loop that feeds observations back, permissions and sandboxing that bound what it may touch, subagents for parallel work, and skills or hooks that package procedures. Model quality sets the ceiling; the harness decides how close you get, and it is where most real agent engineering happens.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 172,
    keyTerms: ["Agent loop", "Permissions & sandboxing", "Subagents", "Skills & hooks", "Long-running agents"],
    prerequisites: ["AI Agents", "Tool Use & Function Calling"],
    learnMore: [
      { title: "Anthropic: Building Effective Agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
    realWorldApps: "Coding agents like Claude Code, computer-use products, production agent reliability work",
  },

  // === Infrastructure layer, 2026-08-08: the accelerated-computing angle
  // NVIDIA's glossary teaches and general AI references skip. We had the
  // chip (GPU & TPU) and the job (Distributed Training) but nothing about
  // the building they live in, or the number format the math runs in. ===
  {
    id: "ai-datacenter", concept: "AI Data Centers & the AI Factory", emoji: "⚙️",
    description: "Frontier training does not run on a server, it runs on a building. Thousands of accelerators wired by high-bandwidth interconnects, fed by megawatts of power and liquid cooling, scheduled as one machine. The industry calls these AI factories because they convert electricity and data into tokens, and their power budgets are now a real constraint on how fast AI can scale.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 173,
    keyTerms: ["Interconnect (NVLink, InfiniBand)", "Cluster scheduling", "Power & cooling", "Compute capex", "AI factory"],
    prerequisites: ["GPU & TPU Computing", "Distributed Training"],
    learnMore: [
      { title: "IEA: Energy and AI (free report)", url: "https://www.iea.org/reports/energy-and-ai" },
      { title: "This site's Map of the AI Economy: the infrastructure layer", url: "/notebook/ai/map" },
    ],
    realWorldApps: "Why AI capex is measured in gigawatts, why cloud regions gate model launches, chokepoint analysis",
  },
  {
    id: "numerical-precision", concept: "Numerical Precision & Mixed-Precision Training", emoji: "⚙️",
    description: "How many bits each number gets, and why halving them roughly doubles your throughput. Training moved from FP32 to mixed precision with BF16, and frontier runs now use FP8 for parts of the math while keeping sensitive accumulations wider. Push too far and gradients underflow or the loss diverges, so precision is a tuning decision, not just a hardware feature.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 174,
    keyTerms: ["FP32 & BF16", "FP8", "Mixed precision", "Loss scaling", "Numerical stability"],
    prerequisites: ["Distributed Training"],
    learnMore: [
      { title: "Mixed Precision Training (the original paper)", url: "https://arxiv.org/abs/1710.03740" },
      { title: "PyTorch: automatic mixed precision", url: "https://pytorch.org/docs/stable/amp.html" },
    ],
    realWorldApps: "Every large training run's cost model; the difference between a run that fits your budget and one that does not",
  },
  {
    id: "llm", concept: "Large Language Models (LLMs)", emoji: "🗣️",
    description: "Transformers trained on internet-scale text to predict the next token, then tuned to follow instructions. That single objective, done at enough scale, produces translation, code, reasoning and conversation as side effects nobody explicitly programmed. Everything downstream on this page, prompting, RAG, fine-tuning, agents, is a technique for getting more out of that one capability.",
    category: "NLP & Language", difficulty: "beginner", rank: 175,
    keyTerms: ["Next-token prediction", "Pretraining & post-training", "Parameters", "Emergent abilities", "Frontier models"],
    prerequisites: ["Transformer Architecture", "Tokenization"],
    learnMore: [
      { title: "This site's teardown: How LLMs Work, 21 stages in 3D", url: "/guides/how-llms-work" },
      { title: "Andrej Karpathy: Intro to Large Language Models", url: "https://www.youtube.com/watch?v=zjkBMFhNj_g" },
    ],
    realWorldApps: "ChatGPT and Claude, coding assistants, search summaries, translation, and most of the AI economy",
  },

  /* ---- Added 2026-08-19: gaps found benchmarking against IBM Think.
     Every URL below was machine-verified alive; every video's channel was
     confirmed against YouTube oEmbed, not taken on the researcher's word. */
  {
    id: "ai-safety", concept: "AI Safety", emoji: "🛡️",
    description: "AI safety is the umbrella field concerned with preventing AI systems from causing harm, covering accidents, misuse, robustness failures, evaluation, security, and governance. Alignment, getting a system to pursue the objectives its developers intended, is one subfield inside it, not a synonym. AI ethics overlaps but asks normative questions about fairness and consent rather than engineering ones. Practitioners often treat near-term harms and long-term catastrophic risk as rival agendas; most working labs, standards bodies like NIST, and national institutes fund both, and which deserves priority is contested.",
    category: "Safety, Ethics & Governance", difficulty: "beginner", rank: 176,
    keyTerms: ["alignment", "misuse", "robustness", "near-term vs long-term risk", "governance"],
    prerequisites: ["Artificial Intelligence (AI)", "Machine Learning (ML)"],
    learnMore: [
      { title: "Concrete Problems in AI Safety (Amodei et al., 2016)", url: "https://arxiv.org/abs/1606.06565" },
      { title: "NIST AI Risk Management Framework (AI RMF 1.0)", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
      { title: "International AI Safety Report (Bengio et al., 2025)", url: "https://arxiv.org/abs/2501.17805" },
    ],
    realWorldApps: "Frontier-model release safety cases, NIST AI RMF in enterprise risk programs, national AI Security Institute evaluations, jailbreak and misuse defenses in deployed chatbots",
  },
  {
    id: "narrow-vs-strong-ai", concept: "Narrow AI vs Strong AI", emoji: "⚖️",
    description: "Narrow or weak AI covers every system shipping today: models trained for a bounded task set, from spam filters to frontier chatbots. Strong AI is the contrast, and the term carries two meanings. Searle coined it in 1980 for the claim that a running program literally understands, a claim about mind, not capability. Vendors now use it as a synonym for artificial general intelligence, a claim about breadth of competence. On Searle's framing, a system could match humans on every task and still understand nothing.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 177,
    keyTerms: ["weak AI", "narrow AI", "strong AI (Searle's sense)", "artificial general intelligence", "Chinese Room argument"],
    prerequisites: ["Artificial Intelligence (AI)"],
    learnMore: [
      { title: "Searle, Minds, Brains, and Programs (1980), full text", url: "https://www.cs.tufts.edu/comp/50cog/readings/searle.html" },
      { title: "The Chinese Room Argument (Stanford Encyclopedia of Philosophy)", url: "https://plato.stanford.edu/entries/chinese-room/" },
      { title: "Minds, brains, and programs, Behavioral and Brain Sciences 3(3), Cambridge Core", url: "https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/abs/minds-brains-and-programs/DC644B47A4299C637C89772FACC2706A" },
    ],
    realWorldApps: "Vendor claim review and procurement due diligence, AI policy and regulatory scoping, capability evaluation design, AGI timeline debates, philosophy of mind coursework",
  },
  {
    id: "superintelligence", concept: "Superintelligence (ASI)", emoji: "🌌",
    description: "Superintelligence is Bostrom's term for an intellect that outperforms the best human minds in essentially every domain, including scientific creativity and social skill. He distinguishes three forms: speed (human-level thinking run much faster), collective (many minds coordinated into one system), and quality (better reasoning in kind). Practitioners often treat ASI as AGI plus more compute, arriving on a datable schedule. It is a philosophical construct, not a benchmark: the definition, whether recursive self-improvement follows AGI, and every proposed timeline remain contested.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 178,
    keyTerms: ["Bostrom definition", "speed superintelligence", "collective superintelligence", "quality superintelligence", "intelligence explosion"],
    prerequisites: ["AGI (Artificial General Intelligence)", "AI Alignment"],
    learnMore: [
      { title: "Nick Bostrom, How Long Before Superintelligence? (source of the standard definition)", url: "https://nickbostrom.com/superintelligence" },
      { title: "David Chalmers, The Singularity: A Philosophical Analysis (Journal of Consciousness Studies, 2010)", url: "https://consc.net/papers/singularity.pdf" },
      { title: "Ethics of Artificial Intelligence and Robotics, Stanford Encyclopedia of Philosophy (see the Singularity and Superintelligence section)", url: "https://plato.stanford.edu/entries/ethics-ai/" },
    ],
    realWorldApps: "No deployed systems: the term shapes frontier-lab safety programs such as superalignment and weak-to-strong supervision, frontier-model governance debate, and existential-risk research funding.",
  },
  {
    id: "technological-singularity", concept: "Technological Singularity", emoji: "🌀",
    description: "The technological singularity is a hypothesis, not a forecast: a machine able to improve its own design triggers a feedback loop, each generation building a smarter successor until progress outruns human comprehension. Von Neumann used the word in the 1950s, I.J. Good called it an intelligence explosion in 1965, Vernor Vinge named it in 1993, Ray Kurzweil dated it to 2045. The common error is treating it as a schedule. Whether self-improvement compounds or hits diminishing returns from data, compute and physical experiment is contested.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 179,
    keyTerms: ["intelligence explosion", "recursive self-improvement", "superintelligence", "hard takeoff vs soft takeoff", "diminishing returns to intelligence"],
    prerequisites: ["AGI (Artificial General Intelligence)", "AI Alignment", "LLM Scaling Laws"],
    learnMore: [
      { title: "Vernor Vinge, The Coming Technological Singularity (1993)", url: "https://edoras.sdsu.edu/~vinge/misc/singularity.html" },
      { title: "David Chalmers, The Singularity: A Philosophical Analysis (Journal of Consciousness Studies, 2010)", url: "https://consc.net/papers/singularity.pdf" },
      { title: "Toby Walsh, The Singularity May Never Be Near (AAAI-16)", url: "https://arxiv.org/abs/1602.06462" },
    ],
    realWorldApps: "No deployed use; it shapes AI safety research agendas, frontier-lab charters and preparedness policies, compute-governance debates, and long-horizon risk forecasting",
  },
  {
    id: "agent-to-agent-protocols", concept: "Agent-to-Agent Protocols (A2A)", emoji: "🤝",
    description: "A2A is an open protocol, now a Linux Foundation project, that lets one agent delegate work to another as a peer. MCP wires an agent to tools; A2A wires agents to each other, and treats the remote agent as opaque. A server publishes an Agent Card at /.well-known/agent-card.json listing skills, endpoints, transports and security schemes. The common mistake is reading that card as a trust signal. Signing is optional, credentials are arranged out of band, and nothing attests the remote agent is competent or honest.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 181,
    keyTerms: ["Agent Card", "well-known URI discovery", "opaque execution", "task lifecycle states", "JWS card signing"],
    prerequisites: ["AI Agents", "Model Context Protocol (MCP)", "Multi-Agent Systems & Orchestration"],
    learnMore: [
      { title: "Agent2Agent (A2A) Protocol Specification v1.0", url: "https://a2a-protocol.org/latest/specification/" },
      { title: "A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, and ANP (arXiv 2505.02279)", url: "https://arxiv.org/abs/2505.02279" },
      { title: "OWASP GenAI Security Project: Agentic AI Threats and Mitigations", url: "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/" },
    ],
    realWorldApps: "Cross-vendor enterprise agent handoffs, Gemini Enterprise A2A agent registration, Google ADK remote agents, a support agent delegating to a billing agent, a repair agent ordering parts from a supplier agent",
  },
  {
    id: "ml-frameworks", concept: "ML Frameworks (PyTorch, TensorFlow, JAX)", emoji: "🧰",
    description: "A framework supplies three things a hand-written model would need: automatic differentiation, meaning gradients computed from a recorded graph of operations rather than derived by hand; tensor ops dispatched to vendor GPU kernels; and primitives for splitting a model across devices. PyTorch carries most research code, JAX is the transformation-based option behind much of Google DeepMind's work, TensorFlow persists in older production and mobile stacks. The common error is treating the choice as a performance decision. Speed comes from kernels, compilers and memory layout, and portability off NVIDIA hardware is where frameworks actually differ.",
    category: "MLOps & Infrastructure", difficulty: "beginner", rank: 182,
    keyTerms: ["automatic differentiation", "computation graph", "GPU kernels", "XLA compilation", "eager vs graph execution"],
    prerequisites: ["Backpropagation", "GPU & TPU Computing"],
    learnMore: [
      { title: "PyTorch: An Imperative Style, High-Performance Deep Learning Library (NeurIPS 2019)", url: "https://arxiv.org/abs/1912.01703" },
      { title: "TensorFlow: A System for Large-Scale Machine Learning (OSDI 2016)", url: "https://arxiv.org/abs/1605.08695" },
      { title: "Automatic differentiation (official JAX documentation)", url: "https://docs.jax.dev/en/latest/automatic-differentiation.html" },
    ],
    realWorldApps: "Training and serving nearly every production model: LLM pretraining runs, vision models in autonomous driving stacks, recommendation systems, on-device speech and camera features via mobile runtimes",
  },
  {
    id: "inference-cost", concept: "Inference Cost & Token Economics", emoji: "💸",
    description: "Inference cost is the recurring price of serving a model, billed per token and split between input and output. The two are not symmetric: input arrives in one parallel prefill pass, while output is generated one token at a time, each step re-reading model weights from memory. Practitioners tune prompt length and ignore output length, which is priced higher and often dominates the bill. Context length also charges twice, through prefill work and through KV cache memory that caps batch size and throughput. Caching, smaller models, and routing are the main levers.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 183,
    keyTerms: ["prefill vs decode", "KV cache", "prompt caching", "continuous batching", "cost per token"],
    prerequisites: ["Tokenization", "Context Window & Long Context", "Inference Optimization"],
    learnMore: [
      { title: "Efficiently Scaling Transformer Inference (Pope et al., 2022)", url: "https://arxiv.org/abs/2211.05102" },
      { title: "Efficient Memory Management for LLM Serving with PagedAttention (SOSP 2023)", url: "https://arxiv.org/abs/2309.06180" },
      { title: "Splitwise: Efficient Generative LLM Inference Using Phase Splitting", url: "https://arxiv.org/abs/2311.18677" },
    ],
    realWorldApps: "Chatbot unit economics, RAG pipelines with long retrieved context, agent loops that resend history every turn, bulk document extraction, routing cheap requests to smaller models",
  },
  {
    id: "ai-platforms", concept: "AI Platforms", emoji: "🧰",
    description: "An AI platform bundles services sold as one product: hosted model access, data storage with access controls, evaluation and experiment tracking, deployment and serving, and observability for cost, latency and output quality. No standard definition exists, so two vendor comparisons often measure different things. Buyers weigh model quality and price, then find the real cost in what is hard to move: pipeline formats, evaluation sets, feature definitions, audit logs. Check export paths and whether the serving API is standard first.",
    category: "MLOps & Infrastructure", difficulty: "beginner", rank: 184,
    keyTerms: ["model gateway", "data governance", "evaluation harness", "observability", "vendor lock-in"],
    prerequisites: ["MLOps (ML Operations)", "Model Deployment & Serving", "The AI Stack"],
    learnMore: [
      { title: "Machine Learning Operations (MLOps): Overview, Definition, and Architecture (Kreuzberger, Kühl, Hirschl, 2022)", url: "https://arxiv.org/abs/2205.02302" },
      { title: "NIST AI 100-1: Artificial Intelligence Risk Management Framework (AI RMF 1.0)", url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf" },
      { title: "Hidden Technical Debt in Machine Learning Systems (Sculley et al., NIPS 2015)", url: "https://proceedings.neurips.cc/paper_files/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf" },
    ],
    realWorldApps: "Internal model gateways with per-team spend caps, regulated-industry deployments needing audit logs and data residency, retail demand forecasting on managed pipelines, support-agent rollouts gated by offline evaluation suites",
  },
  {
    id: "enterprise-ai", concept: "Enterprise AI", emoji: "🏢",
    description: "Enterprise AI is the practice of running AI inside an organization's existing systems, data, and approval chains rather than in a demo. The hard parts are organizational: who owns the data and its access rules, which team absorbs the changed workflow, and how a model reaches a production system of record. Practitioners often treat a working prototype as most of the job. RAND, interviewing 65 practitioners, traces failures first to a misunderstood or miscommunicated problem, not a weak model. Widely quoted pilot-failure rates near 95 percent come from small, contested surveys.",
    category: "AI Agents & Applications", difficulty: "beginner", rank: 185,
    keyTerms: ["data governance", "pilot-to-production gap", "change management", "system integration", "AI risk framework"],
    prerequisites: ["Artificial Intelligence (AI)", "Data · The Fuel of AI", "MLOps (ML Operations)"],
    learnMore: [
      { title: "The Root Causes of Failure for Artificial Intelligence Projects and How They Can Succeed (RAND, RR-A2680-1)", url: "https://www.rand.org/pubs/research_reports/RRA2680-1.html" },
      { title: "NIST AI 100-1: Artificial Intelligence Risk Management Framework (AI RMF 1.0)", url: "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf" },
      { title: "Hidden Technical Debt in Machine Learning Systems (Sculley et al., NeurIPS 2015)", url: "https://papers.neurips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html" },
    ],
    realWorldApps: "Claims triage at insurers, contact-center summarization and routing, document extraction in banking KYC, supply-chain demand forecasting, internal RAG search over policy and engineering docs",
  },
  {
    id: "responsible-ai", concept: "Responsible AI", emoji: "⚖️",
    description: "Responsible AI is the operational practice of building and running AI systems against stated commitments: fairness, transparency, accountability, privacy, and human oversight. It works through process, documentation such as model cards, impact assessments, sign-off gates, monitoring, not through any single technique. NIST's AI Risk Management Framework organizes it as four functions: Govern, Map, Measure, Manage. Practitioners conflate it with AI safety, which targets harm from model capability, and with regulation, which is law. Responsible AI is voluntary, so it holds only where governance can actually stop a launch.",
    category: "Safety, Ethics & Governance", difficulty: "beginner", rank: 186,
    keyTerms: ["NIST AI RMF", "human oversight", "model cards", "impact assessment", "AI governance"],
    prerequisites: ["AI Bias & Fairness", "AI Alignment", "AI Regulation & Governance"],
    learnMore: [
      { title: "NIST AI 100-1: Artificial Intelligence Risk Management Framework (AI RMF 1.0)", url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf" },
      { title: "AI RMF 1.0, web version (NIST AI Resource Center)", url: "https://airc.nist.gov/airmf-resources/airmf/" },
      { title: "Fairness and Machine Learning: Limitations and Opportunities (Barocas, Hardt, Narayanan)", url: "https://fairmlbook.org/" },
    ],
    realWorldApps: "Model and system cards published with model releases, credit-scoring fairness reviews at banks, hospital AI procurement checklists, EU AI Act conformity preparation, internal launch-approval boards",
  },
  {
    id: "vibe-coding", concept: "Vibe Coding", emoji: "🎲",
    description: "Vibe coding is Andrej Karpathy's February 2025 term for generating software by prompting a model and accepting the output without reading it: you judge the result by whether it runs, not by whether the code is sound. It suits throwaway prototypes and personal tools. The common error is treating all AI-assisted work as vibe coding. Agentic coding describes how much the tool automates; vibe coding describes whether a human reviews the diff. Skipping review is where the security holes and unmaintainable code come from.",
    category: "AI Agents & Applications", difficulty: "beginner", rank: 187,
    keyTerms: ["accepting unreviewed code", "Karpathy coinage (Feb 2025)", "prototype versus production", "agentic coding contrast", "AI-generated code security debt"],
    prerequisites: ["Large Language Models (LLMs)", "AI Code Generation"],
    learnMore: [
      { title: "Vibe coding: programming through conversation with artificial intelligence (Sarkar & Drosos, PPIG 2025)", url: "https://arxiv.org/abs/2506.23253" },
      { title: "Vibe Coding vs. Agentic Coding: Fundamentals and Practical Implications of Agentic AI", url: "https://arxiv.org/abs/2505.19443" },
      { title: "Not all AI-assisted programming is vibe coding (but vibe coding rocks)", url: "https://simonwillison.net/2025/Mar/19/vibe-coding/" },
    ],
    realWorldApps: "Weekend prototypes and demos, internal one-off scripts, throwaway data cleanup tools, hackathon builds, prompt-to-app products such as Replit Agent and Lovable",
  },
];
