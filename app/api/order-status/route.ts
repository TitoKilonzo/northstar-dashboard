import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_ORDER_ID_LENGTH = 50;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureSchema();
    const orderId = req.nextUrl.searchParams.get("order_id")?.trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id parameter." },
        { status: 400 }
      );
    }

    if (orderId.length > MAX_ORDER_ID_LENGTH) {
      return NextResponse.json(
        { error: "Invalid order_id format." },
        { status: 400 }
      );
    }

    const orderResult = await db.execute({
      sql: `SELECT order_id, customer_name, status, placed_at, delivered_at FROM orders WHERE order_id = ?`,
      args: [orderId],
    });

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No order found matching that order number. Please double-check and try again." },
        { status: 404 }
      );
    }

    const itemsResult = await db.execute({
      sql: `SELECT item_id, product_name, final_sale FROM order_items WHERE order_id = ?`,
      args: [orderId],
    });

    const order = orderResult.rows[0];
    return NextResponse.json({
      order_id: order.order_id,
      customer_name: order.customer_name,
      status: order.status,
      placed_at: order.placed_at,
      delivered_at: order.delivered_at ?? null,
      items: itemsResult.rows.map((r) => ({
        item_id: r.item_id,
        product_name: r.product_name,
        final_sale: Boolean(r.final_sale),
      })),
    });
  } catch (err) {
    console.error("[order-status] Unhandled error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
