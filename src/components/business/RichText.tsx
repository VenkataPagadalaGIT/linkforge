import { Fragment } from "react";
import { Link } from "@/lib/router-shim";
import { parseInline } from "@/lib/business-validate";
import { hrefFor, type NameMap } from "@/lib/business-paths";

/**
 * Renders one Business Notebook text field: plain text, green highlights
 * (==...==), citations ([^n]) and entity links ([[person:slug]]). Everything
 * is rendered as text nodes, never as HTML, so content cannot inject markup.
 * The green is the brand's emerald pair as a background tint; the words stay
 * full-strength foreground, so contrast holds in both themes.
 */
export const HIGHLIGHT_CLASS =
  "bg-emerald-500/15 dark:bg-emerald-400/25 text-foreground rounded-sm px-0.5 ring-1 ring-emerald-700/40 dark:ring-emerald-300/40 [box-decoration-break:clone]";

export default function RichText({ text, names }: { text: string; names: NameMap }) {
  const segments = parseInline(text);
  // consecutive highlighted segments share one <mark>, so a highlight that
  // contains a link or a citation reads as one green run
  const runs: { highlight: boolean; items: typeof segments }[] = [];
  for (const s of segments) {
    const last = runs[runs.length - 1];
    if (last && last.highlight === s.highlight) last.items.push(s);
    else runs.push({ highlight: s.highlight, items: [s] });
  }
  const render = (s: (typeof segments)[number], i: number) => {
    if (s.kind === "text") return <Fragment key={i}>{s.text}</Fragment>;
    if (s.kind === "cite") {
      return (
        <sup key={i} className="ml-0.5">
          <a href={`#source-${s.id}`} className="font-mono text-[10px] text-muted-foreground hover:text-foreground no-underline">
            [{s.id}]
          </a>
        </sup>
      );
    }
    const label = s.label ?? (s.target === "page" || s.target === "url" ? s.ref : names[s.target][s.ref]) ?? s.ref;
    if (s.target === "url") {
      return (
        <a key={i} href={s.ref} target="_blank" rel="noopener noreferrer" className="underline decoration-foreground/40 underline-offset-2 hover:decoration-foreground">
          {label}
        </a>
      );
    }
    return (
      <Link key={i} to={hrefFor(s.target, s.ref)} className="underline decoration-foreground/40 underline-offset-2 hover:decoration-foreground">
        {label}
      </Link>
    );
  };
  return (
    <>
      {runs.map((run, i) =>
        run.highlight ? (
          <mark key={i} className={HIGHLIGHT_CLASS} data-highlight="ai">
            {run.items.map(render)}
          </mark>
        ) : (
          <Fragment key={i}>{run.items.map(render)}</Fragment>
        ),
      )}
    </>
  );
}
