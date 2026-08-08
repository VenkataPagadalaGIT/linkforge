import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Venkata Pagadala", url: SITE_URL }],
  creator: "Venkata Pagadala",
  publisher: "Venkata Pagadala",
  keywords: [
    "Venkata Pagadala",
    "Mono Mind",
    "AI systems architect",
    "AI research",
    "AI contributors encyclopedia",
    "AI updates",
    "AI engineering notebook",
    "business AI",
    "machine learning insights",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/rss.xml", title: "Venkata Pagadala · AI Updates RSS" },
      ],
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // favicon.png was JPEG data served as image/png, and favicon.ico was a
  // single 256px image weighing 125KB for a 16px slot. Both are now real
  // files at real sizes.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// This node is the one canonical description of the person. Pages across the
// site reference it as { "@id": SITE_URL + "/#person" }; without the @id here
// every one of those references dangled.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "Venkata Pagadala",
  url: SITE_URL,
  image: OG_IMAGE,
  jobTitle: "AI Systems Architect",
  description: SITE_DESCRIPTION,
  sameAs: [
    "https://github.com/VenkataPagadalaGIT",
    "https://linkedin.com/in/venkatapagadala",
  ],
  affiliation: { "@type": "Organization", name: "AT&T" },
  knowsAbout: [
    "Enterprise SEO",
    "Answer Engine Optimization",
    "Knowledge graphs",
    "AI agents",
    "Technical SEO",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/insights?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Set theme class BEFORE first paint to prevent flash of wrong theme */}
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <Providers>
            <Navbar />
            <main id="main" className="min-h-[calc(100vh-8rem)]">
              <Suspense fallback={null}>{children}</Suspense>
            </main>
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
