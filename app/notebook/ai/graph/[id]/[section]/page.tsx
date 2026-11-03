import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNode, LAYER_BY_ID, NODE_TYPE_META } from "@/data/aiOntology";
import { AI_360 } from "@/data/ai360";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { entitiesWith360, section360, sections360For } from "@/lib/ai360-sections";
import { entityPath, GRAPHS, hubPath, sectionPath } from "@/lib/graph-urls";
import Section360View from "@/views/Section360View";

interface Props {
  params: { id: string; section: string };
}

// One indexable page per company per section of its file (people, investors, legal, hiring, birth to now), one
// level under the company's page, built at build time like that page, so crawlers get the full HTML and an unknown
// section is a real 404.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return entitiesWith360().flatMap((id) => sections360For(id).map((s) => ({ id, section: s.id })));
}

export const generateMetadata = withSeoOverrides("/notebook/ai/graph/[id]/[section]", baseMetadata);

async function baseMetadata({ params }: Props): Promise<Metadata> {
  const n = getNode(params.id);
  const s = section360(params.section);
  const f = AI_360[params.id];
  // A guard only: dynamicParams = false already answers an unknown section with a 404.
  if (!n || !s || !f || !s.has(f)) notFound();
  const url = sectionPath(n.id, s.id);
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
  const url = `${SITE_URL}${sectionPath(n.id, s.id)}`;
  const layer = LAYER_BY_ID.get(n.layer);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: GRAPHS.ai.notebookName, item: `${SITE_URL}${GRAPHS.ai.notebook}` },
      { "@type": "ListItem", position: 2, name: GRAPHS.ai.name, item: `${SITE_URL}${hubPath()}` },
      { "@type": "ListItem", position: 3, name: layer?.label ?? "Layer", item: `${SITE_URL}${hubPath()}?layer=${n.layer}` },
      { "@type": "ListItem", position: 4, name: n.name, item: `${SITE_URL}${entityPath(n.id)}` },
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
    isPartOf: { "@type": "Dataset", "@id": `${SITE_URL}${hubPath()}#dataset`, name: GRAPHS.ai.name, url: `${SITE_URL}${hubPath()}` },
    about: { "@type": "Organization", name: n.name, url: n.website ?? undefined },
    license: `${SITE_URL}${hubPath()}#terms`,
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
