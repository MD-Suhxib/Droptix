import React from "react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Join the queue",
      desc: "Enter our high-demand waiting room. Real-time FIFO tracking assigns your unique position.",
      icon: "👥",
    },
    {
      num: "02",
      title: "Choose your seat",
      desc: "Browse live seat availability (A-1 to A-10) with instant PostgreSQL row-locking protection.",
      icon: "🎟️",
    },
    {
      num: "03",
      title: "5-minute seat hold",
      desc: "Selected seat is locked exclusively for you. Other buyers receive 409 Conflict.",
      icon: "⏱️",
    },
    {
      num: "04",
      title: "Complete payment",
      desc: "Simulated secure payment workflow with idempotent webhook confirmation safeguards.",
      icon: "💳",
    },
    {
      num: "05",
      title: "Receive ticket",
      desc: "Confirmed ticket generated instantly with one-click cancellation and waitlist promotion.",
      icon: "🎉",
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-10 border-t border-zinc-800/60">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Seamless Booking Experience
          </span>
          <h2 className="mt-1 text-2xl font-bold text-white tracking-tight sm:text-3xl">
            How DropTix Works
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
            Designed to guarantee fairness, eliminate double-booking, and withstand high-concurrency flash sales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 hover:border-indigo-500/40 hover:bg-zinc-900 transition-all duration-300 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-indigo-400 font-mono">
                    {s.num}
                  </span>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">
                  {s.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
