/**
 * DealLogos: the two-company lockup at the top of an M&A story.
 *
 * Logos are the companies' OWN official brand assets, downloaded from their
 * press/brand pages (Stripe's logo kit, OpenRouter's /brand/v2 SVGs) and
 * served locally, so nothing hotlinks and nothing is redrawn by hand. Each
 * company ships a variant per background, so both themes get the version
 * its owner intended: swapped with CSS, no JavaScript, no flash.
 *
 * Editorial use only: these mark the companies a news story is about. They
 * are never used as our own branding, and never imply endorsement.
 */
export interface DealLogo {
  name: string;
  /** Official asset for light backgrounds (dark ink). */
  onLight: string;
  /** Official asset for dark backgrounds (light ink). */
  onDark: string;
  /** Where the asset came from, shown as the credit line. */
  source: string;
  height?: number;
}

export default function DealLogos({
  left,
  right,
  connector = "acquires",
}: {
  left: DealLogo;
  right: DealLogo;
  connector?: string;
}) {
  const Mark = ({ logo }: { logo: DealLogo }) => (
    <span className="inline-flex items-center" style={{ height: logo.height ?? 30 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.onLight}
        alt={`${logo.name} logo`}
        style={{ height: logo.height ?? 30 }}
        className="w-auto block dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.onDark}
        alt=""
        aria-hidden="true"
        style={{ height: logo.height ?? 30 }}
        className="w-auto hidden dark:block"
      />
    </span>
  );

  return (
    <figure className="border border-border bg-card/30 px-6 py-7 mb-8">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
        <Mark logo={left} />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
          {connector}
        </span>
        <Mark logo={right} />
      </div>
      <figcaption className="font-mono text-[10px] text-muted-foreground/70 text-center mt-5 leading-relaxed">
        Logos: {left.source}; {right.source}. Shown for editorial identification of the companies
        in this story; no affiliation or endorsement implied.
      </figcaption>
    </figure>
  );
}
