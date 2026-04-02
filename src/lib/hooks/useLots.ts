"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lot, LotInsert, LotSummary } from "@/lib/types/database";

export function useLots(projectId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [lots, setLots] = useState<Lot[]>([]);
  const [summaries, setSummaries] = useState<LotSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Chargement quand le projet change ---
  useEffect(() => {
    if (!projectId) {
      setLots([]);
      setSummaries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);

      const [lotsRes, summariesRes] = await Promise.all([
        supabase
          .from("lots")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order"),
        supabase
          .from("lot_summary")
          .select("*")
          .eq("project_id", projectId),
      ]);

      if (cancelled) return;

      setLots(lotsRes.data ?? []);
      setSummaries(summariesRes.data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, supabase]);

  // --- Helpers de lecture ---
  const travaux = lots.filter((l) => l.category === "travaux");
  const annexes = lots.filter((l) => l.category === "annexe");

  function getSummary(lotId: string): LotSummary | undefined {
    return summaries.find((s) => s.lot_id === lotId);
  }

  // --- Refresh (utile après ajout de dépense) ---
  async function refresh() {
    if (!projectId) return;

    const [lotsRes, summariesRes] = await Promise.all([
      supabase
        .from("lots")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order"),
      supabase
        .from("lot_summary")
        .select("*")
        .eq("project_id", projectId),
    ]);

    setLots(lotsRes.data ?? []);
    setSummaries(summariesRes.data ?? []);
  }

  // --- CRUD ---
  async function create(input: Omit<LotInsert, "project_id">) {
    if (!projectId) return null;

    const { data, error } = await supabase
      .from("lots")
      .insert({ ...input, project_id: projectId })
      .select()
      .single();

    if (error || !data) return null;

    setLots((prev) => [...prev, data]);
    return data;
  }

  async function update(id: string, input: Partial<LotInsert>) {
    const { data, error } = await supabase
      .from("lots")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return null;

    setLots((prev) => prev.map((l) => (l.id === id ? data : l)));
    return data;
  }

  async function remove(id: string) {
    const { error } = await supabase.from("lots").delete().eq("id", id);
    if (error) return false;

    setLots((prev) => prev.filter((l) => l.id !== id));
    setSummaries((prev) => prev.filter((s) => s.lot_id !== id));
    return true;
  }

  return {
    lots,
    travaux,
    annexes,
    summaries,
    loading,
    getSummary,
    refresh,
    create,
    update,
    remove,
  };
}
