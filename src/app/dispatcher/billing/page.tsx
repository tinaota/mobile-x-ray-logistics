"use client";

import { KPICard } from "@/components/ui/KPICard";
import { FacilityRevenueBar } from "@/components/charts/FacilityRevenueBar";
import { useOrders } from "@/lib/hooks/useOrders";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { AlertCircle } from "lucide-react";

export default function DispatcherBillingPage() {
  const { orders }   = useOrders();
  const { invoices } = useInvoices();

  const completed  = orders.filter(o => o.status === "complete" || o.status === "billed").length;
  const billed     = invoices.filter(i => i.status === "billed").length;
  const flagged    = invoices.filter(i => i.hasFlag).length;
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Orders Complete"
          value={String(completed)}
          subtext="Ready for billing"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Invoiced"
          value={String(billed)}
          subtext={`of ${invoices.length} total`}
          subIntent="info"
          subIcon="speed"
        />
        <KPICard
          label="Flagged"
          value={String(flagged)}
          subtext="Require review"
          subIntent={flagged > 0 ? "negative" : "positive"}
          subIcon={flagged > 0 ? "warning" : "trending_up"}
        />
        <KPICard
          label="Total Billed"
          value={`$${(totalBilled / 1000).toFixed(1)}k`}
          subtext="Current period"
          subIntent="positive"
          subIcon="trending_up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent invoices */}
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50 flex items-center justify-between">
            <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">Recent Invoices</h3>
            <Badge variant="default" size="sm">{invoices.length} total</Badge>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {invoices.slice(0, 6).map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                {inv.hasFlag && <AlertCircle className="h-4 w-4 text-emergency-red shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{inv.patientName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-medical-blue">{inv.cptCode}</span>
                    <span className="text-xs text-on-surface-variant">{inv.serviceDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm font-bold text-on-surface">${inv.totalAmount.toFixed(0)}</span>
                  <OrderStatusBadge status={inv.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by facility */}
        <FacilityRevenueBar />
      </div>
    </div>
  );
}
