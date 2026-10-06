# DropTix

A simple flash-sale ticket booking backend built for a take-home assignment.

The main goal is to safely handle many users trying to book the same seats at the same time, while also supporting temporary seat holds, payments, a queue, cancellations, waitlist promotion, and basic abuse protection.

The architecture is intentionally simple. PostgreSQL is the main source of truth for seat ownership and concurrency.

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase PostgreSQL
- Fake payment provider
- k6 for load testing

## Features

### 1. Seat Holds
A user can temporarily hold a seat for 5 minutes.

```text
User
  |
  | POST /api/seats/hold
  v
PostgreSQL
  |
  | lock seat + check availability
  v
Seat = HELD
  |
  | 5 minutes
  v
Hold expires
  |
  v
Seat = AVAILABLE
```

A seat that is already held cannot be held by another user.

### 2. Concurrency Protection
The most important part of the system is preventing two users from buying the same seat.

PostgreSQL row-level locking is used when the seat is checked and changed.

```text
User A ----            >---- PostgreSQL row lock ----> one user gets the seat
User B ----/                                  other gets 409 Conflict
```

The database also protects the final state with constraints:
- Only one active hold can exist for a seat.
- Only one confirmed ticket can exist for a seat.
- A user can only have one confirmed ticket for an event.

The database is therefore the final source of truth for seat ownership.

### 3. Hold Expiration
Every hold has an `expires_at` timestamp.

When a hold expires:
- `ACTIVE` -> `EXPIRED`
- `HELD` -> `AVAILABLE`

The project exposes:
`POST /api/holds/expire`
which runs the PostgreSQL `expire_holds()` function.

For this take-home, expiration is triggered through the endpoint rather than a production scheduler. A production system would use a scheduled job or background worker.

### 4. Payments
A fake payment provider is used instead of Stripe.

It supports:
- Delayed payments
- Successful payments
- Failed payments
- Duplicate callbacks

Flow:

```text
User
  |
  | Create payment
  v
Fake Payment Provider
  |
  v
Webhook
  |
  v
confirm_payment()
  |
  +--> Ticket created
  +--> Payment marked PAID
  +--> Hold marked CONVERTED
  +--> Seat marked SOLD
```

This keeps the implementation simple while still demonstrating important payment behavior.

### 5. Duplicate Payment Callbacks
Payment providers can send the same webhook more than once.
`provider_payment_id` is unique in the database.

```text
Webhook #1
    |
    v
Payment + ticket created

Webhook #2
same provider payment ID
    |
    v
Existing payment/ticket returned
```

The payment confirmation function is idempotent for an already-processed provider payment, preventing duplicate tickets.

### 6. Queue / Waiting Room
Users can join a FIFO queue:
`POST /api/queue/join`

They can check their position:
`GET /api/queue/status`

Example:
- User A -> position 1
- User B -> position 2
- User C -> position 3

The event row is locked while a new queue position is assigned, keeping position assignment consistent under concurrent joins.

This is intentionally a basic FIFO waiting room rather than a large-scale queue service.

### 7. Cancellation + Waitlist
When a confirmed ticket is cancelled, the system checks the waitlist.

```text
Ticket
  |
  v
CANCELLED
  |
  v
Find first WAITING user
  |
  v
Create 5-minute hold
  |
  v
WAITING -> OFFERED
```

If nobody is waiting, the seat becomes available again.

### 8. Anti-Abuse Protection
**Ticket-per-user limit**
A user can only have one confirmed ticket for an event.
This is enforced with a PostgreSQL trigger.

**Rate limiting**
The seat-hold API has a simple in-memory rate limiter.

Current limit:
10 requests per user per minute

Exceeding the limit returns:
`429 Too Many Requests`

The current limiter is suitable for a single application instance. For multiple instances, I would use Redis or another shared store.

## Database Design

The main tables are:
- `events`
- `seats`
- `holds`
- `tickets`
- `payments`
- `waitlist`

### events
Stores event information such as name and sale start time.

### seats
Stores individual seats and their state:
- `AVAILABLE`
- `HELD`
- `SOLD`

### holds
Stores temporary reservations:
- `seat_id`
- `user_id`
- `expires_at`
- `status`

Hold states:
- `ACTIVE`
- `EXPIRED`
- `CONVERTED`
- `CANCELLED`

### tickets
Stores confirmed and cancelled tickets.

Ticket states:
- `CONFIRMED`
- `CANCELLED`

A partial unique index allows only one confirmed ticket per seat while still allowing a cancelled seat to be sold again.

### payments
Stores payment records.

Payment states:
- `PENDING`
- `PAID`
- `FAILED`

`provider_payment_id` is unique so duplicate callbacks can be handled safely.

### waitlist
Stores users waiting for an event.

Waitlist states:
- `WAITING`
- `OFFERED`
- `COMPLETED`
- `CANCELLED`

## Why PostgreSQL Handles the Concurrency

The critical operation is:

```text
Check seat
   |
Lock seat row
   |
Check current status
   |
Create hold
   |
Commit transaction
```

Because the seat row is locked during the operation, concurrent requests cannot both successfully modify the same seat.

This avoids adding Redis or a separate locking service for a problem PostgreSQL can already solve.

Database constraints provide another safety layer in case another code path attempts to create invalid state.

## API Endpoints

### Seat Hold
`POST /api/seats/hold`

Example:
```json
{
  "seatId": 1,
  "userId": "user-001"
}
```

If successful, the response contains the hold ID and expiration time.
If another user already holds the seat: `409 Conflict`

### Hold Expiration
`POST /api/holds/expire`

Expires active holds whose `expires_at` has passed.

### Create Payment
`POST /api/payments/create`

Example:
```json
{
  "holdId": 1,
  "amount": 1000
}
```

### Payment Webhook
`POST /api/payments/webhook`

Processes the fake payment callback.

### Join Queue
`POST /api/queue/join`

Example:
```json
{
  "eventId": 1,
  "userId": "user-001"
}
```

### Queue Status
`GET /api/queue/status?eventId=1&userId=user-001`

### Cancel Ticket
`POST /api/tickets/cancel`

Example:
```json
{
  "ticketId": 1
}
```

If someone is waiting, the next waitlisted user receives the cancelled seat.

## Project Structure

```text
droptix/
├── app/
│   └── api/
│       ├── holds/
│       │   └── expire/
│       │       └── route.ts
│       ├── payments/
│       │   ├── create/
│       │   │   └── route.ts
│       │   └── webhook/
│       │       └── route.ts
│       ├── queue/
│       │   ├── join/
│       │   │   └── route.ts
│       │   └── status/
│       │       └── route.ts
│       ├── seats/
│       │   └── hold/
│       │       └── route.ts
│       └── tickets/
│           └── cancel/
│               └── route.ts
├── lib/
│   ├── fake-payment.ts
│   ├── rate-limit.ts
│   └── supabase.ts
├── load-tests/
│   └── hold.js
├── .env.local
├── package.json
└── README.md
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase
Create a Supabase project and add the required values to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```
The secret key is used only by the server-side backend. It must not be exposed to the browser or committed to Git.

### 3. Set Up the Database
Run the SQL setup scripts in the Supabase SQL Editor.
They create:
- Events
- Seats
- Holds
- Tickets
- Payments
- Waitlist
- Concurrency functions
- Payment confirmation function
- Hold expiration function
- Queue function
- Cancellation function
- Ticket-limit trigger

A test event and seats can then be inserted for local testing.

### 4. Start the Application
```bash
npm run dev
```

The API runs at: `http://localhost:3000`

## Testing

The system was manually tested for:
- Successful seat holds
- Two users trying the same seat
- Hold expiration
- Successful payments
- Duplicate payment callbacks
- Queue joining
- Duplicate queue joins
- Queue status
- Ticket cancellation
- Waitlist promotion
- Ticket-per-user limit
- Rate limiting
- Concurrent load testing with k6

## Load Testing

I used k6 to test concurrent requests against the same seat.

**Test configuration:**
- Virtual users: 20
- Duration: 10 seconds
- Target: Same seat

**Final result:**
- Requests: 943
- Throughput: 91.19 requests/sec
- Average: 214 ms
- Median: 188 ms
- p95: 256 ms

All custom k6 checks passed:
- `checks_succeeded`: 100%
- `checks_failed`: 0%

The test intentionally sends many users to the same seat.
Only one request should successfully create the hold. Other concurrent requests receive `409 Conflict`.
This is expected behavior because the seat is already held.
The important result is that concurrent requests do not result in multiple successful holds for the same seat.

## Example End-to-End Flow

A normal purchase looks like:

```text
User
 |
 | Join queue
 v
Queue
 |
 | Seat becomes available
 v
Hold seat
 |
 | 5 minute hold
 v
Create payment
 |
 v
Fake payment provider
 |
 v
Payment webhook
 |
 v
confirm_payment()
 |
 +--> Payment = PAID
 +--> Ticket = CONFIRMED
 +--> Hold = CONVERTED
 +--> Seat = SOLD
```

If payment does not complete before the hold expires:
- `Hold = EXPIRED`
- `Seat = AVAILABLE`

If a confirmed ticket is cancelled:

```text
Ticket = CANCELLED
        |
        v
Find next waitlisted user
        |
        v
Create 5-minute seat hold
        |
        v
Waitlist = OFFERED
```

## Design Decisions

### Why keep the architecture simple?
The assignment is mainly about correctness under concurrency rather than building a large distributed system.
I therefore avoided:
- Redis
- Kafka
- Microservices
- Separate payment services
- Complex queue infrastructure

PostgreSQL already provides the transactional guarantees needed for the core seat-booking problem.

### Why use database functions?
Important multi-step operations such as:
- Hold seat
- Confirm payment
- Expire holds
- Cancel ticket
- Join queue

are implemented as PostgreSQL functions.
This keeps related state changes inside one database transaction.
For example, payment confirmation needs to update the ticket, payment, seat, and hold consistently.

### Why use database constraints?
Application-level checks can race under concurrency.
Database constraints provide a final safety layer.
For example, "One confirmed ticket per seat" is enforced by PostgreSQL, not just by TypeScript code.

## What Could Break at 10x Load?

The current implementation is designed for a small take-home assignment, not massive production traffic.

1. **Database contention**
   If thousands of users try to buy a small number of popular seats, many transactions will compete for the same rows.
   The database remains correct, but lock contention would increase.

2. **Rate limiter**
   The current limiter is in memory.
   With multiple application instances:
   - Server A -> own rate-limit map
   - Server B -> different rate-limit map
   - Server C -> different rate-limit map
   A shared store such as Redis would be needed.

3. **Queue**
   The basic PostgreSQL FIFO queue is fine for this assignment but would need a more scalable waiting-room design for very large traffic.

4. **Hold expiration**
   Expiration should become a proper scheduled/background process.

5. **Application scaling**
   The application could be deployed across multiple instances behind a load balancer while PostgreSQL remains the source of truth for seat ownership.

## What I Would Improve With More Time

If this were moving toward production, I would add:
- Real authentication instead of trusting `userId` from the request
- Redis-based distributed rate limiting
- A proper background worker/scheduler for hold expiration
- A stronger waiting-room/admission system
- Signed payment webhook verification
- Better handling when a waitlist offer expires
- Structured logging and monitoring
- More extensive integration tests
- More load-test scenarios
- Stripe test mode instead of the fake provider
- Horizontal scaling and load balancing

I would add these based on actual scale and bottlenecks rather than introducing them prematurely.

## Known Tradeoffs / Limitations

This implementation intentionally has a few simplified areas:
1. Hold expiration is triggered through an API endpoint rather than a production scheduler.
2. Rate limiting is in-memory and therefore single-instance.
3. Authentication is simplified; `userId` is supplied by the caller.
4. The queue is a basic FIFO implementation rather than a large-scale waiting-room service.
5. The fake payment provider is used instead of a real payment processor.
6. The system is designed for a small deployment rather than a highly distributed environment.

These are intentional tradeoffs to keep the take-home focused and understandable.

## 2–5 Minute Project Explanation

A short explanation for a reviewer/team lead:

> "DropTix is a basic flash-sale ticket backend built with Next.js, TypeScript, and Supabase PostgreSQL.
>
> The main problem I focused on was concurrency. Multiple users can try to buy the same seat at exactly the same time, so PostgreSQL is the source of truth and I use row-level locking when creating a seat hold.
>
> A seat is held for five minutes. If the hold expires, the seat becomes available again.
>
> After a successful payment, the system creates a ticket, records the payment, converts the hold, and marks the seat as sold. These related changes happen inside a database transaction.
>
> I used a fake payment provider so I could simulate slow payments, failures, and duplicate webhooks. Duplicate callbacks are handled using the provider payment ID and an idempotent confirmation function.
>
> I also implemented a basic FIFO queue. Users get a position when they join and can check their position through the API.
>
> For cancellations, the system checks the waitlist and offers the cancelled seat to the next waiting user.
>
> For abuse protection, there is a one-ticket-per-user-per-event rule and a simple rate limiter.
>
> I load-tested the seat endpoint with 20 concurrent users for 10 seconds. It handled about 91 requests per second, with a median latency of about 188 milliseconds and p95 around 256 milliseconds. The concurrent requests correctly resulted in one successful seat hold and 409 conflicts for the other users.
>
> I intentionally kept the architecture simple. If this needed to handle much higher traffic, I would introduce Redis for distributed rate limiting, a proper background worker for hold expiration, a stronger waiting-room architecture, authentication, and production-level monitoring."

## Final Summary

The core design is:

```text
                    PostgreSQL
                        |
        +---------------+---------------+
        |               |               |
      Seats           Holds          Tickets
        |               |               |
        +---------------+---------------+
                        |
                    Payments
                        |
                    Waitlist
```

The most important principle is:
**The database is responsible for maintaining seat consistency under concurrency.**

The rest of the application is built around that core idea while keeping the architecture simple enough for a take-home project.
