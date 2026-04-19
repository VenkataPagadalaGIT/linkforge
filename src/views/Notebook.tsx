"use client";
import { Link } from "@/lib/router-shim";
import { Brain, Briefcase, ArrowRight, Users, BookOpen, Clock, Map, Library } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import SEO from "@/components/SEO";

const notebooks = [
  {
    title: "AI Notebook",
    description: "Top 100 AI contributors, narrative chapters, interactive timelines, glossary, and curated reading lists — a comprehensive research companion.",
    icon: Brain,
    to: "/notebook/ai",
    stats: [
      { label: "Contributors", value: "100", icon: Users },
      { label: "Chapters", value: "6+", icon: BookOpen },
      { label: "Timeline", value: "1986–2025", icon: Clock },
      { label: "Learning Paths", value: "5+", icon: Map },
    ],
  },
  {
    title: "Business Notebook",
    description: "Frameworks, case studies, and strategic insights on building with AI — from GTM playbooks to enterprise adoption patterns.",
    icon: Briefcase,
    to: "/notebook/business",
    stats: [
      { label: "Frameworks", value: "Coming", icon: Library },
      { label: "Case Studies", value: "Soon", icon: BookOpen },
    ],
  },
];

const tocSections = [
  { label: "AI Notebook", id: "ai-notebook" },
  { label: "Business Notebook", id: "business-notebook" },
];

const Notebook = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <SEO
        title="Research Notebooks | AI & Business | Venkata Pagadala"
        description="Deep-dive reference notebooks on AI contributors, learning roadmaps, concepts encyclopedia, and business strategy — by Venkata Pagadala."
        canonical="https://venkatapagadala.com/notebook"
        breadcrumbs={[
          { name: "Home", url: "https://venkatapagadala.com" },
          { name: "Notebooks", url: "https://venkatapagadala.com/notebook" },
        ]}
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <div className="mb-16">
              <p className="font-mono text-[11px] text-muted-foreground/50 uppercase tracking-[0.3em] mb-4">
                Notebook
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Research Notebooks
              </h1>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Deep-dive reference materials organized into focused notebooks. Each one is a living document — constantly updated with new insights, contributors, and frameworks.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-8">
            {notebooks.map((nb) => {
              const Icon = nb.icon;
              return (
                <ScrollReveal key={nb.to}>
                  <div id={nb.title === "AI Notebook" ? "ai-notebook" : "business-notebook"} className="scroll-mt-28">
                    <Link
                      to={nb.to}
                      className="block border border-border p-8 sm:p-10 group hover:border-foreground/30 transition-all border-glow-hover"
                    >
                      <div className="flex items-start gap-5 mb-6">
                        <div className="w-12 h-12 border border-border flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                          <Icon size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-display text-2xl font-bold text-foreground group-hover:text-glow transition-all mb-2">
                            {nb.title}
                          </h2>
                          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                            {nb.description}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {nb.stats.map((stat) => {
                          const StatIcon = stat.icon;
                          return (
                            <div key={stat.label} className="flex items-center gap-2 border border-border px-3 py-2">
                              <StatIcon size={12} className="text-muted-foreground/40" />
                              <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">{stat.label}</span>
                              <span className="font-mono text-xs text-foreground/80">{stat.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Link>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

        <PageSidebar
          sections={tocSections}
          shareTitle="Research Notebooks"
        />
      </div>
    </div>
  );
};

export default Notebook;
