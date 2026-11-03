import type { Metadata } from "next";
import GuidesIndex from "@/views/GuidesIndex";
import { guides } from "@/data/guides";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reference Guides: AI, Graphs & Search | Venkata Pagadala",
  description:
    "Definitive, citable reference guides on AI systems, knowledge graphs, and search — built for humans and answer engines.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: "/guides",
    title: "Reference Guides: AI, Graphs & Search",
    description:
      "Definitive, citable reference guides on AI systems, knowledge graphs, and search.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reference Guides: AI, Graphs & Search",
    description:
      "Definitive, citable reference guides on AI systems, knowledge graphs, and search.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Reference Guides",
    url: `${SITE_URL}/guides`,
    hasPart: guides.map((g) => ({
      "@type": "TechArticle",
      headline: g.title,
      url: `${SITE_URL}/guides/${g.slug}`,
      description: g.metaDescription,
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuidesIndex />
    </>
  );
}
