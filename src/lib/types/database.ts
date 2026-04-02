// ============================================
// Types TypeScript alignés sur le schéma PostgreSQL
// ============================================

export type ExpenseStatus = "prevu" | "engage" | "paye";
export type ExpenseType = "travaux" | "frais_annexe";
export type LotCategory = "travaux" | "annexe";

// ============================================
// Tables de base
// ============================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  total_budget: number;
  start_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lot {
  id: string;
  project_id: string;
  name: string;
  category: LotCategory;
  planned_budget: number;
  url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Credit {
  id: string;
  project_id: string;
  name: string;
  total_amount: number;
  interest_rate: number | null;
  duration_months: number | null;
  monthly_payment: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreditRelease {
  id: string;
  credit_id: string;
  amount: number;
  release_date: string;
  note: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  lot_id: string;
  credit_id: string | null;
  amount: number;
  expense_date: string;
  status: ExpenseStatus;
  expense_type: ExpenseType;
  supplier: string | null;
  is_bank_debited: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  last_project_id: string | null;
  last_lot_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Vues calculées
// ============================================

export interface LotSummary {
  lot_id: string;
  project_id: string;
  name: string;
  category: LotCategory;
  planned_budget: number;
  total_spent: number;
  total_engaged: number;
  total_paid: number;
  total_planned: number;
  remaining: number;
  progress_pct: number;
}

export interface CreditSummary {
  credit_id: string;
  project_id: string;
  name: string;
  total_amount: number;
  monthly_payment: number | null;
  total_released: number;
  remaining_to_release: number;
  total_expenses_linked: number;
}

export interface ProjectDashboard {
  project_id: string;
  project_name: string;
  total_budget: number;
  total_lots_budget: number;
  total_spent: number;
  total_engaged: number;
  total_paid: number;
  total_planned_expenses: number;
  remaining_to_pay: number;
  total_via_credit: number;
  total_via_fonds_propres: number;
  total_not_bank_debited: number;
}

// ============================================
// Types pour les formulaires (création/édition)
// ============================================

export interface ProjectInsert {
  name: string;
  total_budget: number;
  start_date?: string | null;
  description?: string | null;
}

export interface LotInsert {
  project_id: string;
  name: string;
  category: LotCategory;
  planned_budget: number;
  url?: string | null;
  sort_order?: number;
}

export interface ExpenseInsert {
  project_id: string;
  lot_id: string;
  credit_id?: string | null;
  amount: number;
  expense_date?: string;
  status?: ExpenseStatus;
  expense_type?: ExpenseType;
  supplier?: string | null;
  is_bank_debited?: boolean;
  note?: string | null;
}

export interface CreditInsert {
  project_id: string;
  name: string;
  total_amount: number;
  interest_rate?: number | null;
  duration_months?: number | null;
  monthly_payment?: number | null;
}

export interface CreditReleaseInsert {
  credit_id: string;
  amount: number;
  release_date: string;
  note?: string | null;
}

// ============================================
// Types enrichis (avec jointures)
// ============================================

export interface ExpenseWithRelations extends Expense {
  lot?: Lot;
  credit?: Credit | null;
}
