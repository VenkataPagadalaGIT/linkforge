"use client";
import { Link } from "@/lib/router-shim";
import { Brain, Briefcase, ArrowRight, Users, BookOpen, Clock, Map, Library, Mic, CalendarDays } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import SEO from "@/components/SEO";
import LearnBadges from "@/components/guides/LearnBadges";
import { LEARN_HUB, with3d } from "@/data/learnHub";

const notebooks = [
  {
    title: "AI Notebook",
    description: "Top 100 AI contributors, narrative chapters, interactive timelines, glossary, and curated reading lists — a comprehensive research companion.",
    icon: Brain,
    to: "/notebook/ai",
    stats: [
      { label: "Contributors", value: "100", icon: Users },
      { label: "Chapters", value: "6+", icon: BookOpen },
      { label: "Timeline", value: "1986–2025", icon: Clock },
      { label: "Learning Paths", value: "5+", icon: Map },
    ],
  },
  {
    title: "Business Notebook",
    description: "Frameworks, case studies, and strategic insights on building with AI — from GTM playbooks to enterprise adoption patterns.",
    icon: Briefcase,
    to: "/notebook/business",
    stats: [
      { label: "Frameworks", value: "Coming", icon: Library },
      { label: "Case Studies", value: "Soon", icon: BookOpen },
    ],
  },
  {
    title: "Conference Notebook",
    description: "Field notes, talks, and takeaways from AI, SEO, and engineering conferences — a live notebook of what survives the flight home.",
    icon: Mic,
    to: "/notebook/conference",
    stats: [
      // Filled at render from the conference data (app/notebook/page.tsx counts it); it read "5" against 3.
      { label: "Conferences", value: "", icon: CalendarDays },
      { label: "Field Notes", value: "Live", icon: BookOpen },
    ],
  },
];

const tocSections = [
  { label: "AI Notebook", id: "ai-notebook" },
  { label: "Business Notebook", id: "business-notebook" },
  { label: "Conference Notebook", id: "conference-notebook" },
  { label: "All Guides", id: "learn" },
];

const Notebook = ({ conferenceCount }: { conferenceCount?: number }) => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <SEO
        title="Research Notebooks | AI & Business | Venkata Pagadala"
        description="Deep-dive reference notebooks on AI contributors, learning roadmaps, concepts encyclopedia, and business strategy — by Venkata Pagadala."
        canonical="https://venkatapagadala.com/notebook"
        breadcrumbs={[
          { name: "Home", url: "https://venkatapagadala.com" },
          { name: "Notebooks", url: "https://venkatapagadala.com/notebook" },
        ]}
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <div className="mb-16">
              <p className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-[0.3em] mb-4">
                Notebook
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Research Notebooks
              </h1>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Deep-dive reference materials organized into focused notebooks. Each one is a living document — constantly updated with new insights, contributors, and frameworks.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-8">
            {notebooks.map((nb) => {
              const Icon = nb.icon;
              return (
                <ScrollReveal key={nb.to}>
                  <div id={nb.title === "AI Notebook" ? "ai-notebook" : nb.title === "Business Notebook" ? "business-notebook" : "conference-notebook"} className="scroll-mt-28">
                    <Link
                      to={nb.to}
                      className="block border border-border p-8 sm:p-10 group hover:border-foreground/30 transition-all border-glow-hover"
                    >
                      <div className="flex items-start gap-5 mb-6">
                        <div className="w-12 h-12 border border-border flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                          <Icon size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-display text-2xl font-bold text-foreground group-hover:text-glow transition-all mb-2">
                            {nb.title}
                          </h2>
                          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                            {nb.description}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground/70 group-hover:text-foreground group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {nb.stats.map((stat) => {
                          const StatIcon = stat.icon;
                          return (
                            <div key={stat.label} className="flex items-center gap-2 border border-border px-3 py-2">
                              <StatIcon size={12} className="text-muted-foreground/70" />
                              <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wider">{stat.label}</span>
                              <span className="font-mono text-xs text-foreground/80">
                                {stat.label === "Conferences" && conferenceCount ? conferenceCount : stat.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Link>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* All Guides: every guide lives in the notebooks (owner IA, 2026-10-30). Rendered on the server from the same
              list as the Notebooks menu, so a crawler that never opens the menu still reaches every guide. */}
          <section id="learn" aria-labelledby="learn-h" className="scroll-mt-28 mt-16">
            <p className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-[0.3em] mb-3">All Guides</p>
            <h2 id="learn-h" className="font-display text-3xl font-bold text-foreground mb-3">
              Every guide, by subject
            </h2>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-2xl mb-8">
              The guides live inside the notebooks. Each subject opens its full list, with reading times and topics, on the{" "}
              <Link href="/guides" className="underline underline-offset-4 hover:text-foreground">All Guides page</Link>.
            </p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {LEARN_HUB.map((sec) => (
                <div key={sec.id} className="border border-border p-6">
                  <Link href={`/guides#${sec.id}`} className="font-display text-lg font-bold text-foreground hover:text-glow transition-all">
                    {sec.title}
                  </Link>
                  <ul className="mt-4 space-y-3">
                    {sec.items.map(with3d).map((it) => (
                      <li key={it.to}>
                        <Link href={it.to} className="group block">
                          <span className="font-mono text-xs text-foreground group-hover:text-glow transition-all">{it.label}</span>
                          <LearnBadges badges={it.badges} className="text-[9px]" />
                          <span className="block font-mono text-[11px] text-muted-foreground/80 leading-relaxed">{it.note}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <PageSidebar
          sections={tocSections}
          shareTitle="Research Notebooks"
        />
      </div>
    </div>
  );
};

export default Notebook;
