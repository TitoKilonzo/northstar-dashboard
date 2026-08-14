import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const STAGES = ["Processing", "Shipped", "In Transit", "Delivered"];
const NAMES = ["A. Njoroge", "B. Wanjiru", "C. Otieno", "D. Mwangi", "E. Achieng", "F. Kiptoo"];
const CATALOG = [
  { name: "Wireless Earbuds", finalSale: false, price: "₦15,999" },
  { name: "Trail Runner Sneaker", finalSale: false, price: "₦28,500" },
  { name: "Cast Iron Skillet 10in", finalSale: false, price: "₦12,000" },
  { name: "Clearance Desk Lamp", finalSale: true, price: "₦4,500" },
  { name: "Canvas Tote Bag", finalSale: false, price: "₦3,999" },
  { name: "Noise-Cancelling Headset", finalSale: false, price: "₦42,000" },
  { name: "Discounted Yoga Mat", finalSale: true, price: "₦6,000" },
  { name: "Insulated Water Bottle", finalSale: false, price: "₦2,499" },
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
  await db.execute(`
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

  await db.execute(`DELETE FROM returns;`);
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

  // Seed mock returns history into local.db
  const MOCK_RETURNS_SEED = [
    {
      return_id: "RET-001",
      order_id: "NS-90001",
      item_id: "NS-90001-ITEM1",
      product_name: "Wireless Earbuds",
      status: "Refunded",
      amount: "₦15,999",
      requested_at: daysAgo(8),
      refunded_at: daysAgo(3),
      reason: "Changed my mind",
      condition: "New, unused, original packaging",
    },
    {
      return_id: "RET-002",
      order_id: "NS-90005",
      item_id: "NS-90005-ITEM2",
      product_name: "Canvas Tote Bag",
      status: "In Transit",
      amount: "₦3,999",
      requested_at: daysAgo(2),
      refunded_at: null,
      reason: "Wrong item received",
      condition: "Opened but unused",
    },
    {
      return_id: "RET-003",
      order_id: "NS-90002",
      item_id: "NS-90002-ITEM1",
      product_name: "Trail Runner Sneaker",
      status: "Approved",
      amount: "₦28,500",
      requested_at: daysAgo(5),
      refunded_at: null,
      reason: "Item doesn't fit",
      condition: "New, unused, original packaging",
    },
  ];

  for (const r of MOCK_RETURNS_SEED) {
    await db.execute({
      sql: `INSERT INTO returns (return_id, order_id, item_id, product_name, status, amount, requested_at, refunded_at, reason, condition)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.return_id,
        r.order_id,
        r.item_id,
        r.product_name,
        r.status,
        r.amount,
        r.requested_at,
        r.refunded_at,
        r.reason,
        r.condition,
      ],
    });
  }

  // bulk it out with randomised orders so it doesn't feel like 7 rows in a demo
  let count = 7;
  for (let i = 1; i <= 45; i++) {
    const id = "NS-" + String(10000 + i);
    const status = STAGES[Math.floor(Math.random() * STAGES.length)];
    const placedDaysAgo = Math.floor(Math.random() * 50) + 1;
    const placed = daysAgo(placedDaysAgo);
    let delivered = null;
    if (status === "Delivered") {
      const maxDeliveryDaysAgo = Math.max(0, placedDaysAgo - 1);
      delivered = daysAgo(Math.floor(Math.random() * (maxDeliveryDaysAgo + 1)));
    }
    const item = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    await insertOrder(id, NAMES[i % NAMES.length], status, placed, delivered, [item]);
    count++;
  }

  console.log(`Seeded ${count} orders & ${MOCK_RETURNS_SEED.length} mock returns into untracked local.db`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
