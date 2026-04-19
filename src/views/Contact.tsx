"use client";
import ScrollReveal from "@/components/ScrollReveal";
import ParticleCanvas from "@/components/ParticleCanvas";
import ContactForm from "@/components/ContactForm";
import NewsletterForm from "@/components/NewsletterForm";
import PageSidebar from "@/components/PageSidebar";
import { Mail, MapPin, Linkedin } from "lucide-react";
import SEO from "@/components/SEO";

const tocSections = [
  { label: "Send a Message", id: "send-message" },
  { label: "Email", id: "email" },
  { label: "LinkedIn", id: "linkedin" },
  { label: "Location", id: "location" },
  { label: "Newsletter", id: "newsletter" },
];

const Contact = () => {

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative">
      <SEO
        title="Contact | Venkata Pagadala — AI & SEO Consulting"
        description="Get in touch with Venkata Pagadala for AI systems consulting, enterprise SEO, and technical product management."
        canonical="https://venkatapagadala.com/contact"
      />
      <ParticleCanvas />

      <div className="max-w-4xl mx-auto relative z-10">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            {"{05}"} — Contact
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-16">
            Get in Touch
          </h1>
        </ScrollReveal>

        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="Contact Venkata Pagadala — AI & SEO Consulting" />

          <div className="flex-1 min-w-0">
            <div className="max-w-md mx-auto lg:mx-0">
              <ScrollReveal>
                <div className="space-y-8">
                  <div id="send-message" className="scroll-mt-28">
                    <span className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-3 font-mono">Send a Message</span>
                    <div className="border border-border/40 px-6 py-5">
                      <ContactForm />
                    </div>
                  </div>

                  <div id="email" className="scroll-mt-28">
                    <a
                      href="mailto:vdepagadala@gmail.com"
                      className="flex items-center gap-4 font-mono text-sm text-muted-foreground hover:text-foreground transition-all group border border-border/40 hover:border-foreground/30 px-6 py-4"
                    >
                      <Mail size={18} className="group-hover:text-foreground transition-all" />
                      <div>
                        <span className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-1">Email</span>
                        vdepagadala@gmail.com
                      </div>
                    </a>
                  </div>

                  <div id="linkedin" className="scroll-mt-28 space-y-8">
                    <a
                      href="https://www.linkedin.com/in/venkata-pagadala/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 font-mono text-sm text-muted-foreground hover:text-foreground transition-all group border border-border/40 hover:border-foreground/30 px-6 py-4"
                    >
                      <Linkedin size={18} className="group-hover:text-foreground transition-all" />
                      <div>
                        <span className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-1">Follow & Connect</span>
                        linkedin.com/in/venkata-pagadala
                      </div>
                    </a>

                    <a
                      href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7434105581101133824"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 font-mono text-sm text-muted-foreground border border-border/40 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all px-6 py-4"
                    >
                      <Linkedin size={18} />
                      <span className="tracking-widest uppercase text-xs font-bold">Subscribe on LinkedIn</span>
                    </a>
                  </div>

                  <div id="location" className="scroll-mt-28">
                    <div className="flex items-center gap-4 font-mono text-sm text-muted-foreground border border-border/40 px-6 py-4">
                      <MapPin size={18} />
                      <div>
                        <span className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-1">Location</span>
                        Atlanta, GA
                      </div>
                    </div>
                  </div>

                  <div id="newsletter" className="scroll-mt-28">
                    <div className="border border-border/40 px-6 py-4">
                      <span className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-3 font-mono">Subscribe to Newsletter</span>
                      <NewsletterForm source="contact_page" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-mono text-[10px] text-muted-foreground/40">
                © 2026 Venkata Pagadala. All rights reserved.
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/40">
                Built with precision.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
