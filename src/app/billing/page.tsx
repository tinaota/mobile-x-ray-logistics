"use client";

import dynamic from "next/dynamic";
import { KPICard } from "@/components/ui/KPICard";
import { CodeScrubberWidget } from "@/components/charts/CodeScrubberWidget";
import { useInvoices } from "@/lib/hooks/useInvoices";

const CollectionGauge    = dynamic(() => import("@/components/charts/CollectionGauge").then(m => ({ default: m.CollectionGauge })), { ssr: false });
const RevenueLineChart   = dynamic(() => import("@/components/charts/RevenueLineChart").then(m => ({ default: m.RevenueLineChart })), { ssr: false });
const CPTDonutChart      = dynamic(() => import("@/components/charts/CPTDonutChart").then(m => ({ default: m.CPTDonutChart })), { ssr: false });

export default function BillingDashboardPage() {
  const { invoices } = useInvoices();

  // DSO = (outstanding AR ÷ avg daily billed revenue) — IDS target ≤55 days
  const totalRevenue    = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const arBalance       = invoices
    .filter(inv => inv.status !== "billed")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const avgDailyRevenue = totalRevenue / 30;
  const dso             = avgDailyRevenue > 0 ? Math.round(arBalance / avgDailyRevenue) : 0;
  const dsoIntent       = dso <= 45 ? "positive" : dso <= 55 ? "info" : "negative";
  const dsoSubtext      = dso <= 45 ? "Below 45-day target" : dso <= 55 ? "Within 55-day target" : "Exceeds 55-day target";

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Total Revenue"
          value="$1.27M"
          subtext="+12.4% vs last month"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Collection Rate"
          value="94.2%"
          subtext="Target: 95%"
          subIntent="warning"
          subIcon="warning"
        />
        <KPICard
          label="Clean Claim Rate"
          value="91.8%"
          subtext="+2.1% vs last month"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Avg Invoice Value"
          value="$312"
          subtext="Per completed order"
          subIntent="neutral"
          subIcon="clock"
        />
        <KPICard
          label="DSO"
          value={invoices.length > 0 ? `${dso}d` : "—"}
          subtext={invoices.length > 0 ? dsoSubtext : "Loading…"}
          subIntent={dsoIntent}
          subIcon={dso <= 55 ? "trending_up" : "warning"}
        />
      </div>

      {/* Gauge + Revenue chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CollectionGauge rate={94.2} target={95} height={240} />
        <RevenueLineChart className="lg:col-span-2" height={240} />
      </div>

      {/* CPT donut + Scrubber */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CPTDonutChart height={260} />
        <CodeScrubberWidget
          items={[
            { code: "ERR_MISSING_ICD10 · ORD-008",  status: "error" },
            { code: "ERR_MODIFIER_CONFLICT · ORD-012", status: "error" },
            { code: "CPT_71046_VALIDATED",            status: "ok"    },
            { code: "CPT_73521_VALIDATED",            status: "ok"    },
            { code: "ERR_DUPLICATE_CLAIM · ORD-004",  status: "error" },
          ]}
        />
      </div>
    </div>
  );
}
