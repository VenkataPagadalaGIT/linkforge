"use client";
import { useEffect } from "react";
import { Link } from "@/lib/router-shim";
import type { Guide } from "@/data/guides";
import GuideRenderer from "@/components/guides/GuideRenderer";
import PageSidebar from "@/components/PageSidebar";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowLeft } from "lucide-react";

export default function GuideView({ guide }: { guide: Guide }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [guide.slug]);

  const toc = guide.blocks
    .filter((b): b is Extract<typeof b, { kind: "h2" }> => b.kind === "h2")
    .map((b) => ({ id: b.id, label: b.text.replace(/^\d+\.\s*/, "").slice(0, 32) }));

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap">
            <Link to="/guides" className="hover:text-foreground transition-all">Guides</Link>
            <span>/</span>
            <span className="text-foreground/60">{guide.title}</span>
          </nav>
        </ScrollReveal>

        <ScrollReveal>
          <p className="font-mono text-[10px] text-muted-foreground/40 tracking-widest uppercase mb-4">
            Reference Guide · {guide.readingTime} · Updated {guide.dateModified}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-6">
            {guide.headline}
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            {guide.deck}
          </p>
          <div className="flex flex-wrap gap-2 mb-12">
            {guide.tags.map((tag) => (
              <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">
                {tag}
              </span>
            ))}
          </div>
        </ScrollReveal>

        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={toc} shareTitle={guide.metaTitle} />
          <div className="flex-1 min-w-0 border-t border-border pt-4">
            <ScrollReveal delay={100}>
              <GuideRenderer guide={guide} />
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal>
          <div className="mt-16 pt-8 border-t border-border">
            <Link to="/guides" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft size={12} /> All Guides
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
