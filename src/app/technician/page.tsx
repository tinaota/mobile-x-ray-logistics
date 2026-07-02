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
import type { Order } from "@/lib/utils";
import {
  MapPin, Clock, Phone, User, ChevronRight,
  Navigation, Play, CheckCircle, Battery, Wifi,
  Droplet, CheckCircle2,
} from "lucide-react";

const HUB_COORDS = { lat: 33.4484, lng: -112.0740 };

const FACILITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Sunrise Medical Center":   { lat: 33.4795, lng: -112.0890 },
  "Desert Valley Hospital":    { lat: 33.4750, lng: -112.1280 },
  "Camelback Rehab Center":    { lat: 33.5090, lng: -112.0780 },
  "Phoenix Care Facility":     { lat: 33.4280, lng: -112.0620 },
  "Valley View Nursing Home":  { lat: 33.4880, lng: -112.0220 },
  "Scottsdale Surgery Center": { lat: 33.5012, lng: -111.9255 },
  "Central Lab - Level 2":     { lat: 33.4650, lng: -112.0350 },
  "Stat Lab - ER Wing":        { lat: 33.4520, lng: -112.0820 },
  "On-site Satellite Lab":     { lat: 33.4820, lng: -112.0520 },
};

const STATUS_ORDER = ["in-progress", "in-transit", "assigned", "en-route", "pending", "complete"] as const;

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

  // Dynamic map markers
  const mapMarkers = useMemo<LiveMapMarker[]>(() => {
    if (!activeOrder) {
      return [
        { id: "me", lat: 33.4620, lng: -112.0520, type: "technician", label: "You" },
      ];
    }
    const coords = FACILITY_COORDS[activeOrder.facilityName] ?? { lat: 33.4795, lng: -112.0890 };
    return [
      {
        id: "dest",
        lat: coords.lat,
        lng: coords.lng,
        type: "order",
        label: activeOrder.facilityName,
        priority: activeOrder.priority,
        modality: activeOrder.modality,
      },
      { id: "me", lat: 33.4620, lng: -112.0520, type: "technician", label: "You" },
    ];
  }, [activeOrder]);

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
            {/* Priority + status row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={activeOrder.priority} size="lg" animate={activeOrder.priority === "stat"} />
                {isLab && (
                  <span className="px-2 py-0.5 rounded bg-laboratory-rose/10 text-laboratory-rose font-mono text-[9px] font-bold uppercase tracking-wider border border-laboratory-rose/20 flex items-center gap-0.5">
                    <Droplet className="h-2.5 w-2.5" /> Lab Draw
                  </span>
                )}
              </div>
              <OrderStatusBadge status={activeOrder.status} />
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

      {/* Dynamic Map widget */}
      <LiveMap
        markers={mapMarkers}
        height="h-48"
        showLegend={false}
      />

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
