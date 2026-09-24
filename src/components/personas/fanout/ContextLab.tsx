"use client";

import { scenarioValues, type Preset, type Scenario } from "@/data/fanout";

export type LensId = "none" | "budget" | "need" | "constraint" | "timing" | "experience" | "combined";

export const LENSES: { id: LensId; label: string }[] = [
  { id: "none", label: "No context" },
  { id: "budget", label: "Budget" },
  { id: "need", label: "Need" },
  { id: "constraint", label: "Constraint" },
  { id: "timing", label: "Timing" },
  { id: "experience", label: "Experience" },
  { id: "combined", label: "All inputs" },
];

/**
 * The same question, before and after one piece of context.
 *
 * This is the argument of the whole tool in one screen: a broad query does
 * not get better by guessing who asked it, it gets better by adding what they
 * actually said. Each lens adds exactly one explicit input and shows what it
 * changed. The "experience" lens is the deliberate counter-example: it is kept
 * as context and it changes the question not at all, because knowing how
 * practised someone is tells you nothing about what they want.
 */
export default function ContextLab({
  scenario,
  preset,
  lens,
  onLens,
}: {
  scenario: Scenario;
  preset: Pick<Preset, "product" | "budgetPeriod">;
  lens: LensId;
  onLens: (l: LensId) => void;
}) {
  const v = scenarioValues(scenario, preset);
  const before = `Which ${v.product} should I consider?`;

  let after = before;
  let why = "";
  let chips: string[] = [];

  switch (lens) {
    case "budget":
      after = `Which ${v.product} options fit within ${v.budget}?`;
      why = "A stated budget adds a cost constraint. It does not establish income, or what someone can afford.";
      chips = [`Budget: ${v.budget}`];
      break;
    case "need":
      after = `Which ${v.product} should I consider for ${v.need}?`;
      why = "The stated need adds a concrete evaluation criterion. It is an input, not something guessed from who the buyer is.";
      chips = [`Need: ${v.need}`];
      break;
    case "constraint":
      after = `Which ${v.product} options are worth considering given ${v.constraint}?`;
      why = "A hard constraint removes options before comparison starts, which is usually where the most time is saved.";
      chips = [`Constraint: ${v.constraint}`];
      break;
    case "timing":
      after = `Which ${v.product} should I consider if I am buying ${v.timing}?`;
      why = "Timing changes which stage the buyer is really in. Someone researching only does not want a checkout page.";
      chips = [`Timing: ${v.timing}`];
      break;
    case "experience":
      why =
        "The question stays unchanged. Experience tells you what needs explaining, not what the buyer wants, so it is never allowed to establish a preference.";
      chips = [`Experience: ${v.experience}`, "No preference inferred"];
      break;
    case "combined":
      after = `Which ${v.product} should I consider for ${v.need}, within ${v.budget}, given ${v.constraint}, buying ${v.timing}?`;
      why = "Every explicit input, together. This is the query the fan-out starts from, and it is only ever built from what was actually said.";
      chips = [`Need: ${v.need}`, `Budget: ${v.budget}`, `Constraint: ${v.constraint}`, `Timing: ${v.timing}`];
      break;
    default:
      why = "No context yet. The query is broad, and any answer to it is guessing which buyer asked.";
  }

  return (
    <div className="p-4 lg:p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Add one explicit input · {scenario.name}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="Context lens">
        {LENSES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onLens(l.id)}
            aria-pressed={lens === l.id}
            className={`font-mono text-[10px] uppercase tracking-wider border px-2 py-1 transition-colors ${
              lens === l.id
                ? "border-foreground/40 bg-foreground/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Before</p>
          <p className="font-display text-base font-bold text-foreground leading-snug">{before}</p>
        </div>
        <div className={`border p-4 ${after === before ? "border-border/60 border-dashed" : "border-foreground/40"}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            After {after === before ? "· unchanged" : ""}
          </p>
          <p className="font-display text-base font-bold text-foreground leading-snug">{after}</p>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-4">
          {chips.map((c) => (
            <li key={c} className="font-mono text-[10px] text-foreground/85 border border-border px-2 py-0.5">
              {c}
            </li>
          ))}
        </ul>
      )}
      <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-4 max-w-2xl">{why}</p>
    </div>
  );
}
