"use client";

import React from "react";
import { SeatItem } from "@/app/types";

interface SeatCardProps {
  seat: SeatItem;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (seatId: number) => void;
  onUnavailableClick?: (seat: SeatItem, reason: "SOLD" | "HELD") => void;
}

export function SeatCard({
  seat,
  isSelected,
  isLoading,
  onSelect,
  onUnavailableClick,
}: SeatCardProps) {
  const isAvailable = seat.status === "AVAILABLE";
  const isHeld = seat.status === "HELD";
  const isSold = seat.status === "SOLD";

  const handleClick = () => {
    if (isLoading) return;

    if (isSold) {
      onUnavailableClick?.(seat, "SOLD");
      return;
    }

    if (isHeld) {
      onUnavailableClick?.(seat, "HELD");
      return;
    }

    if (isAvailable) {
      onSelect(seat.id);
    }
  };

  let colorStyle =
    "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/30 hover:scale-[1.02] shadow-md hover:shadow-emerald-950/50 cursor-pointer";
  let statusBadge = "AVAILABLE";

  if (isSelected) {
    colorStyle =
      "border-indigo-400 bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-400 scale-[1.02] cursor-pointer";
    statusBadge = "SELECTED";
  } else if (isHeld) {
    colorStyle =
      "border-amber-500/40 bg-amber-950/25 text-amber-300/90 hover:border-amber-400 hover:bg-amber-950/40 cursor-pointer";
    statusBadge = "HELD (5M)";
  } else if (isSold) {
    colorStyle =
      "border-rose-950/50 bg-zinc-950/90 text-zinc-500 hover:border-rose-800/60 hover:bg-zinc-900/90 cursor-pointer opacity-75";
    statusBadge = "SOLD OUT";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex flex-col items-center justify-between rounded-xl border p-4 transition-all duration-200 min-h-[115px] w-full ${colorStyle}`}
    >
      {/* Top Seat Icon & Number */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-mono opacity-60">#{String(seat.id).padStart(2, "0")}</span>
        <span className="text-xs font-mono font-bold">
          {isSold ? (
            <span className="text-rose-400" title="Sold Out">🔒</span>
          ) : isHeld ? (
            <span className="text-amber-400" title="Held in Checkout">⏱️</span>
          ) : (
            <span className="text-emerald-400" title="Available">🎟️</span>
          )}
        </span>
      </div>

      <div className="my-1 text-center">
        <div className={`text-xl font-black tracking-tight font-mono ${isSold ? "line-through opacity-70 text-zinc-400" : ""}`}>
          {seat.seatNumber}
        </div>
        <div className="text-[11px] font-semibold mt-0.5 opacity-80">
          {isSold ? "Unavailable" : `₹${seat.price.toFixed(2)}`}
        </div>
      </div>

      {/* Status Pill */}
      <div className="w-full text-center">
        <span
          className={`inline-block w-full py-0.5 px-1 text-[10px] font-extrabold rounded uppercase tracking-wider ${
            isSelected
              ? "bg-white/20 text-white"
              : isAvailable
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : isHeld
              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              : "bg-rose-950/60 text-rose-400 border border-rose-900/40"
          }`}
        >
          {isLoading && isSelected ? "Holding..." : statusBadge}
        </span>
      </div>
    </button>
  );
}
