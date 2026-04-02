"use client";

import { type ReactNode } from "react";

type BadgeColor = "green" | "yellow" | "purple" | "blue" | "red" | "gray";

const colorMap: Record<BadgeColor, string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  purple: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-600",
};

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

export function Badge({ children, color = "gray" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, BadgeColor]> = {
    prevu: ["Prévu", "blue"],
    engage: ["Engagé", "purple"],
    paye: ["Payé", "green"],
  };
  const [label, color] = map[status] || ["?", "gray"];
  return <Badge color={color}>{label}</Badge>;
}
