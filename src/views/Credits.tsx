"use client";
import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";
import { ExternalLink } from "lucide-react";
import { Link } from "@/lib/router-shim";
import { inspirations } from "@/data/inspirations";

/**
 * Credits and inspiration, as a first-class page.
 *
 * Everything interactive on this site is built from scratch, and some of it
 * exists because someone else showed what good looks like. This page names
 * them. It reads from src/data/inspirations.ts, so crediting a new source is
 * one data entry, not a page edit.
 */
const Credits = () => {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <SEO
        title="Credits & Inspiration · Venkata Pagadala"
        description="The designs, explainers, and makers this site learned from, credited openly, with what each one taught us and where it shows up."
        canonical="https://venkatapagadala.com/credits"
      />
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            We learn openly, we credit openly
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-6">
            Credits & Inspiration
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12 max-w-2xl">
            Everything interactive on this site is written from scratch: the geometry is
            generated in code and the words are ours. But nothing is built in a vacuum.
            When someone else's work taught us how to make ours better, they are named
            here, with exactly what they taught us and where the lesson shows up.
          </p>
        </ScrollReveal>

        <div className="space-y-6">
          {inspirations.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 70}>
              <article className="border border-border p-7 border-glow-hover">
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug">
                    {item.title}
                  </h2>
                  <span className="font-mono text-[10px] text-muted-foreground/40 shrink-0">
                    {item.when}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground/70 mb-4">{item.creator}</p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">
                  {item.whatWeLearned}
                </p>
                <div className="flex items-center gap-x-5 gap-y-2 flex-wrap border-t border-border pt-4">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-glow transition-all"
                  >
                    Visit the source <ExternalLink size={11} />
                  </a>
                  <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                    Used in
                  </span>
                  {item.usedIn.map((u) => (
                    <Link
                      key={u.to}
                      to={u.to}
                      className="font-mono text-xs text-muted-foreground/70 underline decoration-dotted hover:text-foreground transition-colors"
                    >
                      {u.label}
                    </Link>
                  ))}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed mt-10">
            Missing from this list? If this site learned something from your work and it
            is not credited here, that is an oversight, not a policy.{" "}
            <Link to="/contact" className="underline decoration-dotted hover:text-foreground transition-colors">
              Tell us
            </Link>{" "}
            and we will fix it.
          </p>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Credits;
