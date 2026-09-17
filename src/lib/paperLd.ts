/**
 * One schema.org node per paper, shared by /research-and-talks and
 * /publications.
 *
 * It lives in its own module because the two pages had drifted into describing
 * the same three papers differently, and the /publications version was the
 * wrong one in three ways that a machine reads and a person does not:
 *
 *   - every paper was authored by one Person, Venkata. The Springer survey has
 *     five authors with him fourth and the JDSMM paper has two with him
 *     second, so the markup claimed sole authorship of both.
 *   - every paper carried isAccessibleForFree: true, including the one whose
 *     publisher states it is for subscribers.
 *   - a preprint and a peer-reviewed paper were marked identically.
 *
 * The visible pages had already been corrected on all three. Structured data
 * that contradicts the page is worse than no structured data, because the page
 * is what a person checks and the markup is what an answer engine repeats.
 *
 * `@id` is the DOI when there is one. A paper is one thing whether it is
 * mentioned on one page of this site or three, and a page-anchor id would make
 * it three different things to anything reading the graph.
 */
import { SITE_URL } from "@/lib/site";
import { authorRole, citationLine, type ResearchPaper } from "@/data/research";
import { PAPER_COVERS } from "@/data/paperCovers";

type Node = Record<string, unknown>;

const PERSON = `${SITE_URL}/#person`;
const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

export function paperId(p: ResearchPaper, pageUrl: string): string {
  return p.doiUrl ?? `${pageUrl}#${p.slug ?? encodeURIComponent(p.title.slice(0, 40))}`;
}

/** The journal, volume and issue nested, so the volume is readable as data. */
function isPartOf(p: ResearchPaper): Node {
  const periodical: Node = { "@type": "Periodical", name: p.venue };
  if (p.publisher) periodical.publisher = { "@type": "Organization", name: p.publisher };
  if (!p.volume) return periodical;

  const volume: Node = { "@type": "PublicationVolume", volumeNumber: p.volume, isPartOf: periodical };
  if (!p.issue) return volume;
  return { "@type": "PublicationIssue", issueNumber: p.issue, isPartOf: volume };
}

export function paperNode(p: ResearchPaper, pageUrl: string): Node {
  const cover = p.slug ? PAPER_COVERS[p.slug] : undefined;

  const node: Node = {
    "@type": "ScholarlyArticle",
    "@id": paperId(p, pageUrl),
    name: p.title,
    headline: p.title,
    // Every author in printed order. Only Venkata's entry carries the site's
    // Person id, so a consumer can tell which of five names this site is about
    // without inheriting the other four into his identity.
    author: (p.authors ?? ["Venkata Pagadala"]).map((name) =>
      name.includes("Pagadala")
        ? { "@type": "Person", "@id": PERSON, name }
        : { "@type": "Person", name },
    ),
    datePublished: p.year,
    isPartOf: isPartOf(p),
    abstract: p.abstract ?? p.summary,
    description: p.summary,
    citation: citationLine(p),
    inLanguage: "en",
    mainEntityOfPage: pageUrl,
    creativeWorkStatus:
      p.review === "peer-reviewed"
        ? "Published, peer reviewed"
        : p.review === "preprint"
          ? "Preprint, not peer reviewed"
          : "Published",
    ...(p.review === "peer-reviewed" ? { peerReviewed: true } : {}),
  };

  if (p.url) {
    node.url = p.url;
    if (p.doiUrl) node.sameAs = p.url;
  }
  if (p.doiUrl) {
    const doi = p.doiUrl.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
    node.identifier = { "@type": "PropertyValue", propertyID: "DOI", value: doi };
  }
  if (p.pageRange) node.pagination = p.pageRange;
  if (p.keywords?.length) node.keywords = p.keywords.join(", ");
  // Only when a publisher page has actually been checked. Absent is honest;
  // `true` by default is how the old markup came to claim a paywalled article
  // was free.
  if (p.openAccess !== undefined) node.isAccessibleForFree = p.openAccess;
  if (p.license) node.license = p.license;
  if (cover) {
    node.image = {
      "@type": "ImageObject",
      url: abs(cover.src),
      width: cover.width,
      height: cover.height,
      caption: `First page of "${p.title}"`,
      ...(p.coverCredit ? { creditText: p.coverCredit } : {}),
    };
    node.thumbnailUrl = abs(cover.src);
  }
  if (authorRole(p)) node.creditText = `${authorRole(p)}, ${citationLine(p)}`;
  return node;
}
