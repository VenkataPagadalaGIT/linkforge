"use client";
import { Link } from "@/lib/router-shim";
import { GUIDE_TOPICS } from "@/data/guideTopics";
import { guides } from "@/data/guides";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowLeft } from "lucide-react";

/**
 * /guides/topics: every topic, A to Z, grouped by first letter.
 *
 * The side menu lists every topic today. At a few hundred topics it should
 * show the most-used ones and point here for the rest; this page is the
 * stable URL that makes that switch possible later without moving anything,
 * and the single server-rendered page that links every topic hub at once.
 */
export default function GuideTopicsIndex() {
  const letters = new Map<string, typeof GUIDE_TOPICS>();
  for (const t of GUIDE_TOPICS) {
    const first = t.label[0].toUpperCase();
    const key = /[A-Z]/.test(first) ? first : "0-9";
    letters.set(key, [...(letters.get(key) ?? []), t]);
  }
  const groups = [...letters.entries()].sort(([a], [b]) => (a === "0-9" ? -1 : b === "0-9" ? 1 : a.localeCompare(b)));

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
            <Link to="/guides" className="hover:text-foreground transition-all">Guides</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground/70">Topics</span>
          </nav>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">Reference</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-6">Guide topics, A to Z</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            {GUIDE_TOPICS.length} topics across {guides.length} reference guides. Every topic has its own page listing every guide that carries it, so anything here is one click from everything related to it.
          </p>
        </ScrollReveal>

        <nav aria-label="Jump to letter" className="flex flex-wrap gap-1.5 mb-10">
          {groups.map(([letter]) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="font-mono text-[11px] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              {letter}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {groups.map(([letter, topics]) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-28">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">{letter}</h2>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                {topics.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={`/guides/topics/${t.slug}`}
                      className="flex items-baseline justify-between gap-3 font-mono text-xs text-muted-foreground hover:text-foreground py-1 border-b border-border/40 transition-colors"
                    >
                      <span>{t.label}</span>
                      <span className="text-muted-foreground/70 tabular-nums">
                        {t.guides.length} guide{t.guides.length === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
