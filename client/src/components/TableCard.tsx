import { Users, Clock, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

const tableTimerStore = new Map<string, { startTime: number; orderId: string | null }>();

interface TableCardProps {
  id: string;
  tableNumber: string;
  status: "free" | "occupied" | "preparing" | "ready" | "reserved" | "served";
  seats: number;
  currentGuests?: number;
  orderStartTime?: string | null;
  onClick: (id: string) => void;
  onToggleServed?: (id: string) => void;
  onViewOrder?: (id: string) => void;
  onBilling?: (id: string) => void;
}

const statusConfig: Record<string, { borderColor: string; circleColor: string; circleBorder: string; label: string }> = {
  free: {
    borderColor: "border-black",
    circleColor: "bg-white",
    circleBorder: "border-black",
    label: "Available",
  },
  occupied: {
    borderColor: "border-black",
    circleColor: "bg-[#ff2400]",
    circleBorder: "border-[#ff2400]",
    label: "Occupied",
  },
  // Legacy statuses mapped to occupied for display
  preparing: {
    borderColor: "border-black",
    circleColor: "bg-[#ff2400]",
    circleBorder: "border-[#ff2400]",
    label: "Occupied",
  },
  ready: {
    borderColor: "border-black",
    circleColor: "bg-[#ff2400]",
    circleBorder: "border-[#ff2400]",
    label: "Occupied",
  },
  reserved: {
    borderColor: "border-black",
    circleColor: "bg-[#ff2400]",
    circleBorder: "border-[#ff2400]",
    label: "Occupied",
  },
  served: {
    borderColor: "border-black",
    circleColor: "bg-[#ff2400]",
    circleBorder: "border-[#ff2400]",
    label: "Occupied",
  },
};

export default function TableCard({
  id,
  tableNumber,
  status,
  seats,
  currentGuests,
  orderStartTime,
  onClick,
  onToggleServed,
  onViewOrder,
  onBilling,
}: TableCardProps) {
  const config = statusConfig[status];
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    const isOccupied = status !== "free";
    if (!orderStartTime || !isOccupied) {
      if (tableTimerStore.has(id)) {
        tableTimerStore.delete(id);
      }
      setElapsedTime(0);
      return;
    }

    const existingTimer = tableTimerStore.get(id);
    const currentOrderId = orderStartTime;
    
    if (!existingTimer || existingTimer.orderId !== currentOrderId) {
      tableTimerStore.set(id, {
        startTime: Date.now(),
        orderId: currentOrderId
      });
    }

    const timerData = tableTimerStore.get(id)!;

    const updateTime = () => {
      const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
      setElapsedTime(Math.max(0, elapsed));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [id, orderStartTime, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    onClick(id);
  };

  const handleServedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleServed) {
      onToggleServed(id);
    }
  };

  const handleViewOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewOrder) {
      onViewOrder(id);
    }
  };

  const handleBilling = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBilling) {
      onBilling(id);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        data-testid={`table-${id}`}
        className={cn(
          "relative w-full p-4 rounded-lg border-2 bg-white transition-all hover:shadow-xl hover:scale-105 active:scale-95 min-w-32",
          config.borderColor
        )}
      >
        <div className="absolute top-1 left-1 z-10 flex items-center gap-1 text-black text-xs font-bold">
          <Users className="h-3 w-3" />
          <span>{seats}</span>
        </div>
        {status !== "free" && orderStartTime && (
          <div className="absolute top-1 right-1 z-10 flex items-center gap-1 text-xs font-mono font-semibold text-black">
            <Clock className="h-3 w-3" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all",
            config.circleColor,
            config.circleBorder,
            status !== "free" && "border-black",
            status === "free" && "text-black"
          )}>
            <span 
              className={cn(
                "text-2xl font-semibold",
                status === "free" ? "text-black" : "text-white"
              )}
              style={status !== "free" ? {
                textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
              } : {}}
            >{tableNumber}</span>
          </div>
          <div className="text-center w-full">
            <p className="text-xs font-semibold uppercase text-black">{config.label}</p>
          </div>
        </div>
      </button>
      
    </div>
  );
}