import { TrackOrderCard } from "./components/TrackOrderCard";
import { RequestReturnCard } from "./components/RequestReturnCard";
import { RefundTracker } from "./components/RefundTracker";
import { ReturnsTable } from "./components/ReturnsTable";
import type { ReturnEntry } from "@/types";

// Placeholder data — replace with a real API call when the returns
// backend is built. Kept here so the dashboard isn't empty.
const PLACEHOLDER_RETURNS: ReturnEntry[] = [
  {
    id: "RET-001",
    orderId: "NS-90002",
    productName: "USB Cable",
    status: "Refunded",
    amount: "₦3,999",
    requestedDate: "2024-08-01",
    refundedDate: "2024-08-10",
    reason: "Changed my mind",
  },
  {
    id: "RET-002",
    orderId: "NS-90003",
    productName: "Phone Stand",
    status: "In Transit",
    amount: "₦2,499",
    requestedDate: "2024-08-05",
    refundedDate: null,
    reason: "Damaged",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NorthStar</h1>
              <p className="text-sm text-gray-600">Order &amp; Return Management</p>
            </div>
            <nav className="hidden md:flex gap-6">
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Help</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Account</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Refund Tracker Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Refund Overview</h2>
          <RefundTracker returns={PLACEHOLDER_RETURNS} />
        </div>

        {/* Order & Return Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrackOrderCard />
          <RequestReturnCard />
        </div>

        {/* Returns History Table */}
        <div className="mb-8">
          <ReturnsTable returns={PLACEHOLDER_RETURNS} />
        </div>
      </main>
    </div>
  );
}
