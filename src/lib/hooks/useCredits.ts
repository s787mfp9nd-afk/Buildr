"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Credit,
  CreditInsert,
  CreditRelease,
  CreditReleaseInsert,
} from "@/lib/types/database";

// Résumé calculé localement pour chaque crédit
export interface CreditWithSummary extends Credit {
  total_released: number;       // Somme des déblocages
  remaining_to_release: number; // Montant total - débloqué
  releases: CreditRelease[];    // Liste des déblocages
}

export function useCredits(projectId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [releases, setReleases] = useState<CreditRelease[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Chargement initial ---
  useEffect(() => {
    if (!projectId) {
      setCredits([]);
      setReleases([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);

      // 1. Charger les crédits
      const { data: creditsData } = await supabase
        .from("credits")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      if (cancelled) return;

      const loadedCredits = creditsData ?? [];
      setCredits(loadedCredits);

      // 2. Charger tous les déblocages d'un coup (IN sur les ids)
      if (loadedCredits.length > 0) {
        const ids = loadedCredits.map((c) => c.id);
        const { data: releasesData } = await supabase
          .from("credit_releases")
          .select("*")
          .in("credit_id", ids)
          .order("release_date", { ascending: false });

        if (!cancelled) setReleases(releasesData ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, supabase]);

  // --- Données dérivées : crédits enrichis avec leurs totaux ---
  const creditsWithSummary: CreditWithSummary[] = useMemo(() => {
    return credits.map((credit) => {
      const creditReleases = releases.filter((r) => r.credit_id === credit.id);
      const total_released = creditReleases.reduce((sum, r) => sum + r.amount, 0);

      return {
        ...credit,
        total_released,
        remaining_to_release: credit.total_amount - total_released,
        releases: creditReleases,
      };
    });
  }, [credits, releases]);

  // Totaux globaux sur tous les crédits (pour le dashboard)
  const globalTotals = useMemo(() => {
    return creditsWithSummary.reduce(
      (acc, c) => ({
        total_amount: acc.total_amount + c.total_amount,
        total_released: acc.total_released + c.total_released,
        remaining_to_release: acc.remaining_to_release + c.remaining_to_release,
        monthly_payment: acc.monthly_payment + (c.monthly_payment ?? 0),
      }),
      { total_amount: 0, total_released: 0, remaining_to_release: 0, monthly_payment: 0 }
    );
  }, [creditsWithSummary]);

  // --- CRUD crédits ---
  async function create(input: Omit<CreditInsert, "project_id">) {
    if (!projectId) return null;

    const { data, error } = await supabase
      .from("credits")
      .insert({ ...input, project_id: projectId })
      .select()
      .single();

    if (error || !data) return null;

    setCredits((prev) => [...prev, data]);
    return data;
  }

  async function update(id: string, input: Partial<CreditInsert>) {
    const { data, error } = await supabase
      .from("credits")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return null;

    setCredits((prev) => prev.map((c) => (c.id === id ? data : c)));
    return data;
  }

  async function remove(id: string) {
    const { error } = await supabase.from("credits").delete().eq("id", id);
    if (error) return false;

    setCredits((prev) => prev.filter((c) => c.id !== id));
    setReleases((prev) => prev.filter((r) => r.credit_id !== id));
    return true;
  }

  // --- CRUD déblocages ---
  async function addRelease(input: CreditReleaseInsert) {
    const { data, error } = await supabase
      .from("credit_releases")
      .insert(input)
      .select()
      .single();

    if (error || !data) return null;

    // Ajout optimiste : pas besoin de recharger tout
    setReleases((prev) => [data, ...prev]);
    return data;
  }

  async function removeRelease(releaseId: string) {
    const { error } = await supabase
      .from("credit_releases")
      .delete()
      .eq("id", releaseId);

    if (error) return false;

    setReleases((prev) => prev.filter((r) => r.id !== releaseId));
    return true;
  }

  return {
    credits,
    creditsWithSummary,
    globalTotals,
    loading,
    create,
    update,
    remove,
    addRelease,
    removeRelease,
  };
}
