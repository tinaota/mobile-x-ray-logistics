"use client";

import { useState } from "react";
import { FacilityRevenueBar } from "@/components/charts/FacilityRevenueBar";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { ProcedureDistributionDonut } from "@/components/charts/ProcedureDistributionDonut";
import { KPICard } from "@/components/ui/KPICard";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Download, FileText } from "lucide-react";

const DATE_OPTIONS = [
  { value: "week",    label: "This Week"    },
  { value: "month",   label: "This Month"   },
  { value: "quarter", label: "This Quarter" },
  { value: "year",    label: "This Year"    },
];

const FACILITY_OPTIONS = [
  { value: "",        label: "All Facilities"       },
  { value: "sunrise", label: "Sunrise Medical"      },
  { value: "desert",  label: "Desert Valley Hosp."  },
  { value: "camelback", label: "Camelback Rehab"    },
  { value: "valley",  label: "Valley View Nursing"  },
];

const CPT_OPTIONS = [
  { value: "",      label: "All CPT Codes" },
  { value: "71046", label: "71046 — Chest 2-view" },
  { value: "71045", label: "71045 — Chest 1-view" },
  { value: "73521", label: "73521 — Hip AP/Lat"   },
  { value: "72100", label: "72100 — Lumbar Spine"  },
  { value: "73562", label: "73562 — Knee 3-view"   },
];

export default function ReportsPage() {
  const [dateRange, setDateRange]         = useState("month");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [cptFilter, setCptFilter]         = useState("");

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Filter bar */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-44">
          <Select
            label="Period"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            options={DATE_OPTIONS}
          />
        </div>
        <div className="w-48">
          <Select
            label="Facility"
            value={facilityFilter}
            onChange={e => setFacilityFilter(e.target.value)}
            options={FACILITY_OPTIONS}
          />
        </div>
        <div className="w-52">
          <Select
            label="CPT Code"
            value={cptFilter}
            onChange={e => setCptFilter(e.target.value)}
            options={CPT_OPTIONS}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="md" className="gap-2">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="md" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Billed"
          value="$1.27M"
          subtext="+12.4% vs prior period"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Total Collected"
          value="$1.20M"
          subtext="94.2% collection rate"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Orders Completed"
          value="407"
          subtext="+31 vs prior period"
          subIntent="positive"
          subIcon="speed"
        />
        <KPICard
          label="Avg Invoice"
          value="$312"
          subtext="Per completed order"
          subIntent="neutral"
          subIcon="clock"
        />
      </div>

      {/* Revenue area chart — full width */}
      <RevenueAreaChart />

      {/* Facility bar + Procedure donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FacilityRevenueBar />
        <ProcedureDistributionDonut
          total={407}
          segments={[
            { label: "CPT-71046", pct: 45, color: "#3B82F6" },
            { label: "CPT-72100", pct: 20, color: "#0F172A" },
            { label: "CPT-73521", pct: 14, color: "#F59E0B" },
            { label: "CPT-73562", pct: 11, color: "#EF4444" },
            { label: "CPT-71045", pct: 10, color: "#10B981" },
          ]}
        />
      </div>
    </div>
  );
}
