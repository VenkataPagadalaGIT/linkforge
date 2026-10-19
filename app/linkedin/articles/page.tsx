import type { Metadata } from "next";
import LinkedInArticlesView from "@/views/LinkedInArticlesView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_ARTICLES, LINKEDIN_PROFILE, postPath } from "@/data/linkedinArchive";

const n = LINKEDIN_ARTICLES.length;
const desc = `${n} articles Venkata Pagadala published on LinkedIn, kept here in full with their images: brightonSEO notes, Python for SEO, keyword clustering, Google Search operators and the AI systems he built.`;

const metadata: Metadata = {
  title: "LinkedIn Articles",
  description: desc,
  alternates: { canonical: "/linkedin/articles" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/linkedin/articles",
    type: "website",
    title: "LinkedIn Articles",
    description: desc,
  },
};
export const generateMetadata = withSeoOverrides("/linkedin/articles", metadata);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LinkedIn articles",
    description: desc,
    url: `${SITE_URL}/linkedin/articles`,
    isPartOf: { "@type": "CollectionPage", name: "LinkedIn archive", url: `${SITE_URL}/linkedin` },
    author: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] },
    hasPart: LINKEDIN_ARTICLES.map((a) => ({ "@type": "Article", headline: a.title, url: `${SITE_URL}${postPath(a)}`, datePublished: a.date })),
  },
  breadcrumbJsonLd([
    { name: "LinkedIn archive", url: `${SITE_URL}/linkedin` },
    { name: "Articles", url: `${SITE_URL}/linkedin/articles` },
  ]),
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInArticlesView />
    </>
  );
}
