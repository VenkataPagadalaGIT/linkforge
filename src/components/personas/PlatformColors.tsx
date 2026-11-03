import { PLATFORMS, PLATFORM_LIGHT } from "@/data/personas";

/**
 * Per-platform colour custom properties, defined for both themes.
 *
 * Charts set fills inline, and an inline style cannot know the theme, so a
 * near-white brand colour rendered an invisible bar on a light ground. These
 * variables move the decision into CSS, where the theme IS known.
 *
 * Scoped to this site's own convention: globals.css puts light on bare :root
 * and dark on `.dark`. The first version of this used [data-theme] and
 * prefers-color-scheme, which is the common pattern and not the one here, so
 * it matched nothing and changed nothing. Follow the project, not the habit.
 *
 * Rendered once near the root; components then use var(--pf-<id>).
 */
export default function PlatformColors() {
  const light = PLATFORMS.map((p) => `--pf-${p.id}:${PLATFORM_LIGHT[p.id] ?? p.color}`).join(";");
  const dark = PLATFORMS.map((p) => `--pf-${p.id}:${p.color}`).join(";");
  const css = `:root{${light}}.dark{${dark}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
