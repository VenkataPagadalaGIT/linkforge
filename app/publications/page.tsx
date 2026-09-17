import type { Metadata } from "next";
import Publications from "@/views/Publications";
import { researchPapers } from "@/data/research";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { paperNode } from "@/lib/paperLd";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Published Research on AI and Search",
  description:
    "Peer-reviewed papers and a preprint on how large language models are disrupting search, reward hacking in agentic AI, and helpful content for e-commerce. Each record states its review status and authorship position.",
  alternates: {
    canonical: "/publications",
    types: { "text/markdown": "/publications.md" },
  },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
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
    // Every paper the page shows, not just the ones with an external URL.
    // linkedPapers filters on url !== "", which silently dropped a visible
    // publication from the structured data.
    //
    // Built by the shared node builder so this page and /research-and-talks
    // describe the same three papers identically, down to the @id. The
    // hand-written version here named one author for a five-author survey and
    // marked a subscriber-only article free to read.
    ...researchPapers.map((paper) => ({
      "@context": "https://schema.org",
      ...paperNode(paper, `${SITE_URL}/publications`),
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
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <Publications />
    </>
  );
}
