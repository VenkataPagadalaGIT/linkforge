import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { ENCYCLOPEDIA_CATEGORIES } from "@/data/aiEncyclopedia";
import {
  refConcepts,
  refCategoryMeta,
  refHref,
  REF_BASE,
  REF_COUNTS,
  INTERACTIVE_FOR,
  DEEP_DIVES,
} from "@/data/learnReference";
import LearnShell, { type ShellGroup } from "@/components/learn/LearnShell";
import EncyclopediaFilter from "@/components/learn/EncyclopediaFilter";

export const metadata: Metadata = {
  title: "AI Encyclopedia",
  description:
    "176 AI concepts across 10 categories, each on its own page with key terms, prerequisites, difficulty and curated free sources. From gradient descent to agent harnesses.",
  alternates: { canonical: "/notebook/ai/encyclopedia" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/notebook/ai/encyclopedia",
    title: "AI Encyclopedia",
  },
};

const groups = (): ShellGroup[] =>
  ENCYCLOPEDIA_CATEGORIES.map((cat) => ({
    title: cat.label,
    color: cat.color,
    items: refConcepts
      .filter((c) => c.category === cat.label)
      .map((c) => ({ href: refHref(c.id), label: c.concept })),
  }));

export default function Page() {
  return (
    <LearnShell
      activeHref={null}
      groups={groups()}
      treeLabel={`Encyclopedia · ${REF_COUNTS.concepts} concepts`}
      homeHref={REF_BASE}
      homeLabel="Encyclopedia home"
      crossLink={{ href: "/notebook/ai", label: "← AI Notebook hub" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
        {REF_COUNTS.concepts} concepts explained · {REF_COUNTS.categories} categories · free
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-4">
        The AI Encyclopedia
      </h1>
      <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
        Every concept on its own page: a plain-words definition, prerequisites you can follow
        backward, what it unlocks, key terms, curated free resources, and, where one exists, an
        interactive 3D machine or a full deep-dive read. Start anywhere; Previous and Next walk
        the whole encyclopedia in learning order.
      </p>
      <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-8 max-w-2xl">
        New to all of this? Begin with{" "}
        <Link href={refHref("artificial-intelligence")} className="text-foreground underline decoration-border hover:decoration-foreground/60">
          Artificial Intelligence
        </Link>{" "}
        and just keep pressing Next. Every definition and link was reviewed in the July and
        August 2026 passes; videos and 3D builds attach to their concepts as they ship.
      </p>

      <EncyclopediaFilter />

      <p id="encyclopedia-empty" className="font-mono text-xs text-muted-foreground mb-8" style={{ display: "none" }}>
        Nothing matches that search. Try a shorter word, or clear the difficulty filter.
      </p>

      {ENCYCLOPEDIA_CATEGORIES.map((cat) => {
        const items = refConcepts.filter((c) => c.category === cat.label);
        return (
          <section key={cat.label} className="mb-10" data-category-section>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              <span aria-hidden="true" className="mr-2">{cat.emoji}</span>
              {cat.label}
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: refCategoryMeta(cat.label)?.color }}>
              {items.length} concepts
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={refHref(c.id)}
                  data-concept-card
                  data-difficulty={c.difficulty}
                  data-search={`${c.concept} ${c.keyTerms.join(" ")} ${c.category}`.toLowerCase()}
                  className="group border border-border px-3 py-2.5 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-foreground truncate">{c.concept}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {(INTERACTIVE_FOR[c.id] || DEEP_DIVES[c.id]) && (
                        <span className="font-mono text-[9px] uppercase tracking-wider px-1 py-0.5 border border-emerald-400/50 text-emerald-700 dark:text-emerald-300">
                          {INTERACTIVE_FOR[c.id] ? "3D" : "deep dive"}
                        </span>
                      )}
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        {c.difficulty.slice(0, 3)}
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="border border-border bg-card/30 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
          Keep going
        </p>
        <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
          <li>
            <Link href="/notebook/ai" className="hover:text-foreground transition-colors">
              The AI Learning Roadmap: an 18-week structured path with depth tracks →
            </Link>
          </li>
          <li>
            <Link href="/guides" className="hover:text-foreground transition-colors">
              All 3D explainers and teardowns →
            </Link>
          </li>
          <li>
            <Link href="/notebook/ai/shelf" className="hover:text-foreground transition-colors">
              The Complete Shelf: 19 free AI books →
            </Link>
          </li>
        </ul>
      </div>
    </LearnShell>
  );
}
