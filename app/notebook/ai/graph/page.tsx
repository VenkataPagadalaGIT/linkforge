import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import AiGraphView from "@/views/AiGraphView";
import { LAYERS, ONTOLOGY_COUNTS, nodesInLayer } from "@/data/aiOntology";
import { entityPath } from "@/lib/graph-urls";
import { jsonLdScript } from "@/lib/jsonld";
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

const HUB = `${SITE_URL}/notebook/ai/graph`;
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Dataset",
      "@id": `${HUB}#dataset`,
      name: "The AI Intelligence Graph",
      description: "Every company, chip, mineral, power source, fund and policy in the AI economy as one graph, with a sourced file for each entity.",
      url: HUB,
      creator: { "@id": `${SITE_URL}/#person` },
    },
    { "@type": "DefinedTermSet", "@id": `${HUB}#terms`, name: "The AI Intelligence Graph", url: HUB },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <AiGraphView />
      {/* The graph itself draws in the browser; this list is how a crawler or a screen reader reaches every entity. */}
      <section aria-labelledby="graph-all-h" className="mx-auto max-w-7xl border-t border-border px-6 py-12">
        <h2 id="graph-all-h" className="font-display text-xl font-bold text-foreground">Every entity in the graph, by layer</h2>
        {LAYERS.map((l) => {
          const ns = nodesInLayer(l.id);
          return ns.length ? (
            <div key={l.id} className="mt-6">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">{l.label}</h3>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[12px]">
                {ns.map((n) => (
                  <li key={n.id}><a href={entityPath(n.id)} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">{n.name}</a></li>
                ))}
              </ul>
            </div>
          ) : null;
        })}
      </section>
    </>
  );
}
