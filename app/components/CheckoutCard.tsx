"use client";

import React, { useState } from "react";
import { Countdown } from "./Countdown";
import { PaymentCreateResponse } from "@/app/types";

interface CheckoutCardProps {
  holdId: number;
  seatId: number;
  seatNumber: string;
  expiresAt: string;
  userId: string;
  onPaymentSuccess: (paymentData: PaymentCreateResponse) => void;
  onReturnToSeats: () => void;
}

export function CheckoutCard({
  holdId,
  seatNumber,
  expiresAt,
  userId,
  onPaymentSuccess,
  onReturnToSeats,
}: CheckoutCardProps) {
  const [isExpired, setIsExpired] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("Processing payment...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePay = async () => {
    if (isExpired || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setLoadingStage("Processing payment with provider...");

    // Stage delay effect for visual realism
    const stageTimeout = setTimeout(() => {
      setLoadingStage("Confirming ticket in database transaction...");
    }, 700);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holdId: holdId,
          amount: 1000,
        }),
      });

      clearTimeout(stageTimeout);
      const data: PaymentCreateResponse = await res.json();

      if (!res.ok || !data.success || data.paymentStatus === "FAILED") {
        setErrorMessage("Payment failed. Your seat has not been purchased.");
        setIsProcessing(false);
        return;
      }

      // Success!
      onPaymentSuccess(data);
    } catch {
      clearTimeout(stageTimeout);
      setErrorMessage("Network error processing payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
              Secure Checkout
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Your Seat Reserved
            </h2>
          </div>
          <span className="h-9 w-9 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-lg">
            💳
          </span>
        </div>

        {/* Seat Summary Box */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Event</p>
              <p className="text-sm font-semibold text-white">DropTix Launch Concert</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Selected Seat</p>
              <p className="text-xl font-mono font-black text-indigo-400">{seatNumber}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
            <div>
              <p className="text-xs text-zinc-400">Total Price</p>
              <p className="text-2xl font-black text-emerald-400">₹10.00</p>
            </div>
            <div className="text-right text-xs text-zinc-400">
              <p>User ID: <span className="font-mono text-zinc-300">{userId}</span></p>
              <p>Hold ID: <span className="font-mono text-zinc-300">#{holdId}</span></p>
            </div>
          </div>
        </div>

        {/* Hold Expiration Countdown */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
          {isExpired ? (
            <div className="space-y-2 text-center">
              <p className="text-sm font-bold text-rose-400">Your seat hold expired.</p>
              <p className="text-xs text-zinc-400">Holds are released after 5 minutes to keep seats fair.</p>
            </div>
          ) : (
            <Countdown
              expiresAt={expiresAt}
              onExpire={() => setIsExpired(true)}
            />
          )}
        </div>

        {/* Errors */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 font-bold hover:text-rose-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Pay Button / Actions */}
        <div>
          {isExpired ? (
            <button
              onClick={onReturnToSeats}
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all"
            >
              Return to Seat Selection
            </button>
          ) : (
            <button
              disabled={isProcessing}
              onClick={handlePay}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-xl transition-all duration-200 ${
                isProcessing
                  ? "bg-zinc-800 cursor-not-allowed text-zinc-400"
                  : "bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-600 hover:brightness-110 active:scale-98 shadow-emerald-900/30"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                  <span>{loadingStage}</span>
                </div>
              ) : (
                "Pay ₹10.00"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
