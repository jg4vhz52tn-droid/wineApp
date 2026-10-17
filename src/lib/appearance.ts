export type ThemePreference = "system" | "light" | "dark";

export const THEME_KEY = "wa-theme";

// Runs inline in <head> before first paint so there is no flash of the wrong
// theme. Keep it dependency-free; it is serialized as a string.
export const appearanceScript = `(() => {
  try {
    var pref = localStorage.getItem("${THEME_KEY}") || "system";
    var dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (e) {}
})();`;
