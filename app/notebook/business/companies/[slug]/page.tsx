import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessEntry from "@/views/BusinessEntry";
import { getBusiness, namesOf } from "@/lib/business-source";
import { BUSINESS_BASE, articleHref, companyHref, personHref } from "@/lib/business-paths";
import { breadcrumbLd, companyLd } from "@/lib/business-jsonld";
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

export const generateMetadata = withSeoOverrides("/notebook/business/companies/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = (await getBusiness()).companies.find((x) => x.slug === params.slug);
  if (!c) notFound(); // before any byte is sent, so a real 404
  const url = companyHref(c.slug);
  return {
    title: { absolute: c.seoTitle },
    description: c.description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: c.seoTitle, description: c.description, images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }] },
    twitter: { card: "summary_large_image", title: c.seoTitle, description: c.description },
  };
}

export default async function Page({ params }: { params: Params }) {
  const b = await getBusiness();
  const c = b.companies.find((x) => x.slug === params.slug);
  if (!c) notFound();
  const people = b.people.filter((p) => p.company === c.slug);
  const articles = b.articles.filter((a) => a.company === c.slug);
  const ld = [companyLd(c, people), breadcrumbLd([{ name: c.name, path: companyHref(c.slug) }])];
  return (
    <>
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <BusinessEntry
        back={{ href: BUSINESS_BASE, label: "Business Notebook" }}
        eyebrow="Company"
        title={c.name}
        summary={c.summary}
        facts={c.facts}
        related={[
          ...(people.length ? [{ title: "People", links: people.map((p) => ({ href: personHref(p.slug), label: p.name, note: p.role })) }] : []),
          ...(articles.length ? [{ title: "Notes", links: articles.map((a) => ({ href: articleHref(a.slug), label: a.title, note: a.kind })) }] : []),
        ]}
        sections={c.sections}
        sources={c.sources}
        names={namesOf(b)}
      />
    </>
  );
}
