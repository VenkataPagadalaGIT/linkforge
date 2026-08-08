import type { Metadata } from "next";
import GuidesIndex from "@/views/GuidesIndex";
import { guides } from "@/data/guides";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  // The root layout appends " · Venkata Pagadala", so naming the brand here
  // too produced "... | Venkata Pagadala · Venkata Pagadala" in the tab.
  title: "Teardowns: AI, Graphs and Search",
  description:
    "Complex systems taken apart: citable reference guides on AI systems, knowledge graphs, and search, built for humans and answer engines.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: "/guides",
    title: "Teardowns: AI, Graphs & Search, Taken Apart",
    description:
      "Complex systems taken apart: citable reference guides on AI systems, knowledge graphs, and search.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Teardowns: AI, Graphs & Search, Taken Apart",
    description:
      "Complex systems taken apart: citable reference guides on AI systems, knowledge graphs, and search.",
    images: [OG_IMAGE],
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Teardowns",
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
