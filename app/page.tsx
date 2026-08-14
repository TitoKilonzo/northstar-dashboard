"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { TrackOrderCard } from "./components/TrackOrderCard";
import { RequestReturnCard } from "./components/RequestReturnCard";
import { RefundTracker } from "./components/RefundTracker";
import { ReturnsTable } from "./components/ReturnsTable";
import type { ReturnEntry } from "@/types";

export default function Home() {
  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);

  const fetchReturns = useCallback(async () => {
    try {
      const res = await fetch("/api/returns");
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns || []);
      }
    } catch (err) {
      console.error("Failed to fetch returns history:", err);
    } finally {
      setLoadingReturns(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Help, Account, Settings Modals */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Refund Tracker Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Refund Overview</h2>
          <RefundTracker returns={returns} />
        </div>

        {/* Order & Return Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrackOrderCard />
          <RequestReturnCard onReturnSubmitted={fetchReturns} />
        </div>

        {/* Returns History Table */}
        <div className="mb-8">
          {loadingReturns ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
              Loading returns data...
            </div>
          ) : (
            <ReturnsTable returns={returns} onRefundProcessed={fetchReturns} />
          )}
        </div>
      </main>
    </div>
  );
}
