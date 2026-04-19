"use client";
import { useState, useEffect } from "react";
import { Link, useLocation } from "@/lib/router-shim";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Notebook", to: "/notebook" },
  { label: "AI Updates", to: "/ai-updates" },
  { label: "Lab", to: "/publications" },
  { label: "Insights", to: "/insights" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-mono text-sm tracking-widest text-foreground hover:text-glow transition-all">
            VP_
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-mono text-xs tracking-wider uppercase transition-all hover:text-foreground ${
                   location.pathname === link.to || 
                   (link.to === "/solutions" && location.pathname.startsWith("/solutions")) ||
                   (link.to === "/notebook" && location.pathname.startsWith("/notebook")) ||
                   (link.to === "/ai-updates" && location.pathname.startsWith("/ai-updates"))
                     ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-md flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-mono text-lg tracking-widest uppercase transition-all ${
                location.pathname === link.to ? "text-foreground text-glow" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;
