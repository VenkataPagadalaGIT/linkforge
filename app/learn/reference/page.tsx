import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { ENCYCLOPEDIA_CATEGORIES } from "@/data/aiEncyclopedia";
import { refConcepts, refCategoryMeta, REF_COUNTS, INTERACTIVE_FOR } from "@/data/learnReference";
import LearnShell, { type ShellGroup } from "@/components/learn/LearnShell";

export const metadata: Metadata = {
  title: "AI Reference: 175 Concepts, One Page Each",
  description:
    "The AI encyclopedia as a browsable reference: 175 concepts across 10 categories, each with prerequisites, key terms, curated free resources, and interactive 3D where it exists.",
  alternates: { canonical: "/learn/reference" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/learn/reference",
    title: "AI Reference: 175 Concepts, One Page Each",
  },
};

const groups = (): ShellGroup[] =>
  ENCYCLOPEDIA_CATEGORIES.map((cat) => ({
    title: cat.label,
    color: cat.color,
    items: refConcepts
      .filter((c) => c.category === cat.label)
      .map((c) => ({ href: `/learn/reference/${c.id}`, label: c.concept })),
  }));

export default function Page() {
  return (
    <LearnShell
      activeHref={null}
      groups={groups()}
      treeLabel={`Reference · ${REF_COUNTS.concepts} concepts`}
      homeHref="/learn/reference"
      homeLabel="Reference home"
      crossLink={{ href: "/learn", label: "← The AI Tutorial" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
        {REF_COUNTS.concepts} concepts · {REF_COUNTS.categories} categories · free
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-4">
        The AI Reference
      </h1>
      <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
        Every concept from the AI Encyclopedia as its own page: definition, prerequisites you can
        follow backward, key terms, curated free resources, and, where one exists, an interactive
        3D machine. Read a category in order with the Next buttons, or jump from the tree.
      </p>
      <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-10 max-w-2xl">
        New videos and 3D builds attach to their concepts as they ship. Prefer a narrative
        on-ramp? Start with <Link href="/learn" className="text-foreground underline decoration-border hover:decoration-foreground/60">the AI Tutorial</Link> and
        return here for depth.
      </p>

      {ENCYCLOPEDIA_CATEGORIES.map((cat) => {
        const items = refConcepts.filter((c) => c.category === cat.label);
        return (
          <section key={cat.label} className="mb-10">
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
                  href={`/learn/reference/${c.id}`}
                  className="group border border-border px-3 py-2.5 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-foreground truncate">{c.concept}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {INTERACTIVE_FOR[c.id] && (
                        <span className="font-mono text-[9px] uppercase tracking-wider px-1 py-0.5 border border-emerald-400/50 text-emerald-700 dark:text-emerald-300">
                          3D
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
    </LearnShell>
  );
}
