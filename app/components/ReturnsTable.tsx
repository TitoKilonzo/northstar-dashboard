"use client";

import { useState } from "react";
import { Icons } from "./Icons";
import { formatDate, getReturnStatusColor } from "../lib/utils";
import type { ReturnEntry } from "@/types";

interface ReturnsTableProps {
  returns: ReturnEntry[];
  onRefundProcessed?: () => void;
}

export function ReturnsTable({ returns, onRefundProcessed }: ReturnsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  async function handleProcessRefund(returnId: string) {
    setProcessingId(returnId);
    setRefundError(null);

    try {
      const res = await fetch("/api/process-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_id: returnId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRefundError(data.error || "Failed to process refund");
      } else {
        onRefundProcessed?.();
      }
    } catch {
      setRefundError("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icons.Return />
          Returns &amp; Refund Management Table
        </h3>
        <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
          {returns.length} Total Records
        </span>
      </div>

      {refundError && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
          <Icons.AlertCircle />
          <span>{refundError}</span>
        </div>
      )}

      {returns.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Icons.Return />
          </div>
          <p className="text-gray-600 font-medium text-sm">No return requests found</p>
          <p className="text-gray-400 text-xs mt-1">Submit a return request above to see records appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Return ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Order &amp; Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Item Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Refund Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((ret) => {
                const isRefunded = ret.status === "Refunded";
                const isProcessing = processingId === ret.id;

                return (
                  <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">
                      {ret.id}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-gray-900">{ret.productName}</div>
                      <div className="text-xs font-mono text-gray-500">{ret.orderId}</div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-700">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md font-medium">
                        {ret.condition}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ret.reason}
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {ret.amount}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReturnStatusColor(ret.status)}`}>
                        {ret.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 space-y-0.5">
                      <div>Req: <span className="font-medium text-gray-800">{formatDate(ret.requestedDate)}</span></div>
                      {ret.refundedDate && (
                        <div className="text-emerald-700">
                          Ref: <span className="font-medium">{formatDate(ret.refundedDate)}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-right">
                      {isRefunded ? (
                        <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <Icons.CheckCircle /> Refund Issued
                        </span>
                      ) : (
                        <button
                          onClick={() => handleProcessRefund(ret.id)}
                          disabled={isProcessing}
                          className="bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                        >
                          {isProcessing ? "Processing..." : "Issue Refund"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
