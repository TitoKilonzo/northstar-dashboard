"use client";

import { useState } from "react";

const ORDER_STAGES = ["Processing", "Shipped", "In Transit", "Delivered"];
const REASON_OPTIONS = [
  "Changed my mind",
  "Wrong item received",
  "Item arrived damaged",
  "Item doesn't fit",
  "No longer needed",
  "Other",
];
const CONDITION_OPTIONS = [
  "New, unused, original packaging",
  "Opened but unused",
  "Used",
  "Damaged",
];

function fmt(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusTrack({ status }) {
  const current = ORDER_STAGES.indexOf(status);
  return (
    <div className="mt-6 flex items-center">
      {ORDER_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={[
                "h-3.5 w-3.5 rounded-full border-2 shrink-0",
                i < current ? "bg-blue-600 border-blue-600" : "",
                i === current ? "bg-yellow-400 border-yellow-500 ring-4 ring-yellow-100" : "",
                i > current ? "bg-white border-line" : "",
              ].join(" ")}
            />
            <span
              className={[
                "font-mono text-[10px] uppercase tracking-wider text-center leading-tight w-16",
                i === current ? "text-ink font-semibold" : "text-ink/40",
              ].join(" ")}
            >
              {stage}
            </span>
          </div>
          {i < ORDER_STAGES.length - 1 && (
            <div className={["h-[2px] flex-1 -mt-5", i < current ? "bg-blue-600" : "bg-line"].join(" ")} />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderStatusCard() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setOrder(data);
    } catch {
      setError("Couldn't reach the order lookup right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-wider text-blue-600 mb-1">Step 1</p>
      <h2 className="font-display text-2xl font-semibold text-ink">Order status</h2>
      <p className="text-ink/60 mt-1 text-sm">Enter your order number to see where it's at.</p>

      <form onSubmit={onSubmit} className="mt-5 flex gap-2">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="NS-90001"
          className="flex-1 border border-line rounded-md px-3 py-2 font-mono text-sm bg-paper focus:bg-white outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={loading || !orderId.trim()}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "Checking…" : "Check status"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600 border-l-2 border-red-600 pl-3">{error}</p>}

      {order && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-sm">{order.order_id}</p>
            <p className="text-sm text-ink/60">{order.customer_name}</p>
          </div>
          <StatusTrack status={order.status} />
          <div className="mt-6 flex gap-6 text-xs text-ink/40 font-mono">
            <span>PLACED {fmt(order.placed_at)}</span>
            {order.delivered_at && <span>DELIVERED {fmt(order.delivered_at)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ReturnCard() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null); // once found, holds { order_id, status, items }

  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function findOrder(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    setVerdict(null);
    try {
      const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setOrder(data);
        setItemId(data.items[0]?.item_id ?? "");
      }
    } catch {
      setError("Couldn't reach the order lookup right now.");
    } finally {
      setLoading(false);
    }
  }

  async function submitReturn(e) {
    e.preventDefault();
    setSubmitting(true);
    setVerdict(null);
    try {
      const res = await fetch("/api/return-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.order_id, item_id: itemId, reason, condition }),
      });
      const data = await res.json();
      setVerdict(data);
    } catch {
      setVerdict({ eligible: false, reason: "Couldn't reach the eligibility check right now." });
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setOrder(null);
    setOrderId("");
    setVerdict(null);
    setReason("");
    setCondition("");
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-wider text-blue-600 mb-1">
        {order ? "Step 2" : "Step 1"}
      </p>
      <h2 className="font-display text-2xl font-semibold text-ink">Return / refund</h2>
      <p className="text-ink/60 mt-1 text-sm">
        {order ? "Tell us about the item you'd like to return." : "Start by finding your order."}
      </p>

      {!order && (
        <form onSubmit={findOrder} className="mt-5 flex gap-2">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="NS-90005"
            className="flex-1 border border-line rounded-md px-3 py-2 font-mono text-sm bg-paper focus:bg-white outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Looking…" : "Find order"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600 border-l-2 border-red-600 pl-3">{error}</p>}

      {order && !verdict && (
        <form onSubmit={submitReturn} className="mt-5 space-y-4">
          <p className="font-mono text-xs text-ink/50">
            {order.order_id} · status: {order.status}
          </p>

          <div>
            <label className="text-xs font-medium text-ink/70">Which item?</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm bg-paper focus:bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              {order.items.map((it) => (
                <option key={it.item_id} value={it.item_id}>
                  {it.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/70">Reason for return</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm bg-paper focus:bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select a reason…</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/70">Item condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm bg-paper focus:bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select condition…</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || !reason || !condition}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {submitting ? "Checking…" : "Submit request"}
            </button>
            <button
              type="button"
              onClick={startOver}
              className="text-sm text-ink/50 hover:text-ink px-2"
            >
              Start over
            </button>
          </div>
        </form>
      )}

      {verdict && (
        <div className="mt-6 border-t border-line pt-6">
          <div
            className={[
              "inline-block border-2 rounded px-3 py-1 font-mono text-xs uppercase tracking-widest -rotate-2",
              verdict.eligible ? "border-blue-600 text-blue-600" : "border-red-600 text-red-600",
            ].join(" ")}
          >
            {verdict.eligible ? "Eligible" : "Not eligible"}
          </div>
          <p className="text-sm text-ink/80 mt-4 leading-relaxed">{verdict.reason}</p>
          <button onClick={startOver} className="text-sm text-blue-600 hover:underline mt-4">
            Check another order
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-wider text-ink/40 mb-3">
          Northstar Retail Co. · Self-serve
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight max-w-xl text-ink">
          Sort your order out in under a minute.
        </h1>
        <p className="text-ink/60 mt-4 max-w-lg">
          Check where your order is, or see if it qualifies for a return — no waiting on an agent.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-12">
          <OrderStatusCard />
          <ReturnCard />
        </div>

      </div>
    </main>
  );
}
