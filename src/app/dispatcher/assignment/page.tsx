"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PriorityBadge, OrderStatusBadge, SyncStatusBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import type { Order, Technician } from "@/lib/utils";
import { CheckCircle, RefreshCw, UserPlus, UserX, Zap, Droplet } from "lucide-react";

/** A technician is eligible when their discipline covers the order's service line. */
function isEligible(tech: Technician, order: Order | null): boolean {
  if (!order?.modality) return true;
  if (tech.discipline === "dual") return true;
  return order.modality === "laboratory"
    ? tech.discipline === "phlebotomy"
    : tech.discipline === "imaging";
}

export default function AssignmentPage() {
  const { orders, loading, assignOrder, unassignOrder } = useOrders();
  const { technicians }                                 = useTechnicians();

  const [target,       setTarget]       = useState<Order | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [assigning,    setAssigning]    = useState(false);
  const [reassigning,  setReassigning]  = useState(false); // modal is in no-show/reassign mode

  const unassigned = orders.filter(o => o.status === "pending");
  const inFlight   = orders.filter(o => o.status === "assigned" || o.status === "en-route" || o.status === "in-progress");

  const closeModal = () => {
    setTarget(null);
    setSelectedTech(null);
    setReassigning(false);
  };

  const confirmAssign = async () => {
    if (!target || !selectedTech) return;
    setAssigning(true);
    const tech = technicians.find(t => t.id === selectedTech);
    if (tech) await assignOrder(target.id, tech.id, tech.name);
    setAssigning(false);
    closeModal();
  };

  const returnToQueue = async () => {
    if (!target) return;
    setAssigning(true);
    await unassignOrder(target.id);
    setAssigning(false);
    closeModal();
  };

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-5 py-4">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">Unassigned</p>
          <p className="text-3xl font-mono font-bold text-emergency-red mt-1">{unassigned.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-5 py-4">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">In Flight</p>
          <p className="text-3xl font-mono font-bold text-warning-amber mt-1">{inFlight.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card px-5 py-4">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">Available Techs</p>
          <p className="text-3xl font-mono font-bold text-green-600 mt-1">
            {technicians.filter(t => t.online && t.activeOrders === 0).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Unassigned orders queue */}
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50 flex items-center justify-between">
            <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">Pending Assignment</h3>
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-on-surface-variant" />}
          </div>
          <div className="divide-y divide-outline-variant/20">
            {unassigned.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p className="text-sm text-on-surface-variant">All orders assigned</p>
              </div>
            ) : unassigned.map(order => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                <PriorityBadge priority={order.priority} size="sm" animate={order.priority === "stat"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{order.patientName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{order.facilityName} · {order.scheduledTime}</p>
                  <p className="text-xs font-mono text-medical-blue mt-0.5">{order.cptCode}</p>
                </div>
                <Button
                  variant={order.priority === "stat" ? "stat" : "primary"}
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => { setTarget(order); setSelectedTech(null); }}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Assign
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* In-flight orders */}
        <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50">
            <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">In Flight</h3>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {inFlight.length === 0 ? (
              <p className="px-5 py-10 text-sm text-on-surface-variant text-center">No orders in flight</p>
            ) : inFlight.map(order => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-on-surface">{order.patientName}</span>
                    <PriorityBadge priority={order.priority} size="sm" />
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">{order.facilityName}</p>
                  {order.assignedTech && (
                    <p className="text-xs font-mono text-medical-blue mt-0.5">{order.assignedTech}</p>
                  )}
                </div>
                <OrderStatusBadge status={order.status} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => { setTarget(order); setSelectedTech(null); setReassigning(true); }}
                >
                  <UserX className="h-3.5 w-3.5" /> Reassign
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technician availability */}
      <div className="bg-white rounded-xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container/50 flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning-amber" />
          <h3 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface">Technician Availability</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
          {technicians.map(tech => (
            <div key={tech.id} className="px-5 py-4 flex items-center gap-3">
              <Avatar initials={tech.initials} size="sm" status={tech.online ? "online" : "offline"} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{tech.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{tech.zone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <SyncStatusBadge status={tech.syncStatus} />
                  <span className="text-[10px] font-mono text-on-surface-variant">{tech.activeOrders} active</span>
                </div>
              </div>
              {tech.batteryLevel !== undefined && (
                <span className={`text-xs font-mono shrink-0 ${
                  tech.batteryLevel > 50 ? "text-green-600"
                  : tech.batteryLevel > 20 ? "text-warning-amber"
                  : "text-emergency-red"
                }`}>{tech.batteryLevel}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={!!target}
        onClose={closeModal}
        title={reassigning ? "Reassign Order — No-Show" : "Assign Order"}
        description={target ? `${target.patientName} · ${target.procedure} · ${target.facilityName}` : ""}
        size="md"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <PriorityBadge priority={target?.priority ?? "routine"} />
            <Badge variant="default" size="sm">{target?.scheduledTime}</Badge>
            {target?.modality === "laboratory" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-laboratory-rose">
                <Droplet className="h-3 w-3" /> Phlebotomy-certified staff only
              </span>
            )}
          </div>

          {reassigning && target?.assignedTech && (
            <div className="flex items-start gap-2.5 bg-warning-amber-tint border border-warning-amber/40 rounded-lg px-4 py-3">
              <UserX className="h-4 w-4 text-warning-amber-ink shrink-0 mt-0.5" />
              <p className="text-sm text-warning-amber-ink">
                <strong className="font-semibold">{target.assignedTech}</strong> will be released from this
                order. Pick a replacement below, or return it to the pending queue.
              </p>
            </div>
          )}

          {technicians.filter(t => t.online && isEligible(t, target) && !(reassigning && t.id === target?.technicianId)).map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(tech.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                selectedTech === tech.id ? "border-medical-blue bg-blue-50" : "border-outline-variant hover:border-medical-blue/50"
              }`}
            >
              <Avatar initials={tech.initials} size="sm" status="online" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">{tech.name}</p>
                <p className="text-xs text-on-surface-variant">{tech.zone} · {tech.activeOrders} active · {tech.completedToday} done today</p>
              </div>
              <span className="text-xs font-mono text-on-surface-variant shrink-0">{tech.batteryLevel}%</span>
            </button>
          ))}

          <div className={`flex items-center gap-2 pt-3 ${reassigning ? "justify-between" : "justify-end"}`}>
            {reassigning && (
              <Button variant="warning" size="md" className="gap-1.5" disabled={assigning} onClick={returnToQueue}>
                <UserX className="h-3.5 w-3.5" /> Return to Queue
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" disabled={!selectedTech || assigning} onClick={confirmAssign}>
                {assigning ? (reassigning ? "Reassigning…" : "Assigning…") : reassigning ? "Confirm Reassignment" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
