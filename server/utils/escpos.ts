import * as net from "net";
import type { Order, OrderItem } from "@shared/schema";

// ESC/POS command constants
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const CR = 0x0d;

function cmd(...bytes: number[]): Buffer {
  return Buffer.from(bytes);
}

function text(str: string): Buffer {
  return Buffer.from(str, "utf8");
}

function lines(n = 1): Buffer {
  return Buffer.from(Array(n).fill(LF));
}

export function buildKOTEscPos(opts: {
  order: Order;
  items: OrderItem[];
  tableNumber?: string;
  floorName?: string;
  kotNumber: string;
  restaurantName?: string;
}): Buffer {
  const { order, items, tableNumber, floorName, kotNumber, restaurantName = "Restaurant POS" } = opts;
  const now = new Date(order.createdAt);
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const sep = "--------------------------------";

  const parts: Buffer[] = [];

  // Initialize printer
  parts.push(cmd(ESC, 0x40));

  // Center align
  parts.push(cmd(ESC, 0x61, 0x01));

  // Double-size restaurant name
  parts.push(cmd(ESC, 0x21, 0x30)); // double height+width
  parts.push(text(restaurantName + "\n"));

  // Normal size
  parts.push(cmd(ESC, 0x21, 0x00));
  parts.push(text("Kitchen Order Ticket\n"));
  parts.push(text(sep + "\n"));

  // Left align for details
  parts.push(cmd(ESC, 0x61, 0x00));

  // Bold KOT number
  parts.push(cmd(ESC, 0x45, 0x01));
  parts.push(text(`${kotNumber}\n`));
  parts.push(cmd(ESC, 0x45, 0x00));

  parts.push(text(`Date : ${dateStr}  ${timeStr}\n`));

  if (order.orderType === "dine-in" && tableNumber) {
    parts.push(text(`Table: ${tableNumber}${floorName ? `  (${floorName})` : ""}\n`));
  } else {
    const typeLabel = order.orderType === "delivery" ? "Delivery" : "Pickup";
    parts.push(text(`Type : ${typeLabel}\n`));
  }

  if (order.customerName) {
    parts.push(text(`Cust : ${order.customerName}${order.customerPhone ? `  ${order.customerPhone}` : ""}\n`));
  }

  parts.push(text(sep + "\n"));

  // Items header
  parts.push(cmd(ESC, 0x45, 0x01));
  parts.push(text("# Item                         Qty\n"));
  parts.push(cmd(ESC, 0x45, 0x00));
  parts.push(text(sep + "\n"));

  // Items
  items.forEach((item, idx) => {
    const num = String(idx + 1).padEnd(2);
    const name = item.name.substring(0, 24).padEnd(24);
    const qty = String(item.quantity).padStart(3);
    parts.push(cmd(ESC, 0x21, 0x08)); // double height
    parts.push(text(`${num} ${name} ${qty}\n`));
    parts.push(cmd(ESC, 0x21, 0x00));
    if (item.notes) {
      parts.push(text(`   >> ${item.notes}\n`));
    }
  });

  parts.push(text(sep + "\n"));

  // Center "ORDERED"
  parts.push(cmd(ESC, 0x61, 0x01));
  parts.push(cmd(ESC, 0x45, 0x01));
  parts.push(text("*** ORDERED ***\n"));
  parts.push(cmd(ESC, 0x45, 0x00));

  // Feed and cut
  parts.push(lines(4));
  parts.push(cmd(GS, 0x56, 0x42, 0x03)); // partial cut

  return Buffer.concat(parts);
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

export function printToThermal(ip: string, port: number, data: Buffer, timeoutMs = 5000): Promise<PrintResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (result: PrintResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const timer = setTimeout(() => done({ success: false, error: "Connection timed out" }), timeoutMs);

    socket.connect(port, ip, () => {
      socket.write(data, (err) => {
        clearTimeout(timer);
        if (err) {
          done({ success: false, error: err.message });
        } else {
          setTimeout(() => done({ success: true }), 300);
        }
      });
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      done({ success: false, error: err.message });
    });
  });
}

export function checkPrinterOnline(ip: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (result: boolean) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(result);
    };

    setTimeout(() => finish(false), timeoutMs);
    socket.connect(port, ip, () => finish(true));
    socket.on("error", () => finish(false));
  });
}
