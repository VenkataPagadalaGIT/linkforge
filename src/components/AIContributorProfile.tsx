"use client";
import { X, ExternalLink, GraduationCap, Award, MapPin, Quote, BookOpen, Link2, ArrowRight, Linkedin } from "lucide-react";
import { Link } from "@/lib/router-shim";
import { SEGMENT_COLORS, aiContributors, type AIContributor } from "@/data/aiContributors";

interface Props {
  contributor: AIContributor;
  onClose: () => void;
  onSelectContributor?: (id: string) => void;
}

const RESOURCE_ICONS: Record<string, string> = {
  paper: "📄",
  talk: "🎤",
  interview: "🎙️",
  book: "📚",
  podcast: "🎧",
  project: "🔧",
};

const AIContributorProfile = ({ contributor, onClose, onSelectContributor }: Props) => {
  const color = SEGMENT_COLORS[contributor.segment] || "#888";

  const connectedContributors = (contributor.connections || [])
    .map((id) => aiContributors.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="border border-border bg-background/98 backdrop-blur-md relative animate-in fade-in slide-in-from-right-4 duration-300 max-h-[85vh] overflow-y-auto">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-muted-foreground/40 hover:text-foreground transition-colors z-10"
      >
        <X size={16} />
      </button>

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 flex items-center justify-center font-mono text-sm font-bold text-background shrink-0"
            style={{ backgroundColor: color }}
          >
            {contributor.name.split(" ").map((w) => w[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-muted-foreground/30">#{contributor.rank}</span>
              <span
                className="font-mono text-[9px] px-1.5 py-0.5 border uppercase tracking-wider"
                style={{ borderColor: `${color}40`, color }}
              >
                {contributor.expertType}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">{contributor.name}</h3>
            <p className="font-mono text-xs text-muted-foreground">{contributor.affiliation}</p>
          </div>
        </div>

        {/* Quote */}
        {contributor.quote && (
          <div className="border-l-2 border-foreground/20 pl-4 mb-6">
            <Quote size={12} className="text-muted-foreground/20 mb-1" />
            <p className="font-mono text-[11px] text-foreground/70 italic leading-relaxed">
              "{contributor.quote}"
            </p>
          </div>
        )}

        {/* Bio */}
        <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-6">{contributor.bio}</p>

        {/* Key Influence */}
        <div className="border border-foreground/10 p-4 mb-6">
          <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-2">Key Influence</p>
          <p className="font-mono text-xs text-foreground/80 leading-relaxed">{contributor.keyInfluence}</p>
        </div>

        {/* My Take */}
        {contributor.myTake && (
          <div className="border border-foreground/20 bg-foreground/[0.02] p-4 mb-6">
            <p className="font-mono text-[10px] text-foreground/60 uppercase tracking-widest mb-2">💡 My Take</p>
            <p className="font-mono text-[11px] text-foreground/70 leading-relaxed">{contributor.myTake}</p>
          </div>
        )}

        {/* Resources */}
        {contributor.resources && contributor.resources.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={12} className="text-muted-foreground/40" />
              <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">Key Resources</p>
            </div>
            <div className="space-y-2">
              {contributor.resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 border border-border hover:border-foreground/20 transition-colors group"
                >
                  <span className="text-xs mt-0.5">{RESOURCE_ICONS[res.type] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {res.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-muted-foreground/30 capitalize">{res.type}</span>
                      {res.year && <span className="font-mono text-[9px] text-muted-foreground/20">{res.year}</span>}
                    </div>
                  </div>
                  <ExternalLink size={8} className="text-muted-foreground/20 group-hover:text-foreground/40 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {contributor.milestones && contributor.milestones.length > 0 && (
          <div className="mb-6">
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-3">Milestones</p>
            <div className="relative pl-4">
              <div className="absolute left-1 top-1 bottom-1 w-px bg-border" />
              {contributor.milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3 mb-2 relative">
                  <div className="absolute left-[-12px] top-1.5 w-2 h-2 border border-border bg-background rounded-full" />
                  <span className="font-mono text-[9px] text-muted-foreground/30 shrink-0 w-8">{m.year}</span>
                  <span className="font-mono text-[10px] text-muted-foreground leading-relaxed">{m.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">AI Segment</p>
            <p className="font-mono text-xs" style={{ color }}>{contributor.segment}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">Specialty</p>
            <div className="flex flex-wrap gap-1">
              {contributor.specialty.map((s) => (
                <span key={s} className="font-mono text-[10px] border border-border px-1.5 py-0.5 text-muted-foreground/60">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">Country</p>
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-muted-foreground/40" />
              <span className="font-mono text-xs text-muted-foreground">{contributor.country}</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">Education</p>
            <div className="flex items-start gap-1">
              <GraduationCap size={10} className="text-muted-foreground/40 mt-0.5 shrink-0" />
              <span className="font-mono text-[10px] text-muted-foreground leading-relaxed">{contributor.education}</span>
            </div>
          </div>
        </div>

        {/* Awards */}
        {contributor.awards && (
          <div className="mb-6">
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">Awards</p>
            <div className="flex items-start gap-1">
              <Award size={10} className="text-muted-foreground/40 mt-0.5 shrink-0" />
              <span className="font-mono text-[10px] text-muted-foreground leading-relaxed">{contributor.awards}</span>
            </div>
          </div>
        )}

        {/* Connected Contributors */}
        {connectedContributors.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={12} className="text-muted-foreground/40" />
              <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">Connected To</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {connectedContributors.map((c) => {
                if (!c) return null;
                const cColor = SEGMENT_COLORS[c.segment] || "#888";
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectContributor?.(c.id)}
                    className="font-mono text-[9px] px-2 py-1 border border-border text-muted-foreground/50 hover:text-foreground hover:border-foreground/20 transition-all"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                      style={{ backgroundColor: cColor }}
                    />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="border-t border-border pt-4">
          <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-3">Links</p>
          <div className="flex flex-wrap gap-2">
            {contributor.twitter && (
              <a href={contributor.twitter} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground/60 hover:text-foreground border border-border px-2 py-1 transition-colors">
                𝕏 <ExternalLink size={8} />
              </a>
            )}
            {contributor.website && (
              <a href={contributor.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground/60 hover:text-foreground border border-border px-2 py-1 transition-colors">
                Web <ExternalLink size={8} />
              </a>
            )}
            {contributor.github && (
              <a href={contributor.github} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground/60 hover:text-foreground border border-border px-2 py-1 transition-colors">
                GitHub <ExternalLink size={8} />
              </a>
            )}
            {contributor.googleScholar && (
              <a href={contributor.googleScholar} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground/60 hover:text-foreground border border-border px-2 py-1 transition-colors">
                Scholar <ExternalLink size={8} />
              </a>
            )}
            {contributor.youtube && (
              <a href={contributor.youtube} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground/60 hover:text-foreground border border-border px-2 py-1 transition-colors">
                YouTube <ExternalLink size={8} />
              </a>
            )}
          {contributor.linkedin && (
              <a href={contributor.linkedin} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] text-foreground/60 hover:text-foreground border border-border px-2 py-1 transition-colors">
                <Linkedin size={10} /> LinkedIn <ExternalLink size={8} />
              </a>
            )}
          </div>
        </div>

        {/* View Full Profile */}
        <div className="border-t border-border pt-4 mt-4">
          <Link
            to={`/ai-contributors/${contributor.id}`}
            className="w-full flex items-center justify-center gap-2 border border-foreground px-4 py-3 font-mono text-xs text-foreground hover:bg-foreground hover:text-background transition-all tracking-widest uppercase"
          >
            View Full Profile <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AIContributorProfile;
