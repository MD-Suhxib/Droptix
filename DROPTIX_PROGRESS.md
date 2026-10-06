# DropTix --- Backend Progress Notes

## Overview

DropTix is a basic flash-sale ticketing system built as a take-home
backend project.

The current stack is intentionally simple:

-   **Next.js** --- backend/API layer
-   **Supabase PostgreSQL** --- database
-   **Supabase JS client** --- database connection
-   **No Redis / microservices yet** --- keeping the implementation
    basic as requested

------------------------------------------------------------------------

## 1. Project Setup

Created the Next.js project and confirmed that it runs successfully
with:

``` bash
npm run dev
```

The application is running locally on:

``` text
http://localhost:3000
```

Installed the Supabase JavaScript client:

``` bash
npm install @supabase/supabase-js
```

------------------------------------------------------------------------

## 2. Environment Variables

Created `.env.local` with the Supabase connection details:

``` env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

### Security decision

The Supabase secret key is server-only and is **not** prefixed with
`NEXT_PUBLIC_`.

The publishable key is safe for client-side use, while the secret key is
kept private for backend operations.

------------------------------------------------------------------------

## 3. Supabase Client

Created:

``` text
lib/supabase.ts
```

Current implementation:

``` ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
```

This gives the Next.js backend access to the Supabase database.

------------------------------------------------------------------------

## 4. Database Schema

Created the following tables in Supabase PostgreSQL:

``` text
events
seats
holds
tickets
payments
waitlist
```

### `events`

Stores the ticket sale/event information.

Important fields:

-   `id`
-   `name`
-   `sale_start_time`
-   `created_at`

### `seats`

Stores individual seats.

Important fields:

-   `id`
-   `event_id`
-   `seat_number`
-   `status`
-   `created_at`

Seat status is restricted to:

``` text
AVAILABLE
HELD
SOLD
```

A unique constraint prevents duplicate seat numbers within the same
event:

``` text
unique(event_id, seat_number)
```

### `holds`

Stores temporary seat reservations.

Important fields:

-   `id`
-   `seat_id`
-   `user_id`
-   `expires_at`
-   `status`
-   `created_at`

Hold status:

``` text
ACTIVE
EXPIRED
CONVERTED
CANCELLED
```

A partial unique index ensures that a seat cannot have two active holds:

``` sql
create unique index one_active_hold_per_seat
on holds(seat_id)
where status = 'ACTIVE';
```

### `tickets`

Stores successfully purchased tickets.

Important fields:

-   `id`
-   `seat_id`
-   `user_id`
-   `status`
-   `created_at`

A unique constraint on `seat_id` prevents the same seat from becoming
two tickets.

### `payments`

Stores payment information.

Important fields:

-   `id`
-   `ticket_id`
-   `provider_payment_id`
-   `amount`
-   `status`
-   `created_at`

Payment status:

``` text
PENDING
PAID
FAILED
```

### `waitlist`

Stores users waiting for a seat.

Important fields:

-   `id`
-   `event_id`
-   `user_id`
-   `position`
-   `status`
-   `created_at`

Waitlist status:

``` text
WAITING
OFFERED
COMPLETED
CANCELLED
```

------------------------------------------------------------------------

## 5. Test Data

Created a test event:

``` text
DropTix Launch Concert
```

Created 10 seats:

``` text
A-1
A-2
A-3
A-4
A-5
A-6
A-7
A-8
A-9
A-10
```

All seats initially had:

``` text
AVAILABLE
```

------------------------------------------------------------------------

## 6. Atomic Seat-Hold Function

Created the PostgreSQL function:

``` text
hold_seat(p_seat_id, p_user_id)
```

The function:

1.  Finds the requested seat.
2.  Locks the seat using PostgreSQL `FOR UPDATE`.
3.  Checks whether the sale has started.
4.  Rejects already-sold seats.
5.  Checks for an existing active hold.
6.  Expires an old hold if its expiration time has passed.
7.  Creates a new hold.
8.  Marks the seat as `HELD`.
9.  Sets the hold expiration to 5 minutes.

The key concurrency protection is:

``` sql
for update;
```

### Why this matters

We deliberately do **not** implement the critical operation as:

``` text
check seat
↓
if available
↓
update seat
```

because two requests could both see the seat as available.

Instead, PostgreSQL locks the seat while the operation is performed.

Conceptually:

``` text
User A ──┐
         ├──► PostgreSQL row lock ──► A-1 held by User A
User B ──┘
                 ↓
             User B waits
                 ↓
          User B sees active hold
                 ↓
             request rejected
```

This means the database is the source of truth for seat concurrency.

------------------------------------------------------------------------

## 7. Seat-Hold Test

Tested:

``` sql
select *
from hold_seat(1, 'user-001');
```

Result:

``` text
hold_id: 1
seat_id: 1
expires_at: approximately 5 minutes in the future
```

This successfully held seat `A-1` for `user-001`.

------------------------------------------------------------------------

## 8. Duplicate Hold Test

Immediately attempted:

``` sql
select *
from hold_seat(1, 'user-002');
```

The database returned:

``` text
ERROR: Seat is currently held
```

This is the expected result.

It demonstrates:

``` text
user-001 → A-1 → SUCCESS

user-002 → A-1 → REJECTED
```

Therefore, the core rule is already working:

> The same seat cannot be simultaneously held by two users.

------------------------------------------------------------------------

## 9. SQL Editor Query Organization

The Supabase SQL Editor queries were named for easier review:

``` text
01-schema-structure
02_seed_test_event
03_check_seed_data
04_hold_seat_function
05_test_hold_seat
06_test_double_hold
```

These names make it easier to explain the development process during the
team-lead review.

The important database SQL should eventually also be stored in the Git
repository rather than relying only on the Supabase SQL Editor.

------------------------------------------------------------------------

## 10. RLS Decision

For the current basic backend implementation, Row Level Security
policies were not added.

The application is using the Supabase secret key from the server-side
Next.js backend.

This keeps the take-home implementation simple.

If direct browser-to-Supabase access is introduced later, appropriate
RLS policies should be added.

------------------------------------------------------------------------

## 11. Current Architecture

At this point:

``` text
Next.js
   │
   │ Supabase JS client
   ▼
Supabase PostgreSQL
   │
   ├── events
   ├── seats
   ├── holds
   ├── tickets
   ├── payments
   └── waitlist
```

The seat-hold flow currently works directly at the database level:

``` text
User
  │
  ▼
hold_seat()
  │
  ▼
PostgreSQL row lock
  │
  ├── seat available → create 5-minute hold
  │
  └── seat already held → reject
```

------------------------------------------------------------------------

## 12. Next Steps

The next implementation step is to expose the database functionality
through a Next.js API:

``` text
POST /api/seats/hold
```

Expected flow:

``` text
Client
  │
  ▼
POST /api/seats/hold
  │
  ▼
Next.js Route Handler
  │
  ▼
Supabase RPC: hold_seat()
  │
  ▼
PostgreSQL
  │
  ├── success → return hold details
  │
  └── failure → return appropriate error
```

After that, the remaining core features will be implemented in roughly
this order:

1.  Seat hold API
2.  Hold expiration/release
3.  Fake payment provider
4.  Payment webhook/idempotency
5.  Ticket confirmation
6.  Cancellation
7.  Waitlist
8.  Basic queue/waiting room
9.  Rate limiting / ticket-per-person limit
10. Concurrency tests
11. k6 load test
12. README with design decisions and 10x-load discussion

------------------------------------------------------------------------

## Design Principle

The project is intentionally starting with the simplest architecture
that correctly solves the hard requirement:

> **PostgreSQL is the source of truth for seat ownership and
> concurrency.**

Redis, microservices, distributed locks, and other infrastructure can be
considered later if the load-testing results demonstrate that they are
actually needed.
