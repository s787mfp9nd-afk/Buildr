"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewProjectPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    total_budget: "",
    start_date: "",
    description: "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit = !!form.name.trim() && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Non connecté. Veuillez vous reconnecter.");
      setSubmitting(false);
      return;
    }

    const { data, error: sbError } = await supabase
      .from("projects")
      .insert({
        name: form.name.trim(),
        total_budget: parseFloat(form.total_budget) || 0,
        start_date: form.start_date || null,
        description: form.description.trim() || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (sbError || !data) {
      setError(sbError?.message ?? "Erreur inconnue lors de la création.");
      setSubmitting(false);
      return;
    }

    // Sauvegarder comme projet actif
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, last_project_id: data.id },
        { onConflict: "user_id" }
      );

    router.push("/dashboard");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      if (canSubmit) handleSubmit();
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nouveau projet</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5" onKeyDown={handleKeyDown}>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-red-700 mb-0.5">Erreur</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Nom */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Nom du projet *
          </label>
          <input
            autoFocus
            type="text"
            placeholder="Ex : Rénovation maison, Extension garage…"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Budget total (€)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={form.total_budget}
            onChange={(e) => set("total_budget", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date de début */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Date de début (optionnel)
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Description (optionnel)
          </label>
          <textarea
            rows={3}
            placeholder="Notes, adresse du chantier…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Création…" : "Créer le projet"}
          </button>
        </div>
      </div>
    </div>
  );
}
