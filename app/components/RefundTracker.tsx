import { Icons } from "./Icons";
import type { ReturnEntry } from "@/types";

interface RefundTrackerProps {
  returns: ReturnEntry[];
}

export function RefundTracker({ returns }: RefundTrackerProps) {
  const refundedItems = returns.filter((r) => r.status === "Refunded");
  const pendingRefunds = returns.filter((r) => r.status !== "Refunded");
  const totalRefunded = refundedItems.reduce((sum, r) => {
    const amount = parseInt(r.amount.replace(/[^0-9]/g, ""), 10);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Refunded */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Refunded</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₦{totalRefunded.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{refundedItems.length} items</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <Icons.CheckCircle />
          </div>
        </div>
      </div>

      {/* Pending Refunds */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Pending Refunds</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{pendingRefunds.length}</p>
            <p className="text-xs text-gray-500 mt-1">in progress</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <Icons.Clock />
          </div>
        </div>
      </div>

      {/* Refund Rate */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Refund Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {returns.length > 0
                ? Math.round((refundedItems.length / returns.length) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">success rate</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Icons.TrendingUp />
          </div>
        </div>
      </div>
    </div>
  );
}
