"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import { useLots } from "@/lib/hooks/useLots";
import { useExpenses } from "@/lib/hooks/useExpenses";
import { useCredits } from "@/lib/hooks/useCredits";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  formatCurrency,
  formatDate,
  statusLabel,
  todayISO,
} from "@/lib/utils/format";
import type {
  ExpenseWithRelations,
  ExpenseInsert,
  ExpenseStatus,
} from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  lot_id: string;
  supplier: string;
  amount: string;
  expense_date: string;
  status: ExpenseStatus;
  credit_id: string;
  is_bank_debited: boolean;
  note: string;
}

function buildForm(overrides: Partial<FormState> = {}): FormState {
  return {
    lot_id: "",
    supplier: "",
    amount: "",
    expense_date: todayISO(),
    status: "prevu",
    credit_id: "",
    is_bank_debited: false,
    note: "",
    ...overrides,
  };
}

// ─── Icône banque non débitée ─────────────────────────────────────────────────

function BankPendingBadge() {
  return (
    <span
      title="Payé mais non débité en banque"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      Non débité
    </span>
  );
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

function ExpenseForm({
  form,
  onChange,
  lots,
  credits,
  onSubmit,
  onCancel,
  submitting,
  isEdit,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  lots: { id: string; name: string }[];
  credits: { id: string; name: string }[];
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  isEdit: boolean;
}) {
  const set = (key: keyof FormState, value: string | boolean) =>
    onChange({ ...form, [key]: value });

  const canSubmit = !!form.amount && !!form.lot_id && !submitting;

  // Enter soumet le formulaire (sauf dans textarea)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>

      {/* Montant — autoFocus, champ principal */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Montant (€) *
        </label>
        <input
          autoFocus
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lot */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Lot *
        </label>
        <select
          value={form.lot_id}
          onChange={(e) => set("lot_id", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionner un lot</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Statut */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Statut
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["prevu", "engage", "paye"] as ExpenseStatus[]).map((s) => {
            const active = form.status === s;
            const styles: Record<ExpenseStatus, string> = {
              prevu: active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
              engage: active
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
              paye: active
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            };
            return (
              <button
                key={s}
                type="button"
                onClick={() => set("status", s)}
                className={`py-2 rounded-xl border text-sm font-medium transition-colors ${styles[s]}`}
              >
                {statusLabel(s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Financement */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Financement
        </label>
        <select
          value={form.credit_id}
          onChange={(e) => set("credit_id", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Fonds propres</option>
          {credits.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Fournisseur */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Fournisseur
        </label>
        <input
          type="text"
          placeholder="Ex : Campistro, Ubaldi…"
          value={form.supplier}
          onChange={(e) => set("supplier", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Date
        </label>
        <input
          type="date"
          value={form.expense_date}
          onChange={(e) => set("expense_date", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Passé en banque */}
      <div className="flex items-center justify-between py-1">
        <label className="text-sm text-gray-700">Passé en banque</label>
        <button
          type="button"
          onClick={() => set("is_bank_debited", !form.is_bank_debited)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            form.is_bank_debited ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.is_bank_debited ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Note (optionnel)
        </label>
        <textarea
          rows={2}
          placeholder="Acompte, situation 1, solde…"
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Hint Enter */}
      {!isEdit && (
        <p className="text-xs text-gray-400 text-center">
          Appuie sur{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">
            Entrée
          </kbd>{" "}
          pour ajouter rapidement
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isEdit ? "Annuler" : "Fermer"}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Enregistrement…" : isEdit ? "Modifier" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

// ─── Résumé bas de tableau ────────────────────────────────────────────────────

function TableSummary({ expenses }: { expenses: ExpenseWithRelations[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const paid = expenses
    .filter((e) => e.status === "paye")
    .reduce((s, e) => s + e.amount, 0);
  const engaged = expenses
    .filter((e) => e.status === "engage")
    .reduce((s, e) => s + e.amount, 0);
  const prevu = expenses
    .filter((e) => e.status === "prevu")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Total affiché
        </p>
        <p className="text-base font-bold text-gray-900 mt-0.5">
          {formatCurrency(total)}
        </p>
        <p className="text-xs text-gray-400">{expenses.length} dépense{expenses.length > 1 ? "s" : ""}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Payé
        </p>
        <p className="text-base font-bold text-emerald-600 mt-0.5">
          {formatCurrency(paid)}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Engagé
        </p>
        <p className="text-base font-bold text-violet-600 mt-0.5">
          {formatCurrency(engaged)}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          Prévu
        </p>
        <p className="text-base font-bold text-blue-600 mt-0.5">
          {formatCurrency(prevu)}
        </p>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { activeProject } = useProjects();
  const projectId = activeProject?.id ?? null;

  const { lots } = useLots(projectId);
  const { credits } = useCredits(projectId);
  const { expenses, loading, create, update, remove, duplicate, refresh } =
    useExpenses(projectId);

  // ── Filtres ──
  const [filterLot, setFilterLot] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFinancement, setFilterFinancement] = useState("all");

  // ── Modale ajout/édition ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseWithRelations | null>(null);

  // formKey : incrémenté après chaque création → remonte ExpenseForm → autoFocus retrigger
  const [formKey, setFormKey] = useState(0);

  // Mémoire du dernier lot + statut utilisés pour pré-remplissage
  const [lastLotId, setLastLotId] = useState("");
  const [lastStatus, setLastStatus] = useState<ExpenseStatus>("prevu");

  const [form, setForm] = useState<FormState>(buildForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Confirmation suppression ──
  const [deleteTarget, setDeleteTarget] = useState<ExpenseWithRelations | null>(null);

  // ── Dépenses filtrées ──
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterLot !== "all" && e.lot_id !== filterLot) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      if (filterFinancement === "credit" && !e.credit_id) return false;
      if (filterFinancement === "fonds_propres" && e.credit_id) return false;
      return true;
    });
  }, [expenses, filterLot, filterStatus, filterFinancement]);

  // ── Ouvrir modale ajout ──
  function openAdd() {
    setEditTarget(null);
    setForm(buildForm({ lot_id: lastLotId, status: lastStatus }));
    setFormKey((k) => k + 1);
    setModalOpen(true);
  }

  // ── Ouvrir modale édition ──
  function openEdit(expense: ExpenseWithRelations) {
    setEditTarget(expense);
    setForm({
      lot_id: expense.lot_id,
      supplier: expense.supplier ?? "",
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      status: expense.status,
      credit_id: expense.credit_id ?? "",
      is_bank_debited: expense.is_bank_debited,
      note: expense.note ?? "",
    });
    setFormKey((k) => k + 1);
    setModalOpen(true);
  }

  // ── Soumettre ──
  async function handleSubmit() {
    if (!projectId || !form.lot_id || !form.amount) return;
    setSubmitting(true);

    const payload: ExpenseInsert = {
      project_id: projectId,
      lot_id: form.lot_id,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      status: form.status,
      credit_id: form.credit_id || null,
      supplier: form.supplier || null,
      is_bank_debited: form.is_bank_debited,
      note: form.note || null,
    };

    if (editTarget) {
      await update(editTarget.id, payload);
      setSubmitting(false);
      setModalOpen(false);
      setEditTarget(null);
    } else {
      // Saisie rapide : mémoriser lot + statut, reset + refocus
      await create(payload);
      setLastLotId(form.lot_id);
      setLastStatus(form.status);
      setSubmitting(false);
      // Reset en gardant dernier lot + statut, incrémenter formKey → autoFocus
      setForm(buildForm({ lot_id: form.lot_id, status: form.status }));
      setFormKey((k) => k + 1);
    }
  }

  // ── Supprimer ──
  async function handleDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  }

  if (!activeProject) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        Aucun projet actif.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-gray-900">Dépenses</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Actualiser
          </button>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            + Dépense
          </button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="flex gap-2 flex-wrap items-center">

        {/* Filtre statut */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            ["all", "Tous"],
            ["prevu", "Prévu"],
            ["engage", "Engagé"],
            ["paye", "Payé"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtre financement */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            ["all", "Tout financement"],
            ["credit", "Crédit"],
            ["fonds_propres", "Fonds propres"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterFinancement(key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterFinancement === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtre lot */}
        <select
          value={filterLot}
          onChange={(e) => setFilterLot(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les lots</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-500">
            Aucune dépense
            {filterLot !== "all" || filterStatus !== "all" || filterFinancement !== "all"
              ? " pour ces filtres"
              : ""}
            .
          </p>
          <button
            onClick={openAdd}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ajouter une dépense →
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* En-tête — desktop */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Lot</div>
              <div className="col-span-2">Fournisseur</div>
              <div className="col-span-2">Financement</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-1">Banque</div>
              <div className="col-span-1 text-right">Montant</div>
              <div className="col-span-1" />
            </div>

            <ul className="divide-y divide-gray-50">
              {filtered.map((expense) => {
                const isPaidNotDebited =
                  expense.status === "paye" && !expense.is_bank_debited;

                return (
                  <li key={expense.id} className="hover:bg-gray-50 transition-colors">

                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                      <div className="col-span-2 text-sm text-gray-500">
                        {formatDate(expense.expense_date)}
                      </div>
                      <div className="col-span-2 text-sm font-medium text-gray-800 truncate">
                        {expense.lot?.name ?? "—"}
                      </div>
                      <div className="col-span-2 text-sm text-gray-600 truncate">
                        {expense.supplier ?? (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                      <div className="col-span-2 text-sm text-gray-500 truncate">
                        {expense.credit ? expense.credit.name : "Fonds propres"}
                      </div>
                      <div className="col-span-1">
                        <StatusBadge status={expense.status} />
                      </div>
                      <div className="col-span-1">
                        {isPaidNotDebited ? (
                          <BankPendingBadge />
                        ) : expense.is_bank_debited ? (
                          <span className="text-xs text-emerald-600 font-medium">
                            OK
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                      <div className="col-span-1 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => openEdit(expense)}
                          title="Modifier"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => duplicate(expense)}
                          title="Dupliquer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          title="Supprimer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {expense.supplier ?? expense.lot?.name ?? "—"}
                            </span>
                            <StatusBadge status={expense.status} />
                            {isPaidNotDebited && <BankPendingBadge />}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {expense.lot?.name} ·{" "}
                            {formatDate(expense.expense_date)}
                            {expense.credit && ` · ${expense.credit.name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </span>
                          <button
                            onClick={() => openEdit(expense)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(expense)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Résumé bas de tableau ── */}
          <TableSummary expenses={filtered} />
        </>
      )}

      {/* ── Modale ajout / édition ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Modifier la dépense" : "Nouvelle dépense"}
      >
        {/* formKey force le remontage → autoFocus retrigger après chaque création */}
        <ExpenseForm
          key={formKey}
          form={form}
          onChange={setForm}
          lots={lots}
          credits={credits}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
          isEdit={!!editTarget}
        />
      </Modal>

      {/* ── Confirmation suppression ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer cette dépense ?"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800">
                {deleteTarget.supplier ?? deleteTarget.lot?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(deleteTarget.amount)} ·{" "}
                {formatDate(deleteTarget.expense_date)}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
