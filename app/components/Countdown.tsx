"use client";

import React, { useEffect, useState } from "react";

interface CountdownProps {
  expiresAt?: string;
  onExpire?: () => void;
}

export function Countdown({ expiresAt, onExpire }: CountdownProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateRemaining = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeftMs(0);
        onExpire?.();
      } else {
        setTimeLeftMs(diff);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeftMs === null) {
    return <span className="font-mono text-zinc-400">05:00</span>;
  }

  if (timeLeftMs <= 0) {
    return (
      <span className="font-mono text-rose-500 font-bold animate-pulse">
        00:00 (Expired)
      </span>
    );
  }

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const percentLeft = Math.min(100, Math.max(0, (totalSeconds / (5 * 60)) * 100));

  const isLowTime = totalSeconds < 60;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isLowTime ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`} />
          Complete payment within:
        </span>
        <span
          className={`font-mono text-lg font-extrabold tracking-wider ${
            isLowTime ? "text-rose-400 animate-pulse" : "text-amber-400"
          }`}
        >
          {formattedMinutes}:{formattedSeconds}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isLowTime ? "bg-rose-500" : "bg-gradient-to-r from-amber-500 to-indigo-500"
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
    </div>
  );
}
