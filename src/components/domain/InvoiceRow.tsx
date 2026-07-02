import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import type { Invoice } from "@/lib/utils";
import { AlertCircle, Droplet, Zap } from "lucide-react";

interface InvoiceRowProps {
  invoice: Invoice;
  onClick?: (invoice: Invoice) => void;
  selected?: boolean;
}

export function InvoiceRow({ invoice, onClick, selected }: InvoiceRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors cursor-pointer border-b border-outline-variant/20",
        selected ? "bg-medical-blue/5" : "hover:bg-surface-container/50"
      )}
      onClick={() => onClick?.(invoice)}
    >
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-on-surface">{invoice.patientName}</p>
          <p className="text-xs text-on-surface-variant">{invoice.facilityName}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">{invoice.serviceDate}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="code-mono text-xs text-on-surface flex items-center gap-1">
            {invoice.modality === "laboratory"
              ? <Droplet className="h-3 w-3 text-laboratory-rose" />
              : <Zap className="h-3 w-3 text-radiology-indigo" />}
            {invoice.cptCode}
            {invoice.labModifier && (
              <span className="text-laboratory-rose font-bold">-{invoice.labModifier}</span>
            )}
          </span>
          <span className="code-mono text-xs text-on-surface-variant">{invoice.icd10Code}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-0.5 text-xs text-on-surface-variant">
          <span>Base: ${invoice.baseFee.toFixed(2)}</span>
          {invoice.modality === "laboratory" ? (
            <span>Mod {invoice.labModifier ?? "90"}: reference lab</span>
          ) : (
            <span>R0070: ${invoice.r0070Fee.toFixed(2)}</span>
          )}
          <span>Miles: ${invoice.mileageFee.toFixed(2)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-bold text-on-surface">${invoice.totalAmount.toFixed(2)}</p>
        {invoice.urgencyFactor > 1 && (
          <p className="text-[10px] text-warning-amber font-label font-semibold">×{invoice.urgencyFactor} urgency</p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <OrderStatusBadge status={invoice.status} size="sm" />
          {invoice.hasFlag && (
            <span title={invoice.flagReason}>
              <AlertCircle className="h-4 w-4 text-emergency-red" />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
