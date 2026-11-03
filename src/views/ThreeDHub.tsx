"use client";
import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-shim";
import { threeDExperiences } from "@/data/threeD";

/**
 * The 3D hub: every three-dimensional experience on the site, one page.
 *
 * The nav's 3D menu points here as its "see all", so the collection has a
 * crawlable home instead of living only inside a hover menu. Cards read from
 * src/data/threeD.ts; the next 3D build is one data entry.
 */
const ThreeDHub = () => {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <SEO
        title="Everything in 3D · Venkata Pagadala"
        description="Eight interactive 3D experiences built as code: a playable 2040 city, an explorable LLM, a browsable library of free AI books, a glass album of 100 AI contributors, and more. No downloads, no model files."
        canonical="https://venkatapagadala.com/3d"
      />
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            Generated geometry · runs in your browser
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            Everything in 3D
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12 max-w-2xl">
            Eight interactive experiences, every one generated in code: no model files,
            no downloads, nothing to install. The whole third dimension of this site
            ships as JavaScript you can view-source.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-4">
          {threeDExperiences.map((x, i) => (
            <ScrollReveal key={x.to} delay={i * 60}>
              <Link
                to={x.to}
                className="group block border border-border p-6 h-full border-glow-hover transition-all hover:bg-secondary/20"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground group-hover:text-glow transition-all leading-snug">
                    {x.title}
                  </h2>
                  {x.badge && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-green-500 shrink-0">
                      {x.badge}
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  {x.blurb}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {x.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 border border-border/60 px-1.5 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground/70 group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0"
                  />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed mt-10 max-w-2xl">
            How they are built: parameterized geometry, canvas-typeset textures, and
            custom shaders on three.js. The sources this work learned from are named on
            the{" "}
            <Link to="/credits" className="underline decoration-dotted hover:text-foreground transition-colors">
              credits and inspiration page
            </Link>
            .
          </p>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default ThreeDHub;
