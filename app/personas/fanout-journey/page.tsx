import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FanoutJourney from "@/components/personas/fanout/FanoutJourney";
import { jsonLdScript } from "@/lib/jsonld";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  DIMENSIONS,
  FANOUT_LAST_UPDATED,
  FANOUT_PATH,
  FANOUT_TITLE,
  PRESETS,
  STAGES,
  TEMPLATES,
  fanoutAll,
  presetById,
} from "@/data/fanout";

export const dynamic = "force-static";

const DESCRIPTION =
  "One starting query, fanned out by persona scenario and by every stage of the buyer's journey, from first intent to ownership. Works for any purchase. Every question explains which explicit inputs produced it and how to validate it.";

export const metadata: Metadata = {
  // The layout appends " · Venkata Pagadala"; with the tagline in here the
  // tag ran to 84 characters and search engines cut it at about 65. The
  // tagline is the first line under the h1 instead, where it is not truncated.
  title: FANOUT_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: FANOUT_PATH },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}${FANOUT_PATH}`,
    title: FANOUT_TITLE,
    description: DESCRIPTION,
  },
};

/** Authored once; rendered as HTML and emitted as FAQPage from the same list. */
const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the Persona Fanout Journey do?",
    a: "It takes one broad starting query, asks what would need to be known before it could be answered, and fans it out into persona scenarios and buying stages. Each scenario at each stage produces four questions of different types, following the framework's P376 question types, and every question shows which explicit inputs produced it, what content format tends to answer it, and how to validate it. In the matrix you mark each question have or gap and export the gaps.",
  },
  {
    q: "Does it work for anything other than cars?",
    a: "Yes. The templates are written against inputs any purchase has, a budget cap, a primary need, a hard constraint, timing, location and experience, rather than against a domain. Buying a car, a phone and choosing a phone plan ship as presets, and the product label can be set to anything.",
  },
  {
    q: "Are these real search queries?",
    a: "No. They are illustrative hypotheses generated from templates and the scenario's stated inputs. Nothing here is measured search demand, observed customer behaviour or an AI engine's internal queries. Validate them against your own query logs, site search and customer conversations before writing to them.",
  },
  {
    q: "Why does experience not change the question?",
    a: "Experience is kept as context, the way age was in the original demo: it changes what needs explaining, never what someone wants. A first-time buyer and an experienced one with the same budget and need get the same question. Inferring a preference from a trait like that is how personas become fiction.",
  },
  {
    q: "How is this different from the Audience Personas tool?",
    a: "Audience Personas is built only on published research and grades every trait measured, derived or inferred against a named study. This is a planning model: its scenarios are explicit inputs a team types in, not survey results. The two are linked and deliberately kept apart.",
  },
];

export default function Page() {
  const example = presetById("automotive");
  const family = example.scenarios.find((s) => s.id === "family") ?? example.scenarios[0];
  const exampleQuestions = STAGES.map((st) => ({
    stage: st,
    questions: fanoutAll([family], example).filter((q) => q.stageId === st.id),
  }));
  const perScenario = STAGES.reduce((n, st) => n + TEMPLATES[st.id].length, 0);
  const total = PRESETS[0].scenarios.length * perScenario;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${SITE_URL}${FANOUT_PATH}#app`,
      name: FANOUT_TITLE,
      url: `${SITE_URL}${FANOUT_PATH}`,
      description: DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any modern browser",
      browserRequirements: "Works without JavaScript for reading; the interactive fan-out needs it.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": `${SITE_URL}/#person` },
      dateModified: FANOUT_LAST_UPDATED,
      featureList: [
        "Fan-out map: seed, context, scenario, stage, questions",
        "Journey matrix: scenarios across, stages down, with have/gap marks and a gap-list export",
        "Context lab: the same question before and after one explicit input",
        "Editable scenario inputs with no inferred traits",
        "CSV and JSON export",
      ],
      isPartOf: { "@id": `${SITE_URL}/personas#page` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}${FANOUT_PATH}#faq`,
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          className="mb-4"
          trail={[{ href: "/", label: "Home" }, { href: "/personas", label: "Personas" }, { label: FANOUT_TITLE }]}
        />
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-3">
          {FANOUT_TITLE}
        </h1>
        <p className="font-display text-xl sm:text-2xl text-foreground/85 mb-3 text-balance">
          One query. Different buyers. Different questions.
        </p>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-2">
          Start with a broad request, add what the buyer actually said, and watch it fan out by scenario and by
          every stage of the journey, from first intent to living with the thing afterwards. It works for any
          purchase. Every generated question can explain which inputs produced it and how to check it before
          anyone writes to it.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground mb-8 tabular-nums">
          {PRESETS.length - 1} ready-made domains · {PRESETS[0].scenarios.length} scenarios each · {STAGES.length} stages ·{" "}
          {total} questions per domain · illustrative hypotheses, not measured demand
        </p>

        <FanoutJourney />

        {/* Server-rendered substance: readable with scripts blocked, and what a crawler indexes. */}
        <section aria-labelledby="stages-h" className="mt-16">
          <h2 id="stages-h" className="font-display text-2xl font-bold text-foreground mb-2">
            The whole journey, not just the transaction
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-5">
            Most journey models stop at the purchase, which is why most content does too. The fifth stage is where
            renewal, churn, support demand and the next purchase are decided, and it has the least competition for
            the answers. The journey also loops: an ownership question is often the next discovery.
          </p>
          <div className="overflow-x-auto border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Stage", "Goal", "Question types (P376)", "Formats that tend to answer them", "How to validate"].map((h) => (
                    <th key={h} scope="col" className="text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-3 py-2 align-bottom">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAGES.map((st) => (
                  <tr key={st.id} className="border-t border-border/40 align-top">
                    <th scope="row" className="text-left px-3 py-2.5">
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums mr-1.5">{String(st.index).padStart(2, "0")}</span>
                      <span className="font-display text-sm font-bold text-foreground">{st.name}</span>
                    </th>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-foreground/85">{st.goal}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-foreground/85">{TEMPLATES[st.id].map((x) => x.qtype).join(" · ")}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{TEMPLATES[st.id].map((x) => x.format).join(" · ")}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground leading-relaxed">{st.validation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="inputs-h" className="mt-14">
          <h2 id="inputs-h" className="font-display text-2xl font-bold text-foreground mb-2">
            What the tool asks before it fans out
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-5">
            Six explicit inputs, the same for any purchase. Each one is an answer a person gives, never a trait read
            off a demographic, and each carries a note on what it may not imply.
          </p>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIMENSIONS.map((d) => (
              <div key={d.id} className="border border-border/60 p-4">
                <dt className="font-display text-sm font-bold text-foreground">{d.label}</dt>
                <dd className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-1">{d.note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="example-h" className="mt-14">
          <h2 id="example-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Worked example: {family.name.toLowerCase()}, buying a {example.product}
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-5">
            Starting query &ldquo;{example.seed}&rdquo;. Stated need: {family.need}. Budget cap: $
            {family.budget.toLocaleString("en-US")}. Constraint: {family.constraint}. Timing: {family.timing}. Every
            question below is generated from those inputs and nothing else.
          </p>
          <div className="border border-border">
            {exampleQuestions.map(({ stage, questions }) => (
              <div key={stage.id} className="grid sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] border-t border-border/40 first:border-t-0">
                <div className="px-4 py-3 sm:border-r border-border/40">
                  <p className="font-display text-sm font-bold text-foreground">
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums mr-1.5">{String(stage.index).padStart(2, "0")}</span>
                    {stage.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{stage.goal}</p>
                </div>
                <ol className="px-4 py-3 space-y-1.5">
                  {questions.map((q) => (
                    <li key={q.id} className="font-mono text-[11px] text-foreground/85 leading-snug">
                      {q.question}
                      <span className="text-muted-foreground"> · {q.format}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <aside aria-labelledby="honesty-h" className="mt-14 border border-border/60 p-5">
          <h2 id="honesty-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            What this is, and what it is not
          </h2>
          <div className="space-y-2.5 max-w-3xl">
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">What this is:</span> a visual planning model built from explicit,
              editable scenario inputs. The scenarios are plausible starting points a team replaces with the people
              it actually serves. The questions are hypotheses about what those scenarios would ask.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">What it is not:</span> measured search demand, observed customer
              behaviour, or an AI engine&apos;s internal queries. Nothing here has a sample size, because nothing
              here was sampled.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">Experience is context, not a preference predictor.</span> Two buyers
              with the same budget, need and constraint get the same questions whether one is a first-timer or not.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              For audiences graded against published research, with sample sizes and margins of error on every
              row, use{" "}
              <Link href="/personas" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
                Audience Personas
              </Link>
              . The two tools are linked and deliberately kept apart.
            </p>
          </div>
        </aside>

        <section aria-labelledby="faq-h" className="mt-14">
          <h2 id="faq-h" className="font-display text-2xl font-bold text-foreground mb-5">
            Questions people ask about this tool
          </h2>
          <dl className="space-y-5 max-w-3xl">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-display text-base font-bold text-foreground">{f.q}</dt>
                <dd className="font-mono text-xs text-muted-foreground leading-relaxed mt-1.5">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="rel-h" className="mt-14">
          <h2 id="rel-h" className="font-display text-xl font-bold text-foreground mb-4">
            Related
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 font-mono text-xs">
            <li>
              <Link href="/personas/builder" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Persona Builder: compose a persona from the framework and open it here
              </Link>
            </li>
            <li>
              <Link href="/personas" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Audience Personas: build any audience and see where it is, graded by evidence
              </Link>
            </li>
            <li>
              <Link href="/personas/data" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Every figure and source behind the measured personas
              </Link>
            </li>
            <li>
              <Link href="/research-and-talks" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                The brightonSEO talk this method comes from
              </Link>
            </li>
            <li>
              <Link href="/personas/us-dad-30-49-three-row-suv" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                A worked persona, graded trait by trait
              </Link>
            </li>
          </ul>
          <p className="font-mono text-[10px] text-muted-foreground mt-6">Last updated {FANOUT_LAST_UPDATED}.</p>
        </section>
      </div>
    </div>
  );
}
