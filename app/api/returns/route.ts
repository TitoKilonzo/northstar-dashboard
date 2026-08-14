import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import type { ReturnEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await ensureSchema();

    const result = await db.execute(`
      SELECT return_id, order_id, item_id, product_name, status, amount, requested_at, refunded_at, reason, condition
      FROM returns
      ORDER BY requested_at DESC
    `);

    const returns: ReturnEntry[] = result.rows.map((row) => ({
      id: String(row.return_id),
      orderId: String(row.order_id),
      productName: String(row.product_name),
      status: String(row.status),
      amount: String(row.amount),
      requestedDate: String(row.requested_at),
      refundedDate: row.refunded_at ? String(row.refunded_at) : null,
      reason: String(row.reason),
      condition: row.condition ? String(row.condition) : "New, unused, original packaging",
    }));

    return NextResponse.json({ returns });
  } catch (err) {
    console.error("[returns] Unhandled error:", err);
    return NextResponse.json(
      { error: "Failed to fetch returns history." },
      { status: 500 }
    );
  }
}
