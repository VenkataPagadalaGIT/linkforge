import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import LinkedInExplorer from "@/components/linkedin/LinkedInExplorer";
import ArticleCard from "@/components/linkedin/ArticleCard";
import { LINKEDIN_PROFILE, mostEngaging } from "@/data/linkedinArchive";
import { LINKEDIN_ARTICLES, LINKEDIN_COUNTS, LINKEDIN_SOCIAL_POSTS, LINKEDIN_TOPICS } from "@/data/linkedinArchiveServer";

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="border border-border p-5">
    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">{label}</p>
    <p className="font-display text-3xl font-bold text-foreground text-glow">{value}</p>
  </div>
);

export default function LinkedInArchiveView() {
  const c = LINKEDIN_COUNTS;
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
            LinkedIn archive · {c.firstYear} to {c.lastYear}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">
            My LinkedIn, kept here and mapped
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-3">
            {c.posts > 0 && (
              <>
                <a href="/linkedin/posts" className="underline hover:text-foreground">{c.posts} posts</a> with their engagement,{" "}
              </>
            )}
            {c.articles > 0 && (
              <>
                <a href="/linkedin/articles" className="underline hover:text-foreground">{c.articles} articles</a> in full, and{" "}
              </>
            )}
            {c.items} images, videos and documents I shared in LinkedIn posts, articles and comments, mapped as one knowledge graph
            by topic and by the names that recur: conferences, companies, products and people. Search it, filter it, or follow a
            topic. LinkedIn is where I share; this site is where the work lives.
          </p>
          <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed max-w-3xl mb-8">
            Follow along on{" "}
            <a href={LINKEDIN_PROFILE} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              LinkedIn
            </a>
            . Private messages and anything with personal details are not part of this archive.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
            <Stat label="Posts" value={c.posts} />
            <Stat label="Articles" value={c.articles} />
            <Stat label="Videos" value={<span className="text-rose-700 dark:text-rose-300">{c.videos}</span>} />
            <Stat label="Topics" value={c.topics} />
          </div>
        </ScrollReveal>

        <LinkedInExplorer />

        {LINKEDIN_SOCIAL_POSTS.length > 0 && (
          <section className="mt-16" aria-labelledby="li-posts-h">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h2 id="li-posts-h" className="font-display text-xl font-bold text-foreground">
                Most engaging posts
              </h2>
              <a href="/linkedin/posts" className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground underline">
                All {LINKEDIN_SOCIAL_POSTS.length} posts
              </a>
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mostEngaging(LINKEDIN_SOCIAL_POSTS, 8).map((p) => (
                <li key={p.id}>
                  <ArticleCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {LINKEDIN_ARTICLES.length > 0 && (
          <section className="mt-16" aria-labelledby="li-articles-h">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h2 id="li-articles-h" className="font-display text-xl font-bold text-foreground">
                Articles, in full
              </h2>
              <a href="/linkedin/articles" className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground underline">
                All {LINKEDIN_ARTICLES.length} articles
              </a>
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LINKEDIN_ARTICLES.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <ArticleCard post={a} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-16" aria-labelledby="li-topics-h">
          <h2 id="li-topics-h" className="font-display text-xl font-bold text-foreground mb-4">
            Browse by topic
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LINKEDIN_TOPICS.map((t) => (
              <li key={t.id}>
                <a
                  href={`/linkedin/topics/${t.slug}`}
                  className="block h-full border border-border p-4 hover:border-foreground/50 transition-colors"
                  data-testid={`linkedin-topic-${t.slug}`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
                    {t.items.length} item{t.items.length === 1 ? "" : "s"}
                  </p>
                  <p className="font-display text-base font-bold text-foreground mb-1">{t.label}</p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{t.blurb}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
