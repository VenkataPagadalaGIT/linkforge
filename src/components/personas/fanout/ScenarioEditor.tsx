"use client";

import { DIMENSIONS, type Preset, type Scenario } from "@/data/fanout";

/**
 * The scenario's inputs, laid out as inputs.
 *
 * The editor is the honesty mechanism: everything the fan-out knows about a
 * buyer is on this form, and nothing it does not ask is allowed to influence a
 * question. The note under each field says what the input is and what it may
 * not imply, because that boundary is where personas usually turn into
 * fiction.
 */
export default function ScenarioEditor({
  scenario,
  preset,
  onChange,
  onProduct,
  onSeed,
  seed,
  onReset,
  onClose,
}: {
  scenario: Scenario;
  preset: Pick<Preset, "product" | "budgetPeriod">;
  onChange: (next: Scenario) => void;
  onProduct: (product: string) => void;
  onSeed: (seed: string) => void;
  seed: string;
  onReset: () => void;
  onClose: () => void;
}) {
  const set = (k: keyof Scenario, v: string) =>
    onChange({ ...scenario, [k]: k === "budget" ? Number(v.replace(/[^\d.]/g, "")) || 0 : v });

  const field =
    "w-full font-mono text-xs bg-transparent border border-border text-foreground px-2 py-1.5 placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/60";

  return (
    <section aria-labelledby="fanout-editor-h" className="border-t border-border p-4 lg:p-5 bg-card/20">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <h3 id="fanout-editor-h" className="font-display text-base font-bold text-foreground">
            Edit explicit scenario inputs
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Editing: {scenario.name}. Every question regenerates as you type.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-1 transition-colors"
          >
            Reset preset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-1 transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Starting query</span>
          <input className={`${field} mt-1`} value={seed} onChange={(e) => onSeed(e.target.value)} placeholder="I want to buy a..." />
          <span className="block font-mono text-[10px] text-muted-foreground/80 mt-1 leading-snug">
            The broad request everything fans out from.
          </span>
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Product label</span>
          <input
            className={`${field} mt-1`}
            value={preset.product}
            onChange={(e) => onProduct(e.target.value)}
            placeholder="car, phone, phone plan..."
          />
          <span className="block font-mono text-[10px] text-muted-foreground/80 mt-1 leading-snug">
            The noun every template fills in. Change it and the whole journey changes topic.
          </span>
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Scenario name</span>
          <input className={`${field} mt-1`} value={scenario.name} onChange={(e) => set("name", e.target.value)} />
          <span className="block font-mono text-[10px] text-muted-foreground/80 mt-1 leading-snug">
            A label for the situation, not a demographic.
          </span>
        </label>

        {DIMENSIONS.map((d) => (
          <label key={d.id} className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {d.label}
              {d.id === "budget" && preset.budgetPeriod === "monthly" ? " (per month)" : ""}
            </span>
            <input
              className={`${field} mt-1`}
              inputMode={d.id === "budget" ? "numeric" : undefined}
              value={d.id === "budget" ? (scenario.budget > 0 ? String(scenario.budget) : "") : scenario[d.id]}
              onChange={(e) => set(d.id, e.target.value)}
              placeholder={d.placeholder}
            />
            <span className="block font-mono text-[10px] text-muted-foreground/80 mt-1 leading-snug">{d.note}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
