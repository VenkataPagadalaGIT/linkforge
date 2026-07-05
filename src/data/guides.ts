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

import {
  COMPONENTS,
  FAULTS,
  PATHS,
  SCENARIOS,
  SYMPTOMS,
  SEVERITY_META,
  componentById,
  faultsForPath,
  rankFaults,
  symptomById,
  type HvacPath,
} from "./hvac";

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
  | { kind: "graph3d" }
  | { kind: "faq" }
  /** Interactive 3D HVAC explorer + symptom-based diagnoser (lazy-loaded). */
  | { kind: "hvac" }
  /** Static, crawlable table of the full HVAC fault library. */
  | { kind: "hvacfaults" }
  /** Static, crawlable rendering of the guided scenario walkthroughs. */
  | { kind: "hvacscenarios" }
  /** The ontology's path-level segmentation: 5 system paths → components → faults. */
  | { kind: "hvacpaths" }
  /** External sources / further-reading links. */
  | { kind: "sources"; items: { label: string; href: string; note?: string }[] }
  | { kind: "details"; summary: string; blocks: Block[] };

export interface GuideAuthor {
  name: string;
  /** Job title — e.g., "AI Product Manager (Search · SEO · GEO)". */
  title: string;
  /** Affiliation — e.g., "AT&T". */
  org: string;
  /** Canonical author URL on this site — used in JSON-LD Person@id and the byline link. */
  url: string;
  /** One-line credibility statement; the AEO/GEO citation hook. */
  bio: string;
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  /** Optional eyebrow above the H1 — small caps, sets context. */
  kicker?: string;
  /** Optional subhead under the H1 — names what else the article covers so the
   *  visible scope matches the article body. Keeps the H1 short for SEO/CTR
   *  while still signaling completeness to expert readers. */
  subhead?: string;
  deck: string;
  /** Structured author block. Renders as a proper byline card; also feeds JSON-LD Person. */
  author?: GuideAuthor;
  datePublished: string;
  dateModified: string;
  readingTime: string;
  tags: string[];
  terms: DefinedTerm[];
  comparison: ComparisonRow[];
  faqs: FaqItem[];
  blocks: Block[];
  /** Label for the third TermCard row (defaults to "Role for AI agents"). */
  termRoleLabel?: string;
  /** Column headers for the comparison table (defaults to the graph-guide set). */
  comparisonHeaders?: string[];
  /** HowTo entries emitted as schema.org HowTo JSON-LD on the guide page. */
  howTos?: { name: string; description: string; steps: { name: string; text: string }[] }[];
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
      "Where a taxonomy only nests categories, an ontology defines the full grammar of a domain. It says a Product can have a Brand, belong to a Category, be suited for an Activity, and carry Attributes — and it can enforce rules such as “every Product must have exactly one Brand.” Schema.org is a widely-cited, web-scale vocabulary that functions as a lightweight ontology in practice. Formally, the ontology layer (the “T-Box” in Description Logic) defines classes, relationship types, and rules; instances live in the “A-Box.” OWL ontologies can include named individuals, but in practice we keep the two layers separate for clarity.",
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
      "A knowledge graph knows that both the Pegasus and the Clifton are road shoes. A context graph decides which one to surface for a beginner marathoner in Atlanta, on mobile, in winter, who wants maximum cushioning and an in-stock option with a fresh review. It re-weights the knowledge graph by situational signals and scores the best match. (Like “information graph,” *context graph* is an applied/industry framing rather than a formal CS category — useful precisely because it names the situational-relevance layer that nothing else does. Similarity scores below are illustrative.) This is the highest-value and newest layer — the one that powers personalization, AI Overviews, and agentic decisions.",
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
      "A vector index is the counterpart to a graph, not a kind of it. Instead of typed edges, it places everything as points in a high-dimensional space where closeness means semantic similarity. Production systems use approximate nearest-neighbor search (HNSW, IVF) to find the closest content in milliseconds. Most vector databases (Pinecone, Weaviate, Qdrant) also let you attach metadata for filtering — but the geometry itself carries no semantic relationships: it can't tell you *why* two things relate, can't guarantee a fact, and can't traverse a chain of reasoning. Leading agentic systems are increasingly pairing vector retrieval (recall) with a knowledge graph (precision and grounding) — a pattern Microsoft Research labeled **GraphRAG** in 2024.",
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
    limit: "Costly to build & maintain; rots without an ontology",
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
    q: "What is a knowledge graph, in plain English?",
    a: "A knowledge graph is a network of real-world things (entities like Nike, the Pegasus 41, Road Running) connected by labeled, directional relationships (`Nike Pegasus 41 → madeBy → Nike`). It's how Google's Knowledge Graph, Wikidata, and the answer layer of ChatGPT/Perplexity/Gemini *understand* that the words you typed refer to specific entities — and what those entities are connected to. Think “Wikipedia for machines, but with the connections made explicit and queryable.”",
  },
  {
    q: "What is the difference between a knowledge graph and a vector database?",
    a: "A knowledge graph stores **explicit relationships** between specific things — `Nike Pegasus 41 → madeBy → Nike`. You query it by traversing edges. A vector database stores **embeddings** — long lists of numbers representing each piece of content — and lets you find the most *similar* content to a query by distance in that number-space (typically using approximate nearest-neighbor search like HNSW). One is precise and explainable; the other is fuzzy and forgiving. They're not competitors — most modern AI systems use vectors for fast recall, then a knowledge graph to verify facts and explain *why*.",
  },
  {
    q: "What is GraphRAG and when should I use it?",
    a: "GraphRAG is the pattern of combining a vector index (for fast, fuzzy retrieval) with a knowledge graph (for grounded facts and explainability). The term was popularized by Microsoft Research's 2024 paper *“From Local to Global: A Graph RAG Approach to Query-Focused Summarization.”* Use plain (vector-only) RAG when you're answering open-ended questions over messy text and don't need provenance. Use GraphRAG when answers must be exact, auditable, multi-hop (`A → B → C`), or when you need to reason across an entire corpus rather than just retrieving similar chunks.",
  },
  {
    q: "When should I use a graph database, an ontology, or a knowledge graph?",
    a: "A **graph database** (Neo4j, Memgraph, TigerGraph, ArangoDB) is the storage engine — it holds nodes and edges efficiently. An **ontology** is the schema you load into (or alongside) it — the rules about what types of things can exist and how they can relate. A **knowledge graph** is the result: a graph database, structured by an ontology, populated with real instances and ideally linked to external entities via `sameAs`. You can have a graph DB without an ontology (and watch it rot), or an ontology with no data (a blueprint with no building). A real knowledge graph is all three working together.",
  },
  {
    q: "Is a knowledge graph the same as an ontology?",
    a: "No. An ontology is the schema — the classes, allowed relationships, and rules. A knowledge graph is that schema populated with real instances and facts. The ontology is the empty blueprint; the knowledge graph is the populated building. You can have an ontology with no data, but a well-built knowledge graph almost always relies on an ontology to keep its facts consistent as it grows.",
  },
  {
    q: "Knowledge graph vs vector database — which should I use for RAG?",
    a: "Usually both. A vector index gives you fast, fuzzy recall: it finds candidate content even when the wording doesn't match. A knowledge graph gives you precision and grounding: exact facts, explainable relationships, and the ability to traverse a chain of reasoning. Most production RAG today is vector-only, but combining vectors (retrieval) with a knowledge graph (verification + structure) — the pattern Microsoft Research dubbed **GraphRAG** in 2024 — is now standard in agentic systems where answers must be exact, auditable, or fact-checked. Use vectors alone for similarity search; add a graph when grounding matters.",
  },
  {
    q: "Is semantic search the same as a vector database?",
    a: "Semantic search is the *capability* — finding results by meaning rather than exact keywords. A vector database is one common *implementation* of it: embed every document, embed the query, return nearest neighbors. But semantic search can also be powered by a knowledge graph (using entity matches and typed relationships) or, more powerfully, by both together — vectors for fuzzy recall + a graph for entity grounding. Pure-vector semantic search is fast and forgiving but blind to facts. Add a knowledge graph and you get explainable, fact-checked answers — the AEO/GEO ceiling.",
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
    a: "Both are valid ways to build a knowledge graph, and the choice is about trade-offs, not correctness. A labeled property graph (Neo4j-style) treats edges as first-class objects with their own properties and is ergonomic for traversal-heavy applications. RDF triple stores use subject–predicate–object triples, follow W3C standards (RDF 1.1, SPARQL 1.1, OWL 2), and excel at linked-data interoperability — sharing facts across organizations and resolving to the public web. Choose property graphs for internal app logic and analytics; choose RDF when web-scale interoperability and standards compliance matter.",
  },
  {
    q: "Knowledge graph vs relational database — when do I need one over the other?",
    a: "Use a relational database (Postgres, MySQL) when your data fits clean tables, your queries are well-known up front, and you mostly aggregate within a single domain (orders, users, inventory). Use a knowledge graph when relationships are first-class (you frequently ask *who is connected to what, how many hops away?*), when entities span domains and need to resolve to the wider web, or when downstream systems — including LLMs — need to reason over the connections, not just join them. Many production stacks use both: the relational DB is the system of record, and a knowledge graph projects the relationships AI systems and answer engines actually consume.",
  },
  {
    q: "How do I actually build a knowledge graph?",
    a: "Five steps, in order: (1) define a lightweight **ontology** — even just schema.org types you'll reuse; (2) **extract entities and relationships** from your source data (LLMs are very good at this now; tools like LangChain's LLMGraphTransformer or Microsoft's GraphRAG pipeline automate it); (3) **resolve entities** to canonical IDs (Wikidata QIDs, your internal product IDs) so duplicates collapse; (4) **store** in a graph database (Neo4j, Memgraph, Neptune) or RDF triple store (Apache Jena, Stardog, GraphDB); (5) **publish the high-leverage subset** as JSON-LD on your pages so search and answer engines can read it directly. Start small, link out via `sameAs`, and let the ontology evolve.",
  },
];

const graphBlocks: Block[] = [
  {
    kind: "p",
    text: "“Ontology,” “knowledge graph,” “context graph,” “information graph,” “vector database” — these terms get used interchangeably, and they are not interchangeable. Each is a different way to structure meaning, each answers a different question, and AI agents need different ones for different jobs. This guide pins down what each actually is, shows the **same dataset modeled six ways** so you can see the difference, and explains which layer matters for **RAG, GraphRAG, semantic search, AEO and GEO**.",
  },
  {
    kind: "callout",
    title: "The one-line version",
    text: "A **taxonomy** files things. An **ontology** defines what can exist. A **knowledge graph** records what's true. An **information graph** maps your content to that truth and to demand. A **context graph** decides what's relevant right now. A **vector index / vector database** finds what's similar. They stack — and modern AI agents use all of them.",
  },
  {
    kind: "details",
    summary: "New to this? Read the plain-English on-ramp",
    blocks: [
      {
        kind: "p",
        text: "If you've used a spreadsheet (rows and columns) and a folder tree on your computer (nested folders), you already understand two of the six structures. Here's the same idea for the other four, in the bluntest words possible:",
      },
      {
        kind: "list",
        items: [
          "**Taxonomy = a folder tree.** “Footwear → Running → Road → Nike Pegasus 41.” One parent each. Great for navigation; terrible at expressing *“who made this”* or *“what's this for.”*",
          "**Ontology = the schema / rulebook.** Lists what types of things can exist (Product, Brand, Activity), how they're allowed to relate (`Product hasBrand Brand`), and what's not allowed. No actual data yet — just the empty form, like a spreadsheet's column headers before any rows are filled in.",
          "**Knowledge graph = the rulebook filled in with real things, then linked to the rest of the web.** “Nike Pegasus 41 — madeBy → Nike — sameAs → Wikidata's Nike.” This is what Google, Bing, ChatGPT and Perplexity reason over when they answer factual questions.",
          "**Information graph = your content map.** “The page `/guides/road-shoes` mentions Pegasus 41 and targets the query *best road running shoes*.” It's the SEO/AEO layer that connects your URLs to entities and to demand.",
          "**Context graph = the personalization layer.** Same knowledge graph + who's asking + when + where + what's fresh and trusted. It decides *which* of two correct answers to surface for *this* person right now.",
          "**Vector index / vector database = similarity by vibes.** Every piece of content is turned into a list of ~1,500 numbers (an embedding). Search means finding the lists most similar to your query's list. No `WHERE clauses`, no edges — just *nearness in meaning-space*. Pinecone, Weaviate, Qdrant, and pgvector all do this. It's how RAG retrieves candidate text fast.",
        ],
      },
    ],
  },
  {
    kind: "callout",
    title: "If you only remember one thing",
    text: "**Graphs = explicit truth. Vectors = fuzzy similarity.** Modern AI systems use both — vectors to find candidate content (recall) and a knowledge graph to verify the facts (precision). The combined pattern has a name: **GraphRAG** (Microsoft Research, 2024).",
  },
  { kind: "h2", text: "See it: one domain, six structures", id: "see-it" },
  {
    kind: "p",
    text: "Everything below uses a single, deliberately small domain — a running-shoe retailer with a content site — so the structures are directly comparable. Watch how the **same information** changes shape depending on what you're trying to do with it. (Hover any node to trace its connections — and hit **Explore in 3D** on any figure to orbit it in space.)",
  },
  {
    kind: "p",
    text: "**Read the stack from the bottom up.** Each layer is enabled by the one beneath it; the numbers (01–06) match the six sections that follow. The vector index sits to the side because it runs in parallel — different math, same dataset.",
  },
  { kind: "stack" },
  {
    kind: "p",
    text: "Each layer rests on the one below: the ontology gives the knowledge graph its grammar, the knowledge graph gives the information and context graphs their facts, and the vector index runs alongside as a parallel, schema-free retrieval substrate. Production AI agents query multiple layers per request — not one. Now let's define each one precisely.",
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

  { kind: "h2", text: "3. Knowledge Graph — the facts", id: "knowledge-graph" },
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

// External entity — declared before the sameAs edge can reference it.
kg.addNode("wikidata:Q483915", { type: "External", label: "Wikidata: Nike" });

kg.addEdge("pegasus", "nike", { rel: "madeBy" });
kg.addEdge("pegasus", "road", { rel: "suitedFor" });
kg.addEdge("nike", "wikidata:Q483915", { rel: "sameAs" });

// Traversal answers a precise question, with a verifiable path:
// "What road-running shoes does Nike make?"
const nikesRoadShoes = kg.filterNodes((n, attr) =>
  attr.type === "Product" &&
  kg.outNeighbors(n).includes("nike") &&
  kg.outNeighbors(n).includes("road"));
// → ["pegasus"]   // grounded answer, with the edges that proved it.`,
  },

  { kind: "h2", text: "4. Information Graph — your content map", id: "information-graph" },
  { kind: "figure", viewId: "information-graph" },
  { kind: "termcard", termSlug: "information-graph" },

  { kind: "h2", text: "5. Context Graph — the decision layer", id: "context-graph" },
  { kind: "figure", viewId: "context-graph" },
  { kind: "termcard", termSlug: "context-graph" },

  { kind: "h2", text: "6. Vector / Embedding Index — the similarity space", id: "vector-index" },
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

  { kind: "h2", text: "Six structures side by side: the comparison table", id: "comparison" },
  {
    kind: "p",
    text: "The whole landscape in one table. Read it as a progression from “files things” to “decides what's relevant” — with the vector index as the parallel, fuzzy alternative to explicit edges.",
  },
  { kind: "comparison" },

  { kind: "h2", text: "When to use a knowledge graph vs vector database vs ontology", id: "decision" },
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

  { kind: "h2", text: "Primary sources & further reading", id: "sources" },
  {
    kind: "p",
    text: "If you want to go deeper than this guide — or verify any claim above — these are the canonical references.",
  },
  {
    kind: "list",
    items: [
      "**[Gruber, T. (1993)](https://tomgruber.org/writing/ontolingua-kaj-1993.htm).** *A Translation Approach to Portable Ontology Specifications* — the paper that gave us the now-canonical definition: an ontology is a “formal, explicit specification of a shared conceptualization.”",
      "**[W3C OWL 2 Web Ontology Language](https://www.w3.org/TR/owl2-overview/)** — the formal standard for ontologies on the web (T-Box / A-Box, classes, properties, individuals, axioms).",
      "**[W3C RDF 1.1](https://www.w3.org/TR/rdf11-concepts/)** and **[SPARQL 1.1](https://www.w3.org/TR/sparql11-query/)** — the standards behind RDF triple stores and the query language used to traverse them.",
      "**[schema.org](https://schema.org/) (2011–present)** — the practical, web-scale vocabulary jointly stewarded by Google, Microsoft, Yahoo, and Yandex; the easiest entry point to publishing structured data.",
      "**[Singhal, A. (2012)](https://blog.google/products/search/introducing-knowledge-graph-things-not/). *Introducing the Knowledge Graph: things, not strings* (Google blog)** — the post that mainstreamed the term “knowledge graph.”",
      "**[Wikidata](https://www.wikidata.org/) (2012–present)** and **[Google's Knowledge Graph API](https://developers.google.com/knowledge-graph)** — the two reference graphs your entities should resolve to via `sameAs`.",
      "**[Lewis et al. (2020)](https://arxiv.org/abs/2005.11401). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*** — the original RAG paper.",
      "**[Edge et al. (Microsoft Research, 2024)](https://arxiv.org/abs/2404.16130). *From Local to Global: A Graph RAG Approach to Query-Focused Summarization*** — coined the GraphRAG pattern (vectors + KG) referenced above.",
      "**[Malkov & Yashunin (2018)](https://arxiv.org/abs/1603.09320). *Efficient and robust approximate nearest neighbor search using HNSW graphs*** — the algorithm behind most modern vector databases.",
      "**[Hogan et al. (2021)](https://arxiv.org/abs/2003.02320). *Knowledge Graphs*** — comprehensive academic survey (ACM Computing Surveys), if you want the rigorous version of this guide.",
    ],
  },

  { kind: "h2", text: "Frequently asked questions", id: "faq" },
  { kind: "faq" },
];

/* ====================================================================== *
 *  GUIDE 2 — Interactive 3D HVAC Troubleshooting
 *  (fault ontology lives in ./hvac.ts; blocks below are partly generated
 *  from it so the page, the 3D widget, and the noscript fallback never
 *  drift apart)
 * ====================================================================== */

const hvacTerms: DefinedTerm[] = [
  {
    slug: "thermostat",
    term: "Thermostat",
    aka: ["Control", "Stat"],
    oneLiner:
      "The thermostat is the system's decision-maker: it measures room temperature against your set point and switches heating, cooling, and the fan on and off.",
    inDepth:
      "Everything downstream — furnace, blower, outdoor unit — only runs when the thermostat closes a 24-volt circuit asking for it. That low-voltage chain also runs through safety devices like the condensate float switch and the furnace door switch, which is why a full pan or an ajar panel can make a healthy system play dead. Because it sits at the top of the chain, the thermostat is always the first suspect when nothing runs at all.",
    analogy:
      "A referee with a whistle. The players (furnace, AC, blower) are fine — but nobody moves until the whistle blows, and a referee with a dead whistle looks exactly like a team that can't play.",
    example:
      "A system 'dead' in July: the screen is blank because two AA batteries died. Batteries, five minutes, zero dollars — versus the $150 service call that discovers the same thing.",
    agentRole:
      "Dead batteries, mode left on HEAT in summer, schedule holds overriding the set point, loose low-voltage wires, or a tripped float switch upstream interrupting the same circuit.",
  },
  {
    slug: "air-filter",
    term: "Air Filter",
    oneLiner:
      "A disposable mesh that strains dust from return air before it reaches the blower and coil — and the single most common cause of HVAC problems when neglected.",
    inDepth:
      "Every cubic foot of air the system moves passes through this one rectangle. As it loads up, airflow drops; the evaporator coil runs colder and colder until it ices into a solid block in summer, and the furnace overheats and trips its limit switch in winter. A huge share of 'my AC died' service calls end at a $10 filter. Size and thickness are printed on the frame; 1-inch filters want changing every 1–3 months.",
    analogy:
      "A coffee filter for your house's lungs. Ignore it long enough and you're trying to breathe through a wet paper towel.",
    example:
      "Weak airflow + ice on the copper lines + a filter you can't see light through = case closed. Replace, thaw with fan-only for a few hours, done.",
    agentRole:
      "Clogging (weak airflow, iced coil, tripped furnace limit, rising bills). Also being installed backwards or missing entirely, which fouls the blower and coil instead.",
  },
  {
    slug: "blower",
    term: "Blower Motor & Wheel",
    aka: ["Air handler fan", "Squirrel cage"],
    oneLiner:
      "The motor-driven wheel inside the indoor unit that actually moves air — pulling it through the return and filter, pushing it across the coil or heat exchanger and out to the rooms.",
    inDepth:
      "Cooling and heating both depend on it: refrigerant can make the coil cold and burners can make the exchanger hot, but nothing reaches your rooms without the blower. Modern variable-speed (ECM) blowers are efficient but their control modules are the expensive way they fail. Years of running against a dirty filter is what wears blowers out early.",
    analogy: "The system's lungs. The rest of the equipment decides the temperature; the blower decides whether any of it reaches you.",
    example:
      "Thermostat calling, outdoor unit humming along, and total silence at every vent — that's a blower problem, and the iced-over coil that follows is the collateral damage.",
    agentRole:
      "Worn bearings (screech/grind at startup), overheated windings or a dead ECM module (hum, no spin, hot electrical smell), and slow death from chronic filter neglect.",
  },
  {
    slug: "evaporator-coil",
    term: "Evaporator Coil",
    aka: ["A-coil", "Indoor coil"],
    oneLiner:
      "The A-shaped coil above the furnace where cold refrigerant absorbs heat and moisture from indoor air — the place cooling actually happens.",
    inDepth:
      "Refrigerant boils inside this coil at around 40°F, soaking up heat from the air the blower pushes across it. The moisture that condenses on its fins is why AC also dehumidifies — and why there's a drain pan under it. The coil lives at the intersection of the system's two flows, so it's where problems from either side show up: starve it of airflow or of refrigerant and it ices; let it get filthy and capacity quietly evaporates.",
    analogy:
      "A glass of iced tea on a humid porch. Warm air touches the cold surface, gives up its heat, and leaves its moisture beading on the outside.",
    example:
      "House won't get below 78 on a 95° day, lines frosted: coil starved into icing — by a dirty filter three times out of four, by a refrigerant leak the rest.",
    agentRole:
      "Icing (from low airflow or low charge), dirt matting the fins (slow capacity loss, musty smell), and formicary corrosion pinholes that leak refrigerant — the classic reason older systems 'need a top-off' every spring.",
  },
  {
    slug: "refrigerant-circuit",
    term: "Refrigerant Circuit",
    aka: ["Line set", "Charge", "Freon loop"],
    oneLiner:
      "The sealed copper loop — coil, compressor, condenser, metering device, and two connecting lines — that moves heat from inside your house to outside it.",
    inDepth:
      "Refrigerant is not fuel and is never consumed; the same charge should circulate for the system's whole life. The fat insulated line carries cool vapor to the compressor, the thin line returns high-pressure liquid, and the TXV meters it into the coil. 'Low on refrigerant' therefore always means 'has a leak.' Running undercharged drops coil temperature (ice), tanks efficiency, and slowly destroys the compressor — which is why the recharge-every-summer routine is the most expensive cheap fix in HVAC.",
    analogy:
      "A conveyor belt for heat. Buckets (refrigerant) get filled indoors and dumped outdoors, around and around. Buckets don't get used up — if there are fewer buckets this year, some fell off, and topping up without fixing the hole just schedules the next failure.",
    example:
      "Cooling that fades over three weeks, oil staining a flare fitting, frost creeping up the suction line: a slow leak, not a thirsty system.",
    agentRole:
      "Leaks at coil corrosion pinholes and line fittings (oil stains are the tell), a sticking TXV starving or flooding the coil, and chronic undercharge quietly cooking the compressor.",
  },
  {
    slug: "compressor",
    term: "Compressor",
    oneLiner:
      "The pump at the heart of the refrigerant loop: it squeezes low-pressure vapor into hot, high-pressure vapor so the heat collected indoors can be dumped outdoors.",
    inDepth:
      "The compressor is the hardest-working and most expensive component in the system — and it almost never fails first. It fails last, murdered slowly by everything else: low charge (poor cooling of its own windings), a matted condenser (chronic overheating), or a weak capacitor (brutal hard starts). That's why a good technician treats a dead compressor as the end of a story and looks for the chapters before it.",
    analogy:
      "The heart of the system. And like a heart, it rarely just stops — years of high blood pressure (head pressure) and strain do it in, and by then a transplant costs more than the patient may be worth.",
    example:
      "A 14-year-old condenser hums for two seconds, dims the lights, and trips the breaker. Winding test confirms a shorted compressor: the $1,800 quote versus a $5,500 new system is now a math problem, not a repair problem.",
    agentRole:
      "Hard starting and overload trips (often really a capacitor), seized or shorted windings at end of life, and slugging damage from a flooding TXV. Its failure is usually the bill for a cheaper problem ignored.",
  },
  {
    slug: "condenser-unit",
    term: "Condenser (Coil + Fan)",
    aka: ["Outdoor unit", "Condensing unit"],
    oneLiner:
      "The outdoor unit's coil and top fan, which together throw the heat collected from your house into the outdoor air.",
    inDepth:
      "Hot refrigerant vapor condenses back to liquid inside this coil, releasing its heat to outdoor air that the fan pulls through the fins. Its enemies are mundane: grass clippings, cottonwood fluff, dirt, and shrubs planted too close. A blocked coil raises head pressure, which cuts capacity, raises bills, and on the hottest days trips the unit off entirely — the reason so many failures happen exactly when you need cooling most.",
    analogy:
      "Your car's radiator. Same job, same failure: it doesn't break so much as clog, and the engine (compressor) pays the price for it.",
    example:
      "AC 'can't keep up' every July afternoon. The fins are a felt blanket of cottonwood. One gentle hose-out from the inside, capacity returns like a software update.",
    agentRole:
      "Fin blockage and bent fins (heat can't leave), fan motor bearings seizing (unit cooks itself in minutes), and coil damage from string trimmers and dogs.",
  },
  {
    slug: "capacitor-contactor",
    term: "Capacitor & Contactor",
    aka: ["Run cap", "Relay"],
    oneLiner:
      "The outdoor unit's two small electrical parts: the capacitor gives its motors the jolt to start spinning, and the contactor is the relay that feeds the unit power at all.",
    inDepth:
      "Between them, these two $20–$45 parts explain the majority of outdoor-unit failures. Capacitors dry out with heat and age — the compressor and fan then hum without starting. Contactor points arc on every cycle until they burn (no power) or weld (unit never shuts off). Both are quick pro fixes; the capacitor is also genuinely hazardous DIY, because it stores a charge after the power is off.",
    analogy:
      "The starter motor and ignition switch of a car. When either fails, the engine is perfectly fine — it just cranks and clicks, or gets no juice at all.",
    example:
      "Outdoor unit hums, clicks off, hums again; fan starts when nudged with a stick through the grille. Textbook failed capacitor — a $200 visit, not a $2,000 one.",
    agentRole:
      "Capacitor bulge/leak (hum, no start — the #1 AC repair in the country), burned contactor points (dead unit), welded points (unit runs with the thermostat off).",
  },
  {
    slug: "condensate-drain",
    term: "Condensate Pan & Drain",
    oneLiner:
      "The pan and pipe that carry away the gallons of water your AC wrings out of the air daily — with a float switch that shuts the system down if they back up.",
    inDepth:
      "A central AC can pull 5–20 gallons of water out of humid air per day, all of which must drain through one narrow, algae-prone line. When it clogs, either water overflows (the mystery ceiling stain under an attic unit) or the float switch cuts the whole system dead. That switch interrupts the same 24-volt circuit as the thermostat — which is why a clogged drain perfectly impersonates a dead system.",
    analogy:
      "A gutter and downspout for your air. Nobody thinks about it until it clogs, and then the damage happens somewhere that looks unrelated.",
    example:
      "AC quits on the most humid week of the year, no error anywhere. Pan full, float switch tripped. A wet/dry vac on the outdoor drain stub pulls out a plug of algae; system returns from the dead.",
    agentRole:
      "Algae clogs (overflow or float-switch shutdown), cracked or rusted pans on older units, and pump failures where gravity drainage isn't possible.",
  },
  {
    slug: "heat-exchanger",
    term: "Burners & Heat Exchanger",
    oneLiner:
      "The furnace's core: gas burners heat a sealed metal passage, air heats up passing over its outside, and combustion gases stay separated from the air you breathe.",
    inDepth:
      "That separation is the entire safety design of a gas furnace. The exchanger flexes with every heat cycle for 15–25 years until metal fatigue cracks it — at which point combustion byproducts, including carbon monoxide, can mix into supply air. This is the one fault on this page that is about life safety rather than comfort, and the reason a CO detector belongs near every furnace and bedroom. It's also, unfortunately, a classic pressure-sales diagnosis — always ask to see camera evidence of the crack.",
    analogy:
      "A campfire behind glass. You want the warmth radiating through; you absolutely do not want a crack in the glass letting smoke into the room.",
    example:
      "A 20-year-old furnace, a CO alarm at 2 a.m., and a flame that flutters when the blower kicks on: shut it down, ventilate, and get eyes on the exchanger before it runs again.",
    agentRole:
      "Fatigue cracks (CO risk — shut down now), overheating from airflow neglect accelerating that fatigue, and on the ignition side: dirty flame sensors and cracked igniters causing no-heat lockouts.",
  },
];

const hvacComparison: ComparisonRow[] = [
  {
    type: "Split system (AC + furnace)",
    isA: "The system modeled on this page: outdoor condenser, indoor gas furnace with coil on top",
    answers: "Gas burns for heat; refrigerant loop cools",
    structure: "Outdoor unit + indoor cabinet joined by two refrigerant lines and ducts",
    example: "Most existing US single-family homes",
    bestFor: "Cold-winter regions with gas service; cheapest to repair",
    limit: "Two fuel bills; ducts leak 20–30% in typical homes",
  },
  {
    type: "Air-source heat pump",
    isA: "A split system whose refrigerant loop runs both directions",
    answers: "One refrigerant loop both heats and cools",
    structure: "Same layout as a split, plus a reversing valve; often electric backup strips",
    example: "The default in new builds and electrification retrofits",
    bestFor: "Mild-to-cold climates (modern units work below 0°F); one all-electric bill",
    limit: "Backup heat strips can spike bills if sized or set up wrong",
  },
  {
    type: "Ductless mini-split",
    isA: "Small outdoor unit feeding wall-mounted indoor heads, no ducts",
    answers: "Heat-pump loop, one head per zone",
    structure: "1 outdoor unit → 1–5 indoor heads through a 3\" wall sleeve",
    example: "Additions, garages, old houses without ducts",
    bestFor: "Room-by-room control; no duct losses at all",
    limit: "A head on the wall in every room; filters in each head to clean",
  },
  {
    type: "Packaged unit",
    isA: "Everything — coil, compressor, furnace/heat pump, blower — in one outdoor box",
    answers: "Same cycles, single self-contained cabinet",
    structure: "One rooftop or slab unit with supply and return ducts entering the building",
    example: "Homes without basements/attics; most small commercial rooftops",
    bestFor: "Tight indoor space; simple single-cabinet service",
    limit: "All components live outdoors in the weather; shorter lifespans",
  },
  {
    type: "Boiler + radiators",
    isA: "Hydronic heat: a boiler circulates hot water, not air",
    answers: "Water carries the heat; no cooling included",
    structure: "Boiler → pipes → radiators or in-floor loops; separate AC if you want cooling",
    example: "Pre-war housing stock, much of the Northeast",
    bestFor: "Even, quiet, dust-free heat",
    limit: "No cooling or filtration; adding AC means a parallel system",
  },
];

const hvacFaqs: FaqItem[] = [
  {
    q: "Why is my AC running but not cooling the house?",
    a: "Work outside-in. First: is the outdoor unit actually running? If it's silent while the indoor blower runs, suspect its capacitor, contactor, breaker, or a tripped float switch. If it is running, check the air filter (the most common cause), then look for ice on the refrigerant lines and a dirt-matted outdoor coil. A clean filter, a clean coil, and no ice — but still weak cooling — points to low refrigerant from a leak, which is a pro repair. The 3D diagnoser above walks this exact sequence.",
  },
  {
    q: "Why is there ice on my AC lines, and what should I do?",
    a: "Ice means the evaporator coil is running below freezing, which happens for exactly two reasons: not enough warm air moving across it (dirty filter, failing blower, blocked vents) or not enough refrigerant in it (a leak). Turn cooling off, run the fan only for 2–4 hours to thaw, and replace the filter. If ice comes back with a clean filter and strong airflow, stop — continuing to run it can flood-damage the compressor. That recurrence pattern means a refrigerant leak or TXV problem, both licensed-pro work.",
  },
  {
    q: "Why does my AC turn on and off every few minutes?",
    a: "Short cycling has three common families of cause. Airflow/ice: a clogged filter freezes the coil and the system trips off repeatedly. Heat rejection: a dirty condenser coil or dead condenser fan spikes pressure until the compressor cuts out on overload — the outdoor unit will feel very hot. Control: a thermostat mounted over a lamp or supply register, or an oversized system that blasts the room and quits before doing real dehumidification. Filter and condenser coil are the two you can check yourself in ten minutes.",
  },
  {
    q: "Why is my outdoor AC unit humming but not starting?",
    a: "That hum is almost always a motor trying to start without its run capacitor — the single most-replaced part in residential AC. The classic confirmation: if the fan spins up when nudged with a stick through the top grille, the capacitor is dead. It's a cheap, fast professional fix ($150–$400). It is not a good DIY job: capacitors store a lethal charge after power is off. Left unfixed, every failed start beats on the compressor, converting a $200 repair into a $2,000 one.",
  },
  {
    q: "Why is my furnace blowing cold air?",
    a: "If the burners never light: on most modern furnaces that's a cracked hot-surface igniter or a board in lockout after failed attempts. If they light and die seconds later: a dirty flame sensor — the most common furnace no-heat cause, fixed by cleaning a single rod. If burners run but air still comes out cool, the blower may be moving air while a tripped limit switch (usually from a clogged filter) keeps shutting the burners down. And check the thermostat fan setting: FAN ON circulates unheated air between cycles, which feels cold and is harmless.",
  },
  {
    q: "How often should I really change my HVAC filter?",
    a: "1-inch filters: every 1–3 months. 4–5-inch media filters: every 6–12 months. Sooner with pets, smokers, nearby construction, or wildfire smoke. The test that beats any schedule: hold it up to a light — if light doesn't pass through, air isn't either. A dirty filter is implicated in more HVAC failures than any other single cause: frozen coils in summer, limit-switch trips in winter, and early blower death year-round. It's a $10 part protecting a $10,000 system.",
  },
  {
    q: "Which HVAC repairs are safe to DIY, and which aren't?",
    a: "Safe and worthwhile: filters, thermostat batteries and settings, one-time breaker resets, rinsing the outdoor coil (power off first), clearing the condensate drain with a wet/dry vac, and keeping 2 feet of clearance around the outdoor unit. Leave to licensed pros: anything refrigerant (federal EPA 608 rules, plus you can't diagnose charge without gauges), capacitors and other high-voltage parts (stored charge), gas-side work, and combustion diagnostics. The dividing line is simple: air and low-voltage settings are yours; refrigerant, gas, and line voltage are not.",
  },
  {
    q: "When does emergency heat kick in on a heat pump — and when should I worry?",
    a: "Three triggers: (1) droop — the room falls about 1.5–2°F below your set point and the thermostat stages the electric strips in to help; (2) outdoor temperature below the balance point (typically 25–40°F), where the heat pump alone can't carry the house; (3) defrost cycles, which briefly energize strips so vents don't blow cold — a steam plume outside plus a few minutes of AUX is healthy. Worry when: AUX or EM HEAT shows on a mild 45°F+ day, when it runs constantly rather than in bursts, or when a winter electric bill lands 3–5x normal with a perfectly warm house — that's a lying sensor, a failed board, a welded sequencer, or aggressive setback schedules triggering strips every morning. Set your aux lockout at 35–40°F and use gradual recovery, and the strips can only rob you during real cold snaps.",
  },
  {
    q: "Repair or replace? How long should AC units and furnaces last?",
    a: "Typical lifespans: central AC and heat pumps 12–17 years, gas furnaces 15–25. Two useful rules. The $5,000 rule: multiply the repair quote by the unit's age — over ~$5,000 (a $600 repair on a 10-year-old unit), lean replace. And any single repair over about a third of replacement cost on a unit past 12 years — especially a compressor or heat exchanger — is money better put toward new equipment, which will also cut energy use substantially. Cheap fixes (capacitors, contactors, sensors, drains) are always worth doing at any age.",
  },
];

/** Symptom → ranked causes, generated straight from the fault ontology. */
const hvacDecision: { when: string; use: string }[] = SYMPTOMS.map((s) => {
  const top = rankFaults([s.id]).slice(0, 3);
  const [first, ...rest] = top.map((r) => r.fault.name);
  return {
    when: s.label,
    use: `**${first}** is the most common cause${rest.length ? `; also check: ${rest.join(", ")}` : ""}.`,
  };
});

const hvacBlocks: Block[] = [
  {
    kind: "p",
    text: `Most HVAC guides are a wall of text about parts you've never seen. This one is different: below is a **full 3D model of a residential split system** — gas furnace, evaporator coil, ductwork, refrigerant lines, outdoor condenser — that you can orbit, explode, and click. Behind it sits a fault ontology: ${COMPONENTS.length} components, ${SYMPTOMS.length} symptoms, and ${FAULTS.length} faults connected by cause-and-effect edges, segmented into the five system paths every failure lives on. Tell it what you're seeing, and it ranks what's actually wrong, what to check first, and what a fix typically costs.`,
  },
  {
    kind: "callout",
    title: "Before anything else",
    text: "Two checks resolve an outsized share of 'broken' systems: a **clogged air filter** (the #1 cause of HVAC problems) and an interrupted control circuit — **dead thermostat batteries, a tripped breaker, or a full condensate pan tripping its float switch**. Ten minutes, zero dollars, no tools.",
  },

  { kind: "h2", text: "Explore the system in 3D", id: "model" },
  {
    kind: "p",
    text: "Drag to orbit, scroll to zoom. **Explore mode**: click any part to see what it does and how it fails. **Diagnose mode**: pick the symptoms you're seeing and suspect parts glow amber while ranked causes appear on the right. Toggle **Running** to watch the refrigerant loop and fans, and **Exploded** to pull the system apart.",
  },
  { kind: "hvac" },

  { kind: "h2", text: "How a central HVAC system actually works", id: "how-it-works" },
  {
    kind: "p",
    text: "Cooling is a loop that moves heat, not a machine that 'makes cold.' Indoors, the blower pulls room air through the filter and pushes it across the **evaporator coil**, where refrigerant boiling at ~40°F absorbs the air's heat and moisture. The **compressor** squeezes that vapor hot and dense and sends it to the outdoor **condenser coil**, where the fan dumps the heat into outside air. The refrigerant condenses back to liquid, returns indoors through the thin copper line, and the **TXV** meters it into the coil to start again. Around and around, moving heat from where you don't want it to where you don't care.",
  },
  {
    kind: "p",
    text: "Heating (in the gas-furnace system modeled here) skips the refrigerant entirely: the igniter lights the **burners**, flames heat the sealed **heat exchanger**, and the same blower pushes air over its hot surface — combustion gases and breathing air never mixing. That one-sentence safety contract is why a cracked heat exchanger is the only fault on this page that's about life safety instead of comfort.",
  },
  {
    kind: "callout",
    title: "The one-line version",
    text: "The **thermostat** asks. The **blower** moves air. The **refrigerant loop** moves heat out (cooling); the **burners and heat exchanger** add heat in (heating). Everything else on this page — filter, capacitor, contactor, drains, ducts — exists to keep those four jobs running, and is where most failures actually live.",
  },

  { kind: "h2", text: "The numbers: droop, balance point, and when emergency heat kicks in", id: "numbers" },
  {
    kind: "p",
    text: "Heat-pump owners live or die by three numbers nobody explains. **Droop**: a staging thermostat calls for the next stage when the room falls ~1.5–2°F below the set point — backup strips don't wait for 'cold,' they wait for that gap. **Balance point**: the outdoor temperature (typically 25–40°F, set per house) below which the heat pump alone can no longer keep up. **Aux lockout**: the setting that forbids strips above a chosen outdoor temperature — the single best defense against silent 3–5x bills.",
  },
  {
    kind: "list",
    items: [
      "**Set 70°F, outdoor 45°F:** the heat pump cycles normally (10–20 min runs). AUX showing on the thermostat in this weather is the red flag — see the stuck-aux fault.",
      "**Set 70°F, outdoor 20°F:** below most balance points. The compressor runs almost continuously — that's normal, not a fault. If the house HOLDS 70°F, strips stay off and the bill survives. If the room sags to ~68°F (the 2°F droop), AUX stages in until it recovers, in bursts. Bursts are fine; constant AUX is money burning.",
      "**Set 60°F, outdoor 20°F:** a lower set point means less load — the heat pump usually carries this alone, and aux should engage only briefly during defrost cycles. If AUX runs constantly holding 60°F, something is lying (sensor, board, or staging).",
      "**Setback recovery (60°F → 70°F at 6am):** asking for a >2°F jump exceeds droop instantly, so a basic thermostat slams the strips on every morning — the classic self-inflicted aux bill. Use gradual 'smart recovery,' or keep setbacks small on heat pumps.",
      "**During defrost (every 30–90 min below ~40°F outdoor):** the system briefly runs in cooling to melt the outdoor coil and energizes strips so the vents don't blow cold. A few minutes of AUX + a steam plume outside = healthy, not broken.",
    ],
  },
  {
    kind: "callout",
    title: "Numbers worth memorizing",
    text: "Droop before staging: **1.5–2°F**. Balance point: **25–40°F** outdoor. Aux lockout: set it **≥35–40°F**. Supply air: heat pump alone **90–100°F**, strips engaged **105–125°F** (the hand-on-the-register test). Defrost: **30–90 min** cycles below 40°F. Healthy cool/heat cycle: **10–20 minutes** — under 5 is short cycling.",
  },

  { kind: "h2", text: "The pressure test: what the gauges tell a tech", id: "pressure-test" },
  {
    kind: "p",
    text: "When a technician clips **manifold gauges onto the service valves' Schrader ports** (the two capped brass valves where the copper lines enter the outdoor unit — modeled above), the refrigerant loop finally talks. Typical healthy R-410A numbers while cooling on a ~90°F day: **suction ~115–140 psi** (a coil boiling around 40°F) and **liquid ~350–420 psi**, with **superheat ~8–15°F** and **subcooling ~8–12°F**. Those four numbers separate diagnoses that feel identical from the couch:",
  },
  {
    kind: "list",
    items: [
      "**Low suction + low head + low subcool** → undercharged: there's a leak. Demand the leak search, not a top-off.",
      "**Low suction + normal head + high superheat** → the coil is starved, not empty: metering device (TXV) or a plugged filter-drier — this is the misdiagnosis triangle where 'needs freon' wastes money.",
      "**High head + high subcool** → overcharged or the condenser can't reject heat (matted coil, dead fan).",
      "**Both sides equalized while the compressor 'runs'** → the compressor isn't pumping: valves are gone.",
      "**Leak confirmation:** the loop holds **300–500 psi of dry nitrogen** for hours if it's tight — bubbles or an electronic sniffer find the exit. This is the test that ends the recharge-every-spring cycle.",
    ],
  },
  {
    kind: "callout",
    title: "The homeowner's share of the pressure test",
    text: "Exactly two things: check that **both brass caps on the service valves are present and snug** (a leaking Schrader core under a missing cap is a classic slow leak), and **write down the numbers the tech reads out** — suction, head, superheat, subcool go straight into your intake report. Hooking up gauges yourself is EPA 608 territory, and every connection loses a little charge.",
  },

  { kind: "h2", text: "The ten parts that matter", id: "components" },
  {
    kind: "p",
    text: "Every diagnosis on this page traces back to one of these. Learn what each does and its signature failure, and you can translate any symptom — and any contractor quote — into physics.",
  },
  { kind: "termcard", termSlug: "thermostat" },
  { kind: "termcard", termSlug: "air-filter" },
  { kind: "termcard", termSlug: "blower" },
  { kind: "termcard", termSlug: "evaporator-coil" },
  { kind: "termcard", termSlug: "refrigerant-circuit" },
  { kind: "termcard", termSlug: "compressor" },
  { kind: "termcard", termSlug: "condenser-unit" },
  { kind: "termcard", termSlug: "capacitor-contactor" },
  { kind: "termcard", termSlug: "condensate-drain" },
  { kind: "termcard", termSlug: "heat-exchanger" },

  { kind: "h2", text: "The five paths every failure lives on", id: "paths" },
  {
    kind: "p",
    text: "The most useful way to segment an HVAC system isn't by room or by part — it's by **path**: the five flows the machine maintains (air, refrigerant, electricity & control, combustion, water). Every component belongs to a path, every fault lives where its components live, and every diagnosis is really the question *\"which path is broken?\"* The part labels in the 3D model above are color-coded by these paths.",
  },
  { kind: "hvacpaths" },

  { kind: "h2", text: "Real service calls, replayed", id: "scenarios" },
  {
    kind: "p",
    text: "First, two healthy baselines — the cooling start-up from breaker to cold air, and the gas heat cycle with its deliberate delays — because every diagnosis is a comparison against how it should work. Then complete real incidents — from first symptom to fix confirmed — that you can **replay step-by-step in the 3D model above** (Scenarios tab). Each step lights up the parts involved and shows what the system is doing at that moment, including the detail most people miss: **watching the outdoor drain outlet drip is how you confirm a condensate system is healthy**.",
  },
  { kind: "hvacscenarios" },

  { kind: "h2", text: "Symptom → most likely causes", id: "symptoms" },
  {
    kind: "p",
    text: "The same lookup the diagnoser runs, flattened to a table: each symptom, ranked by how often each cause turns out to be the answer on real service calls. Multiple symptoms narrow it fast — that's what the interactive mode above is for.",
  },
  { kind: "decision", items: hvacDecision },

  { kind: "h2", text: "The complete fault library", id: "fault-library" },
  {
    kind: "p",
    text: `All ${FAULTS.length} faults in the ontology: what causes each, what to check in order, the realistic fix, and typical US repair costs (2026). Severity is honest about the DIY line — **refrigerant, gas, and line voltage are licensed-pro territory**, both legally and practically.`,
  },
  { kind: "hvacfaults" },

  { kind: "h2", text: "Not all systems look like this one", id: "system-types" },
  {
    kind: "p",
    text: "The model above is a **split system** — the most common US configuration. The diagnosis logic transfers to other system types, but the layout and failure emphasis shift:",
  },
  { kind: "comparison" },

  { kind: "h2", text: "The DIY line", id: "diy-or-pro" },
  {
    kind: "list",
    items: [
      "**Always yours:** filters, thermostat batteries and settings, one-time breaker resets, hosing the outdoor coil (power off at the disconnect first), vacuuming the condensate drain, 2 feet of clearance around the outdoor unit.",
      "**Judgment calls for the handy:** cleaning a flame sensor, swapping a hot-surface igniter (gas off, don't touch the element), sealing accessible duct joints with mastic.",
      "**Never DIY:** anything refrigerant (EPA 608 federal certification is required, and charge can't be diagnosed without gauges), capacitors and contactors (stored lethal charge), gas valves and combustion work, repeated breaker resets into a fault.",
      "**Leave the house first:** gas smell, or a CO alarm. Call from outside.",
    ],
  },
  {
    kind: "callout",
    title: "The economics of neglect",
    text: "Almost every expensive HVAC failure is a cheap one that aged. A **$10 filter** protects the blower and coil. A **$200 capacitor visit** protects the $2,000 compressor. A **$150 leak search** protects against buying refrigerant every spring and a coil in three years. The system rarely breaks — it gets broken, slowly, by deferred trivial maintenance.",
  },

  { kind: "h2", text: "Frequently asked questions", id: "faq" },
  { kind: "faq" },

  {
    kind: "sources",
    items: [
      {
        label: "Trane — What is HVAC? (glossary)",
        href: "https://www.trane.com/residential/en/resources/glossary/what-is-hvac/",
        note: "Manufacturer definitions of core HVAC terms and system types.",
      },
      {
        label: "UCF Florida Solar Energy Center — HVAC Systems",
        href: "https://energyresearch.ucf.edu/consumer/buildings/hvac-systems/",
        note: "University research center's consumer guide to how residential systems work and their efficiency.",
      },
      {
        label: "Icon Mechanical — HVAC energy-efficiency tips",
        href: "https://www.iconmechanicalinc.com/energy-efficiency-tips-hvac/",
        note: "Contractor-side maintenance and efficiency practices.",
      },
      {
        label: "Home Depot — Heating, Venting & Cooling",
        href: "https://www.homedepot.com/b/Heating-Venting-Cooling/N-5yc1vZc4k8",
        note: "Retail reference for filters, capacitors, thermostats, and DIY-range part pricing.",
      },
    ],
  },

  {
    kind: "related",
    items: [
      { label: "Graph Types for AI Agents — the ontology pattern behind this page's fault model", href: "/guides/graph-types-for-ai-agents" },
    ],
  },
];

/** Scenario walkthroughs → schema.org HowTo entries (one per scenario). */
const hvacHowTos = SCENARIOS.map((s) => ({
  name: s.title,
  description: s.symptomSummary,
  steps: [
    ...s.steps.map((st) => ({ name: st.title, text: st.text })),
    { name: "The verdict", text: s.verdict },
  ],
}));

export const guides: Guide[] = [
  {
    slug: "graph-types-for-ai-agents",
    title: "Graph Types for AI Agents",
    metaTitle:
      "Knowledge Graph vs Vector Database vs Ontology: The 2026 Reference for AI Agents, RAG & GraphRAG",
    metaDescription:
      "Knowledge graph, ontology, taxonomy, information graph, context graph, vector database — what each one is, how they differ, and which to use for RAG, GraphRAG, semantic search, AEO and GEO. One dataset modeled six ways, with runnable code, primary sources, and interactive 3D.",
    kicker: "The 2026 reference · For AI agents, RAG & GraphRAG",
    headline: "Knowledge Graph vs Vector Database vs Ontology",
    subhead:
      "…plus **Taxonomy**, **Information Graph** & **Context Graph** — the **6 structures** powering modern AI agents",
    deck:
      "The six structures behind modern AI search — taxonomy, ontology, knowledge graph, information graph, context graph, vector / embedding index — what each one actually is, when to use which, and how they combine into GraphRAG. One dataset, six structures, visualized in 2D and 3D.",
    author: {
      name: "Venkata Pagadala",
      title: "AI Product Manager (Search · SEO · GEO)",
      org: "AT&T",
      url: "/about",
      bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the AI Contributors directory and the AI Concepts Encyclopedia on this site.",
    },
    datePublished: "2026-06-17",
    dateModified: "2026-06-22",
    readingTime: "16 min read",
    tags: [
      "Knowledge Graphs",
      "Vector Databases",
      "Ontology",
      "GraphRAG",
      "RAG",
      "Retrieval-Augmented Generation",
      "Context Graph",
      "Semantic Search",
      "AEO",
      "GEO",
      "AI Agents",
      "Schema.org",
    ],
    terms: graphTerms,
    comparison: graphComparison,
    faqs: graphFaqs,
    blocks: graphBlocks,
  },
  {
    slug: "hvac-system-troubleshooting",
    title: "3D HVAC Troubleshooting",
    metaTitle: "Interactive 3D HVAC Troubleshooting: Diagnose AC & Furnace Problems (2026 Guide)",
    metaDescription:
      "Explore a full 3D model of a home HVAC system, then diagnose it: pick your symptoms — warm air, ice on lines, short cycling — and get ranked causes, step-by-step checks, DIY-vs-pro calls, and real repair costs.",
    headline: "The Interactive 3D HVAC Troubleshooter",
    kicker: "Interactive Reference",
    deck:
      `A complete residential split system — furnace, coil, ducts, refrigerant loop, condenser — modeled in 3D and wired to a fault ontology. Click parts to learn them; pick symptoms to diagnose them. ${COMPONENTS.length} components, ${SYMPTOMS.length} symptoms, ${FAULTS.length} faults across five system paths, real costs.`,
    datePublished: "2026-07-04",
    dateModified: "2026-07-04",
    readingTime: "22 min read",
    tags: ["HVAC", "Air Conditioning", "Furnace", "Troubleshooting", "3D Interactive", "Home Maintenance", "Fault Diagnosis"],
    terms: hvacTerms,
    comparison: hvacComparison,
    faqs: hvacFaqs,
    blocks: hvacBlocks,
    termRoleLabel: "Common failure modes",
    comparisonHeaders: ["System type", "What it is", "How it heats & cools", "Layout", "Where you'll find it", "Best for", "Watch out for"],
    howTos: hvacHowTos,
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
