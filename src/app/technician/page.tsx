"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, OrderStatusBadge, SyncStatusBadge } from "@/components/ui/StatusBadge";
import { LiveMap, type LiveMapMarker } from "@/components/domain/LiveMap";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import { PhlebotomyDrawPanel } from "@/components/domain/PhlebotomyDrawPanel";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/utils";
import { facilityCoords, haversineMiles, etaMinutes } from "@/lib/geo";
import {
  MapPin, Clock, Phone, User, ChevronRight,
  Navigation, Play, CheckCircle, Battery, Wifi,
  Droplet, CheckCircle2,
} from "lucide-react";

// Default technician position when live GPS is unavailable
const TECH_FALLBACK = { lat: 33.462, lng: -112.052 };

const STATUS_ORDER = ["in-progress", "in-transit", "assigned", "en-route", "pending", "complete"] as const;

/** Countdown chip vs the scheduled window, informed by the live ETA. */
function ScheduleChip({ scheduledTime, etaMin }: { scheduledTime: string; etaMin: number }) {
  const m = scheduledTime.match(/(\d{1,2}):(\d{2})\s?([AP]M)?/i);
  if (!m) return <p className="text-[11px] text-on-surface-variant mt-1">{scheduledTime}</p>;
  const sched = new Date();
  let hours = parseInt(m[1], 10) % 12;
  if (m[3]?.toUpperCase() === "PM") hours += 12;
  sched.setHours(hours, parseInt(m[2], 10), 0, 0);
  const slackMin = Math.round((sched.getTime() - Date.now()) / 60000) - etaMin;

  const tone =
    slackMin >= 5   ? { label: "On time",                     cls: "text-green-600",       dot: "bg-green-500"       } :
    slackMin >= -10 ? { label: "Tight — leave now",           cls: "text-warning-amber-ink", dot: "bg-warning-amber" } :
                      { label: `Behind ${Math.abs(slackMin)}m`, cls: "text-emergency-red",  dot: "bg-emergency-red animate-pulse" };

  return (
    <p className={cn("flex items-center gap-1.5 text-[11px] font-semibold mt-1", tone.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} /> {tone.label}
    </p>
  );
}

/** Full lifecycle stepper — mirrors real OrderStatus values, lab inserts In Transit. */
function StatusMachine({ status, isLab }: { status: OrderStatus; isLab: boolean }) {
  const steps: { key: OrderStatus; label: string }[] = [
    { key: "assigned",    label: "Dispatched"  },
    { key: "en-route",    label: "En Route"    },
    { key: "in-progress", label: isLab ? "Drawing" : "In Progress" },
    ...(isLab ? [{ key: "in-transit" as OrderStatus, label: "In Transit" }] : []),
    { key: "complete",    label: "Complete"    },
    { key: "billed",      label: "Submitted"   },
  ];
  const currentIdx = Math.max(0, steps.findIndex(s => s.key === status));

  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "future";
        return (
          <li key={step.key} className="flex items-center gap-3">
            <span className={cn(
              "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0",
              state === "done"    && "bg-green-100 text-green-700",
              state === "current" && "bg-medical-blue text-white",
              state === "future"  && "bg-surface-container-high text-on-surface-variant"
            )}>
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={cn(
              "text-sm flex-1",
              state === "current" ? "font-semibold text-on-surface" : "text-on-surface-variant"
            )}>
              {step.label}
            </span>
            {state === "current" && (
              <span className="text-[9px] font-label font-bold uppercase tracking-widest text-medical-blue">
                Current
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function sortManifest(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status as typeof STATUS_ORDER[number]);
    const bi = STATUS_ORDER.indexOf(b.status as typeof STATUS_ORDER[number]);
    if (ai !== bi) return ai - bi;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });
}

export default function TechnicianActivePage() {
  const { orders, loading, error, updateOrderStatus } = useOrders();
  const { technicians } = useTechnicians();

  // Find active technician info (Parker)
  const parker = technicians.find(t => t.name === "T. Parker") ?? null;

  // Filter assigned and sorted orders for "T. Parker" that are not complete/billed
  const activeOrders = useMemo(() => {
    const manifest = orders.filter(o => o.assignedTech === "T. Parker");
    return sortManifest(manifest).filter(o => o.status !== "complete" && o.status !== "billed");
  }, [orders]);

  const activeOrder = activeOrders[0] ?? null;

  // Next order preview
  const nextOrder = useMemo(() => {
    const manifest = orders.filter(o => o.assignedTech === "T. Parker");
    return sortManifest(manifest).find(o => o.status === "assigned" && o.id !== activeOrder?.id) ?? null;
  }, [orders, activeOrder]);

  // Radiology completion overlay (lab flow overlays live in PhlebotomyDrawPanel)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Technician's live position (GPS when available, hub-area fallback)
  const techPos = {
    lat: parker?.latitude ?? TECH_FALLBACK.lat,
    lng: parker?.longitude ?? TECH_FALLBACK.lng,
  };

  // Live logistics: real haversine distance + derived ETA to the active facility
  const dest = facilityCoords(activeOrder?.facilityName);
  const distanceMiles = activeOrder ? haversineMiles(techPos.lat, techPos.lng, dest.lat, dest.lng) : 0;
  const etaMin = activeOrder ? etaMinutes(distanceMiles) : 0;

  // Dynamic map markers
  const mapMarkers = useMemo<LiveMapMarker[]>(() => {
    if (!activeOrder) {
      return [
        { id: "me", lat: techPos.lat, lng: techPos.lng, type: "technician", label: "You" },
      ];
    }
    return [
      {
        id: "dest",
        lat: dest.lat,
        lng: dest.lng,
        type: "order",
        label: activeOrder.facilityName,
        priority: activeOrder.priority,
        modality: activeOrder.modality,
      },
      { id: "me", lat: techPos.lat, lng: techPos.lng, type: "technician", label: "You" },
    ];
  }, [activeOrder, dest.lat, dest.lng, techPos.lat, techPos.lng]);

  // Travel path while heading to the destination
  const mapRoutes = activeOrder && ["assigned", "en-route"].includes(activeOrder.status) ? [{
    id: "route",
    positions: [
      [techPos.lat, techPos.lng],
      [dest.lat, dest.lng],
    ] as [number, number][],
    color: activeOrder.modality === "laboratory" ? "#E11D48" : "#4F46E5",
  }] : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Wifi className="h-8 w-8 text-medical-blue animate-pulse" />
        <p className="text-xs text-on-surface-variant font-semibold">Synchronizing manifest logs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-emergency-red text-sm">
        Failed to load active orders: {error}
      </div>
    );
  }

  // Handle standard status updates
  const handleStartNav = async () => {
    if (activeOrder) await updateOrderStatus(activeOrder.id, "en-route");
  };

  const handleStartProcedure = async () => {
    if (activeOrder) await updateOrderStatus(activeOrder.id, "in-progress");
  };

  const handleCompleteRadiology = async () => {
    if (!activeOrder) return;
    await updateOrderStatus(activeOrder.id, "complete");
    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
    }, 2000);
  };

  const isLab = activeOrder?.modality === "laboratory";
  const isInTransit = activeOrder?.status === "in-transit";

  return (
    <div className="max-w-2xl mx-auto space-y-4 relative">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SyncStatusBadge status="synced" />
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Battery className="h-3.5 w-3.5" />
            <span className="font-mono">{parker?.batteryLevel ?? 88}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Wifi className="h-3.5 w-3.5 text-green-600" />
            <span>Online</span>
          </div>
        </div>
        <span className="text-xs font-mono text-on-surface-variant">
          {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>

      {activeOrder ? (
        <Card className={cn(
          "border-2 transition-all duration-300",
          activeOrder.priority === "stat" ? "border-emergency-red shadow-lg" : "border-outline-variant/40",
          isInTransit && "in-transit-mode bg-surface-muted"
        )}>
          <CardContent className="space-y-4 py-5">
            {/* Priority + status row — grouped like the hi-fi spec */}
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={activeOrder.priority} size="lg" animate={activeOrder.priority === "stat"} />
              <OrderStatusBadge status={activeOrder.status} />
              <SyncStatusBadge status="synced" />
              {isLab && (
                <span className="px-2 py-0.5 rounded bg-laboratory-rose/10 text-laboratory-rose font-mono text-[9px] font-bold uppercase tracking-wider border border-laboratory-rose/20 flex items-center gap-0.5">
                  <Droplet className="h-2.5 w-2.5" /> Lab Draw
                </span>
              )}
            </div>

            {/* Patient + facility */}
            <div>
              <p className="text-headline-md font-semibold text-on-surface">{activeOrder.patientName}</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">{activeOrder.facilityName}</p>
            </div>

            {/* Procedure + CPT */}
            <div className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3">
              <div>
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                  {isLab ? "Panel Type" : "Procedure"}
                </p>
                <p className="text-sm font-semibold text-on-surface mt-0.5">{activeOrder.procedure}</p>
              </div>
              <span className={cn(
                "font-mono text-sm font-bold px-3 py-1.5 rounded-lg border",
                isLab
                  ? "bg-laboratory-rose/10 text-laboratory-rose border-laboratory-rose/20"
                  : "bg-radiology-indigo/10 text-radiology-indigo border-radiology-indigo/20"
              )}>
                {activeOrder.cptCode}
              </span>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />{activeOrder.scheduledTime}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />{activeOrder.distance || "ASAP"}
              </span>
              <span className="flex items-center gap-1.5 col-span-2">
                <MapPin className="h-4 w-4 shrink-0 text-medical-blue" />
                <span className="truncate">{activeOrder.address}</span>
              </span>
              {activeOrder.phone && (
                <span className="flex items-center gap-1.5 col-span-2">
                  <Phone className="h-4 w-4 shrink-0" />{activeOrder.phone}
                </span>
              )}
            </div>

            <div className="h-px bg-outline-variant/40" />

            {/* Modality Specific Inline Flows */}
            {isLab && (
              <>
                <PhlebotomyDrawPanel order={activeOrder} onUpdateStatus={updateOrderStatus} />
                <div className="h-px bg-outline-variant/40" />
              </>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              {activeOrder.status === "assigned" && (
                <Button
                  variant="primary"
                  size="lg"
                  className={cn("flex-1 gap-2 h-12 rounded-xl", isLab ? "bg-laboratory-rose hover:bg-rose-700" : "bg-radiology-indigo hover:bg-indigo-700")}
                  onClick={handleStartNav}
                >
                  <Navigation className="h-4 w-4" /> Start Navigation
                </Button>
              )}

              {activeOrder.status === "en-route" && (
                <Button
                  variant="warning"
                  size="lg"
                  className="flex-1 gap-2 h-12 rounded-xl"
                  onClick={handleStartProcedure}
                >
                  <Play className="h-4 w-4" /> Begin {isLab ? "Phlebotomy Draw" : "Procedure"}
                </Button>
              )}

              {activeOrder.status === "in-progress" && !isLab && (
                <Button
                  variant="stat"
                  size="lg"
                  className="flex-1 gap-2 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white border-green-600"
                  onClick={handleCompleteRadiology}
                >
                  <CheckCircle className="h-4 w-4" /> Mark Complete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-outline-variant/40">
          <CardContent className="flex flex-col items-center justify-center text-center py-10 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">No Active Orders</h3>
              <p className="text-xs text-on-surface-variant mt-1 px-4">
                You're all caught up! Check your Daily Manifest to review and begin scheduled assignments.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.location.href = "/technician/manifest"}
            >
              Go to Manifest <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Map widget — active-route treatment per hi-fi spec */}
      <LiveMap
        markers={mapMarkers}
        routes={mapRoutes}
        height="h-48"
        title="Navigation — Active Route"
      />

      {/* Live logistics row: real ETA + distance, schedule countdown */}
      {activeOrder && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">ETA</p>
            <p className="font-mono text-2xl font-bold text-on-surface mt-0.5">{etaMin} min</p>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-medical-blue mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-medical-blue animate-pulse" /> Live
            </p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">Distance</p>
            <p className="font-mono text-2xl font-bold text-on-surface mt-0.5">{distanceMiles.toFixed(1)} mi</p>
            <p className="text-[11px] text-on-surface-variant mt-1">Great-circle</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-3">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">Scheduled</p>
            <p className="font-mono text-2xl font-bold text-on-surface mt-0.5">{activeOrder.scheduledTime.replace(/\s?[AP]M/i, "")}</p>
            <ScheduleChip scheduledTime={activeOrder.scheduledTime} etaMin={etaMin} />
          </div>
        </div>
      )}

      {/* Status machine — full lifecycle visibility per hi-fi spec */}
      {activeOrder && (
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-4">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
            Status Machine
          </p>
          <StatusMachine status={activeOrder.status} isLab={isLab} />
        </div>
      )}

      {/* Next Order Preview */}
      {nextOrder && (
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-3">
          <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Up Next · {nextOrder.scheduledTime}
          </p>
          <div className="flex items-center gap-3">
            <PriorityBadge priority={nextOrder.priority} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{nextOrder.patientName}</p>
              <p className="text-xs text-on-surface-variant truncate">{nextOrder.facilityName} · {nextOrder.distance || "ASAP"}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-on-surface-variant">
              <User className="h-3.5 w-3.5" />
              <span className="font-mono">{nextOrder.cptCode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Success feedback overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] bg-laboratory-emerald/95 flex flex-col items-center justify-center text-white transition-opacity duration-300 animate-fade-in">
          <CheckCircle2 className="h-20 w-20 mb-4 animate-bounce text-white" />
          <h2 className="text-xl font-bold font-headline">Log Successful</h2>
          <p className="text-sm opacity-90">Manifest logs synced to queue.</p>
        </div>
      )}
    </div>
  );
}
