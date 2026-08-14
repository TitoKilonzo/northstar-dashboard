export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Pending";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getReturnStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Requested: "bg-blue-100 text-blue-800",
    Approved: "bg-green-100 text-green-800",
    "In Transit": "bg-yellow-100 text-yellow-800",
    Received: "bg-purple-100 text-purple-800",
    Refunded: "bg-emerald-100 text-emerald-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
