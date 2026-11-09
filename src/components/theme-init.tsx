"use client";

import { useServerInsertedHTML } from "next/navigation";

// Sets the saved/system theme before React hydrates so there's no flash of
// the wrong theme. useServerInsertedHTML injects this into the SSR HTML
// *outside* the React component tree, so React never re-renders the script
// during client hydration — avoiding the React 19 "script tag while rendering
// component" warning while still running before first paint.
const THEME_INIT_SCRIPT = `(function () {
  var saved = null;
  try { saved = localStorage.getItem("code-visualizer-theme"); } catch (e) {}
  var dark =
    saved === "dark" ||
    (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();`;

export function ThemeInitScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  ));
  return null;
}
