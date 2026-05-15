"use client";

import { useState } from "react";
import { InvoiceRow } from "@/components/domain/InvoiceRow";
import type { Invoice } from "@/components/domain/InvoiceRow";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { CPTCodeBadge, ICD10Badge } from "@/components/domain/CPTCodeBadge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { AlertCircle, Search, RefreshCw } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "",         label: "All Statuses" },
  { value: "billed",   label: "Billed" },
  { value: "pending",  label: "Pending" },
  { value: "assigned", label: "Assigned" },
];

export default function InvoicesPage() {
  const { invoices, loading, error } = useInvoices();

  const [selected,      setSelected]      = useState<Invoice | null>(null);
  const [statusFilter,  setStatusFilter]  = useState("");
  const [search,        setSearch]        = useState("");

  const filtered = invoices.filter(inv => {
    const matchStatus = !statusFilter || inv.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || inv.patientName.toLowerCase().includes(q)
      || inv.facilityName.toLowerCase().includes(q)
      || inv.cptCode.includes(q)
      || inv.id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const flaggedCount = invoices.filter(i => i.hasFlag).length;

  if (error) return (
    <div className="flex items-center justify-center h-40 text-emergency-red text-sm">
      Failed to load invoices: {error}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Summary row */}
      <div className="flex items-center gap-3 flex-wrap">
        {loading
          ? <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><RefreshCw className="h-3 w-3 animate-spin" /> Loading…</span>
          : <Badge variant="stat" size="md">{invoices.length} Invoices</Badge>
        }
        {flaggedCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-emergency-red/30 rounded-lg px-3 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-emergency-red" />
            <span className="text-xs font-semibold text-emergency-red">{flaggedCount} flagged</span>
          </div>
        )}
        <span className="ml-auto text-xs font-mono text-on-surface-variant">
          Total: ${invoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label=""
            placeholder="Search patient, facility, CPT…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-44">
          <Select
            label=""
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container/50 border-b border-outline-variant/30">
              <tr>
                {["Patient / Facility", "Date", "Codes", "Fee Breakdown", "Total", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-8 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {filtered.map(inv => (
                    <InvoiceRow
                      key={inv.id}
                      invoice={inv}
                      selected={selected?.id === inv.id}
                      onClick={setSelected}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                        No invoices match the current filters.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Invoice ${selected?.id}`}
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Patient</p>
                <p className="text-sm font-semibold text-on-surface">{selected.patientName}</p>
              </div>
              <div>
                <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Facility</p>
                <p className="text-sm text-on-surface">{selected.facilityName}</p>
              </div>
              <div>
                <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Service Date</p>
                <p className="text-sm font-mono text-on-surface">{selected.serviceDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Status</p>
                <OrderStatusBadge status={selected.status} />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <CPTCodeBadge code={selected.cptCode} flagged={!!selected.hasFlag} />
              {selected.icd10Code
                ? <ICD10Badge code={selected.icd10Code} primary />
                : <span className="flex items-center gap-1 text-xs text-emergency-red font-semibold"><AlertCircle className="h-3.5 w-3.5" /> Missing ICD-10</span>
              }
            </div>

            <div className="bg-surface-container/50 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Fee Breakdown</p>
              {[
                ["Base Fee",                   selected.baseFee],
                ["R0070 (Portable Surcharge)", selected.r0070Fee],
                ["Mileage Fee",                selected.mileageFee],
              ].map(([label, amount]) => (
                <div key={label as string} className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{label as string}</span>
                  <span className="font-mono text-on-surface">${(amount as number).toFixed(2)}</span>
                </div>
              ))}
              {selected.urgencyFactor > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warning-amber font-semibold">Urgency Factor</span>
                  <span className="font-mono text-warning-amber font-bold">×{selected.urgencyFactor}</span>
                </div>
              )}
              <div className="border-t border-outline-variant/30 pt-2 flex justify-between">
                <span className="font-semibold text-on-surface">Total</span>
                <span className="font-mono font-bold text-on-surface text-base">${selected.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {selected.hasFlag && (
              <div className="flex items-start gap-2 bg-red-50 border border-emergency-red/30 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 text-emergency-red shrink-0 mt-0.5" />
                <p className="text-xs text-emergency-red font-semibold">{selected.flagReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
