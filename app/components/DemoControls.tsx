"use client";

import React, { useState } from "react";

interface DemoControlsProps {
  currentUserId: string;
  onSwitchUser: (newUserId: string) => void;
  onHoldExpiredTriggered?: () => void;
}

export function DemoControls({
  currentUserId,
  onSwitchUser,
  onHoldExpiredTriggered,
}: DemoControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [expireResult, setExpireResult] = useState<string | null>(null);

  const handleTriggerExpireHolds = async () => {
    setIsExpiring(true);
    setExpireResult(null);

    try {
      const res = await fetch("/api/holds/expire", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setExpireResult(`Expired ${data.expiredCount ?? 0} overdue seat holds.`);
        onHoldExpiredTriggered?.();
      } else {
        setExpireResult(data.error || "Failed to trigger hold expiration.");
      }
    } catch {
      setExpireResult("Network error calling expire endpoint.");
    } finally {
      setIsExpiring(false);
    }
  };

  return (
    <aside className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 sm:w-96 rounded-2xl border border-indigo-500/40 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                ⚡ Interviewer Quick Controls
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Quick User Switcher */}
            <div>
              <p className="text-zinc-400 font-semibold mb-1.5">
                Multi-User Conflict Tester:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSwitchUser("user-demo-001")}
                  className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                    currentUserId === "user-demo-001"
                      ? "border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  👤 User 001
                </button>
                <button
                  onClick={() => onSwitchUser("user-demo-002")}
                  className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                    currentUserId === "user-demo-002"
                      ? "border-indigo-500 bg-indigo-950/80 text-indigo-300 font-bold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  👤 User 002
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Switch user to test 409 Conflict when attempting to hold the same seat.
              </p>
            </div>

            {/* Hold Expiration Trigger */}
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-zinc-400 font-semibold mb-1.5">
                Trigger Hold Expiration Cleanup:
              </p>
              <button
                disabled={isExpiring}
                onClick={handleTriggerExpireHolds}
                className="w-full py-2 px-3 rounded-lg border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 font-semibold transition-all text-xs flex items-center justify-center gap-1.5"
              >
                <span>⏱️</span>
                <span>{isExpiring ? "Expiring holds..." : "Call POST /api/holds/expire"}</span>
              </button>
              {expireResult && (
                <p className="text-[11px] text-amber-400 mt-1.5 bg-amber-950/50 p-2 rounded border border-amber-800/40">
                  {expireResult}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-indigo-500/40 bg-zinc-950/90 px-4 py-2.5 text-xs font-bold text-indigo-300 shadow-xl backdrop-blur-md hover:border-indigo-400 hover:bg-indigo-950 hover:text-white transition-all group"
        >
          <span className="h-2 w-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
          <span>⚡ Demo Quick Menu</span>
        </button>
      )}
    </aside>
  );
}
