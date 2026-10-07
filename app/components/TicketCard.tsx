"use client";

import React, { useState } from "react";
import { TicketCancelResponse } from "@/app/types";

interface TicketCardProps {
  ticketId: number;
  seatNumber: string;
  userId: string;
  providerPaymentId?: string;
  onTicketCancelled?: () => void;
  onBookAnother?: () => void;
}

export function TicketCard({
  ticketId,
  seatNumber,
  userId,
  providerPaymentId = "PAY_DEMO_99823",
  onTicketCancelled,
  onBookAnother,
}: TicketCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelledState, setCancelledState] = useState(false);
  const [promotedInfo, setPromotedInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCancelTicket = async () => {
    if (isCancelling || cancelledState) return;

    setIsCancelling(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/tickets/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: ticketId,
        }),
      });

      const data: TicketCancelResponse = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to cancel ticket.");
        setIsCancelling(false);
        return;
      }

      setCancelledState(true);

      if (data.cancellation?.hold_created || data.cancellation?.promoted_user_id) {
        setPromotedInfo("The seat has been offered to the next person in the queue.");
      } else {
        setPromotedInfo("The seat is now back in the available pool.");
      }

      onTicketCancelled?.();
    } catch {
      setErrorMsg("Network error trying to cancel ticket.");
      setIsCancelling(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-4 py-1.5 text-xs font-bold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          {cancelledState ? "Ticket Cancelled" : "Ticket Confirmed"}
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          {cancelledState ? "Reservation Released" : "You're going to the concert 🎉"}
        </h2>
        <p className="text-xs text-zinc-400">
          {cancelledState
            ? "Your ticket cancellation has been recorded in PostgreSQL."
            : "Present this digital ticket stub at the venue entrance."}
        </p>
      </div>

      {/* Ticket Card Container (Sleek Ticket Stub Visual) */}
      <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/95 overflow-hidden shadow-2xl">
        {/* Top Header Graphic */}
        <div className="bg-gradient-to-r from-violet-900 via-indigo-950 to-cyan-900 p-6 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              DropTix Event Ticket
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              DropTix Launch Concert
            </h3>
            <p className="text-xs text-zinc-300 mt-1">
              Sat, Oct 24, 2026 • 8:00 PM IST
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              {cancelledState ? "CANCELLED" : "CONFIRMED"}
            </span>
          </div>
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <p className="text-[11px] text-zinc-400">Seat Number</p>
              <p className="text-2xl font-mono font-black text-indigo-400">{seatNumber}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Ticket ID</p>
              <p className="text-lg font-mono font-bold text-white">#{ticketId}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Payment Status</p>
              <p className="text-sm font-semibold text-emerald-400">Paid (₹10.00)</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">User ID</p>
              <p className="text-xs font-mono text-zinc-300 truncate">{userId}</p>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <p className="text-[11px] text-zinc-400">Payment Ref</p>
              <p className="text-xs font-mono text-zinc-400 truncate">{providerPaymentId}</p>
            </div>
          </div>

          {/* Fake Visual QR Code & Barcode Placeholder */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center gap-4">
              {/* Decorative SVG QR code */}
              <div className="h-20 w-20 bg-white p-2 rounded-xl flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-full h-full text-black fill-current">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm9-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h2v2h-2v-2zm-4 0h2v4h-2v-4zm2 4h2v4h-2v-4zm2-2h2v4h-2v-4zm-4 4h2v2h-2v-2z" />
                </svg>
              </div>
              <div className="text-xs text-zinc-400">
                <p className="font-bold text-white">Scan at Venue</p>
                <p className="text-[11px] mt-0.5">Valid for 1 entry</p>
                <p className="font-mono text-[10px] text-zinc-500 mt-1">HASH-{ticketId}-DROPTIX</p>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="flex items-center gap-1 opacity-70 h-10">
              <div className="w-1 h-full bg-white" />
              <div className="w-2 h-full bg-white" />
              <div className="w-0.5 h-full bg-white" />
              <div className="w-1.5 h-full bg-white" />
              <div className="w-0.5 h-full bg-white" />
              <div className="w-2 h-full bg-white" />
              <div className="w-1 h-full bg-white" />
              <div className="w-0.5 h-full bg-white" />
              <div className="w-1.5 h-full bg-white" />
            </div>
          </div>
        </div>

        {/* Cancellation Section */}
        {cancelledState ? (
          <div className="p-6 bg-zinc-950 border-t border-zinc-800 text-center space-y-3">
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              💡 {promotedInfo}
            </div>
            {onBookAnother && (
              <button
                onClick={onBookAnother}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                Return to Landing / Book Another Seat
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400 text-center sm:text-left">
              Need to release your seat? Cancel ticket anytime before sale ends.
            </div>

            <button
              disabled={isCancelling}
              onClick={handleCancelTicket}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white text-xs font-semibold transition-all shrink-0"
            >
              {isCancelling ? "Cancelling..." : "Cancel ticket"}
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs text-center">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
