"use client";
import ScrollReveal from "@/components/ScrollReveal";
import ParticleCanvas from "@/components/ParticleCanvas";
import { Mail, Linkedin } from "lucide-react";
import SEO from "@/components/SEO";
import { LINKEDIN_URL, PROFILE } from "@/data/profile";

/**
 * Contact is two ways in and nothing else: email, and LinkedIn. The message
 * form, the location card and the newsletter signup were removed at the
 * owner's request (2026-10-23); the site footer still carries the signup.
 */
const Contact = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative">
      <SEO
        title="Contact | Venkata Pagadala: AI & SEO Consulting"
        description="Email Venkata Pagadala or connect with him on LinkedIn about engagements, collaborations, research, speaking invitations and podcast guest spots."
        canonical="https://venkatapagadala.com/contact"
      />
      <ParticleCanvas />

      <div className="max-w-xl mx-auto relative z-10">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">{"{05}"} · Contact</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-6">Get in Touch</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12">
            Email is the fastest way to reach me. For what I am working on, follow me on LinkedIn or subscribe to the
            newsletter there.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="space-y-4">
            <a
              id="email"
              href={`mailto:${PROFILE.email}`}
              className="scroll-mt-28 flex items-center gap-4 font-mono text-sm text-muted-foreground hover:text-foreground transition-all group border border-border hover:border-foreground/40 px-6 py-5"
            >
              <Mail size={18} className="group-hover:text-foreground transition-all" aria-hidden="true" />
              <span>
                <span className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Email</span>
                <span className="text-foreground">{PROFILE.email}</span>
              </span>
            </a>

            <a
              id="linkedin"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="scroll-mt-28 flex items-center gap-4 font-mono text-sm text-muted-foreground hover:text-foreground transition-all group border border-border hover:border-foreground/40 px-6 py-5"
            >
              <Linkedin size={18} className="group-hover:text-foreground transition-all" aria-hidden="true" />
              <span>
                <span className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Follow & connect on LinkedIn</span>
                <span className="text-foreground">linkedin.com/in/venkata-pagadala</span>
              </span>
            </a>

            <a
              href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7434105581101133824"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 font-mono text-sm text-muted-foreground border border-border hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all px-6 py-4"
            >
              <Linkedin size={18} aria-hidden="true" />
              <span className="tracking-widest uppercase text-xs font-bold">Subscribe on LinkedIn</span>
            </a>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Contact;
