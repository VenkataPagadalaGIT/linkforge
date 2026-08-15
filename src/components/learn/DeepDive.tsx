import Link from "next/link";
import type { LearnTopic } from "@/data/learn";

/** Tiny inline markdown: [label](url), **bold**, `code`. */
const inline = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors">${label}</a>`,
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/`([^`]+?)`/g, '<code class="font-mono text-[0.92em] text-foreground bg-foreground/5 border border-border/60 px-1 py-px rounded-sm">$1</code>');

/**
 * DeepDive: a fact-checked lesson from src/data/learn.ts, rendered inline
 * on its concept's encyclopedia page. The full read lives HERE, on the
 * concept the reader clicked, never behind another hop.
 */
export default function DeepDive({ topic }: { topic: LearnTopic }) {
  return (
    <section className="border-t border-border pt-6 mt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">
        Deep dive · {topic.minutes} min
      </p>
      <h2 className="font-display text-2xl font-bold text-foreground mb-4">{topic.title}</h2>

      {topic.sections.map((s, i) => (
        <div key={i} className="mb-5">
          {s.heading && (
            <h3 className="font-display text-lg font-bold text-foreground mb-2">{s.heading}</h3>
          )}
          <p
            className="font-mono text-xs sm:text-[13px] text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: inline(s.body) }}
          />
        </div>
      ))}

      <div className="border border-border bg-card/30 p-4 my-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2.5">
          In one glance
        </p>
        <ul className="space-y-1.5">
          {topic.keyPoints.map((k, i) => (
            <li key={i} className="font-mono text-xs text-muted-foreground flex gap-2">
              <span className="text-emerald-700 dark:text-emerald-300" aria-hidden="true">▪</span>
              <span>{k}</span>
            </li>
          ))}
        </ul>
      </div>

      {topic.related.length > 0 && (
        <ul className="space-y-1">
          {topic.related.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                {r.label} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
