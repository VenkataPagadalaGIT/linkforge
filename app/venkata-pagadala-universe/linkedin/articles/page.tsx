import type { Metadata } from "next";
import LinkedInArticlesView from "@/views/LinkedInArticlesView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_ARTICLES_PATH, LINKEDIN_PROFILE, UNIVERSE_NAME, UNIVERSE_PATH, postPath } from "@/data/linkedinArchive";
import { LINKEDIN_ARTICLES } from "@/data/linkedinArchiveServer";
import { fitDescription } from "@/lib/seoText";

const n = LINKEDIN_ARTICLES.length;
const desc = fitDescription(`${n} LinkedIn articles by Venkata Pagadala, kept here in full with their images: brightonSEO notes, Python for SEO, keyword clustering and Google Search.`);

const metadata: Metadata = {
  title: { absolute: `LinkedIn articles · ${UNIVERSE_NAME}` },
  description: desc,
  alternates: { canonical: LINKEDIN_ARTICLES_PATH },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: LINKEDIN_ARTICLES_PATH,
    type: "website",
    title: `LinkedIn articles · ${UNIVERSE_NAME}`,
    description: desc,
  },
  twitter: { card: "summary_large_image", title: `LinkedIn articles · ${UNIVERSE_NAME}`, description: desc, images: [OG_IMAGE] },
};
export const generateMetadata = withSeoOverrides("/venkata-pagadala-universe/linkedin/articles", metadata);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LinkedIn articles",
    description: desc,
    url: `${SITE_URL}${LINKEDIN_ARTICLES_PATH}`,
    isPartOf: { "@type": "CollectionPage", name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
    author: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] },
    hasPart: LINKEDIN_ARTICLES.map((a) => ({ "@type": "Article", headline: a.title, url: `${SITE_URL}${postPath(a)}`, datePublished: a.date })),
  },
  breadcrumbJsonLd([
    { name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
    { name: "LinkedIn articles", url: `${SITE_URL}${LINKEDIN_ARTICLES_PATH}` },
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
