import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import AiGraphView from "@/views/AiGraphView";
import { ONTOLOGY_COUNTS } from "@/data/aiOntology";
import { withSeoOverrides } from "@/lib/seo-overrides";

// The hub of the graph; every entity in it has its own page one level down (app/notebook/ai/graph/[id]).
const metadata: Metadata = {
  title: "The AI Intelligence Graph",
  description: `Every company, chip, mineral, power source, fund and policy in the AI economy as one graph: ${ONTOLOGY_COUNTS.nodes} entities, ${ONTOLOGY_COUNTS.edges} typed links, ${ONTOLOGY_COUNTS.chokepoints} supply-chain chokepoints, and a sourced file for each entity.`,
  alternates: { canonical: "/notebook/ai/graph" },
  keywords: ["AI intelligence graph", "AI dependency graph", "AI value chain graph", "AI ontology", "semiconductors", "GPU", "foundry"],
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/notebook/ai/graph",
    type: "website",
    title: "The AI Intelligence Graph",
    description: "The whole AI economy as one interactive graph, with a sourced file for every entity.",
    siteName: "Venkata Pagadala · Mono Mind",
  },
};
export const generateMetadata = withSeoOverrides("/notebook/ai/graph", metadata);

export default function Page() {
  return <AiGraphView />;
}
