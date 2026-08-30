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

const slug = process.argv[2];
const guide = guides.find((g) => g.slug === slug);
if (!guide) {
  console.error(`No guide with slug "${slug}"`);
  process.exit(1);
}

const SITE = "https://venkatapagadala.com";
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
      push(`*(Interactive 3D content: explore it at ${SITE}/guides/${guide.slug})*`);
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
      break;
  }
}

const out = join(process.cwd(), "public", "guides", `${guide.slug}.md`);
writeFileSync(out, lines.join("\n"), "utf-8");
console.log(`wrote ${out} (${lines.length} lines)`);
