/**
 * Date-only strings, formatted without the off-by-one.
 *
 * `new Date("2026-07-27")` is specified to parse as UTC midnight. Formatting
 * that in any timezone west of UTC renders the previous day, so every article
 * date on this site was showing one day early for US readers. Anchoring to
 * midday local time removes the ambiguity in both directions.
 */
function localFromDateOnly(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
}

/** "July 27, 2026" */
export function formatDateLong(value: string): string {
  return localFromDateOnly(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "Jul 27, 2026" */
export function formatDateShort(value: string): string {
  return localFromDateOnly(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** For sitemap lastModified and <time dateTime> attributes. */
export function toDate(value: string): Date {
  return localFromDateOnly(value);
}
