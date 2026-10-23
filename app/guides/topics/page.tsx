import type { Metadata } from "next";
import GuideTopicsIndex from "@/views/GuideTopicsIndex";
import { GUIDE_TOPICS } from "@/data/guideTopics";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";

export const dynamic = "force-static";

const DESCRIPTION = `Every reference guide topic on this site, A to Z: ${GUIDE_TOPICS.length} topics, each with its own page listing every guide that carries it.`;

const metadata: Metadata = {
  title: { absolute: "Guide Topics, A to Z | Teardowns" },
  description: DESCRIPTION,
  alternates: { canonical: "/guides/topics" },
  openGraph: {
    type: "website",
    url: "/guides/topics",
    title: "Guide Topics, A to Z",
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", title: "Guide Topics, A to Z", description: DESCRIPTION, images: [OG_IMAGE] },
};
export const generateMetadata = withSeoOverrides("/guides/topics", metadata);

export default function Page() {
  const url = `${SITE_URL}/guides/topics`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Guide topics, A to Z",
      url,
      isPartOf: { "@type": "CollectionPage", name: "Teardowns", url: `${SITE_URL}/guides` },
      hasPart: GUIDE_TOPICS.map((t) => ({
        "@type": "CollectionPage",
        name: `${t.label}: Reference Guides`,
        url: `${SITE_URL}/guides/topics/${t.slug}`,
      })),
    },
    breadcrumbJsonLd([
      { name: "Guides", url: `${SITE_URL}/guides` },
      { name: "Topics", url },
    ]),
  ];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <GuideTopicsIndex />
    </>
  );
}
