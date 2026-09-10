import { PLATFORMS, PLATFORM_LIGHT } from "@/data/personas";

/**
 * Per-platform colour custom properties, defined for both themes.
 *
 * Charts set fills inline, and an inline style cannot know the theme, so a
 * near-white brand colour rendered an invisible bar on a light ground. These
 * variables move the decision into CSS where the theme is known, using the
 * same three-state pattern as the rest of the site: bare :root is light,
 * prefers-color-scheme handles the unstamped default, and [data-theme] wins
 * over both when the viewer has chosen.
 *
 * Rendered once near the root; components then use var(--pf-<id>).
 */
export default function PlatformColors() {
  const light = PLATFORMS.map((p) => `--pf-${p.id}:${PLATFORM_LIGHT[p.id] ?? p.color}`).join(";");
  const dark = PLATFORMS.map((p) => `--pf-${p.id}:${p.color}`).join(";");
  const css =
    `:root{${light}}` +
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark}}}` +
    `:root[data-theme="dark"]{${dark}}` +
    `:root[data-theme="light"]{${light}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
