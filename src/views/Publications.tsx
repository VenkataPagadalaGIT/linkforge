"use client";
import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";
import NeuralNetBackground from "@/components/NeuralNetBackground";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import SolutionsGraph from "@/components/SolutionsGraph";
import PageSidebar from "@/components/PageSidebar";

import { ExternalLink, ArrowRight, FlaskConical, Brain, TrendingUp } from "lucide-react";
import { Link } from "@/lib/router-shim";

const publications = [
  {
    type: "journal",
    title: "AI-Assisted SEO: Leveraging Machine Learning for Search Engine Optimization",
    source: "International Journal of Scientific Research in Computer Science, Engineering and Information Technology",
    year: "2023",
    link: "#",
  },
  {
    type: "journal",
    title: "Google, SEO and Helpful Content: How AI Can Be Helpful for E-Commerce Websites",
    source: "Journal of Digital & Social Media Marketing",
    year: "2024",
    link: "#",
  },
];

const featuredProject = {
  title: "Omniscite",
  subtitle: "Neural Agent Orchestration",
  desc: "100+ neural agent orchestration pipeline — multi-agent system that autonomously coordinates technical audits, content optimization, and competitive analysis at enterprise scale.",
  tags: ["AI Agents", "Neural Nets", "A2A Protocol", "MCP", "Python", "RAG", "LLM Orchestration"],
  status: "Research → Product",
};

const projects = [
  {
    title: "Knowledge Graph Engine",
    status: "Production",
    desc: "5.3M keyword taxonomy across a 5-level hierarchy with <1ms classification speed.",
    tags: ["Knowledge Graphs", "Entity Resolution", "NLP"],
  },
  {
    title: "RAG Search Engine",
    status: "Active",
    desc: "Retrieval-Augmented Generation engine for enterprise knowledge bases — natural language querying across millions of documents.",
    tags: ["RAG", "Vector DB", "LLM"],
  },
  {
    title: "MCP Server Integrations",
    status: "Active",
    desc: "Model Context Protocol servers enabling AI agents to interact with enterprise search tools and analytics in real-time.",
    tags: ["MCP", "AI Agents", "API Design"],
  },
  {
    title: "Enterprise Topic Clustering",
    status: "Production",
    desc: "Python-based NLP system for automated topic clustering across 50M+ pages with content gap analysis.",
    tags: ["NLP", "Python", "BigQuery"],
  },
  {
    title: "A2A Agent Pipelines",
    status: "Active",
    desc: "Agent-to-Agent communication pipelines for autonomous content optimization and competitive analysis workflows.",
    tags: ["A2A Protocol", "Multi-Agent"],
  },
  {
    title: "SEO Data Lake & Analytics",
    status: "Production",
    desc: "Comprehensive SEO data lake in BigQuery with real-time organic performance tracking and anomaly detection.",
    tags: ["BigQuery", "Analytics", "SQL"],
  },
];

const researchInterests = [
  {
    icon: Brain,
    title: "AI Systems & Agent Architecture",
    desc: "Multi-agent orchestration, MCP servers, A2A pipelines, and autonomous AI workflows at enterprise scale.",
  },
  {
    icon: TrendingUp,
    title: "Business Intelligence & Market Systems",
    desc: "200 years of business evolution patterns, market disruption cycles, and how AI transforms competitive landscapes.",
  },
  {
    icon: FlaskConical,
    title: "Applied AI for Search & Discovery",
    desc: "RAG engines, knowledge graphs, answer engine optimization, and the future of information retrieval.",
  },
];

const tocSections = [
  { label: "Top 100 AI Contributors", id: "ai-contributors" },
  { label: "Research Interests", id: "research-interests" },
  { label: "Featured System", id: "featured-system" },
  { label: "Active Systems", id: "active-systems" },
  { label: "Published Research", id: "published-research" },
  { label: "Topic Explorer", id: "topic-explorer" },
  { label: "Solutions", id: "solutions" },
];

const Lab = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative overflow-hidden">
      <SEO
        title="Lab | AI Research, Systems & Projects | Venkata Pagadala"
        description="Original AI research, production systems, published papers, and interactive explorations — building at the intersection of AI, business intelligence, and search."
        canonical="https://venkatapagadala.com/publications"
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NeuralNetBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            Research · Systems · Exploration
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            The Lab
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            Where research meets production — AI systems, published work, and interactive explorations across artificial intelligence, business strategy, and search.
          </p>
        </ScrollReveal>

        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="The Lab — AI Research, Systems & Projects | Venkata Pagadala" />

          <div className="flex-1 min-w-0">
            {/* ── AI Contributors (TOP) ── */}
            <div id="ai-contributors" className="mb-20 scroll-mt-28">
              <ScrollReveal>
                <Link
                  to="/ai-contributors"
                  className="block border-2 border-foreground/20 p-8 sm:p-10 group relative overflow-hidden hover:border-foreground/40 transition-all"
                >
                  <div className="absolute top-4 right-4 font-mono text-[10px] border border-foreground/30 px-3 py-1 text-foreground/60 uppercase tracking-widest">
                    Interactive Explorer
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-4">
                    ★ Featured
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-2">
                    Top 100 AI Contributors
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground/60 mb-4 tracking-wider uppercase">
                    2026 Edition · The Definitive AI Notebook
                  </p>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
                    An interactive exploration of the people shaping AI — researchers, founders, and policy advocates. Narrative chapters, learning paths, timeline, glossary, and curated reading lists.
                  </p>
                  <span className="inline-flex items-center gap-2 font-mono text-xs text-foreground group-hover:text-glow transition-all tracking-widest uppercase">
                    Explore Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </ScrollReveal>
            </div>

            {/* ── Research Interests ── */}
            <div id="research-interests" className="mb-20 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-6">
                  Research Interests
                </p>
              </ScrollReveal>
              <div className="grid sm:grid-cols-3 gap-4">
                {researchInterests.map((interest, i) => (
                  <ScrollReveal key={interest.title} delay={i * 100}>
                    <div className="border border-border p-6 border-glow-hover h-full">
                      <interest.icon size={20} className="text-foreground/60 mb-4" />
                      <h3 className="font-display text-base font-bold text-foreground mb-2">{interest.title}</h3>
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{interest.desc}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* ── Featured Project ── */}
            <div id="featured-system" className="mb-12 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-6">
                  Featured System
                </p>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <div className="border border-border p-8 sm:p-10 border-glow-hover relative overflow-hidden">
                  <div className="absolute top-4 right-4 font-mono text-[10px] border border-border px-3 py-1 text-muted-foreground/60 uppercase tracking-widest">
                    {featuredProject.status}
                  </div>
                  <h3 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-2">
                    {featuredProject.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground/60 mb-4 tracking-wider uppercase">
                    {featuredProject.subtitle}
                  </p>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
                    {featuredProject.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {featuredProject.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ── All Projects ── */}
            <div id="active-systems" className="mb-20 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-6">
                  Active Systems
                </p>
              </ScrollReveal>
              <div className="grid md:grid-cols-2 gap-4">
                {projects.map((project, i) => (
                  <ScrollReveal key={project.title} delay={i * 80}>
                    <div className="border border-border p-6 h-full border-glow-hover">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-display text-lg font-bold text-foreground">{project.title}</h3>
                        <span className="font-mono text-[10px] border border-border px-2 py-0.5 text-muted-foreground/50 uppercase tracking-widest">
                          {project.status}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">{project.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* ── Published Research ── */}
            <div id="published-research" className="mb-20 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-2">
                  Published Research
                </p>
                <div className="border border-foreground/30 inline-block px-4 py-2 mb-8 border-glow">
                  <span className="font-mono text-[10px] text-foreground tracking-widest uppercase">
                    ★ Top Organic Search Voice — LinkedIn
                  </span>
                </div>
              </ScrollReveal>
              <div className="space-y-6">
                {publications.map((pub, i) => (
                  <ScrollReveal key={pub.title} delay={i * 100}>
                    <div className="border border-border p-8 border-glow-hover">
                      <p className="font-mono text-[10px] text-muted-foreground/40 tracking-widest uppercase mb-4">
                        Peer-Reviewed Paper
                      </p>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                        {pub.title}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground mb-4 leading-relaxed">
                        {pub.source}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-muted-foreground/40">{pub.year}</span>
                        <a href={pub.link} className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:text-glow transition-all">
                          Read Paper <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* ── Topic Explorer ── */}
            <div id="topic-explorer" className="mb-20 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-4">
                  Topic Explorer
                </p>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  An interactive map of topics across AI systems, enterprise SEO, and machine learning — hover to explore, click to drill down.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <KnowledgeGraph />
              </ScrollReveal>
            </div>

            {/* ── Solutions Overview ── */}
            <div id="solutions" className="mb-20 scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-4">
                  Solutions
                </p>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  From Fortune 500 AI infrastructure to growth-stage consulting — explore what I build and offer.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <SolutionsGraph />
              </ScrollReveal>
            </div>

            {/* ── CTA ── */}
            <ScrollReveal>
              <div className="border border-foreground/30 p-8 text-center border-glow">
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Interested in collaborating?</h3>
                <p className="font-mono text-xs text-muted-foreground mb-6 max-w-md mx-auto">
                  Open to research partnerships, investment conversations, and building AI systems together.
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
  );
};

export default Lab;
