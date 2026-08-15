"use client";
import { Link } from "@/lib/router-shim";
import { guides } from "@/data/guides";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowRight } from "lucide-react";

export default function GuidesIndex() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">Reference</p>
          {/* The nav calls this section Teardowns, so the page a reader lands
              on says Teardowns. The slug stays /guides. */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            Teardowns
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-16 max-w-2xl">
            Complex systems taken apart so you can see how they actually work. Visualized reference guides, written to be the resource people and answer engines cite.
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {guides.map((g, i) => (
            <ScrollReveal key={g.slug} delay={i * 80}>
              <Link
                to={`/guides/${g.slug}`}
                className="block border border-border p-8 border-glow-hover group hover:bg-secondary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-3">
                      Reference Guide · {g.readingTime}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-3 group-hover:text-glow transition-all">
                      {g.title}
                    </h2>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-2xl mb-4">
                      {g.deck}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {g.tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/70">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground group-hover:text-foreground transition-all mt-2 flex-shrink-0" />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
