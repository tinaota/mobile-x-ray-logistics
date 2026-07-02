import { cn } from "@/lib/utils";
import type { OrderStatus, Priority, SyncStatus } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
}

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending:     { label: "Pending",     className: "bg-warning-amber/20 text-amber-700 border-warning-amber/30" },
  assigned:    { label: "Assigned",    className: "bg-blue-100 text-blue-700 border-blue-200" },
  "en-route":  { label: "En Route",   className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  "in-progress": { label: "In Progress", className: "bg-green-100 text-green-700 border-green-200" },
  "in-transit":  { label: "In Transit",  className: "bg-laboratory-rose/10 text-laboratory-rose border-laboratory-rose/20" },
  complete:    { label: "Complete",    className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  billed:      { label: "Billed",     className: "bg-surface-container-high text-on-surface-variant border-outline-variant" },
};

export function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const config = orderStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center font-label font-semibold uppercase tracking-wider border rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const priorityConfig: Record<Priority, { label: string; className: string; dot: string }> = {
  stat:    { label: "STAT",    className: "bg-emergency-red text-white",         dot: "bg-white" },
  urgent:  { label: "URGENT",  className: "bg-warning-amber text-midnight-navy", dot: "bg-midnight-navy" },
  routine: { label: "ROUTINE", className: "bg-surface-container-high text-on-surface-variant", dot: "bg-on-surface-variant" },
};

export function PriorityBadge({ priority, size = "md", animate }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const showAnimate = animate && priority === "stat";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-label font-bold uppercase tracking-widest rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : size === "lg" ? "text-sm px-4 py-1.5" : "text-xs px-3 py-1",
        config.className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          config.dot,
          showAnimate && "animate-pulse"
        )}
      />
      {config.label}
    </span>
  );
}

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

const syncConfig: Record<SyncStatus, { label: string; className: string }> = {
  synced:   { label: "Synced",   className: "bg-green-100 text-green-700" },
  pending:  { label: "Syncing",  className: "bg-blue-100 text-blue-600" },
  conflict: { label: "Conflict", className: "bg-orange-100 text-orange-700" },
  offline:  { label: "Offline",  className: "bg-slate-100 text-slate-600" },
};

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const config = syncConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold font-label uppercase tracking-wider px-2 py-0.5 rounded-full",
        config.className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "synced"  && "bg-green-600",
          status === "pending" && "bg-blue-500 animate-pulse",
          status === "conflict" && "bg-orange-500",
          status === "offline" && "bg-slate-500"
        )}
      />
      {config.label}
    </span>
  );
}
