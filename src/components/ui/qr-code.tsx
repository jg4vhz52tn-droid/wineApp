"use client";

import qrcode from "qrcode-generator";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

/** QR code as crisp SVG modules - dark on a white card so every camera reads it. */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: count, path: d };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      shapeRendering="crispEdges"
      className={cn("rounded-2xl bg-white", className)}
    >
      <path d={path} fill="#1a0f12" />
    </svg>
  );
}
