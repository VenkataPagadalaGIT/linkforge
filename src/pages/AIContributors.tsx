"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import Holographic3DWrapper from "@/components/Holographic3DWrapper";
import PageSidebar from "@/components/PageSidebar";

import StateOfAIEssay from "@/components/StateOfAIEssay";
import AIContributorsExplorer from "@/components/AIContributorsExplorer";
import AITimeline from "@/components/AITimeline";
import AIGlossary from "@/components/AIGlossary";
import CuratedReadingLists from "@/components/CuratedReadingLists";
import AILearningRoadmap from "@/components/AILearningRoadmap";
import AIEncyclopedia from "@/components/AIEncyclopedia";
import { aiContributors } from "@/data/aiContributors";
import { encyclopediaConcepts } from "@/data/aiEncyclopedia";
import { Link, useNavigate, useLocation } from "@/lib/router-shim";
import { ArrowLeft, ArrowRight, Linkedin, Mail } from "lucide-react";
import authorPhoto from "@/assets/venkata-pagadala.jpeg";

const pageTocSections = [
  { label: "Database", id: "explorer" },
  { label: "Overview", id: "essay" },
  { label: "Timeline", id: "timeline" },
  { label: "Glossary", id: "glossary" },
  { label: "Reading Lists", id: "reading" },
];

const STORAGE_KEY = "ai-contributors-explored";

type TopLevelTab = "contributors" | "roadmap" | "encyclopedia";

const topTabs = [
  { id: "contributors" as TopLevelTab, path: "/notebook/ai", label: "📚 Top 100 Contributors", shortLabel: "Contributors" },
  { id: "roadmap" as TopLevelTab, path: "/notebook/ai/roadmap", label: "🗺️ Learning Roadmap", shortLabel: "Roadmap" },
  { id: "encyclopedia" as TopLevelTab, path: "/notebook/ai/encyclopedia", label: "🧠 Concepts Encyclopedia", shortLabel: "Encyclopedia" },
];

const TAB_META: Record<TopLevelTab, { title: string; description: string; canonical: string; ogTitle: string }> = {
  contributors: {
    title: "Best 100 AI Contributors 2026 — Definitive Directory | Venkata Pagadala",
    description: "The best and most authoritative directory of 100 AI pioneers shaping the field in 2026. Explore profiles, research timelines, glossary, and curated reading lists — curated by Venkata Pagadala.",
    canonical: "https://venkatapagadala.com/notebook/ai",
    ogTitle: "Best 100 AI Contributors 2026 — The Definitive Directory",
  },
  roadmap: {
    title: "Free AI Roadmap March 2026 — Zero to Hero in 18 Weeks | Venkata Pagadala",
    description: "The best free AI roadmap for March 2026. A structured 23-topic curriculum with 90+ curated resources — videos, courses, books, repos, and pro tips. From beginner to advanced, completely free.",
    canonical: "https://venkatapagadala.com/notebook/ai/roadmap",
    ogTitle: "Free AI Roadmap March 2026 — Zero to Hero in 18 Weeks",
  },
  encyclopedia: {
    title: "Best AI Concepts Encyclopedia 2026 — 110 Concepts Explained | Venkata Pagadala",
    description: "The best AI concepts encyclopedia: 110 concepts across 10 categories with key terms, prerequisites, difficulty levels, and curated learn-more links.",
    canonical: "https://venkatapagadala.com/notebook/ai/encyclopedia",
    ogTitle: "Best AI Concepts Encyclopedia 2026 — 110 Concepts Explained",
  },
};


function getTabFromPath(pathname: string): TopLevelTab {
  if (pathname === "/notebook/ai/roadmap") return "roadmap";
  if (pathname === "/notebook/ai/encyclopedia") return "encyclopedia";
  return "contributors";
}

const AIContributors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const topTab = getTabFromPath(location.pathname);

  const [exploredIds, setExploredIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activeSection, setActiveSection] = useState<string>("explorer");
  

  useEffect(() => {
    const meta = TAB_META[topTab];
    document.title = meta.title;

    // Meta description
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", meta.description);

    // Self-referencing canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", meta.canonical);

    // OG tags
    const ogTags: Record<string, string> = {
      "og:title": meta.ogTitle,
      "og:description": meta.description,
      "og:url": meta.canonical,
      "og:type": "article",
    };
    Object.entries(ogTags).forEach(([prop, content]) => {
      let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    // Twitter tags
    const twitterTags: Record<string, string> = {
      "twitter:title": meta.ogTitle,
      "twitter:description": meta.description,
    };
    Object.entries(twitterTags).forEach(([name, content]) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    // JSON-LD structured data
    let jsonLd = document.querySelector('script[data-ai-notebook-ld]');
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.setAttribute("type", "application/ld+json");
      jsonLd.setAttribute("data-ai-notebook-ld", "true");
      document.head.appendChild(jsonLd);
    }
    const ldData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.ogTitle,
      description: meta.description,
      url: meta.canonical,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": meta.canonical,
      },
      author: {
        "@type": "Person",
        name: "Venkata Pagadala",
        url: "https://venkatapagadala.com/about",
        jobTitle: "AI Product Owner & Technical SEO Lead",
      },
      publisher: {
        "@type": "Person",
        name: "Venkata Pagadala",
        url: "https://venkatapagadala.com",
      },
      datePublished: "2026-01-15",
      dateModified: "2026-03-19",
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "Venkata Pagadala",
        url: "https://venkatapagadala.com",
      },
    };

    // Add Course structured data for roadmap
    if (topTab === "roadmap") {
      (ldData as Record<string, unknown>)["@type"] = "Course";
      ldData.name = "Free AI Roadmap — Zero to Hero in 18 Weeks";
      ldData.provider = { "@type": "Person", name: "Venkata Pagadala", url: "https://venkatapagadala.com" };
      ldData.isAccessibleForFree = true;
      ldData.offers = { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" };
      ldData.educationalLevel = "Beginner to Advanced";
      ldData.numberOfCredits = 0;
      ldData.hasCourseInstance = { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT18W" };
    }

    // FAQPage schema for encyclopedia
    if (topTab === "encyclopedia") {
      ldData["@type"] = "Article";
    }

    jsonLd.textContent = JSON.stringify(ldData);

    // FAQPage JSON-LD for encyclopedia (separate script)
    let faqLd = document.querySelector('script[data-faq-ld]');
    if (topTab === "encyclopedia") {
      if (!faqLd) {
        faqLd = document.createElement("script");
        faqLd.setAttribute("type", "application/ld+json");
        faqLd.setAttribute("data-faq-ld", "true");
        document.head.appendChild(faqLd);
      }
      const faqItems = encyclopediaConcepts.slice(0, 30).map((c) => ({
        "@type": "Question",
        name: `What is ${c.concept}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: c.description,
        },
      }));
      faqLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems,
      });
    } else if (faqLd) {
      faqLd.remove();
    }

    // BreadcrumbList JSON-LD
    let breadcrumbLd = document.querySelector('script[data-breadcrumb-ld]');
    if (!breadcrumbLd) {
      breadcrumbLd = document.createElement("script");
      breadcrumbLd.setAttribute("type", "application/ld+json");
      breadcrumbLd.setAttribute("data-breadcrumb-ld", "true");
      document.head.appendChild(breadcrumbLd);
    }
    const breadcrumbItems = [
      { name: "Home", url: "https://venkatapagadala.com" },
      { name: "Notebooks", url: "https://venkatapagadala.com/notebook" },
      { name: topTab === "roadmap" ? "AI Roadmap" : topTab === "encyclopedia" ? "AI Encyclopedia" : "AI Contributors", url: meta.canonical },
    ];
    breadcrumbLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    });

    // og:locale
    let ogLocale = document.querySelector('meta[property="og:locale"]') as HTMLMetaElement;
    if (!ogLocale) {
      ogLocale = document.createElement("meta");
      ogLocale.setAttribute("property", "og:locale");
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute("content", "en_US");

    return () => {
      const el = document.querySelector('script[data-ai-notebook-ld]');
      if (el) el.remove();
      const bc = document.querySelector('script[data-breadcrumb-ld]');
      if (bc) bc.remove();
      const fq = document.querySelector('script[data-faq-ld]');
      if (fq) fq.remove();
    };
  }, [topTab]);

  const handleExplore = useCallback((id: string) => {
    setExploredIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleSelectFromOutside = useCallback((id: string) => {
    navigate(`/ai-contributors/${id}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <Link
          to="/notebook"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground/40 hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={12} /> Back to Notebooks
        </Link>

        {/* Hero — compact two column */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/30 mb-2 uppercase">
              The AI Notebook · 2026 Edition
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-1">
              {topTab === "roadmap" ? "Free AI Roadmap — March 2026" : topTab === "encyclopedia" ? "AI Concepts Encyclopedia 2026" : "Top 100 AI Contributors 2026"}
            </h1>
            <p className="font-mono text-xs text-muted-foreground/60 max-w-xl leading-relaxed">
              Your complete AI learning companion — from zero to hero. A roadmap with 90+ resources, 110 concepts explained, and 100 contributors profiled.
            </p>
          </div>

            {/* Author card */}
            <Holographic3DWrapper phase={0.7} intensity="subtle" className="lg:w-64 shrink-0">
              <div className="border border-border/50 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={authorPhoto}
                    alt="Venkata Pagadala"
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">Venkata Pagadala</h3>
                    <p className="font-mono text-[9px] text-muted-foreground/40">Curator</p>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed mb-3">
                  AI Product & Research. Search — SEO, GEO & Automation at enterprise level. 10M+ pages managed.
                </p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {[
                    { value: "18K+", label: "Followers" },
                    { value: "404K+", label: "Impressions" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="font-mono text-xs font-bold text-foreground">{s.value}</p>
                      <p className="font-mono text-[8px] text-muted-foreground/30 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <a
                    href="https://www.linkedin.com/in/venkata-pagadala/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <Linkedin size={10} /> Follow on LinkedIn
                  </a>
                  <a
                    href="https://www.linkedin.com/newsletters/7286801553498583041/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <ArrowRight size={10} /> Subscribe Newsletter
                  </a>
                  <a
                    href="mailto:vdepagadala@gmail.com"
                    className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <Mail size={10} /> Get in Touch
                  </a>
                </div>
              </div>
            </Holographic3DWrapper>
        </div>

        {/* Top-level tabs */}
        <ScrollReveal delay={50}>
          <div className="flex flex-wrap gap-0 border-b border-border mb-8">
            {topTabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`px-5 py-3 font-mono text-[11px] uppercase tracking-wider transition-all border-b-2 -mb-px ${
                  topTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground/30 hover:text-muted-foreground/60"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* === ROADMAP TAB === */}
        {topTab === "roadmap" && (
          <div>
            <div className="flex-1 min-w-0">
              <div className="mb-6">
                 <h2 className="font-display text-xl font-bold text-foreground mb-1">
                   🗺️ Free AI Roadmap — Zero to Hero (March 2026)
                 </h2>
                 <p className="font-mono text-[11px] text-muted-foreground/40 max-w-2xl leading-relaxed">
                   A free, structured 18-week AI curriculum with 90+ curated resources — videos, courses, books, repos, and pro tips. Your complete free AI learning roadmap for 2026.
                 </p>
              </div>
              <AILearningRoadmap />
            </div>
          </div>
        )}

        {/* === ENCYCLOPEDIA TAB === */}
        {topTab === "encyclopedia" && (
          <div>
            <div className="flex-1 min-w-0">
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  🧠 AI Concepts Encyclopedia — Zero to Hero (2026)
                </h2>
                <p className="font-mono text-[11px] text-muted-foreground/40 max-w-2xl leading-relaxed">
                  110 concepts across 10 categories with descriptions, key terms, prerequisites, and curated learn-more links. Filter by category and difficulty.
                </p>
              </div>
              <AIEncyclopedia />
            </div>
          </div>
        )}

        {/* === CONTRIBUTORS TAB === */}
        {topTab === "contributors" && (
          <>
            {/* Stats */}
            <ScrollReveal delay={50}>
              <div className="flex flex-wrap gap-6 mb-10 pb-8 border-b border-border">
                {[
                  { label: "Contributors", value: String(aiContributors.length) },
                  { label: "Concepts", value: "20" },
                  { label: "Resources", value: "25+" },
                  { label: "Explored", value: `${exploredIds.size}/${aiContributors.length}` },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-mono text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/25 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Two-column layout: content | nav sidebar */}
            <div className="lg:flex lg:gap-10">
              <div className="flex-1 min-w-0">
                {activeSection === "explorer" && (
                  <div id="explorer" className="scroll-mt-28">
                    <AIContributorsExplorer onExplore={handleExplore} />
                  </div>
                )}
                {activeSection === "essay" && (
                  <div id="essay" className="scroll-mt-28">
                    <h2 className="font-display text-xl font-bold text-foreground mb-1">The State of AI, 2026</h2>
                    <p className="font-mono text-[10px] text-muted-foreground/25 uppercase tracking-widest mb-8">An introduction</p>
                    <StateOfAIEssay />
                  </div>
                )}
                {activeSection === "timeline" && (
                  <div id="timeline" className="scroll-mt-28">
                    <h2 className="font-display text-xl font-bold text-foreground mb-1">AI Timeline</h2>
                    <p className="font-mono text-[11px] text-muted-foreground/40 mb-8 max-w-2xl leading-relaxed">
                      Key milestones from 1986 to today.
                    </p>
                    <AITimeline onSelectContributor={handleSelectFromOutside} />
                  </div>
                )}
                {activeSection === "glossary" && (
                  <div id="glossary" className="scroll-mt-28">
                    <h2 className="font-display text-xl font-bold text-foreground mb-1">AI Concepts Glossary</h2>
                    <p className="font-mono text-[11px] text-muted-foreground/40 mb-8 max-w-2xl leading-relaxed">
                      20 essential AI concepts linked to the contributors who pioneered them.
                    </p>
                    <AIGlossary onSelectContributor={handleSelectFromOutside} />
                  </div>
                )}
                {activeSection === "reading" && (
                  <div id="reading" className="scroll-mt-28">
                    <h2 className="font-display text-xl font-bold text-foreground mb-1">Curated Reading Lists</h2>
                    <p className="font-mono text-[11px] text-muted-foreground/40 mb-8 max-w-2xl leading-relaxed">
                      The papers, podcasts, and talks that matter most.
                    </p>
                    <CuratedReadingLists />
                  </div>
                )}
              </div>

              <PageSidebar
                sections={pageTocSections}
                shareTitle="Top 100 AI Contributors 2026 — The Definitive AI Notebook"
                onSectionClick={(id) => setActiveSection(id)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIContributors;
