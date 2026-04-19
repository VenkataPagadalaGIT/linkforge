import ScrollReveal from "@/components/ScrollReveal";
import Holographic3DWrapper from "@/components/Holographic3DWrapper";
import SEO from "@/components/SEO";

const featuredProject = {
  title: "Omniscite",
  subtitle: "Neural Agent Orchestration for SEO",
  desc: "A multi-layer AI agent pipeline that automates the entire SEO workflow — from research and competitor analysis to content creation, technical audits, and reporting. 100+ specialized agents organized across neural network-inspired layers work in concert to deliver autonomous, end-to-end search optimization at enterprise scale.",
  tags: ["AI Agents", "Neural Nets", "A2A Protocol", "MCP", "Python", "RAG", "LLM Orchestration"],
  layers: ["Research Layer", "Competitor Layer", "SEO Layer", "Content Layer", "Technical Layer", "Analytics Layer"],
  status: "Research → Product",
};

const projects = [
  {
    num: "01",
    title: "Knowledge Graph Engine",
    desc: "Built an enterprise knowledge graph system that maps entity relationships across millions of pages — powering topical authority analysis, content gap detection, and semantic SEO recommendations using graph embeddings and ontology design.",
    tags: ["Knowledge Graphs", "Entity Resolution", "Graph Embeddings", "Ontology", "Python"],
  },
  {
    num: "02",
    title: "Context Graph for Solutions",
    desc: "Interactive context graph visualization mapping solution domains and their capabilities into an explorable network — enabling clients to navigate interconnected service offerings and discover relevant expertise through visual exploration.",
    tags: ["Context Graphs", "D3/SVG", "React", "Data Visualization", "UX"],
  },
  {
    num: "03",
    title: "MCP Server Integrations",
    desc: "Built Model Context Protocol server integrations enabling AI agents to interact with enterprise search tools, crawl data, and analytics platforms in real-time.",
    tags: ["MCP", "AI Agents", "Python", "API Design"],
  },
  {
    num: "04",
    title: "A2A Agent Pipelines",
    desc: "Developed Agent-to-Agent communication pipelines allowing autonomous AI workflows for content optimization, technical audits, and competitive analysis.",
    tags: ["A2A Protocol", "Multi-Agent", "Orchestration"],
  },
  {
    num: "05",
    title: "Claude Code Pipelines",
    desc: "Implemented Claude Code-powered development pipelines for automated SEO tooling, data transformations, and report generation at enterprise scale.",
    tags: ["Claude", "Automation", "Code Generation"],
  },
  {
    num: "06",
    title: "RAG Search Engine",
    desc: "Built a Retrieval-Augmented Generation engine for internal knowledge bases, enabling natural language querying of SEO documentation and performance data.",
    tags: ["RAG", "Vector DB", "LLM", "Search"],
  },
  {
    num: "07",
    title: "Enterprise Topic Clustering",
    desc: "Python-based NLP system for automated topic clustering across 50M+ pages, generating content gap analysis and internal linking recommendations.",
    tags: ["NLP", "Python", "Clustering", "BigQuery"],
  },
  {
    num: "08",
    title: "Automated Crawl Intelligence",
    desc: "Real-time crawl monitoring and indexation system integrating Screaming Frog, Botify, and ContentKing data into unified dashboards.",
    tags: ["Crawl Ops", "Automation", "Data Pipelines"],
  },
  {
    num: "09",
    title: "Schema Markup at Scale",
    desc: "Programmatic schema markup generation and validation system deployed across millions of pages, improving rich result visibility by 35%.",
    tags: ["Schema.org", "JSON-LD", "Structured Data"],
  },
  {
    num: "10",
    title: "SEO Data Lake & Analytics",
    desc: "Built comprehensive SEO data lake in BigQuery with Looker Studio dashboards for real-time organic performance tracking and anomaly detection.",
    tags: ["BigQuery", "Looker", "Analytics", "SQL"],
  },
];

const Projects = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <SEO
        title="Projects | AI Systems & SEO Tools | Venkata Pagadala"
        description="Technical projects including AI agent pipelines, RAG engines, knowledge graphs, and enterprise SEO automation tools — by Venkata Pagadala."
        canonical="https://venkatapagadala.com/projects"
      />
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            {"{03}"} — Projects
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-16">
            AI Systems & Technical Projects
          </h1>
        </ScrollReveal>

        {/* Featured: Omniscite */}
        <ScrollReveal delay={100}>
          <Holographic3DWrapper phase={0.5} intensity="strong">
            <div className="border border-border p-8 sm:p-10 mb-12 group transition-all hover:bg-secondary/20 relative overflow-hidden">
              <div className="absolute top-4 right-4 font-mono text-[10px] border border-border px-3 py-1 text-muted-foreground/60 uppercase tracking-widest">
                {featuredProject.status}
              </div>
              <p className="font-mono text-xs text-muted-foreground/40 mb-3 tracking-widest">{"{ FEATURED }"}</p>
              <h3 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-2">
                {featuredProject.title}
              </h3>
              <p className="font-mono text-xs text-muted-foreground/60 mb-4 tracking-wider uppercase">
                {featuredProject.subtitle}
              </p>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
                {featuredProject.desc}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {featuredProject.layers.map((layer) => (
                  <span key={layer} className="font-mono text-[10px] bg-secondary/40 border border-border px-3 py-1.5 text-foreground/70">
                    {layer}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {featuredProject.tags.map((tag) => (
                  <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Holographic3DWrapper>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <ScrollReveal key={project.num} delay={i * 100}>
              <Holographic3DWrapper phase={i / projects.length} intensity="medium">
                <div className="border border-border p-6 sm:p-8 h-full flex flex-col group transition-all hover:bg-secondary/20">
                  <div className="font-mono text-xs text-muted-foreground/40 mb-4 tracking-widest">
                    {"{" + project.num + "}"}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-glow transition-all">
                    {project.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6 flex-1">
                    {project.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Holographic3DWrapper>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
