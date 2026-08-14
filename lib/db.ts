import { createClient } from "@libsql/client";

// local sqlite file by default, no setup needed. swap to a real Turso
// db later by dropping TURSO_DATABASE_URL / TURSO_AUTH_TOKEN in .env.local
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const ORDER_STAGES = ["Processing", "Shipped", "In Transit", "Delivered"];

// return policy - kept as constants so they're easy to tweak/demo
export const RETURN_WINDOW_DAYS = 30;
export const ACCEPTABLE_CONDITIONS = ["New, unused, original packaging", "Opened but unused"];

export async function ensureSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      status TEXT NOT NULL,
      placed_at TEXT NOT NULL,
      delivered_at TEXT,
      updated_at TEXT NOT NULL
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      item_id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      final_sale INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );
  `);
}
