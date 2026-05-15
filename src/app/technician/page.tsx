"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PriorityBadge, OrderStatusBadge, SyncStatusBadge } from "@/components/ui/StatusBadge";
import { LiveMap, type LiveMapMarker } from "@/components/domain/LiveMap";
import type { Order } from "@/lib/utils";
import {
  MapPin, Clock, Phone, User, ChevronRight,
  Navigation, Play, CheckCircle, Battery, Wifi,
} from "lucide-react";

const ACTIVE_ORDER: Order = {
  id: "ORD-002",
  patientName: "James Okafor",
  facilityName: "Desert Valley Hospital",
  address: "890 W Thomas Rd, Phoenix, AZ 85013",
  procedure: "Portable Chest X-Ray",
  cptCode: "71046",
  priority: "stat",
  status: "assigned",
  scheduledTime: "09:30 AM",
  distance: "3.4 mi",
  assignedTech: "T. Parker",
  phone: "(602) 555-0189",
};

const NEXT_ORDER: Order = {
  id: "ORD-005",
  patientName: "Angela Torres",
  facilityName: "Sunrise Medical Center",
  address: "1234 E Van Buren St, Phoenix, AZ",
  procedure: "Hip X-Ray Bilateral",
  cptCode: "73521",
  priority: "urgent",
  status: "assigned",
  scheduledTime: "11:00 AM",
  distance: "2.1 mi",
};

type ActionStep = "assigned" | "en-route" | "in-progress" | "complete";

const ACTION_FLOW: Record<ActionStep, { label: string; next: ActionStep | null; variant: "primary" | "warning" | "stat" | "outline" }> = {
  assigned:    { label: "Start Navigation",   next: "en-route",    variant: "primary"  },
  "en-route":  { label: "Begin Procedure",    next: "in-progress", variant: "warning"  },
  "in-progress":{ label: "Mark Complete",     next: "complete",    variant: "stat"     },
  complete:    { label: "Order Complete",      next: null,          variant: "outline"  },
};

export default function TechnicianActivePage() {
  const [step, setStep] = useState<ActionStep>("assigned");
  const action = ACTION_FLOW[step];

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SyncStatusBadge status="synced" />
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Battery className="h-3.5 w-3.5" />
            <span className="font-mono">88%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Wifi className="h-3.5 w-3.5 text-green-600" />
            <span>Online</span>
          </div>
        </div>
        <span className="text-xs font-mono text-on-surface-variant">09:12 AM</span>
      </div>

      {/* Active Order Hero Card */}
      <Card className={`border-2 ${ACTIVE_ORDER.priority === "stat" ? "border-emergency-red animate-pulse-stat" : "border-warning-amber"}`}>
        <CardContent className="space-y-4 py-5">

          {/* Priority + status row */}
          <div className="flex items-center justify-between">
            <PriorityBadge priority={ACTIVE_ORDER.priority} size="lg" animate />
            <OrderStatusBadge status={step === "complete" ? "complete" : step} />
          </div>

          {/* Patient + facility */}
          <div>
            <p className="text-headline-md font-semibold text-on-surface">{ACTIVE_ORDER.patientName}</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{ACTIVE_ORDER.facilityName}</p>
          </div>

          {/* Procedure + CPT */}
          <div className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3">
            <div>
              <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">Procedure</p>
              <p className="text-sm font-semibold text-on-surface mt-0.5">{ACTIVE_ORDER.procedure}</p>
            </div>
            <span className="font-mono text-sm font-bold text-on-surface bg-midnight-navy/10 px-3 py-1.5 rounded-lg">
              {ACTIVE_ORDER.cptCode}
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" />{ACTIVE_ORDER.scheduledTime}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />{ACTIVE_ORDER.distance}
            </span>
            <span className="flex items-center gap-1.5 col-span-2">
              <MapPin className="h-4 w-4 shrink-0 text-medical-blue" />
              <span className="truncate">{ACTIVE_ORDER.address}</span>
            </span>
            {ACTIVE_ORDER.phone && (
              <span className="flex items-center gap-1.5 col-span-2">
                <Phone className="h-4 w-4 shrink-0" />{ACTIVE_ORDER.phone}
              </span>
            )}
          </div>

          {/* Action buttons */}
          {step !== "complete" ? (
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                disabled={step !== "assigned"}
              >
                <Navigation className="h-4 w-4" /> Navigate
              </Button>
              <Button
                variant={action.variant}
                size="lg"
                className="flex-1 gap-2"
                onClick={() => action.next && setStep(action.next)}
              >
                {step === "assigned"     && <Navigation className="h-4 w-4" />}
                {step === "en-route"     && <Play className="h-4 w-4" />}
                {step === "in-progress"  && <CheckCircle className="h-4 w-4" />}
                {action.label}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Order Complete — Syncing</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destination Map */}
      <LiveMap
        markers={[
          { id: "dest", lat: 33.4795, lng: -112.089, type: "order", label: ACTIVE_ORDER.facilityName, priority: ACTIVE_ORDER.priority },
          { id: "me",   lat: 33.462,  lng: -112.052, type: "technician", label: "You" },
        ] satisfies LiveMapMarker[]}
        height="h-48"
        showLegend={false}
      />

      {/* Next Order Preview */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-4 py-3">
        <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
          Up Next · {NEXT_ORDER.scheduledTime}
        </p>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={NEXT_ORDER.priority} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{NEXT_ORDER.patientName}</p>
            <p className="text-xs text-on-surface-variant truncate">{NEXT_ORDER.facilityName} · {NEXT_ORDER.distance}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-xs text-on-surface-variant">
            <User className="h-3.5 w-3.5" />
            <span className="font-mono">{NEXT_ORDER.cptCode}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-on-surface-variant shrink-0" />
        </div>
      </div>
    </div>
  );
}
