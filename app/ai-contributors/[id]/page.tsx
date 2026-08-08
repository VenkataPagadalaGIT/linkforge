import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import AIContributorProfilePage from "@/views/AIContributorProfilePage";
import { getContributor, personJsonLd, breadcrumbJsonLd, getSitemapData } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";

type Params = { id: string };

// Pre-render the known profiles and refuse everything else at the routing
// layer. dynamicParams:false is what makes an unknown id a real 404: with
// dynamic rendering, notFound() still rendered the not-found page but the
// response had already committed 200, which is the definition of a soft 404.
// The old comment here cited build memory on a 1Gi Emergent pod; we build on
// Railway now and 100 more pages is affordable.
export const dynamicParams = false;

export async function generateStaticParams() {
  const { aiContributors } = await import("@/data/aiContributors");
  return aiContributors.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await getContributor(params.id);
  if (!c) {
    // Slug did not resolve. Emit noindex and NO canonical: previously this
    // title-cased the URL slug and self-canonicalised it, which turned every
    // bogus URL into an indexable page with an attacker-chosen <title>.
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return {
    title: `${c.name} · AI Contributor`,
    description: c.bio,
    alternates: { canonical: `/ai-contributors/${params.id}` },
    openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      type: "profile",
      url: `/ai-contributors/${params.id}`,
      title: `${c.name} · AI Contributor`,
      description: c.bio,
    },
    twitter: { card: "summary_large_image", title: c.name, description: c.bio },
  };
}

export default async function Page({ params }: { params: Params }) {
  const c = await getContributor(params.id);
  if (!c) notFound();
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
