"use client";

import { useState } from "react";
import { OrderCard } from "@/components/domain/OrderCard";
import { OrderDetailSheet } from "@/components/domain/OrderDetailSheet";
import { StatCard } from "@/components/ui/StatCard";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import type { Order } from "@/lib/utils";
import { ClipboardList, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

const STATUS_ORDER = ["in-progress", "assigned", "pending", "en-route", "complete"] as const;

function sortManifest(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status as typeof STATUS_ORDER[number]);
    const bi = STATUS_ORDER.indexOf(b.status as typeof STATUS_ORDER[number]);
    if (ai !== bi) return ai - bi;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });
}

export default function ManifestPage() {
  const { orders, loading, error } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const manifest = orders.filter(o => o.assignedTech === "T. Parker");
  const sorted = sortManifest(manifest);

  const completed  = manifest.filter(o => o.status === "complete").length;
  const inProgress = manifest.filter(o => o.status === "in-progress").length;
  const remaining  = manifest.filter(o => o.status === "assigned" || o.status === "pending").length;

  if (error) return (
    <div className="flex items-center justify-center h-40 text-emergency-red text-sm">
      Failed to load manifest: {error}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Done"      value={completed}  icon={<CheckCircle className="h-5 w-5 text-green-600" />}        iconBg="bg-green-50" />
        <StatCard label="Active"    value={inProgress}  icon={<Clock className="h-5 w-5 text-warning-amber" />}          iconBg="bg-amber-50" />
        <StatCard label="Remaining" value={remaining}   icon={<ClipboardList className="h-5 w-5 text-medical-blue" />}   iconBg="bg-blue-50"  />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
          {loading
            ? <span className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Loading…</span>
            : `${manifest.length} Orders · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`
          }
        </h2>
        <SyncStatusBadge status="synced" />
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
          ))
        ) : sorted.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            compact
            onView={() => setSelectedOrder(order)}
            className={
              order.status === "in-progress"  ? "ring-2 ring-medical-blue/40 border-l-4 border-medical-blue"
              : order.status === "complete"   ? "opacity-60 border-l-4 border-green-400"
              : order.priority === "stat"     ? "border-l-4 border-emergency-red"
              : order.priority === "urgent"   ? "border-l-4 border-warning-amber"
              : "border-l-4 border-outline-variant"
            }
          />
        ))}
      </div>

      {!loading && completed === manifest.length && manifest.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-on-surface">All orders complete for today</p>
          <p className="text-xs text-on-surface-variant">Great work — data will sync when you return to base.</p>
        </div>
      )}

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <AlertCircle className="h-4 w-4 text-medical-blue shrink-0 mt-0.5" />
        <p className="text-xs text-medical-blue">Manifest cached locally. Changes sync automatically when online.</p>
      </div>

      <OrderDetailSheet
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
