import type { Metadata } from "next";
import SiteMapView from "@/views/SiteMapView";
import { buildSections, getSiteIndex, SECTIONS } from "@/lib/siteIndex";
import { breadcrumbJsonLd } from "@/lib/content-fetch";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";

// Same freshness as sitemap.xml, which reads the same index.
export const revalidate = 3600;

const metadata: Metadata = {
  title: "Site map",
  description:
    "Every page on venkatapagadala.com in one place: guides, topics, videos, talks, sessions, the AI Encyclopedia and Systems Map, personas and more, with a filtered view for each.",
  alternates: { canonical: "/sitemap" },
  openGraph: {
    type: "website",
    url: "/sitemap",
    title: "Site map",
    description: "Every page on this site in one place, with a filtered view for each section.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
};
export const generateMetadata = withSeoOverrides("/sitemap", metadata);

export default async function Page() {
  const entries = await getSiteIndex();
  const sections = buildSections(entries);
  const pageCount = entries.filter((e) => e.xml).length;
  const itemCount = entries.filter((e) => !e.xml && !e.href.startsWith("/sitemap") && ["videos", "awards", "talks", "research"].includes(e.section)).length;
  const url = `${SITE_URL}/sitemap`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Site map",
      url,
      hasPart: SECTIONS.map((s) => ({ "@type": "CollectionPage", name: `Site map: ${s.label}`, url: `${SITE_URL}/sitemap/${s.id}` })),
    },
    breadcrumbJsonLd([{ name: "Site map", url }]),
  ];
  return (
    <>
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(j) }} />
      ))}
      <SiteMapView sections={sections} pageCount={pageCount} itemCount={itemCount} />
    </>
  );
}
