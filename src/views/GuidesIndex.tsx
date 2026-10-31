"use client";
import { Link } from "@/lib/router-shim";
import { guides } from "@/data/guides";
import { topicsForGuide } from "@/data/guideTopics";
import { LEARN_HUB, with3d, saysThreeD, type LearnHubSection } from "@/data/learnHub";
import TopicSidebar from "@/components/guides/TopicSidebar";
import TopicMobileNav from "@/components/guides/TopicMobileNav";
import LearnBadges from "@/components/guides/LearnBadges";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowRight } from "lucide-react";

const bySlug = new Map(guides.map((g) => [`/guides/${g.slug}`, g]));
const classified = new Set(LEARN_HUB.flatMap((s) => s.items.map((it) => it.to)));
/** No orphans: a guide added to the data but not yet filed in src/data/learnHub.ts still shows, under its own heading. */
const unclassified = guides.filter((g) => !classified.has(`/guides/${g.slug}`));
const SECTIONS: LearnHubSection[] = unclassified.length
  ? [
      ...LEARN_HUB,
      {
        id: "more",
        title: "More guides",
        blurb: "Recently added, not yet filed under a subject.",
        items: unclassified.map((g) => ({ label: g.title, note: g.deck, to: `/guides/${g.slug}` })),
      },
    ]
  : LEARN_HUB;

export default function GuidesIndex() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">Notebooks · AI</p>
          {/* The nav calls this page All Guides, so the page a reader lands on
              says All Guides. The slug stays /guides. */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            All Guides
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            Every guide in one place, grouped by subject. Complex systems taken apart so you can see how they actually work, written to be the resource people and answer engines cite.
          </p>
          <nav aria-label="Subjects on this page" className="flex flex-wrap gap-2 mb-10">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="font-mono text-[11px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                {s.title} · {s.items.length}
              </a>
            ))}
          </nav>
        </ScrollReveal>

        <TopicMobileNav />

        <div className="md:flex md:gap-8 lg:gap-10">
          <TopicSidebar />
          <div className="flex-1 min-w-0 space-y-14">
            {SECTIONS.map((sec) => (
              <section key={sec.id} id={sec.id} aria-labelledby={`${sec.id}-h`} className="scroll-mt-28">
                <h2 id={`${sec.id}-h`} className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {sec.title}
                </h2>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6 max-w-2xl">{sec.blurb}</p>
                <div className="space-y-4">
                  {sec.items.map(with3d).map((it, i) => {
                    const g = bySlug.get(it.to);
                    return (
                      <ScrollReveal key={it.to} delay={Math.min(i, 4) * 60}>
                        {g ? (
                          <div className="border border-border p-8 border-glow-hover group hover:bg-secondary/20 transition-all">
                            <Link href={it.to} className="block">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-3">
                                    Reference Guide · {g.readingTime}
                                  </p>
                                  <h3 className="font-display text-2xl font-bold text-foreground mb-3 group-hover:text-glow transition-all">
                                    {g.title}
                                    {/* A guide whose own title says 3D ("3D HVAC Troubleshooting") skips the badge. */}
                                    <LearnBadges badges={it.badges?.filter((b) => !(b === "3D" && saysThreeD(g.title)))} />
                                  </h3>
                                  <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-2xl mb-4">{g.deck}</p>
                                </div>
                                <ArrowRight size={18} className="text-muted-foreground group-hover:text-foreground transition-all mt-2 flex-shrink-0" />
                              </div>
                            </Link>
                            <div className="flex flex-wrap gap-2">
                              {topicsForGuide(g).map((t) => (
                                <Link
                                  key={t.slug}
                                  href={`/guides/topics/${t.slug}`}
                                  className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors"
                                >
                                  {t.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={it.to}
                            className="flex items-center justify-between gap-4 border border-border px-8 py-5 border-glow-hover group hover:bg-secondary/20 transition-all"
                          >
                            <div>
                              <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-2">Reference</p>
                              <h3 className="font-display text-lg font-bold text-foreground group-hover:text-glow transition-all">
                                {it.label}
                                <LearnBadges badges={it.badges} />
                              </h3>
                              <p className="font-mono text-xs text-muted-foreground leading-relaxed">{it.note}</p>
                            </div>
                            <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground transition-all flex-shrink-0" />
                          </Link>
                        )}
                      </ScrollReveal>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
