"use client";
import { useParams, Link } from "@/lib/router-shim";
import { services } from "@/components/ServicesGrid";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import SEO from "@/components/SEO";

const serviceDetails: Record<string, {
  headline: string;
  description: string;
  benefits: string[];
  approach: { title: string; body: string }[];
  cta: string;
}> = {
  editorial: {
    headline: "Editorial SEO That Drives Revenue",
    description: "From topical authority mapping to premium copywriting — content strategies that rank, engage, and convert at enterprise scale.",
    benefits: [
      "Build unshakable topical authority in your niche",
      "Map content to every stage of the buyer journey",
      "Identify high-intent gaps your competitors miss",
      "Content briefs that writers actually love",
    ],
    approach: [
      { title: "Audit & Research", body: "Deep-dive into your existing content landscape, competitor gaps, and audience intent patterns using AI-powered analysis." },
      { title: "Strategy & Architecture", body: "Build a topical authority map with pillar-cluster architecture, persona-driven content calendars, and prioritized topic queues." },
      { title: "Execution & Optimization", body: "High-impact content briefs, premium copywriting, and continuous optimization based on performance data." },
    ],
    cta: "Need content that actually ranks?",
  },
  technical: {
    headline: "Technical SEO for Complex Architectures",
    description: "Enterprise-grade visibility audits, site migrations, and crawl infrastructure — built for sites with 50M+ pages.",
    benefits: [
      "Full visibility audits across massive site architectures",
      "Zero-downtime migration planning and execution",
      "Crawl budget optimization for enterprise scale",
      "International SEO with hreflang precision",
    ],
    approach: [
      { title: "Diagnostics", body: "Comprehensive crawl analysis, log file auditing, and Core Web Vitals assessment across your entire domain portfolio." },
      { title: "Architecture Design", body: "Internal linking topology, URL structure optimization, and crawlability improvements tailored to your tech stack." },
      { title: "Implementation & Monitoring", body: "Hands-on technical execution with continuous monitoring dashboards and automated alert systems." },
    ],
    cta: "Ready for an enterprise-grade audit?",
  },
  programmatic: {
    headline: "Programmatic SEO at Scale",
    description: "Scalable page templates, intelligent indexation, and high-volume content generation — turning data into organic traffic.",
    benefits: [
      "Generate thousands of unique, high-quality pages",
      "Smart indexation logic that prevents bloat",
      "Template systems that scale with your data",
      "Automated title tag and meta optimization",
    ],
    approach: [
      { title: "Data & Template Strategy", body: "Identify scalable data sources, design page templates, and build the content generation pipeline." },
      { title: "Quality & Indexation", body: "Implement uniqueness scoring, canonical strategies, and indexation controls to keep Google focused on your best pages." },
      { title: "Launch & Iterate", body: "Deploy at scale, monitor indexation rates, and continuously refine templates based on ranking performance." },
    ],
    cta: "Want to scale content 10x?",
  },
  aeo: {
    headline: "Answer Engine Optimization",
    description: "Get cited by ChatGPT, Perplexity, and Google AI Overviews — the next frontier of search visibility.",
    benefits: [
      "Track your brand's visibility in AI-generated answers",
      "Optimize content structure for AI citation",
      "Build authority signals AI models trust",
      "Stay ahead of the AEO curve",
    ],
    approach: [
      { title: "AI Visibility Audit", body: "Analyze where and how AI models cite your brand vs. competitors across ChatGPT, Perplexity, Gemini, and AI Overviews." },
      { title: "Content Restructuring", body: "Reformat content for machine readability — structured data, concise answers, and authoritative sourcing patterns." },
      { title: "Outreach & Monitoring", body: "Build citation-worthy backlinks and continuously monitor AI search landscape changes." },
    ],
    cta: "Ready to win in AI search?",
  },
  performance: {
    headline: "SEO Performance & Analytics",
    description: "Growth forecasting, cohort analysis, and custom reporting — making data your competitive advantage.",
    benefits: [
      "Predict organic growth with ML-powered forecasting",
      "Custom BigQuery dashboards for executive reporting",
      "Cohort analysis to understand user behavior trends",
      "CRO + SEO alignment for maximum ROI",
    ],
    approach: [
      { title: "Measurement Framework", body: "Design KPI hierarchies, attribution models, and reporting cadences aligned to business outcomes." },
      { title: "Dashboard Engineering", body: "Build custom Looker Studio and BigQuery dashboards that surface actionable insights, not vanity metrics." },
      { title: "Optimization Loop", body: "Continuous A/B testing, CRO audits, and growth forecasting to keep your organic program on trajectory." },
    ],
    cta: "Need data-driven SEO leadership?",
  },
  "ai-product": {
    headline: "AI Systems, Knowledge Graphs & Process Automation",
    description: "Custom AI agents, MCP server integrations, A2A pipelines, RAG engines, knowledge graphs, context graphs, and end-to-end SaaS solutions — the full AI infrastructure stack for productivity and cost savings.",
    benefits: [
      "Custom AI agents with MCP server integrations for real-time tool access",
      "A2A (Agent-to-Agent) pipelines for autonomous multi-step workflows",
      "RAG engines with enterprise knowledge graphs and context graphs",
      "Entity resolution and semantic relationship mapping at scale",
      "ML pipelines for content, search, and operations",
      "Process automation that saves 40%+ in operational costs",
      "End-to-end custom SaaS solutions",
    ],
    approach: [
      { title: "Discovery & Audit", body: "Map your current workflows, identify automation opportunities, and quantify potential ROI from AI integration. Assess readiness for MCP, A2A, and RAG architectures." },
      { title: "Knowledge Architecture", body: "Design knowledge graphs and context graphs — entity taxonomies, semantic relationships, and vector embedding strategies that power intelligent retrieval and decision-making." },
      { title: "Agent & Pipeline Design", body: "Architect custom AI agents with MCP server connections, A2A communication protocols, and RAG pipelines tailored to your team's tools and processes." },
      { title: "Build & Deploy", body: "Develop, test, and deploy production-grade AI systems — knowledge graph construction, entity resolution, embedding pipelines — with monitoring, failsafes, and continuous improvement loops." },
      { title: "Scale & Optimize", body: "Extend automation across departments, build custom SaaS layers, and continuously optimize for cost savings and productivity." },
    ],
    cta: "Ready to build your AI advantage?",
  },
};

const ServiceLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = services.find((s) => s.slug === slug);
  const details = serviceDetails[slug || ""];

  if (!service || !details) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="font-mono text-sm text-muted-foreground mb-8">Service not found.</p>
          <Link to="/" className="font-mono text-xs text-foreground hover:text-glow transition-all">← Back Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <SEO
        title={`${details.headline} | Venkata Pagadala`}
        description={details.description}
        canonical={`https://venkatapagadala.com/solutions/${slug}`}
      />
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-all">Home</Link>
            <span>/</span>
            <Link to="/solutions" className="hover:text-foreground transition-all">Solutions</Link>
            <span>/</span>
            <span className="text-foreground">{service.title}</span>
          </nav>
        </ScrollReveal>

        {/* Hero */}
        <ScrollReveal>
          <div className="mb-20">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-4">
              {service.tagline}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
              {details.headline}
            </h1>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {details.description}
            </p>
          </div>
        </ScrollReveal>

        {/* What You Get */}
        <ScrollReveal delay={100}>
          <div className="border border-border p-8 sm:p-10 mb-12 border-glow-hover">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-6">
              What You Get
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {details.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle size={14} className="text-foreground/60 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Services List */}
        <ScrollReveal delay={150}>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-6">
            Capabilities
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
            {service.items.map((item, i) => (
              <div
                key={item}
                className="border border-border p-4 hover:bg-secondary/20 hover:border-foreground/20 transition-all"
              >
                <span className="font-mono text-[10px] text-muted-foreground/30 mr-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Approach */}
        <ScrollReveal delay={200}>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-8">
            The Approach
          </p>
        </ScrollReveal>

        {details.approach.map((step, i) => (
          <ScrollReveal key={step.title} delay={250 + i * 80}>
            <div className="border-l-2 border-border pl-6 mb-8 hover:border-foreground/50 transition-all">
              <p className="font-mono text-[10px] text-muted-foreground/40 mb-2">Phase {String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          </ScrollReveal>
        ))}

        {/* CTA */}
        <ScrollReveal delay={400}>
          <div className="border border-foreground/30 p-8 sm:p-10 mt-16 text-center border-glow">
            <h3 className="font-display text-2xl font-bold text-foreground mb-4">{details.cta}</h3>
            <p className="font-mono text-xs text-muted-foreground mb-6 max-w-md mx-auto">
              From Fortune 500 to fast-growing startups — let's build your competitive advantage.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-foreground px-6 py-3 font-mono text-xs text-foreground hover:bg-foreground hover:text-background transition-all tracking-widest uppercase"
            >
              Let's Talk <ArrowRight size={12} />
            </Link>
          </div>
        </ScrollReveal>

        {/* Related Insights */}
        <ScrollReveal delay={450}>
          <div className="mt-16">
            <Link
              to={`/insights/${service.pillarSlug}`}
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              Read {service.title} insights <ArrowRight size={12} />
            </Link>
          </div>
        </ScrollReveal>

        {/* Back */}
        <ScrollReveal>
          <div className="mt-8">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft size={12} /> Back Home
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default ServiceLanding;
