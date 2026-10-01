"use client";
import { Link } from "@/lib/router-shim";
import type { GuideAuthor } from "@/data/guides";

/**
 * AuthorCard — proper E-E-A-T byline.
 *
 * Renders as a structured author block with name, title, organization, and a
 * one-line credibility statement. The visible card matches the JSON-LD Person
 * the article schema points to via `author.url`, so machine and human readers
 * see the same provenance.
 *
 * Uses a `rel="author"` link and `vcard`-style markup hooks so SERP rich-result
 * pipelines (Google, Bing) and AI answer engines (ChatGPT, Perplexity, Gemini)
 * can attribute the article cleanly.
 */

interface Props {
  author: GuideAuthor;
  dateModified: string;
  readingTime: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Parse YYYY-MM-DD as a calendar date, not a UTC instant, so the displayed
// day matches the data regardless of the viewer's timezone.
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const AuthorCard = ({ author, dateModified, readingTime }: Props) => {
  const initials = author.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className="flex items-start gap-4 border-y border-border py-5 mb-10 max-w-3xl"
      itemScope
      itemType="https://schema.org/Person"
    >
      <Link
        to={author.url}
        rel="author"
        aria-label={`About ${author.name}`}
        className="shrink-0 w-12 h-12 border border-border bg-card/60 flex items-center justify-center font-mono text-sm text-foreground hover:border-foreground/60 hover:text-foreground transition-colors"
      >
        {initials}
      </Link>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1">
          Written by
        </p>
        <p className="font-mono text-sm text-foreground">
          <Link
            to={author.url}
            rel="author"
            className="font-semibold hover:underline underline-offset-4"
            itemProp="name"
          >
            {author.name}
          </Link>
          <span className="text-muted-foreground">
            {" — "}
            <span itemProp="jobTitle">{author.title}</span> at{" "}
            <span itemProp="affiliation">{author.org}</span>
          </span>
        </p>
        <p
          className="font-mono text-xs text-muted-foreground/80 leading-relaxed mt-1"
          itemProp="description"
        >
          {author.bio}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/40 mt-2">
          {readingTime}
          <span aria-hidden="true"> · </span>
          Updated{" "}
          <time dateTime={dateModified} itemProp="dateModified">
            {formatDate(dateModified)}
          </time>
        </p>
      </div>
    </div>
  );
};

export default AuthorCard;
