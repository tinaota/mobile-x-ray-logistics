import { cn } from "@/lib/utils";
import type { OrderStatus, Priority } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { MapPin, Clock, User, Phone } from "lucide-react";

export interface Order {
  id: string;
  patientName: string;
  facilityName: string;
  address: string;
  procedure: string;
  cptCode: string;
  priority: Priority;
  status: OrderStatus;
  scheduledTime: string;
  distance?: string;
  assignedTech?: string;
  phone?: string;
}

interface OrderCardProps {
  order: Order;
  onAssign?: (order: Order) => void;
  onView?: (order: Order) => void;
  compact?: boolean;
  className?: string;
}

export function OrderCard({ order, onAssign, onView, compact, className }: OrderCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-card-md transition-shadow",
        order.priority === "stat" && "ring-1 ring-emergency-red/30",
        className
      )}
      onClick={() => onView?.(order)}
    >
      <CardContent className={cn("space-y-3", compact ? "py-3" : "py-4")}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{order.patientName}</p>
            <p className="text-xs text-on-surface-variant truncate">{order.facilityName}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge priority={order.priority} animate size="sm" />
            <OrderStatusBadge status={order.status} size="sm" />
          </div>
        </div>

        {/* Procedure */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface">{order.procedure}</span>
          <span className="code-mono text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
            {order.cptCode}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {order.scheduledTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {order.distance ?? order.address}
          </span>
          {order.assignedTech && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {order.assignedTech}
            </span>
          )}
          {order.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {order.phone}
            </span>
          )}
        </div>
      </CardContent>

      {!compact && (onAssign || onView) && (
        <CardFooter onClick={(e) => e.stopPropagation()}>
          {onAssign && order.status === "pending" && (
            <Button variant="primary" size="sm" onClick={() => onAssign(order)}>
              Assign
            </Button>
          )}
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(order)}>
              View Details
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
