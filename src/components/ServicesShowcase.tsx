"use client";
import { Link } from "@/lib/router-shim";
import { ArrowRight, Bot, Search, Rocket, Code2, Brain, Cpu, Sparkles, BarChart3, FileText, Globe, Zap } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const servicePillars = [
  {
    category: "AI",
    label: "AI-Native Systems",
    tagline: "We build intelligent systems that compound.",
    description:
      "Enterprise AI consulting, automation pipelines, and production-grade agent systems — from idea to deployed infrastructure.",
    link: "/solutions/ai-product",
    cta: "Explore AI Solutions",
    items: [
      { icon: Bot, text: "AI Agents & Multi-Agent Systems" },
      { icon: Cpu, text: "RAG, MCP & A2A Pipelines" },
      { icon: Zap, text: "AI Automation & Process Engineering" },
      { icon: Sparkles, text: "AI SaaS Product Development" },
      { icon: Brain, text: "Enterprise AI Consulting" },
    ],
  },
  {
    category: "SEO",
    label: "SEO & Growth",
    tagline: "Search engines are AI now. We optimize for both.",
    description:
      "Full-stack SEO consulting from pre-launch to enterprise scale — technical infrastructure, content strategy, and operational SEO that drives pipeline.",
    link: "/solutions",
    cta: "Explore SEO Solutions",
    items: [
      { icon: Search, text: "Technical & Operational SEO" },
      { icon: FileText, text: "Content Marketing & Editorial" },
      { icon: Rocket, text: "Pre-Launch & Idea Stage SEO" },
      { icon: Globe, text: "Programmatic & Scalable SEO" },
      { icon: BarChart3, text: "Performance & Growth Analytics" },
    ],
  },
  {
    category: "AEO",
    label: "AI Search Optimization",
    tagline: "Win where AI answers for your buyers.",
    description:
      "Optimize your brand's visibility across ChatGPT, Perplexity, Gemini, and every AI search surface — the new organic channel.",
    link: "/solutions/aeo",
    cta: "Explore AEO",
    items: [
      { icon: Sparkles, text: "ChatGPT & Perplexity Visibility" },
      { icon: Brain, text: "Gemini & AI Overview Optimization" },
      { icon: Code2, text: "AI Citation & Entity Strategy" },
      { icon: BarChart3, text: "AI Visibility Tracking & Analytics" },
    ],
  },
];

const ServicesShowcase = () => {
  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-24">
      <ScrollReveal>
        <div className="text-center mb-16">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-4">
            AI-Native Consulting
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-4">
            Growth Engines via<br />AI & Search.
          </h2>
          <p className="font-mono text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We combine expert strategy with AI to make your brand the definitive answer — wherever buyers search, and wherever AI answers for them.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border">
        {servicePillars.map((pillar, i) => (
          <ScrollReveal key={pillar.category} delay={i * 120}>
            <Link
              to={pillar.link}
              className="group block p-8 sm:p-10 h-full border-b lg:border-b-0 lg:border-r border-border last:border-r-0 last:border-b-0 hover:bg-secondary/30 transition-all"
            >
              {/* Category badge */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase">
                  {pillar.category}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Title */}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground group-hover:text-glow transition-all mb-2">
                {pillar.label}
              </h3>

              {/* Tagline */}
              <p className="font-mono text-[11px] text-muted-foreground/60 mb-5 leading-relaxed">
                {pillar.tagline}
              </p>

              {/* Description */}
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-8">
                {pillar.description}
              </p>

              {/* Service items */}
              <div className="space-y-0 border-t border-border">
                {pillar.items.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 py-3 border-b border-border/50"
                  >
                    <div className="w-1 h-1 bg-foreground/40 flex-shrink-0" />
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 flex items-center gap-2 font-mono text-xs text-foreground/70 group-hover:text-foreground transition-all tracking-wider">
                {pillar.cta}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {/* AI-Native badge */}
      <ScrollReveal delay={400}>
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px flex-1 max-w-20 bg-border" />
          <p className="font-mono text-[10px] text-muted-foreground/40 tracking-[0.3em] uppercase">
            AI-Native · Expert-Led · Production-Grade
          </p>
          <div className="h-px flex-1 max-w-20 bg-border" />
        </div>
      </ScrollReveal>
    </div>
  );
};

export default ServicesShowcase;
