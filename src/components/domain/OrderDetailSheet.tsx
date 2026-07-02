"use client";

import { useEffect, useState } from "react";
import {
  MapPin, Building2, CheckCircle2, PlayCircle, X, Droplet,
} from "lucide-react";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { PhlebotomyDrawPanel } from "@/components/domain/PhlebotomyDrawPanel";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/utils";

interface OrderDetailSheetProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: OrderStatus) => Promise<void>;
}

export function OrderDetailSheet({
  order, onClose, onUpdateStatus,
}: OrderDetailSheetProps) {
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Escape key close listener
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const isLab = order.modality === "laboratory";
  const canStart    = order.status === "assigned" || order.status === "en-route";
  const canComplete = order.status === "in-progress";
  const isInTransit = order.status === "in-transit";
  const isDone      = order.status === "complete" || order.status === "billed";

  // Trigger procedure start
  const handleStart = async () => {
    if (onUpdateStatus) {
      await onUpdateStatus(order.id, "in-progress");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-navy/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet Frame */}
      <div className={cn(
        "relative w-full max-h-[92vh] bg-surface rounded-t-2xl shadow-card-lg flex flex-col animate-slide-up overflow-hidden text-on-surface",
        isInTransit && "in-transit-mode"
      )}>
        
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 bg-white">
          <div className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors z-10 border border-outline-variant/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable Clinical Panel */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5 bg-white">

          {/* Header section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={order.priority} animate={order.priority === "stat"} />
              <span className="font-mono text-xs font-bold bg-surface-container px-2.5 py-1 rounded border border-outline-variant/30">{order.id}</span>
              <OrderStatusBadge status={order.status} size="sm" />
              {isLab && (
                <span className="px-2 py-0.5 rounded bg-laboratory-rose/10 text-laboratory-rose font-mono text-[9px] font-bold uppercase tracking-wider border border-laboratory-rose/20 flex items-center gap-0.5">
                  <Droplet className="h-2.5 w-2.5" /> Lab Draw
                </span>
              )}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-on-surface leading-tight font-headline">{order.patientName}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-semibold uppercase">{order.facilityName}</span>
                </div>
                {order.address && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-outline" />
                    <span className="text-xs">{order.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Procedure Card */}
            <div className="bg-surface-muted rounded-xl px-4 py-3 border border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant/80 mb-0.5">Procedure / CPT</p>
                <p className="text-sm font-bold text-on-surface">{order.procedure}</p>
              </div>
              <span className={cn(
                "font-mono text-xs font-bold px-2.5 py-1 rounded-lg border",
                isLab 
                  ? "bg-laboratory-rose/10 text-laboratory-rose border-laboratory-rose/20"
                  : "bg-radiology-indigo/10 text-radiology-indigo border-radiology-indigo/20"
              )}>
                {order.cptCode}
              </span>
            </div>
          </div>

          <div className="h-px bg-outline-variant/40" />

          {/* Clinical draw details (Conditional on modality & status) */}
          {isLab && (
            <>
              <PhlebotomyDrawPanel
                order={order}
                onUpdateStatus={async (id, status) => {
                  if (onUpdateStatus) await onUpdateStatus(id, status);
                }}
                onDelivered={onClose}
              />
              <div className="h-px bg-outline-variant/40" />
            </>
          )}

          {/* ── Section 3: Status / Progress Actions ── */}
          <div className="space-y-3">
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
                <div className="flex gap-2">
                  {canStart && (
                    <Button
                      variant="primary"
                      size="lg"
                      className={cn("flex-1 gap-2 h-12 rounded-xl", isLab ? "bg-laboratory-rose hover:bg-rose-700" : "bg-radiology-indigo hover:bg-indigo-700")}
                      onClick={handleStart}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start {isLab ? "Phlebotomy Draw" : "Radiology Procedure"}
                    </Button>
                  )}
                  {canComplete && !isLab && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 h-12 rounded-xl"
                      onClick={async () => {
                        if (onUpdateStatus) await onUpdateStatus(order.id, "complete");
                        setShowSuccessOverlay(true);
                        setTimeout(() => {
                          setShowSuccessOverlay(false);
                          onClose();
                        }, 2000);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                  {!canStart && !canComplete && !isInTransit && (
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

      {/* Success Feedback Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] bg-laboratory-emerald/95 flex flex-col items-center justify-center text-white transition-opacity duration-300">
          <CheckCircle2 className="h-20 w-20 mb-4 animate-bounce text-white" />
          <h2 className="text-xl font-bold font-headline">Log Successful</h2>
          <p className="text-sm opacity-90">Manifest updated for {order.patientName}</p>
        </div>
      )}
    </div>
  );
}
