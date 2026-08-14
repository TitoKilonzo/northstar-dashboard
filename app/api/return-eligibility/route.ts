import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema, RETURN_WINDOW_DAYS, ACCEPTABLE_CONDITIONS } from "@/lib/db";

// POST because this needs more than just an id - item, reason and
// condition all come from the form in one submit.
export async function POST(req: NextRequest) {
  await ensureSchema();
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { order_id, item_id, reason, condition } = body as {
    order_id?: string;
    item_id?: string;
    reason?: string;
    condition?: string;
  };

  if (!order_id || !item_id) {
    return NextResponse.json({ error: "Pick an order and an item first." }, { status: 400 });
  }

  const orderResult = await db.execute({
    sql: `SELECT order_id, status, delivered_at FROM orders WHERE order_id = ?`,
    args: [order_id],
  });
  if (orderResult.rows.length === 0) {
    return NextResponse.json(
      { error: `We couldn't find an order matching "${order_id}".` },
      { status: 404 }
    );
  }

  const itemResult = await db.execute({
    sql: `SELECT item_id, product_name, final_sale FROM order_items WHERE item_id = ? AND order_id = ?`,
    args: [item_id, order_id],
  });
  if (itemResult.rows.length === 0) {
    return NextResponse.json({ error: "That item doesn't belong to this order." }, { status: 400 });
  }

  const order = orderResult.rows[0];
  const item = itemResult.rows[0];

  // rule 1 - reason has to actually be filled in
  if (!reason || !reason.trim()) {
    return NextResponse.json({
      eligible: false,
      reason: "A return reason is required before we can process this request.",
    });
  }

  // rule 2 - has to have actually arrived, and the window counts from delivery
  if (order.status !== "Delivered" || !order.delivered_at) {
    return NextResponse.json({
      eligible: false,
      reason: `This order hasn't been delivered yet (current status: ${order.status}). Returns can only start after delivery.`,
    });
  }

  const daysSinceDelivery = Math.floor(
    (Date.now() - new Date(order.delivered_at as string).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return NextResponse.json({
      eligible: false,
      reason: `This order was delivered ${daysSinceDelivery} days ago, which is past our ${RETURN_WINDOW_DAYS}-day return window.`,
    });
  }

  // rule 3 - final sale items can't come back
  if (item.final_sale) {
    return NextResponse.json({
      eligible: false,
      reason: `${item.product_name} was a final sale item, so it isn't eligible for return.`,
    });
  }

  // rule 4 - condition has to be good enough to resell
  if (!condition || !ACCEPTABLE_CONDITIONS.includes(condition)) {
    return NextResponse.json({
      eligible: false,
      reason: `Based on the condition described, this item doesn't meet our return requirements. Items must be unused and in original packaging.`,
    });
  }

  return NextResponse.json({
    eligible: true,
    reason: `Delivered ${daysSinceDelivery} day(s) ago, within the ${RETURN_WINDOW_DAYS}-day window, and in acceptable condition. Return approved.`,
  });
}
