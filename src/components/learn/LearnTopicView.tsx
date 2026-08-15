import Link from "next/link";
import {
  learnChapterOfTopic,
  learnPrevNext,
  allLearnTopics,
  type LearnTopic,
} from "@/data/learn";

/** Tiny inline markdown: [label](url), **bold**, `code`. Same contract as
 *  the guide renderer; external links open in a new tab with noopener. */
const inline = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors">${label}</a>`,
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/`([^`]+?)`/g, '<code class="font-mono text-[0.92em] text-foreground bg-foreground/5 border border-border/60 px-1 py-px rounded-sm">$1</code>');

function PrevNext({ slug, bottom = false }: { slug: string; bottom?: boolean }) {
  const { prev, next } = learnPrevNext(slug);
  return (
    <div className={`flex items-center justify-between gap-3 ${bottom ? "mt-10 pt-6 border-t border-border" : "mb-8"}`}>
      {prev ? (
        <Link
          href={`/learn/${prev.slug}`}
          rel="prev"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {prev.short}
        </Link>
      ) : (
        <Link
          href="/learn"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Tutorial home
        </Link>
      )}
      {next ? (
        <Link
          href={`/learn/${next.slug}`}
          rel="next"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors"
        >
          {next.short} →
        </Link>
      ) : (
        <Link
          href="/notebook/ai"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors"
        >
          Continue: the 18-week roadmap →
        </Link>
      )}
    </div>
  );
}

export default function LearnTopicView({ topic }: { topic: LearnTopic }) {
  const chapter = learnChapterOfTopic(topic.slug);
  const idx = allLearnTopics.findIndex((t) => t.slug === topic.slug);

  return (
    <article>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
        {chapter?.title} · Lesson {idx + 1} of {allLearnTopics.length} · {topic.minutes} min
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-4">
        {topic.title}
      </h1>
      <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6">{topic.summary}</p>

      <PrevNext slug={topic.slug} />

      {topic.sections.map((s, i) => (
        <section key={i} className="mb-6">
          {s.heading && (
            <h2 className="font-display text-xl font-bold text-foreground mb-2">{s.heading}</h2>
          )}
          <p
            className="font-mono text-xs sm:text-[13px] text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: inline(s.body) }}
          />
        </section>
      ))}

      {topic.interactive && (
        <Link
          href={topic.interactive.href}
          className="group block border border-emerald-400/40 bg-emerald-400/[0.05] p-5 my-8 hover:bg-emerald-400/10 transition-colors"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 mb-1.5">
            Interactive · 3D
          </p>
          <p className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-glow">
            {topic.interactive.label} →
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">{topic.interactive.note}</p>
        </Link>
      )}

      <div className="border border-border bg-card/30 p-5 my-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
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

      <div className="my-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
          Top free resources
        </p>
        <div className="space-y-2.5">
          {topic.resources.map((r) => (
            <div key={r.url}>
              {r.url.startsWith("/") ? (
                <Link
                  href={r.url}
                  className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                >
                  {r.title}
                </Link>
              ) : (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                >
                  {r.title} ↗
                </a>
              )}
              <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{r.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
          Related on this site
        </p>
        <ul className="space-y-1.5">
          {topic.related.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {r.label} →
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <PrevNext slug={topic.slug} bottom />
    </article>
  );
}
