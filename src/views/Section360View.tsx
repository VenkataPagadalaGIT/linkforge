import { Link } from "@/lib/router-shim";
import { getNode, LAYER_BY_ID, NODE_TYPE_META } from "@/data/aiOntology";
import { AI_360 } from "@/data/ai360";
import { logoUrl } from "@/data/aiLogos";
import { AdvisorsSection, AgreementsSection, FootprintSection, HiringSection, InvestorsSection, LegalSection, PeopleSection, SitesRead, TalentSection, TimelineSection } from "@/components/ai/Ai360";
import type { Section360, Section360Id } from "@/lib/ai360-sections";

/** One section of a company's 360 file on its own page: a focused title, the section, and links to the rest of the file. */
export default function Section360View({ id, section, sections }: { id: string; section: Section360Id; sections: Section360[] }) {
  const n = getNode(id)!;
  const f = AI_360[id]!;
  const layer = LAYER_BY_ID.get(n.layer)!;
  const s = sections.find((x) => x.id === section)!;
  const logo = logoUrl(id);
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Link to="/notebook/ai/map" className="hover:text-foreground">The AI Systems Map</Link>
          <span aria-hidden="true">›</span>
          <Link to={`/notebook/ai/map/${id}`} className="hover:text-foreground">{n.name}</Link>
          <span aria-hidden="true">›</span>
          <span className="text-foreground">{s.label}</span>
        </nav>

        <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="px-1.5 py-0.5 font-bold text-black" style={{ background: layer.color }}>
            L{layer.id} · {layer.short}
          </span>
          <span className="border border-border px-2 py-0.5 text-muted-foreground">{NODE_TYPE_META[n.type].label}</span>
          <span className="text-muted-foreground">360 file · {s.label}</span>
        </div>
        <div className="mb-3 flex items-center gap-3">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={44} height={44} className="h-11 w-11 shrink-0 bg-white object-contain p-1" />
          )}
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{s.title(n.name)}</h1>
        </div>
        <p className="mb-8 max-w-3xl font-mono text-sm leading-relaxed text-muted-foreground">{s.description(n.name, f)}</p>

        <nav aria-label="Sections of this file" className="mb-10 flex flex-wrap gap-1.5 font-mono text-[11px]">
          <Link to={`/notebook/ai/map/${id}`} className="border border-border px-2.5 py-1 text-muted-foreground hover:border-foreground/40 hover:text-foreground">
            Overview
          </Link>
          {sections.map((x) => (
            <Link
              key={x.id}
              to={`/notebook/ai/map/${id}/${x.id}`}
              aria-current={x.id === section ? "page" : undefined}
              className={`border px-2.5 py-1 ${x.id === section ? "border-foreground/60 text-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
            >
              {x.label}
            </Link>
          ))}
          <Link to={`/notebook/ai/graph?focus=${id}`} className="border border-border px-2.5 py-1 text-muted-foreground hover:border-foreground/40 hover:text-foreground">
            In the graph
          </Link>
        </nav>

        <div className="space-y-10">
          {section === "people" && (
            <>
              <PeopleSection ids={[id]} />
              <TalentSection id={id} />
              <FootprintSection id={id} />
            </>
          )}
          {section === "investors" && (
            <>
              <InvestorsSection id={id} />
              <AgreementsSection id={id} />
              <AdvisorsSection id={id} />
            </>
          )}
          {section === "legal" && <LegalSection ids={[id]} />}
          {section === "hiring" && <HiringSection id={id} />}
          {section === "timeline" && (
            <>
              <TimelineSection id={id} />
              <SitesRead id={id} />
            </>
          )}
        </div>

        <p className="mt-12 border-t border-border pt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
          Every figure on this page comes from a named document with the exact sentence it was taken from; open &ldquo;Exact text in the source&rdquo; under any line. People appear in public roles from the
          company&apos;s own filings and pages. Not investment advice.
        </p>
      </div>
    </div>
  );
}
