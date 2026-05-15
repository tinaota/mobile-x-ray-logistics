"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { KPICard } from "@/components/ui/KPICard";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

type TxType = "credit" | "debit" | "adjustment";

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  type: TxType;
  amount: number;
  balance: number;
  facility: string;
}

function buildLedger(invoices: ReturnType<typeof useInvoices>["invoices"]): LedgerEntry[] {
  let balance = 0;
  return invoices.map((inv, i) => {
    const amount = inv.status === "billed" ? inv.totalAmount : 0;
    const type: TxType = inv.hasFlag ? "adjustment" : inv.status === "billed" ? "credit" : "debit";
    balance += type === "credit" ? amount : type === "debit" ? -amount * 0.05 : 0;
    return {
      id:          `TX-${String(i + 1).padStart(4, "0")}`,
      date:        inv.serviceDate,
      description: `${inv.cptCode} — ${inv.patientName}`,
      reference:   inv.id,
      type,
      amount:      inv.totalAmount,
      balance:     Math.max(0, balance),
      facility:    inv.facilityName,
    };
  });
}

const TYPE_OPTIONS = [
  { value: "",           label: "All Types"   },
  { value: "credit",     label: "Credits"     },
  { value: "debit",      label: "Debits"      },
  { value: "adjustment", label: "Adjustments" },
];

const typeConfig: Record<TxType, { label: string; color: string; icon: React.ReactNode }> = {
  credit:     { label: "Credit",     color: "text-green-600",        icon: <ArrowUpRight   className="h-4 w-4 text-green-600" />   },
  debit:      { label: "Debit",      color: "text-emergency-red",    icon: <ArrowDownRight className="h-4 w-4 text-emergency-red" /> },
  adjustment: { label: "Adjustment", color: "text-warning-amber",    icon: <ArrowUpRight   className="h-4 w-4 text-warning-amber" /> },
};

export default function LedgerPage() {
  const { invoices, loading } = useInvoices();
  const [typeFilter, setTypeFilter] = useState("");

  const entries = buildLedger(invoices);
  const filtered = entries.filter(e => !typeFilter || e.type === typeFilter);

  const totalCredits = entries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const totalDebits  = entries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
  const netBalance   = totalCredits - totalDebits;

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Total Credits"
          value={`$${(totalCredits / 1000).toFixed(1)}k`}
          subtext="Billed & collected"
          subIntent="positive"
          subIcon="trending_up"
        />
        <KPICard
          label="Total Debits"
          value={`$${(totalDebits / 1000).toFixed(1)}k`}
          subtext="Adjustments & reversals"
          subIntent={totalDebits > 0 ? "negative" : "neutral"}
          subIcon="trending_down"
        />
        <KPICard
          label="Net Balance"
          value={`$${(netBalance / 1000).toFixed(1)}k`}
          valueColor={netBalance >= 0 ? "text-green-700" : "text-emergency-red"}
          subtext="Current period"
          subIntent={netBalance >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-end gap-3">
        <div className="w-44">
          <Select
            label="Transaction Type"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            options={TYPE_OPTIONS}
          />
        </div>
        <span className="ml-auto text-xs text-on-surface-variant font-mono pb-2">
          {filtered.length} transactions
        </span>
      </div>

      {/* Ledger table */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container/50 border-b border-outline-variant/30">
              <tr>
                {["Ref", "Date", "Description", "Facility", "Type", "Amount", "Balance"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-7 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.map(entry => {
                const tc = typeConfig[entry.type];
                return (
                  <tr key={entry.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-on-surface">{entry.id}</span>
                        <p className="font-mono text-[10px] text-on-surface-variant">{entry.reference}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant whitespace-nowrap">{entry.date}</td>
                    <td className="px-4 py-3 text-sm text-on-surface max-w-[200px] truncate">{entry.description}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[140px] truncate">{entry.facility}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", tc.color)}>
                        {tc.icon} {tc.label}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-sm font-bold text-right", tc.color)}>
                      {entry.type === "debit" ? "-" : "+"}${entry.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-right text-on-surface">
                      ${entry.balance.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
