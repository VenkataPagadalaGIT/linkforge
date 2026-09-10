import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import PersonaProfile from "@/components/personas/PersonaProfile";
import PersonaAvatar from "@/components/personas/PersonaAvatar";
import Disclaimer from "@/components/personas/Disclaimer";
import QuestionDirectory from "@/components/personas/QuestionDirectory";
import QuestionPage from "@/components/personas/QuestionPage";
import { QUESTIONS, questionBySlug } from "@/data/corpusQuestions";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  GRADE_META,
  METHOD_LABEL,
  PERSONAS,
  PERSONAS_LAST_UPDATED,
  PERSONA_DO_NOT_ASSERT,
  evidenceById,
  personaBySlug,
  studyById,
} from "@/data/personas";

export const dynamic = "force-static";

type Params = { slug: string };

// Two kinds of page share this route: the evidence-graded personas, and one
// generated page per question the corpus can answer. Keeping them on the same
// segment avoids a second dynamic route at the same level, which Next.js will
// not resolve, and keeps every /personas/<thing> URL shaped the same.
export function generateStaticParams() {
  return [
    ...PERSONAS.map((p) => ({ slug: p.slug })),
    ...QUESTIONS.map((q) => ({ slug: q.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const q = questionBySlug(params.slug);
  if (q) {
    return {
      title: q.title,
      description: q.description,
      alternates: { canonical: `/personas/${q.slug}` },
      openGraph: {
        type: "article",
        url: `${SITE_URL}/personas/${q.slug}`,
        title: q.title,
        description: q.description,
      },
    };
  }
  const p = personaBySlug(params.slug);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };
  const title = `${p.name}: an evidence-graded persona`;
  const description = `${p.segment}. Every trait labelled measured, derived or inferred, with the study behind it.`;
  return {
    title,
    description,
    alternates: { canonical: `/personas/${p.slug}` },
    openGraph: {
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      type: "article",
      url: `${SITE_URL}/personas/${p.slug}`,
      title,
      description,
    },
  };
}

export default function Page({ params }: { params: Params }) {
  // Question pages render from the generated corpus; personas fall through.
  if (questionBySlug(params.slug)) return <QuestionPage slug={params.slug} />;

  const persona = personaBySlug(params.slug);
  if (!persona) notFound();

  const usedStudyIds = Array.from(
    new Set(
      persona.traits
        .flatMap((t) => t.evidenceIds ?? [])
        .map((eid) => evidenceById(eid)?.studyId)
        .filter(Boolean) as string[],
    ),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}/personas/${persona.slug}#article`,
    headline: `${persona.name}: an evidence-graded persona`,
    description: persona.summary,
    dateModified: PERSONAS_LAST_UPDATED,
    author: { "@type": "Person", name: "Venkata Pagadala", url: `${SITE_URL}/about` },
    citation: usedStudyIds.map((id) => studyById(id)?.url).filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <Link
          href="/personas"
          className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All personas
        </Link>

        <Breadcrumbs
          className="mb-4"
          trail={[
            { href: "/", label: "Home" },
            { href: "/personas", label: "Personas" },
            { label: persona.name },
          ]}
        />
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 mt-1" style={{ lineHeight: 0 }}>
            <PersonaAvatar gender="men" age="30-49" size={64} accent="var(--foreground)" />
          </div>
          <div className="min-w-0">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-3 mt-6">
            {persona.name}
          </h1>
          </div>
        </div>
        <p className="font-mono text-sm text-muted-foreground mb-2">{persona.segment}</p>
        <p className="font-mono text-[11px] text-muted-foreground/70 mb-8">
          Last updated {PERSONAS_LAST_UPDATED}
        </p>

        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12 max-w-3xl">
          {persona.summary}
        </p>

        {/* Data first. The written persona is the interesting part, but it
            is still prose and nobody wants to read their way to a chart. */}
        <section aria-labelledby="mp-h" className="mb-14">
          <h2 id="mp-h" className="font-display text-2xl font-bold text-foreground mb-2">
            What the data says about this group
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5 max-w-3xl">
            Every bar is a published cell for one of this persona&apos;s stated segments: a man,
            30 to 49. The written persona follows underneath, and it has to survive these
            numbers rather than sit above them unchallenged.
          </p>
          <PersonaProfile
            segmentIds={["men", "30-49"]}
            studioNote="This persona fixes two traits: a man, 30 to 49. The studio takes any combination, estimates what nobody published, and prints the arithmetic behind every estimate."
          />
        </section>

        {/* Traits, grouped so the unsupported ones are impossible to miss */}
        {(["measured", "derived", "inferred"] as const).map((grade) => {
          const traits = persona.traits.filter((t) => t.grade === grade);
          if (!traits.length) return null;
          const meta = GRADE_META[grade];
          return (
            <section key={grade} aria-labelledby={`${grade}-h`} className="mb-10">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: meta.dot }}
                  aria-hidden="true"
                />
                <h2 id={`${grade}-h`} className="font-display text-xl font-bold text-foreground">
                  {meta.label}
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {traits.length}
                </span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground/80 mb-4">{meta.note}</p>

              <div className="space-y-3">
                {traits.map((t) => (
                  <div
                    key={t.label}
                    className={`border p-5 ${
                      grade === "inferred" ? "border-border bg-secondary/20" : "border-border/60"
                    }`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                      {t.label}
                    </p>
                    <p className="font-mono text-sm text-foreground leading-relaxed mb-2">{t.value}</p>
                    {t.rationale && (
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-2">
                        {t.rationale}
                      </p>
                    )}
                    {t.evidenceIds && t.evidenceIds.length > 0 && (
                      <ul className="space-y-1 mt-3 pt-3 border-t border-border/40">
                        {t.evidenceIds.map((eid) => {
                          const e = evidenceById(eid);
                          const s = e ? studyById(e.studyId) : undefined;
                          if (!e || !s) return null;
                          return (
                            <li
                              key={eid}
                              className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed"
                            >
                              {e.metric}, {e.segment}: <span className="text-foreground">{e.value}</span>{" "}
                              ·{" "}
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-border hover:text-foreground transition-colors"
                              >
                                {s.publisher}
                              </a>{" "}
                              ({METHOD_LABEL[s.method]}
                              {s.sampleSize ? `, n=${s.sampleSize.toLocaleString()}` : ""})
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Open questions */}
        <section aria-labelledby="q-h" className="mb-10 border border-border p-6">
          <h2 id="q-h" className="font-display text-xl font-bold text-foreground mb-3">
            What would upgrade the inferred traits
          </h2>
          <ul className="space-y-2">
            {persona.openQuestions.map((q, i) => (
              <li key={i} className="font-mono text-xs text-muted-foreground leading-relaxed">
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* Do not assert */}
        <section aria-labelledby="d-h" className="mb-10">
          <h2 id="d-h" className="font-display text-xl font-bold text-foreground mb-3">
            What this persona will not claim
          </h2>
          <ul className="space-y-2">
            {PERSONA_DO_NOT_ASSERT.map((d, i) => (
              <li key={i} className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed">
                {d}
              </li>
            ))}
          </ul>
        </section>

        <Link
          href="/personas"
          className="font-mono text-xs text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
        >
          The method and the studies behind this
        </Link>
        <Disclaimer className="mb-14" />

        <section aria-labelledby="qd2-h" className="mb-14">
          <h2 id="qd2-h" className="font-display text-2xl font-bold text-foreground mb-4">
            Every question, answered on its own page
          </h2>
          <QuestionDirectory />
        </section>

      </div>
    </div>
  );
}
