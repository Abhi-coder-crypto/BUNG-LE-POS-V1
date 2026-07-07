import { useMemo, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, Table2, Truck, ShoppingBag, Clock, CheckCircle2, ChefHat, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, OrderItem, Table, Floor } from "@shared/schema";
import { format } from "date-fns";

interface KOTTicket {
  order: Order;
  items: OrderItem[];
  tableNumber: string;
  floorName: string;
  kotNumber: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  sent_to_kitchen: { label: "New",       color: "bg-orange-100 text-orange-700 border-orange-200" },
  preparing:       { label: "Preparing", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ready:           { label: "Ready",     color: "bg-green-100 text-green-700 border-green-200" },
  served:          { label: "Served",    color: "bg-purple-100 text-purple-700 border-purple-200" },
  completed:       { label: "Completed", color: "bg-gray-100 text-gray-600 border-gray-200" },
  saved:           { label: "Saved",     color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

function getStatusConfig(order: Order, items: OrderItem[]) {
  if (order.status === "completed") return statusConfig.completed;
  const allServed = items.length > 0 && items.every(i => i.status === "served");
  if (allServed) return statusConfig.served;
  const anyPreparing = items.some(i => i.status === "preparing");
  if (anyPreparing) return statusConfig.preparing;
  const allReady = items.length > 0 && items.every(i => i.status === "ready" || i.status === "served");
  if (allReady) return statusConfig.ready;
  return statusConfig[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600 border-gray-200" };
}

export default function KOTPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const { data: activeOrders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders/active"] });
  const { data: completedOrders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders/completed"] });
  const { data: tables = [] } = useQuery<Table[]>({ queryKey: ["/api/tables"] });
  const { data: floors = [] } = useQuery<Floor[]>({ queryKey: ["/api/floors"] });

  // Filter active orders to only those sent to kitchen (KOT'd)
  const kitchenOrders = useMemo(() =>
    activeOrders.filter(o =>
      ["sent_to_kitchen", "preparing", "ready", "served"].includes(o.status)
    ),
    [activeOrders]
  );

  const activeItemQueries = useQueries({
    queries: kitchenOrders.map(order => ({
      queryKey: ["/api/orders", order.id, "items"],
      queryFn: async () => {
        const res = await fetch(`/api/orders/${order.id}/items`);
        return res.json() as Promise<OrderItem[]>;
      },
    })),
  });

  const completedItemQueries = useQueries({
    queries: completedOrders.map(order => ({
      queryKey: ["/api/orders", order.id, "items"],
      queryFn: async () => {
        const res = await fetch(`/api/orders/${order.id}/items`);
        return res.json() as Promise<OrderItem[]>;
      },
    })),
  });

  const buildTickets = (orders: Order[], itemQueryResults: typeof activeItemQueries, startIdx: number): KOTTicket[] =>
    orders.map((order, i) => {
      const items = itemQueryResults[i]?.data ?? [];
      const table = tables.find(t => t.id === order.tableId);
      const floor = floors.find(f => f.id === table?.floorId);

      let tableNumber = "";
      let floorName = "";
      if (order.orderType === "dine-in" && table) {
        tableNumber = `Table ${table.tableNumber}`;
        floorName = floor?.name ?? "";
      } else if (order.orderType === "delivery") {
        tableNumber = "Delivery";
        floorName = order.customerName ?? "";
      } else {
        tableNumber = "Pickup";
        floorName = order.customerName ?? "";
      }

      const kotNumber = `KOT-${String(startIdx + i + 1).padStart(4, "0")}`;
      return { order, items, tableNumber, floorName, kotNumber };
    });

  const allTickets = useMemo(() => {
    const active = buildTickets(kitchenOrders, activeItemQueries, 0);
    const done   = buildTickets(completedOrders, completedItemQueries, kitchenOrders.length);
    // Sort newest first
    return [...active, ...done].sort(
      (a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchenOrders, completedOrders, activeItemQueries, completedItemQueries, tables, floors]);

  const filtered = useMemo(() => {
    let list = allTickets;
    if (filter === "active")    list = list.filter(t => t.order.status !== "completed");
    if (filter === "completed") list = list.filter(t => t.order.status === "completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.kotNumber.toLowerCase().includes(q) ||
        t.tableNumber.toLowerCase().includes(q) ||
        t.floorName.toLowerCase().includes(q) ||
        t.items.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allTickets, filter, search]);

  const counts = useMemo(() => ({
    all:       allTickets.length,
    active:    allTickets.filter(t => t.order.status !== "completed").length,
    completed: allTickets.filter(t => t.order.status === "completed").length,
  }), [allTickets]);

  const handleDownloadPDF = async (orderId: string, kotNumber: string) => {
    const res = await fetch(`/api/orders/${orderId}/kot/pdf`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kotNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <AppHeader title="KOT" showSearch={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Page heading */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
            <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kitchen Order Tickets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">All KOT records sent from POS</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by table, item or KOT no..."
              className="pl-9 bg-white dark:bg-gray-900"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "completed"] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={cn(filter === f && "bg-orange-600 hover:bg-orange-700 border-orange-600")}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={cn(
                  "ml-1.5 text-xs rounded-full px-1.5 py-0.5",
                  filter === f ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                )}>
                  {counts[f]}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tickets grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <ChefHat className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No KOT tickets found</p>
            <p className="text-sm mt-1">KOT tickets will appear here when orders are sent from the POS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(ticket => {
              const statusCfg = getStatusConfig(ticket.order, ticket.items);
              const createdAt = new Date(ticket.order.createdAt);

              return (
                <div
                  key={ticket.order.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Ticket header */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-bold text-sm text-orange-700 dark:text-orange-300">
                        {ticket.kotNumber}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium border", statusCfg.color)}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Table / type info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ticket.order.orderType === "dine-in" ? (
                        <Table2 className="h-4 w-4 text-purple-500" />
                      ) : ticket.order.orderType === "delivery" ? (
                        <Truck className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ShoppingBag className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {ticket.tableNumber}
                        </p>
                        {ticket.floorName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.floorName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{format(createdAt, "hh:mm a")}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="px-4 py-3 flex-1 space-y-1.5">
                    {ticket.items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No items</p>
                    ) : (
                      ticket.items.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {/* Veg/Non-veg dot */}
                            <span className={cn(
                              "flex-shrink-0 h-2.5 w-2.5 rounded-sm border mt-0.5",
                              item.isVeg
                                ? "border-green-600 bg-green-100"
                                : "border-red-600 bg-red-100"
                            )} />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                            {item.notes && (
                              <span className="text-xs text-gray-400 italic truncate">({item.notes})</span>
                            )}
                          </div>
                          <span className="flex-shrink-0 text-sm font-bold text-gray-800 dark:text-gray-200">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{format(createdAt, "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {ticket.items.reduce((s, i) => s + i.quantity, 0)} items
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gray-400 hover:text-orange-600"
                        title="Download KOT PDF"
                        onClick={() => handleDownloadPDF(ticket.order.id, ticket.kotNumber)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
