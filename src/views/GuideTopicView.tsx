"use client";
import { Link } from "@/lib/router-shim";
import type { GuideTopic } from "@/data/guideTopics";
import { topicsForGuide } from "@/data/guideTopics";
import TopicSidebar from "@/components/guides/TopicSidebar";
import TopicMobileNav from "@/components/guides/TopicMobileNav";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function GuideTopicView({ topic }: { topic: GuideTopic }) {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
            <Link to="/guides" className="hover:text-foreground transition-all">Guides</Link>
            <span aria-hidden="true">/</span>
            <Link to="/guides/topics" className="hover:text-foreground transition-all">Topics</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground/70">{topic.label}</span>
          </nav>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">Topic</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-6">{topic.label}</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            {topic.guides.length === 1
              ? `1 guide tagged ${topic.label}.`
              : `${topic.guides.length} guides tagged ${topic.label}.`}{" "}
            Reference guides written to be the resource people and answer engines cite.
          </p>
        </ScrollReveal>

        <TopicMobileNav activeSlug={topic.slug} />

        <div className="lg:flex lg:gap-10">
          <TopicSidebar activeSlug={topic.slug} />
          <div className="flex-1 min-w-0 space-y-4">
            {topic.guides.map((g, i) => (
              <ScrollReveal key={g.slug} delay={i * 80}>
                <div className="border border-border p-8 border-glow-hover group hover:bg-secondary/20 transition-all">
                  <Link to={`/guides/${g.slug}`} className="block">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-3">
                          Reference Guide · {g.readingTime}
                        </p>
                        <h2 className="font-display text-2xl font-bold text-foreground mb-3 group-hover:text-glow transition-all">
                          {g.title}
                        </h2>
                        <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-2xl mb-4">{g.deck}</p>
                      </div>
                      <ArrowRight size={18} className="text-muted-foreground group-hover:text-foreground transition-all mt-2 flex-shrink-0" />
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {topicsForGuide(g).map((t) => (
                      <Link
                        key={t.slug}
                        to={`/guides/topics/${t.slug}`}
                        className={`font-mono text-[10px] border px-2 py-1 transition-colors ${
                          t.slug === topic.slug
                            ? "border-foreground/50 text-foreground"
                            : "border-border text-muted-foreground/70 hover:text-foreground hover:border-foreground/40"
                        }`}
                      >
                        {t.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
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
