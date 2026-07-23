"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PriorityBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/utils";
import { FileCheck2, PenLine, Send, Stethoscope, CheckCircle, RefreshCw, Zap, Droplet } from "lucide-react";

type ReportStatus = NonNullable<Order["reportStatus"]>;

const PIPELINE: ReportStatus[] = ["pending", "dictated", "signed", "delivered"];

const STAGE_META: Record<ReportStatus, {
  label: string; badgeCls: string; icon: typeof FileCheck2; nextLabel?: string;
}> = {
  pending:   { label: "Pending Read", badgeCls: "bg-warning-amber/20 text-warning-amber-ink border-warning-amber/30", icon: Stethoscope, nextLabel: "Mark Dictated" },
  dictated:  { label: "Dictated",     badgeCls: "bg-blue-100 text-blue-700 border-blue-200",                          icon: PenLine,     nextLabel: "Sign Report" },
  signed:    { label: "Signed",       badgeCls: "bg-indigo-100 text-indigo-700 border-indigo-200",                    icon: FileCheck2,  nextLabel: "Deliver Results" },
  delivered: { label: "Delivered",    badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200",                 icon: Send },
};

function ReportBadge({ status }: { status: ReportStatus }) {
  const meta = STAGE_META[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-label font-semibold uppercase tracking-wider",
      meta.badgeCls
    )}>
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export default function ResultsPage() {
  const { orders, loading, updateReportStatus } = useOrders();
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");

  // Interpretation applies once capture is complete
  const readable = orders.filter(o => o.status === "complete" || o.status === "billed");
  const byStage = (s: ReportStatus) => readable.filter(o => (o.reportStatus ?? "pending") === s);
  const visible = filter === "all" ? readable : byStage(filter);

  const advance = async (order: Order) => {
    const current = (order.reportStatus ?? "pending") as ReportStatus;
    const next = PIPELINE[PIPELINE.indexOf(current) + 1];
    if (!next) return;
    setAdvancing(order.id);
    await updateReportStatus(order.id, next);
    setAdvancing(null);
  };

  return (
    <div className="space-y-6">

      {/* Pipeline summary — click a stage to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="Filter by report stage">
        {PIPELINE.map(stage => {
          const meta = STAGE_META[stage];
          const active = filter === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setFilter(active ? "all" : stage)}
              aria-pressed={active}
              className={cn(
                "bg-white rounded-xl border shadow-card px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-blue",
                active ? "border-medical-blue ring-1 ring-medical-blue" : "border-outline-variant/40 hover:border-medical-blue/40"
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
                <meta.icon className="h-3.5 w-3.5" />
                {meta.label}
              </div>
              <p className="text-3xl font-mono font-bold text-midnight-navy mt-1">{byStage(stage).length}</p>
            </button>
          );
        })}
      </div>

      {/* Worklist */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50 flex items-center justify-between">
          <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">
            Interpretation Worklist{filter !== "all" && ` — ${STAGE_META[filter].label}`}
          </h3>
          {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-on-surface-variant" />}
        </div>
        <div className="divide-y divide-outline-variant/20">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-sm text-on-surface-variant">
                {filter === "all" ? "No completed studies awaiting interpretation" : `Nothing in ${STAGE_META[filter].label}`}
              </p>
            </div>
          ) : visible.map(order => {
            const stage = (order.reportStatus ?? "pending") as ReportStatus;
            const meta = STAGE_META[stage];
            return (
              <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  order.modality === "laboratory" ? "bg-laboratory-rose/10 text-laboratory-rose" : "bg-radiology-indigo/10 text-radiology-indigo"
                )}>
                  {order.modality === "laboratory" ? <Droplet className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-on-surface">{order.patientName}</span>
                    <PriorityBadge priority={order.priority} size="sm" />
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    {order.procedure} · {order.facilityName}
                  </p>
                  <p className="text-xs font-mono text-medical-blue mt-0.5">{order.cptCode} · {order.id}</p>
                </div>
                <ReportBadge status={stage} />
                {meta.nextLabel && (
                  <Button
                    variant={stage === "signed" ? "primary" : "outline"}
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={advancing === order.id}
                    onClick={() => advance(order)}
                  >
                    {advancing === order.id ? "Saving…" : meta.nextLabel}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        Delivering results updates the patient portal in real time — the client sees the
        &ldquo;Results ready&rdquo; status and their referring doctor is notified.
      </p>
    </div>
  );
}
