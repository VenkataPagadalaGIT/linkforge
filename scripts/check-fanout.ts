/**
 * check-fanout.ts: the property the Persona Fanout Journey exists for.
 *
 * Choosing a different scenario must change every question, for every
 * preset and every stage. The first release shipped with 20 of 60 slots
 * persona-invariant, and on the blank preset 14 of 15 questions were the
 * same whichever persona was selected. Nothing looked broken: the card lit
 * up, the wires redrew, and the text stayed put. The owner found it by
 * clicking. This makes it a build failure instead.
 *
 * Also refuses templates that leave a placeholder unfilled, run words
 * together, or leak the experience input, which the page promises never
 * changes a question.
 *
 *   npx tsx scripts/check-fanout.ts
 */
import { PRESETS, STAGES, TEMPLATES, fanout, fanoutInvariantSlots } from "../src/data/fanout";

const invariant = fanoutInvariantSlots();

const malformed: string[] = [];
for (const p of PRESETS) {
  for (const st of STAGES) {
    for (const s of p.scenarios) {
      for (const q of fanout(s, st, p)) {
        const leaksExperience = p.scenarios.some((x) => x.experience.trim() && q.question.includes(x.experience.trim()));
        if (/\{\w+\}|  |As a |given must/.test(q.question) || leaksExperience) {
          malformed.push(`${p.id}/${st.id}/${s.id}: ${q.question}`);
        }
      }
    }
  }
}

const total = PRESETS.length * STAGES.reduce((n, st) => n + TEMPLATES[st.id].length, 0);

// Scenario data lints, from reading the questions as a person would:
//   - a need is an outcome, so it must not restate the product noun ("a phone
//     that lasts", inside "what does a phone have to do to deliver a phone")
//   - a constraint is a noun phrase, so it must not open with a gerund
//     ("keeping my number" reads as nonsense after "options that fit")
const data: string[] = [];
for (const p of PRESETS) {
  const noun = p.product.trim().toLowerCase();
  for (const s of p.scenarios) {
    if (noun && new RegExp(`\\b${noun.split(/\\s+/).pop()}\\b`, "i").test(s.need)) data.push(`${p.id}/${s.id}: need restates the product: "${s.need}"`);
    if (/^\\w+ing\\b/.test(s.constraint.trim())) data.push(`${p.id}/${s.id}: constraint opens with a gerund: "${s.constraint}"`);
  }
}
if (data.length) {
  console.error(`FAIL: ${data.length} scenario data lint(s):`);
  for (const x of data) console.error(`  ${x}`);
}

// Each template reads exactly one of need/constraint as its primary input.
// Both is how a question turns into a mouthful; neither is how it stops
// varying by persona.
const shape: string[] = [];
for (const st of STAGES) {
  for (const slot of TEMPLATES[st.id]) {
    const n = /\{need\}/.test(slot.template) ? 1 : 0;
    const c = /\{constraint\}/.test(slot.template) ? 1 : 0;
    if (n + c !== 1) shape.push(`${st.id}/${slot.qtype}: reads need=${n} constraint=${c}`);
  }
}
if (shape.length) {
  console.error(`FAIL: ${shape.length} template(s) do not read exactly one of need/constraint:`);
  for (const x of shape) console.error(`  ${x}`);
}
if (invariant.length || malformed.length || shape.length || data.length) {
  if (invariant.length) {
    console.error(`FAIL: ${invariant.length} of ${total} (preset/stage/slot) questions do not change with the persona:`);
    for (const b of invariant) console.error(`  ${b}`);
  }
  if (malformed.length) {
    console.error(`FAIL: ${malformed.length} malformed or experience-leaking question(s):`);
    for (const m of malformed.slice(0, 10)) console.error(`  ${m}`);
  }
  process.exit(1);
}
console.log(`FANOUT GATE: PASS (${total}/${total} questions vary by persona; each template reads one primary input; needs are outcomes; constraints are noun phrases; none malformed; experience never leaks)`);
