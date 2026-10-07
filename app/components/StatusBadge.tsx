import React from "react";

interface StatusBadgeProps {
  status: "AVAILABLE" | "HELD" | "SOLD" | "WAITING" | "PAID" | "EXPIRED" | "CANCELLED" | "CONFIRMED" | string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const text = label || normalized;

  let bgClasses = "bg-zinc-800 text-zinc-300 border-zinc-700";

  switch (normalized) {
    case "AVAILABLE":
    case "PAID":
    case "CONFIRMED":
    case "COMPLETED":
      bgClasses = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
      break;
    case "HELD":
    case "WAITING":
    case "OFFERED":
    case "PENDING":
      bgClasses = "bg-amber-950/80 text-amber-400 border-amber-500/30";
      break;
    case "SOLD":
    case "EXPIRED":
    case "CANCELLED":
    case "FAILED":
      bgClasses = "bg-rose-950/80 text-rose-400 border-rose-500/30";
      break;
    default:
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
      ? "px-3.5 py-1.5 text-sm font-semibold"
      : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${bgClasses} ${sizeClasses} tracking-wide transition-all`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {text}
    </span>
  );
}
