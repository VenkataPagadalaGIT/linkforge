"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { TocItem } from "@/components/PageSidebar";

/**
 * MobileToc — collapsible jump-to nav for mobile and tablet.
 *
 * The desktop sidebar TOC is hidden below `lg`, so mobile readers lose all
 * navigation on a 13-section, 16-minute article. This restores it without
 * stealing vertical space — closed by default, opens on tap, scrolls smoothly
 * to the anchor (matching the desktop sidebar's behavior).
 */

const MobileToc = ({ sections }: { sections: TocItem[] }) => {
  const [open, setOpen] = useState(false);
  if (!sections.length) return null;

  const jump = (id: string) => {
    setOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <nav
      aria-label="On this page"
      className="lg:hidden border border-border bg-card/40 mb-10"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>
          On this page <span className="text-muted-foreground/70">· {sections.length}</span>
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="border-t border-border px-2 py-2">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => jump(s.id)}
                className="w-full text-left font-mono text-xs text-muted-foreground hover:text-foreground py-2 px-2 transition-colors"
              >
                → {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

export default MobileToc;
