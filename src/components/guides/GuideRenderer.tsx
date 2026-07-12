"use client";
import { Link } from "@/lib/router-shim";
import type { Block, Guide, DefinedTerm } from "@/data/guides";
import { VIEW_BUILDERS } from "@/lib/graphModels";
import GraphFigure from "./GraphFigure";
import GraphLayerStack from "./GraphLayerStack";
import {
  FAULTS,
  PATHS,
  SCENARIOS,
  SEVERITY_META,
  componentById,
  faultsForPath,
  symptomById,
  type HvacPath,
} from "@/data/hvac";
import HvacExplorerLazy from "./HvacExplorerLazy";
import LlmExplorerLazy from "./LlmExplorerLazy";
import { JOURNEY, STAGES, ZONES } from "@/data/llm";

// Tiny inline markdown: [label](url), **bold**, *italic*, and `code`. Order
// matters — links run first so a URL containing ** or _ never gets caught by a
// later pass. External http(s) URLs open in a new tab and carry a noopener rel
// for safety + SEO (so we don't pass equity to every cited paper).
const inline = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors">${label}</a>`
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em class="italic text-foreground/90">$2</em>')
    .replace(/`([^`]+?)`/g, '<code class="font-mono text-[0.92em] text-foreground bg-foreground/5 border border-border/60 px-1 py-px rounded-sm">$1</code>');
const bold = inline;

function TermCard({ term, roleLabel = "Role for AI agents" }: { term: DefinedTerm; roleLabel?: string }) {
  return (
    <div className="border border-border bg-card/30 p-6 my-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <h3 className="font-display text-xl font-bold text-foreground">{term.term}</h3>
        {term.aka && term.aka.length > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground/60">
            aka {term.aka.join(" · ")}
          </span>
        )}
      </div>
      <p
        className="font-mono text-sm text-foreground/90 leading-relaxed border-l-2 border-foreground/40 pl-4 mb-5"
        dangerouslySetInnerHTML={{ __html: inline(term.oneLiner) }}
      />
      <p
        className="font-mono text-xs text-muted-foreground leading-relaxed mb-5"
        dangerouslySetInnerHTML={{ __html: inline(term.inDepth) }}
      />
      <dl className="space-y-3">
        {[
          ["Analogy", term.analogy],
          ["Example", term.example],
          [roleLabel, term.agentRole],
        ].map(([label, body]) => (
          <div key={label} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 pt-0.5">{label}</dt>
            <dd
              className="font-mono text-xs text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: inline(body) }}
            />
          </div>
        ))}
      </dl>
    </div>
  );
}

function ComparisonTable({ guide }: { guide: Guide }) {
  return (
    <div className="my-6 overflow-x-auto border border-border">
      <table className="w-full border-collapse min-w-[760px]">
        <thead>
          <tr className="bg-secondary/30">
            {(guide.comparisonHeaders ?? ["Type", "What it is", "Answers", "Structure", "Example", "Best for", "Limitation"]).map((h) => (
              <th key={h} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 text-left p-3 border-b border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guide.comparison.map((r) => (
            <tr key={r.type} className="align-top hover:bg-secondary/10 transition-colors">
              <td className="font-mono text-xs text-foreground font-semibold p-3 border-b border-border/50 whitespace-nowrap">{r.type}</td>
              <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{r.isA}</td>
              <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{r.answers}</td>
              <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{r.structure}</td>
              <td className="font-mono text-[11px] text-muted-foreground/80 p-3 border-b border-border/50">{r.example}</td>
              <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{r.bestFor}</td>
              <td className="font-mono text-[11px] text-muted-foreground/70 p-3 border-b border-border/50">{r.limit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockView({ block, guide }: { block: Block; guide: Guide }) {
  switch (block.kind) {
    case "p":
      return (
        <p
          className="font-mono text-sm text-muted-foreground leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: bold(block.text) }}
        />
      );
    case "h2":
      return (
        <h2 id={block.id} className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-14 mb-4 scroll-mt-28">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={block.id} className="font-display text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-28">
          {block.text}
        </h3>
      );
    case "figure": {
      const builder = VIEW_BUILDERS[block.viewId];
      if (!builder) return null;
      return <GraphFigure view={builder()} />;
    }
    case "stack":
      return <GraphLayerStack />;
    case "comparison":
      return <ComparisonTable guide={guide} />;
    case "termcard": {
      const term = guide.terms.find((t) => t.slug === block.termSlug);
      return term ? <TermCard term={term} roleLabel={guide.termRoleLabel ?? "Role for AI agents"} /> : null;
    }
    case "code":
      return (
        <figure className="my-6">
          <pre className="border border-border bg-card/60 p-4 overflow-x-auto text-[11.5px] leading-relaxed font-mono text-foreground/85">
            <code>{block.code}</code>
          </pre>
          {block.caption && (
            <figcaption className="font-mono text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "callout":
      return (
        <div className="my-6 border border-foreground/20 bg-foreground/[0.03] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{block.title}</p>
          <p
            className="font-mono text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: bold(block.text) }}
          />
        </div>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="list-none space-y-2 my-4">
          {block.items.map((item, j) => (
            <li key={j} className="font-mono text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-foreground/40">{block.ordered ? `${j + 1}.` : "—"}</span>
              <span dangerouslySetInnerHTML={{ __html: bold(item) }} />
            </li>
          ))}
        </Tag>
      );
    }
    case "decision":
      return (
        <div className="my-6 space-y-2">
          {block.items.map((it, j) => (
            <div key={j} className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-1 sm:gap-4 border border-border/60 p-4 hover:bg-secondary/10 transition-colors">
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">{it.when}</p>
              <p
                className="font-mono text-xs text-foreground/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: bold("→ " + it.use) }}
              />
            </div>
          ))}
        </div>
      );
    case "related":
      return (
        <div className="my-8 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">Go deeper</p>
          <div className="space-y-2">
            {block.items.map((it) => (
              <Link
                key={it.href}
                to={it.href}
                className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                → {it.label}
              </Link>
            ))}
          </div>
        </div>
      );
    case "hvac":
      return <HvacExplorerLazy />;
    case "hvacpaths":
      return (
        <div className="my-6 space-y-4">
          {(Object.keys(PATHS) as HvacPath[]).map((pKey) => {
            const meta = PATHS[pKey];
            const faults = faultsForPath(pKey);
            return (
              <div key={pKey} className="border border-border/70" style={{ borderLeft: `3px solid ${meta.color}` }}>
                <div className="p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                    <h3 className="font-display text-lg font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground/60">{faults.length} faults live here</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">{meta.description}</p>
                  <p className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed mb-3">
                    <span className="uppercase text-[9px] tracking-[0.2em] text-muted-foreground/50 mr-2">Flow</span>
                    {meta.flow.map((c, i) => (
                      <span key={i}>
                        {i > 0 && <span className="text-muted-foreground/40"> → </span>}
                        <span className="text-foreground/80">{componentById(c)?.name ?? c}</span>
                      </span>
                    ))}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-4">
                    <span className="uppercase text-[9px] tracking-[0.2em] text-muted-foreground/50 mr-2">How it fails</span>
                    {meta.failureSignature}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {faults.map((f) => (
                      <span key={f.id} className="font-mono text-[10px] border border-border/60 px-2 py-1 text-muted-foreground" title={`${SEVERITY_META[f.severity].label} · ${f.costHint}`}>
                        {f.name}
                        <span className="ml-1.5" style={{ color: SEVERITY_META[f.severity].color }}>●</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    case "hvacscenarios":
      return (
        <div className="my-6 space-y-6">
          {SCENARIOS.map((sc) => (
            <div key={sc.id} className="border border-border/70 p-5">
              {sc.kind === "healthy" && (
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">
                  Baseline — how it's supposed to work
                </p>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{sc.title}</h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed border-l-2 border-foreground/30 pl-4 mb-4">
                {sc.symptomSummary}
              </p>
              <ol className="space-y-2.5 mb-4">
                {sc.steps.map((st, i) => (
                  <li key={i} className="font-mono text-xs text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-foreground/40 flex-shrink-0">{i + 1}.</span>
                    <span>
                      <strong className="text-foreground font-semibold">{st.title}.</strong> {st.text}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="font-mono text-xs text-foreground/90 leading-relaxed bg-foreground/[0.03] border border-foreground/15 p-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mr-2">
                  {sc.kind === "healthy" ? "Takeaway" : "Verdict"}
                </span>
                {sc.verdict}
              </p>
            </div>
          ))}
        </div>
      );
    case "hvacfaults":
      return (
        <div className="my-6 overflow-x-auto border border-border">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-secondary/30">
                {["Fault", "Severity", "Symptoms", "Components", "First checks", "Fix & typical cost"].map((h) => (
                  <th key={h} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 text-left p-3 border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAULTS.map((f) => (
                <tr key={f.id} className="align-top hover:bg-secondary/10 transition-colors">
                  <td className="font-mono text-xs text-foreground font-semibold p-3 border-b border-border/50 whitespace-nowrap">{f.name}</td>
                  <td className="p-3 border-b border-border/50 whitespace-nowrap">
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border" style={{ color: SEVERITY_META[f.severity].color, borderColor: `${SEVERITY_META[f.severity].color}66` }}>
                      {SEVERITY_META[f.severity].label}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">
                    {f.symptoms.map((sy) => symptomById(sy)?.label ?? sy).join(" · ")}
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">
                    {f.components.map((c) => componentById(c)?.name ?? c).join(" · ")}
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{f.checks[0]}</td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">
                    {f.fix} <span className="text-muted-foreground/60 whitespace-nowrap">({f.costHint})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "llm":
      return <LlmExplorerLazy />;
    case "llmjourney":
      return (
        <div className="my-6 border border-border/70 p-5">
          <ol className="space-y-4">
            {JOURNEY.map((st, i) => (
              <li key={st.id} className="font-mono text-xs text-muted-foreground leading-relaxed flex gap-3">
                <span className="text-foreground/40 flex-shrink-0 w-5 text-right">{i + 1}.</span>
                <span>
                  <strong className="text-foreground font-semibold">{st.title}.</strong>{" "}
                  {st.narration}
                  {st.training && (
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-amber-400/40 text-amber-300/90">
                      training
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "llmstages":
      return (
        <div className="my-6 overflow-x-auto border border-border">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-secondary/30">
                {["Stage", "Zone", "What happens", "Real numbers", "2025-2026"].map((h) => (
                  <th key={h} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 text-left p-3 border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s) => (
                <tr key={s.id} className="align-top hover:bg-secondary/10 transition-colors">
                  <td className="font-mono text-xs text-foreground font-semibold p-3 border-b border-border/50 whitespace-nowrap">{s.name}</td>
                  <td className="p-3 border-b border-border/50 whitespace-nowrap">
                    <span
                      className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border"
                      style={{ color: ZONES[s.zone].color, borderColor: `${ZONES[s.zone].color}66` }}
                    >
                      {s.zone}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{s.tagline}. {s.story}</td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">
                    {s.numbers.map((n) => `${n.label}: ${n.value}`).join(" · ")}
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground p-3 border-b border-border/50">{s.now ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "sources":
      return (
        <div className="my-8 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
            Sources & further reading
          </p>
          <div className="space-y-2.5">
            {block.items.map((it) => (
              <div key={it.href}>
                <a href={it.href} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors">
                  {it.label} ↗
                </a>
                {it.note && <p className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed mt-0.5">{it.note}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    case "faq":
      return (
        <div className="my-6 space-y-5">
          {guide.faqs.map((f, j) => (
            <div key={j} className="border-l-2 border-border pl-4">
              <h3 className="font-display text-base font-semibold text-foreground mb-2">{f.q}</h3>
              <p
                className="font-mono text-xs text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: inline(f.a) }}
              />
            </div>
          ))}
        </div>
      );
    case "details":
      return (
        <details className="my-8 border border-border bg-card/30 group">
          <summary className="cursor-pointer list-none px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center justify-between transition-colors">
            <span>{block.summary}</span>
            <span className="text-foreground/40 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
          </summary>
          <div className="border-t border-border px-5 pb-4">
            {block.blocks.map((b, j) => (
              <BlockView key={j} block={b} guide={guide} />
            ))}
          </div>
        </details>
      );
    default:
      return null;
  }
}

const GuideRenderer = ({ guide }: { guide: Guide }) => {
  return (
    <article>
      {guide.blocks.map((block, i) => (
        <BlockView key={i} block={block} guide={guide} />
      ))}
    </article>
  );
};

export default GuideRenderer;
