"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/app/session-provider";
import { getSupabase } from "@/lib/supabase";

export type Experience = "beginner" | "intermediate" | "pro";

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  pro: "Profi",
};

/** The experience level from the profile - beginners get the guided tasting offered first. */
export function useExperience() {
  const { session } = useSession();
  const [experience, setExperience] = useState<Experience>("intermediate");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !session || session.user.is_anonymous) return;
    let active = true;
    supabase
      .from("profiles")
      .select("experience")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => active && data?.experience && setExperience(data.experience as Experience));
    return () => {
      active = false;
    };
  }, [session]);

  async function save(next: Experience) {
    setExperience(next);
    const supabase = getSupabase();
    if (supabase && session)
      await supabase.from("profiles").update({ experience: next }).eq("id", session.user.id);
  }

  return { experience, setExperience: save };
}
