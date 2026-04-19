"use client";
import { Link } from "@/lib/router-shim";
import { pillarPages, getBlogsByPillar } from "@/data/insights";
import ScrollReveal from "@/components/ScrollReveal";
import Holographic3DWrapper from "@/components/Holographic3DWrapper";
import PageSidebar from "@/components/PageSidebar";

import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import SEO from "@/components/SEO";

const Insights = () => {

  const tocSections = useMemo(() => 
    pillarPages.map((p) => ({ label: p.headline.slice(0, 30), id: p.slug })),
    []
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <SEO
        title="Insights | AI, SEO & Machine Learning | Venkata Pagadala"
        description="Deep dives into AI agents, machine learning, RAG engines, knowledge graphs, and enterprise technical SEO — by Venkata Pagadala."
        canonical="https://venkatapagadala.com/insights"
      />
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            {"{05}"} — Insights
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            Thought Leadership
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-16 max-w-2xl">
            Deep dives into AI agents, machine learning, and enterprise SEO — insights from building production systems across 50M+ pages.
          </p>
        </ScrollReveal>

        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="Insights — AI, SEO & Machine Learning | Venkata Pagadala" />

          <div className="flex-1 min-w-0">
            <div className="space-y-16">
              {pillarPages.map((pillar, pi) => {
                const posts = getBlogsByPillar(pillar.slug);
                return (
                  <div key={pillar.slug} id={pillar.slug} className="scroll-mt-28">
                    <ScrollReveal delay={pi * 150}>
                      <Holographic3DWrapper phase={pi / pillarPages.length} intensity="medium">
                        <div className="border border-border p-8 sm:p-10 group transition-all">
                          <Link to={`/insights/${pillar.slug}`} className="block mb-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-mono text-[10px] text-muted-foreground/40 tracking-widest uppercase mb-3">
                                  Pillar Guide
                                </p>
                                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground group-hover:text-glow transition-all mb-3">
                                  {pillar.headline}
                                </h2>
                                <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-2xl">
                                  {pillar.description.slice(0, 200)}...
                                </p>
                              </div>
                              <ArrowRight size={18} className="text-muted-foreground group-hover:text-foreground transition-all mt-2 flex-shrink-0" />
                            </div>
                          </Link>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {pillar.tags.map((tag) => (
                              <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="border-t border-border/50 pt-6 space-y-3">
                            <p className="font-mono text-[10px] text-muted-foreground/40 tracking-widest uppercase mb-3">
                              {posts.length} Articles
                            </p>
                            {posts.map((post) => (
                              <Link
                                key={post.slug}
                                to={`/insights/${pillar.slug}/${post.slug}`}
                                className="flex items-center justify-between gap-4 py-2 px-3 -mx-3 hover:bg-secondary/20 transition-all group/post"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-mono text-[10px] text-muted-foreground/30 flex-shrink-0">{post.date}</span>
                                  <span className="font-mono text-xs text-muted-foreground group-hover/post:text-foreground transition-all truncate">
                                    {post.title}
                                  </span>
                                </div>
                                <ArrowRight size={10} className="text-muted-foreground/30 group-hover/post:text-foreground transition-all flex-shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </Holographic3DWrapper>
                    </ScrollReveal>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
