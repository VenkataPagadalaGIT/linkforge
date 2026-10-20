"use client";
import * as React from "react";
import LinkedInUniverse from "./LinkedInUniverse";
import ArchiveFilters from "./ArchiveFilters";
import { LINKEDIN_ENTRIES, entryPath, getEntry } from "@/data/linkedinArchive";
import { useArchiveFilter } from "@/lib/linkedinSearch";

/**
 * The Universe on its own (the home page): its own search, kind and year filters and topic levels, with no archive
 * hub around it. Opening a post goes to its page on this site (a media item opens its file in a new tab).
 */
export default function LinkedInUniverseSection() {
  const f = useArchiveFilter(LINKEDIN_ENTRIES);
  const matching = React.useDeferredValue(f.matching);
  const countIn = React.useDeferredValue(f.countIn);
  const openEntry = React.useCallback((key: string) => {
    const e = getEntry(key);
    if (!e) return;
    if (e.kind === "media") window.open(entryPath(e), "_blank", "noopener,noreferrer");
    else window.location.assign(entryPath(e));
  }, []);
  return (
    <LinkedInUniverse
      standalone
      matching={matching}
      activeTopic={f.topic}
      onTopic={f.setTopic}
      onOpenEntry={openEntry}
      countIn={countIn}
      filters={
        <ArchiveFilters
          compact
          query={f.query}
          onQuery={f.setQuery}
          onSearchFocus={f.loadFullText}
          kind={f.kind}
          onKind={f.setKind}
          kindCounts={f.kindCounts}
          source={f.source}
          onSource={f.setSource}
          sources={f.sources}
          year={f.year}
          onYear={f.setYear}
          years={f.years}
        />
      }
    />
  );
}
