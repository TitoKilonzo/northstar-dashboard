import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_ORDER_ID_LENGTH = 50;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureSchema();
    const rawOrderId = req.nextUrl.searchParams.get("order_id")?.trim();

    if (!rawOrderId) {
      return NextResponse.json(
        { error: "Missing order_id parameter." },
        { status: 400 }
      );
    }

    if (rawOrderId.length > MAX_ORDER_ID_LENGTH) {
      return NextResponse.json(
        { error: "Invalid order_id format." },
        { status: 400 }
      );
    }

    // Format variations: e.g. "ns-90001" -> "NS-90001", "90001" -> "NS-90001", "NS90001" -> "NS-90001"
    const uppercaseId = rawOrderId.toUpperCase();
    let formattedId = uppercaseId;

    if (!uppercaseId.startsWith("NS-") && uppercaseId.startsWith("NS")) {
      formattedId = "NS-" + uppercaseId.slice(2);
    } else if (!uppercaseId.startsWith("NS-") && /^\d+$/.test(uppercaseId)) {
      formattedId = "NS-" + uppercaseId;
    }

    const orderResult = await db.execute({
      sql: `SELECT order_id, customer_name, status, placed_at, delivered_at 
            FROM orders 
            WHERE UPPER(order_id) = ? OR UPPER(order_id) = ? OR order_id = ?`,
      args: [uppercaseId, formattedId, rawOrderId],
    });

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: `We couldn't find an order matching "${rawOrderId}". Double check the order number and try again.` },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    const itemsResult = await db.execute({
      sql: `SELECT item_id, product_name, final_sale FROM order_items WHERE order_id = ?`,
      args: [String(order.order_id)],
    });

    return NextResponse.json({
      order_id: String(order.order_id),
      customer_name: String(order.customer_name),
      status: String(order.status),
      placed_at: String(order.placed_at),
      delivered_at: order.delivered_at ? String(order.delivered_at) : null,
      items: itemsResult.rows.map((r) => ({
        item_id: String(r.item_id),
        product_name: String(r.product_name),
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
