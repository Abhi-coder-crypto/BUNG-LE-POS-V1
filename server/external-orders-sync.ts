/**
 * ExternalOrdersSyncService
 *
 * Polls the "Orders" MongoDB database → "orders" collection for incoming
 * orders placed through external channels (website, app, etc.) and syncs
 * them into this POS system automatically.
 *
 * Expected order document shape (flexible – missing fields are handled):
 * {
 *   _id: ObjectId,
 *   customerName: string,
 *   customerPhone: string,
 *   customerAddress?: string,
 *   orderType: "delivery" | "dine-in" | "pickup" | "takeaway",
 *   tableNumber?: string,
 *   items: [{ name, quantity, price, isVeg? }],
 *   total?: number,
 *   status?: "pending" | "confirmed" | "preparing" | "ready" | "completed",
 *   paymentStatus?: "pending" | "paid",
 *   paymentMode?: string,
 *   createdAt?: Date,
 *   syncedToPOS?: boolean,   // set to true after sync — prevents re-processing
 *   posOrderId?: string,     // filled in after sync
 * }
 */

import { MongoClient, Db } from "mongodb";
import type { IStorage } from "./storage";

const EXTERNAL_DB_NAME = "Orders";       // the database the user specified
const EXTERNAL_COLL   = "orders";        // the collection inside that DB

export class ExternalOrdersSyncService {
  private storage: IStorage;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private processedIds = new Set<string>();
  private isRunning = false;
  private broadcastFn: ((type: string, data: any) => void) | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  setBroadcastFunction(fn: (type: string, data: any) => void) {
    this.broadcastFn = fn;
  }

  /* ── lifecycle ──────────────────────────────────────────────────── */

  async start(intervalMs = 5000): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log("🔄 [ExternalOrders] Starting external orders sync service...");
    await this.connect();
    await this.loadAlreadySynced();
    await this.sync();

    this.syncInterval = setInterval(() => this.sync(), intervalMs);
    console.log(`✅ [ExternalOrders] Sync running every ${intervalMs / 1000}s`);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log("🛑 [ExternalOrders] Sync stopped");
  }

  getStatus() {
    return { isRunning: this.isRunning, processedOrders: this.processedIds.size };
  }

  /* ── internal helpers ───────────────────────────────────────────── */

  private async connect(): Promise<void> {
    if (this.client) return;
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(EXTERNAL_DB_NAME);
    console.log(`✅ [ExternalOrders] Connected to "${EXTERNAL_DB_NAME}" database`);
  }

  private collection() {
    if (!this.db) throw new Error("Not connected to external DB");
    return this.db.collection(EXTERNAL_COLL);
  }

  /** Mark every already-synced order so we don't re-process on restart */
  private async loadAlreadySynced(): Promise<void> {
    try {
      const docs = await this.collection().find({ syncedToPOS: true }, { projection: { _id: 1 } }).toArray();
      docs.forEach(d => this.processedIds.add(d._id.toString()));
      console.log(`📊 [ExternalOrders] Loaded ${docs.length} already-synced orders`);
    } catch (err) {
      console.error("[ExternalOrders] Failed to load sync state:", err);
    }
  }

  /** Main poll cycle */
  async sync(): Promise<number> {
    try {
      const coll = this.collection();

      // Fetch every document that hasn't been synced yet
      const docs = await coll.find({
        syncedToPOS: { $ne: true },
        // Accept orders in actionable states; fall back if field is missing
        $or: [
          { status: { $in: ["pending", "confirmed", "new", "placed"] } },
          { status: { $exists: false } },
        ],
      }).sort({ createdAt: 1 }).toArray();

      let synced = 0;

      for (const doc of docs) {
        const id = doc._id.toString();
        if (this.processedIds.has(id)) continue;

        // Guard immediately to avoid race conditions
        this.processedIds.add(id);

        try {
          const posOrderId = await this.createPOSOrder(doc);

          // Mark source document as synced
          await coll.updateOne(
            { _id: doc._id },
            {
              $set: {
                syncedToPOS: true,
                syncedAt: new Date(),
                posOrderId,
              },
            }
          );

          synced++;
          console.log(`✅ [ExternalOrders] Synced order ${id} → POS ${posOrderId}`);

          this.broadcastFn?.("external_order_synced", {
            externalOrderId: id,
            posOrderId,
            customerName: doc.customerName,
            customerPhone: doc.customerPhone,
          });
        } catch (err) {
          // Allow retry on next cycle
          this.processedIds.delete(id);
          console.error(`❌ [ExternalOrders] Failed to sync order ${id}:`, err);
        }
      }

      if (synced > 0) {
        console.log(`📦 [ExternalOrders] ${synced} new order(s) synced to POS`);
        this.broadcastFn?.("external_orders_batch_synced", { count: synced });
      }

      return synced;
    } catch (err) {
      console.error("[ExternalOrders] Sync cycle error:", err);
      return 0;
    }
  }

  /** Convert an external order document into POS entities */
  private async createPOSOrder(doc: any): Promise<string> {
    // ── 1. Customer lookup / auto-register ───────────────────────────
    const phone = (doc.customerPhone || doc.phone || "").toString().trim();
    const name  = (doc.customerName  || doc.name  || "Guest").toString().trim();

    if (phone) {
      const existing = await this.storage.getCustomerByPhone(phone);
      if (!existing) {
        await this.storage.createCustomer({
          name,
          phone,
          email:   doc.customerEmail   || doc.email   || null,
          address: doc.customerAddress || doc.address || null,
        });
        console.log(`👤 [ExternalOrders] Registered new customer: ${name} (${phone})`);
        this.broadcastFn?.("customer_registered", { name, phone });
      }
    }

    // ── 2. Normalise order type ───────────────────────────────────────
    // If no explicit orderType but a tableId/tableNumber is present → dine-in
    const hasTableRef = !!(doc.tableId || doc.tableNumber || doc.table);
    const rawType = (doc.orderType || doc.type || (hasTableRef ? "dine-in" : "delivery")).toLowerCase();
    const orderType: string =
      rawType.includes("dine") || rawType.includes("table") ? "dine-in"  :
      rawType.includes("pick") || rawType.includes("take")  ? "pickup"   :
      "delivery";

    // ── 3. Map to POS status ─────────────────────────────────────────
    //    Paid → billed  |  Everything else → sent_to_kitchen (shows in KDS)
    const isPaid  = (doc.paymentStatus || "").toLowerCase() === "paid";
    const posStatus = isPaid ? "billed" : "sent_to_kitchen";

    // ── 3b. Resolve table ID for dine-in orders ──────────────────────
    let resolvedTableId: string | null = null;
    if (orderType === "dine-in") {
      const rawTableRef = (doc.tableId || doc.tableNumber || doc.table || "").toString().trim();
      if (rawTableRef) {
        // Try exact match first (e.g. "T1")
        let table = await this.storage.getTableByNumber(rawTableRef);

        if (!table) {
          // Normalise "Table1" / "table 01" / "TABLE1" → "T1" (strips leading zeros)
          const numMatch = rawTableRef.match(/\d+/);
          if (numMatch) {
            const normalised = `T${parseInt(numMatch[0], 10)}`;
            table = await this.storage.getTableByNumber(normalised);
          }
        }

        if (table) {
          resolvedTableId = table.id;
          console.log(`🪑 [ExternalOrders] Matched table ref "${rawTableRef}" → ${table.tableNumber} (id: ${table.id})`);
        } else {
          console.warn(`⚠️  [ExternalOrders] Could not find table for ref "${rawTableRef}" — order will have no table linked`);
        }
      }
    }

    // ── 4. Create POS order ──────────────────────────────────────────
    const posOrder = await this.storage.createOrder({
      tableId:          resolvedTableId,
      orderType,
      status:           posStatus,
      total:            "0",
      customerName:     name   || null,
      customerPhone:    phone  || null,
      customerAddress:  (doc.customerAddress || doc.address || null),
      paymentMode:      doc.paymentMode || doc.paymentMethod || null,
      waiterId:         null,
      deliveryPersonId: null,
      expectedPickupTime: null,
    });

    this.broadcastFn?.("order_created", posOrder);

    // ── 5. Create order items ────────────────────────────────────────
    const items: any[] = doc.items || doc.orderItems || doc.cart || [];
    let subtotal = 0;

    for (const item of items) {
      const itemName = item.name || item.menuItemName || item.itemName || "Unknown Item";
      const qty      = Number(item.quantity || item.qty || 1);
      const price    = Number(item.price || item.unitPrice || item.rate || 0);

      // Derive isVeg from explicit flag OR from category string (e.g. "nonveg:rice" → false)
      // Handles booleans, numbers (0/1), and string forms ("true"/"false"/"yes"/"no"/"0"/"1")
      const parseBoolFlag = (v: unknown): boolean => {
        if (typeof v === "boolean") return v;
        if (typeof v === "number")  return v !== 0;
        const s = String(v).toLowerCase().trim();
        return s !== "false" && s !== "0" && s !== "no";
      };
      // Non-veg detection handles: "nonveg", "non-veg", "non veg", "NON_VEG", etc.
      const isNonVegCategory = (s: string) => /non[-_\s]?veg/i.test(s);

      let isVeg: boolean;
      if (item.isVeg !== undefined)           isVeg = parseBoolFlag(item.isVeg);
      else if (item.vegetarian !== undefined)  isVeg = parseBoolFlag(item.vegetarian);
      else if (item.category)                  isVeg = !isNonVegCategory(String(item.category));
      else if (item.type)                      isVeg = !isNonVegCategory(String(item.type));
      else                                     isVeg = true; // safe default

      const notes    = item.notes || item.instructions || item.specialRequest || null;

      subtotal += qty * price;

      const created = await this.storage.createOrderItem({
        orderId:    posOrder.id,
        menuItemId: "external",          // no local menu item to link to
        name:       itemName,
        quantity:   qty,
        price:      price.toFixed(2),
        notes,
        status:     "new",
        isVeg,
      });

      this.broadcastFn?.("order_item_added", { orderId: posOrder.id, item: created });
    }

    // ── 6. Update total ───────────────────────────────────────────────
    const total = (doc.total || doc.totalAmount || doc.grandTotal || subtotal).toFixed(2);
    await this.storage.updateOrderTotal(posOrder.id, total);

    return posOrder.id;
  }
}
