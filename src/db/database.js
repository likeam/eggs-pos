import Dexie from "dexie";

export const db = new Dexie("EggWholesaleDB");

db.version(1).stores({
  products: "++id, name, category, pricePerDozen, pricePerEgg, stock, unit",
  clients: "++id, name, phone, address, balance, createdAt",
  sales:
    "++id, clientId, clientName, items, totalAmount, paidAmount, dueAmount, date, type",
  payments: "++id, clientId, clientName, amount, date, note",
  transactions: "++id, clientId, type, amount, date, description, balance",
});

export async function initializeDatabase() {
  const count = await db.products.count();
  if (count === 0) {
    await db.products.bulkAdd([
      {
        name: "سفید انڈے (درجن)",
        category: "سفید",
        pricePerDozen: 320,
        pricePerEgg: 27,
        stock: 500,
        unit: "درجن",
      },
      {
        name: "براؤن انڈے (درجن)",
        category: "براؤن",
        pricePerDozen: 350,
        pricePerEgg: 30,
        stock: 400,
        unit: "درجن",
      },
      {
        name: "دیسی انڈے (درجن)",
        category: "دیسی",
        pricePerDozen: 450,
        pricePerEgg: 38,
        stock: 200,
        unit: "درجن",
      },
      {
        name: "فارمی انڈے (درجن)",
        category: "فارمی",
        pricePerDozen: 300,
        pricePerEgg: 25,
        stock: 600,
        unit: "درجن",
      },
      {
        name: "سفید انڈے (انڈے)",
        category: "سفید",
        pricePerDozen: 320,
        pricePerEgg: 27,
        stock: 1000,
        unit: "انڈے",
      },
      {
        name: "براؤن انڈے (انڈے)",
        category: "براؤن",
        pricePerDozen: 350,
        pricePerEgg: 30,
        stock: 800,
        unit: "انڈے",
      },
    ]);
  }
}
