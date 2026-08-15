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
    venue: "Journal of Digital & Social Media Marketing",
    year: "2024",
    url: "https://www.researchgate.net/publication/386439374_Google_SEO_and_helpful_content_How_artificial_intelligence_can_be_helpful_for_e-commerce_websites",
    host: "ResearchGate",
    summary:
      "How AI supports the helpful-content standard on e-commerce sites, from product data quality to editorial signals.",
    posted: "2024",
    keywords: ["SEO", "helpful content", "artificial intelligence", "e-commerce"],
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

/** Only the papers a reader can actually open. Use this for links. */
export const linkedPapers = researchPapers.filter((p) => p.url !== "");
