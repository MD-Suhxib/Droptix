import React from "react";
import { SeatItem } from "@/app/types";

interface SeatCardProps {
  seat: SeatItem;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (seatId: number) => void;
}

export function SeatCard({ seat, isSelected, isLoading, onSelect }: SeatCardProps) {
  const isAvailable = seat.status === "AVAILABLE";
  const isHeld = seat.status === "HELD";
  const isSold = seat.status === "SOLD";

  let colorStyle =
    "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/40 hover:shadow-lg hover:shadow-emerald-900/20 cursor-pointer";
  let statusBadge = "AVAILABLE";

  if (isSelected) {
    colorStyle =
      "border-indigo-400 bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-400 cursor-pointer";
    statusBadge = "SELECTED";
  } else if (isHeld) {
    colorStyle =
      "border-amber-500/30 bg-amber-950/20 text-amber-400/80 cursor-not-allowed opacity-75";
    statusBadge = "HELD";
  } else if (isSold) {
    colorStyle =
      "border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed opacity-50";
    statusBadge = "SOLD";
  }

  return (
    <button
      disabled={!isAvailable || isLoading}
      onClick={() => onSelect(seat.id)}
      className={`group relative flex flex-col items-center justify-between rounded-xl border p-4 transition-all duration-200 min-h-[110px] w-full ${colorStyle}`}
    >
      {/* Top Seat Icon & Number */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-mono opacity-60">#0{seat.id}</span>
        <span className="text-xs font-mono font-bold">
          {isSold ? "🔒" : isHeld ? "⏱️" : "🎟️"}
        </span>
      </div>

      <div className="my-1 text-center">
        <div className="text-lg font-black tracking-tight font-mono">
          {seat.seatNumber}
        </div>
        <div className="text-[11px] font-semibold mt-0.5 opacity-90">
          ₹{seat.price.toFixed(2)}
        </div>
      </div>

      {/* Status Pill */}
      <div className="w-full text-center">
        <span
          className={`inline-block w-full py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
            isSelected
              ? "bg-white/20 text-white"
              : isAvailable
              ? "bg-emerald-500/10 text-emerald-400"
              : isHeld
              ? "bg-amber-500/10 text-amber-400"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {isLoading && isSelected ? "Holding..." : statusBadge}
        </span>
      </div>
    </button>
  );
}
