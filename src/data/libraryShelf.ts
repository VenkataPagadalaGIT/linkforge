/**
 * The Complete Shelf: nineteen free books, as physical objects.
 *
 * Every volume here is a real, legally free book already curated in the
 * learning roadmap, ordered as a curriculum arc from first Python program to
 * AI safety. Nothing is decorative: pulling a book forward gives you its real
 * author, the topic it belongs to, and a link to read it at the publisher.
 *
 * Proportions and cloth colours are authored per book rather than generated,
 * because a shelf reads as real when the volumes disagree with each other. A
 * thin cloth pamphlet next to a thick reference is the whole effect. All
 * dimensions are in metres at roughly 1:1 scale, so a tall book is about 24cm.
 */

export interface ShelfBook {
  id: string;
  /** Spine text. Kept short so it fits vertically on the board. */
  spineTitle: string;
  /** Full title for the inspection panel. */
  title: string;
  author: string;
  /** Contributor id when the author is one of the profiled 100. */
  contributorId?: string;
  /** Roadmap topic this book supports. */
  topic: string;
  url: string;
  /** One line for the inspection panel. */
  note: string;
  /** Clothbound cover colour, muted and desaturated. */
  cloth: string;
  /** Foil colour: warm brass or a pale silver, never bright gold. */
  foil: string;
  /** height, thickness (spine width), depth, in metres. */
  dims: [number, number, number];
  /** Which abstract motif is stamped on the spine and cover. */
  motif: "rule" | "circle" | "grid" | "arc" | "chevron" | "dots" | "band";
}

export const shelfBooks: ShelfBook[] = [
  {
    id: "think-python",
    spineTitle: "THINK PYTHON",
    title: "Think Python",
    author: "Allen B. Downey",
    topic: "Python Programming for AI",
    url: "https://greenteapress.com/wp/think-python-2e/",
    note: "The gentlest honest introduction to programming. Free online, and the one to start with if you have never written code.",
    cloth: "#7d8471",
    foil: "#c9a227",
    dims: [0.225, 0.032, 0.15],
    motif: "rule",
  },
  {
    id: "mml",
    spineTitle: "MATH FOR ML",
    title: "Mathematics for Machine Learning",
    author: "Deisenroth, Faisal & Ong",
    topic: "Math for AI",
    url: "https://mml-book.github.io/",
    note: "Exactly the mathematics you need and nothing more: linear algebra, calculus, probability, aimed at machine learning.",
    cloth: "#2c4763",
    foil: "#c9a227",
    dims: [0.245, 0.045, 0.17],
    motif: "grid",
  },
  {
    id: "hefferon",
    spineTitle: "LINEAR ALGEBRA",
    title: "Linear Algebra",
    author: "Jim Hefferon",
    topic: "Math for AI",
    url: "https://hefferon.net/linearalgebra/",
    note: "A complete undergraduate linear algebra text, author-hosted and free, with full solutions.",
    cloth: "#8b6f5c",
    foil: "#d4c5a0",
    dims: [0.235, 0.038, 0.165],
    motif: "chevron",
  },
  {
    id: "calculus-made-easy",
    spineTitle: "CALCULUS MADE EASY",
    title: "Calculus Made Easy",
    author: "Silvanus P. Thompson",
    topic: "Math for AI",
    url: "https://www.gutenberg.org/ebooks/33283",
    note: "Written in 1910 and still the kindest calculus book ever published. Public domain via Project Gutenberg.",
    cloth: "#e3d5b8",
    foil: "#8a6d3b",
    dims: [0.195, 0.024, 0.13],
    motif: "band",
  },
  {
    id: "think-stats",
    spineTitle: "THINK STATS",
    title: "Think Stats",
    author: "Allen B. Downey",
    topic: "Statistics & Probability for AI",
    url: "https://greenteapress.com/wp/think-stats-3e/",
    note: "Statistics taught through Python code rather than proofs. Free online.",
    cloth: "#d98a68",
    foil: "#7a3d24",
    dims: [0.225, 0.028, 0.15],
    motif: "dots",
  },
  {
    id: "islp",
    spineTitle: "STATISTICAL LEARNING",
    title: "An Introduction to Statistical Learning",
    author: "James, Witten, Hastie, Tibshirani & Taylor",
    topic: "Intro to Machine Learning",
    url: "https://www.statlearning.com/",
    note: "The standard first ML text, now with a Python edition. Free PDF from the authors.",
    cloth: "#3f5245",
    foil: "#d4c5a0",
    dims: [0.24, 0.042, 0.17],
    motif: "circle",
  },
  {
    id: "pdsh",
    spineTitle: "DATA SCIENCE HANDBOOK",
    title: "Python Data Science Handbook",
    author: "Jake VanderPlas",
    topic: "NumPy, Pandas & Visualization",
    url: "https://jakevdp.github.io/PythonDataScienceHandbook/",
    note: "NumPy, pandas, matplotlib and scikit-learn, as a reference you actually keep open. Free online.",
    cloth: "#5b6b7a",
    foil: "#c9a227",
    dims: [0.23, 0.04, 0.16],
    motif: "grid",
  },
  {
    id: "pyda",
    spineTitle: "PYTHON FOR DATA ANALYSIS",
    title: "Python for Data Analysis",
    author: "Wes McKinney",
    topic: "NumPy, Pandas & Visualization",
    url: "https://wesmckinney.com/book/",
    note: "Written by the creator of pandas. The third edition is open access on his own site.",
    cloth: "#c96a2d",
    foil: "#f3e4c8",
    dims: [0.235, 0.046, 0.165],
    motif: "rule",
  },
  {
    id: "dataviz",
    spineTitle: "DATA VISUALIZATION",
    title: "Fundamentals of Data Visualization",
    author: "Claus O. Wilke",
    topic: "NumPy, Pandas & Visualization",
    url: "https://clauswilke.com/dataviz/",
    note: "How to make a chart that tells the truth. Thirty chapters, free, and beautifully made.",
    cloth: "#8e3438",
    foil: "#e8c9a0",
    dims: [0.22, 0.03, 0.185],
    motif: "arc",
  },
  {
    id: "prml",
    spineTitle: "PATTERN RECOGNITION",
    title: "Pattern Recognition and Machine Learning",
    author: "Christopher M. Bishop",
    topic: "Intro to Machine Learning",
    url: "https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf",
    note: "The classical ML reference, released free as a PDF by Microsoft Research. Pre-deep-learning, still rigorous.",
    cloth: "#46414d",
    foil: "#d4c5a0",
    dims: [0.25, 0.055, 0.175],
    motif: "circle",
  },
  {
    id: "aaamlp",
    spineTitle: "ALMOST ANY ML PROBLEM",
    title: "Approaching (Almost) Any Machine Learning Problem",
    author: "Abhishek Thakur",
    topic: "Scikit-Learn & Hands-On ML",
    url: "https://github.com/abhishekkrthakur/approachingalmost/blob/master/AAAMLP.pdf",
    note: "A practitioner's playbook from a four-time Kaggle grandmaster. Free PDF on the author's own GitHub.",
    cloth: "#6d7b6a",
    foil: "#c9a227",
    dims: [0.21, 0.026, 0.145],
    motif: "chevron",
  },
  {
    id: "d2l",
    spineTitle: "DIVE INTO DEEP LEARNING",
    title: "Dive into Deep Learning",
    author: "Zhang, Lipton, Li & Smola",
    topic: "Neural Networks & Deep Learning",
    url: "https://d2l.ai/",
    note: "Interactive, runnable, and maintained. Every concept comes with working code in multiple frameworks.",
    cloth: "#33608d",
    foil: "#d4c5a0",
    dims: [0.245, 0.058, 0.175],
    motif: "grid",
  },
  {
    id: "deep-learning-book",
    spineTitle: "DEEP LEARNING",
    title: "Deep Learning",
    author: "Goodfellow, Bengio & Courville",
    contributorId: "goodfellow",
    topic: "Neural Networks & Deep Learning",
    url: "https://www.deeplearningbook.org/",
    note: "The foundational textbook of the field, free to read online. Dense, and worth it.",
    cloth: "#23262e",
    foil: "#c9a227",
    dims: [0.255, 0.06, 0.18],
    motif: "band",
  },
  {
    id: "nielsen-nn",
    spineTitle: "NEURAL NETWORKS",
    title: "Neural Networks and Deep Learning",
    author: "Michael Nielsen",
    topic: "Neural Networks & Deep Learning",
    url: "http://neuralnetworksanddeeplearning.com/",
    note: "Builds a working network from nothing, one idea at a time. Still the clearest first pass at backpropagation.",
    cloth: "#5f7470",
    foil: "#d4c5a0",
    dims: [0.215, 0.027, 0.15],
    motif: "dots",
  },
  {
    id: "slp",
    spineTitle: "SPEECH AND LANGUAGE",
    title: "Speech and Language Processing",
    author: "Dan Jurafsky & James H. Martin",
    topic: "NLP & Text Processing",
    url: "https://web.stanford.edu/~jurafsky/slp3/",
    note: "The NLP reference, updated as a free draft for decades. Now covers transformers and LLMs.",
    cloth: "#7a4f4a",
    foil: "#c9a227",
    dims: [0.26, 0.052, 0.185],
    motif: "rule",
  },
  {
    id: "mle-burkov",
    spineTitle: "ML ENGINEERING",
    title: "Machine Learning Engineering",
    author: "Andriy Burkov",
    topic: "MLOps & Deploying AI",
    url: "http://www.mlebook.com/wiki/doku.php",
    note: "What happens after the model works: data, deployment, monitoring, drift. Read free online.",
    cloth: "#4d5b52",
    foil: "#d4c5a0",
    dims: [0.225, 0.034, 0.155],
    motif: "arc",
  },
  {
    id: "sutton-barto",
    spineTitle: "REINFORCEMENT LEARNING",
    title: "Reinforcement Learning: An Introduction",
    author: "Richard S. Sutton & Andrew G. Barto",
    topic: "Reinforcement Learning",
    url: "http://incompleteideas.net/book/the-book-2nd.html",
    note: "The RL book. Second edition free from Sutton's own site.",
    cloth: "#35424a",
    foil: "#c9a227",
    dims: [0.25, 0.05, 0.175],
    motif: "circle",
  },
  {
    id: "rlhf-book",
    spineTitle: "THE RLHF BOOK",
    title: "The RLHF Book",
    author: "Nathan Lambert",
    contributorId: "lambert",
    topic: "Reinforcement Learning",
    url: "https://rlhfbook.com/",
    note: "How preference tuning actually works, written as the technique matured. Free online.",
    cloth: "#6a5a7a",
    foil: "#d4c5a0",
    dims: [0.2, 0.022, 0.14],
    motif: "chevron",
  },
  {
    id: "ai-safety-book",
    spineTitle: "AI SAFETY & SOCIETY",
    title: "AI Safety, Ethics and Society",
    author: "Dan Hendrycks",
    topic: "AI Safety & Responsible AI",
    url: "https://www.aisafetybook.com/",
    note: "A structured course in what can go wrong and why, from the Center for AI Safety. Free book, PDF and video.",
    cloth: "#b08a3e",
    foil: "#2e2418",
    dims: [0.23, 0.036, 0.16],
    motif: "band",
  },
];
