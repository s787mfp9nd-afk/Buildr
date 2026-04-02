"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseInsert, ExpenseWithRelations } from "@/lib/types/database";

// --- Filtres passés au hook ---
interface Filters {
  lotId?: string;
  status?: string; // "all" | "prevu" | "engage" | "paye"
}

export function useExpenses(projectId: string | null, filters?: Filters) {
  const supabase = useMemo(() => createClient(), []);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Chargement avec filtres ---
  useEffect(() => {
    if (!projectId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);

      let query = supabase
        .from("expenses")
        .select("*, lot:lots(*), credit:credits(*)")
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false });

      if (filters?.lotId) {
        query = query.eq("lot_id", filters.lotId);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data } = await query;

      if (cancelled) return;

      setExpenses((data as ExpenseWithRelations[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, filters?.lotId, filters?.status, supabase]);

  // --- Données dérivées ---

  // Totaux par statut
  const totals = useMemo(() => {
    let prevu = 0;
    let engage = 0;
    let paye = 0;
    let credit = 0;
    let fondsPropres = 0;

    for (const e of expenses) {
      if (e.status === "prevu") prevu += e.amount;
      else if (e.status === "engage") engage += e.amount;
      else if (e.status === "paye") paye += e.amount;

      if (e.credit_id) credit += e.amount;
      else fondsPropres += e.amount;
    }

    return { prevu, engage, paye, total: engage + paye, credit, fondsPropres };
  }, [expenses]);

  // --- Refresh ---
  async function refresh() {
    if (!projectId) return;

    let query = supabase
      .from("expenses")
      .select("*, lot:lots(*), credit:credits(*)")
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false });

    if (filters?.lotId) query = query.eq("lot_id", filters.lotId);
    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);

    const { data } = await query;
    setExpenses((data as ExpenseWithRelations[]) ?? []);
  }

  // --- CRUD ---

  async function create(input: ExpenseInsert) {
    const { data, error } = await supabase
      .from("expenses")
      .insert(input)
      .select("*, lot:lots(*), credit:credits(*)")
      .single();

    if (error || !data) return null;

    setExpenses((prev) => [data as ExpenseWithRelations, ...prev]);

    // Sauvegarder le dernier lot utilisé
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, last_lot_id: input.lot_id },
          { onConflict: "user_id" }
        );
    }

    return data as ExpenseWithRelations;
  }

  async function update(id: string, input: Partial<ExpenseInsert>) {
    const { data, error } = await supabase
      .from("expenses")
      .update(input)
      .eq("id", id)
      .select("*, lot:lots(*), credit:credits(*)")
      .single();

    if (error || !data) return null;

    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? (data as ExpenseWithRelations) : e))
    );
    return data as ExpenseWithRelations;
  }

  async function remove(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return false;

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return true;
  }

  // --- Dupliquer une dépense (date = aujourd'hui, statut = prévu, non passé en banque) ---
  async function duplicate(expense: ExpenseWithRelations) {
    return create({
      project_id: expense.project_id,
      lot_id: expense.lot_id,
      credit_id: expense.credit_id,
      amount: expense.amount,
      supplier: expense.supplier,
      note: expense.note,
      expense_date: new Date().toISOString().split("T")[0],
      status: "prevu",
      is_bank_debited: false,
    });
  }

  return {
    expenses,
    totals,
    loading,
    refresh,
    create,
    update,
    remove,
    duplicate,
  };
}
