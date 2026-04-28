"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Globe2, NotebookText, Hash } from "lucide-react";
import { Link } from "@/lib/router-shim";

/** Word/character utilities */
const wordCount = (text: string) =>
  (text.trim().match(/\b[\w'-]+\b/g) || []).length;

const readingMinutes = (n: number) => Math.max(1, Math.round(n / 230));

// ===== URL → embed detection =====
const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
const TWITTER_RE = /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/;
const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|webp|avif)(?:\?.*)?$/i;

interface EmbedKind {
  type: "youtube" | "vimeo" | "tweet" | "image" | null;
  id?: string;
  url?: string;
}

const detectEmbed = (raw: string): EmbedKind => {
  const url = raw.trim();
  let m;
  if ((m = url.match(YOUTUBE_RE))) return { type: "youtube", id: m[1] };
  if ((m = url.match(VIMEO_RE))) return { type: "vimeo", id: m[1] };
  if ((m = url.match(TWITTER_RE))) return { type: "tweet", id: m[1], url };
  if (IMAGE_EXT_RE.test(url) && url.startsWith("http")) return { type: "image", url };
  return { type: null };
};

const Embed: React.FC<{ kind: EmbedKind }> = ({ kind }) => {
  if (kind.type === "youtube") {
    return (
      <div className="my-6 border border-border aspect-video relative overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${kind.id}`}
          title="YouTube video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  if (kind.type === "vimeo") {
    return (
      <div className="my-6 border border-border aspect-video relative overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${kind.id}`}
          title="Vimeo video"
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  if (kind.type === "tweet") {
    // Lightweight: link card. (Full tweet embed needs Twitter's oEmbed JS — heavy.)
    return (
      <a
        href={kind.url}
        target="_blank"
        rel="noopener noreferrer"
        className="my-6 block border border-border p-4 hover:border-foreground/40 transition-colors"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
          X / Twitter post
        </p>
        <p className="font-mono text-[12px] text-foreground/80 break-all">{kind.url}</p>
      </a>
    );
  }
  if (kind.type === "image") {
    return (
      <figure className="my-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...optimizedImgProps(kind.url || "")}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full border border-border"
        />
      </figure>
    );
  }
  return null;
};

// =============================================================
// Image optimization helper — routes external markdown images through
// a public image CDN (wsrv.nl) so we don't ship 4 MB raw slide JPEGs
// to mobile readers. Effects:
//   • Resizes the source (3-5 MB raw slide JPEGs → ~50-200 KB WebP)
//   • Edge-cached for 1 year (Cache-Control: public, max-age=31536000)
//   • Auto-serves WebP / AVIF
//   • Generates a responsive srcSet so mobile gets ~640w, not 1920w
// Same-origin and relative URLs pass through untouched (already cached).
// wsrv.nl is a free, widely-used FOSS image proxy run by Andries Hiemstra.
// =============================================================
const IMG_CDN_WIDTHS = [640, 828, 1080, 1920];

const optimizedImgProps = (src: string) => {
  if (!src || !src.startsWith("http")) {
    return { src };
  }
  // Skip URLs already routed through the optimizer (idempotent).
  if (src.startsWith("https://wsrv.nl/")) {
    return { src };
  }
  const enc = encodeURIComponent(src);
  const url = (w: number) =>
    `https://wsrv.nl/?url=${enc}&w=${w}&q=70&output=webp`;
  return {
    src: url(1080),
    srcSet: IMG_CDN_WIDTHS.map((w) => `${url(w)} ${w}w`).join(", "),
    sizes: "(max-width: 768px) 100vw, 768px",
  };
};

// Pre-process the markdown body: any line that is JUST a recognized URL → replace with a placeholder we can render later.
// But ReactMarkdown handles this elegantly — we override the `p` and `a` components and detect bare-URL paragraphs.

// ===== Custom markdown components =====
const mdComponents = {
  h1: (props: React.ComponentProps<"h1">) => (
    <h2 className="font-display text-2xl font-bold text-foreground mt-9 mb-4 leading-tight" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h3 className="font-display text-xl font-bold text-foreground mt-8 mb-3 leading-tight" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h4 className="font-display text-lg font-bold text-foreground mt-6 mb-2 leading-tight" {...props} />
  ),
  p: (props: React.ComponentProps<"p"> & { children?: React.ReactNode }) => {
    // Filter out whitespace-only text nodes that react-markdown sometimes
    // leaves between block elements (e.g., the newline after `![alt](url)`).
    const children = React.Children.toArray(props.children).filter(
      (c) => !(typeof c === "string" && c.trim() === "")
    );

    // CRITICAL: never wrap block-level media in <p>. The browser auto-closes
    // the <p> when it sees a <figure> or <iframe>, which corrupts layout —
    // most visibly on mobile, where the misclosed paragraph swallowed the
    // remainder of the note (mobile-readers saw blank below "Abstract").
    if (children.length === 1 && React.isValidElement(children[0])) {
      const childType = (children[0] as React.ReactElement).type;
      const isBlockMedia =
        childType === "figure" ||
        childType === "img" ||
        childType === "iframe" ||
        childType === "div" ||
        // A custom function component (e.g., this file's own `img` handler,
        // which renders a <figure>). Safe because none of our components
        // render true inline-only output for a single image child.
        typeof childType === "function";
      if (isBlockMedia) {
        return <>{props.children}</>;
      }
    }

    // If the only child is text matching a single URL → render as embed
    if (children.length === 1 && typeof children[0] === "string") {
      const txt = (children[0] as string).trim();
      const k = detectEmbed(txt);
      if (k.type) return <Embed kind={k} />;
    }
    // Single anchor whose text equals href and matches an embed
    if (
      children.length === 1 &&
      React.isValidElement(children[0]) &&
      (children[0] as React.ReactElement<{ href?: string }>).props?.href
    ) {
      const a = children[0] as React.ReactElement<{ href?: string; children?: React.ReactNode }>;
      const k = detectEmbed(a.props.href || "");
      if (k.type) return <Embed kind={k} />;
    }
    return (
      <p className="text-foreground/85 leading-[1.85] mb-5" {...props} />
    );
  },
  a: (props: React.ComponentProps<"a">) => (
    <a
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors"
      {...props}
    />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="text-foreground font-bold" {...props} />
  ),
  em: (props: React.ComponentProps<"em">) => (
    <em className="text-foreground/90 italic" {...props} />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="my-6 border-l-2 border-foreground/40 pl-5 py-1 text-foreground/85 italic"
      {...props}
    />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="my-4 space-y-1.5 list-none pl-0" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="my-4 space-y-1.5 list-decimal pl-5 marker:text-muted-foreground/50" {...props} />
  ),
  li: (props: React.ComponentProps<"li"> & { children?: React.ReactNode }) => (
    <li
      className="text-foreground/85 leading-[1.7] pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-foreground/35"
      {...props}
    />
  ),
  code: ({
    inline,
    ...props
  }: React.ComponentProps<"code"> & { inline?: boolean }) => {
    if (inline) {
      return (
        <code
          className="font-mono text-[12px] bg-foreground/[0.06] text-foreground/90 px-1.5 py-0.5 border border-border/60"
          {...props}
        />
      );
    }
    return <code className="font-mono text-[12.5px] text-foreground/90" {...props} />;
  },
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      className="my-5 border border-border bg-foreground/[0.03] p-4 overflow-x-auto text-[12.5px] leading-[1.7]"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-border/50" />,
  img: (props: React.ComponentProps<"img">) => {
    const optimized = optimizedImgProps(props.src || "");
    return (
      <figure className="my-6">
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          loading="lazy"
          decoding="async"
          className="w-full border border-border"
          {...props}
          {...optimized}
        />
        {props.alt && (
          <figcaption className="mt-2 font-mono text-[10px] text-muted-foreground/60">
            {props.alt}
          </figcaption>
        )}
      </figure>
    );
  },
  table: (props: React.ComponentProps<"table">) => (
    <div className="my-6 overflow-x-auto border border-border">
      <table className="w-full text-[12.5px]" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th
      className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 text-left p-3 border-b border-border bg-foreground/[0.02]"
      {...props}
    />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td className="p-3 border-b border-border/50 text-foreground/85 leading-[1.7]" {...props} />
  ),
};

export interface NoteContentProps {
  text: string;
  takeaways?: string[];
  isPublic?: boolean;
  status?: string;
  updatedAt?: string;
  attribution?: {
    conferenceName: string;
    conferenceEdition?: string;
    conferenceDate: string;
    sessionTitle: string;
    sessionUrl: string;
  };
  preview?: boolean;
  className?: string;
  testId?: string;
}

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
    const paras = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
    for (const para of paras) {
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

  return (
    <article
      className={`max-w-[68ch] ${className}`}
      data-testid={testId}
    >
      {/* Header */}
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

      {/* Markdown body */}
      <div className="font-mono text-[14px] note-body" data-testid={`${testId}-body`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={mdComponents as never}
        >
          {bodyText}
        </ReactMarkdown>
      </div>

      {truncated && attribution && (
        <Link
          to={attribution.sessionUrl}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border border-foreground/40 bg-foreground/[0.03] text-foreground px-3 py-2 hover:border-foreground/70 hover:bg-foreground/[0.07] transition-all"
          data-testid={`${testId}-read-full`}
        >
          Read full notes →
        </Link>
      )}

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
