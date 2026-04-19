"use client";
import { Helmet } from "@/lib/helmet-shim";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  breadcrumbs?: BreadcrumbItem[];
  publishedTime?: string;
  modifiedTime?: string;
}

const OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ef4310c-a642-44ea-b390-81e1664989fd/id-preview-0a5abc9b--ea32d82b-f342-495d-9482-7a7ad7f0e594.lovable.app-1772436089590.png";

const SEO = ({ title, description, canonical, ogType = "website", noindex = false, jsonLd, breadcrumbs, publishedTime, modifiedTime }: SEOProps) => {
  const breadcrumbJsonLd = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url,
    })),
  } : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Venkata Pagadala" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:locale" content="en_US" />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {(ogType === "article") && <meta property="article:author" content="Venkata Pagadala" />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      <link rel="alternate" type="application/rss+xml" title="Venkata Pagadala — AI Updates RSS" href="https://venkatapagadala.com/rss.xml" />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
