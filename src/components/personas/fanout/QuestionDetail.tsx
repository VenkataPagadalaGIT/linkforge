"use client";

import Link from "next/link";
import { DIMENSIONS, FRAMEWORK_STAGE_DIMENSION, STAGES, type FanoutQuestion } from "@/data/fanout";
import { frameworkById } from "@/data/personaFramework";

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
  extras,
  onClose,
}: {
  question: FanoutQuestion;
  /** The seed plus every explicit input, for pasting into an assistant. */
  expanded: string;
  /** Extra stated context on the scenario, keyed by framework id. */
  extras?: Record<string, string>;
  onClose: () => void;
}) {
  const inputs = Object.entries(question.inputsUsed);
  const stage = STAGES.find((s) => s.id === question.stageId);
  const stageDim = frameworkById(FRAMEWORK_STAGE_DIMENSION);
  const extraRows = Object.entries(extras ?? {}).filter(([, v]) => v && v !== "Not stated");

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

        <section className="sm:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            In the framework
          </h4>
          <ul className="font-mono text-[11px] text-muted-foreground leading-relaxed space-y-1">
            {stage && stageDim && (
              <li>
                <Link href={`/personas/framework#${stageDim.id}`} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
                  {stageDim.id} {stageDim.name}
                </Link>
                : this stage stands for {stage.frameworkStages.join(", ")}.
              </li>
            )}
            {inputs.map(([label]) => {
              const dim = DIMENSIONS.find((d) => d.label === label);
              const f = dim && frameworkById(dim.frameworkIds[0]);
              if (!f) return null;
              return (
                <li key={label}>
                  <span className="text-foreground/85">{label}</span> is{" "}
                  <Link href={`/personas/framework#${f.id}`} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
                    {f.id} {f.name}
                  </Link>
                  . {f.rule}
                </li>
              );
            })}
          </ul>
        </section>

        {extraRows.length > 0 && (
          <section className="sm:col-span-2">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Additional stated context
            </h4>
            <dl className="font-mono text-xs">
              {extraRows.map(([id, v]) => (
                <div key={id} className="flex gap-3 py-0.5 border-t border-border/30 first:border-t-0">
                  <dt className="text-muted-foreground w-48 shrink-0">
                    <Link href={`/personas/framework#${id}`} className="underline decoration-border hover:text-foreground transition-colors">
                      {frameworkById(id)?.name ?? id}
                    </Link>
                  </dt>
                  <dd className="text-foreground/85">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="font-mono text-[10px] text-muted-foreground mt-1.5">
              Carried in the expanded brief. Never used to generate a question.
            </p>
          </section>
        )}

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
