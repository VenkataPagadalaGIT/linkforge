import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideView from "@/views/GuideView";
import { guides, getGuideBySlug } from "@/data/guides";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";

type Params = { slug: string };

// Static content — prerender every guide at build time. dynamicParams=false
// makes unknown slugs (including /guides/<slug>.md misses) hard-404 instead of
// soft-404ing the not-found UI at HTTP 200.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.tags,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      url: `/guides/${guide.slug}`,
      title: guide.title,
      description: guide.metaDescription,
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.metaDescription, images: [OG_IMAGE] },
  };
}

export default function Page({ params }: { params: Params }) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const url = `${SITE_URL}/guides/${guide.slug}`;
  const authorUrl = guide.author?.url?.startsWith("http")
    ? guide.author.url
    : `${SITE_URL}${guide.author?.url ?? ""}`;
  const articleSchema: Record<string, unknown> = {
    ...articleJsonLd({
      headline: guide.title,
      description: guide.metaDescription,
      url,
      datePublished: guide.datePublished,
      dateModified: guide.dateModified,
      section: "Guides",
      keywords: guide.tags,
      schemaType: "TechArticle",
      image: OG_IMAGE,
    }),
  };
  if (guide.author) {
    articleSchema.author = {
      "@type": "Person",
      "@id": authorUrl,
      name: guide.author.name,
      url: authorUrl,
      jobTitle: guide.author.title,
      affiliation: { "@type": "Organization", name: guide.author.org },
      description: guide.author.bio,
    };
  }
  const jsonLd: unknown[] = [
    articleSchema,
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: `${guide.title}: Glossary`,
      url,
      hasDefinedTerm: guide.terms.map((t) => ({
        "@type": "DefinedTerm",
        name: t.term,
        alternateName: t.aka,
        description: t.oneLiner,
        inDefinedTermSet: url,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    breadcrumbJsonLd([
      { name: "Guides", url: `${SITE_URL}/guides` },
      { name: guide.title, url },
    ]),
  ];

  if (guide.howTos?.length) {
    for (const h of guide.howTos) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: h.name,
        description: h.description,
        step: h.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      });
    }
  }

  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
      <GuideView guide={guide} />
    </>
  );
}
