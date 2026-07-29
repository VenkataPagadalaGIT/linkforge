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
