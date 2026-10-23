import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LinkedInArticleView from "@/views/LinkedInArticleView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_ARTICLES_PATH, LINKEDIN_PROFILE, UNIVERSE_NAME, UNIVERSE_PATH, imageUrlFor, postPath, topicLabel } from "@/data/linkedinArchive";
import { LINKEDIN_ARTICLES, getLinkedInPost } from "@/data/linkedinArchiveServer";
import { seoFor } from "@/data/universeSeo";
import { clip, plain } from "@/lib/seoText";

type Params = { slug: string };

// One static page per published article (slugs are frozen); an unknown slug hard-404s.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LINKEDIN_ARTICLES.map((a) => ({ slug: a.id }));
}

const article = (slug: string) => {
  const p = getLinkedInPost(slug);
  return p && p.type === "article" ? p : undefined;
};
const cover = imageUrlFor;

export const generateMetadata = withSeoOverrides("/venkata-pagadala-universe/linkedin/articles/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = article(params.slug);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };
  const { title, description } = seoFor(p);
  // Share cards show more than a search result; X cuts at about 70 characters.
  const social = clip(plain(p.title), 90);
  const image = cover(p.cover);
  const images = image ? [{ url: image }] : [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title: { absolute: title },
    description,
    authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
    alternates: { canonical: postPath(p) },
    ...(p.review ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "article",
      url: postPath(p),
      title: social,
      description,
      publishedTime: p.date,
      authors: ["Venkata Pagadala"],
      images,
    },
    twitter: { card: "summary_large_image", title: social, description, images },
  };
}

export default function Page({ params }: { params: Params }) {
  const p = article(params.slug);
  if (!p) notFound();
  const url = `${SITE_URL}${postPath(p)}`;
  const author = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL, sameAs: [LINKEDIN_PROFILE] };
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      description: p.excerpt,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      datePublished: p.date,
      dateModified: p.date,
      wordCount: p.words,
      keywords: [...p.topics, ...p.subtopics].map(topicLabel).join(", "),
      ...(cover(p.cover) ? { image: cover(p.cover) } : {}),
      author,
      publisher: author,
      // The same article, first published on LinkedIn.
      sameAs: p.url,
      ...(p.people.length ? { mentions: p.people.map((x) => ({ "@type": "Person", name: x.name, sameAs: x.url })) } : {}),
      isPartOf: { "@type": "CollectionPage", name: "LinkedIn articles", url: `${SITE_URL}${LINKEDIN_ARTICLES_PATH}` },
    },
    breadcrumbJsonLd([
      { name: UNIVERSE_NAME, url: `${SITE_URL}${UNIVERSE_PATH}` },
      { name: "LinkedIn articles", url: `${SITE_URL}${LINKEDIN_ARTICLES_PATH}` },
      { name: p.title, url },
    ]),
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <LinkedInArticleView post={p} />
    </>
  );
}
