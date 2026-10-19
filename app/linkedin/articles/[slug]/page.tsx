import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LinkedInArticleView from "@/views/LinkedInArticleView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { LINKEDIN_ARTICLES, LINKEDIN_PROFILE, fullUrl, getLinkedInPost, postPath, topicLabel } from "@/data/linkedinArchive";

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
const cover = (idx?: string) => (idx ? fullUrl({ idx, kind: "image" }) : undefined);

export const generateMetadata = withSeoOverrides("/linkedin/articles/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = article(params.slug);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };
  const description = p.excerpt.slice(0, 300);
  const image = cover(p.cover);
  return {
    title: { absolute: `${p.title} | Venkata Pagadala` },
    description,
    authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
    alternates: { canonical: postPath(p) },
    ...(p.review ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "article",
      url: postPath(p),
      title: p.title,
      description,
      publishedTime: p.date,
      authors: ["Venkata Pagadala"],
      images: image ? [{ url: image }] : [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
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
      keywords: p.topics.map(topicLabel).join(", "),
      ...(cover(p.cover) ? { image: cover(p.cover) } : {}),
      author,
      publisher: author,
      // The same article, first published on LinkedIn.
      sameAs: p.url,
      ...(p.people.length ? { mentions: p.people.map((x) => ({ "@type": "Person", name: x.name, sameAs: x.url })) } : {}),
      isPartOf: { "@type": "CollectionPage", name: "LinkedIn articles", url: `${SITE_URL}/linkedin/articles` },
    },
    breadcrumbJsonLd([
      { name: "LinkedIn archive", url: `${SITE_URL}/linkedin` },
      { name: "Articles", url: `${SITE_URL}/linkedin/articles` },
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
