"use client";

import React from "react";
import { Step, BookingState } from "@/app/types";

interface ProgressStepperProps {
  currentStep: Step;
  booking: BookingState;
  onNavigate: (step: Step) => void;
  warning: string | null;
  onClearWarning: () => void;
}

interface StepConfig {
  key: Step;
  index: number;
  label: string;
  shortLabel: string;
  icon: string;
  isUnlocked: (booking: BookingState, currentStep: Step) => boolean;
  lockReason: string;
}

const STEPS: StepConfig[] = [
  {
    key: "landing",
    index: 1,
    label: "Event Details",
    shortLabel: "1. Event",
    icon: "📅",
    isUnlocked: () => true,
    lockReason: "",
  },
  {
    key: "queue",
    index: 2,
    label: "Waiting Room",
    shortLabel: "2. Queue",
    icon: "⏳",
    isUnlocked: (booking, currentStep) =>
      Boolean(booking.queuePosition) || currentStep === "queue" || currentStep === "seats" || currentStep === "checkout" || currentStep === "confirmation",
    lockReason: "Please click 'Join Waiting Room' below to enter the line first.",
  },
  {
    key: "seats",
    index: 3,
    label: "Seat Selection",
    shortLabel: "3. Seats",
    icon: "💺",
    isUnlocked: (booking, currentStep) =>
      Boolean(booking.queuePosition || booking.selectedSeatId || booking.holdId) ||
      currentStep === "seats" ||
      currentStep === "checkout" ||
      currentStep === "confirmation",
    lockReason: "Please join the waiting room first to be admitted to seat selection.",
  },
  {
    key: "checkout",
    index: 4,
    label: "Checkout",
    shortLabel: "4. Checkout",
    icon: "💳",
    isUnlocked: (booking, currentStep) =>
      Boolean(booking.holdId) || currentStep === "checkout" || currentStep === "confirmation",
    lockReason: "Please select and hold an available seat first before going to checkout.",
  },
  {
    key: "confirmation",
    index: 5,
    label: "Ticket Stub",
    shortLabel: "5. Ticket",
    icon: "🎟️",
    isUnlocked: (booking, currentStep) =>
      Boolean(booking.ticketId) || currentStep === "confirmation",
    lockReason: "Please complete checkout and payment first to view your confirmed ticket.",
  },
];

export function ProgressStepper({
  currentStep,
  booking,
  onNavigate,
  warning,
  onClearWarning,
}: ProgressStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
  // Calculate progress percentage for visual bar: 0% at step 0, up to 100% at step 4
  const progressPercent = Math.max(8, (currentIndex / (STEPS.length - 1)) * 100);

  const handleStepClick = (stepConfig: StepConfig) => {
    onClearWarning();

    const unlocked = stepConfig.isUnlocked(booking, currentStep);

    if (!unlocked) {
      onNavigate(stepConfig.key); // will trigger page-level warning via onNavigate
      return;
    }

    onNavigate(stepConfig.key);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 px-2">
      {/* Stepper Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-md relative">
        {/* Progress Track Line */}
        <div className="relative mb-6 mx-4 sm:mx-8 hidden sm:block">
          {/* Background track */}
          <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
          {/* Active progress fill */}
          <div
            className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-indigo-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Nodes */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((s, idx) => {
            const isActive = s.key === currentStep;
            const isCompleted = idx < currentIndex;
            const isUnlocked = s.isUnlocked(booking, currentStep);

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleStepClick(s)}
                className={`group flex flex-col items-center text-center p-2 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? "bg-indigo-950/70 border border-indigo-500/50 shadow-md shadow-indigo-950/50"
                    : isCompleted
                    ? "hover:bg-zinc-800/60 border border-transparent"
                    : "opacity-60 hover:opacity-100 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-4 ring-indigo-500/25 shadow-lg scale-105"
                      : isCompleted
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50 font-black"
                      : isUnlocked
                      ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                  }`}
                >
                  {isCompleted ? (
                    <span className="text-emerald-400 font-black text-sm">✓</span>
                  ) : isActive ? (
                    <span className="animate-pulse">{s.index}</span>
                  ) : isUnlocked ? (
                    <span>{s.index}</span>
                  ) : (
                    <span className="text-[11px] opacity-75">🔒</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-[11px] sm:text-xs font-bold truncate max-w-[70px] sm:max-w-none ${
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "text-zinc-300"
                        : isUnlocked
                        ? "text-zinc-400"
                        : "text-zinc-500"
                    }`}
                  >
                    <span className="hidden sm:inline">{s.shortLabel}</span>
                    <span className="sm:hidden">{s.label.split(" ")[0]}</span>
                  </p>
                  <p className="text-[9px] text-zinc-500 hidden sm:block">
                    {isActive
                      ? "In Progress"
                      : isCompleted
                      ? "Completed"
                      : isUnlocked
                      ? "Available"
                      : "Locked"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning / Locked Step Toast Banner */}
      {warning && (
        <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-lg bg-amber-900/60 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">
              ⚠️
            </span>
            <span className="font-semibold leading-relaxed">{warning}</span>
          </div>
          <button
            type="button"
            onClick={onClearWarning}
            className="text-amber-400 hover:text-white font-bold text-xs px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-900/80 transition-colors shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
