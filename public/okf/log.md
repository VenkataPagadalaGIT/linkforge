# Bundle Update Log

## 2026-08-08

* **Update**: Added the bundle's first Attested Computation (spec section 10): every headline count this site publishes is now derived by one sanctioned computation with a declared executor and a deterministic attester. The attester re-derives the values rather than trusting the receipt, reads the claims out of llms.txt, llms-full.txt, the dataset concepts and the navigation, and exits non-zero when a published number stops matching the data. Control-tested by planting a false count and confirming it fails.
* **Update**: Encyclopedia expanded from 123 to 175 concepts in one coverage programme. First a self-audit closed foundational gaps (decision trees, SVM, evaluation metrics, linear algebra, probability, information theory, optimizers, normalization, residual connections, autoencoders) and frontier gaps (self-supervised learning, GNNs, DPO, LoRA, flow matching, constitutional AI, watermarking, agent memory). Then a market audit against IBM Think's 2026 ML guide (215 topics) and a nine-source union catalogue of 1,187 topics (Google's ML glossary, Hugging Face Learn, DeepLearning.AI, MIT 6.S191 and 6.036, Anthropic, Wikipedia's ML outline, AWS) added the practitioner data layer (data leakage, EDA, data augmentation), the missing intro classifiers (logistic regression, kNN, Naive Bayes), classical NLP (bag-of-words and TF-IDF, topic modeling, summarization, information extraction), the classical-methods layer (probabilistic graphical models, evolutionary optimization), and the infrastructure layer (AI data centers, numerical precision, agent harnesses). Roughly 40 further subtopics were folded into existing entries as key terms rather than given thin standalone pages. Every claimed gap was adversarially verified against the shipped data before being accepted, and every new external link was opened and checked.
* **Correction**: The encyclopedia defined GPT, scaling laws, fine-tuning and evaluation but had no Large Language Models entry. Added. All prerequisite references across the 175 concepts now resolve to real concept titles.
* **Update**: Roadmap gained a seventh phase, Depth Tracks: 7 elective topics for weeks 19 to 25 (multimodal, speech and audio, robotics, efficient inference, recommenders, time series, graph ML). 35 topics and 473 resources total, 440 of them free (93%).
* **Correction**: Ontology dataset counts aligned with the shipped data module: 455 entities and 1,161 edges. The two review passes covered 1,245 candidate edges; 84 were cut.

## 2026-08-04

* **Update**: Renamed dataset field tables to the conventional `# Schema` heading (spec 4.2).
* **Update**: Migrated the bundle to OKF v0.2: `timestamp` replaced by `generated`, machine-confirmed `verified` events added, index files stripped of frontmatter per the spec, `sources` added to the dataset concepts.

## 2026-07-30

* **Initialization**: Bundle created with guides (4), 3D experiences (6), datasets (4), and research papers (2).
