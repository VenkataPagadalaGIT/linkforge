/**
 * fanout.ts: the Persona Fanout Journey, as data.
 *
 * One starting query, held to the question "what would we need to know before
 * we could answer this?", fans out into persona scenarios, then into the
 * stages of a buying journey, then into the specific questions each scenario
 * asks at each stage. The site's talk argues that demand should be classified
 * by persona rather than by keyword; this is that argument made operable.
 *
 * Everything here is illustrative and says so. A scenario is a set of
 * explicit, editable inputs (a budget cap, a stated need, a constraint), never
 * a trait inferred from who someone is. A question is a hypothesis about what
 * that scenario would ask, generated from a template, never a measured query.
 * The measured surface is /personas, which grades every trait against a named
 * study. The two are linked and kept apart on purpose: a planning model that
 * borrowed the measured surface's authority would spend it.
 *
 * The engine is domain-agnostic by construction. Templates are written
 * against the DIMENSIONS below, which apply to any considered purchase, and a
 * domain is only a preset: a product noun, a seed query and four scenarios.
 * Adding a domain is a data edit here, never a code path.
 */

export type StageId = "discover" | "explore" | "compare" | "decide" | "own";

export interface Stage {
  id: StageId;
  /** 1-based, so the map can print "03 Compare". */
  index: number;
  name: string;
  goal: string;
  /** The kind of answer the stage wants: definition, shortlist, comparison... */
  type: string;
  /** Content formats that tend to answer this stage; one per template slot. */
  formats: [string, string, string];
  /** How to check the generated questions against reality. */
  validation: string;
  /** Why questions at this stage look the way they do. */
  rationale: string;
}

/**
 * The full journey, including the stage most journey models stop before.
 * "Own" is where renewal, churn, support demand and the next purchase are
 * decided, and it is where the least content competes for the answer. The
 * journey loops: an Own question is often the next Discover.
 */
export const STAGES: Stage[] = [
  {
    id: "discover",
    index: 1,
    name: "Discover",
    goal: "Understand the need",
    type: "Definition",
    formats: ["Needs checklist", "Budget explainer", "Requirements guide"],
    validation: "Validate with customer interviews and first-party research questions.",
    rationale: "Clarify the requirements before making a shortlist.",
  },
  {
    id: "explore",
    index: 2,
    name: "Explore",
    goal: "Build a shortlist",
    type: "Shortlist",
    formats: ["Category guide", "Shortlist tool", "Where-to-try guide"],
    validation: "Validate against your own query logs, site search and customer interviews.",
    rationale: "Identify options to investigate, rather than recommend a winner.",
  },
  {
    id: "compare",
    index: 3,
    name: "Compare",
    goal: "Evaluate trade-offs",
    type: "Comparison",
    formats: ["Comparison page", "Total-cost worksheet", "Evidence checklist"],
    validation: "Validate with comparison questions from customer research and sales conversations.",
    rationale: "Compare specific criteria across shortlisted options.",
  },
  {
    id: "decide",
    index: 4,
    name: "Decide",
    goal: "Resolve buying friction",
    type: "Transaction",
    formats: ["Pre-purchase checklist", "Complete-cost breakdown", "Availability and terms page"],
    validation: "Validate with the questions sales and support hear in the final week before purchase.",
    rationale: "Surface what has to be verified before committing.",
  },
  {
    id: "own",
    index: 5,
    name: "Own",
    goal: "Use, maintain, renew or replace",
    type: "Ownership",
    formats: ["Setup guide", "Ownership tracker", "Renew-or-replace guide"],
    validation: "Validate with support tickets, onboarding drop-off and renewal conversations.",
    rationale: "Anticipate setup, use, support and replacement questions after purchase.",
  },
];

export type DimensionId = "budget" | "need" | "constraint" | "timing" | "location" | "experience";

export interface Dimension {
  id: DimensionId;
  label: string;
  /** The question the tool asks before it can fan out. */
  prompt: string;
  /** Shown in the editor when the field is empty. */
  placeholder: string;
  /** What this input is, and what it is not allowed to imply. */
  note: string;
}

/**
 * The inputs that apply to any considered purchase. These are explicit
 * answers a person gives, not traits read off a demographic. "Experience" is
 * kept as context in the same way the demo kept age: it changes what needs
 * explaining, and it is never allowed to establish a preference.
 */
export const DIMENSIONS: Dimension[] = [
  {
    id: "budget",
    label: "Budget cap",
    prompt: "Budget?",
    placeholder: "A number, or leave blank",
    note: "A cap the buyer states. It does not establish income or what they can afford.",
  },
  {
    id: "need",
    label: "Primary need",
    prompt: "Primary need?",
    placeholder: "What it has to do for them",
    note: "The one thing the purchase must do. The evaluation criterion everything else serves.",
  },
  {
    id: "constraint",
    label: "Hard constraint",
    prompt: "Any hard constraint?",
    placeholder: "A must-have, as a thing: a used vehicle, good coverage at home",
    note: "A must-have or a must-not, written as a thing rather than a sentence. Narrows the option set before comparison starts.",
  },
  {
    id: "timing",
    label: "Timing",
    prompt: "When?",
    placeholder: "Within a month, in about a year...",
    note: "How soon, as a time. Changes which stage the buyer is really in.",
  },
  {
    id: "location",
    label: "Location",
    prompt: "Where?",
    placeholder: "City or region, optional",
    note: "Only used where an answer is local: where to see, try or buy.",
  },
  {
    id: "experience",
    label: "Experience",
    prompt: "Experience with this? (context only)",
    placeholder: "First-time buyer, replacing one...",
    note: "Context, not a preference. It changes what needs explaining, never what they want.",
  },
];

export const DIMENSION_LABEL: Record<DimensionId, string> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d.label]),
) as Record<DimensionId, string>;

export interface Scenario {
  id: string;
  name: string;
  /** Numeric cap; 0 means not yet set. Formatted with the preset's period. */
  budget: number;
  need: string;
  constraint: string;
  timing: string;
  location: string;
  experience: string;
}

export interface Preset {
  id: string;
  label: string;
  /** The noun the templates fill in: car, phone, phone plan. */
  product: string;
  /** The starting query the fan-out begins from. */
  seed: string;
  /** Whether the budget is a one-time price or a recurring amount. */
  budgetPeriod: "one-time" | "monthly";
  scenarios: Scenario[];
}

/**
 * Ready-made domains. Each is a worked example, not a claim about a market:
 * the scenarios are plausible, editable starting points, and the tool exists
 * so a team can replace them with the people it actually serves.
 */
export const PRESETS: Preset[] = [
  {
    id: "automotive",
    label: "Buying a car",
    product: "car",
    seed: "I want to buy a car",
    budgetPeriod: "one-time",
    scenarios: [
      {
        id: "value",
        name: "Value-first buyer",
        budget: 25000,
        need: "low total ownership cost",
        constraint: "a used vehicle with a clean history",
        timing: "within 3 months",
        location: "",
        experience: "replacing one I already own",
      },
      {
        id: "family",
        name: "Family-fit buyer",
        budget: 55000,
        need: "rear-facing child-seat space and room for a stroller",
        constraint: "three rows or a very large second row",
        timing: "within 3 months",
        location: "",
        experience: "replacing one I already own",
      },
      {
        id: "commuter",
        name: "Daily commuter",
        budget: 40000,
        need: "a comfortable, efficient 60-mile workday commute",
        constraint: "reliability at high annual mileage",
        timing: "within 6 months",
        location: "",
        experience: "experienced with this category",
      },
      {
        id: "electric",
        name: "Electric-curious buyer",
        budget: 50000,
        need: "an electric vehicle with charging that fits my routine",
        constraint: "charging without a home charger",
        timing: "in about a year",
        location: "",
        experience: "first-time buyer of this type",
      },
    ],
  },
  {
    id: "smartphone",
    label: "Buying a phone",
    product: "phone",
    seed: "I need a new phone",
    budgetPeriod: "one-time",
    scenarios: [
      {
        id: "budget",
        name: "Budget-first buyer",
        budget: 400,
        need: "a reliable phone that lasts three years",
        constraint: "keeping my number and my current carrier",
        timing: "within a month",
        location: "",
        experience: "replacing one I already own",
      },
      {
        id: "camera",
        name: "Camera-first buyer",
        budget: 1200,
        need: "the best photos and video I can get from a phone",
        constraint: "enough storage for a large photo library",
        timing: "within 3 months",
        location: "",
        experience: "experienced with this category",
      },
      {
        id: "parent",
        name: "Parent buying for a child",
        budget: 300,
        need: "a phone with strong parental controls",
        constraint: "joining our existing family plan",
        timing: "within a month",
        location: "",
        experience: "buying for someone else",
      },
      {
        id: "worklife",
        name: "Work-and-personal buyer",
        budget: 900,
        need: "one phone for work email and personal use",
        constraint: "support for two lines or an eSIM",
        timing: "within 3 months",
        location: "",
        experience: "replacing one I already own",
      },
    ],
  },
  {
    id: "phone-plan",
    label: "Choosing a phone plan",
    product: "phone plan",
    seed: "I want a cheaper phone plan",
    budgetPeriod: "monthly",
    scenarios: [
      {
        id: "cost",
        name: "Cost-cutter",
        budget: 40,
        need: "the lowest monthly cost for one line",
        constraint: "good coverage at home",
        timing: "this billing cycle",
        location: "",
        experience: "switching from another carrier",
      },
      {
        id: "family",
        name: "Family of four",
        budget: 160,
        need: "four lines with shared data",
        constraint: "two teenage lines",
        timing: "within a month",
        location: "",
        experience: "switching from another carrier",
      },
      {
        id: "heavy",
        name: "Heavy data user",
        budget: 90,
        need: "unlimited data that stays fast",
        constraint: "daily laptop tethering",
        timing: "within a month",
        location: "",
        experience: "experienced with this category",
      },
      {
        id: "traveller",
        name: "Frequent traveller",
        budget: 80,
        need: "a plan that works abroad without surprise charges",
        constraint: "monthly international travel",
        timing: "before my next trip",
        location: "",
        experience: "switching from another carrier",
      },
    ],
  },
  {
    id: "custom",
    label: "Anything else",
    product: "",
    seed: "",
    budgetPeriod: "one-time",
    // Generic because the product is unknown, distinct so that choosing a
    // scenario changes every question before a single field is edited.
    scenarios: [
      {
        id: "a",
        name: "Budget-led buyer",
        budget: 0,
        need: "the lowest total cost over time",
        constraint: "no long contract or lock-in",
        timing: "within 3 months",
        location: "",
        experience: "first-time buyer",
      },
      {
        id: "b",
        name: "Need-led buyer",
        budget: 0,
        need: "one job done exceptionally well",
        constraint: "proven reliability in real reviews",
        timing: "within a month",
        location: "",
        experience: "replacing one I already own",
      },
      {
        id: "c",
        name: "Constraint-led buyer",
        budget: 0,
        need: "a straightforward fit with what I already use",
        constraint: "compatibility with what I already own",
        timing: "in about a year",
        location: "",
        experience: "experienced with this category",
      },
      {
        id: "d",
        name: "Buying for someone else",
        budget: 0,
        need: "something another person can use without help",
        constraint: "simple setup and support I can hand over",
        timing: "within a month",
        location: "",
        experience: "buying for someone else",
      },
    ],
  },
];

export const presetById = (id: string): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0];

/**
 * Question templates, keyed by stage only. They are written against the
 * dimensions, never against a domain, which is what makes a phone plan and a
 * car the same engine. Each stage has three, one per content format above.
 *
 * Every template carries the need or the constraint. Those two inputs are
 * what a scenario IS, so with them in every question, choosing a different
 * persona changes every question. The first version left a third of the
 * slots persona-invariant ("Where in my area can I see the car options?"),
 * and on the blank preset fourteen of fifteen questions were identical no
 * matter which persona was selected. A fan-out that does not fan out is the
 * one thing this tool must never do, so `assertFanoutVaries` below is run by
 * the QA script and fails the build of the page if any preset regresses.
 *
 * Placeholders: {product} {budget} {need} {constraint} {timing} {location}.
 * Never {experience}: it is context, the tool says it changes nothing, and a
 * template that used it would make that sentence false.
 */
export const TEMPLATES: Record<StageId, [string, string, string]> = {
  discover: [
    "What should I understand before choosing a {product} for {need}?",
    "What should a {budget} budget for a {product} cover, beyond the headline price, if it must deliver {need}?",
    "Which {product} requirements are essential for {need} given {constraint}, and which are only nice to have?",
  ],
  explore: [
    "Which {product} options should I research for {need}?",
    "Which {product} options fit within {budget} and still deliver {need}?",
    "Where in {location} can I see or try {product} options that meet {need}?",
  ],
  compare: [
    "How do my shortlisted {product} options compare on {need}?",
    "How do costs over time compare across the shortlist against {budget}, without giving up {need}?",
    "What evidence should I request to confirm {constraint} and {need} for each {product} option?",
  ],
  decide: [
    "What should I verify before committing to a {product}, given {constraint} and {need}?",
    "What is the complete cost of the {product} I have chosen, relative to {budget}, and does it still deliver {need}?",
    "What must I confirm to complete the purchase {timing}, starting with {constraint}?",
  ],
  own: [
    "How should I set up my {product} so it serves {need} from day one?",
    "What should I keep track of to know whether the {product} still meets {need}?",
    "What should trigger replacing this {product}: {need} no longer met, or costs beyond {budget}?",
  ],
};

/** "$25,000" or "$40 a month"; a plain phrase when nothing is set yet. */
export function formatBudget(n: number, period: Preset["budgetPeriod"]): string {
  if (!(Number(n) > 0)) return "a budget I still need to set";
  const amount = "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return period === "monthly" ? `${amount} a month` : amount;
}

/** Every placeholder value for one scenario, with honest fallbacks. */
export function scenarioValues(s: Scenario, preset: Pick<Preset, "product" | "budgetPeriod">) {
  const product = preset.product.trim() || "product";
  return {
    product,
    budget: formatBudget(s.budget, preset.budgetPeriod),
    need: s.need.trim() || "a need I still need to state",
    constraint: s.constraint.trim() || "no stated constraint",
    timing: s.timing.trim() || "on no fixed timeline",
    location: s.location.trim() || "my area",
    experience: s.experience.trim() || "not stated",
  };
}

export type PlaceholderKey = keyof ReturnType<typeof scenarioValues>;

export interface FanoutQuestion {
  id: string;
  seed: string;
  product: string;
  scenarioId: string;
  scenarioName: string;
  stageId: StageId;
  stageName: string;
  question: string;
  type: string;
  format: string;
  rationale: string;
  /** Label to value, for the inputs the template actually consumed. */
  inputsUsed: Record<string, string>;
  validation: string;
  /** Always this. It is a hypothesis about a scenario, not an observed query. */
  evidence: "Illustrative hypothesis";
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** The three questions one scenario asks at one stage. */
export function fanout(
  scenario: Scenario,
  stage: Stage,
  preset: Pick<Preset, "product" | "budgetPeriod" | "seed">,
  seed: string = preset.seed,
): FanoutQuestion[] {
  const v = scenarioValues(scenario, preset);
  return TEMPLATES[stage.id].map((tpl, i) => {
    const used = [...new Set([...tpl.matchAll(PLACEHOLDER)].map((m) => m[1] as PlaceholderKey))];
    const inputsUsed = Object.fromEntries(
      used
        .filter((k) => k !== "product")
        .map((k) => [DIMENSION_LABEL[k as DimensionId] ?? k, v[k]]),
    );
    return {
      id: `${scenario.id}-${stage.id}-${i}`,
      seed,
      product: v.product,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      stageId: stage.id,
      stageName: stage.name,
      question: tpl.replace(PLACEHOLDER, (_, k: PlaceholderKey) => v[k] ?? ""),
      type: stage.type,
      format: stage.formats[i],
      rationale:
        stage.rationale +
        " This example uses the selected scenario" +
        (Object.keys(inputsUsed).length
          ? " and these explicit inputs: " + Object.keys(inputsUsed).join(", ")
          : "") +
        ".",
      inputsUsed,
      validation: stage.validation,
      evidence: "Illustrative hypothesis",
    };
  });
}

/** Every question for a preset: scenarios × stages × 3. */
export function fanoutAll(
  scenarios: Scenario[],
  preset: Pick<Preset, "product" | "budgetPeriod" | "seed">,
  seed: string = preset.seed,
): FanoutQuestion[] {
  return scenarios.flatMap((s) => STAGES.flatMap((st) => fanout(s, st, preset, seed)));
}

/**
 * The expanded prompt: the seed plus every explicit input, laid out so it can
 * be pasted into any assistant. This is the "after context" the tool exists to
 * demonstrate, and it is deliberately just the inputs, restated.
 */
export function expandedPrompt(
  scenario: Scenario,
  preset: Pick<Preset, "product" | "budgetPeriod" | "seed">,
  seed: string = preset.seed,
): string {
  const v = scenarioValues(scenario, preset);
  return [
    `Starting query: ${seed || "(none)"}`,
    `Product: ${v.product}`,
    `Scenario: ${scenario.name}`,
    `Primary need: ${v.need}`,
    `Budget cap: ${v.budget}`,
    `Hard constraint: ${v.constraint}`,
    `Timing: ${v.timing}`,
    scenario.location.trim() ? `Location: ${v.location}` : null,
    `Experience (context only): ${v.experience}`,
    "",
    "These are explicit inputs. Do not infer preferences from anything not listed.",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

/**
 * The property the tool exists for: choosing a different scenario changes
 * every question. Returns the (preset, stage, slot) triples where two
 * scenarios produce the same text, so a regression names itself.
 */
export function fanoutInvariantSlots(): string[] {
  const bad: string[] = [];
  for (const p of PRESETS) {
    for (const st of STAGES) {
      const per = p.scenarios.map((s) => fanout(s, st, p).map((q) => q.question));
      for (let i = 0; i < 3; i++) {
        if (new Set(per.map((qs) => qs[i])).size < p.scenarios.length) bad.push(`${p.id}/${st.id}/${i + 1}`);
      }
    }
  }
  return bad;
}

export function assertFanoutVaries(): void {
  const bad = fanoutInvariantSlots();
  if (bad.length) throw new Error(`Persona selection does not change these questions: ${bad.join(", ")}`);
}

export const FANOUT_TITLE = "Persona Fanout Journey";
export const FANOUT_PATH = "/personas/fanout-journey";
export const FANOUT_LAST_UPDATED = "2026-09-23";
