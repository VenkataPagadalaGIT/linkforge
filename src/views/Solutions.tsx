"use client";
import { Link } from "@/lib/router-shim";
import { services } from "@/components/ServicesGrid";
import ScrollReveal from "@/components/ScrollReveal";
import SolutionsGraph from "@/components/SolutionsGraph";
import NeuralNetBackground from "@/components/NeuralNetBackground";
import PageSidebar from "@/components/PageSidebar";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import SEO from "@/components/SEO";

const Solutions = () => {

  const tocSections = useMemo(() => [
    { label: "Overview", id: "overview" },
    { label: "All Solutions", id: "all-solutions" },
    { label: "Contact", id: "cta" },
  ], []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative overflow-hidden">
      <SEO
        title="AI & SEO Solutions | Enterprise Systems & Automation | Venkata Pagadala"
        description="Enterprise AI systems, knowledge graphs, RAG engines, technical SEO, AEO, and performance analytics — solutions for Fortune 500 and growth-stage companies."
        canonical="https://venkatapagadala.com/solutions"
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NeuralNetBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            What I Build
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            Solutions
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12 max-w-2xl">
            From Fortune 500 AI infrastructure to growth-stage SEO consulting — production systems that drive measurable outcomes.
          </p>
        </ScrollReveal>

        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="Solutions — AI Systems, SEO & Automation | Venkata Pagadala" />

          <div className="flex-1 min-w-0">
            <div id="overview" className="scroll-mt-28">
              <ScrollReveal delay={200}>
                <SolutionsGraph />
              </ScrollReveal>
            </div>

            <div id="all-solutions" className="mt-20 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-8">
                  All Solutions
                </p>
              </ScrollReveal>

              <div className="space-y-6">
                {services.map((service, i) => (
                  <ScrollReveal key={service.slug} delay={i * 100}>
                    <Link
                      to={`/solutions/${service.slug}`}
                      className="group block border border-border p-8 sm:p-10 border-glow-hover hover:bg-secondary/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-mono text-[10px] text-muted-foreground/30">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground group-hover:text-glow transition-all">
                              {service.title}
                            </h2>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground/50 mb-5 ml-10">
                            {service.tagline}
                          </p>
                          <div className="flex flex-wrap gap-2 ml-10">
                            {service.items.slice(0, 5).map((item) => (
                              <span key={item} className="font-mono text-[10px] border border-border px-3 py-1 text-muted-foreground/60">
                                {item}
                              </span>
                            ))}
                            {service.items.length > 5 && (
                              <span className="font-mono text-[10px] px-3 py-1 text-muted-foreground/30">
                                +{service.items.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={18} className="text-muted-foreground/30 group-hover:text-foreground transition-all mt-2 flex-shrink-0" />
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div id="cta" className="scroll-mt-28">
              <ScrollReveal delay={600}>
                <div className="border border-foreground/30 p-8 sm:p-10 mt-16 text-center border-glow">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                    Need a custom solution?
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground mb-6 max-w-md mx-auto">
                    From enterprise AI systems to growth-stage SEO consulting — let's build your competitive advantage.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 border border-foreground px-6 py-3 font-mono text-xs text-foreground hover:bg-foreground hover:text-background transition-all tracking-widest uppercase"
                  >
                    Let's Talk <ArrowRight size={12} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solutions;
