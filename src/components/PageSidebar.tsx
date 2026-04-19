"use client";
import { useState, useEffect } from "react";
import { Linkedin, Copy, Check } from "lucide-react";

export interface TocItem {
  label: string;
  id: string;
}

interface PageSidebarProps {
  sections: TocItem[];
  shareTitle?: string;
  shareDescription?: string;
  /** Called when a TOC item is clicked */
  onSectionClick?: (id: string) => void;
  /** Extra content to render below the TOC */
  children?: React.ReactNode;
}

const PageSidebar = ({ sections, shareTitle, shareDescription, onSectionClick, children }: PageSidebarProps) => {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = shareTitle || document.title;

  return (
    <aside className="hidden lg:block lg:w-48 shrink-0">
      <div className="sticky top-28">
        {/* On This Page */}
        {sections.length > 0 && (
          <>
            <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-3">On This Page</p>
            <nav className="space-y-0.5 mb-6 border-l border-border">
              {sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onSectionClick) {
                      onSectionClick(item.id);
                    }
                    // Always scroll to the element if it exists
                    setTimeout(() => {
                      const el = document.getElementById(item.id);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }, 50);
                    setActiveId(item.id);
                  }}
                  className={`block w-full text-left font-mono text-[10px] py-1.5 border-l-2 pl-3 -ml-px transition-colors ${
                    activeId === item.id
                      ? "text-foreground border-foreground/50"
                      : "text-muted-foreground/40 border-transparent hover:text-foreground hover:border-foreground/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </>
        )}

        {/* Share */}
        <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-2">Share</p>
        <div className="space-y-1 mb-4">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground py-1 pl-3 transition-colors"
          >
            𝕏 Post
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/40 hover:text-foreground py-1 pl-3 transition-colors"
          >
            <Linkedin size={9} /> LinkedIn
          </a>
        </div>

        {/* Ask AI */}
        <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-2">Ask AI</p>
        <div className="space-y-1 mb-4">
          <a
            href={`https://chatgpt.com/?q=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground py-1 pl-3 transition-colors"
          >
            ChatGPT
          </a>
          <a
            href={`https://www.perplexity.ai/search?q=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground py-1 pl-3 transition-colors"
          >
            Perplexity
          </a>
          <a
            href={`https://gemini.google.com/app?q=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground py-1 pl-3 transition-colors"
          >
            Gemini
          </a>
        </div>

        {/* Copy URL */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/40 hover:text-foreground py-1 pl-3 transition-colors"
        >
          {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy URL</>}
        </button>

        {children}
      </div>
    </aside>
  );
};

export default PageSidebar;
