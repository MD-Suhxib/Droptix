"use client";

import React, { useEffect, useState, useCallback } from "react";
import { QueueStatusResponse } from "@/app/types";

interface QueueStatusProps {
  eventId: number;
  userId: string;
  onProceedToSeats: () => void;
  onBackToEvent: () => void;
}

export function QueueStatus({
  eventId,
  userId,
  onProceedToSeats,
  onBackToEvent,
}: QueueStatusProps) {
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>("WAITING");
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/queue/status?eventId=${eventId}&userId=${encodeURIComponent(userId)}`
      );
      const data: QueueStatusResponse = await res.json();

      setLastChecked(new Date().toLocaleTimeString());

      if (!res.ok || !data.success) {
        // 404 or status not WAITING means user is ready or out of waiting queue
        if (res.status === 404 || data.error?.includes("not currently in the queue")) {
          setIsPolling(false);
          onProceedToSeats();
          return;
        }
        setErrorMsg(data.error || "Failed to fetch queue status");
        return;
      }

      if (data.queue) {
        setQueuePos(data.queue.queue_position);
        setStatusText(data.queue.status);

        if (data.queue.status !== "WAITING") {
          setIsPolling(false);
          onProceedToSeats();
        }
      }
    } catch {
      setErrorMsg("Network error checking queue position.");
    }
  }, [eventId, userId, onProceedToSeats]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (isPolling) {
        checkStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [checkStatus, isPolling]);

  const peopleAhead = queuePos && queuePos > 1 ? queuePos - 1 : 0;

  return (
    <div className="w-full max-w-xl mx-auto my-8">
      {/* Container Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Live Waiting Room
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            <span>Demo Mode</span>
          </span>
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              You&apos;re in line
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              DropTix Launch Concert • High Demand Queue
            </p>
          </div>

          {/* Queue Position Display */}
          <div className="my-6 py-6 rounded-xl bg-zinc-950/80 border border-zinc-800/90 relative group">
            <div className="text-xs font-mono uppercase text-zinc-400 mb-1">
              Your Queue Number
            </div>
            <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-white font-mono tracking-tight my-2">
              #{queuePos !== null ? queuePos : "--"}
            </div>

            <div className="flex items-center justify-center gap-3 mt-3 text-xs text-zinc-400">
              <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                👥 <strong className="text-white font-semibold">{peopleAhead}</strong> people ahead of you
              </span>
              <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                Status: <strong className="text-indigo-400 font-medium">{statusText}</strong>
              </span>
            </div>
          </div>

          {/* Animated Loader / Pulse Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Checking queue position...</span>
              <span className="font-mono text-[11px] text-zinc-500">Updated: {lastChecked || "just now"}</span>
            </div>
            <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-gradient-to-r from-indigo-600 via-cyan-400 to-indigo-600 w-full animate-pulse" />
            </div>
          </div>

          {/* Reservation Info Note */}
          <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/20 p-4 text-left flex gap-3 items-start">
            <span className="text-lg">🛡️</span>
            <div className="text-xs text-indigo-200/90 leading-relaxed">
              <strong className="text-indigo-300 block font-semibold mb-0.5">Your position is reserved.</strong>
              We&apos;ll automatically transition you when it&apos;s your turn to select seats. Please keep this browser window open.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Interactive Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onProceedToSeats}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Enter Seat Selection (Demo Action) →
            </button>
            <button
              onClick={onBackToEvent}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs hover:text-white hover:border-zinc-700 transition-all"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
