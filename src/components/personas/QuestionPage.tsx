import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageNav from "./PageNav";
import QuestionDirectory from "./QuestionDirectory";
import Disclaimer from "./Disclaimer";
import ClaimComparison from "./ClaimComparison";
import TwoQuestions from "./TwoQuestions";
import { COMPOSITION_SETS } from "@/data/platformComposition";
import SourceChain from "./SourceChain";
import { competitorFor } from "@/data/competitorPages";
import { countsFor, MEASURES_META } from "@/data/platformCounts";
import { QUESTIONS, questionBySlug } from "@/data/corpusQuestions";
import { CORPUS_SEGMENTS, corpusDoc, corpusMetric, ageInMonths, freshness, FRESHNESS_META, CORPUS_GENERATED } from "@/data/corpus";

const DIM_LABEL: Record<string, string> = {
  gender: "Gender", age: "Age", race: "Race and ethnicity", income: "Household income",
  education: "Education", community: "Community type", party: "Party",
};

export default function QuestionPage({ slug }: { slug: string }) {
  const q = questionBySlug(slug);
  if (!q) notFound();

  const metric = corpusMetric(q.metric);
  if (!metric) notFound();
  const cells = metric.values[q.subject] ?? {};
  const national = cells[""] ?? 0;
  const doc = corpusDoc(metric.document);
  const comp = COMPOSITION_SETS[q.subject];
  const rival = competitorFor(q.subject);
  const counts = q.slug.startsWith("how-many") ? countsFor(q.subject) : [];
  const fresh = doc ? freshness(doc) : null;
  const months = doc ? ageInMonths(doc) : null;

  // Every published cut, grouped by dimension, sorted by how far it sits from
  // the national figure: the spread is the story, not the ordering of labels.
  const byDim = ["age", "race", "income", "education", "gender", "community", "party"]
    .map((d) => ({
      dim: d,
      rows: CORPUS_SEGMENTS.filter((s) => s.dimension === d && cells[s.slug] !== undefined).map(
        (s) => ({ ...s, value: cells[s.slug], delta: cells[s.slug] - national }),
      ),
    }))
    .filter((g) => g.rows.length > 0);

  // "among asian" reads as a typo. Race and party labels are proper nouns and
  // need the noun they modify; age and income bands read fine on their own.
  const phrase = (r: { label: string; dimension: string }) =>
    r.dimension === "race" || r.dimension === "party"
      ? `${r.label} adults`
      : r.dimension === "age"
        ? `those aged ${r.label.replace(" and over", " and over")}`
        : r.label.toLowerCase();

  const all = byDim.flatMap((g) => g.rows);
  const top = [...all].sort((a, b) => b.value - a.value)[0];
  const bottom = [...all].sort((a, b) => a.value - b.value)[0];

  /**
   * FAQPage answers the query; Dataset is what an answer engine cites.
   *
   * These pages are a measured figure with a sample, a field period and a
   * named creator, which is exactly what Dataset describes. Emitting it means
   * the page can be picked up as a source rather than as prose that happens to
   * contain a number, and it carries the things a citation needs: who
   * measured it, when, how many people, and the margin of error.
   */
  const answerText = `${national}% of US adults. ${
    top ? `Highest: ${top.label} at ${top.value}%.` : ""
  } ${bottom ? `Lowest: ${bottom.label} at ${bottom.value}%.` : ""} Source: ${
    doc?.title ?? "Pew Research Center"
  }${doc?.sampleSize ? `, n=${doc.sampleSize.toLocaleString()}` : ""}${
    doc?.moe ? `, margin of error ±${doc.moe} points` : ""
  }. Fieldwork ${doc?.fieldStart ?? ""} to ${doc?.fieldEnd ?? doc?.published ?? ""}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: q.title,
        acceptedAnswer: { "@type": "Answer", text: answerText },
      },
    ],
  };

  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE_URL}/personas/${q.slug}#dataset`,
    name: q.title,
    description: q.description,
    url: `${SITE_URL}/personas/${q.slug}`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    creator: {
      "@type": "Person",
      name: "Venkata Pagadala",
      url: SITE_URL,
    },
    ...(doc?.published ? { datePublished: doc.published } : {}),
    ...(doc?.fieldStart && doc?.fieldEnd
      ? { temporalCoverage: `${doc.fieldStart}/${doc.fieldEnd}` }
      : {}),
    spatialCoverage: { "@type": "Place", name: "United States" },
    measurementTechnique:
      "Address-based probability sample, weighted to the US adult population",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: metric.label,
        description: metric.definition,
        value: national,
        unitText: "percent of US adults",
      },
      ...all.map((r) => ({
        "@type": "PropertyValue",
        name: `${metric.label}: ${r.label}`,
        value: r.value,
        unitText: "percent",
        description: `n=${r.n ?? "unknown"}, margin of error ±${r.moe ?? "unknown"} percentage points`,
      })),
    ],
    ...(doc
      ? {
          citation: {
            "@type": "CreativeWork",
            name: doc.title,
            url: doc.url,
          },
          includedInDataCatalog: {
            "@type": "DataCatalog",
            name: "Audience Personas corpus",
            url: `${SITE_URL}/personas/data`,
          },
        }
      : {}),
  };

  const max = Math.max(national, ...all.map((r) => r.value), 1);

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetLd) }} />
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,190px)] lg:gap-10">
        <div className="min-w-0">
        <Breadcrumbs
          className="mb-4"
          trail={[
            { href: "/", label: "Home" },
            { href: "/personas", label: "Personas" },
            { label: q.short },
          ]}
        />
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-4">
          {q.title}
        </h1>

        {/* Freshness, before the number rather than in a footnote. A figure
            without a date is not a figure. */}
        {doc && fresh && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.2em] border px-1.5 py-0.5"
              style={{ borderColor: FRESHNESS_META[fresh].color, color: FRESHNESS_META[fresh].color }}
            >
              {FRESHNESS_META[fresh].label}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {doc.fieldStart && doc.fieldEnd ? (
                <>Collected {doc.fieldStart} to {doc.fieldEnd}</>
              ) : doc.published ? (
                <>Published {doc.published}</>
              ) : null}
              {months !== null ? ` · ${months} months old` : ""}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/90">
              Verified against the source {CORPUS_GENERATED}
            </span>
            {rival?.latestYear ? (
              <span className="font-mono text-[10px] text-muted-foreground/90">
                · the leading page for this query dates its freshest figure to{" "}
                {rival.latestPeriod || rival.latestYear}
              </span>
            ) : null}
          </div>
        )}

        {/* The answer, first line, no scrolling for it. */}
        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-3xl">
          <span className="text-foreground text-lg">{national}%</span> of US adults.{" "}
          {top && bottom && top.slug !== bottom.slug ? (
            <>
              It runs from <span className="text-foreground">{bottom.value}%</span> among{" "}
              {phrase(bottom)} to <span className="text-foreground">{top.value}%</span> among{" "}
              {phrase(top)}, a spread of {top.value - bottom.value} points.
            </>
          ) : null}{" "}
          {q.note}
        </p>

        {byDim.map((g) => (
          <section key={g.dim} className="mb-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              By {DIM_LABEL[g.dim].toLowerCase()}
            </h2>
            <div className="space-y-1.5">
              {g.rows.map((r) => (
                <div key={r.slug} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-muted-foreground w-36 shrink-0 truncate">
                    {r.label}
                  </span>
                  <span className="flex-1 h-2 bg-secondary/50">
                    <span
                      className="block h-full"
                      style={{ width: `${(r.value / max) * 100}%`, background: "var(--foreground)", opacity: 0.65 }}
                    />
                  </span>
                  <span className="font-mono text-xs text-foreground w-10 text-right tabular-nums shrink-0">
                    {r.value}%
                  </span>
                  <span
                    className="font-mono text-[10px] w-12 text-right tabular-nums shrink-0"
                    style={{ color: Math.abs(r.delta) < 3 ? undefined : r.delta > 0 ? "#10b981" : "#f59e0b" }}
                  >
                    {Math.abs(r.delta) < 3 ? "" : `${r.delta > 0 ? "+" : ""}${r.delta}`}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/80 w-20 text-right shrink-0">
                    n={r.n?.toLocaleString()} ±{r.moe}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Reported totals, and what each one is counting. */}
        {counts.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              The reported totals, and what they count
            </h2>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
              These are the numbers every page quotes. None of them count people, and they are not
              interchangeable with each other. What each one measures is stated on the row.
            </p>
            <div className="space-y-3">
              {counts.map((c) => (
                <div key={c.value + c.measures} className="border border-border/60 p-4">
                  <p className="font-mono text-sm text-foreground leading-tight">
                    <span className="text-xl font-bold">{c.value}</span>
                    <span className="text-muted-foreground"> · {c.measures} users</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/90 ml-2 border border-border px-1.5 py-0.5">
                      {c.scope === "us" ? "US" : "Global"}
                    </span>
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                    {MEASURES_META[c.measures]}
                  </p>
                  {c.caveat && (
                    <p className="font-mono text-[11px] text-foreground leading-relaxed mt-1.5">
                      {c.caveat}
                    </p>
                  )}
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-mono text-[10px] text-muted-foreground underline decoration-border hover:text-foreground transition-colors mt-1.5 inline-block"
                  >
                    {c.source}
                  </a>
                </div>
              ))}
            </div>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-4 border-l-2 border-border pl-4">
              There is no US user count on this page, deliberately. Turning the measured{" "}
              {national}% into a headcount needs the US adult population, and the sources that
              publish these totals do not publish that alongside them. Every page that gives you a
              US number has multiplied by a population figure it did not cite, or copied one from a
              page that did. The rate below is the part that was actually measured.
            </p>
          </section>
        )}

        {/* Where an ad platform also reports composition, show the two
            questions side by side. This is the confusion the ranking pages
            live inside, and none of them name it. */}
        {comp && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              The two numbers people mix up
            </h2>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
              Search this question and you get both kinds of answer with no warning that they are
              different kinds. Flip between them here and watch the ranking change.
            </p>
            <TwoQuestions
              platform={comp.platform}
              penetrationSource={doc?.title ?? "Pew Research Center"}
              penetrationUrl={doc?.url ?? "https://www.pewresearch.org/"}
              compositionSource={comp.reportedBy}
              compositionUrl={comp.reportedByUrl}
              bands={[
                ...comp.bands.map((b) => ({ label: b.label, composition: b.composition })),
                ...CORPUS_SEGMENTS.filter((s) => s.dimension === "age" && cells[s.slug] !== undefined).map(
                  (s) => ({
                    label: s.label,
                    penetration: cells[s.slug],
                    penetrationN: s.n ?? undefined,
                    penetrationMoe: s.moe ?? undefined,
                  }),
                ),
              ]}
            />
          </section>
        )}

        {/* What the leading page has that this one does not, said plainly. */}
        {comp && (
          <section className="mb-10 border border-border p-5">
            <h2 className="font-display text-lg font-bold text-foreground mb-2">
              What {comp.reportedBy.split(",")[0]} has that this page does not
            </h2>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
              Worth saying plainly rather than pretending the gap runs one way. These are real
              figures from {comp.platform}&apos;s own results and advertising material, they are
              things a survey of US adults cannot tell you, and they are global rather than US.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
              {comp.headline.map((h) => (
                <p key={h.claim} className="font-mono text-[11px] leading-relaxed">
                  <span className="text-foreground">{h.value}</span>
                  <span className="text-muted-foreground"> · {h.claim}</span>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-muted-foreground/90 underline decoration-border hover:text-foreground transition-colors"
                  >
                    {h.source}
                  </a>
                </p>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Reported by
            </p>
            <a
              href={comp.reportedByUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-mono text-[11px] text-foreground underline decoration-border hover:text-glow transition-all"
            >
              {comp.reportedBy}
            </a>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-3 mb-2">
              Which in turn cites
            </p>
            <ul className="space-y-1">
              {comp.originalSources.map((o) => (
                <li key={o.url}>
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
                  >
                    {o.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-3">
              Thirteen of the twenty-one outbound links on that page point at Snap&apos;s own
              properties: the ad platform, the newsroom, and investor relations. That is not a
              criticism of the page, it is the only place those numbers exist. It is a reason to
              know which question they answer.
            </p>
          </section>
        )}

        {/* Where the competing numbers actually come from. */}
        {rival && doc && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Where the other numbers come from
            </h2>
            <SourceChain
              page={rival}
              ourSource={doc.title}
              ourUrl={doc.url}
              ourSample={doc.sampleSize ?? 0}
              ourMoe={Number(doc.moe ?? 0)}
            />
          </section>
        )}

        {/* The differentiator: every page ranking for this question disagrees,
            and none of them explain why. */}
        {doc && (
          <section className="mb-10">
            <ClaimComparison
              subject={q.subject || q.metric}
              ours={{
                value: national,
                label: metric.label,
                sampleSize: doc.sampleSize ?? 0,
                moe: Number(doc.moe ?? 0),
                source: doc.title,
                url: doc.url,
              }}
            />
          </section>
        )}

        {/* Into the tool. */}
        <div className="border border-border p-5 mb-10">
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">
            This is one figure cut one way. The studio combines traits, shows the arithmetic behind
            any combination it estimates, and says plainly when nothing measures what you asked.
          </p>
          <Link
            href="/personas"
            className="inline-block border border-border px-4 py-2.5 font-mono text-xs text-foreground hover:border-foreground/50 hover:bg-foreground/5 transition-all"
          >
            Build an audience in the studio
          </Link>
        </div>

        {doc && (
          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-8">
            Source:{" "}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-border hover:text-glow transition-all"
            >
              {doc.title}
            </a>
            {doc.published ? `, published ${doc.published}` : ""}
            {doc.sampleSize ? `. Survey of ${doc.sampleSize.toLocaleString()} US adults` : ""}
            {doc.moe ? `, margin of error ±${doc.moe} points overall` : ""}. Subgroup margins are
            shown on each row. {metric.definition}
          </p>
        )}

        <Disclaimer className="mb-10" />

        {/* Every sibling question, not a truncated eight. These pages are
            each other's best internal links. */}
        <section aria-labelledby="rel-h">
          <h2 id="rel-h" className="font-display text-xl font-bold text-foreground mb-2">
            Every other question, answered
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">
            Same corpus, same discipline, one question each.{" "}
            <Link href="/personas" className="text-foreground underline decoration-border hover:text-glow transition-all">
              The studio
            </Link>{" "}
            answers any combination of them, and{" "}
            <Link href="/personas/data" className="text-foreground underline decoration-border hover:text-glow transition-all">
              the data page
            </Link>{" "}
            prints every cell.
          </p>
          <QuestionDirectory exclude={q.slug} />
        </section>
        </div>

        <aside className="hidden lg:block">
          <PageNav />
        </aside>
      </div>
    </div>
  );
}
