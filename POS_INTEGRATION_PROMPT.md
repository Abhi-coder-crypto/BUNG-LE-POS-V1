# POS Integration — Digital Menu Setup Prompt

Give this entire file as a prompt to the Replit agent managing the **Digital Menu** project.

---

## Context

This digital menu app needs to write customer orders into a shared MongoDB database so that the **Restaurant POS system** can automatically pick them up in real-time (every 5 seconds).

The POS polls the following location:

| Setting | Value |
|---|---|
| **MongoDB URI** | *(same URI already configured in this project's secrets as `MONGODB_URI`)* |
| **Database name** | `Orders` |
| **Collection name** | `orders` |

---

## What You Need to Do

When a customer places an order, **insert one document** into the `Orders` database → `orders` collection using the schema below.

**Do NOT** update or delete documents after inserting — the POS stamps `syncedToPOS: true` on them once processed. Only insert new documents for new orders.

---

## Required Document Schema

```js
{
  // ── Customer ──────────────────────────────────────────────────────
  customerName:    "Rahul Sharma",        // string, required
  customerPhone:   "9876543210",          // string, required — used to auto-register new customers in POS
  customerEmail:   "rahul@email.com",     // string, optional
  customerAddress: "123 MG Road, Mumbai", // string, optional — needed for delivery orders

  // ── Order type ────────────────────────────────────────────────────
  // Use exactly one of: "dine-in" | "delivery" | "pickup"
  orderType: "dine-in",

  // Table number — include only for dine-in orders
  tableNumber: "T3",   // must match the table number in the POS (e.g. "T1", "T2", ...)

  // ── Items ─────────────────────────────────────────────────────────
  items: [
    {
      name:     "Butter Chicken",   // string, required — item name as it appears on the menu
      quantity: 2,                  // number, required
      price:    350,                // number, required — unit price in ₹ (without tax)
      isVeg:    false,              // boolean, optional — true = veg, false = non-veg (default: true)
      notes:    "Extra gravy",      // string, optional — special instructions for this item
    },
    {
      name:     "Garlic Naan",
      quantity: 4,
      price:    60,
      isVeg:    true,
      notes:    null,
    }
  ],

  // ── Totals ────────────────────────────────────────────────────────
  total:  820,       // number — final amount the customer pays (after tax/discount)

  // ── Payment ───────────────────────────────────────────────────────
  // paymentStatus: "pending" → order goes to Kitchen Display (KDS) immediately
  // paymentStatus: "paid"    → order is marked as billed in POS
  paymentStatus: "pending",              // "pending" | "paid"
  paymentMode:   "upi",                  // "cash" | "upi" | "card" | "online" — optional

  // ── Status ────────────────────────────────────────────────────────
  // The POS picks up orders where status is: "pending", "confirmed", "new", or "placed"
  // Do NOT use "completed", "cancelled", or "rejected" for new orders
  status: "pending",

  // ── Timestamps ───────────────────────────────────────────────────
  createdAt: new Date(),   // Date object — when the order was placed

  // ── POS sync fields (leave these out — POS fills them in) ────────
  // syncedToPOS: false    ← POS sets this to true after processing
  // syncedAt: Date        ← POS sets this
  // posOrderId: string    ← POS fills in its internal order ID
}
```

---

## Code Example (Node.js / MongoDB driver)

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const db   = client.db("Orders");         // ← database name must be exactly "Orders"
const coll = db.collection("orders");     // ← collection name must be exactly "orders"

async function placeOrderInPOS(orderData) {
  const doc = {
    customerName:    orderData.customerName,
    customerPhone:   orderData.customerPhone,
    customerEmail:   orderData.customerEmail   ?? null,
    customerAddress: orderData.customerAddress ?? null,

    orderType:   orderData.orderType,      // "dine-in" | "delivery" | "pickup"
    tableNumber: orderData.tableNumber ?? null,

    items: orderData.items.map(item => ({
      name:     item.name,
      quantity: item.quantity,
      price:    item.price,
      isVeg:    item.isVeg ?? true,
      notes:    item.notes ?? null,
    })),

    total:         orderData.total,
    paymentStatus: orderData.paymentStatus ?? "pending",
    paymentMode:   orderData.paymentMode   ?? null,
    status:        "pending",
    createdAt:     new Date(),
  };

  const result = await coll.insertOne(doc);
  console.log("Order sent to POS:", result.insertedId);
  return result.insertedId;
}
```

---

## How the POS Reacts

| Trigger | POS Action |
|---|---|
| New document inserted with `status: "pending"` | Order appears in **Kitchen Display (KDS)** and **KOT** within 5 seconds |
| `paymentStatus: "paid"` | Order is marked **Billed** in POS directly |
| Customer phone not in POS | Customer is **auto-registered** in POS Customers database |
| After processing | Document gets `syncedToPOS: true`, `syncedAt`, and `posOrderId` stamped — POS will never re-process it |

---

## Important Rules

1. **Always insert a new document** for each order — never reuse or update an existing one.
2. **`status` must be `"pending"`, `"confirmed"`, `"new"`, or `"placed"`** for the POS to pick it up. Orders with any other status are ignored.
3. **`customerPhone` is critical** — it is the key used to look up or register the customer in the POS.
4. **Item `price` must be the unit price** (not the line total). The POS calculates `price × quantity` internally.
5. The `Orders` database and `orders` collection are shared — **use the same `MONGODB_URI`** that is already configured in this digital menu project's Replit secrets. Just switch the database name to `"Orders"` when connecting.
6. Do not rename fields. The POS reads exact field names as listed above (`customerName`, `customerPhone`, `items`, `total`, etc.).

---

## Quick Checklist Before Going Live

- [ ] `MONGODB_URI` secret is set in this digital menu Replit project
- [ ] Orders are inserted into database **`Orders`**, collection **`orders`**
- [ ] Each order document has `customerPhone`, `items` array, and `status: "pending"`
- [ ] Item objects have `name`, `quantity`, and `price`
- [ ] `orderType` is one of `"dine-in"`, `"delivery"`, or `"pickup"`
- [ ] For dine-in orders, `tableNumber` matches the POS table numbers (e.g. `"T1"`, `"T2"`)
