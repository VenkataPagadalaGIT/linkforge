import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import ArticleCard from "@/components/linkedin/ArticleCard";
import { LINKEDIN_ARTICLES, LINKEDIN_PROFILE } from "@/data/linkedinArchive";

/** Every LinkedIn article, newest first, each kept here in full. */
export default function LinkedInArticlesView() {
  const n = LINKEDIN_ARTICLES.length;
  const years = LINKEDIN_ARTICLES.map((a) => a.date.slice(0, 4)).sort();
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <a href="/linkedin" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
            ← LinkedIn archive
          </a>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
            LinkedIn archive · Articles{years.length ? ` · ${years[0]} to ${years[years.length - 1]}` : ""}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">My LinkedIn articles</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-10">
            {n} article{n === 1 ? "" : "s"} I published on{" "}
            <a href={LINKEDIN_PROFILE} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              LinkedIn
            </a>
            , kept here in full with their images: conference notes, guides, scripts and the systems I built. Each page links back to
            the original.
          </p>
        </ScrollReveal>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="linkedin-articles">
          {LINKEDIN_ARTICLES.map((a) => (
            <li key={a.id}>
              <ArticleCard post={a} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
