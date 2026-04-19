import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";
import PageSidebar from "@/components/PageSidebar";
import venkatPhoto from "@/assets/venkata-pagadala.jpeg";

const stats = [
  { value: "10+", label: "Years Experience" },
  { value: "50M+", label: "Pages Managed" },
  { value: "25M+", label: "Pages Audited Bi-Weekly" },
  { value: "5.3M", label: "Keywords Classified" },
];

const skills = [
  "MCP", "A2A", "Claude Code", "RAG Systems", "Knowledge Graphs",
  "Vector Embeddings", "Cosine Similarity", "Topic Clustering",
  "LLM Optimization", "GPT-4", "Claude", "Entity Recognition", "NLP", "AI Agents",
  "JSON-LD", "Canonical Tags", "Crawl Budget", "Log File Analysis",
  "Core Web Vitals", "hreflang", "Site Migrations", "Sitemaps",
  "Google Cloud Knowledge Graph API", "Botify", "Screaming Frog",
  "Ahrefs", "Semrush", "Google Search Console", "BigQuery", "SQL",
  "Python", "GA4", "PowerBI",
];

const experiences = [
  {
    company: "AT&T",
    role: "Lead Technical Product Manager, AI & Automation",
    period: "March 2025 — Present",
    location: "Atlanta, Georgia",
    achievements: [
      "Built AI-powered metadata automation with knowledge graphs and content guardrails (legal, brand voice), scaling to 100K+ pages with multi-model LLM testing",
      "Shipped RAG-based internal linking engine using vector embeddings, cosine similarity, and entity recognition for intelligent link recommendations",
      "Built topic clustering system using vector embeddings to map content relationships for programmatic recommendations",
      "Led AI-powered internal search chatbot using RAG architecture for Answer Engine Optimization (AEO)",
      "Architected unified JSON-LD schema system across fragmented engineering teams with dynamic generation from CMS/catalog feeds",
      "Established enterprise crawl infrastructure (Botify 50M+ crawls) with SEO observability, Akamai CDN caching, and Core Web Vitals optimization",
      "Built market share content optimization tool with nationwide and geo-focused analysis (state, city, zip) and L1-L6 classification",
      "Unlocked 3-year content roadmap through systematic market share analysis with automated internal linking and schema validation",
    ],
  },
  {
    company: "CoStar Group (Apartments.com)",
    role: "SEO Product Lead (Level 3)",
    period: "Oct 2022 — March 2025",
    location: "Atlanta, Georgia",
    achievements: [
      "Owned technical SEO across 5 properties (40M+ pages); shipped AI-powered content translation (GPT-4) across 1M+ pages",
      "Led cross-functional team of 6 in sprint-based development; built analytics dashboards (BigQuery, SQL, PowerBI)",
    ],
  },
  {
    company: "American Addiction Centers",
    role: "Senior SEO Software Developer",
    period: "Apr 2019 — Oct 2022",
    location: "San Diego, California",
    achievements: [
      "Led PHP to React.js migration; implemented JSON-LD structured data across 1M+ page healthcare portfolio",
    ],
  },
  {
    company: "Dyad Ventures",
    role: "Search Marketing Strategist",
    period: "Jan 2018 — Feb 2019",
    location: "",
    achievements: [],
  },
  {
    company: "Sprout for Business",
    role: "SEO Manager",
    period: "Apr 2016 — Dec 2017",
    location: "",
    achievements: [],
  },
];
const tocSections = [
  { label: "About", id: "about" },
  { label: "Stats", id: "stats" },
  { label: "Skills", id: "skills" },
  { label: "Experience", id: "experience" },
  { label: "Education", id: "education" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <SEO
        title="About Venkata Pagadala | AI Product Owner & Technical SEO Lead"
        description="10+ years building AI systems and scaling organic search for Fortune 500 brands. Lead Technical Product Manager at AT&T. Published researcher in AI-assisted SEO."
        canonical="https://venkatapagadala.com/about"
      />
      <div className="max-w-6xl mx-auto">
        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="About Venkata Pagadala — AI Product Owner & SEO Leader" />

          <div className="flex-1 min-w-0">
            {/* ── About Section ── */}
            <div id="about" className="scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
                  {"{01}"} — About
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-12">
                  Venkata Pagadala — AI Product Owner & SEO Lead
                </h1>
              </ScrollReveal>

              <div className="grid md:grid-cols-5 gap-12 mb-20">
                <ScrollReveal className="md:col-span-3">
                  <p className="font-mono text-sm leading-relaxed text-muted-foreground mb-6">
                    I build AI systems that automate SEO at a scale that manual execution can't match. Currently leading AI & Automation at AT&T as Lead Technical Product Manager, shipping RAG pipelines, knowledge graphs, and programmatic SEO infrastructure across 50M+ pages. Not strategy decks. Production systems.
                  </p>
                  <p className="font-mono text-sm leading-relaxed text-muted-foreground mb-6">
                    AI integrations connecting LLMs to live SEO data for automated keyword research and content optimization. A RAG-powered internal linking engine using vector embeddings and entity recognition. Automated pipelines that run technical SEO audits at scale. A market share content tool with geo-segmentation that generates 3-year roadmaps.
                  </p>
                  <p className="font-mono text-sm leading-relaxed text-muted-foreground mb-6">
                    10 years in Technical SEO — the fundamentals that power how Google ranks content today. Site migrations, crawl budget optimization, structured data at enterprise scale, Core Web Vitals, international SEO. Tools: Botify (50M+ crawls), Screaming Frog, Ahrefs, SEMrush, BigQuery, Python.
                  </p>
                  <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                    Previously scaled SEO for CoStar Group (Apartments.com, ApartmentFinders.com, ForRent.com) and built technical SEO infrastructure across multiple verticals. Published researcher — "Google, SEO and Helpful Content: How AI Can Be Helpful for E-Commerce Websites" in the Journal of Digital & Social Media Marketing, December 2024.
                  </p>
                </ScrollReveal>

                <ScrollReveal className="md:col-span-2" delay={200}>
                  <div className="aspect-[3/4] border border-border overflow-hidden">
                    <img 
                      src={venkatPhoto} 
                      alt="Venkata Pagadala" 
                      loading="eager"
                      fetchPriority="high"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* Stats */}
            <div id="stats" className="scroll-mt-28 mb-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <ScrollReveal key={stat.label} delay={i * 100}>
                    <div className="border border-border p-6 text-center border-glow-hover">
                      <div className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-2">
                        {stat.value}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
                        {stat.label}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div id="skills" className="scroll-mt-28 mb-20">
              <ScrollReveal>
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-6 uppercase">
                  Core Competencies
                </p>
              </ScrollReveal>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, i) => (
                  <ScrollReveal key={skill} delay={i * 30}>
                    <span className="font-mono text-xs border border-border px-4 py-2 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all cursor-default border-glow-hover">
                      {skill}
                    </span>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* ── Experience Section ── */}
            <div id="experience" className="scroll-mt-28 mb-20">
              <ScrollReveal>
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
                  {"{02}"} — Experience
                </p>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-16">
                  Career Timeline
                </h2>
              </ScrollReveal>

              <div className="relative">
                <div className="absolute left-0 md:left-8 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-12">
                  {experiences.map((exp, i) => (
                    <ScrollReveal key={exp.company + exp.period} delay={i * 150}>
                      <div className="relative pl-8 md:pl-20">
                        <div className="absolute left-0 md:left-8 top-2 w-2 h-2 -translate-x-[3px] bg-foreground animate-pulse-glow" />
                        <div className="border border-border p-6 sm:p-8 border-glow-hover">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                            <div>
                              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                                {exp.company}
                              </h3>
                              <p className="font-mono text-sm text-muted-foreground mt-1">{exp.role}</p>
                            </div>
                            <div className="font-mono text-xs text-muted-foreground/60 mt-2 sm:mt-0 tracking-wider">
                              {exp.period}
                            </div>
                          </div>
                          <p className="font-mono text-[10px] text-muted-foreground/40 mb-4 tracking-wider uppercase">
                            {exp.location}
                          </p>
                          <ul className="space-y-2">
                            {exp.achievements.map((a, j) => (
                              <li key={j} className="font-mono text-xs text-muted-foreground leading-relaxed flex gap-3">
                                <span className="text-foreground/30 mt-0.5 shrink-0">▸</span>
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Education */}
            <div id="education" className="scroll-mt-28">
              <ScrollReveal>
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-6 uppercase">
                  Education & Certifications
                </p>
                <div className="space-y-4">
                  {[
                    { title: "Disruptive Strategy", sub: "Harvard University" },
                    { title: "Cyber Security", sub: "Massachusetts Institute of Technology (MIT)" },
                    { title: "M.S. Computer Information Systems (GPA: 4.0)", sub: "New England College" },
                    { title: "MBA", sub: "National Institute of Business Management" },
                    { title: "B.E. Computer Science", sub: "KL University" },
                  ].map((edu) => (
                    <div key={edu.title} className="border border-border p-6 border-glow-hover">
                      <div className="font-display text-lg font-semibold text-foreground">{edu.title}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-1">{edu.sub}</div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
