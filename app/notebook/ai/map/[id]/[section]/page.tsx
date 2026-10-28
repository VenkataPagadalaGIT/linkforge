import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNode, LAYER_BY_ID, NODE_TYPE_META } from "@/data/aiOntology";
import { AI_360 } from "@/data/ai360";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { section360, sections360For } from "@/lib/ai360-sections";
import Section360View from "@/views/Section360View";

interface Props {
  params: { id: string; section: string };
}

// One indexable page per company per section of its 360 file: people, investors, legal, hiring, birth to now.
// Server-rendered on demand, like the company page, so crawlers get the full HTML.
export const dynamic = "force-dynamic";

export const generateMetadata = withSeoOverrides("/notebook/ai/map/[id]/[section]", baseMetadata);

async function baseMetadata({ params }: Props): Promise<Metadata> {
  const n = getNode(params.id);
  const s = section360(params.section);
  const f = AI_360[params.id];
  if (!n || !s || !f || !s.has(f)) return { title: "Not found", robots: { index: false } };
  const url = `/notebook/ai/map/${n.id}/${s.id}`;
  const title = s.title(n.name);
  const description = s.description(n.name, f).slice(0, 300);
  return {
    title,
    description,
    keywords: [n.name, `${n.name} ${s.label.toLowerCase()}`, NODE_TYPE_META[n.type].label, "AI intelligence graph"],
    alternates: { canonical: url },
    openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url, type: "article", title, description, siteName: "Venkata Pagadala · Mono Mind" },
    twitter: { card: "summary", title, description },
  };
}

export default function Page({ params }: Props) {
  const n = getNode(params.id);
  const s = section360(params.section);
  const f = AI_360[params.id];
  if (!n || !s || !f || !s.has(f)) notFound();
  const url = `${SITE_URL}/notebook/ai/map/${n.id}/${s.id}`;
  const layer = LAYER_BY_ID.get(n.layer);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AI Notebook", item: `${SITE_URL}/notebook/ai` },
      { "@type": "ListItem", position: 2, name: "AI Systems Map", item: `${SITE_URL}/notebook/ai/map` },
      { "@type": "ListItem", position: 3, name: layer?.label ?? "Layer", item: `${SITE_URL}/notebook/ai/map` },
      { "@type": "ListItem", position: 4, name: n.name, item: `${SITE_URL}/notebook/ai/map/${n.id}` },
      { "@type": "ListItem", position: 5, name: s.label, item: url },
    ],
  };
  // People in public roles, as schema.org Person records tied to the organization. Only people from the
  // company's own filings and pages: never rows from licensed datasets.
  const peopleLd =
    s.id === "people" && f.people.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${n.name}: people in public roles`,
          url,
          itemListElement: f.people.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "Person", name: p.name, jobTitle: p.role, worksFor: { "@type": "Organization", name: n.name, url: n.website ?? undefined }, url: p.sitePath ? `${SITE_URL}${p.sitePath}` : undefined },
          })),
        }
      : null;
  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: s.title(n.name),
    description: s.description(n.name, f),
    url,
    isPartOf: { "@type": "Dataset", name: "The AI Intelligence Graph", url: `${SITE_URL}/notebook/ai/graph` },
    about: { "@type": "Organization", name: n.name, url: n.website ?? undefined },
    license: `${SITE_URL}/notebook/ai/graph#terms`,
    creator: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetLd) }} />
      {peopleLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(peopleLd) }} />}
      <Section360View id={n.id} section={s.id} sections={sections360For(n.id)} />
    </>
  );
}
