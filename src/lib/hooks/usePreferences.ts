"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserPreferences } from "@/lib/types/database";

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) setPreferences(data);
      setLoading(false);
    }

    load();
  }, [supabase]);

  async function updateLastLot(lotId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, last_lot_id: lotId },
        { onConflict: "user_id" }
      );

    setPreferences((prev) =>
      prev ? { ...prev, last_lot_id: lotId } : null
    );
  }

  return { preferences, loading, updateLastLot };
}
