import type { Metadata } from "next";
import { Suspense } from "react";
import PillarPage from "@/views/PillarPage";
import { getPillar, articleJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { slug: string };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const data = await getSitemapData();
  if (!data?.pillars) return [];
  return data.pillars.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const pillar = await getPillar(params.slug);
  if (!pillar) {
    const t = params.slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
    return { title: t, alternates: { canonical: `/insights/${params.slug}` } };
  }
  return {
    title: pillar.metaTitle || pillar.title,
    description: pillar.metaDescription,
    alternates: { canonical: `/insights/${params.slug}` },
    openGraph: {
      type: "article",
      url: `/insights/${params.slug}`,
      title: pillar.title,
      description: pillar.metaDescription,
    },
    twitter: { card: "summary_large_image", title: pillar.title, description: pillar.metaDescription },
  };
}

export default async function Page({ params }: { params: Params }) {
  const pillar = await getPillar(params.slug);
  const url = `${SITE_URL}/insights/${params.slug}`;
  const jsonLd = pillar
    ? [
        articleJsonLd({
          headline: pillar.title,
          description: pillar.metaDescription,
          url,
          section: "Insights",
        }),
        breadcrumbJsonLd([
          { name: "Insights", url: `${SITE_URL}/insights` },
          { name: pillar.title, url },
        ]),
      ]
    : [];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <Suspense fallback={null}>
        <PillarPage />
      </Suspense>
    </>
  );
}
