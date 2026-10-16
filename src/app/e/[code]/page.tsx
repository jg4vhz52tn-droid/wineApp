import type { Metadata } from "next";
import { Suspense } from "react";
import { Invitation } from "./invitation";

export const metadata: Metadata = { title: "Einladung", robots: { index: false } };

// Guests land here from the invite link / QR code - no app install, no account.
export default function InvitePage() {
  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Suspense>
        <Invitation />
      </Suspense>
    </main>
  );
}
