"use client";

import { cn } from "@/lib/utils";
import { Filter, Eye, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type AuditStatus = "verified" | "flagged" | "pending";

interface AuditRow {
  id: string;
  cptCode: string;
  status: AuditStatus;
  revenueImpact: number;
  facility: string;
}

interface ComplianceAuditTableProps {
  rows?: AuditRow[];
  total?: number;
  onRunAudit?: () => void;
  onFilter?: () => void;
  onView?: (row: AuditRow) => void;
  onEdit?: (row: AuditRow) => void;
  className?: string;
}

const statusConfig: Record<AuditStatus, { label: string; className: string; dot: string }> = {
  verified: { label: "Verified", className: "bg-green-100 text-green-700",       dot: "bg-green-600" },
  flagged:  { label: "Flagged",  className: "bg-red-100 text-emergency-red animate-pulse", dot: "bg-emergency-red" },
  pending:  { label: "Pending",  className: "bg-amber-100 text-warning-amber",   dot: "bg-warning-amber" },
};

const defaultRows: AuditRow[] = [
  { id: "AUD-99203-A", cptCode: "99203", status: "verified", revenueImpact:  1450.00, facility: "St. Jude Medical" },
  { id: "AUD-80053-B", cptCode: "80053", status: "flagged",  revenueImpact:  -420.00, facility: "City Urgent Care" },
  { id: "AUD-36415-X", cptCode: "36415", status: "pending",  revenueImpact:    12.00, facility: "Northwest General" },
  { id: "AUD-90658-M", cptCode: "90658", status: "verified", revenueImpact:    85.50, facility: "St. Jude Medical" },
];

export function ComplianceAuditTable({
  rows = defaultRows,
  total = 128,
  onRunAudit,
  onFilter,
  onView,
  onEdit,
  className,
}: ComplianceAuditTableProps) {
  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
        <h3 className="text-headline-md font-bold text-midnight-navy">Recent Compliance Audits</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onFilter}
            className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg font-label text-label-caps font-semibold text-midnight-navy hover:bg-outline-variant/20 transition-all"
          >
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
          <Button variant="primary" size="sm" onClick={onRunAudit}>
            Run Audit
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant/30">
            <tr>
              {["Audit ID", "CPT Code", "Status", "Revenue Impact", "Facility", ""].map((h) => (
                <th key={h} className="px-6 py-4 font-label text-label-caps font-semibold uppercase tracking-wider text-slate-gray whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {rows.map((row) => {
              const s = statusConfig[row.status];
              const impactColor = row.revenueImpact >= 0 ? "text-midnight-navy" : "text-emergency-red";
              return (
                <tr key={row.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-midnight-navy">{row.id}</td>
                  <td className="px-6 py-4">
                    <span className="bg-surface-container px-2 py-1 rounded font-mono text-sm text-medical-blue">
                      {row.cptCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-label-caps font-semibold",
                      s.className
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", s.dot)} />
                      {s.label}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 font-mono text-sm font-bold", impactColor)}>
                    {row.revenueImpact >= 0 ? "+" : ""}${Math.abs(row.revenueImpact).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-body-sm font-medium text-on-surface">{row.facility}</td>
                  <td className="px-6 py-4 text-right">
                    {row.status === "flagged" ? (
                      <button onClick={() => onEdit?.(row)} className="text-slate-gray hover:text-medical-blue transition-colors p-1 rounded">
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => onView?.(row)} className="text-slate-gray hover:text-medical-blue transition-colors p-1 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between">
        <span className="text-body-sm text-slate-gray">
          Showing {rows.length} of {total} recent audits
        </span>
        <div className="flex gap-2">
          <button className="p-2 rounded border border-outline-variant/50 hover:bg-surface-container-low transition-all">
            <ChevronLeft className="h-4 w-4 text-on-surface-variant" />
          </button>
          <button className="p-2 rounded border border-outline-variant/50 hover:bg-surface-container-low transition-all">
            <ChevronRight className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>
      </div>
    </div>
  );
}
