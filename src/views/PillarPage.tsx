"use client";
import { useParams, Link } from "@/lib/router-shim";
import { getPillarBySlug, getBlogsByPillar } from "@/data/insights";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const PillarPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const pillar = getPillarBySlug(slug || "");
  const relatedPosts = getBlogsByPillar(slug || "");

  if (!pillar) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="font-mono text-sm text-muted-foreground mb-8">Pillar page not found.</p>
          <Link to="/insights" className="font-mono text-xs text-foreground hover:text-glow transition-all">
            ← Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <SEO
        title={pillar.metaTitle}
        description={pillar.metaDescription}
        canonical={`https://venkatapagadala.com/insights/${slug}`}
        ogType="article"
      />
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2">
            <Link to="/insights" className="hover:text-foreground transition-all">Insights</Link>
            <span>/</span>
            <span className="text-foreground">{pillar.title}</span>
          </nav>
        </ScrollReveal>

        {/* Header */}
        <ScrollReveal>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            {pillar.headline}
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-3xl">
            {pillar.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-16">
            {pillar.tags.map((tag) => (
              <span key={tag} className="font-mono text-[10px] border border-border px-3 py-1 text-muted-foreground/60">
                {tag}
              </span>
            ))}
          </div>
        </ScrollReveal>

        {/* Sections */}
        {pillar.sections.map((section, i) => (
          <ScrollReveal key={section.heading} delay={i * 100}>
            <div className="border-l-2 border-border pl-6 mb-12 hover:border-foreground/50 transition-all">
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {section.heading}
              </h2>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                {section.body}
              </p>
            </div>
          </ScrollReveal>
        ))}

        {/* Related Blog Posts */}
        {relatedPosts.length > 0 && (
          <>
            <ScrollReveal>
              <div className="border-t border-border pt-12 mt-16">
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-8 uppercase">
                  Related Articles
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {relatedPosts.map((post, i) => (
                <ScrollReveal key={post.slug} delay={i * 80}>
                  <Link
                    to={`/insights/${pillar.slug}/${post.slug}`}
                    className="block border border-border p-6 border-glow-hover group hover:bg-secondary/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] text-muted-foreground/40 mb-2">{post.date}</p>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-glow transition-all">
                          {post.title}
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-all mt-1 flex-shrink-0" />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </>
        )}

        {/* Back */}
        <ScrollReveal>
          <div className="mt-16">
            <Link to="/insights" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft size={12} /> All Insights
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default PillarPage;
