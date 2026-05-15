"use client";

import { useState } from "react";
import { OrderCard } from "@/components/domain/OrderCard";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useTechnicians } from "@/lib/hooks/useTechnicians";
import type { Order, Priority, OrderStatus } from "@/lib/utils";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";

type PriorityFilter = "all" | Priority;
type StatusFilter   = "all" | OrderStatus;

const PRIORITY_TABS: { label: string; value: PriorityFilter }[] = [
  { label: "All",     value: "all"     },
  { label: "STAT",    value: "stat"    },
  { label: "Urgent",  value: "urgent"  },
  { label: "Routine", value: "routine" },
];

export default function OrdersPage() {
  const { orders, loading, error, assignOrder } = useOrders();
  const { technicians } = useTechnicians();

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [search,         setSearch]         = useState("");
  const [assignTarget,   setAssignTarget]   = useState<Order | null>(null);
  const [selectedTech,   setSelectedTech]   = useState<string | null>(null);
  const [assigning,      setAssigning]      = useState(false);

  const filtered = orders.filter(o => {
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    if (statusFilter   !== "all" && o.status   !== statusFilter)   return false;
    if (search && !o.patientName.toLowerCase().includes(search.toLowerCase()) &&
                  !o.facilityName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const confirmAssign = async () => {
    if (!assignTarget || !selectedTech) return;
    setAssigning(true);
    const tech = technicians.find(t => t.id === selectedTech);
    if (tech) await assignOrder(assignTarget.id, tech.id, tech.name);
    setAssigning(false);
    setAssignTarget(null);
    setSelectedTech(null);
  };

  if (error) return (
    <div className="flex items-center justify-center h-40 text-emergency-red text-sm">
      Failed to load orders: {error}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or facility…"
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-outline-variant bg-white text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-medical-blue"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-on-surface-variant" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 px-3 rounded-lg border border-outline-variant bg-white text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-medical-blue"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="en-route">En Route</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      {/* Priority tabs */}
      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
        {PRIORITY_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setPriorityFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-label font-semibold uppercase tracking-wider transition-all ${
              priorityFilter === tab.value
                ? "bg-white text-on-surface shadow-card"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
            <Badge variant="default" size="sm" className="ml-1.5">
              {tab.value === "all" ? orders.length : orders.filter(o => o.priority === tab.value).length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-on-surface-variant">
        {loading
          ? <span className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Loading orders…</span>
          : `Showing ${filtered.length} of ${orders.length} orders`
        }
      </p>

      {/* Order list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-outline-variant/40 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant/40 p-12 text-center text-on-surface-variant text-sm">
            No orders match your filters.
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAssign={order.status === "pending" ? () => setAssignTarget(order) : undefined}
              className={order.priority === "stat" ? "border-l-4 border-emergency-red" : order.priority === "urgent" ? "border-l-4 border-warning-amber" : "border-l-4 border-medical-blue"}
            />
          ))
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign Technician"
        description={assignTarget ? `${assignTarget.patientName} · ${assignTarget.procedure} · ${assignTarget.facilityName}` : ""}
        size="md"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <PriorityBadge priority={assignTarget?.priority ?? "routine"} />
            <OrderStatusBadge status="pending" />
          </div>

          {technicians.map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(tech.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                selectedTech === tech.id ? "border-medical-blue bg-blue-50" : "border-outline-variant hover:border-medical-blue/50"
              }`}
            >
              <Avatar initials={tech.initials} size="sm" status={tech.online ? "online" : "offline"} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">{tech.name}</p>
                <p className="text-xs text-on-surface-variant">{tech.zone} · {tech.activeOrders} active</p>
              </div>
              <span className="text-xs font-mono text-on-surface-variant shrink-0">{tech.batteryLevel}%</span>
            </button>
          ))}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button variant="primary" disabled={!selectedTech || assigning} onClick={confirmAssign}>
              {assigning ? "Assigning…" : "Confirm Assignment"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
