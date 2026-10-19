import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import ArticleCard from "@/components/linkedin/ArticleCard";
import { LINKEDIN_PROFILE, formatDay, mostEngaging, postPath } from "@/data/linkedinArchive";
import { LINKEDIN_SOCIAL_POSTS } from "@/data/linkedinArchiveServer";

/** Every LinkedIn post kept here: the most engaging first, then all of them by year. */
export default function LinkedInPostsView() {
  const posts = LINKEDIN_SOCIAL_POSTS;
  const top = mostEngaging(posts, 12);
  const byYear = new Map<string, typeof posts>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(p);
  }
  const years = [...byYear.keys()].sort().reverse();
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <a href="/linkedin" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
            ← LinkedIn archive
          </a>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
            LinkedIn archive · Posts{years.length ? ` · ${years[years.length - 1]} to ${years[0]}` : ""}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">My LinkedIn posts</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-10">
            {posts.length} posts I shared on{" "}
            <a href={LINKEDIN_PROFILE} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              LinkedIn
            </a>
            , each kept here with its full text and the time it went out, plus its media and engagement where LinkedIn gave them. Each
            page links back to the original.
          </p>
          <nav aria-label="Years" className="flex flex-wrap gap-1.5 mb-10">
            <a href="#most-engaging" className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border border-border text-muted-foreground hover:text-foreground">
              Most engaging
            </a>
            {years.map((y) => (
              <a key={y} href={`#y${y}`} className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 border border-border text-muted-foreground hover:text-foreground">
                {y} · {byYear.get(y)!.length}
              </a>
            ))}
          </nav>
        </ScrollReveal>
        {top.some((p) => p.engagement?.reactions) && (
          <section id="most-engaging" aria-labelledby="li-top-h" className="mb-14 scroll-mt-24">
            <h2 id="li-top-h" className="font-display text-xl font-bold text-foreground mb-4">Most engaging</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {top.map((p) => (
                <li key={p.id}>
                  <ArticleCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {years.map((y) => (
          <section key={y} id={`y${y}`} aria-labelledby={`li-y${y}`} className="mb-12 scroll-mt-24">
            <h2 id={`li-y${y}`} className="font-display text-xl font-bold text-foreground mb-4">
              {y} <span className="font-mono text-sm text-muted-foreground">· {byYear.get(y)!.length} posts</span>
            </h2>
            {/* Compact rows: hundreds of posts stay a light page */}
            <ol className="border-t border-border">
              {byYear.get(y)!.map((p) => (
                <li key={p.id} className="border-b border-border">
                  <a href={postPath(p)} className="grid grid-cols-[88px_1fr_auto] gap-3 items-baseline py-2 px-1 hover:bg-foreground/[0.04]">
                    <time dateTime={p.date} className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                      {formatDay(p.date.slice(0, 10))}
                    </time>
                    <span className="font-mono text-[12px] text-foreground leading-snug line-clamp-1">{p.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                      {p.engagement?.reactions != null ? `${p.engagement.reactions.toLocaleString("en-US")} reactions` : ""}
                      {p.media.length ? ` · ${p.media.length} media` : ""}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
