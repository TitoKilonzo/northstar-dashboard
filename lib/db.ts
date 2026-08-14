import { createClient, Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

// Keep the named export for backward compat with seed script expectations,
// but route through the lazy getter
export const db = getDb();

export const ORDER_STAGES = ["Processing", "Shipped", "In Transit", "Delivered"] as const;

// return policy — kept as constants so they're easy to tweak/demo
export const RETURN_WINDOW_DAYS = 30;
export const ACCEPTABLE_CONDITIONS = [
  "New, unused, original packaging",
  "Opened but unused",
] as const;

let _schemaReady = false;

export async function ensureSchema(): Promise<void> {
  if (_schemaReady) return;

  const client = getDb();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        status TEXT NOT NULL,
        placed_at TEXT NOT NULL,
        delivered_at TEXT,
        updated_at TEXT NOT NULL
      );
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        item_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        final_sale INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
      );
    `);
    _schemaReady = true;
  } catch (err) {
    console.error("[db] Failed to ensure schema:", err);
    throw err;
  }
}
