import { Suspense } from "react";
import { Callback } from "./callback";

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <Suspense>
        <Callback />
      </Suspense>
    </main>
  );
}
