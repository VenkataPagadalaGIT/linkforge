/**
 * conferenceLd.ts: schema.org builders for the Conference Notebook.
 *
 * One place decides how a conference's venue and a session's time become
 * structured data, so the conference page and every session page describe the
 * same event the same way. It exists because they did not: each page shipped
 * two Event blocks, one from the route and one from its view, that disagreed
 * on the location, the date format and even the event's URL, and the route's
 * session block read a `venue` field the data no longer has, so every session
 * was placed in a city instead of a venue.
 */
import type { Conference } from "@/data/conferences";

/** The conference's venue as a schema.org Place with a structured address. */
export function conferencePlace(c: Pick<Conference, "venues" | "city" | "country">) {
  const v = c.venues?.[0];
  if (!v) {
    return {
      "@type": "Place",
      name: `${c.city}, ${c.country}`,
      address: { "@type": "PostalAddress", addressLocality: c.city, addressCountry: c.country },
    };
  }
  return {
    "@type": "Place",
    name: v.name,
    address: {
      "@type": "PostalAddress",
      ...(v.address ? { streetAddress: v.address } : {}),
      addressLocality: v.city,
      addressCountry: v.country,
    },
    ...(v.url ? { url: v.url } : {}),
  };
}

const MONTHS: Record<string, string> = {
  January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
  July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
};

/** "Monday, April 27, 2026" to "2026-04-27". */
export function isoDate(label: string): string | undefined {
  const m = label.match(/(\w+), (\w+) (\d{1,2}), (\d{4})/);
  if (!m || !MONTHS[m[2]]) return undefined;
  return `${m[4]}-${MONTHS[m[2]]}-${m[3].padStart(2, "0")}`;
}

/** A day label plus "9:00 AM" to "2026-04-27T09:00:00"; the day alone when the time does not parse. */
export function isoDateTime(dayDate: string, time: string): string | undefined {
  const d = isoDate(dayDate);
  if (!d) return undefined;
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return d;
  let h = parseInt(m[1], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${d}T${String(h).padStart(2, "0")}:${m[2]}:00`;
}
