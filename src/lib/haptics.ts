"use client";

/**
 * Haptic "clicks" in three strengths.
 *
 * - Native app (Capacitor, later): real Taptic Engine impacts - light/medium/heavy.
 * - Android browsers: vibration of different lengths.
 * - iPhone Safari (iOS 18+): the web has no vibration API there. The only
 *   available tick is the one iOS plays when a switch toggles, so we toggle a
 *   hidden switch. It has a single strength - "major" plays it twice so it
 *   still feels different. Elsewhere this silently does nothing.
 */
export type Haptic = "minor" | "medium" | "major";

type CapacitorHaptics = { impact: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void> };

const MIN_GAP_MS = 28;
let last = 0;
let iosSwitch: HTMLLabelElement | null = null;

function capacitorHaptics(): CapacitorHaptics | undefined {
  const w = window as unknown as { Capacitor?: { Plugins?: { Haptics?: CapacitorHaptics } } };
  return w.Capacitor?.Plugins?.Haptics;
}

function isIOS() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function iosTick() {
  if (!iosSwitch) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.id = "wa-haptic-switch";
    const label = document.createElement("label");
    label.htmlFor = input.id;
    for (const el of [input, label]) {
      el.setAttribute("aria-hidden", "true");
      el.tabIndex = -1;
      Object.assign(el.style, {
        position: "fixed",
        width: "1px",
        height: "1px",
        opacity: "0",
        pointerEvents: "none",
        left: "-10px",
        top: "0",
      });
    }
    document.body.append(input, label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

export function tick(kind: Haptic = "minor") {
  if (typeof window === "undefined") return;
  const now = performance.now();
  if (now - last < MIN_GAP_MS && kind === "minor") return;
  last = now;

  const native = capacitorHaptics();
  if (native) {
    native
      .impact({ style: kind === "major" ? "HEAVY" : kind === "medium" ? "MEDIUM" : "LIGHT" })
      .catch(() => {});
    return;
  }
  if ("vibrate" in navigator) {
    navigator.vibrate(kind === "major" ? 22 : kind === "medium" ? 12 : 5);
    return;
  }
  if (isIOS()) {
    iosTick();
    if (kind === "major") setTimeout(iosTick, 70);
  }
}
