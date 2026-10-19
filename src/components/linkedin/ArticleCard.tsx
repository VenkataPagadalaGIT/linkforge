import * as React from "react";
import { formatDay, postPath, readingMinutes, thumbUrl, type LiPost } from "@/data/linkedinArchive";

/** A link card for one article (used on the index, topic pages and related lists). */
export default function ArticleCard({ post, compact = false }: { post: LiPost; compact?: boolean }) {
  return (
    <a href={postPath(post)} className="group block h-full border border-border hover:border-foreground/50 transition-colors" data-testid={`linkedin-article-${post.id}`}>
      {post.cover && (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbUrl({ idx: post.cover })} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        </div>
      )}
      <div className="p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
          <time dateTime={post.date}>{formatDay(post.date.slice(0, 10))}</time> · {readingMinutes(post.words)} min read
        </p>
        <p className={`font-display font-bold text-foreground leading-snug ${compact ? "text-sm" : "text-base"} mb-1`}>{post.title}</p>
        {!compact && <p className="font-mono text-[11px] leading-relaxed text-muted-foreground line-clamp-3">{post.excerpt}</p>}
      </div>
    </a>
  );
}

