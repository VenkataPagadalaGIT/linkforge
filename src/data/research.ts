/**
 * Peer-reviewed and published research, in one place.
 *
 * This is the single source of truth for the papers. The nav, the homepage
 * credential strip, the About page, the footer and /publications all read
 * from here, because the previous arrangement listed titles as plain text in
 * one component with `link: "#"` and no verifiable destination anywhere on
 * the site. Published work that a reader cannot open is indistinguishable
 * from a claim, so every entry below carries a real, resolvable URL.
 */

export interface ResearchPaper {
  title: string;
  /** Short label for tight spaces: nav notes, footer rows. */
  shortTitle: string;
  venue: string;
  year: string;
  /** Where the paper actually lives. Never "#". */
  url: string;
  /** Repository name, shown as the provenance chip. */
  host: "SSRN" | "ResearchGate" | "Journal";
  /**
   * Peer review status, stated as the venue states it. A preprint is not a
   * weaker peer-reviewed paper, it is a different kind of object, and the two
   * are never presented as the same.
   */
  review?: "peer-reviewed" | "preprint";
  /** Every author, in the order printed on the paper. */
  authors?: string[];
  /** 1-based position of Venkata in `authors`. */
  authorPosition?: number;
  /** Stable anchor for deep links from the nav and the talks page. */
  slug?: string;
  volume?: string;
  issue?: string;
  pageRange?: string;
  publisher?: string;
  /** One line a non-academic reader understands. */
  summary: string;
  /** Posting or publication date as shown by the repository. */
  posted?: string;
  /** The author's own keywords, as listed on the paper. */
  keywords?: string[];
  /** Full repository-style detail (renders the SSRN-like card). */
  abstract?: string;
  pages?: number;
  postedOnline?: string;
  dateWritten?: string;
  doiUrl?: string;
  ssrnShortUrl?: string;
  jel?: string;
  affiliation?: string;
}

export const researchPapers: ResearchPaper[] = [
  {
    title:
      "The Disruption of Search Engine Optimization by Large Language Models: A Mixed-Methods Analysis of the Evolving Search Landscape",
    shortTitle: "How LLMs Are Disrupting Search",
    slug: "llms-disrupting-search",
    review: "preprint",
    authors: ["Venkata Pagadala"],
    authorPosition: 1,
    venue: "SSRN",
    year: "2026",
    url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6512878",
    host: "SSRN",
    summary:
      "A mixed-methods study of what large language models are doing to search behavior, and what that means for how content gets found.",
    posted: "3 Apr 2026",
    pages: 9,
    postedOnline: "17 Apr 2026",
    dateWritten: "April 3, 2026",
    doiUrl: "https://dx.doi.org/10.2139/ssrn.6512878",
    ssrnShortUrl: "https://ssrn.com/abstract=6512878",
    jel: "L86, M37, O33, L13",
    affiliation: "Independent Researcher",
    abstract:
      "Large Language Models have reshaped the search landscape in ways that are only beginning to be understood. Google's AI Overviews, ChatGPT Search, and Perplexity AI now mediate a growing share of how people find information online, and the consequences for traditional Search Engine Optimization are substantial but unevenly distributed. This paper takes a mixed-methods approach to understanding what is actually happening. On the quantitative side, I draw on Semrush's analysis of over 10 million keywords, Previsible's dataset of 1.96 million LLM-referred sessions, and Chartbeat's global traffic analytics, among other sources. On the qualitative side, I analyze 23 publisher case studies and strategy documents through thematic coding. The picture that emerges is more complicated than either the \"SEO is dead\" or \"nothing has changed\" camps acknowledge. AI Overview prevalence fluctuated between 6.49% and 25% of queries throughout 2025. Click-through rates for top-ranking pages dropped 34.5% when AI Overviews appeared, yet Semrush's own before-and-after tracking found that zero-click rates for the same keywords actually decreased slightly, from 33.75% to 31.53%. I attempt to reconcile these tensions through what I call the Search Ecosystem Disruption Model (SEDM), which brings together Christensen's disruptive innovation theory, Pirolli and Card's information foraging theory, and platform economics. The data show striking asymmetries: Chartbeat documents 33-38% declines in Google Search referral traffic for publishers, with news sites losing up to 26% while e-commerce barely registers a change. I present five falsifiable predictions, a practitioner roadmap, and the roughly $2 billion in annual publisher advertising revenue at stake.",
    keywords: [
      "Large Language Models",
      "Search Engine Optimization",
      "Generative Engine Optimization",
      "AI Overviews",
      "zero-click search",
      "organic traffic",
      "disruptive innovation",
      "information foraging",
      "platform economics",
    ],
  },
  {
    title:
      "Google, SEO and Helpful Content: How Artificial Intelligence Can Be Helpful for E-Commerce Websites",
    shortTitle: "AI and Helpful Content for E-Commerce",
    slug: "ai-helpful-content-ecommerce",
    review: "peer-reviewed",
    authors: ["Russ Macumber", "Venkata Durga Eswar Pagadala"],
    authorPosition: 2,
    venue: "Journal of Digital & Social Media Marketing",
    volume: "12",
    issue: "3",
    pageRange: "206-226",
    publisher: "Henry Stewart Publications",
    year: "2024",
    // The publisher's record on Ingenta Connect, verified 2026-09-17. It
    // replaces a ResearchGate mirror: a DOI is the citation of record, a
    // mirror is someone's upload of it.
    url: "https://www.ingentaconnect.com/content/hsp/jdsmm/2024/00000012/00000003/art00002",
    doiUrl: "https://doi.org/10.69554/RJUW9313",
    host: "Journal",
    summary:
      "How AI supports the helpful-content standard on e-commerce sites, from product data quality to editorial signals.",
    posted: "Winter 2024",
    keywords: ["SEO", "helpful content", "artificial intelligence", "e-commerce"],
  },
  {
    title: "A Survey of Reward Hacking in Agentic Large Language Model Systems",
    shortTitle: "Reward Hacking in Agentic LLMs",
    slug: "reward-hacking-agentic-llms",
    review: "peer-reviewed",
    authors: ["Arun Morampudi", "Ujval Irrinki", "Rahul Grandhi", "Venkata Pagadala", "Madhavi Maddula"],
    authorPosition: 4,
    venue: "Discover Artificial Intelligence",
    volume: "6",
    publisher: "Springer Nature",
    year: "2026",
    // Verified on link.springer.com 2026-09-17: citation metadata lists five
    // authors with Venkata fourth, online 17 Aug 2026, volume 6, article 825.
    url: "https://link.springer.com/article/10.1007/s44163-026-01980-z",
    doiUrl: "https://doi.org/10.1007/s44163-026-01980-z",
    host: "Journal",
    postedOnline: "17 Aug 2026",
    summary:
      "A four-level taxonomy of how tool-using AI agents game their rewards, from verbosity and sycophancy up to modifying tests and disrupting monitors, compared across RLHF, RLAIF, RLVR and DPO, with a layered defense model for production systems.",
    keywords: ["reward hacking", "agentic LLMs", "alignment", "RLHF", "RLVR", "LLM-as-a-judge"],
  },
  {
    title:
      "AI-Assisted SEO: Leveraging Machine Learning for Search Engine Optimization",
    shortTitle: "AI-Assisted SEO",
    venue:
      "International Journal of Scientific Research in Computer Science, Engineering and Information Technology",
    year: "2023",
    host: "Journal",
    // No public repository link supplied for this one yet. It is listed on
    // /publications with its venue, but is deliberately excluded from the
    // link-bearing surfaces below rather than shipped as a dead "#" href.
    url: "",
    summary:
      "Applying machine learning to the mechanics of search engine optimization at scale.",
  },
];

/** Author profile that aggregates the papers above and their citations. */
export const GOOGLE_SCHOLAR_URL = "https://scholar.google.com/citations?user=g6hMDGIAAAAJ&hl=en";

/**
 * "Co-author, 4th of 5" rather than a bare byline. Stating position is what
 * keeps a five-author survey from reading as sole authorship, which on a
 * personal site is the difference between a record and a claim.
 */
export function authorRole(p: ResearchPaper): string {
  const n = p.authors?.length ?? 0;
  if (!n || !p.authorPosition) return "";
  if (n === 1) return "Sole author";
  return `Co-author, ${p.authorPosition} of ${n}`;
}

/** Only the papers a reader can actually open. Use this for links. */
export const linkedPapers = researchPapers.filter((p) => p.url !== "");
