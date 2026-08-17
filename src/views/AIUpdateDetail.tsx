"use client";
import { useParams, Link, Navigate } from "@/lib/router-shim";
import { formatDateLong } from "@/lib/date";
import ScrollReveal from "@/components/ScrollReveal";
import DealLogos from "@/components/updates/DealLogos";
import PageSidebar from "@/components/PageSidebar";
import SEO from "@/components/SEO";
import ContributorCards from "@/components/ContributorCards";
import { aiUpdates, CATEGORY_META } from "@/data/aiUpdates";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, FileText, Play, List, Users } from "lucide-react";

const AIUpdateDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const update = aiUpdates.find((u) => u.slug === slug);

  if (!update) return <Navigate to="/ai-updates" replace />;

  const catMeta = CATEGORY_META[update.category];
  const currentIdx = aiUpdates.findIndex((u) => u.slug === slug);
  const prevUpdate = currentIdx > 0 ? aiUpdates[currentIdx - 1] : null;
  const nextUpdate = currentIdx < aiUpdates.length - 1 ? aiUpdates[currentIdx + 1] : null;

  const tocSections = [
    ...(update.highlights?.length ? [{ label: "Key Numbers", id: "numbers" }] : []),
    ...(update.contributors?.length ? [{ label: "People", id: "people" }] : []),
    { label: "Key Takeaways", id: "takeaways" },
    ...(update.documents?.length ? [{ label: "Primary Documents", id: "documents" }] : []),
    ...(update.videos?.length ? [{ label: "Watch", id: "watch" }] : []),
    ...update.tocSections.map((s) => ({
      label: s,
      id: s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
    })),
    ...(update.videoUrl ? [{ label: "Watch Video", id: "video" }] : []),
    ...(update.relatedLinks.length > 0 ? [{ label: "Related", id: "related" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <SEO
        title={`${update.title} | AI Updates | Venkata Pagadala`}
        description={update.summary}
        canonical={`https://venkatapagadala.com/ai-updates/${update.slug}`}
        ogType="article"
        publishedTime={update.date}
        modifiedTime={update.date}
        breadcrumbs={[
          { name: "Home", url: "https://venkatapagadala.com" },
          { name: "AI Updates", url: "https://venkatapagadala.com/ai-updates" },
          { name: update.title, url: `https://venkatapagadala.com/ai-updates/${update.slug}` },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: update.title,
          description: update.summary,
          datePublished: update.date,
          dateModified: update.date,
          author: { "@type": "Person", name: "Venkata Pagadala" },
          publisher: { "@type": "Person", name: "Venkata Pagadala" },
          url: `https://venkatapagadala.com/ai-updates/${update.slug}`,
        }}
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0 max-w-3xl">
          <ScrollReveal>
            <Link
              to="/ai-updates"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={12} /> All AI Updates
            </Link>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border"
                style={{ borderColor: catMeta.color, color: catMeta.color }}
              >
                {catMeta.label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/70 flex items-center gap-1">
                <Calendar size={10} />
                {formatDateLong(update.date)}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/70">{update.company}</span>
            </div>

            {/* H1 */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
              {update.title}
            </h1>

            {/* Deal lockup: whose story this is, in their own marks */}
            {update.dealLogos && (
              <DealLogos
                left={update.dealLogos.left}
                right={update.dealLogos.right}
                connector={update.dealLogos.connector}
              />
            )}

            {/* Summary */}
            <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 border-l-2 border-foreground/20 pl-4">
              {update.summary}
            </p>
          </ScrollReveal>

          {/* Key numbers: front-page treatment, the whole story in four stats */}
          {update.highlights && update.highlights.length > 0 && (
            <ScrollReveal>
              <section id="numbers" className="scroll-mt-28 mb-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
                  {update.highlights.map((h) => (
                    <div key={h.stat} className="bg-background p-4 sm:p-5">
                      <div className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow leading-none mb-2">
                        {h.stat}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide leading-snug">
                        {h.label}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Who this is about: face, name, role, and a link to the profile.
              Paired with the "In the News" block on each profile, this makes
              the entity relationship legible to crawlers from both ends. */}
          {update.contributors && update.contributors.length > 0 && (
            <ScrollReveal>
              <section id="people" className="scroll-mt-28 mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={14} className="text-foreground/50" />
                  <h2 className="font-display text-base font-bold text-foreground">People in This Story</h2>
                </div>
                <ContributorCards ids={update.contributors} />
              </section>
            </ScrollReveal>
          )}

          {/* Key Takeaways */}
          <ScrollReveal>
            <section id="takeaways" className="scroll-mt-28 mb-10">
              <div className="border border-border bg-foreground/[0.02] p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <List size={14} className="text-foreground/50" />
                  <h2 className="font-display text-base font-bold text-foreground">Key Takeaways</h2>
                </div>
                <ul className="space-y-3">
                  {update.takeaways.map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground/70 mt-1 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed">{t}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </ScrollReveal>

          {/* Primary documents: the court record, never buried under prose */}
          {update.documents && update.documents.length > 0 && (
            <ScrollReveal>
              <section id="documents" className="scroll-mt-28 mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-foreground/50" />
                  <h2 className="font-display text-base font-bold text-foreground">Primary Documents</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {update.documents.map((doc) => (
                    <a
                      key={doc.url}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group border border-border p-4 hover:bg-secondary/20 border-glow-hover transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs text-foreground leading-snug mb-1">{doc.label}</div>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">{doc.source}</div>
                        </div>
                        <ExternalLink size={12} className="text-muted-foreground/70 group-hover:text-foreground flex-shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Watch: a 30-second version and the long version, reader's choice */}
          {update.videos && update.videos.length > 0 && (
            <ScrollReveal>
              <section id="watch" className="scroll-mt-28 mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Play size={14} className="text-foreground/50" />
                  <h2 className="font-display text-base font-bold text-foreground">Watch</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {update.videos.map((v) =>
                    v.url.startsWith("/") ? (
                      <div key={v.url} className="border border-border sm:col-span-2">
                        <video
                          controls
                          preload="metadata"
                          playsInline
                          poster={v.url.replace(".mp4", "-poster.png")}
                          className="w-full block"
                        >
                          <source src={v.url} type="video/mp4" />
                        </video>
                        <div className="flex items-center justify-between p-3 border-t border-border">
                          <span className="font-mono text-xs text-foreground">{v.label}</span>
                          {v.duration && (
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">{v.duration}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <a
                        key={v.url}
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group border border-border overflow-hidden hover:bg-secondary/20 border-glow-hover transition-all"
                      >
                        {v.url.includes("youtube.com") && (
                          <img
                            src={`https://img.youtube.com/vi/${extractYouTubeId(v.url)}/hqdefault.jpg`}
                            alt={v.label}
                            loading="lazy"
                            className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                        <div className="flex items-center justify-between p-3 border-t border-border">
                          <span className="font-mono text-xs text-foreground leading-snug">{v.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground uppercase flex-shrink-0 ml-3">
                            {v.duration ?? "watch"}
                          </span>
                        </div>
                      </a>
                    ),
                  )}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Article body */}
          <ScrollReveal>
            <div
              className="prose prose-sm prose-invert max-w-none font-mono text-sm leading-[1.9] text-muted-foreground
                [&_h3]:text-foreground [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-28
                [&_ul]:space-y-2 [&_li]:text-muted-foreground [&_strong]:text-foreground/80
                [&_p]:mb-4 [&_code]:bg-foreground/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-foreground/70 [&_code]:text-xs
                [&_pre]:bg-foreground/5 [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-xs"
              dangerouslySetInnerHTML={{ __html: update.body }}
            />
          </ScrollReveal>

          {/* Video embed */}
          {update.videoUrl && (
            <ScrollReveal>
              <section id="video" className="scroll-mt-28 mt-10 mb-10">
                <div className="border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Play size={14} className="text-foreground/50" />
                    <h2 className="font-display text-base font-bold text-foreground">Watch</h2>
                  </div>
                  <a
                    href={update.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="relative aspect-video bg-foreground/5 border border-border overflow-hidden mb-3">
                      {/* YouTube thumbnail */}
                      {update.videoUrl.includes("youtube.com") && (
                        <img
                          src={`https://img.youtube.com/vi/${extractYouTubeId(update.videoUrl)}/maxresdefault.jpg`}
                          alt={update.videoLabel || "Video thumbnail"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-background/30 group-hover:bg-background/10 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-foreground/80 flex items-center justify-center group-hover:bg-foreground transition-colors">
                          <Play size={24} className="text-background ml-1" />
                        </div>
                      </div>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {update.videoLabel || "Watch Video"}
                    </p>
                  </a>
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-6 mb-8">
            {update.tags.map((tag) => (
              <span key={tag} className="font-mono text-[9px] text-muted-foreground/70 border border-border/50 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>

          {/* Source link */}
          <a
            href={update.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs text-foreground/60 hover:text-foreground border border-border px-4 py-2 transition-colors"
          >
            <ExternalLink size={12} /> View Original Source
          </a>

          {/* Related pages */}
          {update.relatedLinks.length > 0 && (
            <ScrollReveal>
              <section id="related" className="scroll-mt-28 mt-12 mb-10">
                <h2 className="font-display text-base font-bold text-foreground mb-4">Related Pages</h2>
                <div className="space-y-3">
                  {update.relatedLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="block border border-border p-4 hover:border-foreground/30 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-display text-sm font-bold text-foreground group-hover:text-glow transition-all">
                            {link.label}
                          </h3>
                          <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">
                            {link.description}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground/70 group-hover:text-foreground shrink-0 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Prev/Next navigation */}
          <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-border">
            {prevUpdate ? (
              <Link
                to={`/ai-updates/${prevUpdate.slug}`}
                className="flex-1 border border-border p-4 hover:border-foreground/30 transition-all group"
              >
                <span className="font-mono text-[9px] text-muted-foreground/70 uppercase tracking-widest">← Previous</span>
                <p className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors mt-1 line-clamp-2">
                  {prevUpdate.title}
                </p>
              </Link>
            ) : <div className="flex-1" />}
            {nextUpdate && (
              <Link
                to={`/ai-updates/${nextUpdate.slug}`}
                className="flex-1 border border-border p-4 hover:border-foreground/30 transition-all group text-right"
              >
                <span className="font-mono text-[9px] text-muted-foreground/70 uppercase tracking-widest">Next →</span>
                <p className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors mt-1 line-clamp-2">
                  {nextUpdate.title}
                </p>
              </Link>
            )}
          </div>
        </div>

        <PageSidebar
          sections={tocSections}
          shareTitle={update.title}
        />
      </div>
    </div>
  );
};

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:live|watch\?v=)|youtu\.be\/)([^?&/]+)/);
  return match?.[1] || "";
}

export default AIUpdateDetail;
