import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteMapView from "@/views/SiteMapView";
import { buildSections, getSiteIndex, SECTIONS, sectionById, type SectionId } from "@/lib/siteIndex";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

type Params = { section: string };

export const revalidate = 3600;
// A section that does not exist is a hard 404, never a soft one at HTTP 200.
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const meta = sectionById(params.section);
  if (!meta) return { title: "Not found" };
  return {
    title: `${meta.label} · Site map`,
    description: `${meta.blurb} Part of the site map of venkatapagadala.com.`,
    alternates: { canonical: `/sitemap/${meta.id}` },
    openGraph: {
      type: "website",
      url: `/sitemap/${meta.id}`,
      title: `${meta.label} · Site map`,
      description: meta.blurb,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const meta = sectionById(params.section);
  if (!meta) notFound();
  const entries = await getSiteIndex();
  const sections = buildSections(entries);
  const url = `${SITE_URL}/sitemap/${meta.id}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Site map: ${meta.label}`,
      description: meta.blurb,
      url,
      isPartOf: { "@type": "CollectionPage", name: "Site map", url: `${SITE_URL}/sitemap` },
    },
    breadcrumbJsonLd([
      { name: "Site map", url: `${SITE_URL}/sitemap` },
      { name: meta.label, url },
    ]),
  ];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <SiteMapView
        sections={sections}
        active={meta.id as SectionId}
        pageCount={entries.filter((e) => e.xml).length}
        itemCount={0}
      />
    </>
  );
}
