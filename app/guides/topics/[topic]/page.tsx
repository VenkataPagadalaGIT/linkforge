import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideTopicView from "@/views/GuideTopicView";
import { GUIDE_TOPICS, getTopicBySlug } from "@/data/guideTopics";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

type Params = { topic: string };

// Static content, one page per topic. dynamicParams=false hard-404s a typo'd
// or since-removed topic slug instead of soft-404ing it at HTTP 200, the same
// rule the guides and personas routes already hold themselves to.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const topic = getTopicBySlug(params.topic);
  if (!topic) return { title: "Topic not found" };
  const n = topic.guides.length;
  const description = `${n} reference guide${n === 1 ? "" : "s"} on ${topic.label}: ${topic.guides.map((g) => g.title).join(", ")}.`.slice(0, 300);
  return {
    title: { absolute: `${topic.label} Guides | Teardowns` },
    description,
    alternates: { canonical: `/guides/topics/${topic.slug}` },
    openGraph: {
      type: "website",
      url: `/guides/topics/${topic.slug}`,
      title: `${topic.label}: Reference Guides`,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: `${topic.label}: Reference Guides`, description, images: [OG_IMAGE] },
  };
}

export default function Page({ params }: { params: Params }) {
  const topic = getTopicBySlug(params.topic);
  if (!topic) notFound();

  const url = `${SITE_URL}/guides/topics/${topic.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${topic.label}: Reference Guides`,
      url,
      isPartOf: { "@type": "CollectionPage", name: "Guide topics, A to Z", url: `${SITE_URL}/guides/topics` },
      hasPart: topic.guides.map((g) => ({
        "@type": "TechArticle",
        headline: g.title,
        url: `${SITE_URL}/guides/${g.slug}`,
        description: g.metaDescription,
      })),
    },
    breadcrumbJsonLd([
      { name: "Guides", url: `${SITE_URL}/guides` },
      { name: "Topics", url: `${SITE_URL}/guides/topics` },
      { name: topic.label, url },
    ]),
  ];

  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <GuideTopicView topic={topic} />
    </>
  );
}
