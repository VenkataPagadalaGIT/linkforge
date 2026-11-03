import type { ResearchPaper } from "@/data/research";
import { PAPER_COVERS } from "@/data/paperCovers";

/**
 * A paper's real first page, rendered from its PDF by
 * scripts/gen-paper-covers.py.
 *
 * It renders nothing unless two things are true: an image exists for the slug,
 * and a human has written the credit line that goes under it. Tying the image
 * to its attribution in one condition is deliberate. These are publishers'
 * pages, one of them under CC BY-NC-ND, and an uncredited reproduction is the
 * failure mode worth making structurally impossible rather than remembering.
 *
 * The figure is hidden from assistive technology because it is a picture of
 * text that is already on the page in real text, and every card carries
 * working links to the DOI and the publisher. A screen reader gains nothing
 * from a second, silent route to the same place.
 */
export default function PaperCover({
  paper,
  className = "",
  imgClassName = "",
}: {
  paper: ResearchPaper;
  className?: string;
  imgClassName?: string;
}) {
  const cover = paper.slug ? PAPER_COVERS[paper.slug] : undefined;
  if (!cover || !paper.coverCredit) return null;

  return (
    <figure className={`m-0 ${className}`}>
      <a
        href={paper.doiUrl ?? paper.url}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="group block overflow-hidden border border-border bg-card"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover.src}
          alt=""
          width={cover.width}
          height={cover.height}
          loading="lazy"
          decoding="async"
          className={`block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03] ${imgClassName}`}
        />
      </a>
      <figcaption className="font-mono text-[9px] text-muted-foreground mt-2 leading-relaxed">
        {paper.coverCredit}
      </figcaption>
    </figure>
  );
}
