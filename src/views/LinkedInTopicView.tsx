import * as React from "react";
import ScrollReveal from "@/components/ScrollReveal";
import LinkedInExplorer from "@/components/linkedin/LinkedInExplorer";
import ArticleCard from "@/components/linkedin/ArticleCard";
import { mostEngaging, relatedTopics, topEntities, type LiItem, type LiPost } from "@/data/linkedinArchive";

interface Props {
  topic: { id: string; slug: string; label: string; blurb: string; items: LiItem[]; posts: LiPost[]; socialPosts: LiPost[] };
}

export default function LinkedInTopicView({ topic }: Props) {
  const related = relatedTopics(topic.id);
  const names = topEntities(topic.items);
  const videos = topic.items.filter((i) => i.kind === "video").length;
  const years = [...new Set(topic.items.map((i) => i.date.slice(0, 4)))].sort();

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <a href="/linkedin" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
            ← LinkedIn archive
          </a>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 mb-3">
            LinkedIn archive · Topic{years.length ? ` · ${years[0]}` : ""}
            {years.length > 1 ? ` to ${years[years.length - 1]}` : ""}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-4">{topic.label}</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-2">{topic.blurb}</p>
          <p className="font-mono text-xs text-muted-foreground/70 mb-8">
            {topic.items.length} item{topic.items.length === 1 ? "" : "s"}
            {videos ? `, ${videos} video${videos === 1 ? "" : "s"}` : ""}
            {topic.posts.length ? `, ${topic.posts.length} article${topic.posts.length === 1 ? "" : "s"}` : ""}
            {topic.socialPosts.length ? `, ${topic.socialPosts.length} post${topic.socialPosts.length === 1 ? "" : "s"}` : ""}.
          </p>
        </ScrollReveal>

        {(related.length > 0 || names.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {related.length > 0 && (
              <section aria-labelledby="li-related-h">
                <h2 id="li-related-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                  Related topics
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {related.map((r) => (
                    <a key={r.id} href={`/linkedin/topics/${r.slug}`} className="font-mono text-[11px] px-2 py-1 border border-border text-foreground hover:border-foreground/50">
                      {r.label} <span className="text-muted-foreground/70">· {r.shared}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
            {names.length > 0 && (
              <section aria-labelledby="li-names-h">
                <h2 id="li-names-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                  Names that recur here
                </h2>
                <p className="font-mono text-[11px] text-foreground/90 leading-relaxed">
                  {names.map((n) => `${n.name} (${n.count})`).join(" · ")}
                </p>
              </section>
            )}
          </div>
        )}

        {topic.posts.length > 0 && (
          <section className="mb-10" aria-labelledby="li-topic-articles-h">
            <h2 id="li-topic-articles-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              Articles on {topic.label} ({topic.posts.length})
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topic.posts.map((p) => (
                <li key={p.id}>
                  <ArticleCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {topic.socialPosts.length > 0 && (
          <section className="mb-10" aria-labelledby="li-topic-posts-h">
            <h2 id="li-topic-posts-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              Posts on {topic.label} ({topic.socialPosts.length}), most engaging first
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mostEngaging(topic.socialPosts, 8).map((p) => (
                <li key={p.id}>
                  <ArticleCard post={p} compact />
                </li>
              ))}
            </ul>
            {topic.socialPosts.length > 8 && (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                and {topic.socialPosts.length - 8} more in <a href="/linkedin/posts" className="underline hover:text-foreground">all posts</a>.
              </p>
            )}
          </section>
        )}

        {topic.items.length > 0 ? (
          <LinkedInExplorer topicId={topic.id} />
        ) : topic.posts.length + topic.socialPosts.length > 0 ? null : (
          <p className="font-mono text-sm text-muted-foreground">
            Nothing here right now. <a href="/linkedin" className="underline hover:text-foreground">Browse the whole archive</a>.
          </p>
        )}
      </div>
    </div>
  );
}
