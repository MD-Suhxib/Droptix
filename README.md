# DropTix

A basic flash-sale ticket booking backend built for a take-home assignment.

The main focus of the project is handling concurrent seat bookings safely while also supporting payments, queues, cancellations, waitlists, and basic abuse protection.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Supabase PostgreSQL
- Fake payment provider
- k6 for load testing

I intentionally kept the architecture simple because this is a small take-home project.

---

# Main Features

### 1. Seat Holds

Users can temporarily hold a seat for 5 minutes.

Flow:

```text
User
  ↓
POST /api/seats/hold
  ↓
PostgreSQL transaction + row lock
  ↓
Seat becomes HELD
  ↓
Hold expires after 5 minutes
