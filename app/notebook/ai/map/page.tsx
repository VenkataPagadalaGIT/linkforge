import type { Metadata } from "next";
import AiSystemsMapView from "@/views/AiSystemsMapView";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { ONTOLOGY_COUNTS, LAYERS } from "@/data/aiOntology";

const desc = `The AI value chain as one graph: ${ONTOLOGY_COUNTS.nodes} entities across 7 layers, ${ONTOLOGY_COUNTS.edges} typed dependencies, ${ONTOLOGY_COUNTS.chokepoints} supply-chain chokepoints. Trace what any company depends on.`;

export const metadata: Metadata = {
  title: "AI Systems Map: 455 Entities, 7 Layers",
  description: desc,
  alternates: { canonical: "/notebook/ai/map" },
  keywords: ["AI supply chain", "AI value chain", "semiconductors", "GPU", "foundry", "HBM", "data centers", "AI ontology", "Nvidia", "TSMC", "ASML"],
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/notebook/ai/map",
    type: "website",
    title: "The AI Systems Map",
    description: "The entire AI value chain as one interactive dependency graph.",
    siteName: "Venkata Pagadala · Mono Mind",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "The AI Systems Map",
  description: desc,
  url: `${SITE_URL}/notebook/ai/map`,
  creator: { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL },
  keywords: ["artificial intelligence", "AI supply chain", "semiconductors", "GPU", "foundry", "HBM", "data centers", "energy", "critical minerals"],
  variableMeasured: LAYERS.map((l) => l.label),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AiSystemsMapView />
    </>
  );
}
