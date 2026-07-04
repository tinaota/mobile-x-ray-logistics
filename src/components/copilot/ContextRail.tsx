"use client";

// Right rail — live persona-relevant operational data, rendered from the
// platform's existing realtime hooks. Intentionally separate from the
// server-side fetchPersonaContext() (lib/copilot/context.ts): this feeds
// the operator's eye with live-updating UI; that feeds the model a text
// snapshot at request time.

import { Card, CardContent } from "@/components/ui/Card";
import { PriorityBadge, OrderStatusBadge, SyncStatusBadge } from "@/components/ui/StatusBadge";
import { SpecimenStabilityBadge } from "@/components/domain/SpecimenStabilityBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import { useInvoices } from "@/lib/hooks/useInvoices";
import { useSpecimens } from "@/lib/hooks/useSpecimens";
import { useSyncQueue } from "@/lib/hooks/useSyncQueue";
import type { CopilotPersona } from "@/lib/utils";
import { AlertCircle, Radio } from "lucide-react";

const OPEN_STATUSES = ["pending", "assigned", "en-route", "in-progress", "in-transit"];

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
          {title}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyLine({ label }: { label: string }) {
  return <p className="text-xs text-on-surface-variant">{label}</p>;
}

export function ContextRail({ persona }: { persona: CopilotPersona }) {
  const { orders } = useOrders();
  const { technicians } = useTechnicians();
  const { invoices } = useInvoices();
  const { byOrderId: specimensByOrder } = useSpecimens();
  const { records: syncRecords } = useSyncQueue();

  const open = orders.filter(o => OPEN_STATUSES.includes(o.status));

  if (persona === "dispatcher") {
    const stat = open.filter(o => o.priority === "stat").slice(0, 5);
    const inTransitLab = open.filter(o => o.status === "in-transit" && o.modality === "laboratory");
    const online = technicians.filter(t => t.online);

    return (
      <div className="space-y-4">
        <RailSection title="STAT Orders">
          {stat.length === 0 ? <EmptyLine label="No open STAT orders." /> : stat.map(o => (
            <div key={o.id} className="flex items-center gap-2">
              <PriorityBadge priority={o.priority} size="sm" animate />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-on-surface">{o.patientName}</p>
                <p className="truncate text-[11px] text-on-surface-variant">{o.facilityName}</p>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant shrink-0">{o.id}</span>
            </div>
          ))}
        </RailSection>

        <RailSection title="Specimens In Transit">
          {inTransitLab.length === 0 ? <EmptyLine label="No specimens in transit." /> : inTransitLab.map(o => {
            const specimen = specimensByOrder.get(o.id);
            return (
              <div key={o.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-on-surface">{o.patientName}</p>
                  <p className="truncate font-mono text-[10px] text-on-surface-variant">
                    {specimen?.accessionNumber ?? o.id}
                  </p>
                </div>
                {specimen && <SpecimenStabilityBadge specimen={specimen} />}
              </div>
            );
          })}
        </RailSection>

        <RailSection title={`Field Staff Online (${online.length}/${technicians.length})`}>
          {online.slice(0, 6).map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-on-surface">{t.name}</p>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant">{t.discipline} · {t.activeOrders} active</span>
            </div>
          ))}
        </RailSection>
      </div>
    );
  }

  if (persona === "billing") {
    const flagged = invoices.filter(i => i.hasFlag).slice(0, 6);
    const openInvoices = invoices.filter(i => i.status !== "billed");
    const openTotal = openInvoices.reduce((s, i) => s + i.totalAmount, 0);

    return (
      <div className="space-y-4">
        <RailSection title={`Flagged Claims (${flagged.length})`}>
          {flagged.length === 0 ? <EmptyLine label="No flagged claims." /> : flagged.map(i => (
            <div key={i.id} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emergency-red" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-semibold text-on-surface">{i.id} · {i.cptCode}</p>
                <p className="truncate text-[11px] text-emergency-red">{i.flagReason ?? "Flagged"}</p>
              </div>
            </div>
          ))}
        </RailSection>

        <RailSection title="Open Revenue">
          <p className="font-mono text-xl font-bold text-on-surface">
            ${openTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-on-surface-variant">{openInvoices.length} invoices not yet billed</p>
        </RailSection>

        <RailSection title="Formula Reference">
          <p className="font-mono text-[11px] leading-relaxed text-on-surface-variant">
            Total = (CPT Base × Urgency) + R0070 (rad) / mod -90 (lab) + Mileage
          </p>
        </RailSection>
      </div>
    );
  }

  // field-tech — aggregate fleet view (v1 scope)
  const active = open.filter(o => ["en-route", "in-progress", "in-transit"].includes(o.status)).slice(0, 5);
  const pendingSync = syncRecords.filter(r => r.syncStatus === "pending").length;
  const conflictSync = syncRecords.filter(r => r.syncStatus === "conflict").length;

  return (
    <div className="space-y-4">
      <RailSection title="Active Assignments">
        {active.length === 0 ? <EmptyLine label="No active assignments." /> : active.map(o => (
          <div key={o.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-on-surface">{o.patientName}</p>
              <p className="truncate text-[11px] text-on-surface-variant">{o.assignedTech ?? "Unassigned"} · {o.facilityName}</p>
            </div>
            <OrderStatusBadge status={o.status} size="sm" />
          </div>
        ))}
      </RailSection>

      <RailSection title="Offline Sync Queue">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-laboratory-emerald" />
          <p className="text-xs text-on-surface">
            <span className="font-mono font-bold">{pendingSync}</span> pending ·{" "}
            <span className="font-mono font-bold">{conflictSync}</span> conflicts
          </p>
        </div>
        {syncRecords.slice(0, 4).map(r => (
          <div key={r.id} className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-[10px] text-on-surface-variant">{r.orderId} · {r.field}</p>
            <SyncStatusBadge status={r.syncStatus} />
          </div>
        ))}
      </RailSection>
    </div>
  );
}
