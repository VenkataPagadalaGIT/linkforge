/**
 * Serialise JSON-LD safely into a <script> tag.
 *
 * JSON.stringify does not escape "</script>", so any string containing it
 * closes the tag early and everything after is parsed as HTML. Nothing in the
 * corpus contains one today, but the corpus ingests external content: USAFacts
 * answer prose, claims lifted from competitor pages. "Not exploitable today"
 * is a property of the data, not of the code, and the data changes on every
 * crawl.
 *
 * Escaping < and the line separators U+2028 and U+2029 (legal in JSON, illegal
 * inside a JavaScript string literal) makes it a property of the code instead.
 */
export function jsonLdScript(data: unknown): string {
  return escapeJsonLd(JSON.stringify(data));
}

/**
 * The same escaping for callers that already hold serialised JSON. Passing
 * such a string to jsonLdScript would stringify it a second time and emit a
 * quoted string where the object should be, so this is the entry point for
 * anything downstream of a JSON.stringify it does not own.
 */
export function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
