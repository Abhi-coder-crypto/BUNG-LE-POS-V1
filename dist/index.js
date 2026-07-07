// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  floors;
  tables;
  menuItems;
  orders;
  orderItems;
  inventoryItems;
  invoices;
  reservations;
  settings;
  deliveryPersons;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.floors = /* @__PURE__ */ new Map();
    this.tables = /* @__PURE__ */ new Map();
    this.menuItems = /* @__PURE__ */ new Map();
    this.orders = /* @__PURE__ */ new Map();
    this.orderItems = /* @__PURE__ */ new Map();
    this.inventoryItems = /* @__PURE__ */ new Map();
    this.invoices = /* @__PURE__ */ new Map();
    this.reservations = /* @__PURE__ */ new Map();
    this.settings = /* @__PURE__ */ new Map();
    this.deliveryPersons = /* @__PURE__ */ new Map();
    this.seedData();
  }
  seedData() {
    const defaultFloorId = randomUUID();
    const defaultFloor = {
      id: defaultFloorId,
      name: "Ground Floor",
      displayOrder: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.floors.set(defaultFloorId, defaultFloor);
    const tableNumbers = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const seats = [4, 6, 4, 2, 8, 4, 2, 6, 4, 4, 2, 4];
    tableNumbers.forEach((num, index) => {
      const id = randomUUID();
      const table = {
        id,
        tableNumber: num,
        seats: seats[index],
        status: "free",
        currentOrderId: null,
        floorId: defaultFloorId
      };
      this.tables.set(id, table);
    });
    const menuData = [
      { name: "Chicken Burger", category: "Burgers", price: "199.00", cost: "80.00", available: true, isVeg: false, variants: ["Regular", "Large"], image: null, description: null, quickCode: "1" },
      { name: "Veggie Pizza", category: "Pizza", price: "299.00", cost: "120.00", available: true, isVeg: true, variants: null, image: null, description: null, quickCode: "2" },
      { name: "French Fries", category: "Fast Food", price: "99.00", cost: "35.00", available: true, isVeg: true, variants: ["Small", "Medium", "Large"], image: null, description: null, quickCode: "3" },
      { name: "Coca Cola", category: "Beverages", price: "50.00", cost: "20.00", available: true, isVeg: true, variants: null, image: null, description: null, quickCode: "4" },
      { name: "Caesar Salad", category: "Salads", price: "149.00", cost: "60.00", available: true, isVeg: true, variants: null, image: null, description: null, quickCode: "5" },
      { name: "Pasta Alfredo", category: "Pasta", price: "249.00", cost: "100.00", available: true, isVeg: true, variants: null, image: null, description: null, quickCode: "6" },
      { name: "Chocolate Cake", category: "Desserts", price: "129.00", cost: "50.00", available: true, isVeg: true, variants: null, image: null, description: null, quickCode: "7" },
      { name: "Ice Cream", category: "Desserts", price: "79.00", cost: "30.00", available: true, isVeg: true, variants: ["Vanilla", "Chocolate", "Strawberry"], image: null, description: null, quickCode: "8" }
    ];
    menuData.forEach((item) => {
      const id = randomUUID();
      const menuItem = {
        id,
        name: item.name,
        category: item.category,
        price: item.price,
        cost: item.cost,
        available: item.available,
        isVeg: item.isVeg,
        variants: item.variants,
        image: item.image,
        description: item.description,
        quickCode: item.quickCode
      };
      this.menuItems.set(id, menuItem);
    });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getFloors() {
    return Array.from(this.floors.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }
  async getFloor(id) {
    return this.floors.get(id);
  }
  async createFloor(insertFloor) {
    const id = randomUUID();
    const floor = {
      id,
      name: insertFloor.name,
      displayOrder: insertFloor.displayOrder ?? 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.floors.set(id, floor);
    return floor;
  }
  async updateFloor(id, floorData) {
    const existing = this.floors.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      name: floorData.name ?? existing.name,
      displayOrder: floorData.displayOrder ?? existing.displayOrder
    };
    this.floors.set(id, updated);
    return updated;
  }
  async deleteFloor(id) {
    const tablesOnFloor = Array.from(this.tables.values()).filter((t) => t.floorId === id);
    if (tablesOnFloor.length > 0) {
      throw new Error(`Cannot delete floor: ${tablesOnFloor.length} table(s) are assigned to this floor`);
    }
    return this.floors.delete(id);
  }
  async getTables() {
    return Array.from(this.tables.values());
  }
  async getTable(id) {
    return this.tables.get(id);
  }
  async getTableByNumber(tableNumber) {
    return Array.from(this.tables.values()).find((t) => t.tableNumber === tableNumber);
  }
  async createTable(insertTable) {
    const id = randomUUID();
    const table = {
      id,
      tableNumber: insertTable.tableNumber,
      seats: insertTable.seats,
      status: insertTable.status ?? "free",
      currentOrderId: null,
      floorId: insertTable.floorId ?? null
    };
    this.tables.set(id, table);
    return table;
  }
  async updateTable(id, tableData) {
    const existing = this.tables.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      tableNumber: tableData.tableNumber ?? existing.tableNumber,
      seats: tableData.seats ?? existing.seats,
      status: tableData.status ?? existing.status,
      floorId: tableData.floorId !== void 0 ? tableData.floorId : existing.floorId
    };
    this.tables.set(id, updated);
    return updated;
  }
  async updateTableStatus(id, status) {
    const table = this.tables.get(id);
    if (!table) return void 0;
    const updated = { ...table, status };
    this.tables.set(id, updated);
    return updated;
  }
  async updateTableOrder(id, orderId) {
    const table = this.tables.get(id);
    if (!table) return void 0;
    const updated = { ...table, currentOrderId: orderId };
    this.tables.set(id, updated);
    return updated;
  }
  async deleteTable(id) {
    return this.tables.delete(id);
  }
  async getMenuItems() {
    return Array.from(this.menuItems.values());
  }
  async getMenuItem(id) {
    return this.menuItems.get(id);
  }
  async createMenuItem(item) {
    const id = randomUUID();
    if (item.quickCode) {
      const existingItem = Array.from(this.menuItems.values()).find(
        (menuItem2) => menuItem2.quickCode === item.quickCode
      );
      if (existingItem) {
        throw new Error(`Quick code "${item.quickCode}" is already in use by "${existingItem.name}"`);
      }
    }
    const menuItem = {
      id,
      name: item.name,
      category: item.category,
      price: item.price,
      cost: item.cost,
      available: item.available ?? true,
      isVeg: item.isVeg ?? true,
      variants: item.variants ?? null,
      image: item.image ?? null,
      description: item.description ?? null,
      quickCode: item.quickCode ?? null
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }
  async updateMenuItem(id, item) {
    const existing = this.menuItems.get(id);
    if (!existing) return void 0;
    if (item.quickCode !== void 0 && item.quickCode !== null) {
      const existingItem = Array.from(this.menuItems.values()).find(
        (menuItem) => menuItem.id !== id && menuItem.quickCode === item.quickCode
      );
      if (existingItem) {
        throw new Error(`Quick code "${item.quickCode}" is already in use by "${existingItem.name}"`);
      }
    }
    const updated = {
      ...existing,
      name: item.name ?? existing.name,
      category: item.category ?? existing.category,
      price: item.price ?? existing.price,
      cost: item.cost ?? existing.cost,
      available: item.available ?? existing.available,
      isVeg: item.isVeg ?? existing.isVeg,
      variants: item.variants !== void 0 ? item.variants : existing.variants,
      image: item.image !== void 0 ? item.image : existing.image,
      description: item.description !== void 0 ? item.description : existing.description,
      quickCode: item.quickCode !== void 0 ? item.quickCode : existing.quickCode
    };
    this.menuItems.set(id, updated);
    return updated;
  }
  async deleteMenuItem(id) {
    return this.menuItems.delete(id);
  }
  async getOrders() {
    return Array.from(this.orders.values());
  }
  async getOrder(id) {
    return this.orders.get(id);
  }
  async getOrdersByTable(tableId) {
    return Array.from(this.orders.values()).filter((o) => o.tableId === tableId);
  }
  async getActiveOrders() {
    return Array.from(this.orders.values()).filter(
      (o) => o.status === "sent_to_kitchen" || o.status === "ready_to_bill" || o.status === "billed"
    );
  }
  async getCompletedOrders() {
    return Array.from(this.orders.values()).filter(
      (o) => o.status === "paid" || o.status === "completed"
    );
  }
  async getDeliveryOrders() {
    return Array.from(this.orders.values()).filter((o) => o.orderType === "delivery").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createOrder(insertOrder) {
    const id = randomUUID();
    const order = {
      id,
      tableId: insertOrder.tableId ?? null,
      orderType: insertOrder.orderType,
      status: insertOrder.status ?? "saved",
      total: insertOrder.total ?? "0",
      customerName: insertOrder.customerName ?? null,
      customerPhone: insertOrder.customerPhone ?? null,
      customerAddress: insertOrder.customerAddress ?? null,
      paymentMode: insertOrder.paymentMode ?? null,
      waiterId: insertOrder.waiterId ?? null,
      deliveryPersonId: insertOrder.deliveryPersonId ?? null,
      expectedPickupTime: insertOrder.expectedPickupTime ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      completedAt: null,
      billedAt: null,
      paidAt: null
    };
    this.orders.set(id, order);
    return order;
  }
  async updateOrderStatus(id, status) {
    const order = this.orders.get(id);
    if (!order) return void 0;
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }
  async updateOrderTotal(id, total) {
    const order = this.orders.get(id);
    if (!order) return void 0;
    const updated = { ...order, total };
    this.orders.set(id, updated);
    return updated;
  }
  async completeOrder(id) {
    const order = this.orders.get(id);
    if (!order) return void 0;
    const updated = {
      ...order,
      status: "completed",
      completedAt: /* @__PURE__ */ new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }
  async billOrder(id) {
    const order = this.orders.get(id);
    if (!order) return void 0;
    const updated = {
      ...order,
      status: "billed",
      billedAt: /* @__PURE__ */ new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }
  async checkoutOrder(id, paymentMode) {
    const order = this.orders.get(id);
    if (!order) return void 0;
    const updated = {
      ...order,
      status: "paid",
      paymentMode: paymentMode ?? order.paymentMode,
      paidAt: /* @__PURE__ */ new Date(),
      completedAt: /* @__PURE__ */ new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }
  async deleteOrder(id) {
    return this.orders.delete(id);
  }
  async getOrderItems(orderId) {
    return Array.from(this.orderItems.values()).filter((item) => item.orderId === orderId);
  }
  async getOrderItem(id) {
    return this.orderItems.get(id);
  }
  async createOrderItem(item) {
    const id = randomUUID();
    const orderItem = {
      id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes ?? null,
      status: item.status ?? "new",
      isVeg: item.isVeg ?? true
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
  async updateOrderItemStatus(id, status) {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return void 0;
    const updated = { ...orderItem, status };
    this.orderItems.set(id, updated);
    return updated;
  }
  async updateOrderItem(id, data) {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return void 0;
    const updated = { ...orderItem, ...data };
    this.orderItems.set(id, updated);
    return updated;
  }
  async deleteOrderItem(id) {
    return this.orderItems.delete(id);
  }
  async getInventoryItems() {
    return Array.from(this.inventoryItems.values());
  }
  async getInventoryItem(id) {
    return this.inventoryItems.get(id);
  }
  async createInventoryItem(item) {
    const id = randomUUID();
    const inventoryItem = {
      id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      minStock: item.minStock ?? "0",
      supplierId: item.supplierId ?? null,
      costPerUnit: item.costPerUnit ?? "0",
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.inventoryItems.set(id, inventoryItem);
    return inventoryItem;
  }
  async updateInventoryItem(id, data) {
    const item = this.inventoryItems.get(id);
    if (!item) return void 0;
    const updated = { ...item, ...data, lastUpdated: /* @__PURE__ */ new Date() };
    this.inventoryItems.set(id, updated);
    return updated;
  }
  async updateInventoryQuantity(id, quantity) {
    const item = this.inventoryItems.get(id);
    if (!item) return void 0;
    const updated = { ...item, currentStock: quantity, lastUpdated: /* @__PURE__ */ new Date() };
    this.inventoryItems.set(id, updated);
    return updated;
  }
  async deleteInventoryItem(id) {
    return this.inventoryItems.delete(id);
  }
  async deductInventoryForOrder(orderId) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getRecipes() {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getRecipe(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getRecipeByMenuItemId(menuItemId) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async createRecipe(recipe) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async deleteRecipe(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getRecipeIngredients(recipeId) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getRecipeIngredient(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async createRecipeIngredient(ingredient) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async updateRecipeIngredient(id, ingredient) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async deleteRecipeIngredient(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getSuppliers() {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getSupplier(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async createSupplier(supplier) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async updateSupplier(id, supplier) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async deleteSupplier(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getPurchaseOrders() {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getPurchaseOrder(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async createPurchaseOrder(order) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async updatePurchaseOrder(id, order) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async receivePurchaseOrder(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async deletePurchaseOrder(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getPurchaseOrderItems(purchaseOrderId) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getPurchaseOrderItem(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async createPurchaseOrderItem(item) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async updatePurchaseOrderItem(id, item) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async deletePurchaseOrderItem(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getWastages() {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getWastage(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async createWastage(wastage) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async deleteWastage(id) {
    throw new Error("Not implemented in MemStorage - use MongoStorage");
  }
  async getInvoices() {
    return Array.from(this.invoices.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async getInvoice(id) {
    return this.invoices.get(id);
  }
  async getInvoiceByNumber(invoiceNumber) {
    return Array.from(this.invoices.values()).find((inv) => inv.invoiceNumber === invoiceNumber);
  }
  async createInvoice(insertInvoice) {
    const id = randomUUID();
    const invoice = {
      id,
      invoiceNumber: insertInvoice.invoiceNumber,
      orderId: insertInvoice.orderId,
      tableNumber: insertInvoice.tableNumber ?? null,
      floorName: insertInvoice.floorName ?? null,
      customerName: insertInvoice.customerName ?? null,
      customerPhone: insertInvoice.customerPhone ?? null,
      subtotal: insertInvoice.subtotal,
      tax: insertInvoice.tax,
      discount: insertInvoice.discount ?? "0",
      total: insertInvoice.total,
      paymentMode: insertInvoice.paymentMode,
      splitPayments: insertInvoice.splitPayments ?? null,
      status: insertInvoice.status ?? "Paid",
      items: insertInvoice.items,
      notes: insertInvoice.notes ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.invoices.set(id, invoice);
    return invoice;
  }
  async updateInvoice(id, invoiceData) {
    const existing = this.invoices.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...invoiceData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.invoices.set(id, updated);
    return updated;
  }
  async deleteInvoice(id) {
    return this.invoices.delete(id);
  }
  async getReservations() {
    return Array.from(this.reservations.values()).sort(
      (a, b) => new Date(a.timeSlot).getTime() - new Date(b.timeSlot).getTime()
    );
  }
  async getReservation(id) {
    return this.reservations.get(id);
  }
  async getReservationsByTable(tableId) {
    return Array.from(this.reservations.values()).filter(
      (r) => r.tableId === tableId && r.status === "active"
    );
  }
  async createReservation(insertReservation) {
    const id = randomUUID();
    const reservation = {
      id,
      tableId: insertReservation.tableId,
      customerName: insertReservation.customerName,
      customerPhone: insertReservation.customerPhone,
      numberOfPeople: insertReservation.numberOfPeople,
      timeSlot: insertReservation.timeSlot,
      notes: insertReservation.notes ?? null,
      status: insertReservation.status ?? "active",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.reservations.set(id, reservation);
    return reservation;
  }
  async updateReservation(id, reservationData) {
    const existing = this.reservations.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      tableId: reservationData.tableId ?? existing.tableId,
      customerName: reservationData.customerName ?? existing.customerName,
      customerPhone: reservationData.customerPhone ?? existing.customerPhone,
      numberOfPeople: reservationData.numberOfPeople ?? existing.numberOfPeople,
      timeSlot: reservationData.timeSlot ?? existing.timeSlot,
      notes: reservationData.notes !== void 0 ? reservationData.notes : existing.notes,
      status: reservationData.status ?? existing.status
    };
    this.reservations.set(id, updated);
    return updated;
  }
  async deleteReservation(id) {
    return this.reservations.delete(id);
  }
  async getSetting(key) {
    return this.settings.get(key);
  }
  async setSetting(key, value) {
    this.settings.set(key, value);
  }
  async getDeliveryPersons() {
    return Array.from(this.deliveryPersons.values());
  }
  async getDeliveryPerson(id) {
    return this.deliveryPersons.get(id);
  }
  async createDeliveryPerson(person) {
    const id = randomUUID();
    const deliveryPerson = {
      id,
      name: person.name,
      phone: person.phone,
      status: person.status || "available",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.deliveryPersons.set(id, deliveryPerson);
    return deliveryPerson;
  }
  async updateDeliveryPerson(id, person) {
    const existing = this.deliveryPersons.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      name: person.name ?? existing.name,
      phone: person.phone ?? existing.phone,
      status: person.status ?? existing.status
    };
    this.deliveryPersons.set(id, updated);
    return updated;
  }
  async deleteDeliveryPerson(id) {
    return this.deliveryPersons.delete(id);
  }
  async assignDeliveryPerson(orderId, deliveryPersonId) {
    const order = this.orders.get(orderId);
    if (!order) return void 0;
    const updated = {
      ...order,
      deliveryPersonId
    };
    this.orders.set(orderId, updated);
    return updated;
  }
};
var storage = new MemStorage();

// server/auth-middleware.ts
import session from "express-session";

// server/auth.ts
import { z } from "zod";
import fs from "fs";
import path from "path";
var ACCOUNTS_FILE = path.join(process.cwd(), "server", "restaurant-accounts.json");
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
function getAccounts() {
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
    const accounts = JSON.parse(data);
    return accounts.map((acc) => ({
      ...acc,
      mongodbUri: acc.mongodbUri === "CURRENT_MONGODB_URI" ? process.env.MONGODB_URI || "" : acc.mongodbUri
    }));
  } catch (error) {
    console.error("Error reading accounts file:", error);
    return [];
  }
}
function validateCredentials(username, password) {
  const accounts = getAccounts();
  const account = accounts.find(
    (acc) => acc.username === username && acc.password === password && acc.isActive
  );
  return account || null;
}

// server/dynamic-mongodb.ts
import { MongoClient } from "mongodb";
var DynamicMongoDBManager = class {
  connections = /* @__PURE__ */ new Map();
  cleanupInterval = null;
  CONNECTION_TTL = 30 * 60 * 1e3;
  constructor() {
    this.startCleanupJob();
  }
  startCleanupJob() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 5 * 60 * 1e3);
  }
  cleanupIdleConnections() {
    const now = Date.now();
    for (const [restaurantId, info] of this.connections.entries()) {
      if (now - info.lastUsed > this.CONNECTION_TTL) {
        console.log(`Closing idle connection for restaurant: ${restaurantId}`);
        info.client.close().catch(console.error);
        this.connections.delete(restaurantId);
      }
    }
  }
  extractDatabaseName(uri) {
    try {
      const url = new URL(uri);
      const pathname = url.pathname.substring(1);
      if (pathname && pathname !== "") {
        return pathname.split("?")[0];
      }
      return "restaurant_pos";
    } catch (error) {
      return "restaurant_pos";
    }
  }
  async getConnection(restaurantId, mongodbUri) {
    const existing = this.connections.get(restaurantId);
    if (existing) {
      existing.lastUsed = Date.now();
      return { client: existing.client, db: existing.db };
    }
    try {
      const client = new MongoClient(mongodbUri);
      await client.connect();
      const dbName = this.extractDatabaseName(mongodbUri);
      const db = client.db(dbName);
      console.log(`Connected to MongoDB for restaurant ${restaurantId}: ${dbName}`);
      this.connections.set(restaurantId, {
        client,
        db,
        lastUsed: Date.now()
      });
      return { client, db };
    } catch (error) {
      console.error(`Failed to connect to MongoDB for restaurant ${restaurantId}:`, error);
      throw error;
    }
  }
  getCollection(restaurantId, collectionName) {
    const connection = this.connections.get(restaurantId);
    if (!connection) {
      return null;
    }
    connection.lastUsed = Date.now();
    return connection.db.collection(collectionName);
  }
  hasConnection(restaurantId) {
    return this.connections.has(restaurantId);
  }
  async closeConnection(restaurantId) {
    const connection = this.connections.get(restaurantId);
    if (connection) {
      await connection.client.close();
      this.connections.delete(restaurantId);
      console.log(`Closed connection for restaurant: ${restaurantId}`);
    }
  }
  async closeAll() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    for (const [restaurantId, info] of this.connections.entries()) {
      await info.client.close();
      console.log(`Closed connection for restaurant: ${restaurantId}`);
    }
    this.connections.clear();
  }
};
var dynamicMongoDB = new DynamicMongoDBManager();

// server/session-storage.ts
import { randomUUID as randomUUID2 } from "crypto";
var SessionStorage = class {
  restaurantId;
  mongodbUri;
  connected = false;
  constructor(restaurantId, mongodbUri) {
    this.restaurantId = restaurantId;
    this.mongodbUri = mongodbUri;
  }
  async ensureConnection() {
    if (!this.connected) {
      await dynamicMongoDB.getConnection(this.restaurantId, this.mongodbUri);
      this.connected = true;
    }
  }
  getCollection(name) {
    const collection = dynamicMongoDB.getCollection(this.restaurantId, name);
    if (!collection) {
      throw new Error(`Not connected to database for restaurant ${this.restaurantId}`);
    }
    return collection;
  }
  async getUser(id) {
    await this.ensureConnection();
    const user = await this.getCollection("users").findOne({ id });
    return user ?? void 0;
  }
  async getUserByUsername(username) {
    await this.ensureConnection();
    const user = await this.getCollection("users").findOne({ username });
    return user ?? void 0;
  }
  async createUser(user) {
    await this.ensureConnection();
    const id = randomUUID2();
    const newUser = { id, ...user };
    await this.getCollection("users").insertOne(newUser);
    return newUser;
  }
  async getFloors() {
    await this.ensureConnection();
    const floors = await this.getCollection("floors").find().sort({ displayOrder: 1 }).toArray();
    return floors;
  }
  async getFloor(id) {
    await this.ensureConnection();
    const floor = await this.getCollection("floors").findOne({ id });
    return floor ?? void 0;
  }
  async createFloor(insertFloor) {
    await this.ensureConnection();
    const id = randomUUID2();
    const floor = {
      id,
      name: insertFloor.name,
      displayOrder: insertFloor.displayOrder ?? 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("floors").insertOne(floor);
    return floor;
  }
  async updateFloor(id, floorData) {
    await this.ensureConnection();
    const result = await this.getCollection("floors").findOneAndUpdate(
      { id },
      { $set: floorData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteFloor(id) {
    await this.ensureConnection();
    const tablesOnFloor = await this.getCollection("tables").countDocuments({ floorId: id });
    if (tablesOnFloor > 0) {
      throw new Error(`Cannot delete floor: ${tablesOnFloor} table(s) are assigned to this floor`);
    }
    const result = await this.getCollection("floors").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getTables() {
    await this.ensureConnection();
    const tables = await this.getCollection("tables").find().toArray();
    return tables;
  }
  async getTable(id) {
    await this.ensureConnection();
    const table = await this.getCollection("tables").findOne({ id });
    return table ?? void 0;
  }
  async getTableByNumber(tableNumber) {
    await this.ensureConnection();
    const table = await this.getCollection("tables").findOne({ tableNumber });
    return table ?? void 0;
  }
  async createTable(insertTable) {
    await this.ensureConnection();
    const id = randomUUID2();
    const table = {
      id,
      tableNumber: insertTable.tableNumber,
      seats: insertTable.seats,
      status: insertTable.status ?? "free",
      currentOrderId: null,
      floorId: insertTable.floorId ?? null
    };
    await this.getCollection("tables").insertOne(table);
    return table;
  }
  async updateTable(id, tableData) {
    await this.ensureConnection();
    const result = await this.getCollection("tables").findOneAndUpdate(
      { id },
      { $set: tableData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async updateTableStatus(id, status) {
    await this.ensureConnection();
    const result = await this.getCollection("tables").findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async updateTableOrder(id, orderId) {
    await this.ensureConnection();
    const result = await this.getCollection("tables").findOneAndUpdate(
      { id },
      { $set: { currentOrderId: orderId } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteTable(id) {
    await this.ensureConnection();
    const result = await this.getCollection("tables").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getMenuItems() {
    await this.ensureConnection();
    const items = await this.getCollection("menuItems").find().toArray();
    return items;
  }
  async getMenuItem(id) {
    await this.ensureConnection();
    const item = await this.getCollection("menuItems").findOne({ id });
    return item ?? void 0;
  }
  async createMenuItem(insertItem) {
    await this.ensureConnection();
    const id = randomUUID2();
    const item = {
      id,
      name: insertItem.name,
      category: insertItem.category,
      price: insertItem.price,
      cost: insertItem.cost,
      available: insertItem.available ?? true,
      isVeg: insertItem.isVeg ?? true,
      variants: insertItem.variants ?? null,
      image: insertItem.image ?? null,
      description: insertItem.description ?? null,
      quickCode: insertItem.quickCode ?? null
    };
    await this.getCollection("menuItems").insertOne(item);
    return item;
  }
  async updateMenuItem(id, itemData) {
    await this.ensureConnection();
    const result = await this.getCollection("menuItems").findOneAndUpdate(
      { id },
      { $set: itemData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteMenuItem(id) {
    await this.ensureConnection();
    const result = await this.getCollection("menuItems").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getOrders() {
    await this.ensureConnection();
    const orders = await this.getCollection("orders").find().sort({ createdAt: -1 }).toArray();
    return orders;
  }
  async getOrder(id) {
    await this.ensureConnection();
    const order = await this.getCollection("orders").findOne({ id });
    return order ?? void 0;
  }
  async getOrdersByTable(tableId) {
    await this.ensureConnection();
    const orders = await this.getCollection("orders").find({ tableId }).toArray();
    return orders;
  }
  async getActiveOrders() {
    await this.ensureConnection();
    const orders = await this.getCollection("orders").find({ status: { $nin: ["completed", "cancelled"] } }).sort({ createdAt: -1 }).toArray();
    return orders;
  }
  async getCompletedOrders() {
    await this.ensureConnection();
    const orders = await this.getCollection("orders").find({ status: "completed" }).sort({ completedAt: -1 }).toArray();
    return orders;
  }
  async getDeliveryOrders() {
    await this.ensureConnection();
    const orders = await this.getCollection("orders").find({ orderType: "delivery" }).sort({ createdAt: -1 }).toArray();
    return orders;
  }
  async createOrder(insertOrder) {
    await this.ensureConnection();
    const id = randomUUID2();
    const order = {
      id,
      tableId: insertOrder.tableId ?? null,
      orderType: insertOrder.orderType,
      status: insertOrder.status ?? "saved",
      total: insertOrder.total ?? "0",
      customerName: insertOrder.customerName ?? null,
      customerPhone: insertOrder.customerPhone ?? null,
      customerAddress: insertOrder.customerAddress ?? null,
      paymentMode: insertOrder.paymentMode ?? null,
      waiterId: insertOrder.waiterId ?? null,
      deliveryPersonId: insertOrder.deliveryPersonId ?? null,
      expectedPickupTime: insertOrder.expectedPickupTime ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      completedAt: null,
      billedAt: null,
      paidAt: null
    };
    await this.getCollection("orders").insertOne(order);
    return order;
  }
  async updateOrderStatus(id, status) {
    await this.ensureConnection();
    const result = await this.getCollection("orders").findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async updateOrderTotal(id, total) {
    await this.ensureConnection();
    const result = await this.getCollection("orders").findOneAndUpdate(
      { id },
      { $set: { total } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async completeOrder(id) {
    await this.ensureConnection();
    const result = await this.getCollection("orders").findOneAndUpdate(
      { id },
      { $set: { status: "completed", completedAt: /* @__PURE__ */ new Date() } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async billOrder(id) {
    await this.ensureConnection();
    const result = await this.getCollection("orders").findOneAndUpdate(
      { id },
      { $set: { status: "billed", billedAt: /* @__PURE__ */ new Date() } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async checkoutOrder(id, paymentMode) {
    await this.ensureConnection();
    const updateData = { status: "completed", paidAt: /* @__PURE__ */ new Date(), completedAt: /* @__PURE__ */ new Date() };
    if (paymentMode) {
      updateData.paymentMode = paymentMode;
    }
    const result = await this.getCollection("orders").findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteOrder(id) {
    await this.ensureConnection();
    await this.getCollection("orderItems").deleteMany({ orderId: id });
    const result = await this.getCollection("orders").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getOrderItems(orderId) {
    await this.ensureConnection();
    const items = await this.getCollection("orderItems").find({ orderId }).toArray();
    return items;
  }
  async getOrderItem(id) {
    await this.ensureConnection();
    const item = await this.getCollection("orderItems").findOne({ id });
    return item ?? void 0;
  }
  async createOrderItem(insertItem) {
    await this.ensureConnection();
    const id = randomUUID2();
    const item = {
      id,
      orderId: insertItem.orderId,
      menuItemId: insertItem.menuItemId,
      name: insertItem.name,
      quantity: insertItem.quantity,
      price: insertItem.price,
      notes: insertItem.notes ?? null,
      status: insertItem.status ?? "new",
      isVeg: insertItem.isVeg ?? true
    };
    await this.getCollection("orderItems").insertOne(item);
    return item;
  }
  async updateOrderItemStatus(id, status) {
    await this.ensureConnection();
    const result = await this.getCollection("orderItems").findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async updateOrderItem(id, data) {
    await this.ensureConnection();
    const result = await this.getCollection("orderItems").findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteOrderItem(id) {
    await this.ensureConnection();
    const result = await this.getCollection("orderItems").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getInventoryItems() {
    await this.ensureConnection();
    const items = await this.getCollection("inventoryItems").find().toArray();
    return items;
  }
  async getInventoryItem(id) {
    await this.ensureConnection();
    const item = await this.getCollection("inventoryItems").findOne({ id });
    return item ?? void 0;
  }
  async createInventoryItem(insertItem) {
    await this.ensureConnection();
    const id = randomUUID2();
    const item = {
      id,
      name: insertItem.name,
      category: insertItem.category,
      currentStock: insertItem.currentStock,
      unit: insertItem.unit,
      minStock: insertItem.minStock ?? "0",
      supplierId: insertItem.supplierId ?? null,
      costPerUnit: insertItem.costPerUnit ?? "0",
      image: insertItem.image ?? null,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    await this.getCollection("inventoryItems").insertOne(item);
    return item;
  }
  async updateInventoryItem(id, itemData) {
    await this.ensureConnection();
    const result = await this.getCollection("inventoryItems").findOneAndUpdate(
      { id },
      { $set: { ...itemData, lastUpdated: /* @__PURE__ */ new Date() } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async updateInventoryQuantity(id, quantity) {
    await this.ensureConnection();
    const result = await this.getCollection("inventoryItems").findOneAndUpdate(
      { id },
      { $set: { currentStock: quantity, lastUpdated: /* @__PURE__ */ new Date() } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteInventoryItem(id) {
    await this.ensureConnection();
    const result = await this.getCollection("inventoryItems").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async deductInventoryForOrder(orderId) {
    await this.ensureConnection();
  }
  async getRecipes() {
    await this.ensureConnection();
    const recipes = await this.getCollection("recipes").find().toArray();
    return recipes;
  }
  async getRecipe(id) {
    await this.ensureConnection();
    const recipe = await this.getCollection("recipes").findOne({ id });
    return recipe ?? void 0;
  }
  async getRecipeByMenuItemId(menuItemId) {
    await this.ensureConnection();
    const recipe = await this.getCollection("recipes").findOne({ menuItemId });
    return recipe ?? void 0;
  }
  async createRecipe(insertRecipe) {
    await this.ensureConnection();
    const id = randomUUID2();
    const recipe = {
      id,
      menuItemId: insertRecipe.menuItemId,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("recipes").insertOne(recipe);
    return recipe;
  }
  async deleteRecipe(id) {
    await this.ensureConnection();
    await this.getCollection("recipeIngredients").deleteMany({ recipeId: id });
    const result = await this.getCollection("recipes").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getRecipeIngredients(recipeId) {
    await this.ensureConnection();
    const ingredients = await this.getCollection("recipeIngredients").find({ recipeId }).toArray();
    return ingredients;
  }
  async getRecipeIngredient(id) {
    await this.ensureConnection();
    const ingredient = await this.getCollection("recipeIngredients").findOne({ id });
    return ingredient ?? void 0;
  }
  async createRecipeIngredient(insertIngredient) {
    await this.ensureConnection();
    const id = randomUUID2();
    const ingredient = {
      id,
      recipeId: insertIngredient.recipeId,
      inventoryItemId: insertIngredient.inventoryItemId,
      quantity: insertIngredient.quantity,
      unit: insertIngredient.unit
    };
    await this.getCollection("recipeIngredients").insertOne(ingredient);
    return ingredient;
  }
  async updateRecipeIngredient(id, ingredientData) {
    await this.ensureConnection();
    const result = await this.getCollection("recipeIngredients").findOneAndUpdate(
      { id },
      { $set: ingredientData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteRecipeIngredient(id) {
    await this.ensureConnection();
    const result = await this.getCollection("recipeIngredients").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getSuppliers() {
    await this.ensureConnection();
    const suppliers = await this.getCollection("suppliers").find().toArray();
    return suppliers;
  }
  async getSupplier(id) {
    await this.ensureConnection();
    const supplier = await this.getCollection("suppliers").findOne({ id });
    return supplier ?? void 0;
  }
  async createSupplier(insertSupplier) {
    await this.ensureConnection();
    const id = randomUUID2();
    const supplier = {
      id,
      name: insertSupplier.name,
      contactPerson: insertSupplier.contactPerson ?? null,
      phone: insertSupplier.phone,
      email: insertSupplier.email ?? null,
      address: insertSupplier.address ?? null,
      status: insertSupplier.status ?? "active",
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("suppliers").insertOne(supplier);
    return supplier;
  }
  async updateSupplier(id, supplierData) {
    await this.ensureConnection();
    const result = await this.getCollection("suppliers").findOneAndUpdate(
      { id },
      { $set: supplierData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteSupplier(id) {
    await this.ensureConnection();
    const result = await this.getCollection("suppliers").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getPurchaseOrders() {
    await this.ensureConnection();
    const orders = await this.getCollection("purchaseOrders").find().sort({ createdAt: -1 }).toArray();
    return orders;
  }
  async getPurchaseOrder(id) {
    await this.ensureConnection();
    const order = await this.getCollection("purchaseOrders").findOne({ id });
    return order ?? void 0;
  }
  async createPurchaseOrder(insertOrder) {
    await this.ensureConnection();
    const id = randomUUID2();
    const order = {
      id,
      orderNumber: insertOrder.orderNumber,
      supplierId: insertOrder.supplierId,
      orderDate: insertOrder.orderDate,
      expectedDeliveryDate: insertOrder.expectedDeliveryDate ?? null,
      actualDeliveryDate: null,
      status: insertOrder.status ?? "pending",
      totalAmount: insertOrder.totalAmount ?? "0",
      notes: insertOrder.notes ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("purchaseOrders").insertOne(order);
    return order;
  }
  async updatePurchaseOrder(id, orderData) {
    await this.ensureConnection();
    const result = await this.getCollection("purchaseOrders").findOneAndUpdate(
      { id },
      { $set: orderData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async receivePurchaseOrder(id) {
    await this.ensureConnection();
    const result = await this.getCollection("purchaseOrders").findOneAndUpdate(
      { id },
      { $set: { status: "received", actualDeliveryDate: /* @__PURE__ */ new Date() } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deletePurchaseOrder(id) {
    await this.ensureConnection();
    await this.getCollection("purchaseOrderItems").deleteMany({ purchaseOrderId: id });
    const result = await this.getCollection("purchaseOrders").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getPurchaseOrderItems(purchaseOrderId) {
    await this.ensureConnection();
    const items = await this.getCollection("purchaseOrderItems").find({ purchaseOrderId }).toArray();
    return items;
  }
  async getPurchaseOrderItem(id) {
    await this.ensureConnection();
    const item = await this.getCollection("purchaseOrderItems").findOne({ id });
    return item ?? void 0;
  }
  async createPurchaseOrderItem(insertItem) {
    await this.ensureConnection();
    const id = randomUUID2();
    const item = {
      id,
      purchaseOrderId: insertItem.purchaseOrderId,
      inventoryItemId: insertItem.inventoryItemId,
      quantity: insertItem.quantity,
      unit: insertItem.unit,
      costPerUnit: insertItem.costPerUnit,
      totalCost: insertItem.totalCost
    };
    await this.getCollection("purchaseOrderItems").insertOne(item);
    return item;
  }
  async updatePurchaseOrderItem(id, itemData) {
    await this.ensureConnection();
    const result = await this.getCollection("purchaseOrderItems").findOneAndUpdate(
      { id },
      { $set: itemData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deletePurchaseOrderItem(id) {
    await this.ensureConnection();
    const result = await this.getCollection("purchaseOrderItems").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getWastages() {
    await this.ensureConnection();
    const wastages = await this.getCollection("wastages").find().sort({ createdAt: -1 }).toArray();
    return wastages;
  }
  async getWastage(id) {
    await this.ensureConnection();
    const wastage = await this.getCollection("wastages").findOne({ id });
    return wastage ?? void 0;
  }
  async createWastage(insertWastage) {
    await this.ensureConnection();
    const id = randomUUID2();
    const wastage = {
      id,
      inventoryItemId: insertWastage.inventoryItemId,
      quantity: insertWastage.quantity,
      unit: insertWastage.unit,
      reason: insertWastage.reason,
      reportedBy: insertWastage.reportedBy ?? null,
      notes: insertWastage.notes ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("wastages").insertOne(wastage);
    return wastage;
  }
  async deleteWastage(id) {
    await this.ensureConnection();
    const result = await this.getCollection("wastages").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getInvoices() {
    await this.ensureConnection();
    const invoices = await this.getCollection("invoices").find().sort({ createdAt: -1 }).toArray();
    return invoices;
  }
  async getInvoice(id) {
    await this.ensureConnection();
    const invoice = await this.getCollection("invoices").findOne({ id });
    return invoice ?? void 0;
  }
  async getInvoiceByNumber(invoiceNumber) {
    await this.ensureConnection();
    const invoice = await this.getCollection("invoices").findOne({ invoiceNumber });
    return invoice ?? void 0;
  }
  async createInvoice(insertInvoice) {
    await this.ensureConnection();
    const id = randomUUID2();
    const invoice = {
      id,
      invoiceNumber: insertInvoice.invoiceNumber,
      orderId: insertInvoice.orderId,
      tableNumber: insertInvoice.tableNumber ?? null,
      floorName: insertInvoice.floorName ?? null,
      customerName: insertInvoice.customerName ?? null,
      customerPhone: insertInvoice.customerPhone ?? null,
      subtotal: insertInvoice.subtotal,
      tax: insertInvoice.tax,
      discount: insertInvoice.discount ?? "0",
      total: insertInvoice.total,
      paymentMode: insertInvoice.paymentMode,
      splitPayments: insertInvoice.splitPayments ?? null,
      status: insertInvoice.status ?? "Paid",
      items: insertInvoice.items,
      notes: insertInvoice.notes ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("invoices").insertOne(invoice);
    return invoice;
  }
  async updateInvoice(id, invoiceData) {
    await this.ensureConnection();
    const result = await this.getCollection("invoices").findOneAndUpdate(
      { id },
      { $set: { ...invoiceData, updatedAt: /* @__PURE__ */ new Date() } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteInvoice(id) {
    await this.ensureConnection();
    const result = await this.getCollection("invoices").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getReservations() {
    await this.ensureConnection();
    const reservations = await this.getCollection("reservations").find().sort({ timeSlot: 1 }).toArray();
    return reservations;
  }
  async getReservation(id) {
    await this.ensureConnection();
    const reservation = await this.getCollection("reservations").findOne({ id });
    return reservation ?? void 0;
  }
  async getReservationsByTable(tableId) {
    await this.ensureConnection();
    const reservations = await this.getCollection("reservations").find({ tableId }).toArray();
    return reservations;
  }
  async createReservation(insertReservation) {
    await this.ensureConnection();
    const id = randomUUID2();
    const reservation = {
      id,
      tableId: insertReservation.tableId,
      customerName: insertReservation.customerName,
      customerPhone: insertReservation.customerPhone,
      numberOfPeople: insertReservation.numberOfPeople,
      timeSlot: insertReservation.timeSlot,
      notes: insertReservation.notes ?? null,
      status: insertReservation.status ?? "active",
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("reservations").insertOne(reservation);
    return reservation;
  }
  async updateReservation(id, reservationData) {
    await this.ensureConnection();
    const result = await this.getCollection("reservations").findOneAndUpdate(
      { id },
      { $set: reservationData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteReservation(id) {
    await this.ensureConnection();
    const result = await this.getCollection("reservations").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getCustomers() {
    await this.ensureConnection();
    const customers = await this.getCollection("customers").find().toArray();
    return customers;
  }
  async getCustomer(id) {
    await this.ensureConnection();
    const customer = await this.getCollection("customers").findOne({ id });
    return customer ?? void 0;
  }
  async getCustomerByPhone(phone) {
    await this.ensureConnection();
    const customer = await this.getCollection("customers").findOne({ phone });
    return customer ?? void 0;
  }
  async createCustomer(insertCustomer) {
    await this.ensureConnection();
    const id = randomUUID2();
    const customer = {
      id,
      name: insertCustomer.name,
      phone: insertCustomer.phone,
      email: insertCustomer.email ?? null,
      address: insertCustomer.address ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("customers").insertOne(customer);
    return customer;
  }
  async updateCustomer(id, customerData) {
    await this.ensureConnection();
    const result = await this.getCollection("customers").findOneAndUpdate(
      { id },
      { $set: customerData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteCustomer(id) {
    await this.ensureConnection();
    const result = await this.getCollection("customers").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getFeedbacks() {
    await this.ensureConnection();
    const feedbacks = await this.getCollection("feedbacks").find().sort({ createdAt: -1 }).toArray();
    return feedbacks;
  }
  async getFeedback(id) {
    await this.ensureConnection();
    const feedback = await this.getCollection("feedbacks").findOne({ id });
    return feedback ?? void 0;
  }
  async createFeedback(insertFeedback) {
    await this.ensureConnection();
    const id = randomUUID2();
    const feedback = {
      id,
      customerId: insertFeedback.customerId ?? null,
      customerName: insertFeedback.customerName,
      rating: insertFeedback.rating,
      comment: insertFeedback.comment,
      sentiment: insertFeedback.sentiment ?? "Neutral",
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("feedbacks").insertOne(feedback);
    return feedback;
  }
  async deleteFeedback(id) {
    await this.ensureConnection();
    const result = await this.getCollection("feedbacks").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async getSetting(key) {
    await this.ensureConnection();
    const setting = await this.getCollection("settings").findOne({ key });
    return setting?.value;
  }
  async setSetting(key, value) {
    await this.ensureConnection();
    await this.getCollection("settings").updateOne(
      { key },
      { $set: { key, value } },
      { upsert: true }
    );
  }
  async getInventoryUsages() {
    await this.ensureConnection();
    const usages = await this.getCollection("inventoryUsages").find().sort({ createdAt: -1 }).toArray();
    return usages;
  }
  async getInventoryUsagesByItem(inventoryItemId) {
    await this.ensureConnection();
    const usages = await this.getCollection("inventoryUsages").find({ inventoryItemId }).sort({ createdAt: -1 }).toArray();
    return usages;
  }
  async createInventoryUsage(insertUsage) {
    await this.ensureConnection();
    const id = randomUUID2();
    const usage = {
      id,
      inventoryItemId: insertUsage.inventoryItemId,
      itemName: insertUsage.itemName,
      quantity: insertUsage.quantity,
      unit: insertUsage.unit,
      usedAt: /* @__PURE__ */ new Date(),
      source: insertUsage.source ?? "manual",
      notes: insertUsage.notes ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("inventoryUsages").insertOne(usage);
    return usage;
  }
  async getMostUsedItems(limit = 10) {
    await this.ensureConnection();
    const result = await this.getCollection("inventoryUsages").aggregate([
      {
        $group: {
          _id: "$inventoryItemId",
          itemName: { $first: "$itemName" },
          totalQuantity: { $sum: { $toDouble: "$quantity" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          itemId: "$_id",
          itemName: 1,
          totalQuantity: { $toString: "$totalQuantity" },
          count: 1
        }
      }
    ]).toArray();
    return result;
  }
  async getDeliveryPersons() {
    await this.ensureConnection();
    const persons = await this.getCollection("deliveryPersons").find().toArray();
    return persons;
  }
  async getDeliveryPerson(id) {
    await this.ensureConnection();
    const person = await this.getCollection("deliveryPersons").findOne({ id });
    return person ?? void 0;
  }
  async createDeliveryPerson(insertPerson) {
    await this.ensureConnection();
    const id = randomUUID2();
    const person = {
      id,
      name: insertPerson.name,
      phone: insertPerson.phone,
      status: insertPerson.status ?? "available",
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.getCollection("deliveryPersons").insertOne(person);
    return person;
  }
  async updateDeliveryPerson(id, personData) {
    await this.ensureConnection();
    const result = await this.getCollection("deliveryPersons").findOneAndUpdate(
      { id },
      { $set: personData },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
  async deleteDeliveryPerson(id) {
    await this.ensureConnection();
    const result = await this.getCollection("deliveryPersons").deleteOne({ id });
    return result.deletedCount > 0;
  }
  async assignDeliveryPerson(orderId, deliveryPersonId) {
    await this.ensureConnection();
    const result = await this.getCollection("orders").findOneAndUpdate(
      { id: orderId },
      { $set: { deliveryPersonId } },
      { returnDocument: "after" }
    );
    return result ?? void 0;
  }
};

// server/auth-middleware.ts
var storageCache = /* @__PURE__ */ new Map();
function getStorageForSession(req) {
  if (!req.session?.isAuthenticated || !req.session.restaurantId || !req.session.mongodbUri) {
    return null;
  }
  const cacheKey = req.session.restaurantId;
  let storage2 = storageCache.get(cacheKey);
  if (!storage2) {
    storage2 = new SessionStorage(req.session.restaurantId, req.session.mongodbUri);
    storageCache.set(cacheKey, storage2);
  }
  return storage2;
}
function requireAuth(req, res, next) {
  if (!req.session?.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated", code: "UNAUTHORIZED" });
  }
  next();
}
function setupAuthRoutes(app2) {
  app2.use(session({
    secret: process.env.SESSION_SECRET || (() => {
      throw new Error("SESSION_SECRET environment variable is required");
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1e3
    }
  }));
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid credentials format" });
      }
      const { username, password } = result.data;
      const account = validateCredentials(username, password);
      if (!account) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      if (!account.mongodbUri) {
        return res.status(500).json({ error: "Restaurant database not configured" });
      }
      const storage2 = new SessionStorage(account.id, account.mongodbUri);
      try {
        await storage2.getFloors();
      } catch (error) {
        console.error("MongoDB connection test failed:", error);
        return res.status(500).json({ error: "Database connection failed", code: "DB_ERROR" });
      }
      req.session.restaurantId = account.id;
      req.session.restaurantName = account.name;
      req.session.mongodbUri = account.mongodbUri;
      req.session.username = account.username;
      req.session.isAuthenticated = true;
      storageCache.set(account.id, storage2);
      res.json({
        success: true,
        restaurant: {
          id: account.id,
          name: account.name,
          username: account.username
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    const restaurantId = req.session?.restaurantId;
    if (restaurantId) {
      storageCache.delete(restaurantId);
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/session", (req, res) => {
    if (req.session?.isAuthenticated) {
      res.json({
        isAuthenticated: true,
        restaurant: {
          id: req.session.restaurantId,
          name: req.session.restaurantName,
          username: req.session.username
        }
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });
}

// shared/schema.ts
import { z as z2 } from "zod";
var insertUserSchema = z2.object({
  username: z2.string(),
  password: z2.string()
});
var insertFloorSchema = z2.object({
  name: z2.string(),
  displayOrder: z2.number().default(0)
});
var insertTableSchema = z2.object({
  tableNumber: z2.string(),
  seats: z2.number(),
  status: z2.string().default("free"),
  floorId: z2.string().nullable().optional()
});
var insertMenuItemSchema = z2.object({
  name: z2.string(),
  category: z2.string(),
  price: z2.string(),
  cost: z2.string(),
  available: z2.boolean().default(true),
  isVeg: z2.boolean().default(true),
  variants: z2.array(z2.string()).nullable().optional(),
  image: z2.string().nullable().optional(),
  description: z2.string().nullable().optional(),
  quickCode: z2.string().nullable().optional()
});
var insertOrderSchema = z2.object({
  tableId: z2.string().nullable().optional(),
  orderType: z2.string(),
  status: z2.string().default("saved"),
  total: z2.string().default("0"),
  customerName: z2.string().nullable().optional(),
  customerPhone: z2.string().nullable().optional(),
  customerAddress: z2.string().nullable().optional(),
  paymentMode: z2.string().nullable().optional(),
  waiterId: z2.string().nullable().optional(),
  deliveryPersonId: z2.string().nullable().optional(),
  expectedPickupTime: z2.coerce.date().nullable().optional()
});
var insertOrderItemSchema = z2.object({
  orderId: z2.string(),
  menuItemId: z2.string(),
  name: z2.string(),
  quantity: z2.number(),
  price: z2.string(),
  notes: z2.string().nullable().optional(),
  status: z2.string().default("new"),
  isVeg: z2.boolean().default(true)
});
var insertInventoryItemSchema = z2.object({
  name: z2.string(),
  category: z2.string(),
  currentStock: z2.string(),
  unit: z2.string(),
  minStock: z2.string().default("0"),
  supplierId: z2.string().nullable().optional(),
  costPerUnit: z2.string().default("0"),
  image: z2.string().nullable().optional()
});
var insertRecipeSchema = z2.object({
  menuItemId: z2.string()
});
var insertRecipeIngredientSchema = z2.object({
  recipeId: z2.string(),
  inventoryItemId: z2.string(),
  quantity: z2.string(),
  unit: z2.string()
});
var insertSupplierSchema = z2.object({
  name: z2.string(),
  contactPerson: z2.string().nullable().optional(),
  phone: z2.string(),
  email: z2.string().nullable().optional(),
  address: z2.string().nullable().optional(),
  status: z2.string().default("active")
});
var insertPurchaseOrderSchema = z2.object({
  orderNumber: z2.string(),
  supplierId: z2.string(),
  orderDate: z2.coerce.date(),
  expectedDeliveryDate: z2.coerce.date().nullable().optional(),
  status: z2.string().default("pending"),
  totalAmount: z2.string().default("0"),
  notes: z2.string().nullable().optional()
});
var insertPurchaseOrderItemSchema = z2.object({
  purchaseOrderId: z2.string(),
  inventoryItemId: z2.string(),
  quantity: z2.string(),
  unit: z2.string(),
  costPerUnit: z2.string(),
  totalCost: z2.string()
});
var insertWastageSchema = z2.object({
  inventoryItemId: z2.string(),
  quantity: z2.string(),
  unit: z2.string(),
  reason: z2.string(),
  reportedBy: z2.string().nullable().optional(),
  notes: z2.string().nullable().optional()
});
var insertInvoiceSchema = z2.object({
  invoiceNumber: z2.string(),
  orderId: z2.string(),
  tableNumber: z2.string().nullable().optional(),
  floorName: z2.string().nullable().optional(),
  customerName: z2.string().nullable().optional(),
  customerPhone: z2.string().nullable().optional(),
  subtotal: z2.string(),
  tax: z2.string(),
  discount: z2.string().default("0"),
  total: z2.string(),
  paymentMode: z2.string(),
  splitPayments: z2.string().nullable().optional(),
  status: z2.string().default("Paid"),
  items: z2.string(),
  notes: z2.string().nullable().optional()
});
var insertReservationSchema = z2.object({
  tableId: z2.string(),
  customerName: z2.string(),
  customerPhone: z2.string(),
  numberOfPeople: z2.number(),
  timeSlot: z2.coerce.date(),
  notes: z2.string().nullable().optional(),
  status: z2.string().default("active")
});
var insertCustomerSchema = z2.object({
  name: z2.string(),
  phone: z2.string(),
  email: z2.string().nullable().optional(),
  address: z2.string().nullable().optional()
});
var insertFeedbackSchema = z2.object({
  customerId: z2.string().nullable().optional(),
  customerName: z2.string(),
  rating: z2.number().min(1).max(5),
  comment: z2.string(),
  sentiment: z2.enum(["Positive", "Neutral", "Negative"]).default("Neutral")
});
var insertInventoryUsageSchema = z2.object({
  inventoryItemId: z2.string(),
  itemName: z2.string(),
  quantity: z2.string(),
  unit: z2.string(),
  source: z2.string().default("manual"),
  notes: z2.string().nullable().optional()
});
var insertDeliveryPersonSchema = z2.object({
  name: z2.string(),
  phone: z2.string(),
  status: z2.string().default("available")
});

// server/routes.ts
import { z as z3 } from "zod";

// server/mongodbService.ts
import { MongoClient as MongoClient2 } from "mongodb";
async function fetchMenuItemsFromMongoDB(mongoUri, databaseName) {
  let client = null;
  try {
    let dbName;
    if (databaseName) {
      dbName = databaseName;
    } else {
      dbName = extractDatabaseName(mongoUri);
    }
    client = new MongoClient2(mongoUri);
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const allItems = [];
    const categorySet = /* @__PURE__ */ new Set();
    for (const collection of collections) {
      const collectionName = collection.name;
      if (collectionName === "system.indexes" || collectionName.startsWith("system.")) {
        continue;
      }
      const coll = db.collection(collectionName);
      const items = await coll.find({}).toArray();
      for (const item of items) {
        const category = item.category || collectionName;
        categorySet.add(category);
        const menuItem = {
          name: item.name,
          category,
          price: item.price?.toString() || "0",
          cost: item.price ? (item.price * 0.4).toFixed(2) : "0",
          available: item.isAvailable !== void 0 ? item.isAvailable : true,
          isVeg: item.isVeg !== void 0 ? item.isVeg : true,
          variants: null,
          image: item.image || null,
          description: item.description || null
        };
        allItems.push(menuItem);
      }
    }
    return {
      items: allItems,
      categories: Array.from(categorySet).sort()
    };
  } catch (error) {
    console.error("Error fetching from MongoDB:", error);
    throw new Error(`Failed to fetch menu items from MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (client) {
      await client.close();
    }
  }
}
function extractDatabaseName(mongoUri) {
  const appNameMatch = mongoUri.match(/appName=([^&]+)/i);
  if (appNameMatch && appNameMatch[1]) {
    return appNameMatch[1].toLowerCase();
  }
  const pathMatch = mongoUri.match(/mongodb(?:\+srv)?:\/\/[^\/]+\/([^?&]+)/);
  if (pathMatch && pathMatch[1] && pathMatch[1] !== "") {
    return pathMatch[1];
  }
  return "test";
}

// server/utils/invoiceGenerator.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
function generateInvoicePDF(data) {
  const { invoice, order, orderItems, restaurantName = "Restaurant POS", restaurantAddress = "", restaurantPhone = "", restaurantGSTIN = "" } = data;
  if (!invoice || !order || !orderItems) {
    throw new Error("Missing required data for PDF generation");
  }
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(restaurantName, pageWidth / 2, yPosition, { align: "center" });
  if (restaurantAddress) {
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(restaurantAddress, pageWidth / 2, yPosition, { align: "center" });
  }
  if (restaurantPhone) {
    yPosition += 5;
    doc.text(`Phone: ${restaurantPhone}`, pageWidth / 2, yPosition, { align: "center" });
  }
  if (restaurantGSTIN) {
    yPosition += 5;
    doc.text(`GSTIN: ${restaurantGSTIN}`, pageWidth / 2, yPosition, { align: "center" });
  }
  yPosition += 10;
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  if (order.orderType === "delivery") {
    doc.text("DELIVERY INVOICE", pageWidth / 2, yPosition, { align: "center" });
  } else if (order.orderType === "pickup") {
    doc.text("PICKUP INVOICE", pageWidth / 2, yPosition, { align: "center" });
  } else {
    doc.text("DINE-IN INVOICE", pageWidth / 2, yPosition, { align: "center" });
  }
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const invoiceDate = invoice.createdAt instanceof Date ? invoice.createdAt : new Date(invoice.createdAt || Date.now());
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 15, yPosition);
  doc.text(`Date: ${invoiceDate.toLocaleString()}`, pageWidth - 15, yPosition, { align: "right" });
  yPosition += 7;
  if (order.orderType === "dine-in" && invoice.tableNumber) {
    doc.text(`Table: ${invoice.tableNumber}`, 15, yPosition);
    if (invoice.floorName) {
      doc.text(`Floor: ${invoice.floorName}`, 60, yPosition);
    }
  } else if ((order.orderType === "delivery" || order.orderType === "pickup") && invoice.customerName) {
    doc.text(`Customer: ${invoice.customerName}`, 15, yPosition);
    if (invoice.customerPhone) {
      doc.text(`Phone: ${invoice.customerPhone}`, pageWidth - 15, yPosition, { align: "right" });
    }
    if (order.orderType === "delivery" && order.customerAddress) {
      yPosition += 7;
      doc.text(`Address: ${order.customerAddress}`, 15, yPosition);
    }
  }
  yPosition += 10;
  const tableData = orderItems.map((item) => [
    item.name + (item.isVeg ? " \u{1F331}" : ""),
    item.quantity.toString(),
    `\u20B9${parseFloat(item.price).toFixed(2)}`,
    `\u20B9${(parseFloat(item.price) * item.quantity).toFixed(2)}`
  ]);
  autoTable(doc, {
    startY: yPosition,
    head: [["Item", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 35, halign: "right" }
    }
  });
  yPosition = doc.lastAutoTable.finalY + 10;
  const subtotal = parseFloat(invoice.subtotal);
  const tax = parseFloat(invoice.tax);
  const discount = parseFloat(invoice.discount || "0");
  const total = parseFloat(invoice.total);
  doc.setFontSize(11);
  const summaryX = pageWidth - 70;
  doc.text("Subtotal:", summaryX, yPosition);
  doc.text(`\u20B9${subtotal.toFixed(2)}`, pageWidth - 15, yPosition, { align: "right" });
  yPosition += 7;
  doc.text("Tax (5%):", summaryX, yPosition);
  doc.text(`\u20B9${tax.toFixed(2)}`, pageWidth - 15, yPosition, { align: "right" });
  if (discount > 0) {
    yPosition += 7;
    doc.text("Discount:", summaryX, yPosition);
    doc.text(`-\u20B9${discount.toFixed(2)}`, pageWidth - 15, yPosition, { align: "right" });
  }
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Grand Total:", summaryX, yPosition);
  doc.text(`\u20B9${total.toFixed(2)}`, pageWidth - 15, yPosition, { align: "right" });
  yPosition += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const paymentText = invoice.splitPayments ? `Split Payment (${JSON.parse(invoice.splitPayments).length} ways)` : `Payment Mode: ${invoice.paymentMode?.toUpperCase() || "CASH"}`;
  doc.text(paymentText, summaryX, yPosition);
  doc.text("PAID", pageWidth - 15, yPosition, { align: "right" });
  if (order.orderType === "delivery") {
    yPosition += 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("This is a delivery order. Please ensure items are delivered to the customer address.", 15, yPosition);
  } else if (order.orderType === "pickup") {
    yPosition += 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("This is a pickup order. Customer will collect the items from the restaurant.", 15, yPosition);
  }
  yPosition = doc.internal.pageSize.getHeight() - 30;
  doc.setLineWidth(0.3);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;
  doc.setFontSize(8);
  doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, yPosition, { align: "center" });
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

// server/utils/kotGenerator.ts
import { jsPDF as jsPDF2 } from "jspdf";
import { format } from "date-fns";
var C = {
  white: [255, 255, 255],
  headerBg: [17, 24, 39],
  // gray-900
  headerText: [255, 255, 255],
  labelBg: [249, 250, 251],
  // gray-50
  border: [229, 231, 235],
  // gray-200
  labelText: [107, 114, 128],
  // gray-500
  valueText: [17, 24, 39],
  // gray-900
  footerBg: [249, 250, 251],
  statusNew: [217, 119, 6],
  // amber-600
  statusDone: [75, 85, 99],
  // gray-600
  vegGreen: [22, 163, 74],
  nonVegRed: [220, 38, 38]
};
function generateKOTPDF(data) {
  const {
    order,
    orderItems,
    tableNumber,
    floorName,
    kotNumber = `KOT-${order.id.substring(0, 8).toUpperCase()}`,
    restaurantName = "Restaurant POS"
  } = data;
  const doc = new jsPDF2({ unit: "mm", format: "a5" });
  const PW = doc.internal.pageSize.getWidth();
  const margin = 12;
  const inner = PW - margin * 2;
  let y = margin;
  const rect = (x, ry, w, h, fill, stroke) => {
    doc.setFillColor(...fill);
    if (stroke) {
      doc.setDrawColor(...stroke);
      doc.setLineWidth(0.3);
      doc.rect(x, ry, w, h, "FD");
    } else {
      doc.rect(x, ry, w, h, "F");
    }
  };
  const hline = (ry) => {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(margin, ry, margin + inner, ry);
  };
  const txt = (s, x, ry, size, style, color = C.valueText, align = "left") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    doc.text(s, x, ry, { align });
  };
  y += 4;
  txt(restaurantName.toUpperCase(), PW / 2, y, 13, "bold", C.headerBg, "center");
  y += 6;
  txt("Kitchen Order Ticket", PW / 2, y, 8, "normal", C.labelText, "center");
  y += 5;
  hline(y);
  y += 6;
  const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || Date.now());
  const typeLabel = order.orderType === "dine-in" ? "Dine-In" : order.orderType === "delivery" ? "Delivery" : "Pickup";
  const statusLabel = order.status === "completed" ? "Completed" : order.status === "sent_to_kitchen" ? "New" : order.status === "preparing" ? "Preparing" : order.status === "ready" ? "Ready" : order.status === "served" ? "Served" : order.status;
  const metaRows = [
    ["KOT No", kotNumber],
    ["Order Date", format(orderDate, "dd/MM/yyyy, hh:mm a")],
    ["Type", typeLabel]
  ];
  if (order.orderType === "dine-in" && tableNumber) {
    metaRows.push(["Table", tableNumber]);
    if (floorName) metaRows.push(["Floor", floorName]);
  }
  if (order.customerName) metaRows.push(["Customer", order.customerName]);
  if (order.customerPhone) metaRows.push(["Phone", order.customerPhone]);
  metaRows.push(["Status", statusLabel]);
  const rowH = 7;
  const labelW = 35;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, inner, rowH * metaRows.length, "S");
  metaRows.forEach(([label, value], idx) => {
    const ry = y + idx * rowH;
    rect(margin, ry, labelW, rowH, C.labelBg, C.border);
    txt(label, margin + 2, ry + rowH * 0.65, 7.5, "normal", C.labelText);
    rect(margin + labelW, ry, inner - labelW, rowH, C.white);
    if (label === "Status") {
      const pillColor = ["New", "Preparing"].includes(value) ? C.statusNew : C.statusDone;
      txt(value, margin + inner - 2, ry + rowH * 0.65, 7.5, "bold", pillColor, "right");
    } else {
      txt(value, margin + inner - 2, ry + rowH * 0.65, 7.5, "normal", C.valueText, "right");
    }
    if (idx < metaRows.length - 1) hline(ry + rowH);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(margin + labelW, ry, margin + labelW, ry + rowH);
  });
  y += rowH * metaRows.length + 7;
  const colW = { num: 8, item: inner - 8 - 14, qty: 14 };
  const headerH = 8;
  rect(margin, y, colW.num, headerH, C.headerBg, C.border);
  rect(margin + colW.num, y, colW.item, headerH, C.headerBg, C.border);
  rect(margin + colW.num + colW.item, y, colW.qty, headerH, C.headerBg, C.border);
  txt("#", margin + colW.num / 2, y + headerH * 0.68, 8, "bold", C.headerText, "center");
  txt("Item", margin + colW.num + colW.item / 2, y + headerH * 0.68, 8, "bold", C.headerText, "center");
  txt("Qty", margin + colW.num + colW.item + colW.qty / 2, y + headerH * 0.68, 8, "bold", C.headerText, "center");
  y += headerH;
  orderItems.forEach((item, idx) => {
    const hasNotes = !!(item.notes && item.notes.trim());
    const itemH = hasNotes ? 10 : 7.5;
    rect(margin, y, colW.num, itemH, C.white, C.border);
    rect(margin + colW.num, y, colW.item, itemH, C.white, C.border);
    rect(margin + colW.num + colW.item, y, colW.qty, itemH, C.white, C.border);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(margin + colW.num, y, margin + colW.num, y + itemH);
    doc.line(margin + colW.num + colW.item, y, margin + colW.num + colW.item, y + itemH);
    txt(String(idx + 1), margin + colW.num / 2, y + itemH * 0.6, 7.5, "normal", C.labelText, "center");
    const dotX = margin + colW.num + 2;
    const dotY = y + (hasNotes ? 3.5 : itemH / 2);
    doc.setFillColor(...item.isVeg ? C.vegGreen : C.nonVegRed);
    doc.setDrawColor(...item.isVeg ? C.vegGreen : C.nonVegRed);
    doc.rect(dotX, dotY - 1.2, 2.2, 2.2, "FD");
    const nameX = dotX + 3.5;
    const nameY = hasNotes ? y + 3.8 : y + itemH * 0.62;
    const maxW = colW.item - 7;
    const lines = doc.splitTextToSize(item.name, maxW);
    txt(lines[0], nameX, nameY, 7.5, "normal", C.valueText);
    if (hasNotes) {
      txt(item.notes, nameX, y + 7.5, 6.5, "italic", C.labelText);
    }
    txt(
      String(item.quantity),
      margin + colW.num + colW.item + colW.qty / 2,
      y + itemH * 0.62,
      8,
      "bold",
      C.valueText,
      "center"
    );
    hline(y + itemH);
    y += itemH;
  });
  const footH = 7.5;
  rect(margin, y, inner, footH, C.labelBg, C.border);
  const totalQty = orderItems.reduce((s, i) => s + i.quantity, 0);
  txt("Total Items :", margin + 2, y + footH * 0.68, 7.5, "bold", C.labelText);
  txt(String(totalQty), margin + inner - 2, y + footH * 0.68, 8, "bold", C.valueText, "right");
  y += footH;
  const totalAmt = orderItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  if (totalAmt > 0) {
    const amtH = 7.5;
    rect(margin, y, inner, amtH, C.white, C.border);
    txt("Total Amount :", margin + 2, y + amtH * 0.68, 7.5, "bold", C.labelText);
    txt(`Rs. ${totalAmt.toFixed(2)}`, margin + inner - 2, y + amtH * 0.68, 8, "bold", C.valueText, "right");
    y += amtH;
  }
  y += 8;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(margin, y, margin + inner, y);
  y += 4;
  txt(
    `Printed: ${format(/* @__PURE__ */ new Date(), "dd/MM/yyyy, hh:mm a")}`,
    PW / 2,
    y,
    6.5,
    "italic",
    C.labelText,
    "center"
  );
  return Buffer.from(doc.output("arraybuffer"));
}

// server/mongodb.ts
import { MongoClient as MongoClient3 } from "mongodb";
var MongoDBService = class {
  client = null;
  db = null;
  async connect() {
    if (this.client && this.db) {
      return;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    try {
      this.client = new MongoClient3(uri);
      await this.client.connect();
      const dbName = this.extractDatabaseName(uri);
      this.db = this.client.db(dbName);
      console.log(`\u2705 Connected to MongoDB database: ${dbName}`);
    } catch (error) {
      console.error("\u274C MongoDB connection error:", error);
      throw error;
    }
  }
  extractDatabaseName(uri) {
    try {
      const url = new URL(uri);
      const pathname = url.pathname.substring(1);
      if (pathname && pathname !== "") {
        return pathname.split("?")[0];
      }
      return "restaurant_pos";
    } catch (error) {
      return "restaurant_pos";
    }
  }
  getDatabase() {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }
  getCollection(name) {
    return this.getDatabase().collection(name);
  }
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("Disconnected from MongoDB");
    }
  }
};
var mongodb = new MongoDBService();

// server/digital-menu-sync.ts
import { ObjectId } from "mongodb";
var DigitalMenuSyncService = class {
  storage;
  syncInterval = null;
  processedOrderIds = /* @__PURE__ */ new Set();
  orderStatusMap = /* @__PURE__ */ new Map();
  orderPaymentStatusMap = /* @__PURE__ */ new Map();
  isRunning = false;
  broadcastFn = null;
  constructor(storage2) {
    this.storage = storage2;
  }
  setBroadcastFunction(fn) {
    this.broadcastFn = fn;
  }
  async start(intervalMs = 5e3) {
    if (this.isRunning) {
      console.log("\u26A0\uFE0F  Digital menu sync service is already running");
      return;
    }
    this.isRunning = true;
    console.log("\u{1F504} Starting digital menu sync service...");
    await this.loadSyncState();
    await this.syncOrders();
    this.syncInterval = setInterval(async () => {
      await this.syncOrders();
    }, intervalMs);
    console.log(`\u2705 Digital menu sync service started (polling every ${intervalMs / 1e3}s)`);
  }
  async loadSyncState() {
    try {
      await mongodb.connect();
      const collection = mongodb.getCollection("digital_menu_customer_orders");
      const customerDocs = await collection.find({
        "orders": { $exists: true, $ne: [] }
      }).toArray();
      let syncedCount = 0;
      for (const customerDoc of customerDocs) {
        if (!customerDoc.orders || !Array.isArray(customerDoc.orders)) continue;
        for (const order of customerDoc.orders) {
          if (order.syncedToPOS === true) {
            const orderId = order._id?.toString() || `${customerDoc._id.toString()}_${order.orderDate}`;
            this.processedOrderIds.add(orderId);
            this.orderStatusMap.set(orderId, order.status);
            this.orderPaymentStatusMap.set(orderId, order.paymentStatus || "pending");
            syncedCount++;
          }
        }
      }
      console.log(`\u{1F4CA} Loaded ${syncedCount} synced orders from MongoDB`);
    } catch (error) {
      console.error("\u274C Error loading sync state:", error);
    }
  }
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log("\u{1F6D1} Digital menu sync service stopped");
    }
  }
  async syncOrders() {
    try {
      await mongodb.connect();
      const collection = mongodb.getCollection("digital_menu_customer_orders");
      const customerDocs = await collection.find({
        "orders": { $exists: true, $ne: [] }
      }).toArray();
      let synced = 0;
      for (const customerDoc of customerDocs) {
        if (!customerDoc.orders || !Array.isArray(customerDoc.orders)) continue;
        for (const digitalOrder of customerDoc.orders) {
          if (digitalOrder.syncedToPOS === true) continue;
          if (digitalOrder.status !== "pending" && digitalOrder.status !== "confirmed") continue;
          const orderId = digitalOrder._id?.toString() || `${customerDoc._id.toString()}_${digitalOrder.orderDate}`;
          if (this.processedOrderIds.has(orderId)) continue;
          try {
            this.processedOrderIds.add(orderId);
            this.orderStatusMap.set(orderId, digitalOrder.status);
            this.orderPaymentStatusMap.set(orderId, digitalOrder.paymentStatus || "pending");
            const orderWithCustomer = {
              ...digitalOrder,
              _id: digitalOrder._id || orderId,
              customerId: customerDoc.customerId,
              customerName: customerDoc.customerName,
              customerPhone: customerDoc.customerPhone
            };
            const posOrderId = await this.convertAndCreatePOSOrder(orderWithCustomer);
            synced++;
            console.log(`\u2705 Synced digital menu order ${orderId} for ${customerDoc.customerName}`);
            await collection.updateOne(
              {
                _id: customerDoc._id,
                "orders._id": digitalOrder._id
              },
              {
                $set: {
                  "orders.$.syncedToPOS": true,
                  "orders.$.syncedAt": /* @__PURE__ */ new Date(),
                  "orders.$.posOrderId": posOrderId
                }
              }
            );
            if (this.broadcastFn) {
              this.broadcastFn("digital_menu_order_synced", {
                orderId,
                customerName: customerDoc.customerName,
                status: digitalOrder.status
              });
            }
          } catch (error) {
            console.error(`\u274C Failed to sync order ${orderId}:`, error);
            this.processedOrderIds.delete(orderId);
            this.orderStatusMap.delete(orderId);
            this.orderPaymentStatusMap.delete(orderId);
          }
        }
      }
      const syncedCustomerDocs = await collection.find({
        "orders": { $exists: true, $ne: [] }
      }).toArray();
      let updated = 0;
      for (const customerDoc of syncedCustomerDocs) {
        if (!customerDoc.orders || !Array.isArray(customerDoc.orders)) continue;
        for (const digitalOrder of customerDoc.orders) {
          if (digitalOrder.syncedToPOS !== true) continue;
          const orderId = digitalOrder._id?.toString() || `${customerDoc._id.toString()}_${digitalOrder.orderDate}`;
          const previousStatus = this.orderStatusMap.get(orderId);
          const previousPaymentStatus = this.orderPaymentStatusMap.get(orderId);
          const currentPaymentStatus = digitalOrder.paymentStatus || "pending";
          const statusChanged = previousStatus && previousStatus !== digitalOrder.status;
          const paymentStatusChanged = previousPaymentStatus && previousPaymentStatus !== currentPaymentStatus;
          const needsCheckout = (currentPaymentStatus === "invoice_generated" || currentPaymentStatus === "invoice generated") && digitalOrder.posOrderId;
          if (needsCheckout && digitalOrder.posOrderId) {
            try {
              const posOrder = await this.storage.getOrder(digitalOrder.posOrderId);
              if (posOrder && posOrder.status !== "paid" && posOrder.status !== "billed") {
                console.log(`\u{1F4B3} Order ${orderId} has invoice_generated payment status but not checked out - processing now`);
                const orderWithCustomer = {
                  ...digitalOrder,
                  customerId: customerDoc.customerId,
                  customerName: customerDoc.customerName,
                  customerPhone: customerDoc.customerPhone
                };
                await this.updatePOSOrderStatus(orderWithCustomer);
                updated++;
                continue;
              }
            } catch (error) {
              console.error(`\u274C Failed to check/process order ${orderId}:`, error);
            }
          }
          if (statusChanged || paymentStatusChanged) {
            try {
              const orderWithCustomer = {
                ...digitalOrder,
                customerId: customerDoc.customerId,
                customerName: customerDoc.customerName,
                customerPhone: customerDoc.customerPhone
              };
              await this.updatePOSOrderStatus(orderWithCustomer);
              this.orderStatusMap.set(orderId, digitalOrder.status);
              this.orderPaymentStatusMap.set(orderId, currentPaymentStatus);
              updated++;
              if (statusChanged) {
                console.log(`\u{1F504} Updated digital menu order ${orderId} status: ${previousStatus} \u2192 ${digitalOrder.status}`);
              }
              if (paymentStatusChanged) {
                console.log(`\u{1F4B3} Updated digital menu order ${orderId} paymentStatus: ${previousPaymentStatus} \u2192 ${currentPaymentStatus}`);
              }
              if (this.broadcastFn) {
                this.broadcastFn("digital_menu_order_updated", {
                  orderId,
                  customerName: customerDoc.customerName,
                  previousStatus,
                  newStatus: digitalOrder.status,
                  previousPaymentStatus,
                  newPaymentStatus: currentPaymentStatus
                });
              }
            } catch (error) {
              console.error(`\u274C Failed to update order ${orderId} status:`, error);
            }
          } else if (!previousStatus || !previousPaymentStatus) {
            this.orderStatusMap.set(orderId, digitalOrder.status);
            this.orderPaymentStatusMap.set(orderId, currentPaymentStatus);
          }
        }
      }
      if (synced > 0 || updated > 0) {
        console.log(`\u{1F4CA} Digital menu sync: ${synced} new, ${updated} updated`);
        if (this.broadcastFn) {
          this.broadcastFn("digital_menu_synced", { newOrders: synced, updatedOrders: updated });
        }
      }
      return synced + updated;
    } catch (error) {
      console.error("\u274C Error during digital menu sync:", error);
      return 0;
    }
  }
  async convertAndCreatePOSOrder(digitalOrder) {
    let tableId = null;
    if (digitalOrder.tableNumber) {
      const table = await this.findTableByNumberAndFloor(
        digitalOrder.tableNumber,
        digitalOrder.floorNumber
      );
      if (table) {
        tableId = table.id;
        if (table.status === "free") {
          await this.storage.updateTableStatus(table.id, "occupied");
          const updatedTable = await this.storage.getTable(table.id);
          if (updatedTable && this.broadcastFn) {
            this.broadcastFn("table_updated", updatedTable);
          }
        }
      } else {
        const locationInfo = digitalOrder.floorNumber ? `${digitalOrder.tableNumber} on floor ${digitalOrder.floorNumber}` : digitalOrder.tableNumber;
        console.warn(`\u26A0\uFE0F  Table ${locationInfo} not found in POS system`);
      }
    }
    const orderStatus = digitalOrder.paymentStatus === "paid" ? "billed" : "sent_to_kitchen";
    const posOrder = await this.storage.createOrder({
      tableId,
      orderType: "dine-in",
      status: orderStatus,
      total: "0",
      customerName: digitalOrder.customerName,
      customerPhone: digitalOrder.customerPhone,
      customerAddress: null,
      paymentMode: digitalOrder.paymentMethod || null,
      waiterId: null,
      deliveryPersonId: null,
      expectedPickupTime: null
    });
    if (this.broadcastFn) {
      this.broadcastFn("order_created", posOrder);
      console.log(`[WebSocket] Broadcast order_created for digital menu order ${posOrder.id}`);
    }
    if (tableId) {
      await this.storage.updateTableOrder(tableId, posOrder.id);
      const updatedTable = await this.storage.getTable(tableId);
      if (updatedTable && this.broadcastFn) {
        this.broadcastFn("table_updated", updatedTable);
      }
    }
    let calculatedSubtotal = 0;
    for (const item of digitalOrder.items || []) {
      const menuItem = await this.findMenuItemByName(item.menuItemName);
      const notes = [
        item.notes,
        item.spiceLevel ? `Spice: ${item.spiceLevel}` : null
      ].filter(Boolean).join(" | ") || null;
      const itemPrice = (item.price || 0).toFixed(2);
      calculatedSubtotal += (item.price || 0) * (item.quantity || 0);
      const createdItem = await this.storage.createOrderItem({
        orderId: posOrder.id,
        menuItemId: menuItem?.id || "unknown",
        name: item.menuItemName,
        quantity: item.quantity,
        price: itemPrice,
        notes,
        status: "new",
        isVeg: menuItem?.isVeg ?? true
      });
      if (this.broadcastFn) {
        this.broadcastFn("order_item_added", { orderId: posOrder.id, item: createdItem });
        console.log(`[WebSocket] Broadcast order_item_added for item ${createdItem.name}`);
      }
    }
    const orderTotal = (digitalOrder.total || 0).toFixed(2);
    const calculatedTotal = (calculatedSubtotal + (digitalOrder.tax || 0)).toFixed(2);
    if (Math.abs(parseFloat(orderTotal) - parseFloat(calculatedTotal)) > 0.01) {
      console.warn(`\u26A0\uFE0F  Order total mismatch for ${digitalOrder.customerName}: Digital Menu=${orderTotal}, Calculated=${calculatedTotal}`);
    }
    await this.storage.updateOrderTotal(posOrder.id, orderTotal);
    if (digitalOrder.customerPhone) {
      await this.updateCustomerTableStatus(digitalOrder.customerPhone, "occupied");
    }
    return posOrder.id;
  }
  async findTableByNumberAndFloor(tableNumber, floorNumber) {
    const tables = await this.storage.getTables();
    if (floorNumber) {
      const floors = await this.storage.getFloors();
      const floor = floors.find(
        (f) => f.name.toLowerCase() === floorNumber.toLowerCase()
      );
      if (floor) {
        const matchingTable = tables.find(
          (t) => t.tableNumber === tableNumber && t.floorId === floor.id
        );
        if (matchingTable) {
          return matchingTable;
        }
      }
      console.warn(`\u26A0\uFE0F  Floor "${floorNumber}" not found, searching all floors for table ${tableNumber}`);
    }
    const matchingTables = tables.filter((t) => t.tableNumber === tableNumber);
    if (matchingTables.length > 1) {
      console.warn(`\u26A0\uFE0F  Multiple tables with number "${tableNumber}" found on different floors. Using first match.`);
    }
    return matchingTables[0];
  }
  async updatePOSOrderStatus(digitalOrder) {
    try {
      if (!digitalOrder.posOrderId) {
        console.warn(`\u26A0\uFE0F  No POS order ID linked to digital menu order ${digitalOrder._id}`);
        return;
      }
      const posOrder = await this.storage.getOrder(digitalOrder.posOrderId);
      if (!posOrder) {
        console.warn(`\u26A0\uFE0F  POS order ${digitalOrder.posOrderId} not found`);
        return;
      }
      const paymentStatus = digitalOrder.paymentStatus || "";
      const orderStatus = digitalOrder.status || "";
      if (paymentStatus === "invoice_generated" || paymentStatus === "invoice generated" || orderStatus === "invoice_generated" || orderStatus === "invoice generated") {
        await this.autoCheckoutAndGenerateInvoice(digitalOrder, posOrder);
        return;
      }
      const statusMapping = {
        "pending": "new",
        "confirmed": "new",
        "preparing": "preparing",
        "completed": "served",
        "cancelled": "served"
        // Mark as served to remove from active
      };
      const newItemStatus = statusMapping[digitalOrder.status] || "new";
      const orderItems = await this.storage.getOrderItems(posOrder.id);
      for (const item of orderItems) {
        if (item.status !== newItemStatus) {
          await this.storage.updateOrderItemStatus(item.id, newItemStatus);
        }
      }
      console.log(`\u2705 Updated POS order ${posOrder.id} items to status: ${newItemStatus} (from digital menu status: ${digitalOrder.status})`);
    } catch (error) {
      console.error(`\u274C Failed to update POS order status:`, error);
    }
  }
  async autoCheckoutAndGenerateInvoice(digitalOrder, posOrder) {
    try {
      console.log(`\u{1F4B3} Auto-generating invoice for digital menu order ${digitalOrder._id}`);
      const orderItems = await this.storage.getOrderItems(posOrder.id);
      const subtotal = orderItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      const tax = subtotal * 0.05;
      const total = subtotal + tax;
      const paymentMode = (digitalOrder.paymentMethod || "cash").toLowerCase();
      const checkedOutOrder = await this.storage.checkoutOrder(posOrder.id, paymentMode);
      if (!checkedOutOrder) {
        console.error(`\u274C Failed to checkout order ${posOrder.id}`);
        return;
      }
      let tableInfo = null;
      if (checkedOutOrder.tableId) {
        tableInfo = await this.storage.getTable(checkedOutOrder.tableId);
        await this.storage.updateTableOrder(checkedOutOrder.tableId, null);
        await this.storage.updateTableStatus(checkedOutOrder.tableId, "free");
        const updatedTable = await this.storage.getTable(checkedOutOrder.tableId);
        if (updatedTable && this.broadcastFn) {
          this.broadcastFn("table_updated", updatedTable);
        }
      }
      if (checkedOutOrder.customerPhone) {
        await this.updateCustomerTableStatus(checkedOutOrder.customerPhone, "free");
      }
      const invoices = await this.storage.getInvoices();
      const invoiceNumber = `INV-${String(invoices.length + 1).padStart(4, "0")}`;
      const invoiceItemsData = orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        isVeg: item.isVeg,
        notes: item.notes || void 0
      }));
      const invoice = await this.storage.createInvoice({
        invoiceNumber,
        orderId: checkedOutOrder.id,
        tableNumber: tableInfo?.tableNumber || null,
        floorName: tableInfo?.floorId ? (await this.storage.getFloor(tableInfo.floorId))?.name || null : null,
        customerName: checkedOutOrder.customerName,
        customerPhone: checkedOutOrder.customerPhone,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: "0",
        total: total.toFixed(2),
        paymentMode,
        splitPayments: null,
        status: "Paid",
        items: JSON.stringify(invoiceItemsData),
        notes: null
      });
      if (this.broadcastFn) {
        this.broadcastFn("order_paid", checkedOutOrder);
        this.broadcastFn("invoice_created", invoice);
      }
      console.log(`\u2705 Auto-generated invoice ${invoiceNumber} for digital menu order ${digitalOrder._id}`);
    } catch (error) {
      console.error(`\u274C Failed to auto-generate invoice:`, error);
    }
  }
  async markOrderAsSynced(orderId, posOrderId) {
    try {
      await mongodb.connect();
      const collection = mongodb.getCollection("digital_menu_customer_orders");
      const result = await collection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            syncedToPOS: true,
            syncedAt: /* @__PURE__ */ new Date(),
            posOrderId
          }
        }
      );
      if (result.modifiedCount === 0) {
        console.warn(`\u26A0\uFE0F  Failed to mark order ${orderId} as synced - no document matched`);
      }
    } catch (error) {
      console.error(`\u274C Failed to mark order ${orderId} as synced:`, error);
    }
  }
  async findMenuItemByName(name) {
    const menuItems = await this.storage.getMenuItems();
    return menuItems.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );
  }
  async updateCustomerTableStatus(customerPhone, tableStatus) {
    try {
      await mongodb.connect();
      const collection = mongodb.getCollection("customers");
      const result = await collection.updateOne(
        { phoneNumber: customerPhone },
        {
          $set: {
            tableStatus,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`\u2705 Updated customer ${customerPhone} tableStatus to: ${tableStatus}`);
      }
    } catch (error) {
      console.error(`\u274C Failed to update customer tableStatus:`, error);
    }
  }
  async syncTableStatusFromPOSOrder(posOrderId) {
    try {
      const posOrder = await this.storage.getOrder(posOrderId);
      if (!posOrder || !posOrder.customerPhone) {
        return;
      }
      const orderItems = await this.storage.getOrderItems(posOrderId);
      if (orderItems.length === 0) {
        return;
      }
      const allServed = orderItems.every((item) => item.status === "served");
      const anyReady = orderItems.some((item) => item.status === "ready");
      const anyPreparing = orderItems.some((item) => item.status === "preparing");
      let tableStatus = "occupied";
      if (allServed) {
        tableStatus = "served";
      } else if (anyReady && !anyPreparing && orderItems.every((item) => item.status === "ready" || item.status === "served")) {
        tableStatus = "ready";
      } else if (anyPreparing || anyReady) {
        tableStatus = "preparing";
      }
      await this.updateCustomerTableStatus(posOrder.customerPhone, tableStatus);
    } catch (error) {
      console.error(`\u274C Failed to sync table status from POS order:`, error);
    }
  }
  async getDigitalMenuOrders() {
    try {
      await mongodb.connect();
      const collection = mongodb.getCollection("digital_menu_customer_orders");
      const orders = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return orders.map((order) => ({
        ...order,
        _id: order._id.toString()
      }));
    } catch (error) {
      console.error("\u274C Error fetching digital menu orders:", error);
      return [];
    }
  }
  async getDigitalMenuCustomers() {
    try {
      await mongodb.connect();
      const collection = mongodb.getCollection("customers");
      const customers = await collection.find({ loginStatus: "loggedin" }).toArray();
      return customers.map((customer) => ({
        ...customer,
        _id: customer._id.toString()
      }));
    } catch (error) {
      console.error("\u274C Error fetching digital menu customers:", error);
      return [];
    }
  }
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      processedOrders: this.processedOrderIds.size
    };
  }
};

// server/routes.ts
var orderActionSchema = z3.object({
  print: z3.boolean().optional().default(false)
});
var checkoutSchema = z3.object({
  paymentMode: z3.string().optional(),
  print: z3.boolean().optional().default(false),
  splitPayments: z3.array(z3.object({
    person: z3.number(),
    amount: z3.number(),
    paymentMode: z3.string()
  })).optional()
});
var wss;
function getStorage(req) {
  const sessionStorage = getStorageForSession(req);
  return sessionStorage || storage;
}
function broadcastUpdate(type, data) {
  if (!wss) {
    console.log("[WebSocket] No WSS instance, cannot broadcast");
    return;
  }
  const message = JSON.stringify({ type, data });
  const clientCount = Array.from(wss.clients).filter((c) => c.readyState === WebSocket.OPEN).length;
  console.log(`[WebSocket] Broadcasting ${type} to ${clientCount} clients`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
async function registerRoutes(app2) {
  app2.get("/api/floors", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const floors = await st.getFloors();
    res.json(floors);
  });
  app2.get("/api/floors/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const floor = await st.getFloor(req.params.id);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }
    res.json(floor);
  });
  app2.post("/api/floors", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertFloorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const floor = await st.createFloor(result.data);
    broadcastUpdate("floor_created", floor);
    res.json(floor);
  });
  app2.patch("/api/floors/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const floor = await st.updateFloor(req.params.id, req.body);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }
    broadcastUpdate("floor_updated", floor);
    res.json(floor);
  });
  app2.delete("/api/floors/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteFloor(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Floor not found" });
    }
    broadcastUpdate("floor_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.get("/api/tables", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const tables = await st.getTables();
    res.json(tables);
  });
  app2.get("/api/tables/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const table = await st.getTable(req.params.id);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    res.json(table);
  });
  app2.post("/api/tables", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertTableSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const table = await st.createTable(result.data);
    broadcastUpdate("table_created", table);
    res.json(table);
  });
  app2.patch("/api/tables/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const table = await st.updateTable(req.params.id, req.body);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    broadcastUpdate("table_updated", table);
    res.json(table);
  });
  app2.delete("/api/tables/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteTable(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Table not found" });
    }
    broadcastUpdate("table_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.patch("/api/tables/:id/status", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { status } = req.body;
    const table = await st.updateTableStatus(req.params.id, status);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    broadcastUpdate("table_updated", table);
    res.json(table);
  });
  app2.patch("/api/tables/:id/order", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { orderId } = req.body;
    const table = await st.updateTableOrder(req.params.id, orderId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    broadcastUpdate("table_updated", table);
    res.json(table);
  });
  app2.get("/api/menu", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const items = await st.getMenuItems();
    res.json(items);
  });
  app2.get("/api/menu/categories", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const categoriesJson = await st.getSetting("menu_categories");
    const categories = categoriesJson ? JSON.parse(categoriesJson) : [];
    res.json({ categories });
  });
  app2.get("/api/menu/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const item = await st.getMenuItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(item);
  });
  app2.post("/api/menu", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertMenuItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const item = await st.createMenuItem(result.data);
    broadcastUpdate("menu_updated", item);
    res.json(item);
  });
  app2.patch("/api/menu/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const item = await st.updateMenuItem(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    broadcastUpdate("menu_updated", item);
    res.json(item);
  });
  app2.delete("/api/menu/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteMenuItem(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    broadcastUpdate("menu_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.post("/api/menu/generate-quick-codes", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const items = await st.getMenuItems();
      const usedCodes = /* @__PURE__ */ new Set();
      const itemsNeedingCodes = [];
      for (const item of items) {
        if (item.quickCode) {
          usedCodes.add(item.quickCode);
        } else {
          itemsNeedingCodes.push(item);
        }
      }
      const letters = "abcdefghijklmnopqrstuvwxyz";
      let updated = 0;
      for (const item of itemsNeedingCodes) {
        let found = false;
        for (let letterIdx = 0; letterIdx < letters.length && !found; letterIdx++) {
          for (let num = 1; num <= 99 && !found; num++) {
            const code = `${letters[letterIdx]}${num}`;
            if (!usedCodes.has(code)) {
              usedCodes.add(code);
              await st.updateMenuItem(item.id, { quickCode: code });
              updated++;
              found = true;
            }
          }
        }
      }
      res.json({ success: true, updated, message: `Generated quick codes for ${updated} menu items` });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate quick codes" });
    }
  });
  app2.post("/api/menu/seed-sample-recipes", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const recipes = [
        {
          menuItemName: "Thai Basil Paneer (Starter)",
          ingredients: [
            { name: "Paneer", quantity: "150", unit: "g" },
            { name: "Thai Basil", quantity: "15", unit: "g" },
            { name: "Red Chili", quantity: "2", unit: "pcs" },
            { name: "Garlic", quantity: "6", unit: "cloves" },
            { name: "Cooking Oil", quantity: "30", unit: "ml" },
            { name: "Soy Sauce", quantity: "20", unit: "ml" }
          ]
        },
        {
          menuItemName: "Thai Basil Chicken (Starter)",
          ingredients: [
            { name: "Chicken Breast", quantity: "150", unit: "g" },
            { name: "Thai Basil", quantity: "15", unit: "g" },
            { name: "Red Chili", quantity: "2", unit: "pcs" },
            { name: "Garlic", quantity: "6", unit: "cloves" },
            { name: "Cooking Oil", quantity: "30", unit: "ml" },
            { name: "Soy Sauce", quantity: "20", unit: "ml" }
          ]
        },
        {
          menuItemName: "Thai Basil Prawns (Starter)",
          ingredients: [
            { name: "Prawns", quantity: "150", unit: "g" },
            { name: "Thai Basil", quantity: "15", unit: "g" },
            { name: "Red Chili", quantity: "2", unit: "pcs" },
            { name: "Garlic", quantity: "6", unit: "cloves" },
            { name: "Cooking Oil", quantity: "30", unit: "ml" },
            { name: "Soy Sauce", quantity: "20", unit: "ml" }
          ]
        },
        {
          menuItemName: "Thai Curry With Steam Rice Paneer",
          ingredients: [
            { name: "Paneer", quantity: "200", unit: "g" },
            { name: "Coconut Milk", quantity: "200", unit: "ml" },
            { name: "Lemongrass", quantity: "10", unit: "g" },
            { name: "Garlic", quantity: "8", unit: "cloves" },
            { name: "Ginger", quantity: "15", unit: "g" },
            { name: "Green Chili", quantity: "2", unit: "pcs" },
            { name: "Lime", quantity: "0.5", unit: "pcs" },
            { name: "Fish Sauce", quantity: "15", unit: "ml" },
            { name: "Cooking Oil", quantity: "40", unit: "ml" }
          ]
        },
        {
          menuItemName: "Thai Curry With Steam Rice Chicken",
          ingredients: [
            { name: "Chicken Breast", quantity: "200", unit: "g" },
            { name: "Coconut Milk", quantity: "200", unit: "ml" },
            { name: "Lemongrass", quantity: "10", unit: "g" },
            { name: "Garlic", quantity: "8", unit: "cloves" },
            { name: "Ginger", quantity: "15", unit: "g" },
            { name: "Green Chili", quantity: "2", unit: "pcs" },
            { name: "Lime", quantity: "0.5", unit: "pcs" },
            { name: "Fish Sauce", quantity: "15", unit: "ml" },
            { name: "Cooking Oil", quantity: "40", unit: "ml" }
          ]
        }
      ];
      const existingRecipes = await st.getRecipes();
      for (const recipe of recipes) {
        const menuItem = (await st.getMenuItems()).find((m) => m.name === recipe.menuItemName);
        if (menuItem) {
          const oldRecipe = existingRecipes.find((r) => r.menuItemId === menuItem.id);
          if (oldRecipe) {
            await st.deleteRecipe(oldRecipe.id);
            console.log(`\u{1F5D1}\uFE0F Deleted old recipe for: ${menuItem.name}`);
          }
        }
      }
      let addedRecipes = 0;
      const inventoryItems = await st.getInventoryItems();
      const inventoryMap = new Map(inventoryItems.map((item) => [item.name.toLowerCase(), item]));
      for (const recipe of recipes) {
        const menuItem = (await st.getMenuItems()).find((m) => m.name === recipe.menuItemName);
        if (!menuItem) {
          console.log(`Menu item not found: ${recipe.menuItemName}`);
          continue;
        }
        const recipeData = {
          menuItemId: menuItem.id,
          name: `Recipe for ${menuItem.name}`,
          ingredients: []
        };
        for (const ing of recipe.ingredients) {
          const invItem = inventoryMap.get(ing.name.toLowerCase());
          if (invItem) {
            recipeData.ingredients.push({
              inventoryItemId: invItem.id,
              quantity: parseFloat(ing.quantity),
              unit: ing.unit
            });
          }
        }
        if (recipe.ingredients.length > 0) {
          const createdRecipe = await st.createRecipe({ menuItemId: menuItem.id });
          console.log(`Created recipe for: ${menuItem.name} with ID: ${createdRecipe.id}`);
          let addedIngredients = 0;
          for (const ing of recipe.ingredients) {
            const invItem = inventoryMap.get(ing.name.toLowerCase());
            if (invItem) {
              try {
                await st.createRecipeIngredient({
                  recipeId: createdRecipe.id,
                  inventoryItemId: invItem.id,
                  quantity: String(ing.quantity),
                  unit: ing.unit
                });
                addedIngredients++;
                console.log(`  \u2705 Added ingredient: ${ing.name} (ID: ${invItem.id}) - ${ing.quantity}${ing.unit}`);
              } catch (ingError) {
                console.error(`  \u274C Failed to add ingredient ${ing.name}:`, ingError);
              }
            } else {
              console.warn(`  \u26A0\uFE0F  Ingredient not found in inventory: ${ing.name}`);
            }
          }
          if (addedIngredients > 0) {
            addedRecipes++;
            console.log(`\u2705 Recipe fully populated for: ${menuItem.name} (${addedIngredients} ingredients)`);
          } else {
            console.warn(`\u26A0\uFE0F  No ingredients were added to recipe for ${menuItem.name}`);
          }
        } else {
          console.warn(`\u26A0\uFE0F  No ingredients found for recipe ${recipe.menuItemName}`);
        }
      }
      res.json({ success: true, addedRecipes, message: `Seeded ${addedRecipes} sample recipes with all ingredients` });
    } catch (error) {
      console.error("Error seeding recipes:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to seed recipes" });
    }
  });
  app2.get("/api/orders", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const orders = await st.getOrders();
    res.json(orders);
  });
  app2.get("/api/orders/active", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const orders = await st.getActiveOrders();
    res.json(orders);
  });
  app2.get("/api/orders/completed", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const orders = await st.getCompletedOrders();
    res.json(orders);
  });
  app2.get("/api/orders/delivery", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const orders = await st.getDeliveryOrders();
    res.json(orders);
  });
  app2.get("/api/delivery-persons", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const persons = await st.getDeliveryPersons();
    res.json(persons);
  });
  app2.get("/api/delivery-persons/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const person = await st.getDeliveryPerson(req.params.id);
    if (!person) {
      return res.status(404).json({ error: "Delivery person not found" });
    }
    res.json(person);
  });
  app2.post("/api/delivery-persons", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const person = await st.createDeliveryPerson(req.body);
      res.status(201).json(person);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create delivery person" });
    }
  });
  app2.patch("/api/delivery-persons/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const person = await st.updateDeliveryPerson(req.params.id, req.body);
    if (!person) {
      return res.status(404).json({ error: "Delivery person not found" });
    }
    res.json(person);
  });
  app2.delete("/api/delivery-persons/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteDeliveryPerson(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Delivery person not found" });
    }
    res.status(204).send();
  });
  app2.patch("/api/orders/:id/assign-driver", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { deliveryPersonId } = req.body;
    const existingOrder = await st.getOrder(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (existingOrder.orderType !== "delivery") {
      return res.status(400).json({ error: "Can only assign drivers to delivery orders" });
    }
    if (deliveryPersonId) {
      const driver = await st.getDeliveryPerson(deliveryPersonId);
      if (!driver) {
        return res.status(400).json({ error: "Delivery person not found" });
      }
    }
    const order = await st.assignDeliveryPerson(req.params.id, deliveryPersonId);
    if (!order) {
      return res.status(500).json({ error: "Failed to assign driver" });
    }
    res.json(order);
  });
  app2.get("/api/orders/:id/invoice/pdf", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const order = await st.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const invoices = await st.getInvoices();
      const invoice = invoices.find((inv) => inv.orderId === req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found for this order" });
      }
      const orderItems = await st.getOrderItems(req.params.id);
      const pdfBuffer = generateInvoicePDF({
        invoice,
        order,
        orderItems,
        restaurantName: "Restaurant POS",
        restaurantAddress: "123 Main Street, City, State 12345",
        restaurantPhone: "+1 (555) 123-4567",
        restaurantGSTIN: "GSTIN1234567890"
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF invoice" });
    }
  });
  app2.get("/api/orders/:id/kot/pdf", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const order = await st.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const orderItems = await st.getOrderItems(req.params.id);
      if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ error: "No items in order" });
      }
      let tableInfo = null;
      if (order.tableId) {
        tableInfo = await st.getTable(order.tableId);
      }
      const pdfBuffer = generateKOTPDF({
        order,
        orderItems,
        tableNumber: tableInfo?.tableNumber || void 0,
        floorName: tableInfo?.floorId ? (await st.getFloor(tableInfo.floorId))?.name || void 0 : void 0,
        restaurantName: "Restaurant POS"
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="KOT-${order.id.substring(0, 8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating KOT PDF:", error);
      res.status(500).json({ error: "Failed to generate KOT PDF" });
    }
  });
  app2.get("/api/orders/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const order = await st.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });
  app2.get("/api/orders/:id/items", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const items = await st.getOrderItems(req.params.id);
    res.json(items);
  });
  app2.post("/api/orders", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertOrderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const order = await st.createOrder(result.data);
    if (order.tableId) {
      await st.updateTableOrder(order.tableId, order.id);
      await st.updateTableStatus(order.tableId, "occupied");
    }
    broadcastUpdate("order_created", order);
    res.json(order);
  });
  app2.post("/api/orders/:id/items", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertOrderItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    console.log("[Server] Creating order item for order:", req.params.id);
    const item = await st.createOrderItem(result.data);
    const orderItems = await st.getOrderItems(req.params.id);
    const total = orderItems.reduce((sum, item2) => {
      return sum + parseFloat(item2.price) * item2.quantity;
    }, 0);
    await st.updateOrderTotal(req.params.id, total.toFixed(2));
    const order = await st.getOrder(req.params.id);
    if (order && order.tableId) {
      const hasNew = orderItems.some((i) => i.status === "new");
      const hasPreparing = orderItems.some((i) => i.status === "preparing");
      const allReady = orderItems.every((i) => i.status === "ready" || i.status === "served");
      const allServed = orderItems.every((i) => i.status === "served");
      if (allServed) {
        await st.updateTableStatus(order.tableId, "served");
      } else if (allReady) {
        await st.updateTableStatus(order.tableId, "ready");
      } else if (hasPreparing) {
        await st.updateTableStatus(order.tableId, "preparing");
      } else if (hasNew) {
        await st.updateTableStatus(order.tableId, "occupied");
      }
      const updatedTable = await st.getTable(order.tableId);
      if (updatedTable) {
        broadcastUpdate("table_updated", updatedTable);
      }
    }
    console.log("[Server] Broadcasting order_item_added for orderId:", req.params.id);
    broadcastUpdate("order_item_added", { orderId: req.params.id, item });
    res.json(item);
  });
  app2.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { status } = req.body;
    const order = await st.updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    broadcastUpdate("order_updated", order);
    res.json(order);
  });
  app2.post("/api/orders/:id/complete", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const order = await st.completeOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.tableId) {
      await st.updateTableOrder(order.tableId, null);
      await st.updateTableStatus(order.tableId, "free");
    }
    broadcastUpdate("order_completed", order);
    res.json(order);
  });
  app2.post("/api/orders/:id/kot", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = orderActionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    console.log("[Server] Sending order to kitchen:", req.params.id);
    const order = await st.updateOrderStatus(req.params.id, "sent_to_kitchen");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    console.log("[Server] Broadcasting order_updated for KOT, orderId:", order.id, "status:", order.status);
    broadcastUpdate("order_updated", order);
    res.json({ order, shouldPrint: result.data.print });
  });
  app2.post("/api/orders/:id/save", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = orderActionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const order = await st.updateOrderStatus(req.params.id, "saved");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    let invoice = null;
    if (result.data.print) {
      const orderItems = await st.getOrderItems(req.params.id);
      const subtotal = orderItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      const tax = subtotal * 0.05;
      const total = subtotal + tax;
      let tableInfo = null;
      if (order.tableId) {
        tableInfo = await st.getTable(order.tableId);
      }
      const invoiceCount = (await st.getInvoices()).length;
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;
      const invoiceItemsData = orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        isVeg: item.isVeg,
        notes: item.notes || void 0
      }));
      invoice = await st.createInvoice({
        invoiceNumber,
        orderId: order.id,
        tableNumber: tableInfo?.tableNumber || null,
        floorName: tableInfo?.floorId ? (await st.getFloor(tableInfo.floorId))?.name || null : null,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: "0",
        total: total.toFixed(2),
        paymentMode: order.paymentMode || "cash",
        splitPayments: null,
        status: "Saved",
        items: JSON.stringify(invoiceItemsData),
        notes: null
      });
      broadcastUpdate("invoice_created", invoice);
    }
    broadcastUpdate("order_updated", order);
    res.json({ order, invoice, shouldPrint: result.data.print });
  });
  app2.post("/api/orders/:id/bill", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = orderActionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const order = await st.billOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const orderItems = await st.getOrderItems(req.params.id);
    const subtotal = orderItems.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    let tableInfo = null;
    if (order.tableId) {
      tableInfo = await st.getTable(order.tableId);
    }
    const invoiceCount = (await st.getInvoices()).length;
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;
    const invoiceItemsData = orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      isVeg: item.isVeg,
      notes: item.notes || void 0
    }));
    const invoice = await st.createInvoice({
      invoiceNumber,
      orderId: order.id,
      tableNumber: tableInfo?.tableNumber || null,
      floorName: tableInfo?.floorId ? (await st.getFloor(tableInfo.floorId))?.name || null : null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: "0",
      total: total.toFixed(2),
      paymentMode: order.paymentMode || "cash",
      splitPayments: null,
      status: "Billed",
      items: JSON.stringify(invoiceItemsData),
      notes: null
    });
    broadcastUpdate("order_updated", order);
    broadcastUpdate("invoice_created", invoice);
    res.json({ order, invoice, shouldPrint: result.data.print });
  });
  app2.post("/api/orders/:id/checkout", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = checkoutSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const order = await st.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const orderItems = await st.getOrderItems(req.params.id);
    const subtotal = orderItems.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    if (result.data.splitPayments && result.data.splitPayments.length > 0) {
      const splitSum = result.data.splitPayments.reduce((sum, split) => sum + split.amount, 0);
      const tolerance = 0.01;
      if (Math.abs(splitSum - total) > tolerance) {
        return res.status(400).json({
          error: "Split payment amounts must equal the total bill",
          splitSum,
          total
        });
      }
      for (const split of result.data.splitPayments) {
        if (split.amount <= 0) {
          return res.status(400).json({ error: "Split payment amounts must be positive" });
        }
      }
    }
    const checkedOutOrder = await st.checkoutOrder(req.params.id, result.data.paymentMode);
    if (!checkedOutOrder) {
      return res.status(500).json({ error: "Failed to checkout order" });
    }
    let tableInfo = null;
    if (checkedOutOrder.tableId) {
      tableInfo = await st.getTable(checkedOutOrder.tableId);
      await st.updateTableOrder(checkedOutOrder.tableId, null);
      await st.updateTableStatus(checkedOutOrder.tableId, "free");
    }
    if (checkedOutOrder.customerPhone) {
      await digitalMenuSync.updateCustomerTableStatus(checkedOutOrder.customerPhone, "free");
    }
    const invoiceCount = (await st.getInvoices()).length;
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;
    const invoiceItemsData = orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      isVeg: item.isVeg,
      notes: item.notes || void 0
    }));
    const invoice = await st.createInvoice({
      invoiceNumber,
      orderId: checkedOutOrder.id,
      tableNumber: tableInfo?.tableNumber || null,
      floorName: tableInfo?.floorId ? (await st.getFloor(tableInfo.floorId))?.name || null : null,
      customerName: checkedOutOrder.customerName,
      customerPhone: checkedOutOrder.customerPhone,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: "0",
      total: total.toFixed(2),
      paymentMode: result.data.paymentMode || "cash",
      splitPayments: result.data.splitPayments ? JSON.stringify(result.data.splitPayments) : null,
      status: "Paid",
      items: JSON.stringify(invoiceItemsData),
      notes: null
    });
    try {
      await st.deductInventoryForOrder(checkedOutOrder.id);
      broadcastUpdate("inventory_updated", { orderId: checkedOutOrder.id });
    } catch (error) {
      console.error("Error deducting inventory for order:", error);
    }
    broadcastUpdate("order_paid", checkedOutOrder);
    broadcastUpdate("invoice_created", invoice);
    res.json({ order: checkedOutOrder, invoice, shouldPrint: result.data.print });
  });
  app2.get("/api/invoices/:id/pdf", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const invoice = await st.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      const order = await st.getOrder(invoice.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const orderItems = await st.getOrderItems(invoice.orderId);
      const pdfBuffer = generateInvoicePDF({
        invoice,
        order,
        orderItems,
        restaurantName: "Restaurant POS",
        restaurantAddress: "123 Main Street, City, State 12345",
        restaurantPhone: "+1 (555) 123-4567",
        restaurantGSTIN: "GSTIN1234567890"
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  });
  app2.patch("/api/order-items/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { quantity, notes, name } = req.body;
    const data = {};
    if (quantity !== void 0) data.quantity = quantity;
    if (notes !== void 0) data.notes = notes;
    if (name !== void 0) data.name = name;
    const item = await st.updateOrderItem(req.params.id, data);
    if (!item) return res.status(404).json({ error: "Order item not found" });
    const orderItems = await st.getOrderItems(item.orderId);
    const total = orderItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    await st.updateOrderTotal(item.orderId, total.toFixed(2));
    broadcastUpdate("order_item_updated", item);
    res.json(item);
  });
  app2.delete("/api/orders/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const order = await st.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const items = await st.getOrderItems(req.params.id);
    for (const item of items) await st.deleteOrderItem(item.id);
    if (order.tableId) {
      await st.updateTableOrder(order.tableId, null);
      await st.updateTableStatus(order.tableId, "free");
      const updatedTable = await st.getTable(order.tableId);
      if (updatedTable) broadcastUpdate("table_updated", updatedTable);
    }
    await st.deleteOrder(req.params.id);
    broadcastUpdate("order_updated", { id: req.params.id, deleted: true });
    res.json({ success: true });
  });
  app2.patch("/api/order-items/:id/status", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { status } = req.body;
    const item = await st.updateOrderItemStatus(req.params.id, status);
    if (!item) {
      return res.status(404).json({ error: "Order item not found" });
    }
    const order = await st.getOrder(item.orderId);
    if (order && order.tableId) {
      const allItems = await st.getOrderItems(item.orderId);
      const hasNew = allItems.some((i) => i.status === "new");
      const hasPreparing = allItems.some((i) => i.status === "preparing");
      const allReady = allItems.every((i) => i.status === "ready" || i.status === "served");
      const allServed = allItems.every((i) => i.status === "served");
      let newTableStatus = null;
      if (allServed) {
        newTableStatus = "served";
        await st.updateTableStatus(order.tableId, "served");
      } else if (allReady) {
        newTableStatus = "ready";
        await st.updateTableStatus(order.tableId, "ready");
      } else if (hasPreparing) {
        newTableStatus = "preparing";
        await st.updateTableStatus(order.tableId, "preparing");
      } else if (hasNew) {
        newTableStatus = "occupied";
        await st.updateTableStatus(order.tableId, "occupied");
      }
      if (newTableStatus) {
        const updatedTable = await st.getTable(order.tableId);
        if (updatedTable) {
          broadcastUpdate("table_updated", updatedTable);
        }
      }
    }
    if (order && order.customerPhone) {
      await digitalMenuSync.syncTableStatusFromPOSOrder(item.orderId);
    }
    broadcastUpdate("order_item_updated", item);
    res.json(item);
  });
  app2.delete("/api/order-items/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const item = await st.getOrderItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Order item not found" });
    }
    const success = await st.deleteOrderItem(req.params.id);
    if (!success) {
      return res.status(500).json({ error: "Failed to delete order item" });
    }
    const orderItems = await st.getOrderItems(item.orderId);
    const total = orderItems.reduce((sum, orderItem) => {
      return sum + parseFloat(orderItem.price) * orderItem.quantity;
    }, 0);
    await st.updateOrderTotal(item.orderId, total.toFixed(2));
    broadcastUpdate("order_item_deleted", { id: req.params.id, orderId: item.orderId });
    res.json({ success: true });
  });
  app2.get("/api/inventory", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const items = await st.getInventoryItems();
    res.json(items);
  });
  app2.post("/api/inventory", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertInventoryItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const item = await st.createInventoryItem(result.data);
    res.json(item);
  });
  app2.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { quantity } = req.body;
    const item = await st.updateInventoryQuantity(req.params.id, quantity);
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.json(item);
  });
  app2.get("/api/invoices", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const invoices = await st.getInvoices();
    res.json(invoices);
  });
  app2.get("/api/invoices/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const invoice = await st.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });
  app2.get("/api/invoices/number/:invoiceNumber", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const invoice = await st.getInvoiceByNumber(req.params.invoiceNumber);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });
  app2.post("/api/invoices", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertInvoiceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const invoice = await st.createInvoice(result.data);
    broadcastUpdate("invoice_created", invoice);
    res.json(invoice);
  });
  app2.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const invoice = await st.updateInvoice(req.params.id, req.body);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    broadcastUpdate("invoice_updated", invoice);
    res.json(invoice);
  });
  app2.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteInvoice(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    broadcastUpdate("invoice_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.get("/api/reservations", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const reservations = await st.getReservations();
    res.json(reservations);
  });
  app2.get("/api/reservations/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const reservation = await st.getReservation(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    res.json(reservation);
  });
  app2.get("/api/reservations/table/:tableId", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const reservations = await st.getReservationsByTable(req.params.tableId);
    res.json(reservations);
  });
  app2.post("/api/reservations", requireAuth, async (req, res) => {
    const st = getStorage(req);
    console.log("=== SERVER: CREATE RESERVATION ===");
    console.log("Received body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body));
    console.log("timeSlot value:", req.body.timeSlot);
    console.log("timeSlot type:", typeof req.body.timeSlot);
    const result = insertReservationSchema.safeParse(req.body);
    console.log("Validation result:", result.success);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error, null, 2));
      return res.status(400).json({ error: result.error });
    }
    console.log("Validated data:", result.data);
    const existingReservations = await st.getReservationsByTable(result.data.tableId);
    if (existingReservations.length > 0) {
      return res.status(409).json({ error: "This table already has an active reservation" });
    }
    const reservation = await st.createReservation(result.data);
    console.log("Created reservation:", reservation);
    const table = await st.getTable(reservation.tableId);
    if (table && table.status === "free") {
      const updatedTable = await st.updateTableStatus(reservation.tableId, "reserved");
      if (updatedTable) {
        broadcastUpdate("table_updated", updatedTable);
      }
    }
    broadcastUpdate("reservation_created", reservation);
    res.json(reservation);
  });
  app2.patch("/api/reservations/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const existingReservation = await st.getReservation(req.params.id);
    if (!existingReservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    const oldTableId = existingReservation.tableId;
    const newTableId = req.body.tableId || oldTableId;
    const tableChanged = oldTableId !== newTableId;
    if (tableChanged) {
      const newTableReservations = await st.getReservationsByTable(newTableId);
      if (newTableReservations.length > 0) {
        return res.status(409).json({ error: "The destination table already has an active reservation" });
      }
    }
    const reservation = await st.updateReservation(req.params.id, req.body);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    if (tableChanged) {
      const oldTableReservations = await st.getReservationsByTable(oldTableId);
      if (oldTableReservations.length === 0) {
        const oldTable = await st.getTable(oldTableId);
        if (oldTable && oldTable.status === "reserved" && !oldTable.currentOrderId) {
          const updatedOldTable = await st.updateTableStatus(oldTableId, "free");
          if (updatedOldTable) {
            broadcastUpdate("table_updated", updatedOldTable);
          }
        }
      }
      const newTable = await st.getTable(newTableId);
      if (newTable && newTable.status === "free") {
        const updatedNewTable = await st.updateTableStatus(newTableId, "reserved");
        if (updatedNewTable) {
          broadcastUpdate("table_updated", updatedNewTable);
        }
      }
    }
    if (req.body.status === "cancelled") {
      const tableReservations = await st.getReservationsByTable(reservation.tableId);
      if (tableReservations.length === 0) {
        const table = await st.getTable(reservation.tableId);
        if (table && table.status === "reserved" && !table.currentOrderId) {
          const updatedTable = await st.updateTableStatus(reservation.tableId, "free");
          if (updatedTable) {
            broadcastUpdate("table_updated", updatedTable);
          }
        }
      }
    }
    broadcastUpdate("reservation_updated", reservation);
    res.json(reservation);
  });
  app2.delete("/api/reservations/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const reservation = await st.getReservation(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    const success = await st.deleteReservation(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Failed to delete reservation" });
    }
    const tableReservations = await st.getReservationsByTable(reservation.tableId);
    if (tableReservations.length === 0) {
      const table = await st.getTable(reservation.tableId);
      if (table && table.status === "reserved" && !table.currentOrderId) {
        const updatedTable = await st.updateTableStatus(reservation.tableId, "free");
        if (updatedTable) {
          broadcastUpdate("table_updated", updatedTable);
        }
      }
    }
    broadcastUpdate("reservation_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.post("/api/admin/clear-data", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const { types = ["all"] } = req.body;
      const cleared = [];
      if (types.includes("orderItems") || types.includes("all")) {
        const orders = await st.getOrders();
        for (const order of orders) {
          const orderItems = await st.getOrderItems(order.id);
          for (const item of orderItems) {
            await st.deleteOrderItem(item.id);
          }
        }
        cleared.push("orderItems");
      }
      if (types.includes("invoices") || types.includes("all")) {
        const invoices = await st.getInvoices();
        for (const invoice of invoices) {
          await st.deleteInvoice(invoice.id);
        }
        cleared.push("invoices");
      }
      if (types.includes("orders") || types.includes("all")) {
        const orders = await st.getOrders();
        for (const order of orders) {
          await st.deleteOrder(order.id);
        }
        cleared.push("orders");
      }
      broadcastUpdate("data_cleared", { types: cleared });
      res.json({ success: true, cleared });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ error: "Failed to clear data" });
    }
  });
  app2.get("/api/customers", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const customers = await st.getCustomers();
    res.json(customers);
  });
  app2.get("/api/customers/:id/stats", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const customer = await st.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const orders = await st.getOrders();
    const customerOrders = orders.filter((o) => o.customerPhone === customer.phone);
    const totalOrders = customerOrders.length;
    const invoices = await st.getInvoices();
    const customerInvoices = invoices.filter((inv) => {
      const order = customerOrders.find((o) => o.id === inv.orderId);
      return !!order;
    });
    const actualTotalSpent = customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);
    const lastOrder = customerOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    res.json({
      totalOrders,
      totalSpent: actualTotalSpent,
      lastVisit: lastOrder ? lastOrder.createdAt : customer.createdAt
    });
  });
  app2.get("/api/customers/phone/:phone", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const customer = await st.getCustomerByPhone(req.params.phone);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });
  app2.get("/api/customers/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const customer = await st.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });
  app2.post("/api/customers", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const existingCustomer = await st.getCustomerByPhone(result.data.phone);
    if (existingCustomer) {
      return res.status(409).json({ error: "Customer with this phone number already exists", customer: existingCustomer });
    }
    const customer = await st.createCustomer(result.data);
    broadcastUpdate("customer_created", customer);
    res.json(customer);
  });
  app2.patch("/api/customers/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const customer = await st.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    broadcastUpdate("customer_updated", customer);
    res.json(customer);
  });
  app2.delete("/api/customers/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    broadcastUpdate("customer_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.get("/api/feedbacks", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const feedbacks = await st.getFeedbacks();
    res.json(feedbacks);
  });
  app2.get("/api/feedbacks/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const feedback = await st.getFeedback(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.json(feedback);
  });
  app2.post("/api/feedbacks", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const result = insertFeedbackSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const feedback = await st.createFeedback(result.data);
    broadcastUpdate("feedback_created", feedback);
    res.json(feedback);
  });
  app2.delete("/api/feedbacks/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const success = await st.deleteFeedback(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    broadcastUpdate("feedback_deleted", { id: req.params.id });
    res.json({ success: true });
  });
  app2.get("/api/settings/mongodb-uri", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const uri = await st.getSetting("mongodb_uri");
    res.json({ uri: uri || null, hasUri: !!uri });
  });
  app2.post("/api/settings/mongodb-uri", requireAuth, async (req, res) => {
    const st = getStorage(req);
    const { uri } = req.body;
    if (!uri || typeof uri !== "string") {
      return res.status(400).json({ error: "MongoDB URI is required" });
    }
    await st.setSetting("mongodb_uri", uri);
    res.json({ success: true });
  });
  app2.post("/api/menu/sync-from-mongodb", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const mongoUri = await st.getSetting("mongodb_uri");
      if (!mongoUri) {
        return res.status(400).json({ error: "MongoDB URI not configured. Please set it first." });
      }
      const { databaseName } = req.body;
      const { items, categories } = await fetchMenuItemsFromMongoDB(mongoUri, databaseName);
      const existingItems = await st.getMenuItems();
      for (const existing of existingItems) {
        await st.deleteMenuItem(existing.id);
      }
      const createdItems = [];
      for (const item of items) {
        const created = await st.createMenuItem(item);
        createdItems.push(created);
      }
      await st.setSetting("menu_categories", JSON.stringify(categories));
      broadcastUpdate("menu_synced", { count: createdItems.length });
      res.json({
        success: true,
        itemsImported: createdItems.length,
        items: createdItems
      });
    } catch (error) {
      console.error("Error syncing from MongoDB:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to sync from MongoDB"
      });
    }
  });
  app2.get("/api/inventory", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      let items = await st.getInventoryItems();
      if (req.query.search) {
        const search = req.query.search.toString().toLowerCase();
        items = items.filter(
          (item) => item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search)
        );
      }
      if (req.query.category) {
        const category = req.query.category.toString();
        items = items.filter((item) => item.category === category);
      }
      if (req.query.sortBy) {
        const sortBy = req.query.sortBy.toString();
        if (sortBy === "name") {
          items.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "stock") {
          items.sort((a, b) => parseFloat(a.currentStock) - parseFloat(b.currentStock));
        } else if (sortBy === "lowStock") {
          items = items.filter((item) => parseFloat(item.currentStock) <= parseFloat(item.minStock));
        }
      }
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch inventory" });
    }
  });
  app2.get("/api/inventory/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const item = await st.getInventoryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch inventory item" });
    }
  });
  app2.post("/api/inventory", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertInventoryItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const item = await st.createInventoryItem(result.data);
      broadcastUpdate("inventory_created", item);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create inventory item" });
    }
  });
  app2.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const item = await st.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      broadcastUpdate("inventory_updated", item);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update inventory item" });
    }
  });
  app2.delete("/api/inventory/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const success = await st.deleteInventoryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      broadcastUpdate("inventory_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete inventory item" });
    }
  });
  app2.get("/api/recipes/menu-item/:menuItemId", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const recipe = await st.getRecipeByMenuItemId(req.params.menuItemId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found for this menu item" });
      }
      const ingredients = await st.getRecipeIngredients(recipe.id);
      const ingredientsWithDetails = await Promise.all(
        ingredients.map(async (ingredient) => {
          const inventoryItem = await st.getInventoryItem(ingredient.inventoryItemId);
          return {
            ...ingredient,
            inventoryItem
          };
        })
      );
      res.json({
        recipe,
        ingredients: ingredientsWithDetails
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch recipe" });
    }
  });
  app2.post("/api/recipes", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertRecipeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const recipe = await st.createRecipe(result.data);
      broadcastUpdate("recipe_created", recipe);
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create recipe" });
    }
  });
  app2.post("/api/recipes/:recipeId/ingredients", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const bodySchema = insertRecipeIngredientSchema.omit({ recipeId: true });
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const ingredient = await st.createRecipeIngredient({
        ...result.data,
        recipeId: req.params.recipeId
      });
      broadcastUpdate("recipe_ingredient_added", ingredient);
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add recipe ingredient" });
    }
  });
  app2.patch("/api/recipes/:recipeId/ingredients/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const ingredient = await st.updateRecipeIngredient(req.params.id, req.body);
      if (!ingredient) {
        return res.status(404).json({ error: "Recipe ingredient not found" });
      }
      broadcastUpdate("recipe_ingredient_updated", ingredient);
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update recipe ingredient" });
    }
  });
  app2.delete("/api/recipes/:recipeId/ingredients/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const success = await st.deleteRecipeIngredient(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Recipe ingredient not found" });
      }
      broadcastUpdate("recipe_ingredient_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete recipe ingredient" });
    }
  });
  app2.delete("/api/recipes/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const success = await st.deleteRecipe(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      broadcastUpdate("recipe_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete recipe" });
    }
  });
  app2.get("/api/suppliers", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const suppliers = await st.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch suppliers" });
    }
  });
  app2.post("/api/suppliers", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const supplier = await st.createSupplier(result.data);
      broadcastUpdate("supplier_created", supplier);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create supplier" });
    }
  });
  app2.patch("/api/suppliers/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const supplier = await st.updateSupplier(req.params.id, req.body);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      broadcastUpdate("supplier_updated", supplier);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update supplier" });
    }
  });
  app2.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const success = await st.deleteSupplier(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      broadcastUpdate("supplier_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete supplier" });
    }
  });
  app2.get("/api/purchase-orders", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const orders = await st.getPurchaseOrders();
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await st.getPurchaseOrderItems(order.id);
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const inventoryItem = await st.getInventoryItem(item.inventoryItemId);
              return {
                ...item,
                inventoryItem
              };
            })
          );
          const supplier = await st.getSupplier(order.supplierId);
          return {
            ...order,
            items: itemsWithDetails,
            supplier
          };
        })
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch purchase orders" });
    }
  });
  app2.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const order = await st.getPurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      const items = await st.getPurchaseOrderItems(order.id);
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const inventoryItem = await st.getInventoryItem(item.inventoryItemId);
          return {
            ...item,
            inventoryItem
          };
        })
      );
      const supplier = await st.getSupplier(order.supplierId);
      res.json({
        ...order,
        items: itemsWithDetails,
        supplier
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch purchase order" });
    }
  });
  app2.post("/api/purchase-orders", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertPurchaseOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const order = await st.createPurchaseOrder(result.data);
      broadcastUpdate("purchase_order_created", order);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create purchase order" });
    }
  });
  app2.post("/api/purchase-orders/:id/items", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertPurchaseOrderItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const item = await st.createPurchaseOrderItem({
        ...result.data,
        purchaseOrderId: req.params.id
      });
      broadcastUpdate("purchase_order_item_added", item);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add purchase order item" });
    }
  });
  app2.patch("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const order = await st.updatePurchaseOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      broadcastUpdate("purchase_order_updated", order);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update purchase order" });
    }
  });
  app2.post("/api/purchase-orders/:id/receive", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const order = await st.receivePurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      broadcastUpdate("purchase_order_received", order);
      broadcastUpdate("inventory_updated", { purchaseOrderId: req.params.id });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to receive purchase order" });
    }
  });
  app2.delete("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const success = await st.deletePurchaseOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      broadcastUpdate("purchase_order_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete purchase order" });
    }
  });
  app2.get("/api/wastage", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const wastages = await st.getWastages();
      const wastagesWithDetails = await Promise.all(
        wastages.map(async (wastage) => {
          const inventoryItem = await st.getInventoryItem(wastage.inventoryItemId);
          return {
            ...wastage,
            inventoryItem
          };
        })
      );
      res.json(wastagesWithDetails);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch wastage records" });
    }
  });
  app2.post("/api/wastage", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertWastageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const inventoryItem = await st.getInventoryItem(result.data.inventoryItemId);
      if (!inventoryItem) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      const newStock = parseFloat(inventoryItem.currentStock) - parseFloat(result.data.quantity);
      if (newStock < 0) {
        return res.status(400).json({ error: "Insufficient stock for wastage entry" });
      }
      await st.updateInventoryQuantity(result.data.inventoryItemId, newStock.toString());
      const wastage = await st.createWastage(result.data);
      broadcastUpdate("wastage_created", wastage);
      broadcastUpdate("inventory_updated", { wastageId: wastage.id });
      res.json(wastage);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create wastage record" });
    }
  });
  app2.delete("/api/wastage/:id", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const success = await st.deleteWastage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Wastage record not found" });
      }
      broadcastUpdate("wastage_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete wastage record" });
    }
  });
  app2.get("/api/inventory-usage", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const usages = await st.getInventoryUsages();
      res.json(usages);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch inventory usage" });
    }
  });
  app2.get("/api/inventory-usage/item/:itemId", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const usages = await st.getInventoryUsagesByItem(req.params.itemId);
      res.json(usages);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch item usage" });
    }
  });
  app2.get("/api/inventory-usage/most-used", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const mostUsed = await st.getMostUsedItems(limit);
      res.json(mostUsed);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch most used items" });
    }
  });
  app2.post("/api/inventory-usage", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const result = insertInventoryUsageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      const usage = await st.createInventoryUsage(result.data);
      broadcastUpdate("inventory_usage_created", usage);
      res.json(usage);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create inventory usage record" });
    }
  });
  app2.post("/api/inventory/seed", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      if (typeof storage.seedInventoryAndRecipes !== "function") {
        return res.status(400).json({ error: "Seeding is only available with MongoDB storage" });
      }
      const result = await st.seedInventoryAndRecipes();
      broadcastUpdate("inventory_seeded", result);
      res.json({
        success: true,
        message: "Inventory and recipes seeded successfully",
        ...result
      });
    } catch (error) {
      console.error("Error seeding inventory:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to seed inventory" });
    }
  });
  const digitalMenuSync = new DigitalMenuSyncService(storage);
  digitalMenuSync.setBroadcastFunction(broadcastUpdate);
  app2.post("/api/digital-menu/sync-start", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const intervalMs = req.body.intervalMs || 5e3;
      await digitalMenuSync.start(intervalMs);
      res.json({ success: true, message: "Digital menu sync service started" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to start sync service" });
    }
  });
  app2.post("/api/digital-menu/sync-stop", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      digitalMenuSync.stop();
      res.json({ success: true, message: "Digital menu sync service stopped" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to stop sync service" });
    }
  });
  app2.post("/api/digital-menu/sync-now", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const synced = await digitalMenuSync.syncOrders();
      broadcastUpdate("digital_menu_synced", { count: synced });
      res.json({ success: true, syncedOrders: synced });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to sync orders" });
    }
  });
  app2.get("/api/digital-menu/status", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const status = digitalMenuSync.getSyncStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get sync status" });
    }
  });
  app2.get("/api/digital-menu/orders", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const orders = await digitalMenuSync.getDigitalMenuOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch digital menu orders" });
    }
  });
  app2.get("/api/digital-menu/customers", requireAuth, async (req, res) => {
    const st = getStorage(req);
    try {
      const customers = await digitalMenuSync.getDigitalMenuCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch digital menu customers" });
    }
  });
  digitalMenuSync.start(5e3);
  const httpServer = createServer(app2);
  wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });
  wss.on("connection", (ws) => {
    ws.on("error", console.error);
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    hmr: false
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    allowedHosts: true,
    hmr: false
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
setupAuthRoutes(app);
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
