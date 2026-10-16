"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { DEFAULT_LOOK, LOOK_KEY, THEME_KEY, type Look, type ThemePreference } from "@/lib/appearance";

type Appearance = {
  look: Look;
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setLook: (look: Look) => void;
  setTheme: (theme: ThemePreference) => void;
};

const AppearanceContext = createContext<Appearance | null>(null);

// Look and theme live in localStorage; this tiny store lets React subscribe
// to them (and to the system dark-mode setting) without effects.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode etc. - the choice just won't be remembered.
  }
  listeners.forEach((listener) => listener());
}

const getLook = () => (read(LOOK_KEY) as Look | null) ?? DEFAULT_LOOK;
const getTheme = () => (read(THEME_KEY) as ThemePreference | null) ?? "system";
const getSystemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const look = useSyncExternalStore(subscribe, getLook, () => DEFAULT_LOOK);
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as const);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark, () => true);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.look = look;
    root.dataset.theme = resolvedTheme;
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  }, [look, resolvedTheme]);

  const setLook = useCallback((next: Look) => write(LOOK_KEY, next), []);
  const setTheme = useCallback((next: ThemePreference) => write(THEME_KEY, next), []);

  return (
    <AppearanceContext.Provider value={{ look, theme, resolvedTheme, setLook, setTheme }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance must be used inside AppearanceProvider");
  return value;
}
