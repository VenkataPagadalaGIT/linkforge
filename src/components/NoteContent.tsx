"use client";
import * as React from "react";
import { Globe2, NotebookText, Hash } from "lucide-react";
import { Link } from "@/lib/router-shim";

/** Word/character utilities */
const wordCount = (text: string) =>
  (text.trim().match(/\b[\w'-]+\b/g) || []).length;

const readingMinutes = (n: number) => Math.max(1, Math.round(n / 230));

/** Split note into paragraphs (double-newline) for readable rendering */
const toParagraphs = (text: string): string[] => {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
};

/** Render a single paragraph; preserve single-line breaks within it */
const Paragraph: React.FC<{ children: string }> = ({ children }) => (
  <p className="text-foreground/85 leading-[1.85] mb-5 whitespace-pre-wrap">
    {children}
  </p>
);

export interface NoteContentProps {
  text: string;
  takeaways?: string[];
  isPublic?: boolean;
  status?: string;
  updatedAt?: string;
  /** Conference attribution — shown in header so reader always knows context */
  attribution?: {
    conferenceName: string;
    conferenceEdition?: string;
    conferenceDate: string;
    sessionTitle: string;
    sessionUrl: string;
  };
  /** When true, truncates to ~200 words with a "Read full" CTA pointing at attribution.sessionUrl */
  preview?: boolean;
  className?: string;
  testId?: string;
}

/**
 * Renders long-form note content (200–3000+ words) with:
 *  - Conference + session attribution header (linked)
 *  - Reading typography: serif-feel mono, 1.85 line-height, paragraph spacing, max-w-prose
 *  - Word count + reading time
 *  - Optional preview mode: first ~200 words + "Read full →"
 */
const NoteContent: React.FC<NoteContentProps> = ({
  text,
  takeaways = [],
  isPublic,
  status,
  updatedAt,
  attribution,
  preview = false,
  className = "",
  testId,
}) => {
  const wc = wordCount(text);
  const rt = readingMinutes(wc);

  // Preview truncation — first ~200 words while preserving paragraph boundaries
  const PREVIEW_WORDS = 200;
  let bodyText = text;
  let truncated = false;
  if (preview && wc > PREVIEW_WORDS) {
    truncated = true;
    let count = 0;
    const out: string[] = [];
    for (const para of toParagraphs(text)) {
      const w = wordCount(para);
      if (count + w <= PREVIEW_WORDS) {
        out.push(para);
        count += w;
      } else {
        const remaining = PREVIEW_WORDS - count;
        if (remaining > 30) {
          const tokens = para.split(/\s+/);
          out.push(tokens.slice(0, remaining).join(" ") + "…");
        }
        break;
      }
    }
    bodyText = out.join("\n\n");
  }

  const paragraphs = toParagraphs(bodyText);

  return (
    <article
      className={`max-w-[68ch] ${className}`}
      data-testid={testId}
    >
      {/* Header — context badge */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {isPublic ? (
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-emerald-400/45 text-emerald-300/95 bg-emerald-400/[0.04] px-2 py-1 inline-flex items-center gap-1.5">
            <Globe2 size={10} /> Field notes
          </span>
        ) : (
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-border text-muted-foreground/70 px-2 py-1 inline-flex items-center gap-1.5">
            <NotebookText size={10} /> Private notes
          </span>
        )}
        {status && (
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-foreground/30 text-foreground/80 px-2 py-1">
            {status}
          </span>
        )}
        <span className="font-mono text-[10px] text-muted-foreground/60 ml-auto">
          {wc.toLocaleString()} words · {rt} min read
        </span>
      </div>

      {/* Conference attribution — critical when speakers appear at many events */}
      {attribution && (
        <Link
          to={attribution.sessionUrl}
          className="block mb-5 group"
          data-testid={`${testId}-attribution`}
        >
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground/45 mb-1">
            From
          </p>
          <p className="font-display text-base text-foreground/90 group-hover:text-glow transition-all">
            {attribution.conferenceName} {attribution.conferenceEdition || ""} ·{" "}
            <span className="text-foreground/70">{attribution.sessionTitle}</span>
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
            {attribution.conferenceDate}
            {updatedAt && (
              <span className="text-muted-foreground/40">
                {" "}· last updated {new Date(updatedAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </Link>
      )}

      {/* Body — readable long-form */}
      <div className="font-mono text-[14px] note-body" data-testid={`${testId}-body`}>
        {paragraphs.map((p, i) => (
          <Paragraph key={i}>{p}</Paragraph>
        ))}
      </div>

      {/* Truncation CTA */}
      {truncated && attribution && (
        <Link
          to={attribution.sessionUrl}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border border-foreground/40 bg-foreground/[0.03] text-foreground px-3 py-2 hover:border-foreground/70 hover:bg-foreground/[0.07] transition-all"
          data-testid={`${testId}-read-full`}
        >
          Read full notes →
        </Link>
      )}

      {/* Takeaways */}
      {takeaways.length > 0 && !truncated && (
        <div className="mt-7 pt-5 border-t border-border/60">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/55 mb-3 inline-flex items-center gap-1.5">
            <Hash size={10} /> Takeaways
          </p>
          <ul className="space-y-2">
            {takeaways.map((t, i) => (
              <li
                key={i}
                className="font-mono text-[12px] text-foreground/85 leading-relaxed pl-5 relative"
              >
                <span className="absolute left-0 text-foreground/40">→</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};

export default NoteContent;
