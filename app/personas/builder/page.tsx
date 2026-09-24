import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PersonaBuilder from "@/components/personas/builder/PersonaBuilder";
import { jsonLdScript } from "@/lib/jsonld";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { BUILDER_PATHS, BUILDER_TITLE, EVIDENCE_STATUSES, NOT_INFERRED, VALIDATION_METHODS } from "@/data/builder";
import { FRAMEWORK_COUNTS, FRAMEWORK_VERSION, frameworkById } from "@/data/personaFramework";

export const dynamic = "force-static";

const PATH = "/personas/builder";
const DESCRIPTION =
  "Build a persona by answering the Global Persona Framework's own follow-up questions, grading each answer's evidence as you go. Get a composite brief with no invented biography, then open it straight in the Persona Fanout Journey with every input pre-filled.";

export const metadata: Metadata = {
  title: BUILDER_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}${PATH}`,
    title: BUILDER_TITLE,
    description: DESCRIPTION,
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the Persona Builder do?",
    a: "It asks you the follow-up questions the Global Persona Framework attaches to each of its dimensions, along a starter path for a consumer purchase, a B2B buyer or an audience. Each answer carries an evidence status. The result is a composite persona brief in the framework's own format, which you can open in the Persona Fanout Journey, copy, or export.",
  },
  {
    q: "Why does it not give the persona a name or a backstory?",
    a: "Because the framework forbids it. P460, composite persona description, says: do not invent a stereotypical name, motive or biography to fill gaps. A persona here is the set of things that were actually stated, each with how it is known, and nothing else.",
  },
  {
    q: "What is the evidence status on every answer?",
    a: "P445 in the framework. Self-reported, observed with permission, measured aggregate, derived, estimated, hypothesis or unknown. They are different kinds of evidence, not a quality ranking, and the brief prints them next to every value so nobody later mistakes a guess for a finding. New answers default to hypothesis.",
  },
  {
    q: "Do I have to answer everything?",
    a: "No, and the framework says you should not. P451, collection necessity: a large taxonomy is not a requirement to collect every field. Answer what the task needs. The interview guide export lists the questions you skipped, with the evidence each would need, for when you talk to real people.",
  },
  {
    q: "How does this connect to the Fanout Journey?",
    a: "One click. Your stated budget, need, constraint, timing, location and purchase occasion become the journey's six inputs, and any extra context you gave rides along. The journey then fans your persona out across every stage from Discover to Own. Nothing is inferred on the way across.",
  },
];

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${SITE_URL}${PATH}#app`,
      name: BUILDER_TITLE,
      url: `${SITE_URL}${PATH}`,
      description: DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any modern browser",
      browserRequirements: "Works without JavaScript for reading; the builder itself needs it.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": `${SITE_URL}/#person` },
      isBasedOn: { "@id": `${SITE_URL}/personas/framework#dataset` },
      isPartOf: { "@id": `${SITE_URL}/personas#page` },
      featureList: [
        "Three starter paths drawn from the framework: consumer purchase, B2B buyer, audience",
        "Every answer graded with a framework evidence status",
        "Composite persona brief in the framework's P460 format",
        "One-click hand-off into the Persona Fanout Journey",
        "Exports: brief, JSON, interview guide, validation plan",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}${PATH}#faq`,
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          className="mb-4"
          trail={[{ href: "/", label: "Home" }, { href: "/personas", label: "Personas" }, { label: BUILDER_TITLE }]}
        />
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-3">{BUILDER_TITLE}</h1>
        <p className="font-display text-xl sm:text-2xl text-foreground/85 mb-3 text-balance">
          Answer the questions. Grade the evidence. Open the journey.
        </p>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-2">
          The{" "}
          <Link href="/personas/framework" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
            Global Persona Framework
          </Link>{" "}
          attaches a follow-up question to each of its {FRAMEWORK_COUNTS.dimensions} dimensions. This asks you the ones
          your situation needs, records how each answer is known, and composes a persona from what was actually
          said: no invented name, no biography, no trait guessed from another. Then it hands the persona to the{" "}
          <Link href="/personas/fanout-journey" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
            Fanout Journey
          </Link>{" "}
          with every input already filled.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground mb-8 tabular-nums">
          {BUILDER_PATHS.length} starter paths · {EVIDENCE_STATUSES.length} evidence statuses · framework v. {FRAMEWORK_VERSION} · edits save
          only in this browser
        </p>

        <PersonaBuilder />

        {/* Server-rendered substance: the paths and their questions, readable with scripts off. */}
        <section aria-labelledby="paths-h" className="mt-16">
          <h2 id="paths-h" className="font-display text-2xl font-bold text-foreground mb-2">
            What each path asks
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-5">
            Each path is a curated set of framework dimensions, chosen for one kind of situation. The questions are the
            framework&apos;s own. Any dimension can be added from the full library, and none has to be answered.
          </p>
          <div className="grid lg:grid-cols-3 gap-4">
            {BUILDER_PATHS.map((path) => (
              <div key={path.id} className="border border-border/60 p-4">
                <h3 className="font-display text-base font-bold text-foreground">{path.label}</h3>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-1 mb-3">{path.blurb}</p>
                <ol className="space-y-1.5">
                  {path.dimensionIds.map((id) => {
                    const d = frameworkById(id);
                    if (!d) return null;
                    return (
                      <li key={id} className="font-mono text-[11px] leading-snug">
                        <Link href={`/personas/framework#${d.id}`} className="text-muted-foreground/80 tabular-nums hover:text-foreground transition-colors">
                          {d.id}
                        </Link>{" "}
                        <span className="text-foreground/85">{d.ask}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ev-h" className="mt-14">
          <h2 id="ev-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Every answer says how it is known
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-4">
            The framework&apos;s P445 evidence statuses, which the brief prints beside every value. They are kinds of
            evidence, not a ranking. A new answer starts as a hypothesis until you say otherwise.
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {EVIDENCE_STATUSES.map((e) => (
              <li key={e} className="font-mono text-[10px] text-foreground/85 border border-border px-2 py-0.5">
                {e}
              </li>
            ))}
          </ul>
        </section>

        <aside aria-labelledby="honesty-h" className="mt-14 border border-border/60 p-5">
          <h2 id="honesty-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            What this is, and what it is not
          </h2>
          <div className="space-y-2.5 max-w-3xl">
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">What this is:</span> a way to write down what a buyer or an audience
              actually said, in a shared vocabulary, with the evidence for each item beside it. The record type is
              stated (a fictional scenario unless you say it is a self-report), so a composed persona is never
              mistaken for a measured population.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">What it is not:</span> a generator of people. It will not name the
              persona, give it a life story, or fill a gap with a plausible guess. The framework&apos;s inference
              restrictions apply throughout: {NOT_INFERRED.map((n) => n.toLowerCase()).join("; ")}.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">Before anyone builds on it,</span> validate the actual combination.
              The framework&apos;s own methods, exported as a checklist: {VALIDATION_METHODS.join(", ").toLowerCase()}.
              Independent marginal statistics do not establish a joint persona.
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
              <Link href="/personas/fanout-journey" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Persona Fanout Journey: where a built persona goes next
              </Link>
            </li>
            <li>
              <Link href="/personas/framework" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Global Persona Framework: every dimension, rule and source
              </Link>
            </li>
            <li>
              <Link href="/personas" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Audience Personas: measured reach, graded by evidence
              </Link>
            </li>
            <li>
              <Link href="/personas/data" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Every figure and source behind the measured personas
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
