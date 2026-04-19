import type { Metadata } from "next";
import { Suspense } from "react";
import BlogPostPage from "@/views/BlogPostPage";
import { getPost, articleJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { slug: string; postSlug: string };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const data = await getSitemapData();
  if (!data?.posts) return [];
  return data.posts.map((p) => ({ slug: p.pillarSlug, postSlug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPost(params.postSlug);
  if (!post) {
    const t = params.postSlug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
    return {
      title: t,
      alternates: { canonical: `/insights/${params.slug}/${params.postSlug}` },
    };
  }
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags,
    authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
    alternates: { canonical: `/insights/${params.slug}/${params.postSlug}` },
    openGraph: {
      type: "article",
      url: `/insights/${params.slug}/${params.postSlug}`,
      title: post.title,
      description: post.metaDescription || post.excerpt,
      publishedTime: post.date,
      authors: ["Venkata Pagadala"],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription || post.excerpt,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const post = await getPost(params.postSlug);
  const url = `${SITE_URL}/insights/${params.slug}/${params.postSlug}`;
  const jsonLd = post
    ? [
        articleJsonLd({
          headline: post.title,
          description: post.metaDescription || post.excerpt,
          url,
          datePublished: post.date,
          keywords: post.tags,
          section: params.slug,
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
