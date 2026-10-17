"use client";

import { useSyncExternalStore } from "react";
import type { ModuleId } from "@/config/learn/modules";

// Learning progress lives on this device until Supabase is connected; then it
// moves to user_cards. Kept tiny on purpose.

const KEY = "wa-learn-v1";
type Progress = { completed: ModuleId[] };

const EMPTY: Progress = { completed: [] };
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Progress } = { raw: null, value: EMPTY };

function read(): Progress {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.value;
  let value = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as Progress) : EMPTY;
    value = Array.isArray(parsed.completed) ? parsed : EMPTY;
  } catch {
    value = EMPTY;
  }
  cache = { raw, value };
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useLearnProgress() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Marks a module as done. Returns true if it was new (card just unlocked). */
export function completeModule(id: ModuleId) {
  const current = read();
  if (current.completed.includes(id)) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ completed: [...current.completed, id] }));
  } catch {
    // Private mode: progress just isn't kept.
  }
  listeners.forEach((listener) => listener());
  return true;
}
