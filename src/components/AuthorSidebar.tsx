"use client";
import { Linkedin, Mail, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-shim";
import authorPhoto from "@/assets/venkata-pagadala.jpeg";

const AuthorSidebar = () => (
  <aside className="hidden lg:block lg:w-52 shrink-0">
    <div className="sticky top-28">
      <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-4">
        About the Author
      </p>

      <img
        src={authorPhoto}
        alt="Venkata Pagadala"
        className="w-16 h-16 rounded-full object-cover border border-border mb-3"
      />

      <h3 className="font-display text-sm font-bold text-foreground mb-1">
        Venkata Pagadala
      </h3>
      <p className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed mb-4">
        AI Systems Architect & Venture Builder. Building the future of search and agentic automation. Harvard &amp; MIT certified.
      </p>

      {/* LinkedIn Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
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

      {/* Links */}
      <div className="space-y-1.5 mb-5">
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

      {/* Explore More */}
      <p className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest mb-2">
        Explore
      </p>
      <div className="space-y-1">
        <Link
          to="/about"
          className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          About Me
        </Link>
        <Link
          to="/solutions"
          className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          Solutions
        </Link>
        <Link
          to="/publications"
          className="block font-mono text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          Lab & Research
        </Link>
      </div>
    </div>
  </aside>
);

export default AuthorSidebar;
