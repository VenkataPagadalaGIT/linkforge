import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessEntry from "@/views/BusinessEntry";
import { getBusiness, namesOf } from "@/lib/business-source";
import { BUSINESS_BASE, articleHref, companyHref, initialsOf, personHref } from "@/lib/business-paths";
import { breadcrumbLd, personLd } from "@/lib/business-jsonld";
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

export const generateMetadata = withSeoOverrides("/notebook/business/people/[slug]", baseMetadata);

async function baseMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = (await getBusiness()).people.find((x) => x.slug === params.slug);
  if (!p) notFound(); // before any byte is sent, so a real 404
  const url = personHref(p.slug);
  return {
    title: { absolute: p.seoTitle },
    description: p.description,
    alternates: { canonical: url },
    openGraph: { type: "profile", url, title: p.seoTitle, description: p.description, images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }] },
    twitter: { card: "summary_large_image", title: p.seoTitle, description: p.description },
  };
}

export default async function Page({ params }: { params: Params }) {
  const b = await getBusiness();
  const p = b.people.find((x) => x.slug === params.slug);
  if (!p) notFound();
  const company = b.companies.find((c) => c.slug === p.company);
  const articles = b.articles.filter((a) => a.people.includes(p.slug));
  const ld = [personLd(p, company), breadcrumbLd([{ name: p.name, path: personHref(p.slug) }])];
  return (
    <>
      {ld.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <BusinessEntry
        back={{ href: BUSINESS_BASE, label: "Business Notebook" }}
        eyebrow="Person"
        title={p.name}
        picture={p.photo}
        initials={initialsOf(p.name)}
        summary={p.summary}
        facts={p.facts}
        related={[
          ...(company ? [{ title: "Company", links: [{ href: companyHref(company.slug), label: company.name, note: p.role, picture: company.logo, initials: initialsOf(company.name) }] }] : []),
          ...(articles.length ? [{ title: "Appears in", links: articles.map((a) => ({ href: articleHref(a.slug), label: a.title, note: a.kind })) }] : []),
        ]}
        sections={p.sections}
        sources={p.sources}
        names={namesOf(b)}
      />
    </>
  );
}
