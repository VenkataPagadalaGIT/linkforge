import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import BlogPostPage from "@/views/BlogPostPage";
import { getPost, articleJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { slug: string; postSlug: string };

// On-demand SSR for blog posts — was the heaviest route's deepest leaf.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPost(params.postSlug);
  if (!post) {
    // Slug did not resolve. Emit noindex and NO canonical: previously this
    // title-cased the URL slug and self-canonicalised it, which turned every
    // bogus URL into an indexable page with an attacker-chosen <title>.
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  // Pull from CMS-managed seo block (new) or fall back to legacy fields
  const seo = (post as any).seo || {};
  const canonicalPath = seo.canonical || `/insights/${params.slug}/${params.postSlug}`;
  const metaTitle = seo.metaTitle || post.metaTitle || post.title;
  const metaDesc = seo.metaDescription || post.metaDescription || post.excerpt;
  const ogTitle = seo.ogTitle || metaTitle;
  const ogDesc = seo.ogDescription || metaDesc;
  const ogImage = seo.ogImage || (post as any).coverImage || undefined;
  const twitterCard = (seo.twitterCard as any) || "summary_large_image";
  const robotsIndex = seo.robotsIndex !== false;
  const robotsFollow = seo.robotsFollow !== false;
  return {
    title: metaTitle,
    description: metaDesc,
    keywords: post.tags,
    authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
    alternates: { canonical: canonicalPath },
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      googleBot: { index: robotsIndex, follow: robotsFollow },
    },
    openGraph: {
      type: "article",
      url: canonicalPath,
      title: ogTitle,
      description: ogDesc,
      publishedTime: post.date,
      authors: ["Venkata Pagadala"],
      tags: post.tags,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDesc,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const post = await getPost(params.postSlug);
  if (!post) notFound();
  const seo = ((post as any)?.seo) || {};
  const canonicalPath = seo.canonical || `/insights/${params.slug}/${params.postSlug}`;
  const url = canonicalPath.startsWith("http") ? canonicalPath : `${SITE_URL}${canonicalPath}`;
  const schemaType = seo.jsonLdType || "Article";
  const jsonLd = post
    ? [
        articleJsonLd({
          headline: post.title,
          description: seo.metaDescription || post.metaDescription || post.excerpt,
          url,
          datePublished: post.date,
          keywords: post.tags,
          section: params.slug,
          schemaType,
          image: seo.ogImage || (post as any).coverImage,
        }),
        breadcrumbJsonLd([
          { name: "Insights", url: `${SITE_URL}/insights` },
          { name: params.slug, url: `${SITE_URL}/insights/${params.slug}` },
          { name: post.title, url },
        ]),
      ]
    : [];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }}
        />
      ))}
      <BlogPostPage />
    </>
  );
}
