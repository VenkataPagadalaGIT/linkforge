import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessEntry from "@/views/BusinessEntry";
import { getBusiness, namesOf } from "@/lib/business-source";
import { BUSINESS_BASE, articleHref, companyHref, personHref } from "@/lib/business-paths";
import { articleLd, breadcrumbLd } from "@/lib/business-jsonld";
import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";

type Params = { slug: string };

// Rendered per request (from cached content), so a page published to the
// content branch is live at once with no deploy, and an unknown slug answers
// a real 404: notFound() in generateMetadata fires before the response
// starts. Prerendered pages that render a new slug on demand answered 200
// for unknown slugs in this Next.js version (tested 2026-10-01).
export const dynamic = "force-dynamic";

export const generateMetadata = withSeoOverrides("/notebook/business/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = (await getBusiness()).articles.find((x) => x.slug === params.slug);
  // Thrown here, while the head resolves and before any byte is sent, so an
  // unknown slug is a real 404. Thrown only in the page body, the response
  // has already started as a 200 (a soft 404).
  if (!a) notFound();
  const url = articleHref(a.slug);
  return {
    title: { absolute: a.seoTitle },
    description: a.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title: a.seoTitle, description: a.description, publishedTime: a.date,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: a.seoTitle, description: a.description },
  };
}

export default async function Page({ params }: { params: Params }) {
  const b = await getBusiness();
  const a = b.articles.find((x) => x.slug === params.slug);
  if (!a) notFound();
  const company = b.companies.find((c) => c.slug === a.company);
  const people = a.people.map((s) => b.people.find((p) => p.slug === s)).filter((p) => p !== undefined);
  const ld = [articleLd(a, company, people), breadcrumbLd([{ name: a.title, path: articleHref(a.slug) }])];
  return (
    <>
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <BusinessEntry
        back={{ href: BUSINESS_BASE, label: "Business Notebook" }}
        eyebrow={company ? `${a.kind} · ${company.name}` : a.kind}
        title={a.title}
        date={a.date}
        summary={a.summary}
        legend={a.legend}
        stats={a.stats}
        related={[
          { title: "On the call", links: people.map((p) => ({ href: personHref(p.slug), label: p.name, note: p.role })) },
          ...(company ? [{ title: "Company", links: [{ href: companyHref(company.slug), label: company.name, note: company.legalName }] }] : []),
        ]}
        sections={a.sections}
        sources={a.sources}
        names={namesOf(b)}
      />
    </>
  );
}
