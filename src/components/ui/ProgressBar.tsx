"use client";

import { formatCurrency } from "@/lib/utils/format";

interface ProgressBarProps {
  value: number;
  max: number;
  showOverflow?: boolean;
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  max,
  showOverflow = true,
  size = "sm",
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = value > max;
  const h = size === "sm" ? "h-2" : "h-3";

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full ${h} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver
              ? "bg-red-500"
              : pct >= 80
              ? "bg-amber-500"
              : "bg-blue-500"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {isOver && showOverflow && (
        <p className="text-xs text-red-500 mt-0.5 font-medium">
          Dépassement de {formatCurrency(value - max)}
        </p>
      )}
    </div>
  );
}
