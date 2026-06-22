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
    description: "Learning from labeled examples — the model sees inputs paired with correct outputs and learns to predict outputs for new inputs. Includes classification and regression.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 2,
    keyTerms: ["Labels", "Classification", "Regression", "Training set", "Test set"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "StatQuest: Supervised Learning", url: "https://www.youtube.com/watch?v=nKW8Ndu7Mjw" },
    ],
    realWorldApps: "Email spam detection, image classification, price prediction, medical diagnosis",
  },
  {
    id: "unsupervised-learning", concept: "Unsupervised Learning", emoji: "🧠",
    description: "Learning patterns from unlabeled data — the model discovers hidden structure without being told the 'right answer'. Includes clustering, dimensionality reduction, and anomaly detection.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 3,
    keyTerms: ["Clustering", "Dimensionality reduction", "Anomaly detection", "K-Means"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "StatQuest: K-Means Clustering", url: "https://www.youtube.com/watch?v=4b5d3muPQmA" },
    ],
    realWorldApps: "Customer segmentation, anomaly detection, topic modeling, data compression",
  },
  {
    id: "neural-network", concept: "Neural Network", emoji: "🧠",
    description: "A computing system inspired by biological brains, composed of layers of interconnected nodes (neurons). Each connection has a weight that's adjusted during training. The foundation of deep learning.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 4,
    keyTerms: ["Neurons", "Layers", "Weights", "Bias", "Activation function"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "3Blue1Brown: Neural Networks", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi" },
      { title: "Neural Networks & Deep Learning — free book", url: "http://neuralnetworksanddeeplearning.com/" },
    ],
    realWorldApps: "Image recognition, speech synthesis, game playing, autonomous vehicles",
  },
  {
    id: "deep-learning", concept: "Deep Learning", emoji: "🧠",
    description: "A subset of ML using neural networks with many layers (hence 'deep'). Excels at learning hierarchical representations from raw data — each layer learns increasingly abstract features.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 5,
    keyTerms: ["Hidden layers", "Feature hierarchy", "Representation learning", "End-to-end learning"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "fast.ai — Practical Deep Learning", url: "https://course.fast.ai/" },
      { title: "Dive into Deep Learning", url: "https://d2l.ai" },
    ],
    realWorldApps: "Self-driving cars, language translation, drug discovery, artistic generation",
  },
  {
    id: "features-labels", concept: "Features & Labels", emoji: "🧠",
    description: "Features are the input variables (columns) used to make predictions. Labels are the output variable (what you're trying to predict). Feature engineering — crafting good inputs — is often more important than the model choice.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 6,
    keyTerms: ["Feature vector", "Target variable", "Feature engineering", "Feature selection"],
    prerequisites: [],
    learnMore: [
      { title: "Google: Feature Engineering", url: "https://developers.google.com/machine-learning/data-prep/transform/transform-numeric" },
    ],
    realWorldApps: "Any ML system — choosing the right features determines model quality",
  },
  {
    id: "overfitting-underfitting", concept: "Overfitting & Underfitting", emoji: "🧠",
    description: "Overfitting: the model memorizes training data but fails on new data (too complex). Underfitting: the model is too simple to capture patterns. The goal is the sweet spot — generalizing well to unseen data.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 7,
    keyTerms: ["Generalization", "Training error", "Validation error", "Model complexity"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "StatQuest: Overfitting & Underfitting", url: "https://www.youtube.com/watch?v=EuBBz3bI-aA" },
    ],
  },
  {
    id: "bias-variance", concept: "Bias-Variance Tradeoff", emoji: "🧠",
    description: "Bias: error from overly simplistic assumptions (underfitting). Variance: error from sensitivity to training data fluctuations (overfitting). The tradeoff is fundamental — reducing one often increases the other.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 8,
    keyTerms: ["Bias", "Variance", "Tradeoff", "Model complexity", "Generalization"],
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
    description: "Using a model trained on one task as the starting point for a different task. Instead of training from scratch, you fine-tune a pretrained model — dramatically reducing data and compute requirements.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 10,
    keyTerms: ["Pre-training", "Fine-tuning", "Domain adaptation", "Feature extraction"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Transfer Learning — CS231n", url: "https://cs231n.github.io/transfer-learning/" },
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
      { title: "NVIDIA: Training vs Inference", url: "https://blogs.nvidia.com/blog/whats-the-difference-between-deep-learning-training-and-inference-ai-explained/" },
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
    description: "Few-shot: learning from just a handful of examples. Zero-shot: performing tasks with no examples, using only a description. LLMs excel at both — GPT-3 showed that scale enables few-shot learning.",
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
    description: "The simplest ML model — fits a straight line (or hyperplane) through data points to predict a continuous value. Despite its simplicity, it's the starting point for understanding all regression models.",
    category: "Core ML Concepts", difficulty: "beginner", rank: 14,
    keyTerms: ["Slope", "Intercept", "Least squares", "R-squared", "Coefficients"],
    prerequisites: [],
    learnMore: [
      { title: "StatQuest: Linear Regression", url: "https://www.youtube.com/watch?v=PaFPbb66DxQ" },
    ],
  },
  {
    id: "semi-supervised", concept: "Semi-Supervised Learning", emoji: "🧠",
    description: "A hybrid approach using a small amount of labeled data with a large amount of unlabeled data. Leverages the structure in unlabeled data to improve learning — practical when labeling is expensive.",
    category: "Core ML Concepts", difficulty: "intermediate", rank: 15,
    keyTerms: ["Pseudo-labels", "Self-training", "Consistency regularization"],
    prerequisites: ["Supervised Learning", "Unsupervised Learning"],
    learnMore: [
      { title: "Semi-Supervised Learning — Google", url: "https://ai.google/research/pubs/pub41473" },
    ],
  },

  // === Math & Optimization (16–25) ===
  {
    id: "gradient-descent", concept: "Gradient Descent", emoji: "📐",
    description: "The fundamental optimization algorithm for training neural networks. It iteratively adjusts model parameters in the direction that reduces the loss function — like walking downhill to find the valley.",
    category: "Math & Optimization", difficulty: "beginner", rank: 16,
    keyTerms: ["Learning rate", "Stochastic gradient descent (SGD)", "Minibatch", "Convergence"],
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
    description: "A function that measures how wrong the model's predictions are. Training = minimizing the loss. Common losses: MSE (regression), cross-entropy (classification), contrastive (embeddings).",
    category: "Math & Optimization", difficulty: "beginner", rank: 18,
    keyTerms: ["MSE", "Cross-entropy", "Contrastive loss", "Objective function"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "StatQuest: Cross Entropy", url: "https://www.youtube.com/watch?v=6ArSys5qHAU" },
    ],
  },
  {
    id: "activation-functions", concept: "Activation Functions", emoji: "📐",
    description: "Non-linear functions applied to neuron outputs — they give neural networks the ability to learn complex patterns. ReLU, Sigmoid, Tanh, GELU, and Swish are the most common.",
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
    description: "Reducing the number of features while preserving important information. PCA, t-SNE, and UMAP are the main techniques — essential for visualization and fighting the curse of dimensionality.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 21,
    keyTerms: ["PCA", "t-SNE", "UMAP", "Curse of dimensionality", "Feature compression"],
    prerequisites: ["Unsupervised Learning"],
    learnMore: [
      { title: "StatQuest: PCA", url: "https://www.youtube.com/watch?v=FgakZw6K1QQ" },
    ],
  },
  {
    id: "feature-engineering", concept: "Feature Engineering", emoji: "📐",
    description: "The art of creating, transforming, and selecting input features to improve model performance. Often more impactful than model choice — 'garbage in, garbage out' applies doubly to ML.",
    category: "Math & Optimization", difficulty: "intermediate", rank: 22,
    keyTerms: ["Feature scaling", "One-hot encoding", "Feature crosses", "Polynomial features"],
    prerequisites: ["Features & Labels"],
    learnMore: [
      { title: "Kaggle: Feature Engineering", url: "https://www.kaggle.com/learn/feature-engineering" },
    ],
  },
  {
    id: "k-means", concept: "K-Means Clustering", emoji: "📐",
    description: "The simplest clustering algorithm — assigns data points to K groups by iteratively moving cluster centers to minimize within-cluster distances. Fast, intuitive, but requires choosing K upfront.",
    category: "Math & Optimization", difficulty: "beginner", rank: 23,
    keyTerms: ["Centroids", "Elbow method", "Inertia", "K selection"],
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
      { title: "The Illustrated Transformer — Jay Alammar", url: "https://jalammar.github.io/illustrated-transformer/" },
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
    description: "A special case of attention where a sequence attends to itself — each token computes relationships with every other token. This is the core mechanism powering Transformers.",
    category: "Architectures", difficulty: "intermediate", rank: 28,
    keyTerms: ["QKV matrices", "Attention score", "Multi-head", "Causal masking"],
    prerequisites: ["Attention Mechanism"],
    learnMore: [
      { title: "Karpathy: Let's build GPT", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY" },
    ],
  },
  {
    id: "cnn", concept: "Convolutional Neural Network (CNN)", emoji: "🏗️",
    description: "Architecture designed for grid-like data (images). Uses learned filters (kernels) to detect features at different scales — edges → textures → objects. Revolutionized computer vision.",
    category: "Architectures", difficulty: "intermediate", rank: 29,
    keyTerms: ["Convolution", "Kernel", "Pooling", "Feature map", "Stride"],
    prerequisites: ["Neural Network"],
    learnMore: [
      { title: "CNN Explainer — Interactive Visualization", url: "https://poloclub.github.io/cnn-explainer/" },
      { title: "Stanford CS231n", url: "https://cs231n.github.io/" },
    ],
  },
  {
    id: "rnn", concept: "Recurrent Neural Network (RNN)", emoji: "🏗️",
    description: "Architecture for sequential data that maintains a hidden state across time steps. Suffers from vanishing gradients for long sequences — largely replaced by Transformers but still relevant for understanding.",
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
    prerequisites: ["RNN"],
    learnMore: [
      { title: "Colah: Understanding LSTMs (MUST READ)", url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/" },
    ],
  },
  {
    id: "gpt", concept: "GPT (Generative Pre-trained Transformer)", emoji: "🏗️",
    description: "A decoder-only Transformer trained to predict the next token. GPT-1 → GPT-2 → GPT-3 → GPT-4 showed that scaling this simple idea produces increasingly capable AI. The architecture behind ChatGPT.",
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
    description: "An encoder-only Transformer that reads text bidirectionally (both left-to-right and right-to-left). Trained with masked language modeling. Dominates classification, NER, and search/ranking tasks.",
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
    description: "An alternative to Transformers that processes sequences with linear-time complexity instead of quadratic attention. Mamba and S4 are leading SSM architectures, offering advantages for very long sequences.",
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
    prerequisites: ["Transformer Architecture", "CNN"],
    learnMore: [
      { title: "ViT Paper — An Image is Worth 16x16 Words", url: "https://arxiv.org/abs/2010.11929" },
    ],
  },
  {
    id: "multimodal-models", concept: "Multimodal Models", emoji: "🏗️",
    description: "AI models that process multiple types of data — text, images, audio, video — simultaneously. GPT-4V, Gemini, and Claude 3 are multimodal. The future of AI is not text-only.",
    category: "Architectures", difficulty: "advanced", rank: 36,
    keyTerms: ["Cross-modal attention", "Vision-language", "Contrastive learning", "CLIP"],
    prerequisites: ["Transformer Architecture"],
    learnMore: [
      { title: "CLIP Paper — OpenAI", url: "https://arxiv.org/abs/2103.00020" },
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
      { title: "Distilling the Knowledge in a Neural Network — Hinton", url: "https://arxiv.org/abs/1503.02531" },
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
    description: "Using AI to design AI architectures. Instead of hand-designing networks, NAS automatically searches for optimal architectures — the meta approach to building neural networks.",
    category: "Architectures", difficulty: "advanced", rank: 39,
    keyTerms: ["Search space", "Controller", "Reinforcement learning NAS", "EfficientNet"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Neural Architecture Search — Google AI Blog", url: "https://ai.googleblog.com/2017/05/using-machine-learning-to-explore.html" },
    ],
  },
  {
    id: "neuro-symbolic", concept: "Neuro-Symbolic AI", emoji: "🏗️",
    description: "Combining neural networks (learning from data) with symbolic AI (logical reasoning). Aims to get the best of both worlds — learning ability plus interpretable, compositional reasoning.",
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
    description: "The branch of AI focused on enabling computers to understand, interpret, and generate human language. Encompasses tasks from sentiment analysis to machine translation to question answering.",
    category: "NLP & Language", difficulty: "beginner", rank: 41,
    keyTerms: ["Tokenization", "Parsing", "NER", "Sentiment analysis", "Machine translation"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "Hugging Face NLP Course (Free)", url: "https://huggingface.co/learn/nlp-course" },
      { title: "Stanford CS224n", url: "https://web.stanford.edu/class/cs224n/" },
    ],
  },
  {
    id: "tokenization", concept: "Tokenization", emoji: "🗣️",
    description: "Breaking text into smaller units (tokens) for processing. Modern tokenizers use subword methods (BPE, SentencePiece) — 'unhappiness' → ['un', 'happiness']. Token count determines cost and context window usage.",
    category: "NLP & Language", difficulty: "beginner", rank: 42,
    keyTerms: ["BPE", "SentencePiece", "WordPiece", "Token", "Vocabulary"],
    prerequisites: ["NLP"],
    learnMore: [
      { title: "Hugging Face: Tokenizers", url: "https://huggingface.co/learn/nlp-course/chapter6/1" },
    ],
  },
  {
    id: "word2vec", concept: "Word2Vec & Word Embeddings", emoji: "🗣️",
    description: "Representing words as dense vectors where semantic relationships are captured geometrically. The famous result: king - man + woman ≈ queen. Predecessor to modern embeddings used in LLMs.",
    category: "NLP & Language", difficulty: "intermediate", rank: 43,
    keyTerms: ["Skip-gram", "CBOW", "GloVe", "Cosine similarity", "Embedding space"],
    prerequisites: ["Embeddings"],
    learnMore: [
      { title: "Jay Alammar: Illustrated Word2Vec", url: "https://jalammar.github.io/illustrated-word2vec/" },
    ],
  },
  {
    id: "prompt-engineering", concept: "Prompt Engineering", emoji: "🗣️",
    description: "The art and science of crafting inputs to LLMs to get optimal outputs. Techniques include zero-shot, few-shot, chain-of-thought, ReAct, and system prompts. The most practical AI skill of 2025–2026.",
    category: "NLP & Language", difficulty: "beginner", rank: 44,
    keyTerms: ["Zero-shot", "Few-shot", "Chain-of-thought", "System prompt", "Temperature"],
    prerequisites: [],
    learnMore: [
      { title: "Anthropic Prompt Engineering Guide", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview" },
      { title: "OpenAI Prompt Engineering Guide", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
    ],
    realWorldApps: "Every interaction with ChatGPT, Claude, Gemini — it's the universal AI interface",
  },
  {
    id: "rag", concept: "Retrieval-Augmented Generation (RAG)", emoji: "🗣️",
    description: "Combining LLMs with external knowledge retrieval. Instead of relying solely on training data, RAG retrieves relevant documents and passes them to the LLM — reducing hallucinations and adding current information.",
    category: "NLP & Language", difficulty: "intermediate", rank: 45,
    keyTerms: ["Retriever", "Generator", "Vector search", "Chunking", "Context window"],
    prerequisites: ["Embeddings", "Transformer Architecture"],
    learnMore: [
      { title: "RAG Paper — Meta", url: "https://arxiv.org/abs/2005.11401" },
      { title: "LangChain RAG Tutorial", url: "https://python.langchain.com/docs/tutorials/rag/" },
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
      { title: "Chain-of-Thought Paper — Google (2022)", url: "https://arxiv.org/abs/2201.11903" },
    ],
  },
  {
    id: "vector-databases", concept: "Vector Databases", emoji: "🗣️",
    description: "Specialized databases optimized for storing and searching high-dimensional vectors (embeddings). Enable fast similarity search — the backbone of RAG, recommendation systems, and semantic search.",
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
    prerequisites: ["GPT"],
    learnMore: [
      { title: "Chinchilla Paper — DeepMind", url: "https://arxiv.org/abs/2203.15556" },
    ],
  },
  {
    id: "rlhf", concept: "RLHF (Reinforcement Learning from Human Feedback)", emoji: "🗣️",
    description: "The technique that made ChatGPT helpful and safe. Trains a reward model on human preferences, then optimizes the LLM against it. The key ingredient between a base model and a useful assistant.",
    category: "NLP & Language", difficulty: "advanced", rank: 50,
    keyTerms: ["Reward model", "PPO", "Preference data", "Constitutional AI", "DPO"],
    prerequisites: ["Fine-Tuning LLMs", "Reinforcement Learning"],
    learnMore: [
      { title: "InstructGPT Paper — OpenAI", url: "https://arxiv.org/abs/2203.02155" },
      { title: "Hugging Face TRL", url: "https://huggingface.co/docs/trl" },
    ],
  },
  {
    id: "context-window", concept: "Context Window & Long Context", emoji: "🗣️",
    description: "The maximum number of tokens an LLM can process at once. GPT-4 Turbo: 128K tokens. Claude 3: 200K tokens. Gemini 1.5: 1M+ tokens. Longer context enables processing entire codebases and books.",
    category: "NLP & Language", difficulty: "intermediate", rank: 51,
    keyTerms: ["Token limit", "Context length", "Needle-in-a-haystack", "KV cache"],
    prerequisites: ["Tokenization", "Transformer Architecture"],
    learnMore: [
      { title: "Anthropic: Long Context", url: "https://www.anthropic.com/research/many-shot-jailbreaking" },
    ],
  },
  {
    id: "text-generation", concept: "Text Generation & Sampling", emoji: "🗣️",
    description: "How LLMs produce text — sampling from probability distributions over tokens. Temperature controls randomness. Top-k and top-p (nucleus) sampling balance creativity and coherence.",
    category: "NLP & Language", difficulty: "intermediate", rank: 52,
    keyTerms: ["Temperature", "Top-k", "Top-p (nucleus)", "Beam search", "Greedy decoding"],
    prerequisites: ["GPT"],
    learnMore: [
      { title: "Hugging Face: Text Generation", url: "https://huggingface.co/blog/how-to-generate" },
    ],
  },
  {
    id: "sentiment-analysis", concept: "Sentiment Analysis", emoji: "🗣️",
    description: "Determining the emotional tone of text — positive, negative, or neutral. One of the most common NLP applications. Modern approaches use fine-tuned BERT or zero-shot LLMs.",
    category: "NLP & Language", difficulty: "beginner", rank: 53,
    keyTerms: ["Polarity", "Aspect-based", "Opinion mining", "Valence"],
    prerequisites: ["NLP"],
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
    description: "Identifying and classifying named entities in text — persons, organizations, locations, dates, etc. A fundamental NLP task used in information extraction, search, and knowledge graphs.",
    category: "NLP & Language", difficulty: "intermediate", rank: 55,
    keyTerms: ["Entity types", "BIO tagging", "SpaCy", "Token classification"],
    prerequisites: ["NLP"],
    learnMore: [
      { title: "spaCy NER Tutorial", url: "https://spacy.io/usage/linguistic-features#named-entities" },
    ],
    realWorldApps: "Document processing, search engines, news analysis, compliance",
  },

  // === Computer Vision (56–65) ===
  {
    id: "image-classification", concept: "Image Classification", emoji: "👁️",
    description: "Assigning a label to an entire image. The task that started the deep learning revolution — AlexNet won ImageNet 2012 by a huge margin, proving deep learning works.",
    category: "Computer Vision", difficulty: "beginner", rank: 56,
    keyTerms: ["ImageNet", "Top-5 accuracy", "Softmax", "ResNet", "EfficientNet"],
    prerequisites: ["CNN"],
    learnMore: [
      { title: "Kaggle: Computer Vision", url: "https://www.kaggle.com/learn/computer-vision" },
    ],
  },
  {
    id: "object-detection", concept: "Object Detection", emoji: "👁️",
    description: "Locating and classifying multiple objects within an image with bounding boxes. YOLO (You Only Look Once) made real-time detection practical. Used in autonomous driving, security, and robotics.",
    category: "Computer Vision", difficulty: "intermediate", rank: 57,
    keyTerms: ["Bounding box", "IoU", "YOLO", "Anchor boxes", "Non-max suppression"],
    prerequisites: ["CNN"],
    learnMore: [
      { title: "Ultralytics YOLO Docs", url: "https://docs.ultralytics.com/" },
    ],
    realWorldApps: "Self-driving cars, surveillance, retail analytics, medical imaging",
  },
  {
    id: "semantic-segmentation", concept: "Semantic Segmentation", emoji: "👁️",
    description: "Classifying every pixel in an image — assigning each pixel to a category. More granular than object detection. Used in autonomous driving, medical imaging, and satellite imagery.",
    category: "Computer Vision", difficulty: "intermediate", rank: 58,
    keyTerms: ["Pixel-wise classification", "U-Net", "Mask", "Instance segmentation"],
    prerequisites: ["CNN"],
    learnMore: [
      { title: "Papers With Code: Segmentation", url: "https://paperswithcode.com/task/semantic-segmentation" },
    ],
  },
  {
    id: "yolo", concept: "YOLO (You Only Look Once)", emoji: "👁️",
    description: "A real-time object detection system that processes the entire image in a single forward pass. YOLOv8 is the latest version — incredibly fast and accurate, making it the go-to for practical deployment.",
    category: "Computer Vision", difficulty: "intermediate", rank: 59,
    keyTerms: ["Real-time detection", "Grid cells", "Confidence score", "YOLOv8"],
    prerequisites: ["Object Detection"],
    learnMore: [
      { title: "Ultralytics YOLOv8", url: "https://github.com/ultralytics/ultralytics" },
    ],
  },
  {
    id: "image-generation", concept: "Image Generation", emoji: "👁️",
    description: "Creating new images from text descriptions or other inputs. Stable Diffusion, DALL-E, and Midjourney can generate photorealistic images from text prompts.",
    category: "Computer Vision", difficulty: "intermediate", rank: 60,
    keyTerms: ["Text-to-image", "Diffusion", "CLIP guidance", "Inpainting"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Stable Diffusion Guide", url: "https://stability.ai/stable-diffusion" },
    ],
  },
  {
    id: "neural-style-transfer", concept: "Neural Style Transfer", emoji: "👁️",
    description: "Applying the artistic style of one image to the content of another — e.g., making your photo look like a Van Gogh painting. Uses CNN feature representations to separate content from style.",
    category: "Computer Vision", difficulty: "intermediate", rank: 61,
    keyTerms: ["Content loss", "Style loss", "Gram matrix", "Feature extraction"],
    prerequisites: ["CNN"],
    learnMore: [
      { title: "A Neural Algorithm of Artistic Style", url: "https://arxiv.org/abs/1508.06576" },
    ],
  },
  {
    id: "deepfakes", concept: "Deepfakes & Face Synthesis", emoji: "👁️",
    description: "AI-generated fake videos and images that swap faces or create entirely synthetic people. Uses GANs and diffusion models. Raises serious ethical concerns about misinformation.",
    category: "Computer Vision", difficulty: "advanced", rank: 62,
    keyTerms: ["Face swap", "Face reenactment", "Detection methods", "DeepFaceLab"],
    prerequisites: ["GANs", "Image Generation"],
    learnMore: [
      { title: "MIT Media Lab: Detecting Deepfakes", url: "https://www.media.mit.edu/projects/detect-fakes/overview/" },
    ],
  },
  {
    id: "time-series", concept: "Time Series Forecasting", emoji: "👁️",
    description: "Predicting future values based on historical temporal data. Traditional methods (ARIMA) are being augmented by deep learning (LSTMs, Transformers). Critical for finance, weather, and demand planning.",
    category: "Computer Vision", difficulty: "intermediate", rank: 63,
    keyTerms: ["ARIMA", "Seasonality", "Trend", "Lag features", "Prophet"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "Facebook Prophet", url: "https://facebook.github.io/prophet/" },
    ],
    realWorldApps: "Stock prediction, weather forecasting, demand planning, energy grid",
  },
  {
    id: "data", concept: "Data — The Fuel of AI", emoji: "👁️",
    description: "AI is only as good as its data. Understanding data quality, bias, preprocessing, augmentation, and the data lifecycle is fundamental. 'More data beats better algorithms' — but only if the data is good.",
    category: "Computer Vision", difficulty: "beginner", rank: 64,
    keyTerms: ["Data quality", "Data augmentation", "Data pipeline", "Label noise", "Data drift"],
    prerequisites: [],
    learnMore: [
      { title: "Andrew Ng: Data-Centric AI", url: "https://datacentricai.org/" },
    ],
  },
  {
    id: "synthetic-data", concept: "Synthetic Data", emoji: "👁️",
    description: "Artificially generated data that mimics real-world data. Used when real data is scarce, expensive, or privacy-sensitive. GANs and diffusion models can create realistic synthetic training data.",
    category: "Computer Vision", difficulty: "intermediate", rank: 65,
    keyTerms: ["Data augmentation", "Privacy-preserving", "Distribution matching"],
    prerequisites: ["Data — The Fuel of AI"],
    learnMore: [
      { title: "NVIDIA: Synthetic Data", url: "https://developer.nvidia.com/blog/synthetic-data/" },
    ],
  },

  // === Generative AI (66–75) ===
  {
    id: "diffusion-models", concept: "Diffusion Models", emoji: "🎨",
    description: "The architecture behind Stable Diffusion and DALL-E 3. Works by learning to reverse a noise-adding process — start from pure noise, gradually denoise to create an image. Replaced GANs as the dominant generative approach.",
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
      { title: "Original GAN Paper — Goodfellow", url: "https://arxiv.org/abs/1406.2661" },
    ],
  },
  {
    id: "vaes", concept: "VAEs (Variational Autoencoders)", emoji: "🎨",
    description: "Generative models that learn a compressed latent space representation. Unlike GANs, VAEs can both generate AND encode data. The latent space is continuous, enabling smooth interpolation between outputs.",
    category: "Generative AI", difficulty: "advanced", rank: 68,
    keyTerms: ["Latent space", "KL divergence", "Encoder", "Decoder", "Reparameterization"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Understanding VAEs — Towards Data Science", url: "https://towardsdatascience.com/understanding-variational-autoencoders-vaes-f70510919f73" },
    ],
  },
  {
    id: "stable-diffusion", concept: "Stable Diffusion & Text-to-Image", emoji: "🎨",
    description: "The open-source text-to-image model that democratized AI art. Works in a compressed latent space (not pixel space) for efficiency. SDXL and SD3 produce photorealistic images from text prompts.",
    category: "Generative AI", difficulty: "intermediate", rank: 69,
    keyTerms: ["Latent diffusion", "CLIP text encoder", "U-Net", "ControlNet", "LoRA"],
    prerequisites: ["Diffusion Models"],
    learnMore: [
      { title: "Stable Diffusion WebUI", url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui" },
      { title: "ComfyUI", url: "https://github.com/comfyanonymous/ComfyUI" },
    ],
    realWorldApps: "AI art, product mockups, game asset generation, marketing visuals",
  },
  {
    id: "text-to-video", concept: "Text-to-Video Generation", emoji: "🎨",
    description: "Generating video from text descriptions. Sora (OpenAI), Runway Gen-3, and Kling represent the frontier. Extends diffusion models with temporal consistency — the next frontier of generative AI.",
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
      { title: "OpenAI Whisper", url: "https://github.com/openai/whisper" },
    ],
    realWorldApps: "Audiobooks, dubbing, accessibility, virtual assistants, podcasting",
  },
  {
    id: "music-generation", concept: "AI Music Generation", emoji: "🎨",
    description: "Creating original music using AI — from background scores to full songs with vocals. Suno and Udio generate music from text prompts. Raises questions about creativity and copyright.",
    category: "Generative AI", difficulty: "intermediate", rank: 72,
    keyTerms: ["Audio tokens", "Music transformer", "MIDI generation", "Audio diffusion"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Google MusicLM", url: "https://google-research.github.io/seanet/musiclm/examples/" },
    ],
  },
  {
    id: "code-generation", concept: "AI Code Generation", emoji: "🎨",
    description: "LLMs trained on code that can write, debug, and explain programs. GitHub Copilot, Claude, and GPT-4 can generate working code from natural language descriptions. Transforming software development.",
    category: "Generative AI", difficulty: "intermediate", rank: 73,
    keyTerms: ["Code completion", "Copilot", "CodeLlama", "Code review", "Agentic coding"],
    prerequisites: ["GPT"],
    learnMore: [
      { title: "GitHub Copilot", url: "https://github.com/features/copilot" },
    ],
    realWorldApps: "Software development, code review, documentation, debugging, prototyping",
  },
  {
    id: "3d-generation", concept: "3D Generation & NeRFs", emoji: "🎨",
    description: "Creating 3D objects and scenes from text or 2D images. Neural Radiance Fields (NeRFs) reconstruct 3D scenes from photos. Gaussian Splatting is the latest breakthrough for real-time 3D rendering.",
    category: "Generative AI", difficulty: "advanced", rank: 74,
    keyTerms: ["NeRF", "Gaussian splatting", "3D reconstruction", "Point clouds"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "NeRF Paper", url: "https://arxiv.org/abs/2003.08934" },
    ],
  },
  {
    id: "image-editing", concept: "AI Image Editing & Inpainting", emoji: "🎨",
    description: "Using AI to edit specific parts of an image — removing objects, changing backgrounds, adding elements. Inpainting fills in missing or masked regions. Powered by diffusion models.",
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
    description: "Learning through trial and error — an agent takes actions in an environment, receives rewards/penalties, and learns a policy to maximize cumulative reward. Behind AlphaGo and game-playing AI.",
    category: "Reinforcement Learning", difficulty: "intermediate", rank: 76,
    keyTerms: ["Agent", "Environment", "Reward", "Policy", "Episode"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "Spinning Up in Deep RL — OpenAI", url: "https://spinningup.openai.com/" },
      { title: "David Silver's RL Course", url: "https://www.youtube.com/playlist?list=PLqYmG7hTraZDM-OYHWgPebj2MfCFzFObQ" },
    ],
  },
  {
    id: "q-learning", concept: "Q-Learning & Deep Q-Networks (DQN)", emoji: "🎮",
    description: "Q-Learning estimates the value of actions in each state. Deep Q-Networks (DQN) use neural networks to approximate Q-values — DeepMind's DQN played Atari games at superhuman level (2013).",
    category: "Reinforcement Learning", difficulty: "intermediate", rank: 77,
    keyTerms: ["Q-value", "Bellman equation", "Experience replay", "Target network"],
    prerequisites: ["Reinforcement Learning"],
    learnMore: [
      { title: "DQN Paper — DeepMind", url: "https://arxiv.org/abs/1312.5602" },
    ],
  },
  {
    id: "policy-gradient", concept: "Policy Gradient & Actor-Critic", emoji: "🎮",
    description: "Policy gradient methods directly optimize the policy (action selection) rather than value estimates. Actor-Critic combines both: the actor selects actions, the critic evaluates them.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 78,
    keyTerms: ["REINFORCE", "Advantage function", "A2C", "A3C", "Baseline"],
    prerequisites: ["Q-Learning"],
    learnMore: [
      { title: "OpenAI Spinning Up: Policy Gradient", url: "https://spinningup.openai.com/en/latest/algorithms/vpg.html" },
    ],
  },
  {
    id: "ppo", concept: "PPO (Proximal Policy Optimization)", emoji: "🎮",
    description: "The most widely used RL algorithm — simpler and more stable than predecessors. Used in RLHF to fine-tune ChatGPT, in robotics, and in game AI. Balances exploration with stable training.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 79,
    keyTerms: ["Clipping", "Trust region", "Surrogate objective", "KL penalty"],
    prerequisites: ["Policy Gradient"],
    learnMore: [
      { title: "PPO Paper — OpenAI", url: "https://arxiv.org/abs/1707.06347" },
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
    prerequisites: ["Reinforcement Learning"],
    learnMore: [
      { title: "DeepMind: Specification Gaming", url: "https://deepmindsafetyresearch.medium.com/specification-gaming-the-flip-side-of-ai-ingenuity-c85bdb0deeb4" },
    ],
  },
  {
    id: "multi-agent-rl", concept: "Multi-Agent Reinforcement Learning", emoji: "🎮",
    description: "Multiple agents learning simultaneously in a shared environment — they can cooperate, compete, or both. Adds complexity: each agent's optimal strategy depends on what others do.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 82,
    keyTerms: ["Nash equilibrium", "Cooperative", "Competitive", "Self-play"],
    prerequisites: ["Reinforcement Learning"],
    learnMore: [
      { title: "OpenAI Five — Dota 2", url: "https://openai.com/research/openai-five" },
    ],
  },
  {
    id: "world-models", concept: "World Models", emoji: "🎮",
    description: "AI that builds internal models of how the world works — predicting what happens next without actually experiencing it. LeCun's vision for the next paradigm: learning through observation, not just language.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 83,
    keyTerms: ["Predictive model", "Imagination", "Model-based RL", "JEPA"],
    prerequisites: ["Reinforcement Learning"],
    learnMore: [
      { title: "LeCun: A Path Towards Autonomous Machine Intelligence", url: "https://openreview.net/forum?id=BZ5a1r-kVsf" },
    ],
  },
  {
    id: "sim-to-real", concept: "Sim-to-Real Transfer", emoji: "🎮",
    description: "Training RL agents in simulation and deploying them in the real world. Overcomes the cost and danger of real-world training. Domain randomization helps bridge the gap between sim and reality.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 84,
    keyTerms: ["Domain randomization", "Simulation", "Reality gap", "Digital twin"],
    prerequisites: ["Reinforcement Learning"],
    learnMore: [
      { title: "OpenAI: Sim-to-Real Robotics", url: "https://openai.com/research/solving-rubiks-cube" },
    ],
  },
  {
    id: "inverse-rl", concept: "Inverse Reinforcement Learning", emoji: "🎮",
    description: "Learning the reward function from observing expert behavior — inferring WHAT the expert is optimizing, not just imitating their actions. Key for building AI that understands human preferences.",
    category: "Reinforcement Learning", difficulty: "advanced", rank: 85,
    keyTerms: ["Reward inference", "Expert demonstrations", "Imitation learning", "IRL"],
    prerequisites: ["Reinforcement Learning"],
    learnMore: [
      { title: "Ng & Russell: IRL Paper", url: "https://ai.stanford.edu/~ang/papers/icml00-irl.pdf" },
    ],
  },

  // === MLOps & Infrastructure (86–95) ===
  {
    id: "gpu-tpu", concept: "GPU & TPU Computing", emoji: "⚙️",
    description: "GPUs (NVIDIA) and TPUs (Google) are the hardware that makes deep learning possible. Their parallel processing capabilities accelerate matrix operations by 100x+ versus CPUs.",
    category: "MLOps & Infrastructure", difficulty: "beginner", rank: 86,
    keyTerms: ["CUDA", "Tensor cores", "A100", "H100", "TPUv5", "Parallelism"],
    prerequisites: [],
    learnMore: [
      { title: "NVIDIA CUDA Guide", url: "https://developer.nvidia.com/cuda-zone" },
    ],
  },
  {
    id: "model-deployment", concept: "Model Deployment & Serving", emoji: "⚙️",
    description: "Getting trained models into production where they serve real users. Involves containerization (Docker), API frameworks (FastAPI), model servers (TensorRT, vLLM), and monitoring.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 87,
    keyTerms: ["Docker", "FastAPI", "TensorRT", "vLLM", "Latency", "Throughput"],
    prerequisites: ["Training vs Inference"],
    learnMore: [
      { title: "Made With ML — MLOps", url: "https://madewithml.com/" },
    ],
  },
  {
    id: "mlops", concept: "MLOps (ML Operations)", emoji: "⚙️",
    description: "The practice of deploying, monitoring, and maintaining ML models in production. Combines ML, DevOps, and data engineering. The difference between a notebook prototype and a reliable production system.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 88,
    keyTerms: ["CI/CD for ML", "Model registry", "Feature store", "A/B testing", "Monitoring"],
    prerequisites: ["Model Deployment"],
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
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "Weights & Biases — Free Courses", url: "https://wandb.ai/site/courses" },
    ],
  },
  {
    id: "data-pipeline", concept: "Data Pipelines & ETL", emoji: "⚙️",
    description: "Automated workflows for collecting, cleaning, transforming, and loading data for ML. The unsexy but critical infrastructure that makes everything else possible.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 90,
    keyTerms: ["ETL", "Apache Airflow", "dbt", "Data warehouse", "Feature store"],
    prerequisites: [],
    learnMore: [
      { title: "Apache Airflow", url: "https://airflow.apache.org/" },
    ],
  },
  {
    id: "edge-ai", concept: "Edge AI & On-Device ML", emoji: "⚙️",
    description: "Running AI models directly on devices (phones, IoT, cars) instead of in the cloud. Enables low-latency, privacy-preserving AI. Requires model compression and optimization.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 91,
    keyTerms: ["TensorFlow Lite", "CoreML", "ONNX", "Edge TPU", "Model optimization"],
    prerequisites: ["Model Quantization & Compression"],
    learnMore: [
      { title: "TensorFlow Lite", url: "https://www.tensorflow.org/lite" },
    ],
    realWorldApps: "Smartphone cameras, smart speakers, autonomous vehicles, industrial IoT",
  },
  {
    id: "federated-learning", concept: "Federated Learning", emoji: "⚙️",
    description: "Training ML models across multiple devices/organizations without sharing raw data — each participant trains locally and shares only model updates. Preserves privacy while enabling collaborative learning.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 92,
    keyTerms: ["Privacy-preserving", "Aggregation", "Non-IID data", "Communication efficiency"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "Google: Federated Learning", url: "https://ai.googleblog.com/2017/04/federated-learning-collaborative.html" },
    ],
  },
  {
    id: "distributed-training", concept: "Distributed Training", emoji: "⚙️",
    description: "Training models across multiple GPUs or machines. Essential for frontier models — GPT-4 was trained on thousands of GPUs. Techniques: data parallelism, model parallelism, pipeline parallelism.",
    category: "MLOps & Infrastructure", difficulty: "advanced", rank: 93,
    keyTerms: ["Data parallelism", "Model parallelism", "FSDP", "DeepSpeed", "Gradient sync"],
    prerequisites: ["GPU & TPU Computing"],
    learnMore: [
      { title: "PyTorch Distributed Training", url: "https://pytorch.org/tutorials/intermediate/ddp_tutorial.html" },
    ],
  },
  {
    id: "model-versioning", concept: "Model Versioning & Registry", emoji: "⚙️",
    description: "Tracking different versions of ML models with their metadata, performance metrics, and lineage. Essential for reproducibility and production deployment. MLflow Model Registry is the standard.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 94,
    keyTerms: ["Model registry", "Version control", "Lineage", "Rollback", "Staging"],
    prerequisites: ["Experiment Tracking"],
    learnMore: [
      { title: "MLflow Model Registry", url: "https://mlflow.org/docs/latest/model-registry.html" },
    ],
  },
  {
    id: "monitoring", concept: "ML Monitoring & Observability", emoji: "⚙️",
    description: "Watching ML models in production for degradation. Models decay over time as data distributions shift. Monitoring detects data drift, concept drift, and performance drops before they impact users.",
    category: "MLOps & Infrastructure", difficulty: "intermediate", rank: 95,
    keyTerms: ["Data drift", "Concept drift", "Model degradation", "Alerting", "Retraining"],
    prerequisites: ["Model Deployment"],
    learnMore: [
      { title: "Evidently AI — ML Monitoring", url: "https://www.evidentlyai.com/" },
    ],
  },

  // === AI Agents & Applications (96–105) ===
  {
    id: "ai-agents", concept: "AI Agents", emoji: "🤖",
    description: "AI systems that can plan, use tools, browse the web, write code, and complete multi-step tasks autonomously. The hottest frontier in AI (2025–2026). LangGraph, CrewAI, and AutoGen are leading frameworks.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 96,
    keyTerms: ["Tool use", "Planning", "ReAct", "Reasoning loop", "Autonomy"],
    prerequisites: ["Prompt Engineering", "GPT"],
    learnMore: [
      { title: "Anthropic: Building Effective Agents", url: "https://docs.anthropic.com/en/docs/build-with-claude/agentic" },
      { title: "LangGraph Documentation", url: "https://langchain-ai.github.io/langgraph/" },
    ],
    realWorldApps: "Coding assistants, research automation, customer service, data analysis",
  },
  {
    id: "tool-use", concept: "Tool Use & Function Calling", emoji: "🤖",
    description: "LLMs that can call external tools — APIs, databases, calculators, web browsers. Transforms LLMs from text generators into action-taking agents. OpenAI function calling and Claude tool use are leading implementations.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 97,
    keyTerms: ["Function calling", "API integration", "MCP", "Tool selection"],
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
    prerequisites: ["Computer Vision", "Reinforcement Learning"],
    learnMore: [
      { title: "Waymo Research", url: "https://waymo.com/research/" },
    ],
  },
  {
    id: "recommendation-systems", concept: "Recommendation Systems", emoji: "🤖",
    description: "AI that suggests content, products, or connections based on user behavior and preferences. Powers Netflix, YouTube, Amazon, and TikTok. Uses collaborative filtering, content-based, and hybrid approaches.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 99,
    keyTerms: ["Collaborative filtering", "Content-based", "Matrix factorization", "Cold start"],
    prerequisites: ["Machine Learning", "Embeddings"],
    learnMore: [
      { title: "Google: Recommendation Systems Course", url: "https://developers.google.com/machine-learning/recommendation" },
    ],
  },
  {
    id: "drug-discovery", concept: "AI-Driven Drug Discovery", emoji: "🤖",
    description: "Using AI to identify, design, and optimize drug candidates — dramatically accelerating the traditional 10-15 year drug development cycle. AlphaFold solved protein folding; Insilico Medicine created the first AI-designed drug in clinical trials.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 100,
    keyTerms: ["Protein folding", "AlphaFold", "Molecular generation", "Drug target"],
    prerequisites: ["Deep Learning"],
    learnMore: [
      { title: "AlphaFold — DeepMind", url: "https://alphafold.ebi.ac.uk/" },
    ],
  },
  {
    id: "xai", concept: "Explainable AI (XAI)", emoji: "🤖",
    description: "Techniques to make AI decisions interpretable by humans. SHAP and LIME explain individual predictions. Critical for healthcare, finance, and legal applications where decisions must be justified.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 101,
    keyTerms: ["SHAP", "LIME", "Feature importance", "Attention visualization", "Interpretability"],
    prerequisites: ["Machine Learning"],
    learnMore: [
      { title: "SHAP Documentation", url: "https://shap.readthedocs.io/" },
      { title: "Christoph Molnar: Interpretable ML (Free Book)", url: "https://christophm.github.io/interpretable-ml-book/" },
    ],
  },
  {
    id: "search-ranking", concept: "AI-Powered Search & Ranking", emoji: "🤖",
    description: "Using ML to improve search results and ranking. Moved from keyword matching to semantic understanding. BERT transformed Google Search. Vector search enables meaning-based retrieval.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 102,
    keyTerms: ["Semantic search", "Learning to rank", "BM25", "Cross-encoder", "Bi-encoder"],
    prerequisites: ["Embeddings", "BERT"],
    learnMore: [
      { title: "Pinecone: Semantic Search", url: "https://www.pinecone.io/learn/semantic-search/" },
    ],
  },
  {
    id: "conversational-ai", concept: "Conversational AI & Chatbots", emoji: "🤖",
    description: "AI systems for natural dialogue — from simple rule-based chatbots to LLM-powered assistants. Key challenges: maintaining context, handling ambiguity, knowing when to escalate to humans.",
    category: "AI Agents & Applications", difficulty: "intermediate", rank: 103,
    keyTerms: ["Dialog management", "Intent recognition", "Slot filling", "Conversation memory"],
    prerequisites: ["NLP", "GPT"],
    learnMore: [
      { title: "Rasa Documentation", url: "https://rasa.com/docs/" },
    ],
  },
  {
    id: "medical-ai", concept: "AI in Healthcare & Medical Imaging", emoji: "🤖",
    description: "AI for diagnosis, treatment planning, drug discovery, and medical imaging. CNNs match or exceed radiologists for certain diagnoses. Faces unique challenges: regulation, liability, bias in clinical data.",
    category: "AI Agents & Applications", difficulty: "advanced", rank: 104,
    keyTerms: ["Medical imaging", "Clinical NLP", "FDA approval", "Diagnostic AI"],
    prerequisites: ["CNN", "Deep Learning"],
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
      { title: "Runway ML", url: "https://runwayml.com/" },
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
      { title: "AI Safety Fundamentals", url: "https://aisafetyfundamentals.com/" },
      { title: "Anthropic: Core Views on AI Safety", url: "https://www.anthropic.com/research" },
    ],
  },
  {
    id: "ai-bias", concept: "AI Bias & Fairness", emoji: "🛡️",
    description: "AI systems can perpetuate and amplify societal biases present in training data. Understanding, measuring, and mitigating bias is critical for responsible AI deployment.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 107,
    keyTerms: ["Training data bias", "Algorithmic fairness", "Disparate impact", "Fairlearn"],
    prerequisites: [],
    learnMore: [
      { title: "Fairlearn Documentation", url: "https://fairlearn.org/" },
      { title: "Weapons of Math Destruction (Book)", url: "https://www.amazon.com/Weapons-Math-Destruction-Increases-Inequality/dp/0553418815" },
    ],
    realWorldApps: "Hiring algorithms, criminal justice, lending decisions, healthcare",
  },
  {
    id: "hallucination", concept: "AI Hallucinations", emoji: "🛡️",
    description: "When AI generates confident but factually incorrect or fabricated information. A fundamental limitation of current LLMs — they predict plausible text, not truthful text. RAG and grounding techniques help reduce it.",
    category: "Safety, Ethics & Governance", difficulty: "beginner", rank: 108,
    keyTerms: ["Confabulation", "Grounding", "Factual accuracy", "RAG as mitigation"],
    prerequisites: ["GPT"],
    learnMore: [
      { title: "Anthropic: Reducing Hallucinations", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations" },
    ],
  },
  {
    id: "red-teaming", concept: "Red Teaming AI Systems", emoji: "🛡️",
    description: "Systematically testing AI systems by trying to make them fail, produce harmful outputs, or bypass safety measures. Essential for finding vulnerabilities before deployment. Both manual and automated approaches.",
    category: "Safety, Ethics & Governance", difficulty: "intermediate", rank: 109,
    keyTerms: ["Jailbreaking", "Adversarial attacks", "Safety evaluation", "Prompt injection"],
    prerequisites: ["Prompt Engineering"],
    learnMore: [
      { title: "Anthropic: Red Teaming", url: "https://www.anthropic.com/research/red-teaming" },
    ],
  },
  {
    id: "ai-regulation", concept: "AI Regulation & Governance", emoji: "🛡️",
    description: "The emerging legal and policy landscape for AI. The EU AI Act (2024) is the first comprehensive AI law. Understanding regulation is now a career advantage — every AI team needs someone who understands compliance.",
    category: "Safety, Ethics & Governance", difficulty: "beginner", rank: 110,
    keyTerms: ["EU AI Act", "Risk categories", "Compliance", "Transparency requirements"],
    prerequisites: [],
    learnMore: [
      { title: "EU AI Act Overview", url: "https://artificialintelligenceact.eu/" },
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/artificial-intelligence/executive-order-safe-secure-and-trustworthy-artificial-intelligence" },
    ],
  },
];
