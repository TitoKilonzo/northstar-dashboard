import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await ensureSchema();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
    }

    const returnId = typeof body?.return_id === "string" ? body.return_id.trim() : "";

    if (!returnId) {
      return NextResponse.json(
        { error: "Missing return_id parameter." },
        { status: 400 }
      );
    }

    const checkResult = await db.execute({
      sql: `SELECT return_id, status FROM returns WHERE return_id = ?`,
      args: [returnId],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Return record not found." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE returns SET status = 'Refunded', refunded_at = ? WHERE return_id = ?`,
      args: [now, returnId],
    });

    return NextResponse.json({
      success: true,
      return_id: returnId,
      status: "Refunded",
      refunded_at: now,
      message: `Refund of ${returnId} processed successfully.`,
    });
  } catch (err) {
    console.error("[process-refund] Unhandled error:", err);
    return NextResponse.json(
      { error: "Failed to process refund. Please try again." },
      { status: 500 }
    );
  }
}
