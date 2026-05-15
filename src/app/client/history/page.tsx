"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { useOrders } from "@/lib/hooks/useOrders";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, CalendarCheck } from "lucide-react";

type ReportStatus = "pending" | "dictated" | "signed" | "delivered";

const REPORT_BADGE: Record<ReportStatus, { label: string; cls: string }> = {
  pending:   { label: "Under Review",      cls: "bg-slate-100 text-slate-600"       },
  dictated:  { label: "Report Dictated",   cls: "bg-blue-50 text-blue-700"          },
  signed:    { label: "Report Signed",     cls: "bg-green-100 text-green-700"       },
  delivered: { label: "Results Delivered", cls: "bg-green-500/15 text-green-800"    },
};

export default function ClientHistoryPage() {
  const { orders, loading } = useOrders();
  const past = orders
    .filter(o => o.status === "complete" || o.status === "billed")
    .sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (past.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Clock className="h-12 w-12 text-on-surface-variant/30" />
            <p className="text-sm font-semibold text-on-surface">No past appointments yet</p>
            <p className="text-xs text-on-surface-variant">Your completed visits will appear here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {past.map(order => {
        const rs = (order.reportStatus ?? "pending") as ReportStatus;
        const badge = REPORT_BADGE[rs];
        return (
          <Card key={order.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{order.procedure}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{order.facilityName}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <CalendarCheck className="h-3 w-3" />
                      <span className="font-mono">{order.scheduledTime}</span>
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "shrink-0 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-label font-semibold uppercase tracking-wider whitespace-nowrap",
                  badge.cls
                )}>
                  {badge.label}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
