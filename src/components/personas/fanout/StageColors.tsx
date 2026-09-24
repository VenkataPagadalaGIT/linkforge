/**
 * The journey stage accents are tokens in app/globals.css (--stage-discover
 * and friends), defined for both themes the way every other accent on the
 * site is: a -700 shade on light, a -300 shade on dark. Inline styles cannot
 * read the theme, so consumers name the token and the theme supplies the
 * value; the fallback keeps a wire visible if the stylesheet is ever absent.
 */
export const stageVar = (id: string) => `var(--stage-${id}, currentColor)`;
