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
/** 464 → "7:44". */
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

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

const emit = (block: Block): void => {
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
    case "table": {
      const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
      if (block.caption) {
        push(`*${block.caption}*`);
        push();
      }
      push(`| ${block.headers.map(cell).join(" | ")} |`);
      push(`|${block.headers.map(() => "---").join("|")}|`);
      for (const r of block.rows) push(`| ${r.map(cell).join(" | ")} |`);
      push();
      break;
    }
    case "image":
      push(`![${block.alt}](${SITE}${block.src})`);
      if (block.caption) push(`*${block.caption}*`);
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
      for (const b of block.blocks) emit(b);
      break;
    }
    case "universe":
      push(`![${block.poster.alt}](${SITE}${block.poster.src})`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "quote":
      push(
        `> "${block.text}" (${block.by}${block.role ? `, ${block.role}` : ""}${
          block.said ? `; said on stage, ${block.said.event}, [at ${clock(block.said.at)}](${block.said.href})` : ""
        })`,
      );
      push();
      break;
    case "slide":
      push(`![${block.alt}](${block.image.src})`);
      push();
      push(
        `*Slide ${block.n}, ${block.event}: [open this slide in the deck](${block.deck}?slide=${block.n})${
          block.listen ? `, or [hear it at ${clock(block.listen.at)} in the talk](${block.listen.href})` : ""
        }.*`,
      );
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "clip":
      push(`Video, on stage at ${block.event} (${Math.round(block.duration)} seconds, captioned): [${block.title}](${block.src})`);
      push();
      push(`> "${block.transcript}"`);
      push();
      if (block.chapter) push(`The whole part, in the talk: [${block.chapter.title}, at ${clock(block.chapter.at)}](${block.chapter.href})`), push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "embed":
      push(`[${block.title}](${block.href})`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      if (block.chapters?.length) {
        for (const c of block.chapters) push(`- ${clock(c.at)} [${c.title}](${c.href})`);
        push();
      }
      break;
    case "gallery":
      for (const it of block.items) push(`![${it.alt}](${it.src})`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "voices":
      for (const v of block.items) {
        push(`> "${v.quote}"`);
        push(`> (${v.author}${v.role ? `, ${v.role}` : ""}, [on LinkedIn](${v.url}), ${v.date}${v.about ? `; ${v.about.charAt(0).toLowerCase()}${v.about.slice(1)}` : ""})`);
        push();
      }
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "episodes":
      for (const e of block.items)
        push(
          `- [${e.title}](https://www.youtube.com/watch?v=${e.youtubeId}), ${e.outlet}, ${e.date}${e.minutes ? `, ${e.minutes} min` : ""}. ${e.summary}${
            e.why ? ` ${e.why}` : ""
          }`,
        );
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "bio":
      push(`**${block.kicker}: ${block.name}.** ${block.text}`);
      push();
      for (const p of block.proofs) push(`- ${p.label}: [${p.text}](${p.href})`);
      push();
      break;
    case "tools":
      for (const t of block.items) push(`- [${t.title}](${t.href}): ${t.text}`);
      push();
      break;
    case "papers":
      for (const p of block.items)
        push(`- ${p.review === "peer-reviewed" ? "Peer-reviewed. " : p.review === "preprint" ? "Preprint. " : ""}[${p.title}](${p.url}). ${p.venue}, ${p.year}${p.role ? `. ${p.role}` : ""}. ${p.summary}`);
      push();
      if (block.request) push(`**${block.request.title}** ${block.request.text} [${block.request.label}](${block.request.href})`), push();
      break;
    case "highlightkey":
      push(`*Reading key: ${block.items.map((k) => `${k.label}`).join(", ")} are set in bold in this edition.*`);
      push();
      break;
    case "plain":
      push(`> **In plain words:** ${block.text}`);
      push();
      break;
    case "stats":
      for (const it of block.items) push(`- **${it.value}** ${it.label}${it.note ? `: ${it.note}` : ""}`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "bars": {
      if (block.title) push(`**${block.title}**`), push();
      const two = block.items.some((it) => typeof it.compare === "number");
      const [l1, l2] = block.legend ?? ["Value", "Compared with"];
      push(two ? `| | ${l1} | ${l2 ?? "Compared with"} |` : `| | ${l1 ?? "Value"} |`);
      push(two ? "| --- | --- | --- |" : "| --- | --- |");
      for (const it of block.items) {
        const label = it.href ? `[${it.label}](${it.href})` : it.label;
        push(two ? `| ${label} | ${it.display ?? it.value} | ${it.compareDisplay ?? it.compare ?? ""} |` : `| ${label} | ${it.display ?? it.value} |`);
      }
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    }
    case "tabs":
      for (const t of block.tabs) {
        push(`**${t.label}**`);
        push();
        for (const b of t.blocks) emit(b);
      }
      break;
    case "pair":
      for (const b of block.blocks) emit(b);
      break;
    case "heatmap":
      push(`| ${block.corner ?? ""} | ${block.columns.join(" | ")} |`);
      push(`| --- | ${block.columns.map(() => "---").join(" | ")} |`);
      for (const r of block.rows) push(`| ${r.label} | ${r.values.map((v) => `${v}${block.unit ?? ""}`).join(" | ")} |`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "cards":
      for (const c of block.items) {
        const title = c.href ? `[${c.title}](${c.href})` : c.title;
        push(`- **${c.kicker ? `${c.kicker}: ` : ""}${title}**: ${c.text}${c.chips ? ` (${c.chips.join(", ")})` : ""}${c.foot ? ` ${c.foot}` : ""}`);
      }
      push();
      break;
    case "timeline":
      for (const t of block.items) push(`- **${t.date}: ${t.title}.** ${t.text}`);
      push();
      break;
    case "flow":
      block.steps.forEach((st, i) => push(`${i + 1}. **${st.label}**${st.detail ? `: ${st.detail}` : ""}`));
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "fanout":
      push(`**${block.root}**${block.rootNote ? ` (${block.rootNote})` : ""} fans out into:`);
      push();
      for (const b of block.branches) push(`- ${b}`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "iceberg":
      push(`- **Above the waterline, ${block.tip.label}**: ${block.tip.detail}`);
      for (const l of block.layers) push(`- **${l.label}**: ${l.detail}`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "radial":
      push(`| ${block.hub} | Size | Topics |`);
      push("| --- | --- | --- |");
      for (const n of block.nodes) push(`| ${n.label} | ${n.display ?? n.value} | ${n.dots} |`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "split":
      for (const side of [block.left, block.right]) {
        push(`**${side.title}**`);
        push();
        for (const it of side.items) push(`- ${it}`);
        push();
      }
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "traits":
      push(`**${block.href ? `[${block.title}](${block.href})` : block.title}**${block.subtitle ? `: ${block.subtitle}` : ""}`);
      push();
      push("| Trait | Value | Evidence |");
      push("| --- | --- | --- |");
      for (const t of block.items) push(`| ${t.label} | ${t.value} | ${t.grade} |`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    case "matrix": {
      const q = block.quadrants;
      push(`Axes: ${block.x} (left to right) and ${block.y} (bottom to top).`);
      push();
      for (const [where, c] of [["High " + block.y.toLowerCase() + ", low " + block.x.toLowerCase(), q.tl], ["High on both", q.tr], ["Low on both", q.bl], ["Low " + block.y.toLowerCase() + ", high " + block.x.toLowerCase(), q.br]] as const)
        push(`- **${c.title}** (${where}): ${c.text}`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
    }
    case "slope":
      if (block.title) push(`**${block.title}**`), push();
      push(`| | ${block.from} | ${block.to} |`);
      push("| --- | --- | --- |");
      for (const se of block.series) push(`| ${se.label} | ${se.from}${block.unit ?? ""} | ${se.to}${block.unit ?? ""} |`);
      push();
      if (block.caption) push(`*${block.caption}*`), push();
      break;
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
    case "framework": {
      if (block.caption) {
        push(`**${block.caption}**`);
        push();
      }
      block.steps.forEach((st, i) => push(`${i + 1}. **${st.name}**: ${st.question} ${st.note}`));
      push();
      push(`- **The map:** ${block.map.title} (${block.map.items.join(", ")}). Every step reads and writes it.`);
      push(`- **The rule:** ${block.rule}`);
      push(`- **The loop:** ${block.loop}`);
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
};
for (const block of guide.blocks as Block[]) emit(block);

return {
  body: lines
    .join("\n")
    .replace(/\[\[[ygb]:([^\]]+)\]\]/g, "**$1**")
    .replace(/\]\(\/(?!\/)/g, `](${SITE}/`),
  unsupported: [...unsupported],
};
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
