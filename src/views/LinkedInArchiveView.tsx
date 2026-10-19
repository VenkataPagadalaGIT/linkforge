import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import LinkedInExplorer from "@/components/linkedin/LinkedInExplorer";
import { LINKEDIN_COUNTS, LINKEDIN_PROFILE, LINKEDIN_TOPICS } from "@/data/linkedinArchive";

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
            <Stat label="Items" value={c.items} />
            <Stat label="Images" value={c.images} />
            <Stat label="Videos" value={<span className="text-rose-700 dark:text-rose-300">{c.videos}</span>} />
            <Stat label="Topics" value={c.topics} />
          </div>
        </ScrollReveal>

        <LinkedInExplorer />

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
