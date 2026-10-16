"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";

/** Lands here after Google or a magic link; trades the one-time code for a session. */
export function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const [exchangeFailed, setExchangeFailed] = useState(false);
  const started = useRef(false);
  const code = params.get("code");
  const invalid = !getSupabase() || Boolean(params.get("error")) || !code;

  useEffect(() => {
    const supabase = getSupabase();
    if (started.current || !supabase || invalid) return;
    started.current = true;

    const next = params.get("next") ?? "/abende";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/abende";
    supabase.auth.exchangeCodeForSession(code!).then(({ error }) => {
      if (error) setExchangeFailed(true);
      else router.replace(safeNext);
    });
  }, [code, invalid, params, router]);

  if (invalid || exchangeFailed) {
    return (
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-3xl">Anmeldung fehlgeschlagen</h1>
        <p className="text-muted">
          Der Link ist abgelaufen oder wurde in einem anderen Browser geöffnet. Fordere einfach einen neuen
          an.
        </p>
        <Link href="/login" className="inline-block underline underline-offset-4">
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <p role="status" className="text-muted">
      Einen Moment …
    </p>
  );
}
