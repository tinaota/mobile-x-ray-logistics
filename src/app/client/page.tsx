"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LiveMap, type LiveMapMarker } from "@/components/domain/LiveMap";
import { useOrders } from "@/lib/hooks/useOrders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/utils";
import {
  CheckCircle2, MapPin, Phone, Clock, User,
  AlertTriangle, CalendarCheck, MessageCircle,
} from "lucide-react";

type ReportStatus = "pending" | "dictated" | "signed" | "delivered";

const STEPS: { label: string; caption: string }[] = [
  { label: "Appointment Scheduled",  caption: "Your request has been received"             },
  { label: "Technician Assigned",    caption: "A technician has been assigned to you"      },
  { label: "Technician On the Way",  caption: "Your technician is heading to you now"      },
  { label: "Technician Has Arrived", caption: "Your X-ray is being taken"                  },
  { label: "Scan Complete",          caption: "Your images have been captured"             },
  { label: "Results Ready",          caption: "Your report has been sent to your doctor"   },
];

const STATUS_TO_STEP: Record<OrderStatus, number> = {
  pending:       0,
  assigned:      1,
  "en-route":    2,
  "in-progress": 3,
  complete:      4,
  billed:        4,
};

const RESULT_MESSAGES: Record<ReportStatus, { text: string; cls: string }> = {
  pending:   { text: "Your images are being reviewed by a radiologist", cls: "bg-slate-50 border-slate-200 text-slate-700"   },
  dictated:  { text: "A radiologist has reviewed your images",          cls: "bg-blue-50 border-blue-200 text-blue-700"      },
  signed:    { text: "Your report has been approved by a physician",    cls: "bg-green-50 border-green-200 text-green-700"   },
  delivered: { text: "Your report has been sent to your doctor",        cls: "bg-green-50 border-green-200 text-green-700"   },
};

export default function ClientAppointmentPage() {
  const { orders, loading } = useOrders();
  const order = orders.find(o => o.status !== "complete" && o.status !== "billed") ?? null;
  const activeStep = order ? STATUS_TO_STEP[order.status] : -1;
  const reportStatus = (order?.reportStatus ?? "pending") as ReportStatus;

  const mapMarkers: LiveMapMarker[] = order ? [
    { id: "home", lat: 33.462, lng: -112.089, type: "order",      label: order.facilityName,                               priority: order.priority },
    ...( ["en-route", "in-progress"].includes(order.status) ? [{
      id: "tech", lat: 33.479, lng: -112.063, type: "technician" as const, label: order.assignedTech ?? "Your Technician", status: "En Route",
    }] : []),
  ] : [];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-40 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
        <div className="h-72 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <CalendarCheck className="h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold text-on-surface">No upcoming appointments</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Your care coordinator will be in touch when your next visit is scheduled.
            </p>
            <Button variant="outline" size="lg" className="mt-2 gap-2">
              <Phone className="h-4 w-4" /> Call Care Coordinator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Priority notice — softened for client context */}
      {order.priority === "stat" && (
        <div className="flex items-start gap-3 bg-amber-50 border border-warning-amber/40 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-warning-amber shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-800">
            Your appointment is high priority — a technician is being dispatched as soon as possible.
          </p>
        </div>
      )}

      {/* Appointment card */}
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
              Your Appointment
            </p>
            <span className="font-mono text-xs font-bold text-on-surface-variant">{order.id}</span>
          </div>

          <div>
            <p className="text-xl font-semibold text-on-surface">{order.patientName}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{order.procedure}</p>
          </div>

          <div className="space-y-2 text-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-medical-blue" />
              <span className="font-mono font-semibold text-on-surface">{order.scheduledTime}</span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-medical-blue" />
              <span className="truncate">{order.address || order.facilityName}</span>
            </span>
            {order.assignedTech && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-medical-blue" />
                <span>{order.assignedTech}</span>
                {order.status === "en-route" && (
                  <span className="text-xs font-semibold text-medical-blue bg-medical-blue/10 px-2 py-0.5 rounded-full">
                    On the way
                  </span>
                )}
                {order.status === "in-progress" && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    Arrived
                  </span>
                )}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status stepper */}
      <Card>
        <CardContent className="py-5">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-5">
            Visit Status
          </p>
          <div className="flex flex-col">
            {STEPS.map((step, i) => {
              const state = i < activeStep ? "done" : i === activeStep ? "active" : "future";
              return (
                <div key={step.label} className="flex gap-3">
                  {/* Dot + connector line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                      state === "done"   ? "bg-green-500" :
                      state === "active" ? "bg-medical-blue ring-4 ring-medical-blue/20" :
                                           "bg-outline-variant/30"
                    )}>
                      {state === "done"
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        : state === "active"
                        ? <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        : <span className="h-2 w-2 rounded-full bg-outline-variant/50" />
                      }
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        "w-0.5 my-1 flex-1 min-h-[1.25rem]",
                        i < activeStep ? "bg-green-400" : "bg-outline-variant/30"
                      )} />
                    )}
                  </div>

                  {/* Step text */}
                  <div className="pb-4 pt-0.5">
                    <p className={cn(
                      "text-sm font-semibold leading-tight",
                      state === "done"   ? "text-green-700" :
                      state === "active" ? "text-on-surface" :
                                           "text-on-surface-variant/40"
                    )}>
                      {step.label}
                    </p>
                    {state !== "future" && (
                      <p className="text-xs text-on-surface-variant mt-0.5">{step.caption}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live map — shows technician position when en route / on scene */}
      {mapMarkers.length > 0 && (
        <LiveMap markers={mapMarkers} height="h-48" showLegend={false} />
      )}

      {/* Results status — shown after scan complete */}
      {(order.status === "complete" || order.status === "billed") && (
        <div className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3",
          RESULT_MESSAGES[reportStatus].cls
        )}>
          <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{RESULT_MESSAGES[reportStatus].text}</p>
        </div>
      )}

      {/* Help card */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
            Need Help?
          </p>
          <p className="text-sm text-on-surface-variant">
            Questions about your appointment or arrival time? Your care coordinator is available to help.
          </p>
          <Button variant="primary" size="lg" className="w-full gap-2">
            <Phone className="h-4 w-4" /> Call Care Coordinator
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
