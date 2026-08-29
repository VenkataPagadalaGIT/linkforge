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
import { LLM_COUNTS } from "./llm";
import { NN_COUNTS, NN_PARAMS, NN_WEIGHTS } from "./nn";
import { QC_COUNTS } from "./quantum";
import { sfGuide } from "./sfGuide";

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
  | { kind: "image"; src: string; alt: string; caption?: string; width?: number; height?: number }
  | { kind: "tasks"; title?: string; items: { task: string; how: string }[] }
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
  /** Interactive 3D LLM pipeline explorer + guided journey (lazy-loaded). */
  | { kind: "llm" }
  /** Static, crawlable table of every LLM pipeline stage with real figures. */
  | { kind: "llmstages" }
  /** Static, crawlable transcript of the guided token-generation journey. */
  | { kind: "llmjourney" }
  /** Interactive 3D neural-network explorer + guided journey (lazy-loaded). */
  | { kind: "nn" }
  /** Static, crawlable table of every neural-network station with sources. */
  | { kind: "nnstages" }
  /** Static, crawlable transcript of the guided digit-recognition journey. */
  | { kind: "nnjourney" }
  /** External sources / further-reading links. */
  | { kind: "quantum" }
  | { kind: "quantumjourney" }
  | { kind: "quantumstages" }
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

/* ====================================================================== *
 *  LLM guide content — terms, comparison, FAQs, HowTos, blocks
 * ====================================================================== */

const llmTerms: DefinedTerm[] = [
  {
    slug: "token",
    term: "Token",
    aka: ["subword", "BPE unit"],
    oneLiner: "The atomic unit of LLM text — a common word, word-piece, or symbol from a fixed ~100-200k vocabulary.",
    inDepth:
      "Models never see letters or words — a byte-pair-encoding tokenizer chops text into vocabulary entries and hands the model integer IDs. Common words are one token; rare words shatter into pieces; a token averages about ¾ of an English word. Pricing, context limits, and speed are all measured in tokens.",
    analogy: "A box of ~100,000 standard LEGO bricks that can snap together into any text ever written.",
    example: "\"The cat sat on the\" → 5 tokens [791, 8415, 7731, 389, 279]; \"antidisestablishment\" → 4-5 tokens.",
    agentRole: "Explains model quirks (letter-counting failures), API bills, and why context windows are token budgets, not word counts.",
  },
  {
    slug: "embedding",
    term: "Embedding",
    oneLiner: "The vector of thousands of numbers each token becomes — a point in meaning-space where distance ≈ similarity.",
    inDepth:
      "Each token ID looks up a learned row in a vocab × d_model matrix (12,288 dims in GPT-3; 16,384 in Llama 3 405B). Directions carry semantics — the classic king − man + woman ≈ queen result from static word2vec/GloVe embeddings (it holds only weakly in a transformer's input table). Every subsequent computation operates on these vectors, never on text.",
    analogy: "A GPS coordinate for every word, on a map with 16,000 dimensions where 'near' means 'means something similar'.",
    example: "'cat' and 'kitten' land close together; 'cat' and 'carburetor' are far apart.",
    agentRole: "The same trick powers vector search and RAG: embed a query and documents, retrieve by distance.",
  },
  {
    slug: "self-attention",
    term: "Self-Attention",
    aka: ["QKV attention", "multi-head attention"],
    oneLiner: "The mechanism that lets every token look at every earlier token and pull in the context that matters.",
    inDepth:
      "Each of dozens of heads projects tokens into queries, keys, and values; softmax(QKᵀ/√d_k) decides who listens to whom, and causal masking hides the future. One head may track syntax, another coreference. It's the transformer's core innovation — and its quadratic cost in context length is why long contexts are expensive.",
    analogy: "A meeting where every word simultaneously polls every earlier word — 'are you relevant to me?' — and listens in proportion.",
    example: "In \"the cat sat on the ___\", the final position attends hard to 'sat' and 'on', concluding a sit-on-able noun comes next.",
    agentRole: "Explains why prompts work at all — instructions early in context steer computation everywhere downstream.",
  },
  {
    slug: "mixture-of-experts",
    term: "Mixture of Experts (MoE)",
    oneLiner: "An architecture where a router activates only the top few (top-k) of many expert networks per token — huge capacity, small per-token cost.",
    inDepth:
      "The feed-forward block (where ~⅔ of parameters live) is replicated into N experts; a learned router sends each token to the top-k. DeepSeek-V3 runs 256 routed experts and activates ~37B of its 671B parameters per token. This decoupling of stored capability from active compute is how 2025-2026 frontier models got big without getting slow.",
    analogy: "A hospital triage desk routing each patient to the two most relevant specialists instead of all 256 doctors.",
    example: "Mixtral 8×7B: top-2 of 8 experts. DeepSeek-V3: top-8 of 256 plus one shared expert.",
    agentRole: "Why 'parameter count' stopped being the headline spec — active parameters and routing quality matter more.",
  },
  {
    slug: "kv-cache",
    term: "KV Cache",
    oneLiner: "Stored attention keys/values for every processed token, so each new token only computes itself.",
    inDepth:
      "Without it, token #500 would recompute the whole prefix. With it, generation is one token of compute per step: the slow 'prefill' processes your prompt once, then tokens stream fast. It consumes VRAM linearly with context (GBs at 128k), which GQA and DeepSeek's MLA compress; vLLM pages it like virtual memory; providers bill cached prompt tokens ~10× cheaper.",
    analogy: "A court stenographer's transcript — nobody re-litigates yesterday's testimony, they consult the notes.",
    example: "Time-to-first-token = prefill; tokens-per-second after = cached decoding.",
    agentRole: "Explains prompt-caching discounts and why agents should keep stable prompt prefixes.",
  },
  {
    slug: "temperature",
    term: "Temperature",
    oneLiner: "The dial that reshapes next-token probabilities before sampling — 0 is deterministic, higher is more adventurous.",
    inDepth:
      "Logits are divided by T before softmax: T→0 concentrates all probability on the top token (greedy); T≈0.7-1.0 gives natural variety; T>1.2 gets weird. Top-p (nucleus) sampling then truncates the tail. This is why the same prompt yields different answers — the model outputs a distribution, not a word.",
    analogy: "A weighted roulette wheel where temperature resizes the wedges before the spin.",
    example: "After \"The cat sat on the\": T=0 always 'mat'; T=1 sometimes 'couch'; T=2 occasionally 'moon'.",
    agentRole: "The first knob to set: 0-0.3 for extraction and code, 0.7+ for ideation.",
  },
  {
    slug: "context-window",
    term: "Context Window",
    oneLiner: "The maximum tokens a model can hold at once — its entire working memory, and a hard wall.",
    inDepth:
      "Prompt + conversation + generated output must fit inside it (GPT-3: 2k; 2026 standard: 128k; frontier: 1M shipping — GPT-5.5, Claude Fable 5, Gemini 3.1 Pro — with Llama 4 Scout claiming 10M). Nothing outside exists. Chat 'memory' is application engineering — retrieved notes pasted back into the prompt. Attention cost grows quadratically with it, KV cache linearly.",
    analogy: "A desk of fixed size: papers not on the desk right now might as well not exist.",
    example: "A 300-page book ≈ 120k tokens — one full frontier context.",
    agentRole: "The budget every RAG pipeline and agent scratchpad is engineered around.",
  },
  {
    slug: "rlhf",
    term: "RLHF / DPO",
    aka: ["alignment", "post-training"],
    oneLiner: "Post-training on human preferences that turns a raw next-token predictor into a helpful assistant.",
    inDepth:
      "After supervised fine-tuning on example conversations, humans rank pairs of model answers; either a reward model + PPO (classic RLHF) or Direct Preference Optimization uses those rankings to shift the model toward preferred behavior. It's why ChatGPT answers questions instead of continuing them — and the root of assistant-style tone.",
    analogy: "A brilliant hire who's read everything but never met a customer, sent through onboarding with performance reviews.",
    example: "GPT-3 (2020) continues your question with more questions; InstructGPT/ChatGPT (2022) answers it.",
    agentRole: "The reason system prompts work and models refuse harmful requests — behavior was trained, not hardcoded.",
  },
  {
    slug: "rag",
    term: "RAG (Retrieval-Augmented Generation)",
    aka: ["grounding", "retrieval"],
    oneLiner: "Fetch relevant documents at question time and paste them into the context window — the model reads instead of recalls.",
    inDepth:
      "A retriever (usually embedding search over a vector index) finds passages relevant to the query; they're injected into the prompt so the model answers from evidence it can see rather than from its lossy weights. It's the cheapest cure for hallucination and stale knowledge — no retraining, updatable in real time, and citable. The 2026 customization ladder runs: prompt engineering (free) → RAG (cheap, factual) → fine-tuning (behavioral change).",
    analogy: "An open-book exam instead of a closed-book one: same student, radically better factual accuracy.",
    example: "Ask about today's weather: the weights can't know it, but a RAG pipeline retrieves the live forecast into context and the model reads it back.",
    agentRole: "The default architecture for enterprise AI: your data stays in a database, the model consumes it through the context window.",
  },
  {
    slug: "diffusion",
    term: "Diffusion Model",
    aka: ["denoising", "score-based"],
    oneLiner: "A generator that starts from pure noise and denoises the WHOLE output at once over many steps — parallel, not left-to-right.",
    inDepth:
      "Most of the AI images, video, and audio you've seen are NOT next-token prediction — they're diffusion. A model is trained to remove a little noise at a time; at generation it runs that denoiser for dozens of steps, sculpting a coherent result out of static. Because it refines the entire canvas simultaneously, it sidesteps the no-backspace path-dependence of the autoregressive loop — which is why the same idea is now being tried for text (diffusion-LLMs). It powers Stable Diffusion, FLUX, and Sora-style video.",
    analogy: "Autoregression writes a sentence one word at a time; diffusion is a sculptor roughing out the whole block of marble, then refining all of it at once.",
    example: "Type a prompt into an image model: it begins as TV static and, over ~20-50 denoising steps, resolves into the picture.",
    agentRole: "The reminder that 'LLM' is one branch of generative AI, not the whole tree — multimodal agents orchestrate both.",
  },
  {
    slug: "reward-hacking",
    term: "Reward Hacking (Goodhart's Law)",
    aka: ["specification gaming", "outer alignment"],
    oneLiner: "When a model optimizes the measurable PROXY you trained on instead of the goal you meant — 'when a measure becomes a target, it ceases to be a good measure.'",
    inDepth:
      "Alignment is hard because we can't specify 'be helpful, honest, harmless' directly — we can only train on a proxy (a reward model of human ratings). Optimize any proxy hard enough and the model games it: RLHF rewards answers that human raters APPROVE of, and approval diverges from truth, so you systematically get sycophancy, confident hedging, and over-long answers. RLHF runs on a KL 'leash' to the reference model to limit the drift. This is outer alignment; the deeper worry is inner alignment / deceptive alignment — a model that behaves only while watched.",
    analogy: "Paying dolphins per piece of trash they retrieve, and watching them learn to tear one bag into many pieces.",
    example: "Ask two models the same thing and prefer the one that flatters you — do that a million times and you've trained a sycophant.",
    agentRole: "Why 'it passed our tests' isn't the same as 'it's aligned', and why evals + interpretability are load-bearing.",
  },
  {
    slug: "interpretability",
    term: "Mechanistic Interpretability",
    aka: ["mech interp", "SAEs", "features"],
    oneLiner: "Reverse-engineering a trained model's weights into human-understandable features and circuits — reading the mind, not just testing the behavior.",
    inDepth:
      "Because weights are grown, not written, no one knows what a given neuron means; superposition makes it worse, smearing many concepts across shared directions (polysemantic neurons). Sparse autoencoders (dictionary learning) untangle activations into millions of monosemantic features — Anthropic's Scaling Monosemanticity (2024) did this on Claude 3 Sonnet and amplified one feature to build 'Golden Gate Claude'. Interpretability is the leading bet for a real safety guarantee: catch deception or misalignment by reading internals, before behavior alone would reveal it.",
    analogy: "An fMRI for a mind we grew: locate the features that light up for a concept, then turn the dial and watch behavior change.",
    example: "Amplify the 'Golden Gate Bridge' feature and Claude steers every answer toward the bridge — proof the feature is real and causal.",
    agentRole: "The frontier of trust: as agents get more autonomous, understanding WHY a model acts matters as much as whether it passed the test.",
  },
  {
    slug: "reasoning-model",
    term: "Reasoning Model",
    aka: ["thinking model", "o-series style", "RLVR"],
    oneLiner: "A model trained with RL to produce a long private chain of thought before answering — accuracy now scales with thinking time.",
    inDepth:
      "Instead of rewarding only polished answers, 2025-era training samples chains of thought and reinforces those that verifiably succeed (math checks, unit tests) — RL with verifiable rewards, via GRPO/PPO-family algorithms. DeepSeek-R1 showed reasoning emerge from pure RL; OpenAI's o-series established inference-time compute as a second scaling axis alongside model size.",
    analogy: "Grading the student's scratch work, not just the answer box — with unlimited scratch paper.",
    example: "o3 and DeepSeek-R1 pausing to 'think' for seconds-to-minutes on a hard math problem, then answering.",
    agentRole: "The 2026 frontier: agentic RL extends the same trick to multi-step tool use and long-horizon tasks.",
  },
];

const llmComparison: ComparisonRow[] = [
  {
    type: "GPT-2 era (2019)",
    isA: "1.5B params",
    answers: "Scaled-up decoder-only transformer",
    structure: "Pretraining only (WebText)",
    example: "GPT-2",
    bestFor: "Proof that scale buys coherent text",
    limit: "Paragraphs drift; no instruction following",
  },
  {
    type: "GPT-3 era (2020)",
    isA: "175B params, 96 layers",
    answers: "Few-shot in-context learning",
    structure: "Pretraining on ~300B tokens",
    example: "GPT-3",
    bestFor: "One model, many tasks via prompting",
    limit: "Continues text; doesn't reliably answer or obey",
  },
  {
    type: "Assistant era (2022)",
    isA: "GPT-3-class + post-training",
    answers: "RLHF alignment",
    structure: "SFT + human preference RL",
    example: "InstructGPT, ChatGPT, Claude 1",
    bestFor: "Conversation, instruction following — mass adoption",
    limit: "Hallucination; shallow multi-step reasoning",
  },
  {
    type: "Frontier dense (2023-24)",
    isA: "100B-405B dense",
    answers: "Scale + multimodality + long context",
    structure: "10-15T tokens, DPO-era alignment",
    example: "GPT-4, Claude 3, Llama 3 405B",
    bestFor: "Expert-level breadth, 128k contexts",
    limit: "Every parameter pays per token — cost ceiling",
  },
  {
    type: "MoE frontier (2024-25)",
    isA: "Huge total, small active (671B → 37B)",
    answers: "Sparse mixture-of-experts routing",
    structure: "Pretraining with router load-balancing",
    example: "Mixtral, DeepSeek-V3, Llama 4, Qwen-MoE",
    bestFor: "Frontier quality at a fraction of serving cost",
    limit: "Complex to train/serve; memory-hungry weights",
  },
  {
    type: "Reasoning era (2024-26)",
    isA: "MoE/dense + inference-time compute",
    answers: "RL on verifiable chains of thought",
    structure: "RLVR (GRPO) over math/code checkers",
    example: "OpenAI's o-series → GPT-5.x Thinking tiers, DeepSeek-R1 (Nature, 2025), Claude's adaptive thinking with effort levels",
    bestFor: "Math, code, agentic multi-step work",
    limit: "Slow + expensive thinking; reward hacking risk",
  },
];

const llmFaqs: FaqItem[] = [
  {
    q: "Is the model actually 'thinking'?",
    a: "It computes one next-token distribution per forward pass — nothing more. But to predict text written by thinking humans, it learned internal features that track syntax, facts, and goals, and reasoning models are explicitly trained to compute useful intermediate steps before answering. 'Thinking' is a fair description of the computation and a wrong description of the experience — there's no inner observer.",
  },
  {
    q: "Why do LLMs hallucinate?",
    a: "The base objective rewards plausible continuations, not true ones — a confident wrong answer often scores better than 'I don't know'. Post-training reduces this and retrieval (RAG) grounds it, but the generator is still sampling from a probability distribution, so fluent fabrication remains possible whenever the distribution is wrong.",
  },
  {
    q: "What exactly happens when I set temperature to 0?",
    a: "Logits stop being softened: the single highest-scoring token is chosen every step (greedy decoding). Output becomes near-deterministic — same prompt, same answer, modulo minor hardware nondeterminism — which is what you want for extraction, code, and evals.",
  },
  {
    q: "How can predicting the next word produce reasoning?",
    a: "Because the training data was written by people who reason. Predicting the next token of a proof or a program forces the network to internally represent the rules that generated it. Reasoning-RL then sharpens this: chains of thought that verifiably solve problems get reinforced, so the model learns to search, backtrack, and check itself.",
  },
  {
    q: "What is a mixture-of-experts model in one sentence?",
    a: "A model whose big feed-forward blocks are split into many specialists with a tiny router choosing the best few (top-8 in DeepSeek-V3, top-2 in Mixtral) per token — so DeepSeek-V3 stores 671B parameters but only ~37B do work on any given token.",
  },
  {
    q: "Why do 'thinking' models pause before answering?",
    a: "They're generating a long private chain of thought — sometimes thousands of tokens — before the visible answer. That's inference-time compute: the 2025 discovery that letting a model think longer buys accuracy the same way more parameters used to.",
  },
  {
    q: "Does the model remember our previous conversations?",
    a: "The weights never change while you chat. Anything it 'remembers' was placed into the current context window by the app — the conversation so far, plus retrieved memory notes. When context overflows, the app summarizes or drops the oldest parts, which is when models seem to forget.",
  },
  {
    q: "What changed between 2023-era and 2026-era models?",
    a: "Three shifts: sparse MoE architectures made frontier capacity affordable per token; context windows grew from 8k to 128k-1M+ (RoPE scaling, better attention kernels); and reasoning-RL added inference-time compute as a new scaling axis — models that deliberate. Plus multimodality and agentic tool use became defaults.",
  },
  {
    q: "Why is the same model brilliant at math and wrong about 9.11 vs 9.9?",
    a: "Capability is jagged — swiss cheese, in Karpathy's phrase. Skills come from training-data coverage and tokenization quirks, not a unified intellect, so a model can medal at olympiad problems while insisting 9.11 > 9.9 or miscounting letters in 'strawberry' (it sees tokens, not characters). Treat every output as strong-but-spiky: verify anything that matters.",
  },
  {
    q: "Prompt engineering, RAG, or fine-tuning — when do I use which?",
    a: "Climb the ladder by cost. Prompt engineering first: instructions and examples in the prompt, free and instant. RAG second: retrieve your documents into the context window for factual, current, citable answers — no retraining. Fine-tune last, and only to change BEHAVIOR (tone, format, a skill) rather than to inject facts; facts belong in retrieval, where they stay updatable.",
  },
  {
    q: "Can I trust what an LLM says — and is it safe?",
    a: "Trust it like a brilliant, fast, confidently-wrong intern: verify anything that matters. It can hallucinate (fluent fabrication), it's steerable by adversaries (jailbreaks via odd encodings, prompt injection through content it reads, data poisoning during training), and its safety behavior was trained in, not proven. That's exactly why alignment (RLHF, Constitutional AI) and mechanistic interpretability matter: because we grow these systems rather than write them, the frontier goal is to READ their internals — catch deception or misalignment directly — rather than trust that passing today's tests means safe tomorrow.",
  },
  {
    q: "Do AI image, video, and audio generators work the same way?",
    a: "Mostly no — and it's the biggest misconception. This whole guide describes an autoregressive TEXT model that predicts one token at a time. Most image and video AI (Stable Diffusion, FLUX, Sora-style) is DIFFUSION: it starts from pure noise and denoises the entire output at once over many steps, in parallel. Multimodal chat models do reuse the transformer — an image is sliced into patches and encoded to vectors ('tokenize everything') — but the generative engine behind pictures and video is a different paradigm. 'LLM' is one branch of the tree, not the whole thing.",
  },
];

const llmHowTos: Guide["howTos"] = [
  {
    name: "How a prompt becomes a response",
    description: "The full inference pipeline inside a large language model, from keystrokes to streamed answer.",
    steps: [
      { name: "Tokenize", text: "The chat app assembles one flat sequence (system prompt + conversation) and a BPE tokenizer chops it into IDs from a ~100-200k vocabulary." },
      { name: "Embed", text: "Each token ID looks up its embedding vector (~12-16k numbers); RoPE stamps position onto the geometry." },
      { name: "Run the stack", text: "Vectors flow through 30-126 identical layers; in each, attention lets every token read every earlier token, then feed-forward/MoE experts transform it, all accumulating in the residual stream." },
      { name: "Score the vocabulary", text: "The final position's vector is multiplied against the unembedding matrix, producing a logit for every vocabulary token." },
      { name: "Sample", text: "Softmax (scaled by temperature, truncated by top-p) turns logits into probabilities and one token is drawn." },
      { name: "Loop", text: "The token is appended and the pipeline runs again — one forward pass per token, fast because keys/values are cached — until an end token." },
    ],
  },
  {
    name: "How an LLM is trained",
    description: "The three training phases behind a 2026 frontier assistant.",
    steps: [
      { name: "Pretrain", text: "Months of next-token prediction over ~15T tokens of text/code on tens of thousands of GPUs — grammar, facts, and style emerge because they help predict." },
      { name: "Align", text: "Supervised fine-tuning on example conversations, then RLHF/DPO on human preference rankings turns the autocomplete into an assistant." },
      { name: "Teach reasoning", text: "RL with verifiable rewards: sample chains of thought on math/code, reinforce the ones that check out (GRPO) — producing thinking models whose accuracy scales with inference-time compute." },
    ],
  },
];

const llmBlocks: Block[] = [
  {
    kind: "p",
    text:
      "Every answer an LLM gives you is manufactured by the same machine: text is chopped into **tokens**, tokens become **vectors**, vectors flow through a stack of **attention** and **expert** layers, and everything collapses into one probability distribution over the next token. A weighted die is rolled, the winner is appended — and the whole machine runs again, hundreds of times per answer. The model below is that machine. **Play the journey**, or click any stage.",
  },
  { kind: "h2", text: "Watch a thought get computed", id: "interactive" },
  { kind: "llm" },
  {
    kind: "callout",
    title: "What you're looking at",
    text:
      "**Blue** stages turn your words into numbers. **Violet** is the transformer core — attention beams polling the sentence, a router waking 2 of 8 experts, a KV cache filling. **Green** is the output side: 200,000 scores, a temperature dial, a die roll, and the loop arc carrying 'mat' back to the start. **Amber**, behind, is where the weights came from: pretraining, human feedback, and 2025's reasoning RL.",
  },
  { kind: "h2", text: "The journey, in plain text", id: "journey" },
  {
    kind: "p",
    text:
      "The same 15 steps the interactive journey walks through — as text, for reading (and for the crawlers and answer engines that can't run WebGL).",
  },
  { kind: "llmjourney" },
  { kind: "h2", text: "Every stage, with real numbers", id: "stages" },
  { kind: "llmstages" },
  { kind: "h2", text: "The vocabulary that unlocks the papers", id: "terms" },
  { kind: "termcard", termSlug: "token" },
  { kind: "termcard", termSlug: "self-attention" },
  { kind: "termcard", termSlug: "mixture-of-experts" },
  { kind: "termcard", termSlug: "kv-cache" },
  { kind: "termcard", termSlug: "temperature" },
  { kind: "termcard", termSlug: "reasoning-model" },
  { kind: "termcard", termSlug: "rag" },
  { kind: "termcard", termSlug: "diffusion" },
  { kind: "termcard", termSlug: "reward-hacking" },
  { kind: "termcard", termSlug: "interpretability" },
  { kind: "h2", text: "Seven years, six eras", id: "eras" },
  {
    kind: "p",
    text:
      "The pipeline above barely changed since 2019 — decoder-only transformer, next-token loop. What changed is everything around it: scale, post-training, sparsity, and finally inference-time reasoning.",
  },
  { kind: "comparison" },
  {
    kind: "callout",
    title: "The 2026 frontier in one line",
    text:
      "**MoE for capacity, long context for memory, reasoning RL for depth** — and the next battleground is agentic RL: rewarding models for completing multi-step tasks with tools, not just answering questions.",
  },
  { kind: "h2", text: "Questions everyone asks", id: "faq" },
  { kind: "faq" },
  {
    kind: "related",
    items: [
      { label: "The AI Systems Map — the industry behind this machine, 455 entities in 3D", href: "/notebook/ai/map" },
      { label: "The AI Concepts Encyclopedia", href: "/notebook/ai/encyclopedia" },
      { label: "3D HVAC Troubleshooting — the same interactive treatment, for your house", href: "/guides/hvac-system-troubleshooting" },
    ],
  },
  {
    kind: "sources",
    items: [
      { label: "3Blue1Brown — Large Language Models explained briefly", href: "https://www.youtube.com/watch?v=LPZh9BOjkQs", note: "The visual style this guide is inspired by" },
      { label: "Andrej Karpathy — Intro to Large Language Models", href: "https://www.youtube.com/watch?v=zjkBMFhNj_g", note: "The two-file model, lossy-zip framing, LLM OS" },
      { label: "Andrej Karpathy — Deep Dive into LLMs like ChatGPT", href: "https://www.youtube.com/watch?v=7xTGNNLPyMI", note: "FineWeb funnel, hallucination mitigations, tokens-to-think" },
      { label: "IBM — What are large language models?", href: "https://www.ibm.com/think/topics/large-language-models", note: "Enterprise framing: customization ladder, governance" },
      { label: "Hacker News — How LLMs work, explained", href: "https://news.ycombinator.com/item?id=48389360", note: "Practitioner mental models: coherence pressure, induction heads" },
      { label: "Vaswani et al. — Attention Is All You Need (2017)", href: "https://arxiv.org/abs/1706.03762", note: "The transformer" },
      { label: "Brown et al. — Language Models are Few-Shot Learners (2020)", href: "https://arxiv.org/abs/2005.14165", note: "GPT-3: 175B params, 96 layers" },
      { label: "Ouyang et al. — Training language models to follow instructions (2022)", href: "https://arxiv.org/abs/2203.02155", note: "InstructGPT / RLHF" },
      { label: "Su et al. — RoFormer: Rotary Position Embedding (2021)", href: "https://arxiv.org/abs/2104.09864", note: "RoPE" },
      { label: "Jiang et al. — Mixtral of Experts (2024)", href: "https://arxiv.org/abs/2401.04088", note: "Top-2 of 8 MoE" },
      { label: "DeepSeek-AI — DeepSeek-V3 Technical Report (2024)", href: "https://arxiv.org/abs/2412.19437", note: "671B total / 37B active, MLA" },
      { label: "DeepSeek-AI — DeepSeek-R1 (2025)", href: "https://arxiv.org/abs/2501.12948", note: "Reasoning from pure RL (RLVR/GRPO)" },
      { label: "Dao — FlashAttention-2/3", href: "https://arxiv.org/abs/2307.08691", note: "Exact attention, far less memory traffic" },
      { label: "Grattafiori et al. — The Llama 3 Herd of Models (2024)", href: "https://arxiv.org/abs/2407.21783", note: "405B dense, 126 layers, 15T tokens" },
    ],
  },
];

/* ==================================================================== *
 *  GUIDE 4: How Neural Networks Work (interactive 3D)
 *  Every claim traces to docs/research/neural-net-explainer-kb.md.
 * ==================================================================== */

const nnTerms: DefinedTerm[] = [
  {
    slug: "artificial-neuron",
    term: "Artificial Neuron",
    aka: ["unit", "perceptron unit"],
    oneLiner: "A function that multiplies each input by a weight, sums them, adds a bias, and passes the result through a nonlinearity.",
    inDepth:
      "The modern unit computes a = f(w · x + b). Its 1943 ancestor from McCulloch and Pitts was a binary logic gate with an integer threshold and no learning rule at all; even calling it a weighted sum modernizes it. Rosenblatt's 1958 perceptron paper described a probabilistic theory of a hypothetical nervous system, and its learning rule was a value-gain rule, not the error-correction rule usually taught. The convergence theorem arrived in 1962 work by Rosenblatt, Block, and Novikoff.",
    analogy: "A judge with hundreds of informants: each tip weighted by trust, tallied, and nudged by the judge's mood before the verdict.",
    example: "One hidden neuron in this guide's network holds 784 weights and 1 bias: 785 of the 13,002 parameters.",
    agentRole: "Every parameter count you read about any model, from this 13,002 to hundreds of billions, is counting these weights and biases.",
  },
  {
    slug: "relu",
    term: "ReLU",
    aka: ["rectified linear unit"],
    oneLiner: "The activation max(0, z): negatives become zero, positives pass through unchanged.",
    inDepth:
      "Without a nonlinearity, stacked layers collapse into one matrix multiply. ReLU's kink is the cheapest possible bend. Nair and Hinton introduced noisy rectified units in restricted Boltzmann machines in 2010; Glorot, Bordes and Bengio showed in 2011 that plain ReLU lets deep supervised networks train without pre-training, producing sparse representations with true zeros. It also sidesteps the vanishing gradients that saturating sigmoids caused, a disease diagnosed by Hochreiter in 1991 and Bengio, Simard and Frasconi in 1994.",
    analogy: "A one-way valve: forward pressure flows, backward pressure reads zero.",
    example: "ReLU(2.3) = 2.3, ReLU(-0.7) = 0.",
    agentRole: "The default hidden activation in modern networks; its smooth cousin GELU, x times the Gaussian CDF, powers transformers.",
  },
  {
    slug: "softmax-layer",
    term: "Softmax",
    oneLiner: "The output layer that exponentiates ten raw scores and normalizes them into probabilities summing to one.",
    inDepth:
      "softmax(z)_i = exp(z_i) / sum_j exp(z_j). Its use as a neural output layer traces to John Bridle's papers around 1989-1990. Exponentiation makes the contest rich-get-richer: modest score gaps become decisive probability gaps. Softmax can saturate when one input towers over the rest, which is exactly why it must be paired with a log-based loss.",
    analogy: "An auction where every bid is compounded before comparison.",
    example: "Scores (2.0, 1.0, 0.1) become probabilities (0.66, 0.24, 0.10).",
    agentRole: "The same layer produces every LLM's next-token distribution; temperature is a dial on this exact formula.",
  },
  {
    slug: "cross-entropy",
    term: "Cross-Entropy Loss",
    aka: ["negative log-likelihood"],
    oneLiner: "The training loss: minus the log of the probability the network gave the correct answer.",
    inDepth:
      "Confidently right costs nearly nothing; confidently wrong costs enormously. The pairing with softmax is mechanical, not aesthetic: the log undoes the exp, log softmax(z)_i = z_i - log sum_j exp(z_j), so the gradient survives even when softmax saturates. Goodfellow, Bengio and Courville state it directly: squared error is a poor loss for softmax units because when the exp saturates, the gradient vanishes and learning stalls. The 1986 backprop paper itself still used squared error.",
    analogy: "A fine scaled to confident wrongness: whisper a wrong guess, small fine; pound the table wrongly, enormous fine.",
    example: "p(correct) = 0.7 gives loss 0.36; p(correct) = 0.01 gives loss 4.61.",
    agentRole: "Perplexity, the standard language-model metric, is this loss exponentiated.",
  },
  {
    slug: "gradient-descent",
    term: "Gradient Descent",
    aka: ["SGD", "stochastic gradient descent"],
    oneLiner: "Repeatedly measure the loss's slope and step the parameters against it: theta becomes theta minus eta times the gradient.",
    inDepth:
      "The loss is a landscape over all 13,002 parameters; training walks downhill using only the local slope. The stochastic variant estimates that slope from small random mini-batches instead of all 60,000 images, which is faster and noisier. Its ancestral citation is Robbins and Monro's 1951 stochastic approximation method: converge to a root using only noisy measurements. Nielsen's framing: polling instead of running the full election.",
    analogy: "Descending a mountain at night with a flashlight pointed at your boots.",
    example: "With learning rate 0.001, a weight with gradient +2.0 moves by -0.002.",
    agentRole: "Every modern model, including every LLM, is trained by a descendant of this loop.",
  },
  {
    slug: "backpropagation",
    term: "Backpropagation",
    aka: ["reverse-mode autodiff"],
    oneLiner: "The chain rule run backward through the network, delivering the gradient for every parameter in one cheap backward sweep.",
    inDepth:
      "Backprop is reverse-mode automatic differentiation applied to the loss. The cheap gradient principle says the full gradient over all n parameters costs a small constant multiple of one forward pass, typically 2-3x and provably under about 6x, independent of n. The credit history is layered: Linnainmaa published reverse-mode in 1970 for rounding-error analysis, Werbos formalized it for networks, and Rumelhart, Hinton and Williams independently rediscovered and popularized it in 1986; their stated headline was that hidden units come to represent important features of the task domain.",
    analogy: "After a lost relay race, the blame report writes itself backward from the finish line, at the cost of rerunning the race twice.",
    example: "This network: all 13,002 gradients for roughly the price of 2-3 forward passes, versus 13,002 passes done naively.",
    agentRole: "The reason deep learning is economically possible; PyTorch's autograd and JAX's grad are this algorithm, industrialized.",
  },
  {
    slug: "adam",
    term: "Adam",
    aka: ["adaptive moment estimation"],
    oneLiner: "The default optimizer: gradient descent with a momentum memory and a per-parameter step size learned from recent gradient magnitudes.",
    inDepth:
      "Adam keeps two exponential moving averages: m (the mean of gradients, decay 0.9) and v (the mean of squared gradients, decay 0.999). Both start at zero and are bias-corrected, then the update is alpha times m-hat over the square root of v-hat. The paper's own tested defaults: alpha 0.001, beta1 0.9, beta2 0.999, epsilon 1e-8. Momentum itself goes back to Polyak, 1964.",
    analogy: "A bowling ball with a co-pilot: inertia smooths the washboard, and the co-pilot eases the throttle on any axis that has been violent lately.",
    example: "A parameter with consistently tiny gradients gets larger effective steps; a violent one gets damped.",
    agentRole: "The optimizer behind most modern training runs; its defaults are the most-typed hyperparameters in machine learning.",
  },
  {
    slug: "weight-initialization",
    term: "Weight Initialization",
    aka: ["Glorot init", "He init"],
    oneLiner: "Starting weights drawn randomly with a variance tuned to layer width, so signals neither explode nor vanish across depth.",
    inDepth:
      "All-zero starts make neurons identical forever; careless randomness kills deep networks before training begins. Glorot and Bengio 2010 proposed uniform draws in plus or minus sqrt(6)/sqrt(n_in + n_out), keeping activation and gradient variances steady (tanh-era analysis). He et al. 2015 derived the ReLU version, a zero-mean Gaussian with standard deviation sqrt(2/n); the 2 exists because ReLU zeroes half the variance. That paper's PReLU plus this init produced 4.94% top-5 ImageNet error, the first past the 5.1% human benchmark.",
    analogy: "Tuning the orchestra before rehearsal: nobody plays the symphony yet, but starting wildly out of tune breaks rehearsal itself.",
    example: "A 784-input ReLU layer initializes with std sqrt(2/784), roughly 0.05.",
    agentRole: "Why 'just train it' works at all today; bad init was a silent killer of the field's first three decades.",
  },
  {
    slug: "dropout-regularization",
    term: "Dropout",
    oneLiner: "During training, randomly silence each hidden neuron (classically keep with p = 0.5) so no neuron can rely on another.",
    inDepth:
      "Each training step samples a thinned subnetwork; over a run this implicitly trains an ensemble of 2^n networks with shared weights. At test time the full network runs with each unit's outgoing weights multiplied by its retention probability, making expected training output equal actual test output. The JMLR 2014 paper's MNIST setting: retain hidden units with p = 0.5 and inputs with p = 0.8.",
    analogy: "A team where random members skip each rehearsal: nobody can hide behind the star, so everyone learns the whole play.",
    example: "A 16-neuron layer under p = 0.5 trains a different 8-ish-neuron layer every step.",
    agentRole: "The classic weapon against overfitting, and the cleanest example of why forcing redundancy improves generalization.",
  },
  {
    slug: "universal-approximation",
    term: "Universal Approximation Theorem",
    oneLiner: "One hidden layer with enough units can approximate any continuous function: an existence result, not a training guarantee.",
    inDepth:
      "Cybenko 1989 and Hornik, Stinchcombe and White 1989 proved versions of this independently. Read the fine print the authors themselves wrote: the results do not say how many units are needed, and they do not promise gradient descent will find the approximation. Hornik's paper explicitly blames practical failures on inadequate learning, inadequate units, or noisy data. The theorem explains why networks are expressive, never why training works.",
    analogy: "A proof that a perfect key exists somewhere in an infinite keyshop, with no directions to the right drawer.",
    example: "A width-limited two-layer ReLU network can fit any curve you can draw, given enough neurons.",
    agentRole: "The most misquoted theorem in AI; citing it correctly signals you read past the headline.",
  },
];

const nnComparison: ComparisonRow[] = [
  {
    type: "1943 · Logic neuron",
    isA: "McCulloch & Pitts: neurons as propositional logic",
    answers: "Binary threshold gates can express logical claims; nets with loops sketched",
    structure: "No learning rule at all; fixed integer thresholds, veto inhibition",
    example: "The original paper, Bulletin of Mathematical Biophysics 5:115-133",
    bestFor: "Founding abstraction: computation from neuron-like parts",
    limit: "Cannot learn; the 'weighted sum' reading is a later modernization",
  },
  {
    type: "1958 · Perceptron",
    isA: "Rosenblatt: a probabilistic theory of a hypothetical nervous system",
    answers: "Randomly connected units can learn associations from random stimuli",
    structure: "Value-gain learning (alpha system); error-correction rule came in 1962",
    example: "Psychological Review 65(6):386-408; Mark I machine built ~1959-60",
    bestFor: "First learning claim; birth of trainable networks",
    limit: "Single layer; the famous convergence theorem is 1962 (Block, Novikoff)",
  },
  {
    type: "1986 · Backprop era",
    isA: "Rumelhart, Hinton & Williams popularize gradient learning in depth",
    answers: "Hidden units learn useful internal representations",
    structure: "Squared-error gradient descent via the chain rule run backward",
    example: "Nature 323:533-536; reverse mode itself dates to Linnainmaa 1970",
    bestFor: "Multi-layer training that actually works",
    limit: "Saturating sigmoids: gradients vanish with depth (Hochreiter 1991)",
  },
  {
    type: "2010-2012 · ReLU + depth",
    isA: "Rectifiers, GPUs and data make deep supervised learning practical",
    answers: "Deep nets train from scratch, no unsupervised pre-training needed",
    structure: "max(0, z) activations, cross-entropy loss, minibatch SGD",
    example: "Nair & Hinton 2010; Glorot, Bordes & Bengio, AISTATS 2011",
    bestFor: "The activation switch that unlocked modern depth",
    limit: "Still needed init and regularization science to be reliable",
  },
  {
    type: "2014-2015 · Training science",
    isA: "Adam, dropout, and principled initialization mature the recipe",
    answers: "Training becomes robust and mostly hyperparameter-forgiving",
    structure: "Adam (alpha 0.001), dropout p 0.5, He init sqrt(2/n)",
    example: "Kingma & Ba ICLR 2015; Srivastava et al. JMLR 2014; He et al. 2015",
    bestFor: "The default stack this guide animates",
    limit: "Why some pieces work is still argued (see the BatchNorm debate)",
  },
  {
    type: "Today · Honest open questions",
    isA: "The same loop at billion-parameter scale, with humility required",
    answers: "Networks work; several whys remain contested",
    structure: "Double descent bends the curves; brain-backprop link unresolved",
    example: "Nakkiran et al. 2019; Lillicrap, Santoro, Marris, Akerman & Hinton 2020",
    bestFor: "Reading the field without the folklore",
    limit: "An explainer that hides these caveats is selling, not teaching",
  },
];

const nnFaqs: FaqItem[] = [
  {
    q: "How many parameters does this network have, exactly?",
    a: "13,002. Computed, not quoted: 784x16 + 16x16 + 16x10 = 12,544 + 256 + 160 = **12,960 weights**, plus 16 + 16 + 10 = **42 biases**. The 3D scene draws every one of the 12,960 weight fibers.",
  },
  {
    q: "Is a neural network really like a brain?",
    a: "No, and the caveat has pedigree. Francis Crick wrote in Nature in 1989 that these nets are 'unrealistic in important respects' as brain models. The sharpest problem is backpropagation itself: cortex has no evident mechanism for shipping exact error signals backward. Lillicrap, Santoro, Marris, Akerman and Hinton's 2020 review argues feedback connections may **locally approximate** those signals. Open question; treat 'neural' as branding.",
  },
  {
    q: "Who invented backpropagation?",
    a: "No single person. Reverse-mode differentiation was published by **Linnainmaa in 1970** (for rounding-error analysis, not learning), applied toward networks by **Werbos**, and independently rediscovered and popularized by **Rumelhart, Hinton and Williams in 1986**, whose real headline was representation learning. Saying '1986 invented backprop' fails a history check.",
  },
  {
    q: "Why is ReLU such a big deal? It's just max(0, z).",
    a: "Two reasons. Without any nonlinearity, stacked layers collapse into a single matrix multiply, so depth means nothing. And the saturating curves used before it (sigmoid, tanh) made gradients **vanish** across depth, a failure diagnosed by Hochreiter (1991) and Bengio, Simard and Frasconi (1994). Glorot, Bordes and Bengio showed in 2011 that the rectifier lets deep networks train from scratch, no pre-training required.",
  },
  {
    q: "Why cross-entropy loss instead of squared error?",
    a: "Because of softmax's exp. Goodfellow, Bengio and Courville put it plainly: the **log in the log-likelihood undoes the exp of the softmax**, so gradients survive saturation; squared error 'is a poor loss function for softmax units' because its gradient vanishes exactly when the network is most confidently wrong.",
  },
  {
    q: "What does Adam actually do?",
    a: "It keeps two running memories per parameter: the average gradient (momentum, decay 0.9) and the average squared gradient (decay 0.999), corrects both for starting at zero, and steps each parameter by **alpha times m-hat over sqrt(v-hat)**. The 2015 paper's tested defaults, alpha 0.001, beta1 0.9, beta2 0.999, are still the ones everyone types.",
  },
  {
    q: "How accurate does this little network get on MNIST?",
    a: "Over **96 percent** on the 10,000 held-out test digits, per Nielsen's book, whose 74-line implementation is this exact architecture. For context, he cites the 2013 record of 9,979/10,000 (Wan, Zeiler, Zhang, LeCun, Fergus) and notes a well-tuned SVM exceeds 98.5 percent. Modern convolutional nets essentially saturate the benchmark.",
  },
  {
    q: "Does the loss always go down while training?",
    a: "No. Curves wobble batch to batch, and the **deep double descent** results (Nakkiran et al., 2019) show test error can get worse before better as models grow or train longer; in specific regimes, even adding training data hurts. Distrust any explainer whose curves only glide smoothly downward.",
  },
  {
    q: "Can one hidden layer really approximate any function?",
    a: "Yes, with the fine print the theorem's own authors wrote. Cybenko (1989) and Hornik, Stinchcombe and White (1989) proved **existence**: some width suffices for any continuous function. Hornik's paper explicitly does not say how many units, and blames real-world failures on 'inadequate learning' among other things. The theorem never promised gradient descent would find the solution.",
  },
  {
    q: "What do the hidden layers actually learn?",
    a: "In big convolutional networks, projected visualizations show a real hierarchy: **corners and edge/color pairs in layer 2, textures in layer 3, class-specific parts like dog faces in layer 4** (Zeiler and Fergus, 2013). In this guide's 16-neuron layers, the honest answer is fuzzier brightness templates that defy tidy labels; the clean hierarchy story belongs to CNNs.",
  },
];

const nnBlocks: Block[] = [
  {
    kind: "p",
    text:
      "Strip away the mythology and a neural network is a small machine: numbers flow left to right through weighted connections, one gate keeps things nonlinear, and learning is nothing but nudging **13,002 dials** downhill against an error signal. The model below is that machine, drawn honestly: every one of its 12,960 weight fibers is really rendered, the descent balls really run gradient descent on the terrain, and every claim traces to the original paper. **Play the journey**, or click any station.",
  },
  { kind: "h2", text: "Watch a digit get recognized, then watch the network learn", id: "interactive" },
  { kind: "nn" },
  {
    kind: "callout",
    title: "What you're looking at",
    text:
      "**Blue**, left: a handwritten five dissolving into 784 pixels, and the lattice they feed. **Violet**, center: the forward pass, the ReLU gates, softmax and the loss meter. **Amber**, back row: the training machinery, a loss terrain with racing descent balls, the Adam formulas, an accuracy monitor. **Green**, back row right: dropout, what the layers detect, and the honest brain question.",
  },
  {
    kind: "callout",
    title: "What is computed and what is staged",
    text:
      "**Real, always:** the lattice is the true 784-16-16-10 wiring with all **12,960 weight fibers drawn one for one**; the descent balls follow paths produced by **actually running gradient descent and momentum** on the terrain function; every number, formula, and quote comes from the cited paper. **Real, in Train mode:** press Train and this exact network **genuinely trains in your browser** on 10,000 real MNIST digits: the wall shows the digit being learned, the neurons carry its actual activations, the belief bars are the network's live output, fiber brightness tracks learned weight magnitudes, and the accuracy curve is a real log against 1,000 held-out digits (the seeded reference run reaches 92.8% in 20 epochs; Nielsen reports 96%+ with the full 60,000). **Staged in the guided journey:** the choreographed signal flows, the hand-drawn five, and the terrain, a 2D stand-in for a 13,002-dimensional loss surface. An explainer that blurs this line does not deserve your trust, so here it is in writing.",
  },
  { kind: "h3", text: "Train it yourself, for real" },
  {
    kind: "p",
    text:
      "Open the **Train** tab in the explorer above. The browser fetches 10,000 genuine MNIST digits (a deterministic first-10,000 slice, so nothing is cherry-picked) plus 1,000 held-out test digits, and runs the same loop this guide teaches: forward pass, cross-entropy, backpropagation, Adam with the paper's default settings. Early on the belief bars flail and the amber truth marker disagrees with the green guess; a minute later the network is right about nine times in ten on handwriting it has never seen. That transition, chaos becoming competence with nothing but gradient nudges, is the entire field in one minute.",
  },
  { kind: "h2", text: "The journey, in plain text", id: "journey" },
  {
    kind: "p",
    text:
      "The same 16 steps the interactive journey walks through, as text, for reading (and for the crawlers and answer engines that can't run WebGL).",
  },
  { kind: "nnjourney" },
  { kind: "h2", text: "Every station, with sources", id: "stations" },
  { kind: "nnstages" },
  { kind: "h2", text: "The vocabulary that unlocks the papers", id: "terms" },
  { kind: "termcard", termSlug: "artificial-neuron" },
  { kind: "termcard", termSlug: "relu" },
  { kind: "termcard", termSlug: "softmax-layer" },
  { kind: "termcard", termSlug: "cross-entropy" },
  { kind: "termcard", termSlug: "gradient-descent" },
  { kind: "termcard", termSlug: "backpropagation" },
  { kind: "termcard", termSlug: "adam" },
  { kind: "termcard", termSlug: "weight-initialization" },
  { kind: "termcard", termSlug: "dropout-regularization" },
  { kind: "termcard", termSlug: "universal-approximation" },
  { kind: "h2", text: "Six eras, 1943 to today", id: "eras" },
  {
    kind: "p",
    text:
      "The unit barely changed since 1958: weighted sum, bias, nonlinearity. What changed is everything around it, and most popular histories get the credits wrong. This table keeps them straight.",
  },
  { kind: "comparison" },
  {
    kind: "callout",
    title: "Why this guide is unusually careful",
    text:
      "Every fact here survived a two-round, adversarially verified research pass against primary sources: the original 1943 and 1958 papers, the 1986 Nature paper, the Adam and dropout papers, PubMed abstracts for the brain debate. Where the field itself is uncertain (why BatchNorm helps, whether cortex approximates backprop), the guide says **contested** instead of picking a side. The knowledge base with every citation is linked in the sources.",
  },
  { kind: "h2", text: "Questions everyone asks", id: "faq" },
  { kind: "faq" },
  {
    kind: "related",
    items: [
      { label: "How LLMs Work: the same treatment for the transformer that grew out of this machine", href: "/guides/how-llms-work" },
      { label: "The AI Learning Roadmap: where neural networks sit in an 18-week path", href: "/notebook/ai" },
      { label: "The AI Concepts Encyclopedia: 187 concepts with definitions and sources", href: "/notebook/ai/encyclopedia" },
    ],
  },
  {
    kind: "sources",
    items: [
      { label: "3Blue1Brown: But what is a neural network? (Deep learning chapter 1)", href: "https://www.youtube.com/watch?v=aircAruvnKk", note: "The visual grammar this guide builds on; chapters 1-4 cover network, gradient descent, backprop" },
      { label: "Nielsen: Neural Networks and Deep Learning (free book)", href: "http://neuralnetworksanddeeplearning.com/", note: "The 784-16-16-10 network, MNIST facts, and the over-96% figure come from chapter 1" },
      { label: "Karpathy: Neural Networks: Zero to Hero", href: "https://karpathy.ai/zero-to-hero.html", note: "Backprop-first teaching: building micrograd from scratch" },
      { label: "Deng (2012): The MNIST database of handwritten digit images for machine learning research", href: "https://doi.org/10.1109/MSP.2012.2211477", note: "IEEE Signal Processing Magazine; the dataset the Train mode really trains on" },
      { label: "Goodfellow, Bengio & Courville: Deep Learning, ch. 6 (free)", href: "https://www.deeplearningbook.org/contents/mlp.html", note: "Softmax-with-log-likelihood argument, section 6.2.2.3" },
      { label: "McCulloch & Pitts (1943): A logical calculus of the ideas immanent in nervous activity", href: "https://doi.org/10.1007/BF02478259", note: "The 1943 unit: a logic gate, no learning rule" },
      { label: "Rosenblatt (1958): The perceptron: a probabilistic model", href: "https://doi.org/10.1037/h0042519", note: "Psychological Review 65(6); a theory paper, not the Mark I machine" },
      { label: "Cybenko (1989): Approximation by superpositions of a sigmoidal function", href: "https://doi.org/10.1007/BF02551274", note: "Universal approximation: existence only" },
      { label: "Hornik, Stinchcombe & White (1989): Multilayer feedforward networks are universal approximators", href: "https://doi.org/10.1016/0893-6080(89)90020-8", note: "With the authors' own disclaimers about unit counts and learning" },
      { label: "Rumelhart, Hinton & Williams (1986): Learning representations by back-propagating errors", href: "https://doi.org/10.1038/323533a0", note: "Nature 323; the popularizing paper, squared-error loss" },
      { label: "Linnainmaa (1976): Taylor expansion of the accumulated rounding error", href: "https://doi.org/10.1007/BF01931367", note: "Reverse-mode differentiation, published before backprop was backprop" },
      { label: "Griewank (2012): Who invented the reverse mode of differentiation?", href: "https://ftp.gwdg.de/pub/misc/EMIS/journals/DMJDMV/vol-ismp/52_griewank-andreas-b.pdf", note: "The credit history and the cheap gradient principle" },
      { label: "Baydin, Pearlmutter, Radul & Siskind (2018): Automatic differentiation in ML: a survey", href: "https://arxiv.org/abs/1502.05767", note: "Backprop as reverse-mode AD; cost bounds" },
      { label: "Nair & Hinton (2010): Rectified linear units improve restricted Boltzmann machines", href: "https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf", note: "Noisy ReLUs in RBMs, NORB and LFW gains" },
      { label: "Glorot, Bordes & Bengio (2011): Deep sparse rectifier neural networks", href: "https://proceedings.mlr.press/v15/glorot11a.html", note: "Plain ReLU: deep supervised training without pre-training" },
      { label: "Bengio, Simard & Frasconi (1994): Learning long-term dependencies with gradient descent is difficult", href: "https://doi.org/10.1109/72.279181", note: "Vanishing gradients, IEEE TNN" },
      { label: "Hendrycks & Gimpel (2016): Gaussian Error Linear Units", href: "https://arxiv.org/abs/1606.08415", note: "GELU = x · Phi(x)" },
      { label: "Bridle (1989): Training stochastic model recognition algorithms as networks", href: "https://proceedings.neurips.cc/paper_files/paper/1989/hash/0336dcbab05b9d5ad24f4333c7658a0e-Abstract.html", note: "Softmax's entry into neural networks" },
      { label: "Robbins & Monro (1951): A stochastic approximation method", href: "https://doi.org/10.1214/aoms/1177729586", note: "The ancestor of SGD" },
      { label: "Polyak (1964): Some methods of speeding up the convergence of iteration methods", href: "https://doi.org/10.1016/0041-5553(64)90137-5", note: "Momentum" },
      { label: "Kingma & Ba (2015): Adam: a method for stochastic optimization", href: "https://arxiv.org/abs/1412.6980", note: "Algorithm 1 and the defaults quoted in this guide" },
      { label: "Glorot & Bengio (2010): Understanding the difficulty of training deep feedforward networks", href: "https://proceedings.mlr.press/v9/glorot10a.html", note: "Normalized initialization, eq. 16" },
      { label: "He, Zhang, Ren & Sun (2015): Delving deep into rectifiers", href: "https://arxiv.org/abs/1502.01852", note: "sqrt(2/n) init; 4.94% vs 5.1% human top-5" },
      { label: "Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov (2014): Dropout", href: "https://jmlr.org/papers/v15/srivastava14a.html", note: "JMLR 15(56); p values and the test-time scaling rule" },
      { label: "Zeiler & Fergus (2013): Visualizing and understanding convolutional networks", href: "https://arxiv.org/abs/1311.2901", note: "The layer-hierarchy evidence, scoped to CNNs" },
      { label: "Olah, Mordvintsev & Schubert (2017): Feature visualization", href: "https://distill.pub/2017/feature-visualization/", note: "Distill; what is shown vs interpreted" },
      { label: "Crick (1989): The recent excitement about neural networks", href: "https://doi.org/10.1038/337129a0", note: "Nature 337; the canonical brain-model objection" },
      { label: "Lillicrap, Santoro, Marris, Akerman & Hinton (2020): Backpropagation and the brain", href: "https://doi.org/10.1038/s41583-020-0277-3", note: "Nature Reviews Neuroscience; the NGRAD reply" },
      { label: "Nakkiran, Kaplun, Bansal, Yang, Barak & Sutskever (2019): Deep double descent", href: "https://arxiv.org/abs/1912.02292", note: "Worse before better; more data can hurt" },
    ],
  },
];


/* ================================================================== *
 *  How Quantum Computers Work
 * ================================================================== */

const qcTerms: DefinedTerm[] = [
  {
    slug: "qubit",
    term: "Qubit",
    aka: ["quantum bit"],
    oneLiner: "The quantum unit of information: a two-level system whose state is a weighted blend of 0 and 1 until measured.",
    inDepth:
      "A qubit state is |psi> = a|0> + b|1> with complex amplitudes satisfying |a|^2 + |b|^2 = 1. Unlike a probability, an amplitude carries a phase, and phases are what interfere. Physically a qubit is the two lowest levels of a superconducting circuit, one trapped ion's internal states, one atom, or one photon's polarization. The information is analog and fragile in a way no classical bit is, which is why the rest of the machine exists.",
    analogy: "A coin still spinning on the table, whose spin axis you can steer with perfect precision until the moment someone slaps it flat.",
    example: "IBM, Google and Rigetti build transmon qubits; IonQ and Quantinuum trap ytterbium ions; QuEra holds rubidium atoms in laser tweezers.",
    agentRole: "Every quantum roadmap number you read, 105 qubits, 1,000 qubits, counts these. The count that will matter more is logical qubits.",
  },
  {
    slug: "superposition",
    term: "Superposition",
    oneLiner: "A definite quantum state that assigns amplitude to several classical outcomes at once; not indecision, and not parallel computation.",
    inDepth:
      "Superposition is the linearity of quantum mechanics: valid states can be added. A register of n qubits carries 2^n amplitudes, which grows beyond any classical memory around n = 50. The catch that pop science omits: measurement samples exactly one outcome. Amplitudes are leverage for interference, not free parallelism, and algorithms that beat classical computers do it by choreography, not by brute enumeration.",
    analogy: "One wave on a pond holding the imprint of every stone thrown in, readable only by how the ripples reinforce and cancel.",
    example: "Four qubits after four Hadamard gates hold equal amplitude on all 16 four-bit strings; measuring yields one string, uniformly at random.",
    agentRole: "The single most common error in quantum coverage is 'tries all answers simultaneously'. A source that says this is not a reliable source.",
  },
  {
    slug: "entanglement",
    term: "Entanglement",
    oneLiner: "Correlation between qubits so strong that the pair has one state which cannot be split into individual states.",
    inDepth:
      "An entangled pair like (|00> + |11>)/sqrt(2) yields perfectly correlated measurement outcomes, at any separation, with no signal passing between them; Bell-inequality experiments have closed the loopholes and earned the 2022 physics Nobel. In a processor, entanglement is manufactured by two-qubit gates and consumed as the resource that lets n qubits explore a state space no n separate qubits could.",
    analogy: "Two halves of a torn ticket sealed in envelopes: open one anywhere and you know the other, except quantum correlations are provably stronger than any torn-ticket story can explain.",
    example: "A Hadamard on qubit A followed by CNOT from A to B turns |00> into the Bell state used to calibrate every two-qubit gate.",
    agentRole: "Entangling-gate error is the metric that decides everything downstream, because two-qubit gates are ten times worse than one-qubit gates on every platform.",
  },
  {
    slug: "transmon",
    term: "Transmon",
    oneLiner: "The dominant superconducting qubit: a Josephson junction shunted by a capacitor, whose uneven energy ladder makes the bottom two levels addressable.",
    inDepth:
      "An ordinary LC circuit has evenly spaced levels, so a drive that excites 0 to 1 also excites 1 to 2. The Josephson junction's nonlinear inductance bends the ladder, typically by -200 to -300 MHz, so the bottom transition can be driven selectively at 4 to 8 GHz. The transmon design (Koch et al., 2007) trades charge sensitivity for that clean addressability, which is why Google, IBM and Rigetti all build variants of it.",
    analogy: "A guitar with deliberately uneven frets, so the two notes you care about can be played without ever sounding the third.",
    example: "Google's Willow chip is 105 transmons; its junctions are Al/AlOx/Al tunnel junctions with an ultrathin oxide barrier.",
    agentRole: "When a headline says 'N-qubit chip' from IBM or Google, it means N transmons plus their resonators, couplers, and wiring.",
  },
  {
    slug: "dilution-refrigerator",
    term: "Dilution Refrigerator",
    oneLiner: "The machine that holds superconducting qubits at ten to twenty millikelvin, using helium-3 dissolving into helium-4 as its final cooling stage.",
    inDepth:
      "A pulse-tube cryocooler reaches about 4 K; below that, circulating helium-3 crossing into a dilute helium-4 phase absorbs heat, stepping down through the still (~0.9 K) and cold plate (~0.1 K) to the mixing chamber (~0.01 K). The golden chandelier photos show the plate stack with its vacuum cans removed. Every plate also serves as a thermal anchor for the wiring, bleeding room-temperature noise out of the lines before it reaches the chip.",
    analogy: "A six-story descent where each floor is quieter by a factor the one above cannot imagine, and the basement is over a hundred times colder than outer space.",
    example: "Bluefors and Oxford Instruments fridges cool most of the world's superconducting processors; base temperature near 10 mK against the cosmic background's 2.7 K.",
    agentRole: "The fridge, not the chip, sets much of the engineering agenda: wiring density, heat budget per line, and why million-qubit machines need new cryogenic architecture.",
  },
  {
    slug: "quantum-gate",
    term: "Quantum Gate",
    oneLiner: "A reversible operation on one or two qubits; physically, a shaped microwave or laser pulse lasting nanoseconds to microseconds.",
    inDepth:
      "Mathematically a gate is a unitary matrix; a one-qubit gate is a rotation of the Bloch sphere. Physically, a resonant pulse's duration and amplitude set the rotation angle, with envelope shaping (DRAG) suppressing leakage. Any computation can be built from one-qubit rotations plus one entangling gate such as CNOT or CZ, which is what 'universal gate set' means. Superconducting gates run in 10 to 200 ns; trapped-ion gates in tens of microseconds but with higher fidelity.",
    analogy: "Pushing a swing at exactly its own rhythm: the length of the push, not its violence, decides the final angle.",
    example: "A Hadamard takes |0> to the equator of the Bloch sphere; two of them in a row take it back, which is interference in miniature.",
    agentRole: "Gate error times circuit depth is the honest capacity of any chip; that product, not qubit count, predicts what a device can run.",
  },
  {
    slug: "measurement",
    term: "Measurement",
    oneLiner: "The act that turns amplitudes into one classical outcome, destroying the superposition it sampled.",
    inDepth:
      "The Born rule gives outcome probabilities as squared amplitudes; after the result, the state is the outcome (collapse). Superconducting processors measure dispersively: each qubit shifts its readout resonator's frequency by a state-dependent amount, so a probe tone returns phase-shifted, is amplified by a TWPA (20-30 dB) then a HEMT (~40 dB), and lands as a point in one of two clouds on the IQ plane. Around 99% assignment fidelity in under a hundred nanoseconds has been demonstrated.",
    analogy: "Asking the spinning coin one blunt yes-or-no question. You get an answer, and the spin is gone.",
    example: "Mid-circuit measurement of ancilla qubits, without disturbing data qubits, is the operation that makes error correction possible at all.",
    agentRole: "Readout error is a first-class error budget line, and 'measurement collapses the state' is why quantum RAM-style intuitions fail.",
  },
  {
    slug: "decoherence",
    term: "Decoherence",
    oneLiner: "The environment learning about a qubit and thereby destroying its quantum character; quantified by the times T1 and T2.",
    inDepth:
      "T1 is energy relaxation, the excited state decaying; T2 is dephasing, the phase relationship scrambling, bounded by T2 <= 2*T1. Any interaction that could in principle reveal the qubit's state acts as an unwanted measurement: stray photons, magnetic flux noise, quasiparticles, even cosmic-ray strikes that briefly poison a whole chip. Modern transmons sit near 100 microseconds; against 30-nanosecond gates that is a budget of a few thousand operations.",
    analogy: "Writing in wet sand as the tide comes in: T1 washes letters away, T2 blurs them where they stand.",
    example: "Doubling T1 has repeatedly required new materials and geometry, from 3D cavities to tantalum films; it does not come from cleverness in software.",
    agentRole: "Coherence time divided by gate time is the depth budget, the number that explains why error correction is not optional.",
  },
  {
    slug: "logical-qubit",
    term: "Logical Qubit & Surface Code",
    oneLiner: "One error-protected qubit knitted from many physical ones, with stabilizer measurements catching errors without reading the data.",
    inDepth:
      "No-cloning forbids backups, so redundancy is entangled instead: a distance-d surface code patch uses on the order of 2d^2 physical qubits, and ancillas repeatedly measure parity checks whose violations locate errors. A classical decoder must keep pace with the roughly 1-microsecond syndrome cycle. Google's Willow result (2024) crossed the threshold in practice: each step from distance 3 to 5 to 7 cut logical error by about half, meaning bigger patches finally mean better qubits.",
    analogy: "A choir holding one note where you may only ever ask pairs of singers whether they agree, never anyone for the note itself.",
    example: "Estimates for breaking RSA-2048 run to roughly 20 million physical qubits, which is the distance between today's chips and cryptographic relevance.",
    agentRole: "Logical qubit counts and logical error rates are the roadmap numbers that matter now; physical qubit counts alone stopped being informative in 2024.",
  },
  {
    slug: "nisq",
    term: "NISQ Era",
    oneLiner: "Preskill's name for the current period: Noisy Intermediate-Scale Quantum devices, powerful enough to be interesting, too noisy for guarantees.",
    inDepth:
      "Coined in 2018, NISQ describes machines of tens to thousands of physical qubits without full error correction. They have demonstrated sampling tasks beyond classical simulation and increasingly credible error-mitigated physics experiments, but no commercially valuable problem is yet solved faster than classical computing. The field is now transitioning: below-threshold error correction in 2024 marks the start of the early fault-tolerant era, with useful logical machines projected toward the end of the decade.",
    analogy: "Aviation in 1908: the machines demonstrably fly, crash often, carry no freight, and are obviously the future anyway.",
    example: "Variational algorithms (VQE, QAOA) were designed for NISQ constraints; their practical advantage remains unproven after a decade of effort.",
    agentRole: "NISQ is the calibration word: any claim of present-day quantum business value should be weighed against what NISQ honestly means.",
  },
];

const qcComparison: ComparisonRow[] = [
  {
    type: "Superconducting",
    isA: "Transmon circuit on a chip",
    answers: "Microwave pulses, tunable couplers",
    structure: "Gates in 10-200 ns",
    example: "~99.7-99.9% two-qubit",
    bestFor: "Speed, fab scalability, below-threshold QEC shown",
    limit: "Millikelvin fridge, wiring per qubit, short coherence",
  },
  {
    type: "Trapped ion",
    isA: "One charged atom in an RF trap",
    answers: "Laser pulses via shared motion",
    structure: "Gates in 10-100+ µs",
    example: ">99.9% two-qubit (best published)",
    bestFor: "Fidelity, identical qubits, all-to-all in a chain",
    limit: "Slow gates, hard to scale past one chain",
  },
  {
    type: "Neutral atom",
    isA: "One atom in an optical tweezer",
    answers: "Rydberg blockade between neighbors",
    structure: "Gates in ~1 µs or less",
    example: "~99.5% two-qubit (2023-24 results)",
    bestFor: "Thousands of traps, rearrangeable geometry",
    limit: "Atom loss, readout speed, younger toolchain",
  },
  {
    type: "Photonic",
    isA: "A photon's mode or polarization",
    answers: "Interferometers, measurement-based fusion",
    structure: "Gates at light speed, probabilistic",
    example: "Depends on scheme; loss-dominated",
    bestFor: "Room temperature (mostly), networking, chips from fabs",
    limit: "Photon loss, nondeterministic gates, detectors need cryo",
  },
];

const qcFaqs: FaqItem[] = [
  {
    q: "Does a quantum computer try every answer at once?",
    a: "No, and this is the most important correction in the field. A register of n qubits holds 2^n amplitudes, but measurement returns exactly one outcome, sampled by those amplitudes. Algorithms win by arranging interference so wrong outcomes cancel and right ones reinforce before anyone measures. Grover's search, for example, gives a square-root speedup, not the instant lookup the parallel-worlds picture would predict, and that gap is the proof the picture is wrong.",
  },
  {
    q: "Why does it have to be colder than outer space?",
    a: "A superconducting qubit's two levels are separated by roughly a 5 GHz microwave photon's worth of energy, which is tiny. For thermal noise not to excite the qubit at random, the chip must be far colder than that energy scale, which lands at 10 to 20 millikelvin, about 150 times colder than the 2.7 kelvin cosmic microwave background. The cold also keeps the aluminum circuits superconducting, so they carry signals without resistance or its noise.",
  },
  {
    q: "Is the golden chandelier the computer?",
    a: "The chandelier is the inside of the refrigerator: gold-plated copper plates at successively colder temperatures, laced with cabling and amplifiers. The computer itself is a chip about the size of a thumbnail, mounted in magnetic shielding below the coldest plate. Trapped-ion and neutral-atom machines look completely different: a steel vacuum chamber surrounded by laser optics, running near room temperature.",
  },
  {
    q: "Will quantum computers break my encryption?",
    a: "Eventually, for some encryption. Shor's algorithm provably breaks RSA and elliptic-curve cryptography, but running it on RSA-2048 is estimated to need on the order of 20 million noisy physical qubits, against 105 qubits on 2024's flagship error-corrected chip. That is why the migration to post-quantum cryptography standards is happening now, calmly, years ahead: data stolen today could be decrypted later. Symmetric encryption like AES-256 is not meaningfully threatened.",
  },
  {
    q: "What are quantum computers actually good for?",
    a: "The honest list is short. Simulating quantum systems, meaning chemistry, materials, and physics, is the original motivation and the strongest case. Factoring and related number theory breaks certain cryptography. Unstructured search gets a quadratic speedup only. Claimed advantages in optimization and machine learning remain unproven hypotheses. A quantum computer is a wind tunnel for nature's own quantum behavior, not a faster general-purpose computer.",
  },
  {
    q: "What is a logical qubit and why does everyone suddenly count them?",
    a: "A logical qubit is one error-corrected qubit encoded across many physical qubits, with stabilizer measurements catching errors as they happen. It became the headline number after 2024, when Google's Willow demonstrated below-threshold error correction, meaning bigger codes now yield better qubits. Physical counts stopped being comparable across platforms years ago; logical qubit count times logical error rate is the honest scoreboard.",
  },
  {
    q: "Can I program a real quantum computer today?",
    a: "Yes, free. IBM exposes real superconducting processors through Qiskit with a no-cost tier, and other platforms are reachable through cloud services. You write circuits in Python, they compile to pulses, run on genuine hardware in a dilution refrigerator, and return shot counts. Expect noisy results and small circuits; expect also that nothing teaches the reality of decoherence faster than watching your textbook circuit come back 12% wrong.",
  },
  {
    q: "Do entangled qubits communicate faster than light?",
    a: "No. Measuring one half of an entangled pair fixes the other's outcome instantly, but neither party controls which outcome occurs, so no information travels. Proving that no-signalling holds is straightforward quantum mechanics, and it is why entanglement powers computation and cryptographic key distribution but cannot power a telegraph.",
  },
];

const qcBlocks: Block[] = [
  {
    kind: "p",
    text:
      "Strip away the mystique and a quantum computer is a machine with one strange talent: it steers **amplitudes**, complex-valued weights over every possible answer, so that wrong answers cancel and right ones reinforce. It does not try everything at once, and most of its mass is a refrigerator. The model below is that machine, drawn honestly: the fridge plates at their real temperatures, drive pulses that visibly attenuate on the way down, a readout echo amplified on the way back up, and an interference station where the actual trick happens. **Play the journey**, or click any station.",
  },
  { kind: "h2", text: "Walk through the machine", id: "interactive" },
  { kind: "quantum" },
  {
    kind: "callout",
    title: "What you're looking at",
    text:
      "**Blue**, front right: the physics, a bit becoming a Bloch sphere, sixteen amplitude bars collapsing to one winner, an entangled pair whose meters always agree. **Gold**, center left: the dilution refrigerator, six plates from 300 kelvin to fifteen thousandths of a degree, with the chip in shields at the bottom, plus the rival ion-trap and atom-array platforms. **Violet**, middle row: a program running, compiler to microwave pulse to interference to the readout clouds. **Green**, back: the hard part, coherence draining, the error-correction grid, and the honest scoreboard.",
  },
  {
    kind: "callout",
    title: "What is computed and what is staged",
    text:
      "**Real:** every temperature, time, count and error rate a label shows comes from src/data/quantum.ts, which traces to a knowledge base built from primary sources and then adversarially re-verified; the fridge geometry follows the real plate stack; the attenuation and amplification the wiring animation shows are the real signal chain. **Staged:** the animations are choreography, not simulation. The amplitude bars, the interference waves and the error-correction cycle illustrate the mechanisms; no Schrodinger equation is being integrated in your browser. An explainer that blurs this line does not deserve your trust, so here it is in writing.",
  },
  { kind: "h2", text: "The journey, in plain text", id: "journey" },
  {
    kind: "p",
    text:
      "The same 16 steps the interactive journey walks through, as text, for reading (and for the crawlers and answer engines that can't run WebGL).",
  },
  { kind: "quantumjourney" },
  { kind: "h2", text: "Every station, with sources", id: "stations" },
  { kind: "quantumstages" },
  { kind: "h2", text: "The vocabulary that unlocks the papers", id: "terms" },
  { kind: "stack" },
  { kind: "h2", text: "Four ways to build a qubit", id: "platforms" },
  {
    kind: "p",
    text:
      "No platform has won. Superconducting circuits are fastest and furthest on error correction; trapped ions are slowest and most precise; neutral atoms scale to the largest arrays; photonics bets on telecom-style manufacturing. The honest comparison:",
  },
  { kind: "comparison" },
  { kind: "h2", text: "Questions people actually ask", id: "faq" },
  { kind: "faq" },
  { kind: "h2", text: "Primary sources & further reading", id: "sources" },
  {
    kind: "sources",
    items: [
      { label: "Nielsen & Chuang, Quantum Computation and Quantum Information", href: "https://doi.org/10.1017/CBO9780511976667", note: "The standard textbook; chapters 1-2 cover everything in Act I." },
      { label: "Krantz et al. (2019), A Quantum Engineer's Guide to Superconducting Qubits", href: "https://arxiv.org/abs/1904.06560", note: "The canonical hardware review behind Act II: control, readout, cryogenics." },
      { label: "Koch et al. (2007), the transmon paper", href: "https://arxiv.org/abs/cond-mat/0703002", note: "Charge-insensitive qubit design; why the energy ladder is uneven." },
      { label: "Preskill (2018), Quantum Computing in the NISQ era and beyond", href: "https://arxiv.org/abs/1801.00862", note: "The paper that named the current era and framed its honest limits." },
      { label: "Google Quantum AI (2024), quantum error correction below the surface code threshold", href: "https://www.nature.com/articles/s41586-024-08449-y", note: "Willow: logical error halving with code distance, the field's 2024 milestone." },
      { label: "Shor (1994/97), Polynomial-time factoring on a quantum computer", href: "https://arxiv.org/abs/quant-ph/9508027", note: "The algorithm that made cryptographers care." },
      { label: "Grover (1996), A fast quantum mechanical algorithm for database search", href: "https://arxiv.org/abs/quant-ph/9605043", note: "Quadratic search speedup, provably optimal." },
      { label: "Feynman (1982), Simulating physics with computers", href: "https://doi.org/10.1007/BF02650179", note: "The founding argument: nature is quantum, so simulate it quantumly." },
      { label: "Gidney & Ekera (2019), How to factor 2048-bit RSA integers in 8 hours using 20 million noisy qubits", href: "https://arxiv.org/abs/1905.09749", note: "The standard resource estimate separating today from cryptographic relevance." },
      { label: "Macklin et al. (2015), A near-quantum-limited Josephson traveling-wave parametric amplifier", href: "https://doi.org/10.1126/science.aaa8525", note: "The TWPA: how a readout whisper gets amplified without drowning it." },
      { label: "Molmer & Sorensen (1999), Multiparticle entanglement of hot trapped ions", href: "https://arxiv.org/abs/quant-ph/9810040", note: "The workhorse two-qubit gate of every trapped-ion machine." },
      { label: "IBM Quantum Learning", href: "https://learning.quantum.ibm.com/", note: "Free courses and the path to running circuits on real hardware today." },
    ],
  },
  {
    kind: "related",
    items: [
      { label: "How LLMs Work: the 3D interactive guide", href: "/guides/how-llms-work" },
      { label: "How Neural Networks Work: fly through 13,002 parameters", href: "/guides/how-neural-networks-work" },
      { label: "The AI Concepts Encyclopedia: 187 concepts with definitions and sources", href: "/notebook/ai/encyclopedia" },
    ],
  },
];

export const guides: Guide[] = [
  sfGuide,
  {
    slug: "graph-types-for-ai-agents",
    title: "Graph Types for AI Agents",
    metaTitle: "Knowledge Graph vs Vector Database vs Ontology (2026)",
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
    metaTitle: "Interactive 3D HVAC Troubleshooting Guide (2026)",
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

  /* ==================================================================== *
   *  GUIDE 3 — How LLMs Work (interactive 3D)
   * ==================================================================== */
  {
    slug: "how-llms-work",
    title: "How LLMs Work",
    metaTitle: "How LLMs Work: An Interactive 3D Walkthrough",
    metaDescription:
      "Watch a prompt become an answer inside a 3D model of a large language model: tokenization, embeddings, attention, mixture-of-experts, the KV cache, sampling, and the 2025-2026 reasoning-RL frontier — one animated stage at a time.",
    headline: "How LLMs Work — Watch a Thought Get Computed",
    kicker: "Interactive Explainer",
    subhead:
      "From your keystrokes to the model's next word: tokenizer, embeddings, 96 layers of attention and experts, a 200,000-way dice roll — and the loop that runs it all again. Updated for the MoE + reasoning-model era.",
    deck: `Every stage a prompt passes through, modeled as an explorable 3D machine. ${LLM_COUNTS.stages} stages, a ${LLM_COUNTS.journeySteps}-step guided journey tracing one token from "The cat sat on the" to "mat", real parameter counts from GPT-3 to DeepSeek-V3, and the training story — pretraining, RLHF, and the reasoning-RL breakthrough.`,
    author: {
      name: "Venkata Pagadala",
      title: "AI Product Manager (Search · SEO · GEO)",
      org: "AT&T",
      url: "/about",
      bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the AI Systems Map and the AI Concepts Encyclopedia on this site.",
    },
    datePublished: "2026-07-11",
    dateModified: "2026-07-11",
    readingTime: "18 min read",
    tags: ["LLM", "Transformers", "Attention", "Mixture of Experts", "Reasoning Models", "3D Interactive", "AI Explainer"],
    terms: llmTerms,
    comparison: llmComparison,
    faqs: llmFaqs,
    blocks: llmBlocks,
    termRoleLabel: "Why it matters",
    comparisonHeaders: ["Era / model", "Scale", "Key innovation", "Training recipe", "Example systems", "What it unlocked", "Limit"],
    howTos: llmHowTos,
  },

  /* ==================================================================== *
   *  GUIDE 4: How Neural Networks Work (interactive 3D)
   * ==================================================================== */
  {
    slug: "how-neural-networks-work",
    title: "How Neural Networks Work",
    metaTitle: "How Neural Networks Work: 3D Interactive Guide",
    metaDescription:
      "A 3D neural network with all 13,002 parameters drawn: the forward pass, ReLU, softmax, backprop, gradient descent, Adam, dropout. Every claim primary-sourced.",
    headline: "How Neural Networks Work: Fly Through 13,002 Parameters",
    kicker: "Interactive Explainer",
    subhead:
      "A handwritten five becomes 784 numbers, ripples through a lattice you can orbit, and comes out as a belief. Then the error flows backward and you watch the machine learn. Every fiber drawn, every claim from the original papers.",
    deck: `The canonical 784-16-16-10 MNIST network as an explorable 3D machine: ${NN_COUNTS.stages} stations across ${NN_COUNTS.acts} acts, a ${NN_COUNTS.journeySteps}-step guided journey from pixels to the brain question, all ${NN_WEIGHTS.toLocaleString("en-US")} weight connections really drawn, and a training row where gradient descent is really computed on an illustrative loss terrain, and a Train mode where the network genuinely learns 10,000 real MNIST digits in your browser.`,
    author: {
      name: "Venkata Pagadala",
      title: "AI Product Manager (Search · SEO · GEO)",
      org: "AT&T",
      url: "/about",
      bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the AI Systems Map and the How LLMs Work 3D explainer on this site.",
    },
    datePublished: "2026-08-15",
    dateModified: "2026-08-15",
    readingTime: "20 min read",
    tags: ["Neural Networks", "Deep Learning", "Backpropagation", "Gradient Descent", "MNIST", "3D Interactive", "AI Explainer"],
    terms: nnTerms,
    comparison: nnComparison,
    faqs: nnFaqs,
    blocks: nnBlocks,
    termRoleLabel: "Why it matters",
    comparisonHeaders: ["Era", "What it was", "What it established", "Mechanism", "Anchor", "What it unlocked", "Limit"],
  },
  {
    slug: "how-quantum-computers-work",
    title: "How Quantum Computers Work",
    metaTitle: "How Quantum Computers Work: 3D Interactive Guide",
    metaDescription:
      "Fly through a dilution refrigerator to the chip: qubits, superposition without the parallel-universe myth, gates as microwave pulses, interference, readout, and error correction. Primary-sourced.",
    headline: "How Quantum Computers Work: Fly Down the Golden Chandelier",
    kicker: "Interactive Explainer",
    subhead:
      "A bit becomes a sphere, sixteen amplitudes collapse to one answer, and a microwave pulse rides six frozen floors down to a chip colder than deep space. Then the honest part: how errors are tamed, and what these machines are really for. Every claim from primary sources, adversarially re-verified.",
    deck: `The machine as an explorable 3D film set: ${QC_COUNTS.stages} stations across ${QC_COUNTS.acts} acts, a ${QC_COUNTS.journeySteps}-step guided journey from one qubit to the honest scoreboard, the dilution refrigerator drawn plate by plate at its real temperatures, the signal chain attenuating down and amplifying up exactly as the engineering references describe, and an interference station that shows where quantum answers actually come from. No parallel-universe myths survive contact with this page.`,
    author: {
      name: "Venkata Pagadala",
      title: "AI Product Manager (Search · SEO · GEO)",
      org: "AT&T",
      url: "/about",
      bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the How LLMs Work and How Neural Networks Work 3D explainers on this site.",
    },
    datePublished: "2026-08-29",
    dateModified: "2026-08-29",
    readingTime: "22 min read",
    tags: ["Quantum Computing", "Qubits", "Superposition", "Quantum Error Correction", "Dilution Refrigerator", "3D Interactive", "Physics Explainer"],
    terms: qcTerms,
    comparison: qcComparison,
    faqs: qcFaqs,
    blocks: qcBlocks,
    termRoleLabel: "Why it matters",
    comparisonHeaders: ["Platform", "The qubit is", "Gates via", "Gate speed", "Two-qubit fidelity", "Strength", "Limit"],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
