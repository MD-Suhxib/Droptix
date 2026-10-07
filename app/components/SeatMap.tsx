"use client";

import React, { useState } from "react";
import { SeatCard } from "./SeatCard";
import { SeatItem, SeatHoldResponse } from "@/app/types";

interface SeatMapProps {
  userId: string;
  onHoldSuccess: (holdId: number, seatId: number, seatNumber: string, expiresAt: string) => void;
  onBackToQueue?: () => void;
}

const INITIAL_SEATS: SeatItem[] = [
  { id: 1, seatNumber: "A-1", status: "AVAILABLE", price: 10 },
  { id: 2, seatNumber: "A-2", status: "AVAILABLE", price: 10 },
  { id: 3, seatNumber: "A-3", status: "AVAILABLE", price: 10 },
  { id: 4, seatNumber: "A-4", status: "AVAILABLE", price: 10 },
  { id: 5, seatNumber: "A-5", status: "AVAILABLE", price: 10 },
  { id: 6, seatNumber: "A-6", status: "AVAILABLE", price: 10 },
  { id: 7, seatNumber: "A-7", status: "AVAILABLE", price: 10 },
  { id: 8, seatNumber: "A-8", status: "AVAILABLE", price: 10 },
  { id: 9, seatNumber: "A-9", status: "AVAILABLE", price: 10 },
  { id: 10, seatNumber: "A-10", status: "AVAILABLE", price: 10 },
];

export function SeatMap({ userId, onHoldSuccess, onBackToQueue }: SeatMapProps) {
  const [seats, setSeats] = useState<SeatItem[]>(INITIAL_SEATS);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSeatClick = async (seatId: number) => {
    setSelectedSeatId(seatId);
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const targetSeat = seats.find((s) => s.id === seatId);

    try {
      const response = await fetch("/api/seats/hold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatId: seatId,
          userId: userId,
        }),
      });

      const data: SeatHoldResponse = await response.json();

      if (!response.ok || !data.success || !data.hold) {
        if (response.status === 409 || data.error?.includes("currently held")) {
          // Update local state to show seat is held by another user
          setSeats((prev) =>
            prev.map((s) => (s.id === seatId ? { ...s, status: "HELD" } : s))
          );
          setErrorMessage("That seat was just taken. Please choose another seat.");
        } else if (response.status === 429) {
          setErrorMessage("You're making requests too quickly. Please wait a moment.");
        } else {
          setErrorMessage(data.error || "Failed to reserve seat. Please try again.");
        }
        setSelectedSeatId(null);
        setIsLoading(false);
        return;
      }

      // Seat hold succeeded!
      const holdObj = data.hold as Record<string, unknown>;
      const actualHoldId =
        (holdObj.id as number) ??
        (holdObj.hold_id as number) ??
        (holdObj.p_hold_id as number) ??
        1;
      const actualExpiresAt =
        (holdObj.expires_at as string) ??
        (holdObj.expiresAt as string) ??
        new Date(Date.now() + 5 * 60 * 1000).toISOString();

      setInfoMessage(
        `Seat ${targetSeat?.seatNumber || seatId} successfully held for 5 minutes!`
      );

      onHoldSuccess(
        actualHoldId,
        seatId,
        targetSeat?.seatNumber || `A-${seatId}`,
        actualExpiresAt
      );
    } catch {
      setErrorMessage("Network error while communicating with backend.");
      setSelectedSeatId(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 mb-1">
              <span>🎟️</span> Live Seat Selection
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Select Your Seat
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Click any available seat to initiate a 5-minute atomic hold in PostgreSQL.
            </p>
          </div>

          {onBackToQueue && (
            <button
              onClick={onBackToQueue}
              className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:border-zinc-700 hover:text-white transition-all self-start sm:self-auto"
            >
              ← Back to Queue
            </button>
          )}
        </div>

        {/* Stage Graphic */}
        <div className="w-full py-2 flex flex-col items-center">
          <div className="w-4/5 sm:w-2/3 h-8 bg-gradient-to-b from-indigo-900/40 via-indigo-600/20 to-transparent border-t-2 border-indigo-500/50 rounded-t-full flex items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
              STAGE / PERFORMANCE AREA
            </span>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between animate-shake">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 font-bold text-sm hover:text-rose-200 px-2"
            >
              ✕
            </button>
          </div>
        )}

        {infoMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5">
            <span className="text-base">✓</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2 border-y border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-indigo-600 border border-indigo-400" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500/50" />
            <span>Held (5m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-zinc-950 border border-zinc-800" />
            <span>Sold</span>
          </div>
        </div>

        {/* Seat Grid A-1 to A-10 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {seats.map((seat) => (
            <SeatCard
              key={seat.id}
              seat={seat}
              isSelected={selectedSeatId === seat.id}
              isLoading={isLoading && selectedSeatId === seat.id}
              onSelect={handleSeatClick}
            />
          ))}
        </div>

        {/* Footer info note */}
        <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">🔒 PostgreSQL Lock:</span>
            <span>`hold_seat()` locks target seat row preventing double reservations.</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">10 Seats Active</span>
        </div>
      </div>
    </div>
  );
}
