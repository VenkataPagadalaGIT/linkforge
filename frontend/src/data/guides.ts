/**
 * guides.ts — the scalable "reference guide" content type.
 *
 * Each Guide is a data record. Rich content is expressed as an ordered list of
 * data-only Blocks (no component imports here), which `GuideRenderer` maps to
 * React components. DefinedTerms and the comparison table are stored as
 * structured data so they can be reused three ways: on-page rendering,
 * JSON-LD (DefinedTermSet + FAQPage), and the crawlable <noscript> fallback.
 *
 * Add guide #2 by appending another record — no new components required.
 */

export interface DefinedTerm {
  slug: string;
  term: string;
  aka?: string[];
  /** One-sentence definition — the thing answer engines quote. */
  oneLiner: string;
  inDepth: string;
  analogy: string;
  example: string;
  /** Why it matters when you are building for AI agents / AEO / GEO. */
  agentRole: string;
  /** Associated figure id (see graphModels VIEW_BUILDERS). */
  viewId?: string;
}

export interface ComparisonRow {
  type: string;
  isA: string;
  answers: string;
  structure: string;
  example: string;
  bestFor: string;
  limit: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string; id: string }
  | { kind: "h3"; text: string; id?: string }
  | { kind: "figure"; viewId: string }
  | { kind: "stack" }
  | { kind: "comparison" }
  | { kind: "termcard"; termSlug: string }
  | { kind: "code"; caption?: string; code: string }
  | { kind: "callout"; title: string; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "decision"; items: { when: string; use: string }[] }
  | { kind: "related"; items: { label: string; href: string }[] }
  | { kind: "faq" };

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  deck: string;
  datePublished: string;
  dateModified: string;
  readingTime: string;
  tags: string[];
  terms: DefinedTerm[];
  comparison: ComparisonRow[];
  faqs: FaqItem[];
  blocks: Block[];
}

/* ====================================================================== *
 *  GUIDE 1 — Graph Types for AI Agents
 * ====================================================================== */

const graphTerms: DefinedTerm[] = [
  {
    slug: "taxonomy",
    term: "Taxonomy",
    aka: ["Hierarchy", "Classification tree"],
    oneLiner:
      "A taxonomy is a strict tree that classifies things into nested parent–child categories using a single relationship: “is a kind of.”",
    inDepth:
      "A taxonomy organizes a domain into levels. Each item has exactly one parent, and the only edge that exists is hierarchy. It is the simplest way to impose order, which is why site navigation, product categories, and library systems are taxonomies. Its strength — one clean path to everything — is also its ceiling: it cannot express that a product is *made by* a brand or *suited for* an activity, because those are not parent–child links.",
    analogy:
      "A filing cabinet. Every document lives in exactly one folder, and folders nest inside drawers. You always know where something goes, but a document can only be in one place at a time.",
    example:
      "Footwear → Running Shoes → Road Running → Nike Pegasus 41. The Pegasus is filed under Road Running and nowhere else.",
    agentRole:
      "Taxonomies give agents a reliable scaffold for browsing and disambiguation, but on their own they carry almost no meaning an agent can reason with. They are the skeleton, not the brain.",
    viewId: "taxonomy",
  },
  {
    slug: "ontology",
    term: "Ontology",
    aka: ["Schema", "T-Box", "Vocabulary"],
    oneLiner:
      "An ontology is the formal blueprint of a domain: the classes that can exist, the types of relationships allowed between them, and the rules that govern them — independent of any actual data.",
    inDepth:
      "Where a taxonomy only nests categories, an ontology defines the full grammar of a domain. It says a Product can have a Brand, belong to a Category, be suited for an Activity, and carry Attributes — and it can enforce rules such as “every Product must have exactly one Brand.” Schema.org is a lightweight, web-scale ontology. An ontology contains no instances; it is the empty form that real facts later fill in.",
    analogy:
      "The architectural blueprint and building code for a house. It specifies what rooms and connections are permitted and the rules they must obey, before a single brick is laid.",
    example:
      "Defining that the class Product relates to Brand via `hasBrand`, to Activity via `suitedFor`, and that `cushioning` must be one of {minimal, moderate, max} — for every shoe you will ever add.",
    agentRole:
      "The ontology is what lets an agent interpret data consistently. Shared vocabulary plus rules means two systems can exchange facts without misreading them, and a reasoner can infer new ones. It is the contract that makes a knowledge graph trustworthy.",
    viewId: "ontology",
  },
  {
    slug: "knowledge-graph",
    term: "Knowledge Graph",
    aka: ["Entity graph", "A-Box", "Fact graph"],
    oneLiner:
      "A knowledge graph is a network of real-world entities and the typed, directed relationships between them — the ontology populated with actual facts and linked to the wider web.",
    inDepth:
      "A knowledge graph turns the ontology's empty form into a living web of facts: named entities (Nike Pegasus 41, Nike, Road Running) connected by meaningful edges (`madeBy`, `suitedFor`). Crucially, entities resolve — a `sameAs` link to Wikidata or Google's Knowledge Graph anchors your “Nike” to the canonical, global one. This is the layer Google, Bing, and AI answer engines reason over to understand who you are, what you offer, and how it all connects.",
    analogy:
      "A subway map of facts. Stations are entities and the colored lines are typed relationships; you can trace a path from any fact to any related fact.",
    example:
      "Nike Pegasus 41 —madeBy→ Nike; —suitedFor→ Road Running; —has→ Moderate Cushioning. Nike —sameAs→ Wikidata:Nike.",
    agentRole:
      "Knowledge graphs give agents precise, verifiable, traversable facts. When an answer engine cites a specific spec or relationship, it is reading a graph, not guessing from text. This is the backbone of factual grounding and entity-based SEO.",
    viewId: "knowledge-graph",
  },
  {
    slug: "information-graph",
    term: "Information Graph",
    aka: ["Content graph", "Asset graph"],
    oneLiner:
      "An information graph maps your content ecosystem — pages, sections, and assets — onto the entities they cover and the search demand they target, plus the links between them.",
    inDepth:
      "This is the applied layer SEOs live in. Where a knowledge graph models the world, an information graph models *your representation of it*: which URL covers which entity, which query each page targets, how pages link to each other, and where the coverage gaps are. It is the bridge between the knowledge layer and your actual site. (The term is an industry/applied one rather than a formal computer-science category — useful precisely because it names the content-to-entity-to-demand mapping that nothing else does.)",
    analogy:
      "A library's card catalog cross-referenced with what patrons actually ask for. It tells you not just what books exist, but which shelf covers which topic and what readers keep requesting that you don't stock.",
    example:
      "The page /guides/road-shoes —mentions→ Pegasus 41 and Clifton 9, —targets→ the query “best road running shoes,” and —internal-links→ /reviews/pegasus-41.",
    agentRole:
      "An information graph is how you make every important asset discoverable, crawlable, and mapped to demand. For AEO/GEO it determines whether an agent can find the right page, section, or table to extract and cite when it answers.",
    viewId: "information-graph",
  },
  {
    slug: "context-graph",
    term: "Context Graph",
    aka: ["Situational graph", "Intent graph"],
    oneLiner:
      "A context graph layers situation — user, intent, journey stage, location, time, freshness, and trust — over a knowledge graph to decide which answer is right for this person, right now.",
    inDepth:
      "A knowledge graph knows that both the Pegasus and the Clifton are road shoes. A context graph decides which one to surface for a beginner marathoner in Atlanta, on mobile, in winter, who wants maximum cushioning and an in-stock option with a fresh review. It re-weights the knowledge graph by situational signals and scores the best match. This is the highest-value and newest layer — the one that powers personalization, AI Overviews, and agentic decisions.",
    analogy:
      "A great concierge. They know the full menu (the knowledge graph), but their recommendation changes based on who you are, the occasion, the time of day, and what's fresh in the kitchen.",
    example:
      "User intent=buy, stage=decision, location=Atlanta, season=winter → the context graph scores Hoka Clifton 9 at 0.92 (max cushioning, in-stock locally, review < 30 days) over the Pegasus at 0.61.",
    agentRole:
      "The context graph is the decision layer for AEO, GEO, and agents. It is what lets ChatGPT, Gemini, Perplexity, and AI Mode synthesize the single most relevant answer for a specific task and moment, rather than a generically correct one.",
    viewId: "context-graph",
  },
  {
    slug: "vector-index",
    term: "Vector / Embedding Index",
    aka: ["Vector database", "Embedding store", "Semantic index"],
    oneLiner:
      "A vector index stores content as numerical embeddings and retrieves by similarity — nearest neighbors in meaning-space — with no schema and no explicit relationships.",
    inDepth:
      "A vector index is the counterpart to a graph, not a kind of it. Instead of typed edges, it places everything as points in a high-dimensional space where closeness means semantic similarity. Ask a fuzzy question and it returns the nearest content by cosine distance. It is fast, forgiving of phrasing, and needs no upfront modeling — but it cannot tell you *why* two things relate, cannot guarantee a fact, and cannot traverse a chain of reasoning. Most production RAG systems pair a vector index (recall) with a knowledge graph (precision and grounding).",
    analogy:
      "Standing in a room where similar ideas naturally cluster together. You can grab whatever is nearby, but no one has labeled the connections — you only know things are 'close,' not how they relate.",
    example:
      "The query “cushioned shoes for my first marathon” lands near the Clifton 9 (0.91) and Pegasus 41 (0.88) and far from a hiking sandal — even though none of those exact words appear in the product names.",
    agentRole:
      "Vector retrieval is how agents find candidate content quickly and tolerate messy, natural-language queries. It is the recall engine of RAG. Pair it with a graph when answers must be exact, explainable, or fact-checked.",
    viewId: "vector-index",
  },
];

const graphComparison: ComparisonRow[] = [
  {
    type: "Taxonomy",
    isA: "A classification tree",
    answers: "“Where does this belong?”",
    structure: "Single-parent hierarchy; only is-a edges",
    example: "Footwear → Running → Road → Pegasus 41",
    bestFor: "Navigation, browsing, categories",
    limit: "Can't express non-hierarchical relationships",
  },
  {
    type: "Ontology",
    isA: "The schema / blueprint",
    answers: "“What can exist and how do things relate?”",
    structure: "Classes + relationship types + rules (no instances)",
    example: "Product hasBrand Brand; suitedFor Activity",
    bestFor: "Shared meaning, interoperability, inference",
    limit: "Holds no data on its own",
  },
  {
    type: "Knowledge Graph",
    isA: "A web of facts",
    answers: "“What is true about these entities?”",
    structure: "Entities + typed, directed edges; resolvable",
    example: "Pegasus 41 madeBy Nike; sameAs Wikidata",
    bestFor: "Factual grounding, entity SEO, reasoning",
    limit: "Costly to build & maintain; needs an ontology",
  },
  {
    type: "Information Graph",
    isA: "Your content ↔ demand map",
    answers: "“What content covers what, for which query?”",
    structure: "Pages/URLs ↔ entities ↔ queries + internal links",
    example: "/guides/road-shoes targets “best road shoes”",
    bestFor: "Content strategy, internal linking, AEO coverage",
    limit: "Applied term; only as good as your content audit",
  },
  {
    type: "Context Graph",
    isA: "The relevance / decision layer",
    answers: "“Which answer is right for THIS person now?”",
    structure: "Knowledge graph + user/intent/time/trust weights",
    example: "Beginner + Atlanta + winter → Clifton 9 (0.92)",
    bestFor: "Personalization, AEO/GEO, agentic answers",
    limit: "Newest/hardest; needs live signals",
  },
  {
    type: "Vector Index",
    isA: "A similarity space (not a graph)",
    answers: "“What is most similar to this?”",
    structure: "Embeddings; nearest-neighbor by distance; no schema",
    example: "“marathon cushioning” ≈ Clifton 9 (0.91)",
    bestFor: "Fuzzy recall, RAG retrieval, search",
    limit: "No facts, no explanations, no traversal",
  },
];

const graphFaqs: FaqItem[] = [
  {
    q: "Is a knowledge graph the same as an ontology?",
    a: "No. An ontology is the schema — the classes, allowed relationships, and rules. A knowledge graph is that schema filled with real instances and facts. The ontology is the empty blueprint; the knowledge graph is the populated building. You can have an ontology with no data, but a well-built knowledge graph almost always relies on an ontology to keep its facts consistent.",
  },
  {
    q: "Knowledge graph vs vector database — which should I use for RAG?",
    a: "Usually both. A vector index gives you fast, fuzzy recall: it finds candidate content even when the wording doesn't match. A knowledge graph gives you precision and grounding: exact facts, explainable relationships, and the ability to traverse a chain of reasoning. Production RAG systems increasingly combine them — vectors to retrieve candidates, a graph to verify and structure the answer. Use vectors alone for similarity search; add a graph when answers must be exact, auditable, or fact-checked.",
  },
  {
    q: "What is a context graph and why does it matter for AEO and GEO?",
    a: "A context graph adds a situational layer — user, intent, journey stage, location, time, freshness, and source trust — on top of a knowledge graph, then scores which answer is most relevant for a specific person at a specific moment. It matters for Answer Engine Optimization and Generative Engine Optimization because AI systems like ChatGPT, Gemini, Perplexity, and Google's AI Mode don't return ten links — they synthesize one best answer. The context graph is the layer that decides which answer that is.",
  },
  {
    q: "Do I need an ontology to have a knowledge graph?",
    a: "Technically no, but practically yes for anything that has to scale or stay correct. Without an ontology you can still link entities, but nothing enforces consistency — the same relationship gets modeled five different ways and the graph rots. A lightweight ontology (even schema.org) gives you a shared vocabulary and rules that keep the graph clean as it grows.",
  },
  {
    q: "What's the difference between an information graph and a knowledge graph?",
    a: "A knowledge graph models the world — real entities and the facts that connect them. An information graph models your representation of the world — which of your pages and assets cover which entities, target which queries, and link to each other. The knowledge graph is about truth; the information graph is about coverage. SEO and content strategy live in the information graph; entity understanding lives in the knowledge graph.",
  },
  {
    q: "Property graph or RDF triple store — does the implementation matter?",
    a: "Both are valid ways to build a knowledge graph, and the choice is about trade-offs, not correctness. A labeled property graph (Neo4j-style) treats edges as first-class objects with their own properties and is ergonomic for traversal-heavy applications. RDF triple stores use subject–predicate–object triples, follow W3C standards, and excel at linked-data interoperability — sharing facts across organizations and resolving to the public web. Choose property graphs for internal app logic and analytics; choose RDF when web-scale interoperability and standards compliance matter.",
  },
];

const graphBlocks: Block[] = [
  {
    kind: "p",
    text: "“Ontology,” “knowledge graph,” “context graph,” “information graph,” “vector database” — these terms get used interchangeably, and they are not interchangeable. Each is a different way to structure meaning, each answers a different question, and AI agents need different ones for different jobs. This guide pins down what each actually is, shows the **same dataset modeled six ways** so you can see the difference, and explains which layer matters for SEO, AEO, GEO, and agents.",
  },
  {
    kind: "callout",
    title: "The one-line version",
    text: "A **taxonomy** files things. An **ontology** defines what can exist. A **knowledge graph** records what's true. An **information graph** maps your content to that truth and to demand. A **context graph** decides what's relevant right now. A **vector index** finds what's similar. They stack — and agents use all of them.",
  },
  { kind: "h2", text: "See it: one domain, six structures", id: "see-it" },
  {
    kind: "p",
    text: "Everything below uses a single, deliberately small domain — a running-shoe retailer with a content site — so the structures are directly comparable. Watch how the **same information** changes shape depending on what you're trying to do with it. (Hover any node to trace its connections.)",
  },
  { kind: "stack" },
  {
    kind: "p",
    text: "That stack is the whole thesis: each layer builds on the one before it. The ontology gives the knowledge graph its grammar; the knowledge graph gives the information and context graphs their facts; the vector index sits alongside as a complementary, fuzzy retrieval substrate. Now let's define each one precisely.",
  },

  { kind: "h2", text: "1. Taxonomy — the filing system", id: "taxonomy" },
  { kind: "figure", viewId: "taxonomy" },
  { kind: "termcard", termSlug: "taxonomy" },

  { kind: "h2", text: "2. Ontology — the blueprint", id: "ontology" },
  { kind: "figure", viewId: "ontology" },
  { kind: "termcard", termSlug: "ontology" },
  {
    kind: "code",
    caption: "Building the ontology as a graphology graph — classes and the relationship types between them, with no instances yet.",
    code: `import Graph from "graphology";

// An ontology models *types*, not data.
const ontology = new Graph({ type: "directed" });

["Product", "Brand", "Category", "Activity", "Attribute"]
  .forEach((cls) => ontology.addNode(cls, { kind: "class" }));

// Allowed relationship TYPES between classes
ontology.addEdge("Product", "Brand",    { rel: "hasBrand" });
ontology.addEdge("Product", "Category", { rel: "belongsTo" });
ontology.addEdge("Product", "Activity", { rel: "suitedFor" });
ontology.addEdge("Product", "Attribute",{ rel: "hasAttribute" });

// A rule the data must obey
ontology.setNodeAttribute("Product", "constraint",
  "hasBrand exactly 1 Brand");`,
  },

  { kind: "h2", text: "3. Knowledge graph — the facts", id: "knowledge-graph" },
  { kind: "figure", viewId: "knowledge-graph" },
  { kind: "termcard", termSlug: "knowledge-graph" },
  {
    kind: "code",
    caption: "The same ontology, now populated with real instances — and traversed to answer a question.",
    code: `const kg = new Graph({ type: "directed" });

// Instances (the A-Box) that obey the ontology above
kg.addNode("pegasus", { type: "Product", label: "Nike Pegasus 41" });
kg.addNode("nike",    { type: "Brand",   label: "Nike" });
kg.addNode("road",    { type: "Activity", label: "Road Running" });

kg.addEdge("pegasus", "nike", { rel: "madeBy" });
kg.addEdge("pegasus", "road", { rel: "suitedFor" });
kg.addEdge("nike", "wikidata:Q483915", { rel: "sameAs" });

// Traversal answers a precise question, with a verifiable path:
// "What road-running shoes does Nike make?"
const nikesRoadShoes = kg.filterNodes((n, attr) =>
  attr.type === "Product" &&
  kg.outNeighbors(n).includes("nike") &&
  kg.outNeighbors(n).includes("road"));`,
  },

  { kind: "h2", text: "4. Information graph — your content map", id: "information-graph" },
  { kind: "figure", viewId: "information-graph" },
  { kind: "termcard", termSlug: "information-graph" },

  { kind: "h2", text: "5. Context graph — the decision layer", id: "context-graph" },
  { kind: "figure", viewId: "context-graph" },
  { kind: "termcard", termSlug: "context-graph" },

  { kind: "h2", text: "6. Vector / embedding index — the similarity space", id: "vector-index" },
  { kind: "figure", viewId: "vector-index" },
  { kind: "termcard", termSlug: "vector-index" },
  {
    kind: "code",
    caption: "The fundamental contrast: a graph traverses explicit edges; a vector index retrieves by distance. Same goal, opposite mechanics.",
    code: `// GRAPH: follow typed edges — exact, explainable, but rigid
kg.outNeighbors("pegasus");        // ["nike", "road", ...] — known facts

// VECTOR: rank by cosine similarity — fuzzy, forgiving, but opaque
const q = embed("cushioned shoes for my first marathon");
const hits = index
  .map((item) => ({ id: item.id, score: cosine(q, item.vector) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);   // [clifton 0.91, pegasus 0.88, bondi 0.85]
// Note: no edge says WHY they match — only that they're close.`,
  },

  { kind: "h2", text: "Side by side", id: "comparison" },
  {
    kind: "p",
    text: "The whole landscape in one table. Read it as a progression from “files things” to “decides what's relevant” — with the vector index as the parallel, fuzzy alternative to explicit edges.",
  },
  { kind: "comparison" },

  { kind: "h2", text: "Which one do you actually need?", id: "decision" },
  {
    kind: "decision",
    items: [
      { when: "You need clean navigation and categories", use: "Taxonomy — start here; it's the cheapest structure and the foundation for the rest." },
      { when: "You're integrating data across systems or want consistent meaning", use: "Ontology — define the shared vocabulary and rules first, even a lightweight one (schema.org)." },
      { when: "You want AI engines to understand your entities and cite your facts", use: "Knowledge graph — model entities and relationships, and link them out with sameAs." },
      { when: "You're planning content, internal linking, or AEO coverage", use: "Information graph — map pages → entities → queries and find the gaps." },
      { when: "You're optimizing for AI Overviews, personalization, or agents", use: "Context graph — layer intent, location, freshness, and trust to win the single best answer." },
      { when: "You need fast, fuzzy retrieval over lots of content (RAG)", use: "Vector index — for recall; pair it with a knowledge graph for precision and grounding." },
    ],
  },
  {
    kind: "callout",
    title: "The pattern that wins for agents",
    text: "Modern AI search isn't graph **or** vectors. The strongest agentic systems use a **vector index for recall** (find candidate content fast), a **knowledge graph for grounding** (verify facts and relationships), and a **context graph for relevance** (pick the right answer for the moment) — all sitting on an **ontology** that keeps meaning consistent. Build the layers; don't pick one.",
  },

  {
    kind: "related",
    items: [
      { label: "Knowledge Graphs for Enterprise SEO", href: "/insights/ai-agents-automation/knowledge-graphs-enterprise-seo" },
      { label: "Context Graphs: The Next Evolution of Search", href: "/insights/ai-agents-automation/context-graphs-next-evolution-search" },
      { label: "RAG vs Knowledge Graphs: When to Use What", href: "/insights/ai-ml-search-optimization/rag-vs-knowledge-graphs-when-to-use-what" },
      { label: "Structuring 5M Queries into a Knowledge Graph", href: "/insights/ai-ml-search-optimization/knowledge-graph-5-million-queries" },
    ],
  },

  { kind: "h2", text: "Frequently asked questions", id: "faq" },
  { kind: "faq" },
];

export const guides: Guide[] = [
  {
    slug: "graph-types-for-ai-agents",
    title: "Graph Types for AI Agents",
    metaTitle:
      "Ontology vs Knowledge Graph vs Context Graph vs Information Graph (2026 Guide)",
    metaDescription:
      "The definitive guide to graph types for AI agents: ontology, taxonomy, knowledge graph, information graph, context graph, and vector indexes — defined, compared, and visualized with one dataset modeled six ways.",
    headline: "Graph Types for AI Agents",
    deck:
      "Ontology, taxonomy, knowledge graph, information graph, context graph, vector index — what each one actually is, how they differ, and which layer matters for SEO, AEO, GEO, and agents. One dataset, six structures, visualized.",
    datePublished: "2026-06-17",
    dateModified: "2026-06-17",
    readingTime: "14 min read",
    tags: [
      "Knowledge Graphs",
      "Ontology",
      "Context Graph",
      "Vector Databases",
      "RAG",
      "AEO",
      "GEO",
      "AI Agents",
    ],
    terms: graphTerms,
    comparison: graphComparison,
    faqs: graphFaqs,
    blocks: graphBlocks,
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
