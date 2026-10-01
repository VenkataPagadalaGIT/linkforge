"use client";

/**
 * No-op replacement for react-helmet-async.
 * Real SEO metadata is handled server-side via Next.js `metadata` exports
 * in each app/<route>/page.tsx file. This shim keeps legacy <Helmet>/<HelmetProvider>
 * imports from the Lovable source working without adding client-only meta tags
 * that crawlers may miss.
 *
 * We still render JSON-LD <script> tags from Helmet children because those are
 * often set inside components and are useful for AI bots. Everything else is
 * swallowed (Next's <head> handles it).
 */
import * as React from "react";
import { escapeJsonLd } from "@/lib/jsonld";

export const HelmetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

type HelmetChild = React.ReactElement<{ type?: string; children?: React.ReactNode }>;

export const Helmet = ({ children }: { children?: React.ReactNode }) => {
  // Extract only JSON-LD script tags and render them inline so they're present in DOM
  const scripts: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as HelmetChild;
    if (el.type === "script") {
      const props = el.props as { type?: string; children?: React.ReactNode };
      if (props.type === "application/ld+json") {
        scripts.push(
          <script
            key={scripts.length}
            type="application/ld+json"
            // These children are already JSON.stringify output, which does
            // not escape "</script>", U+2028 or U+2029. Escape the serialised
            // string; stringifying it again would emit a quoted string where
            // the object belongs.
            dangerouslySetInnerHTML={{ __html: escapeJsonLd(String(props.children ?? "")) }}
          />
        );
      }
    }
  });
  if (scripts.length === 0) return null;
  return <>{scripts}</>;
};
