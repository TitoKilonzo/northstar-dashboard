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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

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
    await client.execute(`
      CREATE TABLE IF NOT EXISTS returns (
        return_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        status TEXT NOT NULL,
        amount TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        refunded_at TEXT,
        reason TEXT NOT NULL,
        condition TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (item_id) REFERENCES order_items(item_id)
      );
    `);

    // Check if database needs initial seeding
    const checkOrders = await client.execute("SELECT COUNT(*) as count FROM orders");
    const count = Number(checkOrders.rows[0]?.count ?? 0);

    if (count === 0) {
      console.log("[db] Database empty. Auto-seeding QA cases...");
      await autoSeedDb(client);
    }

    _schemaReady = true;
  } catch (err) {
    console.error("[db] Failed to ensure schema:", err);
    throw err;
  }
}

async function autoSeedDb(client: Client): Promise<void> {
  async function insertOrder(id: string, name: string, status: string, placed: string, delivered: string | null, items: { name: string; finalSale: boolean }[]) {
    await client.execute({
      sql: `INSERT INTO orders (order_id, customer_name, status, placed_at, delivered_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, name, status, placed, delivered, new Date().toISOString()],
    });
    for (let i = 0; i < items.length; i++) {
      await client.execute({
        sql: `INSERT INTO order_items (item_id, order_id, product_name, final_sale) VALUES (?, ?, ?, ?)`,
        args: [`${id}-ITEM${i + 1}`, id, items[i].name, items[i].finalSale ? 1 : 0],
      });
    }
  }

  await insertOrder("NS-90001", "A. Njoroge", "Delivered", daysAgo(20), daysAgo(10), [{ name: "Wireless Earbuds", finalSale: false }]);
  await insertOrder("NS-90002", "B. Wanjiru", "Delivered", daysAgo(60), daysAgo(45), [{ name: "Trail Runner Sneaker", finalSale: false }]);
  await insertOrder("NS-90003", "C. Otieno", "Shipped", daysAgo(3), null, [{ name: "Cast Iron Skillet 10in", finalSale: false }]);
  await insertOrder("NS-90004", "D. Mwangi", "Delivered", daysAgo(8), daysAgo(5), [{ name: "Clearance Desk Lamp", finalSale: true }]);
  await insertOrder("NS-90005", "E. Achieng", "Delivered", daysAgo(14), daysAgo(0), [
    { name: "Noise-Cancelling Headset", finalSale: false },
    { name: "Canvas Tote Bag", finalSale: false },
  ]);
  await insertOrder("NS-90006", "F. Kiptoo", "In Transit", daysAgo(2), null, [{ name: "Insulated Water Bottle", finalSale: false }]);
  await insertOrder("NS-90007", "A. Njoroge", "Delivered", daysAgo(35), daysAgo(29), [{ name: "Discounted Yoga Mat", finalSale: true }]);

  // Initial seed returns
  await client.execute({
    sql: `INSERT INTO returns (return_id, order_id, item_id, product_name, status, amount, requested_at, refunded_at, reason, condition)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["RET-001", "NS-90001", "NS-90001-ITEM1", "Wireless Earbuds", "Refunded", "₦15,999", daysAgo(8), daysAgo(3), "Changed my mind", "New, unused, original packaging"],
  });
  await client.execute({
    sql: `INSERT INTO returns (return_id, order_id, item_id, product_name, status, amount, requested_at, refunded_at, reason, condition)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["RET-002", "NS-90005", "NS-90005-ITEM2", "Canvas Tote Bag", "In Transit", "₦3,999", daysAgo(2), null, "Wrong item received", "Opened but unused"],
  });
}
