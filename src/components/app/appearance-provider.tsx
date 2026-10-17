"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { THEME_KEY, type ThemePreference } from "@/lib/appearance";

type Appearance = {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
};

const AppearanceContext = createContext<Appearance | null>(null);

// The theme preference lives in localStorage; this tiny store lets React
// subscribe to it (and to the system dark-mode setting) without effects.
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

function getTheme(): ThemePreference {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemePreference | null) ?? "system";
  } catch {
    return "system";
  }
}

const getSystemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as const);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark, () => true);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode etc. - the choice just won't be remembered.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return (
    <AppearanceContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance must be used inside AppearanceProvider");
  return value;
}
