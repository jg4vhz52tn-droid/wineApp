"use client";

import { getSupabase } from "@/lib/supabase";

export function callbackUrl(next = "/abende") {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Google sign-in. A guest gets Google linked to their existing guest
 * account instead, so their tasting results stay with them. */
export async function signInWithGoogle(next?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ist noch nicht verbunden.");
  const { data } = await supabase.auth.getSession();
  const options = { redirectTo: callbackUrl(next) };
  const { error } = data.session?.user.is_anonymous
    ? await supabase.auth.linkIdentity({ provider: "google", options })
    : await supabase.auth.signInWithOAuth({ provider: "google", options });
  if (error) throw error;
}

/** Magic link by email. Guests attach the email to their guest account. */
export async function sendMagicLink(email: string, next?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ist noch nicht verbunden.");
  const { data } = await supabase.auth.getSession();
  const { error } = data.session?.user.is_anonymous
    ? await supabase.auth.updateUser({ email }, { emailRedirectTo: callbackUrl(next) })
    : await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl(next) } });
  if (error) throw error;
}

export function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/rate limit/i.test(message)) return "Zu viele Versuche – bitte in ein paar Minuten noch einmal.";
  if (/provider is not enabled|Unsupported provider/i.test(message))
    return "Google-Login ist im Supabase-Projekt noch nicht eingerichtet.";
  if (/already registered|already been registered|email_exists/i.test(message))
    return "Diese E-Mail gehört schon zu einem Account. Melde dich damit an.";
  if (/Supabase ist noch nicht verbunden/.test(message)) return message;
  return "Das hat nicht geklappt. Bitte noch einmal versuchen.";
}
