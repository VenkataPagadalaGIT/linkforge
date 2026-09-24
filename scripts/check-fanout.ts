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
import { PRESETS, STAGES, fanout, fanoutInvariantSlots } from "../src/data/fanout";

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

const total = PRESETS.length * STAGES.length * 3;
if (invariant.length || malformed.length) {
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
console.log(`FANOUT GATE: PASS (${total}/${total} questions vary by persona; none malformed; experience never leaks)`);
