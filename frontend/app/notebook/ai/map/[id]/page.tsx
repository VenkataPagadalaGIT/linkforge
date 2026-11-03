import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AiNodeView from "@/views/AiNodeView";
import { getNode, LAYER_BY_ID, NODE_TYPE_META } from "@/data/aiOntology";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: { id: string };
}

// Server-render on demand — bots get full HTML, readers get it cached after first hit.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = getNode(params.id);
  if (!n) return { title: "Entity not found", robots: { index: false } };
  const desc = (n.story || n.tagline).slice(0, 155);
  const url = `/notebook/ai/map/${n.id}`;
  const title = `${n.name} · ${NODE_TYPE_META[n.type].label} in the AI Systems Map`;
  return {
    title,
    description: desc,
    keywords: [n.name, NODE_TYPE_META[n.type].label, LAYER_BY_ID.get(n.layer)?.label || "", "AI supply chain", n.chokepoint ? "chokepoint" : ""].filter(Boolean),
    alternates: { canonical: url },
    openGraph: { url, type: "article", title, description: desc, siteName: "Venkata Pagadala · Mono Mind" },
    twitter: { card: "summary", title, description: desc },
  };
}

export default function Page({ params }: Props) {
  const n = getNode(params.id);
  if (!n) notFound();
  const url = `${SITE_URL}/notebook/ai/map/${n.id}`;
  const layer = LAYER_BY_ID.get(n.layer);

  const termLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: n.name,
    description: n.story || n.tagline,
    url,
    termCode: n.id,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "The AI Systems Map",
      url: `${SITE_URL}/notebook/ai/map`,
    },
  };
  const sameAs = [n.website, n.github].filter(Boolean);
  if (sameAs.length) termLd.sameAs = sameAs;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AI Notebook", item: `${SITE_URL}/notebook/ai` },
      { "@type": "ListItem", position: 2, name: "AI Systems Map", item: `${SITE_URL}/notebook/ai/map` },
      { "@type": "ListItem", position: 3, name: `${layer?.label ?? "Layer"}`, item: `${SITE_URL}/notebook/ai/map` },
      { "@type": "ListItem", position: 4, name: n.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <AiNodeView id={n.id} />
    </>
  );
}
