"use client";
import { Link, useLocation } from "@/lib/router-shim";
import { ArrowRight, Linkedin, Mail as MailIcon } from "lucide-react";
import KitSignupForm from "@/components/KitSignupForm";

const Footer = () => {
  const location = useLocation();
  // Admin/CMS pages don't need the public marketing footer.
  if (location.pathname?.startsWith("/admin")) return null;

  const links = [
    { label: "About", to: "/about" },
    { label: "Lab", to: "/publications" },
    { label: "Solutions", to: "/solutions" },
    { label: "Insights", to: "/insights" },
    { label: "Contact", to: "/contact" },
  ];

  const notebookLinks = [
    { label: "AI Notebook", to: "/notebook/ai" },
    { label: "Top 100 Contributors", to: "/notebook/ai" },
    { label: "Learning Roadmap", to: "/notebook/ai/roadmap" },
    { label: "Concepts Encyclopedia", to: "/notebook/ai/encyclopedia" },
    { label: "Business Notebook", to: "/notebook/business" },
    { label: "Conference Notebook", to: "/notebook/conference" },
  ];

  const files = [
    { name: "llms.txt", path: "/llms.txt" },
    { name: "sitemap.xml", path: "/sitemap.xml" },
    { name: "rss.xml", path: "/rss.xml" },
    { name: "robots.txt", path: "/robots.txt" },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-display text-lg font-bold text-foreground">
              Venkata Pagadala
            </Link>
            <p className="font-mono text-[11px] text-muted-foreground/60 mt-3 leading-relaxed">
              AI Systems Builder & Researcher. Production AI, business intelligence, and enterprise search at scale.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a href="https://www.linkedin.com/in/venkata-pagadala/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <Linkedin size={14} />
              </a>
              <a href="mailto:vdepagadala@gmail.com" className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <MailIcon size={14} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mb-4">Navigate</p>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="font-mono text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Notebook */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mb-4">AI Notebook</p>
            <ul className="space-y-2">
              {notebookLinks.map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="font-mono text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mb-4">For Machines</p>
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.name}>
                  <a href={f.path} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">
                    {f.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mb-4">Newsletter</p>
            <p className="font-mono text-[11px] text-muted-foreground/60 leading-relaxed mb-3">
              Get AI & SEO insights delivered to your inbox.
            </p>
            <KitSignupForm />
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 font-mono text-[11px] text-foreground hover:text-muted-foreground transition-colors mt-4"
            >
              Get in touch <ArrowRight size={10} />
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-muted-foreground/30">
            © {new Date().getFullYear()} Venkata Pagadala. All rights reserved.
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/20">
            Atlanta, GA · 33.7490° N, 84.3880° W
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
