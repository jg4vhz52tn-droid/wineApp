export type Look = "a" | "b";
export type ThemePreference = "system" | "light" | "dark";

export const LOOK_KEY = "wa-look";
export const THEME_KEY = "wa-theme";
export const DEFAULT_LOOK: Look = "a";

export const LOOK_LABELS: Record<Look, string> = {
  a: "A · Dunkel & edel",
  b: "B · Hell & klar",
};

// Runs inline in <head> before first paint so there is no flash of the wrong
// look or theme. Keep it dependency-free; it is serialized as a string.
export const appearanceScript = `(() => {
  try {
    var d = document.documentElement;
    var look = localStorage.getItem("${LOOK_KEY}") || "${DEFAULT_LOOK}";
    var pref = localStorage.getItem("${THEME_KEY}") || "system";
    var dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    d.dataset.look = look;
    d.dataset.theme = dark ? "dark" : "light";
  } catch (e) {}
})();`;
