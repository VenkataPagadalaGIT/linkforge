import type { Metadata } from "next";
import AIContributorProfilePage from "@/pages/AIContributorProfilePage";
import { getContributor, personJsonLd, breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL } from "@/lib/site";

type Params = { id: string };

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
      <AIContributorProfilePage />
    </>
  );
}
