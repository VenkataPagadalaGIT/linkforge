import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import ClaimComparison from "./ClaimComparison";
import TwoQuestions from "./TwoQuestions";
import { COMPOSITION_SETS } from "@/data/platformComposition";
import SourceChain from "./SourceChain";
import { competitorFor } from "@/data/competitorPages";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: q.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${national}% of US adults. ${top ? `Highest: ${top.label} at ${top.value}%.` : ""} ${
            bottom ? `Lowest: ${bottom.label} at ${bottom.value}%.` : ""
          } Source: ${doc?.title ?? "Pew Research Center"}${
            doc?.sampleSize ? `, n=${doc.sampleSize.toLocaleString()}` : ""
          }.`,
        },
      },
    ],
  };

  const max = Math.max(national, ...all.map((r) => r.value), 1);

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          className="mb-4"
          trail={[
            { href: "/", label: "Home" },
            { href: "/personas", label: "Personas" },
            { href: "/personas/data", label: "The data" },
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

        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Related questions
          </h2>
          <ul className="space-y-2 font-mono text-xs">
            {QUESTIONS.filter((x) => x.slug !== q.slug)
              .slice(0, 8)
              .map((x) => (
                <li key={x.slug}>
                  <Link
                    href={`/personas/${x.slug}`}
                    className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
                  >
                    {x.title}
                  </Link>
                </li>
              ))}
            <li>
              <Link
                href="/personas/data"
                className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
              >
                Every measured figure, one surface
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
