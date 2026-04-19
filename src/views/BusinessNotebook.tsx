"use client";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import { ArrowLeft, Briefcase, BookOpen, FileText, Lightbulb } from "lucide-react";
import SEO from "@/components/SEO";

const tocSections = [
  { label: "Overview", id: "overview" },
  { label: "Frameworks", id: "frameworks" },
  { label: "Case Studies", id: "case-studies" },
];

const BusinessNotebook = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <SEO
        title="Business Notebook | AI Strategy & Frameworks | Venkata Pagadala"
        description="Strategic frameworks, case studies, and playbooks for building and scaling with AI — a living reference for founders, operators, and strategists."
        canonical="https://venkatapagadala.com/notebook/business"
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <Link
              to="/notebook"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={12} /> Back to Notebooks
            </Link>

            <div className="mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase size={18} className="text-muted-foreground/50" />
                <p className="font-mono text-[11px] text-muted-foreground/50 uppercase tracking-[0.3em]">
                  Business Notebook
                </p>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Business Notebook
              </h1>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Strategic frameworks, case studies, and playbooks for building and scaling with AI. A living reference for founders, operators, and strategists.
              </p>
            </div>
          </ScrollReveal>

          {/* Overview */}
          <section id="overview" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="border border-border p-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-muted-foreground/40" />
                  <h2 className="font-display text-xl font-bold text-foreground">Overview</h2>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6">
                  This notebook is being built as a comprehensive reference for AI-native business strategy. It will cover go-to-market frameworks, enterprise adoption patterns, pricing models, and real-world case studies from companies at every stage.
                </p>
                <div className="border border-foreground/20 bg-foreground/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={12} className="text-foreground/50" />
                    <span className="font-mono text-[10px] text-foreground/50 uppercase tracking-widest">Status</span>
                  </div>
                  <p className="font-mono text-[11px] text-foreground/70 leading-relaxed">
                    This notebook is currently under development. Check back soon for frameworks, case studies, and strategic guides.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Frameworks placeholder */}
          <section id="frameworks" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="border border-border border-dashed p-8 text-center">
                <BookOpen size={24} className="text-muted-foreground/20 mx-auto mb-3" />
                <h2 className="font-display text-lg font-bold text-foreground/60 mb-2">Frameworks</h2>
                <p className="font-mono text-[11px] text-muted-foreground/40">Coming soon</p>
              </div>
            </ScrollReveal>
          </section>

          {/* Case Studies placeholder */}
          <section id="case-studies" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="border border-border border-dashed p-8 text-center">
                <Briefcase size={24} className="text-muted-foreground/20 mx-auto mb-3" />
                <h2 className="font-display text-lg font-bold text-foreground/60 mb-2">Case Studies</h2>
                <p className="font-mono text-[11px] text-muted-foreground/40">Coming soon</p>
              </div>
            </ScrollReveal>
          </section>
        </div>

        <PageSidebar
          sections={tocSections}
          shareTitle="Business Notebook"
        />
      </div>
    </div>
  );
};

export default BusinessNotebook;
