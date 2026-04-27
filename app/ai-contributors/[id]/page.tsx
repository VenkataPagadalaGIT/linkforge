import type { Metadata } from "next";
import { Suspense } from "react";
import AIContributorProfilePage from "@/views/AIContributorProfilePage";
import { getContributor, personJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { id: string };

// Render on-demand at request time so 100 contributor SSG pages don't bloat
// build memory. Bots still get fully-rendered HTML.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await getContributor(params.id);
  if (!c) {
    const name = params.id.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    return { title: `${name} — AI Contributor`, alternates: { canonical: `/ai-contributors/${params.id}` } };
  }
  return {
    title: `${c.name} — AI Contributor`,
    description: c.bio,
    alternates: { canonical: `/ai-contributors/${params.id}` },
    openGraph: {
      type: "profile",
      url: `/ai-contributors/${params.id}`,
      title: `${c.name} — AI Contributor`,
      description: c.bio,
    },
    twitter: { card: "summary_large_image", title: c.name, description: c.bio },
  };
}

export default async function Page({ params }: { params: Params }) {
  const c = await getContributor(params.id);
  const url = `${SITE_URL}/ai-contributors/${params.id}`;
  const jsonLd = c
    ? [
        personJsonLd(c, url),
        breadcrumbJsonLd([
          { name: "AI Contributors", url: `${SITE_URL}/ai-contributors` },
          { name: c.name, url },
        ]),
      ]
    : [];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <Suspense fallback={null}>
        <AIContributorProfilePage />
      </Suspense>
    </>
  );
}
