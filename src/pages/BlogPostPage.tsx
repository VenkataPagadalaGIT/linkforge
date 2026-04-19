"use client";
import { useParams, Link } from "@/lib/router-shim";
import { getBlogBySlug, getPillarBySlug, getBlogsByPillar } from "@/data/insights";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import SEO from "@/components/SEO";

const BlogPostPage = () => {
  const { pillarSlug, postSlug } = useParams<{ pillarSlug: string; postSlug: string }>();
  const post = getBlogBySlug(postSlug || "");
  const pillar = getPillarBySlug(pillarSlug || "");
  const relatedPosts = getBlogsByPillar(pillarSlug || "").filter((p) => p.slug !== postSlug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postSlug]);

  if (!post || !pillar) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="font-mono text-sm text-muted-foreground mb-8">Article not found.</p>
          <Link to="/insights" className="font-mono text-xs text-foreground hover:text-glow transition-all">
            ← Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return (
          <h2 key={i} className="font-display text-2xl font-bold text-foreground mt-10 mb-4">
            {block.replace("## ", "")}
          </h2>
        );
      }
      if (block.startsWith("- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        return (
          <ul key={i} className="list-none space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="font-mono text-sm text-muted-foreground leading-relaxed flex gap-2">
                <span className="text-foreground/40">—</span>
                <span dangerouslySetInnerHTML={{ __html: item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              </li>
            ))}
          </ul>
        );
      }
      if (block.startsWith("1. ")) {
        const items = block.split("\n").filter((l) => /^\d+\./.test(l));
        return (
          <ol key={i} className="list-none space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="font-mono text-sm text-muted-foreground leading-relaxed flex gap-2">
                <span className="text-foreground/40 font-bold">{j + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              </li>
            ))}
          </ol>
        );
      }
      return (
        <p key={i} className="font-mono text-sm text-muted-foreground leading-relaxed my-4"
           dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
      );
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <SEO
        title={post.metaTitle}
        description={post.metaDescription}
        canonical={`https://venkatapagadala.com/insights/${pillarSlug}/${postSlug}`}
        ogType="article"
      />
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap">
            <Link to="/insights" className="hover:text-foreground transition-all">Insights</Link>
            <span>/</span>
            <Link to={`/insights/${pillar.slug}`} className="hover:text-foreground transition-all">{pillar.title}</Link>
            <span>/</span>
            <span className="text-foreground/60 truncate max-w-[200px]">{post.title}</span>
          </nav>
        </ScrollReveal>

        {/* Article Header */}
        <ScrollReveal>
          <p className="font-mono text-[10px] text-muted-foreground/40 tracking-widest uppercase mb-4">
            {post.date}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                {tag}
              </span>
            ))}
          </div>
          {/* Link to pillar page */}
          <Link
            to={`/insights/${pillar.slug}`}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/60 hover:text-foreground transition-all mb-12"
          >
            Part of: <span className="underline">{pillar.title}</span>
          </Link>
        </ScrollReveal>

        {/* Article Content */}
        <ScrollReveal delay={100}>
          <article className="border-t border-border pt-8">
            {renderContent(post.content)}
          </article>
        </ScrollReveal>

        {/* LinkedIn link */}
        {post.linkedinUrl && (
          <ScrollReveal delay={200}>
            <div className="border border-border p-6 mt-12">
              <p className="font-mono text-xs text-muted-foreground mb-3">
                Originally shared on LinkedIn
              </p>
              <a
                href={post.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-foreground hover:text-glow transition-all"
              >
                View LinkedIn Post <ExternalLink size={12} />
              </a>
            </div>
          </ScrollReveal>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <>
            <ScrollReveal>
              <div className="border-t border-border pt-12 mt-16">
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-8 uppercase">
                  More on {pillar.headline}
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {relatedPosts.slice(0, 3).map((related, i) => (
                <ScrollReveal key={related.slug} delay={i * 80}>
                  <Link
                    to={`/insights/${pillar.slug}/${related.slug}`}
                    className="block border border-border p-5 border-glow-hover group hover:bg-secondary/20 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground group-hover:text-glow transition-all">
                          {related.title}
                        </h3>
                        <p className="font-mono text-[10px] text-muted-foreground/40 mt-1">{related.date}</p>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-all flex-shrink-0" />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <ScrollReveal>
          <div className="flex items-center justify-between mt-16 pt-8 border-t border-border">
            <Link to={`/insights/${pillar.slug}`} className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft size={12} /> {pillar.headline}
            </Link>
            <Link to="/insights" className="font-mono text-xs text-muted-foreground hover:text-foreground transition-all">
              All Insights
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default BlogPostPage;
