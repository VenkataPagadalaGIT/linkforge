import Link from "next/link";
import { HOME_SECTIONS } from "./aboutSections";

/**
 * Every section of /about as a button in a slow, endless row. Each one lands
 * on its section. The row is two copies of the same buttons; the second copy
 * is hidden from assistive technology and the tab order, so a keyboard meets
 * each section once. CSS alone moves it (app/globals.css), so it works before
 * scripts load and stops for anyone who prefers reduced motion.
 */
export default function AboutMarquee() {
  return (
    <nav
      aria-label="About me, section by section"
      className="about-marquee relative w-full overflow-hidden py-1 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
    >
      <ul className="about-marquee-track flex w-max">
        {[0, 1].map((copy) =>
          HOME_SECTIONS.map((s, i) => (
            <li key={`${copy}-${s.id}`} className="pr-3" aria-hidden={copy === 1 ? true : undefined}>
              <Link
                href={`/about#${s.id}`}
                tabIndex={copy === 1 ? -1 : undefined}
                className="group inline-flex items-center gap-3 border border-border bg-background/80 backdrop-blur-sm px-4 py-2.5 transition-colors hover:border-foreground/50 hover:bg-foreground/5"
              >
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-foreground whitespace-nowrap">{s.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{s.hint}</span>
                <span aria-hidden="true" className="font-mono text-xs text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground">
                  →
                </span>
              </Link>
            </li>
          )),
        )}
      </ul>
    </nav>
  );
}
