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
  refHref,
  REF_BASE,
  REF_COUNTS,
  INTERACTIVE_FOR,
  DEEP_DIVES,
  NEWS_FOR,
} from "@/data/learnReference";
import { learnTopicBySlug } from "@/data/learn";
import { aiUpdates } from "@/data/aiUpdates";
import { VIDEOS_FOR, GUIDES_FOR } from "@/data/encyclopediaResources";
import LearnShell, { type ShellGroup } from "@/components/learn/LearnShell";
import DeepDive from "@/components/learn/DeepDive";

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
  const title = `${c.concept} · AI Encyclopedia`;
  return {
    title: { absolute: title.length <= 60 ? title : c.concept },
    description: metaDescription(c.description),
    alternates: { canonical: `${REF_BASE}/${c.id}` },
    openGraph: {
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      url: `${REF_BASE}/${c.id}`,
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
      .map((c) => ({ href: refHref(c.id), label: c.concept })),
  }));

function PrevNext({ id, bottom = false }: { id: string; bottom?: boolean }) {
  const { prev, next } = refPrevNext(id);
  return (
    <div className={`flex items-center justify-between gap-3 ${bottom ? "mt-10 pt-6 border-t border-border" : "mb-8"}`}>
      {prev ? (
        <Link
          href={refHref(prev.id)}
          rel="prev"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors max-w-[45%] truncate"
        >
          ← {prev.concept}
        </Link>
      ) : (
        <Link
          href={REF_BASE}
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Encyclopedia home
        </Link>
      )}
      {next ? (
        <Link
          href={refHref(next.id)}
          rel="next"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors max-w-[45%] truncate"
        >
          {next.concept} →
        </Link>
      ) : (
        <Link
          href="/notebook/ai"
          className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors"
        >
          The 18-week roadmap →
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
  const news = (NEWS_FOR[c.id] ?? [])
    .map((slug) => aiUpdates.find((u) => u.slug === slug))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));
  const dives = (DEEP_DIVES[c.id] ?? [])
    .map((slug) => learnTopicBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const prereqs = c.prerequisites
    .map((name) => ({ name, concept: refConceptByName(name) }))
    .filter((p) => p.concept);
  const dependents = refConcepts
    .filter((other) => other.prerequisites.some((p) => refConceptByName(p)?.id === c.id))
    .slice(0, 6);

  // Segmented resources: curated videos, brand guides, then the concept's
  // own curated list (minus anything already shown), plus deep-dive extras.
  const videos = VIDEOS_FOR[c.id] ?? [];
  const brandGuides = GUIDES_FOR[c.id] ?? [];
  const seen = new Set<string>([...videos.map((v) => v.url), ...brandGuides.map((g) => g.url)]);
  const isYt = (u: string) => u.includes("youtube.com") || u.includes("youtu.be");
  const more = [
    ...c.learnMore.map((r) => ({ title: r.title, url: r.url, note: "" })),
    ...dives.flatMap((d) => d.resources),
  ].filter((r) => {
    if (seen.has(r.url)) return false;
    if (isYt(r.url) && videos.length > 0 && videos.some((v) => v.url === r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: c.concept,
        description: c.description,
        url: `${SITE_URL}${REF_BASE}/${c.id}`,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: "The AI Encyclopedia",
          url: `${SITE_URL}${REF_BASE}`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "AI Encyclopedia", item: `${SITE_URL}${REF_BASE}` },
          { "@type": "ListItem", position: 2, name: c.category },
          { "@type": "ListItem", position: 3, name: c.concept, item: `${SITE_URL}${REF_BASE}/${c.id}` },
        ],
      },
    ],
  };

  return (
    <LearnShell
      activeHref={refHref(c.id)}
      groups={groups()}
      treeLabel={`Encyclopedia · ${REF_COUNTS.concepts} concepts`}
      homeHref={REF_BASE}
      homeLabel="Encyclopedia home"
      crossLink={{ href: "/notebook/ai", label: "← AI Notebook hub" }}
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
                    href={refHref(p.concept!.id)}
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

        {news.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              In the news
            </p>
            <ul className="space-y-2">
              {news.map((n) => (
                <li key={n.slug}>
                  <Link
                    href={`/ai-updates/${n.slug}`}
                    className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                  >
                    {n.title}
                  </Link>
                  <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">
                    {n.company} · {n.date}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The full fact-checked read lives right here on the concept. */}
        {dives.map((d) => (
          <DeepDive key={d.slug} topic={d} />
        ))}

        {videos.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              Videos
            </p>
            <div className="space-y-2.5">
              {videos.map((v) => (
                <div key={v.url}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                  >
                    ▶ {v.title} ↗
                  </a>
                  <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">{v.channel} · YouTube</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brandGuides.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              Guides and articles
            </p>
            <div className="space-y-2.5">
              {brandGuides.map((g) => (
                <div key={g.url}>
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                  >
                    {g.title} ↗
                  </a>
                  <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">{g.brand}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {more.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              Courses, papers, and more
            </p>
            <div className="space-y-2">
              {more.map((r) => (
                <div key={r.url}>
                  {r.url.startsWith("/") ? (
                    <Link
                      href={r.url}
                      className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                    >
                      {r.title}
                    </Link>
                  ) : (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-foreground/85 hover:text-foreground underline decoration-border hover:decoration-foreground/60 transition-colors"
                    >
                      {r.title} ↗
                    </a>
                  )}
                  {r.note && <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{r.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {dependents.length > 0 && (
          <div className="my-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              This unlocks
            </p>
            <ul className="space-y-1.5">
              {dependents.map((d) => (
                <li key={d.id}>
                  <Link
                    href={refHref(d.id)}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {d.concept} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <PrevNext id={c.id} bottom />
      </article>
    </LearnShell>
  );
}
