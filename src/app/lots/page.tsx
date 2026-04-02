"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import { useLots } from "@/lib/hooks/useLots";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatPercent, categoryLabel } from "@/lib/utils/format";
import type { Lot, LotInsert, LotCategory } from "@/lib/types/database";

// ─── Formulaire lot ───────────────────────────────────────────────────────────

interface LotFormState {
  name: string;
  category: LotCategory;
  planned_budget: string;
  url: string;
}

function buildLotForm(lot?: Lot): LotFormState {
  return {
    name: lot?.name ?? "",
    category: lot?.category ?? "travaux",
    planned_budget: lot ? String(lot.planned_budget) : "",
    url: lot?.url ?? "",
  };
}

function LotForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  isEdit,
}: {
  form: LotFormState;
  onChange: (f: LotFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  isEdit: boolean;
}) {
  const set = (key: keyof LotFormState, value: string) =>
    onChange({ ...form, [key]: value });

  const canSubmit = !!form.name.trim() && !!form.planned_budget && !submitting;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>

      {/* Nom */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Nom du lot *
        </label>
        <input
          autoFocus
          type="text"
          placeholder="Ex : Électricité, Plomberie…"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Budget prévisionnel (€) *
        </label>
        <input
          type="number"
          min="0"
          step="100"
          placeholder="0"
          value={form.planned_budget}
          onChange={(e) => set("planned_budget", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Catégorie
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["travaux", "annexe"] as LotCategory[]).map((c) => {
            const active = form.category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => set("category", c)}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {categoryLabel(c)}
              </button>
            );
          })}
        </div>
      </div>

      {/* URL fournisseur */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Lien fournisseur (optionnel)
        </label>
        <input
          type="url"
          placeholder="https://…"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Enregistrement…" : isEdit ? "Modifier" : "Créer le lot"}
        </button>
      </div>
    </div>
  );
}

// ─── Card lot ─────────────────────────────────────────────────────────────────

function LotCard({
  lot,
  summary,
  onEdit,
  onDelete,
}: {
  lot: Lot;
  summary?: {
    total_spent: number;
    total_engaged: number;
    total_paid: number;
    remaining: number;
    progress_pct: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const spent = summary?.total_spent ?? 0;
  const engaged = summary?.total_engaged ?? 0;
  const remaining = summary?.remaining ?? lot.planned_budget;
  const progress = summary?.progress_pct ?? 0;
  const isOver = spent > lot.planned_budget;
  const isNear = !isOver && progress >= 80;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{lot.name}</h3>
            {isOver && (
              <span className="text-xs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-md">
                Dépassement
              </span>
            )}
            {isNear && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                {formatPercent(progress)}
              </span>
            )}
          </div>
          {lot.url && (
            <a
              href={lot.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-0.5 block truncate"
            >
              {lot.url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        {/* Actions */}
        <div className="flex gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            title="Modifier"
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
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

      {/* Barre de progression */}
      <ProgressBar value={spent} max={lot.planned_budget} showOverflow={false} />

      {/* Chiffres */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <p className="text-xs text-gray-400">Budget</p>
          <p className="text-sm font-semibold text-gray-700">
            {formatCurrency(lot.planned_budget)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Dépensé</p>
          <p className={`text-sm font-semibold ${isOver ? "text-red-600" : "text-emerald-600"}`}>
            {formatCurrency(spent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Reste</p>
          <p className={`text-sm font-semibold ${remaining < 0 ? "text-red-600" : "text-gray-700"}`}>
            {formatCurrency(Math.max(remaining, 0))}
          </p>
        </div>
      </div>

      {/* Engagé non payé si pertinent */}
      {engaged > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1.5">
          <span className="text-xs text-violet-600 font-medium">
            Engagé : {formatCurrency(engaged)}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            non encore payé
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Résumé global ────────────────────────────────────────────────────────────

function LotsSummary({
  lots,
  summaries,
}: {
  lots: Lot[];
  summaries: { total_spent: number; total_engaged: number; planned_budget: number; remaining: number }[];
}) {
  const totalBudget = lots.reduce((s, l) => s + l.planned_budget, 0);
  const totalSpent = summaries.reduce((s, l) => s + l.total_spent, 0);
  const totalEngaged = summaries.reduce((s, l) => s + l.total_engaged, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Budget total</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(totalBudget)}</p>
        <p className="text-xs text-gray-400">{lots.length} lot{lots.length > 1 ? "s" : ""}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Dépensé</p>
        <p className="text-base font-bold text-emerald-600 mt-0.5">{formatCurrency(totalSpent)}</p>
        {totalBudget > 0 && (
          <p className="text-xs text-gray-400">{formatPercent(totalSpent / totalBudget * 100)}</p>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Engagé</p>
        <p className="text-base font-bold text-violet-600 mt-0.5">{formatCurrency(totalEngaged)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Reste</p>
        <p className={`text-base font-bold mt-0.5 ${totalRemaining < 0 ? "text-red-600" : "text-gray-700"}`}>
          {formatCurrency(Math.max(totalRemaining, 0))}
        </p>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LotsPage() {
  const { activeProject } = useProjects();
  const projectId = activeProject?.id ?? null;
  const { travaux, annexes, summaries, loading, getSummary, create, update, remove } =
    useLots(projectId);

  const allLots = useMemo(() => [...travaux, ...annexes], [travaux, annexes]);

  // ── Onglet catégorie ──
  const [tab, setTab] = useState<"travaux" | "annexe">("travaux");

  // ── Modale ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lot | null>(null);
  const [form, setForm] = useState<LotFormState>(buildLotForm());
  const [submitting, setSubmitting] = useState(false);

  // ── Confirmation suppression ──
  const [deleteTarget, setDeleteTarget] = useState<Lot | null>(null);

  const displayedLots = tab === "travaux" ? travaux : annexes;

  function openAdd() {
    setEditTarget(null);
    setForm(buildLotForm());
    setModalOpen(true);
  }

  function openEdit(lot: Lot) {
    setEditTarget(lot);
    setForm(buildLotForm(lot));
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!projectId || !form.name.trim() || !form.planned_budget) return;
    setSubmitting(true);

    const payload: Omit<LotInsert, "project_id"> = {
      name: form.name.trim(),
      category: form.category,
      planned_budget: parseFloat(form.planned_budget),
      url: form.url.trim() || null,
    };

    if (editTarget) {
      await update(editTarget.id, payload);
    } else {
      await create(payload);
    }

    setSubmitting(false);
    setModalOpen(false);
    setEditTarget(null);
  }

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
        <h1 className="text-lg font-bold text-gray-900">Lots</h1>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Lot
        </button>
      </div>

      {/* ── Résumé global ── */}
      {allLots.length > 0 && (
        <LotsSummary lots={allLots} summaries={summaries} />
      )}

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([["travaux", "Travaux"], ["annexe", "Frais annexes"]] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs text-gray-400">
                {key === "travaux" ? travaux.length : annexes.length}
              </span>
            </button>
          )
        )}
      </div>

      {/* ── Grille de lots ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayedLots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-500">
            Aucun lot dans la catégorie{" "}
            <span className="font-medium">{categoryLabel(tab)}</span>.
          </p>
          <button
            onClick={openAdd}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Créer un lot →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedLots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              summary={getSummary(lot.id)}
              onEdit={() => openEdit(lot)}
              onDelete={() => setDeleteTarget(lot)}
            />
          ))}
        </div>
      )}

      {/* ── Modale ajout / édition ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Modifier le lot" : "Nouveau lot"}
      >
        <LotForm
          form={form}
          onChange={setForm}
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
        title="Supprimer ce lot ?"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800">
                {deleteTarget.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Budget : {formatCurrency(deleteTarget.planned_budget)}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Les dépenses liées à ce lot ne pourront plus être supprimées.
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
