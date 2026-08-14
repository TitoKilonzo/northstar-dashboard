import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const STAGES = ["Processing", "Shipped", "In Transit", "Delivered"];
const NAMES = ["A. Njoroge", "B. Wanjiru", "C. Otieno", "D. Mwangi", "E. Achieng", "F. Kiptoo"];
const CATALOG = [
  { name: "Wireless Earbuds", finalSale: false },
  { name: "Trail Runner Sneaker", finalSale: false },
  { name: "Cast Iron Skillet 10in", finalSale: false },
  { name: "Clearance Desk Lamp", finalSale: true },
  { name: "Canvas Tote Bag", finalSale: false },
  { name: "Noise-Cancelling Headset", finalSale: false },
  { name: "Discounted Yoga Mat", finalSale: true },
  { name: "Insulated Water Bottle", finalSale: false },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function main() {
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
  await db.execute(`DELETE FROM order_items;`);
  await db.execute(`DELETE FROM orders;`);

  async function insertOrder(id, name, status, placed, delivered, items) {
    await db.execute({
      sql: `INSERT INTO orders (order_id, customer_name, status, placed_at, delivered_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, name, status, placed, delivered, new Date().toISOString()],
    });
    for (let i = 0; i < items.length; i++) {
      await db.execute({
        sql: `INSERT INTO order_items (item_id, order_id, product_name, final_sale) VALUES (?, ?, ?, ?)`,
        args: [`${id}-ITEM${i + 1}`, id, items[i].name, items[i].finalSale ? 1 : 0],
      });
    }
  }

  // hand-picked cases for QA — covers each rule on its own
  await insertOrder("NS-90001", "A. Njoroge", "Delivered", daysAgo(20), daysAgo(10), [
    { name: "Wireless Earbuds", finalSale: false },
  ]); // straightforward eligible case
  await insertOrder("NS-90002", "B. Wanjiru", "Delivered", daysAgo(60), daysAgo(45), [
    { name: "Trail Runner Sneaker", finalSale: false },
  ]); // outside the 30-day window
  await insertOrder("NS-90003", "C. Otieno", "Shipped", daysAgo(3), null, [
    { name: "Cast Iron Skillet 10in", finalSale: false },
  ]); // not delivered yet
  await insertOrder("NS-90004", "D. Mwangi", "Delivered", daysAgo(8), daysAgo(5), [
    { name: "Clearance Desk Lamp", finalSale: true },
  ]); // final sale item
  await insertOrder("NS-90005", "E. Achieng", "Delivered", daysAgo(14), daysAgo(0), [
    { name: "Noise-Cancelling Headset", finalSale: false },
    { name: "Canvas Tote Bag", finalSale: false },
  ]); // delivered today, two items to pick from
  await insertOrder("NS-90006", "F. Kiptoo", "In Transit", daysAgo(2), null, [
    { name: "Insulated Water Bottle", finalSale: false },
  ]); // still in transit
  await insertOrder("NS-90007", "A. Njoroge", "Delivered", daysAgo(35), daysAgo(29), [
    { name: "Discounted Yoga Mat", finalSale: true },
  ]); // right at the edge of the window, but also final sale

  // bulk it out with randomised orders so it doesn't feel like 7 rows in a demo
  let count = 7;
  for (let i = 1; i <= 45; i++) {
    const id = "NS-" + String(10000 + i);
    const status = STAGES[Math.floor(Math.random() * STAGES.length)];
    const placedDaysAgo = Math.floor(Math.random() * 50) + 1;
    const placed = daysAgo(placedDaysAgo);
    // Ensure delivered_at is always AFTER placed_at
    let delivered = null;
    if (status === "Delivered") {
      const maxDeliveryDaysAgo = Math.max(0, placedDaysAgo - 1);
      delivered = daysAgo(Math.floor(Math.random() * (maxDeliveryDaysAgo + 1)));
    }
    const item = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    await insertOrder(id, NAMES[i % NAMES.length], status, placed, delivered, [item]);
    count++;
  }

  console.log(`Seeded ${count} orders (7 hand-picked QA cases + ${count - 7} random) into local.db`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
