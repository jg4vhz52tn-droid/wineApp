import { APP_NAME } from "@/config/app";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-4xl">Kurz offline</h1>
      <p className="max-w-xs text-muted">
        {APP_NAME} braucht für Live-Verkostungen eine Verbindung. Sobald du wieder online bist, geht’s weiter.
      </p>
    </main>
  );
}
