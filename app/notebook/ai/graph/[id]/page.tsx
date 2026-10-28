import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AiGraphView from "@/views/AiGraphView";
import { getNode, LAYER_BY_ID, NODE_TYPE_META, nodes as ALL_NODES } from "@/data/aiOntology";
import { AI_360 } from "@/data/ai360";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { sections360For } from "@/lib/ai360-sections";
import { entityPath, GRAPHS, hubPath, isReservedSegment, sectionPath } from "@/lib/graph-urls";

interface Props {
  params: { id: string };
}

// The one page per entity: the graph focused on it, then its whole file (overview, 360, connections, money,
// financials, investors, market share, people and hiring, legal, news, earnings), built for every entity at build
// time so crawlers get the file in the HTML and an unknown id is a real 404 (a page rendered on demand under the
// layout's Suspense boundary streams a 200 even when it calls notFound). The 3D stage loads in the browser on top.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_NODES.map((n) => ({ id: n.id }));
}

export const generateMetadata = withSeoOverrides("/notebook/ai/graph/[id]", baseMetadata);

/** What the 360 file holds, for the description. */
function fileSummary(id: string): string {
  const f = AI_360[id];
  if (!f) return "";
  const parts = [
    f.people.length ? `${f.people.length} people in public roles` : "",
    f.rounds.length ? `${f.rounds.length} financings` : "",
    f.legal.length ? `${f.legal.length} legal matters` : "",
    f.hiring ? `${f.hiring.open.toLocaleString("en-US")} open roles` : "",
  ].filter(Boolean);
  return parts.length ? ` Its file: ${parts.join(", ")}, every line with its source sentence.` : "";
}

async function baseMetadata({ params }: Props): Promise<Metadata> {
  const n = getNode(params.id);
  // A guard only: dynamicParams = false already answers an unknown id with a 404.
  if (!n || isReservedSegment(params.id)) notFound();
  const desc = `${(n.story || n.tagline).slice(0, 150).trim()}${fileSummary(n.id)}`.slice(0, 300);
  const url = entityPath(n.id);
  const title = `${n.name} · ${NODE_TYPE_META[n.type].label} in the AI Intelligence Graph`;
  return {
    title,
    description: desc,
    keywords: [n.name, NODE_TYPE_META[n.type].label, LAYER_BY_ID.get(n.layer)?.label || "", "AI supply chain", "AI intelligence graph", n.chokepoint ? "chokepoint" : ""].filter(Boolean),
    alternates: { canonical: url },
    openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url, type: "article", title, description: desc, siteName: "Venkata Pagadala · Mono Mind" },
    twitter: { card: "summary", title, description: desc },
  };
}

export default function Page({ params }: Props) {
  const n = getNode(params.id);
  if (!n || isReservedSegment(params.id)) notFound();
  const url = `${SITE_URL}${entityPath(n.id)}`;
  const layer = LAYER_BY_ID.get(n.layer);
  const sections = sections360For(n.id);

  const termLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: n.name,
    description: n.story || n.tagline,
    url,
    termCode: n.id,
    inDefinedTermSet: { "@type": "DefinedTermSet", name: GRAPHS.ai.name, url: `${SITE_URL}${hubPath()}` },
  };
  const sameAs = [n.website, n.github].filter(Boolean);
  if (sameAs.length) termLd.sameAs = sameAs;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: GRAPHS.ai.notebookName, item: `${SITE_URL}${GRAPHS.ai.notebook}` },
      { "@type": "ListItem", position: 2, name: GRAPHS.ai.name, item: `${SITE_URL}${hubPath()}` },
      { "@type": "ListItem", position: 3, name: layer?.label ?? "Layer", item: `${SITE_URL}${hubPath()}?layer=${n.layer}` },
      { "@type": "ListItem", position: 4, name: n.name, item: url },
    ],
  };
  // The deep sections of the file, each on its own page.
  const partsLd = sections.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${n.name}: sections of its file`,
        itemListElement: sections.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.label, url: `${SITE_URL}${sectionPath(n.id, s.id)}` })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(termLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
      {partsLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(partsLd) }} />}
      <AiGraphView entity={n.id} />
    </>
  );
}
