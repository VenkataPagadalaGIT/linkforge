"use client";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import { Link } from "@/lib/router-shim";
import { ArrowLeft, Briefcase, Building2, FileText, Mic, User } from "lucide-react";
import SEO from "@/components/SEO";
import { HIGHLIGHT_CLASS } from "@/components/business/RichText";

export type NotebookArticle = { href: string; title: string; summary: string; kind: string; eventDate: string; company?: string };
export type NotebookCompany = { href: string; name: string; summary: string };
export type NotebookPerson = { href: string; name: string; role: string };

const tocSections = [
  { label: "Overview", id: "overview" },
  { label: "Earnings calls", id: "earnings-calls" },
  { label: "Companies", id: "companies" },
  { label: "People", id: "people" },
];

const longDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

const BusinessNotebook = ({ articles = [], companies = [], people = [] }: { articles?: NotebookArticle[]; companies?: NotebookCompany[]; people?: NotebookPerson[] }) => {
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
                <h2 className="font-display text-xl font-bold text-foreground">Earnings calls</h2>
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
