"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import type { Technician } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, Search, Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function expiryStatus(expiry?: string): "ok" | "expiring" | "expired" {
  if (!expiry) return "ok";
  const [year, month] = expiry.split("-").map(Number);
  const exp = new Date(year, month - 1, 1);
  const now = new Date();
  const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays < 90) return "expiring";
  return "ok";
}

const expiryConfig = {
  ok:       { label: "Valid",    className: "bg-green-100 text-green-700",    icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  expiring: { label: "Expiring", className: "bg-amber-100 text-warning-amber",icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  expired:  { label: "Expired",  className: "bg-red-100 text-emergency-red",  icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

export default function CredentialsPage() {
  const { technicians, loading } = useTechnicians();
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Technician | null>(null);

  const filtered = technicians.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.zone.toLowerCase().includes(search.toLowerCase())
  );

  const expiring = technicians.filter(t => expiryStatus(t.credentialExpiry) === "expiring").length;
  const expired  = technicians.filter(t => expiryStatus(t.credentialExpiry) === "expired").length;

  return (
    <div className="space-y-5">

      {/* Alert banners */}
      {expired > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-emergency-red/30 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-emergency-red shrink-0" />
          <p className="text-sm font-semibold text-emergency-red">{expired} expired license{expired > 1 ? "s" : ""} — technician cannot be dispatched</p>
        </div>
      )}
      {expiring > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-warning-amber/30 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-warning-amber shrink-0" />
          <p className="text-sm font-semibold text-amber-800">{expiring} license{expiring > 1 ? "s" : ""} expiring within 90 days</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, license, or zone…"
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-outline-variant bg-white text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-medical-blue"
        />
      </div>

      {/* Credentials table */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container/50 border-b border-outline-variant/30">
              <tr>
                {["Technician", "License Number", "Zone", "Credential Expiry", "Sync", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="h-8 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.map(tech => {
                const expStatus = expiryStatus(tech.credentialExpiry);
                const ec = expiryConfig[expStatus];
                return (
                  <tr
                    key={tech.id}
                    className="hover:bg-surface-container/40 cursor-pointer transition-colors"
                    onClick={() => setSelected(tech)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={tech.initials} size="sm" status={tech.online ? "online" : "offline"} />
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{tech.name}</p>
                          <p className="text-xs text-on-surface-variant">{tech.online ? "Online" : "Offline"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-on-surface">{tech.licenseNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-on-surface-variant">{tech.zone}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-on-surface-variant" />
                        <span className="font-mono text-sm text-on-surface">{tech.credentialExpiry ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <SyncStatusBadge status={tech.syncStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-label font-semibold uppercase tracking-wider",
                        ec.className
                      )}>
                        {ec.icon} {ec.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.zone} · ${selected.licenseNumber}` : ""}
        size="md"
      >
        {selected && (() => {
          const expStatus = expiryStatus(selected.credentialExpiry);
          const ec = expiryConfig[expStatus];
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar initials={selected.initials} size="lg" status={selected.online ? "online" : "offline"} />
                <div>
                  <p className="text-base font-bold text-on-surface">{selected.name}</p>
                  <p className="font-mono text-sm text-on-surface-variant mt-0.5">{selected.licenseNumber}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={selected.online ? "success" : "default"} size="sm">
                      {selected.online ? "Online" : "Offline"}
                    </Badge>
                    <SyncStatusBadge status={selected.syncStatus} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Zone",           selected.zone],
                  ["Active Orders",  String(selected.activeOrders)],
                  ["Done Today",     String(selected.completedToday)],
                  ["Battery",        `${selected.batteryLevel ?? "—"}%`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-surface-container/50 rounded-xl p-3">
                    <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3", ec.className, "bg-opacity-20")}>
                {ec.icon}
                <div>
                  <p className="text-sm font-semibold">License {ec.label}</p>
                  <p className="text-xs mt-0.5">Expiry: {selected.credentialExpiry ?? "Not set"}</p>
                </div>
              </div>

              {expStatus !== "ok" && (
                <Button variant={expStatus === "expired" ? "stat" : "warning"} size="md" className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" /> Initiate Renewal
                </Button>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
