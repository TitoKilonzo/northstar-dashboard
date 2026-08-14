# Northstar Support Desk

Self-serve MVP for The Northstar Sprint. Lets a customer check an order's
status, or run a return/refund request through the eligibility rules,
without ever talking to a support agent.

## Running it

```bash
npm install
npm run seed   # populates local.db - 7 hand-picked QA cases + 45 random orders
npm run dev    # http://localhost:3000
```

Runs against a local SQLite file (`local.db`) via libSQL, zero setup needed.
To point it at a real Turso database later, add a `.env.local`:

```
TURSO_DATABASE_URL=libsql://your-db-url
TURSO_AUTH_TOKEN=your-token
```

## Flow 1 — Order status

`GET /api/order-status?order_id=NS-90001`

Customer enters an order number, gets back status + dates, or a clear
"couldn't find that order" message if it doesn't exist. Statuses:
Processing → Shipped → In Transit → Delivered.

## Flow 2 — Returns / refund eligibility

Two steps, matching how a real customer would do this:

1. `GET /api/order-status?order_id=...` — same endpoint as flow 1, also
   returns the order's items so the UI can show a picker.
2. `POST /api/return-eligibility` with `{ order_id, item_id, reason, condition }`
   — runs the actual rules and returns `eligible: true/false` + why.

Rules, checked in this order:
1. A return reason has to be provided.
2. Order must already be `Delivered` (can't return something still in transit).
3. Must be within the 30-day return window, counted from the delivered date.
4. Item can't be marked final sale.
5. Declared condition has to be "New, unused, original packaging" or
   "Opened but unused" — "Used" or "Damaged" don't qualify.

First rule that fails is what gets reported back, so the customer always
gets one clear reason, not a wall of errors.

## Built-in QA cases

| Order | What it tests |
|---|---|
| NS-90001 | Straightforward eligible case |
| NS-90002 | Delivered 45 days ago — outside the window |
| NS-90003 | Still "Shipped" — never delivered |
| NS-90004 | Final sale item |
| NS-90005 | Delivered today, has 2 items to choose from |
| NS-90006 | "In Transit" — not delivered yet |
| NS-90007 | Delivered 29 days ago AND final sale — window's fine but final sale fails it |

Also worth trying: leave the condition as "Used" or "Damaged" on any
otherwise-eligible order to see the condition rule kick in on its own.

## What this doesn't do (on purpose)

No real payments/refunds, no shipping-carrier integration, no real
accounts or auth, no real customer data, no production deploy, no AI or
chatbot layer. It's a rules-based MVP, not a real e-commerce backend.

## Project structure

```
app/
  api/order-status/route.ts        order lookup + item list
  api/return-eligibility/route.ts  runs the 5 return rules
  page.tsx                         both flows, one page
lib/db.ts                          schema + policy constants
scripts/seed.mjs                   mock orders + items, incl. QA cases
```
