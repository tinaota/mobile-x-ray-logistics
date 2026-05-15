"use client";

import { useEffect } from "react";
import { MapPin, Phone, Building2, CheckCircle2, PlayCircle, X } from "lucide-react";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/utils";

interface OrderDetailSheetProps {
  order: Order | null;
  onClose: () => void;
  onStartProcedure?: (order: Order) => void;
  onMarkComplete?: (order: Order) => void;
}

export function OrderDetailSheet({
  order, onClose,
  onStartProcedure, onMarkComplete,
}: OrderDetailSheetProps) {
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const canStart    = order.status === "assigned" || order.status === "en-route";
  const canComplete = order.status === "in-progress";
  const isDone      = order.status === "complete" || order.status === "billed";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-navy/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-h-[88vh] bg-white rounded-t-2xl shadow-card-lg flex flex-col animate-slide-up overflow-hidden">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">

          {/* ── Section 1: Order Header ── */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={order.priority} animate={order.priority === "stat"} />
              <span className="font-mono text-sm font-bold text-on-surface">{order.id}</span>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-surface leading-tight">{order.patientName}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm">{order.facilityName}</span>
              </div>
              {order.address && (
                <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm">{order.address}</span>
                </div>
              )}
            </div>

            <div className="bg-surface-container rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">Procedure</p>
                <p className="text-sm font-semibold text-on-surface">{order.procedure}</p>
              </div>
              <span className="font-mono text-xs font-bold bg-medical-blue/10 text-medical-blue px-2.5 py-1 rounded-lg">
                {order.cptCode}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>Scheduled: <span className="font-mono font-semibold text-on-surface">{order.scheduledTime}</span></span>
              {order.distance && <span>{order.distance} away</span>}
            </div>
          </div>

          <div className="h-px bg-outline-variant/40" />

          {/* ── Section 2: Action Buttons ── */}
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 bg-surface-container rounded-xl py-4 hover:bg-surface-container-highest transition-colors">
              <div className="h-10 w-10 rounded-full bg-medical-blue/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-medical-blue" />
              </div>
              <span className="text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface">Navigate</span>
            </button>

            {order.phone ? (
              <a
                href={`tel:${order.phone}`}
                className="flex flex-col items-center gap-2 bg-surface-container rounded-xl py-4 hover:bg-surface-container-highest transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface">Call Patient</span>
              </a>
            ) : (
              <button disabled className="flex flex-col items-center gap-2 bg-surface-container rounded-xl py-4 opacity-40 cursor-not-allowed">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface">Call Patient</span>
              </button>
            )}

            <button className="flex flex-col items-center gap-2 bg-surface-container rounded-xl py-4 hover:bg-surface-container-highest transition-colors">
              <div className="h-10 w-10 rounded-full bg-warning-amber/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-warning-amber" />
              </div>
              <span className="text-[11px] font-label font-semibold uppercase tracking-wider text-on-surface">Call Facility</span>
            </button>
          </div>

          <div className="h-px bg-outline-variant/40" />

          {/* ── Section 3: Status / Progress Actions ── */}
          <div className="space-y-3">
            <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">Order Status</p>

            {isDone ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Order Complete</p>
                  <p className="text-xs text-green-600">Data will sync when you return online.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {order.assignedTech && (
                  <p className="text-sm text-on-surface-variant">
                    Assigned to <span className="font-semibold text-on-surface">{order.assignedTech}</span>
                  </p>
                )}
                <div className={cn(
                  "flex gap-2",
                  canStart || canComplete ? "" : "opacity-50"
                )}>
                  {canStart && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={() => { onStartProcedure?.(order); onClose(); }}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start Procedure
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => { onMarkComplete?.(order); onClose(); }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                  {!canStart && !canComplete && (
                    <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm text-on-surface-variant">No actions available</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
