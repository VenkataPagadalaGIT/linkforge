import type { Metadata } from "next";
import Publications from "@/views/Publications";
import { researchPapers, linkedPapers } from "@/data/research";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publications · Peer-Reviewed Research on AI and Search",
  description:
    "Peer-reviewed papers by Venkata Pagadala on how large language models are disrupting search, AI-assisted SEO, and helpful content for e-commerce. Published on SSRN and in academic journals.",
  alternates: { canonical: "/publications" },
  openGraph: {
    url: "/publications",
    title: "Publications · Venkata Pagadala",
    description:
      "Peer-reviewed research on AI, search, and retrieval. Every paper links to its published source.",
  },
};

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/publications#collection`,
      name: "Publications and Research",
      url: `${SITE_URL}/publications`,
      author: { "@id": `${SITE_URL}/#person` },
      description:
        "Peer-reviewed research on how AI and large language models are reshaping search and content discovery.",
    },
    ...linkedPapers.map((paper) => ({
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      headline: paper.title,
      name: paper.title,
      author: { "@id": `${SITE_URL}/#person` },
      datePublished: paper.year,
      publisher: { "@type": "Organization", name: paper.venue },
      url: paper.url,
      sameAs: paper.url,
      abstract: paper.summary,
      isAccessibleForFree: true,
    })),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Publications", item: `${SITE_URL}/publications` },
      ],
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Publications />
    </>
  );
}
