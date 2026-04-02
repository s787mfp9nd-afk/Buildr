"use client";

import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/hooks/useProjects";
import { useLots } from "@/lib/hooks/useLots";
import { useExpenses } from "@/lib/hooks/useExpenses";
import { useCredits } from "@/lib/hooks/useCredits";
import { KPICard } from "@/components/ui/KPICard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";
import {
  formatCurrency,
  formatPercent,
  formatRelativeDate,
} from "@/lib/utils/format";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20" />
        ))}
      </div>
      <SkeletonBlock className="h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
function AlertBanner({
  level,
  message,
}: {
  level: "danger" | "warning";
  message: string;
}) {
  const styles =
    level === "danger"
      ? "bg-red-600 text-white"
      : "bg-amber-500 text-white";

  const icon = level === "danger" ? "⚠" : "!";

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center gap-3 font-medium ${styles}`}>
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-sm">{message}</span>
    </div>
  );
}

// ─── KPI couleur selon seuil ──────────────────────────────────────────────────
function kpiColorFromRatio(
  value: number,
  max: number
): "success" | "warning" | "danger" {
  if (max <= 0) return "success";
  const ratio = value / max;
  if (ratio > 1) return "danger";
  if (ratio >= 0.8) return "warning";
  return "success";
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  const { activeProject, loading: projectLoading } = useProjects();
  const projectId = activeProject?.id ?? null;

  const {
    summaries,
    loading: lotsLoading,
    refresh: refreshLots,
  } = useLots(projectId);

  const {
    expenses,
    totals,
    loading: expensesLoading,
    refresh: refreshExpenses,
  } = useExpenses(projectId);

  const {
    globalTotals,
    loading: creditsLoading,
    // useCredits n'expose pas encore refresh — on recharge via remontage si besoin
  } = useCredits(projectId);

  const loading =
    projectLoading || lotsLoading || expensesLoading || creditsLoading;

  // ── Refresh manuel ──
  function handleRefresh() {
    refreshLots();
    refreshExpenses();
  }

  // ── Données dérivées ──
  const totalBudget = summaries.reduce((s, l) => s + l.planned_budget, 0);
  const resteAPayer = totalBudget - totals.total;
  const budgetRatio = totalBudget > 0 ? totals.total / totalBudget : 0;

  const topLots = [...summaries]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 8);

  const recentExpenses = expenses.slice(0, 8);

  // ── État de chargement ──
  if (loading) return <DashboardSkeleton />;

  // ── État vide ──
  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">
          🏗️
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800">
            Aucun projet trouvé
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Commencez par créer un projet, puis ajoutez vos lots et dépenses.
          </p>
        </div>
        <a
          href="/projects/new"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Créer un projet
        </a>
      </div>
    );
  }

  if (summaries.length === 0 && expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
          📋
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800">
            Projet vide
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ajoutez vos lots de travaux et vos premières dépenses pour commencer le suivi.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/lots"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Créer des lots
          </a>
          <a
            href="/expenses"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Ajouter une dépense
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header avec refresh ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{activeProject.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Vue globale du projet</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* ── Alertes globales ── */}
      {budgetRatio > 1 && (
        <AlertBanner
          level="danger"
          message={`Dépassement du budget global de ${formatCurrency(totals.total - totalBudget)}`}
        />
      )}
      {budgetRatio >= 0.8 && budgetRatio <= 1 && (
        <AlertBanner
          level="warning"
          message={`Attention : ${formatPercent(budgetRatio * 100)} du budget consommé — reste ${formatCurrency(resteAPayer)}`}
        />
      )}

      {/* ── KPIs cliquables ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => router.push("/lots")}
          className="text-left"
        >
          <KPICard
            label="Budget lots"
            value={formatCurrency(totalBudget)}
            subtext={`${summaries.length} lot${summaries.length > 1 ? "s" : ""}`}
            color="primary"
          />
        </button>

        <button
          onClick={() => router.push("/expenses")}
          className="text-left"
        >
          <KPICard
            label="Total dépensé"
            value={formatCurrency(totals.total)}
            subtext={
              totalBudget > 0
                ? formatPercent(budgetRatio * 100) + " du budget"
                : undefined
            }
            color={kpiColorFromRatio(totals.total, totalBudget)}
          />
        </button>

        <button
          onClick={() => router.push("/expenses?status=engage")}
          className="text-left"
        >
          <KPICard
            label="Engagé non payé"
            value={formatCurrency(totals.engage)}
            subtext="À débourser prochainement"
            color={totals.engage > 0 ? "engaged" : "success"}
          />
        </button>

        <button
          onClick={() => router.push("/expenses")}
          className="text-left"
        >
          <KPICard
            label="Reste à payer"
            value={formatCurrency(Math.max(resteAPayer, 0))}
            subtext={
              totals.prevu > 0
                ? `Dont ${formatCurrency(totals.prevu)} prévu`
                : undefined
            }
            color={kpiColorFromRatio(totals.total, totalBudget)}
          />
        </button>
      </div>

      {/* ── Crédit ── */}
      {globalTotals.total_amount > 0 && (
        <button
          onClick={() => router.push("/credits")}
          className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Crédit</h2>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-400">Total emprunté</p>
              <p className="text-base font-bold text-gray-900">
                {formatCurrency(globalTotals.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Débloqué</p>
              <p className="text-base font-bold text-blue-600">
                {formatCurrency(globalTotals.total_released)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Restant à débloquer</p>
              <p
                className={`text-base font-bold ${
                  globalTotals.remaining_to_release > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(globalTotals.remaining_to_release)}
              </p>
            </div>
          </div>
          <ProgressBar
            value={globalTotals.total_released}
            max={globalTotals.total_amount}
            showOverflow={false}
            size="md"
          />
          <p className="text-xs text-gray-400 mt-1">
            {formatPercent(
              globalTotals.total_amount > 0
                ? (globalTotals.total_released / globalTotals.total_amount) * 100
                : 0
            )}{" "}
            débloqué
            {globalTotals.monthly_payment > 0 &&
              ` · ${formatCurrency(globalTotals.monthly_payment)}/mois`}
          </p>
        </button>
      )}

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Répartition par lots */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Répartition par lots
            </h2>
            <a
              href="/lots"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir tout
            </a>
          </div>

          {topLots.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Aucun lot pour le moment.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {topLots.map((lot) => {
                const isOver = lot.total_spent > lot.planned_budget;
                const isNear =
                  !isOver && lot.progress_pct >= 80;

                return (
                  <li key={lot.lot_id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {lot.name}
                        </span>
                        {isOver && (
                          <span className="shrink-0 text-xs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-md">
                            Dépassement
                          </span>
                        )}
                        {isNear && (
                          <span className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                            {formatPercent(lot.progress_pct)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatCurrency(lot.total_spent)}{" "}
                        <span className="text-gray-300">/</span>{" "}
                        {formatCurrency(lot.planned_budget)}
                      </span>
                    </div>
                    <ProgressBar
                      value={lot.total_spent}
                      max={lot.planned_budget}
                      showOverflow={false}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Dernières dépenses */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Dernières dépenses
            </h2>
            <a
              href="/expenses"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir tout
            </a>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400 mb-2">Aucune dépense pour le moment.</p>
              <a
                href="/expenses"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Ajouter une dépense →
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push("/expenses")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {expense.supplier ?? expense.lot?.name ?? "—"}
                      </span>
                      <StatusBadge status={expense.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {expense.lot?.name}
                      {" · "}
                      {formatRelativeDate(expense.expense_date)}
                      {expense.credit_id && " · Crédit"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatCurrency(expense.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
