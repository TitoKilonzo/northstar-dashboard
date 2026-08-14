import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, RETURN_WINDOW_DAYS, ACCEPTABLE_CONDITIONS } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_FIELD_LENGTH = 200;

function isValidDate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== "string" || dateStr.length === 0) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureSchema();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
    }

    const raw_order_id = typeof body.order_id === "string" ? body.order_id.trim() : "";
    const item_id = typeof body.item_id === "string" ? body.item_id.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const condition = typeof body.condition === "string" ? body.condition.trim() : "";

    if (!raw_order_id || !item_id) {
      return NextResponse.json(
        { error: "Pick an order and an item first." },
        { status: 400 }
      );
    }

    if (
      raw_order_id.length > MAX_FIELD_LENGTH ||
      item_id.length > MAX_FIELD_LENGTH ||
      reason.length > MAX_FIELD_LENGTH ||
      condition.length > MAX_FIELD_LENGTH
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the maximum allowed length." },
        { status: 400 }
      );
    }

    // Format variations: e.g. "ns-90001" -> "NS-90001", "90001" -> "NS-90001", "NS90001" -> "NS-90001"
    const uppercaseId = raw_order_id.toUpperCase();
    let formattedId = uppercaseId;

    if (!uppercaseId.startsWith("NS-") && uppercaseId.startsWith("NS")) {
      formattedId = "NS-" + uppercaseId.slice(2);
    } else if (!uppercaseId.startsWith("NS-") && /^\d+$/.test(uppercaseId)) {
      formattedId = "NS-" + uppercaseId;
    }

    const orderResult = await db.execute({
      sql: `SELECT order_id, status, delivered_at FROM orders 
            WHERE UPPER(order_id) = ? OR UPPER(order_id) = ? OR order_id = ?`,
      args: [uppercaseId, formattedId, raw_order_id],
    });

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: `We couldn't find an order matching "${raw_order_id}".` },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];
    const order_id = String(order.order_id);

    const itemResult = await db.execute({
      sql: `SELECT item_id, product_name, final_sale FROM order_items WHERE (item_id = ? OR UPPER(item_id) = ?) AND order_id = ?`,
      args: [item_id, item_id.toUpperCase(), order_id],
    });
    if (itemResult.rows.length === 0) {
      return NextResponse.json(
        { error: "That item doesn't belong to this order." },
        { status: 400 }
      );
    }

    const item = itemResult.rows[0];

    // rule 1 — reason has to actually be filled in
    if (!reason) {
      return NextResponse.json({
        eligible: false,
        reason: "A return reason is required before we can process this request.",
      });
    }

    // rule 2 — has to have actually arrived
    if (order.status !== "Delivered" || !order.delivered_at) {
      return NextResponse.json({
        eligible: false,
        reason: `This order hasn't been delivered yet (current status: ${String(order.status)}). Returns can only start after delivery.`,
      });
    }

    // Validate delivered_at is a parseable date
    if (!isValidDate(order.delivered_at)) {
      console.error(`[return-eligibility] Invalid delivered_at for order ${String(order.order_id)}: ${String(order.delivered_at)}`);
      return NextResponse.json(
        { error: "Unable to determine delivery date. Please contact support." },
        { status: 500 }
      );
    }

    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(order.delivered_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      return NextResponse.json({
        eligible: false,
        reason: `This order was delivered ${daysSinceDelivery} days ago, which is past our ${RETURN_WINDOW_DAYS}-day return window.`,
      });
    }

    // rule 3 — final sale items can't come back (explicit comparison)
    if (Number(item.final_sale) === 1) {
      return NextResponse.json({
        eligible: false,
        reason: `${String(item.product_name)} was a final sale item, so it isn't eligible for return.`,
      });
    }

    // rule 4 — condition has to be good enough to resell
    if (!condition || !ACCEPTABLE_CONDITIONS.includes(condition as typeof ACCEPTABLE_CONDITIONS[number])) {
      return NextResponse.json({
        eligible: false,
        reason: "Based on the condition described, this item doesn't meet our return requirements. Items must be unused and in original packaging.",
      });
    }

    // Record approved return into untracked local.db returns table
    const returnId = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    try {
      await db.execute({
        sql: `INSERT INTO returns (return_id, order_id, item_id, product_name, status, amount, requested_at, refunded_at, reason, condition)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          returnId,
          order_id,
          String(item.item_id),
          String(item.product_name),
          "Approved",
          "₦15,000",
          now,
          null,
          reason,
          condition,
        ],
      });
    } catch (insertErr) {
      console.error("[return-eligibility] Failed to log return entry:", insertErr);
    }

    return NextResponse.json({
      eligible: true,
      reason: `Delivered ${daysSinceDelivery} day(s) ago, within the ${RETURN_WINDOW_DAYS}-day window, and in acceptable condition. Return approved.`,
    });
  } catch (err) {
    console.error("[return-eligibility] Unhandled error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
