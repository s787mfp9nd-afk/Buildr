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
  total_released: number;         // Somme des déblocages
  remaining_to_release: number;   // Montant total - débloqué
  releases: CreditRelease[];      // Liste des déblocages
  total_expenses_linked: number;  // Dépenses liées à ce crédit
}

export function useCredits(projectId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [releases, setReleases] = useState<CreditRelease[]>([]);
  const [expensesByCredit, setExpensesByCredit] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // --- Chargement initial ---
  useEffect(() => {
    if (!projectId) {
      setCredits([]);
      setReleases([]);
      setExpensesByCredit({});
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

      if (loadedCredits.length > 0) {
        const ids = loadedCredits.map((c) => c.id);

        // 2. Charger tous les déblocages
        const { data: releasesData } = await supabase
          .from("credit_releases")
          .select("*")
          .in("credit_id", ids)
          .order("release_date", { ascending: false });

        if (!cancelled) setReleases(releasesData ?? []);

        // 3. Charger les dépenses liées à ces crédits
        const { data: expensesData } = await supabase
          .from("expenses")
          .select("credit_id, amount")
          .in("credit_id", ids);

        if (!cancelled && expensesData) {
          // Grouper par credit_id
          const totals: Record<string, number> = {};
          for (const e of expensesData) {
            if (e.credit_id) {
              totals[e.credit_id] = (totals[e.credit_id] ?? 0) + e.amount;
            }
          }
          setExpensesByCredit(totals);
        }
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, supabase]);

  // --- Données dérivées : crédits enrichis ---
  const creditsWithSummary: CreditWithSummary[] = useMemo(() => {
    return credits.map((credit) => {
      const creditReleases = releases.filter((r) => r.credit_id === credit.id);
      const total_released = creditReleases.reduce((sum, r) => sum + r.amount, 0);
      const total_expenses_linked = expensesByCredit[credit.id] ?? 0;

      return {
        ...credit,
        total_released,
        remaining_to_release: credit.total_amount - total_released,
        releases: creditReleases,
        total_expenses_linked,
      };
    });
  }, [credits, releases, expensesByCredit]);

  // Totaux globaux
  const globalTotals = useMemo(() => {
    return creditsWithSummary.reduce(
      (acc, c) => ({
        total_amount: acc.total_amount + c.total_amount,
        total_released: acc.total_released + c.total_released,
        remaining_to_release: acc.remaining_to_release + c.remaining_to_release,
        monthly_payment: acc.monthly_payment + (c.monthly_payment ?? 0),
        total_expenses_linked: acc.total_expenses_linked + c.total_expenses_linked,
      }),
      { total_amount: 0, total_released: 0, remaining_to_release: 0, monthly_payment: 0, total_expenses_linked: 0 }
    );
  }, [creditsWithSummary]);

  // --- Refresh (après ajout de dépense depuis une autre page) ---
  async function refresh() {
    if (!projectId) return;
    const loadedCredits = credits;
    if (loadedCredits.length === 0) return;
    const ids = loadedCredits.map((c) => c.id);

    const { data: expensesData } = await supabase
      .from("expenses")
      .select("credit_id, amount")
      .in("credit_id", ids);

    if (expensesData) {
      const totals: Record<string, number> = {};
      for (const e of expensesData) {
        if (e.credit_id) {
          totals[e.credit_id] = (totals[e.credit_id] ?? 0) + e.amount;
        }
      }
      setExpensesByCredit(totals);
    }
  }

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
    refresh,
    create,
    update,
    remove,
    addRelease,
    removeRelease,
  };
}
