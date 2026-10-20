import type { Metadata } from "next";
import LinkedInArchiveView from "@/views/LinkedInArchiveView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_PROFILE, UNIVERSE_NAME, UNIVERSE_PATH, topicPath } from "@/data/linkedinArchive";
import { LINKEDIN_COUNTS, LINKEDIN_TOPICS } from "@/data/linkedinArchiveServer";

const c = LINKEDIN_COUNTS;
const desc = `Everything Venkata Pagadala shares, in one searchable graph: ${c.areas} areas, ${c.topics} topics, ${c.subtopics} subtopics. LinkedIn first: ${c.posts} posts, ${c.articles} articles and ${c.items} media items.`;

const metadata: Metadata = {
  title: { absolute: UNIVERSE_NAME },
  description: desc,
  alternates: { canonical: UNIVERSE_PATH },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: UNIVERSE_PATH,
    type: "website",
    title: UNIVERSE_NAME,
    description: desc,
    siteName: "Venkata Pagadala · Mono Mind",
  },
};
export const generateMetadata = withSeoOverrides("/venkata-pagadala-universe", metadata);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: UNIVERSE_NAME,
    description: desc,
    url: `${SITE_URL}${UNIVERSE_PATH}`,
    author: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] },
    // The areas (L1); each area page lists its topics and subtopics.
    hasPart: LINKEDIN_TOPICS.filter((t) => t.level === 1).map((t) => ({
      "@type": "CollectionPage",
      name: `${t.label}: ${UNIVERSE_NAME}`,
      url: `${SITE_URL}${topicPath(t.id)}`,
    })),
  },
  breadcrumbJsonLd([{ name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` }]),
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInArchiveView />
    </>
  );
}
