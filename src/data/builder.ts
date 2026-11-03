/**
 * builder.ts: the Persona Builder, as data and pure functions.
 *
 * The Global Persona Framework attaches a follow-up question to each of its
 * dimensions. The builder asks a curated set of them along a path for one
 * kind of situation, records how each answer is known, and composes a persona
 * from what was stated. Everything here follows the framework's own rules by
 * reference:
 *
 *   P444  the record type is stated, default "Fictional scenario"
 *   P445  every answer carries an evidence status, default "Hypothesis"
 *   P451  a large taxonomy is not a requirement to collect every field
 *   P453  an abstention is a recorded state, never silently a zero
 *   P454  the inference restrictions are printed on every brief
 *   P460  no invented name, motive or biography to fill gaps
 *   P463  validate the actual combination; marginals do not make a persona
 *
 * The hand-off to the Fanout Journey maps stated answers onto the journey's
 * six inputs. Where nothing was stated the journey shows its own honest
 * fallback ("a need I still need to state") rather than a value this file
 * made up.
 */
import { EXTRA_CONTEXT_IDS, type Scenario } from "./fanout";
import { FRAMEWORK_VERSION, frameworkById } from "./personaFramework";

export const BUILDER_TITLE = "Persona Builder";
export const HANDOFF_KEY = "fanout-journey-handoff-v1";

export type PathId = "consumer" | "b2b" | "audience";

export interface BuilderPath {
  id: PathId;
  label: string;
  blurb: string;
  productPlaceholder: string;
  /** Framework dimension ids, in the order they are asked. */
  dimensionIds: string[];
}

/**
 * Three starter paths. Each is a reading of the framework for one situation:
 * which of the 463 questions a team would actually ask first. Any dimension
 * can be added from the library; none has to be answered.
 */
export const BUILDER_PATHS: BuilderPath[] = [
  {
    id: "consumer",
    label: "Consumer purchase",
    blurb: "Someone choosing something to buy for themselves or their household: the journey, the money, the constraints, how they decide.",
    productPlaceholder: "car, phone, phone plan, mattress...",
    dimensionIds: [
      "P366", "P374", "P375", "P373", "P377", "P370", "P105", "P108", "P109", "P113",
      "P378", "P379", "P381", "P190", "P191", "P193", "P019", "P386",
    ],
  },
  {
    id: "b2b",
    label: "B2B buyer",
    blurb: "Someone buying on behalf of an organization: their role and authority, the procurement stage, the budget model, what would count as success and what could go wrong.",
    productPlaceholder: "analytics platform, payroll software, fleet vehicles...",
    dimensionIds: [
      "P366", "P422", "P416", "P420", "P417", "P419", "P421", "P108", "P105", "P373",
      "P424", "P423", "P425", "P370", "P379", "P371",
    ],
  },
  {
    id: "audience",
    label: "Audience",
    blurb: "People you want to reach rather than sell to right now: where they are, how they find things, what format they want, how they use AI, what they can access.",
    productPlaceholder: "a newsletter, a podcast, a product category, a cause...",
    dimensionIds: [
      "P308", "P311", "P317", "P319", "P322", "P323", "P324", "P326", "P334", "P340",
      "P345", "P292", "P290", "P300", "P304", "P239",
    ],
  },
];

const values = (id: string) => frameworkById(id)?.values ?? [];
export const EVIDENCE_STATUSES = values("P445");
export const RECORD_TYPES = values("P444");
export const NOT_INFERRED = values("P454");
export const VALIDATION_METHODS = values("P463");
export const ABSTAIN = ["Unknown", "Not applicable", "Prefer not to say"] as const;

export interface Answer {
  /** Chosen values, or the typed value for numeric/text, or lines for repeated. */
  value: string[];
  /** "Other / self-describe", in the person's words. */
  other?: string;
  /** One of ABSTAIN. An abstention is an answer (P453), not an empty field. */
  abstain?: string;
  /** One of EVIDENCE_STATUSES. */
  evidence: string;
}

export interface BuilderState {
  pathId: PathId;
  product: string;
  goal: string;
  recordType: string;
  answers: Record<string, Answer>;
  /** Dimensions added from the library beyond the path. */
  extraIds: string[];
}

export function emptyState(pathId: PathId): BuilderState {
  return { pathId, product: "", goal: "", recordType: RECORD_TYPES[0] ?? "Fictional scenario", answers: {}, extraIds: [] };
}

export const isAnswered = (a: Answer | undefined): boolean =>
  Boolean(a && (a.value.length > 0 || (a.other && a.other.trim()) || a.abstain));

/** Answers with content. Abstentions are recorded but do not count as stated. */
const stated = (s: BuilderState) =>
  Object.entries(s.answers).filter(([, a]) => !a.abstain && (a.value.length > 0 || (a.other && a.other.trim())));

export const answeredCount = (s: BuilderState): number => stated(s).length;

const HANDLING_ORDER = [
  "Sensitive / restricted",
  "Sensitive / age safeguards",
  "Sensitive / support only",
  "Sensitive / contextual",
  "Personal / explicit permission",
  "Personal / minimize",
];

/** Distinct handling requirements of everything stated, most demanding first. */
export function handlingRollup(s: BuilderState): string[] {
  const set = new Set(stated(s).map(([id]) => frameworkById(id)?.handling).filter((h): h is string => Boolean(h)));
  return [...set].sort((a, b) => HANDLING_ORDER.indexOf(a) - HANDLING_ORDER.indexOf(b));
}

const path = (s: BuilderState) => BUILDER_PATHS.find((p) => p.id === s.pathId) ?? BUILDER_PATHS[0];
const askedIds = (s: BuilderState) => [...path(s).dimensionIds, ...s.extraIds.filter((id) => !path(s).dimensionIds.includes(id))];

function valueText(a: Answer): string {
  const parts = [...a.value];
  if (a.other && a.other.trim()) parts.push(`${a.other.trim()} (self-described)`);
  return parts.join("; ");
}

/**
 * The composite persona, in the framework's P460 format: relevant
 * dimensions plus explicit goal, category, constraints, role and date. What
 * was not stated is listed as not stated. Nothing is filled in.
 */
export function buildBrief(s: BuilderState, date?: string): string {
  const p = path(s);
  const L: string[] = [];
  L.push("# Composite persona brief");
  L.push("");
  L.push(`Record type: ${s.recordType} (P444)`);
  L.push(`Framework: Global Persona Framework, ${FRAMEWORK_VERSION}`);
  L.push(`Path: ${p.label}`);
  L.push(`Product or category: ${s.product.trim() || "not stated"}`);
  L.push(`Stated goal: ${s.goal.trim() || "not stated"}`);
  if (date) L.push(`Date: ${date}`);
  L.push("");
  L.push("## Stated");
  const st = stated(s);
  if (st.length === 0) L.push("Nothing stated yet.");
  for (const [id, a] of st) {
    const d = frameworkById(id);
    L.push(`- ${d?.name ?? id} (${id}): ${valueText(a)} · ${a.evidence.toLowerCase()}`);
  }
  const abstained = Object.entries(s.answers).filter(([, a]) => a.abstain);
  if (abstained.length) {
    L.push("");
    L.push("## Declined or unknown (P453)");
    for (const [id, a] of abstained) L.push(`- ${frameworkById(id)?.name ?? id} (${id}): ${a.abstain}`);
  }
  const unanswered = askedIds(s).filter((id) => !isAnswered(s.answers[id]));
  L.push("");
  L.push(`## Not stated (${unanswered.length})`);
  L.push(unanswered.length ? unanswered.map((id) => `${frameworkById(id)?.name ?? id} (${id})`).join("; ") : "Every asked question has an answer or an abstention.");
  L.push("Gaps are gaps. Nothing here was filled in (P460).");
  const flags = handlingRollup(s);
  L.push("");
  L.push("## Handling");
  L.push(flags.length ? flags.join("; ") : "Nothing stated yet.");
  L.push("");
  L.push("## Must not be inferred (P454)");
  for (const n of NOT_INFERRED) L.push(`- ${n}`);
  return L.join("\n");
}

export function buildJson(s: BuilderState): string {
  return JSON.stringify(
    {
      schema: 1,
      tool: BUILDER_TITLE,
      framework: { name: "Global Persona Framework", version: FRAMEWORK_VERSION },
      recordType: s.recordType,
      path: path(s).label,
      product: s.product,
      goal: s.goal,
      date: new Date().toISOString().slice(0, 10),
      stated: stated(s).map(([id, a]) => {
        const d = frameworkById(id);
        return { id, dimension: d?.name, family: d?.family, values: a.value, other: a.other ?? null, evidence: a.evidence, handling: d?.handling };
      }),
      declined: Object.entries(s.answers)
        .filter(([, a]) => a.abstain)
        .map(([id, a]) => ({ id, dimension: frameworkById(id)?.name, state: a.abstain })),
      notStated: askedIds(s).filter((id) => !isAnswered(s.answers[id])),
      handling: handlingRollup(s),
      mustNotInfer: NOT_INFERRED,
    },
    null,
    2,
  );
}

/** The questions not yet answered, with what evidence each would need. */
export function interviewGuide(s: BuilderState): string {
  const p = path(s);
  const open = askedIds(s).filter((id) => !isAnswered(s.answers[id]));
  const L = [
    `# Interview guide: ${s.product.trim() || p.label}`,
    "",
    `Questions from the Global Persona Framework (${FRAMEWORK_VERSION}) not yet answered for this persona.`,
    "Ask in the person's own words; record abstentions as abstentions.",
    "A large taxonomy is not a requirement to collect every field (P451).",
    "",
  ];
  if (!open.length) L.push("Every question on this path has an answer or an abstention.");
  for (const id of open) {
    const d = frameworkById(id);
    if (!d) continue;
    L.push(`## ${d.id} ${d.name}`);
    L.push(`**Ask:** ${d.ask}`);
    L.push(`Options to offer: ${d.values.join("; ")}; Other / self-describe; Unknown; Not applicable; Prefer not to say`);
    if (d.evidence) L.push(`Evidence to collect: ${d.evidence}`);
    if (d.scope) L.push(`Scope: ${d.scope}`);
    L.push(`Handling: ${d.handling}`);
    L.push(`Rule: ${d.rule}`);
    L.push("");
  }
  return L.join("\n");
}

/** The framework's P463 checklist, pointed at this persona's weakest answers. */
export function validationPlan(s: BuilderState): string {
  const weak = stated(s).filter(([, a]) => ["Hypothesis", "Estimated", "Unknown", "Derived"].includes(a.evidence));
  const L = [
    `# Validation plan: ${s.product.trim() || path(s).label}`,
    "",
    "Validate the actual combination. Independent marginal statistics do not establish a joint persona (P463).",
    "",
    "## Methods",
    ...VALIDATION_METHODS.map((m) => `- [ ] ${m}`),
    "",
    `## Validate first (${weak.length} answers not yet self-reported or observed)`,
  ];
  if (!weak.length) L.push("Every stated answer is self-reported, observed or measured.");
  for (const [id, a] of weak) L.push(`- ${frameworkById(id)?.name ?? id} (${id}): ${valueText(a)} · currently ${a.evidence.toLowerCase()}`);
  L.push("");
  L.push("## Record type");
  L.push(`${s.recordType} (P444). ${s.recordType === "Fictional scenario" ? "Not a person. Do not present as measured." : ""}`.trim());
  return L.join("\n");
}

// ------------------------------------------------------------ the hand-off

export interface Handoff {
  schema: 1;
  from: "builder";
  product: string;
  seed: string;
  budgetPeriod: "one-time" | "monthly";
  scenario: Scenario;
}

const first = (s: BuilderState, id: string): string | undefined => {
  const a = s.answers[id];
  if (!a || a.abstain) return undefined;
  return a.value[0] ?? (a.other?.trim() || undefined);
};
const all = (s: BuilderState, id: string): string[] => {
  const a = s.answers[id];
  if (!a || a.abstain) return [];
  return [...a.value, ...(a.other?.trim() ? [a.other.trim()] : [])];
};
const list = (xs: string[]) => {
  const l = xs.map((x) => x.toLowerCase());
  return l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`;
};

const OCCASION: Record<string, string> = {
  "First purchase": "first-time buyer",
  Replacement: "replacing one I already own",
  Upgrade: "upgrading one I already own",
  Gift: "buying for someone else",
  "Life event": "buying after a life event",
  Replenishment: "buying again",
  Emergency: "buying in an emergency",
  "Work need": "buying for work",
};

/**
 * Stated answers onto the journey's six inputs. Each mapping names the
 * framework dimension it reads, and reads nothing else; where the answer is
 * missing the journey's own fallback text takes over.
 */
export function toHandoff(s: BuilderState): Handoff {
  const p = path(s);
  const product = s.product.trim() || "product";
  const budgetRaw = first(s, "P108") ?? "";
  const budget = Number(budgetRaw.replace(/[^\d.]/g, "")) || 0;
  const period = first(s, "P105");
  const budgetPeriod: Handoff["budgetPeriod"] = period && /month/i.test(period) ? "monthly" : "one-time";

  const criteria = all(s, "P373");
  const success = first(s, "P377");
  const answerFormat = all(s, "P345");
  const need = criteria.length ? list(criteria) : success ? success.toLowerCase() : answerFormat.length ? `answers as ${list(answerFormat)}` : "";

  const priority = first(s, "P381");
  const barriers = all(s, "P379");
  const implementation = all(s, "P423");
  const constraint = priority
    ? priority
    : implementation.length
      ? `${list(implementation)} on the implementation side`
      : barriers.length
        ? `${list(barriers)} as the main barrier${barriers.length > 1 ? "s" : ""}`
        : "";

  const timingRaw = first(s, "P370");
  const timing = timingRaw
    ? timingRaw === "No planned purchase"
      ? "with no planned purchase date"
      : timingRaw.toLowerCase()
    : "";

  const location = first(s, "P019") ?? first(s, "P017") ?? "";
  const occasion = first(s, "P374");
  const experience = occasion ? (OCCASION[occasion] ?? occasion.toLowerCase()) : "";

  const extras: Record<string, string> = {};
  for (const id of EXTRA_CONTEXT_IDS) {
    const v = all(s, id);
    if (v.length) extras[id] = v.join("; ");
  }

  return {
    schema: 1,
    from: "builder",
    product,
    seed: s.goal.trim() || `I need a ${product}`,
    budgetPeriod,
    scenario: {
      id: "built",
      name: `${p.label}: ${product}`,
      budget,
      need,
      constraint,
      timing,
      location,
      experience,
      ...(Object.keys(extras).length ? { extras } : {}),
    },
  };
}

export function writeHandoff(h: Handoff): void {
  localStorage.setItem(HANDOFF_KEY, JSON.stringify(h));
}

export function readHandoff(): Handoff | null {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as Partial<Handoff>;
    const sc = h.scenario as Partial<Scenario> | undefined;
    if (
      h.schema === 1 &&
      h.from === "builder" &&
      typeof h.product === "string" &&
      typeof h.seed === "string" &&
      (h.budgetPeriod === "monthly" || h.budgetPeriod === "one-time") &&
      sc &&
      typeof sc.id === "string" &&
      typeof sc.name === "string" &&
      typeof sc.need === "string" &&
      Number.isFinite(Number(sc.budget))
    ) {
      return h as Handoff;
    }
    return null;
  } catch {
    return null;
  }
}
