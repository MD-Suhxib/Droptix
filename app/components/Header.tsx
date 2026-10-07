"use client";

import React, { useState } from "react";

interface HeaderProps {
  userId: string;
  onUpdateUserId?: (newId: string) => void;
  onNavigateTab?: (sectionId: string) => void;
  onResetDemo?: () => void;
  currentStep?: string;
  onGoHome?: () => void;
}

export function Header({
  userId,
  onUpdateUserId,
  onNavigateTab,
  onResetDemo,
  onGoHome,
}: HeaderProps) {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [tempUserId, setTempUserId] = useState(userId);

  const handleSaveUser = () => {
    if (onUpdateUserId && tempUserId.trim()) {
      onUpdateUserId(tempUserId.trim());
    }
    setIsEditingUser(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand Logo */}
        <button
          onClick={onGoHome}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 font-black text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                DropTix
              </span>
              <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                FLASH SALE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              High-Demand Ticketing Platform
            </p>
          </div>
        </button>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <button
            onClick={() => {
              onGoHome?.();
              onNavigateTab?.("event-details");
            }}
            className="hover:text-white transition-colors"
          >
            Event Details
          </button>
          <button
            onClick={() => {
              onGoHome?.();
              onNavigateTab?.("how-it-works");
            }}
            className="hover:text-white transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => {
              onGoHome?.();
              onNavigateTab?.("system-architecture");
            }}
            className="hover:text-white transition-colors"
          >
            Backend Features
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* User ID display / quick edit */}
          <div className="relative flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-zinc-500 hidden sm:inline">User:</span>
            {isEditingUser ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempUserId}
                  onChange={(e) => setTempUserId(e.target.value)}
                  className="w-28 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-white outline-none ring-1 ring-indigo-500"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveUser()}
                />
                <button
                  onClick={handleSaveUser}
                  className="text-emerald-400 hover:text-emerald-300 font-bold px-1"
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempUserId(userId);
                  setIsEditingUser(true);
                }}
                title="Click to change User ID for multi-user demo testing"
                className="font-mono text-zinc-200 hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <span>{userId}</span>
                <span className="text-[10px] text-zinc-500">✏️</span>
              </button>
            )}
          </div>

          {/* Demo Mode Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            Demo Mode
          </span>

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              title="Reset current demo session"
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-300 transition-all text-xs"
            >
              🔄
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
