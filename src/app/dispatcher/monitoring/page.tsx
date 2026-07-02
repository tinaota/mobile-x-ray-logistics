"use client";

import { useMemo } from "react";
import { LiveMap, type LiveMapMarker } from "@/components/domain/LiveMap";
import { RealtimeCounterCard } from "@/components/charts/RealtimeCounterCard";
import { ResponseTimeCard } from "@/components/charts/ResponseTimeCard";
import { MapDensityCard } from "@/components/charts/MapDensityCard";
import { Badge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import { useSpecimens } from "@/lib/hooks/useSpecimens";
import { useServiceLine } from "@/lib/context/ServiceLineContext";
import { SpecimenStabilityBadge } from "@/components/domain/SpecimenStabilityBadge";
import { AlertTriangle, Radio, Droplet } from "lucide-react";
import type { Order } from "@/lib/utils";

type ReportStatus = NonNullable<Order["reportStatus"]>;

const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  pending:   "bg-slate-100 text-slate-500",
  dictated:  "bg-medical-blue/10 text-medical-blue",
  signed:    "bg-green-100 text-green-700",
  delivered: "bg-green-500/15 text-green-800",
};

function ReportStatusBadge({ status = "pending" }: { status?: ReportStatus }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-label font-semibold uppercase tracking-wider ${REPORT_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const MAP_MARKERS: LiveMapMarker[] = [
  { id: "hub",    lat: 33.448, lng: -112.074, type: "hub",        label: "Dispatch HQ"              },
  { id: "t1",     lat: 33.462, lng: -112.052, type: "technician", label: "T. Parker"                },
  { id: "t2",     lat: 33.501, lng: -112.018, type: "technician", label: "M. Rivera"                },
  { id: "t3",     lat: 33.434, lng: -112.108, type: "technician", label: "J. Thompson"              },
  { id: "o1",     lat: 33.479, lng: -112.089, type: "order",      label: "Desert Valley Hospital",  priority: "stat"    },
  { id: "o2",     lat: 33.508, lng: -112.063, type: "order",      label: "Sunrise Medical Center",  priority: "urgent"  },
  { id: "o3",     lat: 33.421, lng: -112.041, type: "order",      label: "Camelback Rehab Center",  priority: "routine" },
];

export default function MonitoringPage() {
  const { serviceLine } = useServiceLine();
  const { orders: rawOrders } = useOrders();
  const { technicians }  = useTechnicians();
  const { byOrderId: specimensByOrder, avgTurnaroundMinutes } = useSpecimens();

  const orders = useMemo(() => {
    if (serviceLine === "all") return rawOrders;
    return rawOrders.filter(o => o.modality === serviceLine);
  }, [rawOrders, serviceLine]);

  const activeOrders  = orders.filter(o => o.status === "in-progress" || o.status === "en-route" || o.status === "in-transit").length;
  const statOrders    = orders.filter(o => o.priority === "stat" && o.status !== "complete" && o.status !== "billed").length;
  const onlineTechs   = technicians.filter(t => t.online).length;
  const completedToday = technicians.reduce((s, t) => s + t.completedToday, 0);

  // Specimens currently in transit — the dispatcher's expiry watchlist
  const specimensInTransit = orders
    .filter(o => o.status === "in-transit" && o.modality === "laboratory")
    .map(o => ({ order: o, specimen: specimensByOrder.get(o.id) }))
    .filter((x): x is { order: Order; specimen: NonNullable<ReturnType<typeof specimensByOrder.get>> } => !!x.specimen);

  return (
    <div className="space-y-5">

      {/* STAT alert banner */}
      {statOrders > 0 && (
        <div className="flex items-center gap-3 bg-emergency-red/10 border border-emergency-red/40 rounded-xl px-4 py-3 animate-pulse-stat">
          <AlertTriangle className="h-4 w-4 text-emergency-red shrink-0" />
          <p className="text-sm font-semibold text-emergency-red">
            {statOrders} STAT {statOrders === 1 ? "order" : "orders"} active — immediate dispatch required
          </p>
        </div>
      )}

      {/* Live metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <RealtimeCounterCard label="Active Orders"    value={activeOrders}   trend={`${orders.length} today`}        trendPositive icon="assignment"     />
        <RealtimeCounterCard label="Techs Online"     value={onlineTechs}    trend={`${technicians.length} total`}   trendPositive icon="groups"         />
        <ResponseTimeCard    value={14.2} target={15} onTrack                className="col-span-1"                                                       />
        <KPICard
          label="Lab TAT"
          value={avgTurnaroundMinutes !== null ? `${avgTurnaroundMinutes}m` : "—"}
          subtext={avgTurnaroundMinutes !== null ? "Avg collection → drop-off" : "No deliveries yet"}
          subIntent={avgTurnaroundMinutes !== null && avgTurnaroundMinutes <= 60 ? "positive" : "neutral"}
        />
        <MapDensityCard      utilization={72}         waitTime="0.3s"        refreshRate="1.1ms"                                                          />
      </div>

      {/* Specimen stability watchlist */}
      {specimensInTransit.length > 0 && (
        <div className="bg-white rounded-xl border border-laboratory-rose/30 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-laboratory-rose/20 bg-laboratory-rose/5 flex items-center gap-2">
            <Droplet className="h-4 w-4 text-laboratory-rose" />
            <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-laboratory-rose">
              Specimens In Transit — Stability Watch
            </h3>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {specimensInTransit.map(({ order, specimen }) => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                <PriorityBadge priority={order.priority} size="sm" animate={order.priority === "stat"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{order.patientName}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {order.assignedTech ?? "Unassigned"} → {order.facilityName}
                  </p>
                </div>
                <span className="font-mono text-xs text-on-surface-variant shrink-0">{specimen.accessionNumber}</span>
                <SpecimenStabilityBadge specimen={specimen} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live map — full width */}
      <LiveMap markers={MAP_MARKERS} height="h-96" showLegend />

      {/* Active order stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Active + en-route orders */}
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/50">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-medical-blue" />
              <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">Live Order Feed</h3>
            </div>
            <Badge variant="secondary" size="sm">{activeOrders} active</Badge>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {orders.filter(o => o.status !== "complete" && o.status !== "billed").slice(0, 6).map(order => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                <PriorityBadge priority={order.priority} size="sm" animate={order.priority === "stat"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{order.patientName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{order.facilityName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-on-surface-variant">{order.scheduledTime}</span>
                  <OrderStatusBadge status={order.status} size="sm" />
                  {order.modality === "laboratory" && specimensByOrder.get(order.id) ? (
                    <SpecimenStabilityBadge specimen={specimensByOrder.get(order.id)!} />
                  ) : (
                    <ReportStatusBadge status={order.reportStatus} />
                  )}
                </div>
              </div>
            ))}
            {orders.filter(o => o.status !== "complete").length === 0 && (
              <p className="px-5 py-6 text-sm text-on-surface-variant text-center">No active orders</p>
            )}
          </div>
        </div>

        {/* Field unit status */}
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50">
            <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">Field Unit Status</h3>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {technicians.map(tech => (
              <div key={tech.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${tech.online ? "bg-green-500" : "bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{tech.name}</p>
                  <p className="text-xs text-on-surface-variant">{tech.zone} · {tech.activeOrders} active</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-on-surface-variant">
                  <span className={
                    (tech.batteryLevel ?? 100) > 50 ? "text-green-600"
                    : (tech.batteryLevel ?? 100) > 20 ? "text-warning-amber"
                    : "text-emergency-red"
                  }>{tech.batteryLevel ?? "—"}%</span>
                  <span className="font-mono text-xs font-bold text-on-surface">{tech.completedToday} done</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-outline-variant/30 bg-surface-container/30">
            <p className="text-xs text-on-surface-variant font-mono">{completedToday} orders completed today across all techs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
