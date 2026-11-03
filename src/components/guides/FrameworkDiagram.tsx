import type { Block } from "@/data/guides";

type FrameworkBlock = Extract<Block, { kind: "framework" }>;

/** Step accents, in order. The tokens are brand pairs in app/globals.css (-700 light, -300 dark). */
const ACCENTS = ["--stage-discover", "--stage-explore", "--stage-compare", "--stage-decide", "--stage-own"];
/** Whole class names, so Tailwind sees each one at build time. */
const COLS: Record<number, string> = { 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" };

/**
 * A framework drawn in HTML: the steps in order, the map every step reads and
 * writes, the rule and the loop. Plain server-rendered markup, so the whole
 * diagram is text that readers, crawlers and agents can quote, with no script.
 */
export default function FrameworkDiagram({ block }: { block: FrameworkBlock }) {
  const n = block.steps.length;
  return (
    <figure className="my-10" aria-label={block.caption ?? "Framework"}>
      <div className="border border-border bg-card/30 p-4 sm:p-6">
        <ol className={`grid gap-y-3 md:gap-x-6 ${COLS[n] ?? "md:grid-cols-5"}`} aria-label="The steps, in order">
          {block.steps.map((s, i) => {
            const accent = `var(${ACCENTS[i % ACCENTS.length]})`;
            return (
              <li key={s.name} className="relative">
                <div className="h-full border border-border bg-background p-4" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
                  <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="font-display text-lg font-bold text-foreground mt-1">{s.name}</p>
                  <p className="font-mono text-[11px] text-foreground/90 leading-snug mt-2">{s.question}</p>
                  <p className="font-mono text-[10.5px] text-muted-foreground leading-snug mt-2">{s.note}</p>
                </div>
                {i < n - 1 && (
                  <>
                    <span
                      aria-hidden="true"
                      className="hidden md:flex absolute top-1/2 -right-[21px] -translate-y-1/2 h-4 w-4 items-center justify-center font-mono text-xs text-muted-foreground"
                    >
                      →
                    </span>
                    <span aria-hidden="true" className="md:hidden block text-center font-mono text-xs text-muted-foreground pt-3">
                      ↓
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 border border-dashed border-foreground/30 bg-background/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The map · every step reads and writes it</p>
          <p className="font-display text-base font-semibold text-foreground mt-1">{block.map.title}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {block.map.items.map((it) => (
              <li key={it} className="border border-border px-2 py-1 font-mono text-[10.5px] text-foreground/90">
                {it}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="border border-border bg-background p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The rule</p>
            <p className="font-mono text-sm text-foreground mt-1">{block.rule}</p>
          </div>
          <div className="border border-border bg-background p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The loop</p>
            <p className="font-mono text-sm text-foreground mt-1">
              <span aria-hidden="true">↻ </span>
              {block.loop}
            </p>
          </div>
        </div>
      </div>
      {block.caption && (
        <figcaption className="font-mono text-[11px] text-muted-foreground/80 mt-2 leading-relaxed">{block.caption}</figcaption>
      )}
    </figure>
  );
}
