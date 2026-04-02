"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectInsert } from "@/lib/types/database";

export function useProjects() {
  const supabase = useMemo(() => createClient(), []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Le projet actif = celui sélectionné, ou le premier par défaut
  const activeProject = projects.find((p) => p.id === activeId) ?? projects[0] ?? null;

  // --- Chargement initial ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Charger tous les projets
      const { data: allProjects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled || !allProjects) {
        setLoading(false);
        return;
      }

      setProjects(allProjects);

      // 2. Charger la préférence du dernier projet
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("last_project_id")
          .eq("user_id", user.id)
          .single();

        const savedId = prefs?.last_project_id;
        const exists = allProjects.some((p) => p.id === savedId);
        setActiveId(exists ? savedId : allProjects[0]?.id ?? null);
      } else {
        setActiveId(allProjects[0]?.id ?? null);
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  // --- Sauvegarder la préférence quand on change de projet ---
  async function switchProject(projectId: string) {
    setActiveId(projectId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, last_project_id: projectId },
        { onConflict: "user_id" }
      );
  }

  // --- CRUD ---
  async function create(input: ProjectInsert) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error || !data) return null;

    setProjects((prev) => [data, ...prev]);
    setActiveId(data.id);

    // Sauvegarder comme dernier projet
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, last_project_id: data.id },
        { onConflict: "user_id" }
      );

    return data;
  }

  async function update(id: string, input: Partial<ProjectInsert>) {
    const { data, error } = await supabase
      .from("projects")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return null;

    setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
  }

  async function remove(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return false;

    setProjects((prev) => prev.filter((p) => p.id !== id));

    // Si on supprime le projet actif, basculer sur le suivant
    if (activeId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }

    return true;
  }

  return {
    projects,
    activeProject,
    loading,
    switchProject,
    create,
    update,
    remove,
  };
}
