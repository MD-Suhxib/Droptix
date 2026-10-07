"use client";

import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { HowItWorks } from "./components/HowItWorks";
import { SystemArchitecture } from "./components/SystemArchitecture";
import { QueueStatus } from "./components/QueueStatus";
import { SeatMap } from "./components/SeatMap";
import { CheckoutCard } from "./components/CheckoutCard";
import { TicketCard } from "./components/TicketCard";
import { DemoControls } from "./components/DemoControls";

import {
  Step,
  BookingState,
  JoinQueueResponse,
  PaymentCreateResponse,
} from "./types";
import {
  getOrCreateUserId,
  setCustomUserId,
  getStoredBookingState,
  saveBookingState,
  clearBookingState,
} from "./lib/storage";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>("user-demo-001");
  const [step, setStep] = useState<Step>("landing");
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Booking State
  const [booking, setBooking] = useState<BookingState>({
    userId: "user-demo-001",
    eventId: 1,
  });

  // Hydration setup
  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    const saved = getStoredBookingState();
    if (saved) {
      setBooking((prev) => ({ ...prev, ...saved, userId: id }));
    } else {
      setBooking((prev) => ({ ...prev, userId: id }));
    }
    setMounted(true);
  }, []);

  const handleUpdateUserId = (newId: string) => {
    const updated = setCustomUserId(newId);
    setUserId(updated);
    setBooking((prev) => {
      const next = { ...prev, userId: updated };
      saveBookingState(next);
      return next;
    });
  };

  const handleResetDemo = () => {
    clearBookingState();
    const newId = setCustomUserId("");
    setUserId(newId);
    setBooking({
      userId: newId,
      eventId: 1,
    });
    setStep("landing");
    setQueueError(null);
  };

  // Step 1 -> Step 2: Join Waiting Room
  const handleJoinQueue = async () => {
    setIsJoiningQueue(true);
    setQueueError(null);

    try {
      const res = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: 1,
          userId: userId,
        }),
      });

      const data: JoinQueueResponse = await res.json();

      if (!res.ok || !data.success) {
        setQueueError(data.error || "Failed to join queue.");
        setIsJoiningQueue(false);
        return;
      }

      // Update state & navigate
      const newPos = data.queue?.position;
      setBooking((prev) => {
        const next = { ...prev, queuePosition: newPos };
        saveBookingState(next);
        return next;
      });

      setStep("queue");
    } catch {
      setQueueError("Network error joining queue.");
    } finally {
      setIsJoiningQueue(false);
    }
  };

  // Step 3 Success -> Step 4
  const handleHoldSuccess = (
    holdId: number,
    seatId: number,
    seatNumber: string,
    expiresAt: string
  ) => {
    const validExpiresAt =
      expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();

    setBooking((prev) => {
      const next = {
        ...prev,
        holdId,
        selectedSeatId: seatId,
        selectedSeatNumber: seatNumber,
        expiresAt: validExpiresAt,
      };
      saveBookingState(next);
      return next;
    });
    setStep("checkout");
  };

  // Step 4 Success -> Step 5
  const handlePaymentSuccess = (paymentResp: PaymentCreateResponse) => {
    const tId = paymentResp.webhook?.payment?.ticket_id || 101;
    const pId = paymentResp.providerPaymentId || "PAY_DEMO_100";

    setBooking((prev) => {
      const next = {
        ...prev,
        ticketId: tId,
        providerPaymentId: pId,
      };
      saveBookingState(next);
      return next;
    });
    setStep("confirmation");
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading DropTix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        userId={userId}
        onUpdateUserId={handleUpdateUserId}
        onNavigateTab={scrollToSection}
        onResetDemo={handleResetDemo}
        currentStep={step}
        onGoHome={() => setStep("landing")}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6">
        {/* Stepper Navigation */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[500px] max-w-2xl mx-auto px-4 py-2.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-xs">
            <button
              onClick={() => setStep("landing")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === "landing"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>1. Event</span>
            </button>
            <span className="text-zinc-700">→</span>
            <button
              onClick={() => setStep("queue")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === "queue"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>2. Queue</span>
            </button>
            <span className="text-zinc-700">→</span>
            <button
              onClick={() => setStep("seats")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === "seats"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>3. Seats</span>
            </button>
            <span className="text-zinc-700">→</span>
            <button
              onClick={() => setStep("checkout")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === "checkout"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>4. Checkout</span>
            </button>
            <span className="text-zinc-700">→</span>
            <button
              onClick={() => setStep("confirmation")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === "confirmation"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>5. Ticket</span>
            </button>
          </div>
        </div>

        {/* Dynamic View Switcher */}
        {step === "landing" && (
          <div id="event-details" className="space-y-12 my-4">
            {/* Event Hero Card */}
            <div className="relative rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-wide">
                      ● SALE LIVE NOW
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                      ⚡ Limited Tickets Available
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    DropTix Launch Concert
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-300 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 text-base">📅</span>
                      <span>Saturday, Oct 24, 2026 • 8:00 PM IST</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 text-base">📍</span>
                      <span>Grand Arena Stadium, Mumbai</span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    Experience the ultimate flash-sale ticket drop. Featuring real-time PostgreSQL concurrency locking, 5-minute atomic seat reservations, and fair waitlist queueing.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button
                      disabled={isJoiningQueue}
                      onClick={handleJoinQueue}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isJoiningQueue ? (
                        <>
                          <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Joining Queue...</span>
                        </>
                      ) : (
                        <>
                          <span>Join Waiting Room</span>
                          <span className="text-xl">→</span>
                        </>
                      )}
                    </button>

                    <div className="text-xs text-zinc-400 self-center">
                      Tickets at <strong className="text-white text-sm font-bold">₹10.00</strong> / seat
                    </div>
                  </div>

                  {queueError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                      {queueError}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center space-y-4">
                  <div className="rounded-2xl bg-zinc-950/80 p-5 border border-zinc-800/80 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      High Demand • Fair Queue
                    </h3>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>PostgreSQL Atomic Locking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>5-Minute Seat Hold Period</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>1 Ticket Per User Protection</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Automated Waitlist Promotion</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="text-sm font-bold text-white mb-1">High Demand</h3>
                <p className="text-xs text-zinc-400">Built to handle thousands of concurrent ticket requests safely.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-2xl mb-2">⚖️</div>
                <h3 className="text-sm font-bold text-white mb-1">Fair Queue</h3>
                <p className="text-xs text-zinc-400">FIFO waiting room ensures first-come, first-served position integrity.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="text-sm font-bold text-white mb-1">Secure Checkout</h3>
                <p className="text-xs text-zinc-400">Idempotent webhook handlers eliminate duplicate billing.</p>
              </div>
            </div>

            {/* How It Works & Architecture */}
            <HowItWorks />
            <SystemArchitecture />
          </div>
        )}

        {step === "queue" && (
          <QueueStatus
            eventId={1}
            userId={userId}
            onProceedToSeats={() => setStep("seats")}
            onBackToEvent={() => setStep("landing")}
          />
        )}

        {step === "seats" && (
          <SeatMap
            userId={userId}
            onHoldSuccess={handleHoldSuccess}
            onBackToQueue={() => setStep("queue")}
          />
        )}

        {step === "checkout" && (
          booking.holdId ? (
            <CheckoutCard
              holdId={booking.holdId}
              seatId={booking.selectedSeatId || 1}
              seatNumber={booking.selectedSeatNumber || "A-1"}
              expiresAt={booking.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString()}
              userId={userId}
              onPaymentSuccess={handlePaymentSuccess}
              onReturnToSeats={() => setStep("seats")}
            />
          ) : (
            <div className="w-full max-w-xl mx-auto my-12 text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl space-y-4">
              <div className="text-4xl">🎟️</div>
              <h3 className="text-xl font-bold text-white">No Active Seat Reservation</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                You need to select and hold an available seat before proceeding to checkout.
              </p>
              <button
                onClick={() => setStep("seats")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:brightness-110 text-white font-bold text-xs shadow-lg transition-all"
              >
                Choose a Seat Now →
              </button>
            </div>
          )
        )}

        {step === "confirmation" && (
          booking.ticketId ? (
            <TicketCard
              ticketId={booking.ticketId}
              seatNumber={booking.selectedSeatNumber || "A-1"}
              userId={userId}
              providerPaymentId={booking.providerPaymentId}
              onBookAnother={() => setStep("landing")}
            />
          ) : (
            <div className="w-full max-w-xl mx-auto my-12 text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-xl font-bold text-white">No Confirmed Ticket Yet</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Complete seat reservation and payment first to view your event ticket stub.
              </p>
              <button
                onClick={() => setStep(booking.holdId ? "checkout" : "seats")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:brightness-110 text-white font-bold text-xs shadow-lg transition-all"
              >
                {booking.holdId ? "Go to Checkout →" : "Choose a Seat →"}
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-zinc-300">DropTix System Demo</span> • Next.js App Router & Supabase PostgreSQL
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Concurrency: PostgreSQL Row-Locking</span>
            <span>•</span>
            <span>Rate Limiting: 10 req/min</span>
          </div>
        </div>
      </footer>

      {/* Developer Quick Controls Drawer */}
      <DemoControls
        currentUserId={userId}
        onSwitchUser={handleUpdateUserId}
      />
    </div>
  );
}
