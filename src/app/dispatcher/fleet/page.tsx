"use client";

import { useState } from "react";
import { TechnicianCard } from "@/components/domain/TechnicianCard";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SyncStatusBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import type { Technician } from "@/lib/utils";
import { Battery, MapPin, ShieldCheck, Clock, RefreshCw } from "lucide-react";

type Filter = "all" | "online" | "offline";

export default function FleetPage() {
  const { technicians, loading, error } = useTechnicians();
  const [filter,   setFilter]   = useState<Filter>("all");
  const [selected, setSelected] = useState<Technician | null>(null);

  const filtered = technicians.filter(t =>
    filter === "all" ? true : filter === "online" ? t.online : !t.online
  );

  const onlineCount  = technicians.filter(t => t.online).length;
  const offlineCount = technicians.length - onlineCount;

  if (error) return (
    <div className="flex items-center justify-center h-40 text-emergency-red text-sm">
      Failed to load fleet: {error}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-white rounded-xl border border-outline-variant/40 px-4 py-3 flex items-center gap-2 shadow-card">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-on-surface">{onlineCount} Online</span>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/40 px-4 py-3 flex items-center gap-2 shadow-card">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-sm font-semibold text-on-surface">{offlineCount} Offline</span>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/40 px-4 py-3 flex items-center gap-2 shadow-card">
          <span className="text-sm font-semibold text-on-surface">
            {technicians.reduce((s, t) => s + t.completedToday, 0)} Orders Today
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
        {(["all", "online", "offline"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-label font-semibold uppercase tracking-wider transition-all ${
              filter === f ? "bg-white text-on-surface shadow-card" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          No technicians found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tech => (
            <TechnicianCard key={tech.id} tech={tech} onSelect={setSelected} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.zone} · ${selected.licenseNumber}` : ""}
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar initials={selected.initials} size="lg" status={selected.online ? "online" : "offline"} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selected.online ? "success" : "default"} size="sm">
                    {selected.online ? "Online" : "Offline"}
                  </Badge>
                  <SyncStatusBadge status={selected.syncStatus} />
                </div>
                <p className="text-xs font-mono text-on-surface-variant mt-1">{selected.licenseNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <p className="text-2xl font-mono font-bold text-on-surface">{selected.activeOrders}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Active</p>
              </div>
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <p className="text-2xl font-mono font-bold text-on-surface">{selected.completedToday}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Done Today</p>
              </div>
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <p className={`text-2xl font-mono font-bold ${
                  (selected.batteryLevel ?? 100) > 50 ? "text-green-600"
                  : (selected.batteryLevel ?? 100) > 20 ? "text-warning-amber"
                  : "text-emergency-red"
                }`}>
                  {selected.batteryLevel ?? "—"}%
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">Battery</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{selected.zone}</span>
              </div>
              {selected.lastSeen && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Last seen {selected.lastSeen}</span>
                </div>
              )}
              {selected.credentialExpiry && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>License expires {selected.credentialExpiry}</span>
                </div>
              )}
              {selected.batteryLevel !== undefined && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Battery className="h-4 w-4 shrink-0" />
                  <span>Battery {selected.batteryLevel}%</span>
                </div>
              )}
            </div>

            {selected.activeOrders > 0 && (
              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/40">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Current Order</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-on-surface">Active Assignment</p>
                  <OrderStatusBadge status="en-route" size="sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
