import React from "react";

export function SystemArchitecture() {
  const behaviors = [
    {
      title: "PostgreSQL Seat Locking",
      code: "FOR UPDATE",
      status: "Active in DB",
      desc: "Uses database-level row locking inside `hold_seat()` to prevent concurrent seat claims.",
    },
    {
      title: "5-Minute Seat Holds",
      code: "expires_at + 5 min",
      status: "Enforced",
      desc: "Holds automatically expire if unpurchased. `POST /api/holds/expire` triggers cleanup.",
    },
    {
      title: "Idempotent Webhooks",
      code: "provider_payment_id",
      status: "Protected",
      desc: "Duplicate payment webhooks safely return existing tickets without double-charging.",
    },
    {
      title: "FIFO Waiting Queue",
      code: "waitlist.position",
      status: "Active",
      desc: "Concurrent users join a strictly ordered waiting room handled with row-level transaction safety.",
    },
    {
      title: "Waitlist Promotion",
      code: "cancel_ticket()",
      status: "Automated",
      desc: "When a ticket is cancelled, the system immediately reserves the freed seat for the next waiting user.",
    },
    {
      title: "Rate Limiting",
      code: "10 req / min / user",
      status: "Active",
      desc: "Prevents seat-hold spam with an in-memory rate limiter, returning 429 Too Many Requests.",
    },
  ];

  return (
    <section id="system-architecture" className="w-full py-8 border-t border-zinc-800/60">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
              <span>🛠️</span> Interviewer System Overview
            </div>
            <h2 className="text-xl font-bold text-white">
              Backend Architecture & Guarantees
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-md">
            All features below are powered by real PostgreSQL RPC functions and Next.js API handlers without mock data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {behaviors.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    ✓
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {item.title}
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                  {item.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal pl-7">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
