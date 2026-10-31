"use client";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import { ArrowLeft, Briefcase, Building2, FileText, Mic, Network, Newspaper, Radio, User } from "lucide-react";
import SEO from "@/components/SEO";
import { HIGHLIGHT_CLASS } from "@/components/business/RichText";
import type { BusinessEventItem, BusinessNewsItem, BusinessSector } from "@/lib/business-graph";

export type NotebookArticle = { href: string; title: string; summary: string; kind: string; eventDate: string; company?: string };
export type NotebookCompany = { href: string; name: string; summary: string };
export type NotebookPerson = { href: string; name: string; role: string };

const tocSections = [
  { label: "Overview", id: "overview" },
  { label: "Notes", id: "earnings-calls" },
  { label: "Companies", id: "companies" },
  { label: "People", id: "people" },
  { label: "Company and market files", id: "company-files" },
  { label: "Business news", id: "business-news" },
  { label: "Event files", id: "event-files" },
];

const longDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

const BusinessNotebook = ({
  articles = [],
  companies = [],
  people = [],
  sectors = [],
  news = [],
  events = [],
}: {
  articles?: NotebookArticle[];
  companies?: NotebookCompany[];
  people?: NotebookPerson[];
  sectors?: BusinessSector[];
  news?: BusinessNewsItem[];
  events?: BusinessEventItem[];
}) => {
  const entries = sectors.reduce((n, s) => n + s.detailed.length + s.profiles.length, 0);
  const detailed = sectors.reduce((n, s) => n + s.detailed.length, 0);
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <SEO
        title="Business Notebook | AI Strategy & Frameworks | Venkata Pagadala"
        description="Strategic frameworks, case studies, and playbooks for building and scaling with AI: a living reference for founders, operators, and strategists."
        canonical="https://venkatapagadala.com/notebook/business"
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <Link
              to="/notebook"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={12} /> Back to Notebooks
            </Link>

            <div className="mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase size={18} className="text-muted-foreground/70" />
                <p className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-[0.3em]">
                  Business Notebook
                </p>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Business Notebook
              </h1>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Strategic frameworks, case studies, and playbooks for building and scaling with AI. A living reference for founders, operators, and strategists.
              </p>
            </div>
          </ScrollReveal>

          <section id="overview" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="border border-border p-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-muted-foreground/70" />
                  <h2 className="font-display text-xl font-bold text-foreground">Overview</h2>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  Notes from primary sources, starting with earnings calls: what companies tell investors, on the record, about AI and how it is changing their business. Each note links to the companies and the people in it, and every line carries its source.
                </p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  Below the notes sits the business side of the rest of the site: every company and market file in the AI Intelligence Graph, the AI Updates about deals and moves, and the event files.
                </p>
                <p className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <span className={`${HIGHLIGHT_CLASS} inline-block w-6 h-3`} aria-hidden="true" />
                  Green marks what a company said about AI and digital.
                </p>
              </div>
            </ScrollReveal>
          </section>

          <section id="earnings-calls" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-4">
                <Mic size={14} className="text-muted-foreground/70" />
                <h2 className="font-display text-xl font-bold text-foreground">Notes: earnings calls and filings</h2>
              </div>
              <div className="space-y-4">
                {articles.map((a) => (
                  <Link key={a.href} to={a.href} className="block border border-border p-6 hover:border-foreground/40 transition-colors">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      {a.kind}{a.company ? ` · ${a.company}` : ""} · {longDate(a.eventDate)}
                    </p>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">{a.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed">{a.summary}</p>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </section>

          <section id="companies" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={14} className="text-muted-foreground/70" />
                <h2 className="font-display text-xl font-bold text-foreground">Companies</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {companies.map((c) => (
                  <Link key={c.href} to={c.href} className="block border border-border p-5 hover:border-foreground/40 transition-colors">
                    <h3 className="font-display text-base font-bold text-foreground mb-1">{c.name}</h3>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{c.summary}</p>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </section>

          <section id="people" className="scroll-mt-28 mb-16">
            <ScrollReveal>
              <div className="flex items-center gap-2 mb-4">
                <User size={14} className="text-muted-foreground/70" />
                <h2 className="font-display text-xl font-bold text-foreground">People</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {people.map((p) => (
                  <Link key={p.href} to={p.href} className="block border border-border p-5 hover:border-foreground/40 transition-colors">
                    <h3 className="font-display text-base font-bold text-foreground mb-1">{p.name}</h3>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.role}</p>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* The business side of the site's other datasets (src/lib/business-graph.ts). Rendered on the server, so a
              crawler reaches every company file from here even with scripts off. */}
          {sectors.length > 0 && (
            <section id="company-files" className="scroll-mt-28 mb-16">
              <div className="flex items-center gap-2 mb-2">
                <Network size={14} className="text-muted-foreground/70" />
                <h2 className="font-display text-xl font-bold text-foreground">Company and market files</h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                Every company, market and money flow in the{" "}
                <Link href="/notebook/ai/graph" className="underline underline-offset-4 hover:text-foreground">AI Intelligence Graph</Link>, by sector:{" "}
                {entries} entries, {detailed} with a detailed file. Each opens its page in the graph, with its sources.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {sectors.map((sec) => (
                  <div key={sec.id} className="border border-border p-5">
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h3 className="font-display text-base font-bold text-foreground">{sec.title}</h3>
                      <span className="font-mono text-[10px] text-muted-foreground/80 whitespace-nowrap">
                        {sec.detailed.length + sec.profiles.length} · {sec.detailed.length} detailed
                      </span>
                    </div>
                    {sec.detailed.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sec.detailed.map((e) => (
                          <Link
                            key={e.href}
                            href={e.href}
                            className="font-mono text-[11px] border border-foreground/30 px-2 py-1 text-foreground hover:border-foreground transition-colors"
                          >
                            {e.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {sec.profiles.length > 0 && (
                      <details className={sec.detailed.length ? "mt-3" : ""}>
                        <summary className="font-mono text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                          {sec.profiles.length} more with a short profile
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {sec.profiles.map((e) => (
                            <Link
                              key={e.href}
                              href={e.href}
                              className="font-mono text-[11px] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                            >
                              {e.name}
                            </Link>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {news.length > 0 && (
            <section id="business-news" className="scroll-mt-28 mb-16">
              <div className="flex items-center gap-2 mb-2">
                <Newspaper size={14} className="text-muted-foreground/70" />
                <h2 className="font-display text-xl font-bold text-foreground">Business news</h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                Deals, acquisitions, partnerships and moves from{" "}
                <Link href="/ai-updates" className="underline underline-offset-4 hover:text-foreground">AI Updates</Link>, each with its primary sources.
              </p>
              <div className="space-y-3">
                {news.map((u) => (
                  <Link key={u.href} href={u.href} className="block border border-border p-5 hover:border-foreground/40 transition-colors">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                      {u.company} · {longDate(u.date)}
                    </p>
                    <h3 className="font-display text-base font-bold text-foreground">{u.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section id="event-files" className="scroll-mt-28 mb-16">
              <div className="flex items-center gap-2 mb-2">
                <Radio size={14} className="text-muted-foreground/70" />
                <h2 className="font-display text-xl font-bold text-foreground">Event files</h2>
              </div>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                One story read from every platform: what happened, the impact, the claims checked, and every source.
              </p>
              <div className="space-y-3">
                {events.map((e) => (
                  <Link key={e.href} href={e.href} className="block border border-border p-6 hover:border-foreground/40 transition-colors">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      Event file · updated {longDate(e.updatedAt.slice(0, 10))}
                    </p>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">{e.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed line-clamp-3">{e.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <PageSidebar
          sections={tocSections}
          shareTitle="Business Notebook"
        />
      </div>
    </div>
  );
};

export default BusinessNotebook;
