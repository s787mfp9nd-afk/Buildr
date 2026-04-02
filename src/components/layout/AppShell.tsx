"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/lib/hooks/useProjects";
import { useUser } from "@/lib/hooks/useUser";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Project } from "@/lib/types/database";

// Auth pages that bypass the shell entirely
const AUTH_ROUTES = ["/login", "/register"];

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconExpenses({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
function IconLots({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}
function IconCredits({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard",  Icon: IconDashboard },
  { href: "/expenses",  label: "Dépenses",   Icon: IconExpenses  },
  { href: "/lots",      label: "Lots",        Icon: IconLots      },
  { href: "/credits",   label: "Crédits",     Icon: IconCredits   },
];

// ─── Navigation progress bar ─────────────────────────────────────────────────
// Animates a thin blue bar across the top on every pathname change.

function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setState("running");
    setWidth(0);

    // Two-phase animation: quick ramp to 80%, then snap to 100%
    const t1 = setTimeout(() => setWidth(80),  20);
    const t2 = setTimeout(() => setWidth(100), 450);
    const t3 = setTimeout(() => setState("done"), 700);
    const t4 = setTimeout(() => { setState("idle"); setWidth(0); }, 900);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [pathname]);

  if (state === "idle") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 h-0.5 bg-blue-500 z-[60]"
      style={{
        width: `${width}%`,
        opacity: state === "done" ? 0 : 1,
        transition:
          width === 80
            ? "width 430ms cubic-bezier(0.4,0,0.2,1)"
            : width === 100
            ? "width 180ms ease-in, opacity 200ms ease 200ms"
            : "none",
      }}
    />
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className={`rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 flex-shrink-0 ${
        size === "md" ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs"
      }`}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Inline project rename (sidebar chip) ────────────────────────────────────

function InlineProjectName({ project }: { project: Project }) {
  const { update } = useProjects();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if project name changes from outside
  useEffect(() => { setValue(project.name); }, [project.name]);

  const save = useCallback(async () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== project.name) {
      await update(project.id, { name: trimmed });
    } else {
      setValue(project.name);
    }
    setEditing(false);
  }, [value, project, update]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") { setValue(project.name); setEditing(false); }
        }}
        className="text-sm font-semibold text-blue-900 bg-blue-100 border-b-2 border-blue-500 outline-none w-full rounded px-0.5 leading-tight"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Cliquer pour renommer"
      className="group flex items-center gap-1 text-sm font-semibold text-blue-900 truncate leading-tight text-left w-full"
    >
      <span className="truncate">{project.name}</span>
      <IconPencil className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

// ─── No-project blocking overlay ─────────────────────────────────────────────

function NoProjectOverlay() {
  const router = useRouter();
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/90 backdrop-blur-[2px]">
      <div className="text-center px-6 py-10 max-w-xs mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <IconFolder className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Créez ou sélectionnez un projet pour commencer le suivi de vos travaux.
        </p>
        <button
          onClick={() => router.push("/projects/new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <IconPlus className="w-4 h-4" />
          Créer un projet
        </button>
      </div>
    </div>
  );
}

// ─── Shared project list dropdown ────────────────────────────────────────────

// Keyframe for dropdown open animation (scale + fade in from origin)
const dropdownStyle = (
  <style>{`
    @keyframes dropdown-in {
      from { opacity: 0; transform: scale(0.95) translateY(4px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }
    .animate-dropdown-in { animation: dropdown-in 140ms cubic-bezier(0.16,1,0.3,1) forwards; }
  `}</style>
);

function ProjectDropdown({
  projects,
  activeProject,
  onSwitch,
  onNew,
  onClose,
  position = "bottom",
}: {
  projects: Project[];
  activeProject: Project | null;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
  position?: "top" | "bottom";
}) {
  const posClass = position === "top"
    ? "bottom-full left-0 right-0 mb-2 origin-bottom"
    : "top-full right-0 mt-2 w-56 origin-top";

  return (
    <>
      {dropdownStyle}
    <div className={`animate-dropdown-in absolute ${posClass} bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[200px]`}>
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Changer de projet</p>
      </div>
      <ul className="max-h-52 overflow-y-auto py-1">
        {projects.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-400 text-center">Aucun projet</li>
        )}
        {projects.map((p) => {
          const isActive = p.id === activeProject?.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => { onSwitch(p.id); onClose(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Avatar name={p.name} />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                {isActive && <IconCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-gray-100 py-1">
        <button
          onClick={() => { onNew(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center flex-shrink-0">
            <IconPlus className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">Nouveau projet</span>
        </button>
      </div>
    </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Estimated max-height of the open dropdown (header + ~4 items + footer)
const DROPDOWN_HEIGHT_PX = 280;

/**
 * Decide whether to open the dropdown upward or downward based on available
 * space around the trigger element. Falls back to `preferred` if either
 * direction has enough room.
 */
function computeDropPosition(
  el: HTMLElement,
  preferred: "top" | "bottom" = "bottom"
): "top" | "bottom" {
  const rect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  if (preferred === "bottom") {
    return spaceBelow >= DROPDOWN_HEIGHT_PX || spaceBelow >= spaceAbove
      ? "bottom"
      : "top";
  } else {
    return spaceAbove >= DROPDOWN_HEIGHT_PX || spaceAbove >= spaceBelow
      ? "top"
      : "bottom";
  }
}

// ─── Desktop project switcher (bottom of sidebar) ────────────────────────────

function ProjectSwitcher() {
  const router = useRouter();
  const { projects, activeProject, switchProject, loading } = useProjects();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<"top" | "bottom">("top");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      setDropPos(computeDropPosition(btnRef.current, "top"));
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
        title={activeProject?.name ?? "Aucun projet"}
      >
        {activeProject
          ? <Avatar name={activeProject.name} />
          : <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
        }
        <span className="flex-1 text-left truncate font-medium text-gray-700">
          {loading ? "…" : (activeProject?.name ?? "Aucun projet")}
        </span>
        <IconChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ProjectDropdown
          projects={projects}
          activeProject={activeProject}
          onSwitch={switchProject}
          onNew={() => router.push("/projects/new")}
          onClose={() => setOpen(false)}
          position={dropPos}
        />
      )}
    </div>
  );
}

// ─── Mobile project switcher (header) ────────────────────────────────────────

function MobileProjectSwitcher() {
  const router = useRouter();
  const { projects, activeProject, switchProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<"top" | "bottom">("bottom");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      setDropPos(computeDropPosition(btnRef.current, "bottom"));
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all duration-100"
        aria-label="Changer de projet"
      >
        {activeProject
          ? <Avatar name={activeProject.name} size="sm" />
          : <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
        }
        <IconChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ProjectDropdown
          projects={projects}
          activeProject={activeProject}
          onSwitch={switchProject}
          onNew={() => router.push("/projects/new")}
          onClose={() => setOpen(false)}
          position={dropPos}
        />
      )}
    </div>
  );
}

// ─── Main AppShell ────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeProject, loading } = useProjects();
  const { user, logout } = useUser();

  // Auth pages render without shell
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthPage) return <>{children}</>;

  const activeNav = NAV_ITEMS.find(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );
  const showNoProject = !loading && !activeProject;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Global navigation progress bar */}
      <NavigationProgress />

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200 z-30">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <span className="text-2xl leading-none">🏗️</span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Buildr</span>
        </div>

        {/* Active project chip (with inline rename) */}
        <div className="px-4 pt-4 pb-1">
          {activeProject ? (
            <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5">
              <Avatar name={activeProject.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider leading-none mb-1">
                  Projet actif
                </p>
                <InlineProjectName project={activeProject} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-200">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <IconFolder className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xs font-medium text-amber-700 leading-tight">
                Aucun projet actif
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md scale-[1.01] active:scale-[0.98] active:opacity-80"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:scale-[1.01] active:scale-[0.97] active:opacity-70"
                }`}
              >
                {/* Left accent bar — visible only on active item */}
                {isActive && (
                  <span className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-white/40" />
                )}
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors duration-150 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-blue-500"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Project switcher */}
        <div className="border-t border-gray-100 p-3 pb-0 flex-shrink-0">
          <ProjectSwitcher />
        </div>

        {/* User + logout */}
        {user && (
          <div className="border-t border-gray-100 px-3 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg group">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-gray-600">
                  {user.email?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              <span className="flex-1 text-xs text-gray-500 truncate min-w-0">
                {user.email}
              </span>
              <button
                onClick={logout}
                title="Se déconnecter"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all duration-100 flex-shrink-0"
              >
                <IconLogout className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile top header ─────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-30 gap-3">
        <div className="flex-1 min-w-0">
          {/* Project name as breadcrumb */}
          <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider leading-none mb-0.5 truncate">
            {activeProject?.name ?? "Aucun projet"}
          </p>
          <p className="text-base font-bold text-gray-900 leading-tight">
            {activeNav?.label ?? "Buildr"}
          </p>
        </div>
        <div className="flex-shrink-0">
          <MobileProjectSwitcher />
        </div>
      </header>

      {/* ── Main content (relative for overlay positioning) ───────────────── */}
      <main className="relative md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {showNoProject ? <NoProjectOverlay /> : children}
      </main>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200 z-30 flex items-stretch">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-100 active:scale-95 active:opacity-60 ${
                isActive ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {/* Top accent line for active tab */}
              {isActive && (
                <span className="absolute top-0 inset-x-1/4 h-0.5 rounded-b-full bg-blue-500" />
              )}
              <Icon
                className={`w-6 h-6 transition-transform duration-150 ${
                  isActive ? "text-blue-600 scale-110" : "text-gray-400"
                }`}
              />
              <span
                className={`text-[10px] font-semibold leading-none ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
