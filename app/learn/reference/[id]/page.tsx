import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { ENCYCLOPEDIA_CATEGORIES } from "@/data/aiEncyclopedia";
import {
  refConcepts,
  refConceptById,
  refConceptByName,
  refPrevNext,
  refCategoryMeta,
  INTERACTIVE_FOR,
  TUTORIAL_FOR_CATEGORY,
  REF_COUNTS,
} from "@/data/learnReference";
import LearnShell, { type ShellGroup } from "@/components/learn/LearnShell";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return refConcepts.map((c) => ({ id: c.id }));
}

const metaDescription = (s: string) => {
  if (s.length <= 160) return s;
  const cut = s.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const c = refConceptById(params.id);
  if (!c) return {};
  const title = `${c.concept} · AI Reference`;
  return {
    title: { absolute: title.length <= 60 ? title : c.concept },
    description: metaDescription(c.description),
    alternates: { canonical: `/learn/reference/${c.id}` },
    openGraph: {
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      url: `/learn/reference/${c.id}`,
      title: c.concept,
    },
  };
}

const groups = (): ShellGroup[] =>
  ENCYCLOPEDIA_CATEGORIES.map((cat) => ({
    title: cat.label,
    color: cat.color,
    items: refConcepts
      .filter((c) => c.category === cat.label)
      .map((c) => ({ href: `/learn/reference/${c.id}`, label: c.concept })),
  }));

function PrevNext({ id, bottom = false }: { id: string; bottom?: boolean }) {
  const { prev, next } = refPrevNext(id);
  return (
    <div className={`flex items-center justify-between gap-3 ${bottom ? "mt-10 pt-6 border-t border-border" : "mb-8"}`}>
      {prev ? (
        <Link
          href={`/learn/reference/${prev.id}`}
          rel="prev"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors max-w-[45%] truncate"
        >
          ← {prev.concept}
        </Link>
      ) : (
        <Link
          href="/learn/reference"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Reference home
        </Link>
      )}
      {next ? (
        <Link
          href={`/learn/reference/${next.id}`}
          rel="next"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors max-w-[45%] truncate"
        >
          {next.concept} →
        </Link>
      ) : (
        <Link
          href="/learn"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors"
        >
          The AI Tutorial →
        </Link>
      )}
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  const c = refConceptById(params.id)!;
  const cat = refCategoryMeta(c.category);
  const idx = refConcepts.findIndex((x) => x.id === c.id);
  const interactive = INTERACTIVE_FOR[c.id];
  const tutorial = TUTORIAL_FOR_CATEGORY[c.category];
  const prereqs = c.prerequisites
    .map((name) => ({ name, concept: refConceptByName(name) }))
    .filter((p) => p.concept);
  const dependents = refConcepts
    .filter((other) => other.prerequisites.some((p) => refConceptByName(p)?.id === c.id))
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: c.concept,
        description: c.description,
        url: `${SITE_URL}/learn/reference/${c.id}`,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: "The AI Reference",
          url: `${SITE_URL}/learn/reference`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "AI Reference", item: `${SITE_URL}/learn/reference` },
          { "@type": "ListItem", position: 2, name: c.category },
          { "@type": "ListItem", position: 3, name: c.concept, item: `${SITE_URL}/learn/reference/${c.id}` },
        ],
      },
    ],
  };

  return (
    <LearnShell
      activeHref={`/learn/reference/${c.id}`}
      groups={groups()}
      treeLabel={`Reference · ${REF_COUNTS.concepts} concepts`}
      homeHref="/learn/reference"
      homeLabel="Reference home"
      crossLink={{ href: "/learn", label: "← The AI Tutorial" }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
          <span style={{ color: cat?.color }}>{c.category}</span>
          {" · "}{c.difficulty}{" · "}concept {idx + 1} of {REF_COUNTS.concepts}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow mb-4">
          <span aria-hidden="true" className="mr-2">{c.emoji}</span>
          {c.concept}
        </h1>

        <PrevNext id={c.id} />

        <p className="font-mono text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-6">
          {c.description}
        </p>

        {interactive && (
          <Link
            href={interactive.href}
            className="group block border border-emerald-400/40 bg-emerald-400/[0.05] p-5 my-6 hover:bg-emerald-400/10 transition-colors"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 mb-1.5">
              Interactive · 3D
            </p>
            <p className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-glow">
              {interactive.label} →
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{interactive.note}</p>
          </Link>
        )}

        {c.keyTerms.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              Key terms
            </p>
            <div className="flex flex-wrap gap-1.5">
              {c.keyTerms.map((k) => (
                <span key={k} className="font-mono text-[10px] px-2 py-1 border border-border text-muted-foreground">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {prereqs.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              Learn these first
            </p>
            <ul className="space-y-1.5">
              {prereqs.map((p) => (
                <li key={p.concept!.id}>
                  <Link
                    href={`/learn/reference/${p.concept!.id}`}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← {p.concept!.concept}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {c.realWorldApps && (
          <div className="border border-border bg-card/30 p-4 my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">
              Where you meet it in the real world
            </p>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">{c.realWorldApps}</p>
          </div>
        )}

        <div className="my-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
            Top free resources
          </p>
          <div className="space-y-2">
            {c.learnMore.map((r) => (
              <div key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                >
                  {r.title} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        {dependents.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              This unlocks
            </p>
            <ul className="space-y-1.5">
              {dependents.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/learn/reference/${d.id}`}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {d.concept} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tutorial && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              Narrative version
            </p>
            <Link href={tutorial.href} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
              {tutorial.label} →
            </Link>
          </div>
        )}

        <PrevNext id={c.id} bottom />
      </article>
    </LearnShell>
  );
}
