"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import { useCredits } from "@/lib/hooks/useCredits";
import type { CreditInsert, CreditReleaseInsert } from "@/lib/types/database";
import type { CreditWithSummary } from "@/lib/hooks/useCredits";

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = "blue" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-400",
    red: "bg-red-500",
  };
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color] ?? colorMap.blue}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CreditsSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="h-36 bg-gray-200 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Credit form ──────────────────────────────────────────────────────────────

type CreditFormData = {
  name: string;
  total_amount: string;
  monthly_payment: string;
  start_date: string;
  notes: string;
};

function buildCreditForm(overrides?: Partial<CreditFormData>): CreditFormData {
  return {
    name: "",
    total_amount: "",
    monthly_payment: "",
    start_date: new Date().toISOString().split("T")[0],
    notes: "",
    ...overrides,
  };
}

function CreditModal({
  initial,
  onSubmit,
  onClose,
  loading,
}: {
  initial?: CreditFormData;
  onSubmit: (data: CreditFormData) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreditFormData>(initial ?? buildCreditForm());

  const set = (field: keyof CreditFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const canSubmit = form.name.trim() && parseFloat(form.total_amount) > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      if (canSubmit) onSubmit(form);
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {initial ? "Modifier le crédit" : "Nouveau crédit"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Nom du crédit *
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Ex : Crédit travaux BNP"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Montant total *
              </label>
              <div className="relative">
                <input
                  value={form.total_amount}
                  onChange={set("total_amount")}
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-7 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Mensualité
              </label>
              <div className="relative">
                <input
                  value={form.monthly_payment}
                  onChange={set("monthly_payment")}
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-7 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Date de début
            </label>
            <input
              value={form.start_date}
              onChange={set("start_date")}
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Note
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Banque, conditions, remarques…"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!canSubmit || loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {loading ? "Enregistrement…" : initial ? "Modifier" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Release form (add a deblocage) ──────────────────────────────────────────

function ReleaseForm({
  creditId,
  remainingToRelease,
  onAdd,
  onClose,
}: {
  creditId: string;
  remainingToRelease: number;
  onAdd: (data: Omit<CreditReleaseInsert, "credit_id">) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = parseFloat(amount) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await onAdd({ amount: parseFloat(amount), release_date: date, label: label || null });
    setLoading(false);
    onClose();
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
        Nouveau déblocage · reste {fmt(remainingToRelease)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            max={remainingToRelease}
            placeholder="Montant"
            autoFocus
            className="w-full border border-blue-200 rounded-lg pl-3 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
        </div>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Libellé (optionnel)"
        className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
      />
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg border border-blue-200 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="flex-1 py-2 rounded-lg bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          {loading ? "…" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

// ─── Credit card ──────────────────────────────────────────────────────────────

function CreditCard({
  credit,
  onEdit,
  onDelete,
  onAddRelease,
  onRemoveRelease,
}: {
  credit: CreditWithSummary;
  onEdit: (c: CreditWithSummary) => void;
  onDelete: (id: string) => void;
  onAddRelease: (creditId: string, data: Omit<CreditReleaseInsert, "credit_id">) => Promise<void>;
  onRemoveRelease: (releaseId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const releasedPct = credit.total_amount > 0
    ? Math.min(100, (credit.total_released / credit.total_amount) * 100)
    : 0;

  // Color based on how much is released
  const barColor = releasedPct >= 100 ? "green" : releasedPct >= 80 ? "amber" : "blue";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <IconCreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{credit.name}</p>
              {credit.start_date && (
                <p className="text-xs text-gray-400">depuis {fmtDate(credit.start_date)}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(credit)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Modifier"
            >
              <IconEdit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Supprimer"
            >
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Montant total</p>
            <p className="text-sm font-bold text-gray-900">{fmt(credit.total_amount)}</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">Débloqué</p>
            <p className="text-sm font-bold text-blue-600">{fmt(credit.total_released)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Restant</p>
            <p className={`text-sm font-bold ${credit.remaining_to_release > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {fmt(credit.remaining_to_release)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar value={credit.total_released} max={credit.total_amount} color={barColor} />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">{Math.round(releasedPct)}% débloqué</span>
          {credit.monthly_payment && credit.monthly_payment > 0 && (
            <span className="text-[10px] text-gray-500 font-medium">
              {fmt(credit.monthly_payment)}/mois
            </span>
          )}
        </div>
      </div>

      {/* Expand / collapse releases */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <span>
          {credit.releases.length > 0
            ? `${credit.releases.length} déblocage${credit.releases.length > 1 ? "s" : ""}`
            : "Aucun déblocage"}
        </span>
        <IconChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Releases detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {credit.releases.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">
              Aucun déblocage enregistré.
            </p>
          ) : (
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left py-1.5 font-semibold">Date</th>
                  <th className="text-left py-1.5 font-semibold">Libellé</th>
                  <th className="text-right py-1.5 font-semibold">Montant</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {credit.releases
                  .slice()
                  .sort((a, b) => a.release_date.localeCompare(b.release_date))
                  .map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-600">{fmtDate(r.release_date)}</td>
                      <td className="py-2 text-gray-500 truncate max-w-[100px]">
                        {r.label ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2 text-right font-semibold text-gray-900">
                        {fmt(r.amount)}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          onClick={() => onRemoveRelease(r.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <IconTrash className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Add release */}
          {showReleaseForm ? (
            <ReleaseForm
              creditId={credit.id}
              remainingToRelease={credit.remaining_to_release}
              onAdd={(data) => onAddRelease(credit.id, data)}
              onClose={() => setShowReleaseForm(false)}
            />
          ) : (
            credit.remaining_to_release > 0 && (
              <button
                onClick={() => setShowReleaseForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-blue-300 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors mt-1"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Ajouter un déblocage
              </button>
            )
          )}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="px-4 pb-4 pt-2 border-t border-red-100 bg-red-50">
          <p className="text-xs text-red-700 font-medium mb-2">
            Supprimer ce crédit et tous ses déblocages ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onDelete(credit.id)}
              className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Global summary bar ───────────────────────────────────────────────────────

function CreditsSummary({
  total_amount,
  total_released,
  remaining_to_release,
  monthly_payment,
}: {
  total_amount: number;
  total_released: number;
  remaining_to_release: number;
  monthly_payment: number;
}) {
  return (
    <div className="sticky bottom-16 md:bottom-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-2xl mx-auto px-4 py-3 grid grid-cols-4 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Emprunté</p>
          <p className="text-sm font-bold text-gray-900">{fmt(total_amount)}</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Débloqué</p>
          <p className="text-sm font-bold text-blue-600">{fmt(total_released)}</p>
        </div>
        <div className="text-center border-r border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Restant</p>
          <p className="text-sm font-bold text-amber-600">{fmt(remaining_to_release)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Mensualités</p>
          <p className="text-sm font-bold text-gray-700">{fmt(monthly_payment)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const { activeProject } = useProjects();
  const { creditsWithSummary, globalTotals, loading, create, update, remove, addRelease, removeRelease } =
    useCredits(activeProject?.id ?? null);

  const [showCreate, setShowCreate] = useState(false);
  const [editCredit, setEditCredit] = useState<CreditWithSummary | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (data: CreditFormData) => {
    if (!activeProject) return;
    setFormLoading(true);
    await create({
      project_id: activeProject.id,
      name: data.name.trim(),
      total_amount: parseFloat(data.total_amount),
      monthly_payment: data.monthly_payment ? parseFloat(data.monthly_payment) : null,
      start_date: data.start_date || null,
      notes: data.notes.trim() || null,
    } as Omit<CreditInsert, "user_id">);
    setFormLoading(false);
    setShowCreate(false);
  };

  const handleUpdate = async (data: CreditFormData) => {
    if (!editCredit) return;
    setFormLoading(true);
    await update(editCredit.id, {
      name: data.name.trim(),
      total_amount: parseFloat(data.total_amount),
      monthly_payment: data.monthly_payment ? parseFloat(data.monthly_payment) : null,
      start_date: data.start_date || null,
      notes: data.notes.trim() || null,
    });
    setFormLoading(false);
    setEditCredit(null);
  };

  const handleAddRelease = async (
    creditId: string,
    data: Omit<CreditReleaseInsert, "credit_id">
  ) => {
    await addRelease(creditId, data);
  };

  const handleRemoveRelease = (releaseId: string) => {
    removeRelease(releaseId);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <CreditsSkeleton />;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Crédits</h1>
            {creditsWithSummary.length > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">
                {creditsWithSummary.length} crédit{creditsWithSummary.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <IconPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau crédit</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </div>

        {/* Empty state */}
        {creditsWithSummary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <IconCreditCard className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-500 mb-1">Aucun crédit</p>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Ajoutez vos crédits immobiliers ou travaux pour suivre les déblocages.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <IconPlus className="w-4 h-4" />
              Ajouter un crédit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {creditsWithSummary.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onEdit={setEditCredit}
                onDelete={remove}
                onAddRelease={handleAddRelease}
                onRemoveRelease={handleRemoveRelease}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {creditsWithSummary.length > 0 && (
        <CreditsSummary {...globalTotals} />
      )}

      {/* Modals */}
      {showCreate && (
        <CreditModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          loading={formLoading}
        />
      )}
      {editCredit && (
        <CreditModal
          initial={{
            name: editCredit.name,
            total_amount: String(editCredit.total_amount),
            monthly_payment: editCredit.monthly_payment ? String(editCredit.monthly_payment) : "",
            start_date: editCredit.start_date ?? "",
            notes: editCredit.notes ?? "",
          }}
          onSubmit={handleUpdate}
          onClose={() => setEditCredit(null)}
          loading={formLoading}
        />
      )}
    </div>
  );
}
