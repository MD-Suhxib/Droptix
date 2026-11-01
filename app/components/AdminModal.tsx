"use client";

import React, { useState, useEffect, useCallback } from "react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeatsReset?: () => void;
}

interface SeatCounts {
  total: number;
  available: number;
  held: number;
  sold: number;
}

export function AdminModal({ isOpen, onClose, onSeatsReset }: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [seatCounts, setSeatCounts] = useState<SeatCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);
  const [resetLocalDemo, setResetLocalDemo] = useState<boolean>(true);

  // Fetch current seat statistics
  const fetchCounts = useCallback(async () => {
    try {
      setIsLoadingCounts(true);
      const res = await fetch("/api/seats?eventId=1");
      const data = await res.json();
      if (res.ok && data.success && data.counts) {
        setSeatCounts(data.counts);
      }
    } catch {
      // Quiet fail if network hiccup
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  // When modal opens or becomes authenticated, load live counts
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchCounts();
    }
  }, [isOpen, isAuthenticated, fetchCounts]);

  // Handle password submit
  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (password === "admin@123") {
      setIsAuthenticated(true);
      setPasswordError(null);
      setPassword("");
    } else {
      setPasswordError("Incorrect password. Please enter admin@123");
    }
  };

  // Handle Reset Seats
  const handleResetSeats = async () => {
    setIsResetting(true);
    setResetMessage(null);

    try {
      const res = await fetch("/api/admin/reset-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: "admin@123",
          eventId: 1,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResetMessage({
          type: "success",
          text: data.message || "All seats have been reset to AVAILABLE!",
        });

        // Update counts in modal
        if (seatCounts) {
          setSeatCounts({
            total: seatCounts.total,
            available: seatCounts.total,
            held: 0,
            sold: 0,
          });
        } else {
          fetchCounts();
        }

        // Notify parent application to refresh seats and optionally demo state
        onSeatsReset?.();
      } else {
        setResetMessage({
          type: "error",
          text: data.error || "Failed to reset seats.",
        });
      }
    } catch {
      setResetMessage({
        type: "error",
        text: "Network error occurred while resetting seats.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Log out / Lock admin
  const handleLockAdmin = () => {
    setIsAuthenticated(false);
    setPassword("");
    setPasswordError(null);
    setResetMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative space-y-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1 text-sm rounded-lg hover:bg-zinc-800"
          title="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 text-lg font-bold">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                DropTix Admin Panel
              </h2>
              {isAuthenticated && (
                <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ● Authenticated
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {isAuthenticated
                ? "Manage event seat inventory and testing controls"
                : "Enter admin password to access restricted controls"}
            </p>
          </div>
        </div>

        {/* Screen 1: Password Prompt */}
        {!isAuthenticated ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Admin Password:</span>
                <span className="text-[11px] text-zinc-500 font-normal">
                  (Hint: <code className="text-purple-300">admin@123</code>)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  autoFocus
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-98 transition-all flex items-center gap-1.5"
              >
                <span>Enter Admin</span>
                <span>→</span>
              </button>
            </div>
          </form>
        ) : (
          /* Screen 2: Authenticated Admin Controls */
          <div className="space-y-5">
            {/* Live Seat Status Summary */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Current Seat Inventory (Event #1)
                </h3>
                <button
                  onClick={fetchCounts}
                  disabled={isLoadingCounts}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span className={isLoadingCounts ? "animate-spin" : ""}>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>

              {seatCounts ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800/80">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Total</p>
                    <p className="text-lg font-black text-white">{seatCounts.total}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-950/40 p-2.5 border border-emerald-800/40">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Available</p>
                    <p className="text-lg font-black text-emerald-300">{seatCounts.available}</p>
                  </div>
                  <div className="rounded-lg bg-amber-950/40 p-2.5 border border-amber-800/40">
                    <p className="text-[10px] uppercase font-bold text-amber-400">Held</p>
                    <p className="text-lg font-black text-amber-300">{seatCounts.held}</p>
                  </div>
                  <div className="rounded-lg bg-rose-950/40 p-2.5 border border-rose-800/40">
                    <p className="text-[10px] uppercase font-bold text-rose-400">Sold</p>
                    <p className="text-lg font-black text-rose-300">{seatCounts.sold}</p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 py-3 text-center">
                  Loading seat inventory...
                </div>
              )}
            </div>

            {/* Reset Seats Action Section */}
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span>⚡</span> Testing Actions
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Resetting marks all 10 seats as <strong>AVAILABLE</strong> in PostgreSQL, cancels all active holds, cancels confirmed tickets, and clears waitlist queues.
                </p>
              </div>

              {resetMessage && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    resetMessage.type === "success"
                      ? "bg-emerald-950/70 border-emerald-700/60 text-emerald-200"
                      : "bg-rose-950/70 border-rose-700/60 text-rose-200"
                  }`}
                >
                  <p className="flex items-center gap-1.5 font-medium">
                    <span>{resetMessage.type === "success" ? "✅" : "⚠️"}</span>
                    <span>{resetMessage.text}</span>
                  </p>
                </div>
              )}

              <button
                disabled={isResetting}
                onClick={handleResetSeats}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Seats...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Reset Seats</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer controls: Lock Admin and Close */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={handleLockAdmin}
                className="text-xs text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <span>🔒</span>
                <span>Lock / Exit Admin</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

