/**
 * Formate un nombre en euros (ex: 1 350 €)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate un nombre en euros avec centimes (ex: 1 350,50 €)
 */
export function formatCurrencyExact(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formate un pourcentage (ex: 85%)
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formate une date ISO en format français (ex: 28/03/2026)
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formate une date relative (ex: "il y a 2 jours")
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return formatDate(dateStr);
}

/**
 * Retourne la date du jour au format ISO (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Label français pour les statuts
 */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    prevu: "Prévu",
    engage: "Engagé",
    paye: "Payé",
  };
  return map[status] || status;
}

/**
 * Label français pour les catégories
 */
export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    travaux: "Travaux",
    annexe: "Frais annexes",
    frais_annexe: "Frais annexes",
  };
  return map[category] || category;
}
