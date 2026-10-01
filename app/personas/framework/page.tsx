import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FrameworkBrowser from "@/components/personas/framework/FrameworkBrowser";
import { jsonLdScript } from "@/lib/jsonld";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  FRAMEWORK_COUNTS,
  FRAMEWORK_FAMILIES,
  FRAMEWORK_RULES,
  FRAMEWORK_TAGLINE,
  FRAMEWORK_VERSION,
} from "@/data/personaFramework";
import { withSeoOverrides } from "@/lib/seo-overrides";

export const dynamic = "force-static";

const PATH = "/personas/framework";
const TITLE = "Global Persona Framework";
const WORKBOOK = `${PATH}/Global_Persona_Classification_Framework.xlsx`;
const DESCRIPTION = `${FRAMEWORK_COUNTS.dimensions} persona dimensions in ${FRAMEWORK_COUNTS.families} families: people, households, interests, resources, behaviours and buying contexts. Each carries its definition and global rule, the follow-up question that makes it an input, the evidence that would support a value, and how the value must be handled. A classification library, not a measured segmentation.`;

const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: PATH,
    types: { "text/markdown": `${PATH}.md` },
  },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}${PATH}`,
    title: TITLE,
    description: DESCRIPTION,
  },
};
export const generateMetadata = withSeoOverrides("/personas/framework", metadata);

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "@id": `${SITE_URL}${PATH}#dataset`,
      name: TITLE,
      description: DESCRIPTION,
      version: FRAMEWORK_VERSION,
      url: `${SITE_URL}${PATH}`,
      creator: { "@id": `${SITE_URL}/#person` },
      isPartOf: { "@id": `${SITE_URL}/personas#page` },
      keywords: ["persona", "classification", "buyer journey", "audience research", "fan-out"],
      // The workbook is the source; the markdown is the derived edition.
      distribution: [
        { "@type": "DataDownload", encodingFormat: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", contentUrl: `${SITE_URL}${WORKBOOK}` },
        { "@type": "DataDownload", encodingFormat: "text/markdown", contentUrl: `${SITE_URL}${PATH}.md` },
      ],
      variableMeasured: FRAMEWORK_FAMILIES.map((f) => ({
        "@type": "PropertyValue",
        name: f.name,
        description: `${f.count} dimensions`,
        url: `${SITE_URL}${PATH}#${f.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": `${SITE_URL}${PATH}#families`,
      name: `${TITLE}: families`,
      hasDefinedTerm: FRAMEWORK_FAMILIES.map((f) => ({
        "@type": "DefinedTerm",
        termCode: f.id,
        name: f.name,
        url: `${SITE_URL}${PATH}#${f.slug}`,
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />

      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          className="mb-4"
          trail={[{ href: "/", label: "Home" }, { href: "/personas", label: "Personas" }, { label: TITLE }]}
        />
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-3">{TITLE}</h1>
        <p className="font-display text-xl sm:text-2xl text-foreground/85 mb-3 text-balance">{FRAMEWORK_TAGLINE}</p>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl mb-2">
          People, households, interests, resources, behaviours and buying contexts, as {FRAMEWORK_COUNTS.dimensions}{" "}
          dimensions you can filter, cite and extend. {FRAMEWORK_COUNTS.sourced} reference a named source;{" "}
          {FRAMEWORK_COUNTS.authored} are authored classifications with no population estimate attached. Every row
          states its rule, the question that turns it into an input, the evidence that would support a value, and how
          that value must be handled.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground mb-8 tabular-nums">
          Version {FRAMEWORK_VERSION} · {FRAMEWORK_COUNTS.families} families · {FRAMEWORK_COUNTS.dimensions} dimensions ·{" "}
          <a href={WORKBOOK} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
            Download the workbook
          </a>{" "}
          ·{" "}
          <a href={`${PATH}.md`} className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
            Markdown edition
          </a>
        </p>

        <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-8">
          Nobody reads 463 rows. To use the library, open the{" "}
          <Link href="/personas/builder" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
            Persona Builder
          </Link>
          : it asks you these questions along a path for your situation and composes a persona you can open in the journey.
          This page is the reference every answer links back to.
        </p>

        {/* The terms the library is used on, verbatim from the workbook. */}
        <section aria-labelledby="rules-h" className="border border-border/60 p-5 mb-10">
          <h2 id="rules-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Rules the library is used under
          </h2>
          <ul className="space-y-2 max-w-3xl">
            {FRAMEWORK_RULES.map((r) => {
              const [head, ...rest] = r.split(": ");
              return (
                <li key={head} className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground">{head}.</span> {rest.join(": ")}
                </li>
              );
            })}
          </ul>
        </section>

        <nav aria-labelledby="fam-h" className="mb-10">
          <h2 id="fam-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            {FRAMEWORK_COUNTS.families} families
          </h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            {FRAMEWORK_FAMILIES.map((f) => (
              <li key={f.id} className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums w-5 shrink-0">{f.id}</span>
                <a
                  href={`#${f.slug}`}
                  className="font-mono text-xs text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors py-0.5"
                >
                  {f.name}
                </a>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{f.count}</span>
              </li>
            ))}
          </ol>
        </nav>

        <FrameworkBrowser />

        <aside aria-labelledby="honesty-h" className="mt-14 border border-border/60 p-5">
          <h2 id="honesty-h" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            What this is, and what it is not
          </h2>
          <div className="space-y-2.5 max-w-3xl">
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">What this is:</span> a vocabulary for describing a person, a household
              or a buying situation from what they actually said, with the handling each value needs written next to
              it. Values are examples to extend, and every field accepts other, unknown, not applicable and prefer not
              to say.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground">What it is not:</span> a measurement of anyone. No row here carries a
              population estimate, and identity never determines behaviour or interests. Where a dimension follows a
              published reference, the reference is linked; where it is authored, it says so.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
              It is the vocabulary behind the{" "}
              <Link href="/personas/fanout-journey" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
                Persona Fanout Journey
              </Link>
              , whose six inputs and five stages cite the dimensions they come from. For audiences graded against
              published research, with sample sizes on every row, use{" "}
              <Link href="/personas" className="text-foreground underline decoration-border hover:decoration-foreground transition-colors">
                Audience Personas
              </Link>
              .
            </p>
          </div>
        </aside>

        <section aria-labelledby="rel-h" className="mt-14">
          <h2 id="rel-h" className="font-display text-xl font-bold text-foreground mb-4">
            Related
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 font-mono text-xs">
            <li>
              <Link href="/personas/builder" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Persona Builder: answer these questions and get a persona, not a list
              </Link>
            </li>
            <li>
              <Link href="/personas/fanout-journey" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Persona Fanout Journey: one query, every buyer, the whole journey
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
              <a href={WORKBOOK} className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                The workbook itself (.xlsx), the source this page is generated from
              </a>
            </li>
          </ul>
          <p className="font-mono text-[10px] text-muted-foreground mt-6">Version {FRAMEWORK_VERSION}.</p>
        </section>
      </div>
    </div>
  );
}
