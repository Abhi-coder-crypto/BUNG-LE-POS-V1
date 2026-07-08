import { jsPDF } from "jspdf";
import type { Order, OrderItem } from "@shared/schema";
import { format } from "date-fns";

interface KOTData {
  order: Order;
  orderItems: OrderItem[];
  tableNumber?: string;
  floorName?: string;
  kotNumber?: string;
  restaurantName?: string;
  isUpdated?: boolean;
}

/* ── colour palette (exactly matches the modal) ─────────────────────────── */
const C = {
  white:      [255, 255, 255] as [number, number, number],
  pageBg:     [255, 255, 255] as [number, number, number],
  // meta table
  labelBg:    [249, 250, 251] as [number, number, number],   // gray-50
  labelText:  [107, 114, 128] as [number, number, number],   // gray-500
  valueText:  [31,  41,  55]  as [number, number, number],   // gray-800
  border:     [229, 231, 235] as [number, number, number],   // gray-200  (table borders)
  rowDiv:     [243, 244, 246] as [number, number, number],   // gray-100  (row dividers)
  // header/title
  titleText:  [17,  24,  39]  as [number, number, number],   // gray-900
  // items table header  ← matches UI bg-gray-50
  tblHdrBg:   [249, 250, 251] as [number, number, number],   // gray-50
  tblHdrText: [75,  85,  99]  as [number, number, number],   // gray-600
  // status pills
  statusAmber:  [180, 83,  9] as [number, number, number],   // amber-700
  statusBlue:   [29, 78, 216] as [number, number, number],   // blue-700
  statusGreen:  [21, 128, 61] as [number, number, number],   // green-700
  statusPurple: [109, 40, 217] as [number, number, number],  // purple-700
  statusGray:   [107, 114, 128] as [number, number, number], // gray-500
  // veg indicators  (border-green-600 / border-red-600, light bg)
  vegBorder:    [22, 163, 74]  as [number, number, number],  // green-600
  nonVegBorder: [220, 38,  38] as [number, number, number],  // red-600
  vegFill:      [240, 253, 244] as [number, number, number], // green-50
  nonVegFill:   [254, 242, 242] as [number, number, number], // red-50
};

export function generateKOTPDF(data: KOTData): Buffer {
  const {
    order, orderItems,
    tableNumber, floorName,
    kotNumber = `KOT-${order.id.substring(0, 8).toUpperCase()}`,
    restaurantName = "Restaurant POS",
    isUpdated = false,
  } = data;

  /* ── Page setup ─────────────────────────────────────────────── */
  const doc    = new jsPDF({ unit: "mm", format: "a5" });
  const PW     = doc.internal.pageSize.getWidth();   // 148 mm
  const margin = 14;
  const inner  = PW - margin * 2;
  let   y      = margin;

  /* ── Helpers ─────────────────────────────────────────────────── */
  const rect = (
    x: number, ry: number, w: number, h: number,
    fill: [number, number, number],
    stroke?: [number, number, number],
    lw = 0.25,
  ) => {
    doc.setFillColor(...fill);
    if (stroke) {
      doc.setDrawColor(...stroke);
      doc.setLineWidth(lw);
      doc.rect(x, ry, w, h, "FD");
    } else {
      doc.rect(x, ry, w, h, "F");
    }
  };

  const hline = (ry: number, color = C.rowDiv, lw = 0.2) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(margin, ry, margin + inner, ry);
  };

  const vline = (x: number, ry: number, h: number, color = C.border, lw = 0.2) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(x, ry, x, ry + h);
  };

  const txt = (
    s: string, x: number, ry: number, size: number,
    style: "normal" | "bold" | "italic",
    color: [number, number, number] = C.valueText,
    align: "left" | "center" | "right" = "left",
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    doc.text(s, x, ry, { align });
  };

  /* ── Branding ────────────────────────────────────────────────── */
  y += 4;
  txt(restaurantName.toUpperCase(), PW / 2, y, 13, "bold", C.titleText, "center");
  y += 5.5;
  txt("Kitchen Order Ticket", PW / 2, y, 8, "normal", C.labelText, "center");
  y += 5;

  /* ── UPDATED banner (shown when KOT is re-sent) ──────────────── */
  if (isUpdated) {
    const bannerH = 7;
    const bannerBg:   [number, number, number] = [255, 237, 213]; // orange-100
    const bannerText: [number, number, number] = [194,  65,  12]; // orange-700
    const bannerBorder: [number, number, number] = [234, 88, 12]; // orange-600
    rect(margin, y, inner, bannerH, bannerBg, bannerBorder, 0.4);
    txt("★  UPDATED KOT  ★", PW / 2, y + bannerH * 0.67, 8, "bold", bannerText, "center");
    y += bannerH + 3;
  }

  // divider line matching the UI
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + inner, y);
  y += 6;

  /* ── Meta table ──────────────────────────────────────────────── */
  const orderDate = order.createdAt instanceof Date
    ? order.createdAt : new Date(order.createdAt || Date.now());

  const typeLabel =
    order.orderType === "dine-in"  ? "Dine-In"  :
    order.orderType === "delivery" ? "Delivery" : "Pickup";

  // Map status exactly as the UI does via getStatus()
  const statusLabel =
    order.status === "completed"       ? "Completed" :
    order.status === "sent_to_kitchen" ? "New"       :
    order.status === "preparing"       ? "Preparing" :
    order.status === "ready"           ? "Ready"     :
    order.status === "served"          ? "Served"    : "New";

  const statusColor: [number, number, number] =
    statusLabel === "New"       ? C.statusAmber  :
    statusLabel === "Preparing" ? C.statusBlue   :
    statusLabel === "Ready"     ? C.statusGreen  :
    statusLabel === "Served"    ? C.statusPurple :
    C.statusGray;

  // same pill bg tints as UI
  const statusBg: [number, number, number] =
    statusLabel === "New"       ? [255, 251, 235] :  // amber-50
    statusLabel === "Preparing" ? [239, 246, 255] :  // blue-50
    statusLabel === "Ready"     ? [240, 253, 244] :  // green-50
    statusLabel === "Served"    ? [250, 245, 255] :  // purple-50
    [243, 244, 246];                                  // gray-100

  type MetaRow = [string, string, boolean?];  // [label, value, isStatus?]
  const metaRows: MetaRow[] = [
    ["KOT No",     kotNumber, false],
    ["Order Date", format(orderDate, "dd/MM/yyyy, hh:mm a"), false],
    ["Type",       typeLabel, false],
  ];
  if (order.orderType === "dine-in" && tableNumber) {
    metaRows.push(["Table", tableNumber, false]);
    if (floorName) metaRows.push(["Floor", floorName, false]);
  }
  if (order.customerName)  metaRows.push(["Customer", order.customerName, false]);
  if (order.customerPhone) metaRows.push(["Phone",    order.customerPhone, false]);
  metaRows.push(["Status", statusLabel, true]);

  const rowH   = 7.5;
  const labelW = 36;

  // outer border — rounded visually via single rect
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, inner, rowH * metaRows.length, "S");

  metaRows.forEach(([label, value, isStatus], idx) => {
    const ry = y + idx * rowH;

    // label cell background (gray-50)
    rect(margin, ry, labelW, rowH, C.labelBg);
    // value cell background (white)
    rect(margin + labelW, ry, inner - labelW, rowH, C.white);

    // label text (gray-500, medium weight)
    txt(label, margin + 3, ry + rowH * 0.65, 7.5, "normal", C.labelText);

    // value — status gets a coloured pill to match UI
    if (isStatus) {
      // draw pill background
      const pillW = 22;
      const pillH = 4.5;
      const pillX = margin + inner - pillW - 2;
      const pillY = ry + (rowH - pillH) / 2;
      doc.setFillColor(...statusBg);
      doc.setDrawColor(...statusBg);
      doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, "F");
      txt(value, margin + inner - pillW / 2 - 2, ry + rowH * 0.65, 7, "bold", statusColor, "center");
    } else {
      const isBold = label === "KOT No";
      txt(value, margin + inner - 3, ry + rowH * 0.65, 7.5, isBold ? "bold" : "normal", C.valueText, "right");
    }

    // row divider (gray-100, skip last)
    if (idx < metaRows.length - 1) {
      doc.setDrawColor(...C.rowDiv);
      doc.setLineWidth(0.2);
      doc.line(margin, ry + rowH, margin + inner, ry + rowH);
    }

    // label / value divider
    vline(margin + labelW, ry, rowH, C.border, 0.25);
  });

  y += rowH * metaRows.length + 7;

  /* ── Items table ─────────────────────────────────────────────── */
  // Column widths: # | Item | Qty  — matches UI: w-8 | flex-1 | w-12
  const colW = { num: 10, qty: 14 };
  const itemColW = inner - colW.num - colW.qty;

  /* Header row — bg-gray-50, text-gray-600, font-semibold */
  const headerH = 8;
  rect(margin,                            y, colW.num,   headerH, C.tblHdrBg, C.border, 0.3);
  rect(margin + colW.num,                 y, itemColW,   headerH, C.tblHdrBg, C.border, 0.3);
  rect(margin + colW.num + itemColW,      y, colW.qty,   headerH, C.tblHdrBg, C.border, 0.3);

  txt("#",   margin + colW.num / 2,               y + headerH * 0.67, 8, "bold", C.tblHdrText, "center");
  txt("Item", margin + colW.num + 3,              y + headerH * 0.67, 8, "bold", C.tblHdrText, "left");
  txt("Qty",  margin + colW.num + itemColW + colW.qty / 2, y + headerH * 0.67, 8, "bold", C.tblHdrText, "center");
  y += headerH;

  /* Item rows */
  orderItems.forEach((item, idx) => {
    const hasNotes = !!(item.notes && item.notes.trim());
    const itemH    = hasNotes ? 11 : 8;

    // white backgrounds with border
    rect(margin,                       y, colW.num,  itemH, C.white, C.border, 0.25);
    rect(margin + colW.num,            y, itemColW,  itemH, C.white, C.border, 0.25);
    rect(margin + colW.num + itemColW, y, colW.qty,  itemH, C.white, C.border, 0.25);

    // col dividers
    vline(margin + colW.num,            y, itemH, C.border, 0.2);
    vline(margin + colW.num + itemColW, y, itemH, C.border, 0.2);

    // # (text-gray-400)
    txt(String(idx + 1), margin + colW.num / 2, y + itemH * 0.6, 7.5, "normal", C.labelText, "center");

    // veg indicator square (border-green/red-600, bg-green/red-50) — matches UI rounded-sm border
    const dotSize = 2.8;
    const dotX    = margin + colW.num + 3;
    const dotY    = y + (hasNotes ? 3.2 : itemH / 2) - dotSize / 2;
    const vegBorder = item.isVeg ? C.vegBorder : C.nonVegBorder;
    const vegFill   = item.isVeg ? C.vegFill   : C.nonVegFill;
    doc.setFillColor(...vegFill);
    doc.setDrawColor(...vegBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(dotX, dotY, dotSize, dotSize, 0.4, 0.4, "FD");

    // item name (text-gray-800)
    const nameX  = dotX + dotSize + 2;
    const nameW  = itemColW - (nameX - (margin + colW.num)) - 2;
    const nameY  = hasNotes ? y + 4.2 : y + itemH * 0.63;
    const lines  = doc.splitTextToSize(item.name, nameW);
    txt(lines[0], nameX, nameY, 7.5, "normal", C.valueText);

    // notes (italic, gray-400, smaller) — matches UI: text-gray-400 italic ml-4 mt-0.5
    if (hasNotes) {
      txt(item.notes!, nameX, y + 8, 6.5, "italic", C.labelText);
    }

    // qty (font-bold, text-gray-800)
    txt(
      String(item.quantity),
      margin + colW.num + itemColW + colW.qty / 2,
      y + itemH * 0.63,
      8, "bold", C.valueText, "center",
    );

    // row bottom divider (gray-100)
    hline(y + itemH, C.rowDiv, 0.2);
    y += itemH;
  });

  /* Total Items footer — border-t border-gray-200 bg-gray-50, font-semibold */
  const footH = 8;
  rect(margin, y, inner, footH, C.labelBg, C.border, 0.3);
  const totalQty = orderItems.reduce((s, i) => s + i.quantity, 0);
  txt("Total Items :", margin + colW.num + 3, y + footH * 0.67, 7.5, "bold", C.labelText);
  txt(String(totalQty), margin + inner - 3, y + footH * 0.67, 8, "bold", C.valueText, "right");
  y += footH;

  /* Total Amount row (if present) — matches UI second tfoot row */
  const totalAmt = orderItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  if (totalAmt > 0) {
    const amtH = 8;
    rect(margin, y, inner, amtH, C.white, C.border, 0.25);
    txt("Total Amount :", margin + colW.num + 3, y + amtH * 0.67, 7.5, "bold", C.labelText);
    txt(`₹${totalAmt.toFixed(2)}`, margin + inner - 3, y + amtH * 0.67, 8, "bold", C.valueText, "right");
    y += amtH;
  }

  /* ── Footer ──────────────────────────────────────────────────── */
  y += 8;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(margin, y, margin + inner, y);
  y += 4.5;
  txt(
    `Printed: ${format(new Date(), "dd/MM/yyyy, hh:mm a")}`,
    PW / 2, y, 6.5, "italic", C.labelText, "center",
  );

  return Buffer.from(doc.output("arraybuffer"));
}
