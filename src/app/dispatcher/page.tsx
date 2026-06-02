"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { KPICard } from "@/components/ui/KPICard";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge, OrderStatusBadge, SyncStatusBadge } from "@/components/ui/StatusBadge";
import { OrderCard } from "@/components/domain/OrderCard";
import { TechnicianCard } from "@/components/domain/TechnicianCard";
import { LiveMap } from "@/components/domain/LiveMap";
import type { LiveMapMarker } from "@/components/domain/LiveMap";
import { DailyJobVolumeChart } from "@/components/charts/DailyJobVolumeChart";
import { TechnicianActivityChart } from "@/components/charts/TechnicianActivityChart";
import { RealtimeCounterCard } from "@/components/charts/RealtimeCounterCard";
import { ResponseTimeCard } from "@/components/charts/ResponseTimeCard";
import { MapDensityCard } from "@/components/charts/MapDensityCard";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import { useMessages, useAllMessages } from "@/lib/hooks/useMessages";
import type { Order, Technician } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Radio, Battery, MapPin, ShieldCheck,
  Clock, RefreshCw, LayoutDashboard, Users,
  Send, Plus, CheckCheck, MessageCircle, Phone,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
type ReportStatus = "pending" | "dictated" | "signed" | "delivered";
const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  pending:   "bg-slate-100 text-slate-500",
  dictated:  "bg-medical-blue/10 text-medical-blue",
  signed:    "bg-green-100 text-green-700",
  delivered: "bg-green-500/15 text-green-800",
};
function ReportStatusBadge({ status = "pending" }: { status?: ReportStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-label font-semibold uppercase tracking-wider",
      REPORT_STATUS_STYLES[status]
    )}>
      {status}
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Static constants ──────────────────────────────────────────────────────────
const HUB_COORDS = { lng: -112.074, lat: 33.4484 };
const TECH_COORDS: Record<string, { lng: number; lat: number }> = {
  default_0: { lng: -112.052, lat: 33.462 },
  default_1: { lng: -112.089, lat: 33.441 },
  default_2: { lng: -112.031, lat: 33.478 },
  default_3: { lng: -112.058, lat: 33.495 },
  default_4: { lng: -112.021, lat: 33.453 },
};
const ORDER_COORDS: Record<string, { lng: number; lat: number }> = {
  default_0: { lng: -112.063, lat: 33.455 },
  default_1: { lng: -112.101, lat: 33.433 },
  default_2: { lng: -112.044, lat: 33.479 },
  default_3: { lng: -112.078, lat: 33.462 },
};
const MONITORING_MARKERS: LiveMapMarker[] = [
  { id: "hub", lat: 33.448,  lng: -112.074, type: "hub",        label: "Dispatch HQ"             },
  { id: "t1",  lat: 33.462,  lng: -112.052, type: "technician", label: "T. Parker"               },
  { id: "t2",  lat: 33.501,  lng: -112.018, type: "technician", label: "M. Rivera"               },
  { id: "t3",  lat: 33.434,  lng: -112.108, type: "technician", label: "J. Thompson"             },
  { id: "o1",  lat: 33.479,  lng: -112.089, type: "order",      label: "Desert Valley Hospital", priority: "stat"    },
  { id: "o2",  lat: 33.508,  lng: -112.063, type: "order",      label: "Sunrise Medical Center", priority: "urgent"  },
  { id: "o3",  lat: 33.421,  lng: -112.041, type: "order",      label: "Camelback Rehab Center", priority: "routine" },
];
const QUICK_CHIPS = ["REQUEST ETA", "REROUTE SENT", "EN ROUTE?", "NOTIFY FACILITY", "CALL TECH"];

type UnitFilter = "all" | "online" | "offline";

// ─────────────────────────────────────────────────────────────────────────────
export default function DispatcherHub() {
  // ── Shared data ──────────────────────────────────────────────────────────
  const { orders, loading: oLoading, assignOrder } = useOrders();
  const { technicians, loading: tLoading, error: techError } = useTechnicians();
  const { unreadByOrder, lastByOrder } = useAllMessages();
  const loading = oLoading || tLoading;

  // ── Fleet tab ─────────────────────────────────────────────────────────────
  const [assignTarget,   setAssignTarget]   = useState<Order | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [mapSelectedId,  setMapSelectedId]  = useState<string | null>(null);

  // ── Field Units tab ───────────────────────────────────────────────────────
  const [unitFilter,   setUnitFilter]   = useState<UnitFilter>("all");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  // ── Messages tab ──────────────────────────────────────────────────────────
  const [msgSelectedId, setMsgSelectedId] = useState<string | null>(null);
  const [msgInput,      setMsgInput]      = useState("");
  const [smsMode,       setSmsMode]       = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgActiveOrders = orders.filter(o => o.status !== "complete" && o.status !== "billed");
  const msgSelectedOrder = orders.find(o => o.id === msgSelectedId) ?? null;
  const { messages, sendMessage, sendSms } = useMessages(msgSelectedId);

  useEffect(() => {
    if (!msgSelectedId && msgActiveOrders.length > 0) setMsgSelectedId(msgActiveOrders[0].id);
  }, [msgActiveOrders, msgSelectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!msgInput.trim()) return;
    if (smsMode && msgSelectedOrder?.phone) {
      await sendSms(msgSelectedOrder.phone, msgInput);
    } else {
      await sendMessage(msgInput);
    }
    setMsgInput("");
  };

  // ── Shared computed values ────────────────────────────────────────────────
  const statOrders    = orders.filter(o => o.priority === "stat"    && o.status !== "complete" && o.status !== "billed");
  const urgentOrders  = orders.filter(o => o.priority === "urgent"  && o.status !== "complete" && o.status !== "billed");
  const routineOrders = orders.filter(o => o.priority === "routine" && o.status !== "complete" && o.status !== "billed");
  const activeCount   = orders.filter(o => o.status !== "complete" && o.status !== "billed").length;
  const pendingCount  = orders.filter(o => o.status === "pending").length;
  const onlineTechs   = technicians.filter(t => t.online).length;
  const offlineTechs  = technicians.length - onlineTechs;
  const completedToday = technicians.reduce((s, t) => s + t.completedToday, 0);
  const activeOrders  = orders.filter(o => o.status === "in-progress" || o.status === "en-route").length;
  const totalUnread   = Object.values(unreadByOrder).reduce((s, n) => s + n, 0);

  // ── Fleet map markers ─────────────────────────────────────────────────────
  const fleetMarkers = useMemo<LiveMapMarker[]>(() => {
    const markers: LiveMapMarker[] = [
      { id: "hub", lng: HUB_COORDS.lng, lat: HUB_COORDS.lat, type: "hub", label: "Dispatch HQ" },
    ];
    technicians.filter(t => t.online).forEach((t, i) => {
      const lat = t.latitude ?? TECH_COORDS[`default_${i}`]?.lat ?? HUB_COORDS.lat;
      const lng = t.longitude ?? TECH_COORDS[`default_${i}`]?.lng ?? HUB_COORDS.lng;
      markers.push({ id: t.id, lng: lng, lat: lat, type: "technician", label: t.name, status: t.syncStatus });
    });
    orders.filter(o => o.status === "pending" || o.status === "assigned").slice(0, 4).forEach((o, i) => {
      const c = ORDER_COORDS[`default_${i}`] ?? HUB_COORDS;
      markers.push({ id: o.id, lng: c.lng, lat: c.lat, type: "order", label: o.id, priority: o.priority, status: o.status });
    });
    return markers;
  }, [orders, technicians]);

  const filteredTechs = technicians.filter(t =>
    unitFilter === "all" ? true : unitFilter === "online" ? t.online : !t.online
  );

  const confirmAssign = async () => {
    if (!assignTarget || !selectedTechId) return;
    const tech = technicians.find(t => t.id === selectedTechId);
    if (tech) await assignOrder(assignTarget.id, tech.id, tech.name);
    setAssignTarget(null);
    setSelectedTechId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Tabs defaultValue="fleet" className="space-y-0">

      {/* ── Tab header — full-width breakout ─────────────────────────────── */}
      <div className="bg-white border-b border-outline-variant/40 shadow-sm -mx-6 px-6 mb-6">
        <TabsList className="border-b-0 gap-0 px-0">

          <TabsTrigger value="fleet" className="flex items-center gap-2 px-5 py-4 text-sm">
            <LayoutDashboard className="h-4 w-4" />
            Fleet
            <span className="ml-0.5 font-mono text-[10px] bg-medical-blue/10 text-medical-blue px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          </TabsTrigger>

          <TabsTrigger value="monitoring" className="flex items-center gap-2 px-5 py-4 text-sm">
            <Radio className="h-4 w-4" />
            Live Monitoring
            {statOrders.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-emergency-red animate-pulse ml-0.5" />
            )}
          </TabsTrigger>

          <TabsTrigger value="field-units" className="flex items-center gap-2 px-5 py-4 text-sm">
            <Users className="h-4 w-4" />
            Field Units
            <span className="ml-0.5 font-mono text-[10px] bg-green-500/10 text-green-700 px-1.5 py-0.5 rounded-full">
              {onlineTechs} online
            </span>
          </TabsTrigger>

          <TabsTrigger value="messages" className="flex items-center gap-2 px-5 py-4 text-sm">
            <MessageCircle className="h-4 w-4" />
            Messages
            {totalUnread > 0 && (
              <span className="ml-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-emergency-red text-white text-[9px] font-bold flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </TabsTrigger>

        </TabsList>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — FLEET
      ══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="fleet">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Active Orders"      value={loading ? "—" : String(activeCount)}                    subtext={`${pendingCount} unassigned`}   subIntent="warning"  subIcon="warning"     />
            <KPICard label="Technicians Online" value={loading ? "—" : `${onlineTechs}/${technicians.length}`} subtext={`${onlineTechs} available`}     subIntent="positive" subIcon="trending_up" />
            <KPICard label="Avg Response Time"  value="14 min"                                                 subtext="↓ 2 min from yesterday"         subIntent="positive" subIcon="speed"       />
            <KPICard label="Completion Rate"    value="94%"                                                    subtext="Above 90% target"               subIntent="positive" subIcon="trending_up" />
          </div>

          <LiveMap
            markers={fleetMarkers}
            height="h-80"
            showLegend
            selectedMarkerId={mapSelectedId ?? undefined}
            onMarkerClick={m => setMapSelectedId(prev => prev === m.id ? null : m.id)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {statOrders.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <PriorityBadge priority="stat" animate />
                        <span className="text-xs font-label font-semibold text-emergency-red uppercase tracking-wider">{statOrders.length} Critical</span>
                      </div>
                      <div className="space-y-2">
                        {statOrders.map(o => (
                        <div key={o.id} onClick={() => setMapSelectedId(p => p === o.id ? null : o.id)} className="cursor-pointer">
                          <OrderCard order={o} onAssign={setAssignTarget} compact className={cn("border-l-4 border-emergency-red animate-pulse-stat", mapSelectedId === o.id && "ring-2 ring-emergency-red/50 ring-offset-1")} />
                        </div>
                      ))}
                      </div>
                    </section>
                  )}
                  {urgentOrders.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <PriorityBadge priority="urgent" />
                        <span className="text-xs font-label font-semibold text-warning-amber uppercase tracking-wider">{urgentOrders.length} Urgent</span>
                      </div>
                      <div className="space-y-2">
                        {urgentOrders.map(o => (
                        <div key={o.id} onClick={() => setMapSelectedId(p => p === o.id ? null : o.id)} className="cursor-pointer">
                          <OrderCard order={o} onAssign={setAssignTarget} compact className={cn("border-l-4 border-warning-amber", mapSelectedId === o.id && "ring-2 ring-warning-amber/50 ring-offset-1")} />
                        </div>
                      ))}
                      </div>
                    </section>
                  )}
                  {routineOrders.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <PriorityBadge priority="routine" />
                        <span className="text-xs font-label font-semibold text-medical-blue uppercase tracking-wider">{routineOrders.length} Routine</span>
                      </div>
                      <div className="space-y-2">
                        {routineOrders.map(o => (
                        <div key={o.id} onClick={() => setMapSelectedId(p => p === o.id ? null : o.id)} className="cursor-pointer">
                          <OrderCard order={o} onAssign={setAssignTarget} compact className={cn("border-l-4 border-medical-blue", mapSelectedId === o.id && "ring-2 ring-medical-blue/50 ring-offset-1")} />
                        </div>
                      ))}
                      </div>
                    </section>
                  )}
                  {orders.length === 0 && <p className="text-sm text-on-surface-variant text-center py-10">No active orders</p>}
                </>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Field Units</h3>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />)
                : technicians.map(tech => (
                    <div
                      key={tech.id}
                      onClick={() => setMapSelectedId(p => p === tech.id ? null : tech.id)}
                      className={cn(
                        "bg-white rounded-xl border px-4 py-3 flex items-center gap-3 shadow-card cursor-pointer transition-all",
                        mapSelectedId === tech.id
                          ? "border-medical-blue ring-2 ring-medical-blue/30"
                          : "border-outline-variant/40 hover:border-medical-blue/40"
                      )}
                    >
                      <Avatar initials={tech.initials} size="sm" status={tech.online ? "online" : "offline"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{tech.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{tech.zone}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-bold text-on-surface">{tech.activeOrders} active</p>
                        <p className="text-[10px] text-on-surface-variant">{tech.completedToday} done</p>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyJobVolumeChart />
            <TechnicianActivityChart />
          </div>
        </div>
      </TabsContent>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — LIVE MONITORING
      ══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="monitoring">
        <div className="space-y-5">
          {statOrders.length > 0 && (
            <div className="flex items-center gap-3 bg-emergency-red/10 border border-emergency-red/40 rounded-xl px-4 py-3 animate-pulse-stat">
              <AlertTriangle className="h-4 w-4 text-emergency-red shrink-0" />
              <p className="text-sm font-semibold text-emergency-red">
                {statOrders.length} STAT {statOrders.length === 1 ? "order" : "orders"} active — immediate dispatch required
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RealtimeCounterCard label="Active Orders" value={activeOrders}  trend={`${orders.length} today`}      trendPositive icon="assignment" />
            <RealtimeCounterCard label="Techs Online"  value={onlineTechs}   trend={`${technicians.length} total`} trendPositive icon="groups"     />
            <ResponseTimeCard    value={14.2} target={15} onTrack            className="col-span-1"                                                 />
            <MapDensityCard      utilization={72}         waitTime="0.3s"    refreshRate="1.1ms"                                                    />
          </div>
          <LiveMap markers={MONITORING_MARKERS} height="h-96" showLegend />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                      <ReportStatusBadge status={order.reportStatus} />
                    </div>
                  </div>
                ))}
                {orders.filter(o => o.status !== "complete").length === 0 && (
                  <p className="px-5 py-6 text-sm text-on-surface-variant text-center">No active orders</p>
                )}
              </div>
            </div>
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
                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                      <span className={(tech.batteryLevel ?? 100) > 50 ? "text-green-600" : (tech.batteryLevel ?? 100) > 20 ? "text-warning-amber" : "text-emergency-red"}>
                        {tech.batteryLevel ?? "—"}%
                      </span>
                      <span className="font-bold text-on-surface">{tech.completedToday} done</span>
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
      </TabsContent>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — FIELD UNITS
      ══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="field-units">
        <div className="space-y-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white rounded-xl border border-outline-variant/40 px-4 py-3 flex items-center gap-2 shadow-card">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-on-surface">{onlineTechs} Online</span>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/40 px-4 py-3 flex items-center gap-2 shadow-card">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-sm font-semibold text-on-surface">{offlineTechs} Offline</span>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/40 px-4 py-3 shadow-card">
              <span className="text-sm font-semibold text-on-surface">{completedToday} Orders Today</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
            {(["all", "online", "offline"] as UnitFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setUnitFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-label font-semibold uppercase tracking-wider transition-all",
                  unitFilter === f ? "bg-white text-on-surface shadow-card" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          {tLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />)}
            </div>
          ) : techError ? (
            <div className="flex items-center justify-center h-40 text-emergency-red text-sm">Failed to load fleet: {techError}</div>
          ) : filteredTechs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">
              <RefreshCw className="h-4 w-4 mr-2" /> No technicians found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTechs.map(tech => <TechnicianCard key={tech.id} tech={tech} onSelect={setSelectedTech} />)}
            </div>
          )}
        </div>
      </TabsContent>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 — MESSAGES
          Full-bleed three-column layout: thread list | chat | map
          -mx-6 -mb-6 breaks out of NavShell p-6; height accounts for
          TopNav (4rem) + tab bar (~3.25rem) + mb-6 (1.5rem) = ~8.75rem
      ══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="messages">
        <div className="-mx-6 -mb-6 flex overflow-hidden" style={{ height: "calc(100vh - 8.75rem)" }}>

          {/* ── Thread list ── */}
          <div className="flex-1 min-w-0 bg-white border-r border-outline-variant flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest shrink-0">
              <h2 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                Active Threads · {msgActiveOrders.length}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30">
              {msgActiveOrders.map(order => {
                const unread     = unreadByOrder[order.id] ?? 0;
                const last       = lastByOrder[order.id];
                const isSelected = msgSelectedId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => setMsgSelectedId(order.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors border-l-2",
                      isSelected
                        ? "bg-medical-blue/10 border-medical-blue"
                        : "border-transparent hover:bg-surface-container-lowest"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-on-surface truncate">{order.id}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread > 0 && (
                          <span className="h-4 min-w-[1rem] px-1 rounded-full bg-emergency-red text-white text-[9px] font-bold flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                        <PriorityBadge priority={order.priority} size="sm" animate={order.priority === "stat"} />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-on-surface truncate">{order.patientName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{order.facilityName}</p>
                    {last && (
                      <p className="text-xs text-slate-gray truncate mt-1 italic">
                        {last.senderRole === "technician" ? `${last.senderName}: ` : "You: "}{last.content}
                      </p>
                    )}
                  </button>
                );
              })}
              {msgActiveOrders.length === 0 && (
                <p className="p-6 text-sm text-on-surface-variant text-center">No active orders</p>
              )}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="flex-1 min-w-0 bg-white flex flex-col">
            {msgSelectedOrder ? (
              <>
                <div className="px-4 py-3 bg-midnight-navy text-white border-b border-white/10 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{msgSelectedOrder.id}</span>
                      <OrderStatusBadge status={msgSelectedOrder.status} size="sm" />
                    </div>
                    <PriorityBadge priority={msgSelectedOrder.priority} size="sm" animate={msgSelectedOrder.priority === "stat"} />
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{msgSelectedOrder.patientName}</p>
                  <p className="text-xs text-white/60 truncate">{msgSelectedOrder.facilityName}</p>
                  {msgSelectedOrder.assignedTech && (
                    <p className="text-xs text-medical-blue mt-0.5">{msgSelectedOrder.assignedTech} · {msgSelectedOrder.procedure}</p>
                  )}
                </div>

                <div className="flex border-b border-outline-variant bg-surface-container-lowest shrink-0">
                  <div className="flex-1 px-3 py-2 border-r border-outline-variant">
                    <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">Priority</p>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full shrink-0",
                        msgSelectedOrder.priority === "stat"   ? "bg-emergency-red animate-pulse" :
                        msgSelectedOrder.priority === "urgent" ? "bg-warning-amber" : "bg-medical-blue"
                      )} />
                      <span className="text-xs font-semibold text-on-surface capitalize">{msgSelectedOrder.priority}</span>
                    </div>
                  </div>
                  <div className="flex-1 px-3 py-2">
                    <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">Scheduled</p>
                    <span className="font-mono text-xs font-semibold text-on-surface">{msgSelectedOrder.scheduledTime}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ghost-white/40" style={{ scrollbarWidth: "thin" }}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant">
                      <MessageCircle className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No messages yet. Start the conversation.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isDispatcher = msg.senderRole === "dispatcher";
                    const isPatient    = msg.senderRole === "patient";
                    const isTech       = msg.senderRole === "technician";
                    const prevMsg      = messages[i - 1];
                    const showDate     = !prevMsg ||
                      new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center gap-3 my-2">
                            <div className="h-px flex-1 bg-outline-variant/50" />
                            <span className="text-xs font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                              {new Date(msg.createdAt).toDateString() === new Date().toDateString() ? "Today" : new Date(msg.createdAt).toLocaleDateString()}
                            </span>
                            <div className="h-px flex-1 bg-outline-variant/50" />
                          </div>
                        )}
                        <div className={cn("flex flex-col", isTech ? "items-end" : "items-start")}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            {isTech ? (
                              <>
                                <span className="text-[9px] text-on-surface-variant">{formatTime(msg.createdAt)}</span>
                                <span className="text-xs font-label font-semibold uppercase tracking-wide text-medical-blue">{msg.senderName}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-label font-semibold uppercase tracking-wide text-midnight-navy">
                                  {msg.senderName}
                                </span>
                                {msg.channel === "sms" && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-label font-semibold uppercase tracking-wide text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                                    <Phone className="h-2.5 w-2.5" /> SMS
                                  </span>
                                )}
                                <span className="text-[9px] text-on-surface-variant">{formatTime(msg.createdAt)}</span>
                              </>
                            )}
                          </div>
                          <div className={cn(
                            "max-w-[88%] px-3 py-2.5 text-sm leading-relaxed shadow-sm break-words",
                            isTech
                              ? "bg-midnight-navy text-white rounded-2xl rounded-tr-none"
                              : isPatient
                              ? "bg-slate-100 border border-outline-variant/60 rounded-2xl rounded-tl-none text-on-surface"
                              : "bg-white border border-outline-variant rounded-2xl rounded-tl-none text-on-surface"
                          )}>
                            {msg.content}
                          </div>
                          {isTech && (
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <CheckCheck className="h-3 w-3 text-medical-blue" />
                              <span className="text-[9px] text-on-surface-variant uppercase">
                                {msg.readAt ? `Read ${formatTime(msg.readAt)}` : "Delivered"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="px-3 py-2 bg-white border-t border-outline-variant flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
                  {QUICK_CHIPS.map(chip => (
                    <button
                      key={chip}
                      onClick={() => setMsgInput(chip)}
                      className="px-3 py-1.5 shrink-0 bg-ghost-white border border-outline-variant rounded-full text-[11px] font-label font-semibold text-midnight-navy whitespace-nowrap hover:bg-medical-blue/10 hover:border-medical-blue/40 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-3 bg-white border-t border-outline-variant shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="text-on-surface-variant hover:text-medical-blue transition-colors shrink-0">
                      <Plus className="h-5 w-5" />
                    </button>
                    {/* SMS toggle — only shown when order has a patient phone number */}
                    {msgSelectedOrder.phone && (
                      <button
                        onClick={() => setSmsMode(m => !m)}
                        title={smsMode ? "Switch to in-app" : "Send as SMS"}
                        className={cn(
                          "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-colors",
                          smsMode
                            ? "bg-green-500 border-green-600 text-white shadow-sm"
                            : "border-outline-variant text-on-surface-variant hover:text-green-600 hover:border-green-400"
                        )}
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder={
                          smsMode
                            ? `SMS to ${msgSelectedOrder.phone ?? "patient"}…`
                            : msgSelectedOrder.assignedTech
                              ? `Message ${msgSelectedOrder.assignedTech}…`
                              : "Send a message…"
                        }
                        className={cn(
                          "w-full border rounded-xl py-2.5 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-on-surface-variant/60",
                          smsMode
                            ? "bg-green-50 border-green-300 focus:ring-green-400"
                            : "bg-ghost-white border-outline-variant focus:ring-medical-blue"
                        )}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!msgInput.trim()}
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shadow-sm",
                          smsMode ? "bg-green-500 hover:bg-green-600" : "bg-medical-blue hover:bg-blue-600"
                        )}
                      >
                        {smsMode ? <Phone className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  {smsMode && msgSelectedOrder.phone && (
                    <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-green-600 mt-1.5 px-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> SMS · {msgSelectedOrder.phone}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-on-surface-variant">
                <MessageCircle className="h-10 w-10 opacity-20" />
                <p className="text-sm">Select an order to start messaging</p>
              </div>
            )}
          </div>

        </div>
      </TabsContent>

      {/* ── Assign modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!assignTarget}
        onClose={() => { setAssignTarget(null); setSelectedTechId(null); }}
        title="Assign Technician"
        description={assignTarget ? `Assign ${assignTarget.patientName} — ${assignTarget.procedure}` : ""}
        size="md"
      >
        <div className="space-y-3">
          {technicians.filter(t => t.online).map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedTechId(tech.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                selectedTechId === tech.id ? "border-medical-blue bg-blue-50" : "border-outline-variant hover:border-medical-blue/50"
              )}
            >
              <Avatar initials={tech.initials} size="sm" status="online" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">{tech.name}</p>
                <p className="text-xs text-on-surface-variant">{tech.zone} · {tech.activeOrders} active orders</p>
              </div>
              {tech.batteryLevel !== undefined && (
                <span className="text-xs font-mono text-on-surface-variant">{tech.batteryLevel}%</span>
              )}
            </button>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setAssignTarget(null); setSelectedTechId(null); }}>Cancel</Button>
            <Button variant="primary" disabled={!selectedTechId} onClick={confirmAssign}>Confirm Assignment</Button>
          </div>
        </div>
      </Modal>

      {/* ── Tech detail modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!selectedTech}
        onClose={() => setSelectedTech(null)}
        title={selectedTech?.name ?? ""}
        description={selectedTech ? `${selectedTech.zone} · ${selectedTech.licenseNumber}` : ""}
        size="md"
      >
        {selectedTech && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar initials={selectedTech.initials} size="lg" status={selectedTech.online ? "online" : "offline"} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selectedTech.online ? "success" : "default"} size="sm">
                    {selectedTech.online ? "Online" : "Offline"}
                  </Badge>
                  <SyncStatusBadge status={selectedTech.syncStatus} />
                </div>
                <p className="text-xs font-mono text-on-surface-variant mt-1">{selectedTech.licenseNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active",     value: selectedTech.activeOrders,   cls: "text-on-surface" },
                { label: "Done Today", value: selectedTech.completedToday, cls: "text-on-surface" },
                { label: "Battery",    value: `${selectedTech.batteryLevel ?? "—"}%`,
                  cls: (selectedTech.batteryLevel ?? 100) > 50 ? "text-green-600"
                     : (selectedTech.batteryLevel ?? 100) > 20 ? "text-warning-amber" : "text-emergency-red" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-surface-container rounded-xl p-3 text-center">
                  <p className={`text-2xl font-mono font-bold ${cls}`}>{value}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-on-surface-variant"><MapPin className="h-4 w-4 shrink-0" /><span>{selectedTech.zone}</span></div>
              {selectedTech.lastSeen && <div className="flex items-center gap-2 text-on-surface-variant"><Clock className="h-4 w-4 shrink-0" /><span>Last seen {selectedTech.lastSeen}</span></div>}
              {selectedTech.credentialExpiry && <div className="flex items-center gap-2 text-on-surface-variant"><ShieldCheck className="h-4 w-4 shrink-0" /><span>License expires {selectedTech.credentialExpiry}</span></div>}
              {selectedTech.batteryLevel !== undefined && <div className="flex items-center gap-2 text-on-surface-variant"><Battery className="h-4 w-4 shrink-0" /><span>Battery {selectedTech.batteryLevel}%</span></div>}
            </div>
            {selectedTech.activeOrders > 0 && (
              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/40">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Current Order</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-on-surface">Active Assignment</p>
                  <OrderStatusBadge status="en-route" size="sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Tabs>
  );
}
