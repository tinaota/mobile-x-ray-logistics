"use client";

import { useState } from "react";
import { ComplianceAuditTable } from "@/components/domain/ComplianceAuditTable";
import { KPICard } from "@/components/ui/KPICard";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuditLog } from "@/lib/hooks/useAuditLog";
import { Download } from "lucide-react";

const FACILITY_OPTIONS = [
  { value: "",            label: "All Facilities"       },
  { value: "st. jude",   label: "St. Jude Medical"     },
  { value: "city urgent", label: "City Urgent Care"     },
  { value: "northwest",  label: "Northwest General"    },
];

const STATUS_OPTIONS = [
  { value: "",         label: "All Statuses" },
  { value: "verified", label: "Verified"     },
  { value: "flagged",  label: "Flagged"      },
  { value: "pending",  label: "Pending"      },
];

export default function AuditPage() {
  const { rows, loading, refetch } = useAuditLog();

  const [facilityFilter, setFacilityFilter] = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [running,        setRunning]         = useState(false);

  const filteredRows = rows.filter(r => {
    const matchFacility = !facilityFilter || r.facility.toLowerCase().includes(facilityFilter);
    const matchStatus   = !statusFilter   || r.status === statusFilter;
    return matchFacility && matchStatus;
  });

  const verified  = rows.filter(r => r.status === "verified").length;
  const flagged   = rows.filter(r => r.status === "flagged").length;
  const pending   = rows.filter(r => r.status === "pending").length;
  const netImpact = rows.reduce((s, r) => s + r.revenueImpact, 0);

  const handleRunAudit = async () => {
    setRunning(true);
    await refetch();
    setRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Verified"
          value={loading ? "—" : String(verified)}
          subtext="Clean claims"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Flagged"
          value={loading ? "—" : String(flagged)}
          subtext="Require review"
          subIntent="negative"
          subIcon="warning"
        />
        <KPICard
          label="Pending"
          value={loading ? "—" : String(pending)}
          subtext="Awaiting audit"
          subIntent="warning"
          subIcon="clock"
        />
        <KPICard
          label="Net Revenue Impact"
          value={loading ? "—" : `${netImpact >= 0 ? "+" : ""}$${Math.abs(netImpact).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          valueColor={netImpact >= 0 ? "text-green-700" : "text-emergency-red"}
          subtext="Across all audited claims"
          subIntent={netImpact >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Filters + export */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-48">
          <Select
            label="Facility"
            value={facilityFilter}
            onChange={e => setFacilityFilter(e.target.value)}
            options={FACILITY_OPTIONS}
          />
        </div>
        <div className="w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <Button variant="outline" size="md" className="gap-2 ml-auto">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Audit table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <ComplianceAuditTable
          rows={filteredRows}
          total={rows.length}
          onRunAudit={handleRunAudit}
          onFilter={() => {}}
          onView={row => console.log("view", row)}
          onEdit={row => console.log("edit", row)}
        />
      )}
    </div>
  );
}
