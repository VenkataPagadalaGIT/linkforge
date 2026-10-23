import { Facebook, Github, GraduationCap, Instagram, Linkedin, Presentation, Youtube } from "lucide-react";
import type { SocialId } from "@/data/profile";

/**
 * One icon per profile in src/data/profile.ts. Lucide has no X or Substack
 * mark, so those two are the Simple Icons paths (CC0), drawn in currentColor
 * like the rest. Always decorative: every link that shows one also carries
 * the platform's name as text or as its accessible label.
 */
export default function SocialIcon({ id, size = 16 }: { id: SocialId; size?: number }) {
  const common = { size, "aria-hidden": true, strokeWidth: 1.75 } as const;
  switch (id) {
    case "linkedin":
      return <Linkedin {...common} />;
    case "youtube":
      return <Youtube {...common} />;
    case "instagram":
      return <Instagram {...common} />;
    case "facebook":
      return <Facebook {...common} />;
    case "github":
      return <Github {...common} />;
    case "scholar":
      return <GraduationCap {...common} />;
    case "speakerdeck":
      return <Presentation {...common} />;
    case "x":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
      );
    case "substack":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
        </svg>
      );
  }
}
