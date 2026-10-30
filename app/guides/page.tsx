import type { Metadata } from "next";
import GuidesIndex from "@/views/GuidesIndex";
import { guides } from "@/data/guides";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";

const metadata: Metadata = {
  // The root layout appends " · Venkata Pagadala", so naming the brand here
  // too produced "... | Venkata Pagadala · Venkata Pagadala" in the tab.
  title: "Learn: Guides to AI, Search and Systems",
  description:
    "Every guide in one place, grouped by subject: how AI and other systems work, AI reference, and SEO and marketing. Citable reference guides built for people and answer engines.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: "/guides",
    title: "Learn: Guides to AI, Search and Systems",
    description:
      "Every guide in one place, grouped by subject: how AI and other systems work, AI reference, and SEO and marketing.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn: Guides to AI, Search and Systems",
    description:
      "Every guide in one place, grouped by subject: how AI and other systems work, AI reference, and SEO and marketing.",
    images: [OG_IMAGE],
  },
};
export const generateMetadata = withSeoOverrides("/guides", metadata);

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Learn",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <GuidesIndex />
    </>
  );
}
