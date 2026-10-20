import type { Metadata } from "next";
import LinkedInPostsView from "@/views/LinkedInPostsView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_POSTS_PATH, LINKEDIN_PROFILE, UNIVERSE_NAME, UNIVERSE_PATH, postPath } from "@/data/linkedinArchive";
import { LINKEDIN_SOCIAL_POSTS } from "@/data/linkedinArchiveServer";

const n = LINKEDIN_SOCIAL_POSTS.length;
const desc = `${n} posts Venkata Pagadala shared on LinkedIn, each with its full text, media, publish time and engagement, most engaging first: AI agents, SEO, GEO and AEO, knowledge graphs, conferences.`;

const metadata: Metadata = {
  title: "LinkedIn Posts",
  description: desc,
  alternates: { canonical: LINKEDIN_POSTS_PATH },
  openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: LINKEDIN_POSTS_PATH, type: "website", title: "LinkedIn Posts", description: desc },
};
export const generateMetadata = withSeoOverrides("/venkata-pagadala-universe/linkedin/posts", metadata);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LinkedIn posts",
    description: desc,
    url: `${SITE_URL}${LINKEDIN_POSTS_PATH}`,
    isPartOf: { "@type": "CollectionPage", name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
    author: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] },
    hasPart: LINKEDIN_SOCIAL_POSTS.slice(0, 100).map((p) => ({ "@type": "SocialMediaPosting", headline: p.title, url: `${SITE_URL}${postPath(p)}`, datePublished: p.date })),
  },
  breadcrumbJsonLd([
    { name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
    { name: "LinkedIn posts", url: `${SITE_URL}${LINKEDIN_POSTS_PATH}` },
  ]),
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInPostsView />
    </>
  );
}
