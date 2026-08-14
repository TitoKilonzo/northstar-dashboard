"use client";

import { useState } from "react";
import { Icons } from "./Icons";
import type { OrderWithItems, ReturnVerdict } from "@/types";

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

export function RequestReturnCard() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("");
  const [verdict, setVerdict] = useState<ReturnVerdict | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFindOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Order not found");
      } else {
        setOrder(data);
        setItemId(data.items[0]?.item_id ?? "");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/return-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_id,
          item_id: itemId,
          reason,
          condition,
        }),
      });
      const data: ReturnVerdict = await res.json();
      setVerdict(data);
    } catch {
      setVerdict({
        eligible: false,
        reason: "Network error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setOrder(null);
    setOrderId("");
    setVerdict(null);
    setReason("");
    setCondition("");
    setError(null);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
          <Icons.Return />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Request a Return</h2>
      </div>

      {!order ? (
        <form onSubmit={handleFindOrder} className="space-y-4">
          <div>
            <label htmlFor="return-order-id" className="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
            <input
              id="return-order-id"
              type="text"
              placeholder="NS-90005"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Searching..." : "Find Order"}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <div className="flex items-start gap-2">
                <Icons.AlertCircle />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </form>
      ) : !verdict ? (
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              <span className="font-semibold">{order.order_id}</span> • Status: {order.status}
            </p>
          </div>

          <div>
            <label htmlFor="return-item" className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
            <select
              id="return-item"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {order.items.map((item) => (
                <option key={item.item_id} value={item.item_id}>
                  {item.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 mb-2">Reason for Return</label>
            <select
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="return-condition" className="block text-sm font-medium text-gray-700 mb-2">Item Condition</label>
            <select
              id="return-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select condition...</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={submitting || !reason || !condition}
              className="col-span-1 bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Submitting..." : "Submit Return"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="col-span-1 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div
            className="p-4 rounded-lg border-2"
            role="alert"
            style={{
              borderColor: verdict.eligible ? "#10b981" : "#ef4444",
              backgroundColor: verdict.eligible ? "#ecfdf5" : "#fef2f2",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              {verdict.eligible ? <Icons.CheckCircle /> : <Icons.AlertCircle />}
              <span
                className="text-lg font-bold"
                style={{ color: verdict.eligible ? "#059669" : "#dc2626" }}
              >
                {verdict.eligible ? "Eligible for Return" : "Not Eligible"}
              </span>
            </div>
            <p className="text-sm text-gray-700">{verdict.reason}</p>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Request Another Return
          </button>
        </div>
      )}
    </div>
  );
}
