import type { Metadata } from "next";
import { aiContributors } from "@/data/aiContributors";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import AIUpdateDetail from "@/views/AIUpdateDetail";
import { getUpdate, articleJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { slug: string };

// On-demand SSR — small set but keep consistent with other content routes.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const upd = await getUpdate(params.slug);
  if (!upd) {
    // Slug did not resolve. Emit noindex and NO canonical: previously this
    // title-cased the URL slug and self-canonicalised it, which turned every
    // bogus URL into an indexable page with an attacker-chosen <title>.
    return { title: "Not found", robots: { index: false, follow: false } };
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
  if (!upd) notFound();
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
          mentions: (upd?.contributors ?? [])
            .map((cid: string) => aiContributors.find((c) => c.id === cid))
            .filter(Boolean)
            .map((c) => ({ id: c!.id, name: c!.name, affiliation: c!.affiliation, photoUrl: c!.photoUrl })),
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
