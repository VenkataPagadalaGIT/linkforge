import type { Metadata } from "next";
import LinkedInArchiveView from "@/views/LinkedInArchiveView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_PROFILE } from "@/data/linkedinArchive";
import { LINKEDIN_COUNTS, LINKEDIN_TOPICS } from "@/data/linkedinArchiveServer";

const c = LINKEDIN_COUNTS;
const desc = `${c.posts} posts, ${c.articles} articles and ${c.items} images, videos and documents from Venkata Pagadala's LinkedIn (${c.firstYear} to ${c.lastYear}), as one searchable knowledge graph: ${c.areas} areas, ${c.topics} topics and ${c.subtopics} subtopics across AI, SEO, AI search, data and more.`;

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
    // The areas (L1); each area page lists its topics and subtopics.
    hasPart: LINKEDIN_TOPICS.filter((t) => t.level === 1).map((t) => ({
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
