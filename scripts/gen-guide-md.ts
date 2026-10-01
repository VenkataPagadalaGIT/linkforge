/**
 * gen-guide-md.ts: render a guide record to its crawlable markdown twin.
 *
 * Usage: npx tsx scripts/gen-guide-md.ts <slug>
 * Writes public/guides/<slug>.md from src/data/guides.ts, so the twin can
 * never drift from the page (same data renders both). Interactive blocks
 * become a pointer line; journey and station blocks become real text.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { guides, type Block } from "../src/data/guides";
import { NN_ACTS, NN_JOURNEY, NN_STAGES } from "../src/data/nn";
import { QC_ACTS, QC_JOURNEY, QC_STAGES } from "../src/data/quantum";
import { JOURNEY as JEV_JOURNEY, STATIONS as JEV_STATIONS } from "../src/data/jev";
import { existsSync, readFileSync } from "node:fs";

// Usage: gen-guide-md.ts <slug|--all> [--check]
// --check renders without writing and exits 1 if any twin on disk differs, so
// preflight can refuse to ship a page whose markdown edition drifted.
const args = process.argv.slice(2);
const check = args.includes("--check");
const target = args.find((a) => !a.startsWith("--"));
const selected = target === "--all" || args.includes("--all") ? guides : guides.filter((g) => g.slug === target);
if (!selected.length) {
  console.error(`No guide with slug "${target}"`);
  process.exit(1);
}

const SITE = "https://venkatapagadala.com";

// Block kinds this renderer has no case for. A twin rendered while any of
// these are present would silently drop that content, which is exactly how
// four older twins lost their journey transcripts, fault tables and
// screenshots on 2026-09-24. So a guide using one is refused, never written.
function render(guide: (typeof guides)[number]): { body: string; unsupported: string[] } {
const unsupported = new Set<string>();
const lines: string[] = [];
const push = (s = "") => lines.push(s);

push(`# ${guide.headline}`);
push();
if (guide.subhead) {
  push(guide.subhead.replace(/\*\*/g, "**"));
  push();
}
push(`> ${guide.deck}`);
push();
push(
  `By ${guide.author?.name ?? "Venkata Pagadala"}, ${guide.author?.title ?? ""}${guide.author?.org ? ", " + guide.author.org : ""} · Updated ${guide.dateModified} · ${guide.readingTime}`,
);
push();
push(`Canonical: ${SITE}/guides/${guide.slug}`);
push(`Tags: ${guide.tags.join(", ")}`);
push();

for (const block of guide.blocks as Block[]) {
  switch (block.kind) {
    case "p":
      push(block.text);
      push();
      break;
    case "h2":
      push(`## ${block.text}`);
      push();
      break;
    case "h3":
      push(`### ${block.text}`);
      push();
      break;
    case "nn":
    case "jev":
      push(`*(Interactive 3D content: explore it at ${SITE}/guides/${guide.slug})*`);
      push();
      break;
    case "jevjourney":
      JEV_JOURNEY.forEach((st, i) => {
        push(`${i + 1}. **${st.title}.** ${st.narration}${st.act === 2 ? " *(inside an agent harness)*" : ""}`);
      });
      push();
      break;
    case "jevstations": {
      push(`| Station | Kind | What happens | Numbers | Source |`);
      push(`|---|---|---|---|---|`);
      for (const st of JEV_STATIONS) {
        const nums = st.numbers.map((n) => `${n.label}: ${n.value}`).join(" · ");
        const src = st.source ? `[${st.source.label}](${st.source.href})` : "Illustration in this guide";
        push(`| ${st.name}${st.act === 2 ? " (inside an agent)" : ""} | ${st.kind} | ${st.tagline}. ${st.story} | ${nums} | ${src} |`);
      }
      push();
      break;
    }
    case "code":
      if (block.caption) {
        push(`*${block.caption}*`);
        push();
      }
      push("```");
      push(block.code);
      push("```");
      push();
      break;
    case "decision":
      for (const it of block.items) push(`- **When** ${it.when}: **${it.use}**`);
      push();
      break;
    case "callout":
      push(`> **${block.title}:** ${block.text}`);
      push();
      break;
    case "list": {
      block.items.forEach((it, i) => push(block.ordered ? `${i + 1}. ${it}` : `- ${it}`));
      push();
      break;
    }
    case "details": {
      push(`### ${block.summary}`);
      push();
      for (const b of block.blocks) {
        if (b.kind === "p") {
          push(b.text);
          push();
        } else if (b.kind === "list") {
          b.items.forEach((it, i) => push(b.ordered ? `${i + 1}. ${it}` : `- ${it}`));
          push();
        } else {
          unsupported.add(`details>${b.kind}`);
        }
      }
      break;
    }
    case "quantum":
      push(`*(Interactive 3D content: explore it at ${SITE}/guides/${guide.slug})*`);
      push();
      break;
    case "quantumjourney":
      QC_JOURNEY.forEach((st, i) => {
        push(`${i + 1}. **${st.title}.** ${st.narration}`);
      });
      push();
      break;
    case "quantumstages": {
      push(`| Station | Act | What happens | Real numbers | Primary source |`);
      push(`|---|---|---|---|---|`);
      for (const s of QC_STAGES) {
        const nums = s.numbers.map((n) => `${n.label}: ${n.value}`).join(" · ");
        push(
          `| ${s.name} | ${QC_ACTS[s.act].label.replace(/^Act [IV]+: /, "")} | ${s.tagline}. ${s.story} | ${nums} | ${s.paper ?? ""} |`,
        );
      }
      push();
      break;
    }
    case "nnjourney":
      NN_JOURNEY.forEach((st, i) => {
        push(`${i + 1}. **${st.title}.** ${st.narration}`);
      });
      push();
      break;
    case "nnstages": {
      push(`| Station | Act | What happens | Real numbers | Primary source |`);
      push(`|---|---|---|---|---|`);
      for (const s of NN_STAGES) {
        const nums = s.numbers.map((n) => `${n.label}: ${n.value}`).join(" · ");
        push(
          `| ${s.name} | ${s.act} | ${s.tagline} ${s.story} | ${nums} | ${s.paper ?? "computed in this guide"} |`,
        );
      }
      push();
      break;
    }
    case "termcard": {
      const t = guide.terms.find((x) => x.slug === block.termSlug);
      if (!t) break;
      push(`### ${t.term}${t.aka?.length ? ` (aka ${t.aka.join(", ")})` : ""}`);
      push();
      push(t.oneLiner);
      push();
      push(t.inDepth);
      push();
      push(`- **Analogy:** ${t.analogy}`);
      push(`- **Example:** ${t.example}`);
      push(`- **${guide.termRoleLabel ?? "Why it matters"}:** ${t.agentRole}`);
      push();
      break;
    }
    case "comparison": {
      const headers = guide.comparisonHeaders ?? [
        "Type", "Is a", "Answers", "Structure", "Example", "Best for", "Limit",
      ];
      push(`| ${headers.join(" | ")} |`);
      push(`|${headers.map(() => "---").join("|")}|`);
      for (const r of guide.comparison) {
        push(`| ${r.type} | ${r.isA} | ${r.answers} | ${r.structure} | ${r.example} | ${r.bestFor} | ${r.limit} |`);
      }
      push();
      break;
    }
    case "faq":
      for (const f of guide.faqs) {
        push(`### ${f.q}`);
        push();
        push(f.a);
        push();
      }
      break;
    case "related":
      push(`## Related on this site`);
      push();
      for (const it of block.items) push(`- [${it.label}](${SITE}${it.href})`);
      push();
      break;
    case "sources":
      push(`## Sources & further reading`);
      push();
      for (const it of block.items) {
        push(`- [${it.label}](${it.href})${it.note ? ` · ${it.note}` : ""}`);
      }
      push();
      break;
    default:
      unsupported.add(block.kind);
      break;
  }
}

return { body: lines.join("\n"), unsupported: [...unsupported] };
}

let stale = 0;
for (const guide of selected) {
  const out = join(process.cwd(), "public", "guides", `${guide.slug}.md`);
  const { body, unsupported } = render(guide);
  if (unsupported.length) {
    // --all passes over these (their twins come from the older exporter); a
    // direct request for one is an error, so nobody overwrites a richer twin.
    const msg = `${guide.slug}.md not rendered: this generator has no case for ${unsupported.join(", ")}`;
    if (selected.length === 1) {
      console.error(`REFUSED ${msg}. Add those cases before regenerating it.`);
      process.exit(1);
    }
    console.log(`skip   ${msg}`);
    continue;
  }
  if (check) {
    const current = existsSync(out) ? readFileSync(out, "utf-8") : null;
    if (current === body) console.log(`ok     ${guide.slug}.md matches the data`);
    else {
      stale += 1;
      console.log(`STALE  ${guide.slug}.md ${current === null ? "is missing" : "differs from the data"}; run: npx tsx scripts/gen-guide-md.ts ${guide.slug}`);
    }
  } else {
    writeFileSync(out, body, "utf-8");
    console.log(`wrote ${out} (${body.split("\n").length} lines)`);
  }
}
if (check && stale) process.exit(1);
