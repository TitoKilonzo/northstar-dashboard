"use client";

import { useState } from "react";
import { Icons } from "./Icons";
import { StatusTimeline } from "./StatusTimeline";
import { formatDate } from "../lib/utils";
import type { OrderWithItems } from "@/types";

export function TrackOrderCard() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderWithItems | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch order");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <Icons.Package />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Track Your Order</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="track-order-id" className="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
          <input
            id="track-order-id"
            type="text"
            placeholder="NS-90001"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !orderId.trim()}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Checking..." : "Track Order"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-start gap-2">
            <Icons.AlertCircle />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {order && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase">Order ID</p>
              <p className="text-lg font-mono font-bold text-gray-900 mt-1">{order.order_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase">Customer</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{order.customer_name}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-3">Delivery Timeline</p>
              <StatusTimeline status={order.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 font-semibold uppercase">Ordered Date</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(order.placed_at)}</p>
              </div>
              {order.delivered_at && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Delivered Date</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(order.delivered_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
