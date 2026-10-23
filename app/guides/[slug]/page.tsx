import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideView from "@/views/GuideView";
import { guides, getGuideBySlug } from "@/data/guides";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";

type Params = { slug: string };

/** Body text uses tiny markdown; structured data wants the plain words. */
const plain = (s: string) =>
  s
    .replace(/\[\[[ygb]:([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1$2");

/** The site-wide Person node app/layout.tsx emits; guides by the site's owner point to it. */
const OWNER_NAME = "Venkata Pagadala";

// Static content — prerender every guide at build time. dynamicParams=false
// makes unknown slugs (including /guides/<slug>.md misses) hard-404 instead of
// soft-404ing the not-found UI at HTTP 200.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export const generateMetadata = withSeoOverrides("/guides/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return { title: "Guide not found" };
  const img = guide.image
    ? { url: `${SITE_URL}${guide.image.src}`, width: guide.image.width, height: guide.image.height, alt: guide.image.alt }
    : { url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME };
  return {
    // absolute: the layout appends ' · Venkata Pagadala', which pushed
    // these keyword-dense titles past the SERP truncation point.
    title: { absolute: guide.metaTitle },
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
      images: [img],
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.metaDescription, images: [img.url] },
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
      image: guide.image ? `${SITE_URL}${guide.image.src}` : OG_IMAGE,
    }),
  };
  if (guide.author) {
    articleSchema.author = {
      "@type": "Person",
      // One entity, not two: the owner's guides point at the same @id as the
      // Person node on every page, so engines never split him in half.
      "@id": guide.author.name === OWNER_NAME ? `${SITE_URL}/#person` : authorUrl,
      name: guide.author.name,
      url: authorUrl,
      jobTitle: guide.author.title,
      affiliation: { "@type": "Organization", name: guide.author.org },
      description: guide.author.bio,
    };
  }
  if (guide.concept) {
    articleSchema.about = {
      "@type": "DefinedTerm",
      "@id": `${url}#${guide.slug}`,
      name: guide.concept.name,
      alternateName: guide.concept.alternateName,
      termCode: guide.concept.termCode,
      description: guide.concept.description,
      url,
      inDefinedTermSet: url,
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
        description: plain(t.oneLiner),
        inDefinedTermSet: url,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: plain(f.a) },
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
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <GuideView guide={guide} />
    </>
  );
}
