import type { Metadata } from "next";
import { Suspense } from "react";
import AIUpdateDetail from "@/views/AIUpdateDetail";
import { getUpdate, articleJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { slug: string };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const data = await getSitemapData();
  if (!data?.updates) return [];
  return data.updates.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const upd = await getUpdate(params.slug);
  if (!upd) {
    const t = params.slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
    return { title: t, alternates: { canonical: `/ai-updates/${params.slug}` } };
  }
  return {
    title: upd.title,
    description: upd.summary,
    alternates: { canonical: `/ai-updates/${params.slug}` },
    openGraph: {
      type: "article",
      url: `/ai-updates/${params.slug}`,
      title: upd.title,
      description: upd.summary,
      publishedTime: upd.date,
      tags: [upd.company, upd.category],
    },
    twitter: { card: "summary_large_image", title: upd.title, description: upd.summary },
  };
}

export default async function Page({ params }: { params: Params }) {
  const upd = await getUpdate(params.slug);
  const url = `${SITE_URL}/ai-updates/${params.slug}`;
  const jsonLd = upd
    ? [
        articleJsonLd({
          headline: upd.title,
          description: upd.summary,
          url,
          datePublished: upd.date,
          section: upd.category,
          keywords: [upd.company, upd.category, ...(upd.takeaways || []).slice(0, 3)],
        }),
        breadcrumbJsonLd([
          { name: "AI Updates", url: `${SITE_URL}/ai-updates` },
          { name: upd.title, url },
        ]),
      ]
    : [];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <Suspense fallback={null}>
        <AIUpdateDetail />
      </Suspense>
    </>
  );
}
