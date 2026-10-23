import type { Metadata } from "next";
import AiGraphView from "@/views/AiGraphView";
import { ONTOLOGY_COUNTS } from "@/data/aiOntology";

export const metadata: Metadata = {
  title: "The AI Systems Map: Graph view",
  description: `The entire AI value chain as one node-edge dependency graph: ${ONTOLOGY_COUNTS.nodes} entities, ${ONTOLOGY_COUNTS.edges} links, ${ONTOLOGY_COUNTS.chokepoints} supply-chain chokepoints.`,
  alternates: { canonical: "/notebook/ai/graph" },
  keywords: ["AI dependency graph", "AI value chain graph", "AI ontology", "semiconductors", "GPU", "foundry"],
  openGraph: {
    url: "/notebook/ai/graph",
    type: "website",
    title: "The AI Systems Map: Graph view",
    description: "The whole AI value chain as one interactive node-edge graph.",
    siteName: "Venkata Pagadala · Mono Mind",
  },
};

export default function Page() {
  return <AiGraphView />;
}
