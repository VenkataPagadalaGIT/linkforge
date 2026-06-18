"use client";
import { Link } from "@/lib/router-shim";
import type { Block, Guide, DefinedTerm } from "@/data/guides";
import { VIEW_BUILDERS } from "@/lib/graphModels";
import GraphFigure from "./GraphFigure";
import GraphLayerStack from "./GraphLayerStack";
import Graph3DLazy from "./Graph3DLazy";

const bold = (s: string) =>
  s.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');

function TermCard({ term }: { term: DefinedTerm }) {
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
      <p className="font-mono text-sm text-foreground/90 leading-relaxed border-l-2 border-foreground/40 pl-4 mb-5">
        {term.oneLiner}
      </p>
      <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">{term.inDepth}</p>
      <dl className="space-y-3">
        {[
          ["Analogy", term.analogy],
          ["Example", term.example],
          ["Role for AI agents", term.agentRole],
        ].map(([label, body]) => (
          <div key={label} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 pt-0.5">{label}</dt>
            <dd className="font-mono text-xs text-muted-foreground leading-relaxed">{body}</dd>
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
            {["Type", "What it is", "Answers", "Structure", "Example", "Best for", "Limitation"].map((h) => (
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
    case "graph3d":
      return <Graph3DLazy />;
    case "comparison":
      return <ComparisonTable guide={guide} />;
    case "termcard": {
      const term = guide.terms.find((t) => t.slug === block.termSlug);
      return term ? <TermCard term={term} /> : null;
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
    case "faq":
      return (
        <div className="my-6 space-y-5">
          {guide.faqs.map((f, j) => (
            <div key={j} className="border-l-2 border-border pl-4">
              <h3 className="font-display text-base font-semibold text-foreground mb-2">{f.q}</h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
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
