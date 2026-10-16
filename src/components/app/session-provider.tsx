"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type SessionState = {
  /** false until the stored session has been read */
  ready: boolean;
  session: Session | null;
  isGuest: boolean;
  configured: boolean;
};

const SessionContext = createContext<SessionState>({
  ready: false,
  session: null,
  isGuest: false,
  configured: isSupabaseConfigured,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    ready: !isSupabaseConfigured,
    session: null,
    isGuest: false,
    configured: isSupabaseConfigured,
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const apply = (session: Session | null) =>
      setState({
        ready: true,
        session,
        isGuest: Boolean(session?.user.is_anonymous),
        configured: true,
      });

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
