/**
 * Inline blocking script that runs BEFORE React hydration to set the
 * correct theme class on <html>. This eliminates the "flash of incorrect
 * theme" (FOIT/FOUC) on first paint — without it, every page would briefly
 * show the default theme before the React effect kicks in.
 *
 * Mirrors the logic in ThemeProvider: read localStorage → fallback to
 * `prefers-color-scheme`. Deliberately tiny (no imports) so it can ship
 * inline in <head>.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('vp-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved;
    if (stored === 'light') resolved = 'light';
    else if (stored === 'dark') resolved = 'dark';
    else resolved = prefersDark ? 'dark' : 'light';
    var root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  } catch (e) {
    // Fail silently — default class on <html> remains.
  }
})();
`.trim();

export const ThemeScript: React.FC = () => (
  <script dangerouslySetInnerHTML={{ __html: themeScript }} />
);

export default ThemeScript;
