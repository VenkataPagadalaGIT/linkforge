"use client";

import type { FanoutQuestion } from "@/data/fanout";

/**
 * Why this question exists.
 *
 * Every generated question can be interrogated: which stage produced it, which
 * explicit inputs it consumed, what content format tends to answer it, and how
 * to check it against reality before anyone writes to it. A question that
 * cannot explain itself is a guess dressed as research, so the panel is the
 * point of the tool rather than a nicety on top of it.
 */
export default function QuestionDetail({
  question,
  expanded,
  onClose,
}: {
  question: FanoutQuestion;
  /** The seed plus every explicit input, for pasting into an assistant. */
  expanded: string;
  onClose: () => void;
}) {
  const inputs = Object.entries(question.inputsUsed);

  return (
    <aside
      aria-labelledby="fanout-detail-h"
      className="border-t border-border bg-card/20 p-4 lg:p-5 scroll-mt-28"
      id="fanout-detail"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {question.scenarioName} · {question.stageName} · {question.type}
          </p>
          <h3 id="fanout-detail-h" className="font-display text-lg font-bold text-foreground leading-snug text-balance">
            {question.question}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-1 transition-colors shrink-0"
        >
          Close
        </button>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground mb-4 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2" style={{ background: "#f59e0b" }} aria-hidden="true" />
        {question.evidence}: generated from a template and the scenario&apos;s explicit inputs, not an observed query.
      </p>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Rationale</h4>
          <p className="font-mono text-xs text-foreground/85 leading-relaxed">{question.rationale}</p>
        </section>

        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            Inputs used by this question
          </h4>
          {inputs.length ? (
            <dl className="font-mono text-xs">
              {inputs.map(([k, v]) => (
                <div key={k} className="flex gap-3 py-0.5 border-t border-border/30 first:border-t-0">
                  <dt className="text-muted-foreground w-28 shrink-0">{k}</dt>
                  <dd className="text-foreground/85">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">Only the product label.</p>
          )}
        </section>

        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            Possible content format
          </h4>
          <p className="font-mono text-xs text-foreground/85">{question.format}</p>
        </section>

        <section>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">How to validate</h4>
          <p className="font-mono text-xs text-foreground/85 leading-relaxed">{question.validation}</p>
        </section>
      </div>

      <section className="mt-5">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
          Expanded brief, ready to paste
        </h4>
        <pre className="font-mono text-[11px] text-foreground/85 leading-relaxed whitespace-pre-wrap border border-border/60 bg-background p-3 overflow-x-auto">
          {expanded}
        </pre>
      </section>
    </aside>
  );
}
