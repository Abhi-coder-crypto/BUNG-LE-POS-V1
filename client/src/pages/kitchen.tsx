import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronDown, ChevronUp, Menu, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, OrderItem as DBOrderItem, Table } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const kitchenTimerStore = new Map<string, { startTime: number; itemIds: string[] }>();

interface OrderWithDetails {
  order: Order;
  items: DBOrderItem[];
  tableNumber: string;
}

export default function KitchenPage() {
  const { data: activeOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/active"],
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  const orderItemQueries = useQueries({
    queries: activeOrders.map((order) => ({
      queryKey: ["/api/orders", order.id, "items"],
      queryFn: async () => {
        const res = await fetch(`/api/orders/${order.id}/items`);
        return await res.json() as DBOrderItem[];
      },
    })),
  });

  const ordersWithDetails = useMemo(() => {
    if (orderItemQueries.some(q => q.isLoading)) {
      return [];
    }

    return activeOrders.map((order, index) => {
      const items = orderItemQueries[index]?.data || [];

      let tableNumber = "";
      if (order.tableId) {
        const table = tables.find(t => t.id === order.tableId);
        tableNumber = table?.tableNumber || "Unknown";
      } else if (order.orderType === "delivery") {
        tableNumber = "Delivery";
      } else {
        tableNumber = "Pickup";
      }

      return { order, items, tableNumber };
    });
  }, [activeOrders, orderItemQueries, tables]);

  const isLoading = orderItemQueries.some(q => q.isLoading);

  const totalOrdered = ordersWithDetails.length;

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader title="Kitchen Display System" showSearch={false} />

      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-4 hidden md:flex">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger"></div>
              <span className="text-sm">
                Ordered <Badge variant="secondary">{totalOrdered}</Badge>
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden" data-testid="button-status-menu">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Order Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger"></div>
                  <span>Ordered</span>
                </div>
                <Badge variant="secondary">{totalOrdered}</Badge>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Current KOT - Ordered</h2>
              {ordersWithDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No current orders</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {ordersWithDetails.map(({ order, items, tableNumber }) => (
                    <KitchenOrderCard
                      key={order.id}
                      orderId={order.id}
                      order={order}
                      tableNumber={tableNumber}
                      orderTime={new Date(order.createdAt)}
                      items={items}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface KitchenOrderCardProps {
  orderId: string;
  order: Order;
  tableNumber: string;
  orderTime: Date;
  items: DBOrderItem[];
}

function KitchenOrderCard({
  orderId,
  order,
  tableNumber,
  orderTime,
  items,
}: KitchenOrderCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isItemsCollapsed, setIsItemsCollapsed] = useState(false);

  const currentItemIds = items.map(i => i.id).sort();

  if (!kitchenTimerStore.has(orderId)) {
    kitchenTimerStore.set(orderId, {
      startTime: orderTime.getTime(),
      itemIds: currentItemIds,
    });
  }

  useEffect(() => {
    const timerData = kitchenTimerStore.get(orderId)!;
    const updateTime = () => {
      const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
      setElapsedTime(Math.max(0, elapsed));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [orderId, orderTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="bg-card rounded-lg border-2 overflow-hidden border-danger bg-danger"
      data-testid={`kds-order-${orderId}`}
    >
      <div className="p-3 text-white bg-danger">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">Order #{orderId.substring(0, 8)}</h3>
              {order.orderType && order.orderType !== "dine-in" && (
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {order.orderType === "delivery" ? "DELIVERY" : "PICKUP"}
                </Badge>
              )}
              {order.customerPhone && order.orderType === "dine-in" && (
                <Badge
                  className="bg-primary text-primary-foreground border-primary/30 text-xs font-semibold flex items-center gap-1"
                  data-testid={`badge-digital-menu-${orderId}`}
                >
                  <Smartphone className="h-3 w-3" />
                  DIGITAL MENU
                </Badge>
              )}
            </div>
            <p className="text-sm opacity-90">
              {order.orderType === "dine-in" ? `Table ${tableNumber}` : tableNumber}
            </p>
            {order.customerName && (
              <p className="text-xs opacity-75 mt-0.5">{order.customerName} • {order.customerPhone}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-card">
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => setIsItemsCollapsed(!isItemsCollapsed)}
            data-testid={`button-toggle-items-${orderId}`}
          >
            <span className="text-sm font-medium text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
            {isItemsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!isItemsCollapsed && (
          <div className="space-y-2 mb-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {item.quantity}x
                    </Badge>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1 ml-12 italic">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center py-2 font-semibold text-danger">
          ● Ordered
        </div>
      </div>
    </div>
  );
}
