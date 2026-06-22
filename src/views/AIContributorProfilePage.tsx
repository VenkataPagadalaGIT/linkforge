"use client";
import { useEffect } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-shim";
import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";
import PageSidebar, { TocItem } from "@/components/PageSidebar";

import { aiContributors, SEGMENT_COLORS } from "@/data/aiContributors";
import { contributorToRoadmap, contributorToEncyclopedia } from "@/data/crossLinks";
import CrossLinks from "@/components/CrossLinks";
import {
  ArrowLeft, ArrowRight, ExternalLink, GraduationCap, Award, MapPin,
  Quote, BookOpen, Link2, Play, Clock, Linkedin, Github, Share2, Copy, Check, Star, Users
} from "lucide-react";
import { useState } from "react";

const RESOURCE_ICONS: Record<string, string> = {
  paper: "📄", talk: "🎤", interview: "🎙️", book: "📚", podcast: "🎧", project: "🔧",
};

const MEDIA_ICONS: Record<string, typeof Play> = {
  podcast: Play, interview: Play, documentary: Play, lecture: Play,
};

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/** Get thumbnail URL for a resource URL (YouTube supported) */
function getThumbnail(url: string): string | null {
  const ytId = getYouTubeId(url);
  return ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
}

/** Reusable thumbnail component */
const ResourceThumbnail = ({ url, fullWidth }: { url: string; fullWidth?: boolean }) => {
  const thumb = getThumbnail(url);
  const sizeClass = fullWidth ? "w-full h-36" : "w-28 h-16";
  if (!thumb) {
    return (
      <div className={`${sizeClass} border border-border flex items-center justify-center shrink-0 bg-muted/20 group-hover:border-foreground/30 transition-colors`}>
        <Play size={fullWidth ? 24 : 16} className="text-muted-foreground/30 group-hover:text-foreground transition-colors" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} shrink-0 relative overflow-hidden border border-border group-hover:border-foreground/30 transition-colors`}>
      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 flex items-center justify-center bg-background/40 group-hover:bg-background/20 transition-colors">
        <Play size={fullWidth ? 24 : 16} className="text-foreground/70" fill="currentColor" />
      </div>
    </div>
  );
};

const AIContributorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contributor = aiContributors.find((c) => c.id === id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCopied(false);
  }, [id]);

  if (!contributor) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-muted-foreground mb-4">Contributor not found</p>
          <Link to="/ai-contributors" className="font-mono text-xs text-foreground underline">
            ← Back to AI Notebook
          </Link>
        </div>
      </div>
    );
  }

  const color = SEGMENT_COLORS[contributor.segment] || "#888";
  const connectedContributors = (contributor.connections || [])
    .map((cId) => aiContributors.find((c) => c.id === cId))
    .filter(Boolean);

  // Find prev/next by rank
  const sorted = [...aiContributors].sort((a, b) => a.rank - b.rank);
  const currentIdx = sorted.findIndex((c) => c.id === contributor.id);
  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: contributor.name,
    description: contributor.longBio || contributor.bio,
    jobTitle: contributor.expertType,
    affiliation: {
      "@type": "Organization",
      name: contributor.affiliation,
    },
    nationality: contributor.country,
    award: contributor.awards ? contributor.awards.split(", ") : undefined,
    url: contributor.website || undefined,
    sameAs: [
      contributor.twitter,
      contributor.linkedin,
      contributor.github,
      contributor.googleScholar,
      contributor.youtube,
    ].filter(Boolean),
    knowsAbout: contributor.specialty,
    alumniOf: contributor.education,
  };

  const pageTitle = `${contributor.name} — #${contributor.rank} Top AI Contributor 2026 | AI Notebook`;
  const pageDescription = contributor.longBio || `${contributor.bio} ${contributor.keyInfluence}`;
  const canonicalUrl = `https://venkatapagadala.com/ai-contributors/${contributor.id}`;

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription.slice(0, 160)}
        canonical={canonicalUrl}
        ogType="profile"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Home", url: "https://venkatapagadala.com" },
          { name: "AI Notebook", url: "https://venkatapagadala.com/notebook/ai" },
          { name: contributor.name, url: canonicalUrl },
        ]}
      />

      <div className="min-h-screen bg-background pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <ScrollReveal>
            <nav className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground/40 mb-10">
              <Link to="/ai-contributors" className="hover:text-foreground transition-colors">
                AI Notebook
              </Link>
              <span>/</span>
              <span className="text-muted-foreground/60">{contributor.name}</span>
            </nav>
          </ScrollReveal>

          {/* ── Page-wide two-column layout ── */}
          <div className="lg:flex lg:gap-10">
            <PageSidebar
              sections={([
                { label: "Overview", id: "details" },
                contributor.github && (contributor.githubFollowers || contributor.githubPinnedRepos) && { label: "GitHub", id: "github-stats" },
                contributor.milestones?.length && { label: "Timeline", id: "timeline" },
                contributor.quote && { label: "Quote", id: "quote" },
                { label: "Biography", id: "biography" },
                contributor.whyTheyMatter && { label: "Why They Matter", id: "why" },
                contributor.myTake && { label: "My Take", id: "my-take" },
                { label: "Key Influence", id: "influence" },
                (contributor.resources?.filter(r => r.type === "paper").length ?? 0) > 0 && { label: "Papers", id: "papers" },
                (contributor.resources?.filter(r => ["talk", "interview"].includes(r.type)).length ?? 0) > 0 && { label: "Videos", id: "videos" },
                (contributor.resources?.filter(r => r.type === "podcast").length ?? 0) > 0 && { label: "Podcasts", id: "podcasts-res" },
                contributor.featuredMedia?.length && { label: "Media", id: "media" },
                contributor.awards && { label: "Awards", id: "awards" },
                (contributor.connections?.length ?? 0) > 0 && { label: "Connections", id: "connections" },
                { label: "Links", id: "links" },
              ] as (TocItem | false | 0 | null | undefined)[]).filter(Boolean) as TocItem[]}
              shareTitle={`${contributor.name} — Top AI Contributor 2026`}
            />

            {/* Main Content Column */}
            <div className="flex-1 min-w-0">

          {/* ── Header ── */}
          <ScrollReveal>
            <div className="flex items-start gap-6 mb-8">
              <div className="shrink-0">
                {contributor.photoUrl ? (
                  <img
                    src={contributor.photoUrl}
                    alt={`Photo of ${contributor.name}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-sm"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center font-mono text-xl sm:text-2xl font-bold text-background"
                    style={{ backgroundColor: color }}
                  >
                    {contributor.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                )}
                {contributor.photoCredit && (
                  <p className="font-mono text-[8px] text-muted-foreground/25 mt-1 max-w-24 leading-tight">
                    {contributor.photoCredit}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground/30">#{contributor.rank}</span>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider"
                    style={{ borderColor: `${color}40`, color }}
                  >
                    {contributor.expertType}
                  </span>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider"
                    style={{ borderColor: `${color}20`, color: `${color}99` }}
                  >
                    {contributor.segment}
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-glow mb-2">
                  {contributor.name}
                </h1>
                <p className="font-mono text-sm text-muted-foreground">{contributor.affiliation}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* ── Details Grid + Links (compact) ── */}
          <ScrollReveal delay={30}>
            <div id="details" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 scroll-mt-24">
              <div className="border border-border p-4">
                <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-1.5">
                  {contributor.specialty.map((s) => (
                    <span key={s} className="font-mono text-[10px] border border-border px-2 py-1 text-muted-foreground/60">{s}</span>
                  ))}
                </div>
              </div>
              <div className="border border-border p-4">
                <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-2">Location</h3>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-muted-foreground/30" />
                  <span className="font-mono text-sm text-muted-foreground">{contributor.country}</span>
                </div>
              </div>
              <div className="border border-border p-4">
                <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-2">Education</h3>
                <div className="flex items-start gap-2">
                  <GraduationCap size={12} className="text-muted-foreground/30 mt-0.5 shrink-0" />
                  <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{contributor.education}</span>
                </div>
              </div>
              {/* GitHub Stats */}
              {contributor.github && (contributor.githubFollowers || contributor.githubPinnedRepos) && (
                <div className="border border-border p-4" id="github-stats">
                  <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-2">
                    <Github size={10} className="inline mr-1" />GitHub
                  </h3>
                  {contributor.githubFollowers && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users size={10} className="text-muted-foreground/40" />
                      <span className="font-mono text-sm text-foreground/70">{contributor.githubFollowers} followers</span>
                    </div>
                  )}
                  {contributor.githubPinnedRepos && contributor.githubPinnedRepos.length > 0 && (
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-1.5">Pinned Repos</p>
                      <div className="flex flex-wrap gap-1">
                        {contributor.githubPinnedRepos.map((repo) => (
                          <a
                            key={repo}
                            href={`${contributor.github}/${repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] border border-border px-2 py-0.5 text-muted-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
                          >
                            {repo}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Links & Profiles - inline in grid */}
              <div className="border border-border p-4 sm:col-span-2 lg:col-span-3" id="links">
                <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-2">Links & Profiles</h3>
                <div className="flex flex-wrap gap-2">
                  {contributor.linkedin && (
                    <a href={contributor.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/60 hover:text-foreground border border-border px-3 py-1.5 transition-colors">
                      <Linkedin size={12} /> LinkedIn <ExternalLink size={8} />
                    </a>
                  )}
                  {contributor.twitter && (
                    <a href={contributor.twitter} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/60 hover:text-foreground border border-border px-3 py-1.5 transition-colors">
                      𝕏 Twitter <ExternalLink size={8} />
                    </a>
                  )}
                  {contributor.website && (
                    <a href={contributor.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/60 hover:text-foreground border border-border px-3 py-1.5 transition-colors">
                      Website <ExternalLink size={8} />
                    </a>
                  )}
                  {contributor.github && (
                    <a href={contributor.github} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/60 hover:text-foreground border border-border px-3 py-1.5 transition-colors">
                      <Github size={12} /> GitHub <ExternalLink size={8} />
                    </a>
                  )}
                  {contributor.googleScholar && (
                    <a href={contributor.googleScholar} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/60 hover:text-foreground border border-border px-3 py-1.5 transition-colors">
                      Scholar <ExternalLink size={8} />
                    </a>
                  )}
                  {contributor.youtube && (
                    <a href={contributor.youtube} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/60 hover:text-foreground border border-border px-3 py-1.5 transition-colors">
                      YouTube <ExternalLink size={8} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* ── Timeline (moved to top) ── */}
          {contributor.milestones && contributor.milestones.length > 0 && (
            <ScrollReveal delay={40}>
              <div id="timeline" className="mb-10 scroll-mt-24">
                <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-6">
                  Timeline
                </h2>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {contributor.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-4 mb-4 relative">
                      <div
                        className="absolute left-[-16px] top-1.5 w-3 h-3 border-2 bg-background rounded-full"
                        style={{ borderColor: color }}
                      />
                      <span className="font-mono text-xs text-muted-foreground/30 shrink-0 w-10 font-bold">{m.year}</span>
                      <span className="font-mono text-sm text-muted-foreground leading-relaxed">{m.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}


              {/* Mobile inline nav */}
              <div className="lg:hidden border border-border p-4 mb-6">
                <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-2">Jump to Section</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    contributor.quote && { label: "Quote", id: "quote" },
                    { label: "Bio", id: "biography" },
                    contributor.whyTheyMatter && { label: "Why They Matter", id: "why" },
                    { label: "Influence", id: "influence" },
                    (contributor.resources?.filter(r => r.type === "paper").length ?? 0) > 0 && { label: "Papers", id: "papers" },
                    (contributor.resources?.filter(r => ["talk", "interview"].includes(r.type)).length ?? 0) > 0 && { label: "Videos", id: "videos" },
                    contributor.featuredMedia?.length && { label: "Media", id: "media" },
                  ].filter(Boolean).map((item: any) => (
                    <a key={item.id} href={`#${item.id}`}
                      className="font-mono text-[9px] border border-border px-2 py-1 text-muted-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors">
                      {item.label}
                    </a>
                  ))}
                </div>
                <div className="border-t border-border pt-3 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mr-1">AI</span>
                  <a href={`https://chatgpt.com/?q=${encodeURIComponent(`Tell me about ${contributor.name}`)}`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[9px] border border-border px-2 py-1 text-muted-foreground/50 hover:text-foreground transition-colors">ChatGPT</a>
                  <a href={`https://www.perplexity.ai/search?q=${encodeURIComponent(`${contributor.name} AI researcher`)}`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[9px] border border-border px-2 py-1 text-muted-foreground/50 hover:text-foreground transition-colors">Perplexity</a>
                  <a href={`https://gemini.google.com/app?q=${encodeURIComponent(`Tell me about ${contributor.name}`)}`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[9px] border border-border px-2 py-1 text-muted-foreground/50 hover:text-foreground transition-colors">Gemini</a>
                </div>
              </div>

          {/* ── Quote ── */}
          {contributor.quote && (
            <ScrollReveal delay={50}>
              <div id="quote" className="border-l-2 border-foreground/20 pl-6 mb-10 scroll-mt-24">
                <Quote size={16} className="text-muted-foreground/15 mb-2" />
                <p className="font-mono text-sm text-foreground/70 italic leading-[1.9] max-w-2xl">
                  "{contributor.quote}"
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* ── Bio ── */}
          <ScrollReveal delay={100}>
            <div id="biography" className="mb-10 scroll-mt-24">
              <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-4">Biography</h2>
              <p className="font-mono text-sm text-muted-foreground leading-[1.9] max-w-3xl">
                {contributor.longBio || contributor.bio}
              </p>
            </div>
          </ScrollReveal>

          {/* ── Why They Matter ── */}
          {contributor.whyTheyMatter && (
            <ScrollReveal delay={100}>
              <div id="why" className="border border-foreground/20 bg-foreground/[0.02] p-6 sm:p-8 mb-10 scroll-mt-24">
                <h2 className="font-mono text-[10px] text-foreground/50 uppercase tracking-widest mb-4">
                  Why They Matter
                </h2>
                <p className="font-mono text-sm text-foreground/70 leading-[1.9]">
                  {contributor.whyTheyMatter}
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* ── My Take ── */}
          {contributor.myTake && (
            <ScrollReveal delay={100}>
              <div id="my-take" className="border border-foreground/20 bg-foreground/[0.03] p-6 sm:p-8 mb-10 scroll-mt-24">
                <h2 className="font-mono text-[10px] text-foreground/50 uppercase tracking-widest mb-4">
                  💡 My Take
                </h2>
                <p className="font-mono text-sm text-foreground/70 leading-[1.9]">
                  {contributor.myTake}
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* ── Key Influence ── */}
          <ScrollReveal delay={100}>
            <div id="influence" className="border border-border p-6 mb-10 scroll-mt-24">
              <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-3">Key Influence</h2>
              <p className="font-mono text-sm text-foreground/80 leading-relaxed">{contributor.keyInfluence}</p>
            </div>
          </ScrollReveal>

          {/* ── Research Papers (separated) ── */}
          {(() => {
            const papers = contributor.resources?.filter(r => r.type === "paper") || [];
            if (papers.length === 0) return null;
            return (
              <ScrollReveal delay={100}>
                <div id="papers" className="mb-10 scroll-mt-24">
                  <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-6">
                    📄 Research Papers
                  </h2>
                  <div className="space-y-3">
                    {papers.map((res, i) => (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                        className="block border border-border p-5 hover:border-foreground/20 transition-all group">
                        <div className="flex items-start gap-3">
                          <span className="text-sm mt-0.5">📄</span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">{res.title}</p>
                              <ExternalLink size={10} className="text-muted-foreground/20 group-hover:text-foreground/40 shrink-0 mt-1" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              {res.year && <span className="font-mono text-[9px] text-muted-foreground/20">{res.year}</span>}
                            </div>
                            {res.description && (
                              <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed group-hover:text-muted-foreground transition-colors">{res.description}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })()}

          {/* ── Videos & Interviews (separated) ── */}
          {(() => {
            const videos = contributor.resources?.filter(r => ["talk", "interview"].includes(r.type)) || [];
            if (videos.length === 0) return null;
            return (
              <ScrollReveal delay={100}>
                <div id="videos" className="mb-10 scroll-mt-24">
                  <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-6">
                    🎙️ Videos & Interviews
                  </h2>
                  <div className="space-y-3">
                    {videos.map((res, i) => (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                        className="block border border-border p-4 hover:border-foreground/20 transition-all group">
                        <div className="flex items-start gap-4">
                          <ResourceThumbnail url={res.url} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">{res.title}</p>
                              <ExternalLink size={10} className="text-muted-foreground/20 group-hover:text-foreground/40 shrink-0 mt-1" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-[9px] text-muted-foreground/30 capitalize">{res.type}</span>
                              {res.year && <span className="font-mono text-[9px] text-muted-foreground/20">{res.year}</span>}
                            </div>
                            {res.description && (
                              <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed group-hover:text-muted-foreground transition-colors">{res.description}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })()}

          {/* ── Podcasts (separated) ── */}
          {(() => {
            const podcasts = contributor.resources?.filter(r => r.type === "podcast") || [];
            if (podcasts.length === 0) return null;
            return (
              <ScrollReveal delay={100}>
                <div id="podcasts-res" className="mb-10 scroll-mt-24">
                  <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-6">
                    🎧 Podcasts
                  </h2>
                  <div className="space-y-3">
                    {podcasts.map((res, i) => (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                        className="block border border-border p-4 hover:border-foreground/20 transition-all group">
                        <div className="flex items-start gap-4">
                          <ResourceThumbnail url={res.url} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">{res.title}</p>
                              <ExternalLink size={10} className="text-muted-foreground/20 group-hover:text-foreground/40 shrink-0 mt-1" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              {res.year && <span className="font-mono text-[9px] text-muted-foreground/20">{res.year}</span>}
                            </div>
                            {res.description && (
                              <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed group-hover:text-muted-foreground transition-colors">{res.description}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })()}

          {/* ── Other Resources (books, projects, etc.) ── */}
          {(() => {
            const other = contributor.resources?.filter(r => !["paper", "talk", "interview", "podcast"].includes(r.type)) || [];
            if (other.length === 0) return null;
            return (
              <ScrollReveal delay={100}>
                <div id="other-resources" className="mb-10 scroll-mt-24">
                  <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-6">
                    📚 Other Resources
                  </h2>
                  <div className="space-y-3">
                    {other.map((res, i) => (
                      <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                        className="block border border-border p-5 hover:border-foreground/20 transition-all group">
                        <div className="flex items-start gap-3">
                          <span className="text-sm mt-0.5">{RESOURCE_ICONS[res.type] || "📄"}</span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">{res.title}</p>
                              <ExternalLink size={10} className="text-muted-foreground/20 group-hover:text-foreground/40 shrink-0 mt-1" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-[9px] text-muted-foreground/30 capitalize">{res.type}</span>
                              {res.year && <span className="font-mono text-[9px] text-muted-foreground/20">{res.year}</span>}
                            </div>
                            {res.description && (
                              <p className="font-mono text-[11px] text-muted-foreground/50 leading-relaxed group-hover:text-muted-foreground transition-colors">{res.description}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })()}

          {/* ── Featured Media ── */}
          {contributor.featuredMedia && contributor.featuredMedia.length > 0 && (
            <ScrollReveal delay={100}>
              <div id="media" className="mb-10 scroll-mt-24">
                <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-6">
                  🎬 Featured Media
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {contributor.featuredMedia.map((media, i) => (
                    <a
                      key={i}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-border p-4 hover:border-foreground/20 transition-all group"
                    >
                      <ResourceThumbnail url={media.url} fullWidth />
                      <div className="mt-3">
                        <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all mb-1 line-clamp-2">
                          {media.title}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground/40 mb-1">
                          {media.host}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[9px] text-muted-foreground/20 capitalize">{media.type}</span>
                          {media.duration && (
                            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/20">
                              <Clock size={8} /> {media.duration}
                            </span>
                          )}
                          {media.year && (
                            <span className="font-mono text-[9px] text-muted-foreground/20">{media.year}</span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* ── Awards ── */}
          {contributor.awards && (
            <ScrollReveal delay={100}>
              <div id="awards" className="border border-border p-5 mb-10 scroll-mt-24">
                <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-2">Awards & Recognition</h3>
                <div className="flex items-start gap-2">
                  <Award size={12} className="text-muted-foreground/30 mt-0.5 shrink-0" />
                  <span className="font-mono text-sm text-muted-foreground leading-relaxed">{contributor.awards}</span>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* ── Related Content Cross-Links ── */}
          {(contributorToRoadmap[contributor.id] || contributorToEncyclopedia[contributor.id]) && (
            <ScrollReveal delay={100}>
              <div id="related-content" className="border border-border p-5 mb-10 scroll-mt-24">
                <h3 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest mb-3">Explore Related Content</h3>
                <CrossLinks
                  relatedTopics={contributorToRoadmap[contributor.id]}
                  relatedConcepts={contributorToEncyclopedia[contributor.id]}
                />
              </div>
            </ScrollReveal>
          )}

          {/* ── Connected Contributors ── */}
          {connectedContributors.length > 0 && (
            <ScrollReveal delay={100}>
              <div id="connections" className="mb-10 scroll-mt-24">
                <div className="flex items-center gap-2 mb-6">
                  <Link2 size={14} className="text-muted-foreground/30" />
                  <h2 className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest">
                    Connected Contributors
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {connectedContributors.map((c) => {
                    if (!c) return null;
                    const cColor = SEGMENT_COLORS[c.segment] || "#888";
                    return (
                      <Link
                        key={c.id}
                        to={`/ai-contributors/${c.id}`}
                        className="flex items-center gap-3 border border-border p-4 hover:border-foreground/20 transition-all group"
                      >
                        <div
                          className="w-10 h-10 flex items-center justify-center font-mono text-xs font-bold text-background shrink-0"
                          style={{ backgroundColor: cColor }}
                        >
                          {c.name.split(" ").map((w) => w[0]).join("")}
                        </div>
                        <div>
                          <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">
                            {c.name}
                          </p>
                          <p className="font-mono text-[9px] text-muted-foreground/30">
                            #{c.rank} · {c.segment}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* ── Prev/Next Navigation ── */}
          <ScrollReveal delay={100}>
            <div className="grid grid-cols-2 gap-4 mb-10">
              {prev ? (
                <Link
                  to={`/ai-contributors/${prev.id}`}
                  className="border border-border p-4 hover:border-foreground/20 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowLeft size={12} className="text-muted-foreground/30" />
                    <span className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest">Previous</span>
                  </div>
                  <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">
                    {prev.name}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground/30">#{prev.rank}</p>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  to={`/ai-contributors/${next.id}`}
                  className="border border-border p-4 hover:border-foreground/20 transition-all group text-right"
                >
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest">Next</span>
                    <ArrowRight size={12} className="text-muted-foreground/30" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">
                    {next.name}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground/30">#{next.rank}</p>
                </Link>
              ) : <div />}
            </div>
          </ScrollReveal>

          {/* ── Back to Notebook ── */}
          <ScrollReveal>
            <div className="border border-border p-6 text-center border-glow-hover">
              <Link
                to="/ai-contributors"
                className="inline-flex items-center gap-2 font-mono text-xs text-foreground hover:text-glow transition-all tracking-widest uppercase"
              >
                <ArrowLeft size={12} /> Back to AI Notebook
              </Link>
            </div>
          </ScrollReveal>
            </div>{/* end main content column */}
          </div>{/* end two-column layout */}
        </div>
      </div>
    </>
  );
};

export default AIContributorProfilePage;
