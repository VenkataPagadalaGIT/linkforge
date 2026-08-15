import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { LEARN_CHAPTERS, LEARN_COUNTS } from "@/data/learn";
import LearnShell from "@/components/learn/LearnShell";

export const metadata: Metadata = {
  title: "The AI Tutorial: Basics to Frontier",
  description:
    "A free, structured AI tutorial: what AI is, how machines learn, and how neural networks power LLMs. Step-by-step lessons with 3D interactives and primary sources.",
  alternates: { canonical: "/learn" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/learn",
    title: "The AI Tutorial: Basics to Frontier",
  },
};

export default function Page() {
  return (
    <LearnShell activeSlug={null}>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
        Free · {LEARN_COUNTS.topics} lessons · about {LEARN_COUNTS.minutes} minutes
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-4">
        The AI Tutorial
      </h1>
      <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
        Start from &quot;what is AI?&quot; and finish able to explain how a neural network learns
        and how that same ingredient becomes an LLM. Every lesson is complete, sourced, and
        cross-linked; the deep mechanisms come with 3D machines you can orbit, click, and
        genuinely train in your browser.
      </p>
      <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mb-10 max-w-2xl">
        The tree grows: new lessons and video walkthroughs join as they are finished, never as
        stubs. Read in order with the Next buttons, or jump anywhere from the chapter tree.
      </p>

      {LEARN_CHAPTERS.map((ch, ci) => (
        <section key={ch.id} className="mb-10">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            {ci + 1}. {ch.title}
          </h2>
          <p className="font-mono text-xs text-muted-foreground mb-4">{ch.blurb}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ch.topics.map((t) => (
              <Link
                key={t.slug}
                href={`/learn/${t.slug}`}
                className="group border border-border p-4 hover:bg-secondary/20 border-glow-hover transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                    {t.minutes} min
                  </span>
                  {t.interactive && (
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-emerald-400/50 text-emerald-700 dark:text-emerald-300">
                      3D
                    </span>
                  )}
                </div>
                <p className="font-display text-base font-bold text-foreground mb-1 group-hover:text-glow">
                  {t.title}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                  {t.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="border border-border bg-card/30 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
          After the tutorial
        </p>
        <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
          <li>
            <Link href="/notebook/ai" className="hover:text-foreground transition-colors">
              The AI Learning Roadmap: an 18-week structured path with depth tracks →
            </Link>
          </li>
          <li>
            <Link href="/notebook/ai/encyclopedia" className="hover:text-foreground transition-colors">
              The AI Concepts Encyclopedia: 175 terms in plain words →
            </Link>
          </li>
          <li>
            <Link href="/guides" className="hover:text-foreground transition-colors">
              All 3D explainers and teardowns →
            </Link>
          </li>
        </ul>
      </div>
    </LearnShell>
  );
}
