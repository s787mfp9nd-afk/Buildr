"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectInsert } from "@/lib/types/database";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setProjects(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function createProject(project: ProjectInsert) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...project, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setProjects((prev) => [data, ...prev]);

      // Sauvegarder comme dernier projet
      await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, last_project_id: data.id }, { onConflict: "user_id" });
    }

    return data;
  }

  async function updateProject(id: string, updates: Partial<ProjectInsert>) {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    }

    return data;
  }

  async function deleteProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    return !error;
  }

  return { projects, loading, createProject, updateProject, deleteProject, refresh: fetchProjects };
}

export function useActiveProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadActiveProject() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Charger les préférences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("last_project_id")
        .eq("user_id", user.id)
        .single();

      if (prefs?.last_project_id) {
        const { data: proj } = await supabase
          .from("projects")
          .select("*")
          .eq("id", prefs.last_project_id)
          .single();

        if (proj) {
          setProject(proj);
          setProjectId(proj.id);
          setLoading(false);
          return;
        }
      }

      // Fallback: premier projet
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (projects && projects.length > 0) {
        setProject(projects[0]);
        setProjectId(projects[0].id);
      }

      setLoading(false);
    }

    loadActiveProject();
  }, [supabase]);

  async function switchProject(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (proj) {
      setProject(proj);
      setProjectId(proj.id);

      await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, last_project_id: id }, { onConflict: "user_id" });
    }
  }

  return { project, projectId, loading, switchProject };
}
