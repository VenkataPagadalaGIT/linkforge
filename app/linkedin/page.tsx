import type { Metadata } from "next";
import LinkedInArchiveView from "@/views/LinkedInArchiveView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_COUNTS, LINKEDIN_PROFILE, LINKEDIN_TOPICS } from "@/data/linkedinArchive";

const c = LINKEDIN_COUNTS;
const desc = `${c.items} images, videos and documents from Venkata Pagadala's LinkedIn (${c.firstYear} to ${c.lastYear}), as one searchable knowledge graph across ${c.topics} topics: SEO, AI, Google updates, conferences and more.`;

const metadata: Metadata = {
  title: "LinkedIn Archive: Knowledge Graph",
  description: desc,
  alternates: { canonical: "/linkedin" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/linkedin",
    type: "website",
    title: "LinkedIn Archive: Knowledge Graph",
    description: desc,
    siteName: "Venkata Pagadala · Mono Mind",
  },
};
export const generateMetadata = withSeoOverrides("/linkedin", metadata);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LinkedIn Archive",
    description: desc,
    url: `${SITE_URL}/linkedin`,
    author: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] },
    hasPart: LINKEDIN_TOPICS.map((t) => ({
      "@type": "CollectionPage",
      name: `${t.label}: LinkedIn archive`,
      url: `${SITE_URL}/linkedin/topics/${t.slug}`,
    })),
  },
  breadcrumbJsonLd([{ name: "LinkedIn archive", url: `${SITE_URL}/linkedin` }]),
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInArchiveView />
    </>
  );
}
