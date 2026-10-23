import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { LINKEDIN_STATS, PROFILE, SOCIAL_PROFILES, compactStat, personJsonLd, yearsInSearch } from "@/data/profile";

const stat = (prefix: string) => compactStat(LINKEDIN_STATS.find((s) => s.label.startsWith(prefix))?.value ?? "");

/**
 * The AI twin's half of the banner text, laid over the human column and
 * revealed right of the seam (TwinSeam). Where the human column says who he
 * is in words, the twin shows what machines read about the same person: the
 * site's own schema.org Person node (personJsonLd, the object every page
 * ships) and the sourced LinkedIn numbers. Nothing is invented for the
 * effect; it is the page's own data, rendered for a machine.
 *
 * Wide screens only (CSS hides it below lg), and hidden from assistive
 * technology: the human column already says all of it, and the one link
 * leads to the section right under the banner.
 */
export default function TwinReadout() {
  const person = personJsonLd();
  const knows = (person.knowsAbout as string[]) ?? [];
  const rows: [string, string][] = [
    ["@type", String(person["@type"])],
    ["name", PROFILE.name],
    ["knowsAbout", `${knows.slice(0, 2).join(" · ")}${knows.length > 2 ? ` · +${knows.length - 2} more` : ""}`],
    ["sameAs", `${SOCIAL_PROFILES.length} public profiles`],
    ["signals", `${stat("Post impressions")} impressions · ${stat("LinkedIn followers")} followers`],
    ["inSearch", `${yearsInSearch()}+ years`],
  ];
  return (
    <div className="twin-ai absolute inset-0 text-left" aria-hidden="true">
      <p className="twin-ink mb-4 font-mono text-xs uppercase tracking-[0.3em]">[ AI twin · what machines read ]</p>
      <p className="twin-ink twin-glow mb-5 whitespace-nowrap font-mono text-4xl font-bold tracking-tight xl:text-5xl">
        venkata_pagadala<span className="opacity-60">.ai</span>
        <span className="twin-caret" />
      </p>
      <dl className="mb-7 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 font-mono text-xs xl:text-sm">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="twin-ink opacity-60">{k}</dt>
            <dd className="twin-ink">{v}</dd>
          </Fragment>
        ))}
      </dl>
      <a
        href="#linkedin-universe"
        tabIndex={-1}
        className="twin-cta inline-flex items-center gap-3 rounded-full border px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors"
      >
        See what it was trained on
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}
