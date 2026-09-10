import Link from "next/link";

/**
 * What this is, and what it is not.
 *
 * Written plainly rather than in legal boilerplate, because boilerplate is
 * skipped and the point here is to actually be understood. It is not legal
 * advice and has not been reviewed by a lawyer; if this ever underwrites a
 * commercial commitment, it should be.
 */

export default function Disclaimer({
  className = "",
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "short";
}) {
  if (variant === "short") {
    return (
      <p className={`font-mono text-[10px] text-muted-foreground/90 leading-relaxed ${className}`}>
        Measured figures are published survey results, cited. Anything labelled estimated is this
        site&apos;s own combination of them and carries no guarantee. Provided as is, for research
        and planning, with no warranty and no liability for decisions taken on it.{" "}
        <Link href="/personas/data" className="underline decoration-border hover:text-foreground transition-colors">
          Method and sources
        </Link>
        .
      </p>
    );
  }

  return (
    <aside
      aria-labelledby="disclaimer-h"
      className={`border border-border/60 p-5 ${className}`}
    >
      <h2
        id="disclaimer-h"
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3"
      >
        What this is, and what it is not
      </h2>
      <div className="space-y-2.5 max-w-3xl">
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-foreground">Measured</span> means a named study published that
          figure for that population, and the study is cited with its sample size, field dates and
          margin of error. Those numbers are theirs, not this site&apos;s, and are reproduced under
          the terms each publisher sets.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-foreground">Estimated</span> means this site combined published
          figures to answer a question nobody measured directly. The arithmetic is printed on every
          such row so it can be checked or rejected. It assumes traits shift the odds independently
          of one another, which is rarely exactly true, so an estimate is a direction rather than a
          measurement and its error is wider than the sampling error shown.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-foreground">Gaps are real.</span> Where no source measures
          something, this says so instead of filling it in. A trait marked inferred has no evidence
          behind it at all and exists to be tested, not believed.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          Everything here describes US adults in aggregate at the time of the fieldwork shown. It
          says nothing about any individual, it is not a basis for decisions about any individual,
          and it must not be used for eligibility, credit, employment, housing, insurance or any
          other decision about a person. Surveys age; the date on each figure is the date it was
          collected, not the date you are reading it.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          Provided as is, for research and planning, with no warranty of accuracy, completeness or
          fitness for any purpose, and no liability accepted for any decision, spend or outcome
          based on it. Verify anything load-bearing against the primary source, which is linked
          from every figure. Naming a source is not a claim that they endorse this analysis; they
          do not.
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed pt-1">
          Independent research, not affiliated with or endorsed by any platform or publisher named.
          Trademarks belong to their owners. This is a plain-language statement, not legal advice.{" "}
          <Link
            href="/personas/data"
            className="underline decoration-border hover:text-foreground transition-colors"
          >
            Full method, sources and changelog
          </Link>
          .
        </p>
      </div>
    </aside>
  );
}
