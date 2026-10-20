import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import LinkedInExplorer from "@/components/linkedin/LinkedInExplorer";
import ArticleCard from "@/components/linkedin/ArticleCard";
import TopicTree from "@/components/linkedin/TopicTree";
import { UNIVERSE_NAME, UNIVERSE_PATH, entryPath, formatDay, mostEngaging, relatedTopics, topNames, topicCounts, topicPath, topicTrail } from "@/data/linkedinArchive";
import type { LinkedInTopicPage } from "@/data/linkedinArchiveServer";

const LEVEL_NAME = { 1: "Area", 2: "Topic", 3: "Subtopic" } as const;
const EYEBROW = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70";
const plural = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
const ALL_COUNTS = topicCounts();

/** One node of the topic tree: where it sits, what is under it, and every post, article and media item it holds. */
export default function LinkedInTopicView({ topic }: { topic: LinkedInTopicPage }) {
  const trail = topicTrail(topic.id);
  const related = relatedTopics(topic.id);
  const names = topNames(topic.entries);
  const media = topic.entries.filter((e) => e.kind === "media").length;
  const years = [...new Set(topic.entries.map((e) => e.date.slice(0, 4)))].sort();
  const top = mostEngaging(topic.posts, 8);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block" aria-label="All topics">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <TopicTree counts={ALL_COUNTS} active={topic.id} mode="link" />
          </div>
        </aside>

        <div className="min-w-0">
          <ScrollReveal>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground mb-8">
              <a href={UNIVERSE_PATH} className="hover:text-foreground transition-colors">{UNIVERSE_NAME}</a>
              {trail.map((n, k) => (
                <React.Fragment key={n.id}>
                  <span aria-hidden="true">›</span>
                  {k < trail.length - 1 ? (
                    <a href={topicPath(n.id)} className="hover:text-foreground transition-colors">{n.label}</a>
                  ) : (
                    <span className="text-foreground" aria-current="page">{n.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
              {UNIVERSE_NAME} · {LEVEL_NAME[topic.level]}
              {years.length ? ` · ${years[0]}` : ""}
              {years.length > 1 ? ` to ${years[years.length - 1]}` : ""}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">{topic.label}</h1>
            {topic.description && <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-2">{topic.description}</p>}
            <p className="font-mono text-xs text-muted-foreground/70 mb-8">
              {[
                topic.posts.length ? plural(topic.posts.length, "post") : "",
                topic.articles.length ? plural(topic.articles.length, "article") : "",
                media ? `${plural(media, "media item")} on their own` : "",
                topic.itemCount ? `${plural(topic.itemCount, "image, video or document")} in all` : "",
              ]
                .filter(Boolean)
                .join(" · ") || "Nothing here yet"}
              .
            </p>
          </ScrollReveal>

          {/* Mobile: the sidebar's place */}
          <details className="lg:hidden mb-8 border border-border">
            <summary className="cursor-pointer px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">Browse by topic</summary>
            <div className="px-3 pb-3">
              <TopicTree counts={ALL_COUNTS} active={topic.id} mode="link" />
            </div>
          </details>


          {(related.length > 0 || names.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {related.length > 0 && (
                <section aria-labelledby="li-related-h">
                  <h2 id="li-related-h" className={`${EYEBROW} mb-2`}>
                    Related {topic.level === 1 ? "areas" : topic.level === 2 ? "topics" : "subtopics"}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {related.map((r) => (
                      <a key={r.id} href={topicPath(r.id)} className="font-mono text-[11px] px-2 py-1 border border-border text-foreground hover:border-foreground/50">
                        {r.label} <span className="text-muted-foreground/70">· {r.shared} shared</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
              {names.length > 0 && (
                <section aria-labelledby="li-names-h">
                  <h2 id="li-names-h" className={`${EYEBROW} mb-2`}>Names that recur here</h2>
                  <p className="font-mono text-[11px] text-foreground/90 leading-relaxed">{names.map((n) => `${n.name} (${n.count})`).join(" · ")}</p>
                </section>
              )}
            </div>
          )}

          {topic.articles.length > 0 && (
            <section className="mb-10" aria-labelledby="li-topic-articles-h">
              <h2 id="li-topic-articles-h" className={`${EYEBROW} mb-3`}>
                Articles on {topic.label} ({topic.articles.length})
              </h2>
              <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {topic.articles.map((p) => (
                  <li key={p.id}>
                    <ArticleCard post={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {top.length > 0 && (
            <section className="mb-10" aria-labelledby="li-topic-posts-h">
              <h2 id="li-topic-posts-h" className={`${EYEBROW} mb-3`}>
                Most engaging posts on {topic.label}
              </h2>
              <ul className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {top.map((p) => (
                  <li key={p.id}>
                    <ArticleCard post={p} compact />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topic.entries.length > 0 ? (
            <section aria-labelledby="li-topic-all-h">
              <h2 id="li-topic-all-h" className="font-display text-xl font-bold text-foreground mb-4">
                Everything on {topic.label} ({topic.entries.length})
              </h2>
              <LinkedInExplorer topicId={topic.id} />
              {topic.entries.length > 60 && (
                // Without JavaScript the cards stop at the newest 60: every entry is listed here as a link.
                <noscript>
                  <ol className="mt-6 space-y-1 font-mono text-[11px]">
                    {topic.entries.map((e) => (
                      <li key={e.key}>
                        <a href={entryPath(e)} className="underline text-foreground">{e.title}</a>{" "}
                        <span className="text-muted-foreground">({formatDay(e.date)})</span>
                      </li>
                    ))}
                  </ol>
                </noscript>
              )}
            </section>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">
              Nothing here right now. <a href={UNIVERSE_PATH} className="underline hover:text-foreground">Browse the whole Universe</a>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
