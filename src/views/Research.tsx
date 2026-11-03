import ScrollReveal from "@/components/ScrollReveal";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import NeuralNetBackground from "@/components/NeuralNetBackground";
import PageSidebar from "@/components/PageSidebar";
import SEO from "@/components/SEO";

const tocSections = [
  { label: "Knowledge Graph", id: "knowledge-graph" },
];

const Research = () => {

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative overflow-hidden">
      <SEO
        title="Topic Explorer | AI & SEO Research Graph | Venkata Pagadala"
        description="Explore an interactive topic graph across AI systems, SEO, machine learning, and enterprise automation — by Venkata Pagadala."
        canonical="https://venkatapagadala.com/research"
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NeuralNetBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            Topic Explorer
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            Knowledge Graph
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12 max-w-2xl">
            An interactive map of topics across AI systems, enterprise SEO, and machine learning — hover to explore, click to drill down.
          </p>
        </ScrollReveal>

        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="Topic Explorer — AI & SEO Research Graph" />

          <div className="flex-1 min-w-0">
            <div id="knowledge-graph" className="scroll-mt-28">
              <ScrollReveal delay={200}>
                <KnowledgeGraph />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Research;
