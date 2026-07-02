import { cn } from "@/lib/utils";
import type { Order, Specimen } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { SpecimenStabilityBadge } from "@/components/domain/SpecimenStabilityBadge";
import { Button } from "@/components/ui/Button";
import { MapPin, Clock, User, Phone, Droplet, Zap } from "lucide-react";

interface OrderCardProps {
  order: Order;
  /** Chain-of-custody record — renders a live stability countdown when present. */
  specimen?: Specimen;
  onAssign?: (order: Order) => void;
  onView?: (order: Order) => void;
  compact?: boolean;
  className?: string;
}

export function OrderCard({ order, specimen, onAssign, onView, compact, className }: OrderCardProps) {
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
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {order.modality === "laboratory" && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-laboratory-rose/10 text-laboratory-rose font-mono text-[9px] font-bold uppercase tracking-wider border border-laboratory-rose/20">
                <Droplet className="h-2.5 w-2.5" /> Lab
              </span>
            )}
            {order.modality === "radiology" && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-radiology-indigo/10 text-radiology-indigo font-mono text-[9px] font-bold uppercase tracking-wider border border-radiology-indigo/20">
                <Zap className="h-2.5 w-2.5" /> Rad
              </span>
            )}
            <PriorityBadge priority={order.priority} animate size="sm" />
            <OrderStatusBadge status={order.status} size="sm" />
            {specimen && <SpecimenStabilityBadge specimen={specimen} />}
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
