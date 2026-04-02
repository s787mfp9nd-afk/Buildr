"use client";

type KPIColor = "primary" | "success" | "warning" | "danger" | "engaged";

const colorMap: Record<KPIColor, string> = {
  primary: "border-l-blue-500",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  danger: "border-l-red-500",
  engaged: "border-l-violet-500",
};

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: KPIColor;
}

export function KPICard({
  label,
  value,
  subtext,
  color = "primary",
}: KPICardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-4 border-l-4 ${colorMap[color]} shadow-sm`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}
