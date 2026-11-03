import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * The role cards on /about: one card per hat (speaker, researcher, and so
 * on), each with a picture or a typographic panel, two numbers and two ways
 * in. Server-rendered; nothing here needs scripts.
 */

export interface RoleAction {
  label: string;
  href: string;
  primary?: boolean;
}

const btnBase =
  "inline-flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-wider uppercase px-3 py-2 transition-colors";
export const btnPrimarySm = `${btnBase} bg-foreground text-background hover:opacity-90`;
export const btnSecondarySm = `${btnBase} border border-border text-foreground hover:border-foreground/40 hover:bg-foreground/5`;

/** A faint grid in the border colour, for the typographic panels. */
export const gridBg: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, hsl(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.55) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

export function RoleActionLink({ a }: { a: RoleAction }) {
  const cls = a.primary ? btnPrimarySm : btnSecondarySm;
  if (a.href.startsWith("/") || a.href.startsWith("#")) {
    return (
      <Link href={a.href} className={cls}>
        {a.label}
      </Link>
    );
  }
  return (
    <a href={a.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {a.label} <ArrowUpRight size={11} aria-hidden="true" />
    </a>
  );
}

/** A 16:9 picture that fills its card. Decorative: the card's title says what it is. */
export function CardPhoto({ src, position = "center" }: { src: string; position?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={640}
      height={360}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: position }}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  );
}

export default function RoleCard({
  label,
  title,
  media,
  children,
  stats,
  actions,
}: {
  label: string;
  title: string;
  media: ReactNode;
  children: ReactNode;
  stats: [string, string][];
  actions: RoleAction[];
}) {
  return (
    <article className="border border-border bg-background flex flex-col border-glow-hover">
      <div className="relative aspect-video overflow-hidden border-b border-border bg-card">{media}</div>
      <div className="p-5 flex flex-col flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{label}</p>
        <h3 className="font-display text-lg font-bold text-foreground leading-snug text-balance">{title}</h3>
        <div className="font-mono text-xs text-muted-foreground leading-relaxed mt-2">{children}</div>
        <dl className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
          {stats.map(([v, l]) => (
            <div key={l} className="flex flex-col-reverse">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 leading-snug">{l}</dt>
              <dd className="font-display text-xl font-bold text-foreground tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 mt-auto pt-5">
          {actions.map((a) => (
            <RoleActionLink key={a.href} a={a} />
          ))}
        </div>
      </div>
    </article>
  );
}
